import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  KeyRound, 
  RefreshCw, 
  CreditCard,
  FileText
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { formatearMonedaConLetras } from '../../../core/utils/numero-a-letras';

export interface StepClienteGarantiasProps {
  isEditMode: boolean;
  tipoDocumento?: 'COTIZACION' | 'CONTRATO';
  setTipoDocumento?: (val: 'COTIZACION' | 'CONTRATO') => void;
  estadoDocumento: 'COTIZACION' | 'ACTIVO';
  setEstadoDocumento: (val: 'COTIZACION' | 'ACTIVO') => void;
  cotizacionOrigen?: string | null;
  clienteId: string;
  setClienteId: (val: string) => void;
  selectedCliente: any;
  displayClienteNombre: string;
  displayClienteNit: string;
  displayClienteTelefono: string;
  clientSearchTerm: string;
  setClientSearchTerm: (val: string) => void;
  isClientDropdownOpen: boolean;
  setIsClientDropdownOpen: (val: boolean) => void;
  filteredClientes: any[];
  isLoadingCatalogs: boolean;
  setIsCreandoCliente: (val: boolean) => void;
  fechaRegistro: string;
  setFechaRegistro: (val: string) => void;
  fechaInicioContrato: string;
  fechaFinEstimadaContrato: string;
  handleFechaInicioMasterChange: (val: string) => void;
  handleFechaFinMasterChange: (val: string) => void;
  esFechaInicioEnPasado?: boolean;
  ratificarFechaInicioAHoy?: () => void;
  garantiaTipo: string;
  setGarantiaTipo: (val: string) => void;
  garantiaMonto: number;
  setGarantiaMonto: (val: number) => void;
  deposito: number;
  setDeposito: (val: number) => void;
  depositoExoneradoCredito?: boolean;
  setDepositoExoneradoCredito?: (val: boolean) => void;
  estadoCarteraCliente?: {
    estadoGeneral: 'AL_DIA' | 'EN_MORA' | 'BLOQUEADO';
    saldoPendienteTotal: number;
    contratosVencidosCount: number;
    bloqueado: boolean;
    motivoBloqueo: string;
  };
  desbloqueoSupervisorAprobado?: boolean;
  mostrarModalDesbloqueo?: boolean;
  setMostrarModalDesbloqueo?: (val: boolean) => void;
  pinSupervisorIngresado?: string;
  setPinSupervisorIngresado?: (val: string) => void;
  errorPinSupervisor?: string | null;
  autorizarDesbloqueoSupervisor?: (pin: string) => boolean;
  revocarDesbloqueoSupervisor?: () => void;
  formErrors: { [key: string]: string };
}

