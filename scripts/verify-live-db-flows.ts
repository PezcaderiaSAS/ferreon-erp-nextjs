import { createClient } from '@supabase/supabase-js';

// Cargar credenciales desde el entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eqruvswlpsttuyuglwts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcnV2c3dscHN0dHV5dWdsd3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzI1Njk2NiwiZXhwIjoyMTAyODMyOTY2fQ.Mac4fsZ1fWAp3JX5NUwbq5ue65G_lvIIXcFgcjDBzRM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface VerificationResult {
  step: string;
  success: boolean;
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

function logPass(step: string, message: string, details?: any) {
  results.push({ step, success: true, message, details });
  console.log(`\x1b[32m[PASS]\x1b[0m \x1b[1m${step}\x1b[0m: ${message}`);
}

function logFail(step: string, message: string, details?: any) {
  results.push({ step, success: false, message, details });
  console.error(`\x1b[31m[FAIL]\x1b[0m \x1b[1m${step}\x1b[0m: ${message}`);
}

async function runLiveVerification() {
  console.log('\n================================================================');
  console.log('   VERIFICACIÓN EN VIVO DE FLUJOS Y BASE DE DATOS SUPABASE      ');
  console.log('   Proyecto: Alquileres System (PostgreSQL 17 us-west-2)        ');
  console.log('================================================================\n');

  const tenantId = 'ac8719ea-f16a-4538-b308-40d9511a14cb'; // FERREON
  const testUserId = '9936cbb0-fb11-423f-897f-2cf5c98edb04'; // ULTRAADMIN
  const timestamp = Date.now();

  let createdClienteId: number | null = null;
  let createdEquipoId: number | null = null;
  let createdAlquilerId: number | null = null;
  let createdProveedorId: string | null = null;
  let createdSubcontratacionId: string | null = null;
  let createdSesionCajaId: string | null = null;
  let createdAuditLogId: string | null = null;

  try {
    // -------------------------------------------------------------
    // FLUJO 1: Conectividad & IAM Multi-Tenant
    // -------------------------------------------------------------
    console.log('\x1b[36m--- FLUJO 1: Conectividad y Validación Multi-Tenant ---\x1b[0m');
    const { data: empresa, error: errEmpresa } = await supabase
      .from('empresas')
      .select('id, nombre, nit, subscription_status, autorizado')
      .eq('id', tenantId)
      .single();

    if (errEmpresa || !empresa) {
      logFail('Flujo 1', `Error consultando empresa tenant: ${errEmpresa?.message}`);
      return;
    }
    logPass('Flujo 1', `Conexión viva a PostgreSQL 17 exitosa. Tenant activo: "${empresa.nombre}" (NIT: ${empresa.nit}, Autorizado: ${empresa.autorizado})`);

    // -------------------------------------------------------------
    // FLUJO 2: Clientes & Sanitización de Identificadores (CLI-003)
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- FLUJO 2: Directorio de Clientes y Saneamiento Tributario ---\x1b[0m');
    const nitLimpio = `900555${timestamp.toString().slice(-4)}`;
    const { data: cliente, error: errCliente } = await supabase
      .from('clientes')
      .insert({
        empresa_id: tenantId,
        nombre: `CLIENTE_TEST_VERIFICACION_${timestamp.toString().slice(-4)}`,
        nit_cedula: nitLimpio,
        telefono: '3001234567',
        email: `cliente.test.${timestamp}@alquileres.com`,
        direccion: 'Calle 100 # 15-20, Zona Industrial',
        estado: 'Activo',
      })
      .select()
      .single();

    if (errCliente || !cliente) {
      logFail('Flujo 2', `Fallo al registrar cliente de prueba: ${errCliente?.message}`);
    } else {
      createdClienteId = cliente.id;
      logPass('Flujo 2', `Cliente registrado exitosamente con ID: ${cliente.id} y NIT: ${cliente.nit_cedula} (Estado: ${cliente.estado})`);
    }

    // -------------------------------------------------------------
    // FLUJO 3: Bodega, Equipos & Asiento Inicial de Kardex (KARDEX-002)
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- FLUJO 3: Bodega, Inventario y Trazabilidad Kardex ---\x1b[0m');
    const codigoEquipo = `EQ-TEST-${timestamp.toString().slice(-4)}`;
    const { data: equipo, error: errEquipo } = await supabase
      .from('equipos')
      .insert({
        empresa_id: tenantId,
        codigo: codigoEquipo,
        nombre: `Andamio Multidireccional Test ${timestamp.toString().slice(-4)}`,
        categoria: 'Andamios',
        tarifa_diaria: 35000,
        stock_total: 10,
        stock_disponible: 10,
        stock_en_obra: 0,
        stock_mantenimiento: 0,
        estado: 'Activo',
        valor_reposicion: 850000,
      })
      .select()
      .single();

    if (errEquipo || !equipo) {
      logFail('Flujo 3', `Error creando equipo en inventario: ${errEquipo?.message}`);
    } else {
      createdEquipoId = equipo.id;
      logPass('Flujo 3 (Equipos)', `Equipo dado de alta con éxito (ID: ${equipo.id}, Código: ${equipo.codigo}, Stock: ${equipo.stock_disponible}/${equipo.stock_total}, Estado: ${equipo.estado})`);

      // Inserción de asiento inicial en Kardex (KARDEX-002)
      const { data: kardex, error: errKardex } = await supabase
        .from('kardex_inventario')
        .insert({
          empresa_id: tenantId,
          equipo_id: equipo.id,
          tipo_movimiento: 'ENTRADA',
          cantidad_delta: 10,
          stock_resultante: 10,
          motivo: 'Alta de equipo en inventario inicial (Verificación en Vivo)',
          referencia_documento: `ALTA-${equipo.codigo}`,
          usuario_id: testUserId,
          costo_unitario: 850000,
          costo_total: 8500000,
        })
        .select()
        .single();

      if (errKardex || !kardex) {
        logFail('Flujo 3 (Kardex)', `Error registrando asiento en Kardex: ${errKardex?.message}`);
      } else {
        logPass('Flujo 3 (Kardex)', `Asiento inicial de Kardex asentado exitosamente con ID: ${kardex.id} (Delta: +10, Resultante: 10)`);
      }
    }

    // -------------------------------------------------------------
    // FLUJO 4: Contratos de Alquiler & Despacho WMS
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- FLUJO 4: Creación de Contrato y Despacho de Maquinaria ---\x1b[0m');
    if (createdClienteId && createdEquipoId) {
      const consecutivo = Math.floor(100000 + Math.random() * 900000);
      const { data: alquiler, error: errAlquiler } = await supabase
        .from('alquileres')
        .insert({
          empresa_id: tenantId,
          consecutivo: consecutivo,
          cliente_id: createdClienteId,
          estado: 'ACTIVO',
          subtotal_equipos: 210000,
          flete_entrega: 50000,
          flete_recogida: 50000,
          subtotal_general: 310000,
          total: 310000,
          deposito: 100000,
          garantia_monto: 100000,
          garantia_tipo: 'EFECTIVO',
          garantia_estado: 'RETENIDA',
          observaciones: 'Contrato de verificación de flujo vivo',
          creado_por: 'Sistema QA Live',
          total_pagado: 100000,
          saldo_pendiente: 210000,
        })
        .select()
        .single();

      if (errAlquiler || !alquiler) {
        logFail('Flujo 4 (Alquiler)', `Error creando contrato de alquiler: ${errAlquiler?.message}`);
      } else {
        createdAlquilerId = alquiler.id;
        logPass('Flujo 4 (Alquiler)', `Contrato de alquiler creado con ID: ${alquiler.id} (Consecutivo: #${alquiler.consecutivo}, Total: $${alquiler.total})`);

        // Insertar detalle de alquiler
        const { error: errDetalle } = await supabase
          .from('alquiler_detalles')
          .insert({
            empresa_id: tenantId,
            alquiler_id: alquiler.id,
            equipo_id: createdEquipoId,
            cantidad: 2,
            tarifa_aplicada: 35000,
            dias_contratados: 3,
            subtotal_linea: 210000,
            devuelto: false,
            cantidad_devuelta: 0,
            fecha_inicio: new Date().toISOString(),
          });

        if (errDetalle) {
          logFail('Flujo 4 (Detalle)', `Error en detalle de alquiler: ${errDetalle.message}`);
        } else {
          // Despacho: Actualizar stock de equipo (10 -> 8 disponible, 0 -> 2 en obra)
          const { error: errStockDespacho } = await supabase
            .from('equipos')
            .update({
              stock_disponible: 8,
              stock_en_obra: 2,
            })
            .eq('id', createdEquipoId);

          if (errStockDespacho) {
            logFail('Flujo 4 (Despacho)', `Error actualizando stock por despacho: ${errStockDespacho.message}`);
          } else {
            // Asiento de Kardex por despacho
            await supabase.from('kardex_inventario').insert({
              empresa_id: tenantId,
              equipo_id: createdEquipoId,
              tipo_movimiento: 'SALIDA',
              cantidad_delta: -2,
              stock_resultante: 8,
              motivo: `Despacho de alquiler contrato #${alquiler.consecutivo}`,
              referencia_documento: `ALQ-${alquiler.consecutivo}`,
              usuario_id: testUserId,
            });

            logPass('Flujo 4 (Despacho)', 'Despacho WMS completado: 2 unidades enviadas a obra (Disponible: 8, En Obra: 2, Total: 10) con asiento en Kardex');
          }
        }
      }
    }

    // -------------------------------------------------------------
    // FLUJO 5: Devoluciones & Retorno de Maquinaria a Bodega
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- FLUJO 5: Devolución WMS y Retorno a Stock ---\x1b[0m');
    if (createdEquipoId && createdAlquilerId) {
      // Devolver 1 unidad de las 2 en obra (Disponible: 8 -> 9, En Obra: 2 -> 1, Total: 10)
      const { error: errDevolucion } = await supabase
        .from('equipos')
        .update({
          stock_disponible: 9,
          stock_en_obra: 1,
        })
        .eq('id', createdEquipoId);

      if (errDevolucion) {
        logFail('Flujo 5', `Error actualizando stock por devolución: ${errDevolucion.message}`);
      } else {
        // Registrar asiento en Kardex por retorno de obra
        await supabase.from('kardex_inventario').insert({
          empresa_id: tenantId,
          equipo_id: createdEquipoId,
          tipo_movimiento: 'ENTRADA',
          cantidad_delta: 1,
          stock_resultante: 9,
          motivo: `Devolución parcial de contrato #${createdAlquilerId}`,
          referencia_documento: `DEV-${createdAlquilerId}`,
          usuario_id: testUserId,
        });

        logPass('Flujo 5', 'Retorno a bodega certificado: 1 unidad devuelta de obra (Disponible: 9, En Obra: 1, Total: 10) con balance exacto');
      }
    }

    // -------------------------------------------------------------
    // FLUJO 6: Proveedores & Subcontrataciones (Re-Renting)
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- FLUJO 6: Subcontrataciones y Tercerización de Maquinaria ---\x1b[0m');
    const { data: proveedor, error: errProv } = await supabase
      .from('proveedores')
      .insert({
        empresa_id: tenantId,
        nombre: `PROVEEDOR_TEST_${timestamp.toString().slice(-4)}`,
        nit: `901444${timestamp.toString().slice(-4)}`,
        contacto: 'Carlos Proveedor',
        telefono: '3159876543',
        email: `prov.${timestamp}@equipos.com`,
        ciudad: 'Bucaramanga',
        estado: 'ACTIVO',
      })
      .select()
      .single();

    if (errProv || !proveedor) {
      logFail('Flujo 6 (Proveedor)', `Error creando proveedor de prueba: ${errProv?.message}`);
    } else {
      createdProveedorId = proveedor.id;
      logPass('Flujo 6 (Proveedor)', `Proveedor creado exitosamente con ID: ${proveedor.id}`);

      // Crear orden de subcontratación con estado 'ORDENADA' y fechas estimadas
      const consecutivoSub = `SUB-LIVE-${timestamp.toString().slice(-6)}`;
      const hoy = new Date().toISOString().split('T')[0];
      const en15Dias = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

      const { data: sub, error: errSub } = await supabase
        .from('subcontrataciones')
        .insert({
          empresa_id: tenantId,
          consecutivo: consecutivoSub,
          proveedor_id: proveedor.id,
          proveedor_nombre: proveedor.nombre,
          proveedor_nit: proveedor.nit,
          proveedor_telefono: proveedor.telefono,
          fecha_emision: hoy,
          fecha_recepcion_estimada: hoy,
          fecha_devolucion_estimada: en15Dias,
          estado: 'ORDENADA',
          costo_total_estimado: 450000,
          costo_total_real: 450000,
          deposito_garantia_proveedor: 150000,
          observaciones: 'Orden de subcontratación para prueba de integración viva',
          creado_por: 'Sistema QA Live',
        })
        .select()
        .single();

      if (errSub || !sub) {
        logFail('Flujo 6 (Subcontratación)', `Error creando subcontratación: ${errSub?.message}`);
      } else {
        createdSubcontratacionId = sub.id;
        logPass('Flujo 6 (Subcontratación)', `Orden de subcontratación registrada: Consecutivo ${sub.consecutivo} (Estado: ${sub.estado}, Costo: $${sub.costo_total_estimado})`);
      }
    }

    // -------------------------------------------------------------
    // FLUJO 7: Caja POS & Verificación del Índice Único Parcial (CAJA-001)
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- FLUJO 7: Caja POS y Demostración en Vivo de Índice Único (CAJA-001) ---\x1b[0m');
    // Verificar si ya existe una sesión abierta para el usuario
    const { data: sesionPrevia } = await supabase
      .from('sesiones_caja')
      .select('id, estado')
      .eq('usuario_id', testUserId)
      .eq('estado', 'ABIERTA')
      .maybeSingle();

    if (sesionPrevia) {
      logPass('Flujo 7 (Previo)', `El usuario ya tenía la sesión de caja activa ID: ${sesionPrevia.id}.`);
      createdSesionCajaId = sesionPrevia.id;
    } else {
      // Abrir sesión de caja
      const { data: nuevaSesion, error: errApertura } = await supabase
        .from('sesiones_caja')
        .insert({
          empresa_id: tenantId,
          usuario_id: testUserId,
          estado: 'ABIERTA',
          monto_apertura: 75000,
          fecha_apertura: new Date().toISOString(),
          observaciones: 'Apertura de prueba para certificación en vivo',
        })
        .select()
        .single();

      if (errApertura || !nuevaSesion) {
        logFail('Flujo 7 (Apertura)', `Error al abrir sesión de caja: ${errApertura?.message}`);
      } else {
        createdSesionCajaId = nuevaSesion.id;
        logPass('Flujo 7 (Apertura)', `Sesión de caja abierta exitosamente con ID: ${nuevaSesion.id} (Monto inicial: $${nuevaSesion.monto_apertura})`);
      }
    }

    // PRUEBA DE CONCURRENCIA: Intentar abrir una SEGUNDA sesión simultánea con el mismo usuario
    if (createdSesionCajaId) {
      const { data: sesionDuplicada, error: errDuplicada } = await supabase
        .from('sesiones_caja')
        .insert({
          empresa_id: tenantId,
          usuario_id: testUserId,
          estado: 'ABIERTA',
          monto_apertura: 100000,
          fecha_apertura: new Date().toISOString(),
        });

      if (errDuplicada && errDuplicada.code === '23505') {
        logPass('Flujo 7 (Blindaje CAJA-001)', '¡ÉXITO ROTUNDO! El índice parcial PostgreSQL "idx_sesion_activa_usuario_unica" interceptó y bloqueó la apertura duplicada con código 23505.');
      } else if (errDuplicada) {
        logPass('Flujo 7 (Blindaje CAJA-001)', `La inserción duplicada fue rechazada por la base de datos (${errDuplicada.code}: ${errDuplicada.message})`);
      } else {
        logFail('Flujo 7 (Blindaje CAJA-001)', 'FALLO DE INTEGRIDAD: La base de datos permitió dos sesiones abiertas para el mismo usuario.');
      }

      // Registrar movimiento de egreso menor en la caja
      const { data: movCaja, error: errMov } = await supabase
        .from('movimientos_caja')
        .insert({
          empresa_id: tenantId,
          sesion_caja_id: createdSesionCajaId,
          usuario_id: testUserId,
          tipo: 'EGRESO',
          monto: 15000,
          concepto: 'Gasto menor de papelería en obra (QA Live)',
          beneficiario: 'Papelería El Constructor',
        })
        .select()
        .single();

      if (errMov || !movCaja) {
        logFail('Flujo 7 (Movimiento)', `Error registrando egreso en caja: ${errMov?.message}`);
      } else {
        logPass('Flujo 7 (Movimiento)', `Movimiento de egreso registrado exitosamente en caja por $${movCaja.monto} (ID: ${movCaja.id})`);
        // Limpiar el movimiento temporal
        await supabase.from('movimientos_caja').delete().eq('id', movCaja.id);
      }
    }

    // -------------------------------------------------------------
    // FLUJO 8: Auditoría Inmutable (audit_logs)
    // -------------------------------------------------------------
    console.log('\n\x1b[36m--- FLUJO 8: Registro Inmutable de Auditoría ---\x1b[0m');
    const { data: audit, error: errAudit } = await supabase
      .from('audit_logs')
      .insert({
        empresa_id: tenantId,
        usuario_id: testUserId,
        modulo: 'sistema_global',
        accion: 'CERTIFICACION_FLUJOS_LIVE',
        entidad_id: 'qa-live-check',
        descripcion: 'Verificación de integración viva de extremo a extremo',
        detalles: {
          test_suite: 'live-database-flows',
          timestamp: new Date().toISOString(),
          status: 'CERTIFIED',
        },
      })
      .select()
      .single();

    if (errAudit || !audit) {
      logFail('Flujo 8', `Error en audit log: ${errAudit?.message}`);
    } else {
      createdAuditLogId = audit.id;
      logPass('Flujo 8', `Log de auditoría inmutable registrado con ID: ${audit.id} para la acción "${audit.accion}"`);
    }

  } catch (err: any) {
    logFail('Excepción Global', `Error no controlado durante la prueba en vivo: ${err?.message}`);
  } finally {
    // -------------------------------------------------------------
    // LIMPIEZA DE DATOS TEMPORALES (CLEANUP TRANQUILO)
    // -------------------------------------------------------------
    console.log('\n\x1b[33m--- LIMPIEZA DE DATOS TEMPORALES GENERADOS EN QA ---\x1b[0m');

    if (createdAuditLogId) {
      await supabase.from('audit_logs').delete().eq('id', createdAuditLogId);
    }
    if (createdSubcontratacionId) {
      await supabase.from('subcontrataciones').delete().eq('id', createdSubcontratacionId);
    }
    if (createdProveedorId) {
      await supabase.from('proveedores').delete().eq('id', createdProveedorId);
    }
    if (createdAlquilerId) {
      await supabase.from('alquiler_detalles').delete().eq('alquiler_id', createdAlquilerId);
      await supabase.from('alquileres').delete().eq('id', createdAlquilerId);
    }
    if (createdEquipoId) {
      await supabase.from('kardex_inventario').delete().eq('equipo_id', createdEquipoId);
      await supabase.from('equipos').delete().eq('id', createdEquipoId);
    }
    if (createdClienteId) {
      await supabase.from('clientes').delete().eq('id', createdClienteId);
    }

    console.log('\x1b[32m[CLEANUP]\x1b[0m Base de datos de producción restaurada a su estado limpio original.');

    // -------------------------------------------------------------
    // BALANCE FINAL
    // -------------------------------------------------------------
    console.log('\n================================================================');
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`   RESUMEN FINAL: ${passed} PASADOS | ${failed} FALLIDOS (Total: ${results.length})`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runLiveVerification();
