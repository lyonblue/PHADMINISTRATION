# 📚 Guía Completa del Proyecto PH PTY Administration

**Para personas sin conocimientos de desarrollo web**

Esta guía explica TODO el proyecto de manera simple y clara, como si estuvieras aprendiendo desde cero.

---

## 📋 Índice

1. [¿Qué es este proyecto?](#qué-es-este-proyecto)
2. [Conceptos básicos que debes saber](#conceptos-básicos-que-debes-saber)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Cómo funciona: Flujo completo](#cómo-funciona-flujo-completo)
5. [Explicación detallada de cada parte](#explicación-detallada-de-cada-parte)
6. [Tecnologías utilizadas](#tecnologías-utilizadas)
7. [Cómo ejecutar el proyecto](#cómo-ejecutar-el-proyecto)

---

## ¿Qué es este proyecto?

**PH PTY Administration** es un sistema web completo para administrar propiedades horizontales (edificios residenciales) en Panamá. Permite:

- **Mostrar información** sobre la empresa (servicios, misión, visión) bajo **Ley 284**
- **Publicar noticias** para los residentes
- **Gestionar testimonios** de clientes
- **Recibir solicitudes de propuesta** mediante formulario público (sin necesidad de registro)
- **Chatbot integrado** para asistencia a usuarios
- **Administrar usuarios** del sistema
- **Panel de control** para administradores
- **Envío automático de correos** cuando se reciben propuestas

---

## Conceptos básicos que debes saber

### 🌐 ¿Qué es una aplicación web?

Imagina un restaurante:
- **Frontend** = El comedor donde los clientes ven el menú y hacen pedidos
- **Backend** = La cocina donde se preparan los pedidos
- **Base de datos** = La despensa donde se guardan los ingredientes

En este proyecto:
- **Frontend**: Lo que el usuario ve en el navegador (HTML, CSS, JavaScript)
- **Backend**: El servidor que procesa las peticiones (Node.js, Express)
- **Base de datos**: MySQL donde se guarda toda la información

### 🔄 ¿Cómo se comunican?

```
Usuario (Frontend) → Envía petición → Backend → Consulta Base de Datos
                                            ↓
Usuario ← Recibe respuesta ← Backend ← Devuelve datos
```

### 🔐 ¿Qué es la autenticación?

Es como mostrar tu DNI para entrar a un lugar. En este proyecto:
- **Login**: Verificar que eres quien dices ser (email + contraseña)
- **Token**: Un "pase temporal" que te permite hacer acciones sin volver a ingresar tu contraseña
- **Rol**: Admin (puede todo) o Usuario (limitado)

---

## Estructura del proyecto

```
PHADMINISTRATION/
│
├── 📁 backend/              ← El servidor (cocina)
│   ├── src/                ← Código fuente
│   │   ├── routes/         ← Rutas (puertas de entrada)
│   │   ├── services/       ← Lógica de negocio
│   │   ├── middleware/     ← Seguridad y validaciones
│   │   ├── db/             ← Conexión a base de datos
│   │   └── utils/          ← Utilidades (enviar emails, etc.)
│   ├── migrations/         ← Scripts para crear tablas en BD
│   └── package.json        ← Lista de herramientas necesarias
│
├── 📁 Media/               ← Imágenes (logos, fondos)
├── 📁 styles/              ← CSS modularizado (buenas prácticas)
│   ├── main.css           ← Archivo principal que importa todos
│   ├── 01-variables.css   ← Variables CSS (colores, fuentes)
│   ├── 02-reset.css       ← Reset de estilos del navegador
│   ├── 03-layout.css      ← Layout general
│   ├── 04-navbar.css      ← Estilos del navbar
│   ├── 05-buttons.css     ← Estilos de botones
│   ├── 06-user-menu.css   ← Menú de usuario
│   ├── 07-forms.css       ← Formularios
│   ├── 08-modals.css      ← Modales
│   ├── 09-news.css        ← Noticias
│   ├── 10-testimonials.css ← Testimonios
│   ├── 11-admin.css       ← Panel de administración
│   ├── 12-login.css       ← Página de login
│   ├── 13-footer.css      ← Footer
│   ├── 14-responsive.css  ← Responsive
│   └── 15-chatbot.css     ← Chatbot
├── 📁 js/                  ← JavaScript modularizado
│   ├── chatbot.js         ← Lógica del chatbot
│   └── utils.js           ← Utilidades compartidas
│
├── 📄 index.html           ← Página principal (lo que ve el usuario)
├── 📄 login.html           ← Página de inicio de sesión
├── 📄 register.html        ← Página de registro
├── 📄 script.js            ← JavaScript del frontend (lógica principal)
└── 📄 app-routing.js       ← Navegación entre secciones
```

---

## Cómo funciona: Flujo completo

### Escenario 1: Usuario visita la página principal

```
1. Usuario abre index.html en su navegador
2. El navegador carga:
   - index.html (estructura)
   - style.css (diseño)
   - script.js (comportamiento)
   - app-routing.js (navegación)
3. script.js hace una petición al backend: "Dame las noticias"
4. Backend consulta la base de datos
5. Backend responde con las noticias
6. script.js muestra las noticias en la página
```

### Escenario 2: Usuario inicia sesión

```
1. Usuario llena login.html (email + contraseña)
2. login.js envía datos al backend: POST /auth/login
3. Backend verifica:
   - ¿Existe el email?
   - ¿La contraseña es correcta?
4. Si es correcto:
   - Backend genera un "token" (como un pase de acceso)
   - Guarda el token en una cookie
   - Responde con el token y el rol del usuario
5. login.js guarda el token en localStorage
6. Redirige a index.html
7. script.js verifica si hay token → Muestra menú de usuario
```

### Escenario 3: Admin publica una noticia

```
1. Admin (con token válido) llena formulario en index.html
2. script.js comprime la imagen (reduce tamaño)
3. Envía todo al backend: POST /news (con token en header)
4. Backend verifica:
   - ¿El token es válido?
   - ¿El usuario es admin?
5. Si todo OK:
   - Guarda la noticia en la base de datos
   - Responde "éxito"
6. script.js recarga la lista de noticias
7. La noticia aparece en la página pública
```

---

## Explicación detallada de cada parte

### 📁 Frontend (Lo que ve el usuario)

#### **index.html**
**¿Qué es?** La página principal donde se muestra todo el contenido.

**¿Qué contiene?**
- **Navbar**: Menú de navegación (Inicio, Servicios, Noticias, etc.)
- **Secciones**:
  - `#inicio`: Presentación de la empresa
  - `#quienes`: Quiénes somos
  - `#servicios`: Lista de servicios
  - `#noticias`: Carrusel de noticias
  - `#testimonios`: Testimonios de clientes
  - `#propuesta`: Formulario para solicitar propuestas (funciona sin login)
  - `#administracion`: Panel de admin (solo visible para admins)

**¿Cómo funciona?**
- Usa `app-routing.js` para mostrar/ocultar secciones según el hash (#inicio, #noticias)
- Cada sección tiene la clase `.section`, solo una tiene `.on` a la vez

#### **script.js**
**¿Qué es?** El cerebro del frontend. Maneja toda la lógica que el usuario no ve.

**Principales funciones:**

1. **`loadNews()`**: Pide noticias al backend y las muestra
   ```javascript
   fetch(`${API_URL}/news`) → Backend responde → Muestra en pantalla
   ```

2. **`loadUserProfile()`**: Verifica si el usuario está logueado
   ```javascript
   ¿Hay token en localStorage? 
   → Si: Pregunta al backend "¿Soy válido?"
   → Si válido: Muestra menú de usuario
   → Si no: Muestra botón de login
   ```

3. **`loadTestimonials()`**: Carga testimonios públicos
4. **`initUserMenuEvents()`**: Maneja avatar, nombre, cambiar contraseña
5. **`loadAdminNews()`, `loadAdminUsers()`**: Funciones solo para admins

**Conceptos importantes:**
- **`$()`**: Función corta para seleccionar un elemento del HTML (ej: `$('#miBoton')`)
- **`$$()`**: Para seleccionar múltiples elementos
- **`fetch()`**: Cómo el frontend habla con el backend
- **`localStorage`**: Almacenamiento temporal en el navegador (guarda el token)

#### **login.html y login.js**
**¿Qué es?** Página y lógica para iniciar sesión.

**Flujo:**
1. Usuario ingresa email y contraseña
2. `login.js` valida que el email tenga formato correcto
3. Envía datos al backend: `POST /auth/login`
4. Backend verifica credenciales
5. Si correcto: Guarda token y redirige a index.html

#### **register.html y register.js**
**¿Qué es?** Página y lógica para crear cuenta nueva.

**Validaciones:**
- Email válido (debe tener @ y .com/.net/etc)
- Contraseña segura (mínimo 8 caracteres, con letra y número)
- Contraseñas coinciden

#### **app-routing.js**
**¿Qué es?** Controla qué sección se muestra según la URL.

**Cómo funciona:**
- Si URL es `#inicio` → Muestra sección inicio
- Si URL es `#noticias` → Muestra sección noticias
- Si URL es `#administracion` → Verifica que sea admin, sino redirige

### 📁 Backend (El servidor)

#### **server.ts**
**¿Qué es?** El punto de entrada. Configura el servidor y define las rutas.

**¿Qué hace?**
1. Crea el servidor Express
2. Configura seguridad (Helmet, CORS)
3. Habilita lectura de cookies
4. Aplica límite de peticiones (rate limiting)
5. Conecta las rutas:
   - `/auth/*` → Autenticación (login, register, logout)
   - `/me` → Perfil del usuario actual
   - `/admin/*` → Funciones de administrador
   - `/news` → Noticias
   - `/testimonials` → Testimonios

#### **routes/auth.ts**
**¿Qué es?** Maneja todo lo relacionado con autenticación.

**Rutas principales:**

1. **POST /auth/register**
   - Recibe: email, password, fullName
   - Valida formato
   - Verifica que el email no exista
   - Hashea la contraseña (la convierte en texto ilegible)
   - Crea el usuario en la base de datos
   - Responde con userId

2. **POST /auth/login**
   - Recibe: email, password
   - Busca el usuario en la base de datos
   - Compara la contraseña hasheada
   - Si es correcta:
     - Genera un JWT (token de acceso)
     - Genera un refresh token
     - Guarda refresh token en cookie
     - Responde con accessToken y role

3. **POST /auth/logout**
   - Invalida el refresh token
   - Limpia la cookie

4. **POST /auth/refresh**
   - Renueva el accessToken usando el refreshToken
   - Implementa rotación de tokens (genera uno nuevo y elimina el anterior)

#### **services/authService.ts**
**¿Qué es?** Contiene la lógica de negocio de autenticación.

**Funciones principales:**

1. **`register()`**:
   ```typescript
   - Verifica si email ya existe
   - Hashea contraseña con bcrypt (12 rounds)
   - Crea usuario con UUID único
   - Marca email como verificado automáticamente
   ```

2. **`login()`**:
   ```typescript
   - Busca usuario por email
   - Compara contraseña con hash almacenado
   - Genera tokens (access + refresh)
   - Guarda refresh token en base de datos (hasheado)
   - Retorna tokens y rol
   ```

3. **`refresh()`**:
   ```typescript
   - Valida el refresh token
   - Verifica que no esté expirado
   - Rota el token (genera nuevo, elimina viejo)
   - Genera nuevo access token
   ```

**Conceptos importantes:**
- **Hash de contraseña**: Convierte "miPassword123" en algo como "a7f3b9c2..." (irreversible)
- **JWT (JSON Web Token)**: Un string que contiene información del usuario (userId, role) firmado digitalmente
- **Refresh Token**: Token de larga duración (30 días) usado para obtener nuevos access tokens
- **UUID**: Identificador único universal (ej: "550e8400-e29b-41d4-a716-446655440000")

#### **routes/news.ts**
**¿Qué es?** Maneja las noticias.

**Rutas:**

1. **GET /news** (público)
   - Devuelve todas las noticias ordenadas por fecha

2. **POST /news** (requiere admin)
   - Recibe: title, subtitle, description, image_url (base64)
   - Verifica que el usuario sea admin (middleware)
   - Guarda en base de datos
   - Responde con la noticia creada

3. **DELETE /news/:id** (requiere admin)
   - Elimina una noticia específica

#### **routes/testimonials.ts**
**¿Qué es?** Maneja los testimonios.

**Rutas:**

1. **GET /testimonials** (público, pero muestra más info si estás logueado)
2. **POST /testimonials** (requiere autenticación)
   - Usuario autenticado puede publicar testimonio
   - Incluye: rating (1-5), message, user_name
3. **DELETE /testimonials/:id** (requiere ser el autor o admin)

#### **routes/admin.ts**
**¿Qué es?** Funciones exclusivas para administradores.

**Rutas:**

1. **GET /admin/users**: Lista todos los usuarios
2. **POST /admin/create-user**: Crea un usuario nuevo (puede ser admin)
3. **PATCH /admin/users/:id/role**: Cambia el rol de un usuario
4. **DELETE /admin/users/:id**: Elimina un usuario
5. **GET /admin/stats**: Estadísticas (total usuarios, noticias, testimonios)

#### **middleware/auth.ts**
**¿Qué es?** Middleware = código que se ejecuta antes de llegar a la ruta.

**¿Qué hace?**
- Extrae el token del header `Authorization: Bearer <token>`
- Verifica que el token sea válido (no expirado, bien firmado)
- Verifica que el usuario exista
- Si todo OK: Pasa al siguiente paso
- Si no: Responde 401 (No autorizado)

**Uso:**
```typescript
router.post('/news', requireAuth, createNews)
// requireAuth se ejecuta ANTES de createNews
```

#### **db/pool.ts**
**¿Qué es?** Maneja la conexión a la base de datos MySQL.

**¿Qué hace?**
- Crea un "pool" de conexiones (conjunto de conexiones reutilizables)
- Proporciona función `query()` para ejecutar SQL
- Maneja errores de conexión

**Ejemplo de uso:**
```typescript
const result = await query('SELECT * FROM users WHERE email = ?', [email])
// Ejecuta SQL y espera resultado
```

#### **utils/email.ts**
**¿Qué es?** Utilidades para enviar emails.

**Funciones:**
- **`sendEmail()`**: Función genérica para enviar emails por SMTP (Gmail)
- **`sendProposalEmail()`**: Envía 2 correos cuando se recibe una propuesta:
  1. Correo al equipo (a `PROPOSAL_EMAIL`) con los datos de la propuesta
  2. Correo de confirmación al usuario que envió la propuesta

**Configuración:**
- Usa nodemailer con Gmail SMTP
- Requiere configuración en `backend/.env` (ver `backend/CONFIG_EMAIL.md`)
- Si no hay SMTP configurado, muestra logs en consola (modo desarrollo)

#### **routes/contact.ts**
**¿Qué es?** Maneja las solicitudes de propuesta.

**Rutas:**

1. **POST /contact/proposal** (público, no requiere autenticación)
   - Recibe: name, email, phone, phName, scope
   - Valida los datos con Zod
   - Envía correo al equipo y correo de confirmación al usuario
   - Responde con éxito o errores de validación

#### **Frontend: Chatbot**

**`js/chatbot.js`**
**¿Qué es?** Chatbot interactivo siempre visible en la esquina inferior derecha.

**Características:**
- Botón toggle para abrir/cerrar
- Mensajes predeterminados basados en palabras clave
- Sugerencias rápidas (dropdown hacia arriba) con navegación a secciones
- Historial de mensajes con scroll suave
- Respuestas inteligentes sobre servicios, testimonios, noticias, propuestas y Ley 284
- Hipervínculos a secciones relevantes y a información sobre Ley 284

#### **Frontend: Formulario de Propuesta**

**¿Qué es?** Formulario público para solicitar propuestas de servicio.

**Características:**
- Funciona **sin autenticación** (cualquiera puede enviar)
- Si el usuario está logueado, autocompleta nombre y email automáticamente
- Validación en frontend y backend (Zod)
- Feedback visual con mensajes de éxito/error
- Muestra tiempo de envío de correos
- Envía 2 correos automáticamente al enviar

**Campos:**
- Nombre y Apellido (mínimo 2 caracteres)
- Email (debe ser válido)
- Teléfono (mínimo 8 caracteres)
- Nombre del PH / Ubicación (mínimo 2 caracteres)
- Alcance (mínimo 5 caracteres)

---

## Tecnologías utilizadas

### Frontend

1. **HTML**: Estructura de la página (como los cimientos de una casa)
2. **CSS Modularizado**: Estilos organizados en archivos separados por funcionalidad (buenas prácticas)
3. **JavaScript**: Comportamiento interactivo (botones, formularios, peticiones)
4. **React** (CDN): Solo para el enrutamiento de secciones (muy mínimo)
5. **Font Awesome** (CDN): Iconos
6. **Google Fonts**: Fuentes tipográficas (Inter)

### Backend

1. **Node.js**: Entorno de ejecución de JavaScript en el servidor
2. **TypeScript**: JavaScript con tipos (más seguro y organizado)
3. **Express**: Framework web (facilita crear servidor HTTP)
4. **MySQL**: Base de datos relacional (almacena toda la información)
5. **JWT (jsonwebtoken)**: Para tokens de autenticación
6. **bcrypt**: Para hashear contraseñas de forma segura
7. **nodemailer**: Para enviar emails
8. **Zod**: Para validar datos de entrada

### Seguridad

1. **Helmet**: Agrega headers de seguridad HTTP
2. **CORS**: Controla qué dominios pueden hacer peticiones
3. **Rate Limiting**: Limita cantidad de peticiones por IP
4. **bcrypt**: Hashea contraseñas (12 rounds = muy seguro)
5. **JWT con expiración**: Tokens que caducan (access: 15 min, refresh: 30 días)

---

## Cómo ejecutar el proyecto

### Prerrequisitos

1. **Node.js** instalado (versión 16 o superior)
2. **MySQL** instalado y corriendo
3. **Git** (opcional, para clonar repositorio)

### Paso 1: Instalar dependencias del backend

```bash
cd backend
npm install
```

**¿Qué hace esto?** Descarga todas las herramientas necesarias (Express, MySQL, etc.) según el `package.json`.

### Paso 2: Configurar base de datos

1. Crear base de datos en MySQL:
```sql
CREATE DATABASE phadmin_db;
```

2. Configurar variables de entorno en `backend/.env`:
```env
DATABASE_URL=mysql://usuario:contraseña@localhost:3306/phadmin_db
JWT_ACCESS_SECRET=tu_secreto_super_seguro_aqui
JWT_REFRESH_SECRET=otro_secreto_super_seguro_aqui
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost
```

### Paso 3: Ejecutar migraciones

```bash
cd backend
npm run migrate
```

**¿Qué hace esto?** Crea todas las tablas necesarias en la base de datos (users, news, testimonials, etc.).

### Paso 4: Crear usuario administrador

```bash
cd backend
npm run create-admin
```

**¿Qué hace esto?** Te permite crear el primer usuario admin del sistema.

### Paso 5: Iniciar el servidor backend

```bash
cd backend
npm run dev
```

Deberías ver: `API listening on http://localhost:4000`

### Paso 6: Abrir el frontend

Simplemente abre `index.html` en tu navegador, o usa un servidor local:

**Opción 1**: Live Server (extensión de VS Code)
- Click derecho en `index.html` → "Open with Live Server"

**Opción 2**: Python
```bash
python -m http.server 8000
```
Luego abre: http://localhost:8000

**Opción 3**: Node.js http-server
```bash
npx http-server -p 8000
```

### Paso 7: Verificar que todo funcione

1. Abre http://localhost:8000 (o el puerto que uses)
2. Deberías ver la página principal
3. Las noticias y testimonios deberían cargarse automáticamente
4. Intenta hacer login con el usuario admin que creaste

---

## Flujo de datos completo: Ejemplo real

### Ejemplo: Usuario publica un testimonio

```
1. Usuario está en index.html, sección #testimonios
2. Usuario está logueado (tiene token en localStorage)
3. Usuario selecciona 5 estrellas y escribe: "Excelente servicio"
4. Click en "Publicar"
5. script.js ejecuta initTestimonialForm()
6. Se hace petición:
   POST http://localhost:4000/testimonials
   Headers: {
     Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     Content-Type: "application/json"
   }
   Body: {
     rating: 5,
     message: "Excelente servicio"
   }
7. Backend recibe petición en routes/testimonials.ts
8. Middleware requireAuth verifica el token:
   - Extrae token del header
   - Verifica firma y expiración
   - Extrae userId del token
9. Si token válido, continúa al handler createTestimonial()
10. Handler obtiene userId del token (ya verificado)
11. Ejecuta SQL:
    INSERT INTO testimonials (user_id, rating, message, user_name)
    VALUES (?, ?, ?, ?)
12. Base de datos guarda el testimonio
13. Backend responde: { id: "123", message: "Testimonio creado" }
14. script.js recibe respuesta
15. Llama a loadTestimonials() para refrescar la lista
16. El nuevo testimonio aparece en pantalla inmediatamente
```

---

## Conceptos avanzados (pero explicados simple)

### ¿Qué es un JWT?

**JWT (JSON Web Token)** es como un "pase de acceso" digital. Tiene 3 partes:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoiYWRtaW4ifQ.signature
```

1. **Header**: Tipo de token y algoritmo
2. **Payload**: Datos del usuario (userId, role)
3. **Signature**: Firma que garantiza que no fue modificado

**Ventajas:**
- No necesita consultar base de datos en cada petición
- Contiene toda la info necesaria
- Puede expirar automáticamente

### ¿Por qué hashear contraseñas?

**Hash** es una función matemática que convierte texto en algo irreversible.

**Ejemplo:**
```
"miPassword123" → bcrypt → "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5dHGHxqK9HkFO"
```

**¿Por qué?**
- Si alguien roba la base de datos, no puede ver las contraseñas reales
- Solo puedes verificar: "¿Esta contraseña es correcta?" (comparando hashes)

### ¿Qué es CORS?

**CORS (Cross-Origin Resource Sharing)** es una regla de seguridad del navegador.

**Problema:**
- Frontend está en: `http://localhost:8000`
- Backend está en: `http://localhost:4000`
- Son "orígenes diferentes"
- Por seguridad, navegadores bloquean peticiones entre orígenes diferentes

**Solución:**
- Backend configura CORS para permitir peticiones desde el frontend
- En desarrollo: Permite cualquier origen
- En producción: Solo permite dominios específicos

### ¿Qué es Rate Limiting?

**Rate Limiting** limita cuántas peticiones puede hacer una IP en un tiempo determinado.

**Ejemplo:**
- Máximo 100 peticiones por 15 minutos por IP
- Si alguien intenta hacer 200, las adicionales se bloquean

**¿Por qué?**
- Previene ataques de fuerza bruta
- Protege contra sobrecarga del servidor
- Evita abuso del sistema

---

## Resumen de archivos importantes

### Frontend

| Archivo | Propósito |
|---------|-----------|
| `index.html` | Página principal con todas las secciones |
| `script.js` | Lógica completa del frontend (1664 líneas) |
| `login.html/js` | Inicio de sesión |
| `register.html/js` | Registro de nuevos usuarios |
| `style.css` | Todos los estilos visuales |
| `app-routing.js` | Sistema de navegación entre secciones |

### Backend

| Archivo | Propósito |
|---------|-----------|
| `server.ts` | Punto de entrada, configuración del servidor |
| `routes/auth.ts` | Rutas de autenticación (login, register, logout) |
| `routes/news.ts` | Rutas de noticias |
| `routes/testimonials.ts` | Rutas de testimonios |
| `routes/admin.ts` | Rutas exclusivas para administradores |
| `routes/me.ts` | Rutas del perfil del usuario actual |
| `services/authService.ts` | Lógica de negocio de autenticación |
| `middleware/auth.ts` | Verificación de tokens |
| `middleware/rateLimit.ts` | Límite de peticiones |
| `db/pool.ts` | Conexión a MySQL |
| `utils/email.ts` | Envío de emails |
| `config/env.ts` | Variables de entorno |

---

## Preguntas frecuentes

### ¿Por qué se eliminó la recuperación de contraseña y verificación de email?

Ambas funcionalidades fueron eliminadas para simplificar el sistema:
- **Recuperación de contraseña**: No funcionaba correctamente y se eliminó para evitar confusión. Los usuarios pueden cambiar su contraseña desde el menú de usuario si están logueados.
- **Verificación de email**: Se eliminó porque no era necesaria para el flujo del sistema. Los usuarios pueden usar la cuenta inmediatamente después de registrarse.

### ¿Cómo funciona el formulario de propuesta?

El formulario de propuesta (`#propuesta`) es **público** y **no requiere autenticación**:

1. Usuario llena el formulario (o si está logueado, se autocompletan nombre y email)
2. Al enviar, se valida en frontend y backend
3. Si todo es correcto:
   - Se envía un correo a `PROPOSAL_EMAIL` (configurado en `.env`) con los datos
   - Se envía un correo de confirmación al email del usuario
   - Se muestra mensaje de éxito con tiempo de envío
4. El formulario se limpia automáticamente

### ¿Cómo funciona el chatbot?

El chatbot está siempre visible en la esquina inferior derecha:

1. Usuario hace clic en el botón del chatbot para abrir/cerrar
2. Puede escribir mensajes o usar sugerencias rápidas (dropdown)
3. El chatbot analiza las palabras clave y responde inteligentemente
4. Puede navegar automáticamente a secciones relevantes (#testimonios, #propuesta, etc.)
5. Incluye información sobre Ley 284 con enlaces a fuentes oficiales

### ¿Cómo configurar el sistema de correos?

Ver la guía completa en `backend/CONFIG_EMAIL.md`. En resumen:

1. Crear archivo `backend/.env`
2. Configurar SMTP de Gmail (requiere "Contraseña de aplicación")
3. Configurar `PROPOSAL_EMAIL` (destinatario de propuestas)
4. Reiniciar el servidor backend

### ¿Qué es Ley 284 y dónde se menciona?

**Ley 284** es la ley que reforma integralmente la Propiedad Horizontal en Panamá. Se menciona en:

- Hero principal de la página (sección inicio)
- Tarjeta "Cumplimiento legal" en Quiénes Somos
- Card destacada "Asesoría legal y normativa" en Servicios
- Sección de Propuesta (box destacado)
- Footer (Marco Legal)

Todos los enlaces apuntan a la página oficial de MIVIOT sobre Ley 284.

### ¿Cómo funciona el sistema de autenticación?

1. Usuario ingresa email y contraseña
2. Backend verifica credenciales
3. Si son correctas:
   - Genera un JWT (access token) que dura 15 minutos
   - Genera un refresh token que dura 30 días
   - Guarda refresh token en cookie httpOnly
   - Devuelve access token al frontend
4. Frontend guarda access token en localStorage
5. En cada petición, frontend envía el token en header `Authorization: Bearer <token>`
6. Backend verifica el token antes de procesar la petición

### ¿Dónde se guardan las imágenes de noticias?

Las imágenes se almacenan como **base64** (texto que representa la imagen) directamente en la base de datos. El frontend comprime las imágenes antes de enviarlas para reducir el tamaño.

**Ventajas:**
- Simple, no requiere almacenamiento externo
- Todo está en la base de datos

**Desventajas:**
- Las bases de datos crecen más rápido
- Para producción, sería mejor usar almacenamiento en la nube (AWS S3, Cloudinary, etc.)

### ¿Cómo se protegen las rutas de administración?

1. Frontend: Solo muestra el enlace `#administracion` si el usuario tiene rol 'admin'
2. `app-routing.js`: Si intentas acceder a `#administracion` sin ser admin, te redirige
3. Backend: Todas las rutas `/admin/*` usan middleware que verifica:
   - Token válido
   - Usuario existe
   - Rol es 'admin'

### ¿Qué pasa si el token expira?

El access token expira en 15 minutos. Cuando expira:
1. Backend responde con error 401 (No autorizado)
2. Frontend debería usar el refresh token para obtener un nuevo access token
3. Si el refresh token también expiró, el usuario debe iniciar sesión de nuevo

**Nota**: Actualmente el frontend no implementa renovación automática del token, simplemente redirige al login si el token es inválido.

---

## Consejos para entender mejor el código

1. **Lee los comentarios**: Todos los archivos tienen comentarios explicando qué hace cada función
2. **Usa las DevTools del navegador**: Presiona F12 y ve la pestaña "Network" para ver todas las peticiones
3. **Revisa la consola**: Tanto del navegador (F12) como del backend para ver logs
4. **Empieza por el flujo simple**: Primero entiende cómo carga una noticia, luego autenticación, luego funciones admin
5. **Experimenta**: Cambia valores y ve qué pasa (siempre guarda una copia antes)

---

## Glosario de términos técnicos

- **API**: Interfaz de programación, cómo el frontend y backend se comunican
- **Base de datos**: Almacén permanente de información estructurada
- **Backend**: Servidor que procesa peticiones y maneja la lógica
- **Frontend**: Lo que el usuario ve e interactúa en el navegador
- **Hash**: Conversión de texto en código irreversible
- **JWT**: Token digital que contiene información del usuario
- **Middleware**: Código que se ejecuta antes de llegar a la ruta final
- **Query**: Consulta a la base de datos
- **Token**: Pase de acceso temporal
- **Route**: Ruta o endpoint, una URL específica (ej: /auth/login)

---

## ¿Necesitas ayuda?

Si algo no está claro o necesitas entender mejor alguna parte específica:

1. Revisa los comentarios en el código (están muy detallados)
2. Usa las DevTools del navegador para ver qué está pasando
3. Revisa los logs del backend en la consola
4. Prueba hacer cambios pequeños y observa qué pasa

---

**Última actualización**: Esta guía corresponde a la versión del proyecto que incluye:
- Chatbot integrado
- Formulario de propuesta público (sin autenticación)
- Sistema de correos automático (Gmail SMTP)
- CSS modularizado
- Eliminación de recuperación de contraseña y verificación de email
- Referencias a Ley 284 con enlaces oficiales
- Comentarios completos en todo el código

