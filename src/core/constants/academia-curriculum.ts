import { MisionAprendizaje } from '@/core/types/gamification';

export interface BotonDidacticoItem {
  id: string;
  nombre: string;
  modulo: string;
  iconoNombre: string;
  badgeTexto: string;
  colorClase: string;
  queHace: string;
  cuandoSeUsa: string;
  trasBambalinas: string;
  atajoTeclado?: string;
}

export interface FlujoDidacticoItem {
  id: string;
  titulo: string;
  subtitulo: string;
  icono: string;
  colorBorde: string;
  descripcionApta12: string;
  pasos: Array<{
    paso: number;
    titulo: string;
    modulo: string;
    ruta: string;
    explicacion: string;
    impactoBodegaOCaja: string;
  }>;
}

export interface ModuloInfoDidactica {
  id: string;
  nombre: string;
  ruta: string;
  icono: string;
  color: string;
  metaforaApta12: string;
  objetivoPrincipal: string;
}

/**
 * 1. Los 12 Territorios / Módulos de Alquileres System explicados con metáforas visuales.
 */
export const MODULOS_SISTEMA_ACADEMIA: ModuloInfoDidactica[] = [
  {
    id: 'dashboard',
    nombre: 'Dashboard & Centro de Control',
    ruta: '/dashboard',
    icono: 'LayoutDashboard',
    color: 'amber',
    metaforaApta12: 'La torre de control del aeropuerto ✈️: Desde aquí ves en tiempo real toda la maquinaria que está trabajando en las obras y el dinero que va entrando.',
    objetivoPrincipal: 'Supervisar contratos activos, equipos en uso, alertas de devolución del día y metas de recaudo.',
  },
  {
    id: 'cotizaciones',
    nombre: 'Cotizaciones Rápidas',
    ruta: '/cotizaciones',
    icono: 'FileSpreadsheet',
    color: 'purple',
    metaforaApta12: 'La vitrina y mostrador de ventas 🏪: Preparas propuestas de precios en 30 segundos y las envías por WhatsApp como un mensaje elegante con PDF.',
    objetivoPrincipal: 'Calcular tarifas diarias, semanas o meses con transporte e impuestos sin comprometer inventario todavía.',
  },
  {
    id: 'alquileres',
    nombre: 'Alquileres & Contratos',
    ruta: '/alquileres',
    icono: 'CalendarDays',
    color: 'emerald',
    metaforaApta12: 'El apretón de manos oficial 🤝: El cliente aceptó el precio; aquí se genera el contrato legal que aparta la maquinaria de bodega.',
    objetivoPrincipal: 'Administrar los contratos vigentes, entregas en obra, fechas pactadas y garantías de respaldo.',
  },
  {
    id: 'bodega',
    nombre: 'Bodega, Kardex & Mantenimiento',
    ruta: '/bodega',
    icono: 'Package',
    color: 'blue',
    metaforaApta12: 'El patio y taller de maquinaria 🚜: Donde descansan, se cuentan y se arreglan los andamios, mezcladoras y plantas eléctricas.',
    objetivoPrincipal: 'Monitorear cuántos equipos hay libres para alquilar, cuántos están en obras y cuántos en reparación.',
  },
  {
    id: 'devoluciones',
    nombre: 'Devoluciones & Inspección Split-Line',
    ruta: '/devoluciones',
    icono: 'ArrowLeftRight',
    color: 'teal',
    metaforaApta12: 'La aduana de inspección al regresar de obra 🔍: El cliente devuelve los equipos; se revisan para verificar que no falten piezas ni estén rotos.',
    objetivoPrincipal: 'Reintegrar equipos al stock libre, mandar a taller si están dañados y liquidar la garantía del cliente.',
  },
  {
    id: 'facturacion',
    nombre: 'Facturación & Cuentas de Cobro',
    ruta: '/facturacion',
    icono: 'FileText',
    color: 'rose',
    metaforaApta12: 'El cobrador inteligente 🧾: Calcula cuántos días exactos trabajó la máquina en la quincena o mes y genera la cuenta de cobro oficial.',
    objetivoPrincipal: 'Emitir cuentas de cobro periódicas pro-rata, controlar cartera pendiente y registrar abonos.',
  },
  {
    id: 'caja',
    nombre: 'Caja & Movimientos POS',
    ruta: '/caja',
    icono: 'Wallet',
    color: 'emerald',
    metaforaApta12: 'La caja registradora de la oficina 💵: Entran pagos en efectivo o Nequi y salen pequeños gastos para gasolina o tornillos.',
    objetivoPrincipal: 'Apertura de turno de cajero, registro de entradas y salidas menores, y arqueo de billetes y monedas.',
  },
  {
    id: 'subcontrataciones',
    nombre: 'Subcontrataciones & Tercerización',
    ruta: '/subcontrataciones',
    icono: 'Handshake',
    color: 'indigo',
    metaforaApta12: 'Pedir prestado al amigo ferretero 🤝: Cuando te piden 100 andamios y solo tienes 60, le pides prestado a un aliado para no perder la venta.',
    objetivoPrincipal: 'Asegurar que la tarifa que le cobras al cliente sea mayor a lo que le pagas al aliado (Margen Positivo).',
  },
  {
    id: 'compras',
    nombre: 'Compras & Proveedores',
    ruta: '/compras',
    icono: 'ShoppingBag',
    color: 'orange',
    metaforaApta12: 'Hacer mercado para el negocio 🛒: Comprar nueva maquinaria o repuestos a fábricas para hacer crecer la empresa.',
    objetivoPrincipal: 'Registrar facturas de proveedores, entrada a inventario y actualizar el precio promedio ponderado (PMP).',
  },
  {
    id: 'clientes',
    nombre: 'Directorio de Clientes',
    ruta: '/clientes',
    icono: 'Users',
    color: 'cyan',
    metaforaApta12: 'La libreta de amigos constructores 📇: Teléfonos, direcciones de las obras, nombres de los ingenieros y cupo de crédito.',
    objetivoPrincipal: 'Conocer el historial completo de cada cliente y verificar si tiene deudas pendientes antes de alquilarle más.',
  },
  {
    id: 'suscripcion',
    nombre: 'Suscripción & Plan',
    ruta: '/suscripcion',
    icono: 'CreditCard',
    color: 'pink',
    metaforaApta12: 'La membresía de la plataforma 🎟️: Muestra si tu empresa está en periodo de prueba o suscripción activa Pro.',
    objetivoPrincipal: 'Gestionar el pago mensual del software y consultar límites de capacidad.',
  },
  {
    id: 'ultraadmin',
    nombre: 'Gobernanza UltraAdmin',
    ruta: '/admin/empresas',
    icono: 'ShieldCheck',
    color: 'slate',
    metaforaApta12: 'La cabina de seguridad del sistema 🛡️: Exclusiva para directores supremos que autorizan nuevas empresas y auditan accesos.',
    objetivoPrincipal: 'Gobernar inquilinos SaaS, asignar licencias de módulos y validar que no haya empresas piratas.',
  },
];

