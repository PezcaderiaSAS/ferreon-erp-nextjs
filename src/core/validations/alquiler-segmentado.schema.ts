import { z } from 'zod';

/**
 * Esquema de Validación Zod para Líneas de Alquiler Segmentadas y Concurrentes
 * ID: SPEC-2026-WMS-CONCURRENT-RENTALS-001
 */
export const AlquilerItemSegmentadoSchema = z.object({
  lineaNumero: z.coerce.number().int().min(1, 'El número de línea debe ser mayor o igual a 1').default(1),
  itemId: z.union([z.string().min(1, 'El ID del equipo es obligatorio'), z.number().int().positive()]),
  nombreItem: z.string().optional().nullable(),
  cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser de al menos 1 unidad'),
  tarifaAplicada: z.coerce.number().min(0, 'La tarifa unitaria pactada no puede ser negativa'),
  tarifaPersonalizada: z.boolean().default(false),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha de inicio inválido (YYYY-MM-DD)'),
  fechaFinEstimada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha fin estimada inválido (YYYY-MM-DD)'),
  diasContratados: z.coerce.number().int().min(1, 'Debe contratarse por al menos 1 día'),
  subtotalLinea: z.coerce.number().min(0, 'El subtotal de la línea no puede ser negativo'),
  subtotalPersonalizado: z.boolean().default(false),
  esSubcontratado: z.boolean().optional().nullable().default(false),
  proveedorSubcontratadoId: z.string().uuid().optional().nullable(),
  costoDiarioProveedor: z.coerce.number().min(0).optional().nullable(),
}).refine((data) => {
  const inicio = new Date(`${data.fechaInicio}T00:00:00Z`).getTime();
  const fin = new Date(`${data.fechaFinEstimada}T00:00:00Z`).getTime();
  return fin >= inicio;
}, {
  message: 'La fecha de fin estimada debe ser igual o posterior a la fecha de inicio',
  path: ['fechaFinEstimada'],
});

export const ContratoSegmentadoZodSchema = z.object({
  clienteId: z.union([z.string().min(1, 'Debe seleccionar un cliente'), z.number().int().positive()]),
  clienteNombre: z.string().optional().nullable(),
  fechaRegistro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  fleteEntrega: z.coerce.number().min(0, 'El flete de entrega no puede ser negativo').default(0),
  fleteRecogida: z.coerce.number().min(0, 'El flete de recogida no puede ser negativo').default(0),
  deposito: z.coerce.number().min(0, 'El anticipo o depósito no puede ser negativo').default(0),
  garantiaMonto: z.coerce.number().min(0).default(0),
  garantiaTipo: z.string().default('Efectivo'),
  observaciones: z.string().max(1000, 'Las observaciones no pueden exceder 1000 caracteres').optional().nullable(),
  detallesLogistica: z.string().max(1000).optional().nullable(),
  estado: z.enum(['BORRADOR', 'COTIZACION', 'ACTIVO', 'ACTIVO_EN_OBRA']).default('ACTIVO'),
  idempotency_key: z.string().optional().nullable(),
  items: z.array(AlquilerItemSegmentadoSchema).min(1, 'El contrato debe incluir al menos una línea de equipo'),
}).passthrough();

export type AlquilerItemSegmentadoInput = z.infer<typeof AlquilerItemSegmentadoSchema>;
export type ContratoSegmentadoInput = z.infer<typeof ContratoSegmentadoZodSchema>;
