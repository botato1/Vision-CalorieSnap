using FoodAI.API.DTOs.Responses;

namespace FoodAI.API.Services.Interfaces;

public interface IFoodNutritionService
{
    Task<List<FoodSearchResponse>>
        SearchFoodAsync(string foodName);
}