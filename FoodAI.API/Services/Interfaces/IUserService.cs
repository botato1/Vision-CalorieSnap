using FoodAI.API.DTOs.Requests;
using FoodAI.API.Models;

namespace FoodAI.API.Services.Interfaces
{
    public interface IUserService
    {
        Task<UserProfile?> GetByIdAsync(string profileId);
        
        //프로필 수정(키, 몸무게)
        Task<bool> UpdateAsync(string ProfileID, UpdateUserProfileRequest profile);
        //프로필 삭제
        Task<bool> DeleteAsync(string ProfileID);



    }
}
