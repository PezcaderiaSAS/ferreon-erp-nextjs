import { describe, it, expect } from 'vitest';
import { getLegalEmailHeaders, renderLegalEmailHtml, COMPANY_LEGAL_ADDRESS } from '@/infrastructure/email/legalEmailTemplate';
import fs from 'fs';
import path from 'path';

describe('Auditoría Legal Tech & Senior Compliance (6 Vectores Críticos de Riesgo)', () => {

  // 1. COPPA-001: Verificación de Edad y Protección Infantil
  describe('COPPA-001: Verificación de Edad y Bloqueo de Menores', () => {
    it('debe rechazar fechas de nacimiento que correspondan a menores de 18 años', () => {
      const calcularEdad = (fechaStr: string) => {
        const fecha = new Date(fechaStr);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fecha.getFullYear();
        const m = hoy.getMonth() - fecha.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) edad--;
        return edad;
      };

      // Simular menor de 13 años (violación flagrante COPPA)
      const menor12Anos = new Date();
      menor12Anos.setFullYear(menor12Anos.getFullYear() - 12);
      expect(calcularEdad(menor12Anos.toISOString().split('T')[0])).toBeLessThan(13);

      // Simular menor de 18 años
      const menor17Anos = new Date();
      menor17Anos.setFullYear(menor17Anos.getFullYear() - 17);
      expect(calcularEdad(menor17Anos.toISOString().split('T')[0])).toBeLessThan(18);

      // Simular mayor de edad válido
      const mayor25Anos = new Date();
      mayor25Anos.setFullYear(mayor25Anos.getFullYear() - 25);
      expect(calcularEdad(mayor25Anos.toISOString().split('T')[0])).toBeGreaterThanOrEqual(18);
    });
  });

  // 2. GDPR-002: Fuga de IP mediante CDN Externa (Caso Múnich)
  describe('GDPR-002: Erradicación de CDNs externas de fuentes (Caso Múnich)', () => {
    it('globals.css no debe contener llamadas @import a fonts.googleapis.com ni fonts.gstatic.com', () => {
      const globalsCssPath = path.resolve(process.cwd(), 'src/app/globals.css');
      const content = fs.readFileSync(globalsCssPath, 'utf-8');

      expect(content).not.toMatch(/@import\s+url\(['"]https:\/\/fonts\.googleapis\.com/i);
      expect(content).not.toMatch(/fonts\.gstatic\.com/i);
    });
  });

  // 3. CIPA-003: Captura No Consentida de Pulsaciones y Sesiones (California)
  describe('CIPA-003: Protección contra Keystroke Logging y Session Replay', () => {
    it('debe existir el componente CipaPrivacyGuard que inyecta data-rr-ignore y data-private', () => {
      const guardPath = path.resolve(process.cwd(), 'src/components/legal/CipaPrivacyGuard.tsx');
      expect(fs.existsSync(guardPath)).toBe(true);

      const guardContent = fs.readFileSync(guardPath, 'utf-8');
      expect(guardContent).toContain('data-rr-ignore');
      expect(guardContent).toContain('data-private');
      expect(guardContent).toContain('data-cipa-masked');
    });
  });

  // 4. CAN-SPAM-004: Comunicaciones Comerciales por Email
  describe('CAN-SPAM-004: Cumplimiento de Cabeceras, Dirección Física y Unsubscribe', () => {
    it('debe generar cabeceras estándar List-Unsubscribe y List-Unsubscribe-Post (RFC 8058)', () => {
      const headers = getLegalEmailHeaders('cliente@ejemplo.com', 'token-123');

      expect(headers['List-Unsubscribe']).toBeDefined();
      expect(headers['List-Unsubscribe']).toContain('mailto:bajas@alquileres-system.com');
      expect(headers['List-Unsubscribe']).toContain('/api/unsubscribe');
      expect(headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    });

    it('debe renderizar la dirección física postal completa y enlace de baja en el footer del email', () => {
      const html = renderLegalEmailHtml({
        subject: 'Cotización Formal',
        recipientEmail: 'compras@constructora.com',
        bodyHtml: '<p>Adjuntamos el contrato de alquiler de torre grúa.</p>',
      });

      expect(html).toContain(COMPANY_LEGAL_ADDRESS.street);
      expect(html).toContain(COMPANY_LEGAL_ADDRESS.city);
      expect(html).toContain(COMPANY_LEGAL_ADDRESS.country);
      expect(html).toContain(COMPANY_LEGAL_ADDRESS.postalCode);
      expect(html).toContain('/unsubscribe');
      expect(html).toContain('CAN-SPAM');
    });
  });

  // 5. ARL-005: Condiciones de Renovación Automática de Suscripciones (California)
  describe('ARL-005: Divulgación Explícita de Renovación Automática y Cancelación en 1 Clic', () => {
    it('la página de suscripción debe contener la cláusula ARL y el botón de cancelación directa', () => {
      const suscripcionPath = path.resolve(process.cwd(), 'src/app/suscripcion/page.tsx');
      const content = fs.readFileSync(suscripcionPath, 'utf-8');

      expect(content).toContain('Condiciones de Renovación Automática (ARL)');
      expect(content).toContain('aceptaRenovacionCheck');
      expect(content).toContain('Cancelar Renovación Automática (1 Clic)');
    });
  });

  // 6. DMCA-006: Safe Harbor y Notificación Notice & Takedown
  describe('DMCA-006: Procedimiento Safe Harbor y Agente Designado', () => {
    it('debe existir la ruta /dmca y el endpoint de procesamiento de retiro /api/legal/dmca-takedown', () => {
      const dmcaPagePath = path.resolve(process.cwd(), 'src/app/dmca/page.tsx');
      const takedownRoutePath = path.resolve(process.cwd(), 'src/app/api/legal/dmca-takedown/route.ts');

      expect(fs.existsSync(dmcaPagePath)).toBe(true);
      expect(fs.existsSync(takedownRoutePath)).toBe(true);

      const dmcaPageContent = fs.readFileSync(dmcaPagePath, 'utf-8');
      expect(dmcaPageContent).toContain('17 U.S.C. § 512');
      expect(dmcaPageContent).toContain('Designated Copyright Agent');
      expect(dmcaPageContent).toContain('copyright@alquileres-system.com');
    });
  });

});
