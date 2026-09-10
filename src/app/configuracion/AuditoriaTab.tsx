"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  RefreshCw, 
  Clock, 
  User, 
  Code, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Activity,
  Layers,
  FileJson,
  X
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export interface AuditLogItem {
  id: string;
  created_at: string;
  usuario_nombre: string;
  usuario_email: string;
  usuario_rol: string;
  modulo: string;
  accion: string;
  descripcion: string;
  detalles?: Record<string, any>;
  ip_address?: string;
}

const MODULOS_FILTRO = [
  'TODOS',
  'SEGURIDAD',
  'BODEGA',
  'COMPRAS',
  'ALQUILERES',
  'DEVOLUCIONES',
  'FACTURACION',
  'CARTERA',
  'CLIENTES',
  'CONFIGURACION'
] as const;

export function AuditoriaTab() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtros y Paginación
  const [moduloSeleccionado, setModuloSeleccionado] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // Modal de Payload JSON
  const [selectedPayload, setSelectedPayload] = useState<{ accion: string; data: any } | null>(null);

  const fetchLogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');

      if (moduloSeleccionado !== 'TODOS') {
        params.set('modulo', moduloSeleccionado);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await fetch(`/api/auditoria?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.error || 'No se pudieron obtener los registros de auditoría.');
        setLogs([]);
        return;
      }

      setLogs(json.data || []);
      if (json.pagination) {
        setCurrentPage(json.pagination.page);
        setTotalPages(json.pagination.totalPages || 1);
        setTotalRegistros(json.pagination.total || 0);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de red al consultar auditoría');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [moduloSeleccionado, searchQuery]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const badgeColorModulo = (mod: string) => {
    switch (mod) {
      case 'SEGURIDAD': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'BODEGA': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'COMPRAS': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ALQUILERES': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'FACTURACION': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CARTERA': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'DEVOLUCIONES': return 'bg-sky-50 text-sky-700 border-sky-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Explicación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              Bitácora Inmutable de Auditoría & Gobernanza RBAC
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono">
                SuperAdmin Only
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Trazabilidad append-only de cada mutación de datos, compras, inventario, pagos y eventos de autenticación.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchLogs(currentPage)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          Refrescar Bitácora
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Input de Búsqueda */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por usuario, correo o descripción..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-salmon"
            />
          </form>

          {/* Estadísticas de la Consulta */}
          <div className="text-xs text-slate-500 font-medium">
            Registros encontrados: <strong className="text-slate-800">{totalRegistros}</strong>
          </div>
        </div>

        {/* Chips de Módulos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Módulo:
          </span>
          {MODULOS_FILTRO.map(mod => (
            <button
              key={mod}
              onClick={() => {
                setModuloSeleccionado(mod);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                moduloSeleccionado === mod
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Mensaje de Error / Denegación */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs">
          <Lock className="w-5 h-5 shrink-0 text-red-600" />
          <div>
            <p className="font-bold">Restricción de Acceso</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Tabla de Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-salmon" />
            <p className="text-sm">Consultando bitácora inmutable...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700">No hay registros de auditoría que coincidan</p>
            <p className="text-xs text-slate-400 mt-1">Prueba cambiando el filtro de módulo o limpiando el buscador.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Fecha & Hora</th>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4 text-center">Módulo</th>
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Descripción del Evento</th>
                  <th className="py-3 px-4 text-center">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => {
                  const fechaObj = new Date(log.created_at);
                  const fechaStr = fechaObj.toLocaleDateString('es-CO');
                  const horaStr = fechaObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{fechaStr}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {horaStr}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {log.usuario_nombre || 'Sistema'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {log.usuario_email || 'sistema@ferreon.com'}
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-mono">
                          {log.usuario_rol}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColorModulo(log.modulo)}`}>
                          {log.modulo}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {log.accion}
                        </span>
                        {log.ip_address && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            IP: {log.ip_address}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <p className="text-slate-700 leading-relaxed break-words">
                          {log.descripcion}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {log.detalles && Object.keys(log.detalles).length > 0 ? (
                          <button
                            onClick={() => setSelectedPayload({ accion: log.accion, data: log.detalles })}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-salmonDark hover:text-brand-salmon bg-brand-salmonLight/50 px-2 py-1 rounded-md transition-colors"
                          >
                            <FileJson className="w-3 h-3" />
                            JSON
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <span>
              Página {currentPage} de {totalPages} ({totalRegistros} eventos)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchLogs(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
              <button
                onClick={() => fetchLogs(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors"
              >
                Siguiente
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Visor de Payload JSON */}
      {selectedPayload && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPayload(null)}
          title={`Detalle de Auditoría: ${selectedPayload.accion}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Metadatos estructurados del cambio o transacción</span>
              <span className="font-mono text-slate-400">Content-Type: application/json</span>
            </div>

            <div className="bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl overflow-x-auto max-h-80 border border-slate-800">
              <pre>{JSON.stringify(selectedPayload.data, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedPayload(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
