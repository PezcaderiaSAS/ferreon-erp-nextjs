'use client';

import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Check, 
  AlertCircle, 
  CalendarDays, 
  FileSpreadsheet, 
  Package, 
  ShoppingBag, 
  Handshake, 
  ArrowLeftRight, 
  FileText, 
  Wallet, 
  CreditCard,
  Loader2
} from 'lucide-react';
import { ModuloKey, MODULOS_DISPONIBLES, obtenerModulosDefault } from '@/core/services/licencias-modulos.service';
import { toggleModuloEmpresaAction, EmpresaDirectorioItem } from '@/app/actions/ultraadmin';

interface GestionModulosModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresa: EmpresaDirectorioItem | null;
  onModuloActualizado?: (empresaId: string, modulos: Record<ModuloKey, boolean>) => void;
}

const MODULO_ICONOS: Record<ModuloKey, React.ElementType> = {
  ALQUILERES: CalendarDays,
  COTIZACIONES: FileSpreadsheet,
  BODEGA: Package,
  COMPRAS: ShoppingBag,
  CXP: CreditCard,
  CAJA: Wallet,
  DEVOLUCIONES: ArrowLeftRight,
  SUBCONTRATACIONES: Handshake,
  FACTURACION: FileText,
};

export function GestionModulosModal({
  isOpen,
  onClose,
  empresa,
  onModuloActualizado,
}: GestionModulosModalProps) {
  const [modulosState, setModulosState] = useState<Record<ModuloKey, boolean>>(() => {
    return empresa?.modulos_activos || obtenerModulosDefault();
  });
  const [loadingModulo, setLoadingModulo] = useState<ModuloKey | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sincronizar cuando cambia la empresa seleccionada
  React.useEffect(() => {
    if (empresa) {
      setModulosState(empresa.modulos_activos || obtenerModulosDefault());
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [empresa]);

  if (!isOpen || !empresa) return null;

  const handleToggle = async (moduloKey: ModuloKey) => {
    const estadoActual = modulosState[moduloKey] ?? true;
    const nuevoEstado = !estadoActual;

    setLoadingModulo(moduloKey);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Actualización optimista en UI
    const nuevoMap = { ...modulosState, [moduloKey]: nuevoEstado };
    setModulosState(nuevoMap);

    try {
      const res = await toggleModuloEmpresaAction({
        empresaId: empresa.id,
        modulo: moduloKey,
        activo: nuevoEstado,
      });

      if (res.success && res.modulos_activos) {
        setModulosState(res.modulos_activos);
        setSuccessMsg(`Módulo '${moduloKey}' ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.`);
        if (onModuloActualizado) {
          onModuloActualizado(empresa.id, res.modulos_activos);
        }
      } else {
        // Rollback optimista en caso de fallo
        setModulosState(modulosState);
        setErrorMsg(res.error || 'No se pudo actualizar el estado del módulo');
      }
    } catch (err: any) {
      setModulosState(modulosState);
      setErrorMsg(err.message || 'Error de comunicación con el servidor');
    } finally {
      setLoadingModulo(null);
    }
  };

  const modulosActivosCount = Object.values(modulosState).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera del Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-salmon/10 border border-brand-salmon/20 flex items-center justify-center text-brand-salmonDark">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Módulos del ERP (Feature Flags)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {empresa.nombre} • {empresa.nit || 'Sin NIT'} • <span className="font-semibold text-brand-salmonDark">{modulosActivosCount} de {MODULOS_DISPONIBLES.length} activos</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes de Alerta / Éxito */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700">
            <Check className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Listado de Módulos con Switches */}
        <div className="p-6 overflow-y-auto space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Control Perimetral por Tenant
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MODULOS_DISPONIBLES.map((m) => {
              const Icon = MODULO_ICONOS[m.key] || Layers;
              const isActivo = modulosState[m.key] ?? true;
              const isBusy = loadingModulo === m.key;

              return (
                <div
                  key={m.key}
                  className={`p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                    isActivo
                      ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                      : 'bg-slate-50/80 border-slate-200/60 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2.5 rounded-lg shrink-0 ${
                      isActivo 
                        ? 'bg-slate-100 text-slate-800' 
                        : 'bg-slate-200/50 text-slate-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800 truncate">
                          {m.nombre}
                        </h4>
                        {isActivo && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {m.descripcion}
                      </p>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActivo}
                    disabled={isBusy}
                    onClick={() => handleToggle(m.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:ring-offset-2 ${
                      isActivo ? 'bg-brand-salmon' : 'bg-slate-300'
                    } ${isBusy ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {isBusy ? (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-3 h-3 animate-spin text-white" />
                      </span>
                    ) : (
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isActivo ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Los cambios se invalidan de inmediato en la caché Redis del tenant.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
