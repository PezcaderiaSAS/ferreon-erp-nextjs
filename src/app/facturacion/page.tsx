export default function FacturacionPage() {
  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Facturación y Cobros</h2>
          <p className="text-base text-slate-600 mt-1">Gestiona tus ingresos, facturas emitidas y estado de pagos.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-brand-salmonLight text-brand-salmonDark hover:bg-brand-salmon hover:text-white transition-colors px-6 py-2 rounded-lg text-sm font-semibold shadow-sm">
          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
          Generar Factura
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ingresos */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-slate-200 flex flex-col gap-2">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-sm font-medium">Ingresos del Mes</span>
            <span className="material-symbols-outlined text-brand-salmon text-[20px]">trending_up</span>
          </div>
          <span className="text-4xl font-semibold text-slate-900">$45,230.00</span>
          <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
            <span className="material-symbols-outlined text-sm">arrow_upward</span>
            <span>+12% vs mes anterior</span>
          </div>
        </div>
        
        {/* Por Cobrar */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-slate-200 flex flex-col gap-2">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-sm font-medium">Por Cobrar</span>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">pending_actions</span>
          </div>
          <span className="text-4xl font-semibold text-slate-900">$12,400.50</span>
          <p className="text-sm text-slate-500">15 facturas pendientes</p>
        </div>
        
        {/* Vencido */}
        <div className="bg-red-50 p-6 rounded-xl shadow-card border border-red-200 flex flex-col gap-2">
          <div className="flex items-center justify-between text-red-700">
            <span className="text-sm font-medium">Vencido</span>
            <span className="material-symbols-outlined text-red-600 text-[20px]">warning</span>
          </div>
          <span className="text-4xl font-semibold text-red-600">$3,150.00</span>
          <p className="text-sm text-red-600">5 facturas fuera de plazo</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-2 rounded-xl shadow-card border border-slate-200">
        <div className="flex gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          <button className="px-4 py-1.5 rounded-lg bg-slate-100 text-slate-900 text-sm font-medium border border-transparent transition-colors">Todas</button>
          <button className="px-4 py-1.5 rounded-lg text-slate-600 bg-white hover:bg-slate-50 text-sm font-medium border border-transparent transition-colors">Pagadas</button>
          <button className="px-4 py-1.5 rounded-lg text-slate-600 bg-white hover:bg-slate-50 text-sm font-medium border border-transparent transition-colors">Pendientes</button>
          <button className="px-4 py-1.5 rounded-lg text-slate-600 bg-white hover:bg-slate-50 text-sm font-medium border border-transparent transition-colors">Vencidas</button>
        </div>
        <div className="flex items-center gap-2 px-3 bg-white rounded-lg border border-slate-200 focus-within:border-brand-salmon focus-within:ring-1 focus-within:ring-brand-salmon w-full sm:w-64 transition-all">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
          <input 
            className="w-full bg-transparent border-none focus:ring-0 py-1.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none" 
            placeholder="N° Factura..." 
            type="text"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">N° Factura</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Cliente</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha Emisión</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Vencimiento</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Total</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Estado</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <tr className="hover:bg-slate-50 transition-colors group cursor-pointer">
                <td className="py-4 px-4 text-sm font-medium text-brand-salmon">#FAC-001</td>
                <td className="py-4 px-4 text-sm font-medium text-slate-900">Constructora Omega S.A.</td>
                <td className="py-4 px-4 text-sm text-slate-600">12 Oct 2023</td>
                <td className="py-4 px-4 text-sm text-slate-600">27 Oct 2023</td>
                <td className="py-4 px-4 text-sm font-medium text-slate-900 text-right">$1,250.00</td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-medium">Pagada</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-brand-salmon transition-colors rounded hover:bg-slate-100"><span className="material-symbols-outlined text-[20px]">picture_as_pdf</span></button>
                    <button className="p-1.5 text-slate-400 hover:text-brand-salmon transition-colors rounded hover:bg-slate-100"><span className="material-symbols-outlined text-[20px]">mail</span></button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors group cursor-pointer">
                <td className="py-4 px-4 text-sm font-medium text-brand-salmon">#FAC-002</td>
                <td className="py-4 px-4 text-sm font-medium text-slate-900">Taller Los Hermanos</td>
                <td className="py-4 px-4 text-sm text-slate-600">14 Oct 2023</td>
                <td className="py-4 px-4 text-sm text-slate-600">29 Oct 2023</td>
                <td className="py-4 px-4 text-sm font-medium text-slate-900 text-right">$850.50</td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[12px] font-medium">Pendiente</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-brand-salmon transition-colors rounded hover:bg-slate-100"><span className="material-symbols-outlined text-[20px]">picture_as_pdf</span></button>
                    <button className="p-1.5 text-slate-400 hover:text-brand-salmon transition-colors rounded hover:bg-slate-100"><span className="material-symbols-outlined text-[20px]">mail</span></button>
                    <button className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors rounded hover:bg-slate-100"><span className="material-symbols-outlined text-[20px]">payments</span></button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-red-50/50 transition-colors group cursor-pointer bg-red-50/30 border-l-2 border-l-red-500">
                <td className="py-4 px-4 text-sm font-medium text-brand-salmon pl-3">#FAC-003</td>
                <td className="py-4 px-4 text-sm font-medium text-slate-900">Mantenimiento Industrial Corp</td>
                <td className="py-4 px-4 text-sm text-slate-600">01 Oct 2023</td>
                <td className="py-4 px-4 text-sm font-medium text-red-600">16 Oct 2023</td>
                <td className="py-4 px-4 text-sm font-medium text-slate-900 text-right">$3,150.00</td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[12px] font-medium">Vencida</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-brand-salmon transition-colors rounded hover:bg-slate-100"><span className="material-symbols-outlined text-[20px]">picture_as_pdf</span></button>
                    <button className="p-1.5 text-red-500 hover:text-red-700 transition-colors rounded hover:bg-red-100"><span className="material-symbols-outlined text-[20px]">warning</span></button>
                    <button className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors rounded hover:bg-slate-100"><span className="material-symbols-outlined text-[20px]">payments</span></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Static) */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-slate-500 text-sm bg-white rounded-b-xl">
          <span>Mostrando 1 - 3 de 15</span>
          <div className="flex gap-2">
            <button className="p-1 hover:bg-slate-50 rounded border border-slate-200 text-slate-400 disabled:opacity-50 transition-colors" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="p-1 hover:bg-slate-50 rounded border border-slate-200 text-slate-600 transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
