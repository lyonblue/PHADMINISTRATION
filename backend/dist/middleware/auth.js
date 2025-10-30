"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer '))
        return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.accessSecret);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}
function requireRole(role) {
    return (req, res, next) => {
        const u = req.user;
        if (!u)
            return res.status(401).json({ error: 'Unauthorized' });
        if (u.role !== role)
            return res.status(403).json({ error: 'Forbidden' });
        next();
    };
}
