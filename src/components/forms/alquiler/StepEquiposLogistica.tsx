import React from 'react';
import { 
  Plus, 
  Trash2, 
  Truck, 
  Wrench, 
  Handshake, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { EquipoCombobox } from '../../ui/EquipoCombobox';
import { formatearMonedaConLetras } from '../../../core/utils/numero-a-letras';
import { ItemRow } from './types';

export interface StepEquiposLogisticaProps {
  items: ItemRow[];
  setItems: React.Dispatch<React.SetStateAction<ItemRow[]>>;
  equiposActivos: any[];
  tipoDocumento?: 'COTIZACION' | 'CONTRATO';
  addItemRow: () => void;
  removeItemRow: (index: number) => void;
  updateItemRow: (index: number, field: keyof ItemRow, value: any) => void;
  verificarStockItem?: (itemId: string, cantidad: number) => {
    disponible: number;
    stockInsuficiente: boolean;
    faltante: number;
    equipo: any;
  };
  toggleSubcontratacionItem?: (index: number, enable: boolean) => void;
  updateSubcontratoItem?: (index: number, field: keyof ItemRow, value: any) => void;
  costoTotalSubcontratacion?: number;
  margenTotalSubcontratacion?: number;
  totalItemsSubcontratados?: number;
  autoFocusRowId: string | null;
  openComboboxRowId: string | null;
  setOpenComboboxRowId: (id: string | null) => void;
  setIsCreandoEquipo: (val: boolean) => void;
  fleteEntrega: number;
  setFleteEntrega: (val: number) => void;
  fleteRecogida: number;
  setFleteRecogida: (val: number) => void;
  formatearCOP: (val: number) => string;
  formErrors: { [key: string]: string };
}

export const StepEquiposLogistica: React.FC<StepEquiposLogisticaProps> = ({
  items,
  setItems,
  equiposActivos,
  tipoDocumento = 'COTIZACION',
  addItemRow,
  removeItemRow,
  updateItemRow,
  verificarStockItem,
  toggleSubcontratacionItem,
  updateSubcontratoItem,
  costoTotalSubcontratacion = 0,
  margenTotalSubcontratacion = 0,
  totalItemsSubcontratados = 0,
  autoFocusRowId,
  openComboboxRowId,
  setOpenComboboxRowId,
  setIsCreandoEquipo,
  fleteEntrega,
  setFleteEntrega,
  fleteRecogida,
  setFleteRecogida,
  formatearCOP,
  formErrors,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Lista de Maquinaria y Equipos */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-teal-600" />
                <span>Maquinaria y Equipos Solicitados</span>
              </h3>
              <span className="inline-flex items-center gap-1 text-[10.5px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md font-mono border border-teal-200/80">
                <kbd className="bg-white px-1 py-0.2 rounded font-bold shadow-2xs">F2</kbd>
                <span>Nueva fila</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Asigne tarifas diarias y fechas operativas. Si no hay stock en bodega, active Subcontratación.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => setIsCreandoEquipo(true)} 
              className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <span>+ Nuevo Equipo</span>
            </button>
            <button 
              type="button" 
              onClick={() => { 
                addItemRow(); 
                setTimeout(() => { 
                  const el = document.getElementById('items-list-end'); 
                  el?.scrollIntoView({ behavior: 'smooth', block: 'end' }); 
                }, 50); 
              }}
              className="px-3 py-1.5 bg-teal-600 text-white hover:bg-teal-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              title="Atajo de teclado: Tecla F2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Maquinaria</span>
              <span className="hidden sm:inline-block text-[10px] bg-teal-800/30 px-1 py-0.2 rounded font-mono font-normal">F2</span>
            </button>
          </div>
        </div>

        {/* Filas de equipos con scroll optimizado */}
        <div className="flex flex-col">
          <div className="space-y-3 max-h-[600px] sm:max-h-[640px] overflow-y-auto pr-1 pb-32" id="items-scroll-area">
            {items.map((field, index) => {
              const start = new Date(field.fechaInicio);
              const end = new Date(field.fechaFinEstimada);
              const diasFila = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
              const subtotalFila = (field.precioDiario || 0) * (field.cantidad || 1) * diasFila;
              const isComboboxOpen = openComboboxRowId === field.id;

              const stockCheck = verificarStockItem 
                ? verificarStockItem(field.itemId, field.cantidad) 
                : { disponible: 0, stockInsuficiente: false, faltante: 0, equipo: null };

              const margenDiarioUnitario = (field.precioDiario || 0) - (field.costoSubcontrato || 0);

              return (
                <div 
                  key={field.id} 
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                    isComboboxOpen 
                      ? 'bg-white border-teal-500 shadow-xl ring-2 ring-teal-500/20' 
                      : field.esSubcontratado
                      ? 'bg-indigo-50/40 border-indigo-200/90 shadow-2xs'
                      : 'bg-slate-50/90 border-slate-200/90 hover:border-slate-300'
                  } flex flex-col gap-2.5 relative`}
                  style={{ zIndex: isComboboxOpen ? 100 : Math.max(1, 40 - index) }}
                >
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    {/* Combobox con búsqueda y creación rápida */}
                    <div className="flex-1 min-w-[220px] flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">Equipo Requerido *</label>
                        {stockCheck.equipo && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            stockCheck.disponible > 0 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {stockCheck.disponible > 0 ? `Stock propio: ${stockCheck.disponible}` : 'Stock propio: 0'}
                          </span>
                        )}
                      </div>

                      <EquipoCombobox
                        equipos={equiposActivos}
                        value={field.itemId}
                        placeholder="Escriba nombre o código..."
                        autoFocus={autoFocusRowId === field.id}
                        onCrearNuevo={() => setIsCreandoEquipo(true)}
                        onOpenChange={(isOpen) => {
                          setOpenComboboxRowId(isOpen ? field.id : null);
                        }}
                        onChange={(eqId, equipo) => {
                          if (!equipo) {
                            const newItems = [...items];
                            newItems[index] = { 
                              ...newItems[index], 
                              itemId: '', 
                              precioDiario: 0 
                            };
                            setItems(newItems);
                            return;
                          }

                          const tarifa = equipo.tarifa_diaria ?? equipo.tarifaDiaria ?? 0;
                          
                          const existingIndex = items.findIndex((it, i) => 
                            i !== index && String(it.itemId) === String(eqId) && 
                            it.fechaInicio === field.fechaInicio && 
                            it.fechaFinEstimada === field.fechaFinEstimada
                          );

                          const newItems = [...items];
                          if (existingIndex !== -1) {
                            newItems[existingIndex].cantidad += field.cantidad;
                            newItems.splice(index, 1);
                          } else {
                            newItems[index] = { 
                              ...newItems[index], 
                              itemId: eqId, 
                              precioDiario: tarifa 
                            };
                          }
                          setItems(newItems);
                        }}
                      />
                    </div>

                    {/* Valor Diario */}
                    <div className="w-full sm:w-28 flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-700">Tarifa / Día</label>
                      <input 
                        type="number" 
                        min={0} 
                        value={field.precioDiario}
                        onChange={(e) => updateItemRow(index, 'precioDiario', parseFloat(e.target.value) || 0)}
                        className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none text-right font-mono tabular-nums font-semibold" 
                      />
                    </div>

                    {/* Cantidad */}
                    <div className="w-full sm:w-20 flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-700">Cant.</label>
                      <input 
                        type="number" 
                        min={1} 
                        value={field.cantidad}
                        onChange={(e) => updateItemRow(index, 'cantidad', parseInt(e.target.value, 10) || 1)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none text-center font-bold font-mono" 
                      />
                    </div>

                    {/* Fecha Inicio */}
                    <div className="w-full sm:w-36 flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-700">Desde</label>
                      <input 
                        type="date" 
                        value={field.fechaInicio}
                        onChange={(e) => updateItemRow(index, 'fechaInicio', e.target.value)}
                        className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none" 
                      />
                    </div>

                    {/* Fecha Fin Estimada */}
                    <div className="w-full sm:w-36 flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-700">Hasta</label>
                      <input 
                        type="date" 
                        value={field.fechaFinEstimada}
                        onChange={(e) => updateItemRow(index, 'fechaFinEstimada', e.target.value)}
                        className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none" 
                      />
                    </div>

                    {/* Eliminar fila */}
                    {items.length > 1 && (
                      <div className="flex items-end pt-1 md:pt-0">
                        <button 
                          type="button" 
                          onClick={() => removeItemRow(index)} 
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl text-xs transition-colors cursor-pointer"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ALERTA DE STOCK Y TOGGLE DE SUBCONTRATACIÓN (RE-RENTING) */}
                  {field.itemId && stockCheck.stockInsuficiente && !field.esSubcontratado && (
                    <div className="p-2.5 bg-amber-50/90 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-950 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-900">Stock insuficiente en bodega:</span>
                          <span className="ml-1 text-amber-800">
                            Disponibles: {stockCheck.disponible} | Faltante para obra: {stockCheck.faltante}.
                          </span>
                        </div>
                      </div>
                      {toggleSubcontratacionItem && (
                        <button
                          type="button"
                          onClick={() => toggleSubcontratacionItem(index, true)}
                          className="px-2.5 py-1 bg-amber-600 text-white hover:bg-amber-700 font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                        >
                          <Handshake className="w-3.5 h-3.5" />
                          <span>Activar Subcontratación (Re-Rent)</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* FORMULARIO EXPANDIDO DE SUBCONTRATACIÓN DE MAQUINARIA */}
                  {field.esSubcontratado && (
                    <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2.5 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-indigo-200/70 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Handshake className="w-4 h-4 text-indigo-700" />
                          <span className="text-xs font-bold text-indigo-950">
                            Subcontratación de Maquinaria Aliada (Re-Rent)
                          </span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-0.2 rounded-full font-semibold">
                            Cero Impacto en Bodega Propia
                          </span>
                        </div>
                        {toggleSubcontratacionItem && (
                          <button
                            type="button"
                            onClick={() => toggleSubcontratacionItem(index, false)}
                            className="text-[10.5px] text-slate-500 hover:text-rose-600 underline cursor-pointer"
                          >
                            Quitar subcontratación
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10.5px] font-bold text-indigo-950 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-indigo-600" />
                            <span>Proveedor Aliado</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Maquiequipos S.A.S."
                            value={field.proveedorAliadoNombre || ''}
                            onChange={(e) => updateSubcontratoItem && updateSubcontratoItem(index, 'proveedorAliadoNombre', e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10.5px] font-bold text-indigo-950">NIT / Cédula Aliado</label>
                          <input
                            type="text"
                            placeholder="900.xxx.xxx-x"
                            value={field.proveedorAliadoNit || ''}
                            onChange={(e) => updateSubcontratoItem && updateSubcontratoItem(index, 'proveedorAliadoNit', e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10.5px] font-bold text-indigo-950">Costo Subcontrato / Día</label>
                          <input
                            type="number"
                            min={0}
                            value={field.costoSubcontrato || 0}
                            onChange={(e) => updateSubcontratoItem && updateSubcontratoItem(index, 'costoSubcontrato', parseFloat(e.target.value) || 0)}
                            className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-right font-mono tabular-nums font-semibold"
                          />
                          <span className={`text-[10px] font-mono font-bold text-right ${
                            margenDiarioUnitario >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            Margen: {formatearCOP(margenDiarioUnitario)}/día
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10.5px] font-bold text-indigo-950 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-indigo-600" />
                            <span>Arribo a Muelle</span>
                          </label>
                          <input
                            type="date"
                            value={field.fechaRecepcionMuelleTercero || field.fechaInicio}
                            onChange={(e) => updateSubcontratoItem && updateSubcontratoItem(index, 'fechaRecepcionMuelleTercero', e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Subtotal de Fila con Tipografía Tabular */}
                  <div className="flex justify-between items-center text-[11px] px-2 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">
                      {formatearMonedaConLetras(field.precioDiario)} × <span className="font-bold text-slate-700">{diasFila} día(s)</span>
                    </span>
                    <span className="font-bold text-teal-800 font-mono tabular-nums">
                      Subtotal: {formatearCOP(subtotalFila)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div id="items-list-end" />
          </div>

          {/* Botón Sticky al fondo con contador */}
          <button
            type="button"
            onClick={() => {
              addItemRow();
              setTimeout(() => {
                const el = document.getElementById('items-list-end');
                const area = document.getElementById('items-scroll-area');
                if (area) area.scrollTop = area.scrollHeight;
              }, 60);
            }}
            className="mt-2 w-full py-2.5 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-400/60 bg-teal-50/50 text-teal-800 hover:bg-teal-100/70 hover:border-teal-500 font-bold text-xs transition-all group cursor-pointer active:scale-99"
          >
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Plus className="w-3.5 h-3.5" />
            </span>
            <span>Agregar Otra Maquinaria (F2)</span>
            <span className="ml-auto text-[10px] text-teal-700 font-semibold bg-teal-100 px-2.5 py-0.5 rounded-full font-mono">
              {items.length} en lista
            </span>
          </button>
        </div>

        {/* TARJETA EJECUTIVA DE RENTABILIDAD EN SUBCONTRATACIÓN */}
        {totalItemsSubcontratados > 0 && (
          <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-indigo-700 shrink-0" />
              <div>
                <span className="font-bold text-indigo-900">Resumen de Subcontratación ({totalItemsSubcontratados} equipo(s) de aliados):</span>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Estos equipos provienen de terceros aliados. No se deducirán del stock físico de bodega propia al emitir el contrato.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Costo Aliados</span>
                <span className="font-bold text-indigo-900">{formatearCOP(costoTotalSubcontratacion)}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Margen Bruto</span>
                <span className={`font-bold ${margenTotalSubcontratacion >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formatearCOP(margenTotalSubcontratacion)}
                </span>
              </div>
            </div>
          </div>
        )}

        {formErrors.items && <span className="text-[11px] text-rose-600 font-semibold">{formErrors.items}</span>}
      </div>

      {/* Costos de Logística y Traslado */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Truck className="w-4 h-4 text-amber-600" />
          <span>Fletes y Logística de Traslado</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Flete de Entrega a Obra ($ COP)</label>
            <input 
              type="number" 
              min={0}
              value={fleteEntrega}
              onChange={(e) => setFleteEntrega(parseFloat(e.target.value) || 0)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 text-right font-mono tabular-nums focus:bg-white focus:ring-2 focus:ring-teal-600/25 focus:border-teal-600 outline-none transition-all" 
            />
            <span className="text-[10.5px] text-slate-600 font-medium truncate">
              {formatearMonedaConLetras(fleteEntrega)}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Flete de Recogida / Retorno ($ COP)</label>
            <input 
              type="number" 
              min={0}
              value={fleteRecogida}
              onChange={(e) => setFleteRecogida(parseFloat(e.target.value) || 0)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 text-right font-mono tabular-nums focus:bg-white focus:ring-2 focus:ring-teal-600/25 focus:border-teal-600 outline-none transition-all" 
            />
            <span className="text-[10.5px] text-slate-600 font-medium truncate">
              {formatearMonedaConLetras(fleteRecogida)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
