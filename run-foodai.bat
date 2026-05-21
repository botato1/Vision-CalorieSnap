@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0"
set "API_DIR=%ROOT%FoodAI.API"
set "WEB_DIR=%ROOT%foodai-web"
set "API_URL=http://localhost:5260"
set "WEB_URL=http://localhost:5173"

title FoodAI Launcher

echo.
echo ========================================
echo   FoodAI API + Web Launcher
echo ========================================
echo.

where winget >nul 2>nul
if errorlevel 1 (
  echo [INFO] winget is not available. Install Node.js LTS and .NET SDK 10 manually if checks fail.
  set "HAS_WINGET=0"
) else (
  set "HAS_WINGET=1"
)

where node >nul 2>nul
if errorlevel 1 (
  echo [SETUP] Node.js was not found.
  if "%HAS_WINGET%"=="1" (
    echo [SETUP] Installing Node.js LTS with winget...
    winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
  ) else (
    echo [ERROR] Node.js is required for the web UI.
    pause
    exit /b 1
  )
) else (
  for /f "tokens=1 delims=v." %%A in ('node -v') do set "NODE_MAJOR=%%A"
  if !NODE_MAJOR! LSS 22 (
    echo [SETUP] Node.js v22 or newer is recommended. Current:
    node -v
    if "%HAS_WINGET%"=="1" (
      echo [SETUP] Installing/upgrading Node.js LTS with winget...
      winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
    )
  ) else (
    echo [OK] Node.js:
    node -v
  )
)

where dotnet >nul 2>nul
if errorlevel 1 (
  echo [SETUP] .NET SDK was not found.
  if "%HAS_WINGET%"=="1" (
    echo [SETUP] Installing .NET SDK 10 with winget...
    winget install --id Microsoft.DotNet.SDK.10 -e --accept-source-agreements --accept-package-agreements
  ) else (
    echo [ERROR] .NET SDK 10 is required for FoodAI.API.
    pause
    exit /b 1
  )
) else (
  dotnet --list-sdks | findstr /b "10." >nul 2>nul
  if errorlevel 1 (
    echo [SETUP] .NET SDK 10 was not found.
    if "%HAS_WINGET%"=="1" (
      echo [SETUP] Installing .NET SDK 10 with winget...
      winget install --id Microsoft.DotNet.SDK.10 -e --accept-source-agreements --accept-package-agreements
    ) else (
      echo [ERROR] .NET SDK 10 is required for FoodAI.API.
      pause
      exit /b 1
    )
  ) else (
    echo [OK] .NET SDK 10 found.
  )
)

echo.
echo [SETUP] Checking web dependencies...
if not exist "%WEB_DIR%\node_modules" (
  pushd "%WEB_DIR%"
  call npm install
  if errorlevel 1 (
    popd
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
  popd
) else (
  echo [OK] node_modules found.
)

echo.
echo [RUN] Starting API server: %API_URL%
start "FoodAI API" /D "%API_DIR%" cmd /k dotnet run --launch-profile http

echo [RUN] Starting web UI: %WEB_URL%
start "FoodAI Web" /D "%WEB_DIR%" cmd /k npm run dev -- --host 127.0.0.1

echo.
echo ========================================
echo   Started.
echo   API: %API_URL%
echo   Web: %WEB_URL%
echo ========================================
echo.
echo If tools were installed just now and a command is still not recognized,
echo close this window and run this batch file again.
echo.
pause
