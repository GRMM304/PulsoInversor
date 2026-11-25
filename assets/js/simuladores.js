/* Pulso Inversor · Simuladores
 * - Acceso: los simuladores parten bloqueados hasta completar nombre, correo, teléfono y aceptar las casillas.
 *   Hipoteca Inteligente pide además la capacidad financiera por crédito.
 * - Rescate Inmobiliario: réplica del simulador de www.pulsoinversor.cl + comparación con depósito a plazo.
 * - Hipoteca Inteligente: réplica del simulador de simuladorpulsoinversor.netlify.app.
 * - Simulador de Arquitectura de Capital (antes Simulador Patrimonial): propiedades de pulsopropiedades.cl.
 * - Inversión Circular: vive en su propia página (inversion-circular.html).
 * Cada bloque se activa solo si su panel existe en la página.
 * Los datos de contacto viven solo en memoria y en sessionStorage (se borran al cerrar la pestaña).
 */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = $('[data-simuladores]');
  if (!root) return;

  /* ---------- Configuración ---------- */
  var WHATSAPP = '56958792038'; // respond.io (Lorenzo)
  // Planilla de Google (Apps Script) que usa hoy el simulador de Hipoteca Inteligente.
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycby1He4sHgOoqwfI5Zc0hJ8Ux3SlESniUs3vZEkC0PvcZxFHhmalKODK4v-pEKjrWBPH/exec';
  // Tasa mensual referencial de un depósito a plazo a 30 días, renovado cada mes. PENDIENTE: confirmar.
  // Disclaimer de las simulaciones (revisión 17-11-2026).
  var DISCLAIMER = 'Esta simulación no constituye una cotización ni asegura rentabilidades futuras. La rentabilidad simulada es referencial a esta fecha y no compromete a Pulso Inversor SpA. La rentabilidad y las condiciones finales se fijan al momento de la firma del contrato respectivo.';
  var DAP_ANUAL = 4.8;   // % anual referencial de un depósito a plazo a 365 días (CONFIRMAR)
  // Valores de respaldo si no responde el servicio de indicadores.
  var UF = 39100, IPC = 4.5;

  var fmtCLP = function (n) { return '$' + Math.round(n || 0).toLocaleString('es-CL'); };
  var fmtPct = function (n, d) { return (n || 0).toLocaleString('es-CL', { minimumFractionDigits: d == null ? 0 : d, maximumFractionDigits: 2 }) + '%'; };
  var esc = function (s) { return String(s).replace(/[&<>'"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]; }); };
  var ses = {
    get: function (k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // UF del día (mindicador.cl); si falla, se usa el valor de respaldo.
  try {
    fetch('https://mindicador.cl/api/uf').then(function (r) { return r.json(); }).then(function (d) {
      var v = d && d.serie && d.serie[0] && Number(d.serie[0].valor);
      if (v > 0) { UF = v; if (window.__pulsoProyectaRender) window.__pulsoProyectaRender(); }
    }).catch(function () {});
  } catch (e) {}

  /* ---------- Selección de simulador (3 cajas) y acceso con datos ---------- */
  var tabs = $$('[data-sim-tab]'), panels = $$('[data-sim-panel]');
  var stage = $('#sim-stage'), gate = $('#sim-gate');
  var contacto = ses.get('pulsoContacto');
  // Página del equipo (/panel/simuladores): ya entró con la clave, así que no se piden datos.
  var EQUIPO = root.hasAttribute('data-equipo');
  function setLocked(locked) {
    stage.classList.toggle('is-locked', locked);
    gate.hidden = !locked;
    $$('.sim-panel-body', stage).forEach(function (el) { if (locked) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
  }
  function abrir(id, desplazar) {
    if (!$('[data-sim-panel="' + id + '"]')) return;
    stage.hidden = false;
    var area = $('#sim-area'); if (area) area.classList.add('has-open');
    tabs.forEach(function (t) { var on = t.getAttribute('data-sim-tab') === id; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
    panels.forEach(function (p) { p.hidden = p.getAttribute('data-sim-panel') !== id; });
    var pnl = $('[data-sim-panel="' + id + '"]'), asistido = pnl.hasAttribute('data-asistido');
    setLocked(!contacto && !asistido && !EQUIPO);
    if (desplazar) stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!contacto && !asistido && !EQUIPO) setTimeout(function () { var n = $('#gate-nombre'); if (n) n.focus({ preventScroll: true }); }, 450);
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { var id = t.getAttribute('data-sim-tab'); abrir(id, true); history.replaceState(null, '', location.search + '#' + id); }); });

  // Píxel: "empezó a simular" = elige un simulador o escribe en él / en el acceso (una vez por página; nunca en la vista del equipo).
  var INTERES_SIM = { 'sim-proyecta': 'VioRentaCapital', 'sim-asistido-pc': 'VioProduccionCapital', 'sim-asistido-ac': 'VioArquitecturaCapital', 'sim-circular': 'VioInversionCircular' };
  var empezo = false;
  function empezar(id) {
    if (EQUIPO) return;
    if (id && INTERES_SIM[id] && window.pulsoInteres) pulsoInteres(INTERES_SIM[id]);
    if (empezo) return; empezo = true;
    if (window.fbq) fbq('track', 'CustomizeProduct', { content_name: id || 'simulador' });
    if (window.pulsoMedir) pulsoMedir('simulador_iniciado', { simulador: id || '' });
  }
  tabs.forEach(function (t) { t.addEventListener('click', function (e) { if (e.isTrusted) empezar(t.getAttribute('data-sim-tab')); }); });
  // Escribir o elegir algo (no el foco automático) en un simulador o en el formulario de acceso.
  ['input', 'change'].forEach(function (ev) {
    root.addEventListener(ev, function (e) {
      if (!e.isTrusted || !e.target.closest || e.target.closest('[data-sim-tab]')) return;
      var p = e.target.closest('[data-sim-panel]');
      var tab = $('[data-sim-tab].is-active');
      var id = p ? p.getAttribute('data-sim-panel') : (tab ? tab.getAttribute('data-sim-tab') : (panels.length === 1 ? panels[0].getAttribute('data-sim-panel') : null));
      empezar(id);
    });
  });

  function sheet(type, payload) {
    var body = JSON.stringify(Object.assign({ type: type, website: '', pageUrl: location.href.split('?')[0].split('#')[0], referrer: document.referrer || '' }, payload));
    return fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body })
      .then(function () { return true; }, function () { return false; });
  }

  /* ---------- Envío de la simulación al correo (Worker /api/enviar-simulacion) ---------- */
  var API_CORREO = '/api/enviar-simulacion';
  function folioPI() { var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); }; return 'PI-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '-' + Math.random().toString(36).slice(2, 5).toUpperCase(); }
  function slugNombre() { return String(contacto ? contacto.nombre : 'cliente').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'cliente'; }
  // PDF sencillo: encabezado de marca + secciones de filas clave/valor y párrafos.
  // Asesor según el monto simulado (los correos viven en el Worker).
  // Asesor según el rango de edad (los correos viven en el Worker): menos de 40 años → Renato; 40 o más → Pamela.
  function asesoresPara() {
    return (parseInt(contacto && contacto.edad, 10) || 0) >= 40 ? ['Pamela Herrera'] : ['Renato Vargas'];
  }
  var primerNombre = function () { return String(contacto ? contacto.nombre : '').trim().split(/\s+/)[0] || ''; };
  // Bloques con empatía, comunes a todos los PDF.
  function pdfIntro(doc, y, M, CW, tipo) {
    var txt = 'Hola ' + primerNombre() + ', gracias por darte el tiempo de simular. Aquí tienes tus números de ' + tipo + ' para revisarlos con calma, compartirlos con tu familia o mostrárselos a tu abogado. Invertir tus ahorros es una decisión importante y queremos que la tomes con la información en la mano, sin apuro.';
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); var l = doc.splitTextToSize(txt, CW - 12), h = l.length * 4.1 + 8;
    doc.setFillColor(244, 248, 226); doc.roundedRect(M, y, CW, h, 2.5, 2.5, 'F'); doc.setFillColor(191, 212, 30); doc.rect(M, y, 1.6, h, 'F');
    doc.setTextColor(20, 63, 55); doc.text(l, M + 7, y + 6.2);
    return y + h + 2;
  }
  function pdfProximos(doc, y, M, CW, monto) {
    var nombres = asesoresPara(monto), varios = nombres.length > 1, quien = nombres.join(' y ');
    var pasos = ['1. ' + quien + (varios ? ' se contactarán contigo' : ' se contactará contigo') + ' en las próximas horas hábiles para resolver tus dudas.',
      '2. Si quieres, te mostramos una operación real: la propiedad, su tasación y el documento que queda a tu favor.',
      '3. Revisas todo con calma, con tu abogado si lo prefieres. No te pedimos decidir en la reunión.'];
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    var lineas = pasos.map(function (p) { return doc.splitTextToSize(p, CW - 14); });
    var h = 26 + lineas.reduce(function (a, l) { return a + l.length * 4.5 + 1.5; }, 0) + 10;
    if (y + h > 276) { doc.addPage(); y = 18; }
    doc.setFillColor(24, 76, 63); doc.roundedRect(M, y, CW, h, 3, 3, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(199, 217, 93); doc.text((varios ? 'QUIENES TE ACOMPAÑAN' : 'QUIEN TE ACOMPAÑA'), M + 7, y + 8);
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.text(quien, M + 7, y + 15.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(207, 224, 217); doc.text(varios ? 'Cofundadores de Pulso Inversor' : (nombres[0] === 'Pamela Herrera' ? 'Asesora' : 'Asesor') + ' de inversiones · Pulso Inversor', M + 7, y + 20.5);
    var yy = y + 28; doc.setFontSize(9.5); doc.setTextColor(255, 255, 255);
    lineas.forEach(function (l) { doc.text(l, M + 7, yy); yy += l.length * 4.5 + 1.5; });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(199, 217, 93); doc.text('WhatsApp +56 9 5879 2038  ·  contacto@pulsoinversor.cl  ·  Los Militares 5890, of. 304, Las Condes', M + 7, yy + 3);
    return y + h + 4;
  }
  function pdfSimple(titulo, subtitulo, secciones, opc) {
    opc = opc || {};
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var C = { deep: [24, 76, 63], lime: [191, 212, 30], text: [20, 63, 55], muted: [107, 125, 119], line: [221, 228, 224], red: [198, 40, 40], pos: [42, 107, 79] };
    var W = 210, M = 16, CW = W - 2 * M, y = 0, fol = folioPI();
    var font = function (sz, st, k) { doc.setFont('helvetica', st || 'normal'); doc.setFontSize(sz); doc.setTextColor.apply(doc, C[k || 'text']); };
    var ensure = function (h) { if (y + h > 276) { doc.addPage(); y = 18; } };
    var logo = $('#sim-logo');
    try { var lw = 92, lh = lw * logo.naturalHeight / logo.naturalWidth; doc.addImage(logo, 'PNG', M, 9, lw, lh, undefined, 'FAST'); } catch (e) { font(12, 'bold'); doc.text('Pulso Inversor', M, 17); }
    font(9, 'bold'); doc.text('Folio ' + fol, W - M, 14, { align: 'right' });
    font(9, 'normal', 'muted'); doc.text(new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }), W - M, 19.5, { align: 'right' });
    doc.setFillColor.apply(doc, C.deep); doc.rect(0, 28, W, 20, 'F'); doc.setFillColor.apply(doc, C.lime); doc.rect(0, 48, W, 1.6, 'F');
    font(17, 'bold'); doc.setTextColor(255, 255, 255); doc.text(titulo, M, 39.5);
    font(9, 'normal'); doc.setTextColor(207, 224, 217); doc.text(subtitulo, W - M, 39.5, { align: 'right' }); y = 56;
    if (opc.tipo) y = pdfIntro(doc, y, M, CW, opc.tipo);
    var secs = [{ t: 'Preparada para', rows: [['Nombre', contacto ? contacto.nombre : ''], ['Correo electrónico', contacto ? contacto.email : ''], ['Teléfono', contacto ? '+56 ' + contacto.telefono : '']] }].concat(secciones);
    secs.forEach(function (sec) {
      if (sec.proximos) { y = pdfProximos(doc, y + 6, M, CW, opc.monto); return; }
      ensure(22); y += 4; doc.setFillColor.apply(doc, C.lime); doc.rect(M, y, 12, 1.4, 'F'); y += 6; font(12, 'bold'); doc.text(sec.t, M, y); y += 5;
      (sec.rows || []).forEach(function (r) {
        ensure(8); font(9.5, 'normal', 'muted'); doc.text(String(r[0]), M, y + 4.5); font(9.5, 'bold', r[2] || 'text'); doc.text(String(r[1]).replace(/−/g, '-'), M + CW, y + 4.5, { align: 'right' });
        y += 7; doc.setDrawColor.apply(doc, C.line); doc.setLineWidth(.2); doc.line(M, y, M + CW, y);
      });
      if (sec.text) { font(sec.small ? 8.5 : 9.5, 'normal', sec.small ? 'muted' : 'text'); var l = doc.splitTextToSize(String(sec.text).replace(/−/g, '-'), CW); ensure(l.length * 4.4 + 2); doc.text(l, M, y + 4.5); y += l.length * 4.4 + 3; }
    });
    var n = doc.getNumberOfPages(); for (var i = 1; i <= n; i++) { doc.setPage(i); doc.setDrawColor.apply(doc, C.line); doc.setLineWidth(.2); doc.line(M, 286, W - M, 286); font(7.5, 'normal', 'muted'); doc.text('Pulso Inversor · Simulación ' + fol, M, 291); doc.text('Página ' + i + ' de ' + n, W - M, 291, { align: 'right' }); }
    doc.__folio = fol;
    return doc;
  }
  // Equipo: ventana con el formulario de datos del cliente; al completarlo se vuelve a presionar el botón de envío.
  var pendiente = null;
  function cerrarDatos() { gate.classList.remove('is-modal'); gate.hidden = true; document.body.classList.remove('gate-abierto'); pendiente = null; }
  function pedirDatos(btn) {
    pendiente = btn;
    if (!$('.gate-x', gate)) { var x = document.createElement('button'); x.type = 'button'; x.className = 'gate-x'; x.setAttribute('aria-label', 'Cerrar'); x.textContent = '×'; x.addEventListener('click', cerrarDatos); gate.appendChild(x); }
    var t = $('#gate-title'); if (t) t.textContent = 'Datos del cliente para enviarle la simulación';
    var sub = $('.gate-sub', gate); if (sub) sub.textContent = 'Le enviaremos el PDF a su correo.';
    var bEnv = $('#gate-form button[type=submit]'); if (bEnv) bEnv.innerHTML = 'Enviar <span aria-hidden="true">→</span>';
    gate.classList.add('is-modal'); gate.hidden = false; document.body.classList.add('gate-abierto');
    setTimeout(function () { var n = $('#gate-nombre'); if (n) n.focus(); }, 50);
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && gate.classList.contains('is-modal')) cerrarDatos(); });
  function enviarCorreo(tipo, doc, prefijo, resumen, st, btn, monto) {
    if (!contacto) { if (EQUIPO) pedirDatos(btn); return; }
    st.className = st.className.replace(/\s?is-(ok|err)/g, '');
    st.textContent = 'Enviando a ' + contacto.email + '…'; btn.disabled = true;
    if (!EQUIPO) {
      var valor = Math.round(Number(monto) || 0);
      if (window.fbq) {
        var metaEventId = 'sim-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
        fbq('track', 'SubmitApplication', valor > 0 ? { content_name: tipo, value: valor, currency: 'CLP' } : { content_name: tipo }, { eventID: metaEventId });
      }
      if (window.pulsoMedir) pulsoMedir('simulacion_enviada', valor > 0 ? { simulador: tipo, value: valor, currency: 'CLP' } : { simulador: tipo });
    }
    if (typeof metaEventId === 'undefined') var metaEventId = '';
    var b64 = doc.output('datauristring').split(',')[1];
    var archivo = prefijo + '_' + (doc.__folio || folioPI()) + '_' + slugNombre() + '.pdf';
    fetch(API_CORREO, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipo: EQUIPO || undefined, metaEventId: metaEventId || undefined, pageUrl: location.href.split('#')[0], tipo: tipo, cliente: { nombre: contacto.nombre, email: contacto.email, telefono: contacto.telefono, edad: contacto.edad, publicidad: contacto.publicidad === true, consentimiento: contacto.consentimiento || null }, pdfBase64: b64, archivo: archivo, resumen: resumen, monto: Math.round(monto || 0), website: '' }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && j.ok; }); })
      .then(function (ok) {
        if (ok) avisoEnviado(contacto.email, asesoresPara(monto));
        st.classList.add(ok ? 'is-ok' : 'is-err');
        st.textContent = ok ? '✓ Te enviamos la simulación a ' + contacto.email + '. ' + asesoresPara(monto).join(' y ') + (asesoresPara(monto).length > 1 ? ' se contactarán contigo' : ' se contactará contigo') + ' pronto. Si no ves el correo, revisa tu carpeta de spam.'
          : 'No pudimos enviar el correo en este momento. Ya recibimos tu simulación y un asesor te la hará llegar.';
      }, function () { st.classList.add('is-err'); st.textContent = 'No pudimos enviar el correo en este momento. Ya recibimos tu simulación y un asesor te la hará llegar.'; })
      .then(function () { btn.disabled = false; });
  }
  function avisoEnviado(email, asesores) {
    var m = document.createElement('div');
    m.className = 'ag-modal sim-ok-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'sim-ok-t');
    var quien = asesores.join(' y ') + (asesores.length > 1 ? ' se contactarán' : ' se contactará');
    m.innerHTML = '<div class="ag-fondo"></div><div class="ag-caja"><button type="button" class="ag-x" aria-label="Cerrar">✕</button>' +
      '<div class="sim-ok-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
      '<h2 id="sim-ok-t">¡Simulación enviada!</h2><p class="ag-sub">Te enviamos tu simulación en PDF a <strong></strong>. ' + quien + ' contigo pronto.</p>' +
      '<p class="sim-ok-spam">Si no ves el correo en unos minutos, revisa tu carpeta de spam o promociones.</p>' +
      '<button type="button" class="btn btn-primary btn-xl sim-ok-btn">Entendido</button></div>';
    m.querySelector('.ag-sub strong').textContent = email;
    var antes = document.activeElement;
    function cerrar() { document.removeEventListener('keydown', tecla); document.body.classList.remove('ag-abierto'); m.remove(); if (antes && antes.focus) antes.focus(); }
    function tecla(e) { if (e.key === 'Escape') cerrar(); }
    m.querySelector('.ag-fondo').addEventListener('click', cerrar);
    m.querySelector('.ag-x').addEventListener('click', cerrar);
    m.querySelector('.sim-ok-btn').addEventListener('click', cerrar);
    document.addEventListener('keydown', tecla);
    document.body.appendChild(m); document.body.classList.add('ag-abierto');
    requestAnimationFrame(function () { m.classList.add('is-open'); m.querySelector('.sim-ok-btn').focus(); });
  }
  function jspdfListo(st) { if (window.jspdf && window.jspdf.jsPDF) return true; st.textContent = 'No se pudo preparar el documento. Revisa tu conexión y recarga la página.'; return false; }

  $('#gate-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, err = $('#gate-err');
    if (f.website.value) return; // trampa para bots
    var nombre = f.nombre.value.trim(), email = f.email.value.trim(), tel = f.telefono.value.replace(/\D/g, ''), edad = f.edad ? f.edad.value : '';
    var faltan = [];
    if (nombre.length < 2) faltan.push('nombre');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) faltan.push('correo');
    if (tel.length < 8) faltan.push('teléfono');
    if (!edad) faltan.push('edad');
    var msg = faltan.length ? 'Completa correctamente: ' + faltan.join(', ') + '.' : '';
    if (!f.terminos.checked) msg += (msg ? ' ' : '') + 'Para continuar debes aceptar la Política de privacidad.';
    err.textContent = msg;
    ['nombre', 'email', 'telefono', 'edad'].forEach(function (n) { if (f[n]) f[n].classList.toggle('invalid', faltan.indexOf(n === 'telefono' ? 'teléfono' : n === 'email' ? 'correo' : n) >= 0); });
    if (msg) return;
    contacto = { nombre: nombre, email: email, telefono: tel, edad: edad, publicidad: !!f.contenido.checked, consentimiento: new Date().toISOString() };
    ses.set('pulsoContacto', contacto);
    if (!EQUIPO) {
      if (window.fbq) {
        var leadId = 'lead-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
        fbq('track', 'Lead', { content_name: 'Desbloqueó simuladores' }, { eventID: leadId });
        try { fetch('/api/meta-lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, body: JSON.stringify({ eventId: leadId, nombre: nombre, email: email, telefono: tel, pageUrl: location.href.split('#')[0] }) }); } catch (er) {}
      }
      if (window.pulsoMedir) pulsoMedir('generate_lead', { origen: 'Simuladores' });
    }
    var reintentar = pendiente;
    if (gate.classList.contains('is-modal')) { cerrarDatos(); if (reintentar) reintentar.click(); return; }
    setLocked(false);
    stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  var inicial = (location.hash || '').replace('#', '');
  if (/^sim-(proyecta|hipoteca|circular|patrimonial|asistido-pc|asistido-ac)$/.test(inicial)) abrir(inicial, false);
  // Página con un solo simulador (por ejemplo, la landing de Inversión Circular): se muestra de inmediato.
  if (!tabs.length && panels.length === 1) abrir(panels[0].getAttribute('data-sim-panel'), false);

  if ($('#sim-proyecta')) (function () {
  /* =========================================================
     Renta de Capital (garantías Título, Hipoteca y Pagaré)
     ========================================================= */
  var SERIES = {
    A: { nombre: 'Pagaré', garantia: 'Pagaré', plazos: [12, 18, 24], retiro: true, minimo: 5000000, interes: [1, 1.1, 1.2], uf: false },
    H: { nombre: 'Hipoteca', garantia: 'Hipoteca', plazos: [15, 21, 27], retiro: false, minimo: 25000000, interes: [0.7, 0.8, 0.9], uf: true },
    T: { nombre: 'Título', garantia: 'Título', plazos: [15, 21, 27], retiro: false, minimo: 100000000, interes: [0.8, 0.9, 1.0], uf: true }
  };
  var P = { serie: null, monto: 0, plazo: null, retiro: null };
  var q = new URLSearchParams(location.search).get('serie');
  if (q && SERIES[q.toUpperCase()]) P.serie = q.toUpperCase();

  var tasaBase = function () { var s = SERIES[P.serie]; var i = s.plazos.indexOf(P.plazo); return s.interes[i < 0 ? 0 : i]; };
  var tasa = function () { return (P.serie === 'A' && P.retiro === true) ? Math.round((tasaBase() - 0.1) * 10) / 10 : tasaBase(); };
  var montoEf = function () { return P.serie ? Math.max(P.monto || 0, SERIES[P.serie].minimo) : (P.monto || 0); };
  var completo = function () { return !!(P.serie && P.monto && P.plazo && (!SERIES[P.serie].retiro || P.retiro !== null)); };
  function calcular() {
    var s = SERIES[P.serie], m = montoEf(), n = P.plazo, t = tasa() / 100, total, interes;
    if (!s.uf) { interes = Math.round(m * n * t); total = m + interes; }
    else {
      var inv = m / UF, intUF = inv * n * t;
      var ufProy = UF * (IPC / 100) * n / 12 + UF;
      total = Math.round((inv + intUF) * ufProy); interes = total - m;
    }
    // Depósito a 365 días renovado al vencimiento (interés compuesto anual); los meses que no completan un año, en proporción.
    var dap = Math.round(m * Math.pow(1 + DAP_ANUAL / 100, n / 12));
    return { monto: m, total: total, ganancia: total - m, dapTotal: dap, dapGanancia: dap - m };
  }
  function renderSeries() {
    $$('[data-serie]').forEach(function (b) { var on = b.getAttribute('data-serie') === P.serie; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    var s = SERIES[P.serie];
    if (!s) {
      $('#p-plazos').innerHTML = '<span class="pro-help">Elige primero un respaldo.</span>';
      $('#p-quick').innerHTML = [5000000, 10000000, 25000000, 50000000, 100000000, 250000000].map(function (v) { return '<button type="button" class="chip-opt" data-monto="' + v + '">' + (v / 1e6) + ' millones</button>'; }).join('');
      $('#p-min').textContent = ''; $('#p-retiro-wrap').hidden = true; return;
    }
    $('#p-plazos').innerHTML = s.plazos.map(function (p) { return '<button type="button" class="chip-opt' + (p === P.plazo ? ' is-active' : '') + '" data-plazo="' + p + '" aria-pressed="' + (p === P.plazo) + '">' + p + ' meses</button>'; }).join('');
    $('#p-quick').innerHTML = [5000000, 10000000, 25000000, 50000000, 100000000, 250000000].filter(function (v) { return v >= s.minimo; })
      .map(function (v) { return '<button type="button" class="chip-opt" data-monto="' + v + '">' + (v / 1e6) + ' millones</button>'; }).join('');
    $('#p-min').textContent = 'Mínimo para este respaldo: ' + fmtCLP(s.minimo);
    $('#p-retiro-wrap').hidden = !s.retiro;
    $$('[data-retiro]').forEach(function (b) { var on = P.retiro !== null && (b.getAttribute('data-retiro') === '1') === P.retiro; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  }
  function render(enEdicion) {
    if (!enEdicion) $('#p-monto').value = P.monto ? fmtCLP(P.monto) : '';
    var listo = completo();
    $('#p-correo').disabled = !listo;
    $$('.pro-cols').forEach(function (c) { c.classList.toggle('is-empty', !listo); });
    $('#p-falta').hidden = listo;
    if (!listo) {
      ['r-estrategia', 'r-monto', 'r-plazo', 'r-tasa', 'r-total', 'r-ganancia', 'd-total', 'd-dap', 'd-monto', 'd-plazo'].forEach(function (id) { $('#' + id).textContent = '—'; });
      $('#d-tasa').textContent = fmtPct(DAP_ANUAL, 1);
      if ($('#d-base')) $('#d-base').textContent = 'Calculado con un depósito a plazo a 365 días renovable (' + fmtPct(DAP_ANUAL, 1) + ' anual).';
      $('#p-warn').hidden = !(P.serie && P.monto && P.monto < SERIES[P.serie].minimo);
      $('#p-pref').hidden = true; $('#r-nota-uf').hidden = !(P.serie && SERIES[P.serie].uf); $('#r-uf').textContent = fmtCLP(UF);
      return;
    }
    var r = calcular(), s = SERIES[P.serie];
    window.__pulsoMonto = r.monto;
    $('#p-warn').hidden = !(P.monto && P.monto < s.minimo);
    $('#r-estrategia').textContent = s.nombre;
    $('#r-monto').textContent = fmtCLP(r.monto);
    $('#r-plazo').textContent = P.plazo + ' meses';
    $('#r-tasa').textContent = (s.uf ? 'UF + ' : '') + fmtPct(tasa(), 1) + ' mensual';
    $('#r-total').textContent = fmtCLP(r.total);
    $('#r-ganancia').textContent = '+' + fmtCLP(r.ganancia);
    $('#d-total').textContent = fmtCLP(r.dapTotal);
    $('#d-dap').textContent = '+' + fmtCLP(r.dapGanancia);
    $('#d-monto').textContent = fmtCLP(r.monto);
    $('#d-plazo').textContent = P.plazo + ' meses';
    $('#p-pref').hidden = r.monto < 250000000;
    $('#d-tasa').textContent = fmtPct(DAP_ANUAL, 1);
    if ($('#d-base')) $('#d-base').textContent = 'Calculado a ' + P.plazo + ' meses, en base a un depósito a 365 días renovable (' + fmtPct(DAP_ANUAL, 1) + ' anual).';
    $('#r-nota-uf').hidden = !s.uf;
    $('#r-uf').textContent = fmtCLP(UF);
  }
  window.__pulsoProyectaRender = render;
  function resumen() {
    var r = calcular(), s = SERIES[P.serie];
    return 'Alternativa: Renta de Capital · ' + s.nombre + '\nMonto: ' + fmtCLP(r.monto) + '\nPlazo: ' + P.plazo + ' meses' +
      (s.retiro ? '\nRetiros trimestrales: ' + (P.retiro ? 'Sí' : 'No') : '') + '\nRentabilidad: ' + (s.uf ? 'UF + ' : '') + fmtPct(tasa(), 1) + ' mensual' +
      '\nTotal a recibir (referencial): ' + fmtCLP(r.total) + '\nGanancia: ' + fmtCLP(r.ganancia) +
      '\nDepósito a plazo a ' + P.plazo + ' meses: ganancia ' + fmtCLP(r.dapGanancia) + ' (simulado en base a un depósito a 365 días renovable, ' + fmtPct(DAP_ANUAL, 1) + ' anual)';
  }
  root.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-serie]'))) { P.serie = b.getAttribute('data-serie'); var s = SERIES[P.serie]; P.plazo = null; if (P.monto) P.monto = Math.max(P.monto, s.minimo); P.retiro = null; renderSeries(); render(); }
    else if ((b = e.target.closest('[data-plazo]'))) { P.plazo = +b.getAttribute('data-plazo'); renderSeries(); render(); }
    else if ((b = e.target.closest('[data-monto]'))) { P.monto = +b.getAttribute('data-monto'); render(); }
    else if ((b = e.target.closest('[data-retiro]'))) { P.retiro = b.getAttribute('data-retiro') === '1'; renderSeries(); render(); }
  });
  $('#p-monto').addEventListener('input', function (e) {
    P.monto = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
    e.target.value = P.monto ? fmtCLP(P.monto) : '';
    render(true);
  });
  $('#p-monto').addEventListener('blur', function () { if (P.monto) P.monto = montoEf(); render(); });
  $('#p-correo').addEventListener('click', function () {
    var st = $('#p-status'), btn = $('#p-correo');
    if (!completo()) { st.textContent = 'Completa estrategia, monto y plazo antes de enviar.'; return; }
    if (!contacto) { if (EQUIPO) pedirDatos($('#p-correo')); return; }
    if (!jspdfListo(st)) return;
    var r = calcular(), sr = SERIES[P.serie];
    var resumenTxt = resumen();
    var doc = pdfSimple('Simulación Renta de Capital', 'Resultado referencial', [
      { t: 'Tu simulación', rows: [['Alternativa', 'Renta de Capital · ' + sr.nombre], ['Monto a invertir', fmtCLP(r.monto)], ['Plazo', P.plazo + ' meses'],
        ['Rentabilidad', (sr.uf ? 'UF + ' : '') + fmtPct(tasa(), 1) + ' mensual']].concat(sr.retiro ? [['Retiros trimestrales', P.retiro ? 'Sí' : 'No']] : []) },
      { t: 'Con Pulso Inversor', rows: [['Total a recibir', fmtCLP(r.total)], ['Ganancia', '+' + fmtCLP(r.ganancia), 'pos']] },
      { t: 'En un depósito a plazo a ' + P.plazo + ' meses', rows: [['Plazo', P.plazo + ' meses'], ['Base del cálculo', 'Depósito a 365 días renovable'], ['Tasa referencial', fmtPct(DAP_ANUAL, 1) + ' anual'], ['Total a recibir', fmtCLP(r.dapTotal)], ['Ganancia', '+' + fmtCLP(r.dapGanancia), 'red']] },
      { t: 'Tus próximos pasos', proximos: true },
      { t: 'Supuestos', small: true, text: DISCLAIMER + ' Depósito a plazo: calculado a ' + P.plazo + ' meses, el mismo plazo de tu simulación, en base a un depósito a 365 días renovable (' + fmtPct(DAP_ANUAL, 1) + ' anual), renovado al vencimiento con interés compuesto; para plazos que no son años completos, el último período se calcula en proporción al tiempo.' + (sr.uf ? ' Hipoteca y Título se reajustan en UF (UF ' + fmtCLP(UF) + ', IPC estimado 4,5% anual).' : '') }
    ], { tipo: 'Renta de Capital', monto: r.monto });
    enviarCorreo('proyecta', doc, 'Simulacion_RentaDeCapital', resumenTxt.split('\n'), st, btn, r.monto);
  });
  renderSeries(); render();

  })();

  if ($('#sim-hipoteca')) (function () {
  /* =========================================================
     Hipoteca Inteligente
     ========================================================= */
  var tractionData = [
    { name: '21 de Mayo', comuna: 'Peñaflor', tas: 7091.92, fin: 5673.536 },
    { name: 'Elías Fernández Albano', comuna: 'La Cisterna', tas: 13296.3, fin: 10637.04 },
    { name: 'Oxford', comuna: 'La Florida', tas: 12000, fin: 9600 },
    { name: 'El Retiro', comuna: 'Loncoche', tas: 14643, fin: 11714.4 },
    { name: 'Lican Ray', comuna: 'Villarrica', tas: 5346, fin: 4276.8 },
    { name: 'Rinconada', comuna: 'Los Andes', tas: 11309, fin: 9047.2 },
    { name: 'Bombero R. Cornejo', comuna: 'Recoleta', tas: 7780, fin: 6224 },
    { name: 'Las Perdices', comuna: 'Puente Alto', tas: 24857, fin: 19885.6 },
    { name: 'San Francisco Chacabuco', comuna: 'Colina', tas: 6488.4, fin: 5190.72 }
  ];
  var patrimonyData = [
    { name: 'Apóstol Santiago', comuna: 'Estación Central', tas: 1950, fin: 1560, saldo3: 1451.49, saldo5: 1370.58, rent: 8.2, div: 9.516, admin: .656 },
    { name: 'Exequiel Fernández', comuna: 'Ñuñoa', tas: 3120, fin: 2496, saldo3: 2322.38, saldo5: 2192.93, rent: 13.38, div: 15.2256, admin: 1.0704 },
    { name: 'Patricio Lynch', comuna: 'Quinta Normal', tas: 1749, fin: 1399.2, saldo3: 1301.87, saldo5: 1229.31, rent: 9.22, div: 8.53512, admin: .7376 },
    { name: 'Av. Valparaíso', comuna: 'Quillota', tas: 2518, fin: 2014.4, saldo3: 1874.28, saldo5: 1769.81, rent: 12.4, div: 12.28784, admin: .992 },
    { name: 'San Diego', comuna: 'Santiago', tas: 2370, fin: 1896, saldo3: 1764.12, saldo5: 1665.79, rent: 10.2, div: 11.5656, admin: .816 },
    { name: 'Merced', comuna: 'Quillota', tas: 1635, fin: 1308, saldo3: 1217.02, saldo5: 1149.18, rent: 9.4, div: 7.9788, admin: .752 },
    { name: 'Santa Amalia', comuna: 'La Florida', tas: 3575, fin: 2860, saldo3: 2661.06, saldo5: 2512.74, rent: 14.9, div: 17.446, admin: 1.192 },
    { name: 'Manutara', comuna: 'Cerrillos', tas: 4500, fin: 3600, saldo3: 3349.59, saldo5: 3162.88, rent: 16.6, div: 21.96, admin: 1.328 },
    { name: 'Las Quemas', comuna: 'Osorno', tas: 7071, fin: 5656.8, saldo3: 5263.32, saldo5: 4969.95, rent: 32, div: 34.50648, admin: 2.56 },
    { name: 'Camino Playa Blanca', comuna: 'Caburgua', tas: 3482, fin: 2785.6, saldo3: 2591.84, saldo5: 2447.37, rent: 12.6, div: 16.99216, admin: 1.008 }
  ];
  var COST = { vac: 1, contrib: .0008, mant: .0004 };
  var H = { tr: null, years: null, capacity: 0, selected: [], decisions: {}, tractionOnly: null, open: {} };
  var fmt = function (v) { return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(v); };
  var uf = function (v) { return fmt(v) + ' UF'; };
  var signed = function (v) { return (v >= 0 ? '+' : '−') + uf(Math.abs(v)); };
  var sgn = function (v) { return (v >= 0 ? '+' : '−') + fmt(Math.abs(v)); };
  var cls = function (v) { return v >= 0 ? 'pos' : 'neg'; };
  var r1 = function (v) { return Math.round(v * 10) / 10; };
  var dec = function (i) { return H.decisions[i] || 'keep'; };
  var parseUF = function (v) { var t = String(v == null ? '' : v).replace(/[^\d.,]/g, ''); if (!t) return 0; if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); var n = parseFloat(t); return isFinite(n) ? n : 0; };
  function amortAt(p, y) { var a3 = p.fin - p.saldo3, a5 = p.fin - p.saldo5; if (y <= 3) return a3 * (y / 3); return a3 + (a5 - a3) * ((y - 3) / 2); }
  function calcPat(p) {
    var monthly = p.rent - p.div - p.admin, op = monthly * H.years * 12, vacancy = -(p.rent * COST.vac * H.years),
      contributions = -(p.tas * COST.contrib * H.years), maintenance = -(p.tas * COST.mant * H.years);
    return { monthly: monthly, op: op, vacancy: vacancy, contributions: contributions, maintenance: maintenance, totalCost: op + vacancy + contributions + maintenance, amort: amortAt(p, H.years) };
  }
  var tractionReturn = function () { return H.tr === null || !H.years ? 0 : tractionData[H.tr].fin * .05 * H.years; };
  var hiBody = $('#hi-body'), hiCap = $('#hi-cap-form');

  function renderTraction() {
    var t = H.tr === null ? null : tractionData[H.tr], ret = tractionReturn();
    $('#hi-traction').value = H.tr === null ? '' : H.tr;
    var row = function (a, b) { return '<div class="hi-row"><span>' + a + '</span><b>' + b + '</b></div>'; };
    if (!t || !H.years) {
      $('#hi-tmetrics').innerHTML = row('Tasación', t ? uf(t.tas) : '—') + row('Monto de inversión · 80%', t ? uf(t.fin) : '—') + row('Interés', '5% anual simple') + row('Plazo elegido', H.years ? H.years + ' años' : '—');
      $('#hi-retlabel').textContent = 'Retorno acumulado'; $('#hi-retval').textContent = '—';
      $('#hi-years').innerHTML = [2, 3, 4, 5].map(function (y) { return '<button type="button" data-year="' + y + '" class="hi-year' + (y === H.years ? ' is-active' : '') + '" aria-pressed="' + (y === H.years) + '"><small>' + y + ' años</small><b>' + (t ? uf(t.fin * .05 * y) : '—') + '</b></button>'; }).join('');
      $('#hi-capdisplay').textContent = H.capacity > 0 ? uf(H.capacity) : '—';
      return;
    }
    $('#hi-tmetrics').innerHTML = row('Tasación', uf(t.tas)) + row('Monto de inversión · 80%', uf(t.fin)) + row('Interés', '5% anual simple') + row('Plazo elegido', H.years + ' años');
    $('#hi-retlabel').textContent = 'Retorno acumulado · ' + H.years + ' años';
    $('#hi-retval').textContent = signed(ret);
    $('#hi-years').innerHTML = [2, 3, 4, 5].map(function (y) { return '<button type="button" data-year="' + y + '" class="hi-year' + (y === H.years ? ' is-active' : '') + '" aria-pressed="' + (y === H.years) + '"><small>' + y + ' años</small><b>' + uf(t.fin * .05 * y) + '</b></button>'; }).join('');
    $('#hi-capdisplay').textContent = H.capacity > 0 ? uf(H.capacity) : '—';
  }
  function renderTable() {
    var lleno = H.selected.length >= 2;
    var rows = patrimonyData.map(function (p, i) {
      var flow = p.rent - p.div - p.admin, sel = H.selected.indexOf(i) >= 0, dis = p.fin > H.capacity, lock = lleno && !sel && !dis;
      var decision = dis ? '<span class="hi-na">No disponible</span>' : '<select data-purpose="' + i + '" aria-label="Decisión al cierre para ' + esc(p.name) + '"><option value="keep"' + (dec(i) === 'keep' ? ' selected' : '') + '>Conservar</option><option value="sell"' + (dec(i) === 'sell' ? ' selected' : '') + '>Activar recompra</option></select>';
      return '<div class="hi-prow' + (sel ? ' sel' : '') + (dis ? ' dis' : '') + (lock ? ' lock' : '') + '"><input type="checkbox" data-property="' + i + '"' + (sel ? ' checked' : '') + (dis || lock ? ' disabled' : '') + ' aria-label="Seleccionar ' + esc(p.name) + '">' +
        '<div class="hi-pinfo"><b>' + esc(p.name) + '</b><span>' + esc(p.comuna) + ' · Tasación ' + uf(p.tas) + '</span><span>Financiamiento: ' + uf(p.fin) + '</span><em class="hi-pill' + (dis ? ' bad' : '') + '">' + (dis ? 'Supera tu capacidad' : 'Disponible') + '</em></div>' +
        '<div class="hi-flow ' + (flow >= 0 ? 'pos' : 'neg') + '">' + sgn(flow) + '<small>UF/mes</small></div><div class="hi-dec">' + decision + '</div></div>';
    }).join('');
    $('#hi-table').innerHTML = (lleno ? '<p class="hi-full">Ya elegiste dos propiedades. Desmarca una para cambiarla.</p>' : '') + '<div class="hi-ptable"><div class="hi-prow head"><span></span><span>Propiedad</span><span>Flujo</span><span>Decisión al cierre</span></div>' + rows + '</div>';
  }
  function conclusion(picks, available, kept, soldAmort, invA, pulA, realized) {
    var keepN = picks.filter(function (x) { return x.d === 'keep'; }).length, sellN = picks.length - keepN, plazo = H.years + ' años';
    if (keepN === picks.length) return 'Elegiste conservar las propiedades para construir patrimonio. Al término de ' + plazo + ' mantienes ' + (keepN === 1 ? 'una propiedad administrada' : keepN + ' propiedades administradas') + ' con el 100% del equity generado, equivalente a ' + signed(kept) + '. Además, tienes ' + signed(available) + ' de retorno disponible.';
    if (sellN === picks.length) return 'Elegiste activar la recompra para priorizar liquidez. La amortización acumulada de ' + signed(soldAmort) + ' se distribuye en partes iguales: ' + signed(invA) + ' para ti; ' + signed(pulA) + ' para Pulso Inversor. Tu capital líquido estimado al término de ' + plazo + ' es ' + signed(realized) + '.';
    return 'Elegiste combinar patrimonio con liquidez. Conservas una propiedad con ' + signed(kept) + ' de equity; de la otra, activas la recompra. De la amortización recomprada, tú recibes ' + signed(invA) + '; Pulso Inversor recibe ' + signed(pulA) + '. Tu capital líquido estimado es ' + signed(realized) + '.';
  }
  function renderResult() {
    if (H.tr === null || !H.years) { H.quote = null; $('#hi-result').innerHTML = '<div class="hi-empty"><strong>Tu resultado aparecerá aquí</strong><p>Elige la propiedad Tracción, el plazo y hasta dos propiedades del Portafolio Patrimonio.</p></div>'; return; }
    var ret = tractionReturn(), months = H.years * 12, t = tractionData[H.tr];
    var picks = H.selected.map(function (i) { return { i: i, p: patrimonyData[i], d: dec(i), c: calcPat(patrimonyData[i]) }; });
    var d = function (a, b, k, sub) { return '<div class="hi-drow ' + (k || '') + '"><span>' + a + (sub ? '<em>' + sub + '</em>' : '') + '</span><b>' + b + '</b></div>'; };
    var pdfBar = '<div class="hi-actions"><button class="btn btn-primary" id="hi-pdf" type="button">Enviar al correo</button></div><p class="sim-status" id="hi-pdfstatus" role="status"></p><p class="sim-aut">Al completar tus datos personales, Pulso Inversor SpA podrá usarlos para contactarte y entregarte opciones de inversión, además de verificar el funcionamiento de la plataforma. Si quieres saber más sobre el uso y resguardo de tu información, revisa nuestra <a href="/privacidad" target="_blank">Política de privacidad</a>.</p>';
    if (!picks.length) {
      var ok = H.tractionOnly === true;
      var concl0 = 'Elegiste enfocarte solo en el retorno del Portafolio Tracción. Al término de ' + H.years + ' años, el retorno acumulado estimado es ' + signed(ret) + ', sin propiedades del Portafolio Patrimonio ni equity asociado.';
      H.summary = { tractionReturn: r1(ret), available: r1(ret), realized: r1(ret), keptEquity: 0, investorAmort: 0 };
      H.quote = ok ? { tractionOnly: true, picks: [], ret: ret, available: ret, realized: ret, kept: 0, conclusionText: concl0 } : null;
      $('#hi-result').innerHTML = '<p class="hi-sum">' + esc(t.name) + ' · Inversión ' + uf(t.fin) + ' · Plazo ' + H.years + ' años</p><div class="hi-dark"><h4>Resultado económico · ' + H.years + ' años</h4>' + d('Retorno Tracción', signed(ret)) + d('Retorno disponible', signed(ret), 'total') + '</div>' +
        (ok ? '<div class="hi-concl"><strong>Conclusión de tu elección</strong>' + concl0 + '</div><button type="button" class="hi-link" id="hi-change">Cambiar decisión</button>' + pdfBar
          : '<div class="hi-warn" role="alert"><strong>¿Tu objetivo es solo el retorno del Portafolio Tracción?</strong><p>No seleccionaste propiedades del Portafolio Patrimonio. Confírmalo para generar la cotización o vuelve a elegir propiedades.</p><div class="hi-actions"><button type="button" class="btn btn-dark" id="hi-ok">Sí, solo Tracción</button><button type="button" class="btn btn-outline" id="hi-no">No, seguir simulando</button></div></div>');
      return;
    }
    H.tractionOnly = null;
    var sum = function (f) { return picks.reduce(function (s, x) { return s + f(x); }, 0); };
    var flowAccum = sum(function (x) { return x.c.op; }), vacancy = sum(function (x) { return x.c.vacancy; }), contributions = sum(function (x) { return x.c.contributions; }), maintenance = sum(function (x) { return x.c.maintenance; });
    var available = ret + flowAccum + vacancy + contributions + maintenance;
    var soldAmort = picks.filter(function (x) { return x.d === 'sell'; }).reduce(function (s, x) { return s + x.c.amort; }, 0), invA = soldAmort * .5, pulA = soldAmort * .5;
    var kept = picks.filter(function (x) { return x.d === 'keep'; }).reduce(function (s, x) { return s + x.c.amort; }, 0), realized = available + invA;
    var keepP = picks.filter(function (x) { return x.d === 'keep'; }), sellP = picks.filter(function (x) { return x.d === 'sell'; });
    var conclText = conclusion(picks, available, kept, soldAmort, invA, pulA, realized);
    H.summary = { tractionReturn: r1(ret), available: r1(available), realized: r1(realized), keptEquity: r1(kept), investorAmort: r1(invA) };
    H.quote = { picks: picks, ret: ret, flowAccum: flowAccum, vacancy: vacancy, contributions: contributions, maintenance: maintenance, available: available, soldAmort: soldAmort, investorAmort: invA, pulsoAmort: pulA, kept: kept, realized: realized, allKeep: keepP.length === picks.length, allSell: sellP.length === picks.length, conclusionText: conclText };
    var dr = function (a, b, k) { return '<div class="hi-det-row ' + (k || '') + '"><span>' + a + '</span><b>' + b + '</b></div>'; };
    var cards = picks.map(function (x) {
      var keep = x.d === 'keep';
      return '<div class="hi-pcard' + (keep ? '' : ' sell') + '"><div class="hi-pc-head">' + esc(x.p.name) + ' · ' + (keep ? 'Conservar' : 'Activar recompra') + '</div>' +
        '<div class="hi-pc-grid"><div><strong class="' + cls(x.c.op) + '">' + signed(x.c.op) + '</strong><small>' + sgn(x.c.monthly) + ' UF mensuales × ' + months + ' meses</small></div>' +
        '<div><small>Amortización a ' + months + ' meses</small><strong class="pos">' + signed(x.c.amort) + '</strong><small>Saldo del crédito: ' + uf(x.p.fin - x.c.amort) + '</small></div></div>' +
        (keep ? '' : '<div class="hi-share">Tu participación · 50%: ' + signed(x.c.amort * .5) + '</div>') +
        '<details class="hi-pdet" data-det="' + x.i + '"' + (H.open[x.i] ? ' open' : '') + '><summary>Ver detalle</summary><div>' +
        '<p>Flujo mensual</p>' + dr('Arriendo', signed(x.p.rent)) + dr('Dividendo', signed(-x.p.div)) + dr('Administración', signed(-x.p.admin)) + dr('Flujo mensual', signed(x.c.monthly), 'tot') +
        '<p>Costos del período · ' + H.years + ' años</p>' + dr('Flujo acumulado · ' + months + ' meses', signed(x.c.op)) + dr('Vacancia · 1 mes/año', signed(x.c.vacancy)) + dr('Contribuciones · 0,08% anual de la tasación', signed(x.c.contributions)) + dr('Mantención y reparaciones · 0,04% anual', signed(x.c.maintenance)) + dr('Total de la propiedad', signed(x.c.totalCost), 'tot') +
        '<p>Crédito</p>' + dr('Financiamiento', uf(x.p.fin)) + dr('Amortización acumulada', signed(x.c.amort)) + dr('Saldo al cierre', uf(x.p.fin - x.c.amort), 'tot') + '</div></details></div>';
    }).join('');
    $('#hi-result').innerHTML = '<p class="hi-sum">' + picks.map(function (x) { return esc(x.p.name); }).join(' y ') + ' · Plazo ' + H.years + ' años</p>' + cards +
      '<div class="hi-dark"><h4>Resultado económico · ' + H.years + ' años</h4>' + d('Retorno Tracción', signed(ret)) + d('Flujo acumulado', signed(flowAccum)) + d('Vacancia · 1 mes/año', signed(vacancy)) + d('Contribuciones', signed(contributions)) + d('Mantención y reparaciones', signed(maintenance)) + d('Retorno disponible', signed(available), 'total') + '</div>' +
      '<p class="hi-dlabel">La decisión es tuya</p><div class="hi-choices">' +
      '<div class="hi-choice' + (keepP.length ? ' on' : '') + '"><small>Conservar · 100% equity</small>' + (keepP.length ? '<p>' + keepP.map(function (x) { return esc(x.p.name); }).join(' y ') + '</p><p>' + uf(kept) + ' amortizadas</p><em>Mantienes la propiedad y el 100% del equity generado.</em>' : '<em>Ninguna propiedad marcada para conservar.</em>') + '</div>' +
      '<div class="hi-choice sell' + (sellP.length ? ' on' : '') + '"><small>Activar recompra · 50%</small>' + (sellP.length ? '<p>' + sellP.map(function (x) { return esc(x.p.name); }).join(' y ') + '</p><p>50% de ' + uf(soldAmort) + ' = ' + uf(invA) + '</p><em>El otro 50% (' + uf(pulA) + ') corresponde a Pulso Inversor.</em>' : '<em>Ninguna propiedad marcada para recompra.</em>') + '</div></div>' +
      '<div class="hi-closing"><h4>Al cierre · ' + H.years + ' años</h4>' + dr('Retorno disponible', signed(available)) + (sellP.length ? dr('Recompra · 50% de la amortización', signed(invA)) : '') + dr('Capital líquido estimado', signed(realized), 'tot') + (keepP.length ? dr('Equity conservado', signed(kept)) : '') + '</div>' +
      '<div class="hi-concl"><strong>Conclusión de tu elección</strong>' + conclText + '</div>' + pdfBar;
  }
  function renderHI() { renderTraction(); renderTable(); renderResult(); }

  $('#hi-traction').innerHTML = '<option value="" disabled selected>Elige una propiedad</option>' + tractionData.map(function (p, i) { return '<option value="' + i + '">' + esc(p.name) + ' · ' + esc(p.comuna) + ' · ' + uf(p.tas) + '</option>'; }).join('');
  $('#hi-traction').addEventListener('change', function (e) { H.tr = e.target.value === '' ? null : +e.target.value; renderHI(); });
  $('#hi-years').addEventListener('click', function (e) { var b = e.target.closest('[data-year]'); if (!b) return; H.years = +b.getAttribute('data-year'); renderHI(); });
  $('#hi-table').addEventListener('change', function (e) {
    var t = e.target, note = $('#hi-note');
    if (t.matches('[data-property]')) {
      var i = +t.getAttribute('data-property');
      if (t.checked && H.selected.length >= 2) { t.checked = false; note.textContent = 'Puedes seleccionar un máximo de dos propiedades. Desmarca una para elegir otra.'; note.classList.add('error'); return; }
      note.textContent = 'El flujo incorpora arriendo, dividendo y administración.'; note.classList.remove('error');
      H.selected = t.checked ? H.selected.concat([i]) : H.selected.filter(function (x) { return x !== i; });
      renderTable(); renderResult();
    } else if (t.matches('[data-purpose]')) { H.decisions[+t.getAttribute('data-purpose')] = t.value; renderResult(); }
  });
  $('#hi-result').addEventListener('click', function (e) {
    if (e.target.closest('#hi-pdf')) return generarPDF();
    if (e.target.closest('#hi-ok')) { H.tractionOnly = true; renderResult(); return; }
    if (e.target.closest('#hi-no') || e.target.closest('#hi-change')) { H.tractionOnly = null; renderResult(); $('#hi-table').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  });
  $('#hi-result').addEventListener('toggle', function (e) { var det = e.target.closest && e.target.closest('.hi-pdet'); if (!det) return; H.open[+det.getAttribute('data-det')] = det.open; }, true);

  // Capacidad financiera: se pide antes de mostrar Hipoteca Inteligente.
  function formatCap(el) { var t = el.value.replace(/[^\d,]/g, ''), k = t.indexOf(','), ent = k < 0 ? t : t.slice(0, k), d = k < 0 ? '' : t.slice(k + 1).replace(/,/g, '').slice(0, 2); ent = ent.replace(/^0+(?=\d)/, ''); el.value = ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (k < 0 ? '' : ',' + d); }
  $('#hi-cap').addEventListener('input', function (e) { formatCap(e.target); });
  function setHiLocked(locked) {
    hiBody.classList.toggle('is-locked', locked);
    if (locked) hiBody.setAttribute('inert', ''); else hiBody.removeAttribute('inert');
    hiCap.classList.toggle('is-done', !locked);
  }
  hiCap.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = parseUF($('#hi-cap').value), err = $('#hi-caperr');
    if (!(v > 0)) { err.textContent = 'Ingresa tu capacidad financiera por crédito en UF (por ejemplo, 3.000).'; $('#hi-cap').classList.add('invalid'); return; }
    err.textContent = ''; $('#hi-cap').classList.remove('invalid');
    H.capacity = v; H.selected = H.selected.filter(function (i) { return patrimonyData[i].fin <= H.capacity; });
    ses.set('pulsoCapacidad', v);
    if (contacto) sheet('lead', { name: contacto.nombre, phone: contacto.telefono, email: contacto.email, capacityUF: v, consent: true });
    setHiLocked(false); renderHI();
  });
  var capGuardada = ses.get('pulsoCapacidad');
  if (capGuardada > 0) { H.capacity = capGuardada; $('#hi-cap').value = fmt(capGuardada); setHiLocked(false); } else { setHiLocked(true); }
  renderHI();

  /* ---------- Cotización en PDF (igual al simulador original) ---------- */
  function folio() { var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); }; return 'PI-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '-' + Math.random().toString(36).slice(2, 5).toUpperCase(); }
  var pt = function (s) { return String(s).replace(/−/g, '-'); };
  function generarPDF() {
    var status = $('#hi-pdfstatus'), qd = H.quote;
    if (!qd) { status.textContent = 'Selecciona una propiedad o confirma que tu objetivo es solo el retorno de Tracción.'; return; }
    if (!jspdfListo(status)) return;
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var C = { deep: [24, 76, 63], lime: [191, 212, 30], limeSoft: [244, 248, 226], goldSoft: [253, 246, 227], text: [20, 63, 55], muted: [107, 125, 119], line: [221, 228, 224], pos: [42, 107, 79], neg: [179, 67, 44], soft: [238, 242, 239] };
    var W = 210, M = 16, CW = W - 2 * M, y = 0, fol = folio(), fecha = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }), t = tractionData[H.tr];
    var font = function (sz, st, k) { doc.setFont('helvetica', st || 'normal'); doc.setFontSize(sz); doc.setTextColor.apply(doc, C[k || 'text']); };
    var ensure = function (h) { if (y + h > 276) { doc.addPage(); y = 18; } };
    var section = function (title, need) { ensure(18 + (need || 0)); y += 4; doc.setFillColor.apply(doc, C.lime); doc.rect(M, y, 12, 1.4, 'F'); y += 6; font(12, 'bold'); doc.text(title, M, y); y += 5; };
    var kv = function (label, value, color) { ensure(8); font(9.5, 'normal', 'muted'); doc.text(label, M, y + 4.5); font(9.5, 'bold', color || 'text'); doc.text(pt(value), M + CW, y + 4.5, { align: 'right' }); y += 7; doc.setDrawColor.apply(doc, C.line); doc.setLineWidth(.2); doc.line(M, y, M + CW, y); };
    var para = function (txt, sz, k) { font(sz || 9, 'normal', k || 'muted'); var l = doc.splitTextToSize(pt(txt), CW); ensure(l.length * 4.2 + 2); doc.text(l, M, y + 4); y += l.length * 4.2 + 2; };
    var logo = $('#sim-logo');
    try { var lw = 92, lh = lw * logo.naturalHeight / logo.naturalWidth; doc.addImage(logo, 'PNG', M, 9, lw, lh, undefined, 'FAST'); } catch (e) { font(12, 'bold'); doc.text('Pulso Inversor', M, 17); }
    font(9, 'bold'); doc.text('Folio ' + fol, W - M, 14, { align: 'right' }); font(9, 'normal', 'muted'); doc.text(fecha, W - M, 19.5, { align: 'right' });
    doc.setFillColor.apply(doc, C.deep); doc.rect(0, 28, W, 20, 'F'); doc.setFillColor.apply(doc, C.lime); doc.rect(0, 48, W, 1.6, 'F');
    font(17, 'bold'); doc.setTextColor(255, 255, 255); doc.text('Cotización Hipoteca Inteligente', M, 39.5);
    font(9, 'normal'); doc.setTextColor(207, 224, 217); doc.text('Simulación referencial en UF', W - M, 39.5, { align: 'right' }); y = 56;
    var montoHI = Math.round(t.fin * UF);
    y = pdfIntro(doc, y, M, CW, 'Hipoteca Inteligente');
    section('Preparada para'); kv('Nombre', contacto ? contacto.nombre : ''); kv('Teléfono', contacto ? '+56 ' + contacto.telefono : ''); kv('Correo electrónico', contacto ? contacto.email : ''); kv('Capacidad financiera declarada', uf(H.capacity) + ' por crédito');
    section('Portafolio Tracción · genera el retorno'); kv('Propiedad', t.name + ' · ' + t.comuna); kv('Tasación', uf(t.tas)); kv('Monto de inversión · 80%', uf(t.fin)); kv('Interés', '5% anual simple'); kv('Plazo', H.years + ' años'); kv('Retorno acumulado', signed(qd.ret), 'pos');
    if (qd.tractionOnly) { section('Portafolio Patrimonio', 10); para('El cliente no seleccionó propiedades del Portafolio Patrimonio. La simulación considera solo el retorno del Portafolio Tracción.', 9.5, 'text'); }
    else {
      section('Portafolio Patrimonio · propiedades elegidas', 46);
      qd.picks.forEach(function (x) {
        var keep = x.d === 'keep', h = keep ? 41 : 46; ensure(h + 4);
        doc.setFillColor.apply(doc, keep ? C.soft : C.goldSoft); doc.setDrawColor.apply(doc, keep ? C.line : [240, 214, 140]); doc.setLineWidth(.3); doc.roundedRect(M, y, CW, h, 2.5, 2.5, 'FD');
        font(10.5, 'bold'); doc.text(x.p.name + ' · ' + (keep ? 'Conservar' : 'Activar recompra'), M + 5, y + 7);
        font(8.5, 'normal', 'muted'); doc.text(x.p.comuna + ' · Tasación ' + uf(x.p.tas) + ' · Financiamiento ' + uf(x.p.fin), M + 5, y + 12.5);
        var cx = [M + 5, M + 5 + CW / 3, M + 5 + 2 * CW / 3];
        var cell = function (i, label, val, k) { font(8, 'normal', 'muted'); doc.text(label, cx[i], y + 20); font(12, 'bold', k); doc.text(pt(val), cx[i], y + 26.5); };
        cell(0, 'Flujo mensual', signed(x.c.monthly), x.c.monthly >= 0 ? 'pos' : 'neg'); cell(1, 'Flujo acumulado · ' + H.years * 12 + ' meses', signed(x.c.op), x.c.op >= 0 ? 'pos' : 'neg'); cell(2, 'Amortización acumulada', signed(x.c.amort), 'pos');
        font(8, 'normal', 'muted'); doc.text(pt('Arriendo ' + uf(x.p.rent) + '/mes · Dividendo -' + uf(x.p.div) + '/mes · Administración -' + uf(x.p.admin) + '/mes'), M + 5, y + 32);
        doc.text(pt('Vacancia ' + signed(x.c.vacancy) + ' · Contribuciones ' + signed(x.c.contributions) + ' · Mantención ' + signed(x.c.maintenance) + ' · Saldo al cierre ' + uf(x.p.fin - x.c.amort)), M + 5, y + 37);
        if (!keep) { font(8.5, 'bold'); doc.setTextColor(168, 111, 0); doc.text('Participación inversionista · 50% de la amortización: ' + pt(signed(x.c.amort * .5)), M + 5, y + 42.5); }
        y += h + 4;
      });
    }
    var rows = qd.tractionOnly ? [['Retorno Tracción', signed(qd.ret)]] : [['Retorno Tracción', signed(qd.ret)], ['Flujo acumulado', signed(qd.flowAccum)], ['Vacancia · 1 mes/año', signed(qd.vacancy)], ['Contribuciones', signed(qd.contributions)], ['Mantención y reparaciones', signed(qd.maintenance)]];
    var bh = rows.length * 7 + 14; section('Resultado económico · ' + H.years + ' años', bh);
    doc.setFillColor.apply(doc, C.deep); doc.roundedRect(M, y, CW, bh, 2.5, 2.5, 'F');
    var yy = y + 8; rows.forEach(function (r) { font(9.5, 'normal'); doc.setTextColor(255, 255, 255); doc.text(r[0], M + 6, yy); doc.setFont('helvetica', 'bold'); doc.text(pt(r[1]), M + CW - 6, yy, { align: 'right' }); doc.setDrawColor(70, 112, 100); doc.setLineWidth(.2); doc.line(M + 6, yy + 2.6, M + CW - 6, yy + 2.6); yy += 7; });
    font(10.5, 'bold'); doc.setTextColor(255, 255, 255); doc.text('Retorno disponible', M + 6, yy + 1); doc.text(pt(signed(qd.available)), M + CW - 6, yy + 1, { align: 'right' }); y += bh + 4;
    if (!qd.tractionOnly) {
      section('Resultado al cierre', 30);
      kv('Retorno disponible', signed(qd.available)); if (qd.soldAmort) kv('Recompra · 50% de la amortización', signed(qd.investorAmort)); kv('Capital líquido estimado', signed(qd.realized), 'pos'); if (qd.kept) kv('Equity conservado', signed(qd.kept));
    }
    section('Conclusión'); para(qd.conclusionText, 9.5, 'text');
    y = pdfProximos(doc, y + 6, M, CW, montoHI);
    section('Supuestos y condiciones', 22);
    para(DISCLAIMER + ' Simulación en UF. Considera una vacancia promedio de 1 mes por año; contribuciones estimadas en 0,08% anual de la tasación; mantención y reparaciones estimadas en 0,04% anual. En la recompra, la amortización acumulada se distribuye en partes iguales entre el inversionista y Pulso Inversor. Los valores definitivos dependen de cada propiedad y de la tabla bancaria aplicable. Este documento no constituye una aprobación de crédito.', 8.5);
    var n = doc.getNumberOfPages(); for (var i = 1; i <= n; i++) { doc.setPage(i); doc.setDrawColor.apply(doc, C.line); doc.setLineWidth(.2); doc.line(M, 286, W - M, 286); font(7.5, 'normal', 'muted'); doc.text('Pulso Inversor · Cotización ' + fol, M, 291); doc.text('Página ' + i + ' de ' + n, W - M, 291, { align: 'right' }); }
    doc.__folio = fol;
    var resumenHI = ['Propiedad Tracción: ' + t.name + ' (' + t.comuna + ')', 'Plazo: ' + H.years + ' años', 'Capacidad declarada: ' + uf(H.capacity) + ' por crédito',
      'Retorno disponible: ' + pt(signed(qd.available)), 'Capital líquido estimado: ' + pt(signed(qd.realized))].concat(qd.picks.map(function (x) { return 'Patrimonio: ' + x.p.name + ' · ' + (x.d === 'keep' ? 'Conservar' : 'Activar recompra'); }));
    enviarCorreo('hipoteca', doc, 'Cotizacion_HipotecaInteligente', resumenHI, status, $('#hi-pdf'), montoHI);
    var pk = qd.picks.map(function (x) { return { name: x.p.name, financingUF: x.p.fin, decision: x.d === 'keep' ? 'Conservar' : 'Activar recompra' }; });
    if (contacto) sheet('quote', Object.assign({ name: contacto.nombre, phone: contacto.telefono, email: contacto.email, capacityUF: H.capacity, consent: true, folio: fol, traction: t.name, tractionComuna: t.comuna, years: H.years, p1: pk[0] || null, p2: pk[1] || null }, H.summary || {}));
  }

  })();

  /* =========================================================
     Inversión Inmobiliaria Circular
     Modelo replicado del simulador de referencia (artifact de diseño).
     Muestra solo lo esencial: capital neto, ingreso mensual, flujo actual,
     barras "¿Con cuánto terminas?" y la TIR a 5 y 10 años.
     ========================================================= */
  (function () {
    if (!$('#ic-form')) return;
    // Supuestos de referencia (fijos)
    var FIJOS = { discount: 15, sellcost: 0, quarterrate: 1.1, monthrate: 1, base: 'market', inflation: 3, growth: 0, rentgrowth: 3,
      maintenance: 150000, turnyears: 3, vacancydays: 42, repairs: 1200000, guarantee: 1 };
    function payment(p, r, n) { return p <= 0 ? 0 : r === 0 ? p / n : p * r / (1 - Math.pow(1 + r, -n)); }
    function loanRate(p, a, n) { if (p <= 0) return 0; if (a * n < p - 1) throw new Error('El dividendo y las cuotas que te quedan no alcanzan para pagar la deuda. Revisa esos datos.'); var lo = 0, hi = 1; for (var j = 0; j < 100; j++) { var m = (lo + hi) / 2; if (payment(p, m, n) > a) hi = m; else lo = m; } return (lo + hi) / 2; }
    function irr(cf) { if (cf[0] >= 0 || !cf.slice(1).some(function (v) { return v > 0; })) return null; var npv = function (r) { return cf.reduce(function (s, v, i) { return s + v * Math.exp(-i * Math.log1p(r)); }, 0); }; var lo = -.5, hi = 1; if (npv(lo) < 0 || npv(hi) > 0) return null; for (var j = 0; j < 120; j++) { var m = (lo + hi) / 2; if (npv(m) > 0) lo = m; else hi = m; } return Math.pow(1 + (lo + hi) / 2, 12) - 1; }
    function compute(x, years) {
      years = years || x.years;
      var months = Math.round(years * 12), sale = x.value * (1 - x.discount / 100), net = sale * (1 - x.sellcost / 100) - x.debt;
      var equity = x.value - x.debt, base = x.base === 'net' ? net : equity;
      var newprice = x.newvalue * (1 - x.discount / 100), loan = Math.min(newprice, x.newvalue * x.ltv / 100), upfront = newprice - loan + newprice * x.buycost / 100, ret = x.retiro || 0, inv = net - ret, invest = net - upfront - ret;
      var q = x.frequency === 'quarterly' ? 3 : 1, rate = (q === 3 ? x.quarterrate : x.monthrate) / 100;
      var loans = x.loans.map(function (l) { var r; try { r = loanRate(l.debt, l.pay, l.months); } catch (e) { throw new Error(l.name + ': ' + e.message); } return { bal: l.debt, pay: l.pay, months: l.months, r: r }; }), newrate = x.rate / 1200;
      var newpayment = payment(loan, newrate, x.term * 12), infl = x.inflation / 100, app = (1 + infl) * (1 + x.growth / 100);
      var bal = x.debt, newbal = loan, flows = [[-base], [-base], [-base]], series = [[], [], []], totals = [0, 0, 0];
      var rentAt = function (r, m) { return r * Math.pow(1 + x.rentgrowth / 100, Math.floor((m - 1) / 12)); };
      var parts = function (r, m, k) { k = k || 1; if (m % 12) return { vac: 0, maint: 0, rep: 0 }; var year = m / 12, f = Math.pow(1 + infl, year - 1), turn = year % x.turnyears === 0; return { vac: turn ? Math.max(0, (x.vacancydays / 30 - x.guarantee) * r) : 0, maint: x.maintenance * f * k, rep: turn ? x.repairs * f * k : 0 }; };
      var expense = function (r, m) { var p = parts(r, m); return p.vac + p.maint + p.rep; };
      var keepFirstYear = 0;
      for (var t = 0; t <= months; t++) {
        if (t) {
          var idx0 = Math.pow(1 + infl, (t - 1) / 12), oldpaid = 0; bal = 0;
          loans.forEach(function (l) { var p = t <= l.months && l.bal > 0 ? Math.min(l.pay, l.bal * (1 + l.r)) : 0; oldpaid += p; l.bal = Math.max(0, l.bal * (1 + l.r) - p); bal += l.bal; });
          var np = t <= x.term * 12 && newbal > 0 ? Math.min(newpayment, newbal * (1 + newrate)) : 0; newbal = Math.max(0, newbal * (1 + newrate) - np);
          var rent = rentAt(x.rent, t), newrent = rentAt(x.newrent, t), payout = t % q === 0 ? q * rate : 0;
          var kp = parts(rent, t, x.nprops), kdiv = oldpaid * idx0 + (x.flatpayment || 0) * idx0;
          if (t <= 12) keepFirstYear += rent - kdiv - kp.vac - kp.maint - kp.rep;
          var last = [rent - kdiv - kp.vac - kp.maint - kp.rep, inv * payout, invest * payout + (x.purchase ? newrent - np * idx0 - expense(newrent, t) : 0)];
          for (var i = 0; i < 3; i++) { flows[i].push(last[i]); totals[i] += last[i]; }
        }
        var idx = Math.pow(1 + infl, t / 12), v = x.value * Math.pow(app, t / 12), nv = x.newvalue * Math.pow(app, t / 12);
        series[0].push(v - bal * idx); series[1].push(net); series[2].push(invest + ret + (x.purchase ? nv - newbal * idx : 0));
      }
      if (months % q) { var acc = rate * (months % q); flows[1][months] += inv * acc; flows[2][months] += invest * acc; totals[1] += inv * acc; totals[2] += invest * acc; }
      var end = series.map(function (a) { return a[a.length - 1]; }); flows.forEach(function (a, i) { a[months] += end[i]; });
      if (ret) [1, 2].forEach(function (i) { flows[i][0] += ret; flows[i][months] -= ret; });
      var propEnd = x.value * Math.pow(app, years);
      return { keepFirstYear: keepFirstYear, propEnd: propEnd, plusvalia: propEnd - x.value, base: base, sale: sale, net: net, invest: invest, bal: bal * Math.pow(1 + infl, years),
        totals: totals, end: end, tirs: flows.map(irr), rate: rate, q: q, inv: inv, ret: ret, monthly: inv * rate, payout: inv * rate * q };
    }

    var MONEY = ['newvalue', 'newrent', 'retiro'];
    var X = { frequency: null, years: 10, purchase: false }; // barras «¿Con cuánto terminas?» a 10 años; TIR a 5 y 10 años
    var editoNueva = false;
    var num = function (id) { var el = $('#ic-' + id); return MONEY.indexOf(id) >= 0 ? Number(el.value.replace(/\D/g, '')) : Number(el.value); };
    var money = function (n) { n = Math.round(n || 0); return (n < 0 ? '−$' : '$') + Math.abs(n).toLocaleString('es-CL'); };
    var compact = function (n) { return '$' + (n / 1e6).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' MM'; };
    var pct = function (n) { return n === null ? 'No calculable' : (n * 100).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'; };
    var pct1 = function (n) { return n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'; };
    var anios = function (n) { return n + (n === 1 ? ' año' : ' años'); };
    var INV_MIN = 25000000, RETIRO_MAX = 0.3; // retiro: hasta 30% del capital y dejando al menos $25 MM invertidos
    var DESC_MAX = 20; // el descuento de venta nunca pasa de 20%
    var DESC_MIN = 15; // bajo este descuento la operación no es atractiva para el inversionista (rango objetivo 15% a 20% o algo más)
    function inputs() {
      var props = leerProps().filter(function (p) { return p.value || p.rent || p.pay || p.debt || p.months || p.modo; });
      var x = { props: props, nprops: Math.max(1, props.length), value: 0, rent: 0, oldpayment: 0, debt: 0, flatpayment: 0, loans: [],
        retiro: num('retiro'), newvalue: num('newvalue'), newrent: num('newrent'), ltv: num('ltv'), term: num('term'), rate: num('rate'), buycost: num('buycost'),
        frequency: X.frequency, years: X.years, purchase: X.purchase };
      props.forEach(function (p) { x.value += p.value; x.rent += p.rent; x.oldpayment += p.pay; x.debt += p.debt;
        if (p.debt > 0) x.loans.push({ name: p.name, debt: p.debt, pay: p.pay, months: p.months }); else x.flatpayment += p.pay; });
      Object.keys(FIJOS).forEach(function (k) { x[k] = FIJOS[k]; });
      return x;
    }
    function err(msg) { var e = $('#ic-error'); e.textContent = msg; e.hidden = false; $('#ic-results').classList.add('is-stale'); }
    var ultimo = null;
    function render() {
      $('#ic-error').hidden = true; $('#ic-warning').hidden = true; $('#ic-results').classList.remove('is-stale');
      $$('[data-ic-freq]').forEach(function (b) { var on = b.getAttribute('data-ic-freq') === X.frequency; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
      $('#ic-purchasefields').hidden = !X.purchase;
      $$('#ic-props .ic-prop').forEach(function (c) { var m = c.getAttribute('data-modo'); $$('[data-debt]', c).forEach(function (b) { var on = b.getAttribute('data-debt') === m; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); }); c.querySelector('[data-debtfields]').hidden = m !== 'yes'; });
      var x = inputs(), varias = x.props.length > 1, sinModo = x.props.filter(function (p) { return !p.modo; });
      $('#ic-total').hidden = !varias;
      if (varias) $('#ic-total').innerHTML = x.props.length + ' propiedades · tasación total <b>' + money(x.value) + '</b> · arriendos <b>' + money(x.rent) + '</b> · dividendos <b>' + money(x.oldpayment) + '</b>' + (x.debt ? ' · deuda <b>' + money(x.debt) + '</b>' : '');
      var falta = !X.frequency || !(x.value > 0) || (sinModo.length > 0 && !varias);
      $('#ic-results').classList.toggle('is-empty', falta);
      $('#ic-correo').disabled = falta;
      if (falta) {
        ['ic-k-net', 'ic-k-monthly', 'ic-k-flow'].forEach(function (id) { $('#' + id).textContent = '—'; });
        $('#ic-desc').hidden = true; $('#ic-anual').innerHTML = '<tr><td colspan="3" class="ic-empty">Aquí verás tu ingreso del primer año en cada alternativa.</td></tr>';
        $('#ic-k-monthly-sub').textContent = 'Según cada cuánto recibas tus intereses';
        $('#ic-gain').hidden = true;
        $('#ic-summary').textContent = 'Completa los datos de tu propiedad y elige cada cuánto quieres recibir tus intereses para ver tu resultado.';
        $('#ic-period').textContent = 'Proyección a 5 años';
        $('#ic-bars-title').textContent = '¿Con cuánto terminas?';
        $('#ic-bars').innerHTML = '<p class="ic-empty">Aquí verás cuánto terminas teniendo en cada alternativa.</p>';
        $('#ic-tir').innerHTML = '<tr><td colspan="3" class="ic-empty">Aquí verás la TIR de cada alternativa.</td></tr>';
        $('#ic-bars').closest('.ic-card').hidden = false; $('#ic-tir').closest('.ic-card').hidden = false;
        $('#ic-base').textContent = ''; ultimo = null; return;
      }
      if (sinModo.length) return err(sinModo[0].name + ': indica si tiene deuda.');
      for (var k = 0; k < x.props.length; k++) {
        var pr = x.props[k];
        if (pr.modo === 'yes' && !(pr.debt > 0)) return err(pr.name + ': ingresa cuánto debes hoy, o elige «Sin deuda».');
        if (!(pr.value >= 1000000)) return err(pr.name + ': ingresa su valor de tasación.');
        if (pr.debt > 0 && !(pr.months > 0)) return err(pr.name + ': ingresa cuántas cuotas le quedan.');
        if (pr.debt > 0 && !(pr.pay > 0)) return err(pr.name + ': ingresa el dividendo que pagas.');
        if (pr.debt >= pr.value) return err(pr.name + ': la deuda debe ser menor a su valor.');
      }
      if (X.purchase && !(x.newvalue > 0 && x.ltv >= 0 && x.term > 0)) return err('Completa los datos de la nueva propiedad.');
      // Simulador inverso: la meta es duplicar el ingreso mensual actual (arriendo menos dividendo).
      // El descuento de venta es el resultado: el precio que deja, descontada la deuda, el capital que da el doble.
      var flujoActual = x.rent - x.oldpayment, meta = 2 * flujoActual, tasaMes = (X.frequency === 'quarterly' ? x.quarterrate : x.monthrate) / 100;
      var conMeta = flujoActual > 0, capitalMeta = conMeta ? meta / tasaMes : 0;
      if (conMeta) x.discount = (1 - (capitalMeta + x.debt) / x.value) * 100;
      var logra = !conMeta || x.discount >= DESC_MIN; // duplica con un descuento viable
      var sobre = conMeta && x.discount > DESC_MAX;   // con el tope de descuento, el ingreso queda sobre el doble
      if (!logra) x.discount = DESC_MIN;
      if (sobre) x.discount = DESC_MAX;
      var capVenta = x.value * (1 - x.discount / 100) * (1 - x.sellcost / 100) - x.debt, retMax = Math.max(0, Math.min(RETIRO_MAX * capVenta, capVenta - INV_MIN));
      if (x.retiro > retMax) { x.retiro = Math.floor(retMax); $('#ic-retiro').value = x.retiro > 0 ? x.retiro.toLocaleString('es-CL') : ''; }
      $('#ic-retiro-hint').textContent = retMax > 0 ? 'Puedes retirar hasta ' + money(Math.floor(retMax)) + '.' : 'Con este capital no es posible retirar: la inversión debe quedar en al menos ' + money(INV_MIN) + '.';
      var c, c5, c10;
      try { c = compute(x); c5 = compute(x, 5); c10 = compute(x, 10); } catch (e) { return err(e.message); }
      if (c.net <= 0) return err('La venta no libera capital después del descuento y el prepago. Revisa los valores.');
      var cicloOk = !X.purchase || c.invest >= 0, avisos = [];
      if (!cicloOk) avisos.push('El pie de la nueva compra supera el capital liberado: el ciclo con nueva propiedad no es viable con estos datos.');
      if (avisos.length) { $('#ic-warning').textContent = avisos.join(' '); $('#ic-warning').hidden = false; }
      $('#ic-k-net').textContent = compact(c.inv);
      $('#ic-k-net-sub').textContent = c.ret ? 'Retiras ' + money(c.ret) + ' en efectivo' : 'Lo que queda de la venta, descontada la deuda';
      $('#ic-k-monthly').textContent = money(c.monthly);
      $('#ic-k-monthly-sub').textContent = X.frequency === 'quarterly' ? 'Pago efectivo trimestral: ' + money(c.payout) : 'Pago mensual';
      $('#ic-k-flow').textContent = money(flujoActual);
      $('#ic-desc').hidden = false; $('#ic-desc').classList.toggle('warn', false);
      $('#ic-d-pct').textContent = pct1(x.discount);
      $('#ic-d-txt').innerHTML = (varias ? 'Tus propiedades se venden en <b>' : 'Tu propiedad se vende en <b>') + money(c.sale) + '</b>, ' + money(x.value - c.sale) + ' bajo ' + (varias ? 'su tasación total' : 'su tasación') + ' de ' + money(x.value) + '.' + (conMeta ? (sobre ? ' Es el descuento máximo de la operación.' : logra ? '' : ' Es el descuento mínimo de la operación.') : ' Descuento de referencia.');
      // Primer año: el aumento de liquidez es inmediato.
      var anualHoy = flujoActual * 12, anualPulso = c.monthly * 12;
      $('#ic-anual').innerHTML = '<tr><td>Hoy, con tus arriendos*</td><td>' + money(flujoActual) + '</td><td>' + money(anualHoy) + '</td></tr>' +
        '<tr class="hl"><td>Con Pulso Inversor</td><td>' + money(c.monthly) + '</td><td>' + money(anualPulso) + '</td></tr>' +
        '<tr><td>Diferencia en tu primer año</td><td>' + (c.monthly - flujoActual >= 0 ? '+' : '−') + money(Math.abs(c.monthly - flujoActual)) + '</td><td>' + (anualPulso - anualHoy >= 0 ? '+' : '−') + money(Math.abs(anualPulso - anualHoy)) + '</td></tr>';
      var dif = c.monthly - flujoActual;
      var g = $('#ic-gain');
      g.hidden = false; g.classList.toggle('neg', dif < 0);
      g.innerHTML = dif >= 0
        ? '<span class="ic-gain-k">Con el modelo Pulso Inversor</span><strong>Tu ingreso mensual aumenta <b>+' + money(dif) + '</b></strong><span>De ' + money(flujoActual) + ' a ' + money(c.monthly) + ' al mes' + (conMeta ? ' · ' + (c.monthly / flujoActual).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' veces lo que recibes hoy' : '') + '</span>'
        : '<span class="ic-gain-k">Con el modelo Pulso Inversor</span><strong>Tu ingreso mensual sería ' + money(Math.abs(dif)) + ' menor</strong><span>De ' + money(flujoActual) + ' a ' + money(c.monthly) + ' al mes, antes de costos</span>';
      $('#ic-summary').textContent = 'Invirtiendo ' + money(c.inv) + ' en Pulso Inversor, a ' + (c.rate * 100).toLocaleString('es-CL', { minimumFractionDigits: 1 }) + '% mensual simple. Ese capital sale de vender en ' + money(c.sale) + (x.debt ? ' y prepagar ' + money(x.debt) + ' de deuda' : '') + (c.ret ? ', y retiras ' + money(c.ret) + ' en efectivo' : '') + '. La comparación es frente al arriendo menos dividendo, antes de mantención y vacancia.';
      $('#ic-period').textContent = 'Proyección a 5 años';
      // Barras: ¿con cuánto terminas?
      var nombres = ['Si conservas y arriendas', 'Si vendes e inviertes en Pulso Inversor', 'Si vendes, inviertes y compras otra propiedad'];
      var pa = [(varias ? (x.debt ? 'Tus propiedades, descontada la deuda' : 'Valor de tus propiedades') : (x.debt ? 'Tu propiedad, descontada la deuda' : 'Valor de tu propiedad')) + ' (incluye plusvalía de ' + compact(c.plusvalia) + ')', c.ret ? 'Capital invertido y retiro en efectivo' : 'Capital invertido', c.ret ? 'Capital invertido, retiro y nueva propiedad' : 'Capital invertido y nueva propiedad'];
      var pb = ['Arriendos netos recibidos', 'Intereses recibidos', 'Intereses y arriendos netos recibidos'];
      var n = X.purchase ? 3 : 2, filas = [];
      for (var i = 0; i < n; i++) { if (i === 2 && !cicloOk) { filas.push({ i: i, nv: true }); continue; } filas.push({ i: i, a: c.end[i], b: c.totals[i], t: c.end[i] + c.totals[i] }); }
      var ok = filas.filter(function (r) { return !r.nv; }), max = Math.max.apply(null, [1].concat(ok.map(function (r) { return Math.max(0, r.a) + Math.max(0, r.b); })));
      var best = ok.reduce(function (m, r) { return r.t > m.t ? r : m; }, ok[0]);
      $('#ic-bars-title').textContent = '¿Con cuánto terminas en ' + anios(X.years) + '?';
      $('#ic-bars').innerHTML = filas.map(function (r) {
        if (r.nv) return '<div class="cb-row"><div class="cb-head"><b>' + nombres[r.i] + '</b><span class="cb-nv">No viable con estos datos</span></div></div>';
        return '<div class="cb-row' + (r === best ? ' is-best' : '') + '"><div class="cb-head"><b>' + nombres[r.i] + (ok.length > 1 && r === best ? '<span class="cb-best">Mayor resultado</span>' : '') + '</b><span class="cb-total">' + compact(r.t) + '</span></div>' +
          '<div class="cb-track" role="img" aria-label="' + nombres[r.i] + ': ' + compact(r.t) + '"><span class="cb-a" style="width:' + (Math.max(0, r.a) / max * 100).toFixed(2) + '%"></span><span class="cb-b" style="width:' + (Math.max(0, r.b) / max * 100).toFixed(2) + '%"></span></div>' +
          '<p class="cb-detail">' + pa[r.i] + ': <b>' + compact(r.a) + '</b> · ' + (r.b >= 0 ? pb[r.i] + ': <b>' + compact(r.b) + '</b>' : '<span class="neg">Pagaste ' + compact(-r.b) + ' más de lo que recibiste</span>') + '</p></div>';
      }).join('');
      // TIR
      var tnames = ['Conservar y arrendar', 'Vender, prepagar e invertir', 'Ciclo completo con nueva compra'];
      $('#ic-tir').innerHTML = tnames.slice(0, n).map(function (nm, i) { var nv = i === 2 && !cicloOk; return '<tr><td>' + nm + '</td><td>' + (nv ? 'No viable' : pct(c5.tirs[i])) + '</td><td>' + (nv ? 'No viable' : pct(c10.tirs[i])) + '</td></tr>'; }).join('');
      // Se muestran las tablas donde vender (Pulso Inversor) obtiene el mejor resultado.
      var barrasPulso = !!best && best.i > 0;
      var tir10 = function (i) { var v = c10.tirs[i]; return v === null || (i === 2 && !cicloOk) ? -Infinity : v; };
      var tirPulso = [1, 2].slice(0, n - 1).some(function (i) { return tir10(i) > tir10(0); });
      $('#ic-bars').closest('.ic-card').hidden = !barrasPulso;
      $('#ic-tir').closest('.ic-card').hidden = !tirPulso;
      $('#ic-base').textContent = 'Base inicial común: ' + money(c.base) + '. Patrimonio actual (valor comercial' + (x.debt ? ' menos deuda' : '') + '). La TIR reconoce el descuento de venta.';
      ultimo = { x: x, c: c, c5: c5, c10: c10, n: n, cicloOk: cicloOk, flujoActual: flujoActual, conMeta: conMeta, logra: logra, sobre: sobre, barrasPulso: barrasPulso, tirPulso: tirPulso, best: best ? nombres[best.i] : '' };
    }
    // Propiedades: una tarjeta por departamento o casa; se pueden agregar y quitar.
    function moneyIn(f, ph) { return '<div class="money-in"><span>$</span><input data-f="' + f + '" inputmode="numeric" autocomplete="off" placeholder="' + ph + '"></div>'; }
    function tarjeta() {
      var el = document.createElement('fieldset'); el.className = 'ic-prop';
      el.innerHTML = '<legend></legend><button type="button" class="ic-del" aria-label="Quitar">Quitar</button>' +
        '<span class="pro-label">¿Tiene deuda?</span><div class="pro-yesno"><button type="button" class="chip-opt" data-debt="no">Sin deuda</button><button type="button" class="chip-opt" data-debt="yes">Con deuda</button></div>' +
        '<label class="pro-label">Valor de tasación</label>' + moneyIn('value', '0') +
        '<label class="pro-label">Arriendo al mes</label>' + moneyIn('rent', '0') +
        '<div class="ic-sub" data-debtfields hidden><label class="pro-label">¿Cuánto pagas de dividendo al mes?</label>' + moneyIn('pay', '0') +
        '<label class="pro-label">¿Cuánto debes hoy? <small>Saldo de prepago que informa tu banco.</small></label>' + moneyIn('debt', 'Ej. 40.000.000') +
        '<label class="pro-label">¿Cuántas cuotas te quedan?</label><input data-f="months" type="number" inputmode="numeric" min="1" max="600" placeholder="Ej. 225"></div>';
      $('#ic-props').appendChild(el); numerar(); return el;
    }
    function numerar() {
      var cards = $$('#ic-props .ic-prop');
      cards.forEach(function (c, i) { c.querySelector('legend').textContent = cards.length > 1 ? 'Propiedad ' + (i + 1) : 'Tu propiedad'; c.querySelector('.ic-del').hidden = cards.length < 2; c.querySelector('.ic-del').setAttribute('aria-label', 'Quitar propiedad ' + (i + 1)); });
    }
    function leerProps() {
      return $$('#ic-props .ic-prop').map(function (c, i) {
        var v = function (f) { var e = c.querySelector('[data-f="' + f + '"]'); return Number(e.value.replace(/\D/g, '')) || 0; };
        var modo = c.getAttribute('data-modo') || '', con = modo === 'yes';
        return { name: $$('#ic-props .ic-prop').length > 1 ? 'Propiedad ' + (i + 1) : 'Tu propiedad', modo: modo, value: v('value'), rent: v('rent'), pay: con ? v('pay') : 0, debt: con ? v('debt') : 0, months: con ? v('months') : 0 };
      });
    }
    tarjeta();
    $('#ic-add').addEventListener('click', function () { var el = tarjeta(); el.querySelector('[data-f="value"]').focus(); render(); });
    $('#ic-props').addEventListener('click', function (e) {
      var d = e.target.closest('[data-debt]');
      if (d) { d.closest('.ic-prop').setAttribute('data-modo', d.getAttribute('data-debt')); render(); return; }
      var b = e.target.closest('.ic-del'); if (!b) return; b.closest('.ic-prop').remove(); numerar(); render();
    });
    $('#ic-form').addEventListener('input', function (e) {
      var f = e.target.getAttribute('data-f');
      if ((f && f !== 'months') || MONEY.indexOf(e.target.id.replace('ic-', '')) >= 0) { var raw = e.target.value.replace(/\D/g, ''); e.target.value = raw ? Number(raw).toLocaleString('es-CL') : ''; }
      if (e.target.id === 'ic-newvalue') editoNueva = true;
      if (f === 'value' && !editoNueva) { var pv = leerProps()[0]; $('#ic-newvalue').value = Math.round((pv ? pv.value : 0) * .8).toLocaleString('es-CL'); }
      render();
    });
    $('#ic-form').addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-ic-freq]'))) { X.frequency = b.getAttribute('data-ic-freq'); render(); }
    });
    $('#ic-purchase').addEventListener('change', function (e) { X.purchase = e.target.checked; render(); });
    $('#ic-form').addEventListener('submit', function (e) { e.preventDefault(); });
    render();

    $('#ic-correo').addEventListener('click', function () {
      var st = $('#ic-status'), btn = $('#ic-correo');
      render();
      if (!contacto || !ultimo || !$('#ic-error').hidden || $('#ic-results').classList.contains('is-empty')) { st.textContent = 'Completa los datos del simulador antes de enviar.'; return; }
      if (!jspdfListo(st)) return;
      var u = ultimo, x = u.x, c = u.c;
      var filasTir = ['Conservar y arrendar', 'Vender, prepagar e invertir', 'Ciclo completo con nueva compra'].slice(0, u.n).map(function (nm, i) { var nv = i === 2 && !u.cicloOk; return [nm, (nv ? 'No viable' : pct(u.c5.tirs[i])) + ' (5 años) · ' + (nv ? 'No viable' : pct(u.c10.tirs[i])) + ' (10 años)']; });
      var resumenIC = [(x.props.length > 1 ? x.props.length + ' propiedades, tasación total: ' : 'Valor de la propiedad: ') + money(x.value), 'Deuda: ' + money(x.debt), 'Ingreso mensual hoy: ' + money(u.flujoActual), 'Nuevo ingreso mensual: ' + money(c.monthly),
        'Capital a invertir: ' + money(c.inv), 'Retiro en efectivo: ' + money(c.ret), 'Descuento de venta resultante: ' + pct1(x.discount) + (u.conMeta && !u.logra ? ' (mínimo de la operación)' : u.sobre ? ' (máximo de la operación)' : ''), 'Mayor resultado: ' + u.best];
      var doc = pdfSimple('Simulación Inversión Circular', 'Proyección a 5 años', [
        { t: x.props.length > 1 ? 'Tus propiedades' : 'Tu propiedad', rows: (x.props.length > 1 ? x.props.map(function (p) { return [p.name, 'Tasación ' + money(p.value) + ' · arriendo ' + money(p.rent) + ' · dividendo ' + money(p.pay) + (p.debt ? ' · deuda ' + money(p.debt) : '')]; }) : []).concat([['Valor comercial' + (x.props.length > 1 ? ' total' : ''), money(x.value)], ['Arriendo mensual', money(x.rent)], ['Dividendo mensual', money(x.oldpayment)], ['Deuda a prepagar', money(x.debt)]]) },
        { t: 'Lo esencial', rows: [['Tu ingreso mensual hoy*', money(u.flujoActual)], ['Tu nuevo ingreso mensual con Pulso Inversor', money(c.monthly), 'pos'], [x.frequency === 'quarterly' ? 'Pago efectivo trimestral' : 'Pago mensual', money(x.frequency === 'quarterly' ? c.payout : c.monthly)], ['Capital a invertir', money(c.inv)], ['Retiro en efectivo', c.ret ? money(c.ret) : 'Sin retiro'], ['Descuento aplicado a la venta', pct1(x.discount) + ' sobre la tasación'], ['Precio de venta estimado', money(c.sale)]] },
        { t: 'Tu primer año', rows: [['Hoy, con tus arriendos*', money(u.flujoActual * 12) + ' al año'], ['Con Pulso Inversor', money(c.monthly * 12) + ' al año', 'pos'], ['Diferencia en tu primer año', money((c.monthly - u.flujoActual) * 12)]] },
        { t: 'Resumen', text: $('#ic-summary').textContent },
        u.barrasPulso && { t: '¿Con cuánto terminas en ' + anios(x.years) + '?', rows: [['Si conservas y arriendas', compact(c.end[0] + c.totals[0])], ['Si vendes e inviertes en Pulso Inversor', compact(c.end[1] + c.totals[1])]].concat(u.n === 3 && u.cicloOk ? [['Si vendes, inviertes y compras otra', compact(c.end[2] + c.totals[2])]] : []).concat([['Mayor resultado', u.best, 'pos']]) },
        u.tirPulso && { t: 'TIR anual efectiva', rows: filasTir },
        { t: 'Tus próximos pasos', proximos: true },
        { t: 'Supuestos', small: true, text: $('#ic-base').textContent + ' *El ingreso actual por arriendo corresponde a condiciones normales y puede disminuir por vacancia, mantenciones o contribuciones. El descuento de venta resulta de cada caso, entre 15% y 20% (' + pct1(x.discount) + ' sobre la tasación). Inflación 3% anual; arriendo reajustado 3% anual; mantención, vacancia y reparaciones estimadas. Proyectar diez años exige continuidad de tasa, condiciones y cumplimiento de pagos. La nueva compra es opcional y se evalúa por separado. ' + DISCLAIMER }
      ].filter(Boolean), { tipo: 'Inversión Inmobiliaria Circular', monto: c.inv });
      enviarCorreo('circular', doc, 'Simulacion_InversionCircular', resumenIC, st, btn, c.inv);
    });
  })();

  /* =========================================================
     Simulador de Arquitectura de Capital (antes "Simulador Patrimonial")
     Propiedades con su precio de venta (descuento ya incluido) → financiamiento bancario → evolución patrimonial.
     ========================================================= */
  (function () {
    if (!$('#sim-patrimonial')) return;
    // Propiedades publicadas en pulsopropiedades.cl (planilla del 18-11-2026): tasación y precio de venta en UF.
    var CATALOGO = [
      { n: 'Las Quemas', c: 'Osorno', cod: 44, tas: 7800, precio: 6286.7 },
      { n: 'Miraflores 1125', c: 'Peñaflor', cod: 80, tas: 4447, precio: 3890 },
      { n: 'Pdte. Balmaceda', c: 'Padre Hurtado', cod: 95, tas: 3737, precio: 1813.5 },
      { n: 'Santa Amalia', c: 'La Florida', cod: 50, tas: 3575, precio: 3190 },
      { n: 'Merced', c: 'Quillota', cod: 40, tas: 2900, precio: 2190 },
      { n: 'San Diego', c: 'Santiago', cod: 43, tas: 2357, precio: 1990 },
      { n: 'Apóstol Santiago', c: 'Estación Central', cod: 85, tas: 1950, precio: 1400 },
      { n: 'Lynch', c: 'Quinta Normal', cod: 63, tas: 1800, precio: 1650 }
    ];
    var ADMIN = .10, COBERTURA = .05;
    var S = { sel: [], ltv: null, plazo: 25 };
    var nf = function (v, d) { return new Intl.NumberFormat('es-CL', { maximumFractionDigits: d || 0, minimumFractionDigits: 0 }).format(v); };
    var ufs = function (v) { return nf(Math.round(v)) + ' UF'; };
    var clp = function (v) { return '$' + nf(Math.round(v)); };
    var pct = function (v) { return nf(v, 1) + '%'; };
    var descDe = function (p) { return (1 - p.precio / p.tas) * 100; };
    var dec = function (id) { var t = String($(id).value || '').replace(/[^\d,\.]/g, '').replace(',', '.'); var n = parseFloat(t); return isFinite(n) ? n : 0; };
    $('#sp-props').innerHTML = CATALOGO.map(function (p, i) {
      return '<button type="button" class="sp-item" data-sp-prop="' + i + '" aria-pressed="false"><span class="sp-box" aria-hidden="true">✓</span>' +
        '<span class="sp-item-t"><strong>' + esc(p.n) + ', ' + esc(p.c) + '</strong><small>Tasación ' + nf(p.tas, 1) + ' UF · Cód. ' + p.cod + '</small></span>' +
        '<b>' + nf(p.precio, 1) + ' UF<small class="sp-desc">−' + pct(descDe(p)) + '</small></b></button>';
    }).join('');

    function calc() {
      var props = S.sel.slice().sort(function (a, b) { return a - b; }).map(function (i) { return CATALOGO[i]; });
      var tas = props.reduce(function (a, p) { return a + p.tas; }, 0);
      var precio = props.reduce(function (a, p) { return a + p.precio; }, 0);
      var tasa = dec('#sp-tasa'), renta = dec('#sp-renta');
      var r = { props: props, tas: tas, precio: precio, tasa: tasa, renta: renta };
      r.listo = tas > 0 && S.ltv !== null && S.plazo > 0 && tasa >= 0 && tasa < 30;
      if (!r.listo) return r;
      r.desc = (1 - precio / tas) * 100;
      r.credito = tas * S.ltv / 100;
      r.aporte = r.precio - r.credito;
      var i = tasa / 100 / 12, n = S.plazo * 12;
      r.div = i === 0 ? r.credito / n : r.credito * i / (1 - Math.pow(1 + i, -n));
      var saldo = function (k) { return Math.max(0, i === 0 ? r.credito * (1 - k / n) : r.credito * Math.pow(1 + i, k) - r.div * (Math.pow(1 + i, k) - 1) / i); };
      r.evol = [0, 5, 10, 15, 20, 25, 30].filter(function (y) { return y <= S.plazo; }).map(function (y) { var d = saldo(y * 12); return { y: y, deuda: d, pat: tas - d }; });
      if (renta > 0) { r.costos = renta * (ADMIN + COBERTURA); r.flujo = renta - r.costos - r.div; }
      return r;
    }
    function render() {
      var r = calc();
      $$('[data-sp-prop]').forEach(function (b) { var on = S.sel.indexOf(+b.getAttribute('data-sp-prop')) >= 0; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
      $('#sp-total').innerHTML = r.tas ? '<span>' + r.props.length + (r.props.length === 1 ? ' propiedad' : ' propiedades') + ' · Tasación ' + ufs(r.tas) + '</span><strong>' + ufs(r.precio) + '</strong>' : '<span>Toca una o más propiedades para sumarlas</span>';
      [['data-sp-ltv', S.ltv], ['data-sp-plazo', S.plazo]].forEach(function (x) {
        $$('[' + x[0] + ']').forEach(function (b) { var on = +b.getAttribute(x[0]) === x[1]; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
      });
      $('#sp-enviar').disabled = !r.listo;
      $('#sp-out').classList.toggle('is-empty', !r.listo);
      $('#sp-falta').hidden = r.listo;
      if (!r.listo) {
        $('#sp-fin').innerHTML = '';
        $('#sp-evo').innerHTML = '<p class="sp-empty">Aquí verás cómo baja la deuda y crece tu patrimonio.</p>';
        $('#sp-evo-sub').textContent = 'Sin plusvalía.';
        return;
      }
      var row = function (a, b, k) { return '<li class="' + (k || '') + '"><span>' + a + '</span><strong>' + b + '</strong></li>'; };
      var signo = function (v) { return v < 0 ? '−' : ''; };
      $('#sp-fin').innerHTML =
        '<div class="sp-hero"><small>' + (r.aporte >= 0 ? 'Tu aporte al precio' : 'El crédito supera el precio en') + '</small><strong>' + ufs(Math.abs(r.aporte)) + '</strong><span>≈ ' + clp(Math.abs(r.aporte) * UF) + '</span></div>' +
        '<ul class="sp-rows">' +
          row('Tasación total', ufs(r.tas)) +
          row('Precio de compra (−' + pct(r.desc) + ')', ufs(r.precio)) +
          row('Crédito del banco (' + S.ltv + '% de la tasación)', ufs(r.credito)) +
          row('Dividendo mensual', nf(r.div, 1) + ' UF') +
          (r.renta > 0 ? row('Flujo mensual (arriendo menos administración, cobertura y dividendo)', signo(r.flujo) + nf(Math.abs(r.flujo), 1) + ' UF', r.flujo < 0 ? 'neg' : 'pos') : '') +
        '</ul>';
      $('#sp-evo-sub').textContent = 'Crédito a ' + S.plazo + ' años al ' + nf(r.tasa, 2) + '% real anual, sin plusvalía.';
      $('#sp-evo').innerHTML = r.evol.filter(function (e) { return e.y <= 20; }).map(function (e) {
        var wd = (e.deuda / r.tas * 100).toFixed(2), wp = (e.pat / r.tas * 100).toFixed(2), et = e.y ? 'Año ' + e.y : 'Hoy';
        return '<div class="sp-bar"><span class="sp-y">' + et + '</span><div class="sp-track" role="img" aria-label="' + et + ': deuda ' + ufs(e.deuda) + ', patrimonio ' + ufs(e.pat) + '"><i class="d" style="width:' + wd + '%"></i><i class="p" style="width:' + wp + '%"></i></div><b>' + ufs(e.pat) + '</b></div>';
      }).join('');
    }
    var spPanel = $('#sim-patrimonial');
    spPanel.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-sp-prop]'))) { var i = +b.getAttribute('data-sp-prop'), k = S.sel.indexOf(i); if (k >= 0) S.sel.splice(k, 1); else S.sel.push(i); render(); }
      else if ((b = e.target.closest('[data-sp-ltv]'))) { S.ltv = +b.getAttribute('data-sp-ltv'); render(); }
      else if ((b = e.target.closest('[data-sp-plazo]'))) { S.plazo = +b.getAttribute('data-sp-plazo'); render(); }
    });
    ['#sp-tasa', '#sp-renta'].forEach(function (id) { $(id).addEventListener('input', function (e) { e.target.value = e.target.value.replace(/[^\d,]/g, ''); render(); }); });
    render();

    $('#sp-enviar').addEventListener('click', function () {
      var st = $('#sp-status'), btn = $('#sp-enviar'), r = calc();
      if (!r.listo) { st.textContent = 'Elige las propiedades y el financiamiento antes de enviar.'; return; }
      if (!contacto) { if (EQUIPO) pedirDatos(btn); return; }
      if (!jspdfListo(st)) return;
      var monto = r.tas * UF;
      var filasEvo = r.evol.map(function (e) { return [e.y + ' años', 'Deuda ' + ufs(e.deuda) + ' · Patrimonio ' + ufs(e.pat)]; });
      var fin = [['Tasación total', ufs(r.tas)], ['Precio de compra (−' + pct(r.desc) + ')', ufs(r.precio)], ['Crédito bancario (' + S.ltv + '% de la tasación)', ufs(r.credito)],
        [r.aporte >= 0 ? 'Aporte al precio' : 'El crédito supera el precio en', ufs(Math.abs(r.aporte))], ['Dividendo mensual', nf(r.div, 1) + ' UF (' + S.plazo + ' años al ' + nf(r.tasa, 2) + '% real)'],
        ['Patrimonio inicial', ufs(r.tas - r.credito), 'pos']];
      if (r.renta > 0) fin = fin.concat([['Arriendo mensual estimado', nf(r.renta, 1) + ' UF'], ['Administración y cobertura (15%)', '-' + nf(r.costos, 1) + ' UF'], ['Flujo mensual estimado', (r.flujo < 0 ? '-' : '') + nf(Math.abs(r.flujo), 1) + ' UF', r.flujo >= 0 ? 'pos' : 'red']]);
      var doc = pdfSimple('Simulación Arquitectura de Capital', 'Portafolio de propiedades con descuento', [
        { t: 'Tu portafolio', rows: r.props.map(function (p) { return [p.n + ' · ' + p.c + ' (cód. ' + p.cod + ')', nf(p.precio, 1) + ' UF · tasación ' + nf(p.tas, 1) + ' UF']; }).concat([['Precio total', ufs(r.precio), 'pos']]) },
        { t: 'Adquisición y financiamiento', rows: fin },
        { t: 'Evolución patrimonial', rows: filasEvo },
        { t: 'Estructura propuesta', text: 'Los socios (personas o sociedades) participan en una sociedad patrimonial que compra y mantiene las propiedades, financiadas por el banco con garantías aprobadas. La empresa operativa puede respaldar o garantizar la deuda, sujeto a autorización y análisis de riesgo. Pulso administra arriendo, cobranza, mantención y cobertura ante incumplimiento o vacancia (referencia: 10% de administración y 5% de cobertura sobre el arriendo mensual). Estructura sujeta a revisión jurídica, tributaria y bancaria.' },
        { t: 'Tus próximos pasos', proximos: true },
        { t: 'Supuestos', small: true, text: 'Propiedades publicadas en pulsopropiedades.cl, con su tasación y precio de venta al 18-11-2026; disponibilidad sujeta a confirmación. No incluye gastos, reservas ni evaluación de riesgo; el banco puede usar el menor valor entre el precio y la tasación. La evolución no refleja arriendos, dividendos pagados, costos, impuestos ni aportes posteriores, y no considera plusvalía. UF de referencia: ' + clp(UF) + '. ' + DISCLAIMER }
      ], { tipo: 'Arquitectura de Capital', monto: monto });
      var resumenSP = ['Propiedades: ' + r.props.map(function (p) { return p.n + ' (' + p.c + ')'; }).join(', '), 'Tasación total: ' + ufs(r.tas) + ' · Precio: ' + ufs(r.precio) + ' (−' + pct(r.desc) + ')',
        'Crédito: ' + ufs(r.credito) + ' (' + S.ltv + '% de la tasación) · Aporte: ' + ufs(r.aporte), 'Dividendo: ' + nf(r.div, 1) + ' UF/mes · ' + S.plazo + ' años al ' + nf(r.tasa, 2) + '%'].concat(r.renta > 0 ? ['Arriendo estimado: ' + nf(r.renta, 1) + ' UF/mes · Flujo: ' + nf(r.flujo, 1) + ' UF/mes'] : []);
      enviarCorreo('patrimonial', doc, 'Simulacion_ArquitecturaDeCapital', resumenSP, st, btn, monto);
    });
  })();

})();
