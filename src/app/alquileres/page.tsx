export default function AlquileresPage() {
  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900 mb-1">Contratos de Alquiler</h2>
          <p className="text-base text-slate-600">Gestiona y supervisa los alquileres de maquinaria y equipos.</p>
        </div>
        <button className="bg-brand-salmonLight text-brand-salmonDark hover:bg-brand-salmon hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm self-start md:self-end">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nuevo Contrato
        </button>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium border border-slate-200 shadow-sm">Todos</button>
            <button className="px-4 py-2 bg-transparent text-slate-600 rounded-lg text-sm font-medium border border-transparent hover:bg-slate-100 transition-colors">Activos</button>
            <button className="px-4 py-2 bg-transparent text-slate-600 rounded-lg text-sm font-medium border border-transparent hover:bg-slate-100 transition-colors">Cotizaciones</button>
          </div>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-salmon focus:ring-1 focus:ring-brand-salmon transition-all" 
              placeholder="Buscar contrato..." 
              type="text"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-10 border-b border-slate-200 shadow-sm">
              <tr>
                <th className="py-3 px-4 text-sm text-slate-600 font-semibold">ID</th>
                <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Cliente</th>
                <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Fecha Inicio</th>
                <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Equipos</th>
                <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Estado</th>
                <th className="py-3 px-4 text-sm text-slate-600 font-semibold">Total</th>
                <th className="py-3 px-4 text-sm text-slate-600 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <tr className="hover:bg-slate-50 transition-colors group cursor-pointer">
                <td className="py-3 px-4 text-sm text-slate-900 font-medium">#ALQ-001</td>
                <td className="py-3 px-4 text-sm text-slate-900">Constructora Cúspide S.A.</td>
                <td className="py-3 px-4 text-sm text-slate-600">12 Oct 2023</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[11px] font-medium text-slate-600">Excavadora CAT</span>
                    <span className="px-2 py-1 bg-slate-100 rounded text-[11px] font-medium text-slate-600">+2 más</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[12px] font-medium bg-emerald-50 text-emerald-700">Activo</span>
                </td>
                <td className="py-3 px-4 text-sm text-slate-900 font-medium">$4,500.00</td>
                <td className="py-3 px-4 text-right">
                  <button className="text-slate-400 hover:text-brand-salmon transition-colors p-1 rounded hover:bg-slate-100">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors group cursor-pointer">
                <td className="py-3 px-4 text-sm text-slate-900 font-medium">#ALQ-002</td>
                <td className="py-3 px-4 text-sm text-slate-900">Ingeniería Vallejo</td>
                <td className="py-3 px-4 text-sm text-slate-600">15 Oct 2023</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[11px] font-medium text-slate-600">Generador 50kW</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[12px] font-medium bg-amber-50 text-amber-700">Cotización</span>
                </td>
                <td className="py-3 px-4 text-sm text-slate-900 font-medium">$850.00</td>
                <td className="py-3 px-4 text-right">
                  <button className="text-slate-400 hover:text-brand-salmon transition-colors p-1 rounded hover:bg-slate-100">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors group cursor-pointer">
                <td className="py-3 px-4 text-sm text-slate-900 font-medium">#ALQ-003</td>
                <td className="py-3 px-4 text-sm text-slate-900">Mantenimiento Global LTDA</td>
                <td className="py-3 px-4 text-sm text-slate-600">01 Sep 2023</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[11px] font-medium text-slate-600">Andamio Acrow (10)</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[12px] font-medium bg-slate-100 text-slate-700">Finalizado</span>
                </td>
                <td className="py-3 px-4 text-sm text-slate-900 font-medium">$1,200.00</td>
                <td className="py-3 px-4 text-right">
                  <button className="text-slate-400 hover:text-brand-salmon transition-colors p-1 rounded hover:bg-slate-100">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
