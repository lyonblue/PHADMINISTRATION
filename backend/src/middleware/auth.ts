import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload { userId: string; role: string; }

export function requireAuth(req: Request, res: Response, next: NextFunction){
  const auth = req.headers.authorization;
  if(!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, env.accessSecret) as JwtPayload;
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(role: string){
  return (req: Request, res: Response, next: NextFunction) => {
    const u = (req as any).user as JwtPayload | undefined;
    if(!u) return res.status(401).json({ error: 'Unauthorized' });
    if(u.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

