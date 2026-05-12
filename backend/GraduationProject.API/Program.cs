using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using GraduationProject.API.Data;
using GraduationProject.API.Hubs;
using GraduationProject.API.Middleware;
using GraduationProject.API.Services;
using GraduationProject.API.Interfaces;
using GraduationProject.API.Repositories;

var builder = WebApplication.CreateBuilder(args);

// ===========================
// DATABASE - PostgreSQL
// ===========================
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ===========================
// JWT AUTHENTICATION
// ===========================
var jwtKey = builder.Configuration["Jwt:Key"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrWhiteSpace(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddSignalR();

// ===========================
// SERVICES
// ===========================
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IStudentRegisterService, StudentRegisterService>();
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
builder.Services.AddHttpClient<IAiStudentRecommendationService, OpenAiStudentRecommendationService>();

// ── Courses ──────────────────────────────────────────────────────────────────
builder.Services.AddScoped<ICourseRepository, CourseRepository>();
builder.Services.AddScoped<ICourseSectionRepository, CourseSectionRepository>();
builder.Services.AddScoped<ISectionChatRepository, SectionChatRepository>();
builder.Services.AddScoped<ICourseProjectRepository, CourseProjectRepository>();
builder.Services.AddScoped<ICourseTeamRepository, CourseTeamRepository>();
builder.Services.AddScoped<ICourseTeamChatRepository, CourseTeamChatRepository>();
builder.Services.AddHttpClient<ITeamGenerationService, OpenAiTeamGenerationService>();
builder.Services.AddScoped<IConversationService, ConversationService>();
builder.Services.AddScoped<IGraduationProjectNotificationService, GraduationProjectNotificationService>();

// ===========================
// CORS
// ===========================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod();

        if (builder.Environment.IsDevelopment())
        {
            // Expo Web (any port), Expo LAN / device IPs, Vite, CRA — avoid hard-coded LAN IPs.
            policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
                if (uri.Scheme is not ("http" or "https")) return false;

                var h = uri.Host;
                if (h is "localhost" or "127.0.0.1") return true;
                if (h.StartsWith("192.168.", StringComparison.Ordinal)) return true;
                if (h.StartsWith("10.", StringComparison.Ordinal)) return true;
                if (h.StartsWith("172.", StringComparison.Ordinal))
                {
                    var parts = h.Split('.');
                    if (parts.Length == 4 && int.TryParse(parts[1], out var second) && second is >= 16 and <= 31)
                        return true;
                }

                return false;
            });
        }
        else
        {
            var prod = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                       ?? new[] { "http://localhost:3000", "http://localhost:5173", "http://localhost:8081" };
            policy.WithOrigins(prod);
        }
    });
});

// ===========================
// CONTROLLERS + SWAGGER
// ===========================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "SkillSwap API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ===========================
// BUILD
// ===========================
var app = builder.Build();

if (string.IsNullOrWhiteSpace(app.Configuration["OpenAI:ApiKey"]))
{
    var log = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("OpenAI");
    log.LogWarning("OpenAI:ApiKey is not configured. AI ranking will use fallback logic.");
}

app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SkillSwap API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseStaticFiles();
app.UseMiddleware<RoleAuthorizationMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationsHub>("/hubs/notifications");

app.Run();
