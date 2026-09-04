import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NeuStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function NeuStepper({ value, onChange, min = 0, max = Infinity, className = '' }: NeuStepperProps) {
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className={`flex items-center gap-4 p-2 bg-brand-salmonLight rounded-2xl shadow-neu-salmon-inset w-fit ${className}`}>
      {/* Botón Menos */}
      <button
        onClick={handleDecrement}
        disabled={value <= min}
        className={`
          flex items-center justify-center w-11 h-11 rounded-xl
          bg-brand-salmonLight shadow-neu-salmon-sm
          active:shadow-neu-salmon-inset active:scale-95 transition-all
          ${value <= min ? 'opacity-50 cursor-not-allowed' : 'text-slate-700 hover:text-brand-salmonDark'}
        `}
      >
        <Minus className="w-5 h-5" />
      </button>

      {/* Display Numérico */}
      <div className="w-12 text-center">
        <span className="text-xl font-black text-slate-800 font-mono tracking-tight">
          {value}
        </span>
      </div>

      {/* Botón Más */}
      <button
        onClick={handleIncrement}
        disabled={value >= max}
        className={`
          flex items-center justify-center w-11 h-11 rounded-xl
          bg-brand-salmonLight shadow-neu-salmon-sm
          active:shadow-neu-salmon-inset active:scale-95 transition-all
          ${value >= max ? 'opacity-50 cursor-not-allowed' : 'text-slate-700 hover:text-brand-salmonDark'}
        `}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
