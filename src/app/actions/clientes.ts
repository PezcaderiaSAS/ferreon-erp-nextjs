'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CrearClienteInput {
  nit_cedula: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  nivel_riesgo?: string;
  idempotency_key?: string;
}

export async function crearClienteAction(input: CrearClienteInput) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('clientes')
    .insert([{
      nit_cedula: input.nit_cedula.trim().toUpperCase(),
      nombre: input.nombre.trim(),
      telefono: input.telefono?.trim() || '',
      email: input.email ? input.email.trim().toLowerCase() : '',
      direccion: input.direccion?.trim() || '',
      estado: 'Activo',
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // unique_violation
      return { success: false, error: `Error de restricción única: El NIT/Cédula "${input.nit_cedula}" ya fue registrado (Código: ${error.code})` };
    }
    console.error('Error Supabase crearClienteAction:', error);
    return { success: false, error: `Error al guardar cliente en BD: ${error.message}` };
  }

  revalidatePath('/clientes');
  return { success: true, data };
}

export interface EditarClienteInput {
  id: string | number;
  nit_cedula?: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado?: 'Activo' | 'Inactivo';
}

export async function editarClienteAction(input: EditarClienteInput) {
  const supabase = await createServerSupabaseClient();
  const numericId = typeof input.id === 'string' ? parseInt(input.id, 10) : input.id;

  const updatePayload: any = {
    nombre: input.nombre.trim(),
    telefono: input.telefono?.trim() || '',
    email: input.email ? input.email.trim().toLowerCase() : '',
    direccion: input.direccion?.trim() || '',
    updated_at: new Date().toISOString()
  };

  if (input.nit_cedula) {
    updatePayload.nit_cedula = input.nit_cedula.trim().toUpperCase();
  }

  if (input.estado) {
    updatePayload.estado = input.estado;
  }

  const { data, error } = await supabase
    .from('clientes')
    .update(updatePayload)
    .eq('id', numericId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: `Error de restricción única: El NIT/Cédula ya existe en otro cliente.` };
    }
    console.error('Error Supabase editarClienteAction:', error);
    return { success: false, error: `Error al actualizar cliente en BD: ${error.message}` };
  }

  revalidatePath('/clientes');
  return { success: true, data };
}

