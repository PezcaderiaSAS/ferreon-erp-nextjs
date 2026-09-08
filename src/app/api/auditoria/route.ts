import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/infrastructure/persistence/supabase/server';
import { AuditLogger } from '@/lib/security/audit-logger';
import { validateApiRequest } from '@/lib/security/validation';
import { AuditActionType, AuditModuloType } from '@/core/domain/entities/audit-log';

export const dynamic = 'force-dynamic';

const auditLogSchema = z.object({
  userId: z.string().optional(),
  userNombre: z.string().optional(),
  userEmail: z.string().optional(),
  userRol: z.string().optional(),
  modulo: z.enum([
    'SEGURIDAD',
    'BODEGA',
    'ALQUILERES',
    'DEVOLUCIONES',
    'FACTURACION',
    'CARTERA',
    'CLIENTES',
    'CONFIGURACION',
    'TENANTS',
  ]),
  accion: z.string().min(1),
  entidadId: z.string().optional(),
  descripcion: z.string().min(1),
  detalles: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    const modulo = searchParams.get('modulo');
    const search = searchParams.get('search');

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (modulo) {
      query = query.eq('modulo', modulo);
    }

    if (search) {
      query = query.or(`descripcion.ilike.%${search}%,usuario_nombre.ilike.%${search}%,usuario_email.ilike.%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[API Auditoría] Error consultando logs:', error);
      return NextResponse.json({ success: false, error: 'Error al consultar logs de auditoría' }, { status: 500 });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err: any) {
    console.error('[API Auditoría Error]', err);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const validation = await validateApiRequest(request, auditLogSchema);
  if (!validation.success) {
    return validation.response!;
  }
  const data = validation.data;

  try {
    await AuditLogger.log({
      modulo: data.modulo as AuditModuloType,
      accion: data.accion as AuditActionType,
      descripcion: data.descripcion,
      entidadId: data.entidadId,
      detalles: data.detalles,
      userId: data.userId,
      userNombre: data.userNombre,
      userEmail: data.userEmail,
      userRol: data.userRol,
      ipAddress: data.ipAddress,
    });

    return NextResponse.json({ success: true, message: 'Evento de auditoría registrado exitosamente' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Error al registrar auditoría' }, { status: 500 });
  }
}
