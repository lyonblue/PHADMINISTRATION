import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { query } from '../db/pool';
import * as svc from '../services/authService';

const router = Router();

// Endpoint para crear usuarios (solo admins)
router.post('/create-user', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(1),
    role: z.enum(['admin', 'user']).default('user'),
    skipVerification: z.boolean().default(false)
  });
  const data = schema.parse(req.body);
  try {
    const { userId } = await svc.createUser(
      data.email,
      data.password,
      data.fullName,
      data.role,
      true // Siempre crear usuarios verificados
    );
    res.status(201).json({ userId, role: data.role, message: 'Usuario creado exitosamente' });
  } catch (e: any) {
    if(e.message === 'email_taken') return res.status(409).json({ error: 'Email ya registrado' });
    res.status(500).json({ error: 'Error creando usuario' });
  }
});

// GET: Listar usuarios (solo admin)
router.get('/users', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const r = await query(`
      SELECT id, email, full_name, role, email_verified_at, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(r.rows);
  } catch (error: any) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error obteniendo usuarios', details: error.message });
  }
});

// GET: Estadísticas (solo admin)
router.get('/stats', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const [usersRes, newsRes, testimonialsRes] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM news'),
      query('SELECT COUNT(*) as count FROM testimonials')
    ]);
    
    // MySQL devuelve el COUNT como un objeto con la clave 'count'
    // pero puede ser un número o un objeto RowDataPacket dependiendo de la versión
    const usersCount = usersRes.rows[0] as any;
    const newsCount = newsRes.rows[0] as any;
    const testimonialsCount = testimonialsRes.rows[0] as any;
    
    res.json({
      users: Number(usersCount?.count || usersCount?.COUNT || 0),
      news: Number(newsCount?.count || newsCount?.COUNT || 0),
      testimonials: Number(testimonialsCount?.count || testimonialsCount?.COUNT || 0)
    });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas', details: error.message });
  }
});

// Endpoint para actualizar rol de usuario (solo admins)
router.patch('/users/:id/role', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const schema = z.object({
    role: z.enum(['admin', 'user'])
  });

  try {
    const { role } = schema.parse(req.body);
    const userId = req.params.id;

    // Verificar que el usuario exista
    const existing = await query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if(!existing.rows.length){
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

    const updated = await query(`
      SELECT id, email, full_name, role, email_verified_at, created_at
      FROM users
      WHERE id = ?
    `, [userId]);

    res.json(updated.rows[0]);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Error actualizando rol:', error);
    res.status(500).json({ error: 'Error actualizando rol', details: error.message });
  }
});

// DELETE: Eliminar usuario (solo admins)
router.delete('/users/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const userId = req.params.id;
  const adminUser = (req as any).user as { userId: string };
  
  try {
    // Verificar que el usuario exista
    const existing = await query('SELECT id, email, full_name, role FROM users WHERE id = ?', [userId]);
    if(!existing.rows.length){
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Prevenir que un admin se elimine a sí mismo
    if (userId === adminUser.userId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }
    
    // Eliminar registros relacionados primero (testimonials, news, etc.)
    // Esto es importante para mantener la integridad de los datos
    await query('DELETE FROM testimonials WHERE user_id = ?', [userId]);
    await query('DELETE FROM news WHERE user_id = ?', [userId]);
    await query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
    
    // Eliminar el usuario
    await query('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({ ok: true, message: 'Usuario eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: error.message || 'Error eliminando usuario' });
  }
});

export default router;
