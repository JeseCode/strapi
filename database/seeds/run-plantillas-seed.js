// Script para ejecutar el seed de plantillas WhatsApp
const { plantillasEjemplo } = require("./plantillas-whatsapp");

async function seedPlantillas() {
  const strapi = require("../../src/index");

  try {
    console.log("🌱 Iniciando seed de plantillas WhatsApp...");

    // Conectar a Strapi
    const app = await strapi();

    // Obtener el servicio de plantillas
    const plantillaService = strapi.service(
      "api::plantilla-whatsapp.plantilla-whatsapp",
    );

    // Verificar si ya existen plantillas
    const existingPlantillas = await strapi.entityService.findMany(
      "api::plantilla-whatsapp.plantilla-whatsapp",
    );

    if (existingPlantillas.length > 0) {
      console.log(
        `⚠️  Ya existen ${existingPlantillas.length} plantillas en la base de datos.`,
      );
      console.log(
        "❓ ¿Deseas eliminarlas y crear nuevas? (Este script creará las plantillas de todas formas)",
      );
    }

    // Crear cada plantilla
    let created = 0;
    let skipped = 0;

    for (const plantilla of plantillasEjemplo) {
      try {
        // Verificar si ya existe una plantilla con este nombre
        const existing = await strapi.db
          .query("api::plantilla-whatsapp.plantilla-whatsapp")
          .findOne({
            where: { nombre: plantilla.nombre },
          });

        if (existing) {
          console.log(
            `⏭️  Plantilla "${plantilla.nombre}" ya existe, omitiendo...`,
          );
          skipped++;
          continue;
        }

        // Extraer campos variables del contenido
        const camposVariables = Array.from(
          new Set(
            (plantilla.contenido.match(/\{([^}]+)\}/g) || []).map((match) =>
              match.slice(1, -1),
            ),
          ),
        );

        // Crear la plantilla
        await strapi.entityService.create(
          "api::plantilla-whatsapp.plantilla-whatsapp",
          {
            data: {
              ...plantilla,
              campos_variables: camposVariables,
              servicio: null, // Se puede vincular manualmente después
            },
          },
        );

        console.log(`✅ Plantilla "${plantilla.nombre}" creada exitosamente`);
        created++;
      } catch (error) {
        console.error(
          `❌ Error creando plantilla "${plantilla.nombre}":`,
          error.message,
        );
      }
    }

    console.log(`\n🎉 Seed completado:`);
    console.log(`   - ${created} plantillas creadas`);
    console.log(`   - ${skipped} plantillas omitidas (ya existían)`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error ejecutando seed:", error);
    process.exit(1);
  }
}

seedPlantillas();
