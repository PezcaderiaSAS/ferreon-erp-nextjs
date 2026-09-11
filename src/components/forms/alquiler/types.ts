import * as z from 'zod';

export const alquilerSchema = z.object({
  tipoDocumento: z.enum(['COTIZACION', 'CONTRATO']).default('COTIZACION'),
  cotizacionOrigenId: z.string().optional(),
  clienteId: z.string().min(1, 'Debe seleccionar un cliente'),
  fechaRegistro: z.string().min(1, 'La fecha de registro es requerida'),
  fechaInicioContrato: z.string().min(1, 'La fecha de inicio del alquiler es requerida').optional(),
  fechaFinEstimadaContrato: z.string().min(1, 'La fecha fin estimada es requerida').optional(),
  validezOfertaDias: z.number().min(1).default(15),
  fleteEntrega: z.number().min(0),
  fleteRecogida: z.number().min(0),
  deposito: z.number().min(0),
  depositoExoneradoCredito: z.boolean().default(false),
  garantiaTipo: z.string(),
  garantiaMonto: z.number().min(0).default(0),
  // Parámetros Tributarios Multipaís (LATAM)
  aplicaImpuesto: z.boolean().default(false),
  tasaImpuesto: z.number().min(0).max(100).default(19),
  valorImpuesto: z.number().min(0).optional(),
  nombreImpuesto: z.string().default('IVA'),
  despachoAutorizadoPor: z.string().optional(),
  observaciones: z.string().optional(),
  detallesLogistica: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().min(1, 'Seleccione un equipo'),
    cantidad: z.number().min(1, 'Cantidad mínima 1'),
    precioDiario: z.number().min(0, 'El precio no puede ser negativo'),
    fechaInicio: z.string().min(1, 'Fecha inicio requerida'),
    fechaFinEstimada: z.string().min(1, 'Fecha fin estimada requerida'),
    // Soporte para Subcontratación de Maquinaria (Re-Renting)
    esSubcontratado: z.boolean().default(false),
    proveedorAliadoNombre: z.string().optional(),
    proveedorAliadoNit: z.string().optional(),
    costoSubcontrato: z.number().min(0).optional(),
    fechaRecepcionMuelleTercero: z.string().optional(),
  })).min(1, 'Debe agregar al menos un equipo')
});

export type AlquilerSchemaType = z.infer<typeof alquilerSchema>;

export interface ItemRow {
  id: string;
  itemId: string;
  cantidad: number;
  precioDiario: number;
  fechaInicio: string;
  fechaFinEstimada: string;
  // Subcontratación
  esSubcontratado?: boolean;
  proveedorAliadoNombre?: string;
  proveedorAliadoNit?: string;
  costoSubcontrato?: number;
  fechaRecepcionMuelleTercero?: string;
}

export interface AlquilerFormProps {
  initialData?: any;
  modoInicial?: 'COTIZACION' | 'CONTRATO';
  cotizacionOrigenId?: string;
  onSuccess: (alquiler?: any) => void;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const ALQUILER_STEPS = [
  { id: 1, title: 'Cliente y Garantías', desc: 'Datos del cliente, cartera y pólizas' },
  { id: 2, title: 'Equipos y Logística', desc: 'Selección propia o subcontratada' },
  { id: 3, title: 'Resumen y Formalización', desc: 'Cotización o Contrato de Alquiler' },
] as const;
