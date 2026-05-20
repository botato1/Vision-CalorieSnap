namespace FoodAI.API.DTOs.Requests
{
    public class AnalyzeFoodRequest
    {
        public string ImageBase64 { get; set; } = string.Empty;
    }

    // GEMINI - 부족한 영양소 기반 메뉴 추천 요청
    public class RecommendRequest
    {
        public double RemainingCalories { get; set; }
        public double RemainingProtein { get; set; }
        public double RemainingCarbs { get; set; }
        public double RemainingFat { get; set; }
    }

    // 식사 생성 요청
    public class CreateMealRecordRequest
    {
        public string ProfileId { get; set; } = string.Empty;
        public string MealType { get; set; } = string.Empty;
        public DateTime MealDate { get; set; }
    }

    // 음식 직접 추가 요청
    public class AddMealFoodRequest
    {
        public int MealId { get; set; }
        public string FoodName { get; set; } = string.Empty;
        public double Calories { get; set; }
        public double Carbohydrate { get; set; }
        public double Protein { get; set; }
        public double Fat { get; set; }
        public double Sodium { get; set; }
        public double Grams { get; set; }
    }

    // 음식 검색 요청
    public class SearchFoodRequest
    {
        public string FoodName { get; set; } = string.Empty;
    }

}
