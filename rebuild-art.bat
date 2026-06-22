@echo off
REM ===== Cosmic Intentions — rebuild the Art Frame rotation =====
REM Drop square images into the  art  folder, then double-click this file.
cd /d C:\WORK\ROOT

echo.
echo Rebuilding art rotation from the  art  folder...
node scripts\build-art.mjs
if errorlevel 1 ( echo. & echo Something went wrong running the build script. & pause & exit /b 1 )

echo.
echo Publishing to the live site...
git add images/art
git commit -m "art: auto-rebuild rotation" || echo (no changes to publish)
git push

echo.
echo ============================================================
echo  Done. Give the site about a minute, then refresh the
echo  Art Frame in the dashboard to see your new art in rotation.
echo ============================================================
echo.
pause
