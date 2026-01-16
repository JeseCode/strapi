@echo off
echo 🌱 Seeding WhatsApp Templates...
echo.

set STRAPI_URL=http://localhost:1337/api

REM Netflix
curl -X POST "%STRAPI_URL%/plantillas-whatsapp" ^
  -H "Content-Type: application/json" ^
  -d "{\"data\":{\"nombre\":\"Netflix\",\"icono\":\"🔴\",\"contenido\":\"🔴 *NETFLIX* -\n🎬 *1 PANTALLA para Tv, Cel O Pc*\n\n📧 {email}\n🔐 *Contraseña*: {password}\n👤 *Usar el Perfil:* {perfil} || *Pin:* {pin}\n⚠️ *Vence*: {vencimiento}\n\n👀 *Si le quieres colocar tu nombre al perfil hazlo pero déjale el Nro. asignado por delante por favor, ejemplo: (1- Tu nombre)*\n\n🚫 *NO cambiar contraseñas*\n🚫 *NO ver en varios dispositivos, si compro 1 pantalla es para un solo dispositivo a la vez*\n⚠️ *Evite Perder la Garantía* ⚠️\",\"campos_variables\":[\"email\",\"password\",\"perfil\",\"pin\",\"vencimiento\"],\"activo\":true,\"orden\":1}}"

echo ✅ Netflix creada

REM Add more as needed...

echo.
echo 🎉 Seed completado!
pause
