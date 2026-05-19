namespace FoodAI.API.DTOs.Requests;

//음식 추가용.
public class AddMealFoodRequest
{
    public int MealID { get; set; }

    public string FoodName { get; set; }
        = string.Empty;

    public double IntakeAmount { get; set; }

    public double Calories { get; set; }

    public double Protein { get; set; }

    public double Carbohydrate { get; set; }

    public double Fat { get; set; }

    public double Sodium { get; set; }

    public double Sugar { get; set; }
}