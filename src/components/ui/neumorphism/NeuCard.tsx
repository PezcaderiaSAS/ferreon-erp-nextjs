import React from 'react';

interface NeuCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function NeuCard({ title, children, className = '', icon }: NeuCardProps) {
  return (
    <div className={`p-6 rounded-[20px] bg-brand-salmonLight shadow-neu-salmon ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-full shadow-neu-salmon-inset bg-brand-salmonLight flex items-center justify-center mb-4 mx-auto text-brand-salmonDark">
          {icon}
        </div>
      )}
      {title && <h3 className="text-xl font-bold text-center text-slate-700 mb-2">{title}</h3>}
      <div className="text-sm text-slate-600 text-center">
        {children}
      </div>
    </div>
  );
}
