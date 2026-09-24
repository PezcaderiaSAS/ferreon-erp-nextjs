/**
 * Configuración canónica de contenido, textos y planes para la Landing Page de Alquileres System.
 * Sincronizada 100% con los módulos operativos reales, KPIs del ERP y la normativa colombiana de moneda COP.
 */

export interface PricingTier {
  id: string;
  name: string;
  badge?: string;
  description: string;
  priceCOP: {
    monthly: number;
    annual: number;
  };
  priceUSD: {
    monthly: number;
    annual: number;
  };
  isPopular?: boolean;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: 'Zap' | 'Users' | 'ShieldCheck' | 'BarChart3';
  highlight: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
  avatarUrl: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  contractId: string;
  tag: string;
  tagColor: string;
  clientName: string;
  depositCOP: number;
  status: 'todo' | 'inprogress' | 'done';
}

export interface ERPModuleItem {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  role: string;
  roleColor: string;
  description: string;
  route: string;
  kpis: { label: string; value: string; hint?: string }[];
  highlights: string[];
  mockupType: 'alquileres' | 'devoluciones' | 'bodega' | 'compras' | 'subcontrataciones' | 'facturacion' | 'caja' | 'ultraadmin';
}

export interface ERPModuleCategory {
  id: string;
  label: string;
  badge: string;
  description: string;
  modules: ERPModuleItem[];
}

