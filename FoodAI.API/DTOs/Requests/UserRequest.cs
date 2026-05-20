using System.ComponentModel.DataAnnotations;

namespace FoodAI.API.DTOs.Requests
{
    public class UpdateUserProfileRequest
    {
        
        [Range(50, 250)]
        public double Height { get; set; }

        [Range(10, 300)]
        public double Weight { get; set; }

        [Range(500, 5000)]
        public double TargetCalories { get; set; }
    }


}
