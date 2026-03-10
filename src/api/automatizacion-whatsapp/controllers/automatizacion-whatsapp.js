"use strict";

const UID = "api::automatizacion-whatsapp.automatizacion-whatsapp";

const sanitizeConfigPayload = (body = {}) => {
  const data = body.data || body;

  return {
    activo: data.activo,
    timezone: data.timezone,
    hora_inicio_diaria: data.hora_inicio_diaria,
    intervalo_minutos: data.intervalo_minutos,
    maximo_envios_por_dia: data.maximo_envios_por_dia,
    modo_prueba: data.modo_prueba,
    pausado: data.pausado,
    template_meta_cobro_hoy: data.template_meta_cobro_hoy,
  };
};

module.exports = {
  async getConfig(ctx) {
    const config = await strapi.service(UID).getConfig();
    ctx.send({ data: config });
  },

  async updateConfig(ctx) {
    const updatedConfig = await strapi
      .service(UID)
      .updateConfig(sanitizeConfigPayload(ctx.request.body));

    ctx.send({ data: updatedConfig });
  },

  async listCampanas(ctx) {
    const { fecha } = ctx.request.query;
    const data = await strapi.service(UID).listCampaigns({ fecha });
    ctx.send({ data });
  },

  async generarHoy(ctx) {
    const data = await strapi.service(UID).generateTodayCampaign({
      force: Boolean(ctx.request.body?.force),
    });

    ctx.send({ data });
  },

  async pausarCampana(ctx) {
    const data = await strapi
      .service(UID)
      .pauseCampaign(ctx.params.documentId);

    ctx.send({ data });
  },

  async reanudarCampana(ctx) {
    const data = await strapi
      .service(UID)
      .resumeCampaign(ctx.params.documentId);

    ctx.send({ data });
  },

  async cancelarCampana(ctx) {
    const data = await strapi
      .service(UID)
      .cancelCampaign(ctx.params.documentId);

    ctx.send({ data });
  },

  async registrarContactoManual(ctx) {
    const data = await strapi
      .service(UID)
      .registerManualContact(ctx.request.body || {});

    ctx.send({ data });
  },
};
