using Microsoft.AspNetCore.Mvc;
using FoodAI.API.Infrastructure;
using Microsoft.Data.SqlClient;

namespace FoodAI.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly DatabaseContext _db;

        public AuthController(DatabaseContext db)
        {
            _db = db;
        }

        // POST /api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            var cmd = new SqlCommand(
                "SELECT ProfileID, Name FROM dbo.UserProfile WHERE ProfileID = @ProfileID AND ProfilePW = @ProfilePW", conn);
            cmd.Parameters.AddWithValue("@ProfileID", request.ProfileID);
            cmd.Parameters.AddWithValue("@ProfilePW", request.ProfilePW);

            using var reader = await cmd.ExecuteReaderAsync();

            if (!reader.Read())
                return Unauthorized(new { message = "아이디 또는 비밀번호가 틀렸습니다." });

            return Ok(new
            {
                message = "로그인 성공",
                profileId = reader["ProfileID"],
                name = reader["Name"]
            });
        }
    }

    // 로그인 요청 데이터
    public class LoginRequest
    {
        public string ProfileID { get; set; } = string.Empty;
        public string ProfilePW { get; set; } = string.Empty;
    }

}