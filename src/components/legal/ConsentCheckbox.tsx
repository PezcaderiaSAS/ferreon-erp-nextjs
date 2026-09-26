'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export interface ConsentCheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({
  id = 'legal-consent-checkbox',
  checked,
  onChange,
  error,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`space-y-2 rounded-xl bg-slate-900/60 p-4 border transition-colors ${error ? 'border-rose-500/50' : 'border-slate-800'} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center h-5 mt-0.5">
          <input
            id={id}
            name="legalConsent"
            type="checkbox"
            required
            aria-required="true"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            disabled={disabled}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:ring-offset-0 focus:outline-none transition-all cursor-pointer disabled:opacity-50"
          />
        </div>
        <label 
          htmlFor={id} 
          className="text-xs text-slate-300 leading-relaxed cursor-pointer select-none"
        >
          Declaro bajo gravedad de juramento que tengo facultad legal para actuar en nombre de esta organización, y que he leído y acepto expresamente los{' '}
          <Link 
            href="/terminos" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-orange-400 font-semibold underline hover:text-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-400 rounded px-0.5"
          >
            Términos y Condiciones del Servicio
          </Link>{' '}
          (con límites de responsabilidad, cláusula <em>As Is</em> y supervisión humana obligatoria), así como la{' '}
          <Link 
            href="/privacidad" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-orange-400 font-semibold underline hover:text-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-400 rounded px-0.5"
          >
            Política de Privacidad y Cookies Técnicas
          </Link>.
        </label>
      </div>

      {error && (
        <p id={`${id}-error`} className="text-xs text-rose-400 flex items-center gap-1.5 font-medium pl-7">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
