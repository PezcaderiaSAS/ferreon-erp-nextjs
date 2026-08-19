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
  UserCheck
} from "lucide-react";
import { EnterprisePDFService, DocumentoPDFPayload } from "../core/services/pdf-factura-generator.service";

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

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [previousTab, setPreviousTab] = useState<TabType | null>(null);

  // Fecha de hoy en formato YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultFinStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

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

  // Contratos de Alquiler y Facturas
  const [contratos, setContratos] = useState<ContratoAlquiler[]>([]);
  const [facturas, setFacturas] = useState<FacturaEmitida[]>([]);

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
  const [showClienteModal, setShowClienteModal] = useState<boolean>(false);
  const [showEquipoModal, setShowEquipoModal] = useState<boolean>(false);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);

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

  // Función para Imprimir / Exportar PDF Empresarial
  const handleImprimirDocumentoPDF = (contrato: ContratoAlquiler, tipo: "COTIZACION" | "CONTRATO" | "CUENTA_COBRO") => {
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
    };

    const html = EnterprisePDFService.generarHTMLDocumento(payload);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
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
    handleImprimirDocumentoPDF(contratoParaFacturar, "CUENTA_COBRO");
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
                  Cálculo automático de días de alquiler por fechas individuales de ítem, generación de PDFs empresariales A4,
                  control estricto de peso (`peso_gramos BIGINT`) e inventario en tiempo real.
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
                  <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Documentos & PDF</span>
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Printer className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5">
                  <span className="text-xl font-bold text-emerald-400 block">PDF A4 Ready</span>
                  <span className="text-xs text-slate-400 font-medium">Cotizaciones y Contratos</span>
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
                <p className="text-xs text-slate-400">Fechas Individuales por Ítem, Días Calculados Automáticamente y Generación de PDF Empresarial</p>
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
                      <div className="text-slate-400 font-medium">Equipos Contratados ({contrato.items.length}):</div>
                      <ul className="space-y-1">
                        {contrato.items.map((it, idx) => (
                          <li key={idx} className="flex justify-between text-slate-300">
                            <span>• {it.cantidad}x {it.nombre} ({it.dias} días: {it.fechaInicio} al {it.fechaFin})</span>
                            <span className="font-bold text-sky-300">$ {it.subtotal.toLocaleString("es-CO")},00</span>
                          </li>
                        ))}
                      </ul>
                      {(contrato.fleteEntrega > 0 || contrato.fleteRecogida > 0) && (
                        <div className="border-t border-white/5 pt-1.5 flex justify-between text-indigo-300 text-[11px]">
                          <span className="flex items-center space-x-1">
                            <Truck className="h-3 w-3" />
                            <span>Fletes (Llevar + Recoger):</span>
                          </span>
                          <strong>$ {(contrato.fleteEntrega + contrato.fleteRecogida).toLocaleString("es-CO")},00</strong>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                        <span className="text-[10px] text-slate-500 block">Subtotal Total</span>
                        <strong className="text-white">$ {contrato.subtotalGeneral.toLocaleString("es-CO")}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                        <span className="text-[10px] text-slate-500 block">Depósito</span>
                        <strong className="text-emerald-400">$ {contrato.deposito.toLocaleString("es-CO")}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/40 border border-white/5">
                        <span className="text-[10px] text-slate-500 block">Saldo a Cobrar</span>
                        <strong className="text-sky-400">$ {contrato.total.toLocaleString("es-CO")}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs gap-2">
                      <button 
                        onClick={() => handleImprimirDocumentoPDF(contrato, contrato.estado === 'COTIZACION' ? 'COTIZACION' : 'CONTRATO')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 font-semibold border border-indigo-500/30 flex items-center space-x-1.5"
                      >
                        <Printer className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Imprimir PDF A4</span>
                      </button>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Catálogo de Bodega e Inventario</h1>
                <p className="text-xs text-slate-400">Gestión CRUD de Equipos, Carga Masiva y Control de Stock (`peso_gramos BIGINT`)</p>
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

        {/* PESTAÑA 4: DEVOLUCIONES */}
        {activeTab === "devoluciones" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Recepción de Devoluciones & Registro de Daños</h1>
                <p className="text-xs text-slate-400">Reingreso a Bodega e Inspección Física de Equipos (Corte 5:00 PM `America/Bogota`)</p>
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

        {/* PESTAÑA 5: FACTURACIÓN & PDF */}
        {activeTab === "facturacion" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Facturación, Cuentas de Cobro & PDFs</h1>
                <p className="text-xs text-slate-400">Liquidación en COP `NUMERIC(12, 2)` con 100% de renglones y fletes</p>
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
                          <strong className="text-sky-300 font-extrabold">$ {fac.totalPagar.toLocaleString("es-CO")},00</strong>
                        </div>
                        {cMatch && (
                          <button 
                            onClick={() => handleImprimirDocumentoPDF(cMatch, "CUENTA_COBRO")}
                            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-sky-400 flex items-center justify-center space-x-1.5"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Reimprimir Cuenta de Cobro PDF</span>
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

        {/* PESTAÑA 6: CLIENTES */}
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

      </main>

      {/* MODAL CREAR CONTRATO / COTIZACIÓN CON FECHAS INDIVIDUALES & CÁLCULO AUTOMÁTICO DE DÍAS */}
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
              
              {/* ENCABEZADO: CLIENTE, FECHA GENERAL Y TIPO */}
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
                        <X className="h-3.5 w-3.5" />
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

              {/* LISTA MULTI-ITEM DE EQUIPOS CON FECHAS INDIVIDUALES & CÁLCULO DE DÍAS */}
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

                        {/* SELECTORES DE FECHA INDIVIDUAL & CÁLCULO DE DÍAS */}
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
                              $ {(linea.cantidad * linea.tarifaDiaria * linea.dias).toLocaleString("es-CO")}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CAMPOS DE LOGÍSTICA: FLETES Y DETALLES DE DESPACHO */}
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
                    <span>Detalles Logísticos de Transporte (Conductor, Placa, Instrucciones)</span>
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

              {/* RESUMEN FINANCIERO INTEGRAL */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Subtotal Equipos</span>
                  <strong className="text-sm font-black text-white">$ {subtotalEquipos.toLocaleString("es-CO")}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-400 block uppercase font-bold">+ Total Fletes</span>
                  <strong className="text-sm font-black text-indigo-300">$ {totalFletes.toLocaleString("es-CO")}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 block uppercase font-bold">- Depósito</span>
                  <strong className="text-sm font-black text-emerald-400">$ {(nuevoAlquilerDeposito || 0).toLocaleString("es-CO")}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-sky-400 block uppercase font-bold">Saldo a Cobrar</span>
                  <strong className="text-base font-black text-sky-300">$ {totalContrato.toLocaleString("es-CO")}</strong>
                </div>
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
              <span className="text-xs font-bold text-slate-300 uppercase">Detalle Completo (100% de Renglones & Fletes):</span>
              <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-2xl border border-white/5 text-xs">
                {contratoParaFacturar.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-slate-300">
                    <span>{it.cantidad}x {it.nombre} ({it.dias} días: {it.fechaInicio} al {it.fechaFin})</span>
                    <span className="font-bold text-sky-300">$ {it.subtotal.toLocaleString("es-CO")},00</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5"><span className="text-[10px] text-slate-500 block">Subtotal General</span><strong>$ {contratoParaFacturar.subtotalGeneral.toLocaleString("es-CO")}</strong></div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5"><span className="text-[10px] text-slate-500 block">Depósito</span><strong className="text-emerald-400">- $ {contratoParaFacturar.deposito.toLocaleString("es-CO")}</strong></div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5"><span className="text-[10px] text-slate-500 block">Total a Pagar</span><strong className="text-sky-400">$ {contratoParaFacturar.total.toLocaleString("es-CO")}</strong></div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
              <button type="button" onClick={() => setShowFacturaModal(false)} className="px-4 py-2 bg-slate-900 text-xs font-bold rounded-xl">Cerrar</button>
              <button onClick={handleEmitirFactura} className="glass-button-primary px-5 py-2 text-xs font-bold text-white rounded-xl flex items-center space-x-2">
                <Printer className="h-4 w-4" />
                <span>Emitir Cuenta de Cobro & Imprimir PDF</span>
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
                  {selectedContratoDetalle.estado === 'COTIZACION' ? `COT-${selectedContratoDetalle.consecutivo}` : `ALQ-${selectedContratoDetalle.consecutivo}`}
                </span>
                <h2 className="text-lg font-black text-white mt-1">{selectedContratoDetalle.clienteNombre}</h2>
              </div>
              <button onClick={() => setSelectedContratoDetalle(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase">Equipos en este Documento:</span>
              <div className="space-y-2">
                {selectedContratoDetalle.items.map((it, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-white block">{it.cantidad}x {it.nombre}</strong>
                      <span className="text-slate-400">{it.dias} días ({it.fechaInicio} al {it.fechaFin}) a $ {it.tarifaDiaria.toLocaleString("es-CO")}/día</span>
                    </div>
                    <span className="font-extrabold text-sky-300">$ {it.subtotal.toLocaleString("es-CO")},00</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <button 
                onClick={() => handleImprimirDocumentoPDF(selectedContratoDetalle, selectedContratoDetalle.estado === 'COTIZACION' ? 'COTIZACION' : 'CONTRATO')}
                className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 text-xs font-bold flex items-center space-x-1.5"
              >
                <Printer className="h-4 w-4 text-indigo-400" />
                <span>Imprimir PDF A4 Oficial</span>
              </button>
              <button 
                onClick={() => {
                  const c = selectedContratoDetalle;
                  setSelectedContratoDetalle(null);
                  handleOpenFacturacion(c);
                }}
                className="glass-button-primary px-5 py-2 rounded-xl text-xs font-bold text-white"
              >
                Liquidar / Facturar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
