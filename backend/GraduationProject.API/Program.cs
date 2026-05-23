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

// OpenAI: environment variable overrides appsettings / user secrets (highest priority).
ApplyOpenAiApiKeyFromEnvironment(builder.Configuration);

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
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<ICompanyTalentMatchService, CompanyTalentMatchService>();
builder.Services.AddScoped<IStudentRegisterService, StudentRegisterService>();
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
builder.Services.AddHttpClient<IAiStudentRecommendationService, OpenAiStudentRecommendationService>();
builder.Services.AddHttpClient<IRecruitmentApplicantAnalysisService, OpenAiRecruitmentApplicantAnalysisService>();
builder.Services.AddScoped<IRecruitmentApplicationWorkflowService, RecruitmentApplicationWorkflowService>();
builder.Services.AddScoped<IOrganizationMembershipService, OrganizationMembershipService>();
builder.Services.AddHttpClient<ICompanyAnalysisService, OpenAiCompanyAnalysisService>();
builder.Services.AddHttpClient("CompanyWebFetch", client =>
{
    client.Timeout = TimeSpan.FromSeconds(20);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("SkillSwap-Bot/1.0 (+https://skillswap.local)");
});

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
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:8081",
                "http://192.168.1.107:8081",
                // Expo (web) default dev server — mobile app in browser calls API from this origin
                "http://localhost:8081",
                "http://127.0.0.1:8081"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
  
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

LogOpenAiConfigurationAtStartup(app);

static void ApplyOpenAiApiKeyFromEnvironment(IConfigurationBuilder configurationBuilder)
{
    var envKey = Environment.GetEnvironmentVariable("OpenAI__ApiKey");
    if (string.IsNullOrWhiteSpace(envKey))
        return;

    configurationBuilder.AddInMemoryCollection(new Dictionary<string, string?>
    {
        ["OpenAI:ApiKey"] = envKey.Trim(),
    }!);
}

static void LogOpenAiConfigurationAtStartup(WebApplication app)
{
    var log = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("OpenAI");
    var fromEnv = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("OpenAI__ApiKey"));

    if (fromEnv)
    {
        log.LogInformation("OpenAI key loaded from environment variables");
    }
    else if (!string.IsNullOrWhiteSpace(app.Configuration["OpenAI:ApiKey"]))
    {
        log.LogInformation("OpenAI key loaded from configuration files");
    }
    else
    {
        log.LogWarning("OpenAI:ApiKey is not configured. AI features will be unavailable.");
    }
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
