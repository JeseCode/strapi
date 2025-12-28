const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'src', 'api');

console.log('=== CONVIRTIENDO SINTAXIS ES6 A COMMONJS ===\n');

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Convert import { factories } from '@strapi/strapi';
  if (content.includes("import { factories } from '@strapi/strapi';")) {
    content = content.replace(
      "import { factories } from '@strapi/strapi';",
      "const { factories } = require('@strapi/strapi');"
    );
    modified = true;
  }

  // Convert export default to module.exports
  if (content.includes('export default factories.createCoreRouter')) {
    content = content.replace(
      /export default factories\.createCoreRouter\((.*?)\);/,
      'module.exports = factories.createCoreRouter($1);'
    );
    modified = true;
  }

  if (content.includes('export default factories.createCoreController')) {
    content = content.replace(
      /export default factories\.createCoreController\((.*?)\);/,
      'module.exports = factories.createCoreController($1);'
    );
    modified = true;
  }

  if (content.includes('export default factories.createCoreService')) {
    content = content.replace(
      /export default factories\.createCoreService\((.*?)\);/,
      'module.exports = factories.createCoreService($1);'
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Convertido: ${filePath}`);
  }

  return modified;
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  let totalConverted = 0;

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      totalConverted += processDirectory(fullPath);
    } else if (path.extname(item) === '.js') {
      if (convertFile(fullPath)) {
        totalConverted++;
      }
    }
  });

  return totalConverted;
}

try {
  const converted = processDirectory(apiPath);
  console.log(`\n✅ Total de archivos convertidos: ${converted}`);
} catch (error) {
  console.error('❌ Error:', error.message);
}
