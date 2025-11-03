"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const pool_1 = require("../db/pool");
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
// GET: Obtener todos los testimonios (opcional: incluir user_id si está autenticado)
router.get('/', async (req, res) => {
    try {
        // Intentar verificar token opcionalmente
        let userId = undefined;
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                // Intentar verificar token (sin fallar si no es válido)
                const token = authHeader.slice(7);
                const decoded = jsonwebtoken_1.default.verify(token, env_1.env.accessSecret);
                if (decoded && decoded.userId) {
                    userId = decoded.userId;
                }
            }
        }
        catch (e) {
            // Token inválido o no presente, continuar sin userId
            userId = undefined;
        }
        const r = await (0, pool_1.query)(`
      SELECT t.id, t.user_id, t.user_name, t.avatar_url, t.rating, t.message, t.created_at,
             u.avatar_url as current_avatar_url
      FROM testimonials t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `);
        // Si hay usuario logueado, agregar flag is_owner
        // Usar avatar actual del usuario si el testimonio no tiene uno guardado
        const testimonials = r.rows.map((t) => ({
            ...t,
            avatar_url: t.avatar_url || t.current_avatar_url || null,
            is_owner: userId ? t.user_id === userId : false
        }));
        // Remover current_avatar_url del resultado
        const cleanedTestimonials = testimonials.map((t) => {
            const { current_avatar_url, ...rest } = t;
            return rest;
        });
        res.json(cleanedTestimonials);
    }
    catch (error) {
        console.error('Error obteniendo testimonios:', error);
        res.status(500).json({ error: 'Error obteniendo testimonios', details: error.message });
    }
});
// POST: Crear un nuevo testimonio (requiere autenticación)
router.post('/', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const schema = zod_1.z.object({
        rating: zod_1.z.number().int().min(1).max(5),
        message: zod_1.z.string().min(1).max(1000)
    });
    try {
        const { rating, message } = schema.parse(req.body);
        // Obtener nombre, avatar y rol del usuario
        const userRes = await (0, pool_1.query)('SELECT full_name, email, avatar_url, role FROM users WHERE id=?', [user.userId]);
        if (!userRes.rows.length) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const userData = userRes.rows[0];
        const userName = userData.full_name || userData.email || 'Usuario';
        const userAvatar = userData.avatar_url || null;
        const userRole = userData.role || 'user';
        // Verificar si el usuario ya publicó un testimonio (excepto admin que puede tener múltiples)
        if (userRole !== 'admin') {
            const existing = await (0, pool_1.query)('SELECT id FROM testimonials WHERE user_id=?', [user.userId]);
            if (existing.rows.length > 0) {
                return res.status(400).json({ error: 'Ya has publicado un testimonio. Solo puedes tener uno.' });
            }
        }
        // Crear testimonio
        const testimonialId = (0, crypto_1.randomUUID)();
        await (0, pool_1.query)(`
      INSERT INTO testimonials (id, user_id, user_name, avatar_url, rating, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [testimonialId, user.userId, userName, userAvatar, rating, message]);
        // Retornar el testimonio creado
        const created = await (0, pool_1.query)(`
      SELECT id, user_name, avatar_url, rating, message, created_at
      FROM testimonials
      WHERE id=?
    `, [testimonialId]);
        res.status(201).json(created.rows[0]);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        }
        console.error('Error creando testimonio:', error);
        res.status(500).json({ error: error.message || 'Error creando testimonio' });
    }
});
// DELETE: Eliminar testimonio propio (requiere autenticación)
router.delete('/:id', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const testimonialId = req.params.id;
    try {
        // Verificar que el testimonio existe y pertenece al usuario
        const existing = await (0, pool_1.query)('SELECT user_id FROM testimonials WHERE id=?', [testimonialId]);
        if (!existing.rows.length) {
            return res.status(404).json({ error: 'Testimonio no encontrado' });
        }
        const testimonial = existing.rows[0];
        const userRole = user.role || 'user';
        // Solo el dueño o un admin puede eliminar
        if (testimonial.user_id !== user.userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este testimonio' });
        }
        await (0, pool_1.query)('DELETE FROM testimonials WHERE id=?', [testimonialId]);
        res.json({ ok: true, message: 'Testimonio eliminado' });
    }
    catch (error) {
        console.error('Error eliminando testimonio:', error);
        res.status(500).json({ error: error.message || 'Error eliminando testimonio' });
    }
});
exports.default = router;
