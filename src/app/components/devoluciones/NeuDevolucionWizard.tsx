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
    cantidades: { [equipoId: string]: number };
    danos: { [equipoId: string]: number };
    fechaDevolucion: string;
  }) => Promise<void>;
}

export function NeuDevolucionWizard({ isOpen, onClose, contrato, onConfirm }: NeuDevolucionWizardProps) {
  const [step, setStep] = useState(1);
  const [cantidades, setCantidades] = useState<{ [eqId: string]: number }>({});
  const [tieneDano, setTieneDano] = useState<{ [eqId: string]: boolean }>({});
  const [danos, setDanos] = useState<{ [eqId: string]: number }>({});
  const [fechaDevolucion, setFechaDevolucion] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && contrato) {
      const initialCant: { [id: string]: number } = {};
      const initialDanoCheck: { [id: string]: boolean } = {};
      const initialDanos: { [id: string]: number } = {};

      contrato.items.forEach((it: any) => {
        const pendientes = it.cantidad - (it.cantidadDevuelta || 0);
        initialCant[it.equipoId] = pendientes; // Por defecto devolvemos todo lo pendiente
        initialDanoCheck[it.equipoId] = false;
        initialDanos[it.equipoId] = 0;
      });

      setCantidades(initialCant);
      setTieneDano(initialDanoCheck);
      setDanos(initialDanos);
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
      await onConfirm({ cantidades, danos, fechaDevolucion });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDanos = Object.values(danos).reduce((a, b) => a + b, 0);

  const Step1Cantidades = () => (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-xl font-black text-slate-800">1. Equipos a Devolver</h3>
      <p className="text-sm text-slate-500 mb-4">¿Cuántas unidades están regresando a bodega hoy?</p>
      
      <div className="space-y-4">
        {contrato.items.map((it: any) => {
          const pendientes = it.cantidad - (it.cantidadDevuelta || 0);
          if (pendientes <= 0) return null;
          
          return (
            <div key={it.equipoId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
              <div>
                <p className="font-bold text-slate-700">{it.nombre}</p>
                <p className="text-xs text-sky-600 font-semibold mt-1">Pendientes de devolver: {pendientes}</p>
              </div>
              <NeuStepper 
                min={0}
                max={pendientes}
                value={cantidades[it.equipoId] ?? 0}
                onChange={(val) => setCantidades(prev => ({ ...prev, [it.equipoId]: val }))}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  const Step2Danos = () => (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-xl font-black text-slate-800">2. Revisión de Daños</h3>
      <p className="text-sm text-slate-500 mb-4">¿Algún equipo regresó averiado o con piezas faltantes?</p>
      
      <div className="space-y-4">
        {contrato.items.map((it: any) => {
          const devolviendo = cantidades[it.equipoId] || 0;
          if (devolviendo <= 0) return null;
          
          const dañado = tieneDano[it.equipoId] || false;

          return (
            <div key={it.equipoId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-700">{it.nombre} <span className="text-xs text-slate-400 font-normal">({devolviendo} u.)</span></p>
                <NeuToggle 
                  isOn={dañado} 
                  onToggle={(v) => {
                    setTieneDano(prev => ({ ...prev, [it.equipoId]: v }));
                    if (!v) setDanos(prev => ({ ...prev, [it.equipoId]: 0 }));
                  }} 
                />
              </div>
              
              {dañado && (
                <div className="pt-4 border-t border-slate-200/60 animate-fadeIn">
                  <label className="text-xs font-bold text-slate-600 block mb-2">Costo estimado del daño (A cobrar en Caja)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input 
                      type="number"
                      min={0}
                      value={danos[it.equipoId] || ''}
                      onChange={(e) => setDanos(prev => ({ ...prev, [it.equipoId]: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

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
            const qty = cantidades[it.equipoId] || 0;
            if (qty <= 0) return null;
            return (
              <li key={it.equipoId} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-600">{it.nombre}</span>
                <span className="font-bold text-slate-800">{qty} uds.</span>
              </li>
            );
          })}
        </ul>
        
        {totalDanos > 0 && (
          <div className="mt-4 pt-4 border-t border-red-100 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-bold">Se reportaron daños por ${totalDanos.toLocaleString('es-CO')}. Esto se sumará a la cuenta del cliente para cobro en Caja.</p>
          </div>
        )}
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
