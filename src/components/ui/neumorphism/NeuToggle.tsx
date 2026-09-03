import React from 'react';

interface NeuToggleProps {
  isOn: boolean;
  onToggle: (state: boolean) => void;
  label?: string;
  className?: string;
}

export function NeuToggle({ isOn, onToggle, label, className = '' }: NeuToggleProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {label && <span className="font-semibold text-slate-600">{label}</span>}
      <div 
        className="relative w-16 h-8 rounded-full bg-brand-salmonLight shadow-neu-salmon-inset cursor-pointer flex items-center p-1"
        onClick={() => onToggle(!isOn)}
      >
        <div 
          className={`
            flex items-center justify-center
            w-6 h-6 rounded-full bg-brand-salmonLight shadow-neu-salmon-sm
            transform transition-transform duration-300 ease-in-out
            ${isOn ? 'translate-x-8' : 'translate-x-0'}
          `}
        >
          {/* Círculo indicador de estado pastel */}
          <div 
            className={`
              w-2 h-2 rounded-full transition-colors duration-300
              ${isOn ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]' : 'bg-rose-400 shadow-[0_0_4px_rgba(251,113,133,0.5)]'}
            `}
          />
        </div>
      </div>
      <span className="font-bold text-slate-500 text-sm">
        {isOn ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}
