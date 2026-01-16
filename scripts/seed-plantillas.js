#!/usr/bin/env node
"use strict";

/**
 * Script para seedear plantillas de WhatsApp
 * Ejecutar con: node scripts/seed-plantillas.js
 */

const strapi = require("@strapi/strapi");
const { plantillasEjemplo } = require("../database/seeds/plantillas-whatsapp");

async function seedPlantillas() {
  let appContext;

  try {
    console.log("🚀 Iniciando Strapi...");

    // Inicializar Strapi
    appContext = await strapi({ distDir: "./dist" }).load();

    console.log("🌱 Iniciando seed de plantillas WhatsApp...\n");

    // Verificar si ya existen plantillas
    const existingPlantillas = await appContext.db
      .query("api::plantilla-whatsapp.plantilla-whatsapp")
      .findMany();

    if (existingPlantillas.length > 0) {
      console.log(
        `⚠️  Ya existen ${existingPlantillas.length} plantillas en la base de datos.`,
      );
      console.log(
        "   Si deseas recrearlas, elimínalas primero desde el admin panel.\n",
      );
    }

    let created = 0;
    let skipped = 0;

    for (const plantilla of plantillasEjemplo) {
      try {
        // Verificar si ya existe una plantilla con este nombre
        const existing = await appContext.db
          .query("api::plantilla-whatsapp.plantilla-whatsapp")
          .findOne({
            where: { nombre: plantilla.nombre },
          });

        if (existing) {
          console.log(`⏭️  "${plantilla.nombre}" ya existe, omitiendo...`);
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
        await appContext.db
          .query("api::plantilla-whatsapp.plantilla-whatsapp")
          .create({
            data: {
              nombre: plantilla.nombre,
              icono: plantilla.icono,
              contenido: plantilla.contenido,
              campos_variables: camposVariables,
              activo: plantilla.activo,
              orden: plantilla.orden,
              servicio: null,
            },
          });

        console.log(
          `✅ "${plantilla.nombre}" creada correctamente ${plantilla.icono}`,
        );
        created++;
      } catch (error) {
        console.error(`❌ Error creando "${plantilla.nombre}":`, error.message);
      }
    }

    console.log(`\n🎉 Seed completado exitosamente:`);
    console.log(`   ✅ ${created} plantillas creadas`);
    console.log(`   ⏭️  ${skipped} plantillas omitidas (ya existían)\n`);
  } catch (error) {
    console.error("\n❌ Error ejecutando seed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Cerrar Strapi
    if (appContext) {
      console.log("🔄 Cerrando Strapi...");
      await appContext.destroy();
    }
    process.exit(0);
  }
}

// Ejecutar el seed
seedPlantillas();
