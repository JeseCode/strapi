"use strict";

const { factories } = require("@strapi/strapi");

module.exports = factories.createCoreController(
  "api::mensaje-whatsapp.mensaje-whatsapp",
);
