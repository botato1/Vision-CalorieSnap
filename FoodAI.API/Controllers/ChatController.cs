using FoodAI.API.Models;
using FoodAI.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace FoodAI.API.Controllers
{
    [ApiController]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly IOpenAiService _geminiService;

        public ChatController(IOpenAiService geminiService)
        {
            _geminiService = geminiService;
        }

        [HttpPost]
        public async Task<IActionResult> Chat(
            [FromBody] ChatRequest request
        )
        {
            var result = await _geminiService.ChatAsync(request);

            return Ok(new
            {
                reply = result
            });
        }
    }
}