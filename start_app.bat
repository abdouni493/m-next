@echo off
cd /d "C:\Users\Administrator\Desktop\ M-Next"
start cmd /k "npm run start"
timeout /t 8 >nul
start http://localhost:8080/
