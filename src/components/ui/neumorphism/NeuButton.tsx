import React from 'react';

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function NeuButton({ children, className = '', ...props }: NeuButtonProps) {
  return (
    <button
      className={`
        px-6 py-3 border-none rounded-xl bg-brand-salmonLight text-brand-salmonDark font-semibold 
        shadow-neu-salmon hover:shadow-neu-salmon-inset active:shadow-neu-salmon-inset 
        transition-all duration-300 ease-in-out cursor-pointer focus:outline-none
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
