/**
 * Utilidades para envío de emails
 * Usa nodemailer para enviar emails transaccionales (propuestas)
 * Configuración SMTP desde variables de entorno
 */

import { env } from '../config/env';
import nodemailer from 'nodemailer';

/**
 * Configura el transporter de nodemailer con las credenciales SMTP del entorno
 * Si no hay credenciales SMTP configuradas, lanza error en producción o muestra logs en desarrollo
 */
const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465, // true para 465 (SSL), false para otros puertos (TLS)
  auth: env.smtpUser && env.smtpPass ? {
    user: env.smtpUser,
    pass: env.smtpPass
  } : undefined,
});

/**
 * Función genérica para enviar emails a través de SMTP
 * Si SMTP no está configurado, muestra logs en desarrollo o lanza error en producción
 * @param opts - Opciones del email:
 *   - to: Dirección de email del destinatario
 *   - subject: Asunto del email
 *   - html: Contenido HTML del email
 * @throws Error si SMTP no está configurado o si hay error al enviar
 */
export async function sendEmail(opts: { to: string; subject: string; html: string }){
  // Si no hay configuración SMTP, solo log en desarrollo
  if(!env.smtpUser || !env.smtpPass || env.smtpUser === 'tu_email@gmail.com' || env.smtpPass.includes('contraseña') || env.smtpPass.includes('abcd')){
    if(env.nodeEnv !== 'production'){
      console.log('\n' + '='.repeat(70));
      console.log('📧 EMAIL DEV MODE (SMTP no configurado correctamente)');
      console.log('='.repeat(70));
      console.log('SMTP_USER:', env.smtpUser || '(vacío)');
      console.log('SMTP_PASS:', env.smtpPass ? '(configurado)' : '(vacío)');
      console.log('Para:', opts.to);
      console.log('Asunto:', opts.subject);
      console.log('\n⚠️  Por favor configura en backend/.env:');
      console.log('   SMTP_USER=tu_email_real@gmail.com');
      console.log('   SMTP_PASS=tu_contraseña_de_aplicación_gmail');
      console.log('   EMAIL_FROM=tu_email_real@gmail.com');
      console.log('='.repeat(70) + '\n');
      throw new Error('SMTP_NO_CONFIGURED');
    }
    throw new Error('SMTP no configurado');
  }

  try {
    await transporter.sendMail({
      from: `"PH PTY Administration" <${env.emailFrom}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html
    });
    console.log(`✅ Email enviado a: ${opts.to}`);
  } catch (error: any) {
    console.error('❌ Error enviando email:', error.message);
    console.error('❌ Detalles del error:', error);
    // Si es un error de autenticación SMTP, dar información más útil
    if (error.code === 'EAUTH' || error.code === 'EENVELOPE') {
      console.error('⚠️  Error de autenticación SMTP. Verifica tus credenciales en el archivo .env');
    }
    throw error;
  }
}

/**
 * Genera la plantilla HTML para el email de solicitud de propuesta
 * @param data - Datos de la propuesta (nombre, email, teléfono, PH, alcance)
 * @returns String HTML del email
 */
function getProposalEmailHtml(data: { name: string; email: string; phone: string; phName: string; scope: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Solicitud de Propuesta</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #b90f1a; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Nueva Solicitud de Propuesta</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #161616; margin-top: 0; font-size: 20px;">Solicitud de Propuesta</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Se ha recibido una nueva solicitud de propuesta desde el sitio web.
              </p>
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table width="100%" cellpadding="8">
                  <tr>
                    <td style="font-weight: bold; color: #161616; width: 150px;">Nombre:</td>
                    <td style="color: #6b7280;">${escapeHtml(data.name)}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; color: #161616;">Email:</td>
                    <td style="color: #6b7280;"><a href="mailto:${escapeHtml(data.email)}" style="color: #b90f1a;">${escapeHtml(data.email)}</a></td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; color: #161616;">Teléfono:</td>
                    <td style="color: #6b7280;"><a href="tel:${escapeHtml(data.phone)}" style="color: #b90f1a;">${escapeHtml(data.phone)}</a></td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; color: #161616;">PH / Ubicación:</td>
                    <td style="color: #6b7280;">${escapeHtml(data.phName)}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; color: #161616; vertical-align: top;">Alcance:</td>
                    <td style="color: #6b7280; white-space: pre-wrap;">${escapeHtml(data.scope)}</td>
                  </tr>
                </table>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                Por favor, contacta al cliente lo antes posible para proporcionar una propuesta detallada.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Función auxiliar para escapar HTML
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Envía un correo con los datos de una solicitud de propuesta
 * @param data - Datos de la propuesta
 */
export async function sendProposalEmail(data: { name: string; email: string; phone: string; phName: string; scope: string }) {
  // Correo destinatario: usar PROPOSAL_EMAIL si está configurado, sino usar EMAIL_FROM
  const recipientEmail = env.proposalEmail;
  
  await sendEmail({
    to: recipientEmail,
    subject: `Nueva Solicitud de Propuesta - ${data.name}`,
    html: getProposalEmailHtml(data)
  });
  
  // Opcionalmente, enviar un correo de confirmación al usuario
  try {
    await sendEmail({
      to: data.email,
      subject: 'Confirmación de Solicitud de Propuesta - PH PTY Administration',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Solicitud</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #b90f1a; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">PH PTY Administration</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #161616; margin-top: 0; font-size: 20px;">¡Gracias por tu solicitud!</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Hola ${escapeHtml(data.name)},
              </p>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Hemos recibido tu solicitud de propuesta para <strong>${escapeHtml(data.phName)}</strong>. Nuestro equipo la está revisando y te contactaremos a la brevedad posible.
              </p>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                Mientras tanto, si tienes alguna pregunta urgente, puedes contactarnos directamente por WhatsApp al +507 6378-1316.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Atentamente,<br>
                <strong>Equipo PH PTY Administration</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    });
  } catch (error) {
    // Si falla el correo de confirmación, no es crítico
    console.error('No se pudo enviar correo de confirmación:', error);
  }
}
