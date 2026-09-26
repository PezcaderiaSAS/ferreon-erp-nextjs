'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Command,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  SlidersHorizontal,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LinearDataTableProps,
  LinearColumn,
  LinearCommandAction,
} from './types';

/**
 * LinearDataTable — Componente de Tabla Dinámica de Alta Densidad
 *
 * Implementa estrictamente las 5 decisiones de ingeniería inversa de Linear:
 * 1. 📉 Densidad Quirúrgica (~30px altura de fila, fuentes 12px, iconos 14px)
 * 2. 🔲 Bordes Sutiles de Bajo Contraste (border-zinc-800, shadow-none estático, rounded-sm/md)
 * 3. 🎨 Minimalismo Monocromático (zinc-950/900, opacidad text-white/60, acento único indigo-600)
 * 4. ⌨️ Navegación por Teclado (Ctrl+K Command Palette, flechas ↑/↓, hotkeys C/F/Enter/Esc)
 * 5. 📐 Alineación Estricta y Cuadrícula Métrica (anchos fijos, tabular-nums font-mono)
 *
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 */
export function LinearDataTable<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = 'Filtrar registros...',
  filterPredicate,
  onRowClick,
  onCreateAction,
  commandActions = [],
  enableMultiSelect = true,
  batchActions = [],
  emptyMessage = 'No se encontraron registros en el sistema.',
  isLoading = false,
}: LinearDataTableProps<T>) {
  // ── Estados Locales ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRowIndex, setActiveRowIndex] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandFilter, setCommandFilter] = useState('');
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // ── Filtrado Local de Datos ────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    if (filterPredicate) {
      return data.filter((row) => filterPredicate(row, searchQuery.toLowerCase().trim()));
    }
    // Fallback: búsqueda por coincidencia textual en campos primitivos
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? '').toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    );
  }, [data, searchQuery, filterPredicate]);

  // Asegurar que activeRowIndex esté dentro de los límites tras filtrar
  useEffect(() => {
    if (activeRowIndex >= filteredData.length) {
      setActiveRowIndex(Math.max(0, filteredData.length - 1));
    }
  }, [filteredData.length, activeRowIndex]);

  const activeRow = filteredData[activeRowIndex] ?? null;

  // ── Selección Múltiple ─────────────────────────────────────────────────────
  const isAllSelected = useMemo(() => {
    return filteredData.length > 0 && filteredData.every((r) => selectedIds.has(r.id));
  }, [filteredData, selectedIds]);

  const isSomeSelected = useMemo(() => {
    return selectedIds.size > 0 && !isAllSelected;
  }, [selectedIds, isAllSelected]);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((r) => r.id)));
    }
  }, [isAllSelected, filteredData]);

  const toggleSelectRow = useCallback((id: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // ── Paleta de Comandos Contextual (Ctrl + K) ───────────────────────────────
  const selectedRowsList = useMemo(() => {
    return filteredData.filter((r) => selectedIds.has(r.id));
  }, [filteredData, selectedIds]);

  const availableCommands = useMemo(() => {
    return commandActions.filter((cmd) => {
      if (cmd.requiresSelection && selectedIds.size === 0 && !activeRow) return false;
      if (!commandFilter.trim()) return true;
      return cmd.label.toLowerCase().includes(commandFilter.toLowerCase().trim());
    });
  }, [commandActions, commandFilter, selectedIds.size, activeRow]);

  const executeCommand = useCallback(
    (cmd: LinearCommandAction<T>) => {
      const targets = selectedRowsList.length > 0 ? selectedRowsList : activeRow ? [activeRow] : [];
      cmd.run(targets, activeRow);
      setIsCommandPaletteOpen(false);
      setCommandFilter('');
    },
    [selectedRowsList, activeRow]
  );

  // ── Motor Global de Teclado (Keyboard-Driven UX) ───────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('contenteditable') === 'true';

      // 1. Abrir/Cerrar Paleta de Comandos: Ctrl + K o Cmd + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        setCommandFilter('');
        setActiveCommandIndex(0);
        return;
      }

      // Si la paleta de comandos está abierta, manejar sus propias teclas
      if (isCommandPaletteOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsCommandPaletteOpen(false);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveCommandIndex((prev) =>
            availableCommands.length > 0 ? (prev + 1) % availableCommands.length : 0
          );
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveCommandIndex((prev) =>
            availableCommands.length > 0
              ? (prev - 1 + availableCommands.length) % availableCommands.length
              : 0
          );
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (availableCommands[activeCommandIndex]) {
            executeCommand(availableCommands[activeCommandIndex]);
          }
          return;
        }
        return;
      }

      // 2. Si el usuario está escribiendo en el buscador, solo responder a Esc y flechas
      if (isInputFocused) {
        if (e.key === 'Escape') {
          searchInputRef.current?.blur();
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          searchInputRef.current?.blur();
          setActiveRowIndex(0);
        }
        return;
      }

      // 3. Hotkeys fuera de inputs
      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          setActiveRowIndex((prev) => Math.min(prev + 1, filteredData.length - 1));
          break;

        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          setActiveRowIndex((prev) => Math.max(prev - 1, 0));
          break;

        case 'Enter':
          e.preventDefault();
          if (activeRow && onRowClick) {
            onRowClick(activeRow);
          }
          break;

        case 'x':
        case ' ':
          e.preventDefault();
          if (activeRow && enableMultiSelect) {
            toggleSelectRow(activeRow.id);
          }
          break;

        case 'c':
        case 'C':
          if (onCreateAction) {
            e.preventDefault();
            onCreateAction();
          }
          break;

        case 'f':
        case 'F':
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;

        case 'Escape':
          e.preventDefault();
          if (selectedIds.size > 0) {
            setSelectedIds(new Set());
          } else if (searchQuery) {
            setSearchQuery('');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCommandPaletteOpen,
    availableCommands,
    activeCommandIndex,
    executeCommand,
    filteredData,
    activeRow,
    onRowClick,
    onCreateAction,
    enableMultiSelect,
    toggleSelectRow,
    selectedIds.size,
    searchQuery,
  ]);

  // Enfocar input al abrir command palette
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => commandInputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  return (
    <div className="w-full flex flex-col gap-2 font-sans select-none">
      {/* ── BARRA SUPERIOR QUIRÚRGICA (Height: 32px / h-8) ──────────────────── */}
      <div className="flex items-center justify-between gap-2 h-8">
        {/* Buscador Rápido y Badge de Atajo */}
        <div className="relative flex items-center flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2 text-zinc-400 dark:text-white/40 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              'w-full h-7 pl-7 pr-12 text-xs rounded-sm',
              'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800',
              'text-zinc-900 dark:text-white/90 placeholder:text-zinc-400 dark:placeholder:text-white/40',
              'outline-none focus:border-zinc-400 dark:focus:border-zinc-700 focus:ring-1 focus:ring-indigo-500/50',
              'transition-all duration-100 leading-tight'
            )}
          />
          <div className="absolute right-1.5 flex items-center gap-1 pointer-events-none">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="pointer-events-auto p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white/80"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <kbd className="px-1 py-0.2 text-[10px] font-mono rounded-sm border border-zinc-300 dark:border-zinc-700/80 bg-zinc-200/50 dark:bg-zinc-800/60 text-zinc-500 dark:text-white/40">
                F
              </kbd>
            )}
          </div>
        </div>

        {/* Acciones Rápidas del Encabezado */}
        <div className="flex items-center gap-1.5">
          {/* Disparador de Paleta de Comandos */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className={cn(
              'h-7 px-2 flex items-center gap-1.5 text-xs rounded-sm',
              'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80',
              'border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-white/70',
              'transition-colors duration-100'
            )}
            title="Abrir paleta de comandos rápida"
          >
            <Command className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Comandos</span>
            <kbd className="px-1 text-[10px] font-mono rounded-sm border border-zinc-300 dark:border-zinc-700 bg-zinc-200/50 dark:bg-zinc-800/60 text-zinc-500 dark:text-white/40">
              ⌘K
            </kbd>
          </button>

          {/* Botón CTA Único (Minimalismo Monocromático con Acento Controlado) */}
          {onCreateAction && (
            <button
              type="button"
              onClick={onCreateAction}
              className={cn(
                'h-7 px-2.5 flex items-center gap-1.5 text-xs font-medium rounded-sm',
                'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white',
                'border border-indigo-500/50 shadow-none outline-none focus-visible:ring-1 focus-visible:ring-indigo-400',
                'transition-colors duration-100'
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo</span>
              <kbd className="px-1 text-[10px] font-mono rounded-sm bg-indigo-700/60 text-indigo-100 border border-indigo-400/30">
                C
              </kbd>
            </button>
          )}
        </div>
      </div>

      {/* ── ESTRUCTURA DE TABLA CON BORDE TENUE Y DENSIDAD QUIRÚRGICA ──────── */}
      <div
        ref={tableContainerRef}
        className={cn(
          'w-full overflow-x-auto rounded-md',
          'border border-zinc-200 dark:border-zinc-800/80',
          'bg-white dark:bg-zinc-950 shadow-none'
        )}
      >
        <table className="w-full border-collapse text-left table-fixed">
          {/* Encabezado Rígido (h-7: 28px) */}
          <thead>
            <tr className="h-7 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 text-[11px] font-medium tracking-wider uppercase text-zinc-500 dark:text-white/40">
              {/* Columna Checkbox Masivo */}
              {enableMultiSelect && (
                <th className="w-8 px-2 text-center align-middle">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={toggleSelectAll}
                      aria-label="Seleccionar todas las filas"
                      className={cn(
                        'w-3.5 h-3.5 rounded-sm cursor-pointer',
                        'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700',
                        'text-indigo-600 focus:ring-0 focus:ring-offset-0'
                      )}
                    />
                  </div>
                </th>
              )}

              {/* Columnas Métricas */}
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    'px-2.5 truncate font-medium align-middle',
                    col.width || 'w-auto',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    (!col.align || col.align === 'left') && 'text-left'
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Cuerpo de Filas Compactas (~30px / h-7.5) */}
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {isLoading ? (
              // Esqueleto Compacto Shimmer
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="h-7.5 animate-pulse">
                  {enableMultiSelect && (
                    <td className="w-8 px-2 text-center">
                      <div className="w-3.5 h-3.5 mx-auto bg-zinc-200 dark:bg-zinc-800/70 rounded-sm" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={`skel-col-${col.id}`} className="px-2.5">
                      <div className="h-3.5 bg-zinc-200/80 dark:bg-zinc-800/60 rounded-sm w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              // Estado Vacío Monocromático
              <tr>
                <td
                  colSpan={columns.length + (enableMultiSelect ? 1 : 0)}
                  className="py-12 text-center text-xs text-zinc-400 dark:text-white/40"
                >
                  <p>{emptyMessage}</p>
                  <span className="text-[11px] text-zinc-400/80 dark:text-white/30 mt-1 block">
                    Presiona <kbd className="px-1 font-mono text-[10px] border border-zinc-700 rounded-sm">C</kbd> para crear o <kbd className="px-1 font-mono text-[10px] border border-zinc-700 rounded-sm">F</kbd> para limpiar filtros
                  </span>
                </td>
              </tr>
            ) : (
              // Filas de Datos Operacionales
              filteredData.map((row, index) => {
                const isSelected = selectedIds.has(row.id);
                const isActive = index === activeRowIndex;

                return (
                  <tr
                    key={row.id}
                    onClick={() => {
                      setActiveRowIndex(index);
                      if (onRowClick) onRowClick(row);
                    }}
                    className={cn(
                      'h-7.5 text-xs transition-colors duration-100 cursor-pointer group',
                      // Estado Base Alternado / Hover
                      'hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50',
                      // Estado Seleccionado
                      isSelected && 'bg-indigo-50/40 dark:bg-indigo-950/20',
                      // Estado Activo por Foco de Teclado
                      isActive && 'ring-1 ring-inset ring-indigo-500/70 dark:ring-indigo-500/80 bg-zinc-100/70 dark:bg-zinc-900/80'
                    )}
                  >
                    {/* Checkbox Quirúrgico */}
                    {enableMultiSelect && (
                      <td
                        className="w-8 px-2 text-center align-middle"
                        onClick={(e) => toggleSelectRow(row.id, e)}
                      >
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Gestionado en el onClick del td
                            aria-label={`Seleccionar fila ${row.id}`}
                            className={cn(
                              'w-3.5 h-3.5 rounded-sm cursor-pointer',
                              'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700',
                              'text-indigo-600 focus:ring-0 focus:ring-offset-0'
                            )}
                          />
                        </div>
                      </td>
                    )}

                    {/* Celdas con Alineación Estricta */}
                    {columns.map((col) => {
                      const cellValue = col.accessorKey ? (row[col.accessorKey] as any) : null;

                      return (
                        <td
                          key={col.id}
                          className={cn(
                            'px-2.5 truncate align-middle leading-tight',
                            col.width || 'w-auto',
                            col.align === 'right' && 'text-right font-mono tabular-nums',
                            col.align === 'center' && 'text-center',
                            (!col.align || col.align === 'left') && 'text-left text-zinc-900 dark:text-white/90'
                          )}
                        >
                          {col.render ? col.render(row, index) : cellValue ?? '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── PIE DE ESTADO COMPACTO & LEYENDA DE NAVEGACIÓN ──────────────────── */}
      <div className="flex items-center justify-between px-1 text-[11px] text-zinc-400 dark:text-white/40">
        <div className="flex items-center gap-3">
          <span>
            {filteredData.length} {filteredData.length === 1 ? 'registro' : 'registros'}
            {selectedIds.size > 0 && ` (${selectedIds.size} seleccionados)`}
          </span>
          {activeRow && (
            <span className="hidden sm:inline font-mono text-[10px] text-zinc-400 dark:text-white/30">
              Fila: {activeRowIndex + 1}/{filteredData.length}
            </span>
          )}
        </div>

        {/* Guía de Teclas Mínima Industrial */}
        <div className="hidden md:flex items-center gap-2 font-mono text-[10px]">
          <span>
            <kbd className="px-1 border border-zinc-300 dark:border-zinc-800 rounded-sm bg-zinc-100 dark:bg-zinc-900">↑</kbd>
            <kbd className="px-1 ml-0.5 border border-zinc-300 dark:border-zinc-800 rounded-sm bg-zinc-100 dark:bg-zinc-900">↓</kbd> navegar
          </span>
          <span>
            <kbd className="px-1 border border-zinc-300 dark:border-zinc-800 rounded-sm bg-zinc-100 dark:bg-zinc-900">↵</kbd> abrir
          </span>
          <span>
            <kbd className="px-1 border border-zinc-300 dark:border-zinc-800 rounded-sm bg-zinc-100 dark:bg-zinc-900">X</kbd> marcar
          </span>
          <span>
            <kbd className="px-1 border border-zinc-300 dark:border-zinc-800 rounded-sm bg-zinc-100 dark:bg-zinc-900">⌘K</kbd> menú
          </span>
        </div>
      </div>

      {/* ── BARRA FLOTANTE DE ACCIONES EN LOTE (Batch Actions Bar) ─────────── */}
      {selectedIds.size > 0 && batchActions.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="h-8 px-2.5 rounded-md bg-zinc-900 dark:bg-zinc-900 border border-zinc-700/80 dark:border-zinc-700 shadow-xl flex items-center gap-2 text-xs text-white">
            <span className="font-medium text-white/90 text-[11px] pr-1.5 border-r border-zinc-700">
              {selectedIds.size} seleccionados
            </span>

            {batchActions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => act.run(selectedRowsList)}
                  className={cn(
                    'h-6 px-2 flex items-center gap-1.5 rounded-sm text-[11px] font-medium transition-colors',
                    act.variant === 'danger'
                      ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80'
                      : 'hover:bg-zinc-800 text-white/80 hover:text-white'
                  )}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{act.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="p-1 text-white/50 hover:text-white rounded-sm ml-1"
              title="Deseleccionar todos (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── PALETA DE COMANDOS FLOTANTE (Ctrl + K) ─────────────────────────── */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div
            className={cn(
              'w-full max-w-lg rounded-md overflow-hidden',
              'bg-zinc-900 border border-zinc-800 shadow-2xl text-white'
            )}
          >
            {/* Input de Comandos */}
            <div className="flex items-center gap-2 px-3 h-10 border-b border-zinc-800 bg-zinc-950/60">
              <Command className="w-4 h-4 text-white/40" />
              <input
                ref={commandInputRef}
                type="text"
                value={commandFilter}
                onChange={(e) => {
                  setCommandFilter(e.target.value);
                  setActiveCommandIndex(0);
                }}
                placeholder="Escribe un comando o acción operativa..."
                className="w-full bg-transparent text-xs text-white placeholder:text-white/40 outline-none"
              />
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-white/40 border border-zinc-800 rounded-sm bg-zinc-900">
                ESC
              </kbd>
            </div>

            {/* Lista de Acciones Disponibles */}
            <div className="max-h-64 overflow-y-auto p-1 divide-y divide-zinc-800/40">
              {availableCommands.length === 0 ? (
                <div className="py-6 text-center text-xs text-white/40">
                  No se encontraron comandos que coincidan con &quot;{commandFilter}&quot;
                </div>
              ) : (
                availableCommands.map((cmd, idx) => {
                  const Icon = cmd.icon || ArrowRight;
                  const isCmdActive = idx === activeCommandIndex;

                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setActiveCommandIndex(idx)}
                      className={cn(
                        'w-full h-8 px-2.5 flex items-center justify-between rounded-sm text-xs transition-colors',
                        isCmdActive
                          ? 'bg-zinc-800 text-white font-medium'
                          : 'text-white/70 hover:bg-zinc-800/60 hover:text-white'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-white/40" />
                        <span>{cmd.label}</span>
                        {cmd.description && (
                          <span className="text-[11px] text-white/40 font-normal">
                            — {cmd.description}
                          </span>
                        )}
                      </div>

                      {cmd.shortcut && (
                        <kbd className="px-1 py-0.2 text-[10px] font-mono rounded-sm border border-zinc-700 bg-zinc-800 text-white/50">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Contexto del Foco Activo */}
            {activeRow && (
              <div className="px-3 py-1.5 bg-zinc-950/80 border-t border-zinc-800 text-[11px] text-white/40 flex items-center justify-between font-mono">
                <span>Fila activa: #{String(activeRow.id)}</span>
                <span>Enter para ejecutar</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
