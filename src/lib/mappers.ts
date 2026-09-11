/**
 * Mappers de Conversión entre Tipos de Dominio y Tipos de UI/Store
 * ---------------------------------------------------------------
 * Este archivo actúa como puente entre la capa de dominio (camelCase)
 * y la capa de UI/Store (snake_case, compatibilidad con Supabase).
 */

import { Equipo } from '../core/domain/entities/equipo';
import { Cliente } from '../core/domain/entities/cliente';
import { AlquilerEntity } from '../core/domain/entities/alquiler';
import { EquipoUI } from '../infrastructure/state/bodegaStore';
import { ClienteUI } from '../infrastructure/state/clienteStore';
import { AlquilerUI } from '../infrastructure/state/alquilerStore';

// ─────────────────────────────────────────────
// EQUIPO ↔ EQUIPO UI
// ─────────────────────────────────────────────

/**
 * Convierte un Equipo (dominio/Supabase) → EquipoUI (Zustand store).
 */
export function equipoToEquipoUI(equipo: any): EquipoUI {
  return {
    id: equipo.id,
    codigo: equipo.sku ?? equipo.codigo ?? '',
    nombre: equipo.nombre,
    categoria: equipo.categoria,
    tarifa_diaria: equipo.tarifaDiaria ?? equipo.tarifa_diaria ?? 0,
    valor_reposicion: equipo.valorReposicion ?? equipo.valor_reposicion ?? 0,
    stock_total: equipo.stockTotal ?? equipo.stock_total ?? 0,
    stock_disponible: equipo.stockDisponible ?? equipo.stock_disponible ?? 0,
    stock_en_obra: equipo.stockEnObra ?? equipo.stock_en_obra ?? 0,
    estado: (['Disponible', 'En Alquiler', 'Mantenimiento'].includes(equipo.estado as string) ? equipo.estado : 'Disponible') as Equipo['estado'],
    created_at: equipo.creado_en ?? equipo.created_at ? new Date(equipo.creado_en ?? equipo.created_at).toISOString() : undefined,
    // Retrocompatibilidad camelCase
    sku: equipo.sku ?? equipo.codigo,
    tarifaDiaria: equipo.tarifaDiaria ?? equipo.tarifa_diaria ?? 0,
    valorReposicion: equipo.valorReposicion ?? equipo.valor_reposicion ?? 0,
    stockTotal: equipo.stockTotal ?? equipo.stock_total ?? 0,
    stockDisponible: equipo.stockDisponible ?? equipo.stock_disponible ?? 0,
    stockEnObra: equipo.stockEnObra ?? equipo.stock_en_obra ?? 0,
  };
}

/**
 * Convierte un EquipoUI (Zustand store) → Equipo (dominio).
 */
export function equipoUIToEquipo(ui: EquipoUI): Equipo {
  return {
    id: ui.id,
    sku: ui.sku ?? ui.codigo ?? '',
    nombre: ui.nombre,
    categoria: ui.categoria,
    tarifaDiaria: ui.tarifa_diaria ?? ui.tarifaDiaria ?? 0,
    stockTotal: ui.stock_total ?? ui.stockTotal ?? 0,
    stockDisponible: ui.stock_disponible ?? ui.stockDisponible ?? 0,
    stockEnObra: ui.stock_en_obra ?? ui.stockEnObra ?? 0,
    estado: (['Disponible', 'En Alquiler', 'Mantenimiento'].includes(ui.estado as string) ? ui.estado : 'Disponible') as Equipo['estado'],
    creado_en: ui.created_at ? new Date(ui.created_at) : new Date(),
  };
}

// ─────────────────────────────────────────────
// CLIENTE ↔ CLIENTE UI
// ─────────────────────────────────────────────

/**
 * Convierte un Cliente (dominio/Supabase) → ClienteUI (Zustand store).
 */
export function clienteToClienteUI(cliente: any): ClienteUI {
  return {
    id: cliente.id,
    nit_cedula: cliente.nit_cedula ?? cliente.nit ?? '',
    nombre: cliente.nombre || '',
    telefono: cliente.telefono ?? cliente.contacto ?? '',
    email: cliente.email ?? '',
    direccion: cliente.direccion ?? '',
    estado: cliente.estado || 'Activo',
    created_at: (cliente.creado_en || cliente.created_at) ? new Date(cliente.creado_en || cliente.created_at).toISOString() : new Date().toISOString(),
    // Retrocompatibilidad
    nit: cliente.nit_cedula ?? cliente.nit ?? '',
    contacto: cliente.telefono ?? cliente.contacto ?? '',
    nivel_riesgo: cliente.nivel_riesgo,
  };
}

/**
 * Convierte un ClienteUI (Zustand store) → Cliente (dominio).
 */
export function clienteUIToCliente(ui: ClienteUI): Cliente {
  return {
    id: ui.id,
    nit: ui.nit_cedula ?? ui.nit ?? '',
    nombre: ui.nombre,
    contacto: ui.telefono ?? ui.contacto ?? '',
    email: ui.email,
    direccion: ui.direccion,
    nivel_riesgo: (ui.nivel_riesgo as Cliente['nivel_riesgo']) ?? 'Bajo',
    creado_en: ui.created_at ? new Date(ui.created_at) : new Date(),
  };
}

