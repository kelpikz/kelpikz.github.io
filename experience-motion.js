/* Experience page: a lit thing at work, the loom.  A layer of moving drawings over the stepwell, given to the page by
   WELLPAGE.layer (see runLayers in experience.js).

   While the camera is at the loom's stop, or the loom is lit, the loom works: the shuttle is thrown across and back,
   the reed beats the weft in, the heddle rod rises and falls, the spinning wheel turns, and the parakeet on the beam
   now and then looks up, cocks its head or blinks.  Each drawing is held for two ticks of twelve a second.

   Every drawing (a cel) is a patch of the painting in that pose, painted by the painter's own code at the hour shown:
   where something moves it is the painting of that pose; round it, the installed tile itself, so it meets the painting
   with no seam; then it fades out.  A cel is drawn as the tile under it is drawn (the same rounded edges, the same
   level of detail for the zoom), so the painted pose and the cel agree to the pixel.  Where a group is at rest nothing
   is drawn, and the painting shows: still, paused, or with reduced motion, it is the painting exactly.

   At dusk and at night the hover light lays a lit picture of the loom under the moving drawings; the cels have a lit
   set made with the same gains, and are laid on at the same strength.  While the hour changes, the cels of the hour
   going and of the hour coming are laid together, as the two paintings are.

   The pictures are assets/well8k/motion/<hour>[-lit]-s4.webp (the cels at the finest tiles' size, for the near views)
   and -s2.webp (at the half-size tiles', for the far ones), made by the painter's motion tools; MAP below says where
   each cel is in them and in the painting.  A picture is loaded when it is wanted: this hour's, at the levels the zoom
   shows, the lit one at dusk and at night when the camera is at the loom or the loom is lit, and the next hour's when
   its button is pointed at.  What is not drawn is let go, so that no more than BUDGET bytes of them are unpacked. */
