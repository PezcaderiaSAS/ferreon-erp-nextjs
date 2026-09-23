/**
 * Servicio Puro de Dominio: Alquiler Transaccional y Liquidación de Contratos
 * Módulo: Alquileres System (FerreOn ERP & WMS)
 * 
 * Reglas de Dominio:
 * 1. Cero dependencia de directivas 'use server' o 'next/cache'.
 * 2. Rigor numérico en COP (sin decimales espurios) con Math.round().
 * 3. Ejecución atómica de reserva y devolución de stock mediante RPCs de PostgreSQL.
 * 4. Límites de confianza estrictos: el servidor recalcula tarifas, días y subtotales.
 */

export interface ItemAlquilerCalculoInput {
  itemId: string | number;
  nombreItem?: string;
  cantidad: number;
  tarifaAplicada: number;
  fechaInicio: string;
  fechaFinEstimada: string;
  esSubcontratado?: boolean | null;
  proveedorSubcontratadoId?: string | null;
  costoDiarioProveedor?: number | null;
}

export interface ItemLiquidado {
  equipoId: number;
  nombreItem: string;
  cantidad: number;
  tarifaAplicada: number;
  diasContratados: number;
  subtotalLinea: number;
  fechaInicio: string;
  fechaFin: string;
  esSubcontratado: boolean;
  proveedorSubcontratadoId: string | null;
  costoDiarioProveedor: number;
}

export interface LiquidacionAlquilerResultado {
  subtotalEquipos: number;
  fleteEntrega: number;
  fleteRecogida: number;
  subtotalGeneral: number;
  deposito: number;
  total: number;
  saldoPendiente: number;
  itemsLiquidados: ItemLiquidado[];
}

export interface DespachoContratoParams {
  clienteId: string | number;
  clienteNombre?: string;
  fechaRegistro?: string;
  fleteEntrega: number;
  fleteRecogida: number;
  deposito: number;
  garantiaMonto: number;
  garantiaTipo: string;
  observaciones?: string;
  detallesLogistica?: string;
  items: ItemAlquilerCalculoInput[];
  estado?: string;
  idempotencyKey?: string | null;
  empresaId: string;
  userIdentifier: string;
}

export interface DevolucionItemParams {
  detalleId: string | number;
  cantidadDevuelta: number;
  costoDano?: number;
}

export interface DevolucionContratoParams {
  alquilerId: string | number;
  devoluciones: DevolucionItemParams[];
  empresaId: string;
}

export interface EdicionContratoParams extends DespachoContratoParams {
  alquilerId: string | number;
}

export class AlquilerTransaccionalService {
  /**
   * Calcula con rigor matemático y financiero los días, subtotales y balance del contrato.
   * Garantiza que el servidor no acepte cálculos precalculados no verificados del cliente.
   */
  public static calcularLiquidacion(
    items: ItemAlquilerCalculoInput[],
    fleteEntrega: number = 0,
    fleteRecogida: number = 0,
    deposito: number = 0
  ): LiquidacionAlquilerResultado {
    let subtotalEquipos = 0;

    const itemsLiquidados: ItemLiquidado[] = items.map((item) => {
      const start = new Date(item.fechaInicio);
      const end = new Date(item.fechaFinEstimada);
      const diffMs = end.getTime() - start.getTime();
      const dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const cant = Math.max(1, Number(item.cantidad || 1));
      const tarifa = Math.max(0, Number(item.tarifaAplicada || 0));
      const subtotalLinea = Math.round(tarifa * cant * dias);

      subtotalEquipos += subtotalLinea;

      const rawId = String(item.itemId || '').replace(/\D/g, '');
      const equipoId = parseInt(rawId, 10) || Number(item.itemId) || 0;

      return {
        equipoId,
        nombreItem: item.nombreItem || '',
        cantidad: cant,
        tarifaAplicada: tarifa,
        diasContratados: dias,
        subtotalLinea,
        fechaInicio: item.fechaInicio,
        fechaFin: item.fechaFinEstimada,
        esSubcontratado: Boolean(item.esSubcontratado),
        proveedorSubcontratadoId: item.proveedorSubcontratadoId || null,
        costoDiarioProveedor: Math.max(0, Number(item.costoDiarioProveedor || 0)),
      };
    });

    const fEntrega = Math.max(0, Math.round(Number(fleteEntrega || 0)));
    const fRecogida = Math.max(0, Math.round(Number(fleteRecogida || 0)));
    const subtotalGeneral = subtotalEquipos + fEntrega + fRecogida;
    const dep = Math.max(0, Math.round(Number(deposito || 0)));
    const total = subtotalGeneral;
    const saldoPendiente = Math.max(0, total - dep);

    return {
      subtotalEquipos,
      fleteEntrega: fEntrega,
      fleteRecogida: fRecogida,
      subtotalGeneral,
      deposito: dep,
      total,
      saldoPendiente,
      itemsLiquidados,
    };
  }

