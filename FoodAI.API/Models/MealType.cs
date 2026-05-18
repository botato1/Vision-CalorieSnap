namespace FoodAI.API.Models
{
    public enum MealType : byte
    {
        Breakfast = 0,  // 아침
        Lunch = 1,  // 점심
        Dinner = 2,  // 저녁
        Snack = 3   // 간식
    }

    public static class MealTypeExtensions
    {
        public static string ToKorean(this MealType type) => type switch
        {
            MealType.Breakfast => "아침",
            MealType.Lunch => "점심",
            MealType.Dinner => "저녁",
            MealType.Snack => "간식",
            _ => "기타"
        };
    }
}
