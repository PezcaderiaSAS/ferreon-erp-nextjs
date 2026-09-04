"use client";

import React, { useEffect, useState } from 'react';
import { useLedgerStore } from '../../../infrastructure/state/ledgerStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { NeuExcelImportWizard } from '../../../components/ui/neumorphism/NeuExcelImportWizard';
import { FinancialHelpModal } from './FinancialHelpModal';

// Datos de prueba para el gráfico
const mockChartData = [
  { name: 'Lun', saldo: 1200000 },
  { name: 'Mar', saldo: 1500000 },
  { name: 'Mié', saldo: 1100000 },
  { name: 'Jue', saldo: 1800000 },
  { name: 'Vie', saldo: 2100000 },
];

export function NeuFinancialDashboard() {
  const { wallets, fetchAccounts, getROI, isLoading } = useLedgerStore();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const roiMock = getROI("equipo-test"); // Mock

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Botón Flotante de Ayuda */}
      <button 
        onClick={() => setIsHelpModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-[0_10px_25px_rgba(79,70,229,0.4)] hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all flex items-center justify-center font-bold text-2xl"
        title="Guía Financiera"
      >
        ?
      </button>

      {/* Cajas y Billeteras */}
      <div className="tour-cajas">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Mis Cajas y Billeteras</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {wallets.map(wallet => (
            <div key={wallet.id} className="bg-slate-50 p-6 rounded-3xl shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase">{wallet.name}</h3>
                <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">💰</span>
              </div>
              <p className="text-2xl font-black text-slate-800">{formatearCOP(Math.random() * 5000000)}</p>
            </div>
          ))}
          {wallets.length === 0 && (
             <p className="text-slate-500 font-semibold col-span-full">No hay cajas configuradas o no se ha cargado el plan de cuentas.</p>
          )}
        </div>
      </div>

      {/* Gráfico y ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico de Flujo de Caja */}
        <div className="lg:col-span-2 bg-slate-50 p-6 rounded-3xl shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] tour-flujo-caja">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Flujo de Caja Consolidado</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatearCOP(value), 'Saldo']}
                />
                <Line type="monotone" dataKey="saldo" stroke="#4f46e5" strokeWidth={4} dot={{r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel de ROI */}
        <div className="bg-slate-50 p-6 rounded-3xl shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] flex flex-col justify-center tour-roi">
          <h2 className="text-xl font-bold text-slate-800 mb-2">ROI Promedio (Equipos)</h2>
          <p className="text-sm text-slate-500 font-semibold mb-6">Recuperación de la inversión mediante alquileres vs Mantenimiento.</p>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Producido (Ingresos)</p>
              <p className="text-lg font-black text-emerald-600">{formatearCOP(roiMock.ingresos)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Costo Inversión (CAPEX+OPEX)</p>
              <p className="text-lg font-black text-rose-500">{formatearCOP(roiMock.costos)}</p>
            </div>
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs font-bold text-indigo-500 uppercase mb-1">Retorno (ROI)</p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-black text-indigo-600">{roiMock.roi.toFixed(1)}%</p>
                <span className="text-sm font-bold text-emerald-500 mb-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  Rentable
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Importador Zero-CSV */}
      <div className="mt-8 tour-importador">
        <NeuExcelImportWizard onImportSuccess={(data) => console.log('Datos importados:', data)} />
      </div>

      {/* Modal de Ayuda */}
      <FinancialHelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
    </div>
  );
}
