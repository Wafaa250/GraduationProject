using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using GraduationProject.API.Data;
using GraduationProject.API.Middleware;
using GraduationProject.API.Services;

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
    });

builder.Services.AddAuthorization();

// ===========================
// SERVICES
// ===========================
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IStudentRegisterService, StudentRegisterService>();
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
builder.Services.AddHttpClient<IAiStudentRecommendationService, OpenAiStudentRecommendationService>();

// ===========================
// CORS - ✅ مرة وحدة بس
// ===========================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173"
              )
              .AllowAnyHeader()
              .AllowAnyMethod());
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

// OpenAI: read from appsettings*, user secrets, or environment (e.g. OpenAI__ApiKey → OpenAI:ApiKey).
if (string.IsNullOrWhiteSpace(app.Configuration["OpenAI:ApiKey"]))
{
    var log = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("OpenAI");
    log.LogWarning(
        "OpenAI:ApiKey is not configured. Set it in appsettings.Development.json, user secrets, or environment variable OpenAI__ApiKey. AI ranking will use fallback logic.");
}

// ✅ CORS أول شي
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

// ✅ Middleware مسجل هون
app.UseMiddleware<RoleAuthorizationMiddleware>();

app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();
app.MapControllers();

app.Run();