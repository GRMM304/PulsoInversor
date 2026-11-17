// Operaciones reales del portafolio de noviembre 2026 (fuente: "Noviembre-Portafolio.pdf").
// Para actualizar el mes: cambiar este listado y el texto "Noviembre 2026" del index.
// Privacidad: solo comuna y tipo de propiedad. Nunca calle, número ni datos de inversionistas.
(function () {
  var OPS = [
    { id: 'op-curacavi', estado: 'adquirido', foto: 'op-01.jpg', tipo: 'Casa de lujo en construcción', comuna: 'Curacaví', desc: 'Casa de 600 m² en etapa de construcción: 5 dormitorios, sala de cine, piscina y quincho, en un sector de alta demanda.', tasa: 0.9, plazo: 14, tasacion: 12580, monto: 3034.6 },
    { id: 'op-loncoche', estado: 'adquirido', foto: 'op-02.jpg', tipo: 'Terreno agrícola con casa patronal', comuna: 'Loncoche', desc: 'Frente a la Ruta 5 Sur, con suelos planos junto al río Cruces, energía trifásica y casa patronal renovada.', tasa: 0.7, plazo: 12, tasacion: 14643, monto: 5491.2 },
    { id: 'op-recoleta', estado: 'adquirido', foto: 'op-03.jpg', tipo: 'Galpón nuevo (2025)', comuna: 'Recoleta', desc: 'Amplia bodega, módulo administrativo, pavimento de radier, cierre perimetral y patio de maniobra para camiones.', tasa: 1.0, plazo: 9, tasacion: 6664, monto: 4171.6 },
    { id: 'op-las-condes', estado: 'levantamiento', foto: 'op-04.jpg', tipo: 'Inmueble habitacional', comuna: 'Las Condes', desc: 'Sector residencial con urbanización completa y buena conectividad a servicios y vías principales.', tasa: 0.7, plazo: 24, tasacion: 49330, monto: 21540 },
    { id: 'op-tome', estado: 'levantamiento', foto: 'op-05.jpg', tipo: 'Casa de 2 niveles con piscina', comuna: 'Tomé', desc: 'Entorno residencial y turístico, con terrazas, quincho, piscina y buenas terminaciones.', tasa: 1.0, plazo: 21, tasacion: 24807, monto: 13644 },
    { id: 'op-la-cisterna', estado: 'levantamiento', foto: 'op-06.jpg', tipo: 'Casa de 2 pisos con quincho', comuna: 'La Cisterna', desc: 'Sector residencial consolidado, con quincho, piscina, estacionamiento y áreas exteriores.', tasa: 0.9, plazo: 21, tasacion: 7761, monto: 3389 },
    { id: 'op-puerto-varas', estado: 'levantamiento', foto: 'op-07.jpg', tipo: 'Casa de 526 m² en parcela', comuna: 'Puerto Varas', desc: 'Parcela de 5.000 m² en condominio de baja densidad: 7 dormitorios, 7 baños, 4 estacionamientos y bodega.', tasa: 0.8, plazo: 15, tasacion: 19792, monto: 12370 },
    { id: 'op-la-florida-1', estado: 'levantamiento', foto: '', tipo: 'Casa con terreno de 180 m²', comuna: 'La Florida', desc: 'Casa de 2 dormitorios y 1 baño en un sector residencial, que destaca por su superficie de terreno.', tasa: 1.0, plazo: 15, tasacion: 2516, monto: 1116 },
    { id: 'op-la-florida-2', estado: 'levantamiento', foto: 'op-08.jpg', tipo: 'Casa de 78 m²', comuna: 'La Florida', desc: 'Terreno de 140 m² en un sector residencial, cerca de colegios, plazas, comercio y metro.', tasa: 0.9, plazo: 21, tasacion: 4843, monto: 2240 },
    { id: 'op-lampa', estado: 'levantamiento', foto: 'op-09.jpg', tipo: 'Casa de 2 pisos', comuna: 'Lampa', desc: '3 dormitorios, 2 baños, estudio y quincho, en un terreno de 226 m², cerca de comercio y colegios.', tasa: 0.9, plazo: 15, tasacion: 4762, monto: 2308 }
  ];
  var ESTADO = { adquirido: 'Ya comprada por Pulso', levantamiento: 'Abierta a inversión' };

  var uf = function (n) { return n.toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' UF'; };
  var pct = function (n) { return n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'; };
  var mm = function (n) { return '$' + n.toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' MM'; };
  var e = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var nombreOp = function (o) { return o.tipo + ' · ' + o.comuna; };

  // ---- Tarjetas ----
  var grid = document.getElementById('op-grid');
  if (!grid) return;
  grid.innerHTML = OPS.map(function (o) {
    var ratio = o.monto / o.tasacion * 100;
    var foto = o.foto
      ? '<img src="assets/img/ops/' + o.foto + '" alt="' + e(o.tipo + ' en ' + o.comuna) + '" loading="lazy" width="800" height="560">'
      : '<div class="op-sinfoto" aria-hidden="true"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg><span>Fotos en la reunión</span></div>';
    return '<article class="op" data-estado="' + o.estado + '" id="' + o.id + '">' +
      '<div class="op-foto">' + foto + '<span class="op-estado op-' + o.estado + '">' + ESTADO[o.estado] + '</span></div>' +
      '<div class="op-cuerpo">' +
        '<span class="op-comuna"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>' + e(o.comuna) + '</span>' +
        '<h3>' + e(o.tipo) + '</h3>' +
        '<p class="op-desc">' + e(o.desc) + '</p>' +
        '<div class="op-tasa"><b>' + pct(o.tasa) + ' + UF</b><span>interés mensual fijo · ' + o.plazo + ' meses</span></div>' +
        '<dl class="op-datos"><div><dt>Tasación de la propiedad</dt><dd>' + uf(o.tasacion) + '</dd></div><div><dt>Monto de la operación</dt><dd>' + uf(o.monto) + '</dd></div></dl>' +
        '<div class="op-barra" role="img" aria-label="La operación equivale al ' + pct(ratio) + ' de la tasación"><i style="width:' + ratio.toFixed(1) + '%"></i></div>' +
        '<p class="op-barra-txt">La operación equivale al <b>' + pct(ratio) + '</b> del valor tasado. El resto es el colchón de la propiedad.</p>' +
        '<div class="op-btns"><button type="button" class="btn btn-lima op-sim" data-op="' + o.id + '">Simular con esta</button><button type="button" class="btn op-quiero" data-op="' + o.id + '">Me interesa</button></div>' +
      '</div></article>';
  }).join('');

  // ---- Filtro ----
  var cuenta = { todas: OPS.length, levantamiento: 0, adquirido: 0 };
  OPS.forEach(function (o) { cuenta[o.estado]++; });
  document.querySelectorAll('.op-filtro button').forEach(function (b) {
    var k = b.getAttribute('data-f');
    var n = b.querySelector('small'); if (n) n.textContent = cuenta[k];
    b.addEventListener('click', function () {
      document.querySelectorAll('.op-filtro button').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      grid.querySelectorAll('.op').forEach(function (c) { c.hidden = k !== 'todas' && c.getAttribute('data-estado') !== k; });
    });
  });

  // ---- Formulario: lista de operaciones ----
  var sel = document.getElementById('operacion');
  if (sel) OPS.forEach(function (o) { var op = document.createElement('option'); op.value = nombreOp(o) + ' (' + pct(o.tasa) + ' + UF, ' + o.plazo + ' meses)'; op.textContent = nombreOp(o) + ' · ' + pct(o.tasa) + ' + UF'; op.setAttribute('data-id', o.id); sel.appendChild(op); });
  function elegirEnForm(id) {
    if (!sel) return;
    var op = sel.querySelector('option[data-id="' + id + '"]'); if (op) sel.value = op.value;
  }

  // ---- Simulador ----
  var simSel = document.getElementById('sim-op');
  var rango = document.getElementById('sim-monto');
  OPS.forEach(function (o) { var op = document.createElement('option'); op.value = o.id; op.textContent = nombreOp(o) + ' · ' + pct(o.tasa) + ' + UF · ' + o.plazo + ' m'; simSel.appendChild(op); });
  simSel.value = 'op-la-cisterna';

  function pintar() {
    var o = OPS.find(function (x) { return x.id === simSel.value; }) || OPS[0];
    var m = +rango.value;
    var int = m * o.tasa / 100 * o.plazo;
    var ratio = o.monto / o.tasacion * 100;
    document.getElementById('sim-monto-txt').textContent = '$' + m + ' millones';
    document.getElementById('sim-foto').innerHTML = o.foto ? '<img src="assets/img/ops/' + o.foto + '" alt="">' : '';
    document.getElementById('sim-nombre').textContent = nombreOp(o);
    document.getElementById('sim-estado').textContent = ESTADO[o.estado];
    document.getElementById('sim-tasacion').textContent = uf(o.tasacion);
    document.getElementById('sim-ratio').textContent = pct(ratio);
    document.getElementById('sim-tasa').textContent = pct(o.tasa) + ' + UF';
    document.getElementById('sim-plazo').textContent = o.plazo + ' meses';
    document.getElementById('sim-calc').textContent = pct(o.tasa) + ' × ' + o.plazo + ' meses = ' + pct(o.tasa * o.plazo) + ' + reajuste UF';
    document.getElementById('sim-int').textContent = mm(int);
    document.getElementById('sim-total').textContent = mm(m + int);
    document.getElementById('sim-cap').textContent = mm(m);
    document.getElementById('sim-mensual').textContent = '$' + Math.round(m * 1e6 * o.tasa / 100).toLocaleString('es-CL');
  }
  simSel.addEventListener('change', pintar);
  rango.addEventListener('input', pintar);
  pintar();

  grid.addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-op]'); if (!b) return;
    var id = b.getAttribute('data-op');
    window.dataLayer = window.dataLayer || [];
    if (b.classList.contains('op-sim')) {
      simSel.value = id; pintar();
      window.dataLayer.push({ event: 'simular_operacion', operacion: id });
      document.getElementById('simulacion').scrollIntoView({ behavior: 'smooth' });
    } else {
      elegirEnForm(id);
      window.dataLayer.push({ event: 'interes_operacion', operacion: id });
      document.getElementById('agenda').scrollIntoView({ behavior: 'smooth' });
    }
  });
  var simQuiero = document.getElementById('sim-quiero');
  if (simQuiero) simQuiero.addEventListener('click', function () { elegirEnForm(simSel.value); });
})();
