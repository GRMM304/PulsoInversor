// Pulso Inversor · Noticias y blog (www.pulsoinversor.cl/noticias)
//   · /noticias               lista (filtro ?cat=pulso|asociadas|blog), sobre la plantilla noticias.html de build.py
//   · /noticias/<slug>        una noticia, sobre la plantilla noticia-plantilla.html (título, Open Graph y JSON-LD propios)
//   · /noticias/medios/<id>   fotos y video (con Range para que el video se pueda adelantar en todos los navegadores)
// Se publican desde el portal de asesores (/asesores?v=noticias, solo administradores).
// Cada noticia: hasta 3 fotos, un video vertical opcional con su texto al lado y el texto de la noticia.
// Los datos van en D1 (tablas noticias y noticias_medios) y los archivos en Workers KV (NOTICIAS_KV), en partes de 5 MB.

import { esc, SITIO, WHATSAPP } from './comun.js';

export const CATEGORIAS_NOTICIAS = [
  { k: 'pulso', t: 'Pulso Inversor' },
  { k: 'asociadas', t: 'Empresas asociadas' },
  { k: 'blog', t: 'Blog' },
];
const nombreCat = (k) => (CATEGORIAS_NOTICIAS.find((c) => c.k === k) || CATEGORIAS_NOTICIAS[0]).t;
export const MAX_FOTOS = 3;
const MAX_FOTO_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
const PARTE = 5 * 1024 * 1024;
const MIMES_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
const MIMES_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm'];

let esquemaListo = false;
export async function esquema(env) {
  if (esquemaListo) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS noticias (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE, titulo TEXT, categoria TEXT, fecha TEXT, bajada TEXT, cuerpo TEXT, video_texto TEXT, fuente_url TEXT, publicada INTEGER DEFAULT 0, creado TEXT, actualizado TEXT, autor TEXT)').run();
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS noticias_medios (id INTEGER PRIMARY KEY AUTOINCREMENT, noticia_id INTEGER, tipo TEXT, orden INTEGER, mime TEXT, bytes INTEGER, parte INTEGER, partes INTEGER, subidas INTEGER DEFAULT 0, ancho INTEGER, alto INTEGER, url TEXT, creado TEXT)').run();
  esquemaListo = true;
}

