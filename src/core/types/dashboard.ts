/**
 * Tipos de datos canónicos para el Centro de Control y Calendario Operativo de Alquileres System
 */

export type TipoEventoCalendario =
  | 'ALQUILER_DESPACHO'
  | 'DEVOLUCION'
  | 'COBRANZA_VENCIMIENTO'
  | 'PAGO_RECIBIDO'
  | 'MANTENIMIENTO';

export type UrgenciaEvento = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface EventoCalendario {
  id: string;
  tipo: TipoEventoCalendario;
  titulo: string;
  descripcion?: string;
  fecha: string; // Formato YYYY-MM-DD
  fechaFin?: string; // Formato YYYY-MM-DD
  monto?: number; // Monto en pesos enteros COP
  estado: string; // Estado del documento o activo
  referenciaId: string; // ID en BD (alquiler, factura, devolucion, equipo)
  clienteNombre?: string;
  equipoNombre?: string;
  urgencia: UrgenciaEvento;
  enlaceModulo?: string;
}

export type TipoTarea = 'SISTEMA' | 'MANUAL';
export type UrgenciaTarea = 'NORMAL' | 'URGENTE';

export interface TareaOperativa {
  id: string;
  titulo: string;
  tipo: TipoTarea;
  completada: boolean;
  fechaLimite?: string; // Formato YYYY-MM-DD
  urgencia: UrgenciaTarea;
  enlaceModulo?: string;
  subtexto?: string;
}

export type TipoAlerta = 'CRITICA' | 'ADVERTENCIA' | 'INFO';

export interface AlertaSistema {
  id: string;
  tipo: TipoAlerta;
  titulo: string;
  mensaje: string;
  fecha: string;
  enlace?: string;
}

export interface DashboardKPIs {
  // 1. Equipos en Obra / Utilización de Flota
  equiposEnObra: number;
  equiposTotal: number;
  utilizacionFlotaPct: number; // 0 - 100
  // 2. Contratos Activos y Cotizaciones
  contratosActivos: number;
  cotizacionesPendientes: number;
  // 3. Devoluciones Críticas / Hoy
  devolucionesPendientesHoy: number;
  devolucionesVencidas: number;
  // 4. Cartera Pendiente en COP
  carteraPendienteTotalCOP: number;
  carteraMoraCOP: number;
}

export interface DashboardPayload {
  kpis: DashboardKPIs;
  eventos: EventoCalendario[];
  tareas: TareaOperativa[];
  alertas: AlertaSistema[];
  mesActivo: string; // YYYY-MM
}

export type VistaCalendario = 'MES' | 'SEMANA' | 'AGENDA';

export interface FiltrosCalendario {
  alquileres: boolean;
  devoluciones: boolean;
  cobranzas: boolean;
  mantenimientos: boolean;
}
