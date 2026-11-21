/* Experience: the stepwell, as one painting.

   The page is one painting, 16:9, of a stepwell seen from its rim.  It is cut into a pyramid of tiles: the whole of it
   at 1920 x 1080, then finer levels made of 960 x 1080 tiles, for coming closer (assets/well8k/manifest.js says where
   they are; until the painting is done, assets/well8k-ph/ stands in for it).  The page opens on the whole painting, and
   going down, a camera flies into it: five levels, the newest first, and then the water.  Going down is going back in
   time.

   The stops: 0 the whole well, then one for each thing the card tells of (the manifest's stops, or the data's), then
   the water.  The wheel, a finger, the arrow keys, the card's buttons, its row of years and the year gauge all go from
   stop to stop.  Between two stops the camera goes the way an eye would: it draws back a little, crosses, and comes in
   again (van Wijk and Nuij, "Smooth and efficient zooming and panning", 2003).  The card on the right (a sheet at the
   foot of a phone) says where you are; its words are in experience-data.js.  On the left a carved gauge stands in water,
   as in a dam: it rises as you go down, and the year at the water line is the year you are at.

   On the painting lies one sheet of loose drawings ("cels"), shown twelve to the second as on the other pages: birds,
   motes, rings on the water, and the lamp of each alcove, which lights when you first come to its year and stays lit.
   At a stop the rest of the painting goes a little dim round the thing the stop is about; a thing under the pointer
   gets a little warm light. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!document.querySelector || !window.requestAnimationFrame || !window.EXPERIENCE) { root.classList.remove('js'); return; }
  // the painting's own manifest if it has been painted, and the stand-in if not
  if (window.WELL8K) start();
  else {
    var sc = document.createElement('script');
    sc.src = 'assets/well8k-ph/manifest.js';
    sc.onload = function () { if (window.WELL8K) start(); else root.classList.remove('js'); };
    sc.onerror = function () { root.classList.remove('js'); };
    document.head.appendChild(sc);
  }

  function start() {
  var M = window.WELL8K, D = window.EXPERIENCE, body = document.body;
  var $ = function (id) { return document.getElementById(id); };
  var all = function (sel, e) { return Array.prototype.slice.call((e || document).querySelectorAll(sel)); };
  var el = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var rr = function (a, b) { return a + Math.random() * (b - a); };
  var sstep = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var TICK = 1 / 12, LW = M.LW || 1920, LH = M.LH || 1080, BG = M.bg || '#d9bf8a';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var query = new URLSearchParams(location.search);

  // ---- the hour in the painting: day, dusk or night, by the same rule as the other pages (?mood=, else ?hour=, else
  // the clock here).  The day is the manifest's own tiles, lamps and glints; a dusk or a night is its moods[m]:
  // { pyramid, lamps, glints } (and objs, bg if it has them).  A mood the manifest does not have is day.
  var MOODS = M.moods || {}, MOODBG = { day: BG, dusk: '#9c7656', night: '#1d2030' };
  function hasMood(m) { return m === 'day' || !!(MOODS[m] && MOODS[m].pyramid && MOODS[m].pyramid.length); }
  function moodNow() {
    var m = query.get('mood');
    if (m === 'day' || m === 'dusk' || m === 'night') return m;
    var h = parseFloat(query.get('hour'));
    if (!(h >= 0 && h < 24)) { var d = new Date(); h = d.getHours() + d.getMinutes() / 60; }
    return h < 5 || h >= 19.5 ? 'night' : h < 7 || h >= 17 ? 'dusk' : 'day';
  }
  function moodOf(m) {
    if (m === 'day' || !hasMood(m)) return { pyramid: M.pyramid, lamps: M.lamps, glints: M.glints, objs: M.objs || {}, bg: BG };
    var o = MOODS[m];
    return { pyramid: o.pyramid, lamps: o.lamps || M.lamps, glints: o.glints || M.glints, objs: o.objs || {}, bg: o.bg || MOODBG[m] || BG };
  }
  var mood = moodNow(); if (!hasMood(mood)) mood = 'day';

  var topBar = $('top'), hero = $('hero'), heroWords = $('heroWords'), well = $('well'), paint = $('paint'), live = $('live');
  var hotLayer = $('hot'), tip = $('tip'), card = $('card'), cardBody = $('cardBody'), lampList = $('lamps');
  var upBtn = $('up'), downBtn = $('down'), grab = $('grab'), pauseBtn = $('pause'), say = $('say');
  var pg = paint.getContext('2d', { alpha: false }), lg = live.getContext('2d');

  // ---- the drawn paper.  If a sheet does not load, plain lines stand in for it. -------------------------------------
  [['card', 'paper-card-sh.webp'], ['frieze', 'paper-frieze.webp'], ['slip', 'paper-slip.webp']].forEach(function (p) {
    var i = new Image();
    i.onerror = function () { root.classList.add('no-' + p[0]); };
    i.src = 'assets/' + p[1];
  });

  // ================================================================================================================
  // The years and the stops
  // ================================================================================================================
  var LV = D.levels.concat([D.water]);                       // the years, newest first, and then the water
  var HOT = M.hot || {};
  var mid = function (r) { return [r[0] + r[2] / 2, r[1] + r[3] / 2]; };
  // a year by its id, label or years ('y2022' or '2022'), as an index into LV
  function yearOf(key) {
    for (var i = 0; i < LV.length; i++) if (LV[i].id === key || LV[i].label === key || LV[i].years === key) return i;
    return -1;
  }
  // a thing told of in a year: a block, a smaller part inside a block, or a milestone
  function partOf(l, id) {
    var r = null;
    (l.blocks || []).forEach(function (b) {
      if (!r && b.obj === id) r = { title: b.title, thing: b.thing };
      (b.parts || []).forEach(function (p) { if (!r && p.obj === id) r = { title: p.title, thing: p.thing, part: true }; });
    });
    return r;
  }
  function hasObj(l, id) { return !!partOf(l, id) || (l.miles || []).some(function (m) { return m.obj === id; }); }
  // things only to hover, not stops and not in the card (a small trophy): { obj, year, text }
  var HOVER = {}; (D.hover || []).forEach(function (h) { if (h && h.obj) HOVER[h.obj] = h; });
  function yearOfObj(id) { for (var i = 0; i < LV.length; i++) if (hasObj(LV[i], id)) return i; return -1; }
  // The stops: { id, year (an index into LV, -1 for the whole well), obj, view, focus }.  The manifest's own when it has
  // one for each thing.  A manifest of the older shape has one for each level (and focus[] beside them): then there is
  // one for each thing in the data's order, each on its level's view, moved to have the thing at its middle.
  function readStops() {
    var S = M.stops || [], out = [];
    if (S.some(function (s) { return s && s.obj; })) {
      S.forEach(function (s, i) {
        var v = s.view || [0, 0, LW, LH];
        var y = i === 0 ? -1 : s.year != null ? yearOf(s.year) : s.obj ? yearOfObj(s.obj) : yearOf(s.id);
        if (i > 0 && y < 0) y = LV.length - 1;
        out.push({ id: s.id || s.obj || 'stop' + i, year: y, obj: s.obj || null, also: s.also || [], view: v, focus: s.focus || (s.obj && HOT[s.obj] ? mid(HOT[s.obj]) : mid(v)) });
      });
      return out;
    }
    var F = M.focus || [], lvView = function (y) { var s = S[y + 1]; return s && s.view ? s.view : [0, 0, LW, LH]; };
    out.push({ id: 'rim', year: -1, obj: null, also: [], view: lvView(-1), focus: F[0] || [LW / 2, LH / 2] });
    var order = (D.stops || []).slice();
    if (!order.length) LV.forEach(function (l) { (l.blocks || []).forEach(function (b) { order.push(b.obj); }); });
    order.forEach(function (id) {
      var y = yearOfObj(id); if (y < 0) return;
      var v = lvView(y), f = HOT[id] ? mid(HOT[id]) : F[y + 1] || mid(v);
      out.push({ id: id, year: y, obj: id, also: [], view: [clamp(f[0] - v[2] / 2, 0, LW - v[2]), clamp(f[1] - v[3] / 2, 0, LH - v[3]), v[2], v[3]], focus: f });
    });
    var w = LV.length - 1;
    out.push({ id: LV[w].id, year: w, obj: null, also: [], view: lvView(w), focus: F[w + 1] || mid(lvView(w)) });
    return out;
  }
  var STOPS = readStops(), NS = STOPS.length;
  // each year's first stop (-1: none)
  var FIRST = LV.map(function (l, y) { for (var i = 1; i < NS; i++) if (STOPS[i].year === y) return i; return -1; });
  function blockOf(i) { var s = STOPS[i]; return s && s.obj && s.year >= 0 ? (LV[s.year].blocks || []).filter(function (b) { return b.obj === s.obj; })[0] || null : null; }
  function plaqueOf(id) { var pq = null; if (id) Object.keys(D.plaques || {}).forEach(function (k) { if (!pq && k.indexOf(id) === 0) pq = D.plaques[k]; }); return pq; }
  // what a stop is called on the buttons: its thing's title, or its plaque's words, or its year
  function label(i) {
    if (i <= 0) return 'the whole well';
    var b = blockOf(i), pq = plaqueOf(STOPS[i].obj);
    return b ? b.title : pq ? pq[1] : LV[STOPS[i].year].label;
  }

  $('intro').textContent = D.intro;
  $('cueText').textContent = D.cue;
  paint.setAttribute('aria-label', M.alt || D.alt.hero);

  // the row of years: a lamp for each, and one for the water; each goes to its year's first stop
  var lampBtns = LV.map(function (l, y) {
    var li = el('li'), b = el('button', 'lamp');
    b.type = 'button';
    // the painter's diya (96 x 78 at 1431, 975 of assets/well-cels.webp), drawn into a small canvas when that has come
    var dc = b.appendChild(el('canvas', 'diya')); dc.width = 88; dc.height = 72; dc.setAttribute('aria-hidden', 'true');
    b.appendChild(el('span', 'lbl', l.label));
    li.appendChild(b); lampList.appendChild(li);
    if (FIRST[y] < 0) b.disabled = true;
    b.addEventListener('click', function () { if (FIRST[y] > 0) go(FIRST[y]); });
    return b;
  });

  // a line of text in which one word may be a link
  function linked(p, text, link) {
    var at = link ? text.indexOf(link.text) : -1;
    if (at < 0) { p.textContent = text; return p; }
    p.appendChild(document.createTextNode(text.slice(0, at)));
    var a = el('a', null, link.text); a.href = link.href; p.appendChild(a);
    p.appendChild(document.createTextNode(text.slice(at + link.text.length)));
    return p;
  }
  // ---- what the card says at each stop: the year (its years, the role, its milestones) and the one thing -----------
  var thumbs = [];                                           // { canvas, id, stop, lvl }: pictures cut from the painting
  var OBJEL = [];                                            // the card's parts tied to a thing (data-obj), at every stop
  var SEC = STOPS.map(function (s, i) {
    if (i === 0) return null;
    var l = LV[s.year], sec = el('section', 'lv');
    // (not the id of the address itself: the browser would scroll the card to it)
    sec.id = 'at-' + s.id; sec.dataset.stop = String(i);
    sec.setAttribute('aria-labelledby', 'h-' + s.id);
    var head = sec.appendChild(el('header', 'lv-head')), h = head.appendChild(el('h2', null, l.years));
    h.id = 'h-' + s.id; h.tabIndex = -1;
    head.appendChild(linked(el('p', 'role'), l.role, l.link));
    if (l.miles && l.miles.length) {
      var ul = sec.appendChild(el('ul', 'miles'));
      l.miles.forEach(function (m) {
        var li = ul.appendChild(el('li', 'mile ' + (m.kind || 'plain'), m.text));
        if (m.obj) { li.dataset.obj = m.obj; OBJEL.push(li); if (m.obj === s.obj) li.classList.add('here'); }
      });
    }
    var b = blockOf(i), pq = plaqueOf(s.obj);
    if (b || (s.obj && HOT[s.obj])) {
      var art = sec.appendChild(el('article', 'blk'));
      art.dataset.obj = s.obj; OBJEL.push(art);
      // the picture is a piece of the painting; pressing it brings the camera to that thing
      var lk = art.appendChild(el('button', 'look')); lk.type = 'button';
      lk.setAttribute('aria-label', b ? 'Show ' + b.thing + ' in the painting' : 'Show this in the painting');
      var c = lk.appendChild(el('canvas', 'thumb')); c.width = 720; c.height = 405; c.setAttribute('aria-hidden', 'true');
      if (HOT[s.obj]) { thumbs.push({ canvas: c, id: s.obj, stop: i, lvl: -1 }); lk.addEventListener('click', function () { if (sheet) openSheet(false); look(s.obj); }); }
      else lk.disabled = true;
      art.appendChild(el('h3', null, b ? b.title : pq ? pq[1] : label(i)));
      if (b) {
        art.appendChild(el('p', 'thing', b.thing));
        var txt = art.appendChild(el('div', 'txt'));
        b.lines.forEach(function (x) { txt.appendChild(el('p', null, x)); });
        // a smaller thing told of inside this one: its own small picture (press it to look at it) beside its words
        (b.parts || []).forEach(function (pt) {
          var pe = txt.appendChild(el('div', 'part'));
          pe.dataset.obj = pt.obj; OBJEL.push(pe);
          if (HOT[pt.obj]) {
            var pl = pe.appendChild(el('button', 'look small')); pl.type = 'button';
            pl.setAttribute('aria-label', 'Show ' + pt.thing + ', ' + pt.title + ', in the painting');
            var pc = pl.appendChild(el('canvas', 'thumb')); pc.width = 320; pc.height = 180; pc.setAttribute('aria-hidden', 'true');
            thumbs.push({ canvas: pc, id: pt.obj, stop: i, lvl: -1 });
            pl.addEventListener('click', function () { if (sheet) openSheet(false); look(pt.obj); });
          }
          var pw = pe.appendChild(el('div', 'part-words'));
          pw.appendChild(el('p', null, pt.text));
          if (pt.links && pt.links.length) {
            var pg2 = pw.appendChild(el('p', 'go'));
            pt.links.forEach(function (k) { var a = pg2.appendChild(el('a', null, k.text)); a.href = k.href; });
          }
        });
        if (b.links && b.links.length) {
          var go2 = txt.appendChild(el('p', 'go'));
          b.links.forEach(function (k) { var a = go2.appendChild(el('a', null, k.text)); a.href = k.href; });
        }
      }
    }
    if (l.lines) l.lines.forEach(function (x) { sec.appendChild(el('p', 'wl', x)); });
    (l.also || []).forEach(function (x) { sec.appendChild(el('p', 'also', x.text)); });
    return sec;
  });
  // Two panes, one over the other, hold the stops either side of where you are.  The upper one fades in over the lower
  // as you go from the one stop to the next, so the change follows the scroll.  (Each is a layer of its own, so the fade
  // costs no painting.)
  var panes = [0, 1].map(function () {
    var p = cardBody.appendChild(el('div', 'pane'));
    p.st = -1; p.op = -1; p.up = null; p.on = null;
    p.addEventListener('scroll', moreHint, { passive: true });
    return p;
  });
  function fillPane(p, i) {
    if (p.st === i) return false;
    p.st = i;
    if (SEC[i]) p.replaceChildren(SEC[i]); else p.replaceChildren();
    p.scrollTop = 0;
    return true;
  }
  function paneLook(p, op, up, on) {
    op = Math.round(op * 1000) / 1000;
    if (p.op !== op) { p.op = op; p.style.opacity = op >= 1 ? '' : String(op); }
    if (p.up !== up) { p.up = up; p.classList.toggle('up', up); }
    if (p.on === on) return false;
    var had = !on && p.contains(document.activeElement);
    p.on = on; p.inert = !on;
    if (on) p.removeAttribute('aria-hidden'); else p.setAttribute('aria-hidden', 'true');
    return had;
  }
  var focusTo = -1;
  function stepPanes() {
    var s = clamp(Math.floor(u), 0, NS - 2), f = clamp(u - s, 0, 1);
    // (on the way from the whole well the card itself comes in, with the first stop on it)
    var t = s === 0 ? 1 : instant() ? (f < 0.5 ? 0 : 1) : sstep(0.3, 0.7, f);
    var a = panes[0], b = panes[1], lo = s, hi = s + 1;
    var pLo = a.st === lo ? a : b.st === lo ? b : null, pHi = a.st === hi ? a : b.st === hi ? b : null;
    if (!pLo && !pHi) { pLo = a; pHi = b; } else if (!pLo) pLo = pHi === a ? b : a; else if (!pHi) pHi = pLo === a ? b : a;
    var changed = fillPane(pLo, lo) | fillPane(pHi, hi);
    // In one year the heading is the same on both, so it stays still while the upper pane comes in over the lower.
    // From one year to another the lower goes out before the upper comes in, so the two never show through each other.
    var same = s === 0 || STOPS[lo].year === STOPS[hi].year;
    var tLo = same || instant() ? 1 : 1 - sstep(0.3, 0.5, f), tHi = same || instant() ? t : sstep(0.5, 0.7, f);
    var lost = paneLook(pLo, tLo, false, t < 0.5) | paneLook(pHi, tHi, true, t >= 0.5);
    var vis = t >= 0.5 ? pHi : pLo;
    if (lost && vis.st > 0 && focusTo < 0) focusTo = vis.st;
    if (focusTo >= 0 && vis.st === focusTo) { var h = SEC[focusTo] && SEC[focusTo].querySelector('h2'); if (h) h.focus({ preventScroll: true }); focusTo = -1; }
    if (changed) moreHint();
  }
  function moreHint() { panes.forEach(function (p) { p.classList.toggle('more', p.st > 0 && p.scrollTop + p.clientHeight < p.scrollHeight - 6); }); }

  // ================================================================================================================
  // The things painted on the levels.  Each is a button over the painting, in sheet units; hover or focus one and its
  // part of the card lights up, and the other way round, and the thing gets a little warm light.
  // ================================================================================================================
  hotLayer.style.width = LW + 'px'; hotLayer.style.height = LH + 'px';
  var OBJ = {}, objList = [];
  // the stop a thing is shown at: its own, or else its year's first
  function stopOfObj(id) { for (var i = 1; i < NS; i++) if (STOPS[i].obj === id) return i; var y = yearOfObj(id); return y >= 0 ? FIRST[y] : -1; }
  Object.keys(HOT).forEach(function (id) {
    // (a thing only to hover has no stop: it belongs to its year, and says its own words)
    var hv = HOVER[id], n = hv ? -1 : stopOfObj(id), y = hv ? yearOf(hv.year) : yearOfObj(id);
    if (!hv && (n < 1 || y < 0)) return;
    var l = y >= 0 ? LV[y] : null, pt = l && !hv ? partOf(l, id) : null, mile = l && !hv ? (l.miles || []).filter(function (x) { return x.obj === id; })[0] : null;
    var r = HOT[id], b = el('button', 'obj');
    b.type = 'button'; b.tabIndex = -1; b.dataset.obj = id;
    b.setAttribute('aria-label', hv ? hv.text : (pt ? pt.title + ', ' + pt.thing : mile.text) + ' (' + l.years + ')');
    b.style.left = r[0] + 'px'; b.style.top = r[1] + 'px'; b.style.width = r[2] + 'px'; b.style.height = r[3] + 'px';
    hotLayer.appendChild(b);
    // the few words shown by it when it is not what the stop you are at is about (a part inside a block: its name)
    var pq = plaqueOf(id);
    var o = { id: id, r: r, stop: n, y: y, only: !!hv, btn: b, a: 0,
      tip: hv ? hv.text : pt ? (pt.part ? pt.title : pt.title + ', ' + l.years) : pq ? pq[1] + ', ' + pq[0] : mile.text };
    OBJ[id] = o; objList.push(o);
    b.addEventListener('mouseenter', function () { src.hover = id; lights(); });
    b.addEventListener('mouseleave', function () { if (src.hover === id) src.hover = null; lights(); });
    // (a press with the pointer gives it focus too; only focus from the keys lights it)
    b.addEventListener('focus', function () { var fv = true; try { fv = b.matches(':focus-visible'); } catch (e) { /* old browser */ } if (fv) { src.focus = id; lights(); } });
    b.addEventListener('blur', function () { if (src.focus === id) src.focus = null; lights(); });
    b.addEventListener('click', function () {
      // (a tap on a thing only to hover keeps its words up, for a finger, which cannot hover)
      if (o.only) { src.pin = src.pin === id ? null : id; lights(); return; }
      if (o.stop !== stop) { go(o.stop); flash(id); return; }
      flash(id); look(id);
    });
  });
  // a press anywhere else lets go of the words kept up
  window.addEventListener('pointerdown', function (e) {
    if (src.pin && !(e.target && e.target.closest && e.target.closest('.obj[data-obj="' + src.pin + '"]'))) { src.pin = null; lights(); }
  }, true);
  OBJEL.forEach(function (e) {
    var id = e.dataset.obj; if (!OBJ[id]) return;
    e.addEventListener('mouseenter', function () { src.card = id; lights(); });
    e.addEventListener('mouseleave', function () { if (src.card === id) src.card = null; lights(); });
  });
  // what is lit: the thing under the pointer, the one with focus, the one whose part of the card is under the pointer,
  // and the one the camera has gone to look at
  var src = { hover: null, focus: null, card: null, pin: null }, litObj = {}, hoverObj = null;
  function lights() {
    var on = {};
    [src.hover, src.focus, src.card, src.pin, lookT > 0 ? lookId : null].forEach(function (id) { if (id) on[id] = true; });
    objList.forEach(function (o) {
      var was = !!litObj[o.id], now = !!on[o.id];
      if (was === now) return;
      o.btn.classList.toggle('lit', now);
      OBJEL.forEach(function (e) { if (e.dataset.obj === o.id) e.classList.toggle('lit', now); });
    });
    litObj = on;
    hoverObj = OBJ[src.hover] || OBJ[src.focus] || OBJ[src.pin] || null;
    placeTip(); liveDirty = true; kick();
  }
  // a thing's part of the card, brought into view in the card, and flashed
  function flash(id) {
    var sec = SEC[OBJ[id] ? OBJ[id].stop : stop];
    var t = sec && sec.querySelector('.blk[data-obj="' + id + '"], .part[data-obj="' + id + '"], .mile[data-obj="' + id + '"]');
    if (!t) return;
    if (!sheet && t.isConnected) t.scrollIntoView({ block: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
    t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash');
  }
  var tipOn = false, tipW = 0;
  // the thing stop n is about (its own, or one it shows as well): its name needs no words by it there
  function ownAt(n, id) { return n > 0 && n < NS && (STOPS[n].obj === id || (STOPS[n].also || []).indexOf(id) >= 0); }
  function placeTip() {
    var o = hoverObj, show = !!o && !ownAt(stop, o.id) && (goal < 0 || !ownAt(goal, o.id));
    if (show !== tipOn) { tip.classList.toggle('on', show); tipOn = show; }
    if (!show) return;
    // (long words go on two lines, and the slip stays in the window)
    if (tip.textContent !== o.tip) { tip.textContent = o.tip; tip.classList.toggle('long', o.tip.length > 44); tipW = tip.offsetWidth; }
    var s = onScreen(cam, [o.r[0] + o.r[2] / 2, o.r[1]]), x = clamp(s[0], tipW / 2 + 8, Math.max(tipW / 2 + 8, vw - tipW / 2 - 8));
    tip.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(s[1] - 8) + 'px) translate(-50%,-100%)';
  }

  // ================================================================================================================
  // The camera.  cam = { x, y, w, k }: the point of the painting at the middle of the window, how much of the painting
  // the window is wide (sheet units), and the scale (CSS pixels to a unit, vw / w).  It never leaves the painting.
  // ================================================================================================================
  var vw = 0, vh = 0, hh = 0, sheet = false, peek = 0, dpr = 1, cardBox = 0, cardW = 0, cardM = 16, kCover = 1, kMax = 4;
  // (the whole well, from the rim, is shown whole below the frieze, sun and all, so it may be smaller than the window)
  var kRim = 1, kFloor = 1;
  var AREA = null;                                           // the part of the window between the gauge and the card (above the sheet)
  var cams = [], PATHS = [], YS = [];
  var cam = { x: LW / 2, y: LH / 2, w: LW, k: 1 };
  var PHONE_DIVE = 1.9;                                      // how much closer than the whole well a phone comes, at a level
  var RHO = 1.3;                                             // how far the camera draws back between stops (d3 uses 1.41)
  function mk(x, y, k) { return { x: x, y: y, w: vw / k, k: k }; }
  // (on a phone the foot of the painting may rise as far as the top of the sheet, which hides what is below it)
  var slackB = 0;
  // (the frieze at the top hides what is under it, so the painting's top edge may come down as far as its foot; and
  // a painting shorter than what is below the frieze sits right under it, with the water drawn on below it)
  function bound(c) {
    var k = Math.max(vw / c.w, kFloor), hx = vw / 2 / k, hy = vh / 2 / k;
    var lo = hy - hh / k, hi = LH - hy + slackB / k;
    return { x: hx <= LW / 2 ? clamp(c.x, hx, LW - hx) : LW / 2, y: lo <= hi ? clamp(c.y, lo, hi) : lo, w: vw / k, k: k };
  }
  function onScreen(c, p) { return [(p[0] - c.x) * c.k + vw / 2, (p[1] - c.y) * c.k + vh / 2]; }
  function clearOf(c, p, A, m) { var s = onScreen(c, p); return s[0] >= A.l + m && s[0] <= A.r - m && s[1] >= A.t + m && s[1] <= A.b - m; }
  // The camera for a stop: as close as shows rect r (x, y, w, h) in the part A of the window that is free (beside the
  // card, or above the sheet), with the focus f at the middle of A, or a little off it, away from the stair (toward is
  // the stair's x), so that the stair side shows more.  The camera never leaves the painting; if the edge of the
  // painting pushes the focus well off the middle, it comes closer (by half as much again at most) until the focus is
  // near the middle.
  function nearMid(c, f, A) {
    var s = onScreen(c, f);
    return Math.abs(s[0] - (A.l + A.r) / 2) <= 0.16 * (A.r - A.l) && Math.abs(s[1] - (A.t + A.b) / 2) <= 0.18 * (A.b - A.t);
  }
  function fit(r, f, A, kmin, toward) {
    var aw = A.r - A.l, ah = A.b - A.t, acx = (A.l + A.r) / 2, acy = (A.t + A.b) / 2;
    var k = clamp(Math.min(aw / r[2], ah / r[3]), Math.max(kCover, kmin || 0), Math.max(kMax, kCover));
    function at(k) {
      var px = f[0];
      if (toward != null) px += clamp(toward - f[0], -0.07 * aw / k, 0.07 * aw / k);
      return bound(mk(px - (acx - vw / 2) / k, f[1] - (acy - vh / 2) / k, k));
    }
    var c = at(k), kTop = Math.min(kMax, k * 1.45);
    for (var n = 0; n < 60 && k < kTop && !nearMid(c, f, A); n++) { k = Math.min(kTop, k * 1.04); c = at(k); }
    return c;
  }
  function focusOf(i) { return STOPS[i].focus; }
  function camFor(i) {
    var r = STOPS[i].view;
    // (at the rim the top of the painting, with its sun, is just under the frieze, on a phone too)
    if (i === 0) return bound(mk(r[0] + r[2] / 2, (vh / 2 - hh) / kRim, kRim));
    return fit(r, focusOf(i), AREA, sheet ? kCover * PHONE_DIVE : 0, M.stair || LW / 2);
  }
  // The way from one view to another (x, y the middle, w the width): the camera draws back and comes in again, so that
  // where it is going comes into view early.  S is how long the way is, in widths of the window.
  function zoomPath(a, b) {
    var x0 = a.x, y0 = a.y, w0 = a.w, w1 = b.w, dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, r2 = RHO * RHO, S, at;
    if (d2 < 1e-6) {
      S = Math.abs(Math.log(w1 / w0)) / RHO;
      at = function (t) { return { x: x0 + t * dx, y: y0 + t * dy, w: w0 * Math.pow(w1 / w0, t) }; };
    } else {
      var d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + r2 * r2 * d2) / (2 * w0 * r2 * d1), b1 = (w1 * w1 - w0 * w0 - r2 * r2 * d2) / (2 * w1 * r2 * d1);
      var q0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), q1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), ch0 = Math.cosh(q0), sh0 = Math.sinh(q0);
      S = (q1 - q0) / RHO;
      at = function (t) {
        var s = t * S, f = w0 / (r2 * d1) * (ch0 * Math.tanh(RHO * s + q0) - sh0);
        return { x: x0 + f * dx, y: y0 + f * dy, w: w0 * ch0 / Math.cosh(RHO * s + q0) };
      };
    }
    return { S: Math.abs(S), at: function (t) { return t <= 0 ? { x: a.x, y: a.y, w: a.w } : t >= 1 ? { x: b.x, y: b.y, w: b.w } : at(t); } };
  }
  function camAtU(v) {
    var i = clamp(Math.floor(v), 0, NS - 2), f = clamp(v - i, 0, 1);
    return bound(PATHS[i].at(f));
  }
  function mix(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: a.w * Math.pow(b.w / a.w, t) }; }

  // ---- a closer look at one thing (from its card block, or a press on it) -------------------------------------------
  var lookId = null, lookA = 0, lookT = 0, vL = 0, lookCam = null;
  function look(id) {
    var o = OBJ[id]; if (!o) return;
    if (o.stop !== stop) go(o.stop);
    var r = o.r, pad = Math.max(r[2], r[3]) * 0.5 + 26;
    lookId = id; lookT = 1;
    lookCam = fit([r[0] - pad, r[1] - pad, r[2] + 2 * pad, r[3] + 2 * pad], [r[0] + r[2] / 2, r[1] + r[3] / 2], AREA, cams[o.stop].k);
    lights(); dirty = true; kick();
  }
  function unlook() { if (lookT !== 0) { lookT = 0; lights(); kick(); } }

  // ================================================================================================================
  // Where we are.  The reader's place is one number, Y: how far down they have scrolled, in screen pixels, from the
  // whole well (0) to the water.  Y follows its target YT on a critically damped spring, so a move never starts or
  // stops with a jolt, whatever set the target.  From Y comes u (0 the whole well, 1, 2, ... the stops, the last the water).
  // ================================================================================================================
  var stop = 0, Y = 0, vY = 0, YT = 0, om = 4, u = 0, goal = -1;
  function uOfY(y) {
    y = clamp(y, 0, YS[NS - 1]);
    var i = 0; while (i < NS - 2 && y > YS[i + 1]) i++;
    return i + (y - YS[i]) / Math.max(1e-6, YS[i + 1] - YS[i]);
  }
  function yOfU(v) { v = clamp(v, 0, NS - 1); var i = Math.min(NS - 2, Math.floor(v)); return lerp(YS[i], YS[i + 1], v - i); }
  var lit = [], litT = [];                                    // each year's lamp (1, 2, ... the years, newest first): how lit, and to be
  for (var li0 = 0; li0 <= LV.length; li0++) { lit.push(li0 === 0 ? 1 : 0); litT.push(li0 === 0 ? 1 : 0); }
  var wantPlay = !reduce.matches && query.get('still') !== '1';
  var instant = function () { return reduce.matches; };
  var dirty = true, liveDirty = true;

  // ================================================================================================================
  // The tiles.  The whole painting comes first and is always there; finer tiles come for what is in view, then for
  // where the camera is going, then for the stops on either side.  Each is unpacked before it is shown, sent to the
  // graphics card one to a frame, and faded in over what was there, so nothing pops.  Tiles not wanted are let go,
  // the oldest first, to stay within a budget of memory.
  // ================================================================================================================
  // (one pyramid for each hour of the day: LEV is the one shown; when the hour changes, LEV2 comes in over it, on a
  // canvas of its own that fades in, once its tiles for the view are there)
  function buildLev(pyr, bg) {
    var P = (pyr || []).slice().sort(function (a, b) { return a.scale - b.scale; }).map(function (p) {
      var L = { s: p.scale, tw: p.tw, th: p.th, cols: p.cols, rows: p.rows, src: p.src, tiles: [], dead: false }, cw = p.tw / p.scale, ch = p.th / p.scale;
      L.cw = cw; L.ch = ch;
      for (var r = 0; r < p.rows; r++) for (var c = 0; c < p.cols; c++) {
        L.tiles.push({ L: L, c: c, r: r, x: c * cw, y: r * ch, w: Math.min(cw, LW - c * cw), h: Math.min(ch, LH - r * ch), st: 0, img: null, warm: false, born: 0, used: 0, bytes: 0, pn: -1, pr: 0 });
      }
      return L;
    });
    P.bg = bg || BG;
    return P;
  }
  var LEV = buildLev(moodOf(mood).pyramid, moodOf(mood).bg), LEV2 = null, mood2 = null, swapAsk = 0, swapAt = 0, swapBtn = null, SWAP = 1100;
  var paint2 = el('canvas', 'paint over'), pg2 = paint2.getContext('2d', { alpha: false });
  paint2.hidden = true; paint2.setAttribute('aria-hidden', 'true');
  paint.parentNode.insertBefore(paint2, paint.nextSibling);
  var canFetch = /^https?:$/.test(location.protocol) && !!window.fetch && !!window.createImageBitmap;
  var MAXFLY = 4, inflight = 0, bytes = 0, warmQ = [], planNo = 0, FADE = 340, REVEAL = 900, revealAt = 0;
  var BUDGET = clamp((navigator.deviceMemory || 4) * 45e6, 110e6, 260e6);
  var stats = { blur: 0, blank: 0, frames: 0, loads: 0, evicted: 0, warmMax: 0 };
  // how much of level j shows when a unit of the painting is q device pixels: the coarser level below it is enough
  // until it would be stretched, and the finer one comes in over it as it is stretched by up to a third
  function need(j, q) { return j === 0 ? 1 : sstep(LEV[j - 1].s, LEV[j - 1].s * 1.33, q); }
  function deepest(q, ahead) { var j = 0; for (var i = 1; i < LEV.length; i++) if (q > LEV[i - 1].s * (ahead ? 0.82 : 1)) j = i; return j; }
  function viewOf(c, m) { var w = vw / c.k, h = vh / c.k; return [c.x - w / 2 - w * m, c.y - h / 2 - h * m, w * (1 + 2 * m), h * (1 + 2 * m)]; }
  function eachTile(L, r, fn) {
    var c0 = Math.max(0, Math.floor(r[0] / L.cw)), c1 = Math.min(L.cols - 1, Math.floor((r[0] + r[2] - 1e-6) / L.cw));
    var r0 = Math.max(0, Math.floor(r[1] / L.ch)), r1 = Math.min(L.rows - 1, Math.floor((r[1] + r[3] - 1e-6) / L.ch));
    for (var y = r0; y <= r1; y++) for (var x = c0; x <= c1; x++) fn(L.tiles[y * L.cols + x]);
  }
  function srcOf(t) { return t.L.src.replace('{c}', t.c).replace('{r}', t.r); }
  function load(t) {
    t.st = 1; inflight++; stats.loads++;
    var done = function (img, w, h) {
      inflight--;
      // (a tile of an hour let go meanwhile)
      if (t.L.dead) { if (img && img.close) img.close(); t.st = 0; planned = false; kick(); return; }
      if (!img) t.st = 3;
      else { t.img = img; t.st = 2; t.bytes = w * h * 4; bytes += t.bytes; warmQ.push(t); }
      evict(); planned = false; dirty = true; kick();
      if (!wasMoving && img && t.L !== LEV[0]) thumbsSoon();
    };
    var url = srcOf(t);
    if (canFetch) {
      // (unpacked away from the page's own thread)
      fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then(function (b) { return createImageBitmap(b); })
        .then(function (bm) { done(bm, bm.width, bm.height); }, function () { done(null); });
    } else {
      var im = new Image(); im.decoding = 'async';
      im.onload = function () { (im.decode ? im.decode() : Promise.resolve()).then(function () { done(im, im.naturalWidth, im.naturalHeight); }, function () { done(null); }); };
      im.onerror = function () { done(null); };
      im.src = url;
    }
  }
  function evict() {
    if (bytes <= BUDGET) return;
    var out = [];
    [LEV, LEV2].forEach(function (P) { if (P) P.forEach(function (L, j) { if (j) L.tiles.forEach(function (t) { if (t.st === 2 && t.pn !== planNo) out.push(t); }); }); });
    out.sort(function (a, b) { return a.used - b.used; });
    for (var i = 0; i < out.length && bytes > BUDGET; i++) {
      var t = out[i]; bytes -= t.bytes;
      if (t.img && t.img.close) t.img.close();
      t.img = null; t.st = 0; t.warm = false; t.bytes = 0; stats.evicted++;
      var q = warmQ.indexOf(t); if (q >= 0) warmQ.splice(q, 1);
    }
  }
  var planned = false;
  // what is wanted, most wanted first: [tier, level, distance from the middle of the view]
  function plan(moving) {
    planNo++;
    var list = [];
    var want = function (t, p) { if (t.pn !== planNo) { t.pn = planNo; t.pr = p; if (t.st === 0) list.push(t); } else if (p < t.pr) t.pr = p; };
    var wantView = function (c, tier, m, ahead, P) {
      P = P || LEV;
      var r = viewOf(c, m), top = Math.min(P.length - 1, deepest(c.k * dpr, ahead)), mx = c.x, my = c.y;
      for (var j = 0; j <= top; j++) eachTile(P[j], r, function (t) { want(t, tier * 1e6 + j * 1e4 + Math.hypot(t.x + t.w / 2 - mx, t.y + t.h / 2 - my)); });
    };
    LEV[0].tiles.forEach(function (t) { want(t, 0); });
    // (the hour coming in: its whole painting, and what is in view)
    if (LEV2) { LEV2[0].tiles.forEach(function (t) { want(t, 1); }); wantView(cam, 1, 0.02, false, LEV2); }
    wantView(cam, 1, 0.12, true);
    if (lookId && lookCam) wantView(lookCam, 2, 0, false);
    var dest = goal >= 0 ? goal : moving ? clamp(Math.round(u + (YT > Y ? 0.5 : -0.5)), 0, NS - 1) : stop;
    wantView(cams[dest], 2, 0.05, false);
    if (stop + 1 < NS) wantView(cams[stop + 1], 3, 0, false);
    if (stop - 1 >= 0) wantView(cams[stop - 1], 3, 0, false);
    // the card's small pictures, and then all of the second level, which is small
    thumbs.forEach(function (th) { if (Math.abs(th.stop - stop) <= 1 && th.lvl < thumbLevel(th)) eachTile(LEV[thumbLevel(th)], thumbBox(th), function (t) { want(t, 4e6); }); });
    if (LEV.length > 1 && LEV[1].tiles.length <= 16) LEV[1].tiles.forEach(function (t) { want(t, 5e6 + Math.hypot(t.x - cam.x, t.y - cam.y)); });
    list.sort(function (a, b) { return a.pr - b.pr; });
    for (var i = 0; i < list.length && inflight < MAXFLY; i++) {
      if (bytes > BUDGET * 0.92 && list[i].pr >= 3e6) break;
      load(list[i]);
    }
    planned = true;
  }
  // the painting in the window: the background, then each level over the one under it
  function drawTiles(now) {
    var K = cam.k * dpr, ox = (vw / 2 - cam.x * cam.k) * dpr, oy = (vh / 2 - cam.y * cam.k) * dpr, st = { fading: false, blur: false, blank: false };
    pg.globalAlpha = 1; pg.fillStyle = LEV.bg; pg.fillRect(0, 0, paint.width, paint.height);
    // one new tile a frame is sent to the graphics card, drawn where the next layer will cover it.  It is drawn at
    // three quarters of its size, as it will be drawn: the browser keeps one copy of an image for each size class it is
    // drawn at, and a copy made for a tiny draw is no use later, when eight of them would then go up in one frame
    if (warmQ.length) {
      var t0 = performance.now(), w = warmQ.shift();
      try { pg.drawImage(w.img, 0, 0, 4, 4, 0, 0, 3, 3); } catch (e) { /* a tile let go meanwhile */ }
      w.warm = true; w.born = now; if (!revealAt && w.L === LEV[0]) revealAt = now;
      stats.warmMax = Math.max(stats.warmMax, performance.now() - t0);
      st.fading = true;
    }
    var r = viewOf(cam, 0);
    drawPyr(pg, LEV, now, K, ox, oy, r, st);
    // (the hour coming in, on its own canvas over this one)
    if (LEV2 && swapAt) { var s2 = { fading: false }; drawPyr(pg2, LEV2, now, K, ox, oy, r, s2); st.fading = st.fading || s2.fading; }
    stats.frames++; if (st.blur) stats.blur++; if (st.blank && revealAt) stats.blank++;
    return st.fading;
  }
  // the painting of one hour (its pyramid P) on canvas g: the background, then each level over the one under it
  function drawPyr(g, P, now, K, ox, oy, r, st) {
    if (g !== pg) { g.globalAlpha = 1; g.fillStyle = P.bg; g.fillRect(0, 0, g.canvas.width, g.canvas.height); }
    // (the levels under the finest one wholly wanted are not drawn once all its tiles in view are in and faded up: on
    // a screen of high pixel density, each level drawn over the whole window cost more than the graphics card had in
    // a frame, and the finest one hides them all)
    var j0 = 0;
    for (var jt = P.length - 1; jt > 0; jt--) {
      if (need(jt, K) < 0.999) continue;
      var full = true;
      eachTile(P[jt], r, function (t) { if (full && (!t.warm || now - t.born < FADE)) full = false; });
      if (full) j0 = jt;
      break;
    }
    for (var j = j0; j < P.length; j++) {
      var A = need(j, K); if (A <= 0.002) break;
      eachTile(P[j], r, function (t) {
        if (!t.warm) { if (A > 0.99) st.blur = true; if (j === 0) st.blank = true; return; }
        var f = (now - t.born) / (j === 0 ? REVEAL : FADE);
        if (f < 1) { st.fading = true; f = f <= 0 ? 0 : f * f * (3 - 2 * f); } else f = 1;
        var a = A * f; if (a <= 0.003) return;
        var x0 = Math.round(ox + t.x * K), y0 = Math.round(oy + t.y * K), x1 = Math.round(ox + (t.x + t.w) * K), y1 = Math.round(oy + (t.y + t.h) * K);
        g.globalAlpha = a; g.drawImage(t.img, x0, y0, x1 - x0, y1 - y0); t.used = now;
      });
    }
    // where the painting is smaller than the window (the rim, below the frieze), it goes on past its edges as in a
    // mirror: more water at the foot, more wall at the sides
    var z1t = P[0] && P[0].tiles.length === 1 ? P[0].tiles[0] : null;
    if (z1t && z1t.warm) {
      var X0 = Math.round(ox), Y0 = Math.round(oy), X1 = Math.round(ox + LW * K), Y1 = Math.round(oy + LH * K), PW = g.canvas.width, PH = g.canvas.height;
      var s = (z1t.img.naturalWidth || z1t.img.width) / LW, fa = clamp((now - z1t.born) / REVEAL, 0, 1);
      g.globalAlpha = fa * fa * (3 - 2 * fa);
      if (Y1 < PH) { var bh = Math.min(PH - Y1, Y1 - Y0); g.setTransform(1, 0, 0, -1, 0, 2 * Y1); g.drawImage(z1t.img, 0, (LH - bh / K) * s, LW * s, bh / K * s, X0, Y1 - bh, X1 - X0, bh); }
      if (X0 > 0) { var bl = Math.min(X0, X1 - X0); g.setTransform(-1, 0, 0, 1, 2 * X0, 0); g.drawImage(z1t.img, 0, 0, bl / K * s, LH * s, X0, Y0, bl, Y1 - Y0); }
      if (X1 < PW) { var br = Math.min(PW - X1, X1 - X0); g.setTransform(-1, 0, 0, 1, 2 * X1, 0); g.drawImage(z1t.img, (LW - br / K) * s, 0, br / K * s, LH * s, X1 - br, Y0, br, Y1 - Y0); }
      g.setTransform(1, 0, 0, 1, 0, 0);
    }
    g.globalAlpha = 1;
  }
  // ---- another hour.  Its tiles for the view come first; then its canvas fades in over this one (a fade of the
  // canvas, with nothing drawn again unless the camera moves), and its lamps and glints with it.  Then it is the one
  // shown, and the tiles of the hour before are let go.
  function swapReady(now) {
    if (now - swapAsk > 3500) return true;
    if (!LEV2[0].tiles.every(function (t) { return t.warm || t.st === 3; })) return false;
    if (!litReady(mood2)) return false;
    var K = cam.k * dpr, r = viewOf(cam, 0), ok = true;
    for (var j = 1; j < LEV2.length && ok; j++) { if (need(j, K) <= 0.01) break; eachTile(LEV2[j], r, function (t) { if (!t.warm && t.st !== 3) ok = false; }); }
    return ok;
  }
  function stepSwap(now) {
    if (!LEV2) return false;
    if (!swapAt) {
      if (!swapReady(now)) return true;
      swapAt = now; paint2.style.opacity = '0'; paint2.hidden = false;
      // (its tiles in at once, under the one fade of their canvas, and not each from the background on its own)
      LEV2.forEach(function (L) { L.tiles.forEach(function (t) { if (t.warm) t.born = now - REVEAL; }); });
      litFrom = mood; mood = mood2; showMood();
      if (swapBtn) swapBtn.removeAttribute('aria-busy');
      actsOld = acts; buildActs();
      // (the new hour is not yet seen: its moving drawings and lights start at none)
      actsMix = 0; liveDirty = true;
      dirty = true;
      return true;
    }
    var f = instant() ? 1 : clamp((now - swapAt) / SWAP, 0, 1), e = f * f * (3 - 2 * f);
    paint2.style.opacity = e.toFixed(3); actsMix = e; liveDirty = true;
    if (f < 1) return true;
    // the new hour is the one shown: drawn on the main canvas, and the canvas over it put away
    var old = LEV;
    LEV = LEV2; LEV2 = null; swapAt = 0; actsOld = null; actsMix = 1;
    old.forEach(function (L) {
      L.dead = true;
      L.tiles.forEach(function (t) {
        if (t.img) { if (t.img.close) t.img.close(); bytes -= t.bytes; }
        t.img = null; t.st = 0; t.warm = false; t.bytes = 0;
        var q = warmQ.indexOf(t); if (q >= 0) warmQ.splice(q, 1);
      });
    });
    drawTiles(now);
    paint2.hidden = true; paint2.style.opacity = '0';
    well.style.backgroundColor = LEV.bg;
    // the card's pictures again, from this hour's tiles (and its own cut-outs, if it has them)
    OBJS = moodOf(mood).objs || {};
    thumbs.forEach(function (th) { th.lvl = -1; });
    thumbsSoon();
    planned = false; dirty = true;
    return false;
  }
  var THEME = { day: '#b3301f', dusk: '#9a2b1d', night: '#4c1a1a' }, moodBtns = all('.moods button');
  function showMood() {
    body.dataset.mood = mood;
    moodBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mood === mood)); });
    var th = $('theme'); if (th) th.setAttribute('content', THEME[mood] || THEME.day);
  }
  function switchMood(m, btn) {
    if (LEV2 || m === mood || !hasMood(m)) return;
    mood2 = m; LEV2 = buildLev(moodOf(m).pyramid, moodOf(m).bg); swapAsk = performance.now(); swapAt = 0; swapBtn = btn || null;
    if (swapBtn) swapBtn.setAttribute('aria-busy', 'true');
    planned = false; dirty = true; kick();
  }
  (function () {
    var here = moodBtns.filter(function (b) { return hasMood(b.dataset.mood); });
    moodBtns.forEach(function (b) {
      b.hidden = here.length < 2 || here.indexOf(b) < 0;
      b.addEventListener('click', function () { switchMood(b.dataset.mood, b); });
    });
    showMood();
    well.style.backgroundColor = LEV.bg;
  })();
  // ---- the card's pictures: the thing and a little round it.  From the painter's cut-out of it (the manifest's objs,
  // { id: { src, rect } }) when there is one, laid over the tiles round it; else from the finest tiles, made smaller ----
  var OBJS = moodOf(mood).objs || {};
  function thumbBox(th) {
    if (th.box) return th.box;
    // the thing large in the picture, with a little of what is round it (and never closer than 120 units high)
    var r = OBJ[th.id].r, c = th.canvas, asp = c.width / c.height, pad = Math.min(r[2], r[3]) * 0.22 + 10;
    var b = [r[0] - pad, r[1] - pad, r[2] + 2 * pad, r[3] + 2 * pad];
    if (b[3] < 120) { b[1] -= (120 - b[3]) / 2; b[3] = 120; }
    // (a long thing, such as a string of lanterns, shows its middle larger rather than all of it small)
    if (b[2] / b[3] > asp) { var nh = Math.min(b[2] / asp, b[3] * 1.3), nw = nh * asp; b[0] += (b[2] - nw) / 2; b[1] -= (nh - b[3]) / 2; b[2] = nw; b[3] = nh; }
    else { var nw2 = b[3] * asp; b[0] -= (nw2 - b[2]) / 2; b[2] = nw2; }
    b[0] = clamp(b[0], 0, LW - b[2]); b[1] = clamp(b[1], 0, LH - b[3]);
    th.box = b; return b;
  }
  function thumbLevel() { return LEV.length - 1; }
  // th.lvl: the finest level drawn so far, and 100 more when the cut-out is on it
  function drawThumb(th) {
    var b = thumbBox(th), j, ok, cut = OBJS[th.id];
    // (the cut-out is large, twice the finest tiles' scale: it is decoded and made small off the main thread, at the
    // size it is drawn at here, so that drawing it never holds up a frame)
    if (cut && cut.src && cut.rect && !cut.req) {
      cut.req = true;
      var cw = Math.max(1, Math.round(cut.rect[2] * th.canvas.width / b[2])), ch = Math.max(1, Math.round(cut.rect[3] * th.canvas.width / b[2]));
      var done = function (im) { cut.img = im; cut.ok = true; thumbsSoon(); };
      if (canFetch) fetch(cut.src).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then(function (bl) { return createImageBitmap(bl, { resizeWidth: cw, resizeHeight: ch, resizeQuality: 'high' }); }).then(done, function () { });
      else { var im = new Image(); im.onload = function () { (im.decode ? im.decode() : Promise.resolve()).then(function () { done(im); }, function () { done(im); }); }; im.src = cut.src; }
    }
    var withCut = !!(cut && cut.ok && cut.rect);
    for (j = thumbLevel(); j >= 0; j--) { ok = true; eachTile(LEV[j], b, function (t) { if (!t.img) ok = false; }); if (ok) break; }
    var score = j + (withCut ? 100 : 0);
    if (j < 0 || score <= th.lvl) return false;
    var g = th.canvas.getContext('2d'), K = th.canvas.width / b[2];
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    eachTile(LEV[j], b, function (t) { g.drawImage(t.img, (t.x - b[0]) * K, (t.y - b[1]) * K, t.w * K, t.h * K); });
    if (withCut) { var cr = cut.rect; g.drawImage(cut.img, (cr[0] - b[0]) * K, (cr[1] - b[1]) * K, cr[2] * K, cr[3] * K); }
    th.lvl = score;
    return true;
  }
  var thumbJob = 0;
  function thumbsSoon() {
    if (thumbJob) return;
    var later = window.requestIdleCallback ? function (f) { return requestIdleCallback(f, { timeout: 700 }); } : function (f) { return setTimeout(f, 80); };
    thumbJob = later(function () {
      thumbJob = 0;
      if (wasMoving) { thumbsSoon(); return; }
      // one at a time, this level's first
      var list = thumbs.slice().sort(function (a, b) { return Math.abs(a.stop - stop) - Math.abs(b.stop - stop); });
      for (var i = 0; i < list.length; i++) if (drawThumb(list[i])) { thumbsSoon(); return; }
    });
  }

  // ================================================================================================================
  // The loose drawings
  // ================================================================================================================
  var CEL = M.cels || null, CELS = CEL ? CEL.map || {} : {}, SS = CEL ? CEL.S || 1 : 1, ATLAS = null;
  // name: which drawing.  (ux, uy): where its anchor goes, in sheet units.  V: the canvas, its scale and offset.
  function put(V, name, ux, uy, sc, alpha, flip) {
    if (!ATLAS) return;
    var c = CELS[name]; if (!c) return;
    sc = sc || 1;
    var m = V.K / SS * sc, dw = c[2] * m, dh = c[3] * m, X = V.ox + ux * V.K, Y2 = V.oy + uy * V.K, ax = c[4] * V.K * sc, ay = c[5] * V.K * sc;
    if (X - ax + dw < 0 || X - ax > V.g.canvas.width || Y2 - ay + dh < 0 || Y2 - ay > V.g.canvas.height) return;
    var A = (alpha == null ? 1 : alpha) * (V.a == null ? 1 : V.a);
    if (A <= 0.01) return;
    if (A < 1) V.g.globalAlpha = A;
    if (flip) {
      V.g.save(); V.g.translate(X, Y2); V.g.scale(-1, 1);
      V.g.drawImage(ATLAS, c[0], c[1], c[2], c[3], -ax, -ay, dw, dh);
      V.g.restore();
    } else V.g.drawImage(ATLAS, c[0], c[1], c[2], c[3], X - ax, Y2 - ay, dw, dh);
    V.g.globalAlpha = 1;
  }
  function backAndForth(n) { var q = [], i; for (i = 1; i < n; i++) q.push(i); for (i = n - 2; i >= 1; i--) q.push(i); return q; }

  // Each maker takes the plain data of one actor and gives back { live, draw(V, n, t, adv) }: n the tick, t its time in
  // seconds, adv true when the tick is new.  `still`: nothing is to move, and each actor shows its first frame.
  var ACT = {
    boil: function (a, still) {
      var hold = a.hold || 2, cur = 0, since = 0;
      return { draw: function (V, n, t, adv) {
        if (!still && adv && ++since >= hold) { since = 0; cur = (cur + 1 + ((Math.random() * (a.cels.length - 1)) | 0)) % a.cels.length; }
        put(V, a.cels[cur], a.x, a.y, a.sc, a.alpha);
      } };
    },
    flicker: function (a, still) {
      var hold = a.hold || 2, al = a.alpha || [0.75, 1], val = (al[0] + al[1]) / 2;
      return { draw: function (V, n, t, adv) {
        if (adv && !still) val += (rr(al[0], al[1]) - val) * 0.55;
        put(V, a.cels[Math.floor((still ? 0 : n) / hold) % a.cels.length], a.x, a.y, a.sc, still ? al[1] : val);
      } };
    },
    sway: function (a, still) {
      var seq = a.seq || backAndForth(a.cels.length), hold = a.hold || 2, ev = a.every || [6, 14], st = -1, next = rr(ev[0] * 0.3, ev[1]);
      return { draw: function (V, n, t, adv) {
        var i = 0;
        if (!still) {
          if (adv && st < 0 && t >= next) st = n;
          if (st >= 0) { var f = Math.floor((n - st) / hold); if (f >= seq.length) { st = -1; next = t + rr(ev[0], ev[1]); } else i = seq[f]; }
        }
        put(V, a.cels[i], a.x, a.y, a.sc);
      } };
    },
    // small lights that wander in a box, and come and go
    twinkle: function (a, still) {
      var b = a.box, ev = a.every || [1.5, 5], L = [], n = a.n || 8, i;
      for (i = 0; i < n; i++) L.push({ x: rr(b[0], b[2]), y: rr(b[1], b[3]), vx: rr(-7, 7), vy: rr(-5, 5), a: still ? (i % 2 ? 1 : 0) : 0, on: false, until: rr(0, ev[1]), c: i % a.cels.length });
      return { draw: function (V, nn, t, adv) {
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
          if (p.a > 0.02) put(V, a.cels[p.c], p.x, p.y, a.sc, p.a);
        }
      } };
    },
    // birds cross in a loose wedge, each beating in its own time
    flock: function (a, still) {
      var dx = a.to[0] - a.from[0], dy = a.to[1] - a.from[1], len = Math.hypot(dx, dy), birds, t0;
      var form = function () {
        birds = [];
        for (var i = 0; i < a.n; i++) {
          var rank = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
          birds.push({ back: rank * a.gap * rr(0.85, 1.15), off: side * rank * rr(15, 24) * (a.spread || 1) + rr(-4, 4), sc: rr(a.size[0], a.size[1]), ph: (Math.random() * 6) | 0, v: i % 2 });
        }
      };
      form(); t0 = a.first;
      return { draw: function (V, n, t, adv) {
        if (still || t < t0) return;
        var d = (t - t0) * a.speed, beat = Math.floor(n / 2);
        if (d > len + Math.ceil(a.n / 2) * a.gap * 1.2 + 90) { if (adv) { t0 = t + rr(a.every[0], a.every[1]); form(); } return; }
        birds.forEach(function (b) {
          var f = (d - b.back) / len; if (f < -0.03 || f > 1.08) return;
          var at = beat + b.ph, cyc = a.cycle[at % a.cycle.length], fr = a.frames[cyc];
          put(V, fr[(b.v + Math.floor(at / a.cycle.length)) % fr.length], a.from[0] + dx * f, a.from[1] + dy * f + a.sag * 4 * f * (1 - f) + b.off, b.sc);
        });
      } };
    },
    // birds flying in a fixed shape: they drift together, and each beats its wings out of step with the others
    formation: function (a, still) {
      var w = 2 * Math.PI / (a.period || 16), ph = still ? 0 : rr(0, 6.28), hold = a.hold || 4, amp = a.amp || [20, 8];
      var birds = a.slots.map(function (q, i) { return { dx: q[0], dy: q[1], ph: still ? i : (Math.random() * 4) | 0, wob: rr(0, 6.28) }; });
      return { draw: function (V, n, t) {
        var bx = a.x + (still ? 0 : amp[0] * Math.sin(w * t + ph)), by = a.y + (still ? 0 : amp[1] * Math.sin(w * t * 0.8 + ph + 1));
        birds.forEach(function (b) {
          var f = still ? b.ph % a.cels.length : (Math.floor(n / hold) + b.ph) % a.cels.length;
          put(V, a.cels[f], bx + b.dx + (still ? 0 : 3 * Math.sin(t * 0.9 + b.wob)), by + b.dy + (still ? 0 : 2.5 * Math.sin(t * 1.3 + b.wob)), a.sc);
        });
      } };
    },
    // fireflies: they wander, light, and go dark
    blink: function (a, still) {
      var F = [];
      a.zones.forEach(function (z, zi) {
        for (var i = 0; i < a.n[zi]; i++) { var on = Math.random() < 0.35; F.push({ z: z, x: rr(z[0], z[2]), y: rr(z[1], z[3]), vx: rr(-0.5, 0.5), vy: rr(-0.3, 0.3), on: on ? 3 : -1, len: 14, wait: (rr(0, 50)) | 0 }); }
      });
      return { draw: function (V, n, t, adv) {
        F.forEach(function (f) {
          if (adv && !still) {
            f.x += f.vx + rr(-0.3, 0.3); f.y += f.vy + rr(-0.25, 0.25);
            if (f.x < f.z[0] || f.x > f.z[2]) f.vx = -f.vx;
            if (f.y < f.z[1] || f.y > f.z[3]) f.vy = -f.vy;
            if (f.on < 0) { if (--f.wait <= 0) { f.on = 0; f.len = (rr(8, 22)) | 0; } }
            else if (++f.on >= f.len) { f.on = -1; f.wait = (rr(10, 60)) | 0; }
          }
          if (f.on >= 0) put(V, a.cels[f.on < 2 || f.on >= f.len - 2 ? 1 : 0], f.x, f.y, a.sc);
        });
      } };
    },
    // rings open where something small touched the water, and fade
    rings: function (a, still) {
      var list = [], next = 1.2, hold = a.hold || 2;
      return { draw: function (V, n, t, adv) {
        if (still) { put(V, a.cels[1], a.pts[0][0], a.pts[0][1], (a.sc || 1) * a.pts[0][2]); return; }
        if (adv && t >= next) { var p = a.pts[(Math.random() * a.pts.length) | 0]; list.push({ x: p[0] + rr(-4, 4), y: p[1] + rr(-2, 2), sc: (a.sc || 1) * p[2] * rr(0.85, 1.1), n0: n }); next = t + rr(a.every[0], a.every[1]); }
        for (var i = list.length - 1; i >= 0; i--) {
          var g = list[i], f = Math.floor((n - g.n0) / hold);
          if (f >= a.cels.length) { list.splice(i, 1); continue; }
          put(V, a.cels[f], g.x, g.y, g.sc, f === a.cels.length - 1 ? 0.55 : 1);
        }
      } };
    }
  };
  // The actors of an hour.  The sheet's actors are the day's; at dusk or night those for the lamps and the glints are
  // made again from that hour's own lamps and glints, by the same rules as make-well8k.mjs --cels.
  function moodActs(m) {
    var base = CEL && CEL.acts || [], md = moodOf(m), lamps = md.lamps, glints = md.glints;
    if (m === 'day' || (lamps === M.lamps && glints === M.glints)) return base;
    var key = function (x, y) { return Math.round(x * 10) + ',' + Math.round(y * 10); }, lampAt = {};
    (M.lamps || []).forEach(function (p) { lampAt[key(p[0], p[1] + 1)] = true; });
    var out = base.filter(function (a) {
      if (lamps !== M.lamps && a.type === 'flicker' && lampAt[key(a.x, a.y)]) return false;
      if (glints !== M.glints && a.type === 'twinkle' && a.n === 1 && a.cels && /^spark/.test(a.cels[0])) return false;
      return true;
    });
    var seed = 4242, rng = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    var R1 = function (v) { return Math.round(v * 10) / 10; }, turn = function (a, k) { k %= a.length; return a.slice(k).concat(a.slice(0, k)); };
    var on = function (p) { return p[0] >= 0 && p[0] <= LW && p[1] >= 0 && p[1] <= LH; };
    if (lamps !== M.lamps) (lamps || []).filter(on).forEach(function (p) {
      out.push({ type: 'flicker', z: 1, x: R1(p[0]), y: R1(p[1] + 1), sc: Math.round((0.36 + 0.12 * rng()) * 100) / 100, hold: 2 + ((rng() * 3) | 0), alpha: [0.3, 0.8], cels: turn(['glow0', 'glow1', 'glow2'], (rng() * 3) | 0) });
    });
    if (glints !== M.glints) {
      var cell = {};
      (glints || []).filter(on).forEach(function (g) {
        var k = Math.floor(g[0] / 30) + ',' + Math.floor(g[1] / 30), s = g[2] == null ? 0.5 : g[2];
        if (!cell[k] || s > cell[k][2]) cell[k] = [g[0], g[1], s];
      });
      Object.keys(cell).forEach(function (k) {
        var g = cell[k];
        out.push({ type: 'twinkle', z: 2, box: [R1(g[0]), R1(g[1]), R1(g[0]), R1(g[1])], n: 1, every: [6, 28], sc: Math.round(Math.min(0.95, Math.max(0.32, 0.25 + g[2] * 0.6)) * 100) / 100, cels: turn(['spark0', 'spark1', 'spark2'], (rng() * 3) | 0) });
      });
    }
    return out;
  }
  // (while the hour changes, the old hour's actors fade out as the new one's fade in)
  var acts = [], gated = false, actsOld = null, actsMix = 1;
  function buildActs() {
    var still = !wantPlay, list = moodActs(mood);
    acts = []; gated = false;
    if (list.length) list.map(function (a, i) { return { a: a, i: i }; })
      .sort(function (p, q) { return ((p.a.z || 0) - (q.a.z || 0)) || p.i - q.i; })
      .forEach(function (o) {
        var mk2 = ACT[o.a.type]; if (!mk2) return;
        var x = mk2(o.a, still); x.gate = o.a.gate; if (o.a.gate != null) gated = true;
        acts.push(x);
      });
    liveDirty = true;
  }
  // with no loose drawings for the lamps, each year's lamp is a soft light at its first stop's focus
  function blooms(V) {
    for (var n = 1; n <= LV.length; n++) {
      var a = lit[n]; if (a <= 0.01 || FIRST[n - 1] < 0) continue;
      var f = focusOf(FIRST[n - 1]), x = V.ox + f[0] * V.K, y = V.oy + f[1] * V.K, R = 30 * V.K * (0.94 + (wantPlay ? 0.06 * Math.sin(tick * 0.9 + n * 2) : 0));
      var gr = V.g.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, 'rgba(255,214,130,' + (0.4 * a).toFixed(3) + ')'); gr.addColorStop(0.45, 'rgba(255,176,88,' + (0.15 * a).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,170,80,0)');
      V.g.fillStyle = gr; V.g.fillRect(x - R, y - R, 2 * R, 2 * R);
    }
  }
  // At a stop the rest of the painting goes a little dim, warm and soft at its edge, but for a window round the thing
  // the stop is about (or the thing being looked at), so that the thing stands out.  The dim follows the scroll: it is
  // gone halfway between two stops.  A lit thing (under the pointer, with focus, or with its part of the card under the
  // pointer) gets a little warm light, and no line round it.
  var DIM = 0.18;
  function winRect(i) { var s = STOPS[i]; if (s.obj && HOT[s.obj]) return HOT[s.obj]; var f = s.focus; return [f[0] - 60, f[1] - 34, 120, 68]; }
  // a soft ellipse round rect r (sheet units) on canvas g: from colour a at its middle to colour b at its edge, and b
  // all over the canvas beyond it when fill is true
  function softRound(V, r, grow, a, b, fill) {
    var g = V.g, cx = V.ox + (r[0] + r[2] / 2) * V.K, cy = V.oy + (r[1] + r[3] / 2) * V.K;
    var rx = Math.max(1, (r[2] / 2 + 26) * V.K * grow), ry = Math.max(1, (r[3] / 2 + 26) * V.K * grow);
    g.save(); g.translate(cx, cy); g.scale(rx, ry);
    var gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    a.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    gr.addColorStop(1, b);
    g.fillStyle = gr;
    if (fill) g.fillRect(-cx / rx, -cy / ry, g.canvas.width / rx, g.canvas.height / ry); else g.fillRect(-1, -1, 2, 2);
    g.restore();
  }
  function focusLight(V, dt) {
    var moving = false, n = Math.round(u), d = n > 0 ? DIM * (1 - sstep(0.04, 0.3, Math.abs(u - n))) : 0;
    if (d > 0.003) {
      var r = winRect(n);
      if (lookId && OBJ[lookId] && lookA > 0) {
        var q = OBJ[lookId].r, m = clamp(lookA, 0, 1);
        r = [lerp(r[0], q[0], m), lerp(r[1], q[1], m), lerp(r[2], q[2], m), lerp(r[3], q[3], m)];
      }
      softRound(V, r, 1.55, [[0, 'rgba(46,26,10,0)'], [0.6, 'rgba(46,26,10,0)']], 'rgba(46,26,10,' + d.toFixed(3) + ')', true);
    }
    objList.forEach(function (o) {
      var on = !!litObj[o.id];
      if (on && o.a < 1) { o.a = instant() ? 1 : Math.min(1, o.a + dt / 0.22); moving = true; }
      else if (!on && o.a > 0) { o.a = instant() ? 0 : Math.max(0, o.a - dt / 0.35); moving = true; }
      if (o.a <= 0.01 || LITK[mood]) return;
      softRound(V, o.r, 1.3, [[0, 'rgba(255,236,190,' + (0.3 * o.a).toFixed(3) + ')'], [0.5, 'rgba(255,226,166,' + (0.2 * o.a).toFixed(3) + ')'], [0.8, 'rgba(255,220,150,' + (0.07 * o.a).toFixed(3) + ')']], 'rgba(255,220,150,0)', false);
    });
    return moving;
  }
  /* At dusk and at night a lit thing takes the light on its own colours, as the night painter lights it: the painting
     under it laid again, brighter and warmer, on the thing only.  At night the thing is told from the wall by its colour:
     the painter's lamps have made the thing warm and the wall is indigo, so the warm and the light pixels in its box are
     lit and the blue ones are left as they are.  (A pale light laid over it, as by day, read as a grey haze on the
     night's indigo; an oval or a box of brighter paint read as a lit patch of wall.)  The lit picture of each thing is
     made once for each hour, the first time it is lit, from that hour's finest tiles and in the painting's own units,
     with a half and a quarter size copy for the far views; after that a frame only draws it where the camera puts it,
     so a camera move or a zoom onto the thing costs nothing more.  While the hour changes, the old hour's light goes
     as the new one comes.  It is drawn under the moving drawings, so flames and walkers stay on top. */
  var LITK = { dusk: [1.32, 1.2, 1.04, 0], night: [1.75, 1.5, 1.2, 1] }, litCache = {}, litMood = null, litFrom = null;
  function litOf(o, m) {
    var key = m + ':' + o.id, c = litCache[key];
    if (c) return c.mips ? c : null;
    c = litCache[key] = { mips: null };
    var q = LITK[m], P = moodOf(m).pyramid || [];
    if (!q || !P.length || !o.r) return null;
    var p = P.reduce(function (a, b) { return b.scale > a.scale ? b : a; }), s = p.scale;
    // (the painter's cut-out of the thing, where there is one: its outline is the same at every hour, so it says which
    // pixels are the thing; where there is none, the thing's colours say it)
    var cut = M.objs && M.objs[o.id] && M.objs[o.id].src && M.objs[o.id].rect ? M.objs[o.id] : null;
    // (the thing's box, grown by 2 units, its edge feathered over 4)
    var fe = 4, gw = 2, bx0 = o.r[0] - gw, by0 = o.r[1] - gw, bx1 = o.r[0] + o.r[2] + gw, by1 = o.r[1] + o.r[3] + gw;
    if (cut) { fe = 1; bx0 = Math.min(bx0, cut.rect[0] - gw); by0 = Math.min(by0, cut.rect[1] - gw); bx1 = Math.max(bx1, cut.rect[0] + cut.rect[2] + gw); by1 = Math.max(by1, cut.rect[1] + cut.rect[3] + gw); }
    var X0 = Math.max(0, Math.floor((bx0 - fe) * s)), Y0 = Math.max(0, Math.floor((by0 - fe) * s));
    var X1 = Math.min(p.cols * p.tw, Math.ceil((bx1 + fe) * s)), Y1 = Math.min(p.rows * p.th, Math.ceil((by1 + fe) * s)), w = X1 - X0, h = Y1 - Y0;
    if (w < 2 || h < 2) return null;
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var g = cv.getContext('2d', { willReadFrequently: !cut }), jobs = [], mk = null, mg = null;
    var get = function (url) {
      return canFetch ? fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); }).then(function (b) { return createImageBitmap(b); })
        : new Promise(function (ok, no) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = no; im.src = url; });
    };
    for (var tr = Math.floor(Y0 / p.th); tr <= Math.min(p.rows - 1, Math.floor((Y1 - 1) / p.th)); tr++)
      for (var tc = Math.floor(X0 / p.tw); tc <= Math.min(p.cols - 1, Math.floor((X1 - 1) / p.tw)); tc++) (function (tc, tr) {
        jobs.push(get(p.src.replace('{c}', tc).replace('{r}', tr)).then(function (im) { g.drawImage(im, tc * p.tw - X0, tr * p.th - Y0); if (im.close) im.close(); }));
      })(tc, tr);
    if (cut) {
      mk = document.createElement('canvas'); mk.width = w; mk.height = h; mg = mk.getContext('2d');
      jobs.push(get(cut.src).then(function (im) {
        mg.imageSmoothingQuality = 'high';
        mg.drawImage(im, cut.rect[0] * s - X0, cut.rect[1] * s - Y0, cut.rect[2] * s, cut.rect[3] * s); if (im.close) im.close();
      }));
    }
    Promise.all(jobs).then(function () {
      if (cut) {
        // (with a cut-out, the light is made by drawing, not by reading pixels: the paint times the hour's gain less one
        // is added to the paint, and the cut-out's alpha cuts it out.  A page opened from disk may draw its tiles into a
        // canvas but not read them back, so this way it is lit there too.  The box's feather is 1 there everywhere the
        // cut-out is.)
        var ad = document.createElement('canvas'), ga = ad.getContext('2d');
        ad.width = w; ad.height = h; ga.drawImage(cv, 0, 0);
        ga.globalCompositeOperation = 'multiply';
        ga.fillStyle = 'rgb(' + q.slice(0, 3).map(function (x) { return Math.round(255 * clamp(x - 1, 0, 1)); }).join(',') + ')';
        ga.fillRect(0, 0, w, h);
        g.globalCompositeOperation = 'lighter'; g.drawImage(ad, 0, 0);
        g.globalCompositeOperation = 'destination-in'; g.drawImage(mk, 0, 0);
        g.globalCompositeOperation = 'source-over';
        ad.width = ad.height = 0;
      } else {
        var d = g.getImageData(0, 0, w, h), px = d.data, fx = new Float32Array(w), fy = new Float32Array(h), X, Y;
        for (X = 0; X < w; X++) { var u = (X0 + X + 0.5) / s; fx[X] = clamp((u - bx0) / fe + 0.5, 0, 1) * clamp((bx1 - u) / fe + 0.5, 0, 1); }
        for (Y = 0; Y < h; Y++) { var v = (Y0 + Y + 0.5) / s; fy[Y] = clamp((v - by0) / fe + 0.5, 0, 1) * clamp((by1 - v) / fe + 0.5, 0, 1); }
        for (Y = 0; Y < h; Y++) for (X = 0; X < w; X++) {
          var i = (Y * w + X) * 4, r = px[i], gg = px[i + 1], b = px[i + 2], l = 0.3 * r + 0.59 * gg + 0.11 * b, k, t;
          if (q[3]) {
            t = (r - b + 6) / 40; k = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
            t = (l - 105) / 50; t = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); if (t > k) k = t;
          } else { t = (l - 60) / 80; k = t <= 0 ? 0 : t >= 1 ? 1 : t; }
          px[i] = Math.min(255, r * q[0]); px[i + 1] = Math.min(255, gg * q[1]); px[i + 2] = Math.min(255, b * q[2]);
          px[i + 3] = Math.round(255 * k * fx[X] * fy[Y]);
        }
        g.putImageData(d, 0, 0);
      }
      // (a half and a quarter size copy, so a far view does not shrink it by more than half at a time)
      var mips = [{ cv: cv, s: s }];
      for (var n = 1; n < 3 && mips[n - 1].cv.width > 16; n++) {
        var a = mips[n - 1], c2 = document.createElement('canvas'), g2 = c2.getContext('2d');
        c2.width = Math.max(1, Math.round(a.cv.width / 2)); c2.height = Math.max(1, Math.round(a.cv.height / 2));
        g2.imageSmoothingQuality = 'high'; g2.drawImage(a.cv, 0, 0, c2.width, c2.height);
        mips.push({ cv: c2, s: a.s / 2 });
      }
      c.x = X0 / s; c.y = Y0 / s; c.w = w / s; c.h = h / s; c.mips = mips;
      liveDirty = true; kick();
    }).catch(function () { c.dead = true; /* a tile that could not be had, or (for a thing with no cut-out) a page opened from disk, where the canvas may not be read: no light */ });
    return null;
  }
  // (the hour asked for has the lit pictures of what is lit now, so the change of hour does not stop to make them)
  function litReady(m) {
    return !LITK[m] || objList.every(function (o) { if (o.a <= 0.01) return true; litOf(o, m); var c = litCache[m + ':' + o.id]; return !c || !!c.mips || !!c.dead; });
  }
  function warmLights(V) {
    // (the hours other than the one shown, and the one going, are let go)
    if (!swapAt && litMood !== mood) { for (var k in litCache) if (k.indexOf(mood + ':') !== 0 && !(LEV2 && k.indexOf(mood2 + ':') === 0)) delete litCache[k]; litMood = mood; }
    var hrs = swapAt && litFrom && litFrom !== mood ? [[litFrom, 1 - actsMix], [mood, actsMix]] : [[mood, 1]];
    hrs.forEach(function (hr) {
      if (!LITK[hr[0]] || hr[1] <= 0.003) return;
      objList.forEach(function (o) {
        if (o.a <= 0.01) return;
        var c = litOf(o, hr[0]); if (!c) return;
        var mp = c.mips[0];
        for (var i = 1; i < c.mips.length; i++) if (c.mips[i].s >= V.K) mp = c.mips[i];
        V.g.globalAlpha = o.a * hr[1];
        V.g.drawImage(mp.cv, V.ox + c.x * V.K, V.oy + c.y * V.K, c.w * V.K, c.h * V.K);
      });
    });
    V.g.globalAlpha = 1;
  }
  function runActs(list, V, t, adv, mul) {
    for (var i = 0; i < list.length; i++) {
      var x = list[i], a = mul;
      if (x.gate != null) a *= lit[x.gate] || 0;
      if (a <= 0.01) continue;
      V.a = a; x.draw(V, tick, t, adv);
    }
    V.a = 1;
  }
  var tick = 0;
  function drawLive(adv, dt) {
    var t = tick * TICK, V = { g: lg, K: cam.k * dpr, ox: (vw / 2 - cam.x * cam.k) * dpr, oy: (vh / 2 - cam.y * cam.k) * dpr, a: 1 };
    lg.clearRect(0, 0, live.width, live.height);
    warmLights(V);
    if (ATLAS) { if (actsOld) runActs(actsOld, V, t, adv, 1 - actsMix); runActs(acts, V, t, adv, actsOld ? actsMix : 1); }
    if (!gated || !ATLAS) blooms(V);
    var more = runLayers(V, t, adv, dt);
    return focusLight(V, dt) || more;
  }
  // Moving drawings from files of their own (experience-motion.js: a lit thing at work; experience-people.js: the
  // walkers), each a layer given by WELLPAGE.layer(fn).  fn(V, info) draws on the moving canvas in device pixels (a
  // painting unit x is at V.ox + x * V.K), after the painter's flames and under the stop's dimming, and returns true
  // while it needs every frame; between ticks (info.adv false) it draws the same picture again.  A layer that throws
  // is reported, and the page goes on.
  var layers = [];
  function runLayers(V, t, adv, dt) {
    if (!layers.length) return false;
    var info = { tick: tick, t: t, adv: adv, dt: dt, play: wantPlay, reduce: instant(), mood: mood, from: swapAt ? litFrom : null, mix: swapAt ? actsMix : 1,
      stop: stop, stopId: STOPS[stop].id, u: u, moving: wasMoving, cam: cam, dpr: dpr, LW: LW, LH: LH, lit: litObj, obj: OBJ,
      // (the hover light's gains for each hour, [r, g, b, -]: a lit thing's moving parts take the same light, at obj[id].a)
      litk: LITK };
    var more = false;
    for (var i = 0; i < layers.length; i++) {
      try { if (layers[i](V, info)) more = true; } catch (e) { setTimeout(function () { throw e; }); }
      V.g.globalAlpha = 1; V.g.globalCompositeOperation = 'source-over'; V.g.filter = 'none';
    }
    return more;
  }

  // ================================================================================================================
  // The year gauge.  A carved staff stands on the left in water, as on a dam.  The water line stays put, three fifths
  // of the way down, and the staff slides with the camera, rising as you go down in time, so that the year at the water
  // line is the year you are at.  Plaques on it mark the flood years (June 2023, 2022, 2019).  Press a year to go there.
  // The painter's staff is the manifest's gauge: { src, w, h, years: [{ label, y }], marks: [{ id, y, kind }] }, in its
  // own pixels.  Until it comes, a staff is drawn here to stand in for it.
  // ================================================================================================================
  var gauge = $('gauge'), GA = M.gauge && M.gauge.src ? M.gauge : null;
  var GW = GA ? GA.w : 140, GY = [], GT = [], GMARK = [], GYS = GA && GA.years || [], FACES = GA && GA.faces || [];
  // a level's first year (-1 for the water), and the level a year on the staff belongs to: the first, newest first,
  // whose first year is not after it (so 2024 is in 2023–24, and 2026 in 2025–26)
  function startYear(l) { var m = /(\d{4})/.exec(l.id) || /(\d{4})/.exec(l.years || l.label || ''); return m ? +m[1] : -1; }
  function levelOfLabel(t) {
    var n = parseInt(t, 10);
    for (var k = 0; k < LV.length; k++) { var y0 = startYear(LV[k]); if (isNaN(n) ? y0 < 0 : y0 >= 0 && y0 <= n) return k; }
    return -1;
  }
  // GY: a level's place on the staff, its first year, where its first stop reads.  GT: where it begins as you go down,
  // its newest year, where the reel has turned to it.
  LV.forEach(function (l, k) {
    var y0 = startYear(l), key = y0 >= 0 ? String(y0) : 'before';
    var m = GYS.filter(function (x) { return String(x.label).toLowerCase() === key || x.label === l.label; })[0] || GYS[k];
    GY.push(m ? m.y : 250 + k * 230);
    var top = GY[k];
    GYS.forEach(function (x) { if (levelOfLabel(x.label) === k) top = Math.min(top, x.y); });
    GT.push(top);
  });
  var GH = GA ? GA.h : GY[GY.length - 1] + 420;
  function band(k) { return k + 1 < GY.length ? GY[k + 1] - GY[k] : GY[k] - GY[k - 1]; }
  // from a level's first year down to the next year on the staff
  function yearSpan(k) {
    var n = GYS.map(function (x) { return x.y; }).filter(function (y) { return y > GY[k]; });
    return n.length ? Math.min.apply(null, n) - GY[k] : band(k);
  }
  // the flood marks, under the data's plaque names (the painter's 'joined' is the plaque 'joined-optmyzr')
  function plaqueKey(id) { var r = null; Object.keys(D.plaques || {}).forEach(function (k) { if (!r && k.indexOf(id) === 0) r = k; }); return r; }
  if (GA) (GA.marks || []).forEach(function (m) { var key = plaqueKey(m.id); if (key) GMARK.push({ id: key, src: m.id, y: m.y, kind: m.kind || 'plain' }); });
  else [['joined-optmyzr', 'y2023', 0.66, 'sindoor'], ['nit-trichy', 'y2019', 0.42, 'soft']].forEach(function (m) {
    var k = yearOf(m[1]);
    if (k >= 0 && D.plaques && D.plaques[m[0]]) GMARK.push({ id: m[0], src: m[0], y: GY[k] + band(k) * m[2], kind: m[3] });
  });
  // where the water line reads at each stop (staff pixels): at the stop's own plaque if it has one (or one it shows as
  // well), else a year's first stop at the year's mark and its others further down that year; and the whole well
  // above the first year
  var GS = STOPS.map(function (s, i) {
    if (i === 0) return GY[0] - 0.7 * band(0);
    var k = s.year, ids = [s.obj].concat(s.also).filter(Boolean);
    var pm = GMARK.filter(function (m) {
      return ids.some(function (id) { return m.src === id || m.id.indexOf(id) === 0; }) && m.y >= GT[k] && (k + 1 >= GT.length || m.y < GT[k + 1]);
    })[0];
    if (pm) return pm.y;
    var same = [];
    for (var j = 1; j < NS; j++) if (STOPS[j].year === k) same.push(j);
    var at = same.indexOf(i);
    return at <= 0 ? GY[k] : GY[k] + yearSpan(k) * 0.5 * at / Math.max(1, same.length - 1);
  });
  // the reel turns to a level over the stretch just above where it begins, after the last stop of the level before
  var GW0 = LV.map(function (l, k) {
    if (k + 1 >= GT.length) return 0;
    var last = GY[k];
    for (var i = 1; i < NS; i++) if (STOPS[i].year === k) last = Math.max(last, GS[i]);
    return Math.max(1, Math.min(0.4 * (GT[k + 1] - GY[k]), 0.85 * (GT[k + 1] - last)));
  });

  var staff = gauge.appendChild(el('div', 'g-staff')), staffArt;
  if (GA) { staffArt = staff.appendChild(el('img', 'g-art')); staffArt.alt = ''; staffArt.decoding = 'async'; staffArt.src = GA.src; gauge.classList.add('painted'); }
  else staffArt = staff.appendChild(el('canvas', 'g-art'));
  staffArt.setAttribute('aria-hidden', 'true');
  // the years: on the painter's staff, set in its blank faces; else cut in the stand-in, each above its groove.  Each
  // level's own year is its button; the faces of the years between go to their level too (once, for the pointer).
  var gYears = [], gFaces = [];
  function yearButton(k, text, own) {
    var b = staff.appendChild(el('button', 'g-year')); b.type = 'button';
    if (own) b.appendChild(el('span', 'g-yl', LV[k].label));
    else { b.setAttribute('aria-hidden', 'true'); b.tabIndex = -1; }
    if (text) { var n = b.appendChild(el('span', 'g-yn', text)); n.setAttribute('aria-hidden', 'true'); b._n = n; }
    if (k < 0 || FIRST[k] < 0) b.disabled = true;
    b.addEventListener('click', function () { if (k >= 0 && FIRST[k] > 0) go(FIRST[k]); });
    return b;
  }
  FACES.forEach(function (f) {
    var k = levelOfLabel(f.label), y0 = k >= 0 ? startYear(LV[k]) : -2;
    var own = k >= 0 && !gYears[k] && (y0 >= 0 ? String(y0) === String(f.label) : true);
    var b = yearButton(k, f.label, own); b.classList.add('g-face');
    gFaces.push(b); if (own) gYears[k] = b;
  });
  LV.forEach(function (l, k) { if (!gYears[k]) gYears[k] = yearButton(k, '', true); });
  var gMarks = GMARK.map(function (m) {
    var pq = D.plaques[m.id], p = staff.appendChild(el('div', 'g-mark ' + m.kind));
    p.setAttribute('aria-hidden', 'true');                   // (the card says the same)
    p.appendChild(el('span', 'g-m1', pq[0])); p.appendChild(el('span', 'g-m2', pq[1]));
    return p;
  });
  var water = gauge.appendChild(el('div', 'g-water'));
  water.setAttribute('aria-hidden', 'true');
  var wTex = water.appendChild(el('canvas', 'g-wtex')), wRip = [water.appendChild(el('canvas', 'g-rip')), water.appendChild(el('canvas', 'g-rip b'))];
  water.appendChild(el('div', 'g-line'));
  // The reading: a painted float rides on the water line, round the staff, with the year on it in large type.  The year
  // is on a reel, as on an odometer: as the next year's groove comes down to the water the reel turns with the scroll and
  // settles on the new year with a little give, as a slot machine's reel does.  (The card and the line read aloud say the
  // year too, so the float is hidden from screen readers.)  The painter's blank plate is the manifest's float:
  // { src, w, h, face: [x, y, w, h] }, in its own pixels (drawn at 2x); the reel is set in its face.  Until it comes, a
  // plate is drawn here to stand in for it.
  var FL = M.float && M.float.src && M.float.face ? M.float : null, gFart = null, gFwet = null, fwetAt = null;
  var gFloat = gauge.appendChild(el('div', 'g-float'));
  if (FL) {
    gFart = gFloat.appendChild(el('img', 'g-fart')); gFart.alt = ''; gFart.decoding = 'async'; gFart.src = FL.src;
    // (its foot in the water: a wash cut to the plate's own shape.  It is drawn through the plate's alpha on a canvas, as
    // a CSS mask of the plate is not shown on a page opened from disk)
    gFwet = gFloat.appendChild(el('canvas', 'g-fwet'));
    gFart.addEventListener('load', function () { if (fwetAt) drawFwet.apply(null, fwetAt); });
    gFloat.classList.add('painted');
  }
  var gFcan = gFloat.appendChild(el('canvas', 'g-fcan'));
  var gOdo = gFloat.appendChild(el('div', 'g-odo')), gReel = gOdo.appendChild(el('div', 'g-reel'));
  gFloat.setAttribute('aria-hidden', 'true');
  [' '].concat(LV.map(function (l) { return l.label; })).forEach(function (t) { gReel.appendChild(el('span', 'g-row', t)); });
  // the post's two sides, in staff pixels (the painter's staff may say where its post is; else it is round its faces,
  // or most of the width)
  var PX0 = 6, PX1 = 134;
  if (GA && GA.post) { PX0 = GA.post[0]; PX1 = GA.post[1]; }
  else if (FACES.length) { PX0 = Math.max(0, FACES[0].x - 17); PX1 = Math.min(GW, FACES[0].x + FACES[0].w + 43); }
  else if (GA) { PX0 = GW * 0.08; PX1 = GW * 0.92; }

  var gw = 0, gsc = 1, gWl = 0, gaugeBox = 0, gY = null, gOp = -1, gNow = -2, rowH = 0, gR = null;
  // (the float's top and foot on the window, how far it reaches past the staff, and each plaque's half height)
  var gFt = 0, gFb = 0, gPo = 0, gMh = [];
  function rnd32(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  // a line drawn by hand: through the points, each moved a little
  function handLine(g, R, pts, j) {
    g.beginPath();
    pts.forEach(function (p, i) { var x = p[0] + (R() - 0.5) * j, y = p[1] + (R() - 0.5) * j; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
  }
  // the stand-in: a sandstone post with a little dome on it, cut with a groove at each year (sindoor in the groove) and
  // finer marks between, in dry pastel, with a kajal line round it
  function drawStaff() {
    var W = gw, H = Math.round(GH * gsc), c = staffArt;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); c.style.width = W + 'px'; c.style.height = H + 'px';
    var g = c.getContext('2d'), R = rnd32(4111), S = gsc * dpr, x0 = PX0, x1 = PX1, top = 74, i, y;
    g.setTransform(S, 0, 0, S, 0, 0);
    g.lineCap = 'round'; g.lineJoin = 'round';
    // the post, lit from the left
    var side = [], k2;
    for (y = top; y <= GH + 20; y += 24) side.push([x1, y]);
    var outline = [[x0, GH + 20]].concat(side.map(function (p) { return [x0, p[1]]; }).reverse()).concat(side);
    var body = g.createLinearGradient(x0, 0, x1, 0);
    body.addColorStop(0, '#ecd09b'); body.addColorStop(0.22, '#e0bb82'); body.addColorStop(0.78, '#cfa268'); body.addColorStop(1, '#ab7d48');
    g.fillStyle = body; handLine(g, R, outline, 1.4); g.closePath(); g.fill();
    g.save(); handLine(g, R, outline, 0); g.closePath(); g.clip();
    // the stone is not one colour: soft patches of rose and of deeper ochre, rubbed in
    for (i = 0; i < GH / 10; i++) {
      var px = x0 + R() * (x1 - x0), py = top + R() * (GH - top), pr = 8 + R() * 26;
      var pc = g.createRadialGradient(px, py, 0, px, py, pr);
      var tone = R() < 0.5 ? '196,112,82' : R() < 0.6 ? '150,96,44' : '250,226,180';
      pc.addColorStop(0, 'rgba(' + tone + ',' + (0.1 + 0.14 * R()).toFixed(3) + ')'); pc.addColorStop(1, 'rgba(' + tone + ',0)');
      g.fillStyle = pc; g.fillRect(px - pr, py - pr, 2 * pr, 2 * pr);
    }
    // the grain of the stone, in short strokes of pastel
    for (i = 0; i < GH * 3.4; i++) {
      var gx = x0 + 2 + R() * (x1 - x0 - 4), gy = top + R() * (GH - top);
      g.strokeStyle = R() < 0.5 ? 'rgba(255,242,210,' + (0.14 + 0.2 * R()).toFixed(3) + ')' : 'rgba(110,64,26,' + (0.08 + 0.16 * R()).toFixed(3) + ')';
      g.lineWidth = 0.6 + R() * 1.3;
      g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + (R() - 0.5) * 2.4, gy + 3 + R() * 10); g.stroke();
    }
    // the face is cut back a little between two raised edges: a shaded line on its left, a lit one on its right
    var fl = x0 + 9, fr = x1 - 11;
    g.fillStyle = 'rgba(120,70,30,.08)'; g.fillRect(fl, top + 4, fr - fl, GH - top);
    g.strokeStyle = 'rgba(92,52,20,.38)'; g.lineWidth = 1.6; handLine(g, R, [[fl, top + 4], [fl, (top + GH) / 2], [fl, GH + 10]], 0.8); g.stroke();
    g.strokeStyle = 'rgba(255,240,212,.5)'; g.lineWidth = 1.2; handLine(g, R, [[fl + 1.6, top + 4], [fl + 1.6, GH + 10]], 0.6); g.stroke();
    g.strokeStyle = 'rgba(255,240,212,.45)'; g.lineWidth = 1.4; handLine(g, R, [[fr, top + 4], [fr, (top + GH) / 2], [fr, GH + 10]], 0.8); g.stroke();
    g.strokeStyle = 'rgba(92,52,20,.3)'; g.lineWidth = 1; handLine(g, R, [[fr - 1.6, top + 4], [fr - 1.6, GH + 10]], 0.6); g.stroke();
    g.restore();
    // a light edge and a shaded one
    g.fillStyle = 'rgba(255,246,222,.32)'; g.fillRect(x0 + 1, top, 4, GH - top);
    g.fillStyle = 'rgba(70,36,12,.24)'; g.fillRect(x1 - 7, top, 7, GH - top);
    // the marks: a fine one each tenth of a year, a longer one at each half, a groove at each year
    var step = band(0) / 10, y0 = GY[0] - Math.floor((GY[0] - top - 12) / step) * step;
    for (y = y0, k2 = 0; y < GH; y += step, k2++) {
      var n = Math.round((y - GY[0]) / step), isYear = false;
      for (i = 0; i < GY.length; i++) if (Math.abs(GY[i] - y) < step / 2) isYear = true;
      if (isYear) continue;
      var len = ((n % 10) + 10) % 10 === 5 ? 24 : 12;
      g.strokeStyle = 'rgba(27,22,19,' + (len > 12 ? 0.62 : 0.46) + ')'; g.lineWidth = len > 12 ? 1.6 : 1.1;
      handLine(g, R, [[x0 + 10, y], [x0 + 9 + len, y + (R() - 0.5)]], 0.7); g.stroke();
    }
    GY.forEach(function (gy2) {
      var pts = [[x0 - 2, gy2], [x0 + 32, gy2 + 0.6], [x0 + 64, gy2 - 0.4], [x0 + 96, gy2 + 0.4], [x1 + 2, gy2 + 0.3]];
      g.strokeStyle = 'rgba(60,24,8,.55)'; g.lineWidth = 4.2; handLine(g, R, pts, 0.8); g.stroke();
      g.strokeStyle = 'rgba(255,238,206,.55)'; g.lineWidth = 1.4; handLine(g, R, pts.map(function (p) { return [p[0], p[1] + 2.6]; }), 0.6); g.stroke();
      g.strokeStyle = 'rgba(163,38,26,.9)'; g.lineWidth = 2.2; handLine(g, R, pts, 0.5); g.stroke();
    });
    // the kajal line round the post
    g.strokeStyle = 'rgba(27,22,19,.62)'; g.lineWidth = 1.5;
    handLine(g, R, outline, 1.2); g.stroke();
    // the cap: a ledge, a little dome and a finial
    var cx = (x0 + x1) / 2;
    g.fillStyle = '#d8b37a'; handLine(g, R, [[x0 - 5, top], [x1 + 5, top], [x1 + 5, top - 11], [x0 - 5, top - 11]], 1); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(27,22,19,.62)'; g.stroke();
    g.beginPath(); g.ellipse(cx, top - 11, 46, 40, 0, Math.PI, 2 * Math.PI); g.closePath();
    var dome = g.createLinearGradient(cx - 46, 0, cx + 46, 0); dome.addColorStop(0, '#f7ecd2'); dome.addColorStop(1, '#d9c39a');
    g.fillStyle = dome; g.fill(); g.strokeStyle = 'rgba(27,22,19,.62)'; g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = 'rgba(163,38,26,.7)'; g.lineWidth = 1.2;
    for (i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(cx + i * 13, top - 12); g.quadraticCurveTo(cx + i * 7.5, top - 34, cx + i * 2, top - 50); g.stroke(); }
    g.fillStyle = '#c9982e'; g.beginPath(); g.ellipse(cx, top - 57, 4.5, 7, 0, 0, 2 * Math.PI); g.fill();
    g.strokeStyle = 'rgba(27,22,19,.62)'; g.lineWidth = 1.2; g.stroke();
  }
  // the water: a wash of green-blue, deeper below, in grains of chalk, going soft at its right edge; two sheets of small
  // ripples by the surface take turns to show
  function drawWater(bot) {
    var W = Math.round(gw + (sheet ? 12 : 40)), H = Math.max(12, Math.round((sheet ? bot : vh) - gWl)), q = dpr;
    water.style.width = W + 'px'; water.style.height = H + 'px';
    var c = wTex, g = c.getContext('2d'), R = rnd32(911), i;
    c.width = Math.round(W * q); c.height = Math.round(H * q); c.style.width = W + 'px'; c.style.height = H + 'px';
    g.setTransform(q, 0, 0, q, 0, 0);
    var gr = g.createLinearGradient(0, 0, 0, Math.min(H, 420));
    gr.addColorStop(0, 'rgba(78,134,136,.46)'); gr.addColorStop(1, 'rgba(26,64,80,.74)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (i = 0; i < W * H / 26; i++) {
      var x = R() * W, y = R() * H;
      g.fillStyle = R() < 0.5 ? 'rgba(220,240,234,' + (0.05 + 0.1 * R()).toFixed(3) + ')' : 'rgba(10,34,44,' + (0.06 + 0.1 * R()).toFixed(3) + ')';
      g.fillRect(x, y, 0.8 + R() * 2.4, 0.6 + R() * 0.9);
    }
    for (i = 0; i < H / 9; i++) {
      var ly = 10 + R() * (H - 10), lx = R() * W * 0.8;
      g.strokeStyle = 'rgba(214,236,230,' + (0.08 + 0.12 * R()).toFixed(3) + ')'; g.lineWidth = 0.8 + R();
      g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 8 + R() * 22, ly + (R() - 0.5)); g.stroke();
    }
    var soft = function (g2, w2, h2) {
      g2.globalCompositeOperation = 'destination-out';
      var fo = g2.createLinearGradient(w2 * 0.6, 0, w2, 0); fo.addColorStop(0, 'rgba(0,0,0,0)'); fo.addColorStop(1, 'rgba(0,0,0,1)');
      g2.fillStyle = fo; g2.fillRect(0, 0, w2, h2);
      g2.globalCompositeOperation = 'source-over';
    };
    soft(g, W, H);
    wRip.forEach(function (rc, n) {
      var rh = 34, g3 = rc.getContext('2d'), R3 = rnd32(77 + n * 31);
      rc.width = Math.round(W * q); rc.height = Math.round(rh * q); rc.style.width = W + 'px'; rc.style.height = rh + 'px';
      g3.setTransform(q, 0, 0, q, 0, 0); g3.lineCap = 'round';
      for (var r = 0; r < 4; r++) {
        var yy = 5 + r * 7.5 + R3() * 2, x2 = -10 + R3() * 14;
        while (x2 < W) {
          var len2 = 6 + R3() * (16 - r * 2);
          g3.strokeStyle = 'rgba(236,248,242,' + ((0.55 - r * 0.1) * (0.6 + 0.4 * R3())).toFixed(3) + ')'; g3.lineWidth = 1.3 - r * 0.15;
          g3.beginPath(); g3.moveTo(x2, yy); g3.quadraticCurveTo(x2 + len2 / 2, yy - 1.4, x2 + len2, yy); g3.stroke();
          x2 += len2 + 5 + R3() * 14;
        }
      }
      soft(g3, W, rh);
    });
  }
  // the points round a rounded oblong, w by h, with corners of radius r, for handLine
  function oblong(w, h, r) {
    var p = [], k, n;
    function arc(cx, cy, a0) { for (k = 0; k <= 4; k++) { var a = a0 + k * Math.PI / 8; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } }
    function edge(xa, ya, xb, yb) { n = Math.max(1, Math.round(Math.hypot(xb - xa, yb - ya) / 16)); for (k = 1; k < n; k++) p.push([xa + (xb - xa) * k / n, ya + (yb - ya) * k / n]); }
    arc(w - r, r, -Math.PI / 2); edge(w, r, w, h - r); arc(w - r, h - r, 0); edge(w - r, h, r, h);
    arc(r, h - r, Math.PI / 2); edge(0, h - r, 0, r); arc(r, r, Math.PI); edge(r, 0, w - r, 0);
    return p;
  }
  // the stand-in float: a plate painted flat in ochre, rubbed unevenly in dry pastel, with a thin sindoor line inside
  // its edge and a dark edge by hand; its foot is in the water, greener and dimmer there.  Over the painter's plate
  // (manifest float) only the water line and the ripples are drawn here.
  function drawFloat(TW, TH, sub, plate) {
    var m = 12, W = TW + 2 * m, H = TH + 8, q = dpr, c = gFcan, g = c.getContext('2d'), R = rnd32(5309), i, wl = TH - sub;
    c.width = Math.round(W * q); c.height = Math.round(H * q); c.style.width = W + 'px'; c.style.height = H + 'px'; c.style.left = -m + 'px';
    g.setTransform(q, 0, 0, q, m * q, 0); g.lineCap = 'round'; g.lineJoin = 'round';
    if (plate) {
      var r = Math.min(5, TH * 0.12), P = oblong(TW - 2, TH - 2, r).map(function (p) { return [p[0] + 1, p[1] + 1]; });
      g.fillStyle = '#d3a24e'; handLine(g, R, P, 1.1); g.closePath(); g.fill();
      g.save(); handLine(g, R, P, 0); g.closePath(); g.clip();
      for (i = 0; i < TW * TH / 380; i++) {
        var px = R() * TW, py = R() * TH, pr = 6 + R() * 14, tn = R(), tone = tn < 0.4 ? '168,108,36' : tn < 0.75 ? '236,196,104' : '200,122,84';
        var pc = g.createRadialGradient(px, py, 0, px, py, pr);
        pc.addColorStop(0, 'rgba(' + tone + ',' + (0.12 + 0.14 * R()).toFixed(3) + ')'); pc.addColorStop(1, 'rgba(' + tone + ',0)');
        g.fillStyle = pc; g.fillRect(px - pr, py - pr, 2 * pr, 2 * pr);
      }
      for (i = 0; i < TW * TH / 18; i++) {
        var gx = R() * TW, gy = R() * TH, a = -1.05 + (R() - 0.5) * 0.5, len = 2.5 + R() * 6;
        g.strokeStyle = R() < 0.5 ? 'rgba(250,234,192,' + (0.08 + 0.18 * R()).toFixed(3) + ')' : 'rgba(112,66,22,' + (0.06 + 0.14 * R()).toFixed(3) + ')';
        g.lineWidth = 0.5 + R() * 1.1;
        g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + Math.cos(a) * len, gy + Math.sin(a) * len); g.stroke();
      }
      var I = oblong(TW - 10, TH - 10, Math.max(1.5, r - 3)).map(function (p) { return [p[0] + 5, p[1] + 5]; });
      g.strokeStyle = 'rgba(158,42,22,.6)'; g.lineWidth = 1.1; handLine(g, R, I, 0.9); g.closePath(); g.stroke();
      var wg = g.createLinearGradient(0, wl, 0, TH);
      wg.addColorStop(0, 'rgba(66,124,128,.5)'); wg.addColorStop(1, 'rgba(28,68,84,.68)');
      g.fillStyle = wg; g.fillRect(0, wl, TW, TH - wl);
      for (i = 0; i < TW * (TH - wl) / 18; i++) {
        g.fillStyle = R() < 0.5 ? 'rgba(220,240,234,' + (0.06 + 0.12 * R()).toFixed(3) + ')' : 'rgba(10,34,44,' + (0.06 + 0.1 * R()).toFixed(3) + ')';
        g.fillRect(R() * TW, wl + R() * (TH - wl), 0.8 + R() * 2.4, 0.6 + R() * 0.8);
      }
      g.restore();
      g.strokeStyle = 'rgba(42,22,10,.82)'; g.lineWidth = 1.7; handLine(g, R, P, 1); g.closePath(); g.stroke();
      g.strokeStyle = 'rgba(42,22,10,.3)'; g.lineWidth = 1; handLine(g, R, P, 1.6); g.closePath(); g.stroke();
    }
    // the water line across it, and ripples either side
    g.strokeStyle = 'rgba(240,250,246,.85)'; g.lineWidth = 1.5;
    handLine(g, R, [[1, wl], [TW * 0.3, wl + 0.5], [TW * 0.7, wl - 0.4], [TW - 1, wl]], 0.5); g.stroke();
    g.strokeStyle = 'rgba(236,248,242,.7)'; g.lineWidth = 1.1;
    [-1, 1].forEach(function (sd) {
      for (var j = 0; j < 2; j++) {
        var x0 = sd < 0 ? -2 - j * 3 : TW + 2 + j * 3, y0 = wl + 2.5 + j * 3.2, len = 6 - j;
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + sd * len / 2, y0 - 1.6, x0 + sd * len, y0); g.stroke();
      }
    });
  }
  // the float's place and size: round the post on a wide window, beside the strip (and round it) on a phone.  The
  // painter's plate is scaled so that its face holds the reel; the water comes up to just under the face.
  // the height of the ink of the reel's years, and how far its middle is below the middle of their line
  function inkOf(row, rows) {
    var cs = getComputedStyle(row), g = document.createElement('canvas').getContext('2d'), a = 0, d = 0, fa = 0, fd = 0;
    g.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    [].forEach.call(rows, function (r) {
      var m = g.measureText(r.textContent.trim());
      if (!r.textContent.trim()) return;
      a = Math.max(a, m.actualBoundingBoxAscent || 0); d = Math.max(d, m.actualBoundingBoxDescent || 0);
      fa = m.fontBoundingBoxAscent || fa; fd = m.fontBoundingBoxDescent || fd;
    });
    if (!a) return { h: (parseFloat(cs.fontSize) || 30) * 0.7, mid: 0 };
    return { h: a + d, mid: fa ? (fa - fd + d - a) / 2 : 0 };
  }
  // the wash on the plate's foot, under the water line: the plate's lower part, in a wash of the water's colours
  function drawFwet(TW, TH, sub) {
    fwetAt = [TW, TH, sub];
    if (!gFart.complete || !gFart.naturalWidth || sub < 1) return;
    var q = dpr, w = Math.max(1, Math.round(TW * q)), h = Math.max(1, Math.round(sub * q)), g;
    gFwet.width = w; gFwet.height = h; g = gFwet.getContext('2d');
    g.imageSmoothingQuality = 'high'; g.drawImage(gFart, 0, -(TH - sub) * q, TW * q, TH * q);
    var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(66, 124, 128, .5)'); gr.addColorStop(1, 'rgba(28, 68, 84, .68)');
    g.globalCompositeOperation = 'source-in'; g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  function layoutFloat(x) {
    var rows = gReel.children, fs = parseFloat(getComputedStyle(gReel.firstChild).fontSize) || 30;
    rowH = rows[1].getBoundingClientRect().height || fs * 1.12;
    var ow = Math.ceil(gReel.getBoundingClientRect().width), pl = x + PX0 * gsc, pr = x + PX1 * gsc, TW, TH, sub, L, fx = 0;
    // the window the reel shows through (in the float), and where the reel is in it
    var oL, oT, oW = ow, oH = rowH, rx = 0, ry = 0;
    if (FL) {
      // the window is the plate's face; the face holds the ink of the type (not its line, which is taller), with the
      // ink in its middle
      var ink = inkOf(gReel.firstChild, rows), fc = FL.face;
      var s = Math.max((ow + fs * 0.5) / fc[2], (ink.h + fs * 0.24) / fc[3]);
      TW = Math.round(FL.w * s); TH = Math.round(FL.h * s); fx = fc[0] * s;
      oL = Math.round(fx); oT = Math.round(fc[1] * s); oW = Math.round(fc[2] * s); oH = Math.round(fc[3] * s);
      rx = Math.round((oW - ow) / 2); ry = oH / 2 - rowH / 2 - ink.mid;
      sub = Math.max(0, TH - Math.round((fc[1] + fc[3]) * s + 2));
      gFart.style.width = TW + 'px'; gFart.style.height = TH + 'px';
      gFwet.style.top = (TH - sub) + 'px'; gFwet.style.width = TW + 'px'; gFwet.style.height = sub + 'px';
      drawFwet(TW, TH, sub);
      L = sheet ? Math.round(pr + 5 - fx) : Math.max(3, Math.round((pl + pr) / 2 - TW / 2));
    } else {
      var padX = Math.round(fs * 0.42);
      oT = Math.round(fs * 0.14); sub = Math.round(fs * 0.4); TH = Math.round(oT + rowH + sub);
      if (sheet) { L = x - 3; oL = Math.round(pr - L + 7); TW = oL + ow + padX; }
      else { TW = Math.max(Math.round(pr - pl + 14), ow + 2 * padX); L = Math.max(3, Math.round((pl + pr) / 2 - TW / 2)); oL = Math.round((TW - ow) / 2); }
    }
    gFloat.style.left = L + 'px'; gFloat.style.top = Math.round(gWl - (TH - sub)) + 'px'; gFloat.style.width = TW + 'px'; gFloat.style.height = TH + 'px';
    gOdo.style.left = oL + 'px'; gOdo.style.top = oT + 'px'; gOdo.style.width = oW + 'px'; gOdo.style.height = oH.toFixed(2) + 'px';
    gReel.style.marginLeft = rx + 'px'; gReel.style.marginTop = ry.toFixed(2) + 'px';
    drawFloat(TW, TH, sub, !FL);
    // (the plaques hang clear of the float, so the one at the water line is not under it)
    if (!sheet) gaugeBox = Math.max(gaugeBox, L + TW);
    gPo = sheet ? 0 : Math.max(0, L + TW - x - gw + 2); gFt = gWl - (TH - sub); gFb = gWl + sub;
    gauge.style.setProperty('--po', gPo + 'px');
    gR = null;
  }
  function layoutGauge() {
    gw = sheet ? 28 : clamp(Math.round(vw * 0.1), 140, 156);
    gsc = gw / GW;
    var x = sheet ? 4 : 12, top = hh, bot = sheet ? vh - peek : vh;
    // (on a phone the float is beside the things, not by a gauge of their own, so the water is lower, under them)
    gWl = Math.round(top + (sheet ? 0.84 : 0.6) * (bot - top));
    gaugeBox = x + gw;
    gauge.style.setProperty('--gx', x + 'px'); gauge.style.setProperty('--gw', gw + 'px'); gauge.style.setProperty('--wl', gWl + 'px');
    gauge.style.setProperty('--gs', gsc.toFixed(4));
    staff.style.width = gw + 'px'; staff.style.height = Math.round(GH * gsc) + 'px';
    if (GA) { staffArt.style.width = gw + 'px'; staffArt.style.height = Math.round(GH * gsc) + 'px'; }
    gYears.forEach(function (b, k) { if (!b.classList.contains('g-face')) b.style.top = (GY[k] * gsc).toFixed(1) + 'px'; });
    gFaces.forEach(function (b, j) {
      var f = FACES[j];
      b.style.left = (f.x * gsc).toFixed(1) + 'px'; b.style.top = (f.y * gsc).toFixed(1) + 'px';
      b.style.width = (f.w * gsc).toFixed(1) + 'px'; b.style.height = (f.h * gsc).toFixed(1) + 'px';
    });
    gMarks.forEach(function (p, j) { p.style.top = (GMARK[j].y * gsc).toFixed(1) + 'px'; p._o = null; });
    if (!GA) drawStaff();
    drawWater(bot);
    layoutFloat(x);
    gMh = gMarks.map(function (p) { return p.offsetHeight / 2; });
    gY = null; gNow = -2;
  }
  // the reel's turn, t from 0 to 1: it starts gently, runs a little past the year and comes back to rest on it
  function roll(t) { return instant() ? (t < 0.5 ? 0 : 1) : t * t * (3 - 2 * t) + 9 * t * t * t * (1 - t) * (1 - t); }
  function readingAt(v) { var i = clamp(Math.floor(v), 0, NS - 2), f = clamp(v - i, 0, 1); return lerp(GS[i], GS[i + 1], f); }
  // each frame: the staff where the scroll has it, the gauge coming in as you leave the rim, and the year at the line
  function stepGauge() {
    var s = readingAt(u), y = Math.round((gWl - s * gsc) * dpr) / dpr;
    if (y !== gY) { gY = y; staff.style.transform = 'translate3d(0,' + y + 'px,0)'; }
    // a year whose face is partly under the float is not read (only the float says the year there)
    gFaces.forEach(function (b, j) {
      var f = FACES[j], t = y + (f.y + f.h * 0.22) * gsc, d = Math.max(gFt - (y + (f.y + f.h * 0.78) * gsc), t - gFb, 0);
      var o = Math.round(sstep(0, 8, d) * 100) / 100;
      if (o !== b._o && b._n) { b._o = o; b._n.style.opacity = o >= 1 ? '' : String(o); }
    });
    // a plaque hangs by the staff, by its mark; near the water line it moves out, clear of the float, and back
    gMarks.forEach(function (p, j) {
      var my = y + GMARK[j].y * gsc, d = Math.max(gFt - (my + gMh[j]), my - gMh[j] - gFb, 0);
      var o = Math.round(gPo * (1 - sstep(4, 34, d)));
      if (o !== p._o) { p._o = o; p.style.transform = o ? 'translate3d(' + o + 'px,0,0)' : ''; }
    });
    var op = Math.round(sstep(0.06, 0.6, u) * 100) / 100;
    if (op !== gOp) { gOp = op; gauge.style.opacity = op >= 1 ? '' : String(op); gauge.classList.toggle('off', op <= 0); }
    // the reel turns as the next level's newest year comes down to the water, and is on that level when its year is at
    // the line (and from the rim, from blank to the first year as the first year comes down)
    var kk = 0, R, j;
    for (j = 1; j < GT.length; j++) if (s >= GT[j]) kk = j;
    if (s < GY[0]) R = -1 + roll(clamp((s - GS[0]) / Math.max(1, GY[0] - GS[0]), 0, 1));
    else if (kk >= GT.length - 1) R = kk;
    else R = kk + roll(clamp((s - GT[kk + 1] + GW0[kk]) / GW0[kk], 0, 1));
    R = Math.round(R * 1000) / 1000;
    if (R !== gR) { gR = R; gReel.style.transform = 'translate3d(0,' + (-(R + 1) * rowH).toFixed(2) + 'px,0)'; }
    // the level's own year shows sindoor once the reel is on it
    var k = Math.floor(R + 0.5);
    if (k !== gNow) {
      gNow = k;
      gYears.forEach(function (b, j2) { b.classList.toggle('now', j2 === k); });
    }
  }

  // ================================================================================================================
  // Laying it out
  // ================================================================================================================
  // the shut sheet shows the years and the stop's heading; it is as tall as the tallest heading, so that it (and so
  // the camera's views) need not change from stop to stop
  function measurePeek() {
    if (!sheet) return 0;
    var f = parseFloat(getComputedStyle(card).borderTopWidth) || 0, most = 0, m = cardBody.appendChild(el('div', 'pane measure'));
    SEC.forEach(function (sec) {
      var head = sec && sec.querySelector('.lv-head'); if (!head) return;
      var c = head.cloneNode(true); all('[id]', c).forEach(function (x) { x.removeAttribute('id'); });
      m.replaceChildren(c); most = Math.max(most, c.offsetHeight + 14);
    });
    m.remove();
    return Math.round(f + grab.offsetHeight + lampList.parentNode.offsetHeight + most);
  }
  // The opening words sit on a quiet part of the painting at the rim, clear of the things the camera goes to: the side
  // wall at the left, half way down (the manifest may say where, as quiet: [x, y], the words' left middle); on a phone,
  // at the foot, over the water.
  function placeHero() {
    var c = cams[0], q = M.quiet || [14, 640], p = onScreen(c, q), w, l;
    if (sheet) { w = Math.min(240, vw - 24); l = 12; }
    else { w = Math.round(clamp(300 * c.k, 200, 280)); l = Math.round(Math.max(12, p[0])); }
    heroWords.style.width = w + 'px'; heroWords.style.left = l + 'px';
    var h = heroWords.offsetHeight, t = sheet ? vh - h - 16 : p[1] - h / 2;
    heroWords.style.top = Math.round(clamp(t, hh + 10, vh - h - 12)) + 'px';
  }
  function layout() {
    var keepU = YS.length === NS ? uOfY(Y) : 0, keepT = YS.length === NS ? uOfY(YT) : 0;
    vw = well.clientWidth; vh = well.clientHeight; hh = topBar.offsetHeight;
    var was = sheet;
    sheet = vw < 760 || vw < vh * 0.8;
    root.classList.toggle('sheet', sheet);
    if (!sheet && was) openSheet(false);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    while (dpr > 1 && vw * vh * dpr * dpr > 5.5e6) dpr -= 0.25;
    peek = measurePeek();
    root.style.setProperty('--peek', peek + 'px');
    cardW = card.offsetWidth; cardM = parseFloat(getComputedStyle(card).right) || 16;
    cardBox = sheet ? 0 : cardW + 2 * cardM;
    layoutGauge();
    // the part of the window between the gauge and the card (above the sheet), where a stop's view is set
    AREA = sheet ? { l: gaugeBox + 4, t: hh + 6, r: vw - 8, b: vh - peek - 6 } : { l: gaugeBox + 8, t: hh + 14, r: vw - cardBox - 6, b: vh - 18 };
    slackB = sheet ? peek : 0;
    kCover = Math.max(vw / LW, vh / LH);
    kMax = Math.max(kCover * 1.2, (LEV.length ? LEV[LEV.length - 1].s : 1) * 1.6 / dpr);
    // the rim: the whole painting below the frieze (on a phone, as tall as that, with the middle and the sun in view),
    // but never so small that more than about a tenth of what is below the frieze is left over
    var band = (vh - hh) / LH, bandCover = Math.max(vw / LW, band);
    kRim = sheet ? Math.max(band, vw / LW) : Math.max(Math.min(vw / LW, band), 0.88 * bandCover);
    kFloor = Math.min(kCover, kRim);
    cams = []; for (var i = 0; i < NS; i++) cams.push(camFor(i));
    placeHero();
    // how much scrolling each stretch takes: about as far as the painting moves on the screen, so it goes with the
    // wheel or the finger
    PATHS = []; YS = [0];
    for (i = 0; i < NS - 1; i++) { var p = zoomPath(cams[i], cams[i + 1]); PATHS.push(p); YS.push(YS[i] + Math.max(vh * 0.42, p.S * vw * 0.8)); }
    Y = yOfU(keepU); YT = yOfU(keepT);
    if (lookId) lookCam = null, lookT = 0, lookA = 0, lookId = null;
    var cw = Math.round(vw * dpr), ch = Math.round(vh * dpr);
    [paint, paint2, live].forEach(function (c) { if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; } });
    pg.imageSmoothingEnabled = true; pg.imageSmoothingQuality = 'high';
    pg2.imageSmoothingEnabled = true; pg2.imageSmoothingQuality = 'high';
    lg.imageSmoothingEnabled = true; lg.imageSmoothingQuality = 'high';
    dirty = liveDirty = true; planned = false;
  }

  var hotNow = '';
  function applyCamera() {
    var t = 'translate(' + (vw / 2 - cam.x * cam.k).toFixed(2) + 'px,' + (vh / 2 - cam.y * cam.k).toFixed(2) + 'px) scale(' + cam.k.toFixed(5) + ')';
    if (t !== hotNow) { hotNow = t; hotLayer.style.transform = t; }
    if (tipOn) placeTip();
  }

  // ================================================================================================================
  // The clock
  // ================================================================================================================
  var acc = 0, last = 0, raf = 0, wasMoving = false, heroP = -1, intro = reduce.matches || location.hash ? 1 : 0, INTRO_Z = 0.045;
  function stepMove(dt, now) {
    var moving = false;
    if (Y !== YT || vY !== 0) {
      if (instant()) { Y = YT; vY = 0; }
      else {
        // the spring, solved exactly for the time gone by, so a slow frame does not throw it
        var x = Y - YT, c = vY + om * x, e = Math.exp(-om * dt);
        x = (x + c * dt) * e; vY = (vY - om * c * dt) * e;
        if (Math.abs(x) < 0.2 && Math.abs(vY) < 6) { x = 0; vY = 0; }
        Y = YT + x;
        moving = x !== 0;
      }
    }
    u = uOfY(Y);
    // the card turns to a level a little past halfway to it; a move asked for by a key or a button shows where it goes
    if (goal >= 0) { if (!moving) goal = -1; }
    else if (Math.abs(u - stop) > 0.55) setStop(Math.round(u));
    // the closer look, on a spring of its own
    if (lookA !== lookT || vL !== 0) {
      if (instant()) { lookA = lookT; vL = 0; }
      else {
        var lx = lookA - lookT, lc = vL + 4.6 * lx, le = Math.exp(-4.6 * dt);
        lx = (lx + lc * dt) * le; vL = (vL - 4.6 * lc * dt) * le;
        if (Math.abs(lx) < 0.0015 && Math.abs(vL) < 0.01) { lx = 0; vL = 0; }
        lookA = lookT + lx; moving = moving || lx !== 0;
      }
      if (lookA === 0 && lookT === 0) lookId = null;
    }
    // a lamp lights when you first come to its year, slowly, and stays lit
    var litting = false;
    for (var n = 1; n <= LV.length; n++) {
      if (FIRST[n - 1] > 0 && u >= FIRST[n - 1] - 0.3) litT[n] = 1;
      if (lit[n] !== litT[n]) {
        lit[n] = instant() ? litT[n] : Math.min(litT[n], lit[n] + dt / 1.2);
        litting = true;
        if (lit[n] === 1) lampBtns[n - 1].classList.add('lit');
      }
    }
    // the words of the opening fade as the dive begins
    var hp = sstep(0, 0.3, u);
    if (hp !== heroP) {
      heroP = hp;
      heroWords.style.opacity = (1 - hp).toFixed(3);
      heroWords.style.transform = hp > 0 ? 'translateY(' + (-16 * hp).toFixed(1) + 'px)' : '';
      hero.classList.toggle('going', hp > 0.02);
      hero.classList.toggle('gone', hp >= 0.999);
    }
    var c = camAtU(u);
    if (lookId && lookCam && lookA > 0) c = bound(mix(c, lookCam, clamp(lookA, 0, 1.2)));
    // when the painting has come, it settles back into the window, a breath
    if (intro < 1 && revealAt) {
      intro = Math.min(1, (now - revealAt) / 2600);
      var z = 1 - intro; z = z * z * (3 - 2 * z);
      c = bound(mk(c.x, c.y, c.k * (1 + INTRO_Z * z)));
      moving = moving || intro < 1;
    }
    if (c.x !== cam.x || c.y !== cam.y || c.k !== cam.k) { cam = c; dirty = true; liveDirty = true; }
    stepPanes(); stepGauge();
    return { moving: moving, litting: litting };
  }
  function frame(now) {
    raf = 0;
    var dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
    var adv = false;
    if (wantPlay && !document.hidden) { acc += dt; if (acc >= TICK) { acc %= TICK; tick++; adv = true; } }
    var st = stepMove(dt, now), moving = st.moving;
    if (moving !== wasMoving) { well.classList.toggle('moving', moving); wasMoving = moving; if (!moving) thumbsSoon(); }
    if (dirty || !planned) plan(moving);
    var fading = false, drawing = false;
    if (dirty || warmQ.length) { fading = drawTiles(now); applyCamera(); }
    var swapping = stepSwap(now);
    if (dirty || liveDirty || adv || st.litting || drawingLoops || swapping) drawing = drawLive(adv, dt);
    drawingLoops = drawing;
    dirty = fading; liveDirty = false;
    if (moving || fading || swapping || warmQ.length || drawing || st.litting || (wantPlay && !document.hidden && ATLAS)) raf = requestAnimationFrame(frame);
  }
  var drawingLoops = false;
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  // ================================================================================================================
  // Going from stop to stop
  // ================================================================================================================
  function showCard(n, focusHead) {
    body.classList.toggle('down', n > 0);
    var y = n > 0 ? STOPS[n].year : -1;
    [lampBtns, gYears].forEach(function (row) { row.forEach(function (b, i) { if (i === y) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); });
    upBtn.querySelector('.ud-text').textContent = n <= 1 ? 'Up: the whole well' : 'Up: ' + label(n - 1);
    downBtn.querySelector('.ud-text').textContent = n >= NS - 1 ? 'The bottom' : 'Down: ' + label(n + 1);
    upBtn.disabled = n <= 0; downBtn.disabled = n >= NS - 1;
    var shortUp = upBtn.textContent.length <= downBtn.textContent.length;
    upBtn.style.flexShrink = shortUp ? '0' : ''; downBtn.style.flexShrink = shortUp ? '' : '0';
    // (the keys reach the things of the stop you are at, and the things only to hover of its year)
    objList.forEach(function (o) { o.btn.tabIndex = (o.only ? n > 0 && STOPS[n].year === o.y : o.stop === n) ? 0 : -1; });
    if (src.card || src.pin) { src.card = src.pin = null; lights(); }
    // (the pane with the stop on it takes the focus when it comes up)
    if (n > 0 && focusHead) focusTo = n;
    thumbsSoon();
  }
  // the card, the address and the line read aloud turn to stop n
  function setStop(n, focusHead) {
    stop = n;
    showCard(n, focusHead);
    if (n === 0 && card.contains(document.activeElement)) $('cue').focus({ preventScroll: true });
    try { history.replaceState(null, '', n === 0 ? location.pathname + location.search : '#' + STOPS[n].id); } catch (e) { /* a file page may refuse */ }
    var l = n > 0 ? LV[STOPS[n].year] : null;
    say.textContent = n === 0 ? 'The whole well, from its rim.' : l.years + '. ' + (STOPS[n].obj ? label(n) + '. ' : '') + l.role + '.';
    if (lookId && OBJ[lookId] && OBJ[lookId].stop !== n) unlook();
    placeTip(); planned = false;
  }
  // a key, a button or a year: go to stop n.  The spring is softer for a long way, so a jump of many stops is a
  // steady glide of a few seconds and not a rush.
  function go(n, how) {
    how = how || {};
    n = clamp(n | 0, 0, NS - 1);
    var d = Math.abs(n - uOfY(Y));
    unlook();
    goal = n; YT = YS[n];
    om = 3.6 / (1 + 0.22 * Math.max(0, d - 1));
    if (how.jump || instant()) { Y = YT; vY = 0; }
    if (n !== stop) setStop(n, how.focus);
    else if (how.focus && n > 0) focusTo = n;
    planned = false; dirty = true; kick();
  }
  // the next stop up or down from where the reader is going
  function nextStop(dir) {
    var t = goal >= 0 ? goal : uOfY(YT);
    return dir > 0 ? Math.floor(t + 0.02) + 1 : Math.ceil(t - 0.02) - 1;
  }
  // When the wheel or the finger lets go, the well settles on a stop if it is near one ahead, or only just past one.
  // Otherwise it rests where it is.  On the first stretch it always settles: down to the first level, or back up to the
  // whole well.
  function settle(dir) {
    var t = uOfY(YT), n = -1;
    if (t < 1) n = dir > 0 ? (t > 0.01 ? 1 : 0) : (t < 0.75 ? 0 : 1);
    else {
      var ahead = dir > 0 ? Math.ceil(t - 1e-6) : Math.floor(t + 1e-6), behind = dir > 0 ? Math.floor(t + 1e-6) : Math.ceil(t - 1e-6);
      if (Math.abs(ahead - t) <= 0.4) n = ahead; else if (Math.abs(t - behind) <= 0.08) n = behind;
    }
    if (n < 0 || Math.abs(YS[n] - YT) < 0.5) return;
    YT = YS[n]; om = Math.min(om, n === 0 || t < 1 ? 3.6 : 5.5); kick();
  }

  upBtn.addEventListener('click', function () { go(stop - 1); });
  downBtn.addEventListener('click', function () { go(stop + 1); });
  $('cue').addEventListener('click', function () { go(1, { focus: true }); });

  // the sheet at the foot of a narrow window
  function openSheet(on) {
    card.classList.toggle('open', on);
    grab.setAttribute('aria-expanded', String(on));
    grab.querySelector('.grab-text').textContent = on ? 'Less' : 'More';
  }
  grab.addEventListener('click', function () { openSheet(!card.classList.contains('open')); });

  // The wheel moves the well as far as it turns, like any page, and the spring smooths it.  A trackpad goes on
  // sending as it coasts; when it has been quiet a moment, the well settles.  (With reduced motion, one turn is one
  // stop, at once.)
  var wAcc = 0, wLast = 0, wHeld = false, wStep = 0, wQuiet = 0, wDir = 0;
  function canScroll(t, dy) {
    var sc2 = t && t.closest ? t.closest('.pane') : null;
    if (!sc2 || sc2.scrollHeight <= sc2.clientHeight + 2) return false;
    return dy > 0 ? sc2.scrollTop + sc2.clientHeight < sc2.scrollHeight - 1 : sc2.scrollTop > 0;
  }
  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * vh : e.deltaY;
    if (canScroll(e.target, dy)) return;
    unlook();
    if (instant()) {
      var now = performance.now(), gap = now - wLast; wLast = now;
      if (gap > 200) { wAcc = 0; wHeld = false; }
      if (wHeld && now - wStep < 1300) return;
      wAcc += dy;
      if (Math.abs(wAcc) >= 40) { go(stop + (wAcc > 0 ? 1 : -1)); wAcc = 0; wHeld = true; wStep = now; }
      return;
    }
    if (!dy) return;
    goal = -1; om = 8;
    YT = clamp(YT + dy, 0, YS[NS - 1]);
    wDir = dy > 0 ? 1 : -1;
    clearTimeout(wQuiet); wQuiet = setTimeout(function () { settle(wDir); }, 160);
    kick();
  }, { passive: true });

  // the keys
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target, tag = t && t.tagName, k = e.key;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
    if (k === 'Escape') {
      if (src.pin) { src.pin = null; lights(); return; }
      if (lookT > 0) { unlook(); return; }
      if (card.classList.contains('open')) { openSheet(false); grab.focus(); return; }
    }
    var dir = 0;
    if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) dir = 1;
    else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) dir = -1;
    else if (k === 'Home') { e.preventDefault(); go(0); return; }
    else if (k === 'End') { e.preventDefault(); go(NS - 1); return; }
    if (!dir) return;
    if (k === ' ' && (tag === 'BUTTON' || tag === 'A')) return;
    if ((k === 'ArrowDown' || k === 'ArrowUp') && canScroll(t, dir)) return;
    e.preventDefault();
    go(nextStop(dir));
  });

  // A finger on the well (not on the card) holds the painting and drags it.  Let go with a flick and it coasts on,
  // then settles.  While the sheet is open, a swipe on the well only shuts it.
  var tc = null;
  function onStart(e) {
    if (e.touches.length !== 1) { tc = null; return; }
    var p = e.touches[0];
    tc = { x0: p.clientX, y0: p.clientY, Y0: YT, y: p.clientY, t: performance.now(), v: 0, moved: false, open: card.classList.contains('open') };
  }
  function onMove(e) {
    if (e.cancelable) e.preventDefault();
    if (!tc || tc.open || instant() || e.touches.length !== 1) return;
    var y = e.touches[0].clientY, now = performance.now(), dt = Math.max(8, now - tc.t);
    tc.v = 0.7 * ((tc.y - y) / dt * 1000) + 0.3 * tc.v;      // px/s; more than nought is going down
    tc.y = y; tc.t = now;
    if (!tc.moved && Math.abs(y - tc.y0) < 6) return;
    if (!tc.moved) unlook();
    tc.moved = true; goal = -1; om = 30;
    YT = clamp(tc.Y0 + (tc.y0 - y), 0, YS[NS - 1]);
    kick();
  }
  function onEnd(e) {
    if (!tc) return;
    var q = tc, p = e.changedTouches[0], dx = p.clientX - q.x0, dy = p.clientY - q.y0; tc = null;
    var swipe = Math.abs(dy) >= 36 && Math.abs(dy) >= Math.abs(dx) * 1.2;
    if (q.open) { if (swipe) openSheet(false); return; }
    if (instant()) { if (swipe) go(stop + (dy < 0 ? 1 : -1)); return; }
    if (!q.moved) return;
    var v = performance.now() - q.t > 90 ? 0 : q.v;
    YT = clamp(YT + v * 0.32, 0, YS[NS - 1]); om = 6;
    settle(Math.abs(v) > 120 ? (v > 0 ? 1 : -1) : (dy < 0 ? 1 : -1));
    kick();
  }
  [well, hero].forEach(function (x) {
    x.addEventListener('touchstart', onStart, { passive: true });
    x.addEventListener('touchmove', onMove, { passive: false });
    x.addEventListener('touchend', onEnd, { passive: true });
    x.addEventListener('touchcancel', function () { tc = null; settle(1); }, { passive: true });
  });
  // on the sheet's top edge, up opens it and down shuts it
  var gsw = null;
  [grab, lampList.parentNode].forEach(function (x) {
    x.addEventListener('touchstart', function (e) { gsw = e.touches.length === 1 ? e.touches[0].clientY : null; }, { passive: true });
    x.addEventListener('touchend', function (e) {
      if (gsw == null || !sheet) return;
      var dy = e.changedTouches[0].clientY - gsw; gsw = null;
      if (dy < -30) openSheet(true); else if (dy > 30) openSheet(false);
    }, { passive: true });
  });

  // the address says which stop (experience.html#rule-builder), or which year (experience.html#y2022: its first stop)
  function stopOfHash() {
    var h = location.hash.slice(1); if (!h) return 0;
    try { h = decodeURIComponent(h); } catch (e) { /* leave it */ }
    for (var i = 1; i < NS; i++) if (STOPS[i].id === h) return i;
    var y = yearOf(h); return y >= 0 && FIRST[y] > 0 ? FIRST[y] : -1;
  }
  window.addEventListener('hashchange', function () { var n = stopOfHash(); if (n >= 0) go(n); });

  // moving or still
  function syncPause() { pauseBtn.textContent = wantPlay ? 'Pause' : 'Play'; pauseBtn.setAttribute('aria-pressed', String(!wantPlay)); }
  pauseBtn.addEventListener('click', function () { wantPlay = !wantPlay; syncPause(); body.classList.toggle('still', !wantPlay); buildActs(); kick(); });
  if (reduce.addEventListener) reduce.addEventListener('change', function () { wantPlay = !reduce.matches; syncPause(); body.classList.toggle('still', !wantPlay); buildActs(); kick(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });

  // for looking at it from outside
  window.WELLPAGE = {
    go: go, look: look, unlook: unlook,
    mood: function (m) { switchMood(m, moodBtns.filter(function (b) { return b.dataset.mood === m; })[0]); },
    state: function () {
      return {
        stop: stop, id: STOPS[stop].id, u: +u.toFixed(4), Y: +Y.toFixed(1), YT: +YT.toFixed(1), vY: +vY.toFixed(1), stops: YS.map(Math.round),
        cam: { k: +cam.k.toFixed(4), x: +cam.x.toFixed(1), y: +cam.y.toFixed(1), cx: +(cam.x - vw / 2 / cam.k).toFixed(1), cy: +(cam.y - vh / 2 / cam.k).toFixed(1) },
        look: lookId ? [lookId, +lookA.toFixed(3)] : null, lit: lit.map(function (x) { return +x.toFixed(2); }), hero: +(1 - Math.max(0, heroP)).toFixed(3),
        sheet: sheet, peek: peek, dpr: dpr, playing: wantPlay, atlas: !!ATLAS, kCover: +kCover.toFixed(4),
        mood: mood, swap: LEV2 ? (swapAt ? 'fading ' + paint2.style.opacity : 'loading') : null, acts: acts.length,
        tiles: LEV.map(function (L) { return L.tiles.filter(function (t) { return t.warm; }).length + '/' + L.tiles.length; }).join(' '),
        mb: Math.round(bytes / 1e6), inflight: inflight, stats: stats, thumbs: thumbs.map(function (t) { return t.lvl; }).join('')
      };
    },
    cams: function () { return cams.map(function (c) { return { x: +c.x.toFixed(1), y: +c.y.toFixed(1), k: +c.k.toFixed(3) }; }); },
    camAt: function (v) { return camAtU(v); },
    // where each stop's focus falls on the screen at that stop, and whether it is in the free part
    focusCheck: function () {
      return cams.map(function (c, i) {
        var s = onScreen(c, focusOf(i)), A = AREA;
        // where the focus falls in the free part: -0.5 its left (top) edge, 0 its middle, 0.5 its right (bottom) edge
        return [STOPS[i].id, Math.round(s[0]), Math.round(s[1]), i === 0 || clearOf(c, focusOf(i), A, 0), +((s[0] - A.l) / (A.r - A.l) - 0.5).toFixed(2), +((s[1] - A.t) / (A.b - A.t) - 0.5).toFixed(2), +(c.k / kCover).toFixed(2)];
      });
    },
    area: function () { return { r: AREA, gauge: { box: gaugeBox, w: gw, wl: gWl, y: gY, read: gNow >= 0 ? LV[gNow].label : null, roll: gR, reads: GS.map(Math.round), years: GY, tops: GT, post: [PX0, PX1], marks: gMarks.map(function (p, j) { var r = p.getBoundingClientRect(); return [GMARK[j].src, Math.round(r.left), Math.round(r.top + r.height / 2), Math.round(gY + GMARK[j].y * gsc)]; }),
      atLine: (function () { var s = readingAt(u), b = null; GYS.forEach(function (x) { if (!b || Math.abs(x.y - s) < Math.abs(b.y - s)) b = x; }); return b ? b.label + ' ' + Math.round(s - b.y) : null; })(), float: [gFloat.offsetLeft, gFloat.offsetTop, gFloat.offsetWidth, gFloat.offsetHeight] } }; },
    panes: function () { return panes.map(function (p) { return [p.st, p.op, p.on, p.up]; }); },
    // stand still at any point of the way (u: the stop number and how far on from it)
    place: function (v) { Y = YT = yOfU(clamp(v, 0, NS - 1)); vY = 0; goal = -1; dirty = true; kick(); },
    // a layer of moving drawings (see runLayers); returns a function that takes it away
    layer: function (fn) {
      layers.push(fn); liveDirty = true; kick();
      return function () { var i = layers.indexOf(fn); if (i >= 0) layers.splice(i, 1); liveDirty = true; kick(); };
    },
    // draw the moving canvas again (a layer's pictures have come)
    redraw: function () { liveDirty = true; kick(); },
    resetStats: function () { for (var k in stats) stats[k] = 0; }
  };

  // ================================================================================================================
  // Start
  // ================================================================================================================
  syncPause();
  body.classList.toggle('still', !wantPlay);
  layout();
  buildActs();
  var n0 = stopOfHash();
  if (n0 > 0) { go(n0, { jump: true }); for (var q = 1; q <= LV.length; q++) if (FIRST[q - 1] > 0 && FIRST[q - 1] <= n0) { lit[q] = litT[q] = 1; lampBtns[q - 1].classList.add('lit'); } }
  else showCard(0);
  stepMove(0, performance.now());
  applyCamera();
  plan(false);
  // the loose drawings come when the whole painting has (they are no use before it); the diyas of the card are cut
  // from the page's own sheet of drawings
  var cue2 = function () {
    if (cue2.done) return; cue2.done = true;
    var diya = new Image();
    diya.onload = function () { all('canvas.diya', lampList).forEach(function (c) { c.getContext('2d').drawImage(diya, 1431, 975, 96, 78, 0, 0, c.width, c.height); }); };
    diya.src = 'assets/well-cels.webp';
    if (CEL && CEL.atlas) {
      var at = CEL.atlas === 'assets/well-cels.webp' ? diya : new Image();
      var onAt = function () { ATLAS = at; liveDirty = true; kick(); };
      if (at === diya) diya.addEventListener('load', onAt); else { at.onload = onAt; at.src = CEL.atlas; }
    }
  };
  (function waitFirst() { if (LEV[0] && LEV[0].tiles.every(function (t) { return t.st >= 2; })) cue2(); else setTimeout(waitFirst, 60); })();

  var rz = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { layout(); stepMove(0, performance.now()); applyCamera(); kick(); }, 90);
  });
  // each level's words are set once, out of sight, so the browser has them ready and the card does not hold up a move;
  // and the card itself is painted once, all but clear, so that its paper and its shadow are ready before the first move
  function warmCard() {
    if (stop !== 0 || card.classList.contains('warm')) return;
    card.classList.add('warm');
    setTimeout(function () {
      card.style.transition = 'none'; card.classList.remove('warm'); void card.offsetWidth;
      requestAnimationFrame(function () { card.style.transition = ''; });
    }, 300);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); stepMove(0, performance.now()); applyCamera(); warmCard(); kick(); });
  else warmCard();
  kick();
  }
})();
