# Holophrame Development Start Script
# Run this to start both backend and frontend

Write-Host "Starting Holophrame..." -ForegroundColor Cyan
Write-Host ""

# Check if using MongoDB Atlas (cloud) or local MongoDB
$envFile = Join-Path $PSScriptRoot "backend\.env"
$usingAtlas = $false

if (Test-Path $envFile) {
    $mongoUri = Select-String -Path $envFile -Pattern "MONGODB_URI=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    if ($mongoUri -like "*mongodb+srv://*" -or $mongoUri -like "*mongodb.net*") {
        $usingAtlas = $true
        Write-Host "✓ Using MongoDB Atlas (cloud database)" -ForegroundColor Green
    }
}

# Only check local MongoDB if not using Atlas
if (-not $usingAtlas) {
    Write-Host "Checking MongoDB..." -ForegroundColor Yellow
    $mongoRunning = Get-Process mongod -ErrorAction SilentlyContinue

    if ($null -eq $mongoRunning) {
        Write-Host "MongoDB is not running!" -ForegroundColor Red
        Write-Host "Please start MongoDB first:" -ForegroundColor Yellow
        Write-Host "  mongod" -ForegroundColor White
        Write-Host ""
        Write-Host "Or start as Windows service:" -ForegroundColor Yellow
        Write-Host "  net start MongoDB" -ForegroundColor White
        exit 1
    }

    Write-Host "✓ MongoDB is running" -ForegroundColor Green
}
Write-Host ""

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $backendPath

Write-Host "✓ Backend starting (Job ID: $($backendJob.Id))" -ForegroundColor Green
Start-Sleep -Seconds 2
Write-Host ""

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"

# Check if Python is available
$pythonAvailable = Get-Command python -ErrorAction SilentlyContinue

if ($pythonAvailable) {
    Write-Host "Using Python HTTP server on port 8080..." -ForegroundColor Cyan
    $frontendJob = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        python -m http.server 8080
    } -ArgumentList $frontendPath
    
    Write-Host "✓ Frontend starting (Job ID: $($frontendJob.Id))" -ForegroundColor Green
} else {
    Write-Host "Python not found. Trying npx http-server..." -ForegroundColor Yellow
    $frontendJob = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        npx http-server -p 8080
    } -ArgumentList $frontendPath
    
    Write-Host "✓ Frontend starting (Job ID: $($frontendJob.Id))" -ForegroundColor Green
}

Start-Sleep -Seconds 3
Write-Host ""

# Display status
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Holophrame is running!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "  API:      http://localhost:3000/api" -ForegroundColor White
Write-Host ""
Write-Host "  Backend Job ID: $($backendJob.Id)" -ForegroundColor Gray
Write-Host "  Frontend Job ID: $($frontendJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop servers, run:" -ForegroundColor Yellow
Write-Host "  Stop-Job $($backendJob.Id), $($frontendJob.Id)" -ForegroundColor White
Write-Host "  Remove-Job $($backendJob.Id), $($frontendJob.Id)" -ForegroundColor White
Write-Host ""
Write-Host "Or use the stop script:" -ForegroundColor Yellow
Write-Host "  .\stop-dev.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser in 3 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Start-Process "http://localhost:8080"

Write-Host ""
Write-Host "Servers are running in background jobs." -ForegroundColor Green
Write-Host "Press Ctrl+C to exit this script (servers will keep running)." -ForegroundColor Yellow
Write-Host ""

# Keep script running to show logs
Write-Host "=== Backend Logs ===" -ForegroundColor Cyan
Receive-Job -Job $backendJob -Wait
