import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { query } from '../db/pool';
import { randomUUID } from 'crypto';

const router = Router();

// GET: Obtener todas las noticias (público)
router.get('/', async (req: Request, res: Response) => {
  try {
    const r = await query(`
      SELECT n.id, n.title, n.subtitle, n.description, n.image_url, n.created_at,
             u.full_name as author_name
      FROM news n
      LEFT JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
      LIMIT 50
    `);
    
    res.json(r.rows);
  } catch (error: any) {
    console.error('Error obteniendo noticias:', error);
    res.status(500).json({ error: 'Error obteniendo noticias', details: error.message });
  }
});

// POST: Crear nueva noticia (solo admin)
router.post('/', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const user = (req as any).user as { userId: string };
  const schema = z.object({
    title: z.string().min(1).max(255),
    subtitle: z.string().min(1).max(500),
    description: z.string().min(1).max(5000),
    image_url: z.string().min(1)
  });

  try {
    const { title, subtitle, description, image_url } = schema.parse(req.body);

    const newsId = randomUUID();
    await query(`
      INSERT INTO news (id, user_id, title, subtitle, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [newsId, user.userId, title, subtitle, description, image_url]);

    const created = await query(`
      SELECT n.id, n.title, n.subtitle, n.description, n.image_url, n.created_at,
             u.full_name as author_name
      FROM news n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.id = ?
    `, [newsId]);

    res.status(201).json(created.rows[0]);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Error creando noticia:', error);
    res.status(500).json({ error: error.message || 'Error creando noticia' });
  }
});

// DELETE: Eliminar noticia (solo admin)
router.delete('/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const newsId = req.params.id;
  
  try {
    const existing = await query('SELECT id FROM news WHERE id=?', [newsId]);
    if(!existing.rows.length){
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }
    
    await query('DELETE FROM news WHERE id=?', [newsId]);
    res.json({ ok: true, message: 'Noticia eliminada' });
  } catch (error: any) {
    console.error('Error eliminando noticia:', error);
    res.status(500).json({ error: error.message || 'Error eliminando noticia' });
  }
});

export default router;

