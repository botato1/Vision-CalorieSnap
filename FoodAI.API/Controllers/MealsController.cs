using FoodAI.API.DTOs.Requests;
using FoodAI.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FoodAI.API.Controllers;

[ApiController]
[Route("api/meals")]
public class MealsController : ControllerBase
{
    private readonly IOpenAiService _geminiService;

    private readonly IMealService _mealService;

    // 생성자 DI
    public MealsController(
        IOpenAiService geminiService,
        IMealService mealService
    )
    {
        _geminiService = geminiService;

        _mealService = mealService;
    }

    // 테스트
    [HttpGet]
    public IActionResult Test()
    {
        return Ok(new
        {
            message = "FoodAI API 정상 동작"
        });
    }

    // 음식 이미지 분석
    [HttpPost("analyze")]
    public async Task<IActionResult> AnalyzeFood(
        IFormFile image
    )
    {
        if (image == null || image.Length == 0)
        {
            return BadRequest(new
            {
                message = "이미지를 업로드해주세요."
            });
        }

        // 이미지를 base64로 변환
        using var ms = new MemoryStream();

        await image.CopyToAsync(ms);

        var base64 =
            Convert.ToBase64String(ms.ToArray());

        // Gemini 호출
        var result =
            await _geminiService
                .AnalyzeFoodImageAsync(
                    base64,
                    image.ContentType
                );

        return Ok(new
        {
            result
        });
    }

    // 식사 생성
    [HttpPost("create")]
    public async Task<IActionResult> CreateMeal(
        [FromBody]
        CreateMealRecordRequest request
    )
    {
        var mealId =
            await _mealService
                .CreateMealAsync(request);

        return Ok(new
        {
            success = true,
            mealId
        });
    }

    // 음식 추가
    [HttpPost("add-food")]
    public async Task<IActionResult> AddFood(
        [FromBody]
        AddMealFoodRequest request
    )
    {
        await _mealService
            .AddFoodAsync(request);

        return Ok(new
        {
            success = true
        });
    }

    // 전체 식사 조회
    [HttpGet("profile/{profileId}")]
    public async Task<IActionResult> GetMeals(
        int profileId
    )
    {
        var meals =
            await _mealService
                .GetMealsAsync(profileId);

        return Ok(meals);
    }

    // 날짜별 조회
    [HttpGet("profile/{profileId}/date/{date}")]
    public async Task<IActionResult>
        GetMealsByDate(
            int profileId,
            DateTime date
        )
    {
        var meals =
            await _mealService
                .GetMealsByDateAsync(
                    profileId,
                    date
                );

        return Ok(meals);
    }

    // 상세 조회
    [HttpGet("detail/{mealId}")]
    public async Task<IActionResult>
        GetMealDetail(
            int mealId
        )
    {
        var meal =
            await _mealService
                .GetMealDetailAsync(mealId);

        if (meal == null)
        {
            return NotFound(new
            {
                message = "식사를 찾을 수 없습니다."
            });
        }

        return Ok(meal);
    }

    // 삭제
    [HttpDelete("{mealId}")]
    public async Task<IActionResult>
        DeleteMeal(
            int mealId
        )
    {
        await _mealService
            .DeleteMealAsync(mealId);

        return Ok(new
        {
            success = true
        });
    }
}