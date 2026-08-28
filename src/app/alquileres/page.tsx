"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAlquilerStore } from '../../infrastructure/state/alquilerStore';
import { useEmpresaStore } from '../../infrastructure/state/empresaStore';
import { AlquilerForm } from '../../components/forms/AlquilerForm';
import { Modal } from '../../components/ui/Modal';
import { RegistrarDevolucionModal } from '../components/devoluciones/RegistrarDevolucionModal';
import { HistorialDevolucionesModal } from '../components/devoluciones/HistorialDevolucionesModal';
import { RegistrarPagoModal } from '../components/cartera/RegistrarPagoModal';
import { HistorialPagosModal } from '../components/cartera/HistorialPagosModal';
import { DetalleAlquilerModal } from '../components/alquileres/DetalleAlquilerModal';
import { TicketAlquilerModal } from '../components/alquileres/TicketAlquilerModal';
import { AlquilerUI } from '../../infrastructure/state/alquilerStore';
import { AlquilerEntity } from '../../core/domain/entities/alquiler';
import { alquilerUIToAlquilerEntity, alquilerEntityToAlquilerUI } from '../../lib/mappers';

import { registrarPagoAction } from '../actions/pagos';
import { procesarDevolucionAction } from '../actions/alquileres';
import { EnterprisePDFService } from '../../core/services/pdf-factura-generator.service';

