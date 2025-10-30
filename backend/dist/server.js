"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const rateLimit_1 = require("./middleware/rateLimit");
const auth_1 = __importDefault(require("./routes/auth"));
const me_1 = __importDefault(require("./routes/me"));
const admin_1 = __importDefault(require("./routes/admin"));
const app = (0, express_1.default)();
// Helmet con configuración menos restrictiva para desarrollo
if (env_1.env.nodeEnv === 'development') {
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    }));
}
else {
    app.use((0, helmet_1.default)());
}
// CORS: más permisivo en desarrollo
if (env_1.env.nodeEnv === 'development') {
    app.use((0, cors_1.default)({
        origin: true, // Permitir cualquier origen en desarrollo
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
}
else {
    const allowedOrigins = env_1.env.allowedOrigin === '*'
        ? ['http://localhost:5500', 'http://localhost:5501', 'http://127.0.0.1:5500', 'http://127.0.0.1:5501']
        : env_1.env.allowedOrigin.split(',').map(o => o.trim());
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
}
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(rateLimit_1.rateLimit);
// Ruta raíz
app.get('/', (_, res) => {
    res.json({
        message: 'PH PTY Administration API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/auth/*',
            me: '/me',
            admin: '/admin/*'
        }
    });
});
app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/auth', auth_1.default);
app.use('/me', me_1.default);
app.use('/admin', admin_1.default);
// Manejar rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path,
        method: req.method
    });
});
// Manejar errores
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Error' });
});
app.listen(env_1.env.port, () => {
    console.log(`API listening on http://localhost:${env_1.env.port}`);
});
