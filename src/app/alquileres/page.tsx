"use client";
import { Plus, Search, MoreVertical, FileSpreadsheet, FileText, ArrowRightCircle, Sparkles, Printer, CheckCircle } from "lucide-react";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAlquilerStore } from '../../infrastructure/state/alquilerStore';
import { useClienteStore } from '../../infrastructure/state/clienteStore';
import { useBodegaStore } from '../../infrastructure/state/bodegaStore';
import { useEmpresaStore } from '../../infrastructure/state/empresaStore';
import dynamic from 'next/dynamic';
import { Modal } from '../../components/ui/Modal';
import { ModalSkeleton } from '../../components/ui/ModalSkeleton';
import { useDirtyFormGuard } from '../../hooks/useDirtyFormGuard';
import { DiscardChangesModal } from '../../components/ui/DiscardChangesModal';
import { obtenerCotizacionesAction, convertirCotizacionAContratoAction } from '../actions/cotizaciones';
import { CrearCotizacionModal } from '../components/cotizaciones/CrearCotizacionModal';
import { VisorDocumentoPDFModal } from '../components/pdf/VisorDocumentoPDFModal';
import { DocumentoPDFPayload } from '../../core/services/pdf-factura-generator.service';

const AlquilerForm = dynamic(
  () => import('../../components/forms/AlquilerForm').then((m) => m.AlquilerForm),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando formulario de contrato..." /> }
);

