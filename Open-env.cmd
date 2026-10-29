@echo off
cd /d "%~dp0"
if not exist ".env" (
  if not exist ".env.example" (
    echo Extract the full project ZIP first, then run this file from the project folder.
    pause
    exit /b 1
  )
  copy ".env.example" ".env" >nul
)
start "" notepad.exe ".env"
