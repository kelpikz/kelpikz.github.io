(function () {
  'use strict';
  /* ==========================================================================
     THE BAYS of the gold well (well8k), repainted the folio way.  Part name: bays.
     What fills the openings of the back wall on all five levels:
       M.w8Bay(A, b, kind, P, o)          one bay: the moulded frame, what is inside, the spandrel flowers
                                          kinds: jali, halo, panel, door, jharokha, lamp (and the broken screens)
       M.w8JaliScreen(A, poly, P, o)      a carved stone screen with a counted pierced pattern, a lit cut in every hole
       M.w8Dark(A, op, P, yb)             the dark of an opening, painted flat with a soft fall, a lit reveal
       M.w8Halo(A, cx, cy, r, P, o)       a painted lotus medallion (no rings, no rays of lines)
       M.w8Jharokha(A, x0, x1, yt, yb, P, o)  a marble balcony: lotus-bud brackets, a jali rail, cusped arches, a roof
       M.w8Miniature(A, x0, y0, x1, y1, motif, P, o)  a small painting: mango, elephant, peacock, horse, lotus, deer
       M.w8Rosette, M.w8Flower            small painted flowers
       M.w8Interior(A, xc, ow, yb, ys, ya, o)  the dark room (or the night) seen through an arch behind an object
       M.w8SpoutWall(A, b, R, P, mouths)  the panel the spouts come out of
       hooks M.w8y.iwan and M.w8y.hall    the quiet grounds behind the objects; hall returns the same tie points
     The house method: each shape laid flat in one colour on a burnished ground, one kajal contour in two passes
     (even, then a swell on the side away from the light, which comes from the upper left), then counted ornament.
     Darkness is painted, never textured.  Gold on the wall is matte yellow ochre.  Wall lines are lighter than the
     objects' lines: contours about 0.5 sheet units, hairlines about 0.22.
     ======================================================================== */
  const on = part => { const o = typeof process !== 'undefined' && process.env && process.env.W8Y; return !o || o.split(',').includes(part); };
  if (!on('bays')) return;
  M.w8y = M.w8y || {};

  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const OCHRE = '#d6a535', WHITE = '#fbf4e2';

  // each level's own choices, found from its panel colour (the same in PAL and in the bay palette)
  const LVK = { '#2a4b96': 1, '#3b7f52': 2, '#1d2850': 3, '#7a2a2a': 4, '#17204a': 5 };
  const LEV = {
    1: { pat: 'star8', band: '#b3301e', bandFl: WHITE, bandHt: '#e6b422', sky: '#22397e', pot: '#2a4b96', wood: '#6a2416', woodL: '#8e3a22', sprig: { stem: '#2c5a2a', leaf: '#4f8a3c', fl: WHITE, ht: '#e6b422' }, niche: '#4a2a0e' },
    2: { pat: 'circles', band: '#a8281c', bandFl: WHITE, bandHt: '#e6b422', sky: '#24418a', pot: '#c0302a', wood: '#21503a', woodL: '#336c4e', sprig: { stem: '#b88a2e', leaf: '#d8b456', fl: WHITE, ht: '#c8321c' }, niche: '#4a1e14' },
    3: { pat: 'hex', band: '#d9a637', bandFl: '#b3301e', bandHt: WHITE, sky: '#1b2650', pot: '#d9a637', wood: '#561c18', woodL: '#7a2c22', sprig: { stem: '#3f7a3a', leaf: '#5f9a48', fl: WHITE, ht: '#c8321c' }, niche: '#4a1410' },
    4: { pat: 'diamond', band: '#8c2230', bandFl: WHITE, bandHt: '#e6b422', sky: '#1b2650', pot: '#2c7450', wood: '#4c2814', woodL: '#6c3c1e', sprig: { stem: '#3f7a3a', leaf: '#6aa04a', fl: WHITE, ht: '#e6b422' }, niche: '#143e2a' },
    5: { pat: 'hex', band: '#b3301e', bandFl: WHITE, bandHt: '#e6b422', sky: '#131a40', pot: '#c0302a', wood: '#2c2a52', woodL: '#444272', sprig: { stem: '#3f7a3a', leaf: '#5f9a48', fl: WHITE, ht: '#e8607a' }, niche: '#18204e' }
  };
  const lvOf = P => (P && LVK[P.panel]) || 1;
  const levOf = P => LEV[lvOf(P)];

  // ---------------------------------------------------------------- small geometry
  const circ = (cx, cy, rx, ry, n, rot) => {
    ry = ry == null ? rx : ry; n = n || Math.max(14, Math.ceil(TAU * Math.max(rx, ry) / 0.3)); rot = rot || 0;
    const c = Math.cos(rot), s = Math.sin(rot), out = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; out.push([cx + x * c - y * s, cy + x * s + y * c]); }
    return out;
  };
  const star = (cx, cy, n, R, r, rot) => { const out = []; for (let k = 0; k < 2 * n; k++) { const a = rot - PI / 2 + k * PI / n, q = k % 2 ? r : R; out.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); } return out; };
  const centroid = poly => { let x = 0, y = 0; for (const p of poly) { x += p[0]; y += p[1]; } return [x / poly.length, y / poly.length]; };
  const bbox = poly => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of poly) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } return [x0, y0, x1, y1]; };
  // a closed outline with n soft bumps round an ellipse (a tree's crown, a cloud)
  const scallop = (cx, cy, rx, ry, n, d, ph) => {
    const out = [], m = n * 10; ph = ph || 0;
    for (let i = 0; i < m; i++) { const a = i / m * TAU + ph, b = Math.abs(Math.sin(i / m * n * PI)); const k = 1 - d + d * Math.pow(b, 0.6); out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return out;
  };
  // an almond (a petal, a leaf) from a base point along an angle
  const almond = (x, y, len, wid, ang, tipK) => {
    tipK = tipK == null ? 0.5 : tipK;
    const c = Math.cos(ang), s = Math.sin(ang), P = (u, v) => [x + c * u - s * v, y + s * u + c * v], out = [];
    const n = 14;
    for (let i = 0; i <= n; i++) { const t = i / n, v = wid / 2 * Math.pow(Math.sin(PI * t), tipK) * (1 - 0.25 * t); out.push(P(len * t, v)); }
    for (let i = n - 1; i > 0; i--) { const t = i / n, v = wid / 2 * Math.pow(Math.sin(PI * t), tipK) * (1 - 0.25 * t); out.push(P(len * t, -v)); }
    return out;
  };
  // the part of an arch outline above the springing line, as a closed polygon cut along ys
  const headOf = (arch, ys) => { const pts = arch.slice(1, -1).filter(p => p[1] <= ys + 1e-6); return pts.length > 2 ? pts : null; };

  /* ================================================================ THE KIT
     works on the sheet and on a mapped frame alike (the stage's zoom); widths are sheet units on the sheet */
  function kit(A) {
    const INK = A.mix('kajal', 'neel', 0.12), KJ = A.tool('kajal', { wmin: 0.3 }), TIP = A.tool('chalk', { wmin: 0.14, t0: 0.06 });
    const K = { A, INK, KJ, TIP };
    // every shape is first rubbed in flat (so no paper shows between the strokes as rain), then worked over with
    // the stick in the same colour, so the surface keeps the grain of the hand
    K.flat = (p, c, k, tooth) => K.wash(p, c, () => (k == null ? 1 : k), 'over', tooth == null ? 0.1 : tooth, 0.05, 1);
    K.lay = (p, c, o) => { K.flat(p, c, 0.94); return A.fill(p, 'pastel', c, Object.assign({ w: 1.1, p: 0.9, reach: 1.7, gap: 0.5, passes: 2, ang: -0.5, turn: 0.5, cv: 0.008, streak: 0.08 }, o || {})); };
    // a small shape laid flat: a finer stick, so the edge stays crisp
    K.fill = (p, c, o) => { K.flat(p, c, 1); const b = bbox(p), m = Math.min(b[2] - b[0], b[3] - b[1]); if (m < 1.2 || (o && o.flat)) return; return A.fill(p, 'pastel', c, Object.assign({ w: clamp(m * 0.32, 0.3, 1.1), p: 0.8, reach: 1.7, gap: 0.6, passes: 1, ang: 1.2, turn: 0.5, cv: 0.006, streak: 0.04 }, o || {})); };
    // a dark ground: rubbed flat and deep, then one smooth pass, so no tooth shows through as rain
    K.dark = (p, c) => { K.flat(p, c, 1, 0.06); K.lay(p, c, { w: 0.8, passes: 2, ang: 1.5, streak: 0.02, cv: 0.004 }); };
    // burnish the paper under a surface before it is painted: the crumple is pressed flat, the fine tooth is kept
    K.burnish = polys => {
      const HM = A.HM, W = A.W, H = A.H; if (!HM) return;
      const r = Math.max(2, Math.round(2 * A.S));
      for (const poly of (Array.isArray(polys[0][0]) ? polys : [polys])) {
        const m = A.pushMask(poly, 0); A.popMask();
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
            const i = Y * W + X, v = 0.5 + clamp((HM[i] - mean) * 0.6, -0.15, 0.15);
            HM[i] += (v - HM[i]) * d / 255;
          }
        }
      }
    };
    // a painted wash over a shape, its strength f(x, y) in this frame's own units; 'over' lays the colour, 'mul' glazes
    K.wash = (poly, c, f, mode, tooth, grain, soft) => {
      const B = A.__base || A, inv = A.__z ? A.__z.inv : null;
      const mk = A.pushMask(poly, soft ? undefined : 0); A.popMask();
      if (!mk || !mk.w || !mk.h) return;
      const col = B.col(c), S = B.S, HM = B.HM, tk = tooth == null ? 0.25 : tooth, gr = grain == null ? 0.16 : grain, cl = B.clip();
      for (let y = 0; y < mk.h; y++) {
        const Y = y + mk.y0; if (Y < cl[1] || Y >= cl[3]) continue;
        for (let x = 0; x < mk.w; x++) {
          const v = mk.d[y * mk.w + x]; if (!v) continue;
          const X = x + mk.x0; if (X < cl[0] || X >= cl[2]) continue;
          let px = (X + 0.5) / S, py = (Y + 0.5) / S; if (inv) { const q = inv(px, py); px = q[0]; py = q[1]; }
          let k = v / 255 * f(px, py); if (!(k > 0)) continue;
          const i = Y * B.W + X;
          if (HM && tk) k *= 1 + tk * (HM[i] - 0.5) * 1.3;
          if (gr) { let hh = Math.imul((X >> 1) + 7919, 374761393) ^ Math.imul((Y >> 1) + 104729, 668265263); hh = Math.imul(hh ^ (hh >>> 13), 1274126177); k *= 1 + gr * ((((hh ^ (hh >>> 16)) >>> 0) / 4294967296) - 0.5); }
          k = clamp(k, 0, 1);
          if (mode === 'mul') { B.R[i] *= 1 - k + k * col[0]; B.G[i] *= 1 - k + k * col[1]; B.B[i] *= 1 - k + k * col[2]; }
          else { B.R[i] += (col[0] - B.R[i]) * k; B.G[i] += (col[1] - B.G[i]) * k; B.B[i] += (col[2] - B.B[i]) * k; }
        }
      }
    };
    // the contour in two goes: one even unbroken line, then a pass that swells where the form turns from the light.
    // o.hole: the shape is an opening, so the weight goes to its upper left rim, where the wall throws its shadow in
    K.path = (pts, w, o) => {
      o = o || {};
      const P = A.resample(pts, o.step || 0.28, !!o.closed), n = P.length; if (n < 2) return;
      let cx = o.cx, cy = o.cy; if (cx == null) { const c = centroid(P); cx = c[0]; cy = c[1]; }
      const sg = o.hole ? -1 : 1;
      const sw = P.map((p, i) => {
        const a = o.closed ? P[(i - 2 + n) % n] : P[Math.max(0, i - 2)], b = o.closed ? P[(i + 2) % n] : P[Math.min(n - 1, i + 2)];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
        return clamp((sg * (nx * 0.78 + ny * 0.62) + 0.15) / 0.95, 0, 1);
      });
      const ring = o.closed ? P.concat(P.slice(0, 3)) : P, swr = o.closed ? sw.concat(sw.slice(0, 3)) : sw, c = o.c || INK, pp = o.p || 1;
      const ti = o.closed ? 0 : 0.05;
      A.stroke(ring.map(p => [p[0], p[1]]), KJ, c, { w: w * 0.6, p: pp, tin: ti, tout: ti, wob: 0.22 });
      A.stroke(ring.map((p, i) => [p[0], p[1], 0.42 + 0.58 * swr[i]]), KJ, c, { w, p: pp, tin: ti, tout: ti, wob: 0.22 });
    };
    K.ink = (poly, w, o) => K.path(poly, w || 0.5, Object.assign({ closed: true }, o));
    K.hair = (pts, w, o) => { o = o || {}; A.stroke(pts, KJ, o.c || A.mix(INK, '#f0dcc0', 0.18), Object.assign({ p: 0.78, tin: 0.06, tout: 0.08, wob: 0.3 }, o, { w: w || 0.22 })); };
    K.chalk = (pts, c, w, o) => A.stroke(pts, 'chalk', c, Object.assign({ w: w || 0.4, p: 0.92, tin: 0.08, tout: 0.1, wob: 0.3 }, o || {}));
    K.dot = (x, y, c, w, o) => A.dot(x, y, 'chalk', c, Object.assign({ w: w || 0.5, p: 0.95 }, o || {}));
    // a ruled row of dots along a path, each a hair off in place and size, never a stamp
    K.dots = (path, step, c, w, o) => {
      o = o || {};
      for (const q of A.along(path, step, 0)) {
        if (o.skip && o.skip(q)) continue;
        if (o.ends && (q.i === 0 || q.i === q.n - 1)) continue;
        K.dot(q.x + A.rr(-0.06, 0.06) * step, q.y + A.rr(-0.05, 0.05) * step, c, w * A.rr(0.88, 1.1), { p: A.rr(0.86, 1) });
      }
    };
    // a pointed dab: a leaf or a petal laid in one press of the stick
    K.tip = (x, y, len, wid, ang, c, o) => A.dot(x, y, TIP, c, Object.assign({ w: wid, len: len / 2, ang, p: 0.95, tin: 0.42, tout: 0.42, wob: 0.15 }, o || {}));
    // a flower of n petals round a heart, as the folio borders have them
    K.floret = (x, y, r, petal, heart, n) => {
      n = n || 5; const a0 = A.rr(0, TAU / n);
      for (let i = 0; i < n; i++) {
        const a = a0 + i * TAU / n + A.rr(-0.07, 0.07);
        A.dot(x + Math.cos(a) * r * 0.48, y + Math.sin(a) * r * 0.48, 'chalk', petal, { w: r * 0.6 * A.rr(0.92, 1.06), len: r * 0.16, ang: a, p: 0.97, wob: 0.15 });
      }
      if (heart) K.dot(x, y, heart, r * 0.42);
    };
    return K;
  }

  /* ================================================================ JALI: the pierced stone screens
     The holes of one counted pattern, laid on a grid anchored on the bay's axis so the pattern sits square in it.
     Only whole holes are cut, so a margin of solid stone runs round every field, as a carver would leave it. */
  const PITCH = { star8: [4.0, 0.62], circles: [5.0, 0.66], hex: [3.5, 1.2], diamond: [3.2, 0.62] };
  function jaliHoles(A, pat, bb, ax, ay, p, t, keep) {
    const out = [], jx = () => A.rr(-0.025, 0.025) * p;
    const i0 = Math.floor((bb[0] - ax) / p) - 1, i1 = Math.ceil((bb[2] - ax) / p) + 1, j0 = Math.floor((bb[1] - ay) / p) - 1, j1 = Math.ceil((bb[3] - ay) / p) + 1;
    if (pat === 'star8') {
      // eight-pointed stars, and a small four-pointed star between every four of them
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const R = (p / 2 - t * 0.55) * A.rr(0.98, 1.02);
        out.push(star(ax + i * p + jx(), ay + j * p + jx(), 8, R, R * 0.68, A.rr(-0.02, 0.02)));
        out.push(star(ax + (i + 0.5) * p + jx(), ay + (j + 0.5) * p + jx(), 4, p * 0.2, p * 0.075, A.rr(-0.03, 0.03)));
      }
    } else if (pat === 'circles') {
      // interlocking circles: the stone runs along every circle; the holes are the four-pointed stars at the centres
      // and the almonds where two circles cross
      const R = p / Math.SQRT2, ri = R - t / 2, ro = R + t / 2, cc = p * p - ro * ro;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const gx = ax + i * p, gy = ay + j * p, h = [], m = 48, k = A.rr(0.985, 1.015);
        for (let q = 0; q < m; q++) {
          const a = q / m * TAU, ux = Math.cos(a), uy = Math.sin(a);
          let r = ri;
          for (const [dx, dy] of [[p, 0], [-p, 0], [0, p], [0, -p]]) { const uc = ux * dx + uy * dy, disc = uc * uc - cc; if (uc > 0 && disc > 0) r = Math.min(r, uc - Math.sqrt(disc)); }
          h.push([gx + ux * r * k, gy + uy * r * k]);
        }
        out.push(h);
        const al = Math.acos(clamp((p / 2) / ri, -1, 1));
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const c1 = [gx, gy], c2 = [gx + dx * p, gy + dy * p], base = Math.atan2(dy, dx), ln = [];
          for (let q = 0; q <= 12; q++) { const a = base - al + 2 * al * q / 12; ln.push([c1[0] + Math.cos(a) * ri, c1[1] + Math.sin(a) * ri]); }
          for (let q = 0; q <= 12; q++) { const a = base + PI - al + 2 * al * q / 12; ln.push([c2[0] + Math.cos(a) * ri, c2[1] + Math.sin(a) * ri]); }
          out.push(ln);
        }
      }
    } else if (pat === 'hex') {
      // a honeycomb: pointed-top hexagons with broad stone between them, a small hole drilled where three bars meet;
      // here and there a hole cut a little small, as a hand cuts them
      const rh = (p - t) / 2 / Math.cos(PI / 6), dy = p * Math.sqrt(3) / 2, rv = p / Math.sqrt(3);
      const jj0 = Math.floor((bb[1] - ay) / dy) - 1, jj1 = Math.ceil((bb[3] - ay) / dy) + 1;
      for (let j = jj0; j <= jj1; j++) for (let i = i0; i <= i1; i++) {
        const cx = ax + i * p + ((j % 2 + 2) % 2 ? p / 2 : 0) + jx(), cy = ay + j * dy + jx(), k = rh * (A.chance(0.14) ? A.rr(0.8, 0.9) : A.rr(0.96, 1.03)), h = [];
        for (let q = 0; q < 6; q++) { const a = -PI / 2 + q * PI / 3 + A.rr(-0.02, 0.02); h.push([cx + Math.cos(a) * k, cy + Math.sin(a) * k]); }
        out.push(h);
        const d = [], dr = t * 0.24;
        for (let q = 0; q < 6; q++) { const a = q * PI / 3; d.push([cx + Math.cos(a) * dr, cy - rv + Math.sin(a) * dr]); }
        out.push(d);
      }
    } else {
      // a diamond lattice: the bars cross on the slant
      const hd = p / 2 - t * 0.72;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) for (const [ox, oy] of [[0, 0], [0.5, 0.5]]) {
        const cx = ax + (i + ox) * p + jx(), cy = ay + (j + oy) * p + jx(), k = hd * A.rr(0.97, 1.03);
        out.push([[cx, cy - k * 1.08], [cx + k, cy], [cx, cy + k * 1.08], [cx - k, cy]]);
      }
    }
    if (keep) return out.filter(keep);
    return out.filter(h => { const b = bbox(h); return b[2] > bb[0] && b[0] < bb[2] && b[3] > bb[1] && b[1] < bb[3]; });
  }
  // a fan of wedges spreading up from (cx, cy), crossed by stone rings: a fanlight over a door
  function fanHoles(cx, cy, n, r0, radii, t, a0, a1) {
    const out = [], rs = [r0].concat(radii);
    for (let k = 0; k < n; k++) {
      const a = a0 + (a1 - a0) * k / n, b = a0 + (a1 - a0) * (k + 1) / n;
      for (let s = 0; s < rs.length - 1; s++) {
        const ri = rs[s] + t / 2, ro = rs[s + 1] - t / 2; if (ro - ri < 0.4) continue;
        const pt = (r, an) => [cx + Math.cos(an) * r, cy + Math.sin(an) * r], h = [];
        const di = (t / 2) / ri, dO = (t / 2) / ro; if (a + di >= b - di) continue;
        const m = Math.max(2, Math.ceil((b - a) * ro / 0.5));
        for (let q = 0; q <= m; q++) h.push(pt(ro, a + dO + (b - a - 2 * dO) * q / m));
        const mi = Math.max(1, Math.ceil((b - a) * ri / 0.5));
        for (let q = mi; q >= 0; q--) h.push(pt(ri, a + di + (b - a - 2 * di) * q / mi));
        out.push(h);
      }
    }
    return out;
  }
  // keep a hole only when the whole of it, and a hair of stone round it, lies inside the rectangle
  const inRect = (r, m) => h => h.every(q => q[0] > r[0] + m && q[0] < r[2] - m && q[1] > r[1] + m && q[1] < r[3] - m);
  // the same for any shape: every corner pushed out a little from the hole's middle must still be inside it
  const inPoly = (A, poly, m, also) => h => { const [cx, cy] = centroid(h); return h.every(q => { const dx = q[0] - cx, dy = q[1] - cy, l = Math.hypot(dx, dy) || 1, x = q[0] + dx / l * m, y = q[1] + dy / l * m; return A.inside([poly], x, y) && (!also || also(x, y)); }); };
  // the lit cut: inside every hole, the wall at its lower right faces the light and shows as a sliver of pale stone
  function litEdge(A, poly, c, w, sg) {
    const g = sg || 1, n = poly.length, [cx, cy] = centroid(poly), f = p => { const dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1; return g * (dx * 0.62 + dy * 0.78) / l; };
    let s = 0; while (s < n && f(poly[s]) > 0.2) s++;
    if (s >= n) s = 0;
    let run = [];
    const flush = () => { if (run.length > 1) A.stroke(run, 'chalk', c, { w, p: 0.92, tin: 0.3, tout: 0.3, wob: 0.1 }); run = []; };
    for (let k = 0; k <= n; k++) {
      const p = poly[(s + k) % n];
      if (f(p) > 0.2) { const dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1, d = Math.min(w * 0.5, l * 0.25); run.push([p[0] - dx / l * d, p[1] - dy / l * d]); }
      else flush();
    }
    flush();
  }
  // cut the holes: each laid flat and deep (crisp, no strokes to leave rain), a little warm light low in the room
  // behind, then the lit cut along the lower right of each
  function cutHoles(A, K, P, holes, o) {
    o = o || {};
    if (!holes.length) return;
    // the room behind shows through each hole as a warm dark, painted, never a void
    const stone = P.jali || P.lime || '#e8d4a8', hd = A.mix(P.dark || '#2a1810', '#7a4426', 0.38), lit = A.mix(stone, '#fff8e8', 0.45);
    const lw = o.lw || 0.24;
    if (o.open) {
      // a honeycomb: the bars are broad, so a dark in every opening made the screen heavy.  The room behind is lit
      // here, a warm mid brown; the dark is kept to a thin sliver, the cut wall in shade at the upper left of each
      // hole.  The drilled dots at the nodes stay one tone, a hair deeper.
      const ho = A.mix(P.dark || '#2a1810', '#c0683c', 0.6), big = holes.filter(h => { const q = bbox(h); return q[2] - q[0] > 1; });
      K.flat(holes, ho, 1, 0.04);
      if (o.warm) { const b = o.warm; K.wash(holes, A.mix(ho, '#d89a58', 0.5), (x, y) => 0.4 * sstep((y - b[1]) / (b[3] - b[1]) * 1.4 - 0.4), 'over', 0.08, 0, 1); }
      K.flat(holes.filter(h => !big.includes(h)), A.mix(ho, hd, 0.4), 1, 0.04);
      for (const h of big) litEdge(A, h, A.mix(hd, P.dark || '#2a1810', 0.3), lw * 0.85, -1);
      for (const h of big) litEdge(A, h, lit, lw);
      return;
    }
    K.flat(holes, hd, 1, 0.04);
    if (o.warm) { const b = o.warm; K.wash(holes, A.mix(P.dark || '#2a1810', '#c87a3a', 0.45), (x, y) => 0.55 * sstep((y - b[1]) / (b[3] - b[1]) * 1.4 - 0.4), 'over', 0.08, 0, 1); }
    for (const h of holes) litEdge(A, h, lit, lw);
  }

  /* M.w8JaliScreen(A, poly, P, o): a screen of carved stone filling poly (clipped to it).  o.fine: a small diamond
     lattice (railings, side screens); o.pattern to choose; o.flat: no stone ground laid (the caller has one). */
  M.w8JaliScreen = function (A, poly, P, o) {
    o = o || {};
    const K = kit(A), stone = P.jali || P.lime || '#e8d4a8', b = bbox(poly), w = b[2] - b[0], h = b[3] - b[1];
    const pat = o.pattern || (o.fine ? 'diamond' : levOf(P).pat), pt = PITCH[pat];
    const p = o.fine ? clamp(Math.min(w, h) / 4.5, 1.5, 2.4) : pt[0], t = o.fine ? 0.44 : pt[1];
    A.withMask(poly, () => {
      if (!o.flat) { K.burnish(poly); K.lay(poly, stone, { w: Math.min(1, Math.max(0.5, Math.min(w, h) * 0.2)), ang: 1.45 }); }
      const m = Math.min(w, h) > 8 ? Math.min(1.1, Math.min(w, h) * 0.08) : 0.4, fr = [b[0] + m, b[1] + m, b[2] - m, b[3] - m];
      const holes = jaliHoles(A, pat, fr, (b[0] + b[2]) / 2, b[1] + m + p / 2, p, t, o.fine ? null : inRect(fr, 0.2));
      A.withMask(rect(fr[0], fr[1], fr[2], fr[3]), () => cutHoles(A, K, P, holes, { lw: o.fine ? 0.2 : 0.24, open: pat === 'hex' }));
      if (Math.min(w, h) > 8) K.hair(rect(fr[0], fr[1], fr[2], fr[3]).concat([[fr[0], fr[1]]]), 0.2, { c: A.mix(P.line || '#2c1d12', stone, 0.55), p: 0.7 });
      // the light falls from the upper left, so the screen is shaded under the top and inside the left edge
      K.wash(poly, A.mix(stone, P.stoneDeep || '#6e4010', 0.7), (x, y) => 0.3 * (1 - sstep((x - b[0]) / (w * 0.3 + 1))) + 0.22 * (1 - sstep((y - b[1]) / (h * 0.25 + 1))), 'mul', 0.15, 0.1);
    });
  };

  // a carved flower sunk in the stone: four or eight petals, incised, a boss in the middle
  function incisedFlower(A, K, x, y, r, stone, dark, n) {
    n = n || 4;
    for (let i = 0; i < n; i++) { const a = i * TAU / n + PI / n * (n === 4 ? 1 : 0), pt = petalAt(x, y, r * 0.18, r, a, r * (n === 4 ? 0.26 : 0.16)); K.flat(pt, A.mix(stone, dark, 0.5), 1, 0.1); litEdge(A, pt, A.mix(stone, '#ffffff', 0.45), 0.18); }
    K.dot(x, y, A.mix(stone, '#ffffff', 0.35), r * 0.3);
  }

  // a jali bay: the counted lattice in the head and the body, a carved half lotus over the transom, a carved plinth;
  // perhaps broken
  function jaliBay(A, K, P, g, o) {
    const { op, xc, ys, ya, yb, h } = g, xa = op[0][0], xb = op[op.length - 1][0], ow = xb - xa;
    const lv = levOf(P), stone = P.jali || P.lime, inc = A.mix(P.line, stone, 0.5), [pp, tt] = PITCH[lv.pat];
    K.burnish(op);
    K.lay(op, stone, { w: 1.0, ang: 1.45 });
    const fb = clamp(ow * 0.07, 0.9, 1.4), tY = ys + 0.6, tH = 1.5, plH = Math.min(8.5, h * 0.11);
    const fr = [xa + fb, tY + tH, xb - fb, yb - plH], head = M.w8Arch(xa + fb, xb - fb, tY, tY, ya + fb * 1.7, 0);
    // the body: as many whole rows and columns as fit, centred
    const rows = Math.floor((fr[3] - fr[1] - tt) / pp), oy = fr[1] + ((fr[3] - fr[1]) - rows * pp) / 2 + pp / 2;
    const lat = jaliHoles(A, lv.pat, fr, xc, oy, pp, tt, inRect(fr, 0.25));
    cutHoles(A, K, P, lat, { warm: fr, open: lv.pat === 'hex' });
    // the head: a half lotus of pierced petals on the transom, the lattice round it
    const r1 = Math.min((ow - 2 * fb) * 0.36, (tY - ya) * 0.4), r0 = r1 * 0.34, np = 7, pet = [];
    for (let i = 0; i < np; i++) {
      const a = PI + (i + 0.5) * PI / np, hw = (r0 + r1) / 2 * Math.sin(PI / (2 * np)) * 0.82;
      pet.push(petalAt(xc, tY, r0 + tt * 0.5, r1 - tt * 0.3, a, hw));
    }
    const headLat = jaliHoles(A, lv.pat, bbox(head), xc, oy, pp, tt, inPoly(A, head, 0.35, (x, y) => Math.hypot(x - xc, y - tY) > r1 + tt * 0.9));
    if (lv.pat === 'hex') { cutHoles(A, K, P, pet); cutHoles(A, K, P, headLat, { open: true }); }
    else cutHoles(A, K, P, pet.concat(headLat));
    // the boss at the root of the lotus, its ring, the incised lines that frame the carved fields
    const boss = circ(xc, tY, r0 - tt * 0.15, r0 - tt * 0.15, 32).filter(q => q[1] <= tY + 0.01);
    if (boss.length > 2) {
      K.fill(boss, A.mix(stone, '#ffffff', 0.14), { flat: true });
      K.dots(boss.slice(2, -2).map(q => [xc + (q[0] - xc) * 0.62, tY + (q[1] - tY) * 0.62]), 0.8, A.mix(stone, P.dark, 0.45), 0.26, { ends: true });
      K.hair(boss, 0.2, { c: inc, p: 0.75 });
    }
    const ring = circ(xc, tY, r1 + tt * 0.35, r1 + tt * 0.35, 60).filter(q => q[1] <= tY + 0.01);
    K.hair(ring, 0.18, { c: inc, p: 0.6 });
    K.hair(head.slice(1, -1), 0.2, { c: inc, p: 0.7 });
    K.hair([[fr[0], fr[1]], [fr[2], fr[1]], [fr[2], fr[3]], [fr[0], fr[3]], [fr[0], fr[1]]], 0.2, { c: inc, p: 0.7 });
    K.hair([[xa + fb * 0.6, tY], [xb - fb * 0.6, tY]], 0.2, { c: inc, p: 0.6 });
    // the plinth: a sunk panel with one carved flower
    const pl = rect(xa + fb + 0.8, yb - plH + 1.2, xb - fb - 0.8, yb - 1.4);
    K.wash(pl, A.mix(stone, P.stoneDeep, 0.6), () => 0.2, 'mul', 0.1, 0);
    K.hair([pl[3], pl[0], pl[1]], 0.2, { c: inc, p: 0.8 });
    K.hair([pl[1], pl[2], pl[3]], 0.2, { c: A.mix(stone, '#ffffff', 0.5), p: 0.8 });
    incisedFlower(A, K, xc, yb - plH / 2 - 0.1, Math.min(plH * 0.3, (pl[1][0] - pl[0][0]) * 0.3), stone, P.dark, 4);
    // the screen sits back in the opening: the wall above and to the left throws its shade on it
    const bb = bbox(op);
    K.wash(op, A.mix(stone, P.stoneDeep, 0.75), (x, y) => 0.34 * (1 - sstep((x - bb[0]) / (ow * 0.28))) + 0.2 * (1 - sstep((y - bb[1]) / ((ys - bb[1]) * 0.7 + 1))), 'mul', 0.15, 0.08);
    if (o.broken) brokenScreen(A, K, P, g);
  }
  // a screen that has given way: a ragged hole, the broken bars at its rim, the pieces lying on the sill
  function brokenScreen(A, K, P, g) {
    const { op, xc, ys, yb, w, h } = g, stone = P.jali || P.lime;
    const hx = xc + w * 0.06, hy = ys + h * 0.14, rx = w * 0.2, ry = h * 0.1, ph = A.rr(0, TAU), hole = [];
    for (let i = 0; i < 28; i++) {
      const a = i / 28 * TAU, k = 1 + 0.2 * Math.sin(a * 2 + ph) + 0.12 * Math.sin(a * 5 + ph * 2) + (i % 2 ? 0.1 : -0.08) + A.rr(-0.08, 0.08);
      hole.push([hx + Math.cos(a) * rx * k, hy + Math.sin(a) * ry * k]);
    }
    const dk = A.mix(P.dark || '#2a1810', '#6a3a22', 0.32);
    A.withMask(op, () => {
      K.flat(hole, dk, 1, 0.05);
      // the room behind, a little warmer low down
      const hb = bbox(hole);
      K.wash(hole, A.mix(P.dark || '#2a1810', '#b8743a', 0.45), (x, y) => 0.45 * sstep((y - hb[1]) / (hb[3] - hb[1])), 'over', 0.08, 0, 1);
      // a few stubs of the bars standing into the hole, broken off square
      const [cx, cy] = centroid(hole);
      for (let i = 0; i < 6; i++) {
        const q = hole[(Math.floor(hole.length * (i + 0.4) / 6) + 1) % hole.length], dx = cx - q[0], dy = cy - q[1], l = Math.hypot(dx, dy) || 1, s = A.rr(0.8, 1.5), bw = tt2(P) * 0.5;
        const ux = dx / l, uy = dy / l, a = [q[0] - uy * bw - ux * 0.3, q[1] + ux * bw - uy * 0.3], b2 = [q[0] + uy * bw - ux * 0.3, q[1] - ux * bw - uy * 0.3];
        const c1 = [b2[0] + ux * s, b2[1] + uy * s], c2 = [a[0] + ux * s * A.rr(0.6, 0.9), a[1] + uy * s * A.rr(0.6, 0.9)];
        K.fill([a, b2, c1, c2], stone, { flat: true }); K.hair([b2, c1, c2, a], 0.16, { p: 0.7 });
      }
      // the broken edge: the stone's thickness catches the light along the lower right of the rim
      litEdge(A, hole, A.mix(stone, '#fff8e8', 0.4), 0.45);
      K.ink(hole, 0.3, { hole: true });
    });
    // the pieces on the sill, flat broken slabs with their lit tops
    for (const [u, s, tilt] of [[-0.24, 2.0, 0.25], [-0.05, 1.4, -0.3], [0.2, 2.4, 0.1]]) {
      const cx = xc + u * w, by = yb - 0.5, t = s * 0.55;
      // a broken slab lying on the sill: its lit top, its shaded face, the shade it throws
      const top = [[cx - s, by - t], [cx - s * 0.2, by - t - 0.5 - tilt], [cx + s * 0.9, by - t + tilt * 0.6], [cx + s * 0.5, by - t * 0.5]];
      const face = [[cx - s, by - t], [cx + s * 0.5, by - t * 0.5], [cx + s * 0.9, by - t + tilt * 0.6], [cx + s, by], [cx - s * 0.9, by]];
      K.wash(rect(cx - s * 0.6, by - 0.5, cx + s * 1.6, by + 0.3), '#000000', () => 0.25, 'mul', 0.1, 0, 1);
      K.fill(face, A.mix(stone, P.stoneDeep || '#6a4a2a', 0.35), { flat: true });
      K.fill(top, A.mix(stone, '#ffffff', 0.2), { flat: true });
      // the pierced pattern still shows on the broken piece: two holes
      K.dot(cx - s * 0.2, by - t * 0.4, A.mix(P.dark || '#2a1810', '#000000', 0.2), 0.42); K.dot(cx + s * 0.35, by - t * 0.25, A.mix(P.dark || '#2a1810', '#000000', 0.2), 0.36);
      K.ink(top.concat(face.slice(2)), 0.2, { c: A.mix(K.INK, stone, 0.25) });
    }
  }
  const tt2 = P => PITCH[levOf(P).pat][1];

  /* ================================================================ DARK OPENINGS */
  // the dark of an opening into the stone: flat and deep, deepest in the crown, a little warm light back from the
  // floor, and the right reveal of the wall catching the light that comes in from the upper left
  M.w8Dark = function (A, op, P, yb) {
    const K = kit(A), dark = P.dark || '#2a1810', b = bbox(op), h = b[3] - b[1], w = b[2] - b[0];
    K.burnish(op);
    K.dark(op, dark);
    K.wash(op, A.mix(dark, '#000000', 0.55), (x, y) => 0.6 * (1 - sstep((y - b[1]) / (h * 0.6))), 'over', 0.12, 0.06);
    K.wash(op, A.mix(dark, P.stoneWarm || '#c08040', 0.3), (x, y) => 0.55 * sstep((y - b[1] - h * 0.5) / (h * 0.5)), 'over', 0.12, 0.06);
    // the reveal: the thickness of the wall on the right, lit
    const xc = (b[0] + b[2]) / 2, d = clamp(w * 0.07, 0.6, 2.6), rh = op.slice(1, -1).filter(p => p[0] >= xc - 0.01), yB = op[op.length - 1][1];
    if (rh.length > 3) {
      const band = rh.concat([[rh[rh.length - 1][0], yB]], [[rh[rh.length - 1][0] - d, yB]], rh.slice().reverse().map(p => [p[0] - d, p[1] + d * 0.25]));
      A.withMask(op, () => {
        K.fill(band, A.mix(dark, P.stone || '#a08060', 0.32));
        K.wash(band, A.mix(dark, '#000000', 0.4), (x, y) => 0.5 * (1 - sstep((y - b[1]) / (h * 0.55))), 'over', 0.1, 0);
        K.hair(rh.map(p => [p[0] - d, p[1] + d * 0.25]).concat([[rh[rh.length - 1][0] - d, yB]]), 0.2, { c: A.mix(dark, '#000000', 0.5), p: 0.7 });
      });
    }
  };
  // the warm light of a lamp on a painted wall: two soft rubs, the wider one redder, no ring at its edge
  function glow(K, poly, x, y, rx, ry, k) {
    K.wash(poly, '#b8582a', (px, py) => 0.62 * k * Math.max(0, 1 - Math.hypot((px - x) / rx, (py - y) / ry)) ** 1.4, 'over', 0.15, 0.05);
    K.wash(poly, '#f2b040', (px, py) => 0.62 * k * Math.max(0, 1 - Math.hypot((px - x) / (rx * 0.5), (py - y) / (ry * 0.5))) ** 1.2, 'over', 0.15, 0.05);
  }

  /* ================================================================ FLOWERS, the MEDALLION */
  // a petal shape from the heart outward: base at radius a, tip at radius b
  const petalAt = (cx, cy, a, b, ang, hw) => almond(cx + Math.cos(ang) * a, cy + Math.sin(ang) * a, b - a, hw * 2, ang, 0.7);
  M.w8Rosette = function (A, x, y, r, P) {
    const K = kit(A); r = Math.max(1.1, r);
    const pc = WHITE, ac = P.accent || '#c63d2f', lc = '#4f8a3c', n = 8, a0 = A.rr(0, 0.4);
    // eight white petals with the leaves of the next ring showing between them
    for (let i = 0; i < n; i++) { const a = a0 + (i + 0.5) * TAU / n; K.tip(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.62, r * 0.3, a, lc); }
    if (r > 2.2) {
      for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n + A.rr(-0.04, 0.04), pt = petalAt(x, y, r * 0.18, r * 0.98, a, r * 0.2); K.fill(pt, pc); K.hair(pt.concat([pt[0]]), 0.16, { c: A.mix(P.line || '#2c1d12', pc, 0.35), p: 0.7 }); }
    } else for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n; K.tip(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.85, r * 0.36, a, pc); }
    K.dot(x, y, ac, r * 0.5);
    K.dot(x - r * 0.06, y - r * 0.06, OCHRE, r * 0.22);
  };
  M.w8Flower = function (A, x, y, r, pc, hc, P) {
    const K = kit(A), n = 8, a0 = 0.15 + A.rr(-0.05, 0.05);
    if (r > 2) for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n, pt = petalAt(x, y, r * 0.2, r, a, r * 0.2); K.fill(pt, pc); K.hair(pt.concat([pt[0]]), 0.16, { c: A.mix((P && P.line) || '#2c1d12', pc, 0.4), p: 0.65 }); }
    else for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n; K.tip(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.9, r * 0.36, a, pc); }
    K.dot(x, y, hc, r * 0.48);
    if (P && P.gold) K.dot(x - r * 0.06, y - r * 0.06, OCHRE, r * 0.2);
  };
  /* the medallion painted where light is honoured: a lotus seen from above, two rings of petals and a counted ring of
     dots, all laid flat; o.rays adds a ring of slim pointed tips beyond it, painted, not ruled */
  M.w8Halo = function (A, cx, cy, r, P, o) {
    o = o || {};
    const K = kit(A), gold = OCHRE, ac = P.accent || '#c63d2f', line = A.mix(P.line || '#2c1d12', gold, 0.25);
    const n1 = r > 8 ? 16 : 12, n2 = n1 / 2, a0 = -PI / 2;
    if (o.rays) for (let i = 0; i < n1 * 2; i++) {
      const a = a0 + (i + 0.5) * PI / n1, pt = petalAt(cx, cy, r * 0.94, r * (i % 2 ? 1.16 : 1.3), a, r * 0.035);
      K.fill(pt, A.mix(gold, '#f6dc90', 0.3)); K.hair(pt.concat([pt[0]]), 0.15, { c: line, p: 0.55 });
    }
    for (let i = 0; i < n1; i++) { const a = a0 + i * TAU / n1, pt = petalAt(cx, cy, r * 0.42, r, a, r * 0.13); K.fill(pt, gold); K.ink(pt, 0.2, { c: line }); }
    for (let i = 0; i < n1; i++) { const a = a0 + i * TAU / n1, pt = petalAt(cx, cy, r * 0.5, r * 0.84, a, r * 0.05); K.fill(pt, A.mix(gold, '#f8e4a8', 0.55)); }
    for (let i = 0; i < n2; i++) { const a = a0 + (i + 0.5) * TAU / n2, pt = petalAt(cx, cy, r * 0.16, r * 0.58, a, r * 0.12); K.fill(pt, WHITE); K.ink(pt, 0.18, { c: line }); }
    const hr = r * 0.2;
    K.fill(circ(cx, cy, hr, hr, 24), ac);
    for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + A.rr(-0.05, 0.05); K.dot(cx + Math.cos(a) * hr * 0.62, cy + Math.sin(a) * hr * 0.62, '#f8e2a0', Math.max(0.3, hr * 0.22)); }
    K.dot(cx, cy, '#f8e2a0', Math.max(0.35, hr * 0.4));
    const nd = Math.max(16, Math.round(TAU * r * 1.06 / 1.3));
    for (let i = 0; i < nd; i++) { const a = a0 + i * TAU / nd + A.rr(-0.01, 0.01); K.dot(cx + Math.cos(a) * r * 1.06, cy + Math.sin(a) * r * 1.06, WHITE, Math.max(0.32, r * 0.05)); }
  };

  /* ================================================================ HALO NICHE
     a deep niche painted in the level's niche colour: a painted inner arch with a white dot row, the lotus medallion in
     its head, a flowering sprig on the back wall and the lamp on the sill throwing its light on it */
  // a flowering plant painted on the back of a niche: a tapering stem, branches curling up in three tiers, almond
  // leaves with a vein, flowers seen from the side as a cup of petals over a green calyx; the top flower the largest
  function sprig(A, K, x, yB, yT, wid, S) {
    const H = yB - yT, line = A.mix(K.INK, S.stem, 0.25);
    const leaf = (lx, ly, len, ang) => {
      const lf = almond(lx, ly, len, len * 0.42, ang, 0.8);
      K.fill(lf, S.leaf, { flat: true });
      K.hair([[lx + Math.cos(ang) * len * 0.1, ly + Math.sin(ang) * len * 0.1], [lx + Math.cos(ang) * len * 0.82, ly + Math.sin(ang) * len * 0.82]], 0.14, { c: A.mix(S.leaf, '#ffffff', 0.35), p: 0.7 });
      K.ink(lf, 0.16, { c: line });
    };
    const flower = (fx, fy, r, ang) => {
      ang = ang == null ? -PI / 2 : ang;
      const c = Math.cos(ang), s = Math.sin(ang), at = (u, v) => [fx + c * u - s * v, fy + s * u + c * v];
      const cal = A.spline([at(-0.1 * r, -0.42 * r), at(0.3 * r, -0.5 * r), at(0.36 * r, 0), at(0.3 * r, 0.5 * r), at(-0.1 * r, 0.42 * r), at(-0.4 * r, 0)], true, 0.08);
      // the petals behind, then the ones in front, each its own almond
      for (const [a, l, k] of [[-0.62, 1.0, 0.82], [0.62, 1.0, 0.82], [0, 1.12, 0.9], [-0.3, 1.05, 1], [0.3, 1.05, 1]]) {
        const b = at(0.2 * r, 0), pt = almond(b[0], b[1], r * l, r * 0.5, ang + a, 0.75);
        K.fill(pt, k < 1 ? A.mix(S.fl, S.ht, 0.22) : S.fl, { flat: true });
        K.ink(pt, 0.14, { c: line });
      }
      K.fill(cal, S.leaf, { flat: true }); K.ink(cal, 0.15, { c: line });
      const d = at(0.82 * r, 0); K.dot(d[0], d[1], S.ht, Math.max(0.28, r * 0.16));
    };
    // the stem, tapering, with a little S in it
    const st = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16; st.push([x + Math.sin(t * PI * 1.3) * wid * 0.025, yB - H * t, 1.25 - 0.6 * t]); }
    A.stroke(st, 'chalk', S.stem, { w: Math.max(0.5, wid * 0.045), p: 0.95, tin: 0, tout: 0.15, wob: 0.15 });
    K.hair(st.map(p => [p[0] - Math.max(0.2, wid * 0.02) * p[2], p[1]]), 0.15, { c: line, p: 0.75 });
    // three tiers of branches, each curling up to a flower, a leaf on each branch, pairs of leaves on the stem
    for (let k = 0; k < 3; k++) {
      const t = 0.2 + k * 0.24, by = yB - H * t, reach = wid * (0.38 - k * 0.07);
      for (const sg of [-1, 1]) {
        const br = A.spline([[x, by], [x + sg * reach * 0.5, by - H * 0.02], [x + sg * reach * 0.95, by - H * 0.06], [x + sg * reach, by - H * 0.12]], false, 0.25);
        A.stroke(br.map((p, i) => [p[0], p[1], 1 - 0.4 * i / br.length]), 'chalk', S.stem, { w: Math.max(0.36, wid * 0.03), p: 0.95, tin: 0, tout: 0.2, wob: 0.15 });
        const e = br[br.length - 1];
        const fr = Math.max(1.0, wid * 0.09 * (1 - k * 0.1));
        for (let i = 0; i < 6; i++) { const a = -PI / 2 + i * TAU / 6 + 0.12 * sg, pt = petalAt(e[0], e[1] - fr * 0.2, fr * 0.16, fr, a, fr * 0.24); K.fill(pt, S.fl, { flat: true }); K.ink(pt, 0.13, { c: line }); }
        K.dot(e[0], e[1] - fr * 0.2, S.ht, Math.max(0.3, fr * 0.34));
        const m = br[(br.length * 0.5) | 0];
        leaf(m[0], m[1], wid * 0.16, PI / 2 - sg * (PI / 2 - 0.45));
      }
      leaf(x, by + H * 0.11, wid * 0.14, -PI / 2 - 0.75);
      leaf(x, by + H * 0.11, wid * 0.14, -PI / 2 + 0.75);
    }
    flower(x, yT + wid * 0.08, Math.max(1.2, wid * 0.13), -PI / 2);
  }
  function haloBay(A, K, P, g, o) {
    const { op, xc, ys, ya, yb, w, h } = g, xa = op[0][0], xb = op[op.length - 1][0], ow = xb - xa, lv = levOf(P);
    const gr = P.ground || '#c4301c';
    K.burnish(op);
    K.lay(op, gr, { w: 1.0, ang: 1.45 });
    const bb = bbox(op);
    K.wash(op, A.mix(gr, '#000000', 0.6), (x, y) => 0.55 * (1 - sstep((y - bb[1]) / (h * 0.55))), 'over', 0.12, 0.06);
    const lit = o.lit !== false;
    if (lit) glow(K, op, xc, yb - ow * 0.18, ow * 0.62, h * 0.32, 0.75);
    // the inner arch painted on the back wall: two ochre lines with a white dot row between
    const d = clamp(ow * 0.11, 1.6, 3.2), inner = M.w8Arch(xa + d, xb - d, yb - 0.3, ys + h * 0.02, ya + d * 1.5, ow > 34 ? 9 : 7);
    A.withMask(op, () => {
      K.chalk(inner.slice(1, -1), A.mix(OCHRE, gr, 0.15), 0.3, { tin: 0, tout: 0 });
      const in2 = M.w8Arch(xa + d + 0.9, xb - d - 0.9, yb - 0.3, ys + h * 0.02, ya + d * 1.5 + 1.1, ow > 34 ? 9 : 7);
      K.chalk(in2.slice(1, -1), A.mix(OCHRE, gr, 0.15), 0.24, { tin: 0, tout: 0 });
      const mid = M.w8Arch(xa + d + 0.45, xb - d - 0.45, yb - 0.3, ys + h * 0.02, ya + d * 1.5 + 0.55, ow > 34 ? 9 : 7);
      K.dots(mid.slice(1, -1).filter(p => p[1] < yb - 3), 1.15, WHITE, 0.36);
      // the medallion in the head, the sprig on the wall below it
      const mr = clamp(ow * 0.2, 2.6, 7.5), my = ys - (ys - ya) * 0.24;
      M.w8Halo(A, xc, my, mr, P, {});
      // a pot on the sill behind the lamp, the plant growing out of it
      // the floor of the niche: a ruled line the pot stands on, and below it a cream border of counted flowers
      const fy = yb - clamp(h * 0.032, 2.3, 3.0), bd = rect(xa - 1, fy, xb + 1, yb + 0.6), fm = (fy + yb) / 2 + 0.1;
      K.fill(bd, '#efe0bc', { flat: true });
      K.wash(bd, A.mix(gr, '#000000', 0.3), (x, y) => 0.18 * (1 - sstep((x - xa) / (ow * 0.3))), 'mul', 0.08, 0);
      K.chalk([[xa - 1, fy + 0.42], [xb + 1, fy + 0.42]], OCHRE, 0.2, { tin: 0, tout: 0, p: 0.85 });
      for (let x = xa + 1.0, i = 0; x < xb - 0.6; x += 1.85, i++) {
        if (i % 2) { K.tip(x - 0.32, fm + 0.15, 0.85, 0.34, PI + 0.5, '#3f7a3a'); K.tip(x + 0.32, fm + 0.15, 0.85, 0.34, -0.5, '#3f7a3a'); }
        else K.floret(x, fm + 0.1, 0.62, '#c8321c', '#e6b422', 5);
      }
      K.hair([[xa - 1, fy], [xb + 1, fy]], 0.24, { c: A.mix(K.INK, gr, 0.2), p: 0.9 });
      const pw = ow * 0.15, ph = ow * 0.2, py = fy + 0.15, pc = lv.pot;
      const pot = A.spline([[xc - pw * 0.42, py - ph], [xc + pw * 0.42, py - ph], [xc + pw * 0.3, py - ph * 0.86], [xc + pw * 0.98, py - ph * 0.5], [xc + pw * 0.6, py - ph * 0.08], [xc, py], [xc - pw * 0.6, py - ph * 0.08], [xc - pw * 0.98, py - ph * 0.5], [xc - pw * 0.3, py - ph * 0.86]], true, 0.15);
      sprig(A, K, xc, py - ph * 0.9, my + mr * 1.45 + 1.2, ow * 0.72, lv.sprig);
      K.fill(pot, pc, { flat: true });
      K.wash(pot, '#000000', (x) => 0.35 * sstep((x - xc) / pw + 0.3), 'mul', 0.1, 0);
      A.withMask(pot, () => { K.chalk([[xc - pw, py - ph * 0.5], [xc + pw, py - ph * 0.5]], OCHRE, Math.max(0.5, ph * 0.1), { tin: 0, tout: 0 }); K.dots([[xc - pw, py - ph * 0.33], [xc + pw, py - ph * 0.33]], Math.max(0.8, pw * 0.22), WHITE, 0.28); });
      K.ink(pot, 0.26);
    });
    // the lamp on the floor beside the pot, not in front of it
    M.w8Lamp(A, xc + ow * 0.3, yb - clamp(h * 0.032, 2.3, 3.0) + 0.05, w * 0.14, P, lit);
  }

  // which fanlight each door has, by level, left half and right half of the well: [left, right][level - 1]
  const FANS = [['toran', 'peacock', 'lotus', 'toran', 'lotus'], ['sun', 'lotus', 'peacock', 'sun', 'peacock']];
  // a peacock with his train spread over a door, painted on the stone of the head as on the peacock gates: feathers
  // fanned from his body in two rows, each a green vane with its eye at the end; he stands at the foot of it facing out
  function peacockFan(A, K, xc, y, R, r0, stone, P) {
    const line = A.mix(K.INK, '#1f4a30', 0.2), shaft = A.mix(OCHRE, '#f2e0a0', 0.4);
    for (const [n, rk, vc] of [[17, 1.0, '#2c6e44'], [13, 0.8, '#3f8a52']]) {
      for (let i = 0; i < n; i++) {
        const a = PI + (i + 0.5) * PI / n, rr = R * rk, b0 = r0 * 0.55, hw = rr * Math.sin(PI / (2 * n)) * 1.15;
        const vane = almond(xc + Math.cos(a) * b0, y + Math.sin(a) * b0, rr - b0, hw * 2, a, 0.6);
        K.fill(vane, vc, { flat: true }); K.ink(vane, 0.13, { c: line });
        K.hair([[xc + Math.cos(a) * b0, y + Math.sin(a) * b0], [xc + Math.cos(a) * rr * 0.78, y + Math.sin(a) * rr * 0.78]], 0.12, { c: shaft, p: 0.7 });
        const ex = xc + Math.cos(a) * rr * 0.84, ey = y + Math.sin(a) * rr * 0.84, el = rr * 0.2;
        K.fill(almond(ex - Math.cos(a) * el * 0.5, ey - Math.sin(a) * el * 0.5, el, Math.min(el * 0.8, hw * 1.8), a, 0.9), OCHRE, { flat: true });
        K.fill(almond(ex - Math.cos(a) * el * 0.3, ey - Math.sin(a) * el * 0.3, el * 0.62, Math.min(el * 0.52, hw * 1.2), a, 0.9), '#2a8a7a', { flat: true });
        K.fill(almond(ex - Math.cos(a) * el * 0.15, ey - Math.sin(a) * el * 0.15, el * 0.32, Math.min(el * 0.3, hw * 0.7), a, 0.9), '#16246a', { flat: true });
      }
    }
    // the bird: a blue body standing at the root of the fan, brown wings folded at his sides, a small head and crest
    const bh = r0 * 1.7, bw = r0 * 0.5;
    for (const sg of [-1, 1]) { const wg = A.spline([[xc + sg * bw * 0.4, y - bh * 0.62], [xc + sg * bw * 1.25, y - bh * 0.4], [xc + sg * bw * 1.15, y - 0.1], [xc + sg * bw * 0.5, y - 0.1]], true, 0.1); K.fill(wg, '#8a6a42', { flat: true }); K.ink(wg, 0.15, { c: line }); }
    const body = A.spline([[xc - bw, y], [xc - bw * 0.85, y - bh * 0.42], [xc - bw * 0.32, y - bh * 0.78], [xc - bw * 0.26, y - bh * 0.95], [xc, y - bh * 1.02], [xc + bw * 0.26, y - bh * 0.95], [xc + bw * 0.32, y - bh * 0.78], [xc + bw * 0.85, y - bh * 0.42], [xc + bw, y]], true, 0.12);
    K.fill(body, '#1f58a6', { flat: true });
    K.dots([[xc, y - bh * 0.85], [xc, y - bh * 0.25]], Math.max(0.6, bh * 0.12), '#7ab0e0', 0.22);
    K.ink(body, 0.2, { c: line });
    const hy = y - bh * 1.02;
    for (const sg of [-1, 0, 1]) { const e = [xc + sg * bw * 0.45, hy - bh * 0.32]; K.hair([[xc, hy], e], 0.13, { c: '#1f3a80' }); K.dot(e[0], e[1], '#2a6ac0', 0.34); }
    for (const sg of [-1, 1]) K.dot(xc + sg * bw * 0.16, hy + bh * 0.06, WHITE, 0.24);
    K.chalk([[xc, hy + bh * 0.1], [xc, hy + bh * 0.2]], '#d8b070', 0.22, { tin: 0, tout: 0.5 });
  }
  // a toran: a red cord swagged across the doorway, mango leaves hanging point down from it by turns with marigolds,
  // a short string of marigolds at each end
  function toran(A, K, x0, x1, y, s) {
    const cord = A.spline([[x0, y], [(x0 + x1) / 2, y + s * 1.1], [x1, y]], false, 0.3), qs = A.along(cord, s * 1.15, 0);
    const marigold = (x, yy, r) => { K.dot(x, yy, '#d8701c', r * 1.7); K.floret(x, yy, r * 1.1, '#f0a02a', '#c85a14', 8); };
    qs.forEach((q, i) => {
      if (i === 0 || i === qs.length - 1) return;
      if (i % 2) {
        const a = PI / 2 + A.rr(-0.12, 0.12), c = i % 4 === 1 ? '#3f7a3a' : '#2f6a34', lf = almond(q.x, q.y, s * 2.3, s * 0.9, a, 0.8);
        K.fill(lf, c, { flat: true }); K.hair([[q.x, q.y + 0.1], [q.x + Math.cos(a) * s * 1.8, q.y + Math.sin(a) * s * 1.8]], 0.12, { c: A.mix(c, '#e8f0c0', 0.4), p: 0.7 }); K.ink(lf, 0.14);
      } else marigold(q.x, q.y + s * 0.45, s * 0.42);
    });
    K.chalk(cord, '#c8321c', 0.26, { tin: 0, tout: 0 });
    for (const x of [x0 + 0.2, x1 - 0.2]) for (let k = 0; k < 3; k++) marigold(x, y + s * (0.5 + k * 0.85), s * 0.36);
  }

  /* ================================================================ DOORS
     a pair of painted wooden doors under a fanlight: rails and stiles, sunk panels with an ochre bead, rows of studs,
     a ring on each leaf, a stone sill.  One door in three stands half open on a lamp-lit room. */
  function doorBay(A, K, P, g, o) {
    const { op, xc, ys, ya, yb, w, h } = g, xa = op[0][0], xb = op[op.length - 1][0], ow = xb - xa, lv = levOf(P), stone = P.jali || P.lime;
    const wood = lv.wood, woodL = lv.woodL, woodD = A.mix(wood, '#000000', 0.38), line = A.mix(K.INK, wood, 0.15);
    const open = Math.round(g.x0 * 7.13) % 3 === 0;
    K.burnish(op);
    // the fanlight in the head of the arch: not the same on every door (see FANS)
    K.lay(op, stone, { w: 1.0, ang: 1.45 });
    const lY = ys + 0.4, fb = clamp(ow * 0.05, 0.9, 1.4), hA = ya + fb * 1.6, head = M.w8Arch(xa + fb, xb - fb, lY, lY, hA, 0), r0 = clamp(ow * 0.1, 2.2, 3.6);
    const rOut = Math.min(ow * 0.5 - fb - 0.9, (lY - ya) * 0.78), inc = A.mix(P.line, stone, 0.5), fan = P.matte === false ? 'sun' : FANS[g.x0 < 960 ? 0 : 1][lvOf(P) - 1];
    if (fan === 'sun' || fan === 'lotus') {
      if (fan === 'sun') {
        // the sunburst: wedges in three rings, the outer ring cut short of the arch so a band of solid stone runs round it
        A.withMask(head, () => cutHoles(A, K, P, fanHoles(xc, lY, ow > 40 ? 15 : 13, r0, [r0 + (rOut - r0) * 0.36, r0 + (rOut - r0) * 0.68, rOut], 0.62, PI, TAU)));
      } else {
        // a half lotus pierced in the stone: seven petals, nine beyond them between their tips, a drilled hole in each gap
        const r1 = r0 + (rOut - r0) * 0.5, tt = 0.62, holes = [];
        for (let i = 0; i < 7; i++) { const a = PI + (i + 0.5) * PI / 7; holes.push(petalAt(xc, lY, r0 + tt * 0.6, r1 - tt * 0.3, a, (r0 + r1) / 2 * Math.sin(PI / 14) * 0.9)); }
        for (let i = 0; i < 9; i++) { const a = PI + (i + 0.5) * PI / 9; holes.push(petalAt(xc, lY, r1 + tt * 0.35, rOut, a, (r1 + rOut) / 2 * Math.sin(PI / 18) * 0.86)); }
        for (let i = 1; i < 7; i++) { const a = PI + i * PI / 7, q = [xc + Math.cos(a) * (r1 - tt * 0.5), lY + Math.sin(a) * (r1 - tt * 0.5)]; holes.push(circ(q[0], q[1], 0.36, 0.36, 10)); }
        A.withMask(head, () => cutHoles(A, K, P, holes));
        K.hair(circ(xc, lY, r1 + 0.02, r1 + 0.02, 60).filter(q => q[1] <= lY + 0.01), 0.16, { c: inc, p: 0.5 });
      }
      const boss = circ(xc, lY, r0 - 0.2, r0 - 0.2, 28).filter(q => q[1] <= lY + 0.01);
      K.fill(boss, A.mix(stone, '#ffffff', 0.12), { flat: true }); K.hair(boss, 0.2, { c: inc });
      K.dots(boss.slice(2, -2).map(q => [xc + (q[0] - xc) * 0.6, lY + (q[1] - lY) * 0.6]), 0.8, A.mix(stone, P.dark, 0.45), 0.26, { ends: true });
      K.hair(circ(xc, lY, rOut + 0.35, rOut + 0.35, 80).filter(q => q[1] <= lY + 0.01), 0.18, { c: inc, p: 0.6 });
      // a carved flower in the solid crown over the fan, if there is room
      const crown = lY - rOut - 0.6 - hA;
      if (crown > 3.2) incisedFlower(A, K, xc, hA + crown * 0.58, Math.min(crown * 0.34, ow * 0.08), stone, P.dark, 4);
    } else if (fan === 'peacock') A.withMask(head, () => peacockFan(A, K, xc, lY, rOut + 0.4, r0, stone, P));
    else {
      // a plain head: a cusped blind arch sunk in the stone, shaded under its upper edge, a carved flower at its heart
      const ca = M.w8Arch(xa + fb + 1.3, xb - fb - 1.3, lY - 0.3, lY - 0.31, hA + 1.5, 7);
      K.fill(ca, A.mix(stone, P.stoneDeep || '#8a6a4a', 0.2), { flat: true });
      K.wash(ca, A.mix(stone, P.stoneDeep || '#6a4a2a', 0.7), (x, y) => 0.35 * (1 - sstep((y - hA) / ((lY - hA) * 0.5))), 'mul', 0.08, 0);
      litEdge(A, ca, A.mix(stone, '#fff8e8', 0.5), 0.42);
      K.hair(ca.concat([ca[0]]), 0.2, { c: inc, p: 0.8 });
      incisedFlower(A, K, xc, lY - (lY - hA) * 0.4, Math.min((lY - hA) * 0.26, ow * 0.11), stone, P.dark, 8);
    }
    K.hair(head.slice(1, -1), 0.2, { c: inc, p: 0.7 });
    // the lintel, with a red dot row
    const lin = rect(xa, lY, xb, lY + 1.8);
    K.fill(lin, A.mix(stone, '#ffffff', 0.08)); K.hair([[xa, lY + 1.8], [xb, lY + 1.8]], 0.24);
    K.dots([[xa + 1, lY + 0.9], [xb - 1, lY + 0.9]], 1.25, P.accent || '#c8321c', 0.42, { ends: true });
    // the doorway
    const dy0 = lY + 1.8, dy1 = yb - 1.3, dx0 = xa + 0.4, dx1 = xb - 0.4, dh = dy1 - dy0;
    const leaf = (x0, x1, flipL) => {
      const L = rect(x0, dy0, x1, dy1), lw = x1 - x0;
      K.fill(L, wood, { ang: 1.5 });
      // the sunk panels: top, the tall middle one, the bottom
      const sx = Math.max(1.1, lw * 0.14), rails = [0, 0.2, 0.74, 1].map(t => dy0 + dh * t), pr = Math.max(1.0, dh * 0.035);
      for (let k = 0; k < 3; k++) {
        const pa = rect(x0 + sx, rails[k] + pr, x1 - sx, rails[k + 1] - pr);
        K.fill(pa, A.mix(wood, '#000000', 0.16), { ang: 1.5 });
        // the bevel: shade under the top and left edges, light along the bottom and right
        K.chalk([pa[3], pa[0], pa[1]], woodD, 0.42, { tin: 0, tout: 0 });
        K.chalk([pa[1], pa[2], pa[3]], woodL, 0.3, { tin: 0, tout: 0 });
        const bd = rect(pa[0][0] + 0.75, pa[0][1] + 0.75, pa[1][0] - 0.75, pa[2][1] - 0.75);
        K.chalk(bd.concat([bd[0]]), A.mix(OCHRE, wood, 0.2), 0.22, { tin: 0, tout: 0 });
        if (k === 1) {
          // a painted flower in the middle of the tall panel
          const fx = (x0 + x1) / 2, fy = (rails[1] + rails[2]) / 2, fr = Math.min(lw * 0.2, 2.4);
          for (let i = 0; i < 8; i++) { const a = i * PI / 4; K.tip(fx + Math.cos(a) * fr * 0.55, fy + Math.sin(a) * fr * 0.55, fr * 0.9, fr * 0.36, a, A.mix(OCHRE, '#f6dc90', 0.2)); }
          K.dot(fx, fy, P.accent || '#c8321c', fr * 0.42);
          // the diamond of studs round it
          for (const [ux, uy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { K.dot(fx + ux * fr * 1.7, fy + uy * fr * 2.6, OCHRE, 0.62); K.dot(fx + ux * fr * 1.7 - 0.12, fy + uy * fr * 2.6 - 0.14, '#fff2c0', 0.22); }
        }
      }
      // studs along the rails, counted
      for (const ry of rails) {
        const yy = clamp(ry, dy0 + 0.6, dy1 - 0.6), n = Math.max(3, Math.round((lw - 1.2) / 2.1));
        for (let i = 0; i <= n; i++) { const xx = x0 + 0.7 + (lw - 1.4) * i / n + A.rr(-0.05, 0.05); K.dot(xx, yy, OCHRE, 0.6); K.dot(xx - 0.12, yy - 0.14, '#fff2c0', 0.2); }
      }
      // the ring knocker near the meeting edge
      const kx = flipL ? x0 + lw * 0.2 : x1 - lw * 0.2, ky = dy0 + dh * 0.47;
      K.dot(kx, ky, OCHRE, 0.75);
      A.stroke(circ(kx, ky + 1.1, 0.85, 1.0, 20).concat([[kx + 0.85, ky + 1.1]]), 'chalk', OCHRE, { w: 0.26, p: 0.95, tin: 0, tout: 0 });
      K.ink(L, 0.36, { c: line });
    };
    if (!open) {
      leaf(dx0, xc, false); leaf(xc, dx1, true);
      K.hair([[xc, dy0], [xc, dy1]], 0.3, { c: woodD, p: 0.9 });
    } else {
      // the left leaf swung in: the room behind it, warm with the lamp; the leaf seen nearly edge on
      const room = rect(dx0, dy0, xc, dy1);
      K.dark(room, A.mix(P.dark, '#5a2a14', 0.4));
      glow(K, room, xc - (xc - dx0) * 0.35, dy1 - dh * 0.18, (xc - dx0) * 1.1, dh * 0.6, 1.0);
      K.fill(rect(dx0, dy1 - dh * 0.1, xc, dy1), A.mix(P.dark, '#c0783a', 0.45));
      K.hair([[dx0, dy1 - dh * 0.1], [xc, dy1 - dh * 0.1]], 0.2, { c: A.mix(P.dark, '#000000', 0.3) });
      const ew = Math.max(1.6, (xc - dx0) * 0.2), el = [[dx0, dy0], [dx0 + ew, dy0 + dh * 0.04], [dx0 + ew, dy1 + 0.2], [dx0, dy1]];
      K.fill(el, A.mix(wood, '#e8a050', 0.18));
      for (let k = 1; k < 4; k++) K.dot(dx0 + ew * 0.55, dy0 + dh * k / 4, OCHRE, 0.5);
      K.ink(el, 0.3, { c: line });
      leaf(xc, dx1, true);
    }
    if (fan === 'toran') toran(A, K, xa + 0.5, xb - 0.5, dy0 + 0.1, clamp(ow * 0.045, 0.9, 1.5));
    // the sill
    const sill = rect(xa - 0.4, yb - 1.3, xb + 0.4, yb);
    K.fill(sill, A.mix(P.lime || '#f0e4cc', stone, 0.4), { ang: 0 });
    K.hair([[xa - 0.4, yb - 1.3], [xb + 0.4, yb - 1.3]], 0.26);
    A.withMask(op, () => glow(K, rect(xa, dy0, xb, yb), xc, yb - 2.2, ow * 0.45, dh * 0.32, open ? 0.5 : 0.62));
    M.w8Lamp(A, xc, yb - 0.6, w * 0.2, P, true);
  }

  /* ================================================================ LAMP NICHE: a narrow niche painted in the level's
     deep colour, a lamp on its sill throwing its light up the back of it, a bell hung on a chain from a little bracket */
  function lampBay(A, K, P, g, o) {
    const { op, xc, ys, ya, yb, w, h } = g, xa = op[0][0], xb = op[op.length - 1][0], ow = xb - xa, deep = levOf(P).niche;
    M.w8Dark(A, op, Object.assign({}, P, { dark: deep }), yb);
    A.withMask(op, () => {
      // the back of the niche: a smaller arch, a shade lighter, deepest in its crown
      const bya = ys - h * 0.04, bk = M.w8Arch(xa + ow * 0.2, xb - ow * 0.2, yb - 0.2, ys + h * 0.16, bya, 5);
      K.fill(bk, A.mix(deep, '#f0e0c0', 0.07));
      K.wash(bk, A.mix(deep, '#000000', 0.45), (x, y) => 0.5 * (1 - sstep((y - bya) / (h * 0.45))), 'over', 0.08, 0);
      // the lamp's light: warm on the sill, falling away softly as it climbs the back wall
      glow(K, op, xc, yb - 1.4, ow * 0.62, h * 0.52, 0.8);
      K.wash(op, '#f2b040', (x, y) => { const d = Math.hypot((x - xc) / (ow * 0.5), (y - yb + 1) / (h * 0.62)); return 0.26 * Math.pow(Math.max(0, 1 - d), 1.6); }, 'over', 0.1, 0.04);
      K.path(bk.slice(1, -1), 0.26, { hole: true, cx: xc, cy: ys, c: A.mix(K.INK, deep, 0.3) });
      // the bracket in the crown: a small ochre plate set in the wall, a lotus cup of three petals hanging from it,
      // a ring under that
      const cy0 = ya + (ys - ya) * 0.34, cy1 = ys + h * 0.02, pw = Math.max(1.0, ow * 0.11), br = A.mix(OCHRE, deep, 0.12), brD = A.mix(OCHRE, '#3a1a08', 0.45);
      K.wash(rect(xc - pw * 0.4, cy0 - 0.2, xc + pw * 1.4, cy0 + pw * 1.3), '#000000', (x, y) => 0.3 * Math.max(0, 1 - Math.hypot((x - xc - pw * 0.3) / (pw * 1.1), (y - cy0 - pw * 0.5) / (pw * 0.9))), 'mul', 0.06, 0);
      const plate = rect(xc - pw * 0.62, cy0 - 0.45, xc + pw * 0.62, cy0 + 0.1);
      K.fill(plate, br, { flat: true }); K.ink(plate, 0.18, { c: brD });
      for (const a of [PI / 2 - 0.62, PI / 2 + 0.62, PI / 2]) { const pt = almond(xc, cy0 + 0.05, pw * (a === PI / 2 ? 1.0 : 0.82), pw * 0.5, a, 0.8); K.fill(pt, a === PI / 2 ? A.mix(br, '#fff0c0', 0.25) : br, { flat: true }); K.ink(pt, 0.14, { c: brD }); }
      K.dot(xc - pw * 0.25, cy0 - 0.2, '#fff0c0', 0.24);
      const ry = cy0 + pw * 1.05;
      K.hair(A.ellipse(xc, ry + 0.3, 0.32, 0.36, 0, 0, TAU), 0.2, { c: brD });
      // the chain: links counted down, a ring and a bar by turns
      const cc = A.mix(OCHRE, deep, 0.2);
      for (let y = ry + 0.85, k = 0; y < cy1 - 0.3; y += 0.62, k++) {
        if (k % 2) K.hair([[xc, y - 0.34], [xc, y + 0.34]], 0.22, { c: cc, p: 0.95, tin: 0, tout: 0 });
        else K.hair(A.ellipse(xc, y, 0.17, 0.33, 0, 0, TAU), 0.15, { c: cc, p: 0.95, tin: 0, tout: 0 });
      }
      const bw = Math.max(1.3, ow * 0.13), bell = A.spline([[xc, cy1 - 0.2], [xc + bw * 0.45, cy1 + bw * 0.35], [xc + bw * 0.62, cy1 + bw * 1.15], [xc - bw * 0.62, cy1 + bw * 1.15], [xc - bw * 0.45, cy1 + bw * 0.35]], true, 0.2);
      K.fill(bell, A.mix(OCHRE, deep, 0.15)); K.chalk([[xc - bw * 0.3, cy1 + bw * 0.4], [xc - bw * 0.4, cy1 + bw * 0.95]], '#f2d27a', 0.24);
      K.ink(bell, 0.24);
      K.dot(xc, cy1 + bw * 1.3, A.mix(OCHRE, deep, 0.3), 0.45);
    });
    M.w8Lamp(A, xc, yb - 0.6, w * 0.18, P, true);
  }

  /* ================================================================ JHAROKHA: a marble balcony hung on the wall */
  function parrot(A, K, x, y, s, flip) {
    const T = pts => pts.map(p => [x + (flip ? -p[0] : p[0]) * s, y + p[1] * s]);
    const body = T(A.spline([[0.1, -1.0], [0.26, -1.1], [0.42, -1.02], [0.45, -0.88], [0.36, -0.74], [0.33, -0.52], [0.25, -0.28], [0.11, -0.08], [0.0, 0.0], [-0.07, -0.12], [-0.13, -0.42], [-0.05, -0.74]], true, 0.06));
    const tail = T(A.spline([[0.02, -0.12], [0.08, -0.06], [-0.18, 0.62], [-0.27, 0.7], [-0.17, 0.3]], true, 0.06));
    const wing = T(A.spline([[0.08, -0.74], [0.22, -0.62], [0.2, -0.3], [0.04, -0.08], [-0.08, -0.2], [-0.06, -0.55]], true, 0.06));
    const beak = T(A.spline([[0.42, -1.0], [0.53, -0.95], [0.53, -0.84], [0.46, -0.8], [0.43, -0.88]], true, 0.04));
    K.fill(tail, '#2f8a62'); K.ink(tail, 0.2);
    K.fill(body, '#5cae3e'); K.fill(wing, '#2f7a2c');
    K.ink(body, 0.24);
    K.hair(wing.concat([wing[0]]), 0.17);
    K.fill(beak, '#d8342a'); K.ink(beak, 0.17);
    K.chalk(T([[0.15, -0.86], [0.26, -0.8], [0.38, -0.76]]), '#1a1414', 0.22, { tin: 0.2, tout: 0.2 });
    K.chalk(T([[0.16, -0.83], [0.27, -0.77], [0.36, -0.73]]), '#e8708a', 0.16, { tin: 0.2, tout: 0.2 });
    const e = T([[0.3, -0.95]])[0]; K.dot(e[0], e[1], '#fff4d8', Math.max(0.3, s * 0.13)); K.dot(e[0] + (flip ? -0.03 : 0.03) * s, e[1], '#141010', Math.max(0.22, s * 0.07));
    const f = T([[0.08, 0.02]])[0]; K.dot(f[0], f[1], '#7a7a7a', Math.max(0.25, s * 0.1));
  }
  // a ribbed onion dome on a drum: a white dot row round the drum, a ring of red lotus petals at the neck, a finial
  function smallDome(A, K, xc, db, dw, dh, mar, marD, line, ac) {
    const dr = rect(xc - dw * 0.86, db - dh * 0.14, xc + dw * 0.86, db);
    K.burnish(dr); K.fill(dr, mar, { ang: 0 }); K.wash(dr, marD, (x) => 0.4 * sstep((x - xc) / dw + 0.3), 'mul', 0.1, 0);
    K.dots([[xc - dw * 0.74, db - dh * 0.07], [xc + dw * 0.74, db - dh * 0.07]], 0.95, ac, 0.3);
    K.ink(dr, 0.3, { c: line });
    const b0 = db - dh * 0.14, top = b0 - dh * 0.86;
    const dome = A.spline([[xc - dw * 0.86, b0], [xc - dw * 1.02, b0 - dh * 0.28], [xc - dw * 0.78, b0 - dh * 0.58], [xc - dw * 0.2, top + dh * 0.1], [xc, top], [xc + dw * 0.2, top + dh * 0.1], [xc + dw * 0.78, b0 - dh * 0.58], [xc + dw * 1.02, b0 - dh * 0.28], [xc + dw * 0.86, b0]], true, 0.15);
    K.burnish(dome); K.fill(dome, mar, { ang: 0.2 });
    K.wash(dome, marD, (x) => 0.48 * sstep((x - xc) / dw + 0.25), 'mul', 0.1, 0);
    A.withMask(dome, () => { for (let i = -3; i <= 3; i++) K.hair([[xc + i * dw * 0.27, b0], [xc + i * dw * 0.3, b0 - dh * 0.4], [xc + i * dw * 0.05, top + 0.2]], 0.16, { c: A.mix(line, mar, 0.5), p: 0.55 }); });
    for (let i = 0; i < 9; i++) { const a = PI + (i + 0.5) * PI / 9; K.tip(xc + Math.cos(a) * dw * 0.82, b0 + Math.sin(a) * dh * 0.1, Math.max(0.9, dw * 0.2), Math.max(0.55, dw * 0.11), a, ac); }
    K.ink(dome, 0.34, { c: line });
    return top;
  }
  function finial(A, K, xc, y, fh) {
    if (fh < 1.2) return;
    const fin = A.spline([[xc - 0.5, y + 0.2], [xc - 0.9, y - fh * 0.25], [xc - 0.4, y - fh * 0.45], [xc - 0.7, y - fh * 0.62], [xc, y - fh], [xc + 0.7, y - fh * 0.62], [xc + 0.4, y - fh * 0.45], [xc + 0.9, y - fh * 0.25], [xc + 0.5, y + 0.2]], true, 0.1);
    K.fill(fin, OCHRE, { flat: true }); K.chalk([[xc - 0.35, y - fh * 0.2], [xc - 0.45, y - fh * 0.32]], '#f6dc90', 0.2); K.ink(fin, 0.22);
  }
  /* M.w8Jharokha(A, x0, x1, yt, yb, P, o): the balcony hung on the wall of a bay.  From the top: a finial, a small
     ribbed dome (and on a big one a curved bangla roof under it), the eave, the beam, slim columns with cusped arches
     and the dark room behind them, a jali rail with a coping, the slab with its red band and dot row, and the lotus
     bud brackets that carry it, throwing their shade on the wall. */
  M.w8Jharokha = function (A, x0, x1, yt, yb, P, o) {
    o = o || {};
    const K = kit(A), w = x1 - x0, h = yb - yt, xc = (x0 + x1) / 2, big = w > 56;
    const mar = P.lime || '#f8f0de', marD = A.mix(mar, P.stoneDeep || '#8a6a4a', 0.45), line = A.mix(K.INK, mar, 0.12), ac = P.accent || '#c8321c';
    const bx0 = x0 - w * 0.02, bx1 = x1 + w * 0.02, bw = bx1 - bx0;
    const eY = yt + h * 0.3, sY = yt + h * 0.62, rY = yt + h * 0.74, fY = yt + h * 0.79;
    const lay = (p, c, a) => { K.burnish(p); K.fill(p, c || mar, { ang: a == null ? 1.5 : a }); };
    // the shade of the balcony on the wall under it
    const shade = rect(bx0 + 1, fY, bx1 + 1.2, fY + h * 0.16);
    K.wash(shade, '#000000', (x, y) => 0.28 * (1 - sstep((y - fY) / (h * 0.16))), 'mul', 0.1, 0);
    // the brackets: lotus-bud corbels under the slab, each with its own shade on the wall
    const nb = big ? 5 : 3, bH = h * 0.12, q = Math.min(w * 0.06, 2.8);
    for (let i = 0; i < nb; i++) {
      const fx = bx0 + bw * (0.1 + 0.8 * i / (nb - 1));
      const br = A.spline([[fx - q, fY], [fx + q, fY], [fx + q * 0.95, fY + bH * 0.16], [fx + q * 0.42, fY + bH * 0.34], [fx + q * 0.66, fY + bH * 0.56], [fx + q * 0.5, fY + bH * 0.76], [fx, fY + bH], [fx - q * 0.5, fY + bH * 0.76], [fx - q * 0.66, fY + bH * 0.56], [fx - q * 0.42, fY + bH * 0.34], [fx - q * 0.95, fY + bH * 0.16]], true, 0.12);
      K.wash(br.map(p => [p[0] + 0.9, p[1] + 0.7]), '#000000', () => 0.28, 'mul', 0.1, 0, 1);
      lay(br);
      K.wash(br, marD, (x) => 0.55 * sstep((x - fx) / q + 0.2), 'mul', 0.1, 0);
      K.hair([[fx - q * 0.86, fY + bH * 0.17], [fx + q * 0.86, fY + bH * 0.17]], 0.17, { c: A.mix(line, mar, 0.3) });
      // the bud: two petals drawn on it, a red heart
      K.hair(A.spline([[fx - q * 0.55, fY + bH * 0.56], [fx - q * 0.15, fY + bH * 0.8], [fx, fY + bH * 0.95]], false, 0.15), 0.16, { c: A.mix(line, mar, 0.35) });
      K.hair(A.spline([[fx + q * 0.55, fY + bH * 0.56], [fx + q * 0.15, fY + bH * 0.8], [fx, fY + bH * 0.95]], false, 0.15), 0.16, { c: A.mix(line, mar, 0.35) });
      K.dot(fx, fY + bH * 0.6, ac, Math.max(0.4, q * 0.26));
      K.ink(br, 0.32, { c: line });
    }
    // the dark room behind the columns
    const room = rect(bx0 + 0.5, eY, bx1 - 0.5, sY - 1.3);
    K.burnish(room); K.dark(room, P.dark || '#2a1810');
    K.wash(room, A.mix(P.dark || '#2a1810', '#000000', 0.5), (x, y) => 0.5 * (1 - sstep((y - eY) / ((sY - eY) * 0.7))), 'over', 0.1, 0.04);
    // the slab: a cream face with a red band and a white dot row
    const slab = rect(bx0, rY, bx1, fY);
    lay(slab, mar, 0);
    const bnd = rect(bx0, rY + (fY - rY) * 0.28, bx1, rY + (fY - rY) * 0.74);
    K.fill(bnd, ac, { ang: 0 });
    K.dots([[bx0 + 0.6, (bnd[0][1] + bnd[2][1]) / 2], [bx1 - 0.6, (bnd[0][1] + bnd[2][1]) / 2]], 1.1, WHITE, 0.34);
    K.ink(slab, 0.38, { c: line });
    // the railing: a fine jali between small posts, a coping over it
    const np = big ? 5 : 3, posts = [];
    for (let i = 0; i < np; i++) posts.push(bx0 + 0.9 + (bw - 1.8) * i / (np - 1));
    for (let i = 0; i < np - 1; i++) {
      const pn = rect(posts[i] + 0.7, sY, posts[i + 1] - 0.7, rY);
      M.w8JaliScreen(A, pn, Object.assign({}, P, { jali: mar }), { fine: true });
      K.ink(pn, 0.24, { c: line });
    }
    for (const px of posts) { const pp = rect(px - 0.7, sY - 0.3, px + 0.7, rY); lay(pp); K.ink(pp, 0.24, { c: line }); K.dot(px, (sY + rY) / 2, ac, 0.32); }
    const cop = rect(bx0 - 0.3, sY - 1.3, bx1 + 0.3, sY);
    lay(cop, mar, 0);
    K.dots([[bx0 + 0.5, sY - 0.65], [bx1 - 0.5, sY - 0.65]], 1.15, ac, 0.32);
    K.ink(cop, 0.3, { c: line });
    // the columns and the cusped arches between them, under the beam
    const nc = big ? 4 : 3, cols = [], cw = Math.min(2.4, w * 0.06);
    for (let i = 0; i < nc; i++) cols.push(bx0 + cw * 0.9 + (bw - cw * 1.8) * i / (nc - 1));
    const aY = eY + (sY - 1.3 - eY) * 0.45;
    for (let i = 0; i < nc - 1; i++) {
      const a = cols[i] + cw * 0.32, c = cols[i + 1] - cw * 0.32, arch = M.w8Arch(a, c, aY, aY, eY + 0.9, 5);
      const sp = [[a, eY], [c, eY]].concat(arch.slice(1, -1).reverse());
      lay(sp);
      K.dots(arch.slice(3, -3).map(p => [p[0] + (p[0] < (a + c) / 2 ? -0.5 : 0.5), p[1] - 0.55]), 1.0, ac, 0.28, { ends: true });
      K.path(arch.slice(1, -1), 0.3, { hole: true, cx: (a + c) / 2, cy: aY, c: line });
    }
    for (const cx of cols) {
      const shaft = rect(cx - cw * 0.3, eY + 1.2, cx + cw * 0.3, sY - 2.4);
      lay(shaft); K.wash(shaft, marD, (x) => 0.5 * sstep((x - cx) / (cw * 0.3)), 'mul', 0.1, 0); K.ink(shaft, 0.22, { c: line });
      const cap = A.spline([[cx - cw * 0.6, eY], [cx + cw * 0.6, eY], [cx + cw * 0.38, eY + 1.3], [cx - cw * 0.38, eY + 1.3]], true, 0.2);
      lay(cap); K.ink(cap, 0.22, { c: line });
      const pot = A.spline([[cx - cw * 0.32, sY - 2.5], [cx + cw * 0.32, sY - 2.5], [cx + cw * 0.55, sY - 1.8], [cx + cw * 0.48, sY - 1.3], [cx - cw * 0.48, sY - 1.3], [cx - cw * 0.55, sY - 1.8]], true, 0.2);
      lay(pot); K.ink(pot, 0.22, { c: line });
      K.dot(cx, (eY + sY) / 2 - 1, ac, 0.3);
    }
    // the beam and the eave over it, its shade on the beam
    const beam = rect(bx0, eY - 1.5, bx1, eY);
    lay(beam, mar, 0); K.dots([[bx0 + 0.6, eY - 0.75], [bx1 - 0.6, eY - 0.75]], 1.05, WHITE, 0.28);
    K.wash(beam, marD, () => 0.42, 'mul', 0.1, 0);
    K.ink(beam, 0.28, { c: line });
    const ov = w * 0.07, eT = eY - 1.5 - h * 0.035;
    const eave = [[bx0 - ov, eY - 1.2], [bx1 + ov, eY - 1.2], [bx1 + ov * 0.2, eT], [bx0 - ov * 0.2, eT]];
    lay(eave, A.mix(mar, '#ffffff', 0.2), 0);
    K.dots([[bx0 - ov * 0.5, (eY - 1.2 + eT) / 2 + 0.3], [bx1 + ov * 0.5, (eY - 1.2 + eT) / 2 + 0.3]], 1.1, ac, 0.3, { ends: true });
    K.ink(eave, 0.36, { c: line });
    let topY = eT;
    if (big) {
      // a big jharokha: a curved bangla roof with its ribs under the dome
      const rh = h * 0.08, rx0 = bx0 - ov * 0.1, rx1 = bx1 + ov * 0.1, ridge = [];
      for (let i = 0; i <= 30; i++) { const u = i / 30, x = lerp(rx0, rx1, u), k = Math.pow(Math.sin(PI * u), 0.55); ridge.push([x, eT - rh * k]); }
      const roof = ridge.concat([[rx1, eT], [rx0, eT]]);
      lay(roof, mar, 0.2);
      K.wash(roof, marD, (x) => 0.42 * sstep((x - rx0) / (rx1 - rx0) * 1.4 - 0.4), 'mul', 0.1, 0);
      A.withMask(roof, () => { for (let i = 1; i < 12; i++) { const u = i / 12, x = lerp(rx0, rx1, u); K.hair([[x, eT], [lerp(x, xc, 0.08), eT - rh * Math.pow(Math.sin(PI * u), 0.55) - 0.2]], 0.16, { c: A.mix(line, mar, 0.4), p: 0.6 }); } });
      K.dots([[rx0 + 0.8, eT - 0.55], [rx1 - 0.8, eT - 0.55]], 1.05, ac, 0.3);
      K.ink(roof, 0.38, { c: line });
      topY = eT - rh + 0.6;
    }
    const dw = bw * (big ? 0.15 : 0.26), dh = Math.min(h * (big ? 0.1 : 0.13), topY - yt - 4);
    topY = smallDome(A, K, xc, topY + 0.2, dw, dh, mar, marD, line, ac);
    finial(A, K, xc, topY + 0.3, Math.min(h * 0.06, topY - yt - 0.5));
    if (o.parrots) {
      parrot(A, K, xc - bw * 0.2, sY - 1.3, Math.min(w * 0.13, 5.4), false);
      parrot(A, K, xc + bw * 0.22, sY - 1.3, Math.min(w * 0.125, 5.2), true);
    }
  };
  // the bay of a jharokha: a shallow arched recess in the wall, plain stone, and the balcony hung in it
  function jharokhaBay(A, K, P, g, o) {
    const { op, x0, x1, yt, yb, ys, w, h } = g, rc = A.mix(P.frame || P.lime, P.stoneDeep || '#8a6a4a', 0.2), bb = bbox(op);
    K.burnish(op);
    K.lay(op, rc, { w: 1.1, ang: 1.45 });
    K.wash(op, A.mix(rc, P.stoneDeep || '#6a4a2a', 0.8), (x, y) => 0.4 * (1 - sstep((y - bb[1]) / (h * 0.4))) + 0.18 * (1 - sstep((x - bb[0]) / (w * 0.2))), 'mul', 0.12, 0.05);
    // the courses of the recess, drawn
    const inc = A.mix(P.line, rc, 0.62);
    A.withMask(op, () => { for (let y = yb - 5.5, k = 0; y > ys; y -= 5.5, k++) { K.hair([[bb[0], y], [bb[2], y]], 0.18, { c: inc, p: 0.5 }); for (let x = bb[0] + (k % 2 ? 4 : 0) + 4; x < bb[2]; x += 8) K.hair([[x, y], [x, y + 5.3]], 0.16, { c: inc, p: 0.45 }); } });
    g.edges();
    M.w8Jharokha(A, x0, x1, yt, yb, P, o);
  }

  /* ================================================================ PANEL: a small painting framed in borders
     The border follows the arch: a red band with counted white florets, an ochre line, a kajal hairline; inside it the
     painting, which the stage sends back through M.w8Miniature (at three times its size; drawn here on the sheet). */
  let FIELD = null;    // the arch of the painting being made, for M.w8Miniature
  function panelBay(A, K, P, g, o) {
    const { op, xc, ys, ya, yb, w, h, inset } = g, xa = op[0][0], xb = op[op.length - 1][0], ow = xb - xa, lv = levOf(P), lobes = g.lobes;
    K.burnish(op);
    K.lay(op, lv.band, { w: 1.0, ang: 1.45 });
    const bw = clamp(ow * 0.075, 1.6, 2.4);
    const fp = M.w8Arch(xa + bw, xb - bw, yb - bw * 0.7, ys + bw * 0.25, ya + bw * 1.35, lobes);
    const mid = M.w8Arch(xa + bw * 0.5, xb - bw * 0.5, yb - bw * 0.35, ys + bw * 0.12, ya + bw * 0.68, lobes);
    // florets along the band
    const fl = A.along(mid.slice(1, -1).concat([[xb - bw * 0.5, yb - bw * 0.35], [xa + bw * 0.5, yb - bw * 0.35]]), bw * 1.25, 0);
    for (const q of fl) K.floret(q.x, q.y, bw * 0.3, lv.bandFl, lv.bandHt, 5);
    const fb = bbox(fp);
    FIELD = { x0: fb[0], y0: fb[1], x1: fb[2], y1: fb[3], ys: ys + bw * 0.25, poly: fp };
    A.withMask(fp, () => {
      if (o.paint) o.paint(fb[0], fb[1], fb[2], fb[3]);
      else M.w8Miniature(A, fb[0], fb[1], fb[2], fb[3], o.motif || 'mango', P, o);
    });
    FIELD = null;
    // a ruled white line just inside the painting, a border within the border
    const fi = M.w8Arch(xa + bw + 0.6, xb - bw - 0.6, yb - bw * 0.7 - 0.6, ys + bw * 0.25, ya + bw * 1.35 + 0.75, lobes);
    A.withMask(fp, () => K.chalk(fi.slice(1, -1).concat([fi[fi.length - 1], fi[0], fi[1]]), '#fbf4e2', 0.16, { tin: 0, tout: 0, p: 0.75 }));
    // the painting's own edge: an ochre line and a fine kajal line
    K.chalk(fp.slice(1, -1).concat([fp[fp.length - 1], fp[0], fp[1]]), A.mix(OCHRE, '#f2d27a', 0.2), 0.3, { tin: 0, tout: 0 });
    K.ink(fp, 0.24, { hole: true });
  }

  /* ================================================================ THE SMALL PAINTINGS
     Each is composed as a little folio, in the Mewar manner: a thin strip of sky at the top with one curling cloud,
     a ruled horizon with a row of small far trees, a ground of one colour sown with counted flowers and tufts that
     open out toward the front, a bank of grass along the foot, and the subject standing in it, filling the lower half
     to two thirds of the arch.  Clean shapes, one kajal line, white dot rows on the cloths.  No people.  Widths are
     sheet units: the painting is small, so its lines are the wall's finest. */
  const FIELDC = { mango: '#e2a93a', elephant: '#4c8a42', peacock: '#b13a24', horse: '#25503c', lotus: '#2d7a80', deer: '#efdcb2' };
  // where a level line at y crosses the painting's arch
  function spanAt(F, y) {
    const poly = F.poly; let a = 1e9, b = -1e9;
    for (let i = 0, n = poly.length; i < n; i++) {
      const p = poly[i], q = poly[(i + 1) % n];
      if (p[1] === q[1] || (p[1] - y) * (q[1] - y) > 0) continue;
      const x = p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]);
      if (x < a) a = x; if (x > b) b = x;
    }
    return a < b ? [a, b] : [F.x0, F.x1];
  }
  // a spiral wound in from radius r about (x, y), starting at angle a0
  const spiral = (x, y, r, a0, dir, turns) => { const out = []; for (let i = 0; i <= 28; i++) { const t = i / 28, a = a0 + dir * t * turns * TAU, q = r * (1 - 0.78 * t); out.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); } return out; };
  // a cloud as the painters curl it: a white bank rising in three rolls, a curl where two rolls meet, both ends
  // wound into a scroll, a bluish shade along its foot
  function cloud(A, K, cx, cy, len, ht, sky) {
    const x0 = cx - len / 2, n = 3, m = 42, top = [], bot = [];
    for (let i = 0; i <= m; i++) {
      const t = i / m, env = Math.pow(Math.sin(PI * t), 0.42), bump = Math.pow(Math.abs(Math.sin(PI * n * t)), 0.55);
      top.push([x0 + len * t, cy - ht * (0.16 + 0.84 * env * (0.52 + 0.48 * bump))]);
    }
    for (let i = m; i >= 0; i--) { const t = i / m; bot.push([x0 + len * t, cy + ht * 0.05 * Math.sin(t * PI * 2 + 0.6)]); }
    const body = top.concat(bot), line = A.mix(sky, K.INK, 0.5);
    K.fill(body, '#f8f2e2', { flat: true });
    K.wash(body, A.mix(sky, '#ffffff', 0.5), (x, y) => 0.8 * sstep((y - (cy - ht * 0.42)) / (ht * 0.4)), 'over', 0.06, 0);
    A.withMask(body, () => {
      for (let k = 1; k < n; k++) { const q = top[Math.round(m * k / n)], r = ht * 0.26; K.hair(spiral(q[0], q[1] + r, r, -PI / 2, k % 2 ? 1 : -1, 1.1), 0.13, { c: line, p: 0.75 }); }
      const r = ht * 0.3;
      K.hair(spiral(x0 + r * 1.1, cy - r * 1.05, r, PI, 1, 1.15), 0.13, { c: line, p: 0.75 });
      K.hair(spiral(x0 + len - r * 1.1, cy - r * 1.05, r, 0, -1, 1.15), 0.13, { c: line, p: 0.75 });
    });
    K.ink(body, 0.15, { c: line });
  }
  // the sky: a thin strip of one blue, a little paler at the horizon, one curling cloud; by night stars and a new moon
  function skyStrip(A, K, F, col, o) {
    o = o || {};
    const { x0, x1, y0, skyY, W } = F, sk = rect(x0 - 1, y0 - 1, x1 + 1, skyY + 0.3);
    K.fill(sk, col, { ang: 0.1 });
    K.wash(sk, A.mix(col, '#ffffff', 0.28), (x, y) => 0.5 * sstep((y - y0) / (skyY - y0) * 1.4 - 0.4), 'over', 0.08, 0);
    const sh = skyY - y0, ht = clamp(sh * 0.3, 1.4, 2.6), cy = y0 + sh * 0.7, sp = spanAt(F, cy - ht * 0.6), len = Math.min(W * 0.66, (sp[1] - sp[0]) * 0.8);
    if (o.night) {
      for (let i = 0; i < 9; i++) {
        const y = y0 + sh * (0.32 + 0.6 * ((i * 0.381966 + 0.1) % 1)), s2 = spanAt(F, y), x = s2[0] + 0.8 + (s2[1] - s2[0] - 1.6) * ((i * 0.618034 + 0.2) % 1);
        K.dot(x, y, i % 3 ? '#f2ead0' : '#cfe0f0', i % 4 === 0 ? 0.5 : 0.36);
      }
      const ms = spanAt(F, y0 + sh * 0.45), mx = ms[1] - (ms[1] - ms[0]) * 0.22, my = y0 + sh * 0.42, mr = clamp(sh * 0.12, 0.9, 1.6);
      K.fill(circ(mx, my, mr, mr, 24), '#f6eccc', { flat: true }); K.fill(circ(mx + mr * 0.42, my - mr * 0.2, mr * 0.88, mr * 0.88, 24), col, { flat: true });
      cloud(A, K, (sp[0] + sp[1]) / 2 - len * 0.12, cy + ht * 0.3, len * 0.8, ht * 0.85, col);
    } else cloud(A, K, (sp[0] + sp[1]) / 2 + A.rr(-0.06, 0.06) * len, cy + ht * 0.3, len, ht, col);
  }
  // the horizon: a ruled line and a counted row of small far trees standing on it
  function horizon(A, K, F, greens) {
    const y = F.skyY, sp = spanAt(F, y - 0.6), w = sp[1] - sp[0], n = Math.max(3, Math.round(w / 2.5));
    for (let i = 0; i < n; i++) {
      const x = sp[0] + w * (i + 0.5) / n + A.rr(-0.15, 0.15), r = (i % 3 === 1 ? 0.78 : 0.98) * A.rr(0.94, 1.05), c = greens[i % 2];
      const cr = scallop(x, y - r * 0.95, r * 0.9, r, 7, 0.14, A.rr(0, 1));
      K.chalk([[x, y + 0.1], [x, y - r * 0.4]], '#5a3a1e', 0.2, { tin: 0, tout: 0 });
      K.fill(cr, c, { flat: true });
      K.dot(x - r * 0.3, y - r * 1.25, A.mix(c, '#f0f0c0', 0.3), r * 0.48);
      K.hair(cr.concat([cr[0]]), 0.12, { c: A.mix(c, '#000000', 0.5), p: 0.7 });
    }
    K.hair([[F.x0 - 1, y], [F.x1 + 1, y]], 0.2, { c: A.mix(F.field, '#000000', 0.5), p: 0.75 });
  }
  // the ground sown in counted rows, small and close under the horizon, larger and wider apart toward the front;
  // flowers and tufts by turns
  function meadow(A, K, F, kind, top, bot) {
    const tuft = A.mix(F.field, '#1e3a12', 0.5);
    for (let y = top, r = 0; y < bot; r++) {
      const t = clamp((y - top) / Math.max(1, bot - top), 0, 1), sx = 2.6 + 2.2 * t, s = 0.62 + 0.45 * t, sp = spanAt(F, y);
      let i = 0;
      for (let x = sp[0] + 0.9 + (r % 2 ? sx * 0.5 : 0); x < sp[1] - 0.7; x += sx, i++) {
        const px = x + A.rr(-0.2, 0.2), py = y + A.rr(-0.15, 0.15);
        if ((i + r) % 2) { for (const a of [-0.45, 0, 0.45]) K.tip(px + Math.sin(a) * 0.3 * s, py - 0.3 * s, 0.95 * s, 0.24 * s + 0.08, -PI / 2 + a, tuft); continue; }
        if (kind === 'red') { K.tip(px - 0.35 * s, py + 0.5 * s, 0.8 * s, 0.32 * s, PI * 0.8, '#3f7a3a'); K.tip(px + 0.35 * s, py + 0.5 * s, 0.8 * s, 0.32 * s, PI * 0.2, '#3f7a3a'); K.floret(px, py, 0.62 * s, '#c8321c', '#f6d050', 5); }
        else if (kind === 'sprig') { K.chalk([[px, py + 0.9 * s], [px, py - 0.2 * s]], '#3f7a3a', 0.18); K.tip(px - 0.35 * s, py + 0.3 * s, 0.75 * s, 0.32 * s, PI + 0.6, '#4f8a3c'); K.tip(px + 0.35 * s, py + 0.45 * s, 0.75 * s, 0.32 * s, -0.6, '#4f8a3c'); K.dot(px, py - 0.4 * s, r % 2 ? '#c8321c' : '#e8607a', 0.5 * s); }
        else if (kind === 'night') K.floret(px, py, 0.5 * s, (r + i) % 3 ? '#f2ead6' : '#c8d8f0', '#f0d880', 5);
        else K.floret(px, py, 0.6 * s, (r + i) % 3 ? WHITE : '#f2a0b0', '#e6b422', 5);
      }
      y += 2.1 + 1.6 * t;
    }
  }
  // the bank along the foot: a gently waving edge, tufts of grass counted along it, a flower on a stem now and then
  function bank(A, K, F, base) {
    const { x0, x1, gy, y1 } = F, top = [];
    for (let x = x0 - 1; x <= x1 + 1.01; x += 0.7) top.push([x, gy + 0.22 * Math.sin(x * 0.55 + 1.3) + 0.1 * Math.sin(x * 1.7)]);
    const pb = top.concat([[x1 + 1, y1 + 1], [x0 - 1, y1 + 1]]);
    K.fill(pb, base, { ang: 0.05 });
    K.hair(top, 0.2, { c: A.mix(base, '#000000', 0.45), p: 0.7 });
    const lt = A.mix(base, '#c8e070', 0.38), dk = A.mix(base, '#0a2008', 0.3);
    let i = 0;
    for (let x = x0 + 0.8; x < x1 - 0.4; x += 1.6 + A.rr(-0.12, 0.12), i++) {
      const y = gy + (y1 - gy) * (i % 2 ? 0.7 : 0.45);
      for (const a of [-0.55, -0.2, 0.2, 0.55]) K.tip(x + Math.sin(a) * 0.45, y - 0.5, 1.3 - Math.abs(a) * 0.45, 0.3, -PI / 2 + a, i % 3 ? lt : dk);
      if (i % 3 === 1) { K.chalk([[x + 0.3, y - 0.4], [x + 0.45, y - 1.9]], '#2f6a32', 0.18, { tin: 0, tout: 0 }); K.floret(x + 0.45, y - 2.1, 0.55, i % 2 ? WHITE : '#e8607a', '#e6b422', 5); }
    }
  }
  // a few blades laid over a foot, so the subject stands in the grass and not on it like a cut-out
  function tufts(A, K, F, xs, base) {
    const c = A.mix(base, '#c8e070', 0.32);
    for (const x of xs) for (const a of [-0.5, -0.1, 0.35]) K.tip(x + Math.sin(a) * 0.5 + A.rr(-0.1, 0.1), F.fy + 0.35, 1.1 - Math.abs(a) * 0.3, 0.28, -PI / 2 + a, c);
  }
  // a low clump of flowers at the foot of a tree: long blades fanned from one root, three stems standing out of them
  // with a flower on each, the middle one tallest
  function clump(A, K, x, yB, ht, fl, hc) {
    const g = ['#2f6a32', '#4f8a3c', '#3f7a34'];
    [[-1.0, 0.55], [-0.62, 0.75], [-0.25, 0.9], [0.2, 0.85], [0.58, 0.72], [0.95, 0.5]].forEach(([a, l], i) => { const len = ht * l * 0.62; K.tip(x + Math.sin(a) * len * 0.5, yB - 0.1 - Math.cos(a) * len * 0.5, len, Math.max(0.3, ht * 0.11), -PI / 2 + a, g[i % 3]); });
    for (const [u, v] of [[-0.3, 0.72], [0, 1.0], [0.32, 0.66]]) {
      const tx = x + u * ht * 0.5, ty = yB - v * ht;
      K.chalk([[x + u * ht * 0.12, yB - ht * 0.2], [tx, ty + 0.4]], '#2f6a32', 0.16, { tin: 0, tout: 0 });
      K.floret(tx, ty, clamp(ht * 0.16, 0.5, 0.75), fl, hc, 5);
    }
  }
  // a pair of birds crossing the open ground under the horizon, the second a little behind and below the first
  function birdPair(A, K, F, y, s, flip) {
    const x = F.cx + (flip ? 1 : -1) * F.W * 0.12;
    flyBird(A, K, x, y, s, flip, '#f6f0e2');
    flyBird(A, K, x + (flip ? 1 : -1) * s * 1.7, y + s * 0.7, s * 0.86, flip, '#f6f0e2');
  }

  // a trunk as the painters draw it: flared at the root, tapering to a fork, two or three limbs running up into the
  // crown and thinning as they go, one outline round the whole of it; lit on the left, the bark in drawn lines
  function trunk(A, K, x, yB, yF, w0, tips, o) {
    o = o || {};
    const bark = o.c || '#6a3a1e', barkD = A.mix(bark, '#000000', 0.42), lean = o.lean || 0, wf = w0 * 0.7, xf = x + lean;
    const left = A.spline([[x - w0 * 1.9, yB + 0.4], [x - w0 * 1.15, yB - w0 * 0.6], [x - w0 * 0.98 + lean * 0.35, lerp(yB, yF, 0.5)], [xf - wf, yF]], false, 0.25);
    const right = A.spline([[xf + wf, yF], [x + w0 * 0.95 + lean * 0.4, lerp(yB, yF, 0.5)], [x + w0 * 1.1, yB - w0 * 0.6], [x + w0 * 1.8, yB + 0.4]], false, 0.25);
    const out = left.slice(), n = tips.length, limbs = [];
    for (let i = 0; i < n; i++) {
      const b0 = xf - wf + 2 * wf * i / n, b1 = xf - wf + 2 * wf * (i + 1) / n, bc = (b0 + b1) / 2, hw0 = (b1 - b0) / 2 * 1.05;
      const [tx, ty] = tips[i], c1 = [bc + (tx - bc) * 0.1, yF - (yF - ty) * 0.5], C = [];
      for (let k = 0; k <= 12; k++) { const t = k / 12, u = 1 - t; C.push([u * u * bc + 2 * u * t * c1[0] + t * t * tx, u * u * yF + 2 * u * t * c1[1] + t * t * ty]); }
      const side = sg => C.map((p, k) => { const a = C[Math.max(0, k - 1)], b = C[Math.min(12, k + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, hw = hw0 * (1 - 0.68 * k / 12); return [p[0] - dy / l * hw * sg, p[1] + dx / l * hw * sg]; });
      out.push(...side(-1), ...side(1).reverse());
      limbs.push(C);
    }
    out.push(...right);
    K.fill(out, bark, { ang: 1.5 });
    A.withMask(out, () => {
      const cAt = py => { const t = clamp((yB - py) / (yB - yF), 0, 1); return [lerp(x, xf, t), lerp(w0, wf, t)]; };
      K.wash(out, barkD, (px, py) => { const [c, hw] = cAt(py); return 0.5 * sstep((px - c) / hw * 0.7 + 0.25); }, 'over', 0.08, 0);
      K.chalk(left.slice(2).map(p => [p[0] + w0 * 0.38, p[1]]), A.mix(bark, '#f2c890', 0.42), Math.max(0.24, w0 * 0.3), { p: 0.72, tin: 0.2, tout: 0.25 });
      // the bark: long lines up the trunk, broken where it splits, carried a little way up each limb
      for (const u of [-0.55, -0.12, 0.3, 0.68]) {
        let y = yB - 0.5 - A.rr(0, 1.2);
        while (y > yF + 0.6) {
          const l = A.rr(1.6, 3.4), seg = [];
          for (let yy = y; yy > Math.max(yF + 0.3, y - l); yy -= 0.4) { const [c, hw] = cAt(yy); seg.push([c + u * hw + 0.1 * Math.sin(yy * 1.4 + u * 7), yy]); }
          if (seg.length > 1) K.hair(seg, 0.13, { c: barkD, p: 0.72 });
          y -= l + A.rr(0.5, 1.0);
        }
      }
      for (const C of limbs) K.hair(C.slice(1, 8).map(p => [p[0] + 0.1, p[1]]), 0.13, { c: barkD, p: 0.55 });
      for (let k = 0; k < 2; k++) { const yy = lerp(yB, yF, 0.3 + k * 0.35), [c, hw] = cAt(yy), kx = c + (k ? -0.3 : 0.25) * hw; K.hair(A.ellipse(kx, yy, hw * 0.22, hw * 0.34, 0, PI * 0.15, PI * 1.85), 0.14, { c: barkD, p: 0.8 }); }
    });
    K.ink(out, o.lw || 0.26);
  }
  // a crown of leaves laid one by one, each a pointed dab turned out from the middle and a little down; the greens
  // lighter toward the upper left, where the light comes from; the scalloped outline drawn last
  function leafCrown(A, K, cx, cy, rx, ry, o) {
    const cr = scallop(cx, cy, rx, ry, o.n || 12, 0.1, o.ph == null ? A.rr(0, 0.4) : o.ph), g = o.greens, st = o.step || 1.0;
    K.fill(cr, o.dark, { ang: 1.2 });
    A.withMask(cr, () => {
      for (let y = cy - ry - st, r = 0; y < cy + ry + st; y += st * 0.86, r++) for (let x = cx - rx - st + (r % 2) * st / 2; x < cx + rx + st; x += st) {
        const px = x + A.rr(-0.2, 0.2) * st, py = y + A.rr(-0.2, 0.2) * st, u = (px - cx) / rx, v = (py - cy) / ry, d = Math.hypot(u, v);
        if (d > 1.04) continue;
        const lit = 0.5 - 0.42 * (u * 0.62 + v * 0.78) + A.rr(-0.12, 0.12), c = lit > 0.64 ? g[0] : lit > 0.38 ? g[1] : g[2];
        const ox = u / (d || 1) * 0.72, oy = v / (d || 1) * 0.72 + 0.42, a = Math.atan2(oy, ox) + A.rr(-0.55, 0.55);
        K.tip(px, py, st * 1.18, st * 0.46, a, c);
      }
    });
    K.ink(cr, 0.28);
    return cr;
  }
  // a cypress: a tall flame of dark green, its sprays laid in rows of chevrons, lit on the left
  function cypress(A, K, x, yB, yT, wd) {
    const h = yB - yT, R = [], Lf = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, w = wd * 0.5 * Math.pow(Math.sin(PI / 2 * Math.min(1, t / 0.72)), 0.85) * (1 - 0.22 * Math.max(0, (t - 0.72) / 0.28)), bend = wd * 0.35 * Math.pow(1 - t, 3);
      R.push([x + bend + w, yT + h * t]); Lf.push([x + bend - w, yT + h * t]);
    }
    const shape = R.concat(Lf.reverse());
    K.fill(shape, '#1f4a30', { ang: 1.4 });
    A.withMask(shape, () => {
      for (let y = yT + 1.0, r = 0; y < yB; y += 0.95, r++) {
        const t = (y - yT) / h, w = wd * 0.5 * Math.pow(Math.sin(PI / 2 * Math.min(1, t / 0.72)), 0.85), bend = wd * 0.35 * Math.pow(1 - t, 3);
        for (let u = -0.7 + (r % 2) * 0.35; u <= 0.75; u += 0.7) {
          const px = x + bend + u * w, c = u < -0.2 ? '#4f8a50' : u < 0.3 ? '#356e40' : '#28583a';
          K.tip(px - 0.32, y, 0.95, 0.34, -PI / 2 - 0.75, c); K.tip(px + 0.32, y, 0.95, 0.34, -PI / 2 + 0.75, c);
        }
      }
    });
    K.ink(shape, 0.26);
  }
  // a small bird in flight, white with dark wing tips, a yellow bill: the pair the painters set in an empty sky
  function flyBird(A, K, x, y, s, flip, c) {
    const T = pts => pts.map(p => [x + (flip ? -p[0] : p[0]) * s, y + p[1] * s]);
    const far = A.spline(T([[-0.05, -0.05], [0.1, -0.5], [0.0, -0.75], [-0.18, -0.4]]), true, 0.06);
    const body = A.spline(T([[-0.55, 0.02], [-0.2, -0.1], [0.25, -0.08], [0.48, -0.16], [0.56, -0.1], [0.42, 0.04], [0.1, 0.1], [-0.3, 0.1]]), true, 0.05);
    const near = A.spline(T([[-0.12, -0.02], [-0.2, -0.55], [-0.42, -0.85], [-0.3, -0.45], [0.12, 0.0]]), true, 0.06);
    K.fill(far, A.mix(c, '#8a8a90', 0.3), { flat: true }); K.ink(far, 0.1);
    K.fill(body, c, { flat: true }); K.ink(body, 0.11);
    K.fill(near, c, { flat: true });
    const tp = T([[-0.4, -0.82], [-0.33, -0.68]]); K.chalk(tp, '#3a3a40', 0.16, { tin: 0, tout: 0 });
    K.ink(near, 0.11);
    const b = T([[0.55, -0.12], [0.75, -0.08]]); K.chalk(b, '#e6b422', 0.22, { tin: 0, tout: 0.4 });
    const e = T([[0.44, -0.11]])[0]; K.dot(e[0], e[1], '#141010', 0.16);
  }

  function mango(A, K, F) {
    const { cx, W, fy, T } = F;
    const rx = W * 0.46, ry = Math.min(rx * 1.06, (fy - T) * 0.34), cy = T + ry, yF = cy + ry + (fy - cy - ry) * 0.4;
    trunk(A, K, cx - W * 0.01, fy + 0.3, yF, W * 0.062, [[cx - rx * 0.62, cy + ry * 0.42], [cx + rx * 0.04, cy - ry * 0.28], [cx + rx * 0.6, cy + ry * 0.36]], { lean: W * 0.012 });
    leafCrown(A, K, cx, cy, rx, ry, { n: 13, dark: '#24502a', greens: ['#7ab04e', '#4f8a3c', '#336a30'] });
    // the fruit hanging in the lower half of the crown, counted in two staggered rows
    const fs = clamp(W * 0.055, 0.9, 1.5);
    for (const [u, v] of [[-0.62, 0.22], [-0.3, 0.38], [0.02, 0.3], [0.34, 0.4], [0.62, 0.2], [-0.46, 0.62], [-0.14, 0.7], [0.18, 0.66], [0.48, 0.58]]) {
      const x = cx + u * rx, y = cy + v * ry, mg = A.spline([[x, y - 0.9 * fs], [x + 0.62 * fs, y - 0.2 * fs], [x + 0.35 * fs, y + 0.8 * fs], [x - 0.1 * fs, y + 0.95 * fs], [x - 0.55 * fs, y + 0.2 * fs]], true, 0.1);
      K.chalk([[x, y - 0.9 * fs], [x + 0.15 * fs, y - 1.6 * fs]], '#5a3a1e', 0.16);
      K.fill(mg, '#f2b632', { flat: true }); K.chalk([[x + 0.25 * fs, y - 0.1 * fs], [x + 0.2 * fs, y + 0.5 * fs]], '#e0742a', 0.36 * fs); K.ink(mg, 0.17);
    }
    // a pair of parakeets on the crown, turned to each other
    parrot(A, K, cx - rx * 0.48, cy - ry * 0.8, W * 0.12, false);
    parrot(A, K, cx + rx * 0.5, cy - ry * 0.76, W * 0.115, true);
    // two small flowering plants at its foot, one either side
    clump(A, K, cx - W * 0.3, fy + 0.3, W * 0.2, '#c8321c', '#f6d050');
    clump(A, K, cx + W * 0.31, fy + 0.3, W * 0.17, WHITE, '#e6b422');
    tufts(A, K, F, [cx - W * 0.1, cx + W * 0.1], F.bankC);
  }
  // the elephant, grey-blue, a red caparison with borders, a howdah; a kadamba behind him in flower
  function elephant(A, K, F) {
    const { cx, W, fy, T } = F, L = W * 0.76, ex = cx - 0.06 * L;
    birdPair(A, K, F, F.skyY + (T - F.skyY) * 0.62, W * 0.15, true);
    // the tree behind: its trunk rises from behind his rump, its crown spreads over him
    const cb = fy - L * 0.98, rx = W * 0.47, ry = Math.min(rx * 0.95, (cb - T) * 0.5), cyc = cb - ry, tx = ex - L * 0.3;
    trunk(A, K, tx, fy - L * 0.3, cb + 1.2, W * 0.045, [[tx - rx * 0.35, cyc + ry * 0.2], [tx + rx * 0.25, cyc - ry * 0.2], [cx + rx * 0.5, cyc + ry * 0.15]], { lean: W * 0.02 });
    leafCrown(A, K, cx, cyc, rx, ry, { n: 12, dark: '#1f4a28', greens: ['#6aa24a', '#3f7a34', '#2c5c2a'] });
    // its flowers: round golden heads, counted over the crown
    for (let k = 0; k < 15; k++) {
      const a = k * 2.39996, d = Math.sqrt((k + 0.5) / 15) * 0.82, x = cx + Math.cos(a) * d * rx, y = cyc + Math.sin(a) * d * ry;
      K.dot(x, y, '#e8902a', 0.95); K.dot(x - 0.18, y - 0.2, '#f8d070', 0.42);
    }
    const T2 = pts => pts.map(p => [ex + p[0] * L, fy + p[1] * L]);
    const grey = '#5f6676', greyD = '#454b5a', greyL = '#7c8496';
    const sp = (pts, st) => A.spline(T2(pts), true, st || 0.15);
    // the legs on the far side, darker
    for (const lg of [[[0.16, -0.26], [0.25, -0.26], [0.245, -0.02], [0.155, -0.02]], [[-0.2, -0.26], [-0.11, -0.26], [-0.115, -0.02], [-0.205, -0.02]]]) { const p = T2(lg); K.fill(p, greyD); K.ink(p, 0.22); }
    const body = sp([[-0.37, 0.0], [-0.385, -0.12], [-0.42, -0.3], [-0.47, -0.44], [-0.44, -0.58], [-0.32, -0.66], [-0.12, -0.7], [0.08, -0.68], [0.19, -0.63], [0.27, -0.71], [0.36, -0.75], [0.45, -0.7], [0.5, -0.6], [0.53, -0.46], [0.54, -0.3], [0.55, -0.17], [0.6, -0.08], [0.58, -0.02], [0.53, -0.05], [0.495, -0.16], [0.475, -0.32], [0.445, -0.4], [0.39, -0.405], [0.36, -0.3], [0.356, -0.1], [0.37, 0.0], [0.25, 0.0], [0.252, -0.12], [0.23, -0.24], [0.05, -0.22], [-0.15, -0.23], [-0.23, -0.22], [-0.24, -0.1], [-0.235, 0.0]], 0.12);
    K.fill(body, grey);
    K.wash(body, greyD, (x, y) => 0.55 * sstep((y - (fy - L * 0.4)) / (L * 0.3)), 'over', 0.1, 0);
    K.chalk(T2([[-0.3, -0.62], [-0.05, -0.665], [0.14, -0.64]]), greyL, 0.5, { p: 0.6 });
    for (let k = 0; k < 6; k++) { const t = k / 6, y = -0.44 + t * 0.34, xa = 0.52 - t * 0.03, xb = 0.475; K.hair(T2([[xa + 0.02, y], [xb, y + 0.01]]), 0.15, { c: greyD, p: 0.6 }); }
    // the caparison: red, a green and a yellow border, a white dot row, a sun in the middle, tassels
    const cap = sp([[-0.36, -0.63], [-0.1, -0.7], [0.14, -0.66], [0.15, -0.36], [0.06, -0.33], [-0.06, -0.36], [-0.18, -0.33], [-0.3, -0.36], [-0.38, -0.4]], 0.12);
    K.fill(cap, '#c0302a');
    const capIn = sp([[-0.32, -0.6], [-0.1, -0.665], [0.11, -0.63], [0.12, -0.4], [0.06, -0.375], [-0.06, -0.405], [-0.18, -0.375], [-0.29, -0.405], [-0.34, -0.43]], 0.12);
    K.chalk(capIn.concat([capIn[0]]), '#2f7a3a', 0.62, { tin: 0, tout: 0 });
    K.chalk(capIn.concat([capIn[0]]), '#e6b422', 0.2, { tin: 0, tout: 0 });
    K.dots(capIn.concat([capIn[0]]), 0.9, WHITE, 0.26);
    const sc = T2([[-0.1, -0.52]])[0]; M.w8Halo(A, sc[0], sc[1], L * 0.06, { accent: '#2a4b96', line: K.INK }, {});
    for (const [u, v] of [[-0.33, -0.39], [-0.18, -0.36], [-0.06, -0.39], [0.06, -0.36], [0.14, -0.38]]) { const q = T2([[u, v]])[0]; K.chalk([[q[0], q[1]], [q[0], q[1] + 0.9]], '#e6b422', 0.26); K.dot(q[0], q[1] + 1.1, '#e6b422', 0.42); }
    K.ink(cap, 0.24);
    // the ear, the eye, the tusk, the forehead cloth
    const ear = sp([[0.22, -0.62], [0.3, -0.665], [0.345, -0.56], [0.335, -0.43], [0.27, -0.37], [0.21, -0.43], [0.195, -0.55]], 0.1);
    K.fill(ear, greyL); K.chalk(ear.slice(Math.floor(ear.length * 0.25), Math.floor(ear.length * 0.75)), '#e09a9a', 0.3, { p: 0.7 });
    K.dots(ear.slice(Math.floor(ear.length * 0.2), Math.floor(ear.length * 0.8)), 0.75, WHITE, 0.22);
    K.ink(ear, 0.22);
    const fc = sp([[0.36, -0.735], [0.47, -0.69], [0.5, -0.6], [0.44, -0.58], [0.38, -0.64]], 0.1);
    K.fill(fc, '#c0302a'); K.dots(T2([[0.385, -0.7], [0.46, -0.66], [0.48, -0.61]]), 0.7, WHITE, 0.22);
    K.ink(fc, 0.18);
    const ey = T2([[0.43, -0.615]])[0]; K.dot(ey[0], ey[1], WHITE, 0.55); K.dot(ey[0] + 0.1, ey[1], '#141010', 0.3);
    const tusk = sp([[0.455, -0.43], [0.53, -0.41], [0.585, -0.35], [0.56, -0.355], [0.5, -0.38], [0.45, -0.395]], 0.08);
    K.fill(tusk, '#fbf2dc'); K.ink(tusk, 0.16);
    for (const lx of [[-0.37, -0.235], [0.25, 0.37]]) {
      const a = T2([[lx[0], -0.06]])[0], b2 = T2([[lx[1], -0.06]])[0];
      K.chalk([[a[0], a[1]], [b2[0], b2[1]]], '#e6b422', 0.42, { tin: 0, tout: 0 }); K.dots([[a[0], a[1] - 0.45], [b2[0], b2[1] - 0.45]], 0.7, WHITE, 0.2);
      for (let k = 0; k < 3; k++) { const n = T2([[lerp(lx[0], lx[1], 0.25 + k * 0.25), -0.012]])[0]; K.dot(n[0], n[1], '#f6efe0', 0.34); }
    }
    K.ink(body, 0.3);
    // the howdah: an ochre seat with red panels, a rail of dots, a little red cushion over it
    const hb = T2([[-0.25, -0.7], [0.07, -0.69]]), hy0 = hb[0][1], hh = L * 0.12;
    const how = [[hb[0][0], hy0], [hb[1][0], hb[1][1]], [hb[1][0] + L * 0.02, hb[1][1] - hh], [hb[0][0] - L * 0.02, hy0 - hh]];
    K.fill(how, OCHRE); for (let k = 0; k < 3; k++) { const xa = lerp(how[3][0], how[2][0], 0.08 + k * 0.32), xb = xa + (how[2][0] - how[3][0]) * 0.24; K.fill(rect(xa, hy0 - hh * 0.78, xb, hy0 - hh * 0.22), '#c0302a'); }
    K.dots([[how[3][0] + 0.4, hy0 - hh + 0.4], [how[2][0] - 0.4, hy0 - hh + 0.4]], 0.85, WHITE, 0.24);
    K.ink(how, 0.24);
    const cu = A.spline([[how[3][0] + 0.3, hy0 - hh], [lerp(how[3][0], how[2][0], 0.5), hy0 - hh - L * 0.06], [how[2][0] - 0.3, hy0 - hh]], false, 0.15);
    K.fill(cu, '#2a4b96', { flat: true }); K.dots(cu.slice(2, -2), 0.8, '#e6b422', 0.22); K.ink(cu, 0.2);
    tufts(A, K, F, T2([[-0.3, 0], [0.31, 0], [-0.16, 0], [0.2, 0]]).map(p => p[0]), F.bankC);
  }
  // a peacock on the low bough of a tree, his train hanging to the grass with its eyes counted in rows
  function peacock(A, K, F) {
    const { cx, W, fy, T } = F, s = Math.min(W * 0.34, (fy - T) * 0.135), x = cx + W * 0.08, y = fy - 0.8 - 2.5 * s;
    const crTop = Math.max(T, F.skyY + 3), cb = y - 1.5 * s - 0.4, ry = Math.max(3, (cb - crTop) * 0.5), rx = W * 0.44, cyc = cb - ry, tx = cx - W * 0.25;
    trunk(A, K, tx, fy + 0.3, cb + 0.8, W * 0.05, [[tx - rx * 0.1, cyc + ry * 0.2], [cx + rx * 0.2, cyc - ry * 0.1], [cx + rx * 0.62, cyc + ry * 0.3]], { lean: W * 0.03 });
    leafCrown(A, K, cx - W * 0.03, cyc, rx, ry, { n: 11, dark: '#1f4a28', greens: ['#6aa24a', '#3f7a34', '#2c5c2a'] });
    // the bough he sits on, out from the trunk
    const bx0 = tx + W * 0.03, bx1 = cx + W * 0.4;
    K.chalk(A.spline([[bx0, y + 1.4], [lerp(bx0, bx1, 0.5), y + 0.3], [bx1, y - 0.4]], false, 0.3), '#6a3a1e', 0.64, { tin: 0, tout: 0.6 });
    K.tip(bx1 + 0.6, y - 1.0, 1.6, 0.6, -0.6, '#4f8a3c'); K.tip(bx1 - 1.5, y - 0.9, 1.4, 0.55, -1.4, '#3f7a34');
    const T2 = pts => pts.map(p => [x + p[0] * s, y + p[1] * s]);
    const tr = A.spline(T2([[-0.42, -0.2], [-0.2, -0.05], [-0.06, 0.6], [0.08, 1.4], [0.1, 2.2], [-0.2, 2.5], [-0.6, 2.4], [-0.75, 1.7], [-0.68, 0.9], [-0.55, 0.2]]), true, 0.15);
    K.fill(tr, '#24603a');
    A.withMask(tr, () => {
      for (let r = 0; r < 7; r++) {
        const v = 0.15 + r * 0.34, n = 2 + Math.min(3, r), sz = 0.07 + r * 0.012;
        for (let k = 0; k < n; k++) {
          const u = -0.32 + (k - (n - 1) / 2) * 0.24 + (r % 2 ? 0.06 : -0.06), q = T2([[u, v]])[0], rr = s * sz;
          K.fill(almond(q[0], q[1] - rr * 1.7, rr * 3.2, rr * 2.4, PI / 2, 0.9), '#d6a535', { flat: true });
          K.fill(almond(q[0], q[1] - rr * 0.8, rr * 2.0, rr * 1.6, PI / 2, 0.9), '#2a8a7a', { flat: true });
          K.fill(almond(q[0], q[1] - rr * 0.2, rr * 1.1, rr * 0.9, PI / 2, 0.9), '#16246a', { flat: true });
        }
      }
      for (let k = 0; k < 14; k++) { const u = -0.7 + k * 0.06, a = T2([[u * 0.3 - 0.3, 0.1], [u, 2.35 + Math.sin(k) * 0.08]]); K.hair(a, 0.15, { c: '#5aa060', p: 0.5 }); }
    });
    K.ink(tr, 0.26);
    const body = A.spline(T2([[-0.48, -0.18], [-0.22, -0.55], [0.18, -0.72], [0.4, -0.62], [0.36, -0.28], [0.12, -0.04], [-0.28, 0.0]]), true, 0.12);
    const neck = A.spline(T2([[0.12, -0.62], [0.28, -0.98], [0.36, -1.32], [0.48, -1.42], [0.56, -1.34], [0.48, -1.2], [0.42, -0.94], [0.4, -0.6]]), true, 0.1);
    K.fill(body, '#1f58a6'); K.fill(neck, '#1f58a6');
    const wing = A.spline(T2([[-0.36, -0.2], [-0.12, -0.5], [0.16, -0.56], [0.18, -0.34], [-0.04, -0.12]]), true, 0.12);
    K.fill(wing, '#8a6a42');
    A.withMask(wing, () => { for (let k = 0; k < 6; k++) K.hair(T2([[-0.3 + k * 0.08, -0.12 - k * 0.02], [-0.18 + k * 0.08, -0.5 + k * 0.02]]), 0.15, { c: '#4a3420', p: 0.7 }); });
    K.dots(A.spline(T2([[0.3, -0.62], [0.36, -0.98], [0.44, -1.28]]), false, 0.2), 0.7, '#7ab0e0', 0.24);
    K.ink(wing, 0.18);
    K.ink(body, 0.26); K.ink(neck, 0.24);
    const hd = T2([[0.5, -1.38]])[0];
    K.fill(A.spline([[hd[0] + s * 0.06, hd[1] - s * 0.02], [hd[0] + s * 0.18, hd[1] + s * 0.01], [hd[0] + s * 0.06, hd[1] + s * 0.05]], true, 0.05), '#d8b070');
    K.dot(hd[0] + s * 0.02, hd[1] - s * 0.02, WHITE, 0.42); K.dot(hd[0] + s * 0.03, hd[1] - s * 0.02, '#141010', 0.24);
    for (let k = 0; k < 4; k++) { const a = -PI / 2 - 0.5 + k * 0.28, e = [hd[0] + Math.cos(a) * s * 0.2, hd[1] - s * 0.04 + Math.sin(a) * s * 0.2]; K.hair([[hd[0], hd[1] - s * 0.06], e], 0.15, { c: '#1f3a80' }); K.dot(e[0], e[1], '#2a6ac0', 0.38); }
    for (const u of [0.0, 0.12]) { const q = T2([[u, -0.02], [u + 0.02, 0.1]]); K.chalk(q, '#8a7a6a', 0.22); }
    // a flowering plant on the far side of the trunk
    clump(A, K, cx + W * 0.34, fy + 0.3, W * 0.2, WHITE, '#e6b422');
    tufts(A, K, F, [tx - W * 0.05, tx + W * 0.06, x - s * 0.4], F.bankC);
  }
  // a white horse in profile at night: henna on his legs and tail, a red saddle cloth, a plume, bridle and dots; a
  // cypress dark behind him
  function horse(A, K, F) {
    const { cx, W, fy, T } = F, L = W * 0.84, hx = cx - 0.02 * L;
    cypress(A, K, hx - L * 0.12, fy - L * 0.4, Math.max(T - 2, F.skyY + 2.5), W * 0.3);
    const T2 = pts => pts.map(p => [hx + p[0] * L, fy + p[1] * L]);
    const sp = (pts, st) => A.spline(T2(pts), true, st || 0.12);
    const white = '#f4ecdc', whiteD = '#d8ccb8', henna = '#d8642a', line = K.INK;
    for (const lg of [[[0.14, -0.34], [0.21, -0.34], [0.205, -0.02], [0.215, 0.0], [0.155, 0.0], [0.15, -0.18]], [[-0.24, -0.34], [-0.17, -0.34], [-0.19, -0.18], [-0.17, 0.0], [-0.23, 0.0], [-0.245, -0.2]]]) {
      const p = sp(lg, 0.08); K.fill(p, whiteD); K.wash(p, henna, (x, y) => 0.8 * sstep((y - (fy - L * 0.14)) / (L * 0.06)), 'over', 0.1, 0); K.ink(p, 0.2);
    }
    const tail = sp([[-0.4, -0.54], [-0.47, -0.48], [-0.52, -0.3], [-0.5, -0.12], [-0.46, -0.1], [-0.45, -0.3], [-0.41, -0.45]], 0.1);
    K.fill(tail, henna); A.withMask(tail, () => { for (let k = 0; k < 4; k++) K.hair(T2([[-0.42 - k * 0.02, -0.5], [-0.47 - k * 0.01, -0.14]]), 0.15, { c: '#8a3a14', p: 0.7 }); }); K.ink(tail, 0.2);
    const body = sp([[-0.4, 0.0], [-0.395, -0.1], [-0.36, -0.25], [-0.4, -0.42], [-0.38, -0.56], [-0.2, -0.6], [0.0, -0.58], [0.12, -0.62], [0.22, -0.8], [0.29, -0.95], [0.32, -1.02], [0.345, -0.96], [0.45, -0.84], [0.555, -0.68], [0.56, -0.62], [0.49, -0.6], [0.41, -0.66], [0.33, -0.6], [0.29, -0.46], [0.26, -0.36], [0.25, -0.2], [0.27, -0.05], [0.29, 0.0], [0.22, 0.0], [0.21, -0.18], [0.18, -0.34], [0.0, -0.34], [-0.2, -0.36], [-0.26, -0.32], [-0.28, -0.15], [-0.25, 0.0]], 0.1);
    K.fill(body, white);
    K.wash(body, henna, (x, y) => 0.8 * sstep((y - (fy - L * 0.13)) / (L * 0.05)), 'over', 0.1, 0);
    K.wash(body, whiteD, (x, y) => 0.6 * sstep((y - (fy - L * 0.48)) / (L * 0.16)) * (1 - sstep((y - (fy - L * 0.2)) / (L * 0.06))), 'over', 0.1, 0);
    for (let k = 0; k < 8; k++) { const t = k / 8, q = T2([[lerp(0.13, 0.3, t), lerp(-0.64, -0.96, t)]])[0]; K.tip(q[0] - 0.4, q[1] + 0.2, 1.7, 0.6, PI * 0.82, henna); }
    const cl = sp([[-0.2, -0.6], [0.07, -0.59], [0.09, -0.38], [-0.21, -0.38]], 0.1);
    K.fill(cl, '#c0302a');
    const cli = sp([[-0.18, -0.575], [0.05, -0.565], [0.07, -0.405], [-0.19, -0.405]], 0.1);
    K.chalk(cli.concat([cli[0]]), '#e6b422', 0.36, { tin: 0, tout: 0 }); K.dots(cli.concat([cli[0]]), 0.8, WHITE, 0.22);
    K.ink(cl, 0.2);
    const sd = sp([[-0.12, -0.6], [0.0, -0.62], [0.05, -0.66], [-0.15, -0.66]], 0.1); K.fill(sd, '#6a3a1e'); K.ink(sd, 0.18);
    K.chalk(T2([[0.33, -0.93], [0.45, -0.72], [0.53, -0.66]]), '#c0302a', 0.28, { tin: 0, tout: 0 });
    K.chalk(T2([[0.38, -0.66], [0.33, -0.95]]), '#c0302a', 0.24, { tin: 0, tout: 0 });
    K.dots(T2([[0.34, -0.9], [0.44, -0.74]]), 0.65, '#e6b422', 0.24);
    K.chalk(T2([[0.5, -0.66], [0.35, -0.5], [0.15, -0.6]]), '#c0302a', 0.2, { tin: 0, tout: 0 });
    const pl = T2([[0.31, -1.0]])[0]; for (let k = 0; k < 4; k++) K.tip(pl[0] - 0.3 - k * 0.2, pl[1] - 1.1 - k * 0.05, 2.2, 0.62, -PI / 2 - 0.5 - k * 0.15, k % 2 ? '#e6b422' : '#c0302a');
    const ey = T2([[0.4, -0.84]])[0]; K.dot(ey[0], ey[1], '#141010', 0.36);
    K.ink(body, 0.28, { c: line });
    for (const [a, b2] of [[-0.4, -0.25], [0.22, 0.29]]) { const p = T2([[a, -0.035], [b2, -0.035]]); K.dots(p, 0.6, WHITE, 0.22); }
    tufts(A, K, F, T2([[-0.33, 0], [0.25, 0], [-0.2, 0], [0.18, 0]]).map(p => p[0]), F.bankC);
  }
  // a lotus seen from the side: the petals behind darker, the three in front pale, a green seed head showing
  function lotusFlower(A, K, x, y, r, open) {
    const pk = '#e8789a', pkL = '#f8c4d0', pkD = '#b8456a', line = A.mix(K.INK, pkD, 0.3);
    const ps = open ? [[-1.3, 0.78, pk], [1.3, 0.78, pk], [-0.75, 0.98, pk], [0.75, 0.98, pk], [-0.34, 1.05, pkL], [0.34, 1.05, pkL], [0, 1.1, pkL]] : [[-0.32, 0.95, pk], [0.32, 0.95, pk], [0, 1.08, pkL]];
    for (const [a, l, c] of ps) {
      const pt = almond(x, y, r * l * (open ? 1.05 : 1.2), r * (open ? 0.5 : 0.62), -PI / 2 + a * 0.6, 0.75);
      K.fill(pt, c, { flat: true });
      K.hair(A.spline([[x, y], [x + Math.cos(-PI / 2 + a * 0.6) * r * l * 0.6, y + Math.sin(-PI / 2 + a * 0.6) * r * l * 0.6]], false, 0.3), 0.13, { c: pkD, p: 0.55 });
      K.ink(pt, 0.15, { c: line });
    }
    if (open) { const sh = circ(x, y - r * 0.18, r * 0.24, r * 0.1, 16); K.fill(sh, '#c8b040', { flat: true }); K.ink(sh, 0.12, { c: line }); }
    const cal = circ(x, y + r * 0.06, r * 0.3, r * 0.12, 16).filter(p => p[1] >= y);
    K.fill(cal.concat([[x - r * 0.3, y], [x + r * 0.3, y]]).reverse(), '#3f7a3a', { flat: true });
  }
  // a round lotus leaf on the water, seen from above at a slant: a notch, ribs from the middle, a lighter rim
  function lotusPad(A, K, x, y, r, a, c) {
    const pd = [];
    for (let i = 0; i < 36; i++) { const t = a + 0.16 + i / 35 * (TAU - 0.32); pd.push([x + Math.cos(t) * r, y + Math.sin(t) * r * 0.46]); }
    pd.push([x, y]);
    K.fill(pd, c || '#3f8a3e', { flat: true });
    A.withMask(pd, () => {
      K.wash(pd, '#000000', (px, py) => 0.18 * sstep((py - y) / (r * 0.46)), 'mul', 0.1, 0);
      for (let i = 0; i < 9; i++) { const t = a + 0.4 + i * (TAU - 0.8) / 8; K.hair([[x, y], [x + Math.cos(t) * r * 0.9, y + Math.sin(t) * r * 0.42]], 0.13, { c: '#8ac868', p: 0.65 }); }
    });
    K.ink(pd, 0.18);
  }
  function fishAt(A, K, fx, fy, s, fl) {
    const f = pts => pts.map(p => [fx + p[0] * s * fl, fy + p[1] * s]);
    const fish = A.spline(f([[-0.5, 0], [-0.1, -0.24], [0.38, -0.14], [0.56, 0], [0.38, 0.13], [-0.1, 0.22]]), true, 0.06);
    const tl = f([[-0.44, 0], [-0.82, -0.26], [-0.7, 0], [-0.82, 0.26]]);
    K.fill(tl, '#d8742a', { flat: true }); K.ink(tl, 0.14);
    K.fill(fish, '#eca032', { flat: true });
    K.fill(f([[-0.1, -0.22], [0.12, -0.36], [0.24, -0.16]]), '#d8742a', { flat: true });
    K.dots(f([[-0.24, 0.02], [0.24, 0.02]]), 0.45, '#fff0c0', 0.18);
    K.hair(f([[0.3, -0.12], [0.24, 0], [0.3, 0.12]]), 0.12);
    K.ink(fish, 0.17);
    const e = f([[0.4, -0.03]])[0]; K.dot(e[0], e[1], '#141010', 0.2);
  }
  // the lotus pool, as the painters show a pond: seen from above, the water ruled in rows of ripples, the leaves
  // floating on it, the flowers standing on short stems, fish between; everything counted, row by row
  function lotus(A, K, F) {
    const { x0, x1, cx, W, skyY, y1 } = F, wy = skyY + 1.2, WH = y1 - wy;
    K.fill(rect(x0 - 1, wy, x1 + 1, y1 + 1), FIELDC.lotus, { ang: 0.05 });
    for (let y = wy + 1.5, r = 0; y < y1 + 1; y += 2.0, r++) for (let x = x0 + (r % 2 ? 1.1 : -0.1); x < x1 + 1; x += 2.2) {
      K.chalk(A.ellipse(x + A.rr(-0.08, 0.08), y, 0.9, 0.42, 0, PI * 1.12, PI * 1.88), A.mix('#9ad0cc', FIELDC.lotus, 0.2 + 0.25 * (y - wy) / WH), 0.2, { p: 0.85, tin: 0.2, tout: 0.2 });
    }
    // the bank at the far side of the pool, with a row of small plants
    K.fill(rect(x0 - 1, wy - 0.4, x1 + 1, wy + 1.0), '#4f8a3c', { flat: true });
    K.hair([[x0 - 1, wy + 1.0], [x1 + 1, wy + 1.0]], 0.18, { c: A.mix(FIELDC.lotus, '#000000', 0.45) });
    for (let x = x0 + 1; x < x1 - 0.5; x += 1.7) K.tip(x + A.rr(-0.1, 0.1), wy - 0.2, 1.1, 0.4, -PI / 2 + A.rr(-0.3, 0.3), '#6aa24a');
    const n = Math.max(3, Math.min(5, Math.round(WH / (W * 0.62))));
    for (let k = 0; k < n; k++) {
      const v = (k + 0.62) / (n + 0.2), y = wy + WH * v, sd = k % 2 ? 1 : -1, s = 0.86 + 0.14 * v;
      // a big leaf with a flower standing on it, and on the other side a small leaf with a bud
      const px = cx + sd * W * 0.2, pr = W * 0.2 * s;
      lotusPad(A, K, px, y, pr, sd > 0 ? 2.6 : 0.5);
      const sx = px - sd * pr * 0.25, stem = A.spline([[sx, y + 0.2], [sx + sd * 0.4, y - W * 0.1], [sx - sd * 0.1, y - W * 0.2]], false, 0.25);
      K.chalk(stem, '#2f6a32', 0.32, { tin: 0, tout: 0 });
      const e = stem[stem.length - 1];
      lotusFlower(A, K, e[0], e[1], W * 0.15 * s, true);
      const qx = cx - sd * W * 0.24, qy = y + WH / (n + 0.2) * 0.32;
      lotusPad(A, K, qx, qy, W * 0.11 * s, sd > 0 ? 0.9 : 3.0, '#4f9a44');
      const st2 = A.spline([[qx, qy], [qx - sd * 0.3, qy - W * 0.08], [qx, qy - W * 0.14]], false, 0.25);
      K.chalk(st2, '#2f6a32', 0.28, { tin: 0, tout: 0 });
      const e2 = st2[st2.length - 1];
      lotusFlower(A, K, e2[0], e2[1], W * 0.085 * s, false);
      if (k < n - 1) fishAt(A, K, cx - sd * W * 0.12, y + WH / (n + 0.2) * 0.62, W * 0.13, sd);
    }
  }
  // chital deer under a tree: a stag and a doe, spotted in rows, white bellies, a dark line along the back
  function deerShape(A, K, x, gy, L, fl, stag) {
    const T = pts => pts.map(p => [x + p[0] * L * fl, gy + p[1] * L]);
    const tawny = '#c4783a', tawnyD = '#94542a';
    const legs = [[[0.13, -0.38], [0.19, -0.38], [0.165, -0.12], [0.175, 0.0], [0.14, 0.0], [0.135, -0.14]], [[-0.24, -0.4], [-0.17, -0.38], [-0.2, -0.16], [-0.19, 0.0], [-0.225, 0.0], [-0.235, -0.18]]];
    for (const lg of legs) { const p = A.spline(T(lg), true, 0.08); K.fill(p, tawnyD); K.ink(p, 0.17); }
    const body = A.spline(T([[-0.4, -0.02], [-0.385, -0.2], [-0.33, -0.38], [-0.4, -0.52], [-0.38, -0.66], [-0.2, -0.68], [0.08, -0.66], [0.2, -0.72], [0.27, -0.86], [0.31, -0.98], [0.39, -1.0], [0.52, -0.9], [0.53, -0.86], [0.45, -0.83], [0.37, -0.8], [0.32, -0.66], [0.28, -0.5], [0.26, -0.36], [0.27, -0.16], [0.285, 0.0], [0.245, 0.0], [0.23, -0.16], [0.2, -0.38], [0.0, -0.4], [-0.2, -0.42], [-0.27, -0.38], [-0.3, -0.18], [-0.33, -0.02]]), true, 0.08);
    K.fill(body, tawny);
    K.wash(body, '#f6ecd8', (px, py) => 0.85 * sstep((py - (gy - L * 0.47)) / (L * 0.05)) * (1 - sstep((py - (gy - L * 0.36)) / (L * 0.04))), 'over', 0.1, 0);
    K.chalk(T([[-0.36, -0.665], [-0.05, -0.665], [0.18, -0.71]]), '#6a3a1e', 0.36, { p: 0.85 });
    // spots in rows along the flank, counted
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6 - r; k++) { const q = T([[-0.32 + k * 0.1 + r * 0.05, -0.6 + r * 0.06]])[0]; K.dot(q[0] + A.rr(-0.1, 0.1), q[1] + A.rr(-0.1, 0.1), '#fbf2dc', 0.4); }
    const tl = A.spline(T([[-0.38, -0.64], [-0.45, -0.66], [-0.42, -0.58]]), true, 0.05); K.fill(tl, '#fbf2dc');
    const ear = almond(...T([[0.32, -0.95]])[0], L * 0.14, L * 0.06, fl > 0 ? PI + 0.5 : -0.5, 0.8); K.fill(ear, tawnyD); K.ink(ear, 0.15);
    const ey = T([[0.41, -0.93]])[0]; K.dot(ey[0], ey[1], '#141010', 0.32);
    const ns = T([[0.525, -0.88]])[0]; K.dot(ns[0], ns[1], '#141010', 0.28);
    if (stag) for (const sg of [0, 1]) {
      const b0 = T([[0.35 - sg * 0.04, -0.99]])[0], an = A.spline([[b0[0], b0[1]], [b0[0] - fl * L * 0.08, b0[1] - L * 0.2], [b0[0] - fl * L * 0.02, b0[1] - L * 0.38], [b0[0] + fl * L * 0.06, b0[1] - L * 0.48]], false, 0.15);
      K.chalk(an, sg ? '#6a4a2a' : '#8a6038', 0.3, { tin: 0, tout: 0.4 });
      const m = an[(an.length * 0.4) | 0]; K.chalk([[m[0], m[1]], [m[0] + fl * L * 0.09, m[1] - L * 0.08]], sg ? '#6a4a2a' : '#8a6038', 0.24, { tin: 0, tout: 0.5 });
    }
    K.ink(body, 0.24);
    for (const lx of [0.155, -0.205]) { const q = T([[lx, -0.01]])[0]; K.dot(q[0], q[1], '#2a1a12', 0.36); }
  }
  // chital deer under a tree in white flower: a stag and a doe turned to each other, the trunk rising between them
  function deer(A, K, F) {
    const { cx, W, fy, T } = F;
    const rx = W * 0.48, ry = Math.min(rx * 0.85, (fy - T) * 0.26), cyc = T + ry, tx = cx + W * 0.05, yF = cyc + ry + 1.6;
    trunk(A, K, tx, fy + 0.3, yF, W * 0.055, [[tx - rx * 0.48, cyc + ry * 0.1], [tx + rx * 0.02, cyc - ry * 0.3], [tx + rx * 0.4, cyc + ry * 0.05]], { lean: -W * 0.015 });
    leafCrown(A, K, cx + W * 0.02, cyc, rx, ry, { n: 12, dark: '#2a5628', greens: ['#7ab04e', '#4f8a3c', '#3f7a34'] });
    for (let k = 0; k < 13; k++) {
      const a = k * 2.39996 + 0.7, d = Math.sqrt((k + 0.5) / 13) * 0.8, x = cx + W * 0.02 + Math.cos(a) * d * rx, y = cyc + Math.sin(a) * d * ry;
      K.floret(x, y, 0.62, WHITE, '#e6b422', 5);
    }
    birdPair(A, K, F, F.skyY + (T - F.skyY) * 0.6, W * 0.15, false);
    deerShape(A, K, cx - W * 0.22, fy + 0.2, W * 0.53, 1, true);
    deerShape(A, K, cx + W * 0.27, fy + 0.4, W * 0.43, -1, false);
    tufts(A, K, F, [cx - W * 0.29, cx - W * 0.1, cx + W * 0.23, cx + W * 0.36], F.bankC);
  }
  // what each painting is set in: the flowers of its ground, the green of its bank, the far trees on its horizon
  const SCENE = {
    mango: { mead: 'red', bank: '#3f6e2e', hz: ['#3f7a34', '#2f6a30'] },
    elephant: { mead: 'white', bank: '#2f5e2a', hz: ['#2a5a26', '#36692e'] },
    peacock: { mead: 'white', bank: '#3f6e2e', hz: ['#2f6a30', '#3f7a34'] },
    horse: { mead: 'night', bank: '#1c3a2c', hz: ['#163428', '#1e4030'] },
    deer: { mead: 'sprig', bank: '#5a8a3a', hz: ['#4f8a3c', '#3f7a34'] },
    lotus: { bank: '#4f8a3c' }
  };
  M.w8Miniature = function (A, x0, y0, x1, y1, motif, P, o) {
    // the stage draws a panel through a map at three times its size; paint it on the sheet in sheet units instead
    let B = A;
    if (A.__z) { const a = A.__pt([x0, y0]), b = A.__pt([x1, y1]); x0 = a[0]; y0 = a[1]; x1 = b[0]; y1 = b[1]; B = A.__base; }
    const K = kit(B), lv = levOf(P), f = FIELD && Math.abs(FIELD.x0 - x0) < 0.5 && Math.abs(FIELD.y1 - y1) < 0.5 ? FIELD : null;
    if (!SCENE[motif]) motif = 'mango';
    const W = x1 - x0, H = y1 - y0, ys = f ? f.ys : y0 + H * 0.4, gh = clamp(H * 0.075, 2.8, 5), sc = SCENE[motif];
    const F = { x0, y0, x1, y1, W, H, cx: (x0 + x1) / 2, poly: f ? f.poly : rect(x0, y0, x1, y1), field: FIELDC[motif], bankC: sc.bank };
    F.skyY = y0 + Math.max(H * 0.15, (ys - y0) * 0.42); F.gy = y1 - gh; F.fy = F.gy + gh * 0.42; F.T = y0 + H * 0.36;
    K.burnish(rect(x0, y0, x1, y1));
    K.lay(rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1), F.field, { w: 0.9, ang: 1.5 });
    skyStrip(B, K, F, motif === 'horse' ? '#141c42' : lv.sky, { night: motif === 'horse' });
    if (motif !== 'lotus') {
      horizon(B, K, F, sc.hz);
      meadow(B, K, F, sc.mead, F.skyY + 2.2, F.gy - 0.8);
      bank(B, K, F, sc.bank);
    }
    ({ mango, elephant, peacock, horse, lotus, deer })[motif](B, K, F);
  };

  /* ================================================================ THE BAY */
  M.w8Bay = function (A, b, kind, P, o) {
    o = o || {};
    const K = kit(A);
    const x0 = b.x0, x1 = b.x1, yt = b.yt, yb = b.yb, w = x1 - x0, h = yb - yt, xc = (x0 + x1) / 2;
    const inset = w * 0.08;
    const ys = yt + h * (kind === 'door' ? 0.34 : 0.42), ya = yt + h * 0.04;
    const lobes = o.lobes != null ? o.lobes : (w > 40 ? 9 : 7);
    const op = M.w8Arch(x0 + inset, x1 - inset, yb, ys, ya, lobes);
    const frame = M.w8Arch(x0 + inset * 0.35, x1 - inset * 0.35, yb, ys, ya - h * 0.03, 0);
    const info = { op, xc, ys, ya, yb };
    const g = { op, frame, xc, ys, ya, yb, yt, x0, x1, w, h, inset, lobes };
    // the moulded frame round the opening: flat, a shade lighter than the wall, with a counted row of red dots
    const fc = P.frame || P.lime;
    K.burnish(frame);
    K.lay(frame, fc, { w: 1.1, ang: 1.4 });
    // the dot row in the frame, where the opening leaves it showing, the frame's own edge, and the edge of the
    // opening: one kajal line, heavier on the upper left where the wall throws its shade in, a thin ochre rule inside
    g.edges = () => {
      const fe = A.resample(frame.slice(1, -1), 0.4, false), fl = A.along(frame.slice(1, -1), Math.max(1.05, w * 0.03), 0), d = Math.max(0.55, inset * 0.24);
      for (const q of fl) {
        const nx = -Math.sin(q.ang), ny = Math.cos(q.ang), sg = (xc - q.x) * nx + (ys - q.y) * ny > 0 ? 1 : -1, px = q.x + nx * d * sg, py = q.y + ny * d * sg;
        if (py > yb - 2 || A.inside([op], px + nx * sg * 0.45, py + ny * sg * 0.45)) continue;
        K.dot(px + A.rr(-0.04, 0.04), py + A.rr(-0.04, 0.04), P.accent || '#c8321c', Math.max(0.3, Math.min(0.46, w * 0.012)) * A.rr(0.9, 1.08));
      }
      K.path(fe, 0.3, { cx: xc, cy: ys, c: A.mix(K.INK, fc, 0.35) });
      K.path(op.slice(1, -1), 0.5, { hole: true, cx: xc, cy: ys });
      if (kind !== 'panel') A.withMask(op, () => K.chalk(A.resample(op.slice(1, -1), 0.6, false).map(p => [p[0] + (p[0] < xc ? 0.7 : -0.7), p[1] + 0.7]), A.mix(OCHRE, P.frame || '#e8c070', 0.35), 0.24, { tin: 0, tout: 0, p: 0.7 }));
    };
    if (kind === 'halo') haloBay(A, K, P, g, o);
    else if (kind === 'panel') panelBay(A, K, P, g, o);
    else if (kind === 'door') doorBay(A, K, P, g, o);
    else if (kind === 'jali') jaliBay(A, K, P, g, o);
    else if (kind === 'lamp') lampBay(A, K, P, g, o);
    else if (kind === 'jharokha') jharokhaBay(A, K, P, g, o);
    else M.w8Dark(A, op, P, yb);
    if (kind !== 'jharokha') g.edges();
    // the spandrels: a flower in each
    for (const sg of [-1, 1]) M.w8Rosette(A, xc + sg * w * 0.36, yt + h * 0.12, Math.min(w, h) * 0.07, P);
    return info;
  };

  /* ================================================================ THE INTERIOR behind a light object */
  M.w8Interior = function (A, xc, ow, yb, ys, ya, o) {
    const K = kit(A), Kk = o.key, h = yb - ya, x0 = xc - ow / 2, x1 = xc + ow / 2;
    const op = M.w8Arch(x0, x1, yb, ys, ya, o.lobes || 0);
    K.burnish(op);
    if (o.sky) {
      // the night through the bay: flat bands of blue, deepest at the top, hills, counted stars, a new moon
      K.dark(op, Kk.far);
      K.wash(op, Kk.side, (x, y) => 0.8 * sstep((y - ya - h * 0.25) / (h * 0.75)), 'over', 0.1, 0.04);
      A.withMask(op, () => {
        const hills = [[x0 - 2, yb + 2]];
        for (let x = x0 - 2; x <= x1 + 2.1; x += ow / 30) hills.push([x, yb - h * (0.1 + 0.05 * Math.sin(x * 0.09) + 0.03 * Math.sin(x * 0.23))]);
        hills.push([x1 + 2, yb + 2]);
        K.fill(hills, Kk.deep, { w: 1.2 });
        K.path(hills.slice(1, -1), 0.24, { c: A.mix(Kk.deep, '#000000', 0.3) });
        for (let i = 0; i < 40; i++) {
          const x = x0 + ((i * 0.618034 + 0.13) % 1) * ow, y = ya + (0.06 + ((i * 0.381966 + 0.07) % 1) * 0.62) * h;
          if (!A.inside(op, x, y)) continue;
          const big = i % 9 === 0, r = (0.35 + (i % 3) * 0.12) * (big ? 1.6 : 1);
          K.dot(x, y, i % 4 ? '#f2ead0' : '#cfe0f0', r);
          if (big) for (const a of [0, PI / 2]) K.chalk([[x - Math.cos(a) * r * 2.2, y - Math.sin(a) * r * 2.2], [x + Math.cos(a) * r * 2.2, y + Math.sin(a) * r * 2.2]], '#f6f0dc', r * 0.32, { tin: 0.3, tout: 0.3 });
        }
        const mx = x0 + ow * 0.84, my = ya + h * 0.36, mr = ow * 0.035;
        K.fill(circ(mx, my, mr, mr, 30), '#f6eccc'); K.fill(circ(mx + mr * 0.38, my - mr * 0.15, mr * 0.92, mr * 0.92, 30), Kk.far);
      });
    } else {
      // the room: its side walls and vault, the far wall with a smaller arch, the floor running back
      K.dark(op, Kk.side);
      const ib = yb - h * 0.12, iw = ow * 0.64, fx0 = xc - iw / 2, fx1 = xc + iw / 2, fya = ya + h * 0.16, fys = ys + h * 0.08;
      const far = M.w8Arch(fx0, fx1, ib, fys, fya, 0);
      A.withMask(op, () => {
        K.fill(far, Kk.far, { w: 1.1 });
        // the far wall's pattern: a counted lattice of small flowers, faint
        A.withMask(far, () => {
          for (let y = fya + 3, r = 0; y < ib - 2; y += 5.6, r++) for (let x = fx0 + 2.4 + (r % 2) * 2.8; x < fx1 - 1.5; x += 5.6) {
            for (let q = 0; q < 4; q++) { const a = q * PI / 2 + PI / 4; K.tip(x + Math.cos(a) * 0.5, y + Math.sin(a) * 0.5, 0.9, 0.42, a, Kk.pattern); }
            K.dot(x, y, A.mix(Kk.pattern, '#ffffff', 0.15), 0.32);
          }
        });
        const dw = iw * 0.34, door = M.w8Arch(xc - dw / 2, xc + dw / 2, ib, ib - h * 0.3, ib - h * 0.44, 0);
        K.fill(door, Kk.deep);
        K.path(door.slice(1, -1), 0.3, { hole: true, cx: xc, cy: ib - h * 0.3, c: A.mix(o.line, Kk.far, 0.2) });
        const fl = [[x0, yb], [x1, yb], [fx1, ib], [fx0, ib]];
        K.fill(fl, Kk.floor, { ang: 0.05 });
        K.wash(fl, '#f0c890', (x, y) => 0.22 * sstep((y - ib) / (yb - ib)), 'over', 0.1, 0);
        for (const sg of [-1, 1]) K.hair([[xc + sg * iw / 2, ib], [xc + sg * iw / 2, fys]], 0.24, { c: A.mix(o.line, Kk.side, 0.25) });
        K.hair([[fx0, ib], [fx1, ib]], 0.22, { c: A.mix(o.line, Kk.side, 0.25) });
        K.path(far.slice(1, -1), 0.28, { hole: true, cx: xc, cy: fys, c: A.mix(o.line, Kk.side, 0.25) });
        if (o.lampSide != null) {
          const lx = xc + ow * o.lampSide, ly = yb - h * (o.lampH || 0.4), nw = ow * 0.05;
          const niche = M.w8Arch(lx - nw, lx + nw, ly + nw * 1.2, ly - nw * 0.4, ly - nw * 1.4, 0);
          glow(K, op, lx, ly, ow * 0.2, ow * 0.2, 0.7);
          K.fill(niche, Kk.deep);
          K.wash(niche, '#f0a040', (x, y) => 0.6 * (1 - sstep(Math.hypot(x - lx, y - ly - nw * 0.6) / (nw * 1.6))), 'over', 0.1, 0);
          M.w8Flame(A, lx, ly + nw * 0.7, nw * 0.9);
          K.fill(circ(lx, ly + nw * 0.9, nw * 0.5, nw * 0.2, 20).filter(p => p[1] >= ly + nw * 0.9), '#9a5a2a');
          K.path(niche.slice(1, -1), 0.24, { hole: true, cx: lx, cy: ly, c: o.line });
          if (o.lamps) o.lamps.push([lx, ly + nw * 0.2]);
        }
        // the vault in shade, deepest at the crown
        K.wash(op, '#000000', (x, y) => 0.4 * (1 - sstep((y - ya) / (h * 0.45))), 'mul', 0.08, 0);
      });
    }
    K.path(op.slice(1, -1), 0.5, { hole: true, cx: xc, cy: ys, c: o.line });
    return op;
  };

  /* ================================================================ THE WALL THE SPOUTS COME OUT OF */
  M.w8SpoutWall = function (A, b, R, P, mouths) {
    const K = kit(A), x0 = b.x0, x1 = b.x1, yt = R.arT, yb = R.arB, w = x1 - x0, h = yb - yt;
    const pan = rect(x0 + w * 0.03, yt + h * 0.02, x1 - w * 0.03, yb), st = A.mix(P.stone, P.lime, 0.32);
    K.burnish(pan);
    K.lay(pan, st, { w: 1.2, ang: 1.45 });
    // the courses of the stone, drawn
    const inc = A.mix(P.line, st, 0.55), cH = h / 7;
    A.withMask(pan, () => {
      for (let k = 1; k < 7; k++) {
        const y = yt + h * 0.02 + k * cH; K.hair([[pan[0][0], y], [pan[1][0], y]], 0.2, { c: inc, p: 0.65 });
        for (let x = pan[0][0] + (k % 2 ? 6 : 0) + 6; x < pan[1][0]; x += 12) K.hair([[x, y - cH + 0.2], [x, y - 0.2]], 0.18, { c: inc, p: 0.55 });
      }
      // under each mouth the water has darkened the stone: a soft painted stain, greener, longest in the middle
      for (const m of (mouths || [])) K.wash(pan, A.mix('#2a4030', P.stoneDeep, 0.3), (x, y) => y < m[1] ? 0 : 0.5 * Math.max(0, 1 - Math.abs(x - m[0]) / 3.2) * (1 - sstep((y - m[1]) / (h * 0.6))), 'over', 0.12, 0.05);
    });
    // a band of lotus petals along the top
    const by0 = yt + h * 0.02, by1 = by0 + 3.2;
    K.fill(rect(pan[0][0], by0, pan[1][0], by1), A.mix(P.stone, '#000000', 0.15), { ang: 0 });
    for (let x = pan[0][0] + 1.2; x < pan[1][0] - 0.6; x += 2.2) { const pt = almond(x, by1 - 0.3, 2.4, 1.5, -PI / 2, 0.8); K.fill(pt, A.mix(P.lime, P.stone, 0.4)); K.hair(pt.concat([pt[0]]), 0.15, { c: inc }); }
    K.ink(pan, 0.45, { c: A.mix(K.INK, P.stone, 0.2) });
    const inn = rect(x0 + w * 0.05, by1 + 1.2, x1 - w * 0.05, yb - h * 0.02);
    K.hair(inn.concat([inn[0]]), 0.22, { c: A.mix(P.line, P.stone, 0.4) });
  };

  /* ================================================================ THE QUIET GROUNDS behind the focal objects
     plain plaster laid flat in the wall's own colour let down, its courses drawn in fine lines, a ruled border; for
     a light object, one deep arch behind it.  They must stay quiet: no ornament that would pull the eye. */
  function plaster(A, K, face, pl, line, x0, x1, yt, yb, seed) {
    K.burnish(face);
    K.lay(face, pl, { w: 1.3, ang: 1.45, passes: 3 });
    // light from the upper left: the face a little darker under the frieze and toward the right
    K.wash(face, A.mix(pl, '#5a4a40', 0.4), (x, y) => 0.18 * (1 - sstep((y - yt) / ((yb - yt) * 0.3))) + 0.08 * sstep((x - x0) / (x1 - x0)), 'mul', 0.12, 0.04);
    const inc = A.mix(line, pl, 0.72), h = yb - yt, cH = h / 6;
    A.withMask(face, () => {
      for (let k = 1; k < 6; k++) {
        const y = yt + k * cH + Math.sin(k * 7.1 + seed) * 0.3;
        K.hair([[x0, y], [x1, y + Math.sin(k * 3.7 + seed) * 0.25]], 0.2, { c: inc, p: 0.55 });
        const off = ((k * 0.618 + seed * 0.1) % 1) * 15;
        for (let x = x0 + off; x < x1; x += 15 + Math.sin(x + k) * 0.8) K.hair([[x, y - cH + 0.3], [x + 0.1, y - 0.3]], 0.18, { c: inc, p: 0.45 });
      }
    });
    const bd = rect(x0 + 1.4, yt + 1.4, x1 - 1.4, yb - 0.6);
    K.hair(bd.concat([bd[0]]), 0.2, { c: A.mix(line, pl, 0.6), p: 0.6 });
  }
  M.w8y.iwan = Object.assign(function (A, L, b, wp, pal, H) {
    const K = kit(A), mix = H.STAGE_mix;
    const x0 = b.x0 + L.pw * 0.55, x1 = b.x1 - L.pw * 0.55, yt = L.arT, yb = L.arB, w = x1 - x0, h = yb - yt, xc = (x0 + x1) / 2;
    const plain = b.quiet === 'plain', pl = plain ? mix(pal.lime, wp.stone, 0.26) : mix(wp.stone, '#8a7c70', 0.24), face = H.rect(x0, yt, x1, yb);
    plaster(A, K, face, pl, pal.line, x0, x1, yt, yb, b.x0 * 0.01);
    // the lotus kund (L5, left of the stair) fills its bay to the cornice: a deep room behind it showed only as a
    // dark lobed shape over the kund's crown.  That bay keeps the plain L5 wall.
    const kund = L.k === 5 && b.side === -1 && b.quiet === 'dark';
    if (!plain && !kund) {
      const ow = Math.min(w * 0.88, b.ow || w * 0.7), ys = yt + h * 0.3, ya = yt + h * 0.05;
      const fr = M.w8Arch(xc - ow / 2 - 3, xc + ow / 2 + 3, yb, ys, ya - 3, 0);
      const fc = mix(wp.frame, '#9a8c7c', 0.28);
      K.burnish(fr); K.lay(fr, fc, { w: 1.1, ang: 1.4 });
      const KY = H.INTERIOR[L.id] || H.INTERIOR.y2019;
      const room = M.w8Interior(A, xc, ow, yb, ys, ya, { key: KY, sky: !!KY.sky, lobes: 9, line: pal.line, lampSide: KY.lampSide, lampH: KY.lampH, lamps: pal.lamps });
      if (pal.darkOps) pal.darkOps.push(room);
      K.path(fr.slice(1, -1), 0.3, { cx: xc, cy: ys, c: mix(pal.line, fc, 0.4) });
    }
    K.ink(face, 0.36, { c: mix(pal.line, pl, 0.45) });
  }, { part: 'bays' });

  M.w8y.hall = Object.assign(function (A, L, b, wp, pal, H) {
    const K = kit(A), mix = H.STAGE_mix;
    const x0 = b.x0 + L.pw * 0.55, x1 = b.x1 - L.pw * 0.55, yt = L.arT, yb = L.arB, w = x1 - x0, h = yb - yt;
    const n = Math.max(3, Math.round(w / 68)), pw = L.pw * 0.7, pl = mix(wp.stone, '#7a6a60', 0.26), at = [b.x0];
    plaster(A, K, H.rect(x0, yt, x1, yb), pl, pal.line, x0, x1, yt, yb, 3.1);
    const fc = mix(wp.frame, '#8a7a6c', 0.3), dark = '#160a08';
    for (let i = 0; i < n; i++) {
      const a = x0 + i * w / n + pw * 0.6, c = x0 + (i + 1) * w / n - pw * 0.6, ys = yt + h * 0.26, op = M.w8Arch(a, c, yb, ys, yt + h * 0.04, 9);
      const fr = M.w8Arch(a - 1.6, c + 1.6, yb, ys, yt + h * 0.04 - 2.2, 0), xc = (a + c) / 2;
      K.burnish(fr); K.lay(fr, fc, { w: 1.1, ang: 1.4 });
      K.path(fr.slice(1, -1), 0.28, { cx: xc, cy: ys, c: mix(pal.line, fc, 0.4) });
      K.burnish(op);
      K.dark(op, dark);
      K.wash(op, '#3c2014', (x, y) => 0.45 * sstep((y - ys) / (yb - ys)), 'over', 0.1, 0.04);
      K.path(op.slice(1, -1), 0.5, { hole: true, cx: xc, cy: ys, c: pal.line });
    }
    for (let i = 1; i < n; i++) { const px = x0 + i * w / n; M.w8Pillar(A, px, yt, yb, pw, pal); at.push(px); }
    at.push(b.x1);
    return at;
  }, { part: 'bays' });
  // timing, only when asked (BAYS_PROF=1): where the bays spend their time
  if (typeof process !== 'undefined' && process.env && process.env.BAYS_PROF) {
    const T = {};
    for (const k of ['w8Bay', 'w8JaliScreen', 'w8Dark', 'w8Halo', 'w8Jharokha', 'w8Miniature', 'w8Rosette', 'w8Flower', 'w8Interior', 'w8SpoutWall']) {
      const f = M[k];
      M[k] = function () { const t = Date.now(), key = k === 'w8Bay' ? 'bay:' + arguments[2] : k; try { return f.apply(this, arguments); } finally { T[key] = (T[key] || 0) + Date.now() - t; } };
    }
    for (const k of ['iwan', 'hall']) { const f = M.w8y[k]; M.w8y[k] = Object.assign(function () { const t = Date.now(); try { return f.apply(this, arguments); } finally { T[k] = (T[k] || 0) + Date.now() - t; } }, { part: 'bays' }); }
    process.on('exit', () => console.error('BAYS_PROF ' + JSON.stringify(T)));
  }
})();
