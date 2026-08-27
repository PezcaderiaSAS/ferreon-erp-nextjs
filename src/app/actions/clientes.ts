'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CrearClienteInput {
  nit_cedula: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  nivel_riesgo: string;
  idempotency_key: string;
}

export async function crearClienteAction(input: CrearClienteInput) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('clientes')
    .insert([{
      nit_cedula: input.nit_cedula,
      nombre: input.nombre,
      telefono: input.telefono || '',
      email: input.email || '',
      direccion: input.direccion || '',
      nivel_riesgo: input.nivel_riesgo,
      activo: true,
      idempotency_key: input.idempotency_key
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // unique_violation
      // This means the idempotency key was already used, or the nit_cedula already exists
      throw new Error(`Error de restricción única: Posible duplicado de registro (Código: ${error.code})`);
    }
    throw new Error(`Error al guardar cliente en BD: ${error.message}`);
  }

  revalidatePath('/clientes');
  return data;
}
