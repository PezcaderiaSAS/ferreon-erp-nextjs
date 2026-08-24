import Link from 'next/link';

export function TopNav() {
  return (
    <header className="bg-white text-slate-900 font-sans h-16 sticky top-0 z-40 border-b border-slate-200 shadow-sm flex items-center justify-between px-6">
      <div className="flex items-center w-full max-w-md focus-within:ring-2 focus-within:ring-brand-salmon rounded-lg overflow-hidden bg-slate-50 border border-slate-200">
        <span className="material-symbols-outlined px-4 text-slate-500">search</span>
        <input 
          className="w-full py-2 border-none focus:ring-0 text-slate-900 text-sm bg-transparent outline-none" 
          placeholder="Search..." 
          type="text"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="text-slate-500 hover:text-brand-salmon transition-colors p-2 rounded-full hover:bg-slate-100">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <Link href="/configuracion" className="text-slate-500 hover:text-brand-salmon transition-colors p-2 rounded-full hover:bg-slate-100 flex items-center justify-center">
          <span className="material-symbols-outlined">settings</span>
        </Link>
        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300 ml-2 cursor-pointer">
          <img 
            alt="User profile photo" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYZXiDTt6hl5glrxJFIja-hQ01Z3wgwwasLOqJ7wMNW6Y5A_DyWQw5U-hBCkwX5LDcGVKMv31nRv7hp0DiKtdtCH4yIgLcHGL86WRh2Q4eqDo057sq-GcWKfWTIVuojIQRpPykprXkDuqfVdcUFhiXpXiqK4DoEHEfvJv4Y__ASe-cs6mMJr-vM0TXzbWlooiq6kED6y8I66lFkG0I73U2-EhcdYifPe3sCyvBpQGNdOo18aY7sPpOKld97qf4xguE_WdlKIhF1N0"
          />
        </div>
      </div>
    </header>
  );
}
