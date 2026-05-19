namespace FoodAI.API.Services.Interfaces
{
    // AI 이미지 분석 서비스의 인터페이스 (설계도)

    public interface IOpenAiService
    {
        // 음식 이미지를 base64로 받아서 분석 결과 문자열을 반환하는 메서드

        Task<string> AnalyzeFoodImageAsync(string base64Image, string mimeType);
    }
}
