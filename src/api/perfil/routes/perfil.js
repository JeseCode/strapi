module.exports = {
  routes: [
    // Rutas estándar de perfiles
    {
      method: "GET",
      path: "/perfiles",
      handler: "perfil.find",
      config: {
        auth: false, // Temporalmente sin autenticación para pruebas
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/perfiles/:id",
      handler: "perfil.findOne",
      config: {
        auth: false, // Temporalmente sin autenticación para pruebas
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/perfiles",
      handler: "perfil.create",
      config: {
        auth: false, // Temporalmente sin autenticación para pruebas
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "PUT",
      path: "/perfiles/:id",
      handler: "perfil.update",
      config: {
        auth: false, // Temporalmente sin autenticación para pruebas
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "DELETE",
      path: "/perfiles/:id",
      handler: "perfil.delete",
      config: {
        auth: false, // Temporalmente sin autenticación para pruebas
        policies: [],
        middlewares: [],
      },
    },

    // Rutas personalizadas para vincular/desvincular clientes
    {
      method: "POST",
      path: "/perfiles/vincular-cliente",
      handler: "perfil.vincularCliente",
      config: {
        auth: false, // Temporalmente sin autenticación para pruebas
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "DELETE",
      path: "/perfiles/desvincular-cliente/:perfilId",
      handler: "perfil.desvincularCliente",
      config: {
        auth: false, // Temporalmente sin autenticación para pruebas
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/perfiles/clientes-vinculados/:cuentaId",
      handler: "perfil.clientesVinculados",
      config: {
        auth: false, // Temporalmente sin autenticación para pruebas
        policies: [],
        middlewares: [],
      },
    },
  ],
};
