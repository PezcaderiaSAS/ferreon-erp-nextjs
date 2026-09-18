"use client";

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  HelpCircle, 
  CheckCircle2, 
  ArrowLeftRight, 
  Printer, 
  DollarSign, 
  FileText, 
  Keyboard, 
  Plus, 
  Eye, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useLayoutStore } from '../../../infrastructure/state/layoutStore';

interface BotonGuiaItem {
  nombre: string;
  modulo: 'Cotizaciones' | 'Contratos' | 'Devoluciones' | 'Atajos';
  icono: any;
  colorClase: string;
  badgeTexto: string;
  accion: string;
  impacto: string;
  consejo: string;
}

const GLOSARIO_BOTONES: BotonGuiaItem[] = [
  {
    nombre: '⚡ Formalizar Contrato (1-Clic)',
    modulo: 'Cotizaciones',
    icono: CheckCircle2,
    colorClase: 'bg-emerald-600 text-white',
    badgeTexto: 'Conversión Instantánea',
    accion: 'Convierte una propuesta comercial aceptada en un contrato activo oficial ALQ-X.',
    impacto: 'Verifica y reserva pesimistamente las unidades en bodega, descontándolas del stock disponible.',
    consejo: 'Si no hay inventario suficiente en bodega, el sistema te avisará para derivar a subcontratación con aliados.',
  },
  {
    nombre: '📦 Recibir Equipos (Devolución)',
    modulo: 'Contratos',
    icono: ArrowLeftRight,
    colorClase: 'bg-teal-700 text-white',
    badgeTexto: 'Retorno Físico',
    accion: 'Abre el módulo de inspección técnica Split-Line para registrar el retorno de maquinaria de obra.',
    impacto: 'Clasifica equipos en Buen Estado, Mantenimiento o Daño, restituyendo el stock y liquidando la garantía.',
    consejo: 'Permite registrar devoluciones parciales sin necesidad de cerrar todo el contrato de una vez.',
  },
  {
    nombre: '💵 Registrar Abono / Pago Mixto',
    modulo: 'Contratos',
    icono: DollarSign,
    colorClase: 'bg-emerald-700 text-white',
    badgeTexto: 'Tesorería',
    accion: 'Registra cobros parciales o totales de cánones de alquiler y fletes.',
    impacto: 'Asienta partida doble en el Libro Mayor (Ledger) y genera el Comprobante de Recaudo en Carta o Tirilla POS.',
    consejo: 'Soporta métodos mixtos: Efectivo, Transferencias (Bancolombia, Nequi) y Saldo a Favor del cliente.',
  },
  {
    nombre: '📄 Generar PDF (Contrato / Cotización)',
    modulo: 'Contratos',
    icono: Printer,
    colorClase: 'bg-blue-700 text-white',
    badgeTexto: 'Impresión Legal',
    accion: 'Emite el documento oficial listo para imprimir o enviar en PDF con el logo institucional.',
    impacto: 'Cálculo garantizado en huso local (fechas sin desfase) con desglose de fletes, depósitos e IVA.',
    consejo: 'Puedes imprimirlo directamente en la impresora de oficina o guardarlo como PDF vectorial.',
  },
  {
    nombre: '➕ Nuevo Alquiler / Cotización',
    modulo: 'Contratos',
    icono: Plus,
    colorClase: 'bg-slate-900 text-white',
    badgeTexto: 'Creación Rápida',
    accion: 'Abre el wizard interactivo de despacho para seleccionar cliente, fechas maestro y maquinaria.',
    impacto: 'Calcula tarifas diarias, costos de transporte y garantías en tiempo real (0 ms de latencia).',
    consejo: 'Puedes usar el atajo de teclado F2 para buscar maquinaria rápidamente.',
  },
  {
    nombre: '👁️ Ver Detalle 360° (Clic en Fila)',
    modulo: 'Contratos',
    icono: Eye,
    colorClase: 'bg-slate-700 text-white',
    badgeTexto: 'Auditoría',
    accion: 'Al hacer clic sobre cualquier contrato o cotización, se abre el panel 360° con todo el historial.',
    impacto: 'Audita fechas reales, estado de pagos, días transcurridos y personas que crearon el registro.',
    consejo: 'No necesitas abrir el menú de tres puntos para ver la ficha completa; basta con hacer clic en la fila.',
  },
  {
    nombre: '⌨️ Tecla F2 (Atajo de Maquinaria)',
    modulo: 'Atajos',
    icono: Keyboard,
    colorClase: 'bg-amber-600 text-white',
    badgeTexto: 'Atajo Global',
    accion: 'Despliega el buscador asistido typeahead de equipos desde cualquier paso del formulario.',
    impacto: 'Permite seleccionar equipos y agregarlos a la lista sin despegar las manos del teclado.',
    consejo: 'Usa las flechas ↑ y ↓ para navegar por los resultados y presiona Enter para seleccionar.',
  },
  {
    nombre: '🛡️ Bloqueo Poka-Yoke (Idempotencia)',
    modulo: 'Atajos',
    icono: ShieldCheck,
    colorClase: 'bg-indigo-600 text-white',
    badgeTexto: 'Escudo de Seguridad',
    accion: 'Escudo visual translúcido que inhabilita clics repetidos mientras se guarda una transacción.',
    impacto: 'Genera una clave criptográfica única por envío, garantizando que nunca se dupliquen contratos ni cobros.',
    consejo: 'Si ves el spinner de guardado, espera un instante; el sistema te confirmará la finalización exitosa.',
  },
];

