# One command on a fresh Windows PC: set up MiroFish with our patches, run the 9 frozen runs,
# score them, and push the data and results to this branch.
#   powershell -ExecutionPolicy Bypass -File swarm\desktop_run.ps1 [-Parallel 3]
# Safe to re-run: finished set-up steps and finished runs are skipped.
param([int]$Parallel = 3)
$ErrorActionPreference = 'Stop'
$Repo = Split-Path -Parent $PSScriptRoot
$Root = Split-Path -Parent $Repo
$MiroFish = Join-Path $Root 'MiroFish'
$Runs = Join-Path $Root 'swarm-runs'
$Py = @('run', '--no-project', '--python', '3.12', 'python')

function Step($m) { Write-Host "`n== $(Get-Date -Format HH:mm) $m" -ForegroundColor Cyan }
function Exec([scriptblock]$Cmd, [string]$What) { & $Cmd; if ($LASTEXITCODE -ne 0) { throw "$What failed (exit $LASTEXITCODE)" } }

Step 'uv'
# A terminal opened before uv was installed has a stale PATH; winget then fails with "no upgrade".
$env:Path += ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Exec { winget install --id astral-sh.uv -e --accept-source-agreements --accept-package-agreements } 'installing uv'
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}
Exec { uv --version } 'uv'

Step 'MiroFish with our 4 patches'
if (-not (Test-Path $MiroFish)) { Exec { git clone https://github.com/666ghj/MiroFish $MiroFish } 'cloning MiroFish' }
git -C $MiroFish rev-parse --verify --quiet tok-society | Out-Null
if ($LASTEXITCODE -ne 0) {
    Exec { git -C $MiroFish fetch (Join-Path $Repo 'swarm\mirofish-tok-society.bundle') tok-society:tok-society } 'loading the patch bundle'
}
Exec { git -C $MiroFish switch tok-society } 'switching to the patched branch'
Push-Location (Join-Path $MiroFish 'backend'); try { Exec { uv sync } 'uv sync' } finally { Pop-Location }

Step 'OpenAI key'
$EnvFile = Join-Path $MiroFish '.env'
if (-not ((Test-Path $EnvFile) -and (Select-String -Path $EnvFile -Pattern '^LLM_API_KEY=.+' -Quiet))) {
    $sec = Read-Host 'Paste your OpenAI API key (hidden)' -AsSecureString
    $key = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)).Trim()
    $lines = "LLM_API_KEY=$key", 'LLM_BASE_URL=https://api.openai.com/v1', 'LLM_MODEL_NAME=gpt-5.5',
             'LLM_TIER1_MODEL=gpt-5.5', 'LLM_TIER2_MODEL=gpt-5.4-mini', 'LLM_TIER3_MODEL=gpt-5-mini'
    # No BOM: python-dotenv would read it as part of the first key's name.
    [IO.File]::WriteAllText($EnvFile, ($lines -join "`n") + "`n", (New-Object Text.UTF8Encoding $false))
}
$key = ((Select-String -Path $EnvFile -Pattern '^LLM_API_KEY=(.+)$').Matches[0].Groups[1].Value).Trim()
$models = (Invoke-RestMethod -Uri 'https://api.openai.com/v1/models' -Headers @{ Authorization = "Bearer $key" }).data.id
foreach ($m in 'gpt-5.5', 'gpt-5.4-mini', 'gpt-5-mini') { if ($models -notcontains $m) { throw "key has no access to $m" } }
Write-Host 'key works; all three tier models available'

Step "Running the 9 runs, $Parallel at a time (about 80-90 min per wave)"
if (-not (Test-Path $Runs)) { Copy-Item -Recurse (Join-Path $Repo 'swarm\runs') $Runs }
# Keep the PC awake for as long as this script runs, without changing power settings.
Add-Type -Namespace Swarm -Name Power -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint f);'
[void][Swarm.Power]::SetThreadExecutionState([uint32]'0x80000001')
Exec { uv @Py (Join-Path $Repo 'swarm\run_all.py') $Runs --parallel $Parallel } 'runs'

Step 'Scoring'
$dirs = @(Get-ChildItem $Runs -Directory | Where-Object Name -match '^0\d_' | ForEach-Object FullName)
uv @Py (Join-Path $Repo 'swarm\score.py') judge @dirs
uv @Py (Join-Path $Repo 'swarm\score.py') report $Runs

Step 'Pushing the data and results to GitHub'
$Out = Join-Path $Repo 'swarm\records\results'
New-Item -ItemType Directory -Force $Out | Out-Null
foreach ($f in 'results.md', 'results.json') { if (Test-Path (Join-Path $Runs $f)) { Copy-Item (Join-Path $Runs $f) $Out } }
foreach ($d in $dirs) {
    $t = Join-Path $Out (Split-Path $d -Leaf); New-Item -ItemType Directory -Force $t | Out-Null
    foreach ($f in 'run_meta.json', 'interviews.json', 'scores.jsonl') { if (Test-Path "$d\$f") { Copy-Item "$d\$f" $t } }
    foreach ($p in 'twitter', 'reddit') {
        if (Test-Path "$d\$p\actions.jsonl") { Copy-Item "$d\$p\actions.jsonl" "$t\$p-actions.jsonl" }
        if (Test-Path "$d\$p\activation.jsonl") { Copy-Item "$d\$p\activation.jsonl" "$t\$p-activation.jsonl" }
    }
}
git -C $Repo config user.name 'Muhammad Ahmed'
git -C $Repo config user.email '266575487+meep-boop@users.noreply.github.com'
Exec { git -C $Repo add swarm/records/results } 'git add'
Exec { git -C $Repo commit -m 'Add the 9 Tok society runs and their scores' -m 'Run on the desktop with swarm/desktop_run.ps1: each run''s actions, activation, interviews, judge scores and metadata, plus results.md with the four checks. Raw databases and runner logs stay on the PC.' } 'git commit'
Exec { git -C $Repo pull --rebase } 'git pull'
Exec { git -C $Repo push } 'git push'
Step 'Done. Results: swarm/records/results/results.md'
