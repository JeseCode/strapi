"use strict";

/**
 * plantilla-whatsapp service
 */

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(
  "api::plantilla-whatsapp.plantilla-whatsapp",
);
