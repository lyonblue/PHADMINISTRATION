const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

function parseConnection(){
  if(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql://')){
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || '3306', 10),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1)
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'phadmin'
  };
}

async function createAdmin(){
  let connection;
  
  // Solicitar datos por línea de comandos (o usar valores por defecto)
  const email = process.argv[2] || 'admin@phpty.com';
  const password = process.argv[3] || 'Admin123!';
  const fullName = process.argv[4] || 'Administrador Principal';
  
  try {
    console.log('🔌 Conectando a MySQL...');
    const config = parseConnection();
    console.log(`   Base de datos: ${config.database}`);
    console.log(`   Host: ${config.host}:${config.port}`);
    connection = await mysql.createConnection(config);
    console.log('✅ Conexión exitosa\n');
    // Verificar si ya existe
    const [existing] = await connection.execute('SELECT id FROM users WHERE email=?', [email.toLowerCase()]);
    if(existing.length){
      console.log('❌ Ya existe un usuario con ese email');
      process.exit(1);
    }
    
    // Crear hash de contraseña
    const hash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    
    // Insertar admin con email verificado por defecto
    await connection.execute(
      `INSERT INTO users (id, email, password_hash, full_name, role, email_verified_at) 
       VALUES (?, ?, ?, ?, 'admin', NOW())`,
      [userId, email.toLowerCase(), hash, fullName]
    );
    
    // Obtener datos del usuario creado
    const [result] = await connection.execute(
      'SELECT id, email, full_name, role FROM users WHERE id=?',
      [userId]
    );
    
    if(result.length){
      console.log('✅ Admin creado exitosamente:');
      console.log(`   ID: ${result[0].id}`);
      console.log(`   Email: ${result[0].email}`);
      console.log(`   Nombre: ${result[0].full_name}`);
      console.log(`   Rol: ${result[0].role}`);
      console.log(`\n🔑 Credenciales de acceso:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión!');
    }
    
  } catch (error){
    console.error('\n❌ ERROR:', error.message);
    if(error.code === 'ER_ACCESS_DENIED_ERROR'){
      console.error('   → Verifica tu usuario y contraseña en el archivo .env');
    } else if(error.code === 'ER_BAD_DB_ERROR'){
      console.error('   → La base de datos no existe. Ejecuta: CREATE DATABASE phadmin;');
    } else if(error.code === 'ER_NO_SUCH_TABLE'){
      console.error('   → Las tablas no existen. Ejecuta primero: npm run migrate');
    } else if(error.code === 'ECONNREFUSED'){
      console.error('   → MySQL no está corriendo. Inicia el servicio MySQL.');
    }
    console.error('\n💡 Verifica:');
    console.error('   1. Que el archivo .env tenga DATABASE_URL correcto');
    console.error('   2. Que MySQL esté corriendo');
    console.error('   3. Que la base de datos phadmin exista');
    console.error('   4. Que hayas ejecutado npm run migrate\n');
    process.exit(1);
  } finally {
    if(connection){
      await connection.end();
    }
  }
}

createAdmin();