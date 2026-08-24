import React from 'react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-card border border-slate-200 p-8 text-center flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso Denegado</h1>
          <p className="text-slate-600 font-medium text-lg leading-snug">
            No tienes autorización para este tipo de procesos, busca ayuda de un usuario con autorización.
          </p>
        </div>

        <Link 
          href="/" 
          className="mt-4 px-6 py-3 w-full bg-brand-salmon text-white rounded-xl font-medium shadow-md shadow-brand-salmon/20 hover:bg-brand-salmonDark transition-colors inline-block"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
