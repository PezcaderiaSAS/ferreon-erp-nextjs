"use client";
import { UserPlus, Users, ShieldCheck, ShieldAlert, Search, Eye, UserSearch } from "lucide-react";

import React, { useState, useMemo, useEffect } from 'react';
import { useClienteStore } from '../../infrastructure/state/clienteStore';
import { Modal } from '../../components/ui/Modal';
import { ClienteForm } from '../../components/forms/ClienteForm';
import { DetalleClienteModal } from '../components/clientes/DetalleClienteModal';
import { ClienteUI } from '../../infrastructure/state/clienteStore';

export default function ClientesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetalleModalOpen, setIsDetalleModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteUI | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const clientes = useClienteStore((state) => state.clientes);

  const handleOpenDetalle = (cliente: ClienteUI) => {
    setSelectedCliente(cliente);
    setIsDetalleModalOpen(true);
  };

  const clientesFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return clientes;
    const lower = searchTerm.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(lower) ||
        (c.nit_cedula?.toLowerCase().includes(lower) || c.nit?.toLowerCase().includes(lower) || false) ||
        (c.telefono?.toLowerCase().includes(lower) || c.contacto?.toLowerCase().includes(lower) || false) ||
        (c.email && c.email.toLowerCase().includes(lower))
    );
  }, [clientes, searchTerm]);

  // KPIs
  const totalClientes = clientes.length;
  const clientesBajoRiesgo = clientes.filter(c => c.nivel_riesgo === 'Bajo').length;
  const clientesRiesgoAtencion = clientes.filter(c => c.nivel_riesgo === 'Medio' || c.nivel_riesgo === 'Alto').length;

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const setClientes = useClienteStore((state) => state.setClientes);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clientes', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setClientes(json.data);
      }
    } catch (e) {
      console.warn('[ClientesPage] Error al cargar clientes desde DB:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchClientes();

    const handleReconcile = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchClientes();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleReconcile);
      window.addEventListener('focus', handleReconcile);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleReconcile);
        window.removeEventListener('focus', handleReconcile);
      }
    };
  }, []);

  if (!isMounted) {
    return <div className="p-8 text-center text-slate-500">Cargando directorio de clientes...</div>;
  }

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Directorio de Clientes</h2>
          <p className="text-base text-slate-600 mt-1">Gestión integral de clientes, historial de contratos y estado de cartera.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-brand-salmon hover:bg-brand-salmonDark text-white transition-colors px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
        >
          <UserPlus className="w-5 h-5" />
          Añadir Nuevo Cliente
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Clientes</span>
            <Users className="text-slate-400 w-6 h-6" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalClientes}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Clientes Confiables</span>
            <ShieldCheck className="text-emerald-500 w-6 h-6" />
          </div>
          <p className="text-3xl font-bold text-emerald-700">{clientesBajoRiesgo} <span className="text-xs font-normal text-slate-500">Riesgo Bajo</span></p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Seguimiento Cartera</span>
            <ShieldAlert className="text-amber-500 w-6 h-6" />
          </div>
          <p className="text-3xl font-bold text-amber-700">{clientesRiesgoAtencion} <span className="text-xs font-normal text-slate-500">Medio / Alto</span></p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden flex-1 flex flex-col min-h-[450px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, NIT o teléfono..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-salmon text-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Cliente / Empresa</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">NIT / Documento</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Contacto</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Correo Electrónico</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Nivel de Riesgo</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-sm">
              {clientesFiltrados.map((cliente) => (
                <tr 
                  key={cliente.id} 
                  onClick={() => handleOpenDetalle(cliente)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-4 font-semibold text-slate-900 group-hover:text-brand-salmon transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs group-hover:bg-brand-salmonLight group-hover:text-brand-salmonDark transition-colors">
                        {cliente.nombre.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{cliente.nombre}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs font-mono font-medium text-slate-600">{cliente.nit}</td>
                  <td className="py-4 px-4 text-xs font-medium text-slate-600">{cliente.contacto}</td>
                  <td className="py-4 px-4 text-xs text-slate-500">{cliente.email || '—'}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                      cliente.nivel_riesgo === 'Bajo' ? 'bg-emerald-50 text-emerald-700' :
                      cliente.nivel_riesgo === 'Medio' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-100 text-red-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        cliente.nivel_riesgo === 'Bajo' ? 'bg-emerald-500' :
                        cliente.nivel_riesgo === 'Medio' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}></span>
                      {cliente.nivel_riesgo}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetalle(cliente);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-brand-salmon hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-xs"
                      title="Ver ficha 360°, editar e historial"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ficha 360°</span>
                    </button>
                  </td>
                </tr>
              ))}
              {clientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <UserSearch className="w-10 h-10 text-slate-300 mb-2 block mx-auto" />
                    No se encontraron clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear Cliente */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        title="Añadir Nuevo Cliente"
        maxWidth="2xl"
      >
        <ClienteForm 
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Modal Ficha 360° del Cliente */}
      <DetalleClienteModal
        isOpen={isDetalleModalOpen}
        onClose={() => {
          setIsDetalleModalOpen(false);
          setSelectedCliente(null);
        }}
        cliente={selectedCliente}
      />
    </div>
  );
}

