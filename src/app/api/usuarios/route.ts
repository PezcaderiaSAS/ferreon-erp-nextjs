import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializar Supabase con la llave maestra para tener permisos sobre auth.users
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

export async function GET() {
  try {
    const supabaseAdmin = getAdminClient();
    
    // Obtener la lista de usuarios. Requiere privilegios de service_role.
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Mapear los usuarios para retornar solo lo necesario al frontend
    const mappedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      nombre: user.user_metadata?.nombre || user.email?.split('@')[0],
      rol: user.user_metadata?.rol || 'USUARIO',
      avatarUrl: user.user_metadata?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
      ultimoAcceso: user.last_sign_in_at,
    }));

    return NextResponse.json({ usuarios: mappedUsers }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, nombre, rol, avatarUrl } = body;

    if (!email || !nombre || !rol) {
      return NextResponse.json({ error: 'Email, nombre y rol son obligatorios' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // Crear el usuario con metadata personalizada
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'TempPass123!', // Si se quiere forzar contraseña o usar Magic Link
      email_confirm: true,
      user_metadata: {
        nombre,
        rol,
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      mensaje: 'Usuario creado exitosamente',
      usuario: {
        id: data.user.id,
        email: data.user.email,
        nombre: data.user.user_metadata?.nombre,
        rol: data.user.user_metadata?.rol,
        avatarUrl: data.user.user_metadata?.avatarUrl,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
