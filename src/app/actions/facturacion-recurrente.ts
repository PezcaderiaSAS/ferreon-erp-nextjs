'use server';

import { createServerSupabaseClient, resolveEmpresaId } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { invalidateTenantCache } from '@/lib/redis';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';

export interface ItemCorteEmitir {
  nombre: string;
  cantidad: number;
  dias: number;
  tarifaDiaria: number;
  subtotal: number;
}

export interface EmitirCuentaCobroInput {
  alquilerId: number | string;
  tipoDocumento?: 'CUENTA_COBRO' | 'FACTURA_VENTA';
  fechaInicioPeriodo: string;
  fechaFinPeriodo: string;
  diasFacturables: number;
  subtotal: number;
  valorIva?: number;
  valorRetefuente?: number;
  valorReteica?: number;
  totalNeto: number;
  observaciones?: string;
  items: ItemCorteEmitir[];
}

const ItemCorteZodSchema = z.object({
  nombre: z.string().min(1),
  cantidad: z.coerce.number().min(1),
  dias: z.coerce.number().min(1),
  tarifaDiaria: z.coerce.number().min(0),
  subtotal: z.coerce.number().min(0),
});

const EmitirCuentaCobroZodSchema = z.object({
  alquilerId: z.union([z.string(), z.number()]),
  tipoDocumento: z.enum(['CUENTA_COBRO', 'FACTURA_VENTA']).default('CUENTA_COBRO'),
  fechaInicioPeriodo: z.string().min(8),
  fechaFinPeriodo: z.string().min(8),
  diasFacturables: z.coerce.number().min(1),
  subtotal: z.coerce.number().min(0),
  valorIva: z.coerce.number().min(0).default(0),
  valorRetefuente: z.coerce.number().min(0).default(0),
  valorReteica: z.coerce.number().min(0).default(0),
  totalNeto: z.coerce.number().min(0),
  observaciones: z.string().optional().nullable(),
  items: z.array(ItemCorteZodSchema).min(1),
}).passthrough();

/**
 * Server Action: Emitir Cuenta de Cobro / Factura Periódica de Obra
 */
export async function emitirCuentaCobroPeriodicaAction(input: EmitirCuentaCobroInput) {
  const validation = validateActionInput(input, EmitirCuentaCobroZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de corte inválidos' };
  }
  const clean = validation.data;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No autorizado. Debe iniciar sesión.' };
    }
    const empresaId = await resolveEmpresaId(user.id);
    const numericAlquilerId = typeof clean.alquilerId === 'string' ? parseInt(clean.alquilerId, 10) : clean.alquilerId;

    // 1. Validar el contrato de alquiler
    const { data: alq, error: alqErr } = await supabase
      .from('alquileres')
      .select('id, cliente_id, consecutivo, numero_contrato, cliente_nombre, estado')
      .eq('id', numericAlquilerId)
      .eq('empresa_id', empresaId)
      .single();

    if (alqErr || !alq) {
      return { success: false, error: 'Contrato de alquiler no encontrado.' };
    }

    // 2. Consecutivo correlativo
    const { count } = await supabase
      .from('facturas')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId);

    const siguienteNum = (count || 0) + 1;
    const prefijo = clean.tipoDocumento === 'FACTURA_VENTA' ? 'FAC-REC' : 'CC-PER';
    const consecutivoTexto = `${prefijo}-${String(siguienteNum).padStart(4, '0')}`;

    // 3. Empacar metadata del corte en observaciones JSON
    const metadataCorte = {
      consecutivoTexto,
      tipoDocumento: clean.tipoDocumento,
      periodo: {
        fechaInicio: clean.fechaInicioPeriodo,
        fechaFin: clean.fechaFinPeriodo,
        diasFacturables: clean.diasFacturables,
      },
      impuestos: {
        subtotal: clean.subtotal,
        valorIva: clean.valorIva,
        valorRetefuente: clean.valorRetefuente,
        valorReteica: clean.valorReteica,
        totalNeto: clean.totalNeto,
      },
      items: clean.items,
      observacionesUsuario: clean.observaciones || '',
      emitidoPor: user.email,
    };

    // 4. Inserción en tabla facturas
    const { data: factura, error: facErr } = await supabase
      .from('facturas')
      .insert([{
        alquiler_id: numericAlquilerId,
        cliente_id: alq.cliente_id || 1,
        empresa_id: empresaId,
        numero_consecutivo: siguienteNum,
        tipo_documento: clean.tipoDocumento,
        subtotal: clean.subtotal,
        total_pagar: clean.totalNeto,
        estado_pago: 'PENDIENTE',
        observaciones: JSON.stringify(metadataCorte),
      }])
      .select()
      .single();

    if (facErr) {
      console.error('Error insertando cuenta de cobro periódica:', facErr);
      return { success: false, error: `Error al persistir documento: ${facErr.message}` };
    }

    // 5. Auditoría Oficial
    AuditLogger.logAsync({
      modulo: 'FACTURACION',
      accion: 'EMITIR_FACTURA',
      descripcion: `${clean.tipoDocumento === 'FACTURA_VENTA' ? 'Factura Recurrente' : 'Cuenta de Cobro'} #${consecutivoTexto} emitida para contrato ALQ-${numericAlquilerId}. Total: $${clean.totalNeto.toLocaleString('es-CO')}`,
      entidadId: String(factura.id),
      detalles: {
        facturaId: factura.id,
        consecutivoTexto,
        alquilerId: numericAlquilerId,
        periodo: metadataCorte.periodo,
        totalNeto: clean.totalNeto,
      },
      userId: user.id,
      userEmail: user.email,
    });

    try {
      await invalidateTenantCache(user.id, ['facturas', 'alquileres']);
    } catch (cErr) {
      console.warn('Cache warning:', cErr);
    }

    revalidatePath('/facturacion');
    revalidatePath('/alquileres');

    return {
      success: true,
      data: {
        ...factura,
        consecutivoTexto,
      },
    };
  } catch (err: any) {
    console.error('Excepción en emitirCuentaCobroPeriodicaAction:', err);
    return { success: false, error: err.message || 'Error inesperado al emitir cuenta de cobro' };
  }
}

/**
 * Server Action: Obtener Historial de Cuentas de Cobro y Facturas Recurrentes
 */
export async function obtenerHistorialCuentasCobroAction() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: [], error: 'No autorizado' };
    }
    const empresaId = await resolveEmpresaId(user.id);

    const { data, error } = await supabase
      .from('facturas')
      .select(`
        *,
        alquileres (
          id,
          consecutivo,
          numero_contrato,
          cliente_nombre,
          obra_nombre,
          detallesLogistica,
          fecha_inicio,
          fecha_fin
        )
      `)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error consultando historial de facturas:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error('Excepción en obtenerHistorialCuentasCobroAction:', err);
    return { success: false, data: [], error: err.message };
  }
}
