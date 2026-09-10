"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Handshake, Plus, Search, Filter, Printer, CheckCircle2, 
  Clock, ArrowRightLeft, TrendingUp, AlertCircle, Building2
} from 'lucide-react';
import { useSubcontratacionStore, SubcontratacionUI } from '../../infrastructure/state/subcontratacionStore';
import { useProveedorStore } from '../../infrastructure/state/proveedorStore';
import { obtenerSubcontratacionesAction, cambiarEstadoSubcontratacionAction } from '../actions/subcontrataciones';
import { CrearSubcontratacionModal } from '../components/subcontrataciones/CrearSubcontratacionModal';
import { OrdenSubcontratacionPDFModal } from '../components/subcontrataciones/OrdenSubcontratacionPDFModal';
import { formatearMonedaCOP } from '../../core/utils/numero-a-letras';

export default function SubcontratacionesPage() {
  const { subcontrataciones, setSubcontrataciones, actualizarEstado } = useSubcontratacionStore();
  const { proveedores, setProveedores } = useProveedorStore();

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [subcontratacionParaPDF, setSubcontratacionParaPDF] = useState<SubcontratacionUI | null>(null);

  const fetchDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resSubs, resProvs] = await Promise.all([
        obtenerSubcontratacionesAction(),
        fetch('/api/proveedores', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      if (resSubs.success && Array.isArray(resSubs.data)) {
        setSubcontrataciones(resSubs.data);
      }
      if (resProvs?.data && Array.isArray(resProvs.data)) {
        setProveedores(resProvs.data);
      }
    } catch (err) {
      console.warn('Error cargando subcontrataciones:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setSubcontrataciones, setProveedores]);

  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  // KPIs
  const metrics = useMemo(() => {
    const activas = subcontrataciones.filter(s => s.estado === 'ORDENADA' || s.estado === 'RECIBIDA_EN_BODEGA' || s.estado === 'EN_CLIENTE');
    const costoTotalActivo = activas.reduce((acc, s) => acc + Number(s.costo_total_estimado || 0), 0);
    const devueltas = subcontrataciones.filter(s => s.estado === 'DEVUELTA_A_PROVEEDOR').length;

    return {
      totalActivas: activas.length,
      costoTotalActivo,
      totalDevueltas: devueltas,
      totalRegistros: subcontrataciones.length
    };
  }, [subcontrataciones]);

  // Filtros
  const subcontratacionesFiltradas = useMemo(() => {
    return subcontrataciones.filter(s => {
      const matchEstado = filtroEstado === 'TODOS' || s.estado === filtroEstado;
      const term = searchTerm.toLowerCase();
      const matchText = !searchTerm.trim() || 
        s.consecutivo.toLowerCase().includes(term) ||
        s.proveedor_nombre.toLowerCase().includes(term) ||
        s.proveedor_nit.toLowerCase().includes(term);

      return matchEstado && matchText;
    });
  }, [subcontrataciones, filtroEstado, searchTerm]);

  const handleCambiarEstado = async (id: string, nuevoEstado: SubcontratacionUI['estado']) => {
    const confirmacion = window.confirm(`¿Confirmas cambiar el estado de la orden a "${nuevoEstado}"?`);
    if (!confirmacion) return;

    actualizarEstado(id, nuevoEstado);
    try {
      const res = await cambiarEstadoSubcontratacionAction({
        subcontratacionId: id,
        nuevoEstado
      });
      if (!res.success) {
        alert(`Error al actualizar estado: ${res.error}`);
        fetchDatos();
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      fetchDatos();
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Handshake className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Subcontratación y Re-Alquiler
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Gestión de maquinaria rentada a terceros y alianzas con proveedores comerciales
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCrearModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Orden de Subcontratación</span>
        </button>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Órdenes Activas</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.totalActivas}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">En bodega o en obra con clientes</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costo Proveedores Activo</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-2">{formatearMonedaCOP(metrics.costoTotalActivo)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Inversión en maquinaria tercerizada</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Devueltas a Aliados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.totalDevueltas}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Ciclo cerrado con proveedores</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Registros</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{metrics.totalRegistros}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Historial acumulado</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por orden, proveedor o NIT..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['TODOS', 'ORDENADA', 'RECIBIDA_EN_BODEGA', 'EN_CLIENTE', 'DEVUELTA_A_PROVEEDOR'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFiltroEstado(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                filtroEstado === st
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'TODOS' ? 'Todos' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Subcontrataciones */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-bold">Orden / ID</th>
                <th className="py-3 px-4 font-bold">Proveedor Aliado</th>
                <th className="py-3 px-4 font-bold">Período Estimado</th>
                <th className="py-3 px-4 font-bold text-right">Costo Estimado</th>
                <th className="py-3 px-4 font-bold">Estado</th>
                <th className="py-3 px-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subcontratacionesFiltradas.map((sub) => {
                const badgeColor = 
                  sub.estado === 'RECIBIDA_EN_BODEGA' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                  sub.estado === 'EN_CLIENTE' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  sub.estado === 'DEVUELTA_A_PROVEEDOR' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  sub.estado === 'ORDENADA' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                  'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{sub.consecutivo}</span>
                        {sub.alquiler_id && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-sans" title="Contrato Cliente">
                            ALQ-{sub.alquiler_id}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{sub.proveedor_nombre}</div>
                      <div className="text-[11px] text-slate-400">NIT: {sub.proveedor_nit}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div className="text-[11px]">
                        {new Date(sub.fecha_recepcion_estimada).toLocaleDateString('es-CO')} al{' '}
                        {new Date(sub.fecha_devolucion_estimada).toLocaleDateString('es-CO')}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatearMonedaCOP(sub.costo_total_estimado)}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                        {sub.estado.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSubcontratacionParaPDF(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs"
                          title="Ver Orden de Subcontratación en PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-teal-700" />
                          <span>PDF</span>
                        </button>

                        {sub.estado === 'ORDENADA' && (
                          <button
                            type="button"
                            onClick={() => handleCambiarEstado(sub.id, 'RECIBIDA_EN_BODEGA')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                          >
                            Recibir en Bodega
                          </button>
                        )}

                        {sub.estado === 'RECIBIDA_EN_BODEGA' && (
                          <button
                            type="button"
                            onClick={() => handleCambiarEstado(sub.id, 'EN_CLIENTE')}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
                          >
                            Despachar a Cliente
                          </button>
                        )}

                        {(sub.estado === 'EN_CLIENTE' || sub.estado === 'RECIBIDA_EN_BODEGA') && (
                          <button
                            type="button"
                            onClick={() => handleCambiarEstado(sub.id, 'DEVUELTA_A_PROVEEDOR')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                          >
                            Devolver a Proveedor
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {subcontratacionesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Handshake className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No hay órdenes de subcontratación registradas.</p>
                    <p className="text-xs text-slate-400 mt-1">Crea una orden para gestionar maquinaria de proveedores aliados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación */}
      <CrearSubcontratacionModal
        isOpen={showCrearModal}
        onClose={() => setShowCrearModal(false)}
        onSuccess={(nuevaSub) => {
          fetchDatos();
          setSubcontratacionParaPDF(nuevaSub);
        }}
      />

      {/* Modal Visor PDF */}
      {subcontratacionParaPDF && (
        <OrdenSubcontratacionPDFModal
          isOpen={true}
          onClose={() => setSubcontratacionParaPDF(null)}
          subcontratacion={subcontratacionParaPDF}
        />
      )}
    </div>
  );
}
