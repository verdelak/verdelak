using Verdelak.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.IdentityModel.Tokens;
using Verdelak.Api.Controllers;
using Verdelak.Api.Services;
using System.Text;
using Microsoft.Extensions.Primitives;
using Backup.Api.Controllers;

var builder = WebApplication.CreateBuilder(args);
var configuredCorsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? [];
var allowedCorsOrigins = configuredCorsOrigins.Length > 0
    ? configuredCorsOrigins
    : [
        "http://localhost:4200",
        "http://localhost:4201",
        "http://127.0.0.1:4200",
        "http://127.0.0.1:4201",
        "http://[::1]:4200",
        "http://[::1]:4201"
    ];

ValidateCorsOrigins(builder.Environment, configuredCorsOrigins);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpLogging(options =>
{
    options.LoggingFields = HttpLoggingFields.RequestMethod
        | HttpLoggingFields.RequestPath
        | HttpLoggingFields.ResponseStatusCode;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        policy => policy.WithOrigins(allowedCorsOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod());
});
builder.Services.AddDbContext<VerdelakDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddSingleton<IGuitarTheoryService, GuitarTheoryService>();
builder.Services.AddHttpClient<IOpenLibraryLookupService, OpenLibraryLookupService>(client =>
{
    client.BaseAddress = new Uri("https://openlibrary.org/");
});
builder.Services.AddHttpClient<IGoogleBooksLookupService, GoogleBooksLookupService>(client =>
{
    client.BaseAddress = new Uri("https://www.googleapis.com/");
});
builder.Services.AddHttpClient<ICrossrefLookupService, CrossrefLookupService>(client =>
{
    client.BaseAddress = new Uri("https://api.crossref.org/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd(
        builder.Configuration["Crossref:UserAgent"] ?? "Verdelak.Api/0.1 ( local-development )");
});
builder.Services.AddHttpClient<IMusicBrainzLookupService, MusicBrainzLookupService>(client =>
{
    client.BaseAddress = new Uri("https://musicbrainz.org/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd(
        builder.Configuration["MusicBrainz:UserAgent"] ?? "Verdelak.Api/0.1 ( local-development )");
});
builder.Services.AddHttpClient<IUpcItemDbLookupService, UpcItemDbLookupService>(client =>
{
    client.BaseAddress = new Uri("https://api.upcitemdb.com/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd(
        builder.Configuration["UPCitemdb:UserAgent"] ?? "Verdelak.Api/0.1 ( local-development )");
});
builder.Services.AddHttpClient<ISteamLibraryImportService, SteamLibraryImportService>(client =>
{
    client.BaseAddress = new Uri("https://api.steampowered.com/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd(
        builder.Configuration["Steam:UserAgent"] ?? "Verdelak.Api/0.1 ( local-development )");
});
builder.Services.AddHttpClient<IBoardGameGeekImportService, BoardGameGeekImportService>(client =>
{
    client.BaseAddress = new Uri("https://boardgamegeek.com/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd(
        builder.Configuration["BoardGameGeek:UserAgent"] ?? "Verdelak.Api/0.1 ( local-development )");
});

