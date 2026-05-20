using FoodAI.API.DTOs.Requests;

namespace FoodAI.API.Services
{
    public class MealService : IMealService
    {
        public Task<int> CreateMealAsync(CreateMealRecordRequest request) => Task.FromResult(0);
        public Task AddFoodAsync(AddMealFoodRequest request) => Task.CompletedTask;
        public Task<object> GetMealsAsync(string profileId) => Task.FromResult<object>(new List<object>());
        public Task<object> GetMealsByDateAsync(string profileId, DateTime date) => Task.FromResult<object>(new List<object>());
        public Task<object?> GetMealDetailAsync(int mealId) => Task.FromResult<object?>(null);
        public Task DeleteMealAsync(int mealId) => Task.CompletedTask;
    }
}
