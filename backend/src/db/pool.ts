import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { env } from '../config/env';

// Parse DATABASE_URL o usar variables individuales
function parseConnection(){
  if(env.databaseUrl && env.databaseUrl.startsWith('mysql://')){
    // mysql://user:pass@host:port/db
    const url = new URL(env.databaseUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port || '3306', 10),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
  }
  // Fallback a variables individuales si se configuran así
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'phadmin',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

export const pool = createPool(parseConnection());

// Helper para convertir parámetros $1, $2 a ?, ?, ? para MySQL
function convertParams(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\$(\d+)/g, () => '?');
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }>{
  const sql = convertParams(text);
  const [rows] = await pool.execute(sql, params);
  return { rows: rows as T[] };
}