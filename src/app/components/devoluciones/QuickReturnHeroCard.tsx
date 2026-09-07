'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Calendar, Package, AlertOctagon, User } from 'lucide-react';

export interface ContratoPendienteInfo {
  id: string | number;
  consecutivo: number;
  clienteNombre: string;
  fechaEsperada: string;
  equiposResumen: string;
  estadoRetraso: string;
  rawAlquiler: any;
  items: Array<{
    equipoId: string | number;
    nombre: string;
    cantidad: number;
    cantidadDevuelta: number;
    fechaFinEstimada?: string;
  }>;
}

interface QuickReturnHeroCardProps {
  contratos: ContratoPendienteInfo[];
  onProcesar: (contrato: any) => void;
}

export function QuickReturnHeroCard({ contratos, onProcesar }: QuickReturnHeroCardProps) {
  const [sortMode, setSortMode] = useState<'CREATION_DESC' | 'DUE_ASC'>('CREATION_DESC');
  const [selectedContratoId, setSelectedContratoId] = useState<string | number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Ordenar los contratos basados en el sortMode
  const contratosOrdenados = useMemo(() => {
    return [...contratos].sort((a, b) => {
      const dateA = a.rawAlquiler?.created_at ? new Date(a.rawAlquiler.created_at).getTime() : 0;
      const dateB = b.rawAlquiler?.created_at ? new Date(b.rawAlquiler.created_at).getTime() : 0;
      
      const dueA = a.rawAlquiler?.detalles?.[0]?.fechaFinEstimada ? new Date(a.rawAlquiler.detalles[0].fechaFinEstimada).getTime() : 0;
      const dueB = b.rawAlquiler?.detalles?.[0]?.fechaFinEstimada ? new Date(b.rawAlquiler.detalles[0].fechaFinEstimada).getTime() : 0;

      if (sortMode === 'CREATION_DESC') {
        return dateB - dateA; // Más reciente primero
      } else {
        // DUE_ASC (vencimiento ascendente, más urgente primero)
        return dueA - dueB;
      }
    });
  }, [contratos, sortMode]);

  // Sincronizar el ID seleccionado si la data cambia o al inicio
  useEffect(() => {
    if (contratosOrdenados.length > 0) {
      // Si no hay ninguno seleccionado o el seleccionado ya no existe en la lista, tomar el primero
      if (!selectedContratoId || !contratosOrdenados.find(c => c.id === selectedContratoId)) {
        setSelectedContratoId(contratosOrdenados[0].id);
      }
    } else {
      setSelectedContratoId(null);
    }
  }, [contratosOrdenados, selectedContratoId]);

  const currentIndex = useMemo(() => {
    const idx = contratosOrdenados.findIndex(c => c.id === selectedContratoId);
    return idx >= 0 ? idx : 0;
  }, [contratosOrdenados, selectedContratoId]);

  const contratoActual = contratosOrdenados[currentIndex];

  const changeSlide = (direction: 'next' | 'prev') => {
    if (contratosOrdenados.length <= 1 || isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      let newIndex = currentIndex;
      if (direction === 'next') {
        newIndex = currentIndex === contratosOrdenados.length - 1 ? 0 : currentIndex + 1;
      } else {
        newIndex = currentIndex === 0 ? contratosOrdenados.length - 1 : currentIndex - 1;
      }
      setSelectedContratoId(contratosOrdenados[newIndex].id);
      setIsTransitioning(false);
    }, 150);
  };

  const handleProcesar = () => {
    if (contratoActual) {
      onProcesar(contratoActual);
    }
  };

  if (!contratos || contratos.length === 0 || !contratoActual) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl shadow-xl overflow-hidden relative">
      {/* Controles Superiores */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <select 
          id="tour-sort-devoluciones"
          value={sortMode}
          onChange={(e) => {
            setSortMode(e.target.value as 'CREATION_DESC' | 'DUE_ASC');
            // Al cambiar orden, reiniciamos la vista al primero
            setIsTransitioning(true);
            setTimeout(() => {
              setSelectedContratoId(null); 
              setIsTransitioning(false);
            }, 150);
          }}
          className="bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-salmon appearance-none"
        >
          <option value="CREATION_DESC" className="text-slate-800">Orden: Más Recientes</option>
          <option value="DUE_ASC" className="text-slate-800">Orden: Próximos a Vencer</option>
        </select>

        {contratosOrdenados.length > 1 && (
          <div className="flex items-center gap-1 bg-white/10 rounded-full p-1 border border-white/20">
            <button 
              onClick={() => changeSlide('prev')} 
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-white/90 font-medium px-2">
              {currentIndex + 1} / {contratosOrdenados.length}
            </span>
            <button 
              onClick={() => changeSlide('next')} 
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Contenido (Fade Transition) */}
      <div 
        className={`p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between transition-opacity duration-150 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-brand-salmon text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
              Devolución Rápida
            </span>
            <span className="text-slate-400 text-sm font-medium">Contrato #{contratoActual.consecutivo}</span>
          </div>
          
          <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
            <User className="w-6 h-6 text-brand-salmon" />
            {contratoActual.clienteNombre}
          </h3>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {contratoActual.items.map((item, idx) => {
              const itemDate = item.fechaFinEstimada ? new Date(item.fechaFinEstimada) : new Date();
              const isItemAtrasado = itemDate < new Date(new Date().setHours(0,0,0,0));
              return (
                <div key={idx} className="flex flex-col bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 min-w-[200px]">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm mb-1">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span className="truncate max-w-[200px]">{item.cantidad}x {item.nombre}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${isItemAtrasado ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isItemAtrasado ? <AlertOctagon className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    <span>Retorno: {itemDate.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 sm:mt-0 flex-shrink-0 w-full sm:w-auto flex justify-end">
          <button 
            id="tour-btn-devolucion-rapida"
            onClick={handleProcesar}
            className="w-full sm:w-auto bg-brand-salmon hover:bg-brand-salmonDark text-white shadow-lg hover:shadow-xl hover:shadow-brand-salmon/20 transition-all px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 group cursor-pointer"
          >
            <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            Procesar Devolución
          </button>
        </div>
      </div>
    </div>
  );
}
