(function () {
  'use strict';
  /* ==========================================================================
     PEACOCKS
       M.peacockDancing(A, x, y, s, o)   x,y = planted foot, s = radius of the fan
       M.peacockPerched(A, x, y, s, o)   x,y = feet on the branch, s = body length
       M.peahen(A, x, y, s, o)           x,y = feet, s = body length
     Bird geometry is written in "bird units" (origin = anchor, x forward, y down,
     1 unit = s) and mapped to the sheet by frame().
     ======================================================================== */

  function frame(x, y, s, flip, tilt) {
    const f = flip ? -1 : 1, c = Math.cos(tilt || 0), sn = Math.sin(tilt || 0);
    const P = (nx, ny) => { const px = nx * f * s, py = ny * s; return [x + px * c - py * sn, y + px * sn + py * c]; };
    P.all = pts => pts.map(p => { const q = P(p[0], p[1]); if (p[2] != null) q.push(p[2]); return q; });
    P.dir = a => { const dx = Math.cos(a) * f, dy = Math.sin(a); return Math.atan2(dx * sn + dy * c, dx * c - dy * sn); };
    P.s = s; P.f = f;
    return P;
  }
  // a tapering band around a centre line (world points); wf(t) = half width
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
  const lerp = (a, b, t) => a + (b - a) * t;
  // piecewise-linear profile: prof(t, [[t0,v0],[t1,v1],...])
  function prof(t, k) { for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0])); return k[k.length - 1][1]; }
  // a small pressed oval of pastel
  function blob(A, c, cx, cy, a, b, rot, o) {
    o = o || {};
    const rp = A.roughen(A.ellipse(cx, cy, a, b, rot), o.rough != null ? o.rough : Math.min(a, b) * 0.09, 8, true);
    A.fill(rp, 'pastel', c, { w: Math.max(1.8, Math.min(a, b) * 1.05), ang: rot + A.rr(-0.5, 0.5), passes: 2, p: 1, reach: 1.5, cv: o.cv });
    return rp;
  }
  // rows of little U-shaped feather marks inside a polygon; dn = the way the round side faces
  function scallops(A, poly, spacing, r, dn, cols, o) {
    o = o || {};
    const pts = A.scatter(poly, spacing, { margin: o.margin != null ? o.margin : r * 0.6, jit: 0.3 });
    for (const p of pts) {
      if (o.skip && A.chance(o.skip)) continue;
      const d = dn + A.rr(-0.25, 0.25), rr2 = r * A.rr(0.8, 1.15);
      A.stroke(A.ellipse(p[0], p[1], rr2, rr2 * 1.1, 0, d - 1.3, d + 1.3), o.tool || 'chalk', A.pick(cols), { w: o.w || Math.max(0.7, r * 0.34), p: A.rr(0.55, 0.9), flow: o.flow });
    }
  }
  function leg(A, P, pts, w, toe, curl, c) {
    const wp = A.spline(P.all(pts), false, 1.5);
    A.stroke(wp, 'chalk', c || 'sand', { w: w, p: 1, reach: 1.4, tin: 0, tout: 0 });
    A.stroke(wp.map(p => [p[0] + w * 0.32, p[1]]), 'pencil', 'sepia', { w: Math.max(0.55, w * 0.4), p: 0.8 });
    // knuckle
    const k = wp[Math.floor(wp.length * 0.5)]; A.dot(k[0], k[1], 'chalk', c || 'sand', { w: w * 1.35 });
    const e = pts[pts.length - 1];
    const toes = curl ? [[toe * 0.5, toe * 0.6], [toe * 0.1, toe * 0.8], [-toe * 0.4, toe * 0.5]]
      : [[toe, toe * 0.04], [toe * 0.72, toe * 0.34], [toe * 0.2, toe * 0.42], [-toe * 0.55, toe * 0.12]];
    for (const t of toes) {
      const tp = P.all([[e[0], e[1]], [e[0] + t[0] * 0.55, e[1] + t[1] * 0.35], [e[0] + t[0], e[1] + t[1]]]);
      A.stroke(tp, 'chalk', c || 'sand', { w: w * 0.72, p: 1, tin: 0, tout: 0.35 });
      A.stroke(tp, 'pencil', 'sepia', { w: Math.max(0.5, w * 0.3), p: 0.7 });
    }
  }
  /* a folded or drooping wing: a ground of red earth, rows of pale scales, dark flight feathers at the tip.
     poly = sheet polygon, a -> b = sheet axis from the shoulder to the tip, hw = half width */
  function wing(A, poly, a, b, hw, o) {
    const rr = A.rr; o = o || {};
    const rp = A.shape(poly, { c: o.c || 'sindoor', w: Math.max(2.4, hw * 0.55), rough: o.rough != null ? o.rough : 0.5, passes: 2 });
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, an = Math.atan2(uy, ux);
    const split = o.split != null ? o.split : 0.58, rs = o.rs || hw * 0.3;
    A.pushMask(rp);
    for (let u = -hw; u <= hw * 1.01; u += hw * 0.3) {
      const p0 = [a[0] + ux * L * split + nx * u, a[1] + uy * L * split + ny * u], p1 = [a[0] + ux * L * 1.08 + nx * u * 0.45, a[1] + uy * L * 1.08 + ny * u * 0.45];
      A.stroke([p0, p1], 'pastel', o.prim || 'umber', { w: hw * 0.42, p: 1, reach: 1.5 });
    }
    for (let u = -hw * 0.85; u <= hw; u += hw * 0.34) {
      const p0 = [a[0] + ux * L * (split + 0.03) + nx * u, a[1] + uy * L * (split + 0.03) + ny * u], p1 = [a[0] + ux * L * 1.05 + nx * u * 0.45, a[1] + uy * L * 1.05 + ny * u * 0.45];
      A.stroke([p0, p1], 'chalk', o.primLine || 'sand', { w: Math.max(0.6, hw * 0.07), p: rr(0.5, 0.8) });
    }
    let row = 0;
    for (let t = 0.04; t < split + 0.05; t += (rs * 1.3) / L, row++) for (let u = -hw - (row % 2 ? rs : 0); u <= hw + rs; u += rs * 2.1) {
      const j1 = rr(-0.18, 0.18) * rs, j2 = rr(-0.15, 0.15) * rs;
      const cx = a[0] + ux * (L * t + j2) + nx * (u + j1), cy = a[1] + uy * (L * t + j2) + ny * (u + j1);
      A.stroke(A.ellipse(cx, cy, rs, rs * 1.12, 0, an - 1.4, an + 1.4), 'chalk', o.scale || 'cream', { w: Math.max(0.7, rs * 0.3), p: rr(0.7, 0.95) });
      A.dot(cx + ux * rs * 0.25, cy + uy * rs * 0.25, 'kajal', o.dotc || 'maroon', { w: Math.max(0.6, rs * 0.34) });
    }
    A.popMask();
    A.outline(rp, 'kajal', o.line || 'sepia', { closed: true, w: o.lw || 0.9, p: 0.8 });
    return rp;
  }
  // head, beak, eye, cheek, crest.  h = head centre (bird units), ba = beak angle (bird sense), hs = head size (bird units)
  function head(A, P, h, ba, hs, o) {
    o = o || {};
    const s = P.s, rr = A.rr, hc = P(h[0], h[1]), wa = P.dir(ba);
    const ca = Math.cos(ba), sa = Math.sin(ba);
    const L = (al, ac) => P(h[0] + ca * al * hs - sa * ac * hs, h[1] + sa * al * hs + ca * ac * hs);   // along beak / across (down)
    // crest first so the skull overlaps the stalk roots
    const nst = o.crest != null ? o.crest : 6, cl = (o.crestLen || 2.6);
    for (let i = 0; i < nst; i++) {
      const a = -1.75 - (i / Math.max(1, nst - 1)) * 1.0 + rr(-0.06, 0.06), len = cl * rr(0.85, 1.12);   // angles relative to beak axis: up and back
      const r0 = L(-0.35, -0.75), ca2 = Math.cos(a), sa2 = Math.sin(a);
      const mid = L(-0.35 + ca2 * len * 0.5 + rr(-0.1, 0.1), -0.75 + sa2 * len * 0.5), tip = L(-0.35 + ca2 * len, -0.75 + sa2 * len);
      A.stroke([r0, mid, tip], o.crestLine ? 'chalk' : 'pencil', o.crestLine || 'kajal', { w: Math.max(0.5, s * hs * 0.1), p: 0.8, tin: 0, tout: 0.05 });
      A.dot(tip[0], tip[1], 'chalk', o.crestTip || 'teal', { w: Math.max(1.2, s * hs * 0.5) });
      A.dot(tip[0], tip[1], 'gold', 'gold', { w: Math.max(0.7, s * hs * 0.22) });
    }
    // beak, open by 'gape'
    const g = o.gape != null ? o.gape : 0.3, bl = o.beak || 1.9;
    const up = [L(0.7, -0.42), L(0.75 + Math.cos(-g) * bl, Math.sin(-g) * bl - 0.05), L(0.8, 0.05)];
    const lo = [L(0.72, 0.0), L(0.75 + Math.cos(g * 0.9) * bl * 0.86, Math.sin(g * 0.9) * bl * 0.86 + 0.1), L(0.6, 0.42)];
    A.shape(lo, { c: o.beakc || 'sand', w: Math.max(1.2, s * hs * 0.4), rough: 0, line: 'sepia', lw: Math.max(0.5, s * hs * 0.1) });
    A.shape(up, { c: o.beakc || 'sand', w: Math.max(1.2, s * hs * 0.4), rough: 0, line: 'sepia', lw: Math.max(0.5, s * hs * 0.1) });
    // skull
    const sk = blob(A, o.c || 'lapis', hc[0], hc[1], s * hs * 1.12, s * hs * 0.92, wa, { rough: s * hs * 0.04 });
    // white cheek marks above and below the eye
    const e = L(0.22, -0.18);
    A.stroke([L(-0.35, -0.5), L(0.2, -0.62), L(0.7, -0.4)], 'chalk', 'khadi', { w: Math.max(0.8, s * hs * 0.3), p: 0.95 });
    A.stroke([L(-0.3, 0.12), L(0.2, 0.3), L(0.66, 0.18)], 'chalk', 'khadi', { w: Math.max(0.9, s * hs * 0.42), p: 0.95 });
    A.dot(e[0], e[1], 'kajal', 'kajal', { w: Math.max(0.9, s * hs * 0.42) });
    A.outline(sk, 'kajal', o.line || 'kajal', { closed: true, w: Math.max(0.6, s * hs * 0.14), p: 0.8 });
    return hc;
  }

  // one eye of the train.  E = sheet point, rot = sheet angle of the feather, u = size in sheet units
  function ocellus(A, E, rot, u, o) {
    o = o || {};
    const ca = Math.cos(rot), sa = Math.sin(rot);
    blob(A, o.halo || 'malachite', E[0] + ca * u * 0.08, E[1] + sa * u * 0.08, u, u * 0.78, rot, { cv: 0.05 });
    blob(A, o.bronze || 'ochre', E[0], E[1], u * 0.72, u * 0.57, rot);
    A.stroke(A.ellipse(E[0], E[1], u * 0.7, u * 0.55, rot), 'gold', 'gold', { w: Math.max(0.9, u * 0.16), p: 0.95 });
    const hx = E[0] - ca * u * 0.06, hy = E[1] - sa * u * 0.06;
    A.stroke(A.ellipse(hx, hy, u * 0.47, u * 0.39, rot, -1.5, 1.5), 'chalk', o.ring || 'aqua', { w: Math.max(0.9, u * 0.17), p: 0.95 });
    blob(A, o.heart || 'lapis', hx, hy, u * 0.42, u * 0.35, rot);
    A.dot(hx - ca * u * 0.1, hy - sa * u * 0.1, 'kajal', 'kajal', { w: Math.max(1, u * 0.34), ang: rot + 1.57, len: u * 0.08 });
    A.dot(hx + ca * u * 0.12 - sa * u * 0.12, hy + sa * u * 0.12 + ca * u * 0.12, 'chalk', 'khadi', { w: Math.max(0.6, u * 0.1) });
  }

  // ------------------------------------------------------------------ the dancer
  M.peacockDancing = function (A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, pick = A.pick;
    const tilt = (o.tilt != null ? o.tilt : -0.075), PF = frame(x, y, s, o.flip, tilt), drop = 0.085, org = PF(0, drop), P = frame(org[0], org[1], s, o.flip, tilt), fanTilt = o.fanTilt != null ? o.fanTilt : 0.1;
    const C = [-0.02, -0.47];
    const fp = (phi, r) => P(C[0] + Math.sin(phi + fanTilt) * r * 0.97, C[1] - Math.cos(phi + fanTilt) * r);

    // ---- the feathers of the train, in four staggered rings
    const rings = [{ n: 19, L: 1.0, half: 1.75, e: 1.0 }, { n: 17, L: 0.8, half: 1.73, e: 0.92 }, { n: 14, L: 0.61, half: 1.7, e: 0.84 }, { n: 10, L: 0.43, half: 1.62, e: 0.74 }];
    const fe = [];
    rings.forEach((R, k) => {
      const step = 2 * R.half / (R.n - 1);
      for (let i = 0; i < R.n; i++) {
        const phi = -R.half + step * i + rr(-0.2, 0.2) * step;
        fe.push({ k, phi, L: R.L * (0.95 + 0.07 * Math.cos(phi) * Math.cos(phi)) * rr(0.965, 1.035), e: R.e * rr(0.92, 1.08), bow: rr(-0.035, 0.035) });
      }
    });
    const f0 = fe.filter(f => f.k === 0);

    // ---- ground of the fan: deep green laid with radial strokes
    const rim = [];
    f0.forEach((f, i) => {
      if (i === 0) { rim.push(fp(f.phi + 0.16, 0.3)); rim.push(fp(f.phi + 0.05, 0.62)); rim.push(fp(f.phi - 0.02, f.L * 0.9)); }
      rim.push(fp(f.phi, f.L * 0.985));
      if (i < f0.length - 1) { const g = f0[i + 1]; rim.push(fp((f.phi + g.phi) / 2, (f.L + g.L) * 0.5 * 0.9)); } else { rim.push(fp(f.phi + 0.02, f.L * 0.9)); rim.push(fp(f.phi - 0.05, 0.62)); rim.push(fp(f.phi - 0.16, 0.3)); }
    });
    const fanPoly = A.roughen([P(C[0], C[1] + 0.07)].concat(A.spline(rim, false, 2.5)), 1.0, 12, true);
    A.pushMask(fanPoly);
    const HALF = 1.9;
    for (let pass = 0; pass < 2; pass++) for (let phi = -HALF; phi < HALF; phi += (4.2 / s) * rr(0.7, 1.3)) {
      A.stroke([fp(phi + rr(-0.012, 0.012), 0), fp(phi + rr(-0.015, 0.015), rr(0.45, 0.6)), fp(phi + rr(-0.012, 0.012), 1.05)], 'pastel', pass ? pick(['bottle', 'bottle', 'moss', 'bottle']) : 'bottle', { w: 8 * rr(0.9, 1.1), p: pass ? 0.9 : 1, reach: 1.5, cv: 0.03 });
    }
    for (let i = 0; i < 80; i++) {          // glints of lighter green between the shafts
      const phi = rr(-1.8, 1.8), a = rr(0.34, 0.6), b = Math.min(1.0, a + rr(0.2, 0.45));
      A.stroke([fp(phi, a), fp(phi + rr(-0.02, 0.02), (a + b) / 2), fp(phi, b)], 'pastel', pick(['malachite', 'malachite', 'teal', 'sap']), { w: rr(3, 5.5), p: 0.8, flow: rr(0.22, 0.42) });
    }
    for (let phi = -1.85; phi < 1.85; phi += 0.09 * rr(0.7, 1.3)) {   // shadow where the train springs from the rump
      A.stroke([fp(phi, 0), fp(phi, rr(0.26, 0.4))], 'pastel', 'night', { w: 7, p: 0.9, flow: 0.5 });
    }
    A.popMask();

    const ncl = A.spline(P.all([[0.05, -0.6], [0.02, -0.72], [-0.055, -0.82], [-0.095, -0.93], [-0.06, -1.035], [0.02, -1.085], [0.1, -1.085]]), false, 2);
    const headC = [0.14, -1.105], hw0 = P(headC[0], headC[1]);
    const nearHead = E => { if (Math.hypot(E[0] - hw0[0], E[1] - hw0[1]) < s * 0.15) return true; for (let i = Math.floor(ncl.length * 0.3); i < ncl.length; i += 2) if (Math.hypot(E[0] - ncl[i][0], E[1] - ncl[i][1]) < s * 0.085) return true; return false; };

    // ---- feathers: longest ring first, the short ones lie in front
    const barbCols = ['leaf', 'leaf', 'leaf', 'malachite', 'malachite', 'verdigris', 'olive', 'haldi', 'sage'];
    for (const f of fe) {
      const at = r => fp(f.phi + f.bow * Math.sin(Math.PI * Math.min(1, r / f.L)), r);
      const rE = f.L * 0.9, u = s * 0.073 * f.e;
      // shaft
      const sh = []; for (let r = 0.12; r <= rE; r += 0.06) sh.push(at(r)); sh.push(at(rE));
      A.stroke(sh, 'chalk', 'sand', { w: 0.9, p: 0.6, flow: 0.6 });
      // herring-bone barbs
      for (let r = 0.3 + rr(0, 0.03); r < f.L * 0.84; r += 0.027 * rr(0.75, 1.3)) {
        const q = at(r), q2 = at(r + 0.02); let tx = q2[0] - q[0], ty = q2[1] - q[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const len = s * (0.03 + 0.04 * (r / f.L)) * rr(0.8, 1.25);
        for (const sd of [-1, 1]) {
          if (A.chance(0.08)) continue;
          const be = rr(0.5, 0.8), cb = Math.cos(be), sb = Math.sin(be) * sd;
          const ddx = tx * cb - ty * sb, ddy = ty * cb + tx * sb;
          A.stroke([q, [q[0] + ddx * len * 0.5 + tx * len * 0.04, q[1] + ddy * len * 0.5 + ty * len * 0.04], [q[0] + ddx * len + tx * len * 0.14, q[1] + ddy * len + ty * len * 0.14]], 'chalk', pick(barbCols), { w: rr(0.8, 1.2), p: rr(0.5, 0.85), tin: 0, tout: 0.4, flow: 0.75 });
        }
      }
      // the eye, with its loose fringe
      const E = at(rE), E2 = at(rE + 0.02), rot = Math.atan2(E2[1] - E[1], E2[0] - E[0]);
      const nfr = f.k === 0 ? A.ri(11, 15) : A.ri(7, 10), fl = f.k === 0 ? [0.07, 0.125] : [0.035, 0.065];
      for (let i = 0; i < nfr; i++) {
        const a = rot + rr(-1.45, 1.45), l0 = u * rr(0.5, 0.8), l1 = u + s * rr(fl[0], fl[1]) * (0.6 + 0.4 * Math.cos(a - rot));
        const cv = rr(-0.25, 0.25);
        A.stroke([[E[0] + Math.cos(a) * l0, E[1] + Math.sin(a) * l0], [E[0] + Math.cos(a + cv * 0.4) * (l0 + l1) * 0.5, E[1] + Math.sin(a + cv * 0.4) * (l0 + l1) * 0.5], [E[0] + Math.cos(a + cv) * l1, E[1] + Math.sin(a + cv) * l1]], 'chalk', pick(['leaf', 'leaf', 'olive', 'haldi', 'sage', 'malachite']), { w: rr(0.75, 1.05), p: rr(0.5, 0.85), tin: 0, tout: 0.5 });
      }
      if (!nearHead(E)) ocellus(A, E, rot, u, { halo: A.chance(0.3) ? A.mix('malachite', 'leaf', rr(0.3, 0.6)) : 'malachite' });
    }

    for (let i = 0; i < 46; i++) {           // shimmer at the rim
      const phi = rr(-1.7, 1.7), a = rr(0.74, 0.86);
      A.stroke([fp(phi, a), fp(phi + rr(-0.015, 0.015), a + rr(0.08, 0.16))], 'chalk', pick(['haldi', 'leaf', 'haldi', 'verdigris']), { w: rr(0.7, 1.0), p: rr(0.45, 0.8), tin: 0.1, tout: 0.4 });
    }
    // ---- a skirt of loose down along the two lower edges
    for (const sd of [-1, 1]) {
      const ph = sd * (f0[sd < 0 ? 0 : f0.length - 1].phi);
      for (let r = 0.3; r < 0.98; r += 0.022 * rr(0.7, 1.3)) {
        const q = fp(ph + sd * rr(-0.03, 0.05), r), a = P.dir(1.5708) + sd * P.f * rr(0.1, 0.9), l = s * rr(0.04, 0.1);
        A.stroke([q, [q[0] + Math.cos(a) * l * 0.5 - sd * 0.6, q[1] + Math.sin(a) * l * 0.5], [q[0] + Math.cos(a) * l, q[1] + Math.sin(a) * l]], 'chalk', pick(['leaf', 'olive', 'malachite', 'bottle', 'haldi', 'moss']), { w: rr(0.8, 1.1), p: rr(0.5, 0.85), tin: 0, tout: 0.5 });
      }
    }

    // ---- drooped wings
    const wingL = A.spline(P.all([[-0.10, -0.64], [-0.21, -0.56], [-0.31, -0.42], [-0.375, -0.24], [-0.345, -0.18], [-0.25, -0.26], [-0.165, -0.38], [-0.10, -0.50]]), true, 2);
    const wingR = A.spline(P.all([[0.13, -0.64], [0.235, -0.55], [0.315, -0.41], [0.36, -0.25], [0.325, -0.2], [0.245, -0.29], [0.185, -0.4], [0.14, -0.52]]), true, 2);
    wing(A, wingL, P(-0.11, -0.61), P(-0.36, -0.2), s * 0.075, { rs: s * 0.019 });
    wing(A, wingR, P(0.14, -0.61), P(0.345, -0.22), s * 0.068, { rs: s * 0.018 });

    // ---- legs, mid-step
    leg(A, PF, [[-0.045, -0.22], [-0.068, -0.11], [-0.05, 0]], s * 0.024, 0.075, false, 'ochre');
    leg(A, PF, [[0.07, -0.22], [0.14, -0.15], [0.105, -0.065]], s * 0.024, 0.065, true, 'ochre');

    // ---- neck: arched back, then forward to the lifted head
    const neck = ribbon(ncl, t => s * prof(t, [[0, 0.085], [0.25, 0.06], [0.6, 0.042], [1, 0.034]]));
    const nk = A.shape(neck, { c: 'lapis', w: 5, passes: 2, rough: 0.4, ang: P.dir(-1.3) });
    A.pushMask(nk);
    A.stroke(ncl.map((p, i) => [p[0] + s * 0.02, p[1]]), 'pastel', 'aqua', { w: 3.5, p: 0.8, flow: 0.3 });
    A.stroke(ncl.map((p, i) => [p[0] - s * 0.03, p[1]]), 'shade', 'neel', { w: 4, p: 0.8, flow: 0.5 });
    A.popMask();
    scallops(A, nk, s * 0.027, s * 0.012, P.dir(1.5708), ['aqua', 'sky', 'verdigris'], { w: 0.85, margin: s * 0.006 });
    A.outline(neck.L, 'kajal', 'kajal', { w: 1.05, p: 0.8 });
    A.outline(neck.R, 'kajal', 'kajal', { w: 1.05, p: 0.8 });
    // ---- body
    const bodyCp = [[-0.05, -0.66], [-0.14, -0.58], [-0.17, -0.47], [-0.125, -0.36], [-0.02, -0.285], [0.09, -0.325], [0.18, -0.44], [0.19, -0.55], [0.125, -0.65], [0.04, -0.69]];
    const body = A.shape(A.spline(P.all(bodyCp), true, 2), { c: 'lapis', w: 6, passes: 2, rough: 0.7, ang: P.dir(1.2) });
    A.pushMask(body);
    for (let i = 0; i < 9; i++) { const t = i / 8; A.stroke(A.spline(P.all([[-0.15 + t * 0.07, -0.6], [-0.165 + t * 0.09, -0.46], [-0.1 + t * 0.07, -0.33], [0.0 + t * 0.04, -0.29]])), 'shade', 'neel', { w: 4, p: 0.75, flow: 0.5 }); }
    for (let i = 0; i < 5; i++) A.stroke(A.spline(P.all([[0.1 + i * 0.012, -0.62], [0.14 + i * 0.008, -0.52], [0.12 + i * 0.008, -0.4]])), 'pastel', 'aqua', { w: 4, p: 0.8, flow: 0.22 });
    A.popMask();
    scallops(A, body, s * 0.04, s * 0.02, P.dir(1.5708), ['sky', 'sky', 'aqua', 'ice'], { w: 1.0, margin: s * 0.012 });
    A.outline(body, 'kajal', 'kajal', { closed: true, w: 1.15, p: 0.8 });

    // a necklace of gold where neck meets breast
    for (const q of A.along(A.spline(P.all([[-0.035, -0.655], [0.035, -0.63], [0.105, -0.655]])), s * 0.02, 0.3)) A.dot(q.x, q.y, 'gold', 'gold', { w: 1.5 });

    const hc = head(A, P, headC, -0.62, 0.06, { gape: 0.46, crest: 7, crestLen: 2.8, beak: 2.4, beakc: 'cream', crestLine: o.crestLine || 'ice', crestTip: o.crestTip || 'aqua' });

    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of fanPoly.concat([PF(-0.12, 0.05), PF(0.12, 0.05)])) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    const mg = s * 0.13;
    return { head: hc, bbox: [x0 - mg, y0 - mg, x1 + mg, y1 + mg * 0.3], centre: P(C[0], C[1]) };
  };

  // ------------------------------------------------------------------ the one who waits
  M.peacockPerched = function (A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, pick = A.pick, dusty = o.dusty !== false;
    const D = c => dusty ? A.mix(c, 'sand', 0.26) : A.col(c);
    const P = frame(x, y, s, o.flip, o.tilt || 0);

    // ---- the closed train, hanging
    const tcl = A.spline(P.all([[-0.24, -0.32], [-0.46, 0.28], [-0.62, 0.98], [-0.66, 1.66], [-0.52, 2.32]]), false, 2);
    const hwf = t => s * prof(t, [[0, 0.17], [0.2, 0.25], [0.55, 0.235], [0.85, 0.13], [1, 0.04]]);
    const train = A.shape(ribbon(tcl, hwf), { c: D('moss'), w: 5, passes: 2, rough: 0.8, ang: P.dir(1.75) });
    const n = tcl.length;
    const tp = (i, off) => { const a = tcl[Math.max(0, i - 1)], b = tcl[Math.min(n - 1, i + 1)]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; return [tcl[i][0] + nx / l * off, tcl[i][1] + ny / l * off, b[0] - a[0], b[1] - a[1]]; };
    // side fringe of loose barbs
    for (let i = 4; i < n; i += 2) for (const sd of [-1, 1]) {
      if (A.chance(0.25)) continue;
      const t = i / (n - 1), q = tp(i, sd * hwf(t) * 0.8), tl = Math.hypot(q[2], q[3]) || 1, tx = q[2] / tl, ty = q[3] / tl;
      const be = rr(0.35, 0.7) * sd * P.f, cb = Math.cos(be), sb = Math.sin(be), len = s * rr(0.12, 0.24);
      A.stroke([[q[0], q[1]], [q[0] + (tx * cb - ty * sb) * len, q[1] + (ty * cb + tx * sb) * len]], 'chalk', pick([D('olive'), D('leaf'), D('moss'), D('sage')]), { w: rr(0.75, 1.05), p: rr(0.55, 0.85), tin: 0, tout: 0.5 });
    }
    // long plumes down the length
    A.pushMask(train);
    for (let k = -4; k <= 4; k++) {
      const fr = k / 4.6 + rr(-0.05, 0.05), ln = []; for (let i = 2; i < n; i++) ln.push(tp(i, fr * hwf(i / (n - 1))).slice(0, 2));
      A.outline(ln, 'pencil', pick(['bottle', D('olive'), D('leaf'), 'bottle', D('ochre')]), { w: rr(0.8, 1.2), p: rr(0.6, 0.85), pull: s * 0.7, again: 0.1 });
    }
    for (let i = 3; i < n - 2; i += 1) {     // short barbs in a herring-bone
      const t = i / (n - 1), q = tp(i, rr(-0.7, 0.7) * hwf(t)), tl = Math.hypot(q[2], q[3]) || 1, tx = q[2] / tl, ty = q[3] / tl, sd = A.chance(0.5) ? 1 : -1;
      const be = rr(0.4, 0.7) * sd, cb = Math.cos(be), sb = Math.sin(be), len = s * rr(0.07, 0.13);
      A.stroke([[q[0], q[1]], [q[0] + (tx * cb - ty * sb) * len, q[1] + (ty * cb + tx * sb) * len]], 'chalk', pick([D('leaf'), D('sage'), D('haldi')]), { w: 0.8, p: rr(0.45, 0.75), flow: 0.7 });
    }
    A.popMask();
    // eyes along the train, growing toward the tip
    const ne = o.eyes || 11;
    for (let j = 0; j < ne; j++) {
      const t = 0.2 + 0.74 * (j / (ne - 1)) + rr(-0.015, 0.015), i = Math.min(n - 2, Math.round(t * (n - 1)));
      const side = (j % 2 ? 1 : -1) * rr(0.25, 0.55) * (t > 0.86 ? 0.3 : 1), q = tp(i, side * hwf(t)), rot = Math.atan2(q[3], q[2]), u = s * lerp(0.062, 0.085, t);
      blob(A, D('malachite'), q[0], q[1], u, u * 0.8, rot);
      blob(A, D('saffron'), q[0], q[1], u * 0.66, u * 0.52, rot);
      A.stroke(A.ellipse(q[0], q[1], u * 0.66, u * 0.52, rot), 'gold', 'gold', { w: Math.max(0.7, u * 0.16) });
      A.dot(q[0], q[1], 'chalk', D('lapis'), { w: u * 0.62, ang: rot, len: u * 0.1 });
      A.dot(q[0] - Math.cos(rot) * u * 0.08, q[1] - Math.sin(rot) * u * 0.08, 'kajal', 'kajal', { w: Math.max(0.6, u * 0.26) });
    }
    A.outline(train, 'kajal', 'sepia', { closed: true, w: 0.8, p: 0.6, again: 0.3 });
    // frayed tip
    const e = tp(n - 1, 0), el = Math.hypot(e[2], e[3]) || 1, ea = Math.atan2(e[3], e[2]);
    for (let i = 0; i < 9; i++) { const a = ea + rr(-0.5, 0.5), l = s * rr(0.1, 0.3); A.stroke([[e[0] - Math.cos(ea) * s * 0.08, e[1] - Math.sin(ea) * s * 0.08], [e[0] + Math.cos(a) * l, e[1] + Math.sin(a) * l]], 'chalk', pick([D('olive'), D('leaf'), D('moss')]), { w: 0.85, p: rr(0.5, 0.8), tin: 0, tout: 0.5 }); }

    // ---- legs gripping the branch
    leg(A, P, [[0.07, -0.16], [0.06, -0.08], [0.04, 0]], s * 0.04, 0.12, true, D('stone'));
    leg(A, P, [[-0.07, -0.12], [-0.08, -0.06], [-0.09, 0]], s * 0.04, 0.12, true, D('stone'));

    // ---- neck, stretched to the sky
    const ncl = A.spline(P.all([[0.11, -0.76], [0.085, -1.06], [0.11, -1.32], [0.19, -1.53], [0.265, -1.65]]), false, 1.5);
    const nrb = ribbon(ncl, t => s * prof(t, [[0, 0.125], [0.35, 0.085], [0.8, 0.058], [1, 0.05]]));
    const nk = A.shape(nrb, { c: D('lapis'), w: 4, passes: 2, rough: 0.3, ang: P.dir(-1.4) });
    A.pushMask(nk);
    A.stroke(ncl.map(p => [p[0] + P.f * s * 0.03, p[1]]), 'pastel', D('aqua'), { w: 2.5, p: 0.8, flow: 0.35 });
    A.popMask();
    scallops(A, nk, s * 0.06, s * 0.026, P.dir(1.5708), [D('aqua'), D('sky'), D('verdigris')], { w: 0.75, margin: s * 0.012 });
    A.outline(nrb.L, 'kajal', 'kajal', { w: 0.9, p: 0.8 });
    A.outline(nrb.R, 'kajal', 'kajal', { w: 0.9, p: 0.8 });
    // ---- body
    const body = A.shape(A.spline(P.all([[0.02, -0.86], [0.2, -0.8], [0.345, -0.58], [0.33, -0.36], [0.2, -0.16], [0.0, -0.07], [-0.24, -0.06], [-0.4, -0.17], [-0.36, -0.42], [-0.2, -0.68]]), true, 1.5), { c: D('lapis'), w: 5, passes: 2, rough: 0.5, ang: P.dir(-1.1) });
    A.pushMask(body);
    for (let i = 0; i < 6; i++) A.stroke(A.spline(P.all([[0.26 - i * 0.02, -0.25], [0.1 - i * 0.03, -0.11], [-0.2, -0.08]])), 'shade', 'neel', { w: 3, p: 0.75, flow: 0.5 });
    A.popMask();
    scallops(A, body, s * 0.085, s * 0.04, P.dir(1.9), [D('sky'), D('aqua')], { w: 0.85, margin: s * 0.02 });
    // folded wing
    const wg = A.spline(P.all([[-0.1, -0.7], [0.1, -0.62], [0.17, -0.44], [0.05, -0.27], [-0.2, -0.16], [-0.42, -0.1], [-0.37, -0.36], [-0.25, -0.58]]), true, 1.5);
    wing(A, wg, P(0.02, -0.62), P(-0.4, -0.12), s * 0.2, { c: D('sindoor'), rs: s * 0.05, split: 0.55, lw: 0.8, prim: D('umber') });
    A.outline(body, 'kajal', 'kajal', { closed: true, w: 0.95, p: 0.8 });

    const hc = head(A, P, [0.3, -1.7], -0.95, 0.075, { gape: 0.16, crest: 5, crestLen: 2.6, c: D('lapis'), crestTip: D('teal') });
    return { head: hc, tailTip: [e[0], e[1]] };
  };

  // ------------------------------------------------------------------ hen
  M.peahen = function (A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, P = frame(x, y, s, o.flip, o.tilt || 0), peck = o.pose === 'peck';
    const brown = A.mix('umber', 'stone', 0.42), pale = A.mix('sand', 'khadi', 0.4);
    leg(A, P, [[0.07, -0.5], [0.1, -0.24], [0.08, 0]], s * 0.045, 0.16, false, 'stone');
    leg(A, P, [[-0.1, -0.5], [-0.09, -0.26], [-0.14, 0]], s * 0.045, 0.16, false, 'stone');
    const cp = peck
      ? [[0.34, -0.86], [0.46, -0.66], [0.3, -0.46], [0.02, -0.42], [-0.32, -0.52], [-0.72, -0.62], [-0.8, -0.76], [-0.45, -0.88], [-0.1, -0.98], [0.16, -0.97]]
      : [[0.3, -0.96], [0.43, -0.74], [0.31, -0.5], [0.02, -0.42], [-0.34, -0.5], [-0.78, -0.46], [-0.85, -0.6], [-0.46, -0.8], [-0.1, -1.0], [0.13, -1.04]];
    const body = A.shape(A.spline(P.all(cp), true, 1.5), { c: brown, w: 4, passes: 2, rough: 0.4, ang: P.dir(0.3) });
    A.pushMask(body);
    blob(A, 'khadi', ...P(0.2, -0.5), s * 0.24, s * 0.13, P.dir(-0.2));            // white belly
    for (let i = 0; i < 5; i++) A.stroke(P.all([[-0.5 - i * 0.07, -0.78 + i * 0.045], [-0.52 - i * 0.07, -0.5 + i * 0.01]]), 'pencil', 'sepia', { w: 0.9, p: 0.7 });   // tail bars
    A.popMask();
    const wg = A.spline(P.all([[0.12, -0.92], [0.2, -0.76], [0.02, -0.6], [-0.3, -0.6], [-0.5, -0.7], [-0.25, -0.9]]), true, 1.5);
    wing(A, wg, P(0.14, -0.82), P(-0.48, -0.68), s * 0.15, { c: A.mix('umber', 'sand', 0.35), rs: s * 0.045, split: 0.6, scale: pale, dotc: 'sepia', prim: 'sepia', lw: 0.7 });
    A.outline(body, 'kajal', 'sepia', { closed: true, w: 0.85, p: 0.8 });
    const ncp = peck ? [[0.3, -0.84], [0.52, -0.74], [0.66, -0.48], [0.7, -0.24]] : [[0.25, -0.9], [0.3, -1.16], [0.35, -1.4]];
    const ncl = A.spline(P.all(ncp), false, 1.5);
    const nk = A.shape(ribbon(ncl, t => s * lerp(0.115, 0.065, t)), { c: 'malachite', w: 3, passes: 2, rough: 0.25 });
    scallops(A, nk, s * 0.075, s * 0.032, P.dir(peck ? 0.6 : 1.5708), ['leaf', 'verdigris'], { w: 0.75, margin: s * 0.012 });
    A.outline(nk, 'kajal', 'sepia', { w: 0.8, p: 0.8 });
    const hc = peck ? head(A, P, [0.71, -0.15], 1.25, 0.085, { gape: 0.1, crest: 4, crestLen: 1.7, c: brown, line: 'sepia', beak: 1.6 })
      : head(A, P, [0.375, -1.47], -0.1, 0.085, { gape: 0.06, crest: 4, crestLen: 1.9, c: brown, line: 'sepia', beak: 1.6 });
    return { head: hc };
  };

  // ------------------------------------------------------------------ elephant (wild, no trappings)
  /* x,y = the ground under the middle of the body, s = height at the shoulder.
     Charcoal body, every contour picked out in a line of white dots, as on the painted walls of Mewar.
     o.pose 'spray' (default: trunk thrown up, one forefoot lifted, water flying) | 'walk'; o.calf; o.flip */
  M.elephant = function (A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, pick = A.pick, P = frame(x, y, s, o.flip, o.tilt || 0), spray = o.pose !== 'walk', calf = !!o.calf;
    // the head is a little bigger on a calf: its own frame, pinned at the neck
    const hk = calf ? 1.17 : 1, ho = P(0.45 * (1 - hk), -0.85 * (1 - hk)), PH = frame(ho[0], ho[1], s * hk, o.flip, o.tilt || 0);
    const black = A.mix('kajal', 'ash', 0.2), far = A.mix('kajal', 'neel', 0.14), earC = A.mix('kajal', 'ash', 0.4);
    const dotsW = (pl, step, w) => { for (const q of A.along(pl, step || s * 0.03, s * 0.003)) A.dot(q.x, q.y, 'chalk', 'khadi', { w: (w || s * 0.015) * rr(0.8, 1.2) }); };
    const dots = (F, cp, closed, step, w) => dotsW(A.spline(F.all(cp), !!closed, 1.5), step, w);
    const legPts = (x0, x1, top, lean) => [[x0 - 0.03, top], [x1 + 0.03, top], [x1 + 0.004 + lean * 0.5, top * 0.45], [x1 + 0.024 + lean, 0], [x0 - 0.02 + lean, 0], [x0 + 0.002 + lean * 0.5, top * 0.45]];
    const fillC = (pts, c, w) => A.shape(pts, { c, w: Math.max(3, s * (w || 0.07)), passes: 2, rough: 0.6, ang: P.dir(1.3) });
    const nails = (cx0, dx, yy, n) => { for (let k = 0; k < n; k++) { const q = P(cx0 + k * dx, yy); A.stroke(A.ellipse(q[0], q[1], s * 0.026, s * 0.03, 0, 3.3, 6.1), 'chalk', 'cream', { w: Math.max(0.9, s * 0.014), p: 0.95 }); } };

    // tail
    A.stroke(A.spline(P.all([[-0.68, -0.7], [-0.8, -0.58], [-0.85, -0.36]]), false, 1.5), 'pastel', black, { w: s * 0.035, p: 1, reach: 1.5 });
    const te = P(-0.85, -0.36); for (let i = 0; i < 7; i++) A.stroke([te, [te[0] + rr(-0.03, 0.03) * s, te[1] + rr(0.05, 0.11) * s]], 'pencil', 'kajal', { w: 0.9, p: 0.85 });
    // far legs
    const lh = spray ? 0.02 : -0.07, lf = spray ? -0.01 : 0.07;
    fillC(P.all(legPts(-0.36, -0.21, -0.5, spray ? -0.06 : 0.08)), far); fillC(P.all(legPts(0.03, 0.17, -0.5, spray ? 0.02 : -0.07)), far);
    // body: an arched back, a hanging belly
    const bodyCp = [[-0.71, -0.56], [-0.64, -0.84], [-0.4, -1.0], [-0.12, -1.045], [0.16, -1.0], [0.36, -0.92], [0.46, -0.74], [0.42, -0.46], [0.2, -0.3], [-0.15, -0.26], [-0.5, -0.33], [-0.68, -0.42]];
    A.shape(A.spline(P.all(bodyCp), true, 2), { c: black, w: Math.max(4, s * 0.09), passes: 2, rough: 0.9, ang: P.dir(-0.5) });
    // near legs; in delight one forefoot comes off the ground
    const hind = legPts(-0.65, -0.46, -0.52, lh);
    fillC(P.all(hind), black);
    const foreUp = [[0.19, -0.54], [0.42, -0.54], [0.5, -0.38], [0.6, -0.3], [0.585, -0.16], [0.47, -0.14], [0.4, -0.25], [0.24, -0.3]];
    const fore = spray ? foreUp : legPts(0.21, 0.39, -0.52, lf);
    fillC(spray ? A.spline(P.all(fore), true, 2) : P.all(fore), black);
    // trunk
    const tcp = spray ? [[0.78, -0.86], [0.96, -0.72], [1.14, -0.78], [1.23, -1.0], [1.18, -1.25], [1.07, -1.42], [1.09, -1.57]] : [[0.8, -0.86], [0.96, -0.68], [1.02, -0.42], [0.98, -0.2], [1.03, -0.07], [1.14, -0.1]];
    const tcl = A.spline(PH.all(tcp), false, 1.5);
    const trb = ribbon(tcl, t => s * hk * prof(t, [[0, 0.125], [0.3, 0.095], [0.7, 0.065], [1, 0.042]]));
    A.shape(trb, { c: black, w: Math.max(3, s * 0.06), passes: 2, rough: 0.5 });
    // head: the twin-domed skull of the Indian elephant
    const headCp = [[0.4, -1.0], [0.47, -1.19], [0.6, -1.275], [0.71, -1.22], [0.8, -1.255], [0.9, -1.13], [0.93, -0.95], [0.86, -0.76], [0.72, -0.64], [0.56, -0.62], [0.44, -0.74]];
    A.shape(A.spline(PH.all(headCp), true, 2), { c: black, w: Math.max(3, s * 0.07), passes: 2, rough: 0.6 });
    // ear
    const earCp = [[0.47, -1.12], [0.3, -1.05], [0.215, -0.83], [0.27, -0.58], [0.4, -0.47], [0.52, -0.6], [0.57, -0.86]];
    const ear = A.shape(A.spline(PH.all(earCp), true, 2), { c: earC, w: Math.max(3, s * 0.06), passes: 2, rough: 0.7 });
    A.pushMask(ear);
    for (let i = 0; i < 5; i++) A.stroke(A.spline(PH.all([[0.5, -0.98 + i * 0.03], [0.4 - i * 0.012, -0.84 + i * 0.05], [0.33 + i * 0.03, -0.66 + i * 0.03]])), 'pencil', 'kajal', { w: 0.9, p: 0.7 });
    A.popMask();
    // tusk
    if (!calf) {
      const tk = ribbon(A.spline(PH.all([[0.73, -0.74], [0.86, -0.62], [1.01, -0.65]]), false, 1.5), t => s * lerp(0.032, 0.007, t));
      A.shape(tk, { c: 'cream', w: Math.max(1.8, s * 0.03), passes: 2, rough: 0.2, line: 'sepia', lw: 0.7 });
    }
    // the white dotted drawing
    dots(P, [[-0.71, -0.54], [-0.64, -0.84], [-0.4, -0.995], [-0.12, -1.04], [0.16, -0.995], [0.33, -0.935]]);      // back
    dots(P, [[-0.44, -0.345], [-0.15, -0.265], [0.17, -0.3]]);                                                     // belly
    dots(P, [[-0.27, -0.96], [-0.41, -0.82], [-0.455, -0.64], [-0.43, -0.5]]);                                      // haunch
    dots(P, [[0.09, -0.975], [0.2, -0.82], [0.215, -0.64], [0.18, -0.52]]);                                         // shoulder
    dots(P, [hind[0], hind[5], hind[4]]); dots(P, [hind[1], hind[2], hind[3]]);
    dots(P, [[hind[5][0] + 0.02, hind[5][1] - 0.02], [(hind[5][0] + hind[2][0]) / 2, hind[5][1]], [hind[2][0] - 0.02, hind[2][1] - 0.02]], false, s * 0.028, s * 0.011);
    nails(hind[4][0] + 0.05, 0.068, -0.02, 3);
    if (spray) { dots(P, [foreUp[7], foreUp[6], foreUp[5], foreUp[4], foreUp[3], foreUp[2], foreUp[1]]); dots(P, [[0.42, -0.26], [0.47, -0.3], [0.53, -0.36]], false, s * 0.028, s * 0.011); for (let k = 0; k < 3; k++) { const q = P(0.49 + k * 0.035, -0.155 - k * 0.006); A.stroke(A.ellipse(q[0], q[1], s * 0.022, s * 0.026, 0, 3.3, 6.1), 'chalk', 'cream', { w: Math.max(0.9, s * 0.014), p: 0.95 }); } }
    else { dots(P, [fore[0], fore[5], fore[4]]); dots(P, [fore[1], fore[2], fore[3]]); dots(P, [[fore[5][0] + 0.02, fore[5][1] - 0.02], [(fore[5][0] + fore[2][0]) / 2, fore[5][1]], [fore[2][0] - 0.02, fore[2][1] - 0.02]], false, s * 0.028, s * 0.011); nails(fore[4][0] + 0.05, 0.068, -0.02, 3); }
    dots(PH, headCp.slice(0, 8));                                                                                  // skull and brow
    dots(PH, earCp, true);                                                                                         // ear
    dotsW(trb.L.slice(4)); dotsW(trb.R.slice(4));                                                                  // trunk
    for (let i = 5; i < tcl.length - 3; i += 5) {        // rings round the trunk
      const a = trb.L[i], b = trb.R[i], m = [(a[0] + b[0]) / 2 + (tcl[i + 1][0] - tcl[i][0]) * 1.2, (a[1] + b[1]) / 2 + (tcl[i + 1][1] - tcl[i][1]) * 1.2];
      A.stroke([[lerp(a[0], b[0], 0.14), lerp(a[1], b[1], 0.14)], m, [lerp(a[0], b[0], 0.86), lerp(a[1], b[1], 0.86)]], 'chalk', 'stone', { w: 0.8, p: rr(0.45, 0.75), flow: 0.7 });
    }
    // eye
    const e = PH(0.745, -0.985);
    A.stroke(A.ellipse(e[0], e[1], s * hk * 0.03, s * hk * 0.022, PH.dir(0.2)), 'gold', 'gold', { w: Math.max(1, s * 0.014) });
    A.dot(e[0], e[1], 'kajal', 'kajal', { w: Math.max(1, s * 0.022) }); A.dot(e[0] - s * 0.006, e[1] - s * 0.006, 'chalk', 'khadi', { w: Math.max(0.6, s * 0.008) });
    // water thrown high, falling back over the shoulders
    const tipN = tcp[tcp.length - 1];
    if (spray) {
      const T = PH(tipN[0], tipN[1] - 0.03), nj = o.jets || 16;
      for (let j = 0; j < nj; j++) {
        const a = -1.5708 + (j / (nj - 1) - 0.62) * 2.0 + rr(-0.08, 0.08), v = s * rr(0.95, 1.35), g = s * 1.25, tmax = rr(0.8, 1.2);
        const vx = Math.cos(a) * v * P.f, vy = Math.sin(a) * v;
        let px = 0, py = 0;
        for (let t = 0.06 + rr(0, 0.04); t < tmax; t += rr(0.045, 0.08)) {
          px = T[0] + vx * t; py = T[1] + vy * t + g * t * t * 0.5; const dx = vx, dy = vy + g * t, dl = Math.hypot(dx, dy) || 1, len = s * rr(0.02, 0.045);
          A.stroke([[px, py], [px + dx / dl * len, py + dy / dl * len]], 'chalk', pick(['khadi', 'khadi', 'ice', 'sky']), { w: rr(1.1, 1.9), p: rr(0.75, 1), tin: 0, tout: 0.3 });
        }
        A.dot(px + rr(-2, 2), py + s * rr(0.03, 0.06), 'chalk', 'khadi', { w: rr(1.6, 2.4) });
      }
    }
    return { trunkTip: PH(tipN[0], tipN[1]), eye: e };
  };

})();
