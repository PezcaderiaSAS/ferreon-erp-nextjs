"use client";

import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Receipt, 
  FileText,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useEmpresaStore } from '../../infrastructure/state/empresaStore';
import { 
  construirComprobanteArqueoCompleto, 
  validarCalculosComprobanteArqueo, 
  generarHTMLComprobanteArqueo 
} from '../../core/services/calculoCajaArqueo';

interface ComprobanteArqueoModalProps {
  isOpen: boolean;
  onClose: () => void;
  sesion: any | null;
  movimientos?: any[];
  cobrosEfectivo?: any[];
}

export function ComprobanteArqueoModal({
  isOpen,
  onClose,
  sesion,
  movimientos = [],
  cobrosEfectivo = []
}: ComprobanteArqueoModalProps) {
  const { config: empresaConfig } = useEmpresaStore();
  const [formato, setFormato] = useState<'TICKET_80MM' | 'CARTA'>('CARTA');

  if (!sesion) return null;

  // Construir comprobante estructurado con cálculos verificados
  const totalCobros = (cobrosEfectivo || []).reduce((acc, p) => acc + Math.round(Number(p.monto) || 0), 0);
  const comprobante = construirComprobanteArqueoCompleto({
    empresa: {
      razonSocial: empresaConfig.razonSocial,
      nit: empresaConfig.nit,
      direccion: empresaConfig.direccion,
      telefono: empresaConfig.telefono,
      ciudad: empresaConfig.ciudad,
      regimen: empresaConfig.regimen
    },
    sesion: {
      id: sesion.id,
      usuarioId: sesion.usuario_id,
      cajeroNombre: sesion.cajero_nombre || sesion.usuario_email || 'Cajero Responsable',
      sucursal: sesion.sucursal || 'Sede Principal - Bodega Central',
      fechaApertura: sesion.fecha_apertura,
      fechaCierre: sesion.fecha_cierre,
      estado: sesion.estado,
      montoApertura: Number(sesion.monto_apertura) || 0,
      montoCierre: Number(sesion.monto_cierre) || 0,
      observaciones: sesion.observaciones,
      motivoDescuadre: sesion.motivo_descuadre,
      arqueoDetalle: sesion.arqueo_detalle
    },
    totalCobrosEfectivo: totalCobros,
    cantidadCobros: cobrosEfectivo.length,
    movimientos: movimientos
  });

  const validacionCalculos = validarCalculosComprobanteArqueo(comprobante);

  const handlePrint = (formatoImpresion: 'TICKET_80MM' | 'CARTA') => {
    const html = generarHTMLComprobanteArqueo(comprobante, formatoImpresion);
    const win = window.open('', '_blank', 'width=800,height=900');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 300);
    } else {
      window.print();
    }
  };

  const handleDescargarPDF = () => {
    handlePrint(formato);
  };

  const fmtMoneda = (val: number) => `$${Math.round(val || 0).toLocaleString('es-CO')} COP`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comprobante Oficial de Arqueo y Cierre de Caja"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Barra superior de herramientas y selección de formato */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Formato:</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setFormato('CARTA')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  formato === 'CARTA'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Hoja Carta / A4</span>
              </button>
              <button
                type="button"
                onClick={() => setFormato('TICKET_80MM')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  formato === 'TICKET_80MM'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Ticket POS 80mm</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDescargarPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
              title="Descargar o Guardar como PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrint(formato)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Alerta de Verificación Matemática Automática */}
        {validacionCalculos.esValido ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verificación matemática exitosa: 100% de denominaciones, flujos y balances validados sin inconsistencias.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Alerta: Se detectaron inconsistencias en los cálculos contables. Revise el desglose.</span>
          </div>
        )}

        {/* Contenedor del Comprobante Imprimible */}
        <div 
          className={`p-6 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-xs font-sans ${
            formato === 'TICKET_80MM' ? 'max-w-[420px] mx-auto border-dashed' : 'w-full'
          }`}
        >
          {/* Membrete */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                {comprobante.empresa.razonSocial}
              </h2>
              <p className="text-xs text-slate-600 font-semibold">
                NIT: {comprobante.empresa.nit} | {comprobante.empresa.regimen}
              </p>
              <p className="text-[11px] text-slate-500">
                {comprobante.empresa.direccion} - {comprobante.empresa.ciudad} | Tel: {comprobante.empresa.telefono}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded uppercase tracking-wider mb-1">
                Acta de Arqueo POS
              </span>
              <p className="text-xs font-bold text-slate-700">
                Sesión: <span className="font-mono text-slate-900">{comprobante.sesion.id.slice(0, 8).toUpperCase()}</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Estado: <span className="font-bold text-emerald-700">{comprobante.sesion.estado}</span>
              </p>
            </div>
          </div>

          {/* Metadatos de la sesión */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
            <div>
              <p className="text-slate-500">Cajero(a): <span className="font-bold text-slate-900">{comprobante.sesion.cajeroNombre}</span></p>
              <p className="text-slate-500">Sucursal: <span className="font-semibold text-slate-900">{comprobante.sesion.sucursal}</span></p>
            </div>
            <div className="text-right sm:text-left">
              <p className="text-slate-500">Apertura: <span className="font-semibold text-slate-900">{new Date(comprobante.sesion.fechaApertura).toLocaleString('es-CO')}</span></p>
              <p className="text-slate-500">Cierre: <span className="font-semibold text-slate-900">{new Date(comprobante.sesion.fechaCierre).toLocaleString('es-CO')}</span></p>
            </div>
          </div>

          {/* 1. Resumen Financiero Consolidado */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
              1. Liquidación de Flujo de Efectivo
            </h3>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-1 text-slate-600">Base Inicial de Efectivo:</td>
                  <td className="py-1 text-right font-bold text-slate-900 tabular-nums">{fmtMoneda(comprobante.flujo.montoApertura)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">(+) Cobros en Efectivo ({comprobante.flujo.cantidadCobros}):</td>
                  <td className="py-1 text-right font-bold text-slate-900 tabular-nums">{fmtMoneda(comprobante.flujo.totalCobrosEfectivo)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">(+) Ingresos Menores de Caja:</td>
                  <td className="py-1 text-right font-mono text-slate-800 tabular-nums">{fmtMoneda(comprobante.flujo.totalIngresosCaja)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">(-) Gastos Menores / Egresos:</td>
                  <td className="py-1 text-right font-mono text-rose-700 tabular-nums">-{fmtMoneda(comprobante.flujo.totalEgresosCaja)}</td>
                </tr>
                <tr className="border-t-2 border-slate-900 font-bold bg-slate-50">
                  <td className="py-1.5 px-2 text-slate-900 font-black">(=) Saldo Teórico Esperado en Gaveta:</td>
                  <td className="py-1.5 px-2 text-right font-black text-slate-900 text-sm tabular-nums">
                    {fmtMoneda(comprobante.flujo.saldoEsperado)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. Conteo Físico Real (Arqueo Ciego) */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
              2. Conteo Físico Real (Arqueo Ciego)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Billetes */}
              <div>
                <span className="font-bold text-slate-600 block mb-1">Billetes:</span>
                <div className="space-y-0.5 font-mono text-[11px]">
                  {comprobante.arqueoFisico.billetes.filter(b => b.cantidad > 0).map(b => (
                    <div key={b.denominacion} className="flex justify-between py-0.5 border-b border-slate-100">
                      <span>${b.denominacion.toLocaleString('es-CO')} x {b.cantidad}</span>
                      <span className="font-bold">{fmtMoneda(b.subtotal)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-1 font-bold text-slate-900">
                    <span>Subtotal Billetes:</span>
                    <span>{fmtMoneda(comprobante.arqueoFisico.subtotalBilletes)}</span>
                  </div>
                </div>
              </div>

              {/* Monedas */}
              <div>
                <span className="font-bold text-slate-600 block mb-1">Monedas:</span>
                <div className="space-y-0.5 font-mono text-[11px]">
                  {comprobante.arqueoFisico.monedas.filter(m => m.cantidad > 0).map(m => (
                    <div key={m.denominacion} className="flex justify-between py-0.5 border-b border-slate-100">
                      <span>${m.denominacion.toLocaleString('es-CO')} x {m.cantidad}</span>
                      <span className="font-bold">{fmtMoneda(m.subtotal)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-1 font-bold text-slate-900">
                    <span>Subtotal Monedas:</span>
                    <span>{fmtMoneda(comprobante.arqueoFisico.subtotalMonedas)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 p-2 bg-slate-900 text-white rounded-lg flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wider">Total Físico Contado:</span>
              <span className="text-base font-black font-mono">{fmtMoneda(comprobante.arqueoFisico.totalFisico)}</span>
            </div>
          </div>

          {/* 3. Cuadre y Descuadre */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
              3. Resultado y Cuadre de Auditoría
            </h3>
            <div className={`p-3 rounded-lg border text-xs ${
              comprobante.cuadre.diferencia === 0
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : comprobante.cuadre.diferencia > 0
                ? 'bg-cyan-50 text-cyan-900 border-cyan-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              <div className="flex justify-between items-center font-bold mb-1">
                <span>Estado del Cuadre:</span>
                <span className="uppercase">{comprobante.cuadre.clasificacion === 'CUADRADO' ? 'CUADRADO EXACTO' : comprobante.cuadre.clasificacion}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-sm">
                <span>Diferencia de Arqueo:</span>
                <span className="font-mono">{comprobante.cuadre.diferencia > 0 ? '+' : ''}{fmtMoneda(comprobante.cuadre.diferencia)}</span>
              </div>
            </div>

            {comprobante.cuadre.motivoDescuadre && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <span className="font-bold block mb-0.5">Justificación del Descuadre:</span>
                <p className="italic">&quot;{comprobante.cuadre.motivoDescuadre}&quot;</p>
              </div>
            )}
          </div>

          {/* 4. Firmas Oficiales */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-4 border-t border-slate-300 text-xs">
            <div className="text-center space-y-1">
              <div className="border-b border-slate-400 w-3/4 mx-auto pb-6 mb-2"></div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Entregado por:</p>
              <p className="font-bold text-slate-900">{comprobante.firmas.cajero.nombre}</p>
              <p className="text-slate-500 text-[10px]">{comprobante.firmas.cajero.cargo}</p>
              <p className="text-slate-400 text-[9px]">{comprobante.firmas.cajero.documento}</p>
            </div>

            <div className="text-center space-y-1">
              <div className="border-b border-slate-400 w-3/4 mx-auto pb-6 mb-2"></div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Recibido por:</p>
              <p className="font-bold text-slate-900">{comprobante.firmas.supervisor.nombre}</p>
              <p className="text-slate-500 text-[10px]">{comprobante.firmas.supervisor.cargo}</p>
              <p className="text-slate-400 text-[9px]">{comprobante.firmas.supervisor.documento}</p>
            </div>
          </div>

          {/* Sello de Auditoría Forense */}
          <div className="mt-6 pt-3 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400 font-mono">
            <span>Hash de Verificación Forense: <strong className="text-slate-600">{comprobante.hashAuditoria}</strong></span>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
          >
            Cerrar Comprobante
          </button>
        </div>
      </div>
    </Modal>
  );
}
