// Landing Red Capital · doble ruta
(function () {
  var RUTAS = ['inversion', 'financiamiento'];
  var q = new URLSearchParams(location.search);
  var form = document.getElementById('form');
  var rutaInput = document.getElementById('ruta');

  // UTM del enlace (se envían con el formulario).
  var utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { if (q.get(k)) utm[k] = q.get(k).slice(0, 160); });

  // Nombre y correo vienen en el fragmento (#n=...&e=...) para no dejarlos en registros del servidor ni en la analítica.
  if (location.hash && location.hash.indexOf('=') > -1) {
    var h = new URLSearchParams(location.hash.slice(1));
    var dec = function (v) { try { return decodeURIComponent(v); } catch (e) { return v; } };
    var n = h.get('n'), e = h.get('e');
    // Brevo deja el marcador sin reemplazar si falta el dato: no lo mostramos.
    if (n && n.indexOf('{') === -1) document.getElementById('nombre').value = dec(n).trim().slice(0, 120);
    if (e && e.indexOf('{') === -1 && e.indexOf('@') > 0) document.getElementById('correo').value = dec(e).trim().slice(0, 160);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (err) {}
  }

  function elegir(ruta, desplazar) {
    if (RUTAS.indexOf(ruta) === -1) return;
    rutaInput.value = ruta;
    document.querySelectorAll('[data-ruta]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-ruta') === ruta)); });
    document.querySelectorAll('.ruta-campos').forEach(function (c) { c.hidden = c.getAttribute('data-para') !== ruta; });
    if (desplazar) {
      var dest = document.getElementById('registro');
      dest.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      setTimeout(function () { var f = document.getElementById('nombre'); if (!f.value) f.focus({ preventScroll: true }); }, 500);
    }
  }
  document.querySelectorAll('.puerta').forEach(function (b) { b.addEventListener('click', function () { elegir(b.getAttribute('data-ruta'), true); }); });
  document.querySelectorAll('.selector button').forEach(function (b) { b.addEventListener('click', function () { elegir(b.getAttribute('data-ruta'), false); }); });
  var inicial = q.get('ruta');
  if (RUTAS.indexOf(inicial) > -1) {
    elegir(inicial, false);
    window.addEventListener('load', function () { elegir(inicial, true); });
  }

  // Botón flotante en móvil: aparece al bajar del hero y se oculta en el formulario.
  var flot = document.getElementById('flot');
  if ('IntersectionObserver' in window) {
    var visibles = {};
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { visibles[en.target.id] = en.isIntersecting; });
      flot.classList.toggle('ver', !visibles.inicio && !visibles.registro);
    });
    io.observe(document.getElementById('inicio')); io.observe(document.getElementById('registro'));
  }

  // Validación
  function valorRadio(nombre) { var r = form.querySelector('input[name="' + nombre + '"]:checked'); return r ? r.value : ''; }
  function marcar(el, mal) { var c = el.closest('.campo') || el.closest('.check-w'); if (c) c.classList.toggle('mal', mal); }
  function validar() {
    var ok = true, primero = null;
    function chequea(el, cond) { marcar(el, !cond); if (!cond) { ok = false; if (!primero) primero = el; } }
    var nombre = document.getElementById('nombre'), correo = document.getElementById('correo'), tel = document.getElementById('telefono'), edad = document.getElementById('edad');
    chequea(nombre, nombre.value.trim().length >= 3);
    chequea(correo, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo.value.trim()));
    var dig = tel.value.replace(/\D/g, '').replace(/^56/, '');
    chequea(tel, dig.length === 9);
    var ed = parseInt(edad.value, 10);
    chequea(edad, ed >= 18 && ed <= 99);
    var bloque = form.querySelector('.ruta-campos[data-para="' + rutaInput.value + '"]');
    bloque.querySelectorAll('[data-req]').forEach(function (el) {
      if (el.type === 'radio') chequea(el, !!valorRadio(el.name));
      else chequea(el, !!el.value);
    });
    var cons = document.getElementById('consentimiento');
    chequea(cons, cons.checked);
    if (primero) primero.focus();
    return ok;
  }
  form.addEventListener('change', function (ev) { var c = ev.target.closest('.mal'); if (c) c.classList.remove('mal'); });

  var TEXTOS = {
    inversion: 'Un asesor de Pulso te escribirá por WhatsApp con su nombre para coordinar una conversación. Ahí te mostramos una operación real con sus documentos: qué propiedad respalda tu dinero, qué queda a tu favor y cómo lo recuperas.',
    financiamiento: 'Un asesor de Pulso te escribirá por WhatsApp para conocer tu caso y tu propiedad. Con esa información te diremos si un leaseback tiene sentido para ti y cuáles serían los siguientes pasos. La evaluación no tiene costo ni te obliga a nada.',
    bajo: 'Hoy nuestras operaciones parten en $5 millones, así que no queremos hacerte perder tiempo con una reunión. Te enviaremos contenido para que aprendas a evaluar una inversión con respaldo inmobiliario y te avisaremos cuando tenga sentido conversar.'
  };

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var estado = document.getElementById('estado-envio');
    estado.textContent = ''; estado.className = 'estado-envio';
    if (!validar()) { estado.textContent = 'Revisa los campos marcados.'; estado.className = 'estado-envio error'; return; }
    var ruta = rutaInput.value;
    var d = {
      ruta: ruta,
      nombre: document.getElementById('nombre').value.trim(),
      correo: document.getElementById('correo').value.trim(),
      telefono: '+56' + document.getElementById('telefono').value.replace(/\D/g, '').replace(/^56/, ''),
      edad: document.getElementById('edad').value,
      consentimiento: document.getElementById('consentimiento').checked ? 'Sí' : '',
      acepta_publicidad: document.getElementById('acepta_publicidad').checked ? 'Sí' : 'No',
      sitio: form.querySelector('[name="sitio"]').value,
      pagina: location.origin + location.pathname
    };
    if (ruta === 'inversion') {
      d.monto = document.getElementById('monto').value; d.experiencia = valorRadio('experiencia'); d.horario = valorRadio('horario');
    } else {
      d.propiedad = document.getElementById('propiedad').value; d.comuna = document.getElementById('comuna').value.trim(); d.valor = document.getElementById('valor').value;
      d.necesita = document.getElementById('necesita').value; d.para_que = document.getElementById('para_que').value; d.urgencia = valorRadio('urgencia');
    }
    Object.keys(utm).forEach(function (k) { d[k] = utm[k]; });
    var btn = document.getElementById('btn-enviar');
    btn.disabled = true; btn.textContent = 'Enviando…';
    fetch('/api/registro', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error((res.j && res.j.error) || 'error');
        var primer = d.nombre.split(' ')[0];
        var bajo = ruta === 'inversion' && d.monto === 'Menos de $5 MM';
        document.getElementById('gracias-titulo').textContent = '¡Listo, ' + primer + '! Recibimos tus datos';
        document.getElementById('gracias-texto').textContent = bajo ? TEXTOS.bajo : TEXTOS[ruta];
        var msg = ruta === 'inversion'
          ? 'Hola, soy ' + d.nombre + '. Dejé mis datos en la página de Pulso Inversor y quiero conocer cómo invertir con respaldo inmobiliario.'
          : 'Hola, soy ' + d.nombre + '. Dejé mis datos en la página de Pulso Inversor y quiero evaluar liquidez con mi propiedad (leaseback).';
        document.getElementById('gracias-wa').href = 'https://wa.me/56958792038?text=' + encodeURIComponent(msg);
        document.getElementById('gracias-ops').hidden = ruta !== 'inversion';
        form.hidden = true;
        var g = document.getElementById('gracias'); g.hidden = false; g.focus();
        g.scrollIntoView({ block: 'center' });
      })
      .catch(function () {
        estado.textContent = 'No pudimos enviar tus datos. Inténtalo de nuevo o escríbenos por WhatsApp al +56 9 5879 2038.';
        estado.className = 'estado-envio error';
        btn.disabled = false; btn.textContent = 'Enviar mis datos';
      });
  });
})();
