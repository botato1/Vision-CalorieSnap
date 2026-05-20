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
        

        // ── EXISTS ───────────────────────────────────────────
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
        //------------POST------------------------------------------------------
        public async Task<string> CreateAsync(UserProfile profile)
        {

            const string sql = @"
                INSERT INTO UserProfile (ProfileID,ProfilePW, Name, Male, Height, Weight, BirthDate, TargetCalories)
                VALUES (@ProfileID,@ProfilePW,@Name, @Male, @Height, @Weight, @BirthDate, @TargetCalories);
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
            cmd.Parameters.AddWithValue("@BirthDate", (object?)profile.BirthDate ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@TargetCalories", profile.TargetCalories);

            await cmd.ExecuteNonQueryAsync();
            return profile.ProfileID;
        }

        public static AuthLoginResponse ToModel(string profileId, string name) => new()
        {
            ProfileID = profileId,
            Name = name

        };
    }
}
