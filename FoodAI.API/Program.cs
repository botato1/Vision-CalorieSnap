using FoodAI.API.Infrastructure;
using FoodAI.API.Services;
using FoodAI.API.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

builder.Services.AddSingleton<DatabaseContext>();

builder.Services.AddHttpClient();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOpenAiService, GeminiService>();
builder.Services.AddScoped<IMealService, MealService>();
builder.Services.AddScoped<IFoodNutritionService, FoodNutritionService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "FoodAI API",
        Version = "v1",
        Description = "AI 기반 음식 칼로리 분석 API"
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact",
        policy =>
        {
            policy
                .AllowAnyHeader()
                .AllowAnyMethod()
                .WithOrigins(
                 "http://localhost:5173",
                 "http://127.0.0.1:5173",
                 "http://localhost:3000"   // CRA (Create React App)
                 );
        });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "FoodAI API v1");
        c.RoutePrefix = string.Empty; // 루트 URL(/)에서 Swagger 바로 열림
    });
}

    // app.UseHttpsRedirection();

    app.UseCors("AllowReact");

app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DatabaseContext>();
    var connected = await db.TestConnectionAsync();

    if (connected)
        Console.WriteLine("✓ DB 연결 성공");
    else
        Console.WriteLine("✗ DB 연결 실패 — appsettings.Local.json 연결 문자열을 확인하세요");
}

app.Run();
