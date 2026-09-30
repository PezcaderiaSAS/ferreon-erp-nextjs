/**
 * CAN-SPAM-004 Compliance Email Framework (Controlling the Assault of Non-Slick Marketing Act)
 * 
 * Todo correo saliente de la plataforma (transaccional, cotizaciones, liquidaciones o avisos)
 * debe incluir obligatoriamente:
 * 1. Dirección postal física visible del remitente.
 * 2. Enlace de baja directa de suscripción (Unsubscribe) de fácil acceso y 1 clic.
 * 3. Cabeceras estándar RFC 2369 / RFC 8058: List-Unsubscribe y List-Unsubscribe-Post.
 */

export interface LegalEmailOptions {
  subject: string;
  recipientEmail: string;
  recipientName?: string;
  bodyHtml: string;
  unsubscribeToken?: string;
  isTransactional?: boolean;
}

export const COMPANY_LEGAL_ADDRESS = {
  name: 'Alquileres System — Gestión Empresarial de Maquinaria SAS',
  street: 'Calle 35 # 18-21, Oficina 402',
  city: 'Bucaramanga, Santander',
  country: 'Colombia',
  postalCode: '680006',
  email: 'contacto@alquileres-system.com',
};

/**
 * Genera las cabeceras estándar RFC 2369 / RFC 8058 obligatorias bajo CAN-SPAM Act.
 */
export function getLegalEmailHeaders(recipientEmail: string, unsubscribeToken: string = 'global-opt-out') {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alquileres-system.com';
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(recipientEmail)}&token=${encodeURIComponent(unsubscribeToken)}`;
  
  return {
    'List-Unsubscribe': `<mailto:bajas@alquileres-system.com?subject=Unsubscribe%20${recipientEmail}>, <${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    'X-Compliance-Framework': 'CAN-SPAM-Act-2003-FTC-Compliant',
  };
}

/**
 * Envuelve el cuerpo del mensaje en una plantilla HTML accesible y estandarizada con el footer legal CAN-SPAM.
 */
export function renderLegalEmailHtml(options: LegalEmailOptions): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alquileres-system.com';
  const token = options.unsubscribeToken || 'opt-out';
  const unsubscribeLink = `${baseUrl}/unsubscribe?email=${encodeURIComponent(options.recipientEmail)}&token=${encodeURIComponent(token)}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #ea580c, #f59e0b); padding: 24px; text-align: left; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; line-height: 1.6; font-size: 15px; color: #1e293b; }
    .footer { background: #f8fafc; padding: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5; }
    .footer a { color: #ea580c; text-decoration: underline; }
    .address { margin-top: 8px; font-style: normal; }
    .badge { display: inline-block; padding: 3px 8px; background: #e2e8f0; border-radius: 6px; font-size: 11px; font-weight: 600; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Alquileres System</h1>
    </div>
    <div class="content">
      ${options.bodyHtml}
    </div>
    <div class="footer">
      <p>
        Has recibido este correo a <strong>${options.recipientEmail}</strong> como parte de los servicios operativos de <strong>Alquileres System</strong>.
        ${options.isTransactional ? 'Este es un mensaje transaccional esencial para la ejecución de contratos y cotizaciones de maquinaria.' : ''}
      </p>
      <p>
        ¿No deseas recibir más comunicaciones comerciales o avisos informativos?
        <br>
        <a href="${unsubscribeLink}" target="_blank" rel="noopener noreferrer">
          Haz clic aquí para darte de baja de nuestra lista (Desuscripción en 1 Clic / Unsubscribe)
        </a>
      </p>
      <address class="address">
        <strong>${COMPANY_LEGAL_ADDRESS.name}</strong><br>
        ${COMPANY_LEGAL_ADDRESS.street} • ${COMPANY_LEGAL_ADDRESS.city} • ${COMPANY_LEGAL_ADDRESS.country}<br>
        Código Postal: ${COMPANY_LEGAL_ADDRESS.postalCode} • Contacto: ${COMPANY_LEGAL_ADDRESS.email}
      </address>
      <p style="margin-top: 12px; font-size: 10px; color: #94a3b8;">
        Mensaje conforme a la Ley CAN-SPAM de 2003 (15 U.S.C. 7701) y la Ley 1581 de Protección de Datos.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
