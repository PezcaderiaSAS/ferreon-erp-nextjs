import { describe, it, expect } from 'vitest';
import {
  mapearAlquileresAFacturas,
  filtrarFacturas,
  calcularKPIsFacturacion,
  construirPayloadFacturaPDF,
  normalizarTexto,
  type FacturaUI,
} from '@/core/services/facturacion-transaccional.service';

describe('FacturacionTransaccionalService - Dominio y Finanzas (Alquileres System)', () => {
  const hoy = new Date();
  const fechaAyer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const fechaManana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const mockAlquileres = [
    {
      id: 'ALQ-001',
      consecutivo: 101,
      estado: 'ACTIVO',
      clienteNombre: 'Constructora Bolívar S.A.',
      created_at: '2026-09-01T10:00:00Z',
      fecha_vencimiento: fechaAyer, // Vencida
      total: 500000,
      total_pagado: 100000,
      saldo_pendiente: 400000,
      detalles: [
        {
          cantidad: 2,
          nombreItem: 'Andamio Tubular',
          dias_contratados: 10,
          tarifa_aplicada: 20000,
          subtotal_linea: 400000
        }
      ]
    },
    {
      id: 'ALQ-002',
      consecutivo: 102,
      estado: 'ACTIVO',
      clienteNombre: 'Ingeniería y Diseños Ltda.',
      created_at: '2026-09-10T10:00:00Z',
      fecha_vencimiento: fechaManana, // Pendiente (al día)
      total: 300000,
      total_pagado: 150000,
      saldo_pendiente: 150000,
      detalles: [
        {
          cantidad: 1,
          nombreItem: 'Mezcladora 2 Bultos',
          dias_contratados: 5,
          tarifa_aplicada: 60000,
          subtotal_linea: 300000
        }
      ]
    },
    {
      id: 'ALQ-003',
      consecutivo: 103,
      estado: 'FINALIZADO',
      clienteNombre: 'Carlos Pérez',
      created_at: '2026-09-05T10:00:00Z',
      fecha_vencimiento: fechaAyer,
      total: 200000,
      total_pagado: 200000,
      saldo_pendiente: 0, // Pagada
      detalles: []
    },
    {
      id: 'ALQ-004',
      consecutivo: 104,
      estado: 'CANCELADO', // Debe ser excluida
      clienteNombre: 'Anulado SAS',
      total: 100000,
      total_pagado: 0,
      saldo_pendiente: 100000,
    }
  ];

  it('1. Debe mapear alquileres a facturas excluyendo cancelados y ordenando cronológicamente', () => {
    const facturas = mapearAlquileresAFacturas(mockAlquileres);

    // ALQ-004 está CANCELADO, no debe figurar
    expect(facturas).toHaveLength(3);

    // Debe ordenar de más reciente a más antiguo según created_at: ALQ-002 (sep 10), ALQ-003 (sep 5), ALQ-001 (sep 1)
    expect(facturas[0].id).toBe('ALQ-002');
    expect(facturas[1].id).toBe('ALQ-003');
    expect(facturas[2].id).toBe('ALQ-001');

    // Verificar clasificación de estados
    expect(facturas.find(f => f.id === 'ALQ-001')?.estado).toBe('Vencida');
    expect(facturas.find(f => f.id === 'ALQ-002')?.estado).toBe('Pendiente');
    expect(facturas.find(f => f.id === 'ALQ-003')?.estado).toBe('Pagada');
  });

  it('2. Debe manejar datos nulos o vacíos sin lanzar excepciones', () => {
    expect(mapearAlquileresAFacturas([])).toEqual([]);
    expect(mapearAlquileresAFacturas(null as any)).toEqual([]);
    expect(mapearAlquileresAFacturas(undefined as any)).toEqual([]);
  });

  it('3. Debe normalizar texto e ignorar mayúsculas y acentos al filtrar facturas', () => {
    const facturas = mapearAlquileresAFacturas(mockAlquileres);

    // Búsqueda con acento y minúsculas ("bolívar")
    const resAcento = filtrarFacturas(facturas, 'Todas', 'bolivar');
    expect(resAcento).toHaveLength(1);
    expect(resAcento[0].cliente).toBe('Constructora Bolívar S.A.');

    // Búsqueda por número de contrato/factura
    const resId = filtrarFacturas(facturas, 'Todas', '002');
    expect(resId).toHaveLength(1);
    expect(resId[0].id).toBe('ALQ-002');

    // Filtro por estado
    const resVencidas = filtrarFacturas(facturas, 'Vencidas', '');
    expect(resVencidas).toHaveLength(1);
    expect(resVencidas[0].estado).toBe('Vencida');

    const resPagadas = filtrarFacturas(facturas, 'Pagadas', '');
    expect(resPagadas).toHaveLength(1);
    expect(resPagadas[0].estado).toBe('Pagada');
  });

  it('4. Debe calcular con exactitud los KPIs de facturación y cartera', () => {
    const facturas = mapearAlquileresAFacturas(mockAlquileres);
    const kpis = calcularKPIsFacturacion(facturas);

    // Ingresos totales = 100.000 + 150.000 + 200.000 = 450.000
    expect(kpis.ingresosMes).toBe(450000);

    // Por cobrar (Pendientes) = 150.000
    expect(kpis.porCobrar).toBe(150000);

    // Vencido (Vencidas) = 400.000
    expect(kpis.vencido).toBe(400000);
  });

  it('5. Debe construir el payload para factura oficial PDF con todos los campos calculados', () => {
    const facturas = mapearAlquileresAFacturas(mockAlquileres);
    const factura = facturas.find(f => f.id === 'ALQ-001')!;

    const empresaMock = {
      razonSocial: 'FerreOn ERP SAS',
      nit: '900.888.777-1',
      telefono: '6017654321',
    };

    const payload = construirPayloadFacturaPDF(factura, empresaMock);

    expect(payload.tipo).toBe('FACTURA');
    expect(payload.consecutivo).toBe('ALQ-001');
    expect(payload.clienteNombre).toBe('Constructora Bolívar S.A.');
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].nombre).toBe('Andamio Tubular');
    expect(payload.items[0].dias).toBe(10);
    expect(payload.totalPagar).toBe(500000);
    expect(payload.saldoPendiente).toBe(400000);
    expect(payload.empresa.razonSocial).toBe('FerreOn ERP SAS');
  });
});
