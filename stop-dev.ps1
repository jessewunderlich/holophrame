# Stop Holophrame Development Servers

Write-Host "Stopping Holophrame servers..." -ForegroundColor Yellow
Write-Host ""

# Get all running jobs
$jobs = Get-Job | Where-Object { $_.State -eq "Running" }

if ($jobs.Count -eq 0) {
    Write-Host "No running background jobs found." -ForegroundColor Gray
    Write-Host ""
    Write-Host "If servers are still running in terminals, close those terminals." -ForegroundColor Yellow
} else {
    Write-Host "Found $($jobs.Count) running job(s):" -ForegroundColor Cyan
    $jobs | Format-Table Id, Name, State
    
    Write-Host "Stopping all jobs..." -ForegroundColor Yellow
    Stop-Job -Job $jobs
    Remove-Job -Job $jobs
    
    Write-Host "✓ All jobs stopped and removed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Servers stopped." -ForegroundColor Green
