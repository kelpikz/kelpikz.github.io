(function () {
  'use strict';
  /* ==========================================================================
     THE GOLD WELL (well8k): THE PEOPLE ON THE STEPS (a pilot)
     Two water carriers in Rajasthani dress, painted the folio way in the Mewar manner: each part laid in one
     flat colour, one kajal contour in two passes, the ornament counted bead by bead, ochre for the gold.
       woman  a full gathered ghagra (printed field, a lapis border band, gota edge), a choli, an odhni over her
              head with a gota edge, ivory chooda up the arm, a nath, anklets, bare feet with alta; a clay matka
              and a brass lota stacked on her head on an inderi, the far hand up to steady them.
       man    an angarkha tied at the side, a patka, a dhoti, a leheriya safa with its tail, red mojari; two clay
              pots in rope slings on a bamboo yoke over the far shoulder, the far hand on the yoke.
     M.w8Person(Z, kind, phase, o) draws one figure at walk phase 0..1 in its own frame: the ground under the body
     is the origin, y up is negative, the figure faces right (the page flips the cel for a walk to the left).
     100 units is a man's height (about 45 sheet units on the top landing, k = 0.45).  Light from the upper left.
       o.stair  { rise, run }  a stair cycle: each step goes down `rise` and on `run` (frame units), so one cycle
                (two steps) carries the body 2 run along and 2 rise down; without it, a walk on the level.
       o.seed   the drawing's own seed (the same for every frame of one walker, so the print does not crawl).
       o.ramp   { slope, stride }  a walk on a floor tilted up the picture: each cycle goes on `stride` and down
                `stride * slope` (slope < 0 climbs).
       o.stand  standing still, the weight on both feet, the cloth at rest.
       o.mirror the caller mirrors the drawing (a figure facing left): the light then falls on its other side.
     M.w8PersonGait(kind, o) gives { dx, dy } a cycle moves the body, and the frame box, for the page.
     ======================================================================== */
  const PI = Math.PI, TAU = 2 * PI;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const fr = v => v - Math.floor(v);
  const KW = 1.7, INKW = 1.3;

  const C = {
    lime: '#f4ecdc', limeLit: '#fffaf0', hingul: '#c8382a', hingulDeep: '#9c2a22', lapis: '#2a4b96', neel: '#1d2850',
    mal: '#3b7f52', malLit: '#5c9a6a', haldi: '#edc94b', saffron: '#e58a32', pink: '#e2808c',
    ochre: '#c8962e', ochreLit: '#e6bf62', ochreDeep: '#8e6420',
    clay: '#b4573a', clayLit: '#cf7a55', clayDeep: '#7e3524',
    hair: '#1c1418', bamboo: '#c4a457', rope: '#9a7444', alta: '#b8242a'
  };
  const SKIN = {
    woman: { s: '#c98c5e', far: '#a96f48', sh: '#9c6040', lip: '#a8463c' },
    man: { s: '#b97a4c', far: '#9a613c', sh: '#8a5232', lip: '#94443a' }
  };

  // ---------------------------------------------------------------- geometry
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mulv = (a, k) => [a[0] * k, a[1] * k];
  const lerpv = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const rot = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
  const dir = a => [Math.sin(a), Math.cos(a)];          // a limb hanging at angle a from straight down, + is forward
  const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  function cub(p0, c1, c2, p3, n) {
    const out = [];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1]]); }
    return out;
  }
  // a smooth curve through the points (Catmull-Rom, sampled finely: the engine's own arcs are too coarse here)
  function sp(Z, cp, closed, step) { return Z.spline(cp, !!closed, step || 0.22); }
  // points of a polyline by arc length, n + 1 of them
  function resample(pts, n) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + len(pts[i - 1], pts[i]));
    const L = d[d.length - 1], out = []; let j = 1;
    for (let k = 0; k <= n; k++) {
      const s = L * k / n; while (j < d.length - 1 && d[j] < s) j++;
      const t = d[j] > d[j - 1] ? (s - d[j - 1]) / (d[j] - d[j - 1]) : 0;
      out.push(lerpv(pts[j - 1], pts[j], clamp(t, 0, 1)));
    }
    return out;
  }
  // a ribbon round a centreline, half width wf(t) at t along it; .L and .R are its two edges
  function ribbon(cl, wf) {
    const n = cl.length, L = [], Rr = [];
    for (let i = 0; i < n; i++) {
      const a = cl[Math.max(0, i - 1)], b = cl[Math.min(n - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const w = wf(i / (n - 1));
      L.push([cl[i][0] + nx * w, cl[i][1] + ny * w]); Rr.push([cl[i][0] - nx * w, cl[i][1] - ny * w]);
    }
    const p = L.concat(Rr.slice().reverse()); p.L = L; p.R = Rr; return p;
  }
  // a path pushed in (d > 0) or out from a closed polygon, by its centroid
  function inset(poly, d) {
    let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; } cx /= poly.length; cy /= poly.length;
    const n = poly.length;
    return poly.map((p, i) => {
      const a = poly[(i - 1 + n) % n], b = poly[(i + 1) % n];
      let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
      return [p[0] - nx * d, p[1] - ny * d];
    });
  }
  // an open path pushed sideways by d (left of its direction is +)
  function offset(pts, d) {
    const n = pts.length;
    return pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1;
      return [p[0] + nx / l * d, p[1] + ny / l * d];
    });
  }
  // two-bone reach: the middle joint, on the side the score likes best
  function ik(a, b, l1, l2, score) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.min(Math.hypot(dx, dy), (l1 + l2) * 0.9995), an = Math.atan2(dy, dx);
    const k = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * Math.max(d, 1e-6)), -1, 1));
    const p1 = [a[0] + Math.cos(an - k) * l1, a[1] + Math.sin(an - k) * l1], p2 = [a[0] + Math.cos(an + k) * l1, a[1] + Math.sin(an + k) * l1];
    return score(p1) >= score(p2) ? p1 : p2;
  }

  // ---------------------------------------------------------------- the house kit (as src/m-w8x-sidekick.js has it)
  function kit(Z, LS) {
    LS = LS || 1;   // 1: the light from the upper left of the figure; -1: the figure is drawn mirrored, so its light comes from its upper right
    const INK = Z.mix('kajal', 'neel', 0.12), KJ = Z.tool('kajal', { wmin: 0.3 });
    const K = { INK, LS };
    K.solid = (p, c, o) => Z.fill(p, 'pastel', c, Object.assign({ w: 2.2, p: 1, reach: 1.5, passes: 3, ang: 1.5, streak: 0.2 }, o));
    K.fine = (p, c, o) => Z.fill(p, 'chalk', c, Object.assign({ w: 0.9, p: 1, reach: 1.5, passes: 3, ang: 1.2, streak: 0.15 }, o));
    // the contour in two goes: one even unbroken line, then a pass that swells where the form turns from the light
    K.ink = (poly, w, o) => {
      o = o || {};
      w = (w || 0.65) * KW * INKW;
      let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; } cx /= poly.length; cy /= poly.length;
      const n = poly.length, sw = poly.map((p, i) => {
        const a = poly[(i - 1 + n) % n], b = poly[(i + 1) % n];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
        return clamp((nx * 0.78 * LS + ny * 0.62 + 0.15) / 0.95, 0, 1);
      });
      const closed = o.open ? poly : poly.concat(poly.slice(0, 3)), swr = o.open ? sw : sw.concat(sw.slice(0, 3));
      const c = o.c || INK;
      Z.stroke(closed.map(p => [p[0], p[1]]), KJ, c, { w: w * 0.6, p: o.p || 1, tin: o.open ? 0.08 : 0, tout: o.open ? 0.1 : 0, wob: 0.2 });
      Z.stroke(closed.map((p, i) => [p[0], p[1], 0.42 + 0.58 * swr[i]]), KJ, c, { w, p: o.p || 1, tin: o.open ? 0.1 : 0, tout: o.open ? 0.14 : 0, wob: 0.2 });
    };
    // an open contour with the same two passes; sh(t) 0..1 is how much of the swell it carries along its length
    K.edge = (pts, w, sh, o) => {
      o = o || {};
      w = (w || 0.5) * KW * INKW;
      const c = o.c || INK;
      Z.stroke(pts, KJ, c, { w: w * 0.6, p: o.p || 1, tin: 0.06, tout: 0.1, wob: 0.2 });
      Z.stroke(pts.map((p, i) => [p[0], p[1], 0.42 + 0.58 * (sh ? sh(i / (pts.length - 1)) : 1)]), KJ, c, { w, p: o.p || 1, tin: 0.08, tout: 0.12, wob: 0.2 });
    };
    K.line = (p, w, o) => Z.stroke(p, KJ, (o && o.c) || INK, Object.assign({ p: 0.9, wob: 0.3 }, o, { w: (w || 0.5) * KW * 1.15 }));
    K.hair = (p, w, o) => Z.stroke(p, KJ, (o && o.c) || Z.mix(INK, C.lime, 0.18), Object.assign({ p: 0.7, tin: 0.06, tout: 0.08, wob: 0.3 }, o, { w: (w || 0.26) * KW }));
    K.burnish = polys => {
      const HM = Z.HM, W = Z.W, H = Z.H; if (!HM) return;
      const r = Math.max(2, Math.round(2 * Z.S));
      for (const poly of (Array.isArray(polys[0][0]) ? polys : [polys])) {
        const m = Z.pushMask(poly, 0); Z.popMask();
        if (!m || !m.w || !m.h) continue;
        const x0 = Math.max(0, m.x0 - r), y0 = Math.max(0, m.y0 - r), x1 = Math.min(W, m.x0 + m.w + r), y1 = Math.min(H, m.y0 + m.h + r);
        const bw = x1 - x0, bh = y1 - y0; if (bw <= 0 || bh <= 0) continue;
        const I = new Float64Array((bw + 1) * (bh + 1));
        for (let y = 0; y < bh; y++) { let row = 0; const src = (y0 + y) * W + x0, o1 = (y + 1) * (bw + 1), o0 = y * (bw + 1); for (let x = 0; x < bw; x++) { row += HM[src + x]; I[o1 + x + 1] = I[o0 + x + 1] + row; } }
        for (let y = 0; y < m.h; y++) {
          const Y = m.y0 + y; if (Y < y0 || Y >= y1) continue;
          for (let x = 0; x < m.w; x++) {
            const d = m.d[y * m.w + x]; if (!d) continue;
            const X = m.x0 + x; if (X < x0 || X >= x1) continue;
            const ax = Math.max(0, X - r - x0), ay = Math.max(0, Y - r - y0), bx = Math.min(bw, X + r + 1 - x0), by = Math.min(bh, Y + r + 1 - y0);
            const mean = (I[by * (bw + 1) + bx] - I[ay * (bw + 1) + bx] - I[by * (bw + 1) + ax] + I[ay * (bw + 1) + ax]) / ((bx - ax) * (by - ay));
            const i = Y * W + X, v = 0.5 + clamp((HM[i] - mean) * 0.8, -0.24, 0.24);
            HM[i] += (v - HM[i]) * d / 255;
          }
        }
      }
    };
    K.dot = (x, y, c, w, o) => Z.dot(x, y, 'chalk', c, Object.assign({ w: w || 1.0, p: 0.97 }, o));
    // a ruled row of dots along a path, laid one by one: each a hair off in place and size, never a stamp
    K.dots = (path, step, c, w, o) => {
      o = o || {};
      for (const q of Z.along(path, step, 0)) {
        if (o.skip && o.skip(q)) continue;
        K.dot(q.x + Z.rr(-0.06, 0.06) * step, q.y + Z.rr(-0.05, 0.05) * step, c, w * Z.rr(0.9, 1.08), { p: Z.rr(0.88, 1) });
      }
    };
    K.floret = (x, y, r, petal, heart, a0) => {
      a0 = a0 != null ? a0 : Z.rr(0, 1.25);
      for (let i = 0; i < 5; i++) {
        const a = a0 + i * 2 * PI / 5 + Z.rr(-0.06, 0.06);
        Z.dot(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, 'chalk', petal || C.limeLit, { w: r * 0.6 * Z.rr(0.94, 1.05), len: r * 0.12, ang: a, p: 0.97 });
      }
      K.dot(x, y, heart || C.haldi, r * 0.42);
    };
    // a soft shade down the side away from the light, inside the shape
    K.shade = (poly, c, k, w) => {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of poly) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
      const ww = x1 - x0, f = w || 0.32;
      const band = q => LS > 0 ? [[x1 - ww * f * q, y0 - 1], [x1 + 1, y0 - 1], [x1 + 1, y1 + 1], [x1 - ww * f * q, y1 + 1]] : [[x0 - 1, y0 - 1], [x0 + ww * f * q, y0 - 1], [x0 + ww * f * q, y1 + 1], [x0 - 1, y1 + 1]];
      Z.withMask(poly, () => {
        Z.fill(band(1), 'shade', c, { w: Math.max(0.8, ww * 0.12), p: 0.42 * (k || 1), passes: 1, ang: 1.5 });
        Z.fill(band(0.45), 'shade', c, { w: Math.max(0.7, ww * 0.08), p: 0.36 * (k || 1), passes: 1, ang: 1.5 });
      });
    };
    return K;
  }

  // ---------------------------------------------------------------- the walk
  // legs: thigh L1, shin L2; the foot frame has its origin on the ground under the ankle, the ankle 3 up,
  // the heel at -2.3 and the ball at +5, the toe at +7.2.  sg: the share of a cycle a foot is on the ground.
  const GAIT = {
    woman: { L1: 23.3, L2: 22.85, ank: 3.0, stride: 50, lift: 3.4, sg: 0.6, reach: 0.975, hb: -2.1, bp: 4.6, toe: 6.8 },
    man: { L1: 24.4, L2: 23.8, ank: 3.0, stride: 56, lift: 4.6, sg: 0.6, reach: 0.975, hb: -2.3, bp: 5.0, toe: 7.4 }
  };
  const footPose = (O, th, ank) => ({ O, th, ank: add(O, rot([0, -ank], th)) });
  function stanceAt(t, g, P, stair) {
    const F = [lerp(P[0], -P[0], t) * g.sg / 2, lerp(P[1], -P[1], t) * g.sg / 2];
    if (stair && P[1] > 0 && t < 0.16) { const th = 0.3 * Math.pow(1 - t / 0.16, 2), bp = [g.bp, 0]; return footPose(sub(add(F, bp), rot(bp, th)), th, g.ank); }
    if (t < 0.14) { const th = -0.2 * Math.pow(1 - t / 0.14, 2), hb = [g.hb, 0]; return footPose(sub(add(F, hb), rot(hb, th)), th, g.ank); }
    if (t > 0.6) { const th = 0.55 * Math.pow((t - 0.6) / 0.4, 1.4), bp = [g.bp, 0]; return footPose(sub(add(F, bp), rot(bp, th)), th, g.ank); }
    return footPose(F, 0, g.ank);
  }
  function footAt(u, g, P, stair) {
    u = fr(u);
    if (u < g.sg) return Object.assign(stanceAt(u / g.sg, g, P, stair), { stance: true });
    const s = (u - g.sg) / (1 - g.sg), a = stanceAt(1, g, P, stair), b = stanceAt(0, g, P, stair);
    const ex = sstep(Math.pow(s, 0.85)), ey = stair ? lerp(s, sstep(s), 0.5) : ex;
    const lift = (stair ? g.lift * 0.55 : g.lift) * Math.pow(Math.sin(PI * Math.pow(s, 0.8)), 1.1);
    const O = [lerp(a.O[0], b.O[0], ex), lerp(a.O[1], b.O[1], ey) - lift];
    const th = lerp(0.55, stair ? 0.3 : -0.2, sstep(s)) + 0.12 * Math.sin(PI * s);
    return Object.assign(footPose(O, th, g.ank), { stance: false });
  }
  const tables = {};
  function gaitOf(kind, o) {
    const g = GAIT[kind], st = o && o.stair, rp = !st && o && o.ramp;
    // a ramp: the floor of a landing seen tilted up the picture, the way the painters lay a floor: level steps that climb
    const P = st ? [2 * st.run, 2 * st.rise] : rp ? [rp.stride, rp.stride * rp.slope] : [g.stride, 0];
    const key = kind + ':' + P.join(',');
    if (tables[key]) return tables[key];
    const L = g.L1 + g.L2, N = 240, H0 = -(g.ank + g.reach * L), raw = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const ph = i / N; let h = -1e9;
      for (const u of [ph, ph + 0.5]) { const f = footAt(u, g, P, !!st), dx = f.ank[0]; h = Math.max(h, f.ank[1] - Math.sqrt(Math.max(1, (g.reach * L) ** 2 - dx * dx))); }
      raw[i] = h;
    }
    const sm = new Float64Array(N); let mean = 0;
    for (let i = 0; i < N; i++) { let s = 0; for (let k = -10; k <= 10; k++) s += raw[(i + k + N) % N]; sm[i] = s / 21; mean += sm[i] / N; }
    const hip = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const ph = i / N; let h = mean + (sm[i] - mean) * (st ? 0.5 : 0.62);
      for (const u of [ph, ph + 0.5]) { const f = footAt(u, g, P, !!st), dx = f.ank[0]; h = Math.max(h, f.ank[1] - Math.sqrt(Math.max(1, (0.998 * L) ** 2 - dx * dx))); }
      hip[i] = h;
    }
    return (tables[key] = { g, P, H0, hip, N, stair: !!st, ramp: !!rp });
  }
  function pose(kind, phase, o) {
    const T = gaitOf(kind, o), g = T.g, ph = fr(phase);
    if (o && o.stand) {
      // standing: the weight on both feet, the near one a little ahead, the legs all but straight
      const L = g.L1 + g.L2, fN = footPose([3.4, 0], 0, g.ank), fF = footPose([-2.8, 0], 0, g.ank);
      let hy = -1e9; for (const f of [fN, fF]) hy = Math.max(hy, f.ank[1] - Math.sqrt((0.988 * L) ** 2 - f.ank[0] ** 2));
      const hip = [0, hy], leg = f => Object.assign(f, { hip, knee: ik(hip, f.ank, g.L1, g.L2, p => p[0]), stance: true });
      const near = leg(fN), far = leg(fF);
      return { ph, hip, b: hy - T.H0, near, far, lagKnee: () => Math.max(near.knee[0], far.knee[0]), T, stand: true };
    }
    const hipAt = p => { const x = fr(p) * T.N, i = Math.floor(x), f = x - i; return lerp(T.hip[i % T.N], T.hip[(i + 1) % T.N], f); };
    const hy = hipAt(ph), hip = [0, hy];
    const leg = u => { const f = footAt(u, g, T.P, T.stair), knee = ik(hip, f.ank, g.L1, g.L2, p => p[0]); return Object.assign(f, { hip, knee }); };
    const near = leg(ph), far = leg(ph + 0.5);
    // the same legs a little earlier, for the cloth that follows them
    const lagKnee = lg => { const p = fr(ph - lg), h2 = [0, hipAt(p)]; return Math.max(ik(h2, footAt(p, g, T.P, T.stair).ank, g.L1, g.L2, q => q[0])[0], ik(h2, footAt(p + 0.5, g, T.P, T.stair).ank, g.L1, g.L2, q => q[0])[0]); };
    return { ph, hip, b: hy - T.H0, near, far, lagKnee, T };
  }

  // ---------------------------------------------------------------- shared parts
  // a bare foot (or the foot inside a mojari) in its pose; the far one is darker
  function footPoly(Z, g, f, shoe) {
    const s = shoe ? 1.08 : 1, t = g.toe * s;
    const q = shoe
      ? [[-1.0, -3.3], [1.2, -3.1], [3.4, -1.9], [t - 0.8, -1.05], [t + 0.5, -1.5], [t + 1.0, -2.25], [t + 0.35, -0.5], [t - 1.0, 0.1], [2, 0.18], [g.hb - 0.1, 0.12], [g.hb - 0.65, -0.9], [g.hb + 0.1, -2.4]]
      : [[-0.9, -3.4], [1.0, -3.2], [3.2, -2.0], [t - 1.4, -1.1], [t - 0.15, -0.7], [t + 0.15, -0.2], [t - 0.6, 0.12], [2, 0.12], [g.hb, 0.1], [g.hb - 0.5, -0.8], [g.hb + 0.2, -2.6]];
    return sp(Z, q.map(p => add(f.O, rot(p, f.th))), true, 0.18);
  }

  // the head in profile.  E is the eye, h the head's length; U(u, v) puts head units on the frame
  function headGeom(E, h, neckF, neckB) {
    const U = (u, v) => [E[0] + u * h, E[1] + v * h];
    const profile = [U(0.2, -0.34), U(0.255, -0.2), U(0.27, -0.07), U(0.262, -0.015), U(0.3, 0.06), U(0.36, 0.13), U(0.385, 0.162), U(0.37, 0.185), U(0.315, 0.198),
      U(0.31, 0.226), U(0.33, 0.256), U(0.292, 0.284), U(0.316, 0.312), U(0.272, 0.352), U(0.292, 0.41), U(0.25, 0.462), U(0.14, 0.478), U(0.1, 0.52), U(0.12, 0.66)];
    return {
      U, profile,
      // the face and skull, from the crown forward and down the profile, down the throat to the neck's foot, back
      // along it and up the nape to the crown
      skin: [U(-0.1, -0.53), U(0.1, -0.48)].concat(profile, neckF, neckB, [U(-0.34, 0.62), U(-0.4, 0.34), U(-0.56, 0.04), U(-0.47, -0.34)])
    };
  }
  // the long almond eye of the Mewar painters, the brow, the lips; small, exact, laid last on the face
  function face(Z, K, H, skin, o) {
    const U = H.U, h = o.h;
    // lips: a little colour, one line at the mouth
    Z.fill(sp(Z, [U(0.318, 0.226), U(0.33, 0.255), U(0.296, 0.282), U(0.314, 0.31), U(0.27, 0.33), U(0.255, 0.28)], true, 0.12), 'chalk', skin.lip, { w: 0.5, p: 0.9, passes: 2 });
    K.line(sp(Z, [U(0.3, 0.283), U(0.255, 0.281), U(0.225, 0.29)], false, 0.12), 0.16, { p: 0.85, tin: 0.1, tout: 0.4 });
    // the nostril, a single stroke
    K.line(sp(Z, [U(0.335, 0.168), U(0.312, 0.178), U(0.31, 0.19)], false, 0.1), 0.13, { p: 0.75 });
    // the eye: white, the iris under the upper lid, kajal on the lids running back to a fine tail
    const ec = U(0.085, 0.0), L0 = U(-0.07, 0.006), R0 = U(0.215, 0.004);
    const upper = sp(Z, [L0, U(-0.01, -0.052), U(0.09, -0.074), U(0.17, -0.046), R0], false, 0.08);
    const lower = sp(Z, [R0, U(0.155, 0.036), U(0.07, 0.05), U(-0.02, 0.036), L0], false, 0.08);
    const eye = upper.concat(lower.slice(1));
    Z.fill(eye, 'chalk', '#f6efe2', { w: 0.35, p: 1, passes: 3, reach: 1.6 });
    Z.withMask(eye, () => {
      Z.fill(Z.ellipse(ec[0] + 0.022 * h, ec[1] - 0.008 * h, 0.043 * h, 0.046 * h), 'chalk', '#2a1a14', { w: 0.3, p: 1, passes: 3, reach: 1.6 });
      K.dot(ec[0] + 0.01 * h, ec[1] - 0.024 * h, '#fff8ec', 0.012 * h * 2.0, { p: 0.9 });
    });
    K.line(upper.concat([U(-0.12, -0.016), U(-0.17, -0.04)]), 0.15, { p: 1, tin: 0.04, tout: 0.4 });
    K.line(lower, 0.085, { p: 0.85, tin: 0.2, tout: 0.2 });
    // the brow, a long thin arch
    K.line(sp(Z, [U(-0.08, -0.115), U(0.05, -0.15), U(0.17, -0.135), U(0.24, -0.095)], false, 0.1), 0.12, { p: 0.95, tin: 0.25, tout: 0.15 });
  }

  // ---------------------------------------------------------------- the woman
  function woman(Z, K, P, o) {
    const g = P.T.g, b = P.b, ph = P.ph, sd = o.seed || 1, sk = SKIN.woman;
    const B = (x, y) => [x, y + b];                    // the body above the hips rides on the bob
    const part = n => Z.reseed(sd * 1009 + n * 71);
    const E = B(2.6, -88.5), h = 14, H = headGeom(E, h, [B(4.5, -78.2), B(6.0, -74.5), B(5.0, -72.0)], [B(-1.0, -72.5), B(-2.2, -78.0)]), U = H.U;
    const kf = clamp((P.lagKnee(0.06) - 4.5) * 0.75, -1, 8);
    const cm = P.stand ? 0.12 : 1;                     // standing, the cloth all but still
    const swF = cm * Math.sin(2 * TAU * (ph - 0.1)), swB = 1.3 * cm * Math.sin(2 * TAU * (ph - 0.18));
    const tail = 1.2 * cm * Math.sin(2 * TAU * (ph - 0.16));
    // on a stair the hem rides between the two treads; on a ramp it hangs to the feet's mean
    // on a stair or a ramp the hem follows the feet: its front edge rides with the leading foot, its back with the
    // trailing one (on a stair it rests a little above the treads)
    const lead = P.near.O[0] >= P.far.O[0] ? P.near : P.far, trail = lead === P.near ? P.far : P.near;
    const slope = (P.T.stair || P.T.ramp) && !P.stand, up0 = P.T.stair ? 0.6 : 0;
    const hdF = slope ? lead.O[1] + up0 : 0, hdB = slope ? trail.O[1] + up0 : 0, hd0 = 0.5 * (hdF + hdB);
    // the cloth drapes over any knee or shin that comes forward (or back) of it above the hem
    const legPts = [];
    for (const L of [P.near, P.far]) {
      const hy = -6.5 + b * 0.5 + (L === lead ? hdF : hdB);   // at or under its own side of the hem the leg shows anyway
      for (let i = 0; i <= 12; i++) { const t = i / 12, q = t <= 0.5 ? lerpv(L.hip, L.knee, 0.5 + t) : lerpv(L.knee, L.ank, (t - 0.5) * 2); if (q[1] < hy) legPts.push(q); }
    }
    const drape = (curve, side) => curve.map(p => {
      let x = p[0];
      for (const q of legPts) {
        const dy = p[1] - q[1], need = side * (q[0] - p[0]) + 2.4 - (dy >= 0 ? 0.16 * dy : 0.035 * dy * dy);
        if (need > 0) x = side > 0 ? Math.max(x, p[0] + need) : Math.min(x, p[0] - need);
      }
      return [x, p[1]];
    });

    // ---- the far arm, raised behind the head to the pots (darker: it is on the far side)
    part(1);
    const fS = B(-0.6, -74.6), fW = B(-7.2, -97.2), fE = ik(fS, fW, 13.2, 12.0, p => -p[0]);
    const farArm = sp(Z, [add(fS, [2.0, 0.5]), add(fE, [0.8, 0.9]), add(fW, [0.9, 0.3]), add(fW, [-0.9, -0.2]), add(fE, [-1.4, 0.1]), add(fS, [-2.0, 0.6])], true);
    K.burnish(farArm); K.solid(farArm, sk.far, { w: 1.2 });
    Z.withMask(farArm, () => {
      // the choli sleeve, and ivory chooda from the wrist half way to the elbow
      const sl = [add(fS, [3, 3]), add(lerpv(fS, fE, 0.55), [2.5, 0]), add(lerpv(fS, fE, 0.55), [-3, 0]), add(fS, [-3, 3])];
      K.fine(sl, Z.mix(C.haldi, '#6a4a40', 0.25));
      for (let i = 0; i < 7; i++) {
        const t = 0.1 + i * 0.075, c = lerpv(fW, fE, t), d = sub(fE, fW), n = mulv([d[1], -d[0]], 1 / Math.hypot(d[0], d[1]));
        Z.stroke([add(c, mulv(n, 1.8)), add(c, mulv(n, -1.8))], 'chalk', i === 0 || i === 6 ? Z.mix(C.hingul, '#3a2030', 0.2) : Z.mix(C.lime, '#6a5a60', 0.22), { w: 0.62, p: 1 });
      }
    });
    K.ink(farArm, 0.36);

    // ---- the feet under the hem: the far one first
    for (const [f, far] of [[P.far, true], [P.near, false]]) {
      part(far ? 3 : 4);
      const kd = sub(f.ank, f.knee), kn = mulv([kd[1], -kd[0]], 1 / Math.hypot(kd[0], kd[1]));
      const shin = sp(Z, [add(f.knee, mulv(kn, -1.9)), add(lerpv(f.knee, f.ank, 0.55), mulv(kn, -1.35)), add(f.ank, mulv(kn, -1.05)), add(f.ank, mulv(kn, 1.1)), add(lerpv(f.knee, f.ank, 0.4), mulv(kn, 1.9)), add(f.knee, mulv(kn, 2.1))], true, 0.2);
      K.solid(shin, far ? sk.far : sk.s, { w: 0.9 });
      K.ink(shin, 0.3);
      const fp = footPoly(Z, g, f, false);
      K.burnish(fp); K.solid(fp, far ? sk.far : sk.s, { w: 0.9 });
      // alta along the sole, and a silver anklet of small bells
      Z.withMask(fp, () => Z.stroke([add(f.O, rot([g.hb - 0.6, -0.15], f.th)), add(f.O, rot([2.5, 0.35], f.th)), add(f.O, rot([g.toe + 0.4, -0.25], f.th))], 'chalk', C.alta, { w: 0.75, p: 0.95 }));
      K.ink(fp, 0.32);
      const an = [add(f.O, rot([-1.1, -2.9], f.th)), add(f.O, rot([0.2, -2.75], f.th)), add(f.O, rot([1.3, -2.95], f.th))];
      K.line(an, 0.12, { c: '#5a5a66', p: 0.8 });
      for (let i = 0; i < 4; i++) { const q = lerpv(an[0], an[2], (i + 0.5) / 4); K.dot(q[0], q[1] + 0.25, far ? '#c8c6cc' : '#eeeef2', 0.55); }
    }

    // ---- the ghagra: a bell of gathered cloth, its print and pleats fixed to the cloth so they swing with it
    part(5);
    const wB = B(-4.4, -61.4), wF = B(4.9, -61.4);
    const back = sp(Z, [wB, B(-7.4, -56.5), B(-10.6, -48.5), B(-13.6, -38), [-18.6 + swB * 0.3, -21.5 + b * 0.7 + hdB * 0.4], [-24.0 + swB - kf * 0.12, -4.6 + b * 0.5 + hdB]], false, 0.3);
    const front = sp(Z, [wF, B(6.9, -56), B(8.5 + kf * 0.3, -47), B(10.0 + kf * 0.5, -38), [13.0 + kf * 0.85 + swF * 0.3, -23.0 + b * 0.8 + hdF * 0.4], [18.6 + kf * 1.05 + swF, -5.4 + b * 0.5 - kf * 0.12 + hdF]], false, 0.3);
    const NV = 60, BK = resample(slope ? drape(back, -1) : back, NV), FR = resample(slope ? drape(front, 1) : front, NV);
    // the hem's height under each point follows the foot nearest it: low behind the trailing foot, up at the leading one
    const hdx = x => { const d = lead.O[0] - trail.O[0], t = d > 2 ? clamp((x - trail.O[0]) / d, 0, 1) : 0.5; return lerp(hdB, hdF, sstep(t)); };
    const hemY = (u, x) => -4.35 + b * 0.5 + hdx(x) - 0.55 * Math.sin(PI * u) - kf * 0.12 * u;
    const at = (u, v) => {
      const k = v * NV, i = Math.min(NV - 1, Math.floor(k)), f = k - i;
      const pb = lerpv(BK[i], BK[i + 1], f), pf = lerpv(FR[i], FR[i + 1], f), p = lerpv(pb, pf, u);
      // the cloth is round: the middle of the skirt hangs a little lower than its two edges
      return [p[0], p[1] + Math.sin(PI * u) * 0.9 * v * v];
    };
    const NP = 13, scal = u => 0.38 * Math.abs(Math.sin(PI * u * NP));
    const hem = []; for (let i = 0; i <= 80; i++) { const u = i / 80, p = at(u, 1); hem.push([p[0], hemY(u, p[0]) + scal(u)]); }
    const skirt = BK.concat(hem.slice(1, -1), FR.slice().reverse());
    K.burnish(skirt);
    K.solid(skirt, C.hingul);
    Z.withMask(skirt, () => {
      // the gathers: dark folds and a lit edge on each
      for (let i = 1; i < NP; i++) {
        const u = i / NP + 0.012 * Math.sin(i * 2.1), pl = []; for (let k = 0; k <= 24; k++) pl.push(at(u + 0.02 * (k / 24) * (k / 24) * Math.sin(i), 0.03 + 0.97 * k / 24));
        Z.stroke(pl.map((p, k) => [p[0], p[1], 0.35 + 0.65 * k / 24]), 'chalk', Z.mix(C.hingul, '#3a0e14', 0.42), { w: 0.75, p: 0.6, tin: 0.2, tout: 0 });
        Z.stroke(offset(pl, -0.75).map((p, k) => [p[0], p[1], 0.3 + 0.7 * k / 24]), 'chalk', Z.mix(C.hingul, '#f0a080', 0.32), { w: 0.55, p: 0.45, tin: 0.3, tout: 0 });
      }
      // the print: rows of small butis, a white flower of four dots round a haldi heart, counted on the cloth
      part(6);
      for (let r = 0; r < 6; r++) {
        const v = 0.12 + r * 0.118, n = 7 + r;
        for (let j = 0; j < n; j++) {
          const u = (j + (r % 2 ? 0.75 : 0.25)) / n; if (u > 0.985) continue;
          const p = at(u, v), s = 0.42 + v * 0.22;
          for (let q = 0; q < 4; q++) { const a = q * PI / 2 + 0.3; K.dot(p[0] + Math.cos(a) * s, p[1] + Math.sin(a) * s, C.limeLit, 0.5 + v * 0.2); }
          K.dot(p[0], p[1], C.haldi, 0.42 + v * 0.15);
        }
      }
      // the border band: lapis, ruled with gota at both edges, a row of florets between
      part(7);
      const bandTop = []; for (let i = 0; i <= 60; i++) bandTop.push(at(i / 60, 0.845));
      const band = bandTop.concat(hem.slice().reverse().map(p => [p[0], p[1] + 1]));
      Z.fill(band, 'pastel', C.lapis, { w: 1.6, p: 1, reach: 1.5, passes: 3, ang: 0.1, streak: 0.15 });
      Z.withMask(band, () => {
        const gl = bandTop.map(p => [p[0], p[1] + 0.25]);
        Z.stroke(gl, 'chalk', C.ochre, { w: 1.0, p: 1 });
        K.dots(gl.map(p => [p[0], p[1] + 0.05]), 1.15, C.ochreLit, 0.4);
        const hl = hem.map(p => [p[0], p[1] - 0.9]);
        Z.stroke(hl, 'chalk', C.ochre, { w: 1.0, p: 1 });
        for (let j = 0; j < 9; j++) { const u = (j + 0.5) / 9, p = at(u, 0.92); K.floret(p[0], p[1] + 0.2, 1.25, C.limeLit, C.hingul, 0.3 + j * 0.4); }
        for (let j = 0; j < 9; j++) { const u = (j + 1) / 9; if (u >= 1) continue; const p = at(u, 0.925); K.dot(p[0], p[1] + 0.2, C.ochreLit, 0.45); }
      });
      // the waist: an ochre band
      Z.stroke([add(wB, [0, 1.0]), add(wF, [0, 1.0])], 'chalk', C.ochre, { w: 1.3, p: 1 });
      K.shade(skirt, '#5a1020', 0.7, 0.25);
    });
    K.ink(skirt, 0.5);
    for (let i = 1; i < NP; i += 2) { const u = i / NP, pl = []; for (let k = 0; k <= 10; k++) pl.push(at(u, 0.05 + 0.5 * k / 10)); K.hair(pl, 0.18, { p: 0.4 }); }

    // ---- the neck and face (the odhni will cover all but the face, the throat and the top of the chest)
    part(9);
    const chest = [B(4.5, -78.2), B(6.0, -74.5), B(7.6, -70.0), B(6.5, -66.5)];
    const skin = sp(Z, H.skin, true, 0.18);
    K.burnish(skin); K.solid(skin, sk.s, { w: 0.9 });
    // the hair under the odhni: black, combed down over the temple
    const hairP = sp(Z, [U(0.19, -0.36), U(0.08, -0.315), U(-0.04, -0.245), U(-0.12, -0.12), U(-0.15, 0.04), U(-0.12, 0.17), U(-0.105, 0.27), U(-0.14, 0.31), U(-0.22, 0.3), U(-0.4, 0.3), U(-0.5, 0.0), U(-0.28, -0.46)], true, 0.14);
    Z.fill(hairP, 'chalk', C.hair, { w: 0.6, p: 1, passes: 3, reach: 1.5 });
    // the odhni: over the head, down the back past the hips, across the chest into the waist
    part(10);
    const tailTip = [-12.6 - tail, -40.5 + b * 0.6];
    const odhni = sp(Z, [
      U(0.215, -0.365), U(0.12, -0.6), U(-0.2, -0.68), U(-0.52, -0.5), U(-0.64, -0.12), U(-0.6, 0.26),
      B(-6.2, -79.5), B(-7.5, -71.5), B(-8.9, -61), [-10.6 - tail * 0.6, -50.5 + b * 0.8], tailTip,
      [-9.0 - tail * 0.5, -43.0 + b * 0.7], B(-3.0, -50.0), B(2.4, -56.0), B(5.5, -61.2),
      B(6.6, -66.2), B(7.9, -70.0), B(6.5, -73.8), B(4.6, -75.6), B(1.6, -78.6), B(0.4, -81.6),
      U(-0.2, 0.38), U(-0.25, 0.14), U(-0.2, -0.09), U(-0.08, -0.255), U(0.1, -0.335)
    ], true, 0.22);
    K.burnish(odhni); K.solid(odhni, C.mal);
    Z.withMask(odhni, () => {
      // a fold or two down the back, the lit side of the hood
      K.hair(sp(Z, [B(-3.5, -77), B(-5.2, -66), [-7.0 - tail * 0.4, -52 + b]], false), 0.2, { c: Z.mix(C.mal, '#0a1a14', 0.5), p: 0.55 });
      K.hair(sp(Z, [U(-0.35, -0.42), U(-0.5, -0.1), U(-0.48, 0.2)], false), 0.18, { c: Z.mix(C.mal, '#0a1a14', 0.45), p: 0.5 });
      Z.stroke(sp(Z, [U(0.05, -0.55), U(-0.22, -0.6), U(-0.45, -0.42)], false), 'chalk', C.malLit, { w: 1.0, p: 0.5, tin: 0.3, tout: 0.3 });
      // the chunri print: three white dots and a red one, on a lattice fixed to the cloth
      part(11);
      for (let yy = -100; yy < -38; yy += 3.1) {
        const row = Math.round(yy / 3.1);
        for (let xx = -14; xx < 9; xx += 3.4) {
          const x = xx + (row % 2 ? 1.7 : 0), y = yy + b;
          if (!Z.inside([odhni], x, y)) continue;
          for (let q = 0; q < 3; q++) { const a = q * TAU / 3 - PI / 2; K.dot(x + Math.cos(a) * 0.45, y + Math.sin(a) * 0.45, '#f4f0e0', 0.42); }
          K.dot(x, y, C.hingul, 0.3);
        }
      }
      K.shade(odhni, '#0c2418', 0.6, 0.18);
    });
    // the gota: an ochre band all along the edge that frames the face and the edge that falls from the waist
    part(12);
    const fEdge = sp(Z, [B(5.5, -61.2), B(6.6, -66.2), B(7.9, -70.0), B(6.5, -73.8), B(4.6, -75.6), B(1.6, -78.6), B(0.4, -81.6), U(-0.2, 0.38), U(-0.25, 0.14), U(-0.2, -0.09), U(-0.08, -0.255), U(0.1, -0.335), U(0.215, -0.365)], false, 0.2);
    const lEdge = sp(Z, [B(5.5, -61.2), B(2.4, -56.0), B(-3.0, -50.0), [-9.0 - tail * 0.5, -43.0 + b * 0.7], tailTip], false, 0.2);
    const bEdge = sp(Z, [tailTip, [-10.6 - tail * 0.6, -50.5 + b * 0.8], B(-8.9, -61), B(-7.5, -71.5), B(-6.2, -79.5)], false, 0.2);
    Z.withMask(odhni, () => {
      for (const e of [fEdge, lEdge, bEdge]) {
        const band = ribbon(e, () => 0.95);
        Z.fill(band, 'chalk', C.ochre, { w: 0.6, p: 1, passes: 3, reach: 1.5 });
        K.dots(e, 1.05, C.ochreLit, 0.42);
      }
    });
    K.ink(odhni, 0.46);

    // ---- the face, the jewels
    part(13);
    K.edge(sp(Z, H.profile.slice(0, -1), false, 0.14), 0.34, t => clamp(0.3 + t, 0, 1));
    face(Z, K, H, sk, { h });
    // a shade under the jaw on the throat
    Z.withMask(skin, () => Z.stroke(sp(Z, [U(0.22, 0.5), U(0.06, 0.53), U(-0.06, 0.6)], false), 'shade', sk.sh, { w: 1.4, p: 0.45 }));
    // the borla on the hairline, the nath through the nostril with its chain back into the hair
    K.dot(...U(0.215, -0.345), C.ochre, 1.2); K.dot(...U(0.2, -0.36), C.ochreLit, 0.5);
    const nc = U(0.315, 0.235);
    Z.stroke(Z.ellipse(nc[0] - 0.02 * h, nc[1] + 0.01 * h, 0.085 * h, 0.08 * h).slice(4, 38), 'chalk', C.ochre, { w: 0.34, p: 1 });
    K.dot(nc[0] - 0.09 * h, nc[1] + 0.07 * h, C.limeLit, 0.5);
    K.dots(sp(Z, [U(0.24, 0.29), U(0.08, 0.2), U(-0.06, 0.06)], false), 0.55, C.ochre, 0.26);
    // the aad round the throat: an ochre collar with a red stone in each of its plates
    const nk = sp(Z, [B(0.6, -79.6), B(2.6, -77.5), B(4.9, -76.4)], false, 0.15);
    Z.stroke(nk, 'chalk', C.ochre, { w: 1.3, p: 1 });
    for (const q of Z.along(nk, 0.9, 0)) K.dot(q.x, q.y + 0.75, C.ochre, 0.55);
    for (const q of Z.along(nk, 1.3, 0)) K.dot(q.x, q.y, C.hingul, 0.38);
    K.line(nk.map(p => [p[0], p[1] - 0.7]), 0.1, { p: 0.6 });

    // ---- the inderi and the pots: a clay matka, a brass lota on it
    part(14);
    const ri = B(0.7, -97.9);
    const ring = Z.ellipse(ri[0], ri[1], 4.6, 1.35);
    Z.fill(ring, 'chalk', C.hingul, { w: 0.7, p: 1, passes: 3 });
    Z.withMask(ring, () => { for (let i = -5; i <= 5; i++) Z.stroke([[ri[0] + i * 0.95 - 0.6, ri[1] + 1.5], [ri[0] + i * 0.95 + 0.6, ri[1] - 1.5]], 'chalk', C.limeLit, { w: 0.42, p: 0.95 }); });
    K.ink(ring, 0.3);
    part(15);
    const mc = B(0.7, -106.9);
    const matka = sp(Z, [[mc[0], mc[1] + 8.1], [mc[0] + 6.4, mc[1] + 6.3], [mc[0] + 9.3, mc[1] + 1.2], [mc[0] + 8.5, mc[1] - 3.8], [mc[0] + 5.2, mc[1] - 7.1], [mc[0] + 3.0, mc[1] - 8.0],
      [mc[0] + 2.8, mc[1] - 9.2], [mc[0] + 4.0, mc[1] - 10.0], [mc[0] + 3.5, mc[1] - 10.8], [mc[0] - 3.3, mc[1] - 10.8], [mc[0] - 3.8, mc[1] - 10.0], [mc[0] - 2.6, mc[1] - 9.2],
      [mc[0] - 2.8, mc[1] - 8.0], [mc[0] - 5.0, mc[1] - 7.1], [mc[0] - 8.3, mc[1] - 3.8], [mc[0] - 9.1, mc[1] + 1.2], [mc[0] - 6.2, mc[1] + 6.3]], true, 0.2);
    K.burnish(matka); K.solid(matka, C.clay, { w: 1.4 });
    Z.withMask(matka, () => {
      // painted bands round its shoulder, white with red between, dots counted along the middle band
      const arc = (y, sag) => { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push([mc[0] - 10 + 20 * t, mc[1] + y + sag * Math.sin(PI * t)]); } return pts; };
      Z.stroke(arc(-5.6, 1.1), 'chalk', C.lime, { w: 0.55, p: 1 });
      Z.stroke(arc(-3.3, 1.6), 'chalk', C.lime, { w: 0.55, p: 1 });
      K.dots(arc(-4.45, 1.35), 1.25, C.limeLit, 0.5);
      Z.stroke(arc(-0.6, 2.0), 'chalk', Z.mix(C.clayDeep, '#000', 0.2), { w: 0.4, p: 0.8 });
      // the light on its round, the shade away from it
      Z.stroke(sp(Z, [[mc[0] - 6.2 * K.LS, mc[1] - 3.2], [mc[0] - 7.0 * K.LS, mc[1] + 0.5], [mc[0] - 5.6 * K.LS, mc[1] + 3.6]], false), 'chalk', C.clayLit, { w: 1.5, p: 0.55, tin: 0.3, tout: 0.3 });
      K.shade(matka, C.clayDeep, 1.1, 0.4);
    });
    K.ink(matka, 0.42);
    K.line([[mc[0] - 3.4, mc[1] - 10.0], [mc[0] + 3.8, mc[1] - 10.0]], 0.12, { p: 0.6 });
    part(16);
    const lc = B(1.0, -122.2);
    const lota = sp(Z, [[lc[0], lc[1] + 4.6], [lc[0] + 4.1, lc[1] + 3.6], [lc[0] + 6.1, lc[1] + 0.6], [lc[0] + 5.2, lc[1] - 2.6], [lc[0] + 2.6, lc[1] - 4.1], [lc[0] + 2.3, lc[1] - 5.4],
      [lc[0] + 3.7, lc[1] - 6.4], [lc[0] + 3.4, lc[1] - 7.0], [lc[0] - 3.2, lc[1] - 7.0], [lc[0] - 3.5, lc[1] - 6.4], [lc[0] - 2.1, lc[1] - 5.4], [lc[0] - 2.4, lc[1] - 4.1],
      [lc[0] - 5.0, lc[1] - 2.6], [lc[0] - 5.9, lc[1] + 0.6], [lc[0] - 3.9, lc[1] + 3.6]], true, 0.2);
    K.burnish(lota); K.solid(lota, C.ochre, { w: 1.1 });
    Z.withMask(lota, () => {
      Z.stroke(sp(Z, [[lc[0] - 3.6 * K.LS, lc[1] - 2.0], [lc[0] - 4.3 * K.LS, lc[1] + 0.6], [lc[0] - 3.2 * K.LS, lc[1] + 2.6]], false), 'chalk', '#f4dc94', { w: 1.3, p: 0.8, tin: 0.25, tout: 0.25 });
      K.shade(lota, C.ochreDeep, 1.2, 0.42);
      const arc = (y, sag) => { const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([lc[0] - 7 + 14 * t, lc[1] + y + sag * Math.sin(PI * t)]); } return pts; };
      K.hair(arc(-2.4, 0.8), 0.14, { c: C.ochreDeep, p: 0.8 });
      K.dots(arc(-1.5, 1.0), 0.95, C.ochreDeep, 0.34);
      K.hair(arc(-0.6, 1.1), 0.14, { c: C.ochreDeep, p: 0.8 });
    });
    K.ink(lota, 0.38);

    // ---- the far hand, up on the matka
    part(17);
    const ha = -1.32, Hn = a => add(fW, rot(a, ha));
    const fHand = sp(Z, [Hn([-0.3, -1.0]), Hn([2.0, -1.3]), Hn([4.0, -0.9]), Hn([5.5, 0.1]), Hn([5.6, 1.1]), Hn([4.6, 1.3]), Hn([3.0, 1.25]), Hn([1.0, 1.1]), Hn([-0.3, 0.9])], true, 0.12);
    K.solid(fHand, sk.far, { w: 0.6 });
    Z.withMask(fHand, () => Z.stroke([Hn([4.9, -0.4]), Hn([5.7, 0.5]), Hn([5.2, 1.3])], 'chalk', C.alta, { w: 0.5, p: 0.9 }));
    K.ink(fHand, 0.26);
    K.hair([Hn([2.4, -0.1]), Hn([4.2, 0.2]), Hn([4.9, 0.9])], 0.12, { p: 0.6 });

    // ---- the near arm, swinging: the choli sleeve, the chooda, the hand with alta on its fingertips
    part(18);
    const nS = B(0.9, -74.3), sw = -0.3 * cm * Math.cos(TAU * (ph - 0.04)) + (P.stand ? 0.04 : 0), bend = 0.2 + 0.24 * clamp(sw / 0.3, 0, 1);
    const nE = add(nS, mulv(dir(sw), 13.0)), nW = add(nE, mulv(dir(sw + bend), 11.4));
    const ua = ribbon(sp(Z, [nS, lerpv(nS, nE, 0.5), nE], false, 0.4), t => lerp(2.3, 1.55, t));
    const fa = ribbon(sp(Z, [nE, lerpv(nE, nW, 0.5), nW], false, 0.4), t => lerp(1.55, 1.0, t));
    const arm = ua.L.concat(fa.L, fa.R.slice().reverse(), ua.R.slice().reverse());
    const armP = sp(Z, resample(arm, 60).concat([add(nS, [0.4, -2.2])]), true, 0.2);
    K.burnish(armP); K.solid(armP, sk.s, { w: 1.0 });
    Z.withMask(armP, () => {
      const ax = sub(nE, nS), an = mulv([ax[1], -ax[0]], 1 / Math.hypot(ax[0], ax[1]));
      const fx = sub(nW, nE), fn = mulv([fx[1], -fx[0]], 1 / Math.hypot(fx[0], fx[1]));
      // ivory up the forearm, red lac at both ends; three more above the elbow
      for (let i = 0; i < 9; i++) {
        const t = 0.06 + i * 0.1, c = lerpv(nW, nE, t), bulge = mulv(fx, 0.012);
        Z.stroke([add(c, mulv(fn, 2.2)), add(add(c, bulge), [0, 0]), add(c, mulv(fn, -2.2))], 'chalk', i === 0 || i === 8 ? C.hingul : '#f2ead8', { w: 0.7, p: 1 });
      }
      for (let i = 0; i < 3; i++) { const c = lerpv(nE, nS, 0.12 + i * 0.1); Z.stroke([add(c, mulv(an, 2.6)), add(c, mulv(an, -2.6))], 'chalk', '#f2ead8', { w: 0.72, p: 1 }); }
    });
    // the choli sleeve over the top of the arm
    const sleeve = sp(Z, [add(nS, [-2.6, -1.2]), add(nS, [0.6, -2.6]), add(nS, [2.6, -0.6]), add(lerpv(nS, nE, 0.46), mulv([Math.cos(sw), -Math.sin(sw)], 2.0)), add(lerpv(nS, nE, 0.5), mulv([Math.cos(sw), -Math.sin(sw)], -2.15)), add(nS, [-2.4, 2.0])], true, 0.2);
    K.solid(sleeve, C.haldi, { w: 1.0 });
    Z.withMask(sleeve, () => {
      const cf = [add(lerpv(nS, nE, 0.44), mulv([Math.cos(sw), -Math.sin(sw)], 2.6)), add(lerpv(nS, nE, 0.48), mulv([Math.cos(sw), -Math.sin(sw)], -2.6))];
      Z.stroke(cf, 'chalk', C.hingul, { w: 1.2, p: 1 });
      K.dots(sp(Z, [add(nS, [-1.4, -1.6]), add(nS, [0.5, -0.4]), add(lerpv(nS, nE, 0.3), [0, 0])], false), 1.0, C.hingul, 0.4);
      K.shade(sleeve, '#8a5a10', 0.7, 0.3);
    });
    K.ink(sleeve, 0.34);
    K.ink(armP, 0.36);
    // the hand, slender, the fingers together and a little curled
    const hx = sub(nW, nE), hA = Math.atan2(hx[1], hx[0]) + 0.12, Hh = a => add(nW, rot(a, hA));
    const hand = sp(Z, [Hh([-0.4, -0.95]), Hh([1.6, -1.25]), Hh([3.6, -1.0]), Hh([5.4, -0.45]), Hh([5.7, 0.15]), Hh([4.6, 0.55]), Hh([2.8, 1.05]), Hh([1.4, 1.4]), Hh([0.9, 2.1]), Hh([0.2, 1.5]), Hh([-0.4, 0.95])], true, 0.1);
    K.solid(hand, sk.s, { w: 0.55 });
    Z.withMask(hand, () => Z.stroke([Hh([4.9, -0.6]), Hh([5.8, 0.1]), Hh([4.8, 0.7])], 'chalk', C.alta, { w: 0.55, p: 0.95 }));
    K.ink(hand, 0.24);
    K.hair([Hh([2.4, 0.2]), Hh([4.8, 0.05])], 0.12, { p: 0.6 });
  }

  // ---------------------------------------------------------------- the man
  function man(Z, K, P, o) {
    const g = P.T.g, b = P.b, ph = P.ph, sd = o.seed || 2, sk = SKIN.man;
    const B = (x, y) => [x, y + b];
    const part = n => Z.reseed(sd * 1013 + n * 67);
    const E = B(2.8, -90.2), h = 14.4, H = headGeom(E, h, [B(4.7, -79.0)], [B(-1.7, -79.0)]), U = H.U;
    const kf = clamp((P.lagKnee(0.05) - 4.5) * 0.7, -1, 8);
    const cm = P.stand ? 0.12 : 1;
    const swF = 0.9 * cm * Math.sin(2 * TAU * (ph - 0.1)), swB = 1.2 * cm * Math.sin(2 * TAU * (ph - 0.18));
    const tail = 1.1 * cm * Math.sin(2 * TAU * (ph - 0.15));
    const sag = 1.5 + 0.9 * cm * Math.sin(2 * TAU * (ph - 0.08));
    const pole = s => B(s, -81.4 + sag * Math.pow(Math.abs(s) / 36, 2));

    // ---- the yoke's two pots, in rope slings, swinging a little behind the step
    for (const side of [-1, 1]) {
      part(side < 0 ? 1 : 2);
      const ex = side * 34.2, top = pole(ex), swing = 0.7 * cm * Math.sin(2 * TAU * (ph - 0.2)) - 0.4;
      const pc = [ex + swing * 0.6, top[1] + 23.0];
      const pot = sp(Z, [[pc[0], pc[1] + 7.6], [pc[0] + 5.9, pc[1] + 5.8], [pc[0] + 8.4, pc[1] + 1.0], [pc[0] + 7.6, pc[1] - 3.6], [pc[0] + 4.6, pc[1] - 6.5], [pc[0] + 2.7, pc[1] - 7.3],
        [pc[0] + 2.6, pc[1] - 8.4], [pc[0] + 3.6, pc[1] - 9.1], [pc[0] + 3.2, pc[1] - 9.8], [pc[0] - 3.0, pc[1] - 9.8], [pc[0] - 3.4, pc[1] - 9.1], [pc[0] - 2.4, pc[1] - 8.4],
        [pc[0] - 2.5, pc[1] - 7.3], [pc[0] - 4.4, pc[1] - 6.5], [pc[0] - 7.4, pc[1] - 3.6], [pc[0] - 8.2, pc[1] + 1.0], [pc[0] - 5.7, pc[1] + 5.8]], true, 0.2);
      K.burnish(pot); K.solid(pot, C.clay, { w: 1.3 });
      Z.withMask(pot, () => {
        const arc = (y, sag2) => { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push([pc[0] - 9 + 18 * t, pc[1] + y + sag2 * Math.sin(PI * t)]); } return pts; };
        Z.stroke(arc(-4.9, 1.0), 'chalk', C.lime, { w: 0.5, p: 1 });
        K.dots(arc(-3.8, 1.3), 1.2, C.limeLit, 0.45);
        Z.stroke(arc(-2.7, 1.5), 'chalk', C.lime, { w: 0.5, p: 1 });
        Z.stroke(sp(Z, [[pc[0] - 5.4 * K.LS, pc[1] - 2.6], [pc[0] - 6.2 * K.LS, pc[1] + 0.6], [pc[0] - 4.9 * K.LS, pc[1] + 3.4]], false), 'chalk', C.clayLit, { w: 1.4, p: 0.5, tin: 0.3, tout: 0.3 });
        K.shade(pot, C.clayDeep, 1.1, 0.4);
      });
      K.ink(pot, 0.4);
      // the sling: a ring under the lip, cords down round the belly to a ring under it, and three cords up to the pole
      const rope = Z.mix(C.rope, '#3a2a1a', 0.1);
      const neckL = [pc[0] - 3.1, pc[1] - 7.4], neckR = [pc[0] + 3.3, pc[1] - 7.4];
      for (const k of [-1, 0, 1]) {
        const s = [pc[0] + k * 2.8, pc[1] - 7.6], e = [pc[0] + k * 6.6, pc[1] + 5.2];
        Z.stroke(sp(Z, [s, [pc[0] + k * 8.2, pc[1] - 1.5], e], false), 'chalk', rope, { w: 0.42, p: 0.95 });
      }
      Z.stroke([neckL, neckR], 'chalk', rope, { w: 0.55, p: 1 });
      Z.stroke(sp(Z, [[pc[0] - 6.0, pc[1] + 5.4], [pc[0], pc[1] + 6.6], [pc[0] + 6.0, pc[1] + 5.4]], false), 'chalk', rope, { w: 0.5, p: 1 });
      for (const q of [neckL, [pc[0], pc[1] - 7.6], neckR]) { Z.stroke([q, top], 'chalk', rope, { w: 0.42, p: 0.95 }); K.hair([q, top], 0.1, { p: 0.5 }); }
    }

    // ---- the far arm up to the yoke (its hand closes on the pole after the pole is laid)
    part(3);
    const fS = B(-0.3, -77.0), fW = pole(8.6), fEl = ik(fS, add(fW, [0, 0.6]), 13.8, 12.4, p => p[1]);
    const farArm = sp(Z, [add(fS, [1.8, -1.6]), add(fEl, [1.0, -0.6]), add(fW, [1.2, 0.2]), add(fW, [-1.0, 0.8]), add(fEl, [-0.6, 1.6]), add(fS, [-1.9, 1.4])], true);
    K.burnish(farArm); K.solid(farArm, Z.mix(C.lime, '#6a6070', 0.2), { w: 1.2 });
    Z.withMask(farArm, () => { const c = lerpv(fW, fEl, 0.12), d = sub(fEl, fW), n = mulv([d[1], -d[0]], 1 / Math.hypot(d[0], d[1])); Z.stroke([add(c, mulv(n, 2.2)), add(c, mulv(n, -2.2))], 'chalk', C.ochre, { w: 1.0, p: 1 }); });
    K.ink(farArm, 0.34);

    // ---- the yoke: bamboo, its knots ruled, bending a little under the pots
    part(4);
    const poleCl = []; for (let i = 0; i <= 60; i++) poleCl.push(pole(-36 + 72 * i / 60));
    const poleP = ribbon(poleCl, () => 0.95);
    K.solid(poleP, C.bamboo, { w: 0.8, ang: 0.02 });
    Z.withMask(poleP, () => {
      Z.stroke(poleCl.map(p => [p[0], p[1] - 0.45]), 'chalk', '#e4cc84', { w: 0.45, p: 0.8 });
      for (let s = -31; s <= 31; s += 8.6) { const q = pole(s); Z.stroke([[q[0] - 0.25, q[1] - 1.2], [q[0] + 0.25, q[1] + 1.2]], 'chalk', Z.mix(C.bamboo, '#4a3a10', 0.45), { w: 0.42, p: 1 }); }
    });
    K.ink(poleP, 0.3);
    // the hand closed on the pole
    part(5);
    const fist = sp(Z, [add(fW, [-1.2, 1.4]), add(fW, [-1.4, -0.6]), add(fW, [-0.2, -1.6]), add(fW, [1.4, -1.4]), add(fW, [1.9, 0.0]), add(fW, [1.4, 1.5]), add(fW, [0.0, 2.0])], true, 0.12);
    K.solid(fist, sk.far, { w: 0.55 });
    K.ink(fist, 0.26);
    K.hair([add(fW, [0.2, -1.3]), add(fW, [0.6, 0.0]), add(fW, [0.3, 1.4])], 0.1, { p: 0.6 });

    // ---- the legs: the dhoti round each knee, the bare shin, the mojari; the far one first, darker
    // the dhoti's front pleats, hanging between the knees
    const pleats = () => {
      part(20);
      const xc = (P.near.knee[0] + P.far.knee[0]) / 2 + 0.6, sx = swF * 0.4, top = -34 + b, bot = -17.5 + b * 0.6;
      const pan = sp(Z, [[xc - 2.6, top], [xc + 2.4, top], [xc + 3.0 + sx, lerp(top, bot, 0.6)], [xc + 3.4 + sx, bot], [xc + 0.4 + sx, bot + 0.6], [xc - 2.8 + sx, bot], [xc - 3.0 + sx * 0.5, lerp(top, bot, 0.5)]], true, 0.2);
      K.solid(pan, Z.mix(C.lime, '#5a5268', 0.08), { w: 0.9 });
      Z.withMask(pan, () => {
        for (let i = 0; i < 4; i++) { const x = xc - 1.8 + i * 1.35; K.hair([[x, top], [x + sx + 0.3 * i, bot + 0.4]], 0.14, { c: Z.mix(C.lime, '#6a5a70', 0.45), p: 0.7 }); }
        Z.stroke([[xc - 3 + sx, bot - 0.9], [xc + 0.4 + sx, bot - 0.3], [xc + 3.5 + sx, bot - 0.9]], 'chalk', C.hingul, { w: 0.6, p: 0.95 });
      });
      K.ink(pan, 0.3);
    };
    for (const [L, far] of [[P.far, true], [P.near, false]]) {
      if (!far) pleats();
      part(far ? 6 : 7);
      const tp = lerpv(L.hip, L.knee, 0.55), sh = lerpv(L.knee, L.ank, 0.5);
      const kd = sub(L.ank, L.knee), kn = mulv([kd[1], -kd[0]], 1 / Math.hypot(kd[0], kd[1]));   // kn points back
      const shin = sp(Z, [add(sh, mulv(kn, -2.0)), add(lerpv(sh, L.ank, 0.6), mulv(kn, -1.45)), add(L.ank, mulv(kn, -1.25)), add(L.ank, mulv(kn, 1.25)), add(lerpv(sh, L.ank, 0.45), mulv(kn, 1.7)), add(sh, mulv(kn, 2.6))], true, 0.2);
      K.burnish(shin); K.solid(shin, far ? sk.far : sk.s, { w: 0.9 });
      K.ink(shin, 0.32);
      const fp = footPoly(Z, g, L, true);
      K.solid(fp, far ? Z.mix(C.hingul, '#2a1018', 0.3) : C.hingul, { w: 0.8 });
      Z.withMask(fp, () => {
        const top = [add(L.O, rot([-1.6, -2.5], L.th)), add(L.O, rot([1.4, -2.5], L.th)), add(L.O, rot([3.6, -1.6], L.th))];
        Z.stroke(top, 'chalk', C.ochre, { w: 0.85, p: 1 });
        K.dots([add(L.O, rot([2.0, -1.0], L.th)), add(L.O, rot([g.toe, -0.7], L.th))], 0.85, C.ochreLit, 0.36);
      });
      K.ink(fp, 0.32);
      // the dhoti, loose round the knee and gathered below it
      const dcl = sp(Z, [tp, L.knee, sh], false, 0.3);
      const dh = ribbon(dcl, t => t < 0.5 ? lerp(5.0, 4.4, t / 0.5) : lerp(4.4, 3.3, (t - 0.5) / 0.5));
      const dhoti = sp(Z, resample(dh, 70), true, 0.2);
      K.burnish(dhoti); K.solid(dhoti, far ? Z.mix(C.lime, '#5a5268', 0.22) : C.limeLit, { w: 1.2 });
      Z.withMask(dhoti, () => {
        const c1 = Z.mix(C.lime, '#6a5a70', 0.4);
        for (let i = 0; i < 3; i++) { const a = lerpv(L.knee, sh, 0.25 + i * 0.22); K.hair([add(a, mulv(kn, 3.4)), add(lerpv(L.knee, sh, 0.12 + i * 0.22), mulv(kn, -3.4))], 0.16, { c: c1, p: 0.7 }); }
        const hemC = [add(sh, mulv(kn, 3.4)), add(sh, mulv(kn, -3.4))];
        Z.stroke(hemC.map(p => add(p, mulv(sub(L.knee, sh), 0.12))), 'chalk', C.hingul, { w: 0.55, p: 0.9 });
        K.shade(dhoti, '#5a5068', 0.5, 0.3);
      });
      K.ink(dhoti, 0.34);
    }

    // ---- the angarkha's skirt: gathered, white with small red butis, an ochre border at the hem
    part(8);
    const wB = B(-4.6, -61.6), wF = B(5.8, -61.6);
    const back = sp(Z, [wB, B(-6.6, -56), B(-8.9, -49), B(-11.4, -41.5), [-15.4 + swB * 0.5 - kf * 0.1, -30.6 + b]], false, 0.3);
    const front = sp(Z, [wF, B(7.3, -56), B(8.6 + kf * 0.25, -49), [10.4 + kf * 0.55, -42 + b], [14.2 + kf * 1.0 + swF, -31.8 + b - kf * 0.15]], false, 0.3);
    const NV = 40, BK = resample(back, NV), FR = resample(front, NV);
    const at = (u, v) => { const k = v * NV, i = Math.min(NV - 1, Math.floor(k)), f = k - i; const p = lerpv(lerpv(BK[i], BK[i + 1], f), lerpv(FR[i], FR[i + 1], f), u); return [p[0], p[1] + Math.sin(PI * u) * 0.7 * v * v]; };
    const NP = 11, hem = []; for (let i = 0; i <= 60; i++) { const u = i / 60, p = at(u, 1); hem.push([p[0], p[1] + 0.3 * Math.abs(Math.sin(PI * u * NP))]); }
    const skirt = BK.concat(hem.slice(1, -1), FR.slice().reverse());
    K.burnish(skirt); K.solid(skirt, C.limeLit);
    Z.withMask(skirt, () => {
      for (let i = 1; i < NP; i++) {
        const u = i / NP, pl = []; for (let k = 0; k <= 16; k++) pl.push(at(u + 0.015 * Math.sin(i * 1.7) * k / 16, 0.05 + 0.95 * k / 16));
        Z.stroke(pl.map((p, k) => [p[0], p[1], 0.3 + 0.7 * k / 16]), 'chalk', Z.mix(C.lime, '#7a6a80', 0.35), { w: 0.5, p: 0.55, tin: 0.25, tout: 0 });
      }
      part(9);
      for (let r = 0; r < 4; r++) {
        const v = 0.16 + r * 0.17, n = 5 + r;
        for (let j = 0; j < n; j++) { const u = (j + (r % 2 ? 0.75 : 0.25)) / n; if (u > 0.98) continue; const p = at(u, v); K.dot(p[0], p[1], C.hingul, 0.62); K.dot(p[0] + 0.5, p[1] - 0.45, C.mal, 0.32); }
      }
      const bt = []; for (let i = 0; i <= 40; i++) bt.push(at(i / 40, 0.86));
      const band = bt.concat(hem.slice().reverse().map(p => [p[0], p[1] + 1]));
      Z.fill(band, 'chalk', C.ochre, { w: 0.8, p: 1, passes: 3, ang: 0.1 });
      Z.withMask(band, () => { K.dots(bt.map((p, i) => lerpv(p, hem[Math.round(i * 60 / 40)], 0.5)), 1.1, C.hingul, 0.5); });
      Z.stroke(bt, 'chalk', C.hingul, { w: 0.45, p: 1 });
      K.shade(skirt, '#5a5470', 0.65, 0.28);
    });
    K.ink(skirt, 0.46);

    // ---- the turban's tail, behind the neck
    part(10);
    const tl = sp(Z, [U(-0.5, -0.26), U(-0.62, 0.05), [E[0] - 0.7 * h - tail, E[1] + 0.42 * h], [E[0] - 0.8 * h - tail * 1.4, E[1] + 0.82 * h]], false, 0.25);
    const tailP = ribbon(tl, t => lerp(1.4, 1.15, t));
    K.solid(tailP, C.haldi, { w: 0.8 });
    Z.withMask(tailP, () => { for (let i = 0; i < 12; i++) { const q = lerpv(tl[0], tl[tl.length - 1], i / 11); Z.stroke([[q[0] - 1.8, q[1] - 0.5], [q[0] + 1.8, q[1] + 0.9]], 'chalk', i % 2 ? C.hingul : C.saffron, { w: 0.55, p: 1 }); } });
    K.ink(tailP, 0.3);
    { const e = tl[tl.length - 1]; for (let i = -2; i <= 2; i++) K.line([[e[0] + i * 0.5, e[1] + 0.3], [e[0] + i * 0.6 - tail * 0.2, e[1] + 1.8]], 0.12, { c: C.hingulDeep, p: 0.9 }); }

    // ---- the bodice: the overlapping front tied at the side, the patka at the waist
    part(11);
    const body = sp(Z, [B(4.6, -79.6), B(6.6, -76.2), B(7.6, -71.6), B(7.0, -66.4), B(5.9, -61.0), B(-4.7, -61.0), B(-5.2, -66.5), B(-5.0, -72.5), B(-3.6, -77.4), B(-1.8, -80.2)], true, 0.2);
    K.burnish(body); K.solid(body, C.limeLit);
    Z.withMask(body, () => {
      // the flap crossing the chest to the tie under the arm, edged with ochre
      const flap = sp(Z, [B(3.6, -79.8), B(4.6, -74.5), B(2.6, -69.5), B(-1.6, -66.6)], false, 0.2);
      Z.stroke(offset(flap, -0.7), 'chalk', C.ochre, { w: 0.9, p: 1 });
      K.line(flap, 0.2, { p: 0.85 });
      for (const r of [[B(2.0, -75.4), 0.5], [B(-0.5, -71.4), 0.55]]) K.dot(r[0][0], r[0][1], C.hingul, 0.62);
      part(12);
      for (let yy = -77; yy < -62; yy += 3.4) for (let xx = -3.5; xx < 7; xx += 3.2) { const x = xx + (Math.round(yy) % 2 ? 1.6 : 0), y = yy + b; K.dot(x, y, C.hingul, 0.5); }
      K.shade(body, '#5a5470', 0.65, 0.3);
    });
    K.ink(body, 0.44);
    // the tie at the side: a red cord with two tassels, hanging below the armpit
    const tie = B(-1.8, -66.4);
    for (const [dx, l] of [[-0.8, 5.0], [0.6, 6.2]]) { const e = [tie[0] + dx - tail * 0.2, tie[1] + l]; K.line([tie, e], 0.16, { c: C.hingul, p: 1 }); Z.fill(Z.ellipse(e[0], e[1] + 0.7, 0.55, 0.95), 'chalk', C.hingul, { w: 0.4, p: 1, passes: 2 }); }
    // the patka: a red sash, its end hanging in front with an ochre border and a fringe
    part(13);
    const patka = sp(Z, [B(-4.9, -63.6), B(6.2, -63.8), B(6.4, -59.6), B(-4.8, -59.4)], true, 0.2);
    K.solid(patka, C.hingul, { w: 0.9, ang: 0.05 });
    Z.withMask(patka, () => { Z.stroke([B(-5, -61.6), B(6.5, -61.7)], 'chalk', C.hingulDeep, { w: 0.3, p: 0.8 }); K.dots([B(-4.5, -62.6), B(6.0, -62.7)], 1.15, C.ochreLit, 0.4); });
    K.ink(patka, 0.34);
    const pe = sp(Z, [B(4.4, -60.2), B(5.4 + kf * 0.2, -53.0), [6.2 + kf * 0.45 + swF * 0.5, -46.0 + b]], false, 0.25);
    const pend = ribbon(pe, t => lerp(1.3, 1.7, t));
    K.solid(pend, C.hingul, { w: 0.8 });
    Z.withMask(pend, () => { const e = pe[pe.length - 1]; Z.stroke(offset(pe, 1.2), 'chalk', C.ochre, { w: 0.6, p: 1 }); Z.stroke(offset(pe, -1.2), 'chalk', C.ochre, { w: 0.6, p: 1 }); Z.stroke([[e[0] - 2, e[1] - 1.2], [e[0] + 2, e[1] - 1.2]], 'chalk', C.ochre, { w: 0.8, p: 1 }); });
    K.ink(pend, 0.3);
    { const e = pe[pe.length - 1]; for (let i = -3; i <= 3; i++) K.line([[e[0] + i * 0.5, e[1] + 0.4], [e[0] + i * 0.55 - swF * 0.2, e[1] + 1.9]], 0.1, { c: C.ochreDeep, p: 0.9 }); }

    // ---- the neck and face, the ear, the moustache
    part(14);
    const skin = sp(Z, H.skin, true, 0.18);
    K.burnish(skin); K.solid(skin, sk.s, { w: 0.9 });
    Z.withMask(skin, () => {
      Z.stroke(sp(Z, [U(0.22, 0.5), U(0.06, 0.54), U(-0.08, 0.6)], false), 'shade', sk.sh, { w: 1.5, p: 0.45 });
      // the hair below the safa: a short black fall behind the ear, the sideburn down to the jaw
      Z.fill(sp(Z, [U(-0.08, -0.16), U(-0.45, -0.06), U(-0.57, 0.1), U(-0.47, 0.36), U(-0.33, 0.36), U(-0.3, 0.22), U(-0.15, 0.3), U(-0.075, 0.25), U(-0.07, 0.05)], true, 0.14), 'chalk', C.hair, { w: 0.6, p: 1, passes: 3 });
    });
    K.ink(skin, 0.38);
    K.edge(sp(Z, H.profile, false, 0.14), 0.32, t => clamp(0.3 + t, 0, 1));
    const ear = sp(Z, [U(-0.2, -0.04), U(-0.15, 0.0), U(-0.14, 0.1), U(-0.17, 0.19), U(-0.22, 0.22), U(-0.27, 0.16), U(-0.29, 0.04), U(-0.26, -0.03)], true, 0.12);
    K.solid(ear, Z.mix(sk.s, sk.sh, 0.3), { w: 0.4 });
    K.ink(ear, 0.22);
    K.line(sp(Z, [U(-0.24, 0.02), U(-0.19, 0.07), U(-0.22, 0.15)], false, 0.1), 0.1, { p: 0.6 });
    Z.stroke(Z.ellipse(...U(-0.215, 0.255), 0.045 * h, 0.05 * h), 'chalk', C.ochre, { w: 0.32, p: 1 });
    face(Z, K, H, sk, { h });
    // the moustache, full and turned up at its end
    const mo = sp(Z, [U(0.34, 0.195), U(0.27, 0.212), U(0.18, 0.235), U(0.08, 0.235), U(0.02, 0.2), U(0.0, 0.13), U(0.045, 0.16), U(0.06, 0.2), U(0.14, 0.205), U(0.24, 0.19), U(0.31, 0.18)], true, 0.1);
    Z.fill(mo, 'chalk', C.hair, { w: 0.4, p: 1, passes: 3, reach: 1.5 });
    K.line(sp(Z, [U(0.3, 0.2), U(0.16, 0.222), U(0.06, 0.21), U(0.025, 0.15)], false, 0.1), 0.1, { c: '#4a3a40', p: 0.6 });
    // a string of tulsi beads round the neck
    K.dots(sp(Z, [B(-0.6, -81.0), B(2.0, -79.6), B(4.6, -79.0)], false, 0.15), 0.62, '#7a4a2a', 0.42);

    // ---- the safa: wrapped high and round, in leheriya: each wrap its own run of waves
    part(15);
    const safa = sp(Z, [U(0.24, -0.2), U(0.3, -0.34), U(0.25, -0.52), U(0.06, -0.65), U(-0.3, -0.655), U(-0.58, -0.5), U(-0.64, -0.24), U(-0.52, -0.02), U(-0.34, -0.07), U(-0.12, -0.14), U(0.08, -0.19)], true, 0.18);
    K.burnish(safa); K.solid(safa, C.haldi, { w: 1.0 });
    const wraps = [];
    for (let k = 0; k <= 6; k++) {
      const dy = -0.07 * k, lean = 0.024 * k;
      wraps.push(sp(Z, [U(-0.72, -0.06 + dy * 1.1 - lean), U(-0.4, -0.08 + dy), U(-0.12, -0.15 + dy * 0.95), U(0.1, -0.21 + dy * 0.85), U(0.36, -0.25 + dy * 0.7)], false, 0.2));
    }
    Z.withMask(safa, () => {
      const cols = [C.hingul, C.saffron, C.mal, C.hingul, C.saffron, C.hingul, C.mal];
      for (let k = 0; k < 6; k++) {
        const band = wraps[k].concat(wraps[k + 1].slice().reverse());
        Z.withMask(band, () => {
          const a = k % 2 ? 0.75 : -0.75, ca = Math.cos(a), sa = Math.sin(a), c = U(-0.15, -0.4);
          for (let i = -14; i <= 14; i++) {
            const o2 = i * 0.042 * h, p0 = [c[0] + ca * -14 - sa * o2, c[1] + sa * -14 + ca * o2], p1 = [c[0] + ca * 14 - sa * o2, c[1] + sa * 14 + ca * o2];
            const wav = []; for (let s = 0; s <= 40; s++) { const t = s / 40; const q = lerpv(p0, p1, t); wav.push([q[0] - sa * 0.18 * Math.sin(t * 28), q[1] + ca * 0.18 * Math.sin(t * 28)]); }
            Z.stroke(wav, 'chalk', i % 2 ? cols[k] : Z.mix(C.haldi, '#ffffff', 0.25), { w: 0.42, p: 1, tin: 0, tout: 0 });
          }
        });
        K.line(wraps[k + 1], 0.14, { p: 0.85 });
      }
      K.shade(safa, '#6a3a10', 0.75, 0.3);
      Z.stroke(sp(Z, [U(-0.05, -0.63), U(-0.3, -0.64), U(-0.5, -0.5)], false), 'chalk', '#fff2c0', { w: 1.0, p: 0.4, tin: 0.3, tout: 0.3 });
    });
    K.ink(safa, 0.42);
    // the knot at the front: a twist with a small ochre ornament
    K.dot(...U(0.26, -0.35), C.ochre, 1.0); K.dot(...U(0.25, -0.37), C.ochreLit, 0.45);

    // ---- the near arm, swinging in its long sleeve
    part(16);
    const nS = B(0.9, -76.5), sw = -0.32 * cm * Math.cos(TAU * (ph - 0.04)) + (P.stand ? 0.04 : 0), bend = 0.18 + 0.26 * clamp(sw / 0.32, 0, 1);
    const nE = add(nS, mulv(dir(sw), 13.8)), nW = add(nE, mulv(dir(sw + bend), 12.2));
    const ua = ribbon(sp(Z, [nS, lerpv(nS, nE, 0.5), nE], false, 0.4), t => lerp(2.7, 1.95, t));
    const fa = ribbon(sp(Z, [nE, lerpv(nE, nW, 0.5), nW], false, 0.4), t => lerp(1.95, 1.4, t));
    const arm = sp(Z, resample(ua.L.concat(fa.L, fa.R.slice().reverse(), ua.R.slice().reverse()), 60).concat([add(nS, [0.4, -2.6])]), true, 0.2);
    K.burnish(arm); K.solid(arm, C.limeLit, { w: 1.0 });
    Z.withMask(arm, () => {
      const fx = sub(nW, nE), fn = mulv([fx[1], -fx[0]], 1 / Math.hypot(fx[0], fx[1])), c = lerpv(nW, nE, 0.1);
      Z.stroke([add(c, mulv(fn, 2.4)), add(c, mulv(fn, -2.4))], 'chalk', C.ochre, { w: 1.3, p: 1 });
      K.dots([add(lerpv(nW, nE, 0.16), mulv(fn, 2)), add(lerpv(nW, nE, 0.16), mulv(fn, -2))], 0.7, C.hingul, 0.34);
      K.hair(sp(Z, [lerpv(nS, nE, 0.7), add(nE, mulv(fn, 0.6)), lerpv(nE, nW, 0.3)], false), 0.14, { p: 0.5 });
      K.shade(arm, '#5a5470', 0.55, 0.3);
    });
    K.ink(arm, 0.36);
    const hx = sub(nW, nE), hA = Math.atan2(hx[1], hx[0]) + 0.12, Hh = a => add(nW, rot(a, hA));
    const hand = sp(Z, [Hh([-0.3, -1.3]), Hh([1.8, -1.5]), Hh([3.9, -1.2]), Hh([5.8, -0.5]), Hh([6.0, 0.25]), Hh([4.8, 0.7]), Hh([3.0, 1.3]), Hh([1.6, 1.7]), Hh([1.0, 2.4]), Hh([0.2, 1.8]), Hh([-0.3, 1.3])], true, 0.1);
    K.solid(hand, sk.s, { w: 0.55 });
    K.ink(hand, 0.26);
    K.hair([Hh([2.6, 0.2]), Hh([5.0, 0.05])], 0.12, { p: 0.6 });
    Z.stroke([Hh([-0.2, -1.5]), Hh([-0.2, 1.5])], 'chalk', C.ochre, { w: 0.65, p: 1 });
  }

  M.w8Person = function (Z, kind, phase, o) {
    o = o || {};
    const K = kit(Z, o.mirror ? -1 : 1), P = pose(kind, phase, o);
    (kind === 'man' ? man : woman)(Z, K, P, o);
    return { b: P.b, near: P.near, far: P.far };
  };
  // what a cycle carries the body, and the box a frame needs (frame units)
  M.w8PersonGait = function (kind, o) {
    const T = gaitOf(kind, o), lo = 4 + Math.max(0, Math.abs(T.P[1]) * 0.35);   // on a stair or a ramp the lower foot goes below the origin
    return { dx: T.P[0], dy: T.P[1], box: kind === 'man' ? [-46, -104, 46, lo] : [-29, -134, 30, lo] };
  };
})();
