"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { BodegaForm } from '../../components/forms/BodegaForm';
import { SupabaseEquipoRepository } from '../../infrastructure/adapters/SupabaseEquipoRepository';
import { Equipo } from '../../core/domain/entities/equipo';

export default function BodegaPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEquipos = async () => {
    try {
      const repo = new SupabaseEquipoRepository();
      const data = await repo.obtenerTodos();
      setEquipos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipos();
  }, []);

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchEquipos(); // Refresh list after adding
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900 mb-1">Inventario de Equipos</h2>
          <p className="text-base text-slate-600 mt-1">Gestiona el stock, disponibilidad y estado del equipamiento.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-brand-salmon hover:bg-brand-salmonDark text-white px-6 py-2 rounded-lg transition-colors shadow-sm w-full sm:w-auto text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">add_box</span>
          Añadir Equipo
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-card border border-transparent flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-slate-600">
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            <h3 className="text-sm font-medium">Total Equipos</h3>
          </div>
          <div className="text-4xl font-semibold text-slate-900">{equipos.length}</div>
        </div>
      </div>

      {/* Main Content (DataTable) */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Código (SKU)</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombre</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Categoría</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Peso (Gramos)</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-900">
              {equipos.map((equipo) => (
                <tr key={equipo.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 font-mono text-slate-500">{equipo.sku}</td>
                  <td className="py-4 px-4 font-medium">{equipo.nombre}</td>
                  <td className="py-4 px-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[12px]">{equipo.categoria}</span>
                  </td>
                  <td className="py-4 px-4 text-right">{equipo.peso_gramos}g</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[12px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                      {equipo.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {equipos.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No hay equipos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Añadir Nuevo Equipo"
      >
        <BodegaForm 
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
