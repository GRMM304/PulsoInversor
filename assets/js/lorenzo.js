// Lorenzo · asistente de Pulso Inversor (por ahora solo el diseño).
// PENDIENTE: conectar con el agente de respond.io. El punto de conexión es la función `responder()`:
// hoy contesta con un mensaje fijo; al integrar, reemplazarla por el envío al widget/API de respond.io.
(function () {
  if (window.__lorenzo) return; window.__lorenzo = true;
  var NOMBRE = 'Lorenzo';
  // Las dos opciones abren WhatsApp con Lorenzo, cada una con su propio mensaje.
  var OPCIONES = [
    { texto: '🌱 Es mi primera vez invirtiendo', url: 'https://wa.me/56958792038?text=Hola%2C%20es%20mi%20primera%20vez%20invirtiendo%20y%20quiero%20m%C3%A1s%20informaci%C3%B3n' },
    { texto: '📈 Ya tengo experiencia invirtiendo', url: 'https://wa.me/56958792038?text=Hola%2C%20ya%20he%20invertido%20antes%20y%20quiero%20revisar%20una%20operaci%C3%B3n' },
  ];
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  // Ilustración simple de Lorenzo (se usa en el botón, en el encabezado y en los mensajes).
  var ILU = '<svg class="lz-ilu" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="#C7D95D"/><path d="M10 57c3-10 11-15 22-15s19 5 22 15a32 32 0 0 1-44 0z" fill="#0E2C28"/><path d="M26.5 42.5l5.5 6 5.5-6z" fill="#fff"/><rect x="28.5" y="36" width="7" height="8" rx="3" fill="#E2A97E"/><ellipse cx="32" cy="28" rx="10.5" ry="11.5" fill="#F2C29B"/><path d="M21.3 27.5c-.6-9 4.4-14 10.9-14 6.8 0 11.5 4.6 10.5 13.6-1.6-4.4-5.6-7-10.8-7-5 0-8.9 2.8-10.6 7.4z" fill="#3B2A20"/><circle cx="28" cy="29" r="1.5" fill="#0E2C28"/><circle cx="36" cy="29" r="1.5" fill="#0E2C28"/><path d="M28.3 33.6c2.2 2 5.2 2 7.4 0" stroke="#0E2C28" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>';
  var avatar = '<span class="lz-av" aria-hidden="true">' + ILU + '</span>';

  var raiz = document.createElement('div');
  raiz.className = 'lz';
  raiz.innerHTML =
    '<div class="lz-teaser" role="status" hidden>' +
      '<button type="button" class="lz-teaser-x" aria-label="Cerrar invitación">×</button>' +
      '<strong>Hola, soy ' + NOMBRE + ' 👋</strong><span>¿Tienes dudas sobre cómo invertir? Pregúntame, estoy para ayudarte.</span>' +
    '</div>' +
    '<button type="button" class="lz-launcher" aria-expanded="false" aria-controls="lz-panel" aria-label="Abrir chat con ' + NOMBRE + '">' +
      '<span class="lz-launcher-ico lz-ico-chat" aria-hidden="true">' + ILU + '</span>' +
      '<span class="lz-launcher-ico lz-ico-x" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></span>' +
      '<span class="lz-launcher-label">Pregúntale a ' + NOMBRE + '</span>' +
    '</button>' +
    '<section class="lz-panel" id="lz-panel" role="dialog" aria-label="Chat con ' + NOMBRE + '" hidden>' +
      '<header class="lz-head">' + avatar +
        '<div class="lz-who"><strong>' + NOMBRE + '</strong><span><i class="lz-dot"></i>Asistente de Pulso Inversor · En línea</span></div>' +
        '<button type="button" class="lz-close" aria-label="Cerrar chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '</header>' +
      '<div class="lz-body" aria-live="polite"></div>' +
      '<div class="lz-chips"></div>' +
      '<form class="lz-form" autocomplete="off">' +
        '<label class="sr-only" for="lz-input">Escribe tu consulta</label>' +
        '<input id="lz-input" class="lz-input" placeholder="Escribe tu duda aquí…" maxlength="500">' +
        '<button class="lz-send" type="submit" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' +
      '</form>' +
      '<p class="lz-legal">Lorenzo es un asistente virtual. Sus respuestas son referenciales; las condiciones de cada operación están en su contrato.</p>' +
    '</section>';
  document.body.appendChild(raiz);
  document.body.classList.add('has-lz');

  var $ = function (s) { return raiz.querySelector(s); };
  var panel = $('.lz-panel'), body = $('.lz-body'), chips = $('.lz-chips'), launcher = $('.lz-launcher'), teaser = $('.lz-teaser'), input = $('.lz-input');
  var iniciado = false;

  function hora() { var d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function burbuja(texto, de) {
    var b = document.createElement('div');
    b.className = 'lz-msg ' + (de === 'yo' ? 'lz-yo' : 'lz-bot');
    b.innerHTML = (de === 'yo' ? '' : avatar) + '<div class="lz-bubble"><p>' + texto + '</p><time>' + hora() + '</time></div>';
    body.appendChild(b); body.scrollTop = body.scrollHeight;
  }
  function escribiendo(ms, luego) {
    var t = document.createElement('div');
    t.className = 'lz-msg lz-bot lz-typing'; t.innerHTML = avatar + '<div class="lz-bubble"><span></span><span></span><span></span></div>';
    body.appendChild(t); body.scrollTop = body.scrollHeight;
    setTimeout(function () { t.remove(); luego(); }, ms);
  }
  function mostrarChips(v) { chips.hidden = !v; }
  function bienvenida() {
    if (iniciado) return; iniciado = true;
    chips.innerHTML = OPCIONES.map(function (o) { return '<a class="lz-chip lz-op" href="' + o.url + '" target="_blank" rel="noopener">' + esc(o.texto) + ' <span aria-hidden="true">→</span></a>'; }).join('');
    escribiendo(700, function () {
      burbuja('¡Hola! Soy <b>' + NOMBRE + '</b>, el asistente de Pulso Inversor.');
      escribiendo(900, function () { burbuja('Te atiendo por WhatsApp. Para ayudarte mejor, cuéntame: <b>¿es tu primera vez invirtiendo?</b>'); mostrarChips(true); });
    });
  }
  // Punto de conexión con respond.io: hoy responde con un mensaje fijo.
  function responder(texto) {
    escribiendo(1100, function () {
      burbuja('Gracias por escribirme. Sigamos la conversación por WhatsApp para responderte bien. Elige la opción que te representa:');
      mostrarChips(true);
    });
  }
  function enviar(texto) {
    texto = String(texto || '').trim(); if (!texto) return;
    mostrarChips(false);
    burbuja(esc(texto), 'yo');
    responder(texto);
  }
  function abrir(on) {
    panel.hidden = !on;
    raiz.classList.toggle('is-open', on);
    launcher.setAttribute('aria-expanded', on ? 'true' : 'false');
    launcher.setAttribute('aria-label', (on ? 'Cerrar' : 'Abrir') + ' chat con ' + NOMBRE);
    teaser.hidden = true;
    if (on) { bienvenida(); setTimeout(function () { if (window.matchMedia('(min-width:761px)').matches) input.focus(); }, 250); }
    try { sessionStorage.setItem('lzVisto', '1'); } catch (e) {}
  }
  launcher.addEventListener('click', function () { abrir(panel.hidden); });
  $('.lz-close').addEventListener('click', function () { abrir(false); launcher.focus(); });
  teaser.addEventListener('click', function (e) { if (e.target.closest('.lz-teaser-x')) { teaser.hidden = true; try { sessionStorage.setItem('lzVisto', '1'); } catch (er) {} return; } abrir(true); });
  $('.lz-form').addEventListener('submit', function (e) { e.preventDefault(); enviar(input.value); input.value = ''; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) abrir(false); });

  // Invitación: aparece a los pocos segundos, una vez por visita.
  var visto = false; try { visto = sessionStorage.getItem('lzVisto') === '1'; } catch (e) {}
  if (!visto) setTimeout(function () { if (panel.hidden) teaser.hidden = false; }, 4000);
})();
