(function () {
  'use strict';
  /* ==========================================================================
     THE LOTUS KUND (the NIT Trichy stop), painted the folio way: each part laid in
     one clean flat colour, then one kajal contour heavy on the shadow side and thin
     into the light, then its ornament ruled and counted, then the gold.
     A Mewar stepped tank seen from the front and tipped up so the water shows.  At the
     back a wall of lit cusped niches under a red crest and a row of kangura, a
     bangaldar pavilion on the axis with a pennant, and a bastion at each corner with a
     small chhatri; four courses of steps on three sides, cream treads and geru risers
     mitred at the corners, going on pale under the water; deep teal water ruled in rows
     of little arcs and crowded with veined pads, pink lotuses, buds and white lotuses;
     in front a low parapet of rosette and jali panels between two tall corner chhatris.
     Local frame (stage-well8k.js kundZ): origin at the foot centre, y up is negative,
     1 unit = 0.85 sheet units; the box is x -150..150, y -150..0.  Light from the upper left.
     ======================================================================== */
  M.w8x = M.w8x || {};
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const KW = 1.7, INKW = 1.3;

  const C = {
    lime: '#f4ead4', limeLit: '#fff8ea', limeSh: '#cdb898', limeDeep: '#9c8670',
    tread: '#efdcb2', riser: '#a4482e', riserLit: '#c0623e', riserD: '#7a2e22', geru: '#b0603e',
    hingul: '#c8382a', lac: '#7c1c30', haldi: '#edc94b', saffron: '#ec8a2a', marigold: '#f3a21c',
    mal: '#2e7a4e', malD: '#1d5636',
    water: '#145566', waterD: '#0a3442', waterL: '#23787e', rip: '#d6efe8',
    pad: ['#4f9a45', '#5aa44a', '#468e46', '#3f8a52'], padL: '#9cc868', padUp: '#c6d98c', padLine: '#173a24',
    niche: '#3c1a22', room: '#22122a', clay: '#b0522c', clayL: '#e0915a',
    sap: '#5c9a40', bottle: '#1f4a2a'
  };
  const PINK = { c: ['#f4a8ba', '#ef9cb0', '#f3b4c2'], tip: '#c42a52', baseC: '#fff2ee', line: '#6e1a34', vein: '#c23a62' };
  const WHITE = { c: ['#fbf7ee', '#f7f3ea', '#f2f0ea'], tip: null, baseC: '#b4c2de', line: '#3a4060', vein: '#8a94b0' };
  const SEPAL = { c: ['#5c9a40', '#4f8e3c'], tip: null, baseC: null, line: '#1f4a2a', vein: '#2c5e30' };

  // the plan of the tank
  const YF = -30;                    // top of the front parapet
  const FW = -104, FWT = -118;       // the far wall: its foot (the top of the first step) and its top
  const CREST = -121.5;              // top of the red crest over it
  const NC = 4, CH = 4.6, CW = 6, RH = 1.7, RW = 1.9, SX = 124;   // courses: count, far height, side width, riser
  const WX = SX - NC * CW, WT = FW + NC * CH;                     // the water: x -100..100, from y -85.6 down

  const R = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const ell = (cx, cy, rx, ry, rot, a0, a1) => {
    ry = ry == null ? rx : ry; a0 = a0 == null ? 0 : a0; a1 = a1 == null ? TAU : a1; rot = rot || 0;
    const n = Math.max(18, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 0.2)), cr = Math.cos(rot), sr = Math.sin(rot), out = [];
    for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n, x = Math.cos(t) * rx, y = Math.sin(t) * ry; out.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); }
    return out;
  };
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
  const xf = (pts, bx, by, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return pts.map(p => [bx + p[0] * c - p[1] * s, by + p[0] * s + p[1] * c]); };

  function kit(Z, o) {
    const INK = Z.mix('kajal', 'neel', 0.12), KJ = Z.tool('kajal', { wmin: 0.3 });
    const K = { INK, KJ, o };
    // a flat ground laid with the tip of the stick in crossing passes, rubbed into the tooth
    K.lay = (p, c, o2) => Z.fill(p, 'pastel', c, Object.assign({ w: 1.2, p: 1, reach: 1.7, gap: 0.4, passes: 3, ang: -0.5, turn: 0.5, cv: 0.01, streak: 0.12 }, o2 || {}));
    // a dark ground (a room, the back of a niche): laid twice and smooth, so no tooth shows through as rain
    K.dark = (p, c) => { K.lay(p, c, { w: 0.7, passes: 3, ang: 1.5, streak: 0.02, cv: 0.006 }); K.lay(p, c, { w: 0.6, passes: 2, ang: 0.2, streak: 0.02, cv: 0.006 }); };
    K.wash = (p, c, f, mode) => M.floorWash(Z, p, c, f, mode || 'mul');
    // the contour, laid in two goes: one unbroken line of even weight all round, then a second pass over it that
    // swells where the form turns from the light (right and below) and thins where it turns into it
    K.ink = (poly, w, o2) => {
      o2 = o2 || {};
      const P = Z.resample(poly, o2.step || 0.5, true), n = P.length;
      if (n < 4) return;
      w = (w || 0.34) * KW * INKW;
      const c = o2.c || INK;
      let cx = 0, cy = 0; for (const p of P) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
      const sw = P.map((p, i) => {
        const a = P[(i - 2 + n) % n], b = P[(i + 2) % n];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
        return clamp((nx * 0.78 + ny * 0.62 + 0.15) / 0.95, 0, 1);
      });
      const ring = P.concat(P.slice(0, 3)), swr = sw.concat(sw.slice(0, 3));
      Z.stroke(ring.map(p => [p[0], p[1]]), KJ, c, { w: w * 0.6, p: 1, tin: 0, tout: 0, wob: 0.22 });
      Z.stroke(ring.map((p, i) => [p[0], p[1], 0.42 + 0.58 * swr[i]]), KJ, c, { w, p: 1, tin: 0, tout: 0, wob: 0.22 });
    };
    K.line = (p, w, o2) => Z.stroke(p, KJ, (o2 && o2.c) || INK, Object.assign({ p: 0.92, wob: 0.35, tin: 0.06, tout: 0.08 }, o2, { w: (w || 0.3) * KW * 1.15 }));
    K.hair = (p, w, o2) => Z.stroke(p, KJ, (o2 && o2.c) || Z.mix(INK, C.lime, 0.18), Object.assign({ p: 0.72, tin: 0.06, tout: 0.08 }, o2, { w: (w || 0.2) * KW }));
    // burnish the paper under a surface before it is painted, so only the fine even tooth shows
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
            const i = Y * W + X, v = 0.5 + clamp((HM[i] - mean) * 0.55, -0.13, 0.13);
            HM[i] += (v - HM[i]) * d / 255;
          }
        }
      }
    };
    K.dot = (x, y, c, w, o2) => Z.dot(x, y, 'chalk', c, Object.assign({ w: w || 1.2, p: 0.95 }, o2));
    // a ruled row of dots along a path, laid one by one: each a hair off in place and size, never a stamp
    K.dots = (path, step, c, w, o2) => {
      o2 = o2 || {};
      for (const q of Z.along(path, step, 0)) {
        if (o2.skip && o2.skip(q)) continue;
        K.dot(q.x + Z.rr(-0.07, 0.07) * step, q.y + Z.rr(-0.05, 0.05) * step, c, w * Z.rr(0.88, 1.1), { p: Z.rr(0.86, 1) });
      }
    };
    K.goldDot = (x, y, w) => Z.dot(x, y, 'gold', 'gold', { w: (w || 1.2) * Z.rr(0.92, 1.06), p: 1 });
    // gold leaf laid as a line: burnished, its edge a little broken where the leaf did not take
    K.leafLine = (pts, w) => {
      const r = Z.along(pts, Math.max(1.2, w * 2), 0).map(q => [q.x, q.y]);
      let i = 0;
      while (i < r.length - 1) {
        const n = Math.max(2, Math.round(r.length * Z.rr(0.22, 0.4))), seg = r.slice(i, Math.min(r.length, i + n + 1));
        if (seg.length > 1) { if (i === 0 && o && o.leaf) o.leaf(seg, w); else Z.stroke(seg, 'gold', 'gold', { w: w * Z.rr(0.9, 1.05), p: 1, tin: 0.04, tout: 0.08 }); }
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
    // a carved rosette of eight petals, each its own stroke, a gold heart
    K.rosette = (x, y, r, petal, heart, line) => {
      const a0 = Z.rr(-0.06, 0.06);
      for (let i = 0; i < 8; i++) {
        const a = a0 + i * TAU / 8 + Z.rr(-0.04, 0.04), l = r * Z.rr(0.95, 1.04);
        const pts = xf([[0, -0.1], [-l * 0.2, -l * 0.35], [-l * 0.16, -l * 0.72], [0, -l], [l * 0.16, -l * 0.72], [l * 0.2, -l * 0.35], [0, -0.1]], x, y, a);
        const p = Z.spline(pts, true, 0.12);
        Z.fill(p, 'pastel', petal, { w: 0.5, p: 1, reach: 1.6, passes: 2, ang: a - PI / 2 });
        K.hair(p.concat([p[0]]), 0.1, { c: line, p: 0.8 });
        K.hair([[x + Math.sin(a) * l * 0.2, y - Math.cos(a) * l * 0.2], [x + Math.sin(a) * l * 0.66, y - Math.cos(a) * l * 0.66]], 0.07, { c: Z.mix(line, petal, 0.4), p: 0.6 });
      }
      K.goldDot(x, y, r * 0.42);
      K.dot(x - r * 0.06, y - r * 0.07, C.haldi, r * 0.16);
    };
    // shade down the right of a form, light up its left, inside its mask
    K.model = (poly, x0, x1, y0, y1, sh, lit, k) => {
      k = k == null ? 1 : k;
      Z.withMask(poly, () => {
        const w = x1 - x0;
        Z.fill(R(x1 - w * 0.32, y0 - 1, x1 + 1, y1 + 1), 'shade', sh, { w: Math.min(2.4, w * 0.3), p: 0.5 * k, passes: 1, ang: 1.5 });
        Z.fill(R(x1 - w * 0.12, y0 - 1, x1 + 1, y1 + 1), 'shade', sh, { w: Math.min(2, w * 0.2), p: 0.42 * k, passes: 1, ang: 1.5 });
        if (lit) Z.stroke([[x0 + w * 0.12, y0 - 0.5], [x0 + w * 0.12, y1 + 0.5]], 'chalk', lit, { w: Math.min(1.6, w * 0.12), p: 0.5 * k, tin: 0.1, tout: 0.1 });
      });
    };
    return K;
  }

  /* ------------------------------------------------------------------ a clay diya and its flame */
  function flame(Z, K, fx, fy, h, lean) {
    const tear = (hh, wd) => {
      const pts = [];
      for (let i = 0; i <= 14; i++) { const t = i / 14, hw = wd * 2 * Math.sqrt(t) * (1 - t); pts.push([fx + lean * t * t * hh + hw, fy - t * hh]); }
      for (let i = 13; i >= 1; i--) { const t = i / 14, hw = wd * 2 * Math.sqrt(t) * (1 - t); pts.push([fx + lean * t * t * hh - hw, fy - t * hh]); }
      return pts;
    };
    Z.fill(tear(h, h * 0.3), 'chalk', '#e2622a', { w: Math.max(0.3, h * 0.2), p: 0.95, reach: 1.7, passes: 2, ang: 1.5 });
    Z.fill(tear(h * 0.78, h * 0.21), 'chalk', '#f6c045', { w: Math.max(0.25, h * 0.15), p: 1, reach: 1.7, passes: 2, ang: 1.5 });
    Z.fill(tear(h * 0.46, h * 0.12), 'chalk', '#fff6dc', { w: Math.max(0.2, h * 0.1), p: 1, reach: 1.7, passes: 1, ang: 1.5 });
    K.hair([[fx, fy + 0.15], [fx + lean * 0.3, fy - h * 0.16]], 0.08, { c: '#2a1206', p: 0.9 });
  }
  function diya(Z, K, x, y, s, lean) {
    const bowl = Z.spline([[x - 0.5 * s, y - 0.3 * s], [x - 0.3 * s, y - 0.05 * s], [x, y], [x + 0.3 * s, y - 0.05 * s], [x + 0.52 * s, y - 0.3 * s], [x + 0.66 * s, y - 0.46 * s], [x + 0.36 * s, y - 0.36 * s], [x, y - 0.33 * s], [x - 0.42 * s, y - 0.34 * s]], true, 0.06);
    Z.fill(bowl, 'pastel', C.clay, { w: Math.max(0.3, s * 0.18), p: 1, reach: 1.6, passes: 2, ang: 0 });
    Z.stroke([[x - 0.38 * s, y - 0.16 * s], [x + 0.36 * s, y - 0.14 * s]], 'shade', '#5a2414', { w: s * 0.16, p: 0.5 });
    Z.stroke([[x - 0.4 * s, y - 0.3 * s], [x + 0.3 * s, y - 0.31 * s]], 'chalk', C.clayL, { w: s * 0.07, p: 0.85 });
    K.ink(bowl, 0.1, { step: 0.25 });
    const fx = x + 0.55 * s, fy = y - 0.44 * s, h = s * 0.95;
    flame(Z, K, fx, fy, h, lean || 0.12);
    if (K.o && K.o.lamp) K.o.lamp(fx, fy - h * 0.45);
  }

  /* ------------------------------------------------------------------ a niche in the wall with its lamp */
  function niche(Z, K, x, base, w, h) {
    const fr = cusped(x, base + 0.2, w + 2.2, h + 1.5, 5, w * 0.075), ar = cusped(x, base, w, h, 5, w * 0.08);
    K.lay(fr, C.limeLit, { w: 0.6, passes: 2, ang: 1.5 });
    K.burnish(ar); K.dark(ar, C.niche);
    // the lamp lights the back of the niche: warm low down, falling off up into the arch
    const gy = base - h * 0.28;
    K.wash(ar, '#c8602a', (px, py) => 0.85 * Math.max(0, 1 - Math.hypot((px - x) / (w * 0.78), (py - gy) / (h * 0.62))), 'over');
    K.wash(ar, '#f2b040', (px, py) => 0.7 * Math.max(0, 1 - Math.hypot((px - x) / (w * 0.42), (py - gy) / (h * 0.36))), 'over');
    Z.withMask(ar, () => Z.stroke([[x - w * 0.6, base - 0.35], [x + w * 0.6, base - 0.35]], 'chalk', '#f6c868', { w: 0.5, p: 0.7, tin: 0.2, tout: 0.2 }));
    diya(Z, K, x - w * 0.14, base - 0.25, w * 0.42, 0.1);
    K.ink(ar, 0.15);
    // a row of red dots round the moulding, counted
    const mid = cusped(x, base + 0.1, w + 1.1, h + 0.75, 5, w * 0.078);
    K.dots(mid.slice(1, -1), 1.15, C.hingul, 0.42);
    K.hair(fr.slice(0), 0.12);
  }

  /* ------------------------------------------------------------------ a chhatri: pillars, eave, ribbed dome, gold finial */
  function chhatri(Z, K, o, cx, yb, s) {
    const { pw, ph, pwid, ew, eh, drh, dw, dh, fh } = s;
    const yC = yb - ph, yE = yC - eh, yD = yE - drh;
    // the bay: lime spandrels round a cusped opening onto the dark inside
    const bay = R(cx - pw, yC, cx + pw, yb);
    K.burnish(bay);
    K.lay(bay, C.lime, { w: 0.9, ang: 1.5 });
    const op = cusped(cx, yb, 2 * (pw - pwid) - 0.3, ph - 1.3, 5, 0.42 * s.k);
    K.dark(op, C.room);
    if (s.lamp) {
      const gy = yb - ph * 0.3;
      K.wash(op, '#b8582a', (px, py) => 0.8 * Math.max(0, 1 - Math.hypot((px - cx) / (pw * 0.8), (py - gy) / (ph * 0.55))), 'over');
      K.wash(op, '#f0aa3c', (px, py) => 0.65 * Math.max(0, 1 - Math.hypot((px - cx) / (pw * 0.4), (py - gy) / (ph * 0.3))), 'over');
      diya(Z, K, cx - 1.4, yb - 0.3, 4.2, -0.08);
    }
    K.ink(op, 0.16);
    K.dots(cusped(cx, yb - 0.2, 2 * (pw - pwid) + 1.1, ph - 0.5, 5, 0.42 * s.k).slice(2, -2), 1.3, C.hingul, 0.45);
    // two pillars, each with a pot base and a bracket capital
    for (const sg of [-1, 1]) {
      const x0 = sg < 0 ? cx - pw : cx + pw - pwid, x1 = x0 + pwid, pil = R(x0, yC, x1, yb);
      K.lay(pil, C.limeLit, { w: 0.5, passes: 2, ang: 1.57 });
      K.model(pil, x0, x1, yC, yb, C.limeSh, null, 0.9);
      Z.stroke([[x0 + pwid * 0.5, yC + 2.4], [x0 + pwid * 0.5, yb - 2.4]], 'chalk', C.hingul, { w: 0.36, p: 0.85, tin: 0.05, tout: 0.05 });
      K.ink(pil, 0.13);
      const base = R(x0 - 0.5, yb - 1.7, x1 + 0.5, yb), cap = R(x0 - 0.6, yC, x1 + 0.6, yC + 1.5);
      for (const b of [base, cap]) { K.lay(b, C.lime, { w: 0.4, passes: 2, ang: 0 }); K.ink(b, 0.12); }
      K.goldDot(x0 + pwid * 0.5, yC + 0.75, 0.55);
      K.goldDot(x0 + pwid * 0.5, yb - 0.85, 0.55);
    }
    K.ink(bay, 0.2);
    // the eave: a thin slab over a sloping underside, a row of red beads under its lip
    const under = [[cx - ew + 0.6, yE + eh * 0.42], [cx + ew - 0.6, yE + eh * 0.42], [cx + pw + 0.5, yC], [cx - pw - 0.5, yC]];
    K.lay(under, C.limeSh, { w: 0.6, passes: 2, ang: 0 });
    K.dots([[cx - ew + 1.6, yE + eh * 0.7], [cx + ew - 1.6, yE + eh * 0.7]], 1.25, C.hingul, 0.4);
    K.ink(under, 0.12);
    const slab = R(cx - ew, yE, cx + ew, yE + eh * 0.42);
    K.lay(slab, C.limeLit, { w: 0.6, passes: 2, ang: 0 });
    Z.withMask(slab, () => Z.stroke([[cx + ew * 0.3, yE + eh * 0.3], [cx + ew, yE + eh * 0.3]], 'shade', C.limeSh, { w: 1, p: 0.5 }));
    K.ink(slab, 0.18);
    // the drum
    const drum = R(cx - dw * 0.94, yD, cx + dw * 0.94, yE);
    K.lay(drum, C.lime, { w: 0.5, passes: 2, ang: 0 });
    K.ink(drum, 0.12);
    // the dome: a profile a little fuller than a half circle, drawn to a point
    const prof = [[0.922, 0], [1, 0.124], [1, 0.307], [0.905, 0.511], [0.724, 0.7], [0.483, 0.86], [0.224, 0.96], [0, 1]];
    const hwAt = yy => { const v = (yD - yy) / dh; for (let i = 1; i < prof.length; i++) if (v <= prof[i][1]) { const a = prof[i - 1], c = prof[i], f = (v - a[1]) / (c[1] - a[1]); return dw * lerp(a[0], c[0], clamp(f, 0, 1)); } return 0; };
    const dome = Z.spline(prof.map(p => [cx - p[0] * dw, yD - p[1] * dh]).concat(prof.slice(0, -1).reverse().map(p => [cx + p[0] * dw, yD - p[1] * dh])), true, 0.25);
    K.burnish(dome);
    K.lay(dome, C.lime, { w: 0.8, ang: 0.6 });
    const meridian = (phi, off) => { const pts = []; for (let yy = yD - 0.2; yy >= yD - dh + 0.4; yy -= 0.3) pts.push([cx + hwAt(yy) * Math.sin(phi) + off, yy]); return pts; };
    Z.withMask(dome, () => {
      Z.stroke(ell(cx + dw * 0.5, yD - dh * 0.45, dw * 0.68, dh * 0.62, 0, -1.4, 1.5), 'shade', C.limeSh, { w: dw * 0.42, p: 0.45 });
      Z.stroke(ell(cx - dw * 0.18, yD - dh * 0.42, dw * 0.74, dh * 0.45, 0, 3.3, 4.5), 'chalk', C.limeLit, { w: Math.max(0.5, dw * 0.12), p: 0.6, tin: 0.3, tout: 0.3 });
      for (let k = -3; k <= 3; k++) {
        const phi = k * PI / 7.4, sh = 0.3 + 0.16 * (k + 3) / 6;
        Z.stroke(meridian(phi, dw * 0.07), 'side', C.limeSh, { w: Math.max(1.2, dw * 0.14), p: sh, tin: 0.15, tout: 0.4 });
        K.hair(meridian(phi, 0), 0.08, { p: 0.55, tin: 0.1, tout: 0.4 });
        Z.stroke(meridian(phi, -dw * 0.035), 'chalk', k < 1 ? C.limeLit : Z.mix(C.lime, C.limeSh, 0.25), { w: 0.3, p: 0.75, tin: 0.1, tout: 0.4 });
      }
    });
    // a ring of lotus petals over the foot of the dome, counted
    const np = s.np || 9, pw2 = dw * 1.84 / np;
    for (let i = 0; i < np; i++) {
      const px = cx - dw * 0.92 + (i + 0.5) * pw2, pet = Z.spline([[px - pw2 * 0.5, yD + 0.05], [px - pw2 * 0.4, yD - drh * 0.9], [px, yD - drh * 1.6], [px + pw2 * 0.4, yD - drh * 0.9], [px + pw2 * 0.5, yD + 0.05]], true, 0.12);
      K.lay(pet, i > np * 0.62 ? Z.mix(C.lime, C.limeSh, 0.4) : C.limeLit, { w: 0.35, passes: 2, ang: 1.5 });
      K.hair(pet.concat([pet[0]]), 0.09, { p: 0.8 });
    }
    K.ink(dome, s.k > 0.9 ? 0.26 : 0.2);
    // the finial: an upturned lotus cap, a kalash, a bead and a spike, all gold
    const ft = yD - dh;
    const cap = Z.spline([[cx - dw * 0.2, ft + 0.35], [cx - dw * 0.11, ft - fh * 0.12], [cx, ft - fh * 0.16], [cx + dw * 0.11, ft - fh * 0.12], [cx + dw * 0.2, ft + 0.35]], true, 0.1);
    Z.fill(cap, 'gold', 'gold', { w: 0.5, p: 1, reach: 1.5, passes: 2 });
    K.goldDot(cx, ft - fh * 0.32, fh * 0.3);
    K.goldDot(cx, ft - fh * 0.56, fh * 0.17);
    K.leafLine([[cx, ft - fh * 0.62], [cx, ft - fh]], Math.max(0.35, fh * 0.07));
    K.hair(cap.concat([cap[0]]), 0.08, { c: '#4a3010', p: 0.7 });
    Z.stroke([[cx - fh * 0.08, ft - fh * 0.4], [cx - fh * 0.05, ft - fh * 0.3]], 'chalk', C.limeLit, { w: 0.22, p: 0.7 });
    return ft - fh;
  }

  /* ------------------------------------------------------------------ the bangaldar on the axis: three bays under a curved roof */
  function bangla(Z, K, o, cx, yb) {
    const w = 26, ph = 11, bw = 2 * w / 3;
    const pl = R(cx - w - 1.2, yb - 2.2, cx + w + 1.2, yb);
    K.burnish(R(cx - w - 1.2, yb - 26, cx + w + 1.2, yb));
    K.lay(pl, C.lime, { w: 0.7, passes: 2, ang: 0 });
    K.dots([[cx - w, yb - 1.1], [cx + w, yb - 1.1]], 1.6, C.hingul, 0.45);
    K.ink(pl, 0.18);
    const y0 = yb - 2.2, yC = y0 - ph, body = R(cx - w, yC, cx + w, y0);
    K.lay(body, C.lime, { w: 0.9, ang: 1.5 });
    for (let k = -1; k <= 1; k++) {
      const ax = cx + k * bw, op = cusped(ax, y0, bw - 3.6, ph - 1.6, 5, 0.38);
      K.dark(op, C.room);
      if (k === 0) {
        // a bell hung in the middle bay
        const by = yC + ph * 0.42;
        K.hair([[ax, yC + 1.6], [ax, by - 1.2]], 0.08, { c: C.haldi, p: 0.9 });
        const bell = Z.spline([[ax - 1.1, by + 0.4], [ax - 0.8, by - 0.6], [ax, by - 1.3], [ax + 0.8, by - 0.6], [ax + 1.1, by + 0.4]], true, 0.08);
        Z.fill(bell, 'gold', 'gold', { w: 0.4, p: 1, passes: 2 });
        K.hair(bell.concat([bell[0]]), 0.07, { c: '#4a3010', p: 0.7 });
        if (o.bell) o.bell(ax, by, 1.2);
      }
      K.ink(op, 0.14);
      K.dots(cusped(ax, y0 - 0.2, bw - 2.5, ph - 0.8, 5, 0.38).slice(2, -2), 1.2, C.hingul, 0.4);
    }
    // four slim pillars
    for (const px of [cx - w, cx - bw / 2, cx + bw / 2, cx + w]) {
      const x0 = px - 1.1, x1 = px + 1.1, pil = R(x0, yC, x1, y0);
      K.lay(pil, C.limeLit, { w: 0.4, passes: 2, ang: 1.57 });
      K.model(pil, x0, x1, yC, y0, C.limeSh, null, 0.8);
      K.ink(pil, 0.11);
      K.goldDot(px, yC + 0.7, 0.5);
    }
    K.ink(body, 0.22);
    // the eave and the curved roof: the eave and the ridge both bow down to the ends
    const yE = yC - 2.4, rh = 10.5, eb = 3.2, ew = w + 2.6;
    const slab = []; for (let i = 0; i <= 30; i++) { const u = -1 + 2 * i / 30; slab.push([cx + u * ew, yE + eb * u * u]); }
    for (let i = 30; i >= 0; i--) { const u = -1 + 2 * i / 30; slab.push([cx + u * (ew - 1.6), yC + 0.3 + eb * 0.5 * u * u]); }
    K.lay(slab, C.limeSh, { w: 0.5, passes: 2, ang: 0 });
    K.dots(Array.from({ length: 21 }, (_, i) => { const u = -0.92 + 1.84 * i / 20; return [cx + u * (ew - 0.8), yE + 1.2 + eb * 0.8 * u * u]; }), 1.3, C.hingul, 0.4);
    K.ink(slab, 0.14);
    const top = u => [cx + u * (ew - 0.4), yE + eb * u * u - rh * (1 - 0.78 * Math.pow(Math.abs(u), 1.6))], bot = u => [cx + u * ew, yE + eb * u * u];
    const roof = []; for (let i = 0; i <= 40; i++) roof.push(top(-1 + 2 * i / 40)); for (let i = 40; i >= 0; i--) roof.push(bot(-1 + 2 * i / 40));
    K.burnish(roof);
    K.lay(roof, C.lime, { w: 0.8, ang: 0 });
    Z.withMask(roof, () => {
      // the ribs, counted, each with its lit edge on the left and its shade on the right
      for (let j = -6; j <= 6; j++) {
        const u = j / 6.6, a = top(u), b = bot(u);
        Z.stroke([[a[0] + 0.7, a[1]], [b[0] + 0.7, b[1]]], 'side', C.limeSh, { w: 1.2, p: 0.28 + 0.12 * (j + 6) / 12, tin: 0.1, tout: 0.1 });
        K.hair([a, b], 0.08, { p: 0.6 });
        Z.stroke([[a[0] - 0.35, a[1]], [b[0] - 0.35, b[1]]], 'chalk', C.limeLit, { w: 0.28, p: 0.7, tin: 0.1, tout: 0.1 });
      }
      Z.stroke(Array.from({ length: 31 }, (_, i) => { const u = -1 + 2 * i / 30; const b = bot(u); return [b[0], b[1] - 0.9]; }), 'chalk', C.hingul, { w: 1.2, p: 0.95, tin: 0, tout: 0 });
    });
    K.dots(Array.from({ length: 31 }, (_, i) => { const u = -0.94 + 1.88 * i / 30; const b = bot(u); return [b[0], b[1] - 0.9]; }), 1.4, C.limeLit, 0.42);
    K.ink(roof, 0.26);
    K.leafLine(Array.from({ length: 31 }, (_, i) => top(-0.97 + 1.94 * i / 30)), 0.45);
    // three finials on the ridge, the middle one taller with a pennant
    for (const u of [-0.62, 0, 0.62]) {
      const p = top(u), tall = u === 0, fh = tall ? 6 : 3.6;
      const pot = Z.spline([[p[0] - 1.0, p[1] + 0.2], [p[0] - 1.1, p[1] - 0.8], [p[0], p[1] - 1.6], [p[0] + 1.1, p[1] - 0.8], [p[0] + 1.0, p[1] + 0.2]], true, 0.1);
      Z.fill(pot, 'gold', 'gold', { w: 0.4, p: 1, passes: 2 });
      K.hair(pot.concat([pot[0]]), 0.07, { c: '#4a3010', p: 0.7 });
      K.goldDot(p[0], p[1] - 2.2, 0.8);
      if (tall) {
        const pole = [[p[0], p[1] - 2.4], [p[0] + 0.05, p[1] - fh - 3.2]];
        K.line(pole, 0.11, { c: '#3a2410', p: 1, tin: 0, tout: 0 });
        // the pennant: two tails in saffron and red, a white dot on each
        const fy = p[1] - fh - 2.6, fx = p[0] + 0.2;
        const flag = Z.spline([[fx, fy], [fx + 3.2, fy + 0.6], [fx + 6.4, fy + 0.1], [fx + 5.0, fy + 1.4], [fx + 6.8, fy + 2.6], [fx + 3.2, fy + 2.4], [fx, fy + 2.9]], true, 0.12);
        K.lay(flag, C.saffron, { w: 0.4, passes: 2, ang: 0 });
        Z.withMask(flag, () => Z.stroke([[fx, fy + 2.1], [fx + 3.4, fy + 1.9], [fx + 7, fy + 2.4]], 'chalk', C.hingul, { w: 1.2, p: 1 }));
        K.dot(fx + 2.6, fy + 1.0, C.limeLit, 0.45);
        K.ink(flag, 0.11, { step: 0.25 });
        K.goldDot(p[0], p[1] - fh - 3.2, 0.6);
      } else K.leafLine([[p[0], p[1] - 2.8], [p[0], p[1] - fh]], 0.35);
    }
  }

  /* ------------------------------------------------------------------ the far wall: crest, kangura, niches */
  function farWall(Z, K) {
    const X0 = 120, wall = R(-X0, FWT, X0, FW);
    K.lay(wall, C.lime, { ang: 0.1 });
    Z.withMask(wall, () => {
      Z.stroke([[-X0, FWT + 1.0], [X0, FWT + 1.0]], 'side', C.limeSh, { w: 1.8, p: 0.55, tin: 0, tout: 0 });
      Z.stroke([[-X0, FW - 0.8], [X0, FW - 0.8]], 'chalk', C.limeLit, { w: 0.7, p: 0.8, tin: 0, tout: 0 });
    });
    K.wash(wall, C.limeDeep, x => 0.2 * sstep((x - 40) / 80), 'mul');
    // slim pilasters between the niches: two hairlines and a column of red dots between them
    for (const sg of [-1, 1]) for (const px of [26.5, 45, 63, 81, 99, 116]) {
      const x = sg * px;
      K.hair([[x - 0.75, FWT + 1.6], [x - 0.75, FW - 1.4]], 0.1);
      K.hair([[x + 0.75, FWT + 1.6], [x + 0.75, FW - 1.4]], 0.1);
      K.dots([[x, FWT + 2.2], [x, FW - 1.8]], 1.5, C.hingul, 0.42);
    }
    for (const sg of [-1, 1]) for (const nx of [36, 54, 72, 90, 107.5]) niche(Z, K, sg * nx, FW - 1.4, 6.2, 10.6);
    // the middle niche, under the pavilion: larger, a marigold toran across its head
    niche(Z, K, 0, FW - 1.4, 9.6, 11.8);
    const sw = [];
    for (let i = 0; i <= 12; i++) { const u = i / 12; sw.push([-6.4 + 12.8 * u, FWT + 1.5 + 1.9 * Math.sin(u * PI)]); }
    for (let i = 0; i < sw.length; i++) Z.dot(sw[i][0], sw[i][1], 'chalk', i % 2 ? C.haldi : C.marigold, { w: 0.85 * Z.rr(0.92, 1.06), p: 1 });
    K.ink(wall, 0.36);
    // the crest: a red band with florets and gold, then the kangura
    const crest = R(-X0, CREST, X0, FWT);
    K.lay(crest, C.hingul, { w: 0.8, ang: 0 });
    Z.withMask(crest, () => Z.stroke([[-X0, FWT - 0.5], [X0, FWT - 0.5]], 'side', C.lac, { w: 0.9, p: 0.45, tin: 0, tout: 0 }));
    for (let x = -X0 + 2.2, i = 0; x < X0 - 1; x += 3.4, i++) {
      if (Math.abs(x) < 28) { if (i % 2 === 0) K.goldDot(x, (CREST + FWT) / 2, 0.55); continue; }
      if (i % 2 === 0) K.floret(x, (CREST + FWT) / 2, 1.25, C.limeLit, C.haldi); else K.goldDot(x, (CREST + FWT) / 2, 0.6);
    }
    K.ink(crest, 0.18);
    K.leafLine([[-X0 + 0.4, CREST + 0.35], [-27.5, CREST + 0.35]], 0.4);
    K.leafLine([[27.5, CREST + 0.35], [X0 - 0.4, CREST + 0.35]], 0.4);
    for (const sg of [-1, 1]) for (let x = 30; x <= 115; x += 4.25) {
      const mx = sg * x, y0 = CREST + 0.05;
      const m = [[mx - 1.55, y0], [mx - 1.55, y0 - 2.0], [mx - 0.8, y0 - 2.0], [mx - 0.8, y0 - 3.1], [mx, y0 - 4.4], [mx + 0.8, y0 - 3.1], [mx + 0.8, y0 - 2.0], [mx + 1.55, y0 - 2.0], [mx + 1.55, y0]];
      K.lay(m, C.limeLit, { w: 0.35, passes: 2, ang: 1.5 });
      Z.withMask(m, () => Z.stroke([[mx + 0.9, y0 - 4], [mx + 0.9, y0]], 'shade', C.limeSh, { w: 0.8, p: 0.45 }));
      K.dot(mx, y0 - 1.0, C.hingul, 0.5);
      K.ink(m, 0.1, { step: 0.25 });
    }
  }

  /* ------------------------------------------------------------------ a corner bastion carrying a chhatri */
  function bastion(Z, K, o, cx) {
    const x0 = cx - 12, x1 = cx + 12, body = R(x0, FWT, x1, -100);
    K.burnish(R(x0, CREST, x1, -100));
    K.lay(body, C.lime, { w: 1, ang: 1.5 });
    K.model(body, x0, x1, FWT, -100, C.limeSh, C.limeLit, 0.8);
    const base = R(x0, -101.6, x1, -100);
    K.lay(base, C.riser, { w: 0.5, passes: 2, ang: 0 });
    K.dots([[x0 + 1, -100.8], [x1 - 1, -100.8]], 1.4, C.limeLit, 0.4);
    for (const px of [x0 + 2.6, x1 - 2.6]) { K.hair([[px, FWT + 1.4], [px, -102.2]], 0.1); K.dots([[px + (px < cx ? 1.1 : -1.1), FWT + 2], [px + (px < cx ? 1.1 : -1.1), -102.6]], 1.5, C.hingul, 0.4); }
    niche(Z, K, cx, -102.6, 7, 11.4);
    K.ink(body, 0.36);
    const cap = R(x0 - 0.6, CREST, x1 + 0.6, FWT);
    K.lay(cap, C.hingul, { w: 0.7, ang: 0 });
    for (let i = 0; i < 6; i++) { const x = x0 + 2.2 + i * (x1 - x0 - 4.4) / 5; if (i % 2 === 0) K.floret(x, (CREST + FWT) / 2, 1.2, C.limeLit, C.haldi); else K.goldDot(x, (CREST + FWT) / 2, 0.55); }
    K.ink(cap, 0.18);
    K.leafLine([[x0 - 0.2, CREST + 0.35], [x1 + 0.2, CREST + 0.35]], 0.4);
    chhatri(Z, K, o, cx, CREST, { pw: 8.4, ph: 11, pwid: 2.0, ew: 11, eh: 2.6, drh: 1.0, dw: 7.8, dh: 9.6, fh: 6, k: 0.75, np: 7 });
  }

  /* ------------------------------------------------------------------ the steps on three sides */
  function steps(Z, K) {
    for (let i = 0; i < NC; i++) {
      const ox = SX - CW * i, oy = FW + CH * i, ix = ox - CW, iy = oy + CH, rx = ix + RW, ry = iy - RH, damp = i / (NC - 1);
      const tread = [[-ox, YF], [-ox, oy], [ox, oy], [ox, YF], [rx, YF], [rx, ry], [-rx, ry], [-rx, YF]];
      const rFar = [[-rx, ry], [rx, ry], [ix, iy], [-ix, iy]], rL = [[-rx, ry], [-ix, iy], [-ix, YF], [-rx, YF]], rR = [[rx, ry], [rx, YF], [ix, YF], [ix, iy]];
      K.lay(tread, Z.mix(C.tread, C.limeSh, damp * 0.22), { w: 1.0, ang: 0.02 });
      Z.withMask(tread, () => Z.stroke([[-ox, oy + 0.5], [ox, oy + 0.5]], 'side', C.limeSh, { w: 1.0, p: 0.4, tin: 0, tout: 0 }));
      K.lay(rFar, Z.mix(C.riser, C.riserD, damp * 0.3), { w: 0.7, passes: 2, ang: 0 });
      K.lay(rL, C.riserD, { w: 0.7, passes: 2, ang: 1.57 });
      K.lay(rR, C.riserLit, { w: 0.7, passes: 2, ang: 1.57 });
      // a geru line inside each tread, its border inside its border
      K.hair([[-ox + 1.0, YF], [-ox + 1.0, oy + 1.0], [ox - 1.0, oy + 1.0], [ox - 1.0, YF]], 0.09, { c: C.geru, p: 0.75, tin: 0, tout: 0 });
      // the lit nosing of each tread over its riser
      Z.stroke([[-rx + 0.35, YF], [-rx + 0.35, ry - 0.35], [rx - 0.35, ry - 0.35]], 'chalk', C.limeLit, { w: 0.4, p: 0.8, tin: 0, tout: 0 });
      // a row of white dots along every riser
      const mx = (rx + ix) / 2, my = (ry + iy) / 2;
      K.dots([[-mx, YF - 1], [-mx, my], [mx, my], [mx, YF - 1]], 2.1, C.limeLit, 0.55);
      K.hair([[-ox, oy], [-ix, iy]], 0.1);
      K.hair([[ox, oy], [ix, iy]], 0.1);
      K.line([[-ox, YF], [-ox, oy], [ox, oy], [ox, YF]], 0.13, { tin: 0, tout: 0 });
      K.hair([[-ix, YF], [-ix, iy], [ix, iy], [ix, YF]], 0.12, { c: C.riserD, p: 0.8, tin: 0, tout: 0 });
    }
    // the top of the side walls: lime with a red inlay down the middle and white dots on it
    for (const sg of [-1, 1]) {
      const a = sg * SX, b = sg * 134, band = R(Math.min(a, b), -100, Math.max(a, b), YF);
      K.lay(band, C.lime, { w: 0.9, ang: 1.57 });
      const mx = sg * 129;
      Z.stroke([[mx, -99.5], [mx, YF + 0.5]], 'chalk', C.hingul, { w: 1.3, p: 1, tin: 0, tout: 0 });
      K.dots([[mx, -98.8], [mx, YF + 1]], 1.6, C.limeLit, 0.42);
      K.ink(band, 0.3);
    }
  }

  /* ------------------------------------------------------------------ the water and what grows on it */
  // where things sit on the water (x, y, r, notch angle, veins, turned edge or null), and what rises from it
  const PADS = [
    [-86, -77, 8.5, 0.4, 9, null], [-58, -79, 8, 2.6, 10, null], [-31, -76.5, 9, 4.2, 11, 2.0], [5, -79, 8, 1.2, 9, null],
    [33, -77, 9, 5.4, 10, 2.2], [61, -79, 8, 2.0, 11, null], [88, -76.5, 8.5, 3.4, 9, null],
    [-72, -60, 11, 5.0, 12, 1.9], [-42, -56, 10, 1.6, 11, null], [-12, -62, 10, 3.0, 12, 1.4], [21, -57.5, 11, 0.6, 12, 2.3],
    [50, -61.5, 10, 4.4, 11, null], [80, -56, 11, 2.4, 12, 0.5],
    [-86, -40, 12, 1.0, 12, 2.1], [-61, -37.5, 13, 3.9, 13, 1.7], [-29, -41, 12, 5.6, 12, 2.4], [7, -36.5, 13, 2.2, 13, 3.6],
    [40, -40, 12, 0.2, 12, 1.8], [71, -37, 13, 4.8, 13, 2.2], [92, -45, 7.5, 3.0, 9, null],
    // small young leaves in the gaps
    [-47, -46.5, 6.5, 2.8, 9, null], [-15, -50.5, 6, 0.3, 9, null], [-94, -58, 5.5, 1.6, 8, null], [94, -60.5, 5.5, 4.0, 8, null]
  ];
  const BLOOMS = [
    // [x, base y, size, kind, foot x, foot y, tilt]: three tiers, buds at the back, the big blooms in the middle, a few in front
    [-78, -83, 14, 'bud', -77, -71, -0.06], [76, -82, 14, 'bud', 75, -70, 0.05], [-40, -86, 12, 'bud', -40.5, -76.6, 0.03], [41, -86.5, 12, 'bud', 40, -77.2, -0.04],
    [-25, -73, 18, 'bud', -24, -60, 0.04], [28, -75, 17, 'bud', 29, -62, -0.05],
    [-86, -62, 21, 'half', -85, -49, 0.05], [87, -64, 20, 'half', 86, -50, -0.06],
    [-53, -67, 25, 'open', -54, -52, -0.04], [55, -66, 26, 'open', 56, -51, 0.03],
    [0, -64, 32, 'open', 1.5, -50, 0],
    [-30, -50, 15, 'bud', -29.5, -42, -0.05], [40, -50, 18, 'half', 40.5, -41.6, 0.04]
  ];
  // white lotuses sitting on the front pads: [x, base y, size, tilt, the pad's y]
  const WHITES = [[-61, -40.5, 17, -0.04, -37.5], [7, -39.5, 16, 0.02, -36.5], [71, -40, 16, 0.05, -37]];
  // two fish turning just under the surface: [x, y, length, heading (1 right, -1 left), tilt]
  const FISH = [[-11, -46.5, 10.5, -1, 0.1], [63, -50.5, 9.5, 1, -0.12]];

  function fish(Z, K, x, y, L, dir, tilt) {
    const H = L * 0.34, T = (u, v) => { const a = tilt, c = Math.cos(a), s2 = Math.sin(a); u *= dir; return [x + u * c - v * s2, y + u * s2 + v * c]; };
    const tail = Z.spline([[-L * 0.4, 0], [-L * 0.7, -H * 0.62], [-L * 0.6, 0], [-L * 0.7, H * 0.58], [-L * 0.4, 0]].map(p => T(p[0], p[1])), true, 0.1);
    K.lay(tail, '#d8642a', { w: 0.4, passes: 2, ang: tilt });
    for (const k of [-1, 0, 1]) K.hair([T(-L * 0.45, k * H * 0.08), T(-L * 0.64, k * H * 0.4)], 0.05, { c: '#7a2a10', p: 0.6 });
    K.ink(tail, 0.07, { c: '#5a2410', step: 0.2 });
    for (const sg of [-1, 1]) {
      const fin = Z.spline([[L * 0.02, sg * H * 0.42], [-L * 0.12, sg * H * 0.82], [-L * 0.2, sg * H * 0.4]].map(p => T(p[0], p[1])), true, 0.1);
      K.lay(fin, '#e07a34', { w: 0.3, passes: 2 }); K.ink(fin, 0.06, { c: '#5a2410', step: 0.2 });
    }
    const body = Z.spline([[L * 0.5, 0], [L * 0.32, -H * 0.5], [-L * 0.08, -H * 0.52], [-L * 0.36, -H * 0.2], [-L * 0.44, 0], [-L * 0.36, H * 0.2], [-L * 0.08, H * 0.52], [L * 0.32, H * 0.48]].map(p => T(p[0], p[1])), true, 0.1);
    K.lay(body, '#ea7a2c', { w: 0.5, passes: 3, ang: tilt });
    Z.withMask(body, () => {
      Z.stroke([T(L * 0.4, H * 0.3), T(-L * 0.35, H * 0.3)], 'chalk', '#f6c27a', { w: H * 0.45, p: 0.8, tin: 0.2, tout: 0.3 });
      Z.stroke([T(L * 0.36, -H * 0.42), T(-L * 0.35, -H * 0.3)], 'shade', '#9a3a16', { w: H * 0.35, p: 0.55, tin: 0.2, tout: 0.3 });
      // the scales: three rows of little arcs, counted
      for (let r = 0; r < 3; r++) for (let j = 0; j < 4; j++) {
        const u = L * (0.1 - j * 0.12 - (r % 2) * 0.06), v = (r - 1) * H * 0.28, q = T(u, v);
        Z.stroke(ell(q[0], q[1], H * 0.16, H * 0.16, tilt + (dir > 0 ? 0 : PI), -PI / 2, PI / 2), 'chalk', '#ffd89a', { w: 0.13, p: 0.75 });
      }
    });
    K.hair([T(L * 0.24, -H * 0.42), T(L * 0.2, 0), T(L * 0.24, H * 0.42)], 0.06, { c: '#7a2a10', p: 0.7 });
    const e = T(L * 0.34, -H * 0.1);
    K.dot(e[0], e[1], '#1a0e08', 0.42); K.dot(e[0] - 0.08, e[1] - 0.1, '#fff6e8', 0.14);
    K.ink(body, 0.08, { c: '#5a2410', step: 0.2 });
  }

  function water(Z, K, avoid) {
    const WAT = R(-WX, WT, WX, YF + 0.5);
    K.burnish(WAT);
    K.lay(WAT, C.water, { w: 1.1, ang: 0.04 });
    Z.withMask(WAT, () => {
      // the courses going on under the water, seen pale through it
      for (let j = 0; j < 2; j++) {
        const ox = WX - CW * j, oy = WT + CH * j, ix = ox - CW, iy = oy + CH;
        const band = [[-ox, YF + 1], [-ox, oy], [ox, oy], [ox, YF + 1], [ix, YF + 1], [ix, iy], [-ix, iy], [-ix, YF + 1]];
        Z.fill(band, 'pastel', C.waterL, { w: 1.0, p: 0.5 - 0.2 * j, passes: 2, reach: 1.6, ang: 0 });
        K.hair([[-ix, YF + 1], [-ix, iy], [ix, iy], [ix, YF + 1]], 0.09, { c: C.waterD, p: 0.55, tin: 0, tout: 0 });
      }
      // dark under the far steps; lighter toward the near edge
      K.wash(WAT, C.waterD, (x, y) => 0.55 * (1 - sstep((y - WT) / 12)), 'over');
      K.wash(WAT, C.waterL, (x, y) => 0.3 * sstep((y - WT - 30) / 24), 'over');
      for (const f of FISH) fish(Z, K, f[0], f[1], f[2], f[3], f[4]);
      for (const f of FISH) K.wash(ell(f[0], f[1], f[2] * 0.8, f[2] * 0.45), C.water, () => 0.12, 'over');
      // rows of little arcs, the Mewar way of drawing still water; each row a little wider spaced toward us
      for (let r = 0, y = WT + 3.2; y < YF - 0.4; y += 3.0, r++) {
        const f = (y - WT) / (YF - WT), rx = lerp(1.4, 1.95, f), step = lerp(3.7, 4.7, f);
        for (let x = -WX + 2 + (r % 2 ? step / 2 : 0); x < WX - 1.5; x += step) {
          if (avoid(x, y)) continue;
          Z.stroke(ell(x + Z.rr(-0.12, 0.12), y + Z.rr(-0.08, 0.08), rx, rx * 0.55, 0, PI * 1.1, PI * 1.9), 'chalk', Z.mix(C.rip, C.waterL, lerp(0.38, 0.12, f)), { w: lerp(0.2, 0.25, f), p: Z.rr(0.72, 0.9), tin: 0.15, tout: 0.15 });
        }
      }
    });
    return WAT;
  }

  // a leaf lying on the water, seen low: counted veins, a dished middle, an edge turned up to show its pale underside
  function pad(Z, K, x, y, r, rot, nv, turn, c, i) {
    const flat = 0.5, nw = 0.17 + 0.02 * (i % 3), nl = 8 + (i % 5), kk = i * 1.7;
    const radAt = a => r * (1 + 0.026 * Math.sin(a * nl + kk));
    const pt = (a, k) => { const q = radAt(a) * (k == null ? 1 : k); return [x + Math.cos(a) * q, y + Math.sin(a) * q * flat]; };
    const N = 64, rim = [];
    for (let j = 0; j <= N; j++) rim.push(pt(rot + nw + (TAU - 2 * nw) * j / N));
    const cx = x + Math.cos(rot) * r * 0.08, cy = y + Math.sin(rot) * r * 0.08 * flat;
    const poly = rim.concat([[cx, cy]]);
    // its shadow on the water under the near edge, and the ring the water makes round it
    Z.stroke(ell(x + r * 0.06, y + r * flat * 0.18, r * 1.0, r * flat, 0, 0.25, PI - 0.25), 'side', C.waterD, { w: Math.max(1.2, r * 0.16), p: 0.42, tin: 0.3, tout: 0.3 });
    Z.stroke(ell(x, y + r * flat * 0.12, r * 1.12, r * flat * 1.12, 0, 0.35, PI - 0.35), 'chalk', Z.mix(C.rip, C.waterL, 0.25), { w: 0.22, p: 0.8, tin: 0.2, tout: 0.2 });
    K.lay(poly, c, { w: 0.9, ang: rot + 1.3 });
    const veinC = Z.mix(c, '#f4f0d8', 0.55), dk = Z.shade(c, -0.36);
    Z.withMask(poly, () => {
      Z.stroke(ell(x - r * 0.28, y - r * flat * 0.25, r * 0.48, r * flat * 0.42), 'side', Z.mix(c, C.padL, 0.5), { w: Math.max(1.2, r * 0.3), p: 0.32 });
      Z.stroke(ell(x + r * 0.1, y + r * flat * 0.1, r * 0.9, r * flat * 0.88, 0, -0.5, 1.9), 'side', dk, { w: Math.max(1.2, r * 0.16), p: 0.42, tin: 0.3, tout: 0.3 });
      for (let j = 0; j < nv; j++) {
        const a = rot + nw + (TAU - 2 * nw) * (j + 0.5) / nv + Z.rr(-0.025, 0.025), e = pt(a, 0.9), m = pt(a + 0.035, 0.5);
        Z.stroke([[cx, cy], m, e], 'chalk', veinC, { w: 0.2, p: 0.85, tin: 0.05, tout: 0.4, wob: 0.3 });
        Z.stroke([pt(a + 0.07, 0.56), pt(a + 0.08, 0.86)], 'shade', dk, { w: 0.5, p: 0.32, tin: 0.3, tout: 0.2 });
      }
    });
    if (turn != null) {
      let a0 = turn;
      const span = 1.05, inSpan = a => { const d = ((a - a0) % TAU + TAU) % TAU; return d < span; };
      if (inSpan(rot) || inSpan(rot + nw) || inSpan(rot - nw)) a0 += PI;
      const m = 16, outer = [], inner = [];
      for (let j = 0; j <= m; j++) { const u = j / m, a = a0 + span * u; outer.push(pt(a, 1.0)); inner.push(pt(a, 1 - Math.sin(u * PI) * 0.24)); }
      const cres = outer.concat(inner.slice().reverse());
      K.lay(cres, C.padUp, { w: 0.45, passes: 2, ang: a0 });
      for (let j = 2; j < m - 1; j += 2) K.hair([outer[j], [(outer[j][0] + inner[j][0]) / 2, (outer[j][1] + inner[j][1]) / 2]], 0.06, { c: dk, p: 0.5 });
      K.hair(inner, 0.08, { c: C.padLine, p: 0.85 });
    }
    K.dot(cx, cy, veinC, 0.45);
    if (i % 4 === 1) { const b = pt(rot + 2.4, 0.5); Z.stroke(ell(b[0], b[1] + 0.25, 0.75, 0.42, 0, 0.2, PI - 0.2), 'chalk', dk, { w: 0.2, p: 0.8 }); K.dot(b[0], b[1], '#f4f8f0', 0.6); }
    K.ink(poly, 0.15, { c: C.padLine, step: 0.4 });
  }

  // one petal; ang measured from straight up, positive leaning right
  function petal(Z, K, bx, by, ang, len, wid, S, k) {
    const curl = Z.rr(-0.12, 0.12) * wid;
    const Lf = Z.spline([[0, 0], [-wid * 0.34, -len * 0.2], [-wid * 0.5, -len * 0.52], [-wid * 0.27, -len * 0.84], [curl, -len]], false, 0.15);
    const Rt = Z.spline([[curl, -len], [wid * 0.27, -len * 0.84], [wid * 0.5, -len * 0.52], [wid * 0.34, -len * 0.2], [0, 0]], false, 0.15);
    const pts = xf(Lf.concat(Rt.slice(1)), bx, by, ang);
    const ux = Math.sin(ang), uy = -Math.cos(ang), px = -uy, py = ux;
    const c = Z.pick(S.c);
    Z.fill(pts, 'pastel', k ? Z.shade(c, k) : c, { w: clamp(wid * 0.36, 0.4, 1.3), passes: 2, reach: 1.6, p: 1, ang: Math.atan2(uy, ux) + Z.rr(-0.2, 0.2), gap: 0.44, cv: 0.012 });
    Z.withMask(pts, () => {
      if (S.tip) {
        const nt = Math.max(3, Math.round(wid / 0.9));
        for (let i = 0; i < nt; i++) {
          const u = (i + 0.5) / nt - 0.5 + Z.rr(-0.06, 0.06), l = len * Z.rr(0.26, 0.46) * (1 - Math.abs(u) * 0.75);
          const sx = bx + ux * len * 1.02 + px * u * wid * 0.95, sy = by + uy * len * 1.02 + py * u * wid * 0.95;
          Z.stroke([[sx, sy], [sx - ux * l - px * u * wid * 0.25, sy - uy * l - py * u * wid * 0.25]], 'chalk', S.tip, { w: clamp(wid * 0.2, 0.25, 0.6), p: Z.rr(0.55, 0.85), tin: 0, tout: 0.7, wob: 0.3 });
        }
      }
      if (S.baseC) for (let i = 0; i < 3; i++) {
        const u = (i - 1) * 0.22 + Z.rr(-0.05, 0.05), l = len * Z.rr(0.22, 0.38);
        Z.stroke([[bx + px * u * wid * 0.4, by + py * u * wid * 0.4], [bx + ux * l + px * u * wid, by + uy * l + py * u * wid]], 'chalk', S.baseC, { w: clamp(wid * 0.22, 0.25, 0.7), p: Z.rr(0.45, 0.7), tin: 0, tout: 0.7, wob: 0.3 });
      }
    });
    const nv = wid > 3.4 ? 3 : 2;
    for (let i = 0; i < nv; i++) {
      const u = (i - (nv - 1) / 2) * 0.24 + Z.rr(-0.03, 0.03);
      Z.stroke([[bx + ux * len * 0.14 + px * u * wid * 0.5, by + uy * len * 0.14 + py * u * wid * 0.5], [bx + ux * len * 0.5 + px * u * wid, by + uy * len * 0.5 + py * u * wid], [bx + ux * len * 0.8 + px * u * wid * 0.6, by + uy * len * 0.8 + py * u * wid * 0.6]], 'chalk', S.vein, { w: 0.16, p: 0.7, tin: 0.1, tout: 0.4, wob: 0.3 });
    }
    K.ink(pts, 0.13, { c: S.line, step: 0.3 });
  }

  // a lotus seen from the side, the folio way: low side petals, a fan of petals behind, the seed pod with its ring of
  // stamens peeping over, shorter paler petals in front; a bud is three petals closed on each other in two sepals
  function lotus(Z, K, x, y, s, kind, rot) {
    const S = kind === 'white' ? WHITE : PINK, cr = Math.cos(rot), sr = Math.sin(rot);
    const loc = (u, v) => [x + u * cr - v * sr, y + u * sr + v * cr];
    const P = (deg, len, wid, k) => { const b = loc(Math.sin(deg * DEG) * s * 0.05, 0); petal(Z, K, b[0], b[1], rot + (deg + Z.rr(-3, 3)) * DEG, len * Z.rr(0.95, 1.05), wid * Z.rr(0.94, 1.06), S, k); };
    const sepal = (deg, len, wid) => { const b = loc(0, s * 0.01); petal(Z, K, b[0], b[1], rot + deg * DEG, len, wid, SEPAL, 0); };
    if (kind === 'bud') {
      const len = s * 0.6, wid = s * 0.28;
      P(Z.rr(-3, 3), len, wid, -0.03);
      P(Z.rr(-9, -5), len * 0.86, wid * 0.62, 0.1);
      P(Z.rr(5, 9), len * 0.74, wid * 0.5, 0.18);
      sepal(-24, len * 0.42, wid * 0.45); sepal(22, len * 0.38, wid * 0.45);
      return loc(0, -len);
    }
    if (kind === 'half') {
      const L = s * 0.56, wd = s * 0.2;
      for (const d of [-47, 47, -25, 25, 0]) P(d, L * (1 - Math.abs(d) / 300), wd, -0.05);
      for (const d of [-31, 31, -11, 9]) P(d, L * 0.76, wd * 0.95, 0.12);
      sepal(-58, s * 0.2, s * 0.1); sepal(60, s * 0.19, s * 0.1);
      return loc(0, -L);
    }
    const white = kind === 'white', L = s * 0.5, wd = s * (white ? 0.15 : 0.2);
    for (const d of white ? [-99, 99] : [-104, 103]) P(d, L * 0.82, wd * 0.95, -0.06);
    const backs = white ? [-81, 81, -63, 63, -46, 46, -30, 30, -14, 14, 0] : [-83, 83, -61, 61, -40, 40, -19, 19, 0];
    for (const d of backs) P(d, L * (1 - Math.abs(d) / 600), wd, -0.04);
    // the seed pod and its ring of thirteen stamens
    const pc = loc(0, -s * 0.25), prx = s * 0.12, pry = s * 0.07;
    for (let i = 0; i < 13; i++) {
      const a = rot - PI / 2 + (i / 12 - 0.5) * 2.5 + Z.rr(-0.05, 0.05), l = s * Z.rr(0.11, 0.14);
      const sx = pc[0] + Math.cos(a) * prx * 0.8, sy = pc[1] + Math.sin(a) * pry * 0.6;
      Z.stroke([[sx, sy], [sx + Math.cos(a) * l, sy + Math.sin(a) * l]], 'chalk', '#f2c24a', { w: 0.2, p: 0.95, tin: 0, tout: 0.1, wob: 0.3 });
      K.dot(sx + Math.cos(a) * l, sy + Math.sin(a) * l, '#ec8a2a', 0.36);
    }
    const pod = ell(pc[0], pc[1], prx, pry, rot);
    Z.fill(pod, 'pastel', '#e8c23a', { w: 0.5, passes: 2, reach: 1.6, p: 1 });
    for (let i = 0; i < 5; i++) K.dot(pc[0] + (i - 2) * prx * 0.36, pc[1] - pry * 0.15 + (i % 2) * pry * 0.3, '#a8781e', 0.28);
    K.hair(ell(pc[0], pc[1], prx, pry, rot, PI * 1.02, PI * 1.98), 0.07, { c: '#6a4a1a', p: 0.7 });
    const fronts = white ? [-58, 58, -33, 33, -11, 10] : [-66, 66, -40, 40, -14, 13];
    for (const d of fronts) P(d, L * (white ? 0.58 : 0.55), wd * 0.95, 0.14);
    sepal(-118, s * 0.13, s * 0.08); sepal(120, s * 0.12, s * 0.08);
    return loc(0, -L);
  }
  function stem(Z, K, x0, y0, x1, y1) {
    const pts = Z.spline([[x0, y0], [lerp(x0, x1, 0.4) + (x1 - x0) * 0.3, lerp(y0, y1, 0.4)], [x1, y1]], false, 0.3);
    Z.stroke(pts, 'chalk', C.sap, { w: 0.62, p: 1, tin: 0, tout: 0 });
    Z.stroke(pts.map(p => [p[0] - 0.12, p[1]]), 'chalk', '#9cc868', { w: 0.18, p: 0.7, tin: 0.1, tout: 0.1 });
    K.line(pts.map(p => [p[0] + 0.3, p[1]]), 0.06, { c: C.bottle, tin: 0, tout: 0 });
    K.line(pts.map(p => [p[0] - 0.3, p[1]]), 0.045, { c: C.bottle, tin: 0, tout: 0, p: 0.7 });
    Z.stroke(ell(x1, y1 + 0.1, 1.9, 0.6, 0, 0.15, PI - 0.15), 'chalk', C.rip, { w: 0.2, p: 0.85 });
    Z.stroke(ell(x1, y1 + 0.3, 3.0, 0.95, 0, 0.3, PI - 0.3), 'chalk', Z.mix(C.rip, C.waterL, 0.3), { w: 0.18, p: 0.7 });
  }

  function waterLife(Z, K, WAT) {
    const items = [];
    PADS.forEach((p, i) => items.push({ y: p[1], f: () => pad(Z, K, p[0], p[1], p[2], p[3], p[4], p[5], C.pad[(i * 3) % 4], i) }));
    for (const b of BLOOMS) items.push({ y: b[5], f: () => { stem(Z, K, b[0], b[1] + 0.4, b[4], b[5]); lotus(Z, K, b[0], b[1], b[2], b[3], b[6]); } });
    for (const w of WHITES) items.push({ y: w[4] + 0.01, f: () => lotus(Z, K, w[0], w[1], w[2], 'white', w[3]) });
    items.sort((a, b) => a.y - b.y);
    Z.withMask(R(-WX, -160, WX, YF + 0.5), () => { for (const it of items) it.f(); });
  }

  /* ------------------------------------------------------------------ the front parapet and the two corner chhatris */
  function rosettePanel(Z, K, x0, y0, x1, y1) {
    const p = R(x0, y0, x1, y1), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    K.lay(p, C.mal, { w: 0.8, passes: 3, ang: 0.3 });
    Z.withMask(p, () => Z.stroke([[x0, y0 + 0.6], [x1, y0 + 0.6]], 'side', C.malD, { w: 1.2, p: 0.5, tin: 0, tout: 0 }));
    K.hair(R(x0 + 1.0, y0 + 1.0, x1 - 1.0, y1 - 1.0).concat([[x0 + 1.0, y0 + 1.0]]), 0.08, { c: C.limeLit, p: 0.9, tin: 0, tout: 0 });
    K.dots([[x0 + 1.9, y0 + 1.9], [x1 - 1.9, y0 + 1.9], [x1 - 1.9, y1 - 1.9], [x0 + 1.9, y1 - 1.9], [x0 + 1.9, y0 + 1.9]], 1.25, C.limeLit, 0.38);
    K.rosette(cx, cy, Math.min(x1 - x0, y1 - y0) * 0.3, C.limeLit, 'gold', C.malD);
    for (const [qx, qy] of [[x0 + 3.4, y0 + 3.4], [x1 - 3.4, y0 + 3.4], [x1 - 3.4, y1 - 3.4], [x0 + 3.4, y1 - 3.4]]) K.goldDot(qx, qy, 0.55);
    K.ink(p, 0.16);
  }
  function jaliPanel(Z, K, x0, y0, x1, y1) {
    const p = R(x0, y0, x1, y1), sp = 2.6;
    K.dark(p, C.room);
    Z.withMask(p, () => {
      // the stone lattice: bars crossing on the diagonals, a boss at each crossing
      for (let c = x0 - (y1 - y0); c < x1 + (y1 - y0); c += sp) {
        Z.stroke([[c, y1], [c + (y1 - y0), y0]], 'chalk', C.lime, { w: 0.75, p: 1, tin: 0, tout: 0 });
        Z.stroke([[c, y0], [c + (y1 - y0), y1]], 'chalk', C.lime, { w: 0.75, p: 1, tin: 0, tout: 0 });
      }
      for (let c = x0 - (y1 - y0); c < x1 + (y1 - y0); c += sp) {
        Z.stroke([[c + 0.32, y1], [c + 0.32 + (y1 - y0), y0]], 'shade', C.limeSh, { w: 0.3, p: 0.55, tin: 0, tout: 0 });
        Z.stroke([[c + 0.32, y0], [c + 0.32 + (y1 - y0), y1]], 'shade', C.limeSh, { w: 0.3, p: 0.55, tin: 0, tout: 0 });
      }
      for (let yy = y0, r = 0; yy <= y1 + 0.01; yy += sp / 2, r++) for (let xx = x0 + (r % 2 ? sp / 2 : 0); xx <= x1 + 0.01; xx += sp) K.dot(xx, yy, C.limeLit, 0.75);
    });
    const fr = 1.1, ring = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0], [x0 + fr, y0 + fr], [x0 + fr, y1 - fr], [x1 - fr, y1 - fr], [x1 - fr, y0 + fr], [x0 + fr, y0 + fr]];
    K.lay(ring, C.lime, { w: 0.4, passes: 2, ang: 0 });
    K.hair(R(x0 + fr, y0 + fr, x1 - fr, y1 - fr).concat([[x0 + fr, y0 + fr]]), 0.1, { tin: 0, tout: 0 });
    K.ink(p, 0.16);
  }
  function parapet(Z, K) {
    const X = 126;
    K.burnish(R(-X, YF, X, 0));
    const cope = R(-X, YF, X, YF + 3), fr = R(-X, YF + 3, X, YF + 8), face = R(-X, YF + 8, X, -4), pl = R(-X, -4, X, 0);
    K.lay(face, C.lime, { ang: 1.2 });
    Z.withMask(face, () => Z.stroke([[-X, YF + 8.9], [X, YF + 8.9]], 'side', C.limeSh, { w: 1.6, p: 0.5, tin: 0, tout: 0 }));
    K.wash(face, C.limeDeep, x => 0.22 * sstep((x - 30) / 96), 'mul');
    // nine panels between ten pilasters: rosettes on malachite and stone jali by turns
    let x = -X + 5.8;
    for (let j = 0; j < 9; j++) {
      const w = j % 2 ? 26 : 18;
      if (j % 2) jaliPanel(Z, K, x, YF + 10, x + w, -6); else rosettePanel(Z, K, x, YF + 10, x + w, -6);
      x += w + 5.8;
    }
    for (let j = 0, px = -X + 2.9; j < 10; j++) {
      K.hair([[px - 1.1, YF + 9.6], [px - 1.1, -5.4]], 0.09);
      K.hair([[px + 1.1, YF + 9.6], [px + 1.1, -5.4]], 0.09);
      Z.stroke([[px, YF + 10.6], [px, -6.4]], 'chalk', C.hingul, { w: 0.42, p: 0.9, tin: 0.05, tout: 0.05 });
      K.floret(px, (YF + 10 - 6) / 2, 1.2, C.hingul, 'gold');
      K.goldDot(px, YF + 10, 0.55); K.goldDot(px, -6, 0.55);
      px += (j % 2 ? 26 : 18) + 5.8;
    }
    // the frieze
    K.lay(fr, C.hingul, { w: 0.9, ang: 0 });
    Z.withMask(fr, () => Z.stroke([[-X, YF + 3.6], [X, YF + 3.6]], 'side', C.lac, { w: 1.0, p: 0.45, tin: 0, tout: 0 }));
    for (let xx = -X + 2.6, i = 0; xx <= X - 2; xx += 4.2, i++) { if (i % 2 === 0) K.floret(xx, YF + 5.5, 1.6, C.limeLit, C.haldi); else K.goldDot(xx, YF + 5.5, 0.7); }
    // the coping with its gold beads
    K.lay(cope, C.limeLit, { w: 0.9, ang: 0 });
    Z.withMask(cope, () => Z.stroke([[-X, YF + 2.5], [X, YF + 2.5]], 'side', C.limeSh, { w: 1.1, p: 0.5, tin: 0, tout: 0 }));
    for (let xx = -X + 1.6; xx <= X - 1.5; xx += 2.4) { K.goldDot(xx, YF + 1.65, 0.8); Z.dot(xx + 0.15, YF + 2.0, 'kajal', '#5a3a14', { w: 0.28, p: 0.6 }); }
    // the plinth
    K.lay(pl, C.riser, { w: 0.8, ang: 0 });
    K.dots([[-X + 1.2, -2], [X - 1.2, -2]], 2.0, C.limeLit, 0.58);
    for (const yy of [YF + 3, YF + 8, -4]) K.hair([[-X, yy], [X, yy]], 0.12, { tin: 0, tout: 0 });
    K.ink(R(-X, YF, X, 0), 0.4, { step: 0.8 });
    K.leafLine([[-X + 0.5, YF + 0.4], [X - 0.5, YF + 0.4]], 0.5);
  }
  function podium(Z, K, cx) {
    const hw = 12.4, x0 = cx - hw, x1 = cx + hw;
    K.burnish(R(x0 - 0.8, YF, x1 + 0.8, 0));
    const face = R(x0, YF + 8, x1, -4);
    K.lay(face, C.lime, { ang: 1.2 });
    K.model(face, x0, x1, YF + 8, -4, C.limeSh, C.limeLit, 0.8);
    rosettePanel(Z, K, x0 + 2.6, YF + 10, x1 - 2.6, -6);
    K.ink(face, 0.2);
    const fr = R(x0, YF + 3, x1, YF + 8);
    K.lay(fr, C.hingul, { w: 0.8, ang: 0 });
    for (let i = 0; i < 6; i++) { const xx = x0 + 2.2 + i * (2 * hw - 4.4) / 5; if (i % 2 === 0) K.floret(xx, YF + 5.5, 1.5, C.limeLit, C.haldi); else K.goldDot(xx, YF + 5.5, 0.65); }
    K.ink(fr, 0.18);
    const cope = R(x0 - 0.8, YF, x1 + 0.8, YF + 3);
    K.lay(cope, C.limeLit, { w: 0.7, ang: 0 });
    for (let xx = x0 + 0.6; xx <= x1 - 0.5; xx += 2.4) K.goldDot(xx, YF + 1.65, 0.8);
    K.ink(cope, 0.22);
    const pl = R(x0 - 0.8, -4, x1 + 0.8, 0);
    K.lay(pl, C.riser, { w: 0.7, ang: 0 });
    K.dots([[x0 + 0.6, -2], [x1 - 0.6, -2]], 2.0, C.limeLit, 0.58);
    K.ink(pl, 0.24);
  }

  /* ------------------------------------------------------------------ the whole kund */
  function draw(Z, o) {
    const K = kit(Z, o);
    K.burnish([R(-126, CREST, 126, YF), R(-134, -100, -124, YF), R(124, -100, 134, YF)]);
    farWall(Z, K);
    bangla(Z, K, o, 0, CREST);
    steps(Z, K);
    const avoid = (x, y) => {
      for (const p of PADS) { const dx = (x - p[0]) / (p[2] * 1.18), dy = (y - p[1]) / (p[2] * 0.5 * 1.45 + 1.2); if (dx * dx + dy * dy < 1) return true; }
      for (const b of BLOOMS) if (Math.abs(x - b[4]) < 3.4 && Math.abs(y - b[5]) < 1.8) return true;
      return false;
    };
    const WAT = water(Z, K, avoid);
    waterLife(Z, K, WAT);
    K.line([[-WX, YF], [-WX, WT], [WX, WT], [WX, YF]], 0.2, { tin: 0, tout: 0 });
    for (const sg of [-1, 1]) bastion(Z, K, o, sg * 130);
    parapet(Z, K);
    for (const sg of [-1, 1]) {
      podium(Z, K, sg * 138);
      chhatri(Z, K, o, sg * 138, YF, { pw: 10.6, ph: 20, pwid: 2.6, ew: 13.6, eh: 3.4, drh: 1.4, dw: 10, dh: 14, fh: 8, k: 1, np: 9, lamp: true });
    }
    return { box: [-152, -153, 152, 0] };
  }

  // under and behind it on the landing: its shadow, thrown a little to the right, away from the light
  function ground(Z, o) {
    Z.fill([[-148, -0.8], [153, -0.8], [161, 3.4], [-140, 3.4]], 'shade', '#0a0e24', { w: 2.4, p: 0.55, passes: 2, ang: 0 });
  }

  M.w8x['nit-trichy'] = { draw, ground };
})();
