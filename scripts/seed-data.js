const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
process.loadEnvFile(path.resolve(__dirname, '../.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan credenciales de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const items = [
  { nombre: 'Mezcladora de Concreto 2 Bultos (Gasolina)', tarifa_diaria: 45000.00, stock_total: 10, stock_disponible: 10, estado: 'Disponible' },
  { nombre: 'Vibrador de Concreto Eléctrico 2HP', tarifa_diaria: 25000.00, stock_total: 15, stock_disponible: 15, estado: 'Disponible' },
  { nombre: 'Demoledor Eléctrico 30Kg (HEX 28mm)', tarifa_diaria: 65000.00, stock_total: 8, stock_disponible: 8, estado: 'Disponible' },
  { nombre: 'Andamio Multidireccional (Módulo 1.5m x 2.0m)', tarifa_diaria: 12000.00, stock_total: 50, stock_disponible: 50, estado: 'Disponible' },
  { nombre: 'Cortadora de Pavimento / Asfalto (Motor Honda 13HP)', tarifa_diaria: 85000.00, stock_total: 5, stock_disponible: 5, estado: 'Disponible' },
  { nombre: 'Planta Eléctrica 6.5 kW (Diésel)', tarifa_diaria: 75000.00, stock_total: 6, stock_disponible: 6, estado: 'Disponible' },
  { nombre: 'Bomba de Agua Sumergible 3"', tarifa_diaria: 35000.00, stock_total: 12, stock_disponible: 12, estado: 'Disponible' }
];

const clientes = [
  { nit_cedula: '900123456-1', nombre: 'Constructora Alfa S.A.S.', telefono: '3001234567', email: 'contacto@alfa.com', direccion: 'Calle 100 # 15-20', estado: 'Activo', nivel_riesgo: 'Bajo' },
  { nit_cedula: '1020304050', nombre: 'Juan Pérez (Independiente)', telefono: '3109876543', email: 'juan.perez@email.com', direccion: 'Carrera 50 # 25-10', estado: 'Activo', nivel_riesgo: 'Medio' },
  { nit_cedula: '800987654-2', nombre: 'Ingeniería y Diseños Beta', telefono: '3204567890', email: 'proyectos@beta.com', direccion: 'Avenida 68 # 50-40', estado: 'Activo', nivel_riesgo: 'Bajo' }
];

async function seed() {
  console.log("Probando conexión a Supabase...");
  
  // Test connection to items table
  const { data: testData, error: testError } = await supabase.from('items').select('id').limit(1);
  if (testError) {
    console.error("Error conectando a Supabase. Asegúrate de haber ejecutado las migraciones SQL primero.");
    console.error(testError.message);
    process.exit(1);
  }
  
  console.log("Conexión exitosa. Insertando items...");
  
  for (const item of items) {
    const { error } = await supabase.from('items').insert([item]);
    if (error) {
      console.error(`Error insertando item ${item.nombre}:`, error.message);
    } else {
      console.log(`Item insertado: ${item.nombre}`);
    }
  }

  console.log("\nInsertando clientes...");
  for (const cliente of clientes) {
    const { error } = await supabase.from('clientes').insert([cliente]);
    if (error) {
      console.error(`Error insertando cliente ${cliente.nombre}:`, error.message);
    } else {
      console.log(`Cliente insertado: ${cliente.nombre}`);
    }
  }

  console.log("\n¡Proceso de carga finalizado!");
}

seed();
