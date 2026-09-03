import React from 'react';

interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function NeuInput({ icon, className = '', ...props }: NeuInputProps) {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
      )}
      <input
        className={`
          w-full py-3.5 ${icon ? 'pl-12' : 'pl-4'} pr-4 
          border-none rounded-xl bg-brand-salmonLight text-slate-700
          shadow-neu-salmon-inset outline-none placeholder:text-slate-400
          focus:ring-2 focus:ring-brand-salmonDark/30 transition-shadow
          ${className}
        `}
        {...props}
      />
    </div>
  );
}
