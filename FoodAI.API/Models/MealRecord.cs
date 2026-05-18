namespace FoodAI.API.Models
{
    public class MealRecord
    {
        // ── DB 컬럼 매핑 ─────────────────────────────────────
        /// <summary>식사 고유 ID (자동 증가)</summary>
        public int MealID { get; set; }

        /// <summary>사용자 ID (외래키 → UserProfile.ProfileID)</summary>
        public int ProfileID { get; set; }

        /// <summary>식사 종류 (DB엔 TINYINT로 저장)</summary>
        public MealType MealType { get; set; }

        /// <summary>식사 날짜 (시간 제외)</summary>
        public DateTime MealDate { get; set; } = DateTime.Today;

        /// <summary>식사 시간 (시:분:초)</summary>
        public TimeSpan MealTime { get; set; } = DateTime.Now.TimeOfDay;

        /// <summary>기록 생성 일시</summary>
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // ── 합계 영양 정보 (View에서 SUM 계산된 값) ─────────
        // vw_MealTotals 뷰를 조회할 때 채워지는 속성
        // 일반 MealRecords 테이블 조회 시에는 0
        public double TotalCalories { get; set; }
        public double TotalProtein { get; set; }
        public double TotalCarb { get; set; }
        public double TotalFat { get; set; }

        // ── 관련 음식 목록 (Code-level navigation) ──────────
        /// <summary>이 식사에 포함된 음식들 — Repository에서 채움</summary>
        public List<MealFood> Foods { get; set; } = new();

        public override string ToString() =>
            $"{MealDate:yyyy-MM-dd} {MealType.ToKorean()} ({TotalCalories:F0}kcal)";
    }
}
