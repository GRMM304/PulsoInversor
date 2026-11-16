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

  // Banner de inicio: el nombre abre la solicitud de reunión con un asesor.
  // Cuando exista una agenda en línea, poner su enlace en AGENDA_URL
  // (el nombre se agrega como parámetro ?name=).
  var AGENDA_URL = '';
  var CORREO = 'contacto@pulsoinversor.cl';
  document.querySelectorAll('form[data-agenda]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      var nombre = (input.value || '').trim();
      if (!nombre) { form.classList.add('error'); input.focus(); return; }
      form.classList.remove('error');
      if (AGENDA_URL) {
        window.location.href = AGENDA_URL + (AGENDA_URL.indexOf('?') < 0 ? '?' : '&') + 'name=' + encodeURIComponent(nombre);
        return;
      }
      var asunto = 'Quiero agendar una reunión con un asesor';
      var cuerpo = 'Hola, soy ' + nombre + '. Me gustaría agendar una conversación con un asesor de Pulso Inversor.';
      window.location.href = 'mailto:' + CORREO + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo);
    });
    form.querySelector('input').addEventListener('input', function () { form.classList.remove('error'); });
  });

  // Año del pie de página
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
