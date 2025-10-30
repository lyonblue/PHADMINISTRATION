import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth';
import { query } from '../db/pool';
import { randomUUID } from 'crypto';
import { env } from '../config/env';

const router = Router();

// GET: Obtener todos los testimonios (opcional: incluir user_id si está autenticado)
router.get('/', async (req: Request, res: Response) => {
  try {
    // Intentar verificar token opcionalmente
    let userId: string | undefined = undefined;
    try {
      const authHeader = req.headers.authorization;
      if(authHeader && authHeader.startsWith('Bearer ')){
        // Intentar verificar token (sin fallar si no es válido)
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, env.accessSecret) as { userId: string; role?: string };
        if(decoded && decoded.userId){
          userId = decoded.userId;
        }
      }
    } catch (e){
      // Token inválido o no presente, continuar sin userId
      userId = undefined;
    }
    
    const r = await query(`
      SELECT t.id, t.user_id, t.user_name, t.avatar_url, t.rating, t.message, t.created_at,
             u.avatar_url as current_avatar_url
      FROM testimonials t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `);
    
    // Si hay usuario logueado, agregar flag is_owner
    // Usar avatar actual del usuario si el testimonio no tiene uno guardado
    const testimonials = r.rows.map((t: any) => ({
      ...t,
      avatar_url: t.avatar_url || t.current_avatar_url || null,
      is_owner: userId ? t.user_id === userId : false
    }));
    
    // Remover current_avatar_url del resultado
    const cleanedTestimonials = testimonials.map((t: any) => {
      const { current_avatar_url, ...rest } = t;
      return rest;
    });
    
    res.json(cleanedTestimonials);
  } catch (error: any){
    console.error('Error obteniendo testimonios:', error);
    res.status(500).json({ error: 'Error obteniendo testimonios', details: error.message });
  }
});

// POST: Crear un nuevo testimonio (requiere autenticación)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as { userId: string };
  const schema = z.object({
    rating: z.number().int().min(1).max(5),
    message: z.string().min(1).max(1000)
  });
  
  try {
    const { rating, message } = schema.parse(req.body);
    
    // Obtener nombre, avatar y rol del usuario
    const userRes = await query('SELECT full_name, email, avatar_url, role FROM users WHERE id=?', [user.userId]);
    if(!userRes.rows.length){
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const userData = userRes.rows[0] as { full_name: string | null; email: string; avatar_url: string | null; role: string };
    const userName = userData.full_name || userData.email || 'Usuario';
    const userAvatar = userData.avatar_url || null;
    const userRole = userData.role || 'user';
    
    // Verificar si el usuario ya publicó un testimonio (excepto admin que puede tener múltiples)
    if(userRole !== 'admin'){
      const existing = await query('SELECT id FROM testimonials WHERE user_id=?', [user.userId]);
      if(existing.rows.length > 0){
        return res.status(400).json({ error: 'Ya has publicado un testimonio. Solo puedes tener uno.' });
      }
    }
    
    // Crear testimonio
    const testimonialId = randomUUID();
    await query(`
      INSERT INTO testimonials (id, user_id, user_name, avatar_url, rating, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [testimonialId, user.userId, userName, userAvatar, rating, message]);
    
    // Retornar el testimonio creado
    const created = await query(`
      SELECT id, user_name, avatar_url, rating, message, created_at
      FROM testimonials
      WHERE id=?
    `, [testimonialId]);
    
    res.status(201).json(created.rows[0]);
  } catch (error: any){
    if(error.name === 'ZodError'){
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Error creando testimonio:', error);
    res.status(500).json({ error: error.message || 'Error creando testimonio' });
  }
});

// DELETE: Eliminar testimonio propio (requiere autenticación)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user as { userId: string; role?: string };
  const testimonialId = req.params.id;
  
  try {
    // Verificar que el testimonio existe y pertenece al usuario
    const existing = await query('SELECT user_id FROM testimonials WHERE id=?', [testimonialId]);
    if(!existing.rows.length){
      return res.status(404).json({ error: 'Testimonio no encontrado' });
    }
    
    const testimonial = existing.rows[0] as { user_id: string };
    const userRole = user.role || 'user';
    
    // Solo el dueño o un admin puede eliminar
    if(testimonial.user_id !== user.userId && userRole !== 'admin'){
      return res.status(403).json({ error: 'No tienes permiso para eliminar este testimonio' });
    }
    
    await query('DELETE FROM testimonials WHERE id=?', [testimonialId]);
    res.json({ ok: true, message: 'Testimonio eliminado' });
  } catch (error: any){
    console.error('Error eliminando testimonio:', error);
    res.status(500).json({ error: error.message || 'Error eliminando testimonio' });
  }
});

export default router;

