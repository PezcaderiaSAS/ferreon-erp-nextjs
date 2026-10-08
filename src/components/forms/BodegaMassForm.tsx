'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { useBodegaStore } from '../../infrastructure/state/bodegaStore';
import { Plus, Trash2, Save } from 'lucide-react';
import { crearEquipoAction, crearEquiposMasivoAction } from '../../app/actions/equipos';

interface BodegaMassFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function BodegaMassForm({ onSuccess, onCancel }: BodegaMassFormProps) {
  const { generarSiguienteSKU } = useBodegaStore();
  
  const [items, setItems] = useState([
    { id: crypto.randomUUID(), sku: generarSiguienteSKU(), nombre: '', categoria: 'Construcción', tarifaDiaria: 35000, valorReposicion: 100000, stockInicial: 1 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleAddRow = () => {
    // Generate a temporary SKU based on the last one
    const lastSku = items[items.length - 1]?.sku || generarSiguienteSKU();
    const match = lastSku.match(/EQ-(\d+)/);
    let nextSku = generarSiguienteSKU();
    if (match) {
      const num = parseInt(match[1], 10) + 1;
      nextSku = `EQ-${num.toString().padStart(3, '0')}`;
    }

    setItems([...items, {
      id: crypto.randomUUID(),
      sku: nextSku,
      nombre: '',
      categoria: 'Construcción',
      tarifaDiaria: 35000,
      valorReposicion: 100000,
      stockInicial: 1
    }]);
  };

  const handleRemoveRow = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const onSubmit = async () => {
    setErrors([]);
    
    // Validations
    const newErrors: string[] = [];
    if (items.length === 0) newErrors.push('Debe añadir al menos un equipo.');
    items.forEach((item, index) => {
      if (!item.nombre.trim()) newErrors.push(`Fila ${index + 1}: El nombre es obligatorio.`);
      if (item.tarifaDiaria < 0) newErrors.push(`Fila ${index + 1}: La tarifa no puede ser negativa.`);
      if (item.valorReposicion < 0) newErrors.push(`Fila ${index + 1}: El valor de reposición no puede ser negativo.`);
      if (item.stockInicial < 0) newErrors.push(`Fila ${index + 1}: El stock inicial no puede ser negativo.`);
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await crearEquiposMasivoAction(items.map(item => ({
        sku: item.sku,
        nombre: item.nombre.trim().toUpperCase(),
        categoria: item.categoria.trim(),
        tarifaDiaria: item.tarifaDiaria,
        valorReposicion: item.valorReposicion,
        stockInicial: item.stockInicial
      })));

      if (!result.success) {
        setErrors([`Error masivo: ${result.error}`]);
      } else {
        alert(`Se guardaron ${result.count} equipos exitosamente en la bodega.`);
        onSuccess();
      }
    } catch (e: any) {
      setErrors([`Error inesperado: ${e.message}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <ul className="list-disc pl-5">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 bg-slate-50">
              <th className="p-2 w-[120px]">SKU</th>
              <th className="p-2 w-[200px]">Nombre</th>
              <th className="p-2 w-[140px]">Categoría</th>
              <th className="p-2 w-[120px]">Tarifa/Día</th>
              <th className="p-2 w-[120px]">Valor Repo.</th>
              <th className="p-2 w-[100px]">Stock</th>
              <th className="p-2 w-[50px]"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                <td className="p-2">
                  <input
                    type="text"
                    value={item.sku}
                    readOnly
                    disabled
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-slate-100 text-slate-500 cursor-not-allowed select-none"
                    placeholder="SKU"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={item.nombre}
                    onChange={(e) => updateItem(item.id, 'nombre', e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-salmon"
                    placeholder="Ej. ANDAMIO"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={item.categoria}
                    onChange={(e) => updateItem(item.id, 'categoria', e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-salmon"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    value={item.tarifaDiaria}
                    onChange={(e) => updateItem(item.id, 'tarifaDiaria', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-salmon"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    value={item.valorReposicion}
                    onChange={(e) => updateItem(item.id, 'valorReposicion', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-salmon"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    value={item.stockInicial}
                    onChange={(e) => updateItem(item.id, 'stockInicial', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-brand-salmon text-center bg-emerald-50"
                  />
                </td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(item.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Eliminar fila"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center mt-2">
        <button
          type="button"
          onClick={handleAddRow}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-salmon hover:text-brand-salmonDark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Añadir fila
        </button>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
        <button 
          type="button" 
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <Button 
          type="button" 
          onClick={onSubmit}
          isLoading={isSubmitting}
          className="min-w-[150px] flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Guardar Todos
        </Button>
      </div>
    </div>
  );
}
