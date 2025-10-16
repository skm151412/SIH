@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ===== Backend & Frontend Unified Startup Script =====
REM Prerequisites: Java, Maven, Node.js installed and on PATH

REM Optional: Allow user override via env vars before running
if "%DB_USER%"=="" set DB_USER=root
if "%DB_PASSWORD%"=="" set DB_PASSWORD=626629
if "%JWT_SECRET%"=="" set JWT_SECRET=dev-secret-change-me

set BASE_DIR=%~dp0
cd /d "%BASE_DIR%"

REM Start Backend (Spring Boot) in a new window
start "Backend" cmd /k "cd backend && mvn spring-boot:run -Dspring-boot.run.jvmArguments=^"-Dspring.profiles.active=dev -DDB_USER=%DB_USER% -DDB_PASSWORD=%DB_PASSWORD% -DJWT_SECRET=%JWT_SECRET%^""
7
REM Wait a few seconds to let backend initialize (adjust if needed)
PING 127.0.0.1 -n 6 >NUL

REM Start Frontend (React) in a new window
if exist frontend\package.json (
  start "Frontend" cmd /k "cd frontend && npm install --no-audit --no-fund && npm start"
) else (
  echo frontend\\package.json not found, skipping frontend start.
)

echo.
echo Startup sequence initiated. Check the opened windows for logs.
echo Backend: http://localhost:8080/api

echo Press any key to exit this launcher (services keep running)...
pause >NUL
endlocal
