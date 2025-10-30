"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const env_1 = require("../config/env");
async function sendEmail(opts) {
    if (env_1.env.emailProvider === 'sendgrid' && env_1.env.sendgridApiKey) {
        // Aquí integrar SendGrid SDK
        return; // placeholder
    }
    // Fallback: log en dev
    if (env_1.env.nodeEnv !== 'production') {
        console.log('EMAIL DEV ->', opts);
    }
}
