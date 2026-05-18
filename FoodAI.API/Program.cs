var builder = WebApplication.CreateBuilder(args);

// Controller 등록
builder.Services.AddControllers();

// Swagger 등록
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// React 연결용 CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact",
        policy =>
        {
            policy
                .AllowAnyHeader()
                .AllowAnyMethod()
                .WithOrigins("http://localhost:5173");
        });
});

var app = builder.Build();

// Swagger 활성화
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// CORS 사용
app.UseCors("AllowReact");

app.UseAuthorization();

app.MapControllers();

app.Run();