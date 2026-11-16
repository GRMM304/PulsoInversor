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

  // Año del pie de página
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
