(function () {
  'use strict';
  /* ==========================================================================
     THE STAIR OF THE GOLD WELL, and what is loose on it, painted the folio way (part 'stair').
       M.w8y.stair(A, G, y0, y1, pal, H)       one flight and its landing: each tread laid in stones with a lit
                                               nose over a riser in shade, the landing paved, the parapets carved
                                               (a coloured band of florets between a coping and a dotted moulding),
                                               a post with a lotus bud at the head of each flight
       M.w8y.petals(A, L, H)                   the offerings left on each landing, counted: a leaf bowl heaped with
                                               marigolds, a lota on a step, a pair of jootis, a lamp or two
       M.w8y.pigeons(A, L, n, seed, avoid, H)  a pair and a single on the ledge, placed over the pillars
       M.w8y.air(A, G, H)                      one line of seven pigeons rising to the sun, and nothing else
       M.w8Pavilion   the chhatri pavilions beside the stair: a cusped opening, a deep chhajja on brackets, a drum
                      of niches, a ribbed dome on a band of lotus petals, a kalash on top
       M.w8Lamp, M.w8HangLamp, M.w8Rangoli, M.w8Cloth, M.w8Petal, M.w8Pigeon   the small things, drawn again
     Each shape is laid in one clean flat colour (the paper burnished under the big ones first), then one kajal
     contour in two goes, lighter than the focal objects' line; then its ornament, counted, each repeat a hair
     different.  Gold here is matte yellow ochre.  The light comes from the upper left.  Sheet units.
     ======================================================================== */
  const on = part => { const o = typeof process !== 'undefined' && process.env && process.env.W8Y; return !o || o.split(',').includes(part); };
  if (!on('stair')) return;
  M.w8y = M.w8y || {};
  const PI = Math.PI, TAU = PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const rng = seed => {
    let s = seed >>> 0;
    const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return { rnd, rr: (a, b) => a + (b - a) * rnd(), ri: (a, b) => Math.floor(a + (b - a + 1) * rnd()), pick: a => a[(rnd() * a.length) | 0] };
  };
  const CUR = { G: null };
  const moodOf = () => (CUR.G && CUR.G.mood) || 'day';
  const lampsOf = () => (CUR.G && CUR.G.lamps) || null;
  const hash = (x, y) => { const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return h - Math.floor(h); };

  const C = {
    lime: '#f6eedc', limeLit: '#fffaf0', limeSh: '#d6c6a8', limeDeep: '#a8957a', violet: '#5a4a78',
    haldi: '#edc94b', peori: '#e6b422', saffron: '#e88e1e', mari: '#e2701c', sindoor: '#d23c2a', ochre: '#c1892b', ochreDeep: '#7e5418',
    clay: '#b4562a', clayLit: '#d8834e', clayDeep: '#5e2410', lac: '#8f2331', madder: '#a82a1e',
    leaf: '#3b7f52', leafD: '#21523a', leafL: '#86b46a', lapis: '#2a4b96', neel: '#1d2850', pink: '#e9a0ae', rose: '#d4707e', jasmine: '#fbf8ee'
  };

  /* ------------------------------------------------------------ the kit, at sheet scale, with the wall's lighter line */
  function kit(A) {
    const INK = A.mix('kajal', 'neel', 0.12), KJ = A.tool('kajal', { wmin: 0.3 }), LF = A.tool('chalk', { wmin: 0.14, t0: 0.08 });
    const K = { INK, KJ, LF };
    // the paper pressed flat under a surface before it is painted, as lime plaster is polished
    K.burnish = (polys, k) => {
      k = k == null ? 0.8 : k;
      const HM = A.HM, W = A.W, H = A.H; if (!HM || !A.pushMask) return;
      const r = Math.max(2, Math.round(2 * A.S));
      for (const poly of (Array.isArray(polys[0][0]) ? polys : [polys])) {
        const m = A.pushMask(poly, 0); A.popMask();
        if (!m || !m.w || !m.h) continue;
        const x0 = Math.max(0, m.x0 - r), y0 = Math.max(0, m.y0 - r), x1 = Math.min(W, m.x0 + m.w + r), y1 = Math.min(H, m.y0 + m.h + r);
        const bw = x1 - x0, bh = y1 - y0; if (bw <= 0 || bh <= 0) continue;
        const I = new Float64Array((bw + 1) * (bh + 1));
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
    K.solid = (p, c, o) => A.fill(p, 'pastel', c, Object.assign({ w: 1.6, p: 1, reach: 1.6, passes: 3, gap: 0.42, ang: 1.5, streak: 0.08, cv: 0.01 }, o));
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
      A.stroke(ring.map(p => [p[0], p[1]]), KJ, c, { w: w * 0.62, p: 1, tin: closed ? 0 : 0.04, tout: closed ? 0 : 0.06, wob: 0.2 });
      A.stroke(ring.map((p, i) => [p[0], p[1], 0.4 + 0.6 * swr[i]]), KJ, c, { w, p: 1, tin: closed ? 0 : 0.05, tout: closed ? 0 : 0.08, wob: 0.2 });
    };
    K.hair = (p, w, c, o) => A.stroke(p, KJ, c || INK, Object.assign({ w: w || 0.22, p: 0.72, tin: 0.06, tout: 0.08, wob: 0.3 }, o));
    K.lit = (p, w, c, o) => A.stroke(p, LF, c || C.limeLit, Object.assign({ w: w || 0.45, p: 0.85, tin: 0.08, tout: 0.12, wob: 0.25 }, o));
    K.dot = (x, y, c, w, o) => A.dot(x, y, 'chalk', c, Object.assign({ w: w || 0.8, p: 0.95 }, o));
    // a ruled row of dots, each a hair off in place and size, never a stamp
    K.dots = (path, step, c, w, o) => {
      o = o || {};
      for (const q of A.along(path, step, 0)) {
        if (o.skip && o.skip(q)) continue;
        K.dot(q.x + A.rr(-0.07, 0.07) * step, q.y + A.rr(-0.06, 0.06) * step, c, w * A.rr(0.88, 1.1), { p: A.rr(0.86, 1) });
      }
    };
    K.floret = (x, y, r, petal, heart, n) => {
      const a0 = A.rr(0, 1.25); n = n || 5;
      for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n + A.rr(-0.08, 0.08); A.dot(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, 'chalk', petal || C.limeLit, { w: r * 0.62 * A.rr(0.92, 1.06), len: r * 0.14, ang: a, p: 0.97 }); }
      K.dot(x, y, heart || C.haldi, r * 0.42);
    };
    // a leaf: one pull, pointed at both ends, a little bent
    K.leaf = (x, y, ang, len, wid, c, o) => {
      o = o || {};
      const ca = Math.cos(ang), sa = Math.sin(ang), bend = (o.bend != null ? o.bend : A.rr(-0.18, 0.18)) * len;
      A.stroke([[x, y], [x + ca * len * 0.5 - sa * bend, y + sa * len * 0.5 + ca * bend], [x + ca * len, y + sa * len]], LF, c, { w: wid, p: o.p || 0.96, tin: 0.42, tout: 0.5, wob: 0.12, reach: 1.3 });
    };
    // a soft painted wash inside a shape: f(x, y) -> 0..1
    K.wash = (poly, c, f, mode) => M.floorWash(A, poly, c, f, mode || 'mul');
    return K;
  }

  // a cusped arch: jambs from the base to the spring, then a head that rises to a point, its edge bulging inward in nl lobes
  function arch(ox0, ox1, yb, ys, ya, nl, amp) {
    const ax = (ox0 + ox1) / 2, hw = (ox1 - ox0) / 2, rise = ys - ya, head = [], N = 56;
    for (let i = 0; i <= N; i++) {
      const f = i / N, th = f * PI, c = Math.cos(th);
      const x0 = ax - c * hw, y0 = ys - rise * (1 - Math.pow(Math.abs(c), 1.7));
      if (!nl) { head.push([x0, y0]); continue; }
      const dx = x0 - ax, dy = y0 - (ys + rise * 0.15), dl = Math.hypot(dx, dy) || 1, bulge = amp * Math.abs(Math.sin(PI * nl * f));
      head.push([x0 - dx / dl * bulge, y0 - dy / dl * bulge]);
    }
    return [[ox0, yb]].concat(head, [[ox1, yb]]);
  }

  // a flame: a teardrop of saffron round a haldi heart and a white core, leaning a little
  function flame(A, K, x, y, h, lean) {
    lean = lean || 0;
    const P = (u, v) => [x + u * h + lean * h * (-v), y + v * h];
    const out = A.spline([P(0, 0), P(-0.2, -0.12), P(-0.17, -0.42), P(-0.04, -0.78), P(0.02, -1), P(0.06, -0.72), P(0.17, -0.4), P(0.2, -0.12)], true, Math.max(0.08, h * 0.04));
    A.fill(out, 'pastel', C.saffron, { w: Math.max(0.2, h * 0.12), p: 1, reach: 1.6, passes: 3, gap: 0.42, ang: 1.5, streak: 0.05 });
    const mid = A.spline([P(0, -0.04), P(-0.11, -0.16), P(-0.08, -0.42), P(0.01, -0.66), P(0.08, -0.4), P(0.11, -0.16)], true, Math.max(0.06, h * 0.03));
    A.fill(mid, 'pastel', C.haldi, { w: Math.max(0.16, h * 0.08), p: 1, reach: 1.6, passes: 2, gap: 0.42, ang: 1.5, streak: 0.05 });
    const c = P(0, -0.16);
    A.dot(c[0], c[1], 'chalk', '#fffbe8', { w: Math.max(0.2, h * 0.1), len: h * 0.05, ang: PI / 2, p: 1 });
    K.ink(out, Math.max(0.12, Math.min(0.26, h * 0.07)), { c: A.mix(C.lac, K.INK, 0.35) });
  }

  /* ================================================================ the stair */
  // a post at the head of a flight: a square pier with a carved panel, a cap, an amalaka and a lotus bud
  function post(A, K, xm, yT, yB, band, P) {
    const hw = 3.3, lime = A.mix(C.lime, P.stone, 0.1);
    const body = rect(xm - hw, yT, xm + hw, yB);
    K.solid(body, lime, { w: 0.9, ang: 1.57 });
    A.withMask(body, () => A.fill(rect(xm + hw * 0.25, yT - 1, xm + hw + 1, yB + 1), 'shade', C.limeSh, { w: 1, p: 0.5, passes: 1, ang: 1.5 }), 0);
    const pan = rect(xm - hw + 0.95, yT + 1.6, xm + hw - 0.95, yB - 1.7);
    K.solid(pan, band, { w: 0.5, passes: 2 });
    K.floret(xm, (yT + yB) / 2 - 0.1, 1.5, C.limeLit, C.sindoor);
    K.hair(pan.concat([pan[0]]), 0.17, null, { p: 0.65 });
    K.lit([[xm - hw + 0.45, yT + 0.5], [xm - hw + 0.45, yB - 0.4]], 0.38, null, { p: 0.75 });
    const base = rect(xm - hw - 0.5, yB - 1.1, xm + hw + 0.5, yB + 0.2);
    K.solid(base, lime, { w: 0.5, ang: 0.02, passes: 2 });
    K.ink(body, 0.42);
    K.ink(base, 0.3);
    // the cap, the amalaka, the bud
    const cap = [[xm - hw - 0.9, yT], [xm - hw - 0.35, yT - 1.3], [xm + hw + 0.35, yT - 1.3], [xm + hw + 0.9, yT]];
    K.solid(cap, A.mix(lime, C.limeLit, 0.4), { w: 0.5, ang: 0.02, passes: 2 });
    K.ink(cap, 0.32);
    const am = A.ellipse(xm, yT - 2.05, 2.05, 0.8);
    K.solid(am, C.ochre, { w: 0.4, passes: 2 });
    for (let k = -2; k <= 2; k++) K.hair([[xm + k * 0.72, yT - 2.75], [xm + k * 0.8, yT - 1.35]], 0.12, A.mix(C.ochreDeep, K.INK, 0.3), { p: 0.6 });
    K.ink(am, 0.24);
    const bud = A.spline([[xm - 1.2, yT - 2.7], [xm - 1.45, yT - 4.1], [xm - 0.7, yT - 5.6], [xm, yT - 6.7], [xm + 0.7, yT - 5.6], [xm + 1.45, yT - 4.1], [xm + 1.2, yT - 2.7]], true, 0.22);
    K.solid(bud, A.mix(C.haldi, C.ochre, 0.45), { w: 0.4, passes: 2 });
    A.withMask(bud, () => A.fill(rect(xm + 0.3, yT - 7, xm + 2, yT - 2.5), 'shade', C.ochreDeep, { w: 0.7, p: 0.45, passes: 1, ang: 1.4 }), 0);
    K.lit([[xm - 0.75, yT - 3.3], [xm - 0.55, yT - 5.1]], 0.3, '#fff3c4', { p: 0.8 });
    K.ink(bud, 0.26);
    K.dot(xm, yT - 7.1, C.sindoor, 0.55);
  }

  M.w8y.stair = Object.assign(function (A, G, y0, y1, pal, H) {
    if (G) CUR.G = G;
    const levels = (G && G.levels) || H.LV, L = levels.find(l => Math.abs(l.land - y1) < 0.6);
    if (!L || L.foot == null) return H.old.stairPart(A, G, y0, y1, pal);
    const K = kit(A), hw = H.stairHW, cx = 960, first = L.k === 1, last = !levels.some(l => l.k === L.k + 1);
    const yA = first ? Math.max(y0, H.CHHATRI.base) : y0, yF = L.foot, yB = y1, PW = 5;
    const tread = A.mix(pal.lime, pal.stoneLit || pal.stone, 0.3), band0 = pal.frieze || pal.accent, riser = A.mix(A.mix(band0, pal.stone, 0.3), pal.stoneDeep, 0.12);
    const land = A.mix(pal.lime, pal.stoneLit || pal.stone, 0.22), band = pal.frieze || pal.accent;
    const X = (y, sg, d) => cx + sg * (hw(y) + d);
    const strip = (sg, d0, d1, ya, yb) => [[X(ya, sg, d0), ya], [X(ya, sg, d1), ya], [X(yb, sg, d1), yb], [X(yb, sg, d0), yb]];
    const stair = [[cx - hw(yA) - 0.5, yA], [cx + hw(yA) + 0.5, yA], [cx + hw(yB) + 0.5, yB], [cx - hw(yB) - 0.5, yB]];
    const HK = M.w8Hand;
    if (HK) HK.burnish(A, [stair, strip(-1, 0, PW + 0.3, yA, yB), strip(1, 0, PW + 0.3, yA, yB)]);
    else K.burnish([stair, strip(-1, 0, PW + 0.3, yA, yB), strip(1, 0, PW + 0.3, yA, yB)], 0.28);

    // 1. the flight: n steps from the head to the landing.  Each tread is laid in three stones, a hair different in tone
    // from the tread above it; its nose is a lit line drawn by hand over a riser in the level's colour, with a row of
    // white dots on every other riser; down the middle the stone is worn smooth where the feet go.  Nothing stands on
    // the treads: walkers go up and down them.
    const n = Math.max(1, Math.round((yF - yA) / 5.6)), st = (yF - yA) / n;
    const TT = [0.0, 0.09, 0.03, 0.13, 0.055, 0.11, 0.02, 0.075];
    const jointsOf = i => { const o = (((i * 5 + L.k * 3) % 7) - 3) / 3 * 0.15; return [cx - hw(yA + i * st) * (0.35 - o), cx + hw(yA + i * st) * (0.33 + o)]; };
    const worn = A.mix(pal.stoneWarm || pal.stone, C.limeLit, 0.22), rDot = A.mix(C.limeLit, riser, 0.08), rLine = A.mix(riser, pal.line || K.INK, 0.45);
    for (let i = 0; i < n; i++) {
      const hv = k => (hash(i * 7.1 + L.k, k * 3.3) - 0.5);
      const ys = yA + i * st, yn = ys + st * (0.58 + hv(9) * 0.06), ye = ys + st, h0 = hw(ys) + 0.4, js = jointsOf(i), tt = TT[(i * 3 + L.k) % TT.length];
      // the tread (the first tread of a lower flight is the landing above, already laid)
      if (first || i > 0) {
        const xs = [cx - h0, js[0], js[1], cx + h0], tc = A.mix(tread, pal.stoneWarm || pal.stone, tt);
        for (let j = 0; j < 3; j++) {
          const tv = [0.0, 0.028, 0.012][(i + j + L.k) % 3];
          K.solid(rect(xs[j] - 0.1, ys - 0.2, xs[j + 1] + 0.1, yn + 0.05), A.mix(tc, pal.stoneDeep, tv), { w: 1.1, ang: 0.02, passes: 3 });
        }
        if (HK) {
          const tr = rect(cx - h0, ys - 0.2, cx + h0, yn + 0.05);
          HK.ground(A, tr, A.mix(tc, C.limeLit, 0.5), A.mix(tc, pal.stoneWarm || pal.stone, 0.3), { ang: 0.01 + hv(11) * 0.015, pl: 0.46, sp: 0.75 });
        }
        // the worn path: a placed tone, warmer and smoother, wandering a little and wider toward the foot
        const wx = cx + Math.sin(i * 0.7 + L.k * 1.3) * 1.3, ww = h0 * lerp(0.3, 0.42, i / n);
        K.wash(rect(cx - h0, ys, cx + h0, yn), worn, x => 0.42 * (1 - sstep((Math.abs(x - wx) - ww * 0.5) / (ww * 0.5))), 'over');
        for (const jx of js) K.hair([[jx, ys + 0.3], [jx + 0.08, yn - 0.25]], 0.17, A.mix(K.INK, tread, 0.5), { p: 0.6 });
      }
      // the riser, in the level's colour, darker under the nose that hangs over it
      const rs = rect(cx - h0, yn, cx + hw(ye) + 0.4, ye + 0.12);
      const rc = A.mix(riser, pal.stoneDeep, [0, 0.1, 0.04, 0.14, 0.06][(i * 2 + L.k) % 5]);
      K.solid(rs, rc, { w: 0.9, ang: 0.02, passes: 3 });
      if (HK) HK.ground(A, rs, A.mix(rc, '#fff4e0', 0.16), A.mix(rc, pal.stoneDeep, 0.12), { ang: 0.01 + hv(13) * 0.015, pl: 0.36, sp: 0.8 });
      A.stroke([[cx - h0, yn + 0.5], [cx + h0, yn + 0.5]], 'shade', rLine, { w: 0.85, p: 0.5, tin: 0, tout: 0 });
      for (const jx of js) K.hair([[jx + 0.08, yn + 0.45], [jx + 0.1, ye - 0.15]], 0.14, A.mix(K.INK, riser, 0.3), { p: 0.45 });
      if ((i + L.k) % 2 === 0) K.dots([[cx - h0 + 1.3, (yn + ye) / 2 + 0.12], [cx, (yn + ye) / 2 + 0.2 + hv(4) * 0.12], [cx + h0 - 1.3, (yn + ye) / 2 + 0.1]], 1.62, rDot, 0.4);
      K.hair([[cx - h0, ye + 0.05], [cx + hv(5) * 6, ye + 0.1], [cx + hw(ye) + 0.4, ye + 0.05]], 0.15, A.mix(K.INK, riser, 0.4), { p: 0.45 });
      // the nose: a lit edge drawn by hand, never ruled, and the kajal under it
      K.lit([[cx - h0 + 0.3, yn - 0.32 + hv(0) * 0.12], [cx - h0 * 0.4, yn - 0.36 + hv(1) * 0.14], [cx + hv(2) * 4, yn - 0.27 + hv(2) * 0.1], [cx + h0 * 0.42, yn - 0.35 + hv(3) * 0.14], [cx + h0 - 0.3, yn - 0.31]],
        0.5 * (1 + hv(6) * 0.2), C.limeLit, { p: 0.92, tin: 0.03, tout: 0.05, wob: 0.4 });
      K.hair([[cx - h0, yn + 0.06], [cx + hv(7) * 8, yn + 0.12 + hv(8) * 0.08], [cx + h0, yn + 0.06]], 0.26, A.mix(K.INK, riser, 0.15), { p: 0.8, tin: 0, tout: 0, wob: 0.35 });
    }
    // 2. the landing: three courses of three slabs, the joints moved course by course
    const lh = yB - yF;
    if (lh > 4) {
      const rows = 3;
      for (let r = 0; r < rows; r++) {
        const ya = yF + r * lh / rows, yb = yF + (r + 1) * lh / rows, h0 = hw(ya) + 0.4, o2 = (r % 2 ? 0.16 : -0.1) + (L.k % 2 ? 0.05 : -0.05);
        const xs = [cx - h0, cx - hw(ya) * (0.34 - o2), cx + hw(ya) * (0.36 + o2), cx + h0];
        for (let j = 0; j < 3; j++) {
          const tv = [0.025, 0.0, 0.04, 0.01, 0.05, 0.005][(r * 2 + j + L.k) % 6];
          K.solid(rect(xs[j] - 0.1, ya - 0.1, xs[j + 1] + 0.1, yb + 0.1), A.mix(land, pal.stoneWarm || pal.stone, tv), { w: 1.6, ang: 0.02, passes: 3 });
        }
        if (HK) HK.ground(A, rect(cx - h0, ya - 0.1, cx + h0, yb + 0.1), A.mix(land, C.limeLit, 0.5), A.mix(land, pal.stoneWarm || pal.stone, 0.25), { w: Math.max(3, (yb - ya) * 1.6), ang: 0.02 + (r - 1) * 0.02, cross: 0.08 });
        K.wash(rect(cx - h0, ya, cx + h0, yb), C.limeLit, x => 0.2 * (1 - sstep(Math.abs(x - cx) / (h0 * 0.7))), 'over');
        for (let j = 1; j < 3; j++) K.hair([[xs[j], ya + 0.2], [xs[j] + 0.1, yb - 0.2]], 0.18, A.mix(K.INK, land, 0.45), { p: 0.6 });
        if (r > 0) {
          K.hair([[cx - h0, ya], [cx + h0, ya + 0.05]], 0.2, A.mix(K.INK, land, 0.4), { p: 0.65, tin: 0, tout: 0 });
          K.lit([[cx - h0 + 0.3, ya + 0.42], [cx + h0 - 0.3, ya + 0.45]], 0.36, C.limeLit, { p: 0.7 });
        }
      }
      // the front edge of the last landing, where the water begins (the others are the head of the next flight)
      if (last) {
        K.lit([[cx - hw(yB) + 0.3, yB - 0.7], [cx + hw(yB) - 0.3, yB - 0.68]], 0.5, C.limeLit, { p: 0.9 });
        K.hair([[cx - hw(yB), yB - 0.15], [cx + hw(yB), yB - 0.12]], 0.28, null, { p: 0.8, tin: 0, tout: 0 });
      }
    }
    // the left parapet throws its shade a little way onto the stair
    K.wash(stair, pal.stoneDeep, (x, y) => 0.24 * (1 - sstep((x - (cx - hw(y))) / 2.8)), 'mul');

    // 3. the parapets: a coping, a carved band of florets between two rules, a moulding with a row of dots
    for (const sg of [-1, 1]) {
      const par = strip(sg, 0, PW, yA, yB);
      K.solid(par, A.mix(C.lime, pal.stone, 0.12), { w: 1.1, ang: 1.57, passes: 3 });
      const bd = strip(sg, 1.3, 3.75, yA, yB);
      K.solid(bd, band, { w: 0.8, ang: 1.57, passes: 3 });
      // the band: a four-petalled flower every 6.2 units, two dots between, each a hair different
      const rep = 6.2, y00 = yA + (first ? 3.6 : 4.4);
      for (let y = y00, j = 0; y < yB - 2.2; y += rep, j++) {
        const xm = X(y, sg, 2.52), r = 1.02;
        for (let k = 0; k < 4; k++) { const a = PI / 4 + k * PI / 2 + A.rr(-0.06, 0.06); A.dot(xm + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.62, 'chalk', C.limeLit, { w: r * 0.72 * A.rr(0.92, 1.05), len: r * 0.16, ang: a, p: 0.97 }); }
        K.dot(xm, y, j % 2 ? C.haldi : C.sindoor, 0.5);
        if (y + rep * 0.5 < yB - 1.5) { K.dot(X(y + rep * 0.36, sg, 2.52), y + rep * 0.36, C.limeLit, 0.36); K.dot(X(y + rep * 0.64, sg, 2.52), y + rep * 0.64, C.limeLit, 0.36); }
      }
      for (const d of [1.3, 3.75]) K.hair([[X(yA, sg, d), yA + 0.3], [X((yA + yB) / 2, sg, d) + A.rr(-0.06, 0.06), (yA + yB) / 2], [X(yB, sg, d), yB - 0.2]], 0.2, null, { p: 0.7 });
      // the coping: lit along its top
      K.lit([[X(yA, sg, 0.62), yA + 0.4], [X(yB, sg, 0.62), yB - 0.3]], 0.5, C.limeLit, { p: 0.88 });
      // the moulding: a dotted row in the band's colour
      K.dots([[X(yA, sg, 4.42), yA + 1.2], [X(yB, sg, 4.42), yB - 0.8]], 1.55, A.mix(band, K.INK, 0.15), 0.42);
      // shade down the right of each parapet: the light is from the upper left
      const shd = sg < 0 ? strip(sg, 0, 1.25, yA, yB) : strip(sg, 3.9, PW, yA, yB);
      K.wash(shd, A.mix(C.limeSh, C.violet, 0.2), () => 0.42, 'mul');
      K.ink(par, 0.48);
    }
    // 4. a post on each parapet at the head of the flight, and at the foot of the last
    for (const sg of [-1, 1]) {
      post(A, K, X(yA, sg, 2.5), yA - 2.2, yA + 8, band, pal);
      if (last) post(A, K, X(yB, sg, 2.5), yB - 9.5, yB - 0.2, band, pal);
    }
  }, { part: 'stair' });

  /* ================================================================ the pavilions beside the stair */
  // the ribbed dome on its drum: a little swollen at the shoulder, drawn to a point at the crown
  function domeOf(A, K, xc, yb, dr, dh, P, lime) {
    const tip = dh * 0.14;
    const dpt = a => { const u = Math.cos(a), v = Math.sin(a), sw = 1 + 0.055 * Math.abs(Math.sin(2 * (a - PI))); const k = Math.max(0, 1 - Math.abs(u) / 0.3); return [xc + u * dr * sw, yb + v * dh - tip * k * k]; };
    const dome = []; for (let i = 0; i <= 72; i++) dome.push(dpt(PI + i / 72 * PI));
    const poly = dome.concat([[xc + dr, yb + 0.5], [xc - dr, yb + 0.5]]);
    const sh = A.mix(C.limeSh, P.stone, 0.15), shD = A.mix(C.limeDeep, C.violet, 0.15);
    K.solid(poly, lime, { w: 1.5, ang: 1.15 });
    A.withMask(poly, () => {
      // a band of lotus petals standing round its foot, foreshortened toward the edges
      const np = 13, ph = dh * 0.24;
      for (let k = 0; k < np; k++) {
        const az = lerp(-1.32, 1.32, k / (np - 1)) + A.rr(-0.015, 0.015), px = xc + dr * 0.98 * Math.sin(az), pw = dr * 0.105 * (0.3 + 0.7 * Math.cos(az));
        const pet = A.spline([[px - pw, yb + 0.3], [px - pw * 0.9, yb - ph * 0.5], [px, yb - ph], [px + pw * 0.9, yb - ph * 0.5], [px + pw, yb + 0.3]], false, 0.25);
        A.fill(pet, 'pastel', A.mix(lime, C.limeLit, 0.55), { w: Math.max(0.35, pw * 0.5), p: 1, reach: 1.5, passes: 2, gap: 0.42, ang: 1.5, streak: 0.05 });
        K.hair(pet, 0.17, A.mix(K.INK, lime, 0.3), { p: 0.62 });
        K.dot(px, yb - ph * 0.3, C.sindoor, Math.max(0.3, pw * 0.32));
      }
      // nine ribs from the drum to the crown, each a fine line with the light on its left
      for (let k = 1; k <= 9; k++) {
        const u0 = -1 + 2 * k / 10, rib = [];
        for (let i = 0; i <= 20; i++) { const a = PI + (i / 20) * PI / 2, p = dpt(a); rib.push([xc + u0 * Math.abs(p[0] - xc), p[1]]); }
        const r2 = rib.filter(p => p[1] < yb - ph * 0.9);
        K.hair(r2, 0.2, A.mix(K.INK, lime, u0 < 0 ? 0.5 : 0.36), { p: 0.62, tin: 0.04, tout: 0.3 });
        if (u0 < 0.3) K.lit(r2.slice(0, Math.round(r2.length * 0.75)).map(p => [p[0] - 0.55, p[1]]), 0.42, C.limeLit, { p: 0.6, tout: 0.35 });
      }
      // the shade turning round the right of the dome, in two soft goes
      A.fill([[xc + dr * 0.12, yb - dh - tip - 2], [xc + dr * 1.2, yb - dh - tip - 2], [xc + dr * 1.2, yb + 1], [xc + dr * 0.06, yb + 1]], 'shade', sh, { w: 2, p: 0.5, passes: 1, ang: 1.25 });
      A.fill([[xc + dr * 0.55, yb - dh], [xc + dr * 1.2, yb - dh], [xc + dr * 1.2, yb + 1], [xc + dr * 0.5, yb + 1]], 'shade', shD, { w: 2, p: 0.32, passes: 1, ang: 1.25 });
      // and the light on its left shoulder
      const sho = []; for (let i = 0; i <= 10; i++) { const a = PI + 0.12 + i * 0.05, p = dpt(a); sho.push([lerp(xc, p[0], 0.86), lerp(yb, p[1], 0.9)]); }
      K.lit(sho, 0.9, C.limeLit, { p: 0.5, tin: 0.3, tout: 0.4 });
    }, 0);
    K.ink(dome, 0.5, { closed: false, at: [xc, yb - dh * 0.4] });
    return dpt(PI * 1.5)[1];
  }
  // the crown: an inverted lotus, the amalaka, the kalash and its spike, in matte ochre
  function crown(A, K, xc, yc, s, lime) {
    for (let k = 0; k < 7; k++) {
      const px = xc + (k - 3) * 1.55 * s, d = Math.abs(k - 3) / 3;
      const pet = A.spline([[px - 0.95 * s, yc - 1.2 * s + d * 0.4 * s], [px - 0.8 * s, yc + 0.1 * s], [px, yc + (1.1 - d * 0.5) * s], [px + 0.8 * s, yc + 0.1 * s], [px + 0.95 * s, yc - 1.2 * s + d * 0.4 * s]], false, 0.2);
      A.fill(pet, 'pastel', A.mix(lime, C.limeLit, 0.4), { w: 0.4 * s, p: 1, reach: 1.5, passes: 2, gap: 0.42, ang: 1.5 });
      K.hair(pet, 0.15, A.mix(K.INK, lime, 0.25), { p: 0.6 });
    }
    const am = A.ellipse(xc, yc - 2.3 * s, 2.9 * s, 1.15 * s);
    K.solid(am, C.ochre, { w: 0.45 * s, passes: 2 });
    for (let k = -3; k <= 3; k++) K.hair([[xc + k * 0.85 * s, yc - 3.3 * s], [xc + k * 0.95 * s, yc - 1.3 * s]], 0.12, A.mix(C.ochreDeep, K.INK, 0.3), { p: 0.55 });
    A.withMask(am, () => A.fill(rect(xc + 0.8 * s, yc - 4 * s, xc + 3.5 * s, yc), 'shade', C.ochreDeep, { w: 0.8, p: 0.4, passes: 1, ang: 1.4 }), 0);
    K.ink(am, 0.26);
    const pot = A.spline([[xc - 1.1 * s, yc - 3.4 * s], [xc - 2.3 * s, yc - 4.9 * s], [xc - 1.6 * s, yc - 6.8 * s], [xc - 0.7 * s, yc - 7.4 * s], [xc - 1.1 * s, yc - 8.1 * s], [xc + 1.1 * s, yc - 8.1 * s], [xc + 0.7 * s, yc - 7.4 * s], [xc + 1.6 * s, yc - 6.8 * s], [xc + 2.3 * s, yc - 4.9 * s], [xc + 1.1 * s, yc - 3.4 * s]], true, 0.25);
    K.solid(pot, A.mix(C.ochre, C.haldi, 0.3), { w: 0.45 * s, passes: 2 });
    A.withMask(pot, () => A.fill(rect(xc + 0.5 * s, yc - 9 * s, xc + 3 * s, yc - 3 * s), 'shade', C.ochreDeep, { w: 0.8, p: 0.42, passes: 1, ang: 1.4 }), 0);
    K.lit([[xc - 1.5 * s, yc - 4.6 * s], [xc - 1.2 * s, yc - 6.4 * s]], 0.36, '#fff3c4', { p: 0.8 });
    K.dots([[xc - 1.9 * s, yc - 5.6 * s], [xc + 1.9 * s, yc - 5.6 * s]], 0.95 * s, C.sindoor, 0.36);
    K.ink(pot, 0.26);
    const spike = [[xc - 0.42 * s, yc - 8.1 * s], [xc, yc - 12.6 * s], [xc + 0.42 * s, yc - 8.1 * s]];
    A.fill(spike, 'pastel', C.ochre, { w: 0.3, p: 1, reach: 1.5, passes: 2 });
    K.hair(spike, 0.16);
    K.dot(xc, yc - 9.6 * s, C.ochre, 0.95 * s);
    K.dot(xc, yc - 12.8 * s, C.ochre, 0.8 * s);
    K.dot(xc - 0.2 * s, yc - 9.85 * s, '#fff3c4', 0.3 * s);
  }

  M.w8Pavilion = function (A, x0, x1, R, P, o) {
    o = o || {};
    const K = kit(A), w = x1 - x0, xc = (x0 + x1) / 2, h = R.foot - R.top, room = o.room || 'ground';
    const yCh = R.top + h * 0.14, yb = R.arB, yRoof = R.top - h * 0.15;
    const lime = A.mix(C.lime, P.stone, 0.1), band = P.frieze || P.accent || C.sindoor;
    const ox0 = x0 + w * 0.17, ox1 = x1 - w * 0.17, ow = ox1 - ox0, ys = yb - (yb - yCh) * 0.6, ya = yCh + h * 0.1;
    const op = arch(ox0, ox1, yb, ys, ya, 9, ow * 0.032), fr = arch(ox0 - w * 0.042, ox1 + w * 0.042, yb, ys, ya - w * 0.042, 0, 0);
    const cL = x0 - w * 0.05, cR = x1 + w * 0.05, cT = yCh - h * 0.012, cF = yCh + h * 0.028, cU = yCh + h * 0.074;
    const dr = w * 0.39, yDr0 = yCh - h * 0.07, ap = yRoof + h * 0.045, dh = yDr0 - ap;
    const body = rect(x0, cT, x1, yb);
    K.burnish([rect(x0 - 1, cT - 1, x1 + 1, R.foot + 1), rect(xc - dr * 1.1, ap - 4, xc + dr * 1.1, cT + 1)], 0.28);
    // 1. the shade it throws on the wall to its right, where there is wall there
    if (x0 > 960) K.wash([[x1, cU], [x1 + w * 0.07, cU + h * 0.05], [x1 + w * 0.07, R.foot], [x1, R.foot]], P.stoneDeep, (x) => 0.36 * (1 - sstep((x - x1) / (w * 0.07))), 'mul');
    // 2. the body, lime, a little paler than the wall
    K.solid(body, lime, { w: 2, ang: 1.5 });
    // the deep shade under the chhajja, laid before the frame and the pillars so they stand in front of it
    const lipB = cF + h * 0.017;
    K.solid(rect(x0, lipB - 0.5, x1, cU + 0.3), A.mix(P.stoneDeep || '#5a3a2a', '#2e2230', 0.3), { w: 0.7, ang: 0.02, passes: 3 });
    K.wash(rect(x0, cU, x1, cU + h * 0.09), P.stoneDeep || '#5a3a2a', (x, y) => 0.34 * (1 - sstep((y - cU) / (h * 0.09))), 'mul');
    // 3. the frame round the opening, a band of the level's colour with a row of white dots
    K.solid(fr, band, { w: 1.1, ang: 1.2 });
    // 4. the room behind the opening
    const roomC = room === 'gold' ? A.mix(P.gold || '#d6a535', '#b8862c', 0.35) : room === 'dark' ? A.mix(P.dark || '#1c1a14', '#2a1c24', 0.25) : P.ground;
    K.solid(op, roomC, { w: 1.4, ang: 1.5 });
    const fl = rect(ox0 - 1, yb - (yb - ys) * 0.09, ox1 + 1, yb + 0.5);
    A.withMask(op, () => {
      if (room === 'gold') {
        // matte ochre painted with a net of lozenges, a dot at every crossing and a small flower in every lozenge
        const q = ow / 7.5, deep = A.mix(roomC, C.ochreDeep, 0.5);
        for (let c = -12; c <= 12; c++) {
          const ox = xc + c * q;
          K.hair([[ox - (yb - ya), yb], [ox + 0.1, ya - 2], [ox + (yb - ya), yb - 0.1]].slice(0, 2), 0.16, deep, { p: 0.5, tin: 0, tout: 0 });
          K.hair([[ox, ya - 2], [ox + (yb - ya) + 2, yb + 0.1]], 0.16, deep, { p: 0.5, tin: 0, tout: 0 });
        }
        for (let r = 0; r * q * 0.5 < yb - ya + 2; r++) for (let c = -12; c <= 12; c++) {
          const y = ya - 2 + r * q * 0.5, x = xc + c * q + (r % 2 ? q * 0.5 : 0);
          if (x < ox0 - 1 || x > ox1 + 1) continue;
          K.dot(x, y, A.mix(roomC, '#fff3c4', 0.55), 0.48);
          const fy = y + q * 0.25, fx = x + q * 0.25 * 0;
          if (r % 2 === 0) { for (let k = 0; k < 4; k++) { const a = k * PI / 2 + A.rr(-0.1, 0.1); K.dot(fx + q * 0.5 * 0 + Math.cos(a) * 0.55, fy + Math.sin(a) * 0.55, A.mix(C.sindoor, roomC, 0.25), 0.42); } }
        }
        K.wash(op, C.ochreDeep, (x, y) => 0.42 * (1 - sstep((y - ya) / ((yb - ya) * 0.6))) + 0.22 * sstep((Math.abs(x - xc) - ow * 0.32) / (ow * 0.2)), 'mul');
        // a shrine niche in the back wall, deeper ochre, warm where the lamp above lights its sill, a kalash in it
        const gb = yb - (yb - ys) * 0.09, gw = ow * 0.15, gh = (yb - ys) * 0.62, gk = arch(xc - gw, xc + gw, gb, gb - gh * 0.6, gb - gh, 5, ow * 0.012);
        K.solid(gk, A.mix(roomC, C.ochreDeep, 0.62), { w: 0.6 });
        K.wash(gk, '#d89a48', (x, y) => 0.5 * Math.exp(-Math.pow((x - xc) / (gw * 0.95), 2) - Math.pow((y - gb) / (gh * 0.5), 2)), 'over');
        K.dots(arch(xc - gw - 1, xc + gw + 1, gb, gb - gh * 0.6, gb - gh - 1, 0, 0).slice(1, -1).filter(p => p[1] < gb - 1.5), 1.35, A.mix(roomC, '#fff3c4', 0.6), 0.36);
        K.ink(gk.slice(1, -1), 0.3, { closed: false });
        kalash(A, K, xc, gb - 0.25, gw * 0.62);
        K.solid(fl, A.mix(roomC, lime, 0.4), { w: 0.8, ang: 0.02, passes: 2 });
      } else if (room === 'dark') {
        // a dark room, painted: deep and flat, deeper toward the top; on the back wall a faint arch in a lighter tone with
        // a row of dots; the diya on the floor lights the sill and the foot of the wall round it, in two placed tones
        const bk = A.mix(roomC, P.stoneDeep || '#5a3a2a', 0.2), by = yb - (yb - ys) * 0.1;
        const back = arch(ox0 + ow * 0.2, ox1 - ow * 0.2, by, ys + (yb - ys) * 0.1, ya + (ys - ya) * 0.42, 7, ow * 0.02);
        K.solid(back, bk, { w: 0.9, passes: 2 });
        K.hair(back.slice(1, -1), 0.22, A.mix(roomC, '#c8a070', 0.42), { p: 0.62 });
        K.dots(arch(ox0 + ow * 0.155, ox1 - ow * 0.155, by, ys + (yb - ys) * 0.1, ya + (ys - ya) * 0.42 - ow * 0.045, 0, 0).slice(1, -1).filter(p => p[1] < by - 3), 1.7, A.mix(roomC, '#d8b080', 0.42), 0.36);
        K.wash(op, '#000000', (x, y) => 0.32 * (1 - sstep((y - ya) / ((yb - ya) * 0.7))), 'mul');
        const ly = yb - (yb - ys) * 0.05;
        for (const [rx, ry, c, p] of [[0.3, 0.42, '#7a4a26', 0.4], [0.2, 0.28, '#a0642e', 0.42], [0.11, 0.16, '#c88a44', 0.45]]) {
          const e = A.ellipse(xc, ly, ow * rx, (yb - ys) * ry);
          A.withMask(e, () => A.fill(rect(xc - ow * rx, ly - (yb - ys) * ry, xc + ow * rx, ly + 1), 'shade', c, { w: 1.1, p, passes: 2, ang: 1.25, gap: 0.6 }), 1.2);
        }
        K.solid(fl, A.mix(roomC, '#6a4424', 0.45), { w: 0.8, ang: 0.02, passes: 2 });
        for (const [rx, c, p] of [[0.3, '#b07838', 0.5], [0.17, '#e2a85a', 0.6]]) {
          const e = A.ellipse(xc, fl[0][1] + (fl[2][1] - fl[0][1]) * 0.45, ow * rx, (fl[2][1] - fl[0][1]) * 0.7);
          A.withMask(e, () => A.fill(fl, 'pastel', c, { w: 0.6, p, passes: 2, ang: 0.05, gap: 0.5, streak: 0.1 }), 1);
        }
        K.hair([[ox0, fl[0][1]], [ox1, fl[0][1] + 0.1]], 0.2, A.mix(roomC, '#c89a6a', 0.3), { p: 0.55 });
      } else {
        // the level's ground, painted as a lit recess, deeper toward the top; a jasmine creeper climbs the back wall either
        // side of a cusped niche and meets over it; in the niche a kalash with mango leaves and a diya, the niche warm
        // where the lamp lights it from below
        const lt = A.mix(roomC, C.limeLit, 0.5);
        K.wash(op, P.stoneDeep || '#5a2a1a', (x, y) => 0.44 * (1 - sstep((y - ya) / ((yb - ya) * 0.62))) + 0.18 * sstep((Math.abs(x - xc) - ow * 0.3) / (ow * 0.22)), 'mul');
        const nb = yb - (yb - ys) * 0.09, nw = ow * 0.17, nh = (yb - ys) * 0.72, nk = arch(xc - nw, xc + nw, nb, nb - nh * 0.6, nb - nh, 5, ow * 0.014);
        for (const sg of [-1, 1]) {
          const stem = A.spline([[xc + sg * (nw + 2.4), nb], [xc + sg * (nw + 3.6), nb - nh * 0.45], [xc + sg * (nw + 1.8), nb - nh * 0.92], [xc + sg * 1.4, nb - nh * 1.16], [xc, nb - nh * 1.2]], false, 0.3);
          A.stroke(stem, 'chalk', A.mix(C.leafD, roomC, 0.15), { w: 0.4, p: 0.95, tin: 0.05, tout: 0.2, wob: 0.2 });
          A.along(stem, 2.5, 0).forEach((q, k) => {
            if (k === 0) return;
            const side = k % 2 ? 1 : -1;
            K.leaf(q.x, q.y, q.ang + side * 1.05, 2.1 + 0.25 * Math.sin(k * 1.7), 0.85, k % 3 ? C.leaf : C.leafL, { bend: 0.12 * side });
            if (k % 3 === 2) K.floret(q.x - side * 1.1, q.y + 0.4, 1.15, C.limeLit, C.haldi, 5);
          });
        }
        K.solid(nk, A.mix(roomC, P.dark || '#2a1810', 0.55), { w: 0.6 });
        K.wash(nk, '#a8662e', (x, y) => 0.62 * Math.exp(-Math.pow((x - xc) / (nw * 0.95), 2) - Math.pow((y - nb) / (nh * 0.55), 2)), 'over');
        K.dots(arch(xc - nw - 1, xc + nw + 1, nb, nb - nh * 0.6, nb - nh - 1, 0, 0).slice(1, -1).filter(p => p[1] < nb - 1.5), 1.35, lt, 0.36);
        K.ink(nk.slice(1, -1), 0.3, { closed: false });
        kalash(A, K, xc - nw * 0.32, nb - 0.25, nw * 0.62);
        K.solid(fl, A.mix(roomC, lime, 0.35), { w: 0.8, ang: 0.02, passes: 2 });
      }
    }, 0);
    // the edge of the opening, its dot row, the frame's own line
    K.ink(op.slice(1, -1), 0.55, { closed: false, at: [xc, yb - 6] });
    const mid = arch(ox0 - w * 0.021, ox1 + w * 0.021, yb, ys, ya - w * 0.021, 0, 0).slice(1, -1).filter(p => p[1] < yb - 2.5);
    K.dots(mid, 1.7, C.limeLit, 0.5);
    K.ink(fr.slice(1, -1), 0.4, { closed: false, at: [xc, yb - 6] });
    // what is in the room
    if (room === 'gold') M.w8HangLamp(A, xc, ya + 1, ys - (ys - ya) * 0.06, ow / 36, P);
    else if (room === 'dark') { M.w8Lamp(A, xc, yb - (yb - ys) * 0.04, ow * 0.17, P, true); }
    else M.w8Lamp(A, xc + ow * 0.08, yb - (yb - ys) * 0.09 - 0.3, ow * 0.1, P, true);
    // 5. the spandrels: a flower in each, two leaves under it
    for (const sg of [-1, 1]) {
      const fx = xc + sg * w * 0.3, fy = cU + (ys - cU) * 0.3;
      K.leaf(fx - sg * 0.4, fy + 1.2, PI / 2 + sg * 0.7, w * 0.05, 0.9, C.leaf, { bend: 0.1 * sg });
      K.leaf(fx + sg * 0.4, fy + 1.2, PI / 2 - sg * 0.2, w * 0.045, 0.85, C.leaf, { bend: -0.1 * sg });
      K.floret(fx, fy, w * 0.036, C.limeLit, band);
    }
    // 6. its pillars
    for (const px of [x0 + w * 0.08, x1 - w * 0.08]) M.w8Pillar(A, px, yCh + h * 0.035, yb, w * 0.085, P);
    // 7. the drum: a band of small dark niches between two rules
    const drum = rect(xc - dr * 1.04, yDr0, xc + dr * 1.04, cT + 0.4);
    K.solid(drum, A.mix(lime, C.limeLit, 0.2), { w: 0.9, ang: 0.02 });
    {
      const nn = 9, span = dr * 2.08, dh2 = cT - yDr0, nw = span / nn * 0.5;
      for (let k = 0; k < nn; k++) {
        const nx = xc - dr * 1.04 + (k + 0.5) * span / nn + A.rr(-0.06, 0.06), nb = cT - dh2 * 0.18;
        const ni = arch(nx - nw / 2, nx + nw / 2, nb, nb - dh2 * 0.38, nb - dh2 * 0.62, 3, nw * 0.06);
        K.solid(ni, A.mix(P.stoneDeep || '#5a3a2a', '#2a1a22', 0.4), { w: 0.4, passes: 2 });
        K.hair(ni.slice(1, -1), 0.15, null, { p: 0.6 });
        if (k < nn - 1) K.dot(nx + span / nn * 0.5, nb - dh2 * 0.32, band, 0.42);
      }
      A.withMask(drum, () => A.fill(rect(xc + dr * 0.2, yDr0 - 1, xc + dr * 1.2, cT + 1), 'shade', C.limeSh, { w: 1.2, p: 0.5, passes: 1, ang: 1.5 }), 0);
      K.lit([[xc - dr * 1.02, yDr0 + 0.45], [xc + dr * 0.4, yDr0 + 0.5]], 0.38, C.limeLit, { p: 0.8 });
      K.ink(drum, 0.42);
    }
    // 8. the dome and its crown
    const yTop = domeOf(A, K, xc, yDr0, dr, dh, P, lime);
    crown(A, K, xc, yTop + 0.6, Math.max(0.7, dr / 35), lime);
    // 9. the chhajja: a sloping top laid in ribs, a lip with a row of dots, the deep shade under it, three brackets
    {
      const top = [[x0 + w * 0.02, cT], [x1 - w * 0.02, cT], [cR, cF], [cL, cF]];
      K.solid(top, A.mix(lime, C.limeLit, 0.3), { w: 0.8, ang: 0.02 });
      for (let k = 1; k < 18; k++) { const t = k / 18; K.hair([[lerp(x0 + w * 0.02, x1 - w * 0.02, t), cT + 0.3], [lerp(cL, cR, t), cF - 0.2]], 0.14, A.mix(K.INK, lime, 0.55), { p: 0.5, tin: 0, tout: 0 }); }
      K.wash(top, A.mix(C.limeSh, C.violet, 0.2), x => 0.4 * sstep((x - xc) / (w * 0.5) + 0.1), 'mul');
      K.ink(top, 0.4);
      const lip = rect(cL, cF, cR, cF + h * 0.017);
      K.solid(lip, lime, { w: 0.7, ang: 0.02 });
      K.dots([[cL + 1.4, (cF + lip[2][1]) / 2], [cR - 1.4, (cF + lip[2][1]) / 2]], 1.6, A.mix(band, K.INK, 0.1), 0.48);
      K.wash(lip, A.mix(C.limeSh, C.violet, 0.2), x => 0.35 * sstep((x - xc) / (w * 0.5) + 0.2), 'mul');
      K.ink(lip, 0.4);
      // the todas: a pendant bracket over each pillar and one in the middle, a ring round it, a bud at its end
      for (const bx of [x0 + w * 0.08, xc, x1 - w * 0.08]) {
        const bt = lip[2][1], bh = cU - bt + h * 0.03;
        const br = A.spline([[bx - 1.15, bt], [bx - 1.1, bt + bh * 0.5], [bx - 0.8, bt + bh * 0.8], [bx, bt + bh], [bx + 0.8, bt + bh * 0.8], [bx + 1.1, bt + bh * 0.5], [bx + 1.15, bt]], true, 0.18);
        K.solid(br, lime, { w: 0.5, passes: 2 });
        A.withMask(br, () => A.fill(rect(bx + 0.15, bt - 0.5, bx + 1.6, bt + bh + 0.5), 'shade', C.limeSh, { w: 0.8, p: 0.5, passes: 1, ang: 1.5 }), 0);
        K.hair([[bx - 1.1, bt + bh * 0.42], [bx + 1.1, bt + bh * 0.44]], 0.14, A.mix(K.INK, lime, 0.4), { p: 0.6 });
        K.dot(bx, bt + bh * 0.7, band, 0.5);
        K.lit([[bx - 0.75, bt + 0.4], [bx - 0.7, bt + bh * 0.62]], 0.26, C.limeLit, { p: 0.7 });
        K.ink(br, 0.3);
      }
    }
    // 10. the plinth under the opening, a sill, a threshold slab
    M.w8Dado(A, x0, x1, yb, R.foot, P);
    const sill = rect(ox0 - w * 0.07, yb - 0.4, ox1 + w * 0.07, yb + 1.6);
    K.solid(sill, A.mix(lime, C.limeLit, 0.3), { w: 0.6, ang: 0.02, passes: 2 });
    K.lit([[sill[0][0] + 0.4, yb], [sill[1][0] - 0.4, yb + 0.05]], 0.36, C.limeLit, { p: 0.85 });
    K.ink(sill, 0.34);
    const th = rect(x0 - w * 0.03, R.foot - h * 0.025, x1 + w * 0.03, R.foot + h * 0.02);
    K.solid(th, A.mix(lime, C.limeLit, 0.25), { w: 0.9, ang: 0.02, passes: 2 });
    K.lit([[th[0][0] + 0.5, th[0][1] + 0.45], [th[1][0] - 0.5, th[0][1] + 0.5]], 0.42, C.limeLit, { p: 0.85 });
    K.wash(th, A.mix(C.limeSh, C.violet, 0.2), x => 0.3 * sstep((x - xc) / (w * 0.55) + 0.2), 'mul');
    K.ink(th, 0.4);
    K.ink(body.slice(0, 2).concat([[x1, R.foot - h * 0.025], [x0, R.foot - h * 0.025]]), 0.36);
    return { op, yCh, yRoof };
  };

  /* ================================================================ lamps */
  // a clay diya on its sill, lit or not: wd is the width of the bowl, (x, y) the middle of its foot
  M.w8Lamp = function (A, x, y, wd, P, lit) {
    const K = kit(A), s = wd, lw = clamp(s * 0.06, 0.16, 0.36);
    const bowl = A.spline([[x - 0.5 * s, y - 0.23 * s], [x - 0.42 * s, y - 0.1 * s], [x - 0.2 * s, y - 0.01 * s], [x + 0.14 * s, y], [x + 0.36 * s, y - 0.09 * s], [x + 0.47 * s, y - 0.19 * s],
      [x + 0.6 * s, y - 0.3 * s], [x + 0.44 * s, y - 0.27 * s], [x + 0.1 * s, y - 0.24 * s], [x - 0.25 * s, y - 0.25 * s]], true, Math.max(0.1, s * 0.03));
    K.solid(bowl, C.clay, { w: Math.max(0.3, s * 0.12), passes: 2 });
    A.withMask(bowl, () => A.fill(rect(x + 0.05 * s, y - 0.4 * s, x + 0.7 * s, y + 0.1), 'shade', C.clayDeep, { w: Math.max(0.4, s * 0.12), p: 0.45, passes: 1, ang: 1.4 }), 0);
    const oil = A.ellipse(x - 0.03 * s, y - 0.245 * s, 0.4 * s, 0.055 * s);
    A.fill(oil, 'pastel', C.clayDeep, { w: Math.max(0.2, s * 0.05), p: 1, passes: 2, reach: 1.5 });
    K.lit([[x - 0.44 * s, y - 0.2 * s], [x - 0.1 * s, y - 0.18 * s], [x + 0.3 * s, y - 0.19 * s]], Math.max(0.16, s * 0.045), C.clayLit, { p: 0.85 });
    if (s > 3) for (let k = 0; k < 3; k++) K.dot(x - 0.24 * s + k * 0.2 * s, y - 0.1 * s + Math.abs(k - 1) * 0.015 * s, '#f6ead6', Math.max(0.2, s * 0.05));
    K.ink(bowl, lw);
    if (!lit) return;
    const fx = x + 0.5 * s, fy = y - 0.27 * s;
    flame(A, K, fx, fy, s * 0.62, -0.08);
    if (P && P.lamps) P.lamps.push([fx, fy - 0.36 * s]);
  };

  // a brass lamp hung on a chain: links counted down to a little dome, three chains to the bowl, one flame
  M.w8HangLamp = function (A, x, y0, y1, s, P) {
    const K = kit(A), br = '#b8862c', brD = A.mix(br, C.ochreDeep, 0.5), cap = y1 - 4.4 * s;
    for (let y = y0, k = 0; y < cap - 0.6 * s; y += 1.15 * s, k++) {
      if (k % 2 === 0) { const e = A.ellipse(x, y + 0.55 * s, 0.32 * s, 0.6 * s); K.hair(e, 0.14, brD, { p: 0.75, tin: 0, tout: 0 }); }
      else K.hair([[x, y], [x, y + 1.1 * s]], 0.2, brD, { p: 0.8, tin: 0, tout: 0 });
    }
    const dome = A.spline([[x - 1.1 * s, cap + 1.1 * s], [x - 0.8 * s, cap + 0.2 * s], [x, cap - 0.3 * s], [x + 0.8 * s, cap + 0.2 * s], [x + 1.1 * s, cap + 1.1 * s]], true, 0.2);
    K.solid(dome, br, { w: 0.4 * s, passes: 2 });
    K.ink(dome, 0.2);
    K.dot(x, cap - 0.55 * s, br, 0.55 * s);
    const rim = y1 - 0.9 * s;
    for (const dx of [-1.9, 0, 1.9]) K.hair([[x + dx * 0.45 * s, cap + 1.1 * s], [x + dx * s, rim]], 0.12, brD, { p: 0.7, tin: 0, tout: 0 });
    const bowl = A.spline([[x - 2.3 * s, rim], [x - 1.9 * s, rim + 1.1 * s], [x - 0.9 * s, rim + 1.9 * s], [x + 0.9 * s, rim + 1.9 * s], [x + 1.9 * s, rim + 1.1 * s], [x + 2.3 * s, rim]], true, 0.2);
    K.solid(bowl, br, { w: 0.45 * s, passes: 2 });
    A.withMask(bowl, () => {
      A.fill(rect(x + 0.4 * s, rim - 1, x + 3 * s, rim + 3 * s), 'shade', C.ochreDeep, { w: 0.8 * s, p: 0.45, passes: 1, ang: 1.4 });
      A.stroke([[x - 2.2 * s, rim + 0.75 * s], [x + 2.2 * s, rim + 0.75 * s]], 'chalk', C.sindoor, { w: 0.42 * s, p: 0.9, tin: 0, tout: 0 });
    }, 0);
    K.dots([[x - 1.8 * s, rim + 0.3 * s], [x + 1.8 * s, rim + 0.3 * s]], 0.9 * s, '#fff3c4', 0.3 * s);
    K.ink(bowl, 0.24);
    K.dot(x, rim + 2.5 * s, br, 0.6 * s);
    for (const dx of [-0.25, 0, 0.25]) K.hair([[x + dx * s, rim + 2.7 * s], [x + dx * 1.6 * s, rim + 3.9 * s]], 0.14, C.sindoor, { p: 0.85, tout: 0.4 });
    flame(A, K, x, rim - 0.1 * s, 2.6 * s, -0.05);
    if (P && P.lamps) P.lamps.push([x, rim - 1.6 * s]);
  };

  /* ================================================================ on the floor */
  // a rangoli laid on a threshold, seen a little from above: rings of petals in powder, white dots between, a blue heart
  M.w8Rangoli = function (A, cx, cy, rx, ry, P) {
    const K = kit(A), Q = (u, v) => [cx + u * rx, cy + v * ry], acc = (P && P.accent) || C.sindoor;
    const ring = (r, n, f) => { for (let i = 0; i < n; i++) f(i * TAU / n + A.rr(-0.02, 0.02), r, i); };
    const petal = (a, r0, r1, wd, c) => {
      const pts = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10, ang = a + (t < 0.5 ? -1 : 1) * wd * Math.sin(Math.min(t, 1 - t) * PI) * 0 + 0; void ang; }
      const tip = [Math.cos(a) * r1, Math.sin(a) * r1], b0 = [Math.cos(a - wd) * r0, Math.sin(a - wd) * r0], b1 = [Math.cos(a + wd) * r0, Math.sin(a + wd) * r0];
      const m0 = [Math.cos(a - wd * 0.8) * lerp(r0, r1, 0.55), Math.sin(a - wd * 0.8) * lerp(r0, r1, 0.55)], m1 = [Math.cos(a + wd * 0.8) * lerp(r0, r1, 0.55), Math.sin(a + wd * 0.8) * lerp(r0, r1, 0.55)];
      for (const p of [b0, m0, tip, m1, b1]) pts.push(Q(p[0], p[1]));
      const poly = A.spline(pts, true, 0.15);
      A.fill(poly, 'chalk', c, { w: 0.42, p: 1, reach: 1.5, passes: 2, gap: 0.42 });
      return poly;
    };
    // the ground of the rangoli, a pale ring of rice flour
    const e = A.ellipse(cx, cy, rx, ry);
    A.fill(e, 'chalk', A.mix('#f2e6cc', acc, 0.08), { w: 0.6, p: 0.9, reach: 1.5, passes: 2, gap: 0.42 });
    ring(0.86, 12, a => { const p = petal(a, 0.6, 1.0, 0.2, acc); K.hair(p, 0.1, '#fbf8ee', { p: 0.8 }); });
    ring(0.6, 12, (a, r, i) => { const q = Q(Math.cos(a + PI / 12) * 0.86, Math.sin(a + PI / 12) * 0.86); K.dot(q[0], q[1], C.haldi, 0.55); void i; });
    ring(0.4, 8, a => { const p = petal(a + PI / 8, 0.24, 0.58, 0.32, C.haldi); K.hair(p, 0.1, A.mix(C.ochreDeep, '#ffffff', 0.2), { p: 0.6 }); });
    ring(0.6, 24, a => { const q = Q(Math.cos(a) * 0.6, Math.sin(a) * 0.6); K.dot(q[0], q[1], '#fbf8ee', 0.3); });
    const h = A.ellipse(cx, cy, rx * 0.2, ry * 0.2);
    A.fill(h, 'chalk', C.lapis, { w: 0.4, p: 1, passes: 2, reach: 1.5 });
    K.dot(cx, cy, '#fbf8ee', 0.42);
    K.dots(A.ellipse(cx, cy, rx * 1.08, ry * 1.1), 1.15, '#fbf8ee', 0.38);
    K.hair(e.concat([e[0]]), 0.14, A.mix(acc, K.INK, 0.4), { p: 0.45, tin: 0, tout: 0 });
  };

  // one petal, fallen or falling: a marigold's frilled tongue, a rose petal cupped, a jasmine star, a fleck of ochre
  M.w8Petal = function (A, x, y, s, kind, ang) {
    const a = ang != null ? ang : A.rr(0, TAU), ca = Math.cos(a), sa = Math.sin(a);
    const P = (u, v) => [x + (u * ca - v * sa) * s, y + (u * sa + v * ca) * s];
    const lw = clamp(0.1 * s, 0.1, 0.22), INK = A.mix('kajal', 'neel', 0.12);
    if (kind === 'mari' || kind === 'gold') {
      const c = kind === 'gold' ? A.pick(['#d6a535', '#c99a35']) : A.pick(['#e88e1e', '#edb03a', '#e2701c', '#f0a52a']);
      const p = A.spline([P(-1.5, 0), P(-1.1, -0.48), P(-0.2, -0.7), P(0.7, -0.78), P(1.1, -0.5), P(1.45, -0.62), P(1.6, -0.2), P(1.42, 0.04), P(1.6, 0.3), P(1.3, 0.62), P(0.7, 0.72), P(-0.2, 0.62), P(-1.1, 0.42)], true, Math.max(0.08, 0.2 * s));
      A.fill(p, 'chalk', c, { w: Math.max(0.24, 0.5 * s), p: 1, reach: 1.5, passes: 2, gap: 0.42 });
      A.stroke([P(-1.2, 0), P(0, 0.05), P(1.1, 0)], 'chalk', A.mix(c, C.lac, 0.38), { w: Math.max(0.12, 0.18 * s), p: 0.75, tin: 0.2, tout: 0.4 });
      A.stroke([P(-0.6, -0.4), P(0.8, -0.5)], 'chalk', A.mix(c, '#fff3c4', 0.45), { w: Math.max(0.1, 0.16 * s), p: 0.7 });
      A.stroke(p.concat([p[0]]), 'kajal', A.mix(INK, c, 0.45), { w: lw, p: 0.6, tin: 0, tout: 0, wob: 0.2 });
    } else if (kind === 'rose') {
      const c = A.pick([C.pink, C.rose, '#e07a8f', '#eeb0b4']);
      const p = A.spline([P(-1.2, 0), P(-0.9, -0.75), P(0, -1.0), P(0.7, -0.9), P(1.15, -0.45), P(1.0, -0.05), P(1.18, 0.3), P(0.8, 0.82), P(0, 0.95), P(-0.9, 0.7)], true, Math.max(0.08, 0.2 * s));
      A.fill(p, 'chalk', c, { w: Math.max(0.24, 0.55 * s), p: 1, reach: 1.5, passes: 2, gap: 0.42 });
      A.stroke([P(-1, -0.1), P(-0.2, -0.05)], 'chalk', A.mix(c, C.lac, 0.45), { w: Math.max(0.14, 0.32 * s), p: 0.7, tout: 0.6 });
      A.stroke([P(-0.3, -0.62), P(0.6, -0.65)], 'chalk', A.mix(c, '#ffffff', 0.45), { w: Math.max(0.1, 0.18 * s), p: 0.7 });
      A.stroke(p.concat([p[0]]), 'kajal', A.mix(INK, c, 0.45), { w: lw, p: 0.6, tin: 0, tout: 0, wob: 0.2 });
    } else {
      for (let k = 0; k < 5; k++) { const b = a + k * TAU / 5; A.dot(x + Math.cos(b) * 0.75 * s, y + Math.sin(b) * 0.75 * s, 'chalk', C.jasmine, { w: 0.9 * s, len: 0.3 * s, ang: b, p: 0.97 }); }
      A.dot(x, y, 'chalk', C.haldi, { w: 0.5 * s, p: 0.95 });
    }
  };

  /* a marigold head seen from the side and a little above: a round puff of frilled petals, darker under, lit on top */
  function marigold(A, K, x, y, r, c) {
    c = c || C.saffron;
    const e = A.ellipse(x, y, r, r * 0.86);
    A.fill(e, 'pastel', c, { w: Math.max(0.25, r * 0.5), p: 1, reach: 1.6, passes: 2, gap: 0.42, ang: 1.5, streak: 0.05 });
    const deep = A.mix(c, C.lac, 0.42), lt = A.mix(c, '#fff3c4', 0.5);
    for (let k = 0; k < 9; k++) { const a = k * TAU / 9 + A.rr(-0.1, 0.1); A.dot(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.72, 'chalk', a > 0 && a < PI ? deep : A.mix(c, deep, 0.3), { w: r * 0.42, len: r * 0.08, ang: a, p: 0.95 }); }
    for (let k = 0; k < 5; k++) { const a = PI + 0.4 + k * 0.38; A.dot(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.38, 'chalk', lt, { w: r * 0.3, len: r * 0.06, ang: a, p: 0.9 }); }
    K.dot(x + r * 0.05, y + r * 0.02, A.mix(c, C.lac, 0.6), Math.max(0.2, r * 0.22));
    K.hair(e.concat([e[0]]), clamp(r * 0.12, 0.1, 0.2), A.mix(K.INK, c, 0.35), { p: 0.55, tin: 0, tout: 0 });
  }
  // a soft shade on the stone under a thing that stands on it
  function shadowUnder(A, K, x, y, rx, ry, k) {
    K.wash(A.ellipse(x, y, rx, ry), '#3a2a1a', (xx, yy) => k * (1 - sstep(Math.hypot((xx - x) / rx, (yy - y) / ry))), 'mul');
  }
  // a dona: a cup of leaves pinned together, heaped with marigolds counted in rows
  function dona(A, K, x, y, w, rows) {
    const cup = A.spline([[x - w * 0.5, y - w * 0.18], [x - w * 0.36, y - w * 0.02], [x, y + w * 0.02], [x + w * 0.36, y - w * 0.02], [x + w * 0.5, y - w * 0.18], [x + w * 0.2, y - w * 0.12], [x - w * 0.2, y - w * 0.12]], true, 0.2);
    shadowUnder(A, K, x + w * 0.12, y + w * 0.02, w * 0.6, w * 0.08, 0.32);
    const r = w / (rows[0] * 2.05);
    let yy = y - w * 0.14;
    rows.forEach((n, ri) => {
      const rr = r * (1 - ri * 0.04);
      for (let i = 0; i < n; i++) marigold(A, K, x + (i - (n - 1) / 2) * rr * 1.85 + A.rr(-0.06, 0.06) * rr, yy - A.rr(0, 0.1) * rr, rr, (i + ri) % 3 === 1 ? C.haldi : C.saffron);
      yy -= rr * 1.25;
    });
    K.solid(cup, C.leaf, { w: Math.max(0.3, w * 0.06), passes: 2 });
    A.withMask(cup, () => A.fill(rect(x + w * 0.05, y - w * 0.3, x + w * 0.6, y + 1), 'shade', C.leafD, { w: 0.8, p: 0.5, passes: 1, ang: 1.4 }), 0);
    for (let k = -2; k <= 2; k++) K.hair([[x + k * w * 0.16, y - w * 0.13], [x + k * w * 0.12, y - w * 0.01]], 0.12, A.mix(C.leafL, '#ffffff', 0.2), { p: 0.7 });
    K.ink(cup, clamp(w * 0.04, 0.18, 0.32));
  }
  // a kalash in a niche: a round copper pot, a band of sindoor with white dots, mango leaves fanned at its mouth, a coconut
  function kalash(A, K, x, y, s) {
    const Q = (u, v) => [x + u * s, y - v * s];
    for (let k = 0; k < 5; k++) K.leaf(x + (k - 2) * 0.08 * s, y - 0.84 * s, -PI / 2 + (k - 2) * 0.48, 0.5 * s, 0.17 * s, k % 2 ? C.leafL : C.leaf, { bend: (k - 2) * 0.05 });
    const nut = A.ellipse(x, y - 1.0 * s, 0.19 * s, 0.24 * s);
    K.solid(nut, '#8a5a2a', { w: 0.3, passes: 2 });
    K.ink(nut, 0.16);
    const pot = A.spline([Q(-0.2, 0), Q(-0.44, 0.2), Q(-0.42, 0.52), Q(-0.2, 0.7), Q(-0.17, 0.78), Q(-0.26, 0.88), Q(0.26, 0.88), Q(0.17, 0.78), Q(0.2, 0.7), Q(0.42, 0.52), Q(0.44, 0.2), Q(0.2, 0)], true, 0.15);
    K.solid(pot, '#b8642e', { w: Math.max(0.3, s * 0.1), passes: 2 });
    A.withMask(pot, () => {
      A.fill(rect(x + 0.08 * s, y - s, x + s, y + 1), 'shade', C.clayDeep, { w: 0.6, p: 0.42, passes: 1, ang: 1.4 });
      A.stroke([Q(-0.5, 0.42), Q(0.5, 0.42)], 'chalk', C.sindoor, { w: 0.16 * s, p: 0.95, tin: 0, tout: 0 });
    }, 0);
    K.dots([Q(-0.36, 0.42), Q(0.36, 0.42)], 0.16 * s, C.limeLit, 0.24);
    K.lit([Q(-0.33, 0.24), Q(-0.34, 0.5)], 0.24, C.clayLit, { p: 0.8 });
    K.ink(pot, 0.22);
  }
  // a brass lota left on a step by the parapet: a round belly, a short neck, a flared lip, matte ochre lit on the left
  function lota(A, K, x, y, s) {
    const Q = (u, v) => [x + u * s, y - v * s];
    shadowUnder(A, K, x + 0.28 * s, y - 0.02 * s, 0.6 * s, 0.09 * s, 0.34);
    const body = A.spline([Q(-0.2, 0), Q(-0.42, 0.16), Q(-0.45, 0.4), Q(-0.32, 0.58), Q(-0.15, 0.66), Q(-0.15, 0.78), Q(-0.27, 0.92), Q(0.27, 0.92), Q(0.15, 0.78), Q(0.15, 0.66), Q(0.32, 0.58), Q(0.45, 0.4), Q(0.42, 0.16), Q(0.2, 0)], true, 0.12);
    K.solid(body, A.mix(C.ochre, C.haldi, 0.25), { w: Math.max(0.3, s * 0.1), passes: 3 });
    A.withMask(body, () => {
      A.fill(rect(x + 0.06 * s, y - s, x + s, y + 1), 'shade', C.ochreDeep, { w: 0.6, p: 0.45, passes: 1, ang: 1.45 });
      for (const v of [0.6, 0.66]) K.hair([Q(-0.4, v), Q(0.4, v)], 0.12, A.mix(C.ochreDeep, K.INK, 0.3), { p: 0.55 });
    }, 0);
    K.lit([Q(-0.3, 0.2), Q(-0.36, 0.38), Q(-0.27, 0.52)], 0.3, '#fff0c0', { p: 0.85 });
    const mouth = A.ellipse(x, y - 0.92 * s, 0.27 * s, 0.05 * s);
    A.fill(mouth, 'pastel', C.ochreDeep, { w: 0.2, p: 1, passes: 2, reach: 1.5 });
    K.ink(body, 0.26);
  }
  // a pair of jootis left by a threshold, side by side, one a little behind: a low red slipper, its pointed toe curled
  // up, a row of ochre stitches along the vamp, the heel open
  function jootis(A, K, x, y, s) {
    shadowUnder(A, K, x + 0.55 * s, y + 0.02 * s, 0.75 * s, 0.1 * s, 0.3);
    [[0.2 * s, -0.16 * s, 0.14], [0, 0, 0]].forEach(([dx, dy, dk]) => {
      const Q = (u, v) => [x + dx + u * s, y + dy - v * s];
      const shoe = A.spline([Q(0, 0), Q(0.5, -0.01), Q(0.86, 0.02), Q(1.0, 0.12), Q(1.05, 0.3), Q(0.98, 0.25), Q(0.88, 0.14), Q(0.6, 0.24), Q(0.36, 0.28), Q(0.28, 0.2), Q(0.02, 0.2)], true, 0.1);
      const c = A.mix(C.sindoor, '#5a1010', dk);
      K.solid(shoe, c, { w: Math.max(0.25, s * 0.06), passes: 2 });
      A.withMask(shoe, () => A.fill(rect(x + dx - 1, y + dy - 0.06 * s, x + dx + 1.2 * s, y + dy + 1), 'shade', C.lac, { w: 0.5, p: 0.5, passes: 1, ang: 0.02 }), 0);
      const throat = A.ellipse(x + dx + 0.17 * s, y + dy - 0.19 * s, 0.13 * s, 0.035 * s);
      A.fill(throat, 'pastel', '#3a0c0c', { w: 0.2, p: 1, passes: 2, reach: 1.5 });
      K.dots([Q(0.36, 0.22), Q(0.62, 0.18), Q(0.86, 0.1)], 0.13 * s, C.haldi, 0.2);
      K.hair([Q(0.02, 0.02), Q(0.9, 0.04)], 0.12, C.ochreDeep, { p: 0.6 });
      K.ink(shoe, 0.2);
    });
  }

  // the placed life on the landings and steps, a handful in the whole well, never on the walkers' way
  M.w8y.petals = Object.assign(function (A, L, H) {
    const K = kit(A), sc = L.h / 130, hw = H.stairHW, yf = L.foot, yl = L.land, mid = (yf + yl) / 2, LMP = { lamps: lampsOf() };
    const right = x => 960 + hw(mid) + 5 + x, left = x => 960 - hw(mid) - 5 - x;
    const pv = L.bays.find(b => b.kind === 'pavilion' && (b.x0 + b.x1) / 2 < 960);
    if (L.k === 1) {
      // by the rangoli before the gold room: a dona heaped with marigolds, four, three, two, one
      const pc = pv ? (pv.x0 + pv.x1) / 2 : 866.8;
      dona(A, K, pc + 19.5 * sc, yf + 14.8 * sc, 9.5 * sc, [4, 3, 2, 1]);
    } else if (L.k === 2) {
      // a pair of jootis left on the landing before the pavilion, by its threshold
      const px = pv ? pv.x0 + (pv.x1 - pv.x0) * 0.16 : 842;
      jootis(A, K, px, yf + 6.2, 6.8 * sc);
    } else if (L.k === 3) {
      // a brass lota left on one step, by the right parapet, out of the walkers' way
      const y0 = L.top - 4, n = Math.max(1, Math.round((yf - y0) / 5.6)), st = (yf - y0) / n, i = n - 7, yt = y0 + i * st + st * 0.46;
      lota(A, K, 960 + hw(yt) - 3.6, yt, 6 * sc);
    } else if (L.k === 4) {
      // five marigold heads and three loose petals, dropped on the landing by the foot of the right parapet
      const x0 = right(3.5), y0 = yf + 13;
      [[0, 0, 1.08, C.saffron], [2.3, 0.9, 1.0, C.haldi], [4.1, -0.5, 1.04, C.saffron], [6.6, 1.6, 0.96, C.saffron], [9.4, 0.7, 1.02, C.haldi]].forEach(([dx, dy, r, c]) => {
        shadowUnder(A, K, x0 + dx + 0.3, y0 + dy + r * 0.75, r * 1.1, r * 0.3, 0.28);
        marigold(A, K, x0 + dx, y0 + dy, r, c);
      });
      [[1.4, 2.6, 0.4], [5.2, 2.9, 2.2], [8.1, -1.2, 4.0]].forEach(([dx, dy, a]) => M.w8Petal(A, x0 + dx, y0 + dy, 0.62, 'mari', a));
    } else {
      // at the water: a dona and two lamps on the right of the last step, one lamp on the left
      dona(A, K, right(15), yl - 13, 9 * sc, [4, 3, 2, 1]);
      M.w8Lamp(A, right(27), yl - 12.5, 4.4 * sc, LMP, true);
      M.w8Lamp(A, right(34), yl - 11.5, 4 * sc, LMP, true);
      M.w8Lamp(A, left(12), yl - 12, 4.4 * sc, LMP, true);
    }
  }, { part: 'stair' });

  /* ================================================================ birds */
  const COATS = {
    grey: { body: '#8f98aa', breast: '#a3a6bc', wing: '#b4bbc9', bar: '#262934', tip: '#3c4150', neck: ['#3f9a6c', '#8a5a9e'], tail: '#585e70', ring: '#d8dae0' },
    blue: { body: '#7e889c', breast: '#9496b0', wing: '#a6aec0', bar: '#20222c', tip: '#343844', neck: ['#3a8e70', '#7e4e96'], tail: '#4c5264', ring: '#d0d4dc' },
    white: { body: '#f4f1eb', breast: '#efe6e4', wing: '#ebe7e1', bar: null, tip: '#c4c0cb', neck: ['#ecd4da', '#dcd4e4'], tail: '#d6d2dc', ring: '#f0c8c8' },
    fawn: { body: '#c69c82', breast: '#d9ad96', wing: '#dbb79e', bar: '#80412e', tip: '#6e5246', neck: ['#a8786a', '#9a6a7a'], tail: '#94705e', ring: '#ecd2c4' }
  };
  const coatOf = c => (c && typeof c === 'object' && c.body) ? c : COATS[c === 'brown' ? 'fawn' : c] || COATS.grey;

  // a rock dove sitting, the Mewar way: one clean contour, two black bars on the wing, the sheen of the neck, an eye.
  // (x, y) between its feet; s its size (beak to tail is about 1.25 s); o.turn raises (+) or lowers (-) the head
  function dove(A, K, x, y, s, o) {
    const f = o.flip ? -1 : 1, cz = coatOf(o.c), lw = clamp(s * 0.042, 0.2, 0.42), st = Math.max(0.12, s * 0.02);
    const P = (u, v) => [x + u * s * f, y + v * s];
    const tn = o.turn || 0, pvx = 0.22, pvy = -0.58, ct = Math.cos(tn), sn = Math.sin(tn);
    const Hd = (u, v) => { const du = u - pvx, dv = v - pvy; return P(pvx + du * ct + dv * sn, pvy - du * sn + dv * ct); };
    const pf = o.puff || 0;
    if (o.shadow !== false) K.wash(A.ellipse(x - 0.12 * s * f, y + 0.01 * s, 0.5 * s, 0.06 * s), '#3a2a1a', (xx, yy) => 0.3 * (1 - sstep(Math.hypot((xx - (x - 0.12 * s * f)) / (0.5 * s), (yy - y) / (0.06 * s)))), 'mul');
    if (o.half) {
      // the far wing half raised behind the back
      const wf = A.spline([P(0.12, -0.5), P(0.0, -0.78), P(-0.22, -0.98), P(-0.36, -0.92), P(-0.3, -0.7), P(-0.2, -0.5)], true, st);
      K.solid(wf, A.mix(cz.wing, cz.tip, 0.3), { w: s * 0.07 });
      A.withMask(wf, () => A.stroke([P(-0.12, -0.86), P(-0.34, -0.95)], 'chalk', cz.tip, { w: s * 0.1, p: 0.9 }), 0);
      K.ink(wf, lw * 0.7);
    }
    for (const [u, du, k] of [[0.075, 0.032, 1], [-0.05, 0.022, 0.85]]) {
      const pc = A.mix(C.pink, '#a04050', 1 - k);
      A.stroke([P(u, -0.1), P(u + du * 0.5, -0.04), P(u + du, 0)], 'chalk', pc, { w: Math.max(0.2, s * 0.034), p: 1 });
      A.stroke([P(u + du - 0.04, 0.004), P(u + du + 0.085, 0.006)], 'chalk', pc, { w: Math.max(0.18, s * 0.03), p: 1 });
    }
    const sil = A.spline([Hd(0.44, -0.66), Hd(0.405, -0.735), Hd(0.33, -0.772), Hd(0.25, -0.738), Hd(0.205, -0.64), P(0.11, -0.55 - pf * 0.02),
      P(-0.1, -0.505), P(-0.34, -0.42), P(-0.6, -0.34), P(-0.715, -0.3), P(-0.685, -0.232), P(-0.42, -0.19), P(-0.14, -0.088),
      P(0.1, -0.068), P(0.28 + pf * 0.03, -0.14), P(0.385 + pf * 0.05, -0.29), P(0.41 + pf * 0.03, -0.45), Hd(0.425, -0.58)], true, st);
    K.solid(sil, A.vary ? A.vary(cz.body, 0.02) : cz.body, { w: Math.max(0.3, s * 0.08), ang: f > 0 ? 0.35 : -0.35 });
    A.withMask(sil, () => {
      A.stroke([P(0.34 + pf * 0.04, -0.42), P(0.31 + pf * 0.03, -0.25), P(0.18, -0.13)], 'chalk', cz.breast, { w: s * 0.13, p: 0.6 });
      for (let i = 0; i < 4; i++) { const t = i / 3; A.stroke([Hd(lerp(0.36, 0.25, t), lerp(-0.62, -0.52, t)), P(lerp(0.38, 0.3, t), lerp(-0.47, -0.42, t))], 'chalk', i % 2 ? cz.neck[1] : cz.neck[0], { w: s * 0.045, p: 0.75 }); }
      A.stroke([P(-0.6, -0.36), P(-0.575, -0.225)], 'chalk', cz.tail, { w: s * 0.09, p: 0.95 });
      A.stroke([P(-0.08, -0.115), P(0.22, -0.15)], 'shade', A.mix(cz.body, '#3a3048', 0.5), { w: s * 0.12, p: 0.32 });
    }, 0);
    const wing = A.spline([P(0.2, -0.5), P(-0.02, -0.525), P(-0.3, -0.445), P(-0.565, -0.32), P(-0.5, -0.252), P(-0.2, -0.242), P(0.06, -0.29), P(0.2, -0.39)], true, st);
    K.solid(wing, cz.wing, { w: Math.max(0.3, s * 0.07), ang: f > 0 ? 0.25 : -0.25 });
    A.withMask(wing, () => {
      A.stroke([P(-0.36, -0.42), P(-0.53, -0.33), P(-0.49, -0.26)], 'chalk', cz.tip, { w: s * 0.12, p: 0.9 });
      if (cz.bar) for (const u of [-0.06, -0.19]) A.stroke([P(u + 0.03, -0.505), P(u - 0.005, -0.38), P(u - 0.03, -0.255)], 'chalk', cz.bar, { w: s * 0.042, p: 1 });
      if (s > 9) for (let i = 0; i < 2; i++) K.hair([P(-0.3 - i * 0.05, -0.42 + i * 0.05), P(-0.5 - i * 0.02, -0.33 + i * 0.03)], 0.12, null, { p: 0.4 });
    }, 0);
    K.ink(wing, lw * 0.72);
    K.ink(sil, lw);
    // the eye: a pale ring, an orange iris, the pupil, a catch of light (only a dark bead when the bird is small)
    const E = Hd(0.345, -0.668);
    if (s >= 7) {
      A.fill(A.ellipse(E[0], E[1], s * 0.06, s * 0.048), 'chalk', cz.ring, { w: s * 0.03, p: 1, passes: 2, reach: 1.5 });
      A.dot(E[0], E[1], 'chalk', '#e86c22', { w: s * 0.06, p: 1 });
      A.dot(E[0] + s * 0.004 * f, E[1], 'kajal', '#140e0a', { w: s * 0.032, p: 1 });
      A.dot(E[0] - s * 0.01 * f, E[1] - s * 0.012, 'chalk', '#ffffff', { w: s * 0.014, p: 0.9 });
    } else { A.dot(E[0], E[1], 'kajal', '#140e0a', { w: Math.max(0.3, s * 0.05), p: 1 }); A.dot(E[0] - 0.1 * f, E[1] - 0.1, 'chalk', '#ffffff', { w: 0.16, p: 0.8 }); }
    const beak = [Hd(0.43, -0.688), Hd(0.535, -0.65), Hd(0.432, -0.628)];
    A.fill(beak, 'pastel', '#4a4048', { w: Math.max(0.2, s * 0.035), p: 1, passes: 2, reach: 1.5 });
    const ce = Hd(0.447, -0.674); K.dot(ce[0], ce[1], C.limeLit, Math.max(0.18, s * 0.036));
  }

  // a pigeon in the air, seen from the side: o.phase 0 wings up over the back, 1 level and swept, 2 down under the body.
  // (x, y) the middle of the body; s beak to tail; o.tilt pitches it (negative: nose up)
  function flyer(A, K, x, y, s, o) {
    o = o || {};
    const f = o.flip ? -1 : 1, cz = coatOf(o.c), tilt = o.tilt || 0, ca = Math.cos(tilt), sa = Math.sin(tilt), ph = o.phase || 0;
    const P = (u, v) => { const uu = u * ca - v * sa, vv = u * sa + v * ca; return [x + uu * s * f, y + vv * s]; };
    const lw = clamp(s * 0.045, 0.18, 0.4), st = Math.max(0.1, s * 0.015);
    const TIP = [[-0.26, -0.92], [-0.42, -0.62], [-0.1, 0.7]][ph];
    // one wing: from the shoulder to the tip along a bowed leading edge, back along a trailing edge in feather ends
    const wingOf = (root, tip, back, col, sc) => {
      const lead = [], trail = [];
      const nx = -(tip[1] - root[1]), ny = tip[0] - root[0], nl = Math.hypot(nx, ny) || 1;
      const fwd = (nx * 1 + ny * 0) * (f > 0 ? 1 : 1) > 0 ? 1 : -1;
      for (let i = 0; i <= 8; i++) { const t = i / 8, b = Math.sin(t * PI) * 0.07 * fwd; lead.push([lerp(root[0], tip[0], t) + nx / nl * b, lerp(root[1], tip[1], t) + ny / nl * b]); }
      const bx = -(back[1] - tip[1]), by = back[0] - tip[0], bl = Math.hypot(bx, by) || 1;
      const side = (bx * (root[0] - tip[0]) + by * (root[1] - tip[1])) > 0 ? -1 : 1;
      for (let i = 1; i <= 24; i++) {
        const t = i / 24, n5 = t < 0.5 ? 5 : 3, tt = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5, sc2 = Math.abs(Math.sin(PI * n5 * tt)) * (t < 0.5 ? 0.035 : 0.03);
        const bow = Math.sin(t * PI) * 0.1 + sc2;
        trail.push([lerp(tip[0], back[0], t) + side * bx / bl * bow, lerp(tip[1], back[1], t) + side * by / bl * bow]);
      }
      const poly = A.spline(lead.concat(trail).map(q => P(q[0], q[1])), true, st);
      K.solid(poly, col, { w: Math.max(0.25, s * 0.05), ang: 1.2 });
      A.withMask(poly, () => {
        A.stroke([0.55, 0.78, 1.0].map(t => P(lerp(root[0], tip[0], t), lerp(root[1], tip[1], t))), 'chalk', A.mix(cz.tip, col, sc ? 0.2 : 0.45), { w: s * 0.2, p: 0.95, tin: 0.3 });
        if (cz.bar && sc) for (const t of [0.18, 0.32]) A.stroke([P(lerp(root[0], tip[0], t), lerp(root[1], tip[1], t)), P(lerp(root[0], tip[0], t) + side * bx / bl * 0.14 + (back[0] - tip[0]) * 0.1, lerp(root[1], tip[1], t) + side * by / bl * 0.14 + (back[1] - tip[1]) * 0.1)], 'chalk', cz.bar, { w: s * 0.035, p: 1 });
        if (sc) K.lit(lead.slice(1, 6).map(q => P(q[0], q[1])), Math.max(0.16, s * 0.025), A.mix(col, '#ffffff', 0.5), { p: 0.75 });
        if (s > 6) for (let k = 1; k <= 3; k++) { const t = 0.12 + k * 0.08, a = trail[Math.round(t * 23)]; K.hair([P(lerp(root[0], tip[0], 0.72 + k * 0.04), lerp(root[1], tip[1], 0.72 + k * 0.04)), P(a[0], a[1])], 0.1, null, { p: 0.35 }); }
      }, 0);
      K.ink(poly, lw * (sc ? 0.8 : 0.65));
    };
    // the far wing, darker, just behind
    const farTip = [TIP[0] + 0.1, TIP[1] * 0.86 + (ph === 2 ? 0.02 : -0.04)];
    if (ph !== 2) wingOf([0.12, -0.08], farTip, [-0.1, -0.06], A.mix(cz.wing, cz.tip, 0.32), false);
    // the tail, fanned a little, its dark end band
    const tail = A.spline([P(-0.26, -0.04), P(-0.5, -0.09), P(-0.58, -0.05), P(-0.6, 0.02), P(-0.55, 0.08), P(-0.26, 0.05)], true, st);
    K.solid(tail, A.mix(cz.tail, cz.wing, 0.3), { w: Math.max(0.25, s * 0.05) });
    A.withMask(tail, () => A.stroke([P(-0.5, -0.1), P(-0.52, 0.09)], 'chalk', cz.bar || cz.tip, { w: s * 0.05, p: 1 }), 0);
    K.ink(tail, lw * 0.75);
    if (o.feet) for (const u of [0.04, -0.04]) A.stroke([P(u, 0.07), P(u + 0.03, 0.17), P(u + 0.08, 0.2)], 'chalk', C.pink, { w: Math.max(0.18, s * 0.03), p: 1 });
    // the body
    const body = A.spline([P(0.47, -0.04), P(0.45, -0.12), P(0.38, -0.16), P(0.3, -0.135), P(0.22, -0.12), P(0.04, -0.125), P(-0.14, -0.085), P(-0.3, -0.04),
      P(-0.3, 0.045), P(-0.12, 0.1), P(0.08, 0.12), P(0.24, 0.09), P(0.37, 0.035)], true, st);
    K.solid(body, cz.body, { w: Math.max(0.25, s * 0.06), ang: 0.2 });
    A.withMask(body, () => {
      A.stroke([P(0.33, 0.0), P(0.12, 0.06)], 'chalk', cz.breast, { w: s * 0.08, p: 0.6 });
      A.stroke([P(0.31, -0.09), P(0.28, 0.0)], 'chalk', cz.neck[0], { w: s * 0.045, p: 0.75 });
      A.stroke([P(0.26, -0.08), P(0.24, 0.02)], 'chalk', cz.neck[1], { w: s * 0.04, p: 0.7 });
      A.stroke([P(0.1, 0.06), P(-0.2, 0.05)], 'shade', A.mix(cz.body, '#3a3048', 0.5), { w: s * 0.06, p: 0.3 });
    }, 0);
    K.ink(body, lw);
    const beak = [P(0.46, -0.07), P(0.545, -0.045), P(0.46, -0.025)];
    A.fill(beak, 'pastel', '#4a4048', { w: Math.max(0.16, s * 0.03), p: 1, passes: 2, reach: 1.5 });
    const E = P(0.395, -0.085);
    A.dot(E[0], E[1], 'kajal', '#140e0a', { w: Math.max(0.26, s * 0.05), p: 1 });
    if (s > 5) A.dot(E[0] - 0.08 * f, E[1] - 0.08, 'chalk', '#ffffff', { w: Math.max(0.12, s * 0.015), p: 0.8 });
    // the near wing
    wingOf([0.1, -0.07], TIP, [-0.15, -0.03], cz.wing, true);
  }

  M.w8Pigeon = function (A, x, y, s, pose, o) {
    o = o || {}; pose = pose || 'sit';
    const K = kit(A);
    if (pose === 'fly' || pose === 'land') {
      const land = pose === 'land', L = s * 1.4, ph = land ? 0 : Math.floor(hash(x, y) * 3);
      return flyer(A, K, x - 0.2 * s * (o.flip ? -1 : 1), y - (land ? 0.55 : 0.45) * s, L, { flip: o.flip, c: o.c, phase: ph, tilt: land ? -0.42 : -0.06, feet: land });
    }
    const q = { flip: o.flip, c: o.c, shadow: o.shadow };
    if (pose === 'preen') Object.assign(q, { turn: -0.75, puff: 0.6 });
    else if (pose === 'tuck') Object.assign(q, { turn: -0.25, puff: 1 });
    else if (pose === 'half') Object.assign(q, { half: true, turn: 0.15 });
    dove(A, K, x, y, s * 1.12, q);
  };

  // the ledge pigeons: a pair facing each other over one pillar, a single over another, never on the stair or the objects
  M.w8y.pigeons = Object.assign(function (A, L, n, seed, avoid, H) {
    const K = kit(A), R = rng(seed * 131 + 7), s = 7.4 * L.h / 130, y = L.top - 1;
    const free = x => x > L.a + 16 && x < L.b - 16 && Math.abs(x - 960) > 66 && !(avoid && (avoid(x) || avoid(x - 9) || avoid(x + 9)));
    const xs = [...new Set(L.bays.flatMap(b => [Math.round(b.x0 * 10) / 10, Math.round(b.x1 * 10) / 10]))].filter(free);
    for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(R.rnd() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; }
    const want = n >= 20 ? 3 : 2, at = [];
    for (const x of xs) { if (at.length >= want) break; if (at.every(a => Math.abs(a - x) > 150)) at.push(x); }
    at.forEach((x, i) => {
      const toStair = x < 960;
      if (moodOf() === 'night') { dove(A, K, x + (i === 0 ? -3 : 0), y, s * 1.1, { flip: !toStair, c: R.pick(['grey', 'blue']), turn: -0.3, puff: 1 }); if (i === 0) dove(A, K, x + 3.6, y, s * 1.05, { flip: true, c: 'white', turn: -0.35, puff: 1 }); return; }
      if (i === 0) {
        dove(A, K, x - 4.2, y, s * 1.12, { flip: false, c: R.pick(['grey', 'grey', 'blue']), turn: 0.05 });
        dove(A, K, x + 4.2, y, s * 1.08, { flip: true, c: R.pick(['white', 'grey', 'fawn']), turn: -0.7, puff: 0.6 });
      } else dove(A, K, x, y, s * 1.1, { flip: !toStair, c: R.pick(['grey', 'blue', 'white']), turn: i === 2 ? -0.25 : 0.1, puff: i === 2 ? 1 : 0 });
    });
  }, { part: 'stair' });

  // what is in the air, by the hour, counted, never random: by day one line of seven pigeons going up out of the well
  // to the sun, smaller as they go; at dusk five coming home, gliding down toward the eaves; at night nothing
  M.w8y.air = Object.assign(function (A, G, H) {
    if (G) CUR.G = G;
    const mood = (G && G.mood) || 'day';
    if (mood === 'night') return;
    const K = kit(A), hot = Object.values((G && G.hot) || {});
    const inHot = (x, y) => hot.some(b => x > b[0] - 8 && x < b[0] + b[2] + 8 && y > b[1] - 8 && y < b[1] + b[3] + 8);
    if (mood === 'dusk') {
      const PH = [1, 1, 0, 1, 1], COAT = ['grey', 'white', 'grey', 'blue', 'grey'];
      for (let i = 0; i < 5; i++) {
        const t = i / 4, x = lerp(760, 880, t) + Math.sin(t * 4.2) * 5, y = lerp(70, 128, t) + Math.cos(t * 3.6) * 3;
        if (inHot(x, y)) continue;
        flyer(A, K, x, y, lerp(8, 10.5, t), { flip: false, c: COAT[i], phase: PH[i], tilt: 0.16 + Math.sin(i * 1.9) * 0.05 });
      }
      return;
    }
    const PH = [1, 0, 2, 1, 0, 2, 1], COAT = ['grey', 'grey', 'white', 'blue', 'grey', 'white', 'grey'];
    for (let i = 0; i < 7; i++) {
      const t = i / 6, x = lerp(1214, 1014, t) + Math.sin(t * 5.4) * 7, y = lerp(132, 58, t) + Math.cos(t * 4.4) * 4;
      if (inHot(x, y)) continue;
      flyer(A, K, x, y, lerp(12, 7, t), { flip: true, c: COAT[i], phase: PH[i], tilt: -0.3 + Math.sin(i * 1.7) * 0.06 });
    }
  }, { part: 'stair' });

  /* ================================================================ the cloth hung over the eave */
  // a woven cloth put out over the edge of the eave: folded over the edge at the top, hanging in soft folds, its field
  // set with rows of small flowers between bordered bands, a fringe of counted tassels along the hem
  M.w8Cloth = function (A, x0, x1, y, drop, P, o) {
    o = o || {};
    const K = kit(A), w = x1 - x0, red = o.c || C.madder, nf = 4;
    const fold = x => Math.sin((x - x0) / w * PI * nf * 2 + 0.7);
    const hem = []; for (let i = 0; i <= 40; i++) { const t = i / 40, x = lerp(x0 - w * 0.02, x1 + w * 0.02, t); hem.push([x, y + drop + fold(x) * drop * 0.025 + Math.sin(t * PI) * drop * 0.03]); }
    const poly = [[x0 - w * 0.01, y + drop * 0.1], [x1 + w * 0.01, y + drop * 0.1]].concat(hem.slice().reverse());
    // its shade on the wall
    K.wash(poly.map(p => [p[0] + 1.8, p[1] + 2.2]), P.stoneDeep || '#5a3a2a', () => 0.3, 'mul');
    K.burnish(poly);
    K.solid(poly, red, { w: 1.6, ang: 1.5 });
    const yd = t => y + drop * t;
    A.withMask(poly, () => {
      const band = (t0, t1, c) => K.solid(rect(x0 - 2, yd(t0), x1 + 2, yd(t1)), c, { w: 0.8, ang: 0.02, passes: 2 });
      // the border at the foot: a yellow band of lozenges, a thin blue band of dots
      band(0.68, 0.82, C.peori);
      const lz = drop * 0.05;
      for (let x = x0 + lz * 1.2, k = 0; x < x1 - lz * 0.6; x += lz * 2.3, k++) {
        const ly = yd(0.75), d = [[x, ly - lz], [x + lz * 0.75, ly], [x, ly + lz], [x - lz * 0.75, ly]];
        A.fill(d, 'pastel', k % 2 ? red : C.leaf, { w: 0.35, p: 1, passes: 2, reach: 1.5 });
        K.dot(x, ly, C.jasmine, 0.36);
      }
      band(0.84, 0.88, C.neel);
      K.dots([[x0, yd(0.86)], [x1, yd(0.86)]], 1.3, C.jasmine, 0.34);
      band(0.18, 0.23, C.peori);
      K.dots([[x0, yd(0.205)], [x1, yd(0.205)]], 1.6, red, 0.38);
      // the field: rows of four-petalled flowers, each row moved half a step
      for (let r = 0; r < 4; r++) {
        const fy = yd(0.3 + r * 0.1);
        for (let x = x0 + 4 + (r % 2) * 4.4, k = 0; x < x1 - 2; x += 8.8, k++) {
          const xf = x + fold(x) * 0.4;
          for (let j = 0; j < 4; j++) { const a = PI / 4 + j * PI / 2; A.dot(xf + Math.cos(a) * 0.75, fy + Math.sin(a) * 0.75, 'chalk', C.haldi, { w: 0.9, len: 0.2, ang: a, p: 0.97 }); }
          K.dot(xf, fy, C.jasmine, 0.42);
        }
      }
      // the folds: the troughs in a deeper red, laid in long strokes down the cloth, the crests lit
      for (let k = 0; k < nf * 2; k++) {
        const xt = x0 + ((k + 0.5) / (nf * 2) - 0.7 / (PI * nf * 2)) * w + w / (nf * 4);
        A.stroke([[xt, yd(0.06)], [xt + 0.3, yd(0.5)], [xt - 0.2, yd(1.04)]], 'shade', A.mix(red, '#2a0606', 0.55), { w: w / (nf * 2) * 0.55, p: 0.42, tin: 0.2, tout: 0.05 });
      }
      for (let k = 0; k < nf * 2; k++) {
        const xt = x0 + (k / (nf * 2) - 0.7 / (PI * nf * 2)) * w + w / (nf * 4) - w / (nf * 4);
        if (xt < x0 + 2 || xt > x1 - 2) continue;
        A.stroke([[xt, yd(0.14)], [xt + 0.2, yd(0.55)], [xt - 0.1, yd(0.98)]], 'chalk', A.mix(red, '#f6c0a0', 0.3), { w: 0.5, p: 0.35, tin: 0.3, tout: 0.2 });
      }
    }, 0);
    // the top, folded over the edge of the eave
    const top = [[x0 - w * 0.025, y], [x1 + w * 0.025, y], [x1 + w * 0.015, y + drop * 0.12], [x0 - w * 0.015, y + drop * 0.12]];
    K.solid(top, A.mix(red, '#1a0404', 0.25), { w: 0.8, ang: 0.02 });
    A.withMask(top, () => { K.dots([[x0, y + drop * 0.06], [x1, y + drop * 0.06]], 1.9, C.peori, 0.5); }, 0);
    K.ink(top, 0.42);
    K.ink(poly, 0.5);
    // the fringe: a tassel every 2.4, white and haldi turn about
    const fr = A.along(hem, 2.4, 0);
    fr.forEach((q, i) => {
      if (q.x < x0 - w * 0.015 || q.x > x1 + w * 0.015) return;
      const c = i % 2 ? C.peori : C.jasmine, len = drop * 0.07;
      A.stroke([[q.x, q.y], [q.x + 0.15, q.y + len * 0.55], [q.x - 0.1, q.y + len]], 'chalk', c, { w: 0.42, p: 0.95, tout: 0.4 });
      K.dot(q.x, q.y + 0.35, c, 0.55);
    });
  };
})();
