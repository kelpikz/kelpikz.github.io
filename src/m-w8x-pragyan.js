(function () {
  'use strict';
  /* ==========================================================================
     PRAGYAN, the festival hall, repainted for the gold well (well8k)
       M.w8x['pragyan'] = { ground(Z, o), draw(Z, o) }
     Seven cusped arches open on a dark hall dressed for the festival of lights.
     Everything hangs from the line of the pillars, so the hall reads as one
     designed hanging, not a scatter:
       the frieze    a marigold garland swagged from pillar to pillar, a gold boss
                     and a latkan (marigolds, a jasmine knot, a red tassel) at
                     every pillar, and a line of pennants under it, counted
       each arch     a cord in a V from pillar to pillar; at its point the hero
                     (a pierced brass kandil, or a big paper star of eight
                     points, turn and turn about, the kandil in the middle); on
                     each arm a paper lantern with a painted band and, near the
                     pillar, a small star of five points with paper tails
       each pillar   a hanging brass deepam of five flames on chains
       the floor     a rangoli in every arch with three painted clay diyas
     ground() paints the room behind the arches: an aubergine wall with a painted
     trellis and dado, a dark floor, a pastel halo laid round every lantern, the
     light of the pierced kandils thrown on the wall as rings of dots, light pools
     on the floor, and warm light on the faces of the pillars.
     Z is the sheet itself (1 unit = 1 sheet unit, x right, y down).  The light
     comes from the upper left.  Tools: pastel, chalk, kajal, shade, gold.
     ======================================================================== */
  M.w8x = M.w8x || {};
  const PI = Math.PI, TAU = 2 * PI;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  const C = {
    line: '#22140a', chase: '#5a3410', cord: '#3c1a12',
    bole: '#b47c22', shell: '#d4a236', burnish: '#ffe6a0',
    bronze: '#5a3814', bronzeD: '#2e1a08', bronzeL: '#8a5a22',
    hingul: '#c8382a', verm: '#d9462a', lac: '#8f2331', wine: '#5a1a2a',
    haldi: '#edc94b', haldiL: '#ffd95a', saffron: '#ec8a24', mari: '#e8861e', mariY: '#f0b828', mariD: '#b4480e',
    pink: '#e0708c', rose: '#f2a6b4', emerald: '#1f7a4c', mal: '#2f8a5a', leaf: '#3f7a3a', leafL: '#7aae5a',
    lapis: '#2a4b96', neel: '#22306a',
    pearl: '#f7f0dc', white: '#fbf6e8', cream: '#fff3c8', core: '#fffbea', amber: '#f39a2a', ember: '#c8501a',
    clay: '#b0502c', clayD: '#6e2a14', clayL: '#d6865a', oil: '#3a1a08',
    aub: '#2a1430', aubD: '#190a1c', floor: '#26120f', dado: '#4a1426'
  };

  // a small seeded generator for the plan, so ground() and draw() (each reseeded differently) agree on every place
  function prng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // a cord hung between two points: it sags below the chord as a parabola
  function hang(x0, y0, x1, y1, sag, step) {
    const n = Math.max(6, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (step || 0.35))), out = [];
    for (let i = 0; i <= n; i++) { const t = i / n; out.push([lerp(x0, x1, t), lerp(y0, y1, t) + sag * 4 * t * (1 - t)]); }
    return out;
  }
  const onHang = (x0, y0, x1, y1, sag, t) => [lerp(x0, x1, t), lerp(y0, y1, t) + sag * 4 * t * (1 - t)];
  function ribbon(cl, wf) {
    const n = cl.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = cl[Math.max(0, i - 1)], b = cl[Math.min(n - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const w = wf(i / (n - 1));
      L.push([cl[i][0] + nx * w, cl[i][1] + ny * w]); R.push([cl[i][0] - nx * w, cl[i][1] - ny * w]);
    }
    const p = L.concat(R.slice().reverse()); p.L = L; p.R = R; return p;
  }
  const rectP = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  // a closed outline pulled in by d toward its centroid side (for the near-convex forms here)
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

  /* ================================================================ THE PLAN: where everything hangs */
  const PAPER = [   // per arch, mirrored about the middle: the paper lanterns' colour and their band
    ['pink', 'emerald'], ['mal', 'haldi'], ['saffron', 'hingul'], ['hingul', 'haldi'], ['saffron', 'hingul'], ['mal', 'haldi'], ['pink', 'emerald']
  ];
  const STARC = ['verm', null, 'pink', null, 'pink', null, 'verm'];
  function plan(o) {
    const L = o.L, hb = L.bays.find(b => b.kind === 'hall');
    const X0 = hb.x0 + L.pw * 0.55, X1 = hb.x1 - L.pw * 0.55, yt = L.arT, yb = L.arB, w = X1 - X0, h = yb - yt;
    const n = Math.max(3, Math.round(w / 68)), pw = L.pw * 0.7;
    const at = (o.at && o.at.length === n + 1) ? o.at.slice() : [hb.x0].concat(Array.from({ length: n - 1 }, (_, i) => X0 + (i + 1) * w / n), [hb.x1]);
    const R = prng(2022505), J = a => (R() * 2 - 1) * a;
    const P = { n, at, yt, yb, pw, pal: L.pal, arches: [], items: [], diyas: [] };
    P.yG = L.fr0 + 1.0;         // the garland's knots
    P.yB = L.fr0 + 3.8;         // the pennant cord's knots
    P.yC = yt + 1.9;            // the lantern cords' hooks, on the pillar heads
    P.floor = yb - 0.5;
    for (let i = 0; i < n; i++) {
      const a = X0 + i * w / n + pw * 0.6, c = X0 + (i + 1) * w / n - pw * 0.6, ys = yt + h * 0.26, ya = yt + h * 0.04;
      const ar = { i, a, c, xc: (a + c) / 2, ys, ya, yb, poly: M.w8Arch(a, c, yb, ys, ya, 9) };
      // the V: from the hook on each pillar down to the point the hero hangs from
      ar.vx = ar.xc + J(0.22); ar.vy = ys - 1.6 + J(0.25);
      ar.sag = 0.9 + J(0.15);
      const mid = Math.abs(i - (n - 1) / 2) < 0.6, odd = i % 2 === 1;
      if (odd) {
        const u = (mid ? 1.38 : 1.3) * (1 + J(0.012)), ry = ar.vy + 3.6 + J(0.2);
        P.items.push({ kind: 'kandil', arch: i, x: ar.vx, y: ry, u, cx: ar.vx, cy: ry + 12.8 * u, s: 17 * u, core: [6.3 * u, 6.9 * u], halo: 12 * u, tint: '#e8902e' });
      } else {
        const Rr = 11.6 * (1 + J(0.012)), ry = ar.vy + 4.0 + J(0.2);
        P.items.push({ kind: 'star', arch: i, x: ar.vx, y: ry, R: Rr, n: 8, col: STARC[i], col2: STARC[i] === 'pink' ? 'saffron' : 'haldi', u: 1.15, cx: ar.vx, cy: ry + 1.4 * 1.15 + Rr, s: 2 * Rr, core: [0.74 * Rr, 0.74 * Rr], halo: Rr * 1.05, tint: STARC[i] });
      }
      for (const sd of [-1, 1]) {
        const ax = sd < 0 ? at[i] : at[i + 1];
        // a paper lantern on each arm, a little short of half way out from the pillar
        const fp = 0.45 + J(0.01), pp = onHang(ax, P.yC, ar.vx, ar.vy, ar.sag, fp), sp = 11.6 * (1 + J(0.02));
        const py = Math.max(pp[1] + 3, yt + 26.5 + J(0.3));
        P.items.push({ kind: 'paper', arch: i, side: sd, x: pp[0], y: py, hy: pp[1], s: sp, col: PAPER[i][0], band: PAPER[i][1], u: 1.1, cx: pp[0], cy: py + 1.8 + sp * 0.5, core: [0.41 * sp, 0.5 * sp], halo: sp * 0.85, tint: PAPER[i][0] });
        // a small star by the pillar
        const fs = 0.2 + J(0.01), qp = onHang(ax, P.yC, ar.vx, ar.vy, ar.sag, fs), Rs = 3.9 * (1 + J(0.03));
        const qy = yt + 12.6 + J(0.3);
        P.items.push({ kind: 'small', arch: i, side: sd, x: qp[0], y: qy, hy: qp[1], R: Rs, n: 5, u: 0.7, cx: qp[0], cy: qy + 0.85 + Rs, s: 2 * Rs, core: [0.7 * Rs, 0.7 * Rs], halo: Rs * 1.5, tint: 'haldi' });
      }
      P.arches.push(ar);
    }
    // a deepam of five flames in front of every pillar (the two at the ends on the jambs)
    for (let k = 0; k <= n; k++) {
      const x = k === 0 ? at[0] + 1.6 : k === n ? at[n] - 1.6 : at[k], yc = P.yC + 35 + J(0.3);
      P.items.push({ kind: 'deepam', x, y: P.yC, yc, u: 1.2, cx: x, cy: yc + 5.4, s: 9, core: [4.3, 2.4], halo: 7.5, tint: '#e8902e' });
    }
    // three clay diyas round the rangoli in each arch
    for (const ar of P.arches) {
      const rx = 12.6;
      P.diyas.push({ x: ar.xc - rx - 1.6 + J(0.2), y: P.floor - 4.4 + J(0.15), u: 1.05, d: 1 });
      P.diyas.push({ x: ar.xc + rx + 1.6 + J(0.2), y: P.floor - 4.4 + J(0.15), u: 1.05, d: -1 });
      P.diyas.push({ x: ar.xc + J(0.3), y: P.floor + 0.2, u: 1.15, d: ar.i % 2 ? 1 : -1 });
    }
    return P;
  }

  /* ================================================================ THE KIT */
  function kit(Z, o) {
    const rr = Z.rr, KJ = Z.tool('kajal', { wmin: 0.3 }), glints = o.glint ? { push: p => o.glint(p[0], p[1]) } : null;
    const K = { Z, o, rr, KJ };
    K.ell = (cx, cy, rx, ry, a0, a1) => {
      ry = ry == null ? rx : ry; a0 = a0 == null ? 0 : a0; a1 = a1 == null ? TAU : a1;
      const full = Math.abs(a1 - a0) >= TAU - 1e-9, n = Math.max(18, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 0.08)), out = [];
      for (let i = 0; i < (full ? n : n + 1); i++) { const t = a0 + (a1 - a0) * i / n; out.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]); }
      return out;
    };
    // a turned form: the profile [y, r] top to bottom, smooth, mirrored about x = cx
    K.lathe = (cx, prof, step) => {
      const cr = Z.spline(prof.map(p => [p[0], p[1]]), false, step || 0.08);
      const poly = cr.map(p => [cx - p[1], p[0]]).concat(cr.slice().reverse().map(p => [cx + p[1], p[0]]));
      poly.r = y => {
        if (y <= cr[0][0]) return cr[0][1];
        for (let i = 1; i < cr.length; i++) if (cr[i][0] >= y) { const a = cr[i - 1], b = cr[i], t = (y - a[0]) / Math.max(1e-9, b[0] - a[0]); return lerp(a[1], b[1], t); }
        return cr[cr.length - 1][1];
      };
      poly.y0 = cr[0][0]; poly.y1 = cr[cr.length - 1][0];
      return poly;
    };
    K.solid = (p, c, w, ang, x) => Z.fill(p, 'pastel', c, Object.assign({ w: w || 0.6, p: 1, reach: 1.6, passes: 3, ang: ang == null ? 1.5 : ang, turn: 0.32, streak: 0.05, cv: 0.008 }, x || {}));
    // pastel dust rubbed in with a finger: strength f(x, y), caught by the tooth of the paper so it is never a smooth spray.
    // mode 'over' lays the colour on, 'mul' glazes what is there darker through it
    K.wash = (poly, c, f, mode, toothK, grain) => {
      const A = Z.__base || Z, mk = A.pushMask(Z.__pt ? poly.map(p => Z.__pt(p)) : poly, 0); A.popMask();
      if (!mk || !mk.w || !mk.h) return;
      const col = A.col(c), S = A.S, HM = A.HM, tk = toothK == null ? 0.3 : toothK, gr = grain == null ? 0.3 : grain;
      for (let y = 0; y < mk.h; y++) {
        const Y = y + mk.y0; if (Y < 0 || Y >= A.H) continue;
        for (let x = 0; x < mk.w; x++) {
          const v = mk.d[y * mk.w + x] / 255; if (!v) continue;
          const X = x + mk.x0; if (X < 0 || X >= A.W) continue;
          let k = v * f(X / S, Y / S); if (!(k > 0)) continue;
          const i = Y * A.W + X;
          if (HM && tk) k *= 1 + tk * (HM[i] - 0.5) * 1.3;
          if (gr) { let h = Math.imul((X >> 1) + 7919, 374761393) ^ Math.imul((Y >> 1) + 104729, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); k *= 1 + gr * ((((h ^ (h >>> 16)) >>> 0) / 4294967296) - 0.5); }
          k = clamp(k, 0, 1);
          if (mode === 'mul') { A.R[i] *= 1 - k + k * col[0]; A.G[i] *= 1 - k + k * col[1]; A.B[i] *= 1 - k + k * col[2]; }
          else { A.R[i] += (col[0] - A.R[i]) * k; A.G[i] += (col[1] - A.G[i]) * k; A.B[i] += (col[2] - A.B[i]) * k; }
        }
      }
    };
    // the contour in two goes: one even unbroken line, then a pass that swells where the form turns from the light
    K.ink = (poly, w, x) => {
      x = x || {};
      const pts = Z.resample(poly, x.step || clamp(w * 0.45, 0.07, 0.35), true), n = pts.length;
      if (n < 6) return;
      let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
      const sw = pts.map((p, i) => {
        const a = pts[(i - 2 + n) % n], b = pts[(i + 2) % n];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
        return clamp((nx * 0.78 + ny * 0.62 + 0.15) / 0.95, 0, 1);
      });
      const ring = pts.concat(pts.slice(0, 3)), swr = sw.concat(sw.slice(0, 3)), c = x.c || C.line;
      Z.stroke(ring.map(p => [p[0], p[1]]), KJ, c, { w: w * 0.56, p: 1, tin: 0, tout: 0, wob: 0.16 });
      Z.stroke(ring.map((p, i) => [p[0], p[1], 0.38 + 0.62 * swr[i]]), KJ, c, { w, p: 1, tin: 0, tout: 0, wob: 0.16 });
    };
    K.line = (pts, w, c, x) => Z.stroke(pts, KJ, c || C.line, Object.assign({ w, p: 0.94, tin: 0.1, tout: 0.12, wob: 0.2 }, x || {}));
    K.hair = (pts, w, c, x) => Z.stroke(pts, KJ, c || C.line, Object.assign({ w: w || 0.1, p: 0.85, tin: 0.08, tout: 0.1, wob: 0.15 }, x || {}));
    K.dot = (x, y, c, w, x2) => Z.dot(x, y, 'chalk', c, Object.assign({ w, p: 0.97, reach: 1.35 }, x2 || {}));
    // a ruled row of dots: each set by hand, a hair off in size and place
    K.dots = (path, step, c, w, x) => {
      x = x || {};
      const qs = Z.along(path, step, 0), n = qs.length;
      qs.forEach((q, i) => {
        if (x.trim && (i < x.trim || i >= n - x.trim)) return;
        const k = x.size ? x.size(q, i, n) : 1;
        if (k <= 0) return;
        K.dot(q.x + rr(-0.05, 0.05) * step, q.y + rr(-0.05, 0.05) * step, c, w * k * rr(0.9, 1.08), { p: rr(0.88, 1) });
      });
    };
    // gold: an ochre bole, leaf laid over it stopped short of the contour, shell gold rubbed over the leaf
    K.gild = (poly, ang, x) => {
      x = x || {};
      const w = x.w || 0.4;
      Z.fill(poly, 'pastel', x.bole || C.bole, { w, p: 1, reach: 1.5, passes: 2, ang: ang || 0.4, turn: 0.3, cv: 0.01, streak: 0.1 });
      const lp = x.edge === false ? poly : brokenIn(Z, poly, x.d0 != null ? x.d0 : 0.05, x.d1 != null ? x.d1 : 0.16);
      Z.fill(lp, 'gold', x.tint || 'gold', { w, p: 1, reach: 1.4, passes: 2, ang: (ang || 0.4) + 0.3, turn: 0.25 });
      if (x.sheen !== 0) Z.fill(lp, 'pastel', x.tint ? Z.mix(C.shell, x.tint, 0.5) : C.shell, { w: w * 1.2, p: x.sheen || 0.5, reach: 0.95, passes: 1, ang: ang || 0.4, cv: 0.01 });
    };
    // a line of gold leaf; now and then it is a glint the page can make twinkle
    K.gline = (pts, w, glint) => {
      if (pts.length < 2) return;
      Z.stroke(pts, 'gold', 'gold', { w, p: 1, tin: 0.06, tout: 0.1, wob: 0.15 });
      if (glint && glints) glints.push(pts[(pts.length / 2) | 0].slice(0, 2));
    };
    K.gdot = (x, y, w, glint) => { Z.dot(x, y, 'gold', 'gold', { w: w * rr(0.93, 1.06), p: 1, reach: 1.3 }); if (glint && glints) glints.push([x, y]); };
    // burnish the paper under a painted surface: the broad crumple pressed flat, only a fine even tooth left
    K.burnish = polys => {
      const HM = Z.HM, W = Z.W, H = Z.H; if (!HM) return;
      const r = Math.max(2, Math.round(2 * Z.S));
      for (const poly of (Array.isArray(polys[0][0]) ? polys : [polys])) {
        const m = Z.pushMask(poly, 0); Z.popMask();
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
            const i = Y * W + X, v = 0.5 + clamp((HM[i] - mean) * 0.8, -0.24, 0.24);
            HM[i] += (v - HM[i]) * d / 255;
          }
        }
      }
    };
    // a flame standing on its wick at (x, y): amber, then gold, then a white heart; a warm edge, no ink
    K.flame = (x, y, h, lamp) => {
      const w = h * 0.36;
      const tear = (s, dy, lean) => { const out = []; for (let i = 0; i < 44; i++) { const t = i / 44 * TAU, yy = -Math.cos(t), k = (1 - yy) * 0.5; out.push([x + w * s * Math.sin(t) * Math.pow(Math.abs(Math.sin(t / 2)), 1.4) + lean * k * h * 0.08, y - dy - h * s * 0.5 + h * s * 0.5 * yy * -1 * -1]); } return out; };
      const ln = rr(-1, 1);
      const F1 = tear(1, 0, ln), F2 = tear(0.7, h * 0.03, ln * 0.7), F3 = tear(0.4, h * 0.05, ln * 0.4);
      const fw = Math.max(0.12, h * 0.1);
      Z.fill(F1, 'pastel', C.amber, { w: fw, p: 1, reach: 1.55, passes: 2, ang: 1.5, turn: 0.4 });
      Z.fill(F2, 'pastel', C.haldiL, { w: fw * 0.8, p: 1, reach: 1.55, passes: 2, ang: 1.5, turn: 0.4 });
      Z.fill(F3, 'pastel', C.core, { w: fw * 0.6, p: 1, reach: 1.6, passes: 2, ang: 1.5, turn: 0.4 });
      Z.stroke(F1.concat(F1.slice(0, 2)), 'pastel', C.ember, { w: Math.max(0.08, h * 0.055), p: 0.85, tin: 0, tout: 0, reach: 1.3, wob: 0.1 });
      Z.dot(x, y + h * 0.02, 'kajal', C.line, { w: Math.max(0.1, h * 0.09), p: 0.9 });
      if (lamp && o.lamp) o.lamp(x, y - h * 0.4);
    };
    // five chalk petals round a heart (the folio's floret)
    K.floret = (x, y, r, petal, heart, sx) => {
      const a0 = rr(0, 1.25); sx = sx == null ? 1 : sx;
      for (let i = 0; i < 5; i++) {
        const a = a0 + i * TAU / 5 + rr(-0.08, 0.08);
        Z.dot(x + Math.cos(a) * r * 0.5 * sx, y + Math.sin(a) * r * 0.5, 'chalk', petal || C.white, { w: r * 0.6 * rr(0.92, 1.06), len: r * 0.12, ang: a, p: 0.97, reach: 1.35 });
      }
      K.dot(x, y, heart || C.haldi, r * 0.4);
    };
    // the hook ring a lantern hangs by
    K.ring = (x, y, r) => {
      const e = K.ell(x, y, r, r * 1.08), cl = e.concat(e.slice(0, 2));
      Z.stroke(cl, 'gold', 'gold', { w: r * 0.55, p: 1, tin: 0, tout: 0, wob: 0.1 });
      Z.stroke(K.ell(x, y, r * 1.32, r * 1.4, -PI * 0.05, PI * 0.95), KJ, C.line, { w: Math.max(0.07, r * 0.2), p: 0.8, tin: 0.2, tout: 0.2, wob: 0.1 });
    };
    // a tassel: a gold cap, a fan of silk laid flat, the threads parted with fine lines, a gold binding
    K.tassel = (x, y, len, spread, c, n, u) => {
      const cap = K.lathe(x, [[y, 0.26 * u], [y + 0.42 * u, 0.5 * u], [y + 0.85 * u, 0.6 * u]], 0.05);
      const y0 = y + 0.8 * u, yE = y0 + len, sw = rr(-0.12, 0.12) * u;
      const fan = [[x - 0.5 * u, y0], [x + 0.5 * u, y0], [x + 0.62 * u, y0 + len * 0.3], [x + spread + sw, yE - 0.15 * u], [x + spread * 0.35 + sw, yE + 0.12 * u], [x - spread * 0.35 + sw, yE + 0.12 * u], [x - spread + sw, yE - 0.15 * u], [x - 0.62 * u, y0 + len * 0.3]];
      const F = Z.spline(fan, true, 0.08);
      K.solid(F, c, 0.32 * u, 1.5);
      Z.withMask(F, () => {
        Z.fill(rectP(x + 0.1 * u + sw * 0.5, y0, x + spread + 1, yE + 1), 'pastel', Z.mix(c, C.lac, 0.42), { w: 0.3 * u, p: 0.85, reach: 1.3, passes: 1, ang: 1.52 });
        const nT = n || 7;
        for (let k = 1; k < nT; k++) {
          const t = k / nT * 2 - 1;
          K.hair([[x + t * 0.45 * u, y0 + 0.5 * u], [x + t * spread * 0.98 + sw, yE + 0.2 * u]], 0.06 * u + 0.02, Z.mix(c, C.line, 0.55), { p: 0.75 });
        }
      });
      K.ink(F, 0.24 * u);
      // the binding a third of the way down
      const yk = y0 + len * 0.18, bw = lerp(0.5, 0.62, 0.6) * u + 0.08 * u;
      const band = rectP(x - bw, yk - 0.22 * u, x + bw, yk + 0.22 * u);
      K.gild(band, 0, { w: 0.22 * u, edge: false, sheen: 0 });
      K.ink(band, 0.16 * u);
      K.gild(cap, 0.2, { w: 0.24 * u, edge: false });
      K.ink(cap, 0.2 * u);
    };
    return K;
  }
  /* the edge of the leaf: inside the contour by d0..d1, wandering slowly, so a thread of the ochre shows by the line */
  function brokenIn(Z, poly, d0, d1) {
    const pts = Z.resample(poly, 0.12, true), n = pts.length;
    if (n < 14) return poly;
    const nrm = i => { const a = pts[(i - 2 + n) % n], b = pts[(i + 2) % n]; const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; };
    let vote = 0;
    for (let i = 0; i < n; i += Math.max(1, n / 24 | 0)) { const m = nrm(i); vote += Z.inside([poly], pts[i][0] + m[0] * 0.15, pts[i][1] + m[1] * 0.15) ? 1 : -1; }
    const sg = vote >= 0 ? 1 : -1, p1 = Z.rr(0, TAU), p2 = Z.rr(0, TAU), w1 = Z.rr(2.6, 3.8), w2 = Z.rr(0.9, 1.3);
    return pts.map((p, i) => {
      const s = i * 0.12, t = clamp(0.5 + 0.32 * Math.sin(TAU * s / w1 + p1) + 0.2 * Math.sin(TAU * s / w2 + p2), 0, 1), d = lerp(d0, d1, t), m = nrm(i);
      return [p[0] + sg * m[0] * d, p[1] + sg * m[1] * d];
    });
  }

  /* ================================================================ THE CORDS */
  // a twisted cord: a dark thread, a red thread laid round it, and a warm light caught on its upper side near a lamp
  function cord(K, pts, w, lights) {
    const { Z } = K;
    K.line(pts, w, '#8a3420', { p: 1, tin: 0.02, tout: 0.02, wob: 0.12 });
    // the twist: fine dark ticks across the cord, the same slant all along
    const tw = Z.along(pts, w * 2.4, 0);
    for (const q of tw) Z.stroke([[q.x - Math.cos(q.ang + 1.0) * w * 0.42, q.y - Math.sin(q.ang + 1.0) * w * 0.42], [q.x + Math.cos(q.ang + 1.0) * w * 0.42, q.y + Math.sin(q.ang + 1.0) * w * 0.42]], 'kajal', '#4a160c', { w: w * 0.28, p: 0.6, tin: 0, tout: 0, wob: 0.05 });
    if (!lights) return;
    const lit = pts.map(p => {
      let k = 0;
      for (const l of lights) { const d = Math.hypot(p[0] - l[0], p[1] - l[1]); k = Math.max(k, clamp(1 - d / l[2], 0, 1)); }
      return [p[0] - w * 0.18, p[1] - w * 0.22, k * k];
    });
    let run = [];
    const flush = () => { if (run.length > 3) Z.stroke(run, 'chalk', '#f8c878', { w: w * 0.42, p: 0.9, tin: 0.2, tout: 0.2, wob: 0.1 }); run = []; };
    for (const p of lit) { if (p[2] > 0.04) run.push(p); else flush(); }
    flush();
  }
  // a chain of gold links: one seen face on, the next edge on
  function chain(K, a, b, u) {
    const { Z } = K;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(L / (0.62 * u))), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
    K.line([a, b], 0.1 * u, C.chase, { p: 0.8 });
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t);
      if (k % 2 === 0) {
        const e = [];
        for (let j = 0; j <= 16; j++) { const th = j / 16 * TAU, px = Math.cos(th) * 0.2 * u, py = Math.sin(th) * 0.36 * u; e.push([x + px * uy * -1 * -1 + py * ux, y - px * ux + py * uy]); }
        Z.stroke(e, 'gold', 'gold', { w: 0.12 * u, p: 1, tin: 0, tout: 0, wob: 0.05 });
      } else Z.stroke([[x - ux * 0.3 * u, y - uy * 0.3 * u], [x + ux * 0.3 * u, y + uy * 0.3 * u]], 'gold', 'gold', { w: 0.13 * u, p: 1, tin: 0.1, tout: 0.1, wob: 0.05 });
    }
  }

  /* ================================================================ THE KANDIL: pierced brass, its light coming out through the jali */
  function kandil(K, x, y, u) {
    const { Z, rr } = K;
    const Y = v => y + v * u;
    const lath = prof => K.lathe(x, prof.map(p => [Y(p[0]), p[1] * u]));
    const body = lath([[8.0, 3.6], [9.3, 4.9], [11.1, 5.85], [12.9, 6.0], [14.8, 5.25], [16.6, 3.7], [17.6, 2.6]]);
    // ---- the body: dark oxidised brass; the light inside warms the metal toward the middle
    K.burnish(body);
    K.solid(body, '#3a2210', 0.5 * u, 1.5);
    const bcy = Y(12.6);
    K.wash(body, '#7a4a1a', (X, Yy) => 0.75 * Math.max(0, 1 - Math.pow((X - x + 1.2 * u) / (6.4 * u), 2) - Math.pow((Yy - bcy) / (6.6 * u), 2)), 'over', 0.6);
    Z.withMask(body, () => {
      const sh = [];
      for (let v = body.y0; v <= body.y1 + 1e-6; v += 0.2) sh.push([x + body.r(v) * 0.5, v]);
      for (let v = body.y1; v >= body.y0 - 1e-6; v -= 0.2) sh.push([x + body.r(v) + 1, v]);
      Z.fill(sh, 'pastel', '#22120a', { w: 0.45 * u, p: 0.75, reach: 1.15, passes: 2, ang: 1.5, turn: 0.2 });
    });
    // ---- the jali: rows of pierced holes between bands, columns between raised ribs; the light comes through them
    const e = 0.075, A7 = [-72, -48, -24, 0, 24, 48, 72];
    const rowsDef = [[9.0, 'dot'], [10.65, 'almond'], [12.65, 'flower'], [14.65, 'almond'], [16.4, 'dot']];
    const lens = (hx, hy, w, h, ang) => {
      const ca = Math.cos(ang || 0), sa = Math.sin(ang || 0), out = [];
      for (let i = 0; i < 28; i++) { const t = i / 28 * TAU, s = Math.sin(t), px = w * Math.sign(s) * Math.pow(Math.abs(s), 1.5), py = -h * Math.cos(t); out.push([hx + px * ca - py * sa, hy + px * sa + py * ca]); }
      return out;
    };
    const lit = (p, c, w) => Z.fill(p, 'pastel', c, { w, p: 1, reach: 1.6, passes: 2, ang: 1.5, turn: 0.5 });
    const hole = (hx, hy, kind, k, hot) => {
      const c1 = Z.mix('#a8420e', '#e8782a', hot), c2 = Z.mix('#f09a34', '#ffc45a', hot), c3 = Z.mix('#ffd47a', C.core, hot);
      if (kind === 'dot') { K.dot(hx, hy, c1, 0.74 * k); K.dot(hx, hy, c2, 0.5 * k); K.dot(hx - 0.03 * u, hy - 0.04 * u, c3, 0.26 * k); return; }
      if (kind === 'almond') {
        lit(lens(hx, hy, 0.42 * k, 0.86 * u), c1, 0.12 * u);
        lit(lens(hx, hy + 0.05 * u, 0.28 * k, 0.64 * u), c2, 0.1 * u);
        lit(lens(hx - 0.02 * u, hy + 0.08 * u, 0.13 * k, 0.4 * u), c3, 0.08 * u);
        return;
      }
      for (let q = 0; q < 4; q++) {
        const a = q * PI / 2 + PI / 4, ox = Math.cos(a) * 0.4 * k, oy = Math.sin(a) * 0.4 * u;
        lit(lens(hx + ox, hy + oy, 0.2 * k, 0.36 * u, a + PI / 2), c1, 0.08 * u);
        lit(lens(hx + ox * 0.92, hy + oy * 0.92, 0.11 * k, 0.24 * u, a + PI / 2), c2, 0.07 * u);
      }
      K.dot(hx, hy, c3, 0.36 * k);
    };
    Z.withMask(body, () => {
      for (const [vy, kind] of rowsDef) {
        const yy = Y(vy), r = body.r(yy);
        for (const ad of A7) {
          const th = ad * PI / 180, cz = Math.cos(th);
          const hx = x + r * 0.93 * Math.sin(th) + rr(-0.025, 0.025) * u, hy = yy + e * r * cz + rr(-0.025, 0.025) * u;
          hole(hx, hy, kind, (0.4 + 0.6 * cz) * u, 0.45 + 0.55 * cz - 0.12 * Math.max(0, Math.sin(th)));
        }
      }
      // the ribs between the columns: a dark seam with the edge toward the light picked out
      for (const ad of [-60, -36, -12, 12, 36, 60]) {
        const th = ad * PI / 180, cz = Math.cos(th), pts = [], hl = [];
        for (let v = body.y0 + 0.1; v <= body.y1 - 0.05; v += 0.2) {
          const r = body.r(v); pts.push([x + r * Math.sin(th), v + e * r * cz]);
          hl.push([x + r * Math.sin(th) - (0.13 + 0.05 * cz) * u, v + e * r * cz]);
        }
        K.line(pts, (0.15 + 0.07 * cz) * u, '#1a0c06', { p: 0.9, tin: 0.04, tout: 0.04 });
        if (ad < 40) K.hair(hl, 0.06 * u, '#a8783a', { p: 0.65 });
      }
      // the bands round the body: two pierced with a line of pin holes, two laid in gold
      for (const vb of [9.8, 11.65, 13.7, 15.55]) {
        const yy = Y(vb), r = body.r(yy), pts = [], up = [], dn = [];
        for (let ad = -88; ad <= 88; ad += 4) { const th = ad * PI / 180; pts.push([x + r * Math.sin(th), yy + e * r * Math.cos(th)]); up.push([x + r * Math.sin(th), yy - 0.26 * u + e * r * Math.cos(th)]); dn.push([x + r * Math.sin(th), yy + 0.26 * u + e * r * Math.cos(th)]); }
        if (vb === 11.65 || vb === 13.7) { K.gline(pts, 0.26 * u, vb === 11.65); continue; }
        K.hair(up, 0.07 * u, '#9a6a30', { p: 0.7 }); K.hair(dn, 0.07 * u, '#9a6a30', { p: 0.7 });
        for (let ad = -81; ad <= 81; ad += 9) {
          const th = ad * PI / 180, cz = Math.cos(th);
          K.dot(x + r * Math.sin(th), yy + e * r * cz, Z.mix('#e07a28', '#ffd070', cz), (0.18 + 0.12 * cz) * u);
        }
      }
    });
    K.ink(body, 0.52 * u);
    // ---- the lower collar, the cone, the drop and the tassel
    const ring2 = lath([[17.45, 2.95], [17.9, 3.0], [18.35, 2.9]]);
    K.gild(ring2, 0, { w: 0.24 * u, edge: false });
    K.hair([[x - 2.7 * u, Y(17.92)], [x + 2.7 * u, Y(17.92)]], 0.1 * u, C.chase);
    K.ink(ring2, 0.3 * u);
    const cone = lath([[18.3, 2.55], [19.3, 1.85], [20.5, 0.95], [21.45, 0.42]]);
    K.gild(cone, 1.3, { w: 0.24 * u });
    Z.withMask(cone, () => { for (const t of [-0.5, 0, 0.5]) { const pts = []; for (let v = Y(18.4); v <= Y(21.3); v += 0.2) pts.push([x + cone.r(v) * t, v]); K.hair(pts, 0.09 * u, C.chase); } });
    K.ink(cone, 0.32 * u);
    K.dots([[x - 2.1 * u, Y(18.75)], [x + 2.1 * u, Y(18.75)]], 0.7 * u, C.pearl, 0.36 * u);
    const drop = K.ell(x, Y(22.2), 0.7 * u, 0.92 * u);
    K.gild(drop, 0.3, { w: 0.2 * u, edge: false });
    K.ink(drop, 0.26 * u);
    K.dot(x, Y(22.25), C.hingul, 0.5 * u); K.dot(x - 0.12 * u, Y(22.1), C.white, 0.16 * u);
    K.tassel(x, Y(23.0), 5.0 * u, 1.2 * u, C.hingul, 9, u);
    // ---- the collar under the cap: red enamel, a row of pearls, gold edges
    const cy0 = 7.2, cy1 = 8.25, cr = 3.95, bow = 0.3;
    const col = [];
    for (let ad = -90; ad <= 90; ad += 5) { const th = ad * PI / 180; col.push([x + cr * Math.sin(th) * u, Y(cy0) + bow * Math.cos(th) * u]); }
    for (let ad = 90; ad >= -90; ad -= 5) { const th = ad * PI / 180; col.push([x + cr * 0.96 * Math.sin(th) * u, Y(cy1) + bow * 1.2 * Math.cos(th) * u]); }
    K.solid(col, C.hingul, 0.3 * u, 0);
    K.dots(Array.from({ length: 37 }, (_, i) => { const th = (-80 + i * 160 / 36) * PI / 180; return [x + cr * 0.98 * Math.sin(th) * u, Y((cy0 + cy1) / 2) + bow * 1.1 * Math.cos(th) * u]; }), 0.62 * u, C.pearl, 0.34 * u);
    K.ink(col, 0.3 * u);
    // ---- the cap: a fringe of gold petals, the dome, its finial
    const pet = [];
    for (let k = 0; k < 7; k++) { const th = (-67.5 + k * 22.5) * PI / 180; pet.push({ th, z: Math.cos(th) }); }
    pet.sort((a, b) => a.z - b.z);
    for (const p of pet) {
      const px = x + 4.35 * Math.sin(p.th) * u, wd = (0.55 + 0.45 * p.z) * 0.72 * u, py0 = Y(6.05), py1 = Y(7.25) + 0.25 * p.z * u;
      const pl = Z.spline([[px - wd, py0], [px - wd * 0.92, py0 + (py1 - py0) * 0.55], [px, py1], [px + wd * 0.92, py0 + (py1 - py0) * 0.55], [px + wd, py0]], false, 0.06);
      const pp = pl.concat([[px, py0 - 0.1 * u]]);
      K.gild(pp, 1.2, { w: 0.18 * u, edge: false });
      K.dot(px, py0 + (py1 - py0) * 0.48, C.hingul, 0.34 * u * (0.6 + 0.4 * p.z));
      K.ink(pp, 0.2 * u);
    }
    const dome = lath([[2.4, 0.42], [2.85, 0.62], [3.45, 1.9], [4.35, 3.2], [5.35, 4.0], [6.2, 4.32]]);
    K.burnish(dome);
    K.gild(dome, 1.15, { w: 0.3 * u });
    Z.withMask(dome, () => {
      for (const t of [-0.72, -0.4, 0, 0.4, 0.72]) { const pts = []; for (let v = Y(3.0); v <= Y(6.1); v += 0.15) pts.push([x + dome.r(v) * t, v]); K.hair(pts, 0.1 * u, C.chase, { p: 0.75 }); }
      // the agate's strip down the lit side
      const bp = []; for (let v = Y(3.3); v <= Y(5.8); v += 0.15) bp.push([x - dome.r(v) * 0.55, v]);
      Z.stroke(bp, 'gold', C.burnish, { w: 0.55 * u, p: 0.8, tin: 0.3, tout: 0.35 });
    });
    K.dots(Array.from({ length: 25 }, (_, i) => { const th = (-74 + i * 148 / 24) * PI / 180; return [x + 4.0 * Math.sin(th) * u, Y(5.75) + 0.22 * Math.cos(th) * u]; }), 0.66 * u, C.pearl, 0.36 * u);
    K.ink(dome, 0.42 * u);
    K.line([[x, Y(0.55)], [x, Y(1.4)]], 0.2 * u, C.chase);
    const ball = K.ell(x, Y(1.85), 0.6 * u, 0.6 * u);
    K.gild(ball, 0.3, { w: 0.18 * u, edge: false });
    K.ink(ball, 0.24 * u);
    K.gdot(x - 0.2 * u, Y(1.68), 0.2 * u, true);
    K.ring(x, y, 0.5 * u);
  }

  /* ================================================================ THE STARS: folded paper, each point a lit facet and a shaded one */
  function star(K, it, cols) {
    const { Z, rr } = K, u = it.u, n = it.n, R = it.R, x = it.x, y = it.y;
    const cx = x, cy = y + 1.2 * u + R, col = C[it.col] || it.col;
    const rin = n === 8 ? 0.6 : 0.5, a0 = -PI / 2 + rr(-0.015, 0.015);
    const T = [], I = [];
    for (let k = 0; k < n; k++) {
      const a = a0 + k * TAU / n, rk = R * (1 + rr(-0.02, 0.02));
      T.push([cx + Math.cos(a) * rk, cy + Math.sin(a) * rk]);
      const b = a0 + (k + 0.5) * TAU / n; I.push([cx + Math.cos(b) * R * rin, cy + Math.sin(b) * R * rin]);
    }
    const out = []; for (let k = 0; k < n; k++) out.push(T[k], I[k]);
    // the cord to the top point, the ring
    K.line([[x, y], [T[0][0], T[0][1]]], 0.2 * u + 0.05, C.cord);
    // ---- the paper tails from the lower points, behind the star
    const lower = [];
    for (let k = 0; k < n; k++) { const a = a0 + k * TAU / n, s = Math.sin(a); if (s > 0.3) lower.push({ k, a, s }); }
    for (const lw of lower) {
      const tip = T[lw.k], bottom = Math.abs(Math.cos(lw.a)) < 0.2;
      if (bottom) continue;     // the bottom point carries the tassel
      const side = Math.cos(lw.a) > 0 ? 1 : -1;
      for (let j = 0; j < 3; j++) {
        const off = (j - 1) * 0.52 * u, len = R * (n === 8 ? 1.0 : 1.2) * [0.86, 1, 0.74][j] * rr(0.97, 1.03), hw = (n === 8 ? 0.3 : 0.24) * u;
        const sway = (0.22 + 0.1 * j) * u * side * (j === 1 ? -1 : 1), ph = rr(0, 0.4);
        const cl = [];
        for (let i = 0; i <= 28; i++) { const t = i / 28; cl.push([tip[0] + off + sway * Math.sin((t * 1.2 + ph) * PI), tip[1] - 0.5 * u + len * t]); }
        const rb = ribbon(cl, () => hw), L = rb.L, Rr = rb.R, end = cl[cl.length - 1];
        const strip = L.concat([[end[0], end[1] - hw * 1.5]], Rr.slice().reverse());
        const sc = cols[j % cols.length];
        K.solid(strip, C[sc] || sc, 0.16 * u, 1.5);
        if (n === 8) K.hair(cl.slice(2, -3), 0.06 * u, Z.mix(C[sc] || sc, C.white, 0.7), { p: 0.85 });
        K.ink(strip, 0.15 * u);
      }
    }
    // ---- the star
    K.burnish(out);
    K.solid(out, col, 0.42 * u, 1.5);
    const lt = Z.mix(col, C.cream, 0.4);
    for (let k = 0; k < n; k++) {
      const Ip = I[(k - 1 + n) % n];
      K.solid([[cx, cy], Ip, T[k]], lt, 0.32 * u, Math.atan2(T[k][1] - cy, T[k][0] - cx), { passes: 2, p: 0.95 });
    }
    // a star inside the star, in a second paper, its own facets lit and shaded
    if (n === 8 && it.col2) {
      const c2 = C[it.col2] || it.col2, k2 = 0.6, T2 = [], I2 = [];
      for (let k = 0; k < n; k++) {
        const a = a0 + k * TAU / n, b = a0 + (k + 0.5) * TAU / n;
        T2.push([cx + Math.cos(a) * R * k2, cy + Math.sin(a) * R * k2]); I2.push([cx + Math.cos(b) * R * k2 * 0.62, cy + Math.sin(b) * R * k2 * 0.62]);
      }
      const in2 = []; for (let k = 0; k < n; k++) in2.push(T2[k], I2[k]);
      K.solid(in2, c2, 0.3 * u, 1.5);
      const lt2 = Z.mix(c2, C.cream, 0.42);
      for (let k = 0; k < n; k++) K.solid([[cx, cy], I2[(k - 1 + n) % n], T2[k]], lt2, 0.24 * u, 0.4, { p: 0.95 });
      for (let k = 0; k < n; k++) K.hair([[lerp(cx, T2[k][0], 0.5), lerp(cy, T2[k][1], 0.5)], [lerp(cx, T2[k][0], 0.92), lerp(cy, T2[k][1], 0.92)]], 0.08 * u, Z.mix(c2, C.line, 0.5), { p: 0.7 });
      K.ink(in2, 0.24 * u);
    }
    // the glow in the middle: the paper is thin there and the flame shows through
    const rw = R * (n === 8 ? 0.3 : 0.34);
    const halo = K.ell(cx, cy, rw * 1.2, rw * 1.2);
    Z.fill(halo, 'pastel', Z.mix(C[it.col2] || col, '#ffd27a', 0.55), { w: 0.26 * u, p: 0.75, reach: 1.2, passes: 2, ang: 0.4, turn: 0.6 });
    // the ridges, from the middle out to each point
    for (let k = 0; k < n; k++) K.hair([[lerp(cx, T[k][0], it.col2 ? 0.64 : 0.36), lerp(cy, T[k][1], it.col2 ? 0.64 : 0.36)], [lerp(cx, T[k][0], 0.94), lerp(cy, T[k][1], 0.94)]], 0.09 * u + 0.02, Z.mix(col, C.line, 0.5), { p: 0.7 });
    // a border inside the border: white dots set along each edge
    if (n === 8) {
      for (let k = 0; k < n; k++) for (const e of [[I[(k - 1 + n) % n], T[k]], [T[k], I[k]]]) {
        const a = inset([[cx, cy], e[0], e[1]], 0)[1]; void a;
        const p0 = [lerp(e[0][0], cx, 0.12), lerp(e[0][1], cy, 0.12)], p1 = [lerp(e[1][0], cx, 0.18), lerp(e[1][1], cy, 0.18)];
        K.dots([[lerp(p0[0], p1[0], 0.12), lerp(p0[1], p1[1], 0.12)], [lerp(p0[0], p1[0], 0.82), lerp(p0[1], p1[1], 0.82)]], 0.82 * u, C.white, 0.3 * u);
      }
    } else {
      const inn = out.map(p => [lerp(p[0], cx, 0.3), lerp(p[1], cy, 0.3)]);
      K.gline(inn.concat([inn[0]]), 0.12 * u + 0.03, false);
    }
    const win = K.ell(cx, cy, rw, rw);
    K.solid(win, C.cream, 0.25 * u, 0.3);
    K.flame(cx, cy + rw * 0.55, rw * 1.05, false);
    K.gline(win.concat(win.slice(0, 2)), 0.2 * u + 0.04, it.kind === 'star');
    K.ink(win, 0.16 * u + 0.04);
    if (n === 8) K.dots(K.ell(cx, cy, rw * 1.4, rw * 1.4).concat([[cx + rw * 1.4, cy]]), rw * 1.4 * TAU / 16, C.white, 0.34 * u);
    K.ink(out, (n === 8 ? 0.5 : 0.36) * u + 0.04);
    // the tassel at the bottom point
    for (const lw of lower) if (Math.abs(Math.cos(lw.a)) < 0.2) K.tassel(T[lw.k][0], T[lw.k][1] - 0.2 * u, 3.6 * u, 0.9 * u, C.haldi, 7, u);
    K.ring(x, y, 0.45 * u);
  }

  /* ================================================================ THE PAPER LANTERN: a round of paper on bamboo ribs, a painted band */
  function paper(K, it) {
    const { Z, rr } = K, u = it.u, s = it.s, x = it.x, y = it.y, col = C[it.col], band = C[it.band];
    const W = 0.8 * s, H = s, yTop = y + 0.9 * u;
    K.line([[x, it.hy], [x, y]], 0.2, C.cord);
    const capT = K.lathe(x, [[yTop, 0.22 * W], [yTop + 0.5 * u, 0.24 * W], [yTop + 1.1 * u, 0.3 * W]], 0.05);
    const cy = yTop + 1.1 * u + H / 2 - 0.35 * u, rx = W / 2, ry = H / 2;
    const body = K.ell(x, cy, rx, ry);
    K.burnish(body);
    K.solid(body, col, 0.45 * u, 1.5);
    // the light inside: the paper paler toward the middle
    Z.fill(K.ell(x, cy + 0.02 * H, rx * 0.64, ry * 0.72), 'pastel', Z.mix(col, '#ffd27a', 0.3), { w: 0.4 * u, p: 0.78, reach: 1.1, passes: 2, ang: 1.5, turn: 0.4, streak: 0.05 });
    Z.fill(K.ell(x, cy + 0.03 * H, rx * 0.36, ry * 0.42), 'pastel', Z.mix(col, '#fff0b0', 0.55), { w: 0.34 * u, p: 0.82, reach: 1.25, passes: 2, ang: 1.5, turn: 0.4, streak: 0.05 });
    const rxAt = yy => rx * Math.sqrt(Math.max(0, 1 - ((yy - cy) / ry) * ((yy - cy) / ry)));
    const lat = (yy, e) => { const r = rxAt(yy), pts = []; for (let ad = -90; ad <= 90; ad += 5) { const th = ad * PI / 180; pts.push([x + r * Math.sin(th), yy + e * r * Math.cos(th)]); } return pts; };
    Z.withMask(body, () => {
      // the band
      const yb0 = cy - 0.13 * H, yb1 = cy + 0.13 * H, e = 0.16;
      const top = lat(yb0, e), bot = lat(yb1, e);
      const bp = top.concat(bot.slice().reverse());
      K.solid(bp, band, 0.32 * u, 0);
      // its florets, three, foreshortened toward the sides
      for (const ad of [-52, 0, 52]) {
        const th = ad * PI / 180, r = rxAt(cy), fx = x + r * 0.9 * Math.sin(th), fy = cy + e * r * Math.cos(th);
        K.floret(fx, fy, (0.72 + 0.28 * Math.cos(th)) * 1.05 * u, C.white, band === C.haldi ? C.hingul : C.haldi, 0.55 + 0.45 * Math.cos(th));
      }
      for (const ad of [-26, 26]) { const th = ad * PI / 180, r = rxAt(cy); K.dot(x + r * 0.9 * Math.sin(th), cy + e * r * Math.cos(th), C.white, 0.3 * u); }
      K.gline(top, 0.2 * u, false); K.gline(bot, 0.2 * u, false);
      // the bamboo ribs
      for (const q of [-0.74, -0.46, 0.46, 0.74]) K.hair(lat(cy + q * ry, e * 0.9), 0.1 * u + 0.02, Z.mix(col, C.line, 0.5), { p: 0.8 });
      // a row of white dots on the ribs nearest the caps
      for (const q of [-0.6, 0.6]) K.dots(lat(cy + q * ry, e * 0.9), 0.62 * u, C.white, 0.26 * u, { trim: 1 });
    });
    K.ink(body, 0.44 * u);
    K.gild(capT, 0.1, { w: 0.2 * u, edge: false });
    K.hair([[x - 0.26 * W, yTop + 0.62 * u], [x + 0.26 * W, yTop + 0.62 * u]], 0.12 * u, C.hingul, { p: 1 });
    K.ink(capT, 0.26 * u);
    const yB = cy + ry - 0.3 * u, capB = K.lathe(x, [[yB, 0.28 * W], [yB + 0.6 * u, 0.24 * W], [yB + 1.0 * u, 0.14 * W]], 0.05);
    K.gild(capB, 0.1, { w: 0.2 * u, edge: false });
    K.ink(capB, 0.26 * u);
    K.tassel(x, yB + 0.95 * u, 3.4 * u, 0.75 * u, band === C.haldi ? C.hingul : C.hingul, 7, u * 0.85);
    K.ring(x, y, 0.42 * u);
  }

  /* ================================================================ THE DEEPAM: a brass lamp of five flames hung on chains before a pillar */
  function deepam(K, it) {
    const { Z, rr } = K, u = it.u, x = it.x, yc = it.yc;
    chain(K, [x, it.y + 0.6], [x, yc], u);
    const yR = yc + 4.8 * u, rx = 3.5 * u, ry = 0.78 * u;
    // the three chains to the rim
    for (const p of [[x - rx * 0.92, yR - 0.1 * u], [x + rx * 0.92, yR - 0.1 * u]]) chain(K, [x + Math.sign(p[0] - x) * 0.45 * u, yc + 0.9 * u], p, u * 0.8);
    // the collar the chains meet in
    const col = K.lathe(x, [[yc - 0.2 * u, 0.26 * u], [yc + 0.5 * u, 0.7 * u], [yc + 1.0 * u, 0.86 * u]], 0.05);
    K.gild(col, 0.2, { w: 0.2 * u, edge: false });
    K.ink(col, 0.22 * u);
    // the back flames first, then the bowl, then the front flames
    const wick = k => { const th = PI / 2 + k * TAU / 5; return { x: x + Math.cos(th) * rx * 0.78, y: yR + Math.sin(th) * ry * 0.7, z: Math.sin(th) }; };
    const W5 = [0, 1, 2, 3, 4].map(wick).sort((a, b) => a.z - b.z);
    for (const w of W5) if (w.z < 0) K.flame(w.x, w.y, 1.6 * u * (0.86 + 0.1 * w.z), false);
    const bowl = K.lathe(x, [[yR, rx], [yR + 0.9 * u, rx * 0.93], [yR + 1.8 * u, rx * 0.66], [yR + 2.4 * u, rx * 0.26]], 0.05);
    const front = K.ell(x, yR, rx, ry, 0, PI), bp = front.concat(bowl.slice(bowl.length / 2 | 0));
    void bp;
    const bowlP = bowl.concat([]);
    K.burnish(bowlP);
    K.gild(bowlP, 0.2, { w: 0.24 * u });
    // the lotus petals chased on the bowl, a border of pearls under the rim
    Z.withMask(bowlP, () => {
      for (let k = -2; k <= 2; k++) {
        const t = k / 2.6, px = x + rx * 0.85 * t, pw = rx * 0.32 * Math.sqrt(1 - t * t) + 0.2 * u, top = yR + 0.75 * u, bot = yR + 2.2 * u;
        K.hair(Z.spline([[px - pw, top], [px - pw * 0.7, lerp(top, bot, 0.6)], [px, bot], [px + pw * 0.7, lerp(top, bot, 0.6)], [px + pw, top]], false, 0.05), 0.09 * u, C.chase, { p: 0.85 });
      }
      const bs = []; for (let v = yR + 0.3 * u; v <= yR + 1.9 * u; v += 0.1) bs.push([x - bowl.r(v) * 0.6, v]);
      Z.stroke(bs, 'gold', C.burnish, { w: 0.5 * u, p: 0.8, tin: 0.3, tout: 0.3 });
    });
    K.dots(Array.from({ length: 21 }, (_, i) => { const th = PI * (0.08 + 0.84 * i / 20); return [x + Math.cos(th) * rx * 0.93, yR + 0.5 * u + Math.sin(th) * ry * 0.6]; }), 0.55 * u, C.pearl, 0.3 * u);
    K.ink(bowlP, 0.38 * u);
    // the oil in the rim, the rim itself
    const oil = K.ell(x, yR, rx * 0.9, ry * 0.72);
    K.solid(oil, C.oil, 0.2 * u, 0);
    const rimE = K.ell(x, yR, rx, ry);
    K.gline(rimE.slice(0, rimE.length / 2 | 0), 0.24 * u, true);
    K.ink(rimE, 0.24 * u);
    for (const w of W5) if (w.z >= 0) K.flame(w.x, w.y, 1.75 * u * (0.92 + 0.08 * w.z), Math.abs(w.z - 1) < 1e-6);
    // the bud under the bowl and its tassel
    const bud = K.lathe(x, [[yR + 2.3 * u, 0.3 * u], [yR + 2.9 * u, 0.62 * u], [yR + 3.5 * u, 0.42 * u], [yR + 3.9 * u, 0.1 * u]], 0.05);
    K.gild(bud, 0.3, { w: 0.18 * u, edge: false });
    K.ink(bud, 0.22 * u);
    K.tassel(x, yR + 3.8 * u, 2.6 * u, 0.6 * u, C.hingul, 5, u * 0.7);
    // the hook it hangs from, on the pillar head
    K.ring(x, it.y, 0.5 * u);
    K.gdot(x, it.y - 0.6, 0.5, true);
  }

  /* ================================================================ THE DIYA: a painted clay lamp on the floor */
  function diya(K, d) {
    const { Z, rr } = K, u = d.u * rr(0.97, 1.03), x = d.x, y = d.y, s = d.d;
    const P = (px, py) => [x + px * s * u, y + py * u];
    const body = Z.spline([P(-1.95, -1.2), P(-1.6, -0.45), P(-0.7, 0), P(0.7, 0), P(1.6, -0.5), P(2.55, -1.42)], false, 0.05)
      .concat(Z.spline([P(2.55, -1.42), P(1.5, -1.3), P(0, -1.35), P(-1.95, -1.2)], false, 0.05).slice(1));
    K.burnish(body);
    K.solid(body, C.clay, 0.3 * u, 0.1);
    Z.withMask(body, () => {
      Z.fill(Z.spline([P(0.4, -1.6), P(1.4, -1.2), P(2.0, -0.5), P(1.2, 0.3), P(0.3, 0.3)], true, 0.05), 'pastel', C.clayD, { w: 0.3 * u, p: 0.6, reach: 1.1, passes: 1, ang: 0.2 });
      // the painted band: a haldi stripe and a row of white dots
      const st = Z.spline([P(-1.75, -0.78), P(-0.6, -0.42), P(0.8, -0.44), P(1.9, -0.92)], false, 0.05);
      K.line(st, 0.32 * u, C.haldi, { p: 1 });
      K.dots(Z.spline([P(-1.3, -0.3), P(0, -0.12), P(1.3, -0.34)], false, 0.05), 0.62 * u, C.white, 0.28 * u, { trim: 0 });
    });
    // the oil inside the rim
    const rim = Z.spline([P(-1.95, -1.2), P(-1.0, -1.62), P(0.4, -1.7), P(1.8, -1.55), P(2.55, -1.42), P(1.5, -1.3), P(0, -1.35)], true, 0.05);
    K.solid(rim, C.oil, 0.2 * u, 0);
    K.hair(Z.spline([P(-1.9, -1.22), P(0, -1.36), P(1.5, -1.31), P(2.5, -1.42)], false, 0.05), 0.12 * u, C.clayL, { p: 0.9 });
    K.ink(body.concat(Z.spline([P(-1.95, -1.2), P(-1.0, -1.62), P(0.4, -1.7), P(1.8, -1.55), P(2.55, -1.42)], false, 0.05).reverse().slice(1, -1)), 0.3 * u);
    K.flame(x + 2.3 * s * u, y - 1.52 * u, 2.3 * u, true);
  }

  /* ================================================================ THE RANGOLI: coloured powder on the floor of each arch, with its three diyas */
  function rangoli(K, ar, P) {
    const { Z } = K, rgx = ar.xc, rgy = P.yb - 5.4, Rx = 11.8, Ry = 3.1, dim = c => Z.mix(C[c] || c, '#2a120c', 0.16);
    const ringE = k => K.ell(rgx, rgy, Rx * k, Ry * k);
    K.burnish(ringE(1.02));
    K.solid(ringE(1), dim('hingul'), 0.36, 0);
    K.solid(ringE(0.8), dim('haldi'), 0.32, 0);
    // fourteen petals, red and green by turns, laid flat on the floor
    for (let k = 0; k < 14; k++) {
      const a = k * TAU / 14, px = rgx + Math.cos(a) * Rx * 0.64, py = rgy + Math.sin(a) * Ry * 0.64;
      const pe = K.ell(0, 0, 1.3, 0.5).map(p => [px + (p[0] * Math.cos(a) - p[1] * Math.sin(a)), py + (p[0] * Math.sin(a) + p[1] * Math.cos(a)) * 0.26]);
      K.solid(pe, dim(k % 2 ? 'emerald' : 'hingul'), 0.2, a);
      K.ink(pe, 0.09);
    }
    K.solid(ringE(0.42), dim('pink'), 0.26, 0);
    K.solid(ringE(0.2), dim('haldi'), 0.22, 0);
    K.ink(ringE(0.42), 0.1);
    K.dots(ringE(0.91).concat([ringE(0.91)[0]]), 1.1, Z.mix(C.white, '#2a120c', 0.1), 0.34);
    K.dots(ringE(0.5).concat([ringE(0.5)[0]]), 0.88, Z.mix(C.white, '#2a120c', 0.1), 0.28);
    K.dot(rgx, rgy, C.hingul, 0.6);
    K.ink(ringE(1), 0.16);
    for (const d of P.diyas) if (d.x > ar.a - 2 && d.x < ar.c + 2) diya(K, d);
  }

  /* ================================================================ THE FRIEZE: garland, pennants, bosses, latkans */
  function marigold(K, x, y, r, c) {
    const { Z, rr } = K;
    const a0 = rr(0, TAU), n = 9, E = [];
    for (let k = 0; k < 54; k++) { const a = k * TAU / 54, R = r * (0.86 + 0.14 * Math.abs(Math.cos((a - a0) * n / 2))); E.push([x + Math.cos(a) * R, y + Math.sin(a) * R * 0.94]); }
    const dk = Z.mix(c, '#8a2a06', 0.55), lt = Z.mix(c, '#fff2b8', 0.45);
    Z.fill(E, 'pastel', c, { w: Math.max(0.3, r * 0.42), p: 1, reach: 1.5, passes: 2, ang: a0, turn: 0.4 });
    for (let k = 0; k < n; k++) {
      const a = a0 + (k + 0.5) * TAU / n + rr(-0.05, 0.05);
      Z.stroke([[x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.38], [x + Math.cos(a) * r * 0.84, y + Math.sin(a) * r * 0.79]], 'kajal', dk, { w: Math.max(0.07, r * 0.07), p: 0.8, tin: 0.2, tout: 0.4 });
    }
    for (let k = 0; k < 5; k++) { const a = a0 + 0.3 + k * TAU / 5; Z.dot(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.28, 'chalk', lt, { w: r * 0.32, len: r * 0.12, ang: a, p: 0.92 }); }
    Z.dot(x, y, 'kajal', dk, { w: r * 0.26, p: 0.9 });
    Z.outline(E, 'kajal', '#4a1c06', { closed: true, w: Math.max(0.07, r * 0.07), p: 0.85, pull: 8, again: 0 });
  }
  function jasmine(K, x, y, r) {
    const { Z, rr } = K;
    for (let k = 0; k < 5; k++) { const a = -PI / 2 + k * TAU / 5 + rr(-0.1, 0.1); Z.dot(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, 'chalk', C.white, { w: r * 0.62, len: r * 0.14, ang: a, p: 0.98, reach: 1.4 }); }
    K.dot(x, y, '#e8e0a8', r * 0.3);
    Z.outline(K.ell(x, y, r, r * 0.95), 'kajal', Z.mix(C.line, C.white, 0.35), { closed: true, w: 0.06, p: 0.6, pull: 6, again: 0 });
  }
  function mangoLeaf(K, x, y, len, ang) {
    const { Z } = K, ca = Math.cos(ang), sa = Math.sin(ang), wd = len * 0.2;
    const P = (a, b) => [x + ca * a - sa * b, y + sa * a + ca * b];
    const lf = Z.spline([P(0, 0), P(len * 0.3, -wd), P(len * 0.75, -wd * 0.7), P(len, 0), P(len * 0.75, wd * 0.7), P(len * 0.3, wd)], true, 0.05);
    K.solid(lf, C.leaf, 0.22, ang);
    Z.withMask(lf, () => Z.fill(Z.spline([P(0, 0), P(len * 0.4, -wd), P(len, 0), P(len * 0.4, -0.05)], true, 0.05), 'pastel', C.leafL, { w: 0.22, p: 0.75, reach: 1.1, passes: 1, ang }));
    K.hair([P(0.1, 0), P(len * 0.92, 0)], 0.07, Z.mix(C.leaf, C.line, 0.5));
    K.ink(lf, 0.18);
  }
  function garland(K, x0, x1, y, sag) {
    const { Z, rr } = K;
    const cl = hang(x0, y, x1, y, sag, 0.25);
    const heads = Z.along(cl, 1.5, 0), N = heads.length;
    // leaves first: a pair of mango leaves under the rope at the quarters and the middle
    for (const f of [0.25, 0.5, 0.75]) {
      const q = heads[Math.round(f * (N - 1))];
      mangoLeaf(K, q.x - 0.3, q.y + 0.7, 3.1, PI / 2 + 0.42); mangoLeaf(K, q.x + 0.3, q.y + 0.7, 3.1, PI / 2 - 0.42);
    }
    const rope = ribbon(cl, () => 0.9);
    K.solid(rope, C.mariD, 0.4, 0);
    heads.forEach((q, i) => {
      if (i === 0 || i === N - 1) return;
      const f = i / (N - 1), d = Math.min(i, N - 1 - i);
      // counted from each end: three saffron, three gold, over and over; a jasmine knot at the middle
      if (Math.abs(f - 0.5) < 0.5 / (N - 1) + 1e-6) { jasmine(K, q.x, q.y, 1.05); return; }
      const c = Math.floor((d - 1) / 3) % 2 ? C.mariY : C.mari;
      marigold(K, q.x + rr(-0.05, 0.05), q.y + rr(-0.05, 0.05), 0.98 * rr(0.95, 1.05), c);
    });
  }
  const PENN = [['haldi', 'hingul', 'emerald', 'pink', 'pink', 'emerald', 'hingul', 'haldi'], ['pink', 'lapis', 'haldi', 'verm', 'verm', 'haldi', 'lapis', 'pink']];
  function bunting(K, x0, x1, y, sag, set) {
    const { Z, rr } = K;
    const cl = hang(x0, y, x1, y, sag, 0.2), seq = PENN[set], nP = seq.length;
    const Lc = Z.resample(cl, 0.05, false), NL = Lc.length;
    const at = f => Lc[clamp(Math.round(f * (NL - 1)), 0, NL - 1)];
    for (let j = 0; j < nP; j++) {
      const um = 0.075 + 0.85 * (j + 0.5) / nP, hw = 0.85 / nP * 0.4;
      const pa = at(um - hw), pb = at(um + hw), mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2;
      let tx = -(pb[1] - pa[1]), ty = pb[0] - pa[0]; const tl = Math.hypot(tx, ty); tx /= tl; ty /= tl; if (ty < 0) { tx = -tx; ty = -ty; }
      const dep = 5.7 * rr(0.97, 1.03), tip = [mx + tx * dep + rr(-0.15, 0.15), my + ty * dep];
      const tri = [pa, pb, tip], c = C[seq[j]];
      K.solid(tri, c, 0.4, Math.atan2(tip[1] - my, tip[0] - mx));
      // a border inside the border, and a flower near the top
      const inn = inset(tri, 0.62), light = seq[j] === 'haldi' || seq[j] === 'pink';
      K.hair(inn.concat([inn[0]]), 0.1, light ? Z.mix(c, C.lac, 0.6) : C.white, { p: 0.9, tin: 0, tout: 0 });
      K.dots([[lerp(inn[0][0], inn[2][0], 0.1), lerp(inn[0][1], inn[2][1], 0.1)], [lerp(inn[0][0], inn[2][0], 0.86), lerp(inn[0][1], inn[2][1], 0.86)]], 0.75, light ? C.lac : C.white, 0.22);
      K.dots([[lerp(inn[1][0], inn[2][0], 0.1), lerp(inn[1][1], inn[2][1], 0.1)], [lerp(inn[1][0], inn[2][0], 0.86), lerp(inn[1][1], inn[2][1], 0.86)]], 0.75, light ? C.lac : C.white, 0.22);
      const fx = lerp(mx, tip[0], 0.34), fy = lerp(my, tip[1], 0.34);
      K.floret(fx, fy, 0.95, light ? C.white : C.white, light ? C.hingul : C.haldi);
      K.ink(tri, 0.32);
    }
    cord(K, cl, 0.3, null);
  }
  // the gold boss on each pillar where the garland and the pennants are tied, and the latkan that hangs from it
  function latkan(K, x, y) {
    const { Z, rr } = K;
    // the strand
    K.line([[x, y], [x, y + 7.2]], 0.16, C.cord);
    marigold(K, x, y + 2.6, 0.95, C.mari);
    marigold(K, x, y + 4.4, 0.85, C.mariY);
    jasmine(K, x, y + 5.95, 0.72);
    const bead = K.ell(x, y + 7.2, 0.5, 0.56);
    K.gild(bead, 0.3, { w: 0.16, edge: false }); K.ink(bead, 0.18);
    K.tassel(x, y + 7.6, 3.4, 0.85, C.hingul, 7, 0.85);
    // the boss: a gold lotus of eight petals with a ruby
    for (let k = 0; k < 8; k++) {
      const a = k * TAU / 8 + PI / 8, px = x + Math.cos(a) * 0.82, py = y + Math.sin(a) * 0.82;
      const pt = K.ell(px, py, 0.62, 0.38).map(p => { const dx = p[0] - px, dy = p[1] - py; return [px + dx * Math.cos(a) - dy * Math.sin(a), py + dx * Math.sin(a) + dy * Math.cos(a)]; });
      K.gild(pt, a, { w: 0.14, edge: false, sheen: 0.4 });
      K.ink(pt, 0.13);
    }
    Z.dot(x, y, 'gold', 'gold', { w: 1.05, p: 1, reach: 1.3 });
    K.dot(x, y, C.hingul, 0.72); K.dot(x - 0.16, y - 0.16, C.white, 0.22);
    K.ink(K.ell(x, y, 0.5, 0.5), 0.14);
    if (K.o.glint) K.o.glint(x, y);
  }

  /* ================================================================ GROUND: the room behind the arches, the halos, the light */
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  // the fall of a halo: full at the middle, gone at t = 1, with no hard ring
  const fall = t => t >= 1 ? 0 : 1 - sstep(t);
    function ground(Z, o) {
    const P = plan(o), K = kit(Z, o), B = Z.__base, line = (P.pal && P.pal.line) || '#2e1416', R = prng(505);
    // every light in the hall, with a slow wobble in its rim so no halo is a ruled circle
    const lights = P.items.map(it => ({ x: it.cx, y: it.cy, R: it.halo, core: it.core, kind: it.kind, tint: C[it.tint] || it.tint || '#e8902e', p1: R() * TAU, p2: R() * TAU, u: it.u, arch: it.arch }));
    for (const d of P.diyas) lights.push({ x: d.x + 2.3 * d.d * d.u, y: d.y - 2.6 * d.u, R: 4.6 * d.u, core: [1.3 * d.u, 1.6 * d.u], kind: 'diya', tint: '#e8902e', p1: R() * TAU, p2: R() * TAU });
    // how far out from the lantern's own shape a point lies, as a share of the halo's reach (k scales the reach)
    const reach = (l, x, y, k) => {
      const a = Math.atan2(y - l.y, x - l.x), rr = l.R * k * (1 + 0.05 * Math.sin(3 * a + l.p1) + 0.03 * Math.sin(5 * a + l.p2));
      const rho = Math.hypot((x - l.x) / l.core[0], (y - l.y) / l.core[1]);
      return Math.max(0, rho - 1) * Math.sqrt(l.core[0] * l.core[1]) / rr;
    };
    for (const ar of P.arches) {
      const op = ar.poly, x0 = ar.a - 1, x1 = ar.c + 1, yD = P.yb - 15.4, yF = P.yb - 11.6;
      const near = lights.filter(l => l.x + l.R + l.core[0] > x0 && l.x - l.R - l.core[0] < x1);
      K.burnish(op);
      Z.withMask(op, () => {
        // the back wall, deep aubergine, going darker up into the head of the arch
        Z.fill(op, 'pastel', C.aub, { w: 1.4, p: 1, reach: 1.6, passes: 3, ang: 1.5, turn: 0.45, cv: 0.008, streak: 0.08 });
        K.wash(op, '#3a2440', (x, y) => 0.6 * (1 - sstep((y - ar.ya) / (ar.ys + 14 - ar.ya))), 'mul', 0.4);
        // the painted trellis on the wall: rose hairlines in diamonds, a small flower at every crossing
        const sp = 6.4, dx = sp * 0.62;
        Z.withMask(rectP(x0, ar.ya - 2, x1, yD), () => {
          const base = Math.floor((P.at[0] - 20) / sp) * sp, hgt = yD - (ar.ya - 2);
          for (let k = -20; k < 120; k++) {
            const xk = base + k * sp;
            if (xk > x1 + 60 || xk < x0 - 60) continue;
            K.hair([[xk, yD], [xk + hgt * dx / sp * 1.6, ar.ya - 2]], 0.12, '#5e2a44', { p: 0.8 });
            K.hair([[xk, yD], [xk - hgt * dx / sp * 1.6, ar.ya - 2]], 0.12, '#5e2a44', { p: 0.8 });
          }
          const slope = 1 / (dx / sp * 1.6);
          for (let k = -20; k < 120; k++) for (let m = 0; m < 30; m++) {
            const xk = base + k * sp + (m % 2) * sp * 0.5, yk = yD - m * sp * 0.5 * slope;
            if (xk < x0 - 1 || xk > x1 + 1 || yk < ar.ya - 2) continue;
            K.floret(xk, yk, 0.62, '#8a4660', '#b0707a');
          }
        });
        // the dado: a band of wine with dull gold rules and a row of dots
        Z.fill(rectP(x0, yD, x1, yF), 'pastel', C.dado, { w: 0.8, p: 1, reach: 1.5, passes: 2, ang: 0.02, turn: 0.2 });
        K.hair([[x0, yD + 0.35], [x1, yD + 0.35]], 0.14, '#a07a34', { p: 0.9, tin: 0, tout: 0 });
        K.hair([[x0, yF - 0.35], [x1, yF - 0.35]], 0.14, '#a07a34', { p: 0.9, tin: 0, tout: 0 });
        K.dots([[x0, (yD + yF) / 2], [x1, (yD + yF) / 2]], 1.6, '#d8b8a0', 0.36, {});
        // the floor
        Z.fill(rectP(x0, yF, x1, P.yb + 1), 'pastel', C.floor, { w: 1.2, p: 1, reach: 1.6, passes: 2, ang: 0.02, turn: 0.15 });
        // the halos: three rubs of pastel, each smaller and warmer, laid over the wall
        const f = (k, a) => (x, y) => { let v = 0; for (const l of near) { const t = reach(l, x, y, k); if (t < 1) v = Math.max(v, fall(t)); } return a * v; };
        K.wash(op, '#8a3042', f(1, 0.7), 'over', 0.25, 0.32);
        for (const l of near) {
          if (l.kind === 'diya') continue;
          K.wash(op, Z.mix('#e07a30', l.tint, 0.25), (x, y) => { const t = reach(l, x, y, 0.58); return t < 1 ? 0.64 * fall(t) : 0; }, 'over', 0.25, 0.32);
        }
        K.wash(op, '#ffd080', f(0.3, 0.6), 'over', 0.25, 0.3);
        // light pools on the floor under the hero and round the diyas
        const floorR = rectP(x0, yF, x1, P.yb + 1);
        K.wash(floorR, '#d88a46', (x, y) => {
          let v = fall(Math.hypot((x - ar.xc) / 22, (y - (P.yb - 5.6)) / 5.2)) * 0.5;
          for (const d of P.diyas) if (d.x > x0 - 6 && d.x < x1 + 6) v = Math.max(v, 0.55 * fall(Math.hypot((x - d.x - 1.4 * d.d) / 6.5, (y - d.y + 0.4) / 2.4)));
          return v;
        }, 'over', 0.8);
      });
      // the arch's own line again, over the edge of the new room
      B.outline(op.slice(1, -1), 'kajal', line, { closed: false, w: 0.55, p: 0.85, pull: 30 });
    }
    // warm light on the faces of the pillars, strongest by the deepam
    for (const it of P.items) if (it.kind === 'deepam') {
      const x = it.x, hw = 1.85, ym = it.cy - 1;
      const shaft = rectP(x - hw, P.yt + 10, x + hw, P.yb - 9);
      K.wash(shaft, '#ffb860', (X, Y) => 0.42 * Math.exp(-Math.pow((Y - ym) / 12, 2)) * (0.75 + 0.25 * Math.abs(X - x) / hw), 'over', 0.7);
    }
  }

  /* ================================================================ DRAW: the hanging, back to front */
  function draw(Z, o) {
    const P = plan(o), K = kit(Z, o), out = [];
    const lights = P.items.map(it => [it.cx, it.cy, it.halo * 0.9]).concat(P.diyas.map(d => [d.x + 2.3 * d.d * d.u, d.y - 2.6 * d.u, 5]));
    // ---- the lantern cords: a V in every arch, and the drops
    for (const ar of P.arches) {
      cord(K, hang(P.at[ar.i], P.yC, ar.vx, ar.vy, ar.sag, 0.2), 0.34, lights);
      cord(K, hang(ar.vx, ar.vy, P.at[ar.i + 1], P.yC, ar.sag, 0.2), 0.34, lights);
    }
    for (const it of P.items) {
      if (it.kind === 'paper' || it.kind === 'small') cord(K, [[it.x, it.hy], [it.x, it.y]], 0.26, lights);
      if (it.kind === 'kandil' || it.kind === 'star') { const ar = P.arches[it.arch]; cord(K, [[ar.vx, ar.vy], [it.x, it.y]], 0.3, lights); }
    }
    // the knot at each V
    for (const ar of P.arches) { Z.dot(ar.vx, ar.vy, 'gold', 'gold', { w: 0.7, p: 1 }); K.ink(K.ell(ar.vx, ar.vy, 0.36, 0.36), 0.12); }
    // ---- the lanterns
    const order = ['deepam', 'small', 'paper', 'star', 'kandil'];
    for (const kind of order) for (const it of P.items) {
      if (it.kind !== kind) continue;
      if (kind === 'kandil') kandil(K, it.x, it.y, it.u);
      else if (kind === 'star') star(K, it, it.col === 'pink' ? ['haldi', 'emerald', 'hingul'] : ['haldi', 'emerald', 'pink']);
      else if (kind === 'small') star(K, Object.assign({}, it, { col: 'haldi' }), it.side < 0 ? ['hingul', 'emerald', 'hingul'] : ['emerald', 'hingul', 'emerald']);
      else if (kind === 'paper') paper(K, it);
      else if (kind === 'deepam') deepam(K, it);
      out.push({ x: +it.cx.toFixed(1), y: +it.cy.toFixed(1), kind, s: +it.s.toFixed(1) });
    }
    // ---- on the floor of each arch a rangoli with its three diyas
    for (const ar of P.arches) rangoli(K, ar, P);
    for (const d of P.diyas) { out.push({ x: +(d.x + 2.3 * d.d * d.u).toFixed(1), y: +(d.y - 2.6 * d.u).toFixed(1), kind: 'diya', s: 5 }); }
    // ---- the frieze: pennants, then the garland over them, then the bosses and latkans
    for (let k = 0; k < P.n; k++) bunting(K, P.at[k], P.at[k + 1], P.yB, 8.4, k % 2);
    for (let k = 0; k < P.n; k++) garland(K, P.at[k], P.at[k + 1], P.yG, 6.2);
    for (let k = 0; k <= P.n; k++) latkan(K, k === 0 ? P.at[0] + 1.4 : k === P.n ? P.at[P.n] - 1.4 : P.at[k], P.yG);
    return out;
  }

  M.w8x['pragyan'] = { ground, draw };
})();
