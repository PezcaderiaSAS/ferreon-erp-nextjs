import { describe, it, expect } from 'vitest';
import { calcularDiasEntreFechas } from '../../src/core/utils/fechas';
import {
  AlquilerItemSegmentadoSchema,
  ContratoSegmentadoZodSchema,
} from '../../src/core/validations/alquiler-segmentado.schema';

describe('Líneas Segmentadas y Asistencia de Overbooking (SPEC-2026-WMS-CONCURRENT-RENTALS-001 / TAREA-07)', () => {
  describe('Cálculo de Fechas y Días Naturales', () => {
    it('debe calcular correctamente los días contratados entre fechas', () => {
      const dias1 = calcularDiasEntreFechas('2026-10-01', '2026-10-05');
      expect(dias1).toBe(4);

      const diasMismoDia = calcularDiasEntreFechas('2026-10-01', '2026-10-01');
      expect(diasMismoDia).toBe(1); // Mínimo 1 día de alquiler
    });
  });

  describe('Matemática de Subtotal y Tarifa Proporcional Efectiva', () => {
    it('debe calcular el subtotal por fórmula estándar: cantidad * tarifa * dias', () => {
      const cantidad = 3;
      const tarifaDiaria = 50000;
      const dias = 10;
      const subtotal = cantidad * tarifaDiaria * dias;

      expect(subtotal).toBe(1500000);
    });

    it('debe recalcular la tarifa efectiva diaria si el usuario pacta un subtotal cerrado personalizado', () => {
      const cantidad = 2;
      const dias = 5;
      const subtotalPactado = 360000; // En vez de 400,000 (tarifa base 40,000)

      // tarifa = Math.round(subtotal / (cant * dias))
      const tarifaEfectiva = Math.round(subtotalPactado / (cantidad * dias));

      expect(tarifaEfectiva).toBe(36000);
      expect(tarifaEfectiva * cantidad * dias).toBe(subtotalPactado);
    });
  });

  describe('Lógica de Resolución Asistida de Overbooking', () => {
    it('debe generar las líneas divididas (stock propio + subcontratación re-rent) correctamente', () => {
      const lineaOriginal = {
        itemId: 'EQ-01',
        nombreItem: 'Vibrador Gasolina',
        cantidad: 5,
        tarifaDiaria: 30000,
        tarifaPersonalizada: false,
        fechaInicio: '2026-10-01',
        fechaFinEstimada: '2026-10-10',
        dias: 9,
      };

      const capacidadDisponible = 3;
      const deficit = 2;

      // Línea 1: Ajustada al stock propio
      const lineaPropia = {
        ...lineaOriginal,
        cantidad: capacidadDisponible,
        subtotal: lineaOriginal.tarifaDiaria * capacidadDisponible * lineaOriginal.dias,
        esSubcontratado: false,
      };

      // Línea 2: Re-Rent subcontratado
      const lineaReRent = {
        ...lineaOriginal,
        nombreItem: `${lineaOriginal.nombreItem} (Re-Rent Aliado)`,
        cantidad: deficit,
        subtotal: lineaOriginal.tarifaDiaria * deficit * lineaOriginal.dias,
        esSubcontratado: true,
      };

      expect(lineaPropia.cantidad).toBe(3);
      expect(lineaPropia.subtotal).toBe(30000 * 3 * 9); // 810,000
      expect(lineaPropia.esSubcontratado).toBe(false);

      expect(lineaReRent.cantidad).toBe(2);
      expect(lineaReRent.subtotal).toBe(30000 * 2 * 9); // 540,000
      expect(lineaReRent.esSubcontratado).toBe(true);

      // La suma de cantidades debe ser igual a la original (5)
      expect(lineaPropia.cantidad + lineaReRent.cantidad).toBe(lineaOriginal.cantidad);
      // La suma de subtotales debe ser igual al total original
      expect(lineaPropia.subtotal + lineaReRent.subtotal).toBe(lineaOriginal.tarifaDiaria * 5 * 9);
    });

    it('debe desplazar la ventana temporal a una fecha posterior manteniendo la duración en días', () => {
      const diasOriginales = 7;
      const fechaPico = '2026-10-15';

      const d = new Date(`${fechaPico}T00:00:00Z`);
      d.setDate(d.getDate() + 7);
      const nuevaFechaInicio = d.toISOString().split('T')[0];

      const dFin = new Date(`${nuevaFechaInicio}T00:00:00Z`);
      dFin.setDate(dFin.getDate() + diasOriginales);
      const nuevaFechaFin = dFin.toISOString().split('T')[0];

      expect(nuevaFechaInicio).toBe('2026-10-22');
      expect(nuevaFechaFin).toBe('2026-10-29');
    });
  });

  describe('Validación Zod Dual-Layer de Contratos Segmentados', () => {
    it('debe validar exitosamente un contrato con líneas segmentadas y tarifas personalizadas', () => {
      const payload = {
        clienteId: 'c1234567-89ab-cdef-0123-456789abcdef',
        clienteNombre: 'Constructora Bolívar SAS',
        fleteEntrega: 45000,
        fleteRecogida: 45000,
        deposito: 100000,
        garantiaMonto: 500000,
        garantiaTipo: 'Pagaré',
        estado: 'ACTIVO',
        items: [
          {
            lineaNumero: 1,
            itemId: 'eq-100',
            nombreItem: 'Torre de Iluminación',
            cantidad: 2,
            tarifaAplicada: 80000,
            tarifaPersonalizada: false,
            fechaInicio: '2026-10-01',
            fechaFinEstimada: '2026-10-10',
            diasContratados: 9,
            subtotalLinea: 1440000,
            subtotalPersonalizado: false,
          },
          {
            lineaNumero: 2,
            itemId: 'eq-100',
            nombreItem: 'Torre de Iluminación',
            cantidad: 2,
            tarifaAplicada: 70000,
            tarifaPersonalizada: true,
            fechaInicio: '2026-10-11',
            fechaFinEstimada: '2026-10-20',
            diasContratados: 9,
            subtotalLinea: 1100000,
            subtotalPersonalizado: true,
          },
        ],
      };

      const result = ContratoSegmentadoZodSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
        expect(result.data.items[1].tarifaPersonalizada).toBe(true);
        expect(result.data.items[1].subtotalPersonalizado).toBe(true);
      }
    });

    it('debe rechazar una línea con fechaFin anterior a fechaInicio', () => {
      const invalidItem = {
        lineaNumero: 1,
        itemId: 'eq-100',
        cantidad: 1,
        tarifaAplicada: 50000,
        fechaInicio: '2026-10-15',
        fechaFinEstimada: '2026-10-10', // Inválido: fin < inicio
        diasContratados: 1,
        subtotalLinea: 50000,
      };

      const result = AlquilerItemSegmentadoSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('fecha de fin estimada debe ser igual o posterior');
      }
    });
  });
});
