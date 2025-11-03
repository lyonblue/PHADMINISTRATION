/**
 * Servicio de autenticación
 * Maneja toda la lógica de negocio relacionada con usuarios y autenticación:
 * - Registro e inicio de sesión
 * - Generación y validación de tokens JWT
 * - Refresh tokens con rotación
 * - Gestión de usuarios por administradores
 */

import { query } from '../db/pool';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Genera un JWT (access token) para un usuario
 * @param userId - ID único del usuario
 * @param role - Rol del usuario ('admin' o 'user')
 * @returns JWT firmado con expiración configurada
 */
function signAccessToken(userId: string, role: string){
  return jwt.sign({ userId, role }, env.accessSecret, { expiresIn: env.accessTtlSeconds });
}

/**
 * Genera un refresh token aleatorio (string hexadecimal)
 * @returns Token aleatorio de 96 caracteres (48 bytes en hex)
 */
function signRefreshToken(){
  return crypto.randomBytes(48).toString('hex');
}

/**
 * Hashea un token usando SHA-256 para almacenamiento seguro
 * @param t - Token en texto plano
 * @returns Hash hexadecimal del token
 */
function hashToken(t: string){
  return crypto.createHash('sha256').update(t).digest('hex');
}

/**
 * Registra un nuevo usuario en el sistema
 * @param email - Email del usuario (se normaliza a minúsculas)
 * @param password - Contraseña en texto plano (se hashea con bcrypt)
 * @param fullName - Nombre completo del usuario
 * @returns Objeto con userId del usuario creado
 * @throws Error si el email ya está registrado
 */
export async function register(email: string, password: string, fullName: string){
  const existing = await query('select id from users where email=$1', [email.toLowerCase()]);
  if(existing.rows.length) throw new Error('email_taken');
  const hash = await bcrypt.hash(password, 12);
  const userId = uuidv4();
  // Crear usuario con email verificado automáticamente
  await query('insert into users (id, email, password_hash, full_name, email_verified_at) values ($1,$2,$3,$4,$5)', [userId, email.toLowerCase(), hash, fullName, new Date()]);
  const user = await query<{ id: string; role: string }>('select id, role from users where id=$1', [userId]);
  return { userId: user.rows[0].id };
}

/**
 * Autentica un usuario con email y contraseña
 * @param email - Email del usuario
 * @param password - Contraseña en texto plano
 * @returns Objeto con accessToken (JWT), refreshToken (string) y role del usuario
 * @throws Error si las credenciales son inválidas
 */
export async function login(email: string, password: string){
  const res = await query<{ id: string; password_hash: string; role: string }>('select id, password_hash, role from users where email=$1', [email.toLowerCase()]);
  if(!res.rows.length) throw new Error('invalid_credentials');
  const u = res.rows[0];
  const ok = await bcrypt.compare(password, u.password_hash);
  if(!ok) throw new Error('invalid_credentials');
  const access = signAccessToken(u.id, u.role);
  const refreshRaw = signRefreshToken();
  const refreshHash = hashToken(refreshRaw);
  const exp = new Date(Date.now() + env.refreshTtlSeconds * 1000);
  await query('insert into refresh_tokens (user_id, token_hash, expires_at) values ($1,$2,$3)', [u.id, refreshHash, exp]);
  return { accessToken: access, refreshToken: refreshRaw, role: u.role };
}

/**
 * Renueva el accessToken usando un refreshToken válido
 * Implementa rotación de tokens para mayor seguridad
 * @param userId - ID del usuario
 * @param refreshToken - Refresh token en texto plano
 * @returns Nuevo accessToken y refreshToken
 * @throws Error si el refreshToken es inválido o ha expirado
 */
export async function refresh(userId: string, refreshToken: string){
  const hash = hashToken(refreshToken);
  const res = await query<{ id: string; expires_at: Date }>('select id, expires_at from refresh_tokens where user_id=$1 and token_hash=$2 and revoked_at is null', [userId, hash]);
  if(!res.rows.length) throw new Error('invalid_refresh');
  if(new Date(res.rows[0].expires_at) < new Date()) throw new Error('expired_refresh');
  // Rotación de tokens: revocar el anterior y crear uno nuevo
  const newRaw = signRefreshToken();
  const newHash = hashToken(newRaw);
  const newExp = new Date(Date.now() + env.refreshTtlSeconds * 1000);
  await query('update refresh_tokens set revoked_at=now() where id=$1', [res.rows[0].id]);
  await query('insert into refresh_tokens (user_id, token_hash, expires_at) values ($1,$2,$3)', [userId, newHash, newExp]);
  const roleRes = await query<{ role: string }>('select role from users where id=$1', [userId]);
  const role = roleRes.rows[0].role;
  const access = signAccessToken(userId, role);
  return { accessToken: access, refreshToken: newRaw };
}

/**
 * Cierra sesión revocando un refreshToken específico
 * @param userId - ID del usuario
 * @param refreshToken - Refresh token a revocar
 */
export async function logout(userId: string, refreshToken: string){
  const hash = hashToken(refreshToken);
  await query('update refresh_tokens set revoked_at=now() where user_id=$1 and token_hash=$2 and revoked_at is null', [userId, hash]);
}

/**
 * Crea un usuario con rol específico (solo para administradores)
 * @param email - Email del usuario
 * @param password - Contraseña en texto plano
 * @param fullName - Nombre completo
 * @param role - Rol del usuario ('admin' o 'user'), por defecto 'user'
 * @param skipVerification - Si es true, marca el email como verificado automáticamente
 * @returns Objeto con userId del usuario creado
 * @throws Error si el email ya está registrado
 */
export async function createUser(email: string, password: string, fullName: string, role: 'admin' | 'user' = 'user', skipVerification = false){
  const existing = await query('select id from users where email=$1', [email.toLowerCase()]);
  if(existing.rows.length) throw new Error('email_taken');
  const hash = await bcrypt.hash(password, 12);
  const userId = uuidv4();
  // Crear usuario con email verificado automáticamente
  await query('insert into users (id, email, password_hash, full_name, role, email_verified_at) values ($1,$2,$3,$4,$5,$6)', [userId, email.toLowerCase(), hash, fullName, role, new Date()]);
  return { userId };
}
