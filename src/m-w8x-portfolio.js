(function () {
  'use strict';
  /* ==========================================================================
     PORTFOLIO, repainted for the gold well (well8k)
       M.w8x['portfolio'] = { ground(Z, o), draw(Z, o) }
     Six gilded makara heads hang from a carved marble beam and pour six ribbons of water into one long marble tank.
     The stage's frame Z only says where the foot of the tank's middle is.  Everything here is drawn straight onto the
     sheet in sheet units from that point, x to the right, y down: the tank's foot is y = 0, the top of its box y = -146,
     its sides x = -95 and 95.  So round things stay round, although the stage's frame is squashed.
       ground()  the bay behind becomes a deep indigo niche with a white flower border; the tank's shadow
       draw()    the beam, the heads, the water, the tank.  It is cut out for the card, so it is whole on any ground.
     The tools: pastel (tip and side), chalk, kajal, geru, gold (leaf, on this focal object only).
     ======================================================================== */
  M.w8x = M.w8x || {};
  const PI = Math.PI, TAU = 2 * PI;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  const K = {
    night: '#141c42', neel: '#1d2850', lapis: '#2a4b96', lapisD: '#203c80', lapisL: '#3e63b0',
    marble: '#f2e9d4', marbleSh: '#d6c8a8', marbleLt: '#fbf6ea', marbleD: '#b9a682',
    hingul: '#c63d2f', lac: '#8f2331', mal: '#3f7f52', malD: '#28583a', malL: '#6aa070',
    gold: '#d4a437', goldD: '#8e601a', goldL: '#f2d27a',
    ice: '#dcecef', aqua: '#86bccb', aquaD: '#4f8fa6', foam: '#f8f7ef',
    line: '#1a1412', umber: '#5a3a1e', pink: '#e8a0a4', rose: '#d06878', saffron: '#e88e1e', haldi: '#edc94b'
  };
  // the niche the stage's spout wall had (its panel is x -80.4..80.4, y -131.8..-48.6 from the tank's foot)
  const NI = { x0: -80.8, x1: 80.8, y0: -132.4, y1: -48.2 };
  // the beam: its bottom line rises from the ends to the middle; it rests on the bay's pillars at x = -86 and 86
  const BX = 86, B_END = -123.2, B_MID = -127.2, B_TH = 9;
  const beamBot = x => B_END + (B_MID - B_END) * (1 - (x / BX) * (x / BX));
  // each head's neck, |x|: the three on the left look left, the three on the right look right
  const NECKS = [54, 29, 4];
  // the tank, top to foot
  const TK = { rim: -58, w0: -55.4, w1: -44, cope1: -38, fr1: -33, pan1: -11, band1: -6, foot: 0 };

  // ---------------------------------------------------------------- small tools
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
  const rectP = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  // everything in one closure per call, so the sheet origin and the art object are at hand
  function kit(Z, o) {
    const A = Z.__base, O = Z.__pt([0, 0]), rr = A.rr;
    const P = (x, y) => [O[0] + x, O[1] + y];
    const all = pts => pts.map(p => { const q = P(p[0], p[1]); if (p.length > 2) q.push(p[2]); return q; });
    const glints = (o && o.G && o.G.glints) || [];
    const k = {
      A, O, P, all, rr,
      sp: (pts, closed, step) => A.spline(all(pts), closed, step || 0.25),
      // a flat ground laid with the tip of the stick in two crossing passes, rubbed into the tooth
      lay: (poly, c, o2) => A.fill(poly, 'pastel', c, Object.assign({ w: 1.2, p: 1, reach: 1.7, passes: 3, ang: -0.5, turn: 0.5, cv: 0.012, streak: 0.22 }, o2 || {})),
      gild: (poly, c, o2) => A.fill(poly, 'gold', c || K.gold, Object.assign({ w: 0.9, p: 1, reach: 1.45, passes: 2, ang: 0.4, turn: 0.6 }, o2 || {})),
      kaj: (pts, w, o2) => A.stroke(pts, 'kajal', K.line, Object.assign({ w: w || 0.3, p: 0.9, tin: 0.08, tout: 0.1 }, o2 || {})),
      leaf: (pts, w) => { A.stroke(pts, 'gold', K.goldL, { w: w || 0.45, p: 1, tin: 0.04, tout: 0.08 }); glints.push(pts[(pts.length / 2) | 0].slice(0, 2)); },
      leafDot: (x, y, w) => { A.dot(x, y, 'gold', K.goldL, { w: w || 0.7, p: 1 }); glints.push([x, y]); },
      glint: (x, y) => glints.push([x, y]),
      // an ellipse with enough points that a small one is round, not a polygon
      ell: (cx, cy, rx, ry, rot, a0, a1) => {
        ry = ry == null ? rx : ry; a0 = a0 == null ? 0 : a0; a1 = a1 == null ? TAU : a1; rot = rot || 0;
        const n = Math.max(18, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 0.18)), cr = Math.cos(rot), sr = Math.sin(rot), out = [];
        for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n, x = Math.cos(t) * rx, y = Math.sin(t) * ry; out.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); }
        return out;
      }
    };
    // the Mewar contour: one fine kajal line round the shape, and inside it further passes only where the form turns
    // away from the light (from the upper left), so the line swells under things and thins to a hair over lit tops
    k.ink = (poly, o2) => {
      o2 = o2 || {};
      const pts = A.resample(poly, o2.step || 0.35, true), n = pts.length;
      if (n < 8) return;
      const nrm = i => { const a = pts[(i - 2 + n) % n], b = pts[(i + 2) % n]; const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; };
      let vote = 0;
      for (let i = 0; i < n; i += Math.max(1, n / 30 | 0)) { const m = nrm(i); vote += A.inside([poly], pts[i][0] + m[0] * 0.3, pts[i][1] + m[1] * 0.3) ? 1 : -1; }
      const sg = vote >= 0 ? 1 : -1;
      const ph1 = rr(0, TAU), ph2 = rr(0, TAU), f1 = rr(0.012, 0.02), f2 = rr(0.05, 0.08), lx = -0.45, ly = -0.89;
      const wt = pts.map((p, i) => {
        const m = nrm(i), ox = -m[0] * sg, oy = -m[1] * sg, away = -(ox * lx + oy * ly);
        return clamp(0.45 + 0.6 * away + 0.16 * Math.sin(i * f1 * TAU + ph1) + 0.08 * Math.sin(i * f2 * TAU + ph2) + (o2.bias || 0), 0, 1);
      });
      const c = o2.c || K.line, kk = o2.k || 1;
      A.outline(pts, 'kajal', c, { closed: true, w: o2.w0 || 0.34, p: 0.92, pull: o2.pull || 40, again: 0.08 });
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
    // a small four-petal flower of chalk dots with a heart
    k.flower = (x, y, r, c, heart, p) => {
      const a0 = rr(0, 1);
      for (let i = 0; i < 4; i++) { const a = a0 + i * PI / 2; A.dot(x + Math.cos(a) * r, y + Math.sin(a) * r, 'chalk', c, { w: r * 1.05, p: p || 0.95 }); }
      A.dot(x, y, 'chalk', heart, { w: r * 0.8, p: 1 });
    };
    return k;
  }

  /* ================================================================ GROUND: the shadow, and a dark recess the screen sits in */
  // the screen's outline: its top runs just under the beam's top, so the beam covers it; its foot is behind the tank
  const screenPoly = (x0, x1, y1, lift) => { const out = []; for (let x = x0; x <= x1 + 1e-6; x += (x1 - x0) / 40) out.push([x, beamBot(x) - B_TH + lift]); out.push([x1, y1], [x0, y1]); return out; };
  function ground(Z, o) {
    const k = kit(Z, o), { A, all } = k;
    // the shadow the tank throws to the right on the parapet and the floor, and under its foot (light from the left)
    const SH = A.mix(K.umber, '#5a4048', 0.5);
    // a narrow, even glaze hugging the tank, rubbed smooth with the finger: a shadow, not a smudge
    const S1 = all([[90, -57], [96.6, -55.8], [97.2, -30], [97.2, -4], [96.4, 1.4], [90, 0.8]]), S2 = all([[-93, -0.2], [96.4, -0.2], [97.6, 1.5], [-91, 1.3]]);
    for (const poly of [S1, S2]) {
      A.fill(poly, 'shade', SH, { w: 0.9, p: 0.4, passes: 2, ang: poly === S1 ? 1.55 : 0, turn: 0.05, reach: 1.6, gap: 0.35, streak: 0 });
      A.blend(poly, { r: 1.3, k: 0.45, gap: 0.9, len: 12, ang: poly === S1 ? 1.55 : 0 });
    }
    // the recess, a little larger than the screen, so a dark reveal shows round it
    A.ground(all(screenPoly(NI.x0 - 0.6, NI.x1 + 0.6, NI.y1, 0.6)), K.night, { w: 5, edge: 0, top: 0, ang: -0.35, rub: 0 });
  }

  /* ================================================================ THE SCREEN behind the spouts: indigo, a trellis of gold
     hairlines, a white flower where every two lines cross and a gold seed in every diamond; a white border with a red
     flower vine down each side.  It is part of the fountain, so the cut-out is whole. */
  function screen(k) {
    const { A, P, all, rr } = k;
    const N = all(screenPoly(NI.x0, NI.x1, NI.y1, 1.4));
    A.ground(N, A.mix(K.night, K.neel, 0.45), { w: 4, edge: 0, top: 0.85, ang: -0.35, rub: 0, c2: A.mix(K.night, K.neel, 0.7) });
    const D = 8, yc = -92, bb = [NI.x0, -140, NI.x1, NI.y1];
    A.withMask(N, () => {
      // the beam's shadow across the top of the screen
      A.fill(all(screenPoly(NI.x0, NI.x1, -112, 1.4)), 'side', K.night, { w: 3, p: 0.45, passes: 1, ang: 0 });
      // the trellis
      for (let i = -32; i <= 32; i++) {
        A.stroke(all([[D * i - (bb[1] - yc), bb[1]], [D * i - (bb[3] - yc), bb[3]]]), 'gold', K.gold, { w: 0.15, p: 0.72, tin: 0, tout: 0 });
        A.stroke(all([[D * i + (bb[1] - yc), bb[1]], [D * i + (bb[3] - yc), bb[3]]]), 'gold', K.gold, { w: 0.15, p: 0.72, tin: 0, tout: 0 });
      }
      for (let i = -32; i <= 32; i++) for (let j = -32; j <= 32; j++) {
        const x = D * (i + j) / 2, y = yc + D * (i - j) / 2;
        if (x < bb[0] - 1 || x > bb[2] + 1 || y < bb[1] || y > bb[3] + 1) continue;
        const q = P(x + rr(-0.05, 0.05), y + rr(-0.05, 0.05));
        if (A.inside(N, q[0], q[1])) k.flower(q[0], q[1], 0.52 + rr(-0.04, 0.04), K.marbleLt, K.haldi, 0.95);
        const c = P(x + D / 2 + rr(-0.05, 0.05), y + rr(-0.05, 0.05));
        if (A.inside(N, c[0], c[1])) A.dot(c[0], c[1], 'chalk', A.mix(K.hingul, K.saffron, 0.3), { w: 0.42 + rr(-0.03, 0.03), p: 0.9 });
      }
    });
    // the border down each side: a white band with small red flowers on a green vine, edged in kajal and leaf
    for (const sg of [-1, 1]) {
      const xa = sg < 0 ? NI.x0 : NI.x1 - 3.4, xb = xa + 3.4, band = all(screenPoly(xa, xb, NI.y1, 1.4));
      k.lay(band, K.marbleLt, { w: 0.8, ang: 1.5 });
      const xm = (xa + xb) / 2, y0 = beamBot(xm) - B_TH + 1.4, vine = [];
      for (let y = y0; y <= NI.y1; y += 0.5) vine.push(P(xm + 0.75 * Math.sin((y - NI.y1) / 3.2 * PI), y));
      A.stroke(vine, 'chalk', K.mal, { w: 0.26, p: 0.9, tin: 0, tout: 0 });
      for (let y = NI.y1 - 2.4, i = 0; y > y0 + 1; y -= 3.2, i++) {
        const q = P(xm + (i % 2 ? 0.75 : -0.75), y);
        k.flower(q[0], q[1], 0.42 + rr(-0.03, 0.03), K.hingul, K.haldi, 1);
        const lq = P(xm + (i % 2 ? -0.7 : 0.7), y - 1.4);
        A.dot(lq[0], lq[1], 'chalk', K.malL, { w: 0.5, len: 0.4, ang: i % 2 ? 2.4 : 0.7, p: 0.9 });
      }
      k.kaj([P(xa, y0), P(xa, NI.y1)], 0.3, { tin: 0, tout: 0 });
      k.kaj([P(xb, y0), P(xb, NI.y1)], 0.3, { tin: 0, tout: 0 });
      const xi = sg < 0 ? xb + 0.45 : xa - 0.45;
      A.stroke([P(xi, y0), P(xi, NI.y1)], 'gold', K.gold, { w: 0.3, p: 0.95, tin: 0, tout: 0 });
    }
  }

  /* ================================================================ THE BEAM, with a lotus bracket under each head */
  function beam(k) {
    const { A, P, all, rr } = k;
    const top = [], bot = [];
    for (let x = -BX; x <= BX + 1e-6; x += 2) { top.push([x, beamBot(x) - B_TH]); bot.push([x, beamBot(x)]); }
    // the two ends turn down into a scroll on the pillar
    const shape = top.concat(bot.slice().reverse());
    const S = all(shape);
    k.lay(S, K.marble, { w: 1.4, ang: 0.1 });
    const band = (a, b) => { const out = []; for (let x = -BX + 0.5; x <= BX - 0.5 + 1e-6; x += 2) out.push([x, beamBot(x) - b]); for (let x = BX - 0.5; x >= -BX + 0.5 - 1e-6; x -= 2) out.push([x, beamBot(x) - a]); return all(out); };
    const line = d => { const out = []; for (let x = -BX + 0.4; x <= BX - 0.4 + 1e-6; x += 1) out.push([x, beamBot(x) - d]); return all(out); };
    A.withMask(S, () => {
      // shade under the top moulding and along the foot, the stick's side
      A.stroke(line(1.2), 'side', K.marbleSh, { w: 2.2, p: 0.5, tin: 0, tout: 0 });
      A.stroke(line(B_TH - 2.6), 'side', K.marbleSh, { w: 1.2, p: 0.4, tin: 0, tout: 0 });
    });
    // a vermilion band with white flowers and gold between
    const RB = band(2.4, 6.0);
    k.lay(RB, K.hingul, { w: 0.9, ang: 0.2 });
    A.withMask(RB, () => A.stroke(line(2.9), 'side', A.mix(K.hingul, K.lac, 0.55), { w: 1.1, p: 0.45, tin: 0, tout: 0 }));
    for (let x = -BX + 4; x <= BX - 4; x += 5.2) {
      const q = P(x, beamBot(x) - 4.2);
      k.flower(q[0], q[1], 0.55, K.marbleLt, K.haldi, 1);
      const g = P(x + 2.6, beamBot(x + 2.6) - 4.2);
      if (x + 2.6 < BX - 3) A.dot(g[0], g[1], 'gold', K.gold, { w: 0.55, p: 1 });
    }
    k.kaj(line(2.4), 0.26); k.kaj(line(6.0), 0.26);
    // the top: a row of red dots under a burnished edge
    for (let x = -BX + 2.5; x <= BX - 2.5; x += 2.2) { const q = P(x, beamBot(x) - 7.5); A.dot(q[0], q[1], 'chalk', K.hingul, { w: 0.5, p: 0.95 }); }
    k.leaf(line(B_TH - 0.5), 0.5);
    // the foot: small scallops hanging, each with a gold drop
    for (let x = -BX + 1.6; x <= BX - 1.6; x += 3.2) {
      const y0 = beamBot(x), arc = [];
      for (let t = 0; t <= 1.0001; t += 0.125) arc.push([x - 1.6 + 3.2 * t, y0 - 0.2 + 1.1 * Math.sin(t * PI)]);
      A.fill(all(arc), 'pastel', K.marble, { w: 0.5, p: 1, reach: 1.5, passes: 2 });
      k.kaj(all(arc), 0.24);
    }
    // the ends: a scroll on each pillar, gold edged
    for (const sg of [-1, 1]) {
      const cx = sg * (BX - 2.4), cy = B_END - 4.5, sc = [];
      for (let t = 0; t <= 1.0001; t += 0.04) { const a = -PI / 2 + sg * t * 1.75 * TAU, r = 3.6 * (1 - 0.72 * t); sc.push([cx + Math.cos(a) * r * sg, cy + Math.sin(a) * r]); }
      const disc = all(k.ell(cx, cy, 4.2, 4.6).map(p => [p[0], p[1]]));
      k.lay(disc, K.marble, { w: 0.8 });
      A.stroke(all(sc), 'gold', K.goldL, { w: 0.6, p: 1 });
      k.kaj(all(sc.map(p => [p[0] + 0.35, p[1] + 0.35])), 0.22);
      k.ink(disc, { k: 0.6 });
    }
    k.ink(S, { k: 1.1, w0: 0.38 });
  }

  // a head hangs this far under the beam's foot, at this size
  const HEAD_DROP = 4.6, HS = 1.1;
  // the head's own frame: u forward toward the snout, v down, d which way it looks
  const headF = (xn, yn, d) => (u, v) => [xn + d * u * HS, yn + v * HS];
  // piecewise straight line through [u, v] points, read at u
  const polyV = (pts, u) => { for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const a = pts[i - 1], b = pts[i], t = (u - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; } return pts[pts.length - 1][1]; };
  // the gilt of the heads: a flat body of shell gold laid as pastel, its shadow and its light; leaf only on the jewels
  const GB = { body: '#d9a63e', lt: '#f3d47a', dk: '#9a6820', deep: '#6e4512' };

  // the corbel a head hangs from: two marble steps under the beam, a red line and a bead row on each
  function bracket(k, xn, yn, d) {
    const { A, all, rr } = k, H = headF(xn, yn, d);
    const xa = xn + d * -0.6, xb = xn + d * 10.6, ys = yn - 2.3;
    const up = all([[xa, beamBot(xa) - 0.4], [xb, beamBot(xb) - 0.4], [xb, ys], [xa, ys]]);
    k.lay(up, K.marble, { w: 0.6, ang: 0 });
    A.withMask(up, () => A.stroke(all([[xa, ys - 0.5], [xb, ys - 0.5]]), 'side', K.marbleSh, { w: 1.0, p: 0.5, tin: 0, tout: 0 }));
    const yl = (beamBot(xn + d * 5) - 0.4 + ys) / 2;
    A.stroke(all([[xa + d * 0.8, yl + 0.55], [xb - d * 0.8, yl + 0.55]]), 'chalk', K.hingul, { w: 0.42, p: 0.95, tin: 0.05, tout: 0.05 });
    for (let i = 0; i < 8; i++) { const x = xa + d * (1.0 + i * 1.3 + rr(-0.05, 0.05)), q = k.P(x, beamBot(x) + 0.45); A.dot(q[0], q[1], 'chalk', K.hingul, { w: 0.34 + rr(-0.03, 0.03), p: 0.95 }); }
    k.ink(up, { k: 0.5, w0: 0.28 });
    const lo = all([H(1.2, -2.3), H(8.8, -2.3), H(7.8, 0.6), H(2.2, 0.6)]);
    k.lay(lo, K.marbleLt, { w: 0.5, ang: 0 });
    A.withMask(lo, () => A.stroke(all([H(1.6, 0.1), H(8.2, 0.1)]), 'side', K.marbleSh, { w: 0.9, p: 0.5, tin: 0, tout: 0 }));
    for (let i = 0; i < 4; i++) { const q = k.P(...H(2.9 + i * 1.45 + rr(-0.06, 0.06), -0.95)); A.dot(q[0], q[1], 'gold', K.gold, { w: 0.62 + rr(-0.05, 0.05), p: 1 }); }
    k.ink(lo, { k: 0.45, w0: 0.26 });
  }

  /* ================================================================ A MAKARA: the crocodile's open jaw, the elephant's
     trunk curled up over the snout, a round staring eye under a red brow, a jewelled collar, fish scales on the nape and
     a mane of leaves sweeping back.  About 33 units from the tip of the mane to the curl of the trunk. */
  function makara(k, xn, yn, d) {
    const { A, P, all, rr } = k, H = headF(xn, yn, d);
    // every head is drawn by hand: each point a hair off the last head's
    const hp = pts => pts.map(p => { const q = H(p[0] + (p[2] ? 0 : rr(-0.1, 0.1)), p[1] + (p[2] ? 0 : rr(-0.1, 0.1))); return q; });
    const SP = (pts, closed, st) => A.spline(all(hp(pts)), closed, st || 0.16);
    const L = (pts) => all(pts.map(p => H(p[0], p[1])));      // exact, for lines that must meet

    // ---- the mane: four leaves from the nape, sweeping back and curling, green, red, green, red
    const fronds = [
      { cl: [[4.4, 0.6], [0.8, -1.2], [-3.4, -1.0], [-6.2, 1.0], [-6.7, 3.7], [-5.2, 4.7], [-4.2, 3.6], [-4.7, 2.8]], c: K.mal, w0: 1.9 },
      { cl: [[2.6, 3.4], [-1.2, 3.2], [-4.6, 5.0], [-6.0, 7.9], [-5.0, 9.8], [-3.5, 9.4], [-3.4, 8.2], [-4.2, 8.0]], c: K.hingul, w0: 1.75 },
      { cl: [[1.4, 6.8], [-1.4, 7.9], [-3.3, 10.4], [-3.1, 13.1], [-1.6, 13.9], [-0.6, 12.9], [-1.2, 12.1]], c: K.mal, w0: 1.6 },
      { cl: [[2.6, 10.2], [0.6, 12.2], [0.2, 14.7], [1.6, 16.0], [2.9, 15.3], [2.5, 14.3]], c: K.hingul, w0: 1.35 }
    ];
    for (const f of fronds) {
      const cl = SP(f.cl, false, 0.14), R = ribbon(cl, t => lerp(f.w0, 0.34, Math.pow(t, 0.75)));
      k.lay(R, f.c, { w: 0.5, ang: 0.8 });
      const lit = R.L.reduce((s, p) => s + p[0] + p[1], 0) < R.R.reduce((s, p) => s + p[0] + p[1], 0) ? R.L : R.R, dark = lit === R.L ? R.R : R.L;
      A.withMask(R, () => {
        A.stroke(dark, 'side', A.mix(f.c, K.line, 0.42), { w: 1.0, p: 0.55 });
        A.stroke(lit.slice(0, Math.floor(lit.length * 0.7)), 'chalk', A.mix(f.c, '#ffffff', 0.35), { w: 0.4, p: 0.7, tin: 0.1, tout: 0.4 });
      });
      const rib = cl.slice(0, Math.floor(cl.length * 0.8));
      A.stroke(rib, 'gold', K.goldL, { w: 0.3, p: 0.95, tin: 0.05, tout: 0.3 });
      for (const q of A.along(cl.slice(0, Math.floor(cl.length * 0.68)), 1.05, 0)) if (q.i % 2 === 1) A.dot(q.x, q.y, 'chalk', K.marbleLt, { w: 0.3 + rr(-0.03, 0.03), p: 0.95 });
      k.ink(R, { k: 0.5, w0: 0.28 });
    }

    // ---- the open mouth: the red inside, a curled tongue
    const LIP = [[9.6, 9.8], [13.5, 8.4], [18, 7.8], [22.6, 7.6]];
    const JAWT = [[9.0, 10.6], [13, 11.4], [17.5, 12.1], [20.4, 12.3], [21.8, 11.8]];
    const MOUTH = SP(LIP.concat([[22.9, 9.8]], JAWT.slice().reverse()), true, 0.14);
    k.lay(MOUTH, K.lac, { w: 0.45 });
    A.withMask(MOUTH, () => {
      A.stroke(SP([[10.6, 10.2], [14, 10.5], [17.4, 10.6], [19.4, 9.9], [19.9, 9.2]], false), 'pastel', K.rose, { w: 1.1, p: 0.95, tin: 0.1, tout: 0.3 });
      A.stroke(SP([[11, 10.0], [15, 10.2], [18.6, 10.0]], false), 'chalk', A.mix(K.rose, '#ffffff', 0.3), { w: 0.22, p: 0.8 });
    });
    // ---- the lower jaw, gilt, and its teeth
    const JAW = SP(JAWT.concat([[22.4, 12.9], [21.4, 14.3], [17.4, 15.0], [12.6, 14.8], [8.8, 13.4], [8.0, 11.8]]), true, 0.14);
    k.lay(JAW, GB.body, { w: 0.5, ang: 0.3 });
    A.withMask(JAW, () => {
      A.stroke(SP([[8.8, 14.2], [13, 15.4], [18, 15.4], [21.6, 14.0]], false), 'side', GB.dk, { w: 1.6, p: 0.55 });
      A.stroke(SP([[10.2, 11.4], [14, 12.2], [18, 12.9], [20.8, 12.9]], false), 'chalk', GB.lt, { w: 0.5, p: 0.75, tin: 0.2, tout: 0.3 });
    });
    for (let u = 11.6, i = 0; u <= 20.4; u += 1.28 + rr(-0.08, 0.08), i++) {
      const v = polyV(JAWT, u), h = 0.95 + rr(-0.1, 0.1) - (u > 19.5 ? 0.15 : 0);
      const tth = L([[u - 0.42, v + 0.15], [u + 0.05 * d, v - h], [u + 0.42, v + 0.15]]);
      A.fill(tth, 'chalk', K.marbleLt, { w: 0.28, p: 1, reach: 1.6, passes: 2 });
      A.outline(tth, 'kajal', K.line, { closed: true, w: 0.15, p: 0.75, pull: 30 });
    }
    // a row of white dots along the jaw's foot
    for (const q of A.along(SP([[10.4, 13.6], [14, 14.2], [18, 14.2], [20.6, 13.4]], false), 1.05, 0)) A.dot(q.x, q.y, 'chalk', K.marbleLt, { w: 0.3 + rr(-0.03, 0.03), p: 0.95 });
    k.ink(JAW, { k: 0.6, w0: 0.3 });

    // ---- the head: nape, crown, brow, the long snout to the root of the trunk, the lip, the jowl
    const HEAD = SP([[-0.8, 5.0], [0.0, 2.0], [2.5, 0.4], [6.0, -0.2], [9.5, 0.3], [12.0, 1.4], [14.5, 2.9], [18.0, 3.6], [21.0, 4.2], [23.0, 5.0], [23.6, 6.4]]
      .concat(LIP.slice().reverse().map(p => [p[0], p[1], 1]), [[8.0, 11.6], [5.0, 12.6], [1.8, 11.4], [-0.6, 8.4]]), true, 0.14);
    k.lay(HEAD, GB.body, { w: 0.6, ang: 0.45 });
    A.withMask(HEAD, () => {
      // the shadow under the jowl and along the lip, the light along the crown and the top of the snout
      A.stroke(SP([[0.4, 10.8], [4.8, 13.0], [9.0, 11.2]], false), 'side', GB.dk, { w: 2.6, p: 0.55 });
      A.stroke(SP([[11, 8.9], [16, 8.0], [22.4, 7.5]], false), 'side', GB.dk, { w: 1.3, p: 0.5 });
      A.stroke(SP([[1.2, 1.6], [5.5, 0.4], [9.6, 0.9], [13.6, 2.7], [18, 4.2], [21.4, 4.9]], false), 'chalk', GB.lt, { w: 0.75, p: 0.8, tin: 0.15, tout: 0.3 });
      // fish scales on the nape: three rows, counted, each scale a hairline arc with a dot of light
      for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
        const u = 0.5 + c * 1.5 + (r % 2 ? 0.75 : 0), v = 4.4 + r * 1.45;
        if (u > 2.9) continue;
        A.stroke(all(k.ell(...H(u, v), 0.72, 0.62, 0, 0.12 * PI, 0.88 * PI)), 'chalk', GB.deep, { w: 0.17, p: 0.85 });
        const q = P(...H(u, v - 0.2)); A.dot(q[0], q[1], 'chalk', GB.lt, { w: 0.24, p: 0.8 });
      }
      // wrinkles across the top of the snout
      for (const u of [15.6, 17.1, 18.6, 20.1]) A.stroke(L([[u, polyV([[14.5, 2.9], [18, 3.6], [21, 4.2]], u) + 0.25], [u - 0.35 * 1, polyV([[14.5, 2.9], [18, 3.6], [21, 4.2]], u) + 1.5]]), 'kajal', GB.deep, { w: 0.18, p: 0.85, tin: 0.1, tout: 0.5 });
      // a row of white dots just inside the lip, above the teeth
      for (const q of A.along(SP([[11.4, 8.75], [15, 7.95], [18.5, 7.4], [21.6, 7.15]], false), 0.95, 0)) A.dot(q.x, q.y, 'chalk', K.marbleLt, { w: 0.28 + rr(-0.03, 0.03), p: 0.95 });
    });
    // the jewelled collar between the face and the mane: red, edged with leaf, a row of white pearls down it
    const ccl = SP([[3.9, 0.3], [3.0, 3.2], [2.8, 6.4], [3.3, 9.4], [4.1, 12.1]], false, 0.14), CB = ribbon(ccl, t => 0.72 + 0.1 * Math.sin(t * PI));
    A.withMask(HEAD, () => {
      k.lay(CB, K.hingul, { w: 0.4, ang: 1.5 });
      A.stroke(CB.L, 'gold', K.goldL, { w: 0.32, p: 1, tin: 0, tout: 0 });
      A.stroke(CB.R, 'gold', K.goldL, { w: 0.32, p: 1, tin: 0, tout: 0 });
      for (const q of A.along(ccl, 1.0, 0)) A.dot(q.x, q.y, 'chalk', K.marbleLt, { w: 0.4 + rr(-0.03, 0.03), p: 1 });
    });
    k.kaj(CB.L, 0.2, { p: 0.85 }); k.kaj(CB.R, 0.2, { p: 0.85 });
    // the whorl on the cheek, a spiral in kajal with a leaf line in it and pearls round its outer turn
    const wc = [6.6, 8.2], spi = [], spg = [];
    for (let t = 0; t <= 1.0001; t += 0.01) { const a = -PI * 0.15 + t * 3.3 * PI, r = 2.3 * (1 - 0.85 * t); spi.push(H(wc[0] + Math.cos(a) * r, wc[1] + Math.sin(a) * r * 0.9)); if (t < 0.6) spg.push(H(wc[0] + Math.cos(a) * (r - 0.38), wc[1] + Math.sin(a) * (r - 0.38) * 0.9)); }
    A.stroke(all(spg), 'gold', K.goldL, { w: 0.28, p: 0.95 });
    A.stroke(all(spi), 'kajal', K.line, { w: 0.26, p: 0.92, tin: 0.05, tout: 0.3 });
    for (let i = 0; i < 6; i++) { const a = -PI * 0.75 + i * 0.36 * PI, q = P(...H(wc[0] + Math.cos(a) * 2.95, wc[1] + Math.sin(a) * 2.65)); A.dot(q[0], q[1], 'chalk', K.marbleLt, { w: 0.3 + rr(-0.03, 0.03), p: 0.95 }); }
    // the upper teeth hanging from the lip, and the fang at the front
    for (let u = 12.0; u <= 20.6; u += 1.3 + rr(-0.08, 0.08)) {
      const v = polyV(LIP, u), h = 1.15 + rr(-0.1, 0.1);
      const tth = L([[u - 0.44, v - 0.1], [u + 0.44, v - 0.1], [u + 0.06, v + h]]);
      A.fill(tth, 'chalk', K.marbleLt, { w: 0.28, p: 1, reach: 1.6, passes: 2 });
      A.outline(tth, 'kajal', K.line, { closed: true, w: 0.15, p: 0.75, pull: 30 });
    }
    const FANG = A.spline(L([[21.0, 7.5], [22.5, 7.4], [22.6, 9.4], [22.0, 11.0], [21.5, 9.2]]), true, 0.12);
    A.fill(FANG, 'chalk', K.marbleLt, { w: 0.32, p: 1, reach: 1.6, passes: 2 });
    A.stroke(L([[22.2, 8.0], [22.1, 9.8]]), 'chalk', K.marbleSh, { w: 0.25, p: 0.7 });
    A.outline(FANG, 'kajal', K.line, { closed: true, w: 0.18, p: 0.85, pull: 30 });
    k.ink(HEAD, { k: 0.75, w0: 0.34 });

    // ---- the eye: round and staring, a heavy lid of leaf, the red brow above curling into a scroll
    // an almond eye, the pupil high under the lid, the kajal drawn out to the temple
    const EYE = A.spline(L([[10.5, 4.75], [11.6, 3.75], [13.2, 3.45], [14.9, 4.15], [13.5, 5.3], [11.8, 5.35]]), true, 0.08);
    A.fill(EYE, 'chalk', K.marbleLt, { w: 0.3, p: 1, reach: 1.7, passes: 2 });
    A.withMask(EYE, () => {
      A.stroke(L([[10.6, 3.9], [12.7, 3.5], [14.8, 4.0]]), 'side', K.marbleSh, { w: 0.7, p: 0.5 });
      const PU = all(k.ell(0, 0, 0.86, 0.86).map(p => H(13.2 + p[0], 4.3 + p[1])));
      A.fill(PU, 'kajal', K.line, { w: 0.3, p: 1, reach: 1.7, passes: 2 });
      const HL = all(k.ell(0, 0, 0.22, 0.22).map(p => H(13.5 + p[0], 3.95 + p[1])));
      A.fill(HL, 'chalk', K.marbleLt, { w: 0.2, p: 1, reach: 1.7, passes: 2 });
      A.stroke(L([[10.6, 4.75], [11.25, 4.9]]), 'chalk', K.hingul, { w: 0.36, p: 0.9 });
    });
    A.outline(EYE, 'kajal', K.line, { closed: true, w: 0.22, p: 0.92, pull: 40 });
    A.stroke(L([[10.6, 4.72], [9.9, 4.55], [9.2, 4.6]]), 'kajal', K.line, { w: 0.3, p: 0.92, tin: 0, tout: 0.7 });
    A.stroke(L([[10.4, 4.3], [11.6, 3.3], [13.2, 3.0], [15.0, 3.75]]), 'gold', K.goldL, { w: 0.6, p: 1, tin: 0.1, tout: 0.2 });
    k.kaj(L([[10.3, 4.1], [11.6, 3.0], [13.2, 2.68], [15.1, 3.5]]), 0.3);
    const bcl = SP([[15.4, 2.6], [13.6, 1.4], [11.6, 0.9], [9.7, 1.3], [8.6, 2.4], [8.8, 3.6], [9.8, 3.6], [9.9, 2.8]], false, 0.12);
    const BR = ribbon(bcl, t => lerp(0.62, 0.22, t));
    k.lay(BR, K.hingul, { w: 0.35 });
    A.stroke(bcl.slice(2, Math.floor(bcl.length * 0.6)), 'gold', K.goldL, { w: 0.2, p: 0.95 });
    k.ink(BR, { k: 0.35, w0: 0.22 });

    // ---- the trunk, rising from the snout and curling back over it, ringed
    const tcl = SP([[20.6, 5.7], [24.4, 5.0], [26.2, 3.0], [26.2, 0.4], [24.6, -1.3], [22.4, -1.2], [21.4, 0.4], [22.2, 1.8], [23.6, 1.5], [23.6, 0.5]], false, 0.12);
    const tw = t => lerp(1.95, 0.42, Math.pow(t, 0.85)), TR = ribbon(tcl, tw);
    k.lay(TR, GB.body, { w: 0.45, ang: 1.2 });
    const outer = TR.L.reduce((s, p) => s + Math.hypot(p[0] - P(...H(23.6, 1.6))[0], p[1] - P(...H(23.6, 1.6))[1]), 0) > TR.R.reduce((s, p) => s + Math.hypot(p[0] - P(...H(23.6, 1.6))[0], p[1] - P(...H(23.6, 1.6))[1]), 0) ? TR.L : TR.R;
    const inner = outer === TR.L ? TR.R : TR.L;
    A.withMask(TR, () => {
      A.stroke(outer, 'side', GB.dk, { w: 1.0, p: 0.55 });
      A.stroke(inner.slice(4, Math.floor(inner.length * 0.7)), 'chalk', GB.lt, { w: 0.42, p: 0.8, tin: 0.2, tout: 0.3 });
      const n = tcl.length;
      for (let i = Math.floor(n * 0.12); i < n * 0.74; i += Math.max(3, Math.round(n / 15))) {
        const a = tcl[Math.max(0, i - 1)], b = tcl[Math.min(n - 1, i + 1)], nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1, w = tw(i / (n - 1));
        A.stroke([[tcl[i][0] + nx / l * w, tcl[i][1] + ny / l * w], [tcl[i][0] - nx / l * w, tcl[i][1] - ny / l * w]], 'kajal', GB.deep, { w: 0.17, p: 0.85, tin: 0.15, tout: 0.15 });
      }
    });
    // the trunk's outline, open at its root where it grows out of the snout
    const skip = Math.floor(TR.L.length * 0.1);
    A.stroke(outer.slice(skip), 'kajal', K.line, { w: 0.42, p: 0.92, tin: 0.08, tout: 0.04 });
    A.stroke(inner.slice(skip), 'kajal', K.line, { w: 0.3, p: 0.9, tin: 0.08, tout: 0.04 });
    A.stroke([TR.L[TR.L.length - 1], TR.R[TR.R.length - 1]], 'kajal', K.line, { w: 0.28, p: 0.9, tin: 0, tout: 0 });
    // a burnished touch on the lid and the crown, which the page lets twinkle
    const g1 = P(...H(12.4, 2.95)), g2 = P(...H(6.2, 0.5));
    A.dot(g1[0], g1[1], 'gold', K.goldL, { w: 0.55, p: 1 }); k.glint(g1[0], g1[1]);
    A.dot(g2[0], g2[1], 'gold', K.goldL, { w: 0.5, p: 1 }); k.glint(g2[0], g2[1]);
  }

  // where each head's water leaves its mouth, and where it falls into the tank
  function streams() {
    const out = [];
    for (const sg of [-1, 1]) for (const n of NECKS) {
      const xn = sg * n, yn = beamBot(xn) + HEAD_DROP, d = sg, t = n / 58, H = headF(xn, yn, d);
      out.push({ xn, yn, d, path: [H(20.6, 10.2), H(22.5, 11.1)], land: [xn + d * 27.9 * HS, TK.w0 + 6.2 - 2.0 * t] });
    }
    return out;
  }

  /* ================================================================ THE WATER: ribbons with a kajal edge, three
     lines of white running down each, a few chosen drops */
  function ribbonWater(k, s, i) {
    const { A, all, rr } = k, d = s.d, [lx, ly] = s.land, [x0, y0] = s.path[1];
    // a jet leaving the lip a little downward and bending into its fall: x = x0 + a t, y = y0 + b t + c t^2
    const a = lx - x0, b = 1.3 * Math.abs(a), c = ly - y0 - b, jet = [s.path[0]];
    for (let t = 0; t <= 1.0001; t += 0.025) { const u = t * t * 0.35 + t * 0.65; jet.push([x0 + a * u, y0 + b * u + c * u * u]); }
    const cl = A.spline(all(jet), false, 0.3);
    // thin where it slips out between the teeth, full once it is over the lip
    const wf = t => (t < 0.05 ? lerp(0.45, 1.1, Math.sin(t / 0.05 * PI / 2)) : lerp(1.1, 2.3, Math.pow((t - 0.05) / 0.95, 0.55))) * (1 + 0.05 * Math.sin(t * 17 + i)), R = ribbon(cl, wf), n = cl.length;
    k.lay(R, K.ice, { w: 0.7, ang: 1.45, turn: 0.3 });
    // which edge is in shadow: the one farther from the light (the light comes from the upper left)
    const sx = e => e.reduce((a, p) => a + p[0], 0) / e.length, shadow = sx(R.L) > sx(R.R) ? R.L : R.R, lit = shadow === R.L ? R.R : R.L, sgn = shadow === R.L ? 1 : -1;
    const lane = (f, a0, a1, amp, ph) => {
      const out = [];
      for (let j = Math.floor(a0 * (n - 1)); j <= Math.floor(a1 * (n - 1)); j++) {
        const a = cl[Math.max(0, j - 1)], b = cl[Math.min(n - 1, j + 1)], nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1;
        const t = j / (n - 1), off = (f + amp * Math.sin(t * 21 + ph)) * wf(t) * sgn;
        out.push([cl[j][0] + nx / l * off, cl[j][1] + ny / l * off]);
      }
      return out;
    };
    A.withMask(R, () => {
      A.stroke(shadow, 'pastel', K.aqua, { w: 1.5, p: 0.8, tin: 0.04, tout: 0 });
      A.stroke(lane(0.62, 0.02, 1, 0.05, 1), 'chalk', K.aquaD, { w: 0.28, p: 0.7, tin: 0.1, tout: 0 });
      // the middle line, broken twice where the water twists
      for (const [a0, a1] of [[0.03, 0.31], [0.36, 0.63], [0.68, 0.97]]) A.stroke(lane(0.02, a0, a1, 0.16, 0.4 + i), 'chalk', K.foam, { w: 0.4, p: 0.95, tin: 0.15, tout: 0.25 });
      A.stroke(lane(-0.55, 0.05, 0.95, 0.06, 2 + i), 'chalk', K.foam, { w: 0.28, p: 0.9, tin: 0.1, tout: 0.2 });
    });
    const s0 = Math.floor(n * 0.045);
    k.kaj(shadow.slice(s0), 0.3, { p: 0.88, tin: 0.04, tout: 0.04 });
    k.kaj(lit.slice(s0), 0.22, { p: 0.85, tin: 0.04, tout: 0.04 });
    // three chosen drops thrown off the ribbon, low down, each a tear of chalk with a hairline under it
    for (const [t, side, off] of [[0.6, 1, 3.0], [0.72, -1, 3.4], [0.84, 1, 2.6]]) {
      const q = cl[Math.floor((n - 1) * t)], x = q[0] + side * (off + wf(t)) * 0.8, y = q[1] + rr(-0.2, 0.2);
      A.stroke([[x, y], [x + side * 0.12, y + 0.95]], 'chalk', K.foam, { w: 0.36, p: 0.95, tin: 0.5, tout: 0.1 });
      A.stroke([[x + side * 0.22, y + 0.3], [x + side * 0.24, y + 0.95]], 'kajal', K.aquaD, { w: 0.12, p: 0.6 });
    }
  }
  // where a ribbon strikes the water: two counted rings, a little foam, a crown of seven drops
  function splash(k, s) {
    const { A, P, rr } = k, [lx, ly] = s.land, L = P(lx, ly);
    A.stroke(k.ell(L[0], L[1] + 0.6, 6.2, 1.7, 0, PI * 0.05, PI * 0.95), 'chalk', K.ice, { w: 0.3, p: 0.8 });
    A.stroke(k.ell(L[0], L[1] + 0.3, 4.3, 1.2, 0, 0, TAU), 'chalk', K.foam, { w: 0.32, p: 0.9 });
    A.fill(k.ell(L[0], L[1], 2.8, 0.9), 'chalk', K.foam, { w: 0.45, p: 1, reach: 1.6, passes: 2, ang: 0 });
    for (let j = -3; j <= 3; j++) {
      const a = -PI / 2 + j * 0.36, r0 = 1.3, r1 = (3.1 - Math.abs(j) * 0.22) * (j % 2 ? 0.9 : 1);
      const p0 = [L[0] + Math.cos(a) * r0 * 1.4, L[1] - 0.4 + Math.sin(a) * r0], p1 = [L[0] + Math.cos(a) * r1 * 1.4, L[1] - 0.4 + Math.sin(a) * r1];
      A.stroke([p0, [lerp(p0[0], p1[0], 0.6) + Math.cos(a) * 0.2, lerp(p0[1], p1[1], 0.6) - 0.15], p1], 'chalk', K.foam, { w: 0.32, p: 0.95, tin: 0.1, tout: 0.45 });
      if (Math.abs(j) > 1) A.dot(p1[0] + Math.cos(a) * 0.8, p1[1] + Math.sin(a) * 0.5 - 0.3, 'chalk', K.foam, { w: 0.3, p: 0.9 });
    }
  }

  /* ================================================================ THE TANK */
  function tank(k, S) {
    const { A, P, all, rr } = k;
    const X = 90;
    // ---- the rim seen from above, and the water it holds
    const RIM = all(rectP(-X, TK.rim, X, TK.w1));
    k.lay(RIM, K.marble, { w: 1.2, ang: 0 });
    const WAT = all(rectP(-X + 2.6, TK.w0, X - 2.6, TK.w1 + 0.5));
    k.lay(WAT, K.lapis, { w: 1.2, ang: 0.15 });
    A.withMask(WAT, () => {
      // deeper under the far rim, a lighter band where the sky lies on it
      A.stroke(all([[-X, TK.w0 + 0.9], [X, TK.w0 + 0.9]]), 'side', K.lapisD, { w: 2.2, p: 0.6, tin: 0, tout: 0 });
      A.stroke(all([[-X, TK.w1 - 3.2], [X, TK.w1 - 3.2]]), 'side', K.lapisL, { w: 2.0, p: 0.35, tin: 0, tout: 0 });
      // rows of white scallops, the Mewar way of drawing still water
      for (let r = 0, y = TK.w0 + 2.0; y < TK.w1; y += 2.55, r++) for (let x = -X + 3 + (r % 2 ? 1.7 : 0); x < X - 2; x += 3.4) {
        if (S.some(s => Math.abs(x - s.land[0]) < 5.5 && Math.abs(y - s.land[1]) < 2.2)) continue;
        const q = P(x + rr(-0.15, 0.15), y + rr(-0.1, 0.1));
        A.stroke(k.ell(q[0], q[1], 1.45, 0.95, 0, PI * 1.08, PI * 1.92), 'chalk', A.mix(K.ice, K.lapisL, 0.15), { w: 0.22, p: rr(0.65, 0.85) });
      }
    });
    k.kaj(all([[-X + 2.6, TK.w0], [X - 2.6, TK.w0]]), 0.3);
    for (const sg of [-1, 1]) k.kaj(all([[sg * (X - 2.6), TK.w0], [sg * (X - 2.6), TK.w1]]), 0.26);
    // gold dots on the rim
    for (let x = -X + 3; x <= X - 3; x += 4.4) { const q = P(x, TK.rim + 1.2); A.dot(q[0], q[1], 'gold', K.gold, { w: 0.5, p: 1 }); }
    return { WAT };
  }
  function waterLife(k, S) {
    const { A, P, all, rr } = k;
    // lotus pads, two buds and a marigold, clear of where the water falls
    const pads = [[-70, -50.6, 3.4], [-43, -47.8, 3.0], [-15, -51.4, 2.6], [17, -47.6, 3.2], [42, -52.0, 2.6], [69, -48.4, 3.4]];
    for (const [x, y, r] of pads) {
      const c = P(x, y), pts = [];
      for (let t = 0.07; t <= 0.93 + 1e-6; t += 0.04) { const a = t * TAU + 0.6; pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.38]); }
      pts.push(c);
      k.lay(pts, A.mix(K.mal, K.malL, rr(0, 0.4)), { w: 0.6, ang: 0 });
      A.withMask(pts, () => A.stroke([[c[0] - r, c[1] + r * 0.2], [c[0] + r, c[1] + r * 0.2]], 'side', K.malD, { w: 0.9, p: 0.5 }));
      for (let m = 0; m < 5; m++) { const a = m / 5 * TAU + 1.2; A.stroke([c, [c[0] + Math.cos(a) * r * 0.75, c[1] + Math.sin(a) * r * 0.28]], 'chalk', K.malD, { w: 0.16, p: 0.7 }); }
      A.outline(pts, 'kajal', K.line, { closed: true, w: 0.22, p: 0.85 });
    }
    for (const [x, y] of [[-23, -52.4], [47, -51.2]]) {
      const b = P(x, y);
      A.stroke([[b[0], b[1] + 2.2], [b[0] + 0.3, b[1]]], 'chalk', K.malD, { w: 0.3, p: 0.9 });
      const bud = A.spline([[b[0], b[1] + 0.3], [b[0] - 1.3, b[1] - 1.2], [b[0], b[1] - 3.4], [b[0] + 1.3, b[1] - 1.2]], true, 0.12);
      A.fill(bud, 'chalk', K.pink, { w: 0.4, p: 1, reach: 1.5, passes: 2 });
      A.stroke([[b[0], b[1] - 3.2], [b[0] + 0.4, b[1] - 1.4]], 'chalk', K.rose, { w: 0.5, p: 0.9 });
      A.stroke([[b[0] - 0.3, b[1] - 0.6], [b[0] - 0.2, b[1] - 2.4]], 'chalk', K.marbleLt, { w: 0.22, p: 0.8 });
      A.outline(bud, 'kajal', K.line, { closed: true, w: 0.2, p: 0.85 });
    }
    const mg = P(3, -49.2);
    A.stroke(k.ell(mg[0], mg[1] + 0.5, 3.6, 0.9), 'chalk', K.ice, { w: 0.22, p: 0.6 });
    for (let m = 0; m < 12; m++) { const a = m / 12 * TAU; A.dot(mg[0] + Math.cos(a) * 1.2, mg[1] - 0.4 + Math.sin(a) * 0.55, 'pastel', m % 2 ? K.saffron : '#e8641e', { w: 0.9, p: 1 }); }
    A.dot(mg[0], mg[1] - 0.5, 'pastel', '#f6a020', { w: 1.1, p: 1 });
    A.dot(mg[0] - 0.3, mg[1] - 0.8, 'chalk', '#ffd060', { w: 0.45, p: 0.9 });
  }
  function tankFront(k) {
    const { A, P, all, rr } = k;
    // ---- the coping, a band of marble with a burnished edge and a row of gold beads
    const COPE = all(rectP(-94, TK.w1, 94, TK.cope1));
    k.lay(COPE, K.marbleLt, { w: 1.1, ang: 0 });
    A.withMask(COPE, () => A.stroke(all([[-94, TK.cope1 - 0.8], [94, TK.cope1 - 0.8]]), 'side', K.marbleSh, { w: 1.5, p: 0.5, tin: 0, tout: 0 }));
    for (let x = -92; x <= 92; x += 2.3) {
      const q = P(x, (TK.w1 + TK.cope1) / 2 + 0.3);
      A.dot(q[0], q[1], 'gold', K.gold, { w: 0.85, p: 1 });
      A.dot(q[0] + 0.15, q[1] + 0.32, 'kajal', K.umber, { w: 0.3, p: 0.7 });
    }
    k.leaf(all([[-93.6, TK.w1 + 0.35], [0, TK.w1 + 0.35], [93.6, TK.w1 + 0.35]]), 0.55);
    for (const x of [-60, 0, 60]) k.glint(...P(x, TK.w1 + 0.35));
    // ---- the frieze: vermilion, white flowers, gold between
    const FR = all(rectP(-92, TK.cope1, 92, TK.fr1));
    k.lay(FR, K.hingul, { w: 0.9, ang: 0.1 });
    A.withMask(FR, () => A.stroke(all([[-92, TK.cope1 + 0.7], [92, TK.cope1 + 0.7]]), 'side', A.mix(K.hingul, K.lac, 0.6), { w: 1.2, p: 0.5, tin: 0, tout: 0 }));
    for (let x = -88.5, i = 0; x <= 88.5; x += 3.5, i++) {
      const q = P(x, (TK.cope1 + TK.fr1) / 2);
      if (i % 2 === 0) k.flower(q[0], q[1], 0.62, K.marbleLt, K.haldi, 1);
      else A.dot(q[0], q[1], 'gold', K.gold, { w: 0.6, p: 1 });
    }
    // ---- the face: marble, five lapis panels between six pilasters
    const FACE = all(rectP(-92, TK.fr1, 92, TK.pan1));
    k.lay(FACE, K.marble, { w: 1.2, ang: 1.2 });
    A.withMask(FACE, () => {
      A.stroke(all([[-92, TK.fr1 + 1.2], [92, TK.fr1 + 1.2]]), 'side', K.marbleSh, { w: 1.6, p: 0.55, tin: 0, tout: 0 });
      A.stroke(all([[30, TK.pan1 - 3], [92, TK.pan1 - 3]]), 'side', K.marbleSh, { w: 6, p: 0.2, tin: 0.2, tout: 0 });
    });
    const PW = 4, gap = (176 - 6 * PW) / 5;
    for (let j = 0; j < 6; j++) {
      const x0 = -88 + j * (gap + PW);
      // a pilaster: a red line down its middle, a gold dot for its capital and its base
      const pm = (TK.fr1 + TK.pan1) / 2;
      A.stroke(all([[x0 + PW / 2, TK.fr1 + 2.6], [x0 + PW / 2, pm - 1.5]]), 'chalk', K.hingul, { w: 0.4, p: 0.9, tin: 0, tout: 0.1 });
      A.stroke(all([[x0 + PW / 2, pm + 1.5], [x0 + PW / 2, TK.pan1 - 2.6]]), 'chalk', K.hingul, { w: 0.4, p: 0.9, tin: 0.1, tout: 0 });
      { const q = P(x0 + PW / 2, pm); k.flower(q[0], q[1], 0.55 + rr(-0.04, 0.04), K.hingul, K.gold, 1); }
      for (const y of [TK.fr1 + 1.5, TK.pan1 - 1.5]) { const q = P(x0 + PW / 2, y); A.dot(q[0], q[1], 'gold', K.gold, { w: 0.8, p: 1 }); }
      k.kaj(all([[x0, TK.fr1], [x0, TK.pan1]]), 0.22, { tin: 0, tout: 0 });
      k.kaj(all([[x0 + PW, TK.fr1], [x0 + PW, TK.pan1]]), 0.22, { tin: 0, tout: 0 });
      if (j === 5) break;
      const px0 = x0 + PW + 0.9, px1 = x0 + PW + gap - 0.9, py0 = TK.fr1 + 2.0, py1 = TK.pan1 - 2.0;
      const PAN = all(rectP(px0, py0, px1, py1));
      k.lay(PAN, K.lapis, { w: 0.9, ang: 0.5 });
      A.withMask(PAN, () => A.stroke(all([[px0, py0 + 1], [px1, py0 + 1]]), 'side', K.lapisD, { w: 1.6, p: 0.55, tin: 0, tout: 0 }));
      // a white dot row inside a gold frame
      A.outline(PAN, 'gold', K.gold, { closed: true, w: 0.5, p: 1, pull: 30 });
      for (const q of A.along(all([[px0 + 1.1, py0 + 1.1], [px1 - 1.1, py0 + 1.1], [px1 - 1.1, py1 - 1.1], [px0 + 1.1, py1 - 1.1], [px0 + 1.1, py0 + 1.1]]), 1.25, 0.04)) A.dot(q.x, q.y, 'chalk', K.marbleLt, { w: 0.3, p: 0.9 });
      // the lotus medallion: eight white petals, red inside, a gold heart
      const cx = (px0 + px1) / 2, cy = (py0 + py1) / 2, C = P(cx, cy), R = 5.6;
      for (let m = 0; m < 8; m++) {
        const a = m / 8 * TAU - PI / 2, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
        const pet = A.spline([[C[0] + ca * 1.6, C[1] + sa * 1.6], [C[0] + ca * 3.3 + nx * 1.45, C[1] + sa * 3.3 + ny * 1.45], [C[0] + ca * R, C[1] + sa * R], [C[0] + ca * 3.3 - nx * 1.45, C[1] + sa * 3.3 - ny * 1.45]], true, 0.12);
        A.fill(pet, 'chalk', K.marbleLt, { w: 0.4, p: 1, reach: 1.5, passes: 2, ang: a });
        A.stroke([[C[0] + ca * 2.3, C[1] + sa * 2.3], [C[0] + ca * (R - 1.4), C[1] + sa * (R - 1.4)]], 'chalk', K.hingul, { w: 0.32, p: 0.95 });
        A.outline(pet, 'kajal', K.line, { closed: true, w: 0.18, p: 0.8 });
        const b = m / 8 * TAU - PI / 2 + PI / 8;
        A.dot(C[0] + Math.cos(b) * (R - 0.8), C[1] + Math.sin(b) * (R - 0.8), 'gold', K.gold, { w: 0.42, p: 1 });
      }
      const heart = k.ell(C[0], C[1], 1.75, 1.75);
      A.fill(heart, 'gold', K.gold, { w: 0.5, p: 1, reach: 1.5, passes: 2 });
      A.outline(heart, 'kajal', K.line, { closed: true, w: 0.2, p: 0.85 });
      A.dot(C[0], C[1], 'chalk', K.hingul, { w: 0.7, p: 1 });
      k.glint(C[0] - 0.5, C[1] - 0.5);
      // a sprig each side: a stem, two leaves, a white bud
      for (const sg of [-1, 1]) {
        const s0 = P(cx + sg * 8.0, cy + 3.0), s1 = P(cx + sg * 10.8, cy - 2.4);
        A.stroke(A.spline([s0, [lerp(s0[0], s1[0], 0.5) + sg * 0.9, lerp(s0[1], s1[1], 0.5)], s1], false, 0.15), 'chalk', K.malL, { w: 0.3, p: 0.95 });
        for (const [t, side] of [[0.35, -1], [0.62, 1]]) {
          const q = [lerp(s0[0], s1[0], t), lerp(s0[1], s1[1], t)], a = side > 0 ? -0.4 * sg : PI + 0.4 * sg;
          const lf = A.spline([q, [q[0] + Math.cos(a - 0.5) * 1.1, q[1] + Math.sin(a - 0.5) * 1.1], [q[0] + Math.cos(a) * 2.2, q[1] + Math.sin(a) * 2.2], [q[0] + Math.cos(a + 0.5) * 1.1, q[1] + Math.sin(a + 0.5) * 1.1]], true, 0.1);
          A.fill(lf, 'chalk', K.malL, { w: 0.3, p: 1, reach: 1.5, passes: 2 });
        }
        k.flower(s1[0], s1[1] - 0.4, 0.45, K.marbleLt, K.hingul, 1);
      }
      // a small white flower in each corner
      for (const [x, y] of [[px0 + 2.6, py0 + 2.6], [px1 - 2.6, py0 + 2.6], [px0 + 2.6, py1 - 2.6], [px1 - 2.6, py1 - 2.6]]) { const q = P(x, y); k.flower(q[0], q[1], 0.42, K.marbleLt, K.gold, 1); }
      k.kaj(all([[px0 - 0.5, py0 - 0.5], [px1 + 0.5, py0 - 0.5], [px1 + 0.5, py1 + 0.5], [px0 - 0.5, py1 + 0.5], [px0 - 0.5, py0 - 0.5]]), 0.22, { tin: 0, tout: 0 });
    }
    // ---- the green band, white chevrons in it, gold at both edges
    const BD = all(rectP(-92, TK.pan1, 92, TK.band1));
    k.lay(BD, K.mal, { w: 0.9, ang: 0.1 });
    A.withMask(BD, () => A.stroke(all([[-92, TK.band1 - 0.6], [92, TK.band1 - 0.6]]), 'side', K.malD, { w: 1.2, p: 0.5, tin: 0, tout: 0 }));
    for (let x = -90; x <= 90; x += 2.2) {
      const y = (TK.pan1 + TK.band1) / 2, z = 1.05;
      A.stroke(all([[x - z * 0.6, y - z], [x + z * 0.5, y], [x - z * 0.6, y + z]]), 'chalk', K.marbleLt, { w: 0.28, p: 0.95, tin: 0.08, tout: 0.08 });
    }
    for (const y of [TK.pan1 + 0.35, TK.band1 - 0.35]) A.stroke(all([[-91.6, y], [91.6, y]]), 'gold', K.gold, { w: 0.4, p: 1, tin: 0, tout: 0 });
    // ---- the plinth, a step of darker marble
    const PL = all(rectP(-95, TK.band1, 95, TK.foot));
    k.lay(PL, A.mix(K.marble, K.marbleSh, 0.55), { w: 1.2, ang: 0 });
    A.withMask(PL, () => {
      A.stroke(all([[-95, TK.band1 + 0.9], [95, TK.band1 + 0.9]]), 'chalk', K.marbleLt, { w: 0.7, p: 0.8, tin: 0, tout: 0 });
      A.stroke(all([[-95, TK.foot - 1.0], [95, TK.foot - 1.0]]), 'side', K.marbleD, { w: 1.6, p: 0.5, tin: 0, tout: 0 });
    });
    // a running vine along the plinth, twenty-four waves, a red flower in every loop and a leaf at every turn
    { const ym = (TK.band1 + TK.foot) / 2 - 0.1, per = 182 / 24, vine = [];
      for (let x = -91; x <= 91.001; x += 0.35) vine.push(P(x, ym + 1.15 * Math.sin((x + 91) / per * TAU)));
      A.stroke(vine, 'chalk', K.mal, { w: 0.3, p: 0.92, tin: 0.02, tout: 0.02 });
      for (let i = 0; i < 48; i++) {
        const x = -91 + (i + 0.5) * per / 2, up = i % 2 === 0, q = P(x + rr(-0.06, 0.06), ym + (up ? -1.25 : 1.25) * 0.55);
        if (i % 2 === 0) k.flower(q[0], q[1] + (up ? 0.65 : 0), 0.46 + rr(-0.04, 0.04), K.hingul, K.haldi, 1);
        else { const l = P(x, ym + 0.2); A.dot(l[0], l[1], 'chalk', K.malL, { w: 0.55, len: 0.45, ang: 0.6 + rr(-0.1, 0.1), p: 0.9 }); }
      }
    }
    // ---- the joints and the whole contour
    for (const y of [TK.cope1, TK.fr1, TK.pan1, TK.band1]) {
      const xw = y === TK.cope1 ? 94 : y === TK.band1 ? 95 : 92;
      k.kaj(all([[-xw, y], [xw, y]]), 0.26, { tin: 0, tout: 0 });
    }
    const BODY = all([[-90, TK.rim], [90, TK.rim], [90, TK.w1], [94, TK.w1], [94, TK.cope1], [92, TK.cope1], [92, TK.band1], [95, TK.band1], [95, TK.foot], [-95, TK.foot], [-95, TK.band1], [-92, TK.band1], [-92, TK.cope1], [-94, TK.cope1], [-94, TK.w1], [-90, TK.w1]]);
    k.ink(BODY, { k: 1.1, w0: 0.42, pull: 30 });
  }

  // a gold pendant hanging between the two middle heads: a cord, a small pot, a red tassel
  function pendant(k) {
    const { A, P, all } = k;
    const y0 = beamBot(0), c = P(0, y0 + 5.2);
    A.stroke([P(0, y0), P(0, y0 + 2.6)], 'gold', K.gold, { w: 0.45, p: 1 });
    const pot = A.spline([[c[0] - 0.7, c[1] - 2.6], [c[0] - 2.2, c[1] - 0.8], [c[0] - 1.8, c[1] + 1.2], [c[0], c[1] + 1.9], [c[0] + 1.8, c[1] + 1.2], [c[0] + 2.2, c[1] - 0.8], [c[0] + 0.7, c[1] - 2.6]], true, 0.12);
    k.gild(pot, K.gold, { w: 0.4 });
    A.withMask(pot, () => A.stroke([[c[0] + 1.6, c[1] - 1.4], [c[0] + 1.2, c[1] + 1.4]], 'side', K.goldD, { w: 0.9, p: 0.5 }));
    A.stroke([[c[0] - 1.9, c[1] - 0.3], [c[0] + 1.9, c[1] - 0.3]], 'chalk', K.hingul, { w: 0.35, p: 0.95 });
    A.outline(pot, 'kajal', K.line, { closed: true, w: 0.24, p: 0.9 });
    for (let j = -2; j <= 2; j++) A.stroke([[c[0] + j * 0.3, c[1] + 1.8], [c[0] + j * 0.55, c[1] + 4.6]], 'chalk', j % 2 ? K.hingul : K.lac, { w: 0.32, p: 0.95, tout: 0.4 });
    A.dot(c[0], c[1] + 1.9, 'gold', K.goldL, { w: 0.7, p: 1 });
    k.glint(c[0] - 0.6, c[1] - 0.8);
  }

  /* ================================================================ DRAW: the object, whole, for the cut-out */
  function draw(Z, o) {
    const k = kit(Z, o), S = streams();
    screen(k);
    beam(k);
    // the outer heads first, so each trunk curls in front of the next head's mane
    for (const n of NECKS) for (const sg of [-1, 1]) {
      const xn = sg * n, yn = beamBot(xn) + HEAD_DROP;
      bracket(k, xn, yn, sg);
      makara(k, xn, yn, sg);
    }
    pendant(k);
    tank(k, S);
    S.forEach((s, i) => ribbonWater(k, s, i));
    S.forEach(s => splash(k, s));
    waterLife(k, S);
    tankFront(k);
  }

  M.w8x['portfolio'] = { draw, ground };
})();
