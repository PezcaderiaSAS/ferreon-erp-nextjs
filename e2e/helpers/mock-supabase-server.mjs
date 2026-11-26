import http from 'node:http';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const MOCK_JWT_SECRET = 'e2e-mock-jwt-secret-alquileres-system-2026';
export const MOCK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e2e-mock-anon-key-00000000000000000000';
export const MOCK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e2e-mock-service-role-key-000000000000';

export const TENANT_A_ID = '11111111-1111-4111-8111-111111111111';
export const TENANT_B_ID = '22222222-2222-4222-8222-222222222222';

export const KNOWN_TABLES = new Set([
  'empresas',
  'empresa_usuarios',
  'clientes',
  'equipos',
  'alquileres',
  'alquiler_detalles',
  'alquiler_adendas',
  'cotizaciones',
  'cotizaciones_detalles',
  'subcontrataciones',
  'subcontrataciones_detalles',
  'proveedores',
  'facturas',
  'pagos',
  'devoluciones',
  'devolucion_detalles',
  'sesiones_caja',
  'movimientos_caja',
  'dashboard_tareas',
  'audit_logs',
  'kardex_inventario',
  'compras',
  'compra_detalles',
  'rutas_despacho',
  'ruta_paradas',
  'idempotency_logs',
  'transactions',
  'journal_entries',
  'proveedor_cuentas_pagar',
  'proveedor_abonos_cxp',
  'cliente_movimientos_saldo',
  'pago_metodos_detalle',
  'usuarios',
]);

export const KNOWN_RPCS = new Set([
  'get_current_tenant_id',
  'reducir_stock_seguro',
  'aumentar_stock_seguro',
  'formalizar_alquiler_cotizacion_transaccional',
  'convertir_cotizacion_a_alquiler_transaccional',
  'cotizacion_convertir_pos_1clic',
  'alquiler_crear_pos_rapido_v1',
  'procesar_devolucion_avanzada',
  'devolucion_pos_inspeccion_rapida_v1',
  'alquiler_devolver_items_v1',
  'procesar_devolucion_transaccional',
]);

const UUID_PK_TABLES = new Set([
  'empresas',
  'empresa_usuarios',
  'cotizaciones',
  'cotizaciones_detalles',
  'subcontrataciones',
  'subcontrataciones_detalles',
  'proveedores',
  'dashboard_tareas',
  'audit_logs',
  'sesiones_caja',
  'movimientos_caja',
  'idempotency_logs',
  'transactions',
  'journal_entries',
  'rutas_despacho',
  'ruta_paradas',
  'proveedor_cuentas_pagar',
  'proveedor_abonos_cxp',
  'cliente_movimientos_saldo',
  'pago_metodos_detalle',
  'usuarios',
]);

const FK_RELATIONS = {
  alquileres: {
    clientes: { target: 'clientes', localKey: 'cliente_id', foreignKey: 'id', many: false },
    alquiler_detalles: { target: 'alquiler_detalles', localKey: 'id', foreignKey: 'alquiler_id', many: true },
    alquiler_adendas: { target: 'alquiler_adendas', localKey: 'id', foreignKey: 'alquiler_id', many: true },
  },
  alquiler_detalles: {
    equipos: { target: 'equipos', localKey: 'equipo_id', foreignKey: 'id', many: false },
    alquileres: { target: 'alquileres', localKey: 'alquiler_id', foreignKey: 'id', many: false },
    subcontrataciones: { target: 'subcontrataciones', localKey: 'subcontratacion_id', foreignKey: 'id', many: false },
  },
  cotizaciones: {
    clientes: { target: 'clientes', localKey: 'cliente_id', foreignKey: 'id', many: false },
    cotizaciones_detalles: { target: 'cotizaciones_detalles', localKey: 'id', foreignKey: 'cotizacion_id', many: true },
  },
  cotizaciones_detalles: {
    equipos: { target: 'equipos', localKey: 'equipo_id', foreignKey: 'id', many: false },
    cotizaciones: { target: 'cotizaciones', localKey: 'cotizacion_id', foreignKey: 'id', many: false },
  },
  subcontrataciones: {
    subcontrataciones_detalles: { target: 'subcontrataciones_detalles', localKey: 'id', foreignKey: 'subcontratacion_id', many: true },
    proveedores: { target: 'proveedores', localKey: 'proveedor_id', foreignKey: 'id', many: false },
    alquileres: { target: 'alquileres', localKey: 'alquiler_id', foreignKey: 'id', many: false },
  },
  subcontrataciones_detalles: {
    equipos: { target: 'equipos', localKey: 'equipo_id', foreignKey: 'id', many: false },
    subcontrataciones: { target: 'subcontrataciones', localKey: 'subcontratacion_id', foreignKey: 'id', many: false },
  },
  facturas: {
    clientes: { target: 'clientes', localKey: 'cliente_id', foreignKey: 'id', many: false },
    alquileres: { target: 'alquileres', localKey: 'alquiler_id', foreignKey: 'id', many: false },
  },
  pagos: {
    clientes: { target: 'clientes', localKey: 'cliente_id', foreignKey: 'id', many: false },
    alquileres: { target: 'alquileres', localKey: 'alquiler_id', foreignKey: 'id', many: false },
  },
  devoluciones: {
    devolucion_detalles: { target: 'devolucion_detalles', localKey: 'id', foreignKey: 'devolucion_id', many: true },
    alquileres: { target: 'alquileres', localKey: 'alquiler_id', foreignKey: 'id', many: false },
  },
  compras: {
    compra_detalles: { target: 'compra_detalles', localKey: 'id', foreignKey: 'compra_id', many: true },
    proveedores: { target: 'proveedores', localKey: 'proveedor_id', foreignKey: 'id', many: false },
  },
  rutas_despacho: {
    ruta_paradas: { target: 'ruta_paradas', localKey: 'id', foreignKey: 'ruta_id', many: true },
  },
};

const CHILD_PARENT_MAP = {
  alquiler_detalles: { parentTable: 'alquileres', localKey: 'alquiler_id', foreignKey: 'id' },
  alquiler_adendas: { parentTable: 'alquileres', localKey: 'alquiler_id', foreignKey: 'id' },
  cotizaciones_detalles: { parentTable: 'cotizaciones', localKey: 'cotizacion_id', foreignKey: 'id' },
  subcontrataciones_detalles: { parentTable: 'subcontrataciones', localKey: 'subcontratacion_id', foreignKey: 'id' },
  devolucion_detalles: { parentTable: 'devoluciones', localKey: 'devolucion_id', foreignKey: 'id' },
  compra_detalles: { parentTable: 'compras', localKey: 'compra_id', foreignKey: 'id' },
  ruta_paradas: { parentTable: 'rutas_despacho', localKey: 'ruta_id', foreignKey: 'id' },
};

function base64UrlEncode(input) {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function signMockJwt(payload, secret = MOCK_JWT_SECRET) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest()
  );
  return `${header}.${body}.${sig}`;
}

