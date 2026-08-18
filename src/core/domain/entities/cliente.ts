export interface HistorialAlquilerCliente {
  id: string;
  consecutivo: number;
  estado: string;
  total: number;
  createdAt: Date;
}

export interface HistorialPagoCliente {
  id: string;
  facturaId: string;
  numeroCC: string;
  monto: number;
  createdAt: Date;
}

export interface EstadoCarteraCliente {
  totalFacturado: number;
  totalPagado: number;
  saldoPendiente: number;
}

export class ClienteEntity {
  constructor(
    public readonly id: string | undefined,
    public nitCedula: string,
    public nombre: string,
    public telefono: string | undefined,
    public email: string | undefined,
    public direccion: string | undefined,
    public activo: boolean = true,
    public readonly createdAt?: Date
  ) {
    this.sanitizarDatos();
  }

  sanitizarDatos(): void {
    if (!this.nitCedula) {
      throw new Error("El NIT o Cédula es obligatorio.");
    }
    if (!this.nombre) {
      throw new Error("El nombre o razón social es obligatorio.");
    }
    this.nitCedula = this.nitCedula.trim().toUpperCase();
    this.nombre = this.nombre.trim().toUpperCase();
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
  }
}
