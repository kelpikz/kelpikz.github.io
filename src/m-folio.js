(function () {
  'use strict';
  /* The parts of a manuscript folio: the ruled border round the sheet, the text panel, the first
     red-earth sketch, and a flower boat for the lake.  All sizes are in sheet units. */
  const HP = Math.PI / 2;

  // ---- border ------------------------------------------------------------
  /* M.frameBands(A, b, inset): a band of hingul red to the edge of the sheet (b wide) and a narrow band of
     Indian yellow between it and the window (which starts `inset` from the edge). */
  M.frameBands = function (A, b, inset) {
    const rr = A.rr, W = A.LW, H = A.LH, k = b / 40;
    const sides = [
      [[[-4, -4], [W + 4, -4], [W - b, b], [b, b]], 0],
      [[[b, H - b], [W - b, H - b], [W + 4, H + 4], [-4, H + 4]], 0],
      [[[-4, -4], [b, b], [b, H - b], [-4, H + 4]], HP],
      [[[W + 4, -4], [W + 4, H + 4], [W - b, H - b], [W - b, b]], HP]
    ];
    for (const [p, ang] of sides) {
      A.fill(p, 'side', 'hingul', { w: 24 * k, p: 1, reach: 1.6, passes: 2, turn: 0.16, ang: ang + rr(-0.03, 0.03), cv: 0.03, soft: 0 });
      A.blend(p, { r: 7 * k, k: 0.36, ang: ang + 0.2, soft: 0 });
      A.fill(p, 'side', 'hingul', { w: 18 * k, p: 0.85, reach: 1.25, passes: 1, ang: ang + rr(-0.05, 0.05), cv: 0.045, soft: 0 });
      A.fill(p, 'side', 'lac', { w: 16 * k, p: 0.22, reach: 1, passes: 1, ang: ang + 0.08, flow: 0.4, soft: 0 });
    }
    const yb0 = b + 1.5, yb1 = inset - 2.5;
    const band = [
      [[[yb0, yb0], [W - yb0, yb0], [W - yb1, yb1], [yb1, yb1]], 0],
      [[[yb1, H - yb1], [W - yb1, H - yb1], [W - yb0, H - yb0], [yb0, H - yb0]], 0],
      [[[yb0, yb0], [yb1, yb1], [yb1, H - yb1], [yb0, H - yb0]], HP],
      [[[W - yb0, yb0], [W - yb0, H - yb0], [W - yb1, H - yb1], [W - yb1, yb1]], HP]
    ];
    for (const [p, ang] of band) {
      A.fill(p, 'pastel', 'peori', { w: Math.max(4, 8 * k), p: 1, reach: 1.6, passes: 2, turn: 0.08, ang, gap: 0.42, soft: 0 });
      A.fill(p, 'pastel', 'haldi', { w: Math.max(3, 5 * k), p: 0.5, reach: 1.1, passes: 1, ang, gap: 0.9, soft: 0 });
    }
  };

  // a rule pulled by hand along a straight edge that slipped a little
  function rule(A, ax, ay, bx, by, tool, c, w, p) {
    const rr = A.rr, n = 5, pts = [], L = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L, uy = (by - ay) / L, ov = rr(-1.5, 2.5);
    for (let i = 0; i <= n; i++) pts.push([ax + (bx - ax) * i / n + (i === 0 ? -ux * ov : i === n ? ux * ov : 0) - uy * rr(-0.35, 0.35), ay + (by - ay) * i / n + (i === 0 ? -uy * ov : i === n ? uy * ov : 0) + ux * rr(-0.35, 0.35)]);
    A.outline(A.spline(pts, false, 8), tool, c, { w, p, pull: rr(260, 520), again: 0.3, wob: 0.5 });
  }
  M.rule = rule;
  function ruleBox(A, x0, y0, x1, y1, tool, c, w, p) {
    rule(A, x0, y0, x1, y0, tool, c, w, p); rule(A, x1, y0, x1, y1, tool, c, w, p);
    rule(A, x1, y1, x0, y1, tool, c, w, p); rule(A, x0, y1, x0, y0, tool, c, w, p);
  }
  M.ruleBox = ruleBox;

  M.frameRules = function (A, b, inset) {
    const W = A.LW, H = A.LH;
    ruleBox(A, b + 0.6, b + 0.6, W - b - 0.6, H - b - 0.6, 'kajal', 'kajal', 1.7, 0.85);
    ruleBox(A, inset - 2.6, inset - 2.6, W - inset + 2.6, H - inset + 2.6, 'kajal', 'kajal', 1.5, 0.85);
    ruleBox(A, 2.2, 2.2, W - 2.2, H - 2.2, 'kajal', 'maroon', 2.2, 0.6);
  };

  /* M.frameVine(A, b): a quiet vine through the red band, tone on tone, with seeds of shell gold,
     and an eight-petalled flower in each corner. */
  M.frameVine = function (A, b) {
    const rr = A.rr, W = A.LW, H = A.LH, k = b / 40;
    const vine = (ax, ay, bx, by) => {
      const L = Math.hypot(bx - ax, by - ay); if (L < 40) return;
      const ux = (bx - ax) / L, uy = (by - ay) / L, nx = -uy, ny = ux;
      const wl = L / Math.max(1, Math.round(L / (62 * k))), amp = 7.2 * k, pts = [], ph = rr(0, 6.28);
      for (let s = 0; s <= L; s += 4) { const o = Math.sin(s / wl * 6.2832 + ph) * amp * (0.86 + 0.28 * A.noise1(s / 90, 3)); pts.push([ax + ux * s + nx * o, ay + uy * s + ny * o]); }
      A.outline(pts, 'pencil', 'maroon', { w: 1.6 * Math.max(0.7, k), p: 0.72, pull: rr(120, 200), again: 0.25 });
      for (let s = wl * 0.25; s < L; s += wl * 0.5) {
        const o = Math.sin(s / wl * 6.2832 + ph) * amp, x = ax + ux * s + nx * o, y = ay + uy * s + ny * o, sg = o > 0 ? 1 : -1;
        const la = Math.atan2(uy, ux) + sg * rr(0.75, 1.15), ll = rr(8.5, 12) * k;
        const tip = [x + Math.cos(la) * ll, y + Math.sin(la) * ll];
        const mid = [(x + tip[0]) / 2 - Math.sin(la) * 2.6 * k, (y + tip[1]) / 2 + Math.cos(la) * 2.6 * k], mid2 = [(x + tip[0]) / 2 + Math.sin(la) * 2.6 * k, (y + tip[1]) / 2 - Math.cos(la) * 2.6 * k];
        A.fill([[x, y], mid, tip, mid2], 'chalk', 'lac', { w: Math.max(1.6, 2.4 * k), p: 0.8, passes: 1, reach: 1.2, ang: la });
        A.stroke(A.spline([[x, y], mid, tip]), 'pencil', 'maroon', { w: 1, p: 0.7 });
        A.stroke(A.spline([[x, y], mid2, tip]), 'pencil', 'maroon', { w: 1, p: 0.7 });
        const bx2 = x - nx * sg * rr(5, 7.5) * k + ux * rr(-2, 2), by2 = y - ny * sg * rr(5, 7.5) * k + uy * rr(-2, 2);
        A.dot(bx2, by2, 'gold', 'gold', { w: rr(2.2, 3) * Math.max(0.75, k) });
        if (A.chance(0.34)) { for (let q = 0; q < 5; q++) { const a = q * 1.2566 + rr(-0.2, 0.2); A.dot(bx2 + Math.cos(a) * 3.3 * k, by2 + Math.sin(a) * 3.3 * k, 'chalk', 'haldi', { w: 1.5 * Math.max(0.75, k) }); } }
      }
    };
    const c = b / 2 - 0.5, g = 22 * k;
    vine(b + g, c, W - b - g, c); vine(b + g, H - c, W - b - g, H - c);
    vine(c, b + g, c, H - b - g); vine(W - c, b + g, W - c, H - b - g);
    for (const [cx, cy] of [[c + 1, c + 1], [W - c - 1, c + 1], [c + 1, H - c - 1], [W - c - 1, H - c - 1]]) {
      const n = 8, r0 = rr(0, 0.7);
      for (let q = 0; q < n; q++) {
        const a = r0 + q * 6.2832 / n + rr(-0.06, 0.06), r = rr(10.5, 12.5) * k;
        const tip = [cx + Math.cos(a) * r, cy + Math.sin(a) * r], s1 = [cx + Math.cos(a + 0.32) * r * 0.55, cy + Math.sin(a + 0.32) * r * 0.55], s2 = [cx + Math.cos(a - 0.32) * r * 0.55, cy + Math.sin(a - 0.32) * r * 0.55];
        A.fill([[cx, cy], s1, tip, s2], 'chalk', q % 2 ? 'haldi' : 'peori', { w: Math.max(1.6, 2.4 * k), p: 0.95, passes: 2, reach: 1.5, ang: a });
        A.stroke([[cx, cy], s1, tip, s2, [cx, cy]], 'pencil', 'maroon', { w: 0.9, p: 0.75 });
      }
      A.dot(cx, cy, 'gold', 'gold', { w: 5.4 * k });
      A.dot(cx, cy, 'chalk', 'hingul', { w: 2 * k });
    }
  };

  /* M.divider(A, x0, y0, x1, y1): the strip between two panels: red, with a rule on each side. */
  M.divider = function (A, x0, y0, x1, y1) {
    const horiz = (x1 - x0) > (y1 - y0), t = horiz ? y1 - y0 : x1 - x0, p = A.rect(x0, y0, x1 - x0, y1 - y0), ang = horiz ? 0 : HP;
    A.fill(p, 'pastel', 'hingul', { w: Math.max(4, t * 0.7), p: 1, reach: 1.6, passes: 2, turn: 0.06, ang, gap: 0.45, soft: 0 });
    A.fill(p, 'pastel', 'lac', { w: Math.max(3, t * 0.5), p: 0.25, reach: 1, passes: 1, ang, gap: 0.9, soft: 0 });
    if (horiz) { rule(A, x0, y0 + 0.4, x1, y0 + 0.4, 'kajal', 'kajal', 1.4, 0.85); rule(A, x0, y1 - 0.4, x1, y1 - 0.4, 'kajal', 'kajal', 1.4, 0.85); rule(A, x0, (y0 + y1) / 2, x1, (y0 + y1) / 2, 'chalk', 'peori', 1.2, 0.8); }
    else { rule(A, x0 + 0.4, y0, x0 + 0.4, y1, 'kajal', 'kajal', 1.4, 0.85); rule(A, x1 - 0.4, y0, x1 - 0.4, y1, 'kajal', 'kajal', 1.4, 0.85); rule(A, (x0 + x1) / 2, y0, (x0 + x1) / 2, y1, 'chalk', 'peori', 1.2, 0.8); }
  };

  /* M.textPanel(A, r, night): the ground the words sit on.  By day the yellow of a Mewar text panel,
     at night indigo, as on a dyed page. */
  M.textPanel = function (A, r, night) {
    const p = A.rect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
    A.pushMask(p, 0);
    if (night) {
      A.ground(p, 'neel', { ang: -0.55, w: 32, edge: 0, top: 0.5, c2: A.mix('neel', 'night', 0.45) });
      A.fill(p, 'side', A.mix('neel', 'night', 0.3), { w: 30, p: 1, reach: 1.75, passes: 1, ang: 0.3, cv: 0.03, soft: 0 });
    } else {
      A.ground(p, A.mix('peori', 'cream', 0.46), { ang: -0.5, w: 32, edge: 0, top: 0.42, c2: 'peori' });
    }
    A.popMask();
  };

  // ---- the first sketch ----------------------------------------------------
  /* M.sketch(A, pts, o): a light line of red earth, the way a composition is first set out. */
  M.sketch = function (A, pts, o) {
    o = o || {};
    A.outline(pts, 'geru', 'geru', { w: o.w || 2.3, p: Math.min(1, (o.p || 0.6) * 1.45), pull: A.rr(90, 170), again: 0.4, wob: 1.5, closed: !!o.closed });
  };

  // ---- the flower boat ------------------------------------------------------
  /* M.boat(A, x, y, s, o): a small barge with a canopy and a load of lotus, low in the water.
     (x, y) is the middle of the waterline, s the length of the hull.  o.flip turns it to the left,
     o.night hangs a lamp at the prow. */
  M.boat = function (A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, f = o.flip ? -1 : 1, P = (u, v) => [x + u * s * f, y + v * s], L = pts => pts.map(p => P(p[0], p[1]));
    // what the water shows of it, first
    M.reflection(A, x, y + s * 0.085, s * 0.74, s * 0.26, { c: 'hingul', c2: 'sindoor', p: 0.85, lw: Math.max(1.6, s * 0.011), gap: Math.max(2.4, s * 0.016), spread: 0.25 });
    // canopy posts, behind the hull
    const posts = [-0.15, -0.04, 0.09, 0.2];
    for (const u of posts) A.stroke(L([[u, -0.03], [u + rr(-0.004, 0.004), -0.3]]), 'chalk', 'khadi', { w: Math.max(1.6, s * 0.012), p: 0.95 });
    // the load: lotus heaped under the canopy and in the stern
    const bloom = (u, v, k) => {
      const c = P(u, v), n = 5;
      for (let i = 0; i < n; i++) {
        const a = -HP + (i - (n - 1) / 2) * 0.42 + rr(-0.08, 0.08), l = s * 0.034 * k * (1 - Math.abs(i - 2) * 0.12);
        A.stroke([[c[0], c[1]], [c[0] + Math.cos(a) * l, c[1] + Math.sin(a) * l]], 'chalk', i % 2 ? 'gulabi' : 'rose', { w: Math.max(1.6, s * 0.014 * k), p: 1, tin: 0.05, tout: 0.5, reach: 1.5 });
      }
      A.dot(c[0], c[1] - s * 0.008, 'chalk', 'haldi', { w: Math.max(1.2, s * 0.008 * k) });
    };
    for (let i = 0; i < 9; i++) { const u = -0.14 + i * 0.042 + rr(-0.008, 0.008); A.stroke(L([[u - 0.02, -0.035], [u + 0.02, -0.04]]), 'chalk', i % 2 ? 'malachite' : 'leaf', { w: Math.max(2, s * 0.02), p: 0.95, reach: 1.4 }); }
    for (let i = 0; i < 8; i++) bloom(-0.14 + i * 0.045 + rr(-0.006, 0.006), -0.05 - (i % 2) * 0.022 - rr(0, 0.01), rr(0.85, 1.15));
    for (let i = 0; i < 3; i++) bloom(-0.3 + i * 0.045, -0.055 - (i === 1 ? 0.02 : 0), 0.9);
    // hull: a shallow crescent, high at both ends
    const gun = [[-0.5, -0.2], [-0.44, -0.105], [-0.34, -0.052], [-0.16, -0.024], [0.06, -0.022], [0.26, -0.04], [0.4, -0.085], [0.47, -0.15]];
    const keel = [[0.43, -0.02], [0.3, 0.05], [0.08, 0.078], [-0.14, 0.076], [-0.33, 0.04], [-0.45, -0.04]];
    const hull = A.spline(L(gun), false, 3).concat(A.spline(L(keel), false, 3));
    A.shape(hull, { c: 'hingul', w: Math.max(3, s * 0.03), passes: 2, ang: 0.1, rough: 0.5, line: 'kajal', lw: 1.3 });
    A.stroke(A.spline(L(gun.map(p => [p[0] * 0.985, p[1] + 0.017])), false, 3), 'chalk', 'peori', { w: Math.max(1.8, s * 0.013), p: 1, reach: 1.5 });
    A.stroke(A.spline(L(gun.map(p => [p[0] * 0.97, p[1] + 0.036])), false, 3), 'pencil', 'maroon', { w: 1, p: 0.7 });
    for (let i = 0; i < 13; i++) { const u = -0.36 + i * 0.058, q = P(u, 0.03 + 0.03 * Math.cos(u * 3.2)); A.dot(q[0], q[1], 'chalk', i % 2 ? 'khadi' : 'peori', { w: Math.max(1.3, s * 0.009) }); }
    A.stroke(A.spline(L([[0.4, 0.0], [0.2, 0.062], [-0.02, 0.078], [-0.22, 0.066], [-0.4, 0.0]]), false, 3), 'gold', 'gold', { w: Math.max(1.2, s * 0.007), p: 0.85 });
    // prow: the neck and head of a goose, looking back along the boat
    const neck = A.spline(L([[0.455, -0.13], [0.5, -0.2], [0.505, -0.27], [0.475, -0.315], [0.44, -0.3]]), false, 2);
    A.stroke(neck, 'chalk', 'khadi', { w: Math.max(2.6, s * 0.022), p: 1, reach: 1.6, tin: 0, tout: 0.1 });
    A.stroke(neck.map(p => [p[0] + s * 0.011 * f, p[1]]), 'pencil', 'sepia', { w: 0.9, p: 0.7 });
    const hd = P(0.44, -0.3);
    A.dot(hd[0], hd[1], 'chalk', 'khadi', { w: Math.max(3.4, s * 0.03) });
    A.stroke([[hd[0] - s * 0.008 * f, hd[1] + s * 0.004], [hd[0] - s * 0.04 * f, hd[1] + s * 0.016]], 'chalk', 'saffron', { w: Math.max(1.6, s * 0.012), p: 1, tout: 0.6 });
    A.dot(hd[0] - s * 0.003 * f, hd[1] - s * 0.004, 'pencil', 'kajal', { w: 1.1 });
    // stern post with a pennant
    A.stroke(L([[-0.5, -0.2], [-0.52, -0.31]]), 'pencil', 'sepia', { w: 1.3, p: 0.85 });
    A.fill(L([[-0.52, -0.31], [-0.6, -0.295], [-0.525, -0.27]]), 'chalk', 'saffron', { w: 2, p: 1, passes: 2, reach: 1.5 });
    // canopy: a curved roof with a fringe
    const roof = A.spline(L([[-0.21, -0.3], [-0.12, -0.345], [0.025, -0.37], [0.17, -0.345], [0.26, -0.3]]), false, 3).concat(L([[0.25, -0.283], [-0.2, -0.283]]));
    A.shape(roof, { c: 'peori', w: Math.max(2.4, s * 0.02), passes: 2, ang: 0.05, rough: 0.4, line: 'sepia', lw: 1.1 });
    A.stroke(A.spline(L([[-0.17, -0.31], [-0.06, -0.342], [0.025, -0.35], [0.11, -0.342], [0.22, -0.31]]), false, 3), 'pencil', 'brick', { w: 1, p: 0.7 });
    for (let i = 0; i <= 12; i++) { const u = -0.2 + i * 0.0375, q = P(u, -0.283); A.stroke([[q[0], q[1]], [q[0] + rr(-0.6, 0.6), q[1] + s * 0.02]], 'chalk', i % 2 ? 'hingul' : 'lac', { w: Math.max(1.4, s * 0.009), p: 1, tout: 0.5 }); }
    const top = P(0.025, -0.37);
    A.stroke([[top[0], top[1]], [top[0], top[1] - s * 0.035]], 'gold', 'gold', { w: Math.max(1.4, s * 0.009), p: 0.95 });
    A.dot(top[0], top[1] - s * 0.04, 'gold', 'gold', { w: Math.max(2.4, s * 0.016) });
    // the water it parts
    for (let i = 0; i < 4; i++) { const q = P(0.47 + i * 0.05, 0.02 + i * 0.012); A.stroke(A.ellipse(q[0], q[1], s * (0.03 + i * 0.012), s * 0.008, 0, 3.5, 5.9), 'pencil', 'ice', { w: 0.9, p: 0.6 }); }
    for (let i = 0; i < 5; i++) { const u = -0.5 - i * 0.07 - rr(0, 0.02), v = 0.01 + rr(-0.012, 0.03), q = P(u, v); A.stroke([[q[0], q[1]], [q[0] - s * rr(0.04, 0.09) * f, q[1] + rr(-1, 1)]], 'pencil', 'ice', { w: 0.9, p: rr(0.35, 0.6) }); }
    A.stroke(A.spline(L([[-0.44, 0.0], [-0.2, 0.088], [0.1, 0.09], [0.42, 0.0]]), false, 4), 'chalk', 'khadi', { w: 1.1, p: 0.55 });
    if (o.night && M.lamp) M.lamp(A, P(0.36, -0.1)[0], P(0.36, -0.1)[1], s * 0.05, { reflect: false, ripples: false });
    return { top: [top[0], top[1] - s * 0.05], prow: hd };
  };

  // ---- a small butterfly ----------------------------------------------------
  M.butterfly = function (A, x, y, s, c, c2) {
    const rr = A.rr, a = rr(-0.7, 0.7), ca = Math.cos(a), sa = Math.sin(a), P = (u, v) => [x + (u * ca - v * sa) * s, y + (u * sa + v * ca) * s];
    for (const sg of [-1, 1]) {
      const k = sg < 0 ? rr(0.55, 0.85) : 1;
      A.fill([P(0, 0), P(sg * 0.5 * k, -1.05), P(sg * 1.15 * k, -0.7), P(sg * 0.8 * k, 0.05)], 'chalk', c, { w: 2, p: 1, reach: 1.6, passes: 2 });
      A.fill([P(0, 0), P(sg * 0.75 * k, 0.15), P(sg * 0.6 * k, 0.75), P(sg * 0.12, 0.5)], 'chalk', c2, { w: 1.8, p: 1, reach: 1.6, passes: 2 });
      A.stroke([P(0, 0), P(sg * 0.5 * k, -1.05), P(sg * 1.15 * k, -0.7), P(sg * 0.8 * k, 0.05), P(sg * 0.6 * k, 0.75), P(sg * 0.12, 0.5)], 'pencil', 'sepia', { w: 0.7, p: 0.7 });
    }
    A.stroke([P(0, -0.5), P(0, 0.6)], 'kajal', 'kajal', { w: 1, p: 0.85 });
  };

  // ---- a four-pointed star ----------------------------------------------------
  M.sparkle = function (A, x, y, r) {
    A.dot(x, y, 'chalk', 'khadi', { w: Math.max(1.6, r * 0.5) });
    for (const d of [0, HP]) A.stroke([[x - Math.cos(d) * r, y - Math.sin(d) * r], [x + Math.cos(d) * r, y + Math.sin(d) * r]], 'chalk', 'khadi', { w: 1, p: 0.8, tin: 0.45, tout: 0.45 });
  };
})();
