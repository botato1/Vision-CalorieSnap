using FoodAI.API.DTOs.Requests;
using FoodAI.API.DTOs.Responses;
using FoodAI.API.Infrastructure;
using FoodAI.API.Models;
using FoodAI.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace FoodAI.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly DatabaseContext _db;

        public AuthService(DatabaseContext db)
        {
            _db = db;
        }
        #region Auth
        public async Task<AuthLoginResponse?> LoginAsync(LoginUserRequest request)
        {


            const string sql = @"
                SELECT ProfileID, Name
                FROM   dbo.UserProfile
                WHERE  ProfileID = @ProfileID AND ProfilePW = @ProfilePW";


            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ProfileID", request.ProfileID);
            cmd.Parameters.AddWithValue("@ProfilePW", request.ProfilePW);

            using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
                return null;

            // 일치하면 사용자 정보 반환
            return new AuthLoginResponse
            {
                ProfileID = reader.GetString(reader.GetOrdinal("ProfileID")),
                Name = reader.GetString(reader.GetOrdinal("Name"))
            };


        }

        public async Task<bool> ExistsAsync(string profileId)
        {
            const string sql = "SELECT COUNT(*) FROM UserProfile WHERE ProfileID = @ProfileID";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ProfileID", profileId);

            var count = (int)(await cmd.ExecuteScalarAsync() ?? 0);
            return count > 0;
        }

        public async Task<string> CreateAsync(UserProfile profile)
        {

            const string sql = @"
                INSERT INTO UserProfile (ProfileID,ProfilePW, Name, Male, Height, Weight, Age, TargetCalories, Job)
                VALUES (@ProfileID,@ProfilePW,@Name, @Male, @Height, @Weight, @Age, @TargetCalories, @Job);
                ";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ProfileID", profile.ProfileID);
            cmd.Parameters.AddWithValue("@ProfilePW", profile.ProfilePW);
            cmd.Parameters.AddWithValue("@Name", profile.Name);
            cmd.Parameters.AddWithValue("@Male", profile.Male);
            cmd.Parameters.AddWithValue("@Height", profile.Height);
            cmd.Parameters.AddWithValue("@Weight", profile.Weight);
            cmd.Parameters.AddWithValue("@Age", profile.Age);
            cmd.Parameters.AddWithValue("@Job", profile.Job);
            cmd.Parameters.AddWithValue("@TargetCalories", profile.TargetCalories);

            await cmd.ExecuteNonQueryAsync();
            return profile.ProfileID;
        }

        public static AuthLoginResponse ToModel(string profileId, string name) => new()
        {
            ProfileID = profileId,
            Name = name

        };
        #endregion

        #region User
        //----------Get---------------------------------------------------------
        public async Task<UserProfile?> GetByIdAsync(string profileId)
        {
            const string sql = @"
                SELECT ProfileID, Name, Male, Height, Weight,
                       Age, TargetCalories, CreatedAt, Job
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

        //-------------UPDATE----------------------------------------------
        public async Task<bool> UpdateAsync(string ProfileID, UpdateUserProfileRequest profile)
        {
            const string sql = @"
                UPDATE UserProfile
                SET    
                       Height         = @Height,
                       Weight         = @Weight,
                       TargetCalories = @TargetCalories
                       Job            = @Job
                WHERE  ProfileID = @ProfileID";

            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ProfileID", ProfileID);
            cmd.Parameters.AddWithValue("@Height", profile.Height);
            cmd.Parameters.AddWithValue("@Weight", profile.Weight);
            cmd.Parameters.AddWithValue("@Job", profile.Job);
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


        #region DTO ↔ 모델 변환 (static)
        /// <summary>등록 Request → 모델</summary>
        public static UserProfile ToModel(CreateUserProfileRequest dto) => new()
        {
            ProfileID = dto.ProfileID,
            ProfilePW = dto.ProfilePW,
            Name = dto.Name,
            Male = dto.Male,
            Height = dto.Height,
            Weight = dto.Weight,
            Age = dto.Age,
            TargetCalories = dto.TargetCalories,
            Job = dto.Job
        };

        /// <summary>수정 Request → 모델</summary>
        public static UserProfile ToModel(UpdateUserProfileRequest dto, string profileId) => new()
        {
            ProfileID = profileId,
            Height = dto.Height,
            Weight = dto.Weight,
            TargetCalories = dto.TargetCalories,
            Job = dto.Job,
           
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
            BMIStatus = GetBMIStatus(model.BMI),
            Job = model.Job,
            
        };
        #endregion

        #region 내부 헬퍼
        private static UserProfile MapToModel(SqlDataReader reader) => new()
        {
            ProfileID = reader.GetString(reader.GetOrdinal("ProfileID")),
            Name = reader.GetString(reader.GetOrdinal("Name")),
            Male = reader.GetBoolean(reader.GetOrdinal("Male")),
            Height = reader.GetDouble(reader.GetOrdinal("Height")),
            Weight = reader.GetDouble(reader.GetOrdinal("Weight")),
            Age = reader.GetInt32(reader.GetOrdinal("Age")),
            TargetCalories = reader.GetDouble(reader.GetOrdinal("TargetCalories")),
            CreatedAt = reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
            Job = (JobType)reader.GetByte(reader.GetOrdinal("Job"))
        };

        private static string GetBMIStatus(double bmi) => bmi switch
        {
            < 18.5 => "저체중",
            < 23.0 => "정상",
            < 25.0 => "과체중",
            _ => "비만"
        };
        #endregion
        #endregion
    }
}
