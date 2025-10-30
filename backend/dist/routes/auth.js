"use strict";
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
const email_1 = require("../utils/email");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    const schema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(8), fullName: zod_1.z.string().min(1) });
    const data = schema.parse(req.body);
    try {
        const { userId, verifyToken } = await svc.register(data.email, data.password, data.fullName);
        await (0, email_1.sendEmail)({ to: data.email, subject: 'Verifica tu correo', html: `Token: ${verifyToken}` });
        res.status(201).json({ userId });
    }
    catch (e) {
        if (e.message === 'email_taken')
            return res.status(409).json({ error: 'Email ya registrado' });
        res.status(500).json({ error: 'Error registrando' });
    }
});
router.get('/verify-email', async (req, res) => {
    const token = String(req.query.token || '');
    try {
        await svc.verifyEmail(token);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.post('/login', async (req, res) => {
    const schema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(1) });
    const data = schema.parse(req.body);
    try {
        const { accessToken, refreshToken, role } = await svc.login(data.email, data.password);
        res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 1000 * 60 * 60 * 24 * 30 });
        res.json({ accessToken, role });
    }
    catch {
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
});
router.post('/refresh', async (req, res) => {
    const { userId } = req.body;
    const rt = req.cookies?.refresh_token;
    if (!userId || !rt)
        return res.status(401).json({ error: 'No refresh' });
    try {
        const { accessToken, refreshToken } = await svc.refresh(userId, rt);
        res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 1000 * 60 * 60 * 24 * 30 });
        res.json({ accessToken });
    }
    catch (e) {
        res.status(401).json({ error: e.message });
    }
});
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
router.post('/forgot-password', async (req, res) => {
    const schema = zod_1.z.object({ email: zod_1.z.string().email() });
    const { email } = schema.parse(req.body);
    const result = await svc.forgotPassword(email);
    if (result) {
        await (0, email_1.sendEmail)({ to: email, subject: 'Restablece tu contraseña', html: `Token: ${result.token}` });
    }
    res.json({ ok: true });
});
router.post('/reset-password', async (req, res) => {
    const schema = zod_1.z.object({ token: zod_1.z.string(), password: zod_1.z.string().min(8) });
    const { token, password } = schema.parse(req.body);
    try {
        await svc.resetPassword(token, password);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
});
exports.default = router;