  /**
   * Calcula la liquidación de contratos con líneas segmentadas y tarifas/subtotales personalizados.
   * Regla de Negocio (/grill-me): Si el operador edita manualmente el subtotal (subtotalPersonalizado = true),
   * se preserva el subtotal como valor cerrado y se recalcula la tarifa diaria unitaria efectiva proporcional:
   * Math.round(subtotal / (cantidad * dias)).
   */
  public static calcularLiquidacionSegmentada(
    items: Array<{
      lineaNumero?: number;
      itemId: string | number;
      nombreItem?: string | null;
      cantidad: number;
      tarifaAplicada: number;
      tarifaPersonalizada?: boolean;
      fechaInicio: string;
      fechaFinEstimada: string;
      diasContratados?: number;
      subtotalLinea?: number;
      subtotalPersonalizado?: boolean;
      esSubcontratado?: boolean | null;
      proveedorSubcontratadoId?: string | null;
      costoDiarioProveedor?: number | null;
    }>,
    fleteEntrega: number = 0,
    fleteRecogida: number = 0,
    deposito: number = 0
  ): LiquidacionAlquilerResultado {
    let subtotalEquipos = 0;

    const itemsLiquidados: ItemLiquidado[] = items.map((item, idx) => {
      const start = new Date(`${item.fechaInicio}T00:00:00Z`);
      const end = new Date(`${item.fechaFinEstimada}T00:00:00Z`);
      const diffMs = end.getTime() - start.getTime();
      const dias = item.diasContratados && item.diasContratados > 0 
        ? item.diasContratados 
        : Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const cant = Math.max(1, Number(item.cantidad || 1));

      let tarifa = Math.max(0, Number(item.tarifaAplicada || 0));
      let subtotalLinea = 0;

      if (item.subtotalPersonalizado && item.subtotalLinea !== undefined && item.subtotalLinea >= 0) {
        subtotalLinea = Math.round(Number(item.subtotalLinea));
        // Recalcular tarifa diaria efectiva proporcional
        tarifa = dias > 0 && cant > 0 ? Math.round(subtotalLinea / (cant * dias)) : tarifa;
      } else {
        subtotalLinea = Math.round(tarifa * cant * dias);
      }

      subtotalEquipos += subtotalLinea;

      const rawId = String(item.itemId || '').replace(/\D/g, '');
      const equipoId = parseInt(rawId, 10) || Number(item.itemId) || 0;

      return {
        equipoId,
        nombreItem: item.nombreItem || '',
        cantidad: cant,
        tarifaAplicada: tarifa,
        diasContratados: dias,
        subtotalLinea,
        fechaInicio: item.fechaInicio,
        fechaFin: item.fechaFinEstimada,
        esSubcontratado: Boolean(item.esSubcontratado),
        proveedorSubcontratadoId: item.proveedorSubcontratadoId || null,
        costoDiarioProveedor: Math.max(0, Number(item.costoDiarioProveedor || 0)),
      };
    });

    const fEntrega = Math.max(0, Math.round(Number(fleteEntrega || 0)));
    const fRecogida = Math.max(0, Math.round(Number(fleteRecogida || 0)));
    const subtotalGeneral = subtotalEquipos + fEntrega + fRecogida;
    const dep = Math.max(0, Math.round(Number(deposito || 0)));
    const total = subtotalGeneral;
    const saldoPendiente = Math.max(0, total - dep);

    return {
      subtotalEquipos,
      fleteEntrega: fEntrega,
      fleteRecogida: fRecogida,
      subtotalGeneral,
      deposito: dep,
      total,
      saldoPendiente,
      itemsLiquidados,
    };
  }

