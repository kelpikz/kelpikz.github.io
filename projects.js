/* Projects: the painter's floor.

   Part one, the folios.  Each project has an article in the page (an <article class="folio">).  With scripts on they
   are kept out of sight, and one at a time is shown in the dialog, as a postcard.  The address says which:
   projects.html#dpay.

   Part two, the floor.  It is made the way the picture of the home page is made: one picture drawn once, and over it
   loose drawings ("cels") shown twelve to the second.  The drawings come from make.mjs (place "floor"); assets/scenes.js
   says where each one is on its sheet, and what each actor does.  Every actor belongs to a layer: "under" lies between
   the picture and the folios, "shade" over the folios is multiplied (shadows), "glow" over them is screened (light),
   and "top" is laid over everything.  The folios are laid on the rug at the places the picture was drawn for. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var all = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var root = document.documentElement, body = document.body;
  var FLOOR = { hold: function () {} };                   // part two fills this in

  // ---- the drawn paper.  If a sheet does not load, plain lines stand in for it. -------------------------------------
  [['card', 'paper-card.webp'], ['frieze', 'paper-frieze.webp'], ['dado', 'paper-dado.webp'], ['slip', 'paper-slip.webp']].forEach(function (p) {
    var i = new Image();
    i.onerror = function () { root.classList.add('no-' + p[0]); };
    i.src = 'assets/' + p[1];
  });

  // ================================================================================================================
  // Part one: the folios
  // ================================================================================================================
  var dlg = $('modal'), sheet = $('sheet'), store = $('folios'), F = {}, cur = null;
  all('.folio').forEach(function (a) { F[a.id] = a; });
  var cardOf = function (id) { return document.querySelector('.fo[data-id="' + id + '"]'); };

  // the viewer: a small picture under it is put in the large place
  function pick(a) {
    var v = a.closest('.viewer'), stage = v.querySelector('.stage'), small = a.querySelector('img'), el;
    if (a.hasAttribute('data-video')) {
      el = document.createElement('video'); el.controls = true; el.playsInline = true; el.preload = 'none';
      el.poster = a.getAttribute('data-poster'); el.src = a.getAttribute('href');
      stage.style.backgroundImage = '';
    } else {
      el = document.createElement('img'); el.alt = small.alt; el.width = +a.getAttribute('data-w'); el.height = +a.getAttribute('data-h');
      stage.style.backgroundImage = 'url("' + small.getAttribute('src') + '")';       // the small one holds the place while the large one comes
      el.src = a.getAttribute('href');
    }
    stage.textContent = ''; stage.appendChild(el);
    v.querySelector('figcaption').textContent = a.getAttribute('data-cap');
    all('.thumbs a', v).forEach(function (t) { if (t === a) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
  }

  // a folio whose painting does not come shows a plain sheet in its place, and the painting is asked for again
  all('.fo-img').forEach(function (im) {
    var a = im.closest('.fo'), tries = 0, src = im.getAttribute('src');
    var bad = function () {
      a.classList.add('no-img');
      if (tries++ < 2) setTimeout(function () { im.src = src + '?r=' + Date.now(); }, 1500 * tries);
    };
    im.addEventListener('error', bad);
    im.addEventListener('load', function () { a.classList.remove('no-img'); });
    if (im.complete && !im.naturalWidth) bad();
  });

  var canModal = !!(dlg && sheet && store && typeof dlg.showModal === 'function');
  if (!canModal) return;                                        // the folios and the articles stay in the page, on plain paper

  var hashId = function () { try { return decodeURIComponent(location.hash.slice(1)); } catch (e) { return ''; } };
  var putBack = function () {
    if (!cur) return;
    all('video', sheet).forEach(function (v) { v.pause(); });
    store.appendChild(F[cur]); cur = null;
  };
  var show = function (id) {
    if (cur === id && dlg.open) return;
    var turning = dlg.open;
    putBack(); cur = id;
    sheet.appendChild(F[id]); sheet.scrollTop = 0;
    dlg.classList.toggle('brief', F[id].classList.contains('brief'));
    dlg.setAttribute('aria-labelledby', id + '-title');
    if (!dlg.open) { dlg.showModal(); FLOOR.hold(true); }
    if (turning) { var h = $(id + '-title'); if (h) h.focus({ preventScroll: true }); }
  };
  var hide = function () {
    var id = cur; putBack();
    if (dlg.open) dlg.close();
    FLOOR.hold(false);
    var c = id && cardOf(id); if (c) c.focus({ preventScroll: true });
  };
  var sync = function () { var id = hashId(); if (F[id]) show(id); else if (cur || dlg.open) hide(); };
  // open a folio.  From the floor this is a new step in the history, so Back shuts it; from folio to folio it is not.
  var go = function (id) {
    try { if (dlg.open) history.replaceState(history.state, '', '#' + id); else history.pushState({ folio: true }, '', '#' + id); }
    catch (e) { location.hash = id; return; }
    sync();
  };
  var shut = function () {
    if (history.state && history.state.folio) { history.back(); return; }            // then "popstate" shuts it
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
    sync();
  };

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    if (a.matches('.thumbs a')) { e.preventDefault(); pick(a); return; }
    var h = a.getAttribute('href') || '';
    if (root.classList.contains('js') && h.charAt(0) === '#' && F[h.slice(1)]) { e.preventDefault(); go(h.slice(1)); }
  });
  $('close').addEventListener('click', shut);
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); shut(); });        // Esc
  dlg.addEventListener('close', function () { if (cur) shut(); });
  dlg.addEventListener('click', function (e) {                                         // a click outside the card
    if (e.target !== dlg) return;
    var r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) shut();
  });
  dlg.addEventListener('keydown', function (e) {                                       // left and right go through the pictures
    if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.target.tagName === 'VIDEO') return;
    var th = all('.thumbs a', sheet), i = -1;
    if (th.length < 2) return;
    th.forEach(function (t, n) { if (t.getAttribute('aria-current') === 'true') i = n; });
    e.preventDefault(); pick(th[(i + (e.key === 'ArrowRight' ? 1 : th.length - 1)) % th.length]);
  });
  window.addEventListener('popstate', sync);
  window.addEventListener('hashchange', sync);

  // ================================================================================================================
  // Part two: the floor
  // ================================================================================================================
  // Where the picture was drawn to have each thing (scene units): centre x, centre y, width, turn in degrees.
  // A folio is 360 x 300, the slip 220 x 80.  The safe box is always kept in view, between the frieze and the dado.
  var POS = {
    wide: {
      W: 1600, H: 900, safe: [180, 90, 1390, 805], slip: [150, 110, 220, -3],
      fo: { shelf: [372, 296, 316, -9], 'open-transcribe': [672, 232, 272, 8], claudemonitor: [1082, 318, 326, -4], dpay: [1188, 636, 366, 5], utopia: [815, 660, 300, -7], 'dalal-street': [430, 640, 330, 10] }
    },
    tall: {
      W: 800, H: 1250, safe: [120, 100, 690, 1010], slip: [400, 150, 220, -2],
      fo: { shelf: [265, 330, 262, -7], 'open-transcribe': [540, 342, 236, 5], claudemonitor: [266, 606, 250, 3], dpay: [536, 600, 272, -6], utopia: [262, 874, 246, -3], 'dalal-street': [540, 884, 258, 7] }
    }
  };
  var SC = window.LAKE_SCENES || {};
  var query = new URLSearchParams(location.search);
  var room = $('room'), picture = $('picture'), slip = $('slip'), topBar = $('top'), dado = $('dado'), pauseBtn = $('pause'), theme = $('theme');
  var CV = { sketch: $('sketch'), paint: $('paint'), under: $('under'), shade: $('shade'), glow: $('glow'), top: $('topc') };
  var LAYERS = ['under', 'glow', 'shade', 'top'];
  var FOS = all('.fo'), moodBtns = all('.moods button');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var rr = function (a, b) { return a + Math.random() * (b - a); };
  var TICK = 1 / 12;
  if (!room) return;
  var G = {};
  for (var nm in CV) {
    G[nm] = CV[nm] && CV[nm].getContext && CV[nm].getContext('2d');
    if (!G[nm]) return;
  }

  // which picture stands for the floor: the floor itself, or (only to try the layers and the hours, with ?fake=1) the lake
  var PLACE = query.has('fake') && SC['day-wide'] ? 'lake' : (SC['floor-day-wide'] || SC['floor-day-tall'] ? 'floor' : null);
  var FAKE = PLACE === 'lake';

  // ---- which hour it is in the picture ---------------------------------------------------------------------------
  function moodNow() {
    var m = query.get('mood');
    if (m === 'day' || m === 'dusk' || m === 'night') return m;
    var h = parseFloat(query.get('hour'));
    if (!(h >= 0 && h < 24)) { var d = new Date(); h = d.getHours() + d.getMinutes() / 60; }
    return h < 5 || h >= 19.5 ? 'night' : h < 7 || h >= 17 ? 'dusk' : 'day';
  }
  function key(m, f) { return (PLACE === 'lake' ? '' : PLACE + '-') + m + '-' + f; }
  function fmtOf(f) { return SC[key('day', f)] ? f : (f === 'wide' ? 'tall' : 'wide'); }
  var THEME = { day: '#b3301f', dusk: '#9a2b1d', night: '#4c1a1a' };

  var mood = PLACE ? moodNow() : 'day', fmt = 'wide';
  var vw = 0, vh = 0, k = 1, ox = 0, oy = 0, dpr = 1, K = 1, OX = 0, OY = 0;   // the window, and scene units to pixels
  var scene = null, initialPainting = null, CELS = null, ATLAS = null, SS = 1, EDGE = null;
  var layers = {}, tick = 0, acc = 0, last = 0, raf = 0;
  var wantPlay = !reduce.matches, playing = false, held = !!dlg.open, busy = true;

  // ---- where things go -------------------------------------------------------------------------------------------
  // The picture covers the window, unless that would cut into the safe box: then it is made smaller, and the floor
  // colour fills what it leaves bare.  The safe box is kept between the frieze and the dado, as near the middle as it can be.
  function fitOf(f, w, h) {
    var P = POS[f], s = P.safe, hh = topBar.offsetHeight, dh = dado.offsetHeight, uh = Math.max(40, h - hh - dh);
    var kk = Math.min(Math.max(w / P.W, h / P.H), w / (s[2] - s[0]), uh / (s[3] - s[1]));
    var pw = P.W * kk, ph = P.H * kk;
    var x = w / 2 - (s[0] + s[2]) / 2 * kk, y = hh + uh / 2 - (s[1] + s[3]) / 2 * kk;
    x = pw >= w ? clamp(x, w - pw, 0) : clamp(x, 0, w - pw);
    y = ph >= h ? clamp(y, h - ph, 0) : clamp(y, 0, h - ph);
    x = clamp(x, -s[0] * kk, w - s[2] * kk);                  // the safe box wins over covering
    y = clamp(y, hh - s[1] * kk, h - dh - s[3] * kk);
    return { f: f, k: kk, ox: x, oy: y, bare: 1 - Math.min(pw, w) * Math.min(ph, h) / (w * h) };
  }
  // the shape that leaves less of the window bare; when both fill it, the shape of the window
  function shapeFor(w, h) {
    var have = PLACE ? ['wide', 'tall'].filter(function (f) { return !!SC[key('day', f)]; }) : [];
    if (have.length === 1) return fitOf(have[0], w, h);          // only one shape is drawn yet: the folios go where it has them
    var a = fitOf('wide', w, h), b = fitOf('tall', w, h);
    if (Math.abs(a.bare - b.bare) < 0.004) return w >= h ? a : b;
    return a.bare < b.bare ? a : b;
  }
  function layout() {
    vw = room.clientWidth; vh = room.clientHeight;
    var m = shapeFor(vw, vh); fmt = m.f; k = m.k; ox = m.ox; oy = m.oy;
    var P = POS[fmt];
    FOS.forEach(function (a) {
      var p = P.fo[a.getAttribute('data-id')]; if (!p) return;
      var w = p[2] * k, h = w * 300 / 360;
      a.style.width = w.toFixed(2) + 'px';
      a.style.setProperty('--x', (ox + p[0] * k - w / 2).toFixed(2) + 'px');
      a.style.setProperty('--y', (oy + p[1] * k - h / 2).toFixed(2) + 'px');
      a.style.setProperty('--r', p[3] + 'deg');
      a.style.setProperty('--lift', Math.max(3, 7 * k).toFixed(1) + 'px');
    });
    // the slip lies outside the safe box: when the picture is cut at the side, it is moved in so the word stays whole
    var s = P.slip, sw = Math.max(s[2] * k, 132), sh = sw * 80 / 220;
    var sx = clamp(ox + s[0] * k - sw / 2, 8, vw - sw - 8), sy = Math.max(oy + s[1] * k - sh / 2, topBar.offsetHeight + 6);
    slip.style.width = sw.toFixed(2) + 'px';
    slip.style.setProperty('--x', sx.toFixed(2) + 'px');
    slip.style.setProperty('--y', sy.toFixed(2) + 'px');
    slip.style.setProperty('--r', s[3] + 'deg');
    // the sheets the picture is drawn on: as many pixels as the screen has, within reason
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    while (dpr > 1 && vw * vh * dpr * dpr > 5.5e6) dpr -= 0.25;
    K = k * dpr; OX = Math.round(ox * dpr); OY = Math.round(oy * dpr);
    var cw = Math.round(vw * dpr), ch = Math.round(vh * dpr);
    for (var n in CV) if (CV[n].width !== cw || CV[n].height !== ch) { CV[n].width = cw; CV[n].height = ch; }
  }

  // ---- loading -----------------------------------------------------------------------------------------------------
  var cache = {};
  function img(src, first) {
    if (!cache[src]) cache[src] = new Promise(function (res, rej) {
      var i = new Image();
      i.decoding = 'async';
      if (first) i.fetchPriority = 'high';
      // a browser may put off the decoding while the page is not in view: do not wait for it longer than a moment
      i.onload = function () { var go = function () { res(i); }; setTimeout(go, 700); if (i.decode) i.decode().then(go, go); else go(); };
      i.onerror = function () { rej(new Error('could not load ' + src)); };
      i.src = 'assets/' + src;
    });
    return cache[src];
  }
  function sceneKey(m, f) { f = fmtOf(f); return SC[key(m, f)] ? key(m, f) : key('day', f); }
  function loadScene(m, f, onBackground) {
    f = fmtOf(f);
    var kk = sceneKey(m, f), man = SC[kk];
    var background = img(man.bg, true);
    var atlas = img(man.atlas).catch(function () { return null; });
    return background.then(function (im) {
      var sc = { key: kk, mood: SC[key(m, f)] ? m : 'day', fmt: f, man: man, bg: im, edge: edgeOf(im) };
      if (onBackground) onBackground(sc);
      return atlas.then(function (drawing) { sc.atlas = drawing; return sc; });
    });
  }
  // the colour of each edge of the picture, to fill what it leaves bare
  function edgeOf(im) {
    try {
      var c = document.createElement('canvas'), w = 48, h = Math.max(8, Math.round(48 * im.height / im.width)), g = c.getContext('2d');
      c.width = w; c.height = h; g.drawImage(im, 0, 0, w, h);
      var d = g.getImageData(0, 0, w, h).data;
      var mean = function (x0, y0, x1, y1) { var r = 0, gg = 0, b = 0, n = 0; for (var y = y0; y < y1; y++) for (var x = x0; x < x1; x++) { var i = (y * w + x) * 4; r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; } return [r / n | 0, gg / n | 0, b / n | 0]; };
      return { l: mean(0, 0, 2, h), r: mean(w - 2, 0, w, h), t: mean(0, 0, w, 2), b: mean(0, h - 2, w, h) };
    } catch (e) { return null; }
  }

  // ---- the picture -------------------------------------------------------------------------------------------------
  function drawImageFit(g, im, man) {
    g.imageSmoothingQuality = 'high';
    g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    var w = Math.round(man.w * K), h = Math.round(man.h * K);
    g.drawImage(im, OX, OY, w, h);
    return [OX, OY, w, h];
  }
  function bare(g, box, e) {
    if (!e) return;
    var cw = g.canvas.width, ch = g.canvas.height, f = Math.round(36 * dpr);
    var rgb = function (c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
    var side = function (c, x, y, w, h, gx0, gy0, gx1, gy1) {
      g.fillStyle = rgb(c, 1); g.fillRect(x, y, w, h);
      var gr = g.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, rgb(c, 1)); gr.addColorStop(1, rgb(c, 0));
      g.fillStyle = gr;
      g.fillRect(Math.min(gx0, gx1), Math.min(gy0, gy1), Math.abs(gx1 - gx0) || cw, Math.abs(gy1 - gy0) || ch);
    };
    var x0 = box[0], y0 = box[1], x1 = box[0] + box[2], y1 = box[1] + box[3];
    if (x0 > 0) side(e.l, 0, 0, x0 + 1, ch, x0, 0, x0 + f, 0);
    if (x1 < cw) side(e.r, x1 - 1, 0, cw - x1 + 1, ch, x1, 0, x1 - f, 0);
    if (y0 > 0) side(e.t, 0, 0, cw, y0 + 1, 0, y0, 0, y0 + f);
    if (y1 < ch) side(e.b, 0, y1 - 1, cw, ch - y1 + 1, 0, y1, 0, y1 - f);
  }
  function drawPaint(sc) { bare(G.paint, drawImageFit(G.paint, sc.bg, sc.man), sc.edge); }
  var sketchIm = null, sketchMan = null;
  function drawSketch() { if (sketchIm) bare(G.sketch, drawImageFit(G.sketch, sketchIm, sketchMan), scene && scene.edge); }

  // ---- laying a drawing down ---------------------------------------------------------------------------------------
  // name: which drawing.  (ux, uy): where its anchor goes, in scene units.  alpha: how strongly.
  function put(g, name, ux, uy, alpha) {
    var c = CELS[name]; if (!c) return;
    var m = K / SS, dw = c[2] * m, dh = c[3] * m, X = OX + ux * K - c[4] * K, Y = OY + uy * K - c[5] * K;
    if (X + dw < 0 || X > g.canvas.width || Y + dh < 0 || Y > g.canvas.height) return;
    if (alpha != null && alpha < 1) { if (alpha <= 0.01) return; g.globalAlpha = alpha; }
    g.drawImage(ATLAS, c[0], c[1], c[2], c[3], Math.round(X), Math.round(Y), Math.round(dw), Math.round(dh));
    g.globalAlpha = 1;
  }
  function backAndForth(n) { var s = [], i; for (i = 1; i < n; i++) s.push(i); for (i = n - 2; i >= 1; i--) s.push(i); return s; }

  // ---- the actors --------------------------------------------------------------------------------------------------
  // Each maker takes the plain data of one actor and gives back { live, draw(g, n, t, adv) }: n the tick, t its time
  // in seconds, adv true when the tick is new (so things may move on) and false when it is only drawn again.
  // `still` is true when nothing is to move: then each actor shows its first frame.
  var ACT = {
    still: function (a) { return { live: false, draw: function (g) { put(g, a.cel || a.cels[0], a.x, a.y, a.alpha); } }; },
    boil: function (a, still) {
      var seq = a.seq || a.cels.map(function (c, i) { return i; }), hold = a.hold || 2;
      return { live: !still && seq.length > 1, draw: function (g, n) { put(g, a.cels[seq[Math.floor((still ? 0 : n) / hold) % seq.length]], a.x, a.y); } };
    },
    sway: function (a, still) {
      var seq = a.seq || backAndForth(a.cels.length), hold = a.hold || 2, ev = a.every || [6, 14], start = -1, next = rr(ev[0] * 0.3, ev[1]);
      return { live: !still && seq.length > 0, draw: function (g, n, t, adv) {
        var i = 0;
        if (!still) {
          if (adv && start < 0 && t >= next) start = n;
          if (start >= 0) { var f = Math.floor((n - start) / hold); if (f >= seq.length) { start = -1; next = t + rr(ev[0], ev[1]); } else i = seq[f]; }
        }
        put(g, a.cels[i], a.x, a.y);
      } };
    },
    breeze: function (a, still) {
      var w = 2 * Math.PI / (a.period || 6), ph = still ? 0 : rr(0, 6.28), hold = a.hold || 3, amp = a.amp || [6, 3];
      return { live: !still, draw: function (g, n, t) {
        var c = a.cels[Math.floor((still ? 0 : n) / hold) % a.cels.length];
        if (still) { put(g, c, a.x, a.y); return; }
        put(g, c, a.x + amp[0] * Math.sin(w * t + ph), a.y + amp[1] * Math.sin(w * t * 0.83 + ph + 1.1));
      } };
    },
    flicker: function (a, still) {
      var hold = a.hold || 2, al = a.alpha || [0.75, 1], v = (al[0] + al[1]) / 2;
      return { live: !still, draw: function (g, n, t, adv) {
        if (adv && !still) v += (rr(al[0], al[1]) - v) * 0.55;
        put(g, a.cels[Math.floor((still ? 0 : n) / hold) % a.cels.length], a.x, a.y, still ? al[1] : v);
      } };
    },
    // small lights that wander in a box, and come and go
    twinkle: function (a, still) {
      var b = a.box, ev = a.every || [1.5, 5], L = [], n = a.n || 8, i;
      for (i = 0; i < n; i++) L.push({ x: rr(b[0], b[2]), y: rr(b[1], b[3]), vx: rr(-7, 7), vy: rr(-5, 5), a: still ? (i % 2 ? 1 : 0) : 0, on: false, until: rr(0, ev[1]), c: i % a.cels.length });
      return { live: !still, draw: function (g, nn, t, adv) {
        for (var j = 0; j < L.length; j++) {
          var p = L[j];
          if (adv && !still) {
            p.vx = clamp(p.vx + rr(-1.6, 1.6), -9, 9); p.vy = clamp(p.vy + rr(-1.2, 1.2), -7, 7);
            p.x += p.vx * TICK; p.y += p.vy * TICK;
            if (p.x < b[0] || p.x > b[2]) { p.vx = -p.vx; p.x = clamp(p.x, b[0], b[2]); }
            if (p.y < b[1] || p.y > b[3]) { p.vy = -p.vy; p.y = clamp(p.y, b[1], b[3]); }
            if (t >= p.until) { p.on = !p.on; p.until = t + (p.on ? rr(0.7, 2.6) : rr(ev[0], ev[1])); }
            p.a = clamp(p.a + (p.on ? 0.22 : -0.16), 0, 1);
            if (nn % 3 === j % 3) p.c = (p.c + 1) % a.cels.length;
          }
          if (p.a > 0.02) put(g, a.cels[p.c], p.x, p.y, p.a);
        }
      } };
    }
  };

  // ?fake=1 with no floor drawn yet: one actor of each kind on each layer, made of any drawings the stand-in has
  function fakeActors(man) {
    var names = Object.keys(man.cels).filter(function (nm) { var c = man.cels[nm], w = c[2] / man.S, h = c[3] / man.S; return w > 30 && w < 260 && h > 24 && h < 200; });
    var c = function (i) { return names[i % names.length]; }, P = POS[fmt === 'tall' ? 'tall' : 'wide'];
    var d = P.fo['dalal-street'], u = P.fo.utopia;
    return [
      { type: 'boil', layer: 'under', cels: [c(0), c(1), c(2)], x: P.W * 0.5, y: P.H * 0.5, hold: 4 },
      { type: 'breeze', layer: 'shade', cels: [c(3), c(4)], x: d[0], y: d[1], amp: [10, 5], period: 5, hold: 4 },
      { type: 'still', layer: 'glow', cel: c(5), x: u[0], y: u[1] },
      { type: 'flicker', layer: 'glow', cels: [c(6), c(7)], x: P.W * 0.06, y: P.H * 0.7, hold: 3, alpha: [0.5, 1] },
      { type: 'twinkle', layer: 'glow', cels: [c(8), c(9)], box: [P.W * 0.1, P.H * 0.15, P.W * 0.9, P.H * 0.85], n: 6, every: [1, 3] },
      { type: 'sway', layer: 'top', cels: [c(10), c(11), c(12)], x: d[0] + 150, y: d[1] + 140, every: [2, 4], hold: 3 }
    ];
  }

  // ---- the layers --------------------------------------------------------------------------------------------------
  function drawLayer(name, adv) {
    var L = layers[name], g = G[name];
    g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    if (!L) return;
    var t = tick * TICK;
    for (var i = 0; i < L.list.length; i++) L.list[i].draw(g, tick, t, adv);
  }
  function drawLayers(adv, liveOnly) { LAYERS.forEach(function (nm) { if (!liveOnly || (layers[nm] && layers[nm].live)) drawLayer(nm, adv); }); }

  // put a scene on the sheets, and its actors at their first places
  function showScene(sc) {
    scene = sc; mood = sc.mood; CELS = sc.man.cels; ATLAS = sc.atlas; SS = sc.man.S;
    body.dataset.mood = mood;
    moodBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mood === mood)); });
    if (theme) theme.setAttribute('content', THEME[mood] || THEME.day);
    if (sc !== initialPainting) drawPaint(sc);
    initialPainting = null;
    var still = !wantPlay;
    var list = !ATLAS ? [] : FAKE ? fakeActors(sc.man) : sc.man.actors || [];
    layers = {};
    list.map(function (a, i) { return { a: a, i: i }; })
      .sort(function (p, q) { return ((p.a.z || 0) - (q.a.z || 0)) || p.i - q.i; })
      .forEach(function (o) {
        var a = o.a, nm = LAYERS.indexOf(a.layer) >= 0 ? a.layer : 'under', mk = ACT[a.type];
        if (!mk) return;
        var act = mk(a, still), L = layers[nm] || (layers[nm] = { list: [], live: false });
        L.list.push(act); L.live = L.live || act.live;
      });
    LAYERS.forEach(function (nm) { CV[nm].style.display = layers[nm] ? '' : 'none'; });
    tick = 0; acc = 0; drawLayers(false);
  }

  // ---- the clock ---------------------------------------------------------------------------------------------------
  function frame(now) {
    raf = 0;
    var dt = Math.min(0.12, Math.max(0, (now - last) / 1000)); last = now;
    if (!playing) return;
    acc += dt; if (acc >= TICK) { acc %= TICK; tick++; drawLayers(true, true); }
    raf = requestAnimationFrame(frame);
  }
  // it moves when the visitor wants it to, the page is in view, and no folio is open over it
  function setPlay() {
    var was = playing;
    playing = wantPlay && !held && !document.hidden && !!ATLAS;
    body.classList.toggle('still', !(wantPlay && !held && !document.hidden));
    if (playing && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    if (was !== playing && scene && !playing) drawLayers(false);
  }
  FLOOR.hold = function (on) { held = !!on; setPlay(); };

  // the old picture stays on a loose sheet over the new one, and fades; the drawings over the folios come back softly
  function swap(sc) {
    var old = document.createElement('canvas'), g;
    old.width = CV.paint.width; old.height = CV.paint.height; old.className = 'old';
    g = old.getContext('2d'); g.drawImage(CV.paint, 0, 0); if (CV.under.style.display !== 'none') g.drawImage(CV.under, 0, 0);
    picture.appendChild(old);
    LAYERS.slice(1).forEach(function (nm) { CV[nm].style.transition = 'none'; CV[nm].style.opacity = '0'; });
    showScene(sc); setPlay();
    void old.offsetWidth;
    old.style.opacity = '0';
    LAYERS.slice(1).forEach(function (nm) { CV[nm].style.transition = ''; CV[nm].style.opacity = ''; });
    setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); busy = false; }, reduce.matches ? 0 : 900);
  }
  function go2(m, btn) {
    if (busy || !scene || m === mood) return;
    busy = true; btn.setAttribute('aria-busy', 'true');
    loadScene(m, fmt).then(function (sc) { btn.removeAttribute('aria-busy'); swap(sc); }, function () { btn.removeAttribute('aria-busy'); busy = false; });
  }

  // for looking at it from outside
  window.FLOOR = {
    seek: function (n) { if (!scene) return; for (var i = 0; i < n; i++) { tick++; drawLayers(true, true); } },
    state: function () {
      var lay = {}; LAYERS.forEach(function (nm) { if (layers[nm]) lay[nm] = { n: layers[nm].list.length, live: layers[nm].live }; });
      return { place: PLACE, fake: FAKE, mood: mood, fmt: fmt, scene: scene && scene.key, tick: tick, busy: busy, playing: playing, view: [vw, vh], k: +k.toFixed(4), origin: [+ox.toFixed(1), +oy.toFixed(1)], dpr: dpr, layers: lay };
    },
    rects: function () { return FOS.map(function (a) { var r = a.getBoundingClientRect(); return [a.getAttribute('data-id'), Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; }); }
  };

  // ---- start -------------------------------------------------------------------------------------------------------
  root.classList.add('js');
  try {
    layout();
  } catch (error) {
    root.classList.remove('js');
    throw error;
  }
  body.dataset.mood = mood;
  requestAnimationFrame(function () { requestAnimationFrame(function () { room.classList.add('placed'); }); });
  var rz = 0;
  var onResize = function (fn) {             // while the window is dragged the folios follow it at once, without easing
    window.addEventListener('resize', function () {
      room.classList.remove('placed'); clearTimeout(rz);
      rz = setTimeout(function () { fn(); requestAnimationFrame(function () { room.classList.add('placed'); }); }, 120);
    });
    if (document.fonts) {
      document.fonts.ready.then(fn);
      document.fonts.addEventListener('loadingdone', fn);
    }
  };
  if (!PLACE) {                                      // no picture: the folios lie on a plain floor
    body.classList.add('still');
    onResize(layout);
    sync();
    return;
  }
  body.classList.add('pic');
  var hours = moodBtns.filter(function (b) { return !!SC[key(b.dataset.mood, fmtOf(fmt))]; });
  moodBtns.forEach(function (b) {
    b.hidden = hours.length < 2 || hours.indexOf(b) < 0;
    b.setAttribute('aria-pressed', String(b.dataset.mood === mood));
    b.addEventListener('click', function () { go2(b.dataset.mood, b); });
  });
  var syncPause = function () { pauseBtn.textContent = wantPlay ? 'Pause' : 'Play'; pauseBtn.setAttribute('aria-pressed', String(!wantPlay)); };
  syncPause();
  pauseBtn.addEventListener('click', function () {
    wantPlay = !wantPlay; syncPause();
    if (scene) showScene(scene);                     // the actors are made again: moving, or each at its first frame
    setPlay();
  });
  document.addEventListener('visibilitychange', setPlay);
  if (reduce.addEventListener) reduce.addEventListener('change', function () { wantPlay = !reduce.matches; syncPause(); if (scene) showScene(scene); setPlay(); });

  // Show the sketch when available, then paint the floor while its animation loads.
  function showInitialPainting(sc) {
    if (sc.fmt !== fmtOf(fmt)) return;
    initialPainting = sc;
    body.dataset.mood = sc.mood;
    drawPaint(sc);
    room.classList.add('on');
  }
  function startScene() {
    return loadScene(mood, fmt, showInitialPainting).then(function (sc) {
      if (sc.fmt !== fmtOf(fmt)) return startScene();
      showScene(sc); busy = false; setPlay();
    });
  }
  startScene().catch(function () { busy = false; body.classList.remove('pic'); body.classList.add('still'); });
  var man0 = SC[sceneKey(mood, fmt)];
  if (man0 && man0.sketch) img(man0.sketch).then(function (im) {
    if (scene || initialPainting) return;
    sketchIm = im; sketchMan = man0; drawSketch(); CV.sketch.classList.add('on');
  }, function () {});

  // the window changes shape
  function relayout() {
    var f0 = fmt; layout();
    if (!scene) {
      if (initialPainting && initialPainting.fmt === fmtOf(fmt)) drawPaint(initialPainting);
      if (sketchIm) drawSketch();
      return;
    }
    if (fmtOf(fmt) !== scene.fmt) {
      loadScene(mood, fmt).then(function (sc) { if (sc.fmt === fmtOf(fmt)) { showScene(sc); setPlay(); } });
      return;
    }
    drawPaint(scene); drawLayers(false);
    if (f0 !== fmt && sketchIm) drawSketch();
  }
  onResize(relayout);
  sync();
})();
