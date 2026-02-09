@echo off
setlocal

REM -------------------------------------------------
REM Resolve base path (same as %~dp0)
REM -------------------------------------------------
set "BASEPATH=%~dp0"
cd /d "%BASEPATH%"

echo === Starting services in Windows Terminal tabs ===

wt ^
  new-tab -p "Command Prompt" --title "Queue Worker" cmd /k "cd /d %BASEPATH% && php artisan queue:work --sleep=0.05 --max-jobs=0 --max-time=0" ; ^
  new-tab -p "Command Prompt" --title "Reverb" cmd /k "cd /d %BASEPATH% && php artisan reverb:start" ; ^
  new-tab -p "Command Prompt" --title "Laravel Server" cmd /k "cd /d %BASEPATH% && php artisan serve --port=8001" ; ^
  new-tab -p "Command Prompt" --title "Chat Bot" cmd /k "cd /d %BASEPATH% && node resources\js\scripts\custom_chat_bot.js"