  /**
   * Orquesta la ejecución transaccional del despacho mediante el RPC atómico de PostgreSQL.
   */
  public static async despacharContrato(
    supabase: any,
    params: DespachoContratoParams
  ): Promise<{ success: boolean; data?: any; error?: string; idempotent?: boolean }> {
    // 0. Comprobación defensiva de idempotencia para prevenir duplicados por reintentos o doble clic
    if (params.idempotencyKey) {
      try {
        const fromAlquileres = (supabase.from('alquileres') as any);
        if (typeof fromAlquileres?.select === 'function') {
          const { data: existingAlquiler } = await fromAlquileres
            .select('id, consecutivo, estado, total, deposito, created_at')
            .eq('idempotency_key', params.idempotencyKey)
            .maybeSingle();

          if (existingAlquiler) {
            return {
              success: true,
              data: existingAlquiler,
              idempotent: true,
            };
          }
        }
      } catch (checkErr) {
        console.warn('[AlquilerTransaccionalService] Advertencia comprobando idempotencia:', checkErr);
      }
    }

    const liquidacion = this.calcularLiquidacion(
      params.items,
      params.fleteEntrega,
      params.fleteRecogida,
      params.deposito
    );

    const itemsPayload = liquidacion.itemsLiquidados.map((it) => ({
      equipo_id: it.equipoId,
      cantidad: it.cantidad,
      tarifa_aplicada: it.tarifaAplicada,
      dias_contratados: it.diasContratados,
      subtotal_linea: it.subtotalLinea,
      fecha_inicio: it.fechaInicio,
      fecha_fin: it.fechaFin,
      es_subcontratado: it.esSubcontratado,
      proveedor_subcontratado_id: it.proveedorSubcontratadoId,
      costo_diario_proveedor: it.costoDiarioProveedor,
    }));

    const payload = {
      empresa_id: params.empresaId,
      idempotency_key: params.idempotencyKey || null,
      cliente_id: typeof params.clienteId === 'string' ? parseInt(params.clienteId, 10) : params.clienteId,
      estado: params.estado || 'ACTIVO',
      subtotal_equipos: liquidacion.subtotalEquipos,
      flete_entrega: liquidacion.fleteEntrega,
      flete_recogida: liquidacion.fleteRecogida,
      subtotal_general: liquidacion.subtotalGeneral,
      total: liquidacion.total,
      deposito: liquidacion.deposito,
      garantia_monto: Math.round(Number(params.garantiaMonto || 0)),
      garantia_tipo: params.garantiaTipo || 'Efectivo',
      observaciones: params.observaciones || '',
      detalles_logistica: params.detallesLogistica || '',
      creado_por: params.userIdentifier,
      items: itemsPayload,
    };

    // Invocar el RPC atómico con bloqueo pesimista (alquiler_despachar_items_v1 o fallback crear_alquiler_transaccional)
    let rpcResponse = await supabase.rpc('alquiler_despachar_items_v1', { p_payload: payload });
    if (rpcResponse.error && rpcResponse.error.code === '42883') {
      // Fallback si la migración v1 está en cola
      rpcResponse = await supabase.rpc('crear_alquiler_transaccional', { p_payload: payload });
    }

    if (rpcResponse.error) {
      const err = rpcResponse.error;
      // Detección de colisión idempotente
      if (
        params.idempotencyKey &&
        (err.message?.includes('duplicate key') || err.message?.includes('idempotency'))
      ) {
        const { data: recovered } = await (supabase.from('alquileres') as any)
          .select('id, consecutivo, estado, total, deposito, created_at')
          .eq('idempotency_key', params.idempotencyKey)
          .maybeSingle();

        if (recovered) {
          return { success: true, data: recovered, idempotent: true };
        }
      }

      if (err.message && err.message.includes('INSUFFICIENT_STOCK')) {
        return { success: false, error: err.message };
      }

      return { success: false, error: `Error en base de datos al despachar alquiler: ${err.message}` };
    }

    const data = rpcResponse.data;

    // Sincronización automática de órdenes de subcontratación si hay ítems tercerizados
    const subItems = liquidacion.itemsLiquidados.filter((it) => it.esSubcontratado && it.proveedorSubcontratadoId);
    if (subItems.length > 0 && data?.id) {
      try {
        const provMap = new Map<string, typeof subItems>();
        for (const it of subItems) {
          const pId = it.proveedorSubcontratadoId!;
          if (!provMap.has(pId)) provMap.set(pId, []);
          provMap.get(pId)!.push(it);
        }

        for (const [proveedorId, itemsProv] of Array.from(provMap.entries())) {
          const costoTotalOrden = itemsProv.reduce(
            (acc, it) => acc + it.costoDiarioProveedor * it.cantidad * it.diasContratados,
            0
          );

          await supabase.from('subcontrataciones').insert([
            {
              empresa_id: params.empresaId,
              alquiler_id: data.id,
              proveedor_id: proveedorId,
              estado: 'ORDENADA',
              costo_pactado_total: costoTotalOrden,
              costo_liquidado_total: 0,
              observaciones: `Orden generada automáticamente para ${itemsProv.length} ítem(s) en contrato #${data.consecutivo || data.id}`,
            },
          ]);
        }
      } catch (subErr) {
        console.warn('[AlquilerTransaccionalService] Advertencia creando subcontratación:', subErr);
      }
    }

    return {
      success: true,
      data: {
        ...(typeof data === 'object' && data !== null ? data : {}),
        subtotal_equipos: data?.subtotal_equipos ?? liquidacion.subtotalEquipos,
        subtotal_general: data?.subtotal_general ?? liquidacion.subtotalGeneral,
        total: data?.total ?? liquidacion.total,
        saldo_pendiente: data?.saldo_pendiente ?? liquidacion.saldoPendiente,
      },
    };
  }

