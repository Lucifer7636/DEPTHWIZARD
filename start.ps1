# DepthWizard One-Click PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "              DEPTHWIZARD (SIH 2026)" -ForegroundColor White
Write-Host "    From 2D Satellite Images to 3D Understanding" -ForegroundColor Gray
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting FastAPI Backend on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; uvicorn app.main:app --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 2

Write-Host "Starting Vite Frontend on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process; cd '$root\frontend'; npm run dev -- --host 127.0.0.1 --port 5173"

Start-Sleep -Seconds 3

Write-Host "Launching Browser at http://127.0.0.1:5173/..." -ForegroundColor Cyan
Start-Process "http://127.0.0.1:5173/"

Write-Host ""
Write-Host "DepthWizard is running!" -ForegroundColor Green
Write-Host "  Frontend:    http://127.0.0.1:5173/" -ForegroundColor White
Write-Host "  Backend API: http://127.0.0.1:8000/" -ForegroundColor White
Write-Host "  API Docs:    http://127.0.0.1:8000/docs" -ForegroundColor White
