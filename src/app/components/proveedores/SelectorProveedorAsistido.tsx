"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Check, 
  ChevronDown, 
  X, 
  Clock, 
  Phone, 
  Mail,
  Sparkles
} from 'lucide-react';
import { ProveedorUI } from '../../actions/proveedores';
import { CrearProveedorModal } from './CrearProveedorModal';

interface SelectorProveedorAsistidoProps {
  proveedores: ProveedorUI[];
  proveedorSeleccionadoId?: string;
  onSeleccionarProveedor: (proveedor: ProveedorUI | null) => void;
  onNuevoProveedorRegistrado?: (proveedor: ProveedorUI) => void;
  error?: string;
}

export function SelectorProveedorAsistido({
  proveedores,
  proveedorSeleccionadoId,
  onSeleccionarProveedor,
  onNuevoProveedorRegistrado,
  error
}: SelectorProveedorAsistidoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Proveedor actualmente seleccionado
  const proveedorActual = useMemo(() => {
    return proveedores.find(p => p.id === proveedorSeleccionadoId) || null;
  }, [proveedores, proveedorSeleccionadoId]);

  // Filtrado asistido predictivo
  const resultadosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return proveedores.slice(0, 10);
    }
    const term = searchTerm.toLowerCase().trim();
    return proveedores.filter(p => 
      p.nombre.toLowerCase().includes(term) ||
      p.nit.toLowerCase().includes(term) ||
      (p.ciudad && p.ciudad.toLowerCase().includes(term)) ||
      (p.contacto && p.contacto.toLowerCase().includes(term))
    );
  }, [proveedores, searchTerm]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejar teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % (resultadosFiltrados.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + resultadosFiltrados.length) % (resultadosFiltrados.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (resultadosFiltrados[highlightedIndex]) {
        seleccionar(resultadosFiltrados[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const seleccionar = (p: ProveedorUI) => {
    onSeleccionarProveedor(p);
    setSearchTerm('');
    setIsOpen(false);
  };

  const limpiarSeleccion = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSeleccionarProveedor(null);
    setSearchTerm('');
  };

  const handleProveedorCreado = (nuevo: ProveedorUI) => {
    if (onNuevoProveedorRegistrado) {
      onNuevoProveedorRegistrado(nuevo);
    }
    onSeleccionarProveedor(nuevo);
    setIsCrearModalOpen(false);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Visualización cuando ya hay proveedor seleccionado */}
      {proveedorActual ? (
        <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl transition-all shadow-xs">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-sm truncate">
                  {proveedorActual.nombre}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 font-mono font-medium shrink-0">
                  NIT: {proveedorActual.nit}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 truncate">
                {proveedorActual.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {proveedorActual.telefono}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> {proveedorActual.dias_credito} días crédito
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="text-xs px-2.5 py-1 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors font-medium"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={limpiarSeleccion}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
              title="Quitar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Input de búsqueda asistida */
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar proveedor asistido (Nombre, NIT, Ciudad)..."
              className={`w-full pl-10 pr-28 py-2.5 bg-slate-50 border ${
                error ? 'border-red-300 ring-2 ring-red-500/10' : 'border-slate-200'
              } rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs`}
            />
            {/* Botón rápido de creación On-The-Fly */}
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsCrearModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/70 rounded-lg transition-colors shadow-2xs"
                title="Crear un proveedor nuevo al instante sin salir de la compra"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown flotante con resultados predictivos */}
      {isOpen && !proveedorActual && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fadeIn max-h-72 flex flex-col">
          {/* Header del dropdown con sugerencias asistidas */}
          <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Sugerencias asistidas ({resultadosFiltrados.length})
            </span>
            <span>Usa ↑↓ y Enter</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {resultadosFiltrados.length > 0 ? (
              resultadosFiltrados.map((p, idx) => {
                const isSelected = idx === highlightedIndex;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => seleccionar(p)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-emerald-50/90 text-emerald-900' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-medium text-sm truncate flex items-center gap-2">
                        <span>{p.nombre}</span>
                        {p.dias_credito > 0 && (
                          <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                            {p.dias_credito}d crédito
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono text-slate-600">NIT: {p.nit}</span>
                        {p.ciudad && <span>• {p.ciudad}</span>}
                        {p.contacto && <span>• Asesor: {p.contacto}</span>}
                      </div>
                    </div>

                    <Check className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600 opacity-100' : 'opacity-0'}`} />
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-slate-500">
                  No se encontró ningún proveedor con &ldquo;<span className="font-medium text-slate-700">{searchTerm}</span>&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => setIsCrearModalOpen(true)}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Crear &ldquo;{searchTerm}&rdquo; como Proveedor
                </button>
              </div>
            )}
          </div>

          {/* Footer con acceso rápido */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">¿No está en la lista?</span>
            <button
              type="button"
              onClick={() => setIsCrearModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar nuevo proveedor
            </button>
          </div>
        </div>
      )}

      {/* Modal de creación rápida On-The-Fly */}
      <CrearProveedorModal
        isOpen={isCrearModalOpen}
        onClose={() => setIsCrearModalOpen(false)}
        onProveedorCreado={handleProveedorCreado}
      />
    </div>
  );
}
