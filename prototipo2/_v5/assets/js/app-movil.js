/* Pulso Inversor · experiencia tipo app en celular (barra inferior, hoja de menú, tarjetas deslizables) */
(function () {
  var MQ = window.matchMedia('(max-width: 760px)');
  var pagina = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var esLanding = pagina.indexOf('landing_') === 0;
  var poco = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var I = {
    inicio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
    invertir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    hablar: '<svg viewBox="0 0 24 24" fill="none" stroke="#1f2a24" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" style="width:26px;height:26px"><path d="M4 18.5V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H8z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/></svg>',
    simular: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11h1M11.5 11h1M14.5 11h1M8.5 14.5h1M11.5 14.5h1M14.5 14.5h1M8.5 18h1M11.5 18h4"/></svg>',
    mas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/></svg>',
    casa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
    lupa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg>',
    personas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.3c2.3 0 4 1.5 4.5 4.2"/></svg>',
    escudo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    edificio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="3" width="10" height="18" rx="1"/><path d="M14 9h6v12h-6M7 7h1M10 7h1M7 11h1M10 11h1M7 15h1M10 15h1"/></svg>',
    semilla: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 21v-9"/><path d="M12 12c0-4 3-7 8-7 0 5-3 7-8 7zM12 14c0-3-2.5-5.5-7-5.5 0 4 2.5 5.5 7 5.5z"/></svg>',
    grafico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
    pregunta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.7M12 17h.01"/></svg>'
  };

  var GRUPOS = [
    ['invertir', 'Cómo invertir', [
      ['como-funciona.html', 'Cómo funciona', 'Tres preguntas, en simple', I.doc],
      ['soluciones.html', 'Soluciones', 'Desde cuánto parte cada una', I.casa],
      ['simuladores.html', 'Simuladores', 'Mira tus números', I.simular],
      ['operacion-abierta.html', 'Operación abierta', 'Una operación real', I.edificio]
    ]],
    ['conocenos', 'Conócenos', [
      ['nosotros.html', 'Quiénes somos', 'Nuestra historia', I.personas],
      ['equipo.html', 'Equipo', 'Personas con nombre y cara', I.personas],
      ['verifica.html', 'Verifica a Pulso', 'Compruébalo tú mismo', I.escudo]
    ]],
    ['recursos', 'Recursos', [
      ['landing_primera_inversion_pulso.html', 'Primera inversión', 'Para dar el primer paso', I.semilla],
      ['landing_inversionista_experiencia_pulso.html', 'Ya he invertido', 'Revisa una operación', I.grafico],
      ['preguntas.html', 'Preguntas frecuentes', 'Las dudas de siempre', I.pregunta]
    ]]
  ];

  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function vibrar() { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {} }

  function grupoDe(p) {
    for (var g = 0; g < GRUPOS.length; g++) for (var i = 0; i < GRUPOS[g][2].length; i++) if (GRUPOS[g][2][i][0] === p) return GRUPOS[g][0];
    if (p === 'simulador.html') return 'invertir';
    return '';
  }

  /* ---------- Hoja inferior ---------- */
  var hoja, panel;
  function armarHoja() {
    var redes = document.querySelector('.pi-redes-pie');
    var html = '<div class="pi-hoja" aria-hidden="true"><div class="pi-hoja-fondo"></div>' +
      '<div class="pi-hoja-panel" role="dialog" aria-modal="true" aria-label="Menú"><div class="pi-asa"></div><button class="pi-cerrar" type="button" aria-label="Cerrar">✕</button><div class="pi-hoja-cont"></div></div></div>';
    hoja = el(html); document.body.appendChild(hoja);
    panel = hoja.querySelector('.pi-hoja-panel');
    hoja.querySelector('.pi-hoja-fondo').addEventListener('click', cerrarHoja);
    hoja.querySelector('.pi-cerrar').addEventListener('click', cerrarHoja);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarHoja(); });
    // arrastrar hacia abajo para cerrar
    var y0 = null, dy = 0;
    panel.addEventListener('touchstart', function (e) { if (panel.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; panel.style.transition = 'none'; } }, { passive: true });
    panel.addEventListener('touchmove', function (e) { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); panel.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
    panel.addEventListener('touchend', function () { if (y0 === null) return; panel.style.transition = ''; panel.style.transform = ''; if (dy > 90) cerrarHoja(); y0 = null; });
    hoja._redes = redes ? redes.outerHTML : '';
  }
  function abrirHoja(soloGrupo) {
    var cont = hoja.querySelector('.pi-hoja-cont'), h = '';
    var grupos = GRUPOS.filter(function (g) { return !soloGrupo || g[0] === soloGrupo; });
    h += soloGrupo ? '<h2>' + grupos[0][1] + '</h2><p class="pi-sub">Entiende antes de decidir. Sin apuro.</p>'
                   : '<h2>¿Qué quieres ver?</h2><p class="pi-sub">Todo lo que necesitas para decidir con calma.</p>';
    grupos.forEach(function (g) {
      if (!soloGrupo) h += '<div class="pi-grupo">' + g[1] + '</div>';
      h += '<div class="pi-tiles">' + g[2].map(function (it) {
        return '<a class="pi-tile' + (it[0] === pagina ? ' pi-act' : '') + '" href="' + it[0] + '">' + it[3] + '<b>' + it[1] + '</b><small>' + it[2] + '</small></a>';
      }).join('') + '</div>';
    });
    h += '<a class="pi-hoja-cta" href="' + (esLanding ? '#agenda' : 'contacto.html') + '">Conversemos con una persona</a>';
    if (!soloGrupo && hoja._redes) h += '<div class="pi-grupo">Síguenos</div>' + hoja._redes.replace('pi-redes-pie', 'pi-redes-tarjeta');
    h += '<p class="pi-legal">Operaciones bajo contratos civiles, no reguladas por la CMF. Toda inversión tiene riesgos.</p>';
    cont.innerHTML = h;
    cont.querySelectorAll('a[href^="#"]').forEach(function (a) { a.addEventListener('click', cerrarHoja); });
    hoja.classList.add('pi-abierta'); hoja.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    panel.scrollTop = 0;
  }
  function cerrarHoja() {
    if (!hoja) return;
    hoja.classList.remove('pi-abierta'); hoja.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
  }

  /* ---------- Barra de pestañas ---------- */
  function armarTabs() {
    var g = grupoDe(pagina);
    var on = function (c) { return c ? ' pi-on' : ''; };
    var central = esLanding ? ['#agenda', 'Agendar'] : ['contacto.html', 'Conversemos'];
    var nav = el('<nav class="pi-tabs" aria-label="Navegación">' +
      '<a class="pi-tab' + on(pagina === 'index.html' || pagina === '') + '" href="index.html">' + I.inicio + '<span>Inicio</span></a>' +
      '<button type="button" class="pi-tab' + on(g === 'invertir' && pagina.indexOf('simulador') < 0) + '" data-hoja="invertir">' + I.invertir + '<span>Invertir</span></button>' +
      '<a class="pi-tab pi-central' + on(pagina === 'contacto.html') + '" href="' + central[0] + '"><span class="pi-burbuja">' + I.hablar + '</span><span>' + central[1] + '</span></a>' +
      '<a class="pi-tab' + on(pagina.indexOf('simulador') === 0) + '" href="simuladores.html">' + I.simular + '<span>Simular</span></a>' +
      '<button type="button" class="pi-tab' + on(g === 'conocenos' || g === 'recursos' || pagina === 'privacidad.html') + '" data-hoja="">' + I.mas + '<span>Más</span></button>' +
      '</nav>');
    document.body.appendChild(nav);
    nav.querySelectorAll('[data-hoja]').forEach(function (b) {
      b.addEventListener('click', function () { vibrar(); abrirHoja(b.getAttribute('data-hoja')); });
    });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', vibrar); });
  }

  /* ---------- Barra superior que se esconde al bajar ---------- */
  function barraSuperior() {
    var top = document.querySelector('.pi-top'); if (!top) return;
    var titulo = { 'index.html': '', 'contacto.html': 'Conversemos' };
    var t = titulo.hasOwnProperty(pagina) ? titulo[pagina] : (document.title.split(/[·|]/)[0] || '').trim();
    if (t) top.querySelector('.pi-in').appendChild(el('<span class="pi-titulo">' + t + '</span>'));
    var ultimo = window.scrollY, tic = false;
    window.addEventListener('scroll', function () {
      if (tic) return; tic = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y > 120 && y > ultimo + 6) top.classList.add('pi-oculta');
        else if (y < ultimo - 6 || y < 120) top.classList.remove('pi-oculta');
        ultimo = y; tic = false;
      });
    }, { passive: true });
  }

  /* ---------- Tarjetas deslizables ---------- */
  function carruseles() {
    var sel = '.grid.g3, .grid.g4, .frases, .testis, .pilares, .senales, .equipo, .verifica, .despues';
    document.querySelectorAll(sel).forEach(function (c) {
      if (c.closest('form') || c.querySelector('form, input, table, video')) return;
      var hijos = Array.prototype.filter.call(c.children, function (x) { return x.nodeType === 1; });
      if (hijos.length < 3 || getComputedStyle(c).display !== 'grid') return;
      c.classList.add('pi-carrusel');
      var puntos = el('<div class="pi-puntos" aria-hidden="true">' + hijos.map(function (_, i) { return '<i' + (i === 0 ? ' class="pi-on"' : '') + '></i>'; }).join('') + '</div>');
      c.parentNode.insertBefore(puntos, c.nextSibling);
      var ps = puntos.children;
      c.addEventListener('scroll', function () {
        var w = hijos[0].getBoundingClientRect().width + 12, k = Math.round(c.scrollLeft / w);
        for (var i = 0; i < ps.length; i++) ps[i].classList.toggle('pi-on', i === k);
      }, { passive: true });
    });
  }

  /* ---------- Aparición suave ---------- */
  function aparicion() {
    if (poco || !('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('pi-vis'); obs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    var cands = document.querySelectorAll('main section h2, main section .card, main section .camino, main section .pi-carrusel, main section figure, main section .video-v, section .pilar, section .senal, section .testi, section .persona, section h2');
    cands.forEach(function (n, i) {
      if (n.closest('.pi-top') || n.getBoundingClientRect().top < window.innerHeight) return; // lo visible al cargar no se anima
      n.classList.add('pi-rev'); obs.observe(n);
    });
  }

  function iniciar() {
    if (!MQ.matches || document.body.classList.contains('pi-app') || document.body.classList.contains('embed')) return;
    document.body.classList.add('pi-app');
    armarHoja(); armarTabs(); barraSuperior(); carruseles(); aparicion();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  MQ.addEventListener && MQ.addEventListener('change', function (e) { if (e.matches) iniciar(); });
})();
