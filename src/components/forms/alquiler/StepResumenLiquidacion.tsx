import React from 'react';
import { FileText, MapPin, AlertCircle, ShieldAlert, CheckCircle2, Building2, TrendingUp, Eye, Sparkles, Receipt } from 'lucide-react';

interface StepResumenLiquidacionProps {
  observaciones: string;
  setObservaciones: (val: string) => void;
  detallesLogistica: string;
  setDetallesLogistica: (val: string) => void;
  subtotalEquipos: number;
  totalFletes: number;
  deposito: number;
  totalEstimado: number;
  garantiaTipo: string;
  garantiaMonto: number;
  valorReposicionTotal: number;
  formatearCOP: (val: number) => string;
  // Parámetros Tributarios (Impuestos / IVA)
  aplicaImpuesto: boolean;
  toggleAplicaImpuesto: (val?: boolean) => void;
  tasaImpuesto: number;
  setTasaImpuesto: (val: number) => void;
  valorImpuesto: number;
  nombreImpuesto: string;
  // Props para flujo unificado
  tipoDocumento: 'COTIZACION' | 'CONTRATO';
  setTipoDocumento?: (val: 'COTIZACION' | 'CONTRATO') => void;
  guardarComoCotizacion: () => Promise<boolean>;
  formalizarComoContrato: () => Promise<boolean>;
  isSubmitting: boolean;
  costoTotalSubcontratacion: number;
  margenTotalSubcontratacion: number;
  totalItemsSubcontratados: number;
  depositoExoneradoCredito: boolean;
  onOpenPreview?: () => void;
}

