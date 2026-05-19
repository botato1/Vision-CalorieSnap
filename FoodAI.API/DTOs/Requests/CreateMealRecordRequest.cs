using FoodAI.API.Models;

namespace FoodAI.API.DTOs.Requests;

//식사 생성용.
public class CreateMealRecordRequest
{
    public int ProfileID { get; set; }

    public MealType MealType { get; set; }

    public DateTime MealDate { get; set; }

    public TimeSpan MealTime { get; set; }
}