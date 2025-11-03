"use strict";
/**
 * Rutas para contacto y propuestas
 * Maneja el envío de formularios de contacto y solicitudes de propuesta
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const email_1 = require("../utils/email");
const zod_1 = require("zod");
const router = express_1.default.Router();
/**
 * Schema de validación para solicitud de propuesta
 */
const proposalSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: zod_1.z.string().email('Email inválido'),
    phone: zod_1.z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
    phName: zod_1.z.string().min(2, 'El nombre del PH es requerido'),
    scope: zod_1.z.string().min(5, 'Por favor describe tus necesidades (mínimo 5 caracteres)')
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
        await (0, email_1.sendProposalEmail)(validatedData);
        res.json({
            success: true,
            message: 'Tu solicitud de propuesta ha sido enviada correctamente. Te contactaremos pronto.'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
exports.default = router;
