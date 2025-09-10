#requires -RunAsAdministrator
<#
CBT Local Institution - Windows One-Click Installer
- Installs Node.js LTS (via winget) if missing
- Installs PM2 globally
- Verifies MongoDB service (assumes MongoDB Community Server is installed)
- Prepares .env from env.example if not present
- Runs npm ci
- Starts the app with PM2 and enables startup on boot
#>

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[ERR]  $msg" -ForegroundColor Red }

# Resolve paths
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $Root
$BackendPath = Join-Path $ProjectRoot 'backend'
$EnvExample = Join-Path $BackendPath 'env.example'
$EnvFile = Join-Path $BackendPath '.env'
$ServerJs = Join-Path $BackendPath 'src/server.js'

Write-Info "Project root: $ProjectRoot"
Write-Info "Backend: $BackendPath"

# Check Node
try {
  $nodeVersion = node -v 2>$null
  if (-not $nodeVersion) { throw 'Node missing' }
  Write-Ok "Node detected: $nodeVersion"
} catch {
  Write-Warn "Node.js not found. Installing Node.js LTS via winget..."
  winget install OpenJS.NodeJS.LTS -h --accept-package-agreements --accept-source-agreements | Out-Null
  $nodeVersion = node -v
  Write-Ok "Node installed: $nodeVersion"
}

# Install PM2
try {
  $pm2Version = pm2 -v 2>$null
  if (-not $pm2Version) { throw 'PM2 missing' }
  Write-Ok "PM2 detected: $pm2Version"
} catch {
  Write-Info "Installing PM2 globally..."
  npm install -g pm2 | Out-Null
  $pm2Version = pm2 -v
  Write-Ok "PM2 installed: $pm2Version"
}

# Check MongoDB service
try {
  $svc = Get-Service -Name 'MongoDB' -ErrorAction Stop
  if ($svc.Status -ne 'Running') {
    Write-Warn "MongoDB service is $($svc.Status). Attempting to start..."
    Start-Service -Name 'MongoDB'
    $svc.WaitForStatus('Running','00:00:20')
  }
  Write-Ok "MongoDB service running."
} catch {
  Write-Warn "MongoDB service not found. Please install MongoDB Community Server before running this script."
  Write-Host "Download: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
  throw
}

# Prepare env
if (-not (Test-Path $EnvFile)) {
  if (Test-Path $EnvExample) {
    Copy-Item $EnvExample $EnvFile
    (Get-Content $EnvFile) | ForEach-Object { $_ -replace 'JWT_SECRET=your-super-secret-jwt-key-change-this-in-production', 'JWT_SECRET=please-change-me' } | Set-Content $EnvFile
    Write-Ok ".env created from env.example"
  } else {
    Write-Warn "env.example not found; creating a minimal .env"
    @(
      'NODE_ENV=production'
      'PORT=5000'
      'MONGODB_URI=mongodb://localhost:27017/cbt_local'
      'JWT_SECRET=please-change-me'
    ) | Set-Content $EnvFile
  }
} else {
  Write-Info ".env already exists; leaving as-is"
}

# Install backend deps
Push-Location $BackendPath
try {
  if (Test-Path 'package-lock.json') {
    Write-Info "Running npm ci..."
    npm ci
  } else {
    Write-Info "Running npm install..."
    npm install
  }
  Write-Ok "Dependencies installed"
} finally {
  Pop-Location
}

# Start via PM2
Write-Info "Starting app with PM2..."
Push-Location $BackendPath
try {
  pm2 delete cbt-local 2>$null | Out-Null
  pm2 start $ServerJs --name cbt-local --time
  pm2 save
  pm2 startup windows | Out-Null
  Write-Ok "App started and PM2 startup configured"
  Write-Host "Admin UI: http://localhost:5000/admin" -ForegroundColor Green
  Write-Host "Student UI: http://localhost:5000/student" -ForegroundColor Green
  Write-Host "Health:    http://localhost:5000/health" -ForegroundColor Green
} finally {
  Pop-Location
}
