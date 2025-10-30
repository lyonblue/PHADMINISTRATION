# 🚀 Guía Paso a Paso - Configurar el Backend

## ¿Qué vamos a hacer?
Vamos a conectar tu aplicación con MySQL y hacer que el servidor funcione.

---

## PASO 1: Verificar que MySQL está funcionando

### Opción A: Desde la línea de comandos (Terminal/PowerShell)
1. Abre PowerShell o Terminal
2. Escribe:
   ```bash
   mysql -u root -p
   ```
3. Si te pide contraseña, es la que configuraste al instalar MySQL
4. Si funciona, verás algo como: `mysql>`

### Opción B: Usar MySQL Workbench
1. Abre MySQL Workbench (viene con MySQL)
2. Conéctate con tu usuario y contraseña

✅ **Si puedes conectarte, pasa al siguiente paso**

---

## PASO 2: Crear la base de datos

### Desde la línea de comandos:
1. Si ya estás dentro de MySQL (paso anterior):
   ```sql
   CREATE DATABASE phadmin;
   ```
2. Verifica que se creó:
   ```sql
   SHOW DATABASES;
   ```
3. Deberías ver `phadmin` en la lista
4. Sal de MySQL:
   ```sql
   exit;
   ```

### Desde MySQL Workbench:
1. Click en el botón "New Query" (o `Ctrl+T`)
2. Escribe:
   ```sql
   CREATE DATABASE phadmin;
   ```
3. Click en el rayo ⚡ para ejecutar
4. Deberías ver un mensaje de éxito

✅ **Base de datos creada, pasa al siguiente paso**

---

## PASO 3: Configurar el archivo .env

### ¿Qué es esto?
Es un archivo donde guardamos las configuraciones secretas (como contraseñas).

### Pasos:
1. Ve a la carpeta `backend`
2. Crea un archivo llamado `.env` (sin extensión, solo `.env`)
3. Abre ese archivo con un editor de texto
4. Copia y pega esto (¡CAMBIAR LA CONTRASEÑA!):

```env
PORT=4000
NODE_ENV=development

# MySQL - Cambia "tu_password_aqui" por tu contraseña de MySQL
DATABASE_URL=mysql://root:tu_password_aqui@localhost:3306/phadmin

# JWT - Cambia estos por valores secretos diferentes
JWT_ACCESS_SECRET=mi_secreto_super_seguro_123
JWT_REFRESH_SECRET=mi_otro_secreto_super_seguro_456
ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_SECONDS=2592000

# CORS
ALLOWED_ORIGIN=http://localhost:5500

# Email (por ahora déjalo así)
EMAIL_PROVIDER=smtp
SENDGRID_API_KEY=
EMAIL_FROM="PH PTY Administration" <no-reply@example.com>
```

### ⚠️ IMPORTANTE:
- Cambia `tu_password_aqui` por tu contraseña real de MySQL
- Si tu usuario de MySQL NO es `root`, cambia también `root` por tu usuario
- Guarda el archivo

✅ **Archivo .env configurado, pasa al siguiente paso**

---

## PASO 4: Instalar las dependencias (paquetes necesarios)

1. Abre PowerShell o Terminal
2. Ve a la carpeta backend:
   ```bash
   cd backend
   ```
   (Si estás en Windows y la carpeta está en OneDrive, será algo como:)
   ```bash
   cd "C:\Users\kkill\OneDrive\Documentos\GitHub\PHADMINISTRATION\backend"
   ```

3. Instala los paquetes:
   ```bash
   npm install
   ```

4. Espera a que termine (puede tardar 1-2 minutos)

✅ **Deberías ver muchos mensajes y al final algo como "added X packages"**

---

## PASO 5: Crear las tablas en MySQL

Esto crea las tablas necesarias (usuarios, tokens, etc.) en tu base de datos:

```bash
npm run migrate
```

✅ **Deberías ver: "✅ Migrations complete"**

Si ves un error:
- Verifica que el archivo `.env` tiene la contraseña correcta
- Verifica que MySQL está corriendo
- Verifica que la base de datos `phadmin` existe

---

## PASO 6: Crear el primer usuario administrador

Este será tu usuario admin para acceder:

```bash
npm run create-admin admin@phpty.com Admin123! "Administrador Principal"
```

O simplemente:
```bash
npm run create-admin
```
(Usa valores por defecto)

✅ **Deberías ver: "✅ Admin creado exitosamente" con las credenciales**

---

## PASO 7: Iniciar el servidor

Ahora sí, vamos a poner el servidor en funcionamiento:

```bash
npm run dev
```

✅ **Deberías ver: "API listening on http://localhost:4000"**

### ¡Listo! El servidor está corriendo 🎉

---

## PASO 8: Verificar que funciona

Abre otra ventana de PowerShell/Terminal y prueba:

```bash
curl http://localhost:4000/health
```

O ve en tu navegador a: `http://localhost:4000/health`

Deberías ver: `{"ok":true}`

---

## ⚠️ Resumen de comandos importantes

```bash
# Ir a la carpeta backend
cd backend

# Instalar paquetes (solo la primera vez)
npm install

# Crear tablas (solo la primera vez)
npm run migrate

# Crear admin (solo la primera vez)
npm run create-admin

# Iniciar servidor (cada vez que quieras usarlo)
npm run dev
```

---

## 🔧 Si algo no funciona

### Error: "Cannot find module"
→ Ejecuta: `npm install`

### Error: "Access denied"
→ Tu contraseña en `.env` está mal, revísala

### Error: "Unknown database"
→ Ejecuta el paso 2 de nuevo (crear base de datos)

### Error: "Can't connect to MySQL"
→ MySQL no está corriendo. Inícialo desde MySQL Workbench o servicios de Windows

### Puerto 4000 ocupado
→ Cambia `PORT=4000` a otro número en `.env` (ej: `PORT=4001`)

---

## 📝 Para detener el servidor

En la ventana donde está corriendo `npm run dev`, presiona: `Ctrl + C`

---

## ✅ Checklist final

- [ ] MySQL está instalado y funcionando
- [ ] Base de datos `phadmin` creada
- [ ] Archivo `.env` creado con la contraseña correcta
- [ ] `npm install` ejecutado sin errores
- [ ] `npm run migrate` ejecutado sin errores
- [ ] `npm run create-admin` ejecutado sin errores
- [ ] `npm run dev` muestra "API listening on http://localhost:4000"

Si todos los checkboxes están marcados, ¡tu backend está funcionando! 🎉

