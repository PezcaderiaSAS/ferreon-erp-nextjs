import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/infrastructure/persistence/supabase/server';
import { TermsReacceptanceModal } from '@/components/legal/TermsReacceptanceModal';
import { obtenerDashboardDataAction } from '@/app/actions/dashboard';
import { DashboardInteractiveIsland, DashboardSkeleton } from '@/components/dashboard';
import { type DashboardPayload } from '@/core/types/dashboard';
import { obtenerFechaHoyLocal } from '@/core/services/dashboard-transaccional.service';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/dashboard');
  }

  const userRole = user.user_metadata?.rol;
  const isSuperOrUltra = userRole === 'ULTRAADMIN' || userRole === 'SUPERADMIN';

  // Verificar si tiene empresa activa vinculada
  const { data: membership } = await supabase
    .from('empresa_usuarios')
    .select('empresa_id')
    .eq('user_id', user.id)
    .eq('es_empresa_activa', true)
    .maybeSingle();

  if (!isSuperOrUltra && !membership) {
    redirect('/onboarding');
  }

  const terminosVersion = user.user_metadata?.terminos_version;
  const requiereAceptacionTerminos = !terminosVersion || terminosVersion !== '1.0.0';
  const empresaIdActiva = membership?.empresa_id || 'ac8719ea-f16a-4538-b308-40d9511a14cb';

  // Consulta de datos de producción para el Dashboard y Calendario
  const res = await obtenerDashboardDataAction(empresaIdActiva);

  // Fallback seguro en caso de contingencia de conexión
  const hoyStr = obtenerFechaHoyLocal();
  const defaultPayload: DashboardPayload = {
    kpis: {
      equiposEnObra: 0,
      equiposTotal: 0,
      utilizacionFlotaPct: 0,
      contratosActivos: 0,
      cotizacionesPendientes: 0,
      devolucionesPendientesHoy: 0,
      devolucionesVencidas: 0,
      carteraPendienteTotalCOP: 0,
      carteraMoraCOP: 0
    },
    eventos: [],
    tareas: [],
    alertas: [
      {
        id: 'alert-init',
        tipo: 'INFO',
        titulo: 'Sistema Operativo',
        mensaje: 'Bienvenido al Centro de Control de Alquileres System.',
        fecha: hoyStr
      }
    ],
    mesActivo: hoyStr.slice(0, 7)
  };

  const dashboardData = res.success && res.data ? res.data : defaultPayload;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Modal Intersticial Bloqueante de Consentimiento Legal para Usuarios Existentes */}
      {requiereAceptacionTerminos && (
        <TermsReacceptanceModal
          isOpen={true}
          empresaId={empresaIdActiva}
        />
      )}

      {/* Centro de Control y Calendario Operativo */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardInteractiveIsland initialData={dashboardData} />
      </Suspense>
    </div>
  );
}
