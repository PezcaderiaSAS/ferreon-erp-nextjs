import { BaseAuditableEntity } from "./base-auditable.entity";

export type AlquilerEstado = 'COTIZACION' | 'ACTIVO' | 'FINALIZADO' | 'CANCELADO';

export interface ItemAlquilerDetalle {
  id?: string;
  itemId: string;
  nombreItem?: string;
  cantidad: number;
  tarifaAplicada: number;
  fechaInicio: Date;
  fechaFinEstimada: Date; // Usada para estimación al crear contrato
  fechaDevolucionReal?: Date; // Se setea al devolver
  subtotalLineaEstimado: number; // tarifaAplicada * diasEstimados * cantidad
  subtotalLineaReal?: number;
  diasReales?: number;
  costoDano?: number;
  devuelto?: boolean;
  cantidadDevuelta?: number;
}

export class AlquilerEntity extends BaseAuditableEntity {
  constructor(
    public readonly id: string | number | undefined,
    public readonly consecutivo: number | undefined,
    public readonly clienteId: string,
    public clienteNombre: string | undefined,
    public estado: AlquilerEstado,
    public subtotalEquiposEstimado: number,
    public fleteEntrega: number,
    public fleteRecogida: number,
    public subtotalGeneralEstimado: number,
    public totalEstimado: number,
    public deposito: number,
    public garantiaMonto: number,
    public garantiaTipo: string,
    public garantiaEstado: string,
    public observacionesGenerales: string | undefined,
    public detallesLogistica: string | undefined,
    public creadoPor: string | undefined,
    public detalles: ItemAlquilerDetalle[] = [],
    public totalReal?: number,
    public subtotalEquiposReal?: number,
    public subtotalGeneralReal?: number,
    public diferencialMonetario?: number,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date | null,
    deletedBy?: string | null
  ) {
    super(createdAt, updatedAt, deletedAt, deletedBy);
    this.calcularTotalesEstimados();
  }

  calcularTotalesEstimados(): void {
    const items = this.detalles || [];
    this.subtotalEquiposEstimado = items.reduce((acc, item) => acc + (item.subtotalLineaEstimado || 0), 0);
    const totalFletes = (this.fleteEntrega || 0) + (this.fleteRecogida || 0);
    this.subtotalGeneralEstimado = this.subtotalEquiposEstimado + totalFletes;
    this.totalEstimado = Math.max(0, this.subtotalGeneralEstimado - (this.deposito || 0));
  }

  activar(): void {
    if (this.estado === 'FINALIZADO' || this.estado === 'CANCELADO') {
      throw new Error(`No se puede activar un alquiler en estado ${this.estado}.`);
    }
    this.estado = 'ACTIVO';
    this.updatedAt = new Date();
  }

  finalizar(): void {
    this.estado = 'FINALIZADO';
    this.garantiaEstado = 'Liberada';
    this.updatedAt = new Date();
  }

  cancelar(): void {
    this.estado = 'CANCELADO';
    this.garantiaEstado = 'Anulada';
    this.updatedAt = new Date();
  }

  actualizarContrato(
    nuevosDetalles: ItemAlquilerDetalle[],
    fleteEntrega: number,
    fleteRecogida: number,
    deposito: number,
    garantiaMonto: number,
    garantiaTipo: string,
    observacionesGenerales: string | undefined,
    detallesLogistica: string | undefined
  ): void {
    if (this.estado === 'FINALIZADO' || this.estado === 'CANCELADO') {
      throw new Error(`No se puede editar un alquiler en estado ${this.estado}.`);
    }

    this.detalles = nuevosDetalles;
    this.fleteEntrega = fleteEntrega;
    this.fleteRecogida = fleteRecogida;
    this.deposito = deposito;
    this.garantiaMonto = garantiaMonto;
    this.garantiaTipo = garantiaTipo;
    this.observacionesGenerales = observacionesGenerales;
    this.detallesLogistica = detallesLogistica;
    this.updatedAt = new Date();

    this.calcularTotalesEstimados();
  }