(function () {
  'use strict';
  var PAGE = window.WELLPAGE;
  if (!PAGE || !PAGE.layer) return;

  // ---- the map (written by the motion tools: build.mjs, put.mjs) ----------------------------------------------------
  var MAP = {"a4":[1536,904],"a2":[1536,304],"groups":["weave","wheel","parrot"],"cels":[[{"s4":[[2796,952,84,32,432,864],[2880,948,112,36,600,816]],"s2":[[1396,472,100,20,1072,280]]},{"s4":[[2796,952,84,32,528,864],[2880,948,152,36,8,816]],"s2":[[1396,472,120,20,704,280]]},{"s4":[[2796,952,84,32,624,864],[2880,948,180,40,416,768]],"s2":[[1396,472,136,24,1208,248]]},{"s4":[[2796,952,84,32,720,864],[2880,948,192,40,216,768]],"s2":[[1396,472,144,24,752,248]]},{"s4":[[2796,952,84,32,816,864],[2880,948,200,40,1216,712]],"s2":[[1396,472,144,24,904,248]]},{"s4":[[2588,908,292,76,744,480],[2880,912,200,76,1048,480]],"s2":[[1292,452,248,44,48,184]]},{"s4":[[2588,916,292,68,8,568],[2880,920,200,68,616,568]],"s2":[[1292,456,248,40,304,184]]},{"s4":[[2588,916,292,68,312,568],[2880,920,200,68,824,568]],"s2":[[1292,456,248,40,560,184]]},{"s4":[[2576,860,304,48,472,648],[2792,952,88,32,240,864],[2880,860,144,48,1096,648],[2880,948,200,40,8,768]],"s2":[[1288,428,224,28,816,184],[1396,472,144,24,1056,248]]},{"s4":[[2576,856,304,52,8,648],[2792,952,88,32,240,864],[2880,856,144,52,320,648],[2880,948,200,40,8,768]],"s2":[[1288,428,224,28,1048,184],[1396,472,144,24,1056,248]]},{"s4":[[2576,856,304,52,8,648],[2792,952,88,32,336,864],[2880,856,144,52,320,648],[2880,948,120,36,472,816]],"s2":[[1288,428,224,28,1048,184],[1396,472,108,20,952,280]]},{"s4":[[2576,856,304,52,8,648],[2736,948,144,36,168,816],[2880,856,144,52,320,648],[2880,952,120,32,872,816]],"s2":[[1288,428,224,28,1048,184],[1368,472,136,20,560,280]]},{"s4":[[2576,856,304,52,8,648],[2660,948,220,36,1040,768],[2880,856,144,52,320,648],[2880,952,120,32,1000,816]],"s2":[[1288,428,224,28,1048,184],[1328,472,176,20,224,280]]},{"s4":[[2576,856,304,52,8,648],[2600,948,280,36,752,768],[2880,856,144,52,320,648],[2880,952,120,32,1128,816]],"s2":[[1288,428,224,28,1048,184],[1296,472,208,20,8,280]]},{"s4":[[2576,856,304,52,8,648],[2556,948,324,40,880,712],[2880,856,144,52,320,648],[2880,952,120,32,1256,816]],"s2":[[1288,428,224,28,1048,184],[1276,472,228,24,512,248]]},{"s4":[[2576,856,304,52,8,648],[2532,948,348,40,520,712],[2880,856,144,52,320,648],[2880,952,120,32,1384,816]],"s2":[[1288,428,224,28,1048,184],[1264,472,240,24,264,248]]},{"s4":[[2576,856,304,52,8,648],[2524,948,356,44,8,712],[2880,856,144,52,320,648],[2880,952,120,32,8,864]],"s2":[[1288,428,224,28,1048,184],[1260,472,244,24,8,248]]},{"s4":[[2524,856,356,136,848,328],[2880,856,144,52,320,648],[2880,912,132,72,1256,480]],"s2":[[1260,428,252,68,656,96]]},{"s4":[[2576,856,304,52,8,648],[2524,916,356,76,8,480],[2880,856,144,52,320,648],[2880,920,132,64,1032,568]],"s2":[[1260,428,252,68,920,96]]},{"s4":[[2576,856,304,52,8,648],[2524,916,356,76,376,480],[2880,856,144,52,320,648],[2880,920,132,64,1176,568]],"s2":[[1260,428,252,68,1184,96]]},{"s4":[[2576,860,304,48,784,648],[2524,948,136,44,376,712],[2792,952,88,32,240,864],[2880,860,144,48,1248,648],[2880,952,68,32,912,864]],"s2":[[1288,428,224,28,1280,184],[1260,472,72,24,1352,248],[1396,476,80,16,1360,280]]},{"s4":[[2524,948,136,44,376,712],[2792,952,88,32,240,864],[2880,952,68,32,912,864]],"s2":[[1260,472,72,24,1352,248],[1396,476,80,16,1360,280]]},{"s4":[[2544,948,136,40,608,768],[2792,952,88,32,240,864],[2880,952,68,32,912,864]],"s2":[[1272,472,72,24,1432,248],[1396,476,80,16,1360,280]]},{"s4":[[2596,948,140,36,320,816],[2792,952,88,32,240,864],[2880,952,68,32,912,864]],"s2":[[1296,472,72,20,1184,280],[1396,476,80,16,1360,280]]},{"s4":[[2668,948,212,36,1272,768],[2880,952,68,32,912,864]],"s2":[[1332,472,144,20,408,280]]},{"s4":[[2736,952,144,32,720,816],[2880,952,68,32,912,864]],"s2":[[1364,472,112,20,832,280]]},{"s4":[[2788,952,92,32,136,864],[2880,952,68,32,992,864]],"s2":[[1392,476,84,16,1264,280]]}],[{"s4":[[3064,1128,156,144,8,328]],"s2":[[1528,560,84,80,8,8]]},{"s4":[[3064,1124,156,148,8,8]],"s2":[[1528,560,84,76,1304,8]]},{"s4":[[3064,1124,156,148,176,8]],"s2":[[1532,560,80,80,776,8]]},{"s4":[[3064,1124,156,148,344,8]],"s2":[[1532,560,80,76,392,96]]},{"s4":[[3064,1124,156,148,512,8]],"s2":[[1528,560,84,80,104,8]]},{"s4":[[3064,1128,156,144,176,328]],"s2":[[1532,560,80,80,864,8]]},{"s4":[[3064,1124,156,148,680,8]],"s2":[[1532,560,80,80,952,8]]},{"s4":[[3064,1124,156,148,848,8]],"s2":[[1528,560,84,80,200,8]]},{"s4":[[3064,1124,156,148,1016,8]],"s2":[[1532,560,80,76,480,96]]},{"s4":[[3064,1124,156,148,1184,8]],"s2":[[1528,560,84,80,296,8]]},{"s4":[[3064,1124,156,148,1352,8]],"s2":[[1528,560,84,76,1400,8]]},{"s4":[[3064,1128,156,144,344,328]],"s2":[[1532,560,80,76,568,96]]},{"s4":[[3064,1128,156,144,512,328]],"s2":[[1528,560,84,76,8,96]]},{"s4":[[3064,1124,156,148,8,168]],"s2":[[1528,560,84,76,104,96]]},{"s4":[[3064,1124,156,148,176,168]],"s2":[[1532,560,80,80,1040,8]]},{"s4":[[3064,1124,152,148,1352,168]],"s2":[[1528,560,84,80,392,8]]},{"s4":[[3064,1124,156,148,344,168]],"s2":[[1528,560,84,80,488,8]]},{"s4":[[3064,1124,156,148,512,168]],"s2":[[1532,560,80,80,1128,8]]},{"s4":[[3064,1128,156,144,680,328]],"s2":[[1528,560,84,76,200,96]]},{"s4":[[3064,1124,156,148,680,168]],"s2":[[1528,560,84,76,296,96]]},{"s4":[[3064,1124,156,148,848,168]],"s2":[[1532,560,80,80,1216,8]]},{"s4":[[3064,1124,156,148,1016,168]],"s2":[[1528,560,84,80,584,8]]},{"s4":[[3064,1124,156,148,1184,168]],"s2":[[1528,560,84,80,680,8]]}],[{"s4":[[2636,692,56,96,1216,328]],"s2":[[1316,344,32,52,1448,96]]},{"s4":[[2636,692,56,96,1280,328]],"s2":[[1316,344,32,52,1488,96]]},{"s4":[[2636,692,56,96,1344,328]],"s2":[[1316,344,32,52,8,184]]},{"s4":[[2660,700,16,20,1072,864],[2648,764,28,16,1096,864]],"s2":[[1328,348,12,12,1472,280],[1324,380,16,12,1448,280]]}]],"seq":{"weave":[-1,-1,-1,0,1,2,3,4,4,5,6,7,8,9,10,11,12,13,14,15,16,16,17,18,19,20,21,22,23,24,25,26,-1,-1,-1,-1],"wheel":[-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],"parrot":[-1,0,1,2,3]},"acts":[[1,2,2,2,2,2,2,2,1],[4],[3,3,3,3,3,3,4,3,3,3],[1,2,2,4,2,2,1]],"box":[620,156,200,176]}; /*MAP*/

  if (!MAP) return;
  var ID = 'rule-builder', BASE = 'assets/well8k/motion/';
  var HOURS = { day: true, dusk: true, night: true }, LIT = { dusk: true, night: true };
  // the calm level: a throw of the shuttle and back every 9 to 13 seconds, the wheel turned for two or three turns at
  // a time with a rest between, and the parakeet stirring every 6 to 12 seconds
  var CALM = { weaveRest: [36, 84], wheelTurns: [2, 3], wheelRest: [48, 108], parrotRest: [72, 144], firstParrot: [30, 66] };
  var FADE = 0.4;                                     // seconds, out (and back in) when the loom stops being shown
  var TW = 960, TH = 1080;                            // the tiles, in their own pixels, at every level
  var BUDGET = 20e6;                                  // bytes of unpacked pictures, at most (but what must be drawn)

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var sstep = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var now = function () { return performance.now(); };

  // ---- the pictures ------------------------------------------------------------------------------------------------
  // pics[name] = { name, hr: its hour, st: 1 loading, 2 here, 3 failed; bm, bytes, warm, used }
  var pics = {}, bytes = 0, pend = 0, peak = 0, warmQ = [];
  function sizeOf(name) { var a = /-s4$/.test(name) ? MAP.a4 : MAP.a2; return a[0] * a[1] * 4; }
  function load(name) {
    var p = pics[name];
    if (p) return p;
    p = pics[name] = { name: name, hr: name.split('-')[0], st: 1, bm: null, bytes: sizeOf(name), warm: false, used: now() };
    pend += p.bytes;
    var im = new Image();
    im.decoding = 'async';
    var done = function (bm) {
      if (pics[name] !== p || p.st !== 1) { if (bm && bm.close && bm !== p.bm) bm.close(); return; }
      pend -= p.bytes;
      if (!bm) { p.st = 3; return; }
      p.bm = bm; p.st = 2; bytes += p.bytes; peak = Math.max(peak, bytes);
      warmQ.push(p); PAGE.redraw();
    };
    im.onload = function () {
      (im.decode ? im.decode() : Promise.resolve()).then(function () {
        // (unpacked once, and held: an image the browser may drop and unpack again would stall a frame)
        if (window.createImageBitmap) return createImageBitmap(im).then(function (bm) { im.onload = im.onerror = null; im.src = ''; return bm; }, function () { return im; });
        return im;
      }).then(done, function () { done(null); });
    };
    im.onerror = function () { done(null); };
    im.src = BASE + name + '.webp';
    return p;
  }
  var events = [];
  function note(s) { events.push(Math.round(now()) + ' ' + s); if (events.length > 40) events.shift(); }
  function letGo(name) {
    var p = pics[name]; if (!p) return;
    if (p.st === 2) { if (p.bm && p.bm.close) p.bm.close(); bytes -= p.bytes; }
    else if (p.st === 1) pend -= p.bytes;
    var q = warmQ.indexOf(p); if (q >= 0) warmQ.splice(q, 1);
    delete pics[name];
  }
  function here(name) { var p = pics[name]; return p && p.st === 2 && p.warm ? p.bm : null; }
  // (the hour whose button is pointed at, or pressed: its pictures come while its tiles do)
  var soon = null;
  function pointed(e) {
    var b = e.target && e.target.closest ? e.target.closest('.moods button') : null;
    if (!b || !HOURS[b.dataset.mood]) return;
    // (a frame to ask for them, once for each pointing, and not for every move of the pointer over the button)
    var again = !soon || soon.hr !== b.dataset.mood || now() - soon.t > 2000;
    soon = { hr: b.dataset.mood, t: now() };
    if (again && near) PAGE.redraw();
  }
  ['pointerover', 'focusin', 'click'].forEach(function (ev) { document.addEventListener(ev, pointed, true); });
  // (and the hour the page is changing to, however it was asked for: its button is busy while its tiles come)
  var moodsEl = document.querySelector('.moods');
  if (moodsEl && window.MutationObserver) new MutationObserver(function () {
    var b = moodsEl.querySelector('button[aria-busy="true"]');
    if (b && HOURS[b.dataset.mood]) { soon = { hr: b.dataset.mood, t: now() }; if (near) PAGE.redraw(); }
  }).observe(moodsEl, { subtree: true, attributes: true, attributeFilter: ['aria-busy'] });

  // what each frame wants: name -> 2 (drawn now) or 1 (soon to be); then, each frame, the pictures not wanted are let
  // go (soon if of an hour not shown, else after a while), and the wanted ones loaded, those drawn now first, the
  // others only while they fit in the budget and the camera is still (so that a camera going past the loom does not
  // unpack them, nor a moving frame send them to the graphics card); room is made for one drawn now by letting go
  // what is not
  var wants = {};
  function ask(hr, lit, lv, pr) {
    for (var i = 0; i < lv.length; i++) { var n = hr + (lit ? '-lit' : '') + '-s' + lv[i]; if ((wants[n] || 0) < pr) wants[n] = pr; }
  }
  function keep(hrs, t, still) {
    var name, p, shown = {};
    hrs.forEach(function (h) { shown[h[0]] = true; });
    // (an hour no longer shown is let go half a second after its last use, not at once: a frame may pass between the
    // two hours' turns)
    for (name in pics) {
      p = pics[name];
      if (wants[name]) { p.used = t; continue; }
      if (t - p.used > (shown[p.hr] ? 4000 : 500)) { note('go ' + name + (shown[p.hr] ? ' unused' : ' hour')); letGo(name); }
    }
    var order = Object.keys(wants).sort(function (x, y) { return wants[y] - wants[x]; });
    order.forEach(function (n) {
      if (pics[n] || (wants[n] < 2 && !still)) return;
      var need = sizeOf(n);
      if (bytes + pend + need > BUDGET) {
        // (room: what is not wanted goes first, the oldest first; for a picture drawn now, what is only wanted soon)
        var spare = Object.keys(pics).filter(function (k) { return (wants[k] || 0) < wants[n]; }).sort(function (x, y) { return (wants[x] || 0) - (wants[y] || 0) || pics[x].used - pics[y].used; });
        while (bytes + pend + need > BUDGET && spare.length) { note('go ' + spare[0] + ' room'); letGo(spare.shift()); }
        if (bytes + pend + need > BUDGET && wants[n] < 2) return;
      }
      note('load ' + n + ' ' + wants[n]); load(n);
    });
  }

  // ---- what is drawn when: the loom's own clock, in ticks of twelve a second, from when it started to work ---------
  var seed = 1;
  function rnd() { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  function within(r) { return r[0] + Math.floor(rnd() * (r[1] - r[0] + 1)); }
  var clock = null;
  function start() {
    seed = (seed * 7 + 12345) | 0;
    clock = { tk: 0, weave: 12, wheel: within([18, 42]), wheelEnd: 0, wheelPlan: null, parrot: within(CALM.firstParrot), act: null };
  }
  // the wheel: a spell of whole turns, eased in and out by holding its first and last drawings longer
  function wheelPlan() {
    var n = MAP.seq.wheel.length, turns = within(CALM.wheelTurns), holds = [];
    for (var k = 0; k < turns * n; k++) holds.push(k === 0 ? 5 : k === 1 ? 4 : k === 2 ? 3 : k >= turns * n - 2 ? (k === turns * n - 1 ? 4 : 3) : 2);
    var at = [], t = 0; holds.forEach(function (h) { at.push(t); t += h; });
    return { at: at, len: t, n: n };
  }
  function advance() {
    var c = clock; c.tk++;
    var W = MAP.seq.weave.length * 2;
    if (c.tk >= c.weave + W) c.weave = c.tk + within(CALM.weaveRest);
    if (!c.wheelPlan && c.tk >= c.wheel) { c.wheelPlan = wheelPlan(); c.wheelEnd = c.wheel + c.wheelPlan.len; }
    if (c.wheelPlan && c.tk >= c.wheelEnd) { c.wheelPlan = null; c.wheel = c.tk + within(CALM.wheelRest); }
    if (!c.act && c.tk >= c.parrot) c.act = MAP.acts[Math.floor(rnd() * MAP.acts.length)];
    if (c.act && c.tk >= c.parrot + c.act.length * 2) { c.act = null; c.parrot = c.tk + within(CALM.parrotRest); }
  }
  // the drawing of each group now (-1: at rest, as painted)
  function poses() {
    var c = clock, o = { weave: -1, wheel: -1, parrot: -1 };
    if (!c) return o;
    var d = c.tk - c.weave;
    if (d >= 0 && d < MAP.seq.weave.length * 2) o.weave = MAP.seq.weave[d >> 1];
    if (c.wheelPlan) {
      var e = c.tk - c.wheel, P = c.wheelPlan, k = 0;
      while (k + 1 < P.at.length && P.at[k + 1] <= e) k++;
      o.wheel = MAP.seq.wheel[(k + 1) % P.n];
    }
    if (c.act) { var a = c.tk - c.parrot; o.parrot = MAP.seq.parrot[c.act[Math.min(c.act.length - 1, a >> 1)]]; }
    return o;
  }

  // ---- drawing -----------------------------------------------------------------------------------------------------
  // a cel's piece [x, y, w, h, ax, ay] (pixels of level s of the painting; where it is in the atlas) on canvas g, as
  // the tile it lies on is drawn there (experience.js drawPyr: the tile's edges at whole device pixels)
  function piece(g, bm, q, s, V) {
    var c = Math.floor(q[0] / TW), r = Math.floor(q[1] / TH), cw = TW / s, ch = TH / s;
    var x0 = Math.round(V.ox + c * cw * V.K), x1 = Math.round(V.ox + (c * cw + cw) * V.K);
    var y0 = Math.round(V.oy + r * ch * V.K), y1 = Math.round(V.oy + (r * ch + ch) * V.K);
    var sx = (x1 - x0) / TW, sy = (y1 - y0) / TH;
    var dx = x0 + (q[0] - c * TW) * sx, dy = y0 + (q[1] - r * TH) * sy, dw = q[2] * sx, dh = q[3] * sy;
    if (dx > g.canvas.width || dy > g.canvas.height || dx + dw < 0 || dy + dh < 0) return;
    g.drawImage(bm, q[4], q[5], q[2], q[3], dx, dy, dw, dh);
  }
  function lay(g, bm, cel, s, V) {
    var L = s === 4 ? cel.s4 : cel.s2;
    for (var i = 0; i < L.length; i++) piece(g, bm, L[i], s, V);
  }
  // one level of the cels at strength a: over the canvas as one picture, or the pictures of the hours and of the light
  // mixed by their weights (the canvas under the cel is taken out by its own soft edge, as much as the mix has, and
  // the mix added in).  A picture not here yet leaves its share to the painting under it.
  function pass(g, cels, mix, s, a, V) {
    if (a <= 0.002 || !mix.length) return;
    var W = 0; mix.forEach(function (m) { W += m.w; });
    if (mix.length === 1) {
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = a * W;
      cels.forEach(function (cel) { lay(g, mix[0].bm, cel, s, V); });
      return;
    }
    g.globalCompositeOperation = 'destination-out'; g.globalAlpha = a * W;
    cels.forEach(function (cel) { lay(g, mix[0].bm, cel, s, V); });
    g.globalCompositeOperation = 'lighter';
    mix.forEach(function (m) { g.globalAlpha = a * m.w; cels.forEach(function (cel) { lay(g, m.bm, cel, s, V); }); });
    g.globalCompositeOperation = 'source-over';
  }

  var f = 0, near = false, on = false, ATLAS = null, lastSeen = 0, film = null, lastK = 0, wasReady = false, prevFrom = null;
  var X0 = MAP.box[0], Y0 = MAP.box[1], BW = MAP.box[2], BH = MAP.box[3];
  function layer(V, info) {
    var g = V.g, K = V.K, t = now();
    lastK = K;
    if (ATLAS === null) { try { ATLAS = !!PAGE.state().atlas; } catch (e) { ATLAS = true; } }
    var o = info.obj && info.obj[ID], si = o ? o.stop : -1;
    // near: the camera within a stop of the loom's (its pictures are wanted)
    near = si >= 0 && Math.abs(info.u - si) < 1.5;
    var lit = !!(info.lit && info.lit[ID]), a = o ? o.a || 0 : 0;
    // seen: the loom on screen, at a zoom the half-size tiles are shown at; vis: and near enough to be worth working
    var seen = K >= 1 && V.ox + (X0 + BW) * K > 0 && V.ox + X0 * K < g.canvas.width && V.oy + (Y0 + BH) * K > 0 && V.oy + Y0 * K < g.canvas.height;
    var vis = seen && K >= 1.4 && g.canvas.width / K < 1000;
    var atStop = info.stopId === ID && Math.abs(info.u - si) < (on ? 0.3 : 0.02);
    // (the hours shown, by their weights; on the first frame of a change of hour the page's mix is still the last
    // change's, 1, while the new hour's canvas is not yet seen: it is taken as 0)
    var mx = info.from && info.from !== prevFrom ? 0 : info.mix; prevFrom = info.from;
    var hrs = info.from && info.from !== info.mood && mx < 1 ? [[info.from, 1 - mx], [info.mood, mx]] : [[info.mood, 1]];
    hrs = hrs.filter(function (h) { return HOURS[h[0]] && h[1] > 0.003; });
    on = hrs.length > 0 && (film != null ? vis : (atStop || lit) && vis && info.play && !info.reduce);

    // the levels of the painting at this zoom, as experience.js need() has them: the half-size tiles over the whole
    // ones from 1 device pixel a unit, the full ones over those from 2 (and those a little either side, to come)
    var a4 = sstep(2, 2.66, K), lvN = [], lvW = [];
    if (a4 > 0.002) lvN.push(4); if (a4 < 0.999) lvN.push(2);
    if (K > 1.7 || near) lvW.push(4); if (K < 2.9) lvW.push(2);
    // the pictures: this hour's, the hour going, and the lit ones in the dark, by their weights now
    var mix = { 4: [], 2: [] }, ready = true;
    wants = {};
    if (near || on || f > 0) {
      lastSeen = t;
      hrs.forEach(function (h) {
        var lw = LIT[h[0]] && a > 0.01 ? a : 0, sets = [[false, h[1] * (1 - lw)], [true, h[1] * lw]];
        ask(h[0], false, lvW, 1);
        if (LIT[h[0]] && (info.stopId === ID || lit || a > 0.01)) ask(h[0], true, lvW, 1);
        sets.forEach(function (st) {
          if (st[1] <= 0.003) return;
          ask(h[0], st[0], lvN, 2);
          lvN.forEach(function (s) {
            var bm = here(h[0] + (st[0] ? '-lit' : '') + '-s' + s);
            if (bm) mix[s].push({ bm: bm, w: st[1] }); else ready = false;
          });
        });
      });
      if (soon && t - soon.t < 6000 && near) { ask(soon.hr, false, lvW, 1); if (LIT[soon.hr] && a > 0.01) ask(soon.hr, true, lvW, 1); }
      keep(hrs, t, !info.moving);
    } else if (t - lastSeen > 8000) {
      for (var nm in pics) { note('go ' + nm + ' far'); letGo(nm); }
    }
    // a new picture is sent to the graphics card while it is hidden: a corner of its empty gutter, drawn small
    // (made smaller, and as finely as the cels are drawn, so that its smaller copies are made then too, and not on
    // the first frame of a zoom out).  Not while the camera moves, unless the loom is wanted now: on the way to the
    // stop beside it, one of these cost a 50-67 ms frame mid-move; held to the stop, it falls on a still frame
    if (warmQ.length && (!info.moving || on)) {
      var w = warmQ.shift(), sm0 = g.imageSmoothingEnabled, sq0 = g.imageSmoothingQuality;
      g.globalAlpha = 1; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      try { g.drawImage(w.bm, 0, 0, 4, 4, 0, 0, 2, 2); } catch (e) { /* let go meanwhile */ }
      g.imageSmoothingEnabled = sm0; g.imageSmoothingQuality = sq0; w.warm = true;
    }

    // the fade, and the clock
    wasReady = ready;
    if (film != null) f = 1;
    else if (info.reduce) f = 0;
    else f = clamp(f + (on ? 1 : -1) * (info.dt || 0) / FADE, 0, 1);
    // (it starts at rest, which is the painting, once its pictures are here)
    if (on && !clock) { if (!ready) { f = 0; return false; } start(); f = 1; }
    if (f <= 0) { clock = null; return false; }
    // (while a picture it needs is not here, as when the hour changes before the next hour's have come, the clock
    // waits, and the painting under the cels has that picture's share)
    if (ready && info.adv && info.play && film == null) advance();
    if (!seen) return f < 1;

    var p = poses(), list = [];
    MAP.groups.forEach(function (gname, gi) { var j = p[gname]; if (j >= 0 && MAP.cels[gi][j]) list.push(MAP.cels[gi][j]); });
    if (list.length) {
      var sm = g.imageSmoothingEnabled, sq = g.imageSmoothingQuality;
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      if (a4 < 0.999) pass(g, list, mix[2], 2, f, V);
      if (a4 > 0.002) pass(g, list, mix[4], 4, f * a4, V);
      g.imageSmoothingEnabled = sm; g.imageSmoothingQuality = sq;
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    // (every frame while it fades; and, on a page whose own drawings do not keep the ticks coming, while it plays)
    return (f > 0 && f < 1) || (!ATLAS && on);
  }
  // (the time the layer takes on the main thread, for the checks)
  var cost = { n: 0, sum: 0, max: 0, drawn: 0 };
  var off = PAGE.layer(function (V, info) {
    var t0 = now(), r = layer(V, info), d = now() - t0;
    cost.n++; cost.sum += d; if (d > cost.max) cost.max = d; if (clock && f > 0) cost.drawn++;
    return r;
  });
  // for looking at it from outside
  window.WELLMOTION = {
    // (for the films and the checks: the loom's clock set to tick tk of a fixed run, held; null lets it go on its own)
    film: function (tk, sd) {
      film = tk == null ? null : tk;
      if (film == null) { clock = null; f = 0; PAGE.redraw(); return; }
      seed = sd || 1; start(); for (var i = 0; i < tk; i++) advance(); f = 1; PAGE.redraw();
      return JSON.stringify(poses());
    },
    off: function () { off(); },
    // (the last loads and lets go, and why)
    events: function () { return events.slice(); },
    // (the layer's own time a frame since the last call: frames, frames it worked, mean and longest ms)
    cost: function () {
      var o = { frames: cost.n, working: cost.drawn, meanMs: cost.n ? +(cost.sum / cost.n).toFixed(3) : 0, maxMs: +cost.max.toFixed(2) };
      cost = { n: 0, sum: 0, max: 0, drawn: 0 };
      return JSON.stringify(o);
    },
    state: function () {
      return { on: on, near: near, ready: wasReady, f: +f.toFixed(3), K: +lastK.toFixed(3), clock: clock ? clock.tk : null, poses: poses(),
        mb: +(bytes / 1e6).toFixed(1), peakMb: +(peak / 1e6).toFixed(1), pics: Object.keys(pics).filter(function (k) { return pics[k].st === 2; }) };
    }
  };
})();
