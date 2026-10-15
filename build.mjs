// Genera la web estática en dist/ a partir de contenido.json y public/.
// Uso: node build.mjs
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';

const contenido = JSON.parse(await readFile(new URL('./contenido.json', import.meta.url), 'utf8'));
const { negocio: n, enlaces, aviso, quienesSomos, queHacemos, negocios, dondeEstamos, titular } = contenido;

const anio = new Date().getFullYear();
const tel = `tel:${n.telefonoInternacional}`;
const direccionCompleta = `${n.calle}, ${n.codigoPostal} ${n.localidad}, ${n.provincia}`;
const mapsComoLlegar = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${n.nombre}, ${direccionCompleta}`)}`;
const resenasFallback = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${n.nombre} ${n.localidad}`)}`;
const resenasUrl = enlaces.resenasGoogle || resenasFallback;
const whatsappUrl = `https://wa.me/${n.telefonoInternacional.replace('+', '')}`;

const escapar = (valor) =>
  String(valor).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Escapa y resalta en amarillo cualquier marcador [COMPLETAR: ...]
const texto = (valor) =>
  escapar(valor).replace(/\[COMPLETAR[^\]]*\]/g, (m) => `<span class="todo">${m}</span>`);

const datosEstructurados = {
  '@context': 'https://schema.org',
  '@type': 'Bakery',
  name: n.nombre,
  description: n.descripcionSeo,
  url: `${n.dominio}/`,
  image: `${n.dominio}/img/og.png`,
  logo: `${n.dominio}/img/logo.jpeg`,
  telephone: n.telefonoInternacional,
  address: {
    '@type': 'PostalAddress',
    streetAddress: n.calle,
    postalCode: n.codigoPostal,
    addressLocality: n.localidad,
    addressRegion: n.provincia,
    addressCountry: n.pais,
  },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Entrada accesible para silla de ruedas', value: true },
  ],
};

function cabeceraHtml({ titulo, descripcion, canonico, indexar, jsonld }) {
  return `<!doctype html>
<html lang="es-ES">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapar(titulo)}</title>
  <meta name="description" content="${escapar(descripcion)}">
  <meta name="theme-color" content="#4d7a63">
  ${indexar ? '' : '<meta name="robots" content="noindex">'}
  <link rel="canonical" href="${canonico}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_ES">
  <meta property="og:site_name" content="${escapar(n.nombre)}">
  <meta property="og:title" content="${escapar(titulo)}">
  <meta property="og:description" content="${escapar(descripcion)}">
  <meta property="og:url" content="${canonico}">
  <meta property="og:image" content="${n.dominio}/img/og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  ${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>`;
}

function whatsappHtml() {
  if (!enlaces.whatsappActivo) return null;
  const nota = enlaces.whatsappConfirmado
    ? ''
    : '<p><small><span class="todo">[COMPLETAR: confirmar si usan WhatsApp; si no, poner whatsappActivo a false en contenido.json]</span></small></p>';
  return {
    boton: `<a class="btn wa" href="${whatsappUrl}" target="_blank" rel="noopener">Escribir por WhatsApp</a>`,
    nota,
  };
}

function tarjetasHtml() {
  return queHacemos.tarjetas
    .map(
      (t) => `
          <article class="tarjeta">
            <img src="/${t.foto}" alt="${escapar(t.alt)}" width="${t.ancho}" height="${t.alto}" loading="lazy" decoding="async">
            <div class="tarjeta-cuerpo">
              <h3>${escapar(t.titulo)}</h3>
              <p>${texto(t.texto)}</p>
            </div>
          </article>`,
    )
    .join('');
}

function pieHtml() {
  return `<footer>
    <div class="wrap">
      <p><strong>${escapar(n.nombre)}</strong><br>${escapar(direccionCompleta)}<br>Tel. <a href="${tel}">${escapar(n.telefonoVisible)}</a></p>
      <p>© ${anio} ${escapar(n.nombre)}</p>
      <ul>
        <li><a href="/aviso-legal">Aviso legal</a></li>
        <li><a href="/privacidad">Política de privacidad</a></li>
      </ul>
    </div>
  </footer>`;
}

