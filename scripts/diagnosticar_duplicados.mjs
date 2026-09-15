import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan credenciales de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function diagnosticarDuplicados() {
  console.log('🔍 Iniciando inspección de registros en Supabase:', supabaseUrl);

  // 1. Obtener los últimos 20 alquileres ordenados por created_at descendente
  const { data: alquileres, error: errAlq } = await supabase
    .from('alquileres')
    .select(`
      id,
      consecutivo,
      empresa_id,
      cliente_id,
      estado,
      total,
      deposito,
      idempotency_key,
      created_at,
      alquiler_detalles (
        id,
        equipo_id,
        cantidad,
        es_subcontratado
      )
    `)
    .order('created_at', { ascending: false })
    .limit(30);

  if (errAlq) {
    console.error('Error al consultar alquileres:', errAlq);
    return;
  }

  console.log(`\n📋 Se encontraron ${alquileres.length} alquileres recientes:`);
  alquileres.forEach(a => {
    console.log(`- ID: ${a.id} | Consecutivo: ${a.consecutivo} | Cliente: ${a.cliente_id} | Total: $${a.total} | Estado: ${a.estado} | Creado: ${a.created_at} | Items: ${a.alquiler_detalles?.length || 0} | IdempKey: ${a.idempotency_key || 'NULL'}`);
  });

  // 2. Algoritmo de Detección de Duplicados
  // Criterio: Mismo cliente_id, mismo total, creados dentro de una ventana de 10 minutos (600,000 ms)
  const gruposDuplicados = [];
  const procesados = new Set();

  for (let i = 0; i < alquileres.length; i++) {
    if (procesados.has(alquileres[i].id)) continue;

    const actual = alquileres[i];
    const fechaActual = new Date(actual.created_at).getTime();
    const grupo = [actual];

    for (let j = i + 1; j < alquileres.length; j++) {
      if (procesados.has(alquileres[j].id)) continue;

      const otro = alquileres[j];
      const fechaOtro = new Date(otro.created_at).getTime();
      const diferenciaMs = Math.abs(fechaActual - fechaOtro);

      // Si tienen mismo cliente, mismo total y diferencia de tiempo menor a 15 minutos (o mismos items)
      if (
        String(actual.cliente_id) === String(otro.cliente_id) &&
        Number(actual.total) === Number(otro.total) &&
        diferenciaMs < 15 * 60 * 1000
      ) {
        grupo.push(otro);
        procesados.add(otro.id);
      }
    }

    if (grupo.length > 1) {
      gruposDuplicados.push(grupo);
      procesados.add(actual.id);
    }
  }

  console.log(`\n🚨 Grupos de registros duplicados detectados: ${gruposDuplicados.length}`);

  gruposDuplicados.forEach((grupo, idx) => {
    console.log(`\n--- Grupo Duplicado #${idx + 1} (${grupo.length} registros repetidos) ---`);
    // Ordenar por created_at ascendente: el primero es el original legítimo, los demás son clones accidentales
    grupo.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    console.log(`  ⭐ ORIGINAL A CONSERVAR: ID ${grupo[0].id} (Consecutivo ${grupo[0].consecutivo}, Creado ${grupo[0].created_at})`);
    
    for (let k = 1; k < grupo.length; k++) {
      const dup = grupo[k];
      console.log(`  ❌ DUPLICADO A LIMPIAR: ID ${dup.id} (Consecutivo ${dup.consecutivo}, Creado ${dup.created_at})`);
      if (dup.alquiler_detalles && dup.alquiler_detalles.length > 0) {
        console.log(`     Detalles a restituir en inventario:`);
        dup.alquiler_detalles.forEach(d => {
          console.log(`     - Equipo ID ${d.equipo_id}: Cantidad ${d.cantidad} (Subcontratado: ${d.es_subcontratado})`);
        });
      }
    }
  });

  // 3. Inspeccionar también si hay cotizaciones duplicadas
  const { data: cotizaciones, error: errCot } = await supabase
    .from('cotizaciones')
    .select('id, consecutivo, cliente_nombre, total, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!errCot && cotizaciones && cotizaciones.length > 0) {
    console.log(`\n📋 Cotizaciones recientes (${cotizaciones.length}):`);
    cotizaciones.forEach(c => {
      console.log(`- ID: ${c.id} | Consecutivo: ${c.consecutivo} | Cliente: ${c.cliente_nombre} | Total: $${c.total} | Creado: ${c.created_at}`);
    });
  }
}

diagnosticarDuplicados().catch(console.error);
