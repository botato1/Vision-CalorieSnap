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
            const string sql = @"
                INSERT INTO dbo.MealRecords (ProfileID, MealType, MealDate, MealTime)
                OUTPUT INSERTED.MealID
                VALUES (@ProfileID, @MealType, @MealDate, @MealTime);";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ProfileID", request.ProfileId);
            cmd.Parameters.AddWithValue("@MealType", (byte)ParseMealType(request.MealType));
            cmd.Parameters.AddWithValue("@MealDate", request.MealDate.Date);
            cmd.Parameters.AddWithValue("@MealTime", DateTime.Now.TimeOfDay);

            return Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }

        public async Task AddFoodAsync(AddMealFoodRequest request)
        {
            const string sql = @"
                INSERT INTO dbo.MealFoods
                    (MealID, FoodName, IntakeAmount, Calories, Protein, Carbohydrate, Fat, Sodium, Sugar)
                VALUES
                    (@MealID, @FoodName, @IntakeAmount, @Calories, @Protein, @Carbohydrate, @Fat, @Sodium, 0);";

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

            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<object> GetMealsAsync(string profileId)
        {
            const string sql = @"
                SELECT r.MealID, r.ProfileID, r.MealType, r.MealDate, r.MealTime,
                       f.MealFoodID, f.FoodName, f.IntakeAmount, f.Calories,
                       f.Protein, f.Carbohydrate, f.Fat, f.Sodium
                FROM dbo.MealRecords r
                LEFT JOIN dbo.MealFoods f ON r.MealID = f.MealID
                WHERE r.ProfileID = @ProfileID
                ORDER BY r.MealDate DESC, r.MealTime DESC, r.MealID DESC, f.MealFoodID;";

            return await QueryMealsAsync(sql, cmd =>
            {
                cmd.Parameters.AddWithValue("@ProfileID", profileId);
            });
        }

        public async Task<object> GetMealsByDateAsync(string profileId, DateTime date)
        {
            const string sql = @"
                SELECT r.MealID, r.ProfileID, r.MealType, r.MealDate, r.MealTime,
                       f.MealFoodID, f.FoodName, f.IntakeAmount, f.Calories,
                       f.Protein, f.Carbohydrate, f.Fat, f.Sodium
                FROM dbo.MealRecords r
                LEFT JOIN dbo.MealFoods f ON r.MealID = f.MealID
                WHERE r.ProfileID = @ProfileID AND r.MealDate = @MealDate
                ORDER BY r.MealTime, r.MealID, f.MealFoodID;";

            return await QueryMealsAsync(sql, cmd =>
            {
                cmd.Parameters.AddWithValue("@ProfileID", profileId);
                cmd.Parameters.AddWithValue("@MealDate", date.Date);
            });
        }

        public async Task<object?> GetMealDetailAsync(int mealId)
        {
            const string sql = @"
                SELECT r.MealID, r.ProfileID, r.MealType, r.MealDate, r.MealTime,
                       f.MealFoodID, f.FoodName, f.IntakeAmount, f.Calories,
                       f.Protein, f.Carbohydrate, f.Fat, f.Sodium
                FROM dbo.MealRecords r
                LEFT JOIN dbo.MealFoods f ON r.MealID = f.MealID
                WHERE r.MealID = @MealID
                ORDER BY f.MealFoodID;";

            var meals = await QueryMealsAsync(sql, cmd =>
            {
                cmd.Parameters.AddWithValue("@MealID", mealId);
            });

            return meals.FirstOrDefault();
        }

        public async Task DeleteMealAsync(int mealId)
        {
            const string sql = "DELETE FROM dbo.MealRecords WHERE MealID = @MealID;";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@MealID", mealId);

            await cmd.ExecuteNonQueryAsync();
        }

        private async Task<List<MealRecordResponse>> QueryMealsAsync(
            string sql,
            Action<SqlCommand> addParameters)
        {
            var meals = new Dictionary<int, MealRecordResponse>();

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            addParameters(cmd);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var mealId = reader.GetInt32(reader.GetOrdinal("MealID"));
                if (!meals.TryGetValue(mealId, out var meal))
                {
                    var mealType = (MealType)reader.GetByte(reader.GetOrdinal("MealType"));
                    meal = new MealRecordResponse
                    {
                        MealId = mealId,
                        ProfileId = reader.GetString(reader.GetOrdinal("ProfileID")),
                        MealType = ToClientMealType(mealType),
                        MealDate = reader.GetDateTime(reader.GetOrdinal("MealDate")),
                        MealTime = reader.GetTimeSpan(reader.GetOrdinal("MealTime"))
                    };
                    meals.Add(mealId, meal);
                }

                var foodIdOrdinal = reader.GetOrdinal("MealFoodID");
                if (reader.IsDBNull(foodIdOrdinal)) continue;

                meal.Foods.Add(new MealFoodResponse
                {
                    MealFoodId = reader.GetInt32(foodIdOrdinal),
                    Name = reader.GetString(reader.GetOrdinal("FoodName")),
                    Grams = ReadDouble(reader, "IntakeAmount"),
                    Calories = ReadDouble(reader, "Calories"),
                    Protein = ReadDouble(reader, "Protein"),
                    Carbs = ReadDouble(reader, "Carbohydrate"),
                    Fat = ReadDouble(reader, "Fat"),
                    Sodium = ReadDouble(reader, "Sodium")
                });
            }

            return meals.Values.ToList();
        }

        private static MealType ParseMealType(string mealType)
        {
            return mealType.Trim().ToLowerInvariant() switch
            {
                "breakfast" => MealType.Breakfast,
                "lunch" => MealType.Lunch,
                "dinner" => MealType.Dinner,
                "snack" => MealType.Snack,
                _ when byte.TryParse(mealType, out var value) && value <= 3 => (MealType)value,
                _ => MealType.Breakfast
            };
        }

        private static string ToClientMealType(MealType mealType)
        {
            return mealType switch
            {
                MealType.Breakfast => "breakfast",
                MealType.Lunch => "lunch",
                MealType.Dinner => "dinner",
                MealType.Snack => "snack",
                _ => "breakfast"
            };
        }

        private static double ReadDouble(SqlDataReader reader, string columnName)
        {
            var ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? 0 : Convert.ToDouble(reader.GetValue(ordinal));
        }

        private sealed class MealRecordResponse
        {
            public int MealId { get; set; }
            public string ProfileId { get; set; } = string.Empty;
            public string MealType { get; set; } = string.Empty;
            public DateTime MealDate { get; set; }
            public TimeSpan MealTime { get; set; }
            public List<MealFoodResponse> Foods { get; set; } = new();
        }

        private sealed class MealFoodResponse
        {
            public int MealFoodId { get; set; }
            public string Name { get; set; } = string.Empty;
            public double Grams { get; set; }
            public double Calories { get; set; }
            public double Protein { get; set; }
            public double Carbs { get; set; }
            public double Fat { get; set; }
            public double Sodium { get; set; }
        }
    }
}
