using System.Text;
using System.Text.Json;

namespace FoodAI.API.Services
{
    public class GeminiService : IOpenAiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GeminiService(IConfiguration configuration)
        {
            _httpClient = new HttpClient();
            _apiKey = configuration["GeminiApiKey"]!;
        }

        public async Task<string> AnalyzeFoodImageAsync(string base64Image, string mimeType)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new object[]
                        {
                            new { inlineData = new { mimeType, data = base64Image } },
                            new { text = @"이 음식 사진을 분석해서 아래 JSON 형식으로만 답해줘. 음식이 여러 개면 배열로 줘.
{
  ""foods"": [
    {
      ""name"": ""음식 이름"",
      ""calories"": 칼로리(kcal),
      ""protein"": 단백질(g),
      ""carbs"": 탄수화물(g),
      ""fat"": 지방(g),
      ""serving_size"": ""1인분 기준 용량""
    }
  ]
}
JSON만 답해줘, 다른 말 하지 말고. 코드블록도 쓰지 말고." }
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            // Gemini 응답에서 텍스트 부분만 추출
            var doc = JsonDocument.Parse(responseBody);
            var result = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return result!;
        }
    }
}