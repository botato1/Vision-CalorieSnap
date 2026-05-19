using System.ComponentModel.DataAnnotations;

namespace FoodAI.API.DTOs
{
    public class UserProfileDto
    {
        public class CreateUserProfileRequest
        {

            [Required(ErrorMessage = "이름은 필수입니다")]
            [MaxLength(50, ErrorMessage = "이름은 50자 이하여야 합니다")]
            public string Name { get; set; } = string.Empty;

            /// <summary>성별 (true: 남성, false: 여성)</summary>
            [Required]
            public bool Male { get; set; }

            /// <summary>키 (cm)</summary>
            [Required]
            [Range(50, 250, ErrorMessage = "키는 50~250cm 사이여야 합니다")]
            public double Height { get; set; }

            /// <summary>몸무게 (kg)</summary>
            [Required]
            [Range(10, 300, ErrorMessage = "몸무게는 10~300kg 사이여야 합니다")]
            public double Weight { get; set; }

            /// <summary>생년월일 (선택)</summary>
            public DateTime? BirthDate { get; set; }

            /// <summary>목표 칼로리 (kcal/일)</summary>
            [Range(500, 5000, ErrorMessage = "목표 칼로리는 500~5000kcal 사이여야 합니다")]
            public double TargetCalories { get; set; } = 2000;
        }

        public class UpdateUserProfileRequest
        {
            [Required(ErrorMessage = "이름은 필수입니다")]
            [MaxLength(50)]
            public string Name { get; set; } = string.Empty;

            [Required]
            public bool Male { get; set; }

            [Range(50, 250)]
            public double Height { get; set; }

            [Range(10, 300)]
            public double Weight { get; set; }

            public DateTime? BirthDate { get; set; }

            [Range(500, 5000)]
            public double TargetCalories { get; set; }
        }

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
}
