
using FoodAI.API.DTOs.Requests;
using FoodAI.API.DTOs.Responses;
using FoodAI.API.Infrastructure;
using FoodAI.API.Services;
using FoodAI.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;


namespace FoodAI.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly DatabaseContext _db;
        private readonly IUserService _userService;

        public AuthController(DatabaseContext db, IUserService userService)
        {
            _db = db;
            _userService = userService;
        }

        // POST /api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUserRequest request)
        {
            using var conn = _db.CreateConnection();
            await conn.OpenAsync();

            // DB에서 이름 + 비밀번호로 유저 조회
            using var cmd = new SqlCommand(
                "SELECT ProfileID, Name FROM dbo.UserProfile WHERE ProfileID = @ProfileID AND ProfilePW = @ProfilePW", conn);
            cmd.Parameters.AddWithValue("@ProfileID", request.ProfileID);
            cmd.Parameters.AddWithValue("@ProfilePW", request.ProfilePW);

            using var reader = await cmd.ExecuteReaderAsync();

            if (!reader.Read())
                return Unauthorized(new { message = "이름 또는 비밀번호가 틀렸습니다." });

            return Ok(new
            {
                message = "로그인 성공",
                profileId = reader["ProfileID"],
                name = reader["Name"]
            });
        }

        //회원가입 POST /api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] CreateUserProfileRequest request)
        {
            if (await _userService.ExistsAsync(request.ProfileID))
                return Conflict(new { message = "이미 사용 중인 ID입니다." });

            // 2. DTO → 모델 변환 후 생성
            var model = UserService.ToModel(request);
            var createdId = await _userService.CreateAsync(model);

            // 3. 결과 반환
            return Ok(new AuthResponse
            {
                Message = "회원가입 성공",
                ProfileID = createdId,
                Name = request.Name
            });
        }

        //ID중복체크 GET  /api/auth/check/{profileId} 
        [HttpGet("check/{profileId}")]
        public async Task<IActionResult> CheckIdAvailable(string profileId)
        {
            var exists = await _userService.ExistsAsync(profileId);

            return Ok(new
            {
                profileId,
                available = !exists,
                message = exists ? "이미 사용 중인 ID입니다." : "사용 가능한 ID입니다."
            });
        }
        [HttpPatch("{profileId}/body")]
        //회원 정보 수정
        public async Task<IActionResult> UpdateUser(string profileId, [FromBody] UpdateUserProfileRequest request)
        {
            // 프로필 존재 확인
            var existing = await _userService.GetByIdAsync(profileId);
            if (existing is null)
                return NotFound(new { message = $"프로필을 찾을 수 없습니다: {profileId}" });

            // 수정 실행
            var success = await _userService.UpdateAsync(profileId, request);

            if (!success)
                return StatusCode(500, new { message = "수정에 실패했습니다." });

            // 수정 후 최신 정보 반환
            var updated = await _userService.GetByIdAsync(profileId);
            return Ok(new
            {
                message = "신체 정보가 수정되었습니다.",
                profile = UserService.ToResponse(updated!)
            });
        }


    }

    // 로그인 요청 데이터
    
}
