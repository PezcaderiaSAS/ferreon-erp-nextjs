import { describe, it, expect } from 'vitest';
import { sanitizarYOrdenarLineas, LineaAlquilerPDFProcesada } from '../../src/components/pdf/ContratoAlquilerPDF';

describe('Motor PDF de Alquileres - sanitizarYOrdenarLineas (SPEC-2026-WMS-CONCURRENT-RENTALS-001 / TAREA-06)', () => {
  it('debe ordenar cronológicamente las líneas por fechaInicio ascendente', () => {
    const rawItems = [
      {
        linea_numero: 2,
        equipo_id: 'EQ-02',
        nombreItem: 'Andamio Tubular',
        fecha_inicio: '2026-10-15',
        fecha_fin: '2026-10-25',
        cantidad: 5,
        tarifa_aplicada: 5000,
      },
      {
        linea_numero: 1,
        equipo_id: 'EQ-01',
        nombreItem: 'Mezcladora Trompo',
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-10-10',
        cantidad: 1,
        tarifa_aplicada: 45000,
      },
      {
        linea_numero: 3,
        equipo_id: 'EQ-03',
        nombreItem: 'Vibrador Gasolina',
        fecha_inicio: '2026-10-05',
        fecha_fin: '2026-10-12',
        cantidad: 2,
        tarifa_aplicada: 25000,
      },
    ];

    const procesadas = sanitizarYOrdenarLineas(rawItems);

    expect(procesadas).toHaveLength(3);
    // El primero debe ser el 2026-10-01 (Mezcladora)
    expect(procesadas[0].nombre).toContain('Mezcladora Trompo');
    expect(procesadas[0].fechaInicioRaw).toBe('2026-10-01');

    // El segundo debe ser el 2026-10-05 (Vibrador)
    expect(procesadas[1].nombre).toContain('Vibrador Gasolina');
    expect(procesadas[1].fechaInicioRaw).toBe('2026-10-05');

    // El tercero debe ser el 2026-10-15 (Andamio)
    expect(procesadas[2].nombre).toContain('Andamio Tubular');
    expect(procesadas[2].fechaInicioRaw).toBe('2026-10-15');
  });

  it('debe desempatar por nombre y número de línea si dos ítems inician en la misma fecha', () => {
    const rawItems = [
      {
        linea_numero: 2,
        equipo_id: 'EQ-B',
        nombre: 'Vibrador Eléctrico',
        fechaInicio: '2026-10-01',
        fechaFin: '2026-10-05',
        cantidad: 1,
        tarifaDiaria: 30000,
      },
      {
        linea_numero: 1,
        equipo_id: 'EQ-A',
        nombre: 'Cortadora de Pavimento',
        fechaInicio: '2026-10-01',
        fechaFin: '2026-10-05',
        cantidad: 1,
        tarifaDiaria: 60000,
      },
    ];

    const procesadas = sanitizarYOrdenarLineas(rawItems);

    expect(procesadas).toHaveLength(2);
    // 'Cortadora...' debe ir antes que 'Vibrador...' por orden alfabético
    expect(procesadas[0].nombre).toContain('Cortadora de Pavimento');
    expect(procesadas[1].nombre).toContain('Vibrador Eléctrico');
  });

  it('debe procesar líneas segmentadas con tarifas y subtotales personalizados', () => {
    const rawItems = [
      {
        linea_numero: 1,
        equipo_id: 'EQ-01',
        nombre: 'Torre de Iluminación',
        fechaInicio: '2026-11-01',
        fechaFin: '2026-11-05',
        cantidad: 2,
        dias: 4,
        tarifaDiaria: 80000,
        tarifaPersonalizada: true,
        subtotal: 640000, // 2 * 80000 * 4
        subtotalPersonalizado: false,
      },
      {
        linea_numero: 2,
        equipo_id: 'EQ-01',
        nombre: 'Torre de Iluminación',
        fechaInicio: '2026-11-06',
        fechaFin: '2026-11-10',
        cantidad: 2,
        dias: 4,
        tarifaDiaria: 70000,
        tarifaPersonalizada: true,
        subtotal: 500000, // Descuento especial pactado
        subtotalPersonalizado: true,
        esSubcontratado: true,
      },
    ];

    const procesadas = sanitizarYOrdenarLineas(rawItems);

    expect(procesadas).toHaveLength(2);
    expect(procesadas[0].tarifaPersonalizada).toBe(true);
    expect(procesadas[0].subtotalPersonalizado).toBe(false);

    expect(procesadas[1].subtotalPersonalizado).toBe(true);
    expect(procesadas[1].subtotal).toBe(500000);
    expect(procesadas[1].esSubcontratado).toBe(true);
    expect(procesadas[1].nombre).toContain('[Re-Rent]');
  });

  it('debe aislar defensivamente filas corruptas sin hacer crashear el motor PDF', () => {
    // Fila corrupta que arroja excepción forzada o valores incongruentes
    const corruptItem = {
      linea_numero: 'invalido',
      equipo_id: null,
      nombre: null,
      get fecha_inicio() {
        throw new Error('Fecha con corrupción binaria');
      },
    };

    const validItem = {
      linea_numero: 1,
      equipo_id: 'EQ-VALID',
      nombre: 'Taladro Percutor',
      fechaInicio: '2026-10-01',
      fechaFin: '2026-10-03',
      cantidad: 1,
      tarifaDiaria: 20000,
    };

    const procesadas = sanitizarYOrdenarLineas([corruptItem, validItem]);

    expect(procesadas).toHaveLength(2);
    const filaCorrupta = procesadas.find((p) => p.isCorrupt);
    const filaValida = procesadas.find((p) => !p.isCorrupt);

    expect(filaCorrupta).toBeDefined();
    expect(filaCorrupta?.isCorrupt).toBe(true);
    expect(filaCorrupta?.nombre).toContain('[INCONSISTENCIA EN LÍNEA');
    expect(filaCorrupta?.errorMessage).toContain('Fecha con corrupción binaria');

    expect(filaValida).toBeDefined();
    expect(filaValida?.isCorrupt).toBe(false);
    expect(filaValida?.nombre).toContain('Taladro Percutor');
  });
});
