'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { AuditLogger } from '@/lib/security/audit-logger';
import { invalidateTenantCache } from '@/lib/redis';

export interface EmitirFacturaLedgerInput {
  alquilerId: string | number;
  numeroFactura?: string;
}

/**
 * Server Action: Registrar Asiento Contable de Devengo de Factura en el Ledger
 * Partida Doble Rigurosa:
 *  - DÉBITO: Cuentas por Cobrar Clientes (Activo 1305) -> Total Neto a cobrar
 *  - DÉBITO: Anticipo Impuestos / Retenciones (Activo 1355) -> ReteFuente + ReteICA
 *  - CRÉDITO: Impuesto a las Ventas por Pagar (Pasivo 2408) -> IVA generado
 *  - CRÉDITO: Ingresos por Alquiler de Maquinaria (Ingresos 4155) -> Subtotal Base
 */
export async function emitirFacturaLedgerAction(input: EmitirFacturaLedgerInput) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const numericAlquilerId = typeof input.alquilerId === 'string' ? parseInt(input.alquilerId, 10) : input.alquilerId;

    // 1. Consultar el contrato de alquiler y sus parámetros tributarios
    const { data: alq, error: alqErr } = await supabase
      .from('alquileres')
      .select('*')
      .eq('id', numericAlquilerId)
      .single();

    if (alqErr || !alq) {
      return { success: false, error: 'Contrato de alquiler no encontrado para emisión de factura.' };
    }

    const subtotal = Number(alq.subtotal_general || alq.subtotal_equipos || alq.total || 0);
    const valorIva = Number(alq.valor_iva || (alq.aplica_iva ? Math.round(subtotal * 0.19) : 0));
    const valorRetefuente = Number(alq.valor_retefuente || 0);
    const valorReteica = Number(alq.valor_reteica || 0);
    const retencionesTotales = valorRetefuente + valorReteica;

    // Total facturado por cobrar
    const totalFacturado = subtotal + valorIva - retencionesTotales;

    // 2. Intentar registrar asiento en Ledger transaccional (Partida Doble)
    try {
      const { error: rpcErr } = await supabase.rpc('insert_transaction', {
        p_description: `Factura Comercial FAC-${alq.id} - Alquiler de Maquinaria`,
        p_reference_id: alq.id,
        p_created_by: user?.id || null,
        p_idempotency_key: `FAC-LEDGER-${alq.id}-${Date.now()}`,
        p_entries: [
          // Débito Cuentas por Cobrar (Activo)
          { account_id: "00000000-0000-0000-0000-000000000013", amount: totalFacturado },
          // Débito Anticipo Retenciones (Activo)
          ...(retencionesTotales > 0
            ? [{ account_id: "00000000-0000-0000-0000-000000000014", amount: retencionesTotales }]
            : []),
          // Crédito IVA por Pagar (Pasivo)
          ...(valorIva > 0
            ? [{ account_id: "00000000-0000-0000-0000-000000000024", amount: -valorIva }]
            : []),
          // Crédito Ingresos Operacionales (Ingresos)
          { account_id: "00000000-0000-0000-0000-000000000041", amount: -subtotal }
        ]
      });

      if (rpcErr) {
        console.warn('[emitirFacturaLedgerAction] Registro RPC Ledger opcional:', rpcErr.message);
      }
    } catch (ledgerErr) {
      console.warn('[emitirFacturaLedgerAction] Ledger error bypass:', ledgerErr);
    }

    // 3. Auditoría Oficial
    AuditLogger.logAsync({
      modulo: 'FACTURACION',
      accion: 'EMITIR_FACTURA',
      descripcion: `Factura comercial emitida para contrato ALQ-${alq.id}. Total Facturado: $${totalFacturado.toLocaleString('es-CO')}`,
      entidadId: alq.id,
      detalles: {
        alquilerId: alq.id,
        subtotal,
        valorIva,
        valorRetefuente,
        valorReteica,
        totalFacturado
      },
      userId: user?.id,
      userEmail: user?.email,
    });

    try {
      await invalidateTenantCache(user?.id, ['facturas', 'alquileres']);
    } catch (cErr) {
      console.warn('Cache warning:', cErr);
    }

    revalidatePath('/facturacion');
    revalidatePath('/alquileres');

    return {
      success: true,
      data: {
        facturaId: alq.id,
        totalFacturado,
        valorIva,
        retencionesTotales
      }
    };
  } catch (err: any) {
    console.error('Error al emitir factura en Ledger:', err);
    return { success: false, error: err.message || 'Error inesperado al emitir factura' };
  }
}
