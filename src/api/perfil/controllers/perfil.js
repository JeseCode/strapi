const { factories } = require("@strapi/strapi");

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const addMonthsToDateString = (dateString, months = 1) => {
  if (!dateString) {
    return getLocalDateString();
  }

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setMonth(date.getMonth() + months);

  return getLocalDateString(date);
};

const extractPerfilNumeroFromName = (nombrePerfil = "") => {
  const match = nombrePerfil.match(/Perfil\s+(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : null;
};

module.exports = factories.createCoreController(
  "api::perfil.perfil",
  ({ strapi }) => ({
    // Endpoint personalizado para vincular cliente a cuenta
    async vincularCliente(ctx) {
      try {
        const {
          cuentaId,
          clienteId,
          perfilNumero,
          nombrePerfil,
          codigoPin: codigoPinProporcionado,
          tipoDispositivo = "TV",
          fechaActivacion,
          fechaVencimiento,
          precioIndividual,
          notas,
        } = ctx.request.body;

        console.log("🚀 Backend: Vinculando cliente", {
          cuentaId,
          clienteId,
          perfilNumero,
          codigoPinProporcionado,
          fechaActivacion,
          fechaVencimiento,
        });

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

        const perfilesConfigurados = Array.isArray(cuenta.perfiles_pines)
          ? cuenta.perfiles_pines
          : [];
        const perfilConfigurado = perfilNumero
          ? perfilesConfigurados.find(
              (perfil) => Number(perfil.numero) === Number(perfilNumero)
            )
          : null;

        if (perfilNumero && !perfilConfigurado) {
          return ctx.badRequest("El perfil seleccionado no existe en la cuenta");
        }

        // En este proyecto los filtros por relación de Strapi v5 han sido inestables.
        // Cargamos y filtramos manualmente para no mezclar perfiles de otras cuentas.
        const todosLosPerfiles = await strapi
          .documents("api::perfil.perfil")
          .findMany({
            populate: {
              cliente: true,
              cuenta: true,
            },
          });

        const perfilesDeCuenta = todosLosPerfiles.filter(
          (perfil) => perfil.cuenta?.documentId === cuentaId
        );

        const perfilExistente = perfilesDeCuenta.filter(
          (perfil) => perfil.cliente?.documentId === clienteId
        );

        if (perfilExistente.length > 0) {
          return ctx.badRequest("El cliente ya está vinculado a esta cuenta");
        }

        const perfilDelNumero = perfilNumero
          ? perfilesDeCuenta.find((perfil) => {
              const numeroPerfil = extractPerfilNumeroFromName(perfil.nombre_perfil);
              if (numeroPerfil !== null) {
                return numeroPerfil === Number(perfilNumero);
              }

              return (
                codigoPinProporcionado &&
                perfil.codigo_pin &&
                perfil.codigo_pin.toString().trim() ===
                  codigoPinProporcionado.toString().trim()
              );
            })
          : null;

        if (perfilDelNumero?.cliente) {
          return ctx.badRequest("El perfil seleccionado ya está asignado a otro cliente");
        }

        const perfilesActuales = perfilesDeCuenta.filter((perfil) => perfil.cliente);

        console.log(`📊 Perfiles actuales: ${perfilesActuales.length}/${cuenta.max_perfiles}`);

        if (!perfilDelNumero && perfilesActuales.length >= cuenta.max_perfiles) {
          return ctx.badRequest(
            `La cuenta ha alcanzado el límite máximo de ${cuenta.max_perfiles} perfiles`
          );
        }

        // Usar el PIN proporcionado o generar uno aleatorio
        let codigoPin = codigoPinProporcionado || perfilConfigurado?.pin;

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

        const fechaActivacionFinal = fechaActivacion || getLocalDateString();
        const fechaVencimientoFinal =
          fechaVencimiento || addMonthsToDateString(fechaActivacionFinal, 1);

        if (fechaVencimientoFinal <= fechaActivacionFinal) {
          return ctx.badRequest(
            "La fecha de vencimiento debe ser posterior a la fecha de activación"
          );
        }

        const precioTotal = parseFloat(cuenta.precio) || 0;
        const maxPerfiles = parseInt(cuenta.max_perfiles) || 1;
        const precioIndividualFinal =
          Number(precioIndividual) > 0
            ? Number(precioIndividual)
            : precioTotal / maxPerfiles;

        console.log("📝 Creando perfil con datos:", {
          cuenta: cuentaId,
          cliente: clienteId,
          perfilNumero,
          codigoPin,
          fechaActivacion: fechaActivacionFinal,
          fechaVencimiento: fechaVencimientoFinal,
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
              fecha_activacion: fechaActivacionFinal,
              fecha_vencimiento: fechaVencimientoFinal,
              precio_individual: precioIndividualFinal,
              estado: "activo",
              ...(notas ? { notas } : {}),
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
