"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.verifyEmail = verifyEmail;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.createUser = createUser;
const pool_1 = require("../db/pool");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
function signAccessToken(userId, role) {
    return jsonwebtoken_1.default.sign({ userId, role }, env_1.env.accessSecret, { expiresIn: env_1.env.accessTtlSeconds });
}
function signRefreshToken() {
    return crypto_1.default.randomBytes(48).toString('hex');
}
function hashToken(t) {
    return crypto_1.default.createHash('sha256').update(t).digest('hex');
}
async function register(email, password, fullName) {
    const existing = await (0, pool_1.query)('select id from users where email=$1', [email.toLowerCase()]);
    if (existing.rows.length)
        throw new Error('email_taken');
    const hash = await bcrypt_1.default.hash(password, 12);
    const userId = (0, uuid_1.v4)();
    await (0, pool_1.query)('insert into users (id, email, password_hash, full_name) values ($1,$2,$3,$4)', [userId, email.toLowerCase(), hash, fullName]);
    const user = await (0, pool_1.query)('select id, role from users where id=$1', [userId]);
    const token = (0, uuid_1.v4)();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await (0, pool_1.query)('insert into email_verifications (user_id, token, expires_at) values ($1,$2,$3)', [userId, token, expires]);
    return { userId: user.rows[0].id, verifyToken: token };
}
async function verifyEmail(token) {
    const res = await (0, pool_1.query)('select user_id, expires_at from email_verifications where token=$1', [token]);
    if (!res.rows.length)
        throw new Error('invalid_token');
    const row = res.rows[0];
    if (new Date(row.expires_at) < new Date())
        throw new Error('expired_token');
    await (0, pool_1.query)('update users set email_verified_at=now() where id=$1', [row.user_id]);
    await (0, pool_1.query)('delete from email_verifications where token=$1', [token]);
}
async function login(email, password) {
    const res = await (0, pool_1.query)('select id, password_hash, role, email_verified_at from users where email=$1', [email.toLowerCase()]);
    if (!res.rows.length)
        throw new Error('invalid_credentials');
    const u = res.rows[0];
    const ok = await bcrypt_1.default.compare(password, u.password_hash);
    if (!ok)
        throw new Error('invalid_credentials');
    const access = signAccessToken(u.id, u.role);
    const refreshRaw = signRefreshToken();
    const refreshHash = hashToken(refreshRaw);
    const exp = new Date(Date.now() + env_1.env.refreshTtlSeconds * 1000);
    await (0, pool_1.query)('insert into refresh_tokens (user_id, token_hash, expires_at) values ($1,$2,$3)', [u.id, refreshHash, exp]);
    return { accessToken: access, refreshToken: refreshRaw, role: u.role };
}
async function refresh(userId, refreshToken) {
    const hash = hashToken(refreshToken);
    const res = await (0, pool_1.query)('select id, expires_at from refresh_tokens where user_id=$1 and token_hash=$2 and revoked_at is null', [userId, hash]);
    if (!res.rows.length)
        throw new Error('invalid_refresh');
    if (new Date(res.rows[0].expires_at) < new Date())
        throw new Error('expired_refresh');
    // rotate
    const newRaw = signRefreshToken();
    const newHash = hashToken(newRaw);
    const newExp = new Date(Date.now() + env_1.env.refreshTtlSeconds * 1000);
    await (0, pool_1.query)('update refresh_tokens set revoked_at=now() where id=$1', [res.rows[0].id]);
    await (0, pool_1.query)('insert into refresh_tokens (user_id, token_hash, expires_at) values ($1,$2,$3)', [userId, newHash, newExp]);
    const roleRes = await (0, pool_1.query)('select role from users where id=$1', [userId]);
    const role = roleRes.rows[0].role;
    const access = signAccessToken(userId, role);
    return { accessToken: access, refreshToken: newRaw };
}
async function logout(userId, refreshToken) {
    const hash = hashToken(refreshToken);
    await (0, pool_1.query)('update refresh_tokens set revoked_at=now() where user_id=$1 and token_hash=$2 and revoked_at is null', [userId, hash]);
}
async function forgotPassword(email) {
    const res = await (0, pool_1.query)('select id from users where email=$1', [email.toLowerCase()]);
    if (!res.rows.length)
        return; // no revelar existencia
    const userId = res.rows[0].id;
    const token = (0, uuid_1.v4)();
    const exp = new Date(Date.now() + 1000 * 60 * 15);
    await (0, pool_1.query)('insert into password_resets (user_id, token, expires_at) values ($1,$2,$3)', [userId, token, exp]);
    return { userId, token };
}
async function resetPassword(token, newPassword) {
    const res = await (0, pool_1.query)('select user_id, expires_at from password_resets where token=$1', [token]);
    if (!res.rows.length)
        throw new Error('invalid_token');
    const row = res.rows[0];
    if (new Date(row.expires_at) < new Date())
        throw new Error('expired_token');
    const hash = await bcrypt_1.default.hash(newPassword, 12);
    await (0, pool_1.query)('update users set password_hash=$1 where id=$2', [hash, row.user_id]);
    await (0, pool_1.query)('delete from password_resets where token=$1', [token]);
}
// Crear usuario con rol específico (solo para admins)
async function createUser(email, password, fullName, role = 'user', skipVerification = false) {
    const existing = await (0, pool_1.query)('select id from users where email=$1', [email.toLowerCase()]);
    if (existing.rows.length)
        throw new Error('email_taken');
    const hash = await bcrypt_1.default.hash(password, 12);
    const userId = (0, uuid_1.v4)();
    const emailVerified = skipVerification ? new Date() : null;
    await (0, pool_1.query)('insert into users (id, email, password_hash, full_name, role, email_verified_at) values ($1,$2,$3,$4,$5,$6)', [userId, email.toLowerCase(), hash, fullName, role, emailVerified]);
    if (!skipVerification) {
        const token = (0, uuid_1.v4)();
        const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
        await (0, pool_1.query)('insert into email_verifications (user_id, token, expires_at) values ($1,$2,$3)', [userId, token, expires]);
        return { userId, verifyToken: token };
    }
    return { userId };
}
