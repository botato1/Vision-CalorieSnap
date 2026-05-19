using System.Text.Json;

using FoodAI.API.DTOs.Responses;
using FoodAI.API.Services.Interfaces;

namespace FoodAI.API.Services;

public class FoodNutritionService
    : IFoodNutritionService
{
    private readonly HttpClient _httpClient;

    private readonly IConfiguration _config;

    public FoodNutritionService(
        HttpClient httpClient,
        IConfiguration config
    )
    {
        _httpClient = httpClient;

        _config = config;
    }

    public async Task<List<FoodSearchResponse>>
        SearchFoodAsync(
            string foodName
        )
    {
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
            $"&numOfRows=10";

        var response =
            await _httpClient.GetAsync(url);

        response.EnsureSuccessStatusCode();

        var json =
            await response.Content
                .ReadAsStringAsync();

        using var doc =
            JsonDocument.Parse(json);

        // ─────────────────────────────────────────────
        // items 배열 가져오기
        // ─────────────────────────────────────────────

        var items =
            doc.RootElement
                .GetProperty("body")
                .GetProperty("items");

        var results =
            new List<FoodSearchResponse>();

        // ─────────────────────────────────────────────
        // 전체 결과 파싱
        // ─────────────────────────────────────────────

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
                        ParseDouble(item, "AMT_NUM8")
                });
        }

        return results;
    }

    // ─────────────────────────────────────────────
    // 숫자 파싱 유틸
    // ─────────────────────────────────────────────

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