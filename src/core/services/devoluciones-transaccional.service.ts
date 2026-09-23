/**
 * Servicio de Dominio Puro: Devoluciones, Split-Line e Inspección Técnica
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 * 
 * Centraliza la lógica de negocio para:
 * - Detección y mapeo de contratos con maquinaria pendiente en obra.
 * - Validación y cálculo de Split-Line en devoluciones parciales.
 * - Filtrado reactivo insensible a diacríticos (zero-latency).
 * - Adaptación de actas históricas a comprobantes imprimibles.
 * - Liquidación financiera de garantías, alquiler causado y daños.
 */

import {
  calcularLiquidacionDevolucion as calcularLiquidacionDevolucionPura,
  calcularDiasEfectivosUso,
  ContratoAlquilerBase,
  ItemDevolucionInput,
  LiquidacionDevolucionResultado,
  EstadoInspeccionTecnica,
  ItemLiquidadoResultado
} from './liquidacion-devolucion.service';

export {
  calcularDiasEfectivosUso,
  type ContratoAlquilerBase,
  type ItemDevolucionInput,
  type LiquidacionDevolucionResultado,
  type EstadoInspeccionTecnica,
  type ItemLiquidadoResultado
};

export interface DetalleContratoPendienteUI {
  detalleId: string | number;
  equipoId: string | number;
  nombreEquipo: string;
  cantidadContratada: number;
  cantidadDevueltaPrevia: number;
  tarifaDiaria: number;
  fechaInicio: string;
  esSubcontratado?: boolean;
}

export interface ContratoConPendientesUI {
  id: string | number;
  consecutivo: number | string;
  clienteNombre: string;
  clienteNit: string;
  clienteTelefono: string;
  depositoGarantia: number;
  fechaInicio: string;
  fechaEsperada: string;
  equiposResumen: string;
  estadoRetraso: string;
  detallesCompletos: DetalleContratoPendienteUI[];
}

export interface SplitLineEvaluation {
  esSplitLine: boolean;
  cantidadDevolver?: number;
  cantidadRemanenteEnObra?: number;
  remanenteEnObra?: number;
  valido?: boolean;
  error?: string;
}

export interface ComprobanteDevolucionItem {
  nombreEquipo: string;
  codigo?: string;
  cantidadDevuelta: number;
  diasEfectivos: number;
  tarifaDiaria: number;
  subtotalAlquiler: number;
  estadoInspeccion: EstadoInspeccionTecnica;
  costoReparacion: number;
  valorReposicion: number;
  descripcionDano?: string | null;
}

export interface ComprobanteDevolucionData {
  consecutivo: string;
  fechaDevolucion: string;
  contratoConsecutivo: number | string;
  clienteNombre: string;
  clienteNit: string;
  recibidoPor: string;
  depositoAplicado: number;
  totalAlquilerLiquidado: number;
  totalDanos: number;
  totalReposiciones: number;
  saldoNeto: number;
  tipoResolucion: string;
  metodoPago: string;
  observaciones?: string | null;
  items: ComprobanteDevolucionItem[];
}

