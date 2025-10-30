import { env } from '../config/env';

export async function sendEmail(opts: { to: string; subject: string; html: string }){
  if(env.emailProvider === 'sendgrid' && env.sendgridApiKey){
    // Aquí integrar SendGrid SDK
    return; // placeholder
  }
  // Fallback: log en dev
  if(env.nodeEnv !== 'production'){
    console.log('EMAIL DEV ->', opts);
  }
}

