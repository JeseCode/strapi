"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/automatizacion-whatsapp/config",
      handler: "automatizacion-whatsapp.getConfig",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "PUT",
      path: "/automatizacion-whatsapp/config",
      handler: "automatizacion-whatsapp.updateConfig",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/automatizacion-whatsapp/campanas",
      handler: "automatizacion-whatsapp.listCampanas",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/automatizacion-whatsapp/campanas/generar-hoy",
      handler: "automatizacion-whatsapp.generarHoy",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/automatizacion-whatsapp/campanas/:documentId/pausar",
      handler: "automatizacion-whatsapp.pausarCampana",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/automatizacion-whatsapp/campanas/:documentId/reanudar",
      handler: "automatizacion-whatsapp.reanudarCampana",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/automatizacion-whatsapp/campanas/:documentId/cancelar",
      handler: "automatizacion-whatsapp.cancelarCampana",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/automatizacion-whatsapp/contactos/manual",
      handler: "automatizacion-whatsapp.registrarContactoManual",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    }
  ],
};
