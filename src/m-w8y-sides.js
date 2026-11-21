(function () {
  'use strict';
  /* ==========================================================================
     THE SIDE WALLS OF THE WELL (the hook 'sides'), painted the folio way.
     Each level has two walls that run out toward the viewer.  On each, double flights
     climb in a row of peaks: a stone mass under a chevron of coping, its steps cut on
     both slopes and meeting at a small landing on top.  Between the peaks the wall
     goes back into a hollow that holds a doorway, a shrine niche or a stone screen.
     Under each wall a terrace of laid slabs runs out to its kerb.
     Every surface is burnished, laid in one flat colour, then coursed and jointed by
     hand; the contours are one kajal, lighter than the focal objects' line.
     The life on the walls is placed: the household side on the left (pots, the
     washing, lamps in the doorways, the dog, a tulsi), the wild side on the right
     (a peacock, parakeets, a kite that came down, creepers, a peepal, the shrines).
     Wall frame: (s, y) with H.sideMap: s runs out from the back corner, y is the
     picture y at the corner.  The light comes from the upper left of the picture.
     ======================================================================== */
  M.w8y = M.w8y || {};
  const PI = Math.PI, TAU = 2 * PI;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sst = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const R4 = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  // where the flights begin on each wall [left, right]: the old painter's phases, so every landing stays where it was
  const PH = { y2025: [124.0116, 188.7081], y2023: [29.5124, 26.7463], y2022: [275.2175, 115.9473], y2020: [135.1096, 205.6469], y2019: [53.6202, 83.1737] };
  // what lives on each wall
  const LIFE = {
    left: { y2025: ['pots', 'tulsi'], y2023: ['washing', 'pots'], y2022: ['dog', 'lamps'], y2020: ['creeper', 'lamps'], y2019: ['lamps', 'pots'] },
    right: { y2025: ['creeper'], y2023: ['peacock', 'shrine'], y2022: ['kite', 'shrine'], y2020: ['parrots', 'creeper', 'shrine'], y2019: ['peepal', 'shrine'] }
  };

  function rng(seed) {
    let s = seed >>> 0;
    const f = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    f.rr = (a, b) => a + (b - a) * f();
    f.ri = (a, b) => Math.floor(a + (b - a + 1) * f());
    f.pick = a => a[(f() * a.length) | 0];
    f.chance = p => f() < p;
    return f;
  }

  /* ---------------------------------------------------------------- the house kit (after m-w8x-sidekick.js), wall weight
     ls: +1 when the light comes from +x of Z's frame (the left wall, where s runs to the picture's left), -1 otherwise */
  function kit(Z, ls) {
    const INK = Z.mix('kajal', 'neel', 0.12), KJ = Z.tool('kajal', { wmin: 0.3 });
    const K = { INK, KJ };
    K.solid = (p, c, o) => Z.fill(p, 'pastel', c, Object.assign({ w: 2.6, p: 1, reach: 1.5, passes: 3, ang: 0, turn: 0.1, streak: 0.2 }, o));
    // a dark laid flat: more passes, no streak, so nothing shows through it.  Every pass runs close to the given
    // angle (a small turn), so the stroke grain follows the courses instead of crossing them
    K.flat = (p, c, o) => Z.fill(p, 'pastel', c, Object.assign({ w: 1.4, p: 1, reach: 1.6, passes: 4, ang: 0, turn: 0.12, streak: 0, gap: 0.42 }, o));
    const swell = (nx, ny) => clamp((-ls * nx * 0.78 + ny * 0.62 + 0.15) / 0.95, 0, 1);
    const norms = (pts, closed, inside) => {
      const n = pts.length;
      let cx = 0, cy = 0;
      if (inside) { cx = inside[0]; cy = inside[1]; } else { for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n; }
      return pts.map((p, i) => {
        const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
        return swell(nx, ny);
      });
    };
    // the contour in two goes: one even unbroken line, then a swell on the side turned from the light
    K.ink = (poly, w, o) => {
      o = o || {}; w = w || 0.5;
      const sw = norms(poly, true), ring = poly.concat(poly.slice(0, 2)), swr = sw.concat(sw.slice(0, 2));
      Z.stroke(ring.map(p => [p[0], p[1]]), KJ, o.c || INK, { w: w * 0.62, p: 0.95, tin: 0, tout: 0, wob: 0.2 });
      Z.stroke(ring.map((p, i) => [p[0], p[1], 0.4 + 0.6 * swr[i]]), KJ, o.c || INK, { w, p: 0.95, tin: 0, tout: 0, wob: 0.2 });
    };
    K.edge = (pts, w, inside, o) => {
      o = o || {}; w = w || 0.5;
      const sw = norms(pts, false, inside);
      Z.stroke(pts.map(p => [p[0], p[1]]), KJ, o.c || INK, { w: w * 0.62, p: 0.95, tin: 0.02, tout: 0.02, wob: 0.2 });
      Z.stroke(pts.map((p, i) => [p[0], p[1], 0.4 + 0.6 * sw[i]]), KJ, o.c || INK, { w, p: 0.95, tin: 0.02, tout: 0.02, wob: 0.2 });
    };
    K.hair = (p, w, c, o) => Z.stroke(p, KJ, c || Z.mix(INK, '#f4ecdc', 0.18), Object.assign({ p: 0.75, tin: 0.04, tout: 0.06, wob: 0.25 }, o, { w: w || 0.22 }));
    K.chalk = (p, c, w, o) => Z.stroke(p, 'chalk', c, Object.assign({ w: w || 0.6, p: 0.85, wob: 0.3 }, o));
    K.dot = (x, y, c, w, o) => Z.dot(x, y, 'chalk', c, Object.assign({ w: w || 1.2, p: 0.95 }, o));
    // a ruled row of dots, laid one by one: each a hair off in place and size, never a stamp
    K.dots = (path, step, c, w, o) => {
      o = o || {};
      for (const q of Z.along(path, step, 0)) {
        if (o.skip && o.skip(q)) continue;
        K.dot(q.x + Z.rr(-0.06, 0.06) * step, q.y + Z.rr(-0.05, 0.05) * step, c, w * Z.rr(0.88, 1.1), { p: Z.rr(0.86, 1) });
      }
    };
    K.floret = (x, y, r, petal, heart) => {
      const a0 = Z.rr(0, 1.25);
      for (let i = 0; i < 5; i++) {
        const a = a0 + i * TAU / 5 + Z.rr(-0.08, 0.08);
        Z.dot(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, 'chalk', petal, { w: r * 0.62 * Z.rr(0.92, 1.06), len: r * 0.14, ang: a, p: 0.97 });
      }
      K.dot(x, y, heart, r * 0.42);
    };
    // burnish the paper under a surface before it is painted: the crumple goes flat, the fine tooth stays
    // (M.w8Hand, src/m-w8y-hand.js), so the colour breaks on the tooth the way dry pastel does
    K.burnish = polys => {
      if (M.w8Hand) return M.w8Hand.burnish(Z, polys);
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
    return K;
  }

  /* ---------------------------------------------------------------- the colours of one level's walls */
  function colours(A, wp, pal) {
    const mx = A.mix;
    const C = {
      mass: mx(wp.stoneLit, wp.stone, 0.62),
      massLit: mx(wp.stoneLit, pal.lime, 0.3),
      hol: mx(wp.stone, wp.stoneDeep, 0.42),
      tread: mx(pal.lime, wp.stoneLit, 0.5),
      nose: mx(pal.lime, '#fffaf0', 0.5),
      riser: mx(wp.stone, wp.stoneDeep, 0.22),
      riserDeep: mx(wp.stone, wp.stoneDeep, 0.6),
      cope: mx(wp.frame, wp.stoneLit, 0.3),
      frame: mx(wp.frame, wp.stoneLit, 0.15),
      frameDeep: mx(wp.frame, wp.stone, 0.5),
      jali: mx(wp.jali, wp.stone, 0.25),
      halo: wp.halo, deep: wp.stoneDeep, lime: pal.lime, line: pal.line,
      dark: mx(pal.dark, wp.stoneDeep, 0.3)
    };
    C.shadow = mx(mx(wp.stone, wp.stoneDeep, 0.72), '#2c2244', 0.25);
    C.darkLit = mx(C.dark, C.hol, 0.3);
    C.revLit = mx(wp.stoneLit, wp.stone, 0.35);
    C.revSh = mx(wp.stone, wp.stoneDeep, 0.65);
    C.slab = mx(pal.lime, wp.stone, 0.26);
    C.slabLit = mx(C.slab, pal.lime, 0.45);
    C.kerb = mx(pal.lime, wp.stoneLit, 0.45);
    // the plaster a shade lighter where it catches the sky, the frieze band and its string course, the plinth,
    // the blind arches in the masses
    C.holLit = mx(C.hol, wp.stoneLit, 0.55);
    C.band = mx(wp.stone, wp.frame, 0.45);
    C.bandEdge = mx(wp.stone, wp.stoneDeep, 0.35);
    C.course = mx(wp.frame, wp.stoneLit, 0.38);
    C.plinth = mx(C.mass, C.cope, 0.45);
    C.blind = mx(C.mass, wp.stoneDeep, 0.36);
    C.blindLit = mx(C.mass, wp.stoneLit, 0.35);
    C.white = '#fffaf0'; C.ochre = '#d6a535';
    // the terrace: two close tones laid in turn, a paler runner, and the border in the level's strong colour
    C.slabB = mx(C.slab, wp.stoneWarm, 0.065);
    C.runner = mx(C.slab, pal.lime, 0.17);
    const fz = pal.frieze || '#c03822', q = A.col(fz), sc = Math.max(q[0], q[1], q[2]) > 1.5 ? 255 : 1;
    C.border = (0.3 * q[0] + 0.59 * q[1] + 0.11 * q[2]) / sc > 0.42 ? '#c03822' : fz;
    return C;
  }

  /* ---------------------------------------------------------------- coursed masonry in a region of the wall frame */
  function courses(Z, K, R, s0, s1, top, foot, ch, blk, cJ, cL, wf) {
    let row = 0;
    const ys = [];
    for (let y = foot; y > top + 0.5; y -= ch) ys.push(y);
    ys.push(top);
    const HP = M.w8Hand ? M.w8Hand.pull : null;
    for (let j = 1; j < ys.length - 1; j++) {
      const y = ys[j] + R.rr(-0.12, 0.12);
      if (HP) {
        // the course line pulled by hand in a pull or two, and its lit lip under it, a separate pull
        HP(Z, [[s0, y], [s1, y + R.rr(-0.15, 0.15)]], K.KJ, cJ, { w: 0.22 * wf, p: 0.72, j: 0.14, tin: 0, tout: 0.02, long: 20 });
        HP(Z, [[s0, y + 0.44], [s1, y + 0.44]], 'chalk', cL, { w: 0.28 * wf, p: 0.34, j: 0.1, long: 20 });
      } else {
        Z.stroke([[s0, y], [lerp(s0, s1, 0.5), y + R.rr(-0.12, 0.12)], [s1, y + R.rr(-0.15, 0.15)]], K.KJ, cJ, { w: 0.21 * wf, p: 0.7, wob: 0.25, tin: 0, tout: 0 });
        Z.stroke([[s0, y + 0.42], [s1, y + 0.42]], 'chalk', cL, { w: 0.26 * wf, p: 0.32, wob: 0.25 });
      }
    }
    for (let j = 0; j < ys.length - 1; j++, row++) {
      const yB = ys[j], yT = ys[j + 1];
      let x = s0 - blk * (row % 2 ? 0.5 : 0.02) - R.rr(0, blk * 0.1);
      while (x < s1) {
        x += blk * R.rr(0.86, 1.14);
        if (x > s0 + 1 && x < s1 - 1) Z.stroke([[x, yB - 0.3], [x + R.rr(-0.12, 0.12), yT + 0.3]], K.KJ, cJ, { w: 0.2 * wf, p: 0.66, wob: 0.2, tin: 0, tout: 0 });
      }
    }
  }

  /* ---------------------------------------------------------------- the top of a hollow: a string course and a frieze band
     A moulding with its top lit and its shade under it, then a band of the level's colour, a tone lighter than the
     wall: a deep edge and a white dot row inside each edge, and between them a floret and a lozenge of four dots in
     turn at an even beat, each set a hair differently by the hand.  s0, s1 the run; ph0 fixes the beat to the wall. */
  function frieze(Z, K, C, R, s0, s1, top, Hh, wf, ph0) {
    const y0 = top + Hh * 0.032, y1 = y0 + Hh * 0.026;
    K.solid(R4(s0, y0, s1, y1), C.course, { w: 1.3, passes: 3, streak: 0, turn: 0.06 });
    K.chalk([[s0, y0 + 0.3], [s1, y0 + 0.3]], C.nose, 0.42 * wf, { p: 0.88 });
    const b0 = y1 + Hh * 0.01, b1 = b0 + Hh * 0.078, bh = b1 - b0, bm = (b0 + b1) / 2, e = bh * 0.14;
    K.solid(R4(s0, y1, s1, b0 + 0.2), C.shadow, { w: 0.8, passes: 2, streak: 0, turn: 0.05 });
    K.solid(R4(s0, b0, s1, b1), C.band, { w: 1.5, passes: 4, streak: 0, turn: 0.06 });
    for (const [ya, yb] of [[b0, b0 + e], [b1 - e, b1]]) K.solid(R4(s0, ya, s1, yb), C.bandEdge, { w: Math.max(0.4, e * 0.8), passes: 3, streak: 0, turn: 0.04 });
    K.dots([[s0, b0 + e + bh * 0.1], [s1, b0 + e + bh * 0.1]], bh * 0.17, C.white, bh * 0.075);
    K.dots([[s0, b1 - e - bh * 0.1], [s1, b1 - e - bh * 0.1]], bh * 0.17, C.white, bh * 0.075);
    const step = bh * 1.45, x0 = s0 + (((ph0 - s0) % step) + step) % step;
    for (let x = x0 - step, i = Math.round((x0 - ph0) / step); x < s1 + step; x += step, i++) {
      const fx = x + R.rr(-0.03, 0.03) * step, fy = bm + R.rr(-0.02, 0.02) * bh;
      if (i % 2 === 0) K.floret(fx, fy, bh * 0.22 * R.rr(0.95, 1.05), C.white, C.halo);
      else {
        const q = bh * 0.1 * R.rr(0.94, 1.06);
        for (const [a, b] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) K.dot(fx + a * q * 1.25, fy + b * q * 1.25, C.white, bh * 0.075);
        K.dot(fx, fy, C.ochre, bh * 0.07);
      }
    }
    K.hair([[s0, y0], [s1, y0]], 0.24 * wf);
    K.hair([[s0, y1], [s1, y1]], 0.26 * wf);
    K.hair([[s0, b1], [s1, b1]], 0.24 * wf);
    return b1;
  }

  // the plinth course along the foot of the wall: a band of dressed stone, its top lit
  function plinth(Z, K, C, s0, s1, foot, Hh, wf) {
    const y0 = foot - Hh * 0.05;
    K.solid(R4(s0, y0, s1, foot + 0.5), C.plinth, { w: 1.4, passes: 3, streak: 0, turn: 0.06 });
    K.chalk([[s0, y0 + 0.3], [s1, y0 + 0.3]], C.nose, 0.36 * wf, { p: 0.8 });
    K.hair([[s0, y0], [s1, y0]], 0.24 * wf);
    return y0;
  }

  /* a row of small blind arches along the foot of a mass, at an even beat about its middle, each where it fits under
     the coping: a recess with its reveal lit on the side of the light, a bead at its head, and in turn a floret or a
     drop of three dots in it.  half: the half base of the mass, slope: the rise of its sides per unit of s */
  function blindRow(Z, K, C, R, sc, yb, foot, Hh, half, slope, wf, ls) {
    const bt = Hh * 0.115;
    for (let j = -4; j <= 4; j++) {
      const w = Hh * 0.034 * R.rr(0.95, 1.05), h = Hh * 0.112 * R.rr(0.97, 1.03), x = sc + j * bt + R.rr(-0.005, 0.005) * Hh;
      const y = yb - Hh * 0.012, ya = y - h, ys = y - h * 0.6;
      if (half - (foot - ya) / slope - (Math.abs(x - sc) + w) < Hh * 0.035) continue;
      const op = M.w8Arch(x - w, x + w, y, ys, ya, 0);
      K.solid(op, C.blind, { w: Math.max(0.5, w * 0.5), passes: 3, streak: 0, turn: 0.06, ang: PI / 2 });
      Z.withMask(op, () => {
        K.solid(R4(ls > 0 ? x - w - 1 : x + w * 0.5, ya - 1, ls > 0 ? x - w * 0.5 : x + w + 1, y + 1), C.blindLit, { w: Math.max(0.4, w * 0.3), passes: 2, streak: 0, ang: PI / 2 });
        K.solid(R4(x - w - 1, ya - 1, x + w + 1, ys + h * 0.08), Z.mix(C.blind, C.dark, 0.25), { w: Math.max(0.4, w * 0.3), passes: 2, streak: 0 });
      });
      if (j % 2 === 0) K.floret(x, ys + h * 0.3, w * 0.42, C.white, C.halo);
      else for (let k = 0; k < 3; k++) K.dot(x, ys + h * (0.12 + k * 0.17), C.white, w * (0.3 - k * 0.05));
      K.edge(op.slice(1, -1), 0.3 * wf, [x, y - h * 0.3]);
      K.dot(x, ya - Hh * 0.012, C.white, w * 0.32);
      K.hair([[x - w * 1.25, y], [x + w * 1.25, y]], 0.22 * wf);
    }
  }

  /* ---------------------------------------------------------------- a doorway into the dark */
  function door(Z, K, C, sc, foot, Hh, w, ls) {
    const ow = w * 0.5, ys = foot - Hh * 0.4, ya = foot - Hh * 0.6, fw = w * 0.7, fTop = foot - Hh * 0.73, bandW = w * 0.085;
    const sur = R4(sc - fw, fTop, sc + fw, foot);
    K.burnish(R4(sc - fw * 1.2, fTop - Hh * 0.08, sc + fw * 1.2, foot));
    K.solid(sur, C.frame, { w: 2.2 });
    // a border band of the wall's deep colour round the surround, ruled and beaded
    const bd = Hh * 0.04, ob = [[sc - fw, foot], [sc - fw, fTop], [sc + fw, fTop], [sc + fw, foot]], inb = [[sc - fw + bd, foot], [sc - fw + bd, fTop + bd], [sc + fw - bd, fTop + bd], [sc + fw - bd, foot]];
    K.solid(ob.concat(inb.slice().reverse()), C.frameDeep, { w: 1.2 });
    K.hair(inb, 0.22);
    K.dots([[sc - fw + bd / 2, foot - 1.5], [sc - fw + bd / 2, fTop + bd / 2], [sc + fw - bd / 2, fTop + bd / 2], [sc + fw - bd / 2, foot - 1.5]], 2.3, C.lime, 0.9);
    // the cornice over it on two small brackets, with its shade under it
    const cor = R4(sc - fw * 1.14, fTop - Hh * 0.045, sc + fw * 1.14, fTop + Hh * 0.004);
    K.solid(R4(sc - fw, fTop, sc + fw, fTop + Hh * 0.03), C.shadow, { w: 0.8 });
    for (const sg of [-1, 1]) {
      const bx = sc + sg * fw * 0.86, by = cor[2][1];
      const br = Z.spline([[bx - Hh * 0.03, by], [bx + Hh * 0.03, by], [bx + Hh * 0.012, by + Hh * 0.05], [bx - Hh * 0.012, by + Hh * 0.05]], true, 0.4);
      K.solid(br, C.frameDeep, { w: 0.7 });
      K.ink(br, 0.3);
    }
    K.solid(cor, C.tread, { w: 1.2 });
    K.chalk([[cor[0][0], cor[0][1] + 0.3], [cor[1][0], cor[1][1] + 0.3]], C.nose, 0.4);
    K.dots([[cor[3][0] + 1.8, (cor[0][1] + cor[2][1]) / 2 + 0.4], [cor[2][0] - 1.8, (cor[0][1] + cor[2][1]) / 2 + 0.4]], 2.2, C.halo, 0.75);
    K.hair(cor.concat([cor[0]]), 0.24);
    // the arch band, a tone deeper, with its own beads
    const arc2 = M.w8Arch(sc - ow - bandW, sc + ow + bandW, foot, ys, ya - bandW * 1.25, 0);
    K.solid(arc2, C.frameDeep, { w: 1.6 });
    // the spandrels: a flower in each
    for (const sg of [-1, 1]) K.floret(sc + sg * fw * 0.66, fTop + (ys - fTop) * 0.36, w * 0.085, C.lime, C.halo);
    // the opening: the reveal, lit on the side that faces the light, then the dark beyond it
    const op = M.w8Arch(sc - ow, sc + ow, foot, ys, ya, 7);
    K.solid(op, C.revSh, { w: 1.4 });
    Z.withMask(op, () => K.solid(R4(ls > 0 ? sc - ow - 1 : sc + w * 0.06, ya - 2, ls > 0 ? sc - w * 0.06 : sc + ow + 1, foot + 1), C.revLit, { w: 1.2 }));
    const rv = w * 0.08, inn = M.w8Arch(sc - ow + rv, sc + ow - rv, foot, ys + rv * 0.3, ya + rv, 7);
    K.flat(inn, C.dark);
    // the room beyond: its back wall catches a little light, with a further doorway in it, and the floor
    Z.withMask(inn, () => {
      const bwl = foot - Hh * 0.33;
      K.flat(R4(sc - ow, bwl, sc + ow, foot), C.darkLit);
      const ib2 = M.w8Arch(sc - ow * 0.34, sc + ow * 0.34, foot - Hh * 0.04, foot - Hh * 0.2, foot - Hh * 0.27, 0);
      K.flat(ib2, C.dark, { w: 1 });
      K.solid(R4(sc - ow, foot - Hh * 0.04, sc + ow, foot), Z.mix(C.darkLit, C.tread, 0.18), { w: 1 });
      K.hair([[sc - ow, bwl], [sc + ow, bwl]], 0.2, Z.mix(C.dark, '#000000', 0.3));
      K.hair(ib2.slice(1, -1), 0.2, Z.mix(C.dark, '#000000', 0.3));
    });
    K.hair(inn.slice(1, -1), 0.22, Z.mix(C.dark, C.revSh, 0.3));
    // beads round the arch band
    K.dots(M.w8Arch(sc - ow - bandW * 0.5, sc + ow + bandW * 0.5, foot - 1.5, ys, ya - bandW * 0.62, 0).slice(1, -1), 2.2, C.lime, 0.85);
    // the threshold, a slab with a lit nose
    const th = R4(sc - ow - bandW * 1.4, foot - Hh * 0.028, sc + ow + bandW * 1.4, foot + 0.2);
    K.solid(th, C.tread, { w: 1 });
    K.chalk([[th[0][0], th[0][1] + 0.3], [th[1][0], th[1][1] + 0.3]], C.nose, 0.4);
    // the contours
    K.ink(sur, 0.5);
    K.edge(arc2.slice(1, -1), 0.4, [sc, foot - Hh * 0.2]);
    K.edge(op.slice(1, -1), 0.48, [sc, foot - Hh * 0.2]);
    K.hair(th.concat([th[0]]), 0.22);
    return { ow, ys, ya, foot };
  }

  /* ---------------------------------------------------------------- a shrine niche */
  function niche(Z, K, C, sc, foot, Hh, w, ls) {
    const sill = foot - Hh * 0.24, nw = w * 0.3, ys = sill - Hh * 0.19, ya = sill - Hh * 0.33;
    const fw = w * 0.5, fTop = sill - Hh * 0.45;
    const fr = R4(sc - fw, fTop, sc + fw, sill);
    K.burnish(R4(sc - fw * 1.2, fTop - Hh * 0.06, sc + fw * 1.2, sill + Hh * 0.09));
    K.solid(fr, C.frame, { w: 2 });
    // pilasters at the sides, banded
    for (const sg of [-1, 1]) {
      const px0 = sc + sg * fw * 0.86, px1 = sc + sg * fw * 0.62, pil = R4(Math.min(px0, px1), fTop + 1, Math.max(px0, px1), sill);
      K.solid(pil, C.frameDeep, { w: 1 });
      for (let y = fTop + 4; y < sill - 2; y += Hh * 0.05) K.hair([[pil[0][0], y], [pil[1][0], y]], 0.18);
      K.hair(pil.concat([pil[0]]), 0.2);
    }
    // the niche: a painted back wall in the level's deep colour
    const op = M.w8Arch(sc - nw, sc + nw, sill, ys, ya, 5);
    K.solid(op, C.revSh, { w: 1.2 });
    Z.withMask(op, () => K.solid(R4(ls > 0 ? sc - nw - 1 : sc + nw * 0.15, ya - 2, ls > 0 ? sc - nw * 0.15 : sc + nw + 1, sill + 1), C.revLit, { w: 1 }));
    const rv = nw * 0.14, inn = M.w8Arch(sc - nw + rv, sc + nw - rv, sill, ys + rv * 0.3, ya + rv, 5);
    K.flat(inn, Z.mix(C.halo, C.dark, 0.35), { w: 1 });
    // a painted arch round the back, a fine line and dots in it, as the shrines have
    K.dots(M.w8Arch(sc - nw * 0.62, sc + nw * 0.62, sill - 1, ys + 2, ya + rv + 3, 0).slice(1, -1), 2, Z.mix(C.halo, '#f4e8d0', 0.55), 0.7);
    // the cornice: a slab over the frame with a lit edge and its shade under it, a little pot of a finial on it
    const cor = R4(sc - fw * 1.14, fTop - Hh * 0.04, sc + fw * 1.14, fTop + Hh * 0.008);
    K.solid(cor, C.tread, { w: 1.2 });
    K.chalk([[cor[0][0], cor[0][1] + 0.3], [cor[1][0], cor[1][1] + 0.3]], C.nose, 0.4);
    K.solid(R4(sc - fw, fTop + Hh * 0.008, sc + fw, fTop + Hh * 0.03), C.shadow, { w: 0.8 });
    K.dots([[cor[3][0] + 1.6, cor[0][1] + Hh * 0.024], [cor[2][0] - 1.6, cor[0][1] + Hh * 0.024]], 2.1, C.halo, 0.75);
    const kx = sc, ky = fTop - Hh * 0.04;
    const kal = Z.spline([[kx - Hh * 0.025, ky], [kx - Hh * 0.03, ky - Hh * 0.03], [kx, ky - Hh * 0.05], [kx + Hh * 0.03, ky - Hh * 0.03], [kx + Hh * 0.025, ky]], true, 0.3);
    K.solid(kal, C.frameDeep, { w: 0.8 });
    K.ink(kal, 0.3);
    K.dot(kx, ky - Hh * 0.062, C.frameDeep, Hh * 0.016);
    // the sill, a slab with a nose, on a small bracket
    const sl = R4(sc - fw * 1.06, sill, sc + fw * 1.06, sill + Hh * 0.035);
    K.solid(sl, C.tread, { w: 1 });
    K.chalk([[sl[0][0], sl[0][1] + 0.3], [sl[1][0], sl[1][1] + 0.3]], C.nose, 0.4);
    const br = Z.spline([[sc - fw * 0.42, sl[2][1]], [sc + fw * 0.42, sl[2][1]], [sc + fw * 0.2, sl[2][1] + Hh * 0.05], [sc, sl[2][1] + Hh * 0.075], [sc - fw * 0.2, sl[2][1] + Hh * 0.05]], true, 0.4);
    K.solid(br, C.frameDeep, { w: 0.9 });
    K.ink(br, 0.35);
    // the god in it: a stone daubed in sindoor, its two eyes
    const gx = sc - nw * 0.18, gw = nw * 0.36, gh = Hh * 0.1;
    const god = Z.spline([[gx - gw, sill], [gx - gw * 0.95, sill - gh * 0.55], [gx - gw * 0.5, sill - gh], [gx + gw * 0.45, sill - gh * 0.95], [gx + gw * 0.95, sill - gh * 0.5], [gx + gw, sill]], true, 0.3);
    K.solid(god, '#d64a26', { w: 0.8 });
    Z.withMask(god, () => K.solid(R4(ls > 0 ? gx - gw : gx + gw * 0.3, sill - gh - 1, ls > 0 ? gx - gw * 0.3 : gx + gw, sill), '#b8361c', { w: 0.6 }));
    for (const ex of [-0.28, 0.28]) { K.dot(gx + ex * gw, sill - gh * 0.62, '#fbf4e2', gh * 0.2); K.dot(gx + ex * gw, sill - gh * 0.6, '#1c1410', gh * 0.08); }
    K.ink(god, 0.3);
    K.ink(fr, 0.48);
    K.edge(op.slice(1, -1), 0.42, [sc, sill - Hh * 0.1]);
    K.hair(cor.concat([cor[0]]), 0.22);
    K.hair(sl.concat([sl[0]]), 0.22);
    return { sill, nw, gx, gw };
  }

  /* ---------------------------------------------------------------- a stone screen */
  function jali(Z, K, C, sc, top, Hh, w, ls) {
    const fw = w * 0.54, y0 = top + Hh * 0.2, y1 = top + Hh * 0.7;
    const fr = R4(sc - fw, y0, sc + fw, y1);
    K.burnish(R4(sc - fw * 1.1, y0 - 1, sc + fw * 1.1, y1 + Hh * 0.08));
    K.solid(fr, C.frame, { w: 2 });
    K.hair([[sc - fw + 1.3, y0 + 1.3], [sc + fw - 1.3, y0 + 1.3], [sc + fw - 1.3, y1 - 1.3], [sc - fw + 1.3, y1 - 1.3], [sc - fw + 1.3, y0 + 1.3]], 0.2);
    K.dots([[sc - fw + 2.5, y0 + 2.5], [sc + fw - 2.5, y0 + 2.5], [sc + fw - 2.5, y1 - 2.5], [sc - fw + 2.5, y1 - 2.5], [sc - fw + 2.5, y0 + 2.6]], 2.2, C.lime, 0.8);
    // the screen under a cusped head, its holes counted row by row
    const sw = fw * 0.7, sb = y1 - Hh * 0.05, sp = y0 + Hh * 0.17, sa = y0 + Hh * 0.065;
    const scr = M.w8Arch(sc - sw, sc + sw, sb, sp, sa, 5);
    K.solid(scr, C.jali, { w: 1.4 });
    const g = sw / 4.6, hole = Z.mix(C.dark, C.jali, 0.1), lit = Z.mix(C.jali, '#fffaf0', 0.45);
    Z.withMask(scr, () => {
      let row = 0;
      for (let y = sb - g * 0.55; y > sa - g; y -= g * 0.87, row++) {
        for (let x = sc - sw - g + (row % 2) * g * 0.5; x < sc + sw + g; x += g) {
          const cx = x + Z.rr(-0.03, 0.03) * g, cy = y + Z.rr(-0.03, 0.03) * g, r = g * 0.3 * Z.rr(0.95, 1.05);
          // a pierced lozenge with softened corners
          const p = [];
          for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, c = Math.cos(a), s = Math.sin(a), k = 1 / (Math.abs(c) + Math.abs(s)) * 0.82 + 0.18; p.push([cx + c * r * k * 1.05, cy + s * r * k * 1.2]); }
          Z.fill(p, 'pastel', hole, { w: Math.max(0.5, r * 0.7), p: 1, passes: 2, reach: 1.4 });
          Z.stroke([[cx - ls * r * 0.15, cy + r * 1.05], [cx - ls * r * 0.75, cy + r * 0.35]], 'chalk', lit, { w: 0.3, p: 0.7, wob: 0.2 });
        }
      }
    });
    K.hair(scr.slice(1, -1), 0.22);
    // the sill under it, with two small brackets
    const sl = R4(sc - fw * 1.08, y1, sc + fw * 1.08, y1 + Hh * 0.035);
    K.solid(sl, C.tread, { w: 1 });
    K.chalk([[sl[0][0], y1 + 0.3], [sl[1][0], y1 + 0.3]], C.nose, 0.4);
    for (const sg of [-1, 1]) {
      const bx = sc + sg * fw * 0.66, by = sl[2][1];
      const br = Z.spline([[bx - Hh * 0.03, by], [bx + Hh * 0.03, by], [bx + Hh * 0.012, by + Hh * 0.045], [bx - Hh * 0.012, by + Hh * 0.045]], true, 0.4);
      K.solid(br, C.frameDeep, { w: 0.7 });
      K.ink(br, 0.3);
    }
    K.ink(fr, 0.48);
    K.hair(sl.concat([sl[0]]), 0.22);
  }

  /* ---------------------------------------------------------------- one side wall of one level */
  function wall(A, G, H, L, sd, LIFEQ) {
    const m = H.sideMap(L, sd), Z = H.zoom(A, m), ls = sd === 'left' ? 1 : -1, K = kit(Z, ls);
    const wp = H.wallPal(L), pal = L.pal, top = L.top, foot = L.foot, Hh = foot - top;
    // the flights are broader than the old ones (a walking width), on the same slopes and to the same landings
    const run = Hh * 0.8, tl = Hh * 0.24, bl = Hh * 0.62, unit = 2 * run + tl + bl, n = Math.max(8, Math.round(Hh / 4.8)), bw = run * 0.44;
    const Ls = m.Ls + 30, ph = PH[L.id] ? PH[L.id][sd === 'left' ? 0 : 1] : 0.5 * unit;
    const C = colours(A, wp, pal), R = rng(7000 + L.k * 31 + (sd === 'left' ? 0 : 17));
    const kk = (s, y) => Z.__k(s, y), wfAt = (s, y) => 1 / Math.sqrt(Math.max(0.5, kk(s, y)));
    const info = { m, peaks: [], hollows: [], top, foot, Hh, run, bl, bw, n };
    const starts = []; for (let s0 = -ph; s0 < Ls; s0 += unit) starts.push(s0);
    const quad = [[-2, top - 1], [Ls + 20, top - 1], [Ls + 20, foot + 1], [-2, foot + 1]];
    // the whole wall, burnished first
    K.burnish(quad);
    // the peaks: their outline, steps and chevron, worked out before anything is painted
    const pk = starts.map(s0 => {
      const a = s0, b = a + run, c = b + tl, d = c + run, sc = (b + c) / 2;
      const r = []; let t = 0; for (let i = 0; i < n; i++) { const v = R.rr(0.95, 1.05); r.push(v); t += v; }
      let acc = 0; const up = [0].concat(r.map(v => (acc += v * Hh / t)));
      const upS = u => a + run * u / Hh, dnS = u => d - run * u / Hh, Y = u => foot - u;
      const sil = [];
      for (let i = 0; i < n; i++) sil.push([upS(up[i]), Y(up[i])], [upS(up[i]), Y(up[i + 1])]);
      for (let i = n - 1; i >= 0; i--) sil.push([dnS(up[i]), Y(up[i + 1])], [dnS(up[i]), Y(up[i])]);
      const cw = bw * 0.18, u1 = (d - a - 2 * bw) * Hh / (2 * run), u2 = u1 + cw * Hh / run;
      // the walking line of each flight, from its foot to its top, for whoever climbs it
      const off = (bw - cw) / 2, wUp = [[a + off, foot], [Math.min(sc, b + off), top]], wDn = [[Math.max(sc, d - off), foot], [Math.max(sc, c - off), top]];
      return { a, b, c, d, sc, up, upS, dnS, Y, sil, cw, u1, u2, wf: wfAt(sc, foot - Hh * 0.4), walk: { up: wUp, dn: wDn } };
    });
    info.flights = pk.filter(P => P.d > 0 && P.a < m.Ls).map(P => ({ up: P.walk.up, dn: P.walk.dn, upPic: P.walk.up.map(q => m.f(q[0], q[1])), dnPic: P.walk.dn.map(q => m.f(q[0], q[1])) }));
    // 1. the hollows between the peaks: the wall set back, coursed, and what is let into it
    starts.forEach((s0, k) => {
      const c = s0 + run + tl, d = c + run, e = s0 + unit, f = e + run, sc = (d + e) / 2, w = Math.min(bl * 0.82, Hh * 0.44);
      const hol = [[c, top], [f, top], [e, foot], [d, foot]], wf = wfAt(sc, foot - Hh * 0.5);
      K.solid(hol, C.hol, { w: 3.2, passes: 4, streak: 0, turn: 0.08 });
      // the hand: a lighter coat pulled along the wall with the stick on its side, a deeper one a little across it
      if (M.w8Hand) M.w8Hand.ground(Z, hol, Z.mix(C.hol, C.holLit, 0.78), Z.mix(C.hol, wp.stoneDeep, 0.36), { ang: 0, pl: 0.56 });
      // the plaster a little lighter under the top, where it sees the sky, and deeper toward the foot: laid in long
      // strokes that run with the wall
      const drag = M.floorDrag(Z, 0, Hh * 0.9, Hh * 0.05, R.rr(0, 40), 0.5);
      M.floorWash(Z, hol, C.holLit, (x, y) => 0.44 * (1 - sst((y - top - Hh * 0.14) / (Hh * 0.5))) * drag(x, y), 'over');
      M.floorWash(Z, hol, wp.stoneDeep, (x, y) => 0.2 * sst((y - top - Hh * 0.45) / (Hh * 0.55)) * drag(x + 53, y + 7), 'mul');
      Z.withMask(hol, () => {
        courses(Z, K, R, c - 4, f + 4, top, foot, 2 * Hh / n * 1.25, Hh * 0.23, Z.mix(K.INK, C.hol, 0.62), Z.mix(C.hol, C.lime, 0.28), wf);
        frieze(Z, K, C, R, c - 4, f + 4, top, Hh, wf, -ph);
        plinth(Z, K, C, c - 4, f + 4, foot, Hh, wf);
      });
      const kind = sd === 'left' ? (k % 3 === 2 ? 'jali' : 'door') : (k % 2 ? 'niche' : 'jali');
      const h = { c, d, e, f, sc, w, kind };
      if (sc > -w && sc < Ls + w) {
        if (kind === 'door') h.door = door(Z, K, C, sc, foot, Hh, w, ls);
        else if (kind === 'niche') h.niche = niche(Z, K, C, sc, foot, Hh, w, ls);
        else jali(Z, K, C, sc, top, Hh, w, ls);
      }
      info.hollows.push(h);
      // the peak on the side of the light throws its stepped shadow across the hollow
      const src = ls > 0 ? pk[k + 1] : pk[k];
      if (src) {
        const dx = -ls * Hh * 0.045, dy = Hh * 0.03;
        Z.withMask(hol, () => K.solid(src.sil.map(p => [p[0] + dx, p[1] + dy]), C.shadow, { w: 1.6, passes: 3 }));
      }
      // and the ledge above shades the top of it
      M.floorWash(Z, hol, wp.stoneDeep, (x, y) => 0.3 * (1 - sst((y - top) / (Hh * 0.13))), 'mul');
    });
    // 2. the peaks
    pk.forEach(P => {
      const { a, d, sc, up, upS, dnS, Y, sil, cw, u1, u2, wf } = P;
      if (dnS(0) < -10 || a > Ls + 10) { info.peaks.push(P); return; }
      K.solid(sil, C.riser, { w: 3, passes: 4, streak: 0, turn: 0.08 });
      if (M.w8Hand) M.w8Hand.coat(Z, sil, Z.mix(C.riser, C.riserDeep, 0.35), { ang: 0, p: 0.36 });
      // the treads: a lit strip with a bright nose, the shade line under it, the end of each step lit or shaded
      Z.withMask(sil, () => {
        for (let i = 0; i < n; i++) {
          const yT = Y(up[i + 1]), yB = Y(up[i]), tH = (yB - yT) * 0.36, s0 = upS(up[i]), s2 = dnS(up[i]);
          K.solid(R4(s0 - 1, yT - 0.2, s2 + 1, yT + tH), C.tread, { w: Math.max(0.6, tH * 0.9), passes: 2 });
          // the lit nose in two pulls of the chalk that meet somewhere along the step, each step its own
          {
            const nw = 0.38 * wf * R.rr(0.86, 1.12), cut = lerp(s0, s2, R.rr(0.3, 0.7)), jy = () => yT + 0.2 + R.rr(-0.07, 0.07);
            K.chalk([[s0 - 0.5 + R.rr(-0.25, 0.15), jy()], [cut + R.rr(0.4, 1), jy()]], C.nose, nw, { p: R.rr(0.84, 0.96) });
            K.chalk([[cut - R.rr(0.4, 1), jy()], [s2 + 0.5 + R.rr(-0.15, 0.25), jy()]], C.nose, nw * R.rr(0.9, 1.06), { p: R.rr(0.84, 0.96) });
          }
          Z.stroke([[s0 - 0.5, yT + tH], [s2 + 0.5, yT + tH]], K.KJ, Z.mix(K.INK, C.riser, 0.35), { w: 0.2 * wf, p: 0.72, wob: 0.2, tin: 0, tout: 0 });
          // the end faces: the one toward the light lit, the other in shade
          const litUp = ls < 0;
          Z.stroke([[s0 + 0.35, yT + tH + 0.2], [s0 + 0.35, yB - 0.1]], 'chalk', litUp ? C.nose : C.riserDeep, { w: 0.55 * wf, p: 0.75, wob: 0.15 });
          Z.stroke([[s2 - 0.35, yT + tH + 0.2], [s2 - 0.35, yB - 0.1]], 'chalk', litUp ? C.riserDeep : C.nose, { w: 0.55 * wf, p: 0.75, wob: 0.15 });
          // each step is laid in blocks: the joints break bond from one step to the next
          const fr = i % 2 ? [0.5] : [0.24, 0.76], fw = bw - cw, jc = Z.mix(K.INK, C.riser, 0.5);
          const spans = up[i] < u2 ? [[s0, s0 + fw], [s2 - fw, s2]] : [[s0, s2]];
          for (const [p0, p1] of spans) for (const t of fr) {
            const x = lerp(p0, p1, t + R.rr(-0.04, 0.04));
            Z.stroke([[x, yT + 0.25], [x + R.rr(-0.1, 0.1), yB - 0.15]], K.KJ, jc, { w: 0.18 * wf, p: 0.68, wob: 0.15, tin: 0, tout: 0 });
          }
        }
      });
      // the coping on the side of the light lays a strip of shade along the steps beside it
      {
        const sh = bw * 0.13, upLit = ls > 0;   // which coping stands between the light and its flight
        const band = upLit
          ? [[a + bw - cw - sh, foot], [sc - sh * 0.5, foot - u2 - sh * 0.6], [sc, foot - u2], [a + bw - cw, foot]]
          : [[d - bw + cw, foot], [sc, foot - u2], [sc + sh * 0.5, foot - u2 - sh * 0.6], [d - bw + cw + sh, foot]];
        Z.withMask(sil, () => M.floorWash(Z, band, wp.stoneDeep, () => 0.32, 'mul'));
      }
      // the mass under the chevron: coursed stone, with a small lamp niche in it
      const tri = [[a + bw, foot], [sc, foot - u1], [d - bw, foot]];
      K.solid(tri, C.mass, { w: 3, passes: 4, streak: 0, turn: 0.08 });
      if (M.w8Hand) M.w8Hand.ground(Z, tri, Z.mix(C.mass, C.massLit, 0.74), Z.mix(C.mass, wp.stoneDeep, 0.32), { ang: 0, pl: 0.56 });
      const dragM = M.floorDrag(Z, 0, Hh * 0.8, Hh * 0.045, R.rr(0, 40), 0.5);
      M.floorWash(Z, tri, C.massLit, (x, y) => 0.26 * (1 - sst((y - (foot - u1)) / (u1 * 0.7))) * dragM(x, y), 'over');
      Z.withMask(tri, () => {
        courses(Z, K, R, a + bw - 2, d - bw + 2, foot - u1 - 2, foot, 2 * Hh / n, Hh * 0.21, Z.mix(K.INK, C.mass, 0.5), Z.mix(C.mass, C.lime, 0.5), wf);
        const yp = plinth(Z, K, C, a + bw - 2, d - bw + 2, foot, Hh, wf);
        blindRow(Z, K, C, R, sc, yp, foot, Hh, (d - a - 2 * bw) / 2, u1 / ((d - a - 2 * bw) / 2), wf, ls);
      });
      M.floorWash(Z, tri, wp.stoneDeep, (x, y) => 0.14 * sst((y - (foot - u1)) / u1) * dragM(x + 41, y + 5), 'mul');
      const ln = { x: sc, y: foot - u1 * 0.42, w: Hh * 0.055, h: Hh * 0.12 };
      const lo = M.w8Arch(ln.x - ln.w, ln.x + ln.w, ln.y, ln.y - ln.h * 0.55, ln.y - ln.h, 3);
      const lf = R4(ln.x - ln.w * 1.7, ln.y - ln.h * 1.28, ln.x + ln.w * 1.7, ln.y + Hh * 0.02);
      K.solid(lf, C.frame, { w: 1 });
      K.flat(lo, C.dark, { w: 0.8 });
      Z.withMask(lo, () => K.solid(R4(ls > 0 ? ln.x - ln.w - 1 : ln.x + ln.w * 0.55, ln.y - ln.h - 1, ls > 0 ? ln.x - ln.w * 0.55 : ln.x + ln.w + 1, ln.y + 1), C.revSh, { w: 0.6 }));
      K.dots([[lf[3][0] + 1.3, lf[0][1] + 1.3], [lf[2][0] - 1.3, lf[0][1] + 1.3]], 1.9, C.halo, 0.65);
      K.ink(lf, 0.36);
      K.edge(lo.slice(1, -1), 0.32, [ln.x, ln.y - ln.h * 0.4]);
      P.lampNiche = ln;
      // the coping: a chevron of dressed stone between the flights and the mass, lit along its top, beaded
      const cope = [[a + bw - cw, foot], [sc, foot - u2], [d - bw + cw, foot], [d - bw, foot], [sc, foot - u1], [a + bw, foot]];
      K.solid(cope, C.cope, { w: 1.4, ang: -0.9 * ls });
      K.chalk([[a + bw - cw + 0.3, foot], [sc, foot - u2 + 0.35]], C.nose, 0.4 * wf, { p: 0.8 });
      K.chalk([[sc, foot - u2 + 0.35], [d - bw + cw - 0.3, foot]], C.nose, 0.4 * wf, { p: 0.8 });
      K.dots([[a + bw - cw * 0.5, foot - 1.5], [sc, foot - (u1 + u2) / 2], [d - bw + cw * 0.5, foot - 1.5]], 2.4, C.halo, 0.85 * wf);
      K.hair([[a + bw - cw, foot], [sc, foot - u2], [d - bw + cw, foot]], 0.24 * wf);
      K.hair([[a + bw, foot], [sc, foot - u1], [d - bw, foot]], 0.24 * wf);
      // the landing on top: its slab, beaded
      const yl = Y(up[n - 1]), s0 = upS(up[n - 1]), s2 = dnS(up[n - 1]);
      K.dots([[s0 + 1.6, (yl + top) / 2 + 1.2], [s2 - 1.6, (yl + top) / 2 + 1.2]], 2.4, C.halo, 0.7 * wf);
      // the outline of the whole stepped mass, in two goes
      K.ink(sil, 0.5 * wf);
      info.peaks.push(P);
    });
    // 3. the ledge of the level above throws a band of shade along the top of the wall
    K.solid(R4(-ph - unit, top - 0.5, Ls + 20, top + Hh * 0.02), Z.mix(C.shadow, wp.stoneDeep, 0.5), { w: 1.2, passes: 3, streak: 0, turn: 0.05 });
    M.floorWash(Z, R4(-ph - unit, top, Ls + 20, top + Hh * 0.14), '#1c1220', (x, y) => 0.3 * (1 - sst((y - top) / (Hh * 0.14))), 'mul');
    // these walls face away from the sun
    M.floorWash(A, L[sd].quad, H.TOK.chhaya, (x) => 0.08 + 0.08 * sst(Math.abs(x - 960) / 960), 'mul');
    return info;
  }

  /* ---------------------------------------------------------------- a terrace of laid slabs, picture frame */
  function terrace(A, H, L, N, sd) {
    const W = H.W, VP = H.VP, wp = H.wallPal(L), pal = L.pal, C = colours(A, wp, pal), K = kit(A, -1);
    const back = sd === 'left' ? [L.a, L.foot] : [L.b, L.foot], nose = sd === 'left' ? [N.a, N.top] : [W - N.a, N.top];
    const tq = sd === 'left' ? L.terrL : L.terrR;
    const P = (t, k) => [VP[0] + (lerp(back[0], nose[0], t) - VP[0]) * k, VP[1] + (lerp(back[1], nose[1], t) - VP[1]) * k];
    const kOut = t => { const p = [lerp(back[0], nose[0], t), lerp(back[1], nose[1], t)], kx = 1000 / Math.abs(p[0] - VP[0]), ky = (H.H + 30 - VP[1]) / (p[1] - VP[1]); return Math.min(kx, ky); };
    const kmax = Math.max(kOut(0), kOut(1)) + 0.02;
    const R = rng(8100 + L.k * 13 + (sd === 'left' ? 0 : 7));
    K.burnish(tq);
    const ang = Math.atan2(back[1] - VP[1], back[0] - VP[0]);
    K.solid(tq, C.slab, { w: 3.4, ang, passes: 4, streak: 0, turn: 0.08 });
    // the slabs: three rows across and the kerb; their joints across fall at equal steps of depth.  Two close tones
    // are laid in turn along the outer rows, the second row starting on the other tone; the middle row is a runner
    // of a paler stone the same all the way out; the kerb is its own stone, with a painted border on it
    const tk = 0.8, rows = [0, tk / 3 + R.rr(-0.02, 0.02), 2 * tk / 3 + R.rr(-0.02, 0.02), tk, 1];
    const len = Math.hypot(nose[0] - back[0], nose[1] - back[1]), dist = Math.hypot(back[0] - VP[0], back[1] - VP[1]);
    const del = len / 2.6 / dist, kb = kmax + 0.3;
    const kw = k => Math.sqrt(k);
    // first the stones, row by row (the joints are reckoned here, so the slabs fall where they did), then the hand
    // over them all, then the joints drawn over the hand
    const RW = [];
    for (let r = 0; r < 4; r++) {
      const t0 = rows[r], t1 = rows[r + 1], kerb = r === 3, d = kerb ? del * 2.2 : del;
      const ks = [1]; let j = (r % 2) * 0.5 + R.rr(0.6, 0.9);
      while (true) { const ik = 1 - (j + R.rr(-0.06, 0.06)) * d; if (ik <= 1 / kmax) { ks.push(kb); break; } ks.push(1 / ik); j += 1; }
      RW.push({ t0, t1, ks });
      if (r === 1) K.solid([P(t0, 1), P(t1, 1), P(t1, kb), P(t0, kb)], C.runner, { w: 2.6, ang, passes: 4, streak: 0, turn: 0.06 });
      for (let q = 0; q < ks.length - 1; q++) {
        const k0 = ks[q], k1 = ks[q + 1];
        const quad = [P(t0, k0), P(t1, k0), P(t1, k1), P(t0, k1)];
        if (kerb) K.solid(quad, C.kerb, { w: 2.4, ang, passes: 4, streak: 0, turn: 0.06 });
        else if (r !== 1 && (q + r / 2) % 2 === 1) K.solid(quad, C.slabB, { w: 2.4, ang, passes: 3, streak: 0, turn: 0.06 });
      }
    }
    // the hand over the slabs: a lighter coat pulled out in depth with the stick on its side, a warmer one across it
    if (M.w8Hand) M.w8Hand.ground(A, [P(0, 1), P(1, 1), P(1, kb), P(0, kb)], A.mix(C.slab, C.slabLit, 0.55), A.mix(C.slab, wp.stoneWarm || wp.stone, 0.2), { ang, pl: 0.44 });
    const HP = M.w8Hand ? M.w8Hand.pull : null;
    RW.forEach(({ t0, t1, ks }, r) => {
      for (let q = 1; q < ks.length - 1; q++) {
        // the joint across, and its lit lip
        const k0 = ks[q], a = P(t0, k0), b = P(t1, k0), w = 0.22 * kw(k0);
        if (HP) {
          HP(A, [a, b], K.KJ, A.mix(K.INK, C.slab, 0.5), { w, p: 0.74, j: 0.1 * k0, tin: 0, tout: 0.03 });
          HP(A, [[a[0], a[1] + 0.45 * k0], [b[0], b[1] + 0.45 * k0]], 'chalk', C.slabLit, { w: 0.3 * kw(k0), p: 0.42, j: 0.08 * k0 });
        } else {
          A.stroke([a, b], K.KJ, A.mix(K.INK, C.slab, 0.5), { w, p: 0.72, wob: 0.2, tin: 0, tout: 0 });
          A.stroke([[a[0], a[1] + 0.45 * k0], [b[0], b[1] + 0.45 * k0]], 'chalk', C.slabLit, { w: 0.3 * kw(k0), p: 0.4, wob: 0.2 });
        }
      }
      // the joint along the row's near edge
      if (r > 0) {
        const pts = []; for (let k = 1; k <= kb; k += 0.04) pts.push(P(t0, k));
        A.stroke(pts, K.KJ, A.mix(K.INK, C.slab, 0.45), { w: 0.24, p: 0.75, wob: 0.45, tin: 0, tout: 0 });
        A.stroke(pts.map(p => [p[0], p[1] + 0.5]), 'chalk', C.slabLit, { w: 0.3, p: 0.4, wob: 0.45 });
      }
    });
    // the border on the kerb, in the level's strong colour, as the landings have it: an ochre line inside each edge,
    // and a white floret and a lozenge of four dots in turn, counted at an even step of depth
    {
      const tb0 = 0.884, tb1 = 0.958, tm = (tb0 + tb1) / 2, bw1 = (tb1 - tb0) * len;
      const line = (t, w, c, tool, p) => { const pts = []; for (let k = 1; k <= kb; k += 0.04) pts.push(P(t, k).concat([Math.sqrt(k / kb)])); A.stroke(pts, tool, c, { w, p, wob: 0.2, tin: 0, tout: 0 }); };
      K.solid([P(tb0, 1), P(tb1, 1), P(tb1, kb), P(tb0, kb)], C.border, { w: 1.8, ang, passes: 4, streak: 0, turn: 0.05 });
      line(tb0 + (tb1 - tb0) * 0.14, 0.42, C.ochre, 'chalk', 0.85);
      line(tb1 - (tb1 - tb0) * 0.14, 0.42, C.ochre, 'chalk', 0.85);
      line(tb0, 0.5, K.INK, K.KJ, 0.85);
      line(tb1, 0.5, K.INK, K.KJ, 0.85);
      const dk = 2.3 * bw1 / dist, ph = R.rr(0.2, 0.8);   // a step of depth as long as 2.3 band widths, as the joints reckon it
      for (let i = 0; ; i++) {
        const ik = 1 - (i + ph) * dk * 0.5; if (ik <= 1 / kb) break;
        const k = 1 / ik, q = P(tm, k), hb = bw1 * k;
        if (i % 2 === 0) K.floret(q[0] + A.rr(-0.03, 0.03) * hb, q[1] + A.rr(-0.03, 0.03) * hb, hb * 0.4 * A.rr(0.95, 1.05), C.white, C.ochre);
        else {
          const g = hb * 0.13 * A.rr(0.94, 1.06);
          for (const [a, b] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) K.dot(q[0] + a * g * 1.3, q[1] + b * g * 1.3, C.white, hb * 0.09);
          K.dot(q[0], q[1], C.ochre, hb * 0.08);
        }
      }
    }
    M.floorWash(A, tq, H.TOK.chhaya, () => 0.14, 'mul');
    // the nose: a bright edge, and the dark under it
    const nz = []; for (let k = 1; k <= kb; k += 0.04) nz.push(P(1, k));
    A.stroke(nz, 'chalk', '#fff4e0', { w: 0.8, p: 0.85, wob: 0.2 });
    K.edge(nz.map(p => [p[0], p[1] + 0.9]), 0.5, [back[0] * 0 + VP[0], VP[1]]);
    // the foot of the wall behind
    const bk = []; for (let k = 1; k <= kb; k += 0.04) bk.push(P(0, k));
    K.hair(bk, 0.36, A.mix(K.INK, C.slab, 0.2));
    return { P, kmax, back, nose, rows };
  }

  /* ================================================================ the life on the walls (picture frame) */
  // a clay water pot standing on (x, yb), s its height
  function matka(A, K, x, yb, s, clay, o) {
    o = o || {};
    const r = s * 0.46, cy = yb - s * 0.4;
    const body = A.spline([[x - r * 0.42, yb - s * 0.78], [x - r * 0.82, yb - s * 0.66], [x - r, yb - s * 0.42], [x - r * 0.8, yb - s * 0.12], [x - r * 0.3, yb], [x + r * 0.3, yb], [x + r * 0.8, yb - s * 0.12], [x + r, yb - s * 0.42], [x + r * 0.82, yb - s * 0.66], [x + r * 0.42, yb - s * 0.78]], true, Math.max(0.15, s * 0.03));
    K.solid(body, clay, { w: Math.max(0.5, s * 0.14), ang: 1.3 });
    A.withMask(body, () => {
      K.solid(A.ellipse(x + r * 0.95, cy, r * 0.75, s * 0.6), A.mix(clay, '#2a120a', 0.38), { w: Math.max(0.4, s * 0.1), passes: 2 });
      A.stroke(A.ellipse(x - r * 0.15, cy, r * 0.62, s * 0.34, 0, PI * 1.05, PI * 1.45), 'chalk', A.mix(clay, '#fbe6c8', 0.55), { w: Math.max(0.3, s * 0.07), p: 0.8 });
    });
    // the painted shoulder: two lines and the dots between
    const band = []; for (let i = 0; i <= 12; i++) { const t = i / 12, a = PI * (0.16 + 0.68 * t); band.push([x - Math.cos(a) * r * 0.93, yb - s * 0.62 + Math.sin(a) * s * 0.05]); }
    K.hair(band, Math.max(0.16, s * 0.016), '#f6eedc');
    K.hair(band.map(p => [p[0], p[1] + s * 0.09]), Math.max(0.16, s * 0.016), '#f6eedc');
    for (let i = 1; i < 12; i += 2) A.dot(band[i][0], band[i][1] + s * 0.045, 'chalk', '#f6eedc', { w: Math.max(0.3, s * 0.05), p: 0.95 });
    // the neck, the rolled rim, the mouth
    const nk = [[x - r * 0.42, yb - s * 0.78], [x + r * 0.42, yb - s * 0.78], [x + r * 0.36, yb - s * 0.88], [x - r * 0.36, yb - s * 0.88]];
    K.solid(nk, A.mix(clay, '#2a120a', 0.15), { w: Math.max(0.3, s * 0.06), passes: 2 });
    const rim = A.ellipse(x, yb - s * 0.9, r * 0.5, s * 0.06);
    K.solid(rim, A.mix(clay, '#f4d8b8', 0.3), { w: Math.max(0.3, s * 0.05), passes: 2 });
    K.solid(A.ellipse(x, yb - s * 0.905, r * 0.32, s * 0.03), '#2a140c', { w: Math.max(0.25, s * 0.04), passes: 2 });
    K.ink(body, Math.max(0.24, s * 0.028));
    K.ink(rim, Math.max(0.18, s * 0.018));
    if (o.cloth) {
      const cl = A.spline([[x - r * 0.56, yb - s * 0.9], [x - r * 0.4, yb - s * 1.02], [x + r * 0.4, yb - s * 1.02], [x + r * 0.58, yb - s * 0.9], [x + r * 0.5, yb - s * 0.8], [x - r * 0.5, yb - s * 0.8]], true, Math.max(0.15, s * 0.03));
      K.solid(cl, o.cloth, { w: Math.max(0.3, s * 0.06), passes: 2 });
      for (let i = 0; i < 4; i++) A.dot(x + (i - 1.5) * r * 0.26, yb - s * 0.9, 'chalk', '#f6eedc', { w: Math.max(0.25, s * 0.04), p: 0.95 });
      K.ink(cl, Math.max(0.16, s * 0.018));
    }
  }

  // an unlit clay lamp, the wick dark; (x, y) the foot of the bowl, wd its width (the same measure as M.w8Lamp)
  function diya(A, K, x, y, wd) {
    const s = wd / 32, cx = x - 3 * s;
    const bowl = A.spline([[cx - 13 * s, y - 7 * s], [cx - 7 * s, y - 1 * s], [cx, y], [cx + 8 * s, y - 1 * s], [cx + 14 * s, y - 6 * s], [cx + 19 * s, y - 10 * s], [cx + 11 * s, y - 9 * s], [cx, y - 8 * s], [cx - 12 * s, y - 8.5 * s]], true, Math.max(0.1, 0.4 * s));
    K.solid(bowl, '#a8482e', { w: Math.max(0.25, 2.4 * s), passes: 3, streak: 0 });
    A.withMask(bowl, () => K.solid([[cx - 14 * s, y - 4.4 * s], [cx + 20 * s, y - 4.4 * s], [cx + 20 * s, y + 1], [cx - 14 * s, y + 1]], '#7a3018', { w: Math.max(0.2, 1.6 * s), passes: 2, streak: 0 }));
    K.solid(A.ellipse(cx - 1 * s, y - 8.6 * s, 11 * s, 1.8 * s), '#3a1a0a', { w: Math.max(0.2, 1.2 * s), passes: 2, streak: 0 });
    K.hair([[cx - 9 * s, y - 7.1 * s], [cx + 6 * s, y - 7.3 * s]], Math.max(0.12, 0.7 * s), '#e8a070');
    K.hair([[cx + 13 * s, y - 9 * s], [cx + 16.5 * s, y - 11 * s]], Math.max(0.12, 0.8 * s), '#2a140c');
    K.ink(bowl, Math.max(0.16, 0.5 * s));
  }

  // a tulsi in its painted stand (a vrindavan), standing on (x, yb); s its height
  function tulsi(A, K, x, yb, s, halo) {
    const hw = s * 0.2, bt = yb - s * 0.07, top = yb - s * 0.5, lime = '#f4ead8', limeSh = '#d9c8ae';
    // a plinth of two steps
    const p1 = R4(x - hw * 1.5, yb - s * 0.035, x + hw * 1.5, yb), p2 = R4(x - hw * 1.3, bt, x + hw * 1.3, yb - s * 0.035);
    for (const p of [p1, p2]) { K.solid(p, lime, { w: Math.max(0.3, s * 0.04), passes: 3 }); K.chalk([[p[0][0], p[0][1] + 0.2], [p[1][0], p[1][1] + 0.2]], '#fffaf0', Math.max(0.2, s * 0.012)); K.hair(p.concat([p[0]]), Math.max(0.16, s * 0.012)); }
    // the body, a little narrower at the top, its right face in shade
    const body = [[x - hw * 1.1, bt], [x + hw * 1.1, bt], [x + hw, top], [x - hw, top]];
    K.solid(body, lime, { w: Math.max(0.4, s * 0.06), ang: PI / 2 });
    A.withMask(body, () => K.solid(R4(x + hw * 0.62, top, x + hw * 1.2, bt), limeSh, { w: Math.max(0.3, s * 0.04), passes: 3 }));
    // painted bands at the foot and the head, beaded; a niche in the face with a little lamp's place
    for (const yy of [bt - s * 0.07, top + s * 0.03]) {
      K.solid(R4(x - hw * 1.08, yy, x + hw * 1.08, yy + s * 0.045), halo, { w: Math.max(0.25, s * 0.03), passes: 3 });
      for (let i = 0; i < 5; i++) A.dot(x + (i - 2) * hw * 0.42, yy + s * 0.0225, 'chalk', '#f6eedc', { w: Math.max(0.22, s * 0.022), p: 0.95 });
    }
    const ni = M.w8Arch(x - hw * 0.42, x + hw * 0.42, bt - s * 0.1, bt - s * 0.2, bt - s * 0.27, 3);
    K.flat(ni, '#3a2016', { w: Math.max(0.25, s * 0.03) });
    K.edge(ni.slice(1, -1), Math.max(0.16, s * 0.012), [x, bt - s * 0.15]);
    K.floret(x, top + s * 0.12, s * 0.06, halo, '#f3bd45');
    K.ink(body, Math.max(0.2, s * 0.016));
    // the head: a cornice with a horn at each corner
    const cap = R4(x - hw * 1.28, top - s * 0.045, x + hw * 1.28, top + s * 0.004);
    K.solid(cap, '#f8f0e0', { w: Math.max(0.3, s * 0.03), passes: 3 });
    K.hair(cap.concat([cap[0]]), Math.max(0.16, s * 0.012));
    for (const hx of [-1.12, 0, 1.12]) {
      const hn = [[x + hx * hw - hw * 0.16, top - s * 0.045], [x + hx * hw + hw * 0.16, top - s * 0.045], [x + hx * hw, top - s * (hx ? 0.13 : 0.1)]];
      K.solid(hn, '#f8f0e0', { w: Math.max(0.2, s * 0.02), passes: 3 }); K.ink(hn, Math.max(0.14, s * 0.01));
    }
    // the plant: stems out of the soil, paired leaves up each, a purple spike at each tip
    const cx = x, cy = top - s * 0.05;
    for (let k = 0; k < 7; k++) {
      const a = -PI / 2 + (k - 3) * 0.3, l = s * (0.3 + 0.07 * ((k * 5) % 3));
      const tip = [cx + Math.cos(a) * l, cy + Math.sin(a) * l], st = [[cx + (k - 3) * hw * 0.08, cy], [lerp(cx, tip[0], 0.5) + (k - 3) * hw * 0.05, lerp(cy, tip[1], 0.5)], tip];
      A.stroke(st, 'chalk', '#5a4a2a', { w: Math.max(0.2, s * 0.014), p: 0.85, tout: 0.3 });
      for (const q of A.along(st, Math.max(0.6, s * 0.045), 0)) {
        if (q.i === 0) continue;
        for (const sg of [-1, 1]) {
          const la = q.ang + sg * 1.05, sz = s * 0.05 * (1 - 0.35 * q.i / q.n);
          A.dot(q.x + Math.cos(la) * sz * 0.5, q.y + Math.sin(la) * sz * 0.5, 'chalk', (q.i + k + (sg > 0 ? 1 : 0)) % 3 ? '#3f7a32' : '#2e5a26', { w: sz * 0.62, len: sz * 0.3, ang: la, p: 0.97 });
        }
      }
      A.stroke([tip, [tip[0] + Math.cos(a) * s * 0.07, tip[1] + Math.sin(a) * s * 0.07]], 'chalk', '#7a3a7a', { w: Math.max(0.25, s * 0.022), p: 0.92, tout: 0.4 });
    }
  }

  // a pariah dog asleep, curled, the head on the paws and the tail round the nose; (x, y) where it lies, s its length
  function dog(A, K, x, y, s, flip) {
    const f = flip ? -1 : 1, P = (u, v) => [x + u * s * f, y + v * s];
    const coat = '#c88a4c', back = '#8e5426', pale = '#f0d8b0', line = A.mix(K.INK, '#3a2010', 0.3);
    const body = A.spline([P(-0.48, 0), P(-0.52, -0.16), P(-0.38, -0.33), P(-0.05, -0.4), P(0.24, -0.33), P(0.38, -0.18), P(0.36, 0)], true, Math.max(0.2, s * 0.012));
    K.solid(body, coat, { w: Math.max(0.5, s * 0.07), ang: 0.3 });
    A.withMask(body, () => {
      // the dark saddle along the back, the pale belly toward the ground
      K.solid(A.spline([P(-0.5, -0.12), P(-0.36, -0.36), P(-0.04, -0.44), P(0.22, -0.36), P(0.18, -0.26), P(-0.08, -0.3), P(-0.34, -0.22)], true, 0.5), back, { w: Math.max(0.4, s * 0.05), passes: 2 });
      K.solid(R4(P(-0.5, -0.07)[0], P(0, -0.07)[1], P(0.4, 0.02)[0], P(0, 0.02)[1]), pale, { w: Math.max(0.4, s * 0.04), passes: 2 });
    });
    // the haunch, a curve of its own
    K.hair([P(-0.34, -0.04), P(-0.4, -0.2), P(-0.26, -0.3), P(-0.1, -0.22)], Math.max(0.2, s * 0.008), line);
    K.ink(body, Math.max(0.24, s * 0.012));
    // the head laid on the paws: the muzzle, an ear folded back, the eye shut
    const head = A.spline([P(0.2, -0.04), P(0.22, -0.2), P(0.34, -0.27), P(0.48, -0.22), P(0.6, -0.12), P(0.62, -0.05), P(0.5, -0.01)], true, Math.max(0.2, s * 0.01));
    K.solid(head, A.mix(coat, pale, 0.2), { w: Math.max(0.4, s * 0.04), passes: 2 });
    A.withMask(head, () => K.solid(A.spline([P(0.48, -0.1), P(0.62, -0.08), P(0.62, -0.02), P(0.5, -0.01)], true, 0.4), pale, { w: Math.max(0.3, s * 0.03), passes: 2 }));
    const ear = A.spline([P(0.28, -0.22), P(0.3, -0.32), P(0.38, -0.36), P(0.4, -0.26)], true, 0.4);
    K.solid(ear, back, { w: Math.max(0.3, s * 0.03), passes: 2 });
    K.ink(ear, Math.max(0.18, s * 0.008));
    K.ink(head, Math.max(0.22, s * 0.011));
    K.hair([P(0.4, -0.17), P(0.44, -0.155), P(0.48, -0.165)], Math.max(0.18, s * 0.008), line);
    A.dot(P(0.615, -0.07)[0], P(0.615, -0.07)[1], 'kajal', K.INK, { w: Math.max(0.35, s * 0.03), p: 1 });
    // the forepaws in front, the tail curled round over them
    for (const u of [0.32, 0.43]) { const pw = A.ellipse(P(u, -0.01)[0], P(u, -0.01)[1], s * 0.055, s * 0.024); K.solid(pw, pale, { w: Math.max(0.3, s * 0.02), passes: 2 }); K.ink(pw, Math.max(0.16, s * 0.007)); }
    const tail = [P(-0.47, -0.06), P(-0.42, 0.03), P(-0.1, 0.05), P(0.18, 0.02), P(0.26, -0.04)];
    A.stroke(tail, 'pastel', coat, { w: Math.max(0.5, s * 0.07), p: 1, tout: 0.5, wob: 0.3 });
    A.stroke(tail.slice(2), 'chalk', pale, { w: Math.max(0.3, s * 0.035), p: 0.9, tin: 0.4, tout: 0.3, wob: 0.3 });
    K.hair(tail.map(p => [p[0], p[1] + s * 0.032]), Math.max(0.18, s * 0.008), line);
  }

  // the washing hung out on a cord from a to b: odhnis and a sari, each with its border and its own pattern
  function washing(A, K, a, b, sag, h, R) {
    const at = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + sag * Math.sin(PI * t)];
    const cord = []; for (let t = 0; t <= 1.0001; t += 0.04) cord.push(at(t));
    const lw = Math.max(0.22, h * 0.012);
    const cloths = [
      { c: '#c4301c', b: '#e6b422', pat: 'dots', w: 0.2, len: 1.0 },
      { c: '#2a6aa0', b: '#f2ead8', pat: 'stripe', w: 0.14, len: 0.7 },
      { c: '#e6b422', b: '#c4301c', pat: 'flower', w: 0.24, len: 0.92 },
      { c: '#3f9c58', b: '#e8607a', pat: 'dots', w: 0.13, len: 0.62 },
      { c: '#e8607a', b: '#2a4b96', pat: 'stripe', w: 0.17, len: 0.84 }
    ];
    let t = 0.07;
    for (const cl of cloths) {
      if (t + cl.w > 0.95) break;
      const p = at(t), q = at(t + cl.w), len = h * cl.len, hang = (R.rr(-0.3, 0.3)) * h * 0.04;
      const shape = [p, at(t + cl.w * 0.5), q, [q[0] + hang, q[1] + len * 0.98], [(p[0] + q[0]) / 2 + hang, (p[1] + q[1]) / 2 + len * 1.02], [p[0] + hang, p[1] + len]];
      K.solid(shape, cl.c, { w: Math.max(0.4, h * 0.05), ang: PI / 2 });
      A.withMask(shape, () => {
        // the border along the hem and the falls of the folds
        K.solid([[p[0] - 2, p[1] + len * 0.84], [q[0] + 2, q[1] + len * 0.82], [q[0] + 2, q[1] + len * 1.1], [p[0] - 2, p[1] + len * 1.1]], cl.b, { w: Math.max(0.3, h * 0.03), passes: 2 });
        for (let f = 0.34; f < 0.99; f += 0.33) { const u = at(t + cl.w * f); A.stroke([[u[0], u[1] + 0.6], [u[0] + hang * f, u[1] + len * 0.84]], 'chalk', A.mix(cl.c, '#1a0c08', 0.32), { w: Math.max(0.3, h * 0.02), p: 0.65, wob: 0.3 }); }
        if (cl.pat === 'dots') { for (let yy = 0.15; yy < 0.8; yy += 0.16) for (let xx = 0.18; xx < 0.95; xx += 0.24) { const u = at(t + cl.w * (xx + (Math.round(yy / 0.16) % 2) * 0.12)); A.dot(u[0], u[1] + len * yy, 'chalk', '#f6eedc', { w: Math.max(0.25, h * 0.022), p: 0.9 }); } }
        else if (cl.pat === 'stripe') { for (let xx = 0.22; xx < 0.95; xx += 0.28) { const u = at(t + cl.w * xx); A.stroke([[u[0], u[1] + 0.5], [u[0] + hang * 0.6, u[1] + len * 0.82]], 'chalk', cl.b, { w: Math.max(0.25, h * 0.016), p: 0.85, wob: 0.2 }); } }
        else { for (let yy = 0.22; yy < 0.75; yy += 0.24) for (let xx = 0.25; xx < 0.9; xx += 0.3) { const u = at(t + cl.w * xx); K.floret(u[0], u[1] + len * yy, h * 0.05, '#c4301c', '#f6eedc'); } }
      });
      M.floorWash(A, shape, '#1a0c08', (xx) => 0.24 * sst((xx - p[0]) / Math.max(0.1, q[0] - p[0])), 'mul');
      K.ink(shape, lw);
      t += cl.w + R.rr(0.03, 0.06);
    }
    for (const p of [a, b]) { const pg = A.ellipse(p[0], p[1], h * 0.035, h * 0.03); K.solid(pg, '#5a3a1a', { w: Math.max(0.25, h * 0.02), passes: 2 }); }
    A.stroke(cord, K.KJ, A.mix(K.INK, '#3a2412', 0.3), { w: lw, p: 0.9, tin: 0, tout: 0, wob: 0.2 });
  }

  // a creeper hanging from a ledge: leafy stems falling, the flowers in clusters, counted.
  // stems: [{ x, y, l }] in the picture, each the anchor on the ledge and its length; u the leaf scale
  function creeper(A, K, stems, u, R, fl) {
    const leaf = (q, a, sz, i) => {
      const lx = q.x + Math.cos(a) * sz * 0.55, ly = q.y + Math.sin(a) * sz * 0.55;
      const lf = A.spline([[q.x, q.y], [lx + Math.cos(a + 1.2) * sz * 0.3, ly + Math.sin(a + 1.2) * sz * 0.3], [q.x + Math.cos(a) * sz, q.y + Math.sin(a) * sz], [lx + Math.cos(a - 1.2) * sz * 0.3, ly + Math.sin(a - 1.2) * sz * 0.3]], true, 0.3);
      K.solid(lf, i % 3 === 0 ? '#2e5a26' : i % 3 === 1 ? '#3f7a32' : '#5e9a3e', { w: Math.max(0.3, sz * 0.3), passes: 2, ang: a });
      K.hair([[q.x, q.y], [q.x + Math.cos(a) * sz * 0.85, q.y + Math.sin(a) * sz * 0.85]], Math.max(0.14, sz * 0.03), '#1e3a16');
    };
    // where it takes hold: a run of stem along the ledge through the anchors, leafed both ways
    const ru = stems.map(t => [t.x, t.y + 0.3]);
    A.stroke(ru, 'chalk', '#4a3a1e', { w: Math.max(0.25, u * 0.009), p: 0.85, tin: 0.15, tout: 0.15, wob: 0.3 });
    A.along(ru, Math.max(1.2, u * 0.034), 0).forEach((q, i) => leaf(q, q.ang + (i % 2 ? 1 : -1) * 1.25 + (i % 2 ? 0 : PI * 0.1), u * 0.055 * R.rr(0.85, 1.1), i));
    stems.forEach((t, k) => {
      const l = t.l, sway = (k % 2 ? 1 : -1) * u * R.rr(0.02, 0.04);
      const st = A.spline([[t.x, t.y], [t.x + sway * 0.4, t.y + l * 0.3], [t.x + sway, t.y + l * 0.62], [t.x + sway * 0.6, t.y + l]], false, Math.max(0.3, u * 0.01));
      A.stroke(st, 'chalk', '#4a3a1e', { w: Math.max(0.25, u * 0.008), p: 0.85, tout: 0.4, wob: 0.3 });
      const pts = A.along(st, Math.max(1.2, u * 0.036), 0);
      pts.forEach((q, i) => {
        const side = i % 2 ? 1 : -1, sz = u * 0.062 * (1 - 0.45 * i / pts.length) * R.rr(0.9, 1.1);
        leaf(q, q.ang + side * 0.9 + PI * 0.02, sz, i);
        // a cluster of flowers at every fourth node
        if (i % 4 === 2) {
          const cx = q.x - side * sz * 0.4, cy = q.y + sz * 0.3;
          for (let j = 0; j < 4; j++) { const ja = j * 1.7 + k; K.floret(cx + Math.cos(ja) * sz * 0.36, cy + Math.sin(ja) * sz * 0.3, sz * 0.42, fl[(j + k) % fl.length], '#f3d36a'); }
        }
      });
    });
  }

  // a peepal leaf: a broad heart drawn out into a long tip; (x, y) where the stalk meets it, s its length, a its heading
  function peepalLeaf(A, K, x, y, s, a, c, vein) {
    const ca = Math.cos(a), sa = Math.sin(a), P = (u, v) => [x + (u * ca - v * sa) * s, y + (u * sa + v * ca) * s];
    const lf = A.spline([P(0.02, 0), P(0.06, 0.2), P(0.28, 0.36), P(0.56, 0.3), P(0.8, 0.12), P(1.0, 0.02), P(1.14, 0), P(1.0, -0.02), P(0.8, -0.12), P(0.56, -0.3), P(0.28, -0.36), P(0.06, -0.2)], true, Math.max(0.2, s * 0.02));
    K.solid(lf, c, { w: Math.max(0.3, s * 0.12), passes: 2, ang: a + 0.5 });
    A.withMask(lf, () => K.solid([P(0, 0), P(1.2, 0), P(1.2, -0.5), P(0, -0.5)], A.mix(c, '#fff4d0', 0.16), { w: Math.max(0.3, s * 0.1), passes: 1, p: 0.6 }));
    K.hair([P(0.04, 0), P(0.6, 0), P(1.05, 0)], Math.max(0.12, s * 0.02), vein);
    for (const u of [0.25, 0.45, 0.65]) for (const sg of [-1, 1]) K.hair([P(u, 0), P(u + 0.14, sg * 0.18)], Math.max(0.1, s * 0.012), vein, { p: 0.55 });
    K.ink(lf, Math.max(0.16, s * 0.02));
  }
  // a young peepal grown out of a joint in the wall: the roots gripping the stone, a leaning stem, its leaves trembling
  function peepal(A, K, x, y, s, R, lean) {
    const rootC = '#7e5c42', bark = '#8a6a52';
    // four roots: two run along the joint it grew from, two go down the face, each tapering, its lower side inked
    for (const [a, l] of [[PI * 0.04, 0.3], [PI * 0.96, 0.26], [PI * 0.4, 0.22], [PI * 0.64, 0.19]]) {
      const ll = s * l * R.rr(0.9, 1.1), bend = (a < PI / 2 ? 1 : -1) * s * 0.04;
      const rp = A.spline([[x, y], [x + Math.cos(a) * ll * 0.45, y + Math.sin(a) * ll * 0.45 + Math.abs(bend) * 0.4], [x + Math.cos(a) * ll + bend * 0.3, y + Math.sin(a) * ll + Math.abs(bend)]], false, 0.4);
      A.stroke(rp, 'pastel', rootC, { w: Math.max(0.35, s * 0.045), p: 1, tout: 0.75, wob: 0.25, streak: 0 });
      K.hair(rp.map(p => [p[0], p[1] + s * 0.02]), Math.max(0.14, s * 0.01), A.mix(K.INK, rootC, 0.25), { tout: 0.7 });
    }
    // the stem leans out and up, then branches
    const tip = [x + lean * s * 0.55, y - s * 0.7];
    const stem = A.spline([[x, y], [x + lean * s * 0.1, y - s * 0.25], [x + lean * s * 0.32, y - s * 0.5], tip], false, 0.4);
    const rib = [];
    stem.forEach((p, i) => { const w = s * 0.05 * (1 - 0.6 * i / stem.length); rib.push([p[0] - w, p[1]]); });
    for (let i = stem.length - 1; i >= 0; i--) { const p = stem[i], w = s * 0.05 * (1 - 0.6 * i / stem.length); rib.push([p[0] + w, p[1]]); }
    K.solid(rib, bark, { w: Math.max(0.3, s * 0.04), passes: 2, ang: -1.2 });
    K.ink(rib, Math.max(0.18, s * 0.012));
    const br = [];
    for (let i = 0; i < 4; i++) {
      const p = stem[Math.round(stem.length * (0.45 + 0.17 * i))] || tip, a = -PI / 2 + lean * 0.5 + (i % 2 ? 0.9 : -0.9) * (1 - i * 0.12), l = s * (0.35 - i * 0.04);
      const b = A.spline([p, [p[0] + Math.cos(a) * l * 0.5, p[1] + Math.sin(a) * l * 0.5 - s * 0.03], [p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l]], false, 0.4);
      A.stroke(b, 'chalk', bark, { w: Math.max(0.25, s * 0.025), p: 0.95, tout: 0.5, wob: 0.3 });
      br.push(b);
    }
    br.push(stem.slice(Math.round(stem.length * 0.6)));
    // the leaves: back ones darker, then the light ones, a few new ones copper
    const leaves = [];
    br.forEach((b, bi) => {
      const pts = A.along(b, s * 0.07, 0);
      pts.forEach((q, i) => {
        if (i === 0) return;
        const side = (i + bi) % 2 ? 1 : -1, a = q.ang + side * 1.1 + 0.5 * Math.sin(i * 1.7 + bi), sz = s * 0.2 * (0.7 + 0.3 * Math.sin(i * 2.3 + bi * 1.1));
        leaves.push({ x: q.x + Math.cos(q.ang + side * PI / 2) * s * 0.02, y: q.y, a: a + PI * 0.25 * side, sz, z: (i * 5 + bi * 3) % 7 });
      });
    });
    leaves.sort((p, q) => p.z - q.z);
    leaves.forEach((l, i) => {
      const c = l.z < 2 ? '#2e5626' : l.z < 5 ? '#4a8034' : l.z < 6 ? '#6aa246' : '#c0643e';
      // the stalk, then the leaf hanging from it
      const ex = l.x + Math.cos(l.a) * l.sz * 0.3, ey = l.y + Math.sin(l.a) * l.sz * 0.3;
      A.stroke([[l.x, l.y], [ex, ey]], 'chalk', '#5a4a2a', { w: Math.max(0.18, s * 0.008), p: 0.85 });
      peepalLeaf(A, K, ex, ey, l.sz, l.a + 0.3 * Math.sin(i), c, A.mix(c, '#f6efc8', 0.45));
    });
  }

  /* ---------------------------------------------------------------- placing the life */
  function life(A, G, H, L, sd, I, T) {
    const m = I.m, Hh = I.Hh, R = rng(6262 + L.k * 101 + (sd === 'left' ? 0 : 53)), K = kit(A, -1), wp = H.wallPal(L);
    const at = (s, y) => m.f(s, y), g = s => m.g(s), P = { lamps: G.lamps, glints: G.glints };
    const seen = x => x > 0.04 * m.Ls && x < 0.86 * m.Ls;
    const peaks = I.peaks.filter(p => seen(p.sc)), hols = I.hollows.filter(h => seen(h.sc));
    // a lit lamp, its flame registered for the night painter; only where the sheet shows it
    const lamp = (s, y, sz) => { const q = at(s, y), k = g(s); if (q[0] > 2 && q[0] < H.W - 2 && q[1] > 4 && q[1] < H.H - 1) M.w8Lamp(A, q[0], q[1] - 0.2, sz * k, P, true); };
    // a point out on the terrace in front of wall position s: t across (0 the wall foot, 1 the nose)
    const out = (s, t) => I.terr.P(t, g(s));
    const what0 = LIFE[sd][L.id] || [];
    // only where the sheet shows it: a doorway whose piers, and the tulsi's place out in front, are all in the picture
    const vis = (q, mx, my) => q[0] > mx && q[0] < H.W - mx && q[1] > my && q[1] < H.H - my;
    const doorOK = h => h.kind === 'door' && h.door && [-0.6, 0.6].every(dx => vis(at(h.sc + dx * h.w, I.foot), 8, 4)) && (!what0.includes('tulsi') || vis(out(h.sc, 0.46), 10, 4));
    const homeDoor = hols.find(doorOK) || hols.find(h => h.kind === 'door') || hols[0];
    // where nobody has lit them, the lamp niches still hold their clay bowls
    if (!what0.includes('lamps')) for (const p of peaks) if (p.lampNiche) { const ln = p.lampNiche, q = at(ln.x - ln.w * 0.15, ln.y - 0.3); diya(A, K, q[0], q[1], Hh * 0.05 * g(ln.x)); }
    for (const what of what0) {
      if (what === 'pots') {
        // the water pots set down at the doorway, one in front of each pier, out of the way of the flights; one has a cloth over it
        // where only one pier shows, the second pot sits on the first, as pots are carried and set down
        const h = homeDoor;
        if (h) {
          const piers = [-0.6, 0.6].filter(dx => vis(at(h.sc + ls(sd) * h.w * dx, I.foot), 8, 4));
          if (piers.length === 2) for (const [dx, cl, cloth] of [[-0.6, '#b8602e', null], [0.6, '#a04a26', '#c4301c']]) { const s = h.sc + ls(sd) * h.w * dx, q = at(s, I.foot); matka(A, K, q[0], q[1] + 1.2 * g(s), Hh * 0.115 * g(s), cl, { cloth }); }
          else if (piers.length === 1) {
            const s = h.sc + ls(sd) * h.w * piers[0], q = at(s, I.foot), sz = Hh * 0.115 * g(s);
            matka(A, K, q[0], q[1] + 1.2 * g(s), sz, '#b8602e');
            matka(A, K, q[0], q[1] + 1.2 * g(s) - sz * 0.86, sz * 0.78, '#a04a26', { cloth: '#c4301c' });
          }
        }
      }
      if (what === 'tulsi') {
        // the tulsi stands out on the terrace on the line of the doorway, as it would in a courtyard
        const h = homeDoor;
        if (h) { const q = out(h.sc, 0.46); tulsi(A, K, q[0], q[1], Hh * 0.26 * g(h.sc), wp.halo); }
      }
      if (what === 'lamps') {
        for (const h of hols) if (h.door) lamp(h.sc - h.w * 0.08, I.foot - Hh * 0.01, Hh * 0.06);
        for (const p of peaks) if (p.lampNiche) { const ln = p.lampNiche; lamp(ln.x - ln.w * 0.15, ln.y - 0.3, Hh * 0.05); }
      }
      if (what === 'washing') {
        const h = hols.find(h => h.sc > m.Ls * 0.15) || hols[0];
        if (h) {
          const y = I.top + Hh * 0.16, a = at(h.c + I.run * 0.42, y), b = at(h.f - I.run * 0.42, y);
          washing(A, K, a, b, Hh * 0.06 * g(h.sc), Hh * 0.34 * g(h.sc), R);
        }
      }
      if (what === 'dog') {
        const h = hols.find(h => h.door && h.sc > m.Ls * 0.15 && vis(out(h.sc + ls(sd) * h.w * 0.3, 0.3), 12, 4)) || hols.find(h => h.door);
        // asleep out on the warm slabs a little off the doorway's line, clear of the flights' feet
        if (h) { const s = h.sc + ls(sd) * h.w * 0.3, q = out(s, 0.3); dog(A, K, q[0], q[1], Hh * 0.27 * g(s), sd === 'right'); }
      }
      if (what === 'creeper') {
        const fl = sd === 'left' ? ['#e8607a', '#f6efe0', '#c2304e'] : ['#d23c6a', '#f6efe0', '#e88e1e'];
        // one on each side of what the hollow holds: the stems hang plumb (a picture vertical keeps its wall s), each no longer
        // than the hollow is deep at its s, so none falls over a flight; none crosses a frame
        const slope = I.run / Hh;
        for (const h of hols) {
          const half = h.kind === 'door' ? h.w * 0.7 * 1.2 : h.kind === 'niche' ? h.w * 0.5 * 1.2 : h.w * 0.54 * 1.15;
          for (const sg of [-1, 1]) {
            const near = sg < 0 ? h.c : h.f, s0 = h.sc + sg * (half + Hh * 0.04), span = Math.abs(s0 - near), stems = [];
            for (let j = 0; j < 6; j++) {
              const s = lerp(s0, near, 0.1 + 0.36 * j / 5) + R.rr(-0.01, 0.01) * Hh, room = Math.abs(s - near) / slope - Hh * 0.22;   // the margin keeps the leaves off the steps' corners
              const lw = Math.min(Hh * 0.6, room) * (0.6 + 0.4 * ((j * 7 + 3) % 5) / 4);
              if (lw < Hh * 0.08) continue;
              const q = at(s, I.top + 0.5);
              stems.push({ x: q[0], y: q[1], l: lw * g(s) });
            }
            if (span > Hh * 0.3 && stems.length >= 3) creeper(A, K, stems, Hh * 0.55 * g(h.sc), R, fl);
          }
        }
      }
      if (what === 'peacock') { const h = hols.find(h => h.kind === 'jali'); if (h) { const s = h.sc + ls(sd) * h.w * 0.2, q = at(s, I.top + Hh * 0.7), k = g(s); M.peacockPerched(A, q[0], q[1] - 0.4, Hh * 0.13 * k, { flip: sd === 'right' }); } }
      if (what === 'parrots') { const h = hols.find(h => h.kind === 'jali'); if (h) { const q = at(h.sc, I.top + Hh * 0.7), k = g(h.sc); M.parrot(A, q[0] - 7 * k, q[1] - 0.4, Hh * 0.1 * k, { pose: 'perch', flip: false }); M.parrot(A, q[0] + 7 * k, q[1] - 0.4, Hh * 0.095 * k, { pose: 'perch', flip: true }); } }
      if (what === 'kite') {
        const h = hols.find(h => h.kind === 'jali') || hols[0];
        if (h) {
          const s = h.sc + ls(sd) * h.w * 0.42, y = I.top + Hh * 0.2, q = at(s, y), k = g(s);
          // its string falls from the frame down the wall to the terrace, slack
          const e = at(h.sc - ls(sd) * h.w * 0.2, I.foot), st = [];
          for (let t = 0; t <= 1.0001; t += 0.1) st.push([lerp(q[0], e[0], t) + Math.sin(PI * t) * 3 * k, lerp(q[1], e[1], t)]);
          A.stroke(st, K.KJ, '#f4ecdc', { w: 0.24, p: 0.85, wob: 0.5, tin: 0, tout: 0.1 });
          M.kite(A, q[0], q[1] - Hh * 0.04 * k, Hh * 0.17 * k, M.kiteIds ? M.kiteIds[2] : 'x', { rot: 0.35, short: false });
        }
      }
      if (what === 'peepal') { const h = hols[0]; if (h) { const s = lerp(h.c, h.sc, 0.45), q = at(s, I.top + Hh * 0.25); peepal(A, K, q[0], q[1], Hh * 0.42 * g(s), R, sd === 'right' ? 1 : -1); } }
      if (what === 'shrine') for (const h of hols) if (h.niche) {
        const n = h.niche, s = h.sc, k = g(s), q = at(s, n.sill);
                lamp(s + h.w * 0.1, n.sill - 0.2, Hh * 0.05);
        // marigolds on the sill, and a garland across the niche
        for (let j = 0; j < 6; j++) { const u = at(s - h.w * 0.26 + j * h.w * 0.1, n.sill - 0.6); K.floret(u[0], u[1], 1.1 * k, j % 2 ? '#e88e1e' : '#f3bd45', '#c4301c'); }
        const g0 = at(s - n.nw * 0.86, n.sill - Hh * 0.27), g1 = at(s + n.nw * 0.86, n.sill - Hh * 0.27);
        const gar = []; for (let t = 0; t <= 1.0001; t += 0.1) gar.push([lerp(g0[0], g1[0], t), lerp(g0[1], g1[1], t) + Math.sin(PI * t) * Hh * 0.05 * k]);
        for (const u of A.along(gar, 1.1 * k, 0)) A.dot(u.x, u.y, 'chalk', u.i % 3 === 1 ? '#f3bd45' : '#e88e1e', { w: 1.05 * k * A.rr(0.9, 1.1), p: 0.97 });
      }
    }
  }
  const ls = sd => sd === 'left' ? 1 : -1;

  /* ================================================================ the hook */
  M.w8y.sides = Object.assign(function (A, G, H) {
    const levels = G.levels;
    levels.forEach((L, i) => {
      L.sideInfo = {};
      for (const sd of ['left', 'right']) L.sideInfo[sd] = wall(A, G, H, L, sd);
      const N = levels[i + 1] || { a: H.WA, top: H.WTOP };
      for (const sd of ['left', 'right']) L.sideInfo[sd].terr = terrace(A, H, L, N, sd);
    });
    levels.forEach(L => { for (const sd of ['left', 'right']) life(A, G, H, L, sd, L.sideInfo[sd]); });
  }, { part: 'sides' });
})();
