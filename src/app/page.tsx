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
  CheckCircle
} from "lucide-react";

type TabType = "dashboard" | "alquileres" | "bodega" | "devoluciones" | "facturacion" | "clientes";
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
  dias: number;
  pesoKilos: number;
}

interface ContratoAlquiler {
  id: string;
  consecutivo: number;
  clienteId: string;
  clienteNombre: string;
  estado: "COTIZACION" | "ACTIVO" | "FINALIZADO" | "CANCELADO";
  subtotal: number;
  total: number;
  deposito: number;
  garantiaMonto: number;
  garantiaTipo: string;
  garantiaEstado: string;
  pesoTotalKilos: number;
  observaciones?: string;
  fechaInicio: string;
  items: Array<{
    equipoId: string;
    codigo: string;
    nombre: string;
    cantidad: number;
    tarifaDiaria: number;
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
  estadoPago: "PAGADA" | "PENDIENTE";
  createdAt: string;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [previousTab, setPreviousTab] = useState<TabType | null>(null);

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

  // Contratos de Alquiler
  const [contratos, setContratos] = useState<ContratoAlquiler[]>([]);

  // Facturas Emitidas
  const [facturas, setFacturas] = useState<FacturaEmitida[]>([]);

  // Modales y Filtros de Alquiler
  const [alquilerEstadoFilter, setAlquilerEstadoFilter] = useState<AlquilerEstadoFilter>("TODOS");
  const [alquilerSearchFilter, setAlquilerSearchFilter] = useState<string>("");
  const [selectedContratoDetalle, setSelectedContratoDetalle] = useState<ContratoAlquiler | null>(null);

  // Modal Crear Alquiler Multi-Ítem
  const [showMultiAlquilerModal, setShowMultiAlquilerModal] = useState<boolean>(false);
  const [nuevoAlquilerClienteId, setNuevoAlquilerClienteId] = useState<string>("");
  const [nuevoAlquilerEstado, setNuevoAlquilerEstado] = useState<"ACTIVO" | "COTIZACION">("ACTIVO");
  const [nuevoAlquilerDeposito, setNuevoAlquilerDeposito] = useState<number>(50000);
  const [nuevoAlquilerGarantiaMonto, setNuevoAlquilerGarantiaMonto] = useState<number>(300000);
  const [nuevoAlquilerGarantiaTipo, setNuevoAlquilerGarantiaTipo] = useState<string>("Efectivo");
  const [nuevoAlquilerObservaciones, setNuevoAlquilerObservaciones] = useState<string>("");
  const [nuevoAlquilerLineas, setNuevoAlquilerLineas] = useState<ItemContratoLinea[]>([
    { equipoId: "EQ-001", cantidad: 1, tarifaDiaria: 45000, dias: 3, pesoKilos: 250 }
  ]);
  const [multiAlquilerError, setMultiAlquilerError] = useState<string | null>(null);

  // Modal Devolución de Equipos
  const [showDevolucionModal, setShowDevolucionModal] = useState<boolean>(false);
  const [contratoParaDevolucion, setContratoParaDevolucion] = useState<ContratoAlquiler | null>(null);
  const [devolucionCantidades, setDevolucionCantidades] = useState<{ [equipoId: string]: number }>({});
  const [devolucionDanos, setDevolucionDanos] = useState<{ [equipoId: string]: number }>({});

  // Modal Liquidación / Facturación
  const [showFacturaModal, setShowFacturaModal] = useState<boolean>(false);
  const [contratoParaFacturar, setContratoParaFacturar] = useState<ContratoAlquiler | null>(null);

  // Modal Clientes y Bodega
  const [showClienteModal, setShowClienteModal] = useState<boolean>(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [clientFormData, setClientFormData] = useState({ nitCedula: "", nombre: "", telefono: "", email: "", direccion: "" });
  const [clientFormError, setClientFormError] = useState<string | null>(null);
  const [showEquipoModal, setShowEquipoModal] = useState<boolean>(false);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>("");
  const [equipoFormData, setEquipoFormData] = useState({ codigo: "", nombre: "", categoria: "MAQUINARIA", tarifaDiaria: 30000, pesoKilos: 10, stockTotal: 5 });
  const [equipoFormError, setEquipoFormError] = useState<string | null>(null);

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

  // Abrir Modal de Nuevo Alquiler
  const handleOpenNuevoAlquiler = (preselectedEquipoId?: string, preselectedClienteId?: string) => {
    if (clientes.length === 0) {
      alert("Debe registrar al menos un cliente en 'Clientes & Terceros' antes de generar un contrato.");
      navigateToTab("clientes");
      return;
    }
    const defaultEqId = preselectedEquipoId || (equipos[0] ? equipos[0].id : "EQ-001");
    const eqObj = equipos.find((e) => e.id === defaultEqId) || equipos[0];

    setNuevoAlquilerClienteId(preselectedClienteId || clientes[0].id);
    setNuevoAlquilerEstado("ACTIVO");
    setNuevoAlquilerDeposito(50000);
    setNuevoAlquilerGarantiaMonto(300000);
    setNuevoAlquilerGarantiaTipo("Efectivo");
    setNuevoAlquilerObservaciones("");
    setNuevoAlquilerLineas([
      {
        equipoId: eqObj ? eqObj.id : "EQ-001",
        cantidad: 1,
        tarifaDiaria: eqObj ? eqObj.tarifaDiaria : 45000,
        dias: 3,
        pesoKilos: eqObj ? eqObj.pesoKilos : 250,
      }
    ]);
    setMultiAlquilerError(null);
    setShowMultiAlquilerModal(true);
  };

  // Agregar fila de equipo al contrato
  const handleAddLineaEquipo = () => {
    const primerEquipoDisp = equipos.find((e) => e.activo && e.stockDisponible > 0) || equipos[0];
    if (!primerEquipoDisp) return;

    setNuevoAlquilerLineas((prev) => [
      ...prev,
      {
        equipoId: primerEquipoDisp.id,
        cantidad: 1,
        tarifaDiaria: primerEquipoDisp.tarifaDiaria,
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

  const handleUpdateLineaEquipo = (index: number, field: keyof ItemContratoLinea, value: any) => {
    setNuevoAlquilerLineas((prev) =>
      prev.map((linea, idx) => {
        if (idx !== index) return linea;
        if (field === "equipoId") {
          const selectedEq = equipos.find((e) => e.id === value);
          return {
            ...linea,
            equipoId: value,
            tarifaDiaria: selectedEq ? selectedEq.tarifaDiaria : linea.tarifaDiaria,
            pesoKilos: selectedEq ? selectedEq.pesoKilos : linea.pesoKilos,
          };
        }
        return { ...linea, [field]: value };
      })
    );
  };

  const subtotalContrato = nuevoAlquilerLineas.reduce((acc, l) => acc + (l.cantidad * l.tarifaDiaria * l.dias), 0);
  const totalContrato = Math.max(0, subtotalContrato - nuevoAlquilerDeposito);
  const pesoTotalContratoKilos = nuevoAlquilerLineas.reduce((acc, l) => acc + (l.cantidad * l.pesoKilos), 0);

  const handleGuardarContrato = (e: React.FormEvent) => {
    e.preventDefault();
    const clienteObj = clientes.find((c) => c.id === nuevoAlquilerClienteId);
    if (!clienteObj) {
      setMultiAlquilerError("Seleccione un cliente válido.");
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
      subtotal: subtotalContrato,
      total: totalContrato,
      deposito: nuevoAlquilerDeposito,
      garantiaMonto: nuevoAlquilerGarantiaMonto,
      garantiaTipo: nuevoAlquilerGarantiaTipo,
      garantiaEstado: "Activa",
      pesoTotalKilos: pesoTotalContratoKilos,
      observaciones: nuevoAlquilerObservaciones,
      fechaInicio: new Date().toISOString(),
      items: nuevoAlquilerLineas.map((l) => {
        const eq = equipos.find((e) => e.id === l.equipoId)!;
        return {
          equipoId: l.equipoId,
          codigo: eq.codigo,
          nombre: eq.nombre,
          cantidad: l.cantidad,
          tarifaDiaria: l.tarifaDiaria,
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

  // Abrir Modal de Devolución
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

  // Procesar Devolución e Inspección
  const handleConfirmarDevolucion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contratoParaDevolucion) return;

    let todosDevueltos = true;

    // Actualizar contrato
    const contratoActualizado: ContratoAlquiler = {
      ...contratoParaDevolucion,
      items: contratoParaDevolucion.items.map((it) => {
        const cantDevueltasHoy = devolucionCantidades[it.equipoId] || 0;
        const totalDev = (it.cantidadDevuelta || 0) + cantDevueltasHoy;
        const costoDano = devolucionDanos[it.equipoId] || 0;
        const estaDevuelto = totalDev >= it.cantidad;

        if (!estaDevuelto) {
          todosDevueltos = false;
        }

        // Reingresar stock disponible a la bodega
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

  // Abrir Modal de Liquidación / Factura
  const handleOpenFacturacion = (contrato: ContratoAlquiler) => {
    setContratoParaFacturar(contrato);
    setShowFacturaModal(true);
  };

  // Emitir Factura / Cuenta de Cobro
  const handleEmitirFactura = () => {
    if (!contratoParaFacturar) return;

    const totalDanos = contratoParaFacturar.items.reduce((acc, it) => acc + (it.costoDano || 0), 0);
    const totalPagar = Math.max(0, contratoParaFacturar.subtotal + totalDanos - contratoParaFacturar.deposito);

    const nuevaFac: FacturaEmitida = {
      id: "FAC-" + Date.now(),
      numeroConsecutivo: facturas.length + 1001,
      alquilerId: contratoParaFacturar.id,
      consecutivoAlquiler: contratoParaFacturar.consecutivo,
      clienteNombre: contratoParaFacturar.clienteNombre,
      subtotal: contratoParaFacturar.subtotal,
      costosDano: totalDanos,
      depositoAplicado: contratoParaFacturar.deposito,
      totalPagar,
      estadoPago: "EMITIDA" as any,
      createdAt: new Date().toISOString(),
    };

    setFacturas((prev) => [nuevaFac, ...prev]);
    setShowFacturaModal(false);
    alert(`¡Cuenta de Cobro #CC-${nuevaFac.numeroConsecutivo} generada exitosamente con el 100% de renglones incluidos!`);
    navigateToTab("facturacion");
  };

  // Contratos filtrados
  const contratosFiltrados = contratos.filter((c) => {
    const matchEstado = alquilerEstadoFilter === "TODOS" || c.estado === alquilerEstadoFilter;
    const matchSearch =
      c.clienteNombre.toLowerCase().includes(alquilerSearchFilter.toLowerCase()) ||
      `ALQ-${c.consecutivo}`.toLowerCase().includes(alquilerSearchFilter.toLowerCase());
    return matchEstado && matchSearch;
  });

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
            <div className="bg-gradient-to-tr from-sky-600 to-cyan-400 p-2.5 rounded-2xl text-white shadow-lg shadow-sky-500/30 ring-1 ring-white/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent tracking-tight">
                Alquileres ERP
              </span>
              <span className="ml-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-400/30 backdrop-blur-md shadow-sm">
                alquileres_app
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

        {/* NAVEGACIÓN TABBED SPA */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 overflow-x-auto py-2 border-t border-white/5 scrollbar-none">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "alquileres", label: `Alquileres (${contratos.filter(c => c.estado === 'ACTIVO').length})`, icon: FileText },
            { id: "bodega", label: "Bodega e Inventario", icon: Package },
            { id: "devoluciones", label: "Devoluciones", icon: RotateCcw },
            { id: "facturacion", label: `Facturación (${facturas.length})`, icon: Receipt },
            { id: "clientes", label: "Clientes & Terceros", icon: Users },
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
                  <span>Instancia Producción Limpia & Ready</span>
                  <Sparkles className="h-3.5 w-3.5 ml-1 text-emerald-300" />
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                  Gestión Inteligente de Alquileres de Maquinaria
                </h1>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                  Módulo desacoplado bajo Arquitectura Hexagonal. Moneda oficial COP, 
                  control estricto de peso en gramos enteros (`peso_gramos BIGINT`) e inventario en bodega en tiempo real.
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

              <div onClick={() => navigateToTab("bodega")} className="glass-panel glass-panel-hover rounded-2xl p-6 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Equipos en Bodega</span>
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Package className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5">
                  <span className="text-4xl font-extrabold text-white">{equipos.reduce((acc, eq) => acc + (eq.activo ? eq.stockDisponible : 0), 0)}</span>
                  <span className="text-xs text-slate-400 ml-2 font-medium">disponibles en tiempo real</span>
                </div>
              </div>

              <div onClick={() => navigateToTab("devoluciones")} className="glass-panel glass-panel-hover rounded-2xl p-6 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Devoluciones Pendientes</span>
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <RotateCcw className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5">
                  <span className="text-4xl font-extrabold text-white">{contratos.filter(c => c.estado === 'ACTIVO').length}</span>
                  <span className="text-xs text-amber-300 ml-2 font-medium">corte 5:00 PM</span>
                </div>
              </div>

              <div className="glass-panel glass-panel-hover rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Estado Seguridad</span>
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5">
                  <span className="text-xl font-bold text-emerald-400 block">RLS Activo</span>
                  <span className="text-xs text-slate-400 font-medium">Supabase Auth JWT</span>
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
                <p className="text-xs text-slate-400">Cotizaciones, Despachos Multi-Equipo, Control de Depósitos y Garantías</p>
              </div>
              <button 
                onClick={() => handleOpenNuevoAlquiler()}
                className="glass-button-primary px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2 shadow-lg shadow-sky-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Contrato Multi-Equipo</span>
              </button>
            </div>

            {/* Filtros de Estado y Buscador */}
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
                  placeholder="Buscar contrato, cliente, equipo..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Listado de Contratos */}
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
                          ALQ-{contrato.consecutivo}
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
                      <div className="text-slate-400 font-medium">Equipos Contratados ({contrato.items.length}):</div>
                      <ul className="space-y-1">
                        {contrato.items.map((it, idx) => (
                          <li key={idx} className="flex justify-between text-slate-300">
                            <span>• {it.cantidad}x {it.nombre}</span>
                            <span className="font-bold text-sky-300">$ {it.subtotal.toLocaleString("es-CO")},00</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                        <span className="text-[10px] text-slate-500 block">Subtotal</span>
                        <strong className="text-white">$ {contrato.subtotal.toLocaleString("es-CO")}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                        <span className="text-[10px] text-slate-500 block">Depósito</span>
                        <strong className="text-emerald-400">$ {contrato.deposito.toLocaleString("es-CO")}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                        <span className="text-[10px] text-slate-500 block">Saldo</span>
                        <strong className="text-sky-400">$ {contrato.total.toLocaleString("es-CO")}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Scale className="h-3.5 w-3.5 text-indigo-400" />
                        <span>{contrato.pesoTotalKilos.toFixed(3)} Kg</span>
                      </span>
                      <button 
                        onClick={() => setSelectedContratoDetalle(contrato)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold border border-white/10 flex items-center space-x-1"
                      >
                        <Eye className="h-3.5 w-3.5 text-sky-400" />
                        <span>Ver Detalle</span>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white">Catálogo de Bodega e Inventario</h1>
                <p className="text-xs text-slate-400">Gestión CRUD de Equipos, Carga Masiva y Control de Stock (`peso_gramos BIGINT`)</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setShowBulkModal(true)} className="px-4 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 text-xs font-bold flex items-center space-x-2">
                  <FileSpreadsheet className="h-4 w-4 text-indigo-400" />
                  <span>Carga Masiva</span>
                </button>
                <button onClick={() => setShowEquipoModal(true)} className="glass-button-primary px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2">
                  <PackagePlus className="h-4 w-4" />
                  <span>Nuevo Equipo</span>
                </button>
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

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                    <button onClick={() => handleOpenNuevoAlquiler(item.id)} disabled={item.stockDisponible === 0} className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 ${
                      item.stockDisponible > 0 ? "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Alquilar Este Equipo</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: DEVOLUCIONES (RECEPCIÓN & REINGRESO AUTOMÁTICO A BODEGA) */}
        {activeTab === "devoluciones" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white">Recepción de Devoluciones & Registro de Daños</h1>
                <p className="text-xs text-slate-400">Reingreso a Bodega e Inspección Física de Equipos (Corte 5:00 PM `America/Bogota`)</p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Contratos Activos con Equipos en Obra:</span>
              
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

        {/* PESTAÑA 5: FACTURACIÓN & CUENTAS DE COBRO (100% RENGLONES) */}
        {activeTab === "facturacion" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white">Facturación, Cuentas de Cobro & PDFs</h1>
                <p className="text-xs text-slate-400">Liquidación en COP `NUMERIC(12, 2)` con 100% de renglones contratados</p>
              </div>
            </div>

            {/* Contratos Listos para Liquidar */}
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
                      <span className="text-xs font-extrabold text-sky-400">$ {contrato.total.toLocaleString("es-CO")},00</span>
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
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Historial de Cuentas de Cobro Emitidas ({facturas.length}):</span>
              {facturas.length === 0 ? (
                <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-xs">
                  No hay cuentas de cobro generadas todavía.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facturas.map((fac) => (
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
                        <strong className="text-sky-300 font-extrabold">$ {fac.totalPagar.toLocaleString("es-CO")},00</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 6: CLIENTES */}
        {activeTab === "clientes" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white">Directorio de Clientes & Terceros</h1>
                <p className="text-xs text-slate-400">Sanitización en Mayúsculas (`UPPERCASE.trim()`) e Historiales Cruzados (Alquileres, Pagos, Cartera)</p>
              </div>
              <button onClick={() => setShowClienteModal(true)} className="glass-button-primary px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Nuevo Cliente</span>
              </button>
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

      </main>

      {/* MODAL CREAR CONTRATO DE ALQUILER MULTI-ITEM */}
      {showMultiAlquilerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
                <FileText className="h-5 w-5 text-sky-400" />
                <span>Nuevo Contrato de Alquiler de Maquinaria</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300">Cliente Contratante*</label>
                  <select 
                    value={nuevoAlquilerClienteId} 
                    onChange={(e) => setNuevoAlquilerClienteId(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-100 focus:outline-none"
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nitCedula} — {c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Tipo de Documento</label>
                  <select 
                    value={nuevoAlquilerEstado} 
                    onChange={(e) => setNuevoAlquilerEstado(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="ACTIVO">Contrato Despachado (Descuenta Stock Bodega)</option>
                    <option value="COTIZACION">Cotización Preliminar (No Descuenta Stock)</option>
                  </select>
                </div>
              </div>

              {/* LISTA MULTI-ITEM DE EQUIPOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Equipos a Incluir en Contrato</span>
                  <button 
                    type="button" 
                    onClick={handleAddLineaEquipo}
                    className="px-3 py-1 rounded-xl bg-sky-600/20 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Añadir Otro Equipo</span>
                  </button>
                </div>

                <div className="space-y-2.5">
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

                        <div className="grid grid-cols-4 gap-2 text-xs">
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
                            <span className="text-[10px] text-slate-400 block">Días</span>
                            <input
                              type="number"
                              min={1}
                              value={linea.dias}
                              onChange={(e) => handleUpdateLineaEquipo(index, "dias", parseInt(e.target.value, 10) || 1)}
                              className="w-full p-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs"
                            />
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
                            <div className="p-1.5 text-sky-300 font-extrabold text-xs">
                              $ {(linea.cantidad * linea.tarifaDiaria * linea.dias).toLocaleString("es-CO")}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Monto Garantía (COP)</label>
                  <input
                    type="number"
                    value={nuevoAlquilerGarantiaMonto}
                    onChange={(e) => setNuevoAlquilerGarantiaMonto(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Tipo Garantía</label>
                  <input
                    type="text"
                    value={nuevoAlquilerGarantiaTipo}
                    onChange={(e) => setNuevoAlquilerGarantiaTipo(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* RESUMEN FINANCIERO */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Subtotal Equipos</span>
                  <strong className="text-lg font-black text-white">$ {subtotalContrato.toLocaleString("es-CO")},00</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Peso Total Carga</span>
                  <strong className="text-lg font-black text-indigo-400">{pesoTotalContratoKilos.toFixed(3)} Kg</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Saldo a Cobrar</span>
                  <strong className="text-lg font-black text-sky-400">$ {totalContrato.toLocaleString("es-CO")},00</strong>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setShowMultiAlquilerModal(false)} className="px-4 py-2.5 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl">Cancelar</button>
                <button type="submit" className="glass-button-primary px-5 py-2.5 text-xs font-bold text-white rounded-xl">
                  Confirmar y Despachar Contrato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DEVOLUCIÓN & INSPECCIÓN */}
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

      {/* MODAL FACTURACIÓN / CUENTA DE COBRO */}
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
                    <span>{it.cantidad}x {it.nombre} ({it.dias} días)</span>
                    <span className="font-bold text-sky-300">$ {it.subtotal.toLocaleString("es-CO")},00</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5"><span className="text-[10px] text-slate-500 block">Subtotal</span><strong>$ {contratoParaFacturar.subtotal.toLocaleString("es-CO")}</strong></div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5"><span className="text-[10px] text-slate-500 block">Depósito</span><strong className="text-emerald-400">- $ {contratoParaFacturar.deposito.toLocaleString("es-CO")}</strong></div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5"><span className="text-[10px] text-slate-500 block">Total a Pagar</span><strong className="text-sky-400">$ {contratoParaFacturar.total.toLocaleString("es-CO")}</strong></div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
              <button type="button" onClick={() => setShowFacturaModal(false)} className="px-4 py-2 bg-slate-900 text-xs font-bold rounded-xl">Cerrar</button>
              <button onClick={handleEmitirFactura} className="glass-button-primary px-5 py-2 text-xs font-bold text-white rounded-xl flex items-center space-x-2">
                <Printer className="h-4 w-4" />
                <span>Emitir Cuenta de Cobro & PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE CONTRATO */}
      {selectedContratoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  ALQ-{selectedContratoDetalle.consecutivo}
                </span>
                <h2 className="text-lg font-black text-white mt-1">{selectedContratoDetalle.clienteNombre}</h2>
              </div>
              <button onClick={() => setSelectedContratoDetalle(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase">Equipos en este Contrato:</span>
              <div className="space-y-2">
                {selectedContratoDetalle.items.map((it, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-white block">{it.cantidad}x {it.nombre}</strong>
                      <span className="text-slate-400">{it.dias} días a $ {it.tarifaDiaria.toLocaleString("es-CO")}/día ({it.pesoKilos} Kg)</span>
                    </div>
                    <span className="font-extrabold text-sky-300">$ {it.subtotal.toLocaleString("es-CO")},00</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs bg-slate-900/50 p-3 rounded-2xl border border-white/5">
              <div><span className="text-slate-500 block">Subtotal</span><strong className="text-white">$ {selectedContratoDetalle.subtotal.toLocaleString("es-CO")}</strong></div>
              <div><span className="text-slate-500 block">Depósito</span><strong className="text-emerald-400">$ {selectedContratoDetalle.deposito.toLocaleString("es-CO")}</strong></div>
              <div><span className="text-slate-500 block">Saldo</span><strong className="text-sky-400">$ {selectedContratoDetalle.total.toLocaleString("es-CO")}</strong></div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <button 
                onClick={() => {
                  const c = selectedContratoDetalle;
                  setSelectedContratoDetalle(null);
                  handleOpenDevolucion(c);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold"
              >
                Registrar Devolución
              </button>
              <button 
                onClick={() => {
                  const c = selectedContratoDetalle;
                  setSelectedContratoDetalle(null);
                  handleOpenFacturacion(c);
                }}
                className="glass-button-primary px-5 py-2 rounded-xl text-xs font-bold text-white"
              >
                Liquidar / Generar Factura
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
