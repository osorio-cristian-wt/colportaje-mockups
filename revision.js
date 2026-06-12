/* ============================================================================
   revision.js — Capa de revisión para los mockups de colportajeApp
   ----------------------------------------------------------------------------
   Se carga DESPUÉS de support.js (el runtime de Claude Design). No toca el
   árbol de React (#dc-root); inyecta su propia UI en <body>.

   Provee:
     1) Modal de bienvenida con spotlight sobre las pestañas interactuables.
     2) Botón flotante "Comentar": arrastrás una zona y dejás un comentario.
     3) Guardado en Supabase (tabla revision_comentario) con fallback a
        localStorage si no hay config o falla la red.

   Config: window.REVISION_VISTA  -> 'colportor' | 'admin' | 'coordinador'
           window.REVISION_SUPABASE = { url, anonKey }  (revision-config.js)
   ========================================================================== */
(function () {
  'use strict';

  // ── Config por vista ──────────────────────────────────────────────────────
  var VISTA = window.REVISION_VISTA || 'colportor';
  var CFG = window.REVISION_SUPABASE || {};
  var TABS = {
    colportor:   ['Hoy', 'Mapa', 'Agenda', 'Ventas', 'Mi cuenta'],
    admin:       ['Inicio', 'Campañas', 'Usuarios', 'Catálogo', 'Becas', 'Reportes'],
    coordinador: ['Inicio', 'Equipo', 'Stock', 'Cuentas', 'Reportes']
  };
  var VISTA_NOMBRE = {
    colportor: 'App Colportor', admin: 'Panel Admin', coordinador: 'Panel Coordinador'
  };
  var labels = TABS[VISTA] || [];

  var BRAND = '#002856', GOLD = '#F4C430';

  // ── Estilos ───────────────────────────────────────────────────────────────
  var css = document.createElement('style');
  css.textContent = [
    '#rev-fab{position:fixed;right:20px;bottom:20px;z-index:2147483600;display:flex;align-items:center;gap:8px;',
      'padding:13px 20px;border-radius:999px;border:2px solid ' + GOLD + ';background:' + BRAND + ';color:#fff;',
      "font-family:Inter,system-ui,sans-serif;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 6px 22px rgba(0,40,86,.45);",
      'transition:transform .15s,box-shadow .15s;-webkit-user-select:none;user-select:none;}',
    '#rev-fab:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,40,86,.55);}',
    '#rev-fab .rev-badge{background:' + GOLD + ';color:' + BRAND + ';border-radius:999px;min-width:20px;height:20px;',
      'padding:0 5px;font-size:12px;font-weight:700;display:none;align-items:center;justify-content:center;}',
    '#rev-help{position:fixed;right:20px;bottom:74px;z-index:2147483600;width:38px;height:38px;border-radius:50%;',
      'border:1px solid rgba(0,40,86,.25);background:#fff;color:' + BRAND + ';font-family:Inter,sans-serif;font-size:18px;',
      'font-weight:700;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.18);}',
    '.rev-ov{position:fixed;inset:0;z-index:2147483640;font-family:Inter,system-ui,sans-serif;}',
    '.rev-dim{position:fixed;inset:0;background:rgba(8,16,30,.55);z-index:2147483630;}',
    '.rev-spot{position:fixed;z-index:2147483635;border:3px solid ' + GOLD + ';border-radius:14px;',
      'box-shadow:0 0 0 9999px rgba(8,16,30,.62),0 0 22px 4px rgba(244,196,48,.7);pointer-events:none;',
      'animation:revpulse 1.4s ease-in-out infinite;}',
    '@keyframes revpulse{0%,100%{box-shadow:0 0 0 9999px rgba(8,16,30,.62),0 0 14px 2px rgba(244,196,48,.55);}',
      '50%{box-shadow:0 0 0 9999px rgba(8,16,30,.62),0 0 26px 7px rgba(244,196,48,.85);}}',
    '.rev-card{position:fixed;z-index:2147483645;background:#fff;border-radius:14px;max-width:340px;width:calc(100% - 40px);',
      'box-shadow:0 18px 50px rgba(0,0,0,.35);overflow:hidden;font-family:Inter,sans-serif;color:#1A2A40;}',
    '.rev-card h3{margin:0;padding:16px 18px 4px;font-family:"Source Serif 4",Georgia,serif;font-size:18px;color:' + BRAND + ';}',
    '.rev-card p{margin:0;padding:4px 18px 12px;font-size:13.5px;line-height:1.5;color:#3A4A60;}',
    '.rev-card .rev-row{display:flex;gap:8px;padding:0 18px 16px;}',
    '.rev-btn{flex:1;padding:10px 14px;border-radius:8px;border:none;font-size:14px;font-weight:600;cursor:pointer;',
      'font-family:Inter,sans-serif;}',
    '.rev-btn.primary{background:' + BRAND + ';color:#fff;}',
    '.rev-btn.ghost{background:#EEF2F8;color:' + BRAND + ';}',
    '.rev-card textarea,.rev-card input{width:calc(100% - 36px);margin:0 18px 10px;padding:10px;border:1px solid #CDD7E5;',
      'border-radius:8px;font-family:Inter,sans-serif;font-size:14px;box-sizing:border-box;resize:vertical;}',
    '.rev-card textarea{min-height:84px;}',
    '.rev-drag-layer{position:fixed;inset:0;z-index:2147483646;cursor:crosshair;background:rgba(8,16,30,.12);}',
    '.rev-drag-rect{position:fixed;z-index:2147483647;border:2px dashed ' + GOLD + ';background:rgba(244,196,48,.18);pointer-events:none;}',
    '.rev-hint{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;background:' + BRAND + ';',
      'color:#fff;padding:9px 16px;border-radius:999px;font-family:Inter,sans-serif;font-size:13.5px;font-weight:500;',
      'box-shadow:0 6px 20px rgba(0,0,0,.3);}',
    '.rev-toast{position:fixed;bottom:84px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#1E7D45;',
      'color:#fff;padding:11px 18px;border-radius:10px;font-family:Inter,sans-serif;font-size:13.5px;font-weight:600;',
      'box-shadow:0 8px 24px rgba(0,0,0,.3);animation:revfade 3s forwards;}',
    '.rev-toast.warn{background:#B8860B;}',
    '@keyframes revfade{0%{opacity:0;transform:translateX(-50%) translateY(8px);}10%,80%{opacity:1;transform:translateX(-50%) translateY(0);}100%{opacity:0;}}'
  ].join('');
  document.head.appendChild(css);

  // ── Helpers DOM ────────────────────────────────────────────────────────────
  function screenEl() {
    return document.querySelector('#dc-root [data-screen-label]') ||
           document.querySelector('[data-screen-label]');
  }
  function activeTab() {
    var el = screenEl();
    var raw = el ? (el.getAttribute('data-screen-label') || '') : '';
    var parts = raw.split('·');
    return (parts[1] || parts[0] || '').trim();
  }
  function scrollContainer() {
    // El contenedor scrolleable es la pantalla activa (overflow:auto) o un ancestro.
    var el = screenEl();
    while (el && el !== document.body) {
      var s = getComputedStyle(el);
      if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 2) return el;
      el = el.parentElement;
    }
    return screenEl() || document.scrollingElement || document.body;
  }

  // Une los rects de los items de nav (texto que termina en un label conocido).
  function navRect() {
    var nodes = document.querySelectorAll('#dc-root div,#dc-root a,#dc-root span,#dc-root button,#dc-root li');
    var hits = [];
    nodes.forEach(function (el) {
      var t = (el.textContent || '').trim();
      if (!t || t.length > 16) return;
      var match = labels.some(function (l) { return t === l || t.slice(-l.length) === l && t.length <= l.length + 3; });
      if (!match) return;
      if (getComputedStyle(el).cursor !== 'pointer') return;
      var r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      hits.push(r);
    });
    if (hits.length < 2) return null;
    var L = Math.min.apply(null, hits.map(function (r) { return r.left; }));
    var T = Math.min.apply(null, hits.map(function (r) { return r.top; }));
    var R = Math.max.apply(null, hits.map(function (r) { return r.right; }));
    var B = Math.max.apply(null, hits.map(function (r) { return r.bottom; }));
    return { left: L, top: T, right: R, bottom: B, width: R - L, height: B - T };
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function toast(msg, warn) {
    var t = el('div', 'rev-toast' + (warn ? ' warn' : ''), msg);
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }

  // ── 1) Bienvenida con spotlight ────────────────────────────────────────────
  function showWelcome(force) {
    var KEY = 'rev_welcome_' + VISTA;
    if (!force && localStorage.getItem(KEY) === '1') return;

    var dim = el('div', 'rev-dim');
    var spot = el('div', 'rev-spot');
    var nr = navRect();
    if (nr) {
      var pad = 8;
      spot.style.left = (nr.left - pad) + 'px';
      spot.style.top = (nr.top - pad) + 'px';
      spot.style.width = (nr.width + pad * 2) + 'px';
      spot.style.height = (nr.height + pad * 2) + 'px';
      dim.remove(); // el spotlight ya oscurece todo con su box-shadow
    } else {
      spot = null;
    }

    var card = el('div', 'rev-card');
    card.innerHTML =
      '<h3>Estás revisando: ' + VISTA_NOMBRE[VISTA] + '</h3>' +
      '<p><b>Las pestañas resaltadas son interactuables</b> 👆 — hacé click para navegar entre las pantallas (' +
      labels.join(' · ') + ').<br><br>' +
      'Para dejar feedback usá el botón <b>💬 Comentar</b> abajo a la derecha: ' +
      'arrastrás sobre la zona que querés comentar y escribís tu observación.</p>' +
      '<div class="rev-row"><button class="rev-btn primary" id="rev-ok">Entendido</button></div>';

    // Posicionar la card lejos del spotlight (si el nav está abajo, card arriba; si está a un lado, centrada).
    if (nr && nr.top > window.innerHeight * 0.55) {
      card.style.top = '22%'; card.style.left = '50%'; card.style.transform = 'translateX(-50%)';
    } else {
      card.style.top = '50%'; card.style.left = '50%'; card.style.transform = 'translate(-50%,-50%)';
    }

    if (spot) document.body.appendChild(spot);
    else document.body.appendChild(dim);
    document.body.appendChild(card);

    card.querySelector('#rev-ok').onclick = function () {
      if (spot) spot.remove();
      dim.remove();
      card.remove();
      localStorage.setItem(KEY, '1');
    };
  }

  // ── 2) Flujo de comentario (drag + guardar) ────────────────────────────────
  var count = 0;
  function startComment() {
    var layer = el('div', 'rev-drag-layer');
    var hint = el('div', 'rev-hint', '✏️ Arrastrá sobre la zona que querés comentar');
    var rect = el('div', 'rev-drag-rect');
    document.body.appendChild(layer);
    document.body.appendChild(hint);

    var sx = 0, sy = 0, dragging = false;
    layer.addEventListener('mousedown', down);
    layer.addEventListener('touchstart', function (e) { down(e.touches[0]); e.preventDefault(); }, { passive: false });

    function pt(e) { return { x: e.clientX, y: e.clientY }; }
    function down(e) {
      dragging = true; sx = e.clientX; sy = e.clientY;
      rect.style.left = sx + 'px'; rect.style.top = sy + 'px';
      rect.style.width = '0px'; rect.style.height = '0px';
      document.body.appendChild(rect);
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      window.addEventListener('touchmove', tmove, { passive: false });
      window.addEventListener('touchend', up);
    }
    function tmove(e) { move(e.touches[0]); e.preventDefault(); }
    function move(e) {
      if (!dragging) return;
      var x = e.clientX, y = e.clientY;
      rect.style.left = Math.min(sx, x) + 'px';
      rect.style.top = Math.min(sy, y) + 'px';
      rect.style.width = Math.abs(x - sx) + 'px';
      rect.style.height = Math.abs(y - sy) + 'px';
    }
    function up(e) {
      if (!dragging) return;
      dragging = false;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', tmove);
      window.removeEventListener('touchend', up);
      var r = rect.getBoundingClientRect();
      var box = { left: r.left, top: r.top, width: r.width, height: r.height };
      // click sin arrastre -> caja por defecto centrada en el punto
      if (box.width < 8 && box.height < 8) {
        box = { left: sx - 25, top: sy - 25, width: 50, height: 50 };
      }
      cleanup();
      askComment(box);
    }
    function cleanup() { layer.remove(); hint.remove(); rect.remove(); }

    // Escape cancela
    function onKey(e) { if (e.key === 'Escape') { cleanup(); window.removeEventListener('keydown', onKey); } }
    window.addEventListener('keydown', onKey);
  }

  function askComment(box) {
    var cont = scrollContainer();
    var cr = cont.getBoundingClientRect();
    var scrollTop = cont.scrollTop || 0;
    var tab = activeTab();

    // Coordenadas relativas al contenido scrolleable de la pantalla activa.
    var relX = Math.round(box.left - cr.left);
    var relY = Math.round((box.top - cr.top) + scrollTop);

    var card = el('div', 'rev-card');
    card.innerHTML =
      '<h3>Nuevo comentario</h3>' +
      '<p style="padding-bottom:6px;">Pantalla: <b>' + tab + '</b> · zona ' +
        Math.round(box.width) + '×' + Math.round(box.height) + ' px</p>' +
      '<textarea id="rev-text" placeholder="Escribí tu observación sobre esta zona…"></textarea>' +
      '<input id="rev-autor" placeholder="Tu nombre (opcional)" />' +
      '<div class="rev-row">' +
        '<button class="rev-btn ghost" id="rev-cancel">Cancelar</button>' +
        '<button class="rev-btn primary" id="rev-save">Guardar comentario</button>' +
      '</div>';
    // Posicionar la card cerca de la zona, sin salir de pantalla.
    var top = Math.min(box.top + box.height + 10, window.innerHeight - 280);
    card.style.top = Math.max(12, top) + 'px';
    card.style.left = '50%';
    card.style.transform = 'translateX(-50%)';
    document.body.appendChild(card);

    var ta = card.querySelector('#rev-text');
    ta.focus();
    card.querySelector('#rev-cancel').onclick = function () { card.remove(); };
    card.querySelector('#rev-save').onclick = function () {
      var texto = ta.value.trim();
      if (!texto) { ta.focus(); ta.style.borderColor = '#D32F2F'; return; }
      var rec = {
        vista: VISTA,
        tab: tab,
        x: relX,
        y: relY,
        ancho: Math.round(box.width),
        alto: Math.round(box.height),
        scroll_y: Math.round(scrollTop),
        comentario: texto,
        autor: card.querySelector('#rev-autor').value.trim() || null,
        vw: window.innerWidth,
        vh: window.innerHeight,
        user_agent: navigator.userAgent.slice(0, 180)
      };
      card.remove();
      saveComment(rec);
    };
  }

  // ── 3) Persistencia ─────────────────────────────────────────────────────────
  function supabaseConfigured() {
    return CFG.url && CFG.anonKey && !/TU[-_]|REEMPLAZA|XXXX/i.test(CFG.url + CFG.anonKey);
  }
  function queueLocal(rec) {
    var q = JSON.parse(localStorage.getItem('rev_pendientes') || '[]');
    q.push(rec);
    localStorage.setItem('rev_pendientes', JSON.stringify(q));
  }
  function saveComment(rec) {
    bumpBadge();
    if (!supabaseConfigured()) {
      queueLocal(rec);
      toast('Guardado localmente (Supabase sin configurar)', true);
      return;
    }
    fetch(CFG.url.replace(/\/$/, '') + '/rest/v1/revision_comentario', {
      method: 'POST',
      headers: {
        'apikey': CFG.anonKey,
        'Authorization': 'Bearer ' + CFG.anonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(rec)
    }).then(function (res) {
      if (res.ok) { toast('✓ Comentario enviado'); return; }
      return res.text().then(function (t) {
        console.error('[revision] Supabase ' + res.status + ': ' + t);
        queueLocal(rec);
        toast('Sin conexión: guardado localmente', true);
      });
    }).catch(function (e) {
      console.error('[revision]', e);
      queueLocal(rec);
      toast('Sin conexión: guardado localmente', true);
    });
  }

  function bumpBadge() {
    count++;
    var b = document.querySelector('#rev-fab .rev-badge');
    if (b) { b.textContent = count; b.style.display = 'flex'; }
  }

  // Exporta la cola local (respaldo si Supabase falló o no está configurado).
  function exportLocal() {
    var q = JSON.parse(localStorage.getItem('rev_pendientes') || '[]');
    if (!q.length) { toast('No hay comentarios locales pendientes', true); return; }
    var blob = new Blob([JSON.stringify(q, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'comentarios-' + VISTA + '.json';
    a.click();
  }

  // ── Montaje ─────────────────────────────────────────────────────────────────
  function mount() {
    var fab = el('button', null, '💬 Comentar <span class="rev-badge">0</span>');
    fab.id = 'rev-fab';
    fab.onclick = startComment;

    var help = el('button', null, '?');
    help.id = 'rev-help';
    help.title = 'Ver instrucciones';
    help.onclick = function () { showWelcome(true); };
    // doble click en "?" exporta la cola local de respaldo
    help.ondblclick = function (e) { e.preventDefault(); exportLocal(); };

    document.body.appendChild(fab);
    document.body.appendChild(help);
    showWelcome(false);
  }

  // Esperar a que el runtime DC renderice la pantalla.
  var tries = 0;
  (function wait() {
    if (screenEl() || tries > 120) { mount(); return; }
    tries++;
    setTimeout(wait, 100);
  })();
})();
