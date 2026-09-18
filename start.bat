@echo off
title DepthWizard - Launching Services
echo ========================================================
echo               DEPTHWIZARD (SIH 2026)
echo     From 2D Satellite Images to 3D Understanding
echo ========================================================
echo.

echo Starting FastAPI Backend on port 8000...
start "DepthWizard Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo Starting React/Vite Frontend on port 5173...
start "DepthWizard Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 127.0.0.1 --port 5173"

timeout /t 3 /nobreak >nul

echo Opening browser at http://127.0.0.1:5173/ ...
start http://127.0.0.1:5173/

echo.
echo ========================================================
echo Services are running!
echo   Frontend: http://127.0.0.1:5173/
echo   Backend API: http://127.0.0.1:8000/
echo   Swagger Docs: http://127.0.0.1:8000/docs
echo ========================================================
