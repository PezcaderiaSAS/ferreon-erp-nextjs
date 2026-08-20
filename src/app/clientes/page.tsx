"use client";

import React, { useState } from 'react';
import { useClienteStore } from '../../infrastructure/state/clienteStore';
import { Modal } from '../../components/ui/Modal';
import { ClienteForm } from '../../components/forms/ClienteForm';

export default function ClientesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const clientes = useClienteStore((state) => state.clientes);

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Directorio de Clientes</h2>
          <p className="text-base text-slate-600 mt-1">Gestiona la información de tus clientes y su historial de alquileres.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-salmon hover:bg-brand-salmonDark text-white transition-colors px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Añadir Cliente
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-card border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Total Clientes</h3>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">group</span>
          </div>
          <p className="text-4xl font-semibold text-slate-900">{clientes.length}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombre/Empresa</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">NIT/Doc</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Contacto</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Nivel de Riesgo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="py-4 px-4 font-medium text-slate-900">{cliente.nombre}</td>
                  <td className="py-4 px-4 text-sm text-slate-600">{cliente.nit}</td>
                  <td className="py-4 px-4 text-sm text-slate-600">{cliente.contacto}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${
                      cliente.nivel_riesgo === 'Bajo' ? 'bg-emerald-50 text-emerald-700' :
                      cliente.nivel_riesgo === 'Medio' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {cliente.nivel_riesgo}
                    </span>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No hay clientes registrados.
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
        title="Añadir Nuevo Cliente"
      >
        <ClienteForm 
          onSuccess={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
