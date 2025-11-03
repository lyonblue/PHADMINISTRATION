"use strict";
/**
 * Rutas de autenticación
 * Maneja: registro, login, logout y refresh token
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const svc = __importStar(require("../services/authService"));
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
/**
 * POST /auth/register
 * Registra un nuevo usuario en el sistema
 * Requiere: email (válido), password (mínimo 8 caracteres), fullName (no vacío)
 */
router.post('/register', async (req, res) => {
    const schema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(8), fullName: zod_1.z.string().min(1) });
    const data = schema.parse(req.body);
    try {
        const { userId } = await svc.register(data.email, data.password, data.fullName);
        res.status(201).json({ userId, message: 'Usuario registrado exitosamente' });
    }
    catch (e) {
        if (e.message === 'email_taken')
            return res.status(409).json({ error: 'Email ya registrado' });
        console.error('Error en registro:', e);
        res.status(500).json({ error: 'Error registrando: ' + (e.message || 'Error desconocido') });
    }
});
/**
 * POST /auth/login
 * Inicia sesión con email y contraseña
 * Devuelve: accessToken (JWT) y role del usuario
 * Guarda refreshToken en cookie httpOnly
 */
router.post('/login', async (req, res) => {
    const schema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(1) });
    const data = schema.parse(req.body);
    try {
        const { accessToken, refreshToken, role } = await svc.login(data.email, data.password);
        // En desarrollo, no usar secure para permitir cookies en HTTP local
        const isDevelopment = env_1.env.nodeEnv === 'development';
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: !isDevelopment, // Solo seguro en producción (HTTPS)
            sameSite: isDevelopment ? 'lax' : 'strict', // 'lax' en desarrollo, 'strict' en producción
            maxAge: 1000 * 60 * 60 * 24 * 30 // 30 días
        });
        res.json({ accessToken, role });
    }
    catch {
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
});
/**
 * POST /auth/refresh
 * Renueva el accessToken usando el refreshToken almacenado en cookie
 * Requiere: userId en body y refresh_token en cookie
 */
router.post('/refresh', async (req, res) => {
    const { userId } = req.body;
    const rt = req.cookies?.refresh_token;
    if (!userId || !rt)
        return res.status(401).json({ error: 'No refresh' });
    try {
        const { accessToken, refreshToken } = await svc.refresh(userId, rt);
        const isDevelopment = env_1.env.nodeEnv === 'development';
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: !isDevelopment,
            sameSite: isDevelopment ? 'lax' : 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 30 // 30 días
        });
        res.json({ accessToken });
    }
    catch (e) {
        res.status(401).json({ error: e.message });
    }
});
/**
 * POST /auth/logout
 * Cierra sesión revocando el refreshToken
 * Limpia la cookie de refresh_token
 */
router.post('/logout', async (req, res) => {
    // Intentar obtener userId del token JWT si está presente
    const auth = req.headers.authorization;
    let userId;
    if (auth?.startsWith('Bearer ')) {
        try {
            const token = auth.slice(7);
            const payload = jsonwebtoken_1.default.verify(token, env_1.env.accessSecret);
            userId = payload.userId;
        }
        catch {
            // Token inválido, continuar sin userId
        }
    }
    const rt = req.cookies?.refresh_token;
    if (userId && rt)
        await svc.logout(userId, rt);
    res.clearCookie('refresh_token');
    res.json({ ok: true });
});
exports.default = router;
