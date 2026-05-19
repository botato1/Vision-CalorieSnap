using FoodAI.API.DTOs.Requests;
using FoodAI.API.DTOs.Responses;
using FoodAI.API.Models;
using FoodAI.API.Services.Interfaces;

namespace FoodAI.API.Services;

public class MealService : IMealService
{
    // 임시 메모리 저장소
    private static readonly List<MealRecord> _meals = new();
    private static readonly List<MealFood> _foods = new();

    // 식사 생성
    public async Task<int> CreateMealAsync(
        CreateMealRecordRequest request
    )
    {
        var meal = new MealRecord
        {
            MealID = _meals.Count + 1,

            ProfileID = request.ProfileID,

            MealType = request.MealType,

            MealDate = request.MealDate,

            MealTime = request.MealTime,

            CreatedAt = DateTime.Now
        };

        _meals.Add(meal);

        return await Task.FromResult(meal.MealID);
    }


    // 음식 추가
    public async Task AddFoodAsync(
        AddMealFoodRequest request
    )
    {
        var food = new MealFood
        {
            MealFoodID = _foods.Count + 1,

            MealID = request.MealID,

            FoodName = request.FoodName,

            IntakeAmount = request.IntakeAmount,

            Calories = request.Calories,

            Protein = request.Protein,

            Carbohydrate = request.Carbohydrate,

            Fat = request.Fat,

            Sodium = request.Sodium,

            Sugar = request.Sugar
        };

        _foods.Add(food);

        await Task.CompletedTask;
    }

    // 전체 식사 조회
    public async Task<List<MealRecordResponse>>
        GetMealsAsync(int profileId)
    {
        var meals = _meals
            .Where(m => m.ProfileID == profileId)
            .ToList();

        var result = meals
            .Select(m =>
            {
                var foods = _foods
                    .Where(f => f.MealID == m.MealID)
                    .ToList();

                return new MealRecordResponse
                {
                    MealID = m.MealID,

                    MealType = m.MealType,

                    MealDate = m.MealDate,

                    MealTime = m.MealTime,

                    TotalCalories =
                        foods.Sum(f => f.Calories),

                    TotalProtein =
                        foods.Sum(f => f.Protein),

                    TotalCarb =
                        foods.Sum(f => f.Carbohydrate),

                    TotalFat =
                        foods.Sum(f => f.Fat)
                };
            })
            .ToList();

        return await Task.FromResult(result);
    }

    // 날짜별 조회
    public async Task<List<MealRecordResponse>>
        GetMealsByDateAsync(int profileId, DateTime date)
    {
        var meals = _meals
            .Where(m =>
                m.ProfileID == profileId &&
                m.MealDate.Date == date.Date)
            .ToList();

        var result = meals
            .Select(m =>
            {
                var foods = _foods
                    .Where(f => f.MealID == m.MealID)
                    .ToList();

                return new MealRecordResponse
                {
                    MealID = m.MealID,

                    MealType = m.MealType,

                    MealDate = m.MealDate,

                    MealTime = m.MealTime,

                    TotalCalories =
                        foods.Sum(f => f.Calories),

                    TotalProtein =
                        foods.Sum(f => f.Protein),

                    TotalCarb =
                        foods.Sum(f => f.Carbohydrate),

                    TotalFat =
                        foods.Sum(f => f.Fat)
                };
            })
            .ToList();

        return await Task.FromResult(result);
    }

    // 상세 조회

    public async Task<MealDetailResponse?>
        GetMealDetailAsync(int mealId)
    {
        var meal = _meals
            .FirstOrDefault(m => m.MealID == mealId);

        if (meal == null)
            return null;

        var foods = _foods
            .Where(f => f.MealID == mealId)
            .ToList();

        var response = new MealDetailResponse
        {
            MealID = meal.MealID,

            ProfileID = meal.ProfileID,

            MealType = meal.MealType,

            MealDate = meal.MealDate,

            MealTime = meal.MealTime,

            TotalCalories =
                foods.Sum(f => f.Calories),

            TotalProtein =
                foods.Sum(f => f.Protein),

            TotalCarb =
                foods.Sum(f => f.Carbohydrate),

            TotalFat =
                foods.Sum(f => f.Fat),

            Foods = foods
                .Select(f =>
                    new MealFoodResponse
                    {
                        MealFoodID = f.MealFoodID,

                        FoodName = f.FoodName,

                        IntakeAmount = f.IntakeAmount,

                        Calories = f.Calories,

                        Protein = f.Protein,

                        Carbohydrate = f.Carbohydrate,

                        Fat = f.Fat,

                        Sodium = f.Sodium,

                        Sugar = f.Sugar
                    })
                .ToList()
        };

        return await Task.FromResult(response);
    }

    // 식사 삭제

    public async Task DeleteMealAsync(
        int mealId
    )
    {
        _meals.RemoveAll(m =>
            m.MealID == mealId);

        _foods.RemoveAll(f =>
            f.MealID == mealId);

        await Task.CompletedTask;
    }
}