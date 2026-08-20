export default function DevolucionesPage() {
  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Page Header & Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Recepción y Devoluciones</h2>
          <p className="text-base text-slate-600 mt-1">Gestión de equipos retornados a bodega.</p>
        </div>
        <button className="bg-brand-salmon text-white hover:bg-brand-salmonDark transition-colors px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          Procesar Devolución
        </button>
      </div>

      {/* Delay Summary Alert */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm flex items-start gap-4">
        <span className="material-symbols-outlined text-red-600 mt-0.5">warning</span>
        <div>
          <h3 className="text-base font-semibold text-red-900">8 Alquileres con retraso detectados</h3>
          <p className="text-sm text-red-700 mt-1">Revise la lista a continuación para contactar a los clientes con equipos fuera de plazo.</p>
        </div>
        <button className="ml-auto text-red-600 hover:bg-red-100 p-1.5 rounded-full transition-colors">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Filters & Search within List */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 flex flex-col flex-1 min-h-[500px]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div className="flex gap-2">
            <button className="px-4 py-1.5 rounded-full border border-slate-200 bg-white text-slate-900 text-sm font-medium hover:bg-slate-50 transition-colors">Todos</button>
            <button className="px-4 py-1.5 rounded-full border border-brand-salmon text-brand-salmonDark bg-brand-salmonLight text-sm font-medium">Pendientes hoy</button>
            <button className="px-4 py-1.5 rounded-full border border-slate-200 bg-white text-slate-900 text-sm font-medium hover:bg-slate-50 transition-colors">Retrasados</button>
            <button className="px-4 py-1.5 rounded-full border border-slate-200 bg-white text-slate-900 text-sm font-medium hover:bg-slate-50 transition-colors">Completados</button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">ID Contrato</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Cliente</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha Esperada</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Equipos</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {/* Row 1 */}
              <tr className="hover:bg-slate-50 transition-colors group cursor-pointer">
                <td className="py-4 px-4 text-sm text-slate-900 font-medium">#CTR-2023-089</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold">
                      CM
                    </div>
                    <span className="text-sm text-slate-900">Constructora Mónaco</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-slate-600">Hoy, 14:00</td>
                <td className="py-4 px-4 text-sm text-slate-600">3x Andamios, 1x Mezcladora</td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-emerald-50 text-emerald-700">
                    A tiempo
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-slate-400 hover:text-brand-salmon transition-colors p-1.5 rounded hover:bg-slate-100" title="Recibir">
                      <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                    </button>
                    <button className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded hover:bg-slate-100" title="Reportar Daño">
                      <span className="material-symbols-outlined text-[20px]">report</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-red-50/50 transition-colors group bg-red-50/30 cursor-pointer border-l-2 border-l-red-500">
                <td className="py-4 px-4 text-sm text-slate-900 font-medium pl-3">#CTR-2023-075</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold">
                      JP
                    </div>
                    <span className="text-sm text-slate-900">Juan Pérez</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-red-600 font-medium">Ayer, 18:00</td>
                <td className="py-4 px-4 text-sm text-slate-600">1x Taladro Percutor</td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-red-100 text-red-800">
                    Retrasado
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-slate-400 hover:text-brand-salmon transition-colors p-1.5 rounded hover:bg-slate-100" title="Recibir">
                      <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                    </button>
                    <button className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded hover:bg-slate-100" title="Reportar Daño">
                      <span className="material-symbols-outlined text-[20px]">report</span>
                    </button>
                  </div>
                </td>
              </tr>
              {/* Row 3 */}
              <tr className="hover:bg-slate-50 transition-colors group cursor-pointer">
                <td className="py-4 px-4 text-sm text-slate-900 font-medium">#CTR-2023-091</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold">
                      IA
                    </div>
                    <span className="text-sm text-slate-900">Ingeniería Avanzada</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-slate-600">Hoy, 16:30</td>
                <td className="py-4 px-4 text-sm text-slate-600">2x Generador Eléctrico, 5x Extensiones</td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-emerald-50 text-emerald-700">
                    A tiempo
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-slate-400 hover:text-brand-salmon transition-colors p-1.5 rounded hover:bg-slate-100" title="Recibir">
                      <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                    </button>
                    <button className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded hover:bg-slate-100" title="Reportar Daño">
                      <span className="material-symbols-outlined text-[20px]">report</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white rounded-b-xl">
          <span className="text-sm text-slate-500">Mostrando 1-3 de 15 pendientes</span>
          <div className="flex gap-2">
            <button className="p-1 rounded border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
