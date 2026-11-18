// Pulso Inversor · navegación
(function () {
  var toggle = document.querySelector('.mobile-toggle');
  var menu = document.getElementById('menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? '✕' : '☰';
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  // Submenús: abren con clic (táctil y teclado) y se cierran al hacer clic fuera
  var groups = document.querySelectorAll('.menu > li.has-sub');
  groups.forEach(function (li) {
    var btn = li.querySelector('button');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !li.classList.contains('open');
      groups.forEach(function (g) {
        g.classList.remove('open');
        g.querySelector('button').setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        li.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
  document.addEventListener('click', function () {
    if (window.matchMedia('(max-width:900px)').matches) return;
    groups.forEach(function (g) {
      g.classList.remove('open');
      g.querySelector('button').setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      groups.forEach(function (g) { g.classList.remove('open'); });
    }
  });

  // Enlaces deshabilitados (simuladores aún no publicados)
  document.querySelectorAll('[aria-disabled="true"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  // Banner de inicio: con el nombre se abre WhatsApp para agendar una reunión.
  // PENDIENTE: confirmar el número (también está en scripts/build.py).
  var WHATSAPP = '56983554676';
  document.querySelectorAll('form[data-agenda]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      var nombre = (input.value || '').trim();
      if (!nombre) { form.classList.add('error'); input.focus(); return; }
      form.classList.remove('error');
      if (window.fbq) fbq('track', 'Schedule', { content_name: 'Agendar reunión (inicio)' });
      // "Empecemos por ti" abre la agenda de Brevo de Felipe Rojas.
      var url = 'https://meet.brevo.com/pulsoinversor/felipe-rojas';
      var w = window.open(url, '_blank', 'noopener');
      if (!w) window.location.href = url;
    });
    form.querySelector('input').addEventListener('input', function () { form.classList.remove('error'); });
  });

  // Tres caminos: en pantallas táctiles, el primer toque abre la tarjeta y el segundo navega.
  var caminos = document.querySelectorAll('[data-camino]');
  var sinHover = window.matchMedia('(hover: none)');
  caminos.forEach(function (c) {
    c.addEventListener('click', function (e) {
      if (!sinHover.matches || c.classList.contains('is-open')) return;
      if (window.matchMedia('(max-width:900px)').matches) return; // en celular ya se ven abiertas
      e.preventDefault();
      caminos.forEach(function (o) { o.classList.remove('is-open'); });
      c.classList.add('is-open');
    });
    c.addEventListener('mouseenter', function () {
      caminos.forEach(function (o) { o.classList.remove('is-open'); });
      c.classList.add('is-open');
    });
    c.addEventListener('focus', function () {
      caminos.forEach(function (o) { o.classList.remove('is-open'); });
      c.classList.add('is-open');
    });
  });

  // Cifras del banner: se animan desde cero cada vez que carga la página
  var nums = document.querySelectorAll('[data-count]');
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (nums.length && !quieto) {
    var fmt = function (v, dec) {
      var p = v.toFixed(dec).split('.');
      p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return p.join(',');
    };
    var animar = function (el) {
      var fin = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var dur = 1800, t0 = null;
      el.textContent = fmt(0, dec);
      var paso = function (t) {
        if (!t0) t0 = t;
        var k = Math.min((t - t0) / dur, 1);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(fin * e, dec);
        if (k < 1) requestAnimationFrame(paso); else el.textContent = fmt(fin, dec);
      };
      setTimeout(function () { requestAnimationFrame(paso); }, 350);
    };
    nums.forEach(function (el) {
      // Las cifras más abajo en la página se animan cuando aparecen en pantalla
      if (el.hasAttribute('data-when-visible') && 'IntersectionObserver' in window) {
        var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); animar(el); } }, { threshold: .6 });
        o.observe(el);
      } else { animar(el); }
    });
  }

  // Cómo funciona: tarjetas que se dan vuelta (clic o toque; con mouse también al pasar)
  document.querySelectorAll('.flip').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = b.classList.toggle('is-flipped');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  });

  // Cómo funciona: etapas del camino. Clic en cualquier etapa; avanza sola mientras nadie interactúa.
  document.querySelectorAll('[data-r2]').forEach(function (r) {
    var steps = r.querySelectorAll('.r2-step'), cards = r.querySelectorAll('.r2-card');
    var i = 0, timer = null, DUR = 6000, tocado = false;
    var quietoR = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var movil = window.matchMedia('(max-width:900px)');
    function ir(n) {
      i = (n + steps.length) % steps.length;
      steps.forEach(function (s, k) { var on = k === i; s.classList.toggle('is-active', on); s.setAttribute('aria-expanded', on ? 'true' : 'false'); });
      cards.forEach(function (c, k) { var on = k === i; c.classList.toggle('is-active', on); c.setAttribute('aria-hidden', on ? 'false' : 'true'); });
      r.style.setProperty('--r2-dur', DUR + 'ms');
      r.classList.remove('r2-run'); void r.offsetWidth; if (!tocado && !quietoR && !movil.matches) r.classList.add('r2-run');
    }
    function auto() {
      clearInterval(timer);
      if (tocado || quietoR || movil.matches) return;
      timer = setInterval(function () { ir(i + 1); }, DUR);
    }
    steps.forEach(function (s) {
      s.addEventListener('click', function () { tocado = true; clearInterval(timer); ir(+s.getAttribute('data-i')); });
    });
    r.addEventListener('mouseenter', function () { clearInterval(timer); r.classList.add('r2-paused'); });
    r.addEventListener('mouseleave', function () { r.classList.remove('r2-paused'); if (!tocado) { ir(i); auto(); } });
    // Empieza a avanzar solo cuando la sección se ve en pantalla
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { if (!tocado) { ir(i); auto(); } o.disconnect(); } }, { threshold: .35 }).observe(r);
    } else { ir(0); auto(); }
  });

  // Garantías: las cuatro tarjetas de la apertura, una a la vez
  document.querySelectorAll('[data-gdeck]').forEach(function (deck) {
    var cards = deck.querySelectorAll('.gdeck-card');
    var tabs = document.querySelectorAll('.gdeck-tab');
    var i = 0, timer = null, DUR = 5500;
    var quietoG = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function ir(n) {
      i = (n + cards.length) % cards.length;
      cards.forEach(function (c, k) { var on = k === i; c.classList.toggle('is-active', on); c.setAttribute('aria-hidden', on ? 'false' : 'true'); });
      tabs.forEach(function (t, k) { var on = k === i; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
      deck.style.setProperty('--gdur', DUR + 'ms');
      deck.classList.remove('is-running'); void deck.offsetWidth;
      if (!quietoG) deck.classList.add('is-running');
    }
    function auto() { clearInterval(timer); if (quietoG) return; timer = setInterval(function () { ir(i + 1); }, DUR); }
    tabs.forEach(function (t) { t.addEventListener('click', function () { ir(+t.getAttribute('data-go')); auto(); }); });
    deck.addEventListener('mouseenter', function () { clearInterval(timer); deck.classList.add('is-paused'); });
    deck.addEventListener('mouseleave', function () { deck.classList.remove('is-paused'); ir(i); auto(); });
    ir(0); auto();
  });

  // Textos que aparecen palabra por palabra (data-words)
  var conPalabras = document.querySelectorAll('[data-words]');
  if (conPalabras.length && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-words');
    conPalabras.forEach(function (el) {
      var k = 0;
      (function partir(nodo) {
        Array.prototype.slice.call(nodo.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (t) {
              if (!t) return;
              if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
              var sp = document.createElement('span'); sp.className = 'w'; sp.style.setProperty('--k', k++); sp.textContent = t; frag.appendChild(sp);
            });
            nodo.replaceChild(frag, n);
          } else if (n.nodeType === 1) { partir(n); }
        });
      })(el);
      var ow = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { el.classList.add('is-in'); ow.disconnect(); } }, { threshold: .4 });
      ow.observe(el);
    });
  }

  // Inversiones: cada tarjeta despliega su explicación debajo
  var inv = document.querySelector('[data-inv]');
  if (inv) {
    var tabs = inv.querySelectorAll('[data-inv-tab]'), panels = inv.querySelectorAll('[data-inv-panel]');
    var abrirInv = function (id, desplazar, destino) {
      tabs.forEach(function (t) { var on = t.getAttribute('data-inv-tab') === id; t.classList.toggle('is-active', on); t.setAttribute('aria-expanded', on ? 'true' : 'false'); });
      panels.forEach(function (p) { p.hidden = p.getAttribute('data-inv-panel') !== id; });
      inv.classList.toggle('has-open', !!id);
      if (id && desplazar) {
        var el = destino || inv.querySelector('[data-inv-panel="' + id + '"]');
        setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
      }
    };
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var id = t.getAttribute('data-inv-tab');
        abrirInv(t.classList.contains('is-active') ? null : id, false);
        if (t.classList.contains('is-active')) {
          var pnl = inv.querySelector('[data-inv-panel="' + id + '"]'), r = pnl.getBoundingClientRect();
          if (r.top > window.innerHeight * .8) pnl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
    var porHash = function (hash, desplazar) {
      if (!hash || hash.length < 2) return false;
      var el = document.getElementById(decodeURIComponent(hash.slice(1)));
      var pnl = el && el.closest('[data-inv-panel]');
      if (!pnl) return false;
      abrirInv(pnl.getAttribute('data-inv-panel'), desplazar, el);
      return true;
    };
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (a && porHash(a.getAttribute('href'), true)) { e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); }
    });
    porHash(location.hash, true);
    window.addEventListener('hashchange', function () { porHash(location.hash, true); });
  }

  // Nosotros · Nuestro enfoque: las palabras se encienden al bajar y la sección se despide al salir
  var enf = document.querySelector('[data-enfoque]');
  if (enf && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var q = enf.querySelector('[data-scrub]'), ws = [];
    (function partir(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var sp = document.createElement('span'); sp.className = 'sw'; sp.textContent = t; frag.appendChild(sp); ws.push(sp);
          });
          nodo.replaceChild(frag, n);
        } else if (n.nodeType === 1) { partir(n); }
      });
    })(q);
    enf.classList.add('js-scrub');
    var inner = enf.querySelector('.container'), tick = false;
    var pintar = function () {
      tick = false;
      var r = enf.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * .85 - r.top) / (vh * .6)));
      var n = Math.round(p * ws.length);
      ws.forEach(function (w, i) { w.classList.toggle('on', i < n); });
      var out = 1 - Math.min(1, Math.max(0, r.bottom / (vh * .55)));
      inner.style.opacity = String(1 - out * .9);
      inner.style.transform = 'translateY(' + (-out * 60) + 'px) scale(' + (1 - out * .06) + ')';
      inner.style.filter = out > .02 ? 'blur(' + (out * 4).toFixed(1) + 'px)' : '';
    };
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(pintar); } }, { passive: true });
    window.addEventListener('resize', pintar);
    pintar();
  }

  // Animaciones al aparecer en pantalla
  var rev = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-reveal');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    rev.forEach(function (el) { io.observe(el); });
  }

  // Botón flotante para volver arriba
  var top = document.querySelector('.to-top');
  if (top) {
    var ver = function () { top.classList.toggle('show', window.scrollY > 600); };
    window.addEventListener('scroll', ver, { passive: true }); ver();
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
  }

  // Año del pie de página
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

