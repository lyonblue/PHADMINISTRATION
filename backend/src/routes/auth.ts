/**
 * Rutas de autenticación
 * Maneja: registro, login, logout y refresh token
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import * as svc from '../services/authService';
import { env } from '../config/env';

const router = Router();

/**
 * POST /auth/register
 * Registra un nuevo usuario en el sistema
 * Requiere: email (válido), password (mínimo 8 caracteres), fullName (no vacío)
 */
router.post('/register', async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(8), fullName: z.string().min(1) });
  const data = schema.parse(req.body);
  try {
    const { userId } = await svc.register(data.email, data.password, data.fullName);
    res.status(201).json({ userId, message: 'Usuario registrado exitosamente' });
  } catch (e: any) {
    if(e.message === 'email_taken') return res.status(409).json({ error: 'Email ya registrado' });
    console.error('Error en registro:', e);
    res.status(500).json({ error: 'Error registrando: ' + (e.message || 'Error desconocido') });
  }
});

/**
 * POST /auth/login
 * Inicia sesión con email y contraseña
 * Devuelve: accessToken (JWT) y role del usuario
 * Guarda refreshToken en cookie httpOnly
 */
router.post('/login', async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const data = schema.parse(req.body);
  try {
    const { accessToken, refreshToken, role } = await svc.login(data.email, data.password);
    // En desarrollo, no usar secure para permitir cookies en HTTP local
    const isDevelopment = env.nodeEnv === 'development';
    res.cookie('refresh_token', refreshToken, { 
      httpOnly: true, 
      secure: !isDevelopment, // Solo seguro en producción (HTTPS)
      sameSite: isDevelopment ? 'lax' : 'strict', // 'lax' en desarrollo, 'strict' en producción
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 días
    });
    res.json({ accessToken, role });
  } catch {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

/**
 * POST /auth/refresh
 * Renueva el accessToken usando el refreshToken almacenado en cookie
 * Requiere: userId en body y refresh_token en cookie
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const { userId } = req.body as { userId: string };
  const rt = req.cookies?.refresh_token as string | undefined;
  if(!userId || !rt) return res.status(401).json({ error: 'No refresh' });
  try {
    const { accessToken, refreshToken } = await svc.refresh(userId, rt);
    const isDevelopment = env.nodeEnv === 'development';
    res.cookie('refresh_token', refreshToken, { 
      httpOnly: true, 
      secure: !isDevelopment,
      sameSite: isDevelopment ? 'lax' : 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 días
    });
    res.json({ accessToken });
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
});

/**
 * POST /auth/logout
 * Cierra sesión revocando el refreshToken
 * Limpia la cookie de refresh_token
 */
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

export default router;
