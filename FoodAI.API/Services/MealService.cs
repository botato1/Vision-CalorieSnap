using Dapper;

using FoodAI.API.DTOs.Requests;
using FoodAI.API.DTOs.Responses;
using FoodAI.API.Infrastructure;
using FoodAI.API.Services.Interfaces;

namespace FoodAI.API.Services;

public class MealService : IMealService
{
    private readonly DatabaseContext _db;

    public MealService(
        DatabaseContext db
    )
    {
        _db = db;
    }

    // ─────────────────────────────────────────────
    // 식사 생성
    // ─────────────────────────────────────────────
    public async Task<int> CreateMealAsync(
        CreateMealRecordRequest request
    )
    {
        const string sql = """
    INSERT INTO MealRecords
    (
        ProfileID,
        MealType,
        MealDate
    )
    VALUES
    (
        @ProfileID,
        @MealType,
        @MealDate
    );

    SELECT CAST(SCOPE_IDENTITY() as int);
    """;

        using var conn =
            _db.CreateConnection();

        var mealId =
            await conn.ExecuteScalarAsync<int>(
                sql,
                new
                {
                    request.ProfileID,

                    MealType =
                        (byte)request.MealType,

                    request.MealDate
                });

        return mealId;
    }

    // ─────────────────────────────────────────────
    // 음식 추가
    // ─────────────────────────────────────────────
    public async Task AddFoodAsync(
        AddMealFoodRequest request
    )
    {
        const string sql = """
        INSERT INTO MealFoods
        (
            MealID,
            FoodName,
            IntakeAmount,
            Calories,
            Protein,
            Carbohydrate,
            Fat,
            Sodium,
            Sugar
        )
        VALUES
        (
            @MealID,
            @FoodName,
            @IntakeAmount,
            @Calories,
            @Protein,
            @Carbohydrate,
            @Fat,
            @Sodium,
            @Sugar
        );
        """;

        using var conn =
            _db.CreateConnection();

        await conn.ExecuteAsync(
            sql,
            request
        );
    }

    // ─────────────────────────────────────────────
    // 전체 식사 조회
    // ─────────────────────────────────────────────
    public async Task<List<MealRecordResponse>>
        GetMealsAsync(
            string profileId
        )
    {
        const string sql = """
        SELECT
            MealID,
            MealType,
            MealDate,
            TotalCalories,
            TotalProtein,
            TotalCarb,
            TotalFat
        FROM vw_MealTotals
        WHERE ProfileID = @ProfileID
        ORDER BY MealDate DESC
        """;

        using var conn =
            _db.CreateConnection();

        var meals =
            await conn.QueryAsync
                <MealRecordResponse>(
                    sql,
                    new
                    {
                        ProfileID = profileId
                    });

        return meals.ToList();
    }

    // ─────────────────────────────────────────────
    // 날짜별 조회
    // ─────────────────────────────────────────────
    public async Task<List<MealRecordResponse>>
        GetMealsByDateAsync(
            string profileId,
            DateTime date
        )
    {
        const string sql = """
        SELECT
            MealID,
            MealType,
            MealDate,
            TotalCalories,
            TotalProtein,
            TotalCarb,
            TotalFat
        FROM vw_MealTotals
        WHERE
            ProfileID = @ProfileID
            AND MealDate = @MealDate
        ORDER BY MealDate DESC
        """;

        using var conn =
            _db.CreateConnection();

        var meals =
            await conn.QueryAsync
                <MealRecordResponse>(
                    sql,
                    new
                    {
                        ProfileID = profileId,

                        MealDate = date.Date
                    });

        return meals.ToList();
    }

    // ─────────────────────────────────────────────
    // 상세 조회
    // ─────────────────────────────────────────────
    public async Task<MealDetailResponse?>
        GetMealDetailAsync(
            int mealId
        )
    {
        const string mealSql = """
        SELECT
            MealID,
            ProfileID,
            MealType,
            MealDate,
            TotalCalories,
            TotalProtein,
            TotalCarb,
            TotalFat
        FROM vw_MealTotals
        WHERE MealID = @MealID
        """;

        const string foodSql = """
        SELECT
            MealFoodID,
            FoodName,
            IntakeAmount,
            Calories,
            Protein,
            Carbohydrate,
            Fat,
            Sodium,
            Sugar
        FROM MealFoods
        WHERE MealID = @MealID
        """;

        using var conn =
            _db.CreateConnection();

        var meal =
            await conn.QueryFirstOrDefaultAsync
                <MealDetailResponse>(
                    mealSql,
                    new
                    {
                        MealID = mealId
                    });

        if (meal == null)
            return null;

        var foods =
            await conn.QueryAsync
                <MealFoodResponse>(
                    foodSql,
                    new
                    {
                        MealID = mealId
                    });

        meal.Foods = foods.ToList();

        return meal;
    }

    // ─────────────────────────────────────────────
    // 삭제
    // ─────────────────────────────────────────────
    public async Task DeleteMealAsync(
        int mealId
    )
    {
        const string sql = """
        DELETE FROM MealRecords
        WHERE MealID = @MealID
        """;

        using var conn =
            _db.CreateConnection();

        await conn.ExecuteAsync(
            sql,
            new
            {
                MealID = mealId
            });
    }
}