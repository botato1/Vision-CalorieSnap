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

        var fallbackMatches =
            FallbackFoods
                .Where(food => food.FoodName.Contains(foodName, StringComparison.OrdinalIgnoreCase))
                .Take(20)
                .ToList();

        if (fallbackMatches.Count > 0)
        {
            SearchCache[foodName] = (DateTime.UtcNow, fallbackMatches);
            return fallbackMatches;
        }

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
            return new List<FoodSearchResponse>();

        var results =
            new List<FoodSearchResponse>();

        foreach (var item in items.EnumerateArray())
        {
            results.Add(
                new FoodSearchResponse
                {
                    FoodName =
                        item.GetProperty("FOOD_NM_KR")
                            .GetString() ?? "",

                    Calories =
                        ParseDouble(item, "AMT_NUM1"),

                    Protein =
                        ParseDouble(item, "AMT_NUM3"),

                    Fat =
                        ParseDouble(item, "AMT_NUM4"),

                    Carbohydrate =
                        ParseDouble(item, "AMT_NUM7"),

                    Sodium =
                        ParseDouble(item, "AMT_NUM14"),

                    Sugar =
                        ParseDouble(item, "AMT_NUM8"),

                    MakerName =
                        item.TryGetProperty("MAKER_NM", out var maker)
                            ? maker.GetString() ?? ""
                            : ""
                });
        }

        var filtered =
            results
                .Where(food =>
                    food.FoodName.Contains(foodName, StringComparison.OrdinalIgnoreCase) ||
                    food.MakerName.Contains(foodName, StringComparison.OrdinalIgnoreCase))
                .Take(20)
                .ToList();

        results = filtered.Count > 0
            ? filtered
            : FallbackFoods
                .Where(food => food.FoodName.Contains(foodName, StringComparison.OrdinalIgnoreCase))
                .Take(20)
                .ToList();

        SearchCache[foodName] = (DateTime.UtcNow, results);
        return results;
    }

    private static double ParseDouble(
        JsonElement item,
        string propertyName
    )
    {
        if (!item.TryGetProperty(
            propertyName,
            out var value))
        {
            return 0;
        }

        return double.TryParse(
            value.GetString(),
            out var result)
            ? result
            : 0;
    }
}
