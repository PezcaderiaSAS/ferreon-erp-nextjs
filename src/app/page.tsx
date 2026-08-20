"use client";

import { DevolucionEntity } from '../core/domain/entities/devolucion';
import { PagoEntity } from '../core/domain/entities/pago';
import { RegistrarDevolucionModal } from './components/devoluciones/RegistrarDevolucionModal';
import { HistorialDevolucionesModal } from './components/devoluciones/HistorialDevolucionesModal';
import { RegistrarPagoModal } from './components/cartera/RegistrarPagoModal';
import { HistorialPagosModal } from './components/cartera/HistorialPagosModal';

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Package, 
  FileText, 
  RotateCcw, 
  Plus, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  BarChart3, 
  Sparkles, 
  Layers, 
  LayoutDashboard, 
  Users, 
  Receipt, 
  ArrowLeft, 
  Search, 
  Edit, 
  History, 
  X, 
  UserPlus, 
  Mail, 
  Phone, 
  MapPin, 
  FileCheck, 
  CreditCard, 
  Wallet, 
  AlertCircle, 
  Check, 
  PackagePlus, 
  FileSpreadsheet, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Scale, 
  Eye, 
  FileDown, 
  ArrowRight, 
  Printer, 
  Truck, 
  Car, 
  FileEdit,
  UserCheck,
  Settings,
  Upload,
  Image as ImageIcon,
  Landmark,
  BadgePercent,
  Menu,
  PanelLeftClose,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  Boxes,
  Tags,
  FolderPlus,
  Lock,
  Unlock,
  Shield,
  KeyRound,
  ShieldAlert,
  Fingerprint,
  LogIn,
  LogOut,
  FileSearch,
  Activity,
  UserX
} from "lucide-react";
import { EnterprisePDFService, DocumentoPDFPayload } from "../core/services/pdf-factura-generator.service";
import { formatearMonedaCOP } from "../core/utils/numero-a-letras";
import { EmpresaConfig, DEFAULT_EMPRESA_CONFIG } from "../core/domain/entities/empresa-config";
import { 
  USUARIOS_DEMO, 
  ROLE_INFO, 
  hasPermission, 
  DemoUserAccount, 
  PERMISOS_POR_ROL 
} from "../lib/auth/rbac-matrix";
import { RoleType, Permission } from "../core/domain/entities/usuario";
import { 
  AuditLogEntity, 
  AuditActionType, 
  AuditModuloType, 
  AuditDetalleCambio 
} from "../core/domain/entities/audit-log";

interface CategoriaDef {
  nombre: string;
  subcategorias: string[];
}

const CATEGORIAS_DEFAULT: CategoriaDef[] = [
  {
    nombre: "MAQUINARIA",
    subcategorias: ["CONCRETO", "COMPACTACIÓN", "CORTE Y PAVIMENTO", "DEMOLICIÓN PESADA", "GENERAL"],
  },
  {
    nombre: "HERRAMIENTAS",
    subcategorias: ["ELÉCTRICAS", "PERFORACIÓN", "DEMOLICIÓN LIVIANA", "MANUALES", "GENERAL"],
  },
  {
    nombre: "ESTRUCTURAS",
    subcategorias: ["ANDAMIOS MULTIDIRECCIONALES", "ANDAMIOS COLGANTES", "ENCOFRADOS", "PUNTALES", "GENERAL"],
  },
  {
    nombre: "GENERACIÓN",
    subcategorias: ["PLANTAS ELÉCTRICAS", "TORRES DE ILUMINACIÓN", "COMPRESORES", "GENERAL"],
  },
  {
    nombre: "EQUIPOS MENORES",
    subcategorias: ["BOMBAS DE AGUA", "HIDROLAVADORAS", "VIBRADORES", "SOLDADORES", "GENERAL"],
  },
];

type TabType = "dashboard" | "alquileres" | "bodega" | "devoluciones" | "facturacion" | "cartera" | "clientes" | "auditoria" | "configuracion";
type AlquilerEstadoFilter = "TODOS" | "ACTIVO" | "COTIZACION" | "FINALIZADO";

interface Cliente {
  id: string;
  nitCedula: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  activo: boolean;
}

interface Equipo {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  subcategoria: string;
  tarifaDiaria: number;
  stockTotal: number;
  stockDisponible: number;
  stockEnObra: number;
  activo: boolean;
}

interface ItemContratoLinea {
  equipoId: string;
  cantidad: number;
  tarifaDiaria: number;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
}

interface ContratoAlquiler {
  id: string;
  consecutivo: number;
  clienteId: string;
  clienteNombre: string;
  estado: "COTIZACION" | "ACTIVO" | "FINALIZADO" | "CANCELADO";
  subtotalEquipos: number;
  fleteEntrega: number;
  fleteRecogida: number;
  subtotalGeneral: number;
  total: number;
  deposito: number;
  totalPagado: number;
  garantiaMonto: number;
  garantiaTipo: string;
  garantiaEstado: string;
  observaciones?: string;
  detallesLogistica?: string;
  fechaInicioGeneral: string;
  items: Array<{
    equipoId: string;
    codigo: string;
    nombre: string;
    cantidad: number;
    tarifaDiaria: number;
    fechaInicio: string;
    fechaFin: string;
    dias: number;
    subtotal: number;
    devuelto: boolean;
    cantidadDevuelta?: number;
    costoDano?: number;
  }>;
  createdAt: string;
}

interface FacturaEmitida {
  id: string;
  numeroConsecutivo: number;
  alquilerId: string;
  consecutivoAlquiler: number;
  clienteNombre: string;
  subtotal: number;
  costosDano: number;
  depositoAplicado: number;
  totalPagar: number;
  estadoPago: "EMITIDA" | "PAGADA";
  createdAt: string;
}

interface ReciboPago {
  id: string;
  consecutivo: number;
  alquilerId: string;
  consecutivoAlquiler: number;
  clienteNombre: string;
  monto: number;
  metodoPago: "TRANSFERENCIA" | "EFECTIVO" | "NEQUI" | "DAVIPLATA" | "CHEQUE" | "CONSIGNACION" | "DATAFONO";
  referencia: string;
  fecha: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("alquileres");
  const [previousTab, setPreviousTab] = useState<TabType | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Catálogo Maestro de Categorías y Subcategorías Dinámicas
  const [categoriasMaster, setCategoriasMaster] = useState<CategoriaDef[]>(CATEGORIAS_DEFAULT);

  // Cerrar el menú lateral con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  // Fecha de hoy
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultFinStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Configuración de la Empresa
  const [empresaConfig, setEmpresaConfig] = useState<EmpresaConfig>(DEFAULT_EMPRESA_CONFIG);
  const [logoPreview, setLogoPreview] = useState<string | null>(empresaConfig.logoBase64 || null);

