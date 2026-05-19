namespace FoodAI.API.DTOs.Responses
{
    public class UserProfileResponse
    {
        public string ProfileID { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;
        public bool Male { get; set; }
        public double Height { get; set; }
        public double Weight { get; set; }
        public double TargetCalories { get; set; }

        public int? Age { get; set; }

        public double BMI { get; set; }

        public string BMIStatus { get; set; } = string.Empty;
    }

    
}
