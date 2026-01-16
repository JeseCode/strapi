// Script para poblar plantillas de WhatsApp con ejemplos

const plantillasEjemplo = [
  {
    nombre: "Netflix",
    icono: "🔴",
    contenido: `🔴 *NETFLIX* -
🎬 *1 PANTALLA para Tv, Cel O Pc*

📧 {email}
🔐 *Contraseña*: {password}
👤 *Usar el Perfil:* {perfil} || *Pin:* {pin}
⚠️ *Vence*: {vencimiento}

👀 *Si le quieres colocar tu nombre al perfil hazlo pero déjale el Nro. asignado por delante por favor, ejemplo: (1- Tu nombre)*

🚫 *NO cambiar contraseñas*
🚫 *NO ver en varios dispositivos, si compro 1 pantalla es para un solo dispositivo a la vez*
⚠️ *Evite Perder la Garantía* ⚠️`,
    orden: 1,
    activo: true,
  },
  {
    nombre: "Disney+",
    icono: "🔵",
    contenido: `🔵 *DISNEY+ Premium* -
🎬 *1 PANTALLA*, _funciona para cualquier Dispositivo_

📧 {email}
🔐 *Contraseña*: {password}
👤 *Usar el Perfil:* {perfil} || *Pin:* {pin}
⚠️ *Vence*: {vencimiento}

👀 *Si le quieres colocar tu nombre al perfil hazlo pero déjale el Nro. asignado por delante por favor, ejemplo: (1- Tu nombre)*

🚫 *NO cambiar contraseña*
🚫 *NO ver en varios dispositivos, si compro 1 pantalla es para un solo dispositivo a la vez*
⚠️ *Evite perder la Garantía* ⚠️`,
    orden: 2,
    activo: true,
  },
  {
    nombre: "Amazon Prime",
    icono: "🔰",
    contenido: `🔰 *AMAZON PRIME* -
🎬 *1 PANTALLA*, _funciona para cualquier Dispositivo_

📧 {email}
🔐 *Contraseña*: {password}
👤 *Usar el Perfil:* {perfil}
⚠️ *Vence*: {vencimiento}

👀 *Si le quieres colocar tu nombre al perfil hazlo pero déjale el Nro. asignado por delante por favor, ejemplo: (1- Tu nombre)*

🔍 Si al *ingresar* en la cuenta pide *Código*, me avisa para enviárselo  ✅

🚫 *NO agregar Número de Teléfono a la cuenta de Amazon*
🚫 *NO cambiar contraseña*
🚫 *NO hacer compras o alquilar películas*
🚫 *NO ver en varios dispositivos, si compro 1 pantalla es para un solo dispositivo a la vez*
⚠️ *Evite perder la Garantía* ⚠️`,
    orden: 3,
    activo: true,
  },
  {
    nombre: "MAX",
    icono: "💙",
    contenido: `💙 *MAX* -
🎬 *1 PANTALLA*, _funciona para cualquier Dispositivo_

📧 {email}
🔐 *Contraseña*: {password}
👤 *Usar el Perfil:* {perfil} || *Pin:* {pin}
⚠️ *Vence*: {vencimiento}

👀 *Si le quieres colocar tu nombre al perfil hazlo pero déjale el Nro. asignado por delante por favor, ejemplo: (1- Tu nombre)*

🚫 *NO cambiar contraseña*
🚫 *NO ver en varios dispositivos, si compro 1 pantalla es para un solo dispositivo a la vez*
⚠️ *Evite perder la Garantía* ⚠️`,
    orden: 4,
    activo: true,
  },
  {
    nombre: "Plex",
    icono: "🟠",
    contenido: `🟠 *PLEX* -
🎬 *1 PANTALLA*

📧 {email}
🔐 *Contraseña*: {password}
⚠️ *Vence*: {vencimiento}

🚫 *NO modificar Contraseña o perderá la Garantía*
🚫 *NO ver en varios dispositivos, si compro 1 pantalla es para un solo dispositivo a la vez*`,
    orden: 5,
    activo: true,
  },
  {
    nombre: "Jellyfin",
    icono: "💜",
    contenido: `💜 *JELLYFIN* -
🎬 *1 PANTALLA*

🌐 *Servidor*: {servidor}
👤 *Usuario*: {usuario}
🔐 *Contraseña*: {password}

⚠️ *Vence*: {vencimiento}

🚫 *NO ver en varios dispositivos, si compro 1 pantalla es para un solo dispositivo a la vez*`,
    orden: 6,
    activo: true,
  },
  {
    nombre: "Crunchyroll",
    icono: "🟧",
    contenido: `🟧 *CRUNCHYROLL* -
🎬 *1 PANTALLA*, _funciona para cualquier Dispositivo_

📧 {email}
🔐 *Contraseña:* {password}
👤 *Usar el Perfil:* {perfil}
⚠️ *Vence:* {vencimiento}

👀 *Si le quieres colocar tu nombre al perfil hazlo pero déjale el Nro. asignado por delante por favor, ejemplo: (P1 luego Tu nombre)*

🚫 *NO cambiar contraseña*
🚫 *NO ver en varios dispositivos, si compro 1 pantalla es para un solo dispositivo a la vez*
⚠️ *Evite perder la Garantía* ⚠️`,
    orden: 7,
    activo: true,
  },
  {
    nombre: "Paramount+",
    icono: "🔷",
    contenido: `🔷 *PARAMOUNT+* -
🎬 *1 PANTALLA*, _funciona para cualquier Dispositivo_

📧 {email}
🔐 *Contraseña:* {password}
👤 *Usar el Perfil:* {perfil}
⚠️ *Vence:* {vencimiento}

👀 *Si le quieres colocar tu nombre al perfil hazlo pero déjale el Nro. asignado por delante por favor, ejemplo: (1 luego Tu nombre)*

🚫 *NO cambiar contraseña*
🚫 *NO ver en varios dispositivos, si compro 1 pantalla es para un solo dispositivo a la vez*
⚠️ *Evite perder la Garantía* ⚠️`,
    orden: 8,
    activo: true,
  },
  {
    nombre: "VIX+",
    icono: "🔶",
    contenido: `🔶 *VIX+* -
🎬 *1 PANTALLA*, _funciona para cualquier Dispositivo_

📧 {email}
🔐 *Contraseña:* {password}
👤 *Usar el Perfil:* {perfil}
⚠️ *Vence:* {vencimiento}

👀 *Si le quieres colocar tu nombre al perfil hazlo pero déjale el Nro. asignado por delante por favor, ejemplo: (P1- luego Tu nombre)*

🚫 *NO cambiar contraseña*
🚫 *NO ver en varios dispositivos, si compro 1 pantalla es para un solo dispositivo a la vez*
⚠️ *Evite perder la Garantía* ⚠️`,
    orden: 9,
    activo: true,
  },
  {
    nombre: "Apple TV",
    icono: "⚪",
    contenido: `⚪ *APPLE TV* -
🎬 *1 PANTALLA para TV o PC*

📧 {email}
🔐 *Contraseña:* {password}
⚠️ *Vence:* {vencimiento}

🚫 *NO modificar Contraseña o perderá la Garantía*
🚫 *NO ver en varios dispositivos, si compro 1 pantalla es para un solo dispositivo a la vez*`,
    orden: 10,
    activo: true,
  },
  {
    nombre: "Tele Latino",
    icono: "📡",
    contenido: `📡 *TELE LATINO* -
🎬 *1 PANTALLA x 30 días*

📧 *Usuario:* {usuario}
🔐 *Contraseña:* {password}
⚠️ *Vence:* {vencimiento}

🚫 *NO ver en varios dispositivos, si compro 1 pantalla es para un solo dispositivo a la vez*`,
    orden: 11,
    activo: true,
  },
  {
    nombre: "IPTV",
    icono: "📺",
    contenido: `📺 *IPTV* -
🎬 *1 PANTALLA*

▶️ *Nombre:* {nombre}
👤 *Usuario:* {usuario}
🔐 *Contraseña:* {password}
🌐 *URL*: {url}

⚠️ *Vence:* {vencimiento}

🚫 *NO ver en varios dispositivos, si compro 1 pantalla es para un solo dispositivo a la vez*`,
    orden: 12,
    activo: true,
  },
  {
    nombre: "YouTube Premium",
    icono: "▶️",
    contenido: `▶️ *YOUTUBE PREMIUM* -
📱 *1 Mes*

📧 {email}
🔐 *Contraseña:* {password}
⚠️ *Vence:* {vencimiento}

🚫 *NO modificar contraseña o perderá la Garantía*`,
    orden: 13,
    activo: true,
  },
  {
    nombre: "Spotify Premium",
    icono: "🎶",
    contenido: `🎶 *SPOTIFY PREMIUM* -
📱 *30 Días*

📧 {email}
🔐 *Contraseña:* {password}
⚠️ *Vence:* {vencimiento}

🚫 *NO modificar contraseña o perderá la Garantía*`,
    orden: 14,
    activo: true,
  },
  {
    nombre: "Canva Pro",
    icono: "🎨",
    contenido: `🎨 *CANVA PRO* -
📱 *Cuenta por 30 Días*

📧 {email}
🔐 *Contraseña:* {password}
🛄 *Usar Equipo:* {equipo}

⚠️ *Vence*: {vencimiento}

🚫 *NO modificar contraseña o perderá la Garantía*`,
    orden: 15,
    activo: true,
  },
];

console.log("Plantillas de ejemplo para WhatsApp:");
console.log(JSON.stringify(plantillasEjemplo, null, 2));

module.exports = { plantillasEjemplo };
