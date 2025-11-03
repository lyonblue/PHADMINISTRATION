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
const pool_1 = require("../db/pool");
const svc = __importStar(require("../services/authService"));
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
        const { userId } = await svc.createUser(data.email, data.password, data.fullName, data.role, true // Siempre crear usuarios verificados
        );
        res.status(201).json({ userId, role: data.role, message: 'Usuario creado exitosamente' });
    }
    catch (e) {
        if (e.message === 'email_taken')
            return res.status(409).json({ error: 'Email ya registrado' });
        res.status(500).json({ error: 'Error creando usuario' });
    }
});
// GET: Listar usuarios (solo admin)
router.get('/users', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), async (req, res) => {
    try {
        const r = await (0, pool_1.query)(`
      SELECT id, email, full_name, role, email_verified_at, created_at
      FROM users
      ORDER BY created_at DESC
    `);
        res.json(r.rows);
    }
    catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error obteniendo usuarios', details: error.message });
    }
});
// GET: Estadísticas (solo admin)
router.get('/stats', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), async (req, res) => {
    try {
        const [usersRes, newsRes, testimonialsRes] = await Promise.all([
            (0, pool_1.query)('SELECT COUNT(*) as count FROM users'),
            (0, pool_1.query)('SELECT COUNT(*) as count FROM news'),
            (0, pool_1.query)('SELECT COUNT(*) as count FROM testimonials')
        ]);
        // MySQL devuelve el COUNT como un objeto con la clave 'count'
        // pero puede ser un número o un objeto RowDataPacket dependiendo de la versión
        const usersCount = usersRes.rows[0];
        const newsCount = newsRes.rows[0];
        const testimonialsCount = testimonialsRes.rows[0];
        res.json({
            users: Number(usersCount?.count || usersCount?.COUNT || 0),
            news: Number(newsCount?.count || newsCount?.COUNT || 0),
            testimonials: Number(testimonialsCount?.count || testimonialsCount?.COUNT || 0)
        });
    }
    catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error obteniendo estadísticas', details: error.message });
    }
});
// Endpoint para actualizar rol de usuario (solo admins)
router.patch('/users/:id/role', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const schema = zod_1.z.object({
        role: zod_1.z.enum(['admin', 'user'])
    });
    try {
        const { role } = schema.parse(req.body);
        const userId = req.params.id;
        // Verificar que el usuario exista
        const existing = await (0, pool_1.query)('SELECT id, role FROM users WHERE id = ?', [userId]);
        if (!existing.rows.length) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        await (0, pool_1.query)('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        const updated = await (0, pool_1.query)(`
      SELECT id, email, full_name, role, email_verified_at, created_at
      FROM users
      WHERE id = ?
    `, [userId]);
        res.json(updated.rows[0]);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        }
        console.error('Error actualizando rol:', error);
        res.status(500).json({ error: 'Error actualizando rol', details: error.message });
    }
});
// DELETE: Eliminar usuario (solo admins)
router.delete('/users/:id', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const userId = req.params.id;
    const adminUser = req.user;
    try {
        // Verificar que el usuario exista
        const existing = await (0, pool_1.query)('SELECT id, email, full_name, role FROM users WHERE id = ?', [userId]);
        if (!existing.rows.length) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Prevenir que un admin se elimine a sí mismo
        if (userId === adminUser.userId) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }
        // Eliminar registros relacionados primero (testimonials, news, etc.)
        // Esto es importante para mantener la integridad de los datos
        await (0, pool_1.query)('DELETE FROM testimonials WHERE user_id = ?', [userId]);
        await (0, pool_1.query)('DELETE FROM news WHERE user_id = ?', [userId]);
        await (0, pool_1.query)('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
        // Eliminar el usuario
        await (0, pool_1.query)('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ ok: true, message: 'Usuario eliminado exitosamente' });
    }
    catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({ error: error.message || 'Error eliminando usuario' });
    }
});
exports.default = router;
