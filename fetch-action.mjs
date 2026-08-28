import https from 'https';
import http from 'http';

const url = 'https://alquileres-erp-nextjs-ruby.vercel.app/bodega';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    // Buscar el Action ID en el script
    // Usualmente Next.js inyecta chunks con los IDs
    const actionMatches = data.match(/actionIds:\{([^}]*)\}/);
    console.log('Action matches:', actionMatches ? actionMatches[1] : 'No matches found');
    
    // También buscar en los scripts parseables
    const matches2 = data.match(/[a-zA-Z0-9]{40,}/g);
    if(matches2) console.log('Potential hashes:', matches2.slice(0, 10));
  });
}).on('error', (err) => {
  console.error(err);
});
