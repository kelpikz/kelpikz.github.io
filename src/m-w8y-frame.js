(function () {
  'use strict';
  /* ==========================================================================
     THE FRAME OF THE BACK WALL, repainted the folio way (the wall repaint, part "frame").
     The plaster and its courses, the pillars, the five friezes, the chhajja on its brackets,
     the bells, the dado of lotus petals and each landing, on all five levels and wherever
     the pavilions, the hall and the tank borrow them.
     The method is the objects' method at the wall's lighter weight: the paper is burnished
     under every surface first, so the raking light cannot bring the crumple back; each form
     is laid in one clean flat colour; then one kajal contour in two goes (even, then a swell
     on the shadow side, the light being up on the left); then the ornament, counted and laid
     bead by bead, each repeat a hair different from the last.  The gold on the wall is matte
     yellow ochre: no leaf and no glints, those are kept for the focal objects.
     Every function keeps the signature of the one it replaces (src/m-w8-arcade.js).
     ======================================================================== */
  const on = part => { const o = typeof process !== 'undefined' && process.env && process.env.W8Y; return !o || o.split(',').includes(part); };
  if (!on('frame')) return;

  const PI = Math.PI, TAU = PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const VX = 960, VY = 112;      // the far point of the well: the floor joints and the rafters run toward it
  const C = {
    cream: '#f6efe0', white: '#fffaf0', hingul: '#c03822', mal: '#3b7f52', leaf: '#4a8746', leafLit: '#7fb062',
    leafDeep: '#2c5e3a', haldi: '#edc94b', ochre: '#d6a535', maroon: '#7a2418', pink: '#e4848e', lapis: '#22408c'
  };

  // ---------------------------------------------------------------- the kit (after src/m-w8x-sidekick.js)
  const TK = new WeakMap();
  function tk(A) {
    let t = TK.get(A);
    if (!t) { t = { INK: A.mix('kajal', 'neel', 0.12), KJ: A.tool('kajal', { wmin: 0.3 }) }; TK.set(A, t); }
    return t;
  }
  const lum = (A, c) => { const q = A.col(c), m = Math.max(q[0], q[1], q[2]) > 1.5 ? 255 : 1; return (0.3 * q[0] + 0.59 * q[1] + 0.11 * q[2]) / m; };
  // the strong colour a level's borders are painted in: its frieze colour, or vermilion where that is too pale to carry white
  const strong = (A, P) => { const c = P.frieze || P.ground || C.hingul; return lum(A, c) > 0.42 ? C.hingul : c; };
  // the tank wall: wet sandstone, a warm green-grey, its coping paler, darker and greener toward the water
  const TANK = { stone: '#7b7c68', lit: '#a3a38a', deep: '#3d4436', damp: '#4f5c48', coping: '#c2c2a8' };

  // burnish the ground under a surface before it is painted, as lime plaster is polished: the broad crumple
  // and the pressed hairs of the sheet go flat, and only a fine even tooth is left
  function burnish(A, polys, k, lim) {
    k = k || 0.5; lim = lim || 0.12;
    const HM = A.HM, W = A.W, H = A.H; if (!HM || !A.pushMask) return;
    const r = Math.max(2, Math.round(2 * A.S));
    for (const poly of (Array.isArray(polys[0][0]) ? polys : [polys])) {
      const m = A.pushMask(poly, 0); A.popMask();
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
          const i = Y * W + X, v = 0.5 + clamp((HM[i] - mean) * k, -lim, lim);
          HM[i] += (v - HM[i]) * d / 255;
        }
      }
    }
  }
  // a broad field laid with the stick on its side, three times over, the strokes running with the form
  function field(A, poly, c, o) {
    o = o || {};
    A.fill(poly, 'side', c, { w: o.w || 9, p: 1, reach: 1.6, passes: 3, turn: 0.12, ang: o.ang != null ? o.ang : 0.03, streak: 0.1, cv: 0.012 });
  }
  // a small form laid flat with the point of the stick
  function solid(A, poly, c, w, ang) {
    A.fill(poly, 'pastel', c, { w: Math.max(0.35, w || 1.2), p: 1, reach: 1.55, passes: 3, turn: 0.35, ang: ang == null ? 1.5 : ang, streak: 0.12, cv: 0.01 });
  }
  // a turned form: shade down its right, a lit line up its left, inside its own outline
  function model(A, poly, x0, x1, y0, y1, sh, lit, k) {
    k = k == null ? 1 : k;
    const w = x1 - x0;
    A.withMask(poly, () => {
      A.fill(rect(x1 - w * 0.36, y0 - 1, x1 + 1, y1 + 1), 'shade', sh, { w: Math.max(0.4, w * 0.16), p: 0.78 * k, passes: 1, ang: 1.5 });
      A.fill(rect(x1 - w * 0.15, y0 - 1, x1 + 1, y1 + 1), 'shade', sh, { w: Math.max(0.35, w * 0.1), p: 0.72 * k, passes: 1, ang: 1.5 });
      if (lit) A.stroke([[x0 + w * 0.22, y0 - 0.3], [x0 + w * 0.22, y1 + 0.3]], 'chalk', lit, { w: clamp(w * 0.1, 0.25, 1.4), p: 0.55 * k, tin: 0.1, tout: 0.1 });
    });
  }
  // the contour, in two goes: one unbroken even line, then a swell where the form turns from the light
  function ink(A, poly, w, o) {
    o = o || {};
    const { INK, KJ } = tk(A); w = w || 0.5;
    const r = A.resample(poly, clamp(w * 1.4, 0.3, 0.9), true), n = r.length; if (n < 3) return;
    let cx = 0, cy = 0; for (const p of r) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
    const sw = r.map((p, i) => {
      const a = r[(i - 1 + n) % n], b = r[(i + 1) % n];
      let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
      return clamp((nx * 0.78 + ny * 0.62 + 0.15) / 0.95, 0, 1);
    });
    const ring = r.concat(r.slice(0, 2)), swr = sw.concat(sw.slice(0, 2)), c = o.c || INK, p = o.p || 0.95;
    A.stroke(ring, KJ, c, { w: w * 0.6, p, tin: 0, tout: 0, wob: 0.22 });
    A.stroke(ring.map((q, i) => [q[0], q[1], 0.42 + 0.58 * swr[i]]), KJ, c, { w, p, tin: 0, tout: 0, wob: 0.22 });
  }
  // an open line in kajal; a hairline is the same at its finest
  function line(A, pts, w, o) { o = o || {}; const { INK, KJ } = tk(A); A.stroke(pts, KJ, o.c || INK, { w: w || 0.45, p: o.p || 0.9, wob: 0.3, tin: o.tin != null ? o.tin : 0.05, tout: o.tout != null ? o.tout : 0.08 }); }
  const hair = (A, pts, o) => line(A, pts, (o && o.w) || 0.22, Object.assign({ p: 0.75 }, o));
  // a long rule pulled by hand along a straight edge: in pulls, each a hair off the last
  function rule(A, xa, xb, y, w, c, tool, o) {
    o = o || {};
    const { INK, KJ } = tk(A), pts = [], n = Math.max(2, Math.ceil((xb - xa) / 10));
    for (let i = 0; i <= n; i++) pts.push([xa + (xb - xa) * i / n, y + (i && i < n ? A.rr(-0.04, 0.04) : 0)]);
    A.outline(pts, tool || KJ, c || INK, { w, p: o.p || 0.9, pull: A.rr(150, 260), again: o.again != null ? o.again : 0.06, tin: 0.03, tout: 0.04, wob: 0.28 });
  }
  // a ruled row of dots, laid one by one: each a hair off in place and size, never a stamp
  function dots(A, path, step, c, w, o) {
    o = o || {};
    for (const q of A.along(path, step, 0)) {
      if (o.skip && o.skip(q)) continue;
      A.dot(q.x + A.rr(-0.06, 0.06) * step, q.y + A.rr(-0.05, 0.05) * step, 'chalk', c, { w: w * A.rr(0.88, 1.08), p: A.rr(0.86, 1), len: w * 0.1 });
    }
  }
  // a flower of n petals round a heart, as the folio borders have them
  function floret(A, x, y, r, petal, heart, n, a0) {
    n = n || 5; a0 = a0 != null ? a0 : A.rr(0, TAU / n);
    for (let i = 0; i < n; i++) {
      const a = a0 + i * TAU / n + A.rr(-0.07, 0.07);
      A.dot(x + Math.cos(a) * r * 0.52, y + Math.sin(a) * r * 0.52, 'chalk', petal, { w: r * (n > 6 ? 0.5 : 0.62) * A.rr(0.93, 1.06), len: r * 0.18, ang: a, p: 0.97 });
    }
    if (heart) A.dot(x, y, 'chalk', heart, { w: r * 0.44, p: 1, len: r * 0.04 });
  }
  // a leaf from its stalk at (x, y), pointing along ang; bend curls it
  function leafPoly(A, x, y, len, wid, ang, bend) {
    bend = bend || 0;
    const c = Math.cos(ang), s = Math.sin(ang), P = (u, v) => [x + c * u - s * v, y + s * u + c * v];
    return A.spline([P(0, 0), P(len * 0.3, wid * 0.5 + bend * len * 0.06), P(len * 0.66, wid * 0.4 + bend * len * 0.14), P(len, bend * len * 0.2), P(len * 0.62, -wid * 0.38 + bend * len * 0.12), P(len * 0.28, -wid * 0.46 + bend * len * 0.03)], true, 0.25);
  }
  function leaf(A, x, y, len, wid, ang, c, o) {
    o = o || {};
    const pl = leafPoly(A, x, y, len, wid, ang, o.bend);
    A.fill(pl, 'pastel', c, { w: Math.max(0.3, wid * 0.4), p: 1, reach: 1.5, passes: 2, ang, streak: 0.1 });
    const ca = Math.cos(ang), sa = Math.sin(ang), b = o.bend || 0;
    if (o.rib !== false) A.stroke([[x + ca * len * 0.12, y + sa * len * 0.12], [x + ca * len * 0.5 - sa * b * len * 0.08, y + sa * len * 0.5 + ca * b * len * 0.08], [x + ca * len * 0.82 - sa * b * len * 0.16, y + sa * len * 0.82 + ca * b * len * 0.16]], 'chalk', o.rib || C.leafLit, { w: Math.max(0.16, wid * 0.12), p: 0.75, tin: 0.1, tout: 0.5 });
    if (o.line !== false) ink(A, pl, o.lw || 0.2, { p: 0.8 });
    return pl;
  }

  /* ================================================================ THE PLASTER
     Laid flat in the level's colour over burnished paper; then the courses ruled across it by hand
     and the joints drawn in running bond, each groove a dark line with a lit edge under it, and each
     block a hair off its neighbours in tone.  No mottle, no random chips. */
  M.w8Stone = function (A, poly, P, o) {
    o = o || {};
    const bb = A.bbox([poly]), tank = typeof P.stone === 'string' && P.stone.toLowerCase() === '#6e7670', HK = M.w8Hand;
    // the tank's stone is a warm green-grey, the colour of wet sandstone, not a cold grey
    const stone = tank ? TANK.stone : P.stone, deep = tank ? TANK.deep : (P.stoneDeep || A.mix(stone, '#000000', 0.55)), lit = tank ? TANK.lit : (P.stoneLit || stone);
    if (HK) HK.burnish(A, poly); else burnish(A, poly);
    field(A, poly, stone, { w: o.w ? clamp(o.w * 0.45, 6, 12) : 10 });
    // the last coats, laid along the courses with the stick on its side: one a hair lighter, one a hair deeper
    if (HK) HK.ground(A, poly, A.mix(stone, lit, tank ? 0.4 : 0.5), A.mix(stone, deep, tank ? 0.16 : 0.22), { ang: -0.02 });
    else A.fill(poly, 'side', A.mix(stone, lit, 0.32), { w: 8, p: 0.4, reach: 0.95, passes: 1, ang: -0.02, streak: 0.06, cv: 0.012 });
    const ch = o.course || 11, dark = tank ? A.mix(deep, '#1e2219', 0.3) : A.mix(deep, stone, 0.5), hi = A.mix(lit, '#fff6e0', 0.3);
    const hgt = bb[3] - bb[1], wl = [];
    if (tank && HK) {
      // the damp: where the water has stood the stone is darker and greener.  It is laid in long pulls along the
      // wall before the courses are cut, so the joints run through it; its top an old water line that rises and
      // falls a little, and nearer the water it is deeper again
      const yw = bb[1] + hgt * 0.52;
      for (let x = bb[0] - 2; x <= bb[2] + 2.1; x += 6) wl.push([x, yw + Math.sin(x * 0.031 + 1.3) * hgt * 0.05 + Math.sin(x * 0.11) * hgt * 0.02]);
      const band = wl.concat([[bb[2] + 2, bb[3] + 1], [bb[0] - 2, bb[3] + 1]]);
      A.withMask(poly, () => {
        HK.streaks(A, band, [TANK.damp, A.mix(TANK.damp, TANK.deep, 0.25), A.mix(TANK.damp, stone, 0.22)], { ang: 0.01, p: 0.62, sp: 0.75, wt: [0.5, 0.3, 0.2] });
        HK.streaks(A, rect(bb[0] - 2, bb[3] - hgt * 0.2, bb[2] + 2, bb[3] + 1), [TANK.deep, A.mix(TANK.deep, TANK.damp, 0.4)], { ang: 0, p: 0.5, sp: 0.8 });
      });
    }
    if (o.courses === false) { if (tank) damp(); return; }
    A.withMask(poly, () => {
      // the course lines, never quite level, never quite even
      const ys = [bb[1]];
      for (let y = bb[1] + ch * A.rr(0.6, 0.95); y < bb[3] - ch * 0.3; y += ch * A.rr(0.97, 1.03)) ys.push(y);
      ys.push(bb[3] + 1);
      for (let i = 0; i + 1 < ys.length; i++) {
        const ya = ys[i], yb = ys[i + 1], bl = ch * A.rr(2.2, 2.6);
        // the blocks of this course, set half a block over from the course above
        let x = bb[0] - bl * (i % 2 ? 0.5 : 0) - A.rr(0, bl * 0.25);
        while (x < bb[2] + 1) {
          const w = bl * A.rr(0.82, 1.18), x2 = x + w, k = A.rr(-1, 1);
          // each block washed a hair lighter or deeper than the next
          if (Math.abs(k) > 0.25) {
            if (HK) HK.streaks(A, rect(x, ya, x2, yb), [A.mix(stone, k > 0 ? lit : deep, 0.36)], { ang: A.rr(-0.02, 0.02), p: 0.1 + 0.18 * Math.abs(k), sp: 1.4 });
            else M.floorWash(A, rect(x, ya, x2, yb), k > 0 ? lit : deep, () => Math.abs(k) * (k > 0 ? 0.09 : 0.05) * (tank ? 2.2 : 1), k > 0 ? 'over' : 'mul');
          }
          if (i > 0 || ya > bb[1] + 0.5) {
            const xj = x2 + A.rr(-0.12, 0.12);
            if (yb - ya > 1.2) {
              line(A, [[xj, ya + 0.3], [xj + A.rr(-0.12, 0.12), yb - 0.25]], 0.26, { c: dark, p: 0.85 });
              A.stroke([[xj + 0.36, ya + 0.6], [xj + 0.36, yb - 0.4]], 'chalk', hi, { w: 0.22, p: 0.38, tin: 0.1, tout: 0.2 });
            }
          }
          x = x2;
        }
        if (i > 0) {
          rule(A, bb[0] - 2, bb[2] + 2, ya, 0.28, dark, null, { p: 0.85, again: 0 });
          rule(A, bb[0] - 2, bb[2] + 2, ya + 0.4, 0.22, hi, 'chalk', { p: 0.4, again: 0 });
        }
      }
    });
    if (tank) damp();
    // at the water the wall is wet: deeper, a little green, and darkest at the line it stands in
    function damp() {
      const h = bb[3] - bb[1], cp = Math.min(2.6, h * 0.18), cop = rect(bb[0], bb[1], bb[2], bb[1] + cp);
      // the coping: a long dressed stone, paler, its joints far apart
      field(A, cop, HK ? TANK.coping : A.mix(lit, '#d4dace', 0.3), { w: 1.4, ang: 0.02 });
      if (HK) HK.coat(A, cop, A.mix(TANK.coping, '#fffaf0', 0.35), { w: cp * 1.6, ang: 0, p: 0.4, gap: 0.6 });
      for (let x = bb[0] + A.rr(2, 9); x < bb[2]; x += A.rr(14, 19)) { line(A, [[x, bb[1] + 0.3], [x + A.rr(-0.1, 0.1), bb[1] + cp - 0.2]], 0.24, { c: dark, p: 0.6 }); A.stroke([[x + 0.35, bb[1] + 0.5], [x + 0.35, bb[1] + cp - 0.3]], 'chalk', hi, { w: 0.2, p: 0.4 }); }
      rule(A, bb[0], bb[2], bb[1] + cp, 0.4);
      if (HK) {
        // the old water line, pulled by hand over the courses (the damp under it was laid before them)
        A.withMask(poly, () => HK.pull(A, wl, 'chalk', A.mix(TANK.lit, TANK.damp, 0.35), { w: 0.3, p: 0.36, j: 0.08, long: 30 }));
      } else {
        M.floorWash(A, poly, '#2c4a40', (x, y) => 0.24 * sstep((y - bb[1] - h * 0.3) / (h * 0.7)), 'over');
        M.floorWash(A, poly, deep, (x, y) => 0.45 * sstep((y - bb[1] - h * 0.45) / (h * 0.55)), 'mul');
      }
      rule(A, bb[0], bb[2], bb[3] - 0.3, 0.4, null, null, { p: 0.7 });
    }
  };
  // a small break in a stone's edge, drawn: its broken lip in shade, its lower edge in the light
  M.w8Chip = function (A, x, y, r, P) {
    const stone = P.stone || '#c9b8a2', deep = P.stoneDeep || '#6e5a48', { INK } = tk(A);
    const a = A.rr(-0.35, 0.35), pts = A.ellipse(x, y, r, r * A.rr(0.42, 0.6), a), n = pts.length;
    A.fill(pts, 'pastel', A.mix(stone, deep, 0.32), { w: Math.max(0.3, r * 0.45), p: 0.95, reach: 1.4, passes: 2, ang: a, streak: 0.1 });
    A.stroke(pts.slice(Math.floor(n * 0.48)), tk(A).KJ, A.mix(INK, stone, 0.4), { w: 0.22, p: 0.75, tin: 0.2, tout: 0.2 });
    A.stroke(pts.slice(0, Math.ceil(n * 0.52)), 'chalk', A.mix(P.lime || stone, '#ffffff', 0.4), { w: 0.24, p: 0.6, tin: 0.2, tout: 0.2 });
  };

  /* ================================================================ THE PILLAR
     x the middle, yt the underside of what it carries, yb the floor, w the width of the shaft.
     A stepped plinth with a torus carved in lotus petals and a lac fillet; a turned shaft with a
     slight swell, banded in red, green and ochre lac and beaded in white; a pot capital with its
     leaves falling over the lip, an abacus, and bracket arms curling out under the beam.
     No two pillars the same: each band, swell and leaf sits a hair differently. */
  M.w8Pillar = function (A, x, yt, yb, w, P) {
    const h = yb - yt, lime = P.lime || C.cream, deep = P.stoneDeep || '#8a6a4a', { INK } = tk(A);
    const capH = h * 0.15, baseH = h * 0.12, sh0 = yt + capH, sh1 = yb - baseH;
    const SH = A.mix(lime, A.mix(deep, '#4a3c6c', 0.4), 0.5), LIT = A.mix(lime, '#ffffff', 0.45);
    const red = C.hingul, green = C.mal, och = P.gold || C.ochre;
    const lw = clamp(w * 0.085, 0.3, 0.5), hw = clamp(w * 0.04, 0.16, 0.24);
    const jw = A.rr(0.97, 1.03), jb = A.rr(-0.025, 0.025);
    burnish(A, rect(x - w * 1.55, yt - 0.4, x + w * 1.55, yb + 0.3));
    const piece = (poly, x0, x1, y0, y1, c, k) => { solid(A, poly, c || lime, Math.max(0.35, (x1 - x0) * 0.2)); model(A, poly, x0, x1, y0, y1, SH, LIT, k); ink(A, poly, lw); };
    const ring = (yc, hh, half, c, beads) => {
      const p = rect(x - half, yc - hh, x + half, yc + hh);
      solid(A, p, c, Math.max(0.3, hh * 1.2), 0.03);
      model(A, p, x - half, x + half, yc - hh, yc + hh, A.mix(c, INK, 0.35), null, 0.8);
      if (beads) dots(A, [[x - half + hh * 1.2, yc], [x + half - hh * 0.6, yc]], Math.max(0.55, hh * 1.7), C.white, hh * 1.05);
      hair(A, [[x - half, yc - hh], [x + half, yc - hh]], { w: hw });
      hair(A, [[x - half, yc + hh], [x + half, yc + hh]], { w: hw });
    };
    // 1. the plinth: a broad slab, the torus with its petals, a lac fillet, and the bell of the base
    const yP = yb - baseH * 0.26, yT = yb - baseH * 0.58, yF = yb - baseH * 0.68;
    piece(rect(x - w * 1.05, yP, x + w * 1.05, yb), x - w * 1.05, x + w * 1.05, yP, yb);
    const tor = A.spline([[x - w * 0.86, yP], [x - w * 0.96, (yP + yT) / 2], [x - w * 0.86, yT], [x + w * 0.86, yT], [x + w * 0.96, (yP + yT) / 2], [x + w * 0.86, yP]], true, 0.25);
    piece(tor, x - w * 0.96, x + w * 0.96, yT, yP);
    const np = w > 4.5 ? 5 : 4, pw = w * 1.7 / np;
    for (let i = 0; i < np; i++) {
      const px = x - w * 0.85 + (i + 0.5) * pw + A.rr(-0.05, 0.05) * pw;
      hair(A, A.spline([[px - pw * 0.44, yP - 0.15], [px - pw * 0.34, yT + (yP - yT) * 0.4], [px, yT + (yP - yT) * 0.14], [px + pw * 0.34, yT + (yP - yT) * 0.4], [px + pw * 0.44, yP - 0.15]], false, 0.2), { w: hw * 0.9, p: 0.7 });
    }
    ring((yF + yT) / 2, (yT - yF) / 2, w * 0.72, red, true);
    const bell = A.spline([[x - w * 0.7, yF], [x - w * 0.58, yF - (yF - sh1) * 0.45], [x - w * 0.5, sh1], [x + w * 0.5, sh1], [x + w * 0.58, yF - (yF - sh1) * 0.45], [x + w * 0.7, yF]], true, 0.25);
    piece(bell, x - w * 0.7, x + w * 0.7, sh1, yF);
    // 2. the shaft: faceted, a slight swell a third of the way up
    const half = v => w * 0.5 * jw * (0.93 + 0.07 * Math.sin(PI * v)) * (1 - 0.05 * v);
    const shaft = [];
    for (let i = 0; i <= 12; i++) { const v = i / 12; shaft.push([x - half(v), sh1 - (sh1 - sh0) * v]); }
    for (let i = 12; i >= 0; i--) { const v = i / 12; shaft.push([x + half(v), sh1 - (sh1 - sh0) * v]); }
    solid(A, shaft, lime, Math.max(0.35, w * 0.2));
    model(A, shaft, x - w * 0.5, x + w * 0.5, sh0, sh1, SH, LIT);
    const yv = v => sh1 - (sh1 - sh0) * v;
    hair(A, [[x - w * 0.19, yv(0.02)], [x - w * 0.2, yv(0.98)]], { w: hw * 0.8, p: 0.4, c: A.mix(INK, lime, 0.5) });
    hair(A, [[x + w * 0.2, yv(0.02)], [x + w * 0.19, yv(0.98)]], { w: hw * 0.9, p: 0.55, c: A.mix(INK, lime, 0.4) });
    ink(A, shaft, lw);
    // 3. its lac bands, turned on the lathe: low, the broad beaded collar, high, and the necking
    ring(yv(0.045), w * 0.1, half(0.045) * 1.06, green);
    const vm = 0.3 + jb, ym = yv(vm), cw = half(vm) * 1.18;
    const collar = rect(x - cw, ym - w * 0.34, x + cw, ym + w * 0.34);
    piece(collar, x - cw, x + cw, ym - w * 0.34, ym + w * 0.34);
    ring(ym, w * 0.15, cw * 0.98, red, true);
    hair(A, [[x - cw, ym - w * 0.24], [x + cw, ym - w * 0.24]], { w: hw, c: green, p: 0.8 });
    hair(A, [[x - cw, ym + w * 0.24], [x + cw, ym + w * 0.24]], { w: hw, c: green, p: 0.8 });
    ring(yv(0.7 - jb), w * 0.08, half(0.7) * 1.05, red);
    ring(yv(0.7 - jb) + w * 0.24, w * 0.05, half(0.7) * 1.04, och);
    ring(yv(0.965), w * 0.11, half(0.965) * 1.1, och);
    // 4. the capital: the pot, its leaves falling over its lip, the lip, the abacus
    const yBelly = sh0 - capH * 0.24, yLip = sh0 - capH * 0.5, yAb0 = sh0 - capH * 0.62, yAb1 = sh0 - capH * 0.78;
    const pot = A.spline([[x - w * 0.46, sh0 - capH * 0.02], [x - w * 0.8, yBelly], [x - w * 0.62, yLip], [x + w * 0.62, yLip], [x + w * 0.8, yBelly], [x + w * 0.46, sh0 - capH * 0.02]], true, 0.25);
    piece(pot, x - w * 0.8, x + w * 0.8, yLip, sh0);
    A.withMask(pot, () => A.stroke([[x - w * 0.82, yBelly + capH * 0.05], [x + w * 0.82, yBelly + capH * 0.05]], 'chalk', red, { w: Math.max(0.25, capH * 0.035), p: 0.8, tin: 0, tout: 0 }));
    if (P.gold) M.w8Zari(A, x, yBelly + capH * 0.05, Math.max(0.3, w * 0.09), P);
    const ll = capH * 0.3, lwid = w * 0.34;
    leaf(A, x + A.rr(-0.05, 0.05) * w, yLip + 0.1, ll * 1.05, lwid, PI / 2 + A.rr(-0.06, 0.06), C.leaf, { lw: hw });
    for (const sg of [-1, 1]) leaf(A, x + sg * w * 0.42, yLip + 0.05, ll, lwid * 0.92, PI / 2 + sg * A.rr(0.75, 0.9), sg < 0 ? C.leaf : A.mix(C.leaf, C.leafDeep, 0.3), { lw: hw, bend: -sg * 0.6 });
    piece(rect(x - w * 0.64, yAb0, x + w * 0.64, yLip), x - w * 0.64, x + w * 0.64, yAb0, yLip);
    dots(A, [[x - w * 0.5, (yAb0 + yLip) / 2], [x + w * 0.52, (yAb0 + yLip) / 2]], Math.max(0.5, w * 0.2), och, Math.max(0.28, (yLip - yAb0) * 0.42));
    piece(rect(x - w * 0.86, yAb1, x + w * 0.86, yAb0), x - w * 0.86, x + w * 0.86, yAb1, yAb0);
    // 5. the bracket arms under the beam, each curling down at its end into a bud
    const bh = yAb1 - yt;
    if (bh > 0.4) {
      const beam = rect(x - w * 0.7, yt, x + w * 0.7, yAb1);
      piece(beam, x - w * 0.7, x + w * 0.7, yt, yAb1);
      for (const sg of [-1, 1]) {
        const ex = x + sg * w * 1.38, arm = A.spline([[x + sg * w * 0.66, yAb1], [x + sg * w * 0.95, yAb1 - bh * 0.2], [x + sg * w * 1.22, yt + bh * 0.62], [ex, yt + bh * 0.5], [x + sg * w * 1.4, yt + bh * 0.1], [x + sg * w * 1.2, yt], [x + sg * w * 0.66, yt]], true, 0.2);
        piece(arm, Math.min(x + sg * w * 0.66, ex), Math.max(x + sg * w * 0.66, ex), yt, yAb1, null, 0.8);
        // the curl of its end, and the bud hanging from it
        hair(A, A.spline([[x + sg * w * 1.2, yt + bh * 0.52], [x + sg * w * 1.3, yt + bh * 0.3], [x + sg * w * 1.18, yt + bh * 0.22], [x + sg * w * 1.12, yt + bh * 0.36]], false, 0.15), { w: hw * 0.9, p: 0.7 });
        const bx = x + sg * w * 1.22, bud = A.spline([[bx - w * 0.1, yt + bh * 0.8], [bx, yt + bh * 0.8 + w * 0.36], [bx + w * 0.1, yt + bh * 0.8]], true, 0.12);
        solid(A, bud, och, 0.3);
        ink(A, bud, hw, { p: 0.8 });
      }
    }
  };

  /* ================================================================ THE FRIEZE
     Borders inside borders: a kajal rule, a band of the strong colour beaded in white, a hairline and a
     cream line, then the field and its running pattern, counted, then the same again mirrored. */
  M.w8Frieze = function (A, x0, x1, y0, y1, kind, P) {
    const h = y1 - y0, band = rect(x0, y0, x1, y1), { INK } = tk(A);
    const gc = P.frieze || P.ground || C.ochre, och = P.gold || C.ochre;
    const bc = kind === 'lattice' ? A.mix(C.mal, INK, 0.12) : kind === 'vine' ? C.maroon : C.hingul;
    burnish(A, band);
    field(A, band, gc, { w: clamp(h * 0.55, 3, 8) });
    const hb = h * 0.17, fy0 = y0 + hb, fy1 = y1 - hb, fh = fy1 - fy0, fm = (fy0 + fy1) / 2;
    for (const [a, b] of [[y0, fy0], [fy1, y1]]) A.fill(rect(x0, a, x1, b), 'pastel', bc, { w: Math.max(0.6, hb * 0.7), p: 1, reach: 1.55, passes: 3, turn: 0.1, ang: 0.02, streak: 0.08 });
    const wv = (x, ph) => Math.sin(x * 0.0137 + ph) * 0.6 + Math.sin(x * 0.051 + ph * 2) * 0.4;   // the hand's slow drift along a long run
    if (kind === 'lotus') {
      // ochre ground: a vermilion stem rolling the length of it; on every crest and trough an eight-petal
      // white flower with a red heart; at every crossing a pair of leaves; between, a bud of three dots
      const step = fh * 1.9, amp = fh * 0.2, ph = A.rr(0, 1);
      const yW = x => fm + Math.sin((x - x0) / step * PI + ph) * amp;
      const stem = []; for (let x = x0 - 2; x <= x1 + 2; x += 0.8) stem.push([x, yW(x) + wv(x, ph) * 0.06]);
      A.outline(stem, 'chalk', A.mix(C.hingul, INK, 0.08), { w: Math.max(0.35, fh * 0.075), p: 0.95, pull: A.rr(40, 70), again: 0.04 });
      const xs0 = x0 + step * (0.5 - ph / PI);
      for (let x = xs0 - step, i = 0; x < x1 + step; x += step, i++) {
        const fx = x + A.rr(-0.04, 0.04) * step, fy = yW(fx);
        const lx = x + step * 0.5, ly = yW(lx), sl = Math.cos((lx - x0) / step * PI + ph) * amp * PI / step;
        for (const sg of [-1, 1]) leaf(A, lx, ly, fh * 0.42, fh * 0.2, Math.atan(sl) + sg * A.rr(0.85, 1.05), sg > 0 ? C.leaf : A.mix(C.leaf, C.leafDeep, 0.35), { lw: 0.16, bend: sg * 0.4 });
        const bx = x + step * 0.25, by = yW(bx) - Math.sign(Math.sin((bx - x0) / step * PI + ph)) * fh * 0.12;
        for (let k = 0; k < 3; k++) A.dot(bx + (k - 1) * fh * 0.09, by + (k === 1 ? -fh * 0.06 : 0) * Math.sign(by - fm || 1), 'chalk', C.white, { w: fh * 0.085 * A.rr(0.9, 1.1), p: 0.95, len: 0.02 });
        floret(A, fx, fy, fh * 0.36 * A.rr(0.96, 1.04), C.white, null, 8);
        A.dot(fx, fy, 'chalk', C.hingul, { w: fh * 0.16, p: 1, len: 0.02 });
        A.dot(fx - fh * 0.02, fy - fh * 0.02, 'chalk', C.haldi, { w: fh * 0.06, p: 0.95, len: 0.01 });
      }
    } else if (kind === 'vine') {
      // peach ground: a green creeper, a leaf at every half wave turned away from the stem, jasmine open on
      // the crests and in bud in the troughs, a tendril curling between
      const step = fh * 2.3, amp = fh * 0.22, ph = A.rr(0, 1);
      const yW = x => fm + Math.sin((x - x0) / step * PI + ph) * amp;
      const stem = []; for (let x = x0 - 2; x <= x1 + 2; x += 0.8) stem.push([x, yW(x) + wv(x, ph) * 0.05]);
      A.outline(stem, 'chalk', C.leafDeep, { w: Math.max(0.3, fh * 0.05), p: 0.95, pull: A.rr(40, 70), again: 0.04 });
      for (let x = x0 - step, i = 0; x < x1 + step; x += step * 0.5, i++) {
        const y = yW(x), sl = Math.cos((x - x0) / step * PI + ph) * amp * PI / step, up = i % 2 ? -1 : 1;
        leaf(A, x, y, fh * 0.44, fh * 0.21, Math.atan(sl) - up * A.rr(0.7, 0.9), i % 4 < 2 ? C.leaf : A.mix(C.leaf, C.leafDeep, 0.3), { lw: 0.16, bend: up * 0.35 });
        const cx = x + step * 0.25, cy = yW(cx), top = Math.sin((cx - x0) / step * PI + ph);
        const fx = cx, fy = cy + (top > 0 ? 1 : -1) * fh * 0.02;
        if (i % 2 === 0) {
          floret(A, fx, fy, fh * 0.3 * A.rr(0.95, 1.05), C.white, C.haldi, 5);
        } else {
          // a jasmine bud on a short stalk, its calyx green
          const dy = top > 0 ? -1 : 1;
          A.stroke([[fx, fy], [fx + fh * 0.06, fy + dy * fh * 0.16]], 'chalk', C.leafDeep, { w: 0.22, p: 0.9 });
          A.dot(fx + fh * 0.09, fy + dy * fh * 0.27, 'chalk', C.white, { w: fh * 0.13, len: fh * 0.07, ang: PI / 2 + 0.3, p: 0.97 });
          A.dot(fx + fh * 0.06, fy + dy * fh * 0.17, 'chalk', C.leaf, { w: fh * 0.08, p: 0.95, len: 0.01 });
          // and a tendril, curling once
          const tx = x + step * 0.36, ty = yW(tx), t = [];
          for (let k = 0; k <= 14; k++) { const a = k / 14 * PI * 1.6, r = fh * 0.16 * (1 - k / 18); t.push([tx + Math.sin(a) * r, ty - dy * (fh * 0.14 - Math.cos(a) * r)]); }
          A.stroke(t, 'chalk', C.leafDeep, { w: 0.18, p: 0.85, tin: 0.05, tout: 0.4 });
        }
      }
    } else if (kind === 'lattice') {
      // red ground: an ochre trellis ruled corner to corner, a cream line beside each bar; a white flower at
      // every crossing, a green bead in every diamond, a white dot in every half-diamond at the edges
      const st = fh * 1.05;
      const xs = x0 - st * A.rr(0.2, 0.8);
      for (let x = xs - st; x < x1 + st; x += st) {
        const a = [x, fy0 + 0.15], b = [x + st, fy1 - 0.15], c = [x + st, fy0 + 0.15], d = [x, fy1 - 0.15];
        A.stroke([a, b], 'chalk', och, { w: Math.max(0.3, fh * 0.07), p: 0.95, tin: 0.02, tout: 0.02 });
        A.stroke([c, d], 'chalk', och, { w: Math.max(0.3, fh * 0.07), p: 0.95, tin: 0.02, tout: 0.02 });
        A.stroke([[a[0] + 0.45, a[1]], [b[0] + 0.45, b[1]]], 'chalk', A.mix(C.cream, och, 0.2), { w: 0.18, p: 0.6, tin: 0.05, tout: 0.05 });
        A.stroke([[c[0] + 0.45, c[1]], [d[0] + 0.45, d[1]]], 'chalk', A.mix(C.cream, och, 0.2), { w: 0.18, p: 0.6, tin: 0.05, tout: 0.05 });
      }
      for (let x = xs - st; x < x1 + st; x += st) {
        floret(A, x + st / 2 + A.rr(-0.06, 0.06), fm + A.rr(-0.06, 0.06), fh * 0.24, C.white, och, 4, PI / 4 + A.rr(-0.1, 0.1));
        A.dot(x, fm, 'chalk', C.mal, { w: fh * 0.15, p: 1, len: 0.02 });
        A.dot(x - fh * 0.03, fm - fh * 0.03, 'chalk', A.mix(C.mal, '#ffffff', 0.45), { w: fh * 0.05, p: 0.9, len: 0.01 });
        A.dot(x + st / 2, fy0 + fh * 0.17, 'chalk', C.white, { w: fh * 0.08, p: 0.95, len: 0.01 });
        A.dot(x + st / 2, fy1 - fh * 0.17, 'chalk', C.white, { w: fh * 0.08, p: 0.95, len: 0.01 });
      }
    } else if (kind === 'waves') {
      // green ground: a row of waves, each rising from the trough, curling over and turning in on itself,
      // a fine line laid under each, three drops of spray at each crest
      const step = fh * 1.3, rows = A.rr(0, 1);
      for (let x = x0 - step * (1 + rows), i = 0; x < x1 + step; x += step * A.rr(0.97, 1.03), i++) {
        const k = A.rr(0.95, 1.05), s = step * k, top = fy0 + fh * 0.16, bot = fy1 - fh * 0.14;
        const wave = A.spline([[x - s * 0.12, bot], [x + s * 0.3, bot - fh * 0.12], [x + s * 0.55, top + fh * 0.12], [x + s * 0.78, top], [x + s * 0.93, top + fh * 0.22], [x + s * 0.86, top + fh * 0.42], [x + s * 0.73, top + fh * 0.36], [x + s * 0.76, top + fh * 0.24], [x + s * 0.82, top + fh * 0.28]], false, 0.2);
        A.stroke(wave, 'chalk', C.white, { w: Math.max(0.3, fh * 0.065), p: 0.95, tin: 0.03, tout: 0.3 });
        const under = A.spline([[x + s * 0.02, bot + fh * 0.08], [x + s * 0.34, bot - fh * 0.04], [x + s * 0.58, top + fh * 0.3], [x + s * 0.7, top + fh * 0.2]], false, 0.25);
        A.stroke(under, 'chalk', A.mix(C.white, gc, 0.35), { w: 0.2, p: 0.7, tin: 0.1, tout: 0.4 });
        for (let d = 0; d < 3; d++) A.dot(x + s * (0.9 + d * 0.09), top - fh * (0.02 + (d === 1 ? 0.08 : 0)), 'chalk', C.white, { w: fh * 0.06, p: 0.9, len: 0.01 });
      }
      rule(A, x0, x1, fy1 - fh * 0.1, 0.2, A.mix(C.white, gc, 0.3), 'chalk', { p: 0.6, again: 0 });
    } else if (kind === 'stars') {
      // lapis ground: ruled rows of eight-rayed stars, a gold heart in each, and between every two a gold
      // bead with a white dot above and below it
      const step = fh * 1.2, x00 = x0 + step * A.rr(0.2, 0.6);
      for (let x = x00 - step; x < x1 + step; x += step) {
        const sx = x + A.rr(-0.04, 0.04) * step, sy = fm + A.rr(-0.04, 0.04) * fh, r = fh * 0.36 * A.rr(0.95, 1.05), a0 = A.rr(-0.05, 0.05);
        for (let k = 0; k < 8; k++) {
          const a = a0 + k * PI / 4, l = k % 2 ? r * 0.55 : r;
          A.stroke([[sx + Math.cos(a) * r * 0.12, sy + Math.sin(a) * r * 0.12], [sx + Math.cos(a) * l, sy + Math.sin(a) * l]], 'chalk', C.white, { w: (k % 2 ? 0.16 : 0.26) * r, p: 0.95, tin: 0.05, tout: 0.75 });
        }
        A.dot(sx, sy, 'chalk', och, { w: r * 0.32, p: 1, len: 0.02 });
        const bx = x + step / 2;
        A.dot(bx, fm, 'chalk', och, { w: fh * 0.13, p: 1, len: 0.02 });
        A.dot(bx, fy0 + fh * 0.18, 'chalk', C.white, { w: fh * 0.07, p: 0.95, len: 0.01 });
        A.dot(bx, fy1 - fh * 0.18, 'chalk', C.white, { w: fh * 0.07, p: 0.95, len: 0.01 });
      }
    }
    // the borders: white beads down the middle of each band, then the rules over everything
    for (const [a, b] of [[y0, fy0], [fy1, y1]]) dots(A, [[x0 + 0.5, (a + b) / 2], [x1, (a + b) / 2]], hb * 0.95, C.white, hb * 0.36);
    rule(A, x0, x1, y0 + 0.2, 0.45);
    rule(A, x0, x1, y1 - 0.2, 0.45);
    rule(A, x0, x1, fy0, 0.24, null, null, { p: 0.85 });
    rule(A, x0, x1, fy1, 0.24, null, null, { p: 0.85 });
    rule(A, x0, x1, fy0 + 0.42, 0.24, A.mix(C.cream, gc, 0.12), 'chalk', { p: 0.7, again: 0 });
    rule(A, x0, x1, fy1 - 0.42, 0.24, A.mix(C.cream, gc, 0.12), 'chalk', { p: 0.7, again: 0 });
  };

  /* ================================================================ THE CHHAJJA
     y the line where its sloped top meets its front.  Its shadow on the wall, painted flat and let go
     softly; the sloped top in lit lime, its rafters drawn running back toward the well's far point; the
     front, a beaded band over a row of dentils; a bead under each dentil; and where the pillars stand, a
     carved bracket of three tiers ending in a bud, each throwing its own small shadow. */
  M.w8Eave = function (A, x0, x1, y, P, o) {
    o = o || {};
    const th = o.th || 4, dp = o.dp || 4, sh = o.sh || 9, lime = P.lime || C.cream, deep = P.stoneDeep || '#6e4010', { INK } = tk(A);
    const k = th / 3.6, xa = x0 - 2, xb = x1 + 2, ph = A.rr(0, 6);
    // 1. the shadow under it
    M.floorWash(A, rect(x0, y + th, x1, y + th + sh), deep, (xx, yy) => {
      const t = (yy - y - th) / sh, e = 0.4 + 0.05 * Math.sin(xx * 0.09 + ph) + 0.03 * Math.sin(xx * 0.31 + ph * 2);
      return 0.46 * (t < e ? 1 : 1 - sstep((t - e) / (1 - e)));
    }, 'mul');
    for (const bx of (o.at || [])) {
      const s = [[bx - 1.6 * k, y + th], [bx + 1.9 * k, y + th], [bx + 2.4 * k, y + th + 2.6 * k], [bx + 1.6 * k, y + th + 6.2 * k], [bx + 0.6 * k, y + th + 6.6 * k], [bx - 0.4 * k, y + th + 4.2 * k]];
      M.floorWash(A, s.map(p => [p[0] + 1.1 * k, p[1] + 0.5 * k]), deep, () => 0.3, 'mul');
    }
    burnish(A, rect(xa, y - dp, xb, y + th + 1.2 * k));
    // 2. the sloped top, seen from above
    const top = rect(xa, y - dp, xb, y);
    field(A, top, A.mix(lime, '#ffffff', 0.3), { w: clamp(dp * 0.7, 1.5, 4), ang: 0.02 });
    M.floorWash(A, top, deep, (xx, yy) => 0.12 * sstep((yy - (y - dp)) / dp), 'mul');
    // where the slope breaks to the lip, one fine line
    rule(A, xa, xb, y - dp * 0.36, 0.2, A.mix(INK, lime, 0.5), null, { p: 0.6, again: 0 });
    // 3. the front: lime a little in shade, a band of the strong colour beaded in white, then dentils
    const front = rect(xa, y, xb, y + th);
    field(A, front, A.mix(lime, deep, 0.12), { w: clamp(th * 0.6, 1.2, 3), ang: 0.02 });
    // a row of vermilion beads along it, between two hairlines
    const b0 = y + th * 0.1, b1 = y + th * 0.42;
    dots(A, [[xa + 0.4, (b0 + b1) / 2], [xb, (b0 + b1) / 2]], (b1 - b0) * 1.5, C.hingul, (b1 - b0) * 0.55);
    const dt = 2.3 * k, slot = A.mix(deep, INK, 0.35), dl = A.mix(lime, '#ffffff', 0.5);
    const dxs = [];
    for (let x = xa + A.rr(0.2, 1) * dt; x < xb - 0.3; x += dt * A.rr(0.95, 1.05)) dxs.push(x);
    for (const x of dxs) {
      A.stroke([[x, b1 + 0.35 * k], [x, y + th - 0.2]], 'chalk', slot, { w: 0.5 * k, p: 0.85, tin: 0, tout: 0 });
      A.stroke([[x - 0.4 * k, b1 + 0.45 * k], [x - 0.4 * k, y + th - 0.35]], 'chalk', dl, { w: 0.2, p: 0.5, tin: 0.1, tout: 0.1 });
    }
    // 4. its edges, ruled
    A.stroke([[xa, y + 0.18], [xb, y + 0.18]], 'chalk', C.white, { w: 0.55 * k, p: 0.85, tin: 0, tout: 0 });
    rule(A, xa, xb, y - dp + 0.15, 0.3, A.mix(INK, lime, 0.3), null, { p: 0.75 });
    rule(A, xa, xb, y + 0.05, 0.32, null, null, { p: 0.75 });
    rule(A, xa, xb, b0, 0.2, null, null, { p: 0.75, again: 0 });
    rule(A, xa, xb, b1, 0.2, null, null, { p: 0.75, again: 0 });
    rule(A, xa, xb, y + th, 0.5);
    // a lime bead hung under every dentil block, its underside touched with kajal
    for (let i = 0; i + 1 < dxs.length; i++) {
      const bx = (dxs[i] + dxs[i + 1]) / 2 + A.rr(-0.06, 0.06);
      A.dot(bx, y + th + 0.55 * k, 'chalk', lime, { w: 0.62 * k * A.rr(0.92, 1.06), p: 0.95, len: 0.04 });
      A.dot(bx + 0.14 * k, y + th + 0.78 * k, 'chalk', slot, { w: 0.22 * k, p: 0.6, len: 0.02 });
    }
    // 5. the brackets: three tiers stepping in, a bud at the foot
    const SH = A.mix(lime, A.mix(deep, '#4a3c6c', 0.4), 0.5), LIT = A.mix(lime, '#ffffff', 0.7);
    for (const bx0 of (o.at || [])) {
      const bx = bx0 + A.rr(-0.08, 0.08), y0 = y + th;
      const tiers = [[1.75, 0, 2.1], [1.28, 2.1, 3.8], [0.86, 3.8, 5.0]];
      for (let t = 0; t < tiers.length; t++) {
        const hw = tiers[t][0] * k, a = y0 + tiers[t][1] * k, b = y0 + tiers[t][2] * k, rr = (b - a) * 0.45;
        const tier = A.spline([[bx - hw, a], [bx + hw, a], [bx + hw, b - rr], [bx + hw * 0.72, b], [bx - hw * 0.72, b], [bx - hw, b - rr]], true, 0.15);
        solid(A, tier, lime, Math.max(0.3, hw * 0.45));
        model(A, tier, bx - hw, bx + hw, a, b, SH, LIT);
        ink(A, tier, 0.36);
        if (t === 0) { floret(A, bx, (a + b) / 2, (b - a) * 0.42, C.white, C.hingul, 5); }
        if (t === 1) hair(A, [[bx - hw * 0.7, (a + b) / 2 + 0.1], [bx + hw * 0.7, (a + b) / 2 + 0.1]], { w: 0.18, p: 0.6 });
      }
      const bud = A.spline([[bx - 0.42 * k, y0 + 4.95 * k], [bx - 0.3 * k, y0 + 5.35 * k], [bx, y0 + 5.75 * k], [bx + 0.3 * k, y0 + 5.35 * k], [bx + 0.42 * k, y0 + 4.95 * k]], true, 0.12);
      solid(A, bud, P.gold || C.ochre, 0.3);
      ink(A, bud, 0.24, { p: 0.85 });
    }
  };

  /* ================================================================ A BELL
     hung on a chain of beads; matte ochre on the wall, its shade down the right, a lit line on the left */
  M.w8Bell = function (A, x, y, s, P) {
    const gold = P.gold || C.ochre, matte = !!P.matte, { INK } = tk(A);
    hair(A, [[x, y], [x + A.rr(-0.04, 0.04), y + 3.1 * s]], { w: 0.18, c: A.mix(INK, gold, 0.3), p: 0.8 });
    for (let i = 0; i < 4; i++) A.dot(x + A.rr(-0.03, 0.03), y + (0.35 + i * 0.72) * s, 'chalk', gold, { w: 0.5 * s, p: 0.95, len: 0.03 });
    const bell = A.spline([[x - 0.85 * s, y + 3.2 * s], [x - 1.05 * s, y + 4.5 * s], [x - 1.75 * s, y + 5.55 * s], [x + 1.75 * s, y + 5.55 * s], [x + 1.05 * s, y + 4.5 * s], [x + 0.85 * s, y + 3.2 * s]], true, 0.2);
    if (matte) {
      solid(A, bell, gold, 0.45 * s);
      model(A, bell, x - 1.75 * s, x + 1.75 * s, y + 3.1 * s, y + 5.6 * s, A.mix(gold, '#5a3008', 0.55), A.mix(gold, '#fff3c8', 0.6));
      A.withMask(bell, () => A.stroke([[x - 1.8 * s, y + 5.2 * s], [x + 1.8 * s, y + 5.2 * s]], 'chalk', A.mix(gold, '#7a4a10', 0.45), { w: 0.4 * s, p: 0.8, tin: 0, tout: 0 }));
    } else {
      A.fill(bell, 'gold', gold, { w: 0.7 * s, p: 1, passes: 2, gap: 0.45 });
    }
    ink(A, bell, 0.3);
    A.dot(x, y + 3.15 * s, 'chalk', gold, { w: 0.75 * s, p: 0.95, len: 0.03 });
    A.dot(x + 0.05 * s, y + 5.95 * s, tk(A).KJ, INK, { w: 0.6 * s, p: 0.95, len: 0.03 });
    if (!matte && P.glints) P.glints.push([x - 0.5 * s, y + 4.4 * s, 0.4 * s]);
    if (P.bells) P.bells.push([x, y, s]);
  };

  /* ================================================================ THE DADO
     A lime moulding strung with beads; behind, the wall's colour a shade deeper; two rows of lotus
     petals, the back row looking out between the front, each petal drawn, veined and blushed at its
     tip; then a plinth with a fine lac line and a rule at its foot. */
  M.w8Dado = function (A, x0, x1, y0, y1, P) {
    const h = y1 - y0, lime = P.lime || C.cream, stone = P.stone || '#d8962a', deep = P.stoneDeep || '#6e4010', { INK } = tk(A);
    const yA = y0 + h * 0.17, yB = y1 - h * 0.15;
    if (M.w8Hand) M.w8Hand.burnish(A, rect(x0, y0, x1, y1)); else burnish(A, rect(x0, y0, x1, y1));
    field(A, rect(x0, yA - 0.2, x1, yB + 0.2), A.mix(stone, deep, 0.22), { w: clamp(h * 0.4, 2, 6), ang: 1.5 });
    // the moulding and its string of beads
    field(A, rect(x0, y0, x1, yA), A.mix(lime, '#ffffff', 0.2), { w: clamp(h * 0.12, 0.8, 2.5), ang: 0.02 });
    const s0 = y0 + h * 0.045, s1 = y0 + h * 0.135;
    dots(A, [[x0 + 0.3, (s0 + s1) / 2], [x1, (s0 + s1) / 2]], Math.max(1.1, (s1 - s0) * 1.6), strong(A, P), (s1 - s0) * 0.85);
    rule(A, x0, x1, s1 + 0.25, 0.2, null, null, { p: 0.7, again: 0 });
    // the petals: the back row first, half a petal over, a little smaller and in the wall's shade
    const ph = yB - yA, pw = ph * 0.82, SH = A.mix(lime, A.mix(deep, '#4a3c6c', 0.35), 0.45), back = A.mix(lime, stone, 0.38);
    const petal = (x, wv, tipY, c, front) => {
      const tipX = x + A.rr(-0.03, 0.03) * wv, hh = yB - tipY;
      // each side its own pull, so the two meet at a point the way a lotus petal does
      const L = A.spline([[x - wv * 0.5, yB + 0.4], [x - wv * 0.5, yB - hh * 0.36], [x - wv * 0.36, yB - hh * 0.72], [tipX, tipY]], false, 0.2);
      const Rr = A.spline([[tipX, tipY], [x + wv * 0.36, yB - hh * 0.72], [x + wv * 0.5, yB - hh * 0.36], [x + wv * 0.5, yB + 0.4]], false, 0.2);
      const pl = L.concat(Rr.slice(1));
      const poly = pl.concat([[x, yB + 0.6]]);
      solid(A, poly, c, Math.max(0.3, wv * 0.2), 1.5);
      model(A, poly, x - wv * 0.5, x + wv * 0.5, tipY, yB, front ? SH : A.mix(SH, INK, 0.1), front ? A.mix(lime, '#ffffff', 0.6) : null, front ? 1 : 0.8);
      if (front) {
        A.withMask(poly, () => A.stroke([[tipX, tipY - 0.2], [tipX + A.rr(-0.05, 0.05), tipY + hh * 0.3]], 'chalk', A.mix(lime, C.pink, 0.55), { w: wv * 0.34, p: 0.55, tin: 0.05, tout: 0.6 }));
        hair(A, [[x + A.rr(-0.05, 0.05), yB - 0.4], [x + (tipX - x) * 0.4, yB - hh * 0.55]], { w: 0.16, p: 0.5, c: A.mix(INK, lime, 0.45) });
      }
      ink(A, pl, front ? 0.4 : 0.32);
      return pl;
    };
    const off = A.rr(0, pw);
    for (let x = x0 - pw + off + pw * 0.5; x < x1 + pw; x += pw * A.rr(0.98, 1.02)) petal(x, pw * 0.9 * A.rr(0.96, 1.04), yA + ph * 0.06 + A.rr(-0.04, 0.04) * ph, back, false);
    for (let x = x0 - pw + off; x < x1 + pw; x += pw * A.rr(0.98, 1.02)) petal(x, pw * 1.02 * A.rr(0.96, 1.04), yA + ph * 0.24 + A.rr(-0.04, 0.04) * ph, lime, true);
    // the plinth
    const pp = rect(x0, yB, x1, y1);
    field(A, pp, A.mix(lime, deep, 0.1), { w: clamp((y1 - yB) * 0.6, 0.8, 2.5), ang: 0.02 });
    rule(A, x0, x1, yB + (y1 - yB) * 0.5, Math.max(0.24, (y1 - yB) * 0.16), C.hingul, 'chalk', { p: 0.85, again: 0 });
    rule(A, x0, x1, yB, 0.42);
    rule(A, x0, x1, y1 - 0.2, 0.5);
    rule(A, x0, x1, y0 + 0.2, 0.5);
    rule(A, x0, x1, yA, 0.32, null, null, { p: 0.8 });
  };

  /* ================================================================ A LANDING
     Laid in slabs, row behind row, the rows deepening toward us and every joint across the floor running
     back to the well's far point, so the floor lies flat; each slab its own tone; the shade of the wall
     at its foot; at its front a painted border of florets in the level's strong colour; then the nose,
     catching the light, and the riser under it. */
  M.w8Floor = function (A, x0, x1, y0, y1, P, o) {
    o = o || {};
    const lime = P.lime || C.cream, deep = P.stoneDeep || '#6e4010', { INK } = tk(A);
    const H = y1 - y0, noseH = Math.min(2.2, H * 0.06), yN = y1 - noseH;
    const bH = clamp(H * 0.13, 2.6, 5.6), yBd1 = yN - 0.7, yBd0 = yBd1 - bH;
    const HK = M.w8Hand;
    if (HK) HK.burnish(A, rect(x0, y0, x1, y1)); else burnish(A, rect(x0, y0, x1, y1), 0.4, 0.09);
    const base = A.mix(A.mix(lime, C.cream, 0.68), P.stone || lime, 0.06);
    field(A, rect(x0, y0, x1, yN), base, { w: 9, ang: 0.03 });
    // the hand over the whole floor: a paler coat pulled along it, a deeper one a little across
    if (HK) HK.ground(A, rect(x0, y0, x1, yN), A.mix(base, '#fffaf0', 0.45), A.mix(base, P.stoneWarm || P.stone || deep, 0.15), { ang: 0.03 });
    // the slabs
    const fr = H > 22 ? [0.2, 0.235, 0.265, 0.3] : [0.45, 0.55], top = yBd0 - 0.5;
    const tones = [A.mix(base, '#ffffff', 0.5), A.mix(base, P.stoneWarm || P.stone || lime, 0.5), A.mix(base, deep, 0.25), A.mix(base, '#ffffff', 0.25), A.mix(base, P.stone || lime, 0.4)];
    const jd = A.mix(A.mix(deep, INK, 0.2), lime, 0.3), jl = A.mix(lime, '#ffffff', 0.65);
    // a joint across the floor leans toward the middle of the well, as far as a painter would let it
    const lean = (x, y) => 0.6 * clamp((x - VX) / (y - VY), -0.6, 0.6);
    let ya = y0;
    for (let r = 0; r < fr.length; r++) {
      const yb = r === fr.length - 1 ? top : ya + (top - y0) * fr[r], mid = (ya + yb) / 2;
      const du = (yb - ya) * A.rr(2.6, 3.1), dy = yb - ya;
      let ua = x0 - du * (r % 2 ? 0.5 : 0) - A.rr(0, du * 0.3);
      const ue = x1, X = (xx, y) => xx + lean(xx, mid) * (y - ya);
      while (ua < ue + du) {
        const ub = ua + du * A.rr(0.8, 1.2), slab = [[X(ua, ya), ya], [X(ub, ya), ya], [X(ub, yb), yb], [X(ua, yb), yb]];
        const k = A.rr(0, 1), t = A.pick(tones);
        // each slab its own tone, rubbed on with the stick on its side, so it is a hair off its neighbours
        if (k > 0.15) {
          if (HK) HK.streaks(A, slab, [A.mix(t, base, 0.3)], { ang: 0.03, p: 0.12 + (k - 0.15) * 0.24, sp: 1.5 });
          else M.floorWash(A, slab, t, () => (k - 0.15) * 0.42, 'over');
        }
        // the joint at the slab's end: a dark groove with its lit edge
        if (ub < ue) {
          const ja = [X(ub, ya) + A.rr(-0.08, 0.08), ya + 0.25], jb = [X(ub, yb) + A.rr(-0.1, 0.1), yb - 0.2];
          if (HK) {
            HK.pull(A, [ja, jb], tk(A).KJ, jd, { w: 0.28, p: 0.85, j: 0.07 });
            HK.pull(A, [[ja[0] + 0.4, ja[1] + 0.3], [jb[0] + 0.4, jb[1] - 0.2]], 'chalk', jl, { w: 0.24, p: 0.45, j: 0.05, tin: 0.1, tout: 0.15 });
          } else {
            line(A, [ja, jb], 0.28, { c: jd, p: 0.85 });
            A.stroke([[ja[0] + 0.4, ja[1] + 0.3], [jb[0] + 0.4, jb[1] - 0.2]], 'chalk', jl, { w: 0.24, p: 0.45, tin: 0.1, tout: 0.15 });
          }
        }
        ua = ub;
      }
      if (r > 0) { rule(A, x0, x1, ya, 0.28, jd, null, { p: 0.85, again: 0 }); rule(A, x0, x1, ya + 0.42, 0.24, jl, 'chalk', { p: 0.45, again: 0 }); }
      ya = yb;
    }
    // the wall's foot throws a little shade back on the floor
    M.floorWash(A, rect(x0, y0, x1, y0 + H * 0.24), deep, (x, y) => 0.3 * (1 - sstep((y - y0) / (H * 0.24))), 'mul');
    // the border at the front
    const bc = strong(A, P), och = P.gold || C.ochre, bm = (yBd0 + yBd1) / 2;
    rule(A, x0, x1, top, 0.28, jd, null, { p: 0.85, again: 0 });
    A.fill(rect(x0, yBd0, x1, yBd1), 'pastel', bc, { w: Math.max(0.6, bH * 0.5), p: 1, reach: 1.55, passes: 3, turn: 0.1, ang: 0.02, streak: 0.08 });
    const step = bH * 2.3, xs = x0 + A.rr(0.2, 0.8) * step;
    for (let x = xs - step; x < x1 + step; x += step * A.rr(0.985, 1.015)) {
      floret(A, x, bm + A.rr(-0.04, 0.04), bH * 0.4, C.white, C.haldi, 5);
      const dx = x + step / 2, q = bH * 0.13;
      for (const [a, b] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) A.dot(dx + a * q * 1.3, bm + b * q * 1.3, 'chalk', C.white, { w: bH * 0.09, p: 0.95, len: 0.01 });
      A.dot(dx, bm, 'chalk', och, { w: bH * 0.08, p: 0.95, len: 0.01 });
    }
    rule(A, x0, x1, yBd0 + bH * 0.12, 0.24, och, 'chalk', { p: 0.85, again: 0 });
    rule(A, x0, x1, yBd1 - bH * 0.12, 0.24, och, 'chalk', { p: 0.85, again: 0 });
    rule(A, x0, x1, yBd0, 0.3);
    rule(A, x0, x1, yBd1, 0.3);
    // the nose and the riser
    const riser = rect(x0, yN, x1, y1);
    field(A, riser, A.mix(lime, deep, 0.36), { w: 1.4, ang: 0.02 });
    A.stroke([[x0, yN - 0.12], [x1, yN - 0.12]], 'chalk', C.white, { w: 0.65, p: 0.9, tin: 0, tout: 0 });
    rule(A, x0, x1, yN + 0.35, 0.3, null, null, { p: 0.75 });
    rule(A, x0, x1, y1 - 0.1, 0.5);
  };

  /* ================================================================ A POINT OF GOLD
     on the wall it is matte ochre: a bead, its shade on the lower right, one lit touch; no glint.
     Only where the caller asks for leaf (a focal object's palette, not matte) is it leaf with a glint. */
  M.w8Zari = function (A, x, y, r, P) {
    r = Math.max(0.28, r);
    const gold = (P && P.gold) || C.ochre;
    if (P && P.matte) {
      A.dot(x, y, 'pastel', gold, { w: r * 2, p: 1, reach: 1.45, len: r * 0.08 });
      A.dot(x + r * 0.32, y + r * 0.32, 'chalk', A.mix(gold, '#6a3c0c', 0.4), { w: r * 0.85, p: 0.55, len: r * 0.1, ang: -0.8 });
      A.dot(x - r * 0.3, y - r * 0.32, 'chalk', A.mix(gold, '#fff3c8', 0.65), { w: r * 0.55, p: 0.8, len: 0.01 });
      return;
    }
    A.dot(x, y, 'gold', gold, { w: r * 2, p: 1, reach: 1.4 });
    A.dot(x - r * 0.25, y - r * 0.3, 'chalk', '#fff6d0', { w: r * 0.7, p: 0.8 });
    if (P && P.glints) P.glints.push([x, y, r]);
  };
})();
