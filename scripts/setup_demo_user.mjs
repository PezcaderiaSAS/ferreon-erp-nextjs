import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const testEmail = 'demo@alquileres-system.com';
const testPassword = 'Alquileres2026*';
const empresaId = 'ac8719ea-f16a-4538-b308-40d9511a14cb';

async function main() {
  console.log("Checking if user exists...");
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  let existing = users.users.find(u => u.email === testEmail);
  let userId;

  if (existing) {
    console.log("User exists, updating password...", existing.id);
    userId = existing.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: testPassword,
      email_confirm: true,
      user_metadata: { empresa_nombre: 'FERREON', nombre_completo: 'Usuario Demo Alquileres' }
    });
    if (updateError) throw updateError;
    console.log("Password updated successfully.");
  } else {
    console.log("Creating new user...");
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { empresa_nombre: 'FERREON', nombre_completo: 'Usuario Demo Alquileres' }
    });
    if (createError) throw createError;
    userId = newUser.user.id;
    console.log("User created successfully:", userId);
  }

  // Ensure user is in empresa_usuarios
  const { data: existingMapping, error: mapErr } = await supabase
    .from('empresa_usuarios')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existingMapping) {
    console.log("Adding user to empresa_usuarios...");
    const { error: insertErr } = await supabase
      .from('empresa_usuarios')
      .insert({
        empresa_id: empresaId,
        user_id: userId,
        rol: 'ADMIN',
        es_empresa_activa: true
      });
    if (insertErr) throw insertErr;
    console.log("Added to empresa_usuarios as ADMIN.");
  } else {
    console.log("User already linked to empresa_usuarios:", existingMapping);
  }

  console.log("READY! Credentials:");
  console.log("Email:", testEmail);
  console.log("Password:", testPassword);
}

main().catch(err => {
  console.error("Error setting up demo user:", err);
  process.exit(1);
});
