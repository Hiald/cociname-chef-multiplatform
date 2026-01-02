# Script para configurar variables de entorno de Android
# Ejecuta este script antes de trabajar con React Native: .\setup-android-env.ps1

$env:ANDROID_HOME = "C:\Users\Usuario\AppData\Local\Android\Sdk"
$env:Path += ";C:\Users\Usuario\AppData\Local\Android\Sdk\platform-tools"
$env:Path += ";C:\Users\Usuario\AppData\Local\Android\Sdk\emulator"
$env:Path += ";C:\Users\Usuario\AppData\Local\Android\Sdk\tools"
$env:Path += ";C:\Users\Usuario\AppData\Local\Android\Sdk\tools\bin"

Write-Host "✓ Variables de entorno de Android configuradas" -ForegroundColor Green
Write-Host "ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comandos disponibles:" -ForegroundColor Yellow
Write-Host "  - adb devices       : Ver dispositivos conectados"
Write-Host "  - emulator -list-avds : Listar emuladores"
Write-Host "  - yarn android:start : Iniciar app Android"
