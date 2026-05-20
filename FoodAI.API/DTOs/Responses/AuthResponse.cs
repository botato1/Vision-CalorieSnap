namespace FoodAI.API.DTOs.Responses
{
    public class AuthResponse
    {
        public string Message { get; set; } = string.Empty;
        public string ProfileID { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }
   

    public class AuthLoginResponse
    {
        public string ProfileID { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

}
