import { z } from 'zod';

export const EquipoSchema = z.object({
  id: z.union([z.string(), z.number()]),
  codigo: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  nombre: z.string(),
  categoria: z.string(),
  tarifa_diaria: z.number().nullable().optional(),
  stock_total: z.number().nullable().optional(),
  stock_disponible: z.number().nullable().optional(),
  stock_en_obra: z.number().nullable().optional(),
  estado: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  creado_en: z.string().nullable().optional()
}).transform((data) => {
  // Aseguramos fallbacks para evitar nulos que rompan React
  const tarifaDiaria = data.tarifa_diaria ?? 0;
  const stockDisponible = data.stock_disponible ?? 0;
  const stockEnObra = data.stock_en_obra ?? 0;
  const stockTotal = data.stock_total ?? (stockDisponible + stockEnObra);
  
  // Transformar de snake_case a camelCase estándar
  return {
    id: data.id,
    codigo: data.sku ?? data.codigo ?? '', // Mantenemos codigo para compatibilidad con EquipoUI original
    sku: data.sku ?? data.codigo ?? '',
    nombre: data.nombre.toUpperCase(),
    categoria: data.categoria,
    tarifaDiaria,
    tarifa_diaria: tarifaDiaria, // Compatibilidad EquipoUI
    stockTotal,
    stock_total: stockTotal, // Compatibilidad EquipoUI
    stockDisponible,
    stock_disponible: stockDisponible, // Compatibilidad EquipoUI
    stockEnObra,
    stock_en_obra: stockEnObra, // Compatibilidad EquipoUI
    estado: data.estado ?? 'Disponible',
    createdAt: data.created_at ?? data.creado_en ?? new Date().toISOString()
  };
});

export type EquipoDTO = z.infer<typeof EquipoSchema>;
