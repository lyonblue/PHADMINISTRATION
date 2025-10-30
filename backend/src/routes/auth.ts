import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import * as svc from '../services/authService';
import { sendEmail } from '../utils/email';
import { env } from '../config/env';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(8), fullName: z.string().min(1) });
  const data = schema.parse(req.body);
  try {
    const { userId, verifyToken } = await svc.register(data.email, data.password, data.fullName);
    await sendEmail({ to: data.email, subject: 'Verifica tu correo', html: `Token: ${verifyToken}` });
    res.status(201).json({ userId });
  } catch (e: any) {
    if(e.message === 'email_taken') return res.status(409).json({ error: 'Email ya registrado' });
    res.status(500).json({ error: 'Error registrando' });
  }
});

router.get('/verify-email', async (req: Request, res: Response) => {
  const token = String(req.query.token || '');
  try { await svc.verifyEmail(token); res.json({ ok: true }); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/login', async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const data = schema.parse(req.body);
  try {
    const { accessToken, refreshToken, role } = await svc.login(data.email, data.password);
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 1000 * 60 * 60 * 24 * 30 });
    res.json({ accessToken, role });
  } catch {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  const { userId } = req.body as { userId: string };
  const rt = req.cookies?.refresh_token as string | undefined;
  if(!userId || !rt) return res.status(401).json({ error: 'No refresh' });
  try {
    const { accessToken, refreshToken } = await svc.refresh(userId, rt);
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 1000 * 60 * 60 * 24 * 30 });
    res.json({ accessToken });
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  // Intentar obtener userId del token JWT si está presente
  const auth = req.headers.authorization;
  let userId: string | undefined;
  
  if(auth?.startsWith('Bearer ')){
    try {
      const token = auth.slice(7);
      const payload = jwt.verify(token, env.accessSecret) as { userId: string };
      userId = payload.userId;
    } catch {
      // Token inválido, continuar sin userId
    }
  }
  
  const rt = req.cookies?.refresh_token as string | undefined;
  if(userId && rt) await svc.logout(userId, rt);
  res.clearCookie('refresh_token');
  res.json({ ok: true });
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email() });
  const { email } = schema.parse(req.body);
  const result = await svc.forgotPassword(email);
  if(result){
    await sendEmail({ to: email, subject: 'Restablece tu contraseña', html: `Token: ${result.token}` });
  }
  res.json({ ok: true });
});

router.post('/reset-password', async (req: Request, res: Response) => {
  const schema = z.object({ token: z.string(), password: z.string().min(8) });
  const { token, password } = schema.parse(req.body);
  try { await svc.resetPassword(token, password); res.json({ ok: true }); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;

