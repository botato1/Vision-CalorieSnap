using FoodAI.API.DTOs.Requests;
using FoodAI.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FoodAI.API.Controllers;

[ApiController]
[Route("api/meals")]
public class MealsController : ControllerBase
{
    // ─────────────────────────────────────────────
    // Services
    // ─────────────────────────────────────────────

    private readonly IOpenAiService
        _geminiService;

    private readonly IMealService
        _mealService;

    private readonly IFoodNutritionService
        _foodNutritionService;

    // ─────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────

    public MealsController(
        IOpenAiService geminiService,
        IMealService mealService,
        IFoodNutritionService foodNutritionService
    )
    {
        _geminiService =
            geminiService;

        _mealService =
            mealService;

        _foodNutritionService =
            foodNutritionService;
    }

    // ─────────────────────────────────────────────
    // 테스트
    // GET /api/meals
    // ─────────────────────────────────────────────

    [HttpGet]
    public IActionResult Test()
    {
        return Ok(new
        {
            message = "FoodAI API 정상 동작"
        });
    }

    // ─────────────────────────────────────────────
    // 음식 이미지 분석
    // POST /api/meals/analyze
    // ─────────────────────────────────────────────

    [HttpPost("analyze")]
    public async Task<IActionResult>
        AnalyzeFood(
            IFormFile image
        )
    {
        if (image == null ||
            image.Length == 0)
        {
            return BadRequest(new
            {
                message =
                    "이미지를 업로드해주세요."
            });
        }

        using var ms =
            new MemoryStream();

        await image.CopyToAsync(ms);

        var base64 =
            Convert.ToBase64String(
                ms.ToArray());

        var result =
            await _geminiService
                .AnalyzeFoodImageAsync(
                    base64,
                    image.ContentType);

        return Ok(new
        {
            result
        });
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
        var mealFoodId =
            await _mealService
            .AddFoodAsync(request);

        return Ok(new
        {
            success = true,
            mealFoodId
        });
    }

    // ─────────────────────────────────────────────
    // 개별 음식 삭제
    // DELETE /api/meals/food/1
    // ─────────────────────────────────────────────

    [HttpDelete("food/{mealFoodId}")]
    public async Task<IActionResult>
        DeleteFood(
            int mealFoodId
        )
    {
        await _mealService
            .DeleteFoodAsync(
                mealFoodId
            );

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
