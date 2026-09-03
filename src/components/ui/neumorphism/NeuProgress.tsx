import React from 'react';

interface NeuProgressProps {
  progress: number; // 0 to 100
  className?: string;
}

export function NeuProgress({ progress, className = '' }: NeuProgressProps) {
  // Asegurar límites entre 0 y 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full h-4 rounded-full bg-brand-salmonLight shadow-neu-salmon-inset p-1 ${className}`}>
      <div 
        className="h-full rounded-full bg-gradient-to-r from-[#ffd04a] to-[#ff8a00] shadow-neu-salmon-sm transition-all duration-300 ease-out flex items-center justify-center relative"
        style={{ width: `${clampedProgress}%` }}
      >
        {clampedProgress > 10 && (
          <span className="absolute text-[10px] font-bold text-white shadow-sm drop-shadow-md">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
    </div>
  );
}
