@echo off
echo =================================================================
echo   Pushing DepthWizard to GitHub (Lucifer7636/DEPTHWIZARD)
echo =================================================================
echo.
set "PATH=%LOCALAPPDATA%\MinGit\cmd;%PATH%"
git push -u origin main --force
echo.
pause
