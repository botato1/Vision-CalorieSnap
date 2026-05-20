using FoodAI.API.DTOs.Requests;
using FoodAI.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace FoodAI.API.Controllers;

[ApiController]
[Route("api/meals")]
public class MealsController : ControllerBase
{
    private readonly IOpenAiService _geminiService;
    private readonly IMealService _mealService;
    private readonly IFoodNutritionService _foodNutritionService;

    public MealsController(
        IOpenAiService geminiService,
        IMealService mealService,
        IFoodNutritionService foodNutritionService)
    {
        _geminiService = geminiService;
        _mealService = mealService;
        _foodNutritionService = foodNutritionService;
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
    public async Task<IActionResult> AnalyzeFood([FromBody] AnalyzeFoodRequest request)
    {
        if (string.IsNullOrEmpty(request.ImageBase64))
            return BadRequest(new { message = "이미지를 업로드해주세요." });

        try
        {
            var result = await _geminiService.AnalyzeFoodImageAsync(request.ImageBase64, "image/jpeg");
            return Ok(new { result });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { message = $"AI 분석 서비스 오류: {ex.Message}" });
        }
    }
    // ─────────────────────────────────────────────
    // 부족한 영양소 기반 AI 메뉴 추천
    // POST /api/meals/recommend
    // ─────────────────────────────────────────────

    [HttpPost("recommend")]
    public async Task<IActionResult> RecommendMenu([FromBody] RecommendRequest request)
    {
        try
        {
            var result = await _geminiService.RecommendMenuAsync(
                request.RemainingCalories,
                request.RemainingProtein,
                request.RemainingCarbs,
                request.RemainingFat
            );
            return Ok(new { result });
        }
        catch (Exception ex)
        {
            // Gemini API 오류(할당량 초과, 503 등) 시 500 대신 503 반환
            return StatusCode(503, new { message = $"AI 추천 서비스 오류: {ex.Message}" });
        }
    }

    // ─────────────────────────────────────────────
    // 식사 생성
    // POST /api/meals/create
    // ─────────────────────────────────────────────

    [HttpPost("create")]
    public async Task<IActionResult>
        CreateMeal(
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

    // ─────────────────────────────────────────────
    // 음식 직접 추가
    // POST /api/meals/add-food
    // ─────────────────────────────────────────────

    [HttpPost("add-food")]
    public async Task<IActionResult>
        AddFood(
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

    // ─────────────────────────────────────────────
    // 음식 검색 후 자동 추가
    // POST /api/meals/search-food
    // ─────────────────────────────────────────────

    [HttpPost("search-food")]
    public async Task<IActionResult>
        SearchFood(
            [FromBody]
        SearchFoodRequest request
        )
    {
        var foods =
            await _foodNutritionService
                .SearchFoodAsync(
                    request.FoodName
                );

        return Ok(foods);
    }

    // ─────────────────────────────────────────────
    // 전체 식사 조회
    // GET /api/meals/profile/admin
    // ─────────────────────────────────────────────

    [HttpGet("profile/{profileId}")]
    public async Task<IActionResult>
        GetMeals(
            string profileId
        )
    {
        var meals =
            await _mealService
                .GetMealsAsync(
                    profileId
                );

        return Ok(meals);
    }

    // ─────────────────────────────────────────────
    // 날짜별 조회
    // GET /api/meals/profile/admin/date/2026-05-19
    // ─────────────────────────────────────────────

    [HttpGet("profile/{profileId}/date/{date}")]
    public async Task<IActionResult>
        GetMealsByDate(
            string profileId,
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

    // ─────────────────────────────────────────────
    // 상세 조회
    // GET /api/meals/detail/1
    // ─────────────────────────────────────────────

    [HttpGet("detail/{mealId}")]
    public async Task<IActionResult>
        GetMealDetail(
            int mealId
        )
    {
        var meal =
            await _mealService
                .GetMealDetailAsync(
                    mealId
                );

        if (meal == null)
        {
            return NotFound(new
            {
                message =
                    "식사를 찾을 수 없습니다."
            });
        }

        return Ok(meal);
    }

    // ─────────────────────────────────────────────
    // 삭제
    // DELETE /api/meals/1
    // ─────────────────────────────────────────────

    [HttpDelete("{mealId}")]
    public async Task<IActionResult>
        DeleteMeal(
            int mealId
        )
    {
        await _mealService
            .DeleteMealAsync(
                mealId
            );

        return Ok(new
        {
            success = true
        });
    }
}