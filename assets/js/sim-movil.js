/* Pulso Inversor · Simuladores en celular, paso a paso (estilo app)
 * Solo en pantallas de hasta 760 px. No cambia la lógica de cálculo (simuladores.js):
 * muestra un paso a la vez, con barra de avance, "Atrás" y "Siguiente".
 */
(function () {
  'use strict';
  if (!window.matchMedia('(max-width:760px)').matches) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function asistente(panel, pasos) {
    if (!panel) return;
    var body = $('.sim-panel-body', panel);
    var todos = [];
    pasos.forEach(function (p) { p.nodos = p.nodos().filter(Boolean); todos = todos.concat(p.nodos); });
    var actual = 0;

    var cab = document.createElement('div'); cab.className = 'wz-head';
    cab.innerHTML = '<button type="button" class="wz-back" aria-label="Paso anterior">‹</button><div class="wz-prog"><span class="wz-count"></span><div class="wz-track"><i></i></div></div>';
    var titulo = document.createElement('h3'); titulo.className = 'wz-title';
    var pie = document.createElement('div'); pie.className = 'wz-foot';
    pie.innerHTML = '<button type="button" class="btn btn-primary wz-next"></button>';
    var head = $('.sim-head', body);
    head.insertAdjacentElement('afterend', cab);
    cab.insertAdjacentElement('afterend', titulo);
    body.appendChild(pie);
    var bNext = $('.wz-next', pie), bBack = $('.wz-back', cab);

    function valido() { var p = pasos[actual]; return !p.valido || p.valido(); }
    function pintar(desplazar) {
      var p = pasos[actual];
      todos.forEach(function (n) { n.classList.add('wz-off'); });
      p.nodos.forEach(function (n) { n.classList.remove('wz-off'); });
      $('.wz-count', cab).textContent = 'Paso ' + (actual + 1) + ' de ' + pasos.length;
      $('.wz-track i', cab).style.width = ((actual + 1) / pasos.length * 100) + '%';
      titulo.textContent = p.titulo;
      bBack.style.visibility = actual === 0 ? 'hidden' : 'visible';
      var ultimo = actual === pasos.length - 1;
      pie.hidden = (ultimo && !p.botonFinal) || !!p.sinBoton;
      bNext.textContent = ultimo ? (p.botonFinal || '') : (p.siguiente || 'Siguiente');
      revisar();
      panel.classList.toggle('wz-final', ultimo);
      if (desplazar) { var tope = 0; ['.header', '.sim-picks', '.sim-tabs'].forEach(function (s) { var e = document.querySelector(s); if (e && getComputedStyle(e).position.indexOf('sticky') + getComputedStyle(e).position.indexOf('fixed') > -2) tope += e.offsetHeight; }); var y = cab.getBoundingClientRect().top + window.scrollY - Math.max(tope, 70) - 12; window.scrollTo({ top: y, behavior: 'smooth' }); }
      if (p.alEntrar) p.alEntrar();
    }
    function revisar() { var ok = valido(); bNext.disabled = !ok; bNext.classList.toggle('is-disabled', !ok); }
    function ir(i) { actual = Math.max(0, Math.min(pasos.length - 1, i)); pintar(true); }
    bNext.addEventListener('click', function () {
      if (!valido()) return;
      var p = pasos[actual];
      if (actual === pasos.length - 1) { if (p.alFinal) p.alFinal(); return; }
      ir(actual + 1);
    });
    bBack.addEventListener('click', function () { ir(actual - 1); });
    // Revalida con cada interacción; algunos pasos avanzan solos al elegir.
    body.addEventListener('click', function (e) {
      setTimeout(function () {
        revisar();
        var p = pasos[actual];
        if (p.autoAvance && e.target.closest(p.autoAvance) && valido()) setTimeout(function () { ir(actual + 1); }, 220);
      }, 0);
    });
    body.addEventListener('input', function () { setTimeout(revisar, 0); });
    body.addEventListener('change', function () { setTimeout(revisar, 0); });
    panel.wzIr = ir;
    // "Cambiar datos" en el resultado vuelve al primer paso.
    var volver = document.createElement('button'); volver.type = 'button'; volver.className = 'wz-restart'; volver.textContent = '‹ Cambiar mis datos';
    volver.addEventListener('click', function () { ir(0); });
    var ult = pasos[pasos.length - 1], ancla = ult.reiniciarEn ? ult.reiniciarEn() : ult.nodos[0];
    if (ancla) ancla.insertAdjacentElement('afterbegin', volver);
    pintar(false);
  }

  /* ---------- Rescate Inmobiliario: estrategia → monto → plazo → resultado ---------- */
  var pf = $('#sim-proyecta .pro-form');
  if (pf) {
    var hijos = Array.prototype.slice.call(pf.children);
    var idx = function (el) { return hijos.indexOf(el); };
    var iMonto = idx($('label[for="p-monto"]', pf)), iPlazo = idx($('#p-plazos', pf)) - 1;
    var grupo = function (a, b) { var w = document.createElement('div'); w.className = 'wz-group'; hijos.slice(a, b).forEach(function (n) { w.appendChild(n); }); pf.appendChild(w); return w; };
    var g1 = grupo(0, iMonto), g2 = grupo(iMonto, iPlazo), g3 = grupo(iPlazo, hijos.length);
    asistente($('#sim-proyecta'), [
      { titulo: '¿Qué estrategia prefieres?', nodos: function () { return [pf, g1]; }, valido: function () { return !!$('#sim-proyecta [data-serie].is-active'); }, autoAvance: '[data-serie]' },
      { titulo: '¿Cuánto quieres invertir?', nodos: function () { return [pf, g2]; }, valido: function () { return (parseInt(($('#p-monto').value || '').replace(/\D/g, ''), 10) || 0) > 0; } },
      { titulo: '¿A qué plazo?', nodos: function () { return [pf, g3]; }, valido: function () { return !$('#p-correo').disabled; }, siguiente: 'Ver mi resultado →' },
      { titulo: 'Tu resultado', nodos: function () { return [$('#sim-proyecta .pro-out'), $('#sim-proyecta .pro-note')]; } },
    ]);
  }

  /* ---------- Hipoteca Inteligente: capacidad → Tracción → Patrimonio → resultado ---------- */
  var hp = $('#sim-hipoteca');
  if (hp) {
    var paneles = $$('.hi-panel', hp);
    asistente(hp, [
      { titulo: 'Tu capacidad de crédito', sinBoton: true, nodos: function () { return [$('#hi-cap-form')]; }, valido: function () { return !$('#hi-body').classList.contains('is-locked') && !$('#hi-body').hasAttribute('inert') && !!$('#hi-capdisplay') && $('#hi-capdisplay').textContent.trim() !== '—'; } },
      { titulo: 'Elige la propiedad Tracción y el plazo', nodos: function () { return [$('#hi-body'), paneles[0]]; }, valido: function () { return $('#hi-traction').value !== '' && !!$('#hi-years .is-active'); } },
      { titulo: 'Elige hasta dos propiedades', nodos: function () { return [$('#hi-body'), paneles[1]]; }, siguiente: 'Ver mi resultado →' },
      { titulo: 'Tu resultado', nodos: function () { return [$('#hi-body'), paneles[2], $('#sim-hipoteca .pro-note')]; }, reiniciarEn: function () { return $('.hi-pad', paneles[2]); } },
    ]);
    // Al confirmar la capacidad, pasa solo al siguiente paso.
    var cf = $('#hi-cap-form');
    if (cf) cf.addEventListener('submit', function () { setTimeout(function () { if ($('#hi-capdisplay') && $('#hi-capdisplay').textContent.trim() !== '—') hp.wzIr(1); }, 150); });
  }

  /* ---------- Simulador Patrimonial: portafolio → descuento y financiamiento → resultado ---------- */
  var spn = $('#sim-patrimonial');
  if (spn) {
    asistente(spn, [
      { titulo: 'Elige las propiedades', nodos: function () { return [$('#sim-patrimonial .sp-form'), $('#sp-s1')]; }, valido: function () { return !!$('#sp-props .is-on'); } },
      { titulo: 'Descuento y financiamiento', nodos: function () { return [$('#sim-patrimonial .sp-form'), $('#sp-s2')]; }, valido: function () { return !$('#sp-enviar').disabled; }, siguiente: 'Ver mi resultado →' },
      { titulo: 'Tu resultado', nodos: function () { return [$('#sp-out')]; } },
    ]);
  }

  /* ---------- Inversión Circular: tus datos → resultado ---------- */
  var ic = $('#sim-circular');
  if (ic) {
    asistente(ic, [
      { titulo: 'Cuéntanos de tu propiedad', nodos: function () { return [$('#ic-form')]; }, valido: function () { return !$('#ic-results').classList.contains('is-empty') && $('#ic-error').hidden; }, siguiente: 'Ver mi resultado →' },
      { titulo: 'Tu resultado', nodos: function () { return [$('#ic-results')].concat($$('#sim-circular .ic-note, #sim-circular .pro-note')); } },
    ]);
  }
})();
