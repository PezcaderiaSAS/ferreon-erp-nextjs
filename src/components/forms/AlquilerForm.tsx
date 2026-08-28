"use client";

import React, { useState, useMemo, useEffect } from 'react';
import * as z from 'zod';
import { useClienteStore } from '../../infrastructure/state/clienteStore';
import { useBodegaStore } from '../../infrastructure/state/bodegaStore';
import { useAlquilerStore } from '../../infrastructure/state/alquilerStore';
import { useEmpresaStore } from '../../infrastructure/state/empresaStore';
import { crearAlquilerAction, editarAlquilerAction } from '../../app/actions/alquileres';
import { equipoToEquipoUI } from '../../lib/mappers';
import { Button } from '../ui/Button';
import { idempotencyManager } from '../../lib/idempotency';
import { Modal } from '../ui/Modal';
import { ClienteForm } from './ClienteForm';
import { BodegaForm } from './BodegaForm';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ContratoAlquilerPDF } from '../pdf/ContratoAlquilerPDF';
import { formatearMonedaConLetras } from '../../core/utils/numero-a-letras';
import { EnterprisePDFService } from '../../core/services/pdf-factura-generator.service';

const alquilerSchema = z.object({
  clienteId: z.string().min(1, 'Debe seleccionar un cliente'),
  fechaRegistro: z.string().min(1, 'La fecha de registro es requerida'),
  fleteEntrega: z.number().min(0),
  fleteRecogida: z.number().min(0),
  deposito: z.number().min(0),
  garantiaMonto: z.number().min(0),
  garantiaTipo: z.string(),
  observaciones: z.string().optional(),
  detallesLogistica: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().min(1, 'Seleccione un equipo'),
    cantidad: z.number().min(1, 'Cantidad mínima 1'),
    precioDiario: z.number().min(0, 'El precio no puede ser negativo'),
    fechaInicio: z.string().min(1, 'Fecha inicio requerida'),
    fechaFinEstimada: z.string().min(1, 'Fecha fin estimada requerida'),
  })).min(1, 'Debe agregar al menos un equipo')
});

interface ItemRow {
  id: string;
  itemId: string;
  cantidad: number;
  precioDiario: number;
  fechaInicio: string;
  fechaFinEstimada: string;
}

interface Props {
  initialData?: any;
  onSuccess: (alquiler?: any) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, title: 'Cliente y Garantías', desc: 'Datos del cliente y pólizas' },
  { id: 2, title: 'Equipos y Logística', desc: 'Selección de maquinaria y fletes' },
  { id: 3, title: 'Resumen y Confirmación', desc: 'Observaciones y cálculo final' },
];

