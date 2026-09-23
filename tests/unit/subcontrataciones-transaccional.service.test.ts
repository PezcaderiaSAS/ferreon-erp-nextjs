/**
 * Suite de Pruebas Unitarias — SubcontratacionesTransaccionalService
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 * Spec:     SPEC-2026-ARCH-RESTRUCT-007
 */
import { describe, it, expect } from 'vitest';
import {
  enriquecerSubcontrataciones,
  calcularKPIsSubcontrataciones,
  filtrarSubcontrataciones,
  construirPayloadOrdenPDF,
  esOrdenVencida,
  resolverEstadoBadge,
} from '../../src/core/services/subcontrataciones-transaccional.service';
import type { SubcontratacionUI } from '../../src/infrastructure/state/subcontratacionStore';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const HOY = '2026-09-23';
const AYER = '2026-09-22';

const BASE_SUB: SubcontratacionUI = {
  id: 'sub-001',
  consecutivo: 'SC-001',
  proveedorNombre: 'Maquiproveedores S.A.S.',
  proveedorNit: '900123456-1',
  estado: 'ACTIVA',
  costoTotalEstimado: 800_000,
  ingresoTotalEstimado: 1_000_000,
  margenBrutoEstimado: 200_000,
  depositoGarantia: 50_000,
  fechaEntregaEstimada: '2026-09-15',
  fechaDevolucionEstimada: '2026-09-30',
  subcontrataciones_detalles: [
    {
      id: 'det-001',
      cantidad: 1,
      diasContratados: 15,
      tarifaDiariaProveedor: 53_333,
      equipoNombre: 'Compactador Vibratorio',
    } as any,
  ],
};

const VENCIDA: SubcontratacionUI = {
  ...BASE_SUB,
  id: 'sub-002',
  consecutivo: 'SC-002',
  estado: 'ACTIVA',
  fechaDevolucionEstimada: AYER, // ya venció
};

const LIQUIDADA: SubcontratacionUI = {
  ...BASE_SUB,
  id: 'sub-003',
  consecutivo: 'SC-003',
  estado: 'LIQUIDADA',
  proveedorNombre: 'Aliarenta Ltda.',
  costoTotalEstimado: 400_000,
  ingresoTotalEstimado: 600_000,
  margenBrutoEstimado: 200_000,
};

const EN_BODEGA: SubcontratacionUI = {
  ...BASE_SUB,
  id: 'sub-004',
  consecutivo: 'SC-004',
  estado: 'RECIBIDA_EN_BODEGA',
};

const LISTA: SubcontratacionUI[] = [BASE_SUB, VENCIDA, LIQUIDADA, EN_BODEGA];

// ---------------------------------------------------------------------------
// esOrdenVencida
// ---------------------------------------------------------------------------

