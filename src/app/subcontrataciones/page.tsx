"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Handshake, Plus, Search, Filter, Printer, CheckCircle2, 
  Clock, ArrowRightLeft, TrendingUp, AlertCircle, Building2,
  Eye, RotateCcw, ShieldCheck, AlertTriangle, UserPlus
} from 'lucide-react';
import { useSubcontratacionStore, SubcontratacionUI, SubcontratacionEstado } from '../../infrastructure/state/subcontratacionStore';
import { useProveedorStore } from '../../infrastructure/state/proveedorStore';
import { obtenerSubcontratacionesAction, cambiarEstadoSubcontratacionAction } from '../actions/subcontrataciones';
import { CrearSubcontratacionModal } from '../components/subcontrataciones/CrearSubcontratacionModal';
import { OrdenSubcontratacionPDFModal } from '../components/subcontrataciones/OrdenSubcontratacionPDFModal';
import { DetalleSubcontratacionModal } from '../components/subcontrataciones/DetalleSubcontratacionModal';
import { DevolucionSubcontratacionModal } from '../components/subcontrataciones/DevolucionSubcontratacionModal';
import { CrearProveedorModal } from '../components/subcontrataciones/CrearProveedorModal';
import { formatearMonedaCOP } from '../../core/utils/numero-a-letras';
import { Button } from '@/components/ui/Button';

