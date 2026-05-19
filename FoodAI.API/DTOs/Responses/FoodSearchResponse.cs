namespace FoodAI.API.DTOs.Responses;

public class FoodSearchResponse
{
    public string FoodName { get; set; }
        = string.Empty;

    public double Calories { get; set; }

    public double Protein { get; set; }

    public double Carbohydrate { get; set; }

    public double Fat { get; set; }

    public double Sodium { get; set; }

    public double Sugar { get; set; }
}