builder.Services.AddHttpClient<IOpenFoodFactsLookupService, OpenFoodFactsLookupService>(client =>
{
    client.BaseAddress = new Uri("https://world.openfoodfacts.org/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd(
        builder.Configuration["OpenFoodFacts:UserAgent"] ?? "Verdelak.Api/0.1 ( local-development )");
});
builder.Services.AddHttpClient<IDiscogsLookupService, DiscogsLookupService>(client =>
{
    client.BaseAddress = new Uri("https://api.discogs.com/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd(
        builder.Configuration["Discogs:UserAgent"] ?? "Verdelak.Api/0.1 ( local-development )");
});
builder.Services.AddHttpClient<IMetalArchivesLookupService, MetalArchivesLookupService>(client =>
{
    client.BaseAddress = new Uri("https://www.metal-archives.com/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd(
        builder.Configuration["MetalArchives:UserAgent"] ?? "Mozilla/5.0 Verdelak.Api/0.1 (local music gap finder)");
    client.DefaultRequestHeaders.Accept.ParseAdd("application/json, text/javascript, */*; q=0.01");
    client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");
    client.DefaultRequestHeaders.Referrer = new Uri("https://www.metal-archives.com/search");
});
builder.Services.AddHttpClient<IWikidataLookupService, WikidataLookupService>(client =>
{
    client.BaseAddress = new Uri("https://query.wikidata.org/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd(
        builder.Configuration["Wikidata:UserAgent"] ?? "Verdelak.Api/0.1 ( local-development )");
});
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.WriteIndented = true;
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtKey = builder.Configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException("Jwt:Key is required. Configure it with user secrets, appsettings.Development.json, or Azure App Service configuration.");
        }

        var jwtIssuer = builder.Configuration["Jwt:Issuer"];
        var jwtAudience = builder.Configuration["Jwt:Audience"];
        var validateIssuer = builder.Configuration.GetValue("Jwt:ValidateIssuer", !builder.Environment.IsDevelopment());
        var validateAudience = builder.Configuration.GetValue("Jwt:ValidateAudience", !builder.Environment.IsDevelopment());

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = validateIssuer,
            ValidateAudience = validateAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = System.Security.Claims.ClaimTypes.Name,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            )
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});
builder.Services.AddHostedService<BackgroundSchedulerService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Verdelak.Api v1");
    });
}
else
{
    app.UseExceptionHandler(exceptionApp =>
    {
        exceptionApp.Run(async context =>
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await Results.Problem(
                title: "An unexpected error occurred.",
                statusCode: StatusCodes.Status500InternalServerError
            ).ExecuteAsync(context);
        });
    });
}

app.Logger.LogInformation(
    "Verdelak.Api starting in {EnvironmentName}. Allowed CORS origins: {AllowedOrigins}",
    app.Environment.EnvironmentName,
    string.Join(", ", allowedCorsOrigins));

app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers.TryGetValue("X-Correlation-ID", out var incomingCorrelationId)
        && !StringValues.IsNullOrEmpty(incomingCorrelationId)
            ? incomingCorrelationId.ToString()
            : context.TraceIdentifier;

    context.Response.Headers["X-Correlation-ID"] = correlationId;

    using var scope = app.Logger.BeginScope(new Dictionary<string, object>
    {
        ["CorrelationId"] = correlationId
    });

    await next();
});

app.UseHttpLogging();
app.UseCors("AllowAngularApp");

app.MapGet("/api", () => Results.Ok(new
{
    ok = true,
    message = "API up",
    endpoints = new[] {
    "/api/artists",
    "/api/artists/summary",
    "/api/artists/full",
    "/api/artists/catalog",
    "/api/MusicAlbums/{id}",
    "/api/Reviews/album/{albumId}",
    "/swagger"
  }
}));

app.MapGet("/api/health", async (VerdelakDbContext dbContext) =>
{
    var databaseReachable = await dbContext.Database.CanConnectAsync();

    var payload = new
    {
        ok = databaseReachable,
        service = "Verdelak.Api",
        database = databaseReachable ? "reachable" : "unreachable",
        checkedAtUtc = DateTimeOffset.UtcNow
    };

    return databaseReachable
        ? Results.Ok(payload)
        : Results.Json(payload, statusCode: StatusCodes.Status503ServiceUnavailable);
}).AllowAnonymous();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static void ValidateCorsOrigins(IHostEnvironment environment, string[] configuredOrigins)
{
    if (environment.IsDevelopment())
    {
        return;
    }

    if (configuredOrigins.Length == 0)
    {
        throw new InvalidOperationException("Cors:AllowedOrigins is required outside development.");
    }

    var invalidOrigins = configuredOrigins
        .Where(origin =>
            string.IsNullOrWhiteSpace(origin)
            || origin.Contains('*')
            || origin.Contains("localhost", StringComparison.OrdinalIgnoreCase)
            || origin.Contains("127.0.0.1", StringComparison.OrdinalIgnoreCase)
            || origin.Contains("your-verdelak-angular-site.example", StringComparison.OrdinalIgnoreCase))
        .ToArray();

    if (invalidOrigins.Length > 0)
    {
        throw new InvalidOperationException(
            $"Cors:AllowedOrigins contains non-production placeholders or local origins: {string.Join(", ", invalidOrigins)}");
    }
}


