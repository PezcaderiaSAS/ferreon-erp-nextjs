'use client';

import React, { useMemo } from 'react';
import {
  FileText,
  DollarSign,
  Package,
  Printer,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { LinearDataTable, LinearColumn, LinearCommandAction } from '@/components/ui/linear-table';
import { formatearMonedaCOP } from '@/core/utils/numero-a-letras';
import { cn } from '@/lib/utils';

export interface ContratoAlquilerFila {
  id: string | number;
  consecutivoCodigo: string;
  clienteNombre: string;
  clienteNit: string;
  fechaInicio: string;
  fechaFinEstimada: string;
  totalEquipos: number;
  subtotalEstimado: number;
  saldoPendiente: number;
  estado: 'ACTIVO' | 'POR_VENCER' | 'VENCIDO' | 'LIQUIDADO' | 'BORRADOR';
}

export interface ContratosAlquilerTableProps {
  contratos: ContratoAlquilerFila[];
  onVerDetalle?: (contrato: ContratoAlquilerFila) => void;
  onRegistrarPago?: (contrato: ContratoAlquilerFila) => void;
  onLiquidarDevolucion?: (contrato: ContratoAlquilerFila) => void;
  onImprimirPDF?: (contrato: ContratoAlquilerFila) => void;
  onNuevoContrato?: () => void;
  isLoading?: boolean;
}

/**
 * ContratosAlquilerTable — Implementación de Referencia en Alquileres System
 *
 * Aplica simultáneamente las 5 decisiones del análisis "Reverse-Engineered Linear":
 * 1. Densidad Quirúrgica: Fila de 30px, texto 12px, micro-íconos 14px.
 * 2. Bordes Sutiles: Delimitadores border-zinc-800, sin sombras estáticas (shadow-none).
 * 3. Minimalismo Monocromático: Escala de grises profunda, opacidad text-white/60, acento único.
 * 4. Navegación por Teclado: Command Palette (Ctrl+K), atajos C/F, flechas ↑/↓.
 * 5. Alineación Estricta: Anchos inamovibles (w-28, w-36, etc.) y números en tabular-nums.
 */
export function ContratosAlquilerTable({
  contratos,
  onVerDetalle,
  onRegistrarPago,
  onLiquidarDevolucion,
  onImprimirPDF,
  onNuevoContrato,
  isLoading = false,
}: ContratosAlquilerTableProps) {
  // ── 1. Definición Métrica de Columnas ─────────────────────────────────────
  const columns: LinearColumn<ContratoAlquilerFila>[] = useMemo(
    () => [
      {
        id: 'consecutivo',
        header: 'Contrato',
        width: 'w-28',
        align: 'left',
        render: (row) => (
          <div className="flex items-center gap-1.5 font-mono font-medium text-zinc-900 dark:text-white/90">
            <FileText className="w-3.5 h-3.5 text-zinc-400 dark:text-white/40 flex-shrink-0" />
            <span className="truncate">{row.consecutivoCodigo}</span>
          </div>
        ),
      },
      {
        id: 'cliente',
        header: 'Cliente / Obra',
        width: 'w-64',
        align: 'left',
        render: (row) => (
          <div className="flex flex-col justify-center leading-tight truncate">
            <span className="font-medium text-zinc-900 dark:text-white/90 truncate">
              {row.clienteNombre}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-white/40 truncate">
              NIT: {row.clienteNit}
            </span>
          </div>
        ),
      },
      {
        id: 'fechas',
        header: 'Periodo Obra',
        width: 'w-44',
        align: 'left',
        render: (row) => (
          <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-600 dark:text-white/60">
            <Clock className="w-3 h-3 text-zinc-400 dark:text-white/30 flex-shrink-0" />
            <span>
              {row.fechaInicio} → {row.fechaFinEstimada}
            </span>
          </div>
        ),
      },
      {
        id: 'equipos',
        header: 'Ítems',
        width: 'w-16',
        align: 'center',
        render: (row) => (
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-sm bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-white/70 border border-zinc-200 dark:border-zinc-800">
            {row.totalEquipos}
          </span>
        ),
      },
      {
        id: 'total',
        header: 'Total Estimado',
        width: 'w-32',
        align: 'right',
        render: (row) => (
          <span className="font-mono tabular-nums text-zinc-800 dark:text-white/90">
            {formatearMonedaCOP(row.subtotalEstimado)}
          </span>
        ),
      },
      {
        id: 'saldo',
        header: 'Saldo Pendiente',
        width: 'w-32',
        align: 'right',
        render: (row) => {
          const tieneSaldo = row.saldoPendiente > 0;
          return (
            <span
              className={cn(
                'font-mono tabular-nums font-medium',
                tieneSaldo ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-white/40'
              )}
            >
              {formatearMonedaCOP(row.saldoPendiente)}
            </span>
          );
        },
      },
      {
        id: 'estado',
        header: 'Estado',
        width: 'w-28',
        align: 'center',
        render: (row) => {
          const estadosConfig: Record<
            ContratoAlquilerFila['estado'],
            { label: string; dotClass: string }
          > = {
            ACTIVO: { label: 'Activo', dotClass: 'bg-emerald-500' },
            POR_VENCER: { label: 'Por vencer', dotClass: 'bg-amber-500' },
            VENCIDO: { label: 'Vencido', dotClass: 'bg-rose-500' },
            LIQUIDADO: { label: 'Liquidado', dotClass: 'bg-zinc-400' },
            BORRADOR: { label: 'Borrador', dotClass: 'bg-zinc-500' },
          };
          const config = estadosConfig[row.estado] || {
            label: row.estado,
            dotClass: 'bg-zinc-500',
          };

          return (
            <div className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm text-[11px] font-medium text-zinc-700 dark:text-white/80 border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50">
              <span className={cn('w-1.5 h-1.5 rounded-full', config.dotClass)} />
              <span>{config.label}</span>
            </div>
          );
        },
      },
      {
        id: 'acciones',
        header: '',
        width: 'w-16',
        align: 'right',
        render: (row) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onVerDetalle?.(row);
            }}
            className="p-1 rounded-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
            title="Ver detalle del contrato"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        ),
      },
    ],
    [onVerDetalle]
  );

  // ── 2. Acciones Rápidas para Paleta de Comandos (Ctrl + K) ─────────────────
  const commandActions: LinearCommandAction<ContratoAlquilerFila>[] = useMemo(
    () => [
      {
        id: 'ver-detalle',
        label: 'Ver detalle de contrato',
        shortcut: '↵',
        icon: FileText,
        description: 'Abre el expediente completo del contrato seleccionado',
        requiresSelection: true,
        run: (_, activeRow) => {
          if (activeRow && onVerDetalle) onVerDetalle(activeRow);
        },
      },
      {
        id: 'registrar-pago',
        label: 'Registrar pago / anticipo de caja',
        shortcut: 'P',
        icon: DollarSign,
        description: 'Aplica abono o liquidación mixta al contrato',
        requiresSelection: true,
        run: (_, activeRow) => {
          if (activeRow && onRegistrarPago) onRegistrarPago(activeRow);
        },
      },
      {
        id: 'liquidar-devolucion',
        label: 'Liquidar devolución de equipos en bodega',
        shortcut: 'L',
        icon: Package,
        description: 'Recepción física y acta de inspección técnica',
        requiresSelection: true,
        run: (_, activeRow) => {
          if (activeRow && onLiquidarDevolucion) onLiquidarDevolucion(activeRow);
        },
      },
      {
        id: 'imprimir-pdf',
        label: 'Imprimir contrato oficial (PDF)',
        shortcut: '⌘P',
        icon: Printer,
        description: 'Genera el documento legal firmado con código QR',
        requiresSelection: true,
        run: (_, activeRow) => {
          if (activeRow && onImprimirPDF) onImprimirPDF(activeRow);
        },
      },
      {
        id: 'nuevo-contrato',
        label: 'Crear nuevo contrato de alquiler',
        shortcut: 'C',
        icon: FileText,
        description: 'Inicia el formulario modular de cotización/contrato',
        requiresSelection: false,
        run: () => {
          if (onNuevoContrato) onNuevoContrato();
        },
      },
    ],
    [onVerDetalle, onRegistrarPago, onLiquidarDevolucion, onImprimirPDF, onNuevoContrato]
  );

  // ── 3. Acciones en Lote (Batch Toolbar) ────────────────────────────────────
  const batchActions = useMemo(
    () => [
      {
        id: 'exportar-seleccionados',
        label: 'Exportar Seleccionados',
        icon: Download,
        run: (selectedRows: ContratoAlquilerFila[]) => {
          alert(`Exportando ${selectedRows.length} contratos a CSV...`);
        },
      },
      {
        id: 'imprimir-remisiones',
        label: 'Imprimir Remisiones',
        icon: Printer,
        run: (selectedRows: ContratoAlquilerFila[]) => {
          alert(`Generando ${selectedRows.length} remisiones de despacho masivo...`);
        },
      },
    ],
    []
  );

  // ── 4. Renderizado Especializado para Tarjetas en Móviles (< 768px) ──────
  const renderMobileCard = (contrato: ContratoAlquilerFila, isSelected: boolean) => {
    const estadosConfig: Record<
      ContratoAlquilerFila['estado'],
      { label: string; dotClass: string; badgeClass: string }
    > = {
      ACTIVO: { label: 'Activo', dotClass: 'bg-emerald-500', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
      POR_VENCER: { label: 'Por vencer', dotClass: 'bg-amber-500', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
      VENCIDO: { label: 'Vencido', dotClass: 'bg-rose-500', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
      LIQUIDADO: { label: 'Liquidado', dotClass: 'bg-zinc-400', badgeClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' },
      BORRADOR: { label: 'Borrador', dotClass: 'bg-zinc-500', badgeClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' },
    };
    const estConfig = estadosConfig[contrato.estado] || {
      label: contrato.estado,
      dotClass: 'bg-zinc-500',
      badgeClass: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    };

    return (
      <div className={cn(
        'p-3.5 rounded-xl border transition-all text-xs space-y-2.5',
        'bg-white/95 dark:bg-zinc-900/90 backdrop-blur-sm border-zinc-200/90 dark:border-white/10 shadow-xs',
        isSelected && 'ring-2 ring-indigo-500/80 bg-indigo-50/40 dark:bg-indigo-950/40 border-indigo-500'
      )}>
        {/* Cabecera de la tarjeta: Consecutivo + Badge de Estado */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono font-bold text-zinc-900 dark:text-white">
            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>{contrato.consecutivoCodigo}</span>
          </div>
          <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border', estConfig.badgeClass)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', estConfig.dotClass)} />
            <span>{estConfig.label}</span>
          </div>
        </div>

        {/* Cliente & Obra */}
        <div className="leading-snug">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">{contrato.clienteNombre}</p>
          <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">NIT: {contrato.clienteNit}</p>
        </div>

        {/* Métricas: Periodo, Ítems, Total y Saldo */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-white/5 text-[11px]">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block">Periodo</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300 text-[10px]">
              {contrato.fechaInicio} → {contrato.fechaFinEstimada}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block">Total Est.</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs">
              {formatearMonedaCOP(contrato.subtotalEstimado)}
            </span>
          </div>
          {contrato.saldoPendiente > 0 && (
            <div className="col-span-2 flex items-center justify-between pt-1 border-t border-dashed border-zinc-100 dark:border-white/5 text-[11px]">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Saldo Pendiente:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {formatearMonedaCOP(contrato.saldoPendiente)}
              </span>
            </div>
          )}
        </div>

        {/* Botones de acción contextuales en móvil */}
        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-zinc-100 dark:border-white/5">
          {onVerDetalle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onVerDetalle(contrato);
              }}
              className="px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Detalle</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
          {onRegistrarPago && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRegistrarPago(contrato);
              }}
              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <DollarSign className="w-3 h-3" />
              <span>Pagar</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <LinearDataTable<ContratoAlquilerFila>
      data={contratos}
      columns={columns}
      searchPlaceholder="Filtrar por contrato, cliente o NIT... (F)"
      filterPredicate={(row, q) =>
        row.consecutivoCodigo.toLowerCase().includes(q) ||
        row.clienteNombre.toLowerCase().includes(q) ||
        row.clienteNit.toLowerCase().includes(q) ||
        row.estado.toLowerCase().includes(q)
      }
      onRowClick={(row) => onVerDetalle?.(row)}
      onCreateAction={onNuevoContrato}
      commandActions={commandActions}
      batchActions={batchActions}
      enableMultiSelect={true}
      emptyMessage="No se encontraron contratos de alquiler en esta vista."
      isLoading={isLoading}
      renderMobileCard={renderMobileCard}
    />
  );
}
