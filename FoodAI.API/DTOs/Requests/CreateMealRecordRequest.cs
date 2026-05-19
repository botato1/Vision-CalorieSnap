using FoodAI.API.Models;

namespace FoodAI.API.DTOs.Requests;

public class CreateMealRecordRequest
{
    public string ProfileID { get; set; }
        = string.Empty;

    public MealType MealType { get; set; }

    public DateTime MealDate { get; set; }
}