export const StepClienteGarantias: React.FC<StepClienteGarantiasProps> = ({
  isEditMode,
  tipoDocumento = 'COTIZACION',
  setTipoDocumento,
  estadoDocumento,
  setEstadoDocumento,
  cotizacionOrigen,
  clienteId,
  setClienteId,
  selectedCliente,
  displayClienteNombre,
  displayClienteNit,
  displayClienteTelefono,
  clientSearchTerm,
  setClientSearchTerm,
  isClientDropdownOpen,
  setIsClientDropdownOpen,
  filteredClientes,
  isLoadingCatalogs,
  setIsCreandoCliente,
  fechaRegistro,
  setFechaRegistro,
  fechaInicioContrato,
  fechaFinEstimadaContrato,
  handleFechaInicioMasterChange,
  handleFechaFinMasterChange,
  esFechaInicioEnPasado = false,
  ratificarFechaInicioAHoy,
  garantiaTipo,
  setGarantiaTipo,
  garantiaMonto,
  setGarantiaMonto,
  deposito,
  setDeposito,
  depositoExoneradoCredito = false,
  setDepositoExoneradoCredito,
  estadoCarteraCliente,
  desbloqueoSupervisorAprobado = false,
  mostrarModalDesbloqueo = false,
  setMostrarModalDesbloqueo,
  pinSupervisorIngresado = '',
  setPinSupervisorIngresado,
  errorPinSupervisor,
  autorizarDesbloqueoSupervisor,
  revocarDesbloqueoSupervisor,
  formErrors,
}) => {
  const [localPin, setLocalPin] = useState('');

  const handleSelectTipo = (tipo: 'COTIZACION' | 'CONTRATO') => {
    if (setTipoDocumento) {
      setTipoDocumento(tipo);
    }
    setEstadoDocumento(tipo === 'COTIZACION' ? 'COTIZACION' : 'ACTIVO');
  };

  const handleEjecutarAutorizacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (autorizarDesbloqueoSupervisor) {
      const pinUsar = pinSupervisorIngresado || localPin;
      const ok = autorizarDesbloqueoSupervisor(pinUsar);
      if (ok) {
        setLocalPin('');
      }
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Selector de Tipo de Documento y Trazabilidad */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Tipo de Documento Operativo</span>
            </h3>
            {cotizacionOrigen && (
              <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>Origen: {cotizacionOrigen}</span>
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">Paso 1 de 3</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1 bg-slate-100/70 rounded-xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => handleSelectTipo('COTIZACION')}
            className={`py-2.5 px-3 text-left rounded-lg transition-all cursor-pointer ${
              tipoDocumento === 'COTIZACION'
                ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/80 ring-1 ring-indigo-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <span>📝</span>
                <span>Cotización / Presupuesto</span>
              </span>
              {tipoDocumento === 'COTIZACION' && (
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-200/60">
                  Activo (Sin Reserva)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Propuesta formal informativa. Cero impacto en inventario de bodega.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTipo('CONTRATO')}
            className={`py-2.5 px-3 text-left rounded-lg transition-all cursor-pointer ${
              tipoDocumento === 'CONTRATO'
                ? 'bg-white text-teal-900 shadow-sm border border-slate-200/80 ring-1 ring-teal-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <span>📄</span>
                <span>Contrato de Alquiler</span>
              </span>
              {tipoDocumento === 'CONTRATO' && (
                <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-1.5 py-0.2 rounded border border-teal-200/60">
                  Formal (Descuenta Stock)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Descuenta equipos propios en bodega y formaliza obligaciones de pago.
            </p>
          </button>
        </div>
      </div>

      {/* 2. Identificación del Cliente y Fechas Maestras */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-600" />
          <span>Cliente y Cronograma General</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector de Cliente */}
          <div className="flex flex-col gap-1.5 relative">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">
                {isEditMode ? "Cliente Vinculado (Solo Lectura)" : "Cliente / Razón Social *"}
              </label>
              {!isEditMode && (
                <button 
                  type="button" 
                  onClick={() => setIsCreandoCliente(true)} 
                  className="text-[11px] bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-full font-bold hover:bg-teal-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  <span>+ Nuevo Cliente</span>
                </button>
              )}
            </div>

            {isEditMode ? (
              <div className="p-3 bg-slate-50/80 border border-slate-200/90 rounded-xl flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {displayClienteNombre || 'Cliente vinculado'}
                      </span>
                      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-medium shrink-0">
                        Bloqueado
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>NIT: {displayClienteNit || 'S/N'}</span>
                      {displayClienteTelefono && <span>• Tel: {displayClienteTelefono}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-400 bg-slate-100 rounded-lg shrink-0 ml-2">
                  <Lock className="w-3 h-3" />
                  Fijo
                </div>
              </div>
            ) : (
              selectedCliente && !isClientDropdownOpen ? (
                <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-teal-600/15 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                      <User className="w-4 h-4 text-teal-700" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">{selectedCliente.nombre}</div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">NIT: {selectedCliente.nit_cedula || selectedCliente.nit || 'S/N'}</span>
                        {(selectedCliente.telefono || selectedCliente.contacto) && (
                          <span>• Tel: {selectedCliente.telefono || selectedCliente.contacto}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsClientDropdownOpen(true);
                      setClientSearchTerm('');
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-teal-800 hover:bg-teal-100 rounded-lg transition-colors shrink-0 ml-2 cursor-pointer"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Escriba nombre o NIT para buscar..."
                    value={clientSearchTerm}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setIsClientDropdownOpen(true);
                    }}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/25 focus:border-teal-600 outline-none transition-all"
                  />
                  {isClientDropdownOpen && (
                    <div className="absolute z-30 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {filteredClientes.map(c => (
                        <div 
                          key={c.id} 
                          className="px-3.5 py-2.5 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 cursor-pointer flex justify-between items-center transition-colors"
                          onClick={() => {
                            setClienteId(String(c.id));
                            setClientSearchTerm('');
                            setIsClientDropdownOpen(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{c.nombre}</span>
                            <span className="text-[10px] text-slate-400">{c.telefono || c.contacto || ''}</span>
                          </div>
                          <span className="text-slate-600 text-[11px] bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                            NIT: {c.nit_cedula || c.nit}
                          </span>
                        </div>
                      ))}
                      {filteredClientes.length === 0 && (
                        <div className="px-4 py-4 text-xs text-slate-400 text-center flex flex-col items-center gap-1.5">
                          <span>{isLoadingCatalogs ? "Cargando clientes..." : "No se encontraron clientes coincidentes."}</span>
                          <button 
                            type="button" 
                            onClick={() => setIsCreandoCliente(true)} 
                            className="text-xs text-teal-700 font-bold hover:underline cursor-pointer"
                          >
                            + Crear nuevo cliente ahora
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
            {formErrors.clienteId && <span className="text-[11px] text-rose-600 font-semibold">{formErrors.clienteId}</span>}
          </div>

          {/* Fecha de Registro / Emisión */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Fecha de Registro *</label>
            <input 
              type="date" 
              value={fechaRegistro}
              onChange={(e) => setFechaRegistro(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/25 focus:border-teal-600 outline-none transition-all" 
            />
            {formErrors.fechaRegistro && <span className="text-[11px] text-rose-600 font-semibold">{formErrors.fechaRegistro}</span>}
          </div>
        </div>

        {/* SEMÁFORO FINANCIERO Y CARTERA DEL CLIENTE */}
        {clienteId && estadoCarteraCliente && (
          <div className="pt-2">
            {estadoCarteraCliente.estadoGeneral === 'AL_DIA' && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Cartera al Día:</span>
                    <span className="ml-1 text-emerald-800">
                      Cliente sin obligaciones en mora. Habilitado para formalización inmediata de contratos.
                    </span>
                  </div>
                </div>
                <span className="text-[10.5px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">
                  Riesgo Apto
                </span>
              </div>
            )}

            {estadoCarteraCliente.estadoGeneral === 'EN_MORA' && (
              <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-900">Atención de Cartera (MORA):</span>
                      <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                        {estadoCarteraCliente.contratosVencidosCount > 0 ? `${estadoCarteraCliente.contratosVencidosCount} Contratos Vencidos` : 'Riesgo Alto'}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      {estadoCarteraCliente.motivoBloqueo}
                    </p>
                    {tipoDocumento === 'COTIZACION' ? (
                      <p className="text-[10.5px] text-amber-700 italic mt-0.5">
                        ℹ️ Puede emitir la cotización informativa, pero requerirá PIN de supervisor al formalizar el contrato.
                      </p>
                    ) : (
                      <p className="text-[10.5px] text-rose-700 font-bold mt-0.5">
                        🛑 Formalización de contrato bloqueada preventivamente sin autorización gerencial.
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  {desbloqueoSupervisorAprobado ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Desbloqueo Supervisado Aprobado</span>
                      </span>
                      {revocarDesbloqueoSupervisor && (
                        <button
                          type="button"
                          onClick={revocarDesbloqueoSupervisor}
                          className="text-[10.5px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                        >
                          Revocar
                        </button>
                      )}
                    </div>
                  ) : (
                    tipoDocumento === 'CONTRATO' && setMostrarModalDesbloqueo && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setMostrarModalDesbloqueo(true)}
                        className="bg-amber-600 text-white hover:bg-amber-700 border-amber-700 text-xs flex items-center gap-1.5 py-1.5 px-3"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Autorizar con PIN</span>
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}

            {estadoCarteraCliente.estadoGeneral === 'BLOQUEADO' && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-950">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-900">Cliente Bloqueado por Administración:</span>
                      <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-bold">
                        Restricción Total
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      {estadoCarteraCliente.motivoBloqueo}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  {desbloqueoSupervisorAprobado ? (
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Anulación Autorizada</span>
                    </span>
                  ) : (
                    setMostrarModalDesbloqueo && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setMostrarModalDesbloqueo(true)}
                        className="bg-rose-600 text-white hover:bg-rose-700 border-rose-700 text-xs flex items-center gap-1.5 py-1.5 px-3"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Desbloqueo Especial</span>
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cronograma Maestro: Propagación en Cascada y Poka-Yoke Temporal */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-teal-50/40 p-4 rounded-xl border border-teal-100/70">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              <span>Fecha Inicio del Alquiler *</span>
            </label>
            <input 
              type="date" 
              value={fechaInicioContrato}
              onChange={(e) => handleFechaInicioMasterChange(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-teal-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all font-medium shadow-2xs" 
            />
            {formErrors.fechaInicioContrato && (
              <span className="text-[11px] text-rose-600 font-semibold">{formErrors.fechaInicioContrato}</span>
            )}
            <span className="text-[10.5px] text-teal-700">Se asigna como fecha de arranque inicial a cada equipo</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              <span>Fecha Fin Estimada *</span>
            </label>
            <input 
              type="date" 
              value={fechaFinEstimadaContrato}
              min={fechaInicioContrato}
              onChange={(e) => handleFechaFinMasterChange(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-teal-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all font-medium shadow-2xs" 
            />
            {formErrors.fechaFinEstimadaContrato && (
              <span className="text-[11px] text-rose-600 font-semibold">{formErrors.fechaFinEstimadaContrato}</span>
            )}
            <span className="text-[10.5px] text-teal-700">Calcula automáticamente el estimado de días para la cotización</span>
          </div>

          {/* ALERTA DE CONSISTENCIA TEMPORAL: FECHA EN PASADO */}
          {tipoDocumento === 'CONTRATO' && esFechaInicioEnPasado && (
            <div className="sm:col-span-2 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-950 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">Fecha Cotizada Vencida:</span>
                  <span className="ml-1 text-amber-900">
                    La fecha de arranque cotizada ({fechaInicioContrato}) está en el pasado. Los despachos en muelle deben registrar fecha actual o futura.
                  </span>
                </div>
              </div>
              {ratificarFechaInicioAHoy && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={ratificarFechaInicioAHoy}
                  className="bg-amber-600 text-white hover:bg-amber-700 border-amber-700 text-xs shrink-0 flex items-center gap-1 py-1 px-2.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Ratificar a Hoy</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Colateral y Garantía de Respaldo */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Garantía y Anticipo de Seguridad</span>
          </h3>

          {/* Opción de Línea de Crédito Corporativo */}
          {setDepositoExoneradoCredito && (
            <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 p-2 rounded-xl border border-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={depositoExoneradoCredito}
                onChange={(e) => setDepositoExoneradoCredito(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cliente Corporativo a Crédito (Exonerar Depósito)</span>
              </span>
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Tipo de Respaldo</label>
            <select 
              value={garantiaTipo}
              onChange={(e) => setGarantiaTipo(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/25 focus:border-teal-600 outline-none transition-all"
            >
              <option value="Efectivo">Efectivo en Custodia</option>
              <option value="Pagaré">Pagaré Firmado</option>
              <option value="Transferencia">Transferencia Bancaria</option>
              <option value="Cheque">Cheque de Gerencia</option>
              <option value="Línea de Crédito">Línea de Crédito Aprobada</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Monto de Garantía / Póliza ($ COP)</label>
            <input 
              type="number" 
              min={0}
              value={garantiaMonto}
              onChange={(e) => setGarantiaMonto(parseFloat(e.target.value) || 0)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 text-right font-mono tabular-nums focus:bg-white focus:ring-2 focus:ring-teal-600/25 focus:border-teal-600 outline-none transition-all" 
            />
            <span className="text-[10.5px] text-emerald-800 font-medium truncate">
              {formatearMonedaConLetras(garantiaMonto)}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Depósito / Abono Inicial ($ COP)</label>
              {depositoExoneradoCredito && (
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-200/60">
                  Exonerado
                </span>
              )}
            </div>
            <input 
              type="number" 
              min={0}
              disabled={depositoExoneradoCredito}
              value={depositoExoneradoCredito ? 0 : deposito}
              onChange={(e) => setDeposito(parseFloat(e.target.value) || 0)}
              className={`px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm text-right font-mono tabular-nums outline-none transition-all ${
                depositoExoneradoCredito
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/25 focus:border-teal-600'
              }`}
            />
            <span className="text-[10.5px] text-teal-800 font-medium truncate">
              {depositoExoneradoCredito 
                ? 'Exonerado bajo línea de crédito corporativo aprobada' 
                : formatearMonedaConLetras(deposito)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. MODAL ERGONÓMICO DE DESBLOQUEO SUPERVISADO */}
      {setMostrarModalDesbloqueo && (
        <Modal
          isOpen={mostrarModalDesbloqueo}
          onClose={() => setMostrarModalDesbloqueo(false)}
          title="Autorización de Supervisión Comercial"
          maxWidth="md"
        >
          <form onSubmit={handleEjecutarAutorizacion} className="space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Anulación de Restricción de Cartera:</span>
                <p className="mt-1 text-amber-800">
                  El cliente presenta compromisos en mora o bloqueo preventivo ({estadoCarteraCliente?.motivoBloqueo}). Para formalizar el contrato se requiere ingresar el PIN de autorización gerencial.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">PIN de Autorización del Supervisor *</label>
              <input
                type="password"
                autoFocus
                placeholder="Ingrese PIN institucional..."
                value={pinSupervisorIngresado || localPin}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalPin(val);
                  if (setPinSupervisorIngresado) setPinSupervisorIngresado(val);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/25 focus:border-teal-600 outline-none transition-all font-mono tracking-widest text-center"
              />
              {errorPinSupervisor && (
                <span className="text-xs text-rose-600 font-semibold">{errorPinSupervisor}</span>
              )}
            </div>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMostrarModalDesbloqueo(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Autorizar Contrato</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