function paginaInicio() {
  const wa = whatsappHtml();
  const resenasNota = enlaces.resenasGoogle
    ? ''
    : '<p><small><span class="todo">[COMPLETAR: enlace directo a la ficha de Google en contenido.json → enlaces.resenasGoogle]</span></small></p>';

  return `${cabeceraHtml({
    titulo: n.tituloSeo,
    descripcion: n.descripcionSeo,
    canonico: `${n.dominio}/`,
    indexar: true,
    jsonld: datosEstructurados,
  })}
<body>
  <a class="salto" href="#contenido">Saltar al contenido</a>

  <header class="hero">
    <div class="wrap">
      <img class="logo" src="/img/logo.jpeg" alt="Logotipo de ${escapar(n.nombre)}: pastelería argentina gluten free" width="450" height="444">
      <h1>${escapar(n.nombre)}</h1>
      <p class="lema">${escapar(n.fraseCorta)}</p>
      <p class="sublema">${escapar(n.subfrase)}</p>
      <div class="botones centro">
        <a class="btn" href="${tel}">Llamar</a>
      </div>
    </div>
  </header>

  <main id="contenido">
    <div class="wrap">
      <aside class="aviso" aria-labelledby="aviso-t">
        <h2 id="aviso-t">${escapar(aviso.titulo)}</h2>
        <p>${texto(aviso.texto)}</p>
        <p>${texto(aviso.invitacion)}</p>
        <div class="botones">
          <a class="btn" href="${tel}">Llamar al ${escapar(n.telefonoVisible)}</a>
        </div>
      </aside>
    </div>

    <section id="quienes-somos">
      <div class="wrap dos">
        <div>
          <h2>${escapar(quienesSomos.titulo)}</h2>
          ${quienesSomos.parrafos.map((p) => `<p>${texto(p)}</p>`).join('\n          ')}
        </div>
        <div class="foto" role="img" aria-label="Espacio reservado para una foto real del obrador"><span>${texto(quienesSomos.fotoPendiente)}</span></div>
      </div>
    </section>

    <section id="que-hacemos" class="alt">
      <div class="wrap">
        <h2>${escapar(queHacemos.titulo)}</h2>
        <p>${texto(queHacemos.intro)}</p>
        <p>${texto(queHacemos.confirmarAptoCeliacos)}</p>
        <div class="tarjetas">${tarjetasHtml()}
        </div>
      </div>
    </section>

    <section id="negocios">
      <div class="wrap">
        <h2>${escapar(negocios.titulo)}</h2>
        <p>${texto(negocios.texto)}</p>
        <p>${texto(negocios.condiciones)}</p>
        <div class="botones">
          <a class="btn" href="${tel}">${escapar(negocios.boton)}</a>
        </div>
      </div>
    </section>

    <section id="resenas" class="alt">
      <div class="wrap centro-texto">
        <h2>Reseñas</h2>
        <p>Lo que opinan nuestros clientes está en Google.</p>
        <div class="botones centro">
          <a class="btn sec" href="${resenasUrl}" target="_blank" rel="noopener">Ver nuestras reseñas en Google</a>
        </div>
        ${resenasNota}
      </div>
    </section>

    <section id="donde-estamos">
      <div class="wrap">
        <h2>${escapar(dondeEstamos.titulo)}</h2>
        <address>
          <strong>${escapar(n.nombre)}</strong><br>
          ${escapar(n.calle)}<br>
          ${escapar(`${n.codigoPostal} ${n.localidad}, ${n.provincia}`)}
        </address>
        <p class="tel"><a href="${tel}">${escapar(n.telefonoVisible)}</a></p>
        <p>${texto(dondeEstamos.horario)}</p>
        <ul class="insignias">
          <li><span aria-hidden="true">♿</span> ${escapar(dondeEstamos.insignias[0])}</li>
          <li><span aria-hidden="true">🏳️‍🌈</span> ${escapar(dondeEstamos.insignias[1])}</li>
        </ul>
        <div class="botones mt">
          <a class="btn" href="${mapsComoLlegar}" target="_blank" rel="noopener">Cómo llegar</a>
          <a class="btn" href="${tel}">Llamar</a>
          ${wa ? wa.boton : ''}
        </div>
        ${wa ? wa.nota : ''}
      </div>
    </section>
  </main>

  ${pieHtml()}

  <a class="llamar-fijo" href="${tel}" aria-label="Llamar al ${escapar(n.telefonoVisible)}">Llamar</a>
</body>
</html>
`;
}

