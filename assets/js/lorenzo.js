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
  var ILU = '<svg class="lz-ilu" viewBox="0 0 100 100" aria-hidden="true">' +
    '<rect width="100" height="100" fill="#EDF5C8"/><circle cx="50" cy="108" r="52" fill="#DCEA97"/>' +
    '<path d="M12 104c2-21 16-32 38-32s36 11 38 32z" fill="#0E2C28"/>' +
    '<path d="M39 73l11 18 11-18z" fill="#fff"/>' +
    '<path d="M47.6 76h4.8l1.8 4.4-4.2 13-4.2-13z" fill="#C7D95D"/>' +
    '<path d="M37 73.5l13 18.5-7.5 4.5-10-18.5zM63 73.5l-13 18.5 7.5 4.5 10-18.5z" fill="#1E5746"/>' +
    '<path d="M43 58h14v13c0 4.5-14 4.5-14 0z" fill="#E3A57C"/>' +
    '<ellipse cx="31.5" cy="47" rx="4.2" ry="5.8" fill="#F0B992"/><ellipse cx="68.5" cy="47" rx="4.2" ry="5.8" fill="#F0B992"/>' +
    '<path d="M32 43c0-12.5 8-20 18-20s18 7.5 18 20v4c0 11.5-8 20.5-18 20.5S32 58.5 32 47z" fill="#F6C9A4"/>' +
    '<path d="M29.8 45.5c-2.6-16 6.4-26.5 21-26.5 13 0 22 8.5 19.6 25.5-1.4-6.5-5.2-10.8-10.4-12.8-5.6 4.4-14.6 6.4-25.6 5.3-2 2.2-3.6 5.3-4.6 8.5z" fill="#3B2A20"/>' +
    '<path d="M44 22.5c4-2 10-2 14 .5" stroke="#5A4232" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<path d="M37.5 41.5c2.2-1.7 5.3-1.7 7.5 0M55 41.5c2.2-1.7 5.3-1.7 7.5 0" stroke="#3B2A20" stroke-width="2.1" stroke-linecap="round" fill="none"/>' +
    '<ellipse cx="41.3" cy="47.5" rx="2.4" ry="2.8" fill="#0E2C28"/><ellipse cx="58.7" cy="47.5" rx="2.4" ry="2.8" fill="#0E2C28"/>' +
    '<circle cx="42.2" cy="46.5" r=".85" fill="#fff"/><circle cx="59.6" cy="46.5" r=".85" fill="#fff"/>' +
    '<circle cx="36.5" cy="55" r="3.4" fill="#F29C8B" opacity=".45"/><circle cx="63.5" cy="55" r="3.4" fill="#F29C8B" opacity=".45"/>' +
    '<path d="M50 49.5c-.6 2.4-1.6 3.6-2.6 4.2" stroke="#D8946B" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '<path d="M43 57c3.8 4 10.2 4 14 0" stroke="#7A3226" stroke-width="2.3" fill="#fff" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
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
  // ---- Chat real de Lorenzo en respond.io (Website Chat). Si no carga, queda el panel con WhatsApp como respaldo. ----
  var RESPOND_CID = '0ca5efecc5619168ecc1d304c2c5bee';
  var rio = document.createElement('script');
  rio.id = 'respondio__widget'; rio.async = true;
  rio.src = 'https://cdn.respond.io/webchat/widget/widget.js?cId=' + RESPOND_CID;
  document.body.appendChild(rio);
  var rioEscucha = false;
  function rioListo() {
    var r = window.$respond;
    return !!(r && typeof r.do === 'function' && !r.is('error') && document.querySelector('iframe[title="Webchat Widget"]'));
  }
  function abrirRespond() {
    if (!rioListo()) return false;
    if (!rioEscucha) {
      rioEscucha = true;
      window.$respond.on('chat:closed', function () { raiz.classList.remove('lz-rio'); document.body.classList.remove('lz-rio-abierto'); launcher.focus(); });
    }
    panel.hidden = true; raiz.classList.remove('is-open'); teaser.hidden = true;
    raiz.classList.add('lz-rio'); document.body.classList.add('lz-rio-abierto');
    window.$respond.do('chat:open');
    if (window.fbq) fbq('track', 'Contact', { content_name: 'Chat Lorenzo (respond.io)', content_category: location.pathname });
    if (window.pulsoMedir) pulsoMedir('chat_lorenzo');
    try { sessionStorage.setItem('lzVisto', '1'); } catch (e) {}
    return true;
  }

  var rioFallo = false, esperando = false;
  rio.onerror = function () { rioFallo = true; };
  function abrir(on) {
    if (on && abrirRespond()) return;
    // El chat de respond.io puede tardar unos segundos en cargar: espera hasta 3 s antes de usar el respaldo.
    if (on && !rioFallo && !(window.$respond && window.$respond.is && window.$respond.is('error'))) {
      if (esperando) return;
      esperando = true; launcher.classList.add('lz-cargando');
      var t0 = Date.now();
      (function intentar() {
        if (abrirRespond()) { esperando = false; launcher.classList.remove('lz-cargando'); return; }
        if (Date.now() - t0 > 3000) { esperando = false; launcher.classList.remove('lz-cargando'); abrirPanel(true); return; }
        setTimeout(intentar, 150);
      })();
      return;
    }
    abrirPanel(on);
  }
  function abrirPanel(on) {
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
