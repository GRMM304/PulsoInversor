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

  // Año del pie de página
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
