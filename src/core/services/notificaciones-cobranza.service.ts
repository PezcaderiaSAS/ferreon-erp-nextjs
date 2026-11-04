/**
 * Servicio de Dominio Puro: Notificaciones de Cobranza y Recordatorios Express
 * Alquileres System - SPEC-017
 * 
 * Implementa de forma determinista la sanitización de teléfonos colombianos (+57),
 * la construcción de enlaces seguros de WhatsApp Web/Desktop y plantillas de correo
 * para recordatorios de entrega express por horas y cobranza de cartera en mora.
 */

export interface SanitizacionTelefonoResultado {
  valido: boolean;
  telefonoE164: string; // ej: '573151234567'
  telefonoFormateado: string; // ej: '+57 315 123 4567'
  error?: string;
}

export interface NotificacionItemExpress {
  nombreEquipo: string;
  cantidad: number;
  tarifaHora: number;
}

export interface RecordatorioExpressParams {
  clienteNombre: string;
  clienteTelefono: string;
  alquilerConsecutivo: number | string;
  items: NotificacionItemExpress[];
  horasPactadas: number;
  horaEntrega: string; // 'HH:mm' o 'HH:mm AM/PM'
  horaDevolucionEstimada: string; // 'HH:mm' o 'HH:mm AM/PM'
  empresaNombre?: string;
  urlDocumento?: string;
}

export interface AlertaMoraExpressParams extends RecordatorioExpressParams {
  horaActual?: string; // 'HH:mm' o 'HH:mm AM/PM'
  minutosTolerancia?: number; // por defecto 15 min
}

export interface ItemContratoCartera {
  consecutivo: number | string;
  fechaInicio: string;
  fechaFin: string;
  equiposResumen: string;
  saldoPendiente: number;
}

export interface ExtractoCarteraParams {
  clienteNombre: string;
  clienteNit: string;
  clienteTelefono: string;
  clienteEmail?: string;
  contratos: ItemContratoCartera[];
  totalDeuda: number;
  cuentaBancariaInfo?: string;
  empresaNombre?: string;
  urlEstadoCuenta?: string;
}

export interface EnlaceNotificacionResultado {
  url: string;
  mensaje: string;
  telefonoValido: boolean;
  telefonoE164: string;
}

export interface EnlaceNotificacionMoraResultado extends EnlaceNotificacionResultado {
  horasMora: number;
  recargoEstimado: number;
}

export interface PlantillaEmailResultado {
  asunto: string;
  cuerpoHtml: string;
  destinatario: string;
}

