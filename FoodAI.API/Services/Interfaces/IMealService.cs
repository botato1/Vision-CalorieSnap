using FoodAI.API.DTOs.Requests;
using FoodAI.API.DTOs.Responses;

namespace FoodAI.API.Services.Interfaces;

public interface IMealService
{
    // ─────────────────────────────────────────────
    // 식사 생성
    // ─────────────────────────────────────────────
    Task<int> CreateMealAsync(
        CreateMealRecordRequest request
    );

    // ─────────────────────────────────────────────
    // 음식 추가
    // ─────────────────────────────────────────────
    Task AddFoodAsync(
        AddMealFoodRequest request
    );

    // ─────────────────────────────────────────────
    // 전체 식사 조회
    // ─────────────────────────────────────────────
    Task<List<MealRecordResponse>>
        GetMealsAsync(
            string profileId
        );

    // ─────────────────────────────────────────────
    // 날짜별 조회
    // ─────────────────────────────────────────────
    Task<List<MealRecordResponse>>
        GetMealsByDateAsync(
            string profileId,
            DateTime date
        );

    // ─────────────────────────────────────────────
    // 상세 조회
    // ─────────────────────────────────────────────
    Task<MealDetailResponse?>
        GetMealDetailAsync(
            int mealId
        );

    // ─────────────────────────────────────────────
    // 삭제
    // ─────────────────────────────────────────────
    Task DeleteMealAsync(
        int mealId
    );
}