using FoodAI.API.DTOs;
using FoodAI.API.Infrastructure;
using FoodAI.API.Models;
using Microsoft.Data.SqlClient;
using static FoodAI.API.DTOs.UserProfileDto;

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
        public async Task<UserProfile?> GetByIdAsync(int profileId)
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


            throw new NotImplementedException();
        }

        
        //-------------UPDATE----------------------------------------------

        public async Task<bool> UpdateAsync(UserProfile profile)
        {
            throw new NotImplementedException();
        }

        //---------------DELETE--------------------------------------------

        public async Task<bool> DeleteAsync(UserProfile profile)
        {
            throw new NotImplementedException();
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
        public static UserProfile ToModel(UpdateUserProfileRequest dto, int profileId) => new()
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
            ProfileID = reader.GetInt32(reader.GetOrdinal("ProfileID")),
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
