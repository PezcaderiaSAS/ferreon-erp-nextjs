import { describe, it, expect } from 'vitest';
import { AlquilerHorasService } from '@/core/services/alquiler-horas.service';
import { sanitizarYOrdenarLineas } from '@/components/pdf/ContratoAlquilerPDF';

describe('SPEC-015: Integración Documental (Ticket & Contrato PDF en Alquiler Express por Horas)', () => {
  it('detecta correctamente la modalidad de horas express desde unidadTiempo o desde observaciones', () => {
    const alquilerConUnidad = {
      id: 101,
      unidadTiempo: 'HORAS',
      horaEntrega: '08:30',
      horaDevolucionEstimada: '12:30',
    };

    const meta1 = AlquilerHorasService.extraerMetadataExpress(alquilerConUnidad);
    expect(meta1.esExpress).toBe(true);
    expect(meta1.horaDespacho).toBe('08:30');

    const alquilerConObs = {
      id: 102,
      observaciones: 'Despacho POS [ALQUILER EXPRESS POR HORAS | 4h | Despacho: 08:30 -> Retorno Estimado: 12:30]',
    };

    const meta2 = AlquilerHorasService.extraerMetadataExpress(alquilerConObs);
    expect(meta2.esExpress).toBe(true);
    expect(meta2.horas).toBe(4);
    expect(meta2.horaDespacho).toBe('08:30');
    expect(meta2.horaDevolucion).toBe('12:30');
  });

  it('calcula la hora límite de retorno coherente para el documento soporte y contrato', () => {
    const horaSalida = '09:15';
    const horasPactadas = 4;
    const horaRetorno12 = AlquilerHorasService.proyectarHoraRetorno(horaSalida, horasPactadas, '12h');
    const horaRetorno24 = AlquilerHorasService.proyectarHoraRetorno(horaSalida, horasPactadas, '24h');

    expect(horaRetorno12).toBe('01:15 PM');
    expect(horaRetorno24).toBe('13:15');
  });

  it('calcula subtotales exactos de líneas por horas para impresión de ticket térmico', () => {
    const tarifaDia = 80000;
    const tarifaHora = AlquilerHorasService.calcularTarifaHora(tarifaDia, 20); // 12000 COP
    const cantidad = 2;
    const horas = 4;

    const subtotalLinea = AlquilerHorasService.calcularSubtotalItem(tarifaDia, horas, cantidad, 20);
    expect(subtotalLinea).toBe(96000);
    expect(subtotalLinea).toBe(cantidad * tarifaHora * horas);
  });

  it('sanitizarYOrdenarLineas asigna la duracion correcta en horas (no 1 dia) a contratos express', () => {
    const rawItems = [
      {
        equipoId: 10,
        nombre: 'Taladro Percutor Bosch',
        cantidad: 2,
        tarifaAplicada: 12000, // Tarifa/hora calculada
        duracion: 4,           // 4 horas
        subtotal: 96000,
        fechaInicio: '2026-11-03',
        fechaFinEstimada: '2026-11-03',
      }
    ];

    const lineas = sanitizarYOrdenarLineas(rawItems, '2026-11-03', {
      esPorHoras: true,
      horasPorDefecto: 4,
    });

    expect(lineas).toHaveLength(1);
    expect(lineas[0].dias).toBe(4); // Debe ser 4 horas, no 1 día
    expect(lineas[0].tarifaDiaria).toBe(12000);
    expect(lineas[0].subtotal).toBe(96000);
  });

  it('resuelve duracion en horas desde el contrato padre si los detalles de BD no tienen duracion explicita', () => {
    const rawItemsFromDb = [
      {
        equipo_id: 25,
        nombre: 'Pulidora Industrial 9"',
        cantidad: 1,
        tarifa_aplicada: 15000,
        dias_contratados: 1, // Guardado como 1 en BD
        subtotal_linea: 60000, // 4 horas * 15.000 = 60.000
        fecha_inicio: '2026-11-03',
        fecha_fin: '2026-11-03',
      }
    ];

    const lineas = sanitizarYOrdenarLineas(rawItemsFromDb, '2026-11-03', {
      esPorHoras: true,
      horasPorDefecto: 4,
    });

    expect(lineas[0].dias).toBe(4);
    expect(lineas[0].subtotal).toBe(60000);
  });
});
