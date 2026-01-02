# Script para ejecutar la aplicación Android con las variables de entorno configuradas

# Configurar variables de entorno de Android
$env:ANDROID_HOME = "C:\Users\Usuario\AppData\Local\Android\Sdk"
$env:Path = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin;$env:Path"

# Configurar NODE_OPTIONS para resolver problemas de OpenSSL con Metro
$env:NODE_OPTIONS = "--openssl-legacy-provider"

# Verificar si hay dispositivos conectados
$devices = & "$env:ANDROID_HOME\platform-tools\adb.exe" devices | Select-String "device$"
if ($devices.Count -eq 0) {
    Write-Host "No hay dispositivos conectados. Iniciando emulador..." -ForegroundColor Yellow
    Start-Process -FilePath "$env:ANDROID_HOME\emulator\emulator.exe" -ArgumentList "-avd", "Medium_Phone", "-no-snapshot-load" -WindowStyle Normal
    Write-Host "Esperando a que el emulador inicie..." -ForegroundColor Yellow
    Start-Sleep -Seconds 25
    & "$env:ANDROID_HOME\platform-tools\adb.exe" wait-for-device
    Write-Host "Emulador listo!" -ForegroundColor Green
}

# Cambiar al directorio mobile
Set-Location packages\mobile

# Verificar si Metro ya está corriendo en el puerto 8081
$metroRunning = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if (-not $metroRunning) {
    Write-Host "Iniciando Metro bundler..." -ForegroundColor Cyan
    # Iniciar Metro en una nueva ventana de PowerShell
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; `$env:NODE_OPTIONS='--openssl-legacy-provider'; npx react-native start"
    Write-Host "Esperando a que Metro inicie..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
} else {
    Write-Host "Metro bundler ya está corriendo." -ForegroundColor Green
}

# Ejecutar la aplicación sin iniciar un nuevo Metro
Write-Host "Ejecutando aplicación Android..." -ForegroundColor Cyan
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
npx react-native run-android --no-packager

# Volver al directorio raíz
Set-Location ..\..
