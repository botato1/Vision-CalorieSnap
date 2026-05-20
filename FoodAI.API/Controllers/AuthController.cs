using FoodAI.API.DTOs.Requests;
using FoodAI.API.Infrastructure;
using FoodAI.API.Services;
using FoodAI.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace FoodAI.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // POST /api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUserRequest request)
        {
            var result = await _authService.LoginAsync(request);

            if (result is null)
                return Unauthorized(new { message = "ID 또는 비밀번호가 틀렸습니다." });

            return Ok(new
            {
                message = "로그인 성공",
                profileId = result.ProfileID,
                name = result.Name
            });
        }
        // POST /api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] CreateUserProfileRequest request)
        {
            if (await _authService.ExistsAsync(request.ProfileID))
                return Conflict(new { message = "이미 사용 중인 ID입니다." });

            var model = AuthService.ToModel(request);
            var createdId = await _authService.CreateAsync(model);

            return StatusCode(201, new
            {
                message = "회원가입 성공",
                profileId = createdId,
                name = request.Name
            });
        }

        //사용자 정보 조회
        [HttpGet("{profileId}")]
        public async Task<IActionResult> GetUser(string profileId)
        {
            // 프로필 존재 확인
            var profile = await _authService.GetByIdAsync(profileId);
            if (profile is null)
                return NotFound(new { message = $"프로필을 찾을 수 없습니다: {profileId}" });

            return Ok(new
            {
                profileId,
                profile = AuthService.ToResponse(profile)
            });
        }
        //계정 삭제
        [HttpDelete("{profileId}")]
        public async Task<IActionResult> DeleteUser(string profileId)
        {
            var request = await _authService.GetByIdAsync(profileId);
            if (request is null)
                return NotFound(new { message = $"프로필을 찾을 수 없습니다: {profileId}" });

            var success = await _authService.DeleteAsync(profileId);
            if (!success)
                return StatusCode(500, new { message = "수정에 실패했습니다." });
            return Ok(new
            {
                message = "신체 정보가 삭제되었습니다.",

            });
        }


        //회원 정보 수정 PATCH /api/auth/check/{profileId}/body
        [HttpPatch("{profileId}/body")]
        public async Task<IActionResult> UpdateUser(string profileId, [FromBody] UpdateUserProfileRequest request)
        {
            // 프로필 존재 확인
            var existing = await _authService.GetByIdAsync(profileId);
            if (existing is null)
                return NotFound(new { message = $"프로필을 찾을 수 없습니다: {profileId}" });

            // 수정 실행
            var success = await _authService.UpdateAsync(profileId, request);

            if (!success)
                return StatusCode(500, new { message = "수정에 실패했습니다." });

            // 수정 후 최신 정보 반환
            var updated = await _authService.GetByIdAsync(profileId);
            return Ok(new
            {
                message = "신체 정보가 수정되었습니다.",
                profile = AuthService.ToResponse(updated!)
            });
        }

    }

}