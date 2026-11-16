(function () {
  'use strict';
  /* ==========================================================================
     ARCHITECTURE AND LAMPS
     White marble drawn flat and frontal, in fine line on conch-white pastel.
       M.pavilion(A, x, y, w, o)       lake pavilion with lamps (zone C)
       M.chhatri(A, x, y, s, o)        small empty domed kiosk (zone A)
       M.lamp(A, x, y, s, o)           floating leaf-lamp
       M.reflection(A, x, y, w, h, o)  broken dashes on still water
       M.wall(A, x, y, w, h, o)        low garden wall with lamp niches
     ======================================================================== */

  // ------------------------------------------------------------ private helpers
  // a line the way a hand rules it without a ruler: slight bow, ends overshoot, long ones in several pulls
  function hl(A, a, b, tool, c, o) {
    o = o || {};
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const ov = o.ov != null ? o.ov : Math.min(2, L * 0.05);
    const e0 = A.rr(-0.3, 1) * ov, e1 = A.rr(-0.3, 1) * ov;
    const p0 = [a[0] - ux * e0, a[1] - uy * e0], p1 = [b[0] + ux * e1, b[1] + uy * e1];
    if (L > 80) {
      const n = Math.ceil(L / 28), pts = [], k = A.rr(-1, 1) * Math.min(1.3, L * 0.006);
      for (let i = 0; i <= n; i++) { const t = i / n, bw = Math.sin(t * Math.PI) * k; pts.push([p0[0] + (p1[0] - p0[0]) * t - uy * bw, p0[1] + (p1[1] - p0[1]) * t + ux * bw]); }
      A.outline(pts, tool, c, Object.assign({ pull: A.rr(70, 120), again: 0.22 }, o));
      return;
    }
    const bow = A.rr(-1, 1) * Math.min(0.9, L * 0.012);
    const m = [(p0[0] + p1[0]) / 2 - uy * bow, (p0[1] + p1[1]) / 2 + ux * bow];
    A.stroke(A.chance(0.5) ? [p0, m, p1] : [p1, m, p0], tool, c, o);
  }
  // opaque flat field for a small built form (covers anything below it)
  function solid(A, pts, c, o) {
    o = o || {};
    const bb = A.bbox([pts]), m = Math.min(bb[2] - bb[0], bb[3] - bb[1]);
    const w = o.w || Math.max(2, Math.min(8, m * 0.8));
    A.fill(pts, o.tool || 'pastel', c, { w, ang: o.ang != null ? o.ang : A.rr(-1.1, -0.2), passes: o.passes || 2, p: o.p != null ? o.p : 1, reach: o.reach || 1.65, gap: o.gap != null ? o.gap : 0.42, cv: o.cv != null ? o.cv : 0.012, turn: 0.9 });
  }
  // a translucent hatch of wax pencil
  function tint(A, pts, c, o) {
    o = o || {};
    A.fill(pts, 'shade', c, { w: o.w || 2.6, p: o.p != null ? o.p : 0.45, passes: o.passes || 1, gap: o.gap != null ? o.gap : 0.7, ang: o.ang != null ? o.ang : -0.9, turn: 0.7, cv: 0.03 });
  }
  // local frame: origin at the anchor, y up, tiny shear so verticals lean
  function frame(A, x, y, s, lean) {
    const P = (lx, ly) => [x + (lx + lean * ly) * s, y - ly * s];
    P.L = pts => pts.map(p => P(p[0], p[1]));
    P.R = (x0, y0, x1, y1, j) => { j = j == null ? 0.45 : j; const r = () => A.rr(-j, j); return P.L([[x0 + r(), y0 + r()], [x1 + r(), y0 + r()], [x1 + r(), y1 + r()], [x0 + r(), y1 + r()]]); };
    P.seg = (ax, ay, bx, by, tool, c, o) => hl(A, P(ax, ay), P(bx, by), tool, c, o);
    return P;
  }
  // the curve of a cusped (multifoil) arch, left springing to right springing. local coords, y up
  function archCurve(cx, sy, hw, ah, n, cusp) {
    const pts = [], N = n ? 16 * n : 28;
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = Math.PI * t;
      const bx = -hw * Math.cos(a);
      let by = ah * Math.pow(Math.sin(a), 0.78);
      const pk = Math.max(0, 1 - Math.abs(t - 0.5) * 9); by += ah * 0.16 * pk * pk;          // the little ogee point
      const k = n ? 1 - cusp * (1 - Math.abs(Math.sin(n * Math.PI * t))) : 1;
      pts.push([cx + bx * k, sy + by * k]);
    }
    return pts;
  }
  // whole opening: jambs + impost ledge + cusped head
  function archL(cx, by, w, h, n, cusp, spring) {
    const hw = w / 2, sy = by + h * spring;
    return [[cx - hw, by], [cx - hw, sy]].concat(archCurve(cx, sy, hw, h * (1 - spring) / 1.16, n, cusp), [[cx + hw, sy], [cx + hw, by]]);
  }
  // bulbous lotus dome
  function domeL(cx, by, w, h, N, pointed) {
    const hw = w / 2, pts = []; N = N || 20;
    const e1 = pointed ? 2.05 : 2.3, e2 = pointed ? 0.66 : 0.6;
    const r = v => hw * (1 + 0.12 * Math.sin(Math.PI * Math.min(1, v / 0.5))) * Math.pow(Math.max(0, 1 - Math.pow(v, e1)), e2);
    for (let i = 0; i <= N; i++) { const v = i / N; pts.push([cx - r(v), by + v * h]); }
    for (let i = N - 1; i >= 0; i--) { const v = i / N; pts.push([cx + r(v), by + v * h]); }
    return pts;
  }
  // curved bangla roof: bowed eave, drooping ends
  function banglaEave(cx, by, hw, h, t) { return [cx + t * hw, by + h * 0.3 * (1 - t * t)]; }
  function banglaRidge(cx, by, hw, h, t) { return [cx + t * hw * 0.97, by + h * (0.2 + 0.8 * (1 - Math.pow(Math.abs(t), 2.2)))]; }
  function banglaL(cx, by, hw, h) {
    const pts = [], N = 22;
    for (let i = 0; i <= N; i++) pts.push(banglaEave(cx, by, hw, h, -1 + 2 * i / N));
    for (let i = N; i >= 0; i--) pts.push(banglaRidge(cx, by, hw, h, -1 + 2 * i / N));
    return pts;
  }
  // row of pointed kangura merlons along a base line. local coords
  function crestL(x0, x1, by, mw, mh) {
    const n = Math.max(1, Math.round((x1 - x0) / mw)), w1 = (x1 - x0) / n, pts = [[x0, by - 0.6], [x0, by]];
    for (let i = 0; i < n; i++) { const a = x0 + i * w1; pts.push([a + w1 * 0.1, by + mh * 0.5], [a + w1 * 0.3, by + mh * 0.62], [a + w1 * 0.5, by + mh], [a + w1 * 0.7, by + mh * 0.62], [a + w1 * 0.9, by + mh * 0.5], [a + w1, by]); }
    pts.push([x1, by - 0.6]);
    return pts;
  }
  // canvas-space tear drop, base at (cx, by), tip up
  function tearPts(cx, by, w, h, lean) {
    const pts = [], N = 9, r = v => (w / 2) * Math.sin(Math.PI * Math.pow(v, 0.55));
    for (let i = 0; i <= N; i++) { const v = i / N; pts.push([cx - r(v) + lean * v * v, by - v * h]); }
    for (let i = N - 1; i >= 1; i--) { const v = i / N; pts.push([cx + r(v) + lean * v * v, by - v * h]); }
    return pts;
  }
  function flame(A, x, y, h) {
    const lean = A.rr(-0.28, 0.28) * h;
    A.fill(tearPts(x, y, h * 0.6, h, lean), 'chalk', 'saffron', { w: Math.max(1.2, h * 0.3), p: 1, reach: 1.7, passes: 2, gap: 0.4, ang: 1.3, cv: 0.02 });
    A.fill(tearPts(x, y - h * 0.04, h * 0.36, h * 0.72, lean * 0.5), 'chalk', 'haldi', { w: Math.max(1, h * 0.2), p: 1, reach: 1.7, passes: 2, gap: 0.4, ang: 1.5 });
    A.dot(x, y - h * 0.17, 'chalk', 'khadi', { w: Math.max(0.9, h * 0.17), p: 1, reach: 1.6, ang: 1.57 });
  }
  // lamp light: a warm dark ring, orange, then yellow; scumbled, edge rubbed out with the finger tip, bright heart last
  function glow(A, cx, cy, r, o) {
    o = o || {}; const c0 = o.c0 || 'brick', c1 = o.c1 || 'saffron', c2 = o.c2 || 'haldi', sq = o.sq || 1, k = o.k != null ? o.k : 1;
    const blob = f => A.roughen(A.ellipse(cx + A.rr(-0.06, 0.06) * r, cy + A.rr(-0.06, 0.06) * r, r * f, r * f * sq), r * f * 0.1, r * 0.9, true);
    if (o.c0 !== false) A.fill(blob(1), 'side', c0, { w: Math.max(4, r * 0.7), p: 0.36 * k, reach: 0.95, passes: 1, ang: A.rr(-1, 1), cv: 0.03 });
    A.fill(blob(0.72), 'side', c1, { w: Math.max(3.5, r * 0.6), p: 0.5 * k, reach: 1.0, passes: 1, ang: A.rr(-1, 1), cv: 0.03 });
    A.fill(blob(0.46), 'pastel', c2, { w: Math.max(3, r * 0.4), p: 0.6 * k, reach: 1.0, passes: 1, ang: A.rr(-1, 1) });
    const sp = [], a0 = A.rr(0, 6.28);
    for (let i = 0; i <= 34; i++) { const a = a0 + i * 0.62, rad = r * (0.25 + 0.85 * i / 34); sp.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * sq]); }
    A.smudge(sp, { r: Math.max(2.5, r * 0.36), k: 0.34 });
    A.fill(blob(0.26), 'pastel', c2, { w: Math.max(2, r * 0.26), p: 0.85 * k, reach: 1.25, passes: 1 });
  }
  // gold kalash finial; (x, y) = its foot, k = height
  function kalash(A, x, y, k, o) {
    o = o || {};
    A.dot(x, y - k * 0.1, 'chalk', o.base || 'ochre', { w: k * 0.34, len: k * 0.2, ang: 0, reach: 1.6, p: 1 });
    A.dot(x, y - k * 0.34, 'gold', o.c || 'gold', { w: k * 0.36, ang: 0, len: k * 0.1 });
    A.dot(x, y - k * 0.36, 'gold', o.c || 'gold', { w: k * 0.3, ang: 1.57, len: k * 0.08 });
    A.dot(x, y - k * 0.6, 'gold', o.c || 'gold', { w: k * 0.2, ang: 1.57, len: k * 0.07 });
    A.stroke([[x, y - k * 0.6], [x + A.rr(-0.3, 0.3), y - k]], 'gold', o.c || 'gold', { w: Math.max(0.85, k * 0.1), tin: 0, tout: 0.5 });
    A.dot(x - k * 0.07, y - k * 0.38, 'chalk', 'cream', { w: Math.max(0.6, k * 0.07), p: 0.9 });
  }
  function rosette(A, c, r, col, n) {
    const a0 = A.rr(0, 6.28); n = n || 6;
    for (let k = 0; k < n; k++) { const a = a0 + k * 6.2832 / n + A.rr(-0.1, 0.1); A.stroke([[c[0] + Math.cos(a) * r * 0.3, c[1] + Math.sin(a) * r * 0.3], [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]], 'chalk', col, { w: Math.max(0.9, r * 0.5), p: 0.9, tin: 0.15, tout: 0.1 }); }
    A.dot(c[0], c[1], 'gold', 'gold', { w: Math.max(0.9, r * 0.5) });
  }
  // jagged hairline crack
  function crack(A, x, y, len, ang, c) {
    const pts = [[x, y]]; let a = ang, px = x, py = y; const n = Math.max(3, Math.round(len / 3));
    for (let i = 0; i < n; i++) { a += A.rr(-0.7, 0.7); px += Math.cos(a) * len / n; py += Math.sin(a) * len / n; pts.push([px, py]); a = ang + (a - ang) * 0.5; }
    A.stroke(pts, 'pencil', c || 'sepia', { w: 0.75, p: 0.6, wob: 0.4 });
    if (A.chance(0.6)) { const m = pts[(pts.length / 2) | 0]; A.stroke([m, [m[0] + Math.cos(ang + 1) * len * 0.25, m[1] + Math.sin(ang + 1) * len * 0.25]], 'pencil', c || 'sepia', { w: 0.6, p: 0.45 }); }
  }

  // ------------------------------------------------------------ reflection
  /* M.reflection(A, x, y, w, h, o): (x, y) = top centre at the waterline, w = width at the top, h = length downward.
     o: c ('khadi'), c2 (second colour mixed in), p (0.9), lw (1.8), gap (3.2), spread (0.5), sway (0.1), tool ('chalk') */
  M.reflection = function (A, x, y, w, h, o) {
    o = o || {};
    const rr = A.rr, c = o.c || 'khadi', c2 = o.c2 || null, p0 = o.p != null ? o.p : 0.9, lw = o.lw || 1.8;
    const gap = o.gap || 3.2, spread = o.spread != null ? o.spread : 0.5, sway = o.sway != null ? o.sway : 0.1, ph = rr(0, 6.28), tool = o.tool || 'chalk';
    let yy = y + gap * rr(0.3, 0.8);
    while (yy < y + h) {
      const t = (yy - y) / h, fade = Math.pow(1 - t, 1.15);
      if (A.rnd() > 0.18 + t * 0.4) {
        const hw = (w / 2) * (1 + spread * t) * rr(0.42, 1.1), cx = x + Math.sin(t * 7 + ph) * w * sway * (0.3 + t) + rr(-0.16, 0.16) * w * (0.4 + t);
        let xa = cx - hw;
        while (xa < cx + hw - 1) {
          const len = Math.max(1.6, 2 * hw * rr(0.22, 0.75)), xb = Math.min(cx + hw, xa + len), dy = rr(-0.5, 0.5);
          A.stroke([[xa, yy + dy], [(xa + xb) / 2, yy + dy + rr(-0.35, 0.35)], [xb, yy + dy + rr(-0.3, 0.3)]], tool, (c2 && A.chance(0.38)) ? c2 : c,
            { w: lw * (1 - 0.35 * t) * rr(0.8, 1.15), p: Math.max(0.12, p0 * fade * rr(0.75, 1.1)), tin: 0.25, tout: 0.3, wob: 0.6 });
          xa = xb + Math.max(1.2, 2 * hw * rr(0.06, 0.3));
        }
      }
      yy += gap * (1 + t * 1.3) * rr(0.6, 1.5);
    }
  };

  // ------------------------------------------------------------ floating leaf-lamp
  /* M.lamp(A, x, y, s, o): (x, y) = centre of the leaf boat on the water, s = width of the leaf (14-22).
     o: leaf ('sap'), glow (true), reflect (true), ripples (true), k (glow strength 0..1.3) */
  M.lamp = function (A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, tilt = rr(-0.1, 0.1), fx = x + rr(-0.05, 0.05) * s, fy = y - s * 0.13;
    if (o.glow !== false) glow(A, fx, fy - s * 0.22, s * 0.8, { k: o.k, sq: 0.8 });
    if (o.reflect !== false) M.reflection(A, x, y + s * 0.22, s * 0.62, s * rr(1.7, 2.4), { c: 'haldi', c2: 'saffron', p: 1, lw: Math.max(1.3, s * 0.1), gap: Math.max(1.8, s * 0.13), spread: 0.7 });
    if (o.ripples !== false) {
      A.stroke(A.ellipse(x, y + s * 0.05, s * 0.78, s * 0.2, tilt, 0.35, 2.75), 'pencil', 'ice', { w: 0.8, p: 0.55 });
      A.stroke(A.ellipse(x + rr(-1, 1), y + s * 0.08, s * 1.08, s * 0.3, tilt, 0.9, 2.3), 'pencil', 'sky', { w: 0.7, p: 0.4 });
    }
    // the leaf cup: a stitched-leaf bowl seen a little from above, pointed at both ends
    const hw = s / 2, hh = s * 0.2, N = 10, cr = Math.cos(tilt), sr = Math.sin(tilt), rim = -hh * 0.3;
    const tr = p => [x + p[0] * cr - p[1] * sr, y + p[0] * sr + p[1] * cr];
    const hull = [], mouth = [];
    for (let i = 0; i <= N; i++) { const t = -1 + 2 * i / N; hull.push([t * hw, rim + hh * 1.25 * (1 - Math.pow(Math.abs(t), 1.7))]); }
    for (let i = N - 1; i >= 1; i--) { const t = -1 + 2 * i / N; hull.push([t * hw, rim + hh * 0.36 * (1 - t * t)]); }
    for (let i = 0; i <= N; i++) { const t = -1 + 2 * i / N; mouth.push([t * hw * 0.98, rim - hh * 0.42 * (1 - t * t)]); }
    for (let i = N - 1; i >= 1; i--) { const t = -1 + 2 * i / N; mouth.push([t * hw * 0.98, rim + hh * 0.36 * (1 - t * t)]); }
    const hp = hull.map(tr), mp = mouth.map(tr), dark = o.leaf || (A.chance(0.75) ? 'sap' : 'olive');
    solid(A, mp, A.mix(dark, 'leaf', 0.75), { w: Math.max(1.6, s * 0.12), ang: tilt + 0.1 });
    solid(A, hp, dark, { w: Math.max(1.8, s * 0.15), ang: tilt + 0.4 });
    for (const t of [-0.5, 0, 0.5]) A.stroke([tr([t * hw, rim + hh * 0.36 * (1 - t * t)]), tr([t * hw * 0.8, rim + hh * 1.15 * (1 - Math.pow(Math.abs(t), 1.7))])], 'pencil', 'leaf', { w: 0.7, p: 0.6 });
    A.outline(hp.slice(0, N + 1), 'kajal', 'kajal', { w: Math.max(0.75, s * 0.05), p: 0.82, pull: 30, again: 0.15 });
    A.outline(mp, 'kajal', 'kajal', { closed: true, w: Math.max(0.65, s * 0.04), p: 0.7, pull: 30, again: 0.1 });
    // marigolds tucked at the lip
    const nm = A.ri(2, 3);
    for (let i = 0; i < nm; i++) { const t = [-0.62, 0.6, -0.3][i] + rr(-0.06, 0.06), q = tr([t * hw, rim + rr(-0.1, 0.25) * hh]); A.dot(q[0], q[1], 'chalk', A.chance(0.5) ? 'saffron' : 'sindoor', { w: Math.max(1.4, s * 0.12), p: 1, reach: 1.6 }); A.dot(q[0], q[1], 'chalk', 'haldi', { w: Math.max(0.6, s * 0.045), p: 1 }); }
    // clay cup and flame
    A.dot(fx, fy + s * 0.05, 'chalk', 'brick', { w: Math.max(1.6, s * 0.17), ang: 0, len: s * 0.09, p: 1, reach: 1.6 });
    flame(A, fx, fy - s * 0.02, s * rr(0.4, 0.5));
  };

  // ------------------------------------------------------------ lake pavilion
  /* M.pavilion(A, x, y, w, o): (x, y) = centre of the plinth at the waterline, w = width of the plinth.
     o: night (true), blinds ({archIndex: fractionDown}), reflect (true), back (colour seen through the roof kiosks,
        default none = whatever is behind), marble, inner, line, lean, under (geru underdrawing, true)
     returns { roofTop, plinth:[x0,y0,x1,y1], lamps:[[x,y]...], top:[x,y] } */
  M.pavilion = function (A, x, y, w, o) {
    o = o || {};
    const rr = A.rr, s = w / 320, night = o.night !== false;
    const lean = o.lean != null ? o.lean : rr(-0.009, 0.009);
    const P = frame(A, x, y, s, lean), L = P.L, R = P.R, seg = P.seg;
    const marble = o.marble || 'khadi', ink = o.line || 'sepia', inner = o.inner || 'maroon';
    const pink = A.mix('gulabi', 'khadi', 0.12), palePink = A.mix('khadi', 'gulabi', 0.55);
    const lw = 1.08 * Math.max(0.85, Math.sqrt(s));
    const pen = (ax, ay, bx, by, c, p, wd) => seg(ax, ay, bx, by, 'pencil', c || ink, { w: (wd || 1) * lw, p: p || 0.86 });
    const p1 = 15, p2 = 34, wallHW = 142, wallTop = p2 + 78, parBot = wallTop + 9, parTop = parBot + 15;
    const lamps = [];

    // 1. geru underdrawing: the setting-out lines, left showing at the ends
    if (o.under !== false) {
      const g = { w: 1.3, p: 0.42 };
      seg(0, -6, 0.5, 208, 'geru', 'geru', g);
      seg(-180, 0.6, 180, 0.2, 'geru', 'geru', g);
      seg(-172, wallTop + 1.2, 172, wallTop + 0.6, 'geru', 'geru', { w: 1.2, p: 0.36 });
      seg(-wallHW - 3.5, p2 - 4, -wallHW - 3, parTop + 14, 'geru', 'geru', { w: 1.2, p: 0.34 });
      seg(wallHW + 3, p2 - 4, wallHW + 3.6, parTop + 14, 'geru', 'geru', { w: 1.2, p: 0.34 });
      A.stroke(L(A.ellipse(1.5, parTop + 28, 63, 31, 0, Math.PI * 1.04, Math.PI * 1.96).map(p => [p[0], 2 * (parTop + 28) - p[1]])), 'geru', 'geru', { w: 1.2, p: 0.36 });
    }

    // 2. marble masses
    solid(A, R(-160, 0, 160, p1), pink, { ang: -0.15 });
    solid(A, R(-152, p1 - 0.5, 152, p2), marble, { ang: -0.25 });
    solid(A, R(-wallHW, p2 - 0.5, wallHW, wallTop), marble, { ang: -0.55 });

    // 3. the five cusped openings and the deep red room behind
    let bays = [52, 53, 60, 53, 52].map(b => b + rr(-1.3, 1.3)); const bs = 270 / bays.reduce((a, b) => a + b, 0); bays = bays.map(b => b * bs);
    const arches = []; let bx = -135;
    bays.forEach((b, i) => {
      const cx = bx + b / 2, ow = b - 6.2, ah = (i === 2 ? 62 : 57) + rr(-1.3, 1.3), sp = 0.52 + rr(-0.015, 0.015);
      const loc = archL(cx, p2, ow, ah, i === 2 ? 7 : 5, 0.125, sp);
      arches.push({ cx, ow, ah, sp, sy: p2 + ah * sp, loc, poly: L(loc), x0: bx, x1: bx + b });
      bx += b;
    });
    for (const a of arches) {
      solid(A, a.poly, inner, { w: 7, ang: rr(-1.3, -0.9) });
      A.withMask(a.poly, () => {
        A.fill(R(a.cx - a.ow / 2 - 1, p2, a.cx + a.ow / 2 + 1, p2 + a.ah * 0.5, 0), 'pastel', 'lac', { w: 7, p: 0.75, passes: 1, reach: 1.1, ang: -0.3 });
        A.fill(R(a.cx - a.ow / 2 - 1, p2 + a.ah * 0.6, a.cx + a.ow / 2 + 1, p2 + a.ah + 6, 0), 'pastel', A.mix('maroon', 'kajal', 0.55), { w: 7, p: 0.62, passes: 1, reach: 1.0, ang: -0.5 });
        // a niche in the back wall, hardly seen
        const nn = L(archL(a.cx + rr(-1.5, 1.5), p2 + 15, a.ow * 0.36, a.ah * 0.4, 3, 0.1, 0.5));
        A.outline(nn, 'pencil', 'hingul', { w: 0.9, p: 0.5, pull: 40 });
        hl(A, P(a.cx - a.ow / 2, p2 + 11), P(a.cx + a.ow / 2, p2 + 11.4), 'pencil', 'hingul', { w: 0.8, p: 0.4 });
      });
    }

    // 4. a lamp in every arch
    if (night) for (const a of arches) {
      const lx = a.cx + rr(-2.5, 2.5), stand = rr(7, 10.5), base = P(lx, p2 + 0.7), top = P(lx, p2 + stand), c = P(lx, p2 + stand + 4.5);
      A.withMask(a.poly, () => glow(A, c[0], c[1], rr(13.5, 16) * s, { c0: 'hingul' }));
      A.stroke([base, top], 'gold', 'gold', { w: 1.3 * s, p: 0.9, tin: 0, tout: 0 });
      hl(A, [base[0] - 3.2 * s, base[1]], [base[0] + 3.2 * s, base[1]], 'gold', 'gold', { w: 1.5 * s, ov: 0.3 });
      A.dot(base[0], (base[1] + top[1]) / 2, 'gold', 'gold', { w: 2 * s, ang: 0 });
      A.stroke([[top[0] - 3.4 * s, top[1] - 1.3 * s], [top[0], top[1] + 0.5 * s], [top[0] + 3.4 * s, top[1] - 1.3 * s]], 'gold', 'gold', { w: 1.6 * s, tin: 0.1, tout: 0.1 });
      flame(A, top[0], top[1] - 0.9 * s, rr(6.2, 7.6) * s);
      lamps.push([top[0], top[1] - 4 * s]);
    }

    // 5. red cloth blinds rolled part of the way up, gold cords
    const blinds = o.blinds || { 0: 0.5, 1: 0.33, 4: 0.44 };
    for (const k in blinds) {
      const a = arches[k]; if (!a) continue;
      const yb = p2 + a.ah * (1 - blinds[k]) + rr(-1, 1), x0 = a.cx - a.ow / 2 - 1, x1 = a.cx + a.ow / 2 + 1, yt = p2 + a.ah + 6, sl = rr(-0.6, 0.6);
      A.withMask(a.poly, () => {
        solid(A, L([[x0, yb - sl], [x1, yb + sl], [x1, yt], [x0, yt]]), 'hingul', { w: 6, ang: -0.15, cv: 0.03 });
        for (let yy = yb + 2.6; yy < yt; yy += rr(2.1, 2.8)) seg(x0, yy - sl + rr(-0.3, 0.3), x1, yy + sl + rr(-0.3, 0.3), 'pencil', 'lac', { w: 0.8, p: 0.6, ov: 0 });
        for (const f of [0.26, 0.74]) { const xx = x0 + (x1 - x0) * f + rr(-0.8, 0.8); seg(xx, yb, xx + rr(-0.5, 0.5), yt, 'chalk', 'peori', { w: 1.4 * s, p: 0.85, ov: 0 }); }
        // the roll, lit from below
        solid(A, L([[x0, yb - 4.4 - sl], [x1, yb - 4.4 + sl], [x1, yb + 0.6 + sl], [x0, yb + 0.6 - sl]]), 'sindoor', { w: 4, ang: 0.05 });
        seg(x0, yb - 4.6 - sl, x1, yb - 4.6 + sl, 'kajal', 'maroon', { w: 1.1, p: 0.85, ov: 0 });
        seg(x0, yb - 2.9 - sl, x1, yb - 3 + sl, 'chalk', 'haldi', { w: 1.1, p: 0.7, ov: 0 });
        seg(x0, yb + 0.7 - sl, x1, yb + 0.7 + sl, 'gold', 'gold', { w: 1.1 * s, ov: 0 });
        for (const f of [0.18, 0.82]) {
          const xx = x0 + (x1 - x0) * f + rr(-1, 1), len = rr(8, 13), e = P(xx + rr(-0.9, 0.9), yb - 4.4 - len);
          A.stroke([P(xx, yb - 4.2), P(xx + rr(-0.5, 0.5), yb - 4.4 - len * 0.5), e], 'gold', 'gold', { w: 0.85 * s, tin: 0, tout: 0 });
          A.dot(e[0], e[1], 'gold', 'gold', { w: 2.1 * s, ang: 1.57 });
          for (let q = -1; q <= 1; q++) A.stroke([[e[0], e[1] + 0.8 * s], [e[0] + q * 1.1 * s, e[1] + rr(3.4, 4.6) * s]], 'gold', 'gold', { w: 0.75 * s, tin: 0, tout: 0.3 });
        }
      });
    }

    // 5b. marigold torans swung across the arches that have no blind
    if (o.toran !== false) arches.forEach((a, i) => {
      if (blinds[i] != null) return;
      const xa = a.cx - a.ow / 2 + 1.5, xb = a.cx + a.ow / 2 - 1.5, y0 = a.sy + 5.5, dip = rr(8, 10.5), sw = [];
      for (let k = 0; k <= 16; k++) { const t = k / 16; sw.push([xa + (xb - xa) * t, y0 - dip * Math.sin(Math.PI * t) + (i === 2 ? 0 : 0)]); }
      A.withMask(a.poly, () => {
        A.stroke(L(sw), 'pencil', 'moss', { w: 0.8, p: 0.6 });
        const pts = A.along(L(sw), 2.5 * s, 0.25 * s);
        pts.forEach((q, n) => {
          if (n % 3 === 1) A.stroke([[q.x, q.y + 0.6 * s], [q.x + rr(-0.6, 0.6) * s, q.y + rr(3.4, 4.8) * s]], 'chalk', 'sap', { w: 1.2 * s, p: 0.9, tin: 0, tout: 0.5 });
        });
        pts.forEach((q, n) => A.dot(q.x, q.y, 'chalk', n % 2 ? 'saffron' : 'haldi', { w: 1.85 * s, p: 1, reach: 1.6 }));
      });
    });

    // 6. cool and warm on the marble (wax pencil glazes), shadow under the eave
    tint(A, R(-wallHW, p2 + 74.5, wallHW, wallTop + 1, 0), 'slate', { p: 0.5, w: 2.4, gap: 0.6, ang: -1.0 });
    if (night) {
      tint(A, R(-wallHW, p2 + 48, wallHW, p2 + 70, 0), 'sky', { p: 0.5, gap: 0.8, ang: -0.95 });
      tint(A, R(-160, 0, -118, p2, 0), 'sky', { p: 0.4, gap: 0.8, ang: -0.9 });
      tint(A, R(118, 0, 160, p2, 0), 'sky', { p: 0.4, gap: 0.8, ang: -0.9 });
      for (const a of arches) {                                    // lamp light spilling over the sill
        tint(A, L(A.ellipse(a.cx, p2 - 6, a.ow * 0.44, 10)), 'haldi', { p: 0.55, gap: 0.6, ang: 0.15, w: 2.4 });
        tint(A, L(A.ellipse(a.cx, p2 - 3, a.ow * 0.26, 5)), 'saffron', { p: 0.4, gap: 0.7, ang: 0.1, w: 2 });
      }
    } else tint(A, R(-wallHW, p2 + 50, wallHW, p2 + 70, 0), 'stone', { p: 0.4, gap: 0.9 });

    // 7. pillars: base, fluted shaft, bracket capital
    const colX = [-135].concat(arches.map(a => a.x1));
    colX.forEach((cx, i) => {
      const sy = Math.max(i > 0 ? arches[i - 1].sy : 0, i < 5 ? arches[i].sy : 0), hwL = i === 0 ? 7 : 3.1, hwR = i === 5 ? 7 : 3.1;
      solid(A, L([[cx - 3.3, sy - 7], [cx + 3.3, sy - 7], [cx + (i === 5 ? 7 : 7.3), sy + 1], [cx - (i === 0 ? 7 : 7.3), sy + 1]]), marble, { w: 3 });
      solid(A, R(cx - (i === 0 ? 7 : 5.4), p2, cx + (i === 5 ? 7 : 5.4), p2 + 4.6, 0.25), marble, { w: 3, ang: 0.05 });
      if (night) {                                                 // warm edges facing the lamps
        if (i > 0) seg(cx - 2.2, p2 + 5, cx - 2.2, sy - 8, 'shade', 'haldi', { w: 2.2, p: 0.6 });
        if (i < 5) seg(cx + 2.2, p2 + 5, cx + 2.2, sy - 8, 'shade', 'haldi', { w: 2.2, p: 0.6 });
      }
      if (i > 0) pen(cx - hwL, p2 + 4.6, cx - hwL + rr(-0.2, 0.2), sy - 7);
      if (i < 5) pen(cx + hwR, p2 + 4.6, cx + hwR + rr(-0.2, 0.2), sy - 7);
      pen(cx + rr(-0.4, 0.4), p2 + 6, cx + rr(-0.4, 0.4), sy - 8, 'grey', 0.45, 0.8);
      // base mouldings
      pen(cx - 5.6, p2 + 4.6, cx + 5.6, p2 + 4.7); pen(cx - 4.6, p2 + 2.6, cx + 4.6, p2 + 2.5, 'grey', 0.55, 0.8);
      // rings
      pen(cx - 3.3, p2 + 9, cx + 3.3, p2 + 9.1, null, 0.6, 0.8); pen(cx - 3.3, sy - 10.5, cx + 3.3, sy - 10.4, null, 0.6, 0.8);
      // bracket curls
      if (i > 0) A.stroke(L([[cx - 3.3, sy - 7], [cx - 6.6, sy - 5.2], [cx - 7.3, sy + 0.8]]), 'pencil', ink, { w: lw, p: 0.78 });
      if (i < 5) A.stroke(L([[cx + 3.3, sy - 7], [cx + 6.6, sy - 5.2], [cx + 7.3, sy + 0.8]]), 'pencil', ink, { w: lw, p: 0.78 });
      pen(cx - 3.4, sy - 7, cx + 3.4, sy - 7, null, 0.6, 0.8);
      A.dot(P(cx, sy - 3.4)[0], P(cx, sy - 3.4)[1], 'chalk', 'rose', { w: 1.3 * s, p: 0.8 });
    });

    // 8. arch heads: cusped line, outer moulding, bud at the apex, flowers in the spandrels
    for (const a of arches) {
      const off = [rr(-0.4, 0.4) * s, rr(-0.4, 0.4) * s];
      A.outline(L(archCurve(a.cx, a.sy, a.ow / 2, a.ah * (1 - a.sp) / 1.16, a === arches[2] ? 7 : 5, 0.125)).map(p => [p[0] + off[0], p[1] + off[1]]), 'pencil', ink, { w: lw, p: 0.82, pull: 34, again: 0.25 });
      A.outline(L(archCurve(a.cx, a.sy + 0.5, a.ow / 2 + 2.3, a.ah * (1 - a.sp) / 1.16 + 3.2, 0, 0)), 'pencil', 'grey', { w: 0.8 * lw, p: 0.5, pull: 50 });
      const ap = P(a.cx, p2 + a.ah + 3.4);
      A.fill(tearPts(ap[0], ap[1] + 1.2 * s, 3.4 * s, 5.4 * s, rr(-0.5, 0.5)), 'chalk', 'rose', { w: 1.2, p: 0.95, reach: 1.5, passes: 2, gap: 0.4 });
      A.dot(ap[0], ap[1] + 1.4 * s, 'gold', 'gold', { w: 1.4 * s });
      for (const sgn of [-1, 1]) rosette(A, P(a.cx + sgn * a.ow * 0.4 + rr(-0.6, 0.6), p2 + a.ah * 0.5 + 34 + rr(-0.6, 0.6)), 3.5 * s, A.chance(0.5) ? 'rose' : 'crimson', 6);
    }
    // string course with a row of beads
    pen(-wallHW, p2 + 70.6, wallHW, p2 + 70.3, null, 0.7); pen(-wallHW, p2 + 73.6, wallHW, p2 + 73.9, 'grey', 0.6, 0.85);
    for (let lx = -wallHW + 3; lx < wallHW - 2; lx += rr(4.8, 6.2)) { const q = P(lx, p2 + 72.1 + rr(-0.3, 0.3)); A.dot(q[0], q[1], 'chalk', 'rose', { w: 1.05 * s, p: 0.8 }); }
    pen(-wallHW, p2 + 2, -wallHW + rr(-0.4, 0.4), wallTop); pen(wallHW, p2 + 2, wallHW + rr(-0.4, 0.4), wallTop);

    // 9. the slanting chhajja and its brackets
    solid(A, L([[-wallHW - 1, parBot + 0.6], [wallHW + 1, parBot + 0.6], [wallHW + 14.5, wallTop - 1.6], [-wallHW - 14.5, wallTop - 1.6]]), palePink, { w: 5, ang: 0.02 });
    for (let lx = -wallHW - 9; lx <= wallHW + 9; lx += rr(4.2, 5.8)) seg(lx * 0.955, parBot, lx * 1.035, wallTop - 1.2, 'pencil', 'rose', { w: 0.8, p: 0.5, ov: 0 });
    pen(-wallHW - 14.5, wallTop - 1.6, wallHW + 14.5, wallTop - 1.8, null, 0.85, 1.1);
    pen(-wallHW - 1, parBot + 0.6, wallHW + 1, parBot + 0.8, null, 0.7);
    seg(-wallHW - 13.5, wallTop - 0.2, wallHW + 13.5, wallTop - 0.3, 'gold', 'gold', { w: 0.9 * s, p: 0.85 });
    pen(-wallHW - 14.5, wallTop - 1.6, -wallHW - 1, parBot + 0.6); pen(wallHW + 14.5, wallTop - 1.6, wallHW + 1, parBot + 0.6);
    for (let lx = -wallHW + 4; lx <= wallHW - 3; lx += rr(7.6, 9.8)) A.stroke(L([[lx, wallTop - 2], [lx + 1.3, wallTop - 4.6], [lx - 0.5, wallTop - 6.4]]), 'pencil', ink, { w: lw * 0.95, p: 0.72 });

    // 10. parapet: pierced fish-scale jali, rails, posts, kangura crest
    const pierce = o.pierce || (night ? 'storm' : 'slate');
    solid(A, R(-wallHW + 3, parBot, wallHW - 3, parTop, 0.4), marble, { w: 6, ang: 0.12 });
    solid(A, L(crestL(-wallHW + 3, wallHW - 3, parTop - 0.3, 6.6, 5.6)), marble, { w: 2.6, ang: 0.2 });
    if (night) tint(A, R(-wallHW + 3, parBot, wallHW - 3, parTop + 5, 0), 'sky', { p: 0.46, gap: 0.85, ang: -0.8 });
    for (let row = 0; row < 2; row++) {
      const yy = parBot + 3.4 + row * 5.1;
      for (let lx = -wallHW + 7.5 + (row ? 2.6 : 0); lx < wallHW - 6; lx += 5.2) {
        const jx = lx + rr(-0.35, 0.35), jy = yy + rr(-0.3, 0.3), q = P(jx, jy + 0.9);
        A.dot(q[0], q[1], 'chalk', pierce, { w: 1.5 * s, p: 0.9, ang: 1.57 });
        A.stroke(L([[jx - 2.6, jy - 0.6], [jx - 1.8, jy + 2.2], [jx, jy + 3.1], [jx + 1.8, jy + 2.2], [jx + 2.6, jy - 0.6]]), 'pencil', 'grey', { w: 0.7, p: 0.6, wob: 0.4 });
      }
    }
    pen(-wallHW + 3, parBot + 1.3, wallHW - 3, parBot + 1.2, null, 0.7, 0.85); pen(-wallHW + 3, parTop - 1.4, wallHW - 3, parTop - 1.5, null, 0.7, 0.85);
    A.outline(L(crestL(-wallHW + 3, wallHW - 3, parTop - 0.3, 6.6, 5.6)).slice(1, -1), 'pencil', ink, { w: lw * 0.85, p: 0.7, pull: 60 });

    // 11. roof: two domed kiosks, corner buds, central kiosk under a bangla roof
    for (const sgn of [-1, 1]) {
      const g = sgn * (wallHW - 1.5);
      solid(A, R(g - 2.5, parTop - 0.5, g + 2.5, parTop + 11, 0.2), marble, { w: 2.4, ang: 1.4 });
      const bud = L(domeL(g, parTop + 11, 7.4, 7.4, 8)); solid(A, bud, marble, { w: 2.2 });
      A.outline(bud, 'pencil', ink, { w: lw * 0.8, p: 0.7, pull: 30 });
      pen(g - 2.5, parTop, g - 2.5, parTop + 11, null, 0.7, 0.85); pen(g + 2.5, parTop, g + 2.5, parTop + 11, null, 0.7, 0.85); pen(g - 3.4, parTop + 11, g + 3.4, parTop + 11, null, 0.7, 0.85);
      const gt = P(g, parTop + 18.2); A.dot(gt[0], gt[1] - 1.4 * s, 'gold', 'gold', { w: 1.8 * s, ang: 1.57 });
    }
    for (const sgn of [-1, 1]) {
      const cx = sgn * 103 + rr(-1, 1), b = parTop - 0.5, dh = 19 + rr(-0.8, 0.8);
      if (o.back) solid(A, R(cx - 17, b + 3.4, cx + 17, b + 23, 0.2), o.back, { w: 5 });
      solid(A, R(cx - 21.5, b, cx + 21.5, b + 3.8, 0.25), marble, { w: 3, ang: 0.05 });
      for (const pr of [[-17, 2.9], [-6, 2.2], [6, 2.2], [17, 2.9]]) {
        const px = cx + pr[0] + rr(-0.4, 0.4), hw = pr[1] / 2;
        solid(A, R(px - hw, b + 3.4, px + hw, b + 23.2, 0.15), marble, { w: 2.1, ang: 1.45 });
        pen(px - hw, b + 3.6, px - hw, b + 23, null, 0.72, 0.8); pen(px + hw, b + 3.6, px + hw, b + 23, null, 0.72, 0.8);
      }
      solid(A, R(cx - 19.5, b + 22.6, cx + 19.5, b + 25.6, 0.2), marble, { w: 2.6, ang: 0.05 });
      const ev = L([[cx - 19.5, b + 29.2], [cx + 19.5, b + 29.2], [cx + 26.5, b + 25], [cx - 26.5, b + 25]]);
      solid(A, ev, palePink, { w: 3, ang: 0.03 });
      for (let lx = -22; lx <= 22; lx += rr(3.6, 4.8)) seg(cx + lx * 0.84, b + 29, cx + lx * 1.1, b + 25.3, 'pencil', 'rose', { w: 0.7, p: 0.5, ov: 0 });
      A.outline(ev, 'pencil', ink, { closed: true, w: lw * 0.85, p: 0.75, pull: 40 });
      solid(A, R(cx - 15.6, b + 29, cx + 15.6, b + 32.2, 0.2), marble, { w: 2.6, ang: 0.05 });
      const dome = L(domeL(cx, b + 32, 31, dh));
      solid(A, dome, marble, { w: 5, ang: -0.7 });
      A.withMask(dome, () => {
        tint(A, R(cx + sgn * 3 - 2, b + 31, cx + sgn * 3 + 18, b + 53, 0), night ? 'sky' : 'stone', { p: 0.5, gap: 0.75, ang: -1.1 });
        if (night) tint(A, R(cx - 17, b + 31, cx + 17, b + 36, 0), 'haldi', { p: 0.4, gap: 0.8, ang: 0.1, w: 2 });
      });
      for (let k = 0; k < 6; k++) { const px = cx - 12.6 + k * 5.05; A.stroke(L([[px - 2.5, b + 32.2], [px - 1.6, b + 36.2], [px, b + 37.6], [px + 1.6, b + 36.2], [px + 2.5, b + 32.2]]), 'pencil', 'rose', { w: 0.8, p: 0.7, wob: 0.4 }); }
      for (const f of [-0.52, 0, 0.52]) A.stroke(A.spline(L([[cx + f * 15, b + 38], [cx + f * 16.5, b + 32 + dh * 0.5], [cx + f * 6, b + 32 + dh * 0.86], [cx, b + 32 + dh]]), false, 2), 'pencil', 'grey', { w: 0.75, p: 0.5 });
      A.outline(dome, 'pencil', ink, { w: lw, p: 0.8, pull: 34, again: 0.25 });
      pen(cx - 21.5, b + 3.8, cx + 21.5, b + 3.8, null, 0.7, 0.85); pen(cx - 19.5, b + 22.6, cx + 19.5, b + 22.6, null, 0.7, 0.85); pen(cx - 15.6, b + 32.2, cx + 15.6, b + 32.1, null, 0.7, 0.85);
      const t = P(cx, b + 32 + dh - 0.6);
      A.dot(t[0], t[1], 'chalk', 'gulabi', { w: 3.4 * s, len: 1.4 * s, ang: 0, p: 1, reach: 1.6 });
      kalash(A, t[0], t[1] - 0.6 * s, 11 * s);
    }
    {
      const kb = parTop - 0.5, kh = 26, khw = 42;
      solid(A, R(-khw, kb, khw, kb + kh, 0.4), marble, { w: 6, ang: -0.4 });
      for (const j of [-1, 0, 1]) {
        const cx = j * 26.5 + rr(-0.6, 0.6), loc = archL(cx, kb + 3.2, 17, 19.5, 3, 0.1, 0.5), poly = L(loc);
        solid(A, poly, inner, { w: 4, ang: -1.1 });
        if (night) {
          const c = P(cx, kb + 9);
          A.withMask(poly, () => glow(A, c[0], c[1], 8 * s, { k: j === 0 ? 1 : 0.7 }));
          if (j === 0) { flame(A, c[0], c[1] + 2.4 * s, 4.6 * s); lamps.push([c[0], c[1]]); }
        }
        A.outline(poly, 'pencil', ink, { w: lw * 0.85, p: 0.78, pull: 30 });
      }
      if (night) tint(A, R(-khw, kb + 21, khw, kb + kh, 0), 'slate', { p: 0.4, gap: 0.7, w: 2 });
      for (const lx of [-khw, -13.2, 13.2, khw]) pen(lx, kb, lx + rr(-0.3, 0.3), kb + kh, null, 0.7, 0.85);
      pen(-khw, kb + 1.6, khw, kb + 1.5, 'grey', 0.6, 0.8);
      const ke = L([[-khw - 1, kb + kh + 4], [khw + 1, kb + kh + 4], [khw + 9.5, kb + kh - 0.6], [-khw - 9.5, kb + kh - 0.6]]);
      solid(A, ke, palePink, { w: 3, ang: 0.03 });
      for (let lx = -khw - 5; lx <= khw + 5; lx += rr(4, 5.4)) seg(lx * 0.93, kb + kh + 3.8, lx * 1.07, kb + kh - 0.4, 'pencil', 'rose', { w: 0.7, p: 0.5, ov: 0 });
      A.outline(ke, 'pencil', ink, { closed: true, w: lw * 0.9, p: 0.75, pull: 50 });
      // bangla roof
      const rb = kb + kh + 3.6, rhw = 55, rh = 24, roof = L(banglaL(0, rb, rhw, rh));
      solid(A, roof, marble, { w: 6, ang: 0.3 });
      A.withMask(roof, () => {
        const band = []; for (let i = 0; i <= 20; i++) { const e = banglaEave(0, rb, rhw, rh, -1 + 2 * i / 20); band.push([e[0], e[1] + 2.4]); }
        A.stroke(L(band), 'chalk', 'gulabi', { w: 2.6 * s, p: 0.9, reach: 1.4 });
        tint(A, R(8, rb - 2, rhw + 2, rb + rh + 2, 0), night ? 'sky' : 'stone', { p: 0.45, gap: 0.8, ang: -1.0 });
        for (let t = -0.86; t <= 0.87; t += rr(0.12, 0.16)) { const e = banglaEave(0, rb, rhw, rh, t), r = banglaRidge(0, rb, rhw, rh, t * 0.9); hl(A, P(e[0], e[1] + 4.6), P(r[0], r[1] - 1), 'pencil', 'grey', { w: 0.7, p: 0.48, ov: 0 }); }
        const mid = []; for (let i = 0; i <= 20; i++) { const t = -1 + 2 * i / 20, e = banglaEave(0, rb, rhw, rh, t); mid.push([e[0], e[1] + 4.8]); }
        A.stroke(L(mid), 'pencil', ink, { w: 0.8, p: 0.6 });
      });
      A.outline(roof, 'pencil', ink, { closed: true, w: lw, p: 0.82, pull: 60, again: 0.25 });
      for (const f of [-0.55, 0, 0.55]) { const r = banglaRidge(0, rb, rhw, rh, f), q = P(r[0], r[1] - 0.4); kalash(A, q[0], q[1], (f === 0 ? 13 : 8.5) * s); }
    }

    // 12. plinth: lotus-petal frieze on the pink course, panels on the white one
    for (let lx = -156; lx < 152; lx += rr(6.4, 7.6)) A.stroke(L([[lx, 2.6], [lx + 0.9, 8.6], [lx + 3.4, 12.4], [lx + 5.9, 8.6], [lx + 6.8, 2.6]]), 'pencil', A.chance(0.7) ? 'crimson' : 'lac', { w: 0.9, p: 0.62, wob: 0.5 });
    seg(-160, p1 - 0.9, 160, p1 - 0.8, 'chalk', 'khadi', { w: 1.2, p: 0.8, ov: 0 });
    pen(-160, 2.2, 160, 2.3, 'lac', 0.55, 0.85);
    for (let lx = -146; lx < 132; lx += 21.5) {
      const a = lx + rr(-0.5, 0.5), b = a + 17 + rr(-0.6, 0.6);
      A.outline(L([[a, p1 + 4], [b, p1 + 4.2], [b, p2 - 5.6], [a, p2 - 5.8]]), 'pencil', 'grey', { closed: true, w: 0.75, p: 0.55, pull: 30 });
      const q = P((a + b) / 2, (p1 + p2) / 2 - 0.8); rosette(A, q, 2.1 * s, 'rose', 5);
    }
    A.outline(R(-160, 0, 160, p1, 0.3), 'pencil', ink, { closed: true, w: lw, p: 0.78 });
    pen(-152, p1, -152, p2); pen(152, p1, 152, p2);
    pen(-152, p2, 152, p2 + 0.2, null, 0.85, 1.1); pen(-152, p2 - 2.6, 152, p2 - 2.7, 'grey', 0.6, 0.8);

    // 13. ghat steps down into the water, two lamp pedestals beside them
    const nst = 5, sh = p2 / nst;
    for (let k = 0; k < 2; k++) {                                   // drowned steps, seen through the water
      const top = -1 - k * 5.2, hw = 19 + (nst + k) * 5.6;
      A.fill(R(-hw, top - 5, hw, top, 0.4), 'pastel', k ? 'storm' : 'slate', { w: 4, p: 0.62 - k * 0.14, reach: 1.05, passes: 1, ang: 0.03 });
    }
    for (let k = 0; k < nst; k++) {
      const top = p2 - k * sh, hw = 19 + k * 5.6 + rr(-0.5, 0.5);
      solid(A, R(-hw, top - sh - 0.3, hw, top, 0.3), marble, { w: 4, ang: 0.04 });
      tint(A, R(-hw, top - sh, hw, top - sh * 0.42, 0.2), 'rose', { p: 0.55, gap: 0.55, ang: 0.03, w: 2.2 });
      if (night) tint(A, R(-hw * 0.6, top - sh * 0.42, hw * 0.6, top, 0.2), 'haldi', { p: 0.5 - k * 0.07, gap: 0.6, ang: 0.05, w: 2 });
      pen(-hw, top, hw, top + 0.1, null, 0.8); pen(-hw, top - sh * 0.42, hw, top - sh * 0.44, 'rose', 0.5, 0.8);
      pen(-hw, top, -hw - 0.2, top - sh, null, 0.7, 0.85); pen(hw, top, hw + 0.2, top - sh, null, 0.7, 0.85);
    }
    for (const sgn of [-1, 1]) {
      const cx = sgn * (19 + nst * 5.6 + 5.5), ph = 21 + rr(-1, 1);
      solid(A, R(cx - 5, -0.5, cx + 5, ph, 0.3), marble, { w: 3.4, ang: 1.3 });
      solid(A, R(cx - 6.6, ph, cx + 6.6, ph + 3, 0.25), marble, { w: 2.6, ang: 0.05 });
      const top = P(cx, ph + 3.2);
      if (night) { glow(A, top[0], top[1] - 4 * s, 10 * s, { c0: false, c1: 'haldi', c2: 'cream', k: 0.85 }); }
      A.outline(R(cx - 5, 0, cx + 5, ph, 0.2), 'pencil', ink, { closed: true, w: lw * 0.9, p: 0.75, pull: 40 });
      A.outline(R(cx - 6.6, ph, cx + 6.6, ph + 3, 0.2), 'pencil', ink, { closed: true, w: lw * 0.85, p: 0.72, pull: 40 });
      pen(cx - 3, 4, cx + 3, 4.1, 'rose', 0.55, 0.8); pen(cx - 3, ph - 4, cx + 3, ph - 4.1, 'rose', 0.55, 0.8);
      A.stroke(L([[cx - 2.4, 6], [cx - 2.2, ph - 9], [cx, ph - 6], [cx + 2.2, ph - 9], [cx + 2.4, 6]]), 'pencil', 'grey', { w: 0.7, p: 0.5 });
      if (night) {
        A.stroke([[top[0] - 3.2 * s, top[1] - 1.6 * s], [top[0], top[1] + 0.3 * s], [top[0] + 3.2 * s, top[1] - 1.6 * s]], 'gold', 'gold', { w: 1.5 * s, tin: 0.1, tout: 0.1 });
        flame(A, top[0], top[1] - 1.3 * s, rr(6.4, 7.6) * s);
        lamps.push([top[0], top[1] - 4.5 * s]);
      }
    }

    // 14. what the still water gives back
    if (o.reflect !== false) {
      const wy = y + 1.5 * s;
      for (const sgn of [-1, 1]) {
        M.reflection(A, x + sgn * 100 * s, wy, 112 * s, 7 * s, { c: 'gulabi', c2: 'rose', p: 0.62, lw: 1.5, gap: 2.4, spread: 0, sway: 0.01 });
        M.reflection(A, x + sgn * 98 * s, wy + 7 * s, 104 * s, w * 0.13, { c: 'ice', c2: 'sky', p: 0.42, lw: 1.4, gap: 3.6, spread: 0.05, sway: 0.03 });
      }
      if (night) for (const lp of lamps) {
        const far = lp[1] < y - 100 * s, ped = !far && lp[1] > y - 34 * s;
        if (far) continue;
        M.reflection(A, lp[0], wy + (ped ? 1 : 3) * s, (ped ? 7 : 6) * s, w * (ped ? 0.24 : 0.17) * rr(0.85, 1.15), { c: 'haldi', c2: 'saffron', p: ped ? 0.95 : 0.7, lw: ped ? 1.7 : 1.4, gap: 2.6, spread: 0.9 });
      }
    }
    const tp = P(0, parTop + 26 + 3.6 + 24 + 13);
    return { roofTop: tp[1], top: tp, plinth: [x - 160 * s, y - p2 * s, x + 160 * s, y], lamps };
  };

  // ------------------------------------------------------------ small empty kiosk (zone A)
  /* M.chhatri(A, x, y, s, o): (x, y) = centre of the base, s = width of the plinth (~90); height ~1.37 s.
     o: back (colour between the pillars; default open), marble, line, lean, worn (0..1, default 1), under (true)
     returns { top:[x,y], dome:[x,y] } */
  M.chhatri = function (A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, u = s / 100, worn = o.worn != null ? o.worn : 1;
    const P = frame(A, x, y, u, o.lean != null ? o.lean : rr(-0.014, 0.014)), L = P.L, R = P.R, seg = P.seg;
    const marble = o.marble || A.mix('khadi', 'cream', 0.22 * worn), stone2 = A.mix(marble, 'sand', 0.3), ink = o.line || 'sepia';
    const pink = A.mix('gulabi', 'sand', 0.25 * worn), palePink = A.mix(marble, 'gulabi', 0.45);
    const lw = 1.08 * Math.max(0.85, Math.sqrt(u));
    const pen = (ax, ay, bx, by, c, p, wd) => seg(ax, ay, bx, by, 'pencil', c || ink, { w: (wd || 1) * lw, p: p || 0.86 });
    const f1 = 10, f2 = 15.5, ct = 64, bt = 69.5, et = 75, dz = 80, dh = 44;

    if (o.under !== false) {
      const g = { w: 1.3, p: 0.5 };
      seg(0.4, -7, 0.8, 140, 'geru', 'geru', g);
      seg(-62, 0.5, 62, 0, 'geru', 'geru', g);
      A.stroke(L(A.ellipse(2.4, dz + 4, 40, 38, 0, Math.PI * 1.02, Math.PI * 1.98).map(p => [p[0], 2 * (dz + 4) - p[1]])), 'geru', 'geru', { w: 1.3, p: 0.46 });
      seg(-63, et - 5, 63, et - 5.5, 'geru', 'geru', { w: 1.2, p: 0.4 });
    }
    // plinth
    solid(A, R(-50, 0, 50, f1), pink, { ang: -0.1 });
    solid(A, R(-44, f1 - 0.4, 44, f2), marble, { ang: 0.05, w: 4 });
    if (o.back) solid(A, R(-37, f2, 37, ct, 0.3), o.back, { w: 7 });
    // back pair first, then the front pair
    for (const pr of [[-13.5, 3.8, 1], [13.5, 3.8, 1], [-37, 5.2, 0], [37, 5.2, 0]]) {
      const px = pr[0] + rr(-0.6, 0.6), hw = pr[1] / 2, back = pr[2], b0 = f2 + (back ? 1.6 : 0), dl = rr(-0.5, 0.5);
      solid(A, L([[px - hw, b0], [px + hw, b0], [px + hw + dl, ct], [px - hw + dl, ct]]), back ? stone2 : marble, { w: 2.6, ang: 1.45 });
      solid(A, R(px - hw - 1.8, b0, px + hw + 1.8, b0 + 4, 0.2), back ? stone2 : marble, { w: 2.4, ang: 0.05 });
      solid(A, L([[px - hw + dl, ct - 5.5], [px + hw + dl, ct - 5.5], [px + hw + 3.6 + dl, ct + 0.4], [px - hw - 3.6 + dl, ct + 0.4]]), back ? stone2 : marble, { w: 2.2 });
      pen(px - hw, b0 + 4, px - hw + dl, ct - 5.5, null, back ? 0.6 : 0.8); pen(px + hw, b0 + 4, px + hw + dl, ct - 5.5, null, back ? 0.6 : 0.8);
      pen(px - hw - 1.8, b0 + 4, px + hw + 1.8, b0 + 4.1, null, 0.65, 0.85);
      if (!back) { pen(px + rr(-0.3, 0.3), b0 + 6, px + dl, ct - 7, 'grey', 0.45, 0.8); pen(px - hw, b0 + 9, px + hw, b0 + 9.1, null, 0.6, 0.8); }
      A.stroke(L([[px - hw + dl, ct - 5.5], [px - hw - 2.9 + dl, ct - 4], [px - hw - 3.6 + dl, ct + 0.2]]), 'pencil', ink, { w: lw * 0.9, p: 0.72 });
      A.stroke(L([[px + hw + dl, ct - 5.5], [px + hw + 2.9 + dl, ct - 4], [px + hw + 3.6 + dl, ct + 0.2]]), 'pencil', ink, { w: lw * 0.9, p: 0.72 });
    }
    // beam, eave, frieze
    solid(A, R(-42, ct, 42, bt, 0.3), marble, { w: 3.4, ang: 0.04 });
    tint(A, R(-42, ct, 42, ct + 2.4, 0), 'umber', { p: 0.4, gap: 0.6, ang: 0.03, w: 2 });
    const ev = L([[-42.5, et + 0.4], [42.5, et + 0.4], [56, bt - 1.6], [-56, bt - 1.6]]);
    solid(A, ev, palePink, { w: 4, ang: 0.03 });
    for (let lx = -50; lx <= 50; lx += rr(4.2, 5.6)) seg(lx * 0.86, et + 0.2, lx * 1.09, bt - 1.3, 'pencil', 'rose', { w: 0.8, p: 0.5, ov: 0 });
    A.outline(ev, 'pencil', ink, { closed: true, w: lw, p: 0.8, pull: 50 });
    for (let lx = -38; lx <= 38; lx += rr(6.6, 8.4)) A.stroke(L([[lx, bt - 2], [lx + 1.2, bt - 4.2], [lx - 0.4, bt - 5.6]]), 'pencil', ink, { w: lw * 0.9, p: 0.7 });
    solid(A, R(-36, et, 36, dz, 0.3), marble, { w: 3.4, ang: 0.04 });
    for (let lx = -33; lx < 33; lx += rr(5.4, 6.6)) { const q = P(lx, (et + dz) / 2 + 0.4); A.dot(q[0], q[1], 'chalk', 'rose', { w: 1.2 * u, p: 0.75 }); }
    // lotus dome
    const dome = L(domeL(0, dz, 70, dh, 22, true));
    solid(A, dome, marble, { w: 7, ang: -0.7 });
    A.withMask(dome, () => {
      tint(A, R(8, dz - 1, 40, dz + dh + 2, 0), 'sand', { p: 0.5 * worn + 0.15, gap: 0.7, ang: -1.05, w: 3 });
      tint(A, R(20, dz - 1, 40, dz + dh * 0.7, 0), 'ochre', { p: 0.34 * worn + 0.1, gap: 0.8, ang: -1.2, w: 2.6 });
      for (let k = 0; k < Math.round(4 * worn); k++) { const sx = rr(-28, 28), sy = dz + rr(8, dh * 0.8); seg(sx, sy, sx + rr(-1, 1), sy - rr(6, 14), 'shade', 'umber', { w: rr(1.4, 2.6), p: 0.3, ov: 0 }); }   // rain stains
    });
    for (let k = 0; k < 8; k++) { const px = -30 + k * 8.6 + rr(-0.4, 0.4); A.stroke(L([[px - 4.2, dz + 0.3], [px - 2.8, dz + 6.6], [px, dz + 9], [px + 2.8, dz + 6.6], [px + 4.2, dz + 0.3]]), 'pencil', 'rose', { w: 0.9, p: 0.72, wob: 0.5 }); }
    for (const f of [-0.6, -0.22, 0.22, 0.6]) A.stroke(A.spline(L([[f * 33, dz + 9.5], [f * 38, dz + dh * 0.5], [f * 15, dz + dh * 0.87], [0, dz + dh]]), false, 2), 'pencil', 'grey', { w: 0.8, p: 0.5 });
    A.outline(dome, 'pencil', ink, { w: lw * 1.05, p: 0.82, pull: 40, again: 0.3 });
    // lines of the lower parts
    A.outline(R(-50, 0, 50, f1, 0.3), 'pencil', ink, { closed: true, w: lw, p: 0.8 });
    pen(-44, f1, -44, f2); pen(44, f1, 44, f2); pen(-44, f2, 44, f2 + 0.2, null, 0.8);
    for (let lx = -46; lx < 44; lx += rr(6.2, 7.4)) A.stroke(L([[lx, 1.8], [lx + 0.9, 5.8], [lx + 3.2, 8.4], [lx + 5.5, 5.8], [lx + 6.4, 1.8]]), 'pencil', 'crimson', { w: 0.85, p: 0.5, wob: 0.5 });
    pen(-42, ct, 42, ct + 0.1, null, 0.8); pen(-42, bt - 1.5, 42, bt - 1.6, 'grey', 0.5, 0.8); pen(-42, ct, -42, bt - 1.6); pen(42, ct, 42, bt - 1.6);
    pen(-36, et + 0.4, -36, dz); pen(36, et + 0.4, 36, dz); pen(-36, dz, 36, dz + 0.1, null, 0.75);
    // cap and finial, dulled by the sun
    const t = P(0, dz + dh - 0.8);
    A.dot(t[0], t[1], 'chalk', pink, { w: 5 * u, len: 2.2 * u, ang: 0, p: 1, reach: 1.6 });
    kalash(A, t[0], t[1] - 1 * u, 15 * u, { c: worn > 0.5 ? 'ochre' : 'gold', base: 'umber' });
    // sun bleaching, cracks, a chipped plinth
    if (worn > 0) {
      tint(A, R(-50, 0, 50, f1, 0), 'sand', { p: 0.4 * worn, gap: 0.8, ang: -0.3, w: 3 });
      const c1 = P(rr(-22, -8), dz + dh * 0.8); crack(A, c1[0], c1[1], rr(14, 20) * u, 1.3 + rr(-0.3, 0.3));
      const c2 = P(rr(18, 34), f1 - 1); crack(A, c2[0], c2[1], rr(7, 10) * u, 1.5 + rr(-0.3, 0.3));
      const c3 = P(rr(-40, -20), et + 1); crack(A, c3[0], c3[1], rr(5, 8) * u, 1.2);
      if (A.chance(0.8)) { const c4 = P(37 + rr(-1, 1), f2 + rr(20, 34)); crack(A, c4[0], c4[1], rr(6, 9) * u, 1.9, 'umber'); }
    }
    return { top: P(0, dz + dh + 14), dome: P(0, dz + dh * 0.5) };
  };

  // ------------------------------------------------------------ low garden wall
  /* M.wall(A, x, y, w, h, o): (x, y) = centre of the base, w x h = body of the wall (crest adds ~0.22 h).
     o: night (true), lamps (true), niches (count), marble, line, tilt.  returns { lamps:[[x,y]...], top:y } */
  M.wall = function (A, x, y, w, h, o) {
    o = o || {};
    const rr = A.rr, night = o.night !== false, marble = o.marble || 'khadi', ink = o.line || 'sepia', u = h / 32;
    const tilt = o.tilt != null ? o.tilt : rr(-0.012, 0.012), hw = w / (2 * u);
    const P0 = frame(A, x, y, u, rr(-0.01, 0.01)), P = (lx, ly) => { const q = P0(lx, ly); return [q[0], q[1] + lx * u * tilt]; };
    const L = pts => pts.map(p => P(p[0], p[1])), R = (x0, y0, x1, y1) => L([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
    const pen = (ax, ay, bx, by, c, p, wd) => hl(A, P(ax, ay), P(bx, by), 'pencil', c || ink, { w: wd || 0.95, p: p || 0.75 });
    hl(A, P(-hw - 8, 0.6), P(hw + 8, 0.3), 'geru', 'geru', { w: 1.2, p: 0.38 });
    solid(A, R(-hw, 0, hw, 32), marble, { w: 7, ang: -0.3 });
    solid(A, R(-hw, 0, hw, 5), A.mix('gulabi', 'khadi', 0.15), { w: 3.4, ang: 0.02 });
    const crest = L(crestL(-hw, hw, 31.6, 7.2, 7));
    solid(A, crest, marble, { w: 2.8, ang: 0.2 });
    tint(A, R(-hw, 5, hw, 32), night ? 'sky' : 'stone', { p: 0.36, gap: 0.95, ang: -0.9 });
    const n = o.niches || Math.max(2, Math.round(hw * 2 / 30)), lamps = [];
    for (let i = 0; i < n; i++) {
      const cx = -hw + (i + 0.5) * 2 * hw / n + rr(-1.2, 1.2), poly = L(archL(cx, 9, 11.5, 16, 3, 0.1, 0.5));
      solid(A, poly, 'maroon', { w: 3.4, ang: -1.1 });
      if (night && o.lamps !== false) {
        const c = P(cx, 14.5);
        A.withMask(poly, () => glow(A, c[0], c[1], 6.5 * u, {}));
        tint(A, L(A.ellipse(cx, 6.5, 6, 3)), 'haldi', { p: 0.5, gap: 0.6, ang: 0.1, w: 2 });
        const b = P(cx, 10.2); A.dot(b[0], b[1], 'gold', 'gold', { w: 2.2 * u, ang: 0 });
        flame(A, b[0], b[1] - 0.9 * u, rr(4.4, 5.4) * u);
        lamps.push([b[0], b[1] - 3 * u]);
      }
      A.outline(poly, 'pencil', ink, { w: 0.9, p: 0.78, pull: 30 });
    }
    pen(-hw, 5, hw, 5.1, null, 0.7); pen(-hw, 28.4, hw, 28.3, null, 0.7); pen(-hw, 30.4, hw, 30.5, 'grey', 0.55, 0.8);
    pen(-hw, 0, -hw, 32); pen(hw, 0, hw, 32);
    A.outline(crest.slice(1, -1), 'pencil', ink, { w: 0.9, p: 0.72, pull: 60 });
    for (let lx = -hw + 3; lx < hw - 2; lx += rr(5, 6.4)) { const q = P(lx, 2.5); A.dot(q[0], q[1], 'chalk', 'crimson', { w: 1.1 * u, p: 0.6 }); }
    return { lamps, top: P(0, 39)[1] };
  };
})();