// ─────────────────────────────────────────────
// ALQUILER ENTITY ↔ ALQUILER UI
// ─────────────────────────────────────────────

/**
 * Convierte un AlquilerEntity (dominio) → AlquilerUI (Zustand store).
 */
export function alquilerEntityToAlquilerUI(entity: any): AlquilerUI {
  const clienteNombre = entity.clienteNombre || entity.clientes?.nombre || entity.cliente?.nombre || entity.cliente_nombre || 'Consumidor Final';
  const clienteNit = entity.clienteNit || entity.clientes?.nit_cedula || entity.clientes?.nit || entity.cliente?.nit_cedula || entity.cliente?.nit || entity.cliente_nit || entity.nit_cedula || '';
  const clienteTelefono = entity.clienteTelefono || entity.clientes?.telefono || entity.cliente?.telefono || entity.cliente_telefono || entity.telefono || '';
  const clienteDireccion = entity.clienteDireccion || entity.clientes?.direccion || entity.cliente?.direccion || entity.cliente_direccion || entity.direccion || '';
  const clienteEmail = entity.clienteEmail || entity.clientes?.email || entity.cliente?.email || entity.cliente_email || entity.email || '';

  const rawDetalles = (entity.detalles && entity.detalles.length > 0)
    ? entity.detalles
    : (entity.alquiler_detalles || entity.items || []);

  const detallesMapeados = rawDetalles.map((d: any) => {
    const nombreItem = (Array.isArray(d.equipos) ? d.equipos[0]?.nombre : d.equipos?.nombre) || d.nombreItem || d.nombre || d.equipo?.nombre || 'Equipo de Construcción';
    const codigo = (Array.isArray(d.equipos) ? d.equipos[0]?.codigo : d.equipos?.codigo) || (Array.isArray(d.equipos) ? d.equipos[0]?.sku : d.equipos?.sku) || d.codigo || d.sku || '';
    const cantidad = Number(d.cantidad || 1);
    const tarifa = Number(d.tarifa_aplicada ?? d.tarifaAplicada ?? d.tarifa_diaria ?? d.tarifaDiaria ?? d.valor_unitario ?? 0);
    const dias = Number(d.dias_contratados ?? d.diasContratados ?? d.dias ?? 1);
    const subtotal = Number(d.subtotal_linea ?? d.subtotalLineaEstimado ?? d.subtotalLineaReal ?? d.subtotal ?? (cantidad * tarifa * dias));

    return {
      id: d.id,
      itemId: String(d.equipo_id || d.itemId || d.equipoId || ''),
      equipoId: String(d.equipo_id || d.itemId || d.equipoId || ''),
      equipo_id: d.equipo_id || d.itemId || d.equipoId,
      nombre: nombreItem,
      nombreItem,
      codigo,
      cantidad,
      tarifaDiaria: tarifa,
      tarifaAplicada: tarifa,
      tarifa_aplicada: tarifa,
      valor_unitario: tarifa,
      dias,
      diasContratados: dias,
      dias_contratados: dias,
      fechaInicio: d.fecha_inicio ? new Date(d.fecha_inicio).toISOString().split('T')[0] : (d.fechaInicio || (entity.created_at ? new Date(entity.created_at).toISOString().split('T')[0] : '')),
      fechaFin: d.fecha_fin ? new Date(d.fecha_fin).toISOString().split('T')[0] : (d.fechaFin || d.fechaFinEstimada || (entity.created_at ? new Date(entity.created_at).toISOString().split('T')[0] : '')),
      fechaFinEstimada: d.fecha_fin ? new Date(d.fecha_fin).toISOString().split('T')[0] : (d.fechaFinEstimada || d.fechaFin || (entity.created_at ? new Date(entity.created_at).toISOString().split('T')[0] : '')),
      subtotal,
      subtotalLineaEstimado: subtotal,
      subtotal_linea: subtotal,
      devuelto: d.devuelto ?? false,
      cantidadDevuelta: d.cantidad_devuelta ?? d.cantidadDevuelta ?? 0,
      costoDano: d.costo_dano ?? d.costoDano ?? 0,
      esSubcontratado: Boolean(d.es_subcontratado ?? d.esSubcontratado),
      es_subcontratado: Boolean(d.es_subcontratado ?? d.esSubcontratado),
      proveedorSubcontratadoId: d.proveedor_id ? String(d.proveedor_id) : (d.proveedorSubcontratadoId ? String(d.proveedorSubcontratadoId) : ''),
      proveedor_id: d.proveedor_id ? String(d.proveedor_id) : (d.proveedorSubcontratadoId ? String(d.proveedorSubcontratadoId) : ''),
      costoDiarioProveedor: Number(d.costo_subcontratacion_diario ?? d.costoDiarioProveedor ?? 0),
      costo_subcontratacion_diario: Number(d.costo_subcontratacion_diario ?? d.costoDiarioProveedor ?? 0),
      equipos: d.equipos || d.equipo,
    };
  });

  const subtotalEquipos = entity.subtotalEquiposEstimado ?? entity.subtotal_equipos ?? (detallesMapeados.reduce((acc: number, it: any) => acc + it.subtotal, 0));
  const fleteEntrega = entity.fleteEntrega ?? entity.flete_entrega ?? 0;
  const fleteRecogida = entity.fleteRecogida ?? entity.flete_recogida ?? 0;
  const subtotalGeneral = entity.subtotalGeneralEstimado ?? entity.subtotal_general ?? (subtotalEquipos + fleteEntrega + fleteRecogida);
  const total = entity.totalEstimado ?? entity.total ?? subtotalGeneral;
  const deposito = entity.deposito ?? 0;
  const totalPagado = entity.total_pagado ?? entity.totalPagado ?? 0;
  const saldoPendiente = entity.saldo_pendiente ?? entity.saldoPendiente ?? Math.max(0, total - deposito - totalPagado);

  return {
    id: entity.id ?? '',
    consecutivo: entity.consecutivo ?? 0,
    cliente_id: entity.clienteId ?? entity.cliente_id ?? '',
    clienteNombre,
    clienteNit,
    clienteTelefono,
    clienteDireccion,
    clienteEmail,
    clientes: entity.clientes || entity.cliente,
    estado: entity.estado || 'ACTIVO',
    subtotal_equipos: subtotalEquipos,
    subtotalEquipos,
    flete_entrega: fleteEntrega,
    fleteEntrega,
    flete_recogida: fleteRecogida,
    fleteRecogida,
    valor_transporte: fleteEntrega + fleteRecogida,
    subtotal_general: subtotalGeneral,
    subtotalGeneral,
    total,
    totalEstimado: total,
    deposito,
    depositoAplicado: deposito,
    garantia_monto: entity.garantiaMonto ?? entity.garantia_monto ?? 0,
    garantiaMonto: entity.garantiaMonto ?? entity.garantia_monto ?? 0,
    garantia_tipo: entity.garantiaTipo ?? entity.garantia_tipo ?? 'Efectivo',
    garantiaTipo: entity.garantiaTipo ?? entity.garantia_tipo ?? 'Efectivo',
    garantia_estado: entity.garantiaEstado ?? entity.garantia_estado ?? 'Activa',
    total_pagado: totalPagado,
    saldo_pendiente: saldoPendiente,
    totalPagado,
    saldoPendiente,
    observaciones: entity.observacionesGenerales ?? entity.observaciones ?? '',
    detalles_logistica: entity.detallesLogistica ?? entity.detalles_logistica ?? '',
    detalles: detallesMapeados,
    items: detallesMapeados,
    created_at: entity.createdAt ? new Date(entity.createdAt).toISOString() : (entity.created_at ? new Date(entity.created_at).toISOString() : new Date().toISOString()),
    aplica_iva: entity.aplica_iva ?? false,
    valor_iva: entity.valor_iva ?? 0,
    aplica_retefuente: entity.aplica_retefuente ?? false,
    valor_retefuente: entity.valor_retefuente ?? 0,
    aplica_reteica: entity.aplica_reteica ?? false,
    valor_reteica: entity.valor_reteica ?? 0,
    cotizacion_origen_id: entity.cotizacion_origen_id,
  };
}

