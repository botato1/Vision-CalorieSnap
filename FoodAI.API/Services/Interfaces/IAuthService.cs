using FoodAI.API.DTOs.Requests;
using FoodAI.API.DTOs.Responses;
using FoodAI.API.Models;

namespace FoodAI.API.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthLoginResponse?> LoginAsync(LoginUserRequest request);
        Task<bool> ExistsAsync(string profileId);
        //프로필 등록
        Task<string> CreateAsync(UserProfile profile);

    }
}
