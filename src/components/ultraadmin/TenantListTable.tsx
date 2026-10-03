'use client';

import React from 'react';
import { useUltraAdminStore, FiltroEstado } from '@/infrastructure/state/ultraAdminStore';
import { cn } from '@/lib/utils';
import { Shield, Building2, ExternalLink } from 'lucide-react';

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

  const filtros: { label: string; valor: FiltroEstado }[] = [
    { label: 'Todos', valor: 'TODOS' },
    { label: 'Pendientes', valor: 'PENDIENTES' },
    { label: 'Activas', valor: 'ACTIVAS' },
    { label: 'Suspendidas', valor: 'SUSPENDIDAS' },
    { label: 'Expiradas', valor: 'EXPIRADAS' },
  ];

  return (
    <div className="flex flex-col gap-3 isolate stack-isolate">
      {/* ── Barra de Pestañas Compactas Linear ────────────────────────────── */}
      <div className="flex items-center justify-between p-2 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md backdrop-blur-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Filtro:
          </span>
          {filtros.map(filtro => {
            const isActive = filtroEstado === filtro.valor;
            const count = empresas.filter(e => {
              if (filtro.valor === 'TODOS') return true;
              if (filtro.valor === 'PENDIENTES') return !e.autorizado;
              if (filtro.valor === 'ACTIVAS') return e.autorizado && e.subscription_status === 'active';
              if (filtro.valor === 'SUSPENDIDAS') return e.subscription_status === 'past_due' || e.subscription_status === 'unpaid';
              if (filtro.valor === 'EXPIRADAS') return e.estadoLicencia === 'VENCIDA';
              return true;
            }).length;

            return (
              <button
                key={filtro.valor}
                onClick={() => setFiltro(filtro.valor)}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                )}
              >
                <span>{filtro.label}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums font-bold",
                  isActive
                    ? "bg-indigo-800 text-white"
                    : "bg-slate-800 text-slate-300"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-300 font-mono pr-3 hidden sm:block font-medium">
          {empresasFiltradas.length} de {empresas.length} tenants
        </div>
      </div>

      {/* ── Tabla de Densidad Quirúrgica (~30px por fila) ───────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed text-xs">
            <colgroup>
              <col className="w-64" />
              <col className="w-44" />
              <col className="w-40" />
              <col className="w-36" />
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="h-9 border-b border-slate-800 bg-slate-950/80 text-slate-300 uppercase tracking-wider text-[11px] font-bold">
                <th className="px-3.5 py-2">Empresa / Razón Social</th>
                <th className="px-3.5 py-2">Estado SaaS</th>
                <th className="px-3.5 py-2">Licencia & Vigencia</th>
                <th className="px-3.5 py-2">Usuarios IAM</th>
                <th className="px-3.5 py-2 text-right">Gobernanza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {empresasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="grid place-items-center gap-2">
                      <Building2 className="w-8 h-8 text-slate-600" />
                      <p className="font-semibold text-slate-200">
                        No se encontraron empresas para el filtro seleccionado.
                      </p>
                      <p className="text-xs text-slate-400">
                        Ajusta el filtro superior para ver otros estados de suscripción.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                empresasFiltradas.map((empresa) => (
                  <tr
                    key={empresa.id}
                    onClick={() => abrirTenant(empresa)}
                    className="h-10 hover:bg-slate-800/60 cursor-pointer transition-colors group"
                  >
                    <td className="px-3.5 py-2 truncate">
                      <div className="font-bold text-white group-hover:text-indigo-300 transition-colors truncate text-sm">
                        {empresa.nombre}
                      </div>
                      <div className="text-xs text-slate-400 font-mono truncate">NIT: {empresa.nit || 'Sin Registrar'} • {empresa.slug}</div>
                    </td>
                    <td className="px-3.5 py-2">
                      {!empresa.autorizado ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40">
                          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
                          <span className="truncate">Pendiente (Trial)</span>
                        </span>
                      ) : empresa.subscription_status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                          <span className="truncate">Activa Oficial</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-rose-300 bg-rose-950/60 border border-rose-500/40">
                          <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                          <span className="truncate">Suspendida ({empresa.subscription_status})</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 truncate">
                      <div className={cn(
                        "text-xs font-mono tabular-nums font-bold",
                        empresa.estadoLicencia === 'VENCIDA' ? 'text-rose-400' : 
                        empresa.estadoLicencia === 'POR_VENCER' ? 'text-amber-400' : 'text-slate-200'
                      )}>
                        {empresa.diasRestantes > 0 ? `${empresa.diasRestantes} días restantes` : 'Expirada'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {empresa.subscription_ends_at 
                          ? `Vence: ${empresa.subscription_ends_at.split('T')[0]}`
                          : 'Trial 14 Días'}
                      </div>
                    </td>
                    <td className="px-3.5 py-2 font-mono tabular-nums text-slate-300">
                      <span className="font-bold text-white text-sm">{empresa.usuariosActivos}</span>
                      <span className="text-xs text-slate-400 font-normal"> / {empresa.totalUsuarios} usuarios</span>
                    </td>
                    <td className="px-3.5 py-2 text-right">
                      <button 
                        type="button"
                        className="h-7 px-3 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 inline-flex items-center gap-1.5 transition-all shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirTenant(empresa);
                        }}
                      >
                        <span>Gestionar</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
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
