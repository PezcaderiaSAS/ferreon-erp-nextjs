import React, { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "glass-button-primary px-4 py-2 text-white focus-visible:ring-brand-500",
    secondary: "bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-white px-4 py-2 focus-visible:ring-slate-400",
    ghost: "bg-transparent text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 px-3 py-1.5 focus-visible:ring-brand-400",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
