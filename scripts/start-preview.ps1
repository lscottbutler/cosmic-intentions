param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$source = Join-Path $root '_local-preview\current'
$url = 'http://127.0.0.1:8888'
$log = Join-Path $root '_local-preview\server.log'
$node = (Get-Command node.exe).Source
$vite = Join-Path $root 'node_modules\vite\bin\vite.js'
function PreviewReady {
    try {
        $response = Invoke-WebRequest "$url/standalone/module-editor.js" -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200 -and $response.Content.Contains('function saveDraft')
    } catch { return $false }
}
if (!(Test-Path "$source\CI-SESSION-CHECKPOINT.md")) { throw 'Current preview checkout is missing.' }
if (!(PreviewReady)) {
    if (Get-NetTCPConnection -LocalPort 8888 -State Listen -ErrorAction SilentlyContinue) {
        throw 'Port 8888 belongs to another server. It has been left untouched.'
    }
    $server = Start-Process -FilePath $node -ArgumentList @("`"$vite`"", '--host', '127.0.0.1', '--port', '8888', '--strictPort') -WorkingDirectory $source -WindowStyle Hidden -PassThru -RedirectStandardOutput $log -RedirectStandardError "$log.errors"
    $server.Id | Set-Content (Join-Path $root '_local-preview\server.pid')
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if (PreviewReady) { break }
        if ($server.HasExited) { throw "Preview stopped. See $log.errors" }
        Start-Sleep -Milliseconds 500
    }
    if (!(PreviewReady)) { throw "Preview did not become ready. See $log" }
}
Write-Host 'Preview ready at http://127.0.0.1:8888'
if (!$NoBrowser) {
    $chrome = @("${env:ProgramFiles}\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (!$chrome) { throw 'Google Chrome was not found. The preview server is running.' }
    Start-Process -FilePath $chrome -ArgumentList @("$url/standalone/member-design-test.html", "$url/standalone/module-editor.html")
}
