const fs = require('fs');

const raw = fs.readFileSync('scratch/raw_data.txt', 'utf8');

const [clientesRaw, itemsRaw] = raw.split('Items:');

const clientesLines = clientesRaw.replace('Clientes:\n', '').trim().split('\n');
const clientesHeaders = clientesLines[0].split('\t').map(h => h.trim());
let clientesSql = "-- INSERT CLIENTES\nINSERT INTO public.clientes (nit_cedula, nombre, telefono, email, direccion, activo, nivel_riesgo) VALUES\n";
const clientesValues = [];

for (let i = 1; i < clientesLines.length; i++) {
    const cols = clientesLines[i].split('\t').map(c => c.trim().replace(/'/g, "''"));
    if (cols.length < 5) continue;
    const nit = cols[2];
    const nombre = cols[3];
    const tel = cols[4] || '';
    const email = cols[5] || '';
    const dir = cols[6] + (cols[7] ? ' ' + cols[7] : '');
    clientesValues.push(`('${nit}', '${nombre}', '${tel}', '${email}', '${dir}', true, 'Bajo')`);
}
clientesSql += clientesValues.join(',\n') + ';\n\n';

const itemsLines = itemsRaw.trim().split('\n');
let itemsSql = "-- INSERT ITEMS\nINSERT INTO public.items (nombre, tarifa_diaria, stock_total, stock_disponible, activo) VALUES\n";
let equiposSql = "-- INSERT EQUIPOS\nINSERT INTO public.equipos (sku, nombre, categoria, estado, peso_gramos) VALUES\n";
const itemsValues = [];
const equiposValues = [];

for (let i = 1; i < itemsLines.length; i++) {
    const cols = itemsLines[i].split('\t').map(c => c.trim().replace(/'/g, "''"));
    if (cols.length < 5) continue;
    
    // item_id	codigo_interno	nombre_item	categoria	descripcion	tarifa_diaria	es_kit	kit_parent_id	disponible	estado_fisico
    const sku = cols[1];
    const nombre = cols[2];
    const cat = cols[3] || 'Otros';
    const desc = cols[4] || '';
    const tarifa = cols[5] || '0';
    const disponibleStr = cols[8] || 'TRUE';
    const activo = disponibleStr.toUpperCase() === 'TRUE';
    
    itemsValues.push(`('${nombre}', ${tarifa}, 10, 10, ${activo})`);
    equiposValues.push(`('${sku}', '${nombre}', '${cat}', 'Disponible', 1000)`);
}

itemsSql += itemsValues.join(',\n') + ';\n\n';
equiposSql += equiposValues.join(',\n') + ';\n\n';

// Write both formats so the user can use the one that matches their schema
const finalSql = clientesSql + "-- SI USAS LA TABLA ITEMS (NUEVO SCHEMA):\n" + itemsSql + "-- SI USAS LA TABLA EQUIPOS (VIEJO SCHEMA):\n" + equiposSql;

fs.writeFileSync('scratch/seed_user.sql', finalSql);
console.log("Generado scratch/seed_user.sql");
