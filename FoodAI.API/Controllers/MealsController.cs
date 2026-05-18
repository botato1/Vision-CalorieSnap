using Microsoft.AspNetCore.Mvc;
using FoodAI.API.Services;

namespace FoodAI.API.Controllers;

[ApiController]
[Route("api/meals")]
public class MealsController : ControllerBase
{
    private readonly IOpenAiService _geminiService;

    // 생성자: GeminiService를 주입받음
    public MealsController(IOpenAiService geminiService)
    {
        _geminiService = geminiService;
    }

    // 기존 테스트 엔드포인트
    [HttpGet]
    public IActionResult Test()
    {
        return Ok(new { message = "FoodAI API 정상 동작" });
    }

    // 음식 이미지 분석 엔드포인트
    // POST /api/meals/analyze
    [HttpPost("analyze")]
    public async Task<IActionResult> AnalyzeFood(IFormFile image)
    {
        if (image == null || image.Length == 0)
            return BadRequest(new { message = "이미지를 업로드해주세요." });

        // 이미지를 base64로 변환
        using var ms = new MemoryStream();
        await image.CopyToAsync(ms);
        var base64 = Convert.ToBase64String(ms.ToArray());

        // Gemini 호출
        var result = await _geminiService.AnalyzeFoodImageAsync(base64, image.ContentType);

        return Ok(new { result });
    }
}