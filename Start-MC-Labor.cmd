@echo off
setlocal
title MC Labor - Local Web Server
set "MC_LABOR_ROOT=%~dp0"
if exist "%MC_LABOR_ROOT%package.json" goto project_found
set "MC_LABOR_ROOT=%~dp0MC-Labor-office-web-UI\"
if exist "%MC_LABOR_ROOT%package.json" goto project_found
echo Cannot find the MC-Labor-office-web-UI project folder.
echo Run Start-MC-Labor.cmd inside the project folder.
echo To launch from the Desktop, create a shortcut to that file.
pause
exit /b 1

:project_found
cd /d "%MC_LABOR_ROOT%"
if errorlevel 1 goto failed

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

if not exist "node_modules\.mc-labor-install-complete" goto install_dependencies
if not exist "node_modules\next\package.json" goto install_dependencies
goto run_app

:install_dependencies
echo Installing application dependencies. Please wait...
call npm install
if errorlevel 1 goto failed
echo Installed successfully.>"node_modules\.mc-labor-install-complete"
if errorlevel 1 goto failed
echo Dependencies installed successfully. Starting MC Labor...

:run_app
set "MC_LABOR_LOCAL_MODE=1"
echo Keep this window open while using MC Labor. Press Ctrl+C to stop.
echo Opening http://localhost:3000 when the server is ready...
start "" /b node "%MC_LABOR_ROOT%scripts\open-local-browser.cjs"
call npm run dev -- --hostname 127.0.0.1 --port 3000
if errorlevel 1 goto failed
exit /b 0

:failed
echo.
echo MC Labor could not start. Review the error above.
pause
exit /b 1
