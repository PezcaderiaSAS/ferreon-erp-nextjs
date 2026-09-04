"use client";

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

export interface NeuExcelImportWizardProps {
  onImportSuccess?: (data: any[]) => void;
}

export function NeuExcelImportWizard({ onImportSuccess }: NeuExcelImportWizardProps) {
  const [fileData, setFileData] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convierte el excel a un arreglo de objetos JSON
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        
        if (data.length > 0) {
          setColumns(Object.keys(data[0] as object));
          setFileData(data);
        } else {
          setError('El archivo Excel está vacío.');
        }
      } catch (err) {
        setError('Error al leer el archivo Excel. Asegúrate de que sea un archivo .xlsx válido.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('No se pudo leer el archivo.');
      setIsProcessing(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirm = () => {
    if (fileData && onImportSuccess) {
      onImportSuccess(fileData);
      setFileData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    setFileData(null);
    setColumns([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-slate-50 p-6 rounded-3xl shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] transition-all">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Importador Inteligente (Zero-CSV)</h2>
      
      {!fileData && (
        <div 
          className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-indigo-500">
            {isProcessing ? (
               <span className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-700">Selecciona un archivo Excel (.xlsx)</h3>
          <p className="text-sm text-slate-500 mt-1">Se recomienda usar nuestra plantilla oficial de Saldos Históricos.</p>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 font-semibold rounded-xl border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {fileData && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase">Pre-visualización de Datos</h3>
              <p className="text-lg font-bold text-slate-800">{fileData.length} registros listos para importar</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirm}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Procesar y Guardar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-xs">
                  <tr>
                    {columns.map(col => (
                      <th key={col} className="px-4 py-3 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fileData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      {columns.map(col => (
                        <td key={col} className="px-4 py-3 whitespace-nowrap">{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fileData.length > 5 && (
              <div className="bg-slate-50 px-4 py-2 text-center text-xs font-bold text-slate-500 border-t border-slate-100">
                Mostrando 5 de {fileData.length} filas...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
