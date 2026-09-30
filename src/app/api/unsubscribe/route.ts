import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/infrastructure/persistence/supabase/server';

/**
 * CAN-SPAM-004 Unsubscribe Handler
 * Procesa solicitudes de desuscripción de forma inmediata y sin requerir login.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!email) {
    return new NextResponse('Error: Parámetro de correo requerido.', { status: 400 });
  }

  try {
    const adminSupabase = createAdminSupabaseClient();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Registrar la baja en audit_logs de forma inmutable para auditoría ante la FTC y SIC
    await adminSupabase.from('audit_logs').insert({
      empresa_id: '00000000-0000-0000-0000-000000000000', // Global system audit
      usuario_email: email,
      modulo: 'COMUNICACIONES_EMAIL',
      accion: 'CAN_SPAM_UNSUBSCRIBE_OPT_OUT',
      descripcion: `Solicitud de desuscripción procesada exitosamente para ${email}`,
      detalles: {
        email,
        token: token || 'direct-link',
        fecha_utc: new Date().toISOString(),
        ip_origen: ip,
        user_agent: request.headers.get('user-agent') || 'N/A',
        normativa: 'CAN-SPAM Act 2003 / 15 U.S.C. § 7704(a)(3)',
      },
    });

    // Redirigir a la vista pública de confirmación de desuscripción
    const confirmUrl = new URL('/unsubscribe', request.url);
    confirmUrl.searchParams.set('email', email);
    confirmUrl.searchParams.set('status', 'success');
    return NextResponse.redirect(confirmUrl);
  } catch (error) {
    console.error('[CAN-SPAM Unsubscribe] Error registrando baja:', error);
    return new NextResponse('Error al procesar la desuscripción. Por favor contacta a bajas@alquileres-system.com', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let email: string | null = null;
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    email = body.email;
  } else {
    const formData = await request.formData().catch(() => null);
    email = formData?.get('email')?.toString() || null;
  }

  if (!email) {
    const { searchParams } = new URL(request.url);
    email = searchParams.get('email');
  }

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email requerido' }, { status: 400 });
  }

  try {
    const adminSupabase = createAdminSupabaseClient();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    await adminSupabase.from('audit_logs').insert({
      empresa_id: '00000000-0000-0000-0000-000000000000',
      usuario_email: email,
      modulo: 'COMUNICACIONES_EMAIL',
      accion: 'CAN_SPAM_ONE_CLICK_UNSUBSCRIBE',
      descripcion: `Baja automática 1-Clic para ${email} (RFC 8058)`,
      detalles: {
        email,
        fecha_utc: new Date().toISOString(),
        ip_origen: ip,
        metodo: 'ONE_CLICK_HEADER_POST',
        normativa: 'CAN-SPAM Act / RFC 8058',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Te has dado de baja exitosamente de todas las comunicaciones comerciales de Alquileres System.',
    });
  } catch (error) {
    console.error('[CAN-SPAM Unsubscribe POST] Error:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
