$ErrorActionPreference = 'Stop'
$taskTools = Join-Path $PSScriptRoot 'tools'
$taskBinary = Join-Path $taskTools 'zig-windows-x86_64-0.13.0\zig.exe'
if (Test-Path -LiteralPath $taskBinary) { Write-Host 'The portable C++ compiler is already installed.'; exit 0 }
New-Item -ItemType Directory -Path $taskTools -Force | Out-Null
$taskIndex = Invoke-RestMethod -Uri 'https://ziglang.org/download/index.json' -TimeoutSec 45
$taskRelease = $taskIndex.'0.13.0'.'x86_64-windows'
$taskArchive = Join-Path $taskTools 'zig-0.13.0.zip'
Write-Host 'Downloading official Zig 0.13.0...'
Invoke-WebRequest -Uri $taskRelease.tarball -OutFile $taskArchive -UseBasicParsing -TimeoutSec 180
$taskHash = (Get-FileHash -LiteralPath $taskArchive -Algorithm SHA256).Hash.ToLowerInvariant()
if ($taskHash -ne $taskRelease.shasum) { throw 'Compiler archive failed SHA-256 verification.' }
Expand-Archive -LiteralPath $taskArchive -DestinationPath $taskTools
@{version='0.13.0';url=$taskRelease.tarball;sha256=$taskHash;size=(Get-Item -LiteralPath $taskArchive).Length} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $taskTools 'toolchain.json') -Encoding utf8
Write-Host 'Portable compiler ready. Run Start.cmd.'
