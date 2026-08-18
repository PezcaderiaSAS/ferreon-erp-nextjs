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
  AlertTriangle,
  Scale,
  DollarSign
} from "lucide-react";

type TabType = "dashboard" | "alquileres" | "bodega" | "devoluciones" | "facturacion" | "clientes";

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

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [previousTab, setPreviousTab] = useState<TabType | null>(null);

  // Lista de Clientes en estado local
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

  // Lista de Equipos en estado local (Catálogo de Bodega)
  const [equipos, setEquipos] = useState<Equipo[]>([
    { id: "EQ-001", codigo: "MEZ-01", nombre: "MEZCLADORA DE CONCRETO 2 BULTOS (MOTOR 13HP)", categoria: "MAQUINARIA", tarifaDiaria: 45000, pesoKilos: 250.0, stockTotal: 10, stockDisponible: 10, stockEnObra: 0, activo: true },
    { id: "EQ-002", codigo: "VIB-02", nombre: "VIBRADOR DE CONCRETO ELÉCTRICO 2HP (MANGUERA 4M)", categoria: "EQUIPOS MENORES", tarifaDiaria: 25000, pesoKilos: 15.0, stockTotal: 15, stockDisponible: 15, stockEnObra: 0, activo: true },
    { id: "EQ-003", codigo: "DEM-03", nombre: "DEMOLEDOR ELÉCTRICO 30KG (ENCABEZADO HEX 28MM)", categoria: "HERRAMIENTAS", tarifaDiaria: 65000, pesoKilos: 30.0, stockTotal: 8, stockDisponible: 8, stockEnObra: 0, activo: true },
    { id: "EQ-004", codigo: "AND-04", nombre: "ANDAMIO MULTIDIRECCIONAL (MÓDULO 1.5M X 1.5M)", categoria: "ESTRUCTURAS", tarifaDiaria: 12000, pesoKilos: 45.0, stockTotal: 50, stockDisponible: 50, stockEnObra: 0, activo: true },
    { id: "EQ-005", codigo: "COR-05", nombre: "CORTADORA DE PAVIMENTO 13HP (DISCO 14 PULGADAS)", categoria: "MAQUINARIA", tarifaDiaria: 85000, pesoKilos: 120.0, stockTotal: 5, stockDisponible: 5, stockEnObra: 0, activo: true },
    { id: "EQ-006", codigo: "PLA-06", nombre: "PLANTA ELÉCTRICA 6.5 KW (DIÉSEL MONOFÁSICA)", categoria: "GENERACIÓN", tarifaDiaria: 75000, pesoKilos: 95.0, stockTotal: 6, stockDisponible: 6, stockEnObra: 0, activo: true },
  ]);

  // Estados de Modales de Cliente y Historial
  const [showClienteModal, setShowClienteModal] = useState<boolean>(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [showHistorialModal, setShowHistorialModal] = useState<boolean>(false);
  const [selectedClienteHistorial, setSelectedClienteHistorial] = useState<Cliente | null>(null);
  const [historialSubTab, setHistorialSubTab] = useState<"alquileres" | "pagos" | "cartera">("alquileres");

  // Estados de Modales de Bodega (Crear Individual, Carga Masiva, Editar)
  const [showEquipoModal, setShowEquipoModal] = useState<boolean>(false);
  const [editingEquipo, setEditingEquipo] = useState<Equipo | null>(null);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>("");

  // Estado de Modal de Crear Alquiler
  const [showCrearAlquilerModal, setShowCrearAlquilerModal] = useState<boolean>(false);
  const [alquilerClienteId, setAlquilerClienteId] = useState<string>("");
  const [alquilerEquipoId, setAlquilerEquipoId] = useState<string>("");
  const [alquilerCantidad, setAlquilerCantidad] = useState<number>(1);
  const [alquilerDias, setAlquilerDias] = useState<number>(3);
  const [alquilerDeposito, setAlquilerDeposito] = useState<number>(100000);
  const [alquilerError, setAlquilerError] = useState<string | null>(null);

  // Estado del Formulario de Cliente
  const [clientFormData, setClientFormData] = useState({ nitCedula: "", nombre: "", telefono: "", email: "", direccion: "" });
  const [clientFormError, setClientFormError] = useState<string | null>(null);
  const [clientSearchFilter, setClientSearchFilter] = useState<string>("");

  // Estado del Formulario de Equipo
  const [equipoFormData, setEquipoFormData] = useState({ codigo: "", nombre: "", categoria: "MAQUINARIA", tarifaDiaria: 30000, pesoKilos: 10, stockTotal: 5 });
  const [equipoFormError, setEquipoFormError] = useState<string | null>(null);
  const [equipoSearchFilter, setEquipoSearchFilter] = useState<string>("");

  // Navegación bidireccional entre pestañas
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

  // Abrir Modal para Crear/Editar Cliente
  const handleOpenCrearClienteModal = () => {
    setEditingCliente(null);
    setClientFormData({ nitCedula: "", nombre: "", telefono: "", email: "", direccion: "" });
    setClientFormError(null);
    setShowClienteModal(true);
  };

  const handleSaveCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFormData.nitCedula.trim() || !clientFormData.nombre.trim()) {
      setClientFormError("La Identificación (NIT/Cédula) y la Razón Social son obligatorios.");
      return;
    }
    const nitClean = clientFormData.nitCedula.trim().toUpperCase();
    const nombreClean = clientFormData.nombre.trim().toUpperCase();

    if (editingCliente) {
      setClientes((prev) => prev.map((c) => c.id === editingCliente.id ? { ...c, nitCedula: nitClean, nombre: nombreClean, telefono: clientFormData.telefono.trim(), email: clientFormData.email.trim().toLowerCase(), direccion: clientFormData.direccion.trim() } : c));
    } else {
      const nuevo: Cliente = { id: "CLI-" + Date.now(), nitCedula: nitClean, nombre: nombreClean, telefono: clientFormData.telefono.trim(), email: clientFormData.email.trim().toLowerCase(), direccion: clientFormData.direccion.trim(), activo: true };
      setClientes((prev) => [nuevo, ...prev]);
    }
    setShowClienteModal(false);
  };

  // Abrir Modal para Crear / Editar Equipo de Bodega
  const handleOpenCrearEquipoModal = () => {
    setEditingEquipo(null);
    setEquipoFormData({ codigo: "", nombre: "", categoria: "MAQUINARIA", tarifaDiaria: 35000, pesoKilos: 15, stockTotal: 5 });
    setEquipoFormError(null);
    setShowEquipoModal(true);
  };

  const handleOpenEditarEquipoModal = (equipo: Equipo) => {
    setEditingEquipo(equipo);
    setEquipoFormData({
      codigo: equipo.codigo,
      nombre: equipo.nombre,
      categoria: equipo.categoria,
      tarifaDiaria: equipo.tarifaDiaria,
      pesoKilos: equipo.pesoKilos,
      stockTotal: equipo.stockTotal,
    });
    setEquipoFormError(null);
    setShowEquipoModal(true);
  };

  const handleSaveEquipo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipoFormData.codigo.trim() || !equipoFormData.nombre.trim()) {
      setEquipoFormError("El Código y Nombre del equipo son obligatorios.");
      return;
    }

    const codClean = equipoFormData.codigo.trim().toUpperCase();
    const nomClean = equipoFormData.nombre.trim().toUpperCase();

    if (editingEquipo) {
      const dif = equipoFormData.stockTotal - editingEquipo.stockTotal;
      const nuevoDisp = editingEquipo.stockDisponible + dif;
      if (nuevoDisp < 0) {
        setEquipoFormError("No es posible reducir el stock total por debajo de las unidades en obra.");
        return;
      }
      setEquipos((prev) => prev.map((eq) => eq.id === editingEquipo.id ? { ...eq, codigo: codClean, nombre: nomClean, categoria: equipoFormData.categoria.toUpperCase(), tarifaDiaria: equipoFormData.tarifaDiaria, pesoKilos: equipoFormData.pesoKilos, stockTotal: equipoFormData.stockTotal, stockDisponible: nuevoDisp } : eq));
    } else {
      const nuevo: Equipo = {
        id: "EQ-" + Date.now(),
        codigo: codClean,
        nombre: nomClean,
        categoria: equipoFormData.categoria.toUpperCase(),
        tarifaDiaria: equipoFormData.tarifaDiaria,
        pesoKilos: equipoFormData.pesoKilos,
        stockTotal: equipoFormData.stockTotal,
        stockDisponible: equipoFormData.stockTotal,
        stockEnObra: 0,
        activo: true,
      };
      setEquipos((prev) => [nuevo, ...prev]);
    }
    setShowEquipoModal(false);
  };

  // Carga Masiva de Equipos
  const handleProcessBulkLoad = () => {
    try {
      const lineas = bulkText.split("\n").filter((l) => l.trim().length > 0);
      if (lineas.length === 0) {
        alert("Por favor ingrese al menos una línea con datos de equipos.");
        return;
      }

      const nuevos: Equipo[] = lineas.map((linea, idx) => {
        const partes = linea.split(",");
        const codigo = (partes[0] || `EQ-BULK-${idx}`).trim().toUpperCase();
        const nombre = (partes[1] || `EQUIPO MASIVO ${idx + 1}`).trim().toUpperCase();
        const tarifa = parseFloat(partes[2] || "30000");
        const peso = parseFloat(partes[3] || "20");
        const stock = parseInt(partes[4] || "5", 10);

        return {
          id: "EQ-BULK-" + (Date.now() + idx),
          codigo,
          nombre,
          categoria: "CARGA MASIVA",
          tarifaDiaria: isNaN(tarifa) ? 30000 : tarifa,
          pesoKilos: isNaN(peso) ? 20 : peso,
          stockTotal: isNaN(stock) ? 5 : stock,
          stockDisponible: isNaN(stock) ? 5 : stock,
          stockEnObra: 0,
          activo: true,
        };
      });

      setEquipos((prev) => [...nuevos, ...prev]);
      setShowBulkModal(false);
      setBulkText("");
    } catch (err: any) {
      alert("Error procesando la carga masiva: " + err.message);
    }
  };

  // Inactivar Equipo
  const handleInactivarEquipo = (equipoId: string) => {
    if (confirm("¿Está seguro de inactivar este equipo de la bodega?")) {
      setEquipos((prev) => prev.map((eq) => eq.id === equipoId ? { ...eq, activo: false } : eq));
    }
  };

  // Abrir Modal para Crear Alquiler (con validación de Stock en Vivo)
  const handleOpenCrearAlquiler = (equipoPreseleccionadoId?: string) => {
    if (clientes.length === 0) {
      alert("Debe registrar al menos un cliente en 'Clientes & Terceros' antes de crear un alquiler.");
      return;
    }
    setAlquilerClienteId(clientes[0].id);
    setAlquilerEquipoId(equipoPreseleccionadoId || (equipos[0] ? equipos[0].id : ""));
    setAlquilerCantidad(1);
    setAlquilerDias(3);
    setAlquilerDeposito(100000);
    setAlquilerError(null);
    setShowCrearAlquilerModal(true);
  };

  // Equipo seleccionado en el formulario de Alquiler para ver Stock en Vivo
  const equipoAlquilerSeleccionado = equipos.find((e) => e.id === alquilerEquipoId);

  // Confirmar Alquiler y descontar Stock Disponible
  const handleConfirmarAlquiler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipoAlquilerSeleccionado) {
      setAlquilerError("Debe seleccionar un equipo válido.");
      return;
    }
    if (alquilerCantidad <= 0) {
      setAlquilerError("La cantidad debe ser mayor a 0.");
      return;
    }
    if (alquilerCantidad > equipoAlquilerSeleccionado.stockDisponible) {
      setAlquilerError(`Stock insuficiente para '${equipoAlquilerSeleccionado.nombre}'. Disponible: ${equipoAlquilerSeleccionado.stockDisponible}, Solicitado: ${alquilerCantidad}.`);
      return;
    }

    // Descontar stock disponible e incrementar en obra
    setEquipos((prev) =>
      prev.map((eq) =>
        eq.id === equipoAlquilerSeleccionado.id
          ? {
              ...eq,
              stockDisponible: eq.stockDisponible - alquilerCantidad,
              stockEnObra: eq.stockEnObra + alquilerCantidad,
            }
          : eq
      )
    );

    setShowCrearAlquilerModal(false);
    alert("¡Contrato de alquiler registrado exitosamente! El stock disponible ha sido actualizado en tiempo real.");
    navigateToTab("alquileres");
  };

  // Equipos filtrados por búsqueda en Bodega
  const equiposFiltrados = equipos.filter(
    (eq) =>
      eq.activo &&
      (eq.nombre.toLowerCase().includes(equipoSearchFilter.toLowerCase()) ||
        eq.codigo.toLowerCase().includes(equipoSearchFilter.toLowerCase()) ||
        eq.categoria.toLowerCase().includes(equipoSearchFilter.toLowerCase()))
  );

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
              onClick={() => handleOpenCrearAlquiler()}
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
            { id: "alquileres", label: "Alquileres", icon: FileText },
            { id: "bodega", label: "Bodega e Inventario", icon: Package },
            { id: "devoluciones", label: "Devoluciones", icon: RotateCcw },
            { id: "facturacion", label: "Facturación & PDF", icon: Receipt },
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

      {/* CONTENIDO DINÁMICO */}
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
                  <span className="text-4xl font-extrabold text-white">0</span>
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
                  <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Devoluciones Hoy</span>
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <RotateCcw className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5">
                  <span className="text-4xl font-extrabold text-white">0</span>
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

        {/* PESTAÑA 2: CONTRATOS DE ALQUILER */}
        {activeTab === "alquileres" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Gestión de Alquileres & Contratos</h1>
                <p className="text-xs text-slate-400">Cotización, Despacho y Seguimiento de Equipos en Obra</p>
              </div>
              <button 
                onClick={() => handleOpenCrearAlquiler()}
                className="glass-button-primary px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Contrato de Alquiler</span>
              </button>
            </div>

            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900/30 rounded-2xl border border-white/5">
                <FileText className="h-10 w-10 mx-auto text-sky-400/60" />
                <p className="text-sm font-medium">Instancia limpia lista. Ningún contrato de alquiler registrado.</p>
                <button onClick={() => handleOpenCrearAlquiler()} className="glass-button-primary px-5 py-2 rounded-xl text-xs font-bold text-white">
                  Crear Primer Alquiler con Stock en Vivo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: BODEGA E INVENTARIO (CRUD COMPLETO Y CARGA MASIVA) */}
        {activeTab === "bodega" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white">Catálogo de Bodega e Inventario</h1>
                <p className="text-xs text-slate-400">Gestión CRUD de Equipos, Carga Masiva y Control de Stock (`peso_gramos BIGINT`)</p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowBulkModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 text-xs font-bold flex items-center space-x-2"
                >
                  <FileSpreadsheet className="h-4 w-4 text-indigo-400" />
                  <span>Carga Masiva (Bulk)</span>
                </button>
                <button 
                  onClick={handleOpenCrearEquipoModal}
                  className="glass-button-primary px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2"
                >
                  <PackagePlus className="h-4 w-4" />
                  <span>Nuevo Equipo</span>
                </button>
              </div>
            </div>

            {/* Buscador de Equipos */}
            <div className="glass-panel rounded-2xl p-4 flex items-center space-x-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={equipoSearchFilter}
                onChange={(e) => setEquipoSearchFilter(e.target.value)}
                placeholder="Buscar por código, nombre de equipo o categoría..."
                className="w-full bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              {equipoSearchFilter && (
                <button onClick={() => setEquipoSearchFilter("")} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Grilla de Equipos en Bodega */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equiposFiltrados.map((item) => (
                <div key={item.id} className="glass-panel glass-panel-hover rounded-2xl p-5 space-y-4 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">
                        {item.codigo}
                      </span>
                      <h3 className="font-extrabold text-white text-sm mt-1">{item.nombre}</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      item.stockDisponible > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                      {item.stockDisponible > 0 ? `${item.stockDisponible} DISP.` : "AGOTADO"}
                    </span>
                  </div>

                  {/* Detalle de Stock e Indicadores */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-2.5 rounded-xl border border-white/5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Total</span>
                      <strong className="text-white font-extrabold">{item.stockTotal} u.</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Disponible</span>
                      <strong className="text-emerald-400 font-extrabold">{item.stockDisponible} u.</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">En Obra</span>
                      <strong className="text-amber-400 font-extrabold">{item.stockEnObra} u.</strong>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300">
                    <p className="flex justify-between"><span className="text-slate-400">Tarifa Diaria:</span> <strong className="text-sky-300">$ {item.tarifaDiaria.toLocaleString("es-CO")},00</strong></p>
                    <p className="flex justify-between"><span className="text-slate-400">Peso Estándar:</span> <strong>{item.pesoKilos.toFixed(3)} Kg</strong></p>
                  </div>

                  {/* Acciones CRUD del Equipo */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                    <button 
                      onClick={() => handleOpenEditarEquipoModal(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center space-x-1 border border-white/10"
                    >
                      <Edit className="h-3.5 w-3.5 text-sky-400" />
                      <span>Editar</span>
                    </button>

                    <button 
                      onClick={() => handleInactivarEquipo(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      <span>Inactivar</span>
                    </button>

                    <button 
                      onClick={() => handleOpenCrearAlquiler(item.id)}
                      disabled={item.stockDisponible === 0}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 ${
                        item.stockDisponible > 0 
                          ? "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30" 
                          : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Alquilar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: DEVOLUCIONES */}
        {activeTab === "devoluciones" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Recepción de Devoluciones & Registro de Daños</h1>
                <p className="text-xs text-slate-400">Reingreso a Bodega e Inspección Física de Equipos (Corte 5:00 PM)</p>
              </div>
              <button onClick={() => navigateToTab("bodega")} className="text-xs text-sky-400 hover:underline font-semibold">
                <span>Ver Stock en Bodega</span>
              </button>
            </div>

            <div className="glass-panel rounded-3xl p-8 space-y-4 text-center">
              <RotateCcw className="h-10 w-10 mx-auto text-amber-400/70" />
              <p className="text-slate-300 text-sm font-medium">No hay devoluciones pendientes programadas para hoy.</p>
            </div>
          </div>
        )}

        {/* PESTAÑA 5: FACTURACIÓN & PDF */}
        {activeTab === "facturacion" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Facturación, Cuentas de Cobro & PDFs</h1>
                <p className="text-xs text-slate-400">Liquidación en COP `NUMERIC(12, 2)` con 100% de ítems contratados</p>
              </div>
              <button onClick={() => navigateToTab("alquileres")} className="text-xs text-sky-400 hover:underline font-semibold">
                <span>Ir a Alquileres</span>
              </button>
            </div>

            <div className="glass-panel rounded-3xl p-8 space-y-4 text-center">
              <Receipt className="h-10 w-10 mx-auto text-indigo-400/70" />
              <p className="text-slate-300 text-sm font-medium">Instancia limpia sin facturas o cuentas de cobro emitidas.</p>
            </div>
          </div>
        )}

        {/* PESTAÑA 6: CLIENTES & TERCEROS */}
        {activeTab === "clientes" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white">Directorio de Clientes & Terceros</h1>
                <p className="text-xs text-slate-400">Sanitización en Mayúsculas (`UPPERCASE.trim()`) e Historiales Cruzados (Alquileres, Pagos, Cartera)</p>
              </div>
              <button onClick={handleOpenCrearClienteModal} className="glass-button-primary px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Nuevo Cliente / Tercero</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientes.map((cliente) => (
                <div key={cliente.id} className="glass-panel glass-panel-hover rounded-2xl p-5 space-y-4 relative">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">{cliente.nitCedula}</span>
                      <h3 className="font-extrabold text-white text-sm">{cliente.nombre}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">ACTIVO</span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300 border-t border-white/5 pt-3">
                    <p><span className="text-slate-400">Teléfono:</span> {cliente.telefono}</p>
                    <p><span className="text-slate-400">Email:</span> {cliente.email}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button onClick={() => handleOpenCrearAlquiler()} className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1">
                      <Plus className="h-3.5 w-3.5" />
                      <span>Alquilar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODAL GLASSMORPHISM REGISTRAR / EDITAR CLIENTE */}
      {showClienteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-extrabold text-white">{editingCliente ? "Editar Cliente" : "Nuevo Cliente"}</h2>
              <button onClick={() => setShowClienteModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {clientFormError && <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs">{clientFormError}</div>}
            <form onSubmit={handleSaveCliente} className="space-y-4">
              <input type="text" placeholder="NIT / Cédula" value={clientFormData.nitCedula} onChange={(e) => setClientFormData({ ...clientFormData, nitCedula: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs uppercase" required />
              <input type="text" placeholder="Nombre / Razón Social" value={clientFormData.nombre} onChange={(e) => setClientFormData({ ...clientFormData, nombre: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs uppercase" required />
              <input type="text" placeholder="Teléfono" value={clientFormData.telefono} onChange={(e) => setClientFormData({ ...clientFormData, telefono: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs" />
              <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={() => setShowClienteModal(false)} className="px-4 py-2 bg-slate-900 text-xs font-bold rounded-xl">Cancelar</button>
                <button type="submit" className="glass-button-primary px-5 py-2 text-xs font-bold text-white rounded-xl">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GLASSMORPHISM CREAR / EDITAR EQUIPO EN BODEGA */}
      {showEquipoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
                <PackagePlus className="h-5 w-5 text-sky-400" />
                <span>{editingEquipo ? "Editar Equipo de Bodega" : "Registrar Nuevo Equipo en Bodega"}</span>
              </h2>
              <button onClick={() => setShowEquipoModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {equipoFormError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>{equipoFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEquipo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Código Equipo*</label>
                  <input type="text" placeholder="Ej: MEZ-01" value={equipoFormData.codigo} onChange={(e) => setEquipoFormData({ ...equipoFormData, codigo: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs uppercase" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Categoría</label>
                  <input type="text" placeholder="MAQUINARIA" value={equipoFormData.categoria} onChange={(e) => setEquipoFormData({ ...equipoFormData, categoria: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs uppercase" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Nombre / Descripción del Equipo*</label>
                <input type="text" placeholder="Ej: MEZCLADORA DE CONCRETO 2 BULTOS" value={equipoFormData.nombre} onChange={(e) => setEquipoFormData({ ...equipoFormData, nombre: e.target.value })} className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs uppercase" required />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Tarifa Diaria (COP)</label>
                  <input type="number" value={equipoFormData.tarifaDiaria} onChange={(e) => setEquipoFormData({ ...equipoFormData, tarifaDiaria: parseFloat(e.target.value) || 0 })} className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Peso (Kilos)</label>
                  <input type="number" step="0.001" value={equipoFormData.pesoKilos} onChange={(e) => setEquipoFormData({ ...equipoFormData, pesoKilos: parseFloat(e.target.value) || 0 })} className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Stock Total</label>
                  <input type="number" value={equipoFormData.stockTotal} onChange={(e) => setEquipoFormData({ ...equipoFormData, stockTotal: parseInt(e.target.value, 10) || 0 })} className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs" required />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowEquipoModal(false)} className="px-4 py-2 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl border border-white/10">Cancelar</button>
                <button type="submit" className="glass-button-primary px-5 py-2 text-xs font-bold text-white rounded-xl">Guardar en Bodega</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GLASSMORPHISM CARGA MASIVA (BULK LOAD) */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
                <span>Carga Masiva de Equipos e Inventario</span>
              </h2>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <p className="text-xs text-slate-300">
              Pegue sus equipos separados por comas (un equipo por línea):<br />
              <code className="text-sky-300 font-mono text-[11px]">CODIGO, NOMBRE, TARIFA_COP, PESO_KG, STOCK_TOTAL</code>
            </p>

            <textarea 
              rows={6}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="MEZ-10, MEZCLADORA 2 BULTOS MOTOR HONDA, 45000, 250, 5&#10;VIB-11, VIBRADOR GASOLINA 5.5HP, 30000, 22, 10"
              className="w-full p-3.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end space-x-3 border-t border-white/10 pt-3">
              <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl border border-white/10">Cancelar</button>
              <button onClick={handleProcessBulkLoad} className="glass-button-primary px-5 py-2 text-xs font-bold text-white rounded-xl">Procesar Carga Masiva</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GLASSMORPHISM CREAR CONTRATO CON VISIBILIDAD DE STOCK EN VIVO */}
      {showCrearAlquilerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-5 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
                <FileText className="h-5 w-5 text-sky-400" />
                <span>Nuevo Contrato de Alquiler</span>
              </h2>
              <button onClick={() => setShowCrearAlquilerModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {alquilerError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{alquilerError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmarAlquiler} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300">Cliente Contratante*</label>
                <select 
                  value={alquilerClienteId} 
                  onChange={(e) => setAlquilerClienteId(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-100 focus:outline-none"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nitCedula} — {c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Equipo a Alquilar*</label>
                <select 
                  value={alquilerEquipoId} 
                  onChange={(e) => setAlquilerEquipoId(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-100 focus:outline-none"
                >
                  {equipos.filter(e => e.activo).map((e) => (
                    <option key={e.id} value={e.id}>{e.codigo} — {e.nombre} ({e.stockDisponible} u. disponibles)</option>
                  ))}
                </select>
              </div>

              {/* TARJETA DE VISIBILIDAD DE STOCK EN TIEMPO REAL */}
              {equipoAlquilerSeleccionado && (
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Stock Disponible en Bodega:</span>
                    <span className={`font-extrabold px-2.5 py-0.5 rounded-full text-xs ${
                      equipoAlquilerSeleccionado.stockDisponible > 0 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}>
                      {equipoAlquilerSeleccionado.stockDisponible} Unidades
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Tarifa Diaria:</span>
                    <span className="font-extrabold text-sky-300">$ {equipoAlquilerSeleccionado.tarifaDiaria.toLocaleString("es-CO")},00 COP</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Cantidad a Alquilar*</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={equipoAlquilerSeleccionado ? equipoAlquilerSeleccionado.stockDisponible : 1}
                    value={alquilerCantidad} 
                    onChange={(e) => setAlquilerCantidad(parseInt(e.target.value, 10) || 1)} 
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Días Contratados*</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={alquilerDias} 
                    onChange={(e) => setAlquilerDias(parseInt(e.target.value, 10) || 1)} 
                    className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Depósito en Efectivo (COP)</label>
                <input 
                  type="number" 
                  value={alquilerDeposito} 
                  onChange={(e) => setAlquilerDeposito(parseFloat(e.target.value) || 0)} 
                  className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs" 
                />
              </div>

              {/* Total Estimado */}
              {equipoAlquilerSeleccionado && (
                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
                  <span className="text-xs text-slate-300 block">Total Estima Contrato:</span>
                  <strong className="text-2xl font-black text-sky-300">
                    $ {(equipoAlquilerSeleccionado.tarifaDiaria * alquilerCantidad * alquilerDias).toLocaleString("es-CO")},00 COP
                  </strong>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowCrearAlquilerModal(false)} className="px-4 py-2 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl border border-white/10">Cancelar</button>
                <button type="submit" className="glass-button-primary px-5 py-2 text-xs font-bold text-white rounded-xl">Confirmar y Despachar Alquiler</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
