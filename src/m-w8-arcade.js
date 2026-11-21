(function () {
  'use strict';
  /* ==========================================================================
     THE GOLD WELL (well8k): THE ARCADE A LEVEL IS BUILT OF
       M.w8Arch(x0, x1, yb, ys, ya, lobes)    the opening of a cusped arch, as a polygon (draws nothing)
       M.w8Stone(A, poly, P, o)               a wall of lime-washed sandstone: ground, mottle, courses, chips
       M.w8Pillar(A, x, yt, yb, w, P)         a slender pillar: pot-and-leaf capital, banded shaft, stepped base
       M.w8Bay(A, b, kind, P, o)              one arched bay of the arcade and what is inside it
       M.w8Eave(A, x0, x1, y, P, o)           the chhajja: a thin slab on brackets, and its shadow on the wall
       M.w8Frieze(A, x0, x1, y0, y1, kind, P) a painted band: 'lotus' rosettes on gold, 'vine', 'lattice', 'waves', 'stars'
       M.w8Dado(A, x0, x1, y0, y1, P)         a row of upright lotus petals cut in the plinth
       M.w8Floor(A, x0, x1, y0, y1, P, o)     a landing of lime plaster, and its step nose
       M.w8Halo(A, cx, cy, r, P, o)           rings of gold, the way Mewar paints light round something holy
       M.w8Bell(A, x, y, s, P)                a small brass bell on its chain
       M.w8Zari(A, x, y, r, P)                a raised dot of gold that catches the light (recorded in P.glints)
       M.w8Petal(A, x, y, s, kind, ang)       one falling petal: 'mari', 'rose', 'jasmine', 'gold'
       M.w8Rangoli(A, cx, cy, rx, ry, P)      a chalk-and-powder pattern laid on a threshold
     Units are picture units.  P is the palette of the level (see stage-well8k.js).  Nothing runs on load.
     ======================================================================== */
  // gold: leaf (the 'gold' tool, burnished, it catches the light) or, where P.matte, painted yellow ochre (chalk)
  const LEAF = P => (P && P.matte) ? 'chalk' : 'gold';
  const PI = Math.PI, TAU = PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  /* ---------------------------------------------------------------- the shape of an arch
     A pointed arch from (x0, ys) up to its apex at ya and down to (x1, ys), cut into lobes that bulge outward with
     their cusps pointing in, standing on two jambs that go down to yb.  lobes 0 = a plain pointed arch.             */
  M.w8Arch = function (x0, x1, yb, ys, ya, lobes) {
    const xc = (x0 + x1) / 2, hw = (x1 - x0) / 2, rise = ys - ya;
    const f = u => 0.72 * Math.sqrt(Math.max(0, 1 - (1 - u) * (1 - u))) + 0.28 * u;
    const base = [];
    const N = 40;
    for (let i = 0; i <= N; i++) { const u = i / N; base.push([x0 + hw * u, ys - rise * f(u)]); }
    for (let i = N - 1; i >= 0; i--) { const u = i / N; base.push([x1 - hw * u, ys - rise * f(u)]); }
    let curve = base;
    if (lobes) {
      // equal steps along the curve, then a scallop between each pair of cusps
      let len = 0; const cum = [0];
      for (let i = 1; i < base.length; i++) { len += Math.hypot(base[i][0] - base[i - 1][0], base[i][1] - base[i - 1][1]); cum.push(len); }
      const at = s => { let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const t = (s - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]); return [base[i - 1][0] + (base[i][0] - base[i - 1][0]) * t, base[i - 1][1] + (base[i][1] - base[i - 1][1]) * t]; };
      curve = [];
      for (let k = 0; k < lobes; k++) {
        const a = at(len * k / lobes), b = at(len * (k + 1) / lobes), m = at(len * (k + 0.5) / lobes);
        // outward: away from the middle of the springing line
        let nx = m[0] - xc, ny = m[1] - ys; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]) * (k === 0 || k === lobes - 1 ? 0.3 : 0.4);
        for (let j = 0; j <= 8; j++) {
          const t = j / 8, bump = Math.sin(t * PI) * d;
          curve.push([a[0] + (b[0] - a[0]) * t + nx * bump, a[1] + (b[1] - a[1]) * t + ny * bump]);
        }
      }
    }
    return [[x0, yb]].concat(curve, [[x1, yb]]);
  };

  /* ---------------------------------------------------------------- stone */
  M.w8Stone = function (A, poly, P, o) {
    o = o || {};
    const bb = A.bbox([poly]);
    A.ground(poly, P.stone, { w: o.w || 22, edge: 0, rub: 7, c2: P.stoneLit, top: 0.55 });
    // the lime wash is never even: lighter where the sun keeps it dry, warmer in blooms
    M.floorCloud(A, poly, P.stoneLit, { scale: 60, seed: A.rr(0, 99), thr: 0.55, soft: 0.3, p: 0.32, w: 9 });
    M.floorCloud(A, poly, P.stoneWarm || P.stone, { scale: 34, seed: A.rr(0, 99), thr: 0.66, soft: 0.25, p: 0.22, w: 6 });
    if (o.courses === false) return;
    // courses of blocks, drawn with the geru stick, never quite level; the joints come and go
    const ch = o.course || 11;
    A.withMask(poly, () => {
      for (let y = bb[1] + A.rr(2, ch); y < bb[3]; y += ch * A.rr(0.9, 1.1)) {
        const tilt = A.rr(-0.25, 0.25);
        let x = bb[0] - A.rr(0, 20);
        A.stroke([[bb[0] - 5, y], [(bb[0] + bb[2]) / 2, y + tilt * 2 + A.rr(-0.4, 0.4)], [bb[2] + 5, y + tilt * 4]], 'geru', A.mix(P.line, P.stone, 0.62), { w: 0.42, p: 0.45, wob: 0.6 });
        while (x < bb[2]) {
          const bw = A.rr(16, 32);
          x += bw;
          if (A.chance(0.8)) A.stroke([[x, y + 0.4], [x + A.rr(-0.5, 0.5), y + ch - 0.4]], 'geru', A.mix(P.line, P.stone, 0.58), { w: 0.4, p: 0.5 });
          if (A.chance(0.08)) M.w8Chip(A, x + A.rr(-6, 6), y + A.rr(2, ch - 2), A.rr(1.2, 2.6), P);
        }
      }
    });
  };
  M.w8Chip = function (A, x, y, r, P) {
    const pts = A.roughen(A.ellipse(x, y, r, r * A.rr(0.55, 0.9), A.rr(0, PI)), r * 0.25, 2, true);
    A.fill(pts, 'chalk', A.mix(P.stone, P.stoneDeep, 0.35), { w: 0.9, p: 0.8, passes: 1 });
    A.stroke(pts.slice(0, Math.ceil(pts.length * 0.55)), 'kajal', A.mix(P.line, P.stone, 0.4), { w: 0.32, p: 0.6 });
    A.stroke(pts.slice(Math.floor(pts.length * 0.5)), 'chalk', P.lime, { w: 0.4, p: 0.6 });
  };

  /* ---------------------------------------------------------------- the pillar
     x the middle, yt the bottom of the bracket it carries, yb the floor it stands on, w the width of the shaft */
  M.w8Pillar = function (A, x, yt, yb, w, P) {
    const h = yb - yt, lit = P.lime, deep = P.stoneDeep, line = P.line;
    const capH = h * 0.15, baseH = h * 0.12, sh0 = yt + capH, sh1 = yb - baseH;
    const piece = (pts, c, o) => {
      o = o || {};
      A.fill(pts, 'chalk', c, { w: Math.max(0.8, w * 0.22), p: 1, reach: 1.5, passes: 2, gap: 0.45, ang: o.ang != null ? o.ang : 1.45 });
      // the shade side (light comes from the upper left)
      const bb = A.bbox([pts]), cx = (bb[0] + bb[2]) / 2;
      M.floorWash(A, pts, deep, (px) => 0.55 * sstep((px - cx) / ((bb[2] - bb[0]) * 0.5) + 0.35), 'mul');
      A.outline(pts, 'kajal', line, { closed: true, w: 0.42, p: 0.72, again: 0.1, pull: 30 });
    };
    // the stepped base
    piece(rect(x - w * 0.95, yb - baseH * 0.45, x + w * 0.95, yb), lit);
    piece(rect(x - w * 0.75, yb - baseH, x + w * 0.75, yb - baseH * 0.45), lit);
    // the shaft: a slight swell, banded a third of the way up
    const sw = v => w * 0.5 * (0.92 + 0.08 * Math.sin(PI * v));
    const shaft = [];
    for (let i = 0; i <= 10; i++) { const v = i / 10; shaft.push([x - sw(v), sh1 - (sh1 - sh0) * v]); }
    for (let i = 10; i >= 0; i--) { const v = i / 10; shaft.push([x + sw(v), sh1 - (sh1 - sh0) * v]); }
    piece(shaft, lit, { ang: 1.52 });
    // flutes: two hair lines, one in kajal on the shade side and one in chalk on the light side
    A.stroke([[x + w * 0.16, sh0 + 1], [x + w * 0.16, sh1 - 1]], 'kajal', A.mix(line, lit, 0.55), { w: 0.32, p: 0.5 });
    A.stroke([[x - w * 0.2, sh0 + 1], [x - w * 0.2, sh1 - 1]], 'chalk', '#fffaf0', { w: 0.45, p: 0.6 });
    const band = sh1 - (sh1 - sh0) * 0.32;
    piece(rect(x - w * 0.62, band - w * 0.28, x + w * 0.62, band + w * 0.28), lit);
    if (P.ground) A.stroke([[x - w * 0.55, band], [x + w * 0.55, band]], 'chalk', P.accent || '#c63d2f', { w: 0.6, p: 0.85, tin: 0, tout: 0 });
    // the capital: a pot with leaves falling over its lip (ghata-pallava), then an abacus
    const pot = A.spline([[x - w * 0.5, sh0], [x - w * 0.82, sh0 - capH * 0.35], [x - w * 0.6, sh0 - capH * 0.66], [x + w * 0.6, sh0 - capH * 0.66], [x + w * 0.82, sh0 - capH * 0.35], [x + w * 0.5, sh0]], true, 0.6);
    piece(pot, lit);
    for (const sg of [-1, 1]) A.stroke(A.spline([[x + sg * w * 0.15, sh0 - capH * 0.66], [x + sg * w * 0.62, sh0 - capH * 0.5], [x + sg * w * 0.78, sh0 - capH * 0.2]], false, 0.5), 'kajal', A.mix(line, lit, 0.35), { w: 0.36, p: 0.65 });
    piece(rect(x - w * 0.95, yt, x + w * 0.95, sh0 - capH * 0.66), lit);
    if (P.gold) M.w8Zari(A, x, sh0 - capH * 0.38, 0.55, P);
  };

  /* ---------------------------------------------------------------- one bay
     b = {x0, x1, yt, yb}: the space between two pillars, from the underside of the frieze to the sill.
     kind: 'halo' (a gilded niche ringed with light), 'panel' (a little painting, o.motif), 'jharokha' (a hung balcony),
           'door' (a doorway into the dark, with a lamp), 'jali' (a stone screen), 'lamp' (a dark niche, a lit lamp)     */
  M.w8Bay = function (A, b, kind, P, o) {
    o = o || {};
    const x0 = b.x0, x1 = b.x1, yt = b.yt, yb = b.yb, w = x1 - x0, h = yb - yt, xc = (x0 + x1) / 2;
    const inset = w * 0.08;
    const ys = yt + h * (kind === 'door' ? 0.34 : 0.42), ya = yt + h * 0.04;
    const lobes = o.lobes != null ? o.lobes : (w > 40 ? 9 : 7);
    const op = M.w8Arch(x0 + inset, x1 - inset, yb, ys, ya, lobes);
    const frame = M.w8Arch(x0 + inset * 0.35, x1 - inset * 0.35, yb, ys, ya - h * 0.03, 0);
    const info = { op, xc, ys, ya, yb };
    // the moulded frame round the opening: a band of lime a shade lighter than the wall, with a gold rule
    A.fill(frame, 'chalk', P.frame || P.lime, { w: 2, p: 0.95, reach: 1.3, passes: 2, gap: 0.5, ang: 1.2 });
    A.outline(frame, 'geru', A.mix(P.line, P.stone, 0.45), { closed: false, w: 0.42, p: 0.6, pull: 40 });
    // inside
    if (kind === 'halo') {
      A.fill(op, 'side', P.ground, { w: 7, p: 1, reach: 1.4, passes: 2, ang: 1.2 });
      A.withMask(op, () => {
        A.fill(op, LEAF(P), P.gold || '#d4a437', { w: 2.4, p: 0.62, passes: 1, ang: 0.3, gap: 0.9 });
        M.w8Halo(A, xc, ys - h * 0.02, w * 0.36, P, { rays: true });
      });
      // a lamp on the sill below the light, and a small lotus under it
      M.w8Lamp(A, xc, yb - 0.6, w * 0.16, P, o.lit !== false);
    } else if (kind === 'panel') {
      A.fill(op, 'side', o.ground || P.panel || '#2a4b96', { w: 6, p: 1, reach: 1.45, passes: 2, ang: A.rr(-0.4, 0.4) });
      A.withMask(op, () => (o.paint || ((a, b, c, d) => M.w8Miniature(A, a, b, c, d, o.motif || 'mango', P, o)))(x0 + inset, yt, x1 - inset, yb));
    } else if (kind === 'door') {
      M.w8Dark(A, op, P, yb);
      A.withMask(op, () => {
        // a further arch inside, lit from a lamp on the floor
        const op2 = M.w8Arch(xc - w * 0.2, xc + w * 0.2, yb, ys + h * 0.18, ys - h * 0.02, 5);
        A.fill(op2, 'side', A.mix(P.dark || '#2a1810', P.glow || '#e8a040', 0.35), { w: 4, p: 0.9, passes: 2 });
        M.lampGlow(A, xc, yb - h * 0.12, w * 0.5, 0.8, {});
        A.outline(op2, 'kajal', P.line, { closed: false, w: 0.4, p: 0.6 });
      });
      M.w8Lamp(A, xc, yb - 0.6, w * 0.2, P, true);
    } else if (kind === 'jali') {
      M.w8Dark(A, op, P, yb);
      A.withMask(op, () => {
        M.w8JaliScreen(A, op, P);
        if (o.broken) {
          const hx = xc + w * 0.12, hy = ys + h * 0.06, hole = A.roughen(A.spline([[hx - w * 0.2, hy + h * 0.02], [hx - w * 0.06, hy - h * 0.14], [hx + w * 0.16, hy - h * 0.1], [hx + w * 0.22, hy + h * 0.08], [hx + w * 0.04, hy + h * 0.2], [hx - w * 0.12, hy + h * 0.15]], true, 0.6), w * 0.02, 1.2, true);
          A.fill(hole, 'side', P.dark || '#2a1810', { w: Math.max(1, w * 0.06), p: 1, passes: 2, ang: 1.2 });
          A.stroke(hole.slice(0, Math.ceil(hole.length * 0.6)), 'chalk', A.mix(P.jali || P.lime, '#ffffff', 0.35), { w: 0.5, p: 0.8 });
          A.outline(hole, 'kajal', P.line, { closed: true, w: 0.4, p: 0.7 });
        }
      });
      if (o.broken) for (let i = 0; i < 5; i++) { const cx2 = xc + A.rr(-w * 0.3, w * 0.3); A.fill(A.roughen(A.ellipse(cx2, yb - 0.9, A.rr(0.8, 1.6), A.rr(0.5, 0.9)), 0.25, 1, true), 'chalk', P.jali || P.lime, { w: 0.6, p: 1, passes: 2 }); }
    } else if (kind === 'lamp') {
      M.w8Dark(A, op, P, yb);
      A.withMask(op, () => M.lampGlow(A, xc, yb - h * 0.08, w * 0.6, 0.7, {}));
      M.w8Lamp(A, xc, yb - 0.6, w * 0.18, P, true);
    } else if (kind === 'jharokha') {
      M.w8Dark(A, op, P, yb);
      M.w8Jharokha(A, x0, x1, yt, yb, P, o);
    }
    // the hand-drawn edge of the opening, and a gold rule just inside it
    A.outline(op.slice(1, -1), 'kajal', P.line, { closed: false, w: 0.55, p: 0.85, pull: 34, again: 0.2 });
    if (P.gold && kind !== 'jharokha') A.stroke(A.resample(op.slice(1, -1), 1.2, false).map(p => [p[0] + (p[0] < xc ? 0.9 : -0.9), p[1] + 0.9]), LEAF(P), P.gold, { w: 0.45, p: 0.8 });
    // the spandrels: a small flower in each, and a gold dot
    for (const sg of [-1, 1]) {
      const sx = xc + sg * w * 0.36, sy = yt + h * 0.12;
      M.w8Rosette(A, sx, sy, Math.min(w, h) * 0.07, P);
    }
    return info;
  };
  // the dark of an opening into the stone: a deep warm black, lighter low down where the floor throws light back
  M.w8Dark = function (A, op, P, yb) {
    const bb = A.bbox([op]);
    A.fill(op, 'side', P.dark || '#2a1810', { w: 6, p: 1, reach: 1.6, passes: 2, ang: 1.3 });
    M.floorWash(A, op, A.mix(P.dark || '#2a1810', P.stoneDeep, 0.5), (x, y) => 0.5 * sstep((y - bb[1]) / (bb[3] - bb[1]) * 1.4 - 0.4));
  };

  /* a niche lamp: a clay diya on the sill, lit or not; wd is the width of the bowl */
  M.w8Lamp = function (A, x, y, wd, P, lit) {
    const s = wd / 32;
    M.wellDiya(A, x - 3 * s, y, s, A.ri(0, 2), {});
    if (lit && P.lamps) P.lamps.push([x + 12 * s, y - 16 * s]);
  };

  /* ---------------------------------------------------------------- the jharokha: a balcony hung on the wall */
  M.w8Jharokha = function (A, x0, x1, yt, yb, P, o) {
    const w = x1 - x0, h = yb - yt, xc = (x0 + x1) / 2, lit = P.lime, line = P.line;
    const bx0 = x0 - w * 0.06, bx1 = x1 + w * 0.06;
    const roofY = yt + h * 0.16, sillY = yt + h * 0.7, footY = yt + h * 0.86;
    // brackets under it
    for (const fx of [bx0 + w * 0.12, xc, bx1 - w * 0.12]) {
      const br = A.spline([[fx - w * 0.06, footY], [fx + w * 0.06, footY], [fx + w * 0.03, footY + h * 0.08], [fx, yb - h * 0.02], [fx - w * 0.03, footY + h * 0.08]], true, 0.5);
      A.fill(br, 'chalk', lit, { w: 1.2, p: 1, passes: 2, gap: 0.45 });
      M.floorWash(A, br, P.stoneDeep, () => 0.35, 'mul');
      A.outline(br, 'kajal', line, { closed: true, w: 0.38, p: 0.7 });
    }
    // the floor slab and the railing of stone screen
    const slab = rect(bx0, sillY, bx1, footY);
    A.fill(slab, 'chalk', lit, { w: 1.6, p: 1, passes: 2, gap: 0.45, ang: 0.05 });
    A.withMask(slab, () => M.w8JaliScreen(A, slab, P, { fine: true }));
    A.outline(slab, 'kajal', line, { closed: true, w: 0.45, p: 0.8 });
    // two slim posts and the dark between them
    for (const px of [bx0 + w * 0.08, bx1 - w * 0.08]) {
      const post = rect(px - w * 0.035, roofY + h * 0.05, px + w * 0.035, sillY);
      A.fill(post, 'chalk', lit, { w: 1, p: 1, passes: 2, gap: 0.45, ang: 1.5 });
      A.outline(post, 'kajal', line, { closed: true, w: 0.36, p: 0.7 });
    }
    // the curved roof (bangaldar), with a gold finial
    const roof = A.spline([[bx0 - w * 0.06, roofY + h * 0.06], [xc, roofY - h * 0.08], [bx1 + w * 0.06, roofY + h * 0.06], [bx1 + w * 0.02, roofY + h * 0.1], [xc, roofY - h * 0.01], [bx0 - w * 0.02, roofY + h * 0.1]], true, 0.6);
    A.fill(roof, 'chalk', lit, { w: 1.4, p: 1, passes: 2, gap: 0.45, ang: 0.1 });
    M.floorWash(A, roof, P.stoneDeep, (x, y) => 0.35 * sstep((y - roofY) / (h * 0.12)), 'mul');
    A.outline(roof, 'kajal', line, { closed: true, w: 0.5, p: 0.8 });
    const fy = roofY - h * 0.08;
    A.stroke([[xc, fy], [xc, fy - h * 0.07]], LEAF(P), P.gold || '#d4a437', { w: 0.9, p: 0.9 });
    M.w8Zari(A, xc, fy - h * 0.075, 0.9, P);
    // a pair of parrots on the sill, if asked
    if (o && o.parrots) {
      M.parrot(A, xc - w * 0.16, sillY - 0.3, w * 0.2, { flip: false, pose: 'perch' });
      M.parrot(A, xc + w * 0.18, sillY - 0.3, w * 0.19, { flip: true, pose: 'perch' });
    }
  };

  /* ---------------------------------------------------------------- a stone screen: rows of small eight-point stars */
  M.w8JaliScreen = function (A, poly, P, o) {
    o = o || {};
    const bb = A.bbox([poly]), st = o.fine ? 3.2 : 4.4, lit = P.jali || P.lime, hq = P.jaliQ || 0.26;
    A.fill(poly, 'chalk', lit, { w: 1.4, p: 0.95, passes: 2, gap: 0.45 });
    for (let y = bb[1] + st * 0.5, r = 0; y < bb[3]; y += st, r++) for (let x = bb[0] + (r % 2 ? st * 0.5 : 0); x < bb[2]; x += st) {
      const q = st * hq;
      A.fill([[x, y - q], [x + q * 0.6, y], [x, y + q], [x - q * 0.6, y]], 'chalk', P.dark || '#2a1810', { w: 0.6, p: 1, passes: 1, gap: 0.6 });
    }
  };

  /* ---------------------------------------------------------------- the small paintings in the panel bays
     Mewar subjects, drawn small and quick in the niche: a mango tree with parrots, a pair of elephants, a lotus tank,
     a peacock dancing, a horse, deer in a grove.                                                                   */
  M.w8Miniature = function (A, x0, y0, x1, y1, motif, P, o) {
    const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, gy = y1 - h * 0.07;
    const T = c => c;
    // the ground strip with flowers along the foot
    if (motif !== 'lotus' && motif !== 'fish') {
      A.fill(rect(x0, gy, x1, y1), 'chalk', '#5a7a34', { w: 1.6, p: 0.9, passes: 1 });
      for (let x = x0 + 1.5; x < x1; x += A.rr(2.5, 4.5)) A.dot(x, gy + A.rr(0.4, 2), 'chalk', A.pick(['#f3e6c0', '#e6b422', '#e8607a']), { w: 0.7, p: 0.9 });
    }
    // stars of white flowers on the ground colour, as in a Mewar wall ground
    for (let i = 0; i < Math.round(w * h / 90); i++) {
      const x = A.rr(x0, x1), y = A.rr(y0 + h * 0.3, gy - 2);
      for (let k = 0; k < 4; k++) { const a = k * PI / 2 + 0.4; A.dot(x + Math.cos(a) * 0.7, y + Math.sin(a) * 0.7, 'chalk', '#f3ead8', { w: 0.55, p: 0.85 }); }
    }
    if (motif === 'mango') {
      M.wellMango(A, cx, gy, h * 0.62, { T, fruit: 6 });
      M.parrot(A, cx - w * 0.22, gy - h * 0.38, w * 0.11, { flip: false });
      M.parrot(A, cx + w * 0.24, gy - h * 0.33, w * 0.1, { flip: true });
    } else if (motif === 'elephant') {
      M.elephant(A, cx, gy, h * 0.36, { pose: 'walk', flip: A.chance(0.5) });
    } else if (motif === 'peacock') {
      M.peacockDancing(A, cx, gy, h * 0.3, { flip: A.chance(0.5) });
    } else if (motif === 'horse') {
      M.wellHorse(A, cx, gy, h * 0.32, { T, flip: A.chance(0.5) });
    } else if (motif === 'lotus') {
      // the water as rows of little arcs, and lotus on it
      for (let y = y0 + h * 0.42, r = 0; y < y1; y += 2.6, r++) for (let x = x0 + (r % 2 ? 1.6 : 0); x < x1; x += 3.2) A.stroke(A.ellipse(x, y, 1.4, 0.9, 0, PI * 1.05, PI * 1.95), 'chalk', '#9cc1d2', { w: 0.4, p: 0.7 });
      for (let i = 0; i < 3; i++) M.lotusPad(A, x0 + w * (0.25 + i * 0.25), y0 + h * (0.62 + 0.12 * (i % 2)), w * 0.09, {});
      M.lotus(A, cx, y0 + h * 0.6, w * 0.07, 'open', {});
    } else if (motif === 'deer') {
      M.wellMango(A, cx + w * 0.22, gy, h * 0.5, { T, fruit: 0 });
      M.deer(A, cx - w * 0.12, gy, h * 0.24, {});
    }
  };

  /* ---------------------------------------------------------------- a rosette for a spandrel */
  M.w8Rosette = function (A, x, y, r, P) {
    r = Math.max(1.1, r);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + 0.2, tip = [x + Math.cos(a) * r, y + Math.sin(a) * r];
      A.stroke([[x, y], tip], 'chalk', i % 2 ? (P.accent || '#c63d2f') : '#f6efe0', { w: r * 0.5, p: 0.95, tin: 0.1, tout: 0.6 });
    }
    A.dot(x, y, 'chalk', P.gold ? '#e6b422' : '#e6b422', { w: r * 0.55, p: 1 });
    A.outline(A.ellipse(x, y, r * 1.05, r * 1.05), 'kajal', A.mix(P.line, '#ffffff', 0.25), { closed: true, w: 0.3, p: 0.45 });
    if (P.gold) M.w8Zari(A, x, y, r * 0.22, P);
  };

  /* ---------------------------------------------------------------- the eave */
  M.w8Eave = function (A, x0, x1, y, P, o) {
    o = o || {};
    const th = o.th || 4, dp = o.dp || 4, lit = P.lime, line = P.line;
    // its shadow on the wall under it: soft, longer to the right (the sun is up on the left)
    M.floorWash(A, rect(x0, y + th, x1, y + th + (o.sh || 9)), P.stoneDeep, (x, yy) => 0.6 * (1 - sstep((yy - y - th) / (o.sh || 9))), 'mul');
    // the top of the slab seen from above, and its front edge
    const top = A.roughen(rect(x0 - 2, y - dp, x1 + 2, y), 0.3, 20, true), front = A.roughen(rect(x0 - 2, y, x1 + 2, y + th), 0.3, 20, true);
    A.fill(top, 'chalk', A.mix(lit, '#ffffff', 0.25), { w: 2.2, p: 1, passes: 2, gap: 0.45, ang: 0.02 });
    A.fill(front, 'chalk', A.mix(lit, P.stoneDeep, 0.2), { w: 1.8, p: 1, passes: 2, gap: 0.45, ang: 0.02 });
    A.stroke([[x0 - 2, y + 0.2], [x1 + 2, y + 0.2]], 'chalk', '#fffaf0', { w: 0.7, p: 0.9 });
    A.outline([[x0 - 2, y + th], [x1 + 2, y + th]], 'kajal', line, { w: 0.55, p: 0.85, pull: 70 });
    A.outline([[x0 - 2, y - dp], [x1 + 2, y - dp]], 'kajal', A.mix(line, lit, 0.4), { w: 0.4, p: 0.6, pull: 70 });
    // a row of tiny dentils under the slab
    for (let x = x0; x < x1; x += 2.6) A.stroke([[x, y + th + 0.3], [x, y + th + 1.4]], 'kajal', A.mix(line, lit, 0.3), { w: 0.5, p: 0.7, tin: 0, tout: 0 });
    // brackets under it, where the pillars stand
    for (const bx of (o.at || [])) {
      const br = A.spline([[bx - 3, y + th], [bx + 3, y + th], [bx + 1.6, y + th + 3.6], [bx, y + th + 6], [bx - 1.6, y + th + 3.6]], true, 0.4);
      A.fill(br, 'chalk', lit, { w: 0.9, p: 1, passes: 2, gap: 0.45 });
      M.floorWash(A, br, P.stoneDeep, (x) => 0.4 * sstep((x - bx) / 3 + 0.4), 'mul');
      A.outline(br, 'kajal', line, { closed: true, w: 0.35, p: 0.7 });
    }
  };

  /* ---------------------------------------------------------------- the painted frieze */
  M.w8Frieze = function (A, x0, x1, y0, y1, kind, P) {
    const h = y1 - y0, ym = (y0 + y1) / 2, band = rect(x0, y0, x1, y1);
    const gc = P.frieze || P.ground;
    A.fill(band, 'side', gc, { w: 5, p: 1, reach: 1.45, passes: 2, ang: 0.08 });
    if (kind === 'lotus') {
      // gold ground: a vermilion wave, and on every crest a white eight-petal flower with a red heart
      A.withMask(band, () => A.fill(band, LEAF(P), P.gold || '#d4a437', { w: 2, p: 0.5, passes: 1, ang: 0.1, gap: 0.8 }));
      const step = h * 1.05, amp = h * 0.18;
      const wave = []; for (let x = x0; x <= x1; x += 1) wave.push([x, ym + Math.sin((x - x0) / step * PI) * amp]);
      A.stroke(wave, 'chalk', P.accent || '#c63d2f', { w: 0.7, p: 0.95 });
      for (let x = x0 + step * 0.5, i = 0; x < x1; x += step, i++) {
        const y = ym + Math.sin((x - x0) / step * PI) * amp * 0.9;
        M.w8Flower(A, x, y, h * 0.3, i % 2 ? '#f6efe0' : '#f6efe0', i % 2 ? (P.accent || '#c63d2f') : '#1d2850', P);
        // two leaves off the wave between the flowers
        const lx = x + step * 0.5, ly = ym + Math.sin((lx - x0) / step * PI) * amp;
        for (const sg of [-1, 1]) A.stroke([[lx, ly], [lx + h * 0.16, ly + sg * h * 0.2]], 'chalk', '#3f7a3a', { w: h * 0.1, p: 0.95, tin: 0.2, tout: 0.6 });
      }
    } else if (kind === 'vine') {
      const step = h * 1.3;
      const wave = []; for (let x = x0; x <= x1; x += 1) wave.push([x, ym + Math.sin((x - x0) / step * PI) * h * 0.22]);
      A.stroke(wave, 'chalk', '#4f7d30', { w: 0.6, p: 0.9 });
      for (let x = x0 + step * 0.5; x < x1; x += step) {
        const y = ym + Math.sin((x - x0) / step * PI) * h * 0.2;
        M.w8Flower(A, x, y, h * 0.24, '#fbf5ea', '#e6b422', P);
        A.stroke([[x + step * 0.25, ym], [x + step * 0.35, ym - h * 0.18]], 'chalk', '#4f7d30', { w: h * 0.09, p: 0.9, tout: 0.6 });
      }
    } else if (kind === 'lattice') {
      const st = h * 0.9;
      for (let x = x0 - h; x < x1 + h; x += st) {
        A.stroke([[x, y0 + 0.6], [x + h - 1.2, y1 - 0.6]], LEAF(P), P.gold || '#d4a437', { w: 0.6, p: 0.9, tin: 0, tout: 0 });
        A.stroke([[x + h - 1.2, y0 + 0.6], [x, y1 - 0.6]], LEAF(P), P.gold || '#d4a437', { w: 0.6, p: 0.9, tin: 0, tout: 0 });
        M.w8Zari(A, x + (h - 1.2) / 2, ym, 0.5, P);
      }
    } else if (kind === 'waves') {
      for (let x = x0; x < x1; x += h * 0.7) A.stroke(A.spline([[x, y1 - h * 0.25], [x + h * 0.2, y0 + h * 0.3], [x + h * 0.45, y0 + h * 0.25], [x + h * 0.5, ym]], false, 0.6), 'chalk', '#eef4ee', { w: 0.6, p: 0.85 });
    } else if (kind === 'stars') {
      for (let x = x0 + 2; x < x1; x += A.rr(3, 5)) A.dot(x, A.rr(y0 + 1.2, y1 - 1.2), 'chalk', '#f3ead8', { w: A.rr(0.5, 0.9), p: 0.9 });
    }
    A.stroke([[x0, y0 + 0.3], [x1, y0 + 0.3]], 'kajal', P.line, { w: 0.5, p: 0.85, tin: 0, tout: 0 });
    A.stroke([[x0, y1 - 0.3], [x1, y1 - 0.3]], 'kajal', P.line, { w: 0.5, p: 0.85, tin: 0, tout: 0 });
    A.stroke([[x0, y0 + 1.3], [x1, y0 + 1.3]], 'chalk', '#f6efe0', { w: 0.5, p: 0.8, tin: 0, tout: 0 });
    A.stroke([[x0, y1 - 1.3], [x1, y1 - 1.3]], 'chalk', '#f6efe0', { w: 0.5, p: 0.8, tin: 0, tout: 0 });
  };
  // a small flower of the friezes: petals pulled out from the heart with the point of a stick
  M.w8Flower = function (A, x, y, r, pc, hc, P) {
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + 0.15;
      A.stroke([[x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25], [x + Math.cos(a) * r, y + Math.sin(a) * r]], 'chalk', pc, { w: r * 0.42, p: 0.95, tin: 0.05, tout: 0.55 });
    }
    A.dot(x, y, 'chalk', hc, { w: r * 0.5, p: 1 });
    A.outline(A.ellipse(x, y, r * 1.02, r * 1.02), 'kajal', P.line, { closed: true, w: 0.28, p: 0.5, pull: 12 });
    if (P.gold) M.w8Zari(A, x, y, r * 0.16, P);
  };

  /* ---------------------------------------------------------------- the dado of lotus petals */
  M.w8Dado = function (A, x0, x1, y0, y1, P) {
    const h = y1 - y0, pw = h * 0.85, lit = P.lime;
    A.fill(rect(x0, y0, x1, y1), 'chalk', A.mix(lit, P.stone, 0.4), { w: 2, p: 1, passes: 2, gap: 0.45, ang: 0.05 });
    for (let x = x0 + pw * 0.5; x < x1; x += pw) {
      const pet = A.spline([[x - pw * 0.42, y1 - 0.4], [x - pw * 0.4, y0 + h * 0.5], [x, y0 + h * 0.12], [x + pw * 0.4, y0 + h * 0.5], [x + pw * 0.42, y1 - 0.4]], false, 0.4);
      A.fill(pet.concat([[x, y1]]), 'chalk', lit, { w: 1, p: 1, passes: 2, gap: 0.45 });
      M.floorWash(A, pet.concat([[x, y1]]), P.stoneDeep, (px) => 0.45 * sstep((px - x) / (pw * 0.42) + 0.1), 'mul');
      A.stroke(pet, 'kajal', A.mix(P.line, lit, 0.25), { w: 0.38, p: 0.75 });
    }
    A.stroke([[x0, y0 + 0.2], [x1, y0 + 0.2]], 'kajal', P.line, { w: 0.5, p: 0.8, tin: 0, tout: 0 });
  };

  /* ---------------------------------------------------------------- a landing, and its step nose */
  M.w8Floor = function (A, x0, x1, y0, y1, P, o) {
    o = o || {};
    const lit = P.lime, fl = A.roughen(rect(x0, y0, x1, y1 - 2.2), 0.2, 20, true);
    A.fill(fl, 'side', A.mix(lit, P.stone, 0.15), { w: 6, p: 1, reach: 1.4, passes: 2, ang: 0.04 });
    M.floorCloud(A, fl, A.mix(lit, '#ffffff', 0.3), { scale: 28, seed: A.rr(0, 99), thr: 0.6, soft: 0.3, p: 0.3, w: 4 });
    // the wall's foot throws a little shade on the floor
    M.floorWash(A, rect(x0, y0, x1, y0 + (y1 - y0) * 0.35), P.stoneDeep, (x, y) => 0.35 * (1 - sstep((y - y0) / ((y1 - y0) * 0.35))), 'mul');
    // slabs of the floor
    for (let x = x0 + A.rr(0, 30); x < x1; x += A.rr(26, 44)) A.stroke([[x, y0 + 1], [x + A.rr(-3, 3), y1 - 2.4]], 'geru', A.mix(P.line, lit, 0.62), { w: 0.38, p: 0.45 });
    // the nose of the step: a light edge, a dark line, and the face of the riser under it
    A.fill(rect(x0, y1 - 2.2, x1, y1), 'chalk', A.mix(lit, P.stoneDeep, 0.35), { w: 1.2, p: 1, passes: 2, gap: 0.45, ang: 0.02 });
    A.stroke([[x0, y1 - 2.3], [x1, y1 - 2.3]], 'chalk', '#fffaf0', { w: 0.8, p: 0.95, tin: 0, tout: 0 });
    A.outline([[x0, y1 - 1.7], [x1, y1 - 1.7]], 'kajal', A.mix(P.line, lit, 0.3), { w: 0.42, p: 0.6, pull: 80 });
    A.outline([[x0, y1], [x1, y1]], 'kajal', P.line, { w: 0.55, p: 0.85, pull: 80 });
  };

  /* ---------------------------------------------------------------- light */
  M.w8Halo = function (A, cx, cy, r, P, o) {
    o = o || {};
    const gold = P.gold || '#d4a437';
    if (o.rays) for (let i = 0; i < 36; i++) {
      const a = i / 36 * TAU, r0 = r * 0.42, r1 = r * (i % 2 ? 0.92 : 1.12);
      A.stroke([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]], LEAF(P), gold, { w: 0.4, p: 0.85, tin: 0.05, tout: 0.6 });
    }
    for (const [k, c, w] of [[0.38, P.accent || '#c63d2f', 0.55], [0.3, gold, 0.45], [0.22, '#fbf2dc', 0.45]]) A.stroke(A.ellipse(cx, cy, r * k, r * k), k === 0.3 ? LEAF(P) : 'chalk', c, { w, p: 0.9, tin: 0, tout: 0 });
    // the dots of the outer ring
    const n = Math.max(10, Math.round(r * 1.6));
    for (let i = 0; i < n; i++) { const a = i / n * TAU; M.w8Zari(A, cx + Math.cos(a) * r * 0.48, cy + Math.sin(a) * r * 0.48, 0.38, P); }
    // in the middle, a small open lotus in white and gold
    M.w8Flower(A, cx, cy, r * 0.16, '#fbf5ea', P.accent || '#c63d2f', P);
  };
  M.w8Zari = function (A, x, y, r, P) {
    r = Math.max(0.28, r);
    A.dot(x, y, LEAF(P), (P && P.gold) || '#d4a437', { w: r * 2, p: 1, reach: 1.4 });
    A.dot(x - r * 0.25, y - r * 0.3, 'chalk', '#fff6d0', { w: r * 0.7, p: 0.8 });
    if (P && P.glints) P.glints.push([x, y, r]);
  };
  M.w8Bell = function (A, x, y, s, P) {
    const gold = P.gold || '#d4a437';
    A.stroke([[x, y], [x, y + 3 * s]], 'kajal', A.mix(P.line, gold, 0.3), { w: 0.3, p: 0.8, tin: 0, tout: 0 });
    const bell = A.spline([[x - 0.9 * s, y + 3.2 * s], [x - 1.1 * s, y + 4.6 * s], [x - 1.8 * s, y + 5.6 * s], [x + 1.8 * s, y + 5.6 * s], [x + 1.1 * s, y + 4.6 * s], [x + 0.9 * s, y + 3.2 * s]], true, 0.3);
    A.fill(bell, LEAF(P), gold, { w: 0.7 * s, p: 1, passes: 2, gap: 0.45 });
    A.outline(bell, 'kajal', P.line, { closed: true, w: 0.3, p: 0.7 });
    A.dot(x, y + 5.9 * s, 'kajal', P.line, { w: 0.6 * s, p: 0.9 });
    if (P.glints) P.glints.push([x - 0.5 * s, y + 4.4 * s, 0.4 * s]);
    if (P.bells) P.bells.push([x, y, s]);
  };

  /* ---------------------------------------------------------------- what falls through the well */
  M.w8Petal = function (A, x, y, s, kind, ang) {
    const a = ang != null ? ang : A.rr(0, TAU);
    if (kind === 'mari') {
      // a marigold petal: a little curled tongue, saffron with a deeper edge
      const c = A.pick(['#e88e1e', '#edc94b', '#e6731c', '#f0a52a']);
      const p = [[x - Math.cos(a) * 1.6 * s, y - Math.sin(a) * 1.6 * s], [x + Math.cos(a + 0.4) * 0.3 * s, y + Math.sin(a + 0.4) * 0.3 * s], [x + Math.cos(a) * 1.6 * s, y + Math.sin(a) * 1.6 * s]];
      A.stroke(p, 'chalk', c, { w: 1.3 * s, p: 1, reach: 1.5, tin: 0.2, tout: 0.4 });
      A.stroke(p.slice(1), 'chalk', A.mix(c, '#8f2331', 0.4), { w: 0.4 * s, p: 0.7 });
    } else if (kind === 'rose') {
      const e = A.roughen(A.ellipse(x, y, 1.7 * s, 1.15 * s, a), 0.15 * s, 1.5, true);
      A.fill(e, 'chalk', A.pick(['#e8a9a4', '#d77f86', '#e07a8f', '#f0b8b0']), { w: 0.8 * s, p: 1, reach: 1.5, passes: 2, gap: 0.42 });
      A.stroke([[x - Math.cos(a) * 1.4 * s, y - Math.sin(a) * 1.4 * s], [x + Math.cos(a + 0.3) * 1.2 * s, y + Math.sin(a + 0.3) * 1.2 * s]], 'chalk', '#b0405a', { w: 0.3 * s, p: 0.6 });
    } else if (kind === 'jasmine') {
      for (let k = 0; k < 5; k++) { const b = a + k * TAU / 5; A.stroke([[x, y], [x + Math.cos(b) * 1.3 * s, y + Math.sin(b) * 1.3 * s]], 'chalk', '#fbf8ee', { w: 0.75 * s, p: 0.95, tout: 0.5 }); }
      A.dot(x, y, 'chalk', '#e6b422', { w: 0.45 * s, p: 0.9 });
    } else {
      // a fleck of gold leaf, turning: a thin sliver with a bright edge
      const p = [[x - Math.cos(a) * 1.2 * s, y - Math.sin(a) * 1.2 * s], [x + Math.cos(a) * 1.2 * s, y + Math.sin(a) * 1.2 * s]];
      A.stroke(p, 'gold', '#e2b53e', { w: 0.8 * s, p: 1, tin: 0, tout: 0 });
      A.stroke(p, 'chalk', '#fff3c4', { w: 0.25 * s, p: 0.8, tin: 0, tout: 0 });
    }
  };

  M.w8Rangoli = function (A, cx, cy, rx, ry, P) {
    const ring = (k, n, c, w) => { for (let i = 0; i < n; i++) { const a = i / n * TAU; A.dot(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k, 'chalk', c, { w, p: 0.95 }); } };
    A.stroke(A.ellipse(cx, cy, rx, ry), 'chalk', '#fbf8ee', { w: 0.5, p: 0.85, tin: 0, tout: 0 });
    ring(0.86, 24, P.accent || '#c63d2f', 1.2);
    ring(0.62, 16, '#e6b422', 1.1);
    ring(0.4, 12, '#2a4b96', 1);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; A.stroke([[cx, cy], [cx + Math.cos(a) * rx * 0.3, cy + Math.sin(a) * ry * 0.3]], 'chalk', '#fbf8ee', { w: 0.9, p: 0.95, tout: 0.6 }); }
    A.dot(cx, cy, 'chalk', P.accent || '#c63d2f', { w: 1.2, p: 1 });
  };
})();
