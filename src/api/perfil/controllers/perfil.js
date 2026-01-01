const { factories } = require("@strapi/strapi");

module.exports = factories.createCoreController(
  "api::perfil.perfil",
  ({ strapi }) => ({
    // Endpoint personalizado para vincular cliente a cuenta
    async vincularCliente(ctx) {
      try {
        const {
          cuentaId,
          clienteId,
          nombrePerfil,
          codigoPin: codigoPinProporcionado,
          tipoDispositivo = "TV",
        } = ctx.request.body;

        console.log("🚀 Backend: Vinculando cliente", { cuentaId, clienteId, codigoPinProporcionado });

        // Validar parámetros requeridos
        if (!cuentaId || !clienteId) {
          return ctx.badRequest("cuentaId y clienteId son requeridos");
        }

        // Verificar que la cuenta existe
        const cuenta = await strapi.documents("api::cuenta.cuenta").findOne({
          documentId: cuentaId,
        });

        if (!cuenta) {
          console.error("❌ Cuenta no encontrada:", cuentaId);
          return ctx.notFound("Cuenta no encontrada");
        }

        // Verificar que el cliente existe
        const cliente = await strapi.documents("api::cliente.cliente").findOne({
          documentId: clienteId,
        });

        if (!cliente) {
          console.error("❌ Cliente no encontrado:", clienteId);
          return ctx.notFound("Cliente no encontrado");
        }

        // Verificar si el cliente ya está vinculado a esta cuenta
        // En Strapi 5, para filtrar por relación usamos el documentId
        const perfilExistente = await strapi
          .documents("api::perfil.perfil")
          .findMany({
            filters: {
              cuenta: { documentId: { $eq: cuentaId } },
              cliente: { documentId: { $eq: clienteId } },
            },
          });

        if (perfilExistente.length > 0) {
          return ctx.badRequest("El cliente ya está vinculado a esta cuenta");
        }

        // Verificar límite de perfiles de la cuenta
        const perfilesActuales = await strapi
          .documents("api::perfil.perfil")
          .findMany({
            filters: {
              cuenta: { documentId: { $eq: cuentaId } },
            },
          });

        console.log(`📊 Perfiles actuales: ${perfilesActuales.length}/${cuenta.max_perfiles}`);

        if (perfilesActuales.length >= cuenta.max_perfiles) {
          return ctx.badRequest(
            `La cuenta ha alcanzado el límite máximo de ${cuenta.max_perfiles} perfiles`
          );
        }

        // Usar el PIN proporcionado o generar uno aleatorio
        let codigoPin = codigoPinProporcionado;

        // Si no se proporcionó un PIN, generar uno único
        if (!codigoPin) {
          let pinExiste = true;
          let intentos = 0;
          while (pinExiste && intentos < 10) {
            codigoPin = Math.floor(1000 + Math.random() * 9000).toString();
            const perfilConPin = await strapi
              .documents("api::perfil.perfil")
              .findMany({
                filters: { codigo_pin: { $eq: codigoPin } },
              });
            pinExiste = perfilConPin.length > 0;
            intentos++;
          }
        }

        // Crear el perfil para vincular cliente a cuenta
        const fechaVencimientoObj = cuenta.fechaVencimiento ? new Date(cuenta.fechaVencimiento) : new Date();
        const precioTotal = parseFloat(cuenta.precio) || 0;
        const maxPerfiles = parseInt(cuenta.max_perfiles) || 1;
        const precioIndividual = precioTotal / maxPerfiles;

        console.log("📝 Creando perfil con datos:", {
          cuenta: cuentaId,
          cliente: clienteId,
          codigoPin,
          fechaVencimiento: fechaVencimientoObj.toISOString().split("T")[0]
        });

        const nuevoPerfil = await strapi
          .documents("api::perfil.perfil")
          .create({
            data: {
              cuenta: cuentaId,
              cliente: clienteId,
              codigo_pin: codigoPin,
              nombre_perfil: nombrePerfil || `Perfil de ${cliente.nombre}`,
              tipo_dispositivo: tipoDispositivo,
              fecha_activacion: new Date().toISOString().split("T")[0],
              fecha_vencimiento: fechaVencimientoObj.toISOString().split("T")[0],
              precio_individual: precioIndividual,
              estado: "activo",
            },
            populate: {
              cuenta: true,
              cliente: true,
            },
          });

        return ctx.send({
          data: nuevoPerfil,
          message: `Cliente ${cliente.nombre} vinculado exitosamente a la cuenta con PIN: ${codigoPin}`,
        });
      } catch (error) {
        console.error("💥 Error detallado al vincular cliente:", error);
        return ctx.internalServerError(`Error al vincular: ${error.message}`);
      }
    },

    // Endpoint para desvincular cliente de cuenta
    async desvincularCliente(ctx) {
      try {
        const { perfilId } = ctx.params;

        if (!perfilId) {
          return ctx.badRequest("perfilId es requerido");
        }

        // Buscar el perfil
        const perfil = await strapi.documents("api::perfil.perfil").findOne({
          documentId: perfilId,
          populate: {
            cuenta: true,
            cliente: true,
          },
        });

        if (!perfil) {
          return ctx.notFound("Perfil no encontrado");
        }

        // Eliminar el perfil (desvincula el cliente de la cuenta)
        await strapi.documents("api::perfil.perfil").delete({
          documentId: perfilId,
        });

        return ctx.send({
          message: `Cliente ${perfil.cliente.nombre} desvinculado exitosamente de la cuenta`,
        });
      } catch (error) {
        console.error("Error al desvincular cliente:", error);
        return ctx.internalServerError("Error interno del servidor");
      }
    },

    // Endpoint para obtener clientes vinculados a una cuenta
    async clientesVinculados(ctx) {
      try {
        const { cuentaId } = ctx.params;

        if (!cuentaId) {
          return ctx.badRequest("cuentaId es requerido");
        }

        console.log("🔍 Buscando perfiles para cuenta:", cuentaId);

        // Obtener todos los perfiles primero
        const todosLosPerfiles = await strapi
          .documents("api::perfil.perfil")
          .findMany({
            populate: {
              cliente: true,
              cuenta: true,
            },
          });

        console.log("📋 Total perfiles encontrados:", todosLosPerfiles.length);
        console.log(
          "📋 Perfiles:",
          todosLosPerfiles.map((p) => ({
            id: p.documentId,
            cuenta: p.cuenta?.documentId || "sin cuenta",
            cliente: p.cliente?.nombre || "sin cliente",
          }))
        );

        // Filtrar manualmente por cuenta
        const perfiles = todosLosPerfiles.filter(
          (perfil) => perfil.cuenta && perfil.cuenta.documentId === cuentaId
        );

        console.log("✅ Perfiles filtrados para cuenta:", perfiles.length);

        return ctx.send({
          data: perfiles,
          meta: {
            total: perfiles.length,
            cuentaId: cuentaId,
          },
        });
      } catch (error) {
        console.error("Error al obtener clientes vinculados:", error);
        return ctx.internalServerError("Error interno del servidor");
      }
    },
  })
);
