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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const svc = __importStar(require("../services/authService"));
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
// Endpoint para crear usuarios (solo admins)
router.post('/create-user', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const schema = zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
        fullName: zod_1.z.string().min(1),
        role: zod_1.z.enum(['admin', 'user']).default('user'),
        skipVerification: zod_1.z.boolean().default(false)
    });
    const data = schema.parse(req.body);
    try {
        const { userId, verifyToken } = await svc.createUser(data.email, data.password, data.fullName, data.role, data.skipVerification);
        if (verifyToken && !data.skipVerification) {
            await (0, email_1.sendEmail)({ to: data.email, subject: 'Verifica tu correo', html: `Token: ${verifyToken}` });
        }
        res.status(201).json({ userId, role: data.role, message: 'Usuario creado exitosamente' });
    }
    catch (e) {
        if (e.message === 'email_taken')
            return res.status(409).json({ error: 'Email ya registrado' });
        res.status(500).json({ error: 'Error creando usuario' });
    }
});
exports.default = router;
