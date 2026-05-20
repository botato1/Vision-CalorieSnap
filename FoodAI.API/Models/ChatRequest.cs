namespace FoodAI.API.Models
{
    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;

        // 현재 섭취량
        public double CurrentCalories { get; set; }
        public double CurrentProtein { get; set; }
        public double CurrentCarbs { get; set; }
        public double CurrentFat { get; set; }

        // 목표량
        public double TargetCalories { get; set; }
        public double TargetProtein { get; set; }
        public double TargetCarbs { get; set; }
        public double TargetFat { get; set; }
    }
}