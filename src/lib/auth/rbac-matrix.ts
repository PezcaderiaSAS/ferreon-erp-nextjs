import { RoleType, Permission, UsuarioEntity } from "../../core/domain/entities/usuario";

export const PERMISOS_POR_ROL: Record<RoleType, Permission[]> = {
  SUPERADMIN: [
    "dashboard:view",
    "alquileres:read",
    "alquileres:create",
    "alquileres:edit",
    "alquileres:delete",
    "bodega:read",
    "bodega:create",
    "bodega:edit",
    "bodega:adjust_stock",
    "bodega:bulk_import",
    "devoluciones:read",
    "devoluciones:process",
    "facturacion:read",
    "facturacion:emit",
    "cartera:read",
    "cartera:collect",
    "clientes:read",
    "clientes:manage",
    "configuracion:manage",
    "auditoria:read",
    "usuarios:manage",
  ],
  ADMIN: [
    "dashboard:view",
    "alquileres:read",
    "alquileres:create",
    "alquileres:edit",
    "bodega:read",
    "bodega:create",
    "bodega:edit",
    "bodega:adjust_stock",
    "devoluciones:read",
    "devoluciones:process",
    "facturacion:read",
    "facturacion:emit",
    "cartera:read",
    "cartera:collect",
    "clientes:read",
    "clientes:manage",
    "configuracion:manage",
    "auditoria:read",
  ],
  OPERADOR_BODEGA: [
    "dashboard:view",
    "bodega:read",
    "bodega:create",
    "bodega:edit",
    "bodega:adjust_stock",
    "bodega:bulk_import",
    "devoluciones:read",
    "devoluciones:process",
    "alquileres:read",
    "clientes:read",
  ],
  FACTURACION_CARTERA: [
    "dashboard:view",
    "facturacion:read",
    "facturacion:emit",
    "cartera:read",
    "cartera:collect",
    "alquileres:read",
    "clientes:read",
    "clientes:manage",
  ],
  CONSULTOR_AUDITOR: [
    "dashboard:view",
    "alquileres:read",
    "bodega:read",
    "devoluciones:read",
    "facturacion:read",
    "cartera:read",
    "clientes:read",
    "auditoria:read",
  ],
};

export function hasPermission(rol: RoleType, permission: Permission): boolean {
  if (!rol || !PERMISOS_POR_ROL[rol]) return false;
  return PERMISOS_POR_ROL[rol].includes(permission);
}

export interface DemoUserAccount {
  id: string;
  nombre: string;
  email: string;
  rol: RoleType;
  cargo: string;
  avatar: string;
  descripcion: string;
}

export const USUARIOS_DEMO: DemoUserAccount[] = [
  {
    id: "USR-001",
    nombre: "Roberto Silva (Superadmin)",
    email: "superadmin@ferreon.com",
    rol: "SUPERADMIN",
    cargo: "Director General & TI",
    avatar: "RS",
    descripcion: "Acceso total, configuración, gestión de usuarios y auditoría completa.",
  },
  {
    id: "USR-002",
    nombre: "Carlos Gómez (Bodega)",
    email: "bodega@ferreon.com",
    rol: "OPERADOR_BODEGA",
    cargo: "Jefe de Patio & Logística",
    avatar: "CG",
    descripcion: "Gestión de stock físico, creación de equipos, carga masiva y devoluciones.",
  },
  {
    id: "USR-003",
    nombre: "Luisa Fernanda Peña (Facturación)",
    email: "cartera@ferreon.com",
    rol: "FACTURACION_CARTERA",
    cargo: "Especialista de Cobranzas y Cuentas",
    avatar: "LP",
    descripcion: "Emisión de cuentas de cobro, recibos de caja y abonos a contratos.",
  },
  {
    id: "USR-004",
    nombre: "Dra. Marcela Rincón (Auditora)",
    email: "auditoria@ferreon.com",
    rol: "CONSULTOR_AUDITOR",
    cargo: "Revisora Fiscal & Control Interno",
    avatar: "MR",
    descripcion: "Solo lectura general y acceso irrestricto al log de auditoría forense.",
  },
];

export const ROLE_INFO: Record<RoleType, { label: string; badgeClass: string; color: string; desc: string }> = {
  SUPERADMIN: {
    label: "Super Administrador",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    color: "#f43f5e",
    desc: "Control total del sistema",
  },
  ADMIN: {
    label: "Administrador Comercial",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    color: "#0ea5e9",
    desc: "Gestión comercial y operativa",
  },
  OPERADOR_BODEGA: {
    label: "Operador de Bodega",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    color: "#f59e0b",
    desc: "Control de stock y patio",
  },
  FACTURACION_CARTERA: {
    label: "Facturación & Cartera",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    color: "#10b981",
    desc: "Cuentas de cobro y recaudos",
  },
  CONSULTOR_AUDITOR: {
    label: "Auditor & Control",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    color: "#a855f7",
    desc: "Consulta y trazabilidad",
  },
};
