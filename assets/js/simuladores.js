/* Pulso Inversor · Simuladores
 * - Acceso: los simuladores parten bloqueados hasta completar nombre, correo, teléfono y aceptar las casillas.
 *   Hipoteca Inteligente pide además la capacidad financiera por crédito.
 * - Proyecta un Hogar: réplica del simulador de www.pulsoinversor.cl + comparación con depósito a plazo.
 * - Hipoteca Inteligente: réplica del simulador de simuladorpulsoinversor.netlify.app.
 * Los datos de contacto viven solo en memoria y en sessionStorage (se borran al cerrar la pestaña).
 */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = $('[data-simuladores]');
  if (!root) return;

  /* ---------- Configuración ---------- */
  var WHATSAPP = '56983554676';
  // Formulario de Brevo que usa hoy www.pulsoinversor.cl (Proyecta un Hogar).
  var BREVO_URL = 'https://6912d61f.sibforms.com/serve/MUIFAMdok-hweDUSCZKpYN85FoRmXiamVuJvU9LoD_8cT7tPPR4f4D_cIBVel0WmV42FLrrNepn04zmJoPb-p8YiswC6nVPxB56-JJzv_ily2_zCHb09WHkCel7uooE4Vg4xV3kCdLQg12ccnDGOd6gKnb6UbcOEVeHklU1PAxBvDUr808wAe3lY2odjjt_vcAdAg_Nrj-eHtltp';
  // Planilla de Google (Apps Script) que usa hoy el simulador de Hipoteca Inteligente.
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycby1He4sHgOoqwfI5Zc0hJ8Ux3SlESniUs3vZEkC0PvcZxFHhmalKODK4v-pEKjrWBPH/exec';
  // Tasa mensual referencial de un depósito a plazo a 30 días, renovado cada mes. PENDIENTE: confirmar.
  var DAP_MENSUAL = 0.40;
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
  function setLocked(locked) {
    stage.classList.toggle('is-locked', locked);
    gate.hidden = !locked;
    $$('.sim-panel-body', stage).forEach(function (el) { if (locked) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
  }
  function abrir(id, desplazar) {
    if (!$('[data-sim-panel="' + id + '"]')) return;
    stage.hidden = false;
    tabs.forEach(function (t) { var on = t.getAttribute('data-sim-tab') === id; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
    panels.forEach(function (p) { p.hidden = p.getAttribute('data-sim-panel') !== id; });
    setLocked(!contacto);
    if (desplazar) stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!contacto) setTimeout(function () { var n = $('#gate-nombre'); if (n) n.focus({ preventScroll: true }); }, 450);
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { var id = t.getAttribute('data-sim-tab'); abrir(id, true); history.replaceState(null, '', location.search + '#' + id); }); });

  function brevo(nombreCompleto, email, tel, mensaje) {
    var partes = nombreCompleto.trim().split(/\s+/);
    var nombre = partes.shift(), apellidos = partes.join(' ') || '-';
    var monto = window.__pulsoMonto || 0;
    var tramo = monto < 25000000 ? 1 : monto < 50000000 ? 2 : monto < 100000000 ? 3 : 4;
    var data = ['NOMBRE=' + encodeURIComponent(nombre), 'APELLIDOS=' + encodeURIComponent(apellidos), 'EMAIL=' + encodeURIComponent(email),
      'SMS__COUNTRY_CODE=%2B56', 'SMS=' + encodeURIComponent(tel), 'MONTO_DE_INVERSION=' + tramo,
      'MENSAJE=' + encodeURIComponent(mensaje), 'email_address_check=', 'locale=es', 'OPT_IN=1'];
    return fetch(BREVO_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: data.join('&') })
      .then(function () { return true; }, function () { return false; });
  }
  function sheet(type, payload) {
    var body = JSON.stringify(Object.assign({ type: type, website: '', pageUrl: location.href.split('?')[0].split('#')[0], referrer: document.referrer || '' }, payload));
    return fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body })
      .then(function () { return true; }, function () { return false; });
  }

  $('#gate-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, err = $('#gate-err');
    if (f.website.value) return; // trampa para bots
    var nombre = f.nombre.value.trim(), email = f.email.value.trim(), tel = f.telefono.value.replace(/\D/g, '');
    var faltan = [];
    if (nombre.length < 2) faltan.push('nombre');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) faltan.push('correo');
    if (tel.length < 8) faltan.push('teléfono');
    var msg = faltan.length ? 'Completa correctamente: ' + faltan.join(', ') + '.' : '';
    if (!f.terminos.checked || !f.contenido.checked) msg += (msg ? ' ' : '') + 'Para continuar debes aceptar ambas casillas.';
    err.textContent = msg;
    ['nombre', 'email', 'telefono'].forEach(function (n) { f[n].classList.toggle('invalid', faltan.indexOf(n === 'telefono' ? 'teléfono' : n === 'email' ? 'correo' : n) >= 0); });
    if (msg) return;
    contacto = { nombre: nombre, email: email, telefono: tel };
    ses.set('pulsoContacto', contacto);
    brevo(nombre, email, tel, 'Desbloqueó los simuladores del sitio (1.pulsoinversor.cl). Acepta términos y recibir contenido: Sí.');
    setLocked(false);
    stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  var inicial = (location.hash || '').replace('#', '');
  if (/^sim-(proyecta|hipoteca|circular)$/.test(inicial)) abrir(inicial, false);

  /* =========================================================
     Proyecta un Hogar (estrategias Acción, Hipoteca, Título)
     ========================================================= */
  var SERIES = {
    A: { nombre: 'Acción', garantia: 'Pagaré', plazos: [12, 18, 24], retiro: true, minimo: 5000000, interes: [1, 1.1, 1.2], uf: false },
    H: { nombre: 'Hipoteca', garantia: 'Hipoteca', plazos: [15, 21, 27], retiro: false, minimo: 25000000, interes: [0.3, 0.4, 0.5], uf: true },
    T: { nombre: 'Título', garantia: 'Título', plazos: [15, 21, 27], retiro: false, minimo: 150000000, interes: [0.4, 0.5, 0.6], uf: true }
  };
  var P = { serie: 'A', monto: 5000000, plazo: 12, retiro: false };
  var q = new URLSearchParams(location.search).get('serie');
  if (q && SERIES[q.toUpperCase()]) P.serie = q.toUpperCase();

  var tasaBase = function () { var s = SERIES[P.serie]; var i = s.plazos.indexOf(P.plazo); return s.interes[i < 0 ? 0 : i]; };
  var tasa = function () { return (P.serie === 'A' && P.retiro) ? Math.round((tasaBase() - 0.1) * 10) / 10 : tasaBase(); };
  var montoEf = function () { return Math.max(P.monto || 0, SERIES[P.serie].minimo); };
  function calcular() {
    var s = SERIES[P.serie], m = montoEf(), n = P.plazo, t = tasa() / 100, total, interes;
    if (!s.uf) { interes = Math.round(m * n * t); total = m + interes; }
    else {
      var inv = m / UF, intUF = inv * n * t;
      var ufProy = UF * (IPC / 100) * n / 12 + UF;
      total = Math.round((inv + intUF) * ufProy); interes = total - m;
    }
    var dap = Math.round(m * Math.pow(1 + DAP_MENSUAL / 100, n));
    return { monto: m, total: total, ganancia: total - m, dapTotal: dap, dapGanancia: dap - m };
  }
  function renderSeries() {
    $$('[data-serie]').forEach(function (b) { var on = b.getAttribute('data-serie') === P.serie; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    var s = SERIES[P.serie];
    $('#p-plazos').innerHTML = s.plazos.map(function (p) { return '<button type="button" class="chip-opt' + (p === P.plazo ? ' is-active' : '') + '" data-plazo="' + p + '" aria-pressed="' + (p === P.plazo) + '">' + p + ' meses</button>'; }).join('');
    $('#p-quick').innerHTML = [5000000, 10000000, 25000000, 50000000, 150000000].filter(function (v) { return v >= s.minimo; })
      .map(function (v) { return '<button type="button" class="chip-opt" data-monto="' + v + '">' + (v / 1e6) + ' millones</button>'; }).join('');
    $('#p-min').textContent = 'Mínimo para esta estrategia: ' + fmtCLP(s.minimo);
    $('#p-retiro-wrap').hidden = !s.retiro;
    $('#p-retiro').checked = P.retiro;
  }
  function render(enEdicion) {
    var r = calcular(), s = SERIES[P.serie];
    window.__pulsoMonto = r.monto;
    if (!enEdicion) $('#p-monto').value = P.monto ? fmtCLP(P.monto) : '';
    $('#p-warn').hidden = !(P.monto && P.monto < s.minimo);
    $('#r-estrategia').textContent = s.nombre + ' · ' + s.garantia;
    $('#r-monto').textContent = fmtCLP(r.monto);
    $('#r-plazo').textContent = P.plazo + ' meses';
    $('#r-tasa').textContent = fmtPct(tasa(), 1) + ' mensual' + (s.uf ? ' + UF' : '');
    $('#r-total').textContent = fmtCLP(r.total);
    $('#r-ganancia').textContent = '+' + fmtCLP(r.ganancia);
    $('#d-pulso').textContent = '+' + fmtCLP(r.ganancia);
    $('#d-dap').textContent = '+' + fmtCLP(r.dapGanancia);
    var max = Math.max(r.ganancia, r.dapGanancia, 1);
    $('#d-bar-pulso').style.width = Math.max(4, r.ganancia / max * 100) + '%';
    $('#d-bar-dap').style.width = Math.max(4, r.dapGanancia / max * 100) + '%';
    var veces = r.dapGanancia > 0 ? r.ganancia / r.dapGanancia : 0;
    $('#d-veces').textContent = veces ? veces.toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' veces' : '—';
    $('#d-dif').textContent = '+' + fmtCLP(r.ganancia - r.dapGanancia);
    $('#d-tasa').textContent = fmtPct(DAP_MENSUAL, 2);
    $('#r-nota-uf').hidden = !s.uf;
    $('#r-uf').textContent = fmtCLP(UF);
  }
  window.__pulsoProyectaRender = render;
  function resumen() {
    var r = calcular(), s = SERIES[P.serie];
    return 'Estrategia: ' + s.nombre + ' (' + s.garantia + ')\nMonto: ' + fmtCLP(r.monto) + '\nPlazo: ' + P.plazo + ' meses' +
      (s.retiro ? '\nRetiro anticipado: ' + (P.retiro ? 'Sí' : 'No') : '') + '\nTasa mensual: ' + fmtPct(tasa(), 1) +
      '\nTotal a recibir (referencial): ' + fmtCLP(r.total) + '\nGanancia: ' + fmtCLP(r.ganancia) +
      '\nDepósito a plazo (' + fmtPct(DAP_MENSUAL, 2) + ' mensual): ' + fmtCLP(r.dapGanancia);
  }
  root.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-serie]'))) { P.serie = b.getAttribute('data-serie'); var s = SERIES[P.serie]; P.plazo = s.plazos[0]; P.monto = Math.max(P.monto, s.minimo); P.retiro = false; renderSeries(); render(); }
    else if ((b = e.target.closest('[data-plazo]'))) { P.plazo = +b.getAttribute('data-plazo'); renderSeries(); render(); }
    else if ((b = e.target.closest('[data-monto]'))) { P.monto = +b.getAttribute('data-monto'); render(); }
  });
  $('#p-monto').addEventListener('input', function (e) {
    P.monto = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
    e.target.value = P.monto ? fmtCLP(P.monto) : '';
    render(true);
  });
  $('#p-monto').addEventListener('blur', function () { P.monto = montoEf(); render(); });
  $('#p-retiro').addEventListener('change', function (e) { P.retiro = e.target.checked; render(); });
  $('#p-enviar').addEventListener('click', function () {
    var st = $('#p-status');
    if (!contacto) return;
    st.textContent = 'Enviando…';
    brevo(contacto.nombre, contacto.email, contacto.telefono, '--- Simulación Proyecta un Hogar ---\n' + resumen()).then(function (ok) {
      st.textContent = ok ? '✓ Simulación enviada. Un asesor te contactará pronto.' : 'No pudimos enviarla. Revisa tu conexión o envíala por WhatsApp.';
    });
  });
  $('#p-whatsapp').addEventListener('click', function () {
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola, quiero revisar mi simulación de Pulso Inversor:\n\n' + resumen()), '_blank', 'noopener');
  });
  renderSeries(); render();

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
  var H = { tr: 0, years: 5, capacity: 0, selected: [1], decisions: {}, tractionOnly: null, open: {} };
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
  var tractionReturn = function () { return tractionData[H.tr].fin * .05 * H.years; };
  var hiBody = $('#hi-body'), hiCap = $('#hi-cap-form');

  function renderTraction() {
    var t = tractionData[H.tr], ret = tractionReturn();
    $('#hi-traction').value = H.tr;
    var row = function (a, b) { return '<div class="hi-row"><span>' + a + '</span><b>' + b + '</b></div>'; };
    $('#hi-tmetrics').innerHTML = row('Tasación', uf(t.tas)) + row('Monto de inversión · 80%', uf(t.fin)) + row('Rentabilidad', '5% anual simple') + row('Plazo elegido', H.years + ' años');
    $('#hi-retlabel').textContent = 'Retorno acumulado · ' + H.years + ' años';
    $('#hi-retval').textContent = signed(ret);
    $('#hi-years').innerHTML = [2, 3, 4, 5].map(function (y) { return '<button type="button" data-year="' + y + '" class="hi-year' + (y === H.years ? ' is-active' : '') + '" aria-pressed="' + (y === H.years) + '"><small>' + y + ' años</small><b>' + uf(t.fin * .05 * y) + '</b></button>'; }).join('');
    $('#hi-capdisplay').textContent = H.capacity > 0 ? uf(H.capacity) : '—';
  }
  function renderTable() {
    var rows = patrimonyData.map(function (p, i) {
      var flow = p.rent - p.div - p.admin, sel = H.selected.indexOf(i) >= 0, dis = p.fin > H.capacity;
      var decision = dis ? '<span class="hi-na">No disponible</span>' : '<select data-purpose="' + i + '" aria-label="Decisión al cierre para ' + esc(p.name) + '"><option value="keep"' + (dec(i) === 'keep' ? ' selected' : '') + '>Conservar</option><option value="sell"' + (dec(i) === 'sell' ? ' selected' : '') + '>Activar recompra</option></select>';
      return '<div class="hi-prow' + (sel ? ' sel' : '') + (dis ? ' dis' : '') + '"><input type="checkbox" data-property="' + i + '"' + (sel ? ' checked' : '') + (dis ? ' disabled' : '') + ' aria-label="Seleccionar ' + esc(p.name) + '">' +
        '<div class="hi-pinfo"><b>' + esc(p.name) + '</b><span>' + esc(p.comuna) + ' · Tasación ' + uf(p.tas) + '</span><span>Financiamiento: ' + uf(p.fin) + '</span><em class="hi-pill' + (dis ? ' bad' : '') + '">' + (dis ? 'Supera tu capacidad' : 'Disponible') + '</em></div>' +
        '<div class="hi-flow ' + (flow >= 0 ? 'pos' : 'neg') + '">' + sgn(flow) + '<small>UF/mes</small></div><div class="hi-dec">' + decision + '</div></div>';
    }).join('');
    $('#hi-table').innerHTML = '<div class="hi-ptable"><div class="hi-prow head"><span></span><span>Propiedad</span><span>Flujo</span><span>Decisión al cierre</span></div>' + rows + '</div>';
  }
  function conclusion(picks, available, kept, soldAmort, invA, pulA, realized) {
    var keepN = picks.filter(function (x) { return x.d === 'keep'; }).length, sellN = picks.length - keepN, plazo = H.years + ' años';
    if (keepN === picks.length) return 'Elegiste conservar y priorizar la construcción de patrimonio. Al término de ' + plazo + ' mantienes ' + (keepN === 1 ? 'una propiedad administrada' : keepN + ' propiedades administradas') + ' y el 100% del equity generado, equivalente a ' + signed(kept) + ', además de ' + signed(available) + ' de retorno disponible.';
    if (sellN === picks.length) return 'Elegiste activar la recompra y priorizar liquidez. La amortización acumulada de ' + signed(soldAmort) + ' se distribuye en partes iguales: ' + signed(invA) + ' para ti y ' + signed(pulA) + ' para Pulso. Tu capital líquido estimado al término de ' + plazo + ' es ' + signed(realized) + '.';
    return 'Elegiste combinar patrimonio y liquidez. Conservas una propiedad con ' + signed(kept) + ' de equity y activas la recompra de la otra. De la amortización recomprada, recibes ' + signed(invA) + ' y Pulso recibe ' + signed(pulA) + '. Tu capital líquido estimado es ' + signed(realized) + '.';
  }
  function renderResult() {
    var ret = tractionReturn(), months = H.years * 12, t = tractionData[H.tr];
    var picks = H.selected.map(function (i) { return { i: i, p: patrimonyData[i], d: dec(i), c: calcPat(patrimonyData[i]) }; });
    var d = function (a, b, k, sub) { return '<div class="hi-drow ' + (k || '') + '"><span>' + a + (sub ? '<em>' + sub + '</em>' : '') + '</span><b>' + b + '</b></div>'; };
    var pdfBar = '<div class="hi-actions"><button class="btn btn-primary" id="hi-pdf" type="button">Descargar cotización en PDF</button><span class="hi-status" id="hi-pdfstatus" role="status"></span></div>';
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
      '<div class="hi-choice sell' + (sellP.length ? ' on' : '') + '"><small>Activar recompra · 50%</small>' + (sellP.length ? '<p>' + sellP.map(function (x) { return esc(x.p.name); }).join(' y ') + '</p><p>50% de ' + uf(soldAmort) + ' = ' + uf(invA) + '</p><em>El otro 50% (' + uf(pulA) + ') corresponde a Pulso.</em>' : '<em>Ninguna propiedad marcada para recompra.</em>') + '</div></div>' +
      '<div class="hi-closing"><h4>Al cierre · ' + H.years + ' años</h4>' + dr('Retorno disponible', signed(available)) + (sellP.length ? dr('Recompra · 50% de la amortización', signed(invA)) : '') + dr('Capital líquido estimado', signed(realized), 'tot') + (keepP.length ? dr('Equity conservado', signed(kept)) : '') + '</div>' +
      '<div class="hi-concl"><strong>Conclusión de tu elección</strong>' + conclText + '</div>' + pdfBar;
  }
  function renderHI() { renderTraction(); renderTable(); renderResult(); }

  $('#hi-traction').innerHTML = tractionData.map(function (p, i) { return '<option value="' + i + '">' + esc(p.name) + ' · ' + esc(p.comuna) + ' · ' + uf(p.tas) + '</option>'; }).join('');
  $('#hi-traction').addEventListener('change', function (e) { H.tr = +e.target.value; renderHI(); });
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
    if (!window.jspdf || !window.jspdf.jsPDF) { status.textContent = 'No se pudo cargar el generador de PDF. Revisa tu conexión y recarga la página.'; return; }
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var C = { deep: [24, 76, 63], lime: [191, 212, 30], limeSoft: [244, 248, 226], goldSoft: [253, 246, 227], text: [20, 63, 55], muted: [107, 125, 119], line: [221, 228, 224], pos: [42, 107, 79], neg: [179, 67, 44], soft: [238, 242, 239] };
    var W = 210, M = 16, CW = W - 2 * M, y = 0, fol = folio(), fecha = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }), t = tractionData[H.tr];
    var font = function (sz, st, k) { doc.setFont('helvetica', st || 'normal'); doc.setFontSize(sz); doc.setTextColor.apply(doc, C[k || 'text']); };
    var ensure = function (h) { if (y + h > 276) { doc.addPage(); y = 18; } };
    var section = function (title, need) { ensure(18 + (need || 0)); y += 4; doc.setFillColor.apply(doc, C.lime); doc.rect(M, y, 12, 1.4, 'F'); y += 6; font(12, 'bold'); doc.text(title, M, y); y += 5; };
    var kv = function (label, value, color) { ensure(8); font(9.5, 'normal', 'muted'); doc.text(label, M, y + 4.5); font(9.5, 'bold', color || 'text'); doc.text(pt(value), M + CW, y + 4.5, { align: 'right' }); y += 7; doc.setDrawColor.apply(doc, C.line); doc.setLineWidth(.2); doc.line(M, y, M + CW, y); };
    var para = function (txt, sz, k) { font(sz || 9, 'normal', k || 'muted'); var l = doc.splitTextToSize(pt(txt), CW); ensure(l.length * 4.2 + 2); doc.text(l, M, y + 4); y += l.length * 4.2 + 2; };
    var logo = $('#hi-logo');
    try { var lw = 92, lh = lw * logo.naturalHeight / logo.naturalWidth; doc.addImage(logo, 'PNG', M, 9, lw, lh); } catch (e) { font(12, 'bold'); doc.text('Pulso Inversor', M, 17); }
    font(9, 'bold'); doc.text('Folio ' + fol, W - M, 14, { align: 'right' }); font(9, 'normal', 'muted'); doc.text(fecha, W - M, 19.5, { align: 'right' });
    doc.setFillColor.apply(doc, C.deep); doc.rect(0, 28, W, 20, 'F'); doc.setFillColor.apply(doc, C.lime); doc.rect(0, 48, W, 1.6, 'F');
    font(17, 'bold'); doc.setTextColor(255, 255, 255); doc.text('Cotización Hipoteca Inteligente', M, 39.5);
    font(9, 'normal'); doc.setTextColor(207, 224, 217); doc.text('Simulación referencial en UF', W - M, 39.5, { align: 'right' }); y = 56;
    section('Preparada para'); kv('Nombre', contacto ? contacto.nombre : ''); kv('Teléfono', contacto ? '+56 ' + contacto.telefono : ''); kv('Correo electrónico', contacto ? contacto.email : ''); kv('Capacidad financiera declarada', uf(H.capacity) + ' por crédito');
    section('Portafolio Tracción · genera el retorno'); kv('Propiedad', t.name + ' · ' + t.comuna); kv('Tasación', uf(t.tas)); kv('Monto de inversión · 80%', uf(t.fin)); kv('Rentabilidad', '5% anual simple'); kv('Plazo', H.years + ' años'); kv('Retorno acumulado', signed(qd.ret), 'pos');
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
    section('Supuestos y condiciones');
    para('Simulación referencial en UF. Considera una vacancia promedio de 1 mes por año, contribuciones estimadas en 0,08% anual de la tasación y mantención y reparaciones estimadas en 0,04% anual. En la recompra, la amortización acumulada se distribuye en partes iguales entre el inversionista y Pulso. Los valores definitivos dependen de cada propiedad y de la tabla bancaria aplicable. Este documento no constituye una oferta vinculante ni una aprobación de crédito.', 8.5);
    var n = doc.getNumberOfPages(); for (var i = 1; i <= n; i++) { doc.setPage(i); doc.setDrawColor.apply(doc, C.line); doc.setLineWidth(.2); doc.line(M, 286, W - M, 286); font(7.5, 'normal', 'muted'); doc.text('Pulso Inversor · Cotización ' + fol, M, 291); doc.text('Página ' + i + ' de ' + n, W - M, 291, { align: 'right' }); }
    var slug = String(contacto ? contacto.nombre : 'cliente').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'cliente';
    doc.save('Cotizacion_' + fol + '_' + slug + '.pdf');
    status.textContent = 'PDF descargado · folio ' + fol + '.';
    var pk = qd.picks.map(function (x) { return { name: x.p.name, financingUF: x.p.fin, decision: x.d === 'keep' ? 'Conservar' : 'Activar recompra' }; });
    if (contacto) sheet('quote', Object.assign({ name: contacto.nombre, phone: contacto.telefono, email: contacto.email, capacityUF: H.capacity, consent: true, folio: fol, traction: t.name, tractionComuna: t.comuna, years: H.years, p1: pk[0] || null, p2: pk[1] || null }, H.summary || {}));
  }
})();
