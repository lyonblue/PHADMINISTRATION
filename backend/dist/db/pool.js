"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
const promise_1 = require("mysql2/promise");
const env_1 = require("../config/env");
// Parse DATABASE_URL o usar variables individuales
function parseConnection() {
    if (env_1.env.databaseUrl && env_1.env.databaseUrl.startsWith('mysql://')) {
        // mysql://user:pass@host:port/db
        const url = new URL(env_1.env.databaseUrl);
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
exports.pool = (0, promise_1.createPool)(parseConnection());
// Helper para convertir parámetros $1, $2 a ?, ?, ? para MySQL
function convertParams(sql) {
    let paramIndex = 1;
    return sql.replace(/\$(\d+)/g, () => '?');
}
async function query(text, params) {
    const sql = convertParams(text);
    const [rows] = await exports.pool.execute(sql, params);
    return { rows: rows };
}