  /**
   * Orquesta la devolución atómica de inventario con restitución a bodega.
   */
  public static async devolverContrato(
    supabase: any,
    params: DevolucionContratoParams
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const numericAlquilerId =
      typeof params.alquilerId === 'string' ? parseInt(params.alquilerId, 10) : params.alquilerId;

    const payload = {
      empresa_id: params.empresaId,
      alquiler_id: numericAlquilerId,
      devoluciones: params.devoluciones.map((d) => ({
        detalle_id: typeof d.detalleId === 'string' ? parseInt(d.detalleId, 10) : d.detalleId,
        cantidad_devuelta: Math.max(1, Number(d.cantidadDevuelta || 1)),
        costo_dano: Math.max(0, Math.round(Number(d.costoDano || 0))),
      })),
    };

    let rpcResponse = await supabase.rpc('alquiler_devolver_items_v1', { p_payload: payload });
    if (rpcResponse.error && rpcResponse.error.code === '42883') {
      rpcResponse = await supabase.rpc('procesar_devolucion_alquiler', { p_payload: payload });
    }

    if (rpcResponse.error) {
      return { success: false, error: `Error al procesar devolución: ${rpcResponse.error.message}` };
    }

    return { success: true, data: rpcResponse.data };
  }

  /**
   * Orquesta la edición transaccional de un contrato activo con reconciliación de inventario.
   */
  public static async editarContrato(
    supabase: any,
    params: EdicionContratoParams
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const numericAlquilerId =
      typeof params.alquilerId === 'string' ? parseInt(params.alquilerId, 10) : params.alquilerId;

    const liquidacion = this.calcularLiquidacion(
      params.items,
      params.fleteEntrega,
      params.fleteRecogida,
      params.deposito
    );

    const payload = {
      empresa_id: params.empresaId,
      alquiler_id: numericAlquilerId,
      subtotal_equipos: liquidacion.subtotalEquipos,
      flete_entrega: liquidacion.fleteEntrega,
      flete_recogida: liquidacion.fleteRecogida,
      subtotal_general: liquidacion.subtotalGeneral,
      total: liquidacion.total,
      deposito: liquidacion.deposito,
      saldo_pendiente: liquidacion.saldoPendiente,
      garantia_monto: Math.round(Number(params.garantiaMonto || 0)),
      observaciones: params.observaciones || '',
      detalles_logistica: params.detallesLogistica || '',
      items: liquidacion.itemsLiquidados.map((it) => ({
        equipo_id: it.equipoId,
        cantidad: it.cantidad,
        tarifa_aplicada: it.tarifaAplicada,
        dias_contratados: it.diasContratados,
        subtotal_linea: it.subtotalLinea,
        fecha_inicio: it.fechaInicio,
        fecha_fin: it.fechaFin,
        es_subcontratado: it.esSubcontratado,
      })),
    };

    let rpcResponse = await supabase.rpc('editar_alquiler_transaccional_v1', { p_payload: payload });

    if (rpcResponse.error) {
      return { success: false, error: `Error al editar contrato atómicamente: ${rpcResponse.error.message}` };
    }

    return { success: true, data: rpcResponse.data };
  }
}
