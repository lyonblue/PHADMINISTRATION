/**
 * Rutas para contacto y propuestas
 * Maneja el envío de formularios de contacto y solicitudes de propuesta
 */

import express from 'express';
import { sendProposalEmail } from '../utils/email';
import { z } from 'zod';

const router = express.Router();

/**
 * Schema de validación para solicitud de propuesta
 */
const proposalSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
  phName: z.string().min(2, 'El nombre del PH es requerido'),
  scope: z.string().min(5, 'Por favor describe tus necesidades (mínimo 5 caracteres)')
});

/**
 * POST /contact/proposal
 * Recibe una solicitud de propuesta y envía un correo
 */
router.post('/proposal', async (req, res) => {
  try {
    // Validar datos
    const validatedData = proposalSchema.parse(req.body);
    
    // Enviar correo con los datos de la propuesta
    await sendProposalEmail(validatedData);
    
    res.json({ 
      success: true, 
      message: 'Tu solicitud de propuesta ha sido enviada correctamente. Te contactaremos pronto.' 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('Error de validación:', error.errors);
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    
    console.error('Error enviando propuesta:', error);
    
    // Si es error de SMTP no configurado, responder con mensaje amigable
    if (error.message === 'SMTP_NO_CONFIGURED') {
      return res.status(503).json({ 
        error: 'Servicio de correo no configurado. Por favor contacta directamente por WhatsApp.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error al enviar la propuesta. Por favor intenta de nuevo o contacta directamente por WhatsApp.' 
    });
  }
});

export default router;

