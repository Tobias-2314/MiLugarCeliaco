// Servidor local mínimo para ver la web en http://localhost:8080 (sin dependencias).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const RAIZ = new URL('./dist/', import.meta.url).pathname;
const PUERTO = Number(process.env.PORT) || 8080;
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

function resolverRuta(url) {
  const ruta = decodeURIComponent(new URL(url, 'http://x').pathname);
  const limpia = normalize(ruta).replace(/^(\.\.[/\\])+/, '');
  if (limpia.endsWith('/')) return join(RAIZ, limpia, 'index.html');
  return extname(limpia) ? join(RAIZ, limpia) : join(RAIZ, `${limpia}.html`);
}

createServer(async (req, res) => {
  try {
    const archivo = resolverRuta(req.url);
    if (!archivo.startsWith(RAIZ)) throw new Error('fuera de dist');
    const datos = await readFile(archivo);
    res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] ?? 'application/octet-stream' });
    res.end(datos);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('No encontrado');
  }
}).listen(PUERTO, () => console.log(`Web en http://localhost:${PUERTO}`));
