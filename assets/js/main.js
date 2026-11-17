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
      var texto = 'Hola, soy ' + nombre + '. Quiero agendar una reunión con un asesor de Pulso Inversor.';
      var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
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

  // Animaciones al aparecer en pantalla
  var rev = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-reveal');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: .3 });
    rev.forEach(function (el) { io.observe(el); });
  }

  // Año del pie de página
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

// Píxel de Meta: cada clic en un enlace a WhatsApp cuenta como "Contact".
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href*="wa.me"]');
  if (a && window.fbq) fbq('track', 'Contact', { content_name: 'WhatsApp', content_category: location.pathname });
});
