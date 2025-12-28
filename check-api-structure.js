const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'src', 'api');

console.log('=== VERIFICANDO ESTRUCTURA DE API ===\n');

const apis = fs.readdirSync(apiPath).filter(file => {
  const fullPath = path.join(apiPath, file);
  return fs.statSync(fullPath).isDirectory() && file !== '.gitkeep';
});

apis.forEach(api => {
  console.log(`\n📁 API: ${api}`);
  const apiDir = path.join(apiPath, api);

  // Check routes
  const routesDir = path.join(apiDir, 'routes');
  if (fs.existsSync(routesDir)) {
    const routeFiles = fs.readdirSync(routesDir);
    console.log(`  ✅ Routes: ${routeFiles.join(', ')}`);

    // Read route file content
    routeFiles.forEach(file => {
      const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
      console.log(`     Content preview: ${content.substring(0, 100)}...`);
    });
  } else {
    console.log(`  ❌ No routes directory`);
  }

  // Check controllers
  const controllersDir = path.join(apiDir, 'controllers');
  if (fs.existsSync(controllersDir)) {
    const controllerFiles = fs.readdirSync(controllersDir);
    console.log(`  ✅ Controllers: ${controllerFiles.join(', ')}`);
  } else {
    console.log(`  ❌ No controllers directory`);
  }

  // Check services
  const servicesDir = path.join(apiDir, 'services');
  if (fs.existsSync(servicesDir)) {
    const serviceFiles = fs.readdirSync(servicesDir);
    console.log(`  ✅ Services: ${serviceFiles.join(', ')}`);
  } else {
    console.log(`  ❌ No services directory`);
  }

  // Check content-types
  const contentTypesDir = path.join(apiDir, 'content-types');
  if (fs.existsSync(contentTypesDir)) {
    const contentTypes = fs.readdirSync(contentTypesDir);
    console.log(`  ✅ Content Types: ${contentTypes.join(', ')}`);

    // Check schema
    contentTypes.forEach(ct => {
      const schemaPath = path.join(contentTypesDir, ct, 'schema.json');
      if (fs.existsSync(schemaPath)) {
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        console.log(`     Schema - Singular: ${schema.info.singularName}, Plural: ${schema.info.pluralName}`);
      }
    });
  } else {
    console.log(`  ❌ No content-types directory`);
  }
});

console.log('\n=== FIN DE VERIFICACIÓN ===');
