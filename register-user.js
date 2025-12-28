// Script para registrar un usuario usando el API de Strapi
const axios = require('axios');

const API_URL = 'http://localhost:1337/api';

async function registerUser() {
  try {
    const userData = {
      username: 'proyectohtrejo',
      email: 'proyectohtrejo@gmail.com',
      password: 'Trejo123.+'
    };

    console.log('🔄 Intentando registrar usuario...\n');

    const response = await axios.post(`${API_URL}/auth/local/register`, userData);

    console.log('✅ Usuario registrado exitosamente!');
    console.log('\n📋 Datos del usuario:');
    console.log(`   Email: ${userData.email}`);
    console.log(`   Password: ${userData.password}`);
    console.log(`\n🔑 Token JWT: ${response.data.jwt}`);
    console.log(`\n👤 Usuario ID: ${response.data.user.id}`);

  } catch (error) {
    if (error.response) {
      if (error.response.status === 400 && error.response.data.error.message.includes('already taken')) {
        console.log('⚠️  El usuario ya existe en la base de datos.');
        console.log('\n💡 Intenta iniciar sesión con:');
        console.log('   Email: proyectohtrejo@gmail.com');
        console.log('   Password: Trejo123.+');
        console.log('\nSi olvidaste la contraseña, necesitarás resetearla desde el panel de administración de Strapi.');
      } else {
        console.error('❌ Error al registrar usuario:');
        console.error('   Status:', error.response.status);
        console.error('   Message:', error.response.data.error.message);
        console.error('   Details:', JSON.stringify(error.response.data, null, 2));
      }
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

registerUser();
