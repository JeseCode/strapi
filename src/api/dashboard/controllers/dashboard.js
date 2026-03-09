module.exports = {
  async resumen(ctx) {
    try {
      const data = await strapi
        .service("api::dashboard.dashboard")
        .getResumen();

      ctx.send({ data });
    } catch (error) {
      strapi.log.error("Error construyendo dashboard/resumen", error);
      ctx.internalServerError("No se pudo cargar el resumen del dashboard");
    }
  },
};
