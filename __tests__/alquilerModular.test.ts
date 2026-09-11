import { describe, it, expect } from 'vitest';
import { alquilerSchema } from '../src/components/forms/alquiler/types';

describe('Módulo Modular de Alquiler: Validaciones y Esquema', () => {
  it('Debe rechazar formulario sin clienteId o sin ítems', () => {
    const res = alquilerSchema.safeParse({
      clienteId: '',
      fechaRegistro: '2026-09-11',
      fleteEntrega: 0,
      fleteRecogida: 0,
      deposito: 0,
      garantiaMonto: 0,
      garantiaTipo: 'Efectivo',
      items: []
    });

    expect(res.success).toBe(false);
  });

  it('Debe validar exitosamente un contrato con cliente e ítems válidos', () => {
    const res = alquilerSchema.safeParse({
      clienteId: 'cli_123',
      fechaRegistro: '2026-09-11',
      fechaInicioContrato: '2026-09-11',
      fechaFinEstimadaContrato: '2026-09-15',
      fleteEntrega: 30000,
      fleteRecogida: 30000,
      deposito: 50000,
      garantiaMonto: 300000,
      garantiaTipo: 'Efectivo',
      items: [
        {
          itemId: 'eq_001',
          cantidad: 2,
          precioDiario: 45000,
          fechaInicio: '2026-09-11',
          fechaFinEstimada: '2026-09-15'
        }
      ]
    });

    expect(res.success).toBe(true);
  });
});
