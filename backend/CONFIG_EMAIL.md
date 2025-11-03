# 📧 Configuración de Correo Electrónico (Gmail SMTP)

## ¿Cómo funciona?

El sistema de correos usa **Gmail SMTP** para enviar emails automáticamente cuando alguien envía una propuesta. Se envían 2 correos:

1. **Correo al equipo** → Se envía a `kkillingbeck939@gmail.com` con los datos de la propuesta
2. **Correo de confirmación al usuario** → Se envía al email que el usuario ingresó en el formulario

## ⚙️ Configuración paso a paso

### Paso 1: Crear archivo `.env` en la carpeta `backend`

Crea un archivo llamado `.env` en la carpeta `backend/` con el siguiente contenido:

```env
# ===========================================
# CONFIGURACIÓN DE CORREO ELECTRÓNICO (SMTP)
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_de_aplicación_aqui
EMAIL_FROM=tu_email@gmail.com
PROPOSAL_EMAIL=kkillingbeck939@gmail.com

# ===========================================
# OTRA CONFIGURACIÓN
# ===========================================
PORT=4000
NODE_ENV=development
DATABASE_URL=mysql://usuario:contraseña@localhost:3306/phadministration
JWT_ACCESS_SECRET=tu_secret_access_aqui
JWT_REFRESH_SECRET=tu_secret_refresh_aqui
FRONTEND_URL=http://localhost
ALLOWED_ORIGIN=*
```

### Paso 2: Obtener una "Contraseña de aplicación" de Gmail

**⚠️ IMPORTANTE:** Gmail NO permite usar tu contraseña normal. Necesitas crear una "Contraseña de aplicación".

#### Pasos:

1. **Activar verificación en dos pasos** (si no la tienes):
   - Ve a: https://myaccount.google.com/security
   - Activa "Verificación en dos pasos"

2. **Crear contraseña de aplicación**:
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona:
     - **Aplicación:** "Correo"
     - **Dispositivo:** "Otro (nombre personalizado)" → escribe "PH Administration"
   - Haz clic en "Generar"
   - **Copia la contraseña de 16 caracteres** (se verá algo como: `abcd efgh ijkl mnop`)

3. **Usar la contraseña de aplicación**:
   - En tu archivo `.env`, reemplaza `tu_contraseña_de_aplicación_aqui` con la contraseña de 16 caracteres (sin espacios)
   - También reemplaza `tu_email@gmail.com` con tu email real de Gmail

### Paso 3: Reiniciar el servidor backend

Después de crear el archivo `.env`, reinicia el servidor:

```bash
cd backend
npm run dev
```

## 🧪 Probar que funciona

1. Abre el formulario de propuesta en el sitio web
2. Llena todos los campos
3. Envía el formulario
4. Deberías recibir:
   - Un correo en `kkillingbeck939@gmail.com` con los datos de la propuesta
   - Un correo de confirmación en el email que ingresaste en el formulario

## ❌ Si no funciona

### Error: "SMTP_NO_CONFIGURED"
- Verifica que el archivo `.env` esté en `backend/.env` (no en otra carpeta)
- Verifica que todas las variables estén configuradas
- Verifica que no haya espacios extra en los valores

### Error: "EAUTH" o "Error de autenticación"
- Verifica que estés usando una **contraseña de aplicación**, NO tu contraseña normal de Gmail
- Verifica que la contraseña de aplicación esté copiada correctamente (sin espacios)
- Verifica que tu email en `SMTP_USER` y `EMAIL_FROM` sea el mismo

### Error: "EENVELOPE"
- Verifica que `EMAIL_FROM` sea el mismo email que `SMTP_USER`

## 📝 Notas importantes

- **NUNCA compartas** tu archivo `.env` - contiene credenciales sensibles
- El archivo `.env` ya está en `.gitignore` para que no se suba a Git
- Si cambias la configuración, siempre reinicia el servidor backend