export const LANDING_CONFIG = {
  brand: {
    name: "Alquileres System",
    tagline: "La Plataforma Todo en Uno para Equipos Modernos de Maquinaria y Obras",
    shortDescription: "La plataforma integral para gestión de alquileres de maquinaria, cotizaciones en 1-clic, devoluciones parciales y arqueo de caja.",
    logoHref: "/",
  },

  navigation: {
    links: [
      { label: "Pilares", href: "#features" },
      { label: "Módulos ERP", href: "#modules" },
      { label: "Flujo Operativo", href: "#product" },
      { label: "Planes", href: "#pricing" },
      { label: "Testimonios", href: "#testimonials" },
    ],
    signIn: { label: "Iniciar Sesión", href: "/auth/login" },
    getStarted: { label: "Comenzar Gratis", href: "/auth/login" },
  },

  hero: {
    badge: "Plataforma Especializada en Maquinaria y Construcción",
    headline: "La Solución Integral para Alquiler de Maquinaria y Control de Obras",
    description: "Planifica contratos con depósitos en garantía, gestiona devoluciones parciales con inspección de averías y controla tu flujo de caja con arqueo por denominaciones en COP.",
    primaryCta: { label: "Comenzar Gratis →", href: "/auth/login" },
    secondaryCta: { label: "Ver Demostración", href: "#product" },
    trustBullets: [
      "Sin tarjeta de crédito requerida",
      "Prueba gratis de 14 días",
      "Normativa colombiana (COP sin centavos)",
    ],
    mockup: {
      title: "Control de Flota y Contratos",
      growthMetric: "+48%",
      growthLabel: "Rotación de Maquinaria",
      floatingTag: "Idempotencia & Cero Errores",
      kpis: [
        { label: "Equipos Alquilados", value: "124", badge: "+5% desde ayer", alert: false },
        { label: "Contratos Activos", value: "45", badge: "Estable", alert: false },
        { label: "Devoluciones Hoy", value: "12", badge: "Requiere atención", alert: true },
      ],
    },
  },

  trust: {
    title: "Confiado por más de 10,000 equipos y contratistas a nivel nacional",
    brands: [
      { name: "Constructora Bolivar", initials: "CB" },
      { name: "Amarilo", initials: "AM" },
      { name: "Marval", initials: "MV" },
      { name: "Conconcreto", initials: "CC" },
      { name: "Cusezar", initials: "CZ" },
      { name: "Arquitectura & Concreto", initials: "AC" },
    ],
  },

  features: {
    badge: "MÓDULOS DEL SISTEMA",
    title: "Diseñado para la operación real de alquileres y mostrador",
    subtitle: "Los 4 pilares operativos que eliminan pérdidas, controlan averías y blindan tu flujo de caja.",
    items: [
      {
        id: "contratos-cotizaciones",
        title: "Contratos & Cotizaciones Inteligentes",
        description: "Creación ágil con cálculo automático de días, tarifas escalonadas, fletes de entrega/recogida y depósitos en garantía con PDF oficial membretado.",
        iconName: "Zap",
        highlight: "PDF con Glosa Legal",
      },
      {
        id: "devoluciones-averias",
        title: "Devoluciones Parciales & Averías",
        description: "Recepción técnica tipo Split-Line: devuelve ítems parciales, liquida costos de daño contra el depósito y genera constancia de entrega al instante.",
        iconName: "ShieldCheck",
        highlight: "Inspección Split-Line",
      },
      {
        id: "caja-denominaciones",
        title: "Arqueo de Caja & Pagos Mixtos",
        description: "Arqueo diario por conteo de billetes en COP ($100k, $50k, $20k, $10k), control de efectivo vs transferencias y emisión de recibos de caja inmutables.",
        iconName: "BarChart3",
        highlight: "Arqueo COP Billetes",
      },
      {
        id: "subcontratacion-bodega",
        title: "Subcontratación & Control de Bodega",
        description: "Subalquila maquinaria a terceros cuando no tengas stock, calculando el margen comercial neto y controlando el retorno seguro a proveedores.",
        iconName: "Users",
        highlight: "Cálculo de Margen Neto",
      },
    ] as FeatureItem[],
  },

  erpModules: {
    badge: "ECOSISTEMA MODULAR COMPLETO",
    title: "8 Módulos de Operación Real en un Solo ERP",
    subtitle: "Cada aspecto de tu empresa de alquileres, mostrador, patio y tesorería está conectado en tiempo real.",
    categories: [
      {
        id: "operacion",
        label: "Operación & Contratos",
        badge: "Mostrador y Patio",
        description: "Ciclo comercial completo: cotizaciones con conversión inmediata y recepción de maquinaria.",
        modules: [
          {
            id: "alquileres",
            name: "Alquileres & Cotizaciones",
            shortName: "Contratos",
            badge: "Comercial & Obra",
            role: "Asesor Comercial",
            roleColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
            description: "Generación ágil de contratos con tarifas escalonadas (día, semana, mes), fletes de entrega/recogida, depósitos en custodia y PDF con glosa legal en COP.",
            route: "/alquileres",
            kpis: [
              { label: "Contratos Activos", value: "45", hint: "En obra activa hoy" },
              { label: "Depósitos en Custodia", value: "$42.500.000", hint: "Garantía respaldada" },
              { label: "Cotizaciones Abiertas", value: "18", hint: "Conversión en 1-clic" },
            ],
            highlights: [
              "Conversión automática de Cotización a Contrato",
              "Glosa oficial 'SON: PESOS M/CTE' para validez jurídica",
              "Prevención de doble click en mostrador (idempotente)",
            ],
            mockupType: "alquileres",
          },
          {
            id: "devoluciones",
            name: "Devoluciones Parciales (Split-Line)",
            shortName: "Devoluciones",
            badge: "Inspección Técnica",
            role: "Técnico de Patio",
            roleColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
            description: "Recepción de maquinaria por ítems individuales: retorna equipos en buen estado, liquida averías contra el depósito y emite constancia técnica.",
            route: "/devoluciones",
            kpis: [
              { label: "Retornos Hoy", value: "12", hint: "Inspecciones ejecutadas" },
              { label: "Averías Cobradas", value: "$850.000", hint: "Descontadas de garantía" },
              { label: "Depósitos Reembolsados", value: "$3.400.000", hint: "Sin novedades" },
            ],
            highlights: [
              "División de contrato por línea (Split-Line)",
              "Registro de horómetro final y daños por componente",
              "Acta de devolución firmada en PDF al instante",
            ],
            mockupType: "devoluciones",
          },
        ],
      },
      {
        id: "bodega_compras",
        label: "Bodega & Suministros",
        badge: "Almacén y Flota",
        description: "Trazabilidad de equipos serializados y abastecimiento directo con cuentas por pagar.",
        modules: [
          {
            id: "bodega",
            name: "Bodega, Kardex & Seriales",
            shortName: "Inventario",
            badge: "Trazabilidad 360°",
            role: "Jefe de Almacén",
            roleColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
            description: "Control de inventario por número de serie físico, horómetro, estado operativo (Disponible, En Obra, Mantenimiento) y Kardex de movimientos.",
            route: "/bodega",
            kpis: [
              { label: "Equipos en Flota", value: "348", hint: "Seriales registrados" },
              { label: "Tasa de Disponibilidad", value: "64%", hint: "Listos en almacén" },
              { label: "En Mantenimiento", value: "9", hint: "Preventivo / Correctivo" },
            ],
            highlights: [
              "Búsqueda insensible a tildes y mayúsculas",
              "Kardex histórico de despachos y retornos",
              "Alertas de horómetro para cambio de repuestos",
            ],
            mockupType: "bodega",
          },
          {
            id: "compras",
            name: "Compras & Cuentas por Pagar (CxP)",
            shortName: "Compras & CxP",
            badge: "Proveedores",
            role: "Coordinador de Compras",
            roleColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
            description: "Registro de órdenes de compra, entrada de almacén con comprobante en PDF, historial de abonos y control estricto de cartera a proveedores.",
            route: "/compras",
            kpis: [
              { label: "Proveedores Registrados", value: "24", hint: "Ferreterías y marcas" },
              { label: "Saldo por Pagar (CxP)", value: "$18.600.000", hint: "Facturas a crédito" },
              { label: "Abonos Realizados", value: "$12.400.000", hint: "Recibos de egreso emitidos" },
            ],
            highlights: [
              "Entrada oficial de almacén auditada",
              "Abonos parciales con liquidación en tiempo real",
              "Historial de pagos cruzado con Caja",
            ],
            mockupType: "compras",
          },
        ],
      },
      {
        id: "logistica_facturacion",
        label: "Logística & Facturación",
        badge: "Tercerización y Cartera",
        description: "Subalquiler de equipos a terceros con margen comercial y cobro de cartera.",
        modules: [
          {
            id: "subcontrataciones",
            name: "Subcontratación con Margen Neto",
            shortName: "Subcontrato",
            badge: "Rentabilidad Sin Activo",
            role: "Director de Operaciones",
            roleColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
            description: "Subalquila maquinaria de otros proveedores cuando no tengas stock, calculando el margen de ganancia comercial y monitoreando el retorno seguro.",
            route: "/subcontrataciones",
            kpis: [
              { label: "Subcontratos Activos", value: "7", hint: "Maquinaria en proyectos" },
              { label: "Margen Comercial Promedio", value: "32.4%", hint: "Utilidad neta generada" },
              { label: "Facturado a Proveedores", value: "$9.800.000", hint: "Costo tercerizado" },
            ],
            highlights: [
              "Calculadora de utilidad comercial en vivo",
              "Orden de subcontratación en PDF con glosa",
              "Trazabilidad de devolución al aliado",
            ],
            mockupType: "subcontrataciones",
          },
          {
            id: "facturacion",
            name: "Facturación & Pagos Mixtos",
            shortName: "Facturación",
            badge: "Cobranza & Cartera",
            role: "Contador / Tesorero",
            roleColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
            description: "Emisión de facturas y documentos equivalentes, control de cartera clasificada (Pendiente, Pagada, Vencida) y recibos de caja para pagos mixtos.",
            route: "/facturacion",
            kpis: [
              { label: "Recaudado este Mes", value: "$64.200.000", hint: "Ingresos consolidados" },
              { label: "Cartera Pendiente", value: "$8.900.000", hint: "Dentro del plazo acordado" },
              { label: "Efectividad de Recaudo", value: "94.8%", hint: "Cero cartera vencida >60d" },
            ],
            highlights: [
              "Pagos mixtos (Efectivo COP + Transferencia)",
              "Recibos de caja inmutables con código de trazabilidad",
              "Soporte de impuestos multipaís (IVA / IGV)",
            ],
            mockupType: "facturacion",
          },
        ],
      },
      {
        id: "tesoreria_admin",
        label: "Tesorería & UltraAdmin",
        badge: "Caja y Multi-Tenant",
        description: "Arqueo ciego en efectivo por denominaciones COP y gobierno multisede con Supabase RLS.",
        modules: [
          {
            id: "caja",
            name: "Caja & Arqueo por Billetes en COP",
            shortName: "Arqueo de Caja",
            badge: "Moneda Colombiana",
            role: "Cajero / Auditor",
            roleColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
            description: "Apertura, movimientos de ingreso/egreso y cuadre de turnos mediante conteo físico de billetes en COP ($100k, $50k, $20k, $10k, $5k, $2k) con detección de descuadres.",
            route: "/caja",
            kpis: [
              { label: "Base Inicial de Caja", value: "$300.000", hint: "Apertura de turno" },
              { label: "Efectivo Auditado", value: "$4.850.000", hint: "Conteo por denominación" },
              { label: "Descuadre Registrado", value: "$0", hint: "Cuadre 100% exacto" },
            ],
            highlights: [
              "Arqueo ciego: el cajero cuenta sin ver el saldo teórico",
              "Desglose de billetes según normativa colombiana",
              "Comprobante de cierre de caja inmutable",
            ],
            mockupType: "caja",
          },
          {
            id: "ultraadmin",
            name: "Gobernanza UltraAdmin & Multitenant",
            shortName: "UltraAdmin",
            badge: "Aislamiento RLS",
            role: "Super Administrador",
            roleColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
            description: "Supervisión transversal de empresas inquilinas (tenants), activación o desactivación granular de módulos por licencia y aislamiento hermético de datos.",
            route: "/admin/empresas",
            kpis: [
              { label: "Empresas en Producción", value: "14", hint: "Tenants aislados con RLS" },
              { label: "Módulos Licenciados", value: "88", hint: "Feature flags dinámicas" },
              { label: "Disponibilidad SaaS", value: "99.98%", hint: "PostgreSQL + Upstash Redis" },
            ],
            highlights: [
              "Row Level Security (RLS) estricto por tenant_id",
              "Activación modular en caliente sin reiniciar servicios",
              "Auditoría inmutable de accesos y estados de suscripción",
            ],
            mockupType: "ultraadmin",
          },
        ],
      },
    ] as ERPModuleCategory[],
  },

  productShowcase: {
    badge: "FLUJO OPERATIVO DE CONTRATOS",
    title: "Control integral desde la cotización hasta la liquidación",
    description: "Supervisa en tiempo real el ciclo de vida de cada equipo en obra. Con Alquileres System nunca perderás de vista un depósito de garantía ni una avería sin cobrar.",
    benefits: [
      "Inspección de devoluciones parciales con liquidación contra depósitos",
      "Prevención de doble click en mostrador (idempotencia garantizada)",
      "Emisión de PDF con glosa legal 'SON: ... PESOS M/CTE' en 1-clic",
      "Control estricto de números de serie, stock en obra y stock disponible",
    ],
    initialKanbanTasks: [
      {
        id: "task-1",
        title: "Retroexcavadora CAT 416F2",
        contractId: "#ALQ-089",
        tag: "En Obra",
        tagColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        clientName: "Constructora Omega",
        depositCOP: 1200000,
        status: "inprogress",
      },
      {
        id: "task-2",
        title: "Planta Eléctrica 10kVA Diésel",
        contractId: "#ALQ-088",
        tag: "Por Despachar",
        tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        clientName: "Ing. Roberto Sánchez",
        depositCOP: 600000,
        status: "todo",
      },
      {
        id: "task-3",
        title: "Andamio Tubular Certificado x4",
        contractId: "#ALQ-087",
        tag: "Liquidado (Sin Daño)",
        tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        clientName: "Mantenimientos S.A.S",
        depositCOP: 400000,
        status: "done",
      },
      {
        id: "task-4",
        title: "Compactador tipo Rana 5.5HP",
        contractId: "#ALQ-090",
        tag: "Inspección de Avería",
        tagColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        clientName: "Obras del Norte",
        depositCOP: 500000,
        status: "todo",
      },
    ] as KanbanCard[],
  },

  pricing: {
    badge: "PRECIOS TRANSPARENTES",
    title: "Planes diseñados para cada etapa de tu empresa",
    subtitle: "Tarifas claras en Pesos Colombianos (COP enteros sin centavos) o USD, sin costos ocultos.",
    discountBadge: "Ahorra 20% anual",
    tiers: [
      {
        id: "starter",
        name: "Starter",
        description: "Para pequeños negocios de alquiler o contratistas que inician la digitalización de sus contratos.",
        priceCOP: { monthly: 0, annual: 0 },
        priceUSD: { monthly: 0, annual: 0 },
        features: [
          "Hasta 3 miembros de equipo en mostrador",
          "Módulo de Cotizaciones y Contratos de Alquiler",
          "Generación de PDF con membrete institucional",
          "Catálogo de hasta 30 equipos con control de stock",
          "Soporte de la comunidad y actualizaciones",
        ],
        ctaLabel: "Comenzar Gratis",
        ctaHref: "/auth/login",
      },
      {
        id: "pro",
        name: "Pro",
        badge: "Más Popular",
        isPopular: true,
        description: "Para empresas de alquiler y ferreterías con flujo constante de obras, mostrador y entregas.",
        priceCOP: { monthly: 89000, annual: 71200 },
        priceUSD: { monthly: 19, annual: 15 },
        features: [
          "Todo lo incluido en Starter sin límites",
          "Módulo de Devoluciones Parciales (Split-Line)",
          "Control técnico de averías y cobro contra depósito",
          "Módulo de Arqueo de Caja por billetes en COP",
          "Recibos de caja y pagos mixtos (Efectivo / Transferencia)",
          "Soporte prioritario por WhatsApp y correo",
        ],
        ctaLabel: "Comenzar Prueba Gratis",
        ctaHref: "/auth/login",
      },
      {
        id: "business",
        name: "Business",
        description: "Para grandes flotas de maquinaria pesada, múltiples sedes y proyectos de infraestructura.",
        priceCOP: { monthly: 220000, annual: 176000 },
        priceUSD: { monthly: 49, annual: 39 },
        features: [
          "Todo lo incluido en Pro para flotas corporativas",
          "Módulo de Subcontratación a terceros con margen",
          "Gobernanza UltraAdmin con control de licencias",
          "Soporte multi-sede con bodegas descentralizadas",
          "Integración API / Webhooks para software contable",
          "Gerente de cuenta técnico dedicado 24/7",
        ],
        ctaLabel: "Contactar a Ventas",
        ctaHref: "/auth/login",
      },
    ] as PricingTier[],
  },

  testimonials: {
    badge: "TESTIMONIOS REALES",
    title: "Elegido por empresas líderes de maquinaria y construcción",
    items: [
      {
        id: "test-1",
        quote: "El módulo de devoluciones parciales y el descuento automático de averías contra el depósito nos resolvió disputas que antes nos costaban millones de pesos cada mes.",
        author: "Sara Morales",
        role: "Gerente de Operaciones",
        company: "Constructora del Valle",
        rating: 5,
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      },
      {
        id: "test-2",
        quote: "El arqueo de caja con el conteo de billetes en pesos colombianos es una maravilla. Cerramos turno en 5 minutos sin descuadres ni transferencias sin conciliar.",
        author: "David Londoño",
        role: "Director de Maquinaria y Equipos",
        company: "Andamios & Equipos Andinos",
        rating: 5,
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      },
      {
        id: "test-3",
        quote: "Cuando no tenemos stock propio, el módulo de subcontratación nos calcula el margen exacto y liquidamos al proveedor sin errores. No cambiamos FerreOn por nada.",
        author: "Emilce Cárdenas",
        role: "Contratista General de Infraestructura",
        company: "Construcciones Alfa S.A.S.",
        rating: 5,
        avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
      },
    ] as TestimonialItem[],
  },

  ctaBanner: {
    headline: "¿Listo para transformar la gestión de tus alquileres y maquinaria?",
    description: "Únete a cientos de empresas que ya liquidan contratos con precisión, controlan averías y aceleran su facturación.",
    ctaLabel: "Comenzar Prueba Gratis Ahora →",
    ctaHref: "/auth/login",
  },

  footer: {
    copyright: "© 2026 Alquileres System. Todos los derechos reservados.",
    sections: [
      {
        title: "Módulos Operativos",
        links: [
          { label: "Contratos & Cotizaciones", href: "#features" },
          { label: "Devoluciones & Averías", href: "#features" },
          { label: "Arqueo de Caja en COP", href: "#features" },
          { label: "Subcontratación a Terceros", href: "#features" },
        ],
      },
      {
        title: "Soluciones de Negocio",
        links: [
          { label: "Empresas de Maquinaria", href: "#features" },
          { label: "Constructores de Obra", href: "#features" },
          { label: "Alquiler de Andamios y Plantas", href: "#product" },
          { label: "Ferreterías Industriales", href: "#pricing" },
        ],
      },
      {
        title: "Legal y Normativo",
        links: [
          { label: "Términos de Servicio", href: "/terminos" },
          { label: "Política de Privacidad (Habeas Data)", href: "/privacidad" },
          { label: "Seguridad RLS y Cero Fuga IA", href: "/seguridad" },
          { label: "Guía RNBD & SIC Colombia", href: "/privacidad" },
        ],
      },
    ],
    social: [
      { platform: "Twitter / X", href: "https://x.com", icon: "Twitter" },
      { platform: "LinkedIn", href: "https://linkedin.com", icon: "Linkedin" },
      { platform: "GitHub", href: "https://github.com", icon: "Github" },
      { platform: "YouTube", href: "https://youtube.com", icon: "Youtube" },
    ],
  },
};
