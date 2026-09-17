/**
 * ==============================================================================
 * SERVICIO DE DOMINIO PURO: Gobernanza UltraAdmin, Licenciamiento & Feature Flags
 * ==============================================================================
 * Responsabilidad:
 *   1. Cálculo determinístico de vigencia de licencias y semáforo de días restantes.
 *   2. Evaluación de módulos activos por tenant (Feature Toggles).
 *   3. Resolución pura de permisos granulares (RBAC + Overwrites por usuario).
 * 
 * Reglas de Arquitectura:
 *   - Cero dependencias de I/O, base de datos o librerías externas.
 *   - Inmutabilidad estricta: siempre retorna nuevas estructuras de datos.
 *   - Precisión matemática en cálculo de días sobre UNIX Epoch (86.400.000 ms).
 * ==============================================================================
 */

export type LicenciaEstado = 'ACTIVA' | 'POR_VENCER' | 'EN_GRACIA' | 'VENCIDA';

export interface CalculoLicenciaResult {
  diasRestantes: number;
  estado: LicenciaEstado;
  enPeriodoGracia: boolean;
  diasMora: number;
  fechaExpiracionStr: string;
}

export type ModuloKey = 
  | 'ALQUILERES'
  | 'COTIZACIONES'
  | 'BODEGA'
  | 'COMPRAS'
  | 'CXP'
  | 'CAJA'
  | 'DEVOLUCIONES'
  | 'SUBCONTRATACIONES'
  | 'FACTURACION';

export const MODULOS_DISPONIBLES: { key: ModuloKey; nombre: string; descripcion: string }[] = [
  { key: 'ALQUILERES', nombre: 'Alquileres & Contratos', descripcion: 'Gestión comercial de contratos, reservas y entregas' },
  { key: 'COTIZACIONES', nombre: 'Cotizaciones Comerciales', descripcion: 'Ofertas tributarias y conversión atómica a contrato' },
  { key: 'BODEGA', nombre: 'Bodega & Inventario WMS', descripcion: 'Control de maquinaria, Kardex físico y stock disponible' },
  { key: 'COMPRAS', nombre: 'Compras & Costo Promedio (PMP)', descripcion: 'Órdenes de compra, recepción física y Kardex valorizado' },
  { key: 'CXP', nombre: 'Cuentas por Pagar (CXP)', descripcion: 'Cartera a proveedores, semáforo de morosidad y comprobantes de egreso' },
  { key: 'CAJA', nombre: 'Caja & Tesorería POS', descripcion: 'Aperturas, arqueos ciegos por denominación y control de efectivo' },
  { key: 'DEVOLUCIONES', nombre: 'Devoluciones & Split-Line', descripcion: 'Recepción técnica, clasificación de daños y compensación de garantía' },
  { key: 'SUBCONTRATACIONES', nombre: 'Maquinaria Subcontratada', descripcion: 'Equipos de aliados comerciales a dos tiempos y liquidación con retenciones' },
  { key: 'FACTURACION', nombre: 'Facturación Comercial', descripcion: 'Emisión formal de facturas y cuentas por cobrar en PDF' }
];

export type PermisosModuloCustom = Record<string, boolean>;
export type ModulosActivosMap = Record<ModuloKey, boolean>;

export function obtenerModulosDefault(): Record<ModuloKey, boolean> {
  return {
    ALQUILERES: true,
    COTIZACIONES: true,
    BODEGA: true,
    COMPRAS: true,
    CXP: true,
    CAJA: true,
    DEVOLUCIONES: true,
    SUBCONTRATACIONES: true,
    FACTURACION: true,
  };
}

export function moduloEstaHabilitado(
  modulos: Record<string, boolean> | ModuloKey[] | string[] | null | undefined,
  modulo: string
): boolean {
  if (!modulos) return true;
  if (Array.isArray(modulos)) {
    return modulos.some(m => String(m).trim().toUpperCase() === modulo.trim().toUpperCase());
  }
  if (typeof modulos === 'object') {
    const key = modulo.trim().toUpperCase();
    return modulos[key] !== false;
  }
  return true;
}

const MS_POR_DIA = 86_400_000;

/**
 * 1. Calcula los días de vigencia restantes y el estado del semáforo de una licencia
 */
