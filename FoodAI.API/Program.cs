using FoodAI.API.Services;
using FoodAI.API.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Controller 등록
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowReact",
        policy =>
        {
            policy
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowAnyOrigin();
        });
});

// DI 등록
builder.Services.AddScoped<
    IMealService,
    MealService>();

builder.Services.AddScoped<
    IOpenAiService,
    GeminiService>();

var app = builder.Build();

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseCors("AllowReact");

app.UseAuthorization();

app.MapControllers();

app.Run();