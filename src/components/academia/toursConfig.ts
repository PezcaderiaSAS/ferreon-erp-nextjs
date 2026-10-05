import { TourStep } from '../ui/InteractiveTour';

export interface TourConfigDefinition {
  tourId: string;
  nombre: string;
  modulo: string;
  recompensaXP: number;
  steps: TourStep[];
}

/**
 * Catálogo de Tours Guiados para la Academia de Alquileres System.
 * Mapea cada misión de aprendizaje con los selectores DOM y la ruta correspondiente.
 */
export const TOURS_CONFIG_ACADEMIA: Record<string, TourConfigDefinition> = {
  'tour-alquileres-core': {
    tourId: 'alquileres-core',
    nombre: 'Tu Primer Contrato de Alquiler',
    modulo: 'Alquileres',
    recompensaXP: 100,
    steps: [
      {
        targetId: 'tour-filtros-alquileres',
        title: '🔍 Control de Alquileres',
        content: 'Filtra y busca contratos activos, vencidos o en preparación de forma instantánea.',
        route: '/alquileres',
      },
      {
        targetId: 'tour-nuevo-alquiler',
        title: '✨ Nuevo Contrato',
        content: 'Presiona aquí para iniciar el contrato. Selecciona el cliente, las fechas y los equipos a despachar.',
        route: '/alquileres',
        forcedClick: false,
      },
    ],
  },

  'tour-cotizaciones-express': {
    tourId: 'tour-cotizaciones-express',
    nombre: 'Cotizaciones Rápidas en 30s',
    modulo: 'Cotizaciones',
    recompensaXP: 100,
    steps: [
      {
        targetId: 'btn-nueva-cotizacion',
        title: '⚡ Cotización Express',
        content: 'Arma paquetes de maquinaria en segundos con tarifa diaria, semanal o mensual.',
        route: '/cotizaciones',
      },
      {
        targetId: 'lista-cotizaciones-tabla',
        title: '🤝 Cierre en WhatsApp',
        content: 'Con un clic envías el PDF por WhatsApp o formalizas a contrato apartando maquinaria.',
        route: '/cotizaciones',
      },
    ],
  },

  'tour-bodega-kardex': {
    tourId: 'tour-bodega-kardex',
    nombre: 'Patio de Maquinaria y Kardex',
    modulo: 'Bodega',
    recompensaXP: 120,
    steps: [
      {
        targetId: 'tour-bodega',
        title: '🚜 Stock en Tiempo Real',
        content: 'Monitorea cuántos equipos están disponibles en patio, cuántos en obra y cuántos en taller.',
        route: '/bodega',
      },
      {
        targetId: 'bodega-kpis-stock',
        title: '📊 Kardex y Mantenimiento',
        content: 'Registra mantenimientos preventivos y traslados sin descuadrar el inventario físico.',
        route: '/bodega',
      },
    ],
  },

  'tour-devolucion-splitline': {
    tourId: 'tour-devolucion-splitline',
    nombre: 'Inspección Split-Line y Devolución',
    modulo: 'Devoluciones',
    recompensaXP: 120,
    steps: [
      {
        targetId: 'tour-sort-devoluciones',
        title: '🔍 Recepción de Maquinaria',
        content: 'Revisa qué equipos están retornando hoy de las obras y clasifícalos por estado técnico.',
        route: '/devoluciones',
      },
      {
        targetId: 'tour-btn-devolucion-rapida',
        title: '✂️ Devolución Parcial (Split-Line)',
        content: 'Si el cliente entrega solo una parte, el contrato se divide automáticamente sin enredos.',
        route: '/devoluciones',
      },
    ],
  },

  'tour-facturacion-cobro': {
    tourId: 'tour-facturacion-cobro',
    nombre: 'Facturación y Cuentas de Cobro',
    modulo: 'Facturación',
    recompensaXP: 120,
    steps: [
      {
        targetId: 'tour-kpis-facturacion',
        title: '💰 Cartera y Facturación',
        content: 'Monitorea cuánto dinero hay en cuentas por cobrar y genera cuentas de cobro oficiales.',
        route: '/facturacion',
      },
      {
        targetId: 'tour-btn-generar-factura',
        title: '🧾 Cobros Pro-Rata',
        content: 'Liquida quincenas o meses exactos según los días reales que la maquinaria estuvo en obra.',
        route: '/facturacion',
      },
    ],
  },

  'tour-caja-arqueo': {
    tourId: 'tour-caja-arqueo',
    nombre: 'Caja Diaria y Arqueos',
    modulo: 'Caja',
    recompensaXP: 100,
    steps: [
      {
        targetId: 'caja-status-badge',
        title: '💵 Sesión de Caja Activa',
        content: 'Visualiza en tiempo real si tu turno de caja está abierto y el saldo actual en efectivo.',
        route: '/caja',
      },
      {
        targetId: 'caja-panel-arqueo',
        title: '⚖️ Arqueo y Cierre',
        content: 'Cuenta los billetes al final del día. El sistema calcula diferencias automáticamente.',
        route: '/caja',
      },
    ],
  },

  'tour-atajos': {
    tourId: 'tour-atajos',
    nombre: 'Navegación Ninja con Teclado',
    modulo: 'Atajos',
    recompensaXP: 80,
    steps: [
      {
        targetId: 'global-search-input',
        title: '🔍 Búsqueda Global (Ctrl+K)',
        content: 'Presiona la barra de búsqueda para encontrar contratos, clientes o máquinas en 1 segundo.',
        route: '/dashboard',
      },
      {
        targetId: 'top-nav-guia-botones',
        title: '📖 Guía 360° (Tecla F1)',
        content: 'Presiona F1 en cualquier momento para consultar qué hace cada botón y cómo fluye el sistema.',
        route: '/dashboard',
      },
    ],
  },

  'tour-global': {
    tourId: 'global',
    nombre: 'Visión General Alquileres System',
    modulo: 'Dashboard',
    recompensaXP: 80,
    steps: [
      {
        targetId: 'tour-sidebar',
        title: 'Navegación Principal',
        content: 'Desde aquí puedes acceder a todas las áreas del sistema: Alquileres, Bodega, Facturación y más.',
        route: '/dashboard',
      },
      {
        targetId: 'tour-filtros-alquileres',
        title: 'Filtros y Búsqueda',
        content: 'Utiliza estos controles para encontrar rápidamente contratos activos, cotizaciones o finalizados.',
        route: '/alquileres',
      },
      {
        targetId: 'tour-bodega',
        title: 'Control de Inventario',
        content: 'Revisa el stock disponible y configura tarifas desde el módulo de Bodega.',
        route: '/bodega',
      },
      {
        targetId: 'tour-facturacion',
        title: 'Gestión de Cartera',
        content: 'Monitorea saldos pendientes, registra abonos y genera cuentas de cobro desde Facturación.',
        route: '/facturacion',
      },
    ],
  },
};
