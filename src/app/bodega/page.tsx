'use client';

import React, { useState, useEffect } from 'react';
import { PlusSquare, Package, CheckCircle, Wrench, Warehouse, FileEdit } from "lucide-react";
import { Modal } from '../../components/ui/Modal';
import { BodegaForm } from '../../components/forms/BodegaForm';
import { EditarEquipoModal } from '../components/bodega/EditarEquipoModal';
import { useBodegaStore } from '../../infrastructure/state/bodegaStore';
import { EquipoUI } from '../../infrastructure/state/bodegaStore';
import { equipoToEquipoUI } from '../../lib/mappers';

export default function BodegaPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<EquipoUI | null>(null);
  const { equipos, setEquipos } = useBodegaStore();
  const [loading, setLoading] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  const fetchEquipos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/equipos');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEquipos(json.data.map(equipoToEquipoUI));
      }
    } catch (e) {
      console.warn('[BodegaPage] Usando almacenamiento local persistido (modo offline):', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchEquipos();
  }, []);

  if (!isMounted) {
    return <div className="p-8 text-center text-slate-500">Cargando inventario...</div>;
  }

  const handleOpenEdit = (equipo: EquipoUI) => {
    setSelectedEquipo(equipo);
    setIsEditModalOpen(true);
  };

  // KPIs
  const totalModelos = equipos.length;
  const totalStockFisico = equipos.reduce((acc, eq) => acc + (eq.stockTotal || 0), 0);
  const totalDisponible = equipos.reduce((acc, eq) => acc + (eq.stockDisponible || 0), 0);
  const totalEnObra = equipos.reduce((acc, eq) => acc + (eq.stockEnObra || 0), 0);

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900 mb-1">Inventario y Bodega</h2>
          <p className="text-base text-slate-600 mt-1">Control de existencias físicas, disponibilidad para alquiler y ajustes de stock.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-brand-salmon hover:bg-brand-salmonDark text-white px-6 py-2.5 rounded-xl transition-colors shadow-sm w-full sm:w-auto text-sm font-semibold"
        >
          <PlusSquare className="w-5 h-5" />
          Añadir Nuevo Equipo
        </button>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Equipos</span>
            <Package className="text-slate-400 w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalModelos} <span className="text-xs font-normal text-slate-500">modelos</span></div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Disponible</span>
            <CheckCircle className="text-emerald-500 w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-emerald-700">{totalDisponible} <span className="text-xs font-normal text-slate-500">unidades listas</span></div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock en Obra</span>
            <Wrench className="text-amber-500 w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-amber-700">{totalEnObra} <span className="text-xs font-normal text-slate-500">alquiladas</span></div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Capacidad Total</span>
            <Warehouse className="text-slate-400 w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalStockFisico} <span className="text-xs font-normal text-slate-500">unidades físicas</span></div>
        </div>
      </div>

      {/* Main Content (DataTable) */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Código (SKU)</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombre del Equipo</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Categoría</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-emerald-700 uppercase tracking-wider text-center">Disponible</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-amber-700 uppercase tracking-wider text-center">En Obra</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Total</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Tarifa / Día</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-900 bg-white">
              {equipos.map((equipo) => (
                <tr 
                  key={equipo.id} 
                  onClick={() => handleOpenEdit(equipo)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-4 font-mono text-xs font-bold text-slate-700">
                    <span className="bg-slate-100 group-hover:bg-slate-200 px-2 py-1 rounded-md transition-colors">
                      {equipo.sku}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-slate-900 group-hover:text-brand-salmon transition-colors">
                      {equipo.nombre}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-medium">
                      {equipo.categoria}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200/60 min-w-[32px]">
                      {equipo.stockDisponible ?? 0}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200/60 min-w-[32px]">
                      {equipo.stockEnObra ?? 0}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-semibold text-slate-700">
                    {equipo.stockTotal ?? ((equipo.stockDisponible || 0) + (equipo.stockEnObra || 0))}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-900">
                    ${(equipo.tarifaDiaria || 0).toLocaleString('es-CO')}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                      equipo.estado === 'Disponible' ? 'bg-emerald-50 text-emerald-700' :
                      equipo.estado === 'En Alquiler' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        equipo.estado === 'Disponible' ? 'bg-emerald-500' :
                        equipo.estado === 'En Alquiler' ? 'bg-amber-500' :
                        'bg-slate-400'
                      }`}></span>
                      {equipo.estado}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(equipo);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-brand-salmon hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-xs"
                      title="Editar datos y ajustar stock"
                    >
                      <FileEdit className="w-4 h-4" />
                      <span>Ajustar / Editar</span>
                    </button>
                  </td>
                </tr>
              ))}
              {equipos.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Package className="w-10 h-10 text-slate-300 mb-2 block mx-auto" />
                    No hay equipos registrados en bodega.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear Nuevo Equipo */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        title="Añadir Nuevo Equipo a Bodega"
        maxWidth="2xl"
      >
        <BodegaForm 
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Modal para Editar Equipo y Ajustar Stock */}
      <EditarEquipoModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEquipo(null);
        }}
        equipo={selectedEquipo}
      />
    </div>
  );
}

