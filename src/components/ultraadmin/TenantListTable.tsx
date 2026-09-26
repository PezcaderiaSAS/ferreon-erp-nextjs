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
      <div className="flex items-center justify-between p-1.5 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-none">
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-2">
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
                  "h-7 px-2.5 rounded-sm text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-none"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                )}
              >
                <span>{filtro.label}</span>
                <span className={cn(
                  "px-1 rounded text-[10px] font-mono tabular-nums",
                  isActive
                    ? "bg-zinc-700 text-zinc-100 dark:bg-zinc-300 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-zinc-400 font-mono pr-2 hidden sm:block">
          {empresasFiltradas.length} de {empresas.length} tenants
        </div>
      </div>

      {/* ── Tabla de Densidad Quirúrgica (~30px por fila) ───────────────────── */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-none overflow-hidden">
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
              <tr className="h-7.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                <th className="px-2.5 py-1">Empresa / Razón Social</th>
                <th className="px-2.5 py-1">Estado SaaS</th>
                <th className="px-2.5 py-1">Licencia & Vigencia</th>
                <th className="px-2.5 py-1">Usuarios IAM</th>
                <th className="px-2.5 py-1 text-right">Gobernanza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {empresasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    <div className="grid place-items-center gap-2">
                      <Building2 className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">
                        No se encontraron empresas para el filtro seleccionado.
                      </p>
                      <p className="text-[11px] text-zinc-400">
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
                    className="h-7.5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-2.5 py-1 truncate">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {empresa.nombre}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono truncate">NIT: {empresa.nit || 'Sin Registrar'} • {empresa.slug}</div>
                    </td>
                    <td className="px-2.5 py-1">
                      {!empresa.autorizado ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          <span className="truncate">Pendiente (Trial)</span>
                        </span>
                      ) : empresa.subscription_status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="truncate">Activa Oficial</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                          <span className="truncate">Suspendida ({empresa.subscription_status})</span>
                        </span>
                      )}
                    </td>
                    <td className="px-2.5 py-1 truncate">
                      <div className={cn(
                        "text-[11px] font-mono tabular-nums font-medium",
                        empresa.estadoLicencia === 'VENCIDA' ? 'text-rose-600 dark:text-rose-400' : 
                        empresa.estadoLicencia === 'POR_VENCER' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-300'
                      )}>
                        {empresa.diasRestantes > 0 ? `${empresa.diasRestantes} días restantes` : 'Expirada'}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {empresa.subscription_ends_at 
                          ? `Vence: ${empresa.subscription_ends_at.split('T')[0]}`
                          : 'Trial 14 Días'}
                      </div>
                    </td>
                    <td className="px-2.5 py-1 font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{empresa.usuariosActivos}</span>
                      <span className="text-[10px] text-zinc-400"> / {empresa.totalUsuarios} usuarios</span>
                    </td>
                    <td className="px-2.5 py-1 text-right">
                      <button 
                        type="button"
                        className="h-6 px-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-sm border border-zinc-200 dark:border-zinc-700 inline-flex items-center gap-1 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirTenant(empresa);
                        }}
                      >
                        <span>Gestionar</span>
                        <ExternalLink className="w-3 h-3 text-zinc-400" />
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