/**
 * 2. Catálogo Didáctico de Botones y Acciones del Sistema (> 40 botones).
 */
export const BOTONES_DIDACTICOS_CATALOGO: BotonDidacticoItem[] = [
  // ── Cotizaciones Rápidas ──────────────────────────────────────────
  {
    id: 'btn-cot-nueva',
    nombre: '⚡ Cotización Express (30s)',
    modulo: 'Cotizaciones',
    iconoNombre: 'Plus',
    badgeTexto: 'Venta Rápida',
    colorClase: 'bg-purple-600 text-white',
    queHace: 'Abre el formulario rápido para cotizar maquinaria con solo el nombre del cliente y teléfono.',
    cuandoSeUsa: 'Cuando un cliente llama o escribe por WhatsApp preguntando: "¿A cómo me deja 4 andamios para 10 días?".',
    trasBambalinas: 'Verifica si hay stock en bodega para avisarte al instante, pero NO reserva los equipos todavía.',
    atajoTeclado: 'C',
  },
  {
    id: 'btn-cot-formalizar',
    nombre: '🤝 Formalizar a Contrato (1-Clic)',
    modulo: 'Cotizaciones',
    iconoNombre: 'CheckCircle2',
    badgeTexto: 'Cierre de Trato',
    colorClase: 'bg-emerald-600 text-white',
    queHace: 'Convierte la cotización aceptada en un contrato de alquiler oficial ALQ-XXX con un solo clic.',
    cuandoSeUsa: 'Cuando el cliente dice: "¡Acepto el precio, mándeme las máquinas mañana a las 8 AM!".',
    trasBambalinas: 'Aparta las máquinas en bodega (stock disponible baja) y genera el número de contrato legal.',
  },
  {
    id: 'btn-cot-whatsapp',
    nombre: '📱 Enviar por WhatsApp',
    modulo: 'Cotizaciones',
    iconoNombre: 'Send',
    badgeTexto: 'Comunicación',
    colorClase: 'bg-emerald-500 text-white',
    queHace: 'Abre WhatsApp Web o la App con un mensaje listo y educado que incluye el resumen y enlace al PDF.',
    cuandoSeUsa: 'Inmediatamente después de crear la cotización para que el cliente la revise en su celular.',
    trasBambalinas: 'No toca inventario ni caja; solo genera un link seguro con el texto formateado.',
  },

  // ── Alquileres & Contratos ────────────────────────────────────────
  {
    id: 'btn-alq-nuevo',
    nombre: '➕ Nuevo Contrato de Alquiler',
    modulo: 'Alquileres',
    iconoNombre: 'Plus',
    badgeTexto: 'Despacho',
    colorClase: 'bg-slate-900 text-white',
    queHace: 'Inicia el asistente guiado para registrar un contrato completo con cliente, fechas y máquinas.',
    cuandoSeUsa: 'Cuando se va a despachar maquinaria directamente sin pasar por cotización previa.',
    trasBambalinas: 'Resta del stock disponible las unidades seleccionadas y calcula el subtotal y depósito de garantía.',
    atajoTeclado: 'C',
  },
  {
    id: 'btn-alq-detalle',
    nombre: '👁️ Ver Detalle 360°',
    modulo: 'Alquileres',
    iconoNombre: 'Eye',
    badgeTexto: 'Consulta',
    colorClase: 'bg-indigo-600 text-white',
    queHace: 'Muestra la ficha completa del contrato: qué máquinas están en obra, abonos hechos y días transcurridos.',
    cuandoSeUsa: 'Cuando necesitas saber qué tiene el cliente en obra o cuánto dinero falta por cobrar.',
    trasBambalinas: 'Solo lee información sin modificar bases de datos.',
    atajoTeclado: 'Enter',
  },
  {
    id: 'btn-alq-pdf',
    nombre: '📄 Imprimir Cuenta de Cobro / Contrato (PDF)',
    modulo: 'Alquileres',
    iconoNombre: 'Printer',
    badgeTexto: 'Documento Legal',
    colorClase: 'bg-blue-600 text-white',
    queHace: 'Genera el documento en PDF con logo de tu empresa, cláusulas legales y valor en letras.',
    cuandoSeUsa: 'Para que el conductor lleve la remisión firmada o para enviársela al departamento de compras del cliente.',
    trasBambalinas: 'Calcula montos en formato seguro (centavos) para que no falte ni sobre un solo peso.',
    atajoTeclado: 'Ctrl + P',
  },

  // ── Bodega & Inventario ───────────────────────────────────────────
  {
    id: 'btn-bod-nuevo-equipo',
    nombre: '➕ Registrar Nuevo Equipo',
    modulo: 'Bodega',
    iconoNombre: 'Plus',
    badgeTexto: 'Inventario',
    colorClase: 'bg-blue-600 text-white',
    queHace: 'Crea una nueva máquina en el catálogo con su código, nombre, peso en kilos y tarifa diaria.',
    cuandoSeUsa: 'Cuando compraste una mezcladora nueva o un lote de 20 parales para ponerlos en alquiler.',
    trasBambalinas: 'Crea el registro en inventario y asienta la entrada inicial en el Kardex inmutable.',
  },
  {
    id: 'btn-bod-kardex',
    nombre: '📊 Ver Historial Kardex',
    modulo: 'Bodega',
    iconoNombre: 'Clock',
    badgeTexto: 'Trazabilidad',
    colorClase: 'bg-slate-700 text-white',
    queHace: 'Muestra la historia completa de la máquina: cuándo entró, a qué obras fue y cuándo volvió.',
    cuandoSeUsa: 'Para auditorías, pérdidas o para saber cuántas veces se ha alquilado un equipo en el año.',
    trasBambalinas: 'Lee el libro de movimientos que nunca se puede borrar ni alterar.',
  },
  {
    id: 'btn-bod-liberar-mto',
    nombre: '🔧 Liberar de Mantenimiento',
    modulo: 'Bodega',
    iconoNombre: 'Wrench',
    badgeTexto: 'Taller',
    colorClase: 'bg-emerald-600 text-white',
    queHace: 'Indica que una máquina que estaba dañada o en pintura ya fue reparada y está lista para volver a trabajar.',
    cuandoSeUsa: 'Cuando el mecánico del taller avisa: "Ya le cambié el aceite al generador y está perfecto".',
    trasBambalinas: 'Mueve la unidad de "En Mantenimiento" hacia "Disponible en Bodega" de inmediato.',
  },

  // ── Devoluciones & Split-Line ─────────────────────────────────────
  {
    id: 'btn-dev-inspeccion',
    nombre: '📦 Inspección Técnica Split-Line',
    modulo: 'Devoluciones',
    iconoNombre: 'ArrowLeftRight',
    badgeTexto: 'Recepción',
    colorClase: 'bg-teal-600 text-white',
    queHace: 'Permite clasificar los equipos que vuelven: cuántos llegaron en Buen Estado, cuántos Rotos y cuántos Faltan.',
    cuandoSeUsa: 'Cuando el camión llega de la obra y descarga los andamios en el patio.',
    trasBambalinas: 'Lo bueno vuelve a stock disponible; lo roto va a taller; y lo que falte se le cobra al cliente.',
  },
  {
    id: 'btn-dev-parcial',
    nombre: '✂️ Devolución Parcial (Split-Line)',
    modulo: 'Devoluciones',
    iconoNombre: 'Scissors',
    badgeTexto: 'Flexibilidad',
    colorClase: 'bg-amber-600 text-white',
    queHace: 'Permite recibir solo una parte de las máquinas sin cerrar el contrato del cliente.',
    cuandoSeUsa: 'El cliente alquiló 10 andamios pero ya desarmó 4 y te los devuelve, quedándose con 6 en obra.',
    trasBambalinas: 'Divide el contrato: deja 6 corriendo cobro y los 4 devueltos dejan de cobrar tarifa diaria.',
  },

  // ── Facturación & Cuentas de Cobro ────────────────────────────────
  {
    id: 'btn-fac-corte',
    nombre: '📅 Generar Corte Quincenal / Mensual',
    modulo: 'Facturación',
    iconoNombre: 'Calendar',
    badgeTexto: 'Corte Pro-Rata',
    colorClase: 'bg-rose-600 text-white',
    queHace: 'Calcula cuántos días exactos estuvo la máquina en obra entre el 1 y el 15, o el 16 y el 30 del mes.',
    cuandoSeUsa: 'En quincenas o fin de mes para enviar la cuenta de cobro y que la constructora te pague.',
    trasBambalinas: 'Multiplica días reales por tarifa pactada y genera la cuenta correlativa CC-PER-XXXX.',
  },
  {
    id: 'btn-fac-abono',
    nombre: '💵 Registrar Abono o Pago',
    modulo: 'Facturación',
    iconoNombre: 'DollarSign',
    badgeTexto: 'Cobranza',
    colorClase: 'bg-emerald-600 text-white',
    queHace: 'Registra el dinero que el cliente transfirió o pagó en efectivo contra su deuda.',
    cuandoSeUsa: 'Cuando te llega la notificación bancaria de consignación o el cliente paga en ventanilla.',
    trasBambalinas: 'Disminuye la cartera pendiente del cliente y aumenta el saldo en Caja o Bancos.',
  },

  // ── Caja & Arqueos POS ────────────────────────────────────────────
  {
    id: 'btn-caj-apertura',
    nombre: '🔓 Apertura de Turno de Caja',
    modulo: 'Caja',
    iconoNombre: 'LockOpen',
    badgeTexto: 'Inicio de Día',
    colorClase: 'bg-emerald-600 text-white',
    queHace: 'Inicia el turno del cajero con una base de dinero para dar cambio.',
    cuandoSeUsa: 'A primera hora de la mañana (ej. 7:00 AM) antes de recibir el primer pago.',
    trasBambalinas: 'Asigna la responsabilidad del dinero a ese cajero específico (sesión única blindada).',
  },
  {
    id: 'btn-caj-gasto',
    nombre: '📤 Registrar Egreso Menor',
    modulo: 'Caja',
    iconoNombre: 'ArrowUpRight',
    badgeTexto: 'Gasto Menor',
    colorClase: 'bg-amber-600 text-white',
    queHace: 'Registra pequeñas salidas de dinero de la gaveta con su motivo y recibo.',
    cuandoSeUsa: 'Cuando compraste gasolina para la camioneta de despacho o café para los clientes.',
    trasBambalinas: 'Resta dinero del cajón de caja y lo manda a la cuenta de gastos contables.',
  },
  {
    id: 'btn-caj-arqueo',
    nombre: '🔒 Arqueo y Cierre de Caja',
    modulo: 'Caja',
    iconoNombre: 'CheckSquare',
    badgeTexto: 'Fin de Turno',
    colorClase: 'bg-slate-900 text-white',
    queHace: 'Cuenta cuántos billetes de 50.000, 20.000, 10.000 y monedas hay en el cajón y lo compara con el sistema.',
    cuandoSeUsa: 'Al terminar la jornada laboral (ej. 5:30 PM).',
    trasBambalinas: 'Verifica si el dinero coincide al centavo. Si sobra o falta dinero, genera un ajuste de auditoría.',
  },

  // ── Subcontrataciones ─────────────────────────────────────────────
  {
    id: 'btn-sub-nueva',
    nombre: '🤝 Nueva Orden de Subcontratación',
    modulo: 'Subcontrataciones',
    iconoNombre: 'Handshake',
    badgeTexto: 'Tercerización',
    colorClase: 'bg-indigo-600 text-white',
    queHace: 'Registra maquinaria que le pediste prestada a otro proveedor aliado para alquilársela a tu cliente.',
    cuandoSeUsa: 'Cuando no tienes suficiente stock en tu bodega y no quieres perder el cliente.',
    trasBambalinas: 'Verifica con semáforo inteligente que no cobres menos de lo que te cuesta el aliado (Margen Positivo).',
  },

  // ── Compras & Proveedores ─────────────────────────────────────────
  {
    id: 'btn-com-nueva',
    nombre: '🛒 Nueva Factura de Compra',
    modulo: 'Compras',
    iconoNombre: 'ShoppingBag',
    badgeTexto: 'Adquisición',
    colorClase: 'bg-orange-600 text-white',
    queHace: 'Registra la compra de equipos o materiales con su número de factura del proveedor y costo.',
    cuandoSeUsa: 'Cuando llega maquinaria nueva de la fábrica con su factura comercial.',
    trasBambalinas: 'Aumenta el inventario de la bodega y recalcula el costo promedio ponderado de los activos.',
  },

  // ── Atajos Globales de Teclado ────────────────────────────────────
  {
    id: 'btn-key-ctrlk',
    nombre: '⌨️ Paleta de Comandos (Ctrl + K)',
    modulo: 'Atajos',
    iconoNombre: 'Command',
    badgeTexto: 'Superpoder',
    colorClase: 'bg-slate-900 text-white',
    queHace: 'Despliega la barra de búsqueda y atajos rápidos sin importar en qué pantalla te encuentres.',
    cuandoSeUsa: 'Para crear contratos, buscar clientes o imprimir sin usar el mouse.',
    trasBambalinas: 'Agiliza la navegación en un 300%.',
    atajoTeclado: 'Ctrl + K',
  },
  {
    id: 'btn-key-slash',
    nombre: '⌨️ Buscar Rápido (Tecla /)',
    modulo: 'Atajos',
    iconoNombre: 'Search',
    badgeTexto: 'Atajo',
    colorClase: 'bg-slate-700 text-white',
    queHace: 'Pone el cursor en el buscador de la tabla activa al instante.',
    cuandoSeUsa: 'Para filtrar contratos, cotizaciones o máquinas sin tocar el ratón.',
    trasBambalinas: 'Filtra en 0 milisegundos sin recargar la página.',
    atajoTeclado: '/',
  },
  {
    id: 'btn-key-f1',
    nombre: '⌨️ Abrir Guía y Academia (Tecla F1)',
    modulo: 'Atajos',
    iconoNombre: 'HelpCircle',
    badgeTexto: 'Ayuda',
    colorClase: 'bg-amber-600 text-white',
    queHace: 'Abre este diccionario de botones y flujos desde cualquier rincón del sistema.',
    cuandoSeUsa: 'Cuando tengas duda de qué hace un botón o cómo funciona un proceso.',
    trasBambalinas: 'No altera datos; es tu biblioteca de consulta inmediata.',
    atajoTeclado: 'F1',
  },
];

