(function () {
  'use strict';
  /* ==========================================================================
     THE LOOM (the AI Rule Builder stop), painted the folio way (see M.folioArt['dpay']):
     each part laid in one clean flat colour with the stick, the strokes running with
     the form; then one kajal contour, heavy on the shadow side and thinning into the
     light; then its ornament ruled and filled bead by bead; then the gold.
     A Mewar upright frame loom with a dhurrie half woven on it: rules woven out of data.
     Two lac-turned posts with lotus-bud finials and brass rings carry the warp roll at
     the top and the cloth roll below.  The warp runs down in counted colour groups,
     through the shed stick, the heddle loops and the reed, to the fell, where the
     newest picks stop half way across and the shuttle lies.  The cloth below is woven
     on a counted grid, pick by pick: a vine border with flowers, a band of leheriya,
     a band of medallions, and a new border begun.  Hanks of dyed thread hang on a peg,
     a basket of pirns and balls stands on the floor, and a parrot sits on the warp roll.
     Local frame (stage-well8k.js loomZ): origin at the foot of the loom's middle, y up is
     negative, 1 unit = 0.5 sheet units.  The light comes from the upper left.
     ======================================================================== */
  M.w8x = M.w8x || {};
  const PI = Math.PI, TAU = 2 * PI;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const KW = 1.6;      // kajal drawn this much heavier, as the stage does for its focal objects
  const INKW = 1.3;    // and the contours of the forms heavier again, to the weight of the folio's line

  /* THE MOVING PARTS.  M.w8x['rule-builder'].pose, when it is set, puts them in another pose for a drawing of the
     page's animation.  When it is not set (the painting), every value below falls back to the painted one by the same
     arithmetic, and no random number is drawn for it, so the loom comes out exactly as before.
       sx      the shuttle's middle along the fell (39 at rest)      lift  the shuttle raised (+ up)   tilt  added to its angle
       eye     the side of the shuttle the weft leaves from (-1, the left, at rest; 1 the right, thrown back from the right)
       weft    unset: from the woven edge to the eye, as painted;  'edge': the same, but only once the eye is past the
               edge;  a number: from that x on the fell (a selvedge);  false: no weft (it is beaten in)
       reed    the reed brought down toward the fell (+ down, - up)       rod    the heddle rod raised (+ up)
       wheel   the spinning wheel turned on by this angle, the crank with it       head   the parrot's head cocked (+ up)
       blink   the parrot's eye shut
       sync(name)  called after each moving part: the caller puts the random numbers back where the painted pose left
               them, so nothing drawn after a moving part comes out different */
  const pose = () => (M.w8x['rule-builder'] && M.w8x['rule-builder'].pose) || null;
  const pv = (k, d) => { const p = pose(); return p && p[k] != null ? p[k] : d; };
  const sync = name => { const p = pose(); if (p && p.sync) p.sync(name); };

  const C = {
    lime: '#f4ecdc', limeLit: '#fffaf0', hingul: '#c8382a', hingulDeep: '#8a2024', lapis: '#2a4b96', neel: '#1d2850',
    mal: '#2f7a4c', malLit: '#62a866', haldi: '#edc94b', saffron: '#e88e1e', rose: '#e2808c',
    wood: '#5c2718', woodLit: '#9a4c2e', woodDeep: '#2a100a',
    bamboo: '#d6a456', bambooLit: '#f0cc80', bambooDeep: '#946224',
    cane: '#c99a52', caneLit: '#e9c77e', caneDeep: '#7a4e24',
    bole: '#b47c22', shell: '#d4a236', burnish: '#ffe6a0',
    green: '#55a33c', greenLit: '#98cc58', greenDeep: '#2c6a2c', teal: '#2f8a86', beak: '#d0342a'
  };
  // the cloth's colours by their letters on the weaving grid
  const WC = { R: C.hingul, D: C.hingulDeep, L: C.lime, Y: C.haldi, O: C.saffron, P: C.rose, G: C.mal, B: C.lapis, N: C.neel, Z: C.bole };

  const R = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  // an ellipse sampled finely enough for a contour (the engine's own is coarse on small forms)
  const ell = (cx, cy, rx, ry, rot, a0, a1, n) => {
    rot = rot || 0; a0 = a0 || 0; a1 = a1 == null ? TAU : a1; n = n || Math.max(24, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 0.5));
    const cr = Math.cos(rot), sr = Math.sin(rot), out = [];
    for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n, x = Math.cos(t) * rx, y = Math.sin(t) * ry; out.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); }
    if (Math.abs(a1 - a0) >= TAU - 1e-6) out.pop();
    return out;
  };
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
  /* the edge of the leaf: inside the contour by d0..d1, the distance wandering slowly, so a thin broken thread
     of the ochre ground shows by the line (from the cups) */
  function brokenIn(Z, poly, d0, d1) {
    const pts = Z.resample(poly, 0.45, true), n = pts.length;
    if (n < 14) return poly;
    const nrm = i => { const a = pts[(i - 2 + n) % n], b = pts[(i + 2) % n]; const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; };
    let vote = 0;
    for (let i = 0; i < n; i += Math.max(1, n / 24 | 0)) { const m = nrm(i); vote += Z.inside([poly], pts[i][0] + m[0] * 0.5, pts[i][1] + m[1] * 0.5) ? 1 : -1; }
    const sg = vote >= 0 ? 1 : -1, p1 = Z.rr(0, TAU), p2 = Z.rr(0, TAU), w1 = Z.rr(2.6, 3.8), w2 = Z.rr(0.9, 1.3);
    return pts.map((p, i) => {
      const s = i * 0.45, t = clamp(0.5 + 0.32 * Math.sin(TAU * s / w1 + p1) + 0.2 * Math.sin(TAU * s / w2 + p2), 0, 1), d = lerp(d0, d1, t), m = nrm(i);
      return [p[0] + sg * m[0] * d, p[1] + sg * m[1] * d];
    });
  }

  function kit(Z) {
    const INK = Z.mix('kajal', 'neel', 0.12), KJ = Z.tool('kajal', { wmin: 0.3 });
    const K = { INK, KJ, SH: Z.mix('#4a2a40', C.neel, 0.3), SHW: Z.mix(C.woodDeep, '#1a0c10', 0.4) };
    K.solid = (p, c, o) => Z.fill(p, 'pastel', c, Object.assign({ w: 2.2, p: 1, reach: 1.6, passes: 3, ang: 1.5, turn: 0.4, streak: 0.18, cv: 0.012 }, o));
    // the contour in two goes: one even unbroken line all round, then a second that swells where the form turns
    // from the light (right and below) and thins away to nothing where it turns into it
    K.ink = (poly, w, o) => {
      o = o || {};
      w = (w || 0.6) * KW * INKW;
      const P0 = Z.resample(poly, 0.7, true);
      let cx = 0, cy = 0; for (const p of P0) { cx += p[0]; cy += p[1]; } cx /= P0.length; cy /= P0.length;
      const n = P0.length, sw = P0.map((p, i) => {
        const a = P0[(i - 2 + n) % n], b = P0[(i + 2) % n];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
        return clamp((nx * 0.78 + ny * 0.62 + 0.15) / 0.95, 0, 1);
      });
      const ring = o.open ? P0 : P0.concat(P0.slice(0, 3)), swr = o.open ? sw : sw.concat(sw.slice(0, 3));
      Z.stroke(ring.map(p => [p[0], p[1]]), KJ, INK, { w: w * 0.6, p: 1, tin: 0, tout: 0, wob: 0.22 });
      Z.stroke(ring.map((p, i) => [p[0], p[1], 0.42 + 0.58 * swr[i]]), KJ, INK, { w, p: 1, tin: 0, tout: 0, wob: 0.22 });
    };
    K.line = (p, w, o) => Z.stroke(p, KJ, INK, Object.assign({ p: 0.9, wob: 0.35 }, o, { w: (w || 0.5) * KW * 1.15 }));
    K.hair = (p, w, o) => Z.stroke(p, KJ, Z.mix(INK, C.lime, 0.16), Object.assign({ p: 0.75, tin: 0.06, tout: 0.08, wob: 0.3 }, o, { w: (w || 0.26) * KW }));
    K.chalk = (p, c, w, o) => Z.stroke(p, 'chalk', c, Object.assign({ w: w || 1, p: 0.9, reach: 1.4, streak: 0 }, o));
    K.dot = (x, y, c, w, o) => Z.dot(x, y, 'chalk', c, Object.assign({ w: w || 1.2, p: 0.95, reach: 1.4 }, o));
    // a ruled row of dots along a path, laid one by one: each a hair off in place and size, never a stamp
    K.dots = (path, step, c, w, o) => {
      o = o || {};
      for (const q of Z.along(path, step, 0)) {
        if (o.skip && o.skip(q)) continue;
        K.dot(q.x + Z.rr(-0.07, 0.07) * step, q.y + Z.rr(-0.05, 0.05) * step, c, w * Z.rr(0.88, 1.1), { p: Z.rr(0.86, 1) });
      }
    };
    // burnish the ground under a surface before it is painted: the sheet's broad crumple pressed flat, only the fine tooth left
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
    // gold leaf over an ochre bole, stopped short of the contour at a broken edge, shell gold rubbed over it
    K.gild = (poly, ang, o) => {
      o = o || {};
      K.solid(poly, C.bole, { w: 1.2, ang: ang || 0.4 });
      const lp = brokenIn(Z, poly, o.d0 != null ? o.d0 : 0.2, o.d1 != null ? o.d1 : 0.55);
      Z.fill(lp, 'gold', 'gold', { w: 1.1, p: 1, reach: 1.4, passes: 2, ang: (ang || 0.4) + 0.3, turn: 0.25 });
      Z.fill(lp, 'pastel', C.shell, { w: 1.4, p: o.sheen || 0.55, reach: 0.95, passes: 1, ang: ang || 0.4, cv: 0.01 });
    };
    K.goldDot = (x, y, w) => Z.dot(x, y, 'gold', 'gold', { w: (w || 1.4) * Z.rr(0.92, 1.06), p: 1 });
    // gold leaf laid as a line: burnished, its edge a little broken where the leaf did not take
    K.leafLine = (o, pts, w) => {
      const r = Z.along(pts, Math.max(1.2, w * 2), 0).map(q => [q.x, q.y]);
      let i = 0;
      while (i < r.length - 1) {
        const n = Math.max(2, Math.round(r.length * Z.rr(0.22, 0.4))), seg = r.slice(i, Math.min(r.length, i + n + 1));
        if (seg.length > 1) { if (i === 0) o.leaf(seg, w); else Z.stroke(seg, 'gold', 'gold', { w: w * Z.rr(0.9, 1.05), p: 1, tin: 0.04, tout: 0.08 }); }
        i += n + (Z.chance(0.5) ? 1 : 0);
      }
    };
    // a flower of five petals round a heart, the way the folio borders have them
    K.floret = (x, y, r, petal, heart) => {
      const a0 = Z.rr(0, 1.25);
      for (let i = 0; i < 5; i++) {
        const a = a0 + i * 2 * PI / 5 + Z.rr(-0.08, 0.08);
        Z.dot(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, 'chalk', petal || C.limeLit, { w: r * 0.62 * Z.rr(0.92, 1.06), len: r * 0.14, ang: a, p: 0.97 });
      }
      K.dot(x, y, heart || C.haldi, r * 0.42);
    };
    // a ruled border just inside a rectangle: a kajal hairline, then a row of fine dots inside it
    K.rule = (x0, y0, x1, y1, d, dotC, step, dw) => {
      const r = [[x0 + d, y0 - d], [x1 - d, y0 - d], [x1 - d, y1 + d], [x0 + d, y1 + d]];
      K.hair(r.concat([r[0]]), 0.22);
      if (dotC) { const e = d + 1.2; K.dots([[x0 + e, y0 - e], [x1 - e, y0 - e], [x1 - e, y1 + e], [x0 + e, y1 + e], [x0 + e, y0 - e]], step || 2.2, dotC, dw || 0.7); }
    };
    return K;
  }

  /* ------------------------------------------------------------------ a lac-turned form
     prof: knots [y, half width] from the foot up; the polygon, the part between two heights, and the
     modelling of a round: the shade down its right, deepest at the edge, the light in a strip left of the axis */
  const TURN = {
    poly(cx, prof) { return prof.map(([y, h]) => [cx - h, y]).concat(prof.slice().reverse().map(([y, h]) => [cx + h, y])); },
    hAt(prof, y) {
      for (let i = 1; i < prof.length; i++) { const a = prof[i - 1], b = prof[i]; if ((y <= a[0] && y >= b[0]) && a[0] !== b[0]) return lerp(a[1], b[1], (a[0] - y) / (a[0] - b[0])); }
      return prof[prof.length - 1][1];
    },
    part(cx, prof, ya, yb) {     // ya the lower edge (larger y), yb the upper
      const inn = prof.filter(([y]) => y < ya && y > yb), lo = [ya, TURN.hAt(prof, ya - 1e-6)], hi = [yb, TURN.hAt(prof, yb + 1e-6)];
      return TURN.poly(cx, [lo].concat(inn, [hi]));
    },
    band(cx, prof, f0, f1, d) {  // a strip running up the round between f0 and f1 of the half width (-1 left .. 1 right)
      d = d || 0;
      return prof.map(([y, h]) => [cx + f0 * h, y]).concat(prof.slice().reverse().map(([y, h]) => [cx + f1 * h + d, y]));
    }
  };
  function bulb(y0, y1, h0, hm, h1, n) {
    const out = [];
    for (let i = 1; i < n; i++) { const t = i / n, base = lerp(h0, h1, t); out.push([lerp(y0, y1, t), base + (hm - (h0 + h1) / 2) * Math.pow(Math.sin(PI * t), 0.7)]); }
    return out;
  }

  // the post, from its foot to the neck under the finial
  const PROF = [].concat(
    [[0, 11], [-4, 11], [-4, 8.4]],
    bulb(-4, -13, 8.4, 10.3, 7, 12),
    [[-13, 7], [-13, 8.2], [-15.6, 8.2], [-15.6, 6.5], [-36, 6.5], [-36, 9.4], [-63, 9.4], [-63, 6.8]],
    bulb(-63, -85, 6.8, 9.3, 6.2, 14),
    [[-85, 6.2], [-85, 7.6], [-87.8, 7.6], [-87.8, 6], [-160, 6.3], [-226, 5.8], [-226, 7.4], [-228.8, 7.4], [-228.8, 6.4], [-230, 6.4],
      [-230, 9.4], [-256, 9.4], [-256, 7.6], [-258.8, 7.6], [-258.8, 6.2]],
    bulb(-258.8, -271, 6.2, 8.7, 3.6, 14),
    [[-271, 3.6], [-273.6, 3.6]]
  );
  const POSTX = 114;

  /* ------------------------------------------------------------------ the weaving: a grid of picks.
     76 ends across (one cell to each warp thread), 58 picks woven from the cloth roll up to the fell. */
  const NC = 76, NR = 58, PH = 1.6, CY0 = -60, CW = 96, NT = 76;
  const FELL = CY0 - NR * PH;                     // -152.8
  const rowY = r => CY0 - (r + 0.5) * PH;
  const halfW = r => CW - 1.1 * clamp(r / (NR - 1), 0, 1);   // the cloth draws in a little toward the fell
  const colX = (c, r) => -halfW(r) + (c + 0.5) * (2 * halfW(r) / NC);
  const LAST = 37;                                // the newest pick reaches this end, where the shuttle stopped
  // the warp plan: half of it, mirrored about the middle
  const PLAN = [['R', 6], ['L', 2], ['B', 6], ['Y', 2], ['R', 6], ['L', 2], ['G', 4], ['Y', 2], ['P', 2], ['N', 6]];
  const WARP = (() => { const h = []; for (const [k, n] of PLAN) for (let i = 0; i < n; i++) h.push(k); return h.concat(h.slice().reverse()); })();

  function cell(c, r) {
    const u = c + 0.5;
    const dotRow = (on, off, k) => (c % 3 === (k || 1)) ? on : off;
    // the vine border: a green stepped vine rising and falling, a flower in each bay, saffron edges
    const vine = (j, ph) => {
      if (j === 0 || j === 12) return 'O';
      const v = t => 6 + 4 * Math.sin(TAU * (t - ph) / 19);
      const a = Math.round(v(u)), b = Math.round(v(u - 1));
      if ((j >= Math.min(a, b) && j <= Math.max(a, b)) || Math.abs(j - v(u)) < 0.75) return 'G';
      for (let k = -1; k <= 4; k++) {
        for (const [off, fj] of [[19 / 4, 3.6], [3 * 19 / 4, 8.4]]) {
          const fc = ph + off + 19 * k, dx = (u - fc) * 2.53, dy = (j - fj) * 1.6;
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) continue;
          if (dx * dx + dy * dy < 1.6 * 1.6) return 'Y';
          if ((Math.abs(dx) < 1.3 && Math.abs(dy) < 4.1) || (Math.abs(dy) < 0.9 && Math.abs(dx) < 3.9)) return 'L';
          if (Math.abs(dx) < 3 && Math.abs(dy) < 2.5) return 'P';
        }
        // a leaf off the vine where it crosses the middle, on the rising side above and the falling side below
        for (const [off, sgn] of [[0, 1], [19 / 2, -1]]) {
          const lc = ph + off + 19 * k + 1.2 * sgn, lj = 6 + 2.4 * sgn;
          if (Math.abs(u - lc) < 0.6 && Math.abs(j - lj) < 0.6) return 'G';
        }
      }
      return 'R';
    };
    if (r === 0) return 'N';
    if (r === 1) return 'Z';
    if (r === 2) return dotRow('L', 'N');
    if (r === 3) return 'R';
    if (r <= 16) return vine(r - 4, 2);
    if (r === 17) return 'Z';
    if (r === 18) return dotRow('L', 'N', 2);
    if (r === 19) return 'N';
    if (r <= 31) {                                   // leheriya: diagonal waves, four colours between white
      const j = r - 20, v = u + j * 1.2 + 1.3 * Math.sin(TAU * (u - j * 0.9) / 16);
      return ['Y', 'Y', 'L', 'P', 'P', 'L', 'G', 'G', 'L', 'O', 'O', 'L'][((Math.floor(v) % 12) + 12) % 12];
    }
    if (r === 32) return 'N';
    if (r === 33) return dotRow('L', 'N');
    if (r === 34) return 'Z';
    if (r <= 47) {                                   // medallions on indigo, a little flower between
      const j = r - 35, dy = (j - 6) * 1.6;
      if (j === 0 || j === 12) return dotRow('L', 'N', 2);
      for (let k = 0; k < 4; k++) {
        const dx = (u - (9.5 + 19 * k)) * 2.53, m = Math.abs(dx) + Math.abs(dy) * 1.1;
        if (m <= 1.5) return 'Y';
        if (m <= 4.6) return 'R';
        if (m <= 6.3) return 'L';
        if (m <= 8.6) return 'O';
      }
      for (let k = 0; k < 5; k++) {
        const dx = (u - 19 * k) * 2.53;
        if (Math.abs(dx) > 5) continue;
        if (dx * dx + dy * dy < 1.3 * 1.3) return 'Y';
        if ((Math.abs(dx) < 1.3 && Math.abs(dy) < 3.4) || (Math.abs(dy) < 0.9 && Math.abs(dx) < 3.6)) return 'P';
      }
      return 'N';
    }
    if (r === 48) return 'N';
    if (r === 49) return 'Z';
    return vine(r - 50, 11);                         // the new border, begun: only its lower half is woven yet
  }

  /* ------------------------------------------------------------------ the parts */
  function post(Z, K, o, sg) {
    const cx = sg * POSTX, poly = TURN.poly(cx, PROF), part = (a, b) => TURN.part(cx, PROF, a, b);
    K.burnish(poly);
    K.solid(poly, C.wood, { w: 1.6 });
    // lac bands, laid on the turned collars the way the turner holds the sticks of lac to the spinning wood
    const bands = [
      [-4, -13, C.hingul],
      [-63, -65.4, C.haldi], [-65.4, -71.6, C.hingul], [-71.6, -76.4, C.mal], [-76.4, -82.6, C.hingul], [-82.6, -85, C.haldi],
      [-145, -146.6, C.haldi], [-146.6, -153.4, C.hingul], [-153.4, -155, C.haldi],
      [-258.8, -261.4, C.haldi], [-261.4, -267, C.hingul], [-267, -271, C.mal]
    ];
    for (const [a, b, c] of bands) K.solid(part(a, b), c, { w: 1.1, ang: 0.05 });
    // the brass rings
    for (const [a, b] of [[-13, -15.6], [-85, -87.8], [-226, -228.8], [-256, -258.8], [-271, -273.6]]) K.gild(part(a, b), 0.05, { d0: 0.1, d1: 0.3 });
    // the round: shade down the right, the light in a strip left of the axis
    Z.withMask(poly, () => {
      Z.fill(TURN.band(cx, PROF, 0.22, 1, 1), 'shade', K.SHW, { w: 2.2, p: 0.36, passes: 1, ang: 1.5 });
      Z.fill(TURN.band(cx, PROF, 0.66, 1, 1), 'shade', K.SHW, { w: 1.8, p: 0.4, passes: 1, ang: 1.5 });
      // the light: an even burnished veil rubbed in, no broken chalk
      Z.fill(TURN.band(cx, PROF, -0.64, -0.42), 'pastel', '#fff1d8', { w: 1.2, p: 0.26, reach: 1.6, passes: 2, ang: 1.5, streak: 0, cv: 0.005 });
      Z.fill(TURN.band(cx, PROF, -0.57, -0.49), 'pastel', '#fff6e4', { w: 0.9, p: 0.3, reach: 1.6, passes: 2, ang: 1.5, streak: 0, cv: 0.005 });
    });
    // the joints: a square block where each roll is pegged, a carved panel on its face, a flower round the brass peg
    for (const [y0, y1] of [[-36, -63], [-230, -256]]) {
      const pn = R(cx - 6.6, y0 - 2.6, cx + 6.6, y1 + 2.6);
      K.solid(pn, C.hingulDeep, { w: 1, ang: 0.3 });
      Z.withMask(pn, () => Z.fill(R(cx + 2.5, y1, cx + 7, y0), 'shade', K.SHW, { w: 1.2, p: 0.35, passes: 1, ang: 1.5 }));
      K.rule(cx - 6.6, y0 - 2.6, cx + 6.6, y1 + 2.6, 0.9, C.haldi, 1.7, 0.6);
      const my = (y0 + y1) / 2;
      K.floret(cx, my, 5.2, C.limeLit, C.haldi);
      K.goldDot(cx, my, 1.7);
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.dot(cx + dx * 4.1, my + dy * 8.4, C.lime, 0.75);
      K.hair(pn.concat([pn[0]]), 0.3);
    }
    // the collars' ornament: a row of white dots round the widest band, kajal rings at every step of the turning
    for (const [y, c] of [[-74, C.limeLit], [-150, C.limeLit], [-264.2, C.limeLit], [-8.6, C.haldi]]) {
      const h = TURN.hAt(PROF, y) * 0.78;
      K.dots([[cx - h, y], [cx + h, y + 0.1]], 1.55, c, 0.62);
    }
    for (const y of [-4, -13, -15.6, -36, -63, -65.4, -71.6, -76.4, -82.6, -85, -87.8, -145, -146.6, -153.4, -155, -226, -228.8, -230, -256, -258.8, -261.4, -267, -271]) {
      const h = TURN.hAt(PROF, y + (y === -4 || y === -36 || y === -230 ? -0.01 : 0.01));
      K.hair([[cx - h, y], [cx, y + 0.35], [cx + h, y]], 0.24, { p: 0.8 });
    }
    K.ink(poly, 0.62);
    // the finial: a lotus calyx of brass and a bud of gold leaf
    const cal = [[cx - 3.6, -273.4], [cx - 6.4, -277.6], [cx - 4.2, -276.6], [cx - 3.2, -278.2], [cx - 1.6, -276.8], [cx, -278.6], [cx + 1.6, -276.8], [cx + 3.2, -278.2], [cx + 4.2, -276.6], [cx + 6.4, -277.6], [cx + 3.6, -273.4]];
    const bud = Z.spline([[cx - 4.6, -277.4], [cx - 5.4, -280.4], [cx - 3.4, -284.6], [cx, -287.4], [cx + 3.4, -284.6], [cx + 5.4, -280.4], [cx + 4.6, -277.4]], true, 0.3);
    K.gild(bud, 1.2, { d0: 0.15, d1: 0.4 });
    Z.withMask(bud, () => { Z.fill(R(cx + 1, -288, cx + 6, -276), 'shade', Z.mix(C.bole, '#3a1a08', 0.5), { w: 1, p: 0.4, passes: 1, ang: 1.5 }); });
    Z.stroke([[cx - 2.4, -278.2], [cx - 2.6, -281.4], [cx - 1.2, -284.6]], 'gold', C.burnish, { w: 0.8, p: 0.8, tin: 0.3, tout: 0.4 });
    K.hair([[cx + 0.2, -277.8], [cx + 0.4, -283.6], [cx, -286.6]], 0.2, { p: 0.6 });
    K.ink(bud, 0.42);
    K.gild(cal, 0.2, { d0: 0.12, d1: 0.3 });
    Z.withMask(cal, () => Z.fill(R(cx + 1.5, -279, cx + 7, -273), 'shade', Z.mix(C.bole, '#3a1a08', 0.5), { w: 1, p: 0.4, passes: 1 }));
    for (const x of [-3.2, 0, 3.2]) K.hair([[cx + x * 0.7, -273.8], [cx + x, -277.6]], 0.2, { p: 0.6 });
    K.ink(cal, 0.4);
    o.glint(cx - 2, -282);
  }

  // a horizontal round (a roll or a rod): lit along its top, the shade gathering under it
  function modelH(Z, K, poly, x0, x1, y0, y1, k, lit) {
    k = k == null ? 1 : k;
    const h = y1 - y0;
    Z.withMask(poly, () => {
      Z.fill(R(x0 - 1, y0 + h * 0.55, x1 + 1, y1 + 1), 'shade', K.SHW, { w: 1.8, p: 0.34 * k, passes: 1, ang: 0 });
      Z.fill(R(x0 - 1, y0 + h * 0.8, x1 + 1, y1 + 1), 'shade', K.SHW, { w: 1.4, p: 0.38 * k, passes: 1, ang: 0 });
      if (lit) Z.stroke([[x0 + 0.6, y0 + h * 0.24], [(x0 + x1) / 2, y0 + h * 0.24 + Z.rr(-0.05, 0.05)], [x1 - 0.6, y0 + h * 0.24]], 'chalk', lit, { w: Math.max(0.5, h * 0.15), p: 0.6, tin: 0.04, tout: 0.04, streak: 0, wob: 0.2 });
    });
  }
  // the end of a roll between the cloth or warp and the post: lac-turned, a brass ferrule by the work
  function rollEnd(Z, K, sg, y0, y1, xIn) {
    const xa = sg * xIn, xb = sg * 108.5, poly = R(Math.min(xa, xb), y0, Math.max(xa, xb), y1);
    K.solid(poly, C.wood, { w: 1, ang: 1.5 });
    const fer = R(Math.min(xa, xa + sg * 2.4), y0 - 0.6, Math.max(xa, xa + sg * 2.4), y1 + 0.6);
    const band = R(Math.min(xa + sg * 4.2, xa + sg * 7.2), y0, Math.max(xa + sg * 4.2, xa + sg * 7.2), y1);
    K.solid(band, C.hingul, { w: 0.8, ang: 1.5 });
    modelH(Z, K, poly, Math.min(xa, xb), Math.max(xa, xb), y0, y1, 1, C.woodLit);
    K.gild(fer, 1.5, { d0: 0.1, d1: 0.25 });
    modelH(Z, K, fer, Math.min(xa, xa + sg * 2.4), Math.max(xa, xa + sg * 2.4), y0 - 0.6, y1 + 0.6, 0.8);
    K.hair([[xa + sg * 4.2, y0], [xa + sg * 4.2, y1]], 0.2); K.hair([[xa + sg * 7.2, y0], [xa + sg * 7.2, y1]], 0.2);
    K.dots([[xa + sg * 5.7, y0 + 1.4], [xa + sg * 5.7, y1 - 1.4]], 1.7, C.limeLit, 0.55);
    K.ink(poly, 0.45); K.ink(fer, 0.32);
  }

  function warpX(i) { return -CW + (i + 0.5) * (2 * CW / NT); }

  // the warp roll at the top: the warp wound on it in its colour groups
  function warpRoll(Z, K, o) {
    const y0 = -252, y1 = -234, wr = R(-CW - 0.5, y0, CW + 0.5, y1);
    K.burnish(wr);
    K.solid(wr, C.lime, { w: 1.2, ang: 1.5 });
    const sp = 2 * CW / NT;
    for (let i = 0; i < NT; i++) {
      const x = warpX(i);
      Z.stroke([[x, y0 - 0.5], [x + Z.rr(-0.1, 0.1), y1 + 0.5]], 'pastel', WC[WARP[i]], { w: sp * 1.18, p: 1, reach: 1.6, tin: 0, tout: 0, streak: 0, pv: 0.05, wob: 0.15 });
    }
    // the threads lie side by side on the roll: a fine dark parting between each, the groups ruled more firmly
    for (let i = 1; i < NT; i++) {
      const x = -CW + i * sp, edge = WARP[i] !== WARP[i - 1];
      K.hair([[x, y0 + 0.4], [x, y1 - 0.4]], edge ? 0.2 : 0.11, { p: edge ? 0.7 : 0.4, tin: 0, tout: 0 });
    }
    for (let i = 0; i < NT; i++) { const x = warpX(i); Z.stroke([[x, y0 + 2.2], [x, y0 + 5.4]], 'pastel', Z.mix(WC[WARP[i]], '#fff6e4', 0.32), { w: sp * 1.02, p: 0.9, reach: 1.4, tin: 0.2, tout: 0.3, streak: 0, pv: 0.05, wob: 0.1 }); }
    modelH(Z, K, wr, -CW, CW, y0, y1, 1.2);
    // the cords that tie the warp's end rod to the roll, one to each group
    for (let i = 0; i < NT; i += 2) { const x = warpX(i) + sp / 2; K.hair([[x - 0.7, y1 - 2.4], [x, y1 - 0.6], [x + 0.7, y1 - 2.4]], 0.14, { p: 0.5 }); }
    K.ink(wr, 0.55);
    for (const sg of [-1, 1]) rollEnd(Z, K, sg, y0 + 1.2, y1 - 1.2, CW + 0.5);
    K.leafLine(o, [[-CW + 1, y0 + 0.6], [CW - 1, y0 + 0.6]], 0.8);
  }

  // one warp thread: a dark line first, then the coloured thread laid down its middle
  function thread(Z, K, pts, c, w) {
    w = w || 1.36;
    Z.stroke(pts, K.KJ, K.INK, { w: (w + 0.44) / 1.6, p: 0.95, tin: 0, tout: 0, wob: 0.12, pv: 0.08 });
    Z.stroke(pts, 'chalk', c, { w, p: 1, reach: 1.5, tin: 0, tout: 0, wob: 0.12, streak: 0, pv: 0.05 });
  }

  function warp(Z, K, o) {
    const sp = 2 * CW / NT, TH = [];
    for (let i = 0; i < NT; i++) {
      const x = warpX(i) + Z.rr(-0.1, 0.1), lean = Z.rr(-0.14, 0.14);
      TH.push({ x, lean, c: WC[WARP[i]] });
      thread(Z, K, [[x, -234.4], [x + lean * 0.5, -194], [x + lean, FELL + 0.4]], WC[WARP[i]]);
    }
    const xAt = (t, y) => t.x + t.lean * (y - -234.4) / (FELL - -234.4);
    // the shed stick: a lath of split bamboo, every other end passing in front of it
    const sy0 = -224, sy1 = -217.4, st = R(-CW - 7, sy0, CW + 7, sy1);
    K.burnish(st);
    K.solid(st, C.bamboo, { w: 1, ang: 0 });
    Z.withMask(st, () => {
      Z.fill(R(-CW - 8, sy1 - 2.2, CW + 8, sy1 + 1), 'shade', Z.mix(C.bambooDeep, '#3a1a08', 0.3), { w: 1.2, p: 0.38, passes: 1, ang: 0 });
      Z.stroke([[-CW - 6, sy0 + 1.6], [CW + 6, sy0 + 1.6]], 'chalk', C.bambooLit, { w: 1.2, p: 0.6 });
    });
    for (const nx of [-62, 4, 70]) { K.hair([[nx, sy0 + 0.3], [nx + 0.3, sy1 - 0.3]], 0.22); K.hair([[nx + 1.2, sy0 + 0.3], [nx + 1.4, sy1 - 0.3]], 0.16, { p: 0.5 }); }
    K.ink(st, 0.4);
    for (let i = 0; i < NT; i += 2) { const t = TH[i]; thread(Z, K, [[xAt(t, sy0 - 1.4), sy0 - 1.4], [xAt(t, sy1 + 1.4), sy1 + 1.4]], t.c); }
    // the cords that hold the stick to the posts
    for (const sg of [-1, 1]) {
      const xa = sg * (CW + 5.5), xb = sg * 107.6, cy = (sy0 + sy1) / 2;
      for (let k = 0; k < 4; k++) { const dx = sg * k * 0.55; K.chalk([[xa + dx, cy - 2.6], [xa + dx + sg * 0.5, cy + 2.6]], C.lime, 0.5, { p: 1 }); }
      K.chalk([[xa + sg * 2, cy - 0.6], [xb, cy - 1.2]], C.lime, 0.55, { p: 1 }); K.hair([[xa + sg * 2, cy + 0.1], [xb, cy - 0.5]], 0.15, { p: 0.5 });
    }
    // the heddle rod, lac-turned in diagonal stripes, a string loop round every other end below it
    const lift = pv('rod', 0), hy0 = -201.2 - lift, hy1 = -196 - lift, rod = R(-CW - 9, hy0, CW + 9, hy1);
    for (let i = 1; i < NT; i += 2) {
      const t = TH[i], x = xAt(t, -189), dl = Z.rr(-0.5, 0.5), a = Z.rr(-0.25, 0.25);
      const U = [[x - 0.95 + a, hy1 - 0.4], [x - 0.95, -190.2 + dl], [x - 0.6, -188.9 + dl], [x, -188.4 + dl], [x + 0.6, -188.9 + dl], [x + 0.95, -190.2 + dl], [x + 0.95 + a, hy1 - 0.4]];
      Z.stroke(U, K.KJ, K.INK, { w: 0.62 / 1.6 + 0.2, p: 0.9, tin: 0, tout: 0, wob: 0.1 });
      Z.stroke(U, 'chalk', C.limeLit, { w: 0.42, p: 1, reach: 1.4, tin: 0, tout: 0, wob: 0.1, streak: 0 });
    }
    K.burnish(rod);
    K.solid(rod, C.hingul, { w: 0.8, ang: 0 });
    Z.withMask(rod, () => {
      for (let x = -CW - 12, k = 0; x < CW + 10; x += 3.3, k++) {
        const c = [C.haldi, C.hingul, C.mal, C.hingul][k % 4];
        if (c === C.hingul) continue;
        Z.fill([[x, hy1 + 0.5], [x + 1.5, hy1 + 0.5], [x + 1.5 + 6, hy0 - 0.5], [x + 6, hy0 - 0.5]], 'pastel', c, { w: 0.7, p: 1, reach: 1.5, passes: 2, ang: -0.7 });
      }
    });
    modelH(Z, K, rod, -CW - 9, CW + 9, hy0, hy1, 1, '#f39a7a');
    K.ink(rod, 0.4);
    for (const sg of [-1, 1]) {
      const cap = R(Math.min(sg * (CW + 9), sg * (CW + 11.4)), hy0 - 0.4, Math.max(sg * (CW + 9), sg * (CW + 11.4)), hy1 + 0.4);
      K.gild(cap, 1.5, { d0: 0.08, d1: 0.2 }); K.ink(cap, 0.3);
      const cy = (hy0 + hy1) / 2;
      K.chalk([[sg * (CW + 11.4), cy], [sg * 107.6, cy - 0.4]], C.lime, 0.55, { p: 1 }); K.hair([[sg * (CW + 11.4), cy + 0.6], [sg * 107.6, cy + 0.2]], 0.15, { p: 0.5 });
    }
    sync('heddle');
    // the reed: two bars, the dents of split cane between them, one between each pair of ends, bound with cord
    const drop = pv('reed', 0), ry0 = -174 + drop, ry1 = -155.4 + drop, ym = -164 + drop, bt = R(-CW - 4, ry0, CW + 4, ry0 + 4.6), bb = R(-CW - 4, ry1 - 4.4, CW + 4, ry1);
    for (let i = 0; i <= NT; i++) {
      const x = (i === 0 ? xAt(TH[0], ym) - sp / 2 : i === NT ? xAt(TH[NT - 1], ym) + sp / 2 : (xAt(TH[i - 1], ym) + xAt(TH[i], ym)) / 2) + Z.rr(-0.06, 0.06);
      Z.stroke([[x, ry0 + 4], [x, ry1 - 4]], 'chalk', C.bambooLit, { w: 0.55, p: 1, tin: 0, tout: 0, streak: 0, wob: 0.08 });
      K.hair([[x + 0.34, ry0 + 4], [x + 0.34, ry1 - 4]], 0.12, { p: 0.65, tin: 0, tout: 0 });
    }
    for (const b of [bt, bb]) {
      K.burnish(b);
      K.solid(b, C.wood, { w: 0.9, ang: 0 });
      const yb0 = b[0][1], yb1 = b[2][1];
      Z.withMask(b, () => Z.fill(R(-CW - 5, (yb0 + yb1) / 2 - 0.6, CW + 5, (yb0 + yb1) / 2 + 0.6), 'pastel', C.hingul, { w: 0.8, p: 1, passes: 2, ang: 0 }));
      modelH(Z, K, b, -CW - 4, CW + 4, yb0, yb1, 1, C.woodLit);
      K.dots([[-CW - 2.6, (yb0 + yb1) / 2], [CW + 2.6, (yb0 + yb1) / 2]], sp, C.haldi, 0.55);
      K.ink(b, 0.4);
    }
    for (const sg of [-1, 1]) {
      const sd = R(Math.min(sg * (CW + 1.2), sg * (CW + 4.6)), ry0, Math.max(sg * (CW + 1.2), sg * (CW + 4.6)), ry1);
      K.solid(sd, C.wood, { w: 0.8, ang: 1.5 }); K.ink(sd, 0.38);
      for (const y of [ry0 + 0.6, ry1 - 0.6]) { const cap = R(Math.min(sg * (CW + 0.6), sg * (CW + 5.2)), y - 1.2, Math.max(sg * (CW + 0.6), sg * (CW + 5.2)), y + 1.2); K.gild(cap, 0.3, { d0: 0.06, d1: 0.16 }); K.ink(cap, 0.26); }
    }
    o.glint(-CW - 2, ry0 + 0.6);
    sync('reed');
    return TH;
  }

  // the cloth: every pick laid as runs of colour across the counted ends, from the roll up to the fell
  function cloth(Z, K, o) {
    const topY = r => CY0 - (r + 1) * PH;
    const outline = [[-halfW(0), CY0], [halfW(0), CY0], [halfW(NR - 2), topY(NR - 2)], [colX(LAST, NR - 1) + 1.26, topY(NR - 2)], [colX(LAST, NR - 1) + 1.26, topY(NR - 1)], [-halfW(NR - 1), topY(NR - 1)]];
    K.burnish(outline);
    K.solid(outline, C.hingul, { w: 1.6, ang: 0 });
    const zari = [];
    for (let r = 0; r < NR; r++) {
      const y = rowY(r), cw = 2 * halfW(r) / NC, cEnd = r === NR - 1 ? LAST : NC - 1;
      let c0 = 0, k0 = cell(0, r);
      for (let c = 1; c <= cEnd + 1; c++) {
        const k = c <= cEnd ? cell(c, r) : null;
        if (k === k0) continue;
        const x0 = colX(c0, r) - cw * 0.5, x1 = colX(c - 1, r) + cw * 0.5, ext = 0.32;
        const xa = c0 === 0 ? x0 + 0.25 : x0 - ext, xb = c - 1 === NC - 1 ? x1 - 0.25 : x1 + ext;
        const yj = Z.rr(-0.05, 0.05);
        Z.stroke([[xa, y + yj], [(xa + xb) / 2, y + Z.rr(-0.06, 0.06)], [xb, y - yj]], 'pastel', WC[k0], { w: PH * 1.34, p: 1, reach: 1.6, tin: 0, tout: 0, streak: 0, pv: 0.04, wob: 0.12, cv: 0.01, aspect: 0.8 });
        if (k0 === 'Z') zari.push([xa, xb, y]);
        c0 = c; k0 = k;
      }
    }
    // the gold thread: leaf laid over the ochre picks, broken where it dipped under the warp
    for (const [xa, xb, y] of zari) K.leafLine(o, [[xa + 0.4, y], [xb - 0.4, y]], 1.0);
    // the faint ribs of the picks, beaten close
    Z.withMask(outline, () => {
      for (let r = 1; r < NR; r++) {
        const y = CY0 - r * PH, hw = halfW(r);
        Z.stroke([[-hw, y + Z.rr(-0.05, 0.05)], [r === NR - 1 ? colX(LAST, r) + 1.2 : hw, y + Z.rr(-0.05, 0.05)]], 'shade', K.SH, { w: 0.42, p: 0.16, tin: 0, tout: 0, wob: 0.1 });
      }
      // the cloth turns over the roll at its foot, and is shaded a little toward the right
      Z.fill(R(-CW - 1, CY0 - 3.6, CW + 1, CY0 + 1), 'shade', K.SH, { w: 1.4, p: 0.3, passes: 1, ang: 0 });
      Z.fill(R(CW - 14, FELL - 2, CW + 1, CY0 + 1), 'shade', K.SH, { w: 1.6, p: 0.2, passes: 1, ang: 1.5 });
    });
    // the selvedges: the weft turning round the edge end, a small loop every other pick
    for (const sg of [-1, 1]) for (let r = 0; r < NR - (sg > 0 ? 1 : 0); r += 2) {
      const x = sg * halfW(r), y = rowY(r);
      K.hair([[x, y - 0.7], [x + sg * 0.75, y], [x, y + 0.7]], 0.18, { p: 0.75, tin: 0, tout: 0 });
    }
    K.ink(outline, 0.55);
    // the newest pick: the weft laid in the open shed, from the woven edge on to the shuttle
    const xe = colX(LAST, NR - 1) + 1.2, ye = rowY(NR - 1);
    return { xe, ye };
  }

  // the cloth roll: the cloth already woven, wound round and round it
  function clothRoll(Z, K, o) {
    const y0 = -61.4, y1 = -37.6, cr = R(-CW - 1.5, y0, CW + 1.5, y1);
    K.burnish(cr);
    K.solid(cr, C.hingul, { w: 1.4, ang: 0 });
    const layers = [[0, 1.2, 'N'], [1.2, 2.0, 'Z'], [2.0, 3.6, 'R'], [3.6, 4.6, 'O'], [4.6, 6.8, 'R'], [6.8, 7.6, 'Z'], [7.6, 9.4, 'N'], [9.4, 10.6, 'Y'], [10.6, 12.8, 'P'], [12.8, 13.8, 'L'],
      [13.8, 16.2, 'G'], [16.2, 17.0, 'L'], [17.0, 19.4, 'O'], [19.4, 20.4, 'Z'], [20.4, 22.4, 'N'], [22.4, 24, 'R']];
    Z.withMask(cr, () => {
      for (const [a, b, k] of layers) {
        const ya = y0 + a, yb = y0 + b, bow = 0.5;
        Z.fill([[-CW - 2, ya], [0, ya + bow], [CW + 2, ya], [CW + 2, yb], [0, yb + bow], [-CW - 2, yb]], 'pastel', WC[k], { w: 0.9, p: 1, reach: 1.6, passes: 2, ang: 0, turn: 0.1 });
      }
      for (const [a, b, k] of layers) if (k === 'N' || k === 'R') { const y = y0 + (a + b) / 2; K.dots([[-CW + 1, y], [CW - 1, y + 0.1]], 3.2, C.limeLit, 0.5, { skip: () => Z.chance(0.0) }); }
    });
    for (const [a, b, k] of layers) if (k === 'Z') K.leafLine(o, [[-CW + 0.5, y0 + (a + b) / 2], [CW - 0.5, y0 + (a + b) / 2 + 0.2]], 0.7);
    modelH(Z, K, cr, -CW - 1.5, CW + 1.5, y0, y1, 1.4);
    for (const [a] of layers.slice(1)) K.hair([[-CW - 1, y0 + a], [0, y0 + a + 0.5], [CW + 1, y0 + a]], 0.12, { p: 0.4 });
    K.ink(cr, 0.58);
    for (const sg of [-1, 1]) rollEnd(Z, K, sg, y0 + 2, y1 - 2, CW + 1.5);
    o.glint(-40, y0 + 1.6);
  }

  function stretcher(Z, K) {
    const y0 = -24.5, y1 = -16.5, st = R(-108, y0, 108, y1);
    K.burnish(st);
    K.solid(st, C.wood, { w: 1, ang: 0 });
    const band = R(-100, y0 + 2, 100, y1 - 2);
    K.solid(band, C.hingul, { w: 0.8, ang: 0 });
    K.dots([[-98, (y0 + y1) / 2], [98, (y0 + y1) / 2]], 2.4, C.limeLit, 0.6);
    for (const x of [-60, -20, 20, 60]) { K.floret(x, (y0 + y1) / 2, 3.2, C.haldi, C.limeLit); }
    modelH(Z, K, st, -108, 108, y0, y1, 1, C.woodLit);
    K.hair([[-100, y0 + 2], [100, y0 + 2]], 0.18); K.hair([[-100, y1 - 2], [100, y1 - 2]], 0.18);
    K.ink(st, 0.5);
  }

  // the carved brackets in the corners where the rolls meet the posts, a flower in each
  function brackets(Z, K) {
    for (const sg of [-1, 1]) for (const [ya, h] of [[-234, 9.6], [-61.4, -10.4]]) {
      const xi = sg * 107.6, xo = sg * (CW + 1.2), shape = [[xo, ya], [xi, ya], [xi, ya + h]];
      // the free edge hollowed in a quarter round, the way a toda is cut
      for (let i = 1; i < 16; i++) { const a = i / 16 * PI / 2; shape.push([xo + (xi - xo) * Math.cos(a), ya + h - h * Math.sin(a)]); }
      K.solid(shape, C.wood, { w: 0.9, ang: 0.8 });
      const inner = shape.map(p => [lerp(p[0], xi - sg * 2.2, 0.34), lerp(p[1], ya + h * 0.2, 0.34)]);
      K.solid(inner, C.hingulDeep, { w: 0.7, ang: 0.8 });
      K.floret(xi - sg * 3, ya + h * 0.28, 2.6, C.limeLit, C.haldi);
      K.ink(shape, 0.36);
    }
  }

  // the boat shuttle at rest on the fell, its pirn of red weft in the slot, its points shod in brass
  function shuttle(Z, K, o, xe, ye) {
    const cx = pv('sx', 39), cy = FELL - 1.1 - pv('lift', 0), hl = 30, an = -0.03 + pv('tilt', 0), ca = Math.cos(an), sa = Math.sin(an);
    const P = (u, v) => [cx + u * ca - v * sa, cy + u * sa + v * ca];
    const top = [], bot = [];
    for (let i = 0; i <= 40; i++) {
      const t = -1 + 2 * i / 40, h = 4.3 * Math.pow(Math.max(0, 1 - t * t), 0.62) + 0.15;
      top.push(P(t * hl, -h)); bot.push(P(t * hl, h * 0.92));
    }
    const body = top.concat(bot.reverse());
    // the weft runs from the woven edge across the open shed into the shuttle's eye
    const eye = P(pv('eye', -1) * hl * 0.42, 0.8), wf = pv('weft', null);
    if (wf === null || (wf === 'edge' && eye[0] > xe + 0.6)) {
      Z.stroke([[xe - 0.6, ye], [lerp(xe, eye[0], 0.5), ye + 0.5], eye], 'chalk', C.hingul, { w: 0.85, p: 1, tin: 0, tout: 0, streak: 0, wob: 0.15 });
      K.hair([[xe - 0.6, ye + 0.42], [lerp(xe, eye[0], 0.5), ye + 0.92], [eye[0], eye[1] + 0.4]], 0.14, { p: 0.6 });
    } else if (typeof wf === 'number') {
      // thrown back: from the selvedge the last pick turned round, along the fell to the eye
      Z.stroke([[wf, ye], [lerp(wf, eye[0], 0.5), ye + 0.5], eye], 'chalk', C.hingul, { w: 0.85, p: 1, tin: 0, tout: 0, streak: 0, wob: 0.15 });
      K.hair([[wf, ye + 0.42], [lerp(wf, eye[0], 0.5), ye + 0.92], [eye[0], eye[1] + 0.4]], 0.14, { p: 0.6 });
    }
    K.burnish(body);
    K.solid(body, '#b8743a', { w: 0.9, ang: an });
    Z.withMask(body, () => {
      Z.fill(body.map(p => [p[0], p[1] + 2.4]), 'shade', K.SHW, { w: 1, p: 0.4, passes: 1, ang: 0 });
      Z.stroke(Array.from({ length: 12 }, (_, i) => P(-hl * 0.7 + i * hl * 0.13, -2.1)), 'chalk', '#ecb070', { w: 1.1, p: 0.8, tin: 0.2, tout: 0.2 });
    });
    for (const sg of [-1, 1]) {
      const tip = []; for (let i = 0; i <= 12; i++) { const t = sg * (0.8 + 0.2 * i / 12); tip.push(P(t * hl, -(4.3 * Math.pow(Math.max(0, 1 - t * t), 0.62) + 0.15))); }
      for (let i = 12; i >= 0; i--) { const t = sg * (0.8 + 0.2 * i / 12); tip.push(P(t * hl, (4.3 * Math.pow(Math.max(0, 1 - t * t), 0.62) + 0.15) * 0.92)); }
      K.gild(tip, 0.2, { d0: 0.08, d1: 0.18 });
      K.hair([P(sg * 0.8 * hl, -2.2), P(sg * 0.8 * hl, 2)], 0.2);
    }
    const slot = ell(cx, cy - 0.1, hl * 0.42, 1.8, an);
    K.solid(slot, '#2a1410', { w: 0.6, ang: an });
    const pirn = []; for (let i = 0; i <= 20; i++) { const t = -1 + 2 * i / 20; pirn.push(P(t * hl * 0.32, -1.15 * Math.pow(1 - t * t * 0.6, 0.5))); }
    for (let i = 20; i >= 0; i--) { const t = -1 + 2 * i / 20; pirn.push(P(t * hl * 0.32, 1.15 * Math.pow(1 - t * t * 0.6, 0.5))); }
    K.solid(pirn, C.hingul, { w: 0.5, ang: an });
    Z.withMask(pirn, () => { for (let k = -9; k <= 9; k++) K.hair([P(k * 0.92 - 0.7, -1.4), P(k * 0.92 + 0.7, 1.4)], 0.1, { p: 0.45 }); Z.fill(pirn.map(p => [p[0], p[1] + 1.1]), 'shade', K.SH, { w: 0.6, p: 0.3, passes: 1 }); });
    K.chalk([P(-hl * 0.3, -0.7), P(hl * 0.3, -0.7)], '#e8705a', 0.4, { p: 0.7 });
    for (const sg of [-1, 1]) K.dot(...P(sg * hl * 0.37, 0), C.bambooLit, 0.9);
    K.ink(slot, 0.24);
    K.ink(body, 0.46);
    Z.stroke([P(-hl * 0.6, -2.4), P(-hl * 0.2, -3.2), P(hl * 0.2, -3.2)], 'gold', C.burnish, { w: 0.5, p: 0.6, tin: 0.3, tout: 0.4 });
    o.glint(...P(hl * 0.9, -0.6));
  }

  // skeins of dyed thread, twisted into ropes and hung over a turned peg on the right post
  function hanks(Z, K, o) {
    const py = -213, peg = R(119.6, py - 1.9, 151, py + 1.9);
    K.burnish(peg);
    K.solid(peg, C.wood, { w: 0.8, ang: 0 });
    Z.withMask(peg, () => Z.fill(R(140, py - 3, 152, py + 3), 'pastel', C.hingul, { w: 0.7, p: 1, passes: 2, ang: 0 }));
    modelH(Z, K, peg, 119.6, 151, py - 1.9, py + 1.9, 1, C.woodLit);
    K.ink(peg, 0.36);
    const knob = ell(152.8, py, 2.4, 2.8, 0, 0, TAU, 40);
    K.gild(knob, 0.6, { d0: 0.08, d1: 0.2 }); K.ink(knob, 0.32);
    o.glint(152.2, py - 1);
    const H = [
      { x: 146.6, len: 70, c: C.mal, lt: '#7cc07a', dk: '#163e28', sway: 1.2 },
      { x: 139.8, len: 84, c: C.haldi, lt: '#fff2b0', dk: '#a8781a', sway: 1.6 },
      { x: 133.0, len: 96, c: C.hingul, lt: '#f08a68', dk: '#6e1418', sway: -0.7 },
      { x: 126.2, len: 78, c: C.lapis, lt: '#7a9ae0', dk: '#101a44', sway: 0.9 }
    ];
    for (const h of H) {
      const top = py - 2.8, bot = py + h.len, n = 48, cl = [];
      for (let i = 0; i <= n; i++) { const t = i / n; cl.push([h.x + h.sway * Math.sin(t * PI * 0.9), lerp(top, bot, t)]); }
      // the rope full down its length, pinched a little under the peg and at the foot where the end is tucked through
      const wf = t => t < 0.06 ? 3.7 : t < 0.11 ? lerp(3.7, 3.2, (t - 0.06) / 0.05) : t < 0.9 ? 3.2 + 0.35 * Math.sin(PI * (t - 0.11) / 0.79) : lerp(3.2, 2.2, (t - 0.9) / 0.1);
      const rb = ribbon(cl, wf);
      const fx = cl[n][0], fy = bot, foot = [];
      for (let i = 1; i < 12; i++) { const a = PI * i / 12; foot.push([fx + Math.cos(a) * 2.2, fy + Math.sin(a) * 1.8]); }
      const sk = rb.L.concat(foot.slice().reverse(), rb.R.slice().reverse());
      K.burnish(sk);
      K.solid(sk, h.c, { w: 0.9, ang: 1.5 });
      // the twist: each turn of the rope a lit crest leaning down to the right, a dark crease under it
      Z.withMask(sk, () => {
        let y = top + 4.4 + Z.rr(0, 0.6);
        while (y < bot - 2) {
          const t = (y - top) / (bot - top), x = h.x + h.sway * Math.sin(t * PI * 0.9), w = wf(t) + 0.4, d = Z.rr(3.6, 4.0);
          Z.stroke([[x - w, y - 0.6], [x - w * 0.2, y + 0.9], [x + w, y + 2.6]], 'chalk', h.lt, { w: 1.05, p: 0.85, tin: 0.25, tout: 0.4, streak: 0 });
          K.hair([[x - w, y + 1.1], [x, y + 2.5], [x + w, y + 4.1]], 0.15, { p: 0.6, tin: 0.2, tout: 0.3 });
          y += d;
        }
        const sh = cl.map(([x, yy], i) => [x + wf(i / n) * 0.25, yy]).concat(cl.slice().reverse().map(([x, yy], i) => [x + wf(1 - i / n) + 1, yy]));
        Z.fill(sh, 'shade', h.dk, { w: 1.1, p: 0.3, passes: 1, ang: 1.5 });
      });
      // the end loop at the foot
      K.chalk([[fx - 1.4, fy + 0.4], [fx - 2.4, fy + 3.2], [fx - 0.6, fy + 4.6], [fx + 0.6, fy + 3]], h.c, 0.9, { p: 1 });
      K.hair([[fx - 1.4, fy + 0.4], [fx - 2.4, fy + 3.2], [fx - 0.6, fy + 4.6], [fx + 0.6, fy + 3]], 0.16, { p: 0.6 });
      K.ink(sk, 0.4);
    }
  }

  // a spinning wheel standing on the floor by the loom: the thread before the warp
  function charkha(Z, K, o) {
    const wx = 165, wy = -42, wr = 29;
    // the base: a low plank with a turned foot at each end
    const base = [[136, -6], [203.5, -6], [205.5, -3.6], [205.5, 0], [134, 0], [134, -3.6]];
    K.burnish(base); K.solid(base, C.wood, { w: 0.9, ang: 0 });
    K.solid(R(140, -4.4, 200, -1.8), C.hingul, { w: 0.6, ang: 0 });
    K.dots([[142, -3.1], [198, -3.1]], 2.4, C.limeLit, 0.5);
    modelH(Z, K, base, 134, 205.5, -6, 0, 1, C.woodLit);
    K.ink(base, 0.4);
    // the far upright, mostly hidden
    const far = R(wx + 2.4, wy - 1, wx + 5.4, -6);
    K.solid(far, C.woodDeep, { w: 0.6, ang: 1.5 }); K.ink(far, 0.3);
    // the back spokes, darker, between the front ones
    const turn = pv('wheel', 0), sp0 = 0.26 + turn;
    for (let k = 0; k < 6; k++) {
      const a = sp0 + PI / 6 + k * PI / 3;
      const sk = ribbon([[wx + Math.cos(a) * 3, wy + Math.sin(a) * 3], [wx + Math.cos(a) * (wr - 1.6), wy + Math.sin(a) * (wr - 1.6)]], t => lerp(1.1, 0.7, t));
      K.solid(sk, C.woodDeep, { w: 0.5, ang: a }); K.hair(sk.concat([sk[0]]), 0.14, { p: 0.6 });
    }
    // the rim: string laced from the tip of a front spoke to the tip of a back one, round and round
    const lace = [];
    for (let i = 0; i <= 48; i++) { const a = sp0 + i * PI / 24, r = i % 2 ? wr - 1.8 : wr; lace.push([wx + Math.cos(a) * r, wy + Math.sin(a) * r]); }
    Z.stroke(lace, K.KJ, K.INK, { w: 0.62 / 1.6 + 0.12, p: 0.9, tin: 0, tout: 0, wob: 0.1 });
    Z.stroke(lace, 'chalk', '#b07a3a', { w: 0.5, p: 1, tin: 0, tout: 0, wob: 0.1, streak: 0 });
    const band = ell(wx, wy, wr + 0.5, wr + 0.5, 0, 0, TAU, 120);
    Z.stroke(band.concat([band[0], band[1]]), K.KJ, K.INK, { w: 0.6 / 1.6 + 0.1, p: 0.9, tin: 0, tout: 0, wob: 0.1 });
    Z.stroke(band.concat([band[0], band[1]]), 'chalk', C.hingul, { w: 0.55, p: 1, tin: 0, tout: 0, wob: 0.1, streak: 0 });
    // the front spokes, turned, a lac collar near the hub and a knob at the rim
    for (let k = 0; k < 6; k++) {
      const a = sp0 + k * PI / 3, ca = Math.cos(a), sa = Math.sin(a);
      const sk = ribbon([[wx + ca * 3.4, wy + sa * 3.4], [wx + ca * (wr - 0.4), wy + sa * (wr - 0.4)]], t => t < 0.3 ? lerp(1.5, 1.0, t / 0.3) : 1.0 - 0.2 * t);
      K.solid(sk, C.woodLit, { w: 0.5, ang: a });
      Z.withMask(sk, () => { Z.stroke([[wx + ca * 6, wy + sa * 6], [wx + ca * 9, wy + sa * 9]], 'chalk', C.hingul, { w: 3, p: 1, tin: 0, tout: 0 }); Z.stroke([[wx + ca * 9, wy + sa * 9], [wx + ca * 10.2, wy + sa * 10.2]], 'chalk', C.haldi, { w: 3, p: 1, tin: 0, tout: 0 }); });
      K.ink(sk, 0.26);
      K.dot(wx + ca * wr, wy + sa * wr, C.woodLit, 1.6);
      K.line([[wx + ca * wr - 0.6, wy + sa * wr - 0.6], [wx + ca * wr + 0.6, wy + sa * wr + 0.6]], 0.14, { p: 0.5 });
    }
    // the hub, lac-turned, a brass boss on the axle
    const hub = ell(wx, wy, 5, 5, 0, 0, TAU, 48);
    K.solid(hub, C.hingul, { w: 0.6 });
    Z.withMask(hub, () => { Z.stroke(ell(wx, wy, 3.1, 3.1, 0, 0, TAU, 40).concat([[wx + 3.1, wy]]), 'chalk', C.haldi, { w: 0.9, p: 1, tin: 0, tout: 0 }); Z.fill(ell(wx + 2.4, wy + 2.4, 4.4, 4.4), 'shade', K.SHW, { w: 0.6, p: 0.36, passes: 1 }); });
    K.ink(hub, 0.32);
    // the near upright, in front of the wheel, the axle through its head
    const up = [[wx - 2.2, -6], [wx + 2.2, -6], [wx + 1.8, -14], [wx + 2.6, -16], [wx + 1.7, -18], [wx + 1.7, wy + 4], [wx + 2.8, wy + 1.4], [wx + 2.8, wy - 2.4], [wx - 2.8, wy - 2.4], [wx - 2.8, wy + 1.4], [wx - 1.7, wy + 4], [wx - 1.7, -18], [wx - 2.6, -16], [wx - 1.8, -14]];
    K.burnish(up); K.solid(up, C.wood, { w: 0.6, ang: 1.5 });
    Z.withMask(up, () => { Z.fill(R(wx + 0.6, wy - 3, wx + 3, -5), 'shade', K.SHW, { w: 0.6, p: 0.38, passes: 1, ang: 1.5 }); K.chalk([[wx - 1, wy + 3], [wx - 1, -7]], C.woodLit, 0.6, { p: 0.5 }); });
    K.gild(R(wx - 2.4, -15.6, wx + 2.4, -14.4), 0.2, { d0: 0.05, d1: 0.12 });
    K.ink(up, 0.36);
    const boss = ell(wx, wy - 0.4, 1.7, 1.7, 0, 0, TAU, 24);
    K.gild(boss, 0.4, { d0: 0.05, d1: 0.12 }); K.ink(boss, 0.24);
    // the crank: an arm off the axle and a turned grip
    // (turned with the wheel about the axle, at the boss)
    const crank = (dx, dy) => turn ? [wx + dx * Math.cos(turn) - (dy + 0.4) * Math.sin(turn), wy - 0.4 + dx * Math.sin(turn) + (dy + 0.4) * Math.cos(turn)] : [wx + dx, wy + dy];
    const arm = ribbon([[wx, wy - 0.4], crank(-6.6, 6.2)], () => 0.8);
    K.solid(arm, C.woodLit, { w: 0.4 }); K.ink(arm, 0.24);
    const grip = ribbon([crank(-6.6, 6.2), crank(-9.8, 9.6)], t => 1.1 + 0.25 * Math.sin(PI * t));
    K.solid(grip, C.hingul, { w: 0.4 }); K.ink(grip, 0.26);
    o.glint(wx - 0.6, wy - 1);
    // the spindle stand at the far end: a short post, the spindle through it, a whorl, a cop of spun cotton
    const ss = [[199.4, -6], [204.6, -6], [204.2, -18], [205, -20.5], [205, -25], [199, -25], [199, -20.5], [199.8, -18]];
    K.burnish(ss); K.solid(ss, C.wood, { w: 0.6, ang: 1.5 });
    K.solid(R(199.6, -12.4, 204.4, -9.6), C.hingul, { w: 0.4, ang: 0 });
    Z.withMask(ss, () => Z.fill(R(202.6, -26, 206, -5), 'shade', K.SHW, { w: 0.6, p: 0.36, passes: 1, ang: 1.5 }));
    K.ink(ss, 0.34);
    // the drive band from the rim round the whorl
    const wh = [197.6, -22.6];
    for (const [ax, ay] of [[wx + 3.4, wy - wr - 0.2], [wx + 4.6, wy + wr]]) {
      Z.stroke([[ax, ay], [wh[0], wh[1] + (ay < wy ? -1.2 : 1.2)]], 'chalk', C.hingul, { w: 0.5, p: 1, tin: 0, tout: 0, streak: 0 });
      K.hair([[ax, ay + 0.35], [wh[0], wh[1] + (ay < wy ? -0.85 : 1.55)]], 0.1, { p: 0.5 });
    }
    const whorl = ell(wh[0], wh[1], 1.1, 1.6, 0, 0, TAU, 24);
    K.solid(whorl, C.haldi, { w: 0.3 }); K.ink(whorl, 0.2);
    Z.stroke([[185.4, -22.8], [206, -22.4]], 'chalk', '#8a8f98', { w: 0.42, p: 1, tin: 0, tout: 0.2 });
    K.hair([[185.4, -22.4], [206, -22]], 0.1, { p: 0.5 });
    const cop = Z.spline([[186.8, -22.6], [188.4, -25], [191.6, -25.4], [193.4, -23.6], [193.4, -21.6], [191.6, -19.8], [188.4, -20.2]], true, 0.2);
    K.solid(cop, C.limeLit, { w: 0.4 });
    Z.withMask(cop, () => { for (let x = 187.4; x < 193.4; x += 0.8) K.hair([[x, -25.6], [x + 0.5, -19.6]], 0.08, { p: 0.35 }); Z.fill(R(186, -22.4, 194, -19), 'shade', K.SH, { w: 0.5, p: 0.3, passes: 1 }); });
    K.ink(cop, 0.26);
  }

  // the little bundles of weft hanging at the fell, one for each colour still in the work
  function bobbins(Z, K) {
    for (const [x, c, len] of [[-74, C.mal, 6.5], [-44, C.limeLit, 9], [58, C.haldi, 7.5], [84, C.rose, 5.6]]) {
      const yb = FELL + 0.6 + len, cx = x + 0.4;
      Z.fill(ell(cx + 1.2, yb + 4, 2.2, 3.8), 'shade', K.SH, { w: 0.6, p: 0.3, passes: 1 });
      K.chalk([[x, FELL + 0.6], [x + 0.2, FELL + len * 0.5], [cx, yb]], c, 0.5, { p: 1, tin: 0, tout: 0 });
      K.hair([[x + 0.3, FELL + 0.6], [x + 0.5, FELL + len * 0.5], [cx + 0.3, yb]], 0.1, { p: 0.5 });
      const b = Z.spline([[cx, yb - 0.4], [cx + 1.6, yb + 1.6], [cx + 1.4, yb + 4.4], [cx, yb + 6.4], [cx - 1.4, yb + 4.4], [cx - 1.6, yb + 1.6]], true, 0.2);
      K.solid(b, c, { w: 0.4, ang: 1.5 });
      Z.withMask(b, () => { for (let k = 0; k < 4; k++) K.hair([[cx - 1.8, yb + 0.8 + k * 1.4], [cx + 1.8, yb + 1.8 + k * 1.4]], 0.09, { p: 0.4 }); Z.fill(R(cx + 0.3, yb - 1, cx + 2, yb + 7), 'shade', K.SHW, { w: 0.5, p: 0.3, passes: 1 }); });
      K.ink(b, 0.26);
    }
  }

  // the basket of cane on the floor: pirns and balls of the same threads, a skein over its rim
  function basket(Z, K, o) {
    const bx = 150, ry = -19.5, rx = 22.5, rv = 4.6, by = -1.4, bxr = 18;
    const inside = ell(bx, ry, rx - 1.6, rv - 1, 0, PI, TAU, 60).concat(ell(bx, ry, rx - 1.6, rv - 1, 0, 0, PI, 60).slice(1, -1));
    K.solid(inside, C.caneDeep, { w: 1, ang: 0 });
    Z.withMask(inside, () => Z.fill(ell(bx + 4, ry + 1, rx, rv, 0), 'shade', K.SHW, { w: 1, p: 0.4, passes: 1 }));
    // the balls and the pirns standing up out of it
    const ball = (x, y, r, c, dark) => {
      const b = ell(x, y, r, r, 0, 0, TAU, 60);
      K.burnish(b); K.solid(b, c, { w: 0.9, ang: 0.5 });
      Z.withMask(b, () => {
        for (let k = 0; k < 6; k++) { const a = -0.9 + k * 0.32; K.hair(ell(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, r * 0.95, r * 0.42, a + 1.3, 0, PI, 30), 0.12, { p: 0.4 }); }
        for (let k = 0; k < 5; k++) { const a = 0.6 + k * 0.34; Z.stroke(ell(x, y, r * 0.92, r * 0.34, a, PI, TAU, 30), 'chalk', Z.mix(c, '#ffffff', 0.35), { w: 0.35, p: 0.6 }); }
        Z.fill(ell(x + r * 0.55, y + r * 0.5, r, r, 0), 'shade', dark, { w: 1, p: 0.36, passes: 1 });
      });
      K.ink(b, 0.36);
    };
    const pirn = (x0, y0, x1, y1, c, dark) => {
      const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux;
      const Q = (t, w) => [x0 + ux * t + nx * w, y0 + uy * t + ny * w];
      const stick = [Q(-1, -0.8), Q(L, -0.55), Q(L + 0.6, 0), Q(L, 0.55), Q(-1, 0.8)];
      K.solid(stick, C.bambooLit, { w: 0.5, ang: Math.atan2(uy, ux) }); K.ink(stick, 0.26);
      const cop = []; const a = L * 0.18, b = L * 0.84;
      for (let i = 0; i <= 16; i++) { const t = i / 16; cop.push(Q(lerp(a, b, t), -(3.3 - 1.2 * t) * (t < 0.06 ? 0.7 + t * 5 : t > 0.92 ? 1 - (t - 0.92) * 6 : 1))); }
      for (let i = 16; i >= 0; i--) { const t = i / 16; cop.push(Q(lerp(a, b, t), (3.3 - 1.2 * t) * (t < 0.06 ? 0.7 + t * 5 : t > 0.92 ? 1 - (t - 0.92) * 6 : 1))); }
      K.burnish(cop); K.solid(cop, c, { w: 0.6, ang: Math.atan2(uy, ux) });
      Z.withMask(cop, () => {
        for (let t = a + 0.6; t < b; t += 1.1) K.hair([Q(t - 0.6, -3.6), Q(t + 0.6, 3.6)], 0.1, { p: 0.4 });
        Z.fill(cop.map(p => [p[0] + nx * -1.8, p[1] + ny * -1.8]), 'shade', dark, { w: 0.6, p: 0.3, passes: 1 });
      });
      K.ink(cop, 0.34);
    };
    pirn(bx - 6, ry + 1.5, bx - 15, ry - 19, C.hingul, K.SHW);
    pirn(bx + 6, ry + 1.5, bx + 15, ry - 17, C.lapis, K.SHW);
    pirn(bx + 0.5, ry + 1.5, bx + 1.6, ry - 22, C.haldi, Z.mix(C.bole, '#3a1a08', 0.4));
    ball(bx - 9.5, ry - 3.6, 5.6, C.mal, K.SHW);
    ball(bx + 10, ry - 3.2, 5.2, C.rose, Z.mix('#7a2a3a', C.neel, 0.2));
    // the body: twill of cane, two bands dyed, the shade down its right
    const bodyL = [[bx - rx, ry]].concat(Array.from({ length: 10 }, (_, i) => { const t = (i + 1) / 10; return [lerp(bx - rx, bx - bxr, Math.pow(t, 0.8)), lerp(ry, by, t)]; }));
    const bodyR = bodyL.map(([x, y]) => [2 * bx - x, y]).reverse();
    const BODY = bodyL.concat(ell(bx, by, bxr, 3.4, 0, PI, 0, 60), bodyR, ell(bx, ry, rx, rv, 0, 0, PI, 60));
    K.burnish(BODY);
    K.solid(BODY, C.cane, { w: 1, ang: 0 });
    const hwAt = y => lerp(rx, bxr, Math.pow(clamp((y - ry) / (by - ry), 0, 1), 1 / 0.8));
    Z.withMask(BODY, () => {
      const sagAt = y => lerp(rv, 3.4, clamp((y - ry) / (by - ry), 0, 1));
      for (const [ya, yb, c] of [[-16.2, -13.8, C.hingul], [-10, -8.4, C.mal]]) Z.fill(ell(bx, ya, 40, sagAt(ya), 0, 0, PI, 40).concat(ell(bx, yb, 40, sagAt(yb), 0, PI, 0, 40)), 'pastel', c, { w: 0.8, p: 1, passes: 2, ang: 0 });
      let k = 0;
      for (let y = ry + 1.6; y < by - 0.2; y += 2.1, k++) {
        const hw = hwAt(y), sag = sagAt(y), s = k % 2 ? 1 : -1;
        for (let x = -hw + 1.2 + (k % 2) * 1.3; x < hw - 0.6; x += 2.6) {
          const v = x / hw, yy = y + sag * Math.sqrt(Math.max(0, 1 - v * v));
          K.hair([[bx + x - 0.6, yy - 0.75 * s], [bx + x + 0.6, yy + 0.75 * s]], 0.13, { p: 0.55, tin: 0.2, tout: 0.2 });
        }
      }
      Z.fill(BODY.map(([x, y]) => [x + 16, y]), 'shade', K.SHW, { w: 1.2, p: 0.34, passes: 1, ang: 1.5 });
      Z.fill(BODY.map(([x, y]) => [x + 24, y]), 'shade', K.SHW, { w: 1.2, p: 0.34, passes: 1, ang: 1.5 });
      Z.fill(BODY.map(([x, y]) => [x - 40, y]), 'pastel', '#fff1d8', { w: 1, p: 0.24, reach: 0.9, passes: 1, ang: 1.5 });
    });
    K.dots(ell(bx, -15, rx - 3.4, rv * 0.92, 0, 0.2, PI - 0.2, 40), 2.4, C.limeLit, 0.55);
    K.ink(BODY, 0.45);
    // the rim: a coil of cane wrapped with a strip, the wraps leaning
    const rim = ribbon(ell(bx, ry, rx, rv, 0, -0.02, PI + 0.02, 60), () => 1.3);
    K.solid(rim, C.caneLit, { w: 0.7, ang: 0 });
    for (const q of Z.along(ell(bx, ry, rx, rv, 0, 0.04, PI - 0.04, 60), 1.5, 0)) K.hair([[q.x - 0.5, q.y - 1.1], [q.x + 0.5, q.y + 1.1]], 0.12, { p: 0.6 });
    K.ink(rim, 0.36);
    // a skein of indigo thrown over the rim, hanging down the front
    const sk = []; for (let i = 0; i <= 24; i++) { const t = i / 24; sk.push([lerp(bx + 13, bx + 15.6, t) + Math.sin(t * PI) * 1.1, lerp(ry + 2, -4.6, t)]); }
    const skr = ribbon(sk, t => 2.2 - 0.5 * t);
    const skp = skr.L.concat(ell(sk[24][0], sk[24][1], 1.7, 1.3, 0, 0, PI, 10).reverse(), skr.R.slice().reverse());
    K.solid(skp, C.lapis, { w: 0.6, ang: 1.5 });
    Z.withMask(skp, () => { for (let s = 0; s < 4; s++) Z.stroke(sk.map((p, i) => [p[0] - 1.2 + s * 0.8, p[1]]), 'chalk', s < 2 ? '#5a7ac8' : C.neel, { w: 0.3, p: 0.7 }); });
    K.ink(skp, 0.34);
  }

  /* ------------------------------------------------------------------ the parrot: a rose-ringed parakeet on the warp roll,
     facing the work.  x, y: between its feet; s: its size (crown to feet about 0.93 s) */
  function parrot(Z, K, o, x, y, s) {
    // the head cocked: everything above the collar turned about the neck, the throat bending smoothly between
    const hd = pv('head', 0), NU = 0.04, NV = -0.6;
    const P = !hd ? (u, v) => [x + u * s, y + v * s] : (u, v) => {
      if (v >= NV) return [x + u * s, y + v * s];
      const w = v <= NV - 0.09 ? 1 : (t => t * t * (3 - 2 * t))((NV - v) / 0.09), a = -hd * w, c = Math.cos(a), sn = Math.sin(a);
      return [x + (NU + (u - NU) * c - (v - NV) * sn) * s, y + (NV + (u - NU) * sn + (v - NV) * c) * s];
    };
    const sp = (cp, closed, st) => Z.spline(cp.map(q => P(q[0], q[1])), closed, st || 0.35);
    // the tail: two long blue-green middle feathers over shorter green ones, hanging down over the roll
    const feather = (cp, w0, w1, c, lit, dark) => {
      const cl = Z.spline(cp.map(q => P(q[0], q[1])), false, 0.4), f = ribbon(cl, t => s * lerp(w0, w1, t) * (t > 0.85 ? (1 - t) / 0.15 * 0.8 + 0.2 : 1));
      K.solid(f, c, { w: 0.7, ang: 1.2 });
      Z.withMask(f, () => {
        Z.fill(f.R.concat(cl.slice().reverse()), 'shade', dark, { w: 0.8, p: 0.32, passes: 1 });
        Z.stroke(cl, 'chalk', lit, { w: 0.35, p: 0.6, tin: 0.1, tout: 0.2 });
      });
      K.ink(f, 0.32);
      return { f, cl };
    };
    feather([[-0.09, -0.12], [-0.2, 0.25], [-0.34, 0.6]], 0.05, 0.03, C.green, C.greenLit, K.SHW);
    feather([[-0.05, -0.1], [-0.12, 0.3], [-0.21, 0.66]], 0.05, 0.034, C.green, C.greenLit, K.SHW);
    const t1 = feather([[-0.08, -0.12], [-0.16, 0.36], [-0.27, 0.8], [-0.35, 1.08]], 0.045, 0.028, C.teal, '#8fd0c4', K.SHW);
    const t2 = feather([[-0.05, -0.12], [-0.11, 0.38], [-0.18, 0.82], [-0.23, 1.04]], 0.045, 0.028, '#3a9a8c', '#9ad8c8', K.SHW);
    for (const t of [t1, t2]) { const n = t.cl.length, tip = t.cl.slice(Math.floor(n * 0.82)); Z.stroke(tip, 'chalk', C.haldi, { w: s * 0.03, p: 0.8, tin: 0, tout: 0.5 }); }
    // the body and head in one silhouette
    const body = sp([[0.05, -0.935], [0.17, -0.885], [0.218, -0.81], [0.2, -0.71], [0.17, -0.64], [0.235, -0.46], [0.18, -0.22], [0.06, -0.05], [-0.07, -0.07], [-0.17, -0.28], [-0.19, -0.5], [-0.11, -0.73], [-0.07, -0.87]], true, 0.3);
    K.burnish(body);
    K.solid(body, C.green, { w: 0.8, ang: 1.1 });
    Z.withMask(body, () => {
      // the breast paler and more yellow, the cheek lit, a breath of blue on the nape
      Z.fill(sp([[0.2, -0.66], [0.25, -0.46], [0.19, -0.22], [0.08, -0.12], [0.06, -0.4], [0.12, -0.6]], true), 'pastel', C.greenLit, { w: 0.7, p: 0.85, reach: 1.4, passes: 2, ang: 1.3 });
      Z.fill(sp([[-0.13, -0.82], [-0.02, -0.76], [-0.06, -0.69], [-0.15, -0.72]], true), 'pastel', '#8ab4c4', { w: 0.6, p: 0.7, reach: 1.3, passes: 1, ang: 0.4 });
      Z.fill(sp([[0.04, -0.9], [0.16, -0.86], [0.18, -0.76], [0.08, -0.74], [0.0, -0.8]], true), 'pastel', '#7cc04e', { w: 0.6, p: 0.7, reach: 1.3, passes: 1 });
      // the shade under the breast and down the back
      Z.fill(sp([[0.24, -0.42], [0.2, -0.2], [0.06, -0.04], [-0.1, -0.06], [0.05, -0.2], [0.16, -0.32]], true), 'shade', K.SHW, { w: 0.8, p: 0.36, passes: 1 });
      // the breast feathers: rows of small scales, each drawn
      for (let rI = 0; rI < 5; rI++) for (let k = 0; k < 3; k++) {
        const u = 0.06 + k * 0.05 + (rI % 2) * 0.025, v = -0.56 + rI * 0.075;
        if (u > 0.2 - Math.abs(v + 0.4) * 0.15) continue;
        K.hair(Z.spline([P(u - 0.022, v - 0.01), P(u, v + 0.012), P(u + 0.022, v - 0.01)], false, 0.3), 0.1, { p: 0.4, tin: 0.2, tout: 0.2 });
      }
    });
    // the wing folded along the side: coverts in scales, the long flight feathers to the tip
    const wing = sp([[-0.03, -0.62], [0.07, -0.53], [0.11, -0.36], [0.07, -0.18], [-0.03, -0.04], [-0.17, 0.14], [-0.21, -0.12], [-0.2, -0.36], [-0.14, -0.55]], true, 0.3);
    K.solid(wing, '#3f8f38', { w: 0.7, ang: 1.2 });
    const prim = sp([[0.07, -0.26], [0.06, -0.15], [-0.03, -0.04], [-0.17, 0.14], [-0.2, -0.04], [-0.12, -0.2]], true, 0.3);
    Z.withMask(wing, () => {
      K.solid(prim, '#2c6e62', { w: 0.6, ang: 1.0 });
      Z.fill(sp([[0.1, -0.4], [0.06, -0.12], [-0.06, 0.04], [-0.2, 0.14], [-0.04, -0.2], [0.06, -0.4]], true), 'shade', K.SHW, { w: 0.7, p: 0.32, passes: 1 });
      for (let k = 0; k < 5; k++) {
        const a = P(0.06 - k * 0.04, -0.24 + k * 0.012), b = P(-0.04 - k * 0.032, -0.06 + k * 0.03), c = P(-0.16 - k * 0.01, 0.12 - k * 0.02);
        K.hair([a, b, c], 0.12, { p: 0.6 });
        Z.stroke([[a[0] - 0.4, a[1] + 0.2], [b[0] - 0.4, b[1] + 0.2], [c[0] - 0.3, c[1]]], 'chalk', '#8fd0a0', { w: 0.24, p: 0.45, tin: 0.2, tout: 0.4 });
      }
      for (let rI = 0; rI < 3; rI++) for (let k = 0; k < 3 - (rI > 1 ? 1 : 0); k++) {
        const u = -0.1 + k * 0.065 - rI * 0.02, v = -0.5 + rI * 0.085;
        const arc = Z.spline([P(u - 0.032, v - 0.012), P(u, v + 0.02), P(u + 0.032, v - 0.012)], false, 0.3);
        K.hair(arc, 0.12, { p: 0.6 });
        Z.stroke(arc.map(p => [p[0] - 0.25, p[1] - 0.35]), 'chalk', C.greenLit, { w: 0.22, p: 0.45, tin: 0.3, tout: 0.3 });
      }
    });
    K.ink(wing, 0.36);
    // the collar: black from the chin round the throat, rose on the nape behind it
    K.chalk(Z.spline([P(-0.13, -0.745), P(-0.06, -0.72), P(0.02, -0.705)], false, 0.3), C.rose, s * 0.026, { p: 1 });
    Z.stroke(Z.spline([P(0.2, -0.71), P(0.15, -0.665), P(0.07, -0.66), P(0.0, -0.68), P(-0.1, -0.72), P(-0.13, -0.735)], false, 0.3), K.KJ, K.INK, { w: s * 0.02, p: 1, tin: 0.15, tout: 0.3 });
    K.ink(body, 0.42);
    // the beak: a red hook over a dark lower bill
    const lower = sp([[0.205, -0.75], [0.265, -0.725], [0.255, -0.695], [0.21, -0.7]], true, 0.2);
    K.solid(lower, '#3a1e1a', { w: 0.4 }); K.ink(lower, 0.26);
    const beak = sp([[0.205, -0.865], [0.27, -0.85], [0.315, -0.79], [0.3, -0.71], [0.283, -0.705], [0.275, -0.76], [0.24, -0.765], [0.207, -0.75]], true, 0.2);
    K.solid(beak, C.beak, { w: 0.45, ang: 0.6 });
    Z.withMask(beak, () => { Z.fill(sp([[0.27, -0.8], [0.32, -0.78], [0.3, -0.7], [0.27, -0.74]], true), 'shade', K.SHW, { w: 0.4, p: 0.4, passes: 1 }); Z.stroke([P(0.225, -0.84), P(0.27, -0.83)], 'chalk', '#f08a6a', { w: 0.35, p: 0.7 }); });
    K.ink(beak, 0.3);
    // the eye: a pale ring, a bright iris, the pupil, one catch of light
    const E = P(0.115, -0.818);
    const ring = ell(E[0], E[1], s * 0.034, s * 0.03, 0, 0, TAU, 30);
    K.solid(ring, '#f0e6c8', { w: 0.35 });
    K.dot(E[0] + 0.1, E[1], '#f2e070', s * 0.04);
    K.dot(E[0] + 0.2, E[1] + 0.05, 'kajal', s * 0.022);
    K.dot(E[0] - 0.12, E[1] - 0.18, C.limeLit, s * 0.008);
    Z.outline(ring, K.KJ, K.INK, { closed: true, w: 0.18 * KW, p: 0.85, pull: 30, again: 0 });
    if (pv('blink', 0)) {
      // the eye shut: the green lid drawn down over it, its edge a short dark line
      const lid = ell(E[0], E[1], s * 0.036, s * 0.032, 0, 0, TAU, 30);
      K.solid(lid, C.green, { w: 0.35 });
      Z.stroke([[E[0] - s * 0.034, E[1] + s * 0.004], [E[0], E[1] + s * 0.014], [E[0] + s * 0.034, E[1] + s * 0.002]], K.KJ, K.INK, { w: 0.16 * KW, p: 0.9, tin: 0.2, tout: 0.2 });
    }
    // the feet round the roll
    for (const [u, d] of [[-0.02, -1], [0.07, 1]]) {
      const toe = [P(u, -0.03), P(u + d * 0.035, -0.005), P(u + d * 0.05, 0.02)];
      Z.stroke(toe, 'chalk', '#9a8088', { w: s * 0.03, p: 1, tin: 0.1, tout: 0.3 });
      K.line(toe, 0.18, { p: 0.6 });
    }
  }

  M.w8x['rule-builder'] = {
    draw(Z, o) {
      const K = kit(Z);
      warpRoll(Z, K, o);
      warp(Z, K, o);
      const fe = cloth(Z, K, o);
      clothRoll(Z, K, o);
      stretcher(Z, K);
      brackets(Z, K);
      shuttle(Z, K, o, fe.xe, fe.ye);
      sync('shuttle');
      for (const sg of [-1, 1]) post(Z, K, o, sg);
      bobbins(Z, K);
      hanks(Z, K, o);
      parrot(Z, K, o, -70, -252.2, 37.5);
      sync('parrot');
      charkha(Z, K, o);
      sync('charkha');
      basket(Z, K, o);
    },
    ground(Z, o) {
      const SH = Z.mix('#6a4a3a', 'neel', 0.22), SHD = Z.mix('#5a3a2e', 'neel', 0.2);
      const glaze = (poly, p, ang) => {
        Z.fill(poly, 'shade', SH, { w: 1.2, p, passes: 2, ang, turn: 0.05, reach: 1.6, gap: 0.35, streak: 0 });
        Z.blend(poly, { r: 1.6, k: 0.45, gap: 0.9, len: 14, ang });
      };
      // the loom stands a hand off the wall: its shadow thrown down and to the right, soft and even
      for (const sg of [-1, 1]) glaze(R(sg * POSTX + 4, -262, sg * POSTX + 13, -8), 0.2, 1.55);
      glaze(R(-92, -246, 122, -238), 0.18, 0);
      glaze(R(-86, -150, 106, -60), 0.12, 0);
      // on the floor: a narrow even band under the feet, the wheel and the basket, darker close in
      glaze([[-128, -1.6], [210, -1.6], [212, 0.8], [-126, 0.9]], 0.36, 0);
      for (const sg of [-1, 1]) Z.fill(ell(sg * POSTX + 3, -0.6, 13, 1.4, 0, 0, TAU, 40), 'shade', SHD, { w: 0.9, p: 0.4, passes: 2, reach: 1.6, gap: 0.35, streak: 0, ang: 0 });
      Z.fill(ell(152, -0.4, 22, 1.4, 0, 0, TAU, 40), 'shade', SHD, { w: 0.9, p: 0.4, passes: 2, reach: 1.6, gap: 0.35, streak: 0, ang: 0 });
    }
  };
})();
