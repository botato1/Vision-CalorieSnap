using FoodAI.API.Models;

namespace FoodAI.API.DTOs.Responses;

//리스트 조회용
public class MealRecordResponse
{
    public int MealID { get; set; }

    public MealType MealType { get; set; }

    public string MealTypeName =>
        MealType.ToKorean();

    public DateTime MealDate { get; set; }

    public TimeSpan MealTime { get; set; }

    public double TotalCalories { get; set; }

    public double TotalProtein { get; set; }

    public double TotalCarb { get; set; }

    public double TotalFat { get; set; }
}