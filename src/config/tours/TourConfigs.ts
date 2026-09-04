import { TourStep } from '../../components/ui/InteractiveTour';

export const ALQUILERES_STEPS: TourStep[] = [
  {
    targetId: 'tour-filtros-alquileres',
    title: '🔍 ¡Encuentra todo rápido!',
    content: 'Usa esta barra para buscar clientes o filtrar contratos. Échale un vistazo y pasa al siguiente paso. 👉',
    forcedClick: false
  },
  {
    targetId: 'tour-nuevo-alquiler',
    title: '✨ ¡Tu primer contrato!',
    content: 'Haz clic en este botón rojo para crear un nuevo contrato. ¡Yo te guiaré adentro! 👇',
    forcedClick: true
  }
];

export const DEVOLUCIONES_STEPS: TourStep[] = [
  {
    targetId: 'tour-lista-devoluciones',
    title: '📦 Control de entregas',
    content: 'Aquí verás los equipos alquilados. Los que están en rojo están atrasados. Revisa la lista rápido. 👀',
    forcedClick: false
  },
  {
    targetId: 'tour-btn-devolucion-rapida',
    title: '✅ ¡Recibe los equipos!',
    content: 'Para registrar que un cliente devolvió algo, haz clic en este botón. ¡Inténtalo ahora! 👇',
    forcedClick: true
  }
];

export const FACTURACION_STEPS: TourStep[] = [
  {
    targetId: 'tour-kpis-facturacion',
    title: '💰 ¡Hora de los números!',
    content: 'Estos cuadros te dicen cuánto has ganado y quién te debe dinero este mes. Revísalos rápido. 📈',
    forcedClick: false
  },
  {
    targetId: 'tour-btn-generar-factura',
    title: '🧾 ¡Cobra sin estrés!',
    content: 'Haz clic en este botón para crear la factura de un cliente. ¡Vamos a facturar! 👇',
    forcedClick: true
  }
];
