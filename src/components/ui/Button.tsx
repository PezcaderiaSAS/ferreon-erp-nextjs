import React, { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-brand-salmon hover:bg-[#E8644A] text-white shadow-md shadow-brand-salmon/20 px-4 py-2 focus-visible:ring-brand-500 border border-transparent",
    secondary: "bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-white px-4 py-2 focus-visible:ring-slate-400",
    ghost: "bg-transparent text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 px-3 py-1.5 focus-visible:ring-brand-400",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center space-x-2">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Cargando...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
