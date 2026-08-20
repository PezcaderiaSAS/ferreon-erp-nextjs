import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-1">Dashboard</h1>
        <p className="text-base text-slate-600">Resumen de operaciones y estado del equipo.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-card p-6 border border-slate-200 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-600">Equipos Alquilados</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <span className="material-symbols-outlined">construction</span>
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900">124</div>
          <div className="text-sm text-emerald-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">trending_up</span> +5% desde ayer
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 border border-slate-200 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-600">Contratos Activos</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <span className="material-symbols-outlined">description</span>
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900">45</div>
          <div className="text-sm text-slate-500 flex items-center gap-1">
            Estable
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 border border-slate-200 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-600">Devoluciones Pendientes hoy</span>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <span className="material-symbols-outlined">warning</span>
            </div>
          </div>
          <div className="text-4xl font-bold text-red-600">12</div>
          <div className="text-sm text-slate-500 flex items-center gap-1">
            Requiere atención
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/alquileres" className="bg-brand-salmonLight text-brand-salmonDark rounded-xl shadow-card p-6 flex items-center justify-center gap-4 hover:bg-brand-salmon hover:text-white transition-colors duration-200 group border border-transparent">
          <span className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform">add_circle</span>
          <span className="text-xl font-semibold">Ir al Módulo de Alquileres</span>
        </Link>
        
        <Link href="/alquileres" className="bg-white text-slate-900 border border-slate-200 rounded-xl shadow-card p-6 flex items-center justify-center gap-4 hover:bg-slate-50 transition-colors duration-200 group">
          <span className="material-symbols-outlined text-[32px] text-brand-salmon group-hover:-translate-y-1 transition-transform">keyboard_return</span>
          <span className="text-xl font-semibold">Gestionar Devoluciones</span>
        </Link>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-semibold text-slate-900">Actividad Reciente</h2>
          <button className="text-sm font-medium text-brand-salmon hover:underline">Ver Todo</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-white">
                <th className="p-4 font-semibold text-sm">Contrato</th>
                <th className="p-4 font-semibold text-sm">Cliente</th>
                <th className="p-4 font-semibold text-sm">Equipo</th>
                <th className="p-4 font-semibold text-sm">Estado</th>
                <th className="p-4 font-semibold text-sm">Fecha</th>
              </tr>
            </thead>
            <tbody className="text-slate-900 text-sm">
              <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                <td className="p-4 font-medium">#ALQ-089</td>
                <td className="p-4">Constructora Omega</td>
                <td className="p-4">Retroexcavadora CAT 416F2</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Activo
                  </span>
                </td>
                <td className="p-4 text-slate-600">Hace 2 horas</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                <td className="p-4 font-medium">#ALQ-088</td>
                <td className="p-4">Ing. Roberto Sánchez</td>
                <td className="p-4">Planta Eléctrica 10kVA</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Pendiente
                  </span>
                </td>
                <td className="p-4 text-slate-600">Ayer</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                <td className="p-4 font-medium">#ALQ-087</td>
                <td className="p-4">Mantenimientos S.A.S</td>
                <td className="p-4">Andamio Tubular x4</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    Finalizado
                  </span>
                </td>
                <td className="p-4 text-slate-600">Ayer</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
