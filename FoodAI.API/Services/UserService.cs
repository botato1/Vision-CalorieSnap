using FoodAI.API.DTOs;
using FoodAI.API.Infrastructure;
using FoodAI.API.Models;
using Microsoft.Data.SqlClient;
using static FoodAI.API.DTOs.UserProfileDto;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace FoodAI.API.Services
{
    public class UserService : IUserService
    {
        private readonly DatabaseContext _db;

        public UserService(DatabaseContext db)
        {
            _db = db;
        }
        //----------Get---------------------------------------------------------
        public async Task<UserProfile?> GetByIdAsync(string profileId)
        {
            const string sql = @"
                SELECT ProfileID, Name, Male, Height, Weight,
                       BirthDate, TargetCalories, CreatedAt
                FROM   UserProfile
                WHERE  ProfileID = @ProfileID";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();
            using var cmd = new SqlCommand(sql, conn);

            cmd.Parameters.AddWithValue("@ProfileID", profileId);

            using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
                return null;

            return MapToModel(reader);
        }
        //------------POST------------------------------------------------------
        public async Task<int> CreateAsync(UserProfile profile)
        {

            const string sql = @"
                INSERT INTO UserProfile (ProfileID, Name, Male, Height, Weight, BirthDate, TargetCalories)
                VALUES (@ProfileID,@Name, @Male, @Height, @Weight, @BirthDate, @TargetCalories);
                SELECT SCOPE_IDENTITY();";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ProfileID", profile.Name);
            cmd.Parameters.AddWithValue("@Name", profile.Name);
            cmd.Parameters.AddWithValue("@Male", profile.Male);
            cmd.Parameters.AddWithValue("@Height", profile.Height);
            cmd.Parameters.AddWithValue("@Weight", profile.Weight);
            cmd.Parameters.AddWithValue("@BirthDate", (object?)profile.BirthDate ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@TargetCalories", profile.TargetCalories);

            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result);
        }

        
        //-------------UPDATE----------------------------------------------

        public async Task<bool> UpdateAsync(UserProfile profile)
        {
            const string sql = @"
                UPDATE UserProfile
                SET    Name           = @Name,
                       Male           = @Male,
                       Height         = @Height,
                       Weight         = @Weight,
                       BirthDate      = @BirthDate,
                       TargetCalories = @TargetCalories
                WHERE  ProfileID = @ProfileID";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ProfileID", profile.ProfileID);
            cmd.Parameters.AddWithValue("@Name", profile.Name);
            cmd.Parameters.AddWithValue("@Male", profile.Male);
            cmd.Parameters.AddWithValue("@Height", profile.Height);
            cmd.Parameters.AddWithValue("@Weight", profile.Weight);
            cmd.Parameters.AddWithValue("@BirthDate", (object?)profile.BirthDate ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@TargetCalories", profile.TargetCalories);

            var affected = await cmd.ExecuteNonQueryAsync();
            return affected > 0;
        }

        //---------------DELETE--------------------------------------------

        public async Task<bool> DeleteAsync(string ProfileID)
        {
            const string sql = @"
                DELETE 
                FROM UserProfile
                WHERE ProfileID = @ProfileID";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ProfileID", ProfileID);


            var affected = await cmd.ExecuteNonQueryAsync();
            return affected > 0;
        }
        

        // DTO ↔ 모델 변환 (static)
        /// <summary>등록 Request → 모델</summary>
        public static UserProfile ToModel(CreateUserProfileRequest dto) => new()
        {
            Name = dto.Name,
            Male = dto.Male,
            Height = dto.Height,
            Weight = dto.Weight,
            BirthDate = dto.BirthDate,
            TargetCalories = dto.TargetCalories
        };

        /// <summary>수정 Request → 모델</summary>
        public static UserProfile ToModel(UpdateUserProfileRequest dto, string profileId) => new()
        {
            ProfileID = profileId,
            Name = dto.Name,
            Male = dto.Male,
            Height = dto.Height,
            Weight = dto.Weight,
            BirthDate = dto.BirthDate,
            TargetCalories = dto.TargetCalories
        };

        /// <summary>모델 → 응답 DTO</summary>
        public static UserProfileResponse ToResponse(UserProfile model) => new()
        {
            ProfileID = model.ProfileID,
            Name = model.Name,
            Male = model.Male,
            Height = model.Height,
            Weight = model.Weight,
            TargetCalories = model.TargetCalories,
            Age = model.Age,
            BMI = Math.Round(model.BMI, 1),
            BMIStatus = GetBMIStatus(model.BMI)
        };

        // ── 내부 헬퍼 ────────────────────────────────────────
        private static UserProfile MapToModel(SqlDataReader reader) => new()
        {
            ProfileID = reader.GetString(reader.GetOrdinal("ProfileID")),
            Name = reader.GetString(reader.GetOrdinal("Name")),
            Male = reader.GetBoolean(reader.GetOrdinal("Male")),
            Height = reader.GetDouble(reader.GetOrdinal("Height")),
            Weight = reader.GetDouble(reader.GetOrdinal("Weight")),
            BirthDate = reader.IsDBNull(reader.GetOrdinal("BirthDate"))
                                ? null
                                : reader.GetDateTime(reader.GetOrdinal("BirthDate")),
            TargetCalories = reader.GetDouble(reader.GetOrdinal("TargetCalories")),
            CreatedAt = reader.GetDateTime(reader.GetOrdinal("CreatedAt"))
        };

        private static string GetBMIStatus(double bmi) => bmi switch
        {
            < 18.5 => "저체중",
            < 23.0 => "정상",
            < 25.0 => "과체중",
            _ => "비만"
        };

        
    }
}