const RegistrarDevolucionModal = dynamic(
  () => import('../components/devoluciones/RegistrarDevolucionModal').then((m) => m.RegistrarDevolucionModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando módulo de devoluciones..." /> }
);

const HistorialDevolucionesModal = dynamic(
  () => import('../components/devoluciones/HistorialDevolucionesModal').then((m) => m.HistorialDevolucionesModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando historial de devoluciones..." /> }
);

const RegistrarPagoModal = dynamic(
  () => import('../components/cartera/RegistrarPagoModal').then((m) => m.RegistrarPagoModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando liquidación y pagos..." /> }
);

const HistorialPagosModal = dynamic(
  () => import('../components/cartera/HistorialPagosModal').then((m) => m.HistorialPagosModal),
  { ssr: false, loading: () => <ModalSkeleton message="Consultando historial de pagos..." /> }
);

const DetalleAlquilerModal = dynamic(
  () => import('../components/alquileres/DetalleAlquilerModal').then((m) => m.DetalleAlquilerModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando detalle 360°..." /> }
);

const TicketAlquilerModal = dynamic(
  () => import('../components/alquileres/TicketAlquilerModal').then((m) => m.TicketAlquilerModal),
  { ssr: false, loading: () => <ModalSkeleton message="Preparando ticket de alquiler..." /> }
);

const AprobarCotizacionModal = dynamic(
  () => import('../components/alquileres/AprobarCotizacionModal').then((m) => m.AprobarCotizacionModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando aprobación de cotización..." /> }
);

const RegistrarAbonoModal = dynamic(
  () => import('../components/cartera/RegistrarAbonoModal').then((m) => m.RegistrarAbonoModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando registro de abono..." /> }
);

import { AlquilerUI } from '../../infrastructure/state/alquilerStore';
import { AlquilerEntity } from '../../core/domain/entities/alquiler';
import { alquilerUIToAlquilerEntity, alquilerEntityToAlquilerUI, equipoToEquipoUI } from '../../lib/mappers';

import { AutoTourTrigger } from '../../components/ui/AutoTourTrigger';
import { InteractiveTour } from '../../components/ui/InteractiveTour';
import { ALQUILERES_STEPS } from '../../config/tours/TourConfigs';

import { registrarPagoAction } from '../actions/pagos';
import { procesarDevolucionAction, aprobarCotizacionAction, registrarAbonoAction } from '../actions/alquileres';
import { EnterprisePDFService } from '../../core/services/pdf-factura-generator.service';

export default function AlquileresPage() {
  const { alquileres, setAlquileres, updateAlquiler, sanitizeStore } = useAlquilerStore();
  const { config: empresaConfig } = useEmpresaStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [selectedAlquilerForDetalle, setSelectedAlquilerForDetalle] = useState<any | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Integración de Salvaguarda de Modales
  const [isFormDirty, setIsFormDirty] = useState(false);
  const { attemptAction, showDiscardModal, confirmDiscard, cancelDiscard } = useDirtyFormGuard(isFormDirty);

  // Estados para Modales
  const [showDevolucionModal, setShowDevolucionModal] = useState<boolean>(false);
  const [showHistorialDevolucionesModal, setShowHistorialDevolucionesModal] = useState<boolean>(false);
  const [showPagoModal, setShowPagoModal] = useState<boolean>(false);
  const [showAbonoModal, setShowAbonoModal] = useState<boolean>(false);
  const [showAprobarCotizacionModal, setShowAprobarCotizacionModal] = useState<boolean>(false);
  const [showHistorialPagosModal, setShowHistorialPagosModal] = useState<boolean>(false);
  const [contratoActivo, setContratoActivo] = useState<any | null>(null);
  const [ticketReciente, setTicketReciente] = useState<any | null>(null);

  // Estados de Devoluciones y Pagos Mock (en el futuro deben ir en Zustand)
  const [devolucionesGlobal, setDevolucionesGlobal] = useState<any[]>([]);
  const [pagosGlobal, setPagosGlobal] = useState<any[]>([]);

  // Estados del Flujo Integrado de Cotizaciones y Visor PDF
  const [cotizacionesList, setCotizacionesList] = useState<any[]>([]);
  const [showCrearCotizacionModal, setShowCrearCotizacionModal] = useState<boolean>(false);
  const [documentoParaPDF, setDocumentoParaPDF] = useState<DocumentoPDFPayload | null>(null);
  const [convertiendoCotizacionId, setConvertiendoCotizacionId] = useState<string | null>(null);

  // Ordenamiento Descendente por ID y Filtro
  const alquileresFiltrados = useMemo(() => {
    let filtrados = alquileres.filter(a => {
      if (filtroEstado === 'Todos') return true;
      if (filtroEstado === 'Contratos Activos') return a.estado === 'ACTIVO';
      if (filtroEstado === 'Cotizaciones') return false; // Se muestran en su propia vista integrada
      if (filtroEstado === 'Finalizados') return a.estado === 'FINALIZADO';
      return true;
    });

    return filtrados.sort((a, b) => {
      const strA = String(a.id || "");
      const strB = String(b.id || "");
      const numA = parseInt(strA.replace(/\D/g, "") || "0", 10) || a.consecutivo || 0;
      const numB = parseInt(strB.replace(/\D/g, "") || "0", 10) || b.consecutivo || 0;
      if (numA !== numB) return numB - numA;
      return strB.localeCompare(strA, undefined, { numeric: true });
    });
  }, [alquileres, filtroEstado]);

  const toggleDropdown = (id: string) => {
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(id);
    }
  };

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor);
  };

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [alqResult, cliResult, eqResult, cotResult] = await Promise.allSettled([
        fetch('/api/alquileres', { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
        fetch('/api/clientes', { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
        fetch('/api/equipos', { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
        obtenerCotizacionesAction()
      ]);

      if (alqResult.status === 'fulfilled' && alqResult.value?.success && Array.isArray(alqResult.value.data)) {
        setAlquileres(alqResult.value.data.map(alquilerEntityToAlquilerUI));
      }
      if (cliResult.status === 'fulfilled' && cliResult.value?.success && Array.isArray(cliResult.value.data)) {
        useClienteStore.getState().setClientes(cliResult.value.data);
      }
      if (eqResult.status === 'fulfilled' && eqResult.value?.success && Array.isArray(eqResult.value.data)) {
        useBodegaStore.getState().setEquipos(eqResult.value.data.map(equipoToEquipoUI));
      }
      if (cotResult.status === 'fulfilled' && cotResult.value?.success && Array.isArray(cotResult.value.data)) {
        setCotizacionesList(cotResult.value.data);
      }
    } catch (e) {
      console.warn('[AlquileresPage] Error cargando catálogos desde DB:', e);
    } finally {
      setLoading(false);
    }
  }, [setAlquileres]);

  const handleConvertirCotizacion = async (cotizacionId: string) => {
    if (!confirm('¿Desea convertir esta cotización en un Contrato de Alquiler activo? Se verificará el stock disponible en bodega y se creará el contrato inmediatamente.')) {
      return;
    }

    setConvertiendoCotizacionId(cotizacionId);
    try {
      const res = await convertirCotizacionAContratoAction({ cotizacionId });
      if (!res.success) {
        alert(`No se pudo convertir la cotización:\n\n${res.error}`);
        return;
      }

      await fetchAllData();
      alert(`¡Cotización convertida con éxito!\n\nSe ha generado el Contrato ALQ-${res.data?.consecutivo || res.data?.alquilerId} y se ha descontado el stock de bodega.`);
      setFiltroEstado('Contratos Activos');
    } catch (err: any) {
      console.error('Error al convertir cotización:', err);
      alert('Ocurrió un error inesperado al convertir la cotización.');
    } finally {
      setConvertiendoCotizacionId(null);
    }
  };

  const handleVerPDFCotizacion = (cot: any) => {
    const payload: DocumentoPDFPayload = {
      tipo: 'COTIZACION',
      consecutivo: cot.consecutivo,
      fechaEmision: cot.fecha_emision || cot.created_at || new Date().toISOString(),
      fechaVencimiento: cot.fecha_vencimiento,
      clienteNombre: cot.cliente_nombre || 'Cliente',
      clienteNit: cot.cliente_documento || 'Sin NIT',
      clienteTelefono: cot.cliente_telefono || '',
      clienteEmail: cot.cliente_email || '',
      obraNombre: cot.obra_nombre || '',
      obraDireccion: cot.obra_direccion || '',
      items: (cot.cotizaciones_detalles || []).map((d: any) => ({
        cantidad: d.cantidad,
        nombre: d.equipos?.nombre || 'Equipo',
        codigo: d.equipos?.codigo || '',
        fechaInicio: cot.fecha_emision || new Date().toISOString(),
        fechaFin: new Date(Date.now() + (d.dias || 1) * 24 * 60 * 60 * 1000).toISOString(),
        dias: d.dias || 1,
        tarifaDiaria: Number(d.tarifa_diaria || 0),
        subtotal: Number(d.subtotal || 0),
      })),
      subtotalEquipos: Number(cot.subtotal || 0),
      fleteEntrega: Number(cot.valor_transporte || 0),
      fleteRecogida: 0,
      subtotalGeneral: Number(cot.subtotal || 0) + Number(cot.valor_transporte || 0),
      aplicaIva: cot.aplica_iva,
      tasaIva: Number(cot.tasa_iva || 19),
      valorIva: Number(cot.valor_iva || 0),
      aplicaRetefuente: cot.aplica_retefuente,
      tasaRetefuente: Number(cot.tasa_retefuente || 2.5),
      valorRetefuente: Number(cot.valor_retefuente || 0),
      aplicaReteica: cot.aplica_reteica,
      tasaReteica: Number(cot.tasa_reteica || 0.966),
      valorReteica: Number(cot.valor_reteica || 0),
      depositoAplicado: Number(cot.deposito_garantia || 0),
      totalPagar: Number(cot.total || 0),
      observaciones: cot.observaciones || '',
      empresa: empresaConfig,
    };

    setDocumentoParaPDF(payload);
  };

  useEffect(() => {
    setIsMounted(true);
    sanitizeStore();
    fetchAllData();

    const handleReconcile = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchAllData();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleReconcile);
      window.addEventListener('focus', handleReconcile);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleReconcile);
        window.removeEventListener('focus', handleReconcile);
      }
    };
  }, [sanitizeStore, fetchAllData]);

  // Handlers para Acciones
  const handleRegistrarPago = async (monto: number, metodo: string, referencia: string, efectivoRecibido?: number, cambioEntregado?: number) => {
    if (!contratoActivo) return;

    try {
      const res = await registrarPagoAction({
        alquilerId: contratoActivo.id,
        clienteId: contratoActivo.cliente_id,
        monto,
        metodoPago: metodo,
        referencia,
        efectivo_recibido: efectivoRecibido,
        cambio_entregado: cambioEntregado
      });

      if (!res.success) {
        alert(`Error al registrar abono: ${res.error}`);
        return;
      }

      await fetchAllData();
      setShowPagoModal(false);
      
      if (metodo === 'EFECTIVO' && cambioEntregado !== undefined && cambioEntregado > 0) {
        alert(`Abono registrado correctamente.\n\n[POKA-YOKE] Entregar cambio (Vueltas): $${cambioEntregado.toLocaleString()}`);
      } else {
        alert("Abono registrado y sincronizado en base de datos correctamente.");
      }
    } catch (error: any) {
      console.error('Error al registrar pago:', error);
      alert('Ocurrió un error inesperado al registrar el pago.');
    }
  };

  const handleRegistrarAbono = async (alquilerId: string, monto: number, metodo: string, referencia: string) => {
    try {
      const res = await registrarAbonoAction({
        alquilerId,
        montoAbono: monto,
        metodoPago: metodo,
        referencia
      });

      if (!res.success) {
        alert(`Error al registrar abono: ${res.error}`);
        return;
      }

      await fetchAllData();
      setShowAbonoModal(false);
      alert("Abono registrado correctamente.");
    } catch (error: any) {
      console.error('Error al registrar abono:', error);
      alert('Ocurrió un error inesperado al registrar el abono.');
    }
  };

  const handleAprobarCotizacion = async (alquilerId: string, ajustes: any) => {
    // Si necesitas aplicar los ajustes (fleteEntrega, etc.) podrías hacer un update antes o junto con la aprobación.
    // Por simplicidad para el alcance, llamaremos a la aprobación directamente.
    try {
      const res = await aprobarCotizacionAction({ alquilerId });
      
      if (!res.success) {
        alert(`No se pudo aprobar la cotización: ${res.error}`);
        return;
      }

      await fetchAllData();
      setShowAprobarCotizacionModal(false);
      alert("Cotización aprobada y stock reservado correctamente.");
    } catch (error: any) {
      console.error('Error al aprobar cotización:', error);
      alert('Ocurrió un error inesperado al aprobar la cotización.');
    }
  };

  const handleConfirmarDevolucion = async (
    cantidades: { [equipoId: string]: number },
    danos: { [equipoId: string]: number },
    pagoDanos: { monto: number; metodo: string; referencia: string } | null
  ) => {
    if (!contratoActivo) return;

    const original = alquileres.find(a => a.id === contratoActivo.id);
    if (!original) return;

    try {
      // Si hay devolución en backend, procesar vía RPC
      const devolucionesPayload: any[] = [];
      const detallesList = original.detalles || [];

      Object.keys(cantidades).forEach(equipoId => {
        const cantDev = cantidades[equipoId] || 0;
        const costoDano = danos[equipoId] || 0;
        const det = detallesList.find((d: any) => String(d.equipo_id || d.itemId || d.id) === String(equipoId) || String(d.id) === String(equipoId));
        
        if (cantDev > 0 || costoDano > 0) {
          devolucionesPayload.push({
            detalleId: det ? det.id : equipoId,
            cantidadDevuelta: cantDev,
            costoDano: costoDano
          });
        }
      });

      if (devolucionesPayload.length > 0) {
        const res = await procesarDevolucionAction({
          alquilerId: contratoActivo.id,
          devoluciones: devolucionesPayload
        });

        if (!res.success) {
          alert(`Error al procesar devolución en BD: ${res.error}`);
          return;
        }
      }

      // Si hay pago de daños asociado, registrar el recaudo correspondiente
      if (pagoDanos && pagoDanos.monto > 0) {
        await registrarPagoAction({
          alquilerId: contratoActivo.id,
          clienteId: contratoActivo.cliente_id,
          monto: pagoDanos.monto,
          metodoPago: pagoDanos.metodo,
          referencia: `Daños: ${pagoDanos.referencia || 'Cobro por daños en devolución'}`
        });
      }

      await fetchAllData();
      setShowDevolucionModal(false);
      alert("Devolución procesada y stock restituido correctamente.");
    } catch (error: any) {
      console.error('Error al procesar devolución:', error);
      alert('Ocurrió un error inesperado al procesar la devolución.');
    }
  };


  const openAction = (contrato: AlquilerUI, action: string) => {
    // Adapter para compatibilidad temporal con modals y formularios
    const adapter = {
      ...contrato,
      cliente_id: contrato.cliente_id || (contrato as any).clienteId,
      clienteNombre: contrato.clienteNombre || (contrato as any).cliente?.nombre,
      clienteNit: (contrato as any).clienteNit || (contrato as any).clienteDocumento || (contrato as any).cliente?.nit || (contrato as any).cliente?.nit_cedula,
      clienteTelefono: (contrato as any).clienteTelefono || (contrato as any).cliente?.telefono,
      total: contrato.total, 
      items: contrato.detalles?.map((d: any) => ({
        ...d,
        equipoId: d.itemId,
        nombre: d.nombreItem || "Item"
      })) || []
    };
    
    setContratoActivo(adapter);
    setActiveDropdown(null);

    switch(action) {
      case 'EDITAR': {
        const tieneDev = Boolean(contrato.detalles?.some((d: any) => d.devuelto || (d.cantidadDevuelta && d.cantidadDevuelta > 0)));
        if (contrato.estado === 'FINALIZADO' || contrato.estado === 'CANCELADO' || tieneDev) {
          alert("Este contrato no puede ser editado porque se encuentra finalizado, cancelado o cuenta con devoluciones registradas.");
          return;
        }
        setIsModalOpen(true);
        break;
      }
      case 'APROBAR_COTIZACION': setShowAprobarCotizacionModal(true); break;
      case 'ABONO': setShowAbonoModal(true); break;
      case 'PAGO': setShowPagoModal(true); break;
      case 'HISTORIAL_PAGOS': setShowHistorialPagosModal(true); break;
      case 'DEVOLUCION': setShowDevolucionModal(true); break;
      case 'HISTORIAL_DEVOLUCIONES': setShowHistorialDevolucionesModal(true); break;
      case 'PDF': handleGenerarPDF(contrato); break;
    }
  };

  const handleGenerarPDF = async (contrato: any) => {
    try {
      const payload: any = {
        tipo: contrato.estado === 'COTIZACION' ? 'COTIZACION' : (contrato.estado === 'FINALIZADO' ? 'CUENTA_COBRO' : 'CONTRATO'),
        consecutivo: contrato.consecutivo || parseInt(String(contrato.id || "").replace(/\D/g, '') || "0") || Date.now() % 10000,
        fechaEmision: new Date().toISOString(),
        fechaInicioGeneral: new Date(contrato.createdAt || contrato.created_at || Date.now()).toISOString(),
        clienteNombre: contrato.clienteNombre || (contrato as any).cliente?.nombre || "Cliente General",
        clienteNit: contrato.clienteNit || contrato.clienteDocumento || (contrato as any).cliente?.nit || (contrato as any).cliente?.nit_cedula || "222222222",
        clienteTelefono: contrato.clienteTelefono || (contrato as any).cliente?.telefono || "",
        items: (contrato.detalles || []).map((d: any) => {
          const fInicio = new Date(d.fechaInicio || d.fecha_inicio || contrato.createdAt || contrato.created_at || Date.now()).getTime();
          const fFin = new Date(d.fechaFinEstimada || d.fecha_fin_estimada || d.fechaFin || contrato.createdAt || contrato.created_at || Date.now()).getTime();
          const dias = Math.max(1, Math.ceil((fFin - fInicio) / 86400000));
          const tarifaDiaria = d.tarifaAplicada || d.valor_unitario || d.tarifaDiaria || 0;
          const equipoReal = useBodegaStore.getState().equipos.find(e => String(e.id) === String(d.itemId || d.equipo_id));
          return {
            cantidad: d.cantidad || 1,
            nombre: equipoReal?.nombre || d.nombreItem || d.nombre || "Equipo",
            fechaInicio: new Date(fInicio).toISOString(),
            fechaFin: new Date(fFin).toISOString(),
            dias: dias,
            tarifaDiaria: tarifaDiaria,
            subtotal: d.subtotalLineaReal || d.subtotalLineaEstimado || (tarifaDiaria * dias * (d.cantidad || 1)) || 0,
          };
        }),
        subtotalEquipos: contrato.subtotalEquiposEstimado || contrato.subtotal_equipos || contrato.subtotalEquipos || 0,
        fleteEntrega: contrato.flete_entrega || contrato.fleteEntrega || contrato.costoEnvio || 0,
        fleteRecogida: contrato.flete_recogida || contrato.fleteRecogida || contrato.costoRecoleccion || 0,
        subtotalGeneral: contrato.subtotalGeneralEstimado || contrato.total_general || contrato.subtotalGeneral || 0,
        costosDano: (contrato.detalles || []).reduce((acc: number, d: any) => acc + (d.costoDano || 0), 0),
        depositoAplicado: contrato.deposito || contrato.totalPagado || 0,
        totalPagar: contrato.total || contrato.totalEstimado || 0,
        observaciones: contrato.observaciones || contrato.observacionesGenerales || "",
        detallesLogistica: contrato.detalles_logistica || contrato.detallesLogistica || "",
        empresa: empresaConfig,
      };

      const htmlContent = EnterprisePDFService.generarHTMLDocumento(payload);
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        alert("Por favor habilita las ventanas emergentes para ver el PDF.");
      }
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar el documento");
    }
  };

  if (!isMounted) {
    return <div className="p-8 text-center text-slate-500">Cargando alquileres...</div>;
  }

  return (
    <div className="flex flex-col gap-8 h-full" onClick={() => setActiveDropdown(null)}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900 mb-1">Contratos de Alquiler</h2>
          <p className="text-base text-slate-600">Gestiona y supervisa los alquileres de maquinaria y equipos.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => setShowCrearCotizacionModal(true)}
            className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs w-full sm:w-auto"
            aria-label="Crear nueva cotización de obra"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Nueva Cotización
          </button>
          <button 
            type="button"
            id="tour-nuevo-alquiler"
            onClick={() => { setContratoActivo(null); setIsModalOpen(true); }}
            className="bg-brand-salmonLight text-brand-salmonDark hover:bg-brand-salmon hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
            aria-label="Crear nuevo contrato de alquiler"
          >
            <Plus className="w-5 h-5" />
            Nuevo Contrato
          </button>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden flex flex-col h-full">
        <div id="tour-filtros-alquileres" className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setFiltroEstado('Todos')}
              aria-pressed={filtroEstado === 'Todos'}
              className={`px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition-colors ${filtroEstado === 'Todos' ? 'bg-white text-slate-900 border-slate-200' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100'}`}
            >Todos</button>
            <button 
              type="button"
              onClick={() => setFiltroEstado('Contratos Activos')}
              aria-pressed={filtroEstado === 'Contratos Activos'}
              className={`px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition-colors ${filtroEstado === 'Contratos Activos' ? 'bg-white text-slate-900 border-slate-200' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100'}`}
            >Contratos Activos</button>
            <button 
              type="button"
              onClick={() => setFiltroEstado('Cotizaciones')}
              aria-pressed={filtroEstado === 'Cotizaciones'}
              className={`px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition-colors ${filtroEstado === 'Cotizaciones' ? 'bg-white text-slate-900 border-slate-200' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100'}`}
            >Cotizaciones</button>
            <button 
              type="button"
              onClick={() => setFiltroEstado('Finalizados')}
              aria-pressed={filtroEstado === 'Finalizados'}
              className={`px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition-colors ${filtroEstado === 'Finalizados' ? 'bg-white text-slate-900 border-slate-200' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100'}`}
            >Finalizados</button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-salmon focus:ring-1 focus:ring-brand-salmon transition-all" 
              placeholder="Buscar contrato..." 
              type="text"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto min-h-[400px]">
          {filtroEstado === 'Cotizaciones' ? (
            /* TABLA ESPECIALIZADA DE COTIZACIONES */
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-xs text-slate-700 font-semibold shadow-2xs">
                <tr>
                  <th className="py-3 px-4">Consecutivo</th>
                  <th className="py-3 px-4">Cliente / Obra</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4">Impuestos</th>
                  <th className="py-3 px-4 text-right">Total Cotizado</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-xs">
                {cotizacionesList.map((cot: any) => {
                  const tieneIva = Boolean(cot.aplica_iva && cot.valor_iva > 0);
                  const tieneRetefuente = Boolean(cot.aplica_retefuente && cot.valor_retefuente > 0);
                  const tieneReteica = Boolean(cot.aplica_reteica && cot.valor_reteica > 0);
                  const isConvertida = cot.estado === 'CONVERTIDA';
                  const isProcessing = convertiendoCotizacionId === cot.id;

                  return (
                    <tr key={cot.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                          {cot.consecutivo}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{cot.cliente_nombre}</div>
                        {cot.obra_nombre && (
                          <div className="text-[11px] text-slate-500 font-medium">Obra: {cot.obra_nombre}</div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          {cot.cotizaciones_detalles?.length || 0} equipo(s) cotizado(s)
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(cot.fecha_emision || cot.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                        {formatearMoneda(cot.subtotal || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {tieneIva && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-800 text-[10px] font-bold">
                              IVA 19%
                            </span>
                          )}
                          {tieneRetefuente && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-800 text-[10px] font-bold">
                              ReteFuente
                            </span>
                          )}
                          {tieneReteica && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800 text-[10px] font-bold">
                              ReteICA
                            </span>
                          )}
                          {!tieneIva && !tieneRetefuente && !tieneReteica && (
                            <span className="text-[11px] text-slate-400">Sin impuestos</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatearMoneda(cot.total || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          cot.estado === 'CONVERTIDA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cot.estado === 'APROBADA'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {cot.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleVerPDFCotizacion(cot)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                            title="Ver e Imprimir PDF"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-600" />
                            <span>PDF</span>
                          </button>

                          {!isConvertida ? (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleConvertirCotizacion(cot.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                              title="Formalizar y convertir en contrato de alquiler activo"
                            >
                              {isProcessing ? (
                                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                              ) : (
                                <ArrowRightCircle className="w-3.5 h-3.5" />
                              )}
                              <span>Convertir a Contrato</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <CheckCircle className="w-3 h-3" />
                              <span>Contrato ALQ-{cot.alquiler_id}</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {cotizacionesList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="font-semibold text-slate-700">No hay cotizaciones registradas aún.</p>
                      <p className="text-xs text-slate-400 mt-1">Crea una cotización de obra con impuestos discriminados para empezar.</p>
                      <button
                        type="button"
                        onClick={() => setShowCrearCotizacionModal(true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                      >
                        <Plus className="w-4 h-4" />
                        Crear Primera Cotización
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* TABLA HABITUAL DE CONTRATOS */
            <table className="w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                <tr>
                  <th className="py-3 px-4 text-sm text-slate-600 font-semibold">ID</th>
                  <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Cliente</th>
                  <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Fecha Inicio</th>
                  <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Total Estimado</th>
                  <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Equipos</th>
                  <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Estado</th>
                  <th className="py-3 px-4 text-sm text-slate-600 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {alquileresFiltrados.map((alq: any) => (
                  <tr 
                    key={alq.id} 
                    onClick={() => {
                      setSelectedAlquilerForDetalle(alq);
                      setShowDetalleModal(true);
                    }}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer relative"
                  >
                    <td className="py-3 px-4 text-sm text-slate-900 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 group-hover:bg-slate-200 px-2 py-0.5 rounded transition-colors">
                          #{alq.id}
                        </span>
                        {alq.cotizacion_origen_id && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-200" title="Generado desde cotización de obra">
                            COT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900 font-semibold group-hover:text-brand-salmon transition-colors">
                      {alq.clienteNombre || 'Sin Nombre'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{new Date(alq.created_at || Date.now()).toLocaleDateString('es-CO')}</td>
                    <td className="py-3 px-4 text-sm font-bold text-slate-800">{formatearMoneda(alq.total || 0)}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-1 bg-slate-100 rounded text-[11px] font-medium text-slate-600">
                          {alq.detalles?.length || 0} Equipo(s)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                        alq.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700' :
                        alq.estado === 'COTIZACION' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {alq.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right relative">
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleDropdown(alq.id!); }}
                        className="text-slate-400 hover:text-brand-salmon transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                        title="Menú de acciones"
                        aria-label={`Opciones y acciones para contrato #${alq.id}`}
                        aria-haspopup="true"
                        aria-expanded={activeDropdown === alq.id}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {activeDropdown === alq.id && (() => {
                        const tieneDevoluciones = Boolean(alq.detalles?.some((d: any) => d.devuelto || (d.cantidadDevuelta && d.cantidadDevuelta > 0)));
                        const puedeEditar = (alq.estado === 'COTIZACION' || alq.estado === 'ACTIVO') && !tieneDevoluciones;
                        return (
                          <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1.5 flex flex-col text-left">
                            {alq.estado === 'COTIZACION' && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'APROBAR_COTIZACION'); }} className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-brand-salmonLight hover:text-brand-salmonDark text-left w-full">Aprobar Cotización</button>
                            )}
                            {puedeEditar && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'EDITAR'); }} className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-brand-salmonLight hover:text-brand-salmonDark text-left w-full">Editar Contrato</button>
                            )}
                            <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'PDF'); }} className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-brand-salmonLight hover:text-brand-salmonDark text-left w-full border-b border-slate-100">Generar PDF</button>
                            
                            <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'ABONO'); }} className="px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 text-left w-full">Registrar Abono</button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'HISTORIAL_PAGOS'); }} className="px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 text-left w-full border-b border-slate-100">Historial Pagos</button>
                            
                            <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'DEVOLUCION'); }} className="px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 text-left w-full">Recibir Equipos</button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'HISTORIAL_DEVOLUCIONES'); }} className="px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 text-left w-full border-b border-slate-100">Historial Devoluciones</button>
                            
                            {alq.estado !== 'FINALIZADO' && alq.estado !== 'CANCELADO' && (
                               <button type="button" className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left w-full">Cancelar Contrato</button>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
                {alquileresFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No hay contratos de alquiler para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => attemptAction(() => { setIsModalOpen(false); setContratoActivo(null); setIsFormDirty(false); })}
        title={contratoActivo ? "Editar Contrato de Alquiler" : "Registrar Nuevo Contrato de Alquiler"}
        maxWidth="4xl"
      >
        <AlquilerForm 
          key={contratoActivo ? `edit_${contratoActivo.id}` : 'create_new'}
          initialData={contratoActivo}
          onSuccess={(alquiler?: any) => { 
            setIsFormDirty(false);
            setIsModalOpen(false);
            fetchAllData(); 
            if (alquiler && !contratoActivo) {
              setTicketReciente(alquiler);
            } else {
              setContratoActivo(null); 
            }
          }} 
          onCancel={() => attemptAction(() => { setIsModalOpen(false); setContratoActivo(null); setIsFormDirty(false); })} 
          onDirtyChange={setIsFormDirty}
        />
      </Modal>

      <DiscardChangesModal
        isOpen={showDiscardModal}
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />

      <TicketAlquilerModal
        isOpen={ticketReciente !== null}
        alquiler={ticketReciente}
        empresa={empresaConfig}
        onClose={() => setTicketReciente(null)}
        onNuevoAlquiler={() => {
          setTicketReciente(null);
          setContratoActivo(null);
          setIsModalOpen(true);
        }}
      />

      {/* Modal Resumen 360° */}
      <DetalleAlquilerModal
        isOpen={showDetalleModal}
        onClose={() => {
          setShowDetalleModal(false);
          setSelectedAlquilerForDetalle(null);
        }}
        alquiler={selectedAlquilerForDetalle}
        onEdit={(alq) => {
          setShowDetalleModal(false);
          openAction(alq, 'EDITAR');
        }}
      />

      <AprobarCotizacionModal
        isOpen={showAprobarCotizacionModal}
        onClose={() => setShowAprobarCotizacionModal(false)}
        cotizacion={contratoActivo}
        onConfirmarAprobacion={handleAprobarCotizacion}
      />
      <RegistrarAbonoModal
        isOpen={showAbonoModal}
        onClose={() => setShowAbonoModal(false)}
        contrato={contratoActivo}
        onConfirmar={handleRegistrarAbono}
      />
      <RegistrarPagoModal
        isOpen={showPagoModal}
        onClose={() => setShowPagoModal(false)}
        contratoParaPago={contratoActivo}
        onConfirmarPago={handleRegistrarPago}
      />
      <HistorialPagosModal
        isOpen={showHistorialPagosModal}
        onClose={() => setShowHistorialPagosModal(false)}
        contratoParaPago={contratoActivo}
        pagosFiltrados={pagosGlobal.filter(p => p.alquilerId === contratoActivo?.id)}
      />
      <RegistrarDevolucionModal
        isOpen={showDevolucionModal}
        onClose={() => setShowDevolucionModal(false)}
        contratoParaDevolucion={contratoActivo}
        onConfirmarDevolucion={handleConfirmarDevolucion}
      />
      <HistorialDevolucionesModal
        isOpen={showHistorialDevolucionesModal}
        onClose={() => setShowHistorialDevolucionesModal(false)}
        contratoParaDevolucion={contratoActivo}
        devoluciones={devolucionesGlobal.filter(d => d.alquilerId === contratoActivo?.id)}
      />

      <CrearCotizacionModal
        isOpen={showCrearCotizacionModal}
        onClose={() => setShowCrearCotizacionModal(false)}
        onCotizacionCreada={(nuevaCot) => {
          fetchAllData();
          setFiltroEstado('Cotizaciones');
          if (nuevaCot) {
            handleVerPDFCotizacion(nuevaCot);
          }
        }}
      />

      {documentoParaPDF && (
        <VisorDocumentoPDFModal
          isOpen={true}
          onClose={() => setDocumentoParaPDF(null)}
          documento={documentoParaPDF}
        />
      )}

      {/* Tour Módulo Alquileres */}
      <AutoTourTrigger tourId="alquileres-core" delay={1000} forceMode={true} />
      <InteractiveTour tourId="alquileres-core" steps={ALQUILERES_STEPS} />
    </div>
  );
}
