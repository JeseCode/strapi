const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: 'postgresql://postgres:OcdjBEtKtHrokOQJICxQPVFCyxTYvhox@turntable.proxy.rlwy.net:48716/railway'
});

async function createUser() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    const email = 'proyectohtrejo@gmail.com';
    const password = 'Trejo123.+';
    const username = 'proyectohtrejo';

    // Verificar si el usuario ya existe
    const existingUser = await client.query(
      'SELECT id, email FROM up_users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  El usuario ya existe:');
      console.table(existingUser.rows);
      
      // Actualizar la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.query(
        'UPDATE up_users SET password = $1 WHERE email = $2',
        [hashedPassword, email]
      );
      console.log('\n✅ Contraseña actualizada exitosamente!');
    } else {
      // Obtener el rol "Authenticated" (role_id = 1)
      const roleQuery = await client.query(
        "SELECT id FROM up_roles WHERE type = 'authenticated' LIMIT 1"
      );
      
      if (roleQuery.rows.length === 0) {
        console.error('❌ No se encontró el rol "authenticated"');
        return;
      }

      const roleId = roleQuery.rows[0].id;
      const hashedPassword = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      // Crear el usuario
      const result = await client.query(
        `INSERT INTO up_users 
        (username, email, password, confirmed, blocked, created_at, updated_at, published_at, document_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING id`,
        [username, email, hashedPassword, true, false, now, now, now, `user_${Date.now()}`]
      );

      const userId = result.rows[0].id;

      // Asignar el rol al usuario
      await client.query(
        'INSERT INTO up_users_role_lnk (user_id, role_id) VALUES ($1, $2)',
        [userId, roleId]
      );

      console.log('✅ Usuario creado exitosamente!');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

createUser();
