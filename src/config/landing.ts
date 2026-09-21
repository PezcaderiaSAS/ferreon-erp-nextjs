/**
 * Configuración canónica de contenido, textos y planes para la Landing Page de Alquileres System.
 * Estructurada en base a la arquitectura de 9 secciones del SaaS Landing Page Layout.
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
  avatarName: string;
  status: 'todo' | 'inprogress' | 'done';
}

export const LANDING_CONFIG = {
  brand: {
    name: "Alquileres System",
    tagline: "The All-in-One Platform for Modern Teams",
    shortDescription: "La plataforma integral para gestión de alquileres de maquinaria, control de obras y facturación de equipos.",
    logoHref: "/",
  },

  navigation: {
    links: [
      { label: "Producto", href: "#features" },
      { label: "Soluciones", href: "#product" },
      { label: "Precios", href: "#pricing" },
      { label: "Testimonios", href: "#testimonials" },
    ],
    signIn: { label: "Iniciar Sesión", href: "/auth/login" },
    getStarted: { label: "Comenzar Gratis", href: "/auth/login" },
  },

  hero: {
    badge: "Más simple. Más inteligente. Juntos.",
    headline: "La Plataforma Todo en Uno para Equipos Modernos",
    description: "Planifica contratos de alquiler, controla despachos de maquinaria y maximiza la rentabilidad de tu flota con herramientas de última generación.",
    primaryCta: { label: "Comenzar Gratis →", href: "/auth/login" },
    secondaryCta: { label: "Ver Demostración", href: "#product" },
    trustBullets: [
      "Sin tarjeta de crédito requerida",
      "Prueba gratis de 14 días",
      "Cancela en cualquier momento",
    ],
    mockup: {
      title: "Resumen de Proyecto",
      growthMetric: "+48%",
      growthLabel: "Eficiencia Operativa",
      floatingTag: "Trabajo en Equipo Inteligente",
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
    badge: "CARACTERÍSTICAS",
    title: "Todo lo que necesitas para operar inteligentemente",
    subtitle: "Herramientas poderosas diseñadas para acelerar el éxito de tu empresa de alquileres.",
    items: [
      {
        id: "task-mgmt",
        title: "Gestión de Maquinaria y Equipos",
        description: "Controla stock, contratos activos, despachos y devoluciones con cálculo de días y tarifas.",
        iconName: "Zap",
        highlight: "Control de Flota",
      },
      {
        id: "team-collab",
        title: "Colaboración en Tiempo Real",
        description: "Conecta a tu equipo de mostrador, operarios de bodega y administración en una sola plataforma.",
        iconName: "Users",
        highlight: "Sincronizado",
      },
      {
        id: "secure-reliable",
        title: "Seguro y Altamente Confiable",
        description: "Tus datos protegidos con auditoría inmutable, control de accesos RBAC y respaldo en la nube.",
        iconName: "ShieldCheck",
        highlight: "100% Protegido",
      },
      {
        id: "analytics",
        title: "Analítica y Rentabilidad",
        description: "Toma decisiones informadas con métricas de utilización, cobros pendientes y rentabilidad de flota.",
        iconName: "BarChart3",
        highlight: "Métricas Clave",
      },
    ] as FeatureItem[],
  },

  productShowcase: {
    badge: "DISEÑADO PARA EQUIPOS",
    title: "Una mejor forma de gestionar tus alquileres",
    description: "Desde la cotización inicial hasta la liquidación final, Alquileres System te brinda las herramientas para mantener a tu equipo alineado y productivo.",
    benefits: [
      "Control ágil de contratos y tareas con arrastre intuitivo",
      "Colaboración y asignación de despachos en tiempo real",
      "Flujos de facturación y cotización personalizados",
      "100% adaptable a cualquier dispositivo móvil o de escritorio",
    ],
    initialKanbanTasks: [
      {
        id: "task-1",
        title: "Retroexcavadora CAT 416F2",
        contractId: "#ALQ-089",
        tag: "Contrato Obra",
        tagColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        avatarName: "Constructora Omega",
        status: "inprogress",
      },
      {
        id: "task-2",
        title: "Planta Eléctrica 10kVA",
        contractId: "#ALQ-088",
        tag: "Mantenimiento",
        tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        avatarName: "Ing. Sánchez",
        status: "todo",
      },
      {
        id: "task-3",
        title: "Andamio Tubular Certificado x4",
        contractId: "#ALQ-087",
        tag: "Liquidado",
        tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        avatarName: "Mantenimientos SAS",
        status: "done",
      },
      {
        id: "task-4",
        title: "Compactador tipo Rana 5.5HP",
        contractId: "#ALQ-090",
        tag: "Por Despachar",
        tagColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        avatarName: "Obras del Norte",
        status: "todo",
      },
    ] as KanbanCard[],
  },

  pricing: {
    badge: "PRECIOS",
    title: "Precios simples y transparentes",
    subtitle: "Elige el plan ideal para escalar la operación de tu negocio.",
    discountBadge: "Ahorra 20% anual",
    tiers: [
      {
        id: "starter",
        name: "Starter",
        description: "Ideal para profesionales independientes y bodegas en inicio de digitalización.",
        priceCOP: { monthly: 0, annual: 0 },
        priceUSD: { monthly: 0, annual: 0 },
        features: [
          "Hasta 3 miembros de equipo",
          "Gestión de hasta 30 equipos en inventario",
          "Cotizaciones básicas en PDF",
          "Soporte de la comunidad",
        ],
        ctaLabel: "Comenzar Gratis",
        ctaHref: "/auth/login",
      },
      {
        id: "pro",
        name: "Pro",
        badge: "Más Popular",
        isPopular: true,
        description: "Para empresas de alquileres y constructoras que requieren control total y analítica.",
        priceCOP: { monthly: 89000, annual: 71200 },
        priceUSD: { monthly: 19, annual: 15 },
        features: [
          "Todo lo incluido en Starter",
          "Equipos y contratos ilimitados",
          "Control de fletes, depósitos y averías",
          "Analítica y reportes de rentabilidad",
          "Soporte prioritario por WhatsApp y correo",
        ],
        ctaLabel: "Comenzar Prueba Gratis",
        ctaHref: "/auth/login",
      },
      {
        id: "business",
        name: "Business",
        description: "Para flotas corporativas de maquinaria pesada con múltiples sedes y gobernanza avanzada.",
        priceCOP: { monthly: 220000, annual: 176000 },
        priceUSD: { monthly: 49, annual: 39 },
        features: [
          "Todo lo incluido en Pro",
          "Usuarios y sedes ilimitadas",
          "Seguridad corporativa y control RBAC avanzado",
          "Integración API y webhooks para ERP contable",
          "Gerente de cuenta dedicado 24/7",
        ],
        ctaLabel: "Contactar a Ventas",
        ctaHref: "/auth/login",
      },
    ] as PricingTier[],
  },

  testimonials: {
    badge: "TESTIMONIOS",
    title: "Elegido por equipos líderes en todo el país",
    items: [
      {
        id: "test-1",
        quote: "Alquileres System transformó por completo el control de nuestra flota de maquinaria. Redujimos las pérdidas por averías y el cobro de días adicionales en un 40%.",
        author: "Sara Morales",
        role: "Gerente de Operaciones",
        company: "Constructora del Valle",
        rating: 5,
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      },
      {
        id: "test-2",
        quote: "Increíblemente intuitivo y potente. La coordinación entre el mostrador y los despachadores de bodega ahora es en tiempo real y sin papeles perdidos.",
        author: "David Londoño",
        role: "Director de Maquinaria y Equipos",
        company: "Andamios & Equipos Andinos",
        rating: 5,
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      },
      {
        id: "test-3",
        quote: "Nuestra rentabilidad operativa nunca había sido tan transparente. El cálculo automático de tarifas y las cuentas de cobro nos ahorran horas cada semana.",
        author: "Emilce Cárdenas",
        role: "Contratista General de Infraestructura",
        company: "Construcciones Alfa S.A.S.",
        rating: 5,
        avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
      },
    ] as TestimonialItem[],
  },

  ctaBanner: {
    headline: "¿Listo para transformar la gestión de tus alquileres?",
    description: "Únete a miles de equipos que ya maximizan su productividad, controlan su flota y aceleran su facturación.",
    ctaLabel: "Comenzar Gratis Ahora →",
    ctaHref: "/auth/login",
  },

  footer: {
    copyright: "© 2026 Alquileres System. Todos los derechos reservados.",
    sections: [
      {
        title: "Producto",
        links: [
          { label: "Características", href: "#features" },
          { label: "Showcase Kanban", href: "#product" },
          { label: "Planes de Precios", href: "#pricing" },
          { label: "Seguridad y RLS", href: "#features" },
        ],
      },
      {
        title: "Soluciones",
        links: [
          { label: "Empresas de Alquiler", href: "#features" },
          { label: "Contratistas de Obra", href: "#features" },
          { label: "Bodegas y Talleres", href: "#product" },
          { label: "Control de Cartera", href: "#pricing" },
        ],
      },
      {
        title: "Legal y Privacidad",
        links: [
          { label: "Términos de Servicio", href: "#" },
          { label: "Política de Privacidad", href: "#" },
          { label: "Cumplimiento DIAN / LATAM", href: "#" },
          { label: "Seguridad de Datos", href: "#" },
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
