"use client";

import React, { useState } from "react";
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
  BadgePercent
} from "lucide-react";
import { EnterprisePDFService, DocumentoPDFPayload } from "../core/services/pdf-factura-generator.service";
import { formatearMonedaCOP } from "../core/utils/numero-a-letras";
import { EmpresaConfig, DEFAULT_EMPRESA_CONFIG } from "../core/domain/entities/empresa-config";

type TabType = "dashboard" | "alquileres" | "bodega" | "devoluciones" | "facturacion" | "cartera" | "clientes" | "configuracion";
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
  tarifaDiaria: number;
  pesoKilos: number;
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
  pesoKilos: number;
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
  pesoTotalKilos: number;
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
    pesoKilos: number;
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
  metodoPago: "EFECTIVO" | "TRANSFERENCIA" | "NEQUI" | "DAVIPLATA" | "CHEQUE";
  referencia?: string;
  fecha: string;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [previousTab, setPreviousTab] = useState<TabType | null>(null);

  // Fecha de hoy
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultFinStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Configuración de la Empresa
  const [empresaConfig, setEmpresaConfig] = useState<EmpresaConfig>(DEFAULT_EMPRESA_CONFIG);
  const [logoPreview, setLogoPreview] = useState<string>(DEFAULT_EMPRESA_CONFIG.logoBase64 || "");

  // Lista de Clientes
  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: "CLI-001",
      nitCedula: "900123456-1",
      nombre: "CONSTRUCCIONES & OBRAS ARQUITECTÓNICAS SAS",
      telefono: "3001234567",
      email: "contacto@obras.com",
      direccion: "Calle 100 # 15-20, Bogotá",
      activo: true,
    },
    {
      id: "CLI-002",
      nitCedula: "1018456789",
      nombre: "INGENIERO PEDRO ALONSO GÓMEZ",
      telefono: "3109876543",
      email: "pedro.gomez@gmail.com",
      direccion: "Carrera 7 # 45-10, Bogotá",
      activo: true,
    }
  ]);

  // Catálogo de Bodega
  const [equipos, setEquipos] = useState<Equipo[]>([
    { id: "EQ-001", codigo: "MEZ-01", nombre: "MEZCLADORA DE CONCRETO 2 BULTOS (MOTOR 13HP)", categoria: "MAQUINARIA", tarifaDiaria: 45000, pesoKilos: 250.0, stockTotal: 10, stockDisponible: 10, stockEnObra: 0, activo: true },
    { id: "EQ-002", codigo: "VIB-02", nombre: "VIBRADOR DE CONCRETO ELÉCTRICO 2HP (MANGUERA 4M)", categoria: "EQUIPOS MENORES", tarifaDiaria: 25000, pesoKilos: 15.0, stockTotal: 15, stockDisponible: 15, stockEnObra: 0, activo: true },
    { id: "EQ-003", codigo: "DEM-03", nombre: "DEMOLEDOR ELÉCTRICO 30KG (ENCABEZADO HEX 28MM)", categoria: "HERRAMIENTAS", tarifaDiaria: 65000, pesoKilos: 30.0, stockTotal: 8, stockDisponible: 8, stockEnObra: 0, activo: true },
    { id: "EQ-004", codigo: "AND-04", nombre: "ANDAMIO MULTIDIRECCIONAL (MÓDULO 1.5M X 1.5M)", categoria: "ESTRUCTURAS", tarifaDiaria: 12000, pesoKilos: 45.0, stockTotal: 50, stockDisponible: 50, stockEnObra: 0, activo: true },
    { id: "EQ-005", codigo: "COR-05", nombre: "CORTADORA DE PAVIMENTO 13HP (DISCO 14 PULGADAS)", categoria: "MAQUINARIA", tarifaDiaria: 85000, pesoKilos: 120.0, stockTotal: 5, stockDisponible: 5, stockEnObra: 0, activo: true },
    { id: "EQ-006", codigo: "PLA-06", nombre: "PLANTA ELÉCTRICA 6.5 KW (DIÉSEL MONOFÁSICA)", categoria: "GENERACIÓN", tarifaDiaria: 75000, pesoKilos: 95.0, stockTotal: 6, stockDisponible: 6, stockEnObra: 0, activo: true },
  ]);

  // Contratos de Alquiler, Facturas y Pagos
  const [contratos, setContratos] = useState<ContratoAlquiler[]>([]);
  const [facturas, setFacturas] = useState<FacturaEmitida[]>([]);
  const [pagos, setPagos] = useState<ReciboPago[]>([]);

  // Filtros y Búsquedas
  const [alquilerEstadoFilter, setAlquilerEstadoFilter] = useState<AlquilerEstadoFilter>("TODOS");
  const [alquilerSearchFilter, setAlquilerSearchFilter] = useState<string>("");
  const [selectedContratoDetalle, setSelectedContratoDetalle] = useState<ContratoAlquiler | null>(null);

  // Estados Modal Crear Alquiler Multi-Ítem con Fechas Individuales
  const [showMultiAlquilerModal, setShowMultiAlquilerModal] = useState<boolean>(false);
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
    { equipoId: "EQ-001", cantidad: 1, tarifaDiaria: 45000, fechaInicio: todayStr, fechaFin: defaultFinStr, dias: 3, pesoKilos: 250 }
  ]);
  const [multiAlquilerError, setMultiAlquilerError] = useState<string | null>(null);

  // Modales adicionales
  const [showDevolucionModal, setShowDevolucionModal] = useState<boolean>(false);
  const [contratoParaDevolucion, setContratoParaDevolucion] = useState<ContratoAlquiler | null>(null);
  const [devolucionCantidades, setDevolucionCantidades] = useState<{ [equipoId: string]: number }>({});
  const [devolucionDanos, setDevolucionDanos] = useState<{ [equipoId: string]: number }>({});
  
  const [showFacturaModal, setShowFacturaModal] = useState<boolean>(false);
  const [contratoParaFacturar, setContratoParaFacturar] = useState<ContratoAlquiler | null>(null);

  // Modal Pago / Cartera
  const [showPagoModal, setShowPagoModal] = useState<boolean>(false);
  const [contratoParaPago, setContratoParaPago] = useState<ContratoAlquiler | null>(null);
  const [pagoMonto, setPagoMonto] = useState<number>(0);
  const [pagoMetodo, setPagoMetodo] = useState<"EFECTIVO" | "TRANSFERENCIA" | "NEQUI" | "DAVIPLATA" | "CHEQUE">("TRANSFERENCIA");
  const [pagoReferencia, setPagoReferencia] = useState<string>("");

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

  // Abrir Modal de Nuevo Alquiler
  const handleOpenNuevoAlquiler = (preselectedEquipoId?: string, preselectedClienteId?: string) => {
    if (clientes.length === 0) {
      alert("Debe registrar al menos un cliente en 'Clientes & Terceros' antes de generar un contrato.");
      navigateToTab("clientes");
      return;
    }
    const defaultEqId = preselectedEquipoId || (equipos[0] ? equipos[0].id : "EQ-001");
    const eqObj = equipos.find((e) => e.id === defaultEqId) || equipos[0];
    const initialCliente = clientes.find((c) => c.id === preselectedClienteId) || clientes[0];

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
        pesoKilos: eqObj ? eqObj.pesoKilos : 250,
      }
    ]);
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
        pesoKilos: primerEquipoDisp.pesoKilos,
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
          updated.pesoKilos = selectedEq ? selectedEq.pesoKilos : linea.pesoKilos;
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
  const pesoTotalContratoKilos = nuevoAlquilerLineas.reduce((acc, l) => acc + (l.cantidad * l.pesoKilos), 0);

  // Guardar y despachar contrato
  const handleGuardarContrato = (e: React.FormEvent) => {
    e.preventDefault();
    const clienteObj = clientes.find((c) => c.id === nuevoAlquilerClienteId);
    if (!clienteObj) {
      setMultiAlquilerError("Seleccione un cliente válido de la búsqueda asistida.");
      return;
    }

    if (nuevoAlquilerEstado === "ACTIVO") {
      for (const linea of nuevoAlquilerLineas) {
        const eq = equipos.find((e) => e.id === linea.equipoId);
        if (!eq || linea.cantidad > eq.stockDisponible) {
          setMultiAlquilerError(`Stock insuficiente para '${eq ? eq.nombre : "Equipo"}'. Disponible: ${eq ? eq.stockDisponible : 0} u.`);
          return;
        }
      }

      setEquipos((prev) =>
        prev.map((eq) => {
          const linea = nuevoAlquilerLineas.find((l) => l.equipoId === eq.id);
          if (linea) {
            return {
              ...eq,
              stockDisponible: eq.stockDisponible - linea.cantidad,
              stockEnObra: eq.stockEnObra + linea.cantidad,
            };
          }
          return eq;
        })
      );
    }

    const nuevoContrato: ContratoAlquiler = {
      id: "ALQ-" + Date.now(),
      consecutivo: contratos.length + 101,
      clienteId: clienteObj.id,
      clienteNombre: clienteObj.nombre,
      estado: nuevoAlquilerEstado,
      subtotalEquipos,
      fleteEntrega: nuevoAlquilerFleteEntrega || 0,
      fleteRecogida: nuevoAlquilerFleteRecogida || 0,
      subtotalGeneral,
      total: totalContrato,
      deposito: nuevoAlquilerDeposito || 0,
      totalPagado: 0,
      garantiaMonto: nuevoAlquilerGarantiaMonto || 0,
      garantiaTipo: nuevoAlquilerGarantiaTipo,
      garantiaEstado: "Activa",
      pesoTotalKilos: pesoTotalContratoKilos,
      observaciones: nuevoAlquilerObservaciones,
      detallesLogistica: nuevoAlquilerDetallesLogistica,
      fechaInicioGeneral: nuevoAlquilerFechaGeneral,
      items: nuevoAlquilerLineas.map((l) => {
        const eq = equipos.find((e) => e.id === l.equipoId)!;
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
          pesoKilos: l.pesoKilos,
          devuelto: false,
          cantidadDevuelta: 0,
          costoDano: 0,
        };
      }),
      createdAt: new Date().toISOString(),
    };

    setContratos((prev) => [nuevoContrato, ...prev]);
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
        pesoKilos: it.pesoKilos,
      })),
      subtotalEquipos: contrato.subtotalEquipos,
      fleteEntrega: contrato.fleteEntrega,
      fleteRecogida: contrato.fleteRecogida,
      subtotalGeneral: contrato.subtotalGeneral,
      costosDano: contrato.items.reduce((acc, it) => acc + (it.costoDano || 0), 0),
      depositoAplicado: contrato.deposito,
      totalPagar: contrato.total,
      pesoTotalKilos: contrato.pesoTotalKilos,
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

  // Devolución
  const handleOpenDevolucion = (contrato: ContratoAlquiler) => {
    setContratoParaDevolucion(contrato);
    const initialCantidades: { [eqId: string]: number } = {};
    const initialDanos: { [eqId: string]: number } = {};
    contrato.items.forEach((it) => {
      const pendientes = it.cantidad - (it.cantidadDevuelta || 0);
      initialCantidades[it.equipoId] = pendientes;
      initialDanos[it.equipoId] = 0;
    });
    setDevolucionCantidades(initialCantidades);
    setDevolucionDanos(initialDanos);
    setShowDevolucionModal(true);
  };

  const handleConfirmarDevolucion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contratoParaDevolucion) return;

    let todosDevueltos = true;
    const contratoActualizado: ContratoAlquiler = {
      ...contratoParaDevolucion,
      items: contratoParaDevolucion.items.map((it) => {
        const cantDevueltasHoy = devolucionCantidades[it.equipoId] || 0;
        const totalDev = (it.cantidadDevuelta || 0) + cantDevueltasHoy;
        const costoDano = devolucionDanos[it.equipoId] || 0;
        const estaDevuelto = totalDev >= it.cantidad;

        if (!estaDevuelto) todosDevueltos = false;

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
    setShowFacturaModal(false);
    handleAbrirVisorPDFCarta(contratoParaFacturar, "CUENTA_COBRO");
    navigateToTab("facturacion");
  };

  // Modal Registrar Pago / Cartera
  const handleOpenRegistrarPago = (contrato: ContratoAlquiler) => {
    setContratoParaPago(contrato);
    const saldoPendiente = Math.max(0, contrato.total - (contrato.totalPagado || 0));
    setPagoMonto(saldoPendiente);
    setPagoMetodo("TRANSFERENCIA");
    setPagoReferencia("");
    setShowPagoModal(true);
  };

  const handleConfirmarPago = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contratoParaPago) return;

    if (pagoMonto <= 0) {
      alert("El monto del pago debe ser mayor a cero.");
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

    setShowPagoModal(false);
    alert(`¡Pago de ${formatearMonedaCOP(pagoMonto)} registrado con éxito!`);
  };

  // Contratos filtrados
  const contratosFiltrados = contratos.filter((c) => {
    const matchEstado = alquilerEstadoFilter === "TODOS" || c.estado === alquilerEstadoFilter;
    const matchSearch =
      c.clienteNombre.toLowerCase().includes(alquilerSearchFilter.toLowerCase()) ||
      `ALQ-${c.consecutivo}`.toLowerCase().includes(alquilerSearchFilter.toLowerCase());
    return matchEstado && matchSearch;
  });

  // Totales de Cartera
  const totalFacturadoGlobal = contratos.reduce((acc, c) => acc + c.total, 0);
  const totalRecaudadoGlobal = pagos.reduce((acc, p) => acc + p.monto, 0);
  const saldoCarteraPendienteGlobal = Math.max(0, totalFacturadoGlobal - totalRecaudadoGlobal);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      
      {/* Resplandores Ambientales */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Header Glassmorphism */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {empresaConfig.logoBase64 ? (
              <img src={empresaConfig.logoBase64} alt="Logo" className="h-10 max-w-[120px] object-contain rounded-lg p-1 bg-white/10" />
            ) : (
              <div className="bg-gradient-to-tr from-sky-600 to-cyan-400 p-2.5 rounded-2xl text-white shadow-lg shadow-sky-500/30 ring-1 ring-white/20">
                <Building2 className="h-6 w-6" />
              </div>
            )}
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent tracking-tight">
                {empresaConfig.razonSocial}
              </span>
              <span className="ml-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-400/30 backdrop-blur-md shadow-sm">
                NIT: {empresaConfig.nit}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {previousTab && (
              <button 
                onClick={goBack}
                className="h-10 px-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver</span>
              </button>
            )}
            <button 
              onClick={() => handleOpenNuevoAlquiler()}
              className="glass-button-primary h-11 px-5 rounded-2xl text-white font-semibold text-sm flex items-center space-x-2 active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Nuevo Alquiler</span>
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN TABBED SPA (8 MÓDULOS COMPLETOS) */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 overflow-x-auto py-2 border-t border-white/5 scrollbar-none">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "alquileres", label: `Alquileres (${contratos.filter(c => c.estado === 'ACTIVO').length})`, icon: FileText },
            { id: "bodega", label: "Bodega e Inventario", icon: Package },
            { id: "devoluciones", label: "Devoluciones", icon: RotateCcw },
            { id: "facturacion", label: `Facturación (${facturas.length})`, icon: Receipt },
            { id: "cartera", label: `Cartera & Pagos (${pagos.length})`, icon: Landmark },
            { id: "clientes", label: "Clientes & Terceros", icon: Users },
            { id: "configuracion", label: "Configuración Empresa", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigateToTab(tab.id as TabType)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-md shadow-sky-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
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
                      <button 
                        onClick={() => handleAbrirVisorPDFCarta(contrato, contrato.estado === 'COTIZACION' ? 'COTIZACION' : 'CONTRATO')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 font-semibold border border-indigo-500/30 flex items-center space-x-1.5"
                      >
                        <Printer className="h-3.5 w-3.5 text-indigo-400" />
                        <span>PDF Carta</span>
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: BODEGA */}
        {activeTab === "bodega" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Catálogo de Bodega e Inventario</h1>
                <p className="text-xs text-slate-400">Control de Stock en Vivo y Peso en Gramos (`peso_gramos BIGINT`)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipos.filter(e => e.activo).map((item) => (
                <div key={item.id} className="glass-panel glass-panel-hover rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">{item.codigo}</span>
                      <h3 className="font-extrabold text-white text-sm mt-1">{item.nombre}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      item.stockDisponible > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                      {item.stockDisponible > 0 ? `${item.stockDisponible} DISP.` : "AGOTADO"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-2.5 rounded-xl border border-white/5 text-center text-xs">
                    <div><span className="text-[10px] text-slate-500 block uppercase font-bold">Total</span><strong className="text-white font-extrabold">{item.stockTotal} u.</strong></div>
                    <div><span className="text-[10px] text-slate-500 block uppercase font-bold">Disponible</span><strong className="text-emerald-400 font-extrabold">{item.stockDisponible} u.</strong></div>
                    <div><span className="text-[10px] text-slate-500 block uppercase font-bold">En Obra</span><strong className="text-amber-400 font-extrabold">{item.stockEnObra} u.</strong></div>
                  </div>

                  <button onClick={() => handleOpenNuevoAlquiler(item.id)} disabled={item.stockDisponible === 0} className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 ${
                    item.stockDisponible > 0 ? "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Alquilar Este Equipo</span>
                  </button>
                </div>
              ))}
            </div>
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
                  max={Math.max(0, contratoParaPago.total - (contratoParaPago.totalPagado || 0))}
                  value={pagoMonto}
                  onChange={(e) => setPagoMonto(parseFloat(e.target.value) || 0)}
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

      {/* MODAL CREAR CONTRATO / COTIZACIÓN */}
      {showMultiAlquilerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="glass-panel w-full max-w-4xl rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
                <FileText className="h-5 w-5 text-sky-400" />
                <span>Nuevo Contrato / Cotización de Maquinaria</span>
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
                                  {eq.codigo} — {eq.nombre} ({eq.stockDisponible} u. disp. • {eq.pesoKilos} Kg)
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
      {showDevolucionModal && contratoParaDevolucion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">ALQ-{contratoParaDevolucion.consecutivo}</span>
                <h2 className="text-lg font-black text-white mt-1">Recepción de Equipos & Registro de Daños</h2>
              </div>
              <button onClick={() => setShowDevolucionModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleConfirmarDevolucion} className="space-y-4">
              <div className="space-y-3">
                {contratoParaDevolucion.items.map((it) => {
                  const pendientes = it.cantidad - (it.cantidadDevuelta || 0);
                  return (
                    <div key={it.equipoId} className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <strong className="text-white">{it.nombre}</strong>
                        <span className="text-amber-400 font-bold">Pendientes: {pendientes} u.</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-400 block">Cant. a Devolver Hoy:</label>
                          <input 
                            type="number" 
                            min={0} 
                            max={pendientes}
                            value={devolucionCantidades[it.equipoId] || 0}
                            onChange={(e) => setDevolucionCantidades({ ...devolucionCantidades, [it.equipoId]: parseInt(e.target.value, 10) || 0 })}
                            className="w-full p-2 bg-slate-950 border border-white/10 rounded-xl text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">Costo Daño/Avería (COP):</label>
                          <input 
                            type="number" 
                            min={0}
                            value={devolucionDanos[it.equipoId] || 0}
                            onChange={(e) => setDevolucionDanos({ ...devolucionDanos, [it.equipoId]: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 bg-slate-950 border border-white/10 rounded-xl text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowDevolucionModal(false)} className="px-4 py-2.5 bg-slate-900 text-xs font-bold rounded-xl">Cancelar</button>
                <button type="submit" className="glass-button-primary px-5 py-2.5 text-xs font-bold text-white rounded-xl">Confirmar Reingreso a Bodega</button>
              </div>
            </form>
          </div>
        </div>
      )}

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

    </div>
  );
}
