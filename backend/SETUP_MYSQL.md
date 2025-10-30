# Setup MySQL para PH PTY Administration

## 1. Instalar MySQL 9.5

Ya lo tienes descargado. Si no está corriendo, inicia el servicio MySQL.

## 2. Crear la base de datos

Abre MySQL Workbench o línea de comandos y ejecuta:

```sql
CREATE DATABASE phadmin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

O desde la línea de comandos:
```bash
mysql -u root -p -e "CREATE DATABASE phadmin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## 3. Configurar variables de entorno

Crea un archivo `.env` en `backend/` con:

```env
PORT=4000
NODE_ENV=development

# MySQL - Opción 1: Connection String
DATABASE_URL=mysql://root:tu_password@localhost:3306/phadmin

# MySQL - Opción 2: Variables individuales (alternativa)
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=tu_password
# DB_NAME=phadmin

# JWT Secrets (cambia estos valores en producción!)
JWT_ACCESS_SECRET=tu_secreto_access_muy_seguro
JWT_REFRESH_SECRET=tu_secreto_refresh_muy_seguro
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_SECONDS=2592000

# CORS
ALLOWED_ORIGIN=http://localhost:5500

# Email (opcional por ahora)
EMAIL_PROVIDER=smtp
SENDGRID_API_KEY=
EMAIL_FROM="PH PTY Administration" <no-reply@example.com>
```

**Importante:** Reemplaza `tu_password` con tu contraseña de MySQL root.

## 4. Instalar dependencias

```bash
cd backend
npm install
```

## 5. Ejecutar migraciones

Esto creará todas las tablas en la base de datos:

```bash
npm run migrate
```

Deberías ver: `✅ Migrations complete`

## 6. Crear primer usuario admin

```bash
npm run create-admin [email] [password] [nombre]
```

Ejemplo:
```bash
npm run create-admin admin@phpty.com Admin123! "Administrador Principal"
```

## 7. Iniciar el servidor

```bash
npm run dev
```

Deberías ver: `API listening on http://localhost:4000`

## Verificar que funciona

Prueba el endpoint de health:
```bash
curl http://localhost:4000/health
```

Debería responder: `{"ok":true}`

## Troubleshooting

### Error: "Access denied for user"
- Verifica que el usuario y contraseña en `.env` sean correctos
- Asegúrate de que MySQL esté corriendo

### Error: "Unknown database 'phadmin'"
- Ejecuta el CREATE DATABASE del paso 2

### Error: "Can't connect to MySQL server"
- Verifica que MySQL esté corriendo
- Verifica el puerto (por defecto 3306)
- Asegúrate de que el host sea 'localhost'