/**
 * 3. Los 6 Flujos Maestros del Negocio ("El Viaje de la Maquinaria").
 */
export const FLUJOS_DIDACTICOS_MAESTROS: FlujoDidacticoItem[] = [
  {
    id: 'flujo-1-cotizacion-a-whatsapp',
    titulo: '1. Del Prospecto a la Cotización en WhatsApp',
    subtitulo: 'Cómo atender a un cliente nuevo en menos de 1 minuto sin errores.',
    icono: 'Send',
    colorBorde: 'border-purple-500',
    descripcionApta12: 'Aprende a registrar un cliente que llama a pedir precios, armar el paquete de andamios y mandarle el PDF por WhatsApp en 30 segundos.',
    pasos: [
      {
        paso: 1,
        titulo: 'Crear Cotización Rápida',
        modulo: 'Cotizaciones',
        ruta: '/cotizaciones',
        explicacion: 'Entra a Cotizaciones y pulsa "Nueva Cotización". Escribe el nombre del cliente y selecciona las máquinas.',
        impactoBodegaOCaja: 'No reserva stock; solo calcula el valor estimado.',
      },
      {
        paso: 2,
        titulo: 'Verificar Disponibilidad en Vivo',
        modulo: 'Cotizaciones',
        ruta: '/cotizaciones',
        explicacion: 'El sistema te muestra en verde si hay stock libre o en naranja si está casi agotado.',
        impactoBodegaOCaja: 'Evita prometer máquinas que no tienes en el patio.',
      },
      {
        paso: 3,
        titulo: 'Enviar enlace por WhatsApp',
        modulo: 'Cotizaciones',
        ruta: '/cotizaciones',
        explicacion: 'Pulsa el botón de WhatsApp. Se abre el chat con el mensaje pre-redactado y el enlace al documento PDF.',
        impactoBodegaOCaja: 'Cero impacto financiero; el cliente recibe la cotización formal.',
      },
    ],
  },
  {
    id: 'flujo-2-formalizacion-contrato',
    titulo: '2. De Cotización a Contrato y Apartado en Bodega',
    subtitulo: 'El paso mágico donde la propuesta se vuelve un trato real.',
    icono: 'CheckCircle2',
    colorBorde: 'border-emerald-500',
    descripcionApta12: 'Cuando el cliente dice que sí, con un solo clic conviertes la propuesta en un contrato oficial y el sistema aparta los equipos en bodega.',
    pasos: [
      {
        paso: 1,
        titulo: 'Pulsar "Formalizar Contrato"',
        modulo: 'Cotizaciones',
        ruta: '/cotizaciones',
        explicacion: 'Busca la cotización en la lista y presiona el botón verde de "Formalizar (1-Clic)".',
        impactoBodegaOCaja: 'El sistema valida que aún haya inventario disponible.',
      },
      {
        paso: 2,
        titulo: 'Reserva Inmediata en Bodega',
        modulo: 'Bodega',
        ruta: '/bodega',
        explicacion: 'Automáticamente, las máquinas pasan de "Disponibles" a "Reservadas para Despacho".',
        impactoBodegaOCaja: 'Nadie más podrá alquilar esas máquinas por error.',
      },
      {
        paso: 3,
        titulo: 'Generación del Contrato ALQ-XXX',
        modulo: 'Alquileres',
        ruta: '/alquileres',
        explicacion: 'El contrato aparece activo en el módulo de Alquileres listo para imprimir la remisión de salida.',
        impactoBodegaOCaja: 'Queda fijada la fecha de inicio para empezar a cobrar.',
      },
    ],
  },
  {
    id: 'flujo-3-despacho-entrega',
    titulo: '3. Despacho y Salida hacia la Obra',
    subtitulo: 'Cargar el transporte, firmar la remisión y despachar los equipos a obra.',
    icono: 'Truck',
    colorBorde: 'border-blue-500',
    descripcionApta12: 'El equipo de patio carga la maquinaria, el chofer lleva el contrato y el cliente firma la entrega en la construcción.',
    pasos: [
      {
        paso: 1,
        titulo: 'Imprimir Remisión / Contrato',
        modulo: 'Alquileres',
        ruta: '/alquileres',
        explicacion: 'Genera el PDF con las firmas del despachador y el receptor.',
        impactoBodegaOCaja: 'Respaldo legal firmado para reclamos o seguros.',
      },
      {
        paso: 2,
        titulo: 'Salida de Bodega',
        modulo: 'Bodega',
        ruta: '/bodega',
        explicacion: 'Los equipos quedan marcados formalmente como "En Obra / Alquilados".',
        impactoBodegaOCaja: 'El Kardex registra la salida física del patio.',
      },
    ],
  },
  {
    id: 'flujo-4-retorno-inspeccion-splitline',
    titulo: '4. Retorno e Inspección Técnica Split-Line',
    subtitulo: 'Recibir los equipos, revisar que no haya daños y liberar la garantía.',
    icono: 'ArrowLeftRight',
    colorBorde: 'border-teal-500',
    descripcionApta12: 'La obra terminó o el cliente desocupó parte de los andamios. Aquí revisas cómo volvieron y devuelves el depósito de garantía si todo está perfecto.',
    pasos: [
      {
        paso: 1,
        titulo: 'Descarga en Patio & Conteo',
        modulo: 'Devoluciones',
        ruta: '/devoluciones',
        explicacion: 'Abre la inspección técnica del contrato. Cuenta cuántas unidades llegaron.',
        impactoBodegaOCaja: 'Clasificas: Buen Estado, En Taller o Daño Total.',
      },
      {
        paso: 2,
        titulo: 'Devolución Parcial o Total (Split-Line)',
        modulo: 'Devoluciones',
        ruta: '/devoluciones',
        explicacion: 'Si solo devolvió 4 de 10 equipos, el contrato se divide limpiamente para seguir cobrando solo por los 6 que quedan en obra.',
        impactoBodegaOCaja: 'Los 4 equipos buenos vuelven a estar disponibles para otro cliente.',
      },
      {
        paso: 3,
        titulo: 'Acta de Retorno & Liquidación',
        modulo: 'Devoluciones',
        ruta: '/devoluciones',
        explicacion: 'Se emite el acta de inspección firmada y se libera el depósito de garantía.',
        impactoBodegaOCaja: 'Caja devuelve la garantía si no hubo daños.',
      },
    ],
  },
  {
    id: 'flujo-5-facturacion-pro-rata',
    titulo: '5. Facturación Periódica Pro-Rata y Cobro',
    subtitulo: 'Cobrar quincenas o meses exactos sin perder un solo día de canon.',
    icono: 'FileText',
    colorBorde: 'border-rose-500',
    descripcionApta12: 'Para contratos largos (ej. 3 meses en un edificio), cobras cada 15 o 30 días calculando los días exactos que cada máquina estuvo en obra.',
    pasos: [
      {
        paso: 1,
        titulo: 'Elegir el Periodo de Corte',
        modulo: 'Facturación',
        ruta: '/facturacion',
        explicacion: 'Selecciona "1ra Quincena" o "Mes Completo" en el panel de cortes periódicos.',
        impactoBodegaOCaja: 'El sistema intersecta las fechas de cada contrato con el periodo.',
      },
      {
        paso: 2,
        titulo: 'Emitir Cuentas de Cobro en Lote',
        modulo: 'Facturación',
        ruta: '/facturacion',
        explicacion: 'Con un clic generas las cuentas de cobro oficiales bajo el Art. 616-1 del Estatuto Tributario.',
        impactoBodegaOCaja: 'Asienta la cuenta por cobrar (CXC) en cartera.',
      },
      {
        paso: 3,
        titulo: 'Registrar el Pago Recibido',
        modulo: 'Facturación',
        ruta: '/facturacion',
        explicacion: 'Cuando el cliente transfiere, registras el abono total o parcial.',
        impactoBodegaOCaja: 'La deuda del cliente baja a cero y el dinero entra a Caja o Bancos.',
      },
    ],
  },
  {
    id: 'flujo-6-caja-pos-y-arqueo',
    titulo: '6. Caja Diaria, Gastos Menores y Arqueo de Cierre',
    subtitulo: 'Control del efectivo físico para que nunca falte ni sobre dinero.',
    icono: 'Wallet',
    colorBorde: 'border-emerald-500',
    descripcionApta12: 'Cómo iniciar el día con la base de cambio, pagar gastos pequeños de patio y contar los billetes al final del turno para cerrar la caja.',
    pasos: [
      {
        paso: 1,
        titulo: 'Apertura de Caja',
        modulo: 'Caja',
        ruta: '/caja',
        explicacion: 'El cajero abre su turno indicando con cuánto dinero en efectivo inicia.',
        impactoBodegaOCaja: 'Se crea la sesión activa única del cajero.',
      },
      {
        paso: 2,
        titulo: 'Cobros y Salidas Menores',
        modulo: 'Caja',
        ruta: '/caja',
        explicacion: 'Se reciben pagos de alquileres y se pagan pequeños gastos con recibo.',
        impactoBodegaOCaja: 'Cada peso queda registrado en el libro mayor contable.',
      },
      {
        paso: 3,
        titulo: 'Arqueo de Billetes y Monedas',
        modulo: 'Caja',
        ruta: '/caja',
        explicacion: 'Al final de la tarde, digitas cuántos billetes hay de cada denominación. El sistema verifica que coincida con el saldo.',
        impactoBodegaOCaja: 'Cierre del turno y reporte de cuadre perfecto.',
      },
    ],
  },
];

