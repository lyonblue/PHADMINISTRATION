# 💻 Guía de Instalación Local - Configurar en Otra Computadora

Esta guía explica cómo instalar y ejecutar el proyecto PH PTY Administration en una computadora nueva, desde cero.

---

## 📋 Índice

1. [Prerrequisitos](#prerrequisitos)
2. [Clonar/Descargar el Proyecto](#clonardescargar-el-proyecto)
3. [Instalar Node.js y MySQL](#instalar-nodejs-y-mysql)
4. [Configurar la Base de Datos](#configurar-la-base-de-datos)
5. [Configurar el Backend](#configurar-el-backend)
6. [Configurar el Frontend](#configurar-el-frontend)
7. [Ejecutar el Proyecto](#ejecutar-el-proyecto)
8. [Verificar que Funciona](#verificar-que-funciona)
9. [Solución de Problemas Comunes](#solución-de-problemas-comunes)

---

## Prerrequisitos

Antes de comenzar, necesitas:

1. ✅ Una computadora con Windows, macOS o Linux
2. ✅ Acceso a internet
3. ✅ Una terminal o línea de comandos (PowerShell, Terminal, CMD)
4. ✅ (Opcional) Git instalado para clonar el repositorio

---

## Clonar/Descargar el Proyecto

### Opción 1: Clonar con Git (Recomendado)

Si tienes el proyecto en GitHub:

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/PHADMINISTRATION.git

# Entrar a la carpeta
cd PHADMINISTRATION
```

### Opción 2: Descargar como ZIP

1. Ve al repositorio en GitHub
2. Click en "Code" → "Download ZIP"
3. Extrae el archivo ZIP
4. Abre la carpeta extraída

### Opción 3: Copiar desde USB/Disco/Nube

1. Copia toda la carpeta `PHADMINISTRATION` a la nueva computadora
2. Abre la carpeta en tu terminal

---

## Instalar Node.js y MySQL

### Windows

#### Node.js:

1. Ve a https://nodejs.org/
2. Descarga la versión **LTS** (Long Term Support)
3. Ejecuta el instalador
4. Acepta todas las opciones por defecto
5. Reinicia tu computadora
6. Verifica instalación:
   ```powershell
   node --version
   npm --version
   ```

#### MySQL:

1. Ve a https://dev.mysql.com/downloads/installer/
2. Descarga "MySQL Installer for Windows"
3. Ejecuta el instalador
4. Selecciona "Developer Default"
5. Configura contraseña para el usuario `root`
6. Completa la instalación
7. **Importante**: Recuerda la contraseña que configuraste

### macOS

#### Node.js:

```bash
# Opción 1: Usando Homebrew (recomendado)
brew install node

# Opción 2: Descargar desde nodejs.org
# Ve a https://nodejs.org/ y descarga el instalador .pkg
```

#### MySQL:

```bash
# Opción 1: Usando Homebrew
brew install mysql
brew services start mysql

# Opción 2: Descargar desde mysql.com
# Ve a https://dev.mysql.com/downloads/mysql/
```

### Linux (Ubuntu/Debian)

```bash
# Actualizar sistema
sudo apt update

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar MySQL
sudo apt install mysql-server
sudo mysql_secure_installation

# Verificar instalación
node --version
npm --version
mysql --version
```

---

## Configurar la Base de Datos

### Paso 1: Iniciar MySQL

**Windows:**
- Busca "Services" en el menú de inicio
- Busca "MySQL80" y asegúrate de que esté "Running"
- O usa MySQL Workbench o la línea de comandos

**macOS:**
```bash
brew services start mysql
```

**Linux:**
```bash
sudo systemctl start mysql
sudo systemctl enable mysql  # Para iniciar automáticamente
```

### Paso 2: Crear Base de Datos

Abre una terminal y ejecuta:

```bash
# Conectar a MySQL (usar la contraseña que configuraste)
mysql -u root -p
```

Se te pedirá la contraseña. Después de ingresar, ejecuta:

```sql
-- Crear la base de datos
CREATE DATABASE phadmin_db;

-- Crear un usuario (opcional, pero recomendado)
CREATE USER 'phadmin_user'@'localhost' IDENTIFIED BY 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON phadmin_db.* TO 'phadmin_user'@'localhost';
FLUSH PRIVILEGES;

-- Verificar que se creó
SHOW DATABASES;

-- Salir
EXIT;
```

### Paso 3: Configurar URL de Base de Datos

Anota la siguiente información para el paso siguiente:
- **Usuario**: `root` o `phadmin_user`
- **Contraseña**: La que configuraste
- **Base de datos**: `phadmin_db`
- **Host**: `localhost` (normalmente)
- **Puerto**: `3306` (puerto por defecto)

La URL será: `mysql://usuario:contraseña@localhost:3306/phadmin_db`

---

## Configurar el Backend

### Paso 1: Instalar Dependencias

```bash
# Navegar a la carpeta del backend
cd PHADMINISTRATION/backend

# Instalar todas las herramientas necesarias
npm install
```

Esto puede tardar unos minutos. Al final deberías ver un mensaje como "added X packages".

### Paso 2: Crear Archivo `.env`

Crea un archivo llamado `.env` en la carpeta `backend/`:

**Windows (PowerShell):**
```powershell
cd backend
New-Item -Path .env -ItemType File
notepad .env
```

**macOS/Linux:**
```bash
cd backend
touch .env
nano .env
```

O simplemente crea un archivo de texto llamado `.env` en la carpeta `backend/`.

### Paso 3: Configurar Variables de Entorno

Copia y pega esto en el archivo `.env`, **y actualiza los valores**:

```env
# ===========================================
# DESARROLLO LOCAL - Variables de Entorno
# ===========================================

# Entorno
NODE_ENV=development
PORT=4000

# Base de Datos MySQL
# IMPORTANTE: Actualiza usuario, contraseña y nombre de base de datos
DATABASE_URL=mysql://root:tu_contraseña_mysql@localhost:3306/phadmin_db
# Ejemplo si creaste un usuario:
# DATABASE_URL=mysql://phadmin_user:tu_contraseña_segura@localhost:3306/phadmin_db

# JWT Secrets (pueden ser cualquier string largo y aleatorio)
JWT_ACCESS_SECRET=dev_access_secret_cambiar_en_produccion
JWT_REFRESH_SECRET=dev_refresh_secret_cambiar_en_produccion

# URLs
FRONTEND_URL=http://localhost:8000
ALLOWED_ORIGIN=*

# ===========================================
# CORREO ELECTRÓNICO (Opcional para desarrollo)
# ===========================================
# Si no configuras esto, el formulario de propuesta no enviará correos
# pero el resto del sistema funcionará normalmente
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_de_aplicación_gmail
EMAIL_FROM=tu_email@gmail.com
PROPOSAL_EMAIL=kkillingbeck939@gmail.com
```

**⚠️ IMPORTANTE:**
- Cambia `tu_contraseña_mysql` por la contraseña real de MySQL
- Si usaste un usuario diferente, actualiza la URL completa
- Los JWT secrets pueden ser cualquier string largo (p. ej., "mi_secreto_super_seguro_123")

### Paso 4: Compilar TypeScript

```bash
cd backend
npm run build
```

Esto convierte el código TypeScript en JavaScript y crea la carpeta `dist/`.

### Paso 5: Ejecutar Migraciones

Esto crea todas las tablas necesarias en la base de datos:

```bash
cd backend
npm run migrate
```

Si todo va bien, verás mensajes como "✅ Migration 001_init.sql executed successfully".

### Paso 6: Crear Usuario Administrador

```bash
cd backend
npm run create-admin
```

Te pedirá:
- Email
- Contraseña
- Nombre completo

**Guarda esta información**, la necesitarás para hacer login.

---

## Configurar el Frontend

### Paso 1: Verificar URL de la API

Abre `script.js` y verifica que la URL del backend sea correcta:

```javascript
// Debe ser (línea ~29):
const API_URL = 'http://localhost:4000';
```

Si el backend está en otro puerto o computadora, cámbiala aquí.

### Paso 2: Verificar Archivos Estáticos

Asegúrate de que todos los archivos estén presentes:
- `index.html`
- `login.html`
- `register.html`
- `script.js`
- `app-routing.js`
- Carpeta `styles/` con todos los archivos CSS
- Carpeta `js/` con `chatbot.js` y `utils.js`
- Carpeta `Media/` con las imágenes

---

## Ejecutar el Proyecto

### Paso 1: Iniciar el Backend

Abre una terminal y ejecuta:

```bash
cd PHADMINISTRATION/backend
npm run dev
```

Deberías ver:
```
API listening on http://localhost:4000
```

**⚠️ NO cierres esta terminal.** El backend debe seguir corriendo.

### Paso 2: Abrir el Frontend

Tienes varias opciones:

#### Opción A: Abrir directamente (limitado)

Simplemente abre `index.html` en tu navegador haciendo doble clic.

**Problema**: Algunas funcionalidades pueden no funcionar por restricciones de CORS.

#### Opción B: Usar un servidor local simple

**Python (si está instalado):**
```bash
# Desde la raíz del proyecto (PHADMINISTRATION/)
python -m http.server 8000
```

**Node.js http-server:**
```bash
# Instalar globalmente (solo una vez)
npm install -g http-server

# Ejecutar
cd PHADMINISTRATION
http-server -p 8000
```

**VS Code Live Server:**
1. Instala la extensión "Live Server" en VS Code
2. Click derecho en `index.html`
3. Selecciona "Open with Live Server"

#### Opción C: Usar npx (sin instalar nada)

```bash
cd PHADMINISTRATION
npx http-server -p 8000
```

### Paso 3: Abrir en el Navegador

Una vez que el servidor esté corriendo, abre tu navegador y ve a:

```
http://localhost:8000
```

---

## Verificar que Funciona

### ✅ Checklist de Verificación:

1. **Backend corriendo:**
   - Ve a http://localhost:4000 en tu navegador
   - Deberías ver: `{"message":"PH PTY Administration API",...}`

2. **Frontend carga:**
   - Ve a http://localhost:8000
   - Deberías ver la página principal

3. **Noticias cargan:**
   - En la página principal, deberías ver noticias (aunque estén vacías)

4. **Login funciona:**
   - Ve a http://localhost:8000/login.html
   - Ingresa el email y contraseña del admin que creaste
   - Deberías poder iniciar sesión

5. **Formulario de propuesta:**
   - Ve a la sección "Propuesta" (#propuesta)
   - Llena el formulario y envía
   - Si configuraste correos, deberías recibirlos
   - Si no, al menos deberías ver el mensaje de éxito

6. **Chatbot funciona:**
   - Deberías ver el botón del chatbot en la esquina inferior derecha
   - Al hacer clic, debería abrirse el chat

---

## Solución de Problemas Comunes

### ❌ Error: "Cannot find module 'express'"

**Problema**: Las dependencias no están instaladas.

**Solución:**
```bash
cd backend
npm install
```

### ❌ Error: "Access denied for user"

**Problema**: Credenciales de MySQL incorrectas en `.env`.

**Solución:**
1. Verifica la contraseña de MySQL
2. Verifica que el usuario exista
3. Verifica la URL en `DATABASE_URL` en `.env`

### ❌ Error: "Port 4000 already in use"

**Problema**: Otro programa está usando el puerto 4000.

**Solución:**

**Windows:**
```powershell
# Encontrar qué usa el puerto
netstat -ano | findstr :4000

# Matar el proceso (reemplaza PID con el número que aparezca)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Encontrar qué usa el puerto
lsof -i :4000

# Matar el proceso (reemplaza PID)
kill -9 <PID>
```

O simplemente cambia el puerto en `backend/.env`:
```env
PORT=4001
```

Y actualiza `script.js`:
```javascript
const API_URL = 'http://localhost:4001';
```

### ❌ Error: "Database phadmin_db does not exist"

**Problema**: La base de datos no fue creada.

**Solución:**
```bash
mysql -u root -p
CREATE DATABASE phadmin_db;
EXIT;
```

### ❌ Error: "ECONNREFUSED" o "Cannot connect to backend"

**Problema**: El backend no está corriendo o la URL es incorrecta.

**Solución:**
1. Verifica que el backend esté corriendo (`npm run dev` en la carpeta backend)
2. Verifica que la URL en `script.js` sea correcta
3. Verifica que el puerto sea el correcto (4000 por defecto)

### ❌ Error: "CORS policy" en el navegador

**Problema**: El frontend y backend están en diferentes orígenes o el backend no está corriendo.

**Solución:**
1. Asegúrate de que el backend esté corriendo
2. Si usas un servidor local para el frontend, verifica que sea http://localhost:8000
3. Verifica `ALLOWED_ORIGIN=*` en `backend/.env`

### ❌ Error: "npm: command not found"

**Problema**: Node.js no está instalado o no está en el PATH.

**Solución:**
1. Reinstala Node.js desde nodejs.org
2. Reinicia la terminal
3. Verifica con `node --version` y `npm --version`

### ❌ Error: "MySQL command not found"

**Problema**: MySQL no está instalado o no está en el PATH.

**Solución:**
- **Windows**: Agrega MySQL al PATH o usa MySQL Workbench
- **macOS/Linux**: Reinstala MySQL o usa la ruta completa: `/usr/local/mysql/bin/mysql`

---

## Comandos Rápidos de Referencia

```bash
# Instalar dependencias del backend
cd backend && npm install

# Compilar TypeScript
cd backend && npm run build

# Ejecutar migraciones
cd backend && npm run migrate

# Crear admin
cd backend && npm run create-admin

# Iniciar backend en modo desarrollo
cd backend && npm run dev

# Iniciar backend en modo producción
cd backend && npm start

# Servidor simple para frontend
npx http-server -p 8000
```

---

## Estructura Final Esperada

Tu proyecto debería verse así:

```
PHADMINISTRATION/
├── backend/
│   ├── .env                 ← Tu archivo de configuración
│   ├── dist/                ← Código compilado (después de npm run build)
│   ├── node_modules/        ← Dependencias (después de npm install)
│   ├── src/                 ← Código fuente TypeScript
│   ├── migrations/          ← Scripts SQL
│   └── package.json
├── styles/                  ← Archivos CSS
├── js/                      ← JavaScript modularizado
├── Media/                   ← Imágenes
├── index.html
├── login.html
├── register.html
├── script.js
└── app-routing.js
```

---

## Siguiente Paso

Una vez que todo funcione localmente:

1. ✅ Prueba todas las funcionalidades
2. ✅ Crea algunos usuarios de prueba
3. ✅ Prueba el formulario de propuesta
4. ✅ Prueba el chatbot
5. ✅ Lee `GUIA_DESPLIEGUE.md` si quieres publicarlo en internet

---

## Notas Importantes

- **Nunca subas el archivo `.env` a Git** - contiene contraseñas
- **Guarda las credenciales** del admin que creas
- **El backend debe estar corriendo** para que el frontend funcione completamente
- **Usa `npm run dev`** para desarrollo (recarga automática)
- **Usa `npm start`** para producción (optimizado)

---

**Última actualización**: Esta guía cubre la instalación en Windows, macOS y Linux.

