'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CrearEquipoInput {
  sku: string;
  nombre: string;
  categoria: string;
  tarifaDiaria: number;
  stockInicial: number;
  idempotency_key: string;
}

export async function crearEquipoAction(input: CrearEquipoInput) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('equipos')
    .insert([{
      sku: input.sku,
      codigo: input.sku, // Para compatibilidad
      nombre: input.nombre,
      categoria: input.categoria,
      tarifa_diaria: input.tarifaDiaria,
      stock_total: input.stockInicial,
      stock_disponible: input.stockInicial,
      stock_en_obra: 0,
      estado: 'Disponible',
      idempotency_key: input.idempotency_key
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Error de restricción única: Este SKU o llave ya fue registrada (Código: ${error.code})`);
    }
    throw new Error(`Error al guardar equipo en BD: ${error.message}`);
  }

  revalidatePath('/bodega');
  return data;
}