// Píxel de Meta: cada clic en un enlace a WhatsApp cuenta como "Contact".
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href*="wa.me"]');
  if (a && window.fbq) fbq('track', 'Contact', { content_name: 'WhatsApp', content_category: location.pathname });
  // Clic en la agenda de Brevo (botón "Agendar una reunión" del menú) cuenta como "Schedule".
  var ag = e.target.closest && e.target.closest('a[href*="meet.brevo.com"]');
  if (ag && window.fbq) fbq('track', 'Schedule', { content_name: 'Agenda Brevo', content_category: location.pathname });
});

// Celular estilo app: las filas de tarjetas se deslizan con el dedo y muestran puntos de avance.
(function () {
  var mq = window.matchMedia('(max-width:760px)');
  var SEL = '.choice-grid,.igr-list,.caminos-acc,.review-list,.flip-grid,.pilares,.difs,.mec-grid';
  function armar() {
    if (!mq.matches) return;
    document.querySelectorAll(SEL).forEach(function (fila) {
      if (fila.dataset.swipe) return;
      var items = Array.prototype.filter.call(fila.children, function (c) { return c.offsetParent !== null || getComputedStyle(c).display !== 'none'; });
      if (items.length < 2) return;
      fila.dataset.swipe = '1';
      var dots = document.createElement('div'); dots.className = 'm-dots'; dots.setAttribute('aria-hidden', 'true');
      items.forEach(function (it, i) {
        var b = document.createElement('button'); b.type = 'button'; b.tabIndex = -1;
        b.addEventListener('click', function () { fila.scrollTo({ left: it.offsetLeft - fila.offsetLeft - 16, behavior: 'smooth' }); });
        dots.appendChild(b);
      });
      fila.insertAdjacentElement('afterend', dots);
      var marcar = function () {
        var centro = fila.scrollLeft + fila.clientWidth / 2, mejor = 0, dist = Infinity;
        items.forEach(function (it, i) { var c = it.offsetLeft - fila.offsetLeft + it.offsetWidth / 2, d = Math.abs(c - centro); if (d < dist) { dist = d; mejor = i; } });
        Array.prototype.forEach.call(dots.children, function (b, i) { b.classList.toggle('on', i === mejor); });
      };
      fila.addEventListener('scroll', function () { window.requestAnimationFrame(marcar); }, { passive: true });
      marcar();
    });
    // En celular las tarjetas de "Tres caminos" se ven abiertas.
    document.querySelectorAll('[data-camino]').forEach(function (c) { c.classList.add('is-open'); });
  }
  armar();
  mq.addEventListener ? mq.addEventListener('change', armar) : mq.addListener(armar);
})();

