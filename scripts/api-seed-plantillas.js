/**
 * Script para poblar plantillas de WhatsApp vía API
 * Ejecutar con: node scripts/api-seed-plantillas.js
 *
 * IMPORTANTE: Asegúrate de que tu servidor Strapi esté corriendo en http://localhost:1337
 * y que tengas un API token válido o hayas deshabilitado la autenticación para plantillas
 */

const { plantillasEjemplo } = require("../database/seeds/plantillas-whatsapp");

const STRAPI_URL = "http://localhost:1337/api";

// Función para extraer campos variables
function extraerCamposVariables(contenido) {
  return Array.from(
    new Set(
      (contenido.match(/\{([^}]+)\}/g) || []).map((match) =>
        match.slice(1, -1),
      ),
    ),
  );
}

async function crearPlantilla(plantilla, token) {
  const camposVariables = extraerCamposVariables(plantilla.contenido);

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${STRAPI_URL}/plantillas-whatsapp`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      data: {
        nombre: plantilla.nombre,
        icono: plantilla.icono,
        contenido: plantilla.contenido,
        campos_variables: camposVariables,
        activo: plantilla.activo,
        orden: plantilla.orden,
        servicio: null,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return await response.json();
}

async function verificarPlantillasExistentes(token) {
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${STRAPI_URL}/plantillas-whatsapp?pagination[pageSize]=100`,
    {
      headers,
    },
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.data || [];
}

async function seedPlantillas() {
  console.log("🌱 Iniciando seed de plantillas WhatsApp via API...\n");
  console.log(`📡 Conectando a: ${STRAPI_URL}`);
  console.log(`📦 Plantillas a crear: ${plantillasEjemplo.length}\n`);

  // Nota: Si tu API requiere autenticación, necesitarás un token
  // Puedes obtenerlo desde el admin panel de Strapi (Settings > API Tokens)
  const API_TOKEN = process.env.STRAPI_API_TOKEN || null;

  if (!API_TOKEN) {
    console.log(
      "⚠️  No se encontró STRAPI_API_TOKEN en las variables de entorno.",
    );
    console.log("   Si la API requiere autenticación, el seed fallará.");
    console.log(
      "   Puedes crear un token en: Strapi Admin > Settings > API Tokens\n",
    );
  }

  try {
    // Verificar plantillas existentes
    console.log("🔍 Verificando plantillas existentes...");
    const plantillasExistentes = await verificarPlantillasExistentes(API_TOKEN);
    const nombresExistentes = plantillasExistentes.map((p) => p.nombre);

    if (plantillasExistentes.length > 0) {
      console.log(`⚠️  Ya existen ${plantillasExistentes.length} plantillas:`);
      nombresExistentes.forEach((nombre) => console.log(`   - ${nombre}`));
      console.log("");
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const plantilla of plantillasEjemplo) {
      try {
        // Verificar si ya existe
        if (nombresExistentes.includes(plantilla.nombre)) {
          console.log(`⏭️  "${plantilla.nombre}" ya existe, omitiendo...`);
          skipped++;
          continue;
        }

        // Crear plantilla
        await crearPlantilla(plantilla, API_TOKEN);
        console.log(`✅ "${plantilla.nombre}" creada ${plantilla.icono}`);
        created++;

        // Pequeña pausa para no sobrecargar la API
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error creando "${plantilla.nombre}":`, error.message);
        errors++;
      }
    }

    console.log(`\n🎉 Seed completado:`);
    console.log(`   ✅ ${created} plantillas creadas`);
    console.log(`   ⏭️  ${skipped} plantillas omitidas`);
    if (errors > 0) {
      console.log(`   ❌ ${errors} errores`);
    }
    console.log("");
  } catch (error) {
    console.error("\n❌ Error ejecutando seed:", error.message);
    console.error("");
    console.error("💡 Sugerencias:");
    console.error(
      "   1. Verifica que Strapi esté corriendo en http://localhost:1337",
    );
    console.error(
      '   2. Verifica que el content-type "plantilla-whatsapp" exista',
    );
    console.error("   3. Si la API requiere auth, crea un token y ejecuta:");
    console.error(
      "      STRAPI_API_TOKEN=tu_token node scripts/api-seed-plantillas.js",
    );
    console.error("");
    process.exit(1);
  }
}

// Ejecutar
seedPlantillas();