export function AlquilerForm({ initialData, onSuccess, onCancel }: Props) {
  const { clientes, setClientes } = useClienteStore();
  const { equipos, setEquipos } = useBodegaStore();
  const { config: empresaConfig } = useEmpresaStore();

  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [idempotencyKey] = useState(() => idempotencyManager.generateKey());
  
  const [isCreandoCliente, setIsCreandoCliente] = useState(false);
  const [isCreandoEquipo, setIsCreandoEquipo] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewPaperSize, setPreviewPaperSize] = useState<'LETTER' | 'A5'>('LETTER');
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [savedAlquilerData, setSavedAlquilerData] = useState<any>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Sincronización proactiva de catálogos en montaje
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        setIsLoadingCatalogs(true);
        const [resCli, resEq] = await Promise.all([
          fetch('/api/clientes'),
          fetch('/api/equipos')
        ]);
        const [jsonCli, jsonEq] = await Promise.all([
          resCli.json(),
          resEq.json()
        ]);
        if (jsonCli.success && Array.isArray(jsonCli.data)) {
          setClientes(jsonCli.data);
        }
        if (jsonEq.success && Array.isArray(jsonEq.data)) {
          setEquipos(jsonEq.data.map(equipoToEquipoUI));
        }
      } catch (err) {
        console.warn('[AlquilerForm] Error al sincronizar catálogos:', err);
      } finally {
        setIsLoadingCatalogs(false);
      }
    };
    fetchCatalogs();
  }, [setClientes, setEquipos]);

  // Form State
  const [clienteId, setClienteId] = useState<string>(initialData?.cliente_id || initialData?.clienteId || '');
  const [fechaRegistro, setFechaRegistro] = useState<string>(
    initialData?.created_at ? new Date(initialData.created_at).toISOString().split('T')[0] : 
    (initialData?.createdAt ? new Date(initialData.createdAt).toISOString().split('T')[0] : todayStr)
  );
  const [fleteEntrega, setFleteEntrega] = useState<number>(initialData ? (initialData.flete_entrega || initialData.fleteEntrega || 0) : 30000);
  const [fleteRecogida, setFleteRecogida] = useState<number>(initialData ? (initialData.flete_recogida || initialData.fleteRecogida || 0) : 30000);
  const [deposito, setDeposito] = useState<number>(initialData ? (initialData.deposito || 0) : 50000);
  const [garantiaMonto, setGarantiaMonto] = useState<number>(initialData ? (initialData.garantia_monto || initialData.garantiaMonto || 0) : 300000);
  const [garantiaTipo, setGarantiaTipo] = useState<string>(initialData?.garantia_tipo || initialData?.garantiaTipo || 'Efectivo');
  const [observaciones, setObservaciones] = useState<string>(initialData?.observaciones || initialData?.observacionesGenerales || '');
  const [detallesLogistica, setDetallesLogistica] = useState<string>(initialData?.detalles_logistica || initialData?.detallesLogistica || '');

  const [items, setItems] = useState<ItemRow[]>(() => {
    if (initialData?.detalles && initialData.detalles.length > 0) {
      return initialData.detalles.map((d: any, idx: number) => ({
        id: `init_${idx}_${Date.now()}`,
        itemId: String(d.equipo_id || d.itemId || ''),
        cantidad: d.cantidad || 1,
        precioDiario: d.valor_unitario || d.tarifaDiaria || d.precioDiario || d.valorUnitario || 0,
        fechaInicio: d.fecha_inicio ? new Date(d.fecha_inicio).toISOString().split('T')[0] : (d.fechaInicio ? new Date(d.fechaInicio).toISOString().split('T')[0] : todayStr),
        fechaFinEstimada: d.fecha_fin_estimada ? new Date(d.fecha_fin_estimada).toISOString().split('T')[0] : (d.fechaFinEstimada ? new Date(d.fechaFinEstimada).toISOString().split('T')[0] : todayStr),
      }));
    }
    return [{ id: `row_0_${Date.now()}`, itemId: '', cantidad: 1, precioDiario: 0, fechaInicio: todayStr, fechaFinEstimada: todayStr }];
  });

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      { id: `row_${Date.now()}_${Math.random()}`, itemId: '', cantidad: 1, precioDiario: 0, fechaInicio: todayStr, fechaFinEstimada: todayStr }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: keyof ItemRow, value: any) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => {
      const isActivo = c.estado === 'Activo' || !c.estado;
      if (!isActivo) return false;
      if (!clientSearchTerm.trim()) return true;
      const term = clientSearchTerm.toLowerCase();
      const nombre = (c.nombre || '').toLowerCase();
      const nit = (c.nit_cedula || c.nit || '').toLowerCase();
      const tel = (c.telefono || c.contacto || '').toLowerCase();
      return nombre.includes(term) || nit.includes(term) || tel.includes(term);
    });
  }, [clientes, clientSearchTerm]);

  const equiposActivos = useMemo(() => {
    return equipos.filter(e => e.estado !== 'Inactivo');
  }, [equipos]);

  const selectedCliente = useMemo(() => {
    return clientes.find(c => String(c.id) === String(clienteId));
  }, [clientes, clienteId]);

  // Subtotal de equipos calculado con fórmula estricta
  const subtotalEquipos = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!item.itemId || !item.fechaInicio || !item.fechaFinEstimada) return acc;
      
      const start = new Date(item.fechaInicio);
      const end = new Date(item.fechaFinEstimada);
      const diffMs = end.getTime() - start.getTime();
      const dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      return acc + ((item.precioDiario || 0) * (item.cantidad || 1) * dias);
    }, 0);
  }, [items]);

  const totalFletes = (fleteEntrega || 0) + (fleteRecogida || 0);
  const totalGeneral = subtotalEquipos + totalFletes;
  const totalEstimado = Math.max(0, totalGeneral - (deposito || 0));

  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(valor || 0));
  };

  // Helper para generar nombre de archivo normalizado y sanitizado
  const generarNombreArchivoPDF = (consecutivo: string | number, clienteNombre: string, fecha: string, formato: string) => {
    const clienteLimpio = (clienteNombre || 'Cliente')
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .trim();
    const formatoLabel = formato === 'A5' ? 'A5' : 'Carta';
    return `Contrato_Alquiler_#${consecutivo || 'Draft'}_${clienteLimpio}_${fecha}_${formatoLabel}.pdf`;
  };

  const validateCurrentStep = (): boolean => {
    setFormErrors({});
    if (currentStep === 1) {
      if (!clienteId) {
        setFormErrors(prev => ({ ...prev, clienteId: 'Debe seleccionar un cliente' }));
        return false;
      }
      if (!fechaRegistro) {
        setFormErrors(prev => ({ ...prev, fechaRegistro: 'La fecha de registro es requerida' }));
        return false;
      }
    } else if (currentStep === 2) {
      const hasEmptyItem = items.some(it => !it.itemId);
      if (hasEmptyItem) {
        setFormErrors(prev => ({ ...prev, items: 'Seleccione un equipo para cada fila' }));
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (!validateCurrentStep()) return;
    setCurrentStep((prev) => Math.min(3, prev + 1));
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Payload unificado para vista previa o guardado
  const construirPayloadDocumento = (consecutivo = 'Borrador') => {
    const itemsConDetalles = items.map(item => {
      const equipo = equiposActivos.find(e => String(e.id) === String(item.itemId));
      const start = new Date(item.fechaInicio);
      const end = new Date(item.fechaFinEstimada);
      const diffMs = end.getTime() - start.getTime();
      const dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const subtotalLinea = (item.precioDiario || 0) * (item.cantidad || 1) * dias;

      return {
        itemId: item.itemId,
        nombre: equipo?.nombre || 'Equipo de Construcción',
        nombreItem: equipo?.nombre || 'Equipo de Construcción',
        codigo: (equipo as any)?.codigo || (equipo as any)?.sku || '',
        cantidad: item.cantidad,
        tarifaDiaria: item.precioDiario,
        tarifaAplicada: item.precioDiario,
        fechaInicio: item.fechaInicio,
        fechaFin: item.fechaFinEstimada,
        fechaFinEstimada: item.fechaFinEstimada,
        dias,
        subtotal: subtotalLinea,
        subtotalLineaEstimado: subtotalLinea,
      };
    });

    return {
      id: '',
      tipo: 'CONTRATO' as const,
      consecutivo,
      cliente_id: clienteId,
      clienteNombre: selectedCliente?.nombre || 'Consumidor Final',
      clienteNit: selectedCliente?.nit_cedula || selectedCliente?.nit || 'Sin Registrar',
      clienteTelefono: selectedCliente?.telefono || selectedCliente?.contacto || '',
      flete_entrega: fleteEntrega,
      fleteEntrega,
      flete_recogida: fleteRecogida,
      fleteRecogida,
      deposito,
      depositoAplicado: deposito,
      garantia_monto: garantiaMonto,
      garantiaMonto,
      garantia_tipo: garantiaTipo,
      garantiaTipo,
      observaciones,
      detalles_logistica: detallesLogistica,
      detallesLogistica,
      items: itemsConDetalles,
      detalles: itemsConDetalles,
      subtotal_equipos: subtotalEquipos,
      subtotalEquipos,
      total_general: totalGeneral,
      subtotalGeneral: totalGeneral,
      total: totalEstimado,
      totalPagar: totalEstimado,
      saldo_pendiente: totalEstimado,
      saldoPendiente: totalEstimado,
      created_at: fechaRegistro,
      fechaEmision: fechaRegistro,
      estado: 'ACTIVO',
      empresa: empresaConfig,
      formatoPapel: 'LETTER' as 'LETTER' | 'A5',
    };
  };

  const handleAbrirImpresionHTML = (formato: 'LETTER' | 'A5' = 'LETTER') => {
    const payload: any = construirPayloadDocumento(savedAlquilerData?.consecutivo || 'Borrador');
    payload.formatoPapel = formato;
    const htmlContent = EnterprisePDFService.generarHTMLDocumento(payload);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      alert("Por favor habilita las ventanas emergentes para visualizar el documento.");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFormErrors({});

    const validation = alquilerSchema.safeParse({
      clienteId,
      fechaRegistro,
      fleteEntrega: Number(fleteEntrega) || 0,
      fleteRecogida: Number(fleteRecogida) || 0,
      deposito: Number(deposito) || 0,
      garantiaMonto: Number(garantiaMonto) || 0,
      garantiaTipo,
      observaciones,
      detallesLogistica,
      items: items.map(it => ({
        itemId: it.itemId,
        cantidad: Number(it.cantidad) || 1,
        precioDiario: Number(it.precioDiario) || 0,
        fechaInicio: it.fechaInicio,
        fechaFinEstimada: it.fechaFinEstimada
      }))
    });

    if (!validation.success) {
      const errMap: { [key: string]: string } = {};
      validation.error.issues.forEach(iss => {
        const path = iss.path.join('.');
        errMap[path] = iss.message;
      });
      setFormErrors(errMap);
      setErrorMsg('Por favor verifique los campos requeridos en el formulario.');
      return;
    }

    if (!idempotencyManager.processKey(idempotencyKey)) {
      console.warn("Transacción bloqueada por IdempotencyManager (doble clic detectado)");
      return;
    }

    setIsSubmitting(true);
    
    const store = useAlquilerStore.getState();
    const previousAlquileres = [...store.alquileres];
    const optimisticId = initialData ? initialData.id : `temp_${Date.now()}`;
    
    try {
      const alquilerUi = construirPayloadDocumento(initialData?.consecutivo || 'Borrador');
      alquilerUi.id = optimisticId;
      
      if (initialData) {
        store.updateAlquiler(alquilerUi as any);
      } else {
        store.addAlquiler(alquilerUi as any);
      }

      // Persistencia mediante Server Action
      if (initialData) {
        const result = await editarAlquilerAction({
          alquilerId: initialData.id,
          clienteId: validation.data.clienteId,
          clienteNombre: selectedCliente?.nombre,
          fleteEntrega: validation.data.fleteEntrega,
          fleteRecogida: validation.data.fleteRecogida,
          deposito: validation.data.deposito,
          garantiaMonto: validation.data.garantiaMonto,
          garantiaTipo: validation.data.garantiaTipo,
          observaciones: validation.data.observaciones,
          detallesLogistica: validation.data.detallesLogistica,
          items: alquilerUi.detalles,
        });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        store.sanitizeStore();
        setSavedAlquilerData(alquilerUi);
        setIsSuccess(true);
      } else {
        const result = await crearAlquilerAction({
          clienteId: validation.data.clienteId,
          clienteNombre: selectedCliente?.nombre,
          fleteEntrega: validation.data.fleteEntrega,
          fleteRecogida: validation.data.fleteRecogida,
          deposito: validation.data.deposito,
          garantiaMonto: validation.data.garantiaMonto,
          garantiaTipo: validation.data.garantiaTipo,
          observaciones: validation.data.observaciones,
          detallesLogistica: validation.data.detallesLogistica,
          items: alquilerUi.detalles
        });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        const nuevoAlquilerDB = result.data;
        const alquilerFinal = { 
          ...alquilerUi, 
          id: nuevoAlquilerDB.id, 
          consecutivo: nuevoAlquilerDB.consecutivo,
          subtotal_equipos: subtotalEquipos,
          total: totalEstimado,
          saldo_pendiente: totalEstimado
        };
        store.updateAlquiler(alquilerFinal as any);
        store.sanitizeStore();
        
        setSavedAlquilerData(alquilerFinal);
        setIsSuccess(true);
      }
    } catch (err: any) {
      store.restoreSnapshot(previousAlquileres);
      idempotencyManager.removeKey(idempotencyKey);
      console.error("Error al guardar alquiler:", err);
      setErrorMsg(err.message || 'Error al guardar el contrato');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de Éxito y Descarga Multiformato
  if (isSuccess && savedAlquilerData) {
    const consecutivoDisplay = savedAlquilerData.consecutivo || '101';
    const nombreCliente = savedAlquilerData.clienteNombre || 'Cliente';
    const fechaActual = todayStr;

    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center animate-fadeIn">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl shadow-inner">
          ✓
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">¡Contrato Guardado Exitosamente!</h2>
          <p className="text-sm text-slate-500 mt-1">
            El contrato <span className="font-bold text-slate-700">#{consecutivoDisplay}</span> ha sido registrado en la base de datos de Alquileres System.
          </p>
        </div>

        {/* Opciones de Descarga e Impresión */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full max-w-lg space-y-4 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Opciones de Emisión de Documento</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Descarga Carta */}
            <PDFDownloadLink
              document={<ContratoAlquilerPDF data={savedAlquilerData} pageSize="LETTER" />}
              fileName={generarNombreArchivoPDF(consecutivoDisplay, nombreCliente, fechaActual, 'LETTER')}
              className="px-4 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs"
            >
              <span>📄</span>
              <span>Descargar Carta (PDF)</span>
            </PDFDownloadLink>

            {/* Descarga A5 */}
            <PDFDownloadLink
              document={<ContratoAlquilerPDF data={savedAlquilerData} pageSize="A5" />}
              fileName={generarNombreArchivoPDF(consecutivoDisplay, nombreCliente, fechaActual, 'A5')}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs"
            >
              <span>📑</span>
              <span>Descargar Media Carta / A5</span>
            </PDFDownloadLink>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => handleAbrirImpresionHTML('LETTER')}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
            >
              <span>🖨️</span>
              <span>Impresión Rápida HTML</span>
            </button>
            <button
              type="button"
              onClick={() => onSuccess(savedAlquilerData)}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition-all"
            >
              Finalizar y Ver Listado
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col h-full space-y-6">
        {/* Stepper */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white shadow-sm border border-teal-600/30 text-teal-700'
                      : isCompleted
                      ? 'text-emerald-700 hover:bg-white/60'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? '✓' : step.id}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold truncate">{step.title}</div>
                    <div className="text-[10px] text-slate-400 hidden sm:block truncate">{step.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-medium flex items-center space-x-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PASO 1: CLIENTE Y GARANTÍAS */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                <span>Identificación del Cliente y Fechas</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buscador Asistido de Clientes */}
                <div className="flex flex-col gap-1.5 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Cliente / Razón Social *</label>
                    <button 
                      type="button" 
                      onClick={() => setIsCreandoCliente(true)} 
                      className="text-[10px] bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full font-bold hover:bg-teal-100 transition-colors flex items-center gap-1"
                    >
                      + Nuevo Cliente
                    </button>
                  </div>

                  {selectedCliente && !isClientDropdownOpen ? (
                    <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-teal-600/10 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                          👤
                        </div>
                        <div className="truncate">
                          <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">{selectedCliente.nombre}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>NIT: {selectedCliente.nit_cedula || selectedCliente.nit || 'S/N'}</span>
                            {(selectedCliente.telefono || selectedCliente.contacto) && (
                              <span>• Tel: {selectedCliente.telefono || selectedCliente.contacto}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsClientDropdownOpen(true);
                          setClientSearchTerm('');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 rounded-lg transition-colors shrink-0 ml-2"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Escriba para buscar por nombre o NIT..."
                        value={clientSearchTerm}
                        onChange={(e) => {
                          setClientSearchTerm(e.target.value);
                          setIsClientDropdownOpen(true);
                        }}
                        onFocus={() => setIsClientDropdownOpen(true)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all"
                      />
                      {isClientDropdownOpen && (
                        <div className="absolute z-30 w-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                          {filteredClientes.map(c => (
                            <div 
                              key={c.id} 
                              className="px-3.5 py-2.5 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 cursor-pointer flex justify-between items-center transition-colors"
                              onClick={() => {
                                setClienteId(String(c.id));
                                setClientSearchTerm('');
                                setIsClientDropdownOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{c.nombre}</span>
                                <span className="text-[10px] text-slate-400">{c.telefono || c.contacto || ''}</span>
                              </div>
                              <span className="text-slate-500 text-[11px] bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                                NIT: {c.nit_cedula || c.nit}
                              </span>
                            </div>
                          ))}
                          {filteredClientes.length === 0 && (
                            <div className="px-4 py-4 text-xs text-slate-400 text-center flex flex-col items-center gap-1.5">
                              <span>{isLoadingCatalogs ? "Cargando clientes..." : "No se encontraron clientes registrados."}</span>
                              <button 
                                type="button" 
                                onClick={() => setIsCreandoCliente(true)} 
                                className="text-xs text-teal-700 font-bold hover:underline"
                              >
                                + Crear nuevo cliente ahora
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {formErrors.clienteId && <span className="text-[11px] text-red-500 font-semibold">{formErrors.clienteId}</span>}
                </div>

                {/* Fecha de Registro */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Fecha de Creación del Contrato *</label>
                  <input 
                    type="date" 
                    value={fechaRegistro}
                    onChange={(e) => setFechaRegistro(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all" 
                  />
                  {formErrors.fechaRegistro && <span className="text-[11px] text-red-500 font-semibold">{formErrors.fechaRegistro}</span>}
                </div>
              </div>
            </div>

            {/* Garantías y Depósito con Ayuda Verbal */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Garantía y Anticipo de Seguridad</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Tipo de Respaldo</label>
                  <select 
                    value={garantiaTipo}
                    onChange={(e) => setGarantiaTipo(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all"
                  >
                    <option value="Efectivo">Efectivo en Custodia</option>
                    <option value="Pagaré">Pagaré Firmado</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Cheque">Cheque de Gerencia</option>
                  </select>
                </div>

                {/* Monto de Garantía */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Monto de Garantía ($ COP)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={garantiaMonto}
                    onChange={(e) => setGarantiaMonto(parseFloat(e.target.value) || 0)}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all" 
                  />
                  <span className="text-[10.5px] text-emerald-700 font-semibold truncate">
                    {formatearMonedaConLetras(garantiaMonto)}
                  </span>
                </div>

                {/* Depósito / Abono */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Depósito / Abono Inicial ($ COP)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={deposito}
                    onChange={(e) => setDeposito(parseFloat(e.target.value) || 0)}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all" 
                  />
                  <span className="text-[10.5px] text-teal-700 font-semibold truncate">
                    {formatearMonedaConLetras(deposito)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: EQUIPOS Y LOGÍSTICA */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Maquinaria y Equipos Solicitados</h3>
                  <p className="text-[11px] text-slate-400">Asigne fechas de inicio y fin estimadas para cada máquina.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsCreandoEquipo(true)} 
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5"
                  >
                    <span>+ Nuevo Equipo</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={addItemRow} 
                    className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5"
                  >
                    <span>+ Agregar Maquinaria</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {items.map((field, index) => {
                  const start = new Date(field.fechaInicio);
                  const end = new Date(field.fechaFinEstimada);
                  const diasFila = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                  const subtotalFila = (field.precioDiario || 0) * (field.cantidad || 1) * diasFila;

                  return (
                    <div key={field.id} className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 flex flex-col gap-2">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                        <div className="flex-1 min-w-[180px] flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-600">Equipo *</label>
                          <select 
                            value={field.itemId}
                            onChange={(e) => {
                              const eqId = e.target.value;
                              const equipo = equiposActivos.find(eq => String(eq.id) === String(eqId));
                              const tarifa = equipo ? ((equipo as any).tarifa_diaria ?? equipo.tarifaDiaria ?? 0) : 0;
                              const newItems = [...items];
                              newItems[index] = { 
                                ...newItems[index], 
                                itemId: eqId, 
                                precioDiario: tarifa 
                              };
                              setItems(newItems);
                            }}
                            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none"
                          >
                            <option value="">Seleccione equipo...</option>
                            {equiposActivos.map(e => {
                              const stock = (e as any).stock_disponible ?? e.stockDisponible ?? 0;
                              const isAvailable = stock > 0;
                              const stockText = isAvailable ? `(${stock} disp.)` : `(Sin stock)`;
                              return (
                                <option key={e.id} value={String(e.id)} disabled={!isAvailable}>
                                  {e.nombre} {stockText}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="w-28 flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-600">Valor Diario</label>
                          <input 
                            type="number" 
                            min={0} 
                            value={field.precioDiario}
                            onChange={(e) => updateItemRow(index, 'precioDiario', parseFloat(e.target.value) || 0)}
                            className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none text-right font-semibold" 
                          />
                        </div>

                        <div className="w-20 flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-600">Cant.</label>
                          <input 
                            type="number" 
                            min={1} 
                            value={field.cantidad}
                            onChange={(e) => updateItemRow(index, 'cantidad', parseInt(e.target.value, 10) || 1)}
                            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none text-center font-bold" 
                          />
                        </div>

                        <div className="w-36 flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-600">Fecha Inicio</label>
                          <input 
                            type="date" 
                            value={field.fechaInicio}
                            onChange={(e) => updateItemRow(index, 'fechaInicio', e.target.value)}
                            className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none" 
                          />
                        </div>

                        <div className="w-36 flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-600">Fin Estimado</label>
                          <input 
                            type="date" 
                            value={field.fechaFinEstimada}
                            onChange={(e) => updateItemRow(index, 'fechaFinEstimada', e.target.value)}
                            className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none" 
                          />
                        </div>

                        {items.length > 1 && (
                          <div className="flex items-end pt-5 md:pt-0">
                            <button 
                              type="button" 
                              onClick={() => removeItemRow(index)} 
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl text-xs transition-colors"
                              title="Eliminar fila"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Subtotal de Fila y Ayuda Verbal */}
                      <div className="flex justify-between items-center text-[11px] px-2 pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500">
                          {formatearMonedaConLetras(field.precioDiario)} × {diasFila} día(s)
                        </span>
                        <span className="font-bold text-teal-800">
                          Subtotal Renglón: {formatearCOP(subtotalFila)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {formErrors.items && <span className="text-[11px] text-red-500 font-semibold">{formErrors.items}</span>}
            </div>

            {/* Fletes y Logística con Ayuda Verbal */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Costos de Logística y Traslado</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Flete de Entrega a Obra ($ COP)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={fleteEntrega}
                    onChange={(e) => setFleteEntrega(parseFloat(e.target.value) || 0)}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all" 
                  />
                  <span className="text-[10.5px] text-slate-600 font-semibold truncate">
                    {formatearMonedaConLetras(fleteEntrega)}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Flete de Recogida / Retorno ($ COP)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={fleteRecogida}
                    onChange={(e) => setFleteRecogida(parseFloat(e.target.value) || 0)}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all" 
                  />
                  <span className="text-[10.5px] text-slate-600 font-semibold truncate">
                    {formatearMonedaConLetras(fleteRecogida)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: RESUMEN, CONFIRMACIÓN Y VISTA PREVIA */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Notas y Observaciones */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm flex flex-col">
                <h3 className="text-sm font-bold text-slate-900">Observaciones y Condiciones Especiales</h3>
                <textarea 
                  rows={3}
                  placeholder="Ingrese detalles sobre el estado del equipo, sitio de obra o acuerdos especiales..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full flex-1 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all"
                />
                <textarea 
                  rows={2}
                  placeholder="Dirección exacta de obra y persona encargada de recibir..."
                  value={detallesLogistica}
                  onChange={(e) => setDetallesLogistica(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all"
                />
              </div>

              {/* Desglose Financiero */}
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 space-y-3 shadow-xl flex flex-col justify-between border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-teal-400 font-bold">Resumen de Liquidación</span>
                  <h4 className="text-xl font-black text-white mt-1">Alquileres System</h4>
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-800">
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>Subtotal Alquiler Equipos:</span>
                    <span className="font-bold text-white">{formatearCOP(subtotalEquipos)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>Total Fletes (Entrega + Recogida):</span>
                    <span className="font-bold text-white">{formatearCOP(totalFletes)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span>Anticipo / Depósito Aplicado:</span>
                    <span className="font-bold text-amber-400">- {formatearCOP(deposito)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm font-bold border-t border-slate-700">
                    <span className="text-teal-300">Saldo Pendiente Estimado:</span>
                    <span className="text-xl font-black text-emerald-400">{formatearCOP(totalEstimado)}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-800/80 rounded-xl text-[11px] text-slate-400 flex justify-between items-center">
                  <span>Garantía ({garantiaTipo}):</span>
                  <span className="font-bold text-white">{formatearCOP(garantiaMonto)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACTION FOOTER */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-4 bg-white/95 backdrop-blur-md border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 z-20 mt-6 rounded-b-2xl sm:rounded-b-3xl">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all"
          >
            Cancelar
          </button>

          <div className="flex items-center space-x-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all"
              >
                ← Anterior
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center space-x-1.5"
              >
                <span>Continuar</span>
                <span>→</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {/* Botón de Vista Previa del Documento en Paso 3 */}
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="px-4 py-2.5 bg-teal-50 border border-teal-300 text-teal-800 hover:bg-teal-100 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center space-x-1.5"
                >
                  <span>👁️</span>
                  <span>Vista Previa</span>
                </button>

                <Button 
                  type="submit" 
                  isLoading={isSubmitting}
                  className="px-6 py-2.5 min-w-[160px] bg-teal-700 hover:bg-teal-800 text-white shadow-lg shadow-teal-700/25 font-black text-xs sm:text-sm rounded-xl flex items-center space-x-2"
                >
                  <span>💾</span>
                  <span>{initialData ? "Guardar Cambios" : "Guardar y Crear Contrato"}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* MODAL DE VISTA PREVIA INTERACTIVA (CARTA & A5) */}
      <Modal 
        isOpen={isPreviewModalOpen} 
        onClose={() => setIsPreviewModalOpen(false)} 
        title="Vista Previa del Contrato de Alquiler" 
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-100 p-2.5 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Formato de Hoja:</span>
              <button
                type="button"
                onClick={() => setPreviewPaperSize('LETTER')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  previewPaperSize === 'LETTER' ? 'bg-teal-700 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                📄 Tamaño Carta
              </button>
              <button
                type="button"
                onClick={() => setPreviewPaperSize('A5')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  previewPaperSize === 'A5' ? 'bg-teal-700 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                📑 Media Carta (A5)
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => handleAbrirImpresionHTML(previewPaperSize)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-all flex items-center space-x-1.5"
            >
              <span>🖨️</span>
              <span>Imprimir Documento</span>
            </button>
          </div>

          <div className="max-h-[65vh] overflow-y-auto border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 text-xs space-y-4">
              {/* Header preview */}
              <div className="flex justify-between items-start border-b-2 border-teal-700 pb-3">
                <div>
                  <h2 className="text-lg font-black text-teal-800">Alquileres System</h2>
                  <p className="text-[11px] text-slate-500">Gestión y Alquiler de Maquinaria y Equipos para la Construcción</p>
                  <p className="text-[10px] text-slate-400">NIT: 900.854.123-9 • Tel: (+57) 310 987 6543 • Bogotá D.C.</p>
                </div>
                <div className="text-right bg-emerald-50 border border-emerald-300 p-2 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Contrato de Alquiler</span>
                  <span className="text-sm font-black text-teal-800">#BORRADOR</span>
                  <span className="text-[10px] text-slate-500 block">Fecha: {fechaRegistro}</span>
                </div>
              </div>

              {/* Info Cliente */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="font-bold text-teal-800 block text-[11px]">DATOS DEL CLIENTE</span>
                  <p><strong>Cliente:</strong> {selectedCliente?.nombre || 'Consumidor Final'}</p>
                  <p><strong>NIT/C.C.:</strong> {selectedCliente?.nit_cedula || selectedCliente?.nit || 'Sin Registrar'}</p>
                  <p><strong>Teléfono:</strong> {selectedCliente?.telefono || selectedCliente?.contacto || 'No especificado'}</p>
                </div>
                <div>
                  <span className="font-bold text-teal-800 block text-[11px]">LOGÍSTICA Y RESPALDO</span>
                  <p><strong>Lugar de Entrega:</strong> {detallesLogistica || 'Entrega en bodega'}</p>
                  <p><strong>Garantía ({garantiaTipo}):</strong> {formatearCOP(garantiaMonto)}</p>
                  {observaciones && <p><strong>Obs:</strong> {observaciones}</p>}
                </div>
              </div>

              {/* Tabla de Equipos Preview */}
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-teal-700 text-white text-[10px] uppercase">
                    <th className="p-2">Equipo</th>
                    <th className="p-2 text-center">Cant.</th>
                    <th className="p-2 text-center">Desde</th>
                    <th className="p-2 text-center">Hasta</th>
                    <th className="p-2 text-center">Días</th>
                    <th className="p-2 text-right">Tarifa/Día</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => {
                    const eq = equiposActivos.find(e => String(e.id) === String(it.itemId));
                    const start = new Date(it.fechaInicio);
                    const end = new Date(it.fechaFinEstimada);
                    const dias = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                    const sub = (it.precioDiario || 0) * (it.cantidad || 1) * dias;

                    return (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
                        <td className="p-2 font-bold text-slate-800">{eq?.nombre || 'Equipo'}</td>
                        <td className="p-2 text-center font-bold">{it.cantidad}</td>
                        <td className="p-2 text-center">{it.fechaInicio}</td>
                        <td className="p-2 text-center">{it.fechaFinEstimada}</td>
                        <td className="p-2 text-center font-bold">{dias}</td>
                        <td className="p-2 text-right">{formatearCOP(it.precioDiario)}</td>
                        <td className="p-2 text-right font-bold text-teal-900">{formatearCOP(sub)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totales Preview */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10.5px]">
                  <span className="font-bold text-teal-800 block">VALOR EN LETRAS:</span>
                  <span className="font-bold text-slate-700">{formatearMonedaConLetras(totalEstimado)}</span>
                </div>
                <div className="w-56 border border-slate-200 rounded-lg overflow-hidden text-[11px]">
                  <div className="flex justify-between p-1.5 border-b border-slate-100">
                    <span>Subtotal Equipos:</span>
                    <span className="font-bold">{formatearCOP(subtotalEquipos)}</span>
                  </div>
                  <div className="flex justify-between p-1.5 border-b border-slate-100">
                    <span>Fletes (Entrega + Recogida):</span>
                    <span>{formatearCOP(totalFletes)}</span>
                  </div>
                  <div className="flex justify-between p-1.5 border-b border-slate-100 text-red-600 font-bold">
                    <span>Anticipo / Depósito:</span>
                    <span>- {formatearCOP(deposito)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-teal-700 text-white font-bold text-xs">
                    <span>SALDO PENDIENTE:</span>
                    <span>{formatearCOP(totalEstimado)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </div>
      </Modal>

      {/* Submodales de creación rápida */}
      <Modal isOpen={isCreandoCliente} onClose={() => setIsCreandoCliente(false)} title="Crear Cliente" maxWidth="2xl">
        <ClienteForm 
          onSuccess={(nuevoCliente) => {
            if (nuevoCliente && nuevoCliente.id) {
              setClienteId(String(nuevoCliente.id));
              setClientSearchTerm('');
            }
            setIsCreandoCliente(false);
          }} 
          onCancel={() => setIsCreandoCliente(false)} 
        />
      </Modal>

      <Modal isOpen={isCreandoEquipo} onClose={() => setIsCreandoEquipo(false)} title="Crear Equipo" maxWidth="2xl">
        <BodegaForm 
          onSuccess={(nuevoEquipo) => {
            if (nuevoEquipo && nuevoEquipo.id) {
              const newItems = [...items];
              if (newItems.length > 0 && !newItems[newItems.length - 1].itemId) {
                newItems[newItems.length - 1] = { 
                  ...newItems[newItems.length - 1], 
                  itemId: String(nuevoEquipo.id), 
                  precioDiario: nuevoEquipo.tarifaDiaria || 0 
                };
              } else {
                newItems.push({ 
                  id: Date.now().toString(), 
                  itemId: String(nuevoEquipo.id), 
                  cantidad: 1, 
                  precioDiario: nuevoEquipo.tarifaDiaria || 0, 
                  fechaInicio: todayStr, 
                  fechaFinEstimada: todayStr 
                });
              }
              setItems(newItems);
            }
            setIsCreandoEquipo(false);
          }} 
          onCancel={() => setIsCreandoEquipo(false)} 
        />
      </Modal>
    </>
  );
}
