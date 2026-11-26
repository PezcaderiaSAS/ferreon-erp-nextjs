import type { MockUserSeed } from '../helpers/mock-supabase';

export const TENANT_A_EMPRESA_ID = '11111111-1111-4111-8111-111111111111';
export const TENANT_B_EMPRESA_ID = '22222222-2222-4222-8222-222222222222';

export interface SyntheticTenantIdentity extends MockUserSeed {
  slug: string;
  empresaNombre: string;
}

export const TENANT_A: SyntheticTenantIdentity = {
  id: 'aaaa1111-1111-4111-8111-111111111111',
  email: 'admin@pezcaderia2022.test',
  password: 'E2E-Test-Password-A!',
  slug: 'pezcaderia-2022',
  empresaNombre: 'Pezcaderia 2022 Maquinaria SAS',
  user_metadata: {
    nombre: 'Admin Pezcaderia 2022',
    rol: 'ADMIN',
    empresa_id: TENANT_A_EMPRESA_ID,
    terminos_version: '1.0.0',
  },
  app_metadata: { provider: 'email', providers: ['email'] },
};

export const TENANT_B: SyntheticTenantIdentity = {
  id: 'bbbb2222-2222-4222-8222-222222222222',
  email: 'admin@aliadobga.test',
  password: 'E2E-Test-Password-B!',
  slug: 'aliado-bga',
  empresaNombre: 'Aliado BGA Equipos SAS',
  user_metadata: {
    nombre: 'Admin Aliado BGA',
    rol: 'ADMIN',
    empresa_id: TENANT_B_EMPRESA_ID,
    terminos_version: '1.0.0',
  },
  app_metadata: { provider: 'email', providers: ['email'] },
};

export const ULTRA_ADMIN: SyntheticTenantIdentity = {
  id: 'cccc3333-3333-4333-8333-333333333333',
  email: 'ultraadmin@alquileres.test',
  password: 'E2E-Test-Password-Ultra!',
  slug: 'pezcaderia-2022',
  empresaNombre: 'Pezcaderia 2022 Maquinaria SAS',
  user_metadata: {
    nombre: 'UltraAdmin Sistema',
    rol: 'ULTRAADMIN',
    empresa_id: TENANT_A_EMPRESA_ID,
    terminos_version: '1.0.0',
  },
  app_metadata: { provider: 'email', providers: ['email'] },
};

export const NO_EMPRESA_USER: SyntheticTenantIdentity = {
  id: 'dddd4444-4444-4444-8444-444444444444',
  email: 'sinempresa@alquileres.test',
  password: 'E2E-Test-Password-NoEmp!',
  slug: 'onboarding-pending',
  empresaNombre: 'Pendiente Onboarding',
  user_metadata: {
    nombre: 'Usuario Nuevo Onboarding',
    rol: 'OPERADOR',
    terminos_version: '1.0.0',
  },
  app_metadata: { provider: 'email', providers: ['email'] },
};
