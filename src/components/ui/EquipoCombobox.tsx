"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback, useId } from 'react';
import { Search, ChevronDown, Check, X, Plus, AlertCircle, Package } from 'lucide-react';
import { EquipoUI } from '../../infrastructure/state/bodegaStore';

export interface EquipoComboboxProps {
  equipos: EquipoUI[];
  value?: string | number;
  onChange: (equipoId: string, equipo: EquipoUI | null) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onCrearNuevo?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
  initialName?: string;
}

/**
 * Normaliza cadenas de texto eliminando mayúsculas, tildes y espacios residuales.
 */
function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Formatea valores monetarios a Pesos Colombianos (COP).
 */
function formatCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

export function EquipoCombobox({
  equipos,
  value,
  onChange,
  disabled = false,
  placeholder = 'Buscar equipo por nombre o código...',
  autoFocus = false,
  onCrearNuevo,
  onOpenChange,
  className = '',
  initialName = '',
}: EquipoComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [openUpwards, setOpenUpwards] = useState(false);

  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Notificar al componente padre cuando el desplegable se abre o cierra
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Detectar espacio en viewport para abrir hacia arriba solo cuando abajo es insuficiente
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Umbral ergonómico: abrir hacia arriba solo si abajo hay menos de 220px y arriba hay suficiente espacio
      const threshold = 220;
      if (spaceBelow < threshold && spaceAbove > spaceBelow) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  // Equipo actualmente seleccionado
  const selectedEquipo = useMemo(() => {
    if (!value) return null;
    return equipos.find((e) => String(e.id) === String(value)) || null;
  }, [equipos, value]);

  // Sincronizar el texto del input cuando el valor externo cambia o se cierra el dropdown
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery(selectedEquipo ? selectedEquipo.nombre : (initialName || ''));
    }
  }, [selectedEquipo, isOpen, initialName]);

  // Filtrado instantáneo multi-criterio en memoria (< 5ms)
  const filteredEquipos = useMemo(() => {
    const query = normalizeText(searchQuery);

    if (!query) {
      // Priorizar equipos disponibles si no hay búsqueda
      return [...equipos].sort((a, b) => {
        const stockA = a.stock_disponible ?? a.stockDisponible ?? 0;
        const stockB = b.stock_disponible ?? b.stockDisponible ?? 0;
        if (stockA > 0 && stockB <= 0) return -1;
        if (stockA <= 0 && stockB > 0) return 1;
        return a.nombre.localeCompare(b.nombre);
      });
    }

    const tokens = query.split(/\s+/).filter(Boolean);

    return equipos.filter((eq) => {
      const nombreNorm = normalizeText(eq.nombre);
      const codigoNorm = normalizeText(eq.codigo || eq.sku || '');
      const categoriaNorm = normalizeText(eq.categoria || '');

      return tokens.every(
        (token) =>
          nombreNorm.includes(token) ||
          codigoNorm.includes(token) ||
          categoriaNorm.includes(token)
      );
    });
  }, [equipos, searchQuery]);

  // Mantener el índice resaltado dentro de los límites
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredEquipos.length]);

  // Scroll automático hacia la opción activa al navegar con flechas
  useEffect(() => {
    if (isOpen && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [highlightedIndex, isOpen]);

  // Listener para cerrar al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery(selectedEquipo ? selectedEquipo.nombre : '');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedEquipo]);

  // Manejar selección de un equipo
  const handleSelect = useCallback(
    (eq: EquipoUI) => {
      const stock = (eq as any).stock_disponible ?? eq.stockDisponible ?? 0;
      if (stock <= 0) {
        // Poka-Yoke: No permitir seleccionar si no hay stock
        return;
      }
      onChange(String(eq.id), eq);
      setSearchQuery(eq.nombre);
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onChange]
  );

  // Manejar limpieza de selección
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('', null);
      setSearchQuery('');
      setIsOpen(false);
      inputRef.current?.focus();
    },
    [onChange]
  );

  // Navegación por teclado accesible
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filteredEquipos.length));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(
          (prev) => (prev - 1 + filteredEquipos.length) % Math.max(1, filteredEquipos.length)
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filteredEquipos[highlightedIndex]) {
        handleSelect(filteredEquipos[highlightedIndex]);
      } else if (!isOpen) {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery(selectedEquipo ? selectedEquipo.nombre : '');
    } else if (e.key === 'Tab') {
      setIsOpen(false);
      setSearchQuery(selectedEquipo ? selectedEquipo.nombre : '');
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input de Búsqueda con Atributos WAI-ARIA */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none">
          <Search className="w-3.5 h-3.5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen && filteredEquipos[highlightedIndex]
              ? `${listboxId}-opt-${highlightedIndex}`
              : undefined
          }
          disabled={disabled}
          autoFocus={autoFocus}
          value={searchQuery}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full pl-8 pr-16 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all ${
            disabled ? 'bg-slate-100 opacity-60 cursor-not-allowed' : ''
          }`}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {selectedEquipo && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Limpiar selección"
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Popover / Dropdown con Posicionamiento Absoluto y Z-Index Elevado */}
      {isOpen && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          className={`absolute z-[100] left-0 w-full min-w-[300px] sm:min-w-[420px] max-h-[340px] sm:max-h-[380px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl ring-1 ring-slate-900/10 divide-y divide-slate-100 dark:divide-slate-800/60 animate-in fade-in duration-150 custom-scrollbar ${
            openUpwards ? 'bottom-full mb-1.5 slide-in-from-bottom-2' : 'top-full mt-1.5 slide-in-from-top-2'
          }`}
        >
          {filteredEquipos.length > 0 ? (
            filteredEquipos.map((eq, index) => {
              const isSelected = selectedEquipo ? String(selectedEquipo.id) === String(eq.id) : false;
              const isHighlighted = highlightedIndex === index;
              const stock = eq.stock_disponible ?? eq.stockDisponible ?? 0;
              const isAvailable = stock > 0;
              const tarifa = eq.tarifa_diaria ?? eq.tarifaDiaria ?? 0;

              return (
                <div
                  key={eq.id}
                  id={`${listboxId}-opt-${index}`}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={!isAvailable}
                  onClick={() => {
                    if (isAvailable) handleSelect(eq);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3.5 py-2.5 text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    !isAvailable
                      ? 'opacity-50 bg-slate-50/50 cursor-not-allowed'
                      : isHighlighted
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 border-l-4 border-teal-600 pl-2.5'
                      : isSelected
                      ? 'bg-teal-50/60 text-teal-950'
                      : 'hover:bg-slate-50 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold truncate">{eq.nombre}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      {eq.codigo && (
                        <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-[10px] text-slate-600">
                          {eq.codigo}
                        </span>
                      )}
                      {eq.categoria && <span>{eq.categoria}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-slate-700 text-right">
                      {formatCOP(tarifa)}
                      <span className="text-[10px] text-slate-400 block font-normal">/día</span>
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isAvailable ? `${stock} disp.` : 'Sin stock'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-slate-400 flex flex-col items-center gap-2">
              <Package className="w-6 h-6 text-slate-300" />
              <div className="text-xs">
                <span>No se encontraron equipos que coincidan con </span>
                <span className="font-bold text-slate-600">&ldquo;{searchQuery}&rdquo;</span>
              </div>
              {onCrearNuevo && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onCrearNuevo();
                  }}
                  className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear nuevo equipo ahora</span>
                </button>
              )}
            </div>
          )}

          {/* Pie del Combobox con Atajos Rápidos */}
          <div className="px-3 py-1.5 bg-slate-50/80 dark:bg-slate-950/40 text-[10px] text-slate-400 flex items-center justify-between">
            <span>↑↓ Navegar • ↵ Seleccionar • Esc Cerrar</span>
            {onCrearNuevo && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onCrearNuevo();
                }}
                className="text-teal-700 font-bold hover:underline"
              >
                + Nuevo Equipo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
