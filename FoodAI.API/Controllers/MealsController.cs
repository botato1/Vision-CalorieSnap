using Microsoft.AspNetCore.Mvc;

namespace FoodAI.API.Controllers;

[ApiController]
[Route("api/meals")]
public class MealsController : ControllerBase
{
    [HttpGet]
    public IActionResult Test()
    {
        return Ok(new
        {
            message = "FoodAI API 정상 동작"
        });
    }
}