export function calcularDiasLicenciaRestantes(
  fechaExpiracion: string | Date | null | undefined,
  fechaActual: Date = new Date(),
  diasGracia: number = 5
): CalculoLicenciaResult {
  if (!fechaExpiracion) {
    return {
      diasRestantes: 0,
      estado: 'VENCIDA',
      enPeriodoGracia: false,
      diasMora: 0,
      fechaExpiracionStr: ''
    };
  }

  const expDate = typeof fechaExpiracion === 'string' ? new Date(fechaExpiracion) : fechaExpiracion;
  if (isNaN(expDate.getTime())) {
    return {
      diasRestantes: 0,
      estado: 'VENCIDA',
      enPeriodoGracia: false,
      diasMora: 0,
      fechaExpiracionStr: ''
    };
  }

  const diferenciaMs = expDate.getTime() - fechaActual.getTime();
  const diasCalculados = Math.ceil(diferenciaMs / MS_POR_DIA);

  let estado: LicenciaEstado = 'ACTIVA';
  let enPeriodoGracia = false;
  let diasMora = 0;

  if (diasCalculados > 30) {
    estado = 'ACTIVA';
  } else if (diasCalculados > 0 && diasCalculados <= 30) {
    estado = 'POR_VENCER';
  } else {
    // Expiró: calcular días de mora transcurridos
    diasMora = Math.abs(diasCalculados);
    if (diasMora <= diasGracia) {
      estado = 'EN_GRACIA';
      enPeriodoGracia = true;
    } else {
      estado = 'VENCIDA';
      enPeriodoGracia = false;
    }
  }

  return {
    diasRestantes: diasCalculados,
    estado,
    enPeriodoGracia,
    diasMora,
    fechaExpiracionStr: expDate.toISOString().split('T')[0]
  };
}

/**
 * 2. Evalúa si un módulo de negocio está habilitado para el tenant
 */
export function evaluarModuloActivo(
  modulosActivos: ModuloKey[] | string[] | null | undefined,
  moduloSolicitado: string
): boolean {
  if (!modulosActivos || !Array.isArray(modulosActivos) || modulosActivos.length === 0) {
    return false;
  }

  const moduloNormalizado = moduloSolicitado.trim().toUpperCase();
  return modulosActivos.some(m => String(m).trim().toUpperCase() === moduloNormalizado);
}

/**
 * Mapa de permisos canónicos por defecto según el rol asignado
 */
const PERMISOS_BASE_ROL: Record<string, string[]> = {
  ULTRAADMIN: [
    'ACCESO_TOTAL',
    'GESTION_USUARIOS',
    'GESTION_EQUIPOS',
    'CREAR_ALQUILER',
    'ANULAR_PAGOS',
    'EDITAR_TARIFAS',
    'VER_CATALOGO',
    'ADMIN_TENANTS',
    'AUDITORIA_GLOBAL'
  ],
  SUPERADMIN: [
    'ACCESO_TOTAL',
    'GESTION_USUARIOS',
    'GESTION_EQUIPOS',
    'CREAR_ALQUILER',
    'ANULAR_PAGOS',
    'EDITAR_TARIFAS',
    'VER_CATALOGO'
  ],
  ADMIN: [
    'GESTION_USUARIOS',
    'GESTION_EQUIPOS',
    'CREAR_ALQUILER',
    'EDITAR_TARIFAS',
    'VER_CATALOGO'
  ],
  OPERADOR_BODEGA: [
    'GESTION_EQUIPOS',
    'VER_CATALOGO',
    'RECEPCION_DEVOLUCIONES',
    'AJUSTAR_STOCK'
  ],
  VENDEDOR: [
    'CREAR_ALQUILER',
    'VER_CATALOGO',
    'CREAR_COTIZACION',
    'VER_CLIENTES'
  ],
  FACTURACION_CARTERA: [
    'EMITIR_FACTURAS',
    'REGISTRAR_PAGOS',
    'VER_CLIENTES',
    'VER_CATALOGO'
  ]
};

/**
 * 3. Resuelve la lista efectiva de permisos para un usuario aplicando RBAC + Overwrites
 */
export function resolverPermisosEfectivos(
  rol: string,
  permisosCustom: Record<string, boolean> = {},
  estadoUsuario: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO' = 'ACTIVO'
): string[] {
  // Si el usuario no está activo, todos sus permisos quedan revocados inmediatamente
  if (estadoUsuario !== 'ACTIVO') {
    return [];
  }

  const rolNormalizado = rol.toUpperCase().trim();
  const base = new Set<string>(PERMISOS_BASE_ROL[rolNormalizado] || ['VER_CATALOGO']);

  // Aplicar sobreescrituras (overwrites) personalizadas del UltraAdmin
  if (permisosCustom && typeof permisosCustom === 'object') {
    for (const [permiso, habilitado] of Object.entries(permisosCustom)) {
      const permisoNormalizado = permiso.trim().toUpperCase();
      if (habilitado === true) {
        base.add(permisoNormalizado);
      } else if (habilitado === false) {
        base.delete(permisoNormalizado);
      }
    }
  }

  return Array.from(base);
}
