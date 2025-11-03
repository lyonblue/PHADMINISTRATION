"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const pool_1 = require("../db/pool");
const crypto_1 = require("crypto");
const router = (0, express_1.Router)();
// GET: Obtener todas las noticias (público)
router.get('/', async (req, res) => {
    try {
        const r = await (0, pool_1.query)(`
      SELECT n.id, n.title, n.subtitle, n.description, n.image_url, n.created_at,
             u.full_name as author_name
      FROM news n
      LEFT JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
      LIMIT 50
    `);
        res.json(r.rows);
    }
    catch (error) {
        console.error('Error obteniendo noticias:', error);
        res.status(500).json({ error: 'Error obteniendo noticias', details: error.message });
    }
});
// POST: Crear nueva noticia (solo admin)
router.post('/', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const user = req.user;
    const schema = zod_1.z.object({
        title: zod_1.z.string().min(1).max(255),
        subtitle: zod_1.z.string().min(1).max(500),
        description: zod_1.z.string().min(1).max(5000),
        image_url: zod_1.z.string().min(1)
    });
    try {
        const { title, subtitle, description, image_url } = schema.parse(req.body);
        const newsId = (0, crypto_1.randomUUID)();
        await (0, pool_1.query)(`
      INSERT INTO news (id, user_id, title, subtitle, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [newsId, user.userId, title, subtitle, description, image_url]);
        const created = await (0, pool_1.query)(`
      SELECT n.id, n.title, n.subtitle, n.description, n.image_url, n.created_at,
             u.full_name as author_name
      FROM news n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.id = ?
    `, [newsId]);
        res.status(201).json(created.rows[0]);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
        }
        console.error('Error creando noticia:', error);
        res.status(500).json({ error: error.message || 'Error creando noticia' });
    }
});
// DELETE: Eliminar noticia (solo admin)
router.delete('/:id', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const newsId = req.params.id;
    try {
        const existing = await (0, pool_1.query)('SELECT id FROM news WHERE id=?', [newsId]);
        if (!existing.rows.length) {
            return res.status(404).json({ error: 'Noticia no encontrada' });
        }
        await (0, pool_1.query)('DELETE FROM news WHERE id=?', [newsId]);
        res.json({ ok: true, message: 'Noticia eliminada' });
    }
    catch (error) {
        console.error('Error eliminando noticia:', error);
        res.status(500).json({ error: error.message || 'Error eliminando noticia' });
    }
});
exports.default = router;
