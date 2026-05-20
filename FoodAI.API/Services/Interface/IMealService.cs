using FoodAI.API.DTOs.Requests;

namespace FoodAI.API.Services
{
    public interface IMealService
    {
        Task<int> CreateMealAsync(CreateMealRecordRequest request);
        Task AddFoodAsync(AddMealFoodRequest request);
        Task<object> GetMealsAsync(string profileId);
        Task<object> GetMealsByDateAsync(string profileId, DateTime date);
        Task<object?> GetMealDetailAsync(int mealId);
        Task DeleteMealAsync(int mealId);
    }
}
