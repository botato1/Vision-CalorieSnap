using FoodAI.API.DTOs.Responses;

namespace FoodAI.API.Services
{
    public interface IFoodNutritionService
    {
        Task<List<FoodSearchResponse>> SearchFoodAsync(string foodName);
    }
}