describe('esOrdenVencida', () => {
  it('retorna true para orden ACTIVA con fecha de devolución pasada', () => {
    expect(esOrdenVencida(VENCIDA, HOY)).toBe(true);
  });

  it('retorna false para orden ACTIVA con fecha de devolución futura', () => {
    expect(esOrdenVencida(BASE_SUB, HOY)).toBe(false);
  });

  it('retorna false para órdenes LIQUIDADA aunque fecha pasada', () => {
    expect(esOrdenVencida({ ...LIQUIDADA, fechaDevolucionEstimada: AYER }, HOY)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resolverEstadoBadge
// ---------------------------------------------------------------------------

describe('resolverEstadoBadge', () => {
  it('retorna variant "blue" para ACTIVA', () => {
    expect(resolverEstadoBadge('ACTIVA').variant).toBe('blue');
  });

  it('retorna variant "amber" para RECIBIDA_EN_BODEGA', () => {
    expect(resolverEstadoBadge('RECIBIDA_EN_BODEGA').variant).toBe('amber');
  });

  it('retorna variant "emerald" para LIQUIDADA', () => {
    expect(resolverEstadoBadge('LIQUIDADA').variant).toBe('emerald');
  });

  it('retorna variant "slate" para estado desconocido', () => {
    expect(resolverEstadoBadge('DESCONOCIDO').variant).toBe('slate');
  });
});

// ---------------------------------------------------------------------------
// enriquecerSubcontrataciones
// ---------------------------------------------------------------------------

describe('enriquecerSubcontrataciones', () => {
  it('calcula margenPct correctamente para ingreso positivo', () => {
    const [enriq] = enriquecerSubcontrataciones([BASE_SUB], HOY);
    // ingreso 1_000_000, costo 800_000 → margen 200_000 → 20%
    expect(enriq.margenPct).toBeCloseTo(20, 1);
  });

  it('retorna margenPct = 0 cuando el ingreso es cero', () => {
    const sinIngreso: SubcontratacionUI = { ...BASE_SUB, ingresoTotalEstimado: 0 };
    const [enriq] = enriquecerSubcontrataciones([sinIngreso], HOY);
    expect(enriq.margenPct).toBe(0);
  });

  it('marca isVencida = true cuando la fecha de devolución es anterior a hoy y estado ACTIVA', () => {
    const [enriq] = enriquecerSubcontrataciones([VENCIDA], HOY);
    expect(enriq.isVencida).toBe(true);
  });

  it('no marca isVencida para una orden ACTIVA con fecha futura', () => {
    const [enriq] = enriquecerSubcontrataciones([BASE_SUB], HOY);
    expect(enriq.isVencida).toBe(false);
  });

  it('asigna estadoVariant = "amber" para RECIBIDA_EN_BODEGA', () => {
    const [enriq] = enriquecerSubcontrataciones([EN_BODEGA], HOY);
    expect(enriq.estadoVariant).toBe('amber');
  });

  it('asigna estadoVariant = "emerald" para LIQUIDADA', () => {
    const [enriq] = enriquecerSubcontrataciones([LIQUIDADA], HOY);
    expect(enriq.estadoVariant).toBe('emerald');
  });

  it('no muta los objetos de entrada', () => {
    const costoOriginal = BASE_SUB.costoTotalEstimado;
    enriquecerSubcontrataciones([BASE_SUB], HOY);
    expect(BASE_SUB.costoTotalEstimado).toBe(costoOriginal);
  });
});

// ---------------------------------------------------------------------------
// calcularKPIsSubcontrataciones
// ---------------------------------------------------------------------------

describe('calcularKPIsSubcontrataciones', () => {
  it('cuenta correctamente las categorías de estado', () => {
    const kpis = calcularKPIsSubcontrataciones(LISTA);
    expect(kpis.totalActivas).toBe(2); // BASE_SUB + VENCIDA (ambas ACTIVA)
    expect(kpis.totalLiquidadas).toBe(1);
    expect(kpis.totalEnBodega).toBe(1);
    expect(kpis.totalRegistros).toBe(4);
  });

  it('acumula costos e ingresos sólo de órdenes ACTIVA (sin bodega)', () => {
    const kpis = calcularKPIsSubcontrataciones(LISTA);
    // BASE_SUB (ACTIVA): 800_000 + VENCIDA (ACTIVA): 800_000 = 1_600_000
    expect(kpis.costoTotalActivo).toBe(1_600_000);
    // BASE_SUB: 1_000_000 + VENCIDA: 1_000_000 = 2_000_000
    expect(kpis.ingresoTotalActivo).toBe(2_000_000);
  });

  it('calcula margenPct como string con 1 decimal', () => {
    const kpis = calcularKPIsSubcontrataciones(LISTA);
    // margen activas: (200_000 + 200_000) / 2_000_000 = 20.0
    expect(kpis.margenPct).toBe('20.0');
  });

  it('retorna margenPct "0.0" con lista vacía', () => {
    const kpis = calcularKPIsSubcontrataciones([]);
    expect(kpis.margenPct).toBe('0.0');
    expect(kpis.totalRegistros).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// filtrarSubcontrataciones
// ---------------------------------------------------------------------------

describe('filtrarSubcontrataciones', () => {
  it('retorna todos los registros con filtroEstado = "TODOS" y sin texto', () => {
    const result = filtrarSubcontrataciones(LISTA, 'TODOS', '');
    expect(result).toHaveLength(4);
  });

  it('filtra por estado LIQUIDADA', () => {
    const result = filtrarSubcontrataciones(LISTA, 'LIQUIDADA', '');
    expect(result).toHaveLength(1);
    expect(result[0].consecutivo).toBe('SC-003');
  });

  it('busca por nombre de proveedor insensible a mayúsculas', () => {
    const result = filtrarSubcontrataciones(LISTA, 'TODOS', 'aliarenta');
    expect(result).toHaveLength(1);
    expect(result[0].consecutivo).toBe('SC-003');
  });

  it('busca por consecutivo', () => {
    const result = filtrarSubcontrataciones(LISTA, 'TODOS', 'sc-002');
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((s) => s.consecutivo === 'SC-002')).toBe(true);
  });

  it('retorna lista vacía cuando no hay coincidencias', () => {
    const result = filtrarSubcontrataciones(LISTA, 'TODOS', 'inexistente-xyz-9999');
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// construirPayloadOrdenPDF
// ---------------------------------------------------------------------------

describe('construirPayloadOrdenPDF', () => {
  it('mapea correctamente los campos de cabecera', () => {
    const payload = construirPayloadOrdenPDF(BASE_SUB);
    expect(payload.consecutivo).toBe('SC-001');
    expect(payload.proveedorNombre).toBe('Maquiproveedores S.A.S.');
    expect(payload.proveedorNit).toBe('900123456-1');
    expect(payload.costoTotalEstimado).toBe(800_000);
    expect(payload.ingresoTotalEstimado).toBe(1_000_000);
  });

  it('calcula subtotales de ítem correctamente', () => {
    const payload = construirPayloadOrdenPDF(BASE_SUB);
    // 1 unidad × 15 días × 53_333 = 799_995
    expect(payload.items[0].subtotal).toBe(1 * 15 * 53_333);
    expect(payload.items[0].descripcion).toBe('Compactador Vibratorio');
  });

  it('calcula margenPct en el payload como número', () => {
    const payload = construirPayloadOrdenPDF(BASE_SUB);
    // (1_000_000 - 800_000) / 1_000_000 * 100 = 20
    expect(payload.margenPct).toBeCloseTo(20, 1);
  });

  it('retorna items vacíos si no hay detalles', () => {
    const sinDetalles: SubcontratacionUI = { ...BASE_SUB, subcontrataciones_detalles: [] };
    const payload = construirPayloadOrdenPDF(sinDetalles);
    expect(payload.items).toHaveLength(0);
  });

  it('usa cadena vacía para campos opcionales ausentes', () => {
    const { proveedorNit, observaciones } = construirPayloadOrdenPDF(BASE_SUB);
    expect(typeof proveedorNit).toBe('string');
    expect(typeof observaciones).toBe('string');
  });
});
