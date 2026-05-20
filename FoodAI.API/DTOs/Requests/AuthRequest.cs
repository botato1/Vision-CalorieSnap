using System.ComponentModel.DataAnnotations;

namespace FoodAI.API.DTOs.Requests
{
    public class CreateUserProfileRequest
    {
        [Required, MaxLength(50)]
        public string ProfileID { get; set; } = string.Empty;

        [Required, MinLength(4, ErrorMessage = "비밀번호는 4자 이상이어야 합니다")]
        [MaxLength(50)]
        public string ProfilePW { get; set; } = string.Empty;

        [Required, MaxLength(50)]
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
    public class LoginUserRequest
    {
        public string ProfileID { get; set; } = string.Empty;
        public string ProfilePW { get; set; } = string.Empty;
    }

    // 로그인 요청 데이터
    public class LoginRequest
    {
        public string ProfileID { get; set; } = string.Empty;
        public string ProfilePW { get; set; } = string.Empty;
    }
}
    
