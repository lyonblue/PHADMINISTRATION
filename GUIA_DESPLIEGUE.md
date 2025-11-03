# 🚀 Guía de Despliegue a Producción

Esta guía explica paso a paso cómo publicar tu aplicación PH PTY Administration en un servidor real para que esté disponible en internet.

---

## 📋 Índice

1. [Opciones de Hosting](#opciones-de-hosting)
2. [Requisitos Previos](#requisitos-previos)
3. [Configuración del Backend](#configuración-del-backend)
4. [Configuración de la Base de Datos](#configuración-de-la-base-de-datos)
5. [Configuración del Frontend](#configuración-del-frontend)
6. [Despliegue Completo: Opción 1 - VPS (Servidor Virtual)](#despliegue-completo-opción-1---vps-servidor-virtual)
7. [Despliegue Completo: Opción 2 - Plataformas Cloud](#despliegue-completo-opción-2---plataformas-cloud)
8. [Configuración de Dominio y SSL](#configuración-de-dominio-y-ssl)
9. [Mantenimiento Post-Despliegue](#mantenimiento-post-despliegue)
10. [Solución de Problemas](#solución-de-problemas)

---

## Opciones de Hosting

Tienes varias opciones para publicar tu aplicación:

### 🖥️ **VPS (Servidor Virtual Privado)**
- **Ejemplos**: DigitalOcean, Linode, Vultr, AWS EC2
- **Ventajas**: Control total, precio fijo mensual
- **Desventajas**: Requiere configuración manual
- **Precio**: $5-20/mes aprox.
- **Mejor para**: Control completo, aprender servidores

### ☁️ **Plataformas Cloud (PaaS)**
- **Ejemplos**: Heroku, Railway, Render, Fly.io
- **Ventajas**: Fácil de configurar, despliegue automático
- **Desventajas**: Menos control, puede ser más caro
- **Precio**: $0-25/mes aprox. (según uso)
- **Mejor para**: Despliegue rápido sin mucho conocimiento técnico

### 📦 **Hosting Especializado**
- **Frontend**: Netlify, Vercel, GitHub Pages
- **Backend**: Back4App, Firebase Functions
- **Base de Datos**: PlanetScale, Supabase, AWS RDS
- **Ventajas**: Optimizado para cada parte
- **Desventajas**: Más complejo de conectar

**Recomendación para este proyecto**: Si eres principiante, usa **Railway** o **Render**. Si tienes experiencia, usa un **VPS**.

---

## Requisitos Previos

Antes de comenzar, necesitas:

1. ✅ Cuenta en un servicio de hosting
2. ✅ Dominio (opcional pero recomendado, ej: `phptyadmin.com`)
3. ✅ Acceso SSH al servidor (si usas VPS)
4. ✅ Git configurado localmente
5. ✅ Node.js instalado localmente (para pruebas)

---

## Configuración del Backend

### Paso 1: Actualizar Variables de Entorno

Crea o actualiza `backend/.env` con valores de producción:

```env
# ===========================================
# PRODUCCIÓN - Variables de Entorno
# ===========================================

# Entorno
NODE_ENV=production
PORT=4000

# Base de Datos (MySQL en producción)
DATABASE_URL=mysql://usuario:contraseña_segura@host:3306/phadministration
# Ejemplo real:
# DATABASE_URL=mysql://admin:miPassword123@mysql.example.com:3306/phadmin_prod

# JWT Secrets (¡MUY IMPORTANTE! Cambia estos valores)
JWT_ACCESS_SECRET=tu_secreto_super_seguro_y_largo_aqui_produccion
JWT_REFRESH_SECRET=otro_secreto_super_seguro_y_largo_aqui_produccion

# URLs
FRONTEND_URL=https://tudominio.com
ALLOWED_ORIGIN=https://tudominio.com
# Si tienes www y sin www:
# ALLOWED_ORIGIN=https://tudominio.com,https://www.tudominio.com

# ===========================================
# CORREO ELECTRÓNICO (Gmail SMTP)
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_de_aplicación_gmail
EMAIL_FROM=tu_email@gmail.com
PROPOSAL_EMAIL=kkillingbeck939@gmail.com
```

**⚠️ IMPORTANTE:**
- **NUNCA** subas el archivo `.env` a Git
- Genera secrets únicos y seguros para JWT
- Usa contraseñas fuertes para la base de datos
- Actualiza `FRONTEND_URL` y `ALLOWED_ORIGIN` con tu dominio real

### Paso 2: Compilar TypeScript

Antes de desplegar, compila el código TypeScript:

```bash
cd backend
npm install
npm run build
```

Esto crea la carpeta `dist/` con JavaScript compilado.

### Paso 3: Probar Localmente en Modo Producción

```bash
cd backend
NODE_ENV=production npm start
```

Verifica que todo funcione correctamente antes de desplegar.

---

## Configuración de la Base de Datos

### Opción A: Base de Datos en el Mismo Servidor (VPS)

Si usas un VPS, puedes instalar MySQL directamente:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# Crear base de datos
mysql -u root -p
CREATE DATABASE phadmin_prod;
CREATE USER 'phadmin_user'@'localhost' IDENTIFIED BY 'contraseña_segura';
GRANT ALL PRIVILEGES ON phadmin_prod.* TO 'phadmin_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Opción B: Base de Datos Cloud (Recomendado)

**PlanetScale** (MySQL Serverless - Gratis hasta cierto punto):
1. Ve a https://planetscale.com
2. Crea una cuenta
3. Crea una nueva base de datos
4. Obtén la URL de conexión: `mysql://usuario:pass@host:3306/db`
5. Usa esa URL en `DATABASE_URL`

**Render** (PostgreSQL gratuito):
1. Ve a https://render.com
2. Crea una base de datos PostgreSQL
3. Obtén la URL de conexión

**Nota**: Si usas PostgreSQL, necesitarás cambiar el código para usar `pg` en lugar de `mysql2`.

### Ejecutar Migraciones en Producción

```bash
cd backend
npm run migrate
```

O manualmente:
```bash
cd backend/migrations
mysql -u usuario -p phadmin_prod < 001_init.sql
mysql -u usuario -p phadmin_prod < 002_add_avatar.sql
# ... etc
```

---

## Configuración del Frontend

### Paso 1: Actualizar URL de la API

Abre `script.js` y cambia la URL del backend:

```javascript
// Cambiar esta línea:
const API_URL = 'http://localhost:4000';

// Por tu URL de producción:
const API_URL = 'https://api.tudominio.com';
// O si backend y frontend están en el mismo dominio:
const API_URL = 'https://tudominio.com/api';
```

### Paso 2: Optimizar para Producción

1. **Minificar archivos** (opcional pero recomendado):
   - Usa herramientas como `terser` para JavaScript
   - Usa `csso` para CSS

2. **Comprimir imágenes**:
   - Asegúrate de que las imágenes en `Media/` estén optimizadas

3. **Verificar enlaces**:
   - Asegúrate de que todos los recursos (CSS, JS, imágenes) se carguen correctamente

---

## Despliegue Completo: Opción 1 - VPS (Servidor Virtual)

### Configuración del Servidor

#### 1. Conectar por SSH

```bash
ssh root@tu_servidor_ip
```

#### 2. Instalar Node.js

```bash
# Instalar Node.js 18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

#### 3. Instalar MySQL (si lo usas localmente)

```bash
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### 4. Clonar el Repositorio

```bash
cd /var/www
git clone https://github.com/tu-usuario/PHADMINISTRATION.git
cd PHADMINISTRATION
```

#### 5. Configurar Backend

```bash
cd backend
npm install --production
npm run build

# Crear archivo .env
nano .env
# Pegar configuración de producción
# Guardar con Ctrl+X, luego Y, luego Enter
```

#### 6. Configurar Base de Datos

```bash
npm run migrate
npm run create-admin
```

#### 7. Instalar PM2 (Gestor de Procesos)

```bash
sudo npm install -g pm2

# Iniciar backend con PM2
cd /var/www/PHADMINISTRATION/backend
pm2 start dist/server.js --name phadmin-backend
pm2 save
pm2 startup  # Seguir instrucciones para iniciar en boot
```

#### 8. Instalar y Configurar Nginx

```bash
sudo apt install nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/phadmin
```

Pegar esta configuración:

```nginx
# Backend API
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    root /var/www/PHADMINISTRATION;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cachear assets estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/phadmin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 9. Instalar SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com -d api.tudominio.com
```

---

## Despliegue Completo: Opción 2 - Plataformas Cloud

### Railway (Recomendado - Fácil)

#### Backend:

1. Ve a https://railway.app
2. Crea cuenta con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecciona tu repositorio
5. Railway detecta automáticamente Node.js
6. Configura variables de entorno en la pestaña "Variables"
7. Agrega todas las variables de `backend/.env`
8. Railway despliega automáticamente
9. Obtén la URL pública (ej: `https://phadmin-production.up.railway.app`)

#### Frontend:

1. Opción 1: Servir archivos estáticos desde el backend
2. Opción 2: Usar Netlify/Vercel para frontend

### Render

#### Backend:

1. Ve a https://render.com
2. Crea cuenta
3. "New" → "Web Service"
4. Conecta repositorio de GitHub
5. Configuración:
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: `Node`
6. Agrega variables de entorno
7. Deploy

#### Base de Datos:

1. "New" → "PostgreSQL" (o usa MySQL externo)
2. Crea base de datos
3. Obtén URL de conexión
4. Actualiza `DATABASE_URL` en backend

### Heroku

1. Instalar Heroku CLI:
```bash
npm install -g heroku
heroku login
```

2. Crear aplicación:
```bash
cd backend
heroku create phadmin-backend
heroku addons:create cleardb:ignite  # MySQL gratuito
```

3. Configurar variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_ACCESS_SECRET=tu_secreto
# ... etc para todas las variables
```

4. Deploy:
```bash
git push heroku main
heroku run npm run migrate
```

---

## Configuración de Dominio y SSL

### 1. Configurar DNS

En tu proveedor de dominio (GoDaddy, Namecheap, etc.):

**Opción A - Subdominio para API:**
```
Tipo: A
Nombre: api
Valor: IP_del_servidor (si VPS) o dominio de Railway/Render
TTL: 3600
```

**Opción B - Mismo dominio:**
```
Tipo: A
Nombre: @
Valor: IP_del_servidor
TTL: 3600
```

### 2. SSL/HTTPS

**Let's Encrypt (VPS):**
```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

**Plataformas Cloud:**
- Railway: SSL automático
- Render: SSL automático
- Heroku: SSL automático

### 3. Actualizar CORS

Asegúrate de que `ALLOWED_ORIGIN` en `backend/.env` incluya tu dominio con HTTPS:

```env
ALLOWED_ORIGIN=https://tudominio.com,https://www.tudominio.com
```

---

## Mantenimiento Post-Despliegue

### Monitoreo

#### Usando PM2 (VPS):

```bash
# Ver logs
pm2 logs phadmin-backend

# Ver estado
pm2 status

# Reiniciar
pm2 restart phadmin-backend
```

#### Usando plataformas cloud:
- Railway: Dashboard con logs
- Render: Dashboard con logs
- Heroku: `heroku logs --tail`

### Actualizar Código

```bash
# En el servidor o localmente (si tienes CI/CD):
cd /var/www/PHADMINISTRATION
git pull origin main
cd backend
npm install
npm run build
pm2 restart phadmin-backend
```

### Backup de Base de Datos

```bash
# Crear backup
mysqldump -u usuario -p phadmin_prod > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u usuario -p phadmin_prod < backup_20240101.sql
```

### Actualizar Variables de Entorno

Si cambias `.env`:
1. Editar archivo en servidor
2. Reiniciar backend: `pm2 restart phadmin-backend`

---

## Solución de Problemas

### ❌ Error: "Cannot connect to database"

**Solución:**
- Verifica `DATABASE_URL` en `.env`
- Verifica que MySQL esté corriendo: `sudo systemctl status mysql`
- Verifica firewall permite puerto 3306

### ❌ Error: "CORS policy"

**Solución:**
- Verifica `ALLOWED_ORIGIN` en `.env`
- Asegúrate de incluir el dominio correcto (con https://)
- Revisa que no haya espacios extra

### ❌ Error: "SMTP not configured"

**Solución:**
- Verifica credenciales SMTP en `.env`
- Asegúrate de usar "Contraseña de aplicación" de Gmail
- Verifica que `EMAIL_FROM` y `SMTP_USER` sean el mismo

### ❌ Error 502 Bad Gateway (Nginx)

**Solución:**
- Verifica que backend esté corriendo: `pm2 status`
- Verifica puerto en configuración Nginx
- Revisa logs: `sudo tail -f /var/log/nginx/error.log`

### ❌ Frontend no carga recursos

**Solución:**
- Verifica rutas de archivos (deben ser relativas o absolutas)
- Verifica que `index.html` tenga las rutas correctas
- Revisa consola del navegador (F12)

### ❌ Token expira muy rápido

**Solución:**
- Verifica `ACCESS_TOKEN_TTL_SECONDS` en `.env`
- Por defecto es 900 segundos (15 minutos)
- Puedes aumentarlo pero no demasiado (seguridad)

---

## Checklist Pre-Despliegue

Antes de hacer el despliegue final, verifica:

- [ ] Todas las variables de entorno configuradas
- [ ] `NODE_ENV=production` en backend
- [ ] URL de API actualizada en frontend
- [ ] Base de datos creada y migraciones ejecutadas
- [ ] Usuario admin creado
- [ ] Correos SMTP configurados y probados
- [ ] SSL/HTTPS configurado
- [ ] CORS configurado correctamente
- [ ] Dominio apunta al servidor
- [ ] Backend responde en `/health`
- [ ] Frontend carga correctamente
- [ ] Login funciona
- [ ] Formulario de propuesta envía correos
- [ ] Chatbot funciona
- [ ] Panel de admin accesible solo para admins

---

## Recursos Adicionales

- **Documentación Nginx**: https://nginx.org/en/docs/
- **PM2 Documentación**: https://pm2.keymetrics.io/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **Railway Docs**: https://docs.railway.app/
- **Render Docs**: https://render.com/docs

---

## Soporte

Si tienes problemas:

1. Revisa los logs del backend
2. Revisa los logs del navegador (F12)
3. Verifica las variables de entorno
4. Revisa esta guía nuevamente
5. Consulta `GUIA_COMPLETA.md` para entender mejor el sistema

---

**Última actualización**: Esta guía cubre el despliegue de la versión con chatbot, formulario de propuesta y sistema de correos.

