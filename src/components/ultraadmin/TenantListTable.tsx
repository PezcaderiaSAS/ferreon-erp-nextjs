'use client';

import React from 'react';
import { useUltraAdminStore, FiltroEstado } from '@/infrastructure/state/ultraAdminStore';

export function TenantListTable() {
  const { empresas, filtroEstado, setFiltro, abrirTenant } = useUltraAdminStore();

  const empresasFiltradas = React.useMemo(() => {
    return empresas.filter(empresa => {
      if (filtroEstado === 'TODOS') return true;
      if (filtroEstado === 'PENDIENTES') return !empresa.autorizado;
      if (filtroEstado === 'ACTIVAS') return empresa.autorizado && empresa.subscription_status === 'active';
      if (filtroEstado === 'SUSPENDIDAS') return empresa.subscription_status === 'past_due' || empresa.subscription_status === 'unpaid';
      if (filtroEstado === 'EXPIRADAS') return empresa.estadoLicencia === 'VENCIDA';
      return true;
    });
  }, [empresas, filtroEstado]);

  const filtros: { label: string; valor: FiltroEstado; color: string }[] = [
    { label: 'Todos', valor: 'TODOS', color: 'bg-indigo-600 text-white' },
    { label: 'Pendientes de Aprobación', valor: 'PENDIENTES', color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
    { label: 'Activas', valor: 'ACTIVAS', color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
    { label: 'Suspendidas', valor: 'SUSPENDIDAS', color: 'bg-rose-500/20 text-rose-300 border border-rose-500/30' },
    { label: 'Expiradas', valor: 'EXPIRADAS', color: 'bg-slate-700 text-slate-300 border border-slate-600' },
  ];

  return (
    <div className="space-y-4">
      {/* Pills de Filtrado */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filtro Rápido:</span>
        {filtros.map(filtro => (
          <button
            key={filtro.valor}
            onClick={() => setFiltro(filtro.valor)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroEstado === filtro.valor
                ? 'ring-2 ring-indigo-500 shadow-md shadow-indigo-500/20 ' + filtro.color
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/80'
            }`}
          >
            {filtro.label}
          </button>
        ))}
      </div>

      {/* Tabla con estilo Glassmorphic */}
      <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Empresa / Razón Social</th>
                <th className="py-3.5 px-4">Estado SaaS</th>
                <th className="py-3.5 px-4">Licencia & Vigencia</th>
                <th className="py-3.5 px-4">Usuarios IAM</th>
                <th className="py-3.5 px-4 text-right">Gobernanza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {empresasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                    No se encontraron empresas para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                empresasFiltradas.map((empresa) => (
                  <tr
                    key={empresa.id}
                    onClick={() => abrirTenant(empresa)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {empresa.nombre}
                      </div>
                      <div className="text-xs text-slate-400">NIT: {empresa.nit || 'Sin Registrar'} • {empresa.slug}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {!empresa.autorizado ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Pendiente Autorización (Trial)
                        </span>
                      ) : empresa.subscription_status === 'active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Activa Oficial
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Suspendida ({empresa.subscription_status})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className={`text-xs font-bold ${
                        empresa.estadoLicencia === 'VENCIDA' ? 'text-rose-400' : 
                        empresa.estadoLicencia === 'POR_VENCER' ? 'text-amber-400' : 'text-slate-200'
                      }`}>
                        {empresa.diasRestantes > 0 ? `${empresa.diasRestantes} días restantes` : 'Expirada'}
                      </div>
                      <div className="text-2xs text-slate-400">
                        {empresa.subscription_ends_at 
                          ? `Vence: ${empresa.subscription_ends_at.split('T')[0]}`
                          : 'Trial 14 Días'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-bold text-white">{empresa.usuariosActivos} activos</div>
                      <div className="text-2xs text-slate-400">{empresa.totalUsuarios} registrados</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirTenant(empresa);
                        }}
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
