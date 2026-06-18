$ErrorActionPreference = 'Stop'

# Microsoft Partner Center identity values
$env:MS_STORE_IDENTITY_NAME = 'MarcosNunes.SaldoFcil'
$env:MS_STORE_PUBLISHER = 'CN=A72FE73A-3E4B-4A02-BA11-61A5278E9134'
$env:MS_STORE_PUBLISHER_DISPLAY_NAME = 'Marcos Roberto Nunes Lindolpho'

Write-Host 'Generating Microsoft Store AppX package...' -ForegroundColor Cyan
npm run desktop:appx

if ($LASTEXITCODE -ne 0) {
  throw 'desktop:appx failed.'
}

Write-Host 'AppX generated successfully.' -ForegroundColor Green
Write-Host 'Output folder: release' -ForegroundColor Yellow
