using System.Collections.Concurrent;
using System.Text.Json;

using FoodAI.API.DTOs.Responses;

namespace FoodAI.API.Services;

//여기가 수정임!!
public class FoodNutritionService
    : IFoodNutritionService
{
    private static readonly ConcurrentDictionary<string, (DateTime CachedAt, List<FoodSearchResponse> Results)>
        SearchCache = new();

    private static readonly List<FoodSearchResponse> FallbackFoods =
    [
        new() { FoodName = "닭가슴살", Calories = 165, Carbohydrate = 0, Protein = 31, Fat = 3, Sodium = 150, MakerName = "기본 데이터" },
        new() { FoodName = "후라이드 치킨", Calories = 650, Carbohydrate = 25, Protein = 45, Fat = 35, Sodium = 850, MakerName = "기본 데이터" },
        new() { FoodName = "마라탕", Calories = 620, Carbohydrate = 68, Protein = 28, Fat = 22, Sodium = 2500, MakerName = "기본 데이터" },
        new() { FoodName = "김치찌개", Calories = 280, Carbohydrate = 12, Protein = 18, Fat = 12, Sodium = 1200, MakerName = "기본 데이터" },
        new() { FoodName = "제육볶음", Calories = 480, Carbohydrate = 22, Protein = 34, Fat = 20, Sodium = 890, MakerName = "기본 데이터" },
        new() { FoodName = "현미밥", Calories = 210, Carbohydrate = 44, Protein = 5, Fat = 2, Sodium = 10, MakerName = "기본 데이터" },
        new() { FoodName = "떡볶이", Calories = 380, Carbohydrate = 72, Protein = 8, Fat = 6, Sodium = 1100, MakerName = "기본 데이터" },
        new() { FoodName = "연어 샐러드", Calories = 320, Carbohydrate = 18, Protein = 32, Fat = 14, Sodium = 320, MakerName = "기본 데이터" }
    ];

    private readonly HttpClient _httpClient;

    private readonly IConfiguration _config;

    public FoodNutritionService(
        HttpClient httpClient,
        IConfiguration config
    )
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(8);

        _config = config;
    }

    public async Task<List<FoodSearchResponse>>
        SearchFoodAsync(
            string foodName
        )
    {
        foodName = foodName.Trim();
        if (string.IsNullOrWhiteSpace(foodName))
            return new List<FoodSearchResponse>();

        if (SearchCache.TryGetValue(foodName, out var cached) &&
            DateTime.UtcNow - cached.CachedAt < TimeSpan.FromMinutes(10))
        {
            return cached.Results;
        }

        // ※ Fallback을 API 이전에 반환하지 않음 → 실제 API를 항상 먼저 시도

        var serviceKey =
            _config["FoodApi:ServiceKey"];

        var encodedFoodName =
            Uri.EscapeDataString(foodName);

        var url =
            $"https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02" +
            $"?serviceKey={serviceKey}" +
            $"&type=json" +
            $"&FOOD_NM_KR={encodedFoodName}" +
            $"&pageNo=1" +
            $"&numOfRows=100";

        HttpResponseMessage response;

        try
        {
            response = await _httpClient.GetAsync(url);
        }
        catch
        {
            return new List<FoodSearchResponse>();
        }

        if (!response.IsSuccessStatusCode)
            return new List<FoodSearchResponse>();

        var json =
            await response.Content
                .ReadAsStringAsync();

        using var doc =
            JsonDocument.Parse(json);

        if (!doc.RootElement.TryGetProperty("body", out var body) ||
            !body.TryGetProperty("items", out var items))
            return FallbackSearch(foodName);

        // ── Bug Fix 1: items가 빈 문자열("")일 때 EnumerateArray()가 예외를 throw함 ──
        // 결과 없음 → 빈 배열이 아닌 "" 반환하는 공공 API 특성 대응
        if (items.ValueKind != JsonValueKind.Array)
            return FallbackSearch(foodName);

        var results = new List<FoodSearchResponse>();

        foreach (var item in items.EnumerateArray())
        {
            results.Add(new FoodSearchResponse
            {
                FoodName =
                    item.GetProperty("FOOD_NM_KR").GetString() ?? "",

                Calories     = ParseDouble(item, "AMT_NUM1"),  // 에너지(kcal)
                Protein      = ParseDouble(item, "AMT_NUM3"),  // 단백질(g)
                Fat          = ParseDouble(item, "AMT_NUM4"),  // 지방(g)
                Carbohydrate = ParseDouble(item, "AMT_NUM6"),  // 탄수화물(g)
                Sodium       = ParseDouble(item, "AMT_NUM14"), // 나트륨(mg)
                Sugar        = ParseDouble(item, "AMT_NUM7"),  // 당류(g)

                MakerName =
                    item.TryGetProperty("MAKER_NM", out var maker)
                        ? maker.GetString() ?? ""
                        : ""
            });
        }

        // ── Bug Fix 3: API가 이미 foodName으로 검색한 결과를 재필터링하지 않음 ──
        // 기존 Contains 재필터가 유효한 결과(뿌링클 등)를 제거하던 문제 해결
        var finalResults = results.Take(20).ToList();

        if (finalResults.Count == 0)
            finalResults = FallbackSearch(foodName);

        SearchCache[foodName] = (DateTime.UtcNow, finalResults);
        return finalResults;
    }

    // 공공 API 실패 시 내장 데이터에서 검색
    private List<FoodSearchResponse> FallbackSearch(string foodName) =>
        FallbackFoods
            .Where(f => f.FoodName.Contains(foodName, StringComparison.OrdinalIgnoreCase))
            .Take(20)
            .ToList();

    // ── Bug Fix 2: 숫자형 JSON 값도 처리 (기존엔 string만 처리 → 숫자면 0 반환) ──
    private static double ParseDouble(
        JsonElement item,
        string propertyName
    )
    {
        if (!item.TryGetProperty(propertyName, out var value))
            return 0;

        // 공공 API 응답이 숫자형일 때
        if (value.ValueKind == JsonValueKind.Number)
            return value.TryGetDouble(out var num) ? num : 0;

        // 문자열형 ("259.00" 등) — InvariantCulture로 소수점 파싱 보장
        return double.TryParse(
            value.GetString(),
            System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture,
            out var result) ? result : 0;
    }
}
