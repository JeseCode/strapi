
const strapi = require('@strapi/strapi');

async function checkRoutes() {
  const app = await strapi().load();
  const routes = app.server.router.stack
    .filter(r => r.route)
    .map(r => ({
      path: r.route.path,
      methods: Object.keys(r.route.methods)
    }));
  
  console.log('--- RUTAS REGISTRADAS EN STRAPI ---');
  routes.forEach(route => {
    if (route.path.includes('cliente') || route.path.includes('usuario')) {
      console.log(`${route.methods.join(',').toUpperCase()} ${route.path}`);
    }
  });
  
  process.exit(0);
}

checkRoutes();
