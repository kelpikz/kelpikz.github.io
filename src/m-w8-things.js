(function () {
  'use strict';
  /* ==========================================================================
     THE GOLD WELL (well8k): THE BIG PIECES THAT BREAK THE ARCADE
       M.w8Pavilion(A, x0, x1, R, P, o)      a pavilion standing out from the wall beside the stair, its curved roof
                                             rising over the level's eave; o.room 'gold' (a room lined with gold leaf),
                                             'ground' (the level's colour with a halo), 'dark' (a lamp in the dark)
       M.w8SpoutWall(A, b, R, P)             a plain carved panel of the wall that water spouts come out of
       M.w8Toran(A, x0, x1, y, s, P)         a string of mango leaves and marigolds tied over a doorway
       M.w8Thread(A, x0, x1, y, s)           a red cotton thread tied across a doorway, its ends hanging
       M.w8Cloth(A, x0, x1, y, drop, P, o)   a woven cloth hung over the edge of an eave to be seen
       M.w8HangLamp(A, x, y0, y1, s, P)      a brass lamp on a chain
       M.w8FloatLamp(A, x, y, s, P)          a clay lamp riding on a leaf on the water
     Units are picture units; R is the row set of the level (top, foot, arT, arB, h); P its palette.
     ======================================================================== */
  // gold: leaf (the 'gold' tool, burnished, it catches the light) or, where P.matte, painted yellow ochre (chalk)
  const LEAF = P => (P && P.matte) ? 'chalk' : 'gold';
  const PI = Math.PI, TAU = PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  M.w8Pavilion = function (A, x0, x1, R, P, o) {
    o = o || {};
    const w = x1 - x0, xc = (x0 + x1) / 2, h = R.foot - R.top, lit = P.lime, line = P.line, gold = P.gold || '#d4a437';
    const yCh = R.top + h * 0.14, yb = R.arB, yRoof = R.top - h * 0.15;
    // 1. the shadow it throws on the wall to its right (the sun is high and a little to the left)
    M.floorWash(A, [[x1, yCh], [x1 + w * 0.11, yCh + h * 0.07], [x1 + w * 0.11, R.foot], [x1, R.foot]], P.stoneDeep, () => 0.42, 'mul');
    // 2. the body: paler stone than the wall, because it stands out into the light
    const body = rect(x0, yCh, x1, R.foot);
    M.w8Stone(A, body, Object.assign({}, P, { stone: A.mix(lit, P.stone, 0.4), stoneLit: lit, stoneWarm: A.mix(P.stoneWarm || P.stone, lit, 0.5) }), { course: h * 0.075 });
    // 3. the opening and the room behind it
    const ox0 = x0 + w * 0.17, ox1 = x1 - w * 0.17, ys = yb - (yb - yCh) * 0.6, ya = yCh + h * 0.06;
    const op = M.w8Arch(ox0, ox1, yb, ys, ya, 11), frame = M.w8Arch(ox0 - w * 0.045, ox1 + w * 0.045, yb, ys, ya - h * 0.04, 0);
    A.fill(frame, 'chalk', A.mix(lit, '#ffffff', 0.3), { w: 2.2, p: 0.95, reach: 1.3, passes: 2, gap: 0.5, ang: 1.2 });
    A.outline(frame, 'kajal', A.mix(line, lit, 0.35), { closed: false, w: 0.45, p: 0.7, pull: 40 });
    const room = o.room || 'ground';
    if (room === 'gold') {
      // a room lined with gold leaf: laid in squares, each catching the light a little differently
      A.fill(op, 'side', '#a8741c', { w: 6, p: 1, reach: 1.5, passes: 2, ang: 1.2 });
      A.withMask(op, () => {
        const bb = A.bbox([op]), q = Math.max(2.2, w * 0.07);
        for (let y = bb[1]; y < bb[3]; y += q) for (let x = bb[0] + ((y / q | 0) % 2) * q * 0.5 - q; x < bb[2]; x += q) {
          A.fill(rect(x, y, x + q + 0.25, y + q + 0.25), LEAF(P), A.pick(['#e2b84a', '#d8a838', '#eccb6a', '#d0a034', '#e8c058']), { w: q * 0.32, p: 0.95, passes: 1, ang: A.rr(-0.4, 0.4) });
        }
        for (let y = bb[1]; y < bb[3]; y += q) A.stroke([[bb[0], y + A.rr(-0.2, 0.2)], [bb[2], y + A.rr(-0.2, 0.2)]], 'kajal', '#8a6420', { w: 0.22, p: 0.28 });
        // the back of the room goes deep where the light does not reach
        M.floorWash(A, op, '#6a3c14', (x, y) => 0.5 * sstep((x - ox0) / (ox1 - ox0) * 1.2 - 0.15) * (0.4 + 0.6 * sstep((y - ya) / (yb - ya))), 'mul');
        M.w8Halo(A, xc, ys + (yb - ys) * 0.1, (ox1 - ox0) * 0.4, P, { rays: true });
      });
      M.w8HangLamp(A, xc, ya + 1, ys - (ys - ya) * 0.05, (ox1 - ox0) / 60, P);
    } else if (room === 'dark') {
      M.w8Dark(A, op, P, yb);
      A.withMask(op, () => M.lampGlow(A, xc, yb - (yb - ys) * 0.35, (ox1 - ox0) * 0.75, 0.9, {}));
      M.w8Lamp(A, xc, yb - 0.6, (ox1 - ox0) * 0.2, P, true);
    } else {
      A.fill(op, 'side', P.ground, { w: 7, p: 1, reach: 1.4, passes: 2, ang: 1.2 });
      A.withMask(op, () => {
        A.fill(op, LEAF(P), gold, { w: 2.4, p: 0.5, passes: 1, ang: 0.3, gap: 0.9 });
        M.floorWash(A, op, P.stoneDeep, (x, y) => 0.35 * sstep((x - ox0) / (ox1 - ox0) - 0.1), 'mul');
        M.w8Halo(A, xc, ys + (yb - ys) * 0.1, (ox1 - ox0) * 0.4, P, { rays: true });
      });
      M.w8HangLamp(A, xc, ya + 1, ys - (ys - ya) * 0.05, (ox1 - ox0) / 60, P);
    }
    A.outline(op.slice(1, -1), 'kajal', line, { closed: false, w: 0.6, p: 0.88, pull: 34, again: 0.2 });
    A.stroke(A.resample(op.slice(1, -1), 1.2, false).map(p => [p[0] + (p[0] < xc ? 1 : -1), p[1] + 1]), LEAF(P), gold, { w: 0.5, p: 0.85 });
    for (const sg of [-1, 1]) M.w8Rosette(A, xc + sg * (ox1 - ox0) * 0.62, ya + (ys - ya) * 0.32, w * 0.05, P);
    // 4. its pillars, its plinth and a threshold slab
    for (const px of [x0 + w * 0.08, x1 - w * 0.08]) M.w8Pillar(A, px, yCh + h * 0.035, yb, w * 0.085, P);
    M.w8Dado(A, x0, x1, yb, R.foot, P);
    const th = rect(x0 - w * 0.03, R.foot - h * 0.025, x1 + w * 0.03, R.foot + h * 0.02);
    A.fill(th, 'chalk', A.mix(lit, '#ffffff', 0.25), { w: 1.4, p: 1, passes: 2, gap: 0.45, ang: 0.02 });
    A.outline(th, 'kajal', line, { closed: true, w: 0.42, p: 0.7 });
    // 5. its own chhajja, with bells, and the curved roof over it, rising above the level's eave
    M.w8Eave(A, x0 - w * 0.07, x1 + w * 0.07, yCh, P, { at: [x0 + w * 0.08, xc, x1 - w * 0.08], th: h * 0.032, dp: h * 0.03, sh: h * 0.07 });
    for (const bx of [x0 + w * 0.3, x1 - w * 0.3]) M.w8Bell(A, bx, yCh + h * 0.032 + 2, Math.max(0.8, w / 80), P);
    const yb0 = yCh - h * 0.03, rl = x0 - w * 0.06, rr = x1 + w * 0.06;
    const ridge = A.spline([[rl, yb0 + h * 0.012], [x0 + w * 0.1, yRoof + h * 0.075], [xc, yRoof], [x1 - w * 0.1, yRoof + h * 0.075], [rr, yb0 + h * 0.012]], false, 0.5);
    const under = A.spline([[rr, yb0 + h * 0.012], [xc, yb0 - h * 0.012], [rl, yb0 + h * 0.012]], false, 0.5);
    const roof = ridge.concat(under);
    M.floorWash(A, roof.map(p => [p[0] + w * 0.06, p[1] + h * 0.03]), P.stoneDeep, () => 0.3, 'mul');
    A.fill(roof, 'chalk', A.mix(lit, '#ffffff', 0.25), { w: 1.8, p: 1, reach: 1.3, passes: 2, gap: 0.45, ang: 1.45 });
    // the ribs of the curved roof, every one drawn from the ridge down to the eave
    const nr = 11;
    for (let i = 1; i < nr; i++) {
      const p = ridge[Math.round(i / nr * (ridge.length - 1))], q = [p[0] + (p[0] - xc) * 0.04, yb0 + h * 0.01 - Math.abs(p[0] - xc) / w * h * 0.012];
      A.stroke([p, [lerp(p[0], q[0], 0.5) + (p[0] - xc) * 0.02, lerp(p[1], q[1], 0.5)], q], 'kajal', A.mix(line, lit, 0.5), { w: 0.32, p: 0.55, tin: 0.1, tout: 0.2 });
    }
    M.floorWash(A, roof, P.stoneDeep, (x) => 0.4 * sstep((x - xc) / (w * 0.6) + 0.15), 'mul');
    A.outline(ridge, 'kajal', line, { closed: false, w: 0.6, p: 0.88, pull: 30 });
    A.stroke(under, LEAF(P), gold, { w: Math.max(0.5, h * 0.006), p: 0.9 });
    A.outline(under, 'kajal', line, { closed: false, w: 0.45, p: 0.7, pull: 30 });
    // the finial: a gold pot on the ridge, and a spike with a bead
    const fk = w / 60, fy = yRoof + 0.4;
    const pot = A.spline([[xc - 2.2 * fk, fy], [xc - 2.6 * fk, fy - 2.2 * fk], [xc - 1.2 * fk, fy - 3.8 * fk], [xc + 1.2 * fk, fy - 3.8 * fk], [xc + 2.6 * fk, fy - 2.2 * fk], [xc + 2.2 * fk, fy]], true, 0.5);
    A.fill(pot, LEAF(P), gold, { w: Math.max(0.6, fk), p: 1, passes: 2, gap: 0.45 });
    A.outline(pot, 'kajal', line, { closed: true, w: 0.36, p: 0.75 });
    A.stroke([[xc, fy - 3.8 * fk], [xc, fy - 8 * fk]], LEAF(P), gold, { w: Math.max(0.4, 0.7 * fk), p: 0.95, tout: 0.6 });
    M.w8Zari(A, xc, fy - 8.2 * fk, Math.max(0.4, 0.7 * fk), P);
    M.w8Zari(A, xc - 0.8 * fk, fy - 2.6 * fk, Math.max(0.35, 0.5 * fk), P);
    return { op, yCh, yRoof };
  };

  M.w8HangLamp = function (A, x, y0, y1, s, P) {
    s = Math.max(0.5, s);
    for (let y = y0; y < y1 - 1.2 * s; y += 1.1 * s) A.stroke(A.ellipse(x, y + 0.5 * s, 0.32 * s, 0.55 * s), 'kajal', '#4a3010', { w: 0.22, p: 0.75, tin: 0, tout: 0 });
    const bowl = A.spline([[x - 3 * s, y1], [x - 2.2 * s, y1 + 1.8 * s], [x, y1 + 2.4 * s], [x + 2.2 * s, y1 + 1.8 * s], [x + 3 * s, y1]], true, 0.5);
    A.fill(bowl, LEAF(P), P.gold || '#d4a437', { w: Math.max(0.5, s * 0.8), p: 1, passes: 2, gap: 0.45 });
    A.outline(bowl, 'kajal', '#3a2008', { closed: true, w: 0.3, p: 0.7 });
    A.stroke([[x, y1 - 0.2], [x + 0.3 * s, y1 - 2.4 * s]], 'chalk', '#fff3c0', { w: 1.1 * s, p: 0.95, tin: 0.1, tout: 0.7 });
    A.stroke([[x, y1 - 0.3], [x + 0.2 * s, y1 - 1.6 * s]], 'chalk', '#f08a2a', { w: 0.6 * s, p: 0.9, tout: 0.6 });
    if (P.lamps) P.lamps.push([x, y1 - 1.4 * s]);
    if (P.glints) P.glints.push([x - 1.4 * s, y1 + 0.9 * s, 0.5 * s]);
  };

  /* a panel of the wall the spouts come out of: a carved frame, a band of lotus petals, the stone stained below
     each mouth where the water has run for years */
  M.w8SpoutWall = function (A, b, R, P, mouths) {
    const x0 = b.x0, x1 = b.x1, yt = R.arT, yb = R.arB, w = x1 - x0, h = yb - yt;
    const pan = rect(x0 + w * 0.03, yt + h * 0.02, x1 - w * 0.03, yb);
    A.fill(pan, 'chalk', A.mix(P.stone, P.lime, 0.35), { w: 2, p: 0.9, passes: 2, gap: 0.5, ang: 1.4 });
    M.floorCloud(A, pan, P.stoneWarm || P.stone, { scale: 18, seed: A.rr(0, 99), thr: 0.6, soft: 0.3, p: 0.3, w: 3 });
    for (const m of (mouths || [])) {
      // the stain below a mouth: darker, a little green, in streaks
      const sx = m[0], sy = m[1];
      for (let i = 0; i < 5; i++) { const dx = A.rr(-2.2, 2.2); A.stroke([[sx + dx, sy + 2], [sx + dx * 1.2 + A.rr(-0.6, 0.6), yb - A.rr(0, h * 0.2)]], 'side', A.mix('#4a5a3a', P.stoneDeep, 0.4), { w: A.rr(1.2, 2.4), p: 0.22 }); }
    }
    A.outline(pan, 'kajal', A.mix(P.line, P.stone, 0.3), { closed: true, w: 0.45, p: 0.7 });
    A.outline(rect(x0 + w * 0.05, yt + h * 0.05, x1 - w * 0.05, yb - h * 0.02), 'geru', A.mix(P.line, P.stone, 0.5), { closed: true, w: 0.36, p: 0.5 });
  };

  M.w8Toran = function (A, x0, x1, y, s, P) {
    const cord = A.spline([[x0, y], [(x0 + x1) / 2, y + s * 1.2], [x1, y]], false, 1);
    A.stroke(cord, 'kajal', '#3a2a10', { w: Math.max(0.3, s * 0.12), p: 0.85 });
    const pts = A.resample(cord, s * 1.6, false);
    pts.forEach((p, i) => {
      if (i % 2 === 0) {
        // a mango leaf, hanging point down
        const L = s * A.rr(2.6, 3.2), a = PI / 2 + A.rr(-0.15, 0.15), c = A.pick(['#3f7a3a', '#2f6a34', '#5a8a3a', '#4f7d30']);
        const tip = [p[0] + Math.cos(a) * L, p[1] + Math.sin(a) * L], m = [p[0] + Math.cos(a) * L * 0.45, p[1] + Math.sin(a) * L * 0.45];
        const leaf = [p, [m[0] - s * 0.5, m[1]], tip, [m[0] + s * 0.5, m[1]]];
        A.fill(A.spline(leaf, true, 0.5), 'chalk', c, { w: Math.max(0.5, s * 0.35), p: 1, passes: 2, gap: 0.45 });
        A.stroke([p, tip], 'chalk', A.mix(c, '#e8f0c0', 0.4), { w: Math.max(0.22, s * 0.1), p: 0.6 });
        A.outline(A.spline(leaf, true, 0.5), 'kajal', '#1a2a10', { closed: true, w: 0.25, p: 0.5 });
      } else {
        A.dot(p[0], p[1] + s * 0.5, 'chalk', A.pick(['#e88e1e', '#f0a52a', '#e6731c']), { w: s * 1.1, p: 1 });
        A.dot(p[0] - s * 0.15, p[1] + s * 0.35, 'chalk', '#f6c860', { w: s * 0.45, p: 0.8 });
      }
    });
  };

  M.w8Thread = function (A, x0, x1, y, s) {
    const c = '#c8281c', mid = (x0 + x1) / 2;
    A.stroke(A.spline([[x0, y], [mid, y + s * 0.8], [x1, y]], false, 1), 'chalk', c, { w: Math.max(0.3, s * 0.18), p: 0.95, tin: 0, tout: 0 });
    // the knot in the middle, and its two ends hanging
    A.dot(mid, y + s * 0.8, 'chalk', c, { w: s * 0.5, p: 1 });
    A.stroke([[mid, y + s * 0.8], [mid - s * 0.4, y + s * 2.6], [mid - s * 0.2, y + s * 3.6]], 'chalk', c, { w: Math.max(0.25, s * 0.14), p: 0.9, tout: 0.5 });
    A.stroke([[mid, y + s * 0.8], [mid + s * 0.5, y + s * 2.4], [mid + s * 0.6, y + s * 3.1]], 'chalk', c, { w: Math.max(0.25, s * 0.14), p: 0.9, tout: 0.5 });
    A.dot(mid - s * 0.2, y + s * 3.7, 'chalk', '#e6b422', { w: s * 0.3, p: 0.9 });
  };

  /* a woven cloth hung over the eave, the pattern of the loom on it: a madder-red ground, a band of yellow
     lozenges, rows of zigzag, a fringe at the bottom */
  M.w8Cloth = function (A, x0, x1, y, drop, P, o) {
    o = o || {};
    const w = x1 - x0, bot = [], n = 12;
    for (let i = 0; i <= n; i++) { const t = i / n; bot.push([x0 - w * 0.03 + (w * 1.06) * t, y + drop + Math.sin(t * PI) * drop * 0.06 + Math.sin(t * 9 + 1) * drop * 0.025]); }
    const poly = [[x0, y], [x1, y]].concat(bot.slice().reverse());
    const red = o.c || '#b8321e';
    A.fill(poly, 'pastel', red, { w: Math.max(1, w * 0.05), p: 1, reach: 1.4, passes: 2, ang: 1.5 });
    A.withMask(poly, () => {
      const band = (yy, hh, c) => A.fill(rect(x0 - 2, yy, x1 + 2, yy + hh), 'chalk', c, { w: Math.max(0.5, hh * 0.4), p: 0.95, passes: 2, gap: 0.45, ang: 0.02 });
      band(y + drop * 0.12, drop * 0.05, '#e6b422');
      band(y + drop * 0.62, drop * 0.05, '#e6b422');
      // lozenges between the yellow bands
      const lz = drop * 0.14, ly = y + drop * 0.38;
      for (let x = x0 + lz * 0.6; x < x1; x += lz * 1.25) {
        const d = [[x, ly - lz * 0.6], [x + lz * 0.42, ly], [x, ly + lz * 0.6], [x - lz * 0.42, ly]];
        A.fill(d, 'chalk', '#edc94b', { w: Math.max(0.4, lz * 0.25), p: 1, passes: 2, gap: 0.45 });
        A.dot(x, ly, 'chalk', '#1d2850', { w: lz * 0.22, p: 1 });
      }
      // zigzag rows
      for (const zy of [y + drop * 0.76, y + drop * 0.86]) {
        const zz = []; for (let x = x0 - 2, k = 0; x < x1 + 3; x += drop * 0.05, k++) zz.push([x, zy + (k % 2 ? drop * 0.03 : -drop * 0.03)]);
        A.stroke(zz, 'chalk', '#f6efe0', { w: Math.max(0.3, drop * 0.014), p: 0.95, tin: 0, tout: 0 });
      }
      // folds: the cloth hangs in soft vertical folds, darker in the troughs
      M.floorWash(A, poly, '#3a0e08', (x, yy) => 0.32 * Math.max(0, Math.sin((x - x0) / w * PI * 4.2 + 0.6)) * sstep((yy - y) / drop * 2), 'mul');
      M.floorWash(A, poly, '#3a0e08', (x, yy) => 0.35 * (1 - sstep((yy - y) / (drop * 0.12))), 'mul');
    });
    A.outline(poly, 'kajal', '#2a0a06', { closed: true, w: 0.45, p: 0.8, pull: 30 });
    // the fringe
    for (let i = 0; i < bot.length - 1; i++) for (let t = 0; t < 1; t += 0.25) {
      const p = [lerp(bot[i][0], bot[i + 1][0], t), lerp(bot[i][1], bot[i + 1][1], t)];
      A.stroke([p, [p[0] + A.rr(-0.3, 0.3), p[1] + drop * A.rr(0.05, 0.08)]], 'chalk', i % 2 ? '#e6b422' : '#f6efe0', { w: Math.max(0.25, drop * 0.012), p: 0.9, tout: 0.5 });
    }
  };

  /* a pariah dog asleep, curled on itself, the head on the forepaws and the tail laid over the nose.
     (x, y) the middle of where it lies, s its length */
  M.w8Dog = function (A, x, y, s, flip) {
    const f = flip ? -1 : 1, P = (u, v) => [x + u * s * f, y + v * s];
    const coat = '#d6a066', deep = '#8a5a2c', line = '#2a180c';
    const body = A.spline([P(-0.5, 0), P(-0.53, -0.18), P(-0.36, -0.36), P(0, -0.42), P(0.3, -0.32), P(0.42, -0.14), P(0.4, 0)], true, 0.6);
    A.fill(body, 'pastel', coat, { w: Math.max(0.6, s * 0.08), p: 1, passes: 2, ang: 0.4 });
    M.floorWash(A, body, deep, (xx, yy) => 0.45 * sstep((yy - (y - s * 0.2)) / (s * 0.2)), 'mul');
    for (let i = 0; i < 9; i++) { const a = P(A.rr(-0.4, 0.25), A.rr(-0.34, -0.1)); A.stroke([a, [a[0] + s * 0.05 * f, a[1] + s * 0.02]], 'chalk', A.mix(coat, '#f6e2b8', 0.5), { w: Math.max(0.25, s * 0.012), p: 0.6 }); }
    A.outline(body, 'kajal', line, { closed: true, w: Math.max(0.3, s * 0.014), p: 0.8, pull: 20 });
    // the head laid down at the front, the ear folded, the eye shut
    const head = A.roughen(A.ellipse(P(0.38, -0.12)[0], P(0.38, -0.12)[1], s * 0.17, s * 0.1, f > 0 ? 0.15 : -0.15), s * 0.01, 2, true);
    A.fill(head, 'pastel', A.mix(coat, '#f0c890', 0.3), { w: Math.max(0.5, s * 0.05), p: 1, passes: 2 });
    A.outline(head, 'kajal', line, { closed: true, w: Math.max(0.3, s * 0.013), p: 0.8 });
    const ear = [P(0.3, -0.2), P(0.36, -0.29), P(0.4, -0.19)];
    A.fill(ear, 'pastel', deep, { w: Math.max(0.4, s * 0.03), p: 1, passes: 2 });
    A.stroke([P(0.42, -0.14), P(0.47, -0.13)], 'kajal', line, { w: Math.max(0.25, s * 0.01), p: 0.85 });
    A.dot(P(0.55, -0.1)[0], P(0.55, -0.1)[1], 'kajal', line, { w: Math.max(0.4, s * 0.03), p: 1 });
    // forepaws and the tail
    for (const u of [0.3, 0.42]) A.fill(A.ellipse(P(u, -0.02)[0], P(u, -0.02)[1], s * 0.06, s * 0.025), 'pastel', '#f0d8b0', { w: Math.max(0.4, s * 0.02), p: 1, passes: 2 });
    A.stroke([P(-0.48, -0.08), P(-0.4, 0.02), P(-0.05, 0.03), P(0.22, 0.0)], 'pastel', coat, { w: Math.max(0.5, s * 0.06), p: 1, tout: 0.6 });
    A.stroke([P(-0.48, -0.06), P(-0.4, 0.04), P(-0.05, 0.05), P(0.22, 0.02)], 'kajal', line, { w: Math.max(0.25, s * 0.01), p: 0.6, tout: 0.6 });
  };

  /* a clay water pot (matka) seen from the side, standing on (x, yb); s its height.  c the clay */
  M.w8Matka = function (A, x, yb, s, c, o) {
    o = o || {};
    const r = s * 0.42, cy = yb - s * 0.42, line = o.line || '#2a1608';
    const belly = A.roughen(A.ellipse(x, cy, r, s * 0.4), s * 0.012, 2, true);
    A.fill(belly, 'pastel', c, { w: Math.max(0.5, s * 0.16), p: 1, passes: 2, ang: 0.6 });
    // the light from the upper left, the far side in its own shade
    M.floorWash(A, belly, '#2a120a', (px, py) => 0.5 * sstep(((px - x) * 0.7 + (py - cy) * 0.7) / r + 0.1), 'mul');
    A.stroke(A.ellipse(x - r * 0.38, cy - s * 0.14, r * 0.28, s * 0.1, -0.5, PI * 1.1, PI * 1.7), 'chalk', '#f4d8b8', { w: Math.max(0.3, s * 0.05), p: 0.7 });
    // a band of white dots round the shoulder, as the potters paint them
    for (let i = 0; i < 9; i++) { const a = PI * (0.08 + i * 0.105); A.dot(x - Math.cos(a) * r * 0.92, cy - s * 0.12 + Math.sin(a) * s * 0.05, 'chalk', '#f6eedc', { w: Math.max(0.3, s * 0.05), p: 0.9 }); }
    // the neck and the rolled rim
    const neck = rect(x - r * 0.42, cy - s * 0.48, x + r * 0.42, cy - s * 0.34);
    A.fill(neck, 'pastel', A.mix(c, '#2a120a', 0.15), { w: Math.max(0.4, s * 0.1), p: 1, passes: 2 });
    A.fill(A.ellipse(x, cy - s * 0.5, r * 0.55, s * 0.06), 'pastel', A.mix(c, '#f4d8b8', 0.3), { w: Math.max(0.4, s * 0.08), p: 1, passes: 2 });
    A.outline(belly, 'kajal', line, { closed: true, w: Math.max(0.25, s * 0.03), p: 0.8 });
    A.outline(A.ellipse(x, cy - s * 0.5, r * 0.55, s * 0.06), 'kajal', line, { closed: true, w: Math.max(0.22, s * 0.025), p: 0.8 });
    if (o.cloth) A.fill(A.ellipse(x, cy - s * 0.56, r * 0.5, s * 0.07), 'pastel', o.cloth, { w: Math.max(0.4, s * 0.08), p: 1, passes: 2 });
  };

  /* washing hung out to dry on a cord: from a to b, sagging, the cloths in cols; h how far they hang */
  M.w8Washing = function (A, a, b, sag, h, cols, o) {
    o = o || {};
    const at = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + sag * Math.sin(PI * t)];
    const cord = []; for (let t = 0; t <= 1.0001; t += 0.05) cord.push(at(t));
    const lw = Math.max(0.25, h * 0.025);
    // a peg at each end
    for (const p of [a, b]) A.fill(A.ellipse(p[0], p[1], h * 0.06, h * 0.05), 'chalk', '#5a3a1a', { w: Math.max(0.3, h * 0.04), p: 1, passes: 2 });
    let t = 0.06, i = o.first || 0;
    while (t < 0.9) {
      const wt = A.rr(0.11, 0.2), p = at(t), q = at(Math.min(0.94, t + wt)), len = h * A.rr(0.6, 1.05), c = cols[i % cols.length], c2 = cols[(i + 2) % cols.length];
      const cl = [p, q, [q[0] + A.rr(-0.4, 0.4) * h * 0.05, q[1] + len], [p[0] + A.rr(-0.4, 0.4) * h * 0.05, p[1] + len * A.rr(0.92, 1.06)]];
      A.fill(cl, 'pastel', c, { w: Math.max(0.4, h * 0.08), p: 1, passes: 2, ang: 1.5 });
      // its border, a fold or two, its shadow side
      A.stroke([[cl[3][0], cl[3][1] - len * 0.1], [cl[2][0], cl[2][1] - len * 0.1]], 'chalk', c2, { w: Math.max(0.35, len * 0.08), p: 0.95 });
      for (let f = 0.33; f < 1; f += 0.33) A.stroke([[p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f + 0.5], [cl[3][0] + (cl[2][0] - cl[3][0]) * f, cl[3][1] - len * 0.16]], 'pencil', A.mix(c, '#1a0c08', 0.45), { w: Math.max(0.2, h * 0.012), p: 0.6 });
      M.floorWash(A, cl, '#1a0c08', (xx) => 0.3 * sstep((xx - p[0]) / Math.max(0.1, q[0] - p[0])), 'mul');
      A.outline(cl, 'kajal', '#2a1608', { closed: true, w: lw, p: 0.6, pull: 20 });
      t += wt + A.rr(0.02, 0.05); i++;
    }
    A.stroke(cord, 'kajal', '#3a2412', { w: lw, p: 0.9 });
  };

  M.w8FloatLamp = function (A, x, y, s, P) {
    // a leaf boat, then the clay lamp on it, then the flame
    const leaf = A.spline([[x - 8 * s, y], [x - 3 * s, y + 2.2 * s], [x + 6 * s, y + 1.4 * s], [x + 9 * s, y - 0.4 * s], [x + 3 * s, y - 1.2 * s], [x - 4 * s, y - 1 * s]], true, 0.5);
    A.fill(leaf, 'chalk', '#4f7d30', { w: 1.2 * s, p: 1, passes: 2, gap: 0.45 });
    A.outline(leaf, 'kajal', '#10200c', { closed: true, w: 0.35, p: 0.7 });
    M.wellDiya(A, x - 3 * s * 0.25, y - 0.6 * s, s * 0.25, 1, {});
    if (P && P.lamps) P.lamps.push([x + 3 * s * 0.25, y - 4 * s * 0.25]);
  };
})();