/**
 * Convierte un AlquilerUI (Zustand store) → AlquilerEntity (dominio).
 */
export function alquilerUIToAlquilerEntity(ui: AlquilerUI): AlquilerEntity {
  const fleteEntrega = ui.flete_entrega ?? ui.fleteEntrega ?? 0;
  const fleteRecogida = ui.flete_recogida ?? ui.fleteRecogida ?? 0;
  const deposito = ui.deposito ?? (ui as any).depositoAplicado ?? 0;
  const garantiaMonto = ui.garantia_monto ?? ui.garantiaMonto ?? 0;
  const garantiaTipo = ui.garantia_tipo ?? ui.garantiaTipo ?? 'Efectivo';

  return new AlquilerEntity(
    ui.id,
    ui.consecutivo,
    String(ui.cliente_id),
    ui.clienteNombre,
    ui.estado as AlquilerEntity['estado'],
    ui.subtotal_equipos ?? ui.subtotalEquipos ?? 0,
    fleteEntrega,
    fleteRecogida,
    ui.subtotal_general ?? ui.subtotalGeneral ?? 0,
    ui.total ?? ui.totalEstimado ?? 0,
    deposito,
    garantiaMonto,
    garantiaTipo,
    ui.garantia_estado ?? 'Activa',
    ui.observaciones,
    ui.detalles_logistica,
    undefined,
    ui.detalles ?? ui.items ?? [],
    undefined, // totalReal
    undefined, // subtotalEquiposReal
    undefined, // subtotalGeneralReal
    undefined, // diferencialMonetario
    ui.created_at ? new Date(ui.created_at) : undefined
  );
}

