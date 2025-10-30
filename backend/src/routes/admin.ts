import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import * as svc from '../services/authService';
import { sendEmail } from '../utils/email';

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
    const { userId, verifyToken } = await svc.createUser(
      data.email,
      data.password,
      data.fullName,
      data.role,
      data.skipVerification
    );
    if(verifyToken && !data.skipVerification){
      await sendEmail({ to: data.email, subject: 'Verifica tu correo', html: `Token: ${verifyToken}` });
    }
    res.status(201).json({ userId, role: data.role, message: 'Usuario creado exitosamente' });
  } catch (e: any) {
    if(e.message === 'email_taken') return res.status(409).json({ error: 'Email ya registrado' });
    res.status(500).json({ error: 'Error creando usuario' });
  }
});

export default router;
