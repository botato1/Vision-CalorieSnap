namespace FoodAI.API.Services
{
    // AI 이미지 분석 서비스의 인터페이스 (설계도)

    public interface IOpenAiService
    {
        // 음식 이미지를 base64로 받아서 분석 결과 문자열을 반환하는 메서드

        Task<string> AnalyzeFoodImageAsync(string base64Image, string mimeType);

        // 부족한 영양소 정보를 받아서 배달 메뉴 추천 JSON을 반환하는 메서드
        Task<string> RecommendMenuAsync(double remainingCalories, double remainingProtein, double remainingCarbs, double remainingFat);

        // 음식 이름으로 AI가 영양 정보를 추정해 반환하는 메서드
        Task<string> GetFoodNutritionByNameAsync(string foodName);
    }
}
