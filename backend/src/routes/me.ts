import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { query } from '../db/pool';
import bcrypt from 'bcrypt';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const user = (req as any).user as { userId: string };
  const r = await query('select id, email, full_name, avatar_url, role, email_verified_at, created_at from users where id=?', [user.userId]);
  res.json(r.rows[0] || null);
});

router.patch('/', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as { userId: string };
  const schema = z.object({
    full_name: z.string().optional(),
    avatar_url: z.string().optional()
  });
  
  const updates = schema.parse(req.body);
  if(Object.keys(updates).length === 0){
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }
  
  try {
    const fields: string[] = [];
    const values: any[] = [];
    
    if(updates.full_name !== undefined){
      fields.push('full_name=?');
      values.push(updates.full_name);
    }
    if(updates.avatar_url !== undefined){
      // Limitar tamaño de base64 si es muy grande (guardar solo si es menor a 1MB)
      let avatarUrl = updates.avatar_url;
      if(avatarUrl && avatarUrl.length > 1000000){
        return res.status(400).json({ error: 'Imagen demasiado grande. Usa una imagen más pequeña.' });
      }
      fields.push('avatar_url=?');
      values.push(avatarUrl);
    }
    
    values.push(user.userId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id=?`;
    await query(sql, values);
    
    // Si se actualizó el avatar, actualizar también los testimonios del usuario
    if(updates.avatar_url !== undefined){
      await query('UPDATE testimonials SET avatar_url=? WHERE user_id=?', [updates.avatar_url, user.userId]);
    }
    
    // Obtener usuario actualizado
    const r = await query('select id, email, full_name, avatar_url, role, email_verified_at, created_at from users where id=?', [user.userId]);
    res.json(r.rows[0] || null);
  } catch (error: any){
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: error.message || 'Error actualizando perfil' });
  }
});

router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as { userId: string };
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8)
  });
  
  const { currentPassword, newPassword } = schema.parse(req.body);
  
  try {
    // Verificar contraseña actual
    const r = await query<{ password_hash: string }>('select password_hash from users where id=?', [user.userId]);
    if(!r.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    const valid = await bcrypt.compare(currentPassword, r.rows[0].password_hash);
    if(!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    
    // Actualizar contraseña
    const newHash = await bcrypt.hash(newPassword, 12);
    await query('update users set password_hash=? where id=?', [newHash, user.userId]);
    
    res.json({ ok: true, message: 'Contraseña cambiada exitosamente' });
  } catch (error: any){
    res.status(500).json({ error: error.message || 'Error cambiando contraseña' });
  }
});

export default router;

