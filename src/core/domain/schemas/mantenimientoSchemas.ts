import { z } from 'zod';

export const RegistrarMantenimientoZodSchema = z.object({
  equipoId: z.union([z.string(), z.number()]),
  cantidad: z.coerce.number().int().min(0, 'La cantidad no puede ser negativa').default(1),
  observaciones: z.string().min(3, 'Las observaciones técnicas deben tener al menos 3 caracteres'),
  costoInsumos: z.coerce.number().min(0, 'El costo no puede ser negativo').optional().default(0),
  tecnicoResponsable: z.string().optional().default('Técnico de Taller'),
  reiniciarHorometro: z.boolean().optional().default(true),
  reiniciarDias: z.boolean().optional().default(true),
  idempotencyKey: z.string().optional().nullable(),
}).passthrough();

export type RegistrarMantenimientoInput = z.infer<typeof RegistrarMantenimientoZodSchema>;