export function GuiaBotonesModal() {
  const { isGuiaBotonesOpen, setGuiaBotonesOpen } = useLayoutStore();
  const [filtroModulo, setFiltroModulo] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  const itemsFiltrados = useMemo(() => {
    return GLOSARIO_BOTONES.filter((item) => {
      const cumpleModulo = filtroModulo === 'TODOS' || item.modulo === filtroModulo;
      if (!cumpleModulo) return false;

      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      return (
        item.nombre.toLowerCase().includes(q) ||
        item.accion.toLowerCase().includes(q) ||
        item.impacto.toLowerCase().includes(q) ||
        item.badgeTexto.toLowerCase().includes(q)
      );
    });
  }, [filtroModulo, busqueda]);

  if (!isGuiaBotonesOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-guia-botones"
      >
        {/* Header del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center font-black">
              <HelpCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 id="titulo-guia-botones" className="text-lg sm:text-xl font-black text-slate-900">
                Guía de Botones y Acciones del Sistema
              </h2>
              <p className="text-xs text-slate-500">
                Aprende qué hace cada botón, cuál es su impacto en el inventario y cómo operar sin dudas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGuiaBotonesOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Cerrar guía (Esc)"
            aria-label="Cerrar guía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Tabs de Filtro */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {['TODOS', 'Cotizaciones', 'Contratos', 'Atajos'].map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() => setFiltroModulo(mod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filtroModulo === mod
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {mod === 'TODOS' ? 'Todos los Botones' : mod}
              </button>
            ))}
          </div>

          {/* Campo de Búsqueda */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar acción o botón..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon text-slate-800"
            />
          </div>
        </div>

        {/* Contenido / Listado de Tarjetas Didácticas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50">
          {itemsFiltrados.map((item, idx) => {
            const Icon = item.icono;
            return (
              <div 
                key={idx}
                className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${item.colorClase} shadow-2xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {item.nombre}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {item.badgeTexto}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block mb-0.5">¿Qué hace?</span>
                      <p className="text-slate-600 leading-relaxed">{item.accion}</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-800 block mb-0.5 text-[11px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Impacto en el Sistema:
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{item.impacto}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="italic">💡 {item.consejo}</span>
                </div>
              </div>
            );
          })}

          {itemsFiltrados.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600 text-sm">No se encontraron botones con ese término.</p>
              <p className="text-xs text-slate-400 mt-1">Prueba con otra palabra clave como &quot;devolución&quot;, &quot;PDF&quot; o &quot;abono&quot;.</p>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>Consejo: Presiona <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono font-bold">Esc</kbd> para cerrar este glosario en cualquier momento.</span>
          <button
            type="button"
            onClick={() => setGuiaBotonesOpen(false)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
