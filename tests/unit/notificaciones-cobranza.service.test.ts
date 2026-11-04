import { describe, it, expect } from 'vitest';
import {
  NotificacionesCobranzaService,
  RecordatorioExpressParams,
  AlertaMoraExpressParams,
  ExtractoCarteraParams,
} from '../../src/core/services/notificaciones-cobranza.service';

describe('NotificacionesCobranzaService - Dominio Puro TDD (SPEC-017)', () => {
  describe('1. Sanitización de Teléfonos para Colombia (+57)', () => {
    it('debe normalizar un celular estándar colombiano de 10 dígitos', () => {
      const res = NotificacionesCobranzaService.sanitizarTelefonoColombia('3157894512');
      expect(res.valido).toBe(true);
      expect(res.telefonoE164).toBe('573157894512');
      expect(res.telefonoFormateado).toBe('+57 315 789 4512');
    });

    it('debe limpiar caracteres especiales, espacios, guiones y paréntesis', () => {
      const res = NotificacionesCobranzaService.sanitizarTelefonoColombia('+57 (310) 456-7890');
      expect(res.valido).toBe(true);
      expect(res.telefonoE164).toBe('573104567890');
      expect(res.telefonoFormateado).toBe('+57 310 456 7890');
    });

    it('debe rechazar números con longitud insuficiente o inválidos', () => {
      const resCorto = NotificacionesCobranzaService.sanitizarTelefonoColombia('12345');
      expect(resCorto.valido).toBe(false);
      expect(resCorto.error).toBeDefined();

      const resVacio = NotificacionesCobranzaService.sanitizarTelefonoColombia('');
      expect(resVacio.valido).toBe(false);
      expect(resVacio.error).toBeDefined();
    });
  });

  describe('2. Recordatorio Preventivo Express por Horas (WhatsApp)', () => {
    const params: RecordatorioExpressParams = {
      clienteNombre: 'Carlos Rodríguez',
      clienteTelefono: '3157894512',
      alquilerConsecutivo: 'EXP-104',
      items: [
        { nombreEquipo: 'Rotomartillo SDS Max 11kg', cantidad: 1, tarifaHora: 15000 },
        { nombreEquipo: 'Andamio Plegable 1.5m', cantidad: 2, tarifaHora: 8000 },
      ],
      horasPactadas: 3,
      horaEntrega: '09:00 AM',
      horaDevolucionEstimada: '12:00 PM',
      empresaNombre: 'Alquileres System',
    };

    it('debe generar un enlace de WhatsApp codificado y mensaje educado', () => {
      const res = NotificacionesCobranzaService.construirRecordatorioExpressWhatsApp(params);
      expect(res.telefonoValido).toBe(true);
      expect(res.url).toContain('https://api.whatsapp.com/send?phone=573157894512&text=');
      expect(res.mensaje).toContain('Carlos Rodríguez');
      expect(res.mensaje).toContain('EXP-104');
      expect(res.mensaje).toContain('12:00 PM');
      expect(res.mensaje).toContain('Rotomartillo SDS Max 11kg');
      expect(res.mensaje).toContain('Alquileres System');
    });

    it('debe indicar si se requiere actualización de teléfono cuando el número es inválido', () => {
      const resInvalido = NotificacionesCobranzaService.construirRecordatorioExpressWhatsApp({
        ...params,
        clienteTelefono: 'invalido',
      });
      expect(resInvalido.telefonoValido).toBe(false);
      expect(resInvalido.url).toBe('');
      expect(resInvalido.mensaje).toBeDefined();
    });
  });

  describe('3. Alerta de Mora y Recargo en Alquiler Express', () => {
    const paramsMora: AlertaMoraExpressParams = {
      clienteNombre: 'Ing. Mauricio Gómez',
      clienteTelefono: '3124567890',
      alquilerConsecutivo: 'EXP-109',
      items: [
        { nombreEquipo: 'Placa Compactadora 90kg', cantidad: 1, tarifaHora: 20000 },
      ],
      horasPactadas: 2,
      horaEntrega: '08:00 AM',
      horaDevolucionEstimada: '10:00 AM',
      horaActual: '11:35 AM', // 1 hora y 35 min de retraso
      minutosTolerancia: 15,
      empresaNombre: 'Alquileres System',
    };

    it('debe calcular las horas de mora y el recargo estimado correctamente', () => {
      const res = NotificacionesCobranzaService.construirAlertaMoraExpressWhatsApp(paramsMora);
      expect(res.telefonoValido).toBe(true);
      expect(res.horasMora).toBe(2); // Redondeo por fracción superior a tolerancia
      expect(res.recargoEstimado).toBe(40000); // 2h * 20.000 COP
      expect(res.mensaje).toContain('EXP-109');
      expect(res.mensaje).toContain('10:00 AM');
      expect(res.mensaje).toContain('$ 40.000');
    });
  });

  describe('4. Extracto de Cartera y Cobranza Transaccional', () => {
    const extractoParams: ExtractoCarteraParams = {
      clienteNombre: 'Constructora del Oriente S.A.S.',
      clienteNit: '900.854.123-5',
      clienteTelefono: '3189998877',
      clienteEmail: 'contabilidad@constructoraoriente.com',
      contratos: [
        {
          consecutivo: 'CTR-042',
          fechaInicio: '2026-10-15',
          fechaFin: '2026-10-30',
          equiposResumen: '10 Cuerpos de Andamio Tubular',
          saldoPendiente: 450000,
        },
        {
          consecutivo: 'CTR-053',
          fechaInicio: '2026-10-25',
          fechaFin: '2026-11-02',
          equiposResumen: '1 Mezcladora de Concreto 2 Bultos',
          saldoPendiente: 320000,
        },
      ],
      totalDeuda: 770000,
      cuentaBancariaInfo: 'Bancolombia Cta Ahorros No. 123-456789-01 (NIT 900.854.123-9)',
      empresaNombre: 'Alquileres System',
    };

    it('debe consolidar contratos y saldo en mensaje de WhatsApp de cobranza', () => {
      const res = NotificacionesCobranzaService.construirExtractoCarteraWhatsApp(extractoParams);
      expect(res.telefonoValido).toBe(true);
      expect(res.mensaje).toContain('Constructora del Oriente S.A.S.');
      expect(res.mensaje).toContain('CTR-042');
      expect(res.mensaje).toContain('CTR-053');
      expect(res.mensaje).toContain('$ 770.000');
      expect(res.mensaje).toContain('Bancolombia');
      expect(res.url).toContain('https://api.whatsapp.com/send?phone=573189998877&text=');
    });

    it('debe generar la plantilla de correo HTML con formato corporativo', () => {
      const email = NotificacionesCobranzaService.generarPlantillaEmailCobranza(extractoParams);
      expect(email.destinatario).toBe('contabilidad@constructoraoriente.com');
      expect(email.asunto).toContain('Estado de Cuenta y Cartera Pendiente');
      expect(email.asunto).toContain('Constructora del Oriente S.A.S.');
      expect(email.cuerpoHtml).toContain('$ 770.000');
      expect(email.cuerpoHtml).toContain('CTR-042');
      expect(email.cuerpoHtml).toContain('CTR-053');
      expect(email.cuerpoHtml).toContain('Bancolombia');
    });
  });
});
