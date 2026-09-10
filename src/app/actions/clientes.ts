'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';

export interface CrearClienteInput {
  nit_cedula: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  nivel_riesgo?: string;
  idempotency_key?: string;
}

const CrearClienteZodSchema = z.object({
  nit_cedula: z.string().min(3, 'El NIT o Cédula debe contener al menos 3 caracteres'),
  nombre: z.string().min(2, 'El nombre o razón social debe contener al menos 2 caracteres'),
  telefono: z.string().optional().nullable(),
  email: z.string().email('Formato de correo electrónico inválido').optional().nullable().or(z.literal('')),
  direccion: z.string().optional().nullable(),
  nivel_riesgo: z.string().optional().nullable(),
  idempotency_key: z.string().optional().nullable(),
}).passthrough();

const EditarClienteZodSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nit_cedula: z.string().min(3).optional().nullable(),
  nombre: z.string().min(2, 'El nombre o razón social debe contener al menos 2 caracteres'),
  telefono: z.string().optional().nullable(),
  email: z.string().email('Formato de correo electrónico inválido').optional().nullable().or(z.literal('')),
  direccion: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
}).passthrough();

export async function crearClienteAction(input: CrearClienteInput) {
  const validation = validateActionInput(input, CrearClienteZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de cliente inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('clientes')
    .insert([{
      nit_cedula: cleanInput.nit_cedula.trim().toUpperCase(),
      nombre: cleanInput.nombre.trim(),
      telefono: cleanInput.telefono?.trim() || '',
      email: cleanInput.email ? cleanInput.email.trim().toLowerCase() : '',
      direccion: cleanInput.direccion?.trim() || '',
      estado: 'Activo',
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // unique_violation
      return { success: false, error: `Error de restricción única: El NIT/Cédula "${cleanInput.nit_cedula}" ya fue registrado (Código: ${error.code})` };
    }
    console.error('Error Supabase crearClienteAction:', error);
    return { success: false, error: `Error al guardar cliente en BD: ${error.message}` };
  }

  if (redis) {
    try {
      await redis.del('cache:clientes');
    } catch (e) {
      console.warn('Error invalidando caché de clientes en Redis:', e);
    }
  }

  // Registrar Evento de Auditoría
  AuditLogger.logAsync({
    modulo: 'CLIENTES',
    accion: 'CREAR_CLIENTE',
    descripcion: `Nuevo cliente registrado: ${cleanInput.nombre} (NIT/Cédula: ${cleanInput.nit_cedula})`,
    entidadId: data?.id || cleanInput.nit_cedula,
    detalles: {
      nit_cedula: cleanInput.nit_cedula,
      nombre: cleanInput.nombre,
      telefono: cleanInput.telefono,
      email: cleanInput.email,
    },
  });

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
  const validation = validateActionInput(input, EditarClienteZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de cliente inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const numericId = typeof cleanInput.id === 'string' ? parseInt(cleanInput.id, 10) : cleanInput.id;

  const updatePayload: any = {
    nombre: cleanInput.nombre.trim(),
    telefono: cleanInput.telefono?.trim() || '',
    email: cleanInput.email ? cleanInput.email.trim().toLowerCase() : '',
    direccion: cleanInput.direccion?.trim() || '',
    updated_at: new Date().toISOString()
  };

  if (cleanInput.nit_cedula) {
    updatePayload.nit_cedula = cleanInput.nit_cedula.trim().toUpperCase();
  }

  if (cleanInput.estado) {
    updatePayload.estado = cleanInput.estado;
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

  if (redis) {
    try {
      await redis.del('cache:clientes');
    } catch (e) {
      console.warn('Error invalidando caché de clientes en Redis:', e);
    }
  }

  // Registrar Evento de Auditoría
  AuditLogger.logAsync({
    modulo: 'CLIENTES',
    accion: 'EDITAR_CLIENTE',
    descripcion: `Cliente actualizado: ${cleanInput.nombre} (ID: ${numericId})`,
    entidadId: numericId,
    detalles: {
      id: numericId,
      nombre: cleanInput.nombre,
      nit_cedula: cleanInput.nit_cedula,
      estado: cleanInput.estado,
    },
  });

  revalidatePath('/clientes');
  return { success: true, data };
}

