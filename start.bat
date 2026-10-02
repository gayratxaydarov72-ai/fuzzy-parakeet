@echo off
chcp 65001 > nul
title NVINDIA GAMES Mini App Launcher
cls
echo ===================================================
echo        🎮 NVINDIA GAMES BARCHASI BIRDA LAUNCHER
echo ===================================================
echo.
echo 1) Faqat WebApp Serverni ishga tushirish (Brauzer)
echo 2) Hammasini bittada ishga tushirish (Server + Bot)
echo.
set /p opt="Tanlovingizni kiriting (1/2): "

if "%opt%"=="1" (
    echo.
    echo [INFO] WebApp server ishga tushirilmoqda...
    python server.py
) else (
    echo.
    echo [INFO] NVINDIA GAMES Server va Telegram Bot ishga tushirilmoqda...
    python bot.py
)
pause
