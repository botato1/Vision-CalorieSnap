@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion
title 먹깨비 실행기

echo.
echo  ================================================
echo    먹깨비 (Vision-CalorieSnap) 시작하기
echo  ================================================
echo.

REM ══════════════════════════════════════════
REM  STEP 1. Node.js 확인 (20 이상 필요)
REM ══════════════════════════════════════════
echo  [1/3] Node.js 버전 확인 중...

where node > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [X] Node.js 가 설치되어 있지 않습니다.
    echo.
    echo      설치 주소: https://nodejs.org
    echo      Node.js 22 LTS 버전을 설치해주세요.
    echo.
    pause & exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
set NODE_VER_STRIP=%NODE_VER:v=%
for /f "tokens=1 delims=." %%v in ("%NODE_VER_STRIP%") do set NODE_MAJOR=%%v

echo        현재 버전: %NODE_VER%

if %NODE_MAJOR% LSS 20 (
    echo.
    echo  [X] Node.js 20 이상이 필요합니다. 현재: %NODE_VER%
    echo.
    echo      설치 주소: https://nodejs.org
    echo      Node.js 22 LTS 버전을 설치해주세요.
    echo.
    pause & exit /b 1
)

echo  [OK] Node.js %NODE_VER%
echo.

REM ══════════════════════════════════════════
REM  STEP 2. .NET SDK 확인 (10.0 이상 필요)
REM ══════════════════════════════════════════
echo  [2/3] .NET SDK 버전 확인 중...

where dotnet > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [X] .NET SDK 가 설치되어 있지 않습니다.
    echo.
    echo      설치 주소: https://dotnet.microsoft.com/download/dotnet/10.0
    echo      .NET 10 SDK 를 설치해주세요.
    echo.
    pause & exit /b 1
)

for /f "tokens=1" %%v in ('dotnet --version 2^>nul') do set DOTNET_VER=%%v
for /f "tokens=1 delims=." %%v in ("%DOTNET_VER%") do set DOTNET_MAJOR=%%v

echo        현재 버전: %DOTNET_VER%

if %DOTNET_MAJOR% LSS 10 (
    echo.
    echo  [X] .NET 10 SDK 가 필요합니다. 현재: %DOTNET_VER%
    echo.
    echo      설치 주소: https://dotnet.microsoft.com/download/dotnet/10.0
    echo      .NET 10 SDK 를 설치해주세요.
    echo.
    pause & exit /b 1
)

echo  [OK] .NET SDK %DOTNET_VER%
echo.

REM ══════════════════════════════════════════
REM  STEP 3. npm 패키지 설치
REM ══════════════════════════════════════════
echo  [3/3] 프론트엔드 패키지 확인 중...

if not exist "%~dp0foodai-web\node_modules" (
    echo        node_modules 없음 -- npm install 실행 중...
    echo        (인터넷 연결 상태에 따라 1~3분 소요될 수 있습니다)
    echo.
    pushd "%~dp0foodai-web"
    call npm install
    set NPM_ERR=%errorlevel%
    popd
    if !NPM_ERR! neq 0 (
        echo.
        echo  [X] npm install 실패!
        echo      네트워크 연결을 확인하거나 수동으로 실행해주세요:
        echo      cd foodai-web ^&^& npm install
        echo.
        pause & exit /b 1
    )
    echo.
    echo  [OK] 패키지 설치 완료
) else (
    echo  [OK] 패키지 이미 설치됨
)

echo.

REM ══════════════════════════════════════════
REM  STEP 4. 서버 실행
REM ══════════════════════════════════════════
echo  ================================================
echo    서버 시작 중...
echo  ================================================
echo.
echo    백엔드 API  --  http://localhost:5260
echo    프론트엔드  --  http://localhost:5173
echo.
echo    각 창을 닫으면 해당 서버가 종료됩니다.
echo  ================================================
echo.

REM 백엔드 먼저 실행 (새 창)
start "[백엔드] FoodAI API :5260" cmd /k "chcp 65001 > nul && cd /d "%~dp0FoodAI.API" && echo. && echo  [백엔드] 서버 시작 중... (http://localhost:5260) && echo. && dotnet run"

REM 백엔드가 먼저 뜨도록 3초 대기
timeout /t 3 /nobreak > nul

REM 프론트엔드 실행 (새 창)
start "[프론트] 먹깨비 Web :5173" cmd /k "chcp 65001 > nul && cd /d "%~dp0foodai-web" && echo. && echo  [프론트엔드] Vite 개발 서버 시작 중... (http://localhost:5173) && echo. && npm run dev"

echo.
echo  두 개의 창이 실행되었습니다.
echo.
echo  잠시 후 아래 주소로 브라우저를 여세요:
echo.
echo     http://localhost:5173
echo.
echo  (백엔드 첫 빌드 시 30초~1분 소요될 수 있습니다)
echo.
pause
endlocal
