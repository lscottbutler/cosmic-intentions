@echo off
echo ============================================================
echo  VIBE PREVIEW - live auto-reloading preview on port 8080
echo  Open this in VS Code Simple Browser (Ctrl+Shift+P):
echo    http://127.0.0.1:8080/player/template.html
echo  Edits auto-refresh. Close this window to stop the server.
echo ============================================================
cd /d "%~dp0"
npx --yes live-server . --port=8080 --no-browser --watch=player,images --ignore=node_modules --entry-file=player/template.html