export default function AlquileresPage() {
  const { alquileres, setAlquileres, updateAlquiler, sanitizeStore } = useAlquilerStore();
  const { config: empresaConfig } = useEmpresaStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [selectedAlquilerForDetalle, setSelectedAlquilerForDetalle] = useState<any | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Estados para Modales
  const [showDevolucionModal, setShowDevolucionModal] = useState<boolean>(false);
  const [showHistorialDevolucionesModal, setShowHistorialDevolucionesModal] = useState<boolean>(false);
  const [showPagoModal, setShowPagoModal] = useState<boolean>(false);
  const [showHistorialPagosModal, setShowHistorialPagosModal] = useState<boolean>(false);
  const [contratoActivo, setContratoActivo] = useState<any | null>(null);
  const [ticketReciente, setTicketReciente] = useState<any | null>(null);

  // Estados de Devoluciones y Pagos Mock (en el futuro deben ir en Zustand)
  const [devolucionesGlobal, setDevolucionesGlobal] = useState<any[]>([]);
  const [pagosGlobal, setPagosGlobal] = useState<any[]>([]);

  // Ordenamiento Descendente por ID y Filtro
  const alquileresFiltrados = useMemo(() => {
    let filtrados = alquileres.filter(a => {
      if (filtroEstado === 'Todos') return true;
      if (filtroEstado === 'Activos') return a.estado === 'ACTIVO';
      if (filtroEstado === 'Cotizaciones') return a.estado === 'COTIZACION';
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

  const fetchAlquileres = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/alquileres');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAlquileres(json.data.map(alquilerEntityToAlquilerUI));
      }
    } catch (e) {
      console.warn('[AlquileresPage] Error cargando contratos desde DB:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    sanitizeStore();
    fetchAlquileres();
  }, [sanitizeStore]);

  // Handlers para Acciones
  const handleRegistrarPago = async (monto: number, metodo: string, referencia: string) => {
    if (!contratoActivo) return;

    try {
      const res = await registrarPagoAction({
        alquilerId: contratoActivo.id,
        clienteId: contratoActivo.cliente_id,
        monto,
        metodoPago: metodo,
        referencia
      });

      if (!res.success) {
        alert(`Error al registrar abono: ${res.error}`);
        return;
      }

      await fetchAlquileres();
      setShowPagoModal(false);
      alert("Abono registrado y sincronizado en base de datos correctamente.");
    } catch (error: any) {
      console.error('Error al registrar pago:', error);
      alert('Ocurrió un error inesperado al registrar el pago.');
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

      await fetchAlquileres();
      setShowDevolucionModal(false);
      alert("Devolución procesada y stock restituido correctamente.");
    } catch (error: any) {
      console.error('Error al procesar devolución:', error);
      alert('Ocurrió un error inesperado al procesar la devolución.');
    }
  };


  const openAction = (contrato: AlquilerUI, action: string) => {
    // Adapter para compatibilidad temporal con modals viejos
    const adapter = {
      ...contrato,
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
      case 'EDITAR': setIsModalOpen(true); break;
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
        fechaEmision: new Date().toLocaleDateString(),
        fechaInicioGeneral: new Date(contrato.createdAt || Date.now()).toLocaleDateString(),
        clienteNombre: contrato.clienteNombre || "Cliente General",
        clienteNit: contrato.clienteDocumento || "222222222",
        items: contrato.detalles.map((d: any) => {
          const fInicio = new Date(d.fechaInicio || contrato.createdAt || Date.now()).getTime();
          const fFin = new Date(d.fechaFinEstimada || d.fechaFin || contrato.createdAt || Date.now()).getTime();
          const dias = Math.max(1, Math.ceil((fFin - fInicio) / 86400000));
          const tarifaDiaria = d.tarifaAplicada || 0;
          return {
            cantidad: d.cantidad,
            nombre: d.nombreItem || d.nombre || "Equipo",
            fechaInicio: new Date(fInicio).toLocaleDateString(),
            fechaFin: new Date(fFin).toLocaleDateString(),
            dias: dias,
            tarifaDiaria: tarifaDiaria,
            subtotal: d.subtotalLineaReal || d.subtotalLineaEstimado || (tarifaDiaria * dias * d.cantidad) || 0,
          };
        }),
        subtotalEquipos: contrato.subtotalEquiposEstimado || contrato.subtotalEquipos || 0,
        fleteEntrega: contrato.costoEnvio || 0,
        fleteRecogida: contrato.costoRecoleccion || 0,
        subtotalGeneral: contrato.subtotalGeneralEstimado || contrato.subtotalGeneral || 0,
        costosDano: contrato.detalles.reduce((acc: number, d: any) => acc + (d.costoDano || 0), 0),
        depositoAplicado: contrato.totalPagado || 0,
        totalPagar: contrato.totalEstimado || 0,
        observaciones: contrato.observacionesGenerales,
        detallesLogistica: contrato.detallesLogistica,
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
        <button 
          onClick={() => { setContratoActivo(null); setIsModalOpen(true); }}
          className="bg-brand-salmonLight text-brand-salmonDark hover:bg-brand-salmon hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm self-start md:self-end"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nuevo Contrato
        </button>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex gap-2">
            <button 
              onClick={() => setFiltroEstado('Todos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition-colors ${filtroEstado === 'Todos' ? 'bg-white text-slate-900 border-slate-200' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100'}`}
            >Todos</button>
            <button 
              onClick={() => setFiltroEstado('Activos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition-colors ${filtroEstado === 'Activos' ? 'bg-white text-slate-900 border-slate-200' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100'}`}
            >Activos</button>
            <button 
              onClick={() => setFiltroEstado('Cotizaciones')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition-colors ${filtroEstado === 'Cotizaciones' ? 'bg-white text-slate-900 border-slate-200' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100'}`}
            >Cotizaciones</button>
          </div>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-salmon focus:ring-1 focus:ring-brand-salmon transition-all" 
              placeholder="Buscar contrato..." 
              type="text"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto min-h-[400px]">
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
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 group-hover:bg-slate-200 px-2 py-0.5 rounded transition-colors">
                      #{alq.id}
                    </span>
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
                      onClick={(e) => { e.stopPropagation(); toggleDropdown(alq.id!); }}
                      className="text-slate-400 hover:text-brand-salmon transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                      title="Menú de acciones"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {activeDropdown === alq.id && (
                      <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1.5 flex flex-col text-left">
                        {alq.estado === 'COTIZACION' && (
                          <button className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-brand-salmonLight hover:text-brand-salmonDark text-left w-full">Aprobar Cotización</button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); openAction(alq, 'EDITAR'); }} className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-brand-salmonLight hover:text-brand-salmonDark text-left w-full">Editar Contrato</button>
                        <button onClick={(e) => { e.stopPropagation(); openAction(alq, 'PDF'); }} className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-brand-salmonLight hover:text-brand-salmonDark text-left w-full border-b border-slate-100">Generar PDF</button>
                        
                        <button onClick={(e) => { e.stopPropagation(); openAction(alq, 'PAGO'); }} className="px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 text-left w-full">Registrar Abono</button>
                        <button onClick={(e) => { e.stopPropagation(); openAction(alq, 'HISTORIAL_PAGOS'); }} className="px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 text-left w-full border-b border-slate-100">Historial Pagos</button>
                        
                        <button onClick={(e) => { e.stopPropagation(); openAction(alq, 'DEVOLUCION'); }} className="px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 text-left w-full">Recibir Equipos</button>
                        <button onClick={(e) => { e.stopPropagation(); openAction(alq, 'HISTORIAL_DEVOLUCIONES'); }} className="px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50 text-left w-full border-b border-slate-100">Historial Devoluciones</button>
                        
                        {alq.estado !== 'FINALIZADO' && alq.estado !== 'CANCELADO' && (
                           <button className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left w-full">Cancelar Contrato</button>
                        )}
                      </div>
                    )}
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
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setContratoActivo(null); }}
        title={contratoActivo ? "Editar Contrato de Alquiler" : "Registrar Nuevo Contrato de Alquiler"}
        maxWidth="4xl"
      >
        <AlquilerForm 
          initialData={contratoActivo}
          onSuccess={(alquiler?: any) => { 
            setIsModalOpen(false); 
            if (alquiler && !contratoActivo) {
              setTicketReciente(alquiler);
            } else {
              setContratoActivo(null); 
            }
          }} 
          onCancel={() => { setIsModalOpen(false); setContratoActivo(null); }} 
        />
      </Modal>

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
    </div>
  );
}
