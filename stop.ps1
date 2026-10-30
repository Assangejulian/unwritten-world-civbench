$ErrorActionPreference = 'Stop'
$taskPidFile = Join-Path $PSScriptRoot 'logs\server.pid'
if (-not (Test-Path -LiteralPath $taskPidFile)) { Write-Host 'No launcher-owned game server was found.'; exit 0 }
$taskServerPid = [int](Get-Content -LiteralPath $taskPidFile -Raw)
$taskProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $taskServerPid"
$taskServerPath = Join-Path $PSScriptRoot 'server.mjs'
if ($taskProcess) {
    if ($taskProcess.Name -ne 'node.exe' -or -not $taskProcess.CommandLine.Contains($taskServerPath)) { throw 'The recorded PID belongs to a different process. No process was stopped.' }
    Stop-Process -Id $taskServerPid
    Write-Host 'The Hex Civilizations server has stopped.'
} else { Write-Host 'The game server is already stopped.' }
Remove-Item -LiteralPath $taskPidFile
