const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = [
    'supabase/migrations/20261104130000_p0_security_seal_rls_hotfix.sql',
    'supabase/migrations/20261104140000_p1_tenancy_and_referential_integrity.sql',
    'supabase/migrations/20261104150000_p1_reconciliacion_financiera_ciclo_alquileres.sql',
    'supabase/migrations/20261104160000_p2_dbre_partial_indexes_and_cleanup.sql',
    'supabase/migrations/20261104170000_p2_cop_integer_currency_check_constraints.sql'
];

const header = `-- ============================================================================
-- SCRIPT CONSOLIDADO DE MIGRACIONES ESTRUCTURALES — SUPABASE CLUSTER
-- Proyecto: Alquileres System (FerreOn ERP)
-- Cluster ID: eqruvswlpsttuyuglwts (us-west-2)
-- Fases: P0, P1, P2 (Noviembre 2026)
-- Instrucciones: Ejecutar este script completo en el SQL Editor de Supabase Cloud.
-- ============================================================================

BEGIN;
`;

const footer = `
-- ============================================================================
-- REGISTRO DE MIGRACIONES EN SCHEMA_MIGRATIONS
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations') THEN
        INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
        VALUES 
            ('20261104130000', NULL, 'p0_security_seal_rls_hotfix'),
            ('20261104140000', NULL, 'p1_tenancy_and_referential_integrity'),
            ('20261104150000', NULL, 'p1_reconciliacion_financiera_ciclo_alquileres'),
            ('20261104160000', NULL, 'p2_dbre_partial_indexes_and_cleanup'),
            ('20261104170000', NULL, 'p2_cop_integer_currency_check_constraints')
        ON CONFLICT (version) DO NOTHING;
    END IF;
END $$;

COMMIT;
`;

let output = header;

for (const relPath of files) {
    const fullPath = path.resolve(relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    output += `\n-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n`;
    output += `-- ARCHIVO: ${relPath}\n`;
    output += `-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n\n`;
    output += content + '\n';
}

output += footer;

const targetPath = path.resolve('supabase/migrations/CONSOLIDADO_EJECUCION_SUPABASE_CLOUD.sql');
fs.writeFileSync(targetPath, output, 'utf8');
console.log(`Consolidado escrito en: ${targetPath} (${output.length} caracteres)`);

// Copiar al portapapeles en Windows
try {
    execSync('powershell -NoProfile -Command "Get-Content -Raw -Encoding utf8 supabase/migrations/CONSOLIDADO_EJECUCION_SUPABASE_CLOUD.sql | Set-Clipboard"');
    console.log('Copiado exitosamente al portapapeles de Windows vía Set-Clipboard.');
} catch (e) {
    console.error('No se pudo copiar automáticamente al portapapeles:', e.message);
}
