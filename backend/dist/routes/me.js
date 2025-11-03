"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const pool_1 = require("../db/pool");
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const r = await (0, pool_1.query)('select id, email, full_name, avatar_url, role, email_verified_at, created_at from users where id=?', [user.userId]);
    res.json(r.rows[0] || null);
});
router.patch('/', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const schema = zod_1.z.object({
        full_name: zod_1.z.string().optional(),
        avatar_url: zod_1.z.string().optional()
    });
    const updates = schema.parse(req.body);
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    try {
        const fields = [];
        const values = [];
        if (updates.full_name !== undefined) {
            fields.push('full_name=?');
            values.push(updates.full_name);
        }
        if (updates.avatar_url !== undefined) {
            // Limitar tamaño de base64 si es muy grande (guardar solo si es menor a 1MB)
            let avatarUrl = updates.avatar_url;
            if (avatarUrl && avatarUrl.length > 1000000) {
                return res.status(400).json({ error: 'Imagen demasiado grande. Usa una imagen más pequeña.' });
            }
            fields.push('avatar_url=?');
            values.push(avatarUrl);
        }
        values.push(user.userId);
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id=?`;
        await (0, pool_1.query)(sql, values);
        // Si se actualizó el avatar, actualizar también los testimonios del usuario
        if (updates.avatar_url !== undefined) {
            await (0, pool_1.query)('UPDATE testimonials SET avatar_url=? WHERE user_id=?', [updates.avatar_url, user.userId]);
        }
        // Obtener usuario actualizado
        const r = await (0, pool_1.query)('select id, email, full_name, avatar_url, role, email_verified_at, created_at from users where id=?', [user.userId]);
        res.json(r.rows[0] || null);
    }
    catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ error: error.message || 'Error actualizando perfil' });
    }
});
router.post('/change-password', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const schema = zod_1.z.object({
        currentPassword: zod_1.z.string().min(1),
        newPassword: zod_1.z.string().min(8)
    });
    const { currentPassword, newPassword } = schema.parse(req.body);
    try {
        // Verificar contraseña actual
        const r = await (0, pool_1.query)('select password_hash from users where id=?', [user.userId]);
        if (!r.rows.length)
            return res.status(404).json({ error: 'Usuario no encontrado' });
        const valid = await bcrypt_1.default.compare(currentPassword, r.rows[0].password_hash);
        if (!valid)
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        // Actualizar contraseña
        const newHash = await bcrypt_1.default.hash(newPassword, 12);
        await (0, pool_1.query)('update users set password_hash=? where id=?', [newHash, user.userId]);
        res.json({ ok: true, message: 'Contraseña cambiada exitosamente' });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Error cambiando contraseña' });
    }
});
exports.default = router;
