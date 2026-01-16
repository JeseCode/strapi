/**
 * Script para seedear plantillas de WhatsApp
 * Ejecutar con: npm run strapi seed-plantillas
 */

"use strict";

const {
  plantillasEjemplo,
} = require("../../../database/seeds/plantillas-whatsapp");

module.exports = {
  async bootstrap({ strapi }) {
    console.log("🌱 Iniciando seed de plantillas WhatsApp...");

    try {
      // Verificar si ya existen plantillas
      const existingPlantillas = await strapi.db
        .query("api::plantilla-whatsapp.plantilla-whatsapp")
        .findMany();

      if (existingPlantillas.length > 0) {
        console.log(
          `⚠️  Ya existen ${existingPlantillas.length} plantillas en la base de datos.`,
        );
        console.log(
          "⏭️  Omitiendo seed (elimina las plantillas manualmente si deseas recrearlas)",
        );
        return;
      }

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
          await strapi.db
            .query("api::plantilla-whatsapp.plantilla-whatsapp")
            .create({
              data: {
                ...plantilla,
                campos_variables: camposVariables,
                servicio: null,
              },
            });

          console.log(`✅ Plantilla "${plantilla.nombre}" creada`);
          created++;
        } catch (error) {
          console.error(
            `❌ Error creando plantilla "${plantilla.nombre}":`,
            error.message,
          );
        }
      }

      console.log(`\n🎉 Seed completado:`);
      console.log(`   ✅ ${created} plantillas creadas`);
      console.log(`   ⏭️  ${skipped} plantillas omitidas`);
    } catch (error) {
      console.error("❌ Error ejecutando seed:", error);
    }
  },
};
