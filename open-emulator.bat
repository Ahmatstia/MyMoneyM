@echo off
echo ==============================
echo    ANDROID EMULATOR LAUNCHER
echo ==============================
echo.

echo Checking available AVDs...
cd /d "C:\Users\ACER\AppData\Local\Android\Sdk\emulator"
emulator -list-avds

echo.
echo Launching Pixel 4...
start "" "emulator.exe" @Pixel_4 -no-snapshot-save -no-boot-anim

echo Emulator is starting...
timeout /t 5 /nobreak
echo Done! Check your screen for emulator window.
pause