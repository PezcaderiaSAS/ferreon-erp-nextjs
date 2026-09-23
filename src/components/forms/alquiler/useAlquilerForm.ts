import { useState, useMemo, useEffect, useCallback } from 'react';
import { useClienteStore } from '../../../infrastructure/state/clienteStore';
import { useBodegaStore } from '../../../infrastructure/state/bodegaStore';
import { useAlquilerStore } from '../../../infrastructure/state/alquilerStore';
import { useEmpresaStore } from '../../../infrastructure/state/empresaStore';
import { crearAlquilerAction, editarAlquilerAction } from '../../../app/actions/alquileres';
import { crearAlquilerSegmentadoAction } from '../../../app/actions/alquiler-segmentado';
import { equipoToEquipoUI } from '../../../lib/mappers';
import { idempotencyManager } from '../../../lib/idempotency';
import { EnterprisePDFService } from '../../../core/services/pdf-factura-generator.service';
import { alquilerSchema, ItemRow, AlquilerFormProps } from './types';
import { OverbookingConflictInfo } from './ModalResolucionOverbooking';

export function useAlquilerForm({ 
  initialData, 
  modoInicial = 'COTIZACION',
  cotizacionOrigenId,
  onSuccess, 
  onDirtyChange 
}: AlquilerFormProps) {
  const { clientes, setClientes } = useClienteStore();
  const { equipos, setEquipos } = useBodegaStore();
  const { alquileres } = useAlquilerStore();
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
  const [autoFocusRowId, setAutoFocusRowId] = useState<string | null>(null);
  const [openComboboxRowId, setOpenComboboxRowId] = useState<string | null>(null);

  // Estados para Resolución Asistida de Overbooking Concurrente
  const [conflictoOverbooking, setConflictoOverbooking] = useState<OverbookingConflictInfo | null>(null);
  const [isModalOverbookingOpen, setIsModalOverbookingOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Sincronización en background sin latencia
  const fetchCatalogsBackground = useCallback(async () => {
    try {
      const [resCli, resEq] = await Promise.all([
        fetch('/api/clientes', { cache: 'no-store' }),
        fetch('/api/equipos', { cache: 'no-store' })
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
      console.warn('[useAlquilerForm] Error al sincronizar catálogos en background:', err);
    }
  }, [setClientes, setEquipos]);

  useEffect(() => {
    const fetchCatalogs = async () => {
      setIsLoadingCatalogs(true);
      await fetchCatalogsBackground();
      setIsLoadingCatalogs(false);
    };
    fetchCatalogs();
  }, [fetchCatalogsBackground]);

  // Form State y Modo Transaccional Unificado
  const [tipoDocumento, setTipoDocumento] = useState<'COTIZACION' | 'CONTRATO'>(
    initialData?.tipoDocumento || initialData?.tipo || (initialData?.estado === 'COTIZACION' ? 'COTIZACION' : (modoInicial || 'COTIZACION'))
  );
  const [cotizacionOrigen, setCotizacionOrigen] = useState<string | null>(
    cotizacionOrigenId || initialData?.cotizacionOrigenId || initialData?.cotizacion_origen_id || null
  );
  const [depositoExoneradoCredito, setDepositoExoneradoCredito] = useState<boolean>(
    Boolean(initialData?.depositoExoneradoCredito)
  );

  // Parámetros Tributarios Multipaís (LATAM)
  const [aplicaImpuesto, setAplicaImpuesto] = useState<boolean>(() => {
    if (initialData?.aplicaImpuesto !== undefined) return Boolean(initialData.aplicaImpuesto);
    if (initialData?.aplica_impuesto !== undefined) return Boolean(initialData.aplica_impuesto);
    if (initialData?.aplicaIva !== undefined) return Boolean(initialData.aplicaIva);
    return Boolean(empresaConfig?.aplicaImpuestoDefecto ?? false);
  });

  const [tasaImpuesto, setTasaImpuesto] = useState<number>(() => {
    if (initialData?.tasaImpuesto !== undefined) return Number(initialData.tasaImpuesto);
    if (initialData?.tasa_impuesto !== undefined) return Number(initialData.tasa_impuesto);
    if (initialData?.tasaIva !== undefined) return Number(initialData.tasaIva);
    return Number(empresaConfig?.tasaImpuestoDefecto ?? 19);
  });

  const [nombreImpuesto, setNombreImpuesto] = useState<string>(() => {
    if (initialData?.nombreImpuesto) return String(initialData.nombreImpuesto);
    if (initialData?.nombre_impuesto) return String(initialData.nombre_impuesto);
    return String(empresaConfig?.nombreImpuesto || 'IVA');
  });

  const toggleAplicaImpuesto = useCallback((forzarValor?: boolean) => {
    setAplicaImpuesto(prev => forzarValor !== undefined ? forzarValor : !prev);
  }, []);

  // Estados de Control de Cartera y Desbloqueo Supervisado
  const [desbloqueoSupervisorAprobado, setDesbloqueoSupervisorAprobado] = useState<boolean>(false);
  const [pinSupervisorIngresado, setPinSupervisorIngresado] = useState<string>('');
  const [errorPinSupervisor, setErrorPinSupervisor] = useState<string | null>(null);
  const [mostrarModalDesbloqueo, setMostrarModalDesbloqueo] = useState<boolean>(false);

  const [clienteId, setClienteId] = useState<string>(String(initialData?.cliente_id || initialData?.clienteId || ''));
  const [fechaRegistro, setFechaRegistro] = useState<string>(
    initialData?.created_at ? new Date(initialData.created_at).toISOString().split('T')[0] : 
    (initialData?.createdAt ? new Date(initialData.createdAt).toISOString().split('T')[0] : todayStr)
  );

  // Rango Maestro de Fechas para todo el contrato
  const [fechaInicioContrato, setFechaInicioContrato] = useState<string>(() => {
    if (initialData?.fecha_inicio) return new Date(initialData.fecha_inicio).toISOString().split('T')[0];
    if (initialData?.fechaInicio) return new Date(initialData.fechaInicio).toISOString().split('T')[0];
    if (initialData?.detalles?.[0]?.fecha_inicio) return new Date(initialData.detalles[0].fecha_inicio).toISOString().split('T')[0];
    if (initialData?.detalles?.[0]?.fechaInicio) return new Date(initialData.detalles[0].fechaInicio).toISOString().split('T')[0];
    return todayStr;
  });

  const [fechaFinEstimadaContrato, setFechaFinEstimadaContrato] = useState<string>(() => {
    if (initialData?.fecha_fin_estimada) return new Date(initialData.fecha_fin_estimada).toISOString().split('T')[0];
    if (initialData?.fechaFinEstimada) return new Date(initialData.fechaFinEstimada).toISOString().split('T')[0];
    if (initialData?.detalles?.[0]?.fecha_fin_estimada) return new Date(initialData.detalles[0].fecha_fin_estimada).toISOString().split('T')[0];
    if (initialData?.detalles?.[0]?.fechaFinEstimada) return new Date(initialData.detalles[0].fechaFinEstimada).toISOString().split('T')[0];
    return todayStr;
  });

  const [fleteEntrega, setFleteEntrega] = useState<number>(initialData ? (initialData.flete_entrega || initialData.fleteEntrega || 0) : 30000);
  const [fleteRecogida, setFleteRecogida] = useState<number>(initialData ? (initialData.flete_recogida || initialData.fleteRecogida || 0) : 30000);
  const [deposito, setDeposito] = useState<number>(initialData ? (initialData.deposito || 0) : 50000);
  const [garantiaMonto, setGarantiaMonto] = useState<number>(initialData ? (initialData.garantia_monto || initialData.garantiaMonto || 0) : 300000);
  const [garantiaTipo, setGarantiaTipo] = useState<string>(initialData?.garantia_tipo || initialData?.garantiaTipo || 'Efectivo');
  const [observaciones, setObservaciones] = useState<string>(initialData?.observaciones || initialData?.observacionesGenerales || '');
  const [detallesLogistica, setDetallesLogistica] = useState<string>(initialData?.detalles_logistica || initialData?.detallesLogistica || '');
  const [estadoDocumento, setEstadoDocumento] = useState<'COTIZACION' | 'ACTIVO'>(initialData?.estado || 'ACTIVO');

  const [items, setItems] = useState<ItemRow[]>(() => {
    if (initialData?.detalles && initialData.detalles.length > 0) {
      return initialData.detalles.map((d: any, idx: number) => {
        const start = d.fecha_inicio ? new Date(d.fecha_inicio).toISOString().split('T')[0] : (d.fechaInicio ? new Date(d.fechaInicio).toISOString().split('T')[0] : todayStr);
        const end = d.fecha_fin_estimada ? new Date(d.fecha_fin_estimada).toISOString().split('T')[0] : (d.fechaFinEstimada ? new Date(d.fechaFinEstimada).toISOString().split('T')[0] : todayStr);
        const sDate = new Date(`${start}T00:00:00Z`);
        const eDate = new Date(`${end}T00:00:00Z`);
        const dias = Math.max(1, Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)));
        const precioDiario = d.valor_unitario || d.tarifaDiaria || d.precioDiario || d.valorUnitario || 0;
        const cant = d.cantidad || 1;
        const subtotal = d.subtotal_linea || d.subtotalLinea || (precioDiario * cant * dias);

        return {
          id: `init_${idx}_${Date.now()}`,
          lineaNumero: d.linea_numero || d.lineaNumero || idx + 1,
          itemId: String(d.equipo_id || d.itemId || ''),
          cantidad: cant,
          precioDiario,
          fechaInicio: start,
          fechaFinEstimada: end,
          dias,
          subtotal,
          subtotalPersonalizado: Boolean(d.subtotal_personalizado || d.subtotalPersonalizado),
          tarifaPersonalizada: Boolean(d.tarifa_personalizada || d.tarifaPersonalizada),
          esSubcontratado: Boolean(d.es_subcontratado || d.esSubcontratado),
          proveedorAliadoNombre: d.proveedor_aliado_nombre || d.proveedorAliadoNombre || '',
          proveedorAliadoNit: d.proveedor_aliado_nit || d.proveedorAliadoNit || '',
          costoSubcontrato: Number(d.costo_subcontrato || d.costoSubcontrato || 0),
          fechaRecepcionMuelleTercero: d.fecha_recepcion_muelle_tercero || d.fechaRecepcionMuelleTercero || '',
        };
      });
    }
    const sDate = new Date(`${fechaInicioContrato}T00:00:00Z`);
    const eDate = new Date(`${fechaFinEstimadaContrato}T00:00:00Z`);
    const dias = Math.max(1, Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)));
    return [{ 
      id: `row_0_${Date.now()}`, 
      lineaNumero: 1,
      itemId: '', 
      cantidad: 1, 
      precioDiario: 0, 
      fechaInicio: fechaInicioContrato, 
      fechaFinEstimada: fechaFinEstimadaContrato,
      dias,
      subtotal: 0,
      subtotalPersonalizado: false,
      tarifaPersonalizada: false,
      esSubcontratado: false,
      costoSubcontrato: 0
    }];
  });

  // Sincronización en cascada de fechas maestras (Poka-Yoke)
  const handleFechaInicioMasterChange = (newStart: string) => {
    setFechaInicioContrato(newStart);
    let targetEnd = fechaFinEstimadaContrato;
    if (targetEnd < newStart) {
      targetEnd = newStart;
      setFechaFinEstimadaContrato(newStart);
    }
    if (!initialData) {
      setItems(prev => prev.map(item => ({
        ...item,
        fechaInicio: newStart,
        fechaFinEstimada: targetEnd
      })));
    }
  };

  const handleFechaFinMasterChange = (newEnd: string) => {
    let targetEnd = newEnd;
    if (targetEnd < fechaInicioContrato) {
      targetEnd = fechaInicioContrato;
    }
    setFechaFinEstimadaContrato(targetEnd);
    if (!initialData) {
      setItems(prev => prev.map(item => ({
        ...item,
        fechaFinEstimada: targetEnd
      })));
    }
  };

  const initialStateStr = useMemo(() => {
    return JSON.stringify({
      tipoDocumento, clienteId, fechaRegistro, fechaInicioContrato, fechaFinEstimadaContrato,
      fleteEntrega, fleteRecogida, deposito, garantiaMonto, garantiaTipo,
      observaciones, detallesLogistica, items, estadoDocumento,
      aplicaImpuesto, tasaImpuesto
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentDataStr = JSON.stringify({
      tipoDocumento, clienteId, fechaRegistro, fechaInicioContrato, fechaFinEstimadaContrato,
      fleteEntrega, fleteRecogida, deposito, garantiaMonto, garantiaTipo,
      observaciones, detallesLogistica, items, estadoDocumento,
      aplicaImpuesto, tasaImpuesto
    });
    if (onDirtyChange) {
      onDirtyChange(currentDataStr !== initialStateStr);
    }
  }, [
    tipoDocumento, clienteId, fechaRegistro, fechaInicioContrato, fechaFinEstimadaContrato,
    fleteEntrega, fleteRecogida, deposito, garantiaMonto, garantiaTipo,
    observaciones, detallesLogistica, items, estadoDocumento,
    aplicaImpuesto, tasaImpuesto, initialStateStr, onDirtyChange
  ]);

  const addItemRow = useCallback(() => {
    const newRowId = `row_${Date.now()}_${Math.random()}`;
    setAutoFocusRowId(newRowId);
    setItems(prev => {
      const start = fechaInicioContrato;
      const end = fechaFinEstimadaContrato;
      const sDate = new Date(`${start}T00:00:00Z`);
      const eDate = new Date(`${end}T00:00:00Z`);
      const dias = Math.max(1, Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)));
      return [
        ...prev,
        { 
          id: newRowId, 
          lineaNumero: prev.length + 1,
          itemId: '', 
          cantidad: 1, 
          precioDiario: 0, 
          fechaInicio: start, 
          fechaFinEstimada: end,
          dias,
          subtotal: 0,
          subtotalPersonalizado: false,
          tarifaPersonalizada: false,
          esSubcontratado: false,
          costoSubcontrato: 0
        }
      ];
    });
  }, [fechaInicioContrato, fechaFinEstimadaContrato]);

  const segmentarItemRow = useCallback((index: number) => {
    setItems(prev => {
      const base = prev[index];
      if (!base) return prev;

      let nuevoInicio = todayStr;
      try {
        const finDate = new Date(`${base.fechaFinEstimada}T00:00:00Z`);
        finDate.setDate(finDate.getDate() + 1);
        nuevoInicio = finDate.toISOString().split('T')[0];
      } catch {
        nuevoInicio = todayStr;
      }

      const diasBase = base.dias || 7;
      let nuevoFin = nuevoInicio;
      try {
        const nuevoFinDate = new Date(`${nuevoInicio}T00:00:00Z`);
        nuevoFinDate.setDate(nuevoFinDate.getDate() + diasBase);
        nuevoFin = nuevoFinDate.toISOString().split('T')[0];
      } catch {
        nuevoFin = nuevoInicio;
      }

      const sDate = new Date(`${nuevoInicio}T00:00:00Z`);
      const eDate = new Date(`${nuevoFin}T00:00:00Z`);
      const dias = Math.max(1, Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)));
      const subtotal = Math.round((base.precioDiario || 0) * (base.cantidad || 1) * dias);

      const newRow: ItemRow = {
        id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        lineaNumero: prev.length + 1,
        itemId: base.itemId,
        cantidad: base.cantidad,
        precioDiario: base.precioDiario,
        tarifaPersonalizada: base.tarifaPersonalizada || false,
        fechaInicio: nuevoInicio,
        fechaFinEstimada: nuevoFin,
        dias,
        subtotal,
        subtotalPersonalizado: false,
        esSubcontratado: base.esSubcontratado || false,
        proveedorAliadoNombre: base.proveedorAliadoNombre,
        proveedorAliadoNit: base.proveedorAliadoNit,
        costoSubcontrato: base.costoSubcontrato,
        fechaRecepcionMuelleTercero: base.fechaRecepcionMuelleTercero,
      };

      const copia = [...prev];
      copia.splice(index + 1, 0, newRow);
      return copia.map((row, idx) => ({ ...row, lineaNumero: idx + 1 }));
    });
  }, [todayStr]);

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((it, idx) => ({ ...it, lineaNumero: idx + 1 }));
    });
  };

  const updateItemRow = (index: number, field: keyof ItemRow, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };

      const start = new Date(`${updated.fechaInicio}T00:00:00Z`);
      const end = new Date(`${updated.fechaFinEstimada}T00:00:00Z`);
      const diffMs = end.getTime() - start.getTime();
      const dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      updated.dias = dias;

      if (field === 'subtotal') {
        updated.subtotalPersonalizado = true;
        updated.tarifaPersonalizada = true;
        const sub = Math.max(0, Number(value || 0));
        updated.subtotal = sub;
        const cant = Math.max(1, Number(updated.cantidad || 1));
        if (dias > 0 && cant > 0) {
          updated.precioDiario = Math.round(sub / (cant * dias));
        }
      } else if (field === 'precioDiario') {
        updated.tarifaPersonalizada = true;
        const tarifa = Math.max(0, Number(value || 0));
        updated.precioDiario = tarifa;
        const cant = Math.max(1, Number(updated.cantidad || 1));
        if (!updated.subtotalPersonalizado) {
          updated.subtotal = Math.round(tarifa * cant * dias);
        }
      } else if (field === 'cantidad') {
        const cant = Math.max(1, Number(value || 1));
        updated.cantidad = cant;
        if (updated.subtotalPersonalizado && updated.subtotal !== undefined) {
          if (dias > 0 && cant > 0) {
            updated.precioDiario = Math.round(updated.subtotal / (cant * dias));
          }
        } else {
          updated.subtotal = Math.round((updated.precioDiario || 0) * cant * dias);
        }
      } else if (field === 'fechaInicio' || field === 'fechaFinEstimada') {
        const cant = Math.max(1, Number(updated.cantidad || 1));
        if (updated.subtotalPersonalizado && updated.subtotal !== undefined) {
          if (dias > 0 && cant > 0) {
            updated.precioDiario = Math.round(updated.subtotal / (cant * dias));
          }
        } else {
          updated.subtotal = Math.round((updated.precioDiario || 0) * cant * dias);
        }
      }

      return updated;
    }));
  };

  const resolverConflictoOverbooking = (
    accion: 'DIVIDIR' | 'AJUSTAR_FECHAS' | 'AJUSTAR_CANTIDAD',
    lineaIndex: number,
    param1?: any,
    param2?: any
  ) => {
    if (accion === 'DIVIDIR') {
      const cantDisp = Number(param1 || 0);
      const cantSub = Number(param2 || 0);
      setItems(prev => {
        const lineaOriginal = prev[lineaIndex];
        if (!lineaOriginal) return prev;

        const dias = lineaOriginal.dias || 1;
        const lineaAjustada: ItemRow = {
          ...lineaOriginal,
          cantidad: Math.max(1, cantDisp),
          subtotal: (lineaOriginal.precioDiario || 0) * Math.max(1, cantDisp) * dias,
          esSubcontratado: false,
        };

        const lineaReRent: ItemRow = {
          ...lineaOriginal,
          id: `rerent_${Date.now()}`,
          cantidad: Math.max(1, cantSub),
          subtotal: (lineaOriginal.precioDiario || 0) * Math.max(1, cantSub) * dias,
          subtotalPersonalizado: false,
          esSubcontratado: true,
          costoSubcontrato: Math.round((lineaOriginal.precioDiario || 0) * 0.75),
        };

        const copia = [...prev];
        copia[lineaIndex] = lineaAjustada;
        copia.splice(lineaIndex + 1, 0, lineaReRent);
        return copia.map((it, idx) => ({ ...it, lineaNumero: idx + 1 }));
      });
    } else if (accion === 'AJUSTAR_FECHAS') {
      const nuevaInicio = String(param1);
      setItems(prev => prev.map((it, idx) => {
        if (idx !== lineaIndex) return it;
        const dIni = new Date(`${nuevaInicio}T00:00:00Z`);
        const dFin = new Date(dIni);
        dFin.setDate(dFin.getDate() + (it.dias || 1));
        return {
          ...it,
          fechaInicio: nuevaInicio,
          fechaFinEstimada: dFin.toISOString().split('T')[0],
        };
      }));
    } else if (accion === 'AJUSTAR_CANTIDAD') {
      const nuevaCant = Math.max(1, Number(param1 || 1));
      updateItemRow(lineaIndex, 'cantidad', nuevaCant);
    }
    setIsModalOverbookingOpen(false);
    setConflictoOverbooking(null);
    setErrorMsg(null);
  };

  // Detección reactiva de stock y gestión de Subcontratación (Re-Rent)
  const verificarStockItem = useCallback((itemId: string, cantidad: number) => {
    if (!itemId) return { disponible: 0, stockInsuficiente: false, faltante: 0, equipo: null };
    const eq = equipos.find(e => String(e.id) === String(itemId));
    const disponible = Number(eq?.stock_disponible ?? eq?.stockDisponible ?? 0);
    const stockInsuficiente = cantidad > disponible;
    const faltante = stockInsuficiente ? cantidad - disponible : 0;
    return { disponible, stockInsuficiente, faltante, equipo: eq };
  }, [equipos]);

  const toggleSubcontratacionItem = (index: number, enable: boolean) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        esSubcontratado: enable,
        costoSubcontrato: enable ? (item.costoSubcontrato || Math.round((item.precioDiario || 0) * 0.75)) : 0,
        proveedorAliadoNombre: enable ? (item.proveedorAliadoNombre || '') : '',
        proveedorAliadoNit: enable ? (item.proveedorAliadoNit || '') : '',
        fechaRecepcionMuelleTercero: enable ? (item.fechaRecepcionMuelleTercero || item.fechaInicio) : '',
      };
    }));
  };

  const updateSubcontratoItem = (index: number, field: keyof ItemRow, value: any) => {
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

  const isEditMode = Boolean(initialData);

  const displayClienteNombre = selectedCliente?.nombre || initialData?.clienteNombre || initialData?.cliente?.nombre || '';
  const displayClienteNit = selectedCliente?.nit_cedula || selectedCliente?.nit || initialData?.clienteNit || initialData?.clienteDocumento || initialData?.cliente?.nit || '';
  const displayClienteTelefono = selectedCliente?.telefono || selectedCliente?.contacto || initialData?.clienteTelefono || initialData?.cliente?.telefono || '';

  // Semáforo Financiero y Evaluación de Riesgo de Cartera del Cliente
  const estadoCarteraCliente = useMemo(() => {
    if (!clienteId || !selectedCliente) {
      return {
        estadoGeneral: 'AL_DIA' as 'AL_DIA' | 'EN_MORA' | 'BLOQUEADO',
        saldoPendienteTotal: 0,
        contratosVencidosCount: 0,
        bloqueado: false,
        motivoBloqueo: '',
      };
    }

    if (selectedCliente.estado === 'Inactivo') {
      return {
        estadoGeneral: 'BLOQUEADO' as const,
        saldoPendienteTotal: 0,
        contratosVencidosCount: 0,
        bloqueado: true,
        motivoBloqueo: 'El cliente se encuentra registrado como INACTIVO en la base de datos.',
      };
    }

    const estadoDeclarado = (selectedCliente as any).estado_cartera || (selectedCliente as any).estadoCartera;
    if (estadoDeclarado === 'BLOQUEADO') {
      return {
        estadoGeneral: 'BLOQUEADO' as const,
        saldoPendienteTotal: 0,
        contratosVencidosCount: 0,
        bloqueado: true,
        motivoBloqueo: 'El cliente tiene un bloqueo preventivo directo de la gerencia comercial.',
      };
    }

    // Análisis de contratos históricos activos del cliente con saldo pendiente
    const alqsCliente = (alquileres || []).filter(
      a => String(a.cliente_id) === String(clienteId) && a.estado !== 'DEVUELTO' && a.estado !== 'CANCELADO'
    );

    let saldoTotal = 0;
    let vencidosCount = 0;

    alqsCliente.forEach(alq => {
      const saldo = Number(alq.saldo_pendiente ?? alq.saldoPendiente ?? 0);
      if (saldo > 0) {
        saldoTotal += saldo;
        const fechaFin = alq.fecha_fin_estimada || alq.fecha_vencimiento || (alq as any).fechaFinEstimada;
        if (fechaFin && fechaFin < todayStr) {
          vencidosCount++;
        }
      }
    });

    const esRiesgoAlto = selectedCliente.nivel_riesgo === 'Alto';
    const enMora = vencidosCount > 0 || estadoDeclarado === 'EN_MORA' || esRiesgoAlto;

    if (enMora) {
      const motivo = vencidosCount > 0
        ? `Cliente con ${vencidosCount} contrato(s) con saldo vencido en mora por un total de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(saldoTotal)}.`
        : esRiesgoAlto
        ? 'Cliente calificado con Nivel de Riesgo ALTO por el comité de crédito.'
        : 'Estado de cartera reportado en MORA.';

      return {
        estadoGeneral: 'EN_MORA' as const,
        saldoPendienteTotal: saldoTotal,
        contratosVencidosCount: vencidosCount,
        bloqueado: true,
        motivoBloqueo: motivo,
      };
    }

    return {
      estadoGeneral: 'AL_DIA' as const,
      saldoPendienteTotal: saldoTotal,
      contratosVencidosCount: 0,
      bloqueado: false,
      motivoBloqueo: '',
    };
  }, [clienteId, selectedCliente, alquileres, todayStr]);

  // Autorización con PIN supervisado
  const autorizarDesbloqueoSupervisor = useCallback((pin: string): boolean => {
    const pinMaster = (empresaConfig as any)?.pinSupervisor || 'FERREON2026';
    if (pin.trim() === pinMaster) {
      setDesbloqueoSupervisorAprobado(true);
      setErrorPinSupervisor(null);
      setMostrarModalDesbloqueo(false);
      setObservaciones(prev => {
        const nota = `[AUTORIZACIÓN SUPERVISOR ${todayStr}]: Formalización de contrato autorizada para cliente con observación de cartera.`;
        return prev ? `${prev}\n${nota}` : nota;
      });
      return true;
    } else {
      setErrorPinSupervisor('PIN de supervisor inválido. Consulte con gerencia.');
      return false;
    }
  }, [empresaConfig, todayStr]);

  const revocarDesbloqueoSupervisor = useCallback(() => {
    setDesbloqueoSupervisorAprobado(false);
    setPinSupervisorIngresado('');
    setErrorPinSupervisor(null);
  }, []);

  // Consistencia Temporal: Detección de fecha de inicio en pasado
  const esFechaInicioEnPasado = useMemo(() => {
    return Boolean(fechaInicioContrato && fechaInicioContrato < todayStr);
  }, [fechaInicioContrato, todayStr]);

  // Ratificación de fecha de inicio a hoy preservando los días de obra pactados
  const ratificarFechaInicioAHoy = useCallback(() => {
    const startOriginal = new Date(fechaInicioContrato);
    const endOriginal = new Date(fechaFinEstimadaContrato);
    const diffMs = endOriginal.getTime() - startOriginal.getTime();
    const duracionDias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const nuevoInicio = todayStr;
    const nuevaFechaFin = new Date();
    nuevaFechaFin.setDate(nuevaFechaFin.getDate() + duracionDias);
    const nuevoFin = nuevaFechaFin.toISOString().split('T')[0];

    setFechaInicioContrato(nuevoInicio);
    setFechaFinEstimadaContrato(nuevoFin);
    setItems(prev => prev.map(item => ({
      ...item,
      fechaInicio: nuevoInicio,
      fechaFinEstimada: nuevoFin
    })));
    setFormErrors(prev => {
      const copy = { ...prev };
      delete copy.fechaInicioContrato;
      return copy;
    });
    setErrorMsg(null);
  }, [fechaInicioContrato, fechaFinEstimadaContrato, todayStr]);

  // Subtotal de equipos con cálculo riguroso de días y soporte de subtotal personalizado
  const subtotalEquipos = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!item.itemId || !item.fechaInicio || !item.fechaFinEstimada) return acc;
      if (item.subtotalPersonalizado && item.subtotal !== undefined && item.subtotal >= 0) {
        return acc + item.subtotal;
      }
      
      const start = new Date(item.fechaInicio);
      const end = new Date(item.fechaFinEstimada);
      const diffMs = end.getTime() - start.getTime();
      const dias = item.dias || Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      return acc + ((item.precioDiario || 0) * (item.cantidad || 1) * dias);
    }, 0);
  }, [items]);

  // Cálculo de Impuestos (IVA / IGV / ITBMS) con rigor de redondeo entero
  const valorImpuesto = useMemo(() => {
    if (!aplicaImpuesto) return 0;
    return Math.round(subtotalEquipos * ((Number(tasaImpuesto) || 0) / 100));
  }, [aplicaImpuesto, subtotalEquipos, tasaImpuesto]);

  const totalFletes = (fleteEntrega || 0) + (fleteRecogida || 0);
  const totalGeneral = subtotalEquipos + totalFletes + valorImpuesto;
  const totalEstimado = Math.max(0, totalGeneral - (deposito || 0));

  // POKA-YOKE: Valor de Reposición Total para regla del 10%
  const valorReposicionTotal = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!item.itemId) return acc;
      const equipo = equiposActivos.find(e => String(e.id) === String(item.itemId));
      return acc + ((equipo?.valor_reposicion || 0) * (item.cantidad || 1));
    }, 0);
  }, [items, equiposActivos]);

  // Costo total de subcontratación y margen comercial
  const costoTotalSubcontratacion = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!item.esSubcontratado || !item.itemId) return acc;
      const start = new Date(item.fechaInicio);
      const end = new Date(item.fechaFinEstimada);
      const diffMs = end.getTime() - start.getTime();
      const dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return acc + ((Number(item.costoSubcontrato) || 0) * (item.cantidad || 1) * dias);
    }, 0);
  }, [items]);

  const margenTotalSubcontratacion = useMemo(() => {
    return subtotalEquipos - costoTotalSubcontratacion;
  }, [subtotalEquipos, costoTotalSubcontratacion]);

  const totalItemsSubcontratados = useMemo(() => {
    return items.filter(it => it.esSubcontratado).length;
  }, [items]);

  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(valor || 0));
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
      if (!fechaInicioContrato) {
        setFormErrors(prev => ({ ...prev, fechaInicioContrato: 'La fecha de inicio es requerida' }));
        return false;
      }
      if (!fechaFinEstimadaContrato) {
        setFormErrors(prev => ({ ...prev, fechaFinEstimadaContrato: 'La fecha fin estimada es requerida' }));
        return false;
      }
      if (fechaFinEstimadaContrato < fechaInicioContrato) {
        setFormErrors(prev => ({ ...prev, fechaFinEstimadaContrato: 'La fecha final no puede ser menor a la de inicio' }));
        return false;
      }

      // Regla de Consistencia Temporal (Poka-Yoke): Solo aplica a formalización de contratos
      if (tipoDocumento === 'CONTRATO' && esFechaInicioEnPasado) {
        setFormErrors(prev => ({
          ...prev,
          fechaInicioContrato: `La fecha cotizada (${fechaInicioContrato}) ya venció. Debe ratificar la fecha real de despacho en muelle.`
        }));
        setErrorMsg(`Inconsistencia temporal: La fecha de inicio (${fechaInicioContrato}) no puede estar en el pasado para un contrato formal. Por favor haga clic en "Ratificar a Fecha de Hoy" o modifíquela manualmente.`);
        return false;
      }

      // Regla de Control de Cartera: Bloqueo estricto para formalizar contratos
      if (tipoDocumento === 'CONTRATO' && estadoCarteraCliente.bloqueado && !desbloqueoSupervisorAprobado) {
        setErrorMsg(`Bloqueo de Cartera: ${estadoCarteraCliente.motivoBloqueo} Para formalizar este contrato se requiere autorización de supervisor.`);
        setMostrarModalDesbloqueo(true);
        return false;
      }
    } else if (currentStep === 2) {
      const hasEmptyItem = items.some(it => !it.itemId);
      if (hasEmptyItem) {
        setFormErrors(prev => ({ ...prev, items: 'Seleccione un equipo para cada fila' }));
        return false;
      }
      
      // La regla del colateral del 10% solo es obligatoria para contratos y cuando no haya exoneración por crédito corporativo
      if (tipoDocumento === 'CONTRATO' && !depositoExoneradoCredito) {
        const minimoRequerido = valorReposicionTotal * 0.1;
        const garantiaTotal = Number(deposito) + Number(garantiaMonto);
        if (garantiaTotal < minimoRequerido) {
          setErrorMsg(`Bloqueo de Seguridad: Se requiere un colateral (Depósito + Garantía) mínimo del 10% del valor de los equipos (${formatearCOP(minimoRequerido)}). El colateral actual es ${formatearCOP(garantiaTotal)}. Puede exonerarlo en el Paso 1 si el cliente cuenta con línea de crédito aprobada.`);
          return false;
        }
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

  // Generador inteligente de consecutivos independientes (COT-xxx / ALQ-xxx)
  const generarSiguienteConsecutivo = useCallback((tipo: 'COTIZACION' | 'CONTRATO'): string => {
    const store = useAlquilerStore.getState();
    const prefijo = tipo === 'COTIZACION' ? 'COT-' : 'ALQ-';
    let maxNum = 0;
    
    (store.alquileres || []).forEach(a => {
      const cStr = String(a.consecutivo || '');
      if (tipo === 'COTIZACION') {
        if (cStr.startsWith('COT-') || a.estado === 'COTIZACION') {
          const match = cStr.match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        }
      } else {
        if (cStr.startsWith('ALQ-') || (a.estado !== 'COTIZACION' && typeof a.consecutivo === 'number')) {
          const match = cStr.match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          } else if (typeof a.consecutivo === 'number' && a.consecutivo > maxNum) {
            maxNum = a.consecutivo;
          }
        }
      }
    });

    const nextNum = maxNum > 0 ? maxNum + 1 : (tipo === 'COTIZACION' ? 101 : 1001);
    return `${prefijo}${String(nextNum).padStart(3, '0')}`;
  }, []);

  // Payload unificado para vista previa o guardado
  const construirPayloadDocumento = (consecutivo = 'Borrador', overrideTipo?: 'COTIZACION' | 'CONTRATO') => {
    const tipoEfectivo = overrideTipo || tipoDocumento;
    const estadoEfectivo = tipoEfectivo === 'COTIZACION' ? 'COTIZACION' : (estadoDocumento === 'COTIZACION' ? 'ACTIVO' : estadoDocumento);

    const itemsConDetalles = items.map((item, idx) => {
      const equipo = equiposActivos.find(e => String(e.id) === String(item.itemId));
      const start = new Date(item.fechaInicio);
      const end = new Date(item.fechaFinEstimada);
      const diffMs = end.getTime() - start.getTime();
      const dias = item.dias || Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const subtotalLinea = item.subtotalPersonalizado && item.subtotal !== undefined
        ? item.subtotal
        : (item.precioDiario || 0) * (item.cantidad || 1) * dias;

      return {
        lineaNumero: item.lineaNumero || idx + 1,
        itemId: item.itemId,
        equipoId: item.itemId,
        nombre: equipo?.nombre || 'Equipo de Construcción',
        nombreItem: equipo?.nombre || 'Equipo de Construcción',
        codigo: (equipo as any)?.codigo || (equipo as any)?.sku || '',
        cantidad: item.cantidad,
        tarifaDiaria: item.precioDiario,
        tarifaAplicada: item.precioDiario,
        tarifaPersonalizada: Boolean(item.tarifaPersonalizada),
        fechaInicio: item.fechaInicio,
        fechaFin: item.fechaFinEstimada,
        fechaFinEstimada: item.fechaFinEstimada,
        dias,
        subtotal: subtotalLinea,
        subtotalLineaEstimado: subtotalLinea,
        subtotalPersonalizado: Boolean(item.subtotalPersonalizado),
        // Subcontratación de maquinaria (Re-Renting)
        esSubcontratado: Boolean(item.esSubcontratado),
        proveedorSubcontratadoId: (item as any).proveedorSubcontratadoId || (item as any).proveedorId || null,
        proveedorAliadoNombre: item.proveedorAliadoNombre || null,
        proveedorAliadoNit: item.proveedorAliadoNit || null,
        costoSubcontrato: Number(item.costoSubcontrato) || 0,
        costoDiarioProveedor: Number(item.costoSubcontrato || (item as any).costoDiarioProveedor || 0),
        fechaRecepcionMuelleTercero: item.fechaRecepcionMuelleTercero || null,
      };
    });

    const saldoPendienteEfectivo = tipoEfectivo === 'COTIZACION' ? 0 : totalEstimado;

    return {
      id: '',
      tipo: tipoEfectivo as 'COTIZACION' | 'CONTRATO',
      tipoDocumento: tipoEfectivo as 'COTIZACION' | 'CONTRATO',
      consecutivo,
      cotizacion_origen_id: cotizacionOrigen || null,
      cotizacionOrigenId: cotizacionOrigen || null,
      cliente_id: clienteId,
      clienteNombre: displayClienteNombre || 'Consumidor Final',
      clienteNit: displayClienteNit || 'Sin Registrar',
      clienteTelefono: displayClienteTelefono,
      flete_entrega: fleteEntrega,
      fleteEntrega,
      flete_recogida: fleteRecogida,
      fleteRecogida,
      deposito: Number(deposito || 0),
      depositoAplicado: Number(deposito || 0),
      depositoExoneradoCredito,
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
      aplicaImpuesto,
      aplica_impuesto: aplicaImpuesto,
      aplicaIva: aplicaImpuesto,
      tasaImpuesto,
      tasa_impuesto: tasaImpuesto,
      tasaIva: tasaImpuesto,
      valorImpuesto,
      valor_impuesto: valorImpuesto,
      valorIva: valorImpuesto,
      nombreImpuesto,
      total_general: totalGeneral,
      subtotalGeneral: totalGeneral,
      total: totalEstimado,
      totalPagar: totalEstimado,
      saldo_pendiente: saldoPendienteEfectivo,
      saldoPendiente: saldoPendienteEfectivo,
      costo_total_subcontratacion: costoTotalSubcontratacion,
      costoTotalSubcontratacion,
      margen_total_subcontratacion: margenTotalSubcontratacion,
      margenTotalSubcontratacion,
      totalItemsSubcontratados,
      created_at: fechaRegistro,
      fechaEmision: fechaRegistro,
      fechaInicio: fechaInicioContrato,
      fecha_inicio: fechaInicioContrato,
      fechaFinEstimada: fechaFinEstimadaContrato,
      fecha_fin_estimada: fechaFinEstimadaContrato,
      estado: estadoEfectivo,
      empresa: empresaConfig,
      formatoPapel: 'LETTER' as 'LETTER' | 'A5',
    };
  };

  const handleAbrirImpresionHTML = (formato: 'LETTER' | 'A5' = 'LETTER') => {
    const payload: any = construirPayloadDocumento(savedAlquilerData?.consecutivo || 'Borrador');
    payload.formatoPapel = formato;
    payload.empresa = empresaConfig;
    if (savedAlquilerData) {
      if (savedAlquilerData.consecutivo) payload.consecutivo = savedAlquilerData.consecutivo;
      if (savedAlquilerData.clienteNombre) payload.clienteNombre = savedAlquilerData.clienteNombre;
    }
    const htmlContent = EnterprisePDFService.generarHTMLDocumento(payload);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (printErr) {
          console.warn('[Impresión] No se pudo lanzar print() automáticamente:', printErr);
        }
      }, 350);
    } else {
      alert("Por favor habilita las ventanas emergentes para visualizar e imprimir el documento.");
    }
  };

  // Motor Transaccional Unificado para Cotización o Contrato
  const ejecutarGuardadoTransaccional = async (modo: 'COTIZACION' | 'CONTRATO'): Promise<boolean> => {
    if (isSubmitting) {
      console.warn("[useAlquilerForm] Guardado bloqueado: ya se encuentra una transacción en curso.");
      return false;
    }

    setErrorMsg(null);
    setFormErrors({});

    const validation = alquilerSchema.safeParse({
      tipoDocumento: modo,
      cotizacionOrigenId: cotizacionOrigen || undefined,
      clienteId: String(clienteId),
      fechaRegistro,
      fechaInicioContrato,
      fechaFinEstimadaContrato,
      fleteEntrega: Number(fleteEntrega) || 0,
      fleteRecogida: Number(fleteRecogida) || 0,
      deposito: Number(deposito) || 0,
      depositoExoneradoCredito,
      garantiaMonto: Number(garantiaMonto) || 0,
      garantiaTipo,
      aplicaImpuesto,
      tasaImpuesto: Number(tasaImpuesto) || 0,
      valorImpuesto,
      nombreImpuesto,
      observaciones,
      detallesLogistica,
      items: items.map(it => ({
        itemId: it.itemId,
        cantidad: Number(it.cantidad) || 1,
        precioDiario: Number(it.precioDiario) || 0,
        fechaInicio: it.fechaInicio,
        fechaFinEstimada: it.fechaFinEstimada,
        esSubcontratado: Boolean(it.esSubcontratado),
        proveedorAliadoNombre: it.proveedorAliadoNombre || undefined,
        proveedorAliadoNit: it.proveedorAliadoNit || undefined,
        costoSubcontrato: Number(it.costoSubcontrato) || 0,
        fechaRecepcionMuelleTercero: it.fechaRecepcionMuelleTercero || undefined,
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
      return false;
    }

    // Reglas estrictas exclusivas para CONTRATOS (Formalización)
    if (modo === 'CONTRATO') {
      if (estadoCarteraCliente.bloqueado && !desbloqueoSupervisorAprobado) {
        setErrorMsg(`Bloqueo de Cartera: ${estadoCarteraCliente.motivoBloqueo} Requiere anulación supervisada con PIN para emitir el contrato.`);
        setMostrarModalDesbloqueo(true);
        return false;
      }

      if (esFechaInicioEnPasado) {
        setErrorMsg(`Inconsistencia temporal: La fecha de inicio del contrato (${fechaInicioContrato}) está en el pasado. Debe ratificar la fecha real de despacho en muelle antes de formalizar.`);
        setCurrentStep(1);
        return false;
      }

      // Validar colateral mínimo solo si no está exonerado por línea de crédito corporativo
      if (!depositoExoneradoCredito) {
        const minimoRequerido = valorReposicionTotal * 0.1;
        const garantiaTotal = Number(deposito) + Number(garantiaMonto);
        if (garantiaTotal < minimoRequerido) {
          setErrorMsg(`Colateral insuficiente: Se requiere un colateral (Depósito + Garantía) mínimo del 10% del valor de reposición (${formatearCOP(minimoRequerido)}). El actual es ${formatearCOP(garantiaTotal)}.`);
          setCurrentStep(1);
          return false;
        }
      }

      // Validar disponibilidad de stock propio para items no subcontratados
      for (const it of items) {
        if (!it.esSubcontratado && it.itemId) {
          const st = verificarStockItem(it.itemId, Number(it.cantidad) || 1);
          if (st.stockInsuficiente) {
            setErrorMsg(`Stock insuficiente en bodega para "${st.equipo?.nombre || 'equipo'}": Solicitados ${it.cantidad}, disponibles ${st.disponible}. Active la subcontratación de maquinaria para suplir las unidades faltantes.`);
            setCurrentStep(2);
            return false;
          }
        }
      }
    }

    if (!idempotencyManager.processKey(idempotencyKey)) {
      console.warn("Transacción bloqueada por IdempotencyManager (doble clic detectado)");
      return false;
    }

    setIsSubmitting(true);
    setTipoDocumento(modo);

    const store = useAlquilerStore.getState();
    const previousAlquileres = [...store.alquileres];
    const bodega = useBodegaStore.getState();
    const previousBodega = [...bodega.equipos];
    const optimisticId = initialData ? initialData.id : `temp_${Date.now()}`;

    try {
      const consecutivoAsignado = initialData?.consecutivo && (initialData?.tipo === modo || initialData?.tipoDocumento === modo)
        ? initialData.consecutivo
        : generarSiguienteConsecutivo(modo);

      const alquilerUi = construirPayloadDocumento(consecutivoAsignado, modo);
      alquilerUi.id = optimisticId;
      alquilerUi.estado = modo === 'COTIZACION' ? 'COTIZACION' : 'ACTIVO';
      alquilerUi.tipo = modo;

      // REGLA DE ORO DE BODEGA: Descuento atómico solo si es CONTRATO y solo para equipos propios
      if (modo === 'CONTRATO') {
        items.forEach(it => {
          if (!it.esSubcontratado && it.itemId) {
            bodega.descontarStock(it.itemId, Number(it.cantidad) || 1);
          } else {
            console.info(`[Subcontratación Re-Rent] Equipo ${it.itemId} es de aliado (${it.proveedorAliadoNombre || 'Tercero'}). Bodega propia intacta.`);
          }
        });

        // Trazabilidad: Si formaliza una cotización previa, actualizar estado de la cotización original a FORMALIZADA
        if (cotizacionOrigen) {
          const cotExistente = store.alquileres.find(a => String(a.id) === String(cotizacionOrigen) || String(a.consecutivo) === String(cotizacionOrigen));
          if (cotExistente) {
            store.updateAlquiler({
              ...cotExistente,
              estado: 'FORMALIZADA'
            } as any);
          }
        }
      }

      if (initialData) {
        store.updateAlquiler(alquilerUi as any);
      } else {
        store.addAlquiler(alquilerUi as any);
      }

      if (initialData) {
        const result = await editarAlquilerAction({
          alquilerId: initialData.id,
          clienteId: validation.data.clienteId,
          clienteNombre: displayClienteNombre,
          fleteEntrega: validation.data.fleteEntrega,
          fleteRecogida: validation.data.fleteRecogida,
          deposito: Number(validation.data.deposito || 0),
          garantiaMonto: validation.data.garantiaMonto,
          garantiaTipo: validation.data.garantiaTipo,
          observaciones: validation.data.observaciones,
          detallesLogistica: validation.data.detallesLogistica,
          estado: modo === 'COTIZACION' ? 'COTIZACION' : 'ACTIVO',
          items: alquilerUi.detalles,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        store.sanitizeStore();
        setSavedAlquilerData(alquilerUi);
        setIsSuccess(true);
        if (onSuccess) onSuccess(alquilerUi);
        return true;
      } else {
        const result = await crearAlquilerSegmentadoAction({
          clienteId: validation.data.clienteId,
          clienteNombre: displayClienteNombre,
          fechaRegistro: validation.data.fechaRegistro,
          fleteEntrega: validation.data.fleteEntrega,
          fleteRecogida: validation.data.fleteRecogida,
          deposito: Number(validation.data.deposito || 0),
          garantiaMonto: validation.data.garantiaMonto,
          garantiaTipo: validation.data.garantiaTipo,
          observaciones: validation.data.observaciones,
          detallesLogistica: validation.data.detallesLogistica,
          estado: modo === 'COTIZACION' ? 'COTIZACION' : 'ACTIVO',
          idempotency_key: idempotencyKey,
          items: items.map((it, idx) => {
            const start = new Date(`${it.fechaInicio}T00:00:00Z`);
            const end = new Date(`${it.fechaFinEstimada}T00:00:00Z`);
            const dias = it.dias || Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            const sub = it.subtotalPersonalizado && it.subtotal !== undefined
              ? it.subtotal
              : Math.round((it.precioDiario || 0) * (it.cantidad || 1) * dias);
            return {
              lineaNumero: it.lineaNumero || idx + 1,
              itemId: it.itemId,
              nombreItem: equiposActivos.find(e => String(e.id) === String(it.itemId))?.nombre || '',
              cantidad: Number(it.cantidad) || 1,
              tarifaAplicada: Number(it.precioDiario) || 0,
              tarifaPersonalizada: Boolean(it.tarifaPersonalizada),
              fechaInicio: it.fechaInicio,
              fechaFinEstimada: it.fechaFinEstimada,
              diasContratados: dias,
              subtotalLinea: sub,
              subtotalPersonalizado: Boolean(it.subtotalPersonalizado),
              esSubcontratado: Boolean(it.esSubcontratado),
              costoDiarioProveedor: Number(it.costoSubcontrato) || 0,
            };
          }),
        });

        if (!result.success) {
          if (result.error === 'ERR_OVERBOOKING_CONCURRENTE' || result.message?.includes('ERR_OVERBOOKING_CONCURRENTE')) {
            const msg = result.message || '';
            const matchLinea = msg.match(/línea\s*#?(\d+)/i);
            const lineaConflictoNum = matchLinea ? parseInt(matchLinea[1], 10) : 1;
            const lineaIdx = Math.max(0, lineaConflictoNum - 1);
            const itemConflicto = items[lineaIdx] || items[0];
            const eq = equiposActivos.find(e => String(e.id) === String(itemConflicto?.itemId));

            const matchDemanda = msg.match(/Demanda\s*concurrente:\s*(\d+)/i);
            const matchCapacidad = msg.match(/Capacidad(?:\s*total)?:\s*(\d+)/i);
            const matchFecha = msg.match(/fecha\s*(\d{4}-\d{2}-\d{2})/i);

            const dem = matchDemanda ? parseInt(matchDemanda[1], 10) : (itemConflicto?.cantidad || 1);
            const cap = matchCapacidad ? parseInt(matchCapacidad[1], 10) : 0;
            const fConflicto = matchFecha ? matchFecha[1] : (itemConflicto?.fechaInicio || todayStr);

            setConflictoOverbooking({
              lineaIndex: lineaIdx,
              lineaNumero: lineaConflictoNum,
              equipoId: itemConflicto?.itemId || '',
              equipoNombre: eq?.nombre || 'Equipo',
              cantidadSolicitada: itemConflicto?.cantidad || dem,
              capacidadDisponible: cap,
              deficit: Math.max(1, dem - cap),
              diaPico: fConflicto,
            });
            setIsModalOverbookingOpen(true);
            setErrorMsg(`Conflicto de stock concurrente en línea #${lineaConflictoNum}: ${result.message}`);
            return false;
          }
          throw new Error(result.error || result.message);
        }

        const nuevoAlquilerDB = result.data;
        const alquilerFinal = { 
          ...alquilerUi, 
          id: nuevoAlquilerDB?.id || optimisticId, 
          consecutivo: consecutivoAsignado,
          subtotal_equipos: subtotalEquipos,
          total: totalEstimado,
          saldo_pendiente: modo === 'COTIZACION' ? 0 : totalEstimado
        };
        store.updateAlquiler(alquilerFinal as any);
        store.sanitizeStore();

        setSavedAlquilerData(alquilerFinal);
        setIsSuccess(true);
        if (onSuccess) onSuccess(alquilerFinal);
        return true;
      }
    } catch (err: any) {
      store.restoreSnapshot(previousAlquileres);
      if (modo === 'CONTRATO') {
        bodega.restoreSnapshot(previousBodega);
      }
      idempotencyManager.removeKey(idempotencyKey);
      console.error(`Error al procesar ${modo}:`, err);
      setErrorMsg(err.message || `Error al guardar ${modo.toLowerCase()}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const guardarComoCotizacion = async (): Promise<boolean> => {
    return ejecutarGuardadoTransaccional('COTIZACION');
  };

  const formalizarComoContrato = async (): Promise<boolean> => {
    return ejecutarGuardadoTransaccional('CONTRATO');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await ejecutarGuardadoTransaccional(tipoDocumento);
  };

  return {
    // Stores y catálogos
    clientes,
    equipos,
    equiposActivos,
    filteredClientes,
    selectedCliente,
    isLoadingCatalogs,
    fetchCatalogsBackground,
    
    // Identidad y Modo
    isEditMode,
    displayClienteNombre,
    displayClienteNit,
    displayClienteTelefono,
    
    // Estado del Wizard
    currentStep,
    setCurrentStep,
    isSubmitting,
    errorMsg,
    setErrorMsg,
    formErrors,
    setFormErrors,
    handleNextStep,
    handlePrevStep,
    
    // Datos del formulario y Tipo de Documento
    tipoDocumento,
    setTipoDocumento,
    cotizacionOrigen,
    setCotizacionOrigen,
    depositoExoneradoCredito,
    setDepositoExoneradoCredito,
    estadoDocumento,
    setEstadoDocumento,
    clienteId,
    setClienteId,
    clientSearchTerm,
    setClientSearchTerm,
    isClientDropdownOpen,
    setIsClientDropdownOpen,
    fechaRegistro,
    setFechaRegistro,
    fechaInicioContrato,
    fechaFinEstimadaContrato,
    handleFechaInicioMasterChange,
    handleFechaFinMasterChange,
    fleteEntrega,
    setFleteEntrega,
    fleteRecogida,
    setFleteRecogida,
    deposito,
    setDeposito,
    garantiaMonto,
    setGarantiaMonto,
    garantiaTipo,
    setGarantiaTipo,
    observaciones,
    setObservaciones,
    detallesLogistica,
    setDetallesLogistica,

    // Evaluación de Cartera y Supervisión
    estadoCarteraCliente,
    desbloqueoSupervisorAprobado,
    pinSupervisorIngresado,
    setPinSupervisorIngresado,
    errorPinSupervisor,
    setErrorPinSupervisor,
    mostrarModalDesbloqueo,
    setMostrarModalDesbloqueo,
    autorizarDesbloqueoSupervisor,
    revocarDesbloqueoSupervisor,

    // Consistencia Temporal
    esFechaInicioEnPasado,
    ratificarFechaInicioAHoy,
    
    // Items / Maquinaria y Subcontratación
    items,
    setItems,
    addItemRow,
    segmentarItemRow,
    removeItemRow,
    updateItemRow,
    verificarStockItem,
    toggleSubcontratacionItem,
    updateSubcontratoItem,
    autoFocusRowId,
    setAutoFocusRowId,
    openComboboxRowId,
    setOpenComboboxRowId,

    // Resolución de Overbooking Concurrente
    conflictoOverbooking,
    isModalOverbookingOpen,
    setIsModalOverbookingOpen,
    resolverConflictoOverbooking,
    
    // Parámetros Tributarios Multipaís (LATAM)
    aplicaImpuesto,
    setAplicaImpuesto,
    toggleAplicaImpuesto,
    tasaImpuesto,
    setTasaImpuesto,
    valorImpuesto,
    nombreImpuesto,
    setNombreImpuesto,
    
    // Totales calculados y Márgenes de Subcontratación
    subtotalEquipos,
    totalFletes,
    totalGeneral,
    totalEstimado,
    valorReposicionTotal,
    costoTotalSubcontratacion,
    margenTotalSubcontratacion,
    totalItemsSubcontratados,
    formatearCOP,
    
    // Modales y Emisión
    isCreandoCliente,
    setIsCreandoCliente,
    isCreandoEquipo,
    setIsCreandoEquipo,
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    previewPaperSize,
    setPreviewPaperSize,
    isSuccess,
    savedAlquilerData,
    construirPayloadDocumento,
    handleAbrirImpresionHTML,
    generarSiguienteConsecutivo,
    guardarComoCotizacion,
    formalizarComoContrato,
    onSubmit
  };
}
