(function () {
  'use strict';
  /* ==========================================================================
     FLORA  -  trees, shrubs, ground plants in the Mewar manner.
       M.tree(A, x, y, h, kind, o)      x,y = centre of the trunk base, h = total height
       M.shrub(A, x, y, s, kind, o)     x,y = centre of the base, s = width
       M.tuft(A, x, y, s, kind, o)      x,y = base, s = height
       M.tuftRow(A, pts, o)             a varied row of tufts along a polyline
       M.starFlowers(A, poly, spacing, o)
     ======================================================================== */
  const PI = Math.PI, TAU = PI * 2;

  function tools(A) {
    if (A._fl) return A._fl;
    return (A._fl = {
      // a pressed dab of the stick's edge: swells in the middle, points at both ends
      leaf: A.tool('chalk', { wmin: 0.12, t0: 0.3, tin: 0.42, tout: 0.5, hard: 3.2, streak: 0.12, wob: 0.35, reach: 1.3 }),
      // the sharpened corner of a stick: thin opaque line, for light on dark
      fine: A.tool('chalk', { w: 1.1, wmin: 0.5, streak: 0, wob: 0.45, hard: 2.0, reach: 1.3, tin: 0.06, tout: 0.32, t0: 0.3 })
    });
  }

  // ------------------------------------------------------------------ palettes
  function pal(A, kind, o) {
    const z = o.zone || 'B', mix = A.mix;
    let P;
    if (z === 'A') {
      P = { c: mix('moss', 'umber', 0.2), dark: mix('moss', 'kajal', 0.5), mid: 'olive', leaf: mix('olive', 'sand', 0.35), leaf2: 'ochre', accent: 'brick', trunk: 'sand', bark: 'umber', line: 'sepia', dens: 0.74,
        puffs: ['sand', 'ochre', 'pinkrock', 'cream'], blooms: ['sand', 'pinkrock', 'cream'] };
      const K = {
        dotted: { c: mix('moss', 'umber', 0.3), leaf: 'sand', leaf2: 'sage' },
        scale: { c: mix('moss', 'kajal', 0.35), leaf: 'ochre', leaf2: 'olive' },
        radiate: { c: 'olive', dark: 'moss', leaf: mix('leaf', 'sand', 0.5), leaf2: 'ochre' },
        lens: { c: 'moss', leaf: 'olive', leaf2: mix('sage', 'sand', 0.4), accent: 'ochre' },
        bell: { c: mix('moss', 'kajal', 0.3), leaf: 'olive', leaf2: 'brick', accent: 'sand' },
        weeping: { c: 'moss', leaf: 'sage', leaf2: 'sand' },
        cypress: { c: mix('moss', 'kajal', 0.4), leaf: 'olive', leaf2: 'sage' },
        plantain: { c: 'olive', leaf: mix('leaf', 'sand', 0.45), leaf2: 'ochre', trunk: mix('sand', 'olive', 0.2), accent: 'brick' },
        palm: { c: 'moss', leaf: 'olive', leaf2: mix('olive', 'sand', 0.5), accent: 'ochre', trunk: 'pinkrock' },
        blossom: { trunk: 'umber', bark: 'kajal' },
        bare: { trunk: mix('umber', 'sand', 0.25), bark: 'kajal', leaf: 'ochre' }
      }[kind];
      if (K) Object.assign(P, K);
    } else if (z === 'C') {
      P = { c: mix('bottle', 'night', 0.5), dark: mix('night', 'kajal', 0.4), mid: 'teal', leaf: 'sky', leaf2: 'khadi', accent: 'gold', trunk: mix('stone', 'slate', 0.4), bark: 'night', line: 'kajal', dens: 0.92,
        puffs: ['khadi', 'ice', 'lilac', 'sky'], blooms: ['khadi', 'ice', 'lilac'] };
      const K = {
        dotted: { c: mix('neel', 'night', 0.45), leaf: 'ice', leaf2: 'sky' },
        scale: { c: mix('bottle', 'night', 0.6), leaf: 'verdigris', leaf2: 'sky' },
        radiate: { c: mix('teal', 'night', 0.55), leaf: 'verdigris', leaf2: 'ice' },
        lens: { c: mix('bottle', 'night', 0.55), leaf: mix('teal', 'sky', 0.3), leaf2: 'aqua' },
        bell: { c: mix('bottle', 'night', 0.6), leaf: 'teal', leaf2: 'plum', accent: 'gold' },
        weeping: { c: mix('bottle', 'night', 0.5), leaf: 'aqua', leaf2: 'ice' },
        cypress: { c: mix('bottle', 'night', 0.62), leaf: mix('teal', 'malachite', 0.4), leaf2: 'verdigris', accent: 'khadi' },
        plantain: { c: mix('teal', 'night', 0.35), leaf: mix('verdigris', 'slate', 0.3), leaf2: 'ice', trunk: mix('sage', 'slate', 0.4), accent: 'plum' },
        palm: { c: mix('bottle', 'night', 0.5), leaf: 'teal', leaf2: 'aqua', trunk: mix('stone', 'lilac', 0.4) },
        blossom: { trunk: mix('night', 'umber', 0.3), bark: 'kajal' }
      }[kind];
      if (K) Object.assign(P, K);
    } else {
      P = { c: 'bottle', dark: mix('bottle', 'kajal', 0.5), mid: 'malachite', leaf: 'leaf', leaf2: 'haldi', accent: 'sindoor', trunk: A.pick(['gulabi', 'pinkrock', 'gulabi', 'peach']), bark: 'sepia', line: 'kajal', dens: 1,
        puffs: ['khadi', 'haldi', 'saffron', 'rose', 'sindoor', 'cream'], blooms: ['rose', 'gulabi', 'khadi'] };
      const K = {
        dotted: { c: 'neel', mid: 'lapis', leaf: 'khadi', leaf2: 'sky', trunk: 'khadi' },
        scale: { c: mix('bottle', 'kajal', 0.4), leaf: 'haldi', leaf2: 'leaf' },
        radiate: { c: mix('sap', 'bottle', 0.55), dark: 'bottle', leaf: 'leaf', leaf2: 'haldi', accent: 'rose', trunk: 'pinkrock' },
        lens: { c: 'bottle', leaf: 'sap', leaf2: 'leaf', accent: 'saffron', trunk: 'pinkrock' },
        bell: { c: mix('bottle', 'kajal', 0.25), leaf: 'sap', leaf2: 'hingul', accent: 'haldi' },
        weeping: { c: mix('malachite', 'bottle', 0.6), leaf: 'leaf', leaf2: 'verdigris', accent: 'khadi', trunk: 'khadi' },
        cypress: { c: mix('bottle', 'kajal', 0.25), leaf: 'malachite', leaf2: 'sap', accent: 'rose' },
        plantain: { c: 'sap', leaf: 'leaf', leaf2: 'haldi', trunk: mix('cream', 'leaf', 0.3), accent: 'lac' },
        palm: { c: 'bottle', leaf: 'sap', leaf2: 'leaf', accent: 'saffron', trunk: 'pinkrock' },
        blossom: { trunk: 'umber', bark: 'kajal', accent: 'crimson' }
      }[kind];
      if (K) Object.assign(P, K);
    }
    for (const k of ['c', 'dark', 'mid', 'leaf', 'leaf2', 'accent', 'trunk', 'bark', 'puffs', 'blooms']) if (o[k] && !(k === 'puffs' && typeof o[k] === 'number')) P[k] = o[k];
    if (o.dens) P.dens = o.dens;
    P.zone = z;
    return P;
  }
  function accent(A, x, y, w, P, c) {
    c = c || P.accent;
    if (c === 'gold') A.dot(x, y, 'gold', 'gold', { w: w * 0.9 }); else A.dot(x, y, 'chalk', c, { w, reach: 1.3 });
  }

  // ------------------------------------------------------------------ geometry
  function sides(cl, w0, w1, flare) {
    const n = cl.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = cl[Math.max(0, i - 1)], b = cl[Math.min(n - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const t = i / (n - 1);
      let w = typeof w0 === 'function' ? w0(t) : w0 + (w1 - w0) * t;
      if (flare) w += flare * Math.pow(1 - t, 7);
      L.push([cl[i][0] + nx * w, cl[i][1] + ny * w]); R.push([cl[i][0] - nx * w, cl[i][1] - ny * w]);
    }
    return { L, R };
  }
  function ribbon(cl, w0, w1, flare) { const s = sides(cl, w0, w1, flare); return s.L.concat(s.R.reverse()); }

  // closed canopy outline, clockwise from the top.  point: narrow top, flat: flattened base, lobes/lob: scallops
  function mound(A, cx, cy, rx, ry, m) {
    m = m || {};
    const n = 110, pts = [], ph = A.rr(0, TAU), k = A.rr(0, 500);
    const point = m.point || 0, flat = m.flat || 0, lob = m.lob || 0, lobes = m.lobes || 0, wob = m.wob != null ? m.wob : 0.05;
    for (let i = 0; i < n; i++) {
      const t = i / n * TAU, sx = Math.sin(t); let py = -Math.cos(t);
      const u = (py + 1) / 2;
      const f = (1 - point) + point * Math.min(1, Math.pow(u * 1.4, 0.85));
      if (py > 0) py *= 1 - flat * 0.5;
      let rad = 1 + wob * (A.noise2(Math.cos(t) * 1.6 + k, Math.sin(t) * 1.6 + k, 3) - 0.5) * 2;
      if (lobes) rad += lob * (Math.abs(Math.sin(lobes * t / 2 + ph)) - 0.62);
      pts.push([cx + rx * sx * f * rad, cy + ry * py * rad]);
    }
    return pts;
  }
  function geom(A, x, y, h, o, wide, chf) {
    const lean = ((o.lean || 0) + A.rr(-0.02, 0.02)) * h, w = (o.wide || A.rr(wide[0], wide[1])) * h, ch = h * chf;
    return { cx: x + lean, cy: y - h + ch / 2, rx: w / 2, ry: ch / 2, lean };
  }
  // one pressed leaf, from its stalk end to its tip
  function leaf(A, x, y, ang, len, wid, c, o) {
    o = o || {};
    const b = (o.bend != null ? o.bend : A.rr(-0.2, 0.2)) * len, dx = Math.cos(ang), dy = Math.sin(ang);
    const ex = x + dx * len, ey = y + dy * len;
    A.stroke(A.path().M(x, y).Q(x + dx * len * 0.5 - dy * b, y + dy * len * 0.5 + dx * b, ex, ey).pts, tools(A).leaf, c, { w: wid, p: o.p != null ? o.p : 0.95, cv: o.cv != null ? o.cv : 0.03 });
    return [ex, ey];
  }
  function fine(A, pts, c, w, p) { A.stroke(pts, tools(A).fine, c, { w: w || 1.1, p: p != null ? p : 0.92 }); }
  function seg(A, x1, y1, x2, y2, c, w, p) { fine(A, [[x1, y1], [(x1 + x2) / 2 + A.rr(-0.3, 0.3), (y1 + y2) / 2 + A.rr(-0.3, 0.3)], [x2, y2]], c, w, p); }
  // five (or n) petals round a centre
  function bloom(A, x, y, r, c, eye, n) {
    n = n || 5; const a0 = A.rr(0, TAU);
    for (let k = 0; k < n; k++) { const a = a0 + k * TAU / n + A.rr(-0.15, 0.15); leaf(A, x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2, a, r * A.rr(0.8, 1.05), r * 0.85, c, { bend: 0 }); }
    if (eye) { if (eye === 'gold') A.dot(x, y, 'gold', 'gold', { w: r * 0.5 }); else A.dot(x, y, 'chalk', eye, { w: r * 0.5, reach: 1.3 }); }
  }
  function star(A, x, y, r, c, n, w) {
    const a0 = A.rr(0, TAU);
    for (let k = 0; k < n; k++) { const a = a0 + k * TAU / n + A.rr(-0.2, 0.2), l = r * A.rr(0.75, 1.1); fine(A, [[x + Math.cos(a) * r * 0.15, y + Math.sin(a) * r * 0.15], [x + Math.cos(a) * l, y + Math.sin(a) * l]], c, w || 1.0, 0.95); }
  }
  // little leaves standing out along a canopy rim so the edge is never a cut line
  function fringe(A, rp, c, len, wid, step, maxY) {
    for (const q of A.along(rp.concat([rp[0]]), step, 0.6)) {
      if (maxY != null && q.y > maxY) continue;
      const out = Math.atan2(-Math.cos(q.ang), Math.sin(q.ang));
      leaf(A, q.x - Math.cos(out) * len * 0.5, q.y - Math.sin(out) * len * 0.5, out + A.rr(-0.4, 0.4), len * A.rr(0.75, 1.1), wid * A.rr(0.85, 1.15), c, { bend: 0 });
    }
  }

  // ------------------------------------------------------------------ trunks and limbs
  let NO_TRUNK = false;
  function trunk(A, x, y, tx, ty, w, P, o) {
    o = o || {};
    if (NO_TRUNK) return null;
    w *= 0.86;
    const rr = A.rr, H = y - ty, tw = rr(-1, 1) * w * (o.twist != null ? o.twist : 1.4);
    const cl = A.spline([[x, y], [x + (tx - x) * 0.3 + tw, y - H * 0.36], [x + (tx - x) * 0.72 - tw * 0.8, y - H * 0.7], [tx, ty]], false, 2.5);
    const sd = sides(cl, w, w * (o.taper || 0.6), w * 0.95);
    const poly = sd.L.concat(sd.R.slice().reverse());
    A.shape(poly, { c: P.trunk, w: Math.max(2.4, w * 1.2), passes: 2, rough: 0.25, ang: -1.35, reach: 1.5 });
    // a soft shade down one side, bark ticks, then the two long edges
    const sh = sd.R.map((p, i) => [p[0] + (sd.L[i][0] - p[0]) * 0.22, p[1] + (sd.L[i][1] - p[1]) * 0.22]);
    A.stroke(sh, 'shade', P.bark, { w: Math.max(1.4, w * 0.7), p: 0.42 });
    const nt = Math.max(3, Math.round(H / 8));
    for (let i = 0; i < nt; i++) {
      const k = Math.min(cl.length - 2, Math.floor(rr(0.06, 0.94) * cl.length)), a = sd.L[k], b = sd.R[k], f0 = rr(0.05, 0.4), f1 = rr(0.55, 0.95);
      A.stroke([[a[0] + (b[0] - a[0]) * f0, a[1] + (b[1] - a[1]) * f0], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - rr(0.6, 2)], [a[0] + (b[0] - a[0]) * f1, a[1] + (b[1] - a[1]) * f1 - rr(0, 1.5)]], 'pencil', P.bark, { w: 0.8, p: rr(0.4, 0.75) });
    }
    A.outline(sd.L, 'pencil', P.bark, { w: 1.0, p: 0.85, again: 0.3 });
    A.outline(sd.R, 'pencil', P.bark, { w: 1.1, p: 0.9, again: 0.3 });
    // root toes
    for (const s of [-1, 1]) A.stroke([[x + s * w * 1.2, y - w * 0.6], [x + s * w * 2.0, y + rr(-0.5, 0.8)], [x + s * w * (2.6 + rr(0, 0.8)), y + rr(0.2, 1.4)]], 'pencil', P.bark, { w: 1.0, p: 0.7 });
    return cl;
  }
  // a branching skeleton: pushes {cl, w0, w1, depth, tip, ang}
  function grow(A, out, px, py, ang, len, w, depth, maxD, G) {
    const rr = A.rr, n = 4, cp = [[px, py]]; let a = ang, x = px, y = py;
    for (let i = 1; i <= n; i++) {
      a += rr(-1, 1) * G.gnarl + (G.up ? (-PI / 2 - a) * G.up : 0);
      x += Math.cos(a) * len / n; y += Math.sin(a) * len / n; cp.push([x, y]);
    }
    const w1 = w * G.shrink;
    out.push({ cl: A.spline(cp, false, 2.2), w0: w, w1, depth, tip: [x, y], ang: a });
    if (depth >= maxD) return;
    const nc = (depth === 0 && G.three) || A.chance(0.22) ? 3 : 2;
    for (let k = 0; k < nc; k++) {
      const off = (nc === 2 ? (k ? 1 : -1) * rr(0.55, 1.05) : (k - 1) * rr(0.8, 1.15)) * G.spread * 0.5 + rr(-0.12, 0.12);
      grow(A, out, x, y, a + off, len * rr(0.62, 0.8), w1 * (nc === 2 ? 0.9 : 0.78), depth + 1, maxD, G);
    }
  }
  function drawLimbs(A, limbs, P, o) {
    o = o || {};
    limbs.sort((a, b) => b.w0 - a.w0);
    const thick = limbs.filter(l => l.w0 >= 1.0);
    for (const l of thick) { l.sd = sides(l.cl, l.w0, l.w1, l.flare || 0); A.fill(l.sd.L.concat(l.sd.R.slice().reverse()), 'pastel', P.trunk, { w: Math.max(2.2, l.w0 * 1.5), passes: 2, reach: 1.5, p: 1, ang: l.ang + A.rr(-0.2, 0.2), soft: 0 }); }
    for (const l of thick) {
      if (o.light && l.w0 > 1.8) A.stroke(l.sd.L.map((p, i) => [p[0] + (l.sd.R[i][0] - p[0]) * 0.3, p[1] + (l.sd.R[i][1] - p[1]) * 0.3]), tools(A).fine, o.light, { w: Math.max(0.9, l.w0 * 0.45), p: 0.7 });
      A.outline(l.sd.L, 'pencil', P.bark, { w: 0.95, p: 0.85, again: 0.25 });
      A.outline(l.sd.R, 'kajal', P.bark, { w: 1.1, p: 0.85, again: 0.25 });
    }
    for (const l of limbs) if (l.w0 < 1.0) A.stroke(l.cl, 'kajal', P.bark, { w: Math.max(0.8, l.w0 * 2), p: 0.85, tout: 0.5 });
  }

  // ------------------------------------------------------------------ the species
  const KIND = {};

  // dark mound, rosettes of leaf sprigs tipped with dots
  KIND.dotted = function (A, x, y, h, P, o) {
    const rr = A.rr, g = geom(A, x, y, h, o, [0.6, 0.72], rr(0.66, 0.72));
    trunk(A, x, y, g.cx, g.cy + g.ry * 0.45, h * 0.034, P);
    const cp = mound(A, g.cx, g.cy, g.rx, g.ry, { point: 0.34, lobes: A.ri(9, 13), lob: 0.085, flat: 0.45 });
    const rp = A.shape(cp, { c: P.c, w: 9, passes: 2, rough: 0.7, ang: rr(-1.1, -0.5) });
    fringe(A, rp, A.mix(P.c, P.mid, 0.3), h * 0.024, 3.4, h * 0.02, g.cy + g.ry * 0.3);
    const sp = h * 0.061 / P.dens;
    // a quiet second pattern under the sprigs
    for (const p of A.scatter(rp, sp * 0.8, { jit: 0.5 })) A.dot(p[0], p[1], 'chalk', A.mix(P.c, P.mid, rr(0.4, 0.8)), { w: rr(1.2, 2.2), p: 0.8 });
    for (const p of A.scatter(rp, sp, { margin: h * 0.012, jit: 0.3 })) {
      const n = A.ri(5, 7), r = sp * rr(0.42, 0.52), a0 = -PI / 2 + rr(-0.6, 0.6), spread = rr(2.4, 3.3), lc = A.chance(0.16) ? P.leaf2 : P.leaf;
      for (let k = 0; k < n; k++) {
        const a = a0 + (k / (n - 1) - 0.5) * spread + rr(-0.1, 0.1), l = r * rr(0.8, 1.1) * (1 - 0.25 * Math.abs(k / (n - 1) - 0.5));
        const tip = leaf(A, p[0], p[1], a, l, r * 0.4, lc);
        if (A.chance(0.7)) A.dot(tip[0] + Math.cos(a) * 2.0, tip[1] + Math.sin(a) * 2.0, 'chalk', P.leaf2, { w: rr(1.1, 1.6), reach: 1.3 });
      }
      accent(A, p[0], p[1] + r * 0.12, rr(1.5, 2.1), P);
    }
    A.outline(rp, 'kajal', P.line, { closed: true, w: 1.1, p: 0.7 });
    return g;
  };

  // overlapping scales, each with its arc and eye, like a peacock's train
  KIND.scale = function (A, x, y, h, P, o) {
    const rr = A.rr, T = tools(A), g = geom(A, x, y, h, o, [0.56, 0.66], rr(0.7, 0.76));
    trunk(A, x, y, g.cx, g.cy + g.ry * 0.5, h * 0.032, P);
    const cp = mound(A, g.cx, g.cy, g.rx, g.ry, { point: 0.5, flat: 0.4, wob: 0.04, lobes: A.ri(15, 19), lob: 0.05 });
    const rp = A.shape(cp, { c: P.c, w: 9, passes: 2, rough: 0.6, ang: rr(-1.1, -0.5) });
    const s = h * rr(0.08, 0.092) / Math.sqrt(P.dens), list = [];
    let row = 0;
    for (let yy = g.cy - g.ry + s * 0.45; yy < g.cy + g.ry; yy += s * 0.6, row++)
      for (let xx = g.cx - g.rx - (row % 2 ? s * 0.5 : 0); xx < g.cx + g.rx + s; xx += s) {
        const px = xx + rr(-0.1, 0.1) * s, py = yy + rr(-0.08, 0.08) * s;
        if (A.inside(rp, px, py - s * 0.15)) list.push([px, py, row]);
      }
    A.pushMask(rp);
    for (const q of list) {
      const r = s * rr(0.5, 0.58), cy = q[1] + r * 0.25, dc = (q[2] % 2 === 0) !== A.chance(0.15) ? A.mix(P.c, P.mid, rr(0.45, 0.7)) : A.mix(P.c, P.dark, rr(0.1, 0.4));
      A.dot(q[0], cy, 'pastel', dc, { w: r * 2.0, len: r * 0.1, p: 1, reach: 1.5 });
      const arc = A.ellipse(q[0], cy, r * 0.96, r, 0, PI * 1.05, PI * 1.95);
      if (o.gold) A.stroke(arc, 'gold', 'gold', { w: 1.7, wob: 2 }); else A.stroke(arc, T.fine, P.leaf, { w: rr(1.5, 2.0), p: 0.95, wob: 2 });
      A.stroke(A.ellipse(q[0] + rr(-0.4, 0.4), cy, r * 0.68, r * 0.7, 0, PI * 1.1, PI * 1.9), T.fine, A.mix(P.leaf, P.leaf2, 0.6), { w: 0.85, p: 0.85, wob: 2 });
      const ex = q[0] + rr(-0.5, 0.5), ey = cy - r * 0.3;
      for (let k = -1; k <= 1; k++) { const a = -PI / 2 + k * rr(0.5, 0.7); seg(A, ex + Math.cos(a) * r * 0.25, ey + Math.sin(a) * r * 0.25, ex + Math.cos(a) * r * 0.62, ey + Math.sin(a) * r * 0.62, P.leaf2, 0.8, 0.8); }
      accent(A, ex, ey, rr(1.9, 2.5), P);
      A.dot(ex, ey, 'chalk', P.zone === 'C' ? 'night' : 'neel', { w: 0.9 });
    }
    A.popMask();
    A.outline(rp, 'kajal', P.line, { closed: true, w: 1.15, p: 0.75 });
    return g;
  };

  // a tall teardrop thatched with fans of fine strokes
  KIND.radiate = function (A, x, y, h, P, o) {
    const rr = A.rr, g = geom(A, x, y, h, o, [0.5, 0.6], rr(0.72, 0.78));
    trunk(A, x, y, g.cx, g.cy + g.ry * 0.55, h * 0.03, P);
    const cp = mound(A, g.cx, g.cy, g.rx, g.ry, { point: 0.62, flat: 0.3, wob: 0.045 });
    const rp = A.shape(cp, { c: P.c, w: 9, passes: 2, rough: 1.2, ang: rr(-1.2, -0.6) });
    const sp = h * 0.062 / P.dens, root = [g.cx, g.cy + g.ry * 0.82];
    const pts = A.scatter(rp, sp, { jit: 0.34 });
    for (const q of A.along(rp.concat([rp[0]]), sp * 0.85, 0.8)) if (q.y < g.cy + g.ry * 0.55) pts.push([q.x, q.y]);
    pts.sort((a, b) => Math.hypot(b[0] - root[0], b[1] - root[1]) - Math.hypot(a[0] - root[0], a[1] - root[1]));
    for (const p of pts) {
      const a = Math.atan2(p[1] - root[1], p[0] - root[0]) * 0.75 + (-PI / 2) * 0.25 + rr(-0.15, 0.15), L = sp * rr(1.1, 1.45);
      const bx = p[0] - Math.cos(a) * L * 0.45, by = p[1] - Math.sin(a) * L * 0.45;
      for (let k = 0; k < 3; k++) { const aa = a + (k - 1) * 0.5; seg(A, bx, by, bx + Math.cos(aa) * L * 0.5, by + Math.sin(aa) * L * 0.5, P.dark, 1.7, 0.85); }
      const n = A.ri(9, 13), spread = rr(1.15, 1.5), yel = A.chance(0.12), tc = A.chance(0.3) ? A.mix(P.leaf, P.c, rr(0.25, 0.5)) : P.leaf;
      for (let k = 0; k < n; k++) {
        const u = k / (n - 1) - 0.5, aa = a + u * spread + rr(-0.05, 0.05), l = L * (1 - 0.55 * u * u) * rr(0.85, 1.05);
        const ex = bx + Math.cos(aa) * l, ey = by + Math.sin(aa) * l;
        fine(A, [[bx + Math.cos(aa) * L * 0.12, by + Math.sin(aa) * L * 0.12], [bx + Math.cos(aa + u * 0.2) * l * 0.55, by + Math.sin(aa + u * 0.2) * l * 0.55], [ex, ey]], yel || A.chance(0.08) ? P.leaf2 : tc, rr(0.8, 1.15), 0.95);
      }
      if (A.chance(0.12 * P.dens)) accent(A, bx + Math.cos(a) * L * 0.2, by + Math.sin(a) * L * 0.2, rr(1.6, 2.2), P);
    }
    return g;
  };

  // rows of drooping almond leaves, each with its midrib; a few hanging fruit
  KIND.lens = function (A, x, y, h, P, o) {
    const rr = A.rr, g = geom(A, x, y, h, o, [0.7, 0.84], rr(0.66, 0.72));
    trunk(A, x, y, g.cx, g.cy + g.ry * 0.4, h * 0.04, P);
    const cp = mound(A, g.cx, g.cy, g.rx, g.ry, { point: 0.18, lobes: A.ri(5, 7), lob: 0.1, flat: 0.5 });
    const rp = A.shape(cp, { c: P.c, w: 10, passes: 2, rough: 1.0, ang: rr(-1.1, -0.5) });
    const L = h * 0.085, hub = [g.cx, g.cy - g.ry * 0.75];
    const pts = A.scatter(rp, L * 0.56 / P.dens, { jit: 0.36 });
    for (const q of A.along(rp.concat([rp[0]]), L * 0.5, 0.5)) pts.push([q.x, q.y]);
    pts.sort((a, b) => b[1] - a[1]);
    const cols = [P.leaf, P.leaf, P.leaf2, A.mix(P.c, P.leaf, 0.55), P.mid];
    for (const p of pts) {
      const a = Math.atan2(p[1] - hub[1], p[0] - hub[0]) * 0.7 + (PI / 2) * 0.3 + rr(-0.3, 0.3), l = L * rr(0.8, 1.15), c = A.pick(cols);
      const bx = p[0] - Math.cos(a) * l * 0.5, by = p[1] - Math.sin(a) * l * 0.5, bend = rr(-0.16, 0.16);
      const tip = leaf(A, bx, by, a, l, l * rr(0.36, 0.44), c, { bend });
      A.stroke(A.path().M(bx, by).Q(bx + Math.cos(a) * l * 0.5 - Math.sin(a) * bend * l, by + Math.sin(a) * l * 0.5 + Math.cos(a) * bend * l, tip[0], tip[1]).pts, 'pencil', P.dark, { w: 0.75, p: 0.75 });
      if (A.chance(0.3)) seg(A, bx + Math.cos(a) * l * 0.2 - Math.sin(a) * l * 0.12, by + Math.sin(a) * l * 0.2 + Math.cos(a) * l * 0.12, tip[0] - Math.cos(a) * l * 0.2 - Math.sin(a) * l * 0.1, tip[1] - Math.sin(a) * l * 0.2 + Math.cos(a) * l * 0.1, A.mix(c, 'khadi', 0.45), 0.8, 0.7);
    }
    // fruit hanging low in the crown
    const nf = Math.round(rr(3, 6) * P.dens);
    for (let i = 0; i < nf; i++) {
      const fx = g.cx + rr(-0.7, 0.7) * g.rx, fy = g.cy + rr(0.0, 0.42) * g.ry, fl = h * rr(0.026, 0.034);
      A.stroke([[fx, fy - fl * 2.2], [fx + rr(-1, 1), fy - fl * 0.8]], 'pencil', P.dark, { w: 0.8 });
      const fr = A.ellipse(fx, fy, fl * 0.62, fl * 0.9, rr(-0.3, 0.3));
      A.shape(fr, { c: P.accent === 'gold' ? 'ochre' : P.accent, w: 2.4, rough: 0.2, line: P.bark, lineTool: 'pencil', lw: 0.8 });
      A.dot(fx - fl * 0.2, fy - fl * 0.3, 'chalk', 'haldi', { w: 1.1 });
    }
    return g;
  };

  // flowering tree: fans of blossom, white, yellow, orange, pink, crowding a dark crown
  KIND.puff = function (A, x, y, h, P, o) {
    const rr = A.rr, g = geom(A, x, y, h, o, [0.72, 0.86], rr(0.66, 0.72));
    const fork = [x + g.lean * 0.4, y - h * rr(0.24, 0.3)];
    trunk(A, x, y, fork[0], fork[1], h * 0.038, P, { taper: 0.85, twist: 0.5 });
    const lim = [];
    for (const s of [-1, 1, 0]) lim.push({ cl: A.spline([fork, [fork[0] + s * g.rx * 0.3, fork[1] - h * 0.1], [g.cx + s * g.rx * rr(0.4, 0.55), g.cy + g.ry * rr(0.1, 0.3)]], false, 2.5), w0: h * 0.022, w1: h * 0.012, ang: -PI / 2 + s * 0.5 });
    drawLimbs(A, lim, P);
    const dk = mound(A, g.cx, g.cy + g.ry * 0.08, g.rx * 0.86, g.ry * 0.84, { point: 0.1, lobes: A.ri(6, 8), lob: 0.12, flat: 0.5 });
    const rp = A.shape(dk, { c: P.c, w: 9, passes: 2, rough: 0.9 });
    for (const p of A.scatter(rp, h * 0.035, { jit: 0.45 })) leaf(A, p[0], p[1], -PI / 2 + rr(-1, 1), h * 0.03, 2.2, A.mix(P.c, P.mid, rr(0.5, 0.9)));
    A.outline(rp, 'kajal', P.line, { closed: true, w: 1.0, p: 0.6 });
    const slots = [[0, -0.52], [-0.52, -0.18], [0.54, -0.22], [-0.2, 0.26], [0.3, 0.22], [0.02, -0.12]];
    const nP = Math.min(slots.length, (typeof o.puffs === 'number' ? o.puffs : 0) || A.ri(4, 6)), cols = P.puffs.slice();
    const pf = slots.slice(0, nP).map(s => ({ x: g.cx + (s[0] + rr(-0.07, 0.07)) * g.rx, y: g.cy + (s[1] + rr(-0.06, 0.06)) * g.ry, r: g.rx * rr(0.4, 0.52) }));
    pf.sort((a, b) => a.y - b.y);
    pf.forEach((q, i) => {
      const pc = cols[(i + (A.ri(0, 9))) % cols.length], deep = A.mix(A.shade(pc, -0.3), 'brick', 0.3);
      const sh = mound(A, q.x, q.y, q.r, q.r * 0.94, { point: 0, lobes: A.ri(10, 14), lob: 0.06, flat: 0.55, wob: 0.03 });
      const sp = A.shape(sh, { c: pc, w: 6, passes: 2, rough: 0.4, ang: rr(-1.3, 1.3) });
      const bx = q.x + rr(-0.08, 0.08) * q.r, by = q.y + q.r * 0.6;
      const n = A.ri(15, 21);
      for (let k = 0; k < n; k++) {
        const a = -PI / 2 + (k / (n - 1) - 0.5) * rr(3.5, 3.9) + rr(-0.04, 0.04), ex = q.x + Math.cos(a) * q.r * 0.9, ey = q.y + Math.sin(a) * q.r * 0.86 * (Math.sin(a) > 0 ? 0.7 : 1);
        A.stroke([[bx + (ex - bx) * 0.12, by + (ey - by) * 0.12], [(bx + ex) / 2 + rr(-0.6, 0.6), (by + ey) / 2 + rr(-0.6, 0.6)], [ex, ey]], 'pencil', deep, { w: 0.85, p: rr(0.6, 0.85) });
        if (A.chance(0.75)) A.dot(ex, ey, 'chalk', A.mix(pc, 'khadi', 0.6), { w: rr(1.3, 1.9), reach: 1.3 });
      }
      A.stroke(A.ellipse(bx, by, q.r * 0.42, q.r * 0.42, 0, PI * 1.08, PI * 1.92), 'pencil', deep, { w: 0.8, p: 0.6 });
      A.dot(bx, by - 1, 'chalk', deep, { w: 2.2 });
      A.outline(sp, 'pencil', P.bark, { closed: true, w: 0.9, p: 0.75 });
    });
    return g;
  };

  // tiers of hanging leaf tassels, green and red by turns
  KIND.bell = function (A, x, y, h, P, o) {
    const rr = A.rr, g = geom(A, x, y, h, o, [0.5, 0.6], rr(0.74, 0.8));
    trunk(A, x, y, g.cx, g.cy + g.ry * 0.6, h * 0.032, P);
    const cp = mound(A, g.cx, g.cy, g.rx, g.ry, { point: 0.6, flat: 0.25, wob: 0.04 });
    const rp = A.shape(cp, { c: P.c, w: 9, passes: 2, rough: 0.8, ang: rr(-1.2, -0.6) });
    const L = h * 0.092 / Math.sqrt(P.dens), Wd = L * 0.95, list = [];
    let row = 0;
    for (let yy = g.cy + g.ry - L * 0.9; yy > g.cy - g.ry - L * 0.2; yy -= L * 0.72, row++)
      for (let xx = g.cx - g.rx - (row % 2 ? Wd * 0.5 : 0); xx < g.cx + g.rx + Wd; xx += Wd) {
        const px = xx + rr(-0.12, 0.12) * Wd, py = yy + rr(-0.1, 0.1) * L;
        if (A.inside(rp, px, py + L * 0.45) || A.inside(rp, px, py + L * 0.1)) list.push([px, py, row]);
      }
    for (const q of list) {
      const red = (q[2] % 2 === 1) !== A.chance(0.12), c = red ? P.leaf2 : P.leaf, dk = A.mix(c, P.dark, 0.6), n = A.ri(5, 6), l = L * rr(0.9, 1.1);
      const sway = rr(-0.18, 0.18);
      for (const k of [0, n - 1, 1, n - 2, 2, 3].slice(0, n)) {
        const u = k / (n - 1) - 0.5, a = PI / 2 + sway + u * rr(1.25, 1.5), ll = l * (1 - 0.32 * Math.abs(u) * 2 * 0.6);
        const tip = leaf(A, q[0] + u * 1.5, q[1], a, ll, l * 0.3, A.vary(c, 0.03), { bend: -u * 0.35 });
        A.stroke([[q[0] + u * 1.5, q[1] + 1], [(q[0] + tip[0]) / 2 - u * 1.2, (q[1] + tip[1]) / 2], tip], 'pencil', dk, { w: 0.7, p: 0.7 });
      }
      A.dot(q[0], q[1], 'chalk', P.accent === 'gold' ? 'ochre' : P.accent, { w: rr(1.6, 2.1), reach: 1.3 });
      if (A.chance(0.3)) accent(A, q[0] + sway * l, q[1] + l * 1.02, 1.3, P);
    }
    return g;
  };

  // arching boughs with curtains of small leaves falling from them
  KIND.weeping = function (A, x, y, h, P, o) {
    const rr = A.rr, g = geom(A, x, y, h, o, [0.78, 0.92], 0.72), top = y - h;
    const K = [g.cx, y - h * rr(0.6, 0.66)];
    trunk(A, x, y, K[0], K[1], h * 0.034, P, { taper: 0.55 });
    // the dark dome under everything: arc above, ragged hem below
    const dome = A.ellipse(g.cx, y - h * 0.58, g.rx * 0.9, h * 0.385, 0, PI, TAU), nh = A.ri(6, 8), hem = [];
    for (let i = 0; i <= nh * 6; i++) { const u = i / (nh * 6), xx = g.cx + g.rx * 0.9 * (1 - 2 * u); hem.push([xx, y - h * 0.58 + h * (0.2 + 0.12 * Math.abs(Math.sin(u * nh * PI)) * (0.6 + 0.6 * A.noise1(u * 7 + x, 9)) - 0.06 * Math.abs(1 - 2 * u))]); }
    const rp = A.shape(dome.concat(hem), { c: P.c, w: 9, passes: 2, rough: 0.9, ang: -1.5 });
    const nb = A.ri(10, 13), us = [];
    for (let i = 0; i < nb; i++) us.push(-1 + 2 * (i + rr(0.2, 0.8)) / nb);
    us.sort((a, b) => Math.abs(b) - Math.abs(a));
    for (const u of us) {
      const tipY = y - h * rr(0.24, 0.42) - Math.abs(u) * h * 0.04;
      const cl = A.spline([K, [g.cx + g.rx * u * 0.45, top + h * (0.04 + 0.1 * Math.abs(u)) + rr(0, 4)], [g.cx + g.rx * u * 0.9, top + h * (0.2 + 0.1 * Math.abs(u))], [g.cx + g.rx * u * (0.98 + rr(-0.05, 0.05)), tipY]], false, 2);
      fine(A, cl, A.mix(P.c, P.leaf, 0.35), 1.2, 0.8);
      const al = A.along(cl, rr(3.0, 3.6), 0.5);
      for (const q of al) {
        if (q.i < al.length * 0.2) continue;
        const c = A.chance(0.14) ? P.leaf2 : (A.chance(0.3) ? A.mix(P.leaf, P.mid, 0.5) : P.leaf), l = h * rr(0.03, 0.045);
        for (const s of [-1, 1]) leaf(A, q.x, q.y, PI / 2 + s * rr(0.25, 0.7), l, rr(1.6, 2.2), c, { bend: s * 0.2 });
      }
      const e = cl[cl.length - 1];
      if (A.chance(0.7)) for (let k = 0; k < 3; k++) accent(A, e[0] + rr(-2, 2), e[1] + 2 + k * 2.6, rr(1.3, 1.8), P);
    }
    for (const q of A.along(dome, h * 0.02, 0.8)) { const c = A.chance(0.2) ? P.leaf2 : A.mix(P.leaf, P.mid, rr(0, 0.6)); const out = Math.atan2(-Math.cos(q.ang), Math.sin(q.ang)); for (const sd of [-1, 1]) leaf(A, q.x - Math.cos(out) * 2, q.y - Math.sin(out) * 2, out + sd * rr(0.45, 1.0), h * rr(0.028, 0.04), rr(1.7, 2.3), c, { bend: 0 }); }
    return g;
  };

  // the dark flame of a cypress, sometimes wound with a flowering creeper
  KIND.cypress = function (A, x, y, h, P, o) {
    const rr = A.rr, w = (o.wide || rr(0.2, 0.25)) * h, lean = ((o.lean || 0) + rr(-0.015, 0.015)) * h, ph = rr(0, TAU);
    const y0 = y - h * 0.07, H = h * 0.93;
    const hw = t => w / 2 * Math.pow(Math.sin(PI * Math.pow(0.07 + 0.93 * t, 0.62)), 0.85);
    const cxo = t => x + lean * t + Math.sin(t * PI * 1.4 + ph) * w * 0.07 * t;
    trunk(A, x, y, x, y0 - h * 0.04, h * 0.022, P, { twist: 0.3, taper: 0.8 });
    const Lp = [], Rp = [], n = 46;
    for (let i = 0; i <= n; i++) { const t = i / n; Lp.push([cxo(t) - hw(t), y0 - H * t]); Rp.push([cxo(t) + hw(t), y0 - H * t]); }
    const rp = A.shape(Lp.concat(Rp.reverse()), { c: P.c, w: 8, passes: 2, rough: 0.8, ang: -1.45 });
    const st = h * 0.03 / P.dens;
    for (let t = 0.02; t < 0.97; t += st / H * rr(0.85, 1.15)) {
      const half = hw(t), nx = Math.max(1, Math.round(half * 2 / (st * 0.8)));
      for (let k = 0; k <= nx; k++) {
        const u = nx ? (k / nx) * 2 - 1 : 0, px = cxo(t) + u * half * 1.04 + rr(-0.8, 0.8), py = y0 - H * t + rr(-1, 1), l = h * rr(0.04, 0.055);
        const c = A.chance(0.1) ? P.leaf2 : A.mix(P.leaf, P.c, rr(0, 0.45));
        fine(A, [[px, py], [px + u * l * 0.28, py - l * 0.55], [px + u * l * 0.16, py - l]], c, rr(1.0, 1.4), 0.9);
      }
    }
    if (o.vine != null ? o.vine : A.chance(P.zone === 'A' ? 0.15 : 0.6)) {
      const turns = rr(3.5, 4.8), v = [], fl = [];
      let cur = [];
      for (let t = 0.08; t < 0.93; t += 0.006) {
        const a = t * turns * TAU + ph, front = Math.cos(a) > -0.25;
        if (front) cur.push([cxo(t) + Math.sin(a) * hw(t) * 0.95, y0 - H * t]); else if (cur.length) { v.push(cur); cur = []; }
      }
      if (cur.length) v.push(cur);
      for (const sgm of v) { if (sgm.length < 3) continue; fine(A, sgm, P.leaf2, 1.1, 0.85); for (const q of A.along(sgm, h * 0.035, 1)) fl.push(q); }
      for (const q of fl) { if (A.chance(0.25)) continue; if (P.accent === 'gold') A.dot(q.x, q.y, 'gold', 'gold', { w: 2 }); else bloom(A, q.x, q.y, rr(1.9, 2.5), A.chance(0.3) ? 'khadi' : P.accent, 'haldi'); }
    }
    return { cx: x + lean * 0.5, cy: y0 - H / 2, rx: w / 2, ry: H / 2, lean };
  };

  // plantain: a pale sheathed stem and great arching blades, veined and wind-torn
  KIND.plantain = function (A, x, y, h, P, o) {
    const rr = A.rr, lean = ((o.lean || 0) + rr(-0.02, 0.02)) * h, sh = h * rr(0.42, 0.5), sw = h * 0.04;
    const tx = x + lean, ty = y - sh;
    const scl = A.spline([[x, y], [x + lean * 0.4 + rr(-2, 2), y - sh * 0.5], [tx, ty]], false, 2.5), sd = sides(scl, sw, sw * 0.72, sw * 0.4);
    const n = A.ri(6, 8), lv = [];
    for (let i = 0; i < n; i++) { const u = (i + rr(0.15, 0.85)) / n; lv.push(-PI + 0.2 + u * (PI - 0.4)); }
    lv.sort((a, b) => Math.abs(Math.cos(b)) - Math.abs(Math.cos(a)));
    const blade = (a, len, Wd, c, back) => {
      const dx = Math.cos(a), dy = Math.sin(a), sx = tx + rr(-2, 2), sy = ty + rr(0, sh * 0.12);
      const droop = len * (0.12 + 0.5 * Math.abs(dx)) * rr(0.8, 1.15);
      const cl = A.path().M(sx, sy).Q(sx + dx * len * 0.62, sy + dy * len * 0.62 - len * 0.05, sx + dx * len * 0.92, sy + dy * len * 0.92 + droop).pts;
      const prof = t => t < 0.1 ? 0.12 + t * 1.5 : Math.pow(Math.sin(PI * Math.pow((t - 0.1) / 0.9, 0.72)), 0.7) * 0.97 + 0.03;
      const s2 = sides(cl, t => Wd * prof(t), 0, 0), m = cl.length;
      for (let k = 0, nt = A.ri(1, 3); k < nt; k++) {       // tears
        const j = A.ri(Math.floor(m * 0.3), Math.floor(m * 0.85)), sdv = A.chance(0.5) ? s2.L : s2.R;
        sdv[j] = [sdv[j][0] + (cl[j][0] - sdv[j][0]) * 0.72, sdv[j][1] + (cl[j][1] - sdv[j][1]) * 0.72];
      }
      const poly = s2.L.concat(s2.R.slice().reverse());
      A.shape(poly, { c, w: 6, passes: 2, rough: 0.3, ang: a + rr(-0.2, 0.2), reach: 1.5 });
      const vc = A.mix(c, P.dark, back ? 0.5 : 0.65);
      for (let j = Math.ceil(m * 0.12); j < m - 2; j += A.ri(1, 2)) {
        const j2 = Math.min(m - 1, j + 2);
        for (const sdv of [s2.L, s2.R]) A.stroke([cl[j], [(cl[j][0] + sdv[j2][0]) / 2, (cl[j][1] + sdv[j2][1]) / 2], sdv[j2]], 'pencil', vc, { w: 0.65, p: rr(0.4, 0.7) });
      }
      fine(A, cl, back ? A.mix(P.leaf2, c, 0.5) : P.leaf2, rr(1.2, 1.6), 0.9);
      A.stroke(cl.map(p => [p[0] + 0.7, p[1] + 0.7]), 'pencil', vc, { w: 0.7, p: 0.6 });
      A.outline(poly, 'pencil', A.mix(P.dark, P.c, 0.3), { closed: true, w: 0.9, p: 0.8 });
      if (P.zone === 'A') for (const q of A.along(s2.L.slice(Math.floor(m * 0.5)), 5, 1)) if (A.chance(0.6)) A.dot(q.x, q.y, 'chalk', 'ochre', { w: rr(1.5, 2.6), p: 0.7 });
      return cl[m - 1];
    };
    let top = [tx, ty - h * 0.4];
    lv.forEach((a, i) => { if (i < lv.length / 2) blade(a, h * rr(0.42, 0.52) * (0.8 + 0.25 * Math.abs(Math.sin(a))), h * rr(0.062, 0.078), A.mix(P.c, P.leaf, rr(0.15, 0.45)), true); });
    // the stem in front of the back leaves
    A.shape(sd.L.concat(sd.R.slice().reverse()), { c: P.trunk, w: 4, passes: 2, rough: 0.25, ang: -1.4, reach: 1.5 });
    for (let k = 0; k < 4; k++) { const f = rr(0.15, 0.85); A.stroke(sd.L.map((p, i) => [p[0] + (sd.R[i][0] - p[0]) * f + rr(-0.3, 0.3), p[1]]).slice(A.ri(0, 4), -A.ri(1, 6)), 'pencil', A.mix(P.c, P.dark, 0.2), { w: 0.75, p: rr(0.4, 0.7) }); }
    A.stroke(sd.R.map((p, i) => [p[0] + (sd.L[i][0] - p[0]) * 0.25, p[1]]), 'shade', P.zone === 'C' ? 'slate' : 'rose', { w: sw * 0.7, p: 0.4 });
    A.outline(sd.L, 'pencil', P.bark, { w: 1.0, p: 0.8 }); A.outline(sd.R, 'pencil', P.bark, { w: 1.0, p: 0.85 });
    lv.forEach((a, i) => { if (i >= lv.length / 2) { const e = blade(a, h * rr(0.44, 0.56) * (0.8 + 0.25 * Math.abs(Math.sin(a))), h * rr(0.064, 0.082), A.mix(P.leaf, P.c, rr(0, 0.2)), false); if (e[1] < top[1]) top = e; } });
    // the new leaf, still rolled
    const sp = A.path().M(tx, ty + 2).Q(tx + rr(-3, 3), ty - h * 0.2, tx + lean * 0.3 + rr(-5, 5), y - h).pts;
    A.shape(ribbon(sp, t => h * 0.016 * Math.sin(PI * Math.min(1, t * 1.1 + 0.05)) + 0.3, 0, 0), { c: A.mix(P.leaf, 'cream', 0.45), w: 3, rough: 0.2, line: A.mix(P.dark, P.c, 0.3), lineTool: 'pencil', lw: 0.85 });
    if (o.bud != null ? o.bud : P.zone !== 'A') {
      const s = A.chance(0.5) ? 1 : -1, bx = tx + s * h * 0.11, by = ty + h * 0.16;
      fine(A, A.path().M(tx, ty + 3).Q(tx + s * h * 0.12, ty - h * 0.02, bx, by - h * 0.05).pts, A.mix(P.c, P.leaf, 0.4), 1.6, 0.9);
      const bud = A.xf(A.spline([[0, -1], [0.55, -0.35], [0.4, 0.5], [0, 1], [-0.42, 0.45], [-0.55, -0.35]], true, 0.15), { x: bx, y: by, sx: h * 0.035, sy: h * 0.055, rot: s * 0.25 });
      A.shape(bud, { c: P.accent === 'gold' ? 'plum' : P.accent, w: 3, rough: 0.2, line: P.bark, lineTool: 'pencil', lw: 0.85 });
      A.stroke([[bx - 1, by - h * 0.035], [bx - 1.6, by + h * 0.02]], 'pencil', 'gulabi', { w: 0.9, p: 0.7, opq: 1 });
    }
    return { cx: tx, cy: y - h * 0.62, rx: h * 0.42, ry: h * 0.38, lean, topPt: [tx + lean * 0.3, y - h] };
  };

  // a thin ringed stem carrying a wheel of combed fronds
  KIND.palm = function (A, x, y, h, P, o) {
    const rr = A.rr, lean = ((o.lean || 0) + rr(-0.05, 0.05)) * h, K = [x + lean, y - h * rr(0.76, 0.8)], tw = h * 0.02;
    const bow = rr(-1, 1) * h * 0.04;
    const cl = A.spline([[x, y], [x + lean * 0.3 + bow, y - h * 0.28], [x + lean * 0.75 - bow * 0.6, y - h * 0.56], K], false, 2.5), sd = sides(cl, tw, tw * 0.7, tw * 0.9);
    A.shape(sd.L.concat(sd.R.slice().reverse()), { c: P.trunk, w: 3.2, passes: 2, rough: 0.2, ang: -1.4, reach: 1.5 });
    for (let i = 2; i < cl.length - 1; i += A.ri(2, 3)) A.stroke([sd.L[i], [cl[i][0], cl[i][1] + rr(0.6, 1.4)], sd.R[i]], 'pencil', P.bark, { w: 0.8, p: rr(0.5, 0.85) });
    A.outline(sd.L, 'pencil', P.bark, { w: 1.0, p: 0.85 }); A.outline(sd.R, 'pencil', P.bark, { w: 1.05, p: 0.9 });
    for (const s of [-1, 1]) A.stroke([[x + s * tw * 1.1, y - tw * 0.5], [x + s * tw * 2.4, y + rr(0, 1.2)]], 'pencil', P.bark, { w: 1.0, p: 0.7 });
    const nF = A.ri(13, 16), fr = [];
    for (let i = 0; i < nF; i++) fr.push(-PI / 2 + (-1 + 2 * (i + rr(0.2, 0.8)) / nF) * (PI * 0.5 + 0.75));
    fr.sort((a, b) => Math.sin(b) - Math.sin(a));           // drooping ones first, upright last
    const frond = (a, back) => {
      const Lf = h * rr(0.2, 0.26), dx = Math.cos(a), dy = Math.sin(a), sag = Lf * (0.18 + 0.42 * Math.abs(dx)) * rr(0.8, 1.2);
      const mc = A.path().M(K[0], K[1]).Q(K[0] + dx * Lf * 0.6, K[1] + dy * Lf * 0.6 - Lf * 0.04, K[0] + dx * Lf, K[1] + dy * Lf + sag).pts;
      const c = back ? A.mix(P.leaf, P.c, 0.45) : P.leaf;
      const al = A.along(mc, rr(2.1, 2.6), 0.2);
      for (const q of al) {
        const t = q.i / (al.length - 1); if (t < 0.12) continue;
        const ll = h * 0.055 * Math.pow(Math.sin(PI * Math.min(1, t * 0.92 + 0.08)), 0.6) * rr(0.8, 1.1) + 1.5;
        for (const s of [-1, 1]) { const aa = q.ang + s * rr(0.75, 1.05); fine(A, [[q.x, q.y], [q.x + Math.cos(aa) * ll * 0.6, q.y + Math.sin(aa) * ll * 0.6 + ll * 0.04], [q.x + Math.cos(aa) * ll, q.y + Math.sin(aa) * ll + ll * 0.16]], A.chance(0.12) ? P.leaf2 : c, rr(0.95, 1.3), 0.92); }
      }
      fine(A, mc, back ? A.mix(P.leaf2, P.c, 0.4) : P.leaf2, 1.25, 0.9);
      return mc[mc.length - 1];
    };
    fr.forEach((a, i) => { if (i < nF * 0.45) frond(a, true); });
    // fruit under the crown
    if (o.fruit != null ? o.fruit : P.zone !== 'A' || A.chance(0.4)) for (const s of [-1, 1]) {
      const fx = K[0] + s * h * rr(0.03, 0.05), fy = K[1] + h * rr(0.05, 0.075);
      A.stroke(A.path().M(K[0], K[1]).Q(K[0] + s * h * 0.05, K[1] + h * 0.01, fx, fy).pts, 'pencil', P.bark, { w: 0.9 });
      for (let k = 0; k < 9; k++) accent(A, fx + rr(-3, 3), fy + rr(-1, 6), rr(1.5, 2.2), P);
    }
    A.dot(K[0], K[1], 'pastel', P.c, { w: h * 0.05, reach: 1.5, p: 1 });
    fr.forEach((a, i) => { if (i >= nF * 0.45) frond(a, false); });
    A.dot(K[0], K[1] - 1, 'chalk', A.mix(P.c, P.leaf, 0.4), { w: h * 0.022 });
    return { cx: K[0], cy: K[1], rx: h * 0.27, ry: h * 0.24, lean, topPt: [K[0], K[1] - h * 0.22] };
  };

  // dark boughs strung with five-petalled blossom
  KIND.blossom = function (A, x, y, h, P, o) {
    const rr = A.rr, limbs = [], G = { gnarl: 0.16, shrink: 0.62, spread: 1.5, up: 0.12, three: true };
    grow(A, limbs, x, y, -PI / 2 + (o.lean || 0) + rr(-0.06, 0.06), h * 0.33, h * 0.03, 0, 3, G);
    limbs[0].flare = h * 0.03;
    // fit the skeleton to the asked height
    let minY = 1e9, minX = 1e9, maxX = -1e9;
    for (const l of limbs) for (const p of l.cl) { if (p[1] < minY) minY = p[1]; if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; }
    const ky = (h * 0.93) / (y - minY), kx = Math.min(1.25, (h * 0.86) / Math.max(1, maxX - minX));
    for (const l of limbs) { for (const p of l.cl) { p[0] = x + (p[0] - x) * kx; p[1] = y - (y - p[1]) * ky; } l.tip = l.cl[l.cl.length - 1]; }
    drawLimbs(A, limbs, P, { light: A.mix(P.trunk, 'sand', 0.5) });
    const spots = [];
    for (const l of limbs) { if (l.depth < 1) continue; const al = A.along(l.cl, h * (l.depth >= 3 ? 0.05 : 0.075) / P.dens, 1.5); for (const q of al) if (l.depth >= 2 || q.i > al.length * 0.4) spots.push([q.x, q.y, l.depth]); spots.push([l.tip[0], l.tip[1], 3]); }
    // small leaves first, then the blossom over them
    for (const s of spots) if (A.chance(0.55)) for (let k = 0; k < 2; k++) leaf(A, s[0], s[1], rr(0, TAU), h * rr(0.025, 0.04), rr(1.8, 2.6), A.mix(P.mid, P.leaf, rr(0, 0.6)));
    for (const s of spots) {
      const nb = s[2] >= 3 ? A.ri(3, 5) : A.ri(1, 3);
      for (let k = 0; k < nb; k++) {
        const bx = s[0] + rr(-1, 1) * h * 0.035, by = s[1] + rr(-1, 1) * h * 0.035, r = h * rr(0.014, 0.02) + 1.2;
        if (A.chance(0.22)) { accent(A, bx, by, r * 0.8, P); continue; }
        bloom(A, bx, by, r, A.pick(P.blooms), P.accent === 'gold' ? 'gold' : (A.chance(0.5) ? 'haldi' : P.accent));
      }
    }
    return { cx: x + ((minX + maxX) / 2 - x) * kx, cy: y - h * 0.6, rx: (maxX - minX) * kx / 2, ry: h * 0.36, lean: 0 };
  };

  // the leafless tree of the dry season, with one strong high bough to sit on
  KIND.bare = function (A, x, y, h, P, o) {
    const rr = A.rr, side = o.side || (o.lean && o.lean < 0 ? -1 : 1), tw = h * 0.036, limbs = [];
    const fork = [x - side * h * 0.03 + rr(-2, 2), y - h * rr(0.36, 0.42)];
    limbs.push({ cl: A.spline([[x, y], [x - side * h * 0.04, y - h * 0.14], [x + side * h * 0.025, y - h * 0.27], fork], false, 2.2), w0: tw, w1: tw * 0.78, flare: tw * 1.1, ang: -PI / 2, depth: 0 });
    // the perch bough: climbs, then levels out
    const pe = [x + side * h * 0.4, y - h * 0.9];
    const pcl = A.spline([fork, [fork[0] + side * h * 0.1, y - h * 0.56], [x + side * h * 0.16, y - h * 0.74], [x + side * h * 0.27, y - h * 0.86], pe], false, 2.2);
    limbs.push({ cl: pcl, w0: tw * 0.7, w1: tw * 0.3, ang: -PI / 4, depth: 1 });
    // the other bough, reaching the top
    const s2 = [x - side * h * 0.16, y - h * 0.78];
    limbs.push({ cl: A.spline([fork, [fork[0] - side * h * 0.08, y - h * 0.52], [x - side * h * 0.19, y - h * 0.64], s2], false, 2.2), w0: tw * 0.66, w1: tw * 0.36, ang: -PI * 0.6, depth: 1 });
    const G = { gnarl: 0.3, shrink: 0.55, spread: 1.5, up: 0.1 };
    grow(A, limbs, s2[0], s2[1], -PI / 2 - side * 0.1, h * 0.2, tw * 0.3, 2, 3, G);
    grow(A, limbs, s2[0], s2[1], -PI / 2 - side * 0.9, h * 0.15, tw * 0.24, 2, 3, G);
    // twigs off the perch bough, kept clear of the seat
    const pm = pcl[Math.floor(pcl.length * 0.45)];
    grow(A, limbs, pm[0], pm[1], -PI / 2 - side * 0.35, h * 0.2, tw * 0.26, 2, 3, G);
    grow(A, limbs, pe[0], pe[1], -PI / 2 + side * 0.9, h * 0.08, tw * 0.16, 3, 3, G);
    const pl = pcl[Math.floor(pcl.length * 0.22)];
    grow(A, limbs, pl[0], pl[1], -PI / 2 + side * 1.25, h * 0.17, tw * 0.22, 2, 3, G);
    // a low broken stub on the trunk
    const st = limbs[0].cl[Math.floor(limbs[0].cl.length * 0.8)];
    limbs.push({ cl: A.spline([st, [st[0] - side * h * 0.035, st[1] - h * 0.04], [st[0] - side * h * 0.05, st[1] - h * 0.075]], false, 2.2), w0: tw * 0.34, w1: tw * 0.24, ang: -PI * 0.6, depth: 2 });
    drawLimbs(A, limbs, P, { light: A.mix(P.trunk, 'sand', 0.6) });
    // knot hole, bark cracks
    const kn = limbs[0].cl[Math.floor(limbs[0].cl.length * 0.33)];
    A.shape(A.ellipse(kn[0] + rr(-1, 1), kn[1], tw * 0.34, tw * 0.6, rr(-0.3, 0.3)), { c: 'kajal', tool: 'chalk', w: 1.6, rough: 0.15 });
    for (let i = 0; i < 9; i++) { const k = limbs[0].cl[A.ri(2, limbs[0].cl.length - 3)], ox = rr(-0.7, 0.7) * tw; A.stroke([[k[0] + ox, k[1]], [k[0] + ox + rr(-1.2, 1.2), k[1] - rr(4, 10)]], 'pencil', P.bark, { w: 0.75, p: rr(0.4, 0.75) }); }
    // the last few dry leaves
    if (o.leaves !== false) for (const l of limbs) if (l.depth >= 3 && A.chance(0.3)) leaf(A, l.tip[0], l.tip[1], PI / 2 + rr(-0.7, 0.7), h * 0.028, 2.4, A.chance(0.5) ? P.leaf : 'brick');
    const seat = pcl[Math.floor(pcl.length * 0.9)];
    return { cx: x, cy: y - h * 0.62, rx: h * 0.42, ry: h * 0.38, lean: 0, perch: [seat[0], seat[1] - tw * 0.36], topPt: [s2[0], y - h] };
  };

  M.treeKinds = Object.keys(KIND);
  const FORKABLE = { dotted: 1, scale: 1, radiate: 1, lens: 1, bell: 1 };
  /* o: zone 'A'|'B'|'C', colours c / dark / mid / leaf / leaf2 / accent / trunk / bark, lean (fraction of h), wide (canopy width / h),
        dens (pattern density), mounds (1..3 crowns on a forking trunk; default: now and then 2 or 3 on the bigger round kinds),
        kind extras: scale {gold}, cypress {vine}, plantain {bud}, palm {fruit}, puff {puffs: n}, bare {side: +1 | -1, leaves} */
  M.tree = function (A, x, y, h, kind, o) {
    o = o || {};
    if (!KIND[kind]) kind = 'dotted';
    const fn = KIND[kind], P = pal(A, kind, o);
    let n = o.mounds != null ? o.mounds : (FORKABLE[kind] && h >= 170 && A.chance(0.22) ? A.ri(2, 3) : 1);
    if (!FORKABLE[kind] || n < 2) {
      const g = fn(A, x, y, h, P, o), top = g.topPt || [g.cx, y - h];
      return { top, canopy: [g.cx, g.cy, g.rx, g.ry], perch: g.perch || top };
    }
    // a forking trunk carrying two or three crowns
    const rr = A.rr, sd = A.chance(0.5) ? 1 : -1, lean = (o.lean || 0) * h;
    const subs = n === 2
      ? [{ dx: -0.19 * sd, lift: 0.16, hh: 0.69 }, { dx: 0.16 * sd, lift: 0.31, hh: 0.69 }]
      : [{ dx: 0.02 * sd, lift: 0.4, hh: 0.6 }, { dx: -0.24, lift: 0.17, hh: 0.6 }, { dx: 0.24, lift: 0.21, hh: 0.6 }];
    const fork = [x + lean * 0.3 + rr(-2, 2), y - h * rr(0.22, 0.26)];
    trunk(A, x, y, fork[0], fork[1], h * 0.036, P, { taper: 0.8, twist: 0.7 });
    const lim = [];
    for (const q of subs) {
      q.x = x + lean + (q.dx + rr(-0.02, 0.02)) * h; q.y = y - q.lift * h; q.h = q.hh * h;
      const ty = q.y - q.h * 0.42;
      lim.push({ cl: A.spline([fork, [fork[0] + (q.x - fork[0]) * 0.6, fork[1] + (ty - fork[1]) * 0.3], [q.x, ty]], false, 2.5), w0: h * 0.019, w1: h * 0.011, ang: -PI / 2 });
    }
    drawLimbs(A, lim, P);
    let x0 = 1e9, x1 = -1e9, y1 = -1e9;
    NO_TRUNK = true;
    try { for (const q of subs) { const g = fn(A, q.x, q.y, q.h, P, Object.assign({}, o, { lean: 0, wide: (o.wide || 0.66) * 1.12 })); x0 = Math.min(x0, g.cx - g.rx); x1 = Math.max(x1, g.cx + g.rx); y1 = Math.max(y1, g.cy + g.ry); } }
    finally { NO_TRUNK = false; }
    const top = [subs[n === 2 ? 1 : 0].x, y - h];
    return { top, canopy: [(x0 + x1) / 2, (y - h + y1) / 2, (x1 - x0) / 2, (y1 - (y - h)) / 2], perch: top };
  };

  // ------------------------------------------------------------------ shrubs
  M.shrub = function (A, x, y, s, kind, o) {
    o = o || {}; kind = kind || 'dot';
    const rr = A.rr, P = pal(A, 'shrub', o), hh = s * rr(0.62, 0.78);
    const cp = mound(A, x, y - hh * 0.56, s / 2, hh * 0.6, { point: 0.12, lobes: A.ri(6, 9), lob: 0.13, flat: 0.8 });
    const rp = A.shape(cp, { c: P.c, w: 7, passes: 2, rough: 0.7, ang: rr(-1.2, -0.5) });
    fringe(A, rp, A.mix(P.c, P.mid, 0.5), s * 0.07, 2.2, s * 0.05, y - hh * 0.25);
    for (const p of A.scatter(rp, s * 0.085, { jit: 0.45 })) {
      const a = -PI / 2 + rr(-0.9, 0.9), c = A.mix(P.mid, A.chance(0.3) ? P.leaf : P.c, rr(0.1, 0.5));
      if (kind === 'oleander') leaf(A, p[0], p[1], a, s * rr(0.1, 0.14), 1.9, c); else for (let k = -1; k <= 1; k++) leaf(A, p[0], p[1], a + k * 0.6, s * rr(0.05, 0.07), 2.0, c);
    }
    const B = P.zone === 'B', C = P.zone === 'C';
    for (const p of A.scatter(rp, s * (kind === 'oleander' ? 0.17 : 0.125) / P.dens, { jit: 0.48, margin: s * 0.02 })) {
      if (kind === 'jasmine') { star(A, p[0], p[1], rr(2.4, 3.4), o.flower || (C ? 'ice' : 'khadi'), A.pick([5, 6, 6]), 1.05); if (C) A.dot(p[0], p[1], 'gold', 'gold', { w: 1.2 }); else A.dot(p[0], p[1], 'chalk', 'haldi', { w: 1.2 }); }
      else if (kind === 'oleander') { bloom(A, p[0], p[1], rr(2.8, 3.8), o.flower || (C ? A.pick(['lilac', 'khadi']) : B ? A.pick(['rose', 'gulabi', 'rose', 'khadi']) : 'pinkrock'), C ? 'gold' : 'crimson'); }
      else { const c = o.flower || (C ? A.pick(['khadi', 'ice']) : B ? A.pick(['sindoor', 'hingul', 'sindoor', 'saffron']) : A.pick(['brick', 'ochre'])); A.dot(p[0], p[1], 'chalk', c, { w: rr(2.2, 3.4), reach: 1.3 }); if (A.chance(0.35)) { if (C) A.dot(p[0], p[1], 'gold', 'gold', { w: 1.0 }); else A.dot(p[0], p[1], 'chalk', 'haldi', { w: 1.0 }); } }
    }
    const base = rp.filter(p => p[1] > y - hh * 0.3);
    A.outline(rp, 'kajal', P.line, { closed: true, w: 1.0, p: 0.55, again: 0.1 });
    return { top: [x, y - hh], canopy: [x, y - hh * 0.56, s / 2, hh * 0.6], base };
  };

  // ------------------------------------------------------------------ ground plants
  function tpal(A, o) {
    const z = o.zone || 'B';
    if (z === 'A') return { blades: ['ochre', 'sand', A.mix('olive', 'sand', 0.4), 'umber'], dark: 'umber', hi: 'cream', flowers: ['brick', 'ochre'], eye: 'sand' };
    if (z === 'C') return { blades: ['teal', 'verdigris', 'aqua', A.mix('teal', 'bottle', 0.4)], dark: A.mix('bottle', 'night', 0.4), hi: 'ice', flowers: ['khadi', 'ice', 'lilac'], eye: 'gold' };
    return { blades: ['leaf', 'sap', 'malachite', 'leaf'], dark: 'bottle', hi: 'haldi', flowers: ['sindoor', 'rose', 'khadi', 'haldi', 'crimson'], eye: 'haldi' };
  }
  const TUFT = {
    grass(A, x, y, s, Q) {
      const rr = A.rr, n = A.ri(7, 13);
      for (let k = 0; k < 3; k++) seg(A, x + rr(-1, 1), y, x + rr(-0.25, 0.25) * s, y - s * rr(0.3, 0.5), Q.dark, 1.5, 0.85);
      for (let k = 0; k < n; k++) {
        const u = (k / (n - 1)) * 2 - 1 + rr(-0.12, 0.12), l = s * (1 - 0.38 * Math.abs(u)) * rr(0.8, 1.1), a = u * rr(0.8, 1.05), bx = x + u * s * 0.07;
        fine(A, A.path().M(bx, y).Q(bx + Math.sin(a) * l * 0.25, y - l * 0.62, bx + Math.sin(a) * l, y - Math.cos(a) * l * 0.92).pts, A.pick(Q.blades), rr(1.0, 1.5), 0.95);
      }
      if (A.chance(0.35)) fine(A, [[x, y], [x + rr(-1, 1), y - s * 0.95]], Q.hi, 0.9, 0.85);
    },
    fan(A, x, y, s, Q) {
      const rr = A.rr, n = A.ri(5, 9), ord = [];
      for (let k = 0; k < n; k++) ord.push((k / (n - 1)) * 2 - 1);
      ord.sort((a, b) => Math.abs(b) - Math.abs(a));
      for (const u of ord) {
        const a = -PI / 2 + u * rr(1.0, 1.2), l = s * (1 - 0.3 * Math.abs(u)) * rr(0.85, 1.05), c = A.pick(Q.blades);
        const tip = leaf(A, x + u * 1.2, y, a, l, l * rr(0.24, 0.3) + 0.8, c, { bend: u * 0.25 });
        A.stroke([[x + u * 1.2, y], tip], 'pencil', Q.dark, { w: 0.7, p: 0.6 });
      }
    },
    flower(A, x, y, s, Q, o) {
      const rr = A.rr, n = A.ri(3, 5), fc = o.flower || A.pick(Q.flowers);
      for (let k = 0; k < 5; k++) { const u = rr(-1, 1); fine(A, A.path().M(x, y).Q(x + u * s * 0.1, y - s * 0.3, x + u * s * 0.42, y - s * rr(0.3, 0.5)).pts, A.pick(Q.blades), 1.2, 0.95); }
      for (let k = 0; k < n; k++) {
        const u = (k / (n - 1)) * 2 - 1 + rr(-0.15, 0.15), l = s * rr(0.65, 1), ex = x + u * s * 0.4, ey = y - l;
        const st = A.path().M(x, y).Q(x + u * s * 0.08, y - l * 0.6, ex, ey).pts;
        fine(A, st, A.mix(A.pick(Q.blades), Q.dark, 0.3), 0.95, 0.9);
        const m = st[Math.floor(st.length * 0.55)]; leaf(A, m[0], m[1], -PI / 2 + (u >= 0 ? 1 : -1) * rr(0.7, 1.1), s * 0.2, 1.7, A.pick(Q.blades));
        const r = Math.max(1.5, s * rr(0.075, 0.11));
        if (A.chance(0.5)) bloom(A, ex, ey, r, fc, Q.eye); else { A.dot(ex, ey, 'chalk', fc, { w: r * 1.5, reach: 1.3 }); if (Q.eye === 'gold') A.dot(ex, ey, 'gold', 'gold', { w: r * 0.6 }); else A.dot(ex, ey, 'chalk', Q.eye, { w: r * 0.55 }); }
      }
    },
    fern(A, x, y, s, Q) {
      const rr = A.rr;
      for (const u of [-1, 1, 0].slice(0, A.ri(2, 3))) {
        const l = s * rr(0.8, 1.05), st = A.path().M(x, y).Q(x + u * s * 0.1, y - l * 0.7, x + u * s * rr(0.4, 0.6), y - l * rr(0.8, 0.95)).pts, c = A.pick(Q.blades);
        fine(A, st, A.mix(c, Q.dark, 0.35), 0.95, 0.9);
        const al = A.along(st, Math.max(1.8, s * 0.1), 0.2);
        for (const q of al) { const t = q.i / (al.length - 1); if (t < 0.15) continue; for (const sd of [-1, 1]) leaf(A, q.x, q.y, q.ang + sd * rr(0.9, 1.2), s * 0.2 * (1.15 - t), 1.5, c, { bend: 0 }); }
      }
    },
    thorn(A, x, y, s, Q) {
      const rr = A.rr, n = A.ri(3, 5);
      for (let k = 0; k < n; k++) {
        const u = (k / (n - 1)) * 2 - 1 + rr(-0.15, 0.15), pts = [[x + u * 1.5, y]]; let a = -PI / 2 + u * 0.8, px = x + u * 1.5, py = y; const ns = A.ri(3, 5), l = s * rr(0.7, 1.05) / ns;
        for (let j = 0; j < ns; j++) { a += rr(-0.5, 0.5); px += Math.cos(a) * l; py += Math.sin(a) * l; pts.push([px, py]); const ta = a + (j % 2 ? 1 : -1) * rr(0.9, 1.3); A.stroke([[px, py], [px + Math.cos(ta) * s * 0.14, py + Math.sin(ta) * s * 0.14]], 'kajal', Q.dark, { w: 0.8, p: 0.8, tout: 0.6 }); }
        A.stroke(pts, 'kajal', Q.dark, { w: 1.1, p: 0.85, tout: 0.4 });
        if (A.chance(0.35)) A.dot(px, py, 'chalk', A.pick(Q.flowers), { w: rr(1.2, 1.9) });
      }
    },
    dry(A, x, y, s, Q) {
      const rr = A.rr, n = A.ri(5, 9);
      for (let k = 0; k < n; k++) {
        const u = (k / (n - 1)) * 2 - 1 + rr(-0.15, 0.15), l = s * (1 - 0.3 * Math.abs(u)) * rr(0.75, 1.1), a = u * rr(0.7, 1.1), c = A.pick(Q.blades);
        const kx = x + Math.sin(a) * l * 0.55, ky = y - Math.cos(a) * l * 0.6;
        if (A.chance(0.3)) { const b = a + (u >= 0 ? 1 : -1) * rr(0.9, 1.5); fine(A, [[x + u, y], [kx, ky], [kx + Math.sin(b) * l * 0.4, ky - Math.cos(b) * l * 0.4]], c, rr(0.9, 1.3), 0.9); }
        else { const ex = x + Math.sin(a) * l, ey = y - Math.cos(a) * l; fine(A, [[x + u, y], [kx + rr(-0.6, 0.6), ky], [ex, ey]], c, rr(0.9, 1.3), 0.9); if (A.chance(0.4)) for (let j = 0; j < 3; j++) A.dot(ex + rr(-0.8, 0.8), ey + j * 1.6, 'chalk', Q.hi, { w: rr(0.9, 1.4) }); }
      }
    }
  };
  M.tuftKinds = Object.keys(TUFT);
  M.tuft = function (A, x, y, s, kind, o) {
    o = o || {};
    const Q = tpal(A, o);
    if (o.c) Q.blades = Array.isArray(o.c) && typeof o.c[0] !== 'number' ? o.c : [o.c];
    if (o.dark) Q.dark = o.dark;
    (TUFT[kind] || TUFT.grass)(A, x, y, s, Q, o);
  };
  /* o: zone, step (20), s ([10, 22] height range), kinds (array, repeats weight the choice), jitter (3), skip (0.1) */
  M.tuftRow = function (A, pts, o) {
    o = o || {};
    const z = o.zone || 'B', kinds = o.kinds || (z === 'A' ? ['dry', 'dry', 'thorn', 'grass', 'dry'] : z === 'C' ? ['grass', 'fan', 'flower', 'fern', 'grass'] : ['grass', 'fan', 'flower', 'grass', 'fern', 'flower']);
    const s = o.s || [10, 22], step = o.step || 20;
    for (const q of A.along(pts, step, o.jitter != null ? o.jitter : 3)) {
      if (A.chance(o.skip != null ? o.skip : 0.1)) continue;
      M.tuft(A, q.x + A.rr(-step * 0.25, step * 0.25), q.y, A.rr(s[0], s[1]), A.pick(kinds), o);
    }
  };
  /* o: zone, c (petal colour), eye, s (size multiplier), keep (0.85), leaves (true in zone B) */
  M.starFlowers = function (A, poly, spacing, o) {
    o = o || {};
    const z = o.zone || 'B', rr = A.rr, c = o.c || 'khadi', k = o.s || 1;
    for (const p of A.scatter(poly, spacing, { jit: 0.48 })) {
      if (A.chance(1 - (o.keep != null ? o.keep : 0.85))) continue;
      const r = rr(1.9, 3.3) * k;
      if ((o.leaves != null ? o.leaves : z === 'B') && A.chance(0.4)) for (const s of [-1, 1]) leaf(A, p[0], p[1] + r * 0.6, PI / 2 + s * rr(0.9, 1.3), r * 1.5, 1.5, z === 'C' ? 'teal' : 'leaf');
      star(A, p[0], p[1], r, A.chance(0.12) ? (z === 'C' ? 'sky' : 'cream') : c, A.pick([5, 5, 6, 4]), rr(0.95, 1.2));
      if (A.chance(0.6)) { const e = o.eye || (z === 'C' ? 'gold' : 'haldi'); if (e === 'gold') A.dot(p[0], p[1], 'gold', 'gold', { w: r * 0.45 }); else A.dot(p[0], p[1], 'chalk', e, { w: r * 0.42 }); }
    }
  };
})();