export class NotificacionesCobranzaService {
  /**
   * Sanitiza y normaliza un número de teléfono celular para Colombia (+57).
   */
  public static sanitizarTelefonoColombia(telefonoRaw: string): SanitizacionTelefonoResultado {
    if (!telefonoRaw || typeof telefonoRaw !== 'string') {
      return {
        valido: false,
        telefonoE164: '',
        telefonoFormateado: '',
        error: 'El número de teléfono está vacío o no es válido.',
      };
    }

    // Remover todos los caracteres no numéricos
    const digitos = telefonoRaw.replace(/\D/g, '');

    if (!digitos || digitos.length < 10) {
      return {
        valido: false,
        telefonoE164: '',
        telefonoFormateado: '',
        error: 'El teléfono debe tener al menos 10 dígitos (celular colombiano standard).',
      };
    }

    let telefonoE164 = '';

    // Caso 1: 10 dígitos comenzando con 3 (ej: 3157894512)
    if (digitos.length === 10 && digitos.startsWith('3')) {
      telefonoE164 = `57${digitos}`;
    }
    // Caso 2: 12 dígitos comenzando con 573 (ej: 573157894512)
    else if (digitos.length === 12 && digitos.startsWith('573')) {
      telefonoE164 = digitos;
    }
    // Caso 3: otro formato celular internacional
    else if (digitos.length >= 10) {
      telefonoE164 = digitos.startsWith('57') ? digitos : `57${digitos}`;
    } else {
      return {
        valido: false,
        telefonoE164: '',
        telefonoFormateado: '',
        error: 'El prefijo del número telefónico no corresponde a una línea válida.',
      };
    }

    // Formatear visualmente: +57 3XX XXX XXXX
    const num = telefonoE164.slice(2);
    const telefonoFormateado = `+57 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;

    return {
      valido: true,
      telefonoE164,
      telefonoFormateado,
    };
  }

  /**
   * Formatea un valor numérico a moneda colombiana (COP) con separador de miles.
   */
  public static formatearMonedaCOP(valor: number): string {
    const entero = Math.round(valor || 0);
    return `$ ${entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }

  /**
   * Parsea cadenas de hora en formato 'HH:mm' o 'HH:mm AM/PM' a minutos desde medianoche (0 a 1439).
   */
  public static parsearHoraAMinutos(horaStr: string): number {
    if (!horaStr) return 0;
    const clean = horaStr.trim().toUpperCase();
    const isPM = clean.includes('PM');
    const isAM = clean.includes('AM');
    const parteHora = clean.replace(/[A-Z\s]/g, '');
    const [hRaw, mRaw] = parteHora.split(':').map(Number);
    let hora = isNaN(hRaw) ? 0 : hRaw;
    const minutos = isNaN(mRaw) ? 0 : mRaw;

    if (isPM && hora < 12) {
      hora += 12;
    } else if (isAM && hora === 12) {
      hora = 0;
    }

    return hora * 60 + minutos;
  }

  /**
   * Construye el recordatorio preventivo de entrega para alquileres express por horas.
   */
  public static construirRecordatorioExpressWhatsApp(
    params: RecordatorioExpressParams
  ): EnlaceNotificacionResultado {
    const tel = this.sanitizarTelefonoColombia(params.clienteTelefono);
    const empresa = params.empresaNombre || 'Alquileres System';

    const lineasEquipos = params.items
      .map((it) => `• ${it.cantidad}x ${it.nombreEquipo}`)
      .join('\n');

    const mensaje = `Hola *${params.clienteNombre}*, te saludamos de *${empresa}* 🏗️.\n\n` +
      `Te recordamos cordialmente que tu contrato de *Alquiler Express #${params.alquilerConsecutivo}* ` +
      `(${params.horasPactadas}h contratadas) tiene programada su devolución para hoy a las *${params.horaDevolucionEstimada}*.\n\n` +
      `*Maquinaria en alquiler:*\n${lineasEquipos}\n\n` +
      `Por favor acércate a mostrador para la recepción de los equipos, o contáctanos de inmediato si requieres una prórroga de tiempo para evitar recargos por mora.\n\n` +
      `¡Gracias por confiar en nosotros! 🛠️`;

    const url = tel.valido
      ? `https://api.whatsapp.com/send?phone=${tel.telefonoE164}&text=${encodeURIComponent(mensaje)}`
      : '';

    return {
      url,
      mensaje,
      telefonoValido: tel.valido,
      telefonoE164: tel.telefonoE164,
    };
  }

  /**
   * Construye la alerta de mora y cálculo de horas excedidas para alquileres express.
   */
  public static construirAlertaMoraExpressWhatsApp(
    params: AlertaMoraExpressParams
  ): EnlaceNotificacionMoraResultado {
    const tel = this.sanitizarTelefonoColombia(params.clienteTelefono);
    const empresa = params.empresaNombre || 'Alquileres System';
    const tolerancia = params.minutosTolerancia ?? 15;

    const minEstimados = this.parsearHoraAMinutos(params.horaDevolucionEstimada);
    const minActuales = params.horaActual
      ? this.parsearHoraAMinutos(params.horaActual)
      : new Date().getHours() * 60 + new Date().getMinutes();

    let diferenciaMinutos = minActuales - minEstimados;
    if (diferenciaMinutos < 0) {
      // Ajuste para wrap-around de medianoche si aplica
      diferenciaMinutos += 24 * 60;
    }

    const minutosNetosMora = Math.max(0, diferenciaMinutos - tolerancia);
    const horasMora = minutosNetosMora > 0 ? Math.ceil(minutosNetosMora / 60) : 0;

    const tarifaPorHoraTotal = params.items.reduce(
      (acc, it) => acc + (it.tarifaHora || 0) * (it.cantidad || 1),
      0
    );
    const recargoEstimado = horasMora * tarifaPorHoraTotal;

    const lineasEquipos = params.items
      .map((it) => `• ${it.cantidad}x ${it.nombreEquipo}`)
      .join('\n');

    const mensaje = `Estimado(a) *${params.clienteNombre}*, de parte de *${empresa}* ⚠️.\n\n` +
      `Le informamos que el plazo pactado para la devolución de su *Alquiler Express #${params.alquilerConsecutivo}* ` +
      `venció a las *${params.horaDevolucionEstimada}*.\n\n` +
      `*Maquinaria pendiente por recibir:*\n${lineasEquipos}\n\n` +
      `A la fecha registra un tiempo adicional aproximado de *${horasMora} hora(s)* con un recargo estimado de *${this.formatearMonedaCOP(recargoEstimado)}*.\n\n` +
      `Le solicitamos acercarse de inmediato a nuestra bodega o responder a este mensaje para coordinar la entrega o formalizar la prórroga de su servicio.\n\n` +
      `Atentamente,\n*Equipo de Operaciones y Mostrador - ${empresa}*`;

    const url = tel.valido
      ? `https://api.whatsapp.com/send?phone=${tel.telefonoE164}&text=${encodeURIComponent(mensaje)}`
      : '';

    return {
      url,
      mensaje,
      telefonoValido: tel.valido,
      telefonoE164: tel.telefonoE164,
      horasMora,
      recargoEstimado,
    };
  }

  /**
   * Construye el mensaje de WhatsApp para notificación y extracto de cartera pendiente.
   */
  public static construirExtractoCarteraWhatsApp(
    params: ExtractoCarteraParams
  ): EnlaceNotificacionResultado {
    const tel = this.sanitizarTelefonoColombia(params.clienteTelefono);
    const empresa = params.empresaNombre || 'Alquileres System';
    const banco = params.cuentaBancariaInfo || 'Bancolombia Cta Ahorros No. 123-456789-01 (NIT 900.854.123-9)';

    const lineasContratos = params.contratos
      .map(
        (c) =>
          `📌 *Contrato #${c.consecutivo}*: ${this.formatearMonedaCOP(c.saldoPendiente)}\n   _${c.equiposResumen} (${c.fechaInicio} a ${c.fechaFin})_`
      )
      .join('\n\n');

    const mensaje = `Apreciado(a) *${params.clienteNombre}* (NIT/CC: ${params.clienteNit}), cordial saludo de *${empresa}* 📋.\n\n` +
      `Nos permitimos remitir el resumen consolidado de cartera y contratos de alquiler pendientes de pago:\n\n` +
      `${lineasContratos}\n\n` +
      `💰 *VALOR TOTAL ADEUDADO: ${this.formatearMonedaCOP(params.totalDeuda)}*\n\n` +
      `💳 *Datos para Consignación / Transferencia:*\n${banco}\n\n` +
      `Una vez realizado el pago, por favor compártanos el comprobante por este medio para registrarlo en el sistema y remitirle el paz y salvo.\n\n` +
      `Agradecemos su atención y quedamos a su entera disposición.`;

    const url = tel.valido
      ? `https://api.whatsapp.com/send?phone=${tel.telefonoE164}&text=${encodeURIComponent(mensaje)}`
      : '';

    return {
      url,
      mensaje,
      telefonoValido: tel.valido,
      telefonoE164: tel.telefonoE164,
    };
  }

  /**
   * Genera una plantilla de correo electrónico HTML corporativa para cobranza.
   */
  public static generarPlantillaEmailCobranza(
    params: ExtractoCarteraParams
  ): PlantillaEmailResultado {
    const empresa = params.empresaNombre || 'Alquileres System';
    const banco = params.cuentaBancariaInfo || 'Bancolombia Cta Ahorros No. 123-456789-01 (NIT 900.854.123-9)';
    const asunto = `[${empresa}] Estado de Cuenta y Cartera Pendiente - ${params.clienteNombre}`;

    const filasContratos = params.contratos
      .map(
        (c) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-weight: bold; color: #1e293b;">#${c.consecutivo}</td>
          <td style="padding: 10px 12px; color: #475569;">${c.equiposResumen}</td>
          <td style="padding: 10px 12px; text-align: center; color: #64748b;">${c.fechaInicio} ➔ ${c.fechaFin}</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #0f172a;">${this.formatearMonedaCOP(c.saldoPendiente)}</td>
        </tr>`
      )
      .join('');

    const cuerpoHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${asunto}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: #0f172a; padding: 24px; color: #ffffff; text-align: center;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">${empresa.toUpperCase()}</h2>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Plataforma Integral de Gestión de Alquileres y Cartera</p>
    </div>
    
    <div style="padding: 24px;">
      <p style="margin-top: 0; font-size: 15px; color: #1e293b;">
        Estimado(a) <strong>${params.clienteNombre}</strong> (NIT/C.C.: ${params.clienteNit}),
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #475569;">
        Nos permitimos remitirle el estado de cuenta oficial de sus contratos de alquiler vigentes y pendientes de pago en <strong>${empresa}</strong>.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left; color: #475569;">
            <th style="padding: 8px 12px;">Contrato</th>
            <th style="padding: 8px 12px;">Maquinaria / Equipos</th>
            <th style="padding: 8px 12px; text-align: center;">Período</th>
            <th style="padding: 8px 12px; text-align: right;">Saldo</th>
          </tr>
        </thead>
        <tbody>
          ${filasContratos}
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc;">
            <td colspan="3" style="padding: 12px; font-weight: bold; text-align: right; color: #1e293b; font-size: 14px;">Total Adeudado:</td>
            <td style="padding: 12px; font-weight: 800; text-align: right; color: #0284c7; font-size: 16px;">${this.formatearMonedaCOP(params.totalDeuda)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 16px; border-radius: 4px; margin: 20px 0;">
        <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #0f172a;">Información Bancaria para Pago:</h4>
        <p style="margin: 0; font-size: 13px; color: #334155; font-family: monospace;">${banco}</p>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748b;">
        Una vez efectuada la consignación o transferencia, agradecemos adjuntar el comprobante en respuesta a este correo o remitirlo vía WhatsApp para legalizar el descargo en su cuenta corriente.
      </p>
    </div>

    <div style="background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
      Este documento es un extracto informativo emitido automáticamente por Alquileres System.
    </div>
  </div>
</body>
</html>`;

    return {
      asunto,
      cuerpoHtml,
      destinatario: params.clienteEmail || '',
    };
  }
}