  // Lista de Clientes
  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: "CLI-01",
      nombre: "CONSTRUCTORA BOLÍVAR S.A.S.",
      nitCedula: "900.123.456-7",
      telefono: "310 987 6543",
      email: "compras@constructorabolivar.com",
      direccion: "Carrera 7 # 156-68 Piso 8, Bogotá D.C.",
      activo: true,
    },
    {
      id: "CLI-02",
      nombre: "INGENIERÍA & OBRAS CIVILES DEL LLANO",
      nitCedula: "901.876.543-2",
      telefono: "315 444 8899",
      email: "proyectos@obrasllano.com",
      direccion: "Calle 24 # 12-40, Villavicencio",
      activo: true,
    }
  ]);

  // Catálogo de Bodega con Categoría y Subcategoría
  const [equipos, setEquipos] = useState<Equipo[]>([
    { id: "EQ-001", codigo: "MEZ-01", nombre: "MEZCLADORA DE CONCRETO 2 BULTOS (MOTOR 13HP)", categoria: "MAQUINARIA", subcategoria: "CONCRETO", tarifaDiaria: 45000, stockTotal: 10, stockDisponible: 8, stockEnObra: 2, activo: true },
    { id: "EQ-002", codigo: "VIB-02", nombre: "VIBRADOR DE CONCRETO ELÉCTRICO 2HP (MANGUERA 4M)", categoria: "EQUIPOS MENORES", subcategoria: "VIBRADORES", tarifaDiaria: 25000, stockTotal: 15, stockDisponible: 14, stockEnObra: 1, activo: true },
    { id: "EQ-003", codigo: "DEM-03", nombre: "DEMOLEDOR ELÉCTRICO 30KG (ENCABEZADO HEX 28MM)", categoria: "HERRAMIENTAS", subcategoria: "DEMOLICIÓN LIVIANA", tarifaDiaria: 65000, stockTotal: 8, stockDisponible: 8, stockEnObra: 0, activo: true },
    { id: "EQ-004", codigo: "AND-04", nombre: "ANDAMIO MULTIDIRECCIONAL (MÓDULO 1.5M X 1.5M)", categoria: "ESTRUCTURAS", subcategoria: "ANDAMIOS MULTIDIRECCIONALES", tarifaDiaria: 12000, stockTotal: 50, stockDisponible: 45, stockEnObra: 5, activo: true },
    { id: "EQ-005", codigo: "COR-05", nombre: "CORTADORA DE PAVIMENTO 13HP (DISCO 14 PULGADAS)", categoria: "MAQUINARIA", subcategoria: "CORTE Y PAVIMENTO", tarifaDiaria: 85000, stockTotal: 5, stockDisponible: 4, stockEnObra: 1, activo: true },
    { id: "EQ-006", codigo: "PLA-06", nombre: "PLANTA ELÉCTRICA 6.5 KW (DIÉSEL MONOFÁSICA)", categoria: "GENERACIÓN", subcategoria: "PLANTAS ELÉCTRICAS", tarifaDiaria: 75000, stockTotal: 6, stockDisponible: 6, stockEnObra: 0, activo: true },
  ]);

  // Estados Bodega e Inventario (Búsqueda, Filtros multinivel y Modales)
  const [bodegaSearchQuery, setBodegaSearchQuery] = useState<string>("");
  const [bodegaCategoriaFilter, setBodegaCategoriaFilter] = useState<string>("TODAS");
  const [bodegaSubcategoriaFilter, setBodegaSubcategoriaFilter] = useState<string>("TODAS");
  const [bodegaDisponibilidadFilter, setBodegaDisponibilidadFilter] = useState<"TODOS" | "DISPONIBLE" | "AGOTADO">("TODOS");

  // Modal Crear/Editar Equipo Individual
  const [showEquipoModal, setShowEquipoModal] = useState<boolean>(false);
  const [equipoEnEdicion, setEquipoEnEdicion] = useState<Equipo | null>(null);
  const [equipoFormCodigo, setEquipoFormCodigo] = useState<string>("");
  const [equipoFormNombre, setEquipoFormNombre] = useState<string>("");
  const [equipoFormCategoria, setEquipoFormCategoria] = useState<string>("MAQUINARIA");
  const [equipoFormSubcategoria, setEquipoFormSubcategoria] = useState<string>("CONCRETO");
  const [equipoFormTarifaDiaria, setEquipoFormTarifaDiaria] = useState<number>(45000);
  const [equipoFormStockTotal, setEquipoFormStockTotal] = useState<number>(5);
  const [equipoFormActivo, setEquipoFormActivo] = useState<boolean>(true);
  const [equipoFormError, setEquipoFormError] = useState<string | null>(null);

  // Modales de Creación Rápida de Categorías y Subcategorías al vuelo
  const [showNuevaCategoriaModal, setShowNuevaCategoriaModal] = useState<boolean>(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState<string>("");
  const [nuevaCatSubcatInicial, setNuevaCatSubcatInicial] = useState<string>("");
  const [nuevaCatError, setNuevaCatError] = useState<string | null>(null);

  const [showNuevaSubcategoriaModal, setShowNuevaSubcategoriaModal] = useState<boolean>(false);
  const [nuevaSubcatNombre, setNuevaSubcatNombre] = useState<string>("");
  const [nuevaSubcatCategoriaTarget, setNuevaSubcatCategoriaTarget] = useState<string>("MAQUINARIA");
  const [nuevaSubcatError, setNuevaSubcatError] = useState<string | null>(null);

  // Modal Detalle / Ficha Técnica de Equipo
  const [showDetalleEquipoModal, setShowDetalleEquipoModal] = useState<boolean>(false);
  const [selectedEquipoDetalle, setSelectedEquipoDetalle] = useState<Equipo | null>(null);

  // Modal Carga Masiva
  const [showCargaMasivaModal, setShowCargaMasivaModal] = useState<boolean>(false);
  const [cargaMasivaTab, setCargaMasivaTab] = useState<"TABLA" | "TEXTO">("TABLA");
  const [cargaMasivaFilas, setCargaMasivaFilas] = useState<Array<{
    codigo: string;
    nombre: string;
    categoria: string;
    subcategoria: string;
    tarifaDiaria: number;
    stockTotal: number;
  }>>([
    { codigo: "TAL-07", nombre: "TALADRO PERCUTOR INDUSTRIAL 1/2 PULGADA (850W)", categoria: "HERRAMIENTAS", subcategoria: "ELÉCTRICAS", tarifaDiaria: 20000, stockTotal: 8 },
    { codigo: "COM-08", nombre: "COMPACTADORA TIPO CANGURO MOTOR 4 TIEMPOS", categoria: "MAQUINARIA", subcategoria: "COMPACTACIÓN", tarifaDiaria: 70000, stockTotal: 4 },
  ]);
  const [cargaMasivaTexto, setCargaMasivaTexto] = useState<string>("");
  const [cargaMasivaError, setCargaMasivaError] = useState<string | null>(null);
  const [cargaMasivaSuccess, setCargaMasivaSuccess] = useState<string | null>(null);

  // Contratos de Alquiler Iniciales
  const [contratos, setContratos] = useState<ContratoAlquiler[]>([
    {
      id: "ALQ-1002",
      consecutivo: 1002,
      clienteId: "CLI-01",
      clienteNombre: "CONSTRUCTORA BOLÍVAR S.A.S.",
      estado: "ACTIVO",
      subtotalEquipos: 405000,
      fleteEntrega: 35000,
      fleteRecogida: 35000,
      subtotalGeneral: 475000,
      total: 425000,
      deposito: 50000,
      totalPagado: 200000,
      garantiaMonto: 300000,
      garantiaTipo: "Efectivo",
      garantiaEstado: "Activa",
      observaciones: "Entrega prioritaria en obra proyecto Fontanar",
      detallesLogistica: "Conductor: Carlos Cárdenas en Camión NPR",
      fechaInicioGeneral: todayStr,
      items: [
        {
          equipoId: "EQ-001",
          codigo: "MEZ-01",
          nombre: "MEZCLADORA DE CONCRETO 2 BULTOS (MOTOR 13HP)",
          cantidad: 2,
          tarifaDiaria: 45000,
          fechaInicio: todayStr,
          fechaFin: defaultFinStr,
          dias: 3,
          subtotal: 270000,
          devuelto: false,
          cantidadDevuelta: 0,
          costoDano: 0,
        },
        {
          equipoId: "EQ-002",
          codigo: "VIB-02",
          nombre: "VIBRADOR DE CONCRETO ELÉCTRICO 2HP (MANGUERA 4M)",
          cantidad: 1,
          tarifaDiaria: 25000,
          fechaInicio: todayStr,
          fechaFin: defaultFinStr,
          dias: 3,
          subtotal: 75000,
          devuelto: false,
          cantidadDevuelta: 0,
          costoDano: 0,
        },
        {
          equipoId: "EQ-004",
          codigo: "AND-04",
          nombre: "ANDAMIO MULTIDIRECCIONAL (MÓDULO 1.5M X 1.5M)",
          cantidad: 5,
          tarifaDiaria: 12000,
          fechaInicio: todayStr,
          fechaFin: defaultFinStr,
          dias: 1,
          subtotal: 60000,
          devuelto: false,
          cantidadDevuelta: 0,
          costoDano: 0,
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "ALQ-1001",
      consecutivo: 1001,
      clienteId: "CLI-02",
      clienteNombre: "INGENIERÍA & OBRAS CIVILES DEL LLANO",
      estado: "ACTIVO",
      subtotalEquipos: 255000,
      fleteEntrega: 30000,
      fleteRecogida: 30000,
      subtotalGeneral: 315000,
      total: 315000,
      deposito: 0,
      totalPagado: 315000,
      garantiaMonto: 250000,
      garantiaTipo: "Pagaré",
      garantiaEstado: "Activa",
      observaciones: "Obra Anillo Vial Villavicencio",
      detallesLogistica: "Retira cliente en sede central",
      fechaInicioGeneral: todayStr,
      items: [
        {
          equipoId: "EQ-005",
          codigo: "COR-05",
          nombre: "CORTADORA DE PAVIMENTO 13HP (DISCO 14 PULGADAS)",
          cantidad: 1,
          tarifaDiaria: 85000,
          fechaInicio: todayStr,
          fechaFin: defaultFinStr,
          dias: 3,
          subtotal: 255000,
          devuelto: false,
          cantidadDevuelta: 0,
          costoDano: 0,
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    }
  ]);
  const [facturas, setFacturas] = useState<FacturaEmitida[]>([]);
  const [pagos, setPagos] = useState<ReciboPago[]>([
    {
      id: "PAG-101",
      consecutivo: 101,
      alquilerId: "ALQ-1002",
      consecutivoAlquiler: 1002,
      clienteNombre: "CONSTRUCTORA BOLÍVAR S.A.S.",
      monto: 200000,
      metodoPago: "TRANSFERENCIA",
      referencia: "TRANSF-BANCOLOMBIA-9921",
      fecha: todayStr,
    }
  ]);

  // Filtros y Búsquedas
  const [alquilerEstadoFilter, setAlquilerEstadoFilter] = useState<AlquilerEstadoFilter>("TODOS");
  const [alquilerSearchFilter, setAlquilerSearchFilter] = useState<string>("");
  const [selectedContratoDetalle, setSelectedContratoDetalle] = useState<ContratoAlquiler | null>(null);

  // Estados Modal Crear/Editar Alquiler Multi-Ítem
  const [showMultiAlquilerModal, setShowMultiAlquilerModal] = useState<boolean>(false);
  const [contratoEnEdicionId, setContratoEnEdicionId] = useState<string | null>(null);
  const [nuevoAlquilerClienteId, setNuevoAlquilerClienteId] = useState<string>("");
  const [clienteSearchQuery, setClienteSearchQuery] = useState<string>("");
  const [showClienteSuggestions, setShowClienteSuggestions] = useState<boolean>(false);
  const [nuevoAlquilerFechaGeneral, setNuevoAlquilerFechaGeneral] = useState<string>(todayStr);

  const [nuevoAlquilerEstado, setNuevoAlquilerEstado] = useState<"ACTIVO" | "COTIZACION">("ACTIVO");
  const [nuevoAlquilerFleteEntrega, setNuevoAlquilerFleteEntrega] = useState<number>(30000);
  const [nuevoAlquilerFleteRecogida, setNuevoAlquilerFleteRecogida] = useState<number>(30000);
  const [nuevoAlquilerDetallesLogistica, setNuevoAlquilerDetallesLogistica] = useState<string>("Lleva Don Carlos Cárdenas en Camión NPR");
  const [nuevoAlquilerDeposito, setNuevoAlquilerDeposito] = useState<number>(50000);
  const [nuevoAlquilerGarantiaMonto, setNuevoAlquilerGarantiaMonto] = useState<number>(300000);
  const [nuevoAlquilerGarantiaTipo, setNuevoAlquilerGarantiaTipo] = useState<string>("Efectivo");
  const [nuevoAlquilerObservaciones, setNuevoAlquilerObservaciones] = useState<string>("");
  const [nuevoAlquilerLineas, setNuevoAlquilerLineas] = useState<ItemContratoLinea[]>([
    { equipoId: "EQ-001", cantidad: 1, tarifaDiaria: 45000, fechaInicio: todayStr, fechaFin: defaultFinStr, dias: 3 }
  ]);
  const [multiAlquilerError, setMultiAlquilerError] = useState<string | null>(null);

  // Modales adicionales
  const [showDevolucionModal, setShowDevolucionModal] = useState<boolean>(false);
  const [contratoParaDevolucion, setContratoParaDevolucion] = useState<ContratoAlquiler | null>(null);
  const [devoluciones, setDevoluciones] = useState<DevolucionEntity[]>([]);
  const [showHistorialDevolucionesModal, setShowHistorialDevolucionesModal] = useState<boolean>(false);
  
  const [showFacturaModal, setShowFacturaModal] = useState<boolean>(false);
  const [contratoParaFacturar, setContratoParaFacturar] = useState<ContratoAlquiler | null>(null);

  // Modal Pago / Cartera
  const [showPagoModal, setShowPagoModal] = useState<boolean>(false);
  const [contratoParaPago, setContratoParaPago] = useState<ContratoAlquiler | null>(null);
  const [pagoMonto, setPagoMonto] = useState<number | "">("");
  const [pagoMetodo, setPagoMetodo] = useState<"EFECTIVO" | "TRANSFERENCIA" | "NEQUI" | "DAVIPLATA" | "CHEQUE">("TRANSFERENCIA");
  const [pagoReferencia, setPagoReferencia] = useState<string>("");
  const [showHistorialPagosModal, setShowHistorialPagosModal] = useState<boolean>(false);

  // --- Estados de Autenticación, Sesión y RBAC ---
  const [currentUser, setCurrentUser] = useState<DemoUserAccount | null>(USUARIOS_DEMO[0]);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginEmailInput, setLoginEmailInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // --- Estados de Auditoría Forense y Trazabilidad ---
  const [auditLogs, setAuditLogs] = useState<AuditLogEntity[]>([
    new AuditLogEntity({
      id: "AUD-INIT-01",
      timestamp: new Date(Date.now() - 3600000 * 4),
      userId: "USR-001",
      userNombre: "Roberto Silva (Superadmin)",
      userEmail: "superadmin@ferreon.com",
      userRol: "SUPERADMIN",
      modulo: "SEGURIDAD",
      accion: "LOGIN",
      descripcion: "Inicio de sesión seguro en consola central de FerreOn ERP",
      ipAddress: "190.27.120.45",
    }),
    new AuditLogEntity({
      id: "AUD-INIT-02",
      timestamp: new Date(Date.now() - 3600000 * 3),
      userId: "USR-002",
      userNombre: "Carlos Gómez (Bodega)",
      userEmail: "bodega@ferreon.com",
      userRol: "OPERADOR_BODEGA",
      modulo: "BODEGA",
      accion: "CREAR_EQUIPO",
      entidadId: "EQ-001",
      descripcion: "Alta de equipo MEZCLADORA DE CONCRETO 2 BULTOS en catálogo físico",
      detalles: { campo: "stockTotal", valorNuevo: 10, metadata: { categoria: "MAQUINARIA", subcategoria: "CONCRETO" } },
      ipAddress: "190.27.120.46",
    }),
    new AuditLogEntity({
      id: "AUD-INIT-03",
      timestamp: new Date(Date.now() - 3600000 * 2),
      userId: "USR-003",
      userNombre: "Luisa Peña (Facturación)",
      userEmail: "cartera@ferreon.com",
      userRol: "FACTURACION_CARTERA",
      modulo: "CARTERA",
      accion: "REGISTRAR_PAGO",
      entidadId: "PAG-101",
      descripcion: "Registro de recaudo por $1.250.000 COP vía Transferencia Bancaria",
      detalles: { valorAnterior: 0, valorNuevo: 1250000, metadata: { contrato: "ALQ-1001", metodo: "TRANSFERENCIA" } },
      ipAddress: "190.27.120.48",
    }),
  ]);
  const [auditFilterModulo, setAuditFilterModulo] = useState<AuditModuloType | "TODOS">("TODOS");
  const [auditFilterAccion, setAuditFilterAccion] = useState<string>("TODAS");
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>("");
  const [selectedAuditDetalle, setSelectedAuditDetalle] = useState<AuditLogEntity | null>(null);
  const [showAuditDetalleModal, setShowAuditDetalleModal] = useState<boolean>(false);

  // Helper central de auditoría inmutable
  const registrarEventoAuditoria = (
    modulo: AuditModuloType,
    accion: AuditActionType,
    descripcion: string,
    entidadId?: string,
    detalles?: AuditDetalleCambio
  ) => {
    if (!currentUser) return;
    const nuevoLog = new AuditLogEntity({
      userId: currentUser.id,
      userNombre: currentUser.nombre,
      userEmail: currentUser.email,
      userRol: currentUser.rol,
      modulo,
      accion,
      entidadId,
      descripcion,
      detalles,
      ipAddress: "190.27.120." + (Math.floor(Math.random() * 50) + 10),
    });
    setAuditLogs((prev) => [nuevoLog, ...prev]);
  };

  // Handlers de Autenticación y Switch de Usuarios Demo
  const handleQuickLogin = (user: DemoUserAccount) => {
    setCurrentUser(user);
    setShowLoginModal(false);
    setLoginError(null);
    registrarEventoAuditoria(
      "SEGURIDAD",
      "LOGIN",
      `Cambio de sesión a usuario: ${user.nombre} (${user.rol})`,
      user.id
    );
  };

  const handleLogout = () => {
    if (currentUser) {
      registrarEventoAuditoria(
        "SEGURIDAD",
        "LOGOUT",
        `Cierre de sesión de ${currentUser.nombre}`,
        currentUser.id
      );
    }
    setCurrentUser(null);
    setShowLoginModal(true);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = loginEmailInput.trim().toLowerCase();
    const userFound = USUARIOS_DEMO.find((u) => u.email.toLowerCase() === emailClean);

    if (!userFound) {
      setLoginError(`El correo '${emailClean}' no pertenece a ninguna cuenta autorizada.`);
      return;
    }

    handleQuickLogin(userFound);
  };

  // Navegación bidireccional
  const navigateToTab = (targetTab: TabType) => {
    setPreviousTab(activeTab);
    setActiveTab(targetTab);
  };

  const goBack = () => {
    if (previousTab) {
      const temp = activeTab;
      setActiveTab(previousTab);
      setPreviousTab(temp);
    } else {
      setActiveTab("dashboard");
    }
  };

  // Función para calcular días automáticamente
  const calcularDiasEntreFechas = (inicio: string, fin: string): number => {
    try {
      const dInicio = new Date(inicio);
      const dFin = new Date(fin);
      const diffMs = dFin.getTime() - dInicio.getTime();
      const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(1, dias);
    } catch {
      return 1;
    }
  };

  // Manejo de Carga de Logo en Base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setEmpresaConfig((prev) => ({ ...prev, logoBase64: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Handlers Módulo Bodega e Inventario ---
  const handleOpenCrearEquipo = () => {
    setEquipoEnEdicion(null);
    setEquipoFormCodigo(`EQ-${String(equipos.length + 1).padStart(2, "0")}`);
    setEquipoFormNombre("");
    const defaultCat = categoriasMaster[0]?.nombre || "MAQUINARIA";
    const defaultSubcat = categoriasMaster[0]?.subcategorias[0] || "GENERAL";
    setEquipoFormCategoria(defaultCat);
    setEquipoFormSubcategoria(defaultSubcat);
    setEquipoFormTarifaDiaria(45000);
    setEquipoFormStockTotal(5);
    setEquipoFormActivo(true);
    setEquipoFormError(null);
    setShowEquipoModal(true);
  };

  const handleOpenEditarEquipo = (eq: Equipo) => {
    setEquipoEnEdicion(eq);
    setEquipoFormCodigo(eq.codigo);
    setEquipoFormNombre(eq.nombre);
    setEquipoFormCategoria(eq.categoria);
    setEquipoFormSubcategoria(eq.subcategoria || "GENERAL");
    setEquipoFormTarifaDiaria(eq.tarifaDiaria);
    setEquipoFormStockTotal(eq.stockTotal);
    setEquipoFormActivo(eq.activo);
    setEquipoFormError(null);
    setShowEquipoModal(true);
  };

  const handleGuardarEquipo = (e: React.FormEvent) => {
    e.preventDefault();
    const codigoClean = equipoFormCodigo.trim().toUpperCase();
    const nombreClean = equipoFormNombre.trim().toUpperCase();
    const categoriaClean = equipoFormCategoria.trim().toUpperCase();
    const subcategoriaClean = equipoFormSubcategoria.trim().toUpperCase() || "GENERAL";

    if (!codigoClean || !nombreClean) {
      setEquipoFormError("El código y el nombre del equipo son obligatorios.");
      return;
    }

    if (equipoFormTarifaDiaria <= 0) {
      setEquipoFormError("La tarifa diaria debe ser mayor a 0 COP.");
      return;
    }

    if (equipoFormStockTotal < 0) {
      setEquipoFormError("El stock total no puede ser negativo.");
      return;
    }

    // Validar código duplicado
    const yaExiste = equipos.find(
      (e) => e.codigo.trim().toUpperCase() === codigoClean && (!equipoEnEdicion || e.id !== equipoEnEdicion.id)
    );
    if (yaExiste) {
      setEquipoFormError(`Ya existe un equipo registrado con el código '${codigoClean}'.`);
      return;
    }

    // Asegurar que la categoría y subcategoría queden registradas en el catálogo maestro
    setCategoriasMaster((prev) => {
      const catIndex = prev.findIndex((c) => c.nombre.toUpperCase() === categoriaClean);
      if (catIndex >= 0) {
        const cat = prev[catIndex];
        if (!cat.subcategorias.map((s) => s.toUpperCase()).includes(subcategoriaClean)) {
          const updatedCat = {
            ...cat,
            subcategorias: [...cat.subcategorias, subcategoriaClean],
          };
          return prev.map((c, i) => (i === catIndex ? updatedCat : c));
        }
        return prev;
      } else {
        return [...prev, { nombre: categoriaClean, subcategorias: [subcategoriaClean] }];
      }
    });

    if (equipoEnEdicion) {
      // Ajuste de stock sobre equipo existente
      const stockEnObraActual = equipoEnEdicion.stockEnObra || 0;
      if (equipoFormStockTotal < stockEnObraActual) {
        setEquipoFormError(
          `No es posible reducir el stock total (${equipoFormStockTotal} u.) por debajo de las unidades en obra (${stockEnObraActual} u.).`
        );
        return;
      }

      const diferenciaStock = equipoFormStockTotal - equipoEnEdicion.stockTotal;
      const nuevoDisponible = equipoEnEdicion.stockDisponible + diferenciaStock;

      if (!equipoFormActivo && stockEnObraActual > 0) {
        setEquipoFormError(
          `No se puede desactivar el equipo porque tiene ${stockEnObraActual} unidades actualmente en obra.`
        );
        return;
      }

      setEquipos((prev) =>
        prev.map((eq) =>
          eq.id === equipoEnEdicion.id
            ? {
                ...eq,
                codigo: codigoClean,
                nombre: nombreClean,
                categoria: categoriaClean,
                subcategoria: subcategoriaClean,
                tarifaDiaria: equipoFormTarifaDiaria,
                stockTotal: equipoFormStockTotal,
                stockDisponible: nuevoDisponible,
                activo: equipoFormActivo,
              }
            : eq
        )
      );
      registrarEventoAuditoria(
        "BODEGA",
        "AJUSTAR_STOCK",
        `Ajuste de inventario en ${codigoClean} (${nombreClean}) - Stock Total: ${equipoFormStockTotal} u.`,
        codigoClean,
        { campo: "stockTotal", valorAnterior: equipoEnEdicion.stockTotal, valorNuevo: equipoFormStockTotal }
      );
      setShowEquipoModal(false);
    } else {
      // Crear nuevo equipo
      const nuevoEquipo: Equipo = {
        id: "EQ-" + Date.now(),
        codigo: codigoClean,
        nombre: nombreClean,
        categoria: categoriaClean,
        subcategoria: subcategoriaClean,
        tarifaDiaria: equipoFormTarifaDiaria,
        stockTotal: equipoFormStockTotal,
        stockDisponible: equipoFormStockTotal,
        stockEnObra: 0,
        activo: equipoFormActivo,
      };

      setEquipos((prev) => [...prev, nuevoEquipo]);
      registrarEventoAuditoria(
        "BODEGA",
        "CREAR_EQUIPO",
        `Registro de nuevo equipo en catálogo: ${codigoClean} - ${nombreClean}`,
        codigoClean,
        { valorNuevo: equipoFormStockTotal, metadata: { categoria: categoriaClean, subcategoria: subcategoriaClean, tarifaDiaria: equipoFormTarifaDiaria } }
      );
      setShowEquipoModal(false);
    }
  };

  // Creación dinámica de Nueva Categoría
  const handleCrearNuevaCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    const catClean = nuevaCatNombre.trim().toUpperCase();
    const subcatClean = (nuevaCatSubcatInicial.trim() || "GENERAL").toUpperCase();

    if (!catClean) {
      setNuevaCatError("El nombre de la categoría es obligatorio.");
      return;
    }

    const yaExiste = categoriasMaster.some((c) => c.nombre.toUpperCase() === catClean);
    if (yaExiste) {
      setNuevaCatError(`La categoría '${catClean}' ya existe.`);
      return;
    }

    setCategoriasMaster((prev) => [
      ...prev,
      {
        nombre: catClean,
        subcategorias: [subcatClean],
      },
    ]);

    setEquipoFormCategoria(catClean);
    setEquipoFormSubcategoria(subcatClean);
    setNuevaCatNombre("");
    setNuevaCatSubcatInicial("");
    setNuevaCatError(null);
    setShowNuevaCategoriaModal(false);
  };

  // Creación dinámica de Nueva Subcategoría para una Categoría
  const handleCrearNuevaSubcategoria = (e: React.FormEvent) => {
    e.preventDefault();
    const subcatClean = nuevaSubcatNombre.trim().toUpperCase();
    const catTargetClean = nuevaSubcatCategoriaTarget.trim().toUpperCase();

    if (!subcatClean) {
      setNuevaSubcatError("El nombre de la subcategoría es obligatorio.");
      return;
    }

    const catObj = categoriasMaster.find((c) => c.nombre.toUpperCase() === catTargetClean);
    if (catObj && catObj.subcategorias.map((s) => s.toUpperCase()).includes(subcatClean)) {
      setNuevaSubcatError(`La subcategoría '${subcatClean}' ya existe en '${catTargetClean}'.`);
      return;
    }

    setCategoriasMaster((prev) =>
      prev.map((cat) =>
        cat.nombre.toUpperCase() === catTargetClean
          ? { ...cat, subcategorias: [...cat.subcategorias, subcatClean] }
          : cat
      )
    );

    if (equipoFormCategoria.toUpperCase() === catTargetClean) {
      setEquipoFormSubcategoria(subcatClean);
    }

    setNuevaSubcatNombre("");
    setNuevaSubcatError(null);
    setShowNuevaSubcategoriaModal(false);
  };

  const handleOpenVerDetalleEquipo = (eq: Equipo) => {
    setSelectedEquipoDetalle(eq);
    setShowDetalleEquipoModal(true);
  };

  const handleOpenCargaMasiva = () => {
    setCargaMasivaTab("TABLA");
    setCargaMasivaError(null);
    setCargaMasivaSuccess(null);
    setShowCargaMasivaModal(true);
  };

  const handleAddFilaCargaMasiva = () => {
    const nextIdx = cargaMasivaFilas.length + 1;
    const catDefault = categoriasMaster[0]?.nombre || "MAQUINARIA";
    const subcatDefault = categoriasMaster[0]?.subcategorias[0] || "GENERAL";
    setCargaMasivaFilas((prev) => [
      ...prev,
      {
        codigo: `EQ-${String(equipos.length + nextIdx).padStart(2, "0")}`,
        nombre: "",
        categoria: catDefault,
        subcategoria: subcatDefault,
        tarifaDiaria: 35000,
        stockTotal: 5,
      },
    ]);
  };

  const handleRemoveFilaCargaMasiva = (index: number) => {
    if (cargaMasivaFilas.length <= 1) {
      setCargaMasivaError("Debe haber al menos una fila en la tabla de carga masiva.");
      return;
    }
    setCargaMasivaFilas((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateFilaCargaMasiva = (index: number, field: string, value: any) => {
    setCargaMasivaFilas((prev) =>
      prev.map((fila, idx) => {
        if (idx !== index) return fila;
        const updated = { ...fila, [field]: value };
        if (field === "categoria") {
          const catFound = categoriasMaster.find(
            (c) => c.nombre.toUpperCase() === String(value).toUpperCase()
          );
          if (catFound && catFound.subcategorias.length > 0) {
            updated.subcategoria = catFound.subcategorias[0];
          }
        }
        return updated;
      })
    );
  };

  const handleEjecutarCargaMasivaTabla = () => {
    if (cargaMasivaFilas.length === 0) {
      setCargaMasivaError("Agregue al menos una fila para procesar la carga masiva.");
      return;
    }

    const codigosExistentes = new Set(equipos.map((e) => e.codigo.trim().toUpperCase()));
    const codigosEnLote = new Set<string>();
    const nuevosEquipos: Equipo[] = [];

    for (let i = 0; i < cargaMasivaFilas.length; i++) {
      const f = cargaMasivaFilas[i];
      const cod = f.codigo.trim().toUpperCase();
      const nom = f.nombre.trim().toUpperCase();
      const cat = f.categoria.trim().toUpperCase() || "MAQUINARIA";
      const subcat = f.subcategoria ? f.subcategoria.trim().toUpperCase() : "GENERAL";

      if (!cod || !nom) {
        setCargaMasivaError(`La fila #${i + 1} tiene el código o nombre vacío.`);
        return;
      }
      if (codigosExistentes.has(cod)) {
        setCargaMasivaError(`El código '${cod}' de la fila #${i + 1} ya existe en la bodega.`);
        return;
      }
      if (codigosEnLote.has(cod)) {
        setCargaMasivaError(`El código '${cod}' está duplicado dentro del lote (fila #${i + 1}).`);
        return;
      }
      codigosEnLote.add(cod);

      nuevosEquipos.push({
        id: "EQ-" + (Date.now() + i),
        codigo: cod,
        nombre: nom,
        categoria: cat,
        subcategoria: subcat,
        tarifaDiaria: Math.max(0, f.tarifaDiaria),
        stockTotal: Math.max(1, f.stockTotal),
        stockDisponible: Math.max(1, f.stockTotal),
        stockEnObra: 0,
        activo: true,
      });
    }

    setEquipos((prev) => [...prev, ...nuevosEquipos]);
    registrarEventoAuditoria(
      "BODEGA",
      "CARGA_MASIVA_EQUIPOS",
      `Importación masiva exitosa de ${nuevosEquipos.length} equipos al catálogo de bodega`,
      undefined,
      { metadata: { cantidadEquipos: nuevosEquipos.length } }
    );
    setShowCargaMasivaModal(false);
    alert(`¡Carga masiva completada exitosamente! Se agregaron ${nuevosEquipos.length} nuevos equipos a la bodega.`);
  };

  const handleProcesarTextoCSV = () => {
    if (!cargaMasivaTexto.trim()) {
      setCargaMasivaError("Pegue el texto delimitado por comas, puntos y comas o tabulaciones.");
      return;
    }

    const lineas = cargaMasivaTexto
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsed: typeof cargaMasivaFilas = [];

    for (const linea of lineas) {
      let partes = linea.split(/\t|;|,/);
      if (partes.length >= 2) {
        const cod = partes[0]?.trim() || "";
        const nom = partes[1]?.trim() || "";
        let cat = "MAQUINARIA";
        let subcat = "GENERAL";
        let tar = 40000;
        let stock = 5;

        if (partes.length >= 6) {
          // Formato extendido: CODIGO, NOMBRE, CATEGORIA, SUBCATEGORIA, TARIFA, STOCK
          cat = partes[2]?.trim() || "MAQUINARIA";
          subcat = partes[3]?.trim() || "GENERAL";
          tar = parseFloat(partes[4]?.trim()) || 40000;
          stock = parseInt(partes[5]?.trim(), 10) || 5;
        } else if (partes.length >= 5) {
          // Formato estándar: CODIGO, NOMBRE, CATEGORIA, TARIFA, STOCK
          cat = partes[2]?.trim() || "MAQUINARIA";
          tar = parseFloat(partes[3]?.trim()) || 40000;
          stock = parseInt(partes[4]?.trim(), 10) || 5;
        } else if (partes.length >= 3) {
          cat = partes[2]?.trim() || "MAQUINARIA";
        }

        parsed.push({
          codigo: cod,
          nombre: nom,
          categoria: cat.toUpperCase(),
          subcategoria: subcat.toUpperCase(),
          tarifaDiaria: tar,
          stockTotal: stock,
        });
      }
    }

    if (parsed.length === 0) {
      setCargaMasivaError("No se pudieron extraer filas válidas del texto pegado. Formato: CODIGO, NOMBRE, CATEGORIA, SUBCATEGORIA, TARIFA, STOCK");
      return;
    }

    setCargaMasivaFilas(parsed);
    setCargaMasivaTab("TABLA");
    setCargaMasivaSuccess(`Se extrajeron ${parsed.length} equipos del texto pegado. Revise y confirme en la tabla.`);
    setCargaMasivaError(null);
  };


  // Abrir Modal de Nuevo/Editar Alquiler
  const handleOpenNuevoAlquiler = (preselectedEquipoId?: string, preselectedClienteId?: string) => {
    if (clientes.length === 0) {
      alert("Debe registrar al menos un cliente en 'Clientes & Terceros' antes de generar un contrato.");
      navigateToTab("clientes");
      return;
    }
    const defaultEqId = preselectedEquipoId || (equipos[0] ? equipos[0].id : "EQ-001");
    const eqObj = equipos.find((e) => e.id === defaultEqId) || equipos[0];
    const initialCliente = clientes.find((c) => c.id === preselectedClienteId) || clientes[0];

    setContratoEnEdicionId(null);
    setNuevoAlquilerClienteId(initialCliente.id);
    setClienteSearchQuery(`${initialCliente.nitCedula} — ${initialCliente.nombre}`);
    setShowClienteSuggestions(false);
    setNuevoAlquilerFechaGeneral(todayStr);
    setNuevoAlquilerEstado("ACTIVO");
    setNuevoAlquilerFleteEntrega(30000);
    setNuevoAlquilerFleteRecogida(30000);
    setNuevoAlquilerDetallesLogistica("Lleva Don Carlos Cárdenas en Camión NPR");
    setNuevoAlquilerDeposito(50000);
    setNuevoAlquilerGarantiaMonto(300000);
    setNuevoAlquilerGarantiaTipo("Efectivo");
    setNuevoAlquilerObservaciones("");
    setNuevoAlquilerLineas([
      {
        equipoId: eqObj ? eqObj.id : "EQ-001",
        cantidad: 1,
        tarifaDiaria: eqObj ? eqObj.tarifaDiaria : 45000,
        fechaInicio: todayStr,
        fechaFin: defaultFinStr,
        dias: 3,
      }
    ]);
    setMultiAlquilerError(null);
    setShowMultiAlquilerModal(true);
  };

  const handleOpenEditarAlquiler = (contrato: ContratoAlquiler) => {
    setContratoEnEdicionId(contrato.id);
    setNuevoAlquilerClienteId(contrato.clienteId);
    const cObj = clientes.find(c => c.id === contrato.clienteId);
    setClienteSearchQuery(cObj ? `${cObj.nitCedula} — ${cObj.nombre}` : contrato.clienteNombre);
    setShowClienteSuggestions(false);
    setNuevoAlquilerFechaGeneral(contrato.fechaInicioGeneral || todayStr);
    setNuevoAlquilerEstado(contrato.estado === "FINALIZADO" || contrato.estado === "CANCELADO" ? "ACTIVO" : contrato.estado);
    setNuevoAlquilerFleteEntrega(contrato.fleteEntrega);
    setNuevoAlquilerFleteRecogida(contrato.fleteRecogida);
    setNuevoAlquilerDetallesLogistica(contrato.detallesLogistica || "");
    setNuevoAlquilerDeposito(contrato.deposito);
    setNuevoAlquilerGarantiaMonto(contrato.garantiaMonto);
    setNuevoAlquilerGarantiaTipo(contrato.garantiaTipo);
    setNuevoAlquilerObservaciones(contrato.observaciones || "");
    
    setNuevoAlquilerLineas(contrato.items.map(it => ({
      equipoId: it.equipoId,
      cantidad: it.cantidad,
      tarifaDiaria: it.tarifaDiaria,
      fechaInicio: it.fechaInicio,
      fechaFin: it.fechaFin,
      dias: it.dias,
    })));
    setMultiAlquilerError(null);
    setShowMultiAlquilerModal(true);
  };

  // Agregar fila de equipo
  const handleAddLineaEquipo = () => {
    const primerEquipoDisp = equipos.find((e) => e.activo && e.stockDisponible > 0) || equipos[0];
    if (!primerEquipoDisp) return;

    setNuevoAlquilerLineas((prev) => [
      ...prev,
      {
        equipoId: primerEquipoDisp.id,
        cantidad: 1,
        tarifaDiaria: primerEquipoDisp.tarifaDiaria,
        fechaInicio: nuevoAlquilerFechaGeneral,
        fechaFin: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        dias: 3,
      }
    ]);
  };

  const handleRemoveLineaEquipo = (index: number) => {
    if (nuevoAlquilerLineas.length <= 1) {
      setMultiAlquilerError("El contrato debe incluir al menos un equipo.");
      return;
    }
    setNuevoAlquilerLineas((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Actualizar línea y recalcular días automáticamente al cambiar fechas
  const handleUpdateLineaEquipo = (index: number, field: keyof ItemContratoLinea, value: any) => {
    setNuevoAlquilerLineas((prev) =>
      prev.map((linea, idx) => {
        if (idx !== index) return linea;
        
        const updated = { ...linea, [field]: value };
        
        if (field === "equipoId") {
          const selectedEq = equipos.find((e) => e.id === value);
          updated.tarifaDiaria = selectedEq ? selectedEq.tarifaDiaria : linea.tarifaDiaria;
        } else if (field === "fechaInicio" || field === "fechaFin") {
          updated.dias = calcularDiasEntreFechas(updated.fechaInicio, updated.fechaFin);
        }

        return updated;
      })
    );
  };

  // Cálculos Financieros
  const subtotalEquipos = nuevoAlquilerLineas.reduce((acc, l) => acc + (l.cantidad * l.tarifaDiaria * l.dias), 0);
  const totalFletes = (nuevoAlquilerFleteEntrega || 0) + (nuevoAlquilerFleteRecogida || 0);
  const subtotalGeneral = subtotalEquipos + totalFletes;
  const totalContrato = Math.max(0, subtotalGeneral - (nuevoAlquilerDeposito || 0));

  // Guardar y despachar contrato
  const handleGuardarContrato = (e: React.FormEvent) => {
    e.preventDefault();
    const clienteObj = clientes.find((c) => c.id === nuevoAlquilerClienteId);
    if (!clienteObj) {
      setMultiAlquilerError("Seleccione un cliente válido de la búsqueda asistida.");
      return;
    }

    const oldContrato = contratoEnEdicionId ? contratos.find(c => c.id === contratoEnEdicionId) : null;
    let stockVirtual = [...equipos];

    if (oldContrato && oldContrato.estado === "ACTIVO") {
      stockVirtual = stockVirtual.map(eq => {
        const oldLinea = oldContrato.items.find(l => l.equipoId === eq.id);
        if (oldLinea) {
          return { ...eq, stockDisponible: eq.stockDisponible + oldLinea.cantidad, stockEnObra: Math.max(0, eq.stockEnObra - oldLinea.cantidad) };
        }
        return eq;
      });
    }

    if (nuevoAlquilerEstado === "ACTIVO") {
      for (const linea of nuevoAlquilerLineas) {
        const eq = stockVirtual.find((e) => e.id === linea.equipoId);
        if (!eq || linea.cantidad > eq.stockDisponible) {
          setMultiAlquilerError(`Stock insuficiente para '${eq ? eq.nombre : "Equipo"}'. Disponible: ${eq ? eq.stockDisponible : 0} u.`);
          return;
        }
      }

      setEquipos((prev) =>
        prev.map((eq) => {
          let updatedEq = { ...eq };
          if (oldContrato && oldContrato.estado === "ACTIVO") {
            const oldLinea = oldContrato.items.find(l => l.equipoId === eq.id);
            if (oldLinea) {
              updatedEq.stockDisponible += oldLinea.cantidad;
              updatedEq.stockEnObra = Math.max(0, updatedEq.stockEnObra - oldLinea.cantidad);
            }
          }
          const nuevaLinea = nuevoAlquilerLineas.find((l) => l.equipoId === eq.id);
          if (nuevaLinea) {
            updatedEq.stockDisponible -= nuevaLinea.cantidad;
            updatedEq.stockEnObra += nuevaLinea.cantidad;
          }
          return updatedEq;
        })
      );
    } else if (oldContrato && oldContrato.estado === "ACTIVO" && nuevoAlquilerEstado === "COTIZACION") {
      // Transitioning from ACTIVO back to COTIZACION
      setEquipos((prev) =>
        prev.map((eq) => {
          let updatedEq = { ...eq };
          const oldLinea = oldContrato.items.find(l => l.equipoId === eq.id);
          if (oldLinea) {
            updatedEq.stockDisponible += oldLinea.cantidad;
            updatedEq.stockEnObra = Math.max(0, updatedEq.stockEnObra - oldLinea.cantidad);
          }
          return updatedEq;
        })
      );
    }

    const consecutivoNuevo = oldContrato
      ? oldContrato.consecutivo
      : (contratos.length > 0 ? Math.max(...contratos.map((c) => c.consecutivo || 0)) + 1 : 1001);
    const totalPagadoMantener = oldContrato ? oldContrato.totalPagado : 0;
    const idContrato = oldContrato ? oldContrato.id : "ALQ-" + consecutivoNuevo;
    const createdAtVal = oldContrato ? oldContrato.createdAt : new Date().toISOString();

    const nuevoContrato: ContratoAlquiler = {
      id: idContrato,
      consecutivo: consecutivoNuevo,
      clienteId: clienteObj.id,
      clienteNombre: clienteObj.nombre,
      estado: nuevoAlquilerEstado,
      subtotalEquipos,
      fleteEntrega: nuevoAlquilerFleteEntrega || 0,
      fleteRecogida: nuevoAlquilerFleteRecogida || 0,
      subtotalGeneral,
      total: totalContrato,
      deposito: nuevoAlquilerDeposito || 0,
      totalPagado: totalPagadoMantener,
      garantiaMonto: nuevoAlquilerGarantiaMonto || 0,
      garantiaTipo: nuevoAlquilerGarantiaTipo,
      garantiaEstado: "Activa",
      observaciones: nuevoAlquilerObservaciones,
      detallesLogistica: nuevoAlquilerDetallesLogistica,
      fechaInicioGeneral: nuevoAlquilerFechaGeneral,
      items: nuevoAlquilerLineas.map((l) => {
        const eq = equipos.find((e) => e.id === l.equipoId)!;
        const oldLinea = oldContrato ? oldContrato.items.find(i => i.equipoId === l.equipoId) : null;
        return {
          equipoId: l.equipoId,
          codigo: eq.codigo,
          nombre: eq.nombre,
          cantidad: l.cantidad,
          tarifaDiaria: l.tarifaDiaria,
          fechaInicio: l.fechaInicio,
          fechaFin: l.fechaFin,
          dias: l.dias,
          subtotal: l.cantidad * l.tarifaDiaria * l.dias,
          devuelto: oldLinea ? oldLinea.devuelto : false,
          cantidadDevuelta: oldLinea ? oldLinea.cantidadDevuelta : 0,
          costoDano: oldLinea ? oldLinea.costoDano : 0,
        };
      }),
      createdAt: createdAtVal,
    };

    if (oldContrato) {
      setContratos((prev) => prev.map((c) => (c.id === idContrato ? nuevoContrato : c)));
      registrarEventoAuditoria(
        "ALQUILERES",
        "EDITAR_ALQUILER",
        `Edición de contrato ALQ-${nuevoContrato.consecutivo} para cliente ${clienteObj.nombre}`,
        `ALQ-${nuevoContrato.consecutivo}`,
        { valorAnterior: oldContrato.total, valorNuevo: totalContrato }
      );
    } else {
      setContratos((prev) => [nuevoContrato, ...prev]);
      registrarEventoAuditoria(
        "ALQUILERES",
        "CREAR_ALQUILER",
        `Emisión de nuevo contrato ALQ-${nuevoContrato.consecutivo} (${nuevoContrato.estado}) para ${clienteObj.nombre}`,
        `ALQ-${nuevoContrato.consecutivo}`,
        { valorNuevo: totalContrato, metadata: { estado: nuevoContrato.estado, items: nuevoContrato.items.length } }
      );
    }
    
    setShowMultiAlquilerModal(false);
  };

  // Clientes sugeridos en la búsqueda asistida
  const clientesSugeridos = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(clienteSearchQuery.toLowerCase()) ||
      c.nitCedula.toLowerCase().includes(clienteSearchQuery.toLowerCase())
  );

  // Función para Abrir Visor PDF Tamaño Carta con Logo y Datos Dinámicos
  const handleAbrirVisorPDFCarta = (contrato: ContratoAlquiler, tipo: "COTIZACION" | "CONTRATO" | "CUENTA_COBRO") => {
    const clienteObj = clientes.find((c) => c.id === contrato.clienteId);
    
    const payload: DocumentoPDFPayload = {
      tipo,
      consecutivo: contrato.consecutivo,
      fechaEmision: new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }),
      fechaInicioGeneral: contrato.fechaInicioGeneral,
      clienteNombre: contrato.clienteNombre,
      clienteNit: clienteObj ? clienteObj.nitCedula : "NIT 000.000.000",
      clienteDireccion: clienteObj?.direccion,
      clienteTelefono: clienteObj?.telefono,
      detallesLogistica: contrato.detallesLogistica,
      garantiaTipo: contrato.garantiaTipo,
      garantiaMonto: contrato.garantiaMonto,
      items: contrato.items.map((it) => ({
        cantidad: it.cantidad,
        nombre: it.nombre,
        codigo: it.codigo,
        fechaInicio: it.fechaInicio,
        fechaFin: it.fechaFin,
        dias: it.dias,
        tarifaDiaria: it.tarifaDiaria,
        subtotal: it.subtotal,
      })),
      subtotalEquipos: contrato.subtotalEquipos,
      fleteEntrega: contrato.fleteEntrega,
      fleteRecogida: contrato.fleteRecogida,
      subtotalGeneral: contrato.subtotalGeneral,
      costosDano: contrato.items.reduce((acc, it) => acc + (it.costoDano || 0), 0),
      depositoAplicado: contrato.deposito,
      totalPagar: contrato.total,
      observaciones: contrato.observaciones,
      empresa: empresaConfig,
    };

    const html = EnterprisePDFService.generarHTMLDocumento(payload);
    const viewerWindow = window.open("", "_blank");
    if (viewerWindow) {
      viewerWindow.document.write(html);
      viewerWindow.document.close();
    }
  };

  const handleOpenDevolucion = (contrato: ContratoAlquiler) => {
    setContratoParaDevolucion(contrato);
    setShowDevolucionModal(true);
  };
  
  const handleOpenHistorialDevoluciones = (contrato: ContratoAlquiler) => {
    setContratoParaDevolucion(contrato);
    setShowHistorialDevolucionesModal(true);
  };

  const handleConfirmarDevolucion = (
    cantidades: { [equipoId: string]: number },
    danos: { [equipoId: string]: number },
    pagoDanos: { monto: number; metodo: string; referencia: string } | null
  ) => {
    if (!contratoParaDevolucion || !currentUser) return;

    let todosDevueltos = true;
    let costoTotalCobrado = 0;
    const detallesDevolucion: any[] = [];

    const contratoActualizado: ContratoAlquiler = {
      ...contratoParaDevolucion,
      items: contratoParaDevolucion.items.map((it) => {
        const cantDevueltasHoy = cantidades[it.equipoId] || 0;
        const totalDev = (it.cantidadDevuelta || 0) + cantDevueltasHoy;
        const costoDano = danos[it.equipoId] || 0;
        const estaDevuelto = totalDev >= it.cantidad;

        if (!estaDevuelto) todosDevueltos = false;

        if (cantDevueltasHoy > 0 || costoDano > 0) {
          detallesDevolucion.push({
            equipoId: it.equipoId,
            nombreEquipo: it.nombre,
            cantidadDevuelta: cantDevueltasHoy,
            cantidadDanada: costoDano > 0 ? cantDevueltasHoy : 0, 
            costoCobrado: costoDano,
          });
          costoTotalCobrado += costoDano;
        }

        if (cantDevueltasHoy > 0) {
          setEquipos((prev) =>
            prev.map((eq) =>
              eq.id === it.equipoId
                ? {
                    ...eq,
                    stockDisponible: eq.stockDisponible + cantDevueltasHoy,
                    stockEnObra: Math.max(0, eq.stockEnObra - cantDevueltasHoy),
                  }
                : eq
            )
          );
        }

        return {
          ...it,
          cantidadDevuelta: totalDev,
          devuelto: estaDevuelto,
          costoDano: (it.costoDano || 0) + costoDano,
        };
      }),
    };

    if (todosDevueltos) {
      contratoActualizado.estado = "FINALIZADO";
      contratoActualizado.garantiaEstado = "Liberada";
    }

    setContratos((prev) =>
      prev.map((c) => (c.id === contratoActualizado.id ? contratoActualizado : c))
    );

    // Registrar historial de devolución
    if (detallesDevolucion.length > 0) {
      const nuevaDevolucion = new DevolucionEntity(
        `DEV-${Date.now()}`,
        Date.now() % 10000,
        contratoParaDevolucion.id!,
        new Date(),
        currentUser.id,
        currentUser.nombre,
        detallesDevolucion,
        "",
        costoTotalCobrado
      );
      setDevoluciones((prev) => [nuevaDevolucion, ...prev]);
    }

    registrarEventoAuditoria(
      "DEVOLUCIONES",
      "PROCESAR_DEVOLUCION",
      `Reingreso de maquinaria y liquidación de devolución para contrato ALQ-${contratoParaDevolucion.consecutivo}`,
      `ALQ-${contratoParaDevolucion.consecutivo}`,
      { metadata: { finalizado: todosDevueltos, totalDanos: costoTotalCobrado } }
    );

    // Registrar pago por daños si aplica
    if (pagoDanos) {
      const nuevoPago = {
        id: `PAG-${Date.now()}`,
        consecutivo: Math.floor(Math.random() * 90000) + 10000,
        alquilerId: contratoParaDevolucion.id!,
        consecutivoAlquiler: contratoParaDevolucion.consecutivo,
        clienteNombre: contratoParaDevolucion.clienteNombre!,
        monto: pagoDanos.monto,
        metodoPago: pagoDanos.metodo as any,
        referencia: pagoDanos.referencia,
        fecha: new Date().toISOString().split('T')[0],
        tipoPago: "PAGO_DANOS"
      };
      // @ts-ignore: Para evitar error si ReciboPago no tiene tipoPago todavía
      setPagos((prev) => [nuevoPago, ...prev]);
      
      registrarEventoAuditoria(
        "CARTERA",
        "REGISTRAR_PAGO",
        `Recaudo por DAÑOS: $${pagoDanos.monto} - ALQ-${contratoParaDevolucion.consecutivo}`,
        nuevoPago.id
      );
    }

    setShowDevolucionModal(false);
    alert("¡Devolución registrada exitosamente! Equipos reingresados a la bodega en tiempo real.");
  };

  // Factura
  const handleOpenFacturacion = (contrato: ContratoAlquiler) => {
    setContratoParaFacturar(contrato);
    setShowFacturaModal(true);
  };

  const handleEmitirFactura = () => {
    if (!contratoParaFacturar) return;

    const totalDanos = contratoParaFacturar.items.reduce((acc, it) => acc + (it.costoDano || 0), 0);
    const totalPagar = Math.max(0, contratoParaFacturar.subtotalGeneral + totalDanos - contratoParaFacturar.deposito);

    const nuevaFac: FacturaEmitida = {
      id: "FAC-" + Date.now(),
      numeroConsecutivo: facturas.length + 1001,
      alquilerId: contratoParaFacturar.id,
      consecutivoAlquiler: contratoParaFacturar.consecutivo,
      clienteNombre: contratoParaFacturar.clienteNombre,
      subtotal: contratoParaFacturar.subtotalGeneral,
      costosDano: totalDanos,
      depositoAplicado: contratoParaFacturar.deposito,
      totalPagar,
      estadoPago: "EMITIDA",
      createdAt: new Date().toISOString(),
    };

    setFacturas((prev) => [nuevaFac, ...prev]);
    registrarEventoAuditoria(
      "FACTURACION",
      "EMITIR_FACTURA",
      `Emisión de cuenta de cobro / factura FAC-${nuevaFac.numeroConsecutivo} (${contratoParaFacturar.clienteNombre}) por ${formatearMonedaCOP(totalPagar)}`,
      `FAC-${nuevaFac.numeroConsecutivo}`,
      { valorNuevo: totalPagar, metadata: { contratoId: contratoParaFacturar.id } }
    );

    setShowFacturaModal(false);
    handleAbrirVisorPDFCarta(contratoParaFacturar, "CUENTA_COBRO");
    navigateToTab("facturacion");
  };

  // Modal Registrar Pago / Cartera
  const handleOpenHistorialPagos = (contrato: ContratoAlquiler) => {
    setContratoParaPago(contrato);
    setShowHistorialPagosModal(true);
  };

  const handleOpenRegistrarPago = (contrato: ContratoAlquiler) => {
    const saldoPendiente = Math.max(0, contrato.total - (contrato.totalPagado || 0));
    if (saldoPendiente <= 0) {
      alert("Este contrato ya se encuentra pagado en su totalidad (Paz y Salvo).");
      return;
    }
    setContratoParaPago(contrato);
    setPagoMonto(saldoPendiente > 0 ? saldoPendiente : "");
    setPagoMetodo("TRANSFERENCIA");
    setPagoReferencia("");
    setShowPagoModal(true);
  };

  const handleConfirmarPago = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contratoParaPago) return;

    if (typeof pagoMonto !== "number" || pagoMonto <= 0) {
      alert("El monto del pago debe ser válido y mayor a cero.");
      return;
    }

    const nuevoRecibo: ReciboPago = {
      id: "PAG-" + Date.now(),
      consecutivo: pagos.length + 101,
      alquilerId: contratoParaPago.id,
      consecutivoAlquiler: contratoParaPago.consecutivo,
      clienteNombre: contratoParaPago.clienteNombre,
      monto: pagoMonto,
      metodoPago: pagoMetodo,
      referencia: pagoReferencia,
      fecha: todayStr,
    };

    setPagos((prev) => [nuevoRecibo, ...prev]);

    // Actualizar el saldo pagado en el contrato
    setContratos((prev) =>
      prev.map((c) => {
        if (c.id === contratoParaPago.id) {
          const nuevoTotalPagado = (c.totalPagado || 0) + pagoMonto;
          return {
            ...c,
            totalPagado: nuevoTotalPagado,
          };
        }
        return c;
      })
    );

    registrarEventoAuditoria(
      "CARTERA",
      "REGISTRAR_PAGO",
      `Abono de cartera por ${formatearMonedaCOP(pagoMonto)} (${pagoMetodo}) aplicado a contrato ALQ-${contratoParaPago.consecutivo}`,
      nuevoRecibo.id,
      { valorNuevo: pagoMonto, metadata: { referencia: pagoReferencia, cliente: contratoParaPago.clienteNombre } }
    );

    setShowPagoModal(false);
    alert(`¡Pago de ${formatearMonedaCOP(pagoMonto)} registrado con éxito!`);
  };

  // Contratos filtrados ordenados SIEMPRE en orden descendente por Id / Consecutivo
  const contratosFiltrados = [...contratos]
    .filter((c) => {
      const matchEstado = alquilerEstadoFilter === "TODOS" || c.estado === alquilerEstadoFilter;
      const matchSearch =
        c.clienteNombre.toLowerCase().includes(alquilerSearchFilter.toLowerCase()) ||
        `ALQ-${c.consecutivo}`.toLowerCase().includes(alquilerSearchFilter.toLowerCase()) ||
        c.id.toLowerCase().includes(alquilerSearchFilter.toLowerCase());
      return matchEstado && matchSearch;
    })
    .sort((a, b) => {
      // 1. Extraer identificador numérico de ALQ-XXXX
      const numA = parseInt(a.id.replace(/\D/g, ""), 10) || a.consecutivo || 0;
      const numB = parseInt(b.id.replace(/\D/g, ""), 10) || b.consecutivo || 0;
      if (numA !== numB) {
        return numB - numA; // Más reciente primero (orden descendente)
      }
      // 2. Consecutivo numérico directo descendente
      if (b.consecutivo !== a.consecutivo) {
        return b.consecutivo - a.consecutivo;
      }
      // 3. Fallback: Orden lexicográfico descendente del ID
      return b.id.localeCompare(a.id, undefined, { numeric: true });
    });

  // Totales de Cartera
  const totalFacturadoGlobal = contratos.reduce((acc, c) => acc + c.total, 0);
  const totalRecaudadoGlobal = pagos.reduce((acc, p) => acc + p.monto, 0);
  const saldoCarteraPendienteGlobal = Math.max(0, totalFacturadoGlobal - totalRecaudadoGlobal);

  // Categorías de Bodega Disponibles (Maestras + Equipos)
  const categoriasDisponibles = [
    "TODAS",
    ...Array.from(
      new Set([
        ...categoriasMaster.map((c) => c.nombre.toUpperCase()),
        ...equipos.map((e) => e.categoria.toUpperCase()),
      ])
    ).filter(Boolean),
  ];

  // Subcategorías Disponibles (filtradas según la categoría activa en el filtro)
  const subcategoriasDisponibles = [
    "TODAS",
    ...Array.from(
      new Set(
        equipos
          .filter(
            (e) =>
              bodegaCategoriaFilter === "TODAS" ||
              e.categoria.toUpperCase() === bodegaCategoriaFilter.toUpperCase()
          )
          .map((e) => (e.subcategoria || "GENERAL").toUpperCase())
          .concat(
            bodegaCategoriaFilter !== "TODAS"
              ? (
                  categoriasMaster.find(
                    (c) => c.nombre.toUpperCase() === bodegaCategoriaFilter.toUpperCase()
                  )?.subcategorias || []
                ).map((s) => s.toUpperCase())
              : []
          )
      )
    ).filter(Boolean),
  ];

  // Subcategorías disponibles para el selector del formulario según categoría activa
  const subcategoriasParaFormulario =
    categoriasMaster.find(
      (c) => c.nombre.toUpperCase() === equipoFormCategoria.trim().toUpperCase()
    )?.subcategorias || ["GENERAL"];

  // Equipos Filtrados en Bodega (Búsqueda + Categoría + Subcategoría + Disponibilidad)
  const equiposFiltrados = equipos.filter((item) => {
    const matchSearch =
      item.nombre.toLowerCase().includes(bodegaSearchQuery.toLowerCase()) ||
      item.codigo.toLowerCase().includes(bodegaSearchQuery.toLowerCase()) ||
      item.categoria.toLowerCase().includes(bodegaSearchQuery.toLowerCase()) ||
      (item.subcategoria || "").toLowerCase().includes(bodegaSearchQuery.toLowerCase());

    const matchCategoria =
      bodegaCategoriaFilter === "TODAS" || item.categoria.toUpperCase() === bodegaCategoriaFilter.toUpperCase();

    const matchSubcategoria =
      bodegaSubcategoriaFilter === "TODAS" ||
      (item.subcategoria || "GENERAL").toUpperCase() === bodegaSubcategoriaFilter.toUpperCase();

    const matchDisponibilidad =
      bodegaDisponibilidadFilter === "TODOS"
        ? true
        : bodegaDisponibilidadFilter === "DISPONIBLE"
        ? item.stockDisponible > 0
        : item.stockDisponible === 0;

    return matchSearch && matchCategoria && matchSubcategoria && matchDisponibilidad;
  });

  // Métricas de Bodega
  const totalEquiposRegistrados = equipos.length;
  const totalStockFisico = equipos.reduce((acc, e) => acc + e.stockTotal, 0);
  const totalStockDisponible = equipos.reduce((acc, e) => acc + e.stockDisponible, 0);
  const totalStockEnObra = equipos.reduce((acc, e) => acc + e.stockEnObra, 0);

  // Navegación en Menú Lateral con Permisos RBAC
  const allNavigationTabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: LayoutDashboard, badge: null, desc: "Métricas y resumen ejecutivo", permission: "dashboard:view" as Permission },
    { id: "alquileres" as TabType, label: "Alquileres", icon: FileText, badge: contratos.filter(c => c.estado === 'ACTIVO').length, desc: "Contratos y despachos", permission: "alquileres:read" as Permission },
    { id: "bodega" as TabType, label: "Bodega e Inventario", icon: Package, badge: equipos.length, desc: "Maquinaria y stock físico", permission: "bodega:read" as Permission },
    { id: "devoluciones" as TabType, label: "Devoluciones", icon: RotateCcw, badge: null, desc: "Reingreso y control de daños", permission: "devoluciones:read" as Permission },
    { id: "facturacion" as TabType, label: "Facturación", icon: Receipt, badge: facturas.length, desc: "Cuentas de cobro", permission: "facturacion:read" as Permission },
    { id: "cartera" as TabType, label: "Cartera & Pagos", icon: Landmark, badge: pagos.length, desc: "Recaudos y estados de cuenta", permission: "cartera:read" as Permission },
    { id: "clientes" as TabType, label: "Clientes & Terceros", icon: Users, badge: clientes.length, desc: "Directorio y NITs", permission: "clientes:read" as Permission },
    { id: "auditoria" as TabType, label: "Auditoría & Trazabilidad", icon: FileSearch, badge: auditLogs.length, desc: "Bitácora forense de eventos", permission: "auditoria:read" as Permission },
    { id: "configuracion" as TabType, label: "Configuración Empresa", icon: Settings, badge: null, desc: "Logo, NIT y parámetros", permission: "configuracion:manage" as Permission },
  ];

  // Pestañas filtradas según el rol del usuario activo
  const navigationTabs = allNavigationTabs.filter(
    (tab) => !currentUser || hasPermission(currentUser.rol, tab.permission)
  );

  const currentActiveTabInfo = allNavigationTabs.find((t) => t.id === activeTab) || allNavigationTabs[0];
  const ActiveTabIcon = currentActiveTabInfo.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      
      {/* Resplandores Ambientales */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Overlay Backdrop del Menú Lateral */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 transition-opacity duration-300 animate-fadeIn"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* MENÚ TIPO HAMBURGUESA LATERAL (DRAWER COLLAPSIBLE) */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-slate-950/95 backdrop-blur-2xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Menú principal de navegación"
      >
        {/* Cabecera del Menú Lateral */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center space-x-3">
            {empresaConfig.logoBase64 ? (
              <img src={empresaConfig.logoBase64} alt="Logo" className="h-9 max-w-[100px] object-contain rounded-lg p-1 bg-white/10" />
            ) : (
              <div className="bg-gradient-to-tr from-sky-600 to-cyan-400 p-2 rounded-xl text-white shadow-md shadow-sky-500/20">
                <Building2 className="h-5 w-5" />
              </div>
            )}
            <div className="leading-tight">
              <p className="text-sm font-black text-white tracking-tight truncate max-w-[150px]">{empresaConfig.razonSocial}</p>
              <p className="text-[10px] font-bold text-sky-400">NIT: {empresaConfig.nit}</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all flex items-center justify-center active:scale-95"
            title="Ocultar menú (Esc)"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tarjeta de Sesión Activa del Operador */}
        {currentUser ? (
          <div className="p-3.5 mx-3 mt-3 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-md">
                  {currentUser.avatar}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate leading-tight">{currentUser.nombre}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${ROLE_INFO[currentUser.rol].badgeClass}`}>
                {ROLE_INFO[currentUser.rol].label}
              </span>
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-[10px] text-sky-400 hover:text-sky-300 font-bold hover:underline"
              >
                Cambiar Rol
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 mx-3 mt-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
            <p className="text-xs font-bold text-rose-400">Sin Sesión Activa</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="glass-button-primary w-full py-1.5 rounded-lg text-xs font-bold text-white"
            >
              Iniciar Sesión
            </button>
          </div>
        )}

        {/* Lista de Módulos de Navegación */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-1.5 scrollbar-thin">
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Módulos Autorizados</span>
            <span className="text-[9px] text-slate-500">({navigationTabs.length})</span>
          </div>

          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  navigateToTab(tab.id as TabType);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 group text-left ${
                  isActive
                    ? "bg-gradient-to-r from-sky-500/20 to-sky-600/10 border-l-4 border-sky-400 text-sky-300 shadow-md shadow-sky-500/10"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-2 rounded-xl transition-colors ${
                    isActive 
                      ? "bg-sky-500/20 text-sky-400" 
                      : "bg-slate-900 text-slate-400 group-hover:text-sky-400 group-hover:bg-slate-800"
                  }`}>
                    <Icon className="h-4 w-4 shrink-0" />
                  </div>
                  <div className="truncate">
                    <p className={`truncate ${isActive ? "text-sky-200 font-extrabold" : "group-hover:text-white"}`}>{tab.label}</p>
                    <p className="text-[10px] font-normal text-slate-400 truncate">{tab.desc}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  {tab.badge !== null && tab.badge > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive 
                        ? "bg-sky-500 text-slate-950 shadow-sm" 
                        : "bg-slate-800 text-slate-300 border border-white/10 group-hover:border-sky-500/30"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${
                    isActive ? "text-sky-400 translate-x-0.5" : "text-slate-400 group-hover:text-slate-300 group-hover:translate-x-0.5"
                  }`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Pie del Menú Lateral */}
        <div className="p-4 border-t border-white/10 bg-slate-900/50 space-y-2.5">
          {(!currentUser || hasPermission(currentUser.rol, "alquileres:create")) && (
            <button
              onClick={() => {
                handleOpenNuevoAlquiler();
                setIsSidebarOpen(false);
              }}
              className="w-full glass-button-primary h-10 px-4 rounded-xl text-white font-semibold text-xs flex items-center justify-center space-x-2 active:scale-95 shadow-md"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Nuevo Contrato Alquiler</span>
            </button>
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="flex-1 h-9 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/10 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all active:scale-95"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
              <span>Ocultar</span>
            </button>

            <button
              onClick={handleLogout}
              className="h-9 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center justify-center space-x-1 transition-all active:scale-95"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Salir</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1">
            <span>Better Auth RBAC</span>
            <span className="flex items-center text-emerald-400 font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-400 mr-1" />
              Protegido
            </span>
          </div>
        </div>
      </aside>

      {/* Header Glassmorphism con Botón Hamburguesa y Switcher de Sesión */}
      <header className="glass-header sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            
            {/* BOTÓN TIPO HAMBURGUESA PARA ABRIR/CERRAR MENÚ */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-sky-400 border border-white/10 hover:border-sky-500/30 transition-all flex items-center justify-center shadow-lg active:scale-95 group focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              title={isSidebarOpen ? "Ocultar menú lateral" : "Abrir menú lateral"}
              aria-label="Alternar menú lateral"
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5 text-sky-400 transition-transform duration-200" />
              ) : (
                <Menu className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              )}
            </button>

            {empresaConfig.logoBase64 ? (
              <img src={empresaConfig.logoBase64} alt="Logo" className="h-10 max-w-[120px] object-contain rounded-lg p-1 bg-white/10 cursor-pointer" onClick={() => navigateToTab("dashboard")} />
            ) : (
              <div 
                className="bg-gradient-to-tr from-sky-600 to-cyan-400 p-2.5 rounded-2xl text-white shadow-lg shadow-sky-500/30 ring-1 ring-white/20 cursor-pointer"
                onClick={() => navigateToTab("dashboard")}
              >
                <Building2 className="h-6 w-6" />
              </div>
            )}

            <div className="cursor-pointer" onClick={() => navigateToTab("dashboard")}>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent tracking-tight">
                  {empresaConfig.razonSocial}
                </span>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-400/30 backdrop-blur-md shadow-sm">
                  NIT: {empresaConfig.nit}
                </span>
              </div>
            </div>

            {/* Indicador del Módulo Activo */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-white/10 text-xs font-semibold text-slate-300 shadow-inner">
              <ActiveTabIcon className="h-4 w-4 text-sky-400" />
              <span>{currentActiveTabInfo.label}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Control de Usuario / Role Switcher en Header */}
            {currentUser && (
              <div 
                onClick={() => setShowLoginModal(true)}
                className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 text-xs cursor-pointer transition-all active:scale-95"
                title="Haga clic para cambiar de rol o usuario"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                  {currentUser.avatar}
                </div>
                <div className="text-left leading-none">
                  <span className="text-xs font-bold text-white block">{currentUser.nombre.split(" ")[0]}</span>
                  <span className="text-[9px] text-sky-400 font-semibold">{ROLE_INFO[currentUser.rol].label}</span>
                </div>
              </div>
            )}

            {previousTab && (
              <button 
                onClick={goBack}
                className="h-10 px-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver</span>
              </button>
            )}

            {(!currentUser || hasPermission(currentUser.rol, "alquileres:create")) && (
              <button 
                onClick={() => handleOpenNuevoAlquiler()}
                className="glass-button-primary h-11 px-5 rounded-2xl text-white font-semibold text-sm flex items-center space-x-2 active:scale-95"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Nuevo Alquiler</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* PESTAÑA 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            <section className="glass-panel rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-4 max-w-3xl">
                <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Branding & Cartera Sincronizados</span>
                  <Sparkles className="h-3.5 w-3.5 ml-1 text-emerald-300" />
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                  {empresaConfig.razonSocial}
                </h1>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                  Control integral de alquileres, cuentas de cobro, fletes, recaudo de cartera y generación de documentos en tamaño Carta con logo corporativo.
                </p>
              </div>
            </section>

            {/* Métricas KPI */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div onClick={() => navigateToTab("alquileres")} className="glass-panel glass-panel-hover rounded-2xl p-6 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Contratos Activos</span>
                  <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5">
                  <span className="text-4xl font-extrabold text-white">{contratos.filter(c => c.estado === 'ACTIVO').length}</span>
                  <span className="text-xs text-slate-400 ml-2 font-medium">alquileres en obra</span>
                </div>
              </div>

              <div onClick={() => navigateToTab("cartera")} className="glass-panel glass-panel-hover rounded-2xl p-6 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Saldo en Cartera</span>
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Landmark className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5">
                  <span className="text-2xl font-extrabold text-emerald-400">{formatearMonedaCOP(saldoCarteraPendienteGlobal)}</span>
                  <span className="text-xs text-slate-400 block mt-1 font-medium">recaudo: {formatearMonedaCOP(totalRecaudadoGlobal)}</span>
                </div>
              </div>

              <div onClick={() => navigateToTab("bodega")} className="glass-panel glass-panel-hover rounded-2xl p-6 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Equipos en Bodega</span>
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Package className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5">
                  <span className="text-4xl font-extrabold text-white">{equipos.reduce((acc, eq) => acc + (eq.activo ? eq.stockDisponible : 0), 0)}</span>
                  <span className="text-xs text-slate-400 ml-2 font-medium">disponibles</span>
                </div>
              </div>

              <div onClick={() => navigateToTab("configuracion")} className="glass-panel glass-panel-hover rounded-2xl p-6 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Empresa & Logo</span>
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Settings className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5">
                  <span className="text-base font-bold text-amber-300 block">{empresaConfig.logoBase64 ? "Logo Personalizado" : "Sin Logo"}</span>
                  <span className="text-xs text-slate-400 font-medium">Formato Carta & Notas</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* PESTAÑA 2: ALQUILERES */}
        {activeTab === "alquileres" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white">Gestión de Alquileres & Contratos</h1>
                <p className="text-xs text-slate-400">Fechas Individuales por Ítem, Días Calculados y PDF Carta con Logo de {empresaConfig.razonSocial}</p>
              </div>
              <button 
                onClick={() => handleOpenNuevoAlquiler()}
                className="glass-button-primary px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2 shadow-lg shadow-sky-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Contrato Multi-Equipo</span>
              </button>
            </div>

            {/* Filtros */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="flex space-x-1.5 overflow-x-auto w-full sm:w-auto">
                {(["TODOS", "ACTIVO", "COTIZACION", "FINALIZADO"] as AlquilerEstadoFilter[]).map((estado) => (
                  <button
                    key={estado}
                    onClick={() => setAlquilerEstadoFilter(estado)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      alquilerEstadoFilter === estado
                        ? "bg-sky-500/20 text-sky-300 border border-sky-400/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {estado === "TODOS" ? "Todos" : estado}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={alquilerSearchFilter}
                  onChange={(e) => setAlquilerSearchFilter(e.target.value)}
                  placeholder="Buscar contrato, cliente..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Listado */}
            {contratosFiltrados.length === 0 ? (
              <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 space-y-3">
                <FileText className="h-10 w-10 mx-auto text-sky-400/60" />
                <p className="text-sm font-medium">No hay contratos registrados para este criterio de búsqueda.</p>
                <button onClick={() => handleOpenNuevoAlquiler()} className="glass-button-primary px-5 py-2 text-xs font-bold text-white rounded-xl">
                  Crear Primer Alquiler
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contratosFiltrados.map((contrato) => (
                  <div key={contrato.id} className="glass-panel glass-panel-hover rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">
                          {contrato.estado === 'COTIZACION' ? `COT-${contrato.consecutivo}` : `ALQ-${contrato.consecutivo}`}
                        </span>
                        <h3 className="font-extrabold text-white text-sm mt-1">{contrato.clienteNombre}</h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        contrato.estado === 'ACTIVO' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        contrato.estado === 'COTIZACION' ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                        "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}>
                        {contrato.estado}
                      </span>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 space-y-1.5 text-xs">
                      <div className="text-slate-400 font-medium">Equipos ({contrato.items.length}):</div>
                      <ul className="space-y-1">
                        {contrato.items.map((it, idx) => (
                          <li key={idx} className="flex justify-between text-slate-300">
                            <span>• {it.cantidad}x {it.nombre} ({it.dias} días)</span>
                            <span className="font-bold text-sky-300">{formatearMonedaCOP(it.subtotal)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                        <span className="text-[10px] text-slate-500 block">Total</span>
                        <strong className="text-white">{formatearMonedaCOP(contrato.total)}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                        <span className="text-[10px] text-slate-500 block">Abonado</span>
                        <strong className="text-emerald-400">{formatearMonedaCOP(contrato.totalPagado || 0)}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                        <span className="text-[10px] text-slate-500 block">Saldo</span>
                        <strong className="text-sky-400">{formatearMonedaCOP(Math.max(0, contrato.total - (contrato.totalPagado || 0)))}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs gap-2">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAbrirVisorPDFCarta(contrato, contrato.estado === 'COTIZACION' ? 'COTIZACION' : 'CONTRATO')}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 font-semibold border border-indigo-500/30 flex items-center space-x-1.5"
                        >
                          <Printer className="h-3.5 w-3.5 text-indigo-400" />
                          <span>PDF Carta</span>
                        </button>
                        {(contrato.estado === 'COTIZACION' || contrato.estado === 'ACTIVO') && (
                          <button 
                            onClick={() => handleOpenEditarAlquiler(contrato)}
                            className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 font-semibold border border-sky-500/30 flex items-center space-x-1"
                          >
                            <FileEdit className="h-3.5 w-3.5" />
                            <span>Editar</span>
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleOpenHistorialPagos(contrato)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/60 text-slate-300 font-semibold border border-white/10 flex items-center space-x-1"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          <span>Pagos</span>
                        </button>
                        <button 
                          onClick={() => handleOpenRegistrarPago(contrato)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center space-x-1"
                        >
                          <Wallet className="h-3.5 w-3.5" />
                          <span>Abonar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: BODEGA E INVENTARIO */}
        {activeTab === "bodega" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Cabecera del Módulo con Acciones Principales */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2.5">
                  <Package className="h-7 w-7 text-sky-400" />
                  <span>Catálogo de Bodega e Inventario</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Control de stock en tiempo real, carga masiva, edición y ficha técnica de maquinaria
                </p>
              </div>

              <div className="flex items-center space-x-2.5 flex-wrap">
                <button
                  onClick={handleOpenCargaMasiva}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center space-x-2 transition-all shadow-md active:scale-95"
                >
                  <FileSpreadsheet className="h-4 w-4 text-indigo-400" />
                  <span>Carga Masiva (CSV / Lote)</span>
                </button>

                <button
                  onClick={handleOpenCrearEquipo}
                  className="glass-button-primary px-4 py-2.5 rounded-2xl text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-lg active:scale-95"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Nuevo Equipo</span>
                </button>
              </div>
            </div>

            {/* Fila de Métricas y Resumen de Stock */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="glass-panel rounded-2xl p-4 space-y-1">
                <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block">Catálogo Activo</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black text-white">{totalEquiposRegistrados}</span>
                  <span className="text-xs text-slate-400 font-semibold">referencias</span>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-4 space-y-1">
                <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block">Stock Total Físico</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black text-sky-400">{totalStockFisico}</span>
                  <span className="text-xs text-slate-400 font-semibold">unidades</span>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-4 space-y-1">
                <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block">Stock Disponible</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black text-emerald-400">{totalStockDisponible}</span>
                  <span className="text-xs text-slate-400 font-semibold">para alquiler</span>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-4 space-y-1">
                <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block">Stock en Obra</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black text-amber-400">{totalStockEnObra}</span>
                  <span className="text-xs text-slate-400 font-semibold">despachadas</span>
                </div>
              </div>
            </div>

            {/* Barra de Filtros, Búsqueda y Categorías */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Buscador */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={bodegaSearchQuery}
                  onChange={(e) => setBodegaSearchQuery(e.target.value)}
                  placeholder="Buscar por código, nombre de equipo o categoría..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                />
                {bodegaSearchQuery && (
                  <button
                    onClick={() => setBodegaSearchQuery("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filtro por Categoría */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-sky-400 shrink-0" />
                <select
                  value={bodegaCategoriaFilter}
                  onChange={(e) => {
                    setBodegaCategoriaFilter(e.target.value);
                    setBodegaSubcategoriaFilter("TODAS");
                  }}
                  className="px-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500/50"
                >
                  {categoriasDisponibles.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "TODAS" ? "Todas las Categorías" : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Subcategoría */}
              <div className="flex items-center space-x-2">
                <Tags className="h-4 w-4 text-indigo-400 shrink-0" />
                <select
                  value={bodegaSubcategoriaFilter}
                  onChange={(e) => setBodegaSubcategoriaFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500/50"
                >
                  {subcategoriasDisponibles.map((subcat) => (
                    <option key={subcat} value={subcat}>
                      {subcat === "TODAS" ? "Todas las Subcategorías" : subcat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Disponibilidad */}
              <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-white/10 text-xs">
                {(["TODOS", "DISPONIBLE", "AGOTADO"] as const).map((disp) => (
                  <button
                    key={disp}
                    onClick={() => setBodegaDisponibilidadFilter(disp)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                      bodegaDisponibilidadFilter === disp
                        ? "bg-sky-500 text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {disp === "TODOS" ? "Todos" : disp === "DISPONIBLE" ? "Disponibles" : "Agotados"}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Equipos */}
            {equiposFiltrados.length === 0 ? (
              <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 space-y-4">
                <Package className="h-12 w-12 mx-auto text-sky-400/50" />
                <p className="text-sm font-medium">No se encontraron equipos que coincidan con los filtros seleccionados.</p>
                <button
                  onClick={handleOpenCrearEquipo}
                  className="glass-button-primary px-5 py-2 text-xs font-bold text-white rounded-xl"
                >
                  Registrar Primer Equipo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {equiposFiltrados.map((item) => (
                  <div key={item.id} className="glass-panel glass-panel-hover rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Cabecera de Tarjeta con Código y Badges Jerárquicos */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/25 text-[11px] font-mono font-black tracking-wider">
                            {item.codigo}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 text-sky-300 border border-white/10 text-[10px] font-bold uppercase flex items-center space-x-1">
                            <span>{item.categoria}</span>
                            {item.subcategoria && (
                              <>
                                <span className="text-slate-500 font-mono">›</span>
                                <span className="text-slate-300 font-semibold">{item.subcategoria}</span>
                              </>
                            )}
                          </span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                          item.stockDisponible > 0 
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10" 
                            : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        }`}>
                          {item.stockDisponible > 0 ? `${item.stockDisponible} DISPONIBLES` : "AGOTADO"}
                        </span>
                      </div>

                      {/* Nombre */}
                      <h3 className="font-extrabold text-white text-sm leading-snug tracking-tight line-clamp-2">
                        {item.nombre}
                      </h3>

                      {/* Ficha rápida: Tarifa Diaria y Subcategoría */}
                      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 text-xs flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Tarifa Diaria:</span>
                          <strong className="text-sky-300 font-black">{formatearMonedaCOP(item.tarifaDiaria)}</strong>
                          <span className="text-[10px] text-slate-500"> /día</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Subcategoría:</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-white/5 font-semibold inline-block">
                            {item.subcategoria || "GENERAL"}
                          </span>
                        </div>
                      </div>

                      {/* Balance de Stock */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-extrabold">Total</span>
                          <strong className="text-white font-black text-sm">{item.stockTotal}</strong>
                          <span className="text-[10px] text-slate-500"> u.</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-400 block uppercase font-extrabold">Disponible</span>
                          <strong className="text-emerald-400 font-black text-sm">{item.stockDisponible}</strong>
                          <span className="text-[10px] text-emerald-500"> u.</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-400 block uppercase font-extrabold">En Obra</span>
                          <strong className="text-amber-400 font-black text-sm">{item.stockEnObra}</strong>
                          <span className="text-[10px] text-amber-500"> u.</span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenVerDetalleEquipo(item)}
                          className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                        >
                          <Eye className="h-3.5 w-3.5 text-sky-400" />
                          <span>Ver Ficha</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditarEquipo(item)}
                          className="px-3 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                        >
                          <Edit className="h-3.5 w-3.5 text-sky-400" />
                          <span>Editar / Stock</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleOpenNuevoAlquiler(item.id)}
                        disabled={item.stockDisponible === 0}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                          item.stockDisponible > 0
                            ? "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10 active:scale-95"
                            : "bg-slate-900 text-slate-600 border border-white/5 cursor-not-allowed"
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>{item.stockDisponible > 0 ? "Alquilar Este Equipo" : "Sin Stock para Alquilar"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 4: DEVOLUCIONES */}
        {activeTab === "devoluciones" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Recepción de Devoluciones & Registro de Daños</h1>
                <p className="text-xs text-slate-400">Reingreso a Bodega e Inspección Física de Equipos</p>
              </div>
            </div>

            <div className="space-y-4">
              {contratos.filter(c => c.estado === 'ACTIVO').length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 space-y-3">
                  <RotateCcw className="h-10 w-10 mx-auto text-amber-400/70" />
                  <p className="text-sm font-medium">No hay contratos activos con devoluciones pendientes de equipos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contratos.filter(c => c.estado === 'ACTIVO').map((contrato) => (
                    <div key={contrato.id} className="glass-panel rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">ALQ-{contrato.consecutivo}</span>
                          <h3 className="font-extrabold text-white text-sm mt-1">{contrato.clienteNombre}</h3>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">EN OBRA</span>
                      </div>

                      <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 space-y-1 text-xs">
                        {contrato.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-slate-300">
                            <span>{it.nombre}</span>
                            <span className="font-bold text-amber-300">{it.cantidad - (it.cantidadDevuelta || 0)} u. por devolver</span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => handleOpenDevolucion(contrato)}
                        className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center space-x-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Registrar Retorno / Inspección</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 5: FACTURACIÓN */}
        {activeTab === "facturacion" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Facturación & Cuentas de Cobro</h1>
                <p className="text-xs text-slate-400">Liquidación en COP con Logo Corporativo y Totales en Letras</p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Contratos Listos para Liquidación:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contratos.map((contrato) => (
                  <div key={contrato.id} className="glass-panel rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">ALQ-{contrato.consecutivo}</span>
                        <h3 className="font-extrabold text-white text-sm mt-1">{contrato.clienteNombre}</h3>
                      </div>
                      <span className="text-xs font-extrabold text-sky-400">{formatearMonedaCOP(contrato.total)}</span>
                    </div>

                    <button 
                      onClick={() => handleOpenFacturacion(contrato)}
                      className="w-full py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 text-xs font-bold flex items-center justify-center space-x-2"
                    >
                      <Receipt className="h-4 w-4 text-indigo-400" />
                      <span>Liquidar & Emitir Cuenta de Cobro (PDF)</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Facturas Emitidas */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Historial de Cuentas de Cobro ({facturas.length}):</span>
              {facturas.length === 0 ? (
                <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-xs">
                  No hay cuentas de cobro generadas todavía.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facturas.map((fac) => {
                    const cMatch = contratos.find(c => c.id === fac.alquilerId);
                    return (
                      <div key={fac.id} className="glass-panel rounded-2xl p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">CC-{fac.numeroConsecutivo}</span>
                            <h4 className="font-bold text-white text-sm mt-1">{fac.clienteNombre}</h4>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">EMITIDA</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-300 border-t border-white/5 pt-2">
                          <span>Total Liquidado:</span>
                          <strong className="text-sky-300 font-extrabold">{formatearMonedaCOP(fac.totalPagar)}</strong>
                        </div>
                        {cMatch && (
                          <button 
                            onClick={() => handleAbrirVisorPDFCarta(cMatch, "CUENTA_COBRO")}
                            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-sky-400 flex items-center justify-center space-x-1.5"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Generar PDF Carta con Logo</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 6: CARTERA & PAGOS */}
        {activeTab === "cartera" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Módulo de Cartera, Recaudo & Pagos</h1>
                <p className="text-xs text-slate-400">Control de Cuentas por Cobrar (CxC), Abonos Parciales y Recibos de Caja</p>
              </div>
            </div>

            {/* Resumen Financiero Cartera */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel rounded-2xl p-5 border border-white/10">
                <span className="text-xs text-slate-400 uppercase font-bold block">Total Facturado</span>
                <strong className="text-2xl font-black text-white mt-1 block">{formatearMonedaCOP(totalFacturadoGlobal)}</strong>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20 bg-emerald-950/20">
                <span className="text-xs text-emerald-400 uppercase font-bold block">Total Recaudado / Pagado</span>
                <strong className="text-2xl font-black text-emerald-300 mt-1 block">{formatearMonedaCOP(totalRecaudadoGlobal)}</strong>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-amber-500/20 bg-amber-950/20">
                <span className="text-xs text-amber-400 uppercase font-bold block">Saldo Pendiente de Cobro</span>
                <strong className="text-2xl font-black text-amber-300 mt-1 block">{formatearMonedaCOP(saldoCarteraPendienteGlobal)}</strong>
              </div>
            </div>

            {/* Estado de Cartera por Contrato */}
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Estado de Cartera por Contrato:</span>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Contrato</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3 text-right">Total Facturado</th>
                      <th className="p-3 text-right">Abonos</th>
                      <th className="p-3 text-right">Saldo Pendiente</th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {contratos.map((c) => {
                      const saldo = Math.max(0, c.total - (c.totalPagado || 0));
                      return (
                        <tr key={c.id} className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-sky-400">ALQ-{c.consecutivo}</td>
                          <td className="p-3 text-white font-medium">{c.clienteNombre}</td>
                          <td className="p-3 text-right font-bold text-slate-200">{formatearMonedaCOP(c.total)}</td>
                          <td className="p-3 text-right font-bold text-emerald-400">{formatearMonedaCOP(c.totalPagado || 0)}</td>
                          <td className="p-3 text-right font-black text-amber-300">{formatearMonedaCOP(saldo)}</td>
                          <td className="p-3 text-center">
                            {saldo > 0 ? (
                              <button
                                onClick={() => handleOpenRegistrarPago(c)}
                                className="px-3 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 font-bold text-[11px] border border-emerald-500/30"
                              >
                                Registrar Pago
                              </button>
                            ) : (
                              <span className="text-emerald-400 font-bold text-[11px] px-2 py-0.5 rounded bg-emerald-500/10">PAZ Y SALVO</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historial de Pagos / Recibos */}
            <div className="glass-panel rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Historial de Recibos de Caja ({pagos.length}):</span>
              {pagos.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No se han registrado abonos o pagos todavía.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pagos.map((p) => (
                    <div key={p.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-400">RECIBO #{p.consecutivo}</span>
                        <span className="text-[10px] text-slate-500">{p.fecha}</span>
                      </div>
                      <div className="text-white font-bold">{p.clienteNombre}</div>
                      <div className="flex justify-between text-slate-300 text-[11px]">
                        <span>Abono ALQ-{p.consecutivoAlquiler} ({p.metodoPago}):</span>
                        <strong className="text-emerald-300">{formatearMonedaCOP(p.monto)}</strong>
                      </div>
                      {p.referencia && <div className="text-[10px] text-slate-400">Ref: {p.referencia}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 7: CLIENTES */}
        {activeTab === "clientes" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Directorio de Clientes & Terceros</h1>
                <p className="text-xs text-slate-400">Sanitización en Mayúsculas e Historiales Cruzados</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientes.map((cliente) => (
                <div key={cliente.id} className="glass-panel glass-panel-hover rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">{cliente.nitCedula}</span>
                      <h3 className="font-extrabold text-white text-sm mt-1">{cliente.nombre}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">ACTIVO</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button onClick={() => handleOpenNuevoAlquiler(undefined, cliente.id)} className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1">
                      <Plus className="h-3.5 w-3.5" />
                      <span>Generar Alquiler</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 8: CONFIGURACIÓN DE LA EMPRESA & BRANDING */}
        {activeTab === "configuracion" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Información General de la Empresa & Branding</h1>
                <p className="text-xs text-slate-400">Carga de Logo Corporativo, Datos Fiscales y Comentarios Bancarios/Legales para PDFs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* PANEL DE CARGA DE LOGO */}
              <div className="glass-panel rounded-3xl p-6 space-y-4 border border-white/10 flex flex-col items-center text-center">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Logo de la Empresa</span>
                
                <div className="w-full h-44 rounded-2xl bg-slate-900/80 border-2 border-dashed border-white/20 flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-slate-500 space-y-2 flex flex-col items-center">
                      <ImageIcon className="h-10 w-10 text-slate-600" />
                      <span className="text-xs">No hay logo cargado</span>
                    </div>
                  )}
                </div>

                <label className="w-full py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all">
                  <Upload className="h-4 w-4" />
                  <span>Cargar Imagen de Logo</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {logoPreview && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setLogoPreview("");
                      setEmpresaConfig(prev => ({ ...prev, logoBase64: "" }));
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Eliminar Logo
                  </button>
                )}
                <p className="text-[11px] text-slate-400">Este logo se incrustará automáticamente en la cabecera de todas las Cotizaciones, Contratos y Cuentas de Cobro en tamaño Carta.</p>
              </div>

              {/* FORMULARIO DE DATOS FISCALES & NOTAS DE FACTURA */}
              <div className="glass-panel rounded-3xl p-6 lg:col-span-2 space-y-4 border border-white/10">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Datos Fiscales & Parámetros Documentales:</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-bold block">Razón Social de la Empresa</label>
                    <input
                      type="text"
                      value={empresaConfig.razonSocial}
                      onChange={(e) => setEmpresaConfig({ ...empresaConfig, razonSocial: e.target.value })}
                      className="w-full p-2 mt-1 bg-slate-900 border border-white/10 rounded-xl text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block">NIT / Cédula Fiscal</label>
                    <input
                      type="text"
                      value={empresaConfig.nit}
                      onChange={(e) => setEmpresaConfig({ ...empresaConfig, nit: e.target.value })}
                      className="w-full p-2 mt-1 bg-slate-900 border border-white/10 rounded-xl text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block">Teléfonos de Contacto</label>
                    <input
                      type="text"
                      value={empresaConfig.telefono}
                      onChange={(e) => setEmpresaConfig({ ...empresaConfig, telefono: e.target.value })}
                      className="w-full p-2 mt-1 bg-slate-900 border border-white/10 rounded-xl text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block">Correo Electrónico Oficial</label>
                    <input
                      type="email"
                      value={empresaConfig.email}
                      onChange={(e) => setEmpresaConfig({ ...empresaConfig, email: e.target.value })}
                      className="w-full p-2 mt-1 bg-slate-900 border border-white/10 rounded-xl text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block">Dirección Principal</label>
                    <input
                      type="text"
                      value={empresaConfig.direccion}
                      onChange={(e) => setEmpresaConfig({ ...empresaConfig, direccion: e.target.value })}
                      className="w-full p-2 mt-1 bg-slate-900 border border-white/10 rounded-xl text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block">Ciudad / País</label>
                    <input
                      type="text"
                      value={empresaConfig.ciudad}
                      onChange={(e) => setEmpresaConfig({ ...empresaConfig, ciudad: e.target.value })}
                      className="w-full p-2 mt-1 bg-slate-900 border border-white/10 rounded-xl text-slate-100"
                    />
                  </div>
                </div>

                {/* Comentarios Bancarios para los PDFs */}
                <div className="space-y-1 text-xs">
                  <label className="text-slate-300 font-bold block">Instrucciones Bancarias (Cuentas para Transferencias en PDFs):</label>
                  <textarea
                    rows={2}
                    value={empresaConfig.cuentaBancariaInfo}
                    onChange={(e) => setEmpresaConfig({ ...empresaConfig, cuentaBancariaInfo: e.target.value })}
                    placeholder="Ej: Cuenta de Ahorros Bancolombia No. 123-456789-01..."
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-slate-100 text-xs"
                  />
                </div>

                {/* Términos y Condiciones */}
                <div className="space-y-1 text-xs">
                  <label className="text-slate-300 font-bold block">Términos, Horario de Corte y Comentarios Legales en PDFs:</label>
                  <textarea
                    rows={2}
                    value={empresaConfig.notasFacturaPDF}
                    onChange={(e) => setEmpresaConfig({ ...empresaConfig, notasFacturaPDF: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-slate-100 text-xs"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="button" 
                    onClick={() => alert("¡Configuración de Empresa y Branding guardados exitosamente!")}
                    className="glass-button-primary px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2 shadow-lg shadow-sky-500/20"
                  >
                    <Check className="h-4 w-4" />
                    <span>Guardar Configuración de Empresa</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* PESTAÑA 8: AUDITORÍA & TRAZABILIDAD (AUDIT TRAIL FORENSE) */}
        {activeTab === "auditoria" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header del Módulo de Auditoría */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/15 via-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 space-y-2 max-w-2xl">
                <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Bitácora Inmutable & Trazabilidad Forense</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Auditoría Global de Registros
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Registro cronológico y no repudiable de todas las transacciones, mutaciones de stock, contratos, pagos y accesos de seguridad.
                </p>
              </div>

              <div className="relative z-10 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
                    const downloadAnchor = document.createElement("a");
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `audit_log_${new Date().toISOString().slice(0,10)}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center space-x-2 transition-all active:scale-95 shadow-md"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Exportar JSON</span>
                </button>
              </div>
            </div>

            {/* Tarjetas KPI de Auditoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Eventos</span>
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-white">{auditLogs.length}</span>
                  <span className="text-[11px] text-slate-400 ml-2">registros en bitácora</span>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Operadores Activos</span>
                  <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-white">
                    {new Set(auditLogs.map((l) => l.userId)).size}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-2">usuarios con eventos</span>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Módulos Auditados</span>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-white">
                    {new Set(auditLogs.map((l) => l.modulo)).size}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-2">áreas bajo control</span>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sesión Actual</span>
                  <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 truncate">
                  <span className="text-sm font-black text-white block truncate">{currentUser?.nombre || "Sin Sesión"}</span>
                  <span className="text-[10px] text-sky-400 font-bold">{currentUser ? ROLE_INFO[currentUser.rol].label : "Anónimo"}</span>
                </div>
              </div>
            </div>

            {/* Barra de Filtros de Auditoría */}
            <div className="glass-panel rounded-3xl p-5 space-y-4 border border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Buscador */}
                <div className="relative">
                  <label className="text-slate-400 font-bold block mb-1">Buscar por Operador / Evento / ID</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      placeholder="Ej: MEZCLADORA, Roberto, ALQ-1001..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {auditSearchQuery && (
                      <button
                        onClick={() => setAuditSearchQuery("")}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtro Módulo */}
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Filtrar por Módulo</label>
                  <select
                    value={auditFilterModulo}
                    onChange={(e) => setAuditFilterModulo(e.target.value as any)}
                    className="w-full py-2 px-3 bg-slate-900 border border-white/10 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TODOS">Todos los Módulos</option>
                    <option value="SEGURIDAD">SEGURIDAD (Login/Logout)</option>
                    <option value="BODEGA">BODEGA (Equipos/Stock)</option>
                    <option value="ALQUILERES">ALQUILERES (Contratos)</option>
                    <option value="DEVOLUCIONES">DEVOLUCIONES</option>
                    <option value="FACTURACION">FACTURACION (Cuentas Cobro)</option>
                    <option value="CARTERA">CARTERA (Recaudos)</option>
                    <option value="CLIENTES">CLIENTES</option>
                    <option value="CONFIGURACION">CONFIGURACION</option>
                  </select>
                </div>

                {/* Resumen de Filtros */}
                <div className="flex items-end justify-between">
                  <div className="text-[11px] text-slate-400 pb-2">
                    Mostrando <strong className="text-white">{
                      auditLogs.filter((l) => {
                        const matchMod = auditFilterModulo === "TODOS" || l.modulo === auditFilterModulo;
                        const matchQ =
                          !auditSearchQuery ||
                          l.userNombre.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                          l.descripcion.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                          (l.entidadId && l.entidadId.toLowerCase().includes(auditSearchQuery.toLowerCase())) ||
                          l.accion.toLowerCase().includes(auditSearchQuery.toLowerCase());
                        return matchMod && matchQ;
                      }).length
                    }</strong> de <strong>{auditLogs.length}</strong> eventos
                  </div>

                  {(auditFilterModulo !== "TODOS" || auditSearchQuery) && (
                    <button
                      onClick={() => {
                        setAuditFilterModulo("TODOS");
                        setAuditSearchQuery("");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Limpiar Filtros
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline / Tabla de Auditoría */}
            <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-900/70 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Fecha / Hora</th>
                      <th className="py-3.5 px-4">Operador & Rol</th>
                      <th className="py-3.5 px-4">Módulo</th>
                      <th className="py-3.5 px-4">Acción</th>
                      <th className="py-3.5 px-4">Descripción del Evento</th>
                      <th className="py-3.5 px-4 text-right">Trazabilidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogs
                      .filter((l) => {
                        const matchMod = auditFilterModulo === "TODOS" || l.modulo === auditFilterModulo;
                        const matchQ =
                          !auditSearchQuery ||
                          l.userNombre.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                          l.descripcion.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                          (l.entidadId && l.entidadId.toLowerCase().includes(auditSearchQuery.toLowerCase())) ||
                          l.accion.toLowerCase().includes(auditSearchQuery.toLowerCase());
                        return matchMod && matchQ;
                      })
                      .map((log) => {
                        const fechaFormat = new Date(log.timestamp).toLocaleString("es-CO", {
                          dateStyle: "short",
                          timeStyle: "medium",
                        });

                        return (
                          <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              {fechaFormat}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-sky-300 shrink-0">
                                  {log.userNombre.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white truncate max-w-[140px] leading-tight">{log.userNombre}</p>
                                  <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.2 rounded border mt-0.5 ${ROLE_INFO[log.userRol]?.badgeClass || "text-slate-400"}`}>
                                    {ROLE_INFO[log.userRol]?.label || log.userRol}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 border border-white/10 text-slate-300">
                                {log.modulo}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono ${
                                log.accion.includes("CREAR") || log.accion.includes("EMITIR")
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : log.accion.includes("AJUSTAR") || log.accion.includes("EDITAR")
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : log.accion.includes("LOGIN") || log.accion.includes("LOGOUT")
                                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              }`}>
                                {log.accion}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-slate-300 max-w-xs md:max-w-md">
                              <p className="line-clamp-2 leading-relaxed">{log.descripcion}</p>
                              {log.entidadId && (
                                <span className="inline-block mt-0.5 text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 rounded">
                                  Ref: {log.entidadId}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedAuditDetalle(log);
                                  setShowAuditDetalleModal(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 hover:text-sky-200 border border-white/10 hover:border-sky-500/30 text-xs font-bold transition-all active:scale-95 flex items-center space-x-1 ml-auto"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Ver Diff</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL REGISTRAR ABONO / PAGO EN CARTERA */}
      {showPagoModal && contratoParaPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ALQ-{contratoParaPago.consecutivo}</span>
                <h2 className="text-lg font-black text-white mt-1">Registrar Recaudo / Abono</h2>
              </div>
              <button onClick={() => setShowPagoModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleConfirmarPago} className="space-y-4">
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 space-y-1 text-xs">
                <div className="text-slate-400">Cliente: <strong className="text-white">{contratoParaPago.clienteNombre}</strong></div>
                <div className="flex justify-between text-slate-300">
                  <span>Total Contrato: <strong>{formatearMonedaCOP(contratoParaPago.total)}</strong></span>
                  <span>Saldo Pendiente: <strong className="text-amber-300">{formatearMonedaCOP(Math.max(0, contratoParaPago.total - (contratoParaPago.totalPagado || 0)))}</strong></span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block">Monto a Abonar (COP)*</label>
                <input
                  type="number"
                  min={1}
                  value={pagoMonto}
                  onChange={(e) => setPagoMonto(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 mt-1 bg-slate-900 border border-white/10 rounded-xl text-sm font-bold text-emerald-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block">Método de Pago</label>
                  <select
                    value={pagoMetodo}
                    onChange={(e) => setPagoMetodo(e.target.value as any)}
                    className="w-full p-2 mt-1 bg-slate-900 border border-white/10 rounded-xl text-slate-100"
                  >
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="NEQUI">Nequi</option>
                    <option value="DAVIPLATA">Daviplata</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-bold block">No. Comprobante / Ref.</label>
                  <input
                    type="text"
                    value={pagoReferencia}
                    onChange={(e) => setPagoReferencia(e.target.value)}
                    placeholder="Ej: Aprobación #8844"
                    className="w-full p-2 mt-1 bg-slate-900 border border-white/10 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowPagoModal(false)} className="px-4 py-2 bg-slate-900 text-xs font-bold rounded-xl">Cancelar</button>
                <button type="submit" className="glass-button-primary px-5 py-2 text-xs font-bold text-white rounded-xl">Confirmar Recaudo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL PAGOS POR CONTRATO */}
      {showHistorialPagosModal && contratoParaPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ALQ-{contratoParaPago.consecutivo}</span>
                <h2 className="text-lg font-black text-white mt-1">Historial de Pagos y Abonos</h2>
              </div>
              <button onClick={() => setShowHistorialPagosModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 space-y-1 text-xs">
                <div className="text-slate-400">Cliente: <strong className="text-white">{contratoParaPago.clienteNombre}</strong></div>
                <div className="flex justify-between text-slate-300">
                  <span>Total Contrato: <strong>{formatearMonedaCOP(contratoParaPago.total)}</strong></span>
                  <span>Saldo Pendiente: <strong className="text-amber-300">{formatearMonedaCOP(Math.max(0, contratoParaPago.total - (contratoParaPago.totalPagado || 0)))}</strong></span>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                {pagos.filter(p => p.alquilerId === contratoParaPago.id).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No se han registrado abonos o pagos para este contrato.</p>
                ) : (
                  pagos.filter(p => p.alquilerId === contratoParaPago.id).map((p) => (
                    <div key={p.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs space-y-1.5 flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-emerald-400">RECIBO #{p.consecutivo}</span>
                          <span className="text-[10px] text-slate-500">{p.fecha}</span>
                        </div>
                        <div className="text-slate-300 mt-1">
                          Método: <strong className="text-white">{p.metodoPago}</strong>
                          {p.referencia && <span className="ml-2">Ref: {p.referencia}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Monto</span>
                        <strong className="text-lg font-black text-emerald-300">{formatearMonedaCOP(p.monto)}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowHistorialPagosModal(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition-colors">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR CONTRATO / COTIZACIÓN */}
      {showMultiAlquilerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="glass-panel w-full max-w-4xl rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
                <FileText className="h-5 w-5 text-sky-400" />
                <span>{contratoEnEdicionId ? `Editando Contrato` : "Nuevo Contrato / Cotización de Maquinaria"}</span>
              </h2>
              <button onClick={() => setShowMultiAlquilerModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {multiAlquilerError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{multiAlquilerError}</span>
              </div>
            )}

            <form onSubmit={handleGuardarContrato} className="space-y-5">
              
              {/* ENCABEZADO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative sm:col-span-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                    <Search className="h-3.5 w-3.5 text-sky-400" />
                    <span>Cliente Contratante*</span>
                  </label>
                  <div className="relative mt-1">
                    <input 
                      type="text"
                      value={clienteSearchQuery}
                      onChange={(e) => {
                        setClienteSearchQuery(e.target.value);
                        setShowClienteSuggestions(true);
                      }}
                      onFocus={() => setShowClienteSuggestions(true)}
                      placeholder="NIT o Nombre..."
                      className="w-full pl-3 pr-8 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                      required
                    />
                    {clienteSearchQuery && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setClienteSearchQuery("");
                          setNuevoAlquilerClienteId("");
                          setShowClienteSuggestions(true);
                        }} 
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {showClienteSuggestions && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl z-30 max-h-48 overflow-y-auto p-1.5 space-y-1 backdrop-blur-xl">
                      {clientesSugeridos.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setNuevoAlquilerClienteId(c.id);
                            setClienteSearchQuery(`${c.nitCedula} — ${c.nombre}`);
                            setShowClienteSuggestions(false);
                          }}
                          className={`p-2 rounded-xl text-xs cursor-pointer flex justify-between items-center transition-all ${
                            nuevoAlquilerClienteId === c.id ? "bg-sky-600/30 text-sky-200 border border-sky-500/40" : "hover:bg-slate-800 text-slate-300"
                          }`}
                        >
                          <div>
                            <strong className="text-white block">{c.nombre}</strong>
                            <span className="text-sky-400 font-mono text-[10px]">{c.nitCedula}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Fecha Inicio General</span>
                  </label>
                  <input
                    type="date"
                    value={nuevoAlquilerFechaGeneral}
                    onChange={(e) => setNuevoAlquilerFechaGeneral(e.target.value)}
                    className="w-full p-2 mt-1 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Tipo de Documento</label>
                  <select 
                    value={nuevoAlquilerEstado} 
                    onChange={(e) => setNuevoAlquilerEstado(e.target.value as any)}
                    className="w-full p-2 mt-1 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="ACTIVO">Contrato Despachado (Descuenta Stock Bodega)</option>
                    <option value="COTIZACION">Cotización Comercial (No Descuenta Stock)</option>
                  </select>
                </div>
              </div>

              {/* LISTA MULTI-ITEM DE EQUIPOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Package className="h-3.5 w-3.5 text-sky-400" />
                    <span>Equipos en Alquiler (Fechas y Días Individuales)</span>
                  </span>
                  <button 
                    type="button" 
                    onClick={handleAddLineaEquipo}
                    className="px-3 py-1 rounded-xl bg-sky-600/20 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Añadir Otro Equipo</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {nuevoAlquilerLineas.map((linea, index) => {
                    const selectedEq = equipos.find((e) => e.id === linea.equipoId);
                    return (
                      <div key={index} className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex-1">
                            <select
                              value={linea.equipoId}
                              onChange={(e) => handleUpdateLineaEquipo(index, "equipoId", e.target.value)}
                              className="w-full p-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-100"
                            >
                              {equipos.filter(e => e.activo).map((eq) => (
                                <option key={eq.id} value={eq.id}>
                                  {eq.codigo} — {eq.nombre} ({eq.stockDisponible} u. disp.)
                                </option>
                              ))}
                            </select>
                          </div>
                          {nuevoAlquilerLineas.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLineaEquipo(index)}
                              className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Cant. (u.)</span>
                            <input
                              type="number"
                              min={1}
                              max={selectedEq ? selectedEq.stockDisponible : 1}
                              value={linea.cantidad}
                              onChange={(e) => handleUpdateLineaEquipo(index, "cantidad", parseInt(e.target.value, 10) || 1)}
                              className="w-full p-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-indigo-300 block font-bold">Fecha Inicio</span>
                            <input
                              type="date"
                              value={linea.fechaInicio}
                              onChange={(e) => handleUpdateLineaEquipo(index, "fechaInicio", e.target.value)}
                              className="w-full p-1.5 bg-slate-950 border border-indigo-500/30 rounded-lg text-xs text-indigo-200"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-indigo-300 block font-bold">Fecha Retorno</span>
                            <input
                              type="date"
                              value={linea.fechaFin}
                              onChange={(e) => handleUpdateLineaEquipo(index, "fechaFin", e.target.value)}
                              className="w-full p-1.5 bg-slate-950 border border-indigo-500/30 rounded-lg text-xs text-indigo-200"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Días Calc.</span>
                            <div className="p-1.5 bg-indigo-950/40 text-center font-black text-indigo-300 rounded-lg border border-indigo-500/20">
                              {linea.dias} días
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Tarifa/Día</span>
                            <input
                              type="number"
                              value={linea.tarifaDiaria}
                              onChange={(e) => handleUpdateLineaEquipo(index, "tarifaDiaria", parseFloat(e.target.value) || 0)}
                              className="w-full p-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Subtotal</span>
                            <div className="p-1.5 text-sky-300 font-extrabold text-xs text-right">
                              {formatearMonedaCOP(linea.cantidad * linea.tarifaDiaria * linea.dias)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FLETES */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-3">
                <span className="text-xs font-bold text-indigo-300 uppercase flex items-center space-x-1.5">
                  <Truck className="h-4 w-4" />
                  <span>Costos de Transporte & Logística</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300">Valor por Llevar Items (Flete Entrega COP)</label>
                    <input
                      type="number"
                      min={0}
                      value={nuevoAlquilerFleteEntrega}
                      onChange={(e) => setNuevoAlquilerFleteEntrega(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 mt-1 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300">Valor por Recoger Items (Flete Recogida COP)</label>
                    <input
                      type="number"
                      min={0}
                      value={nuevoAlquilerFleteRecogida}
                      onChange={(e) => setNuevoAlquilerFleteRecogida(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 mt-1 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 flex items-center space-x-1">
                    <Car className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Detalles Logísticos de Transporte</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoAlquilerDetallesLogistica}
                    onChange={(e) => setNuevoAlquilerDetallesLogistica(e.target.value)}
                    placeholder="Ej: Lleva Don Carlos Cárdenas en Camión NPR Placa ABC-123"
                    className="w-full p-2 mt-1 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-100"
                  />
                </div>
              </div>

              {/* Depósitos & Garantías */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Depósito en Efectivo (COP)</label>
                  <input
                    type="number"
                    value={nuevoAlquilerDeposito}
                    onChange={(e) => setNuevoAlquilerDeposito(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Monto Garantía (COP)</label>
                  <input
                    type="number"
                    value={nuevoAlquilerGarantiaMonto}
                    onChange={(e) => setNuevoAlquilerGarantiaMonto(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Tipo Garantía</label>
                  <input
                    type="text"
                    value={nuevoAlquilerGarantiaTipo}
                    onChange={(e) => setNuevoAlquilerGarantiaTipo(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* RESUMEN */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div><span className="text-[10px] text-slate-400 block uppercase font-bold">Subtotal Equipos</span><strong className="text-sm font-black text-white">{formatearMonedaCOP(subtotalEquipos)}</strong></div>
                <div><span className="text-[10px] text-indigo-400 block uppercase font-bold">+ Total Fletes</span><strong className="text-sm font-black text-indigo-300">{formatearMonedaCOP(totalFletes)}</strong></div>
                <div><span className="text-[10px] text-emerald-400 block uppercase font-bold">- Depósito</span><strong className="text-sm font-black text-emerald-400">{formatearMonedaCOP(nuevoAlquilerDeposito || 0)}</strong></div>
                <div><span className="text-[10px] text-sky-400 block uppercase font-bold">Saldo a Cobrar</span><strong className="text-base font-black text-sky-300">{formatearMonedaCOP(totalContrato)}</strong></div>
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setShowMultiAlquilerModal(false)} className="px-4 py-2.5 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl">Cancelar</button>
                <button type="submit" className="glass-button-primary px-5 py-2.5 text-xs font-bold text-white rounded-xl">
                  {nuevoAlquilerEstado === 'COTIZACION' ? 'Guardar Cotización' : 'Confirmar y Despachar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DEVOLUCIÓN */}
      

            <RegistrarDevolucionModal
        isOpen={showDevolucionModal}
        onClose={() => setShowDevolucionModal(false)}
        contratoParaDevolucion={contratoParaDevolucion}
        onConfirmarDevolucion={handleConfirmarDevolucion}
      />
      <HistorialDevolucionesModal
        isOpen={showHistorialDevolucionesModal}
        onClose={() => setShowHistorialDevolucionesModal(false)}
        contratoParaDevolucion={contratoParaDevolucion}
        devoluciones={devoluciones.filter(d => d.alquilerId === contratoParaDevolucion?.id)}
      />

      {/* MODAL FACTURACIÓN */}
      {showFacturaModal && contratoParaFacturar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">ALQ-{contratoParaFacturar.consecutivo}</span>
                <h2 className="text-lg font-black text-white mt-1">Liquidación & Cuenta de Cobro Oficial</h2>
              </div>
              <button onClick={() => setShowFacturaModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase">Detalle Completo (100% de Renglones):</span>
              <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-2xl border border-white/5 text-xs">
                {contratoParaFacturar.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-slate-300">
                    <span>{it.cantidad}x {it.nombre} ({it.dias} días: {it.fechaInicio} al {it.fechaFin})</span>
                    <span className="font-bold text-sky-300">{formatearMonedaCOP(it.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
              <button type="button" onClick={() => setShowFacturaModal(false)} className="px-4 py-2 bg-slate-900 text-xs font-bold rounded-xl">Cerrar</button>
              <button onClick={handleEmitirFactura} className="glass-button-primary px-5 py-2 text-xs font-bold text-white rounded-xl flex items-center space-x-2">
                <Printer className="h-4 w-4" />
                <span>Emitir Cuenta de Cobro & Generar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR EQUIPO INDIVIDUAL */}
      {showEquipoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">
                    {equipoEnEdicion ? `Editar Equipo: ${equipoEnEdicion.codigo}` : "Nuevo Equipo en Bodega"}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {equipoEnEdicion ? "Ajuste de inventario, tarifas y especificaciones técnicas" : "Registro individual en catálogo de inventario físico"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEquipoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {equipoFormError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{equipoFormError}</span>
              </div>
            )}

            <form onSubmit={handleGuardarEquipo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs font-bold text-slate-300 block mb-1">Código Único*</label>
                  <input
                    type="text"
                    value={equipoFormCodigo}
                    onChange={(e) => setEquipoFormCodigo(e.target.value.toUpperCase())}
                    placeholder="Ej: MEZ-01"
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono font-bold text-sky-300 focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300">Categoría*</label>
                    <button
                      type="button"
                      onClick={() => {
                        setNuevaCatNombre("");
                        setNuevaCatSubcatInicial("");
                        setNuevaCatError(null);
                        setShowNuevaCategoriaModal(true);
                      }}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center space-x-0.5 transition-colors"
                      title="Crear nueva categoría"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Nueva</span>
                    </button>
                  </div>
                  <select
                    value={equipoFormCategoria}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setEquipoFormCategoria(newCat);
                      const catObj = categoriasMaster.find(c => c.nombre.toUpperCase() === newCat.toUpperCase());
                      if (catObj && catObj.subcategorias.length > 0) {
                        setEquipoFormSubcategoria(catObj.subcategorias[0]);
                      } else {
                        setEquipoFormSubcategoria("GENERAL");
                      }
                    }}
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-sky-300 focus:outline-none focus:border-sky-500"
                  >
                    {categoriasMaster.map((c) => (
                      <option key={c.nombre} value={c.nombre}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-300">Subcategoría*</label>
                    <button
                      type="button"
                      onClick={() => {
                        setNuevaSubcatNombre("");
                        setNuevaSubcatCategoriaTarget(equipoFormCategoria);
                        setNuevaSubcatError(null);
                        setShowNuevaSubcategoriaModal(true);
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-0.5 transition-colors"
                      title="Crear nueva subcategoría"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Nueva</span>
                    </button>
                  </div>
                  <select
                    value={equipoFormSubcategoria}
                    onChange={(e) => setEquipoFormSubcategoria(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    {subcategoriasParaFormulario.map((subcat) => (
                      <option key={subcat} value={subcat}>
                        {subcat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nombre / Descripción del Equipo*</label>
                <input
                  type="text"
                  value={equipoFormNombre}
                  onChange={(e) => setEquipoFormNombre(e.target.value.toUpperCase())}
                  placeholder="Ej: MEZCLADORA DE CONCRETO 2 BULTOS (MOTOR 13HP)"
                  className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Tarifa Diaria (COP)*</label>
                  <input
                    type="number"
                    min={1}
                    value={equipoFormTarifaDiaria}
                    onChange={(e) => setEquipoFormTarifaDiaria(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-sky-300 focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Stock Total Físico (u.)*</label>
                  <input
                    type="number"
                    min={equipoEnEdicion ? (equipoEnEdicion.stockEnObra || 0) : 0}
                    value={equipoFormStockTotal}
                    onChange={(e) => setEquipoFormStockTotal(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-black text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              {/* Explicación / Balance de Stock en Edición */}
              {equipoEnEdicion && (
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Balance de Stock Resultante:</span>
                    <span className="text-amber-400 font-bold">En Obra: {equipoEnEdicion.stockEnObra} u. (Protegido)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-[10px] text-slate-500 block">Nuevo Stock Total:</span>
                      <strong className="text-white">{equipoFormStockTotal} u.</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-[10px] text-emerald-400 block">Nuevo Stock Disponible:</span>
                      <strong className="text-emerald-400">
                        {Math.max(0, equipoFormStockTotal - (equipoEnEdicion.stockEnObra || 0))} u.
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="equipoActivoCheckbox"
                  checked={equipoFormActivo}
                  onChange={(e) => setEquipoFormActivo(e.target.checked)}
                  className="rounded bg-slate-900 border-white/20 text-sky-500 focus:ring-sky-500 h-4 w-4"
                />
                <label htmlFor="equipoActivoCheckbox" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Equipo Activo en Catálogo (Disponible para cotizaciones y contratos)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEquipoModal(false)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="glass-button-primary px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg active:scale-95"
                >
                  {equipoEnEdicion ? "Guardar y Ajustar Stock" : "Registrar Equipo en Bodega"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CARGA MASIVA DE EQUIPOS */}
      {showCargaMasivaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="glass-panel w-full max-w-5xl rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">Carga Masiva de Equipos e Inventario</h2>
                  <p className="text-[11px] text-slate-400">
                    Importación múltiple con categorización jerárquica mediante tabla interactiva o texto CSV/Excel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCargaMasivaModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pestañas del Modal */}
            <div className="flex space-x-2 border-b border-white/10 pb-2 text-xs font-bold">
              <button
                onClick={() => setCargaMasivaTab("TABLA")}
                className={`px-4 py-2 rounded-xl transition-all ${
                  cargaMasivaTab === "TABLA"
                    ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                1. Tabla Asistida de Filas ({cargaMasivaFilas.length})
              </button>
              <button
                onClick={() => setCargaMasivaTab("TEXTO")}
                className={`px-4 py-2 rounded-xl transition-all ${
                  cargaMasivaTab === "TEXTO"
                    ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                2. Pegar desde Excel / CSV
              </button>
            </div>

            {cargaMasivaError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{cargaMasivaError}</span>
              </div>
            )}

            {cargaMasivaSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{cargaMasivaSuccess}</span>
              </div>
            )}

            {/* VISTA 1: TABLA ASISTIDA */}
            {cargaMasivaTab === "TABLA" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Filas a importar ({cargaMasivaFilas.length} equipos):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddFilaCargaMasiva}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center space-x-1 hover:bg-indigo-600/30 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Agregar Fila</span>
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                  {cargaMasivaFilas.map((fila, idx) => {
                    const subcatsFila = categoriasMaster.find(
                      (c) => c.nombre.toUpperCase() === fila.categoria.toUpperCase()
                    )?.subcategorias || ["GENERAL"];

                    return (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-900/70 border border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 block">Código*</label>
                          <input
                            type="text"
                            value={fila.codigo}
                            onChange={(e) => handleUpdateFilaCargaMasiva(idx, "codigo", e.target.value.toUpperCase())}
                            placeholder="EQ-07"
                            className="w-full p-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs font-mono font-bold text-sky-300"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[10px] text-slate-500 block">Nombre del Equipo*</label>
                          <input
                            type="text"
                            value={fila.nombre}
                            onChange={(e) => handleUpdateFilaCargaMasiva(idx, "nombre", e.target.value.toUpperCase())}
                            placeholder="TALADRO INDUSTRIAL 850W"
                            className="w-full p-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs font-bold text-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 block">Categoría*</label>
                          <select
                            value={fila.categoria}
                            onChange={(e) => handleUpdateFilaCargaMasiva(idx, "categoria", e.target.value.toUpperCase())}
                            className="w-full p-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs font-semibold text-sky-300"
                          >
                            {categoriasMaster.map((c) => (
                              <option key={c.nombre} value={c.nombre}>
                                {c.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 block">Subcategoría*</label>
                          <select
                            value={fila.subcategoria}
                            onChange={(e) => handleUpdateFilaCargaMasiva(idx, "subcategoria", e.target.value.toUpperCase())}
                            className="w-full p-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs font-semibold text-slate-200"
                          >
                            {subcatsFila.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 block">Tarifa/Día COP</label>
                          <input
                            type="number"
                            value={fila.tarifaDiaria}
                            onChange={(e) => handleUpdateFilaCargaMasiva(idx, "tarifaDiaria", parseFloat(e.target.value) || 0)}
                            className="w-full p-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs font-bold text-sky-300"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <label className="text-[10px] text-slate-500 block">Stock</label>
                          <input
                            type="number"
                            min={1}
                            value={fila.stockTotal}
                            onChange={(e) => handleUpdateFilaCargaMasiva(idx, "stockTotal", parseInt(e.target.value, 10) || 1)}
                            className="w-full p-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs font-bold text-white text-center"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveFilaCargaMasiva(idx)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all mt-3 sm:mt-0"
                            title="Eliminar fila"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCargaMasivaModal(false)}
                    className="px-4 py-2 bg-slate-900 text-xs font-bold rounded-xl text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleEjecutarCargaMasivaTabla}
                    className="glass-button-primary px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg active:scale-95 flex items-center space-x-2"
                  >
                    <Check className="h-4 w-4 stroke-[2.5]" />
                    <span>Guardar Lote de {cargaMasivaFilas.length} Equipos</span>
                  </button>
                </div>
              </div>
            )}

            {/* VISTA 2: PEGAR TEXTO / CSV */}
            {cargaMasivaTab === "TEXTO" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Pegue las líneas copiadas de Excel o CSV:
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Formato por línea: <code className="text-sky-300 bg-slate-900 px-1 py-0.5 rounded">CODIGO, NOMBRE, CATEGORIA, SUBCATEGORIA, TARIFA_DIARIA, STOCK</code>
                  </p>
                  <textarea
                    rows={6}
                    value={cargaMasivaTexto}
                    onChange={(e) => setCargaMasivaTexto(e.target.value)}
                    placeholder={"TAL-07, TALADRO DEMOLEDOR 1/2, HERRAMIENTAS, DEMOLICIÓN LIVIANA, 25000, 6\nCOM-08, COMPACTADORA RANA MOTOR HONDA, MAQUINARIA, COMPACTACIÓN, 80000, 3\nGEN-09, GENERADOR GASOLINA 3.5KVA, GENERACION, PLANTAS ELÉCTRICAS, 55000, 5"}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-2xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setCargaMasivaTexto("HID-10, HIDROLAVADORA INDUSTRIAL 3000 PSI, EQUIPOS MENORES, HIDROLAVADORAS, 45000, 4\nROT-11, ROTOMARTILLO SDS PLUS 800W, HERRAMIENTAS, ELÉCTRICAS, 28000, 8");
                    }}
                    className="text-xs text-sky-400 hover:underline font-semibold"
                  >
                    Cargar texto de ejemplo
                  </button>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowCargaMasivaModal(false)}
                      className="px-4 py-2 bg-slate-900 text-xs font-bold rounded-xl text-slate-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleProcesarTextoCSV}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg active:scale-95"
                    >
                      Interpretar y Llevar a Tabla
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL FICHA TÉCNICA / DETALLE DE EQUIPO */}
      {showDetalleEquipoModal && selectedEquipoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/30 text-xs font-mono font-black">
                  {selectedEquipoDetalle.codigo}
                </span>
                <div>
                  <h2 className="text-lg font-black text-white">{selectedEquipoDetalle.nombre}</h2>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                      {selectedEquipoDetalle.categoria}
                    </span>
                    <span className="text-slate-500 font-mono text-xs">›</span>
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      {selectedEquipoDetalle.subcategoria || "GENERAL"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetalleEquipoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Ficha de Especificaciones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Tarifa Diaria</span>
                <strong className="text-base font-black text-sky-300">
                  {formatearMonedaCOP(selectedEquipoDetalle.tarifaDiaria)}
                </strong>
                <span className="text-[10px] text-slate-500 block">por día de alquiler</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Clasificación</span>
                <div className="flex items-center space-x-1 flex-wrap pt-0.5">
                  <span className="px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/25 text-[11px] font-bold uppercase">
                    {selectedEquipoDetalle.categoria}
                  </span>
                  <span className="text-slate-500 font-mono text-xs">›</span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-white/10 text-[11px] font-semibold uppercase">
                    {selectedEquipoDetalle.subcategoria || "GENERAL"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Estado Operativo</span>
                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                  selectedEquipoDetalle.activo 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                }`}>
                  {selectedEquipoDetalle.activo ? "ACTIVO EN CATÁLOGO" : "INACTIVO"}
                </span>
                <span className="text-[10px] text-slate-500 block">Disponible para despacho</span>
              </div>
            </div>

            {/* Barra y Desglose de Stock Físico */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-300">Desglose y Disponibilidad de Stock Físico:</span>
                <span className="text-white">Total: {selectedEquipoDetalle.stockTotal} unidades</span>
              </div>

              {/* Barra de progreso de stock */}
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-white/10">
                <div
                  style={{
                    width: `${selectedEquipoDetalle.stockTotal > 0 ? (selectedEquipoDetalle.stockDisponible / selectedEquipoDetalle.stockTotal) * 100 : 0}%`,
                  }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Disponible: ${selectedEquipoDetalle.stockDisponible} u.`}
                />
                <div
                  style={{
                    width: `${selectedEquipoDetalle.stockTotal > 0 ? (selectedEquipoDetalle.stockEnObra / selectedEquipoDetalle.stockTotal) * 100 : 0}%`,
                  }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`En Obra: ${selectedEquipoDetalle.stockEnObra} u.`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Físico</span>
                  <strong className="text-white font-extrabold text-sm">{selectedEquipoDetalle.stockTotal} u.</strong>
                </div>
                <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 block uppercase font-bold">Disponible</span>
                  <strong className="text-emerald-400 font-extrabold text-sm">{selectedEquipoDetalle.stockDisponible} u.</strong>
                </div>
                <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/20">
                  <span className="text-[10px] text-amber-400 block uppercase font-bold">En Obra</span>
                  <strong className="text-amber-400 font-extrabold text-sm">{selectedEquipoDetalle.stockEnObra} u.</strong>
                </div>
              </div>
            </div>

            {/* Acciones de la Ficha */}
            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowDetalleEquipoModal(false);
                  handleOpenEditarEquipo(selectedEquipoDetalle);
                }}
                className="px-4 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Editar Especificaciones / Stock</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDetalleEquipoModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xs font-bold rounded-xl text-slate-300"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDetalleEquipoModal(false);
                    handleOpenNuevoAlquiler(selectedEquipoDetalle.id);
                  }}
                  disabled={selectedEquipoDetalle.stockDisponible === 0}
                  className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 ${
                    selectedEquipoDetalle.stockDisponible > 0
                      ? "glass-button-primary text-white shadow-lg active:scale-95"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Alquilar Este Equipo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RÁPIDO: CREAR NUEVA CATEGORÍA */}
      {showNuevaCategoriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 space-y-4 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <FolderPlus className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-extrabold text-white">Nueva Categoría de Maquinaria</h3>
              </div>
              <button
                onClick={() => setShowNuevaCategoriaModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {nuevaCatError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{nuevaCatError}</span>
              </div>
            )}

            <form onSubmit={handleCrearNuevaCategoria} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nombre de la Categoría*</label>
                <input
                  type="text"
                  value={nuevaCatNombre}
                  onChange={(e) => setNuevaCatNombre(e.target.value.toUpperCase())}
                  placeholder="Ej: TOPOGRAFÍA, SEGURIDAD VIAL"
                  className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Subcategoría Inicial (Opcional)</label>
                <input
                  type="text"
                  value={nuevaCatSubcatInicial}
                  onChange={(e) => setNuevaCatSubcatInicial(e.target.value.toUpperCase())}
                  placeholder="Ej: ESTACIONES TOTALES (por defecto GENERAL)"
                  className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNuevaCategoriaModal(false)}
                  className="px-4 py-2 bg-slate-900 text-xs font-bold rounded-xl text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="glass-button-primary px-4 py-2 text-xs font-bold text-white rounded-xl shadow-lg active:scale-95"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RÁPIDO: CREAR NUEVA SUBCATEGORÍA */}
      {showNuevaSubcategoriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 space-y-4 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Tags className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-extrabold text-white">Nueva Subcategoría</h3>
              </div>
              <button
                onClick={() => setShowNuevaSubcategoriaModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {nuevaSubcatError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{nuevaSubcatError}</span>
              </div>
            )}

            <form onSubmit={handleCrearNuevaSubcategoria} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Categoría Principal*</label>
                <select
                  value={nuevaSubcatCategoriaTarget}
                  onChange={(e) => setNuevaSubcatCategoriaTarget(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-sky-300 focus:outline-none focus:border-sky-500"
                >
                  {categoriasMaster.map((c) => (
                    <option key={c.nombre} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nombre de la Subcategoría*</label>
                <input
                  type="text"
                  value={nuevaSubcatNombre}
                  onChange={(e) => setNuevaSubcatNombre(e.target.value.toUpperCase())}
                  placeholder="Ej: DISCOS DIAMANTADOS, VIBRADORES GASOLINA"
                  className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNuevaSubcategoriaModal(false)}
                  className="px-4 py-2 bg-slate-900 text-xs font-bold rounded-xl text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="glass-button-primary px-4 py-2 text-xs font-bold text-white rounded-xl shadow-lg active:scale-95"
                >
                  Guardar Subcategoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE FORENSE DE AUDITORÍA & DIFF JSON */}
      {showAuditDetalleModal && selectedAuditDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                      {selectedAuditDetalle.id}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      IP: {selectedAuditDetalle.ipAddress}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mt-1">
                    Inspección Forense de Evento
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowAuditDetalleModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Metadatos del Evento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Fecha y Hora</span>
                  <span className="font-mono text-slate-200">
                    {new Date(selectedAuditDetalle.timestamp).toLocaleString("es-CO")}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Operador</span>
                  <span className="font-bold text-white block truncate">{selectedAuditDetalle.userNombre}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Rol</span>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${ROLE_INFO[selectedAuditDetalle.userRol]?.badgeClass}`}>
                    {ROLE_INFO[selectedAuditDetalle.userRol]?.label || selectedAuditDetalle.userRol}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Módulo / Acción</span>
                  <span className="font-bold text-indigo-300">{selectedAuditDetalle.modulo} › {selectedAuditDetalle.accion}</span>
                </div>
              </div>

              {/* Descripción */}
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Descripción Completa:</span>
                <p className="text-slate-200 text-xs leading-relaxed">{selectedAuditDetalle.descripcion}</p>
                {selectedAuditDetalle.entidadId && (
                  <span className="inline-block mt-1 font-mono text-sky-400 text-[10px] bg-sky-500/10 px-2 py-0.5 rounded">
                    Entidad Asociada: {selectedAuditDetalle.entidadId}
                  </span>
                )}
              </div>

              {/* Diff de Cambios */}
              {selectedAuditDetalle.detalles && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Activity className="h-3.5 w-3.5 text-amber-400" />
                    <span>Diferencial de Mutación (Before / After):</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                      <span className="text-[10px] font-bold text-rose-400 uppercase block mb-1">Valor Anterior:</span>
                      <pre className="text-[11px] font-mono text-rose-200 whitespace-pre-wrap">
                        {JSON.stringify(selectedAuditDetalle.detalles.valorAnterior ?? "— (Sin valor previo)", null, 2)}
                      </pre>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">Nuevo Valor Asignado:</span>
                      <pre className="text-[11px] font-mono text-emerald-200 whitespace-pre-wrap">
                        {JSON.stringify(selectedAuditDetalle.detalles.valorNuevo ?? "—", null, 2)}
                      </pre>
                    </div>
                  </div>

                  {selectedAuditDetalle.detalles.metadata && (
                    <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Metadatos de Contexto JSON:</span>
                      <pre className="text-[10px] font-mono text-sky-300 overflow-x-auto p-2 bg-slate-950 rounded-xl">
                        {JSON.stringify(selectedAuditDetalle.detalles.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setShowAuditDetalleModal(false)}
                className="glass-button-primary px-5 py-2 text-xs font-bold text-white rounded-xl"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AUTENTICACIÓN / SWITCH DE USUARIOS Y ROLES (BETTER AUTH RBAC) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Control de Acceso & Sesión</h2>
                  <p className="text-slate-400 text-xs">Better Auth + Matriz de Roles y Permisos Granulares</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* SELECCIÓN RÁPIDA DE CUENTAS DEMO POR ROL */}
            <div className="space-y-2.5">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                Seleccione un Perfil de Rol para Simular Accesos:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {USUARIOS_DEMO.map((usr) => {
                  const isCurrent = currentUser?.id === usr.id;
                  const roleMeta = ROLE_INFO[usr.rol];

                  return (
                    <div
                      key={usr.id}
                      onClick={() => handleQuickLogin(usr)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isCurrent
                          ? "bg-sky-500/15 border-sky-400 shadow-md shadow-sky-500/10"
                          : "bg-slate-900/60 hover:bg-slate-900 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shrink-0">
                          {usr.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate leading-tight">{usr.nombre}</p>
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border mt-0.5 ${roleMeta.badgeClass}`}>
                            {roleMeta.label}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-snug">
                        {roleMeta.desc}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                        <span className="text-slate-400">{usr.email}</span>
                        {isCurrent ? (
                          <span className="text-emerald-400 font-bold flex items-center">
                            <Check className="h-3 w-3 mr-0.5" /> Activo
                          </span>
                        ) : (
                          <span className="text-sky-400 font-semibold group-hover:underline">Ingresar ›</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FORMULARIO MANUAL */}
            <form onSubmit={handleCustomLogin} className="pt-2 border-t border-white/10 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                O ingrese con correo corporativo registrado:
              </span>

              <div className="flex gap-2">
                <input
                  type="email"
                  value={loginEmailInput}
                  onChange={(e) => setLoginEmailInput(e.target.value)}
                  placeholder="ej: bodega@ferreon.com"
                  className="flex-1 p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  className="glass-button-primary px-4 py-2.5 rounded-xl text-xs font-bold text-white shrink-0"
                >
                  Autenticar
                </button>
              </div>
            </form>

            <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold flex items-center space-x-1"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Cerrar Sesión Activa</span>
                </button>
              )}
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-bold ml-auto"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
