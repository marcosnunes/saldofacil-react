$ErrorActionPreference = 'Stop'

# Microsoft Partner Center identity values
$env:MS_STORE_IDENTITY_NAME = '9694MarcosNunes.SaldoFacilA'
$env:MS_STORE_PUBLISHER = 'CN=73BB02F8-A7B8-4931-B83C-70AFB7116E85'
$env:MS_STORE_PUBLISHER_DISPLAY_NAME = 'Marcos Nunes'
$env:MS_STORE_DISPLAY_NAME = 'Saldo Fácil IA'

Write-Host 'Generating Microsoft Store AppX package...' -ForegroundColor Cyan
npm run desktop:appx

if ($LASTEXITCODE -ne 0) {
  throw 'desktop:appx failed.'
}

Write-Host 'AppX generated successfully.' -ForegroundColor Green
Write-Host 'Output folder: release' -ForegroundColor Yellow
