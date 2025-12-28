const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'src', 'api');

console.log('=== RENOMBRANDO ARCHIVOS .ts A .js ===\n');

function renameFilesInDirectory(dir) {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      renameFilesInDirectory(fullPath);
    } else if (path.extname(item) === '.ts') {
      const newPath = fullPath.replace(/\.ts$/, '.js');
      console.log(`Renombrando: ${fullPath} -> ${newPath}`);
      fs.renameSync(fullPath, newPath);
    }
  });
}

try {
  renameFilesInDirectory(apiPath);
  console.log('\n✅ Todos los archivos .ts han sido renombrados a .js');
} catch (error) {
  console.error('❌ Error:', error.message);
}
