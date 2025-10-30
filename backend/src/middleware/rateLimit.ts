import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

const limiter = new RateLimiterMemory({ points: 100, duration: 60 });

export async function rateLimit(req: Request, res: Response, next: NextFunction){
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    await limiter.consume(ip);
    next();
  } catch {
    res.status(429).json({ error: 'Too many requests' });
  }
}

