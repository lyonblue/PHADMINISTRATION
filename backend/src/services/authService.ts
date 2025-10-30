import { query } from '../db/pool';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

function signAccessToken(userId: string, role: string){
  return jwt.sign({ userId, role }, env.accessSecret, { expiresIn: env.accessTtlSeconds });
}
function signRefreshToken(){
  return crypto.randomBytes(48).toString('hex');
}
function hashToken(t: string){
  return crypto.createHash('sha256').update(t).digest('hex');
}

export async function register(email: string, password: string, fullName: string){
  const existing = await query('select id from users where email=$1', [email.toLowerCase()]);
  if(existing.rows.length) throw new Error('email_taken');
  const hash = await bcrypt.hash(password, 12);
  const userId = uuidv4();
  await query('insert into users (id, email, password_hash, full_name) values ($1,$2,$3,$4)', [userId, email.toLowerCase(), hash, fullName]);
  const user = await query<{ id: string; role: string }>('select id, role from users where id=$1', [userId]);
  const token = uuidv4();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await query('insert into email_verifications (user_id, token, expires_at) values ($1,$2,$3)', [userId, token, expires]);
  return { userId: user.rows[0].id, verifyToken: token };
}

export async function verifyEmail(token: string){
  const res = await query<{ user_id: string; expires_at: Date }>('select user_id, expires_at from email_verifications where token=$1', [token]);
  if(!res.rows.length) throw new Error('invalid_token');
  const row = res.rows[0];
  if(new Date(row.expires_at) < new Date()) throw new Error('expired_token');
  await query('update users set email_verified_at=now() where id=$1', [row.user_id]);
  await query('delete from email_verifications where token=$1', [token]);
}

export async function login(email: string, password: string){
  const res = await query<{ id: string; password_hash: string; role: string; email_verified_at: Date | null }>('select id, password_hash, role, email_verified_at from users where email=$1', [email.toLowerCase()]);
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

export async function refresh(userId: string, refreshToken: string){
  const hash = hashToken(refreshToken);
  const res = await query<{ id: string; expires_at: Date }>('select id, expires_at from refresh_tokens where user_id=$1 and token_hash=$2 and revoked_at is null', [userId, hash]);
  if(!res.rows.length) throw new Error('invalid_refresh');
  if(new Date(res.rows[0].expires_at) < new Date()) throw new Error('expired_refresh');
  // rotate
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

export async function logout(userId: string, refreshToken: string){
  const hash = hashToken(refreshToken);
  await query('update refresh_tokens set revoked_at=now() where user_id=$1 and token_hash=$2 and revoked_at is null', [userId, hash]);
}

export async function forgotPassword(email: string){
  const res = await query<{ id: string }>('select id from users where email=$1', [email.toLowerCase()]);
  if(!res.rows.length) return; // no revelar existencia
  const userId = res.rows[0].id;
  const token = uuidv4();
  const exp = new Date(Date.now() + 1000 * 60 * 15);
  await query('insert into password_resets (user_id, token, expires_at) values ($1,$2,$3)', [userId, token, exp]);
  return { userId, token };
}

export async function resetPassword(token: string, newPassword: string){
  const res = await query<{ user_id: string; expires_at: Date }>('select user_id, expires_at from password_resets where token=$1', [token]);
  if(!res.rows.length) throw new Error('invalid_token');
  const row = res.rows[0];
  if(new Date(row.expires_at) < new Date()) throw new Error('expired_token');
  const hash = await bcrypt.hash(newPassword, 12);
  await query('update users set password_hash=$1 where id=$2', [hash, row.user_id]);
  await query('delete from password_resets where token=$1', [token]);
}

// Crear usuario con rol específico (solo para admins)
export async function createUser(email: string, password: string, fullName: string, role: 'admin' | 'user' = 'user', skipVerification = false){
  const existing = await query('select id from users where email=$1', [email.toLowerCase()]);
  if(existing.rows.length) throw new Error('email_taken');
  const hash = await bcrypt.hash(password, 12);
  const userId = uuidv4();
  const emailVerified = skipVerification ? new Date() : null;
  await query('insert into users (id, email, password_hash, full_name, role, email_verified_at) values ($1,$2,$3,$4,$5,$6)', [userId, email.toLowerCase(), hash, fullName, role, emailVerified]);
  if(!skipVerification){
    const token = uuidv4();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await query('insert into email_verifications (user_id, token, expires_at) values ($1,$2,$3)', [userId, token, expires]);
    return { userId, verifyToken: token };
  }
  return { userId };
}

