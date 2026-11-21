/* Experience page: the walkers on the stairs.  A layer of moving drawings over the stepwell, given to the page by WELLPAGE.layer (see
   runLayers in experience.js).
   Two figures painted the folio way (src/m-w8p-people.js, cut into atlases by the people scripts): a woman with a matka and a lota on her
   head going up the central stair from the water and back down, flight by flight, across each landing; and a man with a yoke of two pots
   walking the terrace on the right.  Their frames, routes and light are in assets/well8k/people/people.js (window.WELL8K_PEOPLE):
     sets    one walk (or stand) each: 12 frames a cycle, two steps; frames [x, y, w, h, ax, ay] in level-0 pixels (8 px a painting unit,
             ax, ay the ground under the body); level L is the same atlas at 8 / 2^L px a unit.
     routes  segments { s: set, t: ticks, p0: start, v: move a tick, j0: first frame, m0, m1: scale (start, end), sx: stretch,
             sh: shear, a0, a1: alpha (start, end) }; a walk starts and ends with the weight over one foot, so the next segment
             takes over there.  The feet stay where they were set down: on a stair, each on a tread.
     light   dusk: how the painting there stands to the day (a multiply, per channel), sampled from the installed tiles.
     night   the same atlases toned by the painting's own night (src/m-w8y-light.js: pale paint into the indigo glaze, coloured
             paint keeping its hue, laid down) at one place on each route, and how the night differs along the route from there.
   The light by the hour: day as painted.  Dusk the painting's multiply, and a lamp near gives back the paint's own colour, warmed.
   Night the night atlas, a lamp near lays the paint's colour times the flame's over it on the side toward it, and the moon puts a thin
   silver on the top edges (most at the head of the stair, as on the treads' noses).  Nothing glows.
   They step on the page's ticks (12 a second).  Paused, or with reduced motion, each stands in a stride with both feet down. */
