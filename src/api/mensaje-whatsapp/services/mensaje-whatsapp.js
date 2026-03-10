"use strict";

const { factories } = require("@strapi/strapi");

module.exports = factories.createCoreService(
  "api::mensaje-whatsapp.mensaje-whatsapp",
);
