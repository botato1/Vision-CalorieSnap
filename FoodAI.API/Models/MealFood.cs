namespace FoodAI.API.Models
{
    public class MealFood
    {
        // ── DB 컬럼 매핑 ─────────────────────────────────────
        /// <summary>음식 고유 ID (자동 증가)</summary>
        public int MealFoodID { get; set; }

        /// <summary>속한 식사 ID (외래키 → MealRecords.MealID)</summary>
        public int MealID { get; set; }

        /// <summary>음식 이름</summary>
        public string FoodName { get; set; } = string.Empty;

        /// <summary>섭취량 (g)</summary>
        public double IntakeAmount { get; set; }

        // ── 영양 정보 ────────────────────────────────────────
        /// <summary>칼로리 (kcal)</summary>
        public double Calories { get; set; }

        /// <summary>단백질 (g)</summary>
        public double Protein { get; set; }

        /// <summary>탄수화물 (g)</summary>
        public double Carbohydrate { get; set; }

        /// <summary>지방 (g)</summary>
        public double Fat { get; set; }

        /// <summary>나트륨 (mg)</summary>
        public double Sodium { get; set; }

        /// <summary>당류 (g)</summary>
        public double Sugar { get; set; }

        public override string ToString() =>
            $"{FoodName} ({IntakeAmount:F0}g · {Calories:F0}kcal)";
    }
}
