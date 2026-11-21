(function () {
  'use strict';
  /* ==========================================================================
     TWO FOLIO PAINTINGS
       M.folioArt['claudemonitor']  the owlet who keeps count through the night
       M.folioArt['dpay']           the festival elephant, walking in plenty
     Each is drawn inside the box b (logical units) that stage-folios.js clips to.
     The five tools only: pastel (tip and side), chalk, kajal, gold, geru; the
     finger (blend, smudge); shade as loose pastel dust.
     ======================================================================== */
  M.folioArt = M.folioArt || {};
  const PI = Math.PI, TAU = PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // a frame in "body units": origin at the anchor, x forward, y down, 1 unit = s
  function frame(x, y, s, flip) {
    const f = flip ? -1 : 1;
    const P = (nx, ny) => [x + nx * f * s, y + ny * s];
    P.all = pts => pts.map(p => { const q = P(p[0], p[1]); if (p[2] != null) q.push(p[2]); return q; });
    P.s = s; P.f = f;
    return P;
  }
  // a tapering band around a centre line; wf(t) = half width
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
  // a flat ground the Mewar way: the side of the stick, rubbed in, worked over again
  function flat(A, poly, c, o) {
    o = o || {};
    const rp = A.ground(poly, c, Object.assign({ w: 16, edge: 0, top: 0.75, ang: -0.4 }, o, { rub: 0 }));
    if (o.rub !== 0 && o.rubBox) A.blend(o.rubBox, { r: o.rub || 6, k: 0.42 });
    return rp;
  }
  // a small form filled with the stick and outlined in kajal a hair off register
  function form(A, pts, c, o) {
    o = o || {};
    return A.shape(pts, Object.assign({ c, w: 2.4, passes: 2, rough: 0.35, line: 'kajal', lw: 0.75, lp: 0.85, off: 0.35, reach: 1.55 }, o));
  }
  function tear(cx, by, w, h, lean) {
    const pts = [], N = 10, r = v => (w / 2) * Math.sin(PI * Math.pow(v, 0.55));
    for (let i = 0; i <= N; i++) { const v = i / N; pts.push([cx - r(v) + lean * v * v, by - v * h]); }
    for (let i = N - 1; i >= 1; i--) { const v = i / N; pts.push([cx + r(v) + lean * v * v, by - v * h]); }
    return pts;
  }
  // the light round a flame, the Mewar way: a soft warm bloom of pastel rubbed out with the finger, and round it a loose
  // halo of small white and gold dots, never evenly spaced, fewer as the oil runs low.  Nothing falls below `floor`.
  function halo(A, x, y, r, k, warm, floor) {
    A.dot(x, y, 'pastel', A.mix(warm || 'saffron', 'neel', 0.3), { w: r * 1.55, p: 0.18 + 0.22 * k, len: r * 0.03, reach: 0.95, hard: 0.9 });
    A.dot(x, y, 'pastel', A.mix(warm || 'saffron', 'haldi', 0.35), { w: r * 0.95, p: 0.28 + 0.34 * k, len: r * 0.03, reach: 1.05, hard: 1.0 });
    A.dot(x, y, 'pastel', A.mix('haldi', 'cream', 0.3), { w: r * 0.45, p: 0.35 + 0.35 * k, len: r * 0.02, reach: 1.1, hard: 1.1 });
    const n = 12, a0 = A.rr(0, 1);
    for (let i = 0; i < n; i++) { const t = a0 + i * TAU / n; A.smudge([[x + Math.cos(t) * r * 0.2, y + Math.sin(t) * r * 0.2], [x + Math.cos(t) * r * 0.72, y + Math.sin(t) * r * 0.72]], { r: r * 0.22, k: 0.5, pick: 0.15 }); }
    const fl = floor == null ? 1e9 : floor;
    // an inner ring, gold with white between, broken and uneven
    const nd = Math.round(10 + 18 * k), b0 = A.rr(0, TAU);
    for (let i = 0; i < nd; i++) {
      if (A.chance(0.14)) continue;
      const t = b0 + i * TAU / nd + A.rr(-0.1, 0.1), rad = r * A.rr(0.7, 0.84) * (0.92 + 0.16 * k), px = x + Math.cos(t) * rad, py = y + Math.sin(t) * rad;
      if (py > fl) continue;
      A.dot(px, py, i % 3 ? 'gold' : 'chalk', i % 3 ? 'gold' : 'khadi', { w: A.rr(0.5, 0.85), p: 0.55 + 0.4 * k });
    }
    // round a bright flame an outer ring too, finer, mostly white
    if (k > 0.5) {
      const no = Math.round(8 + 12 * k), c0 = A.rr(0, TAU);
      for (let i = 0; i < no; i++) {
        if (A.chance(0.2)) continue;
        const t = c0 + i * TAU / no + A.rr(-0.15, 0.15), rad = r * A.rr(1.0, 1.14), px = x + Math.cos(t) * rad, py = y + Math.sin(t) * rad;
        if (py > fl) continue;
        A.dot(px, py, 'chalk', A.pick(['khadi', 'khadi', A.mix('khadi', 'haldi', 0.4)]), { w: A.rr(0.35, 0.6), p: 0.4 + 0.4 * k });
      }
    }
  }
  function flame(A, x, y, h, lean) {
    lean = lean == null ? A.rr(-0.2, 0.2) * h : lean;
    A.fill(tear(x, y, h * 0.56, h, lean), 'chalk', 'saffron', { w: Math.max(0.9, h * 0.28), p: 1, reach: 1.7, passes: 2, gap: 0.4, ang: 1.3, cv: 0.02 });
    A.fill(tear(x, y - h * 0.04, h * 0.32, h * 0.7, lean * 0.6), 'chalk', 'haldi', { w: Math.max(0.8, h * 0.2), p: 1, reach: 1.7, passes: 2, gap: 0.4, ang: 1.5 });
    A.dot(x + lean * 0.05, y - h * 0.2, 'chalk', 'khadi', { w: Math.max(0.7, h * 0.15), p: 1, reach: 1.6, ang: 1.57, len: h * 0.06 });
    A.stroke([[x, y + 0.2], [x + lean * 0.1, y - h * 0.14]], 'kajal', 'sepia', { w: 0.55, p: 0.7, tin: 0, tout: 0.5 });
  }
  // a bank of Mewar cloud along the top: billows in two rows, darker under, a pale rim, some ending in a scroll
  function cloudBank(A, x0, x1, yb, o) {
    o = o || {};
    const k = o.k || 1, body = o.c || A.mix('storm', 'lapis', 0.3), dark = o.dark || A.mix('neel', 'night', 0.4), lite = o.lite || A.mix('slate', 'sky', 0.35), rim = o.rim || 'ice';
    const front = []; let x = x0;
    while (x < x1) { const r = A.rr(8, 12.5) * k; front.push({ x: x + r * 0.7, y: yb - r * 0.8 + A.rr(-1.5, 1.5) * k, r }); x += r * A.rr(1.15, 1.45); }
    const back = front.map(L => ({ x: L.x + L.r * A.rr(0.4, 0.7), y: L.y - L.r * A.rr(0.85, 1.1), r: L.r * A.rr(0.8, 1.0) }));
    const top = front.map(L => ({ x: L.x + L.r * A.rr(-0.2, 0.3), y: L.y - L.r * 1.9, r: L.r * 1.05 }));
    const lobe = (L, front) => {
      const e = A.roughen(A.ellipse(L.x, L.y, L.r, L.r * 0.88), L.r * 0.035, L.r, true);
      A.fill(e, 'pastel', A.vary(body, 0.012), { w: Math.max(2.4, L.r * 0.42), p: 1, reach: 1.55, passes: 2, ang: A.rr(-0.4, 0.6), cv: 0.012 });
      A.withMask(e, () => {
        A.stroke(A.ellipse(L.x + L.r * 0.1, L.y + L.r * 0.05, L.r * 0.86, L.r * 0.76, 0, 0.25, 2.9), 'shade', dark, { w: L.r * 0.42, p: 0.5 });
        A.stroke(A.ellipse(L.x - L.r * 0.1, L.y - L.r * 0.1, L.r * 0.6, L.r * 0.5, 0, 3.6, 5.3), 'chalk', lite, { w: L.r * 0.2, p: 0.42, tin: 0.3, tout: 0.3 });
      });
      if (!front) return;
      A.stroke(A.ellipse(L.x, L.y, L.r * 0.97, L.r * 0.86, 0, 0.12, PI * 0.96), 'chalk', rim, { w: 1.05 * k, p: 0.9, tin: 0.08, tout: 0.25 });
      if (A.chance(o.scroll != null ? o.scroll : 0.55)) {
        const cx = L.x + L.r * 0.5, cy = L.y + L.r * 0.07, sp = [], turns = A.rr(0.95, 1.2);
        for (let i = 0; i <= 26; i++) { const t = i / 26, th = -t * TAU * turns, rad = L.r * 0.47 * (1 - t * 0.8); sp.push([cx + Math.cos(th) * rad, cy + Math.sin(th) * rad * 0.92]); }
        A.stroke(sp, 'chalk', rim, { w: 0.95 * k, p: 0.85, tin: 0.02, tout: 0.45 });
      }
    };
    top.forEach(L => lobe(L, false)); back.forEach(L => lobe(L, false)); front.forEach(L => lobe(L, true));
  }

  /* ============================================================ the owlet */
  // where a level line at sheet height yy crosses a polygon: [left, right]
  function spanY(poly, yy) {
    let a = 1e9, b = -1e9;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const p = poly[i], q = poly[j];
      if ((p[1] > yy) !== (q[1] > yy)) { const xx = p[0] + (q[0] - p[0]) * (yy - p[1]) / (q[1] - p[1]); if (xx < a) a = xx; if (xx > b) b = xx; }
    }
    return [a, b];
  }

  /* A spotted owlet in the Mewar manner, seen three-quarter: the body a compact teardrop turned toward the lamps, the
     head turned further and tilted as it listens.  The face is a heart-shaped disc drawn in one fine kajal ring; the
     eyes are ringed, gold-ochre, with small pupils that both look at the lamps.  The feathers are rhythm, not light and
     shade: rows of small U scales down the pale breast, spotted scales on the crown and the wing coverts, and the long
     flight feathers in fine parallel strokes crossed by pale bars.  (x, y) = between the feet on the perch; s = feet to crown. */
  function owlet(A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, U = v => v * s, lean = o.lean != null ? o.lean : 0.07;
    const P = (nx, ny) => [x + (nx - ny * lean) * s, y + ny * s];
    const PA = pts => pts.map(p => P(p[0], p[1]));
    const sp = (pts, closed) => A.spline(PA(pts), closed !== false, 1);
    const BR = A.mix(A.mix('umber', 'sepia', 0.25), 'slate', 0.2), BRD = A.mix(BR, 'kajal', 0.45), BRL = A.mix(BR, 'sand', 0.5);
    const PALE = A.mix(A.mix('khadi', 'sand', 0.3), 'stone', 0.2), SPOT = A.mix('khadi', 'cream', 0.25);
    const INK = A.mix('kajal', 'sepia', 0.15), SCALE = A.mix(A.mix(BR, 'kajal', 0.3), 'sepia', 0.2);
    const TOE = A.mix(A.mix('haldi', 'stone', 0.45), 'sand', 0.3);
    const lay = (poly, c, ang, w) => A.fill(poly, 'pastel', c, { w: w || 2.4, p: 1, reach: 1.55, passes: 2, ang, turn: 0.4, cv: 0.01 });
    const wdot = (px, py, w, p) => A.dot(px + rr(-0.15, 0.15), py + rr(-0.15, 0.15), 'chalk', SPOT, { w, p: p || rr(0.82, 1), reach: 1.4 });
    // one feather's edge: a small U pulled round in one movement of the point, never quite the same twice
    const scale = (px, py, w, c, tool, lw, p, deep) => {
      const d = w * (deep || 0.43) * rr(0.85, 1.15), sk = rr(-0.1, 0.1) * w;
      const pts = [[px - w / 2 + rr(-0.06, 0.06) * w, py - d], [px - w * 0.33 + sk * 0.3, py - d * 0.12], [px + sk, py + rr(-0.04, 0.06) * w], [px + w * 0.33 + sk * 0.3, py - d * 0.12], [px + w / 2 + rr(-0.06, 0.06) * w, py - d * rr(0.8, 1.1)]];
      A.stroke(A.spline(pts, false, 0.35), tool || 'kajal', c, { w: lw, p, tin: 0.12, tout: 0.22 });
    };
    // one feather laid as a filled scallop in two tones, the Mewar way: the body of it in one colour, a band of the
    // second colour along its round lower edge, a kajal hair on the edge.  (px, py) = the bottom of the round, w across, d deep
    const feather = (px, py, w, d, c1, c2, line, spot) => {
      const arc = [];
      for (let i = 0; i <= 10; i++) { const a = i / 10 * PI; arc.push([px - Math.cos(a) * w / 2 + rr(-0.04, 0.04) * w, py - d + Math.sin(a) * d]); }
      const poly = [[px - w / 2, py - d * 1.5]].concat(arc, [[px + w / 2, py - d * 1.5]]);
      A.fill(poly, 'pastel', c1, { w: Math.max(0.6, w * 0.3), p: 1, reach: 1.5, passes: 2, ang: 1.5 });
      const cx0 = px, cy0 = py - d;
      A.stroke(arc.slice(1, -1).map(p => [lerp(p[0], cx0, 0.2), lerp(p[1], cy0, 0.2)]), 'chalk', c2, { w: Math.max(0.5, w * 0.2), p: 0.95, tin: 0.2, tout: 0.2 });
      if (spot) A.dot(px + rr(-0.1, 0.1) * w, py - d * 0.62, 'chalk', SPOT, { w: w * 0.3, p: rr(0.85, 1), reach: 1.4 });
      A.stroke(arc, 'kajal', line, { w: 0.42, p: rr(0.62, 0.8), tin: 0.15, tout: 0.15 });
    };

    // ---- the body: a compact teardrop, broad at the shoulder and narrowing to the feet, laid in one flat brown
    const BODY = A.roughen(sp([[0.03, -0.665], [0.15, -0.645], [0.235, -0.585], [0.282, -0.48], [0.296, -0.355], [0.282, -0.235], [0.25, -0.14], [0.2, -0.075],
      [0.13, -0.028], [0.05, -0.004], [-0.04, -0.004], [-0.12, -0.03], [-0.2, -0.085], [-0.27, -0.19], [-0.312, -0.32], [-0.31, -0.45], [-0.275, -0.56], [-0.2, -0.635], [-0.09, -0.668]]), 0.2, 8, true);
    lay(BODY, BR, 1.3, 2.8);
    // the breast, turned toward us and toward the lamps: pale, sown with rows of small U scales that follow its round
    const BREAST = A.roughen(sp([[-0.06, -0.63], [0.06, -0.65], [0.17, -0.615], [0.235, -0.545], [0.258, -0.43], [0.252, -0.3], [0.222, -0.185], [0.165, -0.09],
      [0.09, -0.035], [0.01, -0.02], [-0.05, -0.05], [-0.045, -0.2], [-0.035, -0.42]]), 0.25, 6, true);
    A.withMask(BODY, () => {
      lay(BREAST, PALE, 0.25, 2);
      A.withMask(BREAST, () => {
        // the breast feathers: rows of filled scallops laid from the belly up, each row over the one below and set half a
        // feather over, so only the round lower edge of each shows.  Two tones in rhythm: a cream feather, a band of warm
        // sand along its edge, a kajal hair on the edge.  The rows bow down at the middle with the round of the breast and
        // the feathers narrow toward its sides, where it turns away
        const CREAM = A.mix(PALE, 'khadi', 0.4), BAND = A.mix(A.mix(BRL, 'sand', 0.3), 'umber', 0.12);
        const rows = [];
        for (let r = 0; r < 16; r++) {
          const t0 = r / 15, w0 = U(lerp(0.04, 0.058, t0)), v = -0.61 + r * lerp(0.031, 0.04, t0), yy = P(0, v)[1], sp2 = spanY(BREAST, yy);
          if (!(sp2[1] > sp2[0]) || v > -0.025) continue;
          rows.push({ r, w0, yy, xa: sp2[0], xb: sp2[1] });
        }
        for (let j = rows.length - 1; j >= 0; j--) {
          const { r, w0, yy, xa, xb } = rows[j], cx = lerp(xa, xb, 0.45), half = (xb - xa) / 2;
          for (let px = xa - (r % 2 ? 0 : w0 / 2) + rr(-0.3, 0.3); px < xb + w0 * 0.5; px += w0 * rr(0.95, 1.05)) {
            const t = clamp((px - cx) / half, -1, 1), ww = w0 * (1 - 0.3 * t * t), y0 = yy + U(0.016) * (1 - t * t) + rr(-0.1, 0.1);
            feather(px, y0, ww, ww * rr(0.66, 0.78), A.vary(CREAM, 0.01), BAND, r < 3 ? A.mix(SCALE, 'kajal', 0.25) : SCALE, false);
          }
        }
        // the breast turns away at its edges: a little brown dust rubbed in along them
        A.stroke(A.spline(PA([[-0.04, -0.6], [-0.045, -0.4], [-0.05, -0.2], [-0.04, -0.06]]), false, 1), 'side', A.mix(BRL, PALE, 0.3), { w: U(0.05), p: 0.22, tin: 0.3, tout: 0.3 });
        // the lamps warm the far side of the breast: a little peach dust, rubbed
        A.stroke([P(0.27, -0.42), P(0.255, -0.26), P(0.2, -0.12), P(0.12, -0.04)], 'side', A.mix('peach', 'saffron', 0.3), { w: U(0.07), p: 0.2, tin: 0.3, tout: 0.4 });
      });
      // the far wing: the brown left down the far side, a file of white spots in it
      for (const q of A.along(sp([[0.272, -0.52], [0.284, -0.38], [0.27, -0.24], [0.232, -0.13], [0.18, -0.065]], false), U(0.034), 0)) wdot(q.x, q.y, U(0.014), 0.88);
    });

    // ---- the near wing, folded: spotted scales over the coverts, then the long flight feathers in fine parallel strokes
    const NW = A.roughen(sp([[-0.2, -0.635], [-0.1, -0.62], [-0.05, -0.56], [-0.04, -0.44], [-0.05, -0.3], [-0.055, -0.17], [-0.045, -0.06], [-0.03, 0.012],
      [-0.09, 0.004], [-0.17, -0.025], [-0.245, -0.085], [-0.3, -0.19], [-0.326, -0.33], [-0.322, -0.47], [-0.285, -0.575]]), 0.16, 7, true);
    lay(NW, A.mix(BR, 'kajal', 0.06), 1.0, 2.4);
    const Q = [[-0.333, -0.3], [-0.285, -0.292], [-0.236, -0.288], [-0.187, -0.287], [-0.138, -0.29], [-0.088, -0.298], [-0.048, -0.31]];
    const E = [[-0.304, -0.17], [-0.266, -0.1], [-0.214, -0.052], [-0.158, -0.02], [-0.104, 0.002], [-0.058, 0.016], [-0.032, 0.012]];
    A.withMask(NW, () => {
      // the coverts: rows of filled scallops laid from the lowest row up, the same rhythm as the breast in the browns of
      // the wing: a deep brown feather with a band of light brown along its edge and a white spot in it, smaller
      // toward the shoulder
      for (let r = 6; r >= 0; r--) {
        const v = -0.6 + r * 0.044, yy = P(0, v)[1], sp2 = spanY(NW, yy), xa = sp2[0], xb = sp2[1], w0 = U(lerp(0.032, 0.046, r / 6)), step = w0 * rr(0.98, 1.06);
        if (!(xb > xa)) continue;
        for (let px = xb - w0 * 0.4 - (r % 2 ? step / 2 : 0); px > xa - w0 * 0.2; px -= step * rr(0.95, 1.05)) {
          const py = yy + (xb - px) * 0.14 + rr(-0.2, 0.2);
          feather(px, py, w0, w0 * rr(0.72, 0.84), A.vary(A.mix(BR, 'kajal', 0.1), 0.01), A.mix(BRL, 'khadi', 0.12), INK, true);
        }
      }
      // where the long feathers start
      A.stroke(A.spline(PA([[-0.34, -0.318], [-0.27, -0.296], [-0.18, -0.29], [-0.09, -0.302], [-0.04, -0.318]]), false, 1), 'kajal', INK, { w: 0.62, p: 0.82, tin: 0.08, tout: 0.1 });
      // the flight feathers: a shaft line for each, a second finer line inside it, and pale bars across between them
      for (let i = 0; i < Q.length; i++) {
        const q = Q[i], e = E[i], mid = [lerp(q[0], e[0], 0.5) - 0.012, lerp(q[1], e[1], 0.5)];
        A.stroke(A.spline(PA([q, mid, e]), false, 1), 'kajal', INK, { w: 0.6, p: 0.8, tin: 0.06, tout: 0.25 });
        if (i < Q.length - 1) {
          const q2 = Q[i + 1], e2 = E[i + 1];
          const inner = [[lerp(q[0], q2[0], 0.55), lerp(q[1], q2[1], 0.55)], [lerp(mid[0], lerp(q2[0], e2[0], 0.5) - 0.012, 0.55), lerp(mid[1], lerp(q2[1], e2[1], 0.5), 0.55)], [lerp(e[0], e2[0], 0.55), lerp(e[1], e2[1], 0.55)]];
          A.stroke(A.spline(PA(inner), false, 1), 'kajal', BRD, { w: 0.36, p: 0.5, tin: 0.2, tout: 0.3 });
          const nb = 5 + (i % 2), off = rr(0.03, 0.08);
          for (let j = 0; j < nb; j++) {
            const f = off + (j + 0.5) / nb * (0.9 - off) + rr(-0.02, 0.02);
            const a1 = P(lerp(q[0], e[0], f) - 0.006, lerp(q[1], e[1], f)), a2 = P(lerp(q2[0], e2[0], f) - 0.006, lerp(q2[1], e2[1], f));
            const m1 = [lerp(a1[0], a2[0], 0.18), lerp(a1[1], a2[1], 0.18)], m2 = [lerp(a1[0], a2[0], 0.82), lerp(a1[1], a2[1], 0.82) + rr(-0.2, 0.2)];
            A.stroke([m1, m2], 'chalk', A.mix(SPOT, BRL, rr(0, 0.35)), { w: U(0.011), p: rr(0.62, 0.85), tin: 0.15, tout: 0.2 });
          }
        }
      }
      // the moon catches the bend of the wing
      A.stroke(A.spline(PA([[-0.22, -0.63], [-0.29, -0.575], [-0.322, -0.47], [-0.326, -0.36]]), false, 1), 'chalk', A.mix('ice', 'slate', 0.3), { w: U(0.016), p: 0.42, tin: 0.2, tout: 0.4 });
    });
    A.outline(NW, 'kajal', INK, { closed: true, w: 0.7, p: 0.8, pull: 30 });

    // ---- the head: broad, turned toward the lamps further than the body, and tilted as it listens
    const tilt = o.tilt != null ? o.tilt : 0.14, ct = Math.cos(tilt), stl = Math.sin(tilt);
    const hc = P(0.06, -0.835);
    const H = (lx, ly) => [hc[0] + (lx * ct - ly * stl) * s, hc[1] + (lx * stl + ly * ct) * s];
    const Hs = (pts, closed) => A.spline(pts.map(p => H(p[0], p[1])), closed, 1);
    const toL = (px, py) => { const dx = (px - hc[0]) / s, dy = (py - hc[1]) / s; return [dx * ct + dy * stl, -dx * stl + dy * ct]; };
    const HEAD = A.roughen(Hs([[0.0, -0.196], [0.12, -0.188], [0.205, -0.14], [0.244, -0.05], [0.24, 0.05], [0.2, 0.135], [0.11, 0.182], [0.0, 0.192],
      [-0.12, 0.176], [-0.212, 0.118], [-0.254, 0.02], [-0.245, -0.09], [-0.165, -0.172]], true), 0.2, 7, true);
    A.pushMaskOutside(HEAD);
    A.outline(BODY, 'kajal', INK, { closed: true, w: 0.9, p: 0.9, pull: 40 });
    A.popMask();

    // ---- feet: three toes forward over the edge of the stone, rough-skinned, each ending in a dark hooked talon
    for (const fx of [-0.035, 0.115]) {
      for (let k = 0; k < 10; k++) A.stroke([P(fx + rr(-0.045, 0.045), -0.06), P(fx + rr(-0.05, 0.05), rr(-0.006, 0.006))], 'chalk', A.pick([PALE, SPOT, A.mix(PALE, 'sand', 0.3)]), { w: U(0.014), p: 0.85, tin: 0.1, tout: 0.5 });
      for (const k of [-1, 0, 1]) {
        const a = P(fx + k * 0.026, -0.008), b = P(fx + k * 0.04 + 0.004, 0.046), m = [lerp(a[0], b[0], 0.5) + k * U(0.005), lerp(a[1], b[1], 0.5)];
        A.stroke([a, m, b], 'chalk', TOE, { w: U(0.032), p: 1, reach: 1.5, tin: 0, tout: 0.05 });
        A.stroke([[a[0] - U(0.015), a[1]], [m[0] - U(0.015), m[1]], [b[0] - U(0.013), b[1]]], 'kajal', A.mix(TOE, 'sepia', 0.65), { w: 0.5, p: 0.7 });
        A.stroke([[a[0] + U(0.014), a[1]], [m[0] + U(0.014), m[1]], [b[0] + U(0.012), b[1]]], 'kajal', A.mix(TOE, 'sepia', 0.65), { w: 0.4, p: 0.45 });
        for (const t of [0.35, 0.6, 0.85]) { const q = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; A.stroke([[q[0] - U(0.011), q[1]], [q[0] + U(0.011), q[1] + U(0.003)]], 'kajal', A.mix(TOE, 'sepia', 0.5), { w: 0.42, p: 0.55 }); }
        const c1 = [b[0] + U(0.012), b[1] + U(0.016)], c2 = [b[0] + U(0.004), b[1] + U(0.038)], c3 = [b[0] - U(0.008), b[1] + U(0.044)];
        A.stroke([[b[0] - U(0.004), b[1] - U(0.008), 1], c1, [c2[0], c2[1], 0.6], [c3[0], c3[1], 0.2]], 'kajal', 'kajal', { w: U(0.02), p: 1, tin: 0, tout: 0.3 });
      }
    }
    // the belly feathers over the stone: pale, fluffed, a fringe of fine strokes down to the toes
    {
      const low = xx => 0.004 - 0.12 * Math.pow(Math.abs(xx - 0.075) / 0.15, 2.4) + 0.007 * Math.abs(Math.sin(xx * 80));
      const FL = [];
      for (let xx = -0.07; xx <= 0.22; xx += 0.01) FL.push([xx, low(xx)]);
      FL.push([0.22, -0.13], [-0.07, -0.13]);
      lay(A.spline(PA(FL), true, 1), PALE, 1.5, 1.6);
      for (let xx = -0.064; xx <= 0.212; xx += 0.012) {
        const t = (xx - 0.075) / 0.145;
        A.stroke([P(xx + rr(-0.004, 0.004), low(xx) - rr(0.035, 0.05)), P(xx + rr(-0.008, 0.008), low(xx) + rr(-0.006, 0.002))], 'chalk', A.pick([PALE, SPOT]), { w: U(0.01), p: Math.abs(t) > 0.75 ? 0.35 : rr(0.55, 0.8), tin: 0.3, tout: 0.45 });
      }
      for (const v of [-0.092, -0.05]) for (let xx = -0.03 + (v > -0.06 ? 0.018 : 0); xx < 0.2; xx += 0.036) {
        if (low(xx) < v + 0.03) continue;
        const q = P(xx + rr(-0.004, 0.004), v);
        scale(q[0], q[1], U(0.03), SCALE, 'kajal', 0.5, rr(0.6, 0.8));
      }
    }

    lay(HEAD, BR, 0.9, 2.4);
    // the face: a heart, two lobes over the eyes meeting in a notch at the brow and narrowing to the chin; the far half
    // narrower, for the turn of the head
    const fx = 0.1;
    const DISCp = [[fx + 0.004, -0.08], [fx + 0.05, -0.108], [fx + 0.098, -0.088], [fx + 0.122, -0.022], [fx + 0.104, 0.05], [fx + 0.056, 0.118], [fx + 0.008, 0.152],
      [fx - 0.09, 0.122], [fx - 0.188, 0.052], [fx - 0.214, -0.034], [fx - 0.18, -0.106], [fx - 0.096, -0.13]];
    const DISC = A.roughen(Hs(DISCp, true), 0.12, 5, true);
    // the eyes are almonds, the far one shorter for the turn of the head; `out` = the side of the outer corner
    const EYES = [{ c: [fx - 0.086, -0.026], rx: 0.045, ry: 0.024, out: -1 }, { c: [fx + 0.058, -0.028], rx: 0.029, ry: 0.021, out: 1 }];
    const DC = [fx, 0.0];
    A.withMask(HEAD, () => {
      // the crown: rows of spotted scales that follow the round of the head, smaller toward the brow
      for (let r = 0; r < 5; r++) {
        const rx = 0.236 - r * 0.04, ry = 0.18 - r * 0.036, da = 0.042 / ((rx + ry) / 2);
        for (let a = PI * 0.66 + (r % 2 ? da / 2 : 0) + rr(0, 0.05); a < PI * 2.34; a += da * rr(0.93, 1.07)) {
          const l = [0.0 + Math.cos(a) * rx, -0.006 + Math.sin(a) * ry];
          if (l[1] > 0.13) continue;
          const dx = DC[0] - l[0], dy = DC[1] - l[1], d = Math.hypot(dx, dy) || 1, near = H(l[0] + dx / d * 0.032, l[1] + dy / d * 0.032);
          if (A.inside([DISC], near[0], near[1])) continue;
          const q = H(l[0], l[1]), w0 = U(lerp(0.03, 0.02, r / 4));
          scale(q[0], q[1], w0, A.mix(BRL, 'khadi', 0.15), 'chalk', U(0.007), rr(0.5, 0.72));
          wdot(q[0], q[1] - w0 * 0.12, U(lerp(0.014, 0.01, r / 4)));
        }
      }
      // a pale collar round the nape, seen because the head is turned
      A.stroke(Hs([[-0.262, 0.03], [-0.228, 0.115], [-0.145, 0.178]], false), 'chalk', SPOT, { w: U(0.022), p: 0.78, tin: 0.2, tout: 0.3 });
      A.stroke(Hs([[-0.25, 0.066], [-0.21, 0.145], [-0.128, 0.196]], false), 'kajal', BRD, { w: 0.55, p: 0.6, tin: 0.2, tout: 0.3 });
      // the face, flat and pale, the feathers drawn out from each eye in fine lines of the point
      A.fill(DISC, 'pastel', A.mix(BRL, PALE, 0.7), { w: 1.8, p: 1, reach: 1.5, passes: 2, ang: 0.3 });
      A.withMask(DISC, () => {
        for (const E2 of EYES) for (let k = 0; k < 18; k++) {
          const a = k * TAU / 18 + rr(-0.08, 0.08), r0x = E2.rx + 0.018, r0y = E2.ry + 0.018, r1 = rr(0.045, 0.075);
          A.stroke([H(E2.c[0] + Math.cos(a) * r0x, E2.c[1] + Math.sin(a) * r0y), H(E2.c[0] + Math.cos(a) * (r0x + r1), E2.c[1] + Math.sin(a) * (r0y + r1))], 'kajal', A.mix(BRL, 'sepia', 0.3),
            { w: 0.34, p: 0.4, tin: 0.2, tout: 0.5 });
        }
        // the face is darker round each eye, the way the feathers lie
        for (const E2 of EYES) A.stroke(A.ellipse(...H(E2.c[0], E2.c[1]), U(E2.rx * 1.55), U(E2.ry * 1.5), tilt), 'shade', A.mix(BRL, 'sepia', 0.3), { w: U(0.02), p: 0.32 });
      });
      // the heart drawn round in one fine kajal line, a ruff of short dark strokes outside it, then a row of white spots
      A.outline(DISC, 'kajal', INK, { closed: true, w: 0.62, p: 0.85, pull: 26 });
      A.resample(DISC, U(0.014), true).forEach(p => {
        const l = toL(p[0], p[1]);
        if (l[1] > 0.15) return;
        const dx = l[0] - DC[0], dy = l[1] - DC[1], d = Math.hypot(dx, dy) || 1;
        const a = H(l[0] + dx / d * 0.006, l[1] + dy / d * 0.006), b2 = H(l[0] + dx / d * rr(0.022, 0.03), l[1] + dy / d * rr(0.022, 0.03));
        A.stroke([a, b2], 'kajal', BRD, { w: 0.42, p: rr(0.5, 0.72), tin: 0.1, tout: 0.5 });
      });
      A.resample(DISC, U(0.026), true).forEach(p => {
        const l = toL(p[0], p[1]);
        if (l[1] > 0.12) return;
        const dx = l[0] - DC[0], dy = l[1] - DC[1], d = Math.hypot(dx, dy) || 1, q = H(l[0] + dx / d * 0.04, l[1] + dy / d * 0.04);
        wdot(q[0], q[1], U(0.012), 0.88);
      });
      // the white chin under the heart
      A.stroke(Hs([[fx - 0.1, 0.162], [fx, 0.19], [fx + 0.1, 0.158]], false), 'chalk', 'khadi', { w: U(0.03), p: 0.9, tin: 0.25, tout: 0.3 });
      // the moon on the crown, from the upper left
      A.stroke(Hs([[-0.06, -0.205], [-0.17, -0.18], [-0.248, -0.11], [-0.27, -0.02]], false), 'chalk', A.mix('ice', 'slate', 0.3), { w: U(0.018), p: 0.4, tin: 0.25, tout: 0.4 });
    });
    // white brows, from the notch out over each eye: they close the top of the heart
    for (const br of [[[fx - 0.004, -0.07], [fx - 0.06, -0.096], [fx - 0.13, -0.094], [fx - 0.172, -0.064]], [[fx + 0.006, -0.07], [fx + 0.04, -0.09], [fx + 0.078, -0.084], [fx + 0.1, -0.06]]]) {
      const pts = Hs(br, false); A.stroke(pts.map((p, i) => [p[0], p[1], 1 - 0.5 * i / pts.length]), 'chalk', 'khadi', { w: U(0.02), p: 1, reach: 1.6, tin: 0.05, tout: 0.45 });
    }
    // the eyes: almonds, rimmed in kajal, the outer corner lifted and drawn out in a short flick.  The iris a deep ochre
    // that fills the almond, darker under the lid; a small round pupil set toward the lamps, the lamplight caught low in
    // the iris.  Both look the same way
    const IRIS = A.mix(A.mix('ochre', 'saffron', 0.16), 'umber', 0.14), look = 0.3;
    for (const E2 of EYES) {
      const N = 16, o2 = E2.out, top = [], bot = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, xx = lerp(-1, 1, t), sn = Math.sin(t * PI), lift = 0.16 * E2.ry * xx * o2;
        top.push(H(E2.c[0] + xx * E2.rx, E2.c[1] - Math.pow(sn, 0.72) * E2.ry - lift));
        bot.push(H(E2.c[0] + xx * E2.rx, E2.c[1] + Math.pow(sn, 0.9) * E2.ry * 0.8 - lift));
      }
      const alm = top.concat(bot.slice(1, -1).reverse());
      A.fill(alm, 'pastel', IRIS, { w: 0.8, p: 1, reach: 1.7, passes: 3, ang: 0.3 });
      A.withMask(alm, () => {
        A.stroke(top.map(p => [p[0], p[1] + U(E2.ry * 0.28)]), 'shade', A.mix(IRIS, 'umber', 0.65), { w: U(E2.ry * 0.7), p: 0.6 });
        A.stroke(bot.slice(4, -4).map(p => [p[0], p[1] - U(E2.ry * 0.3)]), 'chalk', A.mix(IRIS, 'haldi', 0.5), { w: U(E2.ry * 0.32), p: 0.5, tin: 0.3, tout: 0.3 });
        const pc = H(E2.c[0] + E2.rx * look, E2.c[1] - E2.ry * 0.08), pr = U(E2.ry * 0.6);
        A.fill(A.ellipse(pc[0], pc[1], pr, pr * 1.05, tilt), 'pastel', 'kajal', { w: 0.6, p: 1, reach: 1.7, passes: 3, ang: 0.4 });
        A.dot(pc[0] - pr * 0.32, pc[1] - pr * 0.3, 'chalk', 'khadi', { w: pr * 0.55, p: 0.95 });
      }, 0);
      // the rim: heavier along the upper lid, swelling in the middle; a lighter line under
      A.stroke(top.map((p, i) => [p[0], p[1], 0.55 + 0.45 * Math.sin(PI * i / N)]), 'kajal', 'kajal', { w: 1.05, p: 1, tin: 0.06, tout: 0.06 });
      A.stroke(bot, 'kajal', 'kajal', { w: 0.62, p: 0.92, tin: 0.1, tout: 0.1 });
      const oc = o2 < 0 ? top[0] : top[N], fl = H(E2.c[0] + o2 * E2.rx * 1.42, E2.c[1] - E2.ry * 0.62);
      A.stroke([oc, [lerp(oc[0], fl[0], 0.5), lerp(oc[1], fl[1], 0.5) + 0.1], fl], 'kajal', 'kajal', { w: 0.75, p: 0.92, tin: 0, tout: 0.75 });
    }
    // the beak: small and hooked, the pale green-yellow of horn, set toward the far eye for the turn; bristles round its root
    for (let k = 0; k < 9; k++) { const a = -PI * 0.5 + (k / 8 - 0.5) * 2.6, r0 = 0.022, r1 = rr(0.04, 0.056); A.stroke([H(fx + 0.016 + Math.cos(a) * r0, 0.004 + Math.sin(a) * r0 * 0.7), H(fx + 0.016 + Math.cos(a) * r1, 0.004 + Math.sin(a) * r1 * 0.7)], 'chalk', 'khadi', { w: 0.4, p: 0.48, tin: 0.1, tout: 0.6 }); }
    const BEAK = Hs([[fx - 0.008, 0.0], [fx + 0.03, -0.006], [fx + 0.044, 0.026], [fx + 0.038, 0.062], [fx + 0.024, 0.088], [fx + 0.012, 0.058], [fx - 0.008, 0.028]], true);
    form(A, BEAK, A.mix(A.mix('sage', 'haldi', 0.4), 'stone', 0.2), { w: 0.9, lw: 0.55, rough: 0.03, off: 0.1 });
    A.stroke([H(fx + 0.03, 0.05), H(fx + 0.024, 0.075), H(fx + 0.02, 0.088)], 'kajal', A.mix('sepia', 'kajal', 0.4), { w: 0.6, p: 0.8, tin: 0.1, tout: 0.4 });
    const nos = H(fx + 0.028, 0.008); A.dot(nos[0], nos[1], 'kajal', 'kajal', { w: 0.6, p: 0.85 });
    A.pushMaskOutside(BODY);
    A.outline(HEAD, 'kajal', INK, { closed: true, w: 0.9, p: 0.9, pull: 40 });
    A.popMask();
    return { head: hc };
  }

  // A lotus capital set on the coping, the owlet's watch-post.  From the coping up: a plinth, a ring of petals turned
  // down, a beaded neck, a cup of broad petals opening up, and the slab the owlet grips.  Lime, the petals' ribs touched
  // with pink, a gold line round the slab.  The moon lights it from the left and the lamps from the right.
  // cx = its middle, top = top of the slab, base = the coping, w = width of the slab.
  function capital(A, cx, top, base, w) {
    const LIME = A.mix('khadi', 'slate', 0.2), LIMED = A.mix(LIME, 'neel', 0.34), LITE = A.mix('khadi', 'ice', 0.35);
    const INK2 = A.mix('kajal', 'neel', 0.3), PINK = A.mix('gulabi', 'hingul', 0.3), WARM = A.mix('peach', 'saffron', 0.3);
    const h = base - top, sb = top + h * 0.22, cb = top + h * 0.52, nb = cb + h * 0.12, pb = base - h * 0.12;
    const ln = (poly, o2) => A.outline(poly, 'kajal', INK2, Object.assign({ closed: true, w: 0.6, p: 0.8 }, o2 || {}));
    // a band of petals between y0 and y1, its width going w0 to w1; up = tips at the top
    const petals = (y0, y1, w0, w1, n, up) => {
      const band = [[cx - w0 / 2, y0], [cx + w0 / 2, y0], [cx + w1 / 2, y1], [cx - w1 / 2, y1]];
      A.fill(band, 'pastel', LIMED, { w: 1.6, p: 1, reach: 1.6, passes: 2, ang: 1.5 });
      A.withMask(band, () => {
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n, xr = lerp(cx - w0 / 2, cx + w0 / 2, t), xt = lerp(cx - w1 / 2, cx + w1 / 2, t), hr = w0 / n * 0.56, ht = w1 / n * 0.56;
          const root = up ? y1 : y0, tip = up ? y0 : y1, xR = up ? xt : xr, xT = up ? xr : xt, hR = up ? ht : hr, hT = up ? hr : ht;
          const dir = up ? -1 : 1, L = Math.abs(tip - root);
          const pp = A.spline([[xR - hR, root - dir * 0.6], [xT - hT * 0.95, root + dir * L * 0.55], [xT - hT * 0.45, tip - dir * L * 0.1], [xT, tip + dir * 0.3], [xT + hT * 0.45, tip - dir * L * 0.1], [xT + hT * 0.95, root + dir * L * 0.55], [xR + hR, root - dir * 0.6]], true, 0.5);
          const c = t < 0.34 ? A.mix(LIME, LITE, 0.55) : t > 0.68 ? A.mix(LIME, WARM, 0.32) : LIME;
          A.fill(pp, 'pastel', c, { w: 1.2, p: 1, reach: 1.6, passes: 2, ang: 1.5 });
          A.withMask(pp, () => A.stroke([[xR - hR * 0.9, root], [xR + hR * 0.9, root]], 'shade', LIMED, { w: L * 0.45, p: 0.35 }));
          A.stroke([[xR, root], [lerp(xR, xT, 0.82), lerp(root, tip, 0.82)]], 'chalk', PINK, { w: 0.55, p: 0.7, tin: 0.2, tout: 0.4 });
          A.outline(pp, 'kajal', INK2, { closed: true, w: 0.45, p: 0.72 });
        }
      });
      return band;
    };
    // its shadow thrown left along the coping by the lamps
    A.stroke([[cx - w * 0.42, base + 1.6], [cx - w * 0.42 - 18, base + 1.8]], 'shade', LIMED, { w: 2.8, p: 0.45, tin: 0, tout: 0.85 });
    // the plinth
    const PL = A.roughen(A.rect(cx - w * 0.44, pb, w * 0.88, base - pb + 0.3), 0.1, 5, true);
    A.fill(PL, 'pastel', LIME, { w: 1.4, p: 1, reach: 1.6, passes: 2, ang: 0.02 });
    A.withMask(PL, () => { A.stroke([[cx - w * 0.44, pb + 0.6], [cx - w * 0.1, pb + 0.6]], 'chalk', LITE, { w: 1, p: 0.6 }); A.stroke([[cx + w * 0.1, pb + 0.6], [cx + w * 0.44, pb + 0.6]], 'chalk', WARM, { w: 1, p: 0.55 }); });
    ln(PL, { w: 0.55 });
    // petals turned down onto the plinth
    ln(petals(nb, pb, w * 0.64, w * 0.82, 7, false), { w: 0.5 });
    // the neck: a band of round beads
    const NECK = A.rect(cx - w * 0.34, cb, w * 0.68, nb - cb);
    A.fill(NECK, 'pastel', LIMED, { w: 1.2, p: 1, reach: 1.6, passes: 2, ang: 0 });
    for (let i = 0, n = 13; i < n; i++) { const bx = cx - w * 0.31 + i * w * 0.62 / (n - 1); A.dot(bx, (cb + nb) / 2, 'chalk', i > 8 ? A.mix(LITE, WARM, 0.45) : LITE, { w: 1.3, p: 0.95, reach: 1.5 }); }
    ln(NECK, { w: 0.5 });
    // the cup: broad petals opening up under the slab, their tips curled out
    ln(petals(sb, cb, w * 0.92, w * 0.68, 7, true), { w: 0.5 });
    A.stroke([[cx - w * 0.46, sb + 0.7], [cx + w * 0.46, sb + 0.7]], 'shade', LIMED, { w: 1.5, p: 0.55 });
    // the slab, with a gold line round it and a row of pink dots
    const SLAB = A.roughen(A.rect(cx - w / 2, top, w, sb - top), 0.12, 5, true);
    A.fill(SLAB, 'pastel', A.mix(LIME, LITE, 0.35), { w: 1.6, p: 1, reach: 1.6, passes: 2, ang: 0.02 });
    A.withMask(SLAB, () => {
      A.stroke([[cx + w * 0.12, top + (sb - top) * 0.5], [cx + w / 2, top + (sb - top) * 0.5]], 'chalk', WARM, { w: (sb - top) * 0.7, p: 0.4, tin: 0.6, tout: 0 });
      A.stroke([[cx - w / 2, sb - 0.6], [cx + w / 2, sb - 0.6]], 'shade', LIMED, { w: 1.2, p: 0.5 });
    });
    M.cityHand.hl(A, [cx - w / 2 + 1.2, top + (sb - top) * 0.36], [cx + w / 2 - 1.2, top + (sb - top) * 0.36], 'gold', 'gold', { w: 0.7, p: 0.85, ov: 0.4 });
    for (let i = 0, n = 14; i < n; i++) A.dot(cx - w / 2 + 2.4 + i * (w - 4.8) / (n - 1), top + (sb - top) * 0.7, 'chalk', PINK, { w: 0.8, p: 0.8 });
    ln(SLAB, { w: 0.7, p: 0.85 });
  }

  // one clay lamp: (x, y) = where it stands, s = its width, lvl = how much oil is left (0..1)
  function diya(A, x, y, s, lvl) {
    const bowl = [];
    for (let i = 0; i <= 14; i++) { const a = i * PI / 14; bowl.push([x - Math.cos(a) * s * 0.5, y - s * 0.32 + Math.sin(a) * s * 0.3]); }
    const spout = [[x + s * 0.42, y - s * 0.33], [x + s * 0.72, y - s * 0.44], [x + s * 0.66, y - s * 0.3], [x + s * 0.4, y - s * 0.2]];
    form(A, spout, 'brick', { w: 1, lw: 0.55, rough: 0.1 });
    form(A, bowl, A.mix('brick', 'geru', 0.5), { w: 1.2, lw: 0.6, rough: 0.12 });
    const oy = y - s * 0.32 + (1 - lvl) * s * 0.1;
    A.stroke([[x - s * 0.42 + (1 - lvl) * s * 0.05, oy], [x + s * 0.42 - (1 - lvl) * s * 0.05, oy]], 'chalk', A.mix('ochre', 'kajal', 0.25), { w: s * 0.1, p: 0.9 });
    A.stroke([[x - s * 0.5, y - s * 0.33], [x + s * 0.5, y - s * 0.33]], 'chalk', 'peach', { w: s * 0.06, p: 0.8 });
    A.stroke([[x - s * 0.22, y - s * 0.12], [x + s * 0.12, y - s * 0.1]], 'chalk', 'peach', { w: 0.6, p: 0.45 });
  }
  // a small pale moth, wings open, drawn to the light
  function moth(A, x, y, s, ang) {
    for (const sg of [-1, 1]) {
      const w1 = A.xf([[0, 0], [s * 0.9, -s * 0.55], [s * 1.0, s * 0.05], [s * 0.2, s * 0.25]], { x, y, rot: ang, sx: sg, sy: 1 });
      A.fill(w1, 'chalk', A.mix('cream', 'stone', 0.3), { w: Math.max(0.8, s * 0.4), p: 0.95, reach: 1.5, passes: 2 });
      A.outline(w1, 'kajal', 'sepia', { closed: true, w: 0.45, p: 0.6 });
    }
    A.stroke([[x, y - s * 0.3], [x, y + s * 0.5]], 'kajal', 'sepia', { w: 0.8, p: 0.9 });
  }
  // a house gecko flat on the lime, head up: (x, y) = its middle, s = nose to tail tip
  function gecko(A, x, y, s, c) {
    const P = frame(x, y, s), ink = A.mix('sepia', 'neel', 0.25);
    // tail first, curling away
    const tail = A.spline(P.all([[0, 0.12], [0.03, 0.3], [0.1, 0.45], [0.22, 0.52], [0.3, 0.46]]), false, 0.5);
    A.stroke(tail.map((p, i) => [p[0], p[1], 1 - i / tail.length * 0.7]), 'chalk', c, { w: s * 0.075, p: 1, reach: 1.5, tin: 0, tout: 0.6 });
    // legs: bent at the elbow, splayed, each foot a fan of round toe pads
    for (const q of [[-1, -0.16, -1], [1, -0.14, -1], [-1, 0.1, 1], [1, 0.11, 1]]) {
      const sh = P(q[0] * 0.045, q[1]), el = P(q[0] * 0.15, q[1] + q[2] * 0.02), ft = P(q[0] * 0.17, q[1] + q[2] * 0.11);
      A.stroke([sh, el, ft], 'chalk', c, { w: s * 0.045, p: 1, reach: 1.5, tin: 0, tout: 0.1 });
      for (let k = -2; k <= 2; k++) { const a = Math.atan2(ft[1] - el[1], ft[0] - el[0]) + k * 0.42; A.stroke([ft, [ft[0] + Math.cos(a) * s * 0.05, ft[1] + Math.sin(a) * s * 0.05]], 'kajal', c, { w: s * 0.018, p: 0.95 }); A.dot(ft[0] + Math.cos(a) * s * 0.055, ft[1] + Math.sin(a) * s * 0.055, 'chalk', c, { w: s * 0.03, p: 0.95 }); }
    }
    // body and head
    const body = A.spline(P.all([[0, -0.4], [0.05, -0.36], [0.045, -0.3], [0.06, -0.2], [0.065, 0], [0.04, 0.12], [0, 0.16], [-0.04, 0.12], [-0.065, 0], [-0.06, -0.2], [-0.045, -0.3], [-0.05, -0.36]]), true, 0.5);
    A.fill(body, 'chalk', c, { w: Math.max(0.8, s * 0.05), p: 1, reach: 1.5, passes: 2, ang: 1.5 });
    A.withMask(body, () => { for (let k = 0; k < 5; k++) { const q = P(0, -0.16 + k * 0.06); A.stroke([[q[0] - s * 0.03, q[1]], [q[0] + s * 0.03, q[1]]], 'chalk', A.mix(c, 'sepia', 0.35), { w: 0.55, p: 0.7 }); } });
    A.outline(body, 'kajal', ink, { closed: true, w: 0.45, p: 0.7, pull: 16 });
    for (const sg of [-1, 1]) { const e = P(sg * 0.035, -0.32); A.dot(e[0], e[1], 'kajal', 'kajal', { w: 0.9, p: 1 }); }
  }

  /* A clump of bushes in the night, the Mewar way: rounded masses of leaf, the top ones laid first and the lower ones
     over them; each mass laid with the side of the stick, moonlit on its upper side and dark where it turns under,
     small pointed leaves picked out on it (chalk where the light sits, kajal below), a few sprigs breaking out of the
     top, and one broken kajal line round the clump only where it meets the sky, fainter where one mass lies on another. */
  function bush(A, cx, by, R, pal) {
    const rr = A.rr, lobes = [], n = 3 + (A.rnd() * 3 | 0);
    for (let i = 0; i < n; i++) {
      const f = (i + rr(0.2, 0.8)) / n, sd = (f - 0.5) * 2, r = R * rr(0.45, 0.66) * (1 - 0.28 * Math.abs(sd));
      lobes.push([cx + sd * R * rr(0.62, 0.88), by - r * rr(0.6, 0.85) - (1 - Math.abs(sd)) * R * rr(0.15, 0.4), r]);
    }
    for (let k = 0; k < 1 + (A.chance(0.6) ? 1 : 0); k++) lobes.push([cx + rr(-0.45, 0.45) * R, by - R * rr(0.95, 1.25), R * rr(0.36, 0.52)]);
    lobes.sort((p, q) => p[1] - q[1]);
    const polys = lobes.map(([x, y, r]) => {
      const k = 7 + (A.rnd() * 5 | 0), ph = rr(0, TAU), sq = rr(0.8, 0.92), pts = [];
      for (let j = 0; j < 64; j++) {
        const a = j / 64 * TAU, bump = Math.pow(Math.abs(Math.sin(k * a / 2 + ph)), 0.7), rad = r * (0.9 + 0.13 * bump + rr(-0.025, 0.025));
        pts.push([x + Math.cos(a) * rad, y + Math.sin(a) * rad * sq]);
      }
      return A.roughen(pts, r * 0.03, r * 0.5, true);
    });
    const hidden = (i, p) => { for (let k = i + 1; k < polys.length; k++) if (A.inside([polys[k]], p[0], p[1])) return true; return false; };
    polys.forEach((poly, i) => {
      const [x, y, r] = lobes[i];
      A.fill(poly, 'pastel', A.vary(pal.c, 0.025), { w: 3.2, p: 1, reach: 1.5, passes: 2, ang: rr(-1, 1) });
      A.withMask(poly, () => {
        A.stroke(A.ellipse(x - r * 0.18, y - r * 0.22, r * 0.62, r * 0.48, 0, PI * 0.95, PI * 1.8), 'side', pal.lit, { w: r * 0.5, p: rr(0.24, 0.36) });
        A.stroke(A.ellipse(x + r * 0.1, y + r * 0.2, r * 0.86, r * 0.7, 0, 0.1, PI * 0.95), 'side', pal.dark, { w: r * 0.5, p: 0.5 });
        for (const p of A.scatter([poly], rr(2.3, 3.0), { jit: 0.5 })) {
          if (A.chance(0.28)) continue;
          const up = (p[1] - y) / r, a = Math.atan2(p[1] - y, p[0] - x) + rr(-0.6, 0.6), L = rr(1.1, 2.0), tip = [p[0] + Math.cos(a) * L, p[1] + Math.sin(a) * L];
          if (up < 0.1 && A.chance(0.75)) A.stroke([[p[0], p[1]], tip], 'chalk', A.pick([pal.lit, pal.leaf, pal.lit]), { w: rr(0.8, 1.15), p: rr(0.5, 0.85), tin: 0.15, tout: 0.7 });
          else A.stroke([[p[0], p[1]], tip], 'kajal', A.pick([pal.ink, pal.dark]), { w: rr(0.5, 0.8), p: rr(0.4, 0.72), tin: 0.15, tout: 0.7 });
        }
      });
    });
    polys.forEach((poly, i) => {
      let run = [], faint = null;
      const flush = () => { if (run.length > 3) A.stroke(run, 'kajal', pal.ink, { w: faint ? 0.42 : 0.62, p: faint ? 0.38 : 0.72, tin: 0.08, tout: 0.08 }); run = []; };
      for (let j = 0; j <= poly.length; j++) {
        const p = poly[j % poly.length];
        if (hidden(i, p) || A.chance(0.015)) { flush(); continue; }
        let inner = false; for (let k = 0; k < i; k++) if (A.inside([polys[k]], p[0], p[1])) { inner = true; break; }
        if (faint !== null && faint !== inner && run.length) { const lp = run[run.length - 1]; flush(); run.push(lp); }
        faint = inner; run.push(p);
      }
      flush();
    });
    // sprigs breaking out of the top of the clump
    const ns = 4 + (A.rnd() * 4 | 0);
    for (let k = 0, tries = 0; k < ns && tries < 40; tries++) {
      const li = A.rnd() * lobes.length | 0, L0 = lobes[li], a = -PI / 2 + rr(-1.2, 1.2);
      const p = [L0[0] + Math.cos(a) * L0[2] * 0.93, L0[1] + Math.sin(a) * L0[2] * 0.8];
      if (hidden(li, p)) continue;
      k++;
      const len = rr(2.2, 4), e = [p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len];
      A.stroke([[p[0] - Math.cos(a), p[1] - Math.sin(a)], [lerp(p[0], e[0], 0.5) + rr(-0.4, 0.4), lerp(p[1], e[1], 0.5)], e], 'kajal', pal.ink, { w: 0.4, p: 0.6, tout: 0.5 });
      for (let j = 0; j < 3; j++) {
        const t = rr(0.35, 1), q = [lerp(p[0], e[0], t), lerp(p[1], e[1], t)], b2 = a + (j % 2 ? 0.8 : -0.8) + rr(-0.2, 0.2), Lf = rr(1.1, 1.7);
        A.stroke([q, [q[0] + Math.cos(b2) * Lf, q[1] + Math.sin(b2) * Lf]], 'chalk', A.pick([pal.lit, pal.leaf]), { w: rr(0.8, 1.05), p: 0.8, tin: 0.15, tout: 0.7 });
      }
    }
  }

  M.folioArt['claudemonitor'] = function (A, b) {
    const X = u => b.x0 + u, Y = v => b.y0 + v, rr = A.rr, hl = M.cityHand.hl;
    const all = A.rect(b.x0 - 2, b.y0 - 2, b.w + 4, b.h + 4);
    const parTop = Y(112);
    // ---- night: deep indigo laid with the side of the stick, rubbed, laid again
    flat(A, all, A.mix('neel', 'night', 0.35), { w: 18, c2: A.mix('neel', 'lapis', 0.12), top: 0.6 });
    rub(A, b.x0, b.y0, b.x1, b.y1, 6, 0.42, -0.4); rub(A, b.x0, b.y0, b.x1, b.y1, 2, 0.35, -0.4);
    A.fill(A.rect(b.x0 - 2, Y(50), b.w + 4, 46), 'side', A.mix('lapis', 'storm', 0.5), { w: 12, p: 0.24, reach: 0.85, passes: 1, ang: 0.02 });
    rub(A, b.x0, Y(36), b.x1, Y(108), 6, 0.32, 0.05); rub(A, b.x0, Y(44), b.x1, Y(104), 2, 0.3, 0.05);
    // ---- stars, then the moon in a soft cold halo
    M.stars(A, A.rect(b.x0, Y(12), b.w, 68), { spacing: 12, milky: false, gold: 0.1 });
    const mx = X(44), my = Y(38);
    A.dot(mx, my, 'pastel', 'lapis', { w: 64, p: 0.3, len: 1, reach: 0.82, hard: 1.0 });
    A.dot(mx, my, 'pastel', 'slate', { w: 42, p: 0.28, len: 1, reach: 0.84, hard: 1.0 });
    A.dot(mx, my, 'pastel', 'sky', { w: 28, p: 0.26, len: 0.6, reach: 0.86, hard: 1.05 });
    M.moon(A, mx, my, 10.5, { tilt: -0.3, phase: 0.42, halo: false });
    // ---- billowing clouds along the top
    cloudBank(A, X(-10), X(70), Y(14), { k: 0.85 });
    cloudBank(A, X(146), X(310), Y(17), { k: 1.0 });
    cloudBank(A, X(226), X(276), Y(36), { k: 0.55, scroll: 0.8 });
    // ---- a white chhatri far off, asleep, one arch still lit.  Lime white under the moon: a ribbed cupola on a low drum
    // with a ring of lotus petals at its foot and a gold finial, a deep sloping eave with a small pinnacle at each
    // corner, and under it three cusped arches between slim pillars.  The moon is on the left, so each gore of the
    // cupola is shaded in a soft blue-violet pastel along the right of its rib, more so toward the right of the dome
    {
      const cx = X(232), by = Y(86);
      const WH = A.mix('khadi', 'neel', 0.15), WHL = A.mix('khadi', 'ice', 0.4), SH = A.mix(A.mix('khadi', 'neel', 0.42), 'plum', 0.14), SHD = A.mix(SH, 'neel', 0.3);
      const INKc = A.mix('kajal', 'neel', 0.4), line = (poly, w, p) => A.outline(poly, 'kajal', INKc, { closed: true, w: w || 0.5, p: p || 0.72 });
      // a cusped arch: jambs up to the spring, then a pointed head whose edge bulges into the wall in `nl` lobes
      const cusped = (ax, base, w, h, nl, amp) => {
        const spring = base - h * 0.5, rise = h * 0.5, head = [];
        for (let i = 0; i <= 36; i++) {
          const f = i / 36, th = f * PI, x0 = ax - Math.cos(th) * w / 2, y0 = spring - rise * (1 - Math.pow(Math.abs(Math.cos(th)), 1.7));
          const dx = x0 - ax, dy = y0 - (spring + rise * 0.15), dl = Math.hypot(dx, dy) || 1, bulge = amp * Math.abs(Math.sin(PI * nl * f));
          head.push([x0 + dx / dl * bulge, y0 + dy / dl * bulge]);
        }
        return [[ax - w / 2, base]].concat(head, [[ax + w / 2, base]]);
      };
      // the body under the eave, lime white, the right side in shade
      const body = A.rect(cx - 15, by - 18, 30, 18);
      A.fill(body, 'pastel', WH, { w: 2.2, p: 1, reach: 1.5, passes: 2, ang: 1.5 });
      A.withMask(body, () => {
        A.fill(A.rect(cx + 8.5, by - 18, 7, 18), 'shade', SH, { w: 2.4, p: 0.45, passes: 1, ang: 1.5 });
        A.stroke([[cx - 15, by - 16.4], [cx + 15, by - 16.4]], 'shade', SHD, { w: 2.2, p: 0.6 });
        for (const px of [-13.9, -4.5, 4.5, 13.9]) A.stroke([[cx + px - 0.5, by - 15.6], [cx + px - 0.5, by]], 'chalk', WHL, { w: 0.6, p: 0.6 });
      });
      for (const k of [-1, 0, 1]) {
        const ar = cusped(cx + k * 9, by - 0.5, 6.8, 12.6, 5, 0.62);
        A.fill(ar, 'pastel', k === 1 ? 'saffron' : A.mix('neel', 'night', 0.35), { w: 1.2, p: 1, reach: 1.6, passes: 2, ang: 1.5 });
        if (k === 1) { A.dot(cx + 9, by - 8.6, 'pastel', A.mix('haldi', 'saffron', 0.3), { w: 4.2, p: 0.75, reach: 1.0, hard: 1.1 }); A.dot(cx + 9, by - 8.2, 'chalk', 'haldi', { w: 1.5, p: 0.95 }); A.dot(cx + 9, by - 8.6, 'chalk', 'khadi', { w: 0.6, p: 0.9 }); }
        line(ar, 0.5, 0.8);
        // the moon catches the left edge of each opening's cusps
        A.stroke(ar.slice(2, 14).map(p => [p[0] - 0.45, p[1] - 0.2]), 'chalk', WHL, { w: 0.45, p: 0.55, tin: 0.2, tout: 0.3 });
      }
      line(body, 0.5, 0.7);
      // the eave: a thin slab with a sloping underside throwing its shadow on the wall
      const under = [[cx - 17.8, by - 19.2], [cx + 17.8, by - 19.2], [cx + 15.2, by - 17.2], [cx - 15.2, by - 17.2]];
      A.fill(under, 'pastel', SH, { w: 1.2, p: 1, reach: 1.5, passes: 2, ang: 0 });
      line(under, 0.45, 0.7);
      const slab = A.rect(cx - 18, by - 21, 36, 1.9);
      A.fill(slab, 'pastel', WHL, { w: 1.2, p: 1, reach: 1.5, passes: 2, ang: 0 });
      A.withMask(slab, () => A.stroke([[cx + 6, by - 20], [cx + 18, by - 20]], 'shade', SH, { w: 1.6, p: 0.45 }));
      line(slab, 0.5, 0.75);
      // a small pinnacle at each corner of the eave
      for (const sx of [-16.2, 16.2]) {
        const px = cx + sx;
        A.stroke([[px, by - 21], [px, by - 23.2]], 'chalk', WH, { w: 1.1, p: 1 });
        const kd = A.spline([[px - 1.3, by - 23.1], [px - 1.15, by - 24.3], [px, by - 25.3], [px + 1.15, by - 24.3], [px + 1.3, by - 23.1]], true, 0.6);
        A.fill(kd, 'pastel', sx < 0 ? WHL : WH, { w: 0.8, p: 1, reach: 1.5, passes: 2 });
        line(kd, 0.4, 0.7);
        A.stroke([[px, by - 25.3], [px, by - 26.6]], 'gold', 'gold', { w: 0.55, p: 0.9 });
      }
      // the drum, with a ring of lotus petals turned up round the foot of the cupola
      const drum = A.rect(cx - 10.6, by - 23.2, 21.2, 2.3);
      A.fill(drum, 'pastel', WH, { w: 1.2, p: 1, reach: 1.5, passes: 2, ang: 0 });
      A.withMask(drum, () => A.stroke([[cx + 4, by - 22], [cx + 10.6, by - 22]], 'shade', SH, { w: 2, p: 0.5 }));
      line(drum, 0.45, 0.7);
      // the cupola: a profile a little fuller than a half circle, drawn to a point at the top
      const prof = [[0, 22.9], [10.7, 23.2], [11.6, 24.9], [11.6, 27.4], [10.5, 30.2], [8.4, 32.8], [5.6, 35.0], [2.6, 36.4], [0, 36.9]];
      const hwAt = yy => { const v = by - yy; for (let i = 1; i < prof.length; i++) if (v <= prof[i][1]) { const a = prof[i - 1], c = prof[i], f = (v - a[1]) / (c[1] - a[1]); return lerp(a[0], c[0], clamp(f, 0, 1)); } return 0; };
      const domeP = A.spline(prof.slice(1).map(p => [cx - p[0], by - p[1]]).concat(prof.slice(1, -1).reverse().map(p => [cx + p[0], by - p[1]])), true, 0.6);
      A.fill(domeP, 'pastel', WH, { w: 1.8, p: 1, reach: 1.5, passes: 2, ang: 0.6 });
      const meridian = (phi, off) => { const pts = []; for (let yy = by - 23.4; yy >= by - 36.6; yy -= 0.6) pts.push([cx + hwAt(yy) * Math.sin(phi) + off, yy]); return pts; };
      A.withMask(domeP, () => {
        // the whole right of the dome turns from the moon
        A.stroke(A.ellipse(cx + 5.5, by - 29, 7.5, 9, 0, -1.4, 1.5), 'shade', SH, { w: 5, p: 0.42 });
        // light on the left shoulder
        A.stroke(A.ellipse(cx - 2, by - 28.5, 8.6, 6.6, 0, 3.3, 4.5), 'chalk', WHL, { w: 1.6, p: 0.55, tin: 0.3, tout: 0.3 });
        // ribs: each a pale raised line, the gore beside it on the right shaded in soft pastel
        for (let k = -3; k <= 3; k++) {
          const phi = k * PI / 7.4, shade = 0.34 + 0.18 * (k + 3) / 6;
          A.stroke(meridian(phi, 0.85), 'side', SH, { w: 1.7, p: shade, tin: 0.15, tout: 0.4 });
          A.stroke(meridian(phi, 0.3), 'shade', SHD, { w: 0.6, p: 0.42, tin: 0.1, tout: 0.4 });
          A.stroke(meridian(phi, -0.15), 'chalk', k < 1 ? WHL : A.mix(WH, SH, 0.25), { w: 0.55, p: 0.8, tin: 0.1, tout: 0.4 });
        }
      });
      // petals of the lotus ring over the foot of the dome
      for (let i = 0; i < 9; i++) {
        const px = cx - 9.4 + i * 2.35, pet = A.spline([[px - 1.15, by - 23.2], [px - 0.9, by - 24.4], [px, by - 25.3], [px + 0.9, by - 24.4], [px + 1.15, by - 23.2]], true, 0.5);
        A.fill(pet, 'pastel', i > 5 ? A.mix(WH, SH, 0.35) : WHL, { w: 0.7, p: 1, reach: 1.5, passes: 2 });
        A.outline(pet, 'kajal', INKc, { closed: true, w: 0.32, p: 0.6 });
      }
      line(domeP, 0.55, 0.78);
      // the finial: an upturned lotus cap, a kalash, a bead, a spike, all in gold
      const cap = A.spline([[cx - 2.2, by - 36.4], [cx - 1.2, by - 37.6], [cx, by - 37.9], [cx + 1.2, by - 37.6], [cx + 2.2, by - 36.4]], true, 0.5);
      A.fill(cap, 'gold', 'gold', { w: 0.7, p: 1, reach: 1.5, passes: 2 });
      A.dot(cx, by - 38.9, 'gold', 'gold', { w: 1.9, p: 1 });
      A.dot(cx, by - 40.2, 'gold', 'gold', { w: 1.1, p: 1 });
      A.stroke([[cx, by - 40.6], [cx, by - 42.2]], 'gold', 'gold', { w: 0.55, p: 0.95, tout: 0.6 });
      A.stroke([[cx - 0.5, by - 39.2], [cx - 0.3, by - 38.6]], 'chalk', 'khadi', { w: 0.45, p: 0.7 });
    }
    // ---- the tree line behind the parapet: round crowns, a cypress or two, in the blue of night
    const treeC = A.mix('bottle', 'neel', 0.45), treeL = A.mix('teal', 'neel', 0.4), leafD = A.mix('moss', 'neel', 0.45);
    A.fill(A.rect(b.x0 - 2, Y(80), b.w + 4, 40), 'pastel', A.mix(treeC, 'kajal', 0.15), { w: 4, p: 1, reach: 1.55, passes: 2, ang: 0.2 });
    // clumps of bushes, uneven along the line, a bluer green and an olive one by turns, never two of a size
    const bushes = [];
    for (let u = -12; u < 316; u += rr(19, 33)) if (Math.abs(u - 232) > 17) bushes.push([u, rr(95, 103), rr(13, 20.5)]);
    bushes.forEach((c, i) => {
      const olive = i % 2 ? A.chance(0.7) : A.chance(0.3);
      bush(A, X(c[0]), Y(c[1]), c[2], {
        c: olive ? A.mix(A.mix('moss', 'bottle', 0.5), 'neel', 0.48) : A.mix(treeC, 'neel', 0.08),
        lit: A.mix(treeL, 'slate', 0.22), leaf: A.mix(olive ? 'moss' : 'teal', 'neel', 0.35), dark: A.mix('night', 'kajal', 0.3),
        ink: A.mix('kajal', 'neel', 0.4)
      });
    });
    for (const u of [134, 290]) {
      const cy = [[X(u), Y(38)], [X(u + 6), Y(62)], [X(u + 7), Y(94)], [X(u - 7), Y(94)], [X(u - 6), Y(62)]];
      const rp = A.spline(cy, true, 1.2);
      A.fill(rp, 'pastel', A.mix('bottle', 'neel', 0.55), { w: 2.4, p: 1, reach: 1.5, passes: 2, ang: 1.4 });
      A.withMask(rp, () => { for (let v = 42; v < 94; v += 3.1) A.stroke([[X(u) - (v - 38) * 0.2, Y(v + 1.6)], [X(u), Y(v - 0.4)], [X(u) + (v - 38) * 0.2, Y(v + 1.6)]], 'chalk', treeL, { w: 0.7, p: 0.55 }); });
      A.outline(rp, 'kajal', A.mix('kajal', 'neel', 0.4), { closed: true, w: 0.6, p: 0.6 });
    }
    // a lower row nearer the parapet, deeper in the dark, half hidden by the coping
    for (let u = -8; u < 314; u += rr(17, 29)) {
      const olive = A.chance(0.45);
      bush(A, X(u + rr(-3, 3)), Y(rr(113, 117)), rr(10, 15.5), {
        c: A.mix(olive ? A.mix(A.mix('moss', 'bottle', 0.5), 'neel', 0.5) : treeC, 'night', 0.3),
        lit: A.mix(treeL, 'neel', 0.3), leaf: A.mix(olive ? 'moss' : 'teal', 'neel', 0.5), dark: A.mix('night', 'kajal', 0.4),
        ink: A.mix('kajal', 'neel', 0.4)
      });
    }
    M.fireflies(A, [[X(0), Y(66)], [X(300), Y(66)], [X(300), Y(104)], [X(0), Y(104)]], 6, { s: 0.4, trail: 0.5 });

    // ---- the lime parapet: a coping, then a band of jali between short pillars
    const lime = A.mix('khadi', 'slate', 0.36), limeD = A.mix(lime, 'neel', 0.35);
    flat(A, A.rect(b.x0 - 2, parTop + 6, b.w + 4, b.h), lime, { w: 10, top: 0.5, rub: 5, ang: 0.05, rubBox: A.rect(b.x0 + 9, parTop + 8, b.w - 18, b.y1 - parTop - 17) });
    const cope = A.rect(b.x0 - 2, parTop, b.w + 4, 7);
    A.fill(cope, 'pastel', A.mix('khadi', 'slate', 0.24), { w: 3, p: 1, reach: 1.6, passes: 2, ang: 0.02 });
    A.fill(A.rect(b.x0 - 2, parTop + 7, b.w + 4, 2.6), 'shade', limeD, { w: 2.4, p: 0.6, passes: 1, ang: 0 });
    hl(A, [b.x0 - 4, parTop], [b.x1 + 4, parTop], 'kajal', 'kajal', { w: 0.8, p: 0.8 });
    hl(A, [b.x0 - 4, parTop + 7], [b.x1 + 4, parTop + 7], 'kajal', 'kajal', { w: 0.7, p: 0.7 });
    hl(A, [b.x0 - 4, parTop + 2.2], [b.x1 + 4, parTop + 2.2], 'chalk', 'khadi', { w: 0.9, p: 0.7 });
    const pT = parTop + 16, pB = b.y1 - 5;
    const pillars = []; for (let u = -8; u < 330; u += 46) pillars.push(u);
    for (let i = 0; i < pillars.length - 1; i++) {
      const a = X(pillars[i] + 6), c = X(pillars[i + 1] - 6), pn = A.rect(a, pT, c - a, pB - pT);
      A.fill(pn, 'pastel', A.vary(A.mix('neel', 'night', 0.4), 0.02), { w: 3, p: 1, reach: 1.6, passes: 2, ang: 0.8 });
      // each panel cut by its own hand: its own spacing, its own slant, its own wobble, the lime a shade off the next
      A.withMask(pn, () => {
        const st = rr(4.7, 6.3), sk = (pB - pT) * rr(0.86, 1.14), wob = rr(0.25, 0.85), lw = rr(1.3, 1.75);
        const lc = A.mix(lime, A.pick(['khadi', 'slate', 'neel', 'khadi']), rr(0.04, 0.16));
        for (let d = -60 + rr(0, st); d < 100; d += st * rr(0.94, 1.06)) {
          A.stroke([[a + d + rr(-0.35, 0.35), pT], [a + d + sk + rr(-0.5, 0.5), pB]], 'chalk', lc, { w: lw * rr(0.9, 1.1), p: rr(0.8, 1), reach: 1.5, wob });
          A.stroke([[a + d + sk + rr(-0.35, 0.35), pT], [a + d + rr(-0.5, 0.5), pB]], 'chalk', lc, { w: lw * rr(0.9, 1.1), p: rr(0.8, 1), reach: 1.5, wob });
        }
      });
      A.outline(pn, 'kajal', A.mix('kajal', 'neel', 0.3), { closed: true, w: 0.65, p: 0.75, pull: 40 });
    }
    for (const u of pillars) {
      const pl = A.rect(X(u - 4), parTop + 9, 8, b.y1 - parTop);
      A.fill(pl, 'pastel', A.mix('khadi', 'slate', 0.3), { w: 2.4, p: 1, reach: 1.6, passes: 2, ang: 1.55 });
      A.outline(pl, 'kajal', A.mix('kajal', 'neel', 0.3), { closed: true, w: 0.6, p: 0.7 });
      A.dot(X(u), parTop + 12.5, 'chalk', 'gulabi', { w: 2.2, p: 0.8 });
    }
    hl(A, [b.x0 - 4, parTop + 11.5], [b.x1 + 4, parTop + 11.5], 'kajal', A.mix('hingul', 'neel', 0.2), { w: 0.75, p: 0.75 });
    // a vine painted along the lime under the coping: one stem, a leaf and a flower by turns
    {
      const vy = parTop + 9.6, stem = [];
      for (let u = -4; u <= 306; u += 2) stem.push([X(u), vy + Math.sin(u / 7.5) * 0.9]);
      A.stroke(stem, 'kajal', A.mix('malachite', 'neel', 0.3), { w: 0.55, p: 0.7 });
      for (let u = 2, i = 0; u < 300; u += 7.5, i++) {
        const q = [X(u), vy + Math.sin(u / 7.5) * 0.9];
        if (i % 2) A.stroke([[q[0], q[1]], [q[0] + 2.2, q[1] - 1.2]], 'chalk', A.mix('malachite', 'neel', 0.2), { w: 1.2, p: 0.85, tin: 0.1, tout: 0.6 });
        else { A.dot(q[0], q[1], 'chalk', A.pick(['hingul', 'gulabi', 'hingul', 'khadi']), { w: 1.8, p: 0.9 }); A.dot(q[0], q[1], 'chalk', 'haldi', { w: 0.7, p: 0.9 }); }
      }
    }
    hl(A, [b.x0 - 4, pB + 2], [b.x1 + 4, pB + 2], 'kajal', A.mix('hingul', 'neel', 0.2), { w: 0.75, p: 0.75 });
    // a gecko on the pillar near the lamps, waiting for moths
    gecko(A, X(130), parTop + 30, 26, A.mix('umber', 'sand', 0.45));

    // ---- the five lamps on the coping, set down by hand, each burning its own way in the night air: one steady with a
    // little sway, one tall, one guttering on the last of its oil, one bent right over by a draught, one low and
    // wavering.  The light each gives follows its flame, not its place in the row
    const lamps = [
      { u: 157, s: 10.2, oil: 0.75, h: 10.2, lean: 0.9 },
      { u: 185.5, s: 10.8, oil: 0.95, h: 14.6, lean: -0.7 },
      { u: 212.5, s: 9.4, oil: 0.06, h: 3.1, lean: 1.0, gutter: true },
      { u: 238.5, s: 10.4, oil: 0.6, h: 11.6, lean: 5.4 },
      { u: 269, s: 9.8, oil: 0.4, h: 7.4, lean: -1.6 }];
    for (const L of lamps) {
      L.x = X(L.u); L.y = parTop + 0.6; L.k = clamp(L.h / 14.6, 0.12, 1);
      const fx = L.x + L.s * 0.36 + L.lean * 0.42, k = L.k;
      halo(A, fx, L.y - L.s * 0.4 - L.h * 0.42, 5 + 0.68 * L.h, k, null, parTop - 0.8);
      // the light it lays on the coping: a warm streak, longer the brighter it burns, pushed the way the flame leans
      const mx = L.x + 3 + L.lean * 0.6;
      A.stroke([[mx - 5 - 9 * k, parTop + 1.6], [mx + 5 + 9 * k, parTop + 1.6]], 'chalk', A.mix('peach', 'saffron', 0.3), { w: 1.6 + 1.2 * k, p: 0.35 + 0.45 * k, tin: 0.45, tout: 0.45 });
      A.stroke([[mx - 3 - 5 * k, parTop + 4.6], [mx + 3 + 5 * k, parTop + 4.6]], 'chalk', 'peach', { w: 1.2, p: 0.25 + 0.3 * k, tin: 0.45, tout: 0.45 });
    }
    // ---- the owlet's watch-post: a small lotus capital set on the coping
    const ox = X(92), oy = parTop - 19;
    capital(A, ox, oy, parTop + 0.4, 46);

    // ---- the owlet keeping watch: the body turned a little toward the lamps, the head turned further and tilted, listening
    owlet(A, ox, oy + 0.4, 68, { tilt: 0.14 });

    // ---- the lamps themselves, and their flames
    for (const L of lamps) {
      const x = L.x, y = L.y, fx = x + L.s * 0.36;
      diya(A, x, y, L.s, L.oil);
      flame(A, fx, y - L.s * 0.38, L.h, L.lean);
      if (L.gutter) {
        // the wick nearly drowned: a blue root to the flame, and a thread of smoke curling up from it
        A.dot(fx, y - L.s * 0.38 - 0.4, 'chalk', A.mix('lapis', 'sky', 0.4), { w: 1.1, p: 0.7 });
        const sm = []; for (let i = 0; i <= 16; i++) { const t = i / 16; sm.push([fx + 1.6 + Math.sin(t * 5.4) * 2.4 + t * 4, y - 7 - t * 24, 1 - t * 0.9]); }
        A.stroke(sm, 'chalk', A.mix('stone', 'slate', 0.35), { w: 0.95, p: 0.5, tin: 0.1, tout: 0.6 });
      }
    }
    moth(A, X(171), Y(78), 2.8, 0.4);
    M.fireflies(A, [[X(130), Y(40)], [X(300), Y(40)], [X(300), Y(94)], [X(130), Y(94)]], 3, { s: 0.5, trail: 0.6 });
    M.fireflies(A, [[X(2), Y(56)], [X(60), Y(56)], [X(60), Y(96)], [X(2), Y(96)]], 2, { s: 0.5, trail: 0.6 });
  };

  /* ============================================================ the festival elephant */
  // rub a field with the finger in short strokes that never reach past the box, so no paper is dragged in from the margin
  function rub(A, x0, y0, x1, y1, r, k, ang) {
    const m = r + 1.2, ax = x0 + m, ay = y0 + m, bx = x1 - m, by = y1 - m;
    if (bx <= ax || by <= ay) return;
    const L = r * 4, n = Math.ceil((bx - ax) * (by - ay) / (r * r * 1.6));
    for (let i = 0; i < n; i++) {
      const a = ang + A.rr(-0.25, 0.25), sx = A.rr(ax, bx), sy = A.rr(ay, by);
      const ex = Math.min(bx, Math.max(ax, sx + Math.cos(a) * L)), ey = Math.min(by, Math.max(ay, sy + Math.sin(a) * L));
      A.smudge([[sx, sy], [(sx + ex) / 2 + A.rr(-1, 1), (sy + ey) / 2 + A.rr(-1, 1)], [ex, ey]], { r: r * A.rr(0.85, 1.1), k });
    }
  }
  // a small five-petal flower of chalk with a gold or yellow heart
  function bloom(A, x, y, r, c, heart) {
    const a0 = A.rr(0, TAU);
    for (let k = 0; k < 5; k++) { const a = a0 + k * TAU / 5 + A.rr(-0.1, 0.1); A.stroke([[x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2], [x + Math.cos(a) * r, y + Math.sin(a) * r]], 'chalk', c, { w: Math.max(0.7, r * 0.75), p: 0.95, reach: 1.5, tin: 0.1, tout: 0.3 }); }
    A.dot(x, y, 'chalk', heart || 'haldi', { w: Math.max(0.6, r * 0.6), p: 1, reach: 1.5 });
  }
  // a marigold seen from the side: a ball of ruffled petals
  function marigold(A, x, y, r, c) {
    A.dot(x, y, 'pastel', c, { w: r * 2, p: 1, reach: 1.5, len: r * 0.1 });
    for (let k = 0; k < 7; k++) { const a = A.rr(0, TAU), q = r * A.rr(0.3, 0.85); A.dot(x + Math.cos(a) * q, y + Math.sin(a) * q, 'chalk', A.pick([A.mix(c, 'hingul', 0.3), A.mix(c, 'khadi', 0.25), c]), { w: r * 0.5, p: 0.85, len: r * 0.12 }); }
    A.stroke(A.ellipse(x, y, r * 1.02, r * 0.98, 0, 0.3, 2.6), 'kajal', A.mix(c, 'lac', 0.55), { w: 0.45, p: 0.6 });
  }
  // a swag between two points, sagging by `sag`
  const swag = (a, b, sag, n) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) + sag * 4 * t * (1 - t)]); } return out; };
  // a firework drawn as a chrysanthemum: petals pulled out from the heart with the gold crayon, each tapering as the hand
  // lifts, their tips drooping or curling, every other one doubled by a finer line of colour, a few chalk sparks where
  // they end.  No two come out alike.
  function burst(A, x, y, r, o) {
    o = o || {};
    const rr = A.rr, n = o.n || Math.round(rr(14, 24)), droop = o.droop != null ? o.droop : rr(0.15, 0.5), curl = o.curl != null ? o.curl : rr(-0.6, 0.6);
    const lo = o.from != null ? o.from : 0, span = o.span || TAU, a0 = rr(0, TAU), cols = o.cols || ['haldi', 'khadi'];
    // the rocket's climb: one thin wavering stroke of chalk, stronger as it rises
    if (o.trail) {
      const t0 = o.trail, tr = A.spline([t0, [lerp(t0[0], x, 0.45) + rr(-2.5, 2.5), lerp(t0[1], y, 0.45)], [lerp(t0[0], x, 0.8) + rr(-1, 1), lerp(t0[1], y, 0.8)], [x, y + r * 0.22]], false, 1.2);
      A.stroke(tr.map((p, i) => [p[0], p[1], 0.15 + 0.75 * i / tr.length]), 'chalk', A.mix('haldi', 'saffron', 0.35), { w: 0.55, p: 0.75, tin: 0.4, tout: 0.1 });
    }
    // a faint bloom of light behind it
    A.dot(x, y, 'pastel', A.mix(o.glow || 'haldi', 'neel', 0.6), { w: r * 1.6, p: 0.3, len: r * 0.05, reach: 0.95, hard: 1.1 });
    const ends = [];
    for (let i = 0; i < n; i++) {
      if (A.chance(0.06)) continue;
      const a = span < TAU ? lo + span * (i + rr(0.15, 0.85)) / n : a0 + i * TAU / n + rr(-0.12, 0.12);
      const L = r * rr(0.62, 1.08) * (i % 3 === 0 ? 1 : rr(0.8, 1)), r0 = r * rr(0.08, 0.2), cv = curl * rr(0.5, 1.4), dr = droop * rr(0.65, 1.35);
      const pts = [];
      for (let k = 0; k <= 9; k++) {
        const t = k / 9, ang = a + cv * t * t * 1.3, d = r0 + (L - r0) * t;
        pts.push([x + Math.cos(ang) * d + rr(-0.12, 0.12), y + Math.sin(ang) * d + dr * r * t * t * t, 1 - 0.5 * t]);
      }
      A.stroke(pts, 'gold', 'gold', { w: rr(0.8, 1.25), p: rr(0.85, 1), tin: 0.04, tout: 0.6 });
      if (i % 2 === 0 && A.chance(0.75)) A.stroke(pts.slice(1, 8).map(p => [p[0] + rr(-0.3, 0.3), p[1] + rr(-0.3, 0.3), p[2]]), 'chalk', A.pick(cols), { w: rr(0.45, 0.6), p: 0.8, tin: 0.2, tout: 0.5 });
      ends.push(pts[9]);
    }
    for (const e of ends) if (A.chance(o.dots != null ? o.dots : 0.4)) A.dot(e[0] + rr(-0.6, 0.6), e[1] + rr(0.4, 1.4), 'chalk', A.pick(['khadi', 'haldi', 'cream']), { w: rr(0.55, 0.95), p: rr(0.7, 0.95) });
    // the heart
    A.dot(x, y, 'chalk', 'khadi', { w: rr(1.3, 1.9), p: 1 }); A.dot(x + rr(-0.3, 0.3), y, 'gold', 'gold', { w: rr(0.9, 1.3), p: 1 });
  }
  // a lamp on a low brass stand at the far edge of the fair, lit, its light soft round it
  function lampStand(A, x, by, h) {
    const brass = A.mix('ochre', 'umber', 0.3), ink = A.mix('kajal', 'neel', 0.25), fy = by - h * 0.92;
    A.dot(x, fy - h * 0.12, 'pastel', A.mix('saffron', 'neel', 0.35), { w: h * 1.9, p: 0.42, len: 0.2, reach: 0.95, hard: 1.1 });
    A.dot(x, fy - h * 0.1, 'pastel', A.mix('haldi', 'saffron', 0.4), { w: h * 0.9, p: 0.4, len: 0.2, reach: 0.95, hard: 1.1 });
    const foot = [[x - h * 0.24, by], [x + h * 0.24, by], [x + h * 0.08, by - h * 0.12], [x - h * 0.08, by - h * 0.12]];
    A.fill(foot, 'chalk', brass, { w: 0.9, p: 1, reach: 1.5, passes: 2, ang: 0 });
    A.stroke([[x, by - h * 0.1], [x + A.rr(-0.15, 0.15), by - h * 0.5], [x, by - h * 0.84]], 'chalk', brass, { w: Math.max(0.7, h * 0.09), p: 1, tin: 0, tout: 0 });
    A.dot(x, by - h * 0.46, 'gold', 'gold', { w: Math.max(0.8, h * 0.14), p: 1 });
    A.stroke(A.ellipse(x, fy + h * 0.02, h * 0.2, h * 0.07, 0, 0.1, PI - 0.1), 'chalk', brass, { w: Math.max(0.7, h * 0.09), p: 1 });
    A.stroke([[x - h * 0.2, fy], [x + h * 0.2, fy]], 'gold', 'gold', { w: 0.5, p: 0.9 });
    A.outline([[x - h * 0.24, by], [x - h * 0.08, by - h * 0.12], [x + h * 0.08, by - h * 0.12], [x + h * 0.24, by]], 'kajal', ink, { w: 0.4, p: 0.6 });
    flame(A, x, fy - h * 0.02, h * 0.42);
  }
  // a paper lantern hung on a string: a six-sided shade of coloured paper, lit inside, a cap and a tail of threads
  function lantern(A, x, y, h, c) {
    const w = h * 0.42, ink = A.mix('kajal', 'neel', 0.2);
    const body = [[x - w * 0.5, y + h * 0.14], [x + w * 0.5, y + h * 0.14], [x + w, y + h * 0.5], [x + w * 0.5, y + h * 0.86], [x - w * 0.5, y + h * 0.86], [x - w, y + h * 0.5]];
    A.dot(x, y + h * 0.5, 'pastel', A.mix(c, 'neel', 0.45), { w: h * 2.1, p: 0.38, len: 0.2, reach: 0.95, hard: 1.1 });
    A.fill(body, 'chalk', c, { w: 1.1, p: 1, reach: 1.5, passes: 2, ang: 1.5 });
    A.dot(x, y + h * 0.5, 'chalk', A.mix('haldi', 'khadi', 0.35), { w: h * 0.36, p: 0.9, len: h * 0.12, ang: 1.57 });
    A.stroke([[x, y + h * 0.16], [x, y + h * 0.84]], 'kajal', A.mix(c, 'lac', 0.5), { w: 0.35, p: 0.6 });
    A.outline(body, 'kajal', ink, { closed: true, w: 0.42, p: 0.65 });
    A.stroke([[x - w * 0.42, y + h * 0.1], [x + w * 0.42, y + h * 0.1]], 'gold', 'gold', { w: 0.8, p: 1 });
    A.stroke([[x - w * 0.42, y + h * 0.9], [x + w * 0.42, y + h * 0.9]], 'gold', 'gold', { w: 0.8, p: 1 });
    for (let k = -1; k <= 1; k++) A.stroke([[x + k * w * 0.3, y + h * 0.92], [x + k * w * 0.4 + A.rr(-0.2, 0.2), y + h * 1.32]], 'chalk', k ? c : 'haldi', { w: 0.5, p: 0.9, tout: 0.4 });
  }

  /* The festival elephant in full stride, held close to the owner's own Udaipur painting: a great slate-black barrel
     sown with chalk specks, the head domed high above the back under a gold net, a small almond eye set high, the ear a
     fan hanging behind it.  It stamps in the dance: the near foreleg lifted high and bent at a round knee, the trunk
     swung up in front of the brow with its tip curled forward, the tail flung out; the near hind pushes off behind, the
     far hind and the far foreleg take the weight.  The jhool swings back, and its tassels and every bell on the
     harness fly out on their cords.  Body units: x forward, y down, ground at y = 0. */
  function elephant(A, x, y, s) {
    const P = frame(x, y, s), rr = A.rr, U = v => v * s, B = q => P(q[0], q[1]);
    // pigments: kajal and deep slate laid with the stick; a cooler grey for the far side; dry grey chalk where light sits
    const G = A.mix(A.mix('kajal', 'storm', 0.36), 'slate', 0.06);
    const GD = A.mix(G, 'kajal', 0.6);
    const GF = A.mix(G, A.mix('storm', 'slate', 0.5), 0.3);
    const GL = A.mix(A.mix('slate', 'ice', 0.3), 'storm', 0.12);
    const GM = A.mix(G, 'slate', 0.45);
    // the far legs stand in the elephant's own shadow: a shade darker than the near ones and a little cooler, toward neel
    const GFL = A.mix(A.mix(G, 'kajal', 0.3), 'neel', 0.16);
    const PINK = A.mix('pinkrock', 'gulabi', 0.25);
    const RED = A.mix('hingul', 'lac', 0.15);
    const NAIL = A.mix('khadi', 'cream', 0.3);
    const sp = (pts, closed) => A.spline(P.all(pts), closed, 1.2);
    const hand = poly => A.roughen(poly, 0.28, 10, true);
    const lay = (poly, c, ang, w) => A.fill(poly, 'pastel', c, { w: w || 3.2, p: 1, reach: 1.5, passes: 2, ang, turn: 0.45, cv: 0.014 });
    const st = (pts, tool, c, o) => A.stroke(sp(pts, false), tool, c, o);

    // Catmull-Rom through points of any length ([x, y, half width]), n steps a span
    const cr = (pts, n) => {
      const out = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        for (let k = 0; k < n; k++) {
          const t = k / n, t2 = t * t, t3 = t2 * t;
          out.push(p1.map((_, j) => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3)));
        }
      }
      out.push(pts[pts.length - 1].slice());
      return out;
    };
    // the rim of a foot: how far down the cap reaches at u across it
    const rimV = u => Math.pow(Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(u), 2 / 0.62))), 0.42);
    // a leg: a column round a centre line of [x, y, half width], closed by a round foot whose sole is pressed flat on the ground
    const limb = (cl, o) => {
      o = o || {};
      const c = cr(cl, 8), n = c.length, Lp = [], Rp = [], nr = [];
      for (let i = 0; i < n; i++) {
        const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
        let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        nr.push([nx, ny]);
        Lp.push([c[i][0] + nx * c[i][2], c[i][1] + ny * c[i][2]]); Rp.push([c[i][0] - nx * c[i][2], c[i][1] - ny * c[i][2]]);
      }
      const e = c[n - 1], q = c[n - 4];
      let dx = e[0] - q[0], dy = e[1] - q[1]; const dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
      const nx = -dy, ny = dx, hw = e[2], len = hw * (o.cap || 0.78), cap = [];
      for (let k = 1; k < 16; k++) {
        const th = k / 16 * PI, cs = Math.cos(th), sn = Math.sin(th), u = Math.sign(cs) * Math.pow(Math.abs(cs), 0.62), v = Math.pow(sn, 0.42);
        cap.push([e[0] + nx * hw * u + dx * len * v, e[1] + ny * hw * u + dy * len * v]);
      }
      let poly = Lp.concat(cap, Rp.slice().reverse());
      if (o.ground) poly = poly.map(p => [p[0], Math.min(p[1], -0.003)]);
      const out = hand(P.all(poly));
      out.c = c; out.nr = nr; out.d = [dx, dy]; out.n = [nx, ny]; out.hw = hw; out.len = len;
      // a point on the foot: u across (+1 the back, -1 the front), v down past the end of the line (1 = the rim)
      out.foot = (u, v) => { const p = [e[0] + nx * hw * u + dx * len * v, e[1] + ny * hw * u + dy * len * v]; if (o.ground) p[1] = Math.min(p[1], -0.003); return p; };
      // a point across the leg at fraction t down the line, w from +1 (the back edge) to -1 (the front edge)
      out.at = (t, w) => {
        const f = clamp(t, 0, 1) * (n - 1), i = Math.min(n - 2, Math.floor(f)), r = f - i, p = c[i], q2 = c[i + 1];
        const hw2 = lerp(p[2], q2[2], r), nx2 = lerp(nr[i][0], nr[i + 1][0], r), ny2 = lerp(nr[i][1], nr[i + 1][1], r);
        return [lerp(p[0], q2[0], r) + nx2 * hw2 * w, lerp(p[1], q2[1], r) + ny2 * hw2 * w];
      };
      return out;
    };
    // a leg painted: the dark down its back, a dry light down its front, the fine rings of the skin, the knee
    const model = (Lg, o) => {
      const far = !!o.far, n = Lg.c.length, ring = far ? A.mix(GFL, GL, 0.24) : GM;
      A.withMask(Lg, () => {
        const back = [], front = [];
        for (let i = 1; i < n; i += 2) { const t = i / (n - 1); back.push(B(Lg.at(t, 0.74))); front.push(B(Lg.at(t, -0.7))); }
        A.stroke(back, 'side', A.mix(far ? GFL : G, 'kajal', 0.6), { w: U(0.06), p: far ? 0.5 : 0.6 });
        A.stroke(front.slice(1), 'chalk', far ? A.mix(GFL, GL, 0.32) : GL, { w: U(0.018), p: far ? 0.18 : 0.32, tin: 0.3, tout: 0.3 });
        const rings = o.rings || 9;
        for (let k = 0; k < rings; k++) {
          const t = lerp(o.from || 0.22, 0.95, (k + rr(0.15, 0.85)) / rings), s0 = rr(-0.95, -0.15), s1 = Math.min(0.95, s0 + rr(0.75, 1.5));
          const pts = [];
          for (let j = 0; j <= 4; j++) { const f = j / 4; pts.push(B(Lg.at(t + 0.02 * Math.sin(f * PI), lerp(s0, s1, f)))); }
          A.stroke(pts, 'chalk', ring, { w: rr(0.38, 0.55), p: rr(0.32, 0.55), tin: 0.25, tout: 0.3 });
        }
        if (o.knee != null) for (let k = 0; k < 3; k++) {
          const t = o.knee + k * 0.03, pts = [];
          for (let j = 0; j <= 4; j++) { const f = j / 4; pts.push(B(Lg.at(t + 0.022 * Math.sin(f * PI), lerp(0.9, -0.9, f)))); }
          A.stroke(pts, 'chalk', A.mix(ring, GL, 0.25), { w: 0.5, p: 0.5 - k * 0.08, tin: 0.2, tout: 0.25 });
        }
      });
    };
    // toenails: pale half-moons on the rim of the foot, their outer half hidden by the foot's line
    const nails = (Lg, us, dim) => {
      A.withMask(Lg, () => {
        for (const u of us) {
          const q = B(Lg.foot(u, rimV(u))), r = U(0.027) * rr(0.9, 1.1); q[1] -= r * 0.3;
          const nl = A.roughen(A.ellipse(q[0], q[1], r, r * 1.12), 0.08, 3, true);
          A.fill(nl, 'chalk', dim ? A.mix(NAIL, 'storm', 0.42) : NAIL, { w: 0.9, p: 1, reach: 1.5, passes: 2, ang: 0.3 });
          A.outline(nl, 'kajal', 'kajal', { closed: true, w: 0.45, p: 0.7 });
        }
      }, 0);
    };
    // an anklet: a band of red edged in gold round the leg, a row of small gold bells under it
    const anklet = (Lg, t, far) => {
      const band = (t0, bow, wd) => { const out = []; for (let k = 0; k <= 8; k++) { const f = k / 8; out.push(B(Lg.at(t0 + bow * Math.sin(f * PI), lerp(wd, -wd, f)))); } return out; };
      A.stroke(band(t, 0.035, 1.03), 'chalk', far ? A.mix(RED, 'kajal', 0.42) : RED, { w: U(0.03), p: 1, reach: 1.5, tin: 0, tout: 0 });
      A.stroke(band(t - 0.03, 0.035, 1.0), 'gold', 'gold', { w: 0.7, p: far ? 0.5 : 1, tin: 0, tout: 0 });
      for (let k = 0; k <= 5; k++) {
        const f = k / 5, q = B(Lg.at(t + 0.055 + 0.035 * Math.sin(f * PI), lerp(0.82, -0.82, f)));
        A.dot(q[0], q[1], 'gold', 'gold', { w: U(0.019), p: far ? 0.55 : 1 });
        if (!far) A.dot(q[0], q[1] + U(0.008), 'kajal', 'umber', { w: 0.5, p: 0.8 });
      }
    };
    // the chalk specks sown over the black skin: tiny, uneven, some brighter than others
    const specks = (poly, gap, k, dim) => {
      for (const p of A.scatter([poly], gap, { jit: 0.5 })) {
        if (!A.chance(k)) continue;
        const c = dim ? A.mix('khadi', 'slate', 0.45) : A.pick(['khadi', 'khadi', 'khadi', A.mix('khadi', 'ice', 0.5), A.mix('khadi', 'slate', 0.35)]);
        A.dot(p[0], p[1], 'chalk', c, { w: A.chance(0.12) ? rr(0.55, 0.75) : rr(0.25, 0.48), p: rr(0.45, 0.9), len: rr(0, 0.4), ang: rr(0, PI) });
      }
    };
    // a line drawn inside a closed outline at a steady distance from it
    const inset = (poly, d) => {
      const n = poly.length, nrm = i => { const a = poly[(i - 3 + n) % n], b = poly[(i + 3) % n]; const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; };
      let vote = 0;
      for (let i = 0; i < n; i += Math.max(1, n / 24 | 0)) { const m = nrm(i); vote += A.inside([poly], poly[i][0] + m[0] * 1.2, poly[i][1] + m[1] * 1.2) ? 1 : -1; }
      const sg = vote >= 0 ? 1 : -1;
      return poly.map((p, i) => { const m = nrm(i); return [p[0] + sg * m[0] * d, p[1] + sg * m[1] * d]; });
    };
    const loop = poly => poly.concat([poly[0]]);
    /* the Mewar contour, thick and thin: one fine kajal line pulled round the shape in a few pulls, and inside it a
       second and a third pass laid only where the form turns away from the light (under the belly, down the back of a
       leg, under the jaw), so the line swells there and thins to a hair over the lit tops.  The swell wanders a little
       on its own, as a hand's pressure does. */
    const ink = (poly, o) => {
      o = o || {};
      const pts = A.resample(poly, 0.8, true), n = pts.length;
      if (n < 8) return;
      const nrm = i => { const a = pts[(i - 2 + n) % n], b = pts[(i + 2) % n]; const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; };
      let vote = 0;
      for (let i = 0; i < n; i += Math.max(1, n / 30 | 0)) { const m = nrm(i); vote += A.inside([poly], pts[i][0] + m[0] * 1.2, pts[i][1] + m[1] * 1.2) ? 1 : -1; }
      const sg = vote >= 0 ? 1 : -1;
      const ph1 = rr(0, TAU), ph2 = rr(0, TAU), f1 = rr(0.018, 0.03), f2 = rr(0.07, 0.11);
      const lx = 0.3, ly = -0.95;
      const wt = pts.map((p, i) => {
        const m = nrm(i), ox = -m[0] * sg, oy = -m[1] * sg;
        const away = -(ox * lx + oy * ly);
        return clamp(0.48 + 0.6 * away + 0.2 * Math.sin(i * f1 * TAU + ph1) + 0.1 * Math.sin(i * f2 * TAU + ph2) + (o.bias || 0), 0, 1);
      });
      const c = o.c || 'kajal', k = o.k || 1;
      A.outline(pts, 'kajal', c, { closed: true, w: o.w0 || 0.55, p: 0.92, pull: o.pull || 60 });
      let i0 = 0; for (let i = 1; i < n; i++) if (wt[i] < wt[i0]) i0 = i;
      for (const [lev, off] of [[0.36, 0.42], [0.6, 0.85], [0.82, 1.25]]) {
        let run = [];
        const flush = () => { if (run.length > 6) A.stroke(run, 'kajal', c, { w: 0.75 * k, p: 0.9, tin: 0.3, tout: 0.3 }); run = []; };
        for (let j = 0; j <= n; j++) {
          const i = (i0 + j) % n;
          if (wt[i] > lev) { const m = nrm(i), d = off * 0.75 * k; run.push([pts[i][0] + m[0] * sg * d, pts[i][1] + m[1] * sg * d]); }
          else flush();
        }
        flush();
      }
    };

    // ---- the shapes, in body units
    // the barrel of the body and the great head in one line: the rump, the long back, the neck rising behind the ear,
    // the crown domed high above the back, the brow falling to the root of the trunk, the jaw, the chest, the belly
    const bodyCp = [[-0.74, -0.52], [-0.785, -0.62], [-0.805, -0.72], [-0.795, -0.82], [-0.755, -0.91], [-0.69, -0.98], [-0.6, -1.035], [-0.48, -1.07],
      [-0.32, -1.09], [-0.14, -1.1], [0.04, -1.105], [0.15, -1.115], [0.22, -1.15], [0.29, -1.195], [0.37, -1.226], [0.44, -1.238], [0.5, -1.231],
      [0.555, -1.24], [0.625, -1.236], [0.69, -1.206], [0.75, -1.15], [0.795, -1.07], [0.82, -0.98], [0.83, -0.9], [0.825, -0.84],
      [0.78, -0.8], [0.71, -0.795], [0.65, -0.77], [0.615, -0.72], [0.612, -0.64], [0.632, -0.55], [0.66, -0.47],
      [0.62, -0.425], [0.5, -0.4], [0.38, -0.37], [0.24, -0.33], [0.1, -0.3], [-0.05, -0.29], [-0.24, -0.3], [-0.4, -0.335], [-0.54, -0.39], [-0.66, -0.455]];
    const BODY = hand(sp(bodyCp, true));
    // the four legs in the stride: near hind pushing off behind, far hind set down under the belly, far fore swung back
    // with the sole turned up, near fore reaching forward.  Columns that taper to the ankle, then round feet
    const NH = limb([[-0.47, -0.74, 0.23], [-0.53, -0.53, 0.198], [-0.6, -0.37, 0.155], [-0.67, -0.245, 0.115], [-0.73, -0.158, 0.104], [-0.772, -0.1, 0.13]], { ground: true, cap: 0.84 });
    const FH = limb([[-0.1, -0.62, 0.19], [-0.1, -0.45, 0.166], [-0.096, -0.31, 0.138], [-0.091, -0.19, 0.106], [-0.088, -0.115, 0.1], [-0.086, -0.062, 0.128]], { ground: true, cap: 0.84 });
    // the far foreleg takes the weight while the near one is up: a column set straight down under the chest
    const FF = limb([[0.38, -0.66, 0.152], [0.372, -0.5, 0.136], [0.362, -0.365, 0.113], [0.352, -0.255, 0.097], [0.346, -0.172, 0.093], [0.342, -0.105, 0.124]], { ground: true, cap: 0.84 });
    // the near foreleg lifted high in the stamp of the dance: the forearm swung forward out of the chest to a round
    // knee, the foot hanging back from it, its toes to the front.  Two pieces, so the knee stays round and clean
    const NFa = limb([[0.5, -0.76, 0.2], [0.575, -0.675, 0.178], [0.65, -0.605, 0.156], [0.72, -0.565, 0.138], [0.775, -0.545, 0.124]], { cap: 0.92 });
    const NFb = limb([[0.798, -0.56, 0.114], [0.79, -0.49, 0.108], [0.772, -0.425, 0.103], [0.75, -0.37, 0.099], [0.728, -0.332, 0.128]], { cap: 0.84 });
    // the trunk swung up: down past the tusk from the face, forward, then raised high in front of the brow, its tip
    // curled forward
    const tcl = sp([[0.74, -0.93], [0.775, -0.86], [0.815, -0.81], [0.865, -0.785], [0.915, -0.795], [0.955, -0.84], [0.982, -0.91], [0.995, -0.99],
      [0.996, -1.07], [1.0, -1.135], [1.018, -1.18], [1.045, -1.198], [1.07, -1.185], [1.078, -1.155], [1.064, -1.132], [1.042, -1.13]], false);
    const tw = t => U(t < 0.2 ? lerp(0.095, 0.074, t / 0.2) : t < 0.62 ? lerp(0.074, 0.056, (t - 0.2) / 0.42) : lerp(0.056, 0.032, (t - 0.62) / 0.38));
    const TR = (() => {
      const r = ribbon(tcl, tw), n = tcl.length, e = tcl[n - 1], a = tcl[n - 3], ang = Math.atan2(e[1] - a[1], e[0] - a[0]), w = tw(1), cap = [];
      for (let k = 1; k < 8; k++) { const th = ang + PI / 2 - k * PI / 8; cap.push([e[0] + Math.cos(th) * w, e[1] + Math.sin(th) * w]); }
      const poly = r.L.concat(cap, r.R.slice().reverse()); poly.L = r.L; poly.R = r.R; return poly;
    })();

    // ---- where the feet press the grass, a little shadow
    // (the lifted forefoot throws only a faint shadow, well below it)
    for (const [cx, w, pk] of [[-0.8, 0.14, 0.5], [-0.09, 0.15, 0.5], [0.345, 0.13, 0.46], [0.73, 0.09, 0.17]]) { const q = P(cx, 0); A.dot(q[0], q[1] + 0.3, 'pastel', A.mix('bottle', 'kajal', 0.4), { w: U(0.04), len: U(w), ang: 0, p: pk, reach: 1.0, hard: 1.2 }); }

    // ---- the far legs, a darker, cooler grey in the elephant's own shadow; tapering columns like the near pair, each
    // with its white toenails and its anklet, so the stride reads leg by leg
    for (const [L, kn] of [[FH, 0.42], [FF, 0.48]]) {
      lay(L, GFL, 1.45, 2.8);
      model(L, { far: true, rings: 7, knee: kn });
      specks(L, 3.4, 0.16, true);
    }
    nails(FH, [-0.78, -0.2, 0.38], true); nails(FF, [-0.8, -0.24, 0.32], true);
    for (const L of [FH, FF]) ink(L, { k: 0.8, w0: 0.52 });
    anklet(FH, 0.76, true); anklet(FF, 0.78, true);

    // ---- the tail flung out behind from the rump with the stamp, a black tuft streaming from it, a gold ring
    {
      const tl = sp([[-0.785, -0.75], [-0.845, -0.728], [-0.905, -0.69], [-0.955, -0.638], [-0.99, -0.58]], false);
      const tail = ribbon(tl, t => U(lerp(0.04, 0.014, Math.sqrt(t))));
      lay(tail, G, 1.2, 1.4);
      A.withMask(tail, () => A.stroke(tail.L.slice(2, -2), 'chalk', GL, { w: 0.6, p: 0.3, tin: 0.3, tout: 0.3 }));
      A.outline(tail, 'kajal', 'kajal', { closed: true, w: 0.6, p: 0.85 });
      const te = tl[tl.length - 1], tb = tl[tl.length - 4], ta = Math.atan2(te[1] - tb[1], te[0] - tb[0]);
      const tuft = []; for (let k = 0; k <= 12; k++) { const f = k / 12, a = ta + lerp(-0.42, 0.42, f), L1 = U(0.09 + 0.05 * Math.sin(f * PI)); tuft.push([te[0] + Math.cos(a) * L1, te[1] + Math.sin(a) * L1]); }
      A.fill([te].concat(tuft), 'pastel', 'kajal', { w: 1.2, p: 1, reach: 1.5, passes: 2, ang: ta });
      for (let i = 0; i < 30; i++) {
        const a = ta + rr(-0.45, 0.45), L1 = U(rr(0.08, 0.16)), b = a + rr(-0.22, 0.22);
        A.stroke([[te[0] + rr(-0.4, 0.4), te[1] + rr(-0.4, 0.4)], [te[0] + Math.cos(a) * L1 * 0.5, te[1] + Math.sin(a) * L1 * 0.5], [te[0] + Math.cos(b) * L1, te[1] + Math.sin(b) * L1]], 'kajal', 'kajal', { w: rr(0.6, 1.0), p: 0.9, tin: 0.05, tout: 0.6 });
      }
      const gi = Math.floor(tail.L.length * 0.8), ga = tail.L[gi], gb = tail.R[gi];
      A.stroke([[ga[0], ga[1]], [gb[0], gb[1]]], 'gold', 'gold', { w: 1.5, p: 1 });
    }

    // ---- the near body, head, legs and trunk, laid in one slate black
    lay(BODY, G, -0.5, 3.6); lay(NH, G, 1.5, 3); lay(NFa, G, 0.6, 3); lay(NFb, G, 1.3, 3);
    A.withMask(BODY, () => {
      // the dark under the belly, behind the jaw and down the rump
      st([[-0.64, -0.45], [-0.42, -0.36], [-0.18, -0.315], [0.1, -0.318], [0.3, -0.36], [0.5, -0.425]], 'side', GD, { w: U(0.075), p: 0.55 });
      st([[0.64, -0.79], [0.625, -0.7], [0.645, -0.58]], 'side', GD, { w: U(0.05), p: 0.5 });
      st([[-0.785, -0.9], [-0.8, -0.76], [-0.77, -0.6]], 'side', GD, { w: U(0.06), p: 0.45 });
      // the reflected light along the round of the belly, a breath of grey
      st([[-0.5, -0.38], [-0.2, -0.335], [0.1, -0.335], [0.3, -0.378]], 'chalk', A.mix(GM, GL, 0.25), { w: U(0.016), p: 0.22, tin: 0.4, tout: 0.4 });
      // dry light: over the dome of the head and down the brow, on the back of the neck, on the rump
      const crown = [[0.3, -1.17], [0.38, -1.205], [0.47, -1.214], [0.56, -1.218], [0.65, -1.2], [0.72, -1.15]], fore = [[0.745, -1.1], [0.785, -1.02], [0.805, -0.94]];
      st(crown.map(p => [p[0], p[1] + 0.045]), 'side', GL, { w: U(0.09), p: 0.15 });
      st(crown, 'chalk', GL, { w: U(0.03), p: 0.5, tin: 0.3, tout: 0.4 });
      st(fore, 'chalk', GL, { w: U(0.03), p: 0.55, tin: 0.25, tout: 0.5 });
      for (let k = 0; k < 4; k++) st([[0.7 + k * 0.016, -1.07 + k * 0.03], [0.745 + k * 0.012, -1.04 + k * 0.03], [0.785 + k * 0.006, -0.99 + k * 0.03]], 'chalk', GL, { w: U(0.01), p: 0.34 - k * 0.05, tin: 0.35, tout: 0.4 });
      st([[0.16, -1.1], [0.22, -1.135], [0.28, -1.165]], 'chalk', GL, { w: U(0.02), p: 0.4, tin: 0.3, tout: 0.4 });
      st([[-0.77, -0.85], [-0.7, -0.95], [-0.6, -1.01]], 'chalk', GL, { w: U(0.022), p: 0.4, tin: 0.3, tout: 0.4 });
      // lines of the skin across the brow and the cheek, finer than a hair
      for (let k = 0; k < 5; k++) { const v = -0.97 + k * 0.035; st([[0.74, v - 0.004], [0.78, v + 0.008], [0.812, v + 0.003]], 'chalk', GM, { w: 0.4, p: 0.42, tin: 0.3, tout: 0.4 }); }
      // folds where the thigh and the elbow meet the belly, slack folds under it
      st([[-0.43, -0.64], [-0.4, -0.52], [-0.425, -0.4]], 'chalk', GM, { w: 0.55, p: 0.55, tin: 0.3, tout: 0.4 });
      st([[0.4, -0.62], [0.43, -0.52], [0.465, -0.43]], 'chalk', GM, { w: 0.5, p: 0.5, tin: 0.3, tout: 0.4 });
      for (const v of [-0.33, -0.355]) st([[-0.2, v], [0.0, v + 0.01], [0.16, v - 0.008]], 'chalk', GM, { w: 0.4, p: 0.36, tin: 0.4, tout: 0.4 });
    });
    model(NH, { rings: 10, knee: 0.4, from: 0.3 });
    model(NFa, { rings: 5, from: 0.5 });
    model(NFb, { rings: 7, from: 0.2 });
    // the folds where the lifted forearm leaves the chest, the crease behind the bent knee, and the round of the knee
    // caught in a dry light
    A.withMask(NFa, () => {
      st([[0.625, -0.66], [0.6, -0.57], [0.605, -0.47]], 'chalk', GM, { w: 0.6, p: 0.6, tin: 0.3, tout: 0.4 });
      st([[0.648, -0.65], [0.628, -0.58], [0.632, -0.5]], 'kajal', GD, { w: 0.55, p: 0.7, tin: 0.3, tout: 0.4 });
      st([[0.738, -0.475], [0.767, -0.46], [0.792, -0.466]], 'kajal', GD, { w: 0.7, p: 0.8, tin: 0.2, tout: 0.3 });
      st([[0.79, -0.645], [0.85, -0.62], [0.885, -0.57]], 'chalk', GL, { w: U(0.02), p: 0.45, tin: 0.3, tout: 0.4 });
    });
    specks(BODY, 2.6, 0.3); specks(NH, 2.6, 0.3); specks(NFa, 2.6, 0.3); specks(NFb, 2.6, 0.3);
    // ---- the gold net over the crown, edged with white dots, a fringe of gold drops over the brow
    {
      const top = [[0.36, -1.232], [0.44, -1.244], [0.5, -1.237], [0.555, -1.246], [0.625, -1.242], [0.69, -1.212], [0.75, -1.156], [0.795, -1.075], [0.81, -1.03]];
      const band = [[0.81, -1.03], [0.778, -1.1], [0.73, -1.158], [0.66, -1.192], [0.56, -1.205], [0.46, -1.2], [0.38, -1.186], [0.35, -1.2]];
      const cap = A.spline(P.all(top.concat(band)), true, 1.2);
      A.withMask(BODY, () => {
        A.fill(cap, 'gold', 'gold', { w: 1.6, p: 1, reach: 1.4, passes: 2, ang: 0.4 });
        A.withMask(cap, () => {
          for (let d = -0.6; d < 0.6; d += 0.024) {
            st([[0.45 + d, -1.28], [0.6 + d, -1.0]], 'kajal', A.mix('umber', 'lac', 0.4), { w: 0.4, p: 0.7 });
            st([[0.6 + d, -1.28], [0.45 + d, -1.0]], 'kajal', A.mix('umber', 'lac', 0.4), { w: 0.4, p: 0.7 });
          }
          for (const q of A.along(sp(band.slice(1, -1), false), U(0.024), 0.1)) A.dot(q.x, q.y - U(0.012), 'chalk', RED, { w: U(0.01), p: 0.9 });
        });
      }, 0);
      const bl = sp(band.slice(0, -1), false);
      A.stroke(bl, 'kajal', A.mix('umber', 'kajal', 0.4), { w: 0.55, p: 0.85 });
      for (const q of A.along(bl, U(0.017), 0.1)) if (q.i > 0 && q.i < q.n - 1) A.dot(q.x, q.y + U(0.008), 'chalk', 'khadi', { w: U(0.009), p: 0.92 });
      // the fringe: a gold drop and a bead of red or green hung from the band over the brow
      for (const q of A.along(sp(band.slice(0, 5), false), U(0.024), 0)) {
        if (q.i === 0 || q.i >= q.n - 1) continue;
        A.stroke([[q.x, q.y + 0.6], [q.x + rr(-0.15, 0.15), q.y + U(0.024)]], 'gold', 'gold', { w: 0.5, p: 1 });
        A.dot(q.x, q.y + U(0.029), 'chalk', q.i % 3 === 1 ? 'malachite' : RED, { w: U(0.011), p: 1 });
      }
    }

    // the outline of the body and near legs: never across a join
    A.pushMaskOutside(NH); A.pushMaskOutside(NFa); A.pushMaskOutside(NFb);
    ink(BODY, { pull: 70 });
    A.popMask(); A.popMask(); A.popMask();
    A.pushMaskOutside(BODY);
    ink(NH);
    A.pushMaskOutside(NFb); ink(NFa); A.popMask();
    A.pushMaskOutside(NFa); ink(NFb); A.popMask();
    A.popMask();
    nails(NH, [-0.8, -0.24, 0.32]); nails(NFb, [-0.82, -0.3, 0.22]);
    anklet(NH, 0.8); anklet(NFb, 0.74);

    // ---- the jhool, laid over the back and hanging almost to the belly, swinging back with the rush: the lower it hangs,
    // the further it trails
    const swing = p => { const d = clamp((p[1] + 1.1) / 0.66, 0, 1); return [p[0] - 0.08 * Math.pow(d, 1.5) + 0.01 * Math.sin(p[0] * 16 + 1) * d, p[1] + 0.012 * Math.sin(p[0] * 12) * d]; };
    const hem0 = [[-0.49, -0.468], [-0.4, -0.452], [-0.3, -0.462], [-0.2, -0.447], [-0.1, -0.458], [0.0, -0.443], [0.1, -0.452], [0.2, -0.44], [0.305, -0.452]];
    const hemO = hem0.map(swing);
    const jOut = [[0.31, -1.128], [0.16, -1.132], [0.0, -1.124], [-0.16, -1.114], [-0.3, -1.102], [-0.42, -1.083], [-0.472, -1.04], [-0.482, -0.92],
      [-0.486, -0.78], [-0.49, -0.62]].concat(hem0, [[0.31, -0.6], [0.316, -0.8], [0.318, -1.0]]).map(swing);
    const JO = hand(sp(jOut, true)), JM = inset(JO, U(0.034)), JI = inset(JO, U(0.07));
    // the border: a green band of white chevrons, a beaded line, a blue band of small white flowers
    form(A, JO, A.mix('malachite', 'bottle', 0.2), { w: 2.4, lw: 0.85, rough: 0, ang: 0.2 });
    A.withMask(JO, () => {
      A.stroke(loop(inset(JO, U(0.006))).slice(0, -1), 'side', A.mix('malachite', 'leaf', 0.3), { w: U(0.012), p: 0.3 });
      for (const q of A.along(loop(inset(JO, U(0.017))), U(0.027), 0.08)) {
        const ca = Math.cos(q.ang), sa = Math.sin(q.ang), z = U(0.0105) * rr(0.88, 1.12);
        A.stroke([[q.x - ca * z * 0.55 - sa * z, q.y - sa * z * 0.55 + ca * z], [q.x + ca * z * 0.5, q.y + sa * z * 0.5], [q.x - ca * z * 0.55 + sa * z, q.y - sa * z * 0.55 - ca * z]], 'chalk', 'khadi', { w: 0.5, p: rr(0.85, 1), tin: 0.08, tout: 0.08 });
      }
    });
    A.fill(JM, 'chalk', A.mix('lapis', 'neel', 0.12), { w: 1.6, p: 1, reach: 1.5, passes: 2, ang: 0.5 });
    for (const q of A.along(loop(JM), U(0.012), 0.1)) A.dot(q.x, q.y, 'chalk', q.i % 2 ? 'haldi' : 'saffron', { w: U(0.008), p: 0.95 });
    A.withMask(JM, () => {
      for (const q of A.along(loop(inset(JO, U(0.053))), U(0.032), 0.1)) {
        if (q.i % 2) { const a0 = rr(0, 1), r = U(0.0085); for (let k = 0; k < 4; k++) { const a = a0 + k * PI / 2; A.dot(q.x + Math.cos(a) * r, q.y + Math.sin(a) * r, 'chalk', 'khadi', { w: U(0.0085), p: 0.95 }); } A.dot(q.x, q.y, 'chalk', 'haldi', { w: U(0.007), p: 1 }); }
        else A.dot(q.x, q.y, 'chalk', 'khadi', { w: U(0.006), p: 0.9 });
      }
    });
    form(A, JI, RED, { w: 2.8, lw: 0.7, rough: 0, ang: 1.3 });
    A.stroke(loop(inset(JI, U(0.009))), 'chalk', 'haldi', { w: 0.55, p: 0.8 });
    const sun = B(swing([-0.08, -0.77]));
    A.withMask(JI, () => {
      // light where the cloth rides over the spine, shadow where it falls away round the barrel
      st([[0.26, -1.06], [0.05, -1.07], [-0.2, -1.06], [-0.38, -1.03]].map(swing), 'chalk', A.mix(RED, 'peach', 0.45), { w: U(0.035), p: 0.34, tin: 0.3, tout: 0.3 });
      st(hem0.slice(1, -1).map(p => swing([p[0], p[1] - 0.09])), 'side', A.mix(RED, 'maroon', 0.6), { w: U(0.06), p: 0.5 });
      // folds falling from the spine to the low points of the hem, swept back with the swing, a lit ridge between each two
      for (const fx of [-0.4, -0.2, 0.1, 0.24]) st([[fx + 0.012, -1.06], [fx - 0.01, -0.8], [fx + 0.004, -0.5]].map(swing), 'shade', 'lac', { w: U(0.034), p: 0.55 });
      for (const fx of [-0.3, 0.0, 0.17]) st([[fx + 0.01, -1.04], [fx - 0.008, -0.8], [fx + 0.004, -0.5]].map(swing), 'chalk', A.mix(RED, 'peach', 0.35), { w: U(0.012), p: 0.34, tin: 0.3, tout: 0.3 });
      // small white flowers sown over the red, gold between
      for (const p of A.scatter([JI], U(0.066), { jit: 0.35, margin: 1.5 })) {
        if (Math.hypot(p[0] - sun[0], p[1] - sun[1]) < U(0.19)) continue;
        if (A.chance(0.75)) { const a0 = rr(0, 1); for (let k = 0; k < 4; k++) { const a = a0 + k * PI / 2; A.dot(p[0] + Math.cos(a) * U(0.011), p[1] + Math.sin(a) * U(0.011), 'chalk', 'khadi', { w: U(0.011), p: 0.95 }); } A.dot(p[0], p[1], 'gold', 'gold', { w: U(0.009), p: 1 }); }
        else A.dot(p[0], p[1], 'gold', 'gold', { w: U(0.012), p: 1 });
      }
      // the sun: rays long and short, a gold disc, a ring of petals within, no face
      const R = U(0.15);
      for (let k = 0; k < 24; k++) {
        const a = k * TAU / 24 + rr(-0.03, 0.03), L = (k % 2 ? R * 0.86 : R) * rr(0.95, 1.04), wd = k % 2 ? 0.07 : 0.1;
        const tri = [[sun[0] + Math.cos(a - wd) * R * 0.55, sun[1] + Math.sin(a - wd) * R * 0.55], [sun[0] + Math.cos(a) * L, sun[1] + Math.sin(a) * L], [sun[0] + Math.cos(a + wd) * R * 0.55, sun[1] + Math.sin(a + wd) * R * 0.55]];
        A.fill(tri, k % 2 ? 'chalk' : 'gold', k % 2 ? 'haldi' : 'gold', { w: 1.2, p: 1, reach: 1.5, passes: 2, ang: a });
      }
      const disc = A.roughen(A.ellipse(sun[0], sun[1], R * 0.58, R * 0.58), 0.2, 4, true);
      A.fill(disc, 'gold', 'gold', { w: 2, p: 1, reach: 1.4, passes: 2 });
      A.outline(disc, 'kajal', 'lac', { closed: true, w: 0.7, p: 0.85 });
      for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + 0.2, q = [sun[0] + Math.cos(a) * R * 0.34, sun[1] + Math.sin(a) * R * 0.34]; A.stroke([[sun[0] + Math.cos(a) * R * 0.12, sun[1] + Math.sin(a) * R * 0.12], q], 'chalk', RED, { w: R * 0.16, p: 1, reach: 1.5, tin: 0.1, tout: 0.4 }); }
      A.dot(sun[0], sun[1], 'chalk', 'lapis', { w: R * 0.16, p: 1 });
      A.dot(sun[0], sun[1], 'chalk', 'khadi', { w: R * 0.05, p: 1 });
      A.outline(A.ellipse(sun[0], sun[1], R * 1.06, R * 1.06), 'gold', 'gold', { closed: true, w: 0.6, p: 0.7 });
    });
    // gold beads along the cloth's outer edge
    for (const q of A.along(loop(JO), U(0.022), 0.1)) if (q.i % 2) A.dot(q.x, q.y, 'gold', 'gold', { w: U(0.009), p: 0.9 });
    // the hem: scallops of red along the border, a gold bell under each on its cord, thrown out backward by the stamp,
    // each at its own angle
    {
      const hem = sp(hemO, false);
      for (const q of A.along(hem, U(0.04), 0)) {
        if (q.i === 0 || q.i === q.n - 1) continue;
        const sa = 0.75 + 0.32 * Math.sin(q.i * 1.7 + 0.4) + rr(-0.08, 0.08), L = U(0.042), ca = Math.cos(sa), sn = Math.sin(sa);
        A.stroke(A.ellipse(q.x, q.y + 0.2, U(0.02), U(0.019), q.ang, 0.15, PI - 0.15), 'chalk', RED, { w: U(0.014), p: 1 });
        const r0 = [q.x, q.y + U(0.016)], e = [r0[0] - sn * L, r0[1] + ca * L];
        A.stroke([r0, [lerp(r0[0], e[0], 0.5) + 0.15, lerp(r0[1], e[1], 0.5) + 0.2], e], 'gold', 'gold', { w: 0.55, p: 0.9 });
        A.dot(e[0], e[1], 'gold', 'gold', { w: U(0.018), p: 1 });
        A.dot(e[0] - sn * U(0.007), e[1] + ca * U(0.007), 'kajal', 'umber', { w: 0.55, p: 0.9 });
      }
      // heavy tassels from the cloth's two lower corners, flung out backward and up, the threads streaming
      for (const tq of [hemO[0], hemO[hemO.length - 1]]) {
        const q = B(tq), e = [q[0] - U(0.06), q[1] + U(0.028)];
        A.stroke([q, [lerp(q[0], e[0], 0.5) + 0.2, lerp(q[1], e[1], 0.5) + U(0.012)], e], 'gold', 'gold', { w: 1.1, p: 1 });
        for (let k = -3; k <= 3; k++) {
          const a = PI * 0.93 + k * 0.075 + rr(-0.03, 0.03), Lt = U(0.07) * rr(0.85, 1.1), m = [e[0] + Math.cos(a) * Lt * 0.5, e[1] + Math.sin(a) * Lt * 0.5 + 0.35];
          A.stroke([[e[0], e[1]], m, [e[0] + Math.cos(a) * Lt, e[1] + Math.sin(a) * Lt + 0.15]], 'chalk', k % 2 ? 'haldi' : RED, { w: 0.85, p: 0.95, tout: 0.35 });
        }
        A.dot(e[0], e[1], 'gold', 'gold', { w: 2.4, p: 1 });
      }
      // the girth rope from the hem under the belly, red bound with gold
      const g0 = swing([-0.02, -0.45]);
      const gr = sp([[g0[0], g0[1] + 0.02], [g0[0] - 0.006, -0.37], [g0[0] - 0.01, -0.292]], false);
      A.stroke(gr, 'chalk', RED, { w: U(0.03), p: 1, reach: 1.5, tin: 0, tout: 0 });
      for (const q of A.along(gr, 2.2, 0)) A.dot(q.x, q.y, 'gold', 'gold', { w: 0.9, p: 1 });
    }

    // ---- the crupper over the rump: a green band of chevrons edged in gold from the cloth to the root of the tail,
    // and under it a swag of gold bells swinging across the haunch
    {
      const cl = sp([[-0.47, -1.04], [-0.57, -1.005], [-0.66, -0.95], [-0.73, -0.87], [-0.775, -0.78]], false);
      const band = ribbon(cl, () => U(0.022));
      form(A, band, A.mix('malachite', 'bottle', 0.2), { w: 1.4, lw: 0.6, rough: 0, ang: 0.6 });
      A.withMask(band, () => {
        for (const q of A.along(cl, U(0.026), 0.1)) {
          const ca = Math.cos(q.ang), sa = Math.sin(q.ang), z = U(0.009) * rr(0.88, 1.12);
          A.stroke([[q.x - ca * z * 0.55 - sa * z, q.y - sa * z * 0.55 + ca * z], [q.x + ca * z * 0.5, q.y + sa * z * 0.5], [q.x - ca * z * 0.55 + sa * z, q.y - sa * z * 0.55 - ca * z]], 'chalk', 'khadi', { w: 0.45, p: rr(0.85, 1), tin: 0.08, tout: 0.08 });
        }
      });
      A.stroke(band.L, 'gold', 'gold', { w: 0.6, p: 0.95 }); A.stroke(band.R, 'gold', 'gold', { w: 0.6, p: 0.95 });
      const a = P(-0.49, -0.66), c = P(-0.775, -0.67), sag = U(0.11);
      const swg = swag(a, c, sag, 40);
      A.stroke(swg, 'chalk', RED, { w: U(0.016), p: 1, tin: 0.05, tout: 0.05 });
      A.stroke(swg.map(p => [p[0], p[1] - U(0.01)]), 'gold', 'gold', { w: 0.55, p: 0.9 });
      // the bells thrown out backward off the swag, the further back the higher they fly
      swg.forEach((p, i) => {
        if (i < 2 || i > 38 || i % 3) return;
        const sa = 0.7 + 0.5 * i / 40 + 0.22 * Math.sin(i * 0.9), L = U(0.034), sn = Math.sin(sa), ca = Math.cos(sa), e = [p[0] - sn * L, p[1] + ca * L];
        A.stroke([[p[0], p[1]], e], 'kajal', 'umber', { w: 0.4, p: 0.8 });
        A.dot(e[0] - sn * U(0.005), e[1] + ca * U(0.005), 'gold', 'gold', { w: U(0.02) * rr(0.9, 1.1), p: 1 });
        A.dot(e[0] - sn * U(0.013), e[1] + ca * U(0.013), 'kajal', 'umber', { w: 0.5, p: 0.85 });
      });
    }

    // ---- the ear: a fan hanging from the crown behind the eye, laid over the front of the cloth; its free edge
    // scalloped, fine lines fanning over it, its face painted
    const earFree = A.resample(sp([[0.39, -1.176], [0.3, -1.182], [0.215, -1.168], [0.178, -1.125], [0.17, -1.04], [0.178, -0.96], [0.206, -0.885], [0.25, -0.83],
      [0.3, -0.792], [0.345, -0.79], [0.39, -0.818], [0.425, -0.86], [0.44, -0.885]], false), 0.5, false);
    const earC = P(0.31, -1.0), lam = U(0.042), amp = U(0.011);
    let acc = 0;
    const scal = earFree.map((p, i) => {
      if (i) acc += Math.hypot(p[0] - earFree[i - 1][0], p[1] - earFree[i - 1][1]);
      const a = earFree[Math.max(0, i - 1)], b = earFree[Math.min(earFree.length - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      if (nx * (p[0] - earC[0]) + ny * (p[1] - earC[1]) < 0) { nx = -nx; ny = -ny; }
      const fade = Math.min(1, acc / (lam * 1.2), (earFree.length - 1 - i) / 6);
      const d = amp * Math.abs(Math.sin(PI * acc / lam)) * fade;
      return [p[0] + nx * d, p[1] + ny * d];
    });
    const earFront = sp([[0.44, -0.885], [0.452, -0.96], [0.452, -1.05], [0.435, -1.125], [0.39, -1.176]], false);
    const EAR = A.roughen(scal.concat(earFront.slice(1, -1)), 0.15, 6, true);
    lay(EAR, A.mix(G, GF, 0.3), 1.2, 2.6);
    A.withMask(EAR, () => {
      st([[0.44, -1.1], [0.452, -1.0], [0.44, -0.91], [0.4, -0.85]], 'side', GD, { w: U(0.06), p: 0.55 });
      // fine lines fanning from the root to the free edge
      for (let k = 0; k < 20; k++) {
        const f = (k + rr(0.2, 0.8)) / 20, q = scal[Math.floor(f * (scal.length - 1))], r0 = P(0.44 + rr(-0.008, 0.008), lerp(-1.13, -0.9, f));
        const a = [lerp(r0[0], q[0], 0.16), lerp(r0[1], q[1], 0.16)], b = [lerp(r0[0], q[0], rr(0.74, 0.88)), lerp(r0[1], q[1], 0.8)];
        A.stroke([a, [lerp(a[0], b[0], 0.5) + rr(-0.4, 0.4), lerp(a[1], b[1], 0.5) + rr(-0.3, 0.3)], b], 'chalk', GM, { w: 0.4, p: rr(0.32, 0.52), tin: 0.3, tout: 0.5 });
      }
      specks(EAR, 2.8, 0.2);
      // the rim folded over along the top, a dry light on it
      st([[0.2, -1.1], [0.25, -1.15], [0.32, -1.165], [0.4, -1.155]], 'chalk', GL, { w: U(0.026), p: 0.5, tin: 0.2, tout: 0.3 });
      st([[0.205, -1.075], [0.26, -1.128], [0.33, -1.142], [0.41, -1.132]], 'chalk', GM, { w: 0.6, p: 0.55, tin: 0.2, tout: 0.4 });
      for (let k = 0; k < 6; k++) { const q = P(rr(0.2, 0.3), rr(-0.92, -0.83)); A.dot(q[0], q[1], 'chalk', A.mix(PINK, G, 0.3), { w: rr(0.6, 1.1), p: rr(0.3, 0.55), len: 0.4 }); }
      // the painting on the ear: a border of white dots inside the scallops, a lotus at its heart, sprays of leaf
      for (const q of A.along(scal.map(p => [lerp(p[0], earC[0], 0.15), lerp(p[1], earC[1], 0.15)]), U(0.02), 0.15)) if (q.i > 1 && q.i < q.n - 2) A.dot(q.x, q.y, 'chalk', 'khadi', { w: U(0.01), p: 0.95 });
      A.stroke(scal.map(p => [lerp(p[0], earC[0], 0.27), lerp(p[1], earC[1], 0.27)]).slice(6, -6), 'chalk', 'haldi', { w: 0.6, p: 0.75 });
      const ec = P(0.3, -1.0), lr = U(0.042);
      for (let k = 0; k < 8; k++) {
        const a = -PI / 2 + k * TAU / 8, tip = [ec[0] + Math.cos(a) * lr, ec[1] + Math.sin(a) * lr];
        const pet = [[ec[0] + Math.cos(a - 0.38) * lr * 0.3, ec[1] + Math.sin(a - 0.38) * lr * 0.3], [ec[0] + Math.cos(a - 0.2) * lr * 0.78, ec[1] + Math.sin(a - 0.2) * lr * 0.78], tip, [ec[0] + Math.cos(a + 0.2) * lr * 0.78, ec[1] + Math.sin(a + 0.2) * lr * 0.78], [ec[0] + Math.cos(a + 0.38) * lr * 0.3, ec[1] + Math.sin(a + 0.38) * lr * 0.3]];
        A.fill(pet, 'chalk', k % 2 ? A.mix(RED, 'gulabi', 0.3) : RED, { w: 0.9, p: 1, reach: 1.5, passes: 2, ang: a });
        A.stroke([pet[1], tip, pet[3]], 'chalk', 'khadi', { w: 0.45, p: 0.8 });
      }
      A.dot(ec[0], ec[1], 'chalk', 'haldi', { w: U(0.03), p: 1 }); A.dot(ec[0], ec[1], 'gold', 'gold', { w: U(0.014), p: 1 });
      for (const [a, c] of [[-2.4, 'malachite'], [0.8, 'sap'], [2.3, 'malachite'], [-0.7, 'sap']]) {
        const q0 = [ec[0] + Math.cos(a) * lr * 1.05, ec[1] + Math.sin(a) * lr * 1.05], q1 = [ec[0] + Math.cos(a) * lr * 1.65, ec[1] + Math.sin(a) * lr * 1.65];
        A.stroke([q0, [lerp(q0[0], q1[0], 0.5) + 0.8, lerp(q0[1], q1[1], 0.5)], q1], 'chalk', c, { w: U(0.014), p: 0.95, tin: 0.2, tout: 0.6 });
        A.dot(q1[0], q1[1], 'chalk', 'haldi', { w: U(0.011), p: 0.95 });
      }
    });
    ink(EAR, { k: 0.9, w0: 0.55, pull: 50 });
    // a gold tassel from the root of the ear, flying out backward, its threads streaming
    {
      const t0 = P(0.432, -0.9), t1 = [t0[0] - U(0.034), t0[1] + U(0.03)];
      A.stroke([t0, [lerp(t0[0], t1[0], 0.5), lerp(t0[1], t1[1], 0.5) + U(0.008)], t1], 'gold', 'gold', { w: 0.8, p: 1 });
      A.dot(t1[0], t1[1], 'gold', 'gold', { w: U(0.02), p: 1 });
      for (let k = -3; k <= 3; k++) {
        const a = PI * 0.84 + k * 0.08, Lt = U(0.06) * rr(0.85, 1.1);
        A.stroke([[t1[0], t1[1]], [t1[0] + Math.cos(a) * Lt * 0.5, t1[1] + Math.sin(a) * Lt * 0.5 + 0.3], [t1[0] + Math.cos(a) * Lt, t1[1] + Math.sin(a) * Lt + 0.1]], 'chalk', k % 2 ? 'haldi' : RED, { w: 0.7, p: 0.95, tout: 0.35 });
      }
    }

    // ---- with the trunk up, the mouth shows under it: a pink lower lip, open
    {
      const mo = sp([[0.655, -0.8], [0.69, -0.818], [0.73, -0.818], [0.765, -0.806], [0.752, -0.782], [0.71, -0.772], [0.672, -0.78]], true);
      A.fill(mo, 'pastel', PINK, { w: 1, p: 1, reach: 1.5, passes: 2, ang: 0 });
      A.withMask(mo, () => st([[0.655, -0.8], [0.7, -0.812], [0.76, -0.805]], 'shade', A.mix(PINK, 'lac', 0.6), { w: U(0.016), p: 0.6 }));
      A.outline(mo, 'kajal', 'kajal', { closed: true, w: 0.5, p: 0.85 });
    }
    // ---- the trunk, swung up: dark along its back, dry light along its front, ringed, a pink ridged line down its
    // underside, pink only at the tip
    lay(TR, G, 0.9, 2.6);
    A.withMask(TR, () => {
      A.stroke(TR.R.slice(2, Math.floor(TR.R.length * 0.7)), 'side', GD, { w: U(0.04), p: 0.55 });
      A.stroke(TR.L.slice(4, Math.floor(TR.L.length * 0.72)).map(p => [p[0] + 0.6, p[1]]), 'chalk', GL, { w: U(0.018), p: 0.42, tin: 0.2, tout: 0.4 });
      for (let i = 6; i < tcl.length - 3; i += 2) {
        const a = TR.R[i], c = tcl[i], t = i / tcl.length;
        A.stroke([[a[0] + rr(-0.2, 0.2), a[1]], [lerp(a[0], c[0], 0.7) + rr(-0.3, 0.3), lerp(a[1], c[1], 0.7) + rr(-0.3, 0.3)]], 'chalk', GM, { w: 0.45, p: 0.4 + 0.2 * t, tin: 0.1, tout: 0.6 });
      }
      // the ridged underside: short pink ticks set close along the inner edge
      const lim = Math.floor(TR.L.length * 0.86);
      for (let i = 8; i < lim; i += 2) {
        const p = TR.L[i], c = tcl[i];
        const a = [lerp(p[0], c[0], 0.1), lerp(p[1], c[1], 0.1)], e = [lerp(p[0], c[0], 0.36), lerp(p[1], c[1], 0.36)];
        A.stroke([a, e], 'chalk', A.mix(PINK, 'umber', 0.25), { w: 0.5, p: rr(0.55, 0.8), tin: 0.1, tout: 0.3 });
      }
      A.stroke(TR.L.slice(8, lim).map((p, i) => { const c = tcl[i + 8]; return [lerp(p[0], c[0], 0.38), lerp(p[1], c[1], 0.38)]; }), 'chalk', A.mix(PINK, G, 0.4), { w: 0.45, p: 0.5 });
      for (let k = 0; k < 9; k++) { const i = rr(0.86, 0.99) * (tcl.length - 1) | 0, c = tcl[i], d = rr(-0.6, 0.6) * tw(i / (tcl.length - 1)); A.dot(c[0] + d * 0.6, c[1] + d, 'chalk', PINK, { w: rr(0.6, 1.1), p: rr(0.35, 0.6), len: 0.3 }); }
    });
    specks(TR, 2.6, 0.26);
    A.pushMaskOutside(BODY);
    ink(TR, { k: 0.95, pull: 55 });
    A.popMask();

    // ---- the painted face: a lotus on the brow, dots and flowers down the trunk, white rosettes on the jaw
    {
      const lc = P(0.775, -0.952), lr = U(0.03);
      for (let k = 0; k < 10; k++) { const a = k * TAU / 10, q = [lc[0] + Math.cos(a) * lr, lc[1] + Math.sin(a) * lr]; A.stroke([[lc[0] + Math.cos(a) * lr * 0.3, lc[1] + Math.sin(a) * lr * 0.3], q], 'chalk', k % 2 ? 'haldi' : RED, { w: U(0.017), p: 1, reach: 1.5, tin: 0.1, tout: 0.35 }); }
      A.dot(lc[0], lc[1], 'gold', 'gold', { w: U(0.018), p: 1 });
      // down the trunk: two lines of white dots near its edges, and flowers between, as far as the paint reaches
      const n = tcl.length, lim = Math.floor(n * 0.55);
      for (let i = 6; i < lim; i += 3) for (const side of [TR.L, TR.R]) { const q = side[i], c = tcl[i]; A.dot(lerp(q[0], c[0], 0.3), lerp(q[1], c[1], 0.3), 'chalk', 'khadi', { w: U(0.009), p: 0.9 }); }
      for (let i = 12, k = 0; i < lim - 2; i += 8, k++) {
        const c = tcl[i];
        if (k % 2) bloom(A, c[0], c[1], U(0.017), 'gulabi', 'haldi'); else bloom(A, c[0], c[1], U(0.016), 'haldi', RED);
      }
      // the jaw: small rosettes of white dots on the black, a curl of white or two
      for (const [u, v, r] of [[0.52, -0.93, 0.011], [0.575, -0.95, 0.01], [0.63, -0.93, 0.011], [0.545, -0.885, 0.009], [0.6, -0.895, 0.01], [0.66, -0.965, 0.009], [0.49, -0.88, 0.009]]) {
        const c = P(u + rr(-0.006, 0.006), v + rr(-0.006, 0.006)), a0 = rr(0, 1), rad = U(r);
        for (let k = 0; k < 4; k++) { const a = a0 + k * PI / 2; A.dot(c[0] + Math.cos(a) * rad, c[1] + Math.sin(a) * rad, 'chalk', 'khadi', { w: U(0.008), p: 0.92 }); }
        A.dot(c[0], c[1], 'chalk', A.chance(0.5) ? 'haldi' : 'khadi', { w: U(0.006), p: 0.95 });
      }
    }

    // ---- the ropes under the cheek: one striped red and white, one blue and white, each ending in a gold ring
    for (const [pts, c1, w] of [[[[0.44, -0.895], [0.52, -0.872], [0.6, -0.86], [0.66, -0.855]], RED, 0.026], [[[0.44, -0.86], [0.51, -0.832], [0.58, -0.818], [0.63, -0.81]], 'lapis', 0.022]]) {
      const rp = sp(pts, false);
      A.stroke(rp, 'chalk', 'khadi', { w: U(w), p: 1, reach: 1.5, tin: 0, tout: 0 });
      A.withMask(ribbon(rp, () => U(w * 0.5)), () => {
        for (const q of A.along(rp, U(0.016), 0.06)) { const ca = Math.cos(q.ang + 1.0), sa = Math.sin(q.ang + 1.0), z = U(w * 0.75); A.stroke([[q.x - ca * z, q.y - sa * z], [q.x + ca * z, q.y + sa * z]], 'chalk', c1, { w: U(w * 0.32), p: 1, tin: 0, tout: 0 }); }
      }, 0);
      A.outline(ribbon(rp, () => U(w * 0.5)), 'kajal', 'kajal', { closed: true, w: 0.4, p: 0.7 });
      const e = rp[rp.length - 1];
      A.stroke(A.ellipse(e[0], e[1], U(w * 0.62), U(w * 0.62)), 'gold', 'gold', { w: 0.8, p: 1 });
    }

    // ---- the tusk with its gold rings and a gold cap, laid across the trunk
    {
      const tk = ribbon(sp([[0.645, -0.872], [0.72, -0.862], [0.8, -0.85], [0.88, -0.846], [0.945, -0.857]], false), t => U(lerp(0.023, 0.009, Math.pow(t, 0.9))));
      A.dot(B([0.65, -0.872])[0], B([0.65, -0.872])[1], 'chalk', A.mix(PINK, 'lac', 0.3), { w: U(0.03), p: 0.9, len: U(0.02), ang: 0 });
      form(A, tk, A.mix('cream', 'khadi', 0.45), { w: 1, lw: 0.6, rough: 0.08, line: 'sepia', off: 0.2 });
      A.withMask(tk, () => A.stroke(tk.R.map(p => [p[0], p[1] - 0.5]), 'shade', A.mix('stone', 'sepia', 0.3), { w: U(0.012), p: 0.4 }));
      for (const t of [0.5, 0.62]) { const i = Math.floor(t * (tk.L.length - 1)), a = tk.L[i], c = tk.R[i]; A.stroke([[a[0] - 0.3, a[1] - 0.4], [c[0] + 0.3, c[1] + 0.4]], 'chalk', RED, { w: 1.3, p: 1 }); A.stroke([[a[0] + 0.9, a[1] - 0.4], [c[0] + 1.2, c[1] + 0.4]], 'gold', 'gold', { w: 0.7, p: 1 }); }
      const i0 = Math.floor(0.84 * (tk.L.length - 1)), capP = tk.L.slice(i0).concat(tk.R.slice(i0).reverse());
      A.fill(capP, 'gold', 'gold', { w: 1, p: 1, reach: 1.5, passes: 2, ang: 0 });
      const tip = tk.L[tk.L.length - 1];
      A.stroke(A.ellipse(tip[0] + U(0.016), tip[1] - U(0.006), U(0.013), U(0.013), 0, PI * 0.9, PI * 2.6), 'gold', 'gold', { w: 0.8, p: 1 });
    }

    // ---- the eye: a small almond set high, the white of it in chalk, a dark iris under the lid, a firm kajal contour,
    // a chalk arc over it, and a loop of white dots round it from the ear, under the eye, up to the brow
    {
      const e = P(0.588, -1.088), er = U(0.04);
      A.dot(e[0], e[1] + 0.3, 'side', GD, { w: U(0.1), p: 0.4, len: U(0.04), ang: -0.08 });
      const N = 18, top = [], bot = [];
      for (let k = 0; k <= N; k++) {
        const t = k / N, xx = lerp(-1, 1, t), sn = Math.sin(t * PI);
        top.push([e[0] + xx * er, e[1] - (Math.pow(sn, 0.85) * 0.42 + 0.04 * xx) * er]);
        bot.push([e[0] + xx * er, e[1] + Math.pow(sn, 0.95) * 0.28 * er]);
      }
      const eyeP = top.concat(bot.slice(1, -1).reverse());
      A.fill(eyeP, 'chalk', A.mix('khadi', 'cream', 0.2), { w: 0.8, p: 1, reach: 1.5, passes: 2, ang: 0 });
      A.withMask(eyeP, () => {
        const ic = [e[0] + er * 0.14, e[1] - er * 0.07], ir = er * 0.31;
        A.fill(A.ellipse(ic[0], ic[1], ir, ir * 1.04), 'kajal', A.mix('sepia', 'kajal', 0.3), { w: 0.7, p: 1, reach: 1.6, passes: 3, ang: 0.3 });
        A.fill(A.ellipse(ic[0] + er * 0.02, ic[1], ir * 0.52, ir * 0.55), 'kajal', 'kajal', { w: 0.6, p: 1, reach: 1.6, passes: 3, ang: 1.2 });
        A.stroke(top.map(p => [p[0], p[1] + 0.45]), 'shade', 'stone', { w: U(0.01), p: 0.4 });
      });
      // the lid line swells in the middle and thins at both corners; the lower lid is a lighter touch
      A.stroke(top.map((p, k) => [p[0], p[1], 0.45 + 0.55 * Math.sin(k / N * PI)]), 'kajal', 'kajal', { w: 1.05, p: 0.95, tin: 0.1, tout: 0.1 });
      A.stroke(top.slice(4, 15).map(p => [p[0], p[1] - 0.35]), 'kajal', 'kajal', { w: 0.6, p: 0.8, tin: 0.3, tout: 0.3 });
      A.stroke(bot, 'kajal', 'kajal', { w: 0.55, p: 0.8, tin: 0.12, tout: 0.12 });
      A.stroke([top[N], [top[N][0] + er * 0.35, top[N][1] - er * 0.06]], 'kajal', 'kajal', { w: 0.55, p: 0.85, tout: 0.6 });
      A.stroke(A.ellipse(e[0] + er * 0.02, e[1] + er * 0.05, er * 1.15, er * 0.72, 0, PI * 1.14, PI * 1.86), 'chalk', 'khadi', { w: 0.7, p: 0.85, tin: 0.25, tout: 0.25 });
      const ring = [];
      for (let k = 0; k <= 32; k++) { const th = lerp(PI * 1.06, PI * -0.12, k / 32); ring.push([e[0] + er * 0.15 + Math.cos(th) * er * 3.1, e[1] - er * 0.2 + Math.sin(th) * er * 2.2]); }
      for (const q of A.along(ring, U(0.0135), 0.12)) A.dot(q.x, q.y, 'chalk', 'khadi', { w: U(0.0085), p: 0.92 });
    }

    // ---- the chest: a band of gold beads from under the ear to the chest, small bells hung from it, a necklace of big
    // gold beads below, and one brass bell swinging on its cord in front
    {
      const cb = sp([[0.3, -0.79], [0.39, -0.75], [0.48, -0.69], [0.56, -0.62], [0.625, -0.55]], false);
      const band = ribbon(cb, () => U(0.017));
      A.fill(band, 'gold', 'gold', { w: 1.1, p: 1, reach: 1.5, passes: 2, ang: 0.7 });
      A.outline(band, 'kajal', A.mix('umber', 'kajal', 0.4), { closed: true, w: 0.45, p: 0.8 });
      for (const q of A.along(cb, U(0.018), 0.1)) A.dot(q.x, q.y, 'chalk', q.i % 2 ? RED : 'malachite', { w: U(0.01), p: 0.95 });
      for (const q of A.along(band.L, U(0.016), 0.1)) A.dot(q.x, q.y - 0.5, 'chalk', 'khadi', { w: U(0.008), p: 0.9 });
      // small bells hung from it, each thrown back on its cord at its own angle
      const rot = (o, a, pts) => pts.map(([dx, dy]) => [o[0] + dx * Math.cos(a) - dy * Math.sin(a), o[1] + dx * Math.sin(a) + dy * Math.cos(a)]);
      for (const q of A.along(cb, U(0.036), 0)) {
        if (q.i === 0 || q.i === q.n - 1) continue;
        const sa = 0.62 + 0.3 * Math.sin(q.i * 2.1) + rr(-0.06, 0.06), r0 = [q.x, q.y + U(0.01)], L = U(0.026), e = [r0[0] - Math.sin(sa) * L, r0[1] + Math.cos(sa) * L];
        A.stroke([r0, e], 'kajal', 'umber', { w: 0.4, p: 0.8 });
        const bell = rot(e, sa, [[-U(0.008), -U(0.001)], [U(0.008), -U(0.001)], [U(0.014), U(0.017)], [-U(0.014), U(0.017)]]);
        form(A, bell, 'gold', { tool: 'gold', w: 0.8, lw: 0.4, rough: 0.1, line: 'umber', off: 0.15 });
      }
      const nk = swag(P(0.3, -0.6), P(0.63, -0.5), U(0.06), 26);
      A.stroke(nk, 'kajal', 'umber', { w: 0.5, p: 0.8 });
      nk.forEach((p, i) => { if (i % 2 === 0 && i > 0 && i < 26) { A.dot(p[0], p[1] + U(0.008), 'gold', 'gold', { w: U(0.022) * rr(0.9, 1.08), p: 1 }); A.dot(p[0] - 0.3, p[1] + U(0.002), 'chalk', 'cream', { w: 0.45, p: 0.7 }); } });
      // the brass bell on its cord, swung out forward by the raised leg, between the chest and the trunk
      const c0 = P(0.625, -0.775), sa = -1.1, bw = U(0.034), cl = U(0.065), top = [c0[0] - Math.sin(sa) * cl, c0[1] + Math.cos(sa) * cl];
      A.stroke([c0, [lerp(c0[0], top[0], 0.5) - 0.2, lerp(c0[1], top[1], 0.5) + 0.5], top], 'kajal', 'umber', { w: 0.6, p: 0.9 });
      const bell = rot(top, sa, [[-bw * 0.35, 0], [bw * 0.35, 0], [bw * 0.55, bw * 0.7], [bw * 0.75, bw * 1.1], [-bw * 0.75, bw * 1.1], [-bw * 0.55, bw * 0.7]]);
      form(A, bell, 'gold', { tool: 'gold', w: 1.2, lw: 0.6, rough: 0.1, line: 'umber' });
      const cl2 = rot(top, sa, [[0, bw * 1.3]])[0];
      A.dot(cl2[0], cl2[1], 'kajal', 'umber', { w: 1.2, p: 1 });
    }
  }

  M.folioArt['dpay'] = function (A, b) {
    const X = u => b.x0 + u, Y = v => b.y0 + v, rr = A.rr, hz = 60;
    // ---- the night sky of the fair, thinning toward the ground
    flat(A, A.rect(b.x0 - 2, b.y0 - 2, b.w + 4, hz + 6), A.mix('neel', 'night', 0.25), { w: 14, top: 0.6, rubBox: A.rect(b.x0 + 9, b.y0 + 8, b.w - 18, hz - 10) });
    A.fill(A.rect(b.x0 - 2, Y(hz - 22), b.w + 4, 24), 'side', A.mix('lapis', 'plum', 0.35), { w: 10, p: 0.3, reach: 0.9, passes: 1, ang: 0.02 });
    A.blend(A.rect(b.x0 + 9, Y(hz - 24), b.w - 18, 20), { r: 5, k: 0.3, ang: 0.02 });
    M.stars(A, A.rect(b.x0, b.y0, b.w, hz - 8), { spacing: 15, milky: false, gold: 0.12 });
    // ---- fireworks drawn by hand, each its own kind: a willow falling, a quick round peony, a spent crackle, a fountain arcing over
    burst(A, X(30), Y(34), 19, { n: 17, droop: 0.95, curl: 0.12, dots: 0.3, trail: [X(44), Y(hz)], cols: ['haldi', 'peach'] });
    burst(A, X(98), Y(37), 12, { n: 23, droop: 0.12, curl: 0.55, dots: 0.85, trail: [X(88), Y(hz - 14)], cols: ['gulabi', 'khadi'], glow: 'gulabi' });
    burst(A, X(128), Y(26), 7.5, { n: 14, droop: 0.25, curl: -0.95, dots: 0.5, cols: ['khadi', 'haldi'] });
    burst(A, X(283), Y(40), 20, { n: 15, droop: 0.7, curl: 0.2, from: -PI * 0.96, span: PI * 0.92, dots: 0.35, trail: [X(266), Y(hz)], cols: ['saffron', 'khadi'] });
    // ---- the ground: malachite laid flat, with the far edge of the fair along it
    const gnd = A.rect(b.x0 - 2, Y(hz - 2), b.w + 4, b.h - hz + 4);
    flat(A, gnd, A.mix('malachite', 'bottle', 0.12), { w: 16, c2: A.mix('malachite', 'sap', 0.2), top: 0.55 });
    rub(A, b.x0, Y(hz), b.x1, b.y1, 5, 0.42, -0.4); rub(A, b.x0, Y(hz), b.x1, b.y1, 1.8, 0.35, -0.4);
    A.fill(A.rect(b.x0 - 2, Y(hz - 2), b.w + 4, 12), 'side', A.mix('malachite', 'neel', 0.4), { w: 8, p: 0.45, reach: 1.0, passes: 1, ang: 0 });
    A.fill(A.rect(b.x0 - 2, Y(b.h - 22), b.w + 4, 24), 'side', A.mix('malachite', 'bottle', 0.4), { w: 9, p: 0.35, reach: 1.0, passes: 1, ang: -0.05 });
    M.cityHand.hl(A, [X(-4), Y(hz - 1)], [X(304), Y(hz - 1)], 'chalk', A.mix('khadi', 'lapis', 0.4), { w: 0.9, p: 0.6 });
    // far trees at both ends, lamps lit on low stands along the edge of the ground, paper lanterns strung between
    const treeC = A.mix('bottle', 'neel', 0.25);
    for (const t of [[-3, 14], [22, 8], [255, 8], [303, 13]]) {
      const e = A.roughen(A.ellipse(X(t[0]), Y(hz - t[1] * 0.9), t[1], t[1] * 0.85), 0.8, 6, true);
      A.fill(e, 'pastel', treeC, { w: 3, p: 1, reach: 1.5, passes: 2, ang: rr(-1, 1) });
      A.withMask(e, () => {
        A.stroke(A.ellipse(X(t[0]) + t[1] * 0.25, Y(hz - t[1] * 0.9) + t[1] * 0.2, t[1] * 0.85, t[1] * 0.7, 0, -0.4, 2.2), 'shade', A.mix('bottle', 'kajal', 0.5), { w: t[1] * 0.5, p: 0.4 });
        for (const p of A.scatter([e], 2.6, { jit: 0.4 })) if (A.chance(0.55)) { const a = rr(-2.6, -0.5); A.stroke([[p[0], p[1]], [p[0] + Math.cos(a) * 1.6, p[1] + Math.sin(a) * 1.6]], 'chalk', A.pick(['sap', 'teal', 'moss', 'leaf']), { w: 1, p: 0.6, tout: 0.6 }); }
        for (let k = 0; k < 3; k++) A.dot(X(t[0]) + rr(-t[1], t[1]) * 0.6, Y(hz - t[1]) + rr(-t[1], t[1]) * 0.5, 'chalk', 'saffron', { w: 1.4, p: 0.9 });
      });
      A.outline(e, 'kajal', A.mix('kajal', 'neel', 0.3), { closed: true, w: 0.5, p: 0.6 });
    }
    for (const lx of [9, 34, 49, 266, 290]) lampStand(A, X(lx), Y(hz + 1.5), 7.5);
    for (const seg of [[[X(-4), Y(hz - 16)], [X(22), Y(hz - 13)]], [[X(22), Y(hz - 13)], [X(56), Y(hz - 15)]], [[X(255), Y(hz - 13)], [X(303), Y(hz - 17)]]]) {
      const sw = swag(seg[0], seg[1], 5, 12);
      A.stroke(sw, 'kajal', A.mix('kajal', 'neel', 0.3), { w: 0.45, p: 0.7 });
      const cs = ['hingul', 'haldi', 'gulabi', 'saffron'];
      sw.forEach((p, i) => { if (i % 4 === 2) lantern(A, p[0], p[1], 6.2, cs[(i / 4 | 0) % cs.length]); else if (i % 2) A.dot(p[0], p[1] + 1, 'chalk', A.pick(['haldi', 'khadi']), { w: 1.1, p: 1 }); });
    }
    // the meadow, sown by hand: tufts of blades, and among them flowers of several kinds, never two alike: open
    // five-petal flowers, daisies, buds not yet open, sprigs of tiny florets, small cups seen from the side.  Uneven,
    // some leaning, some half lost in the grass, smaller toward the far edge
    // (the two ends of the field are planted in rows instead, below)
    // how thickly the rows are planted at (u, v): full at the far ends, thinning toward the elephant and toward the
    // bottom edge; the loose scatter takes over where the rows give out, so the two melt into each other
    const sstep = (a, c, t) => { const f = clamp((t - a) / (c - a), 0, 1); return f * f * (3 - 2 * f); };
    const rowDens = (u, v) => Math.max(0.85 * (1 - sstep(22, 70, u)), sstep(212, 258, u)) * (1 - sstep(112, 152, v)) * sstep(hz + 2, hz + 8, v);
    for (const p of A.scatter([A.rect(b.x0, Y(hz + 5), b.w, 162 - hz - 5)], 12.5, { jit: 0.48 })) {
      if (A.chance(0.12) || A.chance(rowDens(p[0] - b.x0, p[1] - b.y0))) continue;
      const x = p[0], y = p[1], v = y - b.y0, sc = 0.6 + 0.45 * (v - hz) / (162 - hz), h = 4.6 * sc * rr(0.7, 1.3);
      const gc = A.pick([A.mix('bottle', 'malachite', 0.3), 'sap', A.mix('bottle', 'neel', 0.15), A.mix('sap', 'malachite', 0.5)]);
      const blades = () => {
        const nb = 2 + (A.rnd() * 4 | 0), spread = rr(0.3, 0.5);
        for (let k = 0; k < nb; k++) { const a = -PI / 2 + (k - (nb - 1) / 2) * spread + rr(-0.15, 0.15), hh = h * rr(0.7, 1.15); A.stroke([[x, y], [x + Math.cos(a) * hh * 0.5 + rr(-0.3, 0.3), y + Math.sin(a) * hh * 0.6], [x + Math.cos(a) * hh, y + Math.sin(a) * hh]], 'chalk', gc, { w: 0.8 * sc + 0.2, p: 0.95, tin: 0.05, tout: 0.6 }); }
      };
      const kind = A.rnd(), lean = rr(-0.35, 0.35), fx = x + Math.sin(lean) * h * 1.05, fy = y - Math.cos(lean) * h * 1.05;
      const hide = A.chance(0.28);
      if (!hide) blades();
      if (kind < 0.26) bloom(A, fx, fy, (1.0 + rr(0, 0.5)) * sc + 0.3, A.pick(['khadi', 'hingul', 'gulabi', 'khadi']), A.pick(['haldi', 'saffron']));
      else if (kind < 0.42) {
        const r = (1.3 + rr(0, 0.5)) * sc, nn = 7 + (A.rnd() * 4 | 0), a0 = rr(0, TAU), sq = rr(0.6, 0.85);
        for (let k = 0; k < nn; k++) { const a = a0 + k * TAU / nn + rr(-0.12, 0.12); A.stroke([[fx + Math.cos(a) * r * 0.3, fy + Math.sin(a) * r * 0.3 * sq], [fx + Math.cos(a) * r, fy + Math.sin(a) * r * sq]], 'chalk', A.pick(['khadi', 'cream']), { w: 0.5, p: 0.95, tin: 0.1, tout: 0.4 }); }
        A.dot(fx, fy, 'chalk', A.pick(['haldi', 'saffron']), { w: r * 0.55, p: 1 });
      } else if (kind < 0.55) {
        const c = A.pick(['hingul', 'gulabi', 'saffron', 'lac']), r = (0.9 + rr(0, 0.4)) * sc;
        A.stroke([[x, y], [fx, fy]], 'chalk', gc, { w: 0.5, p: 0.9 });
        A.stroke([[fx, fy + r * 0.6], [fx + Math.sin(lean) * r * 1.6, fy - r * 1.4]], 'chalk', c, { w: r * 1.5, p: 1, reach: 1.5, tin: 0.1, tout: 0.7 });
        A.stroke([[fx - r * 0.6, fy + r * 0.3], [fx, fy - r * 0.2], [fx + r * 0.6, fy + r * 0.3]], 'chalk', gc, { w: 0.5, p: 0.9 });
      } else if (kind < 0.67) {
        const c = A.pick(['khadi', 'gulabi', 'haldi', 'lapis']), nn = 3 + (A.rnd() * 3 | 0);
        for (let k = 0; k < nn; k++) { const a = -PI / 2 + lean + rr(-0.8, 0.8), d = h * rr(0.7, 1.15); A.stroke([[x, y], [x + Math.cos(a) * d, y + Math.sin(a) * d]], 'chalk', gc, { w: 0.4, p: 0.85 }); A.dot(x + Math.cos(a) * d, y + Math.sin(a) * d, 'chalk', c, { w: rr(0.7, 1.1) * sc + 0.2, p: 0.95 }); }
      } else if (kind < 0.76) {
        const c = A.pick(['hingul', 'saffron', 'gulabi', 'khadi']), r = (1.2 + rr(0, 0.5)) * sc;
        A.stroke([[x, y], [fx, fy]], 'chalk', gc, { w: 0.5, p: 0.9 });
        for (const a of [-0.55, 0, 0.55]) A.stroke([[fx, fy], [fx + Math.sin(a + lean) * r, fy - Math.cos(a + lean) * r * 1.2]], 'chalk', c, { w: r * 0.75, p: 1, reach: 1.5, tin: 0.2, tout: 0.5 });
      }
      if (hide) blades();
    }
    // ---- both ends of the field planted in rows, the Mewar way, but set out by hand: each row one kind of flowering
    // plant, its line wandering and bowing a little, the plants spaced by eye (here a gap, there two close together),
    // each its own height, some leaning.  The far rows smaller and closer.  Toward the elephant and toward the bottom
    // edge the rows thin and break up into the loose scatter of the middle
    {
      const LEAF = [A.mix('sap', 'malachite', 0.3), A.mix('bottle', 'malachite', 0.25)], STEM = A.mix('bottle', 'sap', 0.4);
      const plant = (x, y, sc, kind, c, lean, hf) => {
        const h = 10 * sc * hf, top = [x + Math.sin(lean) * h, y - h];
        const bend = rr(-0.45, 0.45) * sc, at = t => [lerp(x, top[0], t) + Math.sin(t * PI) * bend, lerp(y, top[1], t)];
        A.stroke([at(0), at(0.5), at(1)], 'chalk', STEM, { w: 0.45 + 0.35 * sc, p: 0.95, tin: 0, tout: 0.2 });
        const pairs = sc > 0.8 ? (A.chance(0.6) ? [0.12, 0.36, 0.58] : [0.16, 0.44]) : (A.chance(0.75) ? [0.16, 0.46] : [0.22]);
        pairs.forEach((t, j) => {
          for (const sd of [-1, 1]) {
            if (A.chance(0.08)) continue;
            const q = at(clamp(t + sd * rr(0, 0.06), 0.05, 0.8)), L = (5.4 - j * 1.2) * sc * rr(0.78, 1.15);
            const a = -PI / 2 + sd * (1.02 - j * 0.12 + rr(-0.18, 0.18)) + lean, tip = [q[0] + Math.cos(a) * L, q[1] + Math.sin(a) * L * 0.85];
            const mid = [lerp(q[0], tip[0], 0.5) + sd * 0.25 * sc, lerp(q[1], tip[1], 0.5) + rr(0.4, 0.8) * sc];
            A.stroke([q, mid, tip], 'chalk', LEAF[sd < 0 ? 0 : 1], { w: (1.25 * sc + 0.3) * rr(0.85, 1.1), p: 1, reach: 1.5, tin: 0.15, tout: 0.75 });
          }
        });
        const fx = top[0], fy = top[1], r = 2.1 * sc * rr(0.85, 1.15), dk = A.mix(c, 'lac', 0.55);
        if (kind === 0) {
          // a poppy cup: a middle petal and two turned out, a dark line between them, a green calyx under
          A.stroke([[fx, fy + r * 0.5], [fx, fy - r * 0.95]], 'chalk', c, { w: r * 1.15, p: 1, reach: 1.5, tin: 0.15, tout: 0.4 });
          for (const sd of [-1, 1]) {
            A.stroke([[fx + sd * r * 0.15, fy + r * 0.45], [fx + sd * r * 0.75, fy - r * 0.12], [fx + sd * r * 0.85, fy - r * 0.78]], 'chalk', c, { w: r * 0.75, p: 1, reach: 1.5, tin: 0.1, tout: 0.5 });
            A.stroke([[fx + sd * r * 0.3, fy + r * 0.3], [fx + sd * r * 0.36, fy - r * 0.6]], 'kajal', dk, { w: 0.4, p: 0.7 });
          }
          A.stroke([[fx - r * 0.55, fy + r * 0.5], [fx, fy + r * 0.75], [fx + r * 0.55, fy + r * 0.5]], 'chalk', LEAF[1], { w: 0.5 * sc + 0.25, p: 0.95 });
        } else if (kind === 1) {
          // a white lily seen from above: six pointed petals, a gold heart
          const a0 = rr(0, 0.5);
          for (let k = 0; k < 6; k++) { const a = a0 + k * TAU / 6; A.stroke([[fx, fy], [fx + Math.cos(a) * r * 0.55, fy + Math.sin(a) * r * 0.48], [fx + Math.cos(a) * r * 1.05, fy + Math.sin(a) * r * 0.88]], 'chalk', c, { w: r * 0.55, p: 1, reach: 1.5, tin: 0.2, tout: 0.75 }); }
          A.dot(fx, fy, 'chalk', 'haldi', { w: r * 0.5, p: 1 });
          A.dot(fx, fy, 'gold', 'gold', { w: r * 0.22, p: 0.9 });
        } else if (kind === 2) {
          marigold(A, fx, fy, r * 0.95, c);
        } else {
          // a lotus bud: a pink flame closed on itself, a paler line up its middle, two sepals curling up round it
          const bud = tear(fx, fy + r * 0.45, r * 1.25, r * 2.1, lean * r);
          A.fill(bud, 'chalk', c, { w: Math.max(0.6, r * 0.4), p: 1, reach: 1.5, passes: 2, ang: 1.5 });
          A.stroke([[fx, fy + r * 0.3], [fx + lean * r * 0.5, fy - r * 1.25]], 'chalk', A.mix(c, 'khadi', 0.45), { w: r * 0.25, p: 0.8, tin: 0.2, tout: 0.4 });
          A.outline(bud, 'kajal', dk, { closed: true, w: 0.4, p: 0.6 });
          for (const sd of [-1, 1]) A.stroke([[fx, fy + r * 0.55], [fx + sd * r * 0.65, fy + r * 0.1], [fx + sd * r * 0.7, fy - r * 0.35]], 'chalk', LEAF[sd < 0 ? 0 : 1], { w: r * 0.4, p: 1, tin: 0.1, tout: 0.6 });
        }
      };
      const COL = [['hingul', A.mix('hingul', 'saffron', 0.3)], ['khadi', 'cream'], ['saffron', 'haldi'], ['gulabi', A.mix('gulabi', 'hingul', 0.25)]];
      // six rows, far to near.  Each row at each end gets its own line: a slow bow over its length, a small wander
      // along it, a slight tilt.  The step is set by eye, now long, now two plants close, now a plant missed.  Whether
      // a plant is set at all goes by rowDens, so the rows give out unevenly toward the elephant and the near edge
      const rows = [[70, 0.6], [82, 0.68], [95, 0.77], [109, 0.87], [124, 0.97], [140, 1.07]];
      for (const [z0, z1, off] of [[2, 80, 0], [208, 299, 2]]) {
        rows.forEach(([v0, sc0], ri) => {
          const kind0 = (ri + off) % 4, step = 7 * sc0 + 1.8, mid = (z0 + z1) / 2;
          const bow = rr(-2.2, 2.2), amp = rr(0.6, 1.3), fq = rr(0.08, 0.16), ph = rr(0, TAU), tilt = rr(-0.03, 0.03);
          const line = u => v0 + bow * Math.sin(PI * clamp((u - z0) / (z1 - z0), 0, 1)) + amp * Math.sin(u * fq + ph) + tilt * (u - mid);
          for (let u = z0 + rr(-1, step * 0.8); u < z1;) {
            const v = line(u) + rr(-0.6, 0.6);
            if (A.chance(rowDens(u, v))) {
              const kind = A.chance(0.07) ? A.pick([0, 1, 2, 3].filter(k => k !== kind0)) : kind0;
              const lean = A.chance(0.2) ? rr(0.2, 0.35) * (A.chance(0.5) ? 1 : -1) : rr(-0.12, 0.12);
              const hf = A.chance(0.15) ? rr(0.6, 0.74) : rr(0.82, 1.18);
              plant(X(u), Y(v), sc0 * (1 + (v - v0) * 0.008) * rr(0.9, 1.1), kind, COL[kind][A.chance(0.5) ? 0 : 1], lean, hf);
            }
            u += A.chance(0.1) ? step * rr(0.35, 0.5) : step * rr(0.7, 1.3) * (A.chance(0.1) ? rr(1.6, 2.1) : 1);
          }
        });
      }
    }
    // the elephant's shadow on the grass
    A.dot(X(138), Y(153.5), 'pastel', A.mix('bottle', 'malachite', 0.35), { w: 13, len: 150, ang: 0, p: 0.55, reach: 1.1, hard: 1.3 });

    // ---- the elephant
    elephant(A, X(140), Y(154), 100);

    // ---- garlands of marigold hung in swags across the top, a tassel where each is tied
    const ties = [-6, 70, 150, 230, 306];
    for (let i = 0; i < ties.length - 1; i++) {
      const sw = swag([X(ties[i]), Y(-3)], [X(ties[i + 1]), Y(-3)], 15, 26);
      sw.forEach((p, k) => { if (k % 4 === 2) A.stroke([[p[0], p[1]], [p[0] + 2.4, p[1] + 1.5]], 'chalk', 'sap', { w: 1.4, p: 0.9, tout: 0.6 }); });
      sw.forEach((p, k) => marigold(A, p[0] + rr(-0.3, 0.3), p[1] + rr(-0.3, 0.3), 2.3, k % 3 === 1 ? 'haldi' : 'saffron'));
    }
    for (const t of ties.slice(1, -1)) {
      for (let k = 0; k < 5; k++) marigold(A, X(t) + rr(-0.3, 0.3), Y(-1 + k * 4.2), 2.1, k % 2 ? 'haldi' : 'saffron');
      const q = [X(t), Y(20)]; A.stroke([[q[0], q[1] - 1], [q[0], q[1] + 2]], 'gold', 'gold', { w: 1, p: 1 });
      for (let k = -2; k <= 2; k++) A.stroke([[q[0], q[1] + 2], [q[0] + k * 0.8, q[1] + 6.5]], 'chalk', k % 2 ? 'hingul' : 'haldi', { w: 0.8, p: 0.95 });
      A.dot(q[0], q[1] + 2, 'gold', 'gold', { w: 2.2, p: 1 });
    }
    // ---- bunting slung under them, tied where they are tied, each length sagging its own way.  Every flag cut and
    // coloured by hand: no two the same size, some turned in the wind and showing narrow, a dot or a band or a flower
    // on some, a gold edge on a few
    {
      const cols = ['hingul', 'haldi', 'khadi', 'gulabi', 'saffron', 'verdigris', 'lapis', 'malachite', 'peori'];
      const tie = [[-6, 4.5], [70, 6.2], [150, 3.8], [230, 5.6], [306, 3.4]], sags = [12, 15.5, 9, 13.5];
      let last = null;
      for (let s = 0; s < tie.length - 1; s++) {
        const str = swag([X(tie[s][0]), Y(tie[s][1])], [X(tie[s + 1][0]), Y(tie[s + 1][1])], sags[s], 60).map((p, i) => [p[0], p[1] + Math.sin(i * 0.31 + s * 2) * 0.3]);
        A.stroke(str, 'kajal', 'umber', { w: 0.6, p: 0.85 });
        const Ls = [0]; for (let i = 1; i < str.length; i++) Ls.push(Ls[i - 1] + Math.hypot(str[i][0] - str[i - 1][0], str[i][1] - str[i - 1][1]));
        const tot = Ls[Ls.length - 1];
        for (let t = rr(3, 6.5); t < tot - 3;) {
          let i = 1; while (i < Ls.length - 1 && Ls[i] < t) i++;
          const f = (t - Ls[i - 1]) / ((Ls[i] - Ls[i - 1]) || 1), q = [lerp(str[i - 1][0], str[i][0], f), lerp(str[i - 1][1], str[i][1], f)];
          const ang = Math.atan2(str[i][1] - str[i - 1][1], str[i][0] - str[i - 1][0]), ca = Math.cos(ang), sa = Math.sin(ang);
          let c; do { c = A.pick(cols); } while (c === last); last = c;
          const wd = rr(2.4, 3.7), ht = rr(6.0, 9.4), turn = A.chance(0.2) ? rr(0.42, 0.7) : 1, lean = rr(-0.18, 0.3);
          const l = [q[0] - ca * wd * turn, q[1] - sa * wd * turn], r = [q[0] + ca * wd * turn, q[1] + sa * wd * turn];
          const tip = [q[0] + Math.sin(lean + ang * 0.5) * ht, q[1] + Math.cos(lean + ang * 0.5) * ht];
          form(A, [l, r, tip], c, { w: 1.2, lw: 0.5, rough: 0.12, lp: 0.7 });
          const on = c === 'khadi' || c === 'haldi' || c === 'peori' ? 'hingul' : 'khadi', mk = A.rnd();
          const mid = [lerp(q[0], tip[0], 0.38), lerp(q[1], tip[1], 0.38)];
          if (mk < 0.32) A.dot(mid[0], mid[1], 'chalk', on, { w: rr(0.85, 1.3), p: 0.9 });
          else if (mk < 0.5) A.stroke([[lerp(l[0], tip[0], 0.22), lerp(l[1], tip[1], 0.22)], [lerp(r[0], tip[0], 0.22), lerp(r[1], tip[1], 0.22)]], 'chalk', on, { w: 0.7, p: 0.9 });
          else if (mk < 0.62 && turn === 1) bloom(A, mid[0], mid[1], 0.95, on, 'haldi');
          else if (mk < 0.74) A.stroke([[l[0], l[1] + 0.45], [r[0], r[1] + 0.45]], 'gold', 'gold', { w: 0.6, p: 0.9 });
          t += wd * 2 * turn + rr(1.4, 4.4);
        }
      }
    }
    // ---- marigold petals thrown into the air, still falling, some already on the grass
    const petal = (x, y, sc, c) => { const a = rr(0, TAU); A.stroke([[x - Math.cos(a) * sc, y - Math.sin(a) * sc], [x + Math.cos(a) * sc, y + Math.sin(a) * sc]], 'chalk', c, { w: sc * 1.25, p: 1, reach: 1.5, tin: 0.3, tout: 0.4 }); };
    const pc = () => A.pick(['saffron', 'saffron', 'haldi', 'peori', 'hingul', A.mix('saffron', 'hingul', 0.4)]);
    // few of them land on the elephant itself, so its grey stays whole
    const onEle = (x, y) => (((x - X(196)) / 36) ** 2 + ((y - Y(58)) / 32) ** 2 < 1) || (((x - X(132)) / 94) ** 2 + ((y - Y(90)) / 56) ** 2 < 1 && A.chance(0.8)) ||
      (((x - X(232)) / 17) ** 2 + ((y - Y(55)) / 22) ** 2 < 1) || (((x - X(215)) / 15) ** 2 + ((y - Y(115)) / 24) ** 2 < 1);
    // gold dust drifting down in a few loose trails, placed by hand, a petal or a chalk fleck among them
    for (const d of [[[44, 12], [58, 30], [72, 52]], [[156, 14], [146, 26], [138, 38]], [[236, 14], [250, 30], [262, 50]]]) {
      const path = A.spline(d.map(q => [X(q[0] + rr(-2, 2)), Y(q[1] + rr(-1.5, 1.5))]), false, 0.6);
      let t = rr(0, 0.06);
      while (t < 1) {
        const p = path[Math.min(path.length - 1, Math.floor(t * path.length))], x = p[0] + rr(-1.8, 1.8), y = p[1] + rr(-1, 1);
        if (!onEle(x, y)) {
          const e = A.rnd();
          if (e < 0.6) A.dot(x, y, 'gold', 'gold', { w: rr(0.7, 1.5) * (1.1 - 0.4 * t), p: rr(0.8, 1) });
          else if (e < 0.82) A.dot(x, y, 'chalk', A.pick(['khadi', 'cream', 'haldi']), { w: rr(0.45, 0.8), p: rr(0.65, 0.9) });
          else petal(x, y, rr(0.9, 1.4), pc());
        }
        t += rr(0.05, 0.13);
      }
    }
    // a few petals still falling over the grass, and on it
    for (let k = 0; k < 30; k++) {
      const x = X(rr(4, 296)), y = Y(rr(hz + 6, 150));
      if (onEle(x, y)) continue;
      petal(x, y, rr(1.0, 1.7), pc());
    }
    for (let k = 0; k < 4; k++) { const x = X(rr(10, 290)), y = Y(rr(hz + 10, 140)); if (!onEle(x, y)) marigold(A, x, y, rr(1.3, 1.8), A.pick(['saffron', 'haldi'])); }
    for (let k = 0; k < 26; k++) petal(X(rr(6, 294)), Y(rr(146, 163)), rr(1, 1.5), A.pick(['saffron', 'haldi', 'hingul']));
    // ---- a hedge of flowering plants along the foot
    // each plant its own kind: a clump of open flowers, a few daisies, a spike of florets climbing a stem, buds, or
    // leaves alone; sizes and heights all different
    for (let u = -2, lastK = -1; u < 304; u += rr(7.5, 14)) {
      const bx = X(u + rr(-1, 1)), by = Y(169 + rr(-1.5, 1)), h = rr(6.5, 13), gcs = ['bottle', A.mix('bottle', 'malachite', 0.5), 'sap', A.mix('sap', 'moss', 0.4)];
      const nb = 4 + (A.rnd() * 4 | 0);
      for (let k = 0; k < nb; k++) { const a = -PI / 2 + rr(-0.95, 0.95), hh = h * rr(0.6, 1.05); A.stroke([[bx, by], [bx + Math.cos(a) * hh * 0.5, by + Math.sin(a) * hh * 0.55], [bx + Math.cos(a) * hh * 0.9, by + Math.sin(a) * hh]], 'chalk', A.pick(gcs), { w: rr(1.2, 1.8), p: 1, reach: 1.5, tin: 0.1, tout: 0.6 }); }
      let kind; do { kind = A.rnd() * 5 | 0; } while (kind === lastK); lastK = kind;
      const fc = A.pick(['hingul', 'khadi', 'haldi', 'gulabi', 'hingul', 'saffron', 'lac']);
      if (kind === 0) { const n = 2 + (A.rnd() * 3 | 0); for (let k = 0; k < n; k++) bloom(A, bx + rr(-4.5, 4.5), by - h * rr(0.55, 1.0), rr(1.3, 2.4), fc, fc === 'haldi' ? 'hingul' : 'haldi'); }
      else if (kind === 1) {
        for (let k = 0; k < 2 + (A.rnd() * 2 | 0); k++) {
          const fx = bx + rr(-4, 4), fy = by - h * rr(0.6, 1.05), r = rr(1.5, 2.3), nn = 8 + (A.rnd() * 4 | 0), a0 = rr(0, TAU), sq = rr(0.65, 0.95);
          for (let j = 0; j < nn; j++) { const a = a0 + j * TAU / nn + rr(-0.1, 0.1); A.stroke([[fx + Math.cos(a) * r * 0.3, fy + Math.sin(a) * r * 0.3 * sq], [fx + Math.cos(a) * r, fy + Math.sin(a) * r * sq]], 'chalk', A.pick(['khadi', 'cream']), { w: 0.6, p: 0.95, tin: 0.1, tout: 0.4 }); }
          A.dot(fx, fy, 'chalk', A.pick(['haldi', 'saffron']), { w: r * 0.6, p: 1 });
        }
      } else if (kind === 2) {
        const lean = rr(-0.25, 0.25), top = [bx + Math.sin(lean) * h * 1.25, by - h * 1.25];
        A.stroke([[bx, by], [lerp(bx, top[0], 0.5) + rr(-0.5, 0.5), lerp(by, top[1], 0.5)], top], 'chalk', 'bottle', { w: 0.7, p: 0.95 });
        for (let j = 0; j < 7; j++) { const t = 0.4 + j * 0.09, q = [lerp(bx, top[0], t) + (j % 2 ? 0.9 : -0.9), lerp(by, top[1], t)]; A.dot(q[0], q[1], 'chalk', j > 4 ? A.mix(fc, 'khadi', 0.3) : fc, { w: rr(1.3, 1.9) * (1.15 - t * 0.5), p: 1 }); }
      } else if (kind === 3) {
        for (let k = 0; k < 3; k++) { const fx = bx + rr(-3.5, 3.5), fy = by - h * rr(0.65, 1.05), r = rr(0.9, 1.4), ln = rr(-0.3, 0.3); A.stroke([[fx, fy + r * 0.6], [fx + Math.sin(ln) * r * 1.6, fy - r * 1.5]], 'chalk', fc, { w: r * 1.5, p: 1, reach: 1.5, tin: 0.1, tout: 0.7 }); A.stroke([[fx - r * 0.6, fy + r * 0.3], [fx, fy - r * 0.2], [fx + r * 0.6, fy + r * 0.3]], 'chalk', 'sap', { w: 0.55, p: 0.9 }); }
      }
    }
  };
})();
