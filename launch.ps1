param([switch]$SkipBrowser, [switch]$Browser)
$ErrorActionPreference = 'Stop'
$taskPort = 43821
$taskUrl = "http://127.0.0.1:$taskPort/"
if (-not $SkipBrowser -and -not $Browser) {
    $taskGameExe = Join-Path $PSScriptRoot 'HexCivilizations.exe'
    if (-not (Test-Path -LiteralPath $taskGameExe)) { throw 'The desktop game executable is missing.' }
    Start-Process -FilePath $taskGameExe -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    exit 0
}
$taskNode = Join-Path $PSScriptRoot 'tools\node.exe'
if (-not (Test-Path -LiteralPath $taskNode)) {
    $taskCommand = Get-Command node -ErrorAction SilentlyContinue
    if (-not $taskCommand) { throw 'Node.js 20 or newer is required. Install Node.js, then run Start.cmd again.' }
    $taskNode = $taskCommand.Source
}
$taskHealth = $null
try { $taskHealth = Invoke-RestMethod -Uri ($taskUrl + 'health') -TimeoutSec 2 } catch {}
if ($taskHealth -and $taskHealth.app -eq 'hex-civilizations' -and $taskHealth.project -eq $PSScriptRoot) {
    Write-Host "The game is already running at $taskUrl"
} else {
    if ($taskHealth) { throw "Port $taskPort is already used by another application." }
    Push-Location $PSScriptRoot
    try {
        & $taskNode (Join-Path $PSScriptRoot 'scripts\build.mjs')
        if ($LASTEXITCODE -ne 0) { throw 'A C++ player failed to compile. See the compiler output above.' }
        $taskLogs = Join-Path $PSScriptRoot 'logs'
        New-Item -ItemType Directory -Path $taskLogs -Force | Out-Null
        $taskServer = Join-Path $PSScriptRoot 'server.mjs'
        $taskProcess = Start-Process -FilePath $taskNode -ArgumentList ('"' + $taskServer + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskLogs 'server.log') -RedirectStandardError (Join-Path $taskLogs 'server-error.log') -PassThru
        $taskProcess.Id | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'logs\server.pid') -Encoding ascii
        $taskReady = $false
        for ($taskAttempt = 0; $taskAttempt -lt 40; $taskAttempt++) {
            Start-Sleep -Milliseconds 250
            if ($taskProcess.HasExited) { throw 'The game server exited. See logs\server-error.log.' }
            try { $taskCheck = Invoke-RestMethod -Uri ($taskUrl + 'health') -TimeoutSec 1; if ($taskCheck.app -eq 'hex-civilizations' -and $taskCheck.project -eq $PSScriptRoot) { $taskReady = $true; break } } catch {}
        }
        if (-not $taskReady) { throw "The server did not become ready at $taskUrl" }
        Write-Host "Hex Civilizations is ready at $taskUrl"
    } finally { Pop-Location }
}
if (-not $SkipBrowser) { try { Start-Process $taskUrl } catch { Write-Host "Open this address in your browser: $taskUrl" } }
