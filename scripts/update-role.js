const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function setSuperAdmin() {
  const userId = '9936cbb0-fb11-423f-897f-2cf5c98edb04';
  
  // Extraemos la data raw existente para inyectarle el rol sin borrar el resto
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError) {
    return console.error('Error al obtener usuario:', userError);
  }
  
  const currentMetadata = user.user_metadata || {};
  
  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    { 
      user_metadata: { 
        ...currentMetadata,
        rol: 'SUPERADMIN' 
      } 
    }
  );

  if (error) {
    console.error('Error al actualizar el usuario:', error);
  } else {
    console.log('¡Usuario actualizado exitosamente a SUPERADMIN!');
  }
}

setSuperAdmin();
