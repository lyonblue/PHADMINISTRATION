import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh',
  accessTtlSeconds: parseInt(process.env.ACCESS_TOKEN_TTL_SECONDS || '900', 10),
  refreshTtlSeconds: parseInt(process.env.REFRESH_TOKEN_TTL_SECONDS || '2592000', 10),
  allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
  emailProvider: process.env.EMAIL_PROVIDER || 'smtp',
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'no-reply@example.com',
  proposalEmail: process.env.PROPOSAL_EMAIL || process.env.EMAIL_FROM || 'kkillingbeck939@gmail.com',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost'
};

