const fs = require('fs');

const schema = fs.readFileSync('supabase/migrations/20260825_autoincremental_and_soft_delete.sql', 'utf8');
const raw = fs.readFileSync('scratch/raw_data.txt', 'utf8');

const [clientesRaw, itemsRaw] = raw.split('Items:');

const clientesLines = clientesRaw.replace('Clientes:\n', '').trim().split('\n');
let clientesSql = "\n\n-- ===========================\n-- SEED DATA\n-- ===========================\n\nINSERT INTO public.clientes (nit_cedula, nombre, telefono, email, direccion, estado) VALUES\n";
const clientesValues = [];
const seenNit = new Set();
for (let i = 1; i < clientesLines.length; i++) {
    const cols = clientesLines[i].split('\t').map(c => c.trim().replace(/'/g, "''"));
    if (cols.length < 5) continue;
    let nit = cols[2];
    const nombre = cols[3];
    const tel = cols[4] || '';
    const email = cols[5] || '';
    const dir = cols[6] + (cols[7] ? ' ' + cols[7] : '');
    
    // Deduplicate
    if (seenNit.has(nit)) {
        nit = nit + '-' + i; // Append row index to make it unique
    }
    seenNit.add(nit);
    
    clientesValues.push(`('${nit}', '${nombre}', '${tel}', '${email}', '${dir}', 'Activo')`);
}
clientesSql += clientesValues.join(',\n') + ';\n\n';

const itemsLines = itemsRaw.trim().split('\n');
let equiposSql = "INSERT INTO public.equipos (codigo, nombre, categoria, tarifa_diaria, stock_total, stock_disponible, stock_en_obra, stock_mantenimiento, estado) VALUES\n";
const equiposValues = [];
const seenCodigo = new Set();
for (let i = 1; i < itemsLines.length; i++) {
    const cols = itemsLines[i].split('\t').map(c => c.trim().replace(/'/g, "''"));
    if (cols.length < 5) continue;
    
    let codigo = cols[1];
    const nombre = cols[2];
    const cat = cols[3] || 'Otros';
    const tarifa = cols[5] || '0';
    const disponibleStr = cols[8] || 'TRUE';
    const activo = disponibleStr.toUpperCase() === 'TRUE';
    const estado = activo ? 'Activo' : 'Inactivo';
    
    // Deduplicate
    if (seenCodigo.has(codigo)) {
        codigo = codigo + '-' + i;
    }
    seenCodigo.add(codigo);
    
    equiposValues.push(`('${codigo}', '${nombre}', '${cat}', ${tarifa}, 10, 10, 0, 0, '${estado}')`);
}
equiposSql += equiposValues.join(',\n') + ';\n';

fs.writeFileSync('supabase/setup_completo.sql', schema + clientesSql + equiposSql);
console.log('Fixed duplicates in setup_completo.sql');