export const StepResumenLiquidacion: React.FC<StepResumenLiquidacionProps> = ({
  observaciones,
  setObservaciones,
  detallesLogistica,
  setDetallesLogistica,
  subtotalEquipos,
  totalFletes,
  deposito,
  totalEstimado,
  garantiaTipo,
  garantiaMonto,
  valorReposicionTotal,
  formatearCOP,
  aplicaImpuesto,
  toggleAplicaImpuesto,
  tasaImpuesto,
  setTasaImpuesto,
  valorImpuesto,
  nombreImpuesto,
  tipoDocumento,
  setTipoDocumento,
  guardarComoCotizacion,
  formalizarComoContrato,
  isSubmitting,
  costoTotalSubcontratacion,
  margenTotalSubcontratacion,
  totalItemsSubcontratados,
  depositoExoneradoCredito,
  onOpenPreview,
}) => {
  const colateralTotal = Number(deposito) + Number(garantiaMonto);
  const minimoColateralRequerido = valorReposicionTotal * 0.1;
  const cumpleGarantia = colateralTotal >= minimoColateralRequerido || depositoExoneradoCredito;
  const esCotizacion = tipoDocumento === 'COTIZACION';

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Banner de Modo Operativo */}
      <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        esCotizacion
          ? 'bg-blue-50/70 border-blue-200 text-blue-900'
          : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            esCotizacion ? 'bg-blue-600 text-white' : 'bg-emerald-700 text-white'
          }`}>
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {esCotizacion ? 'Modo: Cotización Comercial (COT)' : 'Modo: Formalización de Contrato (ALQ)'}
              </span>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                esCotizacion
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {esCotizacion ? 'Sin afectación de inventario' : 'Descuento atómico en bodega'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {esCotizacion 
                ? 'Emite una cotización formal para el cliente. No descuenta stock en bodega ni exige desembolso de colateral hasta su aprobación.' 
                : 'Genera un contrato vinculante. Valida disponibilidad, reserva y descuenta maquinaria propia en bodega y compromete pólizas/depósitos.'}
            </p>
          </div>
        </div>

        {setTipoDocumento && (
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setTipoDocumento('COTIZACION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                esCotizacion 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Cotización
            </button>
            <button
              type="button"
              onClick={() => setTipoDocumento('CONTRATO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !esCotizacion 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Contrato
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Observaciones y Logística en Obra */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span>Condiciones Especiales y Logística</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">Observaciones Contractuales o Comerciales</label>
              <textarea 
                rows={3}
                placeholder="Detalles sobre el estado del equipo, horas de uso o acuerdos comerciales especiales..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/25 focus:border-teal-600 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>Destino de Obra y Contacto de Entrega</span>
              </label>
              <textarea 
                rows={2}
                placeholder="Dirección exacta de la obra, persona y teléfono encargado de recibir..."
                value={detallesLogistica}
                onChange={(e) => setDetallesLogistica(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/25 focus:border-teal-600 outline-none transition-all"
              />
            </div>
          </div>

          {/* Badge informativo de Colateral Poka-Yoke */}
          {esCotizacion ? (
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 text-xs flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[11px]">
                  Colateral Referencial para Cotización
                </div>
                <div className="text-[10.5px] mt-0.5 leading-relaxed text-blue-800">
                  En cotizaciones comerciales el depósito no es exigible de inmediato. Al formalizarse el contrato, se requerirá un colateral mínimo del 10% ({formatearCOP(minimoColateralRequerido)}) salvo que el cliente disponga de crédito corporativo.
                </div>
              </div>
            </div>
          ) : depositoExoneradoCredito ? (
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-900 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[11px]">
                  Cliente Corporativo a Crédito (Exonerado)
                </div>
                <div className="text-[10.5px] mt-0.5 leading-relaxed text-emerald-800">
                  Línea de crédito comercial activa. Se exonera la exigencia inmediata de depósito en garantía conforme a la política corporativa autorizada.
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
              cumpleGarantia 
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' 
                : 'bg-amber-50/80 border-amber-300 text-amber-900'
            }`}>
              {cumpleGarantia ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-[11px]">
                  {cumpleGarantia ? "Colateral de Seguridad Cumplido (10%)" : "Atención: Colateral Insuficiente"}
                </div>
                <div className="text-[10.5px] mt-0.5 leading-relaxed">
                  Mínimo requerido (10% reposición): <span className="font-mono font-bold">{formatearCOP(minimoColateralRequerido)}</span>. 
                  Colateral actual: <span className="font-mono font-bold">{formatearCOP(colateralTotal)}</span>.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Régimen Tributario y Resumen Financiero Ejecutivo */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Panel de Control de Impuestos (Tax Engine) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                  aplicaImpuesto ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Cobro de Impuestos ({nombreImpuesto})
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {aplicaImpuesto 
                      ? `Calculando ${nombreImpuesto} (${tasaImpuesto}%) sobre subtotal de maquinaria.`
                      : 'Transacción sin cobro de impuestos (Régimen simplificado o exento).'}
                  </p>
                </div>
              </div>

              {/* Switch de 1 Clic */}
              <button
                type="button"
                role="switch"
                aria-checked={aplicaImpuesto}
                onClick={() => toggleAplicaImpuesto()}
                title={aplicaImpuesto ? "Desactivar cobro de impuestos" : "Activar cobro de impuestos"}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-teal-600/30 ${
                  aplicaImpuesto ? 'bg-teal-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    aplicaImpuesto ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {aplicaImpuesto && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mr-0.5">LATAM:</span>
                  {[
                    { label: 'CO 19%', tasa: 19 },
                    { label: 'MX 16%', tasa: 16 },
                    { label: 'PE 18%', tasa: 18 },
                    { label: 'EC 15%', tasa: 15 },
                    { label: '0% Exento', tasa: 0 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTasaImpuesto(preset.tasa)}
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                        Number(tasaImpuesto) === preset.tasa
                          ? 'bg-teal-50 border-teal-600 text-teal-800 shadow-2xs font-extrabold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                  <span className="text-[10.5px] font-bold text-slate-600">Tasa:</span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={tasaImpuesto}
                      onChange={(e) => setTasaImpuesto(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                      className="w-11 text-center text-xs font-black font-mono bg-white border border-slate-300 rounded px-1 py-0.5 outline-none focus:border-teal-600"
                    />
                    <span className="text-xs font-bold text-slate-500 ml-1">%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resumen Financiero Ejecutivo (Dark Card) */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between border border-slate-800">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider text-teal-400 font-bold">
                  {esCotizacion ? 'Cotización Económica' : 'Liquidación Oficial'}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
                  {esCotizacion ? 'COTIZACIÓN' : 'CONTRATO'}
                </span>
              </div>
              <h4 className="text-lg font-black text-white mt-1">
                {esCotizacion ? 'Resumen de la Cotización' : 'Resumen del Contrato'}
              </h4>
            </div>

            <div className="space-y-2.5 text-xs divide-y divide-slate-800/80">
              <div className="flex justify-between py-1 text-slate-300">
                <span>Subtotal Alquiler Equipos:</span>
                <span className="font-bold text-white font-mono tabular-nums">{formatearCOP(subtotalEquipos)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>Total Fletes (Entrega + Retorno):</span>
                <span className="font-bold text-white font-mono tabular-nums">{formatearCOP(totalFletes)}</span>
              </div>

              {/* Renglón de Impuesto si aplica */}
              {aplicaImpuesto && (
                <div className="flex justify-between py-1 text-teal-300 bg-slate-800/50 -mx-2 px-2 rounded-lg border border-teal-500/20">
                  <span className="flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-teal-400" />
                    <span>(+) {nombreImpuesto} ({tasaImpuesto}%):</span>
                  </span>
                  <span className="font-bold text-teal-300 font-mono tabular-nums">
                    + {formatearCOP(valorImpuesto)}
                  </span>
                </div>
              )}
              
              {esCotizacion ? (
                <div className="flex justify-between py-1 text-slate-400 italic">
                  <span>Depósito Previsto (al formalizar):</span>
                  <span className="font-mono tabular-nums">{formatearCOP(deposito)}</span>
                </div>
              ) : (
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Anticipo / Depósito Inicial:</span>
                  <span className="font-bold text-amber-400 font-mono tabular-nums">
                    {depositoExoneradoCredito ? '$0 (Exonerado Crédito)' : `- ${formatearCOP(deposito)}`}
                  </span>
                </div>
              )}

              {/* Desglose de Subcontratación de Maquinaria si aplica */}
              {totalItemsSubcontratados > 0 && (
                <div className="pt-2 pb-1 space-y-1.5 bg-slate-800/40 -mx-2 px-2 rounded-lg border border-amber-500/20">
                  <div className="flex justify-between items-center text-[10.5px] text-amber-300 font-bold">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-amber-400" />
                      <span>Re-Renting ({totalItemsSubcontratados} equipos de aliados):</span>
                    </span>
                    <span className="font-mono tabular-nums">- {formatearCOP(costoTotalSubcontratacion)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] text-emerald-300 font-bold">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span>Margen Comercial Operativo:</span>
                    </span>
                    <span className="font-mono tabular-nums font-black">{formatearCOP(margenTotalSubcontratacion)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center py-2 text-sm font-bold border-t border-slate-700">
                <span className="text-teal-300">
                  {esCotizacion ? 'Valor Total Cotizado:' : 'Saldo Pendiente Estimado:'}
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono tabular-nums tracking-tight">
                  {formatearCOP(esCotizacion ? (subtotalEquipos + totalFletes + (aplicaImpuesto ? valorImpuesto : 0)) : totalEstimado)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl text-[11px] text-slate-300 flex justify-between items-center border border-slate-700/50">
              <span>Garantía ({garantiaTipo}):</span>
              <span className="font-bold text-white font-mono tabular-nums">{formatearCOP(garantiaMonto)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Caja de Decisiones: Botones Gemelos de Acción y Vista Previa */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Opciones de Emisión y Cierre</span>
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Seleccione la acción correspondiente para procesar la transacción en FerreOn ERP:
            </p>
          </div>

          {onOpenPreview && (
            <button
              type="button"
              onClick={onOpenPreview}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Ver Documento Oficial</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Botón 1: Guardar como Cotización */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => guardarComoCotizacion()}
            className="p-3.5 bg-white hover:bg-blue-50/50 border-2 border-blue-400 text-blue-900 rounded-xl font-bold transition-all flex flex-col items-start gap-1 shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs sm:text-sm font-black flex items-center gap-1.5 text-blue-800 group-hover:text-blue-900">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Guardar como Cotización (COT-xxx)</span>
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-extrabold uppercase">
                Propuesta
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 text-left leading-tight font-normal">
              Emite documento formal sin descontar bodega propia ni comprometer pólizas de seguridad.
            </p>
          </button>

          {/* Botón 2: Formalizar Contrato de Alquiler */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => formalizarComoContrato()}
            className="p-3.5 bg-emerald-700 hover:bg-emerald-800 border-2 border-emerald-600 text-white rounded-xl font-bold transition-all flex flex-col items-start gap-1 shadow-md shadow-emerald-700/20 cursor-pointer disabled:opacity-50 disabled:pointer-events-none group active:scale-99"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs sm:text-sm font-black flex items-center gap-1.5 text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Formalizar Contrato de Alquiler (ALQ-xxx)</span>
              </span>
              <span className="text-[10px] bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded-full font-extrabold uppercase border border-emerald-600">
                Oficial
              </span>
            </div>
            <p className="text-[10.5px] text-emerald-100/90 text-left leading-tight font-normal">
              Descuenta stock de equipos propios en bodega, valida cartera y genera orden de despacho en obra.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

