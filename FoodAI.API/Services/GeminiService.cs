using FoodAI.API.Models;
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
            Console.WriteLine(responseBody);
            var doc = JsonDocument.Parse(responseBody);

            // 에러 응답 처리 (503, 403 등)
            if (doc.RootElement.TryGetProperty("error", out var errorElement))
            {
                var errorMsg = errorElement.TryGetProperty("message", out var msg) ? msg.GetString() : "알 수 없는 오류";
                throw new Exception($"Gemini API 오류: {errorMsg}");
            }

            if (!doc.RootElement.TryGetProperty("candidates", out var candidates))
                throw new Exception("Gemini 응답에 candidates가 없습니다.");

            var result = candidates[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return result!;
        }

        // 부족한 영양소 기반으로 배달 메뉴 2개를 추천받는 메서드
        public async Task<string> RecommendMenuAsync(double remainingCalories, double remainingProtein, double remainingCarbs, double remainingFat)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

            var prompt = $@"오늘 식단에서 아래 영양소가 부족합니다.
- 칼로리: {remainingCalories:F0}kcal 부족
- 단백질: {remainingProtein:F0}g 부족
- 탄수화물: {remainingCarbs:F0}g 부족
- 지방: {remainingFat:F0}g 부족

이 영양소를 보충할 수 있는 한국 음식 메뉴 2개를 추천해줘.
아래 JSON 형식으로만 답해줘. 다른 말 하지 말고. 코드블록도 쓰지 말고.
[
  {{
    ""name"": ""메뉴 이름"",
    ""calories"": 칼로리(kcal),
    ""protein"": 단백질(g),
    ""carbs"": 탄수화물(g),
    ""fat"": 지방(g),
    ""desc"": ""추천 이유 한 문장""
  }}
]";

            var requestBody = new
            {
                contents = new[] { new { parts = new object[] { new { text = prompt } } } }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            var doc = JsonDocument.Parse(responseBody);

            if (doc.RootElement.TryGetProperty("error", out var errorElement))
            {
                var errorMsg = errorElement.TryGetProperty("message", out var msg) ? msg.GetString() : "알 수 없는 오류";
                // 실제 에러 내용을 콘솔에 출력해서 디버깅에 사용
                Console.WriteLine($"[Gemini RecommendMenu Error] {errorMsg}");
                throw new Exception($"Gemini API 오류: {errorMsg}");
            }

            if (!doc.RootElement.TryGetProperty("candidates", out var candidates))
            {
                Console.WriteLine($"[Gemini RecommendMenu] candidates 없음: {responseBody}");
                throw new Exception("Gemini 응답에 candidates가 없습니다.");
            }

            return candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString()!;
        }


        public async Task<string> ChatAsync(ChatRequest request)
        {
            var url =
                $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

            // 부족 영양소 계산
            var remainCalories = request.TargetCalories - request.CurrentCalories;
            var remainProtein = request.TargetProtein - request.CurrentProtein;
            var remainCarbs = request.TargetCarbs - request.CurrentCarbs;
            var remainFat = request.TargetFat - request.CurrentFat;

            // AI 프롬프트
            var prompt = $@"
너는 먹깨비 앱의 AI 영양 코치다.

반드시 아래 규칙을 지켜라.

[답변 규칙]
- 답변은 최대 5줄
- 짧고 핵심만 설명
- 이모지 적당히 사용
- 긴 설명 금지
- 마크다운(#, ###, ** 등) 사용 금지
- 리스트는 최대 3개
- 음식 추천은 간단하게
- 모바일 채팅처럼 답변
- 말투는 친근하게

현재 사용자 상태:
- 칼로리: {request.CurrentCalories}/{request.TargetCalories} kcal
- 단백질: {request.CurrentProtein}/{request.TargetProtein} g
- 탄수화물: {request.CurrentCarbs}/{request.TargetCarbs} g
- 지방: {request.CurrentFat}/{request.TargetFat} g

부족 영양소:
- 칼로리 {remainCalories:F0} kcal
- 단백질 {remainProtein:F0} g
- 탄수화물 {remainCarbs:F0} g
- 지방 {remainFat:F0} g

사용자 질문:
{request.Message}
";

            var requestBody = new
            {
                contents = new[]
                {
            new
            {
                parts = new object[]
                {
                    new { text = prompt }
                }
            }
        }
            };

            var json = JsonSerializer.Serialize(requestBody);

            var content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync(url, content);

            var responseBody = await response.Content.ReadAsStringAsync();

            Console.WriteLine(responseBody);

            var doc = JsonDocument.Parse(responseBody);

            // 에러 처리
            if (doc.RootElement.TryGetProperty("error", out var errorElement))
            {
                var errorMsg = errorElement.TryGetProperty("message", out var msg)
                    ? msg.GetString()
                    : "알 수 없는 오류";

                Console.WriteLine($"[Gemini Chat Error] {errorMsg}");

                return "지금 AI 서버가 많이 바빠요 😢 잠시 후 다시 시도해주세요.";
            }

            if (!doc.RootElement.TryGetProperty("candidates", out var candidates)
                || candidates.GetArrayLength() == 0)
            {
                Console.WriteLine("[Gemini Chat Error] candidates 없음");

                return "답변을 생성하지 못했어요 😢 다시 시도해주세요.";
            }

            return candidates[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString()!;

        // 음식 이름으로 AI 영양 정보 추정
        public async Task<string> GetFoodNutritionByNameAsync(string foodName)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

            var prompt = $@"음식 ""{foodName}""의 영양 정보를 알려줘.
반드시 아래 JSON 배열 형식으로만 답해. 설명이나 코드블록(```) 없이 JSON만 출력해.
[
  {{
    ""FoodName"": ""음식 이름(브랜드 포함 가능)"",
    ""Calories"": 칼로리숫자,
    ""Carbohydrate"": 탄수화물숫자,
    ""Protein"": 단백질숫자,
    ""Fat"": 지방숫자,
    ""Sodium"": 나트륨숫자,
    ""MakerName"": ""브랜드명 또는 AI추정""
  }}
]
100g 기준 또는 1인분 기준으로 실제 데이터에 최대한 가깝게 숫자만 넣어줘.";

            var requestBody = new
            {
                contents = new[] { new { parts = new object[] { new { text = prompt } } } }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            var doc = JsonDocument.Parse(responseBody);

            if (doc.RootElement.TryGetProperty("error", out var errorElement))
            {
                var errorMsg = errorElement.TryGetProperty("message", out var msg) ? msg.GetString() : "알 수 없는 오류";
                throw new Exception($"Gemini API 오류: {errorMsg}");
            }

            if (!doc.RootElement.TryGetProperty("candidates", out var candidates))
                throw new Exception("Gemini 응답에 candidates가 없습니다.");

            return candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString()!;

        }
    }
}