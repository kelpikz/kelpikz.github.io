(function () {
  'use strict';
  /* ==========================================================================
     BIRDS AND FISH
     Small, crisp silhouettes in white and green pastel, ticked with wax pencil
     and closed with a hair-thin sepia or kajal line.
     Every creature is built in its own unit space (1 = its size), facing right,
     then moved, turned and mirrored onto the sheet.
     ======================================================================== */

  // ---- local frame: heading-aware transform --------------------------------
  function frame(A, x, y, s, o, extraRot) {
    let h = (o && o.ang != null ? o.ang : 0);
    if (o && o.flip) h = Math.PI - h;
    h = Math.atan2(Math.sin(h), Math.cos(h));
    let flip = false, rot = h;
    if (Math.cos(h) < -1e-9) { flip = true; rot = h - Math.PI; rot = Math.atan2(Math.sin(rot), Math.cos(rot)); }
    rot += (extraRot || 0);
    const t = { x, y, s, rot, flip };
    const f = pts => A.xf(pts, t);
    f.p = (px, py) => A.xf([[px, py]], t)[0];
    f.rot = rot; f.flip = flip; f.dir = flip ? -1 : 1;
    return f;
  }
  // tapered band around a centre line -> closed polygon
  function ribbon(cl, wid) {
    const n = cl.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = cl[Math.max(0, i - 1)], b = cl[Math.min(n - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const t = i / (n - 1), q = t * (wid.length - 1), i0 = Math.min(wid.length - 2, Math.floor(q)), w = wid[i0] + (wid[i0 + 1] - wid[i0]) * (q - i0);
      L.push([cl[i][0] + nx * w, cl[i][1] + ny * w]); R.push([cl[i][0] - nx * w, cl[i][1] - ny * w]);
    }
    return L.concat(R.reverse());
  }
  function oval(cx, cy, rx, ry, rot) { const o = [], c = Math.cos(rot || 0), sn = Math.sin(rot || 0); for (let i = 0; i < 20; i++) { const t = i / 20 * 6.2832, x = Math.cos(t) * rx, y = Math.sin(t) * ry; o.push([cx + x * c - y * sn, cy + x * sn + y * c]); } return o; }
  function jit(A, pts, a) { return pts.map(p => [p[0] + A.rr(-a, a), p[1] + A.rr(-a, a)]); }
  // opaque little field of pastel
  function solid(A, pts, c, w, o) {
    o = o || {};
    A.fill(pts, 'pastel', c, { w, passes: o.passes || 2, p: o.p || 1, reach: o.reach || 1.7, gap: o.gap || 0.42, ang: o.ang != null ? o.ang : A.rr(-1.2, 1.2), cv: o.cv != null ? o.cv : 0.012, len: 70, streak: o.streak != null ? o.streak : 0.18, soft: o.soft });
  }
  function contour(A, pts, c, w, o) {
    o = o || {}; const dx = A.rr(-0.3, 0.3), dy = A.rr(-0.3, 0.3);
    A.outline(pts.map(p => [p[0] + dx, p[1] + dy]), o.tool || 'pencil', c, { closed: o.closed !== false, w, p: o.p != null ? o.p : 0.62, pull: o.pull || 34, again: o.again != null ? o.again : 0.22 });
  }
  // a wing: curved pointed blade with feather notches on the trailing side
  function wing(A, root, th, L, curl, chord, notch) {
    const lead = A.spline([[-0.05, -0.06], [0.25, -0.135], [0.6, -0.115], [0.88, -0.05], [1.0, 0.02]], false, 0.05);
    const n = notch == null ? 1 : notch;
    const trail = [[0.945, 0.07], [0.88, 0.07 - 0.03 * n], [0.81, 0.125], [0.73, 0.125 - 0.04 * n], [0.64, 0.17], [0.555, 0.17 - 0.045 * n], [0.45, 0.195], [0.25, 0.18], [0.0, 0.12]];
    const sg = Math.sin(th) < 0 ? -1 : 1;                 // trailing edge always looks backward
    const map = p => { const a = th + curl * p[0], ca = Math.cos(a), sa = Math.sin(a), u = p[0] * L, v = p[1] * L * chord * sg; return [root[0] + u * ca - v * sa, root[1] + u * sa + v * ca]; };
    const poly = lead.concat(trail).map(map);
    poly.at = map; poly.tips = [[0.945, 0.07], [0.81, 0.125], [0.64, 0.17], [0.45, 0.195]]; poly.sg = sg;
    return poly;
  }

  // ==========================================================================
  // CRANE IN FLIGHT        x,y = body centre, s = wingspan (44-64)
  //   o.phase 0 wings high, 1 half up, 2 wings low, 3 half down
  //   o.ang flight direction (radians, 0 = right, negative = climbing), o.flip
  //   o.c body white, o.shadow, o.leg, o.beak
  // ==========================================================================
  M.crane = function (A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, f = frame(A, x, y, s, o), k = s / 54;
    const ph = o.phase != null ? ((Math.round(o.phase) % 4) + 4) % 4 : A.ri(0, 3);
    const white = o.c || 'khadi', shadow = o.shadow || 'ice', legc = o.leg || 'kajal';
    const D = Math.PI / 180;
    const W = [[-106, -64, 0.68, 0.58, -0.5, -0.34], [-139, -42, 0.62, 0.52, -0.32, -0.22], [117, 62, 0.64, 0.54, 0.5, 0.34], [146, 38, 0.6, 0.5, 0.3, 0.22]][ph];
    const thN = (W[0] + rr(-6, 6)) * D, thF = (W[1] + rr(-6, 6)) * D;
    const nearW = wing(A, [0.01 + rr(-0.01, 0.01), -0.028], thN, W[2] * rr(0.95, 1.05), W[4] * rr(0.8, 1.2), rr(1.15, 1.32));
    const farW = wing(A, [0.05, -0.022], thF, W[3] * rr(0.95, 1.05), W[5], 1.1, 0.7);
    const sag = rr(-0.012, 0.012);
    const body = A.spline(jit(A, [[0.14, -0.036], [0.03, -0.068], [-0.11, -0.048], [-0.215, -0.004], [-0.10, 0.036], [0.03, 0.057], [0.13, 0.032]], 0.004), true, 0.03);
    const neckC = A.spline([[0.10, -0.004], [0.21, -0.02 + sag], [0.32, -0.032 + sag], [0.415, -0.054]], false, 0.03);
    const neck = ribbon(neckC, [0.05, 0.03, 0.024, 0.026]);
    const head = oval(0.43, -0.058, 0.036, 0.026, -0.15);
    const beak = [[0.452, -0.076], [0.60 + rr(-0.01, 0.015), -0.048 + rr(-0.006, 0.006)], [0.452, -0.04]];

    // far wing, a little in shade
    solid(A, f(farW), A.mix(white, shadow, 0.6), 3.2 * k, { ang: f.rot + thF * f.dir });
    for (let i = 0; i < 3; i++) { const t = farW.tips[i]; A.stroke(f([farW.at([t[0], t[1] * 0.95]), farW.at([t[0] - 0.22, t[1] * 0.25])]), 'pencil', 'slate', { w: 0.7 * k, p: 0.5 }); }
    // legs trailing
    const l1 = f([[-0.12, 0.012], [-0.3, 0.03 + rr(-0.01, 0.01)], [-0.47 + rr(-0.02, 0.02), 0.045 + rr(-0.012, 0.012)]]);
    const l2 = f([[-0.12, 0.022], [-0.31, 0.048], [-0.45 + rr(-0.02, 0.02), 0.07 + rr(-0.012, 0.012)]]);
    A.stroke(l1, 'kajal', legc, { w: 1.15 * k, p: 0.95, tin: 0, tout: 0.1 });
    A.stroke(l2, 'kajal', legc, { w: 1.0 * k, p: 0.9, tin: 0, tout: 0.1 });
    for (const l of [l1, l2]) { const e = l[2], b = l[1], dx = (e[0] - b[0]), dy = (e[1] - b[1]), n = Math.hypot(dx, dy) || 1; A.stroke([e, [e[0] + dx / n * 3.2 * k - dy / n * 1.4 * k, e[1] + dy / n * 3.2 * k + dx / n * 1.4 * k]], 'kajal', legc, { w: 0.8 * k, p: 0.85 }); }
    // body, neck, head
    solid(A, f(body), white, 3.2 * k, { ang: f.rot });
    solid(A, f(neck), white, 2.4 * k, { ang: f.rot });
    solid(A, f(head), white, 2.2 * k, { ang: f.rot });
    A.stroke(f([[-0.14, 0.022], [0.0, 0.04], [0.13, 0.022]]), 'chalk', shadow, { w: 1.5 * k, p: 0.7 });
    A.stroke(f([[0.14, 0.012], [0.25, -0.004 + sag], [0.38, -0.028]]), 'pencil', 'slate', { w: 0.7 * k, p: 0.38 });
    // beak, eye
    solid(A, f(beak), o.beak || 'haldi', 1.6 * k, { ang: f.rot, cv: 0.02 });
    A.stroke(f([[0.455, -0.057], [0.59, -0.049]]), 'pencil', 'ochre', { w: 0.6 * k, p: 0.6 });
    A.dot.apply(null, f.p(0.436, -0.064).concat(['kajal', 'kajal', { w: 1.3 * k, p: 1 }]));
    // near wing
    const nw = f(nearW);
    solid(A, nw, white, 3.4 * k, { ang: f.rot + thN * f.dir + 0.3 });
    const m = nearW.at;
    A.stroke(f([m([0.06, 0.1]), m([0.3, 0.13]), m([0.52, 0.12])]), 'chalk', shadow, { w: 2.0 * k, p: 0.72 });
    A.stroke(f([m([0.0, -0.035]), m([0.3, -0.105]), m([0.62, -0.09]), m([0.9, -0.03])]), 'pencil', 'slate', { w: 0.7 * k, p: 0.42 });
    for (let i = 0; i < 4; i++) {
      const t = nearW.tips[i];
      A.stroke(f([m([t[0], t[1] * 0.96]), m([t[0] - rr(0.2, 0.3), t[1] * 0.3])]), 'pencil', i < 2 ? 'ash' : 'slate', { w: 0.75 * k, p: i < 2 ? 0.75 : 0.5 });
      if (i < 3) A.stroke(f([m([t[0] - 0.035, t[1] * 0.8]), m([t[0] - 0.24, t[1] * 0.42])]), 'pencil', 'slate', { w: 0.6 * k, p: 0.4 });
    }
    // the fine line that closes the form
    contour(A, nw, o.line || 'sepia', 0.7 * k, { p: o.lineP || 0.5 });
    contour(A, f(body.slice(Math.floor(body.length * 0.4))), o.line || 'sepia', 0.65 * k, { closed: false, p: (o.lineP || 0.5) * 0.9 });
    if (o.line) { contour(A, f(neck.slice(0, neckC.length)), o.line, 0.6 * k, { closed: false, p: (o.lineP || 0.5) * 0.9 }); contour(A, f(neck.slice(neckC.length)), o.line, 0.6 * k, { closed: false, p: (o.lineP || 0.5) * 0.9 }); }
    return { x, y, s, phase: ph };
  };

  /* A garland of cranes along a curve.  pts = control points (start -> leader),  n = how many.
     o.s0 size of the first bird of the line (tail end), o.s1 size at the far (leading) end,
     o.smooth false = pts is already a polyline, o.sway sideways scatter (fraction of size), o.phase0 */
  M.craneGarland = function (A, pts, n, o) {
    o = o || {};
    const rr = A.rr, s0 = o.s0 || 58, s1 = o.s1 || 44, sway = o.sway != null ? o.sway : 0.12;
    const pl = o.smooth === false ? pts : A.spline(pts, false, 4);
    let total = 0; const cum = [0];
    for (let i = 1; i < pl.length; i++) { total += Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]); cum.push(total); }
    const at = d => { let i = 1; while (i < pl.length - 1 && cum[i] < d) i++; const t = (d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); const a = pl[i - 1], b = pl[i]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[1] - a[1], b[0] - a[0])]; };
    const cyc = [0, 1, 3, 2, 3, 1], birds = []; let ph = o.phase0 != null ? o.phase0 : A.ri(0, 5);
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1), s = (s0 + (s1 - s0) * u) * rr(0.93, 1.07);
      const gapU = total / Math.max(1, n - 1), jl = Math.min(0.15, Math.max(0, (gapU - 1.15 * Math.max(s0, s1)) / gapU) * 0.5);
      const d = total * Math.min(1, Math.max(0, u + (i > 0 && i < n - 1 ? rr(-jl, jl) / (n - 1) : 0)));
      const p = at(d), off = rr(-sway, sway) * s;
      birds.push({ x: p[0] - Math.sin(p[2]) * off, y: p[1] + Math.cos(p[2]) * off, s, ang: p[2] + rr(-0.07, 0.07), phase: cyc[ph % 6] });
      ph += A.chance(0.78) ? 1 : 2;
    }
    const order = birds.slice().sort((a, b) => a.s - b.s);
    for (const b of order) M.crane(A, b.x, b.y, b.s, { ang: b.ang, phase: b.phase, c: o.c, shadow: o.shadow, leg: o.leg, beak: o.beak, line: o.line, lineP: o.lineP });
    return birds;
  };

  // ==========================================================================
  // EGRET STANDING         x,y = feet, s = height (56-84)
  //   o.pose 'still' | 'look' | 'sleep',  o.flip
  // ==========================================================================
  M.egret = function (A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, pose = o.pose || 'still', k = s / 70;
    const f = frame(A, x, y, s, { flip: o.flip });
    const white = o.c || 'khadi', shadow = o.shadow || 'ice', legc = o.leg || 'kajal';
    const sleep = pose === 'sleep', look = pose === 'look';
    const lean = rr(-0.012, 0.012);
    let body, neckC, nw, hx, hy, ht, beak;
    if (sleep) {
      body = [[0.125, -0.52], [0.03, -0.665], [-0.12, -0.57], [-0.215, -0.37], [-0.06, -0.355], [0.07, -0.385]];
      neckC = [[0.085, -0.56], [0.115, -0.655], [0.045, -0.715], [-0.02, -0.675]]; nw = [0.055, 0.045, 0.04, 0.036];
      hx = -0.035; hy = -0.668; ht = 2.5; beak = [[-0.05, -0.685], [-0.155, -0.575], [-0.02, -0.645]];
    } else if (look) {
      body = [[0.125, -0.60], [0.035, -0.722], [-0.12, -0.615], [-0.245, -0.365], [-0.075, -0.372], [0.06, -0.42]];
      neckC = [[0.07, -0.665], [0.118, -0.775], [0.078, -0.89], [0.10, -0.985]]; nw = [0.058, 0.036, 0.028, 0.028];
      hx = 0.115; hy = -1.0; ht = -0.62; beak = [[0.128, -1.03], [0.262 + rr(-0.01, 0.01), -1.118], [0.148, -0.995]];
    } else {
      body = [[0.125, -0.60], [0.035, -0.722], [-0.12, -0.615], [-0.245, -0.365], [-0.075, -0.372], [0.06, -0.42]];
      neckC = [[0.075, -0.665], [0.142, -0.76], [0.048, -0.848], [0.038, -0.912], [0.078, -0.957]]; nw = [0.058, 0.04, 0.03, 0.028, 0.028];
      hx = 0.092; hy = -0.965; ht = 0.06; beak = [[0.118, -0.985], [0.275 + rr(-0.01, 0.012), -0.942 + rr(-0.008, 0.008)], [0.118, -0.948]];
    }
    body = A.spline(jit(A, body.map(p => [p[0] + lean, p[1]]), 0.005), true, 0.03);
    const neckL = A.spline(neckC.map(p => [p[0] + lean, p[1]]), false, 0.025), neck = ribbon(neckL, nw);
    const head = oval(hx + lean, hy, 0.042, 0.028, ht);
    // legs first
    const hipy = sleep ? -0.37 : -0.385;
    const leg = (pts, w) => { const P = f(pts); A.stroke(P, 'kajal', legc, { w: w * k, p: 0.95, tin: 0, tout: 0, wob: 0.5 }); return P; };
    const toes = (fx, fy) => { for (const d of [[0.06, 0.004], [0.045, -0.02], [-0.03, 0.004]]) A.stroke(f([[fx, fy], [fx + d[0] * rr(0.8, 1.15), fy + d[1]]]), 'kajal', legc, { w: 0.85 * k, p: 0.85, tin: 0 }); };
    const knee = (kx, ky) => A.dot.apply(null, f.p(kx, ky).concat(['kajal', legc, { w: 1.7 * k, p: 0.95 }]));
    if (sleep) {
      const kx = 0.012 + rr(-0.006, 0.006);
      leg([[0.0 + lean, hipy], [kx, -0.185], [0.0, 0]], 1.3); knee(kx, -0.185); toes(0.0, 0);
      A.stroke(f([[-0.03 + lean, hipy + 0.01], [-0.005, -0.3], [-0.05, -0.335]]), 'kajal', legc, { w: 1.1 * k, p: 0.8 });   // the folded leg
    } else {
      const k1 = 0.04 + rr(-0.006, 0.006), k2 = -0.018 + rr(-0.006, 0.006), fx2 = -0.045 + rr(-0.012, 0.012);
      leg([[-0.045 + lean, hipy], [k2 - 0.035, -0.2], [fx2 - 0.025, 0]], 1.2); knee(k2 - 0.035, -0.2); toes(fx2 - 0.025, 0);
      leg([[0.03 + lean, hipy], [k1 - 0.012, -0.19], [0.045, 0]], 1.3); knee(k1 - 0.012, -0.19); toes(0.045, 0);
    }
    // plumes behind the tail (drawn under the body so only the tips show)
    for (let i = 0; i < 4; i++) A.stroke(f(A.spline([[-0.06 + lean, -0.56 + i * 0.03], [-0.17, -0.44 + i * 0.02], [-0.24 - i * 0.012 + rr(-0.01, 0.01), -0.33 + i * 0.028]], false, 0.04)), 'chalk', white, { w: 1.0 * k, p: 0.85, tout: 0.4 });
    solid(A, f(body), white, 3.4 * k, { ang: 0.9 * f.dir });
    solid(A, f(neck), white, 2.6 * k, { ang: -1.2 });
    solid(A, f(head), white, 2.2 * k);
    // beak (in sleep it is buried in the back feathers, so the feathers go over it)
    solid(A, f(beak), o.beak || 'haldi', 1.6 * k, { cv: 0.02 });
    A.stroke(f([[(beak[0][0] + beak[2][0]) / 2, (beak[0][1] + beak[2][1]) / 2], beak[1]]), 'pencil', 'ochre', { w: 0.6 * k, p: 0.6 });
    if (sleep) for (let i = 0; i < 3; i++) A.stroke(f([[-0.07 - i * 0.03, -0.635 + i * 0.03], [-0.15 - i * 0.02, -0.55 + i * 0.03]]), 'chalk', white, { w: 1.5 * k, p: 0.95 });
    // shading and feather marks
    A.stroke(f(A.spline([[0.08 + lean, -0.445], [-0.05, -0.395], [-0.2, -0.385]], false, 0.04)), 'chalk', shadow, { w: 2.2 * k, p: 0.7 });
    A.stroke(f(neckL.slice(1, neckL.length - 2).map(p => [p[0] - 0.012, p[1] + 0.004])), 'pencil', 'slate', { w: 0.7 * k, p: 0.36 });
    const wingArc = sleep ? [[0.05 + lean, -0.6], [-0.04, -0.57], [-0.12, -0.49], [-0.185, -0.4]] : [[0.06 + lean, -0.65], [-0.045, -0.61], [-0.14, -0.51], [-0.215, -0.395]];
    A.stroke(f(A.spline(wingArc, false, 0.03)), 'pencil', 'slate', { w: 0.75 * k, p: 0.55 });
    for (let i = 0; i < 4; i++) { const t = 0.25 + i * 0.2, px = 0.05 - 0.235 * t + lean, py = -0.635 + 0.215 * t; A.stroke(f(A.spline([[px + 0.03, py + 0.045], [px - 0.005, py + 0.07], [px - 0.045, py + 0.06]], false, 0.03)), 'pencil', 'slate', { w: 0.65 * k, p: 0.45 }); }
    // breast plumes
    if (!sleep) for (let i = 0; i < 3; i++) A.stroke(f([[0.095 + lean - i * 0.012, -0.585], [0.085 + lean - i * 0.02 + rr(-0.006, 0.006), -0.48 + i * 0.012]]), 'pencil', 'slate', { w: 0.6 * k, p: 0.4 });
    // head plume
    if (!sleep) for (let i = 0; i < 2; i++) A.stroke(f(A.spline([[hx + lean - 0.03, hy - 0.012], [hx + lean - 0.11, hy + 0.012 + i * 0.02], [hx + lean - 0.165 - i * 0.02, hy + 0.06 + i * 0.03]], false, 0.03)), 'chalk', white, { w: 0.95 * k, p: 0.85, tout: 0.5 });
    // eye
    if (sleep) A.stroke(f([[hx + lean - 0.012, hy - 0.004], [hx + lean, hy + 0.006], [hx + lean + 0.014, hy - 0.002]]), 'kajal', 'kajal', { w: 0.7 * k, p: 0.8 });
    else A.dot.apply(null, f.p(hx + lean + (look ? 0.006 : 0.008), hy - (look ? 0.004 : 0.006)).concat(['kajal', 'kajal', { w: 1.3 * k, p: 1 }]));
    // closing line
    const lc = o.line || 'sepia';
    contour(A, f(body), lc, 0.75 * k, { p: 0.6 });
    contour(A, f(neck.slice(0, neckL.length)), lc, 0.7 * k, { closed: false, p: 0.55 });
    contour(A, f(neck.slice(neckL.length)), lc, 0.7 * k, { closed: false, p: 0.55 });
    contour(A, f(head), lc, 0.65 * k, { p: 0.5, again: 0 });
    return { head: f.p(hx + lean, hy), top: f.p(hx + lean, hy - 0.04) };
  };

  // ==========================================================================
  // PARROT (rose-ringed parakeet)     x,y = body centre, s = length incl. tail (28-40)
  //   o.pose 'fly' | 'perch',  o.wings 'up' | 'down',  o.ang flight direction, o.flip,  o.tilt (perch)
  // ==========================================================================
  M.parrot = function (A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, pose = o.pose || 'fly', k = s / 34, D = Math.PI / 180;
    const perch = pose === 'perch';
    const f = perch ? frame(A, x, y, s, { flip: o.flip, ang: 0 }, (o.tilt != null ? o.tilt : -0.92 + rr(-0.12, 0.12)) * (o.flip ? -1 : 1)) : frame(A, x, y, s, o);
    const green = o.c || 'leaf', dark = o.dark || 'malachite';
    const up = o.wings ? o.wings === 'up' : A.chance(0.5);
    const body = A.spline(jit(A, [[0.47, -0.02], [0.40, -0.085], [0.26, -0.088], [0.05, -0.07], [-0.12, -0.036], [-0.13, 0.03], [0.04, 0.075], [0.24, 0.07], [0.40, 0.045]], 0.004), true, 0.03);
    const droop = perch ? 0 : rr(-0.03, 0.03);
    const tail = [[-0.07, -0.05], [-0.36, -0.03 + droop * 0.5], [-0.70 + rr(-0.04, 0.02), 0.004 + droop], [-0.34, 0.03 + droop * 0.5], [-0.07, 0.05]];
    const tail2 = [[-0.08, 0.0], [-0.48 + rr(-0.03, 0.03), 0.065 + droop], [-0.08, 0.055]];
    // tail
    solid(A, f(tail2), 'haldi', 2.0 * k, { ang: f.rot });
    solid(A, f(tail), o.tail || 'teal', 2.2 * k, { ang: f.rot });
    A.stroke(f([[-0.1, 0.0], [-0.66, 0.004 + droop]]), 'pencil', 'bottle', { w: 0.6 * k, p: 0.6 });
    A.stroke(f([[-0.1, -0.024], [-0.46, -0.014 + droop * 0.6]]), 'chalk', 'verdigris', { w: 0.8 * k, p: 0.7 });
    let nearW = null, thN = 0;
    if (!perch) {
      thN = (up ? -112 + rr(-12, 12) : 112 + rr(-12, 12)) * D; const thF = (up ? -68 + rr(-8, 8) : 66 + rr(-8, 8)) * D;
      const farW = wing(A, [0.17, -0.02], thF, 0.5, up ? -0.3 : 0.3, 1.25, 0.5);
      solid(A, f(farW), 'sap', 2.2 * k, { ang: f.rot + thF * f.dir });
      nearW = wing(A, [0.12, -0.02], thN, 0.62 * rr(0.94, 1.06), (up ? -0.42 : 0.42) * rr(0.8, 1.2), 1.35, 0.6);
    }
    // body and head
    solid(A, f(body), green, 2.8 * k, { ang: f.rot });
    A.stroke(f(A.spline([[0.3, 0.05], [0.1, 0.06], [-0.08, 0.03]], false, 0.04)), 'chalk', 'haldi', { w: 1.3 * k, p: 0.55 });
    A.stroke(f(A.spline([[0.25, -0.075], [0.06, -0.06], [-0.1, -0.03]], false, 0.04)), 'pencil', 'malachite', { w: 0.8 * k, p: 0.6 });
    // neck ring: rose, then the thin dark line
    const ring = A.spline([[0.305, -0.088], [0.288, -0.01], [0.31, 0.066]], false, 0.02);
    A.stroke(f(ring.map(p => [p[0] - 0.014, p[1]])), 'chalk', 'rose', { w: 1.0 * k, p: 0.9, tin: 0, tout: 0 });
    A.stroke(f(ring), 'kajal', 'kajal', { w: 0.7 * k, p: 0.85 });
    // beak: red hook
    const beak = A.spline([[0.452, -0.05], [0.497, -0.04], [0.528, -0.008], [0.52, 0.034], [0.503, 0.044], [0.497, 0.012], [0.462, 0.008]], true, 0.012);
    solid(A, f(beak), 'hingul', 1.5 * k, { ang: f.rot, cv: 0.02 });
    A.stroke(f([[0.462, 0.014], [0.488, 0.034], [0.474, 0.05]]), 'kajal', 'lac', { w: 0.7 * k, p: 0.8 });
    // eye
    A.dot.apply(null, f.p(0.397, -0.034).concat(['chalk', 'haldi', { w: 1.9 * k, p: 1 }]));
    A.dot.apply(null, f.p(0.399, -0.034).concat(['kajal', 'kajal', { w: 0.95 * k, p: 1 }]));
    if (perch) {
      const fw = A.spline(jit(A, [[0.21, -0.062], [0.05, -0.09], [-0.2, -0.045], [-0.33, 0.012], [-0.08, 0.03], [0.14, 0.02]], 0.004), true, 0.03);
      solid(A, f(fw), dark, 2.2 * k, { ang: f.rot });
      for (let i = 0; i < 3; i++) A.stroke(f([[0.12 - i * 0.09, -0.05 + i * 0.006], [-0.1 - i * 0.07, -0.01 + i * 0.008]]), 'pencil', 'bottle', { w: 0.6 * k, p: 0.6 });
      A.stroke(f([[0.18, -0.055], [0.03, -0.078], [-0.15, -0.045]]), 'chalk', 'verdigris', { w: 0.8 * k, p: 0.7 });
      contour(A, f(fw), 'bottle', 0.6 * k, { p: 0.5 });
      // feet gripping whatever is below
      const b = f.p(0.03, 0.07);
      for (const dx of [-1.6, 1.2]) { A.stroke([[b[0] + dx * k, b[1] - 0.5 * k], [b[0] + dx * k + rr(-0.4, 0.4), b[1] + 3.2 * k]], 'kajal', 'ash', { w: 0.9 * k, p: 0.9 }); A.stroke([[b[0] + (dx - 1.2) * k, b[1] + 3.3 * k], [b[0] + (dx + 1.4) * k, b[1] + 3.1 * k]], 'kajal', 'ash', { w: 0.8 * k, p: 0.85 }); }
    } else {
      const nw = f(nearW), m = nearW.at;
      solid(A, nw, dark, 2.4 * k, { ang: f.rot + thN * f.dir + 0.3 });
      A.stroke(f([m([0.02, -0.02]), m([0.3, -0.1]), m([0.6, -0.085]), m([0.88, -0.03])]), 'chalk', green, { w: 1.3 * k, p: 0.85 });
      for (let i = 0; i < 4; i++) { const t = nearW.tips[i]; A.stroke(f([m([t[0], t[1] * 0.95]), m([t[0] - 0.26, t[1] * 0.25])]), 'pencil', 'bottle', { w: 0.65 * k, p: 0.7 }); }
      A.stroke(f([m([0.1, 0.1]), m([0.35, 0.14])]), 'chalk', 'verdigris', { w: 0.9 * k, p: 0.6 });
      contour(A, nw, 'bottle', 0.6 * k, { p: 0.5 });
    }
    contour(A, f(body), o.line || 'bottle', 0.6 * k, { p: 0.5 });
    return { x, y, s };
  };

  /* Parrots bursting up and out of a point (a tree top).  r = how far the farthest has got.
     o.a0, o.a1 limits of the fan (default -165deg .. -15deg, i.e. upward), o.s0/o.s1 sizes near/far */
  M.parrotBurst = function (A, x, y, r, n, o) {
    o = o || {};
    const rr = A.rr, a0 = o.a0 != null ? o.a0 : -2.88, a1 = o.a1 != null ? o.a1 : -0.26, s0 = o.s0 || 38, s1 = o.s1 || 27, out = [];
    const ranks = []; for (let i = 0; i < n; i++) ranks.push(i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(A.rnd() * (i + 1)), t = ranks[i]; ranks[i] = ranks[j]; ranks[j] = t; }
    for (let i = 0; i < n; i++) {
      const u = (i + rr(0.2, 0.8)) / n, a = a0 + (a1 - a0) * u + rr(-0.06, 0.06);
      const d = r * (0.16 + 0.84 * Math.pow((ranks[i] + rr(0.25, 0.75)) / n, 0.8));
      let aa = a, dd = d, px = 0, py = 0;
      for (let tr = 0; tr < 10; tr++) {
        px = x + Math.cos(aa) * dd; py = y + Math.sin(aa) * dd * (o.squash || 0.9);
        let ok = true; for (const q of out) if (Math.hypot(q.x - px, q.y - py) < (s0 + s1) * 0.6) { ok = false; break; }
        if (ok) break; aa = a + rr(-0.3, 0.3); dd = Math.min(r, Math.max(r * 0.16, d + rr(-0.25, 0.25) * r));
      }
      out.push({ x: px, y: py, ang: aa + rr(-0.22, 0.22) + (Math.cos(aa) > 0 ? 0.15 : -0.15) * (dd / r), s: (s0 + (s1 - s0) * (dd / r)) * rr(0.92, 1.08), d: dd });
    }
    out.sort((p, q) => q.d - p.d);
    for (const b of out) M.parrot(A, b.x, b.y, b.s, { pose: 'fly', ang: b.ang, wings: A.chance(0.5) ? 'up' : 'down', c: o.c, dark: o.dark });
    return out;
  };

  // ==========================================================================
  // GOOSE (hamsa) ON WATER       x,y = middle of the body at the water line, s = length (40-52)
  //   o.pose 'swim' | 'sleep',  o.flip,  o.wake colour, o.water (colour of the water, for the lapping line)
  // ==========================================================================
  M.goose = function (A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, pose = o.pose || 'swim', sleep = pose === 'sleep', k = s / 46;
    const f = frame(A, x, y, s, { flip: o.flip });
    const white = o.c || 'khadi', shadow = o.shadow || 'ice', wake = o.wake || 'ice';
    const body = A.spline(jit(A, [[0.245, -0.03], [0.17, -0.165], [-0.02, -0.21], [-0.26, -0.16], [-0.43, -0.135], [-0.52, -0.215], [-0.47, -0.06], [-0.33, 0.012], [0.0, 0.04], [0.19, 0.022]], 0.005), true, 0.03);
    let neckC, nw, hx, hy, ht, beak;
    if (sleep) {
      neckC = [[0.19, -0.07], [0.255, -0.185], [0.17, -0.285], [0.04, -0.262], [-0.03, -0.225]]; nw = [0.07, 0.055, 0.046, 0.042, 0.04];
      hx = -0.05; hy = -0.222; ht = 2.75; beak = [[-0.085, -0.238], [-0.2, -0.175], [-0.075, -0.19]];
    } else {
      const st = rr(-0.02, 0.02);
      neckC = [[0.17, -0.09], [0.285, -0.2], [0.275 + st, -0.34], [0.245 + st, -0.44], [0.29 + st, -0.515]]; nw = [0.085, 0.055, 0.04, 0.036, 0.036];
      hx = 0.315 + st; hy = -0.525; ht = 0.1; beak = [[0.355 + st, -0.552], [0.492 + st + rr(-0.01, 0.01), -0.505], [0.355 + st, -0.498]];
    }
    const neckL = A.spline(neckC, false, 0.025), neck = ribbon(neckL, nw), head = oval(hx, hy, 0.058, 0.044, ht);
    // reflection first, under everything
    if (o.reflect !== false) {
      const nref = sleep ? 6 : 3;
      for (let i = 0; i < nref; i++) { const yy = 0.075 + i * 0.05, hw = (0.3 - i * 0.04) * rr(0.8, 1.1), cx = -0.08 + rr(-0.05, 0.05); A.stroke(f([[cx - hw, yy], [cx + rr(-0.05, 0.05), yy + rr(-0.006, 0.006)], [cx + hw, yy]]), 'chalk', i % 2 ? shadow : white, { w: 1.0 * k, p: 0.62 - i * 0.07, tin: 0.3, tout: 0.3 }); }
    }
    solid(A, f(body), white, 3.4 * k, { ang: -0.25 * f.dir });
    solid(A, f(neck), white, 2.8 * k, { ang: -1.1 });
    solid(A, f(head), white, 2.4 * k);
    solid(A, f(beak), o.beak || 'sindoor', 1.6 * k, { cv: 0.02 });
    if (sleep) { for (let i = 0; i < 3; i++) A.stroke(f([[-0.1 - i * 0.035, -0.225 + i * 0.012], [-0.2 - i * 0.03, -0.165 + i * 0.012]]), 'chalk', white, { w: 1.6 * k, p: 0.95 }); }
    else A.stroke(f([[0.36, -0.524], [0.48, -0.506]]), 'pencil', 'brick', { w: 0.55 * k, p: 0.6 });
    // under-shadow, wing arc with gold, feather scallops
    A.stroke(f(A.spline([[0.2, -0.005], [0.0, 0.018], [-0.3, -0.005], [-0.44, -0.07]], false, 0.04)), 'chalk', shadow, { w: 2.4 * k, p: 0.75 });
    const arc = A.spline([[0.12, -0.15], [-0.03, -0.075], [-0.24, -0.06], [-0.44, -0.13]], false, 0.03);
    A.stroke(f(arc), 'pencil', 'ochre', { w: 1.0 * k, p: 0.75 });
    A.stroke(f(arc.map(p => [p[0] + 0.004, p[1] - 0.012])), 'gold', 'gold', { w: 0.8 * k, p: 0.75 });
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4 - r; i++) { const cx = 0.03 - i * 0.105 - r * 0.05, cy = -0.15 + r * 0.04 + i * 0.006; A.stroke(f(A.spline([[cx + 0.045, cy - 0.012], [cx + 0.01, cy + 0.03], [cx - 0.05, cy + 0.008]], false, 0.03)), 'pencil', 'slate', { w: 0.65 * k, p: 0.5 }); }
    A.stroke(f([[-0.36, -0.12], [-0.47, -0.17]]), 'pencil', 'slate', { w: 0.6 * k, p: 0.45 });
    A.stroke(f(neckL.slice(1, neckL.length - 1).map(p => [p[0] - 0.02, p[1] + 0.006])), 'pencil', 'slate', { w: 0.7 * k, p: 0.36 });
    // eye
    if (sleep) A.stroke(f([[hx - 0.018, hy - 0.004], [hx - 0.002, hy + 0.01], [hx + 0.018, hy]]), 'kajal', 'kajal', { w: 0.7 * k, p: 0.8 });
    else A.dot.apply(null, f.p(hx + 0.012, hy - 0.008).concat(['kajal', 'kajal', { w: 1.3 * k, p: 1 }]));
    // closing line (upper part only: the lower edge is lost in the water)
    const lc = o.line || 'sepia';
    contour(A, f(body.slice(0, Math.floor(body.length * 0.62))), lc, 0.7 * k, { closed: false, p: 0.55 });
    contour(A, f(neck.slice(0, neckL.length)), lc, 0.7 * k, { closed: false, p: 0.55 });
    contour(A, f(neck.slice(neckL.length)), lc, 0.7 * k, { closed: false, p: 0.55 });
    contour(A, f(head), lc, 0.65 * k, { p: 0.5, again: 0 });
    // water: the line where the bird sits, and the wake
    const wl = (a, b, yy, c, w, p) => A.stroke(f([[a, yy + rr(-0.006, 0.006)], [(a + b) / 2, yy + rr(-0.012, 0.004)], [b, yy + rr(-0.006, 0.006)]]), 'chalk', c, { w: w * k, p, tin: 0.3, tout: 0.35 });
    if (o.water) wl(-0.36, 0.22, 0.036, o.water, 2.2, 0.9);
    wl(-0.4, 0.3, 0.045, wake, 1.1, 0.8);
    if (sleep) { wl(-0.52, -0.3, 0.07, wake, 0.9, 0.5); wl(0.1, 0.36, 0.075, wake, 0.9, 0.5); }
    else {
      wl(0.2, 0.36, 0.022, white, 1.1, 0.85);                                     // bow ripple
      for (let i = 0; i < 6; i++) { const a = -0.42 - i * 0.14 - rr(0, 0.05), len = rr(0.1, 0.2), up = (i % 2 ? 1 : -1) * (0.03 + i * 0.022); wl(a - len, a, 0.045 + up, i % 3 ? wake : white, 1.0, 0.75 - i * 0.08); }
    }
    return { head: f.p(hx, hy) };
  };

  // ==========================================================================
  // FISH                    s = length (20-36)
  //   'leap': x,y = body centre in the air; the splash is drawn o.drop * s below (default 0.8). o.ang tilts.
  //   'swim': x,y = body centre, seen from above under the surface; o.ang heading; o.water = colour that veils it
  // ==========================================================================
  M.fish = function (A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, pose = o.pose || 'leap', k = s / 28;
    const f = frame(A, x, y, s, o);
    const silver = o.c || 'khadi', back = o.back || 'slate', fin = o.fin || 'hingul';
    if (pose === 'swim') {
      const bend = rr(-0.07, 0.07);
      const cl = A.spline([[0.48, 0], [0.2, bend * 0.4], [-0.1, -bend], [-0.38, bend * 0.6]], false, 0.03);
      const bodyP = ribbon(cl, [0.012, 0.075, 0.095, 0.085, 0.06, 0.03, 0.016]);
      const te = cl[cl.length - 1];
      const tailP = [[te[0] + 0.03, te[1]], [te[0] - 0.15, te[1] - 0.085 + bend * 0.5], [te[0] - 0.085, te[1] + bend * 0.3], [te[0] - 0.15, te[1] + 0.085 + bend * 0.5]];
      const pale = A.mix(back, silver, 0.45);
      for (const sg of [-1, 1]) solid(A, f([[0.2, sg * 0.06], [0.06, sg * 0.19], [0.0, sg * 0.17], [0.1, sg * 0.06]]), A.mix(fin, back, 0.35), 1.5 * k, { p: 0.85, reach: 1.3 });
      solid(A, f(tailP), A.mix(fin, back, 0.3), 1.6 * k, { p: 0.85, reach: 1.3 });
      solid(A, f(bodyP), pale, 2.2 * k, { ang: f.rot, p: 0.92, reach: 1.4 });
      A.stroke(f(cl.slice(2, cl.length - 2)), 'chalk', silver, { w: 1.1 * k, p: 0.7, tin: 0.3, tout: 0.4 });
      for (let i = 0; i < 4; i++) { const p = cl[Math.floor(cl.length * (0.3 + i * 0.13))]; A.stroke(f([[p[0], p[1] - 0.05], [p[0] - 0.02, p[1]], [p[0], p[1] + 0.05]]), 'pencil', 'ash', { w: 0.55 * k, p: 0.45 }); }
      for (const sg of [-1, 1]) A.dot.apply(null, f.p(0.36, sg * 0.04).concat(['kajal', 'kajal', { w: 0.9 * k, p: 0.9 }]));
      // the water lies over it
      const wc = o.water || 'neel', n = o.veil != null ? o.veil : 2;
      for (let i = 0; i < n; i++) { const yy = rr(-0.08, 0.08), a = rr(-0.5, -0.2), b = rr(0.1, 0.45); A.stroke([[x + a * s, y + yy * s], [x + b * s, y + yy * s + rr(-0.02, 0.02) * s]], 'side', wc, { w: 5 * k, p: 0.42, reach: 0.9 }); }
      const wy = rr(-0.16, -0.1) * s;
      A.stroke([[x - 0.3 * s, y + wy], [x, y + wy - 0.03 * s], [x + 0.25 * s, y + wy]], 'chalk', 'ice', { w: 0.9 * k, p: 0.6, tin: 0.3, tout: 0.3 });
      return { x, y };
    }
    // ---- leaping: arched, rising to the right
    const arch = o.arch != null ? o.arch : rr(0.85, 1.15);
    const cl = A.spline([[0.43, -0.2], [0.2, -0.2 - 0.0 * arch], [-0.08, -0.07 * arch], [-0.3, 0.14 * arch], [-0.43, 0.33 * arch]].map(p => [p[0], p[1] + 0.02]), false, 0.025);
    const bodyP = ribbon(cl, [0.02, 0.1, 0.135, 0.13, 0.1, 0.06, 0.034]);
    const te = cl[cl.length - 1], tp = cl[cl.length - 4], tdx = te[0] - tp[0], tdy = te[1] - tp[1], tl = Math.hypot(tdx, tdy) || 1, ux = tdx / tl, uy = tdy / tl;
    const tailP = [[te[0] - ux * 0.04, te[1] - uy * 0.04], [te[0] + ux * 0.17 - uy * 0.15, te[1] + uy * 0.17 + ux * 0.15], [te[0] + ux * 0.085, te[1] + uy * 0.085], [te[0] + ux * 0.2 + uy * 0.11, te[1] + uy * 0.2 - ux * 0.11]];
    const mid = cl[Math.floor(cl.length * 0.42)], m2 = cl[Math.floor(cl.length * 0.58)];
    const dorsal = [[mid[0] + 0.02, mid[1] - 0.1], [mid[0] - 0.11, mid[1] - 0.25], [m2[0] - 0.06, m2[1] - 0.07]];
    const pv = cl[Math.floor(cl.length * 0.3)], pect = [[pv[0], pv[1] + 0.08], [pv[0] - 0.02, pv[1] + 0.26], [pv[0] - 0.12, pv[1] + 0.13]];
    const an = cl[Math.floor(cl.length * 0.7)], anal = [[an[0] + 0.07, an[1] + 0.03], [an[0] + 0.09, an[1] + 0.17], [an[0] - 0.03, an[1] + 0.1]];
    // the water it left: ring, crown, drops (drawn first, under the fish)
    const drop = (o.drop != null ? o.drop : 0.8) * s, sp = f.p(-0.42, 0.33 * arch + 0.02), wx = sp[0] - 0.04 * s * f.dir, wy = y + drop;
    if (o.splash !== false) {
      for (const q of [[0.62, 0.17, 0.75], [0.36, 0.1, 0.9]]) {
        const el = A.ellipse(wx, wy, q[0] * s, q[1] * s, 0, 0, 6.2832), cut = A.ri(2, 4), part = Math.floor(el.length / cut);
        for (let c = 0; c < cut; c++) { const a = c * part + A.ri(1, 4), b = (c + 1) * part - A.ri(1, 5); if (b - a > 2) A.stroke(el.slice(a, b), 'chalk', c % 2 ? 'ice' : 'khadi', { w: 0.95 * k, p: q[2] * rr(0.75, 1) }); }
      }
      const nc = A.ri(7, 9);
      for (let i = 0; i < nc; i++) { const a = -Math.PI * (0.14 + 0.72 * (i + rr(0.2, 0.8)) / nc), l = rr(0.2, 0.42) * s * (0.7 + 0.5 * Math.sin(-a)); A.stroke([[wx + Math.cos(a) * 0.06 * s, wy + Math.sin(a) * 0.02 * s], [wx + Math.cos(a) * l * 0.55, wy + Math.sin(a) * l * 0.7 - 0.03 * s], [wx + Math.cos(a) * l * 0.8, wy + Math.sin(a) * l]], 'chalk', 'khadi', { w: 1.25 * k, p: 0.92, tin: 0.05, tout: 0.45 }); }
      const nd = A.ri(7, 11);
      for (let i = 0; i < nd; i++) { const t = A.rnd(), px = wx + (sp[0] - wx) * t + rr(-0.34, 0.34) * s * (1 - t * 0.5), py = wy + (sp[1] - wy) * t - rr(0.05, 0.3) * s; A.dot(px, py, 'chalk', A.chance(0.3) ? 'ice' : 'khadi', { w: rr(0.9, 1.9) * k, p: 0.95, len: rr(0.3, 1.1) * k, ang: 1.4 + rr(-0.3, 0.3) }); }
    }
    // fins behind, body, back, scales, head
    solid(A, f(tailP), fin, 1.8 * k); solid(A, f(dorsal), fin, 1.6 * k); solid(A, f(anal), fin, 1.4 * k);
    solid(A, f(bodyP), silver, 2.6 * k, { ang: f.rot - 0.5 * f.dir });
    const n = cl.length, top = [];
    for (let i = 2; i < n - 2; i++) { const a = cl[i - 1], b = cl[i + 1]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; if (ny > 0) { nx = -nx; ny = -ny; } const w = 0.07 * Math.sin(Math.PI * i / n); top.push([cl[i][0] + nx * w, cl[i][1] + ny * w]); }
    A.stroke(f(top), 'chalk', back, { w: 2.0 * k, p: 0.85, tin: 0.2, tout: 0.3 });
    A.stroke(f(top.map(p => [p[0] + 0.012, p[1] + 0.035])), 'shade', back, { w: 1.6 * k, p: 0.55 });
    for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) {
      const c = cl[Math.floor(n * (0.27 + i * 0.085 + r * 0.03))]; if (!c) continue;
      const oy = -0.045 + r * 0.045; A.stroke(f([[c[0] + 0.012, c[1] + oy - 0.022], [c[0] - 0.016, c[1] + oy], [c[0] + 0.012, c[1] + oy + 0.022]]), 'pencil', r === 0 ? 'ash' : 'slate', { w: 0.55 * k, p: 0.55 });
    }
    solid(A, f(pect), fin, 1.4 * k);
    for (const F of [tailP, dorsal]) { const a = F[0], b = F[1], c = F[F.length - 1]; for (let i = 1; i < 4; i++) { const t = i / 4; A.stroke(f([a, [b[0] + (c[0] - b[0]) * t, b[1] + (c[1] - b[1]) * t]]), 'pencil', 'lac', { w: 0.5 * k, p: 0.6 }); } }
    const g = cl[Math.floor(n * 0.2)];
    A.stroke(f(A.spline([[g[0] + 0.01, g[1] - 0.085], [g[0] - 0.035, g[1]], [g[0] + 0.0, g[1] + 0.08]], false, 0.02)), 'pencil', 'ash', { w: 0.65 * k, p: 0.65 });
    const e = cl[Math.floor(n * 0.085)];
    A.dot.apply(null, f.p(e[0], e[1] - 0.02).concat(['gold', 'gold', { w: 2.1 * k, p: 1 }]));
    A.dot.apply(null, f.p(e[0] + 0.004, e[1] - 0.02).concat(['kajal', 'kajal', { w: 0.95 * k, p: 1 }]));
    contour(A, f(bodyP), o.line || 'sepia', 0.65 * k, { p: 0.55 });
    return { splash: [wx, wy], head: f.p(0.43, -0.18) };
  };

  // ==========================================================================
  // SMALL BIRDS: far flocks as quick two-stroke marks
  //   where = a closed polygon (birds scattered inside) or, with o.along = true, a polyline they follow
  //   o.s wing half-span (2.5-6), o.c colour, o.ang general heading (default: up and to the right), o.spread
  // ==========================================================================
  M.smallBirds = function (A, where, n, o) {
    o = o || {};
    const rr = A.rr, c = o.c || 'kajal', s0 = o.s || 4, out = [];
    let pts = [];
    if (o.along) { const pl = A.resample(A.spline(where, false, 3), 2, false); for (let i = 0; i < n; i++) { const p = pl[Math.min(pl.length - 1, Math.floor((i + rr(0.1, 0.9)) / n * pl.length))], j = o.spread != null ? o.spread : s0 * 2.2; pts.push([p[0] + rr(-j, j), p[1] + rr(-j, j)]); } }
    else { const bb = A.bbox([where]); let guard = 0; while (pts.length < n && guard++ < n * 60) { const px = rr(bb[0], bb[2]), py = rr(bb[1], bb[3]); if (A.inside(where, px, py)) pts.push([px, py]); } }
    for (const p of pts) {
      const s = s0 * rr(0.7, 1.3), a = (o.ang != null ? o.ang : -0.3) + rr(-0.35, 0.35), ca = Math.cos(a), sa = Math.sin(a);
      const lift = rr(-0.1, 0.75), l2 = lift + rr(-0.25, 0.25);
      const R = (u, v) => [p[0] + u * ca - v * sa, p[1] + u * sa + v * ca];
      // wings: one stroke each, pressed at the body and flicked off
      A.stroke([R(0, 0), R(-0.25 * s, -s * 0.55 - lift * s * 0.25), R(-0.75 * s, -s * (0.75 + lift * 0.35))], 'kajal', c, { w: 1.0 * s / 4, p: 0.95, tin: 0, tout: 0.6, t0: 0.15, wob: 0.3 });
      A.stroke([R(0, 0), R(-0.2 * s, s * 0.5 + l2 * s * 0.2), R(-0.7 * s, s * (0.7 + l2 * 0.3))], 'kajal', c, { w: 0.95 * s / 4, p: 0.9, tin: 0, tout: 0.6, t0: 0.15, wob: 0.3 });
      A.stroke([R(-0.45 * s, 0), R(0.42 * s, 0)], 'kajal', c, { w: 1.5 * s / 4, p: 1, tin: 0.35, tout: 0.1, wob: 0.2 });
      out.push(p);
    }
    return out;
  };

  // ==========================================================================
  // DEER (blackbuck)        x,y = ground under the middle of the body, s = shoulder height (~60)
  //   o.pose 'stand' (head raised, listening) | 'leap',  o.kind 'buck' (dark, spiral horns) | 'doe' (fawn),  o.flip
  // ==========================================================================
  M.deer = function (A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, pose = o.pose || 'stand', leap = pose === 'leap', k = s / 60;
    const buck = (o.kind || (leap ? 'doe' : 'buck')) === 'buck';
    const lift = leap ? (o.lift != null ? o.lift : 0.4) : 0, tilt = leap ? (o.tilt != null ? o.tilt : -0.24) : 0;
    const f = frame(A, x, y - lift * s, s, { flip: o.flip }, tilt * (o.flip ? -1 : 1));
    const coat = o.c || (buck ? 'sepia' : A.mix('ochre', 'sand', 0.3)), deep = buck ? 'kajal' : 'umber', far = A.mix(coat, deep, buck ? 0.5 : 0.3), white = 'khadi';
    const body = A.spline(jit(A, [[-0.5, -1.0], [-0.1, -0.955], [0.3, -1.025], [0.53, -0.84], [0.42, -0.555], [0.05, -0.575], [-0.3, -0.665], [-0.6, -0.7], [-0.655, -0.9]], 0.008), true, 0.04);
    const neckC = A.spline(leap ? [[0.4, -0.88], [0.58, -1.05], [0.72, -1.2], [0.82, -1.3]] : [[0.4, -0.88], [0.535, -1.1], [0.59, -1.3], [0.655, -1.46]], false, 0.04);
    const neck = ribbon(neckC, [0.175, 0.115, 0.088, 0.08]);
    const hb = neckC[neckC.length - 1], hx = hb[0] - 0.655, hy = hb[1] + 1.46;
    const H = pts => pts.map(p => [p[0] + hx, p[1] + hy]);
    const head = A.spline(H([[0.6, -1.5], [0.7, -1.565], [0.84, -1.475], [0.965, -1.385], [0.945, -1.32], [0.8, -1.345], [0.66, -1.39]]), true, 0.025);
    const earN = A.spline(H([[0.645, -1.5], [0.6, -1.63], [0.5, -1.715], [0.545, -1.565]]), true, 0.03);
    const earF = A.spline(H([[0.675, -1.535], [0.685, -1.67], [0.635, -1.775], [0.625, -1.6]]), true, 0.03);
    let LG;
    if (leap) LG = { ff: [[0.3, -0.62], [0.56, -0.57], [0.74, -0.4], [0.8, -0.35]], nf: [[0.38, -0.64], [0.63, -0.5], [0.57, -0.3], [0.615, -0.235]], fh: [[-0.4, -0.7], [-0.7, -0.52], [-0.93, -0.33], [-1.0, -0.3]], nh: [[-0.48, -0.72], [-0.78, -0.58], [-1.03, -0.45], [-1.11, -0.43]] };
    else { const a = rr(-0.015, 0.015); LG = { ff: [[0.26, -0.64], [0.25 + a, -0.36], [0.232, -0.08], [0.24, 0]], nf: [[0.365, -0.66], [0.375, -0.36], [0.362 - a, -0.08], [0.37, 0]], fh: [[-0.36, -0.7], [-0.445, -0.42], [-0.372 + a, -0.1], [-0.37, 0]], nh: [[-0.46, -0.72], [-0.565, -0.42], [-0.5, -0.1], [-0.5, 0]] }; }
    const legP = (cl, hind) => ribbon(A.spline(cl, false, 0.04), hind ? [0.088, 0.042, 0.022, 0.018, 0.021] : [0.05, 0.03, 0.02, 0.017, 0.02]);
    const hoof = cl => { const a = cl[cl.length - 2], b = cl[cl.length - 1]; A.stroke(f([[b[0] + (a[0] - b[0]) * 0.35, b[1] + (a[1] - b[1]) * 0.35], b]), 'kajal', 'kajal', { w: 2.0 * k, p: 1, tin: 0, tout: 0 }); };
    // far legs, tail
    for (const q of ['ff', 'fh']) { solid(A, f(legP(LG[q], q === 'fh')), far, 2.4 * k, { ang: 1.3 }); hoof(LG[q]); }
    solid(A, f([[-0.6, -0.93], [-0.74, -0.82], [-0.7, -0.74], [-0.61, -0.84]]), white, 1.8 * k);
    // horns behind the head
    if (buck) {
      const horn = (bx, by, dx, len, sg) => {
        const P = [];
        for (let i = 0; i <= 14; i++) { const t = i / 14; P.push([bx + hx + dx * t + 0.034 * Math.sin(t * 14.5) * (1 - t * 0.35) * sg, by + hy - len * t, 1 - t * 0.3]); }
        A.stroke(f(P), A.tool('kajal', { wmin: 0.3 }), 'kajal', { w: 2.9 * k, p: 1, tin: 0, tout: 0.45, t0: 0.62 });
        for (let i = 1; i < 6; i++) { const q = P[i * 2]; A.stroke(f([[q[0] - 0.014, q[1] + 0.006], [q[0] + 0.014, q[1] - 0.006]]), 'pencil', 'grey', { w: 0.5 * k, p: 0.6 }); }
      };
      horn(0.7, -1.555, 0.07 + rr(-0.02, 0.02), 0.66, -1); horn(0.665, -1.55, -0.2 + rr(-0.02, 0.02), 0.68, 1);
    }
    solid(A, f(earF), far, 1.8 * k);
    // body, neck, head
    solid(A, f(body), coat, 3.6 * k, { ang: f.rot - 0.2 });
    solid(A, f(neck), coat, 3.0 * k, { ang: f.rot - 1.0 * f.dir });
    solid(A, f(head), coat, 2.4 * k);
    // near legs
    for (const q of ['nf', 'nh']) { solid(A, f(legP(LG[q], q === 'nh')), coat, 2.4 * k, { ang: 1.3 }); hoof(LG[q]); }
    // white underside, rump, throat, eye ring, chin
    solid(A, f(A.spline([[0.43, -0.625], [0.2, -0.635], [-0.15, -0.685], [-0.42, -0.735], [-0.33, -0.66], [0.04, -0.577], [0.4, -0.556]], true, 0.04)), white, 2.4 * k, { ang: f.rot });
    A.stroke(f(A.spline([[-0.6, -0.9], [-0.62, -0.8], [-0.56, -0.71]], false, 0.03)), 'chalk', white, { w: 2.6 * k, p: 0.9 });
    for (const q of ['nf', 'nh']) { const c = A.spline(LG[q], false, 0.04); A.stroke(f(c.slice(Math.floor(c.length * 0.12), Math.floor(c.length * 0.8)).map(p => [p[0] - 0.02, p[1]])), 'chalk', white, { w: 1.0 * k, p: 0.75 }); }
    A.stroke(f(neckC.slice(Math.floor(neckC.length * 0.45)).map(p => [p[0] + 0.045, p[1] + 0.03])), 'chalk', white, { w: 1.8 * k, p: 0.85, tin: 0.3 });
    A.stroke(f(H([[0.9, -1.335], [0.8, -1.355], [0.7, -1.39]])), 'chalk', white, { w: 1.3 * k, p: 0.85 });
    solid(A, f(earN), coat, 1.8 * k);
    A.stroke(f(H([[0.62, -1.54], [0.555, -1.655]])), 'chalk', buck ? 'gulabi' : 'cream', { w: 1.1 * k, p: 0.8 });
    // darker saddle and hatching along the back
    for (let i = 0; i < 9; i++) { const t = i / 8, px = -0.5 + t * 0.92, py = -0.94 - 0.03 * Math.sin(t * 3.1) + rr(-0.01, 0.01); A.stroke(f([[px, py], [px - 0.05, py + rr(0.1, 0.17)]]), 'shade', deep, { w: 1.6 * k, p: 0.5 }); }
    A.stroke(f(A.spline([[-0.5, -0.96], [-0.1, -0.945], [0.3, -0.995], [0.42, -0.93]], false, 0.04)), 'pencil', deep, { w: 0.9 * k, p: 0.5 });
    // eye, nose, mouth
    const e = H([[0.745, -1.47]])[0];
    A.dot.apply(null, f.p(e[0], e[1]).concat(['chalk', white, { w: 3.0 * k, p: 1 }]));
    A.dot.apply(null, f.p(e[0] + 0.004, e[1]).concat(['kajal', 'kajal', { w: 1.9 * k, p: 1 }]));
    A.dot.apply(null, f.p(0.955 + hx, -1.37 + hy).concat(['kajal', 'kajal', { w: 1.5 * k, p: 1 }]));
    A.stroke(f(H([[0.945, -1.335], [0.88, -1.345]])), 'kajal', 'kajal', { w: 0.6 * k, p: 0.7 });
    // closing line
    const lc = o.line || (buck ? 'kajal' : 'sepia');
    contour(A, f(body.slice(0, Math.floor(body.length * 0.5))), lc, 0.75 * k, { closed: false, p: 0.55 });
    contour(A, f(body.slice(Math.floor(body.length * 0.5))), lc, 0.75 * k, { closed: false, p: 0.6 });
    contour(A, f(head), lc, 0.7 * k, { p: 0.55 });
    contour(A, f(earN), lc, 0.6 * k, { p: 0.5, again: 0 });
    contour(A, f(neck.slice(0, neckC.length)), lc, 0.7 * k, { closed: false, p: 0.5 });
    contour(A, f(neck.slice(neckC.length)), lc, 0.7 * k, { closed: false, p: 0.5 });
    for (const q of ['nf', 'nh']) contour(A, f(legP(LG[q], q === 'nh')), lc, 0.6 * k, { p: 0.45, again: 0 });
    return { head: f.p(0.75 + hx, -1.45 + hy), top: f.p(0.66 + hx, -1.56 - (buck ? 0.68 : 0.2) + hy) };
  };
})();
