using FoodAI.API.DTOs.Requests;
using FoodAI.API.DTOs.Responses;
using FoodAI.API.Infrastructure;
using FoodAI.API.Services;
using FoodAI.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace FoodAI.API.Controllers
{
    [ApiController]
    [Route("api/user")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;


        public UserController(IUserService userService)
        {
            
            _userService = userService;
        }


        /*//회원가입 POST /api/auth/register
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
        }*/

        /*//ID중복체크 GET  /api/auth/check/{profileId} 
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
        }*/

        //사용자 정보 조회
        [HttpGet("{profileId}")]
        public async Task<IActionResult> GetUser(string profileId)
        {
            // 프로필 존재 확인
            var profile = await _userService.GetByIdAsync(profileId);
            if (profile is null)
                return NotFound(new { message = $"프로필을 찾을 수 없습니다: {profileId}" });

            return Ok(new
            {
                profileId,
                profile = UserService.ToResponse(profile)
            });
        }
        //계정 삭제
        [HttpDelete("{profileId}")]
        public async Task<IActionResult> DeleteUser(string profileId)
        {
            var request = await _userService.GetByIdAsync(profileId);
            if (request is null)
                return NotFound(new { message = $"프로필을 찾을 수 없습니다: {profileId}" });

            var success = await _userService.DeleteAsync(profileId);
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
}
