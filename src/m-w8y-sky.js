(function () {
  'use strict';
  /* ==========================================================================
     THE SKY AND THE WATER OF THE GOLD WELL, painted the folio way (part 'sky').
       M.w8y.sky(A, G, H)    the sky over the rim: the lapis band with its rolled white foot and the cloud bands
                             in it, the noon sun over the chhatri, Mewar clouds, the hills, the trees on the rim,
                             the parapet with its kanguras, the deck, and the chhatri itself
       M.w8y.water(A, G, H)  the tank at the foot: deep jade laid flat, counted rows of Mewar waves, the sun come
                             down to the water, lotus, fish, and the floating lamp (the Before stop)
       M.w8FloatLamp         the lamp on its leaf boat
     Each shape is laid in one clean flat colour, the paper burnished under it first so the sheet's crumple
     cannot come back through the paint; then one kajal contour in two goes (even, then a swell on the side
     away from the light, which comes from the upper left); then its ornament, counted, each repeat a hair
     different; gold last, as threads only.  Units are sheet units (1920 x 1080).
     ======================================================================== */
  const on = part => { const o = typeof process !== 'undefined' && process.env && process.env.W8Y; return !o || o.split(',').includes(part); };
  if (!on('sky')) return;
  M.w8y = M.w8y || {};
  const PI = Math.PI, TAU = PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const pol = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];

  const C = {
    sky: '#f0d08a', skyLow: '#f7e3b4',
    lime: '#f6eedc', limeLit: '#fffaf0', limeSh: '#d6c6a8', limeDeep: '#a8957a',
    haldi: '#edc94b', peori: '#e6b422', saffron: '#e88e1e', sindoor: '#d23c2a', ochre: '#c1892b', sunGold: '#efb83c',
    sand: '#b4503a', sandDeep: '#7c2c22', recess: '#3a1e12', recessLit: '#7a4422',
    hillFar: '#c2a8c6', hillFarD: '#8c739e', hillFarL: '#e4d4e8',
    hillNear: '#cf949c', hillNearD: '#8e5670', hillNearL: '#f2d4d2',
    jade: '#12423d', jadeDeep: '#0c302e', jadeLit: '#5f9c8c', jadeWave: '#7fb8a6',
    pad: '#2e6a3a', padIn: '#43834a', padVein: '#86b86c', padLit: '#a6cc84', padInk: '#163a1e',
    pink: '#ec9fb2', rose: '#d77f86', lac: '#8f2331', clay: '#b4562a', clayDeep: '#7a3416'
  };

  /* the three times of day.  P is the palette of the mood being painted; both hooks set it from G.mood.
     day: noon, the sun high over the chhatri.  dusk: the sun low and red behind the dome, the lapis gone violet.
     night: the full moon over the chhatri, counted stars, a deep lapis sky; the white lilies open, the lotus shut. */
  let P = null;
  function moodOf(A, G) {
    const mood = (G && G.mood) || 'day';
    const day = {
      mood: 'day', sky: ['#eed29c', '#efc988', '#f0bc7a'],
      band: { field: 'neel', low: A.mix('lapis', 'neel', 0.4), lowLit: A.mix('lapis', 'sky', 0.22), hair: A.mix('lapis', 'sky', 0.2) },
      cl: { body: 'khadi', tint: 'sky', ice: 'ice', soft: A.mix('sky', 'ice', 0.3), inner: A.mix('sky', 'lapis', 0.4), inner2: A.mix('sky', 'khadi', 0.35), line: 'khadi', rim: A.mix('lapis', 'neel', 0.4), turn: 'lapis', turnCool: 'neel', foot: A.mix('neel', 'lapis', 0.3) },
      body: { kind: 'sun', x: 960, y: 44, r: 30 },
      sun: { flame: [C.sindoor, C.saffron], flame2: C.saffron, ray: [C.haldi, C.peori], rayEdge: C.ochre, ring: C.sindoor, disc: C.sunGold, discSh: C.saffron, petal: [C.saffron, C.peori], vein: C.haldi, petalEdge: A.mix(C.sindoor, 'kajal', 0.35), heart: '#d99a2c', rosette: '#fbefd0', ringDot: 'khadi' },
      hillFar: [C.hillFar, C.hillFarD, C.hillFarL], hillMid: ['#a9b38c', '#6c7a58', '#e0e6c4'], hillNear: [C.hillNear, C.hillNearD, C.hillNearL], treeTint: null, birds: true,
      water: { jade: C.jade, deep: C.jadeDeep, lit: C.jadeLit, wave: C.jadeWave, crest: 'khadi', stairLit: '#5f8f80', stairLine: '#a8c8b8',
        disc: { x: 960, y: 1030, rx: 29, ry: 10.5, fill: [C.haldi, C.sunGold, C.saffron, A.mix(C.sindoor, C.saffron, 0.35)], crest: 'gold', rimCrest: C.sindoor },
        path: { y0: 1036, spread: 13, grow: 0.5, hi: 'gold', lo: C.haldi }, starsIn: 0 },
      lotusOpen: true
    };
    if (mood === 'dusk') return Object.assign({}, day, {
      mood: 'dusk', sky: ['#c97c88', '#e8925e', '#f4bf6c'],
      band: { field: '#2e2458', low: '#4c3a7e', lowLit: '#6e5294', hair: '#a07aa8' },
      cl: { body: '#fcefe6', tint: '#f0b49c', ice: '#f8e4ea', soft: '#f4ccbc', inner: '#a8789c', inner2: '#f2c8b8', line: '#fff6ee', rim: '#5e4282', turn: '#8a62a0', turnCool: '#5a3f8a', foot: '#46306c' },
      body: { kind: 'sun', x: 960, y: 88, r: 40 },
      sun: { flame: ['#b8281e', '#e0501e'], flame2: '#ee7a26', ray: ['#f29a34', '#ea6a22'], rayEdge: '#8a2a1a', ring: '#a82220', disc: '#f08a2c', discSh: '#d8541e', petal: ['#e66a22', '#f09034'], vein: '#f8b450', petalEdge: '#7a2216', heart: '#f4a83a', rosette: '#fde2b4', ringDot: '#fde8d6' },
      hillFar: ['#b0849e', '#764e7c', '#eab8b4'], hillMid: ['#9a8278', '#5e4a50', '#e6bca4'], hillNear: ['#94587a', '#5a3052', '#ee9e7c'], treeTint: ['#3a1a2a', 0.14],
      water: { jade: '#1f3a4a', deep: '#152838', lit: '#6a7a92', wave: '#b8a4c4', crest: '#f4dcd0', stairLit: '#56708a', stairLine: '#9aa8c4',
        disc: { x: 960, y: 994, rx: 34, ry: 7.5, fill: ['#f6c24a', '#f2a03a', '#ea7428', '#c83a22'], crest: 'gold', rimCrest: '#a82220' },
        path: { y0: 999, spread: 16, grow: 0.62, hi: 'gold', lo: '#f0a050' }, starsIn: 0 }
    });
    if (mood === 'night') return Object.assign({}, day, {
      mood: 'night', sky: ['#141c4a', '#1b275e', '#273874'],
      band: { field: '#0a0f2c', low: '#111a46', lowLit: '#1a275c', hair: '#4a5a9a' },
      cl: { body: '#e2e6f2', tint: '#7a8cc4', ice: '#f0f2fa', soft: '#b6c2e0', inner: '#5868a6', inner2: '#c6cee6', line: '#f0f3fb', rim: '#26326c', turn: '#3a4a8c', turnCool: '#1c2860', foot: '#141e4c' },
      body: { kind: 'moon', x: 960, y: 44, r: 23 },
      hillFar: ['#3c4480', '#252a5c', '#7c86c0'], hillMid: ['#2c4660', '#1a2c44', '#6888a8'], hillNear: ['#323870', '#1e2250', '#7480b8'], treeTint: ['#0c1634', 0.48], birds: false,
      water: { jade: '#10243c', deep: '#0a1a2c', lit: '#4a5a86', wave: '#8a9cc8', crest: '#dfe4f2', stairLit: '#3e5070', stairLine: '#8a9ab8',
        disc: { x: 960, y: 1030, rx: 22, ry: 8, fill: ['#f6f2e2', '#ece6d0', '#d8dcea', '#b8c2dc'], crest: '#c8a85a', rimCrest: '#9aa8cc' },
        path: { y0: 1036, spread: 10, grow: 0.4, hi: '#e8ecf6', lo: '#a8b4d4' }, starsIn: 34 },
      lotusOpen: false
    });
    return day;
  }
  /* where the sun or the moon stands in each mood, for anyone lighting the picture: {kind, x, y, r} in sheet units */
  M.w8SkyBody = function (mood) {
    return mood === 'dusk' ? { kind: 'sun', x: 960, y: 88, r: 40 } : mood === 'night' ? { kind: 'moon', x: 960, y: 44, r: 23 } : { kind: 'sun', x: 960, y: 44, r: 30 };
  };

  // ------------------------------------------------------------ the kit, at sheet scale
  function kit(A) {
    const INK = A.mix('kajal', 'neel', 0.12), KJ = A.tool('kajal', { wmin: 0.3 }), LF = A.tool('chalk', { wmin: 0.14, t0: 0.08 });
    const K = { INK, KJ, LF };
    // the paper pressed flat under a surface before it is painted, as lime plaster is polished
    K.burnish = (polys, k) => {
      k = k == null ? 0.8 : k;
      const HM = A.HM, W = A.W, H = A.H; if (!HM) return;
      const r = Math.max(2, Math.round(2 * A.S));
      for (const poly of (Array.isArray(polys[0][0]) ? polys : [polys])) {
        const m = A.pushMask(poly, 0); A.popMask();
        if (!m || !m.w || !m.h) continue;
        const x0 = Math.max(0, m.x0 - r), y0 = Math.max(0, m.y0 - r), x1 = Math.min(W, m.x0 + m.w + r), y1 = Math.min(H, m.y0 + m.h + r);
        const bw = x1 - x0, bh = y1 - y0, I = new Float64Array((bw + 1) * (bh + 1));
        for (let y = 0; y < bh; y++) { let row = 0; const src = (y0 + y) * W + x0, o1 = (y + 1) * (bw + 1), o0 = y * (bw + 1); for (let x = 0; x < bw; x++) { row += HM[src + x]; I[o1 + x + 1] = I[o0 + x + 1] + row; } }
        for (let y = 0; y < m.h; y++) {
          const Y = m.y0 + y; if (Y < 0 || Y >= H) continue;
          for (let x = 0; x < m.w; x++) {
            const d = m.d[y * m.w + x]; if (!d) continue;
            const X = m.x0 + x; if (X < 0 || X >= W) continue;
            const ax = Math.max(0, X - r - x0), ay = Math.max(0, Y - r - y0), bx = Math.min(bw, X + r + 1 - x0), by = Math.min(bh, Y + r + 1 - y0);
            const mean = (I[by * (bw + 1) + bx] - I[ay * (bw + 1) + bx] - I[by * (bw + 1) + ax] + I[ay * (bw + 1) + ax]) / ((bx - ax) * (by - ay));
            const i = Y * W + X, v = 0.5 + clamp((HM[i] - mean) * k, -0.24, 0.24);
            HM[i] += (v - HM[i]) * d / 255;
          }
        }
      }
    };
    // one clean flat colour, laid in three goes with the stick
    K.solid = (p, c, o) => A.fill(p, 'pastel', c, Object.assign({ w: 2.2, p: 1, reach: 1.6, passes: 3, gap: 0.42, ang: 1.5, streak: 0.1, cv: 0.012 }, o));
    // the contour in two goes: one even unbroken line, then a swell where the form turns from the light
    K.ink = (poly, w, o) => {
      o = o || {};
      const closed = o.closed !== false, c = o.c || INK;
      let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; } cx /= poly.length; cy /= poly.length;
      if (o.at) { cx = o.at[0]; cy = o.at[1]; }
      const n = poly.length, sw = poly.map((p, i) => {
        const a = poly[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = poly[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
        return clamp((nx * 0.78 + ny * 0.62 + 0.15) / 0.95, 0, 1);
      });
      const ring = closed ? poly.concat(poly.slice(0, 2)) : poly, swr = closed ? sw.concat(sw.slice(0, 2)) : sw;
      A.stroke(ring, KJ, c, { w: w * 0.62, p: 1, tin: closed ? 0 : 0.04, tout: closed ? 0 : 0.06, wob: 0.2 });
      A.stroke(ring.map((p, i) => [p[0], p[1], 0.4 + 0.6 * swr[i]]), KJ, c, { w, p: 1, tin: closed ? 0 : 0.05, tout: closed ? 0 : 0.08, wob: 0.2 });
    };
    K.hair = (p, w, c, o) => A.stroke(p, KJ, c || INK, Object.assign({ w: w || 0.22, p: 0.72, tin: 0.06, tout: 0.08, wob: 0.3 }, o));
    K.dot = (x, y, c, w, o) => A.dot(x, y, 'chalk', c, Object.assign({ w: w || 0.8, p: 0.95 }, o));
    // a ruled row of dots, each a hair off in place and size, never a stamp
    K.dots = (path, step, c, w, o) => {
      o = o || {};
      for (const q of A.along(path, step, 0)) {
        if (o.skip && o.skip(q)) continue;
        K.dot(q.x + A.rr(-0.07, 0.07) * step, q.y + A.rr(-0.06, 0.06) * step, c, w * A.rr(0.88, 1.1), { p: A.rr(0.86, 1) });
      }
    };
    // a leaf: one pull of the stick, pointed at both ends, a little bent
    K.leaf = (x, y, ang, len, wid, c, o) => {
      o = o || {};
      const ca = Math.cos(ang), sa = Math.sin(ang), bend = (o.bend != null ? o.bend : A.rr(-0.18, 0.18)) * len;
      A.stroke([[x, y], [x + ca * len * 0.5 - sa * bend, y + sa * len * 0.5 + ca * bend], [x + ca * len, y + sa * len]], LF, c, { w: wid, p: o.p || 0.96, tin: 0.42, tout: 0.5, wob: 0.12, reach: 1.3 });
    };
    K.floret = (x, y, r, petal, heart) => {
      const a0 = A.rr(0, 1.25);
      for (let i = 0; i < 5; i++) { const a = a0 + i * TAU / 5 + A.rr(-0.08, 0.08); A.dot(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, 'chalk', petal || C.limeLit, { w: r * 0.62 * A.rr(0.92, 1.06), len: r * 0.14, ang: a, p: 0.97 }); }
      K.dot(x, y, heart || C.haldi, r * 0.42);
    };
    return K;
  }

  // a spiral curl, the way a Mewar cloud ends: from outside in
  function curl(A, cx, cy, r, dir, c, w, tool) {
    const pts = [], turns = A.rr(1.0, 1.3), a0 = A.rr(0, TAU);
    for (let i = 0; i <= 36; i++) { const t = i / 36, a = a0 + dir * t * turns * TAU, q = r * (1 - 0.8 * t); pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q * 0.85, 1 - 0.45 * t]); }
    A.stroke(pts, tool || 'chalk', c, { w, p: 0.88, tin: 0.05, tout: 0.4 });
  }
  const arcPts = (cx, cy, rx, ry, a0, a1, m) => { const out = []; for (let i = 0; i <= m; i++) { const a = lerp(a0, a1, i / m); out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return out; };

  /* a long thin Mewar cloud: a row of small lobes along its top, a nearly level foot, each end rolled into a curl,
     white, with a thread of gold wound in each curl.  o.rim: a hair of lapis round its crown, so it reads on a pale sky */
  function cloudBand(A, K, x0, x1, y, th, o) {
    o = o || {};
    const rr = A.rr, L = x1 - x0, fq = rr(1.1, 2.2), ph = rr(0, TAU), amp = rr(0.3, 0.7);
    const foot = xx => y + amp * Math.sin((xx - x0) / L * PI * fq + ph);
    const R1 = th * rr(1.15, 1.3), R2 = th * rr(0.9, 1.05);
    const c1 = [x0 + R1, foot(x0 + R1) - R1], c2 = [x1 - R2, foot(x1 - R2) - R2];
    const spiral = (c, R, turn, m, k0, s) => { const out = []; for (let i = 0; i <= m; i++) { const t = i / m, a = PI / 2 + s * (1 - t) * turn * TAU, r = R * (k0 + (1 - k0) * t); out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.9]); } return out; };
    const la = c1[0] + R1, lb = c2[0] - R2, n = o.n || Math.max(4, Math.round((lb - la) / rr(4.2, 5.8))), cuts = [0];
    for (let i = 1; i < n; i++) cuts.push((i + rr(-0.3, 0.3)) / n);
    cuts.push(1);
    const lobes = [];
    for (let i = 0; i < n; i++) {
      const u0 = lerp(la, lb, cuts[i]), u1 = lerp(la, lb, cuts[i + 1]), rx = (u1 - u0) / 2, cx = (u0 + u1) / 2;
      lobes.push([cx, foot(cx) - th * 0.95, rx, Math.min(rx * 0.9, th * (o.up || 1) * rr(0.45, 0.85))]);
    }
    const sil = arcPts(c1[0], c1[1], R1, R1 * 0.9, PI / 2, 0, 6);
    for (const l of lobes) sil.push(...arcPts(l[0], l[1], l[2], l[3], PI, TAU, 8));
    sil.push(...arcPts(c2[0], c2[1], R2, R2 * 0.9, PI, PI / 2, 6));
    for (let xx = c2[0]; xx > c1[0]; xx -= 1.5) sil.push([xx, foot(xx)]);
    K.burnish(sil);
    A.fill([sil], 'pastel', A.mix(P.cl.body, P.cl.tint, o.body != null ? o.body : 0.22), { w: Math.max(1, th * 0.5), p: 0.92, passes: 3, ang: 0.05, reach: 1.5, streak: 0.1 });
    A.withMask([sil], () => {
      const along = (xa, xb, dy) => { const out = []; for (let xx = xa; xx <= xb; xx += 1.2) out.push([xx, foot(xx) + dy]); return out; };
      A.stroke(along(c1[0], c2[0], -th * 0.22), 'pastel', P.cl.soft, { w: th * 0.5, p: 0.45, streak: 0.1 });
      let xx = c1[0] + R1 * 0.7;
      while (xx < c2[0] - R2 * 0.5) { const e = Math.min(c2[0] - R2 * 0.3, xx + rr(8, 20)); if (e - xx > 2) A.stroke(along(xx, e, -th * 0.58 + rr(-0.15, 0.15)), 'chalk', P.cl.inner, { w: 0.4, p: 0.75, tin: 0.15, tout: 0.2 }); xx = e + rr(2, 6); }
    }, 0);
    const ln = spiral(c1, R1, rr(1.5, 1.8), 34, 0.1, 1);
    for (let xx = c1[0] + 1.2; xx < c2[0]; xx += 1.2) ln.push([xx, foot(xx)]);
    ln.push(...spiral(c2, R2, rr(1.35, 1.6), 30, 0.12, -1).reverse());
    const w = o.w || 0.8;
    A.stroke(ln, 'chalk', P.cl.line, { w, p: 0.96, tin: 0.06, tout: 0.08 });
    for (const l of lobes) {
      A.stroke(arcPts(l[0], l[1], l[2], l[3], PI * 1.03, PI * 1.97, 9), 'chalk', P.cl.line, { w: w * 0.85, p: 0.95, tin: 0.12, tout: 0.12 });
      if (l[2] > 1.8 && A.chance(0.7)) A.stroke(arcPts(l[0], l[1] + l[3] * 0.3, l[2] * 0.5, l[3] * 0.45, PI * 1.15, PI * 1.85, 6), 'chalk', P.cl.inner2, { w: 0.38, p: 0.7, tin: 0.2, tout: 0.3 });
      if (o.rim) K.hair(arcPts(l[0], l[1] - 0.35, l[2] * 1.02, l[3] + 0.3, PI * 1.08, PI * 1.92, 8), 0.24, P.cl.rim, { p: 0.6 });
    }
    if (o.rim) K.hair(ln.map(p => [p[0], p[1] + 0.45]).filter((p, i) => i % 2 === 0), 0.22, P.cl.foot, { p: 0.5 });
    A.stroke(spiral(c1, R1 * 0.68, 1.1, 20, 0.2, 1), 'gold', 'gold', { w: 0.42, p: 0.95, tin: 0.15, tout: 0.25 });
    A.stroke(spiral(c2, R2 * 0.66, 1.0, 16, 0.22, -1), 'gold', 'gold', { w: 0.4, p: 0.95, tin: 0.15, tout: 0.25 });
    let gx = c1[0] + R1 * 0.8;
    while (gx < c2[0] - R2) { const e = Math.min(c2[0] - R2 * 0.5, gx + rr(6, 14)), seg = []; for (let q = gx; q <= e; q += 1.2) seg.push([q, foot(q) - 0.75]); if (seg.length > 1) A.stroke(seg, 'gold', 'gold', { w: 0.32, p: 0.85, tin: 0.2, tout: 0.3 }); gx = e + rr(3, 8); }
  }

  /* a Mewar cloud rolled up into scrolls: two or three round curls on one low foot, each wound in white to its
     heart, lapis in the turns, a broken hair of gold or kajal along its crown, a line of neel under its foot, and
     a thin tail ending in a hook.  x, y = the middle of its foot, s = its height */
  function cloudScroll(A, K, x, y, s, o) {
    o = o || {};
    const rr = A.rr, dir = o.dir || 1, n = o.n || 2;
    const Rr = [s * rr(0.5, 0.58), s * rr(0.34, 0.43), s * rr(0.25, 0.32), s * rr(0.36, 0.42), s * rr(0.22, 0.27)].slice(0, n), Cc = [];
    let cx = x + dir * s * rr(0.25, 0.4);
    for (let i = 0; i < n; i++) {
      if (i) cx -= dir * (Rr[i - 1] * rr(0.7, 0.84) + Rr[i] * rr(0.62, 0.78));
      Cc.push([cx + rr(-0.2, 0.2), y - Rr[i] * rr(0.8, 0.94), Rr[i]]);
    }
    const foot = xx => y + 0.22 * Math.sin(xx * 0.55 + s);
    const xa = Math.min(...Cc.map(c => c[0] - c[2])) + 0.05, xb = Math.max(...Cc.map(c => c[0] + c[2])) - 0.05, top = [], bot = [], own = [];
    for (let xx = xa; xx <= xb + 1e-6; xx += 0.3) {
      let tp = 1e9, k = -1;
      Cc.forEach((c, i) => { const dx = xx - c[0]; if (Math.abs(dx) < c[2]) { const h = Math.sqrt(c[2] * c[2] - dx * dx) * 0.92; if (c[1] - h < tp) { tp = c[1] - h; k = i; } } });
      if (k < 0) continue;
      top.push([xx, tp]); own.push(k); bot.push([xx, Math.max(tp + 0.6, foot(xx))]);
    }
    const sil = top.concat(bot.slice().reverse());
    K.burnish(sil);
    A.fill(sil, 'pastel', A.mix(A.mix(P.cl.body, P.cl.ice, rr(0.3, 0.55)), P.cl.tint, rr(0.06, 0.16)), { w: Math.max(0.8, s * 0.12), p: 0.96, passes: 3, reach: 1.55, ang: rr(-0.3, 0.3), streak: 0.1 });
    const sh = A.mix(P.cl.turn, o.cool ? P.cl.turnCool : P.cl.tint, rr(0.18, 0.32));
    A.withMask(sil, () => {
      A.stroke([[xa, y - 0.5], [(xa + xb) / 2, y - 0.8], [xb, y - 0.45]], 'side', sh, { w: Math.max(1.4, s * 0.22), p: 0.8, streak: 0.2 });
      for (const c of Cc) { const arc = []; for (let k = 0; k <= 8; k++) { const a = lerp(-0.1, 1.9, k / 8) * (dir > 0 ? 1 : -1) + (dir > 0 ? 0 : PI); arc.push([c[0] + Math.cos(a) * c[2] * 0.8, c[1] + Math.sin(a) * c[2] * 0.8]); } A.stroke(arc, 'side', sh, { w: c[2] * 0.42, p: 0.6, tin: 0.2, tout: 0.3, streak: 0.2 }); }
      A.blend(sil, { r: 0.9, k: 0.3, ang: 0.2 });
    }, 0);
    Cc.forEach((c, i) => {
      curl(A, c[0] + rr(-0.15, 0.15), c[1] + c[2] * 0.06, c[2] * rr(0.72, 0.82), i % 2 ? -dir : dir, A.mix(P.cl.turn, P.cl.tint, rr(0.15, 0.35)), Math.max(0.42, c[2] * 0.12));
      if (!i) { const g = []; const a0 = rr(0, TAU); for (let k = 0; k <= 14; k++) { const t = k / 14, a = a0 + dir * t * 1.1 * TAU, q = c[2] * 0.42 * (1 - 0.7 * t); g.push([c[0] + Math.cos(a) * q, c[1] + c[2] * 0.06 + Math.sin(a) * q * 0.85]); } A.stroke(g, 'gold', 'gold', { w: 0.42, p: 0.9, tin: 0.15, tout: 0.3 }); }
    });
    let s0 = 0;
    for (let i = 1; i <= top.length; i++) {
      if (i < top.length && own[i] === own[s0]) continue;
      const run = top.slice(s0, i);
      if (run.length > 3) A.stroke(run, 'chalk', P.cl.line, { w: Math.max(0.55, s * 0.07), p: 0.95, tin: 0.1, tout: 0.2 });
      s0 = i;
    }
    const edge = o.edge || 'gold';
    let j = Math.floor(rr(0, 4));
    while (j < top.length - 3) {
      const e = Math.min(top.length - 1, j + Math.floor(rr(6, 16))), seg = top.slice(j, e + 1).map(p => [p[0], p[1] - 0.35]);
      if (seg.length > 2) A.stroke(seg, edge === 'gold' ? 'gold' : 'kajal', edge === 'gold' ? 'gold' : A.mix('kajal', 'neel', 0.35), { w: edge === 'gold' ? 0.4 : 0.3, p: 0.85, tin: 0.2, tout: 0.25 });
      j = e + Math.floor(rr(2, 6));
    }
    if (o.rim) K.hair(top.filter((p, i) => i % 3 === 0).map(p => [p[0], p[1] - 0.12]), 0.24, P.cl.rim, { p: 0.55 });
    let fx = xa + rr(0, 1);
    while (fx < xb - 1) { const e = Math.min(xb, fx + rr(3, 8)), seg = []; for (let q = fx; q <= e; q += 0.8) seg.push([q, foot(q) + 0.35]); if (seg.length > 1) A.stroke(seg, 'chalk', P.cl.foot, { w: 0.42, p: 0.8, tin: 0.15, tout: 0.2 }); fx = e + rr(0.6, 2); }
    const tl = Cc[Cc.length - 1], tx = tl[0] - dir * tl[2] * 0.6, L = s * rr(1.3, 2.2), hy = y - rr(0.2, 0.9);
    const tail = []; for (let k = 0; k <= 10; k++) { const t = k / 10; tail.push([tx - dir * L * t, lerp(y - 0.3, hy, t) + 0.25 * Math.sin(t * PI * 2 + s), 1 - 0.6 * t]); }
    A.stroke(tail, 'chalk', A.mix(P.cl.body, P.cl.tint, 0.2), { w: Math.max(0.5, s * 0.08), p: 0.88, tin: 0.05, tout: 0.35 });
    A.stroke(tail.slice(2).map(p => [p[0], p[1] + 0.55]), 'chalk', P.cl.inner, { w: 0.35, p: 0.65, tin: 0.2, tout: 0.4 });
    const he = tail[tail.length - 1];
    curl(A, he[0] - dir * 0.6, he[1] - 0.5, rr(0.7, 1.0), -dir, A.mix(P.cl.turn, P.cl.tint, 0.3), 0.36);
    return { xa, xb, foot };
  }

  /* a big Mewar cloud: a row of scroll curls on one foot, and under the foot its belly, a band of the turn colour
     with three white lines drawn along it, each rolled into a curl at one end.  o.rain: a fringe of fine rain under
     it, counted, slanting with the wind */
  function cloudBank(A, K, x, y, s, o) {
    o = o || {};
    const g = cloudScroll(A, K, x, y, s, o), xa = g.xa + s * 0.12, xb = g.xb - s * 0.08, bh = s * 0.3, L = xb - xa;
    const dep = xx => { const t = clamp((xx - xa) / L, 0, 1); return bh * Math.pow(Math.sin(PI * t), 0.7) * (1 - 0.25 * t); };
    const top = [], bot = [];
    for (let xx = xa; xx <= xb + 1e-6; xx += 0.6) { top.push([xx, g.foot(xx) + 0.25]); bot.push([xx, g.foot(xx) + 0.25 + dep(xx)]); }
    const belly = top.concat(bot.slice().reverse());
    K.burnish(belly, 0.3);
    A.fill(belly, 'pastel', A.mix(P.cl.turn, P.cl.inner, 0.5), { w: Math.max(0.6, s * 0.08), p: 0.95, reach: 1.5, passes: 3, gap: 0.42, ang: 0.03, streak: 0.06 });
    for (let j = 1; j <= 3; j++) {
      const f = j / 4, a = xa + L * (0.06 + 0.05 * j), b = xb - L * (0.08 + 0.04 * (3 - j)), ln = [];
      for (let xx = a; xx <= b; xx += 0.8) ln.push([xx, g.foot(xx) + 0.25 + dep(xx) * f]);
      if (ln.length < 3) continue;
      A.stroke(ln, 'chalk', P.cl.line, { w: 0.34, p: 0.82, tin: 0.12, tout: 0.08 });
      const e = j % 2 ? ln[ln.length - 1] : ln[0];
      curl(A, e[0] + (j % 2 ? 0.7 : -0.7), e[1] - 0.15, 0.75, j % 2 ? 1 : -1, P.cl.line, 0.3);
    }
    K.hair(bot.filter((p, i) => i % 2 === 0), 0.24, A.mix(P.cl.rim, K.INK, 0.2), { p: 0.62 });
    if (o.rain) {
      // the rain: fine lines in counted rows, each a hair different in length, a dot of light at some ends
      const R = STAGE.rng(o.rain);
      for (let xx = xa + 1.2; xx < xb - 1; xx += 1.45 * R.rr(0.9, 1.1)) {
        const y0 = g.foot(xx) + 0.6 + dep(xx), Ln = s * R.rr(0.55, 1.05) * (0.55 + 0.45 * Math.sin(PI * (xx - xa) / L));
        A.stroke([[xx, y0], [xx - Ln * 0.16, y0 + Ln]], 'chalk', A.mix(P.cl.inner, P.cl.tint, 0.3), { w: 0.22, p: 0.6, tin: 0.1, tout: 0.6 });
        if (R.chance(0.25)) K.dot(xx - Ln * 0.2, y0 + Ln + 0.9, P.cl.line, 0.36, { p: 0.8 });
      }
    }
  }

  // ------------------------------------------------------------ the sky over the rim
  // the sky's ground in three flat colours, each laid over the last lower down and the joins rubbed together
  function skyGround(A, K, W) {
    const poly = rect(-12, -12, W + 12, 140);
    K.burnish(poly, 0.22);
    K.solid(poly, P.sky[0], { w: 7, ang: 0.06, passes: 3, gap: 0.4 });
    // laid down in seven bands, each a step warmer toward the horizon, each join rubbed into the next
    const n = 7, col = t => t < 0.5 ? A.mix(P.sky[0], P.sky[1], t * 2) : A.mix(P.sky[1], P.sky[2], (t - 0.5) * 2);
    for (let i = 1; i <= n; i++) {
      const y0 = 34 + i * 10;
      A.fill(rect(-12, y0, W + 12, 140), 'pastel', col(i / n), { w: 6, p: 0.94, reach: 1.3, passes: 3, ang: 0.04, streak: 0.06 });
    }
    for (let i = 1; i <= n; i++) { const y0 = 34 + i * 10; A.blend(rect(-12, y0 - 6, W + 12, y0 + 6), { r: 4.5, k: 0.45, ang: 0.03, len: 120 }); }
  }

  // the lapis band along the top, its foot a rolled line of little white scallops, cloud bands drawn out in it
  function lapisBand(A, K, W) {
    const x0 = -12, x1 = W + 12, B = P.band;
    const foot = x => 33 + 1.4 * Math.sin(x / 41 + 0.6) + 0.8 * Math.sin(x / 17 + 2);
    const edge = []; for (let x = x1; x >= x0; x -= 3) edge.push([x, foot(x)]);
    const poly = [[x0, -12], [x1, -12]].concat(edge);
    K.burnish(poly, 0.22);
    K.solid(poly, B.field, { w: 6, ang: 0.04, passes: 3 });
    const low = [[x0, 16], [x1, 15]].concat(edge);
    A.fill(low, 'pastel', B.low, { w: 4.5, p: 0.85, reach: 1.4, passes: 2, ang: 0.03, streak: 0.08 });
    A.fill(low.map(p => [p[0], Math.max(p[1], 25)]), 'pastel', B.lowLit, { w: 3, p: 0.5, reach: 1.05, passes: 1, ang: 0.02, streak: 0.08 });
    A.blend(low, { r: 3.5, k: 0.35, ang: 0.02, len: 110 });
    if (P.mood === 'night') stars(A, K, [[x0, -12], [x1, -12], [x1, 30], [x0, 30]], 3);
    // the cloud bands: counted, nine a side, the middle left to the sun's rays; between each pair two gold curls
    const R = STAGE.rng(31337);
    for (const sd of [-1, 1]) {
      let x = sd < 0 ? 14 : 1086, k = 0;
      const lim = sd < 0 ? 836 : 1906;
      while (k < 9) {
        const len = [58, 44, 76, 50, 66, 40, 84, 52, 62][(k + (sd > 0 ? 4 : 0)) % 9] * R.rr(0.94, 1.06);
        if (x + len > lim) break;
        const yf = [14.5, 11.5, 15.5, 12.5, 14, 11, 15, 13, 12][(k + (sd > 0 ? 2 : 0)) % 9] + R.rr(-0.6, 0.6);
        cloudBand(A, K, x, x + len, yf, R.rr(2.2, 2.7), { n: Math.max(5, Math.round(len / R.rr(5, 6.4))), up: R.rr(0.95, 1.15) });
        const gx = x + len + R.rr(9, 13), gy = R.rr(7.5, 10.5);
        if (gx < lim - 10) { curl(A, gx, gy, R.rr(2.2, 2.8), 1, 'gold', 0.42, 'gold'); curl(A, gx + R.rr(5.6, 7), gy + R.rr(1.2, 2.4), R.rr(1.6, 2.1), -1, 'gold', 0.36, 'gold'); }
        // the second row, lower in the band: a small scroll cloud under the gap, turned the other way from its neighbour
        const sx = x + len + R.rr(8, 20);
        if (sx < lim - 14 && sx > (sd < 0 ? 20 : 1100)) cloudScroll(A, K, sx, R.rr(26.5, 28), R.rr(5.6, 7), { n: k % 3 === 1 ? 3 : 2, dir: k % 2 ? 1 : -1, edge: 'gold', cool: true });
        x += len + R.rr(26, 36); k++;
      }
    }
    // the rolled foot
    let x = x0;
    while (x < x1) {
      const L = A.rr(4.6, 7.4), cxl = x + L / 2, r = L / 2, cy = foot(cxl) + 0.4;
      const lobe = A.ellipse(cxl, cy, r * 1.02, r * 0.62, 0, PI, TAU);
      A.fill(lobe, 'pastel', A.mix(P.cl.line, P.cl.tint, A.rr(0.12, 0.3)), { w: 1.3, p: 0.95, reach: 1.45, passes: 2, ang: 0, streak: 0.05 });
      A.stroke(lobe, 'chalk', P.cl.line, { w: 0.6, p: 0.92, tin: 0.1, tout: 0.1 });
      if (r > 2.6) A.stroke(A.ellipse(cxl, cy, r * 0.5, r * 0.3, 0, PI * 1.1, PI * 1.9), 'chalk', P.cl.inner, { w: 0.38, p: 0.72 });
      x += L * A.rr(0.82, 0.95);
    }
    const fl = edge.slice().reverse().map(p => [p[0], p[1] + 0.9]);
    A.stroke(fl, 'chalk', A.mix(P.cl.line, P.cl.tint, 0.35), { w: 0.8, p: 0.62 });
    K.hair(fl.filter((p, i) => i % 2 === 0).map(p => [p[0], p[1] + 0.7]), 0.22, B.hair, { p: 0.45 });
  }

  /* the stars of the night sky, counted: one to each cell of a loose lattice, so they lie evenly and never clump;
     most a small dot of white or gold, one in five a four-pointed star, one in nineteen a gold eight-rayed flower.
     Kept off the moon and its halo.  poly = where; seed = which lattice */
  function stars(A, K, poly, seed) {
    const R = STAGE.rng(9100 + seed), bb = A.bbox([poly]), cell = seed === 3 ? 26 : 21, mb = P.body;
    A.withMask(poly, () => {
      let k = 0;
      for (let y = bb[1] + cell * 0.5; y < bb[3]; y += cell * 0.8) for (let x = bb[0] + (k % 2 ? cell * 0.5 : 0) + R.rr(0, cell * 0.3); x < bb[2]; x += cell) {
        const sx = x + R.rr(-0.38, 0.38) * cell, sy = y + R.rr(-0.32, 0.32) * cell * 0.8, n = k++;
        if (Math.hypot(sx - mb.x, (sy - mb.y) * 1.1) < mb.r * 2.7) continue;
        const gold = n % 3 === 0, c = gold ? '#e8c060' : '#f2f2ea';
        if (n % 19 === 7) {
          for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, L = i % 2 ? 1.2 : 2.1; A.stroke([[sx, sy], pol(sx, sy, L, a)], 'chalk', '#ecc860', { w: 0.42, p: 0.95, tin: 0.05, tout: 0.6 }); }
          K.dot(sx, sy, '#fff6d8', 0.75);
        } else if (n % 5 === 2) {
          const L = R.rr(1.3, 1.8), a0 = R.rr(-0.15, 0.15);
          for (let i = 0; i < 4; i++) { const a = a0 + i * PI / 2; A.stroke([[sx, sy], pol(sx, sy, L * (i % 2 ? 0.8 : 1), a)], 'chalk', c, { w: 0.4, p: 0.95, tin: 0.05, tout: 0.7 }); }
          K.dot(sx, sy, c, 0.5);
        } else K.dot(sx, sy, c, R.rr(0.5, 0.85), { p: R.rr(0.75, 0.98) });
      }
    }, 0);
  }

  /* the sun: rays turning round it, long straight ones with a thread of gold down each and short wavy flames
     between them; a ring with a row of white dots; a ring of sixteen lotus petals; a deep heart with a white
     rosette.  No face.  Its colours are the mood's: haldi and sindoor at noon, saffron and lac at dusk. */
  function sun(A, K, S0) {
    const x = S0.x, y = S0.y, r = S0.r, R = STAGE.rng(4401), SC = P.sun;
    const N = 24;
    for (let i = 0; i < N; i++) {
      const a = (i + 0.5) / N * TAU + R.rr(-0.012, 0.012), r1 = r * 1.13, r2 = r * R.rr(1.7, 1.86);
      const pts = []; for (let k = 0; k <= 16; k++) { const t = k / 16, rad = lerp(r1, r2, t), off = 1.05 * Math.sin(t * PI * 3) * (1 - 0.4 * t); pts.push([x + Math.cos(a) * rad - Math.sin(a) * off, y + Math.sin(a) * rad + Math.cos(a) * off, 1 - 0.55 * t]); }
      A.stroke(pts, 'chalk', A.mix(SC.flame[0], SC.flame[1], R.rr(0, 0.3)), { w: 1.15, p: 0.95, tin: 0.04, tout: 0.5 });
      A.stroke(pts.slice(1, 12), 'chalk', SC.flame2, { w: 0.42, p: 0.85, tin: 0.1, tout: 0.4 });
    }
    for (let i = 0; i < N; i++) {
      const a = i / N * TAU + R.rr(-0.01, 0.01), r1 = r * 1.12, r2 = r * R.rr(2.16, 2.3), hw = 1.2 / r1;
      const ray = [pol(x, y, r1, a - hw), pol(x, y, (r1 + r2) * 0.5, a - hw * 0.42), pol(x, y, r2, a), pol(x, y, (r1 + r2) * 0.5, a + hw * 0.42), pol(x, y, r1, a + hw)];
      K.burnish(ray);
      A.fill(ray, 'pastel', A.mix(SC.ray[0], SC.ray[1], R.rr(0, 0.5)), { w: 0.9, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang: a, streak: 0.05 });
      K.hair([ray[0], ray[1], ray[2]], 0.2, A.mix(SC.rayEdge, 'kajal', 0.2), { p: 0.55 });
      K.hair([ray[2], ray[3], ray[4]], 0.26, A.mix(SC.rayEdge, 'kajal', 0.3), { p: 0.7 });
      A.stroke([pol(x, y, r1 + 0.6, a), pol(x, y, lerp(r1, r2, 0.82), a)], 'gold', 'gold', { w: 0.32, p: 0.9, tin: 0.05, tout: 0.4 });
    }
    // the disc
    const ringO = A.ellipse(x, y, r * 1.1, r * 1.1), ringI = A.ellipse(x, y, r * 0.995, r * 0.995);
    K.burnish(ringO);
    K.solid([ringO, ringI], SC.ring, { w: 1.4, ang: 0.3 });
    K.solid(ringI, SC.disc, { w: 2.4, ang: 1.1 });
    // sixteen lotus petals pointing out
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU + PI / 16 + R.rr(-0.01, 0.01), da = TAU / 32 * 0.92, ri = r * 0.55, ro = r * R.rr(0.9, 0.93);
      const pet = A.spline([pol(x, y, ri, a - da), pol(x, y, (ri + ro) * 0.52, a - da * 1.05), pol(x, y, ro, a), pol(x, y, (ri + ro) * 0.52, a + da * 1.05), pol(x, y, ri, a + da)], false, 0.4);
      A.fill(pet, 'pastel', A.mix(SC.petal[0], SC.petal[1], R.rr(0.1, 0.3)), { w: 1, p: 1, reach: 1.55, passes: 2, gap: 0.42, ang: a + PI / 2, streak: 0.05 });
      if (Math.cos(a) * 0.7 + Math.sin(a) * 0.7 > 0.1) A.stroke([pol(x, y, ri + 1, a - da * 0.5), pol(x, y, ro - 2, a - da * 0.15)], 'chalk', SC.discSh, { w: 0.9, p: 0.5, tin: 0.2, tout: 0.4 });
      A.stroke([pol(x, y, ri + 0.8, a), pol(x, y, ro - 1.4, a)], 'chalk', SC.vein, { w: 0.5, p: 0.85, tin: 0.2, tout: 0.4 });
      K.ink(pet, 0.26, { c: SC.petalEdge, at: [x, y] });
      K.dot(...pol(x, y, r * 0.95, a + PI / 16), SC.vein, 0.55);
    }
    const heart = A.ellipse(x, y, r * 0.55, r * 0.55);
    K.solid(heart, SC.heart, { w: 1.6, ang: 0.8 });
    const thread = A.ellipse(x, y, r * 0.565, r * 0.565);
    for (let i = 0; i < thread.length - 1; i += 6) A.stroke(thread.slice(i, i + 5), 'gold', 'gold', { w: 0.3, p: 0.9, tin: 0.1, tout: 0.1 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + PI / 8, tip = pol(x, y, r * 0.44, a), b0 = pol(x, y, r * 0.1, a); A.stroke([b0, pol(x, y, r * 0.27, a), tip], LFtool(A), SC.rosette, { w: r * 0.17, p: 1, tin: 0.4, tout: 0.5, wob: 0.1, reach: 1.4 }); K.hair([pol(x, y, r * 0.13, a), pol(x, y, r * 0.4, a)], 0.18, SC.rayEdge, { p: 0.5 }); }
    K.dot(x, y, SC.ring, r * 0.2);
    K.dot(x - 0.4, y - 0.4, SC.vein, r * 0.08);
    // white dots on the ring, then the contour
    for (let i = 0; i < 44; i++) { const a = i / 44 * TAU + R.rr(-0.012, 0.012); K.dot(...pol(x, y, r * 1.05, a), SC.ringDot, 0.72 * R.rr(0.9, 1.1)); }
    K.ink(ringO, 0.42, { at: [x, y] });
    K.hair(ringI.filter((p, i) => i % 2 === 0), 0.22, A.mix(SC.ring, 'kajal', 0.5), { p: 0.6 });
  }

  /* the full moon over the chhatri: a soft glow rubbed round it in pale lapis (three washes one inside another, each
     reach wandering, the stick's grain in them, no edge drawn anywhere), then the disc in ivory, its right side a shade
     cooler, a few soft grey seas on it, its contour.  No face, no ring, no rays.
     The marks of the old halo (two bands with gold dots, the rays, the dot ring, the gold thread) are still laid in
     their old order, but under an empty mask: they paint nothing, and the brush's random stream after the moon is as
     it was, so nothing else in the night sky moves. */
  function moon(A, K, S0) {
    const x = S0.x, y = S0.y, r = S0.r, R = STAGE.rng(4402);
    const ghost = fn => A.withMask([[-9000, -9000], [-8990, -9000], [-8990, -8990], [-9000, -8990]], fn, 0);
    const ring = (rad, m) => { const out = []; for (let i = 0; i < m; i++) { const a = i / m * TAU; out.push(pol(x, y, rad * (1 + 0.012 * Math.sin(a * 5 + rad)), a)); } return out; };
    const h2 = ring(r * 2.25, 90), h1 = ring(r * 1.6, 72);
    ghost(() => {
      K.solid(h2, A.mix(P.sky[0], '#4a5c9e', 0.42), { w: 1.8, ang: 0.4 });
      K.solid(h1, A.mix(P.sky[0], '#6a7cb8', 0.55), { w: 1.6, ang: 0.9 });
      A.blend(h2, { r: 1.4, k: 0.3, ang: 0.5 });
      for (const [rad, m] of [[r * 2.25, 64], [r * 1.6, 48]]) for (let i = 0; i < m; i++) { const a = i / m * TAU + R.rr(-0.01, 0.01); K.dot(...pol(x, y, rad - 0.9, a), '#d8b860', 0.55 * R.rr(0.9, 1.1)); }
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + PI / 16, L = i % 2 ? r * 0.2 : r * 0.34; A.stroke([pol(x, y, r * 1.14, a), pol(x, y, r * 1.14 + L, a)], 'chalk', '#e6e8f2', { w: 0.5, p: 0.8, tin: 0.05, tout: 0.6 }); }
    });
    moonGlow(A, x, y, r);
    const disc = A.ellipse(x, y, r, r);
    K.burnish(disc);
    K.solid(disc, '#f4efdc', { w: 2.2, ang: 1.5, streak: 0.03 });
    A.withMask(disc, () => {
      A.pushMaskOutside(A.ellipse(x - r * 0.3, y - r * 0.12, r * 1.02, r * 1.04));
      A.fill(rect(x - r, y - r, x + r, y + r), 'pastel', '#e2e0e2', { w: 1.6, p: 0.9, reach: 1.5, passes: 3, gap: 0.42, ang: 1.5, streak: 0.03 });
      A.popMask();
      // a few soft grey markings, drawn as a painter would show the moon's seas, not as a face
      for (const [mx, my, mr, a] of [[-0.25, -0.2, 0.22, 0.4], [0.18, 0.12, 0.17, -0.3], [-0.05, 0.38, 0.12, 0.1], [0.36, -0.3, 0.1, 0.8]]) A.dot(x + mx * r, y + my * r, 'pastel', '#d8d6d0', { w: r * mr * 1.6, len: r * mr * 0.4, ang: a, p: 0.55 });
    }, 0);
    ghost(() => { for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + R.rr(-0.01, 0.01); K.dot(...pol(x, y, r * 0.9, a), '#fffdf4', 0.55 * R.rr(0.9, 1.1)); } });
    K.ink(disc, 0.34, { at: [x, y], c: A.mix(K.INK, '#3a4a8a', 0.4) });
    const th = A.ellipse(x, y, r * 1.05, r * 1.05);
    ghost(() => { for (let i = 0; i < th.length - 1; i += 5) A.stroke(th.slice(i, i + 4), 'gold', 'gold', { w: 0.3, p: 0.9, tin: 0.1, tout: 0.1 }); });
  }
  /* the glow, laid straight into the paint (it draws on no random numbers): three washes of paler lapis, the outer
     wide and faint, the inner close and pale; each wash's reach wanders on slow lobes found round the moon, its rim
     soft, and the pastel's grain runs across it in short level strokes, so it reads rubbed on, never as a ruled disc */
  function moonGlow(A, x, y, r) {
    const hx = c => { const v = parseInt(c.slice(1), 16); return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]; };
    const WS = [[2.9, 0.85, hx('#33458a'), 0.5], [1.9, 0.7, hx('#5b6ca8'), 0.42], [1.32, 0.55, hx('#a3b0da'), 0.5]];
    const [cx0, cy0, cx1, cy1] = A.clip(), S = A.S, W = A.W, ext = 3.2 * r;
    const X0 = Math.max(cx0, Math.floor((x - ext) * S)), X1 = Math.min(cx1, Math.ceil((x + ext) * S)), Y0 = Math.max(cy0, Math.floor((y - ext) * S)), Y1 = Math.min(cy1, Math.ceil((y + ext) * S));
    for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) {
      const px = (X + 0.5) / S, py = (Y + 0.5) / S, dx = px - x, dy = py - y, d = Math.hypot(dx, dy) / r;
      if (d > 3.2) continue;
      const cs = d > 1e-6 ? dx / (d * r) : 1, sn = d > 1e-6 ? dy / (d * r) : 0;
      const grain = 0.78 + 0.44 * A.noise2(px / 1.7, py / 0.32, 41) * (0.6 + 0.4 * A.noise2(px / 0.6, py / 0.25, 42));
      const i = Y * W + X;
      let cr = A.R[i], cg = A.G[i], cb = A.B[i];
      for (let q = 0; q < 3; q++) {
        const w = WS[q], lob = 1 + 0.13 * (A.noise2(cs * 1.4 + q * 3.7, sn * 1.4 + 0.6, 43) - 0.5) * 2 + 0.05 * (A.noise2(cs * 4 + q, sn * 4 + 2.1, 44) - 0.5) * 2;
        const reach = w[0] * lob, inner = reach * (1 - w[1]);
        const t = (d - inner) / (reach - inner), v = d <= inner ? 1 : t >= 1 ? 0 : 1 - t * t * (3 - 2 * t);
        const a = v * w[3] * grain; if (a <= 0) continue;
        cr += (w[2][0] - cr) * a; cg += (w[2][1] - cg) * a; cb += (w[2][2] - cb) * a;
      }
      A.R[i] = cr; A.G[i] = cg; A.B[i] = cb;
    }
  }
  function LFtool(A) { return A.tool('chalk', { wmin: 0.14, t0: 0.08 }); }

  /* the clouds of the sky, twelve of them, no two alike: scrolls, and four big clouds with lined bellies, two of them
     trailing rain; laid so the sun stands clear over the chhatri */
  function skyClouds(A, K) {
    cloudScroll(A, K, 46, 50, 10.5, { n: 2, dir: 1, edge: 'gold', rim: true, cool: true });
    cloudBank(A, K, 176, 78, 11, { n: 4, dir: -1, edge: 'kajal', rim: true });
    cloudScroll(A, K, 338, 54, 14, { n: 3, dir: -1, edge: 'kajal', rim: true });
    cloudScroll(A, K, 586, 66, 11.5, { n: 2, dir: 1, edge: 'gold', rim: true, cool: true });
    cloudBank(A, K, 724, 50, 9.5, { n: 3, dir: 1, edge: 'gold', rim: true, cool: true, rain: 71 });
    cloudScroll(A, K, 806, 88, 9.4, { n: 2, dir: -1, edge: 'kajal', rim: true });
    cloudScroll(A, K, 1120, 86, 9.8, { n: 2, dir: 1, edge: 'kajal', rim: true });
    cloudBank(A, K, 1206, 52, 10, { n: 3, dir: -1, edge: 'kajal', rim: true, rain: 72 });
    cloudScroll(A, K, 1352, 68, 12.5, { n: 3, dir: 1, edge: 'gold', rim: true, cool: true });
    cloudScroll(A, K, 1606, 50, 13.5, { n: 3, dir: -1, edge: 'kajal', rim: true });
    cloudBank(A, K, 1764, 78, 11, { n: 4, dir: 1, edge: 'gold', rim: true, cool: true });
    cloudScroll(A, K, 1884, 92, 8.6, { n: 2, dir: -1, edge: 'gold', rim: true, cool: true });
  }

  /* an egret in flight, seen from the side and a little from below: the far wing behind the body, the body a long
     white drop, the neck folded back so the head rides on the breast, a yellow bill, the black legs trailing; the near
     wing over the body.  Each wing is a broad root of coverts, a row of five secondaries drawn as small scallops on
     its trailing edge and five primaries at the tip, spread like fingers.  ph: 0 wings up, 1 down, 2 spread back.
     s = 1 is a bird eight units long; dir = 1 flies to the right. */
  function egret(A, K, x, y, s, dir, ph) {
    const T = (u, v) => [x + dir * u * s, y + v * s];
    const white = A.mix(P.cl.body, '#ffffff', 0.4), shade = A.mix(P.cl.body, P.cl.turn, 0.3), INK = A.mix(K.INK, P.cl.turn, 0.2), feather = A.mix(P.cl.body, P.cl.turn, 0.55);
    const wing = (tu, tv, chord, far) => {
      const S = [0.4, -0.35], V = [tu - S[0], tv - S[1]], Lv = Math.hypot(V[0], V[1]), n = [-V[1] / Lv, V[0] / Lv];
      const fwd = n[0] > 0 ? 1 : -1, lead = [], trail = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12, bx = S[0] + V[0] * t, by = S[1] + V[1] * t, bow = 0.32 * Math.sin(PI * t) * fwd;
        lead.push(T(bx + n[0] * bow, by + n[1] * bow));
        const c = chord * (1 - Math.pow(t, 1.5)) + 0.25;
        trail.push(T(bx - c, by + (tv < 0 ? 0.12 : -0.12) * c));
      }
      const poly = lead.concat(trail.slice().reverse());
      A.fill(poly, 'pastel', far ? A.mix(white, shade, 0.45) : white, { w: 0.5 * s, p: 1, reach: 1.5, passes: 2, gap: 0.42, ang: Math.atan2(V[1], V[0]), streak: 0.04 });
      // the secondaries, five scallops on the trailing edge; the primaries, five fingers at the tip
      for (let k = 0; k < 5; k++) {
        const t = 0.08 + k * 0.11, i = Math.round(t * 12), p0 = trail[i], p1 = trail[Math.min(12, i + 1)];
        const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
        K.hair([p0, [mx + (tv < 0 ? 0 : 0) , my + 0.28 * s * (tv < 0 ? 1 : -1)], p1], 0.14, feather, { p: 0.6 });
      }
      for (let k = 0; k < 5; k++) {
        const t = 0.66 + k * 0.075, bx = S[0] + V[0] * t, by = S[1] + V[1] * t, c = chord * (1 - Math.pow(t, 1.5)) + 0.25;
        const a = T(bx - c * 0.25, by), b = T(bx - c * 1.15 - 0.15, by + (tv < 0 ? 0.2 : -0.2) * c + V[1] / Lv * 0.35);
        K.hair([a, b], 0.13, feather, { p: 0.55 });
      }
      K.hair(lead, 0.2, INK, { p: 0.75 });
      K.hair(trail.slice(1), 0.16, A.mix(INK, white, 0.25), { p: 0.6 });
    };
    const W = [[-0.6, -4.6, 1.9, -1.4, -4.1, 1.8], [-0.7, -3.4, 1.7, -1.0, 3.3, 1.7], [-1.9, -2.9, 1.8, -2.7, -1.0, 1.9]][ph % 3];
    wing(W[0], W[1], W[2], true);
    // the legs, trailing
    for (const dv of [0, 0.22]) A.stroke([T(-2.1, 0.42 + dv), T(-4.2, 0.75 + dv), T(-5.6, 0.95 + dv * 1.5)], 'chalk', A.mix('#2a2a24', P.cl.turn, 0.2), { w: 0.2 * s + 0.04, p: 0.9, tin: 0.05, tout: 0.2 });
    K.dot(...T(-5.7, 1.0), '#c8a030', 0.3 * s);
    // the body and the folded neck, the head on the breast
    const body = A.spline([T(-3.3, 0.05), T(-1.8, -0.62), T(0.4, -0.78), T(1.9, -0.5), T(2.6, -0.95), T(3.4, -0.85), T(3.6, -0.35), T(2.8, 0.2), T(1.4, 0.66), T(-0.6, 0.62), T(-2.4, 0.38)], true, 0.3);
    A.fill(body, 'pastel', white, { w: 0.6 * s, p: 1, reach: 1.5, passes: 3, gap: 0.42, ang: 0.1, streak: 0.04 });
    A.withMask(body, () => A.fill([T(-3.5, 0.15), T(2.6, 0.05), T(2.6, 1), T(-3.5, 1)], 'pastel', shade, { w: 0.5 * s, p: 0.8, reach: 1.4, passes: 2, ang: 0.1, streak: 0.04 }), 0);
    A.stroke([T(-2.6, 0.15), T(-3.6, 0.05), T(-3.9, -0.15)], 'chalk', white, { w: 0.42 * s, p: 0.95, tin: 0.1, tout: 0.5 });
    K.hair(body, 0.2, INK, { p: 0.75 });
    // the bill, yellow and long; the eye
    A.stroke([T(3.45, -0.72), T(4.4, -0.62), T(5.4, -0.42)], 'chalk', '#e8b42a', { w: 0.34 * s, p: 1, tin: 0.05, tout: 0.7 });
    K.hair([T(3.5, -0.6), T(5.3, -0.42)], 0.12, A.mix('#8a5a10', INK, 0.3), { p: 0.6 });
    K.dot(...T(3.05, -0.72), INK, 0.24 * s + 0.08);
    wing(W[3], W[4], W[5], false);
  }

  /* two small flights of egrets, counted: five going home to the left over the fort, three to the right toward the
     temple.  Each bird its own size and wing beat. */
  function flights(A, K) {
    if (!P.birds) return;
    const L = [[440, 51, 1.5, 0], [462, 59, 1.42, 2], [483, 49, 1.36, 1], [506, 60, 1.3, 0], [528, 54, 1.24, 2]];
    for (const [x, y, s, ph] of L) egret(A, K, x, y, s, -1, ph);
    const Rt = [[1448, 50, 1.42, 1], [1425, 57, 1.34, 0], [1403, 48, 1.28, 2]];
    for (const [x, y, s, ph] of Rt) egret(A, K, x, y, s, 1, ph);
  }
  /* the hills beyond the rim, the Mewar way: three ranges, each its own colour (lilac far, sage between, rose near)
     and its own rhythm.  Each hill a stack of round rocky lobes, the tall ones behind and the low ones laid over
     them; each lobe one flat colour, a shade on its right shoulder, two or three fold lines inside it following its
     shoulder, and its crest painted: a pale line just inside the dark contour all along it, brighter where the light
     comes over the crown.  lobeGeo gives a lobe's shape, so trees can be stood on its crest before it is painted. */
  function lobeGeo(cx, top, rx, base, lean, ph, e) {
    const ry = base - top;
    const at = (u, k) => { const v = clamp(u + lean * (1 - u * u), -1, 1); return [cx + u * rx * k, base - ry * k * Math.pow(Math.max(0, 1 - v * v), e) + 0.25 * Math.sin(u * 6 + ph) * k]; };
    const crest = []; for (let i = 0; i <= 32; i++) crest.push(at(-1 + 2 * i / 32, 1));
    return { cx, top, rx, base, at, crest };
  }
  // the highest crest of a range at x: the line the eye sees
  function crestAt(range, x) {
    let best = null;
    for (const g of range) {
      const c = g.crest; if (x < c[0][0] || x > c[c.length - 1][0]) continue;
      for (let i = 1; i < c.length; i++) if (c[i][0] >= x) { const t = (x - c[i - 1][0]) / ((c[i][0] - c[i - 1][0]) || 1), yy = lerp(c[i - 1][1], c[i][1], t); if (best == null || yy < best) best = yy; break; }
    }
    return best;
  }
  function lobe(A, K, g, cols, o) {
    o = o || {};
    const { at, crest, rx, cx, base } = g;
    const poly = crest.concat([[cx + rx, base + 4], [cx - rx, base + 4]]);
    K.burnish(poly, 0.35);
    K.solid(poly, cols[0], { w: Math.max(1.2, rx * 0.08), ang: 0.35, passes: 3 });
    A.withMask(poly, () => {
      // the shade on the right shoulder, laid flat
      const sh = []; for (let i = 14; i <= 32; i++) sh.push(at(-1 + 2 * i / 32, 1));
      for (let i = 32; i >= 14; i--) { const p = at(-1 + 2 * i / 32, 0.7); sh.push([p[0] + rx * 0.08, p[1] + 1]); }
      A.fill(sh, 'pastel', A.mix(cols[0], cols[1], 0.45), { w: 1.2, p: 0.75, reach: 1.3, passes: 2, ang: 1.1, streak: 0.06 });
      A.blend(sh, { r: 1.2, k: 0.35, ang: 1.1 });
      // fold lines inside, each one smaller and lower, the shoulder of the rock under it
      const nf = rx > 22 ? 3 : 2;
      for (let j = 1; j <= nf; j++) {
        const k = 1 - j * (0.62 / nf), f = [];
        for (let i = 4; i <= 28; i++) { const u = -1 + 2 * i / 32, p = at(u, k); f.push([p[0] + A.rr(-0.05, 0.05), p[1] + j * 0.6, 0.55 + 0.45 * (1 - Math.abs(u))]); }
        A.stroke(f, 'chalk', A.mix(cols[1], 'kajal', 0.1), { w: 0.42, p: 0.72, tin: 0.25, tout: 0.25, wob: 0.25 });
        A.stroke(f.slice(1, Math.round(f.length * 0.42)).map(p => [p[0] - 0.15, p[1] - 0.6, p[2]]), 'chalk', cols[2], { w: 0.36, p: 0.62, tin: 0.2, tout: 0.4 });
      }
    }, 0);
    // the painted crest: a pale line just inside, all along; brighter over the lit crown; then the contour
    A.stroke(crest.slice(1, 32).map(p => [p[0], p[1] + 0.75]), 'chalk', A.mix(cols[2], cols[0], 0.3), { w: 0.42, p: 0.72, tin: 0.15, tout: 0.15 });
    A.stroke(crest.slice(3, 15).map(p => [p[0] + 0.25, p[1] + 0.6]), 'chalk', cols[2], { w: 0.66, p: 0.85, tin: 0.25, tout: 0.4 });
    K.hair(crest, 0.32, A.mix(cols[1], 'kajal', 0.42), { p: 0.76, tin: 0.04, tout: 0.04 });
    if (o.bush) {
      const u = A.rr(-0.35, 0.25), q = at(u, 1);
      const n = A.ri(3, 5);
      for (let i = 0; i < n; i++) K.dot(q[0] + (i - (n - 1) / 2) * 1.0 + A.rr(-0.15, 0.15), q[1] - 0.3 - (i % 2) * 0.75, A.mix(A.mix('#3f6b2a', '#24462a', A.rr(0, 0.6)), (P.treeTint || ['#000', 0])[0], (P.treeTint || ['#000', 0])[1]), A.rr(1.15, 1.45));
      K.dot(q[0] - 0.8, q[1] - 1.2, '#86a850', 0.55);
      K.hair([[q[0] - (n / 2) * 1.0 - 0.4, q[1] + 0.25], [q[0] + (n / 2) * 1.0 + 0.4, q[1] + 0.25]], 0.18, A.mix(cols[1], 'kajal', 0.4), { p: 0.5 });
    }
  }

  /* the fort on the far hill to the left, small and faint, the colour of the far range lifted with lime: a curtain
     wall riding the crest with its merlons, three round bastions, a palace on the height with a row of small arched
     windows, two domes and a pennant */
  function fort(A, K, cx, crest, cols) {
    const wc = A.mix(C.lime, cols[0], 0.5), sh = A.mix(cols[0], cols[1], 0.3), ln = A.mix(cols[1], 'kajal', 0.3), win = A.mix(cols[1], 'kajal', 0.4);
    const x0 = cx - 22, x1 = cx + 22, h = 3.4, cy = x => crest(x) + 1.2;
    const fl = (poly, c, o) => A.fill(poly, 'pastel', c, Object.assign({ w: 0.45, p: 0.95, reach: 1.5, passes: 2, gap: 0.42, ang: 0.05, streak: 0.04 }, o));
    const bot = [], tp = [];
    for (let x = x0; x <= x1 + 1e-6; x += 1) { bot.push([x, cy(x) + 1.5]); tp.push([x, cy(x) - h]); }
    const wall = tp.concat(bot.slice().reverse());
    K.burnish(wall, 0.3);
    fl(wall, wc);
    for (let x = x0 + 0.5; x < x1 - 0.6; x += 1.6) { const y = cy(x + 0.4) - h; fl(rect(x, y - 0.95, x + 0.8, y + 0.2), wc, { w: 0.3 }); }
    K.hair(tp, 0.16, ln, { p: 0.5 });
    for (let x = x0 + 3; x < x1 - 2; x += 4.2) K.dot(x, cy(x) - h * 0.45, win, 0.26, { p: 0.6 });
    // the palace on the height
    const px = cx - 5.5, py = cy(px) - h + 0.4, pw = 6.2, ph = 6.6;
    const blk = rect(px - pw, py - ph, px + pw, py);
    K.burnish(blk, 0.3);
    fl(blk, wc);
    A.withMask(blk, () => fl(rect(px + pw * 0.35, py - ph - 1, px + pw + 1, py + 1), sh, { p: 0.8 }), 0);
    fl(rect(px - pw - 0.5, py - ph - 0.7, px + pw + 0.5, py - ph + 0.2), wc, { w: 0.3 });
    K.hair([[px - pw - 0.5, py - ph + 0.25], [px + pw + 0.5, py - ph + 0.25]], 0.14, ln, { p: 0.55 });
    for (let k = 0; k < 5; k++) { const wx = px - pw + 1.4 + k * (pw * 2 - 2.8) / 4, wy = py - ph * 0.52; const ar = M.w8Arch(wx - 0.55, wx + 0.55, wy + 1.1, wy - 0.2, wy - 0.75, 0); fl(ar, win, { w: 0.25 }); }
    // a jharokha on brackets, and the domes
    const jx = px - 1.2, jy = py - ph * 0.18;
    fl(rect(jx - 1.6, jy - 2.4, jx + 1.6, jy), wc, { w: 0.3 }); K.hair(rect(jx - 1.6, jy - 2.4, jx + 1.6, jy).concat([[jx - 1.6, jy - 2.4]]), 0.12, ln, { p: 0.5 });
    for (const [dx, dr] of [[-2.6, 2.4], [3.4, 1.7]]) {
      const dxc = px + dx, dyb = py - ph - 0.7, dome = arcPts(dxc, dyb, dr, dr * 1.15, PI, TAU, 12);
      fl(dome.concat([[dxc + dr, dyb], [dxc - dr, dyb]]), wc, { w: 0.3 });
      A.withMask(dome.concat([[dxc + dr, dyb]]), () => fl(rect(dxc + dr * 0.15, dyb - dr * 1.3, dxc + dr + 1, dyb + 0.2), sh, { w: 0.3, p: 0.75 }), 0);
      K.hair(dome, 0.14, ln, { p: 0.55 });
      K.hair([[dxc, dyb - dr * 1.15], [dxc, dyb - dr * 1.15 - 0.9]], 0.14, ln, { p: 0.6 });
    }
    const fx = px - 2.6, fy = py - ph - 0.7 - 2.4 * 1.15 - 0.6;
    K.hair([[fx, fy], [fx, fy - 4.2]], 0.14, ln, { p: 0.65 });
    fl([[fx, fy - 4.2], [fx + 3.4, fy - 3.4], [fx, fy - 2.6]], A.mix(C.sindoor, cols[0], 0.45), { w: 0.3 });
    // the bastions, round, each with its merlons, its loophole and its shade
    for (const bx of [x0 + 1.2, cx + 8, x1 - 1.2]) {
      const by = cy(bx) + 1.5, th = 7.6 - (bx === cx + 8 ? 1.4 : 0), bw = 2.3;
      const tw = [[bx - bw, by], [bx - bw * 0.9, by - th], [bx + bw * 0.9, by - th], [bx + bw, by]];
      fl(tw, wc);
      A.withMask(tw, () => fl(rect(bx + 0.3, by - th - 1, bx + bw + 1, by + 1), sh, { p: 0.8 }), 0);
      for (let k = -1; k <= 1; k++) fl(rect(bx + k * 1.35 - 0.38, by - th - 0.9, bx + k * 1.35 + 0.38, by - th + 0.1), wc, { w: 0.25 });
      K.hair([tw[0], tw[1], tw[2], tw[3]], 0.15, ln, { p: 0.55 });
      K.dot(bx - 0.5, by - th * 0.55, win, 0.3, { p: 0.7 });
    }
  }

  /* the temple on the far hill to the right: a curved shikhara banded in its storeys, an amalaka and kalash at its
     top and a long pennant, a small mandapa with its dome before it, a low wall round them */
  function temple(A, K, cx, crest, cols) {
    const wc = A.mix(C.lime, cols[0], 0.45), sh = A.mix(cols[0], cols[1], 0.3), ln = A.mix(cols[1], 'kajal', 0.3);
    const fl = (poly, c, o) => A.fill(poly, 'pastel', c, Object.assign({ w: 0.45, p: 0.95, reach: 1.5, passes: 2, gap: 0.42, ang: 1.5, streak: 0.04 }, o));
    const by = crest(cx) + 1.6, hgt = 13.5, hw0 = 3.5, prof = t => hw0 * (1 - 0.7 * Math.pow(t, 1.6)) * (1 + 0.06 * Math.sin(PI * t));
    // the low wall
    const wl = [], wr = [];
    for (let x = cx - 13; x <= cx + 11 + 1e-6; x += 1) { wl.push([x, crest(x) - 1.2]); wr.push([x, crest(x) + 1.5]); }
    const wall = wl.concat(wr.slice().reverse());
    K.burnish(wall, 0.3);
    fl(wall, wc, { ang: 0.05 });
    K.hair(wl, 0.14, ln, { p: 0.5 });
    // the mandapa, its dome
    const mx = cx - 7.2, my = crest(mx) + 0.2, mb = rect(mx - 3.2, my - 3.6, mx + 3.2, my);
    fl(mb, wc);
    for (let k = 0; k < 3; k++) { const wx = mx - 2 + k * 2; fl(M.w8Arch(wx - 0.5, wx + 0.5, my - 0.2, my - 1.6, my - 2.2, 0), A.mix(cols[1], 'kajal', 0.35), { w: 0.25 }); }
    const md = arcPts(mx, my - 3.6, 2.6, 2.6, PI, TAU, 12);
    fl(md.concat([[mx + 2.6, my - 3.6], [mx - 2.6, my - 3.6]]), wc, { w: 0.3 });
    A.withMask(md.concat([[mx + 2.6, my - 3.6]]), () => fl(rect(mx + 0.4, my - 7, mx + 3.4, my - 3.4), sh, { w: 0.3, p: 0.75 }), 0);
    K.hair(md, 0.14, ln, { p: 0.55 }); K.hair(mb, 0.14, ln, { p: 0.5 });
    K.hair([[mx, my - 6.2], [mx, my - 7.2]], 0.14, ln, { p: 0.6 });
    // the shikhara
    const L = [], Rr = [];
    for (let i = 0; i <= 18; i++) { const t = i / 18; L.push([cx - prof(t), by - hgt * t]); Rr.push([cx + prof(t), by - hgt * t]); }
    const sk = L.concat(Rr.slice().reverse());
    K.burnish(sk, 0.3);
    fl(sk, wc);
    A.withMask(sk, () => {
      fl(rect(cx + 0.6, by - hgt - 1, cx + hw0 + 1, by + 1), sh, { p: 0.8 });
      for (let j = 1; j < 7; j++) { const t = j / 7, y = by - hgt * t, w = prof(t); K.hair([[cx - w, y], [cx + w, y + 0.05]], 0.13, ln, { p: 0.45 }); }
      for (const f of [-0.5, 0, 0.5]) { const rib = []; for (let i = 0; i <= 12; i++) { const t = i / 12 * 0.94; rib.push([cx + f * prof(t), by - hgt * t]); } K.hair(rib, 0.12, ln, { p: 0.4 }); }
    }, 0);
    K.hair(L.concat(Rr.slice().reverse()), 0.15, ln, { p: 0.6 });
    // amalaka, kalash, and the pennant on its pole
    const ty = by - hgt, am = A.ellipse(cx, ty - 0.55, 1.7, 0.65);
    fl(am, wc, { w: 0.3 }); K.hair(am, 0.13, ln, { p: 0.55 });
    for (let k = -2; k <= 2; k++) K.hair([[cx + k * 0.6, ty - 1.1], [cx + k * 0.62, ty]], 0.1, ln, { p: 0.4 });
    K.dot(cx, ty - 1.7, A.mix(C.ochre, cols[0], 0.4), 0.7, { p: 0.85 });
    K.hair([[cx, ty - 2.2], [cx, ty - 8.4]], 0.14, ln, { p: 0.65 });
    const pen = A.spline([[cx, ty - 8.4], [cx + 2.6, ty - 8.0], [cx + 5.4, ty - 7.0], [cx + 2.6, ty - 7.2], [cx, ty - 6.8]], true, 0.3);
    fl(pen, A.mix(C.saffron, cols[0], 0.4), { w: 0.3, ang: 0.1 });
  }
  /* the trees on the rim, Mewar trees, each its own: mango (a deep dome of counted leaves and a few fruit), kadamba
     (round, with its orange balls), ashoka (a tall slim flame of drooping leaves), neem (light, in sprays), date palm,
     and cypress.  yb = where the trunk goes behind the parapet. */
  const GR = { mango: ['#2c5a34', '#3f7a42', '#76a24e'], kadamba: ['#3f7a48', '#5a9450', '#8cba5c'], ashoka: ['#24503a', '#356a44', '#5e9050'], neem: ['#5a8a3c', '#74a446', '#a2c460'], cypress: ['#1f4436', '#2d5a44', '#4f7d58'], palm: ['#3f6e2c', '#5a8a36', '#86ae4c'], palash: ['#3c6634', '#52803e', '#86aa58'] };
  function crownPoly(xc, yc, rx, ry, ph, k) {
    const pts = [];
    for (let i = 0; i < 56; i++) { const a = i / 56 * TAU, q = 1 + (k || 0.1) * Math.sin(5 * a + ph) + 0.05 * Math.sin(9 * a + ph * 2); pts.push([xc + Math.cos(a) * rx * q, yc + Math.sin(a) * ry * q * (Math.sin(a) > 0 ? 0.88 : 1)]); }
    return pts;
  }
  function tree(A, K, kind, x, yb, r) {
    const g = P.treeTint ? GR[kind].map(c => A.mix(c, P.treeTint[0], P.treeTint[1])) : GR[kind], ph = A.rr(0, TAU), INK = A.mix(K.INK, g[0], 0.35), ls = clamp(r / 6.5, 0.55, 1);
    const trunk = (h, w) => { const t = [[x - w, yb + 1], [x - w * 0.7, yb - h], [x + w * 0.7, yb - h], [x + w, yb + 1]]; A.fill(t, 'pastel', '#6b4a2e', { w: 0.6, p: 1, reach: 1.5, passes: 2, ang: 1.5 }); K.hair([t[2], t[3]], 0.2, A.mix('kajal', '#6b4a2e', 0.3), { p: 0.6 }); };
    if (kind === 'palm') {
      const lean = A.rr(-2.5, 2.5), top = [x + lean, yb - r * 2.5];
      const tr = [[x - 0.7, yb + 1], [x - 0.5 + lean * 0.5, yb - r * 1.3], [top[0] - 0.4, top[1]], [top[0] + 0.4, top[1]], [x + 0.5 + lean * 0.5, yb - r * 1.3], [x + 0.7, yb + 1]];
      A.fill(tr, 'pastel', '#7a5a3a', { w: 0.6, p: 1, reach: 1.5, passes: 2, ang: 1.5 });
      for (let t = 0.08; t < 0.95; t += 0.09) { const p = [lerp(x, top[0], t), lerp(yb, top[1], t)]; K.hair([[p[0] - 0.6, p[1] + 0.2], [p[0] + 0.6, p[1] - 0.1]], 0.16, '#4a3420', { p: 0.6 }); }
      K.hair(tr.slice(3), 0.2, A.mix('kajal', '#7a5a3a', 0.3), { p: 0.55 });
      const nf = 9;
      for (let i = 0; i < nf; i++) {
        const a = PI + (i + 0.5) / nf * PI + A.rr(-0.08, 0.08), L = r * A.rr(1.0, 1.25), droop = Math.abs(Math.cos(a)) * r * 0.55;
        const fr = []; for (let k = 0; k <= 10; k++) { const t = k / 10; fr.push([top[0] + Math.cos(a) * L * t, top[1] + Math.sin(a) * L * t * 0.75 + droop * t * t]); }
        A.stroke(fr, 'chalk', g[0], { w: 0.42, p: 0.95, tin: 0.05, tout: 0.3 });
        for (let k = 2; k < 10; k++) {
          const p = fr[k], q = fr[k + 1], an = Math.atan2(q[1] - p[1], q[0] - p[0]), ll = r * 0.32 * (1 - k / 13);
          for (const sd of [-1, 1]) K.leaf(p[0], p[1], an + sd * 0.95 + 0.25, ll, 0.36, k % 2 ? g[1] : g[0], { bend: 0.08 * sd });
        }
      }
      K.dot(top[0], top[1] + 0.3, '#c8821e', 0.9); K.dot(top[0] + 0.9, top[1] + 0.6, '#d89a2a', 0.8);
      return;
    }
    if (kind === 'cypress' || kind === 'ashoka') {
      const hgt = r * (kind === 'cypress' ? 2.7 : 2.4), wid = r * (kind === 'cypress' ? 0.62 : 0.86), top = yb - hgt;
      trunk(r * 0.5, 0.55);
      const sil = []; for (let i = 0; i <= 24; i++) { const t = i / 24, wq = wid * Math.pow(Math.sin(PI * Math.min(1, t * 1.08)), kind === 'cypress' ? 0.75 : 0.62) * (1 - 0.15 * t); sil.push([x - wq, top + hgt * t * 0.92]); }
      const silR = sil.map(p => [2 * x - p[0], p[1]]).reverse(), poly = sil.concat(silR);
      K.burnish(poly);
      K.solid(poly, g[0], { w: 0.9, ang: 1.5 });
      // drooping leaves in rows, counted, lighter on the side of the light
      for (let y = top + 1.4 * ls; y < yb - r * 0.55; y += (kind === 'cypress' ? 1.15 : 1.3) * ls) {
        const t = (y - top) / (hgt * 0.92), wq = wid * Math.pow(Math.sin(PI * Math.min(1, t * 1.08)), 0.7) * 0.92, n = Math.max(2, Math.round(wq * 2 / (1.1 * ls)));
        for (let i = 0; i < n; i++) {
          const xx = x - wq + (i + 0.5) * wq * 2 / n + A.rr(-0.15, 0.15), lit = xx < x - wq * 0.2;
          if (kind === 'cypress') { for (const sd of [-1, 1]) K.leaf(xx, y, PI / 2 + sd * 0.75, 1.05 * ls, 0.34 * ls, lit ? g[2] : g[1], { bend: 0 }); }
          else K.leaf(xx, y - 0.3 * ls, PI / 2 + A.rr(-0.25, 0.25) + (xx - x) / wid * 0.4, 1.45 * ls, 0.42 * ls, lit ? g[2] : (i % 2 ? g[1] : g[0]));
        }
      }
      A.withMask(poly, () => A.fill([[x + wid * 0.25, top], [x + wid + 1, top], [x + wid + 1, yb], [x + wid * 0.25, yb]], 'shade', '#10241a', { w: 1.6, p: 0.3, passes: 1, ang: 1.3 }), 0);
      K.ink(poly, 0.26, { c: INK });
      return;
    }
    // the round crowns
    const cy = yb - r * 1.5, rx = r * (kind === 'neem' ? 1.08 : 1), ry = r * (kind === 'kadamba' ? 0.96 : 0.9);
    trunk(r * 0.7, kind === 'neem' ? 0.45 : 0.6);
    const poly = crownPoly(x, cy, rx, ry, ph, kind === 'mango' ? 0.09 : kind === 'neem' ? 0.13 : 0.06);
    K.burnish(poly);
    K.solid(poly, g[0], { w: 1.1, ang: 1.1 });
    // inner rings of leaves first, then the rim, every leaf pointing out from the heart of the crown
    const rings = kind === 'kadamba' ? [0.28, 0.55, 0.8] : [0.22, 0.46, 0.68, 0.86];
    for (const f of rings) {
      const n = Math.max(3, Math.round(TAU * f * r / ((kind === 'neem' ? 1.2 : 1.45) * ls)));
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + A.rr(-0.12, 0.12) + f * 3, px = x + Math.cos(a) * rx * f, py = cy + Math.sin(a) * ry * f;
        const lit = Math.cos(a) * 0.7 + Math.sin(a) * 0.7 < -0.15, c = lit ? g[2] : (i % 3 ? g[1] : g[0]);
        if (kind === 'kadamba') K.dot(px, py, c, 1.25 * ls, { len: 0.5 * ls, ang: a });
        else if (kind === 'neem') { for (let q = -1; q <= 1; q++) K.leaf(px, py, a + q * 0.55, 1.15 * ls, 0.3 * ls, c); }
        else K.leaf(px, py, a + A.rr(-0.3, 0.3), 1.7 * ls, 0.5 * ls, c);
      }
    }
    const nr = Math.round(TAU * r / (1.15 * ls));
    for (let i = 0; i < nr; i++) {
      const a = i / nr * TAU + A.rr(-0.05, 0.05), q = 1 + (kind === 'mango' ? 0.09 : kind === 'neem' ? 0.13 : 0.06) * Math.sin(5 * a + ph);
      const px = x + Math.cos(a) * rx * q * 0.9, py = cy + Math.sin(a) * ry * q * 0.9 * (Math.sin(a) > 0 ? 0.88 : 1);
      const lit = Math.cos(a) * 0.7 + Math.sin(a) * 0.7 < -0.2;
      if (kind === 'kadamba') K.dot(px, py, lit ? g[2] : g[1], 1.2 * ls, { len: 0.55 * ls, ang: a });
      else K.leaf(px - Math.cos(a) * 0.4 * ls, py - Math.sin(a) * 0.4 * ls, a + A.rr(-0.2, 0.2), (kind === 'neem' ? 1.3 : 1.75) * ls, (kind === 'neem' ? 0.32 : 0.5) * ls, lit ? g[2] : g[1]);
    }
    A.withMask(poly, () => A.fill([[x + rx * 0.1, cy - ry * 1.2], [x + rx * 1.3, cy - ry * 1.2], [x + rx * 1.3, cy + ry * 1.2], [x - rx * 0.2, cy + ry * 1.2]], 'shade', '#0f2416', { w: 1.8, p: 0.32, passes: 1, ang: 1.2 }), 0);
    if (kind === 'kadamba') for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + ph, f = i % 2 ? 0.45 : 0.75, px = x + Math.cos(a) * rx * f, py = cy + Math.sin(a) * ry * f;
      K.dot(px, py, '#e89a2a', 1.25 * ls); K.dot(px - 0.2 * ls, py - 0.25 * ls, '#f6d24a', 0.55 * ls);
    }
    if (kind === 'palash') for (let i = 0; i < 11; i++) {
      // the flame of the forest: its flowers in small claws of sindoor and saffron, mostly on the crown's top and rim
      const a = PI * 1.02 + i / 10 * PI * 0.96 + A.rr(-0.1, 0.1), f = i % 3 === 1 ? 0.5 : 0.82, px = x + Math.cos(a) * rx * f, py = cy + Math.sin(a) * ry * f;
      for (let q = 0; q < 3; q++) { const aa = a + (q - 1) * 0.55 + A.rr(-0.1, 0.1); A.stroke([[px, py], [px + Math.cos(aa) * 0.9 * ls, py + (Math.sin(aa) * 0.9 - 0.25) * ls], [px + Math.cos(aa) * 1.5 * ls, py + (Math.sin(aa) * 1.5 + 0.2) * ls]], LFtool(A), q === 1 ? '#f08a1e' : '#e0461e', { w: 0.62 * ls, p: 1, tin: 0.3, tout: 0.6 }); }
      K.dot(px, py, '#5a2a14', 0.34);
    }
    if (kind === 'mango' && A.chance(0.6)) for (let i = 0; i < 4; i++) {
      const a = PI * 0.15 + i * 0.7 + A.rr(-0.2, 0.2), px = x + Math.cos(a) * rx * 0.62, py = cy + Math.sin(a) * ry * 0.62;
      A.dot(px, py, 'chalk', '#eab02c', { w: 0.95 * ls, len: 0.45 * ls, ang: 1.4, p: 1 }); K.dot(px + 0.25 * ls, py - 0.15 * ls, '#d8502a', 0.35 * ls);
    }
    K.ink(poly, 0.26, { c: INK });
  }
  /* the land beyond the rim, back to front: the far range in lilac with the fort and the temple on two of its
     crests; the sage range, a few small trees standing on its crests; the rose range, small trees on its crests;
     then the trees along the rim in groves of one, two and three, three sizes, the gaps between them open on the
     hills.  The rim trees are planned first, so the trees on the crests can stand in their gaps. */
  function land(A, K, W) {
    const R = STAGE.rng(5501), geo = (cx, top, rx) => lobeGeo(cx, top, rx, 132, R.rr(-0.12, 0.12), R.rr(0, TAU), R.rr(0.45, 0.8));
    const F = [geo(420, 81, 46), geo(1500, 82.5, 42)];
    for (let x = -30; x < W + 40;) { const rx = R.rr(22, 46), cx = x + rx * 0.6; if (Math.abs(cx - 420) > 44 && Math.abs(cx - 1500) > 40) F.push(geo(cx, R.rr(85, 95), rx)); x += rx * R.rr(0.75, 1.6); }
    const Mi = [];
    for (let x = -26; x < W + 30;) { const rx = R.rr(13, 34); Mi.push(geo(x + rx * 0.5, R.rr(91, 101), rx)); x += rx * R.rr(0.7, 1.7); }
    const N = [];
    for (let x = -24; x < W + 30;) { const rx = R.rr(10, 28); N.push(Object.assign(geo(x + rx * 0.5, R.rr(100, 111), rx), { bush: R.chance(0.3) })); x += rx * R.rr(0.75, 1.6); }
    // the rim trees, in groves; sizes from three classes, each a hair off
    const T = STAGE.rng(6603), yb = 120.5;
    const L = ['mango', 'kadamba', 'ashoka', 'neem', 'palash', 'palm', 'kadamba', 'cypress', 'mango', 'neem', 'ashoka', 'kadamba', 'palm', 'palash', 'neem', 'cypress'];
    const Rt = ['neem', 'palash', 'cypress', 'kadamba', 'palm', 'mango', 'ashoka', 'neem', 'kadamba', 'palash', 'palm', 'cypress', 'mango', 'kadamba', 'ashoka', 'neem'];
    const groves = [[9.2, 6.4], [7], [9.6, 5.2, 6.8], [5.4], [6.8, 5], [9, 7.2, 5.2], [7.4], [8.8, 5.6], [5.8, 5.2], [9.4]];
    const CK = ['mango', 'neem', 'cypress', 'kadamba', 'palm', 'mango', 'ashoka', 'neem'];
    const front = [], midT = [], nearT = [];
    let ck = 0;
    for (const sd of [-1, 1]) {
      let x = 960 + sd * T.rr(76, 80), k = 0, g = 0, first = true;
      while (sd < 0 ? x > -14 : x < W + 14) {
        const grove = groves[(g + (sd > 0 ? 4 : 0)) % groves.length];
        let last = 0;
        grove.forEach((r0, i) => {
          const kind = (sd < 0 ? L : Rt)[k % 16], slim = kind === 'cypress' || kind === 'ashoka' || kind === 'palm', r = r0 * T.rr(0.94, 1.06) * (slim ? 0.9 : 1);
          if (i === 0) x += sd * r * (first ? 0 : 1); else x += sd * (last + r) * T.rr(0.55, 0.72) * (slim ? 0.8 : 1);
          front.push([kind, x, yb, r]); last = r; k++; first = false;
        });
        // the gap, and in it, on a crest, a small tree or two standing back
        const gap = T.rr(14, 48), gx = x + sd * (last + gap / 2);
        if (gap > 18) {
          const cn = crestAt(N, gx), cm = crestAt(Mi, gx);
          if (cn != null && cn < 113.5) {
            const kx = gx + T.rr(-3, 3);
            nearT.push([CK[ck++ % CK.length], kx, crestAt(N, kx) + 0.5, T.rr(3.4, 4.6)]);
            if (gap > 30 && T.chance(0.55)) { const kx2 = kx + sd * T.rr(4.5, 6.5), c2 = crestAt(N, kx2); if (c2 != null && c2 < 114) nearT.push([CK[ck++ % CK.length], kx2, c2 + 0.5, T.rr(2.8, 3.6)]); }
          } else if (cm != null && cm < 104) midT.push([CK[ck++ % CK.length], gx, cm + 0.4, T.rr(2.6, 3.4)]);
        }
        x += sd * (last + gap); g++;
      }
    }
    F.sort((a, b) => a.top - b.top).forEach(l => lobe(A, K, l, P.hillFar, {}));
    const cF = x => crestAt(F, x);
    fort(A, K, 420, cF, P.hillFar);
    temple(A, K, 1500, cF, P.hillFar);
    Mi.sort((a, b) => a.top - b.top).forEach(l => lobe(A, K, l, P.hillMid, {}));
    for (const [kind, x, y, r] of midT) tree(A, K, kind, x, y, r);
    N.sort((a, b) => a.top - b.top).forEach(l => lobe(A, K, l, P.hillNear, { bush: l.bush }));
    for (const [kind, x, y, r] of nearT) tree(A, K, kind, x, y, r);
    for (const [kind, x, y, r] of front.sort((a, b) => b[3] - a[3])) tree(A, K, kind, x, y, r);
  }

  /* the rim: a coping with a row of lotus-bud kanguras on it, a parapet of little blind arches, a sindoor band with
     its white dots, then the deck, its slabs running back */
  function parapet(A, K, G, W) {
    const skip = x => Math.abs(x - 960) < 49;
    // the coping and the kanguras
    const cop = rect(-12, 119.6, W + 12, 122.6);
    K.burnish(rect(-12, 112, W + 12, 137.4), 0.3);
    K.solid(cop, C.lime, { w: 1.2, ang: 0.02 });
    for (let x = 4.5; x < W; x += 9) {
      if (skip(x)) continue;
      const xx = x + A.rr(-0.15, 0.15), h = 5.8 * A.rr(0.96, 1.04), b = 119.8;
      const k = [[xx - 2.7, b], [xx - 2.7, b - 1.9], [xx - 2.2, b - 3.1], [xx - 1.1, b - h * 0.86], [xx, b - h], [xx + 1.1, b - h * 0.86], [xx + 2.2, b - 3.1], [xx + 2.7, b - 1.9], [xx + 2.7, b]];
      const ks = A.spline(k, false, 0.3);
      A.fill(ks, 'pastel', C.lime, { w: 0.8, p: 1, reach: 1.55, passes: 2, gap: 0.42, ang: 1.4, streak: 0.05 });
      A.withMask(ks, () => A.fill(rect(xx + 0.6, b - h - 1, xx + 3, b + 1), 'shade', C.limeSh, { w: 1, p: 0.5, passes: 1, ang: 1.4 }), 0);
      K.ink(ks, 0.3, { closed: false });
      K.dot(xx, b - h * 0.45, C.sindoor, 0.55);
    }
    K.hair([[-12, 119.7], [W + 12, 119.7]], 0.3);
    A.stroke([[-12, 120.5], [W + 12, 120.5]], 'chalk', C.limeLit, { w: 0.5, p: 0.85 });
    // the face
    const face = rect(-12, 122.6, W + 12, 134.2);
    K.solid(face, '#f0e0bc', { w: 1.4, ang: 0.03 });
    K.hair([[-12, 122.7], [W + 12, 122.7]], 0.32);
    for (let x = 0; x < W; x += 9) {
      if (skip(x + 4.5)) continue;
      const a0 = x + 1.5 + A.rr(-0.1, 0.1), a1 = x + 7.5 + A.rr(-0.1, 0.1), op = M.w8Arch(a0, a1, 133.2, 127.4, 124.6, 3);
      A.fill(op, 'pastel', A.mix(C.ochre, C.sand, 0.45), { w: 0.8, p: 1, reach: 1.55, passes: 2, gap: 0.42, ang: 1.5, streak: 0.05 });
      A.withMask(op, () => {
        A.fill(rect(a0 - 1, 130.6, a1 + 1, 133.6), 'pastel', A.mix(C.ochre, C.haldi, 0.35), { w: 0.6, p: 0.7, passes: 1, ang: 0.02 });
        A.fill(rect((a0 + a1) / 2 + 0.6, 124, a1 + 1, 134), 'shade', C.recess, { w: 1, p: 0.35, passes: 1, ang: 1.5 });
      }, 0);
      A.stroke([[a0 + 0.35, 133], [a0 + 0.35, 127.6]], 'chalk', C.limeLit, { w: 0.35, p: 0.8, tin: 0.1, tout: 0.2 });
      K.ink(op.slice(1, -1), 0.24, { closed: false });
      K.dot((a0 + a1) / 2, 123.7, C.sindoor, 0.45);
      if (Math.round(x / 9) % 2 === 0) K.dot(x + 9, 128.5, C.limeLit, 0.5);
    }
    // the sindoor band and its dots, the line under it
    const sb = rect(-12, 134.2, W + 12, 136.4);
    K.solid(sb, C.sindoor, { w: 1, ang: 0.02 });
    K.dots([[-10, 135.3], [W + 10, 135.3]], 3, C.limeLit, 0.55, { skip: q => skip(q.x) });
    K.hair([[-12, 134.25], [W + 12, 134.25]], 0.24);
    K.ink([[-12, 136.6], [W + 12, 136.6]], 0.36, { closed: false });
    // the deck: lime, its slabs, the shade the parapet lays on it
    const deck = G.deck;
    K.burnish(deck, 0.22);
    K.solid(deck, '#efdcb0', { w: 3, ang: 0.02 });
    A.withMask(deck, () => {
      A.fill(rect(-70, 136.4, W + 70, 139.6), 'shade', '#8a6a4a', { w: 1.4, p: 0.35, passes: 1, ang: 0.02 });
      // the slabs: two courses running across, the joints going back toward the stair's head, each a hair of warm grey
      const jc = A.mix(K.INK, '#efdcb0', 0.72);
      for (const y of [141.2, 146.4]) K.hair([[-70, y], [W + 70, y + A.rr(-0.1, 0.1)]], 0.2, jc, { p: 0.5 });
      for (let x = -56, i = 0; x < W + 60; x += 23 + A.rr(-1.2, 1.2), i++) {
        if (Math.abs(x - 960) < 52) continue;
        const k = (x - 960) / (137 - 112), segs = i % 2 ? [[141.2, 146.4]] : [[137, 141.2], [146.4, 152]];
        for (const [y0, y1] of segs) K.hair([[960 + k * (y0 - 112), y0], [960 + k * (y1 - 112), y1]], 0.18, jc, { p: 0.45 });
      }
      A.stroke([[-70, 137.2], [W + 70, 137.2]], 'chalk', C.limeLit, { w: 0.45, p: 0.55 });
    }, 0);
  }

  /* the chhatri over the stair, at the level of the focal objects, since it is the first thing the eye finds: four
     pillars and three cusped arches open into the shade under a deep chhajja on brackets, a drum ringed with lotus
     petals, a ribbed dome a little pointed at the crown, an inverted lotus, and the kalash reaching into the sun */
  function chhatri(A, K, G) {
    const Cc = G.CHHATRI, x = Cc.x, b = Cc.base, INK = K.INK;
    const body = rect(x - 40, b - 40, x + 40, b);
    K.burnish(rect(x - 50, b - 96, x + 50, b + 1), 0.3);
    K.solid(body, C.lime, { w: 1.6, ang: 1.5 });
    // the three openings, each a cusped arch into a warm shade with a lit floor, a bell hanging in the middle one
    const opens = [[x - 35.2, x - 14.8], [x - 10.2, x + 10.2], [x + 14.8, x + 35.2]];
    for (const [o0, o1] of opens) {
      const op = M.w8Arch(o0, o1, b, b - 21.5, b - 34.5, 7), inner = A.mix(C.limeSh, C.limeDeep, 0.35), edge = A.mix(inner, 'kajal', 0.45);
      // the pavilion is open on every side: through the front arch, the far wall in shade, and in it the far arch
      // open on the sky, with the hills low in it
      K.solid(op, inner, { w: 1.2, ang: 1.5 });
      A.withMask(op, () => {
        A.fill(rect(o0 - 1, b - 36, o1 + 1, b - 26), 'pastel', A.mix(inner, C.recess, 0.42), { w: 1, p: 0.9, reach: 1.4, passes: 2, ang: 0.02, streak: 0.05 });
        const back = M.w8Arch(o0 + 3.2, o1 - 3.2, b - 5, b - 18, b - 27, 5);
        K.solid(back, P.sky[2], { w: 0.8, ang: 0.03 });
        A.withMask(back, () => {
          const ridge = (y0, a, f) => { const l = []; for (let xx = o0 + 2; xx <= o1 - 2 + 1e-6; xx += 0.7) l.push([xx, y0 + a * Math.sin((xx - o0) * f + o0 * 0.1)]); return l; };
          const r1 = ridge(b - 15.2, 1.4, 0.42), r2 = ridge(b - 11.6, 1.1, 0.6);
          A.fill(r1.concat([[o1, b], [o0, b]]), 'pastel', P.hillFar[0], { w: 0.6, p: 0.95, reach: 1.4, passes: 2, ang: 0.05, streak: 0.04 });
          K.hair(r1, 0.16, A.mix(P.hillFar[1], 'kajal', 0.35), { p: 0.6 });
          A.fill(r2.concat([[o1, b], [o0, b]]), 'pastel', P.hillMid[0], { w: 0.6, p: 0.95, reach: 1.4, passes: 2, ang: 0.05, streak: 0.04 });
          K.hair(r2, 0.18, A.mix(P.hillMid[1], 'kajal', 0.4), { p: 0.65 });
          const tx = (o0 + o1) / 2 + (o0 < x - 20 ? 2.4 : o0 > x ? -2.6 : 0.4), ty = b - 12.4;
          const tg = P.treeTint ? A.mix('#3f6b3a', P.treeTint[0], P.treeTint[1]) : '#3f6b3a';
          K.hair([[tx, ty + 1.6], [tx, ty]], 0.2, '#5a3e26', { p: 0.8 });
          K.dot(tx, ty - 0.6, tg, 1.6); K.dot(tx - 0.4, ty - 1.0, A.mix(tg, '#a8c870', 0.4), 0.6);
        }, 0);
        K.hair(back, 0.26, edge, { p: 0.7 });
        // the floor, lit, its edge; the inner face of the left pier in shade
        A.fill(rect(o0 - 1, b - 5, o1 + 1, b + 1), 'pastel', A.mix(C.lime, C.limeSh, 0.35), { w: 1, p: 0.95, reach: 1.4, passes: 2, ang: 0.02, streak: 0.05 });
        K.hair([[o0, b - 5], [o1, b - 5]], 0.2, edge, { p: 0.6 });
        A.fill(rect(o0 - 1, b - 36, o0 + 2.2, b), 'pastel', A.mix(inner, C.recess, 0.3), { w: 1, p: 0.85, passes: 2, ang: 1.5, streak: 0.05 });
      }, 0);
      K.ink(op.slice(1, -1), 0.36, { closed: false, at: [(o0 + o1) / 2, b - 10] });
      // a white dot row inside the arch's edge
      const rimIn = op.slice(1, -1);
      K.dots(rimIn.slice(4, -4).map(p => [p[0] + Math.sign((o0 + o1) / 2 - p[0]) * 0.9, p[1] + 0.9]), 1.6, C.limeLit, 0.42);
    }
    { // the bell, matte ochre
      const bx = x, by = b - 33.5;
      K.hair([[bx, by], [bx, by + 9]], 0.2, A.mix(C.ochre, 'kajal', 0.4), { p: 0.8 });
      const bell = A.spline([[bx - 1.1, by + 9], [bx - 1.4, by + 10.8], [bx - 2.3, by + 12.2], [bx + 2.3, by + 12.2], [bx + 1.4, by + 10.8], [bx + 1.1, by + 9]], true, 0.3);
      K.solid(bell, C.ochre, { w: 0.6 });
      A.stroke([[bx - 0.8, by + 9.6], [bx - 1.4, by + 11.6]], 'chalk', C.haldi, { w: 0.4, p: 0.8 });
      K.ink(bell, 0.26);
      K.dot(bx, by + 12.7, 'kajal', 0.6);
    }
    // the pillars: base, banded shaft, a bracket capital
    for (const px of [x - 37.5, x - 12.5, x + 12.5, x + 37.5]) {
      const w = 4.6, sh = rect(px - w / 2, b - 21, px + w / 2, b - 2.6);
      K.solid(sh, C.lime, { w: 0.9 });
      A.withMask(sh, () => A.fill(rect(px + 0.2, b - 22, px + w, b), 'shade', C.limeSh, { w: 1, p: 0.55, passes: 1, ang: 1.5 }), 0);
      A.stroke([[px - w / 2 + 0.7, b - 3], [px - w / 2 + 0.7, b - 20.4]], 'chalk', C.limeLit, { w: 0.5, p: 0.85 });
      const base = rect(px - w / 2 - 0.9, b - 2.6, px + w / 2 + 0.9, b);
      K.solid(base, C.lime, { w: 0.7 });
      K.ink(base, 0.3);
      for (const yy of [b - 7.2, b - 14.4]) { const bd = rect(px - w / 2, yy - 0.55, px + w / 2, yy + 0.55); K.solid(bd, C.sindoor, { w: 0.5 }); K.hair([[px - w / 2, yy - 0.6], [px + w / 2, yy - 0.6]], 0.16); }
      const cap = [[px - w / 2 - 0.4, b - 21], [px - w / 2 - 1.8, b - 23.2], [px + w / 2 + 1.8, b - 23.2], [px + w / 2 + 0.4, b - 21]];
      K.solid(cap, C.lime, { w: 0.6 });
      K.ink(cap, 0.28);
      K.ink(sh, 0.32);
    }
    // the spandrels: a floret over each arch, a dot row under the eave
    for (const [o0, o1] of opens) K.floret((o0 + o1) / 2, b - 37.4, 1.7, C.limeLit, C.sindoor);
    for (const [o0, o1] of opens) for (const sd of [-1, 1]) K.dot((o0 + o1) / 2 + sd * 7.4, b - 36.2, C.ochre, 0.7);
    K.ink(body, 0.42);
    // the chhajja on its brackets
    const ch = [[x - 48.5, b - 39.6], [x - 46.5, b - 43.6], [x + 46.5, b - 43.6], [x + 48.5, b - 39.6], [x + 47.5, b - 38.6], [x - 47.5, b - 38.6]];
    A.fill(rect(x - 40, b - 38.6, x + 40, b - 34.4), 'shade', '#6a4a3a', { w: 1, p: 0.45, passes: 1, ang: 0.02 });
    K.solid(ch, C.lime, { w: 0.8, ang: 0.02 });
    A.withMask(ch, () => A.fill(rect(x - 50, b - 40.6, x + 50, b - 38), 'shade', C.limeSh, { w: 0.8, p: 0.6, passes: 1, ang: 0.02 }), 0);
    K.ink(ch, 0.38);
    K.dots([[x - 46.5, b - 41.4], [x + 46.5, b - 41.4]], 1.9, C.sindoor, 0.5);
    for (const px of [x - 37.5, x - 12.5, x + 12.5, x + 37.5]) {
      const br = A.spline([[px - 1.6, b - 38.6], [px - 1.2, b - 36.4], [px - 0.2, b - 35], [px + 0.2, b - 35], [px + 1.2, b - 36.4], [px + 1.6, b - 38.6]], true, 0.3);
      K.solid(br, C.lime, { w: 0.5 });
      K.ink(br, 0.24);
    }
    // the drum, ringed with petals
    const drum = rect(x - 36.5, b - 49, x + 36.5, b - 43.6);
    K.solid(drum, '#f2e6cc', { w: 0.8, ang: 0.02 });
    for (let k = 0; k < 19; k++) {
      const px = x - 34.6 + k * (69.2 / 18) + A.rr(-0.1, 0.1);
      const pet = A.spline([[px - 1.5, b - 43.8], [px - 1.3, b - 46.2], [px, b - 48.2], [px + 1.3, b - 46.2], [px + 1.5, b - 43.8]], false, 0.3);
      A.fill(pet, 'pastel', A.mix(C.lime, C.haldi, 0.3), { w: 0.5, p: 1, reach: 1.5, passes: 2, gap: 0.42, ang: 1.5, streak: 0.05 });
      K.hair(pet, 0.18, A.mix(INK, C.lime, 0.2), { p: 0.6 });
    }
    K.ink(drum, 0.34);
    // the dome: a little bulging at the shoulder, drawn to a point at the crown
    const dc = [x, b - 49], dr = 35.2, dh = 31, tip = 4.2;
    const dpt = a => { const u = Math.cos(a), v = Math.sin(a), sw = 1 + 0.035 * Math.sin(-a * 2 - PI * 0.0); let px = dc[0] + u * dr * sw, py = dc[1] + v * dh; const k = Math.max(0, 1 - Math.abs(u) / 0.3); py -= tip * k * k; return [px, py]; };
    const dome = []; for (let i = 0; i <= 64; i++) dome.push(dpt(PI + i / 64 * PI));
    const domeP = dome.concat([[x + dr, b - 48.6], [x - dr, b - 48.6]]);
    K.solid(domeP, C.lime, { w: 1.6, ang: 1.1 });
    A.withMask(domeP, () => {
      // the shade, painted flat: a crescent down the right of the dome, a deeper one inside it, the join rubbed soft
      const shift = (dx, dy) => domeP.map(p => [p[0] + dx, p[1] + dy]);
      A.pushMaskOutside(shift(-13, -2.5));
      A.fill(rect(x - 40, b - 96, x + 40, b - 48), 'pastel', A.mix(C.lime, C.limeSh, 0.62), { w: 1.6, p: 0.95, reach: 1.5, passes: 3, gap: 0.42, ang: 1.25, streak: 0.06 });
      A.popMask();
      A.pushMaskOutside(shift(-6.2, -1.2));
      A.fill(rect(x - 40, b - 96, x + 40, b - 48), 'pastel', A.mix(C.limeSh, C.limeDeep, 0.35), { w: 1.4, p: 0.9, reach: 1.5, passes: 2, gap: 0.42, ang: 1.25, streak: 0.06 });
      A.popMask();
      A.blend(domeP, { r: 1.6, k: 0.45, ang: 1.2 });
      // a warm light thrown up from the deck along the dome's foot, and the lit cheek on the left
      A.stroke(arcPts(x - dr * 0.42, b - 66, 16, 13, PI * 1.08, PI * 1.42, 10), 'pastel', C.limeLit, { w: 3.2, p: 0.6, tin: 0.3, tout: 0.4, streak: 0.05 });
      // eleven ribs from the drum to the crown
      for (let k = 1; k <= 11; k++) {
        const u0 = -1 + 2 * k / 12, mer = [];
        for (let t = 0; t <= 1.0001; t += 0.05) { const xx = x + u0 * dr * Math.cos(t * PI / 2), uu = (xx - x) / dr, top = dpt(PI + Math.acos(clamp(-uu, -1, 1)))[1]; mer.push([xx, lerp(b - 48.8, top, Math.sin(t * PI / 2) * 0.999)]); }
        K.hair(mer, 0.2, A.mix(INK, C.lime, u0 < 0 ? 0.55 : 0.4), { p: 0.6, tin: 0.05, tout: 0.3 });
        if (u0 < 0.2) A.stroke(mer.slice(0, 14).map(p => [p[0] - 0.7, p[1]]), 'chalk', C.limeLit, { w: 0.4, p: 0.6, tin: 0.1, tout: 0.4 });
      }
      // a band of lotus petals turned up round the foot of the dome
      for (let k = 0; k < 17; k++) {
        const px = x - 32.6 + k * (65.2 / 16) + A.rr(-0.1, 0.1);
        const pet = A.spline([[px - 1.9, b - 48.6], [px - 1.6, b - 51.4], [px, b - 54.4], [px + 1.6, b - 51.4], [px + 1.9, b - 48.6]], false, 0.3);
        A.fill(pet, 'pastel', A.mix(C.lime, C.limeLit, 0.5), { w: 0.6, p: 1, reach: 1.5, passes: 2, gap: 0.42, ang: 1.5, streak: 0.05 });
        K.hair(pet, 0.2, A.mix(INK, C.lime, 0.25), { p: 0.65 });
        K.dot(px, b - 50, C.sindoor, 0.42);
      }
    }, 0);
    K.ink(dome, 0.42, { closed: false, at: [x, b - 60] });
    // the crown, its parts stacked: a lotus cap hanging over the dome's point, the ribbed amalaka, the kalash with its
    // mango leaves, a knob and a short spike.  Matte ochre with one thread of gold, drawn hard against the sun.
    const yc = dpt(PI * 1.5)[1], OC = '#c08a2c', OCd = '#8a5a1c';
    for (let k = 0; k < 7; k++) {
      const px = x - 5.1 + k * 1.7, pet = A.spline([[px - 1.05, yc - 1.6], [px - 0.95, yc - 0.2], [px, yc + 1.5 - Math.abs(k - 3) * 0.25], [px + 0.95, yc - 0.2], [px + 1.05, yc - 1.6]], false, 0.25);
      A.fill(pet, 'pastel', A.mix(C.lime, C.limeSh, k > 3 ? 0.5 : 0.1), { w: 0.4, p: 1, reach: 1.5, passes: 2, gap: 0.42, ang: 1.5 });
      K.hair(pet, 0.16, A.mix(INK, C.lime, 0.15), { p: 0.7 });
    }
    const band = rect(x - 5.8, yc - 2.5, x + 5.8, yc - 1.5);
    K.solid(band, C.lime, { w: 0.4, ang: 0.02 }); K.ink(band, 0.2);
    const am = A.ellipse(x, yc - 4.3, 4.2, 1.8);
    K.solid(am, OC, { w: 0.5 });
    A.withMask(am, () => { for (let k = -4; k <= 4; k++) K.hair([[x + k * 0.92, yc - 6], [x + k * 1.0, yc - 2.6]], 0.13, OCd, { p: 0.65 }); A.fill(rect(x + 1, yc - 7, x + 5, yc - 2), 'pastel', OCd, { w: 0.5, p: 0.45, passes: 1 }); }, 0);
    K.ink(am, 0.24);
    const pot = A.spline([[x - 1.3, yc - 6.0], [x - 2.9, yc - 7.6], [x - 2.6, yc - 9.6], [x - 1.2, yc - 10.9], [x + 1.2, yc - 10.9], [x + 2.6, yc - 9.6], [x + 2.9, yc - 7.6], [x + 1.3, yc - 6.0]], true, 0.35);
    K.solid(pot, OC, { w: 0.5, ang: 1.4 });
    A.withMask(pot, () => { A.fill(rect(x + 0.6, yc - 12, x + 4, yc - 5), 'pastel', OCd, { w: 0.5, p: 0.5, passes: 1 }); A.stroke([[x - 3, yc - 8.4], [x + 3, yc - 8.4]], 'chalk', C.sindoor, { w: 0.42, p: 0.9 }); }, 0);
    A.stroke([[x - 1.9, yc - 7.2], [x - 1.5, yc - 9.6]], 'gold', 'gold', { w: 0.36, p: 0.9, tin: 0.2, tout: 0.3 });
    K.ink(pot, 0.26);
    for (const sd of [-1, 0, 1]) K.leaf(x + sd * 0.5, yc - 10.9, -PI / 2 + sd * 0.75, 2.2, 0.62, '#4f7d30', { bend: sd * 0.1 });
    const rim = rect(x - 1.5, yc - 11.5, x + 1.5, yc - 10.7);
    K.solid(rim, OC, { w: 0.3, ang: 0.02 }); K.ink(rim, 0.16);
    const knob = A.ellipse(x, yc - 12.9, 1.15, 1.25);
    K.solid(knob, OC, { w: 0.3 }); K.ink(knob, 0.18);
    const spike = [[x - 0.42, yc - 13.9], [x, yc - 17.6], [x + 0.42, yc - 13.9]];
    A.fill(spike, 'pastel', OC, { w: 0.3, p: 1, reach: 1.5, passes: 2 });
    K.hair(spike, 0.18);
    G.glints.push([x, yc - 17.4]);
  }

  M.w8y.sky = Object.assign(function (A, G, H) {
    P = moodOf(A, G);
    const K = kit(A), W = H.W;
    skyGround(A, K, W);
    lapisBand(A, K, W);
    if (P.mood === 'night') { stars(A, K, rect(-12, 35, W + 12, 104), 1); moon(A, K, P.body); }
    else A.withMask(rect(-12, -12, W + 12, 140), () => sun(A, K, P.body), 0); // the low dusk sun's rays stop at the deck
    skyClouds(A, K);
    flights(A, K);
    land(A, K, W);
    parapet(A, K, G, W);
    chhatri(A, K, G);
  }, { part: 'sky' });

  // ------------------------------------------------------------ the water at the foot
  /* a lotus pad lying on the water, seen from above and a little in front: a round leaf with its cut, the veins
     running out from the heart, a pale lip on the side of the light, its own shade on the water */
  function pad(A, K, x, y, r, rot) {
    const ry = 0.44, notch = rot != null ? rot : A.rr(0, TAU), gap = 0.2;
    const pts = [[x, y]];
    for (let i = 0; i <= 40; i++) { const a = notch + gap + i / 40 * (TAU - 2 * gap), q = 1 + 0.025 * Math.sin(a * 5); pts.push([x + Math.cos(a) * r * q, y + Math.sin(a) * r * ry * q]); }
    M.floorWash(A, pts.map(p => [p[0] + 0.6, p[1] + 0.9]), P.water.deep, () => 0.55, 'mul');
    K.burnish(pts);
    K.solid(pts, C.pad, { w: Math.max(0.6, r * 0.2), ang: 0.3 });
    A.withMask(pts, () => {
      A.fill(A.ellipse(x - r * 0.08, y - r * ry * 0.1, r * 0.7, r * ry * 0.7), 'pastel', C.padIn, { w: Math.max(0.5, r * 0.15), p: 0.55, passes: 1, ang: 0.4, streak: 0.1 });
      for (let k = 0; k < 11; k++) { const a = notch + gap + (k + 0.5) / 11 * (TAU - 2 * gap); A.stroke([[x, y], [x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * ry * 0.9]], 'chalk', C.padVein, { w: 0.26, p: 0.6, tin: 0.1, tout: 0.4 }); }
      A.fill(rect(x + r * 0.1, y - r, x + r * 1.2, y + r), 'shade', '#0e2a16', { w: 1, p: 0.35, passes: 1, ang: 1.3 });
    }, 0);
    const lip = []; for (let i = 0; i <= 14; i++) { const a = PI * 0.95 + i / 14 * PI * 0.7; lip.push([x + Math.cos(a) * r * 0.93, y + Math.sin(a) * r * ry * 0.9]); }
    A.stroke(lip, 'chalk', C.padLit, { w: 0.42, p: 0.75, tin: 0.2, tout: 0.3 });
    K.dot(x, y, C.padLit, 0.5);
    K.ink(pts.slice(1), 0.28, { closed: false, c: A.mix(C.padInk, K.INK, 0.3), at: [x, y] });
  }
  function lotusOpen(A, K, x, y, s) {
    // the petals of the back row, then the front, pink deepening to rose at the tips; a haldi heart
    const back = [-1.15, -0.62, 0, 0.62, 1.15], front = [-0.45, 0.45, 0];
    const petal = (a, L, Wd, c) => {
      const tip = [x + Math.sin(a) * L, y - Math.cos(a) * L], m1 = [x + Math.sin(a - 0.38) * L * 0.55, y - Math.cos(a - 0.38) * L * 0.55], m2 = [x + Math.sin(a + 0.38) * L * 0.55, y - Math.cos(a + 0.38) * L * 0.55];
      const p = A.spline([[x, y], m1, tip, m2], true, 0.25);
      A.fill(p, 'pastel', c, { w: Math.max(0.4, s * 0.12), p: 1, reach: 1.55, passes: 2, gap: 0.42, ang: a + PI / 2, streak: 0.05 });
      A.stroke([[x + Math.sin(a) * L * 0.2, y - Math.cos(a) * L * 0.2], [tip[0] - Math.sin(a) * L * 0.08, tip[1] + Math.cos(a) * L * 0.08]], 'chalk', A.mix(C.rose, C.lac, 0.2), { w: 0.22, p: 0.6, tin: 0.2, tout: 0.4 });
      A.stroke([[tip[0] - Math.sin(a) * L * 0.25, tip[1] + Math.cos(a) * L * 0.25], tip], 'chalk', C.rose, { w: s * 0.1, p: 0.8, tin: 0.3, tout: 0.2 });
      K.hair(p, 0.18, C.lac, { p: 0.6 });
    };
    A.stroke([[x, y + s * 0.2], [x + A.rr(-0.4, 0.4), y + s * 0.9]], 'chalk', '#3f6b2a', { w: 0.4, p: 0.9 });
    for (const a of back) petal(a, s * 0.95, s * 0.45, A.mix(C.pink, '#f6d8e0', 0.25));
    for (const a of front) petal(a, s * 0.82, s * 0.5, A.mix(C.pink, C.rose, 0.15));
    K.dot(x, y - s * 0.32, C.haldi, s * 0.22);
    K.dot(x, y - s * 0.32, '#c89a2a', s * 0.08);
  }
  function lotusBud(A, K, x, y, s, lean) {
    A.stroke([[x, y + s * 0.15], [x + lean * 0.2, y + s * 0.7]], 'chalk', '#3f6b2a', { w: 0.38, p: 0.9 });
    const b = A.spline([[x - s * 0.22, y], [x - s * 0.24, y - s * 0.4], [x + lean * 0.2, y - s * 0.95], [x + s * 0.24, y - s * 0.4], [x + s * 0.22, y]], true, 0.3);
    K.solid(b, A.mix(C.pink, C.rose, 0.3), { w: 0.4, ang: 1.5 });
    A.stroke([[x - s * 0.1, y - s * 0.1], [x + lean * 0.12, y - s * 0.75]], 'chalk', '#f6d8e0', { w: 0.24, p: 0.7, tin: 0.2, tout: 0.4 });
    for (const sd of [-1, 1]) A.stroke([[x, y + 0.1], [x + sd * s * 0.3, y - s * 0.3]], LFtool(A), '#4f7d30', { w: s * 0.16, p: 1, tin: 0.4, tout: 0.5 });
    K.hair(b, 0.18, C.lac, { p: 0.6 });
  }
  function lily(A, K, x, y, s) {
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * TAU + A.rr(-0.05, 0.05), tip = [x + Math.cos(a) * s, y + Math.sin(a) * s * 0.48];
      A.stroke([[x, y], [(x + tip[0]) / 2, (y + tip[1]) / 2], tip], LFtool(A), k % 2 ? '#fbf6ea' : '#efe8f2', { w: s * 0.34, p: 1, tin: 0.35, tout: 0.5, reach: 1.4 });
    }
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3, tip = [x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.3 - s * 0.12]; A.stroke([[x, y - s * 0.05], tip], LFtool(A), '#fffaf0', { w: s * 0.26, p: 1, tin: 0.35, tout: 0.5 }); }
    K.dot(x, y - s * 0.12, C.haldi, s * 0.24);
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; K.dot(x + Math.cos(a) * s * 0.14, y - s * 0.12 + Math.sin(a) * s * 0.08, C.saffron, 0.3); }
  }
  /* a fish under the water, seen from above: a long body, the dark of its back down the middle, counted scales, the
     two side fins, a forked tail; sunk with a glaze of the water over it */
  function fish(A, K, x, y, len, ang, o) {
    o = o || {};
    const ca = Math.cos(ang), sa = Math.sin(ang), T = (u, v) => [x + ca * u - sa * v, y + sa * u + ca * v];
    const side = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20, hw = len * 0.15 * Math.pow(Math.sin(PI * (t * 0.86 + 0.07)), 0.75) * (1 - 0.35 * t); side.push([t, hw]); }
    const bodyU = side.map(([t, hw]) => T(len * (0.5 - t), hw)), bodyD = side.map(([t, hw]) => T(len * (0.5 - t), -hw)).reverse();
    const body = bodyU.concat(bodyD);
    const tl = [T(-len * 0.42, 0), T(-len * 0.68, len * 0.2), T(-len * 0.6, 0), T(-len * 0.68, -len * 0.2)];
    const tail = A.spline(tl, true, 0.35);
    const bb = body.concat(tl);
    K.burnish(bb);
    A.fill(tail, 'pastel', A.mix(o.c || '#ec8a2a', '#f6c46a', 0.3), { w: 0.6, p: 1, reach: 1.5, passes: 2, gap: 0.42, ang, streak: 0.05 });
    for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) K.hair([T(-len * 0.44, sd * k * len * 0.03), T(-len * (0.6 + k * 0.02), sd * len * (0.05 + k * 0.045))], 0.14, A.mix(o.back || '#c8401c', 'kajal', 0.2), { p: 0.5 });
    for (const sd of [-1, 1]) { const fin = A.spline([T(len * 0.22, sd * len * 0.11), T(len * 0.12, sd * len * 0.25), T(len * 0.04, sd * len * 0.2), T(len * 0.1, sd * len * 0.1)], true, 0.3); A.fill(fin, 'pastel', A.mix(o.c || '#ec8a2a', '#f8e0a0', 0.45), { w: 0.4, p: 0.9, reach: 1.4, passes: 2, ang }); K.hair(fin, 0.14, A.mix(o.back || '#c8401c', 'kajal', 0.3), { p: 0.5 }); }
    K.solid(body, o.c || '#ec8a2a', { w: Math.max(0.5, len * 0.06), ang });
    A.withMask(body, () => {
      A.stroke([T(len * 0.4, 0), T(len * 0.1, 0), T(-len * 0.3, 0)], 'pastel', o.back || '#c8401c', { w: len * 0.13, p: 0.8, tin: 0.2, tout: 0.4, streak: 0.1 });
      for (let row = -1; row <= 1; row++) for (let k = 0; k < 6; k++) {
        const u = len * (0.22 - k * 0.1), v = row * len * 0.07, c = T(u, v), r = len * 0.035;
        const arc = []; for (let j = 0; j <= 6; j++) { const a = ang + PI / 2 + j / 6 * PI; arc.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
        A.stroke(arc, 'chalk', A.mix('#f6d27a', o.c || '#ec8a2a', 0.25), { w: 0.16, p: 0.65, tin: 0.1, tout: 0.1 });
      }
    }, 0);
    for (const sd of [-1, 1]) { const e = T(len * 0.4, sd * len * 0.065); K.dot(e[0], e[1], 'kajal', len * 0.04); K.dot(e[0] - 0.1, e[1] - 0.1, '#fff6e0', len * 0.014); }
    K.ink(body, 0.22, { c: A.mix(o.back || '#c8401c', 'kajal', 0.5) });
    M.floorWash(A, bb, P.water.jade, () => 0.24, 'over');
  }

  /* the floating lamp (the Before stop): a leaf folded into a boat, a clay diya in it with its flame, marigolds and
     jasmine round it.  (x, y) = where it rides; s = 2.2 is its size in the sheet.  The flame goes to P.lamps. */
  M.w8FloatLamp = function (A, x, y, s, Pl) {
    const K = kit(A), u = s / 2.2, T = (a, b) => [x + a * u, y + b * u];
    // the boat: the hull below, the leaf's open face above it, both ends turned up
    const hull = A.spline([T(-19.5, -3.2), T(-15.5, 0.4), T(-8, 2.5), T(1, 3.1), T(10, 2.6), T(16.5, 0.6), T(20.8, -3.0), T(18.2, -1.4), T(10, 0.2), T(0, 0.7), T(-10, 0.3), T(-17, -1.6)], true, 0.4);
    const face = A.spline([T(-19.5, -3.2), T(-14, -1.9), T(-5, -2.6), T(5, -2.7), T(14, -2.1), T(20.8, -3.0), T(16, -0.6), T(8, 0.3), T(0, 0.6), T(-9, 0.2), T(-16, -1.0)], true, 0.4);
    K.burnish([hull, face]);
    K.solid(hull, '#2f5d26', { w: 0.8 * u, ang: 0.15 });
    A.withMask(hull, () => {
      A.fill([T(5, -4), T(24, -4), T(24, 4), T(3, 4)], 'pastel', '#22461c', { w: 0.8, p: 0.85, reach: 1.4, passes: 2, ang: 1.3, streak: 0.05 });
      for (let k = 0; k < 12; k++) { const a = -16 + k * 2.9; A.stroke([T(a, 0.2), T(a + 1.4, 2.6)], 'chalk', '#4a7a32', { w: 0.22, p: 0.6 }); }
    }, 0);
    K.solid(face, '#5f9640', { w: 0.8 * u, ang: 0.12 });
    A.withMask(face, () => {
      A.stroke([T(-18, -2.6), T(-6, -1.1), T(6, -1.1), T(19, -2.5)], 'chalk', '#a8c870', { w: 0.32, p: 0.8, tin: 0.1, tout: 0.2 });
      for (let k = 0; k < 15; k++) { const a = -17 + k * 2.45; for (const sd of [-1, 1]) A.stroke([T(a, -1.4), T(a + 1.6, -1.4 + sd * 1.3)], 'chalk', '#86b05a', { w: 0.16, p: 0.55, tin: 0.1, tout: 0.4 }); }
    }, 0);
    A.stroke([T(-19, -3.0), T(-14, -1.8), T(-5, -2.5), T(5, -2.6), T(14, -2.0), T(20.4, -2.9)], 'chalk', '#b8d888', { w: 0.34, p: 0.8 });
    K.ink(hull, 0.3, { c: A.mix('#10200c', K.INK, 0.3) });
    // the diya: a clay bowl pinched to a spout on the right, a sindoor band round it with white dots, oil, the wick
    const bowl = A.spline([T(-6.2, -3.4), T(-5.4, -1.2), T(-2, 0.2), T(2.6, 0.1), T(5.2, -1.4), T(6.6, -3.0), T(4.4, -3.6), T(0, -3.9), T(-4, -3.8)], true, 0.4);
    K.burnish(bowl);
    K.solid(bowl, C.clay, { w: 0.6 * u, ang: 0.4 });
    A.withMask(bowl, () => {
      A.fill([T(1.4, -5), T(8, -5), T(8, 1), T(0.4, 1)], 'pastel', C.clayDeep, { w: 0.6, p: 0.8, reach: 1.4, passes: 2, ang: 1.3, streak: 0.05 });
      A.stroke([T(-6, -2.2), T(-2, -1.0), T(2.4, -1.0), T(6, -2.3)], 'chalk', C.sindoor, { w: 0.62 * u, p: 0.95 });
      A.stroke([T(-4.8, -2.9), T(-3.4, -1.4)], 'chalk', '#d8865a', { w: 0.4, p: 0.8 });
    }, 0);
    const oil = A.ellipse(...T(-0.2, -3.6), 5.4 * u, 0.75 * u);
    K.solid(oil, '#3a1a0c', { w: 0.3 * u, ang: 0.02 });
    A.stroke([T(-3.5, -3.75), T(1.5, -3.85)], 'gold', 'gold', { w: 0.26, p: 0.8 });
    K.ink(bowl, 0.28, { c: A.mix('#3a1408', K.INK, 0.4) });
    K.dots([T(-5.6, -2.2), T(-2, -1.0), T(2.4, -1.0), T(5.6, -2.3)], 1.15 * u, '#fbe8c8', 0.34);
    const wk = T(5.4, -3.6);
    K.hair([wk, T(5.6, -4.6)], 0.24, '#2a1408', { p: 0.9 });
    // the flame and its halo: twelve fine rays round it, long and short, the way a painter shows a lamp burning
    const fc = T(5.9, -8.2);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - PI / 2, r0 = 4.3 * u, L = (i % 2 ? 1.6 : 2.8) * u; A.stroke([pol(fc[0], fc[1], r0, a), pol(fc[0], fc[1], r0 + L, a)], 'chalk', i % 2 ? '#f6d880' : '#f2b440', { w: 0.34, p: 0.85, tin: 0.05, tout: 0.6 }); }
    const fl = A.spline([T(5.6, -4.4), T(4.3, -6.4), T(5.3, -9.2), T(5.9, -11.6), T(6.6, -9.1), T(7.2, -6.3), T(5.9, -4.4)], true, 0.4);
    K.solid(fl, C.saffron, { w: 0.4 * u, ang: 1.5 });
    const fi = A.spline([T(5.7, -4.8), T(4.9, -6.6), T(5.8, -9.4), T(6.6, -6.6)], true, 0.4);
    A.fill(fi, 'pastel', '#f8d050', { w: 0.3, p: 1, reach: 1.5, passes: 2, ang: 1.5 });
    A.fill(A.spline([T(5.7, -5.2), T(5.3, -6.6), T(5.8, -8), T(6.2, -6.6)], true, 0.4), 'pastel', '#fff8de', { w: 0.24, p: 1, reach: 1.5, passes: 2, ang: 1.5 });
    A.stroke([T(5.4, -4.6), T(5.9, -5.1)], 'chalk', '#3a5aa0', { w: 0.3, p: 0.7 });
    K.hair(fl, 0.16, A.mix(C.sindoor, 'kajal', 0.2), { p: 0.6 });
    // marigolds and jasmine round the diya, and two rose petals
    const mari = (px, py, r) => { const c = T(px, py); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + A.rr(-0.1, 0.1); A.dot(c[0] + Math.cos(a) * r * 0.5, c[1] + Math.sin(a) * r * 0.32, 'chalk', k % 2 ? '#f0961e' : '#f6b22a', { w: r * 0.5, len: r * 0.12, ang: a, p: 1 }); } K.dot(c[0], c[1], '#e07a14', r * 0.5); K.dot(c[0] - r * 0.12, c[1] - r * 0.1, '#f8c84a', r * 0.2); K.hair(A.ellipse(c[0], c[1], r * 0.86, r * 0.56), 0.14, '#8a3a10', { p: 0.45 }); };
    mari(-12.4, -1.4, 2.1 * u); mari(-8.4, -0.4, 1.9 * u); mari(10.4, -0.7, 2 * u); mari(14.4, -1.6, 1.8 * u);
    for (const [px, py] of [[-15.6, -2.2], [-10.4, 0.2], [12.4, 0.1], [17.2, -2.3]]) { const c = T(px, py); A.dot(c[0], c[1], 'chalk', '#fbf6ea', { w: 0.95 * u, len: 0.35, ang: 0.2, p: 1 }); K.hair(A.ellipse(c[0], c[1], 0.55 * u, 0.36 * u), 0.12, '#8a8070', { p: 0.4 }); }
    for (const [px, py, a] of [[-4.8, 0.6, 0.4], [8.0, 0.4, -0.5]]) { const c = T(px, py); A.dot(c[0], c[1], 'chalk', C.rose, { w: 1.1 * u, len: 0.5, ang: a, p: 1 }); }
    // the flame, in sheet units, for the light painter and the page
    if (Pl && Pl.lamps) Pl.lamps.push(T(5.9, -7.6));
  };
  /* a cluster of lotus at the water's edge: pads of several sizes lying over one another, the far ones first, open
     flowers standing on their stems, buds, a young leaf still rolled, a white lily on the water.  L = the list. */
  function lotusBed(A, K, L) {
    for (const it of L.filter(i => i[0] === 'pad').sort((a, b) => a[2] - b[2])) pad(A, K, it[1], it[2], it[3], it[4]);
    for (const it of L.filter(i => i[0] !== 'pad').sort((a, b) => a[2] - b[2])) {
      if (it[0] === 'lily') lily(A, K, it[1], it[2], it[3]);
      else if (it[0] === 'lotus') lotusOpen(A, K, it[1], it[2], it[3]);
      else if (it[0] === 'bud') lotusBud(A, K, it[1], it[2], it[3], it[4]);
      else if (it[0] === 'roll') {
        const x = it[1], y = it[2], h = it[3], lean = it[4] || 0.4, tx = x + lean * h * 0.35;
        A.stroke([[x, y], [x + lean * h * 0.2, y - h * 0.6], [tx, y - h]], 'chalk', '#3f6b2a', { w: 0.42, p: 0.95 });
        const rl = A.spline([[tx - h * 0.12, y - h], [tx, y - h * 1.3], [tx + h * 0.34, y - h * 1.12], [tx + h * 0.1, y - h * 0.92]], true, 0.3);
        K.solid(rl, C.padIn, { w: 0.4 }); K.hair(rl, 0.18, A.mix(C.padInk, K.INK, 0.3), { p: 0.7 });
        A.stroke([[tx - h * 0.05, y - h * 1.05], [tx + h * 0.1, y - h * 1.24]], 'chalk', C.padLit, { w: 0.3, p: 0.7 });
      }
    }
  }

  /* the moon in the water at night: no disc.  The rows of waves run on through its place, and the moon is caught
     on them in short broken strokes, a few silver pulls along the crests, most near the middle, thinning to a stray one
     at the rim, and on the side toward the floating lamp a few of them warm.  Drawn last in the water (its own seed),
     so nothing before it changes. */
  function moonShimmer(A, hole, D, WP, lx) {
    const R = STAGE.rng(7719);
    for (const [xn, yy, s, ry, tilt, d, curlRow] of hole) {
      const crest = []; for (let i = 0; i <= 7; i++) { const a = PI + 0.1 + (PI - 0.2) * i / 7; crest.push([xn + Math.cos(a) * s, yy + Math.sin(a) * s * ry + Math.cos(a) * s * tilt, 0.55 + 0.45 * Math.sin(PI * i / 7)]); }
      A.stroke(crest, 'chalk', A.mix(WP.crest, WP.wave, R.rr(0.42, 0.8)), { w: 0.34 + 0.32 * d, p: R.rr(0.5, 0.72) * (0.85 + 0.15 * d) * R.rr(0.82, 1.12), tin: 0.15, tout: 0.15, wob: 0.3 });
    }
    for (const [xn, yy, s, ry, tilt] of hole) {
      const q = Math.hypot((xn - D.x) / D.rx, (yy - D.y) / D.ry), chance = 0.9 * (1 - q * q * 0.75);
      if (!R.chance(Math.max(0.08, chance))) continue;
      // a short pull along the crest's top, its length and place on the crest each its own
      const i0 = R.ri(1, 3), n = 2 + Math.floor(R.rr(0, 3 - 2 * Math.min(1, q)));
      const pts = []; for (let i = i0; i <= Math.min(6, i0 + n); i++) { const a = PI + 0.1 + (PI - 0.2) * i / 7; pts.push([xn + Math.cos(a) * s, yy + Math.sin(a) * s * ry - 0.08 + Math.cos(a) * s * tilt]); }
      const warm = xn < D.x - D.rx * 0.35 && R.chance(0.35);
      const col = warm ? A.mix('#f2c46a', '#f4f6fb', 0.3) : q < 0.6 ? '#f6f8fc' : A.mix('#f2f4fa', WP.wave, 0.25);
      A.stroke(pts, 'chalk', col, { w: 0.6 + 0.32 * (1 - q), p: 0.97 * (1 - 0.25 * q), tin: 0.2, tout: 0.25, wob: 0.2 });
      // near the middle, now and then a flat glint in the trough under it
      if (q < 0.7 && R.chance(0.45)) { const gx = xn + R.rr(-0.4, 0.4) * s, gy = yy + s * ry * 0.55, gl = s * R.rr(0.35, 0.7); A.stroke([[gx - gl, gy], [gx + gl, gy + R.rr(-0.06, 0.06)]], 'chalk', warm ? '#f0c878' : '#e4e9f5', { w: 0.42, p: 0.85, tin: 0.3, tout: 0.3 }); }
    }
  }
  M.w8y.water = Object.assign(function (A, G, H) {
    P = moodOf(A, G);
    const K = kit(A), W = H.W, WA = H.WA, WTOP = H.WTOP, WATER = H.WATER, stairHW = H.stairHW, WP = P.water, D = WP.disc;
    const pal = Object.assign({ lamps: G.lamps, glints: G.glints }, H.PAL.tank);
    M.w8Stone(A, G.tank.wall, pal, { course: 6 });
    A.stroke([[WA, WTOP + 0.5], [W - WA, WTOP + 0.5]], 'chalk', pal.lime, { w: 1.4, p: 0.9 });
    const water = G.tank.water, fl = G.obj.float, R = STAGE.rng(7707);
    K.burnish(water, 0.22);
    K.solid(water, WP.jade, { w: 5, ang: 0.03, passes: 3 });
    M.floorWash(A, water, WP.deep, (x, y) => 0.55 * sstep((y - 992) / 80), 'over');
    A.withMask(water, () => {
      // the shade the wall lays on the water, a flat band
      A.fill(rect(WA - 20, WATER, W - WA + 20, WATER + 3.2), 'pastel', A.mix(WP.deep, '#06101a', 0.4), { w: 1.4, p: 0.85, reach: 1.3, passes: 2, ang: 0.02, streak: 0.05 });
      // under it a calm band where the wall lies reflected: a paler flat, the lime nose come down as a broken line,
      // and the stone courses as long broken hairs, the water too still here for waves
      A.fill(rect(WA - 20, WATER + 3.2, W - WA + 20, WATER + 12.4), 'pastel', A.mix(WP.jade, WP.lit, 0.14), { w: 1.4, p: 0.8, reach: 1.3, passes: 2, ang: 0.02, streak: 0.05 });
      A.blend(rect(WA - 20, WATER + 9, W - WA + 20, WATER + 15), { r: 1.6, k: 0.4, ang: 0.02, len: 40 });
      for (const [dy, c, w, pr] of [[3.9, A.mix(WP.jade, WP.crest, 0.42), 0.42, 0.75], [6.6, A.mix(WP.jade, WP.lit, 0.5), 0.26, 0.6], [9.4, A.mix(WP.jade, WP.lit, 0.42), 0.24, 0.5], [11.6, A.mix(WP.jade, WP.lit, 0.32), 0.22, 0.42]]) {
        let x = WA - 14 + R.rr(0, 6);
        while (x < W - WA + 14) { const e = x + R.rr(14, 46); A.stroke([[x, WATER + dy + R.rr(-0.1, 0.1)], [e, WATER + dy + R.rr(-0.1, 0.1)]], 'chalk', c, { w, p: pr * R.rr(0.85, 1.05), tin: 0.15, tout: 0.15 }); x = e + R.rr(2, 7); }
      }
      // the stair going on down under the water: four nosings, each fainter, then lost in the deep
      for (let i = 0; i < 4; i++) {
        const y = WATER + 3.6 + i * 5.6, hw = stairHW(y), k = 1 - i / 4;
        A.fill(rect(960 - hw, y, 960 + hw, y + 2.6), 'pastel', A.mix(WP.jade, WP.stairLit, 0.22 * k), { w: 0.9, p: 0.9, reach: 1.4, passes: 2, ang: 0.02, streak: 0.05 });
        K.hair([[960 - hw, y + 0.1], [960 + hw, y + 0.1]], 0.24, A.mix(WP.jade, WP.stairLine, 0.45 * k), { p: 0.7 });
        K.hair([[960 - hw, y + 2.7], [960 + hw, y + 2.7]], 0.2, A.mix(WP.deep, '#06101a', 0.4), { p: 0.5 * k });
      }
      // fish, below the skin of the water: a pair turning by the lamp, a pair beside the sun, two alone
      fish(A, K, 870, 1062, 14, -0.5, {});
      fish(A, K, 934, 1070, 12.5, 2.7, { c: '#f2a23a', back: '#c8501c' });
      fish(A, K, 1052, 1050, 12, 0.35, { c: '#e8762a', back: '#b8401a' });
      fish(A, K, 1088, 1063, 11, 3.5, { c: '#f2b04a', back: '#c8601c' });
      fish(A, K, 712, 1024, 11, -0.2, {});
      fish(A, K, 1250, 1040, 12, 3.0, { c: '#f2a23a', back: '#c8501c' });
      // at night the stars lie in the far water too, a few, counted
      if (WP.starsIn) for (let i = 0; i < WP.starsIn; i++) {
        const x = 500 + (i + 0.5) / WP.starsIn * 920 + R.rr(-9, 9), y = 984 + ((i * 7) % 5) * 5.4 + R.rr(-1, 1);
        if (Math.abs(x - D.x) < D.rx + 6) continue;
        A.stroke([[x - 1.1, y], [x + 1.1, y]], 'chalk', '#e8ecf6', { w: 0.36, p: 0.8, tin: 0.3, tout: 0.3 });
        K.dot(x, y, i % 3 ? '#f2f2ea' : '#e8c060', 0.5);
      }
      /* the rows of Mewar waves: each wave a crest drawn in one pull with a short inner line under it, every seventh row
         a row of curls; the rows smaller and closer going back.  Below the sun (or the moon), and below the lamp, the
         crests take its colour.  The sun's own place is left for its medallion, painted next. */
      const discK = (x, y) => Math.hypot((x - D.x) / D.rx, (y - D.y) / D.ry);
      const path = (x, y) => { if (y < WP.path.y0) return 0; const spread = WP.path.spread + (y - D.y) * WP.path.grow; return Math.max(0, 1 - Math.abs(x - D.x) / spread) * (y < D.y + 40 ? 1 : 0.8); };
      const lampPath = (x, y) => { if (y < fl.y + 2.5 || y > fl.y + 34) return 0; const sp = 3 + (y - fl.y) * 0.13; return Math.max(0, 1 - Math.abs(x - (fl.x + 5.9)) / sp) * (1 - (y - fl.y) / 38); };
      let row = 0;
      const lx = fl.x + 5.9, ly = fl.y;
      // at night the moon's place is not a medallion: the rows run on through it (kept here, drawn last) and catch it
      const nightRef = P.mood === 'night', hole = [];
      for (let y = WATER + 13; y < 1086;) {
        const d = clamp((y - WATER) / 104, 0, 1), sz0 = 1.8 + 4.2 * d, step = 2.5 + 4.6 * d, curlRow = row % 7 === 4;
        const xl = H.rayX([WA, WTOP], y) - 4, xr = H.rayX([W - WA, WTOP], y) + 4;
        const tone = R.rr(0.5, 0.72);
        let x = xl + (row % 2 ? sz0 : 0) + R.rr(-0.6, 0.6);
        while (x < xr) {
          // round the lamp the rows open into rings and the waves grow; at the side walls the rows lift and widen
          const q = Math.hypot((x - lx) / 36, (y - ly) / 11), ring = Math.exp(-q * q), ed = clamp(1 - Math.min(x - xl, xr - x) / 70, 0, 1);
          const sz = sz0 * (1 + 0.6 * ring + 0.4 * ed * ed);
          const s = sz * R.rr(0.9, 1.1), tilt = R.rr(-0.06, 0.06) + 0.12 * ed * ed * (x < 960 ? -1 : 1), ry = 0.5 * R.rr(0.92, 1.08);
          const yy = y + (y < ly ? -1 : 1) * 4.4 * ring * clamp(Math.abs(y - ly) / 3, 0, 1) - 3.8 * ed * ed + R.rr(-0.08, 0.08) * sz;
          const xn = x; x += sz * 2 * R.rr(0.95, 1.05);
          if (discK(xn, yy - s * 0.2) < 1.04) { if (nightRef) hole.push([xn, yy, s, ry, tilt, d, curlRow]); continue; }
          const crest = []; for (let i = 0; i <= 7; i++) { const a = PI + 0.1 + (PI - 0.2) * i / 7; crest.push([xn + Math.cos(a) * s, yy + Math.sin(a) * s * ry + Math.cos(a) * s * tilt, 0.55 + 0.45 * Math.sin(PI * i / 7)]); }
          const sp = path(xn, yy), lp = lampPath(xn, yy), k = Math.max(sp, lp);
          let col, tool = 'chalk', w = 0.34 + 0.32 * d + 0.08 * ring, pr = tone * (0.85 + 0.15 * d) * R.rr(0.82, 1.12);
          if (k > 0.05) {
            const hi = lp > sp ? 'gold' : WP.path.hi, lo = lp > sp ? C.haldi : WP.path.lo;
            col = k > 0.5 ? hi : A.mix(lo, WP.wave, 0.55 - k * 0.6); tool = k > 0.5 && hi === 'gold' ? 'gold' : 'chalk'; w += 0.18 * k; pr = 0.6 + 0.35 * k;
          } else col = R.chance(0.12) ? A.mix(WP.crest, WP.wave, R.rr(0.12, 0.3)) : A.mix(WP.crest, WP.wave, R.rr(0.42, 0.8));
          if (curlRow) {
            // the crest rolls over at its right end into a small curl
            const cu = crest.slice(0, 6), e = cu[cu.length - 1];
            for (let i = 1; i <= 8; i++) { const t = i / 8, a = -PI * 0.25 + t * PI * 1.4, r = s * 0.34 * (1 - 0.55 * t); cu.push([e[0] + s * 0.06 + Math.cos(a) * r, e[1] + s * 0.3 + Math.sin(a) * r * 0.75, 0.7]); }
            A.stroke(cu, tool, col, { w, p: pr, tin: 0.1, tout: 0.25, wob: 0.25 });
          } else A.stroke(crest, tool, col, { w, p: pr, tin: 0.15, tout: 0.15, wob: 0.3 });
          if (k < 0.05 && d > 0.15) A.stroke(arcPts(xn + s * 0.08, yy + s * 0.18, s * 0.5, s * 0.22, PI * 1.15, PI * 1.85, 5), 'chalk', A.mix(WP.jade, WP.wave, 0.45), { w: 0.26 + 0.12 * d, p: 0.45, tin: 0.2, tout: 0.2 });
        }
        y += step * R.rr(0.95, 1.05); row++;
      }
      /* the sun come down to the water, as a medallion of small scallops laid in rows like the scales of a fish, each
         one filled and its crest drawn, the colours going from the heart out to the rim; its edge is the scallops' own.
         At night it is not painted (it runs on a mask that takes nothing, so every later draw keeps its seed): the moon
         is caught on the waves instead, below */
      const ghost = fn => nightRef ? A.withMask([[-9000, -9000], [-8990, -9000], [-8990, -8990], [-9000, -8990]], fn, 0) : fn();
      ghost(() => { for (let y = D.y - D.ry * 0.92, rw = 0; y <= D.y + D.ry * 0.98; y += D.ry * 0.17, rw++) {
        const e = (y - D.y) / D.ry, hw = D.rx * Math.sqrt(Math.max(0, 1 - e * e)), s = D.rx * 0.075 * (1 + 0.15 * (e + 1) / 2);
        for (let x = D.x - hw + (rw % 2 ? s : 0) + s * 0.6; x <= D.x + hw - s * 0.4; x += s * 2 * R.rr(0.97, 1.03)) {
          const dk = discK(x, y - s * 0.3), sw = 0.4 * Math.sin(y * 1.3 + x * 0.05);
          const crest = []; for (let i = 0; i <= 7; i++) { const a = PI + 0.08 + (PI - 0.16) * i / 7; crest.push([x + sw + Math.cos(a) * s, y + Math.sin(a) * s * 0.62]); }
          const fillC = dk < 0.4 ? D.fill[0] : dk < 0.64 ? (rw % 2 ? D.fill[1] : D.fill[0]) : dk < 0.84 ? D.fill[2] : D.fill[3];
          A.fill(crest.concat([[x + sw + s * 0.98, y + 0.3], [x + sw - s * 0.98, y + 0.3]]), 'pastel', fillC, { w: Math.max(0.45, s * 0.34), p: 1, reach: 1.5, passes: 2, gap: 0.42, ang: 0.05, streak: 0.04 });
          const rim = dk > 0.8, cc = rim ? D.rimCrest : D.crest;
          A.stroke(crest, cc === 'gold' ? 'gold' : 'chalk', cc, { w: 0.4, p: 0.95, tin: 0.12, tout: 0.12, wob: 0.25 });
        }
      } });
      // the flame's light lying in the water under the lamp: a short column of broken gold
      for (let yy = fl.y + 3.4, i = 0; yy < fl.y + 22; yy += 1.6 + i * 0.12, i++) {
        const t = (yy - fl.y) / 22, hw = 0.9 + 2.4 * t, cx = fl.x + 5.9 + 0.5 * Math.sin(yy * 0.8);
        A.stroke([[cx - hw, yy], [cx, yy + 0.12], [cx + hw, yy]], i % 3 ? 'chalk' : 'gold', i % 3 ? A.mix(C.haldi, '#fff2c0', 0.4) : 'gold', { w: 0.46, p: 0.92 * (1 - t * 0.6), tin: 0.25, tout: 0.25 });
      }
      // the lotus, in beds along the two sides, counted, the middle kept clear for the sun and the lamp
      lotusBed(A, K, [
        ['pad', 548, 988, 6.5, 0.4], ['pad', 566, 993, 8.5, 2.6], ['pad', 590, 1004, 10, 5.0], ['pad', 534, 1012, 8, 3.4], ['lotus', 574, 996, 8.2], ['bud', 546, 1007, 5.6, 0.7], ['lily', 600, 1009, 3.6],
        ['pad', 628, 1036, 9.5, 1.2], ['pad', 652, 1046, 12.5, 4.0], ['pad', 610, 1052, 8.5, 2.2], ['roll', 640, 1040, 5.6, -0.5], ['lotus', 660, 1040, 9.4], ['lily', 618, 1055, 3.4],
        ['pad', 560, 1060, 11, 5.6], ['pad', 584, 1074, 13.5, 0.8], ['bud', 572, 1066, 6.2, 0.6], ['pad', 702, 1072, 11, 3.0], ['pad', 724, 1080, 9, 5.2], ['lotus', 708, 1068, 9], ['pad', 806, 1074, 8.6, 2.6], ['bud', 812, 1072, 5.4, -0.4],
        ['pad', 1338, 988, 6.8, 2.8], ['pad', 1316, 995, 9, 0.6], ['pad', 1356, 1002, 8.4, 4.4], ['pad', 1294, 1010, 10.5, 2.0], ['lotus', 1330, 992, 7.8], ['bud', 1362, 999, 5.4, -0.6], ['lily', 1300, 1012, 3.4],
        ['pad', 1238, 1032, 10, 5.1], ['pad', 1262, 1044, 12.5, 1.5], ['roll', 1250, 1036, 5.4, 0.5], ['lily', 1236, 1036, 3.4],
        ['pad', 1344, 1052, 13, 3.6], ['pad', 1372, 1064, 10, 0.2], ['lotus', 1336, 1046, 9.6], ['bud', 1374, 1058, 6, -0.5],
        ['pad', 1196, 1072, 11, 4.4], ['pad', 1222, 1080, 8.5, 2.0], ['bud', 1204, 1068, 5.8, -0.6], ['pad', 1452, 1068, 10, 0.2], ['pad', 1112, 1078, 8, 3.1]
      ].map(it => P.lotusOpen ? it : it[0] === 'lotus' ? ['bud', it[1], it[2], it[3] * 0.82, 0.3] : it[0] === 'lily' ? ['lily', it[1], it[2], it[3] * 1.35] : it));
      // the floating lamp (its flame goes to G.lamps; the light painter lights it)
      M.w8FloatLamp(A, fl.x, fl.y, 2.2, pal);
      if (nightRef) moonShimmer(A, hole, D, WP, lx);
    });
  }, { part: 'sky' });
})();
