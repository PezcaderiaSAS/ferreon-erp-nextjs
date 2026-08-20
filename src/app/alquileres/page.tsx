"use client";

import React, { useState } from 'react';
import { useAlquilerStore } from '../../infrastructure/state/alquilerStore';
import { AlquilerForm } from '../../components/forms/AlquilerForm';
import { Modal } from '../../components/ui/Modal';

export default function AlquileresPage() {
  const { alquileres } = useAlquilerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');

  const alquileresFiltrados = alquileres.filter(a => {
    if (filtroEstado === 'Todos') return true;
    if (filtroEstado === 'Activos') return a.estado === 'ACTIVO';
    if (filtroEstado === 'Cotizaciones') return a.estado === 'COTIZACION';
    return true;
  });

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900 mb-1">Contratos de Alquiler</h2>
          <p className="text-base text-slate-600">Gestiona y supervisa los alquileres de maquinaria y equipos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-salmonLight text-brand-salmonDark hover:bg-brand-salmon hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm self-start md:self-end"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nuevo Contrato
        </button>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex gap-2">
            <button 
              onClick={() => setFiltroEstado('Todos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition-colors ${filtroEstado === 'Todos' ? 'bg-white text-slate-900 border-slate-200' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100'}`}
            >Todos</button>
            <button 
              onClick={() => setFiltroEstado('Activos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition-colors ${filtroEstado === 'Activos' ? 'bg-white text-slate-900 border-slate-200' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100'}`}
            >Activos</button>
            <button 
              onClick={() => setFiltroEstado('Cotizaciones')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border shadow-sm transition-colors ${filtroEstado === 'Cotizaciones' ? 'bg-white text-slate-900 border-slate-200' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100'}`}
            >Cotizaciones</button>
          </div>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-salmon focus:ring-1 focus:ring-brand-salmon transition-all" 
              placeholder="Buscar contrato..." 
              type="text"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-10 border-b border-slate-200 shadow-sm">
              <tr>
                <th className="py-3 px-4 text-sm text-slate-600 font-semibold">ID</th>
                <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Cliente</th>
                <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Fecha Inicio</th>
                <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Equipos</th>
                <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Estado</th>
                <th className="py-3 px-4 text-sm text-slate-600 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {alquileresFiltrados.map((alq) => (
                <tr key={alq.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                  <td className="py-3 px-4 text-sm text-slate-900 font-medium">#{alq.id}</td>
                  <td className="py-3 px-4 text-sm text-slate-900">{alq.clienteNombre || 'Sin Nombre'}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{new Date(alq.createdAt || Date.now()).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-1 bg-slate-100 rounded text-[11px] font-medium text-slate-600">
                        {alq.detalles.length} Equipo(s)
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[12px] font-medium ${alq.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700' : alq.estado === 'COTIZACION' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                      {alq.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-slate-400 hover:text-brand-salmon transition-colors p-1 rounded hover:bg-slate-100">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
              {alquileresFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No hay contratos de alquiler para mostrar.
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
        title="Registrar Nuevo Contrato"
      >
        <AlquilerForm 
          onSuccess={() => setIsModalOpen(false)} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
}
