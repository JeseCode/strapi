"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/whatsapp/webhook",
      handler: "whatsapp.verifyWebhook",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/whatsapp/webhook",
      handler: "whatsapp.receiveWebhook",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    }
  ],
};