export function verifyMockJwt(token, secret = MOCK_JWT_SECRET) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest()
  );
  if (sig !== expectedSig) return null;
  try {
    const claims = JSON.parse(base64UrlDecode(body));
    if (claims.exp && typeof claims.exp === 'number' && claims.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

function buildUserObject(user) {
  const now = new Date().toISOString();
  return {
    id: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: user.email,
    email_confirmed_at: user.email_confirmed_at || '2026-01-01T00:00:00.000Z',
    phone: '',
    confirmed_at: user.confirmed_at || '2026-01-01T00:00:00.000Z',
    last_sign_in_at: now,
    app_metadata: user.app_metadata || { provider: 'email', providers: ['email'] },
    user_metadata: user.user_metadata || {},
    identities: [],
    created_at: user.created_at || '2026-01-01T00:00:00.000Z',
    updated_at: now,
  };
}

function buildSessionPayload(user) {
  const nowSec = Math.floor(Date.now() / 1000);
  const expiresIn = 3600;
  const claims = {
    aud: 'authenticated',
    exp: nowSec + expiresIn,
    iat: nowSec,
    iss: 'http://127.0.0.1:54329/auth/v1',
    sub: user.id,
    email: user.email,
    phone: '',
    app_metadata: user.app_metadata || { provider: 'email', providers: ['email'] },
    user_metadata: user.user_metadata || {},
    role: 'authenticated',
    aal: 'aal1',
    session_id: `sess-${user.id}`,
  };
  const accessToken = signMockJwt(claims);
  const refreshToken = `mock-refresh-${user.id}`;
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: expiresIn,
    expires_at: nowSec + expiresIn,
    refresh_token: refreshToken,
    user: buildUserObject(user),
  };
}

function createInitialState() {
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  const users = [
    {
      id: 'aaaa1111-1111-4111-8111-111111111111',
      email: 'admin@pezcaderia2022.test',
      password: 'E2E-Test-Password-A!',
      user_metadata: {
        nombre: 'Admin Pezcaderia 2022',
        rol: 'ADMIN',
        empresa_id: TENANT_A_ID,
        terminos_version: '1.0.0',
      },
      app_metadata: { provider: 'email', providers: ['email'] },
    },
    {
      id: 'bbbb2222-2222-4222-8222-222222222222',
      email: 'admin@aliadobga.test',
      password: 'E2E-Test-Password-B!',
      user_metadata: {
        nombre: 'Admin Aliado BGA',
        rol: 'ADMIN',
        empresa_id: TENANT_B_ID,
        terminos_version: '1.0.0',
      },
      app_metadata: { provider: 'email', providers: ['email'] },
    },
    {
      id: 'cccc3333-3333-4333-8333-333333333333',
      email: 'ultraadmin@alquileres.test',
      password: 'E2E-Test-Password-Ultra!',
      user_metadata: {
        nombre: 'UltraAdmin Sistema',
        rol: 'ULTRAADMIN',
        empresa_id: TENANT_A_ID,
        terminos_version: '1.0.0',
      },
      app_metadata: { provider: 'email', providers: ['email'] },
    },
    {
      id: 'dddd4444-4444-4444-8444-444444444444',
      email: 'sinempresa@alquileres.test',
      password: 'E2E-Test-Password-NoEmp!',
      user_metadata: {
        nombre: 'Usuario Nuevo Onboarding',
        rol: 'OPERADOR',
        terminos_version: '1.0.0',
      },
      app_metadata: { provider: 'email', providers: ['email'] },
    },
  ];

  const tables = {};
  for (const name of KNOWN_TABLES) {
    tables[name] = [];
  }

  tables.empresas = [
    {
      id: TENANT_A_ID,
      nombre: 'Pezcaderia 2022 Maquinaria SAS',
      razon_social: 'Pezcaderia 2022 Maquinaria SAS',
      slug: 'pezcaderia-2022',
      nit: '900111222-1',
      ciudad: 'Bucaramanga',
      estado: 'ACTIVO',
      created_at: nowIso,
    },
    {
      id: TENANT_B_ID,
      nombre: 'Aliado BGA Equipos SAS',
      razon_social: 'Aliado BGA Equipos SAS',
      slug: 'aliado-bga',
      nit: '900888999-2',
      ciudad: 'Floridablanca',
      estado: 'ACTIVO',
      created_at: nowIso,
    },
  ];

  tables.empresa_usuarios = [
    {
      id: 'eu-a-1',
      empresa_id: TENANT_A_ID,
      user_id: 'aaaa1111-1111-4111-8111-111111111111',
      rol: 'ADMIN',
      es_empresa_activa: true,
      estado: 'ACTIVO',
      deleted_at: null,
      created_at: nowIso,
    },
    {
      id: 'eu-b-1',
      empresa_id: TENANT_B_ID,
      user_id: 'bbbb2222-2222-4222-8222-222222222222',
      rol: 'ADMIN',
      es_empresa_activa: true,
      estado: 'ACTIVO',
      deleted_at: null,
      created_at: nowIso,
    },
    {
      id: 'eu-u-1',
      empresa_id: TENANT_A_ID,
      user_id: 'cccc3333-3333-4333-8333-333333333333',
      rol: 'ULTRAADMIN',
      es_empresa_activa: true,
      estado: 'ACTIVO',
      deleted_at: null,
      created_at: nowIso,
    },
  ];

  tables.clientes = [
    {
      id: 101,
      empresa_id: TENANT_A_ID,
      nit_cedula: '900555111-1',
      nombre: 'CONSTRUCTORA SANTANDER SAS',
      telefono: '3101112233',
      email: 'obras@santander.test',
      direccion: 'Calle 45 # 28-10 Bucaramanga',
      estado: 'Activo',
      nivel_riesgo: 'Bajo',
      deleted_at: null,
      created_at: nowIso,
    },
    {
      id: 201,
      empresa_id: TENANT_B_ID,
      nit_cedula: '900999777-8',
      nombre: 'INVERSIONES NORTE BGA LTDA',
      telefono: '3209998877',
      email: 'compras@nortebga.test',
      direccion: 'Carrera 33 # 52-20',
      estado: 'Activo',
      nivel_riesgo: 'Bajo',
      deleted_at: null,
      created_at: nowIso,
    },
  ];

  tables.equipos = [
    {
      id: 1001,
      empresa_id: TENANT_A_ID,
      codigo: 'AND-001',
      sku: 'AND-001',
      nombre: 'Andamio Tubular Certificado',
      categoria: 'Andamiaje',
      tarifa_diaria: 25000,
      valor_reposicion: 450000,
      stock_total: 20,
      stock_disponible: 15,
      stock_en_obra: 5,
      stock_mantenimiento: 0,
      estado: 'Activo',
      deleted_at: null,
      created_at: nowIso,
    },
    {
      id: 1002,
      empresa_id: TENANT_A_ID,
      codigo: 'MEZ-002',
      sku: 'MEZ-002',
      nombre: 'Mezcladora Concreto 1 Bulto',
      categoria: 'Maquinaria Ligera',
      tarifa_diaria: 85000,
      valor_reposicion: 3200000,
      stock_total: 4,
      stock_disponible: 3,
      stock_en_obra: 1,
      stock_mantenimiento: 0,
      estado: 'Activo',
      deleted_at: null,
      created_at: nowIso,
    },
    {
      id: 2001,
      empresa_id: TENANT_B_ID,
      codigo: 'COM-B01',
      sku: 'COM-B01',
      nombre: 'Compresor Industrial Tenant B',
      categoria: 'Neumatica',
      tarifa_diaria: 120000,
      valor_reposicion: 5500000,
      stock_total: 10,
      stock_disponible: 8,
      stock_en_obra: 2,
      stock_mantenimiento: 0,
      estado: 'Activo',
      deleted_at: null,
      created_at: nowIso,
    },
  ];

  tables.proveedores = [
    {
      id: 'prov-a-001',
      empresa_id: TENANT_A_ID,
      tenant_id: TENANT_A_ID,
      nombre: 'Aliado Maquinaria Santander SAS',
      nit: '900.321.654-7',
      contacto: 'Jorge Ruiz',
      telefono: '3157778899',
      email: 'aliado@santander.test',
      direccion: 'Zona Industrial Chimitá',
      ciudad: 'Bucaramanga',
      dias_credito: 30,
      estado: 'ACTIVO',
      created_at: nowIso,
    },
    {
      id: 'prov-b-001',
      empresa_id: TENANT_B_ID,
      tenant_id: TENANT_B_ID,
      nombre: 'Proveedor Exclusivo Tenant B',
      nit: '800.111.222-3',
      contacto: 'Laura Ortiz',
      telefono: '3112223344',
      email: 'provb@aliadobga.test',
      ciudad: 'Girón',
      dias_credito: 15,
      estado: 'ACTIVO',
      created_at: nowIso,
    },
  ];

  tables.alquileres = [
    {
      id: 501,
      empresa_id: TENANT_A_ID,
      consecutivo: 501,
      cliente_id: 101,
      estado: 'ACTIVO',
      subtotal_equipos: 875000,
      flete_entrega: 50000,
      flete_recogida: 0,
      subtotal_general: 925000,
      total: 925000,
      deposito: 200000,
      total_pagado: 200000,
      saldo_pendiente: 725000,
      garantia_monto: 200000,
      garantia_tipo: 'Efectivo',
      garantia_estado: 'Activa',
      observaciones: 'Contrato obra cabecera Tenant A',
      detalles_logistica: 'Entrega en obra norte',
      creado_por: 'admin@pezcaderia2022.test',
      deleted_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 601,
      empresa_id: TENANT_B_ID,
      consecutivo: 601,
      cliente_id: 201,
      estado: 'ACTIVO',
      subtotal_equipos: 1200000,
      flete_entrega: 0,
      flete_recogida: 0,
      subtotal_general: 1200000,
      total: 1200000,
      deposito: 0,
      total_pagado: 0,
      saldo_pendiente: 1200000,
      garantia_monto: 0,
      garantia_tipo: 'Efectivo',
      garantia_estado: 'Activa',
      observaciones: 'Contrato secreto Tenant B',
      creado_por: 'admin@aliadobga.test',
      deleted_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  tables.alquiler_detalles = [
    {
      id: 5001,
      empresa_id: TENANT_A_ID,
      alquiler_id: 501,
      equipo_id: 1001,
      cantidad: 5,
      tarifa_aplicada: 25000,
      dias_contratados: 7,
      subtotal_linea: 875000,
      fecha_inicio: today,
      fecha_fin: nextWeek,
      devuelto: false,
      cantidad_devuelta: 0,
      costo_dano: 0,
      es_subcontratado: false,
      subcontratacion_id: null,
      created_at: nowIso,
    },
    {
      id: 6001,
      empresa_id: TENANT_B_ID,
      alquiler_id: 601,
      equipo_id: 2001,
      cantidad: 2,
      tarifa_aplicada: 120000,
      dias_contratados: 5,
      subtotal_linea: 1200000,
      fecha_inicio: today,
      fecha_fin: nextWeek,
      devuelto: false,
      cantidad_devuelta: 0,
      costo_dano: 0,
      es_subcontratado: false,
      subcontratacion_id: null,
      created_at: nowIso,
    },
  ];

  tables.cotizaciones = [
    {
      id: 'cot-a-0001',
      empresa_id: TENANT_A_ID,
      consecutivo: 'COT-2026-0001',
      cliente_id: 101,
      cliente_nombre: 'CONSTRUCTORA SANTANDER SAS',
      cliente_documento: '900555111-1',
      cliente_telefono: '3101112233',
      cliente_email: 'obras@santander.test',
      fecha_emision: today,
      fecha_vencimiento: nextWeek,
      obra_nombre: 'Edificio Cabecera',
      obra_direccion: 'Calle 45 # 28-10',
      aplica_iva: true,
      tasa_iva: 19,
      valor_iva: 80750,
      aplica_retefuente: false,
      tasa_retefuente: 2.5,
      valor_retefuente: 0,
      aplica_reteica: false,
      tasa_reteica: 0.966,
      valor_reteica: 0,
      subtotal: 425000,
      valor_transporte: 30000,
      deposito_garantia: 100000,
      total: 535750,
      estado: 'ENVIADA',
      observaciones: 'Cotización comercial inicial Tenant A',
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  tables.cotizaciones_detalles = [
    {
      id: 'cotdet-a-0001',
      empresa_id: TENANT_A_ID,
      cotizacion_id: 'cot-a-0001',
      equipo_id: 1002,
      cantidad: 1,
      dias: 5,
      tarifa_diaria: 85000,
      subtotal: 425000,
    },
  ];

  tables.subcontrataciones = [
    {
      id: 'sub-a-0001',
      empresa_id: TENANT_A_ID,
      consecutivo: 'SUB-20261126-0001',
      alquiler_id: 501,
      proveedor_id: 'prov-a-001',
      proveedor_nombre: 'Aliado Maquinaria Santander SAS',
      proveedor_nit: '900.321.654-7',
      proveedor_telefono: '3157778899',
      fecha_recepcion_estimada: today,
      fecha_devolucion_estimada: nextWeek,
      costo_total_estimado: 350000,
      deposito_garantia_proveedor: 0,
      observaciones: 'Subcontratación activa Tenant A',
      estado: 'ACTIVA',
      creado_por: 'admin@pezcaderia2022.test',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'sub-b-0001',
      empresa_id: TENANT_B_ID,
      consecutivo: 'SUB-20261126-9001',
      alquiler_id: 601,
      proveedor_id: 'prov-b-001',
      proveedor_nombre: 'Proveedor Exclusivo Tenant B',
      proveedor_nit: '800.111.222-3',
      proveedor_telefono: '3112223344',
      fecha_recepcion_estimada: today,
      fecha_devolucion_estimada: nextWeek,
      costo_total_estimado: 500000,
      deposito_garantia_proveedor: 0,
      observaciones: 'Subcontratación privada Tenant B',
      estado: 'ACTIVA',
      creado_por: 'admin@aliadobga.test',
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  tables.subcontrataciones_detalles = [
    {
      id: 'subdet-a-0001',
      empresa_id: TENANT_A_ID,
      subcontratacion_id: 'sub-a-0001',
      equipo_id: 1001,
      descripcion_item: 'Compactador Rana 5HP',
      cantidad: 1,
      dias_pactados: 7,
      costo_diario_unitario: 50000,
      tarifa_diaria_cliente: 85000,
      subtotal_costo: 350000,
      alquiler_detalle_id: 5001,
      serial_tercero: 'SER-ALIADO-001',
      marca: 'Wacker Neuson',
    },
  ];

  tables.sesiones_caja = [
    {
      id: 'caja-a-0001',
      empresa_id: TENANT_A_ID,
      usuario_id: 'aaaa1111-1111-4111-8111-111111111111',
      estado: 'ABIERTA',
      monto_apertura: 200000,
      fecha_apertura: nowIso,
      created_at: nowIso,
    },
  ];

  tables.dashboard_tareas = [
    {
      id: 'tarea-a-0001',
      empresa_id: TENANT_A_ID,
      user_id: 'aaaa1111-1111-4111-8111-111111111111',
      titulo: 'Revisar mantenimiento mezcladora',
      subtexto: 'Taller principal',
      completada: false,
      urgencia: 'NORMAL',
      fecha_limite: nextWeek,
      deleted_at: null,
      created_at: nowIso,
    },
  ];

  return {
    users,
    tables,
    rpcOverrides: {},
    requests: [],
    sequences: {
      serial: 10000,
      cotizacion: {},
      alquiler: { [TENANT_A_ID]: 501, [TENANT_B_ID]: 601 },
    },
  };
}

function sendJson(res, status, data, extraHeaders = {}) {
  const body = data === undefined ? '' : JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
    'Access-Control-Expose-Headers': 'Content-Range',
    ...extraHeaders,
  });
  res.end(body);
}

function sendEmpty(res, status, extraHeaders = {}) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
    'Access-Control-Expose-Headers': 'Content-Range',
    ...extraHeaders,
  });
  res.end();
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function resolveAuthContext(req, state) {
  const apiKey = req.headers['apikey'] || '';
  const authHeader = req.headers['authorization'] || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (bearer === MOCK_SERVICE_ROLE_KEY || (!bearer && apiKey === MOCK_SERVICE_ROLE_KEY)) {
    return { mode: 'service_role', userId: null, tenantId: null, claims: null };
  }

  if (bearer && bearer !== MOCK_ANON_KEY) {
    const claims = verifyMockJwt(bearer);
    if (claims && claims.sub) {
      const membership = state.tables.empresa_usuarios.find(
        (m) =>
          m.user_id === claims.sub &&
          m.es_empresa_activa === true &&
          (m.estado === undefined || m.estado === 'ACTIVO') &&
          !m.deleted_at
      );
      const tenantId = membership?.empresa_id || claims.user_metadata?.empresa_id || null;
      return {
        mode: 'authenticated',
        userId: claims.sub,
        tenantId,
        claims,
      };
    }
  }

  return { mode: 'anon', userId: null, tenantId: null, claims: null };
}

function rowBelongsToTenant(table, row, auth, state) {
  if (auth.mode === 'service_role') return true;
  if (auth.mode !== 'authenticated') return false;

  if (table === 'empresas') {
    if (row.id === auth.tenantId) return true;
    return state.tables.empresa_usuarios.some(
      (m) => m.user_id === auth.userId && m.empresa_id === row.id && !m.deleted_at
    );
  }

  if (table === 'empresa_usuarios') {
    return row.user_id === auth.userId;
  }

  if (!auth.tenantId) return false;

  if (row.empresa_id !== undefined && row.empresa_id !== null) {
    return row.empresa_id === auth.tenantId;
  }

  const childInfo = CHILD_PARENT_MAP[table];
  if (childInfo) {
    const parentRows = state.tables[childInfo.parentTable] || [];
    const parent = parentRows.find((p) => String(p[childInfo.foreignKey]) === String(row[childInfo.localKey]));
    return Boolean(parent && parent.empresa_id === auth.tenantId);
  }

  return false;
}

function splitTopLevelCommas(str) {
  const parts = [];
  let depth = 0;
  let inQuotes = false;
  let current = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"' && str[i - 1] !== '\\') {
      inQuotes = !inQuotes;
      current += ch;
      continue;
    }
    if (!inQuotes) {
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if (ch === ',' && depth === 0) {
        if (current.trim()) parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function coerceComparable(a, rawVal) {
  if (rawVal === 'null') return [a, null];
  if (rawVal === 'true') return [a, true];
  if (rawVal === 'false') return [a, false];
  if (typeof a === 'number') {
    const num = Number(rawVal);
    if (!Number.isNaN(num)) return [a, num];
  }
  return [a === undefined || a === null ? '' : String(a), String(rawVal)];
}

function matchOperator(rowVal, expr) {
  let negated = false;
  let opExpr = expr;
  if (opExpr.startsWith('not.')) {
    negated = true;
    opExpr = opExpr.slice(4);
  }

  const dotIdx = opExpr.indexOf('.');
  if (dotIdx === -1) return true;
  const op = opExpr.slice(0, dotIdx);
  const valStr = opExpr.slice(dotIdx + 1);

  let matched = false;
  if (op === 'is') {
    if (valStr === 'null') matched = rowVal === null || rowVal === undefined;
    else if (valStr === 'true') matched = rowVal === true;
    else if (valStr === 'false') matched = rowVal === false;
  } else if (op === 'eq') {
    const [a, b] = coerceComparable(rowVal, valStr);
    matched = a === b;
  } else if (op === 'neq') {
    const [a, b] = coerceComparable(rowVal, valStr);
    matched = a !== b;
  } else if (op === 'gt') {
    const [a, b] = coerceComparable(rowVal, valStr);
    matched = a > b;
  } else if (op === 'gte') {
    const [a, b] = coerceComparable(rowVal, valStr);
    matched = a >= b;
  } else if (op === 'lt') {
    const [a, b] = coerceComparable(rowVal, valStr);
    matched = a < b;
  } else if (op === 'lte') {
    const [a, b] = coerceComparable(rowVal, valStr);
    matched = a <= b;
  } else if (op === 'in') {
    const inner = valStr.replace(/^\(/, '').replace(/\)$/, '');
    const items = splitTopLevelCommas(inner).map((item) =>
      item.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
    );
    matched = items.some((it) => String(rowVal) === it);
  } else if (op === 'ilike' || op === 'like') {
    const pattern = valStr.replace(/[*%]/g, '.*');
    const regex = new RegExp(`^${pattern}$`, op === 'ilike' ? 'i' : '');
    matched = regex.test(String(rowVal ?? ''));
  } else {
    matched = true;
  }

  return negated ? !matched : matched;
}

function matchLogicalNode(row, expr) {
  const trimmed = expr.trim();
  if (trimmed.startsWith('and(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(4, -1);
    return splitTopLevelCommas(inner).every((sub) => matchLogicalNode(row, sub));
  }
  if (trimmed.startsWith('or(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(3, -1);
    return splitTopLevelCommas(inner).some((sub) => matchLogicalNode(row, sub));
  }
  const firstDot = trimmed.indexOf('.');
  if (firstDot === -1) return true;
  const col = trimmed.slice(0, firstDot);
  const rest = trimmed.slice(firstDot + 1);
  return matchOperator(row[col], rest);
}

function applyQueryFilters(rows, searchParams) {
  const reserved = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);
  let filtered = [...rows];

  for (const [key, val] of searchParams.entries()) {
    if (reserved.has(key)) continue;
    if (key === 'or' || key === 'and') {
      const inner = val.replace(/^\(/, '').replace(/\)$/, '');
      const parts = splitTopLevelCommas(inner);
      if (key === 'or') {
        filtered = filtered.filter((r) => parts.some((p) => matchLogicalNode(r, p)));
      } else {
        filtered = filtered.filter((r) => parts.every((p) => matchLogicalNode(r, p)));
      }
      continue;
    }
    filtered = filtered.filter((r) => matchOperator(r[key], val));
  }

  const orderParam = searchParams.get('order');
  if (orderParam) {
    const clauses = orderParam.split(',').map((c) => c.trim()).filter(Boolean);
    filtered.sort((a, b) => {
      for (const clause of clauses) {
        const parts = clause.split('.');
        const col = parts[0];
        const desc = parts.includes('desc');
        const va = a[col];
        const vb = b[col];
        if (va === vb) continue;
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        const cmp = va < vb ? -1 : 1;
        return desc ? -cmp : cmp;
      }
      return 0;
    });
  }

  return filtered;
}

function parseSelectSpec(selectStr) {
  if (!selectStr || selectStr.trim() === '*') {
    return { wildcard: true, columns: [], embeds: {} };
  }
  const tokens = splitTopLevelCommas(selectStr);
  let wildcard = false;
  const columns = [];
  const embeds = {};

  for (const token of tokens) {
    if (token === '*') {
      wildcard = true;
      continue;
    }
    const parenIdx = token.indexOf('(');
    if (parenIdx !== -1 && token.endsWith(')')) {
      const head = token.slice(0, parenIdx).trim();
      const aliasParts = head.split(':');
      const outputKey = aliasParts[0].trim();
      const relationName = (aliasParts[1] || aliasParts[0]).split('!')[0].trim();
      const inner = token.slice(parenIdx + 1, -1).trim();
      embeds[outputKey] = {
        relationName,
        spec: parseSelectSpec(inner),
      };
    } else {
      const colName = token.split(':').pop().trim();
      columns.push(colName);
    }
  }

  return { wildcard, columns, embeds };
}

function projectRow(table, row, spec, auth, state) {
  const out = {};
  if (spec.wildcard) {
    Object.assign(out, row);
  } else {
    for (const col of spec.columns) {
      out[col] = row[col] !== undefined ? row[col] : null;
    }
  }

  const relations = FK_RELATIONS[table] || {};
  for (const [outputKey, embed] of Object.entries(spec.embeds)) {
    const rel = relations[embed.relationName];
    if (!rel) {
      out[outputKey] = null;
      continue;
    }
    const targetRows = (state.tables[rel.target] || []).filter((tr) =>
      rowBelongsToTenant(rel.target, tr, auth, state)
    );
    const localVal = row[rel.localKey];
    if (localVal === null || localVal === undefined) {
      out[outputKey] = rel.many ? [] : null;
      continue;
    }
    if (rel.many) {
      const matches = targetRows.filter((tr) => String(tr[rel.foreignKey]) === String(localVal));
      out[outputKey] = matches.map((m) => projectRow(rel.target, m, embed.spec, auth, state));
    } else {
      const match = targetRows.find((tr) => String(tr[rel.foreignKey]) === String(localVal));
      out[outputKey] = match ? projectRow(rel.target, match, embed.spec, auth, state) : null;
    }
  }

  return out;
}

function generateIdForTable(table, state) {
  if (UUID_PK_TABLES.has(table)) {
    return crypto.randomUUID();
  }
  state.sequences.serial += 1;
  return state.sequences.serial;
}

function nextCotizacionConsecutivo(empresaId, fechaEmision, state) {
  const yearMatch = typeof fechaEmision === 'string' ? fechaEmision.match(/^(\d{4})/) : null;
  const year = yearMatch ? yearMatch[1] : String(new Date().getFullYear());
  const key = `${empresaId || 'global'}:${year}`;
  const current = state.sequences.cotizacion[key] || 0;
  let next = current + 1;
  const existing = new Set(
    (state.tables.cotizaciones || [])
      .filter((c) => c.empresa_id === empresaId)
      .map((c) => c.consecutivo)
  );
  let candidate = `COT-${year}-${String(next).padStart(4, '0')}`;
  while (existing.has(candidate)) {
    next += 1;
    candidate = `COT-${year}-${String(next).padStart(4, '0')}`;
  }
  state.sequences.cotizacion[key] = next;
  return candidate;
}

function nextAlquilerConsecutivo(empresaId, state) {
  const key = empresaId || 'global';
  const current = state.sequences.alquiler[key] || 500;
  const next = current + 1;
  state.sequences.alquiler[key] = next;
  return next;
}

function handleRpcCall(fnName, payload, auth, state) {
  if (state.rpcOverrides[fnName]) {
    const ov = state.rpcOverrides[fnName];
    if (ov.error) {
      return { status: ov.status || 400, body: ov.error };
    }
    return { status: ov.status || 200, body: ov.data ?? null };
  }

  if (!KNOWN_RPCS.has(fnName)) {
    return {
      status: 404,
      body: {
        code: '42883',
        details: null,
        hint: 'No function matches the given name and argument types.',
        message: `function public.${fnName}() does not exist`,
      },
    };
  }

  if (fnName === 'get_current_tenant_id') {
    return { status: 200, body: auth.tenantId };
  }

  if (fnName === 'reducir_stock_seguro') {
    const equipoId = payload?.p_equipo_id;
    const qty = Number(payload?.p_cantidad_requerida || 0);
    const eq = state.tables.equipos.find((e) => String(e.id) === String(equipoId));
    if (!eq) {
      return { status: 400, body: { code: 'P0001', message: `Equipo ${equipoId} no encontrado` } };
    }
    if (Number(eq.stock_disponible || 0) < qty) {
      return {
        status: 400,
        body: { code: 'P0001', message: `STOCK_INSUFICIENTE: Disponible ${eq.stock_disponible}, requerido ${qty}` },
      };
    }
    eq.stock_disponible = Number(eq.stock_disponible) - qty;
    eq.stock_en_obra = Number(eq.stock_en_obra || 0) + qty;
    eq.updated_at = new Date().toISOString();
    return { status: 200, body: true };
  }

  if (fnName === 'aumentar_stock_seguro') {
    const equipoId = payload?.p_equipo_id;
    const qty = Number(payload?.p_cantidad || 0);
    const eq = state.tables.equipos.find((e) => String(e.id) === String(equipoId));
    if (eq) {
      eq.stock_disponible = Math.min(Number(eq.stock_total || 999999), Number(eq.stock_disponible || 0) + qty);
      eq.stock_en_obra = Math.max(0, Number(eq.stock_en_obra || 0) - qty);
      eq.updated_at = new Date().toISOString();
    }
    return { status: 200, body: true };
  }

  if (
    fnName === 'convertir_cotizacion_a_alquiler_transaccional' ||
    fnName === 'cotizacion_convertir_pos_1clic' ||
    fnName === 'formalizar_alquiler_cotizacion_transaccional'
  ) {
    const p = payload?.p_payload || payload || {};
    const empresaId = p.empresa_id || auth.tenantId;
    const nowIso = new Date().toISOString();
    const alquilerId = generateIdForTable('alquileres', state);
    const consecutivo = nextAlquilerConsecutivo(empresaId, state);

    let cotizacionConsecutivo = null;
    if (p.cotizacion_id) {
      const cot = state.tables.cotizaciones.find((c) => String(c.id) === String(p.cotizacion_id));
      if (cot) {
        cot.estado = 'CONVERTIDA';
        cot.updated_at = nowIso;
        cotizacionConsecutivo = cot.consecutivo;
      }
    }

    const newAlq = {
      id: alquilerId,
      empresa_id: empresaId,
      consecutivo,
      cliente_id: 101,
      estado: 'ACTIVO',
      subtotal_equipos: 425000,
      flete_entrega: 0,
      flete_recogida: 0,
      subtotal_general: 425000,
      total: 425000,
      deposito: Number(p.monto_deposito || 0),
      total_pagado: Number(p.monto_deposito || 0),
      saldo_pendiente: Math.max(0, 425000 - Number(p.monto_deposito || 0)),
      observaciones: p.detalles_logistica || 'Convertido vía RPC',
      deleted_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    };
    state.tables.alquileres.push(newAlq);

    return {
      status: 200,
      body: {
        alquiler_id: alquilerId,
        consecutivo,
        cotizacion_consecutivo: cotizacionConsecutivo,
        total: newAlq.total,
        deposito: newAlq.deposito,
        saldo_pendiente: newAlq.saldo_pendiente,
        idempotent: false,
      },
    };
  }

  if (fnName === 'alquiler_crear_pos_rapido_v1') {
    const p = payload?.p_payload || payload || {};
    const empresaId = p.empresa_id || auth.tenantId;
    const nowIso = new Date().toISOString();
    const alquilerId = generateIdForTable('alquileres', state);
    const consecutivo = nextAlquilerConsecutivo(empresaId, state);

    const newAlq = {
      id: alquilerId,
      empresa_id: empresaId,
      consecutivo,
      cliente_id: p.cliente_id || 101,
      estado: 'ACTIVO',
      subtotal_equipos: Number(p.subtotal_equipos || 0),
      flete_entrega: Number(p.flete_entrega || 0),
      flete_recogida: Number(p.flete_recogida || 0),
      subtotal_general: Number(p.subtotal_general || 0),
      total: Number(p.total || 0),
      deposito: Number(p.deposito || 0),
      saldo_pendiente: Math.max(0, Number(p.total || 0) - Number(p.deposito || 0)),
      observaciones: p.observaciones || '',
      detalles_logistica: p.detalles_logistica || '',
      creado_por: p.creado_por || 'OPERADOR_POS',
      deleted_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    };
    state.tables.alquileres.push(newAlq);

    return {
      status: 200,
      body: {
        id: alquilerId,
        alquiler_id: alquilerId,
        consecutivo,
        ...newAlq,
      },
    };
  }

  if (
    fnName === 'procesar_devolucion_avanzada' ||
    fnName === 'devolucion_pos_inspeccion_rapida_v1' ||
    fnName === 'alquiler_devolver_items_v1' ||
    fnName === 'procesar_devolucion_transaccional'
  ) {
    const p = payload?.p_payload || payload || {};
    const alquilerId = p.alquiler_id || p.p_alquiler_id;
    const nowIso = new Date().toISOString();

    const alquiler = state.tables.alquileres.find((a) => String(a.id) === String(alquilerId));
    if (alquiler) {
      alquiler.estado = 'FINALIZADO';
      alquiler.updated_at = nowIso;
    }

    const detalles = state.tables.alquiler_detalles.filter((d) => String(d.alquiler_id) === String(alquilerId));
    const subIds = new Set();
    for (const det of detalles) {
      det.devuelto = true;
      det.cantidad_devuelta = det.cantidad;
      if (det.subcontratacion_id) {
        subIds.add(String(det.subcontratacion_id));
      }
      const eq = state.tables.equipos.find((e) => String(e.id) === String(det.equipo_id));
      if (eq && !det.es_subcontratado) {
        eq.stock_disponible = Math.min(Number(eq.stock_total || 999999), Number(eq.stock_disponible || 0) + Number(det.cantidad || 0));
        eq.stock_en_obra = Math.max(0, Number(eq.stock_en_obra || 0) - Number(det.cantidad || 0));
      }
    }

    for (const sub of state.tables.subcontrataciones) {
      if (String(sub.alquiler_id) === String(alquilerId) || subIds.has(String(sub.id))) {
        sub.estado = 'En Bodega (Retorno Pendiente a Aliado)';
        sub.updated_at = nowIso;
      }
    }

    return {
      status: 200,
      body: {
        ok: true,
        alquiler_id: alquilerId,
        subcontrataciones_actualizadas: Array.from(subIds),
      },
    };
  }

  return { status: 200, body: { ok: true } };
}

function encodeWsTextFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  const len = payload.length;
  if (len < 126) {
    return Buffer.concat([Buffer.from([0x81, len]), payload]);
  }
  const header = Buffer.alloc(4);
  header[0] = 0x81;
  header[1] = 126;
  header.writeUInt16BE(len, 2);
  return Buffer.concat([header, payload]);
}

function decodeWsFrames(buffer) {
  const frames = [];
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const byte1 = buffer[offset];
    const byte2 = buffer[offset + 1];
    const opcode = byte1 & 0x0f;
    const masked = (byte2 & 0x80) !== 0;
    let payloadLen = byte2 & 0x7f;
    let cursor = offset + 2;

    if (payloadLen === 126) {
      if (cursor + 2 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(cursor);
      cursor += 2;
    } else if (payloadLen === 127) {
      if (cursor + 8 > buffer.length) break;
      payloadLen = Number(buffer.readBigUInt64BE(cursor));
      cursor += 8;
    }

    let maskKey = null;
    if (masked) {
      if (cursor + 4 > buffer.length) break;
      maskKey = buffer.subarray(cursor, cursor + 4);
      cursor += 4;
    }

    if (cursor + payloadLen > buffer.length) break;
    const rawPayload = Buffer.from(buffer.subarray(cursor, cursor + payloadLen));
    if (masked && maskKey) {
      for (let i = 0; i < rawPayload.length; i++) {
        rawPayload[i] ^= maskKey[i % 4];
      }
    }
    frames.push({ opcode, payload: rawPayload });
    offset = cursor + payloadLen;
  }
  return { frames, remaining: buffer.subarray(offset) };
}

export function createMockSupabaseServer({ port = 54329, host = '127.0.0.1' } = {}) {
  let state = createInitialState();

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        sendEmpty(res, 204);
        return;
      }

      const urlObj = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`);
      const pathname = urlObj.pathname;

      // Control plane endpoints (excluded from request log to keep assertion logs clean)
      if (pathname === '/__e2e__/health' && req.method === 'GET') {
        sendJson(res, 200, { ok: true, mode: 'mock', port, tables: Array.from(KNOWN_TABLES) });
        return;
      }

      if (pathname === '/__e2e__/reset' && req.method === 'POST') {
        state = createInitialState();
        sendJson(res, 200, { ok: true });
        return;
      }

      if (pathname === '/__e2e__/state' && req.method === 'GET') {
        sendJson(res, 200, {
          tables: state.tables,
          users: state.users.map((u) => ({ id: u.id, email: u.email, user_metadata: u.user_metadata })),
          rpcOverrides: state.rpcOverrides,
        });
        return;
      }

      if (pathname === '/__e2e__/requests' && req.method === 'GET') {
        const result = [...state.requests];
        if (urlObj.searchParams.get('clear') === '1') {
          state.requests = [];
        }
        sendJson(res, 200, { requests: result });
        return;
      }

      if (pathname === '/__e2e__/requests' && req.method === 'DELETE') {
        state.requests = [];
        sendJson(res, 200, { ok: true });
        return;
      }

      if (pathname === '/__e2e__/seed' && req.method === 'POST') {
        const body = (await readBody(req)) || {};
        if (body.resetFirst) {
          state = createInitialState();
        }
        if (body.replaceTables && typeof body.replaceTables === 'object') {
          for (const [tbl, rows] of Object.entries(body.replaceTables)) {
            if (!KNOWN_TABLES.has(tbl)) {
              sendJson(res, 400, { error: `Unknown table in seed: ${tbl}` });
              return;
            }
            state.tables[tbl] = Array.isArray(rows) ? structuredClone(rows) : [];
          }
        }
        if (body.tables && typeof body.tables === 'object') {
          for (const [tbl, rows] of Object.entries(body.tables)) {
            if (!KNOWN_TABLES.has(tbl)) {
              sendJson(res, 400, { error: `Unknown table in seed: ${tbl}` });
              return;
            }
            if (!Array.isArray(rows)) continue;
            for (const row of rows) {
              const clone = structuredClone(row);
              if (clone.id !== undefined) {
                const idx = state.tables[tbl].findIndex((r) => String(r.id) === String(clone.id));
                if (idx >= 0) {
                  state.tables[tbl][idx] = { ...state.tables[tbl][idx], ...clone };
                  continue;
                }
              } else {
                clone.id = generateIdForTable(tbl, state);
              }
              state.tables[tbl].push(clone);
            }
          }
        }
        if (Array.isArray(body.users)) {
          for (const u of body.users) {
            const idx = state.users.findIndex(
              (existing) => existing.id === u.id || existing.email.toLowerCase() === String(u.email || '').toLowerCase()
            );
            if (idx >= 0) {
              state.users[idx] = { ...state.users[idx], ...structuredClone(u) };
            } else {
              state.users.push({
                id: u.id || crypto.randomUUID(),
                email: u.email,
                password: u.password || 'E2E-Seed-Password!',
                user_metadata: u.user_metadata || {},
                app_metadata: u.app_metadata || { provider: 'email', providers: ['email'] },
              });
            }
          }
        }
        if (body.rpcs && typeof body.rpcs === 'object') {
          for (const [fnName, override] of Object.entries(body.rpcs)) {
            state.rpcOverrides[fnName] = override;
          }
        }
        sendJson(res, 200, { ok: true });
        return;
      }

      const body = req.method === 'GET' || req.method === 'HEAD' ? null : await readBody(req);
      const auth = resolveAuthContext(req, state);
      const reqEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: pathname,
        query: urlObj.search,
        body,
        authMode: auth.mode,
        tenantId: auth.tenantId,
        status: 200,
      };
      state.requests.push(reqEntry);

      // GoTrue Auth API
      if (pathname === '/auth/v1/token' && req.method === 'POST') {
        const grantType = urlObj.searchParams.get('grant_type') || 'password';
        if (grantType === 'password') {
          const email = String(body?.email || '').trim().toLowerCase();
          const password = String(body?.password || '');
          const user = state.users.find((u) => u.email.toLowerCase() === email && u.password === password);
          if (!user) {
            reqEntry.status = 400;
            sendJson(res, 400, {
              error: 'invalid_grant',
              error_description: 'Invalid login credentials',
            });
            return;
          }
          const session = buildSessionPayload(user);
          sendJson(res, 200, session);
          return;
        }

        if (grantType === 'refresh_token') {
          const rt = String(body?.refresh_token || '');
          const userId = rt.startsWith('mock-refresh-') ? rt.slice('mock-refresh-'.length) : null;
          const user = state.users.find((u) => u.id === userId);
          if (!user) {
            reqEntry.status = 400;
            sendJson(res, 400, { error: 'invalid_grant', error_description: 'Invalid Refresh Token' });
            return;
          }
          sendJson(res, 200, buildSessionPayload(user));
          return;
        }

        reqEntry.status = 400;
        sendJson(res, 400, { error: 'unsupported_grant_type' });
        return;
      }

      if (pathname === '/auth/v1/signup' && req.method === 'POST') {
        const email = String(body?.email || '').trim().toLowerCase();
        const password = String(body?.password || '');
        if (!email || !password) {
          reqEntry.status = 400;
          sendJson(res, 400, { error: 'validation_failed', msg: 'Email and password required' });
          return;
        }
        if (state.users.some((u) => u.email.toLowerCase() === email)) {
          reqEntry.status = 422;
          sendJson(res, 422, { code: 422, msg: 'User already registered' });
          return;
        }
        const user = {
          id: crypto.randomUUID(),
          email,
          password,
          user_metadata: body?.data || body?.options?.data || {},
          app_metadata: { provider: 'email', providers: ['email'] },
        };
        state.users.push(user);
        const session = buildSessionPayload(user);
        sendJson(res, 200, { ...session, user: session.user, session });
        return;
      }

      if (pathname === '/auth/v1/user' && req.method === 'GET') {
        if (auth.mode !== 'authenticated' || !auth.userId) {
          reqEntry.status = 401;
          sendJson(res, 401, { code: 401, error_code: 'bad_jwt', msg: 'Invalid JWT' });
          return;
        }
        const user = state.users.find((u) => u.id === auth.userId);
        if (!user) {
          reqEntry.status = 401;
          sendJson(res, 401, { code: 401, error_code: 'user_not_found', msg: 'User from sub claim in JWT does not exist' });
          return;
        }
        sendJson(res, 200, buildUserObject(user));
        return;
      }

      if (pathname === '/auth/v1/user' && req.method === 'PUT') {
        if (auth.mode !== 'authenticated' || !auth.userId) {
          reqEntry.status = 401;
          sendJson(res, 401, { code: 401, error_code: 'bad_jwt', msg: 'Invalid JWT' });
          return;
        }
        const user = state.users.find((u) => u.id === auth.userId);
        if (!user) {
          reqEntry.status = 404;
          sendJson(res, 404, { msg: 'User not found' });
          return;
        }
        if (body?.data && typeof body.data === 'object') {
          user.user_metadata = { ...user.user_metadata, ...body.data };
        }
        sendJson(res, 200, buildUserObject(user));
        return;
      }

      if (pathname === '/auth/v1/logout' && req.method === 'POST') {
        reqEntry.status = 204;
        sendEmpty(res, 204);
        return;
      }

      if (pathname.startsWith('/auth/v1/admin/users')) {
        if (auth.mode !== 'service_role') {
          reqEntry.status = 403;
          sendJson(res, 403, { error: 'not_admin', message: 'User not allowed' });
          return;
        }
        if (pathname === '/auth/v1/admin/users' && req.method === 'GET') {
          sendJson(res, 200, { users: state.users.map(buildUserObject), aud: 'authenticated' });
          return;
        }
        const idPart = pathname.split('/').pop();
        const found = state.users.find((u) => u.id === idPart);
        if (!found) {
          reqEntry.status = 404;
          sendJson(res, 404, { error: 'user_not_found' });
          return;
        }
        sendJson(res, 200, buildUserObject(found));
        return;
      }

      // RPC endpoint
      if (pathname.startsWith('/rest/v1/rpc/')) {
        const fnName = pathname.slice('/rest/v1/rpc/'.length);
        if (auth.mode === 'anon') {
          reqEntry.status = 401;
          sendJson(res, 401, { code: 'PGRST301', message: 'Anonymous RPC access denied' });
          return;
        }
        const rpcRes = handleRpcCall(fnName, body, auth, state);
        reqEntry.status = rpcRes.status;
        sendJson(res, rpcRes.status, rpcRes.body);
        return;
      }

      // PostgREST table endpoint
      if (pathname.startsWith('/rest/v1/')) {
        const table = pathname.slice('/rest/v1/'.length).replace(/\/+$/, '');
        if (!KNOWN_TABLES.has(table)) {
          reqEntry.status = 404;
          sendJson(res, 404, {
            code: 'PGRST205',
            details: null,
            hint: null,
            message: `Could not find the table 'public.${table}' in the schema cache`,
          });
          return;
        }

        if (auth.mode === 'anon') {
          reqEntry.status = 401;
          sendJson(res, 401, {
            code: 'PGRST301',
            message: 'JWT missing or invalid: anonymous access denied by RLS (TO authenticated)',
          });
          return;
        }

        const acceptHeader = String(req.headers['accept'] || '');
        const preferHeader = String(req.headers['prefer'] || '');
        const wantsSingle = acceptHeader.includes('application/vnd.pgrst.object+json');
        const wantsCountExact = preferHeader.includes('count=exact');
        const wantsMinimal = preferHeader.includes('return=minimal');
        const selectSpec = parseSelectSpec(urlObj.searchParams.get('select') || '*');

        if (req.method === 'GET' || req.method === 'HEAD') {
          const rlsRows = (state.tables[table] || []).filter((r) =>
            rowBelongsToTenant(table, r, auth, state)
          );
          const filtered = applyQueryFilters(rlsRows, urlObj.searchParams);
          const totalCount = filtered.length;

          let offset = Number(urlObj.searchParams.get('offset') || 0);
          let limit = urlObj.searchParams.has('limit') ? Number(urlObj.searchParams.get('limit')) : null;
          const rangeHeader = req.headers['range'];
          if (typeof rangeHeader === 'string' && /^\d+-\d+$/.test(rangeHeader)) {
            const [startStr, endStr] = rangeHeader.split('-');
            offset = Number(startStr);
            limit = Number(endStr) - offset + 1;
          }

          const sliced = limit !== null ? filtered.slice(offset, offset + limit) : filtered.slice(offset);
          const projected = sliced.map((r) => projectRow(table, r, selectSpec, auth, state));

          const headers = {};
          if (wantsCountExact) {
            headers['Content-Range'] =
              totalCount === 0
                ? '*/0'
                : `${offset}-${Math.max(offset, offset + projected.length - 1)}/${totalCount}`;
          }

          if (req.method === 'HEAD') {
            sendEmpty(res, 200, headers);
            return;
          }

          if (wantsSingle) {
            if (projected.length !== 1) {
              reqEntry.status = 406;
              sendJson(res, 406, {
                code: 'PGRST116',
                details: `The result contains ${projected.length} rows`,
                hint: null,
                message: 'JSON object requested, multiple (or no) rows returned',
              });
              return;
            }
            sendJson(res, 200, projected[0], headers);
            return;
          }

          sendJson(res, 200, projected, headers);
          return;
        }

        if (req.method === 'POST') {
          const inputRows = Array.isArray(body) ? body : [body];
          const inserted = [];
          const nowIso = new Date().toISOString();

          for (const rawRow of inputRows) {
            const row = structuredClone(rawRow || {});
            if (auth.mode === 'authenticated') {
              if (row.empresa_id && row.empresa_id !== auth.tenantId) {
                reqEntry.status = 403;
                sendJson(res, 403, {
                  code: '42501',
                  message: 'new row violates row-level security policy for table "' + table + '"',
                });
                return;
              }
              if (
                table !== 'empresas' &&
                table !== 'empresa_usuarios' &&
                !CHILD_PARENT_MAP[table] &&
                !row.empresa_id
              ) {
                row.empresa_id = auth.tenantId;
              }
            }

            if (row.id === undefined || row.id === null) {
              row.id = generateIdForTable(table, state);
            }
            if (!row.created_at) row.created_at = nowIso;
            if (!row.updated_at) row.updated_at = nowIso;

            if (table === 'cotizaciones' && (!row.consecutivo || String(row.consecutivo).trim() === '')) {
              row.consecutivo = nextCotizacionConsecutivo(row.empresa_id, row.fecha_emision || row.created_at, state);
            }
            if (table === 'alquileres' && (row.consecutivo === undefined || row.consecutivo === null)) {
              row.consecutivo = nextAlquilerConsecutivo(row.empresa_id, state);
            }

            // Unique constraint enforcement
            if (table === 'cotizaciones' && row.consecutivo) {
              const dup = state.tables.cotizaciones.some(
                (c) => c.empresa_id === row.empresa_id && c.consecutivo === row.consecutivo
              );
              if (dup) {
                reqEntry.status = 409;
                sendJson(res, 409, {
                  code: '23505',
                  message: `duplicate key value violates unique constraint "cotizaciones_empresa_consecutivo_key"`,
                });
                return;
              }
            }

            if (table === 'subcontrataciones' && row.consecutivo) {
              const dup = state.tables.subcontrataciones.some(
                (s) => s.empresa_id === row.empresa_id && s.consecutivo === row.consecutivo
              );
              if (dup) {
                reqEntry.status = 409;
                sendJson(res, 409, {
                  code: '23505',
                  message: `duplicate key value violates unique constraint "subcontrataciones_consecutivo_key"`,
                });
                return;
              }
            }

            state.tables[table].push(row);
            inserted.push(projectRow(table, row, selectSpec, auth, state));
          }

          if (wantsMinimal) {
            reqEntry.status = 201;
            sendEmpty(res, 201);
            return;
          }

          if (wantsSingle) {
            if (inserted.length !== 1) {
              reqEntry.status = 406;
              sendJson(res, 406, { code: 'PGRST116', details: `The result contains ${inserted.length} rows` });
              return;
            }
            reqEntry.status = 201;
            sendJson(res, 201, inserted[0]);
            return;
          }

          reqEntry.status = 201;
          sendJson(res, 201, inserted);
          return;
        }

        if (req.method === 'PATCH') {
          const rlsRows = (state.tables[table] || []).filter((r) =>
            rowBelongsToTenant(table, r, auth, state)
          );
          const matched = applyQueryFilters(rlsRows, urlObj.searchParams);
          const patchData = body && typeof body === 'object' ? body : {};
          const updated = [];

          for (const row of matched) {
            Object.assign(row, patchData);
            updated.push(projectRow(table, row, selectSpec, auth, state));
          }

          if (wantsMinimal) {
            reqEntry.status = 204;
            sendEmpty(res, 204);
            return;
          }
          if (wantsSingle) {
            if (updated.length !== 1) {
              reqEntry.status = 406;
              sendJson(res, 406, { code: 'PGRST116', details: `The result contains ${updated.length} rows` });
              return;
            }
            sendJson(res, 200, updated[0]);
            return;
          }
          sendJson(res, 200, updated);
          return;
        }

        if (req.method === 'DELETE') {
          const rlsRows = (state.tables[table] || []).filter((r) =>
            rowBelongsToTenant(table, r, auth, state)
          );
          const matched = applyQueryFilters(rlsRows, urlObj.searchParams);
          const matchedSet = new Set(matched);
          state.tables[table] = (state.tables[table] || []).filter((r) => !matchedSet.has(r));

          if (wantsMinimal) {
            reqEntry.status = 204;
            sendEmpty(res, 204);
            return;
          }
          const projected = matched.map((r) => projectRow(table, r, selectSpec, auth, state));
          if (wantsSingle) {
            if (projected.length !== 1) {
              reqEntry.status = 406;
              sendJson(res, 406, { code: 'PGRST116', details: `The result contains ${projected.length} rows` });
              return;
            }
            sendJson(res, 200, projected[0]);
            return;
          }
          sendJson(res, 200, projected);
          return;
        }
      }

      sendJson(res, 404, { error: 'Not found', path: pathname });
    } catch (err) {
      sendJson(res, 500, { error: err?.message || 'Mock Supabase internal error' });
    }
  });

  // Minimal RFC 6455 WebSocket handler for Supabase Realtime (/realtime/v1/websocket)
  server.on('upgrade', (req, socket) => {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }
    const accept = crypto
      .createHash('sha1')
      .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest('base64');

    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '',
        '',
      ].join('\r\n')
    );

    let buffer = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const { frames, remaining } = decodeWsFrames(buffer);
      buffer = remaining;

      for (const frame of frames) {
        if (frame.opcode === 0x08) {
          socket.end();
          return;
        }
        if (frame.opcode === 0x09) {
          // Pong
          socket.write(Buffer.from([0x8a, 0x00]));
          continue;
        }
        if (frame.opcode === 0x01) {
          try {
            const msg = JSON.parse(frame.payload.toString('utf8'));
            if (msg && msg.event) {
              const reply = JSON.stringify({
                event: 'phx_reply',
                topic: msg.topic || 'phoenix',
                ref: msg.ref ?? null,
                payload: { status: 'ok', response: {} },
              });
              socket.write(encodeWsTextFrame(reply));
            }
          } catch {
            // Ignore malformed client frame
          }
        }
      }
    });

    socket.on('error', () => {
      socket.destroy();
    });
  });

  return {
    server,
    start() {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          resolve({ port, host, url: `http://${host}:${port}` });
        });
      });
    },
    stop() {
      return new Promise((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}

// Standalone CLI execution
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const port = Number(process.env.E2E_MOCK_SUPABASE_PORT || 54329);
  const host = process.env.E2E_MOCK_SUPABASE_HOST || '127.0.0.1';
  const mock = createMockSupabaseServer({ port, host });
  mock.start().then((info) => {
    console.log(`[MockSupabaseServer] Listening on ${info.url}`);
  });
  const shutdown = async () => {
    await mock.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
