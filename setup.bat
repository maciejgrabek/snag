@echo off
echo.
echo   So you don't like Jira either, huh? Welcome aboard.
echo   Your AI agents will thank you.
echo.
echo Setting up Snag...

call npm install --no-audit --no-fund
if errorlevel 1 goto :error

echo Building Snag...
call npm run build:win
if errorlevel 1 goto :error

echo.
echo Done! Check the dist\ folder for the installer.
echo.
echo   Ctrl+Shift+X  — capture a snag
echo   http://127.0.0.1:9999 — web dashboard + API
echo.
goto :eof

:error
echo.
echo Setup failed. Check the error above.
exit /b 1
