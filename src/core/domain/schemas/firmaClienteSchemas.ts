import { z } from 'zod';

export const GuardarFirmaClienteInputSchema = z.object({
  alquilerId: z.union([z.string().min(1), z.number().int().positive()], {
    required_error: 'El ID del alquiler es obligatorio.',
  }),
  firmaBase64: z
    .string({ required_error: 'La firma en Base64 es requerida.' })
    .min(20, 'Firma Base64 demasiado corta.')
    .regex(/^data:image\/(png|webp);base64,/i, 'La firma debe ser una imagen PNG o WebP en formato Data URI.')
    .max(500 * 1024, 'La firma excede el límite máximo de 500 KB.'),
  clienteNombre: z.string().optional(),
  clienteNit: z.string().optional(),
});

export type GuardarFirmaClienteInput = z.infer<typeof GuardarFirmaClienteInputSchema>;
