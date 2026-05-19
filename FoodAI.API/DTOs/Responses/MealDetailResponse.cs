using FoodAI.API.Models;

namespace FoodAI.API.DTOs.Responses;

//상세 조회용
public class MealDetailResponse
{
    public int MealID { get; set; }

    public string ProfileID { get; set; } = string.Empty;

    public MealType MealType { get; set; }

    public string MealTypeName =>
        MealType.ToKorean();

    public DateTime MealDate { get; set; }

    public TimeSpan MealTime { get; set; }

    public double TotalCalories { get; set; }

    public double TotalProtein { get; set; }

    public double TotalCarb { get; set; }

    public double TotalFat { get; set; }

    public List<MealFoodResponse> Foods { get; set; }
        = new();
}