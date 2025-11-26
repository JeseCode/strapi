import { factories } from "@strapi/strapi";

export default factories.createCoreController(
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

        // Validar parámetros requeridos
        if (!cuentaId || !clienteId) {
          return ctx.badRequest("cuentaId y clienteId son requeridos");
        }

        // Verificar que la cuenta existe
        const cuenta = await strapi.documents("api::cuenta.cuenta").findOne({
          documentId: cuentaId,
        });

        if (!cuenta) {
          return ctx.notFound("Cuenta no encontrada");
        }

        // Verificar que el cliente existe
        const cliente = await strapi.documents("api::cliente.cliente").findOne({
          documentId: clienteId,
        });

        if (!cliente) {
          return ctx.notFound("Cliente no encontrado");
        }

        // Verificar si el cliente ya está vinculado a esta cuenta
        const perfilExistente = await strapi
          .documents("api::perfil.perfil")
          .findMany({
            filters: {
              cuenta: cuentaId,
              cliente: clienteId,
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
              cuenta: cuentaId,
            },
          });

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
          while (pinExiste) {
            codigoPin = Math.floor(1000 + Math.random() * 9000).toString();
            const perfilConPin = await strapi
              .documents("api::perfil.perfil")
              .findMany({
                filters: { codigo_pin: codigoPin },
              });
            pinExiste = perfilConPin.length > 0;
          }
        }

        // Crear el perfil para vincular cliente a cuenta
        const fechaVencimiento = new Date(cuenta.fechaVencimiento);
        const precioIndividual = cuenta.precio / cuenta.max_perfiles;

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
              fecha_vencimiento: fechaVencimiento.toISOString().split("T")[0],
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
        console.error("Error al vincular cliente:", error);
        return ctx.internalServerError("Error interno del servidor");
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