(function () {
  'use strict';
  var PAGE, D, W8 = window.WELL8K || {};
  var LV = 4, imgs = {}, bytes = 0, frameNo = 0, nightOn = false;

  function boot() {
    PAGE = window.WELLPAGE;
    if (!PAGE || !PAGE.layer) return;
    var s = document.createElement('script');
    s.src = 'assets/well8k/people/people.js';
    s.onload = function () { D = window.WELL8K_PEOPLE; if (D && D.sets) start(); };
    document.head.appendChild(s);
  }

  // ---- the atlases (h: 'd' the day's, 'n' the night's): a level comes when it is first wanted, and goes when it has not been for a while
  function key(si, L, h) { return si + ':' + L + ':' + h; }
  function want(si, L, h) {
    var k = key(si, L, h), e = imgs[k];
    if (e) { e.used = frameNo; return e.ok ? e : null; }
    if (h === 'n' && !D.night) return null;
    var set = D.sets[si], im = new Image();
    e = imgs[k] = { im: im, ok: false, used: frameNo, L: L, si: si, h: h, bytes: set.size[L][0] * set.size[L][1] * 4 };
    im.src = (h === 'n' ? D.night.src : D.src).replace('{id}', set.id).replace('{L}', L);
    var done = function () { if (imgs[k] !== e) return; e.ok = true; bytes += e.bytes; PAGE.redraw(); };
    if (im.decode) im.decode().then(done, function () { im.onload = done; if (im.complete && im.naturalWidth) done(); });
    else im.onload = done;
    return null;
  }
  function drop(e) { var k = key(e.si, e.L, e.h); if (imgs[k] !== e) return; if (e.ok) bytes -= e.bytes; e.im.src = ''; delete imgs[k]; }
  function sweep(keep) {
    for (var k in imgs) { var e = imgs[k]; if ((e.L < LV - 1 || (e.h === 'n' && !nightOn)) && !keep[k] && frameNo - e.used > 120) drop(e); }
  }
  // the best level of a set at hand for a level wanted: that one, else the nearest finer, else the nearest coarser
  function best(si, L, h) {
    var e = want(si, L, h); if (e) return e;
    for (var d = 1; d < LV; d++) {
      var f = imgs[key(si, L - d, h)]; if (L - d >= 0 && f && f.ok) { f.used = frameNo; return f; }
      var c = imgs[key(si, L + d, h)]; if (L + d < LV && c && c.ok) { c.used = frameNo; return c; }
    }
    return null;
  }

  // ---- a walker: where it is on its route at a tick
  function Walker(name) {
    var R = D.routes[name], at = [], n = 0;
    R.forEach(function (g) { at.push(n); n += g.t; });
    var rest = [];   // the ticks at which it is in a stride with both feet down
    R.forEach(function (g, i) {
      var set = D.sets[g.s];
      if (set.n > 1) for (var t = 0; t < g.t; t++) if (set.rest.indexOf((g.j0 + t) % set.n) >= 0) rest.push(at[i] + t);
    });
    this.name = name; this.R = R; this.at = at; this.len = n; this.rest = rest;
    this.T = D.start[name] || 0; this.held = false; this.fin = -1e9; this.jump = false;
    this.oc = document.createElement('canvas'); this.ox = this.oc.getContext('2d'); this.ock = '';
    this.o2 = document.createElement('canvas'); this.x2 = this.o2.getContext('2d');
    this.L = D.light && D.light[name];
    this.N = D.night && D.night.corr && D.night.corr[name];
  }
  Walker.prototype.seg = function (T) {
    T = ((T % this.len) + this.len) % this.len;
    var lo = 0, hi = this.at.length - 1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (this.at[mid] <= T) lo = mid; else hi = mid - 1; }
    return { i: lo, g: this.R[lo], t: T - this.at[lo] };
  };
  Walker.prototype.nearestRest = function (T) {
    T = ((T % this.len) + this.len) % this.len;
    if (D.sets[this.seg(T).g.s].n === 1) return T;   // (standing already, on a landing or by the water: it stays)
    var b = this.rest[0], bd = 1e9;
    for (var i = 0; i < this.rest.length; i++) { var d = Math.abs(this.rest[i] - T); d = Math.min(d, this.len - d); if (d < bd) { bd = d; b = this.rest[i]; } }
    return b;
  };
  Walker.prototype.pose = function () {
    var s = this.seg(this.T), g = s.g, f = g.t > 1 ? s.t / g.t : 0, set = D.sets[g.s];
    return {
      set: set, si: g.s, j: set.n === 1 ? 0 : (g.j0 + s.t) % set.n, next: this.R[(s.i + 1) % this.R.length].s, left: g.t - s.t,
      x: g.p0[0] + g.v[0] * s.t, y: g.p0[1] + g.v[1] * s.t, m: g.m0 + (g.m1 - g.m0) * f, sx: g.sx, sh: g.sh, a: g.a0 + (g.a1 - g.a0) * f
    };
  };

  // ---- light
  var sstep = function (t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  // a table along a route (keyed by y for her, x for him), read at v
  function along(at, rows, v) {
    var n = at.length, i = 0;
    if (v <= at[0]) return rows[0];
    if (v >= at[n - 1]) return rows[n - 1];
    while (i < n - 2 && at[i + 1] < v) i++;
    var f = (v - at[i]) / (at[i + 1] - at[i]), p = rows[i], q = rows[i + 1];
    return [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, p[2] + (q[2] - p[2]) * f];
  }
  function duskMul(w, P) { var L = w.L; return L && L.dusk ? along(L.at, L.dusk, L.key === 'x' ? P.x : P.y) : [1, 1, 1]; }
  function nightMul(w, P) { var N = w.N; return N ? along(N.at, N.corr, N.key === 'x' ? P.x : P.y) : [1, 1, 1]; }
  // the moon on the top edges: strong at the stair's head, faint (but there) down to the water (the treads' noses, m-w8y-light.js)
  function moonAt(y) { var f0 = 1 - sstep((y - 160) / 400); return Math.max(f0 * f0, 0.24 * (1 - sstep((y - 940) / 60))); }
  var MOON = 'rgb(182,195,232)';
  // a lamp near: the nearest flame within reach of the figure (its body a line from the feet to the head)
  var LAMP = { reach: 44, near: 8, lo: 0.4,
    dusk: { k: 0.5, tint: [1.03, 0.84, 0.6] },
    night: { k: 0.6, C: [1, 0.7, 0.4], gain: 0.6, amb: 0.8 } };
  function lampsOf(mood) { return mood === 'day' ? [] : (W8.moods && W8.moods[mood] && W8.moods[mood].lamps) || []; }
  function lampFor(P, mood) {
    var ls = lampsOf(mood); if (!ls.length) return null;
    var yh = P.y - 42 * P.m, bp = null, bd = 1e9, bq = null;
    for (var i = 0; i < ls.length; i++) {
      var p = ls[i], qy = Math.max(yh, Math.min(P.y, p[1])), d = Math.hypot(p[0] - P.x, p[1] - qy);
      if (d < bd) { bd = d; bp = p; bq = qy; }
    }
    if (!bp || bd > LAMP.reach) return null;
    var cy = P.y - 21 * P.m, dx = bp[0] - P.x, dy = bp[1] - cy, dl = Math.hypot(dx, dy) || 1;
    return { k: 1 - sstep((bd - LAMP.near) / (LAMP.reach - LAMP.near)), dx: dx / dl, dy: dy / dl };
  }

  // ---- the frame lit for an hour, in a canvas at the level's pixels
  var SC = document.createElement('canvas'), SX = SC.getContext('2d');
  function sized(c, x, cw, ch) { if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; } else x.clearRect(0, 0, cw, ch); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
  function put(x, e, fr, cw, ch, dx, dy) { var d = 1 << e.L; x.drawImage(e.im, fr[0] / d, fr[1] / d, fr[2] / d, fr[3] / d, dx || 0, dy || 0, cw, ch); }
  var to255 = function (v) { return Math.max(0, Math.min(255, Math.round(v * 255))); };
  function rgb(c) { return 'rgb(' + to255(c[0]) + ',' + to255(c[1]) + ',' + to255(c[2]) + ')'; }
  // across the figure toward the lamp: lo of the light on the far side, all of it on the near side (as the painting lights a thing)
  function lampGrad(x, B, lp, km, f) {
    var h = 1.1 * 0.5 * (Math.abs(lp.dx) * B.bw + Math.abs(lp.dy) * B.bh), g = x.createLinearGradient(B.cx - lp.dx * h, B.cy - lp.dy * h, B.cx + lp.dx * h, B.cy + lp.dy * h);
    for (var s = 0; s <= 4; s++) g.addColorStop(s / 4, f(km * lp.k * (LAMP.lo + (1 - LAMP.lo) * sstep(s / 4))));
    return g;
  }
  // c: the canvas, h: the hour, C: { fr, cw, ch, B, eD, eDc, eN, mul, lamp, moon, dm }
  function paint(c, x, h, C) {
    sized(c, x, C.cw, C.ch);
    var fr = C.fr, cw = C.cw, ch = C.ch;
    if (h === 'night' && C.eN) {
      put(x, C.eN, fr, cw, ch);
      x.globalCompositeOperation = 'multiply'; x.fillStyle = rgb(C.nmul); x.fillRect(0, 0, cw, ch);
      var lp = C.lampN;
      if (lp && C.eDc) {
        // the night drawn back under the lamp's light, then the paint's own colour times the flame's laid on
        x.fillStyle = lampGrad(x, C.B, lp, LAMP.night.k, function (k) { var v = 1 - LAMP.night.amb * Math.sqrt(k); return 'rgb(' + to255(v) + ',' + to255(v) + ',' + to255(v) + ')'; });
        x.fillRect(0, 0, cw, ch);
        sized(SC, SX, cw, ch); put(SX, C.eDc, fr, cw, ch);
        var Lc = LAMP.night.C, gn = LAMP.night.gain;
        SX.globalCompositeOperation = 'multiply'; SX.fillStyle = rgb([Lc[0] * gn, Lc[1] * gn, Lc[2] * gn]); SX.fillRect(0, 0, cw, ch);
        SX.globalCompositeOperation = 'destination-in'; SX.fillStyle = lampGrad(SX, C.B, lp, LAMP.night.k, function (k) { return 'rgba(0,0,0,' + k.toFixed(3) + ')'; }); SX.fillRect(0, 0, cw, ch);
        x.globalCompositeOperation = 'lighter'; x.drawImage(SC, 0, 0);
      }
      // the moon on the top edges: the figure less itself moved down a little
      if (C.moon > 0.01) {
        sized(SC, SX, cw, ch); put(SX, C.eN, fr, cw, ch);
        SX.globalCompositeOperation = 'source-in'; SX.fillStyle = MOON; SX.fillRect(0, 0, cw, ch);
        SX.globalCompositeOperation = 'destination-out'; put(SX, C.eN, fr, cw, ch, 0, C.dm);
        x.globalCompositeOperation = 'source-atop'; x.globalAlpha = C.moon; x.drawImage(SC, 0, 0); x.globalAlpha = 1;
      }
      x.globalCompositeOperation = 'destination-in'; put(x, C.eN, fr, cw, ch);
    } else {
      put(x, C.eD, fr, cw, ch);
      // dusk, or the night before its own atlas has come: the painting's multiply there
      var mul = h === 'night' ? C.nfall : h === 'dusk' ? C.dmul : null, ld = h === 'dusk' ? C.lampD : null;
      if (!mul) return;
      x.globalCompositeOperation = 'multiply'; x.fillStyle = rgb(mul); x.fillRect(0, 0, cw, ch);
      if (ld) {
        // a lamp near at dusk gives back the paint's own colour, warmed
        sized(SC, SX, cw, ch); put(SX, C.eD, fr, cw, ch);
        SX.globalCompositeOperation = 'multiply'; SX.fillStyle = rgb(LAMP.dusk.tint); SX.fillRect(0, 0, cw, ch);
        SX.globalCompositeOperation = 'destination-in'; SX.fillStyle = lampGrad(SX, C.B, ld, LAMP.dusk.k, function (k) { return 'rgba(0,0,0,' + k.toFixed(3) + ')'; }); SX.fillRect(0, 0, cw, ch);
        x.globalCompositeOperation = 'source-over'; x.drawImage(SC, 0, 0);
      }
      x.globalCompositeOperation = 'destination-in'; put(x, C.eD, fr, cw, ch);
    }
    x.globalCompositeOperation = 'source-over';
  }
  var q2 = function (v) { return Math.round(v * 40); };
  function lampKey(l) { return l ? q2(l.k) + ',' + q2(l.dx) + ',' + q2(l.dy) : '-'; }
  function build(w, P, eD, info, L) {
    var hrs = info.from && info.from !== info.mood && info.mix < 1 ? [info.from, info.mood] : [info.mood], mix = hrs.length > 1 ? info.mix : 1;
    var d = 1 << L, fr = P.set.frames[P.j], cw = Math.max(1, Math.round(fr[2] / d)), ch = Math.max(1, Math.round(fr[3] / d)), u = 8 / d / P.m;
    var C = { fr: fr, cw: cw, ch: ch, eD: eD, B: { cx: fr[4] / d, cy: fr[5] / d - 21 * u, bw: 14 * u, bh: 44 * u }, dm: 0.45 * u };
    var night = hrs.indexOf('night') >= 0, dusk = hrs.indexOf('dusk') >= 0, k = [P.si, P.j, L, eD.L, hrs.join('>'), q2(mix)];
    if (night) {
      C.eN = info.moving ? best(P.si, Math.min(LV - 1, L + (imgs[key(P.si, L, 'n')] && imgs[key(P.si, L, 'n')].ok ? 0 : 1)), 'n') : best(P.si, L, 'n');
      C.nmul = nightMul(w, P); C.moon = 0.55 * moonAt(P.y);
      C.lampN = lampFor(P, 'night'); C.eDc = C.lampN ? best(P.si, Math.min(LV - 1, L + 1), 'd') : null;
      C.nfall = w.L && w.L.night ? along(w.L.at, w.L.night, w.L.key === 'x' ? P.x : P.y) : [0.2, 0.24, 0.5];
      k.push(C.eN ? C.eN.L : -1, C.nmul.map(q2).join(','), q2(C.moon), lampKey(C.lampN), C.eDc ? C.eDc.L : -1);
    }
    if (dusk) { C.dmul = duskMul(w, P); C.lampD = lampFor(P, 'dusk'); k.push(C.dmul.map(q2).join(','), lampKey(C.lampD)); }
    k = k.join('|');
    if (k === w.ock) return;
    w.ock = k;
    paint(w.oc, w.ox, hrs[0], C);
    if (hrs.length > 1) {
      // the hour coming, over the hour going
      paint(w.o2, w.x2, hrs[1], C);
      w.ox.globalCompositeOperation = 'source-atop'; w.ox.globalAlpha = mix; w.ox.drawImage(w.o2, 0, 0);
      w.ox.globalAlpha = 1; w.ox.globalCompositeOperation = 'source-over';
    }
  }

  var walkers = [], lastStop = null, wasHeld = null, AREA = null, areaAt = -1, cardK = -1, cardT = 0;
  window.addEventListener('resize', function () { areaAt = -1; });
  function start() {
    walkers = ['woman', 'man'].map(function (n) { return new Walker(n); });
    // every set's coarsest level at once (small), so the whole well always has them
    D.sets.forEach(function (s, i) { want(i, 3, 'd'); });
    var off = PAGE.layer(draw);
    window.PEOPLE = {
      // (for tests: take the layer away and put it back)
      off: function () { if (off) { off(); off = null; } },
      on: function () { if (!off) off = PAGE.layer(draw); },
      mem: function () {
        var list = []; for (var k in imgs) list.push(D.sets[imgs[k].si].id + '@' + imgs[k].L + (imgs[k].h === 'n' ? 'n' : '') + (imgs[k].ok ? '' : ' (loading)'));
        return { bytes: bytes, mb: +(bytes / 1048576).toFixed(2), images: list.sort() };
      },
      state: function () { return walkers.map(function (w) { var P = w.pose(); return { name: w.name, T: w.T, set: P.set.id, frame: P.j, x: +P.x.toFixed(2), y: +P.y.toFixed(2), m: +P.m.toFixed(3), a: +P.a.toFixed(2), held: w.held, key: w.ock, drawn: w.drawn }; }); },
      at: function (name, T) { walkers.forEach(function (w) { if (w.name === name) { w.T = T; w.ock = ''; } }); PAGE.redraw(); },
      walkers: walkers
    };
  }

  function draw(V, info) {
    frameNo++;
    var g = V.g, held = !info.play || info.reduce;
    // stand in a stride when held: the nearest pose with both feet down
    if (held !== wasHeld) { walkers.forEach(function (w) { if (held) w.T = w.nearestRest(w.T); w.ock = ''; w.held = held; }); wasHeld = held; }
    if (info.adv && !held) walkers.forEach(function (w) { w.T = (w.T + 1) % w.len; });
    // the night's atlases (their coarsest level) as soon as the night is chosen
    var nOn = info.mood === 'night' || info.from === 'night';
    if (nOn && !nightOn && D.night) D.sets.forEach(function (s, i) { want(i, 3, 'n'); });
    nightOn = nOn;
    // (the free part of the screen: asked of the page now and then, not every frame: the page measures for it)
    if (areaAt < 0 || (!info.moving && frameNo - areaAt > 240) || info.stopId !== lastStop) { AREA = PAGE.area ? PAGE.area().r : null; areaAt = frameNo; }
    var A = AREA, dpr = info.dpr || 1, keep = {};
    // the card and the gauge are there below the rim only (the page shows them from the first stop down): they come and go in
    // about a third of a second, and so do the edges of the free part
    var now = performance.now(), cOn = info.stop > 0 ? 1 : 0, cs = (now - cardT) / 300;
    cardK = cardK < 0 ? cOn : cOn > cardK ? Math.min(cOn, cardK + cs) : Math.max(cOn, cardK - cs); cardT = now;
    walkers.forEach(function (w) {
      // the bottom stop looks at the last flight and the water: chosen while she is far up the stair, she is brought round to
      // come down to it, the moment she is out of sight
      if (w.name === 'woman') {
        if (info.stopId !== lastStop) w.jump = info.stopId === 'before' && D.start.before != null;
        if (w.jump && w.pose().y >= 790) w.jump = false;
      }
      var P = w.pose(); if (P.a <= 0.003) return;
      // where the frame falls on the screen (its rect is the same at every level; the shear moves its far side a little up or down)
      var fr = P.set.frames[P.j], ex = V.ox + V.K * P.x, ey = V.oy + V.K * P.y, s8 = V.K * P.m / 8, sk = Math.abs(V.K * P.sh / 8 * fr[2]);
      var x0 = ex - s8 * P.sx * fr[4], x1 = x0 + s8 * P.sx * fr[2], y0 = ey - s8 * fr[5] - sk, y1 = ey - s8 * fr[5] + s8 * fr[3] + sk;
      var off = x1 < 0 || y1 < 0 || x0 > g.canvas.width || y0 > g.canvas.height;
      if (w.jump && off) { w.T = D.start.before; w.jump = false; w.fin = frameNo; w.ock = ''; return; }
      if (off) return;   // (nothing is fetched for a walker out of sight)
      var need = V.K * P.m, L = Math.max(0, Math.min(LV - 1, Math.floor(Math.log(8 / (need * 0.9)) / Math.LN2)));
      // a finer level is only fetched while the camera is still; a coarser one does for the move
      var e = info.moving ? best(P.si, Math.min(LV - 1, L + (imgs[key(P.si, L, 'd')] && imgs[key(P.si, L, 'd')].ok ? 0 : 1)), 'd') : best(P.si, L, 'd');
      keep[key(P.si, L, 'd')] = 1; if (nightOn) keep[key(P.si, L, 'n')] = 1;
      if (!info.moving && P.left <= 24) { want(P.next, L, nightOn ? 'n' : 'd'); keep[key(P.next, L, nightOn ? 'n' : 'd')] = 1; }
      if (!e) return;
      var Lb = e.L, d = 1 << Lb, q = d / 8;
      w.drawn = [+V.K.toFixed(3), L, Lb, frameNo, info.moving ? 1 : 0, Math.round(x0 / dpr), Math.round(y0 / dpr), Math.round(x1 / dpr), Math.round(y1 / dpr)];   // painting units (at the set's own scale) to a pixel of this level
      var a = V.K * P.m * P.sx * q, b = V.K * P.sh * q, dd = V.K * P.m * q;
      // out from under the card and the gauge (and a phone's sheet): fade as it comes within 40 px of the free part's edge.  (The band
      // along the top is a frame: the stair runs on under it, and so does she.)
      var fade = 1;
      if (A && cardK > 0) { var m = Math.min(x0 / dpr - A.l, A.r - x1 / dpr, A.b - y1 / dpr); fade = 1 - cardK * (1 - Math.max(0, Math.min(1, 1 + m / 40))); }
      // (brought round out of sight, it comes in softly)
      var alpha = P.a * fade * Math.min(1, (frameNo - w.fin) / 36); if (alpha <= 0.01) return;
      build(w, P, e, info, Lb);
      g.globalAlpha = alpha;
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.setTransform(a, b, 0, dd, ex, ey);
      g.drawImage(w.oc, -fr[4] / d, -fr[5] / d);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
    });
    lastStop = info.stopId;
    if (frameNo % 30 === 0) sweep(keep);
    return false;
  }

  if (window.WELLPAGE) boot(); else window.addEventListener('load', boot);
})();
