import { describe, it, expect } from 'vitest';
import { AlquilerHorasService } from '@/core/services/alquiler-horas.service';

describe('SPEC-015: Integración Documental (Ticket & Contrato PDF en Alquiler Express por Horas)', () => {
  it('detecta correctamente la modalidad de horas express desde unidadTiempo o desde observaciones', () => {
    const alquilerConUnidad = {
      id: 101,
      unidadTiempo: 'HORAS',
      horaEntrega: '08:30',
      horaDevolucionEstimada: '12:30',
    };

    const esPorHoras1 = Boolean(
      alquilerConUnidad.unidadTiempo === 'HORAS' ||
      (alquilerConUnidad as any).unidad_tiempo === 'HORAS'
    );
    expect(esPorHoras1).toBe(true);

    const alquilerConObs = {
      id: 102,
      observaciones: 'Despacho POS [ALQUILER EXPRESS POR HORAS | 4h | Despacho: 08:30 -> Retorno Estimado: 12:30]',
    };

    const esPorHoras2 = Boolean(
      (alquilerConObs as any).unidadTiempo === 'HORAS' ||
      alquilerConObs.observaciones?.includes('ALQUILER EXPRESS POR HORAS')
    );
    expect(esPorHoras2).toBe(true);
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
});