export class DevolucionesTransaccionalService {
  /**
   * Normaliza texto para búsqueda insensible a acentos y mayúsculas.
   */
  public static normalizarTexto(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /**
   * Evalúa la lógica de Split-Line para una línea de contrato en devolución.
   */
  public static evaluarSplitLine(
    cantidadTotalOriginal: number,
    cantidadDevolver: number
  ): SplitLineEvaluation {
    if (cantidadDevolver <= 0) {
      return {
        esSplitLine: false,
        cantidadDevolver: 0,
        cantidadRemanenteEnObra: cantidadTotalOriginal,
        remanenteEnObra: cantidadTotalOriginal,
        valido: false,
        error: 'La cantidad a devolver debe ser mayor a 0.',
      };
    }

    if (cantidadDevolver > cantidadTotalOriginal) {
      return {
        esSplitLine: false,
        cantidadDevolver,
        cantidadRemanenteEnObra: 0,
        remanenteEnObra: 0,
        valido: false,
        error: `No es posible devolver ${cantidadDevolver} unidades cuando solo hay ${cantidadTotalOriginal} en contrato.`,
      };
    }

    const cantidadRemanenteEnObra = cantidadTotalOriginal - cantidadDevolver;
    const esSplitLine = cantidadDevolver < cantidadTotalOriginal && cantidadRemanenteEnObra > 0;

    return {
      esSplitLine,
      cantidadDevolver,
      cantidadRemanenteEnObra,
      remanenteEnObra: cantidadRemanenteEnObra,
      valido: true,
    };
  }

  /**
   * Mapea contratos activos filtrando solo aquellos que tienen equipos pendientes de retornar.
   */
  public static mapearContratosConPendientes(alquileres: any[]): ContratoConPendientesUI[] {
    if (!Array.isArray(alquileres)) return [];

    const activos = alquileres.filter((a) => a && (a.estado === 'ACTIVO' || a.estado === 'VENCIDO'));

    return activos
      .map((a) => {
        const detalles = a.detalles || [];
        const pendientes = detalles.filter((d: any) => {
          const contratada = Number(d.cantidad) || 0;
          const devuelta = Number(d.cantidadDevuelta) || 0;
          return contratada > devuelta;
        });

        const resumen =
          pendientes
            .map((d: any) => {
              const remanente = (Number(d.cantidad) || 0) - (Number(d.cantidadDevuelta) || 0);
              return `${remanente}x ${d.nombreItem || d.equipoNombre || 'Equipo'}`;
            })
            .join(', ') || 'Sin pendientes';

        const fechaEsperada = detalles[0]?.fechaFinEstimada
          ? new Date(detalles[0].fechaFinEstimada).toLocaleDateString('es-CO')
          : 'A convenir';

        return {
          id: a.id || `CTR-${a.consecutivo}`,
          consecutivo: a.consecutivo || 1,
          clienteNombre: a.clienteNombre || a.clientes?.nombre || 'Cliente General',
          clienteNit: a.clienteNit || a.clientes?.nit_cedula || 'Sin NIT',
          clienteTelefono: a.clienteTelefono || a.clientes?.telefono || '',
          depositoGarantia: Number(a.deposito || a.depositoGarantia || 0),
          fechaInicio: a.created_at || a.fechaInicio || new Date().toISOString(),
          fechaEsperada,
          equiposResumen: resumen,
          estadoRetraso: 'En tiempo',
          detallesCompletos: detalles.map((d: any) => ({
            detalleId: d.id || d.itemId || d.detalleId,
            equipoId: d.itemId || d.equipoId,
            nombreEquipo: d.nombreItem || d.equipoNombre || 'Equipo',
            cantidadContratada: Number(d.cantidad) || 0,
            cantidadDevueltaPrevia: Number(d.cantidadDevuelta) || 0,
            tarifaDiaria: Number(d.tarifaAplicada || d.tarifaDiaria || 0),
            fechaInicio: d.fechaInicio || a.created_at || new Date().toISOString(),
            esSubcontratado: Boolean(d.esSubcontratado || d.subcontratado),
          })),
        };
      })
      .filter((c) =>
        c.detallesCompletos.some((d) => d.cantidadContratada > d.cantidadDevueltaPrevia)
      );
  }

  /**
   * Filtra contratos con pendientes usando búsqueda textual insensible a tildes y mayúsculas.
   */
  public static filtrarContratosPendientes(
    contratos: ContratoConPendientesUI[],
    filtroTexto: string
  ): ContratoConPendientesUI[] {
    if (!filtroTexto || !filtroTexto.trim()) return contratos;

    const query = this.normalizarTexto(filtroTexto);

    return contratos.filter((c) => {
      const matchCliente = this.normalizarTexto(c.clienteNombre).includes(query);
      const matchConsecutivo = String(c.consecutivo).includes(query);
      const matchEquipos = this.normalizarTexto(c.equiposResumen).includes(query);
      return matchCliente || matchConsecutivo || matchEquipos;
    });
  }

  /**
   * Adapta un acta de devolución obtenida de la base de datos a la estructura del comprobante PDF.
   */
  public static adaptarActaAComprobanteData(acta: any): ComprobanteDevolucionData {
    const items: ComprobanteDevolucionItem[] = (acta?.devolucion_detalles || []).map((d: any) => ({
      nombreEquipo: d.equipos?.nombre || 'Maquinaria',
      codigo: d.equipos?.codigo || '',
      cantidadDevuelta: Number(d.cantidad_devuelta || 0),
      diasEfectivos: Number(d.dias_efectivos_cobrados || 0),
      tarifaDiaria: Number(d.tarifa_diaria_aplicada || 0),
      subtotalAlquiler: Number(d.subtotal_alquiler || 0),
      estadoInspeccion: (d.estado_inspeccion || 'BUENO') as EstadoInspeccionTecnica,
      costoReparacion: Number(d.costo_reparacion || 0),
      valorReposicion: Number(d.valor_reposicion || 0),
      descripcionDano: d.descripcion_dano || null,
    }));

    return {
      consecutivo: acta?.consecutivo || 'ACTA-000',
      fechaDevolucion: acta?.fecha_devolucion || new Date().toISOString(),
      contratoConsecutivo: acta?.alquileres?.consecutivo || acta?.alquiler_id || 0,
      clienteNombre: acta?.alquileres?.clientes?.nombre || 'Cliente General',
      clienteNit: acta?.alquileres?.clientes?.nit_cedula || '',
      recibidoPor: acta?.recibido_por || 'OPERADOR_BODEGA',
      depositoAplicado: Number(acta?.deposito_aplicado || 0),
      totalAlquilerLiquidado: Number(acta?.total_alquiler_liquidado || 0),
      totalDanos: Number(acta?.total_danos || 0),
      totalReposiciones: Number(acta?.total_reposiciones || 0),
      saldoNeto: Number(acta?.saldo_neto || 0),
      tipoResolucion: acta?.tipo_resolucion || 'SIN_SALDO',
      metodoPago: acta?.metodo_pago || 'EFECTIVO',
      observaciones: acta?.observaciones || null,
      items,
    };
  }

  /**
   * Ejecuta la liquidación pura de devolución y garantías delegando a la función de dominio.
   */
  public static liquidarDevolucion(
    contrato: ContratoAlquilerBase,
    items: ItemDevolucionInput[]
  ): LiquidacionDevolucionResultado {
    return calcularLiquidacionDevolucionPura(contrato, items);
  }
}

// Exportaciones funcionales directas para compatibilidad dual (POO y Funcional)
export const normalizarTexto = DevolucionesTransaccionalService.normalizarTexto.bind(DevolucionesTransaccionalService);
export const evaluarSplitLine = DevolucionesTransaccionalService.evaluarSplitLine.bind(DevolucionesTransaccionalService);
export const mapearContratosConPendientes = DevolucionesTransaccionalService.mapearContratosConPendientes.bind(DevolucionesTransaccionalService);
export const filtrarContratosPendientes = DevolucionesTransaccionalService.filtrarContratosPendientes.bind(DevolucionesTransaccionalService);
export const mapearActaHistorialAComprobante = DevolucionesTransaccionalService.adaptarActaAComprobanteData.bind(DevolucionesTransaccionalService);
export const adaptarActaAComprobanteData = DevolucionesTransaccionalService.adaptarActaAComprobanteData.bind(DevolucionesTransaccionalService);
export const calcularLiquidacionDevolucion = DevolucionesTransaccionalService.liquidarDevolucion.bind(DevolucionesTransaccionalService);
