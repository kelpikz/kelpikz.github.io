/* ============================================================================
   LAND AND WATER
   rocks, lake surface, raindrop rings, scalloped shore, lotus and pads,
   waterfall, dried lake bed.            (all sizes in logical units)
   ========================================================================== */
(function () {
  'use strict';
  const PI = Math.PI, TAU = PI * 2, DEG = PI / 180;

  // ------------------------------------------------------------ small helpers
  function ridgeAt(ridge, x) {
    if (x <= ridge[0][0]) return ridge[0][1];
    for (let i = 1; i < ridge.length; i++) if (x <= ridge[i][0]) {
      const a = ridge[i - 1], b = ridge[i], t = (x - a[0]) / ((b[0] - a[0]) || 1);
      return a[1] + (b[1] - a[1]) * t;
    }
    return ridge[ridge.length - 1][1];
  }
  // move a polyline sideways; +d = to the right-hand side of travel (screen, y down)
  function offsetPath(pts, d) {
    const n = pts.length, out = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      out.push([pts[i][0] - ty * d, pts[i][1] + tx * d]);
    }
    return out;
  }
  function pathLen(pts) { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; }
  function centroid(pts) { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1]; } return [x / pts.length, y / pts.length]; }
  function weighted(A, list, u) {
    let tot = 0; for (const f of list) tot += f.w;
    let v = (u == null ? A.rnd() : u) * tot;
    for (const f of list) { v -= f.w; if (v <= 0) return f; }
    return list[list.length - 1];
  }

  // ------------------------------------------------------------ ROCKS
  const ROCK = {
    dry: {
      crevice: '#8a4a3c', line: 'sepia',
      fam: [
        { w: 2.6, c: ['pinkrock', 'gulabi', '#e6b6aa'], fold: 'lac', lip: 'khadi' },
        { w: 2.0, c: ['mauve', 'lilac', '#c2a3bd'], fold: 'plum', lip: 'khadi' },
        { w: 1.8, c: ['peach', 'sand', 'cream'], fold: 'umber', lip: 'khadi' },
        { w: 1.8, c: ['ochre', 'haldi', '#d9a441'], fold: 'brick', lip: 'cream' },
        { w: 1.2, c: ['stone', 'khadi', '#ded6c6'], fold: 'slate', lip: 'khadi' },
        { w: 0.9, c: ['crimson', 'sindoor', 'hingul'], fold: 'maroon', lip: 'gulabi', accent: true }
      ]
    },
    green: {
      crevice: 'bottle', line: 'kajal',
      fam: [
        { w: 3.0, c: ['sage', '#b9c79a', 'verdigris'], fold: 'moss', lip: 'cream' },
        { w: 2.4, c: ['olive', 'sap', '#8a9442'], fold: 'bottle', lip: 'leaf' },
        { w: 2.0, c: ['teal', 'malachite', '#4a8f78'], fold: 'bottle', lip: 'verdigris' },
        { w: 1.3, c: ['leaf', '#b7c25a', 'haldi'], fold: 'moss', lip: 'cream' },
        { w: 0.9, c: ['moss', '#5b6b30'], fold: 'bottle', lip: 'sage' }
      ]
    },
    night: {
      crevice: 'night', line: 'kajal',
      fam: [
        { w: 3.0, c: ['plum', '#5d4466', '#7a5a7c'], fold: 'night', lip: 'lilac' },
        { w: 2.6, c: ['storm', '#45557a', '#33405f'], fold: 'night', lip: 'sky' },
        { w: 2.0, c: ['slate', '#6b7a88', '#59697a'], fold: 'neel', lip: 'ice' },
        { w: 1.5, c: ['bottle', '#2c5040', 'teal'], fold: 'night', lip: 'verdigris' }
      ]
    }
  };
  const palette = p => (p && typeof p === 'object') ? p : (ROCK[p || 'dry'] || ROCK.dry);

  // one rock tongue: outline from the foot on the left, over the crown, to the foot on the right
  function tonguePts(A, L) {
    const rr = A.rr, x = L.x, yt = L.yt, w = L.w, h = L.h, lean = L.lean || 0, j = w * 0.04;
    const pk = L.peak != null ? L.peak : rr(-0.13, 0.13) * w;
    const sq = L.foot ? 0.42 : 0.5;                     // a free-standing boulder tucks its feet in
    const sh = L.sharp || 0, lr = (a, b) => a + (b - a) * sh;   // sharp = 1: a pointed finger, 0: a round dome
    const cp = [
      [x - w * sq + rr(-j, j), yt + h],
      [x - w * rr(0.5, 0.57) + lean * 0.15, yt + h * rr(0.64, 0.74)],
      [x - w * rr(0.47, 0.55) + lean * 0.45, yt + h * rr(0.36, 0.45)],
      [x - w * lr(rr(0.35, 0.44), rr(0.25, 0.31)) + lean * 0.8, yt + h * lr(rr(0.13, 0.2), rr(0.17, 0.23))],
      [x - w * lr(rr(0.13, 0.21), rr(0.06, 0.1)) + lean + pk * 0.6, yt + h * lr(rr(0.022, 0.05), rr(0.045, 0.07))],
      [x + lean + pk, yt],
      [x + w * lr(rr(0.14, 0.22), rr(0.06, 0.11)) + lean + pk * 0.6, yt + h * lr(rr(0.03, 0.06), rr(0.05, 0.08))],
      [x + w * lr(rr(0.35, 0.45), rr(0.25, 0.32)) + lean * 0.8, yt + h * lr(rr(0.15, 0.23), rr(0.18, 0.25))],
      [x + w * rr(0.47, 0.55) + lean * 0.45, yt + h * rr(0.38, 0.47)],
      [x + w * rr(0.5, 0.57) + lean * 0.15, yt + h * rr(0.64, 0.76)],
      [x + w * sq + rr(-j, j), yt + h]
    ];
    L.px = x + lean + pk;
    return A.spline(cp, false, 3);
  }

  function drawLobe(A, L) {
    const rr = A.rr, x = L.x, yt = L.yt, w = L.w, h = L.h, lean = L.lean || 0;
    const edge = tonguePts(A, L), n = edge.length;
    const big = w > 58;
    // flat colour, laid with the stick
    A.fill(edge, 'pastel', L.c, { w: w > 90 ? 17 : big ? 13 : 8.5, gap: 0.62, passes: 2, p: 1, reach: 1.6, ang: rr(-1.05, -0.4), cv: 0.022 });
    let iTop = 0; for (let i = 1; i < n; i++) if (edge[i][1] < edge[iTop][1]) iTop = i;
    const sd = L.side || 1;
    const vis = L.vis != null ? L.vis : 0.78;              // how much of the height is likely to stay visible
    A.pushMask(edge);
    // the fold: wax-pencil hatching hugging one flank, longest at the waist
    const flank = sd > 0 ? edge.slice(iTop) : edge.slice(0, iTop + 1).reverse();
    const fn = flank.length, foldC = L.fold, soft = A.mix(L.c, L.fold, 0.55);
    for (let m = Math.round(fn * 0.07); m < fn * vis; m += (A.chance(0.25) ? 2 : 1)) {
      const t = m / fn, p = flank[m];
      const dep = w * (0.09 + 0.24 * Math.sin(Math.min(1, t * 1.5) * PI / 2)) * rr(0.65, 1.2);
      const dn = rr(0.2, 0.62);
      const dx = -sd, l = Math.hypot(dx, dn);
      A.stroke([[p[0] + sd * 1.5, p[1] - dn * 1.5], [p[0] + dx / l * dep, p[1] + dn / l * dep]], 'shade', A.chance(0.7) ? foldC : soft, { w: rr(1.8, 2.8), p: rr(0.5, 0.85), tin: 0, tout: 0.55 });
    }
    // a soft second tone under the hatching, dragged down the same flank
    const band = flank.slice(Math.round(fn * 0.12), Math.round(fn * vis));
    if (band.length > 3) {
      const inn = band.map(p => [p[0] - sd * w * 0.07, p[1]]);
      A.stroke(inn, 'pastel', soft, { w: w * 0.13, p: 0.42, flow: 0.5, reach: 1.1, wob: 1.4 });
    }
    // pale lip on the lit shoulder
    let lit;
    if (sd > 0) lit = edge.slice(Math.round(iTop * rr(0.3, 0.45)), Math.min(n - 1, iTop + A.ri(2, 5)));
    else lit = edge.slice(Math.max(0, iTop - A.ri(2, 5)), iTop + Math.round((n - iTop) * rr(0.55, 0.7)));
    if (lit.length > 3) {
      A.stroke(offsetPath(lit, rr(2.0, 3.0)), 'chalk', A.mix(L.c, L.lip, 0.62), { w: rr(1.9, 2.9), p: rr(0.7, 0.9), tin: 0.2, tout: 0.25 });
      if (A.chance(0.5)) A.stroke(offsetPath(lit.slice(Math.round(lit.length * 0.2), Math.round(lit.length * 0.8)), rr(5, 7.5)), 'chalk', A.mix(L.c, L.lip, 0.4), { w: rr(1.2, 1.8), p: 0.55, tin: 0.3, tout: 0.3 });
    }
    // folds: one or two lines echoing the shaded flank further in, each with ticks on its shadow side
    const nc = A.ri(1, big ? 2 : 1) + (w > 95 ? 1 : 0);
    for (let c = 1; c <= nc; c++) {
      const a0 = Math.round(fn * rr(0.05, 0.14)), a1 = Math.round(fn * Math.min(vis, rr(0.5, 0.8)));
      if (a1 - a0 < 4) continue;
      const seg = flank.slice(a0, a1), dOff = w * (0.13 + 0.15 * c) * rr(0.85, 1.15);
      const fold = seg.map((p, i) => { const t = i / (seg.length - 1); return [p[0] - sd * dOff * (0.45 + 0.55 * Math.sin(Math.min(1, t * 1.4) * PI / 2)) + rr(-0.4, 0.4), p[1] + dOff * 0.25 * (1 - t)]; });
      A.stroke(fold, 'pencil', foldC, { w: rr(0.9, 1.3), p: rr(0.6, 0.9), tin: 0.25, tout: 0.35 });
      for (let k = 2; k < fold.length - 2; k += A.ri(2, 4)) {
        const l = rr(3, 8) * Math.max(0.7, w / 70);
        A.stroke([fold[k], [fold[k][0] - sd * l, fold[k][1] + l * rr(0.3, 0.7)]], 'pencil', foldC, { w: rr(0.7, 1.0), p: rr(0.3, 0.6), tin: 0, tout: 0.6 });
      }
    }
    if (A.chance(0.35)) {                               // a short crease on the lit face
      const f = -sd * rr(0.12, 0.3), t0 = rr(0.1, 0.22), t1 = Math.min(vis, rr(0.4, 0.62)), cp = [];
      for (let k = 0; k <= 3; k++) { const t = t0 + (t1 - t0) * k / 3; cp.push([x + lean * (1 - t) + (L.px - x - lean) * (1 - t) * (1 - t) + f * w * (0.4 + 0.7 * Math.min(1, t * 2.2)) + rr(-0.02, 0.02) * w, yt + h * t]); }
      A.stroke(A.spline(cp, false, 2.5), 'pencil', foldC, { w: rr(0.8, 1.1), p: rr(0.45, 0.7), tin: 0.3, tout: 0.4 });
    }
    // grit
    for (let k = A.ri(2, 7); k > 0; k--) {
      const t = rr(0.12, vis * 0.9), gx = x + lean * (1 - t) + rr(-0.3, 0.3) * w, gy = yt + h * t;
      A.dot(gx, gy, 'pencil', A.chance(0.6) ? foldC : L.lip, { w: rr(0.8, 1.5), len: rr(0.3, 1.6) });
    }
    A.popMask();
    // wiry contour, a hair off register, restated here and there
    const ox = rr(-0.6, 0.6), oy = rr(-0.5, 0.5);
    A.outline(edge.map(p => [p[0] + ox, p[1] + oy]), 'kajal', L.line, { w: rr(1.05, 1.5), p: rr(0.75, 0.9), pull: rr(55, 110), again: 0.25 });
    if (L.foot) {                                        // a boulder standing on its own: close the foot and seat it
      const a = edge[0], b = edge[n - 1];
      A.stroke([[a[0] + rr(-1, 1), a[1] + 0.5], [(a[0] + b[0]) / 2, a[1] + rr(0.5, 2)], [b[0] + rr(-1, 1), b[1] + 0.5]], 'kajal', L.line, { w: 1.1, p: 0.7 });
      for (let k = A.ri(4, 7); k > 0; k--) { const gx = rr(a[0] - 4, b[0] + 6), l = rr(5, 14); A.stroke([[gx, a[1] + rr(1.5, 4.5)], [gx + l, a[1] + rr(1.5, 4.5)]], 'pencil', 'sepia', { w: 0.9, p: rr(0.3, 0.6) }); }
    }
    return edge;
  }

  function lobeColour(A, P, fam) {
    const c = A.mix(A.pick(fam.c), A.pick(fam.c), A.rr(0, 0.6));
    return A.vary(c, 0.028);
  }

  /* M.rockHill(A, ridge, baseY, o)
     ridge : skyline polyline [[x,y]...] left to right.  Everything between it and baseY becomes stacked rock tongues.
     o     : palette 'dry' | 'green' | 'night' | {crevice, line, fam:[{w, c:[..], fold, lip}]}
             size (1) scale of the lobes, step (44) vertical distance between rows, massif (170) width of one colour family,
             baseRough (1) wobble of the foot line
     returns {lobes:[{x, y, w, h, row}], top:[[x,y]...]}  (x,y = crown of each tongue; top = skyline crowns left to right) */
  M.rockHill = function (A, ridge, baseY, o) {
    o = o || {};
    const rr = A.rr, P = palette(o.palette), sz = o.size || 1;
    ridge = ridge.slice().sort((a, b) => a[0] - b[0]);
    const x0 = ridge[0][0], x1 = ridge[ridge.length - 1][0];
    const step = (o.step || 44) * sz, mw = (o.massif || 170) * sz;
    let ymin = 1e9; for (const p of ridge) if (p[1] < ymin) ymin = p[1];

    // the dark of the crevices, under everything
    const low = [];
    const lowAt = x => Math.min(baseY, Math.max(ridgeAt(ridge, x - 22 * sz), ridgeAt(ridge, x), ridgeAt(ridge, x + 22 * sz)) + 34 * sz);
    for (let x = x0; x < x1; x += 12) low.push([x, lowAt(x)]);
    low.push([x1, lowAt(x1)]);
    A.ground(low.concat([[x1, baseY], [x0, baseY]]), P.crevice, { w: 26, rub: 0, top: 0, edge: 1.2 });

    // nothing may fall below the foot of the hill
    const bot = [], br = o.baseRough != null ? o.baseRough : 1, kb = A.rnd() * 77;
    for (let x = x1 + 160; x >= x0 - 160; x -= 14) bot.push([x, baseY + (A.noise1(x / 40 + kb, 93) - 0.5) * 5 * br]);
    A.pushMask([[x0 - 160, ymin - 80], [x1 + 160, ymin - 80]].concat(bot));

    const km = A.rnd() * 500, slant = rr(-0.25, 0.25);
    const plain = P.fam.filter(f => !f.accent), acc = P.fam.filter(f => f.accent);
    const accMassif = o.accentMassif || 0, accLobe = acc.length ? (o.accent != null ? o.accent : 0.05) : 0;
    const seq = [];                                     // colour family of each massif, never the same twice running
    for (let i = 0; i < 80; i++) {
      let f, n = 0;
      do { f = (acc.length && A.chance(accMassif)) ? A.pick(acc) : weighted(A, plain); n++; } while (n < 12 && (f === seq[i - 1] || (plain.length > 3 && f === seq[i - 2])));
      seq.push(f);
    }
    const xiBase = Math.floor((x0 - 400) / mw);
    const famAt = (x, y) => {
      if (A.chance(accLobe)) return A.pick(acc);
      if (A.chance(0.1)) return weighted(A, plain);
      const xi = Math.floor((x + (A.noise2(x / 110 + km, y / 110, 67) - 0.5) * 90 * sz + (y - baseY) * slant) / mw) - xiBase;
      return seq[Math.max(0, Math.min(79, xi))];
    };

    const lobes = [];
    let d = 0;
    for (let k = 0; k < 60; k++) {
      const inc = step * (k === 0 ? 1.55 : k === 1 ? 1.2 : Math.max(0.82, 1.1 - 0.07 * k));   // distance to the next row
      let any = false, x = x0 - rr(0.05, 0.3) * 60 * sz;
      while (x < x1 + 26 * sz) {
        const ry = ridgeAt(ridge, Math.max(x0, Math.min(x1, x)));
        const frac = Math.min(1, d / Math.max(1, baseY - ry));
        const slab = k > 1 && A.chance(0.1) ? 1.45 : 1;
        const w = (k === 0 ? rr(30, 64) * (A.chance(0.2) ? 1.3 : 1) : rr(40, 78) * (0.82 + 0.62 * frac) * slab) * sz;
        const yt = ry + d * rr(0.93, 1.07) + (k === 0 ? rr(0, 13) * sz * (A.chance(0.3) ? 1.8 : 1) : rr(-7, 7) * sz);
        if (yt < baseY - 16 * sz) {
          any = true;
          let h = Math.max(inc * rr(1.5, 1.8), w * 0.72);
          if (yt + h < baseY + 8 && yt + inc * 1.1 + 24 * sz > baseY) h = baseY - yt + 8;      // nothing will stand in front: go down to the foot
          const fam = famAt(x, yt);
          lobes.push({ k, x, yt, w, h, lean: rr(-0.15, 0.15) * w, side: A.chance(0.8) ? 1 : -1, c: lobeColour(A, P, fam), fold: fam.fold, lip: fam.lip, line: P.line,
            sharp: k === 0 ? rr(0.2, 0.85) : k === 1 ? rr(0.05, 0.6) : rr(0, 0.35), vis: Math.min(0.92, inc / h + 0.22) });
        }
        x += w * rr(0.5, 0.74);
      }
      if (!any && k > 0) break;
      d += inc;
    }
    lobes.sort((a, b) => a.yt - b.yt);
    for (const L of lobes) drawLobe(A, L);
    A.popMask();
    if (o.footLine !== false && lobes.length) {          // seat the hill on the ground
      let fx0 = 1e9, fx1 = -1e9;
      for (const L of lobes) if (L.yt + L.h >= baseY - 2) { fx0 = Math.min(fx0, L.x - L.w * 0.5); fx1 = Math.max(fx1, L.x + L.w * 0.5); }
      if (fx1 > fx0) {
        const fl = []; for (let x = fx0; x <= fx1; x += 14) fl.push([x, baseY + (A.noise1(x / 40 + kb, 93) - 0.5) * 5 * br + 0.4]);
        if (fl.length > 1) A.outline(fl, 'kajal', P.line, { w: 1.2, p: 0.78, pull: 90, again: 0.3 });
        for (let x = fx0; x < fx1; x += rr(9, 26)) { const l = rr(5, 16); A.stroke([[x, baseY + rr(2, 5)], [x + l, baseY + rr(2, 5)]], 'pencil', P.line, { w: 0.9, p: rr(0.25, 0.55) }); }
      }
    }
    return {
      lobes: lobes.map(L => ({ x: L.px, y: L.yt, w: L.w, h: L.h, row: L.k })),
      top: lobes.filter(L => L.k === 0).sort((a, b) => a.px - b.px).map(L => [L.px, L.yt])
    };
  };

  /* M.rock(A, x, y, w, h, o) - one boulder or small outcrop standing on the ground.  (x,y) = middle of its foot.
     o: palette, c (colour or [colours]), fold, lip, n (number of tongues 1-3).  returns {x, y} of the crown */
  M.rock = function (A, x, y, w, h, o) {
    o = o || {};
    const rr = A.rr, P = palette(o.palette);
    const fam = o.c ? { c: Array.isArray(o.c) && typeof o.c[0] === 'string' ? o.c : [o.c], fold: o.fold || 'umber', lip: o.lip || 'khadi' } : weighted(A, P.fam);
    const n = o.n != null ? o.n : (w > 46 ? A.ri(2, 3) : A.ri(1, 2));
    const list = [];
    for (let i = 1; i < n; i++) {
      const sg = i % 2 ? -1 : 1, hh = h * rr(0.5, 0.78);
      list.push({ x: x + sg * w * rr(0.24, 0.36), yt: y - hh, w: w * rr(0.42, 0.58), h: hh, lean: sg * rr(0.02, 0.12) * w });
    }
    list.push({ x: x + rr(-0.04, 0.04) * w, yt: y - h, w: w * (n > 1 ? 0.7 : 1), h: h, lean: rr(-0.08, 0.08) * w });
    for (const L of list) {
      const f2 = (o.c || A.chance(0.7)) ? fam : weighted(A, P.fam);
      Object.assign(L, { foot: true, side: A.chance(0.8) ? 1 : -1, c: lobeColour(A, P, f2), fold: o.fold || f2.fold, lip: o.lip || f2.lip, line: o.line || P.line, vis: 0.92 });
      drawLobe(A, L);
    }
    const m = list[list.length - 1];
    return { x: m.px, y: m.yt };
  };

  // ------------------------------------------------------------ WATER
  const WATER = {
    deep: { base: 'neel', over: ['lapis', 'night', '#243a78', 'lapis'], overP: 0.42, bandP: 0.5, row: 13, dx: 24, tickP: 0.86, tick: ['khadi', 'khadi', 'ice', 'sky'], len: [8, 14], tilt: 0.08, dbl: 0.15, weave: 0.7, weaveC: ['lapis', 'aqua', 'sky'] },
    rain: { base: 'neel', over: ['lapis', 'lapis', '#2f55a6', '#243a78'], overP: 0.6, bandP: 0.8, row: 11.5, dx: 20, tickP: 0.92, tick: ['khadi', 'khadi', 'khadi', 'ice', 'sky'], len: [7, 15], tilt: 0.3, dbl: 0.3, weave: 0.71, weaveC: ['sky', 'aqua', 'aqua', 'ice'], pock: 1 },
    calm: { base: 'night', over: ['neel', 'neel', '#18203f'], overP: 0.42, bandP: 0.5, row: 15, dx: 44, tickP: 0.45, tick: ['slate', 'sky', 'ice', 'storm'], len: [16, 58], tilt: 0.015, dbl: 0.1, weave: 0, long: 1 }
  };

  function waveTick(A, x, y, K) {
    const rr = A.rr, l = rr(K.len[0], K.len[1]), c = A.pick(K.tick);
    if (K.long) {
      A.stroke([[x - l / 2, y], [x, y + rr(-0.7, 0.7)], [x + l / 2, y + rr(-0.5, 0.5)]], 'chalk', c, { w: rr(0.9, 1.5), p: rr(0.35, 0.75), tin: 0.2, tout: 0.3, wob: 0.6 });
      if (A.chance(K.dbl)) A.stroke([[x - l * 0.25 + rr(-4, 4), y + rr(2.5, 4)], [x + l * 0.3, y + rr(2.5, 4)]], 'chalk', c, { w: 0.9, p: rr(0.3, 0.5), tin: 0.2, tout: 0.3 });
      return;
    }
    const t = A.rnd(), a = rr(-K.tilt, K.tilt);
    let cp;
    if (t < 0.5) cp = [[-l / 2, 0.5], [-l * 0.16, -l * 0.21], [l * 0.2, -l * 0.19], [l / 2, 0.8]];                 // little crest
    else if (t < 0.82) cp = [[-l / 2, 0], [-l * 0.2, -l * 0.17], [l * 0.1, l * 0.07], [l / 2, -l * 0.13]];          // tilde
    else cp = [[-l / 2, -l * 0.12], [0, l * 0.13], [l / 2, -l * 0.1]];                                             // trough
    const w = rr(1.25, 2.0), p = rr(0.7, 1);
    A.stroke(A.xf(A.spline(cp, false, 1.5), { x, y, rot: a }), 'chalk', c, { w, p, tin: 0.22, tout: 0.3, wob: 0.5 });
    if (A.chance(K.dbl)) {
      const l2 = l * rr(0.45, 0.7);
      A.stroke(A.xf(A.spline([[-l2 / 2, 0.4], [0, -l2 * 0.2], [l2 / 2, 0.5]], false, 1.5), { x: x + rr(-2, 3), y: y + rr(3, 4.6), rot: a }), 'chalk', c, { w: w * 0.8, p: p * 0.75, tin: 0.25, tout: 0.3 });
    }
  }

  /* M.water(A, polygon, o) - lake surface with the Mewar water pattern.
     o: kind 'deep' | 'rain' | 'calm', c (base colour), edge (boundary roughness), pattern (1 = density multiplier)
     returns {poly} (the slightly roughened polygon that was filled) */
  M.water = function (A, poly, o) {
    o = o || {};
    const rr = A.rr, K = WATER[o.kind || 'deep'] || WATER.deep, dens = o.pattern != null ? o.pattern : 1;
    const eg = o.edge != null ? o.edge : 2, rp = eg ? A.roughen(poly, eg, 18, true) : poly, ga = rr(-0.07, 0.03);
    A.fill(rp, 'side', o.c || K.base, { w: 34, gap: 0.66, p: 1, reach: 1.75, passes: 2, turn: 0.22, ang: ga, cv: 0.02, streak: 0.32 });
    A.fill(rp, 'side', o.c || K.base, { w: 26, gap: 0.62, p: 0.95, reach: 1.5, passes: 1, ang: ga + 0.1, cv: 0.03, streak: 0.5 });
    const bb = A.bbox([rp]), kw = A.rnd() * 300;
    A.pushMask(rp);
    // bands of a second blue, the stick dragged level with the horizon
    for (let y = bb[1] + rr(0, 18); y < bb[3] + 10; y += rr(15, 34)) {
      let x = bb[0] - rr(0, 220);
      while (x < bb[2]) {
        const L = rr(140, 520);
        if (A.chance(K.bandP)) A.stroke([[x, y + rr(-3, 3)], [x + L * 0.5, y + rr(-5, 5)], [x + L, y + rr(-3, 3)]], 'side', A.pick(K.over), { w: rr(12, 26), p: K.overP * rr(0.55, 1), reach: 1.15 });
        x += L * rr(0.7, 1.25);
      }
    }
    const inW = (x, y) => A.inside(rp, x, y);
    const isWeave = (x, y) => K.weave && A.noise2(x / 150 + kw, y / 58, 57) > K.weave;
    // basket-weave patches: tight rows of small overlapping arcs
    if (K.weave) {
      let row = 0;
      for (let y = bb[1] + 5; y < bb[3]; y += rr(6.6, 8), row++) for (let x = bb[0] + (row % 2 ? 6.5 : 0) + rr(-1, 1); x < bb[2]; x += rr(11.5, 14)) {
        if (!isWeave(x, y) || !inW(x, y)) continue;
        const r = rr(5.6, 7.2), yy = y + rr(-0.8, 0.8);
        A.stroke(A.ellipse(x, yy, r, r * rr(0.6, 0.8), 0, PI * rr(1.02, 1.1), PI * rr(1.9, 1.98)), 'chalk', A.pick(K.weaveC), { w: rr(0.8, 1.15), p: rr(0.35, 0.7), tin: 0.15, tout: 0.25, wob: 0.4 });
      }
    }
    // wave ticks in staggered rows
    let row = 0;
    for (let y = bb[1] + K.row * 0.6; y < bb[3]; y += K.row * rr(0.84, 1.18), row++) {
      for (let x = bb[0] + (row % 2 ? K.dx * 0.5 : 0) + rr(-5, 5); x < bb[2]; x += K.dx * rr(0.68, 1.36) / dens) {
        const yy = y + rr(-2.6, 2.6);
        if (!inW(x, yy) || isWeave(x, yy) || !A.chance(K.tickP)) continue;
        waveTick(A, x, yy, K);
      }
    }
    if (K.pock) {                                   // rain pocks
      const n = Math.round((bb[2] - bb[0]) * (bb[3] - bb[1]) / 520 * dens);
      for (let k = 0; k < n; k++) {
        const x = rr(bb[0], bb[2]), y = rr(bb[1], bb[3]);
        if (!inW(x, y)) continue;
        if (A.chance(0.7)) A.dot(x, y, 'chalk', A.pick(['khadi', 'ice', 'sky']), { w: rr(0.9, 1.7), len: rr(0.2, 0.9), ang: rr(-0.2, 0.2), p: rr(0.5, 0.95) });
        else A.stroke(A.ellipse(x, y, rr(2, 3.6), rr(0.9, 1.5), 0, rr(0, 2), rr(3.5, 6)), 'chalk', 'ice', { w: 0.8, p: rr(0.4, 0.7), wob: 0.3 });
      }
    }
    A.popMask();
    return { poly: rp };
  };

  /* M.ripple(A, x, y, r, o) - a raindrop ring: broken concentric ellipses.
     o: flat (0.4), rings, c (colour), fresh (true = splash crown at the centre), w (line weight multiplier) */
  M.ripple = function (A, x, y, r, o) {
    o = o || {};
    const rr = A.rr, flat = o.flat || 0.4, n = o.rings || (r < 18 ? 3 : r < 38 ? 4 : 5), lw = o.w || 1;
    const cols = o.c ? [o.c] : ['khadi', 'ice', 'sky', 'sky'];
    for (let i = 1; i <= n; i++) {
      const f = i / n, rad = r * Math.pow(f, 0.85) * rr(0.94, 1.06), cx = x + rr(-1, 1) * r * 0.035, cy = y + rr(-1, 1) * r * 0.02;
      const parts = i === 1 ? 1 : A.ri(2, 3), gapTot = i === 1 ? rr(0.25, 0.8) : rr(0.8, 2.1) * (0.5 + f * 0.6);
      let a = rr(0, TAU);
      for (let k = 0; k < parts; k++) {
        const span = (TAU - gapTot) / parts * rr(0.8, 1.15), g = gapTot / parts * rr(0.6, 1.4);
        const mid = a + span / 2, back = Math.sin(mid) < 0 ? 0.72 : 1;      // far side of the ring is fainter
        A.stroke(A.ellipse(cx, cy, rad, rad * flat * rr(0.94, 1.06), rr(-0.03, 0.03), a, a + span), 'chalk', i === 1 ? cols[0] : A.pick(cols),
          { w: (2.1 - 0.85 * f) * lw * rr(0.9, 1.1), p: (1 - 0.38 * f) * back * rr(0.88, 1.08), tin: 0.15, tout: 0.22, wob: 0.55 });
        a += span + g;
      }
    }
    if (o.fresh) {
      const h = Math.max(4.5, r * 0.24);
      for (let k = A.ri(3, 5); k > 0; k--) {
        const a = -PI / 2 + rr(-0.95, 0.95), l = h * rr(0.55, 1.1);
        A.stroke([[x + Math.cos(a) * 1.2, y + Math.sin(a) * 0.8], [x + Math.cos(a) * l, y + Math.sin(a) * l]], 'chalk', 'khadi', { w: rr(1.0, 1.4) * lw, p: 0.95, tin: 0, tout: 0.5, wob: 0.3 });
        if (A.chance(0.5)) A.dot(x + Math.cos(a) * l * 1.35, y + Math.sin(a) * l * 1.35, 'chalk', 'khadi', { w: rr(1, 1.6) });
      }
      A.dot(x + rr(-1, 1), y - h * rr(1.35, 1.75), 'chalk', 'khadi', { w: rr(1.5, 2.1) * lw });
    }
  };

  /* M.shore(A, pts, o) - scalloped lobed bank along a polyline.
     The lobes push out on the RIGHT-HAND side of the direction of travel (screen coordinates): draw the path left to right
     with land above and water below, or pass side:-1 for the other way round.
     o: c (land colour, 'sap'), side (1|-1), size (46, mean lobe width), depth (0.5 of the width), back (10, how far the fill
        reaches back into the land), lip, line ('kajal'), foam (true)
     returns {tips:[{x,y,w}], edge:[[x,y]...]}   (edge = the whole scalloped waterline) */
  M.shore = function (A, pts, o) {
    o = o || {};
    const rr = A.rr, side = o.side === -1 ? -1 : 1, size = o.size || 46, depth = o.depth != null ? o.depth : 0.5, back = o.back != null ? o.back : 10;
    const c = A.col(o.c || 'sap'), dark = o.dark ? A.col(o.dark) : A.shade(c, -0.4), lip = A.mix(c, o.lip || 'cream', 0.58), line = o.line || 'kajal';
    const path = A.resample(pts.length > 2 ? A.spline(pts, false, 4) : pts, 3, false);
    const cum = [0]; for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
    const total = cum[cum.length - 1];
    const at = s => {
      s = Math.max(0, Math.min(total, s)); let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
      const t = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t];
    };
    const marks = [0]; let s = 0;
    while (s < total) { s += size * (A.chance(0.22) ? rr(1.25, 1.75) : rr(0.5, 1.1)); marks.push(Math.min(s, total)); }
    if (marks.length > 2 && marks[marks.length - 1] - marks[marks.length - 2] < size * 0.35) marks.splice(marks.length - 2, 1);
    const tips = [], edge = [];
    for (let i = 0; i + 1 < marks.length; i++) {
      const a = at(marks[i] - 2.5), b = at(marks[i + 1] + 2.5);
      const ax = b[0] - a[0], ay = b[1] - a[1], cl = Math.hypot(ax, ay) || 1;
      const nx = -ay / cl * side, ny = ax / cl * side;
      const d = cl * depth * rr(0.72, 1.25), sk = rr(-0.1, 0.1);
      const arc = A.spline([a,
        [a[0] + ax * rr(0.03, 0.08) + nx * d * rr(0.55, 0.7), a[1] + ay * 0.05 + ny * d * rr(0.55, 0.7)],
        [a[0] + ax * (0.5 + sk) + nx * d * rr(0.98, 1.08), a[1] + ay * (0.5 + sk) + ny * d * rr(0.98, 1.08)],
        [b[0] - ax * rr(0.03, 0.08) + nx * d * rr(0.55, 0.7), b[1] - ay * 0.05 + ny * d * rr(0.55, 0.7)],
        b], false, 2.2);
      const poly = [[a[0] - nx * back, a[1] - ny * back]].concat(arc, [[b[0] - nx * back, b[1] - ny * back]]);
      A.fill(poly, 'pastel', A.vary(c, 0.02), { w: 8, passes: 2, reach: 1.6, p: 1, ang: rr(-0.95, -0.3), gap: 0.46 });
      const cen = [a[0] + ax * 0.5 + nx * d * 0.3, a[1] + ay * 0.5 + ny * d * 0.3];
      const inward = (p, k) => { const vx = cen[0] - p[0], vy = cen[1] - p[1], l = Math.hypot(vx, vy) || 1; return [p[0] + vx / l * k, p[1] + vy / l * k]; };
      // dark rim band: short pencil strokes pulled in from the waterline
      A.pushMask(poly);
      for (let k = 1; k < arc.length - 1; k += (A.chance(0.3) ? 2 : 1)) {
        const t = k / arc.length, m = Math.sin(t * PI);
        A.stroke([inward(arc[k], -1), inward(arc[k], rr(3.5, 8.5) * (0.4 + 0.6 * m) * (cl / 46 > 1.4 ? 1.3 : 1))], 'shade', dark, { w: rr(1.6, 2.4), p: rr(0.45, 0.8), tin: 0, tout: 0.6 });
      }
      // pale lip just inside the edge
      const lipPts = arc.slice(Math.round(arc.length * rr(0.08, 0.2)), Math.round(arc.length * rr(0.78, 0.94))).map(p => inward(p, rr(1.9, 2.5)));
      if (lipPts.length > 2) A.stroke(lipPts, 'chalk', lip, { w: rr(1.2, 1.7), p: rr(0.6, 0.85), tin: 0.2, tout: 0.25 });
      A.popMask();
      // contour
      A.outline(arc.map(p => [p[0] + rr(-0.25, 0.25), p[1] + rr(-0.25, 0.25)]), 'kajal', line, { w: rr(1.0, 1.4), p: 0.82, pull: 60, again: 0.2 });
      // foam hugging the bank, in the water
      if (o.foam !== false) {
        const f0 = Math.round(arc.length * rr(0.1, 0.3)), f1 = Math.round(arc.length * rr(0.65, 0.92));
        const fo = arc.slice(f0, f1).map(p => inward(p, -rr(2.6, 3.4)));
        if (fo.length > 2) A.stroke(fo, 'chalk', A.pick(['khadi', 'ice', 'sky']), { w: rr(0.9, 1.3), p: rr(0.45, 0.8), tin: 0.25, tout: 0.3 });
        if (A.chance(0.45)) { const q = inward(arc[Math.round(arc.length * rr(0.3, 0.7))], -rr(6, 8.5)); A.stroke([[q[0] - rr(3, 7), q[1]], [q[0] + rr(3, 7), q[1] + rr(-0.6, 0.6)]], 'chalk', 'sky', { w: 0.9, p: rr(0.35, 0.6) }); }
      }
      const tip = arc[Math.round(arc.length / 2)];
      tips.push({ x: tip[0], y: tip[1], w: cl });
      for (const p of arc) edge.push(p);
    }
    return { tips, edge };
  };

  // ------------------------------------------------------------ LOTUS
  const LOTUS = {
    pink: { c: ['gulabi', '#efb9b4', '#e9a0a4'], tip: 'crimson', baseC: 'khadi', line: 'lac', vein: 'crimson', pod: 'haldi', podDot: 'ochre', stamen: 'peori' },
    white: { c: ['khadi', '#f4f0e6', '#eef0ea'], tip: null, baseC: 'sky', line: 'storm', vein: 'slate', pod: 'haldi', podDot: 'saffron', stamen: 'haldi' },
    dry: { c: ['ochre', '#b98b56', 'sand', '#a9764a'], tip: 'umber', baseC: null, line: 'sepia', vein: 'umber' }
  };

  function petalPts(A, len, wid, curl) {
    const Lf = A.spline([[0, 0], [-wid * 0.34, -len * 0.2], [-wid * 0.5, -len * 0.52], [-wid * 0.27, -len * 0.84], [curl, -len]], false, 1.5);
    const Rt = A.spline([[curl, -len], [wid * 0.27, -len * 0.84], [wid * 0.5, -len * 0.52], [wid * 0.34, -len * 0.2], [0, 0]], false, 1.5);
    return Lf.concat(Rt.slice(1));
  }
  // one petal; ang measured from straight up, positive leaning right
  function petal(A, bx, by, ang, len, wid, S, k) {
    const rr = A.rr, pts = A.xf(petalPts(A, len, wid, rr(-0.14, 0.14) * wid), { x: bx, y: by, rot: ang });
    const ux = Math.sin(ang), uy = -Math.cos(ang), px = -uy, py = ux;
    const c = Array.isArray(S.c) && typeof S.c[0] === 'string' ? A.pick(S.c) : S.c;
    A.fill(pts, 'pastel', k ? A.shade(c, k) : c, { w: Math.max(2.6, Math.min(6, wid * 0.55)), passes: 2, reach: 1.6, p: 1, ang: Math.atan2(uy, ux) + rr(-0.25, 0.25), gap: 0.44, cv: 0.012 });
    A.pushMask(pts);
    if (S.tip) {                                       // the darker tip, stroked inward with the edge of the stick
      const nt = Math.max(3, Math.round(wid / 1.9));
      for (let i = 0; i < nt; i++) {
        const u = (i + 0.5) / nt - 0.5 + rr(-0.08, 0.08), l = len * rr(0.26, 0.52) * (1 - Math.abs(u) * 0.75);
        const sx = bx + ux * len * 1.02 + px * u * wid * 0.95, sy = by + uy * len * 1.02 + py * u * wid * 0.95;
        A.stroke([[sx, sy], [sx - ux * l - px * u * wid * 0.25, sy - uy * l - py * u * wid * 0.25]], 'chalk', S.tip, { w: rr(1.2, 1.8), p: rr(0.5, 0.9), tin: 0, tout: 0.7, wob: 0.3 });
      }
    }
    if (S.baseC) {
      for (let i = 0; i < 3; i++) {
        const u = (i - 1) * 0.22 + rr(-0.06, 0.06), l = len * rr(0.22, 0.4);
        A.stroke([[bx + px * u * wid * 0.4, by + py * u * wid * 0.4], [bx + ux * l + px * u * wid, by + uy * l + py * u * wid]], 'chalk', S.baseC, { w: rr(1.3, 2), p: rr(0.4, 0.7), tin: 0, tout: 0.7, wob: 0.3 });
      }
    }
    A.popMask();
    const nv = wid > 7 ? 3 : 2;                         // veins
    for (let i = 0; i < nv; i++) {
      const u = (i - (nv - 1) / 2) * 0.24 + rr(-0.04, 0.04);
      A.stroke([[bx + ux * len * 0.14 + px * u * wid * 0.5, by + uy * len * 0.14 + py * u * wid * 0.5], [bx + ux * len * 0.5 + px * u * wid, by + uy * len * 0.5 + py * u * wid], [bx + ux * len * rr(0.76, 0.86) + px * u * wid * 0.6, by + uy * len * 0.8 + py * u * wid * 0.6]], 'pencil', S.vein, { w: 0.7, p: rr(0.4, 0.65), tin: 0.2, tout: 0.4, wob: 0.4 });
    }
    A.outline(pts.map(p => [p[0] + 0.2, p[1] + 0.15]), 'kajal', S.line, { w: rr(0.8, 1.05), p: 0.82, pull: 34, again: 0.16, closed: true });
  }

  function drawStem(A, x, y, len, bend, c, line) {
    const pts = A.spline([[x, y], [x + bend * 0.3, y + len * 0.38], [x + bend * 0.82, y + len * 0.78], [x + bend, y + len]], false, 2.5);
    A.stroke(pts, 'pastel', c, { w: 2.6, p: 1, reach: 1.6, aspect: 1, tin: 0, tout: 0.04, wob: 0.5 });
    A.stroke(pts.map(p => [p[0] + 1.05, p[1]]), 'pencil', line, { w: 0.8, p: 0.75, wob: 0.5 });
    for (let k = 2; k < pts.length - 1; k += A.ri(2, 4)) A.dot(pts[k][0] + A.rr(-0.9, 0.9), pts[k][1], 'pencil', line, { w: 0.8, len: 0.4 });
    return pts;
  }

  function dryLotus(A, x, y, s, o) {
    const rr = A.rr, H = o.stem || s * 1.5, dir = o.flip ? -1 : 1, S = LOTUS.dry;
    const kx = x + dir * rr(0.06, 0.18) * H, ky = y - H;
    const hx = kx + dir * s * rr(0.34, 0.5), hy = ky + s * rr(0.24, 0.4);
    for (let k = A.ri(3, 5); k > 0; k--) { const gx = x + rr(-6, 10); A.stroke([[gx, y + rr(0, 2.5)], [gx + rr(6, 16), y + rr(0, 2.5)]], 'pencil', 'sepia', { w: 0.9, p: rr(0.3, 0.55) }); }
    const st = A.spline([[x, y], [x + dir * H * 0.02, y - H * 0.45], [x + dir * H * 0.07, y - H * 0.8], [kx, ky]], false, 2.5);
    const sw = Math.max(2.8, s * 0.075);
    A.stroke(st, 'pastel', 'umber', { w: sw, p: 1, reach: 1.6, aspect: 1, tin: 0, tout: 0 });
    A.stroke(st, 'chalk', '#b98b56', { w: sw * 0.4, p: 0.7, tin: 0.1, tout: 0.2, wob: 0.4 });
    A.stroke([[kx, ky], [(kx + hx) / 2 + dir * 1.5, (ky + hy) / 2 - 2], [hx, hy]], 'pastel', 'umber', { w: sw * 0.85, p: 1, reach: 1.6, aspect: 1, tin: 0, tout: 0 });
    A.stroke(st.map(p => [p[0] + sw * 0.45, p[1]]), 'pencil', 'sepia', { w: 1.0, p: 0.85 });
    // the head hangs: shrivelled petals pointing down and outward
    const rot = PI - dir * rr(0.35, 0.7), np = A.ri(4, 5);
    for (let i = 0; i < np; i++) {
      const a = rot + ((i - (np - 1) / 2) * 17 + rr(-5, 5)) * DEG;
      petal(A, hx, hy, a, s * rr(0.46, 0.7), s * rr(0.12, 0.18), S, rr(-0.12, 0.08));
    }
    const pr = Math.max(3.2, s * 0.11), pod = A.ellipse(hx, hy - pr * 0.15, pr * 1.15, pr * 0.85, rr(-0.4, 0.4));
    A.fill(pod, 'chalk', 'umber', { w: 3, gap: 0.5, passes: 2, p: 1, reach: 1.6 });
    A.outline(pod, 'pencil', 'sepia', { closed: true, w: 1.0, p: 0.85 });
    for (let k = A.ri(3, 4); k > 0; k--) A.dot(hx + rr(-0.6, 0.6) * pr, hy - pr * 0.15 + rr(-0.45, 0.45) * pr, 'pencil', 'kajal', { w: 1.2 });
    // a withered leaf-stub on the stem and one fallen petal
    A.stroke([[x + dir * H * 0.03, y - H * 0.42], [x - dir * s * 0.22, y - H * 0.42 - s * 0.12], [x - dir * s * 0.36, y - H * 0.42 + s * 0.02]], 'pencil', 'sepia', { w: 1, p: 0.7 });
    petal(A, x - dir * s * rr(0.5, 0.8), y + rr(1, 3), dir * rr(1.2, 1.6), s * 0.34, s * 0.13, { c: ['sand', 'gulabi'], tip: 'umber', baseC: null, line: 'sepia', vein: 'umber' });
    return { head: [hx, hy], top: [kx, ky] };
  }

  /* M.lotus(A, x, y, s, kind, o)
     (x,y) = base of the bloom, where the petals meet the stalk; the bloom rises about 0.5 s above it.
     For kind 'dry' (x,y) is the foot of the stalk on the ground instead.
     s    : width of the open bloom (30-64).  A 'bud' drawn with the same s is about 0.6 s tall and 0.28 s wide.
     kind : 'bud' | 'half' | 'open' | 'white' | 'dry'
     o    : stem (length of stalk drawn downward, 0), bend (sideways drift of the stalk foot), rot (tilt), c / tip (petal colours),
            flip (dry: lean the other way) */
  M.lotus = function (A, x, y, s, kind, o) {
    o = o || {}; kind = kind || 'open';
    const rr = A.rr;
    if (kind === 'dry') return dryLotus(A, x, y, s, o);
    const rot = o.rot != null ? o.rot : rr(-0.13, 0.13);
    const S = Object.assign({}, kind === 'white' ? LOTUS.white : LOTUS.pink);
    if (o.c) S.c = o.c; if (o.tip) S.tip = o.tip; if (o.line) S.line = o.line;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const loc = (u, v) => [x + u * cr - v * sr, y + u * sr + v * cr];
    if (o.stem > 0) drawStem(A, x, y + 1, o.stem, o.bend != null ? o.bend : rr(-0.18, 0.18) * o.stem, 'sap', 'bottle');
    const P = (deg, len, wid, k, du) => { const b = loc((du || 0) + Math.sin(deg * DEG) * s * 0.05, 0); petal(A, b[0], b[1], rot + (deg + rr(-3.5, 3.5)) * DEG, len * rr(0.93, 1.06), wid * rr(0.92, 1.08), S, k); };
    const sepal = (deg, len, wid) => { const b = loc(0, s * 0.01); petal(A, b[0], b[1], rot + deg * DEG, len, wid, { c: ['sap', 'malachite'], tip: null, baseC: null, line: 'bottle', vein: 'bottle' }); };

    if (kind === 'bud') {
      const len = s * 0.6, wid = s * 0.28;
      P(rr(-3, 3), len, wid, -0.03);
      P(rr(-9, -4), len * 0.86, wid * 0.62, 0.1);
      P(rr(5, 10), len * 0.74, wid * 0.5, 0.18);
      sepal(-24 + rr(-4, 4), len * 0.42, wid * 0.45); sepal(22 + rr(-4, 4), len * 0.38, wid * 0.45);
      return { top: loc(0, -len) };
    }
    if (kind === 'half') {
      const L = s * 0.56, wd = s * 0.2;
      for (const d of [-47, 47, -25, 25, 0]) P(d, L * (1 - Math.abs(d) / 300), wd, -0.05);
      for (const d of [-31, 31, -11, 9]) P(d, L * 0.76, wd * 0.95, 0.12);
      sepal(-58, s * 0.2, s * 0.1); sepal(60, s * 0.19, s * 0.1);
      return { top: loc(0, -L) };
    }
    const white = kind === 'white';
    const L = s * 0.5, wd = s * (white ? 0.15 : 0.2);
    // low side petals first, then the back fan from the outside in
    for (const d of white ? [-99, 99] : [-104, 103]) P(d, L * 0.82, wd * 0.95, -0.06);
    const backs = white ? [-81, 81, -63, 63, -46, 46, -30, 30, -14, 14, 0] : [-83, 83, -61, 61, -40, 40, -19, 19, 0];
    for (const d of backs) P(d, L * (1 - Math.abs(d) / 600), wd, -0.04);
    // the seed pod and its ring of stamens, peeping over the front petals
    const pc = loc(0, -s * 0.25), prx = s * 0.12, pry = s * 0.07;
    const nst = A.ri(11, 15);
    for (let i = 0; i < nst; i++) {
      const a = rot - PI / 2 + (i / (nst - 1) - 0.5) * 2.5 + rr(-0.07, 0.07), l = s * rr(0.1, 0.15);
      const sx = pc[0] + Math.cos(a) * prx * 0.8, sy = pc[1] + Math.sin(a) * pry * 0.6;
      A.stroke([[sx, sy], [sx + Math.cos(a) * l, sy + Math.sin(a) * l]], 'chalk', S.stamen, { w: 1.0, p: 0.95, tin: 0, tout: 0.1, wob: 0.3 });
      A.dot(sx + Math.cos(a) * l, sy + Math.sin(a) * l, 'chalk', 'saffron', { w: rr(1.2, 1.7) });
    }
    const pod = A.ellipse(pc[0], pc[1], prx, pry, rot);
    A.fill(pod, 'pastel', S.pod, { w: 3.2, passes: 2, reach: 1.6, p: 1 });
    for (let i = A.ri(5, 7); i > 0; i--) A.dot(pc[0] + rr(-0.7, 0.7) * prx, pc[1] + rr(-0.55, 0.3) * pry, 'pencil', S.podDot, { w: rr(0.9, 1.3), len: 0.3 });
    A.stroke(A.ellipse(pc[0], pc[1], prx, pry, rot, PI * 1.02, PI * 1.98), 'pencil', 'umber', { w: 0.8, p: 0.7 });
    // front petals, shorter and paler, the middle ones last
    const fronts = white ? [-58, 58, -33, 33, -11, 10] : [-66, 66, -40, 40, -14, 13];
    for (const d of fronts) P(d, L * (white ? 0.58 : 0.55), wd * 0.95, 0.14, 0);
    sepal(-118, s * 0.13, s * 0.08); sepal(120, s * 0.12, s * 0.08);
    return { top: loc(0, -L) };
  };

  /* M.lotusPad(A, x, y, r, o) - a leaf lying on the water, seen from above.  (x,y) = centre.
     o: flat (0.8, vertical squash), rot (direction of the notch), c, kind:'dry' (curled brown leaf on the cracked bed),
        beads (number of water beads), turn (false = no turned-up edge) */
  M.lotusPad = function (A, x, y, r, o) {
    o = o || {};
    const rr = A.rr, dry = o.kind === 'dry' || o.dry, flat = o.flat != null ? o.flat : (dry ? 0.6 : 0.8);
    const notch = o.rot != null ? o.rot : rr(0, TAU), nw = rr(0.13, 0.24);
    const c = o.c ? A.col(o.c) : dry ? A.mix('umber', A.pick(['ochre', 'brick', 'sand']), rr(0.25, 0.6)) : A.mix(A.pick(['malachite', 'sap', 'teal']), A.pick(['malachite', 'sap', 'moss']), rr(0, 0.6));
    const kk = A.rnd() * 99, nl = A.ri(8, 12), N = Math.max(30, Math.round(r * 2.6));
    const radAt = a => r * (1 + 0.032 * Math.sin(a * nl + kk) + (dry ? 0.17 : 0.03) * (A.noise1(a * (dry ? 2.6 : 1.3) + kk, 71) - 0.5) * 2);
    const pt = (a, k) => { const q = radAt(a) * (k == null ? 1 : k); return [x + Math.cos(a) * q, y + Math.sin(a) * q * flat]; };
    const rim = [];
    for (let i = 0; i <= N; i++) rim.push(pt(notch + nw + (TAU - 2 * nw) * i / N));
    const cx = x + Math.cos(notch) * r * 0.1, cy = y + Math.sin(notch) * r * 0.1 * flat;
    const poly = rim.concat([[cx, cy]]);
    A.fill(poly, 'pastel', c, { w: Math.min(8, Math.max(4, r * 0.42)), passes: 2, reach: 1.6, p: 1, ang: rr(-1, -0.3), gap: 0.46 });
    const veinC = dry ? A.col('sepia') : A.mix(c, 'cream', 0.6), darkC = dry ? A.col('sepia') : A.shade(c, -0.4);
    A.pushMask(poly);
    // a lighter half, as if the leaf dished a little
    if (!dry) {
      const a0 = rr(0, TAU);
      for (let i = 0; i < 6; i++) { const a = a0 + i * 0.22 + rr(-0.05, 0.05); A.stroke([pt(a, 0.25), pt(a, 0.92)], 'pastel', A.mix(c, 'leaf', 0.55), { w: r * 0.16, p: rr(0.3, 0.5), flow: 0.6, reach: 1.1 }); }
    }
    // veins from the stalk point to the rim, some forking
    const nv = A.ri(9, 13);
    for (let i = 0; i < nv; i++) {
      const a = notch + nw + (TAU - 2 * nw) * (i + 0.5 + rr(-0.2, 0.2)) / nv, e = pt(a, rr(0.86, 0.95));
      A.stroke([[cx, cy], [(cx + e[0]) / 2 + rr(-0.6, 0.6), (cy + e[1]) / 2 + rr(-0.6, 0.6)], e], dry ? 'pencil' : 'chalk', veinC, { w: dry ? 0.8 : rr(0.8, 1.1), p: rr(0.55, 0.85), tin: 0.05, tout: 0.4, wob: 0.4 });
      if (r > 15 && A.chance(0.6)) { const m = pt(a, 0.58), f = pt(a + rr(0.1, 0.2) * (A.chance(0.5) ? 1 : -1), 0.9); A.stroke([m, f], dry ? 'pencil' : 'chalk', veinC, { w: 0.75, p: rr(0.4, 0.65), tin: 0.1, tout: 0.4 }); }
      // shadow tick beside the vein near the rim
      const sA = pt(a + 0.07, 0.62), sB = pt(a + 0.09, 0.9);
      A.stroke([sA, sB], 'shade', darkC, { w: rr(1.4, 2.2), p: rr(0.35, 0.6), tin: 0.3, tout: 0.2 });
    }
    A.popMask();
    // an edge turned up, showing the pale underside
    if (o.turn !== false && r > 11) {
      const nt = dry ? 2 : 1;
      for (let t = 0; t < nt; t++) {
        const a0 = notch + nw + rr(0.5, TAU - 2 * nw - 2), span = rr(0.7, 1.35), m = 14, outer = [], inner = [];
        for (let i = 0; i <= m; i++) { const u = i / m, a = a0 + span * u; outer.push(pt(a, 1.0)); inner.push(pt(a, 1 - Math.sin(u * PI) * rr(0.24, 0.3))); }
        const cres = outer.concat(inner.reverse());
        A.fill(cres, 'pastel', dry ? A.mix('sand', 'ochre', rr(0, 0.5)) : (A.chance(0.1) ? 'gulabi' : A.pick(['sage', 'verdigris', '#c9d3a4', 'leaf'])), { w: 3.2, passes: 2, reach: 1.6, p: 1 });
        A.stroke(cres.slice(m + 1), 'kajal', dry ? 'sepia' : 'bottle', { w: 0.85, p: 0.75 });
        for (let i = 2; i < m - 1; i += 2) A.stroke([outer[i], [(outer[i][0] + cres[2 * m + 1 - i][0]) / 2, (outer[i][1] + cres[2 * m + 1 - i][1]) / 2]], 'pencil', darkC, { w: 0.7, p: 0.4 });
      }
    }
    if (dry) {                                           // brittle cracks
      for (let k = A.ri(2, 4); k > 0; k--) { const a = rr(0, TAU), p0 = pt(a, 1), p1 = pt(a + rr(-0.2, 0.2), rr(0.5, 0.75)); A.stroke([p0, p1], 'pencil', 'sepia', { w: 0.9, p: 0.8 }); }
    } else {
      const nb = o.beads != null ? o.beads : A.ri(0, 3);  // beads of water
      for (let k = 0; k < nb; k++) {
        const b = pt(rr(0, TAU), rr(0.25, 0.72)), bw = rr(1.5, 2.6);
        A.stroke(A.ellipse(b[0], b[1] + bw * 0.25, bw * 0.75, bw * 0.55, 0, 0.2, PI - 0.2), 'pencil', darkC, { w: 0.8, p: 0.8 });
        A.dot(b[0], b[1], 'chalk', 'khadi', { w: bw, len: 0.2 });
      }
      A.dot(cx, cy, 'chalk', veinC, { w: 1.7, len: 0.2 });
    }
    A.outline(poly.map(p => [p[0] + 0.3, p[1] + 0.2]), 'kajal', dry ? 'sepia' : (A.chance(0.6) ? 'bottle' : 'kajal'), { closed: true, w: rr(0.9, 1.2), p: 0.82, pull: 50, again: 0.18 });
    return { x, y, r };
  };

  // ------------------------------------------------------------ WATERFALL
  /* M.waterfall(A, pts, w, o) - water falling along a polyline (top to bottom); w = width at the foot.
     o: top (0.55, width at the head as a fraction of w), foot (false = no foam fan), spray (1 = amount) */
  M.waterfall = function (A, pts, w, o) {
    o = o || {};
    const rr = A.rr, topK = o.top != null ? o.top : 0.55, sprayK = o.spray != null ? o.spray : 1;
    const path = A.resample(pts.length > 2 ? A.spline(pts, false, 3) : pts, 3, false), n = path.length;
    const nrm = [];
    for (let i = 0; i < n; i++) { const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; nrm.push([-ty / l, tx / l]); }
    const kw = A.rnd() * 40;
    const wid = i => w * (topK + (1 - topK) * Math.pow(i / (n - 1), 0.8)) * (0.82 + 0.36 * A.noise1(i * 0.11 + kw, 85));   // the fall swells and narrows
    const lane = (u, i0, i1, amp) => {                    // one thread of water, u in -0.5..0.5 across the fall
      const out = [], ph = A.rnd() * 20;
      for (let i = i0; i <= i1; i++) { const d = u * wid(i) + (A.noise1(i * 0.16 + ph, 83) - 0.5) * 2 * amp; out.push([path[i][0] + nrm[i][0] * d, path[i][1] + nrm[i][1] * d]); }
      return out;
    };
    // body of the fall: threads of pale blue pulled downward; the outer ones start late and break off early
    const nb = Math.max(4, Math.round(w / 1.6));
    for (let k = 0; k < nb; k++) {
      const u = (k + 0.5) / nb - 0.5 + rr(-0.03, 0.03), outer = Math.abs(u) > 0.3;
      const i0 = outer ? A.ri(0, Math.round(n * 0.12)) : A.ri(0, 1), i1 = n - 1 - (outer ? A.ri(0, Math.round(n * 0.1)) : 0);
      if (i1 - i0 < 2) continue;
      A.stroke(lane(u, i0, i1, 0.7), 'pastel', A.pick(['ice', 'ice', 'sky', '#b9d3dc']), { w: rr(2.4, 3.6), p: 1, reach: 1.6, aspect: 1, tin: 0.02, tout: 0.05 });
    }
    // white threads over it, broken, of uneven weight
    const nw = Math.max(5, Math.round(w / 1.5));
    for (let k = 0; k < nw; k++) {
      const u = rr(-0.5, 0.5); let i = A.ri(0, Math.round(n * 0.18));
      while (i < n - 3) {
        const j = Math.min(n - 1, i + A.ri(Math.round(n * 0.1) + 3, Math.round(n * 0.42) + 4));
        A.stroke(lane(u, i, j, 1.2), 'chalk', 'khadi', { w: rr(1.0, 2.6), p: rr(0.65, 1), tin: 0.2, tout: 0.35 });
        i = j + A.ri(1, 5);
      }
    }
    // shadow threads between them, and a broken pencil edge
    for (let k = Math.max(3, Math.round(w / 3.2)); k > 0; k--) {
      const u = rr(-0.46, 0.46), i0 = A.ri(0, Math.round(n * 0.5)), i1 = Math.min(n - 1, i0 + A.ri(Math.round(n * 0.15) + 2, Math.round(n * 0.45) + 3));
      A.stroke(lane(u, i0, i1, 0.8), 'pencil', A.pick(['slate', 'storm', 'lapis']), { w: rr(0.7, 1.1), p: rr(0.45, 0.8), tin: 0.2, tout: 0.3 });
    }
    for (const u of [-0.53, 0.53]) {
      let i = A.ri(0, 3);
      while (i < n - 3) { const j = Math.min(n - 1, i + A.ri(5, 14)); A.stroke(lane(u, i, j, 1.0), 'pencil', 'slate', { w: 0.9, p: rr(0.45, 0.75), tin: 0.2, tout: 0.3 }); i = j + A.ri(1, 4); }
    }
    // the lip where it leaves the rock
    A.stroke(lane(0, 0, 0, 0).concat([[path[0][0] + nrm[0][0] * wid(0) * 0.5, path[0][1] + nrm[0][1] * wid(0) * 0.5]]).reverse().concat([[path[0][0] - nrm[0][0] * wid(0) * 0.5, path[0][1] - nrm[0][1] * wid(0) * 0.5]]), 'chalk', 'khadi', { w: 2.2, p: 0.95, tin: 0.1, tout: 0.1 });
    // spray thrown off the edges, thicker at every bend and near the foot
    for (let i = 1; i < n - 1; i++) {
      const bendAmt = Math.abs(nrm[i + 1][0] - nrm[i - 1][0]) + Math.abs(nrm[i + 1][1] - nrm[i - 1][1]);
      const cnt = (0.3 + bendAmt * 6 + (i > n * 0.8 ? 1.4 : 0)) * sprayK * (w / 16);
      for (let k = 0; k < cnt; k++) if (A.chance(Math.min(1, cnt - k))) {
        const sgn = A.chance(0.5) ? 1 : -1, d = sgn * (wid(i) * 0.5 + Math.abs(A.gauss()) * (2.5 + w * 0.18));
        A.dot(path[i][0] + nrm[i][0] * d, path[i][1] + nrm[i][1] * d + rr(-2, 2), 'chalk', A.chance(0.8) ? 'khadi' : 'ice', { w: rr(0.9, 2.1), len: rr(0.1, 0.9), p: rr(0.6, 1) });
      }
    }
    // where it lands: a broken patch of froth, a fan of curls, rings spreading out, a burst of drops
    if (o.foot !== false) {
      const f = path[n - 1], fw = w * 1.1;
      A.withMask(A.roughen(A.ellipse(f[0], f[1] + w * 0.1, fw * 1.05, w * 0.3), 2.6, 7, true), () => {
        for (let k = Math.round(fw / 1.2); k > 0; k--) { const x = f[0] + rr(-1, 1) * fw, y = f[1] + w * 0.1 + rr(-1, 1) * w * 0.28, l = rr(3, 9); A.stroke([[x - l, y + rr(-1, 1)], [x + l, y + rr(-1, 1)]], 'chalk', A.pick(['ice', 'khadi', 'khadi', 'sky']), { w: rr(1.6, 3), p: rr(0.6, 1) }); }
      });
      const nc = Math.max(6, Math.round(w / 2.4));
      for (let k = 0; k < nc; k++) {
        const u = (k + 0.5) / nc - 0.5 + rr(-0.06, 0.06), bx = f[0] + u * fw * 2.0, by = f[1] + w * 0.12 + (1 - Math.abs(u) * 2) * w * 0.12 + rr(-2.5, 2.5), r = rr(2.4, 4.8) * (w > 20 ? 1.25 : 1);
        const dir = u < 0 ? -1 : 1, curl = [];
        for (let t = 0; t <= 9; t++) { const a = PI * 0.95 + t / 9 * PI * 1.5, q = r * (1 - t / 13); curl.push([bx + dir * Math.cos(a) * q, by + Math.sin(a) * q * 0.8]); }
        A.stroke(curl, 'chalk', 'khadi', { w: rr(1.3, 2.1), p: rr(0.8, 1), tin: 0.1, tout: 0.3, wob: 0.3 });
        A.stroke(curl.slice(0, 6).map(p => [p[0], p[1] + 1.5]), 'pencil', 'slate', { w: 0.7, p: 0.55 });
      }
      for (let k = 0; k < 3; k++) {
        const rad = fw * (1.35 + k * 0.45);
        for (const seg of [[rr(0.1, 0.4), rr(1.2, 1.5)], [rr(1.7, 1.9), PI - rr(0.1, 0.4)]]) A.stroke(A.ellipse(f[0] + rr(-2, 2), f[1] + w * 0.16, rad, rad * 0.3, 0, seg[0], seg[1]), 'chalk', A.pick(['khadi', 'ice', 'sky']), { w: 1.5 - k * 0.25, p: 0.9 - k * 0.2, tin: 0.2, tout: 0.25 });
      }
      for (let k = Math.round(16 * sprayK * w / 16); k > 0; k--) A.dot(f[0] + A.gauss() * fw * 0.75, f[1] + w * 0.05 - Math.abs(A.gauss()) * w * 0.5, 'chalk', 'khadi', { w: rr(0.9, 2.3), len: 0.2 });
    }
    return { foot: path[n - 1], head: path[0] };
  };

  // ------------------------------------------------------------ DRIED LAKE BED
  function clipHalf(poly, px, py, qx, qy) {
    const mx = (px + qx) / 2, my = (py + qy) / 2, nx = qx - px, ny = qy - py, out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const da = (a[0] - mx) * nx + (a[1] - my) * ny, db = (b[0] - mx) * nx + (b[1] - my) * ny;
      if (da <= 0) out.push(a);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    return out;
  }

  /* M.crackedBed(A, polygon, o) - parched mud: plates divided by cracks.
     o: c ('sand'), c2 ('cream'), size (36, plate width), squash (0.7, plates flatten with distance), pebbles (1 = amount),
        ground (false = draw only the cracks over what is already there)
     returns {plates:[[x,y]...]} centres of the plates */
  M.crackedBed = function (A, poly, o) {
    o = o || {};
    const rr = A.rr, size = o.size || 36, sq = o.squash != null ? o.squash : 0.7;
    let rp = poly;
    if (o.ground !== false) rp = A.ground(poly, o.c || 'sand', { w: 30, ang: rr(-0.2, -0.05), c2: o.c2 || 'cream', top: 0.6, edge: o.edge != null ? o.edge : 2 })[0];
    const bb = A.bbox([rp]), sx = size, sy = size * sq;
    const gx0 = Math.floor(bb[0] / sx) - 2, gx1 = Math.ceil(bb[2] / sx) + 2, gy0 = Math.floor(bb[1] / sy) - 2, gy1 = Math.ceil(bb[3] / sy) + 2;
    const seeds = new Map(), key = (i, j) => i + ',' + j;
    for (let j = gy0; j <= gy1; j++) for (let i = gx0; i <= gx1; i++) seeds.set(key(i, j), [(i + 0.5 + rr(-0.42, 0.42) + (j % 2 ? 0.25 : -0.25)) * sx, (j + 0.5 + rr(-0.4, 0.4)) * sy]);
    A.pushMask(rp);
    const plates = [];
    for (let j = gy0 + 2; j <= gy1 - 2; j++) for (let i = gx0 + 2; i <= gx1 - 2; i++) {
      const p = seeds.get(key(i, j));
      if (!A.inside(rp, p[0], p[1]) && !A.inside(rp, p[0] + sx * 0.5, p[1]) && !A.inside(rp, p[0] - sx * 0.5, p[1]) && !A.inside(rp, p[0], p[1] + sy * 0.5) && !A.inside(rp, p[0], p[1] - sy * 0.5)) continue;
      let cell = [[p[0] - sx * 2.4, p[1] - sy * 2.4], [p[0] + sx * 2.4, p[1] - sy * 2.4], [p[0] + sx * 2.4, p[1] + sy * 2.4], [p[0] - sx * 2.4, p[1] + sy * 2.4]];
      for (let dj = -2; dj <= 2 && cell.length > 2; dj++) for (let di = -2; di <= 2; di++) {
        if (!di && !dj) continue; const q = seeds.get(key(i + di, j + dj)); if (!q) continue;
        cell = clipHalf(cell, p[0], p[1], q[0], q[1]); if (cell.length < 3) break;
      }
      if (cell.length < 3) continue;
      const cen = centroid(cell), g = rr(1.1, 2.4);
      // the crack itself: a soft dark seam along the true cell edge
      A.outline(cell, 'shade', 'umber', { closed: true, w: rr(2.0, 3.0), p: rr(0.4, 0.62), pull: 30, again: 0 });
      // the plate, pulled a little in from the crack, its corners worn
      const inner = cell.map(v => { const dx = cen[0] - v[0], dy = cen[1] - v[1], l = Math.hypot(dx, dy) || 1; return [v[0] + dx / l * g * 1.6, v[1] + dy / l * g * 1.6]; });
      const plate = A.roughen(inner, rr(0.5, 1.1), 9, true);
      if (A.chance(0.34)) A.fill(plate, 'side', A.pick(['cream', 'peach', 'khadi', 'sand', '#dcc79c']), { w: 12, p: rr(0.3, 0.5), passes: 1, reach: 1.0, ang: rr(-0.5, 0.1) });
      A.outline(plate.map(v => [v[0] + 0.2, v[1] + 0.2]), 'pencil', 'sepia', { closed: true, w: rr(0.8, 1.1), p: rr(0.6, 0.85), pull: 28, again: 0.2 });
      // curled lips: light on the upper-left edges, a hatched shadow under the lower-right ones
      if (A.chance(0.42)) {
        const m = plate.length;
        for (let k = 0; k < m; k++) {
          const a = plate[k], b = plate[(k + 1) % m], ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1;
          const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ox = mx - cen[0], oy = my - cen[1], ol = Math.hypot(ox, oy) || 1;
          const face = (ox / ol) * 0.6 + (oy / ol) * 0.8;         // > 0 : edge faces down-right
          if (face > 0.45 && A.chance(0.6)) { const hl = rr(2.5, 6); A.stroke([[mx, my], [mx - ox / ol * hl, my - oy / ol * hl]], 'pencil', 'umber', { w: rr(0.8, 1.2), p: rr(0.4, 0.7), tin: 0, tout: 0.6 }); }
          if (face < -0.5 && A.chance(0.35)) A.stroke([[a[0] - ox / ol * 1.6, a[1] - oy / ol * 1.6], [b[0] - ox / ol * 1.6, b[1] - oy / ol * 1.6]], 'chalk', 'khadi', { w: 1.2, p: rr(0.4, 0.7), tin: 0.3, tout: 0.3 });
        }
      }
      // a hairline crack creeping into the plate
      if (A.chance(0.3)) {
        const v = cell[A.ri(0, cell.length - 1)], w2 = cell[A.ri(0, cell.length - 1)], s0 = [(v[0] + w2[0]) / 2, (v[1] + w2[1]) / 2], t = rr(0.35, 0.7);
        A.stroke([s0, [s0[0] + (cen[0] - s0[0]) * t * 0.5 + rr(-2, 2), s0[1] + (cen[1] - s0[1]) * t * 0.5 + rr(-2, 2)], [s0[0] + (cen[0] - s0[0]) * t, s0[1] + (cen[1] - s0[1]) * t]], 'pencil', 'sepia', { w: 0.7, p: rr(0.4, 0.7), tin: 0, tout: 0.6 });
      }
      plates.push(cen);
    }
    // pebbles
    const np = Math.round((bb[2] - bb[0]) * (bb[3] - bb[1]) / 7000 * (o.pebbles != null ? o.pebbles : 1));
    for (let k = 0; k < np; k++) {
      const x = rr(bb[0], bb[2]), y = rr(bb[1], bb[3]); if (!A.inside(rp, x, y)) continue;
      const r = rr(2.2, 5.5), el = A.roughen(A.ellipse(x, y, r, r * rr(0.55, 0.75), rr(-0.3, 0.3)), 0.5, 6, true);
      A.stroke([[x - r, y + r * 0.7], [x + r * 1.5, y + r * 0.75]], 'pencil', 'umber', { w: 1.2, p: 0.5 });
      A.shape(el, { c: A.pick(['stone', 'stone', 'grey', 'sand', 'ochre', 'khadi', 'pinkrock']), w: 3, rough: 0, line: 'sepia', lineTool: 'pencil', lw: 0.8, off: 0.3 });
      A.dot(x - r * 0.3, y - r * 0.2, 'chalk', 'khadi', { w: 1.1, len: 0.3 });
    }
    A.popMask();
    return { plates };
  };
})();