// Celular estilo app: plegables "Ver más" para textos largos.
(function () {
  if (!window.matchMedia('(max-width:760px)').matches) return;
  function plegar(el, texto, textoMenos) {
    el.classList.add('m-plegado');
    var b = document.createElement('button'); b.type = 'button'; b.className = 'm-mas'; b.textContent = texto;
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', function () {
      var abierto = el.classList.toggle('m-plegado') === false;
      b.textContent = abierto ? textoMenos : texto; b.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });
    return b;
  }
  document.querySelectorAll('.why-m').forEach(function (w) {
    if (w.querySelectorAll('.why-m-item').length > 1) w.appendChild(plegar(w, 'Ver las otras diferencias ↓', 'Ver menos ↑'));
  });
  document.querySelectorAll('.review-quote').forEach(function (q) {
    if (q.scrollHeight > 190) q.insertAdjacentElement('afterend', plegar(q, 'Leer testimonio completo', 'Leer menos'));
  });
})();

// Celular estilo app (4): Pulso Inversor se puede instalar como app, pero no se le ofrece a nadie con avisos.
// Solo queda un enlace discreto en el pie de página ("Usar como app") para quien quiera hacerlo.
(function () {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }
  var instalada = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (instalada) { document.documentElement.classList.add('es-app'); return; }
  var evento = null;
  // Evita que el navegador muestre su propio aviso de instalación; se guarda para el enlace del pie.
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); evento = e; });
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var enlace = document.querySelector('[data-usar-app]');
  if (!enlace) return;
  enlace.hidden = false;
  enlace.addEventListener('click', function (e) {
    e.preventDefault();
    if (evento) {
      evento.prompt();
      evento.userChoice.then(function (r) { if (window.fbq && r.outcome === 'accepted') fbq('trackCustom', 'InstalarApp'); evento = null; });
      return;
    }
    var nota = document.querySelector('.usar-app-nota');
    if (nota) { nota.hidden = !nota.hidden; return; }
    nota = document.createElement('p'); nota.className = 'usar-app-nota';
    nota.innerHTML = ios ? 'En iPhone: toca <b>Compartir</b> y luego <b>Agregar a inicio</b>.'
      : 'En el menú de tu navegador (⋮), elige <b>Instalar app</b> o <b>Agregar a la pantalla de inicio</b>.';
    enlace.insertAdjacentElement('afterend', nota);
  });
})();
