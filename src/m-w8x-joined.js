(function () {
  'use strict';
  /* ==========================================================================
     JOINED (June 2023), repainted for the gold well (well8k)
       M.w8x['joined'] = { ground(Z, o), draw(Z, o) }
     An auspicious doorway of carved lime marble, painted the folio way: each part laid in one clean flat colour,
     then one kajal contour that swells on the side away from the light (upper left), then its ornament ruled and
     set by hand, then the gold over an ochre bole with a broken edge.
       a cornice slab; a frame of four nested bands (hingul flowers, a gold rope, a lime vine, lapis dots) round a
       nine-lobed cusped arch with lapis spandrels; a purna kalash at the foot of each jamb; two lac door leaves
       opened inward; a lit diya on a rangoli in a warm room; a threshold step; a toran of mango leaves and
       marigolds; a red and haldi thread tied in a bow across the opening (the joining); two rose-ringed parakeets
       leaning in from the ends of the cornice until their beaks meet.
     Z is the sheet (sheet units, origin at the sheet's top left).  Everything is drawn straight on the art in sheet
     units from o.bb, the bay's box: x0..x1, yt (head of the arcade) .. yb (foot of the arch).
     ======================================================================== */
  M.w8x = M.w8x || {};
  const PI = Math.PI, TAU = 2 * PI;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  const C = {
    line: '#1a1412', chase: '#5a3410', bole: '#b47c22', shell: '#d4a236', goldL: '#f2d27a', burnish: '#ffe6a0',
    lime: '#f2e9d4', limeLit: '#fbf6ea', limeSh: '#d9cbab', limeDp: '#b9a682',
    hingul: '#c63d2f', hingulD: '#9a2a22', lac: '#8f2331', lacD: '#64161f', lacL: '#b33a36',
    lapis: '#2a4b96', lapisD: '#203c80', neel: '#1d2850',
    mal: '#3f7f52', malD: '#28583a', malL: '#6aa070',
    haldi: '#edc94b', saffron: '#e88e1e', marig: '#d9661e', white: '#fbf6e8', rose: '#e8a0a8',
    kattha: '#5a1a14', katthaL: '#74261a', floor: '#c98a3e', floorD: '#9a5a26', clay: '#b4503a', clayD: '#7a2c1e'
  };
  // the parakeet's coat
  const PK = {
    body: '#4f9e48', breast: '#8cc25e', head: '#5cab4a', crown: '#74bd52', nape: '#6aaea4',
    wing: '#3f8a42', cov: '#5aa24c', covL: '#8cc66a', prim: '#2b6a58', primL: '#4f9a86',
    tail: '#3a8c86', tailL: '#68b2a4', tailU: '#a8c858', tailTip: '#cfd67a',
    beak: '#d0402a', beakL: '#f07a5a', beakD: '#5a1a12', ring: '#e88aa0', iris: '#f2ecc0', orbit: '#e07028', foot: '#8a7c86'
  };

  // the parakeet's body and head, in its own frame (u forward, v down, in body lengths; feet at the origin)
  const SIL = [[0.37, -0.645], [0.47, -0.635], [0.545, -0.585], [0.575, -0.5], [0.565, -0.4], [0.5, -0.31], [0.4, -0.215],
    [0.24, -0.12], [0.07, -0.085], [-0.08, -0.125], [-0.2, -0.205], [-0.23, -0.29], [-0.13, -0.37], [0.05, -0.45], [0.22, -0.53], [0.29, -0.61]];
  // where the two birds stand: [x offset from the middle, size, facing, lean]
  const BIRDS = [[-5.35, 11.2, 1, 0.45], [5.35, 11.2 * 0.985, -1, 0.465]];

  // ---------------------------------------------------------------- small geometry
  const rectP = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  // a cusped arch: jambs from yb up to the spring ys, a pointed head to its apex ya, the head cut into lobes that
  // bulge outward with their cusps pointing in (the shape of the stage's w8Arch, with the lobe depth given)
  function arch(x0, x1, yb, ys, ya, lobes, amp, endAmp) {
    const xc = (x0 + x1) / 2, hw = (x1 - x0) / 2, rise = ys - ya;
    const f = u => 0.72 * Math.sqrt(Math.max(0, 1 - (1 - u) * (1 - u))) + 0.28 * u;
    const base = [];
    for (let i = 0; i <= 60; i++) { const u = i / 60; base.push([x0 + hw * u, ys - rise * f(u)]); }
    for (let i = 59; i >= 0; i--) { const u = i / 60; base.push([x1 - hw * u, ys - rise * f(u)]); }
    let len = 0; const cum = [0];
    for (let i = 1; i < base.length; i++) { len += Math.hypot(base[i][0] - base[i - 1][0], base[i][1] - base[i - 1][1]); cum.push(len); }
    const at = s => { let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const t = (s - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]); return [base[i - 1][0] + (base[i][0] - base[i - 1][0]) * t, base[i - 1][1] + (base[i][1] - base[i - 1][1]) * t]; };
    const curve = [], cusps = [];
    for (let k = 0; k < lobes; k++) {
      const a = at(len * k / lobes), b = at(len * (k + 1) / lobes), m = at(len * (k + 0.5) / lobes);
      let nx = m[0] - xc, ny = m[1] - ys; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]) * (k === 0 || k === lobes - 1 ? endAmp : amp);
      for (let j = 0; j <= 12; j++) {
        if (k > 0 && j === 0) continue;
        const t = j / 12, bump = Math.sin(t * PI) * d;
        curve.push([a[0] + (b[0] - a[0]) * t + nx * bump, a[1] + (b[1] - a[1]) * t + ny * bump]);
      }
      if (k > 0) cusps.push(a);
    }
    const poly = [[x0, yb]].concat(curve, [[x1, yb]]);
    poly.curve = curve; poly.cusps = cusps;
    return poly;
  }
  function ribbon(cl, wf) {
    const n = cl.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = cl[Math.max(0, i - 1)], b = cl[Math.min(n - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const w = wf(i / (n - 1));
      L.push([cl[i][0] + nx * w, cl[i][1] + ny * w]); R.push([cl[i][0] - nx * w, cl[i][1] - ny * w]);
    }
    const poly = L.concat(R.slice().reverse()); poly.L = L; poly.R = R;
    return poly;
  }
  // the leaf's edge wanders a little inside the contour, so the bole shows in a worn, broken line
  function brokenIn(A, poly, d0, d1) {
    const pts = A.resample(poly, 0.3, true), n = pts.length;
    if (n < 14) return poly;
    const nrm = i => { const a = pts[(i - 2 + n) % n], b = pts[(i + 2) % n]; const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; };
    let vote = 0;
    for (let i = 0; i < n; i += Math.max(1, n / 24 | 0)) { const m = nrm(i); vote += A.inside([poly], pts[i][0] + m[0] * 0.2, pts[i][1] + m[1] * 0.2) ? 1 : -1; }
    const sg = vote >= 0 ? 1 : -1, p1 = A.rr(0, TAU), p2 = A.rr(0, TAU), w1 = A.rr(2.2, 3.2), w2 = A.rr(0.7, 1.1);
    return pts.map((p, i) => {
      const s = i * 0.3, t = clamp(0.5 + 0.32 * Math.sin(TAU * s / w1 + p1) + 0.2 * Math.sin(TAU * s / w2 + p2), 0, 1), d = lerp(d0, d1, t), m = nrm(i);
      return [p[0] + sg * m[0] * d, p[1] + sg * m[1] * d];
    });
  }

  // ---------------------------------------------------------------- the painter's kit, in sheet units on the art itself
  function kit(Z, o) {
    const A = Z.__base, rr = A.rr;
    const glints = (o && o.G && o.G.glints) || [];
    const k = { A, rr, glint: (x, y) => glints.push([x, y]) };
    // a flat ground laid with the tip of the stick in crossing passes, rubbed into the tooth
    k.lay = (poly, c, o2) => A.fill(poly, 'pastel', c, Object.assign({ w: 1.1, p: 1, reach: 1.7, passes: 3, ang: -0.5, turn: 0.5, cv: 0.012, streak: 0.2 }, o2 || {}));
    // gold leaf over an ochre bole, stopped short of the contour at a broken edge, shell gold rubbed over it
    k.gild = (poly, ang, o2) => {
      o2 = o2 || {};
      k.lay(poly, o2.bole || C.bole, { w: 0.8, ang: ang || 0.4, passes: 2 });
      const lp = o2.edge === false ? poly : brokenIn(A, poly, o2.d0 != null ? o2.d0 : 0.1, o2.d1 != null ? o2.d1 : 0.32);
      A.fill(lp, 'gold', o2.tint || 'gold', { w: 0.8, p: 1, reach: 1.4, passes: 2, ang: (ang || 0.4) + 0.3, turn: 0.25 });
      if (o2.sheen !== 0) A.fill(lp, 'pastel', C.shell, { w: 1, p: o2.sheen || 0.5, reach: 0.95, passes: 1, ang: ang || 0.4, cv: 0.01 });
    };
    k.kaj = (pts, w, o2) => A.stroke(pts, 'kajal', (o2 && o2.c) || C.line, Object.assign({ w: w || 0.3, p: 0.92, tin: 0.08, tout: 0.1 }, o2 || {}));
    k.hair = (pts, w, o2) => A.stroke(pts, 'kajal', (o2 && o2.c) || C.line, Object.assign({ w: w || 0.15, p: 0.8, tin: 0.06, tout: 0.08 }, o2 || {}));
    k.chalk = (pts, c, w, o2) => A.stroke(pts, 'chalk', c, Object.assign({ w: w || 0.4, p: 0.9 }, o2 || {}));
    k.dot = (x, y, c, w, o2) => A.dot(x, y, 'chalk', c, Object.assign({ w: w || 0.5, p: 0.97 }, o2 || {}));
    // the Mewar contour: one even kajal line round the shape, then passes inside it only where the form turns from
    // the light (upper left), so the line swells under things and thins to a hair over lit tops
    k.ink = (poly, o2) => {
      o2 = o2 || {};
      const kk = o2.k || 1, pts = A.resample(poly, o2.step || Math.min(0.35, 0.3 * kk + 0.05), true), n = pts.length;
      if (n < 8) return;
      const nrm = i => { const a = pts[(i - 2 + n) % n], b = pts[(i + 2) % n]; const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; };
      let vote = 0;
      for (let i = 0; i < n; i += Math.max(1, n / 30 | 0)) { const m = nrm(i); vote += A.inside([poly], pts[i][0] + m[0] * 0.15 * kk, pts[i][1] + m[1] * 0.15 * kk) ? 1 : -1; }
      const sg = vote >= 0 ? 1 : -1;
      const ph1 = rr(0, TAU), ph2 = rr(0, TAU), f1 = rr(0.012, 0.02), f2 = rr(0.05, 0.08), lx = -0.45, ly = -0.89;
      const wt = pts.map((p, i) => {
        const m = nrm(i), ox = -m[0] * sg, oy = -m[1] * sg, away = -(ox * lx + oy * ly);
        return clamp(0.45 + 0.6 * away + 0.14 * Math.sin(i * f1 * TAU + ph1) + 0.07 * Math.sin(i * f2 * TAU + ph2) + (o2.bias || 0), 0, 1);
      });
      const c = o2.c || C.line;
      A.outline(pts, 'kajal', c, { closed: true, w: (o2.w0 || 0.34) * kk, p: 0.92, pull: o2.pull || 40, again: 0.06 });
      let i0 = 0; for (let i = 1; i < n; i++) if (wt[i] < wt[i0]) i0 = i;
      for (const [lev, off] of [[0.42, 0.16], [0.66, 0.3], [0.86, 0.44]]) {
        let run = [];
        const flush = () => { if (run.length > 5) A.stroke(run, 'kajal', c, { w: 0.3 * kk, p: 0.9, tin: 0.3, tout: 0.3 }); run = []; };
        for (let j = 0; j <= n; j++) {
          const i = (i0 + j) % n;
          if (wt[i] > lev) { const m = nrm(i), d = off * kk; run.push([pts[i][0] + m[0] * sg * d, pts[i][1] + m[1] * sg * d]); }
          else flush();
        }
        flush();
      }
    };
    // a counted row of dots along a path, each set by hand: a hair off in place and size, never a stamp
    k.dots = (pts, step, r, c, o2) => {
      o2 = o2 || {};
      const qs = A.along(pts, step * rr(0.985, 1.015), 0), ph = rr(0, TAU), n = qs.length, j = step * 0.05;
      qs.forEach((q, i) => {
        if (o2.trim && (i < o2.trim || i >= n - o2.trim)) return;
        if (o2.skip && o2.skip(q, i)) return;
        const s = r * (1 + 0.07 * Math.sin(i * 1.7 + ph) + rr(-0.05, 0.05));
        A.dot(q.x + rr(-j, j), q.y + rr(-j, j), 'chalk', c || C.white, { w: s, p: rr(0.9, 1), reach: 1.3 });
      });
      return qs;
    };
    // a small flower of n chalk petals round a heart
    k.floret = (x, y, r, n, petal, heart, a0) => {
      a0 = a0 != null ? a0 : rr(0, 1.2);
      for (let i = 0; i < n; i++) {
        const a = a0 + i * TAU / n + rr(-0.07, 0.07);
        A.dot(x + Math.cos(a) * r * 0.52, y + Math.sin(a) * r * 0.52, 'chalk', petal || C.white, { w: r * 0.6 * rr(0.92, 1.06), len: r * 0.16, ang: a, p: 0.97 });
      }
      A.dot(x, y, 'chalk', heart || C.haldi, { w: r * 0.42, p: 1 });
    };
    // a gold bead: a dark seat, the bead, a speck of light up and to the left
    k.bead = (x, y, r, lit) => {
      r *= rr(0.93, 1.07); x += rr(-0.04, 0.04) * r; y += rr(-0.04, 0.04) * r;
      A.dot(x + r * 0.08, y + r * 0.1, 'kajal', C.chase, { w: r * 1.2, p: 0.95 });
      A.dot(x, y, 'gold', 'gold', { w: r * 0.95, p: 1, reach: 1.3 });
      if (lit !== false) A.dot(x - r * 0.2, y - r * 0.22, 'chalk', C.burnish, { w: r * 0.32, p: 0.9 });
    };
    // an ellipse with enough points that a small one is round
    k.ell = (cx, cy, rx, ry, rot, a0, a1) => {
      ry = ry == null ? rx : ry; a0 = a0 == null ? 0 : a0; a1 = a1 == null ? TAU : a1; rot = rot || 0;
      const n = Math.max(20, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 0.12)), cr = Math.cos(rot), sr = Math.sin(rot), out = [];
      for (let i = 0; i < n; i++) { const t = a0 + (a1 - a0) * i / (a1 - a0 >= TAU - 1e-6 ? n : n - 1), x = Math.cos(t) * rx, y = Math.sin(t) * ry; out.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); }
      return out;
    };
    // a marigold head, counted: eleven outer petals, a crease between each pair, seven short inner petals, a dark heart
    k.marigold = (x, y, r, c, a0) => {
      a0 = a0 != null ? a0 : rr(0, TAU);
      const n = 11, ph = rr(0, TAU), dk = A.mix(c, '#8a2408', 0.5), lt = A.mix(c, '#fff2b8', 0.5), E = [];
      for (let i = 0; i < 66; i++) { const a = i * TAU / 66, R = r * (0.84 + 0.16 * Math.abs(Math.cos((a - a0) * n / 2))) * (1 + 0.035 * Math.sin(3 * a + ph)); E.push([x + Math.cos(a) * R, y + Math.sin(a) * R * 0.94]); }
      A.fill(E, 'pastel', c, { w: Math.max(0.3, r * 0.45), p: 1, reach: 1.5, passes: 2, ang: a0, turn: 0.3 });
      A.withMask(E, () => {
        for (let i = 0; i < n; i++) {
          const a = a0 + (i + 0.5) * TAU / n + rr(-0.04, 0.04);
          A.stroke([[x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.4], [x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.81]], 'kajal', dk, { w: Math.max(0.07, r * 0.08), p: 0.8, tin: 0.2, tout: 0.4 });
        }
        for (let i = 0; i < 7; i++) { const a = a0 + 0.3 + i * TAU / 7; A.dot(x + Math.cos(a) * r * 0.34, y + Math.sin(a) * r * 0.32, 'chalk', lt, { w: r * 0.34 * rr(0.92, 1.08), len: r * 0.16, ang: a, p: 0.92 }); }
        A.dot(x, y, 'kajal', dk, { w: r * 0.3, p: 0.9 });
        A.dot(x - r * 0.08, y - r * 0.09, 'chalk', lt, { w: r * 0.11, p: 0.9 });
      });
      A.outline(E, 'kajal', '#5a240a', { closed: true, w: Math.max(0.1, r * 0.1), p: 0.88, pull: 8, again: 0 });
    };
    // a mango leaf hanging from (x, y) along angle a: a short stalk, widest a third of the way, a long drawn point
    k.mango = (x, y, a, len, wid, c, o2) => {
      o2 = o2 || {};
      const dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx, bend = o2.bend || 0;
      const Q = (t, s) => { const b = bend * t * t * len; return [x + dx * len * t + px * (wid * s + b), y + dy * len * t + py * (wid * s + b)]; };
      const sh = t => Math.pow(Math.sin(PI * Math.pow(t, 0.75)), 0.9) * 0.5;
      const L = [], R = [];
      for (let i = 0; i <= 22; i++) { const t = 0.08 + 0.92 * i / 22, s = sh((t - 0.08) / 0.92); L.push(Q(t, s)); R.push(Q(t, -s)); }
      const poly = L.concat(R.reverse());
      k.lay(poly, c, { w: Math.max(0.3, wid * 0.4), ang: a, turn: 0.2, passes: 2 });
      A.withMask(poly, () => {
        // the half away from the light a shade deeper, then the pale midrib and the paired veins
        A.fill(ribbon([Q(0.08, -0.25), Q(0.5, -0.32), Q(1, -0.1)], () => wid * 0.3), 'pastel', A.mix(c, '#10301a', 0.22), { w: Math.max(0.3, wid * 0.3), p: 0.7, passes: 1, ang: a });
        A.stroke([Q(0.06, 0), Q(0.5, 0.01), Q(0.97, 0)], 'chalk', A.mix(c, '#e8f0b0', 0.55), { w: Math.max(0.1, wid * 0.08), p: 0.95, tin: 0.05, tout: 0.4 });
        for (let i = 0; i < 5; i++) {
          const t = 0.2 + i * 0.15 + rr(-0.015, 0.015);
          for (const s of [-1, 1]) A.stroke([Q(t, 0), Q(t + 0.08, s * 0.32)], 'kajal', A.mix(c, '#0a2010', 0.5), { w: Math.max(0.05, wid * 0.04), p: 0.6, tin: 0.1, tout: 0.5 });
        }
      });
      k.ink(poly, { k: o2.k || 0.42 });
      A.stroke([[x, y], Q(0.1, 0)], 'kajal', '#3a2a10', { w: Math.max(0.1, wid * 0.12), p: 0.9 });
      return poly;
    };
    // burnish the ground under a surface before it is painted, as lime plaster is polished: the sheet's broad crumple
    // is pressed flat and only the fine even tooth is left
    k.burnish = (polys, amp) => {
      amp = amp || 0.24;
      const HM = A.HM, W = A.W, H = A.H; if (!HM) return;
      const r = Math.max(2, Math.round(2 * A.S));
      const m = A.pushMask(polys, 0); A.popMask();
      if (!m || !m.w || !m.h) return;
      const x0 = Math.max(0, m.x0 - r), y0 = Math.max(0, m.y0 - r), x1 = Math.min(W, m.x0 + m.w + r), y1 = Math.min(H, m.y0 + m.h + r);
      const bw = x1 - x0, bh = y1 - y0; if (bw <= 0 || bh <= 0) return;
      const I = new Float64Array((bw + 1) * (bh + 1));
      for (let y = 0; y < bh; y++) { let row = 0; const src = (y0 + y) * W + x0, o1 = (y + 1) * (bw + 1), o0 = y * (bw + 1); for (let x = 0; x < bw; x++) { row += HM[src + x]; I[o1 + x + 1] = I[o0 + x + 1] + row; } }
      for (let y = 0; y < m.h; y++) {
        const Y = m.y0 + y; if (Y < y0 || Y >= y1) continue;
        for (let x = 0; x < m.w; x++) {
          const d = m.d[y * m.w + x]; if (!d) continue;
          const X = m.x0 + x; if (X < x0 || X >= x1) continue;
          const ax = Math.max(0, X - r - x0), ay = Math.max(0, Y - r - y0), bx = Math.min(bw, X + r + 1 - x0), by = Math.min(bh, Y + r + 1 - y0);
          const mean = (I[by * (bw + 1) + bx] - I[ay * (bw + 1) + bx] - I[by * (bw + 1) + ax] + I[ay * (bw + 1) + ax]) / ((bx - ax) * (by - ay));
          const i = Y * W + X, v = 0.5 + clamp((HM[i] - mean) * 0.8 * amp / 0.24, -amp, amp);
          HM[i] += (v - HM[i]) * d / 255;
        }
      }
    };
    return k;
  }

  // ---------------------------------------------------------------- the plan: every measure from the bay's box
  function plan(bb) {
    const x0 = bb.x0, x1 = bb.x1, yt = bb.yt, yb = bb.yb, w = x1 - x0, h = yb - yt, xc = (x0 + x1) / 2;
    // the stage paints its frieze over everything above yt after the bays, so the doorway and the birds on it stay
    // inside the bay: the parakeets stand on the cornice, the cornice is the head of the frame
    const yCor = yt + 9.7;                                 // the cornice's top, where the parakeets stand
    const TB = yCor + 4.1;                                 // the cornice's foot, the frame's head
    const D = [0, 4.0, 5.4, 9.0, 10.2];                    // the bands from outside in: hingul flowers, gold rope, lime vine, lapis dots
    const R = i => [x0 + D[i], TB + D[i], x1 - D[i], yb];
    const IX0 = x0 + D[4], IX1 = x1 - D[4], IT = TB + D[4];
    const ySill = yb - 3.4, ys = IT + (ySill - IT) * 0.3, ya = IT + 3.2;
    const op = arch(IX0 + 1.7, IX1 - 1.7, ySill, ys, ya, 9, 0.34, 0.22);
    const deep = arch(IX0 + 3.1, IX1 - 3.1, ySill, ys + 0.5, ya + 1.5, 9, 0.34, 0.22);
    const dx0 = IX0 + 3.1, dx1 = IX1 - 3.1, yFl = ySill - 7.4, lw = 5.4;
    // the diya: its foot, its size, the foot of its flame, and the middle of the flame (where the light is centred)
    const dy = ySill - 3.5, dq = 1.4, fb = dy - 1.25 * dq, flame = [xc + 0.95 * dq, fb - 2.5 * dq];
    return { x0, x1, yt, yb, w, h, xc, TB, D, R, IX0, IX1, IT, ySill, ys, ya, op, deep, dx0, dx1, yFl, lw, dy, dq, fb, flame,
      yCor, base: 10.2, yThr: ys + (ySill - ys) * 0.26 };
  }

  /* ================================================================ GROUND: a narrow even shadow right of the frame and
     under the ends of the cornice (the light is from the upper left) */
  function ground(Z, o) {
    const A = Z.__base, g = plan(o.bb), SH = A.mix('#5a3a1e', '#5a4048', 0.5);
    // each bird throws a soft shadow down and to the right onto the wall behind it: its body, and its tail as a band
    for (const [dx, s, f, rot] of BIRDS) {
      const fx = g.xc + dx + 0.75, fy = g.yCor + 0.05 + 0.5, cr = Math.cos(rot), sr = Math.sin(rot);
      const P = (u, v) => [fx + (u * cr + v * sr) * s * f, fy + (-u * sr + v * cr) * s];
      const body = A.spline(SIL.map(q => P(q[0], q[1])), true, 0.15);
      const tail = ribbon([P(-0.2, -0.27), P(-0.9, -0.17), P(-1.7, -0.03)], t => (1 - t) * 0.07 * s + 0.08);
      for (const poly of [body, tail]) {
        A.withMask([rectP(g.x0, g.yt + 0.2, g.x1, g.yCor)], () => A.fill(poly, 'shade', SH, { w: 0.6, p: 0.34, passes: 2, ang: 0.4, turn: 0.4, reach: 1.5, streak: 0 }));
      }
    }
  }

  /* ================================================================ THE ROOM inside: a deep kattha wall lit by the lamp in
     flat rings of saffron and haldi, a floor seen tilted up, the two leaves opened back against the walls */
  function room(k, g, o) {
    const { A, rr } = k, { op, deep, dx0, dx1, yFl, ySill, ys, xc, lw } = g;
    // the reveal: the thickness of the wall round the opening, its left face and soffit in shade, its right face lit
    k.lay(op, '#bfae8a', { ang: 1.4 });
    A.withMask([op, deep], () => {
      A.fill(rectP(xc, ys - 2, g.IX1, ySill), 'pastel', C.limeSh, { w: 1, p: 1, reach: 1.6, passes: 3, ang: 1.45 });
      A.fill(rectP(g.IX0, g.ya - 4, g.IX1, ys - 3), 'pastel', '#a8946e', { w: 1, p: 0.9, passes: 2, ang: 0.2 });
    });
    // the back wall: polished harder than the lime, then one even ground of kattha in four crossing passes
    k.burnish([deep], 0.07);
    k.lay(deep, C.kattha, { w: 0.9, passes: 4, ang: 1.3, turn: 0.7, cv: 0.004, streak: 0 });
    const flame = g.flame;
    const floor = [[dx0, ySill], [dx1, ySill], [dx1 - lw, yFl], [dx0 + lw, yFl]];
    const leafL = [[dx0, ys + 0.9], [dx0 + lw, ys + 3.4], [dx0 + lw, yFl], [dx0, ySill]];
    const leafR = [[dx1, ys + 0.9], [dx1 - lw, ys + 3.4], [dx1 - lw, yFl], [dx1, ySill]];
    // the light of the lamp on the back wall: flat rings, each a clean colour, each edged with a ring of haldi dots
    const RINGS = [[16.5, '#7a2c1a'], [12.6, '#9a3a1a'], [9.4, '#b8501c'], [6.6, '#d9761e'], [4.2, '#eaa22e'], [2.3, '#f3cf6a']];
    // each ring drawn freehand: its radius breathes a little round the circle, never a compass line
    const ringOf = (r, i) => { const ph = 1.7 * i + 0.4, n = Math.max(40, Math.ceil(r * TAU / 0.15)), out = [];
      for (let j = 0; j < n; j++) { const a = j * TAU / n, rk = r * (1 + 0.012 * Math.sin(3 * a + ph) + 0.007 * Math.sin(7 * a + 2 * ph)); out.push([flame[0] + Math.cos(a) * rk, flame[1] + Math.sin(a) * rk * 1.04]); }
      return out; };
    A.withMask([deep], () => {
      A.pushMaskOutside([leafL, leafR, floor]);
      RINGS.forEach(([r, c], i) => {
        A.fill(ringOf(r, i), 'pastel', c, { w: 0.9, p: 1, reach: 1.6, passes: 3, ang: 0.3 + i * 0.4, turn: 0.6, streak: 0, cv: 0.006 });
      });
      RINGS.forEach(([r], i) => {
        if (i > 4) return;
        const E = ringOf(r - 0.05, i);
        k.dots(E.concat([E[0]]), [1.5, 1.2, 1.05, 0.85, 0.7][i], [0.3, 0.34, 0.36, 0.33, 0.3][i], ['#c8862a', '#dca23a', C.haldi, C.haldi, '#fff0b0'][i]);
      });
      // the rays: counted, a short stroke of haldi chalk between the third and fourth rings
      const NR = 28;
      for (let i = 0; i < NR; i++) {
        const a = i * TAU / NR + rr(-0.02, 0.02), r0 = 9.9, r1 = 12.0 + (i % 2 ? -0.5 : 0.2);
        A.stroke([[flame[0] + Math.cos(a) * r0, flame[1] + Math.sin(a) * r0 * 1.04], [flame[0] + Math.cos(a) * r1, flame[1] + Math.sin(a) * r1 * 1.04]], 'chalk', i % 2 ? '#e8a23a' : C.haldi, { w: 0.34, p: 0.9, tin: 0.1, tout: 0.4 });
      }
      A.popMask();
    });
    // the floor, tilted up the way the folios show a floor: lamp-lit ochre, darker at its back edge
    k.lay(floor, C.floor, { ang: 0.05, turn: 0.3 });
    A.withMask(floor, () => {
      A.fill(rectP(dx0, yFl - 1, dx1, yFl + 1.1), 'pastel', C.floorD, { w: 0.8, p: 0.9, passes: 2, ang: 0.02 });
      // the floor's boards of lime, ruled toward the back
      for (let i = 1; i < 8; i++) { const t = i / 8, xa = lerp(dx0, dx1, t), xb = lerp(dx0 + lw, dx1 - lw, t); k.hair([[xa, ySill], [xb, yFl]], 0.09, { c: C.floorD, p: 0.55 }); }
    });
    k.hair([[dx0 + lw, yFl], [dx1 - lw, yFl]], 0.16);
    // the leaves, lac red, opened back against the walls: a gold strap top and foot, a grid of studs, a ring
    for (const [L, sg] of [[leafL, 1], [leafR, -1]]) {
      const lit = sg < 0;
      k.lay(L, lit ? C.lacL : C.lac, { ang: 1.5, turn: 0.3 });
      const bi = (u, v) => { const top = [lerp(L[0][0], L[1][0], u), lerp(L[0][1], L[1][1], u)], bot = [lerp(L[3][0], L[2][0], u), lerp(L[3][1], L[2][1], u)]; return [lerp(top[0], bot[0], v), lerp(top[1], bot[1], v)]; };
      A.withMask(L, () => {
        // the panel within the leaf, a shade deeper, ruled round with a gold hairline
        const pan = [bi(0.18, 0.08), bi(0.82, 0.08), bi(0.82, 0.92), bi(0.18, 0.92)];
        A.fill(pan, 'pastel', lit ? C.lac : C.lacD, { w: 0.6, p: 0.9, passes: 2, ang: 1.5 });
        k.hair(pan.concat([pan[0]]), 0.1, { c: C.chase, p: 0.7 });
        for (const v of [0.035, 0.965]) A.stroke([bi(0, v), bi(1, v)], 'gold', 'gold', { w: 0.55, p: 1, tin: 0.02, tout: 0.02 });
      });
      k.ink(L, { k: 0.6 });
      for (let r = 0; r < 8; r++) for (const u of [0.33, 0.67]) { const q = bi(u, 0.15 + r * 0.1); k.bead(q[0], q[1], lerp(0.66, 0.56, u), lit || u < 0.5); }
      const kn = bi(sg > 0 ? 0.86 : 0.86, 0.5);
      A.outline(k.ell(kn[0], kn[1] + 0.55, 0.42, 0.6), 'gold', 'gold', { closed: true, w: 0.18, p: 1, pull: 8, again: 0 });
      k.bead(kn[0], kn[1], 0.42);
    }
    // a temple bell hung on a chain from the head of the arch, over the thread
    const by = lerp(g.ya + 1.5, g.yThr, 0.62), ch = [];
    for (let y = g.ya + 1.2; y < by - 2.3; y += 0.9) ch.push(y);
    ch.forEach((y, i) => A.outline(k.ell(xc + Math.sin(i * 1.3) * 0.05, y, i % 2 ? 0.2 : 0.36, 0.46), i % 2 ? 'kajal' : 'gold', i % 2 ? C.chase : 'gold', { closed: true, w: 0.17, p: 0.95, pull: 4, again: 0 }));
    const bell = A.spline([[xc - 0.55, by - 2.4], [xc - 1.15, by - 1.6], [xc - 1.45, by - 0.2], [xc - 1.75, by + 1.2], [xc - 2.4, by + 1.75], [xc + 2.4, by + 1.75], [xc + 1.75, by + 1.2], [xc + 1.45, by - 0.2], [xc + 1.15, by - 1.6], [xc + 0.55, by - 2.4]], true, 0.08);
    k.gild(bell, 1.5, { d0: 0.06, d1: 0.18 });
    A.withMask(bell, () => {
      A.fill(rectP(xc + 0.4, by - 3, xc + 2.6, by + 2), 'pastel', A.mix(C.bole, '#4a2a08', 0.35), { w: 0.4, p: 0.6, passes: 1, ang: 1.5 });
      A.stroke([[xc - 0.85, by - 1.5], [xc - 1.15, by + 0.9]], 'chalk', C.burnish, { w: 0.34, p: 0.9 });
      for (const yy of [by - 0.9, by + 1.05]) A.stroke([[xc - 2.2, yy + (yy > by ? 0.05 : 0)], [xc + 2.2, yy]], 'kajal', C.chase, { w: 0.1, p: 0.85 });
      k.dots([[xc - 1.5, by + 0.3], [xc + 1.5, by + 0.3]], 0.5, 0.2, C.hingul);
    });
    k.ink(bell, { k: 0.5 });
    A.dot(xc + 0.15, by + 2.25, 'gold', 'gold', { w: 0.9, p: 1 });
    A.outline(k.ell(xc + 0.15, by + 2.25, 0.45, 0.45), 'kajal', C.chase, { closed: true, w: 0.1, p: 0.8, pull: 4, again: 0 });
    if (o.bell) o.bell(xc, by, 2.4);
    k.glint(xc - 1, by - 1);
    return { flame, floor };
  }

  // the lamp: a clay diya with its spout to the right, the flame from the wick, and a rangoli lotus under it
  function lamp(k, g, o, flame) {
    const { A, rr } = k, xc = g.xc, y = g.dy;
    // the rangoli, seen tilted: an outer ring of white dots, eight hingul petals with malachite leaves between, a haldi ring
    const rx = 10.4, ry = 2.9, cy = y + 0.2;
    k.dots(k.ell(xc, cy, rx, ry).concat([[xc + rx, cy]]), 0.78, 0.4, C.white);
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8 + PI / 8, cx = xc + Math.cos(a) * rx * 0.62, cyy = cy + Math.sin(a) * ry * 0.62;
      const pe = k.ell(cx, cyy, 1.7, 0.62, Math.atan2(Math.sin(a) * ry, Math.cos(a) * rx));
      k.lay(pe, C.hingul, { w: 0.35, passes: 2, ang: a });
      A.outline(pe, 'kajal', C.line, { closed: true, w: 0.12, p: 0.8, pull: 6, again: 0 });
      A.dot(cx + Math.cos(a) * 0.4, cyy + Math.sin(a) * 0.15, 'chalk', C.white, { w: 0.3, p: 0.95 });
      const b = a + TAU / 16, lx = xc + Math.cos(b) * rx * 0.74, ly = cy + Math.sin(b) * ry * 0.74;
      A.dot(lx, ly, 'chalk', C.mal, { w: 0.62, len: 0.5, ang: Math.atan2(Math.sin(b) * ry, Math.cos(b) * rx), p: 1 });
    }
    k.dots(k.ell(xc, cy, rx * 0.38, ry * 0.38).concat([[xc + rx * 0.38, cy]]), 0.5, 0.36, C.haldi);
    // the diya: a clay bowl drawn out to a spout on the right, a lip of light along its rim, a row of pressed dots
    const q = g.dq, X = (u) => xc + u * q, Y = (v) => y + v * q;
    const bowl = A.spline([[X(-2.3), Y(-1.1)], [X(-1.4), Y(0.2)], [X(0.4), Y(0.45)], [X(1.9), Y(-0.2)], [X(2.9), Y(-1.25)], [X(1.6), Y(-1.0)], [X(-0.2), Y(-1.05)], [X(-1.6), Y(-1.25)]], true, 0.1);
    k.lay(bowl, C.clay, { w: 0.4, ang: 0.1, passes: 2 });
    A.withMask(bowl, () => {
      A.fill(rectP(X(0.6), Y(-1.5), X(3), Y(0.6)), 'pastel', C.clayD, { w: 0.4, p: 0.8, passes: 1, ang: 0.3 });
      A.stroke([[X(-1.9), Y(-0.95)], [X(2.4), Y(-1.05)]], 'chalk', '#e8a070', { w: 0.34, p: 0.9 });
      k.dots([[X(-1.3), Y(-0.35)], [X(1.4), Y(-0.4)]], 0.6, 0.24, C.white);
    });
    // the oil, dark, in the mouth of the bowl
    A.stroke([[X(-1.5), Y(-1.12)], [X(1.4), Y(-1.08)]], 'kajal', '#3a1a08', { w: 0.24, p: 0.8, tin: 0.2, tout: 0.2 });
    k.ink(bowl, { k: 0.55 });
    // the flame: a drop of saffron round a haldi body and a white core, on a dark wick
    const fx = g.flame[0], fb = g.fb;
    A.stroke([[X(2.3), fb + 0.1], [fx + 0.05, fb - 0.6]], 'kajal', C.line, { w: 0.26, p: 0.95 });
    const drop = (sc) => A.spline([[fx, fb - 0.3], [fx + 0.95 * sc * q, fb - 1.6 * sc * q], [fx + 0.55 * sc * q, fb - 3.4 * sc * q], [fx - 0.1 * q, fb - 5.2 * sc * q], [fx - 0.45 * sc * q, fb - 3.2 * sc * q], [fx - 0.85 * sc * q, fb - 1.5 * sc * q]], true, 0.08);
    const F0 = drop(1), F1 = drop(0.72), F2 = drop(0.42);
    k.lay(F0, C.saffron, { w: 0.3, passes: 2, ang: 1.5 });
    k.lay(F1, C.haldi, { w: 0.3, passes: 2, ang: 1.5 });
    k.lay(F2, '#fffbe8', { w: 0.25, passes: 2, ang: 1.5 });
    A.outline(F0, 'kajal', '#7a2a08', { closed: true, w: 0.16, p: 0.85, pull: 10, again: 0 });
    if (o.lamp) o.lamp(fx, fb - 2.4 * q);
  }

  /* ================================================================ THE FRAME: four nested bands round the opening, the
     lapis spandrels with a lotus each, a purna kalash at each jamb foot, the threshold */
  function frame(k, g, o) {
    const { A, rr } = k, { R, D, x0, x1, TB, yb, IX0, IX1, IT, ySill, ys, xc, op } = g;
    const ring = i => [rectP(...R(i)), rectP(...R(i + 1))];
    // 1. the hingul band of flowers
    k.lay(ring(0), C.hingul, { ang: 1.5, turn: 0.4 });
    // 2. the gold rope
    k.gild(ring(1), 1.5, { d0: 0.05, d1: 0.18 });
    // 3. the lime band with its vine
    k.lay(ring(2), C.lime, { ang: 1.5, turn: 0.4 });
    // 4. the lapis band of dots
    k.lay(ring(3), C.lapis, { ang: 1.5, turn: 0.4 });
    // the surround inside the bands: lime, with lapis spandrels over the arch
    A.pushMaskOutside(op);
    k.lay(rectP(IX0, IT, IX1, yb), C.lime, { ang: 1.5, turn: 0.4 });
    k.lay(rectP(IX0 + 0.05, IT, IX1 - 0.05, ys + 0.3), C.lapis, { ang: 0.6, turn: 0.5 });
    A.popMask();

    // ---- ornament of the hingul band: a white dot row along each edge, and a white floret every 3.4 along the middle
    const U = (d) => [[x0 + d, yb], [x0 + d, TB + d], [x1 - d, TB + d], [x1 - d, yb]];
    k.dots(U(0.66), 1.08, 0.44, C.white, { trim: 0 });
    k.dots(U(D[1] - 0.66), 1.08, 0.44, C.white);
    const mid = D[1] / 2, Lm = U(mid);
    // the corners take a larger flower with a gold heart; the runs between are counted out evenly
    const runs = [[Lm[0], Lm[1]], [Lm[1], Lm[2]], [Lm[2], Lm[3]]];
    runs.forEach(([a, b], ri) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(len / 3.4);
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t);
        const corner = (ri === 0 && i === n) || (ri === 2 && i === 0) || (ri === 1 && (i === 0 || i === n));
        if (ri === 1 && (i === 0 || i === n)) continue;          // the corners are set by the jamb runs
        if (ri !== 1 && y > yb - 1.5) continue;
        if (corner) { k.floret(x, y, 1.6, 8, C.white, C.haldi, 0.2); A.dot(x, y, 'gold', 'gold', { w: 0.62, p: 1 }); k.glint(x, y); }
        else k.floret(x, y, 1.2, 5, C.white, C.haldi);
      }
    });
    // ---- the gold rope: a twist chased across it, counted; a chased line along each edge
    const rp = U((D[1] + D[2]) / 2);
    for (const q of A.along(rp, 0.82, 0)) {
      const a = q.ang + PI / 4, l = 0.85;
      A.stroke([[q.x - Math.cos(a) * l, q.y - Math.sin(a) * l], [q.x + Math.cos(a) * l, q.y + Math.sin(a) * l]], 'kajal', C.chase, { w: 0.12, p: 0.75, tin: 0.15, tout: 0.15 });
    }
    k.glint(x0 + D[1] + 0.7, TB + 18); k.glint(x1 - D[1] - 0.7, TB + 34); k.glint(xc + 6, TB + D[1] + 0.7);
    // ---- the vine on the lime band: a stem that winds along, a leaf on alternate sides at each turn, a bud on each crest
    const vm = (D[2] + D[3]) / 2, amp = 0.95, wl = 5.4;
    const vineRun = (a, b, flip) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / wl)), wl2 = len / n;
      const tx = (b[0] - a[0]) / len, ty = (b[1] - a[1]) / len, nx = -ty * flip, ny = tx * flip;
      const P = s => { const off = amp * Math.sin(TAU * s / wl2); return [a[0] + tx * s + nx * off, a[1] + ty * s + ny * off]; };
      const stem = []; for (let s = 0; s <= len + 1e-6; s += 0.25) stem.push(P(s));
      A.stroke(stem, 'pastel', C.malD, { w: 0.34, p: 1, tin: 0, tout: 0 });
      for (let i = 0; i < n * 2; i++) {
        const s = (i + 0.5) * wl2 / 2, q = P(s), side = i % 2 ? 1 : -1, crest = P(s + wl2 * 0.02);
        // a leaf springs from just past each crest, toward the inside of the curve
        const la = Math.atan2(ty, tx) + side * flip * 0.95 + rr(-0.08, 0.08);
        const L0 = [q[0] - nx * side * amp * 0.15, q[1] - ny * side * amp * 0.15];
        const lf = ribbon([L0, [L0[0] + Math.cos(la) * 0.8, L0[1] + Math.sin(la) * 0.8], [L0[0] + Math.cos(la) * 1.55, L0[1] + Math.sin(la) * 1.55]], t => 0.42 * Math.sin(PI * Math.pow(t, 0.8)) + 0.02);
        k.lay(lf, i % 4 < 2 ? C.mal : C.malL, { w: 0.3, passes: 2, ang: la });
        A.outline(lf, 'kajal', C.line, { closed: true, w: 0.1, p: 0.75, pull: 5, again: 0 });
        // the bud opposite, at the crest
        const bx = crest[0] + nx * side * 0.55, by = crest[1] + ny * side * 0.55;
        A.dot(bx, by, 'chalk', C.hingul, { w: 0.7 * rr(0.94, 1.06), p: 1 });
        A.dot(bx - 0.12, by - 0.14, 'chalk', '#f4a090', { w: 0.24, p: 0.9 });
      }
    };
    const V = U(vm);
    vineRun([V[0][0], V[0][1] - g.base - 0.6], V[1], 1);
    vineRun(V[1], V[2], 1);
    vineRun(V[2], [V[3][0], V[3][1] - g.base - 0.6], 1);
    // ---- the lapis band: one row of white dots
    k.dots(U((D[3] + D[4]) / 2).map((p, i) => i === 0 || i === 3 ? [p[0], p[1] - g.base] : p), 1.02, 0.44, C.white);

    // ---- the spandrels: a lotus of eight white petals in each, a ring of hingul, a gold heart; leaves and dots round it
    for (const sg of [-1, 1]) {
      const cx = xc + sg * (IX1 - IX0) * 0.36, cy = IT + (ys - IT) * 0.31;
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + PI / 8 + rr(-0.03, 0.03), pr = 2.45;
        const pe = A.spline([[cx, cy], [cx + Math.cos(a - 0.36) * pr * 0.62, cy + Math.sin(a - 0.36) * pr * 0.62], [cx + Math.cos(a) * pr, cy + Math.sin(a) * pr], [cx + Math.cos(a + 0.36) * pr * 0.62, cy + Math.sin(a + 0.36) * pr * 0.62]], true, 0.08);
        k.lay(pe, C.white, { w: 0.35, passes: 2, ang: a });
        A.withMask(pe, () => A.stroke([[cx + Math.cos(a) * pr * 0.55, cy + Math.sin(a) * pr * 0.55], [cx + Math.cos(a) * pr, cy + Math.sin(a) * pr]], 'chalk', C.rose, { w: 0.5, p: 0.75, tin: 0.3, tout: 0 }));
        A.outline(pe, 'kajal', C.line, { closed: true, w: 0.13, p: 0.85, pull: 6, again: 0 });
      }
      A.dot(cx, cy, 'chalk', C.hingul, { w: 1.7, p: 1 });
      A.dot(cx, cy, 'gold', 'gold', { w: 0.9, p: 1 }); k.glint(cx, cy);
      k.dots(k.ell(cx, cy, 0.62, 0.62).concat([[cx + 0.62, cy]]), 0.42, 0.18, C.white);
      // two leaf sprigs on the long axis of the spandrel and white dot trios in the corners
      const ax = sg > 0 ? -1 : 1;
      for (const [lx, ly, la] of [[cx + ax * 3.1, cy + 0.9, ax > 0 ? 0.35 : PI - 0.35], [cx - ax * 2.4, cy - 2.6, ax > 0 ? PI + 0.6 : -0.6]]) {
        const lf = ribbon([[lx, ly], [lx + Math.cos(la) * 1, ly + Math.sin(la) * 1], [lx + Math.cos(la) * 2, ly + Math.sin(la) * 2]], t => 0.5 * Math.sin(PI * Math.pow(t, 0.8)) + 0.02);
        k.lay(lf, C.malL, { w: 0.3, passes: 2, ang: la });
        A.outline(lf, 'kajal', C.line, { closed: true, w: 0.1, p: 0.8, pull: 5, again: 0 });
      }
      const cxo = sg < 0 ? IX0 + 1.4 : IX1 - 1.4;
      for (const [dx, dy] of [[0, 0], [sg < 0 ? 0.75 : -0.75, 0], [0, 0.75]]) A.dot(cxo + dx, IT + 1.3 + dy, 'chalk', C.white, { w: 0.4 * rr(0.92, 1.06), p: 0.95 });
    }
    // the slim pilasters the arch springs from: a lime shaft with a hingul flute, a gilt capital and a gilt base
    for (const sg of [-1, 1]) {
      const px0 = sg < 0 ? IX0 : IX1 - 1.7, px1 = sg < 0 ? IX0 + 1.7 : IX1, pc = (px0 + px1) / 2;
      A.stroke([[pc, ys + 2], [pc, ySill - 2]], 'chalk', C.hingul, { w: 0.24, p: 0.9, tin: 0, tout: 0 });
      k.dots([[pc, ys + 2.6], [pc, ySill - 2.4]], 1.7, 0.3, C.hingul);
      const cap = [[px0 - 0.15, ys - 0.25], [px1 + 0.15, ys - 0.25], [px1 + 0.15, ys + 0.45], [px1 - 0.25, ys + 1.25], [px0 + 0.25, ys + 1.25], [px0 - 0.15, ys + 0.45]];
      k.gild(cap, 0, { d0: 0.04, d1: 0.12 });
      k.ink(cap, { k: 0.4 });
      const bas = [[px0 + 0.25, ySill - 1.3], [px1 - 0.25, ySill - 1.3], [px1 + 0.15, ySill - 0.5], [px1 + 0.15, ySill], [px0 - 0.15, ySill], [px0 - 0.15, ySill - 0.5]];
      k.gild(bas, 0, { d0: 0.04, d1: 0.12 });
      k.ink(bas, { k: 0.4 });
      k.glint(pc, ys + 0.3);
    }
    // the arch's moulding: a gold leaf line laid just outside the opening, and a white dot row outside that
    const cur = op.curve;
    const offs = (pts, d) => pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; return [p[0] - nx / l * d, p[1] - ny / l * d]; });
    const gl = A.resample(offs(cur, 0.62), 0.25, false);
    A.stroke(gl, 'gold', 'gold', { w: 0.62, p: 1, tin: 0.02, tout: 0.02 });
    for (let i = 0; i < 5; i++) k.glint(gl[Math.floor((i + 0.5) / 5 * gl.length)][0], gl[Math.floor((i + 0.5) / 5 * gl.length)][1]);
    k.dots(offs(cur, 1.55), 0.95, 0.36, C.white, { trim: 1 });

    // ---- the jamb feet: a lime block with a hingul panel, and a purna kalash in each: a gold pot, five mango leaves
    for (const sg of [-1, 1]) {
      const bx0 = sg < 0 ? x0 + 0.6 : IX1 - 0.2, bx1 = sg < 0 ? IX0 + 0.2 : x1 - 0.6, by0 = yb - g.base, bxC = (bx0 + bx1) / 2;
      const blk = rectP(bx0, by0, bx1, yb);
      k.lay(blk, C.lime, { ang: 0.1 });
      const pan = rectP(bx0 + 0.7, by0 + 0.7, bx1 - 0.7, yb - 0.6);
      k.lay(pan, C.hingul, { w: 0.6, ang: 0.1 });
      k.dots([[bx0 + 0.35, by0 + 0.35], [bx1 - 0.35, by0 + 0.35]], 0.75, 0.3, C.hingul);
      // the pot
      const py = yb - 3.15, pr = 2.55;
      const pot = A.spline([[bxC - 0.75, py - pr - 0.6], [bxC - 0.8, py - pr + 0.15], [bxC - pr, py - 0.5], [bxC - pr * 0.82, py + pr * 0.7], [bxC, py + pr * 0.95], [bxC + pr * 0.82, py + pr * 0.7], [bxC + pr, py - 0.5], [bxC + 0.8, py - pr + 0.15], [bxC + 0.75, py - pr - 0.6]], true, 0.08);
      // the leaves first, behind the rim: five, fanned
      for (let i = 0; i < 5; i++) {
        const a = -PI / 2 + (i - 2) * 0.42 + rr(-0.04, 0.04), r0 = 0.3;
        k.mango(bxC + Math.cos(a) * r0, py - pr - 0.6 + Math.sin(a) * r0, a, 3.2 * (i === 2 ? 1.08 : 1), 1.15, i % 2 ? C.malL : C.mal, { k: 0.3 });
      }
      // the coconut on the mouth
      const nut = k.ell(bxC, py - pr - 1.35, 1.1, 0.98);
      k.lay(nut, '#8a5a2a', { w: 0.3, passes: 2 });
      A.withMask(nut, () => { for (let i = 0; i < 5; i++) A.stroke([[bxC - 0.8 + i * 0.4, py - pr - 2.1], [bxC - 0.9 + i * 0.42, py - pr - 0.4]], 'kajal', '#5a3410', { w: 0.08, p: 0.6 }); });
      k.ink(nut, { k: 0.3 });
      k.gild(pot, 0.2, { d0: 0.06, d1: 0.16 });
      A.withMask(pot, () => {
        A.fill(rectP(bxC + 0.5, py - pr - 1, bxC + pr + 0.4, py + pr + 0.4), 'pastel', A.mix(C.bole, '#5a3410', 0.3), { w: 0.4, p: 0.5, passes: 1, ang: 1.5 });
        A.stroke([[bxC - pr * 0.85, py - 0.15], [bxC + pr * 0.85, py - 0.15]], 'kajal', C.chase, { w: 0.1, p: 0.8 });
        k.dots([[bxC - pr * 0.8, py + 0.4], [bxC + pr * 0.8, py + 0.4]], 0.5, 0.22, C.hingul);
        A.stroke([[bxC - pr * 0.55, py - 1.1], [bxC - pr * 0.2, py - 1.5]], 'chalk', C.burnish, { w: 0.3, p: 0.8 });
      });
      k.ink(pot, { k: 0.38 });
      k.glint(bxC - 0.6, py - 0.8);
      k.ink(blk, { k: 0.6 });
    }

    // ---- the threshold: a lime step, a gold leaf edge on its tread, a hingul riser with a white dot row and florets
    const thr = rectP(IX0 - 0.2, ySill, IX1 + 0.2, yb);
    k.lay(thr, C.limeLit, { ang: 0.02, turn: 0.2 });
    const ris = rectP(IX0 + 0.5, ySill + 1.05, IX1 - 0.5, yb - 0.35);
    k.lay(ris, C.hingul, { w: 0.6, ang: 0.02, turn: 0.2 });
    A.stroke([[IX0 + 0.1, ySill + 0.42], [IX1 - 0.1, ySill + 0.42]], 'gold', 'gold', { w: 0.42, p: 1, tin: 0.02, tout: 0.02 });
    const nf = 9;
    for (let i = 0; i < nf; i++) { const x = lerp(IX0 + 2.6, IX1 - 2.6, i / (nf - 1)); k.floret(x, (ySill + 1.05 + yb - 0.35) / 2, 1.1, 5, C.white, C.haldi); }
    k.ink(thr, { k: 0.7 });
    k.hair([[IX0 + 0.5, ySill + 1.05], [IX1 - 0.5, ySill + 1.05]], 0.14);

    // ---- the contours of the frame: the outer edge heavy, the band edges as ruled hairlines
    for (let i = 1; i <= 4; i++) { const r = R(i); k.hair([[r[0], i === 4 ? ySill : yb - (i < 4 ? g.base : 0)], [r[0], r[1]], [r[2], r[1]], [r[2], i === 4 ? ySill : yb - (i < 4 ? g.base : 0)]], i === 4 ? 0.2 : 0.15); }
    // the opening's edge and the jamb faces
    k.ink(op, { k: 0.85 });
    k.hair(g.deep.curve, 0.14, { p: 0.7 });
    for (const sx of [g.dx0, g.dx1]) k.hair([[sx, g.ys + 0.6], [sx, ySill]], 0.14, { p: 0.7 });
    k.ink(rectP(x0, TB, x1, yb), { k: 1.1 });
  }

  /* ================================================================ THE CORNICE: a lime slab with a row of gold beads,
     a lapis fascia with white flowers under it */
  function cornice(k, g) {
    const { A } = k, { x0, x1, TB, xc } = g, e = 0.6;
    const ym = g.yCor + 1.8;
    const slab = rectP(x0 - e, g.yCor, x1 + e, ym);
    const fas = rectP(x0 - e + 0.5, ym, x1 + e - 0.5, TB);
    k.lay(slab, C.limeLit, { ang: 0.02, turn: 0.25 });
    k.lay(fas, C.lapis, { ang: 0.02, turn: 0.25 });
    A.withMask(slab, () => A.fill(rectP(x0 - e, ym - 0.6, x1 + e, ym + 0.1), 'pastel', C.limeSh, { w: 0.6, p: 0.9, passes: 2, ang: 0.02 }));
    const n = Math.round((x1 - x0 + 2 * e - 2) / 1.5);
    for (let i = 0; i <= n; i++) { const x = lerp(x0 - e + 1, x1 + e - 1, i / n); k.bead(x, g.yCor + 0.9, 0.82); }
    k.glint(xc - 12, g.yCor + 0.9); k.glint(xc + 17, g.yCor + 0.9);
    k.dots([[x0 - e + 1.1, ym + 0.5], [x1 + e - 1.1, ym + 0.5]], 0.9, 0.34, C.white);
    k.dots([[x0 - e + 1.1, TB - 0.45], [x1 + e - 1.1, TB - 0.45]], 0.9, 0.34, C.white);
    k.ink(slab, { k: 0.75 });
    k.ink(fas, { k: 0.75 });
  }

  /* ================================================================ THE TORAN: a cord across the head of the frame, tied to
     a gold hook at each end; thirteen mango leaves hang from it and two marigolds sit between each pair; at each end a
     lad of five marigolds with a leaf and a red tassel hangs down the jamb */
  function toran(k, g) {
    const { A, rr } = k, { x0, x1, TB } = g;
    const xa = x0 + 2.3, xb = x1 - 2.3, y0 = TB + 0.9, sag = 1.5;
    const cord = t => [lerp(xa, xb, t), y0 + sag * Math.sin(PI * t)];
    const NL = 17;
    // the leaves, hung first so the flowers sit over their stalks; each fans a little with its place on the cord
    for (let i = 0; i < NL; i++) {
      const t = (i + 0.5) / NL, q = cord(t), a = PI / 2 + (t - 0.5) * 0.42 + rr(-0.05, 0.05);
      k.mango(q[0], q[1] + 0.2, a, 7.2 * rr(0.96, 1.04), 2.35 * rr(0.95, 1.05), i % 2 ? C.malL : '#2f6e3c', { bend: (t - 0.5) * 0.06 });
    }
    const cl = []; for (let i = 0; i <= 60; i++) cl.push(cord(i / 60));
    A.stroke(cl, 'kajal', '#7a2a10', { w: 0.32, p: 0.95, tin: 0, tout: 0 });
    for (let i = 0; i <= NL; i++) {
      // two marigolds between each pair of leaves: saffron then haldi, then haldi then saffron, so the colours walk
      for (const s of [-0.25, 0.25]) {
        const t = (i + s) / NL; if (t < 0.02 || t > 0.98) continue;
        const q = cord(t), c = ((i + (s > 0 ? 1 : 0)) % 2) ? C.saffron : C.haldi;
        k.marigold(q[0], q[1] - 0.05, 1.2 * rr(0.95, 1.05), c, i * 0.9 + s);
      }
    }
    // the hooks and the lads
    for (const sg of [-1, 1]) {
      const hx = sg < 0 ? xa : xb, hy = y0;
      A.outline(k.ell(hx, hy - 0.2, 0.55, 0.55), 'gold', 'gold', { closed: true, w: 0.3, p: 1, pull: 8, again: 0 });
      k.bead(hx, hy - 0.75, 0.55);
      k.glint(hx, hy - 0.75);
      const st = []; for (let i = 0; i <= 6; i++) st.push([hx + sg * 0.12 * Math.sin(i * 0.9), hy + 0.4 + i * 1.95]);
      A.stroke(st, 'kajal', '#7a2a10', { w: 0.24, p: 0.9 });
      const yEnd = st[st.length - 1][1];
      k.mango(hx, yEnd - 0.3, PI / 2 + sg * 0.12, 4.0, 1.5, C.mal, { k: 0.36 });
      for (let i = 0; i < 6; i++) k.marigold(st[i][0], st[i][1] + 0.6, 1.12 * rr(0.95, 1.05), i % 2 ? C.haldi : C.saffron, i + sg);
    }
  }

  /* ================================================================ THE THREAD: a kalava of red with a haldi twist, tied to
     a gold ring on each jamb face and knotted in a bow over the middle of the opening (the joining) */
  function thread(k, g) {
    const { A, rr } = k, { IX0, IX1, xc, yThr } = g;
    const xa = IX0 + 1.0, xb = IX1 - 1.0, sag = 1.0;
    const yq = x => yThr + sag * (1 - Math.pow((x - xc) / ((xb - xa) / 2), 2));
    const run = (a, b) => { const out = []; for (let i = 0; i <= 40; i++) { const x = lerp(a, b, i / 40); out.push([x, yq(x)]); } return out; };
    const kalava = (pts, w) => {
      A.stroke(pts, 'kajal', C.line, { w: w + 0.24, p: 0.92, tin: 0, tout: 0 });
      A.stroke(pts, 'pastel', '#c8281c', { w, p: 1, tin: 0, tout: 0, reach: 1.4 });
      for (const q of A.along(pts, 0.62, 0)) {
        const a = q.ang + 1.0, l = w * 0.55;
        A.stroke([[q.x - Math.cos(a) * l, q.y - Math.sin(a) * l], [q.x + Math.cos(a) * l, q.y + Math.sin(a) * l]], 'chalk', C.haldi, { w: 0.13, p: 0.85, tin: 0.2, tout: 0.2 });
      }
    };
    // the rings on the jambs
    for (const x of [xa, xb]) {
      A.outline(k.ell(x, yq(x) - 0.1, 0.62, 0.62), 'kajal', C.chase, { closed: true, w: 0.4, p: 0.9, pull: 8, again: 0 });
      A.outline(k.ell(x, yq(x) - 0.1, 0.62, 0.62), 'gold', 'gold', { closed: true, w: 0.26, p: 1, pull: 8, again: 0 });
      k.bead(x, yq(x) - 1.0, 0.5);
      k.glint(x, yq(x) - 0.1);
    }
    kalava(run(xa, xc - 0.8), 0.66);
    kalava(run(xc + 0.8, xb), 0.66);
    // the bow: two loops and two tails, each tail ending in a haldi bead and a red tuft
    const ky = yq(xc);
    for (const sg of [-1, 1]) {
      const loop = A.spline([[xc + sg * 0.3, ky - 0.1], [xc + sg * 1.8, ky - 1.7], [xc + sg * 3.4, ky - 1.4], [xc + sg * 3.6, ky + 0.1], [xc + sg * 2.0, ky + 0.5], [xc + sg * 0.3, ky + 0.2]], false, 0.1);
      kalava(loop, 0.55);
      const tail = A.spline([[xc + sg * 0.25, ky + 0.5], [xc + sg * 0.95, ky + 2.4], [xc + sg * 1.25, ky + 4.4], [xc + sg * 1.55 + rr(-0.1, 0.1), ky + 6.2]], false, 0.1);
      kalava(tail, 0.52);
      const te = tail[tail.length - 1];
      k.bead(te[0], te[1] + 0.35, 0.5);
      A.dot(te[0], te[1] + 0.35, 'chalk', C.haldi, { w: 0.5, p: 1 });
      for (let i = 0; i < 5; i++) A.stroke([[te[0], te[1] + 0.7], [te[0] + (i - 2) * 0.17, te[1] + 2.0 + 0.15 * Math.sin(i * 2.1)]], 'chalk', '#c8281c', { w: 0.2, p: 1, tin: 0.05, tout: 0.4 });
    }
    const knot = k.ell(xc, ky + 0.05, 0.85, 0.75);
    k.lay(knot, '#c8281c', { w: 0.3, passes: 2 });
    A.stroke([[xc - 0.4, ky - 0.2], [xc + 0.4, ky + 0.3]], 'chalk', C.haldi, { w: 0.14, p: 0.9 });
    A.outline(knot, 'kajal', C.line, { closed: true, w: 0.14, p: 0.9, pull: 6, again: 0 });
  }

  /* ================================================================ A ROSE-RINGED PARAKEET, standing at (fx, fy), facing
     f (1 right, -1 left), its body leaning in by rot; s is its length crown to rump.  Drawn feather by feather: the
     long tail first, then the body and the head with its black and rose ring, then the folded wing, then the beak. */
  function parakeet(k, fx, fy, s, f, rot) {
    const { A, rr } = k, cr = Math.cos(rot), sr = Math.sin(rot);
    const P = (u, v) => { const x = u * cr + v * sr, y = -u * sr + v * cr; return [fx + x * s * f, fy + y * s]; };
    const sp = (pts, closed, st) => A.spline(pts.map(q => P(q[0], q[1])), closed, st || 0.1);
    const blade = (bu, bv, ang, len, wid, tipPt) => {
      const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
      const Q = (t, kk) => [bu + dx * len * t + px * wid * kk, bv + dy * len * t + py * wid * kk];
      const pts = tipPt
        ? [Q(0, -0.5), Q(0.25, -0.56), Q(0.55, -0.48), Q(0.8, -0.3), Q(1, 0), Q(0.8, 0.3), Q(0.55, 0.48), Q(0.25, 0.56), Q(0, 0.5)]
        : [Q(0, -0.5), Q(0.4, -0.55), Q(0.78, -0.48), Q(0.95, -0.25), Q(1, 0), Q(0.95, 0.25), Q(0.78, 0.48), Q(0.4, 0.55), Q(0, 0.5)];
      return { poly: sp(pts, true, 0.08), Q: (t, kk) => P(...Q(t, kk)) };
    };
    const kk = s / 10;
    // ---- the tail: three pairs of short feathers underneath, yellow below; then the two long streamers on top
    const TB = [-0.2, -0.27];
    for (let i = 2; i >= 0; i--) {
      for (const dv of [0.02, -0.01]) {
        const F = blade(TB[0], TB[1] + dv, PI + 0.15 + 0.06 * (i + 1) * (dv > 0 ? -1 : 1) * 0.5 + 0.04, [0.62, 0.85, 1.08][i] * rr(0.97, 1.03), 0.1, true);
        k.lay(F.poly, dv > 0 ? PK.tailU : PK.body, { w: 0.25, passes: 2, ang: rot * f });
        A.withMask(F.poly, () => A.stroke([F.Q(0.7, 0), F.Q(1, 0)], 'chalk', PK.tailTip, { w: 0.4 * kk, p: 0.8 }));
        k.ink(F.poly, { k: 0.26 * kk });
      }
    }
    for (const [dv, ln, c] of [[0.012, 1.48, PK.tail], [-0.012, 1.58, PK.tailL]]) {
      const F = blade(TB[0], TB[1] + dv, PI + 0.15 + (dv > 0 ? -0.012 : 0.016), ln * rr(0.98, 1.02), 0.085, true);
      k.lay(F.poly, c, { w: 0.25, passes: 2, ang: rot * f });
      A.withMask(F.poly, () => {
        A.stroke([F.Q(0.02, 0), F.Q(0.96, 0)], 'kajal', A.mix(c, '#0a2a28', 0.5), { w: 0.07 * kk, p: 0.7, tin: 0.1, tout: 0.3 });
        A.stroke([F.Q(0.05, 0.3), F.Q(0.9, 0.2)], 'chalk', A.mix(c, '#e8f4d0', 0.4), { w: 0.12 * kk, p: 0.7, tin: 0.1, tout: 0.4 });
      });
      k.ink(F.poly, { k: 0.3 * kk });
    }
    // ---- the feet, gripping the edge of the cornice: two toes forward, two back
    for (const [u, dk] of [[0.1, 0], [0.02, 0.18]]) {
      const pc = A.mix(PK.foot, '#3a3040', dk), hip = P(u, -0.1), ft = P(u + 0.005, -0.005);
      A.stroke([hip, ft], 'chalk', pc, { w: 0.07 * s, p: 1 });
      for (const [du, dv] of [[0.075, 0.02], [0.06, 0.05], [-0.055, 0.03], [-0.04, 0.055]]) {
        const tip = [ft[0] + du * s * f, ft[1] + dv * s];
        A.stroke([ft, tip], 'chalk', pc, { w: 0.04 * s, p: 1, tout: 0.3 });
        A.dot(tip[0], tip[1], 'kajal', '#2a2028', { w: 0.025 * s, p: 0.9 });
      }
    }
    // ---- the body and head
    const sil = sp(SIL, true, 0.08);
    k.lay(sil, PK.body, { w: 0.35 * kk, ang: rot * f + 0.6 });
    A.withMask(sil, () => {
      // the head a brighter green, the crown brighter again, the nape with its blue bloom; the breast yellow-green
      A.fill(sp([[0.3, -0.7], [0.62, -0.7], [0.62, -0.38], [0.44, -0.4], [0.33, -0.47], [0.26, -0.56]], true), 'pastel', PK.head, { w: 0.3 * kk, p: 1, passes: 2, ang: 0.4 });
      A.stroke([P(0.33, -0.63), P(0.43, -0.65), P(0.52, -0.6)], 'chalk', PK.crown, { w: 0.08 * s, p: 0.9 });
      A.stroke([P(0.2, -0.55), P(0.27, -0.5), P(0.3, -0.44)], 'chalk', PK.nape, { w: 0.07 * s, p: 0.85 });
      A.fill(sp([[0.5, -0.36], [0.6, -0.3], [0.44, -0.12], [0.2, -0.04], [0.06, -0.06], [0.18, -0.18], [0.36, -0.28]], true), 'pastel', PK.breast, { w: 0.3 * kk, p: 0.95, passes: 2, ang: -0.6 });
      // the breast's small feathers, scalloped in hairlines
      for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) {
        const c = P(0.42 - r * 0.07 - i * 0.03, -0.3 + r * 0.06 + i * 0.045);
        A.stroke(k.ell(c[0], c[1], 0.035 * s, 0.022 * s, -rot * f + (f > 0 ? 0 : PI), 0.3, 2.8), 'kajal', A.mix(PK.breast, '#1a3010', 0.55), { w: 0.06 * kk, p: 0.55 });
      }
      // the ring: a black stripe from the chin round the cheek to the nape, and the rose band behind it
      A.stroke([P(0.552, -0.405), P(0.47, -0.385), P(0.38, -0.405), P(0.305, -0.455), P(0.25, -0.53)], 'kajal', '#141010', { w: 0.042 * s, p: 0.95, tin: 0.2, tout: 0.3 });
      A.stroke([P(0.49, -0.355), P(0.4, -0.37), P(0.32, -0.41), P(0.262, -0.47), P(0.215, -0.54)], 'chalk', PK.ring, { w: 0.036 * s, p: 0.95, tin: 0.15, tout: 0.3 });
    });
    k.ink(sil, { k: 0.5 * kk });
    // ---- the folded wing: the coverts in scalloped rows at the shoulder, then the long flights to the tip
    const wing = sp([[0.27, -0.47], [0.12, -0.47], [-0.08, -0.42], [-0.3, -0.33], [-0.53, -0.27], [-0.46, -0.225], [-0.25, -0.19], [-0.04, -0.17], [0.13, -0.2], [0.26, -0.28], [0.3, -0.38]], true, 0.08);
    k.lay(wing, PK.wing, { w: 0.3 * kk, ang: rot * f });
    A.withMask(wing, () => {
      // the primaries, five, the far ones first, each a long blade darkening to its tip with a pale edge
      for (let i = 4; i >= 0; i--) {
        const F = blade(0.06 - i * 0.03, -0.28 + i * 0.022, PI + 0.17 - i * 0.025, 0.6 - i * 0.04, 0.085, false);
        k.lay(F.poly, i % 2 ? PK.prim : A.mix(PK.prim, PK.wing, 0.35), { w: 0.22, passes: 2, ang: rot * f });
        A.withMask(F.poly, () => A.stroke([F.Q(0.1, -0.35), F.Q(0.9, -0.3)], 'chalk', PK.primL, { w: 0.022 * s, p: 0.8 }));
        k.ink(F.poly, { k: 0.18 * kk });
      }
      // the coverts: three rows of scallops, each with a pale tip
      for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - (r > 1 ? 1 : 0); i++) {
        const u = 0.21 - i * 0.075 - r * 0.045, v = -0.43 + r * 0.06 + i * 0.012, c = P(u, v);
        const sc = sp([[u - 0.04, v - 0.02], [u + 0.035, v - 0.025], [u + 0.04, v + 0.02], [u, v + 0.04], [u - 0.045, v + 0.02]], true, 0.05);
        k.lay(sc, r === 0 ? PK.cov : A.mix(PK.cov, PK.wing, 0.4), { w: 0.18, passes: 2 });
        A.stroke([P(u - 0.03, v + 0.03), P(u, v + 0.042), P(u + 0.03, v + 0.03)], 'chalk', PK.covL, { w: 0.02 * s, p: 0.8 });
        A.outline(sc, 'kajal', A.mix(PK.wing, '#0a2010', 0.6), { closed: true, w: 0.07 * kk, p: 0.6, pull: 4, again: 0 });
      }
    });
    k.ink(wing, { k: 0.42 * kk });
    // ---- the eye: a pale iris in an orange ring, the pupil, a speck of light
    const E = P(0.455, -0.525);
    A.dot(E[0], E[1], 'chalk', PK.orbit, { w: 0.115 * s, p: 1 });
    A.dot(E[0], E[1], 'chalk', PK.iris, { w: 0.078 * s, p: 1 });
    A.dot(E[0] + 0.006 * s * f, E[1], 'kajal', '#100c0c', { w: 0.045 * s, p: 1 });
    A.dot(E[0] - 0.012 * s * f, E[1] - 0.014 * s, 'chalk', '#ffffff', { w: 0.018 * s, p: 1 });
    A.outline(k.ell(E[0], E[1], 0.058 * s, 0.058 * s), 'kajal', C.line, { closed: true, w: 0.06 * kk, p: 0.7, pull: 6, again: 0 });
    // ---- the beak: the hooked red upper, the dark lower
    const lower = sp([[0.556, -0.452], [0.62, -0.44], [0.645, -0.405], [0.605, -0.375], [0.552, -0.395]], true, 0.05);
    k.lay(lower, PK.beakD, { w: 0.15, passes: 2 });
    k.ink(lower, { k: 0.2 * kk });
    const upper = sp([[0.548, -0.575], [0.61, -0.585], [0.675, -0.545], [0.715, -0.475], [0.715, -0.41], [0.69, -0.37], [0.672, -0.415], [0.645, -0.452], [0.6, -0.468], [0.552, -0.462]], true, 0.05);
    k.lay(upper, PK.beak, { w: 0.18, passes: 2, ang: -0.6 });
    A.withMask(upper, () => {
      A.stroke([P(0.57, -0.55), P(0.64, -0.55), P(0.69, -0.49)], 'chalk', PK.beakL, { w: 0.04 * s, p: 0.85 });
      A.stroke([P(0.6, -0.467), P(0.66, -0.45), P(0.69, -0.39)], 'kajal', '#7a1a10', { w: 0.03 * s, p: 0.6 });
    });
    k.ink(upper, { k: 0.3 * kk });
    // the cere: a pale ring of skin at the base of the beak
    A.stroke([P(0.548, -0.57), P(0.555, -0.51), P(0.552, -0.46)], 'chalk', '#d8e0b0', { w: 0.025 * s, p: 0.8 });
  }

  M.w8x['joined'] = {
    ground,
    draw(Z, o) {
      const k = kit(Z, o), g = plan(o.bb);
      if (typeof process !== 'undefined' && process.env && process.env.J8DBG) console.log('joined bb', JSON.stringify(o.bb), 'w', g.w.toFixed(2), 'h', g.h.toFixed(2));
      // the whole doorway's ground burnished flat before it is painted
      k.burnish([rectP(g.x0 - 1.2, g.yCor - 0.4, g.x1 + 1.2, g.yb)]);
      const rm = room(k, g, o);
      lamp(k, g, o, rm.flame);
      frame(k, g, o);
      thread(k, g);
      cornice(k, g);
      toran(k, g);
      // the two parakeets lean in from the ends of the cornice until their beaks meet over the middle
      for (const [dx, s, f, rot] of BIRDS) parakeet(k, g.xc + dx, g.yCor + 0.05, s, f, rot);
    }
  };
})();
