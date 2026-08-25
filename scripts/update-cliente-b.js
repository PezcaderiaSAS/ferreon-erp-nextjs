const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wktqhooudfbajlpefgpy.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdHFob291ZGZiYWpscGVmZ3B5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU3NzM5MiwiZXhwIjoyMTAzMTUzMzkyfQ.qXdKhJGjB73F69abKZdIkzWxMo08V64eD-2vgy4xW8c';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  const userId = 'd86e3376-922e-49d0-9cf6-61f0b0ec1ddd';
  
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      rol: 'SUPERADMIN',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FerreteriaJosase'
    }
  });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('¡Usuario Cliente B actualizado a SUPERADMIN exitosamente!');
  }
}

main();
