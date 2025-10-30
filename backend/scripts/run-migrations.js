const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

function parseConnection(){
  if(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql://')){
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || '3306', 10),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      multipleStatements: true
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'phadmin',
    multipleStatements: true
  };
}

async function main(){
  const connection = await mysql.createConnection(parseConnection());
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  
  try {
    for(const f of files){
      try {
        const sql = fs.readFileSync(path.join(dir, f), 'utf8');
        console.log('Running migration', f);
        // MySQL permite múltiples statements separados por ;
        await connection.query(sql);
        console.log('✅', f, 'completed');
      } catch (error){
        // Si es un error de columna duplicada o tabla ya existe, continuar
        if(error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR'){
          console.log('⚠️', f, 'skipped (already applied):', error.message);
          continue;
        }
        // Para otros errores, lanzar
        console.error('❌ Migration error in', f, ':', error.message);
        throw error;
      }
    }
    console.log('✅ Migrations complete');
  } catch (error){
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });