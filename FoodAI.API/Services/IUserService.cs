using FoodAI.API.Models;

namespace FoodAI.API.Services
{
    public interface IUserService
    {
        //프로필 조회
        Task<UserProfile?> GetByIdAsync(int profileId);
        //프로필 등록
        Task<int> CreateAsync(UserProfile profile);
        //프로필 수정
        Task<bool> UpdateAsync(UserProfile profile);

        Task<bool> DeleteAsync(UserProfile profile);

    }
}
