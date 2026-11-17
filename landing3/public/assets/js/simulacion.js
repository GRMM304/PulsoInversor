// Simulación ilustrativa de una operación (datos ficticios, sin tasas).
(function () {
  var raiz = document.getElementById('cp-sim');
  if (!raiz) return;
  var M = {
    A: { min: 5, plazos: [12, 18, 24], prop: 'Casa 4D3B · La Florida', doc: 'Contrato de mutuo y pagaré',
      docTxt: 'Pulso reconoce que recibió tu dinero y se obliga a devolvértelo con intereses. El pagaré es un título ejecutivo que puedes cobrar si no se cumple. Tu operación queda respaldada por el portafolio de propiedades de Pulso, como la de este ejemplo.',
      peor: 'Tienes un contrato de mutuo y un pagaré ejecutable. Ninguna estructura elimina el riesgo, pero sabes exactamente qué herramienta legal usar.' },
    H: { min: 25, plazos: [15, 21, 27], prop: 'Departamento 3D2B · Ñuñoa', doc: 'Hipoteca inscrita a tu favor',
      docTxt: 'Se constituye una hipoteca sobre la propiedad y se inscribe en el Conservador de Bienes Raíces. El respaldo queda registrado públicamente y puedes verificarlo antes de firmar.',
      peor: 'La hipoteca inscrita permite ejecutar la propiedad para recuperar tu capital. Revisa con tu abogado a favor de quién queda inscrita y bajo qué condiciones.' },
    T: { min: 100, plazos: [15, 21, 27], prop: 'Casa 5D3B · Peñalolén', doc: 'Título de propiedad a tu nombre',
      docTxt: 'La propiedad se compra con tu capital y se inscribe a tu nombre en el Conservador de Bienes Raíces. Eres el dueño del inmueble durante toda la operación.',
      peor: 'La propiedad está inscrita a tu nombre: si Pulso dejara de funcionar, sigue siendo tuya.' }
  };
  var MARGEN = 0.4;
  var $ = function (id) { return document.getElementById(id); };
  var rango = $('sim-monto'), plazoSel = null;
  var mm = function (n) { return '$' + Math.round(n).toLocaleString('es-CL') + ' MM'; };

  function propiedad(modo, monto) {
    if (modo === 'T') { var pre = monto; return { pre: pre, tas: pre / (1 - MARGEN) }; }
    if (modo === 'H') { var tas = Math.max(120, Math.ceil(monto * 1.8 / 10) * 10); return { tas: tas, pre: tas * (1 - MARGEN) }; }
    return { tas: 160, pre: 160 * (1 - MARGEN) };
  }

  function linea(n) {
    var h = '';
    for (var m = 0; m <= n; m++) {
      var x = (m / n) * 100, cls = [];
      if (m === 0) cls.push('firma'); else cls.push('int');
      if (m > 0 && m % 3 === 0 && m < n) cls.push('rep');
      if (m === n) cls.push('cap');
      h += '<i class="' + cls.join(' ') + '" style="left:' + x + '%"></i>';
    }
    h += '<span class="ini">Mes 0</span><span class="fin">Mes ' + n + '</span>';
    return h;
  }

  function pintar() {
    var modo = raiz.querySelector('input[name="sim-modo"]:checked').value, d = M[modo];
    rango.min = d.min;
    if (+rango.value < d.min) rango.value = d.min;
    var monto = +rango.value;
    $('sim-monto-txt').textContent = '$' + monto + ' millones';
    $('sim-min').textContent = '$' + d.min + ' MM';
    if (d.plazos.indexOf(plazoSel) < 0) plazoSel = d.plazos[0];
    $('sim-plazos').innerHTML = d.plazos.map(function (p) {
      return '<button type="button" data-p="' + p + '" class="' + (p === plazoSel ? 'on' : '') + '" aria-pressed="' + (p === plazoSel) + '">' + p + ' meses</button>';
    }).join('');
    var pr = propiedad(modo, monto);
    $('sim-prop').textContent = d.prop;
    $('sim-tas').textContent = mm(pr.tas);
    $('sim-pre').textContent = mm(pr.pre);
    $('sim-barra-pre').style.width = (100 - MARGEN * 100) + '%';
    $('sim-margen').textContent = Math.round(MARGEN * 100) + '% bajo la tasación';
    $('sim-doc').textContent = d.doc;
    $('sim-doc-txt').textContent = d.docTxt;
    $('sim-peor').textContent = d.peor;
    $('sim-linea').innerHTML = linea(plazoSel);
  }

  raiz.addEventListener('change', function (e) { if (e.target.name === 'sim-modo') pintar(); });
  rango.addEventListener('input', pintar);
  $('sim-plazos').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    plazoSel = +b.getAttribute('data-p'); pintar();
    (window.dataLayer = window.dataLayer || []).push({ event: 'simulacion', plazo: plazoSel });
  });
  pintar();
})();