/* ---------- Utilidades ---------- */
const fechaLarga = (f) => (f ? new Date(f + 'T12:00:00Z').toLocaleDateString('es-CL', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }) : '');
const src = (m) => m.url || '/noticias/medios/' + m.id;
const completo = (m) => m.url || m.subidas >= m.partes;
// Texto con párrafos (línea en blanco), saltos de línea, **negrita** y enlaces.
export function parrafos(txt) {
  return String(txt || '').replace(/\r/g, '').trim().split(/\n\s*\n/).filter((p) => p.trim()).map((p) => '<p>' + esc(p.trim())
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br>') + '</p>').join('');
}
const textoPlano = (t, n) => { const s = String(t || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s\S*$/, '') + '…' : s; };
const reemplazarMeta = (t, patron, valor) => t.replace(patron, (_, a) => a + valor);

async function mediosDe(env, ids, todos = false) {
  const porNoticia = {};
  if (!ids.length) return porNoticia;
  const { results } = await env.DB.prepare(`SELECT * FROM noticias_medios WHERE noticia_id IN (${ids.map(() => '?').join(',')}) ORDER BY orden, id`).bind(...ids).all();
  for (const m of results || []) if (todos || completo(m)) (porNoticia[m.noticia_id] = porNoticia[m.noticia_id] || []).push(m);
  return porNoticia;
}
async function plantilla(env, url, ruta) {
  const r = await env.ASSETS.fetch(new Request(new URL(ruta, url)));
  return r.text();
}
async function noEncontrada(env, url) {
  const r = await env.ASSETS.fetch(new Request(new URL('/404', url)));
  return new Response(r.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' } });
}
const respuestaHtml = (t, extra = {}) => new Response(t, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', ...extra } });

/* ---------- Lista ---------- */
function tarjeta(n, ms, destacada) {
  const fotos = ms.filter((m) => m.tipo === 'foto'), video = ms.find((m) => m.tipo === 'video');
  const portada = fotos[0]
    ? `<img src="${src(fotos[0])}" alt="" width="${fotos[0].ancho || 1200}" height="${fotos[0].alto || 675}" loading="${destacada ? 'eager' : 'lazy'}" decoding="async">`
    : video ? `<video src="${src(video)}#t=0.5" muted playsinline preload="metadata" aria-hidden="true" tabindex="-1"></video>`
      : '<div class="nt-sinfoto" aria-hidden="true"><img src="/assets/img/logo-pulso-footer.png" alt="" width="760" height="234"></div>';
  return `<article class="nt-card${destacada ? ' nt-dest' : ''}"><a class="nt-card-a" href="/noticias/${esc(n.slug)}">
<div class="nt-card-media">${portada}${video ? '<span class="nt-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>Video</span>' : ''}</div>
<div class="nt-card-body"><p class="nt-meta"><span class="nt-cat">${esc(nombreCat(n.categoria))}</span><time datetime="${esc(n.fecha)}">${esc(fechaLarga(n.fecha))}</time></p>
<h2>${esc(n.titulo)}</h2><p class="nt-bajada">${esc(n.bajada)}</p><span class="nt-mas">Leer más <span aria-hidden="true">→</span></span></div></a></article>`;
}

export async function paginaNoticias(request, env, url) {
  await esquema(env);
  const cat = (CATEGORIAS_NOTICIAS.find((c) => c.k === url.searchParams.get('cat')) || {}).k || '';
  const { results } = await env.DB.prepare(`SELECT * FROM noticias WHERE publicada = 1${cat ? ' AND categoria = ?' : ''} ORDER BY fecha DESC, id DESC LIMIT 60`).bind(...(cat ? [cat] : [])).all();
  const lista = results || [];
  const medios = await mediosDe(env, lista.map((n) => n.id));
  const chips = [{ k: '', t: 'Todas' }, ...CATEGORIAS_NOTICIAS].map((c) => `<a class="nt-chip${c.k === cat ? ' on' : ''}" href="/noticias${c.k ? '?cat=' + c.k : ''}"${c.k === cat ? ' aria-current="page"' : ''}>${esc(c.t)}</a>`).join('');
  const contenido = `<nav class="nt-chips" aria-label="Filtrar por tema">${chips}</nav>`
    + (lista.length ? `<div class="nt-grid">${lista.map((n, i) => tarjeta(n, medios[n.id] || [], i === 0 && !cat)).join('')}</div>`
      : `<p class="nt-vacio">${cat ? 'Todavía no hay publicaciones en este tema.' : 'Pronto publicaremos novedades aquí.'}</p>`);
  let t = (await plantilla(env, url, '/noticias')).replace('<!--NOTICIAS-->', contenido);
  // Las vistas filtradas no compiten en Google con /noticias.
  if (cat) t = t.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, follow">');
  return respuestaHtml(t);
}

/* ---------- Una noticia ---------- */
function galeria(fotos, titulo) {
  if (!fotos.length) return '';
  const img = (m, i) => `<a href="${src(m)}" target="_blank" rel="noopener" aria-label="Ver foto ${i + 1} en tamaño completo"><img src="${src(m)}" alt="${esc(titulo)}, foto ${i + 1}" width="${m.ancho || 1200}" height="${m.alto || 675}" ${i ? 'loading="lazy" ' : ''}decoding="async"></a>`;
  return `<div class="nt-fotos nt-f${fotos.length}">${fotos.map(img).join('')}</div>`;
}

export async function paginaNoticia(request, env, url, slug) {
  await esquema(env);
  const n = await env.DB.prepare('SELECT * FROM noticias WHERE slug = ?').bind(slug).first();
  let previa = false;
  if (n && !n.publicada) {
    const { sesionAsesor } = await import('./asesores.js');
    const yo = await sesionAsesor(request, env);
    previa = !!(yo && yo.rol === 'admin');
    if (!previa) return noEncontrada(env, url);
  }
  if (!n) return noEncontrada(env, url);
  const ms = (await mediosDe(env, [n.id]))[n.id] || [];
  const fotos = ms.filter((m) => m.tipo === 'foto').slice(0, MAX_FOTOS), video = ms.find((m) => m.tipo === 'video');
  const enlace = SITIO + '/noticias/' + n.slug;
  const waTxt = `Hola, leí la noticia "${n.titulo}" en el sitio de Pulso Inversor y quiero conversar con un asesor.`;
  const compartirWa = 'https://wa.me/?text=' + encodeURIComponent(n.titulo + ' ' + enlace);
  const compartirLi = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(enlace);
  const { results: otras } = await env.DB.prepare('SELECT * FROM noticias WHERE publicada = 1 AND id != ? ORDER BY fecha DESC, id DESC LIMIT 3').bind(n.id).all();
  const mOtras = await mediosDe(env, (otras || []).map((x) => x.id));
  const cuerpo = `${previa ? '<div class="nt-previa">Vista previa: esta noticia es un borrador y solo la ven los administradores.</div>' : ''}
<section class="page-hero nt-hero"><div class="container nt-angosto">
<div class="breadcrumb"><a href="/">Inicio</a> / <a href="/noticias">Noticias</a></div>
<p class="nt-meta nt-meta-hero"><span class="nt-cat">${esc(nombreCat(n.categoria))}</span><time datetime="${esc(n.fecha)}">${esc(fechaLarga(n.fecha))}</time></p>
<h1>${esc(n.titulo)}</h1><p>${esc(n.bajada)}</p></div></section>
<section class="section nt-articulo"><div class="container nt-angosto">
${galeria(fotos, n.titulo)}
<div class="nt-texto">${parrafos(n.cuerpo)}</div>
${video ? `<div class="nt-video"><div class="nt-video-marco"><video src="${src(video)}#t=0.1" controls playsinline preload="metadata" width="${video.ancho || 1080}" height="${video.alto || 1920}"></video></div><div class="nt-video-texto">${parrafos(n.video_texto)}</div></div>` : ''}
${n.fuente_url ? `<p class="nt-fuente"><a href="${esc(n.fuente_url)}" target="_blank" rel="noopener">Ver la publicación original <span aria-hidden="true">↗</span></a></p>` : ''}
<div class="nt-compartir"><span>Compartir</span>
<a class="nt-sh" href="${esc(compartirWa)}" target="_blank" rel="noopener">WhatsApp</a>
<a class="nt-sh" href="${esc(compartirLi)}" target="_blank" rel="noopener">LinkedIn</a>
<button class="nt-sh" type="button" data-copiar-enlace="${esc(enlace)}">Copiar enlace</button></div>
</div></section>
${(otras || []).length ? `<section class="section section-soft"><div class="container"><h2>Más noticias</h2><div class="nt-grid nt-grid-3">${otras.map((x) => tarjeta(x, mOtras[x.id] || [], false)).join('')}</div>
<p style="margin-top:26px"><a class="btn btn-outline" href="/noticias">Ver todas las noticias</a></p></div></section>` : ''}
<section class="section"><div class="container"><div class="cta-band"><div><h2>¿Quieres saber cómo invertir con Pulso Inversor?</h2><p>Escríbenos y te responde una persona del equipo.</p></div>
<a class="btn btn-primary" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(waTxt)}" target="_blank" rel="noopener">Conversar por WhatsApp</a></div></div></section>
<script>document.addEventListener('click',function(e){var b=e.target.closest('[data-copiar-enlace]');if(!b)return;var t=b.getAttribute('data-copiar-enlace'),o=b.textContent;function ok(){b.textContent='¡Copiado!';setTimeout(function(){b.textContent=o},1600)}if(navigator.clipboard)navigator.clipboard.writeText(t).then(ok,function(){prompt('Copia el enlace:',t)});else prompt('Copia el enlace:',t)});</script>`;

  const titulo = esc(n.titulo), desc = esc(textoPlano(n.bajada || n.cuerpo, 160));
  const imagen = fotos[0] ? SITIO + src(fotos[0]) : null;
  let t = (await plantilla(env, url, '/noticia-plantilla')).replace('<!--NOTICIA-->', cuerpo);
  t = t.replace(/<title>[^<]*<\/title>/, `<title>${titulo} · Pulso Inversor</title>`);
  t = reemplazarMeta(t, /(<meta name="description" content=")[^"]*/, desc);
  t = t.replace(/<meta name="robots" content="[^"]*">/, `<meta name="robots" content="${previa ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1'}">`);
  t = reemplazarMeta(t, /(<link rel="canonical" href=")[^"]*/, enlace);
  t = reemplazarMeta(t, /(<meta property="og:url" content=")[^"]*/, enlace);
  t = t.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">');
  for (const k of ['og:title', 'twitter:title']) t = reemplazarMeta(t, new RegExp(`(<meta (?:property|name)="${k}" content=")[^"]*`), titulo);
  for (const k of ['og:description', 'twitter:description']) t = reemplazarMeta(t, new RegExp(`(<meta (?:property|name)="${k}" content=")[^"]*`), desc);
  if (imagen) {
    for (const k of ['og:image', 'twitter:image']) t = reemplazarMeta(t, new RegExp(`(<meta (?:property|name)="${k}" content=")[^"]*`), imagen);
    t = reemplazarMeta(t, /(<meta property="og:image:width" content=")[^"]*/, String(fotos[0].ancho || 1200));
    t = reemplazarMeta(t, /(<meta property="og:image:height" content=")[^"]*/, String(fotos[0].alto || 675));
    t = reemplazarMeta(t, /(<meta property="og:image:alt" content=")[^"]*/, titulo);
  }
  const ld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': n.categoria === 'blog' ? 'BlogPosting' : 'NewsArticle', '@id': enlace + '#articulo', headline: n.titulo.slice(0, 110), description: textoPlano(n.bajada, 300),
        datePublished: n.fecha, dateModified: (n.actualizado || n.creado || n.fecha).slice(0, 10), inLanguage: 'es-CL', mainEntityOfPage: enlace,
        ...(imagen ? { image: fotos.map((m) => SITIO + src(m)) } : {}),
        author: { '@id': SITIO + '/#organizacion' }, publisher: { '@id': SITIO + '/#organizacion' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
        { '@type': 'ListItem', position: 2, name: 'Noticias', item: SITIO + '/noticias' },
        { '@type': 'ListItem', position: 3, name: n.titulo, item: enlace }] },
    ],
  };
  t = t.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>');
  return respuestaHtml(t, previa ? { 'x-robots-tag': 'noindex' } : {});
}

/* ---------- Fotos y video ---------- */
function streamRango(env, m, ini, fin) {
  let p = Math.floor(ini / m.parte);
  const ultima = Math.floor(fin / m.parte);
  return new ReadableStream({
    async pull(ctrl) {
      if (p > ultima) { ctrl.close(); return; }
      // cacheTtl: Cloudflare guarda la parte en el centro de datos más cercano; las siguientes lecturas no van a KV central.
      const buf = await env.NOTICIAS_KV.get(`medio/${m.id}/${p}`, { type: 'arrayBuffer', cacheTtl: m.publicada ? 31536000 : 60 });
      if (!buf) { ctrl.error(new Error('falta la parte ' + p)); return; }
      const base = p * m.parte, a = Math.max(ini - base, 0), b = Math.min(fin - base + 1, buf.byteLength);
      ctrl.enqueue(new Uint8Array(buf, a, b - a));
      p++;
    },
  });
}

export async function medioNoticia(request, env, url, ctx, id) {
  // Solo se leen las partes que cubren el rango pedido. No se arma el archivo completo en segundo plano:
  // con videos grandes, eso saturaba el Worker en cada petición del navegador.
  await esquema(env);
  const m = await env.DB.prepare('SELECT m.*, n.publicada FROM noticias_medios m JOIN noticias n ON n.id = m.noticia_id WHERE m.id = ?').bind(id).first();
  if (!m || !completo(m)) return new Response('No encontrado', { status: 404 });
  if (m.url) return Response.redirect(url.origin + m.url, 302);
  const cab = { 'content-type': m.mime, 'accept-ranges': 'bytes', 'cache-control': m.publicada ? 'public, max-age=31536000, immutable' : 'private, no-store' };
  const rango = request.headers.get('range');
  const r = rango && rango.match(/^bytes=(\d*)-(\d*)$/);
  if (r && (r[1] !== '' || r[2] !== '')) {
    let ini, fin;
    if (r[1] === '') { ini = Math.max(m.bytes - parseInt(r[2], 10), 0); fin = m.bytes - 1; }
    else { ini = parseInt(r[1], 10); fin = r[2] === '' ? m.bytes - 1 : Math.min(parseInt(r[2], 10), m.bytes - 1); }
    if (ini >= m.bytes || ini > fin) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${m.bytes}` } });
    return new Response(request.method === 'HEAD' ? null : streamRango(env, m, ini, fin), { status: 206, headers: { ...cab, 'content-range': `bytes ${ini}-${fin}/${m.bytes}`, 'content-length': String(fin - ini + 1) } });
  }
  return new Response(request.method === 'HEAD' ? null : streamRango(env, m, 0, m.bytes - 1), { headers: { ...cab, 'content-length': String(m.bytes) } });
}

// Agrega las noticias publicadas al sitemap.xml estático.
export async function sitemapConNoticias(env, url) {
  const r = await env.ASSETS.fetch(new Request(new URL('/sitemap.xml', url)));
  let t = await r.text();
  try {
    await esquema(env);
    const { results } = await env.DB.prepare('SELECT slug, fecha, actualizado FROM noticias WHERE publicada = 1 ORDER BY fecha DESC LIMIT 500').all();
    const extra = (results || []).map((n) => `  <url><loc>${SITIO}/noticias/${esc(n.slug)}</loc><lastmod>${esc((n.actualizado || n.fecha).slice(0, 10))}</lastmod><priority>0.6</priority></url>\n`).join('');
    t = t.replace('</urlset>', extra + '</urlset>');
  } catch (e) { console.error('sitemap', e); }
  return new Response(t, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

/* ---------- Administración (portal de asesores, solo administradores) ---------- */
const jsonR = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const slugDe = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '') || 'noticia';

async function slugUnico(env, titulo) {
  const base = slugDe(titulo) === 'medios' ? 'medios-1' : slugDe(titulo);
  for (let i = 1; i < 50; i++) {
    const s = i === 1 ? base : `${base}-${i}`;
    if (!(await env.DB.prepare('SELECT id FROM noticias WHERE slug = ?').bind(s).first())) return s;
  }
  return base + '-' + Date.now();
}

async function borrarMedio(env, m) {
  for (let n = 0; n < (m.partes || 0); n++) await env.NOTICIAS_KV.delete(`medio/${m.id}/${n}`).catch(() => {});
  await env.DB.prepare('DELETE FROM noticias_medios WHERE id = ?').bind(m.id).run();
}

async function guardar(request, env, yo) {
  const f = await request.formData();
  const v = (k, n) => String(f.get(k) || '').replace(/\r/g, '').trim().slice(0, n);
  const id = parseInt(f.get('id'), 10) || 0;
  const titulo = v('titulo', 140), bajada = v('bajada', 300), cuerpo = v('cuerpo', 20000), videoTexto = v('video_texto', 3000);
  const categoria = CATEGORIAS_NOTICIAS.some((c) => c.k === v('categoria', 20)) ? v('categoria', 20) : '';
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(v('fecha', 10)) ? v('fecha', 10) : '';
  const fuente = /^https:\/\/\S+$/i.test(v('fuente_url', 600)) ? v('fuente_url', 600) : '';
  const publicada = f.get('publicada') === '1' ? 1 : 0;
  if (!titulo || !bajada || !categoria || !fecha) return jsonR({ ok: false, error: 'Completa el título, la bajada, el tema y la fecha.' }, 400);
  const ahora = new Date().toISOString();
  let nid = id, slug;
  if (id) {
    const ex = await env.DB.prepare('SELECT slug FROM noticias WHERE id = ?').bind(id).first();
    if (!ex) return jsonR({ ok: false, error: 'La noticia ya no existe.' }, 404);
    slug = ex.slug;
    await env.DB.prepare('UPDATE noticias SET titulo = ?, categoria = ?, fecha = ?, bajada = ?, cuerpo = ?, video_texto = ?, fuente_url = ?, publicada = ?, actualizado = ? WHERE id = ?')
      .bind(titulo, categoria, fecha, bajada, cuerpo, videoTexto, fuente, publicada, ahora, id).run();
  } else {
    slug = await slugUnico(env, titulo);
    const r = await env.DB.prepare('INSERT INTO noticias (slug, titulo, categoria, fecha, bajada, cuerpo, video_texto, fuente_url, publicada, creado, actualizado, autor) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(slug, titulo, categoria, fecha, bajada, cuerpo, videoTexto, fuente, publicada, ahora, ahora, yo.nombre).run();
    nid = r.meta.last_row_id;
  }
  const quitar = f.getAll('quitar').map((x) => parseInt(x, 10)).filter(Boolean);
  if (quitar.length) {
    const { results } = await env.DB.prepare(`SELECT * FROM noticias_medios WHERE noticia_id = ? AND id IN (${quitar.map(() => '?').join(',')})`).bind(nid, ...quitar).all();
    for (const m of results || []) await borrarMedio(env, m);
  }
  return jsonR({ ok: true, id: nid, slug });
}

async function nuevoMedio(request, env) {
  const d = await request.json().catch(() => ({}));
  const nid = parseInt(d.noticia, 10), bytes = parseInt(d.bytes, 10), ancho = parseInt(d.ancho, 10) || 0, alto = parseInt(d.alto, 10) || 0;
  const tipo = d.tipo === 'video' ? 'video' : 'foto', mime = String(d.mime || '').toLowerCase();
  if (!(await env.DB.prepare('SELECT id FROM noticias WHERE id = ?').bind(nid).first())) return jsonR({ ok: false, error: 'La noticia no existe.' }, 404);
  if (!(bytes > 0)) return jsonR({ ok: false, error: 'Archivo vacío.' }, 400);
  const { results } = await env.DB.prepare('SELECT * FROM noticias_medios WHERE noticia_id = ? AND tipo = ?').bind(nid, tipo).all();
  // Subidas que quedaron a medias hace más de una hora: se limpian.
  const vivos = [];
  for (const m of results || []) { if (!completo(m) && Date.now() - Date.parse(m.creado) > 3600e3) await borrarMedio(env, m); else vivos.push(m); }
  if (tipo === 'foto') {
    if (!MIMES_FOTO.includes(mime)) return jsonR({ ok: false, error: 'La foto debe ser JPG, PNG o WebP.' }, 400);
    if (bytes > MAX_FOTO_BYTES) return jsonR({ ok: false, error: 'La foto pesa más de 8 MB.' }, 400);
    if (vivos.length >= MAX_FOTOS) return jsonR({ ok: false, error: `Cada noticia lleva máximo ${MAX_FOTOS} fotos.` }, 400);
  } else {
    if (!MIMES_VIDEO.includes(mime)) return jsonR({ ok: false, error: 'El video debe ser MP4, MOV o WebM.' }, 400);
    if (bytes > MAX_VIDEO_BYTES) return jsonR({ ok: false, error: 'El video pesa más de 150 MB.' }, 400);
    if (ancho && alto && ancho >= alto) return jsonR({ ok: false, error: 'El video debe ser vertical.' }, 400);
    for (const m of vivos) await borrarMedio(env, m);  // un video por noticia: el nuevo reemplaza al anterior
    vivos.length = 0;
  }
  const orden = vivos.reduce((a, m) => Math.max(a, m.orden || 0), 0) + 1;
  const partes = Math.ceil(bytes / PARTE);
  const r = await env.DB.prepare('INSERT INTO noticias_medios (noticia_id, tipo, orden, mime, bytes, parte, partes, subidas, ancho, alto, creado) VALUES (?,?,?,?,?,?,?,0,?,?,?)')
    .bind(nid, tipo, orden, mime, bytes, PARTE, partes, ancho, alto, new Date().toISOString()).run();
  return jsonR({ ok: true, id: r.meta.last_row_id, parte: PARTE, partes });
}

async function subirParte(request, env, url) {
  const id = parseInt(url.searchParams.get('m'), 10), n = parseInt(url.searchParams.get('n'), 10);
  const m = await env.DB.prepare('SELECT * FROM noticias_medios WHERE id = ?').bind(id).first();
  if (!m || !(n >= 0) || n >= m.partes) return jsonR({ ok: false, error: 'Parte inválida.' }, 400);
  const buf = await request.arrayBuffer();
  const esperado = n < m.partes - 1 ? m.parte : m.bytes - n * m.parte;
  if (buf.byteLength !== esperado) return jsonR({ ok: false, error: 'La parte llegó incompleta.' }, 400);
  await env.NOTICIAS_KV.put(`medio/${m.id}/${n}`, buf);
  await env.DB.prepare('UPDATE noticias_medios SET subidas = MAX(subidas, ?) WHERE id = ?').bind(n + 1, m.id).run();
  return jsonR({ ok: true });
}

async function borrarNoticia(request, env) {
  const f = await request.formData();
  const id = parseInt(f.get('id'), 10);
  const { results } = await env.DB.prepare('SELECT * FROM noticias_medios WHERE noticia_id = ?').bind(id).all();
  for (const m of results || []) await borrarMedio(env, m);
  await env.DB.prepare('DELETE FROM noticias WHERE id = ?').bind(id).run();
  return new Response(null, { status: 303, headers: { location: '/asesores?v=noticias&ok=borrada' } });
}

export async function rutaNoticiasAdmin(request, env, url, yo) {
  await esquema(env);
  if (request.method !== 'POST') return null;
  const p = url.pathname;
  if (p === '/asesores/noticias/guardar') return guardar(request, env, yo);
  if (p === '/asesores/noticias/medio') return nuevoMedio(request, env);
  if (p === '/asesores/noticias/parte') return subirParte(request, env, url);
  if (p === '/asesores/noticias/borrar') return borrarNoticia(request, env);
  return null;
}

const CSS_ADMIN = `<style>.nt-adm-fotos{display:flex;gap:10px;flex-wrap:wrap;margin:6px 0}.nt-adm-fotos figure{margin:0;width:150px}.nt-adm-fotos img,.nt-adm-fotos video{width:150px;height:110px;object-fit:cover;border-radius:10px;border:1px solid var(--b);display:block;background:#000}
.nt-adm-fotos video{height:200px;width:113px}.nt-adm-fotos figcaption{font-size:12px;margin-top:4px}.nt-adm-fotos label{display:flex;gap:6px;align-items:center;font-weight:600}.nt-adm-fotos input{width:auto}
.ayuda{font-size:12.5px;color:var(--g);margin:4px 0 0}.prog{height:10px;background:var(--f);border-radius:99px;overflow:hidden;margin:10px 0 4px}.prog i{display:block;height:100%;width:0;background:var(--v2);transition:width .2s}
#nt-estado{font-size:14px;font-weight:700}#nt-estado.err{color:#9b2c22}.campo{margin-top:14px}.radios{display:flex;gap:16px;flex-wrap:wrap}.radios label{display:flex;gap:6px;align-items:center;font-weight:600;color:var(--t)}.radios input{width:auto}</style>`;

export async function vistaNoticiasAdmin(env, yo, url) {
  await esquema(env);
  const editar = url.searchParams.get('editar');
  const ok = url.searchParams.get('ok');
  const aviso = ok === 'guardada' ? '<div class="aviso" style="background:#EEF6D6;border-color:#C7D95D">Noticia guardada.</div>' : ok === 'borrada' ? '<div class="aviso">Noticia borrada.</div>' : '';
  if (editar) {
    const n = editar === 'nueva' ? null : await env.DB.prepare('SELECT * FROM noticias WHERE id = ?').bind(parseInt(editar, 10)).first();
    if (editar !== 'nueva' && !n) return '<h1>Noticias</h1><p>No encontramos esa noticia. <a href="/asesores?v=noticias">Volver</a></p>';
    const ms = n ? ((await mediosDe(env, [n.id]))[n.id] || []) : [];
    const fotos = ms.filter((m) => m.tipo === 'foto'), video = ms.find((m) => m.tipo === 'video');
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
    const val = (k) => esc(n ? n[k] || '' : '');
    return `${CSS_ADMIN}<p><a href="/asesores?v=noticias">← Todas las noticias</a></p><h1>${n ? 'Editar noticia' : 'Nueva noticia'}</h1>
<p class="sub">Aparece en <a href="/noticias" target="_blank" rel="noopener">www.pulsoinversor.cl/noticias</a> apenas la publicas.</p>
<form id="nt-form" class="card" novalidate>${n ? `<input type="hidden" name="id" value="${n.id}">` : ''}
<div class="form">
<div><label for="f-titulo">Título *</label><input id="f-titulo" name="titulo" required maxlength="140" value="${val('titulo')}"></div>
<div><label for="f-cat">Tema *</label><select id="f-cat" name="categoria">${CATEGORIAS_NOTICIAS.map((c) => `<option value="${c.k}"${n && n.categoria === c.k ? ' selected' : ''}>${esc(c.t)}</option>`).join('')}</select></div>
<div><label for="f-fecha">Fecha *</label><input id="f-fecha" name="fecha" type="date" required value="${n ? val('fecha') : hoy}"></div></div>
<div class="campo"><label for="f-bajada">Bajada * <span style="font-weight:400">(1 o 2 frases; se ve en la tarjeta y en Google)</span></label><textarea id="f-bajada" name="bajada" rows="2" maxlength="300" required>${val('bajada')}</textarea></div>
<div class="campo"><label for="f-cuerpo">Texto de la noticia</label><textarea id="f-cuerpo" name="cuerpo" rows="12" maxlength="20000">${val('cuerpo')}</textarea>
<p class="ayuda">Deja una línea en blanco entre párrafos. Para negrita escribe **así**. Los enlaces (https://…) se activan solos.</p></div>

<h2>Fotos <span style="font-weight:400;font-size:14px;color:var(--g)">(máximo ${MAX_FOTOS})</span></h2>
${fotos.length ? `<div class="nt-adm-fotos">${fotos.map((m, i) => `<figure><img src="${src(m)}" alt="Foto ${i + 1}"><figcaption><label><input type="checkbox" name="quitar" value="${m.id}" data-foto> Quitar</label></figcaption></figure>`).join('')}</div>` : ''}
<input id="f-fotos" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple>
<p class="ayuda">La primera foto es la portada de la noticia. Se ajustan solas a 2000 px antes de subirlas.</p>
<div class="nt-adm-fotos" id="f-fotos-prev"></div>

<h2>Video vertical <span style="font-weight:400;font-size:14px;color:var(--g)">(opcional)</span></h2>
${video ? `<div class="nt-adm-fotos"><figure><video src="${src(video)}" muted playsinline preload="metadata"></video><figcaption><label><input type="checkbox" name="quitar" value="${video.id}"> Quitar</label></figcaption></figure></div>` : ''}
<input id="f-video" type="file" accept="video/mp4,video/quicktime,video/webm">
<p class="ayuda">Formato vertical (9:16), MP4 de preferencia, hasta 150 MB. ${video ? 'Si subes otro, reemplaza al actual.' : ''} En iPhone: Ajustes › Cámara › Formatos › «Más compatible» para que se vea en todos los navegadores.</p>
<div class="campo"><label for="f-vtexto">Texto al lado del video</label><textarea id="f-vtexto" name="video_texto" rows="5" maxlength="3000">${val('video_texto')}</textarea></div>

<div class="campo"><label for="f-fuente">Enlace a la publicación original (LinkedIn, Instagram…) <span style="font-weight:400">(opcional)</span></label><input id="f-fuente" name="fuente_url" type="url" maxlength="600" placeholder="https://www.linkedin.com/…" value="${val('fuente_url')}"></div>
<div class="campo radios"><label><input type="radio" name="publicada" value="1"${!n || n.publicada ? ' checked' : ''}> Publicar en el sitio</label><label><input type="radio" name="publicada" value="0"${n && !n.publicada ? ' checked' : ''}> Guardar como borrador</label></div>
<div class="prog" hidden><i></i></div><p id="nt-estado" role="status"></p>
<button class="btn p" type="submit" style="margin-top:8px">${n ? 'Guardar cambios' : 'Guardar noticia'}</button>
</form>
<script>(function(){
var F=document.getElementById('nt-form'),fi=document.getElementById('f-fotos'),vi=document.getElementById('f-video'),est=document.getElementById('nt-estado'),pr=F.querySelector('.prog'),barra=pr.firstElementChild;
var MAX=${MAX_FOTOS},EXIST=${fotos.length};
function msg(t,e){est.textContent=t;est.className=e?'err':'';}
fi.addEventListener('change',function(){var c=document.getElementById('f-fotos-prev');c.innerHTML='';[].slice.call(fi.files).forEach(function(f){var i=document.createElement('img');i.src=URL.createObjectURL(f);var g=document.createElement('figure');g.appendChild(i);c.appendChild(g);});});
function dimsVideo(f){return new Promise(function(ok,no){var v=document.createElement('video');v.preload='metadata';v.muted=true;v.onloadedmetadata=function(){ok({w:v.videoWidth,h:v.videoHeight});};v.onerror=function(){ok({w:0,h:0});};v.src=URL.createObjectURL(f);});}
function achicar(f){return createImageBitmap(f,{imageOrientation:'from-image'}).then(function(b){var k=Math.min(1,2000/Math.max(b.width,b.height)),w=Math.round(b.width*k),h=Math.round(b.height*k),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(b,0,0,w,h);
return new Promise(function(ok){c.toBlob(function(x){ok({blob:x,w:w,h:h});},'image/jpeg',0.86);});});}
function post(u,body,json){return fetch(u,{method:'POST',credentials:'same-origin',headers:json?{'content-type':'application/json'}:{},body:json?JSON.stringify(body):body}).then(function(r){return r.json().catch(function(){return{ok:false,error:'Error del servidor ('+r.status+')'};});});}
async function subir(nid,tipo,blob,d,nombre){var j=await post('/asesores/noticias/medio',{noticia:nid,tipo:tipo,mime:blob.type,bytes:blob.size,ancho:d.w,alto:d.h},true);if(!j.ok)throw new Error(j.error||'No se pudo subir '+nombre);
for(var n=0;n<j.partes;n++){var parte=blob.slice(n*j.parte,(n+1)*j.parte),r=null;for(var k=0;k<3&&!(r&&r.ok);k++)r=await post('/asesores/noticias/parte?m='+j.id+'&n='+n,parte);if(!r.ok)throw new Error((r&&r.error)||'No se pudo subir '+nombre);
barra.style.width=Math.round((n+1)/j.partes*100)+'%';msg('Subiendo '+nombre+'… '+Math.round((n+1)/j.partes*100)+'%');}}
F.addEventListener('submit',async function(e){e.preventDefault();var b=F.querySelector('button[type=submit]');
if(!F.titulo.value.trim()||!F.bajada.value.trim()||!F.fecha.value){msg('Completa el título, la bajada y la fecha.',1);return;}
var quitadas=F.querySelectorAll('input[data-foto]:checked').length,nuevas=fi.files.length;
if(EXIST-quitadas+nuevas>MAX){msg('Cada noticia lleva máximo '+MAX+' fotos. Quita alguna o elige menos.',1);return;}
var v=vi.files[0],dv=null;if(v){if(v.size>150*1024*1024){msg('El video pesa más de 150 MB.',1);return;}dv=await dimsVideo(v);if(dv.w&&dv.h&&dv.w>=dv.h){msg('El video debe ser vertical (más alto que ancho).',1);return;}}
b.disabled=true;msg('Guardando…');
try{var j=await post('/asesores/noticias/guardar',(function(){var fd=new FormData(F);return fd;})());if(!j.ok)throw new Error(j.error||'No se pudo guardar.');
if(!F.querySelector('input[name=id]')){var h=document.createElement('input');h.type='hidden';h.name='id';h.value=j.id;F.appendChild(h);}
if(nuevas||v){pr.hidden=false;}
for(var i=0;i<nuevas;i++){barra.style.width='0';var a=await achicar(fi.files[i]);await subir(j.id,'foto',a.blob,a,'la foto '+(i+1));}
if(v){barra.style.width='0';await subir(j.id,'video',v,dv,'el video');}
msg('¡Listo!');location.href='/asesores?v=noticias&ok=guardada';}
catch(err){msg(err.message+' Lo que ya se subió quedó guardado; puedes intentar de nuevo desde Editar.',1);b.disabled=false;}});
})();</script>`;
  }
  const { results } = await env.DB.prepare('SELECT * FROM noticias ORDER BY fecha DESC, id DESC').all();
  const lista = results || [];
  const medios = await mediosDe(env, lista.map((n) => n.id));
  const filas = lista.map((n) => {
    const ms = medios[n.id] || [], nf = ms.filter((m) => m.tipo === 'foto').length, nv = ms.some((m) => m.tipo === 'video');
    return `<tr><td>${esc(n.fecha)}</td><td><strong>${esc(n.titulo)}</strong><br><small style="color:var(--g)">${esc(nombreCat(n.categoria))} · ${nf} foto${nf === 1 ? '' : 's'}${nv ? ' · video' : ''}</small></td>
<td>${n.publicada ? '<span class="pill ok">Publicada</span>' : '<span class="pill wait">Borrador</span>'}</td>
<td style="white-space:nowrap"><a class="btn peq" href="/noticias/${esc(n.slug)}" target="_blank" rel="noopener">Ver</a> <a class="btn peq p" href="/asesores?v=noticias&editar=${n.id}">Editar</a>
<form method="post" action="/asesores/noticias/borrar" style="display:inline" onsubmit="return confirm('¿Borrar esta noticia con sus fotos y video? No se puede deshacer.')"><input type="hidden" name="id" value="${n.id}"><button class="btn peq" type="submit">Borrar</button></form></td></tr>`;
  }).join('');
  return `${aviso}<div class="barra" style="justify-content:space-between"><div><h1>Noticias</h1><p class="sub" style="margin:0">Lo que publiques aquí aparece en <a href="/noticias" target="_blank" rel="noopener">www.pulsoinversor.cl/noticias</a>. Solo los administradores ven esta pestaña.</p></div>
<a class="btn p" href="/asesores?v=noticias&editar=nueva">+ Nueva noticia</a></div>
${lista.length ? `<div class="tabla"><table><thead><tr><th>Fecha</th><th>Noticia</th><th>Estado</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>` : '<p class="vacio">Todavía no hay noticias.</p>'}`;
}
