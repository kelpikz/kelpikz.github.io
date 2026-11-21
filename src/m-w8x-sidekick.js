(function () {
  'use strict';
  /* ==========================================================================
     THE DOVECOTE (the Sidekick stop), painted the folio way (see M.folioArt['dpay']):
     each part laid in one clean flat colour with the stick, the strokes running with
     the form; then one kajal contour, heavy on the shadow side and thinning into the
     light; then its ornament ruled and filled bead by bead; then the gold.
     A kabutar khana: a stepped plinth of red sandstone, a banded round shaft, a lotus
     capital and two curved todas carrying a two-storey house of lime with cusped
     nesting holes and jali, a deep eave and a chhatri dome with a gold finial.  Rock
     doves sit in it and on it, each its own bird, and one comes in to land.
     Local frame (stage-well8k.js doveZ): origin at the foot of the plinth, y up is
     negative, 1 unit = 0.46 sheet units.  The light comes from the upper left.
     ======================================================================== */
  M.w8x = M.w8x || {};
  const PI = Math.PI;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const KW = 1.7;      // kajal drawn this much heavier, as the stage does for its focal objects
  const INKW = 1.3;    // and the contours of the forms heavier again, to the weight of the folio's line

  const C = {
    lime: '#f4ecdc', limeLit: '#fffaf0', sand: '#b4503a', sandLit: '#d47a58', sandDeep: '#7c2c22',
    hingul: '#c8382a', lapis: '#2a4b96', neel: '#1d2850', mal: '#3b7f52', leafL: '#86b46a',
    hole: '#2c1a28', holeDeep: '#1c1018', holeLip: '#5a3242', haldi: '#edc94b', pink: '#e2808c', rose: '#e8a0a8'
  };
  const COATS = {
    grey: { body: '#8f98aa', breast: '#a3a6bc', wing: '#b4bbc9', bar: '#262934', tip: '#3c4150', neck: ['#3f9a6c', '#8a5a9e'], tail: '#585e70', ring: '#d8dae0' },
    blue: { body: '#7e889c', breast: '#9496b0', wing: '#a6aec0', bar: '#20222c', tip: '#343844', neck: ['#3a8e70', '#7e4e96'], tail: '#4c5264', ring: '#d0d4dc' },
    white: { body: '#f4f1eb', breast: '#efe6e4', wing: '#ebe7e1', bar: null, tip: '#c4c0cb', neck: ['#ecd4da', '#dcd4e4'], tail: '#d6d2dc', ring: '#f0c8c8' },
    fawn: { body: '#c69c82', breast: '#d9ad96', wing: '#dbb79e', bar: '#80412e', tip: '#6e5246', neck: ['#a8786a', '#9a6a7a'], tail: '#94705e', ring: '#ecd2c4' }
  };

  const R = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const trap = (a, y0, b, y1, cx) => { cx = cx || 0; return [[cx - a, y0], [cx + a, y0], [cx + b, y1], [cx - b, y1]]; };
  // a cusped arch: jambs to the spring, then a pointed head whose edge bulges inward in nl lobes
  function cusped(ax, base, w, h, nl, amp) {
    const spring = base - h * 0.5, rise = h * 0.5, head = [];
    for (let i = 0; i <= 44; i++) {
      const f = i / 44, th = f * PI, x0 = ax - Math.cos(th) * w / 2, y0 = spring - rise * (1 - Math.pow(Math.abs(Math.cos(th)), 1.7));
      const dx = x0 - ax, dy = y0 - (spring + rise * 0.15), dl = Math.hypot(dx, dy) || 1, bulge = amp * Math.abs(Math.sin(PI * nl * f));
      head.push([x0 + dx / dl * bulge, y0 + dy / dl * bulge]);
    }
    return [[ax - w / 2, base]].concat(head, [[ax + w / 2, base]]);
  }
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
  // a path pushed in (d > 0) or out from a closed polygon, by its centroid (for the near-convex forms here)
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

  function kit(Z) {
    const INK = Z.mix('kajal', 'neel', 0.12), KJ = Z.tool('kajal', { wmin: 0.3 });
    const K = { INK, SH: Z.mix(C.lime, '#5a4a78', 0.3), SHD: Z.mix(C.lime, '#4a3a68', 0.48) };
    K.solid = (p, c, o) => Z.fill(p, 'pastel', c, Object.assign({ w: 2.6, p: 1, reach: 1.5, passes: 2, ang: 1.5, streak: 0.25 }, o));
    // the contour, laid in two goes the way a painter lays kajal: first one unbroken line of even weight all round,
    // then a second pass over it that swells where the form turns from the light (right and below) and thins away
    // to nothing where it turns into it, so the light side keeps its line and the shadow side carries the weight
    K.ink = (poly, w, o) => {
      o = o || {};
      w = (w || 0.65) * KW * INKW;
      let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; } cx /= poly.length; cy /= poly.length;
      const n = poly.length, sw = poly.map((p, i) => {
        const a = poly[(i - 1 + n) % n], b = poly[(i + 1) % n];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
        return clamp((nx * 0.78 + ny * 0.62 + 0.15) / 0.95, 0, 1);
      });
      const ring = poly.concat(poly.slice(0, 3)), swr = sw.concat(sw.slice(0, 3));
      Z.stroke(ring.map(p => [p[0], p[1]]), KJ, INK, { w: w * 0.6, p: 1, tin: 0, tout: 0, wob: 0.22 });
      Z.stroke(ring.map((p, i) => [p[0], p[1], 0.42 + 0.58 * swr[i]]), KJ, INK, { w, p: 1, tin: 0, tout: 0, wob: 0.22 });
    };
    K.line = (p, w, o) => Z.stroke(p, KJ, INK, Object.assign({ p: 0.9, wob: 0.4 }, o, { w: (w || 0.5) * KW * 1.15 }));
    // burnish the ground under a surface before it is painted, as lime plaster is polished: the sheet's broad
    // crumple and its hairs are pressed flat and only the fine even tooth is left
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
    K.hair = (p, w, o) => Z.stroke(p, KJ, Z.mix(INK, C.lime, 0.18), Object.assign({ p: 0.7, tin: 0.06, tout: 0.08 }, o, { w: (w || 0.26) * KW }));
    K.chalk = (p, c, w, o) => Z.stroke(p, 'chalk', c, Object.assign({ w: w || 1, p: 0.85 }, o));
    K.dot = (x, y, c, w, o) => Z.dot(x, y, 'chalk', c, Object.assign({ w: w || 1.4, p: 0.95 }, o));
    // a ruled row of dots along a path, laid one by one: each a hair off in place and size, never a stamp
    K.dots = (path, step, c, w, o) => {
      o = o || {};
      for (const q of Z.along(path, step, 0)) {
        if (o.skip && o.skip(q)) continue;
        K.dot(q.x + Z.rr(-0.08, 0.08) * step, q.y + Z.rr(-0.06, 0.06) * step, c, w * Z.rr(0.88, 1.1), { p: Z.rr(0.86, 1) });
      }
    };
    K.goldDot = (x, y, w) => Z.dot(x, y, 'gold', 'gold', { w: (w || 1.6) * Z.rr(0.92, 1.06), p: 1 });
    // gold leaf laid as a line: burnished, its edge a little broken where the leaf did not take
    K.leafLine = (o, pts, w) => {
      const r = Z.along(pts, Math.max(1.5, w * 2), 0).map(q => [q.x, q.y]);
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
    // shade down the right of a form, light up its left, inside its mask
    K.model = (poly, x0, x1, y0, y1, sh, lit, k) => {
      k = k == null ? 1 : k;
      Z.withMask(poly, () => {
        const w = x1 - x0;
        Z.fill(R(x1 - w * 0.3, y0 - 1, x1 + 1, y1 + 1), 'shade', sh, { w: 2.4, p: 0.48 * k, passes: 1, ang: 1.5 });
        Z.fill(R(x1 - w * 0.12, y0 - 1, x1 + 1, y1 + 1), 'shade', sh, { w: 2, p: 0.42 * k, passes: 1, ang: 1.5 });
        if (lit) Z.stroke([[x0 + w * 0.09, y0 - 0.5], [x0 + w * 0.09, y1 + 0.5]], 'chalk', lit, { w: Math.min(2.2, w * 0.09), p: 0.45 * k, tin: 0.1, tout: 0.1 });
      });
    };
    // a ruled border just inside a rectangle: a kajal hairline, then a row of fine dots inside it
    K.rule = (x0, y0, x1, y1, d, dotC, step) => {
      const r = [[x0 + d, y0 - d], [x1 - d, y0 - d], [x1 - d, y1 + d], [x0 + d, y1 + d]];
      K.hair(r.concat([r[0]]), 0.24);
      if (dotC) K.dots([[x0 + d + 1.4, y0 - d - 1.4], [x1 - d - 1.4, y0 - d - 1.4], [x1 - d - 1.4, y1 + d + 1.4], [x0 + d + 1.4, y1 + d + 1.4], [x0 + d + 1.4, y0 - d - 1.4]], step || 2.6, dotC, 0.85);
    };
    return K;
  }

  // the almond eye of a dove: a pale ring, the orange iris, the pupil, a catch of light, one fine line round the ring
  function eye(Z, K, E, ea, s, cz) {
    const alm = (rx, ry) => { const pts = []; for (let i = 0; i < 24; i++) { const t = i / 24 * 2 * PI, u = Math.cos(t) * rx, v = Math.sin(t) * ry * (0.55 + 0.45 * Math.abs(Math.cos(t * 0.5))); pts.push([E[0] + u * Math.cos(ea) - v * Math.sin(ea), E[1] + u * Math.sin(ea) + v * Math.cos(ea)]); } return pts; };
    const ring = alm(s * 0.058, s * 0.044);
    Z.fill(ring, 'chalk', cz.ring, { w: s * 0.03, p: 1, passes: 2, reach: 1.5 });
    const iris = alm(s * 0.036, s * 0.03);
    Z.fill(iris, 'chalk', '#e86c22', { w: s * 0.02, p: 1, passes: 2, reach: 1.5 });
    K.dot(E[0] + Math.cos(ea) * s * 0.004, E[1] + Math.sin(ea) * s * 0.004, 'kajal', s * 0.026);
    K.dot(E[0] - s * 0.01, E[1] - s * 0.012, C.limeLit, s * 0.011);
    Z.outline(ring, 'kajal', K.INK, { closed: true, w: Math.max(0.16, s * 0.0075) * KW * 1.15, p: 0.85, pull: 30, again: 0 });
  }

  /* ------------------------------------------------------------------ a rock dove, the Mewar way: one clean contour,
     two black bars on the wing, the green and violet sheen of the neck, an almond eye in its pale ring, pink feet.
     x, y: between its feet; s: its size (beak to tail is about 1.2 s); o.flip: faces left; o.turn: the head raised
     (+) or lowered (-) about the neck; o.puff: the breast puffed; o.coat */
  function dove(Z, K, x, y, s, o) {
    o = o || {};
    const f = o.flip ? -1 : 1, cz0 = COATS[o.coat || 'grey'], st = Math.max(0.3, s * 0.02), lw = Math.max(0.3, s * 0.018);
    const cz = Object.assign({}, cz0, { body: Z.vary(cz0.body, 0.025), wing: Z.vary(cz0.wing, 0.02) });
    if (o.pose === 'fly') return doveFly(Z, K, x, y, s, f, cz, lw, st, o);
    const P = (u, v) => [x + u * s * f, y + v * s];
    // the head turns about the nape
    const tn = o.turn || 0, pvx = 0.22, pvy = -0.58, ct = Math.cos(tn), sn = Math.sin(tn);
    const H = (u, v) => { const du = u - pvx, dv = v - pvy; return P(pvx + du * ct + dv * sn, pvy - du * sn + dv * ct); };
    const pf = o.puff || 0;
    for (const [u, du, k] of [[0.075, 0.032, 1], [-0.05, 0.022, 0.85]]) {
      const leg = [P(u, -0.1), P(u + du * 0.5, -0.04), P(u + du, 0)];
      Z.stroke(leg, 'chalk', Z.mix(C.pink, '#a04050', 1 - k), { w: s * 0.034, p: 1 });
      Z.stroke([P(u + du - 0.04, 0.004), P(u + du + 0.085, 0.006)], 'chalk', Z.mix(C.pink, '#a04050', 1 - k), { w: s * 0.03, p: 1 });
      K.hair([P(u + du - 0.04, 0.02), P(u + du + 0.09, 0.022)], 0.2);
    }
    const sil = Z.spline([H(0.44, -0.66), H(0.405, -0.735), H(0.33, -0.772), H(0.25, -0.738), H(0.205, -0.64), P(0.11, -0.55 - pf * 0.02),
      P(-0.1, -0.505), P(-0.34, -0.42), P(-0.6, -0.34), P(-0.715, -0.3), P(-0.685, -0.232), P(-0.42, -0.19), P(-0.14, -0.088),
      P(0.1, -0.068), P(0.28 + pf * 0.03, -0.14), P(0.385 + pf * 0.05, -0.29), P(0.41 + pf * 0.03, -0.45), H(0.425, -0.58)], true, st);
    K.solid(sil, cz.body, { w: s * 0.09, ang: f > 0 ? 0.35 : -0.35 });
    Z.withMask(sil, () => {
      Z.stroke([P(0.34 + pf * 0.04, -0.42), P(0.31 + pf * 0.03, -0.25), P(0.18, -0.13)], 'chalk', cz.breast, { w: s * 0.13, p: 0.6 });
      // the sheen of the neck: green on the side, violet toward the throat, laid in small strokes round the neck
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        Z.stroke([H(lerp(0.36, 0.25, t), lerp(-0.62, -0.52, t)), P(lerp(0.38, 0.3, t), lerp(-0.47, -0.42, t))], 'chalk', i % 2 ? cz.neck[1] : cz.neck[0], { w: s * 0.04, p: 0.75 });
      }
      Z.stroke([P(-0.6, -0.36), P(-0.575, -0.225)], 'chalk', cz.tail, { w: s * 0.09, p: 0.95 });
      Z.stroke([P(-0.08, -0.115), P(0.22, -0.15)], 'shade', K.SHD, { w: s * 0.12, p: 0.32 });
      // fine contour feathers on the breast
      for (let i = 0; i < 4; i++) K.hair([P(0.3 - i * 0.04, -0.36 + i * 0.05), P(0.33 - i * 0.04, -0.33 + i * 0.05)], 0.14, { p: 0.4 });
    });
    const wing = Z.spline([P(0.2, -0.5), P(-0.02, -0.525), P(-0.3, -0.445), P(-0.565, -0.32), P(-0.5, -0.252), P(-0.2, -0.242),
      P(0.06, -0.29), P(0.2, -0.39)], true, st);
    K.solid(wing, cz.wing, { w: s * 0.08, ang: f > 0 ? 0.25 : -0.25 });
    Z.withMask(wing, () => {
      Z.stroke([P(-0.36, -0.42), P(-0.53, -0.33), P(-0.49, -0.26)], 'chalk', cz.tip, { w: s * 0.12, p: 0.9 });
      if (cz.bar) for (const u of [-0.06, -0.19]) Z.stroke([P(u + 0.03, -0.505), P(u - 0.005, -0.38), P(u - 0.03, -0.255)], 'chalk', cz.bar, { w: s * 0.04, p: 1 });
      // the coverts in rows of small scallops, then the long flights in fine lines
      for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
        const u = 0.13 - i * 0.075 - r * 0.04, v = -0.47 + r * 0.075;
        K.hair(Z.ellipse(P(u, v)[0], P(u, v)[1], s * 0.032, s * 0.022, 0, 0.2, 2.9), 0.13, { p: 0.4 });
      }
      for (let i = 0; i < 3; i++) K.hair([P(-0.3 - i * 0.04, -0.43 + i * 0.05), P(-0.5 - i * 0.02, -0.33 + i * 0.03)], 0.13, { p: 0.45 });
    });
    K.ink(wing, lw * 0.7, { pull: 40 });
    K.ink(sil, lw, { pull: 50 });
    const E = H(0.345, -0.668), E2 = H(0.4, -0.668);
    eye(Z, K, E, Math.atan2(E2[1] - E[1], E2[0] - E[0]), s, cz);
    const beak = [H(0.43, -0.688), H(0.535, -0.65), H(0.432, -0.628)];
    K.solid(beak, '#4a4048', { w: s * 0.035 });
    K.ink(beak, lw * 0.65, { pull: 20 });
    const cere = H(0.447, -0.674);
    K.dot(cere[0], cere[1], C.limeLit, s * 0.036);
  }
  // coming in to land, braking: the body pitched up, both wings raised over the back in a V, each drawn feather by
  // feather (eight primaries fanned from the hand, six secondaries along the arm, the coverts over them in rows);
  // the tail fanned down, nine feathers with their dark end band; the pink feet reaching down for the cornice
  function doveFly(Z, K, x, y, s, f, cz, lw, st, o) {
    const a = o.tilt != null ? o.tilt : -0.45, ca = Math.cos(a), sa = Math.sin(a);
    const P = (u, v) => { const uu = u * ca - v * sa, vv = u * sa + v * ca; return [x + uu * s * f, y + vv * s]; };
    const PP = q => P(q[0], q[1]);
    // a feather in the body frame: a blade from its quill base along ang, rounded at the end
    const blade = (bu, bv, ang, len, wid) => {
      const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
      const Q = (t, k) => [bu + dx * len * t + px * wid * k, bv + dy * len * t + py * wid * k];
      return { poly: Z.spline([Q(0, -0.5), Q(0.42, -0.56), Q(0.78, -0.46), Q(0.95, -0.24), Q(1, 0), Q(0.95, 0.24), Q(0.78, 0.46), Q(0.42, 0.56), Q(0, 0.5)].map(PP), true, st * 0.6), Q };
    };
    const thin = lw * 0.27;
    // one wing: root in the body frame, its span and forward directions, its size, how dark, how much is shown
    const wingOf = (root, span, Lw, dark) => {
      const sl = Math.hypot(span[0], span[1]), su = span[0] / sl, sv = span[1] / sl, fu = -sv, fv = su;
      const fwd = fu > 0 ? [fu, fv] : [-fu, -fv];
      const WL = (A0, B0) => [root[0] + (su * A0 + fwd[0] * B0) * Lw, root[1] + (sv * A0 + fwd[1] * B0) * Lw];
      const dirOf = phi => { const ax = Math.cos(phi), bx = Math.sin(phi); return Math.atan2(sv * ax + fwd[1] * bx, su * ax + fwd[0] * bx); };
      const tone = c => dark ? Z.mix(c, cz.tip, 0.32) : c;
      // the secondaries, inner first, each with its two dark bars where the coat has them
      for (let i = 5; i >= 0; i--) {
        const t = i / 5, b = WL(lerp(0.08, 0.44, t), -0.01), F = blade(b[0], b[1], dirOf(lerp(-1.55, -1.22, t) + Z.rr(-0.03, 0.03)), lerp(0.25, 0.31, t) * Lw * Z.rr(0.97, 1.03), 0.105 * Lw);
        K.solid(F.poly, tone(Z.mix(cz.wing, cz.tip, 0.12)), { w: s * 0.03, ang: 1.2 });
        Z.withMask(F.poly, () => {
          if (cz.bar && !dark) for (const tb of [0.42, 0.68]) Z.stroke([PP(F.Q(tb, -0.7)), PP(F.Q(tb + 0.03, 0.7))], 'chalk', cz.bar, { w: s * 0.03, p: 1 });
          Z.stroke([PP(F.Q(0.8, -0.6)), PP(F.Q(1, 0)), PP(F.Q(0.8, 0.6))], 'chalk', Z.mix(cz.wing, '#ffffff', 0.35), { w: s * 0.014, p: 0.8 });
        });
        K.ink(F.poly, thin);
      }
      // the primaries fanned from the hand, the outermost laid last, each darker toward its tip with its quill drawn
      const PL = [0.47, 0.54, 0.56, 0.54, 0.5, 0.46, 0.42, 0.37];
      for (let i = 7; i >= 0; i--) {
        const t = i / 7, b = WL(0.5 - t * 0.12, 0.05 - t * 0.12), len = PL[i] * Lw * Z.rr(0.97, 1.03);
        const F = blade(b[0], b[1], dirOf(lerp(0.14, -0.92, t) + Z.rr(-0.025, 0.025)), len, 0.085 * Lw);
        K.solid(F.poly, tone(cz.wing), { w: s * 0.03, ang: 1.2 });
        Z.withMask(F.poly, () => {
          Z.stroke([PP(F.Q(0.45, 0)), PP(F.Q(1.05, 0))], 'chalk', tone(cz.tip), { w: s * 0.06, p: dark ? 0.8 : 0.95 });
          K.hair([PP(F.Q(0.04, 0.05)), PP(F.Q(0.86, 0.04))], 0.1, { p: 0.45 });
        });
        K.ink(F.poly, thin);
      }
      // the coverts over the arm, in two rows of scallops; the leading edge pale
      const cv = Z.spline([[0.02, 0.1], [0.2, 0.14], [0.4, 0.14], [0.52, 0.1], [0.55, 0.03], [0.47, -0.03], [0.33, -0.05], [0.18, -0.055], [0.05, -0.045], [-0.01, 0.02]].map(q => PP(WL(q[0], q[1]))), true, st * 0.6);
      K.solid(cv, tone(cz.wing), { w: s * 0.05, ang: 1.2 });
      Z.withMask(cv, () => {
        Z.stroke([0.04, 0.2, 0.38, 0.5].map(A0 => PP(WL(A0, 0.105 - (A0 > 0.45 ? 0.02 : 0)))), 'chalk', dark ? tone(cz.wing) : Z.mix(cz.wing, '#ffffff', 0.4), { w: s * 0.04, p: 0.85 });
        for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) {
          const c = PP(WL(0.08 + i * 0.09 + r * 0.04, 0.05 - r * 0.06)), ang = Math.atan2(PP(WL(1, 0))[1] - PP(WL(0, 0))[1], PP(WL(1, 0))[0] - PP(WL(0, 0))[0]);
          K.hair(Z.ellipse(c[0], c[1], s * 0.034, s * 0.022, ang, 0.25, 2.9), 0.11, { p: 0.45 });
        }
      });
      K.ink(cv, lw * 0.6);
    };
    // the far wing, darker and turned more upright, behind everything
    wingOf([0.13, -0.53], [0.45, -1], 0.86, true);
    // the tail, fanned: nine feathers from the rump, the upper ones first
    const TB = [-0.3, -0.32], tailC = Math.atan2(0.52, -0.85);
    for (let i = 0; i < 9; i++) {
      const t = i / 8, ang = tailC + lerp(-0.42, 0.46, t) + Z.rr(-0.02, 0.02), len = (0.42 - Math.abs(t - 0.5) * 0.06) * Z.rr(0.97, 1.03);
      const F = blade(TB[0], TB[1], ang, len, 0.11);
      K.solid(F.poly, Z.mix(cz.tail, cz.wing, 0.35), { w: s * 0.03, ang: 0.6 });
      Z.withMask(F.poly, () => {
        Z.stroke([PP(F.Q(0.74, -0.8)), PP(F.Q(0.74, 0.8))], 'chalk', cz.bar || cz.tip, { w: s * 0.05, p: 1 });
        Z.stroke([PP(F.Q(0.94, -0.6)), PP(F.Q(1.02, 0)), PP(F.Q(0.94, 0.6))], 'chalk', Z.mix(cz.wing, '#ffffff', 0.3), { w: s * 0.016, p: 0.8 });
        K.hair([PP(F.Q(0.05, 0)), PP(F.Q(0.66, 0))], 0.09, { p: 0.4 });
      });
      K.ink(F.poly, thin);
    }
    // the feet let down, reaching forward for the ledge, toes spread
    for (const [u, k] of [[0.07, 1], [-0.03, 0.85]]) {
      const pc = Z.mix(C.pink, '#a04050', 1 - k), hip = [u, -0.28], ft = [u + 0.1, -0.1];
      Z.stroke([PP(hip), PP([u + 0.03, -0.19]), PP(ft)], 'chalk', pc, { w: s * 0.032, p: 1 });
      for (const [da, ln] of [[0.55, 0.075], [1.0, 0.085], [1.45, 0.07], [2.7, 0.05]]) {
        const ag = da, tip = [ft[0] + Math.cos(ag) * ln, ft[1] + Math.sin(ag) * ln];
        Z.stroke([PP(ft), PP(tip)], 'chalk', pc, { w: s * 0.02, p: 1 });
        const tp = PP(tip); K.dot(tp[0], tp[1], '#3a2c30', s * 0.012);
      }
    }
    // the body
    const body = Z.spline([[0.39, -0.6], [0.335, -0.718], [0.205, -0.73], [0.135, -0.6], [0.02, -0.5], [-0.2, -0.42], [-0.36, -0.34],
      [-0.35, -0.25], [-0.12, -0.235], [0.12, -0.3], [0.3, -0.4], [0.365, -0.5]].map(PP), true, st);
    K.solid(body, cz.body, { w: s * 0.09 });
    Z.withMask(body, () => {
      for (let i = 0; i < 5; i++) Z.stroke([PP([0.31 - i * 0.022, -0.63 + i * 0.03]), PP([0.28 - i * 0.022, -0.5 + i * 0.028])], 'chalk', i % 2 ? cz.neck[1] : cz.neck[0], { w: s * 0.036, p: 0.75 });
      Z.stroke([PP([0.24, -0.38]), PP([0.0, -0.28])], 'chalk', cz.breast, { w: s * 0.1, p: 0.6 });
      Z.stroke([PP([-0.05, -0.27]), PP([-0.3, -0.29])], 'shade', K.SHD, { w: s * 0.08, p: 0.3 });
      for (let i = 0; i < 4; i++) K.hair([PP([0.26 - i * 0.05, -0.36 + i * 0.02]), PP([0.24 - i * 0.05, -0.32 + i * 0.02])], 0.1, { p: 0.4 });
    });
    K.ink(body, lw);
    // the near wing, raised and swept back over the body
    wingOf([0.02, -0.49], [-0.28, -1], 0.98, false);
    const E = PP([0.29, -0.665]), E2 = PP([0.4, -0.665]);
    eye(Z, K, E, Math.atan2(E2[1] - E[1], E2[0] - E[0]), s * 0.92, cz);
    const beak = [PP([0.37, -0.66]), PP([0.47, -0.625]), PP([0.375, -0.6])];
    K.solid(beak, '#4a4048', { w: s * 0.035 }); K.ink(beak, lw * 0.6);
    const cere = PP([0.385, -0.648]); K.dot(cere[0], cere[1], C.limeLit, s * 0.03);
  }

  /* ------------------------------------------------------------------ the parts, from the foot up */
  function plinth(Z, K, o) {
    const steps = [[54, 0, 52.5, -9.5], [44, -9.5, 42.5, -17.5], [33, -17.5, 31.5, -24.5]];
    steps.forEach(([a, y0, b, y1], i) => {
      const face = trap(a, y0, b, y1 + 2.4), lip = trap(b + 1.2, y1 + 2.4, b + 0.6, y1);
      K.burnish([face, lip]);
      K.solid(face, C.sand, { w: 2.2, ang: 0.04 });
      K.model(face, -a, a, y1, y0, C.sandDeep, C.sandLit, 0.9);
      Z.withMask(face, () => {
        if (i === 0) {
          // a blind arcade cut into the riser, its niches set out by hand along the step
          const n = 11, sp = 94 / (n - 1);
          for (let k = 0; k < n; k++) {
            const x = -47 + k * sp + Z.rr(-0.25, 0.25), ni = cusped(x, y0 - 1.5, 5.2 * Z.rr(0.95, 1.05), 5.6 * Z.rr(0.95, 1.04), 3, 0.32);
            K.solid(ni, Z.mix(C.sandDeep, C.neel, 0.12), { w: 1 });
            Z.outline(ni, 'chalk', Z.mix(C.lime, C.sand, 0.12), { closed: true, w: 0.55, p: 0.85, pull: 30 });
            // a white flower in each spandrel with a gold bead over it
            if (k < n - 1) { const xm = x + sp / 2 + Z.rr(-0.12, 0.12); K.floret(xm, y0 - 4.1, 1.55, C.limeLit, C.haldi); K.goldDot(xm, y0 - 6.35, 0.75); }
          }
          K.hair([[-52.6, y0 - 0.8], [52.6, y0 - 0.8]], 0.15, { p: 0.6 });
        }
        if (i === 1) {
          // between two ruled lines, four-petalled lime flowers round red hearts, a yellow bead between each pair
          const ym = (y0 + y1 + 2.4) / 2;
          K.hair([[-43, y0 - 0.85], [43, y0 - 0.85]], 0.15, { p: 0.6 }); K.hair([[-42.2, y1 + 3.25], [42.2, y1 + 3.25]], 0.15, { p: 0.6 });
          for (let x = -38.4; x <= 38.45; x += 6.4) {
            const xx = x + Z.rr(-0.12, 0.12);
            for (let j = 0; j < 4; j++) { const an = j * PI / 2 + PI / 4 + Z.rr(-0.06, 0.06); Z.dot(xx + Math.cos(an) * 0.9, ym + Math.sin(an) * 0.9, 'chalk', C.limeLit, { w: 1.05 * Z.rr(0.93, 1.06), len: 0.35, ang: an, p: 0.97 }); }
            K.dot(xx, ym, C.hingul, 0.62);
            if (x < 38) K.dot(xx + 3.2, ym + Z.rr(-0.05, 0.05), C.haldi, 0.55);
          }
        }
        if (i === 2) {
          const n = 15;
          for (let k = 0; k < n; k++) {
            const x = -29.4 + k * 58.8 / (n - 1) + Z.rr(-0.15, 0.15), h = 4.7 * Z.rr(0.94, 1.05);
            const pt = Z.spline([[x - 1.95, y0], [x - 1.65, y0 - h * 0.52], [x, y0 - h], [x + 1.65, y0 - h * 0.52], [x + 1.95, y0]], true, 0.35);
            K.solid(pt, C.lime, { w: 0.9 });
            Z.withMask(pt, () => { K.chalk([[x, y0 - h], [x, y0 - h * 0.62]], C.hingul, 1.2, { p: 0.92 }); if (x > 6) Z.fill(R(x, y0 - 6, x + 2.2, y0 + 1), 'shade', K.SH, { w: 1, p: 0.5, passes: 1 }); });
            Z.outline(pt, 'kajal', K.INK, { closed: true, w: 0.3 * KW, p: 0.6, pull: 20 });
            if (k < n - 1) K.dot(x + 2.1, y0 - 0.9, C.limeLit, 0.5);
          }
        }
      });
      K.ink(face, 0.9);
      K.solid(lip, C.lime, { w: 1.3, ang: 0 });
      Z.withMask(lip, () => Z.fill(R(b - 8, y1 - 1, b + 2, y1 + 3), 'shade', K.SH, { w: 1.6, p: 0.5, passes: 1, ang: 0 }));
      K.ink(lip, 0.66);
      K.dots([[-b + 1.5, y1 + 1.35], [b - 1.5, y1 + 1.35]], 2.3, C.hingul, 0.72);
      K.leafLine(o, [[-b, y1 + 0.35], [b, y1 + 0.35]], 0.42);
    });
  }

  function shaft(Z, K, o) {
    const yb = -24.5, yt = -113, hw = y => lerp(11.6, 10, (yb - y) / (yb - yt));
    const body = [[-hw(yb), yb], [hw(yb), yb], [hw(yt), yt], [-hw(yt), yt]];
    K.burnish(body);
    K.solid(body, C.sand, { w: 2, ang: 1.55 });
    const rings = [-25, -50.5, -74, -97.5], rh = 4.4;
    const band = (y0, y1) => [[-hw(y0), y0], [hw(y0), y0], [hw(y1), y1], [-hw(y1), y1]];
    // the four sections: lapis chevrons, a string of pearls on red, red lozenges on lime, two pearl strings on red
    const s1 = band(rings[0] - rh, rings[1]), s3 = band(rings[2] - rh, rings[3]);
    K.solid(s1, C.lapis, { w: 1.6, ang: 1.55 });
    Z.withMask(s1, () => {
      let k = 0;
      for (let y = rings[0] - rh - 3.3; y > rings[1] - 3; y -= 4.5, k++) {
        const dy = Z.rr(-0.12, 0.12);
        K.chalk([[-hw(y) - 1, y + 2.5 + dy], [Z.rr(-0.2, 0.2), y - 1.25 + dy], [hw(y) + 1, y + 2.5 + dy]], C.limeLit, 1.05 * Z.rr(0.94, 1.05), { p: 0.92 });
        K.dots([[-hw(y) + 1.8, y + 3.6 + dy], [-0.4, y + 0.1 + dy]], 2.2, C.haldi, 0.55);
      }
    });
    K.solid(s3, C.lime, { w: 1.6, ang: 1.55 });
    Z.withMask(s3, () => {
      let r = 0;
      for (let y = rings[2] - rh - 1.2; y > rings[3] - 5; y -= 5.4, r++) for (let x = -12; x <= 12; x += 6) {
        const xo = x + (r % 2 ? 3 : 0) + Z.rr(-0.15, 0.15), hh = 2.5 * Z.rr(0.93, 1.06), lz = [[xo, y - hh], [xo + 1.85, y], [xo, y + hh], [xo - 1.85, y]];
        K.solid(lz, C.hingul, { w: 0.8 });
        K.dot(xo, y, C.limeLit, 0.55);
      }
    });
    Z.withMask(band(rings[1] - rh, rings[2]), () => {
      K.dots([[0, rings[1] - rh - 2], [0, rings[2] + 0.6]], 2.55, C.limeLit, 1.45);
      for (const x of [-6, 6]) K.hair([[x, rings[1] - rh - 0.6], [x, rings[2] + 0.4]], 0.2, { p: 0.5 });
    });
    Z.withMask(band(rings[3] - rh, yt), () => { for (const x of [-4.8, 4.8]) K.dots([[x, rings[3] - rh - 1.5], [x, yt + 0.6]], 2.5, C.limeLit, 1.1); });
    K.model(body, -11.6, 11.6, yt, yb, Z.mix(C.sandDeep, C.neel, 0.08), Z.mix(C.limeLit, C.sand, 0.2), 0.6);
    K.ink(body, 1.0);
    // the rings: lime mouldings standing proud of the shaft, rounded, each with its line of red beads
    rings.forEach((y, i) => {
      const w0 = hw(y) + 2.2, top = y - rh;
      const r = Z.spline([[-w0 + 0.6, y], [-w0 - 0.5, y - rh * 0.3], [-w0 - 0.5, y - rh * 0.7], [-w0 + 0.6, top], [w0 - 0.6, top], [w0 + 0.5, y - rh * 0.7], [w0 + 0.5, y - rh * 0.3], [w0 - 0.6, y]], true, 0.45);
      K.burnish(r);
      K.solid(r, C.lime, { w: 1.1, ang: 0 });
      Z.withMask(r, () => {
        Z.fill(R(w0 - 4.5, top - 1, w0 + 1, y + 1), 'shade', K.SH, { w: 1.3, p: 0.6, passes: 1 });
        Z.stroke([[-w0, y - 0.6], [w0, y - 0.6]], 'shade', K.SH, { w: 1.1, p: 0.5 });
        K.chalk([[-w0 + 1, top + 0.9], [w0 - 3, top + 0.9]], C.limeLit, 0.8, { p: 0.7 });
      });
      K.ink(r, 0.6, { pull: 40 });
      if (i === 1 || i === 3) K.leafLine(o, [[-w0 + 1.4, y - rh / 2], [w0 - 1.4, y - rh / 2]], 0.85);
      else K.dots([[-w0 + 1.6, y - rh / 2], [w0 - 1.6, y - rh / 2]], 2.2, C.hingul, 0.85);
    });
  }

  function capital(Z, K, o) {
    // a gold neck ring, then a lotus opening upward under the abacus
    const neck = R(-11.4, -117, 11.4, -113);
    Z.fill(neck, 'gold', 'gold', { w: 1.1, p: 1, passes: 2, reach: 1.5 });
    Z.withMask(neck, () => Z.stroke([[4, -115], [11.4, -115]], 'shade', '#6a4010', { w: 2, p: 0.4 }));
    K.ink(neck, 0.58);
    K.dots([[-10, -115], [10, -115]], 2.2, C.hingul, 0.75);
    const bell = Z.spline([[-10.5, -117], [10.5, -117], [14.5, -121.4], [21, -127.4], [27, -132], [-27, -132], [-21, -127.4], [-14.5, -121.4]], true, 0.6);
    K.burnish([bell, R(-29.5, -137, 29.5, -131.6), R(-11.4, -117, 11.4, -113)]);
    K.solid(bell, C.lime, { w: 1.5 });
    const petal = (x, w, h, lean, inner) => {
      const p = Z.spline([[x - w / 2, -117.2], [x - w * 0.62 + lean * 0.3, -117.2 - h * 0.45], [x + lean, -117.2 - h], [x + w * 0.62 + lean * 0.3, -117.2 - h * 0.45], [x + w / 2, -117.2]], true, 0.35);
      K.solid(p, inner ? Z.mix(C.lime, C.hingul, 0.14) : C.lime, { w: 0.9, ang: 1.5 - lean * 0.08 });
      Z.withMask(p, () => {
        K.chalk([[x + lean * 0.92, -117.2 - h], [x + lean * 0.55, -117.2 - h * 0.58]], C.hingul, w * 0.34, { p: 0.95, tout: 0.5 });
        K.hair([[x + lean * 0.15, -118.5], [x + lean * 0.72, -117.2 - h * 0.78]], 0.16, { p: 0.45 });
        if (x > 2) Z.fill(R(x, -135, x + w, -114), 'shade', K.SH, { w: 1.1, p: 0.45, passes: 1 });
      });
      Z.outline(p, 'kajal', K.INK, { closed: true, w: 0.4 * KW, p: 0.75, pull: 30 });
    };
    for (let i = -3; i <= 3; i++) petal(i * 6.6 + Z.rr(-0.2, 0.2), 7.2 * Z.rr(0.96, 1.04), 13.6 * Z.rr(0.96, 1.03), i * 2.6, true);
    for (let i = -3; i <= 3; i++) if (i) petal(i * 6.6 - Math.sign(i) * 3.3 + Z.rr(-0.15, 0.15), 6.6 * Z.rr(0.96, 1.04), 12 * Z.rr(0.96, 1.04), i * 3.4, false);
    petal(0, 7, 12.4, 0, false);
    K.ink(bell, 0.72);
    const ab = R(-29.5, -137, 29.5, -131.6);
    K.solid(ab, C.lime, { w: 1.3, ang: 0 });
    Z.withMask(ab, () => Z.fill(R(16, -137.5, 30, -131), 'shade', K.SH, { w: 1.3, p: 0.5, passes: 1 }));
    K.dots([[-27, -134.3], [27, -134.3]], 3.2, C.hingul, 1.05);
    K.ink(ab, 0.75);
  }

  // a toda: a curved bracket springing from the end of the abacus out to the edge of the platform, its foot rolled in a
  // volute, a red line down its face, a gold lotus bud hung from its end
  function bracket(Z, K, sg, o) {
    const cl = Z.spline([[sg * 27.5, -136.4], [sg * 33, -139.4], [sg * 44, -143.4], [sg * 57, -146.6], [sg * 70, -149.6]], false, 0.5);
    const rb = ribbon(cl, t => lerp(3.5, 2.0, t));
    K.burnish(rb);
    K.solid(rb, C.lime, { w: 1.2, ang: sg * 0.3 });
    Z.withMask(rb, () => {
      Z.stroke(rb.R.map(p => [p[0], p[1] - 0.2]), 'shade', K.SH, { w: 1.4, p: 0.55 });
      K.chalk(cl.slice(2, -3), C.hingul, 1.25, { p: 0.95 });
      K.dots(cl.slice(4, -5), 2.3, C.limeLit, 0.55);
      // a hairline border inside each edge, and small leaves set either side of the red line, turn and turn about
      const l2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
      K.hair(cl.map((q, i) => l2(q, rb.L[i], 0.72)), 0.12, { p: 0.6 });
      K.hair(cl.map((q, i) => l2(q, rb.R[i], 0.72)), 0.12, { p: 0.6 });
      for (let i = 7, sd = 1; i < cl.length - 7; i += 5, sd = -sd) {
        const a = cl[i - 1], b = cl[i + 1], an = Math.atan2(b[1] - a[1], b[0] - a[0]), q = l2(cl[i], sd > 0 ? rb.L[i] : rb.R[i], 0.42);
        Z.dot(q[0], q[1], 'chalk', (i / 5) % 3 ? C.mal : C.leafL, { w: 0.85 * Z.rr(0.93, 1.06), len: 0.7, ang: an + sd * 0.5 * sg, p: 0.97 });
      }
    });
    K.ink(rb, 0.7, { pull: 60 });
    // the volute under its root
    const vx = sg * 30.4, vy = -134.4, sp = [];
    for (let i = 0; i <= 30; i++) { const t = i / 30, a = PI * 0.5 + sg * t * PI * 1.7, r = lerp(3.2, 0.9, t); sp.push([vx + Math.cos(a) * r * sg, vy + Math.sin(a) * r]); }
    const vol = Z.ellipse(vx, vy, 3.6, 3.4);
    K.solid(vol, C.lime, { w: 1 });
    Z.withMask(vol, () => Z.fill(R(vx - 4, vy, vx + 4, vy + 4), 'shade', K.SH, { w: 1, p: 0.5, passes: 1 }));
    K.ink(vol, 0.55, { pull: 30 });
    K.line(sp, 0.36, { p: 0.75 });
    K.goldDot(vx, vy, 1.0);
    const ex = sg * 68.4, ey = -147.6;
    K.line([[ex, -149.2], [ex, ey + 0.8]], 0.32);
    const bud = Z.spline([[ex - 2, ey], [ex - 1.7, ey + 2.6], [ex, ey + 5.2], [ex + 1.7, ey + 2.6], [ex + 2, ey]], true, 0.35);
    Z.fill(bud, 'gold', 'gold', { w: 0.9, p: 1, passes: 2, reach: 1.5 });
    Z.withMask(bud, () => Z.stroke([[ex + 0.8, ey], [ex + 0.6, ey + 4.4]], 'shade', '#6a4010', { w: 1.2, p: 0.4 }));
    Z.outline(bud, 'kajal', K.INK, { closed: true, w: 0.4 * KW, p: 0.8, pull: 20 });
  }

  function platform(Z, K, o) {
    K.burnish([trap(73, -149.4, 78.5, -153), R(-80.5, -160.5, 80.5, -153)]);
    const under = trap(73, -149.4, 78.5, -153);
    K.solid(under, K.SH, { w: 1.3, ang: 0 });
    K.ink(under, 0.6);
    const slab = R(-80.5, -160.5, 80.5, -153);
    K.solid(slab, C.lime, { w: 1.5, ang: 0, passes: 3 });
    Z.withMask(slab, () => {
      Z.fill(R(56, -161, 81, -152), 'shade', K.SH, { w: 1.5, p: 0.42, passes: 1 });
      K.hair([[-79, -155], [79, -155]], 0.2); K.hair([[-79, -158.7], [79, -158.7]], 0.2);
      // between the two rules, red beads and a gold one at every fifth
      let k = 0;
      for (const q of Z.along([[-77.6, -156.85], [77.6, -156.85]], 3.6, 0)) { if (k++ % 5 === 2) K.goldDot(q.x, q.y, 1.4); else K.dot(q.x + Z.rr(-0.2, 0.2), q.y, C.hingul, 1.1 * Z.rr(0.9, 1.08)); }
    });
    K.ink(slab, 0.82);
    // the jhalar: a fringe of gold beads and red drops on short threads
    let i = 0;
    for (let x = -72; x <= 72.1; x += 6, i++) {
      const xx = x + Z.rr(-0.2, 0.2), len = i % 2 ? 2.4 : 2;
      K.hair([[xx, -149.6], [xx, -149.6 + len]], 0.18);
      if (i % 2) K.goldDot(xx, -146.6, 1.85);
      else {
        const dr = Z.spline([[xx - 1.25, -147.6], [xx - 1.1, -146], [xx, -144], [xx + 1.1, -146], [xx + 1.25, -147.6]], true, 0.3);
        K.solid(dr, C.hingul, { w: 0.7 }); Z.outline(dr, 'kajal', K.INK, { closed: true, w: 0.28 * KW, p: 0.6, pull: 20 });
        K.dot(xx - 0.35, -146.6, C.limeLit, 0.5);
      }
    }
  }

  // a spandrel flower: a red bud on a stem between two leaves
  function sprig(Z, K, x, y, sg) {
    const lean = Z.rr(-0.15, 0.15);
    Z.stroke([[x, y + 2.2], [x + lean, y - 1.6]], 'chalk', C.mal, { w: 0.5, p: 0.9 });
    Z.dot(x - 1.25, y + 0.3, 'chalk', C.mal, { w: 1.05, len: 0.75, ang: 0.75, p: 0.95 });
    Z.dot(x + 1.25, y + 0.1, 'chalk', C.leafL, { w: 1.0, len: 0.7, ang: -0.75, p: 0.95 });
    K.floret(x + lean, y - 2.3, 2.1, C.hingul, C.haldi);
  }

  // a nesting hole: a hingul cusped surround ruled with a fine gold line and a string of white dots, the dark hole with
  // the wall's lip seen inside it, a lime perch under it, a gold drop at the apex
  function hole(Z, K, ax, base, w, h, o) {
    o = o || {};
    w *= Z.rr(0.975, 1.025); h *= Z.rr(0.98, 1.02);
    const sur = cusped(ax, base, w + 6, h + 6, 5, 1.05), mid = cusped(ax, base, w + 3.1, h + 3.1, 5, 0.95), hl = cusped(ax, base, w, h, 5, 0.85);
    K.solid(sur, C.hingul, { w: 1.3 });
    Z.withMask(sur, () => Z.fill(R(ax + w * 0.2, base - h - 8, ax + w, base + 1), 'shade', C.sandDeep, { w: 1.3, p: 0.32, passes: 1 }));
    K.dots(mid.slice(1, -1), 1.95, C.limeLit, 0.78);
    K.ink(sur, 0.58, { pull: 70 });
    if (o.jali) {
      K.solid(hl, C.lapis, { w: 1.1 });
      Z.withMask(hl, () => {
        for (let d = -40; d < 40; d += 2.85) {
          K.chalk([[ax + d, base], [ax + d + h, base - h]], C.limeLit, 0.6, { p: 0.85 });
          K.chalk([[ax + d, base], [ax + d - h, base - h]], C.limeLit, 0.6, { p: 0.85 });
        }
        for (let y = base - 1.42; y > base - h; y -= 2.85) for (let x = ax - w / 2 + ((Math.round((base - y) / 2.85) % 2) ? 1.42 : 0); x < ax + w / 2; x += 2.85) K.dot(x, y, C.haldi, 0.5);
        Z.fill(R(ax + w * 0.15, base - h, ax + w, base), 'shade', C.neel, { w: 1.2, p: 0.3, passes: 1 });
      });
    } else {
      K.solid(hl, C.hole, { w: 1.1, streak: 0.05, passes: 3 });
      Z.withMask(hl, () => {
        // deeper toward the back and the head; the lip of the wall inside the left jamb catching the light
        Z.fill(R(ax - w, base - h - 1, ax + w, base - h * 0.55), 'shade', C.holeDeep, { w: 1.6, p: 0.55, passes: 1, ang: 0 });
        K.chalk(hl.slice(1, 24).map(p => [p[0] + 1.25, p[1] + 1.05]), C.holeLip, 1.7, { p: 0.85 });
        K.chalk([[ax - w / 2 + 1.2, base - 1], [ax - w / 2 + 1.2, base - h * 0.5]], Z.mix(C.holeLip, C.lime, 0.25), 0.9, { p: 0.7 });
      });
    }
    K.hair(hl.slice(0), 0.2);
    K.ink(hl, 0.6, { pull: 70 });
    K.goldDot(ax, base - h - 6.8, 1.55);
    if (!o.noSprig) for (const sg of [-1, 1]) sprig(Z, K, ax + sg * (w / 2 + 4.9), base - h + 0.8, sg);
    if (o.perch !== false) {
      const pr = trap(w / 2 + 3.4, base + 3.8, w / 2 + 4, base, ax);
      K.solid(pr, C.lime, { w: 1, ang: 0 });
      Z.withMask(pr, () => Z.fill(R(ax - 20, base + 1.8, ax + 20, base + 4.2), 'shade', K.SH, { w: 1.1, p: 0.6, passes: 1 }));
      K.ink(pr, 0.55, { pull: 40 });
      K.dots([[ax - w / 2 - 2.2, base + 1.5], [ax + w / 2 + 2.2, base + 1.5]], 2.1, C.hingul, 0.62);
    }
  }

  // a band with flowers on a wavy vine between two ruled edges of white dots, the folio border
  function floretBand(Z, K, x0, y0, x1, y1, c, step) {
    const b = R(x0, y0, x1, y1), ym = (y0 + y1) / 2, hh = Math.abs(y1 - y0);
    K.solid(b, c, { w: 1.3, ang: 0 });
    Z.withMask(b, () => {
      K.dots([[x0, y0 - 1.15], [x1, y0 - 1.15]], 1.9, C.limeLit, 0.62);
      K.dots([[x0, y1 + 1.15], [x1, y1 + 1.15]], 1.9, C.limeLit, 0.62);
      const vine = []; for (let x = x0 - 2; x <= x1 + 2; x += 0.7) vine.push([x, ym + Math.sin((x - x0) / step * PI) * hh * 0.2]);
      K.chalk(vine, Z.mix(C.limeLit, C.mal, 0.12), 0.45, { p: 0.8 });
      let i = 0;
      for (let x = x0 + step / 2; x < x1; x += step, i++) {
        const vy = ym + Math.sin((x - x0) / step * PI) * hh * 0.2;
        K.floret(x + Z.rr(-0.2, 0.2), vy + Z.rr(-0.15, 0.15), hh * 0.33 * Z.rr(0.94, 1.05));
        const lx = x + step * 0.5, ly = ym + Math.sin((lx - x0) / step * PI) * hh * 0.2;
        Z.dot(lx, ly + (i % 2 ? 0.9 : -0.9), 'chalk', C.leafL, { w: hh * 0.13, len: hh * 0.09, ang: i % 2 ? 0.6 : -0.6, p: 0.95 });
      }
    });
    K.ink(b, 0.58, { pull: 120 });
  }

  function lowerStorey(Z, K, o) {
    K.burnish(R(-64, -262, 64, -160.5));
    const W = R(-64, -262, 64, -160.5);
    K.solid(W, C.lime, { w: 2.8, ang: 1.54 });
    K.model(W, -64, 64, -262, -160.5, K.SH, C.limeLit, 0.8);
    // the corner bands: hingul, a gold rule inside, a column of flowers
    for (const sg of [-1, 1]) {
      const x0 = sg < 0 ? -64 : 56, x1 = sg < 0 ? -56 : 64, cb = R(x0, -249, x1, -160.5);
      K.solid(cb, C.hingul, { w: 1.3, ang: 1.5 });
      Z.withMask(cb, () => {
        K.hair([[x0 + 1.1, -248], [x0 + 1.1, -161.5]], 0.18); K.hair([[x1 - 1.1, -248], [x1 - 1.1, -161.5]], 0.18);
        let k = 0; for (let y = -165.6; y > -247; y -= 8.1, k++) { K.floret(sg * 60 + Z.rr(-0.15, 0.15), y + Z.rr(-0.2, 0.2), 2.7 * Z.rr(0.95, 1.05)); if (y - 4 > -247) K.dot(sg * 60, y - 4.05, C.limeLit, 0.75); }
      });
      K.ink(cb, 0.55, { pull: 120 });
    }
    // a ruled border inside the plain lime of each corner, a malachite creeper climbing inside it
    for (const sg of [-1, 1]) {
      const xa = sg < 0 ? -56 : 44.5, xb = sg < 0 ? -44.5 : 56;
      K.rule(xa, -163.5, xb, -246.5, 1.2, Z.mix(C.hingul, C.lime, 0.2), 2.5);
      const vx = (xa + xb) / 2, vine = [];
      for (let y = -167; y > -243; y -= 0.9) vine.push([vx + Math.sin(y / 4.6) * 1.2, y]);
      Z.stroke(vine, 'chalk', C.mal, { w: 0.48, p: 0.85 });
      for (let y = -170.5, i = 0; y > -241; y -= 6.25, i++) {
        const q = [vx + Math.sin(y / 4.6) * 1.2, y], sd = i % 2 ? 1 : -1;
        Z.dot(q[0] + sd * 1.45, q[1] - 0.5, 'chalk', i % 3 ? C.mal : C.leafL, { w: 1.0, len: 0.72, ang: -sd * 0.62, p: 0.95 });
        if (i % 3 === 1) K.floret(q[0] - sd * 1.6, q[1] - 1.3, 1.8, C.hingul, C.haldi);
      }
    }
    // slim lapis pilasters between the columns of holes, each with a tiny base and capital
    for (const x of [-16, 16]) {
      const pl = R(x - 1.95, -245, x + 1.95, -164);
      K.solid(pl, C.lapis, { w: 1, ang: 1.55 });
      Z.withMask(pl, () => K.dots([[x, -166], [x, -244]], 4.1, C.limeLit, 1.05));
      K.ink(pl, 0.45, { pull: 120 });
      for (const [y0, y1] of [[-164, -161.2], [-247.8, -245]]) { const cp = R(x - 3, y1, x + 3, y0); K.solid(cp, C.lime, { w: 0.8, ang: 0 }); K.ink(cp, 0.4, { pull: 20 }); }
    }
    for (const base of [-171, -213]) for (const ax of [-32, 0, 32]) hole(Z, K, ax + Z.rr(-0.2, 0.2), base, 20, 28);
    floretBand(Z, K, -64, -262, 64, -249, C.hingul, 8.6);
    K.leafLine(o, [[-63, -248.6], [63, -248.6]], 0.72);
    K.rule(-64, -160.5, 64, -262, 0.7, null);
    K.ink(W, 1.1, { pull: 160 });
  }

  function balcony(Z, K, o) {
    K.burnish([trap(64, -262, 74.5, -265.4), R(-75, -268.6, 75, -265.4), R(-73, -278.6, 73, -268.6), R(-75.5, -281.4, 75.5, -278.6)]);
    const under = trap(64, -262, 74.5, -265.4);
    K.solid(under, K.SH, { w: 1.1, ang: 0 });
    Z.withMask(under, () => { for (let x = -70; x <= 70.1; x += 5.6) K.hair([[x * 0.9 + Z.rr(-0.1, 0.1), -262.2], [x, -265.2]], 0.24, { p: 0.6 }); });
    K.ink(under, 0.6);
    const lip = R(-75, -268.6, 75, -265.4);
    K.solid(lip, C.lime, { w: 1, ang: 0 });
    Z.withMask(lip, () => Z.fill(R(52, -269, 76, -265), 'shade', K.SH, { w: 1.2, p: 0.45, passes: 1 }));
    K.dots([[-73.5, -267], [73.5, -267]], 2.2, C.hingul, 0.72);
    K.ink(lip, 0.6);
    floretBand(Z, K, -73, -278.6, 73, -268.6, C.lapis, 7.4);
    const cope = R(-75.5, -281.4, 75.5, -278.6);
    K.solid(cope, C.lime, { w: 1, ang: 0 });
    K.ink(cope, 0.64);
    K.leafLine(o, [[-74, -278.9], [74, -278.9]], 0.66);
  }

  function upperStorey(Z, K, o) {
    K.burnish(R(-54, -331, 54, -281.4));
    const W = R(-54, -331, 54, -281.4);
    K.solid(W, C.lime, { w: 2.6, ang: 1.54 });
    K.model(W, -54, 54, -331, -281.4, K.SH, C.limeLit, 0.8);
    for (const sg of [-1, 1]) {
      const x0 = sg < 0 ? -54 : 49.2, x1 = sg < 0 ? -49.2 : 54, cb = R(x0, -317.6, x1, -281.4);
      K.solid(cb, C.hingul, { w: 1.1, ang: 1.5 });
      Z.withMask(cb, () => K.dots([[sg * 51.6, -284.4], [sg * 51.6, -316.6]], 3.3, C.limeLit, 1.1));
      K.ink(cb, 0.5, { pull: 80 });
    }
    // two jali panels flanking a jharokha
    hole(Z, K, -30.5, -285, 17, 25, { jali: true, perch: false, noSprig: true });
    hole(Z, K, 30.5, -285, 17, 25, { jali: true, perch: false, noSprig: true });
    hole(Z, K, 0, -286, 22, 26.5, { perch: false, noSprig: true });
    for (const x of [-15.2, 15.2]) sprig(Z, K, x, -311.4, 1);
    const sill = trap(15.5, -282, 14.2, -286.4);
    K.solid(sill, C.lime, { w: 0.9, ang: 0 }); K.ink(sill, 0.55);
    K.dots([[-12.6, -284.2], [12.6, -284.2]], 3.15, C.hingul, 0.95);
    // the kangura under the eave: red triangles hung point down, a gold bead under each, a white dot inside each
    const kb = R(-54, -331, 54, -318);
    Z.withMask(kb, () => {
      for (let x = -54, i = 0; x < 54; x += 6, i++) {
        const tip = -323.2 + Z.rr(-0.2, 0.2), tri = [[x, -331], [x + 6, -331], [x + 3 + Z.rr(-0.12, 0.12), tip]];
        K.solid(tri, C.hingul, { w: 0.8 }); Z.outline(tri, 'kajal', K.INK, { closed: true, w: 0.28 * KW, p: 0.6, pull: 20 });
        K.dot(x + 3, -328.6, C.limeLit, 0.7);
        K.goldDot(x + 3, tip + 2.1, 1.15);
      }
    });
    K.hair([[-53, -319], [53, -319]], 0.18);
    K.rule(-54, -281.4, 54, -331, 0.7, null);
    K.ink(W, 1.08, { pull: 160 });
  }

  function eave(Z, K, o) {
    K.burnish([trap(54, -331, 84, -337.6), R(-86, -342.4, 86, -337.6)]);
    const under = trap(54, -331, 84, -337.6);
    K.solid(under, K.SH, { w: 1.3, ang: 0 });
    Z.withMask(under, () => {
      Z.fill(R(30, -338, 85, -330), 'shade', K.SHD, { w: 1.4, p: 0.42, passes: 1 });
      for (let x = -78; x <= 78.1; x += 6) K.line([[x * 0.68, -331.2], [x + Z.rr(-0.15, 0.15), -337.2]], 0.36, { p: 0.65 });
    });
    K.ink(under, 0.7);
    const slab = R(-86, -342.4, 86, -337.6);
    K.solid(slab, C.lime, { w: 1.3, ang: 0 });
    Z.withMask(slab, () => {
      Z.fill(R(60, -343, 87, -337), 'shade', K.SH, { w: 1.3, p: 0.48, passes: 1 });
      K.chalk([[-86, -339.4], [86, -339.4]], C.hingul, 1.15, { p: 0.95 });
      K.dots([[-85, -341.1], [85, -341.1]], 2.05, C.limeLit, 0.62);
    });
    K.ink(slab, 0.9, { pull: 160 });
    K.leafLine(o, [[-84.5, -342.2], [84.5, -342.2]], 0.78);
    for (let x = -80; x <= 80.1; x += 10) {
      const xx = x + Z.rr(-0.25, 0.25);
      K.hair([[xx, -337.4], [xx, -335.2]], 0.2);
      const bl = Z.spline([[xx - 1.35, -332.9], [xx - 0.95, -335], [xx, -335.6], [xx + 0.95, -335], [xx + 1.35, -332.9]], true, 0.3);
      Z.fill(bl, 'gold', 'gold', { w: 0.8, p: 1, passes: 2, reach: 1.5 });
      Z.outline(bl, 'kajal', K.INK, { closed: true, w: 0.26 * KW, p: 0.6, pull: 20 });
      K.goldDot(xx, -332.3, 0.7);
    }
  }

  function dome(Z, K, o) {
    K.burnish(R(-41, -348.4, 41, -342.4));
    const drum = R(-41, -348.4, 41, -342.4);
    K.solid(drum, C.lime, { w: 1.1, ang: 0 });
    Z.withMask(drum, () => { Z.fill(R(22, -349, 42, -342), 'shade', K.SH, { w: 1.3, p: 0.5, passes: 1 }); K.dots([[-39.5, -345.2], [39.5, -345.2]], 2.6, C.hingul, 0.9); });
    K.ink(drum, 0.7);
    const by = -348.4, prof = [[42.5, 0], [45.8, 4.2], [45.8, 9.4], [42.8, 17.6], [35.6, 26.6], [25, 34], [12.6, 39], [0, 41.2]];
    const hwAt = v => { for (let i = 1; i < prof.length; i++) if (v <= prof[i][1]) { const a = prof[i - 1], c = prof[i], f = (v - a[1]) / (c[1] - a[1]); return lerp(a[0], c[0], clamp(f, 0, 1)); } return 0; };
    const dp = Z.spline(prof.map(p => [-p[0], by - p[1]]).concat(prof.slice(0, -1).reverse().map(p => [p[0], by - p[1]])), true, 0.6);
    const meridian = (phi, off, v0, v1) => { const pts = []; for (let v = v0 || 0.5; v <= (v1 || 40.8); v += 0.7) pts.push([hwAt(v) * Math.sin(phi) + off, by - v]); return pts; };
    // lime white, each gore laid with strokes that follow it, shaded on its right side; the ribs pale and raised
    K.burnish(dp);
    K.solid(dp, C.lime, { w: 1.8, ang: 1.5 });
    Z.withMask(dp, () => {
      for (let k = -4; k <= 4; k++) Z.stroke(meridian(k * PI / 8.6 + PI / 17.2, 0), 'chalk', Z.mix(C.lime, C.limeLit, 0.5), { w: 2.6, p: 0.45, tin: 0.1, tout: 0.3 });
      Z.stroke(Z.ellipse(17, by - 17, 26, 28, 0, -1.35, 1.65), 'shade', K.SH, { w: 10, p: 0.52 });
      Z.stroke(Z.ellipse(25, by - 14, 20, 20, 0, -1.0, 1.5), 'shade', K.SHD, { w: 5, p: 0.38 });
      Z.stroke(Z.ellipse(-9, by - 23, 25, 16, 0, 3.35, 4.65), 'chalk', C.limeLit, { w: 3.2, p: 0.62, tin: 0.3, tout: 0.3 });
      for (let k = -3; k <= 3; k++) {
        const phi = k * PI / 7.4;
        Z.stroke(meridian(phi, 1.05), 'side', K.SH, { w: 1.9, p: 0.3 + 0.2 * (k + 3) / 6, tin: 0.15, tout: 0.4 });
        K.hair(meridian(phi, 0.35, 1.5, 39.5), 0.2, { p: 0.5 });
        Z.stroke(meridian(phi, -0.25), 'chalk', k < 1 ? C.limeLit : Z.mix(C.lime, K.SH, 0.2), { w: 0.62, p: 0.8, tin: 0.1, tout: 0.4 });
      }
      // a painted band round the shoulder of the dome: a gold rule and a row of red buds
      const band = []; for (let x = -44.6; x <= 44.6; x += 1) band.push([x, by - 8.6 - (1 - Math.pow(x / 46, 2)) * 1.6]);
      Z.stroke(band, 'gold', 'gold', { w: 0.7, p: 1 });
      K.dots(band.map(p => [p[0], p[1] - 2]), 3.1, C.hingul, 0.95);
    });
    K.ink(dp, 1.14, { pull: 160 });
    for (let i = 0; i < 15; i++) {
      const px = -38.4 + i * 5.49 + Z.rr(-0.12, 0.12), h = 5.2 * Z.rr(0.95, 1.05);
      const pt = Z.spline([[px - 2.75, by + 0.2], [px - 2.2, by - h * 0.5], [px, by - h], [px + 2.2, by - h * 0.5], [px + 2.75, by + 0.2]], true, 0.35);
      K.solid(pt, i > 10 ? Z.mix(C.lime, K.SH, 0.45) : C.lime, { w: 0.9 });
      Z.withMask(pt, () => { K.chalk([[px, by - h], [px, by - h * 0.66]], C.hingul, 1.25, { p: 0.95 }); K.hair([[px, by - 0.4], [px, by - h * 0.62]], 0.14, { p: 0.4 }); });
      Z.outline(pt, 'kajal', K.INK, { closed: true, w: 0.34 * KW, p: 0.7, pull: 20 });
    }
    // the finial: an upturned lotus cap, a kalash, a bead, a spike, leafed and burnished
    const top = by - 41.2;
    const goldForm = (poly, w) => {
      Z.fill(poly, 'gold', 'gold', { w: 0.9, p: 1, passes: 2, reach: 1.5 });
      const bb = Z.bbox([poly]);
      Z.withMask(poly, () => { Z.stroke([[bb[2] - (bb[2] - bb[0]) * 0.22, bb[1]], [bb[2] - (bb[2] - bb[0]) * 0.22, bb[3]]], 'shade', '#6a4010', { w: (bb[2] - bb[0]) * 0.4, p: 0.42 }); Z.stroke([[bb[0] + (bb[2] - bb[0]) * 0.3, bb[1] + 0.6], [bb[0] + (bb[2] - bb[0]) * 0.3, bb[3] - 0.6]], 'chalk', '#fff2c4', { w: 0.6, p: 0.6 }); });
      Z.outline(poly, 'kajal', K.INK, { closed: true, w: (w || 0.45) * KW, p: 0.82, pull: 30 });
    };
    goldForm(Z.spline([[-5.2, top + 0.8], [-3, top - 1.9], [0, top - 2.7], [3, top - 1.9], [5.2, top + 0.8]], true, 0.35));
    for (let i = -2; i <= 2; i++) K.hair([[i * 1.6, top + 0.4], [i * 1.9, top - 1.8]], 0.12, { p: 0.5 });
    goldForm(Z.spline([[-1.2, top - 2.5], [-4.1, top - 4.7], [-4.1, top - 7.7], [-1.6, top - 9.5], [1.6, top - 9.5], [4.1, top - 7.7], [4.1, top - 4.7], [1.2, top - 2.5]], true, 0.35));
    o.leafDot(-1.4, top - 6.6, 1.15);
    goldForm(Z.ellipse(0, top - 11.3, 1.95, 1.75), 0.4);
    o.leaf([[0, top - 13], [0, top - 18.8]], 0.95);
    K.line([[0.75, top - 13.2], [0.45, top - 18.4]], 0.28, { p: 0.6 });
    for (const sg of [-1, 1]) {
      const px = sg * 79, stm = R(px - 1.5, -350.4, px + 1.5, -342.4);
      K.solid(stm, C.lime, { w: 0.75 }); K.ink(stm, 0.45, { pull: 30 });
      const bud = Z.spline([[px - 3.2, -350.2], [px - 2.8, -353.6], [px, -356.6], [px + 2.8, -353.6], [px + 3.2, -350.2]], true, 0.35);
      K.solid(bud, C.lime, { w: 0.85 });
      Z.withMask(bud, () => { Z.fill(R(px, -357, px + 4, -350), 'shade', K.SH, { w: 1, p: 0.5, passes: 1 }); K.chalk([[px, -356.4], [px, -354.6]], C.hingul, 1.1, { p: 0.9 }); });
      K.ink(bud, 0.5, { pull: 30 });
      o.leaf([[px, -356.6], [px, -360.6]], 0.7);
    }
  }

  M.w8x['sidekick'] = {
    draw(Z, o) {
      const K = kit(Z);
      plinth(Z, K, o);
      shaft(Z, K, o);
      capital(Z, K, o);
      for (const sg of [-1, 1]) bracket(Z, K, sg, o);
      platform(Z, K, o);
      lowerStorey(Z, K, o);
      balcony(Z, K, o);
      upperStorey(Z, K, o);
      eave(Z, K, o);
      dome(Z, K, o);
      // the doves, each its own bird: in the holes and on the perches, on the eave, one coming in to land by the dome
      dove(Z, K, 33.2, -171.2, 19, { coat: 'grey', flip: true, turn: 0.12 });
      dove(Z, K, -31.2, -213.2, 18.4, { coat: 'white', turn: -0.1, puff: 0.6 });
      dove(Z, K, 0.6, -286.2, 17.2, { coat: 'blue', turn: 0.2 });
      dove(Z, K, -67, -160.6, 19.6, { coat: 'fawn', flip: true, turn: -0.22 });
      dove(Z, K, 68.5, -342.6, 21, { coat: 'grey', flip: true, puff: 1, turn: 0.05 });
      dove(Z, K, -55.5, -342.6, 19.4, { coat: 'white', turn: 0.24 });
      dove(Z, K, -68, -368, 23, { coat: 'blue', pose: 'fly', tilt: -0.45 });
    },
    ground(Z, o) {
      // the shadow pooled at the foot, longest to the right, darkest close in
      Z.fill(Z.ellipse(12, -1.2, 70, 5), 'shade', Z.mix('#6a4a3a', C.neel, 0.2), { w: 4, p: 0.38, passes: 2 });
      Z.fill(Z.ellipse(8, -1, 52, 3.2), 'shade', Z.mix('#5a3a2e', C.neel, 0.2), { w: 3, p: 0.4, passes: 1 });
      // a shallow clay dish of water set down by the plinth
      const dx = 70, dy = -2.4, dish = Z.ellipse(dx, dy, 10, 3.4, 0, 0, PI).concat(Z.ellipse(dx, dy - 1.4, 10.6, 2.6, 0, PI, 2 * PI));
      Z.fill(dish, 'pastel', '#b0563a', { w: 1.4, p: 1, passes: 2, reach: 1.5, ang: 0 });
      const water = Z.ellipse(dx, dy - 1.5, 8.8, 1.9);
      Z.fill(water, 'pastel', Z.mix(C.lapis, '#8ab8c8', 0.45), { w: 1, p: 1, passes: 2, reach: 1.5, ang: 0 });
      Z.stroke([[dx - 5, dy - 1.9], [dx + 1, dy - 2.1]], 'chalk', C.limeLit, { w: 0.6, p: 0.7 });
      const INK = Z.mix('kajal', 'neel', 0.22);
      Z.outline(dish, Z.tool('kajal', { wmin: 0.3 }), INK, { closed: true, w: 0.5 * KW, p: 0.85, pull: 40 });
      Z.outline(water, Z.tool('kajal', { wmin: 0.3 }), INK, { closed: true, w: 0.3 * KW, p: 0.6, pull: 40 });
    }
  };
})();
