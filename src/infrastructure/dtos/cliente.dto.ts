import { z } from 'zod';

export const ClienteSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nit_cedula: z.string().optional().nullable(),
  nit: z.string().optional().nullable(),
  nombre: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  contacto: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  estado: z.string().nullable().optional(),
  nivel_riesgo: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  creado_en: z.string().nullable().optional()
}).transform((data) => {
  return {
    id: data.id,
    nitCedula: data.nit_cedula ?? data.nit ?? '',
    nit_cedula: data.nit_cedula ?? data.nit ?? '', // Retrocompatibilidad
    nit: data.nit ?? data.nit_cedula ?? '', // Retrocompatibilidad
    nombre: data.nombre ?? 'Cliente Sin Nombre',
    telefono: data.telefono ?? data.contacto ?? '',
    contacto: data.contacto ?? data.telefono ?? '', // Retrocompatibilidad
    email: data.email ?? '',
    direccion: data.direccion ?? '',
    estado: data.estado ?? 'Activo',
    nivelRiesgo: data.nivel_riesgo ?? 'Bajo',
    nivel_riesgo: data.nivel_riesgo ?? 'Bajo', // Retrocompatibilidad
    createdAt: data.created_at ?? data.creado_en ?? new Date().toISOString()
  };
});

export type ClienteDTO = z.infer<typeof ClienteSchema>;