function paginaLegal({ ruta, titulo, descripcion, cuerpo }) {
  return `${cabeceraHtml({
    titulo: `${titulo} · ${n.nombre}`,
    descripcion,
    canonico: `${n.dominio}/${ruta}`,
    indexar: false,
  })}
<body>
  <main class="wrap legal">
    <p><a href="/">← Volver al inicio</a></p>
    <h1>${escapar(titulo)}</h1>
    <p><span class="todo">[COMPLETAR: revisar este texto con el titular antes de publicar]</span></p>
${cuerpo}
  </main>
  ${pieHtml()}
</body>
</html>
`;
}

const dominioCorto = n.dominio.replace('https://', '');

const avisoLegal = paginaLegal({
  ruta: 'aviso-legal',
  titulo: 'Aviso legal',
  descripcion: `Aviso legal de ${dominioCorto}.`,
  cuerpo: `
    <h2>Datos del titular (Ley 34/2002, LSSI-CE)</h2>
    <ul>
      <li>Titular: ${texto(titular.nombre)}</li>
      <li>NIF/CIF: ${texto(titular.nif)}</li>
      <li>Domicilio: ${texto(titular.domicilio)}</li>
      <li>Correo electrónico: ${texto(titular.email)}</li>
      <li>Teléfono: ${escapar(n.telefonoVisible)}</li>
      <li>Datos registrales (si procede): ${texto(titular.datosRegistrales)}</li>
      <li>Establecimiento: ${escapar(direccionCompleta)}</li>
    </ul>

    <h2>Objeto</h2>
    <p>Este sitio web ofrece información sobre la actividad de ${escapar(n.nombre)}, panadería y obrador sin gluten.</p>

    <h2>Condiciones de uso</h2>
    <p>El acceso y uso de esta web es gratuito y atribuye la condición de usuario. El usuario se compromete a hacer un uso lícito de la web y de sus contenidos.</p>

    <h2>Propiedad intelectual</h2>
    <p>Los textos, imágenes, logotipo y demás contenidos pertenecen a su titular o se usan con autorización. No se permite su reproducción sin permiso.</p>

    <h2>Responsabilidad</h2>
    <p>Se procura que la información sea correcta y esté actualizada, pero puede cambiar sin previo aviso. Los enlaces a sitios de terceros (Google Maps, WhatsApp) se rigen por sus propias condiciones.</p>

    <h2>Legislación aplicable</h2>
    <p>Este aviso se rige por la legislación española.</p>`,
});

const privacidad = paginaLegal({
  ruta: 'privacidad',
  titulo: 'Política de privacidad',
  descripcion: `Política de privacidad de ${dominioCorto}.`,
  cuerpo: `
    <h2>Responsable</h2>
    <p>${texto(titular.nombre)}, NIF ${texto(titular.nif)}, ${texto(titular.domicilio)}. Contacto: ${texto(titular.email)}.</p>

    <h2>Qué datos tratamos</h2>
    <p>Esta web no tiene formularios, no usa cookies y no incorpora analítica ni herramientas de seguimiento. No recoge datos personales de quien la visita.</p>

    <h2>Contacto por teléfono o WhatsApp</h2>
    <p>Si nos llamas o escribes por teléfono o WhatsApp, usaremos tus datos únicamente para atender tu consulta. Al pulsar el botón de WhatsApp pasas a un servicio de terceros con su propia política de privacidad.</p>

    <h2>Servicios de terceros</h2>
    <p>Los enlaces a Google Maps y a WhatsApp abren servicios externos. La web se aloja en ${escapar(titular.alojamiento)}, que puede registrar datos técnicos de conexión (como la dirección IP) por motivos de seguridad y funcionamiento.</p>

    <h2>Tus derechos</h2>
    <p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo al contacto indicado. Si consideras que tus datos no se tratan correctamente, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener">www.aepd.es</a>).</p>`,
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${n.dominio}/</loc></url>
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${n.dominio}/sitemap.xml
`;

const dist = new URL('./dist/', import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(new URL('./public/', import.meta.url), dist, { recursive: true });

await Promise.all([
  writeFile(new URL('index.html', dist), paginaInicio()),
  writeFile(new URL('aviso-legal.html', dist), avisoLegal),
  writeFile(new URL('privacidad.html', dist), privacidad),
  writeFile(new URL('sitemap.xml', dist), sitemap),
  writeFile(new URL('robots.txt', dist), robots),
]);

console.log('Web generada en dist/');
