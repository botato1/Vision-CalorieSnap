using FoodAI.API.Models;

namespace FoodAI.API.Services
{
    public interface IUserService
    {
        //프로필 조회
        Task<UserProfile?> GetByIdAsync(string profileId);
        //프로필 등록
        Task<int> CreateAsync(UserProfile profile);
        //프로필 수정(키, 몸무게)
        Task<bool> UpdateAsync(UserProfile profile);
        //프로필 삭제
        Task<bool> DeleteAsync(string ProfileID);



    }
}
