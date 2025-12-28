const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:OcdjBEtKtHrokOQJICxQPVFCyxTYvhox@turntable.proxy.rlwy.net:48716/railway'
});

async function checkUsers() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Verificar usuarios de la aplicación (up_users)
    console.log('📋 Usuarios de la aplicación (up_users):');
    const appUsers = await client.query('SELECT id, email, username, confirmed, blocked FROM up_users LIMIT 10');
    console.table(appUsers.rows);

    // Verificar usuarios administradores (admin_users)
    console.log('\n👤 Usuarios administradores (admin_users):');
    const adminUsers = await client.query('SELECT id, email, username, firstname, lastname, blocked FROM admin_users LIMIT 10');
    console.table(adminUsers.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers();