export default function SubcontratacionesPage() {
  const { subcontrataciones, setSubcontrataciones, actualizarEstado } = useSubcontratacionStore();
  const { proveedores, setProveedores } = useProveedorStore();

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  
  // Modales
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showCrearProveedorModal, setShowCrearProveedorModal] = useState(false);
  const [subcontratacionParaDetalle, setSubcontratacionParaDetalle] = useState<SubcontratacionUI | null>(null);
  const [subcontratacionParaPDF, setSubcontratacionParaPDF] = useState<SubcontratacionUI | null>(null);
  const [subcontratacionParaDevolucion, setSubcontratacionParaDevolucion] = useState<SubcontratacionUI | null>(null);

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

  // KPIs Financieros y Operativos
  const metrics = useMemo(() => {
    const activas = subcontrataciones.filter(s => s.estado === 'ACTIVA');
    const solicitadas = subcontrataciones.filter(s => s.estado === 'SOLICITADA' || s.estado === 'BORRADOR');
    const devueltas = subcontrataciones.filter(s => s.estado === 'DEVUELTA');
    
    const costoTotalActivo = activas.reduce((acc, s) => acc + Number(s.costoTotalEstimado || 0), 0);
    const ingresoTotalActivo = activas.reduce((acc, s) => acc + Number(s.ingresoTotalEstimado || 0), 0);
    const margenTotalActivo = activas.reduce((acc, s) => acc + Number(s.margenBrutoEstimado || 0), 0);
    
    const margenPct = ingresoTotalActivo > 0 
      ? ((margenTotalActivo / ingresoTotalActivo) * 100).toFixed(1)
      : '0.0';

    return {
      totalActivas: activas.length,
      totalSolicitadas: solicitadas.length,
      totalDevueltas: devueltas.length,
      totalRegistros: subcontrataciones.length,
      costoTotalActivo,
      ingresoTotalActivo,
      margenTotalActivo,
      margenPct
    };
  }, [subcontrataciones]);

  // Filtros dinámicos
  const subcontratacionesFiltradas = useMemo(() => {
    return subcontrataciones.filter(s => {
      const matchEstado = filtroEstado === 'TODOS' || s.estado === filtroEstado;
      const term = searchTerm.toLowerCase();
      const matchText = !searchTerm.trim() || 
        s.consecutivo.toLowerCase().includes(term) ||
        s.proveedorNombre.toLowerCase().includes(term) ||
        (s.proveedorNit && s.proveedorNit.toLowerCase().includes(term));

      return matchEstado && matchText;
    });
  }, [subcontrataciones, filtroEstado, searchTerm]);

  // Transición directa de estados
  const handleCambiarEstado = async (sub: SubcontratacionUI, nuevoEstado: SubcontratacionEstado) => {
    const confirmacion = window.confirm(`¿Confirmas cambiar el estado de la orden ${sub.consecutivo} a "${nuevoEstado}"?`);
    if (!confirmacion) return;

    actualizarEstado(sub.id, nuevoEstado);
    try {
      const res = await cambiarEstadoSubcontratacionAction({
        subcontratacionId: sub.id,
        nuevoEstado
      });
      if (!res.success) {
        alert(`Error al actualizar estado: ${res.error}`);
        fetchDatos();
      } else {
        if (subcontratacionParaDetalle?.id === sub.id) {
          setSubcontratacionParaDetalle(prev => prev ? { ...prev, estado: nuevoEstado } : null);
        }
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      fetchDatos();
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 rounded-2xl border border-amber-500/20 shadow-xs">
              <Handshake className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Subcontratación y Re-Alquiler
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Gestión de maquinaria rentada a aliados, control de márgenes en tiempo real y retorno
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowCrearProveedorModal(true)}
            className="flex items-center gap-1.5 text-xs bg-white dark:bg-slate-800 shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-amber-600" />
            <span>Nuevo Aliado</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => setShowCrearModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Subcontratación</span>
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Órdenes Activas</span>
            <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{metrics.totalActivas}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">En obra con clientes ({metrics.totalSolicitadas} solicitadas)</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costo Proveedores Activo</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">
            {formatearMonedaCOP(metrics.costoTotalActivo)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Compromiso financiero a aliados</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margen Bruto Proyectado</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">
            {formatearMonedaCOP(metrics.margenTotalActivo)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Rentabilidad promedio del {metrics.margenPct}%</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Retornos Completados</span>
            <div className="p-1.5 bg-purple-500/10 text-purple-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{metrics.totalDevueltas}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">De {metrics.totalRegistros} órdenes totales</p>
        </div>
      </div>

      {/* Barra de Filtros, Pestañas y Búsqueda */}
      <div className="p-3.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por orden, aliado o NIT..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
          />
        </div>

        {/* Pestañas Interactivas */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'TODOS', label: 'Todas', count: subcontrataciones.length },
            { id: 'ACTIVA', label: 'Activas en Obra', count: metrics.totalActivas },
            { id: 'SOLICITADA', label: 'Solicitadas', count: metrics.totalSolicitadas },
            { id: 'DEVUELTA', label: 'Devueltas', count: metrics.totalDevueltas },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filtroEstado === tab.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filtroEstado === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Subcontrataciones */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-bold">Orden / ID</th>
                <th className="py-3 px-4 font-bold">Proveedor Aliado</th>
                <th className="py-3 px-4 font-bold">Fechas Pactadas</th>
                <th className="py-3 px-4 font-bold text-right">Costo Aliado</th>
                <th className="py-3 px-4 font-bold text-right">Cobro Cliente</th>
                <th className="py-3 px-4 font-bold text-right">Margen</th>
                <th className="py-3 px-4 font-bold text-center">Estado</th>
                <th className="py-3 px-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subcontratacionesFiltradas.map((sub) => {
                const isVencida = sub.estado === 'ACTIVA' && sub.fechaDevolucionEstimada && sub.fechaDevolucionEstimada < todayStr;
                
                const margenPct = sub.ingresoTotalEstimado > 0
                  ? ((sub.margenBrutoEstimado / sub.ingresoTotalEstimado) * 100).toFixed(0)
                  : '0';

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{sub.consecutivo}</span>
                        {isVencida && (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 rounded text-[10px] font-sans font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Vencida
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{sub.proveedorNombre}</div>
                      <div className="text-[11px] text-slate-400 font-mono">NIT: {sub.proveedorNit || 'N/A'}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <div className="text-[11px]">
                        {sub.fechaEntregaEstimada} al {sub.fechaDevolucionEstimada}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {formatearMonedaCOP(sub.costoTotalEstimado)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {formatearMonedaCOP(sub.ingresoTotalEstimado)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      <div className={`font-bold ${
                        sub.margenBrutoEstimado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {formatearMonedaCOP(sub.margenBrutoEstimado)}
                      </div>
                      <div className="text-[10px] text-slate-400">{margenPct}% margen</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        sub.estado === 'ACTIVA' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200' :
                        sub.estado === 'SOLICITADA' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200' :
                        sub.estado === 'DEVUELTA' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200' :
                        sub.estado === 'CANCELADA' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {sub.estado}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Ver Detalle */}
                        <button
                          type="button"
                          onClick={() => setSubcontratacionParaDetalle(sub)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
                          title="Ver Detalle Completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Botón PDF */}
                        <button
                          type="button"
                          onClick={() => setSubcontratacionParaPDF(sub)}
                          className="p-1.5 text-amber-600 bg-amber-50 dark:bg-amber-950/40 rounded-lg hover:bg-amber-100 transition-colors"
                          title="Imprimir Orden en PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Botón Devolución / Liquidación */}
                        {sub.estado === 'ACTIVA' && (
                          <button
                            type="button"
                            onClick={() => setSubcontratacionParaDevolucion(sub)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                            title="Registrar Retorno y Liquidar"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retorno</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {subcontratacionesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Handshake className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No se encontraron órdenes de subcontratación.</p>
                    <p className="text-xs text-slate-400 mt-1">Registra una orden para tercerizar maquinaria de aliados comerciales.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación de Orden */}
      <CrearSubcontratacionModal
        isOpen={showCrearModal}
        onClose={() => setShowCrearModal(false)}
        onSuccess={(nuevaSub) => {
          fetchDatos();
          setSubcontratacionParaPDF(nuevaSub);
        }}
      />

      {/* Modal de Creación de Proveedor */}
      <CrearProveedorModal
        isOpen={showCrearProveedorModal}
        onClose={() => setShowCrearProveedorModal(false)}
        onSuccess={() => {
          fetchDatos();
        }}
      />

      {/* Modal de Detalle */}
      {subcontratacionParaDetalle && (
        <DetalleSubcontratacionModal
          isOpen={true}
          onClose={() => setSubcontratacionParaDetalle(null)}
          subcontratacion={subcontratacionParaDetalle}
          onImprimirPDF={(s) => setSubcontratacionParaPDF(s)}
          onCambiarEstado={handleCambiarEstado}
          onRegistrarDevolucion={(s) => {
            setSubcontratacionParaDetalle(null);
            setSubcontratacionParaDevolucion(s);
          }}
        />
      )}

      {/* Modal de Retorno y Devolución */}
      {subcontratacionParaDevolucion && (
        <DevolucionSubcontratacionModal
          isOpen={true}
          onClose={() => setSubcontratacionParaDevolucion(null)}
          subcontratacion={subcontratacionParaDevolucion}
          onSuccess={() => {
            fetchDatos();
          }}
        />
      )}

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
