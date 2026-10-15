import { describe, it, expect } from 'vitest';
import {
  formatearFechaLocal,
  formatearHoraLocal,
  resolverFechaYHoraDocumento,
  parsearFechaLocal,
  calcularDiasEntreFechas,
} from '../fechas';

describe('Utilidades de Fecha y Hora (fechas.ts) - Zona Horaria Colombia', () => {
  it('formatearFechaLocal formatea fechas ISO a formato colombiano DD/MM/YYYY', () => {
    expect(formatearFechaLocal('2026-10-09')).toBe('09/10/2026');
    expect(formatearFechaLocal('2026-10-09T11:00:00Z')).toBe('09/10/2026');
  });

  it('formatearHoraLocal formatea horas simples en formato 12 horas con AM/PM', () => {
    const hora = formatearHoraLocal('07:00');
    expect(hora).toMatch(/07:00\s*AM/i);

    const horaTarde = formatearHoraLocal('17:30');
    expect(horaTarde).toMatch(/05:30\s*PM/i);
  });

  it('formatearHoraLocal respeta la zona horaria America/Bogota (UTC-5) para timestamps UTC', () => {
    // 11:00:00 UTC es exactamente 06:00:00 en Bogotá (UTC-5)
    const timestampUtc = '2026-10-09T11:00:00.000Z';
    const hora = formatearHoraLocal(timestampUtc);
    expect(hora).toMatch(/06:00\s*AM/i);
  });

  it('resolverFechaYHoraDocumento extrae fecha y hora correctamente de payloads con timestamp', () => {
    const payload = {
      fechaEmision: '2026-10-09T11:30:00.000Z',
    };
    const res = resolverFechaYHoraDocumento(payload);
    expect(res.fecha).toBe('09/10/2026');
    expect(res.hora).toMatch(/06:30\s*AM/i);
  });

  it('resolverFechaYHoraDocumento utiliza created_at cuando fechaEmision no tiene hora', () => {
    const payload = {
      fechaEmision: '2026-10-09',
      created_at: '2026-10-09T15:45:00.000Z', // 10:45 AM en Bogotá
    };
    const res = resolverFechaYHoraDocumento(payload);
    expect(res.fecha).toBe('09/10/2026');
    expect(res.hora).toMatch(/10:45\s*AM/i);
  });

  it('resolverFechaYHoraDocumento respeta horaEmision explícita', () => {
    const payload = {
      fechaEmision: '2026-10-09',
      horaEmision: '08:15',
    };
    const res = resolverFechaYHoraDocumento(payload);
    expect(res.fecha).toBe('09/10/2026');
    expect(res.hora).toMatch(/08:15\s*AM/i);
  });

  it('calcularDiasEntreFechas calcula de forma determinística los días entre fechas', () => {
    expect(calcularDiasEntreFechas('2026-10-01', '2026-10-05')).toBe(4);
    expect(calcularDiasEntreFechas('2026-10-01', '2026-10-01')).toBe(1);
  });
});
