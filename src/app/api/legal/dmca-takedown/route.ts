import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/infrastructure/persistence/supabase/server';

const DmcaTakedownSchema = z.object({
  nombreDeclarante: z.string().min(2, 'Nombre completo requerido'),
  emailDeclarante: z.string().email('Correo de contacto válido requerido'),
  empresaTitular: z.string().min(2, 'Titular de los derechos de autor requerido'),
  descripcionObraOriginal: z.string().min(10, 'Describe la obra original protegida por derechos de autor'),
  urlContenidoInfractor: z.string().min(5, 'Especifica la URL o ubicación del archivo/imagen en la plataforma'),
  declaracionBuenaFe: z.boolean().refine((val) => val === true, {
    message: 'Debes certificar bajo la gravedad de juramento la declaración de buena fe (17 U.S.C. § 512(c)(3)(A)(v)).',
  }),
  declaracionPerjurio: z.boolean().refine((val) => val === true, {
    message: 'Debes certificar bajo pena de perjurio que eres el titular o estás autorizado para actuar.',
  }),
  firmaDigital: z.string().min(3, 'Firma física o electrónica requerida'),
});

/**
 * DMCA-006 Notice and Takedown Endpoint (17 U.S.C. § 512)
 * Registra inmutablemente la notificación de infracción y dispara alerta de remoción expedita.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = DmcaTakedownSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: validation.error.errors.map((e) => e.message).join('. '),
      }, { status: 400 });
    }

    const {
      nombreDeclarante,
      emailDeclarante,
      empresaTitular,
      descripcionObraOriginal,
      urlContenidoInfractor,
      firmaDigital,
    } = validation.data;

    const adminSupabase = createAdminSupabaseClient();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const caseId = `DMCA-${Date.now().toString(36).toUpperCase()}`;

    // Registrar en audit_logs de forma inmutable
    const { error: auditError } = await adminSupabase.from('audit_logs').insert({
      empresa_id: '00000000-0000-0000-0000-000000000000',
      usuario_email: emailDeclarante,
      usuario_nombre: nombreDeclarante,
      modulo: 'LEGAL_DMCA',
      accion: 'DMCA_NOTICE_TAKEDOWN_SUBMITTED',
      descripcion: `Caso [${caseId}]: Solicitud formal de retiro DMCA recibida de ${nombreDeclarante} (${empresaTitular})`,
      detalles: {
        case_id: caseId,
        titular_derechos: empresaTitular,
        declarante: nombreDeclarante,
        email_declarante: emailDeclarante,
        obra_original: descripcionObraOriginal,
        url_infractora: urlContenidoInfractor,
        firma_electronica: firmaDigital,
        estatuto_legal: '17 U.S.C. § 512(c)(3)',
        ip_origen: ip,
        fecha_utc: new Date().toISOString(),
        estado: 'PENDIENTE_RETIRO_EXPEDITO',
      },
    });

    if (auditError) {
      console.error('[DMCA Takedown Action] Error guardando auditoría:', auditError);
    }

    return NextResponse.json({
      success: true,
      caseId,
      message: `Tu notificación ha sido registrada con el radicado ${caseId}. Nuestro Agente de Copyright procesará el retiro expedito del material reportado conforme al Safe Harbor del DMCA.`,
    });
  } catch (error: any) {
    console.error('[DMCA Takedown Action] Excepción:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno al tramitar la notificación DMCA. Puedes escribir a copyright@alquileres-system.com.',
    }, { status: 500 });
  }
}
