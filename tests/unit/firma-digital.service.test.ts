import { describe, it, expect } from 'vitest';
import { FirmaDigitalService } from '@/core/services/firma-digital.service';

describe('FirmaDigitalService (TDD Dominio Puro)', () => {
  const pngValidoMinimo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const webpValidoMinimo = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';

  describe('validarFirmaBase64', () => {
    it('debe rechazar firmas vacías o nulas', () => {
      expect(FirmaDigitalService.validarFirmaBase64('')).toEqual({
        valida: false,
        error: 'La firma no puede estar vacía.',
      });
      expect(FirmaDigitalService.validarFirmaBase64(null as any)).toEqual({
        valida: false,
        error: 'La firma no puede estar vacía.',
      });
      expect(FirmaDigitalService.validarFirmaBase64(undefined as any)).toEqual({
        valida: false,
        error: 'La firma no puede estar vacía.',
      });
    });

    it('debe rechazar cadenas que no tengan prefijo data URI válido de PNG o WebP', () => {
      const invalido = 'data:text/plain;base64,SG9sYSBNdW5kbw==';
      const res = FirmaDigitalService.validarFirmaBase64(invalido);
      expect(res.valida).toBe(false);
      expect(res.error).toContain('Formato de imagen no soportado');
    });

    it('debe rechazar firmas con payload base64 sospechosamente corto (canvas en blanco)', () => {
      const muyCorta = 'data:image/png;base64,AAAA';
      const res = FirmaDigitalService.validarFirmaBase64(muyCorta);
      expect(res.valida).toBe(false);
      expect(res.error).toContain('Trazo de firma insuficiente');
    });

    it('debe rechazar firmas que superen el tamaño máximo permitido (500 KB)', () => {
      // 600 KB ficticios en base64
      const enorme = 'data:image/png;base64,' + 'A'.repeat(700 * 1024);
      const res = FirmaDigitalService.validarFirmaBase64(enorme);
      expect(res.valida).toBe(false);
      expect(res.error).toContain('excede el límite');
    });

    it('debe aceptar un Data URL de PNG válido y retornar el tamaño estimado en bytes', () => {
      const res = FirmaDigitalService.validarFirmaBase64(pngValidoMinimo);
      expect(res.valida).toBe(true);
      expect(res.error).toBeUndefined();
      expect(res.bytesAprox).toBeGreaterThan(0);
      expect(res.formato).toBe('png');
    });

    it('debe aceptar un Data URL de WebP válido', () => {
      const res = FirmaDigitalService.validarFirmaBase64(webpValidoMinimo);
      expect(res.valida).toBe(true);
      expect(res.formato).toBe('webp');
    });
  });

  describe('generarEstampaLegalCliente', () => {
    it('debe incluir el nombre del cliente, identificación y leyenda de equivalencia funcional', () => {
      const fechaFija = new Date('2026-10-23T14:30:00.000Z');
      const estampa = FirmaDigitalService.generarEstampaLegalCliente(
        'Ingeniería y Construcciones SAS',
        '901.456.789-1',
        fechaFija
      );

      expect(estampa).toContain('Ingeniería y Construcciones SAS');
      expect(estampa).toContain('901.456.789-1');
      expect(estampa).toContain('Ley 527 de 1999');
      expect(estampa).toContain('Firma digital touch');
    });

    it('debe utilizar valores por defecto seguros si los datos están ausentes', () => {
      const estampa = FirmaDigitalService.generarEstampaLegalCliente('', '');
      expect(estampa).toContain('CLIENTE / ARRENDATARIO');
      expect(estampa).toContain('S/N');
    });
  });

  describe('formatearFechaLegal', () => {
    it('debe retornar fecha con formato legible colombiano', () => {
      const fecha = new Date(2026, 9, 23, 10, 15, 30); // 23 de octubre de 2026, 10:15:30
      const texto = FirmaDigitalService.formatearFechaLegal(fecha);
      expect(texto).toContain('2026');
      expect(texto).toContain('10:15');
    });
  });
});
