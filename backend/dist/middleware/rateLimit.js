"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const limiter = new rate_limiter_flexible_1.RateLimiterMemory({ points: 100, duration: 60 });
async function rateLimit(req, res, next) {
    try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        await limiter.consume(ip);
        next();
    }
    catch {
        res.status(429).json({ error: 'Too many requests' });
    }
}
