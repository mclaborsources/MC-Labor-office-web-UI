@echo off
setlocal
cd /d "%~dp0"
title MC Labor - Local Web Server

where node >nul 2>&1
if errorlevel 1 (
  echo Install Node.js 20 or newer, then run this launcher again.
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo npm was not found. Reinstall Node.js with npm included.
  pause
  exit /b 1
)

if not exist ".env.local" (
  copy /-Y ".env.example" ".env.local" >nul
  echo Configure session and login settings in .env.local, then run this again.
  echo Database settings can be entered in the administrator connection form.
  start "" notepad.exe ".env.local"
  pause
  exit /b 1
)

if not exist "node_modules\next\package.json" (
  echo Installing application dependencies...
  call npm ci
  if errorlevel 1 goto failed
)

echo Keep this window open while using MC Labor. Press Ctrl+C to stop.
echo Opening http://localhost:3000 when the server is ready...
start "" /b node "%~dp0scripts\open-local-browser.cjs"
call npm run dev -- --hostname 127.0.0.1 --port 3000
if errorlevel 1 goto failed
exit /b 0

:failed
echo.
echo MC Labor could not start. Review the error above.
pause
exit /b 1
