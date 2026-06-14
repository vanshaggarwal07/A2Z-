# Amazon Neighborhood - AWS Deployment Script (Free Tier)
# Prerequisites: AWS CLI configured, Node.js installed

Write-Host "=== Amazon Neighborhood - AWS Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install app dependencies and build
Write-Host "[1/4] Installing app dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "Failed to install dependencies" -ForegroundColor Red; exit 1 }

Write-Host "[2/4] Building the app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed" -ForegroundColor Red; exit 1 }

# Step 2: Install CDK dependencies
Write-Host "[3/4] Setting up infrastructure..." -ForegroundColor Yellow
Push-Location infra
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "Failed to install CDK dependencies" -ForegroundColor Red; Pop-Location; exit 1 }

# Step 3: Bootstrap CDK (first time only) and deploy
Write-Host "[4/4] Deploying to AWS..." -ForegroundColor Yellow
npx cdk bootstrap
npx cdk deploy --require-approval never
if ($LASTEXITCODE -ne 0) { Write-Host "Deployment failed" -ForegroundColor Red; Pop-Location; exit 1 }

Pop-Location

Write-Host ""
Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host "Your site URL will be shown in the outputs above (SiteURL)." -ForegroundColor Cyan
Write-Host "It may take a few minutes for CloudFront to fully propagate." -ForegroundColor Cyan
