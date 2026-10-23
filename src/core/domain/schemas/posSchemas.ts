import { z } from 'zod';

// ============================================================================
// ESQUEMAS DE VALIDACIÓN ZOD PARA OPERACIONES POS (SPEC-010)
// Centralizados fuera de directivas 'use server' para cumplimiento estricto
// del compilador de Next.js App Router (solo exportar funciones async en actions).
// ============================================================================

// 1. Ajuste de Stock
export const AjustarStockEquipoZodSchema = z.object({
  equipoId: z.union([z.string(), z.number()]),
  delta: z.coerce.number().refine((val) => val !== 0, 'El ajuste de stock (delta) no puede ser cero.'),
  motivo: z.string().min(1, 'El motivo del ajuste es obligatorio para auditoría y trazabilidad en Kardex.').default('Ajuste Manual'),
  tipoMovimiento: z.string().default('AJUSTE_AUDITORIA'),
  idempotencyKey: z.string().optional().nullable(),
}).passthrough();

// 2. Conversión de Cotización a POS
export const ConvertirCotizacionPosZodSchema = z.object({
  cotizacionId: z.union([z.string(), z.number()]).refine((val) => Boolean(val), 'ID de cotización requerido'),
  montoDeposito: z.coerce.number().min(0, 'El depósito debe ser mayor o igual a 0').optional().default(0),
  metodoPago: z.string().optional().default('EFECTIVO'),
  nuevaFechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD inválido').optional().nullable(),
  detallesLogistica: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
});

// 3. Crear Alquiler Rápido POS
export const ClienteNuevoPosZodSchema = z.object({
  nit_cedula: z.string().optional().nullable(),
  nombre: z.string().min(2, 'El nombre del cliente debe tener al menos 2 caracteres'),
  telefono: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  direccion: z.string().optional().nullable(),
});

export const ModoCobroDiasZodSchema = z.enum([
  'CALENDARIO',
  'HABILES_LUNES_VIERNES',
  'HABILES_LUNES_SABADO',
]);

export const ItemPosZodSchema = z.object({
  equipoId: z.union([z.string(), z.number()]),
  cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
  tarifaAplicada: z.coerce.number().min(0, 'La tarifa debe ser mayor o igual a cero'),
  diasCobro: z.coerce.number().int().min(1).default(1),
  subtotalLinea: z.coerce.number().min(0).optional(),
  fechaInicio: z.string().optional().nullable(),
  fechaFinEstimada: z.string().optional().nullable(),
});

export const CrearAlquilerRapidoPosZodSchema = z.object({
  clienteId: z.union([z.string(), z.number()]).optional().nullable(),
  clienteNuevo: ClienteNuevoPosZodSchema.optional().nullable(),
  items: z.array(ItemPosZodSchema).min(1, 'Debe incluir al menos un equipo en el alquiler POS'),
  modoCobroDias: ModoCobroDiasZodSchema.default('CALENDARIO').optional(),
  diasCobrables: z.coerce.number().int().min(0).optional(),
  deposito: z.coerce.number().min(0).default(0),
  fleteEntrega: z.coerce.number().min(0).default(0),
  fleteRecogida: z.coerce.number().min(0).default(0),
  garantiaMonto: z.coerce.number().min(0).default(0),
  garantiaTipo: z.string().default('Efectivo'),
  observaciones: z.string().optional().nullable(),
  detallesLogistica: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
}).refine((data) => data.clienteId || data.clienteNuevo, {
  message: 'Debe especificar un cliente existente o los datos del cliente nuevo',
  path: ['clienteId'],
});

// 4. Adendas de Contrato
export interface ItemAdendaInput {
  equipoId: string | number;
  nombreItem?: string;
  cantidad: number;
  tarifaAplicada: number;
  diasCobro: number;
  subtotalLinea?: number;
  fechaInicio?: string;
  fechaFinEstimada?: string;
  esSubcontratado?: boolean | null;
}

export interface GenerarAdendaContratoInput {
  alquilerId: string | number;
  motivo?: 'PRORROGA' | 'ADICION_EQUIPOS' | 'RETIRO_EQUIPOS' | 'AJUSTE_TARIFA' | 'MODIFICACION_MIXTA' | string;
  diasAdicionales?: number;
  montoDepositoAdicional?: number;
  metodoPago?: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'NEQUI' | 'DAVIPLATA' | string;
  observaciones?: string;
  items: ItemAdendaInput[];
}

export const ItemAdendaSchema = z.object({
  equipoId: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  nombreItem: z.string().optional(),
  cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  tarifaAplicada: z.coerce.number().min(0, 'La tarifa no puede ser negativa'),
  diasCobro: z.coerce.number().int().positive('Los días deben ser al menos 1'),
  subtotalLinea: z.coerce.number().min(0).optional(),
  fechaInicio: z.string().optional().nullable(),
  fechaFinEstimada: z.string().optional().nullable(),
  esSubcontratado: z.boolean().nullable().optional().default(false),
});

export const GenerarAdendaContratoZodSchema = z.object({
  alquilerId: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  motivo: z.string().min(2).default('MODIFICACION_MIXTA'),
  diasAdicionales: z.coerce.number().int().min(0).default(0),
  montoDepositoAdicional: z.coerce.number().min(0).default(0),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'NEQUI', 'DAVIPLATA']).default('EFECTIVO'),
  observaciones: z.string().optional().nullable().default(''),
  items: z.array(ItemAdendaSchema).min(1, 'La adenda debe incluir al menos una línea de equipo'),
});

// 5. Devolución POS e Inspección
export interface ItemDevolucionPosInput {
  detalleId: string | number;
  cantidadDevuelta: number;
  semaforo?: 'VERDE_BUENO' | 'AMARILLO_SUCIO' | 'NARANJA_DANADO' | 'ROJO_PERDIDA' | string;
  costoLimpieza?: number;
  costoReparacion?: number;
  valorReposicion?: number;
  descripcionDano?: string;
  desgloseAverias?: any[];
}

export interface ProcesarDevolucionPosInput {
  alquilerId: string | number;
  metodoPago?: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'NEQUI' | 'DAVIPLATA' | string;
  sesionCajaId?: string | null;
  observaciones?: string;
  items: ItemDevolucionPosInput[];
}

export const ItemDevolucionPosZodSchema = z.object({
  detalleId: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  cantidadDevuelta: z.coerce.number().int().positive('La cantidad a devolver debe ser mayor a 0'),
  semaforo: z.enum(['VERDE_BUENO', 'AMARILLO_SUCIO', 'NARANJA_DANADO', 'ROJO_PERDIDA']).default('VERDE_BUENO'),
  costoLimpieza: z.coerce.number().min(0).default(0),
  costoReparacion: z.coerce.number().min(0).default(0),
  valorReposicion: z.coerce.number().min(0).default(0),
  descripcionDano: z.string().optional().nullable().default(''),
  desgloseAverias: z.array(z.any()).optional().default([]),
});

export const ProcesarDevolucionPosZodSchema = z.object({
  alquilerId: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'NEQUI', 'DAVIPLATA']).default('EFECTIVO'),
  sesionCajaId: z.string().uuid().optional().nullable(),
  observaciones: z.string().optional().nullable().default('Inspección de Devolución POS'),
  items: z.array(ItemDevolucionPosZodSchema).min(1, 'Debe incluir al menos un equipo para procesar devolución'),
});
