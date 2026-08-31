'use client';

import { CheckCircle, CheckCircle2, AlertTriangle, Package, AlertOctagon } from 'lucide-react';


import React, { useState, useMemo } from 'react';
import { useAlquilerStore } from '../../infrastructure/state/alquilerStore';
import { useBodegaStore } from '../../infrastructure/state/bodegaStore';
import { RegistrarDevolucionModal } from '../components/devoluciones/RegistrarDevolucionModal';
import { AlquilerUI } from '../../infrastructure/state/alquilerStore';

export default function DevolucionesPage() {
  const { alquileres, updateAlquiler } = useAlquilerStore();
  const { incrementarStock } = useBodegaStore();
  
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [showDevolucionModal, setShowDevolucionModal] = useState<boolean>(false);
  const [contratoActivo, setContratoActivo] = useState<any | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Mapear contratos con equipos pendientes de retorno
  const contratosConPendientes = useMemo(() => {
    // Si hay alquileres reales en store, filtrar los que tengan equipos activos
    const activos = alquileres.filter(a => a.estado === 'ACTIVO');
    
    if (activos.length > 0) {
      return activos.map(a => ({
        id: a.id || `CTR-${a.consecutivo}`,
        consecutivo: a.consecutivo || 1,
        clienteNombre: a.clienteNombre || 'Cliente General',
        fechaEsperada: a.detalles?.[0]?.fechaFinEstimada ? new Date(a.detalles[0].fechaFinEstimada).toLocaleDateString('es-CO') : 'Hoy, 18:00',
        equiposResumen: (a.detalles || []).map(d => `${d.cantidad}x ${d.nombreItem || 'Equipo'}`).join(', ') || 'Equipos en alquiler',
        estadoRetraso: 'A tiempo',
        rawAlquiler: a,
        items: (a.detalles || []).map(d => ({
          equipoId: d.itemId,
          nombre: d.nombreItem || 'Equipo',
          cantidad: d.cantidad,
          cantidadDevuelta: d.cantidadDevuelta || 0
        }))
      }));
    }

    // Datos demostrativos iniciales si aún no se han creado contratos
    return [
      {
        id: 'CTR-2023-089',
        consecutivo: 89,
        clienteNombre: 'Constructora Mónaco',
        fechaEsperada: 'Hoy, 14:00',
        equiposResumen: '3x Andamios Tubulares, 1x Mezcladora',
        estadoRetraso: 'A tiempo',
        items: [
          { equipoId: '2', nombre: 'Andamio Tubular 2x2m', cantidad: 3, cantidadDevuelta: 0 },
          { equipoId: '1', nombre: 'Taladro Percutor 800W', cantidad: 1, cantidadDevuelta: 0 }
        ]
      },
      {
        id: 'CTR-2023-075',
        consecutivo: 75,
        clienteNombre: 'Juan Pérez',
        fechaEsperada: 'Ayer, 18:00',
        equiposResumen: '1x Taladro Percutor 800W',
        estadoRetraso: 'Retrasado',
        items: [
          { equipoId: '1', nombre: 'Taladro Percutor 800W', cantidad: 1, cantidadDevuelta: 0 }
        ]
      }
    ];
  }, [alquileres]);

  const handleOpenDevolucion = (contrato: any) => {
    setContratoActivo(contrato);
    setShowDevolucionModal(true);
  };

  const handleConfirmarDevolucion = (
    cantidades: { [equipoId: string]: number },
    danos: { [equipoId: string]: number },
    pagoDanos: { monto: number; metodo: string; referencia: string } | null
  ) => {
    if (!contratoActivo) return;

    // 1. Reintegrar stock a Bodega atómicamente (Enmienda QC2)
    Object.entries(cantidades).forEach(([equipoId, cantDevuelta]) => {
      if (cantDevuelta > 0) {
        incrementarStock(equipoId, cantDevuelta);
      }
    });

    // 2. Si es una entidad AlquilerUI viva, actualizarla
    if (contratoActivo.rawAlquiler) {
      const raw = contratoActivo.rawAlquiler;
      const contratoActualizado = Object.assign(Object.create(Object.getPrototypeOf(raw)), raw);
      let todosDevueltos = true;

      contratoActualizado.detalles = contratoActualizado.detalles.map((it: any) => {
        const cantDevueltasHoy = cantidades[it.itemId] || cantidades[it.equipoId] || 0;
        const totalDev = (it.cantidadDevuelta || 0) + cantDevueltasHoy;
        const estaDevuelto = totalDev >= it.cantidad;
        if (!estaDevuelto) todosDevueltos = false;

        return {
          ...it,
          cantidadDevuelta: totalDev,
          devuelto: estaDevuelto,
          costoDano: (it.costoDano || 0) + (danos[it.itemId] || 0),
          fechaDevolucionReal: cantDevueltasHoy > 0 ? new Date() : it.fechaDevolucionReal
        };
      });

      if (todosDevueltos && contratoActualizado.estado !== 'CANCELADO') {
        contratoActualizado.finalizar();
      }

      updateAlquiler(contratoActualizado);
    }

    setShowDevolucionModal(false);
    setFeedbackSuccess(`✓ Devolución procesada con éxito y stock reintegrado a Bodega.`);
    setTimeout(() => setFeedbackSuccess(null), 4000);
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Recepción y Devoluciones</h2>
          <p className="text-base text-slate-600 mt-1">Gestión de maquinaria retornada, inspección física y reintegro a bodega.</p>
        </div>
        {contratosConPendientes.length > 0 && (
          <button 
            onClick={() => handleOpenDevolucion(contratosConPendientes[0])}
            className="bg-brand-salmon text-white hover:bg-brand-salmonDark transition-colors px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm"
          >
            <CheckCircle className="text-[20px] w-5 h-5" />
            Procesar Devolución Rápida
          </button>
        )}
      </div>

      {feedbackSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs animate-fadeIn">
          <CheckCircle2 className="text-emerald-600 w-5 h-5" />
          <p className="text-sm font-bold">{feedbackSuccess}</p>
        </div>
      )}

      {/* Delay Summary Alert */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 shadow-sm flex items-start gap-4">
        <AlertTriangle className="text-amber-600 mt-0.5 w-5 h-5" />
        <div>
          <h3 className="text-sm font-bold text-amber-900">Alquileres pendientes por retornar a bodega</h3>
          <p className="text-xs text-amber-700 mt-0.5">Verifique el listado de contratos activos para inspeccionar el estado físico y registrar daños o devoluciones.</p>
        </div>
      </div>

      {/* Filters & Search within List */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 flex flex-col flex-1 min-h-[450px] overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex gap-2">
            <button 
              onClick={() => setFiltroEstado('Todos')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${filtroEstado === 'Todos' ? 'border border-brand-salmon text-brand-salmonDark bg-brand-salmonLight' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              Todos ({contratosConPendientes.length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">ID Contrato</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Cliente</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha Esperada</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Equipos Pendientes</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Acciones de Recepción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-sm">
              {contratosConPendientes.map((ctr) => (
                <tr 
                  key={ctr.id} 
                  onClick={() => handleOpenDevolucion(ctr)}
                  className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                    ctr.estadoRetraso === 'Retrasado' ? 'bg-red-50/20 border-l-4 border-l-red-500' : ''
                  }`}
                >
                  <td className="py-4 px-4 font-mono text-xs font-bold text-slate-700">
                    <span className="bg-slate-100 group-hover:bg-slate-200 px-2 py-1 rounded-md transition-colors">
                      #{ctr.id}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-900">
                    {ctr.clienteNombre}
                  </td>
                  <td className="py-4 px-4 text-xs font-medium text-slate-600">
                    {ctr.fechaEsperada}
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-700 font-medium">
                    {ctr.equiposResumen}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                      ctr.estadoRetraso === 'Retrasado' ? 'bg-red-100 text-red-800' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {ctr.estadoRetraso}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDevolucion(ctr);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-xs font-bold rounded-lg transition-colors border border-emerald-200/60 shadow-xs"
                        title="Recibir equipos y reintegrar stock"
                      >
                        <Package className="text-[16px] w-5 h-5" />
                        <span>Recibir Equipos</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDevolucion(ctr);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 text-xs font-bold rounded-lg transition-colors border border-red-200/60 shadow-xs"
                        title="Reportar daños o averías"
                      >
                        <AlertOctagon className="text-[16px] w-5 h-5" />
                        <span>Daños</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {contratosConPendientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="text-4xl text-slate-300 mb-2 block w-5 h-5" />
                    No hay devoluciones pendientes en este momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Registrar Devolución y Daños */}
      <RegistrarDevolucionModal
        isOpen={showDevolucionModal}
        onClose={() => {
          setShowDevolucionModal(false);
          setContratoActivo(null);
        }}
        contratoParaDevolucion={contratoActivo}
        onConfirmarDevolucion={handleConfirmarDevolucion}
      />
    </div>
  );
}

