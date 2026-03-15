@echo off
title Mithya Backend Services
cd /d "%~dp0"

echo ==============================================
echo   🚀 STARTING MITHYA BACKEND SERVICES
echo ==============================================

echo [1/2] Starting MongoDB Background Worker (workers.py)...
start "Mithya Tracker Worker" cmd /k "python workers.py"

echo [2/2] Starting Live API Server (app.py)...
start "Mithya API Server" cmd /k "python app.py"

echo.
echo ==============================================
echo ✅ Both services are now running!
echo 1. The tracker is silently updating MongoDB every 3 minutes.
echo 2. The API server is live at http://127.0.0.1:5000/api/search
echo 
echo You can now search for slots in your React website!
echo ==============================================
pause
