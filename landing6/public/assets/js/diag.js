// Landing de diagnóstico · 6.pulsoinversor.cl
import { CAPITALES, PREGUNTAS, SOLUCIONES, PERFILES, diagnosticar, mensajeWhatsApp } from './logica.js';

const WA = 'https://wa.me/56958792038?text=';
const $ = (id) => document.getElementById(id);
const form = $('form');
const q = new URLSearchParams(location.search);
const utm = {};
['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => { if (q.get(k)) utm[k] = q.get(k).slice(0, 160); });

// ---------- Construir las preguntas ----------
const radios = (grupo, opciones) => opciones.map((o) => `<label><input type="radio" name="${grupo}" value="${o.replace(/"/g, '&quot;')}"> ${o}</label>`).join('');
form.querySelector('[data-grupo="capital"]').innerHTML = radios('capital', CAPITALES);
$('preguntas-perfil').innerHTML = PREGUNTAS.map((p, i) => `
<fieldset class="campo bloque" id="q-${p.id}">
  <legend><span class="num">${i + 2}</span> ${p.titulo}</legend>
  <div class="opciones">${radios(p.id, p.opciones)}</div>
  <div class="err">Elige una opción.</div>
</fieldset>`).join('');

// ---------- Validación ----------
const valorRadio = (n) => { const r = form.querySelector(`input[name="${n}"]:checked`); return r ? r.value : ''; };
const marcar = (el, mal) => { const c = el.closest('.campo') || el.closest('.check-w'); if (c) c.classList.toggle('mal', mal); };
['change', 'input'].forEach((t) => form.addEventListener(t, (ev) => { const c = ev.target.closest('.mal'); if (c) c.classList.remove('mal'); }));

function leer() {
  const r = { capital: valorRadio('capital') };
  PREGUNTAS.forEach((p) => { r[p.id] = valorRadio(p.id); });
  return r;
}

function validar(resp) {
  let ok = true, primero = null;
  const chequea = (el, cond) => { marcar(el, !cond); if (!cond) { ok = false; if (!primero) primero = el; } };
  chequea($('nombre'), $('nombre').value.trim().length >= 2);
  const ed = parseInt($('edad').value, 10);
  chequea($('edad'), ed >= 18 && ed <= 99);
  ['capital', ...PREGUNTAS.map((p) => p.id)].forEach((id) => chequea(form.querySelector(`input[name="${id}"]`), !!resp[id]));
  chequea($('consentimiento'), $('consentimiento').checked);
  if (primero) { primero.focus(); primero.closest('.campo, .check-w')?.scrollIntoView({ block: 'center' }); }
  return ok;
}

// ---------- Resultado ----------
let actual = null; // { nombre, edad, respuestas, diag, folio }

function enlaceWA() {
  if (!actual) return;
  const duda = $('duda').value.trim().slice(0, 400);
  const href = WA + encodeURIComponent(mensajeWhatsApp({ ...actual, duda }));
  $('btn-wa').href = href;
  $('btn-wa-final').href = href;
}
$('duda').addEventListener('input', enlaceWA);

function avisarClic() {
  if (!actual?.folio) return;
  const cuerpo = JSON.stringify({ folio: actual.folio, duda: $('duda').value.trim().slice(0, 400) });
  try { navigator.sendBeacon('/api/whatsapp', new Blob([cuerpo], { type: 'application/json' })); } catch (e) { /* sin aviso */ }
}
$('btn-wa').addEventListener('click', avisarClic);
$('btn-wa-final').addEventListener('click', avisarClic);

function mostrar() {
  const { nombre, diag } = actual;
  $('r-nombre').textContent = nombre;
  $('r-perfil').textContent = diag.perfil;
  $('r-perfil-desc').textContent = PERFILES[diag.perfil];
  document.querySelectorAll('.medidor i').forEach((i) => i.classList.toggle('on', i.dataset.p === diag.perfil));

  if (diag.principal) {
    const s = SOLUCIONES[diag.principal];
    $('r-sol-nombre').textContent = s.nombre;
    $('r-sol-respaldo').textContent = s.respaldo;
    $('r-sol-plazos').textContent = s.plazos;
    $('r-sol-desde').textContent = s.desde;
    $('r-sol-extra').textContent = s.extra;
    const alt = diag.alternativa && SOLUCIONES[diag.alternativa];
    $('r-alt').hidden = !alt;
    if (alt) $('r-alt').innerHTML = `<b>Alternativa:</b> ${alt.nombre}. ${alt.respaldo}`;
    $('r-solucion').hidden = false; $('r-sin').hidden = true;
  } else {
    $('r-sin-titulo').textContent = diag.estado === 'bajo-minimo' ? 'Aún no llegas al monto mínimo' : 'Hoy no te recomendamos invertir este dinero';
    $('r-solucion').hidden = true; $('r-sin').hidden = false;
  }
  $('r-alertas').innerHTML = diag.alertas.map((a) => `<li>${a.replace(/</g, '&lt;')}</li>`).join('');
  $('r-alertas-w').hidden = !diag.alertas.length;
  enlaceWA();
  flot.style.display = 'none';
  form.hidden = true;
  const r = $('resultado'); r.hidden = false; r.focus({ preventScroll: true });
  r.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

$('btn-rehacer').addEventListener('click', () => {
  $('resultado').hidden = true; form.hidden = false;
  $('btn-enviar').disabled = false; $('btn-enviar').textContent = 'Ver mi diagnóstico';
  form.scrollIntoView({ block: 'start' });
});

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const estado = $('estado-envio');
  estado.textContent = ''; estado.className = 'estado-envio';
  const respuestas = leer();
  if (!validar(respuestas)) { estado.textContent = 'Revisa las preguntas marcadas.'; estado.className = 'estado-envio error'; return; }
  const diag = diagnosticar(respuestas);
  if (!diag) { estado.textContent = 'Revisa las preguntas marcadas.'; estado.className = 'estado-envio error'; return; }
  const nombre = $('nombre').value.trim();
  const edad = parseInt($('edad').value, 10);
  actual = { nombre, edad, respuestas, diag, folio: null };

  const btn = $('btn-enviar');
  btn.disabled = true; btn.textContent = 'Calculando…';
  // Se guarda para darle un folio; si falla, igual mostramos el diagnóstico.
  try {
    const r = await fetch('/api/diagnostico', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nombre, edad, ...respuestas,
        consentimiento: 'Sí', acepta_publicidad: $('acepta_publicidad').checked ? 'Sí' : 'No',
        sitio: form.querySelector('[name="sitio"]').value, pagina: location.origin + location.pathname, ...utm,
      }),
    });
    const j = await r.json();
    if (r.ok && j.ok && j.folio) actual.folio = j.folio;
  } catch (e) { /* sin folio */ }
  mostrar();
});

// ---------- Botón flotante en móvil ----------
const flot = $('flot');
if ('IntersectionObserver' in window) {
  const vis = {};
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => { vis[en.target.id] = en.isIntersecting; });
    flot.classList.toggle('ver', !vis.inicio && !vis.diagnostico);
  });
  io.observe($('inicio')); io.observe($('diagnostico'));
}
