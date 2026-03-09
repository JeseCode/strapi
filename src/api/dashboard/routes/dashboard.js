module.exports = {
  routes: [
    {
      method: "GET",
      path: "/dashboard/resumen",
      handler: "dashboard.resumen",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
