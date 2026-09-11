"use client";
import { Plus, Search, MoreVertical, FileSpreadsheet, FileText, ArrowRightCircle, Sparkles, Printer, CheckCircle, HardHat, History, Clock, Building2, CheckCircle2 } from "lucide-react";

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

export type AlquilerTabType = 'contratos' | 'cotizaciones' | 'historial';

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
  
  // Pestañas Corporativas Superiores (Hub Centralizado de Alquileres y Cotizaciones)
  const [activeTab, setActiveTab] = useState<AlquilerTabType>('contratos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [modoCreacionInicial, setModoCreacionInicial] = useState<'CONTRATO' | 'COTIZACION'>('CONTRATO');
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

  // Sincronización de URL / Deep Linking de pestañas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'cotizaciones') setActiveTab('cotizaciones');
      else if (tabParam === 'historial') setActiveTab('historial');
      else if (tabParam === 'contratos') setActiveTab('contratos');
    }
  }, []);

  const handleTabChange = useCallback((tab: AlquilerTabType) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Consolidación de Cotizaciones (DB cotizaciones + AlquilerStore estado=COTIZACION)
  const cotizacionesConsolidadas = useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string>();

    // 1. Cotizaciones cargadas desde la tabla cotizaciones (DB)
    (cotizacionesList || []).forEach(cot => {
      const idKey = String(cot.id || cot.consecutivo);
      seenIds.add(idKey);
      if (cot.consecutivo) seenIds.add(String(cot.consecutivo));

      list.push({
        ...cot,
        id: cot.id,
        consecutivo: cot.consecutivo,
        clienteNombre: cot.cliente_nombre || 'Cliente',
        clienteNit: cot.cliente_documento || '',
        obraNombre: cot.obra_nombre || '',
        fechaEmision: cot.fecha_emision || cot.created_at,
        subtotal: Number(cot.subtotal) || 0,
        total: Number(cot.total) || 0,
        estado: cot.estado || 'COTIZACION',
        detalles: cot.cotizaciones_detalles || [],
        esDeModulo: true,
      });
    });

    // 2. Cotizaciones creadas en el motor unificado AlquilerStore
    (alquileres || []).forEach(alq => {
      if (alq.estado === 'COTIZACION' || alq.estado === 'FORMALIZADA' || alq.tipo === 'COTIZACION' || (alq as any).tipoDocumento === 'COTIZACION') {
        const idKey = String(alq.id || alq.consecutivo);
        const conKey = String(alq.consecutivo || '');
        if (!seenIds.has(idKey) && (!conKey || !seenIds.has(conKey))) {
          list.push({
            id: alq.id,
            consecutivo: alq.consecutivo || alq.id,
            cliente_id: alq.cliente_id,
            cliente_nombre: alq.clienteNombre || 'Consumidor Final',
            clienteNombre: alq.clienteNombre || 'Consumidor Final',
            cliente_documento: (alq as any).clienteNit || '',
            clienteNit: (alq as any).clienteNit || '',
            cliente_telefono: (alq as any).clienteTelefono || '',
            clienteTelefono: (alq as any).clienteTelefono || '',
            obra_nombre: alq.detallesLogistica || '',
            obraNombre: alq.detallesLogistica || '',
            fecha_emision: alq.created_at || (alq as any).createdAt,
            fechaEmision: alq.created_at || (alq as any).createdAt,
            subtotal: alq.subtotalEquipos || 0,
            total: alq.total || alq.totalEstimado || 0,
            estado: alq.estado || 'COTIZACION',
            detalles: alq.detalles || alq.items || [],
            cotizaciones_detalles: alq.detalles || alq.items || [],
            flete_entrega: alq.fleteEntrega || 0,
            flete_recogida: alq.fleteRecogida || 0,
            deposito_garantia: alq.deposito || 0,
            garantia_monto: alq.garantiaMonto || 0,
            garantia_tipo: alq.garantiaTipo || 'Efectivo',
            observaciones: alq.observaciones || '',
            esDeModulo: false,
          });
        }
      }
    });

    let filtradas = list;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtradas = filtradas.filter(c => {
        const cliente = (c.clienteNombre || c.cliente_nombre || '').toLowerCase();
        const obra = (c.obraNombre || c.obra_nombre || '').toLowerCase();
        const consecutivo = String(c.consecutivo || c.id || '').toLowerCase();
        const nit = (c.clienteNit || c.cliente_documento || '').toLowerCase();
        return cliente.includes(term) || obra.includes(term) || consecutivo.includes(term) || nit.includes(term);
      });
    }

    return filtradas.sort((a, b) => {
      const dateA = new Date(a.fechaEmision || 0).getTime();
      const dateB = new Date(b.fechaEmision || 0).getTime();
      return dateB - dateA;
    });
  }, [cotizacionesList, alquileres, searchTerm]);

  // Métricas de Cotizaciones para KPIs de visibilidad ejecutiva
  const metricasCotizaciones = useMemo(() => {
    const activas = cotizacionesConsolidadas.filter(c => c.estado !== 'CONVERTIDA' && c.estado !== 'FORMALIZADA' && c.estado !== 'CANCELADA');
    const convertidas = cotizacionesConsolidadas.filter(c => c.estado === 'CONVERTIDA' || c.estado === 'FORMALIZADA');
    const valorPipeline = activas.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
    const totalEquiposCotizados = activas.reduce((acc, c) => {
      const dets = c.cotizaciones_detalles || c.detalles || [];
      return acc + dets.reduce((s: number, d: any) => s + (Number(d.cantidad) || 1), 0);
    }, 0);

    return {
      totalActivas: activas.length,
      totalConvertidas: convertidas.length,
      valorPipeline,
      totalEquiposCotizados
    };
  }, [cotizacionesConsolidadas]);

  // Conteos en tiempo real para las pestañas
  const totalContratosActivos = useMemo(() => {
    return alquileres.filter(a => a.estado === 'ACTIVO' || (!a.estado && a.id)).length;
  }, [alquileres]);

  const totalCotizacionesActivas = useMemo(() => {
    return metricasCotizaciones.totalActivas;
  }, [metricasCotizaciones]);

  const totalHistorial = useMemo(() => {
    return alquileres.filter(a => a.estado === 'FINALIZADO' || a.estado === 'CANCELADO' || a.estado === 'LIQUIDADO').length;
  }, [alquileres]);

  // Ordenamiento Descendente por ID y Filtro por Pestaña + Búsqueda
  const alquileresFiltrados = useMemo(() => {
    let filtrados = alquileres.filter(a => {
      if (activeTab === 'contratos') {
        return a.estado === 'ACTIVO' || (!a.estado && a.id);
      }
      if (activeTab === 'historial') {
        return a.estado === 'FINALIZADO' || a.estado === 'CANCELADO' || a.estado === 'LIQUIDADO';
      }
      if (activeTab === 'cotizaciones') {
        return a.estado === 'COTIZACION';
      }
      return true;
    });

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtrados = filtrados.filter(a => {
        const cliente = (a.clienteNombre || '').toLowerCase();
        const nit = (a.clienteNit || (a as any).cliente?.nit || '').toLowerCase();
        const idStr = String(a.id || '').toLowerCase();
        const consecutivoStr = String(a.consecutivo || '').toLowerCase();
        const tieneEquipo = a.detalles?.some((d: any) => (d.nombreItem || d.nombre || '').toLowerCase().includes(term));
        return cliente.includes(term) || nit.includes(term) || idStr.includes(term) || consecutivoStr.includes(term) || tieneEquipo;
      });
    }

    return filtrados.sort((a, b) => {
      const strA = String(a.id || "");
      const strB = String(b.id || "");
      const numA = Number(parseInt(strA.replace(/\D/g, "") || "0", 10) || Number(a.consecutivo) || 0);
      const numB = Number(parseInt(strB.replace(/\D/g, "") || "0", 10) || Number(b.consecutivo) || 0);
      if (numA !== numB) return numB - numA;
      return strB.localeCompare(strA, undefined, { numeric: true });
    });
  }, [alquileres, activeTab, searchTerm]);

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

  // Formalizar cotización en 1-clic precargando el motor unificado AlquilerForm
  const handleFormalizarCotizacionEnForm = (cot: any) => {
    const rawItems = cot.cotizaciones_detalles || cot.detalles || cot.items || [];
    const itemsMapeados = rawItems.map((d: any, idx: number) => ({
      id: d.id || `item_${idx}_${Date.now()}`,
      itemId: String(d.equipo_id || d.itemId || d.equipos?.id || d.id || ''),
      cantidad: Number(d.cantidad) || 1,
      precioDiario: Number(d.tarifa_diaria || d.tarifaDiaria || d.tarifaAplicada || 0),
      fechaInicio: d.fecha_inicio || d.fechaInicio || cot.fecha_emision || new Date().toISOString().split('T')[0],
      fechaFinEstimada: d.fecha_fin_estimada || d.fechaFinEstimada || d.fechaFin || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      esSubcontratado: Boolean(d.esSubcontratado),
      proveedorAliadoNombre: d.proveedorAliadoNombre || '',
      proveedorAliadoNit: d.proveedorAliadoNit || '',
      costoSubcontrato: Number(d.costoSubcontrato) || 0,
    }));

    const adapterContrato: any = {
      id: '', // Se genera nuevo contrato ALQ formal
      tipoDocumento: 'CONTRATO',
      tipo: 'CONTRATO',
      estado: 'ACTIVO',
      cotizacionOrigen: cot.consecutivo || cot.id,
      cotizacionOrigenId: cot.id,
      cliente_id: String(cot.cliente_id || cot.clienteId || ''),
      clienteId: String(cot.cliente_id || cot.clienteId || ''),
      clienteNombre: cot.cliente_nombre || cot.clienteNombre || '',
      clienteNit: cot.cliente_documento || cot.clienteNit || '',
      clienteTelefono: cot.cliente_telefono || cot.clienteTelefono || '',
      fechaRegistro: new Date().toISOString().split('T')[0],
      fechaInicioContrato: cot.fecha_emision || new Date().toISOString().split('T')[0],
      fechaFinEstimadaContrato: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      fleteEntrega: Number(cot.valor_transporte || cot.flete_entrega || cot.fleteEntrega || 0),
      fleteRecogida: Number(cot.flete_recogida || cot.fleteRecogida || 0),
      deposito: Number(cot.deposito_garantia || cot.deposito || 0),
      garantiaMonto: Number(cot.garantia_monto || cot.garantiaMonto || 0),
      garantiaTipo: cot.garantia_tipo || cot.garantiaTipo || 'Efectivo',
      observaciones: `Formalización comercial de Cotización #${cot.consecutivo || cot.id}. ${cot.observaciones || ''}`.trim(),
      detallesLogistica: cot.obra_direccion || cot.detallesLogistica || cot.obra_nombre || '',
      items: itemsMapeados,
      detalles: itemsMapeados,
    };

    setContratoActivo(adapterContrato);
    setModoCreacionInicial('CONTRATO');
    setIsModalOpen(true);
  };

  // Editar cotización comercial en AlquilerForm
  const handleEditarCotizacionEnForm = (cot: any) => {
    const rawItems = cot.cotizaciones_detalles || cot.detalles || cot.items || [];
    const itemsMapeados = rawItems.map((d: any, idx: number) => ({
      id: d.id || `item_${idx}_${Date.now()}`,
      itemId: String(d.equipo_id || d.itemId || d.equipos?.id || d.id || ''),
      cantidad: Number(d.cantidad) || 1,
      precioDiario: Number(d.tarifa_diaria || d.tarifaDiaria || d.tarifaAplicada || 0),
      fechaInicio: d.fecha_inicio || d.fechaInicio || cot.fecha_emision || new Date().toISOString().split('T')[0],
      fechaFinEstimada: d.fecha_fin_estimada || d.fechaFinEstimada || d.fechaFin || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      esSubcontratado: Boolean(d.esSubcontratado),
      proveedorAliadoNombre: d.proveedorAliadoNombre || '',
      proveedorAliadoNit: d.proveedorAliadoNit || '',
      costoSubcontrato: Number(d.costoSubcontrato) || 0,
    }));

    const adapterCotizacion: any = {
      id: cot.id,
      consecutivo: cot.consecutivo,
      tipoDocumento: 'COTIZACION',
      tipo: 'COTIZACION',
      estado: cot.estado || 'COTIZACION',
      cliente_id: String(cot.cliente_id || cot.clienteId || ''),
      clienteId: String(cot.cliente_id || cot.clienteId || ''),
      clienteNombre: cot.cliente_nombre || cot.clienteNombre || '',
      clienteNit: cot.cliente_documento || cot.clienteNit || '',
      clienteTelefono: cot.cliente_telefono || cot.clienteTelefono || '',
      fechaRegistro: (cot.fecha_emision || cot.created_at || new Date().toISOString()).split('T')[0],
      fechaInicioContrato: (cot.fecha_emision || cot.created_at || new Date().toISOString()).split('T')[0],
      fechaFinEstimadaContrato: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      fleteEntrega: Number(cot.valor_transporte || cot.flete_entrega || cot.fleteEntrega || 0),
      fleteRecogida: Number(cot.flete_recogida || cot.fleteRecogida || 0),
      deposito: Number(cot.deposito_garantia || cot.deposito || 0),
      garantiaMonto: Number(cot.garantia_monto || cot.garantiaMonto || 0),
      garantiaTipo: cot.garantia_tipo || cot.garantiaTipo || 'Efectivo',
      observaciones: cot.observaciones || '',
      detallesLogistica: cot.obra_direccion || cot.detallesLogistica || cot.obra_nombre || '',
      items: itemsMapeados,
      detalles: itemsMapeados,
    };

    setContratoActivo(adapterCotizacion);
    setModoCreacionInicial('COTIZACION');
    setIsModalOpen(true);
  };

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
      handleTabChange('contratos');
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
      // Búsqueda proactiva del cliente real en el store local si no viene pre-cargado
      const rawClienteId = contrato.cliente_id || contrato.clienteId;
      const clienteEnStore = useClienteStore.getState().clientes.find(c => String(c.id) === String(rawClienteId));

      const clienteNombre = contrato.clienteNombre || (contrato as any).cliente?.nombre || clienteEnStore?.nombre || "Consumidor Final";
      const clienteNit = contrato.clienteNit || contrato.clienteDocumento || (contrato as any).cliente?.nit || (contrato as any).cliente?.nit_cedula || clienteEnStore?.nit_cedula || clienteEnStore?.nit || "Sin Registrar";
      const clienteTelefono = contrato.clienteTelefono || (contrato as any).cliente?.telefono || clienteEnStore?.telefono || "";
      const clienteDireccion = contrato.clienteDireccion || (contrato as any).cliente?.direccion || clienteEnStore?.direccion || "";
      const clienteEmail = contrato.clienteEmail || (contrato as any).cliente?.email || clienteEnStore?.email || "";

      const payload: any = {
        tipo: contrato.estado === 'COTIZACION' ? 'COTIZACION' : (contrato.estado === 'FINALIZADO' ? 'CUENTA_COBRO' : 'CONTRATO'),
        consecutivo: contrato.consecutivo || parseInt(String(contrato.id || "").replace(/\D/g, '') || "0") || Date.now() % 10000,
        fechaEmision: new Date().toISOString(),
        fechaInicioGeneral: new Date(contrato.createdAt || contrato.created_at || Date.now()).toISOString(),
        clienteNombre,
        clienteNit,
        clienteTelefono,
        clienteDireccion,
        clienteEmail,
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
    <div className="flex flex-col gap-6 h-full" onClick={() => setActiveDropdown(null)}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
              FerreOn ERP • Módulo Maquinaria
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {activeTab === 'contratos' && "Contratos de Alquiler en Obra"}
            {activeTab === 'cotizaciones' && "Cotizaciones Comerciales de Obra"}
            {activeTab === 'historial' && "Historial y Liquidaciones"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {activeTab === 'contratos' && "Gestiona y supervisa los alquileres activos, despachos en obra y recaudos."}
            {activeTab === 'cotizaciones' && "Elabora propuestas económicas para clientes y formalízalas a contratos vinculantes."}
            {activeTab === 'historial' && "Audita contratos cerrados, devoluciones recibidas e historial financiero consolidado."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button 
            type="button"
            id="tour-nuevo-alquiler"
            onClick={() => {
              setContratoActivo(null);
              setModoCreacionInicial(activeTab === 'cotizaciones' ? 'COTIZACION' : 'CONTRATO');
              setIsModalOpen(true);
            }}
            className="bg-teal-700 text-white hover:bg-teal-800 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm shadow-teal-700/20 w-full sm:w-auto cursor-pointer active:scale-98 hover:shadow-md"
            aria-label="Crear nuevo registro de alquiler o cotización"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>
              {activeTab === 'cotizaciones' ? 'Nueva Cotización de Obra' : 'Nuevo Alquiler / Contrato'}
            </span>
          </button>
        </div>
      </div>

      {/* Pestañas Corporativas Superiores (Hub Centralizado de Alquileres & Cotizaciones) */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-1.5">
        <button
          type="button"
          onClick={() => handleTabChange('contratos')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'contratos'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <HardHat className={`w-4 h-4 shrink-0 ${activeTab === 'contratos' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>Contratos en Obra</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums font-bold ${
            activeTab === 'contratos' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-600'
          }`}>
            {totalContratosActivos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('cotizaciones')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'cotizaciones'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <FileSpreadsheet className={`w-4 h-4 shrink-0 ${activeTab === 'cotizaciones' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Cotizaciones Activas</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums font-bold ${
            activeTab === 'cotizaciones' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-200 text-slate-600'
          }`}>
            {totalCotizacionesActivas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('historial')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'historial'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <History className={`w-4 h-4 shrink-0 ${activeTab === 'historial' ? 'text-purple-600' : 'text-slate-400'}`} />
          <span>Historial y Finalizados</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums font-bold ${
            activeTab === 'historial' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-200 text-slate-600'
          }`}>
            {totalHistorial}
          </span>
        </button>
      </div>

      {/* Controls Section & Data Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden flex flex-col h-full">
        <div id="tour-filtros-alquileres" className="p-3.5 sm:p-4 border-b border-slate-200/80 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-700">
              {activeTab === 'contratos' && `Mostrando ${alquileresFiltrados.length} contrato(s) en ejecución`}
              {activeTab === 'cotizaciones' && `Mostrando ${cotizacionesList.length} cotización(es) comercial(es)`}
              {activeTab === 'historial' && `Mostrando ${alquileresFiltrados.length} contrato(s) en histórico`}
            </span>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition-all" 
              placeholder={activeTab === 'cotizaciones' ? "Buscar por cliente, obra o cotización..." : "Buscar por cliente, equipo, # o NIT..."}
              type="text"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto min-h-[400px]">
          {activeTab === 'cotizaciones' ? (
            <div className="space-y-4 p-4">
              {/* Tarjetas KPI de Cotizaciones (Pipeline Comercial) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cotizaciones Activas</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">{metricasCotizaciones.totalActivas}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">En Propuesta</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pipeline Cotizado</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-black text-blue-700 font-mono tabular-nums">{formatearMoneda(metricasCotizaciones.valorPipeline)}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">Proyectado</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Equipos Demandados</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">{metricasCotizaciones.totalEquiposCotizados}</span>
                    <span className="text-[10px] text-slate-400">unidades</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Formalizadas a Contrato</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums">{metricasCotizaciones.totalConvertidas}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Cierres</span>
                  </div>
                </div>
              </div>

              {/* TABLA ESPECIALIZADA DE COTIZACIONES */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-xs text-slate-700 font-bold shadow-2xs">
                    <tr>
                      <th className="py-3 px-4">Consecutivo</th>
                      <th className="py-3 px-4">Cliente / Obra</th>
                      <th className="py-3 px-4">Fecha Emisión</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                      <th className="py-3 px-4 text-right">Total Cotizado</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones de Emisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-xs">
                    {cotizacionesConsolidadas.map((cot: any) => {
                      const isConvertida = cot.estado === 'CONVERTIDA' || cot.estado === 'FORMALIZADA';
                      const isProcessing = convertiendoCotizacionId === cot.id;
                      const itemsCount = cot.cotizaciones_detalles?.length || cot.detalles?.length || 0;

                      return (
                        <tr key={cot.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-medium">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                              #{cot.consecutivo || cot.id}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-sm">{cot.clienteNombre || cot.cliente_nombre}</div>
                            {cot.obraNombre && (
                              <div className="text-[11px] text-slate-500 font-medium">Obra: {cot.obraNombre}</div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {itemsCount} equipo(s) en cotización
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {new Date(cot.fechaEmision || cot.fecha_emision || cot.created_at).toLocaleDateString('es-CO')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                            {formatearMoneda(cot.subtotal || 0)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                            {formatearMoneda(cot.total || 0)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isConvertida
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : cot.estado === 'APROBADA'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {isConvertida ? 'FORMALIZADA' : (cot.estado || 'PROPUESTA')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleVerPDFCotizacion(cot)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                title="Ver e Imprimir PDF de Cotización"
                              >
                                <Printer className="w-3.5 h-3.5 text-blue-600" />
                                <span>PDF</span>
                              </button>

                              {!isConvertida ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleEditarCotizacionEnForm(cot)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                    title="Modificar días, tarifas o equipos"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Editar</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleFormalizarCotizacionEnForm(cot)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black shadow-xs shadow-emerald-700/20 transition-all cursor-pointer active:scale-98"
                                    title="Formalizar Contrato en AlquilerForm con validación de stock y Re-Renting"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                                    <span>Formalizar Contrato</span>
                                  </button>
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Contrato ALQ Formalizado</span>
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {cotizacionesConsolidadas.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                          <p className="font-semibold text-slate-700">No hay cotizaciones registradas aún.</p>
                          <p className="text-xs text-slate-400 mt-1">Crea una cotización comercial para empezar el flujo sin afectar inventario.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setContratoActivo(null);
                              setModoCreacionInicial('COTIZACION');
                              setIsModalOpen(true);
                            }}
                            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Crear Primera Cotización</span>
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* TABLA HABITUAL DE CONTRATOS */
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-xs text-slate-700 font-bold shadow-2xs">
                <tr>
                  <th className="py-3 px-4 text-xs font-bold text-slate-700">ID / Consecutivo</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-700">Cliente</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-700">Fecha Inicio</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-700">Total Estimado</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-700">Equipos</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-700">Estado</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-700 text-right">Acciones</th>
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
                    <td className="py-3 px-4 text-xs text-slate-900 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 group-hover:bg-slate-200 px-2 py-0.5 rounded transition-colors">
                          #{alq.consecutivo || alq.id}
                        </span>
                        {alq.cotizacion_origen_id && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-200" title="Generado desde cotización de obra">
                            COT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-900 font-semibold group-hover:text-teal-700 transition-colors">
                      {alq.clienteNombre || 'Sin Nombre'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{new Date(alq.created_at || Date.now()).toLocaleDateString('es-CO')}</td>
                    <td className="py-3 px-4 text-xs font-bold text-slate-800 font-mono tabular-nums">{formatearMoneda(alq.total || 0)}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-1 bg-slate-100 rounded text-[11px] font-medium text-slate-600">
                          {alq.detalles?.length || 0} Equipo(s)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        alq.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        alq.estado === 'COTIZACION' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        alq.estado === 'FORMALIZADA' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {alq.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right relative">
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleDropdown(alq.id!); }}
                        className="text-slate-400 hover:text-teal-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
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
                              <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'APROBAR_COTIZACION'); }} className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left w-full cursor-pointer">Aprobar Cotización</button>
                            )}
                            {puedeEditar && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'EDITAR'); }} className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left w-full cursor-pointer">Editar Contrato</button>
                            )}
                            <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'PDF'); }} className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left w-full border-b border-slate-100 cursor-pointer">Generar PDF</button>
                            
                            <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'ABONO'); }} className="px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 text-left w-full cursor-pointer">Registrar Abono</button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'HISTORIAL_PAGOS'); }} className="px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 text-left w-full border-b border-slate-100 cursor-pointer">Historial Pagos</button>
                            
                            <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'DEVOLUCION'); }} className="px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 text-left w-full cursor-pointer">Recibir Equipos</button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); openAction(alq, 'HISTORIAL_DEVOLUCIONES'); }} className="px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 text-left w-full border-b border-slate-100 cursor-pointer">Historial Devoluciones</button>
                            
                            {alq.estado !== 'FINALIZADO' && alq.estado !== 'CANCELADO' && (
                               <button type="button" className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left w-full cursor-pointer">Cancelar Contrato</button>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
                {alquileresFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <p className="font-semibold text-slate-700 text-sm">
                        {activeTab === 'historial' 
                          ? 'No hay contratos finalizados o cancelados en el historial.' 
                          : 'No hay contratos de alquiler activos en obra para mostrar.'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {activeTab === 'historial' 
                          ? 'Los contratos liquidados aparecerán archivados en esta sección.' 
                          : 'Comienza creando un nuevo contrato o formalizando una cotización.'}
                      </p>
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
        title={
          contratoActivo 
            ? (contratoActivo.estado === 'COTIZACION' ? "Editar Cotización Comercial" : "Editar Contrato de Alquiler") 
            : (modoCreacionInicial === 'COTIZACION' ? "Registrar Nueva Cotización Comercial" : "Registrar Nuevo Contrato de Alquiler")
        }
        maxWidth="4xl"
      >
        <AlquilerForm 
          key={contratoActivo ? `edit_${contratoActivo.id}` : `create_${modoCreacionInicial}`}
          initialData={contratoActivo || (modoCreacionInicial === 'COTIZACION' ? { tipoDocumento: 'COTIZACION', tipo: 'COTIZACION', estado: 'COTIZACION' } : null)}
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
          handleTabChange('cotizaciones');
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
