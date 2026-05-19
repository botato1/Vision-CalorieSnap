using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace FoodAI.API.Infrastructure
{
    public class DatabaseContext
    {
        private readonly string _connectionString;

        public DatabaseContext(IConfiguration configuration)
        {
            // appsettings.json (또는 Local)에서 연결 문자열 읽기
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException(
                    "DefaultConnection 연결 문자열이 설정되지 않았습니다. appsettings.json을 확인하세요.");
        }

        /// <summary>
        /// 새 SqlConnection 객체 반환 (호출자가 using으로 감싸야 함)
        /// </summary>
        public SqlConnection CreateConnection()
        {
            return new SqlConnection(_connectionString);
        }

        /// <summary>
        /// 연결 테스트 — 앱 시작 시 DB 도달 가능 여부 확인
        /// </summary>
        public async Task<bool> TestConnectionAsync()
        {
            try
            {
                using var conn = CreateConnection();
                await conn.OpenAsync();
                return conn.State == System.Data.ConnectionState.Open;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"DB 연결 실패: {ex.Message}");
                return false;
            }
        }
    }
}
