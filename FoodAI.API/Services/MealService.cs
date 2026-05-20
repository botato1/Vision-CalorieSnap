using FoodAI.API.DTOs.Requests;
using FoodAI.API.Infrastructure;
using FoodAI.API.Models;
using Microsoft.Data.SqlClient;

namespace FoodAI.API.Services
{
    public class MealService : IMealService
    {
        private readonly DatabaseContext _db;

        public MealService(DatabaseContext db)
        {
            _db = db;
        }

        public async Task<int> CreateMealAsync(CreateMealRecordRequest request)
        {
            var mealType = ParseMealType(request.MealType);

            const string sql = @"
                IF EXISTS (
                    SELECT 1
                    FROM dbo.MealRecords
                    WHERE ProfileID = @ProfileID
                      AND MealType = @MealType
                      AND MealDate = @MealDate
                )
                BEGIN
                    SELECT TOP 1 MealID
                    FROM dbo.MealRecords
                    WHERE ProfileID = @ProfileID
                      AND MealType = @MealType
                      AND MealDate = @MealDate;
                END
                ELSE
                BEGIN
                    INSERT INTO dbo.MealRecords (ProfileID, MealType, MealDate, MealTime)
                    VALUES (@ProfileID, @MealType, @MealDate, CONVERT(time, GETDATE()));

                    SELECT CAST(SCOPE_IDENTITY() AS int);
                END";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ProfileID", request.ProfileId);
            cmd.Parameters.AddWithValue("@MealType", (byte)mealType);
            cmd.Parameters.AddWithValue("@MealDate", request.MealDate.Date);

            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result);
        }

        public async Task<int> AddFoodAsync(AddMealFoodRequest request)
        {
            const string sql = @"
                INSERT INTO dbo.MealFoods
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
                    0
                );

                SELECT CAST(SCOPE_IDENTITY() AS int);";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@MealID", request.MealId);
            cmd.Parameters.AddWithValue("@FoodName", request.FoodName);
            cmd.Parameters.AddWithValue("@IntakeAmount", request.Grams);
            cmd.Parameters.AddWithValue("@Calories", request.Calories);
            cmd.Parameters.AddWithValue("@Protein", request.Protein);
            cmd.Parameters.AddWithValue("@Carbohydrate", request.Carbohydrate);
            cmd.Parameters.AddWithValue("@Fat", request.Fat);
            cmd.Parameters.AddWithValue("@Sodium", request.Sodium);

            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result);
        }

        public async Task DeleteFoodAsync(int mealFoodId)
        {
            const string sql = "DELETE FROM dbo.MealFoods WHERE MealFoodID = @MealFoodID";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@MealFoodID", mealFoodId);
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<object> GetMealsAsync(string profileId)
        {
            const string sql = @"
                SELECT MealID, ProfileID, MealType, MealDate, MealTime,
                       TotalCalories, TotalProtein, TotalCarb, TotalFat
                FROM dbo.vw_MealTotals
                WHERE ProfileID = @ProfileID
                ORDER BY MealDate DESC, MealTime DESC";

            return await QueryMealRecordsAsync(sql, profileId, null);
        }

        public async Task<object> GetMealsByDateAsync(string profileId, DateTime date)
        {
            const string sql = @"
                SELECT MealID, ProfileID, MealType, MealDate, MealTime,
                       TotalCalories, TotalProtein, TotalCarb, TotalFat
                FROM dbo.vw_MealTotals
                WHERE ProfileID = @ProfileID
                  AND MealDate = @MealDate
                ORDER BY MealTime ASC";

            return await QueryMealRecordsAsync(sql, profileId, date.Date);
        }

        public async Task<object?> GetMealDetailAsync(int mealId)
        {
            const string mealSql = @"
                SELECT MealID, ProfileID, MealType, MealDate, MealTime,
                       TotalCalories, TotalProtein, TotalCarb, TotalFat
                FROM dbo.vw_MealTotals
                WHERE MealID = @MealID";

            const string foodSql = @"
                SELECT MealFoodID, MealID, FoodName, IntakeAmount,
                       Calories, Protein, Carbohydrate, Fat, Sodium, Sugar
                FROM dbo.MealFoods
                WHERE MealID = @MealID
                ORDER BY MealFoodID ASC";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var mealCmd = new SqlCommand(mealSql, conn);
            mealCmd.Parameters.AddWithValue("@MealID", mealId);
            using var mealReader = await mealCmd.ExecuteReaderAsync();

            if (!await mealReader.ReadAsync())
                return null;

            var meal = MapMealRecord(mealReader);
            await mealReader.CloseAsync();

            var foods = new List<object>();
            using var foodCmd = new SqlCommand(foodSql, conn);
            foodCmd.Parameters.AddWithValue("@MealID", mealId);
            using var foodReader = await foodCmd.ExecuteReaderAsync();

            while (await foodReader.ReadAsync())
            {
                foods.Add(new
                {
                    mealFoodId = foodReader.GetInt32(foodReader.GetOrdinal("MealFoodID")),
                    mealId = foodReader.GetInt32(foodReader.GetOrdinal("MealID")),
                    foodName = foodReader.GetString(foodReader.GetOrdinal("FoodName")),
                    intakeAmount = foodReader.GetDouble(foodReader.GetOrdinal("IntakeAmount")),
                    calories = foodReader.GetDouble(foodReader.GetOrdinal("Calories")),
                    protein = foodReader.GetDouble(foodReader.GetOrdinal("Protein")),
                    carbohydrate = foodReader.GetDouble(foodReader.GetOrdinal("Carbohydrate")),
                    fat = foodReader.GetDouble(foodReader.GetOrdinal("Fat")),
                    sodium = foodReader.GetDouble(foodReader.GetOrdinal("Sodium")),
                    sugar = foodReader.GetDouble(foodReader.GetOrdinal("Sugar"))
                });
            }

            return new
            {
                meal.mealId,
                meal.profileId,
                meal.mealType,
                meal.mealTypeName,
                meal.mealDate,
                meal.mealTime,
                meal.totalCalories,
                meal.totalProtein,
                meal.totalCarb,
                meal.totalFat,
                foods
            };
        }

        public async Task DeleteMealAsync(int mealId)
        {
            const string sql = "DELETE FROM dbo.MealRecords WHERE MealID = @MealID";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@MealID", mealId);
            await cmd.ExecuteNonQueryAsync();
        }

        private async Task<List<object>> QueryMealRecordsAsync(string sql, string profileId, DateTime? mealDate)
        {
            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ProfileID", profileId);
            if (mealDate.HasValue)
                cmd.Parameters.AddWithValue("@MealDate", mealDate.Value);

            using var reader = await cmd.ExecuteReaderAsync();
            var meals = new List<object>();

            while (await reader.ReadAsync())
            {
                meals.Add(MapMealRecord(reader));
            }

            return meals;
        }

        private static dynamic MapMealRecord(SqlDataReader reader)
        {
            var mealType = (MealType)reader.GetByte(reader.GetOrdinal("MealType"));

            return new
            {
                mealId = reader.GetInt32(reader.GetOrdinal("MealID")),
                profileId = reader.GetString(reader.GetOrdinal("ProfileID")),
                mealType = mealType.ToString().ToLowerInvariant(),
                mealTypeName = mealType.ToKorean(),
                mealDate = reader.GetDateTime(reader.GetOrdinal("MealDate")),
                mealTime = reader.GetTimeSpan(reader.GetOrdinal("MealTime")),
                totalCalories = reader.GetDouble(reader.GetOrdinal("TotalCalories")),
                totalProtein = reader.GetDouble(reader.GetOrdinal("TotalProtein")),
                totalCarb = reader.GetDouble(reader.GetOrdinal("TotalCarb")),
                totalFat = reader.GetDouble(reader.GetOrdinal("TotalFat"))
            };
        }

        private static MealType ParseMealType(string value)
        {
            if (byte.TryParse(value, out var number) &&
                Enum.IsDefined(typeof(MealType), number))
            {
                return (MealType)number;
            }

            return value.Trim().ToLowerInvariant() switch
            {
                "breakfast" or "아침" => MealType.Breakfast,
                "lunch" or "점심" => MealType.Lunch,
                "dinner" or "저녁" => MealType.Dinner,
                "snack" or "간식" => MealType.Snack,
                _ => throw new ArgumentException($"지원하지 않는 식사 타입입니다: {value}")
            };
        }
    }
}
