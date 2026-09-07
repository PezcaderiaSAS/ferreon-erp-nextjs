import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { NeuStepper } from '../../../components/ui/neumorphism/NeuStepper';
import { NeuToggle } from '../../../components/ui/neumorphism/NeuToggle';
import { Button } from '../../../components/ui/Button';

export interface NeuDevolucionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  contrato: any | null;
  onConfirm: (payload: {
    cantidadesBuenas: { [equipoId: string]: number };
    cantidadesMalas: { [equipoId: string]: number };
    cantidadesExtraviadas: { [equipoId: string]: number };
    danos: { [equipoId: string]: number };
    valoresReposicion: { [equipoId: string]: number };
    fechaDevolucion: string;
    metodoPagoExcedente: string;
  }) => Promise<void>;
}

export function NeuDevolucionWizard({ isOpen, onClose, contrato, onConfirm }: NeuDevolucionWizardProps) {
  const [step, setStep] = useState(1);
  const [cantidadesBuenas, setCantidadesBuenas] = useState<{ [eqId: string]: number }>({});
  const [cantidadesMalas, setCantidadesMalas] = useState<{ [eqId: string]: number }>({});
  const [cantidadesExtraviadas, setCantidadesExtraviadas] = useState<{ [eqId: string]: number }>({});
  const [danos, setDanos] = useState<{ [eqId: string]: number }>({});
  const [valoresReposicion, setValoresReposicion] = useState<{ [eqId: string]: number }>({});
  const [fechaDevolucion, setFechaDevolucion] = useState<string>(new Date().toISOString().split('T')[0]);
  const [metodoPagoExcedente, setMetodoPagoExcedente] = useState<string>('Efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && contrato) {
      const initialBuenas: { [id: string]: number } = {};
      const initialMalas: { [id: string]: number } = {};
      const initialExtraviadas: { [id: string]: number } = {};
      const initialDanos: { [id: string]: number } = {};
      const initialReposicion: { [id: string]: number } = {};

      contrato.items.forEach((it: any) => {
        const pendientes = it.cantidad - (it.cantidadDevuelta || 0);
        initialBuenas[it.equipoId] = pendientes; // Por defecto todo en buen estado
        initialMalas[it.equipoId] = 0;
        initialExtraviadas[it.equipoId] = 0;
        initialDanos[it.equipoId] = 0;
        initialReposicion[it.equipoId] = it.valorReposicion || 0;
      });

      setCantidadesBuenas(initialBuenas);
      setCantidadesMalas(initialMalas);
      setCantidadesExtraviadas(initialExtraviadas);
      setDanos(initialDanos);
      setValoresReposicion(initialReposicion);
      setFechaDevolucion(new Date().toISOString().split('T')[0]);
      setStep(1);
      setIsSubmitting(false);
    }
  }, [isOpen, contrato]);

  if (!isOpen || !contrato) return null;

  const fechaInicioContrato = contrato.rawAlquiler?.created_at?.split('T')[0] || '2000-01-01';

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm({ cantidadesBuenas, cantidadesMalas, cantidadesExtraviadas, danos, valoresReposicion, fechaDevolucion, metodoPagoExcedente });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDanos = Object.values(danos).reduce((a, b) => a + b, 0);

  const Step1Cantidades = () => (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-xl font-black text-slate-800">1. Triage Físico de Equipos</h3>
      <p className="text-sm text-slate-500 mb-4">Clasifica las unidades según su estado de retorno.</p>
      
      <div className="space-y-4">
        {contrato.items.map((it: any) => {
          const pendientes = it.cantidad - (it.cantidadDevuelta || 0);
          if (pendientes <= 0) return null;
          
          const buenas = cantidadesBuenas[it.equipoId] || 0;
          const malas = cantidadesMalas[it.equipoId] || 0;
          const extraviadas = cantidadesExtraviadas[it.equipoId] || 0;
          const enObra = pendientes - buenas - malas - extraviadas;

          return (
            <div key={it.equipoId} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-200 gap-4">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <p className="text-lg font-black text-slate-800">{it.nombre}</p>
                  {it.fechaFinEstimada && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${new Date(it.fechaFinEstimada) < new Date(new Date().setHours(0,0,0,0)) ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {new Date(it.fechaFinEstimada) < new Date(new Date().setHours(0,0,0,0)) ? 'Vencido' : 'En plazo'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Esperado: {new Date(it.fechaFinEstimada).toLocaleDateString('es-CO')}</span>
                    </div>
                  )}
                </div>
                <div className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-inner">
                  Total a gestionar: {pendientes}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-xl">
                  <span className="text-sm font-semibold text-emerald-700">Buen Estado</span>
                  <NeuStepper 
                    min={0}
                    max={pendientes - malas - extraviadas}
                    value={buenas}
                    onChange={(val) => setCantidadesBuenas(prev => ({ ...prev, [it.equipoId]: val }))}
                  />
                </div>
                <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-xl">
                  <span className="text-sm font-semibold text-amber-700">Con Daños</span>
                  <NeuStepper 
                    min={0}
                    max={pendientes - buenas - extraviadas}
                    value={malas}
                    onChange={(val) => setCantidadesMalas(prev => ({ ...prev, [it.equipoId]: val }))}
                  />
                </div>
                <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-xl">
                  <span className="text-sm font-semibold text-rose-700">Extraviados</span>
                  <NeuStepper 
                    min={0}
                    max={pendientes - buenas - malas}
                    value={extraviadas}
                    onChange={(val) => setCantidadesExtraviadas(prev => ({ ...prev, [it.equipoId]: val }))}
                  />
                </div>
                <div className="flex justify-between items-center bg-slate-100 p-3 border border-slate-200 rounded-xl opacity-70">
                  <span className="text-sm font-semibold text-slate-500">Siguen en Obra</span>
                  <span className="font-bold text-slate-700 text-lg pr-4">{enObra}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const Step2Danos = () => {
    const hayAfectaciones = contrato.items.some((it: any) => (cantidadesMalas[it.equipoId] || 0) > 0 || (cantidadesExtraviadas[it.equipoId] || 0) > 0);

    if (!hayAfectaciones) {
      return (
        <div className="space-y-6 animate-fadeIn text-center py-8">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-800">Todo en orden</h3>
          <p className="text-sm text-slate-500">No se reportaron equipos dañados ni extraviados. Puedes continuar al resumen.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fadeIn">
        <h3 className="text-xl font-black text-slate-800">2. Liquidación de Daños y Extravíos</h3>
        <p className="text-sm text-slate-500 mb-4">Ingresa los costos de reparación y reposición.</p>
        
        <div className="space-y-4">
          {contrato.items.map((it: any) => {
            const malas = cantidadesMalas[it.equipoId] || 0;
            const extraviadas = cantidadesExtraviadas[it.equipoId] || 0;
            
            if (malas === 0 && extraviadas === 0) return null;

            return (
              <div key={it.equipoId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <p className="font-bold text-slate-700 border-b border-slate-200 pb-2">{it.nombre}</p>
                
                {malas > 0 && (
                  <div>
                    <label className="text-xs font-bold text-amber-700 block mb-2">Costo estimado de reparación para {malas} uds dañadas</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input 
                        type="number"
                        min={0}
                        value={danos[it.equipoId] || ''}
                        onChange={(e) => setDanos(prev => ({ ...prev, [it.equipoId]: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-8 pr-4 py-3 bg-white border border-amber-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        placeholder="Ej. 45000"
                      />
                    </div>
                  </div>
                )}

                {extraviadas > 0 && (
                  <div className="pt-2">
                    <label className="text-xs font-bold text-rose-700 block mb-2">Valor de reposición por {extraviadas} uds extraviadas</label>
                    {it.valorReposicion ? (
                      <div className="flex justify-between items-center bg-rose-50 p-3 rounded-xl border border-rose-100">
                        <span className="text-sm font-semibold text-rose-800">Valor Unitario: ${(it.valorReposicion).toLocaleString()}</span>
                        <span className="text-sm font-bold text-rose-900">Total: ${(extraviadas * it.valorReposicion).toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input 
                          type="number"
                          min={0}
                          value={valoresReposicion[it.equipoId] || ''}
                          onChange={(e) => setValoresReposicion(prev => ({ ...prev, [it.equipoId]: parseFloat(e.target.value) || 0 }))}
                          className="w-full pl-8 pr-4 py-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                          placeholder="Valor de reposición de emergencia"
                        />
                        <p className="text-xs text-rose-500 mt-1">⚠️ Equipo antiguo sin valor de reposición. Ingrésalo manualmente.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const Step3Confirmacion = () => (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-xl font-black text-slate-800">3. Fecha y Resumen</h3>
      <p className="text-sm text-slate-500 mb-4">Verifica los datos antes de confirmar la recepción en bodega.</p>
      
      <div className="p-5 bg-sky-50 rounded-2xl border border-sky-100">
        <label className="flex items-center gap-2 text-sm font-bold text-sky-900 mb-2">
          <Calendar className="w-4 h-4" />
          Fecha Real de Devolución
        </label>
        <input 
          type="date"
          min={fechaInicioContrato}
          max={new Date().toISOString().split('T')[0]}
          value={fechaDevolucion}
          onChange={(e) => setFechaDevolucion(e.target.value)}
          className="w-full p-3 bg-white border border-sky-200 rounded-xl text-sky-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
        <p className="text-xs text-sky-600 mt-2 font-medium">Nota: No puede ser anterior a la entrega original ({fechaInicioContrato}).</p>
      </div>

      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Package className="w-4 h-4"/> Resumen a Recibir</h4>
        <ul className="space-y-2 text-sm">
          {contrato.items.map((it: any) => {
            const qtyBuenas = cantidadesBuenas[it.equipoId] || 0;
            const qtyMalas = cantidadesMalas[it.equipoId] || 0;
            const qtyExtraviadas = cantidadesExtraviadas[it.equipoId] || 0;
            const qtyTotal = qtyBuenas + qtyMalas;
            if (qtyTotal <= 0 && qtyExtraviadas <= 0) return null;
            return (
              <li key={it.equipoId} className="flex flex-col justify-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">{it.nombre}</span>
                  <span className="font-bold text-slate-800">{qtyTotal} retornadas</span>
                </div>
                {(qtyBuenas > 0 || qtyMalas > 0 || qtyExtraviadas > 0) && (
                  <div className="flex flex-wrap gap-4 mt-1 text-xs">
                    {qtyBuenas > 0 && <span className="text-emerald-600 font-semibold">{qtyBuenas} Buen Estado</span>}
                    {qtyMalas > 0 && <span className="text-amber-600 font-semibold">{qtyMalas} a Mantenimiento</span>}
                    {qtyExtraviadas > 0 && <span className="text-rose-600 font-semibold">{qtyExtraviadas} Extraviadas</span>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        
      {(() => {
        const totalDanos = Object.values(danos).reduce((a, b) => a + b, 0);
        const totalReposicion = contrato.items.reduce((acc: number, it: any) => {
          return acc + (cantidadesExtraviadas[it.equipoId] || 0) * (it.valorReposicion || valoresReposicion[it.equipoId] || 0);
        }, 0);
        const totalPenalidades = totalDanos + totalReposicion;
        const garantiaOriginal = contrato.garantia_monto || 0;
        const diferencia = totalPenalidades - garantiaOriginal;

        if (totalPenalidades > 0) {
          return (
            <div className="mt-4 pt-4 border-t border-rose-100 flex flex-col gap-3 bg-rose-50 p-4 rounded-xl border border-rose-200">
              <div className="flex justify-between text-sm text-rose-800">
                <span>Penalidad por Daños:</span>
                <span className="font-bold">${totalDanos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-rose-800 border-b border-rose-100 pb-2">
                <span>Penalidad por Reposición:</span>
                <span className="font-bold">${totalReposicion.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm font-bold text-slate-800">
                <span>Garantía Inicial del Contrato:</span>
                <span className="text-emerald-600">-${garantiaOriginal.toLocaleString()}</span>
              </div>
              
              {diferencia > 0 ? (
                <>
                  <div className="flex justify-between items-center text-rose-700 pt-2 border-t border-rose-200">
                    <span className="font-black text-sm">Faltante a cobrar en Caja:</span>
                    <span className="font-black text-lg">${diferencia.toLocaleString()}</span>
                  </div>
                  <div className="mt-2">
                    <label className="text-xs font-bold text-rose-800 block mb-1">Método de Pago del Excedente</label>
                    <select 
                      value={metodoPagoExcedente}
                      onChange={(e) => setMetodoPagoExcedente(e.target.value)}
                      className="w-full p-2.5 bg-white border border-rose-300 rounded-lg text-rose-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    >
                      <option value="Efectivo">💵 Efectivo (Caja)</option>
                      <option value="Transferencia">📱 Transferencia (Bancos)</option>
                      <option value="Tarjeta">💳 Tarjeta (Datáfono)</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center text-emerald-700 pt-2 border-t border-emerald-200">
                  <span className="font-black text-sm">Garantía cubre los daños. Sobrante:</span>
                  <span className="font-black text-lg">${Math.abs(diferencia).toLocaleString()}</span>
                </div>
              )}
            </div>
          );
        }
        return null;
      })()}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full h-[90vh] lg:h-auto lg:max-h-[85vh] lg:max-w-3xl rounded-t-3xl lg:rounded-3xl flex flex-col shadow-2xl relative overflow-hidden transition-all">
        
        {/* Loading Overlay Idempotencia */}
        {isSubmitting && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-brand-salmonLight border-t-brand-salmon rounded-full animate-spin"></div>
            <p className="mt-4 font-bold text-slate-700 animate-pulse">Sincronizando bodega...</p>
          </div>
        )}

        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-600 border border-sky-100 uppercase">
              Contrato #{contrato.consecutivo}
            </span>
            <h2 className="text-xl font-black text-slate-800 mt-1">Recepción de Equipos</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop Progress Bar (Hidden on Mobile) */}
        <div className="hidden lg:flex px-6 py-4 bg-slate-50 border-b border-slate-100">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex-1 flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= num ? 'bg-brand-salmon text-white shadow-neu-salmon-sm' : 'bg-white text-slate-400 border border-slate-200'}`}>
                {step > num ? <CheckCircle className="w-4 h-4" /> : num}
              </div>
              {num < 3 && (
                <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${step > num ? 'bg-brand-salmonLight' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {/* Mobile view shows everything sequentially, Desktop uses steps */}
          <div className="lg:hidden space-y-10 pb-20">
            <Step1Cantidades />
            <Step2Danos />
            <Step3Confirmacion />
          </div>
          <div className="hidden lg:block">
            {step === 1 && <Step1Cantidades />}
            {step === 2 && <Step2Danos />}
            {step === 3 && <Step3Confirmacion />}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 p-4 lg:p-6 border-t border-slate-100 bg-white flex justify-between items-center gap-4">
          <div className="hidden lg:block">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 transition-colors">
                Atrás
              </button>
            )}
          </div>
          <div className="flex-1 lg:flex-none flex justify-end gap-3 w-full lg:w-auto">
            <button onClick={onClose} className="lg:hidden px-6 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl">
              Cancelar
            </button>
            {/* Botón Desktop (Next/Confirm) */}
            <div className="hidden lg:block">
              {step < 3 ? (
                <Button onClick={() => setStep(s => s + 1)} className="px-8">Siguiente</Button>
              ) : (
                <Button onClick={handleConfirm} className="px-8 shadow-neu-salmon-sm">Confirmar Recepción</Button>
              )}
            </div>
            {/* Botón Mobile (Always Confirm) */}
            <Button onClick={handleConfirm} className="lg:hidden flex-1 shadow-neu-salmon-sm">
              Confirmar Recepción
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
