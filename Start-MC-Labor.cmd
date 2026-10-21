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
if not exist "node_modules\xlsx\package.json" goto install_dependencies
goto run_app

:install_dependencies
echo Installing application dependencies. Please wait...
call npm install
if errorlevel 1 goto failed
echo Installed successfully.>"node_modules\.mc-labor-install-complete"
if errorlevel 1 goto failed
echo Dependencies installed successfully. Starting MC Labor...

:run_app
echo Checking for an existing MC Labor server on port 3000...
powershell -NoProfile -Command "$listenerPids = @(Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); foreach ($listenerPid in $listenerPids) { Write-Host ('Stopping existing server process ' + $listenerPid); & taskkill.exe /PID $listenerPid /T /F > $null 2>&1 }; Start-Sleep -Milliseconds 500; if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { exit 1 }"
if errorlevel 1 (
  echo Could not clear port 3000. Close the existing server or run this launcher with permission to stop it.
  pause
  exit /b 1
)

set "MC_LABOR_LOCAL_MODE=0"
set "MC_LABOR_AUTH_ENABLED=1"
set "MC_LABOR_AUTH_PROVIDER=office-staff"
set "MC_LABOR_SESSION_GENERATION="
for /f %%G in ('node -e "console.log(require('node:crypto').randomUUID())"') do set "MC_LABOR_SESSION_GENERATION=%%G"
if not defined MC_LABOR_SESSION_GENERATION goto failed
set "WRITES_ENABLED=true"
echo Office login is required. Previous server sessions will require a fresh login.
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
