"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
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
    emailFrom: process.env.EMAIL_FROM || 'no-reply@example.com'
};
