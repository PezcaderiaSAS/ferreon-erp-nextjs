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
    stock_total: equipo.stockTotal ?? equipo.stock_total ?? 0,
    stock_disponible: equipo.stockDisponible ?? equipo.stock_disponible ?? 0,
    stock_en_obra: equipo.stockEnObra ?? equipo.stock_en_obra ?? 0,
    estado: (['Disponible', 'En Alquiler', 'Mantenimiento'].includes(equipo.estado as string) ? equipo.estado : 'Disponible') as Equipo['estado'],
    created_at: equipo.creado_en ?? equipo.created_at ? new Date(equipo.creado_en ?? equipo.created_at).toISOString() : undefined,
    // Retrocompatibilidad camelCase
    sku: equipo.sku ?? equipo.codigo,
    tarifaDiaria: equipo.tarifaDiaria ?? equipo.tarifa_diaria ?? 0,
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
export function clienteToClienteUI(cliente: Cliente): ClienteUI {
  return {
    id: cliente.id,
    nit_cedula: cliente.nit ?? '',
    nombre: cliente.nombre,
    telefono: cliente.contacto ?? '',
    email: cliente.email ?? '',
    direccion: cliente.direccion ?? '',
    estado: 'Activo',
    created_at: cliente.creado_en ? new Date(cliente.creado_en).toISOString() : new Date().toISOString(),
    // Retrocompatibilidad
    nit: cliente.nit,
    contacto: cliente.contacto,
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
export function alquilerEntityToAlquilerUI(entity: AlquilerEntity): AlquilerUI {
  return {
    id: entity.id ?? '',
    consecutivo: entity.consecutivo ?? 0,
    cliente_id: entity.clienteId ?? '',
    clienteNombre: entity.clienteNombre,
    estado: entity.estado,
    subtotal_equipos: entity.subtotalEquiposEstimado ?? 0,
    flete_entrega: entity.fleteEntrega ?? 0,
    flete_recogida: entity.fleteRecogida ?? 0,
    subtotal_general: entity.subtotalGeneralEstimado ?? 0,
    total: entity.totalEstimado ?? 0,
    deposito: entity.deposito ?? 0,
    garantia_monto: entity.garantiaMonto ?? 0,
    garantia_tipo: entity.garantiaTipo ?? '',
    garantia_estado: entity.garantiaEstado ?? '',
    observaciones: entity.observacionesGenerales,
    detalles_logistica: entity.detallesLogistica,
    detalles: entity.detalles ?? [],
    created_at: entity.createdAt ? entity.createdAt.toISOString() : new Date().toISOString(),
  };
}

/**
 * Convierte un AlquilerUI (Zustand store) → AlquilerEntity (dominio).
 */
export function alquilerUIToAlquilerEntity(ui: AlquilerUI): AlquilerEntity {
  return new AlquilerEntity(
    ui.id,
    ui.consecutivo,
    String(ui.cliente_id),
    ui.clienteNombre,
    ui.estado as AlquilerEntity['estado'],
    ui.subtotal_equipos ?? 0,
    ui.flete_entrega ?? 0,
    ui.flete_recogida ?? 0,
    ui.subtotal_general ?? 0,
    ui.total ?? 0,
    ui.deposito ?? 0,
    ui.garantia_monto ?? 0,
    ui.garantia_tipo ?? '',
    ui.garantia_estado ?? '',
    ui.observaciones,
    ui.detalles_logistica,
    undefined,
    ui.detalles ?? [],
    undefined, // totalReal
    undefined, // subtotalEquiposReal
    undefined, // subtotalGeneralReal
    undefined, // diferencialMonetario
    ui.created_at ? new Date(ui.created_at) : undefined
  );
}
