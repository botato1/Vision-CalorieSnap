namespace FoodAI.API.Models
{
    public class MealRecord
    {
        // ── DB 컬럼 매핑 ─────────────────────────────────────

        /// <summary>식사 고유 ID (자동 증가)</summary>
        public int MealID { get; set; }

        /// <summary>사용자 ID (외래키 → UserProfile.ProfileID)</summary>
        public string ProfileID { get; set; }
            = string.Empty;

        /// <summary>식사 종류 (DB엔 TINYINT로 저장)</summary>
        public MealType MealType { get; set; }

        /// <summary>식사 날짜</summary>
        public DateTime MealDate { get; set; }
            = DateTime.Today;

        /// <summary>기록 생성 일시</summary>
        public DateTime CreatedAt { get; set; }
            = DateTime.Now;

        // ── 합계 영양 정보 ─────────────────────────────────

        /// <summary>총 칼로리</summary>
        public double TotalCalories { get; set; }

        /// <summary>총 단백질</summary>
        public double TotalProtein { get; set; }

        /// <summary>총 탄수화물</summary>
        public double TotalCarb { get; set; }

        /// <summary>총 지방</summary>
        public double TotalFat { get; set; }

        // ── 관련 음식 목록 ─────────────────────────────────

        /// <summary>
        /// 이 식사에 포함된 음식 목록
        /// </summary>
        public List<MealFood> Foods
        {
            get;
            set;
        } = new();

        public override string ToString() =>
            $"{MealDate:yyyy-MM-dd} " +
            $"{MealType.ToKorean()} " +
            $"({TotalCalories:F0}kcal)";
    }
}