/**
 * 4. Las 12 Misiones de Aprendizaje de la Academia con Puntos XP.
 */
export const MISIONES_APRENDIZAJE_ACADEMIA: MisionAprendizaje[] = [
  {
    id: 'mision-bienvenida',
    modulo: 'Dashboard',
    titulo: 'Bienvenida a la Torre de Control ✈️',
    descripcionApta12: 'Conoce los 4 números mágicos del negocio: cuánta maquinaria está trabajando y cuánto dinero hay por cobrar.',
    recompensaXP: 100,
    tourId: 'tour-dashboard',
    ruta: '/dashboard',
    duracionMinutos: 2,
    icono: 'LayoutDashboard',
  },
  {
    id: 'mision-cotizacion-express',
    modulo: 'Cotizaciones',
    titulo: 'Tu Primera Cotización Express ⚡',
    descripcionApta12: 'Aprende a armar un presupuesto en 30 segundos y generar el enlace de WhatsApp.',
    recompensaXP: 100,
    tourId: 'tour-cotizaciones',
    ruta: '/cotizaciones',
    duracionMinutos: 2,
    icono: 'FileSpreadsheet',
  },
  {
    id: 'mision-contrato-alquiler',
    modulo: 'Alquileres',
    titulo: 'Firma y Despacho de Contrato 🤝',
    descripcionApta12: 'Aprende cómo un contrato aparta equipos de bodega y fija las fechas de cobro.',
    recompensaXP: 120,
    tourId: 'tour-alquileres',
    ruta: '/alquileres',
    duracionMinutos: 3,
    icono: 'CalendarDays',
  },
  {
    id: 'mision-bodega-kardex',
    modulo: 'Bodega',
    titulo: 'El Guardián del Patio y Taller 🚜',
    descripcionApta12: 'Descubre cómo saber cuántas máquinas están libres, cuántas en obra y cómo liberar las reparadas.',
    recompensaXP: 120,
    tourId: 'tour-bodega',
    ruta: '/bodega',
    duracionMinutos: 3,
    icono: 'Package',
  },
  {
    id: 'mision-splitline-devolucion',
    modulo: 'Devoluciones',
    titulo: 'Recepción Técnica Split-Line 🔍',
    descripcionApta12: 'Aprende a recibir equipos que vuelven de obra y separarlos entre buenos y dañados.',
    recompensaXP: 150,
    tourId: 'tour-devoluciones',
    ruta: '/devoluciones',
    duracionMinutos: 3,
    icono: 'ArrowLeftRight',
  },
  {
    id: 'mision-cuenta-cobro',
    modulo: 'Facturación',
    titulo: 'Cortes Quincenales y Cobranza 🧾',
    descripcionApta12: 'Domina los cortes por días reales en obra y la emisión de cuentas de cobro oficiales.',
    recompensaXP: 150,
    tourId: 'tour-facturacion',
    ruta: '/facturacion',
    duracionMinutos: 3,
    icono: 'FileText',
  },
  {
    id: 'mision-caja-pos',
    modulo: 'Caja',
    titulo: 'El Administrador del Efectivo 💵',
    descripcionApta12: 'Aprende a abrir la caja, registrar gastos pequeños y contar billetes en el arqueo.',
    recompensaXP: 120,
    tourId: 'tour-caja',
    ruta: '/caja',
    duracionMinutos: 2,
    icono: 'Wallet',
  },
  {
    id: 'mision-subcontrataciones',
    modulo: 'Subcontrataciones',
    titulo: 'Alianzas y Re-Renting Estratégico 🤝',
    descripcionApta12: 'Aprende a pedir prestado a otros ferreteros sin perder dinero usando el semáforo de margen.',
    recompensaXP: 100,
    tourId: 'tour-subcontrataciones',
    ruta: '/subcontrataciones',
    duracionMinutos: 2,
    icono: 'Handshake',
  },
  {
    id: 'mision-compras-pmp',
    modulo: 'Compras',
    titulo: 'Compras y Crecimiento de Inventario 🛒',
    descripcionApta12: 'Cómo ingresar nueva maquinaria a la empresa y calcular su costo promedio.',
    recompensaXP: 100,
    tourId: 'tour-compras',
    ruta: '/compras',
    duracionMinutos: 2,
    icono: 'ShoppingBag',
  },
  {
    id: 'mision-clientes-cartera',
    modulo: 'Clientes',
    titulo: 'Directorio y Crédito de Constructores 📇',
    descripcionApta12: 'Cómo revisar el historial de un cliente para saber si es confiable antes de alquilarle.',
    recompensaXP: 80,
    tourId: 'tour-clientes',
    ruta: '/clientes',
    duracionMinutos: 2,
    icono: 'Users',
  },
  {
    id: 'mision-atajos-teclado',
    modulo: 'Atajos',
    titulo: 'Navegación Ninja con Teclado ⌨️',
    descripcionApta12: 'Aprende los atajos Ctrl+K, F1 y la tecla / para operar el sistema a la velocidad de la luz.',
    recompensaXP: 80,
    tourId: 'tour-atajos',
    ruta: '/dashboard',
    duracionMinutos: 2,
    icono: 'Command',
  },
  {
    id: 'mision-gobernanza-ultraadmin',
    modulo: 'Gobernanza',
    titulo: 'La Cabina del Gerente Supremo 🛡️',
    descripcionApta12: 'Conoce cómo se protegen los datos de la empresa y cómo se auditan las licencias.',
    recompensaXP: 150,
    tourId: 'tour-ultraadmin',
    ruta: '/admin/empresas',
    duracionMinutos: 3,
    icono: 'ShieldCheck',
  },
];
