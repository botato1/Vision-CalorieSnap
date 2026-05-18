namespace FoodAI.API.Models
{
    public class UserProfile
    {
        // ── DB 컬럼 매핑 ─────────────────────────────────────
        /// <summary>사용자 고유 ID (자동 증가)</summary>
        public int ProfileID { get; set; }

        /// <summary>사용자 이름</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>성별 (true: 남성, false: 여성)</summary>
        public bool Male { get; set; }

        /// <summary>키 (cm)</summary>
        public double Height { get; set; }

        /// <summary>몸무게 (kg)</summary>
        public double Weight { get; set; }

        /// <summary>생일 (nullable — 사용자가 입력 안 할 수도 있음)</summary>
        public DateTime? BirthDate { get; set; }

        /// <summary>목표 칼로리 (kcal/일)</summary>
        public double TargetCalories { get; set; } = 2000;

        /// <summary>계정 생성 일시</summary>
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // ── 계산 속성 (DB 컬럼 아님) ────────────────────────
        /// <summary>만 나이 (BirthDate로부터 계산)</summary>
        public int? Age
        {
            get
            {
                if (BirthDate is null) return null;
                var today = DateTime.Today;
                var age = today.Year - BirthDate.Value.Year;
                if (BirthDate.Value.Date > today.AddYears(-age)) age--;
                return age;
            }
        }

        /// <summary>BMI (체질량지수)</summary>
        public double BMI
        {
            get
            {
                if (Height <= 0) return 0;
                var heightM = Height / 100.0;
                return Weight / (heightM * heightM);
            }
        }

        public override string ToString() => $"{Name} ({(Male ? "남" : "여")}, {Height}cm/{Weight}kg)";
    }
}
