const MAX_QUERY_LIMIT = 5000;

const getDateString = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;

const diffInDays = (fromDateString, toDateString) => {
  const fromDate = new Date(`${fromDateString}T00:00:00`);
  const toDate = new Date(`${toDateString}T00:00:00`);

  return Math.round((toDate.getTime() - fromDate.getTime()) / 86400000);
};

const deriveCuentaEstado = (fechaVencimiento, alertaDias = 7) => {
  const today = getDateString(new Date());

  if (!fechaVencimiento) {
    return "inactiva";
  }

  if (fechaVencimiento < today) {
    return "vencida";
  }

  return diffInDays(today, fechaVencimiento) <= alertaDias
    ? "por_vencer"
    : "activa";
};

module.exports = () => ({
  async getResumen() {
    const today = getDateString(new Date());

    const [clientes, cuentas, servicios, perfiles] = await Promise.all([
      strapi.documents("api::cliente.cliente").findMany({
        fields: ["documentId", "estado"],
        limit: MAX_QUERY_LIMIT,
      }),
      strapi.documents("api::cuenta.cuenta").findMany({
        fields: [
          "documentId",
          "email",
          "identificador_cuenta",
          "fechaVencimiento",
          "estado",
          "precio",
          "alerta_dias",
        ],
        populate: {
          servicio: {
            fields: ["nombre"],
          },
          cliente: {
            fields: ["documentId", "nombre"],
          },
        },
        limit: MAX_QUERY_LIMIT,
      }),
      strapi.documents("api::servicio.servicio").findMany({
        fields: ["documentId", "activo"],
        filters: {
          activo: {
            $eq: true,
          },
        },
        limit: MAX_QUERY_LIMIT,
      }),
      strapi.documents("api::perfil.perfil").findMany({
        fields: [
          "documentId",
          "nombre_perfil",
          "fecha_vencimiento",
          "codigo_pin",
          "requiere_seguimiento",
          "requiere_cobro",
          "requiere_reenvio",
        ],
        populate: {
          cliente: {
            fields: ["documentId", "nombre", "telefono"],
          },
          cuenta: {
            fields: ["documentId", "email", "identificador_cuenta", "password"],
            populate: {
              servicio: {
                fields: ["nombre"],
              },
            },
          },
        },
        limit: MAX_QUERY_LIMIT,
      }),
    ]);

    const cuentasNormalizadas = cuentas.map((cuenta) => {
      const estadoDerivado = deriveCuentaEstado(
        cuenta.fechaVencimiento,
        cuenta.alerta_dias || 7,
      );

      return {
        documentId: cuenta.documentId,
        email: cuenta.email,
        identificador_cuenta: cuenta.identificador_cuenta,
        servicio: {
          nombre: cuenta.servicio?.nombre || "N/A",
        },
        cliente: {
          documentId: cuenta.cliente?.documentId || "",
          nombre: cuenta.cliente?.nombre || "Sin asignar",
        },
        fechaVencimiento: cuenta.fechaVencimiento,
        diasRestantes: cuenta.fechaVencimiento
          ? diffInDays(today, cuenta.fechaVencimiento)
          : null,
        estado: estadoDerivado,
        precio: Number(cuenta.precio || 0),
      };
    });

    const cuentasActivas = cuentasNormalizadas.filter(
      (cuenta) => cuenta.estado === "activa" || cuenta.estado === "por_vencer",
    );

    const cuentasProximasVencer = cuentasNormalizadas
      .filter(
        (cuenta) =>
          cuenta.diasRestantes !== null &&
          cuenta.diasRestantes >= 0 &&
          cuenta.diasRestantes <= 6 &&
          (cuenta.estado === "activa" || cuenta.estado === "por_vencer"),
      )
      .sort((left, right) => left.diasRestantes - right.diasRestantes);

    const usuariosPantallasBase = perfiles
      .map((perfil) => ({
        perfilId: perfil.documentId,
        cuentaDocumentId: perfil.cuenta?.documentId || "",
        clienteDocumentId: perfil.cliente?.documentId || "",
        nombre: perfil.cliente?.nombre || "Usuario sin nombre",
        telefono: perfil.cliente?.telefono || "Sin teléfono",
        servicio: perfil.cuenta?.servicio?.nombre || "N/A",
        nombrePerfil: perfil.nombre_perfil || "Perfil",
        accessValue:
          perfil.cuenta?.email || perfil.cuenta?.identificador_cuenta || "",
        password: perfil.cuenta?.password || "",
        codigoPin: perfil.codigo_pin || "",
        requiereSeguimiento: Boolean(perfil.requiere_seguimiento),
        requiereCobro: Boolean(perfil.requiere_cobro),
        requiereReenvio: Boolean(perfil.requiere_reenvio),
        fechaVencimiento: perfil.fecha_vencimiento || "",
        diasRestantes: perfil.fecha_vencimiento
          ? diffInDays(today, perfil.fecha_vencimiento)
          : null,
      }))
      .filter(
        (perfil) =>
          perfil.fechaVencimiento &&
          perfil.diasRestantes !== null &&
          perfil.diasRestantes >= 0 &&
          perfil.diasRestantes <= 6,
      )
      .sort(
        (left, right) =>
          left.diasRestantes - right.diasRestantes ||
          left.nombre.localeCompare(right.nombre),
      );
    const automationService = strapi.service(
      "api::automatizacion-whatsapp.automatizacion-whatsapp",
    );
    const contactoPorPerfil = await automationService.getLatestStatusesByProfileIds(
      usuariosPantallasBase.map((perfil) => perfil.perfilId),
      today,
    );
    const campanaCobroHoy = await automationService.getTodayCampaignSummary();
    const usuariosPantallasPorVencer = usuariosPantallasBase.map((perfil) => ({
      ...perfil,
      contactoCobroHoy: contactoPorPerfil.get(perfil.perfilId) || null,
    }));

    return {
      totals: {
        totalClientes: clientes.length,
        clientesActivos: clientes.filter((cliente) => cliente.estado === "activo")
          .length,
        totalCuentas: cuentasNormalizadas.length,
        cuentasActivas: cuentasActivas.length,
        ingresosMes: Number(
          cuentasActivas
            .reduce((total, cuenta) => total + Number(cuenta.precio || 0), 0)
            .toFixed(2),
        ),
        serviciosActivos: servicios.length,
      },
      cuentasProximasVencer,
      usuariosPantallasPorVencer,
      campanaCobroHoy: campanaCobroHoy
        ? {
            documentId: campanaCobroHoy.documentId,
            estado: campanaCobroHoy.estado,
            totalObjetivos: campanaCobroHoy.totalObjetivos,
            totalPendientes: campanaCobroHoy.totalPendientes,
            totalEnviados: campanaCobroHoy.totalEnviados,
            totalFallidos: campanaCobroHoy.totalFallidos,
            totalOmitidos: campanaCobroHoy.totalOmitidos,
          }
        : null,
    };
  },
});
