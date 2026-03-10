"use strict";

module.exports = {
  async verifyWebhook(ctx) {
    const mode = ctx.query["hub.mode"];
    const token = ctx.query["hub.verify_token"];
    const challenge = ctx.query["hub.challenge"];
    const expectedToken = process.env.META_WHATSAPP_VERIFY_TOKEN;

    if (mode === "subscribe" && expectedToken && token === expectedToken) {
      ctx.status = 200;
      ctx.body = challenge;
      return;
    }

    ctx.status = 403;
    ctx.body = "Forbidden";
  },

  async receiveWebhook(ctx) {
    await strapi
      .service("api::automatizacion-whatsapp.automatizacion-whatsapp")
      .handleWebhookPayload(ctx.request.body || {});

    ctx.send({ received: true });
  },
};
