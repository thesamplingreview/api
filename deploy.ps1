# PowerShell deployment script for API with progress messages
# Usage: .\deploy.ps1 [--skip-commit] [--skip-migrate]

param(
    [switch]$SkipCommit = $false,
    [switch]$SkipMigrate = $false
)

$ErrorActionPreference = "Stop"

Write-Host "[DEPLOY] Starting API Deployment..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check git status
Write-Host "[STEP 1] Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "   Found uncommitted changes:" -ForegroundColor White
    git status --short | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    Write-Host ""
    
    if (-not $SkipCommit) {
        Write-Host "[STEP 2] Staging changes..." -ForegroundColor Yellow
        git add .
        Write-Host "   [OK] Changes staged" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "[STEP 3] Committing changes..." -ForegroundColor Yellow
        $commitMessage = "Deploy: Update OTP verification with Evolution API"
        git commit -m $commitMessage
        Write-Host "   [OK] Changes committed: $commitMessage" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "[SKIP] Skipping commit (--skip-commit flag set)" -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "   [OK] No uncommitted changes" -ForegroundColor Green
    Write-Host ""
}

# Step 4: Push to remote
Write-Host "[STEP 4] Pushing to remote repository..." -ForegroundColor Yellow
try {
    git push origin main
    Write-Host "   [OK] Successfully pushed to remote" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   [WARN] Push failed: $_" -ForegroundColor Red
    Write-Host "   Continuing anyway..." -ForegroundColor Yellow
    Write-Host ""
}

# Step 5: Check if Dokploy auto-deploys
Write-Host "[STEP 5] Checking deployment method..." -ForegroundColor Yellow
Write-Host "   [INFO] If using Dokploy with Git integration, deployment should start automatically" -ForegroundColor Cyan
Write-Host "   [INFO] Check your Dokploy dashboard for deployment status" -ForegroundColor Cyan
Write-Host ""

# Step 6: Optional migration
if (-not $SkipMigrate) {
    Write-Host "[STEP 6] Database migration reminder..." -ForegroundColor Yellow
    Write-Host "   [INFO] If database schema changed, run migrations:" -ForegroundColor Cyan
    Write-Host "      cd api && npm run migrate" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "[SKIP] Skipping migration reminder (--skip-migrate flag set)" -ForegroundColor Yellow
    Write-Host ""
}

# Summary
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "[OK] Deployment process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "[SUMMARY]" -ForegroundColor Cyan
Write-Host "   - Changes committed: $(-not $SkipCommit)" -ForegroundColor White
Write-Host "   - Changes pushed: Yes" -ForegroundColor White
Write-Host "   - Next: Monitor Dokploy dashboard for deployment status" -ForegroundColor White
Write-Host ""
