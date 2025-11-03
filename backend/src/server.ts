import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { rateLimit } from './middleware/rateLimit';
import authRoutes from './routes/auth';
import meRoutes from './routes/me';
import adminRoutes from './routes/admin';
import testimonialsRoutes from './routes/testimonials';
import newsRoutes from './routes/news';
import contactRoutes from './routes/contact';

const app = express();

// Helmet con configuración menos restrictiva para desarrollo
if(env.nodeEnv === 'development'){
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
} else {
  app.use(helmet());
}

// CORS: más permisivo en desarrollo
if(env.nodeEnv === 'development'){
  app.use(cors({ 
    origin: true, // Permitir cualquier origen en desarrollo
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With']
  }));
} else {
  const allowedOrigins = env.allowedOrigin === '*' 
    ? ['http://localhost:5500', 'http://localhost:5501', 'http://127.0.0.1:5500', 'http://127.0.0.1:5501']
    : env.allowedOrigin.split(',').map(o => o.trim());
  app.use(cors({ 
    origin: (origin, callback) => {
      if(!origin || allowedOrigins.includes(origin)){
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With']
  }));
}
app.use(express.json());
app.use(cookieParser());
app.use(rateLimit);

// Ruta raíz
app.get('/', (_, res) => {
  res.json({ 
    message: 'PH PTY Administration API',
    version: '1.0.0',
      endpoints: {
      health: '/health',
      auth: '/auth/*',
      me: '/me',
      admin: '/admin/*',
      testimonials: '/testimonials',
      news: '/news',
      contact: '/contact/*'
    }
  });
});

app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/auth', authRoutes);
app.use('/me', meRoutes);
app.use('/admin', adminRoutes);
app.use('/testimonials', testimonialsRoutes);
app.use('/news', newsRoutes);
app.use('/contact', contactRoutes);

// Manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Manejar errores
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Error' });
});

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});

