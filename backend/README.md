Backend - PH PTY Administration

Setup rápido

**Ver SETUP_MYSQL.md para instrucciones detalladas**

1) Instalar MySQL 9.5
2) Crear base de datos: `CREATE DATABASE phadmin;`
3) Crear .env con DATABASE_URL de MySQL
4) Instalar deps: npm install
5) Ejecutar migraciones: npm run migrate
6) Crear primer admin: npm run create-admin
7) Dev server: npm run dev

Crear cuentas

- Usuarios normales: Se crean desde el registro público (POST /auth/register) con role='user'
- Admin manual: npm run create-admin [email] [password] [nombre]
- Admin desde admin: POST /admin/create-user (requiere token de admin)

Endpoints base

- POST /auth/register - Registro público (crea usuarios normales)
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh
- POST /auth/forgot-password
- POST /auth/reset-password
- GET  /auth/verify-email
- GET  /me
- POST /admin/create-user - Crear usuario/admin (solo admins)


