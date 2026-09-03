import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/infrastructure/persistence/supabase/server';

export const dynamic = 'force-dynamic';

// Cliente de Supabase con Service Role para operaciones administrativas
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL o Service Role Key no están configurados.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper para obtener el tenant del usuario autenticado
async function getAuthenticatedTenant() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, empresaId: null, rol: null };
  }

  const { data: membership } = await supabase
    .from('empresa_usuarios')
    .select('empresa_id, rol, estado')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  return {
    user,
    empresaId: membership?.empresa_id || null,
    rol: membership?.rol || 'OPERADOR_BODEGA',
  };
}

// 1. GET: Listar usuarios del tenant actual
export async function GET() {
  try {
    const { user, empresaId } = await getAuthenticatedTenant();
    if (!user || !empresaId) {
      return NextResponse.json({ error: 'No autorizado o sin empresa asignada' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // Obtener membresías de la empresa
    const { data: memberships, error: memError } = await supabaseAdmin
      .from('empresa_usuarios')
      .select('id, user_id, rol, estado, created_at')
      .eq('empresa_id', empresaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (memError) {
      return NextResponse.json({ error: memError.message }, { status: 400 });
    }

    // Obtener detalles de auth.users
    const { data: listData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 400 });
    }

    const userMap = new Map<string, any>();
    const usersList = (listData?.users || []) as any[];
    usersList.forEach((u: any) => userMap.set(u.id, u));

    const mappedUsuarios = (memberships || []).map(m => {
      const authUser = userMap.get(m.user_id);
      const metadata = authUser?.user_metadata || {};

      return {
        id: m.user_id,
        membershipId: m.id,
        email: authUser?.email || 'Sin correo',
        nombre: metadata.nombre || authUser?.email?.split('@')[0] || 'Usuario',
        rol: m.rol,
        estado: m.estado || 'ACTIVO',
        avatarUrl: metadata.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?.email}`,
        ultimoAcceso: authUser?.last_sign_in_at || null,
        esCurrentUser: m.user_id === user.id,
      };
    });

    return NextResponse.json({ usuarios: mappedUsuarios }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

// 2. POST: Crear o asociar nuevo usuario en el tenant
export async function POST(request: Request) {
  try {
    const { user, empresaId, rol: currentRol } = await getAuthenticatedTenant();
    if (!user || !empresaId || (currentRol !== 'SUPERADMIN' && currentRol !== 'ADMIN')) {
      return NextResponse.json({ error: 'Permisos insuficientes para crear usuarios' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, nombre, rol, avatarUrl } = body;

    if (!email || !nombre || !rol) {
      return NextResponse.json({ error: 'Email, nombre y rol son obligatorios' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabaseAdmin = getAdminClient();

    // 2.1 Verificar si el usuario ya existe en auth.users
    const { data: listDataPost } = await supabaseAdmin.auth.admin.listUsers();
    const usersListPost = (listDataPost?.users || []) as any[];
    let targetUser = usersListPost.find((u: any) => u.email?.toLowerCase() === cleanEmail);

    if (!targetUser) {
      // Crear nuevo usuario en auth.users
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password || 'TempPass123!',
        email_confirm: true,
        user_metadata: {
          nombre: nombre.trim(),
          rol,
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
        }
      });

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
      targetUser = created.user;
    }

    // 2.2 Verificar si ya tiene membresía en este tenant
    const { data: existingMembership } = await supabaseAdmin
      .from('empresa_usuarios')
      .select('id, deleted_at, estado')
      .eq('empresa_id', empresaId)
      .eq('user_id', targetUser.id)
      .maybeSingle();

    if (existingMembership && !existingMembership.deleted_at) {
      return NextResponse.json({ error: 'El usuario ya pertenece activamente a esta empresa' }, { status: 409 });
    }

    if (existingMembership && existingMembership.deleted_at) {
      // Reactivar membresía previa
      await supabaseAdmin
        .from('empresa_usuarios')
        .update({
          rol,
          estado: 'ACTIVO',
          deleted_at: null,
        })
        .eq('id', existingMembership.id);
    } else {
      // Insertar nueva membresía única
      const { error: insertError } = await supabaseAdmin
        .from('empresa_usuarios')
        .insert([{
          empresa_id: empresaId,
          user_id: targetUser.id,
          rol,
          estado: 'ACTIVO',
        }]);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      mensaje: 'Usuario registrado exitosamente en la empresa',
      usuario: {
        id: targetUser.id,
        email: targetUser.email,
        nombre,
        rol,
        estado: 'ACTIVO',
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

// 3. PUT: Actualizar datos y rol del usuario
export async function PUT(request: Request) {
  try {
    const { user, empresaId, rol: currentRol } = await getAuthenticatedTenant();
    if (!user || !empresaId || (currentRol !== 'SUPERADMIN' && currentRol !== 'ADMIN')) {
      return NextResponse.json({ error: 'Permisos insuficientes para editar usuarios' }, { status: 403 });
    }

    const body = await request.json();
    const { id, nombre, rol, avatarUrl } = body;

    if (!id || !nombre || !rol) {
      return NextResponse.json({ error: 'ID, nombre y rol son obligatorios' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // 3.1 Actualizar rol en la tabla pivote de la empresa
    const { error: memError } = await supabaseAdmin
      .from('empresa_usuarios')
      .update({ rol })
      .eq('empresa_id', empresaId)
      .eq('user_id', id);

    if (memError) {
      return NextResponse.json({ error: memError.message }, { status: 400 });
    }

    // 3.2 Actualizar user_metadata en auth.users
    const { data: { user: targetUser } } = await supabaseAdmin.auth.admin.getUserById(id);
    if (targetUser) {
      const currentMeta = targetUser.user_metadata || {};
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: {
          ...currentMeta,
          nombre: nombre.trim(),
          rol,
          avatarUrl: avatarUrl || currentMeta.avatarUrl,
        }
      });
    }

    return NextResponse.json({ mensaje: 'Usuario actualizado exitosamente' }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

// 4. PATCH: Cambiar estado (ACTIVO / INACTIVO / BLOQUEADO)
export async function PATCH(request: Request) {
  try {
    const { user, empresaId, rol: currentRol } = await getAuthenticatedTenant();
    if (!user || !empresaId || (currentRol !== 'SUPERADMIN' && currentRol !== 'ADMIN')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { id, estado } = body;

    if (!id || !['ACTIVO', 'INACTIVO', 'BLOQUEADO'].includes(estado)) {
      return NextResponse.json({ error: 'ID y estado válido (ACTIVO, INACTIVO, BLOQUEADO) son requeridos' }, { status: 400 });
    }

    // Salvaguarda: No permitir que el usuario actual se bloquee o inactive a sí mismo
    if (id === user.id) {
      return NextResponse.json({ error: 'No puedes desactivar ni bloquear tu propia cuenta de administrador' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    const { error } = await supabaseAdmin
      .from('empresa_usuarios')
      .update({ estado })
      .eq('empresa_id', empresaId)
      .eq('user_id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ mensaje: `Usuario marcado como ${estado}` }, { status: 200 });

  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

// 5. DELETE: Eliminar / Desvincular usuario de la empresa (Soft-Delete)
export async function DELETE(request: Request) {
  try {
    const { user, empresaId, rol: currentRol } = await getAuthenticatedTenant();
    if (!user || !empresaId || (currentRol !== 'SUPERADMIN' && currentRol !== 'ADMIN')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    // Salvaguarda: No auto-eliminación
    if (id === user.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta de administrador' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // Soft-delete de la membresía
    const { error } = await supabaseAdmin
      .from('empresa_usuarios')
      .update({ 
        deleted_at: new Date().toISOString(),
        estado: 'INACTIVO'
      })
      .eq('empresa_id', empresaId)
      .eq('user_id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ mensaje: 'Usuario desvinculado correctamente de la empresa' }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