  registrarDevolucion(equipoId: string, cantidadDevuelta: number, fechaDevolucionReal: Date, costoDano: number = 0): void {
    if (cantidadDevuelta <= 0) {
      throw new Error("La cantidad a devolver debe ser mayor a cero.");
    }
    
    const items = this.detalles || [];
    const index = items.findIndex(i => i.itemId === equipoId && !i.devuelto);
    if (index === -1) {
      throw new Error(`Item ${equipoId} no encontrado o ya fue devuelto en su totalidad.`);
    }

    const item = items[index];
    const cantidadPendiente = item.cantidad - (item.cantidadDevuelta || 0);

    if (cantidadDevuelta > cantidadPendiente) {
      throw new Error(`La cantidad a devolver (${cantidadDevuelta}) supera la cantidad pendiente (${cantidadPendiente}).`);
    }

    if (cantidadDevuelta < cantidadPendiente) {
      // SPLIT LINE
      const msDiffEst = item.fechaFinEstimada.getTime() - item.fechaInicio.getTime();
      const diasEstimados = Math.max(1, Math.ceil(msDiffEst / (1000 * 3600 * 24)));
      
      const newItemClonado: ItemAlquilerDetalle = {
        ...item,
        id: item.id ? `${item.id}-clon-${Date.now()}` : undefined,
        cantidad: Math.floor(cantidadDevuelta), // Asegurar enteros
        cantidadDevuelta: Math.floor(cantidadDevuelta),
        fechaDevolucionReal: fechaDevolucionReal,
        devuelto: true,
        costoDano: costoDano,
        subtotalLineaEstimado: item.tarifaAplicada * Math.floor(cantidadDevuelta) * diasEstimados
      };

      // Actualizar el item original
      item.cantidad = item.cantidad - Math.floor(cantidadDevuelta);
      item.subtotalLineaEstimado = item.tarifaAplicada * item.cantidad * diasEstimados;
      
      this.detalles.push(newItemClonado);
    } else {
      // Devolución completa de esta línea
      item.cantidadDevuelta = (item.cantidadDevuelta || 0) + Math.floor(cantidadDevuelta);
      item.fechaDevolucionReal = fechaDevolucionReal;
      item.devuelto = true;
      item.costoDano = (item.costoDano || 0) + costoDano;
    }
  }

  liquidarDevolucion(diasMinimosConfig: number): number {
    let subtotalEquiposReal = 0;
    
    this.detalles.forEach(item => {
      let diasReales = diasMinimosConfig;
      if (item.devuelto && item.fechaDevolucionReal) {
        const msDiff = item.fechaDevolucionReal.getTime() - item.fechaInicio.getTime();
        const diasCalculados = Math.max(1, Math.ceil(msDiff / (1000 * 3600 * 24)));
        diasReales = Math.max(diasMinimosConfig, diasCalculados);
      } else {
        // Aún no devuelto, usamos la fecha actual proyectada
        const msDiff = new Date().getTime() - item.fechaInicio.getTime();
        const diasCalculados = Math.max(1, Math.ceil(msDiff / (1000 * 3600 * 24)));
        diasReales = Math.max(diasMinimosConfig, diasCalculados);
      }
      
      item.diasReales = diasReales;
      item.subtotalLineaReal = item.tarifaAplicada * item.cantidad * diasReales + (item.costoDano || 0);
      subtotalEquiposReal += item.subtotalLineaReal;
    });

    this.subtotalEquiposReal = subtotalEquiposReal;
    const totalFletes = (this.fleteEntrega || 0) + (this.fleteRecogida || 0);
    this.subtotalGeneralReal = this.subtotalEquiposReal + totalFletes;
    this.totalReal = Math.max(0, this.subtotalGeneralReal - (this.deposito || 0));
    
    this.diferencialMonetario = this.totalReal - this.totalEstimado;
    
    return this.diferencialMonetario;
  }

  override softDelete(userId: string = "sistema"): void {
    if (this.estado === "ACTIVO") {
      throw new Error("No se puede eliminar un contrato en estado ACTIVO. Primero debe recibir las devoluciones o cancelarlo.");
    }
    super.softDelete(userId);
  }
}
