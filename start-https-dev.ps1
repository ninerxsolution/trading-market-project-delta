# PowerShell script to start Next.js dev server and ngrok tunnel
# Make sure ngrok is installed and configured first

Write-Host "Starting Next.js dev server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "Starting ngrok tunnel..." -ForegroundColor Green
Write-Host "Copy the HTTPS URL from ngrok and use it in Roblox OAuth settings!" -ForegroundColor Cyan
Write-Host ""

ngrok http 3000

