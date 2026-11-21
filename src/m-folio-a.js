(function () {
  'use strict';
  /* ==========================================================================
     FOLIO PAINTINGS, HAND A
       M.folioArt['shelf']            the weaver bird and its hanging nests over the pond
       M.folioArt['open-transcribe']  the parrot in the mango tree over a palm-leaf book on its stand
     Each is drawn inside the box b = {x0, y0, x1, y1, w, h} that stage-folios.js clips to.
     Five tools only: pastel (tip and side), chalk, kajal, gold, geru; finger rubbing; shade as pastel dust.
     ======================================================================== */
  M.folioArt = M.folioArt || {};
  const PI = Math.PI, TAU = PI * 2;

  // ------------------------------------------------------------ small helpers
  const lerp = (a, b, t) => a + (b - a) * t;
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
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
  function solid(A, pts, c, w, o) {
    o = o || {};
    A.fill(pts, o.tool || 'pastel', c, { w, passes: o.passes || 2, p: o.p || 1, reach: o.reach || 1.7, gap: o.gap || 0.42, ang: o.ang != null ? o.ang : A.rr(-1.2, 1.2), cv: o.cv != null ? o.cv : 0.014, len: o.len || 70, streak: o.streak != null ? o.streak : 0.2 });
  }
  function line(A, pts, c, w, o) {
    o = o || {}; const k = o.off != null ? o.off : 0.3, dx = A.rr(-k, k), dy = A.rr(-k, k);
    A.outline(pts.map(p => [p[0] + dx, p[1] + dy]), o.tool || 'kajal', c, { closed: !!o.closed, w, p: o.p != null ? o.p : 0.75, pull: o.pull || 40, again: o.again != null ? o.again : 0.15 });
  }
  const tf = (A, x, y, s, rot, flip) => { const t = { x, y, s, rot: rot || 0, flip: !!flip }; const f = pts => A.xf(pts, t); f.p = (u, v) => A.xf([[u, v]], t)[0]; f.t = t; return f; };
  // 1-D Catmull-Rom through values v at knots k
  function cr(k, v, t) {
    let i = 0; while (i < k.length - 2 && t > k[i + 1]) i++;
    const u = Math.max(0, Math.min(1, (t - k[i]) / (k[i + 1] - k[i])));
    const p0 = v[Math.max(0, i - 1)], p1 = v[i], p2 = v[i + 1], p3 = v[Math.min(v.length - 1, i + 2)];
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
  }
  // rub a field with the finger, but only well inside the box, so the paper beyond the clip is never dragged in
  function rub(A, b, poly, r, k, ang) {
    A.withMask(rect(b.x0 + r + 1, b.y0 + r + 1, b.x1 - r - 1, b.y1 - r - 1), () => A.blend(poly, { r, k, ang }));
  }

  // the side strips of a ground, where the big finger could not reach: more pastel, then smaller fingers
  function rubEdges(A, b, c, ang) {
    const strips = [rect(b.x0 - 2, b.y0, b.x0 + 12, b.y1), rect(b.x1 - 12, b.y0, b.x1 + 2, b.y1)];
    A.fill(strips, 'side', c, { w: 6, p: 0.9, reach: 1.6, passes: 2, ang: ang + 0.2, cv: 0.03 });
    for (const r of [3.5, 1.6]) { const i = r + 1; A.withMask(rect(b.x0 + i, b.y0 + i, b.x1 - i, b.y1 - i), () => A.blend(strips, { r, k: 0.45, ang })); }
  }

  // a spiral curl, the way a Mewar cloud ends: from outside in, r the outer radius
  function curl(A, cx, cy, r, dir, c, w) {
    const pts = [], turns = A.rr(1.0, 1.3), a0 = A.rr(0, TAU);
    for (let i = 0; i <= 36; i++) { const t = i / 36, a = a0 + dir * t * turns * TAU, q = r * (1 - 0.8 * t); pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q * 0.85, 1 - 0.45 * t]); }
    A.stroke(pts, 'chalk', c, { w, p: 0.85, tin: 0.05, tout: 0.4 });
  }

  // ------------------------------------------------------------ the strip of sky at the top
  // deep blue, paling to the foot, which is a rolled line of white cloud; long clouds float in it
  function skyStrip(A, b, h, o) {
    o = o || {};
    const x0 = b.x0 - 3, x1 = b.x1 + 3, y0 = b.y0 - 3;
    const foot = x => b.y0 + h + 1.8 * Math.sin(x / 11 + 0.6) + 1.2 * Math.sin(x / 27 + 2);
    const edge = []; for (let x = x1; x >= x0; x -= 3) edge.push([x, foot(x)]);
    const poly = [[x0, y0], [x1, y0]].concat(edge);
    A.fill(poly, 'side', 'neel', { w: 12, p: 1, reach: 1.55, passes: 2, ang: 0.04, cv: 0.02 });
    rub(A, b, poly, 5, 0.4, 0.02);
    const low = [[x0, b.y0 + h * 0.4], [x1, b.y0 + h * 0.36]].concat(edge);
    A.fill(low, 'side', A.mix('lapis', 'neel', 0.3), { w: 9, p: 0.8, reach: 1.25, passes: 1, ang: -0.02, cv: 0.03 });
    A.fill(low.map(p => [p[0], Math.max(p[1], b.y0 + h * 0.7)]), 'pastel', A.mix('lapis', 'sky', 0.3), { w: 4, p: 0.55, reach: 1.05, passes: 1, ang: 0.02 });
    // the rolled foot: one white line of little scallops
    let x = x0;
    while (x < x1) {
      const L = A.rr(4, 7.5), cxl = x + L / 2, r = L / 2, cy = foot(cxl) + 0.4;
      const lobe = A.ellipse(cxl, cy, r * 1.02, r * 0.62, 0, PI, TAU);
      A.fill(lobe, 'pastel', A.mix('khadi', 'sky', A.rr(0.15, 0.35)), { w: 1.3, p: 0.9, reach: 1.4, passes: 1, ang: 0 });
      A.stroke(lobe, 'chalk', 'khadi', { w: 0.6, p: 0.9, tin: 0.1, tout: 0.1 });
      if (r > 2.6) A.stroke(A.ellipse(cxl, cy, r * 0.5, r * 0.3, 0, PI * 1.1, PI * 1.9), 'chalk', A.mix('sky', 'lapis', 0.3), { w: 0.4, p: 0.7 });
      x += L * A.rr(0.82, 0.95);
    }
    A.stroke(edge.slice().reverse().map(p => [p[0], p[1] + 0.9]), 'chalk', A.mix('khadi', 'sky', 0.4), { w: 0.85, p: 0.6 });
    // o.ghost: the old long clouds pass by unseen, and others are laid in at the end instead
    for (const cl of o.clouds || []) { const d = () => cloud(A, cl[0], cl[1], cl[2], cl[3] || 1, cl[4]); if (o.ghost) A.withMask(GHOST, d, 0); else d(); }
    for (const q of o.birds || []) { const s = q[2] || 2.4; A.stroke([[q[0] - s, q[1] - s * 0.3], [q[0] - s * 0.3, q[1] - s * 0.5], [q[0], q[1]], [q[0] + s * 0.4, q[1] - s * 0.55], [q[0] + s * 1.1, q[1] - s * 0.2]], 'kajal', A.mix('kajal', 'neel', 0.3), { w: 0.5, p: 0.85 }); }
    return { foot, poly };
  }
  // a long low cloud: flat below, lobed above, with a pale streak trailing from one end and one curl at the other
  function cloud(A, x, y, w, dir, tall) {
    const rr = A.rr, n = Math.max(3, Math.round(w / 6.5)), lobes = [];
    tall = tall || 1;
    for (let i = 0; i < n; i++) { const t = (i + rr(0.3, 0.7)) / n, r = (1.8 + 2.8 * Math.pow(Math.sin(PI * t), 0.8)) * rr(0.8, 1.25) * tall; lobes.push([x + (t - 0.5) * w, y - r * 0.5, r]); }
    // the streak that trails off: a few pulls of white pastel thinning out
    const sx = x - dir * w * 0.5;
    for (let k = 0; k < 3; k++) A.stroke([[sx + dir * 4, y + 0.6 + k * 0.9, 1], [sx - dir * rr(10, 20), y + 0.4 + k * 1.1 + rr(-0.5, 0.5), 0.3]], 'pastel', A.mix('khadi', 'sky', 0.25 + k * 0.15), { w: 1.6 - k * 0.3, p: 0.75, tin: 0, tout: 0.7 });
    // body
    const body = [];
    for (const l of lobes) body.push(A.ellipse(l[0], l[1], l[2] * 1.08, l[2] * 0.82));
    for (const e of body) A.fill(e, 'pastel', A.mix('khadi', 'ice', rr(0.1, 0.4)), { w: 2.2, p: 0.95, reach: 1.5, passes: 2, ang: rr(-0.4, 0.4) });
    A.fill([[x - w / 2 + 1, y - 1], [x + w / 2 - 1, y - 1], [x + w / 2 - 2, y + 1.6], [x - w / 2 + 2, y + 1.6]], 'pastel', A.mix('khadi', 'ice', 0.45), { w: 1.8, p: 0.9, reach: 1.4, passes: 1, ang: 0 });
    // inside each lobe one or two arcs of pale blue, following its round
    for (const l of lobes) {
      for (let j = 0; j < (l[2] > 3.4 ? 2 : 1); j++) { const q = l[2] * (0.62 - j * 0.28); A.stroke(A.ellipse(l[0] + rr(-0.3, 0.3), l[1] + l[2] * 0.18, q, q * 0.78, 0, PI * 1.08, PI * 1.92), 'chalk', A.mix('sky', 'lapis', 0.25 + j * 0.2), { w: 0.55, p: 0.7, tin: 0.2, tout: 0.3 }); }
    }
    // the top edge, white, a little heavier than the body; the underside shaded
    for (const l of lobes) A.stroke(A.ellipse(l[0], l[1], l[2] * 1.08, l[2] * 0.82, 0, PI * 1.05, PI * 1.95), 'chalk', 'khadi', { w: 0.75, p: 0.95, tin: 0.1, tout: 0.1 });
    A.stroke([[x - w / 2 + 2, y + 1.5], [x + w / 2 - 2, y + 1.7]], 'shade', 'sky', { w: 1.6, p: 0.55 });
    const e = lobes[dir > 0 ? lobes.length - 1 : 0];
    curl(A, e[0] + dir * e[2] * 0.9, e[1] + e[2] * 0.15, e[2] * 0.75, dir, A.mix('khadi', 'ice', 0.2), 0.7);
  }

  // a mask that holds nothing: what is drawn inside it leaves no mark but takes its turns of the dice as before, so the
  // rest of the painting comes out the same
  const GHOST = [[[-999, -999], [-998, -999], [-998, -998]]];

  // the pixels inside poly that still show sky (blue, or the white of its rolled foot), one strip per pixel row: clouds
  // laid last through this slip in behind every leaf, twig and puff already over the sky
  function skyLeft(A, poly) {
    const bb = A.bbox([poly]), S = A.S, W = A.W, R = A.R, G = A.G, B = A.B, out = [];
    const px0 = Math.max(0, Math.floor(bb[0] * S)), px1 = Math.min(W, Math.ceil(bb[2] * S)), py0 = Math.max(0, Math.floor(bb[1] * S)), py1 = Math.min(A.H, Math.ceil(bb[3] * S));
    for (let y = py0; y < py1; y++) {
      let run = -1;
      for (let x = px0; x <= px1; x++) {
        const i = y * W + x, ok = x < px1 && ((B[i] > R[i] + 0.08 && B[i] > G[i] + 0.04) || (R[i] > 0.8 && G[i] > 0.8 && B[i] > 0.78));
        if (ok && run < 0) run = x;
        else if (!ok && run >= 0) { out.push([[run / S, y / S], [x / S, y / S], [x / S, (y + 1) / S], [run / S, (y + 1) / S]]); run = -1; }
      }
    }
    return out.length ? out : GHOST;
  }

  /* a small heaped cloud of the hot months: a level foot, round lobes piled on it, white where the light falls from the
     upper left, lapis in the turns between the lobes and along the foot.  x, y = the middle of its foot, w = its width;
     o.n = lobes along the foot, o.top = lobes piled above, o.lean moves the pile, o.maxR caps the piled lobes */
  function cumulus(A, x, y, w, o) {
    o = o || {};
    const rr = A.rr, n = o.n || Math.max(2, Math.round(w / rr(6.5, 8.5))), C = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), r = (w / (n + 1)) * rr(0.85, 1.12) * (0.82 + 0.3 * Math.sin(PI * t));
      C.push([x - w / 2 + r + t * (w - 2 * r) + rr(-0.4, 0.4), y - r * rr(0.5, 0.7), r]);
    }
    const nt = o.top != null ? o.top : (w > 18 ? 2 : 1);
    for (let j = 0; j < nt; j++) {
      const r = Math.min(o.maxR || 99, w * rr(0.18, 0.25)) * (j ? 0.74 : 1), cx = x + w * (o.lean || 0) + (j ? 1 : -1) * w * rr(0.04, 0.16);
      C.push([cx, y - r * rr(1.2, 1.4) - w * 0.03, r]);
    }
    // the outline of the heap: over each x the top of the highest lobe, below it the level foot, rounded at the ends
    const xa = Math.min(...C.map(c => c[0] - c[2])) + 0.05, xb = Math.max(...C.map(c => c[0] + c[2])) - 0.05, top = [], bot = [], own = [];
    for (let xx = xa; xx <= xb + 1e-6; xx += 0.35) {
      let tp = 1e9, bt = -1e9, k = -1;
      C.forEach((c, i) => { const dx = xx - c[0]; if (Math.abs(dx) < c[2]) { const h = Math.sqrt(c[2] * c[2] - dx * dx); if (c[1] - h < tp) { tp = c[1] - h; k = i; } bt = Math.max(bt, c[1] + h); } });
      if (k < 0) continue;
      top.push([xx, tp]); own.push(k); bot.push([xx, Math.min(y + 0.15 * Math.sin(xx * 0.7), bt)]);
    }
    const sil = top.concat(bot.slice().reverse());
    solid(A, sil, A.mix(A.mix('khadi', 'ice', 0.5), 'sky', rr(0.08, 0.16)), Math.max(1, w * 0.06), { ang: rr(-0.3, 0.3), p: 0.95 });
    const sh = A.mix('lapis', 'sky', rr(0.15, 0.3));
    A.withMask(sil, () => {
      // lapis along the foot, in the lower right of each lobe, and under the piled lobes where they sit on the row below
      A.stroke([[xa, y - 0.6], [x, y - 1], [xb, y - 0.5]], 'side', sh, { w: Math.max(1.8, w * 0.15), p: 0.85 });
      C.forEach((c, i) => {
        const a0 = i < n ? -0.5 : -0.2, a1 = i < n ? 1.6 : 1.5, arc = [];
        for (let s = 0; s <= 8; s++) { const a = lerp(a0, a1, s / 8); arc.push([c[0] + Math.cos(a) * c[2] * 0.82, c[1] + Math.sin(a) * c[2] * 0.82]); }
        A.stroke(arc, 'side', sh, { w: c[2] * 0.5, p: i < n ? 0.7 : 0.6, tin: 0.2, tout: 0.3 });
      });
      A.blend(sil, { r: 1.1, k: 0.3, ang: 0.2 });
    }, 0);
    // white where the light falls: along the top of each lobe from its left, and a small inner arc in the piled ones
    let s0 = 0;
    for (let i = 1; i <= top.length; i++) {
      if (i < top.length && own[i] === own[s0]) continue;
      const run = top.slice(s0, i);
      if (run.length > 3) A.stroke(run.slice(0, Math.max(3, Math.ceil(run.length * 0.75))), 'chalk', 'khadi', { w: Math.max(0.6, w * 0.032), p: 0.95, tin: 0.1, tout: 0.35 });
      s0 = i;
    }
    for (let i = n; i < C.length; i++) { const c = C[i], arc = []; for (let s = 0; s <= 6; s++) { const a = lerp(PI * 1.1, PI * 1.55, s / 6); arc.push([c[0] + Math.cos(a) * c[2] * 0.6, c[1] + Math.sin(a) * c[2] * 0.6]); } A.stroke(arc, 'chalk', A.mix('khadi', 'ice', 0.3), { w: 0.45, p: 0.7, tin: 0.2, tout: 0.3 }); }
    // a hair of lapis under the foot
    A.stroke(bot.filter((p, i) => i % 2 === 0).map(p => [p[0], p[1] + 0.25]), 'chalk', A.mix('lapis', 'neel', 0.3), { w: 0.4, p: 0.55, tin: 0.15, tout: 0.15 });
  }

  /* a long thin cloud of the Mewar sky drawn out across the blue: a row of small lobes along its top, a nearly level foot
     with a streak of blue along it, each end rolled up into a curl, white, with a thread of gold in each turn.
     x0..x1 = its length, y = its foot, th = its thickness; o.n = lobes, o.up = the lobes' height for th */
  function cloudBand(A, x0, x1, y, th, o) {
    o = o || {};
    const rr = A.rr, L = x1 - x0, fq = rr(1.1, 2.2), ph = rr(0, TAU), amp = rr(0.3, 0.7);
    const foot = xx => y + amp * Math.sin((xx - x0) / L * PI * fq + ph);
    const R1 = th * rr(1.15, 1.3), R2 = th * rr(0.9, 1.05);
    const c1 = [x0 + R1, foot(x0 + R1) - R1], c2 = [x1 - R2, foot(x1 - R2) - R2];
    const spiral = (c, R, turn, m, k0, s) => { const out = []; for (let i = 0; i <= m; i++) { const t = i / m, a = PI / 2 + s * (1 - t) * turn * TAU, r = R * (k0 + (1 - k0) * t); out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.9]); } return out; };
    const arc = (cx, cy, rx, ry, a0, a1, m) => { const out = []; for (let i = 0; i <= m; i++) { const a = lerp(a0, a1, i / m); out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return out; };
    // lobes along the top, from where one curl rises to where the other does, small and uneven
    const la = c1[0] + R1, lb = c2[0] - R2, n = o.n || Math.max(4, Math.round((lb - la) / rr(4.2, 5.8))), cuts = [0];
    for (let i = 1; i < n; i++) cuts.push((i + rr(-0.3, 0.3)) / n);
    cuts.push(1);
    const lobes = [];
    for (let i = 0; i < n; i++) {
      const u0 = lerp(la, lb, cuts[i]), u1 = lerp(la, lb, cuts[i + 1]), rx = (u1 - u0) / 2, cx = (u0 + u1) / 2;
      lobes.push([cx, foot(cx) - th * 0.95, rx, Math.min(rx * 0.9, th * (o.up || 1) * rr(0.45, 0.85))]);
    }
    // the body runs between the curls and takes in only their lower halves, so each curl stands open against the blue
    const sil = arc(c1[0], c1[1], R1, R1 * 0.9, PI / 2, 0, 6);
    for (const l of lobes) sil.push(...arc(l[0], l[1], l[2], l[3], PI, TAU, 8));
    sil.push(...arc(c2[0], c2[1], R2, R2 * 0.9, PI, PI / 2, 6));
    for (let xx = c2[0]; xx > c1[0]; xx -= 1.5) sil.push([xx, foot(xx)]);
    A.fill([sil], 'pastel', A.mix('khadi', 'sky', 0.22), { w: Math.max(1, th * 0.5), p: 0.85, passes: 2, ang: 0.05, reach: 1.3 });
    A.withMask([sil], () => {
      // the foot a shade cooler, and a broken streak of blue along the band under the lobes
      const along = (xa, xb, dy) => { const out = []; for (let xx = xa; xx <= xb; xx += 1.2) out.push([xx, foot(xx) + dy]); return out; };
      A.stroke(along(c1[0], c2[0], -th * 0.22), 'side', A.mix('sky', 'ice', 0.3), { w: th * 0.5, p: 0.4 });
      let xx = c1[0] + R1 * 0.7;
      while (xx < c2[0] - R2 * 0.5) { const e = Math.min(c2[0] - R2 * 0.3, xx + rr(8, 20)); if (e - xx > 2) A.stroke(along(xx, e, -th * 0.58 + rr(-0.15, 0.15)), 'chalk', A.mix('sky', 'lapis', 0.35), { w: 0.42, p: 0.75, tin: 0.15, tout: 0.2 }); xx = e + rr(2, 6); }
    }, 0);
    // the white line: out of the heart of the left curl, along the foot, up and round into the heart of the right one
    const ln = spiral(c1, R1, rr(1.5, 1.8), 34, 0.1, 1);
    for (let xx = c1[0] + 1.2; xx < c2[0]; xx += 1.2) ln.push([xx, foot(xx)]);
    ln.push(...spiral(c2, R2, rr(1.35, 1.6), 30, 0.12, -1).reverse());
    const w = o.w || 0.85;
    A.stroke(ln, 'chalk', 'khadi', { w, p: 0.96, tin: 0.06, tout: 0.08 });
    for (const l of lobes) {
      A.stroke(arc(l[0], l[1], l[2], l[3], PI * 1.03, PI * 1.97, 9), 'chalk', 'khadi', { w: w * 0.85, p: 0.95, tin: 0.12, tout: 0.12 });
      if (l[2] > 1.8 && A.chance(0.7)) A.stroke(arc(l[0], l[1] + l[3] * 0.3, l[2] * 0.5, l[3] * 0.45, PI * 1.15, PI * 1.85, 6), 'chalk', A.mix('sky', 'khadi', 0.35), { w: 0.4, p: 0.7, tin: 0.2, tout: 0.3 });
    }
    // gold winding in each curl, and a broken thread of it just inside the foot
    A.stroke(spiral(c1, R1 * 0.68, 1.1, 20, 0.2, 1), 'gold', 'gold', { w: 0.5, p: 0.95, tin: 0.15, tout: 0.25 });
    A.stroke(spiral(c2, R2 * 0.66, 1.0, 16, 0.22, -1), 'gold', 'gold', { w: 0.48, p: 0.95, tin: 0.15, tout: 0.25 });
    let gx = c1[0] + R1 * 0.8;
    while (gx < c2[0] - R2) { const e = Math.min(c2[0] - R2 * 0.5, gx + rr(6, 14)), seg = []; for (let q = gx; q <= e; q += 1.2) seg.push([q, foot(q) - 0.75]); if (seg.length > 1) A.stroke(seg, 'gold', 'gold', { w: 0.36, p: 0.85, tin: 0.2, tout: 0.3 }); gx = e + rr(3, 8); }
  }

  /* a cloud of the Mewar sky rolled up into scrolls: two or three round curls side by side on one low foot, each wound
     in white chalk to its heart, lapis laid in the turns, a broken hair of gold (or of kajal) along its crown and a line
     of neel under its foot; the tail end draws out into a thin streak that finishes in a little hook.
     x, y = the middle of its foot, s = its height; o.dir = the side the big curl leads on (+1 right), o.n = curls (2 or 3),
     o.edge = 'gold' or 'kajal' for the hair along the crown */
  function cloudScroll(A, x, y, s, o) {
    o = o || {};
    const rr = A.rr, dir = o.dir || 1, n = o.n || 2;
    const R = [s * rr(0.5, 0.58), s * rr(0.34, 0.43), s * rr(0.25, 0.32)].slice(0, n), C = [];
    let cx = x + dir * s * rr(0.25, 0.4);
    for (let i = 0; i < n; i++) {
      if (i) cx -= dir * (R[i - 1] * rr(0.7, 0.84) + R[i] * rr(0.62, 0.78));
      C.push([cx + rr(-0.2, 0.2), y - R[i] * rr(0.8, 0.94), R[i]]);
    }
    const foot = xx => y + 0.22 * Math.sin(xx * 0.55 + s);
    // the outline: over each x the top of the highest curl, below it the low foot
    const xa = Math.min(...C.map(c => c[0] - c[2])) + 0.05, xb = Math.max(...C.map(c => c[0] + c[2])) - 0.05, top = [], bot = [], own = [];
    for (let xx = xa; xx <= xb + 1e-6; xx += 0.3) {
      let tp = 1e9, k = -1;
      C.forEach((c, i) => { const dx = xx - c[0]; if (Math.abs(dx) < c[2]) { const h = Math.sqrt(c[2] * c[2] - dx * dx) * 0.92; if (c[1] - h < tp) { tp = c[1] - h; k = i; } } });
      if (k < 0) continue;
      top.push([xx, tp]); own.push(k); bot.push([xx, Math.max(tp + 0.6, foot(xx))]);
    }
    const sil = top.concat(bot.slice().reverse());
    solid(A, sil, A.mix(A.mix('khadi', 'ice', rr(0.3, 0.55)), 'sky', rr(0.06, 0.16)), Math.max(0.8, s * 0.12), { ang: rr(-0.3, 0.3), p: 0.95 });
    const sh = A.mix('lapis', o.cool ? 'neel' : 'sky', rr(0.12, 0.3));
    A.withMask(sil, () => {
      // lapis along the foot and down in the turn under each curl, rubbed once
      A.stroke([[xa, y - 0.5], [(xa + xb) / 2, y - 0.8], [xb, y - 0.45]], 'side', sh, { w: Math.max(1.4, s * 0.22), p: 0.8 });
      for (const c of C) { const arc = []; for (let k = 0; k <= 8; k++) { const a = lerp(-0.1, 1.9, k / 8) * (dir > 0 ? 1 : -1) + (dir > 0 ? 0 : PI); arc.push([c[0] + Math.cos(a) * c[2] * 0.8, c[1] + Math.sin(a) * c[2] * 0.8]); } A.stroke(arc, 'side', sh, { w: c[2] * 0.42, p: 0.6, tin: 0.2, tout: 0.3 }); }
      A.blend(sil, { r: 0.9, k: 0.3, ang: 0.2 });
    }, 0);
    // each curl wound in to its heart in a lapis line on the white, neighbours winding opposite ways; gold in the big one
    C.forEach((c, i) => {
      curl(A, c[0] + rr(-0.15, 0.15), c[1] + c[2] * 0.06, c[2] * rr(0.72, 0.82), i % 2 ? -dir : dir, A.mix('lapis', 'sky', rr(0.2, 0.42)), Math.max(0.42, c[2] * 0.12));
      if (!i) { const g = []; const a0 = rr(0, TAU); for (let k = 0; k <= 14; k++) { const t = k / 14, a = a0 + dir * t * 1.1 * TAU, q = c[2] * 0.42 * (1 - 0.7 * t); g.push([c[0] + Math.cos(a) * q, c[1] + c[2] * 0.06 + Math.sin(a) * q * 0.85]); } A.stroke(g, 'gold', 'gold', { w: 0.42, p: 0.9, tin: 0.15, tout: 0.3 }); }
    });
    // the crown: white along the top of each curl, then a broken hair of gold or kajal just above it
    let s0 = 0;
    for (let i = 1; i <= top.length; i++) {
      if (i < top.length && own[i] === own[s0]) continue;
      const run = top.slice(s0, i);
      if (run.length > 3) A.stroke(run, 'chalk', 'khadi', { w: Math.max(0.55, s * 0.07), p: 0.95, tin: 0.1, tout: 0.2 });
      s0 = i;
    }
    const edge = o.edge || 'gold';
    let j = Math.floor(rr(0, 4));
    while (j < top.length - 3) {
      const e = Math.min(top.length - 1, j + Math.floor(rr(6, 16))), seg = top.slice(j, e + 1).map(p => [p[0], p[1] - 0.35]);
      if (seg.length > 2) A.stroke(seg, edge === 'gold' ? 'gold' : 'kajal', edge === 'gold' ? 'gold' : A.mix('kajal', 'neel', 0.35), { w: edge === 'gold' ? 0.4 : 0.32, p: 0.85, tin: 0.2, tout: 0.25 });
      j = e + Math.floor(rr(2, 6));
    }
    // a line of neel under the foot, broken where the hand lifted
    let fx = xa + rr(0, 1);
    while (fx < xb - 1) { const e = Math.min(xb, fx + rr(3, 8)), seg = []; for (let q = fx; q <= e; q += 0.8) seg.push([q, foot(q) + 0.35]); if (seg.length > 1) A.stroke(seg, 'chalk', A.mix('neel', 'lapis', 0.3), { w: 0.42, p: 0.8, tin: 0.15, tout: 0.2 }); fx = e + rr(0.6, 2); }
    // the tail: a thin streak drawn out from the last curl along the foot, ending in a small hook
    const tl = C[C.length - 1], tx = tl[0] - dir * tl[2] * 0.6, L = s * rr(1.3, 2.2), hy = y - rr(0.2, 0.9);
    const tail = []; for (let k = 0; k <= 10; k++) { const t = k / 10; tail.push([tx - dir * L * t, lerp(y - 0.3, hy, t) + 0.25 * Math.sin(t * PI * 2 + s), 1 - 0.6 * t]); }
    A.stroke(tail, 'chalk', A.mix('khadi', 'sky', 0.2), { w: Math.max(0.5, s * 0.08), p: 0.85, tin: 0.05, tout: 0.35 });
    A.stroke(tail.slice(2).map(p => [p[0], p[1] + 0.55]), 'chalk', A.mix('sky', 'lapis', 0.3), { w: 0.35, p: 0.6, tin: 0.2, tout: 0.4 });
    const he = tail[tail.length - 1];
    curl(A, he[0] - dir * 0.6, he[1] - 0.5, rr(0.7, 1.0), -dir, 'khadi', 0.4);
  }

  // ------------------------------------------------------------ water in the Mewar way: rows of small white arcs
  function pond(A, b, top, o) {
    o = o || {};
    const x0 = b.x0 - 3, x1 = b.x1 + 3, y1 = b.y1 + 3;
    const edge = x => top + 1.2 * Math.sin(x / 13 + 1.1);
    const poly = []; for (let x = x0; x <= x1; x += 3) poly.push([x, edge(x)]); poly.push([x1, y1], [x0, y1]);
    A.fill(poly, 'side', A.mix('lapis', 'teal', 0.22), { w: 10, p: 1, reach: 1.5, passes: 2, ang: 0.03 });
    A.fill(poly.map(p => [p[0], Math.max(p[1], top + (y1 - top) * 0.45)]), 'side', A.mix('lapis', 'neel', 0.45), { w: 8, p: 0.6, reach: 1.1, passes: 1, ang: -0.03 });
    A.withMask(poly, () => {
      let row = 0;
      for (let y = top + 3.6; y < y1 + 2; y += 3.4, row++) {
        const sz = 2.2 + row * 0.22;
        for (let x = x0 + (row % 2 ? sz : 0) + A.rr(-1, 1); x < x1; x += sz * 2 * A.rr(0.92, 1.1)) {
          const pts = []; for (let i = 0; i <= 5; i++) { const a = PI + PI * i / 5; pts.push([x + Math.cos(a) * sz, y + Math.sin(a) * sz * 0.55]); }
          A.stroke(pts, 'chalk', A.mix('khadi', 'sky', A.rr(0.15, 0.55)), { w: 0.6, p: A.rr(0.5, 0.85), tin: 0.15, tout: 0.15, wob: 0.3 });
        }
      }
      // light lying on the water under the open sky
      A.stroke([[x0, top + 2.5], [x1, top + 2.2]], 'pastel', A.mix('sky', 'khadi', 0.3), { w: 2.2, p: 0.45, reach: 1 });
    });
    const bank = []; for (let x = x0; x <= x1; x += 3) bank.push([x, edge(x) - 0.3]);
    A.stroke(bank, 'chalk', 'khadi', { w: 0.95, p: 0.75 });
    return { edge, poly };
  }
  function lotusSmall(A, x, y, s, open) {
    const pet = (a, L, W, c) => {
      const tip = [x + Math.sin(a) * L, y - Math.cos(a) * L], m1 = [x + Math.sin(a - 0.35) * L * 0.55 + Math.cos(a) * W * 0.2, y - Math.cos(a - 0.35) * L * 0.55], m2 = [x + Math.sin(a + 0.35) * L * 0.55 - Math.cos(a) * W * 0.2, y - Math.cos(a + 0.35) * L * 0.55];
      const poly = A.spline([[x, y], m1, tip, m2], true, 0.6);
      solid(A, poly, c, 1.6, { ang: a + PI / 2 });
      A.stroke([[x, y], tip], 'chalk', 'gulabi', { w: 0.5, p: 0.6, tout: 0.5 });
      line(A, poly, 'lac', 0.45, { closed: true, p: 0.6, off: 0.15 });
    };
    A.stroke([[x, y], [x + A.rr(-1, 1), y + s * 1.6]], 'kajal', 'bottle', { w: 0.7, p: 0.8 });
    if (open) { for (const a of [-1.05, 1.05, -0.62, 0.62]) pet(a, s * 0.85, s * 0.5, A.mix('rose', 'gulabi', 0.4)); for (const a of [-0.3, 0.3, 0]) pet(a, s, s * 0.55, A.mix('rose', 'gulabi', A.rr(0, 0.7))); A.dot(x, y - s * 0.55, 'gold', 'gold', { w: 0.9 }); }
    else { pet(-0.18, s * 0.9, s * 0.4, 'rose'); pet(0.18, s * 0.85, s * 0.4, A.mix('rose', 'gulabi', 0.5)); pet(0, s, s * 0.45, 'rose'); }
  }
  function padSmall(A, x, y, r) {
    const n = 22, notch = A.rr(0, TAU), pts = [];
    for (let i = 0; i <= n; i++) { const a = notch + 0.25 + (TAU - 0.5) * i / n; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.42]); }
    pts.push([x, y]);
    solid(A, pts, A.mix('malachite', 'sap', A.rr(0.1, 0.6)), 2, { ang: 0.1 });
    for (let i = 0; i < 6; i++) { const a = notch + 0.6 + i * 0.95; A.stroke([[x, y], [x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.36]], 'chalk', A.mix('sap', 'cream', 0.5), { w: 0.45, p: 0.6, tout: 0.4 }); }
    A.stroke(A.ellipse(x, y, r * 0.95, r * 0.38, 0, 0.1, PI * 0.9), 'shade', 'bottle', { w: 1.2, p: 0.4 });
    line(A, pts, 'bottle', 0.5, { closed: true, p: 0.6, off: 0.15 });
  }
  // a tuft of grass on the bank, with a flower or two of chalk
  function tuft(A, x, y, h, flowers) {
    const n = A.ri(5, 9);
    for (let i = 0; i < n; i++) {
      const a = -PI / 2 + (i / (n - 1) - 0.5) * 1.5 + A.rr(-0.15, 0.15), L = h * A.rr(0.55, 1), bend = A.rr(-0.25, 0.25);
      A.stroke([[x + A.rr(-1.2, 1.2), y], [x + Math.cos(a + bend) * L * 0.5, y + Math.sin(a + bend) * L * 0.5], [x + Math.cos(a) * L, y + Math.sin(a) * L]], 'pastel', A.mix('sap', A.pick(['bottle', 'malachite', 'leaf']), A.rr(0.2, 0.7)), { w: 1.0, p: 0.95, tin: 0, tout: 0.75, reach: 1.4 });
    }
    for (const fl of flowers || []) {
      const fx = x + A.rr(-h * 0.35, h * 0.35), fy = y - h * A.rr(0.55, 0.95);
      A.stroke([[fx, fy], [x + A.rr(-1, 1), y]], 'kajal', 'bottle', { w: 0.45, p: 0.7 });
      for (let k = 0; k < 5; k++) { const a = k * 1.2566 + A.rr(-0.2, 0.2); A.dot(fx + Math.cos(a) * 1.1, fy + Math.sin(a) * 1.1, 'chalk', fl, { w: 1.2, p: 0.95 }); }
      A.dot(fx, fy, 'gold', 'gold', { w: 0.7 });
    }
  }

  function bush(A, x, y, w, h, fc, o) {
    o = o || {}; const rr = A.rr;
    const out = []; const n = 34;
    for (let i = 0; i <= n; i++) { const a = PI + PI * i / n, bump = 1 + 0.09 * Math.sin(i * 1.9 + rr(0, 0.5)); out.push([x + Math.cos(a) * w / 2 * bump, y + Math.sin(a) * h * bump]); }
    const mound = out.concat([[x + w / 2, y + 2], [x - w / 2, y + 2]]);
    solid(A, mound, A.mix('bottle', 'malachite', 0.25), 3, { ang: -0.6 });
    A.withMask(mound, () => {
      A.fill(A.ellipse(x - w * 0.12, y - h * 0.6, w * 0.3, h * 0.35), 'side', A.mix('malachite', 'sap', 0.4), { w: 5, p: 0.6, reach: 1.1, passes: 1, ang: -0.5 });
      for (let i = 0; i < w * h * 0.12; i++) {
        const px = x + rr(-0.5, 0.5) * w, py = y - rr(0, 1) * h, a = rr(-PI, 0) * 0.8 - 0.3, L = rr(2.2, 3.6);
        A.stroke([[px, py], [px + Math.cos(a) * L, py + Math.sin(a) * L]], 'pastel', A.pick(['malachite', 'sap', A.mix('sap', 'leaf', 0.5), 'bottle']), { w: 1.3, p: 0.95, reach: 1.4, tin: 0.1, tout: 0.6 });
      }
    }, 0);
    // scalloped edge in kajal, a lighter rim of leaf tips
    for (let i = 0; i < out.length - 1; i += 2) { const p = out[i], q = out[Math.min(out.length - 1, i + 2)], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], nx = (m[0] - x) / (w / 2), ny = (m[1] - y) / h; A.stroke([p, [m[0] + nx * 1.4, m[1] + ny * 1.4], q], 'kajal', 'bottle', { w: 0.45, p: 0.7 }); }
    const fl = A.scatter([mound.map(p => [p[0], p[1] + 1])], o.sp || 6.5, { jit: 0.45 });
    for (const p of fl) {
      const r = rr(1.1, 1.6), a0 = rr(0, TAU), c = A.pick(fc);
      for (let k = 0; k < 5; k++) { const a = a0 + k * 1.2566; A.dot(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r, 'chalk', c, { w: r * 0.95, p: 0.95, reach: 1.5 }); }
      A.dot(p[0], p[1], 'gold', 'gold', { w: 0.65 });
    }
  }

  /* ==========================================================================
     SHELF: the weaver bird and its hanging nests
     ======================================================================== */

  // a babul branch: tapering, knotted
  function branch(A, cl, w0, w1, o) {
    o = o || {};
    const sp = A.spline(cl, false, 2), n = sp.length, wid = [];
    for (let i = 0; i < 6; i++) wid.push(lerp(w0, w1, i / 5) * (1 + (i % 2 ? 0.1 : -0.06)));
    const poly = ribbon(sp, wid.map(v => v / 2));
    solid(A, poly, o.c || A.mix('umber', 'sepia', 0.35), Math.max(1.4, w0 * 0.45), { ang: Math.atan2(cl[cl.length - 1][1] - cl[0][1], cl[cl.length - 1][0] - cl[0][0]), passes: 2 });
    A.withMask(poly, () => {
      A.stroke(sp.map((p, i) => [p[0], p[1] - lerp(w0, w1, i / (n - 1)) * 0.25]), 'chalk', A.mix('umber', 'sand', 0.55), { w: Math.max(0.6, (w0 + w1) * 0.14), p: 0.65, tin: 0.1, tout: 0.3 });
      A.stroke(sp.map((p, i) => [p[0], p[1] + lerp(w0, w1, i / (n - 1)) * 0.3]), 'shade', 'kajal', { w: Math.max(0.6, (w0 + w1) * 0.16), p: 0.5 });
      for (let i = 3; i < n - 2; i += A.ri(3, 6)) { const p = sp[i], wd = lerp(w0, w1, i / (n - 1)); A.stroke([[p[0] - 1, p[1] - wd * 0.4], [p[0] + A.rr(-0.5, 1.5), p[1] + wd * 0.1], [p[0] + A.rr(0, 2), p[1] + wd * 0.4]], 'kajal', 'sepia', { w: 0.4, p: 0.6 }); }
    }, 0);
    line(A, poly, 'kajal', 0.55, { closed: true, p: 0.7, pull: 30 });
    return sp;
  }
  // the long white paired spines of the babul, spread in a V
  function thorns(A, x, y, ang, L) {
    for (const s of [-1, 1]) {
      const a = ang + s * A.rr(0.5, 0.9), l = L * A.rr(0.75, 1.15), e = [x + Math.cos(a) * l, y + Math.sin(a) * l];
      A.stroke([[x, y, 1], [e[0], e[1], 0.3]], 'chalk', A.mix('khadi', 'sand', A.rr(0, 0.3)), { w: 0.85, p: 0.95, tin: 0, tout: 0.7 });
      A.stroke([[x + 0.3, y + 0.35], [e[0] + 0.2, e[1] + 0.35]], 'kajal', 'sepia', { w: 0.3, p: 0.4, tout: 0.7 });
    }
  }
  // one bipinnate babul leaf: a stalk with feathery pinnae, hanging
  function babulLeaf(A, x, y, ang, L, c) {
    const ex = x + Math.cos(ang) * L, ey = y + Math.sin(ang) * L, bend = A.rr(-0.2, 0.2) * L;
    const sp = A.spline([[x, y], [(x + ex) / 2 - Math.sin(ang) * bend, (y + ey) / 2 + Math.cos(ang) * bend], [ex, ey]], false, 0.9);
    A.stroke(sp, 'kajal', A.mix('bottle', 'sepia', 0.4), { w: 0.35, p: 0.55 });
    for (let i = 2; i < sp.length - 1; i += 2) {
      const p = sp[i], q = sp[i + 1] || p, a = Math.atan2(q[1] - p[1], q[0] - p[0]), l = (2.3 - 1.1 * i / sp.length) * A.rr(0.8, 1.15);
      for (const s of [-1, 1]) {
        const aa = a + s * A.rr(1.0, 1.45);
        A.stroke([[p[0], p[1]], [p[0] + Math.cos(aa) * l, p[1] + Math.sin(aa) * l]], 'pastel', A.vary(c, 0.06), { w: 0.95, p: 0.95, reach: 1.4, tin: 0, tout: 0.4 });
      }
    }
  }
  function puff(A, x, y, r) {
    for (let k = 0, n = A.ri(15, 20); k < n; k++) { const a = k / n * TAU + A.rr(-0.15, 0.15), l = r * A.rr(0.75, 1.05); A.stroke([[x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2], [x + Math.cos(a) * l, y + Math.sin(a) * l]], 'chalk', A.chance(0.7) ? 'haldi' : 'peori', { w: 0.65, p: 0.95, tin: 0, tout: 0.3, reach: 1.4 }); }
    A.dot(x, y, 'pastel', 'saffron', { w: r * 0.65, p: 0.85 });
    for (let k = 0; k < 3; k++) A.dot(x + A.rr(-r, r) * 0.55, y + A.rr(-r, r) * 0.55, 'gold', 'gold', { w: 0.6, p: 0.9 });
  }

  /* ------------------------------------------------------------ the weavers' nests
     A nest is a solid of turning: at height t (0 at the knot on the branch, 1 at the mouth of the tube) its axis is at
     cx(t) and its half width is hw(t).  Every strip of grass is laid round that solid on a slant.  Its phase f says how
     far round it is: -PI/2 the left rim, 0 square to us, PI/2 the right rim.  Light comes from the upper left.          */
  function nestFrame(x, y, H, prof) {
    const K = prof.map(q => q[0]), DX = prof.map(q => q[1]), HW = prof.map(q => q[2]);
    return { x, y, H, cx: t => x + cr(K, DX, t), hw: t => Math.max(0.5, cr(K, HW, t)), Y: t => y + t * H };
  }
  // the path of one strip: from (t0, f0) on a slant a (radians from the vertical; its sign is the way it winds), going down
  // (dir 1) or up (dir -1) for len units, until it turns round behind the nest.  Each point carries how square it faces us.
  function stripPath(A, N, t0, f0, a, dir, len, tMin, tMax) {
    const pts = [], ds = 0.6, bend = A.rr(-0.022, 0.022);
    let t = t0, f = f0, s = 0, fs = 0, ca = Math.cos(a), sa = Math.sin(a);
    while (s <= len) {
      const w = N.hw(t); a += bend; ca = Math.cos(a); sa = Math.sin(a);
      pts.push([N.cx(t) + w * Math.sin(f), N.Y(t), 0.4 + 0.6 * Math.max(0, Math.cos(f))]); fs += f;
      t += dir * ds * ca / N.H; f += ds * sa / Math.max(1.2, w) + A.rr(-0.015, 0.015); s += ds;
      if (Math.abs(f) > PI / 2 + 0.05 || t < tMin || t > tMax) break;
    }
    pts.fm = fs / Math.max(1, pts.length);
    return pts;
  }
  // a strip of grass: the thin shadow it casts down and to the right, the strip, and on the lit side a hair of light
  function strip(A, pts, c, w, sh, hi) {
    if (pts.length < 3) return;
    if (sh) A.stroke(pts.map(p => [p[0] + 0.2 + w * 0.32, p[1] + 0.25 + w * 0.38, p[2]]), 'kajal', sh, { w: Math.max(0.28, w * 0.5), p: 0.55, tin: 0.2, tout: 0.25, wob: 0.35 });
    A.stroke(pts, 'chalk', c, { w, p: 0.95, reach: 1.35, tin: 0.12, tout: 0.2, wob: 0.35, cv: 0.03 });
    if (hi) A.stroke(pts.map(p => [p[0] - w * 0.22, p[1] - w * 0.22, p[2]]), 'chalk', hi, { w: Math.max(0.28, w * 0.32), p: 0.85, tin: 0.3, tout: 0.35, wob: 0.35 });
  }
  // the colour of a strip that lies at phase fm: lit on the left, in shadow on the right
  function stripColour(A, base, lite, dark, fm, t) {
    const l = 0.5 - 0.46 * Math.sin(fm) + 0.08 * (0.4 - t);
    return l > 0.56 ? A.mix(base, lite, Math.min(0.75, (l - 0.56) * 1.6)) : l < 0.44 ? A.mix(base, dark, Math.min(0.8, (0.44 - l) * 1.7)) : A.vary(base, 0.04);
  }

  /* a woven nest hanging from (x, y), H tall, prof = rows of [t, dx, half width].
     o.cols the strips' greens and straws, o.lite / o.dark their lit and shaded ends, o.deep the dark inside.
     o.open: no dark inside laid first, so the ground shows through the weave.  o.arch: the hood of a nest still being
     built, open below, its front rim cut in an arch (the rise as a fraction of the half width).  o.tube: where the
     entrance tube begins.  o.fray: how far the strips straggle past the mouth.  o.n: how many strips.               */
  function nest(A, x, y, H, prof, o) {
    o = o || {}; const rr = A.rr, N = nestFrame(x, y, H, prof), cx = N.cx, hw = N.hw, Y = N.Y;
    const tEnd = o.end != null ? o.end : 1, cols = o.cols, lite = o.lite, dark = o.dark, deep = o.deep;
    const neck = o.neck != null ? o.neck : 0.12, tube = o.tube != null ? o.tube : 2, fw = o.fw || 1;
    const sh = A.mix(dark, 'kajal', 0.45);
    const L = [], R = [];
    for (let t = 0; t <= tEnd + 1e-6; t += 0.01) { L.push([cx(t) - hw(t), Y(t)]); R.push([cx(t) + hw(t), Y(t)]); }
    const poly = L.concat(R.slice().reverse());
    let hole = null;
    if (o.arch) {
      const xl = cx(tEnd) - hw(tEnd), xr = cx(tEnd) + hw(tEnd), yb = Y(tEnd), rise = hw(tEnd) * o.arch;
      hole = []; for (let i = 0; i <= 24; i++) { const u = i / 24; hole.push([lerp(xl + 1.2, xr - 1.2, u), yb - Math.sin(PI * u) * rise]); }
      hole.push([xr - 1.2, yb + 3]); hole.push([xl + 1.2, yb + 3]);
    }
    if (!o.open) {
      // the dark of the inside, seen between the strips, deeper on the shaded side
      const inner = A.roughen(L.map(p => [p[0] + 0.7, p[1]]).concat(R.slice().reverse().map(p => [p[0] - 0.7, p[1]])), 0.4, 6, true);
      solid(A, inner, deep, 2, { ang: 1.45, passes: 2, p: 1, reach: 1.5 });
      A.withMask(inner, () => { for (let t = 0; t < tEnd; t += 0.02) { const c = cx(t), w = hw(t), yy = Y(t); A.stroke([[c + w * 0.15, yy], [c + w * 1.1, yy + H * 0.022]], 'shade', 'kajal', { w: Math.max(1, w * 0.75), p: 0.5 }); } }, 0);
      for (let i = 0, m = Math.round((o.n || H * 5) * (o.pack || 0)); i < m; i++) {
        const t0 = rr(0, tEnd), a = (A.chance(0.5) ? 1 : -1) * (t0 > tube ? rr(0.1, 0.5) : rr(0.3, 1.2)), pts = stripPath(A, N, t0, rr(-1.5, 1.5), a, A.chance(0.5) ? 1 : -1, rr(10, 24), -0.02, tEnd);
        if (pts.length < 3) continue;
        A.stroke(pts, 'chalk', stripColour(A, A.mix(A.pick(cols), dark, 0.45), A.mix(lite, dark, 0.5), deep, pts.fm, t0), { w: rr(0.6, 0.85) * fw, p: 0.9, reach: 1.2, tin: 0.15, tout: 0.2, wob: 0.35 });
      }
    } else {
      // an open weave: the far wall first, thin and dark, seen through the near one
      for (let i = 0, n = Math.round((o.n || H * 4) * 0.5); i < n; i++) {
        const t0 = rr(0, tEnd), a = (A.chance(0.5) ? 1 : -1) * rr(0.35, 1.2), pts = stripPath(A, N, t0, rr(-1.4, 1.4), a, A.chance(0.5) ? 1 : -1, rr(6, 16), 0, tEnd);
        if (pts.length < 3) continue;
        A.stroke(pts.map(p => [p[0], p[1], 0.6]), 'chalk', A.mix(A.pick(cols), deep, rr(0.45, 0.7)), { w: rr(0.45, 0.7) * fw, p: 0.8, reach: 1.1, tin: 0.2, tout: 0.2, wob: 0.4 });
      }
    }
    if (hole) {
      A.withMask(hole, () => {
        const top = Y(tEnd) - hw(tEnd) * o.arch, x0 = hole[0][0], x1 = hole[24][0];
        for (let i = 0; i < 70; i++) {
          const px = rr(x0, x1), py = rr(top - 1, Y(tEnd) + 1), a = rr(-0.9, 0.9) + (A.chance(0.5) ? 0 : PI / 2), l = rr(3, 7);
          A.stroke([[px - Math.cos(a) * l, py - Math.sin(a) * l], [px + rr(-0.5, 0.5), py + rr(-0.5, 0.5)], [px + Math.cos(a) * l, py + Math.sin(a) * l]], 'chalk', A.mix(A.pick(cols), deep, rr(0.4, 0.75)), { w: rr(0.5, 0.8), p: 0.85, reach: 1.1, tin: 0.2, tout: 0.2 });
        }
        for (let k = 0; k < 6; k++) A.stroke(A.spline(hole.slice(0, 25).map(p => [p[0], p[1] + 0.8 + k * 0.9]), false, 1), 'shade', 'kajal', { w: 2.4, p: 0.5 - k * 0.06 });
      }, 0);
      A.pushMaskOutside(hole);
    }
    // the strips: wound tight at the knot, on a slant over the chamber, steeper down the tube; light ones last
    const n = o.n || Math.round(H * 5), list = [];
    for (let i = 0; i < n + Math.round(n * (o.litShare || 0)); i++) {
      const litOne = i >= n;
      const inNeck = A.chance(o.neckShare != null ? o.neckShare : 0.2);
      const t0 = inNeck ? rr(-0.01, neck) : rr(0, tEnd);
      let a;
      if (t0 < neck) a = rr(1.05, 1.45);
      else if (t0 > tube) a = rr(0.08, 0.6);
      else a = rr(0.3, 1.1);
      for (const band of o.wraps || []) if (t0 > band[0] && t0 < band[1] && A.chance(0.6)) a = rr(1.1, 1.45);
      a *= A.chance(0.5) ? 1 : -1;
      const over = o.fray && t0 > tube ? rr(0, o.fray) : 0;
      const pts = stripPath(A, N, t0, litOne ? rr(-1.45, -0.15) : rr(-1.5, 1.5), a, A.chance(0.5) ? 1 : -1, rr(8, 24) * (o.lenK || 1), -0.02, tEnd + over);
      if (pts.length < 3) continue;
      const base = A.pick(cols), c = litOne ? A.mix(base, lite, rr(0.35, 0.7)) : stripColour(A, base, lite, dark, pts.fm, t0);
      const lum = 0.5 - 0.46 * Math.sin(pts.fm);
      list.push({ pts, c, lum, key: lum + rr(-0.25, 0.25), w: rr(0.75, 1.2) * fw * (t0 < neck ? 0.8 : t0 > tube ? 0.85 : 1) });
    }
    list.sort((p, q) => p.key - q.key);
    for (const s of list) strip(A, s.pts, s.c, s.w, sh, s.lum > 0.62 && A.chance(0.55) ? A.mix(lite, 'khadi', 0.35) : null);
    if (hole) {
      A.popMask();
      // the rim of the hood, bound with a few strips
      for (let k = 0; k < 4; k++) strip(A, A.spline(hole.slice(0, 25).map(p => [p[0] + rr(-0.4, 0.4), p[1] + rr(-0.5, 0.3)]), false, 0.7), A.mix(A.pick(cols), lite, rr(0, 0.4)), rr(0.6, 0.9) * fw, sh, null);
    }
    // the mouth: dark inside, strips straggling past it
    if (!o.arch && o.mouth !== false) {
      const t = tEnd, mx = cx(t), my = Y(t), w = hw(t);
      A.fill(A.ellipse(mx, my + 0.4, w * 0.8, Math.max(1.1, w * 0.3)), 'pastel', A.mix('kajal', 'umber', 0.25), { w: 1, p: 1, reach: 1.7 });
      for (let i = 0, m = o.frayN || 16; i < m; i++) {
        const u = rr(-1, 1), sx = mx + u * w * 0.95, sy = my + rr(-1.5, 0.8), Ls = rr(2, 8) * (o.frayL || 1), bend = rr(-2.5, 2.5) + u * 1.5;
        const pts = A.spline([[sx, sy], [sx + bend * 0.3, sy + Ls * 0.5], [sx + bend, sy + Ls]], false, 0.6);
        strip(A, pts, stripColour(A, A.pick(cols), lite, dark, u, 1), rr(0.5, 0.9) * fw, sh, null);
      }
    }
    // loose strips standing off the outline, more of them low on the chamber
    for (let i = 0, m = o.loose || 30; i < m; i++) {
      const t = rr(neck * 0.6, tEnd), sd = A.chance(0.5) ? 1 : -1, px = cx(t) + sd * hw(t), py = Y(t);
      const ang = (sd > 0 ? 0 : PI) + sd * rr(0.2, 1.1), Ls = rr(1.5, 5);
      const pts = [[px - sd * 0.8, py], [px + Math.cos(ang) * Ls * 0.5, py + Math.sin(ang) * Ls * 0.5 + rr(-0.4, 0.4)], [px + Math.cos(ang) * Ls, py + Math.sin(ang) * Ls + rr(0, 1)]];
      strip(A, pts, stripColour(A, A.pick(cols), lite, dark, sd * 1.2, t), rr(0.45, 0.75) * fw, null, null);
    }
    // a few long strips hanging free from the chamber and the mouth
    for (let i = 0; i < (o.hang || 0); i++) {
      const t = A.chance(0.5) ? tEnd : rr(0.45, 0.6), sx = cx(t) + rr(-0.8, 0.8) * hw(t), sy = Y(t), Ls = rr(6, 13), bend = rr(-4, 4);
      strip(A, A.spline([[sx, sy], [sx + bend * 0.2, sy + Ls * 0.4], [sx + bend * 0.7, sy + Ls * 0.8], [sx + bend, sy + Ls]], false, 0.6), A.mix(A.pick(cols), dark, 0.2), rr(0.5, 0.7) * fw, sh, null);
    }
    return { cx, hw, Y, poly, N };
  }
  // where a nest is tied on: strips wound round the branch, the ends sticking up out of the knot
  function nestTie(A, x, y, wB, ang, cols, lite, dark, n) {
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux, sh = A.mix(dark, 'kajal', 0.45);
    const P = (u, v) => [x + ux * u + nx * v, y + uy * u + ny * v];
    for (let i = 0; i < (n || 9); i++) {
      const a = A.rr(-1, 1) * wB * 0.75, sl = A.rr(-0.6, 0.6) * wB, h = wB * 0.5 + 0.5;
      const pts = A.spline([P(a - sl, h + 1.6), P(a - sl * 0.4, h * 0.3), P(a + sl * 0.3, -h * 0.5), P(a + sl, -h - 0.7)], false, 0.5);
      strip(A, pts, A.mix(A.pick(cols), A.rr() < 0.5 ? lite : dark, A.rr(0, 0.35)), A.rr(0.7, 1.05), sh, A.chance(0.4) ? A.mix(lite, 'khadi', 0.3) : null);
    }
    for (let i = 0; i < 4; i++) {
      const a = A.rr(-1, 1) * wB * 0.6, h = wB * 0.5, e = A.rr(2, 4.5), tilt = A.rr(-0.9, 0.9);
      strip(A, [P(a, -h + 0.5), P(a + tilt * e * 0.5, -h - e * 0.55), P(a + tilt * e, -h - e)], A.mix(A.pick(cols), lite, 0.25), A.rr(0.45, 0.65), null, null);
    }
  }
  // a twisted rope of strips along a path, each strip coming round the front and going behind again
  function rope(A, path, wd, cols, lite, dark, n) {
    const sp = A.resample(path, 0.5, false), m = sp.length, sh = A.mix(dark, 'kajal', 0.45);
    const nrm = sp.map((p, i) => { const a = sp[Math.max(0, i - 1)], b = sp[Math.min(m - 1, i + 1)]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; });
    A.stroke(sp, 'pastel', A.mix(dark, 'kajal', 0.2), { w: wd, p: 1, reach: 1.5, tin: 0.04, tout: 0.04, wob: 0.3 });
    for (let k = 0; k < n; k++) {
      const per = A.rr(7, 12), ph = A.rr(0, TAU), i0 = A.ri(0, Math.floor(m * 0.15)), i1 = Math.min(m - 1, i0 + A.ri(Math.floor(m * 0.7), m)), c0 = A.mix(A.pick(cols), lite, A.rr(0, 0.45));
      let seg = [];
      const flush = () => { if (seg.length > 2) strip(A, seg, c0, wd * A.rr(0.36, 0.5), sh, A.chance(0.35) ? A.mix(lite, 'khadi', 0.3) : null); seg = []; };
      for (let i = i0; i <= i1; i++) {
        const th = i * 0.5 / per * TAU + ph;
        if (Math.cos(th) < -0.05) { flush(); continue; }
        const v = Math.sin(th) * wd * 0.5;
        seg.push([sp[i][0] + nrm[i][0] * v, sp[i][1] + nrm[i][1] * v, 0.5 + 0.5 * Math.cos(th)]);
      }
      flush();
    }
  }

  /* ------------------------------------------------------------ the weaver
     A baya weaver, a male in his breeding dress.  Drawn in its own frame: s is the length from the tip of the beak to the
     tip of the tail, the head toward +x, the back toward -y; then turned by rot and flipped.
     o.pose 'perch' (wing folded) or 'fly' (wings spread).  o.head turns the head on the neck, toward the belly when +.
     o.legs: the way the legs reach, an angle on the sheet; o.grip: the angle on the sheet of what the toes hold, and
     o.gripC its colours, laid over the claws.  o.hold(A, bill) runs before the beak is drawn, so a blade it lays passes
     between the mandibles.                                                                                             */
  const WV = {
    body: [[0.25, -0.072], [0.12, -0.114], [-0.04, -0.118], [-0.17, -0.086], [-0.245, -0.03], [-0.235, 0.04], [-0.14, 0.108], [0.0, 0.148], [0.14, 0.142], [0.25, 0.1], [0.3, 0.03]],
    head: [[0.4, -0.05], [0.37, -0.096], [0.3, -0.113], [0.235, -0.096], [0.195, -0.04], [0.205, 0.04], [0.26, 0.086], [0.335, 0.093], [0.395, 0.072]],
    crown: [[0.405, -0.05], [0.375, -0.101], [0.3, -0.119], [0.23, -0.101], [0.186, -0.052], [0.14, -0.04], [0.19, -0.036], [0.25, -0.055], [0.318, -0.066], [0.376, -0.058]],
    upper: [[0.392, -0.057], [0.45, -0.041], [0.51, -0.011], [0.566, 0.03], [0.5, 0.026], [0.44, 0.021], [0.392, 0.022]],
    lower: [[0.392, 0.022], [0.46, 0.025], [0.561, 0.033], [0.5, 0.056], [0.44, 0.074], [0.389, 0.081]],
    eye: [0.345, -0.025]
  };
  const circ = (x, y, r, ry) => { const o = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; o.push([x + Math.cos(a) * r, y + Math.sin(a) * (ry || r)]); } return o; };
  // one feather in the bird's frame, base b to tip e, wd wide: a dark vane, pale chalk round the tip and down the side sd,
  // the shaft, and a kajal hair round it
  function feather(A, f, s, b, e, wd, c, edge, sd, lw) {
    const dx = e[0] - b[0], dy = e[1] - b[1], L = Math.hypot(dx, dy) || 1e-3, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, h = wd / 2;
    const P = (u, v) => [b[0] + ux * u * L + nx * v, b[1] + uy * u * L + ny * v];
    const vane = f(A.spline([P(0, -h * 0.8), P(0.5, -h), P(0.86, -h * 0.8), P(1, 0), P(0.86, h * 0.8), P(0.5, h), P(0, h * 0.8)], false, 0.008));
    const wb = f.p(b[0], b[1]), we = f.p(e[0], e[1]), ang = Math.atan2(we[1] - wb[1], we[0] - wb[0]);
    solid(A, vane, c, Math.max(0.6, wd * s * 0.5), { ang, passes: 2, p: 1, reach: 1.6, gap: 0.38 });
    if (edge) A.stroke(f(A.spline([P(0.4, sd * h * 0.74), P(0.8, sd * h * 0.76), P(0.96, sd * h * 0.4), P(0.99, 0), P(0.95, -sd * h * 0.45), P(0.8, -sd * h * 0.68)], false, 0.008)), 'chalk', edge, { w: Math.max(0.3, wd * s * 0.36), p: 0.95, reach: 1.45, tin: 0.25, tout: 0.3 });
    if (wd * s > 1.4) A.stroke(f([P(0.06, -sd * h * 0.12), P(0.78, -sd * h * 0.06)]), 'kajal', 'kajal', { w: 0.24, p: 0.38, tout: 0.5 });
    line(A, vane, 'kajal', lw, { p: 0.6, off: 0.04, pull: 10, again: 0.1 });
  }

  function weaver(A, x, y, s, rot, flip, o) {
    o = o || {};
    const f = tf(A, x, y, s, rot, flip), rr = A.rr, k = s / 40, lw = Math.max(0.28, Math.min(0.46, 0.34 * k));
    const fly = o.pose === 'fly', U = v => v * s;
    const ha = o.head || 0, ca = Math.cos(ha), sa = Math.sin(ha), PV = [0.22, -0.01];
    const hr = q => [PV[0] + (q[0] - PV[0]) * ca - (q[1] - PV[1]) * sa, PV[1] + (q[0] - PV[0]) * sa + (q[1] - PV[1]) * ca];
    const fh = pts => f(pts.map(hr)); fh.p = (u, v) => { const q = hr([u, v]); return f.p(q[0], q[1]); };
    const sp = (pts, closed) => A.spline(pts, !!closed, 0.008);
    // a direction on the sheet, in the bird's frame
    const loc = ang => { let lx = Math.cos(ang) * Math.cos(rot) + Math.sin(ang) * Math.sin(rot), ly = -Math.cos(ang) * Math.sin(rot) + Math.sin(ang) * Math.cos(rot); if (flip) lx = -lx; return [lx, ly]; };
    const C = {
      brown: A.mix('sepia', 'umber', 0.4), edge: A.mix('cream', 'khadi', 0.4), buff: A.mix('sand', 'cream', 0.5),
      back: A.mix('sand', 'ochre', 0.3), yellow: A.mix('peori', 'haldi', 0.45), lemon: A.mix('haldi', 'khadi', 0.4),
      mask: A.mix('sepia', 'kajal', 0.35), belly: A.mix('cream', 'khadi', 0.5), beak: A.mix('sand', 'khadi', 0.5),
      foot: A.mix('peach', 'rose', 0.55)
    };

    // ---- the far wing, when flying
    const spread = far => {
      const S0 = [0.13, -0.07], W = [0.045, -0.33], Hd = [-0.035, -0.45], turn = far ? 0.35 : 0, sc = far ? 0.8 : 1.06, my = far ? -1 : 1, oy = far ? 0.1 : 0;
      const R = q => { const dx = (q[0] - S0[0]) * sc, dy = (q[1] - S0[1]) * sc * my, c = Math.cos(turn), s2 = Math.sin(turn); return [S0[0] + dx * c - dy * s2 + (far ? 0.04 : 0), S0[1] + oy + dx * s2 + dy * c]; };
      const dirv = (a, l) => [Math.cos(a) * l * sc, Math.sin(a) * l * sc * my];
      const cF = far ? A.mix(C.brown, 'sand', 0.3) : C.brown, eF = far ? A.mix(C.edge, 'sand', 0.3) : C.edge;
      const feath = (b, a, l, wd, ed) => { const bb = R(b), d0 = dirv(a, l), c = Math.cos(turn), s2 = Math.sin(turn), d = [d0[0] * c - d0[1] * s2, d0[0] * s2 + d0[1] * c]; feather(A, f, s, bb, [bb[0] + d[0], bb[1] + d[1]], wd * sc, cF, ed, my, lw); };
      for (let j = 0; j < 6; j++) { const u = 0.08 + j * 0.16; feath([lerp(S0[0], W[0], u), lerp(S0[1], W[1], u)], -3.0 + u * 0.34, 0.22 + u * 0.04, 0.095, eF); }
      for (let i = 0; i < 8; i++) { const u = i / 7; feath([lerp(W[0], Hd[0], u), lerp(W[1], Hd[1], u)], lerp(-2.75, -1.58, u), lerp(0.25, 0.33, u), 0.08, eF); }
      // coverts over the roots of the flight feathers
      for (let i = 0; i < 5; i++) { const u = i / 4; feath([lerp(W[0], Hd[0], u * 0.8), lerp(W[1], Hd[1], u * 0.8)], lerp(-2.45, -1.95, u), 0.1, 0.06, eF); }
      for (let j = 0; j < 6; j++) { const u = 0.1 + j * 0.15; feath([lerp(S0[0], W[0], u) + 0.01, lerp(S0[1], W[1], u)], -2.9 + u * 0.3, 0.095, 0.065, eF); }
      // the leading edge, and small coverts along it
      const lead = f(sp([R(S0), R([0.1, -0.2]), R(W), R([0.0, -0.4]), R(Hd)].map(q => q.slice()), false));
      A.stroke(lead, 'pastel', cF, { w: U(0.05) * sc, p: 1, reach: 1.5, tin: 0.1, tout: 0.3 });
      for (let i = 0; i < 7; i++) { const u = i / 6, q = lerp2(S0, W, u * 0.95); const bb = R([q[0] - 0.012, q[1]]); feather(A, f, s, bb, [bb[0] - 0.045 * sc, bb[1] + 0.01], 0.04 * sc, cF, eF, 1, lw * 0.8); }
      A.stroke(lead, 'chalk', far ? eF : A.mix(C.edge, 'haldi', 0.3), { w: U(0.012), p: 0.8, tin: 0.2, tout: 0.4 });
    };
    const lerp2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];

    // ---- the legs: thigh T, reaching along the sheet angle o.legs; the toes curl round what they hold
    const legDir = loc(o.legs != null ? o.legs : PI / 2), gd = loc(o.grip != null ? o.grip : 0);
    const T = [[0.03, 0.115], [-0.07, 0.105]], LL = o.legLen || 0.14;
    const leg = (j, far) => {
      const F = [T[j][0] + legDir[0] * LL, T[j][1] + legDir[1] * LL], cF = far ? A.mix(C.foot, 'umber', 0.4) : C.foot;
      A.stroke(f([T[j], [lerp(T[j][0], F[0], 0.5) + 0.006, lerp(T[j][1], F[1], 0.5)], F]), 'pastel', cF, { w: U(0.03), p: 1, reach: 1.6, tin: 0, tout: 0.1 });
      const lgN = [-legDir[1] * 0.016, legDir[0] * 0.016];
      for (const sg of [1, -1]) A.stroke(f([[T[j][0] + 0.03 * legDir[0] + sg * lgN[0], T[j][1] + 0.03 * legDir[1] + sg * lgN[1]], [F[0] + sg * lgN[0], F[1] + sg * lgN[1]]]), 'kajal', A.mix('sepia', cF, 0.3), { w: 0.24, p: 0.6 });
      for (let q = 0.4; q < 0.95; q += 0.18) { const c0 = lerp2(T[j], F, q); A.stroke(f([[c0[0] - lgN[0] * 0.8, c0[1] - lgN[1] * 0.8], [c0[0] + lgN[0] * 0.8, c0[1] + lgN[1] * 0.8]]), 'kajal', A.mix('sepia', cF, 0.5), { w: 0.2, p: 0.45 }); }
      // toes: two forward and one back, along the hold, their tips curling round into it
      let d = [-legDir[1], legDir[0]]; if (d[0] < 0) d = [-d[0], -d[1]];
      const nn = legDir, toes = [[1, 0.12, 0.22], [1, 0.1, -0.3], [-1, 0.085, 0.05]];
      const tips = [];
      for (const q of toes) {
        const dd = [d[0] * Math.cos(q[2]) - d[1] * Math.sin(q[2]), d[0] * Math.sin(q[2]) + d[1] * Math.cos(q[2])];
        const m1 = [F[0] + dd[0] * q[0] * q[1] * 0.55, F[1] + dd[1] * q[0] * q[1] * 0.55], m2 = [F[0] + dd[0] * q[0] * q[1] + nn[0] * 0.012, F[1] + dd[1] * q[0] * q[1] + nn[1] * 0.012];
        const tip = [m2[0] - dd[0] * q[0] * 0.012 + nn[0] * 0.03, m2[1] - dd[1] * q[0] * 0.012 + nn[1] * 0.03];
        A.stroke(f([F, m1, m2]), 'pastel', cF, { w: U(0.026), p: 1, reach: 1.7, tin: 0, tout: 0.12 });
        A.stroke(f([F, m1]).map(p => [p[0] - 0.15, p[1] - 0.2]), 'chalk', A.mix(cF, 'khadi', 0.45), { w: Math.max(0.25, U(0.008)), p: 0.8, tout: 0.4 });
        A.stroke(f([[m2[0] - dd[0] * q[0] * 0.012, m2[1] - dd[1] * q[0] * 0.012], m2, tip]), 'kajal', A.mix('sepia', 'kajal', 0.3), { w: Math.max(0.35, U(0.015)), p: 1, tin: 0, tout: 0.7 });
        A.stroke(f([F, m1, m2]).map(p => [p[0] + 0.25, p[1] + 0.3]), 'kajal', A.mix('sepia', cF, 0.35), { w: 0.24, p: 0.6 });
        tips.push(m2);
      }
      for (let i = 0; i < 4; i++) { const p = lerp2(F, tips[i % 2], rr(0.3, 0.8)); A.dot.apply(null, f.p(p[0], p[1]).concat(['kajal', A.mix('sepia', cF, 0.5), { w: 0.3, p: 0.4 }])); }
      return { F, tips };
    };
    const gripOver = ft => {
      if (!o.gripC) return;
      for (const tp of ft.tips.slice(0, 2)) {
        {
          const c0 = [tp[0] + legDir[0] * 0.02, tp[1] + legDir[1] * 0.02], g = gd;
          const pts = f([[c0[0] - g[0] * 0.055, c0[1] - g[1] * 0.055], [c0[0] + rr(-0.004, 0.004), c0[1] + rr(-0.004, 0.004)], [c0[0] + g[0] * 0.055, c0[1] + g[1] * 0.055]]);
          strip(A, A.spline(pts, false, 0.4), A.pick(o.gripC), Math.max(0.6, U(0.024)), A.mix('sepia', 'kajal', 0.4), null);
        }
      }
    };

    // ---- drawing, back to front
    if (fly) spread(true);
    let farFoot = null;
    if (!fly) farFoot = leg(1, true);
    // the tail: short, square, each feather edged
    const tailF = fly ? [[-0.19, -0.03, -0.465, -0.075], [-0.19, -0.015, -0.49, -0.035], [-0.19, 0.0, -0.5, 0.008], [-0.19, 0.015, -0.49, 0.05], [-0.19, 0.03, -0.46, 0.09]]
                      : [[-0.17, -0.035, -0.478, -0.03], [-0.17, -0.012, -0.488, 0.0], [-0.17, 0.012, -0.482, 0.03], [-0.17, 0.03, -0.465, 0.055]];
    for (const q of tailF) feather(A, f, s, [q[0], q[1]], [q[2], q[3]], 0.075, C.brown, C.edge, 1, lw);
    // the body: buff, a yellow breast, a pale belly, streaked flanks and back
    const BODY = f(sp(WV.body, true));
    solid(A, BODY, C.buff, U(0.04), { ang: f.t.rot, passes: 2, p: 1, reach: 1.6 });
    A.withMask(BODY, () => {
      A.fill(f(sp([[0.34, -0.03], [0.28, 0.12], [0.12, 0.165], [-0.03, 0.155], [0.03, 0.07], [0.18, 0.0]], true)), 'pastel', C.yellow, { w: U(0.035), p: 1, passes: 2, reach: 1.6, ang: f.t.rot + 0.4 });
      A.fill(f(sp([[0.04, 0.17], [-0.13, 0.14], [-0.26, 0.06], [-0.2, 0.01], [-0.03, 0.08]], true)), 'pastel', C.belly, { w: U(0.035), p: 0.95, passes: 2, reach: 1.5, ang: f.t.rot });
      A.blend(BODY, { r: Math.max(0.8, U(0.025)), k: 0.32, ang: f.t.rot, len: U(0.3) });
      for (let i = 0; i < 8; i++) { const u = 0.14 - i * 0.045, v = 0.075 + rr(-0.008, 0.02) + Math.abs(u) * 0.08; A.stroke(f([[u, v], [u - 0.045, v + 0.012]]), 'chalk', A.mix('ochre', 'umber', 0.45), { w: U(0.011), p: 0.7, tin: 0.3, tout: 0.4 }); }
      // the back: dark centres to the feathers with buff and yellow edges
      for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) {
        const u = 0.22 - i * 0.05 - r * 0.02, v = -0.112 + r * 0.022 + Math.abs(u) * 0.04;
        A.stroke(f([[u, v], [u - 0.04, v + 0.012]]), 'pastel', C.brown, { w: U(0.02), p: 1, reach: 1.5, tin: 0.2, tout: 0.4 });
        A.stroke(f([[u - 0.005, v - 0.011], [u - 0.045, v + 0.0]]), 'chalk', r === 0 ? A.mix(C.edge, 'haldi', 0.4) : C.edge, { w: U(0.009), p: 0.85, tin: 0.3, tout: 0.4 });
      }
      // round: dust of shadow under the belly, a light along the breast
      A.stroke(f(sp([[0.24, 0.13], [0.06, 0.165], [-0.14, 0.12]], false)), 'shade', A.mix('umber', 'ochre', 0.3), { w: U(0.07), p: 0.5 });
      A.stroke(f(sp([[0.28, 0.04], [0.22, 0.08], [0.12, 0.1]], false)), 'chalk', A.mix(C.lemon, 'khadi', 0.3), { w: U(0.016), p: 0.6, tin: 0.3, tout: 0.4 });
    }, 0);
    // the wing: folded on the side, or spread up
    if (!fly) {
      const fe = (b, e, wd) => feather(A, f, s, b, e, wd, C.brown, C.edge, 1, lw);
      fe([0.0, 0.034], [-0.375, 0.026], 0.052); fe([0.0, 0.022], [-0.35, 0.012], 0.052); fe([0.0, 0.01], [-0.32, -0.001], 0.052); fe([0.0, -0.002], [-0.29, -0.012], 0.052);
      fe([0.1, 0.044], [-0.17, 0.056], 0.066); fe([0.1, 0.03], [-0.15, 0.042], 0.066); fe([0.1, 0.016], [-0.13, 0.028], 0.066);
      fe([0.08, -0.07], [-0.235, -0.025], 0.078); fe([0.08, -0.055], [-0.2, -0.004], 0.078); fe([0.08, -0.04], [-0.165, 0.016], 0.072);
      for (let i = 0; i < 6; i++) { const b = lerp2([0.2, -0.02], [-0.01, -0.034], i / 5); fe(b, [b[0] - 0.095, b[1] + 0.05], 0.056); }
      for (let i = 0; i < 5; i++) { const b = lerp2([0.21, -0.052], [0.05, -0.066], i / 4); fe(b, [b[0] - 0.07, b[1] + 0.034], 0.05); }
      for (let i = 0; i < 5; i++) { const b = lerp2([0.215, -0.074], [0.1, -0.086], i / 4); fe(b, [b[0] - 0.045, b[1] + 0.022], 0.04); }
    }
    line(A, f(sp(WV.body.slice(0, 10).concat([[0.285, 0.06]]), false)), 'kajal', lw * 1.1, { p: 0.65, off: 0.08, pull: 14, again: 0.1 });
    if (fly) {
      // feet drawn up under the belly
      A.stroke(f([[-0.02, 0.12], [-0.07, 0.165], [-0.1, 0.17]]), 'pastel', C.foot, { w: U(0.03), p: 1, reach: 1.6, tin: 0, tout: 0.2 });
      for (const a of [0.5, 1.1, 1.8]) { const q = [-0.1, 0.17]; A.stroke(f([q, [q[0] - Math.cos(a) * 0.03, q[1] + Math.sin(a) * 0.02]]), 'pastel', C.foot, { w: U(0.018), p: 1, reach: 1.5, tout: 0.4 }); }
      spread(false);
    }
    // ---- the head: a yellow crown and nape over a dark brown mask
    solid(A, f(circ(0.225, -0.005, 0.085, 0.095)), C.yellow, U(0.03), { ang: f.t.rot, p: 1, reach: 1.6 });
    const HEAD = fh(sp(WV.head, true)), CROWN = fh(sp(WV.crown, true));
    solid(A, HEAD, C.mask, U(0.03), { ang: f.t.rot + 0.5, passes: 2, p: 1, reach: 1.7 });
    A.withMask(HEAD, () => {
      for (let i = 0; i < 6; i++) { const v = -0.01 + i * 0.016, u = 0.3 - Math.abs(v) * 0.4; A.stroke(fh([[u, v], [u - 0.07, v + 0.012]]), 'chalk', A.mix('umber', 'sepia', 0.35), { w: U(0.01), p: 0.55, tin: 0.3, tout: 0.4 }); }
    }, 0);
    solid(A, CROWN, C.yellow, U(0.026), { ang: f.t.rot, passes: 2, p: 1, reach: 1.7 });
    A.withMask(CROWN, () => {
      A.stroke(fh(sp([[0.39, -0.078], [0.33, -0.106], [0.25, -0.098], [0.2, -0.065]], false)), 'chalk', C.lemon, { w: U(0.024), p: 0.9, reach: 1.4, tin: 0.2, tout: 0.3 });
      for (let i = 0; i < 4; i++) { const u = 0.36 - i * 0.045; A.stroke(fh([[u, -0.085 + Math.abs(u - 0.3) * 0.2], [u - 0.04, -0.075 + Math.abs(u - 0.3) * 0.3]]), 'chalk', A.mix('ochre', 'peori', 0.5), { w: U(0.008), p: 0.65, tin: 0.3, tout: 0.4 }); }
      A.stroke(fh([[0.355, -0.1], [0.3, -0.113], [0.26, -0.105]]), 'gold', 'gold', { w: Math.max(0.5, U(0.013)), p: 0.95 });
      A.stroke(fh(sp([[0.37, -0.05], [0.3, -0.06], [0.22, -0.045]], false)), 'shade', 'ochre', { w: U(0.03), p: 0.4 });
    }, 0);
    line(A, CROWN.slice(0, Math.floor(CROWN.length * 0.55)), 'kajal', lw, { p: 0.55, off: 0.05, pull: 12 });
    line(A, HEAD, 'kajal', lw, { closed: true, p: 0.7, off: 0.06, pull: 14 });
    // the eye: a pale lid, a warm brown iris, the pupil, and the glint
    const E = fh.p(WV.eye[0], WV.eye[1]), G = fh.p(WV.eye[0] + 0.008, WV.eye[1] - 0.01);
    A.dot(E[0], E[1], 'chalk', A.mix('umber', 'sand', 0.55), { w: Math.max(1, U(0.07)), p: 1, reach: 1.8 });
    A.dot(E[0], E[1], 'pastel', A.mix('umber', 'hingul', 0.35), { w: Math.max(0.8, U(0.054)), p: 1, reach: 1.9 });
    A.dot(E[0], E[1], 'kajal', 'kajal', { w: Math.max(0.55, U(0.033)), p: 1, reach: 1.9, opq: 1 });
    A.dot(E[0], E[1], 'kajal', 'kajal', { w: Math.max(0.5, U(0.03)), p: 1, reach: 1.9, opq: 1 });
    A.dot(G[0], G[1], 'chalk', 'khadi', { w: Math.max(0.42, U(0.019)), p: 1, reach: 2 });
    A.dot(G[0], G[1], 'chalk', 'khadi', { w: Math.max(0.36, U(0.015)), p: 1, reach: 2 });
    // what the bill holds, then the bill: a stout pale cone
    if (o.hold) o.hold(A, { tip: fh.p(0.562, 0.031), grip: fh.p(0.48, 0.024), back: fh.p(0.405, 0.024), f, fh });
    const UP = fh(sp(WV.upper, true)), LO = fh(sp(WV.lower, true));
    solid(A, LO, A.mix(C.beak, 'stone', 0.5), U(0.02), { ang: f.t.rot, p: 1, reach: 1.7 });
    solid(A, UP, C.beak, U(0.02), { ang: f.t.rot, p: 1, reach: 1.7 });
    A.withMask(UP.concat(LO), () => A.stroke(fh([[0.405, -0.02], [0.405, 0.06]]), 'shade', 'grey', { w: U(0.03), p: 0.5 }), 0);
    A.stroke(fh(sp([[0.405, -0.046], [0.46, -0.032], [0.53, 0.008]], false)), 'chalk', 'khadi', { w: Math.max(0.32, U(0.014)), p: 0.95, tout: 0.4 });
    line(A, UP, 'kajal', lw, { closed: true, p: 0.85, off: 0.02, pull: 9 });
    line(A, LO, 'kajal', lw, { closed: true, p: 0.85, off: 0.02, pull: 9 });
    A.stroke(fh(sp([[0.39, 0.032], [0.405, 0.022], [0.48, 0.025], [0.558, 0.031]], false)), 'kajal', 'kajal', { w: lw * 1.15, p: 0.95, tout: 0.3 });
    const NS = fh.p(0.42, -0.024); A.dot(NS[0], NS[1], 'kajal', A.mix('sepia', 'kajal', 0.5), { w: Math.max(0.3, U(0.01)), p: 0.8 });
    // the near leg, and what the toes hold laid over the claws
    let nearFoot = null;
    if (!fly) { nearFoot = leg(0, false); gripOver(nearFoot); gripOver(farFoot); }
    return { beak: fh.p(0.562, 0.031), feet: nearFoot ? [f.p(nearFoot.F[0], nearFoot.F[1]), f.p(farFoot.F[0], farFoot.F[1])] : [], f, fh };
  }

  /* a long blade of fresh grass: a tapering ribbon that turns over once, so its pale underside catches the light.
     o.turn: where along it the blade turns (0..1); o.gold: a glint of gold crayon where the light is brightest       */
  function strand(A, pts, w, o) {
    o = o || {};
    const sp = A.resample(A.spline(pts, false, 0.6), 0.45, false), n = sp.length, tu = o.turn != null ? o.turn : 0.45, span = o.span || 0.14;
    const th = u => { const q = Math.max(0, Math.min(1, (u - tu + span) / (2 * span))); return PI * q * q * (3 - 2 * q); };
    const top = o.top || A.mix('sap', 'leaf', 0.45), under = o.under || A.mix('leaf', 'cream', 0.55), dk = A.mix('bottle', 'sap', 0.35);
    const Lp = [], Rp = [], half = [], face = [];
    for (let i = 0; i < n; i++) {
      const a = sp[Math.max(0, i - 1)], b = sp[Math.min(n - 1, i + 1)], u = i / (n - 1);
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const c = Math.cos(th(u)), hh = w * 0.5 * (1 - 0.82 * Math.pow(u, 1.8)) * Math.max(0.1, Math.abs(c));
      Lp.push([sp[i][0] + nx * hh, sp[i][1] + ny * hh]); Rp.push([sp[i][0] - nx * hh, sp[i][1] - ny * hh]); half.push([nx, ny, hh]); face.push(c);
    }
    const cut = face.findIndex(c => c < 0), iT = cut < 0 ? n - 1 : cut;
    const piece = (i0, i1, col, under2) => {
      if (i1 - i0 < 2) return;
      const poly = Lp.slice(i0, i1 + 1).concat(Rp.slice(i0, i1 + 1).reverse());
      solid(A, poly, col, Math.max(0.5, w * 0.45), { ang: Math.atan2(sp[i1][1] - sp[i0][1], sp[i1][0] - sp[i0][0]), passes: 2, p: 1, reach: 1.6 });
      // which edge faces the light (upper left)
      let lit = 0; for (let i = i0; i <= i1; i++) lit += -half[i][0] - half[i][1];
      const sg = lit > 0 ? 1 : -1;
      const edge = [], vein = [], dark = [];
      for (let i = i0; i <= i1; i++) { const h = half[i]; edge.push([sp[i][0] + sg * h[0] * h[2] * 0.62, sp[i][1] + sg * h[1] * h[2] * 0.62]); vein.push([sp[i][0] - sg * h[0] * h[2] * 0.1, sp[i][1] - sg * h[1] * h[2] * 0.1]); dark.push([sp[i][0] - sg * h[0] * h[2] * 0.7, sp[i][1] - sg * h[1] * h[2] * 0.7]); }
      A.withMask(poly, () => {
        A.stroke(dark, 'chalk', A.mix(col, dk, 0.55), { w: Math.max(0.3, w * 0.24), p: 0.85, tin: 0.1, tout: 0.2 });
        A.stroke(edge, 'chalk', under2 ? A.mix('khadi', 'leaf', 0.18) : A.mix(col, 'cream', 0.55), { w: Math.max(0.3, w * (under2 ? 0.42 : 0.26)), p: 0.95, tin: 0.15, tout: 0.25, reach: 1.4 });
        A.stroke(vein, 'chalk', A.mix(col, under2 ? 'leaf' : 'cream', 0.3), { w: 0.25, p: 0.6, tin: 0.1, tout: 0.3 });
      }, 0);
      const j1 = Math.min(i1, Math.floor(n * 0.93));
      if (j1 - i0 > 2) { line(A, Lp.slice(i0, j1 + 1), 'kajal', 0.3, { p: 0.6, off: 0.05, pull: 16, again: 0.1 }); line(A, Rp.slice(i0, j1 + 1), 'kajal', 0.3, { p: 0.6, off: 0.05, pull: 16, again: 0.1 }); }
      return edge;
    };
    piece(0, iT, top, false);
    const lit = piece(Math.max(0, iT - 1), n - 1, under, true);
    if (o.gold && lit && lit.length > 8) { const a = Math.floor(lit.length * 0.12), b = Math.floor(lit.length * 0.4); A.stroke(lit.slice(a, b), 'gold', 'gold', { w: Math.max(0.4, w * 0.22), p: 0.9, tin: 0.3, tout: 0.4 }); }
    return sp;
  }
  function dragonfly(A, x, y, s, ang) {
    const f = tf(A, x, y, s, ang, false);
    for (const q of [[0.12, -1], [0.12, 1], [0.0, -1], [0.0, 1]]) {
      const base = f.p(q[0], 0), tip = f.p(q[0] - 0.05, q[1] * 0.62), w1 = f.p(q[0] + 0.07, q[1] * 0.35), w2 = f.p(q[0] - 0.1, q[1] * 0.3);
      const wing = A.spline([base, w1, tip, w2], true, 0.3);
      A.fill(wing, 'pastel', A.mix('ice', 'khadi', 0.5), { w: 0.9, p: 0.55, reach: 1.1, passes: 1, ang: ang + PI / 2 });
      line(A, wing, 'kajal', 0.25, { closed: true, p: 0.4, off: 0 });
    }
    A.stroke(f([[0.2, 0], [-0.6, 0]]), 'pastel', 'teal', { w: s * 0.07, p: 1, tout: 0.4 });
    A.stroke(f([[0.0, 0], [-0.55, 0]]), 'chalk', 'verdigris', { w: s * 0.03, p: 0.8 });
    A.dot.apply(null, f.p(0.22, 0).concat(['pastel', 'lapis', { w: s * 0.13 }]));
  }

  M.folioArt['shelf'] = function (A, b) {
    const X = u => b.x0 + u, Y = v => b.y0 + v, P = (u, v) => [b.x0 + u, b.y0 + v], rr = A.rr;
    // geru first lines, rubbed out but still showing in places
    A.stroke(A.spline([P(-4, 50), P(80, 44), P(170, 38), P(304, 20)], false, 2), 'geru', 'geru', { w: 1.2, p: 0.4 });
    // ---- the warm ground
    const g = rect(b.x0 - 3, b.y0 - 3, b.x1 + 3, b.y1 + 3);
    A.ground(g, A.mix('haldi', 'saffron', 0.32), { w: 22, ang: -0.55, c2: A.mix('haldi', 'peori', 0.4), top: 0.6, edge: 0, rub: 0 });
    rub(A, b, g, 8, 0.4, -0.5);
    rubEdges(A, b, A.mix(A.mix('haldi', 'saffron', 0.32), A.mix('haldi', 'peori', 0.4), 0.45), -0.5);
    // a warmer glow behind the hero nest
    A.fill(A.ellipse(X(158), Y(88), 74, 56), 'side', A.mix('saffron', 'haldi', 0.42), { w: 16, p: 0.42, reach: 1.05, passes: 1, ang: -0.4 });
    rub(A, b, A.ellipse(X(158), Y(88), 82, 60), 8, 0.35, -0.4);
    A.fill(g, 'chalk', 'peori', { w: 2.2, p: 0.22, passes: 1, gap: 3.2, ang: -0.5, cv: 0.03 });
    // ---- the sky with its long clouds and a line of far birds
    const sky = skyStrip(A, b, 24, { ghost: true, clouds: [[X(30), Y(12), 36, 1], [X(132), Y(9), 50, -1, 1.1], [X(236), Y(13), 40, 1], [X(292), Y(8), 18, -1, 0.8]], birds: [[X(84), Y(16), 2.2], [X(92), Y(13), 1.8], [X(99), Y(17), 1.6], [X(190), Y(6), 1.8]] });
    // ---- the pond at the foot
    pond(A, b, Y(146));
    padSmall(A, X(26), Y(158), 13); padSmall(A, X(94), Y(161), 10); padSmall(A, X(206), Y(159), 12); padSmall(A, X(270), Y(163), 9); padSmall(A, X(140), Y(165), 7);
    lotusSmall(A, X(48), Y(154), 9, true); lotusSmall(A, X(226), Y(155), 9, true); lotusSmall(A, X(116), Y(157), 7, false); lotusSmall(A, X(284), Y(156), 6, false);
    dragonfly(A, X(212), Y(127), 12, PI + 0.12);
    bush(A, X(20), Y(147), 50, 30, ['rose', 'khadi', 'gulabi']);
    bush(A, X(52), Y(147), 26, 15, ['khadi', 'haldi']);
    bush(A, X(286), Y(147), 40, 22, ['khadi', 'rose']);
    // the bank: tufts with small flowers, reeds at both ends
    for (let u = 60; u < 270; u += rr(9, 15)) if (u < 126 || u > 190) tuft(A, X(u), Y(146.5), rr(5, 9), A.chance(0.45) ? [A.pick(['khadi', 'rose', 'haldi', 'khadi'])] : []);
    for (const u of [44, 49, 266, 271]) {
      const top = P(u + rr(-4, 4), 112 + rr(-8, 10));
      A.stroke([P(u, 147), [lerp(X(u), top[0], 0.5) + rr(-1, 1), lerp(Y(147), top[1], 0.5)], top], 'pastel', A.mix('sap', 'bottle', 0.4), { w: 1.3, p: 0.95, tout: 0.6, reach: 1.4 });
      if (A.chance(0.6)) { const c = [top[0] + rr(-0.5, 0.5), top[1] + 9]; A.stroke([[c[0], c[1] - 4], [c[0], c[1] + 4]], 'pastel', 'umber', { w: 2.2, p: 1, tin: 0.2, tout: 0.2 }); }
    }

    // ---- the babul branch: leaves behind the nests first
    const main = [P(-6, 52), P(40, 45), P(92, 48), P(140, 41), P(196, 37), P(250, 31), P(306, 22)];
    const twigs = [[P(70, 47), P(86, 33), P(100, 27)], [P(118, 44), P(130, 56), P(124, 68)], [P(222, 34), P(236, 47), P(240, 58)], [P(268, 28), P(281, 16), P(296, 11)], [P(22, 48), P(17, 57), P(12, 66)], [P(170, 39), P(182, 28), P(198, 24)]];
    const leafC = ['bottle', A.mix('bottle', 'malachite', 0.5), 'malachite', A.mix('malachite', 'sap', 0.4)];
    const mainPts = A.spline(main, false, 5);
    for (let i = 0; i < 52; i++) {
      const src = A.chance(0.55) ? mainPts : A.pick(twigs), p = A.pick(src);
      babulLeaf(A, p[0] + rr(-2, 2), p[1] + rr(-1, 2), rr(0.5, 2.6) + (A.chance(0.28) ? -1.7 : 0), rr(10, 18), A.pick(leafC));
    }
    // ---- the nests.  Left: only the hood and its loop, a male still at work.  Right: last year's, gone to straw.
    //      Middle: the new home, still green.
    const fresh = { cols: [A.mix('leaf', 'sap', 0.3), A.mix('sap', 'leaf', 0.55), A.mix('leaf', 'cream', 0.22), A.mix('leaf', 'haldi', 0.25)], lite: A.mix('leaf', 'khadi', 0.55), dark: A.mix('sap', 'bottle', 0.55), deep: A.mix('bottle', 'umber', 0.4) };
    const green = { cols: [A.mix('sap', 'leaf', 0.45), A.mix('olive', 'sap', 0.5), A.mix('leaf', 'sand', 0.45), A.mix('sand', 'ochre', 0.3), A.mix('leaf', 'sap', 0.2)], lite: A.mix('leaf', 'cream', 0.6), dark: A.mix('bottle', 'umber', 0.35), deep: A.mix('moss', 'kajal', 0.5) };
    const straw = { cols: [A.mix('ochre', 'sand', 0.45), A.mix('sand', 'umber', 0.3), A.mix('ochre', 'umber', 0.35), A.mix('sand', 'cream', 0.3)], lite: A.mix('cream', 'sand', 0.35), dark: 'sepia', deep: A.mix('umber', 'kajal', 0.45) };
    const profH = [[0, 0, 1.6], [0.12, 0, 2.4], [0.3, 0.5, 8], [0.55, 1.5, 13.5], [0.8, 2, 16.5], [1, 2, 17.5]];
    const helm = nest(A, X(55), Y(45.5), 31, profH, Object.assign({ open: true, arch: 0.42, n: 190, neck: 0.14, neckShare: 0.25, loose: 22, lenK: 0.8, fw: 0.9 }, fresh));
    const prof3 = [[0, 0, 2], [0.12, 0, 3], [0.2, 1, 11], [0.34, 3, 17], [0.48, 3, 17], [0.58, 0, 11], [0.66, -2, 6.5], [0.85, -2, 6], [1, -1, 5.5]];
    nest(A, X(250), Y(31), 104, prof3, Object.assign({ n: 540, pack: 0.25, tube: 0.62, wraps: [[0.58, 0.68]], fray: 0.05, frayN: 14, loose: 36, hang: 4 }, straw));
    const prof2 = [[0, 0, 2.2], [0.08, 0, 3.4], [0.15, 3, 15], [0.26, 6, 25], [0.38, 8, 29], [0.5, 7, 27], [0.6, 2, 18], [0.66, -4, 9], [0.76, -5, 6.8], [0.9, -4, 6.4], [1, -2.5, 6.2]];
    const hero = nest(A, X(156), Y(40), 106, prof2, Object.assign({ n: 760, pack: 0.7, litShare: 0.16, neck: 0.1, tube: 0.65, wraps: [[0.61, 0.7]], fray: 0.05, frayN: 20, loose: 54, hang: 5, fw: 1.15 }, green));
    // ---- the branch over the stalks, its thorns and twigs, and the knots that tie the nests on
    branch(A, main, 7, 3);
    for (const t of twigs) branch(A, t, 2.6, 0.9);
    const sp = A.spline(main, false, 16);
    for (let i = 1; i < sp.length - 1; i++) if (A.chance(0.7)) { const a = Math.atan2(sp[i + 1][1] - sp[i - 1][1], sp[i + 1][0] - sp[i - 1][0]); thorns(A, sp[i][0] + rr(-2, 2), sp[i][1] + rr(0, 1.5), a + PI / 2 + rr(-0.3, 0.3) + (A.chance(0.35) ? PI : 0), rr(5, 8)); }
    for (const t of twigs) thorns(A, t[1][0], t[1][1], Math.atan2(t[2][1] - t[0][1], t[2][0] - t[0][0]) + rr(-0.4, 0.4), rr(3.5, 5));
    const onMain = u => { let best = mainPts[0]; for (const p of mainPts) if (Math.abs(p[0] - u) < Math.abs(best[0] - u)) best = p; return best; };
    { const q = onMain(X(55)); nestTie(A, q[0], q[1], 6.2, 0.05, fresh.cols, fresh.lite, fresh.dark, 8); }
    { const q = onMain(X(156)); nestTie(A, q[0], q[1], 5, -0.07, green.cols, green.lite, green.dark, 11); }
    { const q = onMain(X(250)); nestTie(A, q[0], q[1], 3.8, -0.16, straw.cols, straw.lite, straw.dark, 8); }
    // leaves in front of the branch, and the yellow puffs
    for (let i = 0; i < 22; i++) { const p = A.pick(mainPts); babulLeaf(A, p[0], p[1] + 1, rr(0.9, 2.3), rr(8, 13), A.pick(leafC)); }
    const puffs = [P(86, 31), P(101, 26), P(124, 67), P(30, 42), P(198, 23), P(240, 57), P(284, 13), P(297, 10), P(110, 44), P(13, 66), P(262, 24), P(182, 27), P(60, 40), P(212, 33)];
    for (const q of puffs) puff(A, q[0] + rr(-1, 1), q[1] + rr(-1, 1), rr(2.6, 3.7));

    // ---- the male at the helmet: on the loop under the hood, tugging a strip into the roof
    {
      const rimY = helm.Y(1), cxr = helm.cx(1), hwr = helm.hw(1);
      const loop = A.spline([[cxr - hwr + 2, rimY - 1], [cxr - hwr + 3, rimY + 9], [cxr - 7, rimY + 18], [cxr + 0.5, rimY + 21], [cxr + 8, rimY + 18], [cxr + hwr - 3, rimY + 9], [cxr + hwr - 2, rimY - 1]], false, 0.6);
      rope(A, loop, 2.6, fresh.cols, fresh.lite, fresh.dark, 18);
      const bot = [cxr + 0.5, rimY + 21 - 1.3];
      weaver(A, bot[0] - 4.2, bot[1] - 4.2, 31, -1.02, false, {
        head: 0.2, legs: PI / 2, grip: 0, gripC: fresh.cols,
        hold: (A2, bl) => strand(A2, [[bl.grip[0] - 3.5, bl.grip[1] + 6.5], [bl.grip[0] - 2, bl.grip[1] + 3], bl.grip, [bl.grip[0] + 1.6, bl.grip[1] - 4], [bl.grip[0] + 2.6, bl.grip[1] - 8], [bl.grip[0] + 2, bl.grip[1] - 12]], 1.1, { turn: 0.3, top: fresh.cols[1], under: A2.mix('sage', 'leaf', 0.35) })
      });
    }
    // ---- the flier, coming in with a long strip trailing from the bill
    weaver(A, X(98), Y(97), 31, -0.24, false, {
      pose: 'fly', head: -0.08,
      hold: (A2, bl) => { const gq = bl.grip; strand(A2, [[gq[0] + 1.6, gq[1] - 3.2], gq, [gq[0] - 1.5, gq[1] + 6], [gq[0] - 8, gq[1] + 12.5], [gq[0] - 18, gq[1] + 15], [gq[0] - 28, gq[1] + 13], [gq[0] - 37, gq[1] + 17]], 1.5, { turn: 0.5, gold: true, under: A2.mix('sage', 'leaf', 0.35) }); }
    });
    // ---- the hero: clinging to the flank of his new nest, pulling a long blade of grass through the weave
    weaver(A, X(201.5), Y(85), 48, 1.3, true, {
      head: 0.7, legs: PI + 0.08, grip: 0.3, gripC: green.cols,
      hold: (A2, bl) => {
        const gq = bl.grip;
        strand(A2, [[gq[0] - 9, gq[1] + 4], [gq[0] - 4.5, gq[1] + 1.8], gq, [gq[0] + 4, gq[1] - 5], [gq[0] + 9, gq[1] - 12], [gq[0] + 17, gq[1] - 16.5], [gq[0] + 25, gq[1] - 15], [gq[0] + 30.5, gq[1] - 7], [gq[0] + 32, gq[1] + 5], [gq[0] + 29.5, gq[1] + 17], [gq[0] + 30.5, gq[1] + 28]], 2.6, { turn: 0.42, span: 0.1, gold: true, under: A2.mix('sage', 'leaf', 0.35) });
        // where it goes into the weave, strips laid back over it
        for (let i = 0; i < 4; i++) { const cx0 = gq[0] - 8 + i * 1.4 + rr(-0.5, 0.5), cy0 = gq[1] + 3.5 - i * 0.5; strip(A2, A2.spline([[cx0 - 1.2, cy0 - 3.2], [cx0, cy0], [cx0 + 0.6, cy0 + 3.4]], false, 0.5), stripColour(A2, A2.pick(green.cols), green.lite, green.dark, 1.2, 0.3), rr(0.8, 1.1), A2.mix(green.dark, 'kajal', 0.45), null); }
      }
    });
    // a butterfly over the flowering bush
    { const bx = X(32), by = Y(110);
      for (const sgn of [-1, 1]) { const wpts = A.spline([[bx, by], [bx + sgn * 5, by - 5], [bx + sgn * 7, by - 1], [bx + sgn * 4, by + 2], [bx + sgn * 5, by + 5], [bx + sgn * 1.5, by + 3]], true, 0.4); solid(A, wpts, sgn < 0 ? 'saffron' : A.mix('saffron', 'peori', 0.5), 1, { ang: 0.3 }); A.dot(bx + sgn * 4.5, by - 2, 'chalk', 'khadi', { w: 1 }); line(A, wpts, 'kajal', 0.35, { closed: true, p: 0.7, off: 0.05 }); }
      A.stroke([[bx, by - 2.5], [bx, by + 4]], 'kajal', 'kajal', { w: 0.7, p: 0.9 });
      A.stroke([[bx, by - 2.5], [bx - 2, by - 6]], 'kajal', 'kajal', { w: 0.3, p: 0.7 }); A.stroke([[bx, by - 2.5], [bx + 2, by - 6]], 'kajal', 'kajal', { w: 0.3, p: 0.7 }); }
    // ---- small heaped clouds, laid last so they sit behind the twigs, leaves and puffs already over the sky
    A.withMask(sky.poly, () => {
      A.pushMask(skyLeft(A, sky.poly), 0);
      A.pushMaskOutside([[84, 16, 2.2], [92, 13, 1.8], [99, 17, 1.6], [190, 6, 1.8]].map(q => A.ellipse(X(q[0]), Y(q[1]) - q[2] * 0.3, q[2] * 1.8, q[2] * 1.2)), 0);
      // Mewar clouds, no two alike: a long scalloped band rolled up at both ends, a small scroll of two curls, a larger
      // one of three trailing its streak, and a second, thinner band
      cloudBand(A, X(7), X(45), Y(15.5), 2.5, { n: 6 });
      cloudScroll(A, X(64), Y(11.8), 7.2, { n: 2, dir: -1, edge: 'kajal' });
      cloudScroll(A, X(146), Y(16.4), 10.6, { n: 3, dir: 1, edge: 'gold', cool: true });
      cloudBand(A, X(197), X(233), Y(12), 2.1, { n: 5, up: 1.15 });
      A.popMask(); A.popMask();
    }, 0);
  };

  /* ==========================================================================
     OPEN-TRANSCRIBE: the parrot in the mango tree, over a palm-leaf book open on its low stand
     ======================================================================== */

  // one long mango leaf, from its base at (x, y) along ang; W is the half width
  function mangoLeaf(A, x, y, ang, L, W, c, o) {
    o = o || {};
    const bend = o.bend != null ? o.bend : A.rr(-0.3, 0.3);
    const ca = Math.cos(ang), sa = Math.sin(ang), nx = -sa, ny = ca;
    const at = (t, b) => [x + ca * L * t + nx * b * L, y + sa * L * t + ny * b * L];
    const cl = A.spline([at(0, 0), at(0.35, bend * 0.12), at(0.7, bend * 0.2), at(1, bend * 0.16)], false, 0.5);
    const poly = ribbon(cl, [0.2 * W, 0.85 * W, W, 0.85 * W, 0.45 * W, 0.04]);
    solid(A, poly, c, Math.max(0.7, W * 0.7), { ang: ang + 0.5, passes: 1, p: 0.95 });
    if (!o.norib) A.stroke(cl.slice(1, Math.floor(cl.length * 0.85)), 'chalk', o.rib || A.mix(c, 'leaf', 0.45), { w: 0.28, p: 0.55, tout: 0.4 });
    if (!o.noline) line(A, poly, 'kajal', 0.26, { closed: true, p: o.lp || 0.4, off: 0.06 });
    return cl[cl.length - 1];
  }
  // a whorl of leaves at the end of a twig, mostly hanging
  function whorl(A, x, y, dir, n, L, cols, o) {
    o = o || {};
    const spread = o.spread || 2.4;
    for (let i = 0; i < n; i++) {
      const a = dir + (n > 1 ? (i / (n - 1) - 0.5) : 0) * spread + A.rr(-0.2, 0.2);
      mangoLeaf(A, x + A.rr(-0.6, 0.6), y + A.rr(-0.6, 0.6), a, L * A.rr(0.75, 1.15), L * A.rr(0.12, 0.16), A.vary(A.pick(cols), 0.025), o);
    }
  }
  // a ripe mango, hanging from its stalk at the top
  function mango(A, x, y, s, ang, flip) {
    const f = tf(A, x, y, s, ang, flip);
    const poly = f(A.spline([[0, -0.5], [0.3, -0.43], [0.43, -0.13], [0.37, 0.22], [0.17, 0.47], [-0.03, 0.56], [-0.13, 0.45], [-0.33, 0.3], [-0.42, 0.0], [-0.34, -0.34]], true, 0.04));
    solid(A, poly, A.mix('haldi', 'peori', 0.35), Math.max(0.8, s * 0.14), { ang });
    A.withMask(poly, () => {
      A.fill(f(A.ellipse(0.24, -0.18, 0.3, 0.38)), 'side', A.mix('saffron', 'sindoor', 0.25), { w: Math.max(1, s * 0.25), p: 0.8, reach: 1.1, passes: 1, ang: ang + 1 });
      A.fill(f(A.ellipse(0.3, -0.3, 0.15, 0.2)), 'pastel', 'hingul', { w: Math.max(0.8, s * 0.12), p: 0.6, reach: 1.1, passes: 1 });
      A.stroke(f([[-0.2, -0.24], [-0.27, 0.02], [-0.18, 0.27]]), 'chalk', 'cream', { w: Math.max(0.5, s * 0.08), p: 0.85, tin: 0.2, tout: 0.4 });
      A.stroke(f([[0.36, 0.02], [0.27, 0.3], [0.08, 0.5]]), 'shade', 'ochre', { w: Math.max(0.8, s * 0.13), p: 0.5 });
    }, 0);
    line(A, poly, 'kajal', 0.34, { closed: true, p: 0.62, off: 0.1 });
    return f.p(0, -0.48);
  }
  // a hanging bunch: stalk from (x, y) on a twig, two or three fruits
  function mangoBunch(A, x, y, n, s) {
    const tips = [];
    for (let i = 0; i < n; i++) {
      const dx = (i - (n - 1) / 2) * s * 0.62 + A.rr(-1, 1), L = s * A.rr(0.9, 1.6) + (i % 2) * s * 0.5;
      const top = [x + dx, y + L];
      const st = mango(A, top[0], top[1] + s * 0.48, s * A.rr(0.92, 1.08), A.rr(-0.25, 0.25) + dx * 0.02, A.chance(0.5));
      A.stroke(A.spline([[x, y], [x + dx * 0.4 + A.rr(-0.6, 0.6), y + L * 0.5], st], false, 0.5), 'kajal', A.mix('umber', 'sap', 0.3), { w: 0.45, p: 0.85 });
      tips.push(top);
    }
    return tips;
  }

  // the rose-ringed parrot.  Local frame: feet at the origin on the perch, facing +x, unit = s.
  function parrot(A, x, y, s, rot, flip, o) {
    o = o || {};
    const f = tf(A, x, y, s, rot, flip);
    const ha = o.head || 0, ca = Math.cos(ha), sa = Math.sin(ha), PV = [0.06, -0.63];
    const hr = q => [PV[0] + (q[0] - PV[0]) * ca - (q[1] - PV[1]) * sa, PV[1] + (q[0] - PV[0]) * sa + (q[1] - PV[1]) * ca].concat(q.length > 2 ? [q[2]] : []);
    const fh = pts => f(pts.map(hr)); fh.p = (u, v) => { const q = hr([u, v]); return f.p(q[0], q[1]); };
    const G = A.mix('leaf', 'malachite', 0.42), GL = A.mix('leaf', 'haldi', 0.28);
    const k = s / 50;
    // ---- tail: two short green outer feathers, then the two long blue-green ones over them
    const tails = [
      [[-0.11, -0.06], [-0.28, 0.24], [-0.43, 0.56], 0.05, A.mix('leaf', 'malachite', 0.5)],
      [[-0.08, -0.03], [-0.2, 0.28], [-0.29, 0.62], 0.048, A.mix('leaf', 'malachite', 0.3)],
      [[-0.1, -0.04], [-0.3, 0.4], [-0.58, 0.92], 0.052, A.mix('teal', 'verdigris', 0.3)],
      [[-0.06, -0.02], [-0.22, 0.42], [-0.45, 0.97], 0.046, A.mix('teal', 'malachite', 0.35)]
    ];
    for (const t of tails) {
      const cl = A.spline(f([t[0], t[1], t[2]]), false, 0.6), w = t[3] * s;
      const poly = ribbon(cl, [w * 0.8, w, w * 0.95, w * 0.75, w * 0.45, 0.15]);
      solid(A, poly, t[4], Math.max(0.8, w * 0.5), { ang: Math.atan2(cl[cl.length - 1][1] - cl[0][1], cl[cl.length - 1][0] - cl[0][0]) });
      A.withMask(poly, () => {
        A.stroke(cl.slice(Math.floor(cl.length * 0.7)), 'pastel', A.mix('leaf', 'haldi', 0.35), { w: w * 1.6, p: 0.7, tin: 0.6, tout: 0 });
        A.stroke(cl.map(p => [p[0] - 0.5, p[1] + 0.2]), 'shade', 'bottle', { w: w * 0.8, p: 0.35 });
      }, 0);
      A.stroke(cl.slice(1, -2), 'chalk', A.mix('verdigris', 'khadi', 0.4), { w: 0.32, p: 0.7, tout: 0.4 });
      line(A, poly, 'kajal', 0.32, { closed: true, p: 0.6, off: 0.08 });
    }
    // ---- body
    const body = f(A.spline([[0.03, -0.66], [-0.07, -0.56], [-0.13, -0.38], [-0.15, -0.18], [-0.12, -0.02], [-0.03, 0.03], [0.07, -0.01], [0.14, -0.13], [0.185, -0.3], [0.19, -0.46], [0.16, -0.58], [0.1, -0.66]], true, 0.02));
    solid(A, body, G, 1.6 * k, { ang: f.t.rot + 1.3 });
    A.withMask(body, () => {
      for (const [du, pp] of [[0.0, 0.5], [0.025, 0.45], [0.05, 0.35]]) A.stroke(f([[0.16 + du, -0.56], [0.2 + du, -0.4], [0.17 + du, -0.2], [0.08 + du, -0.04]]), 'pastel', GL, { w: 3.2 * k, p: pp, reach: 1.1, tin: 0.3, tout: 0.4 });
      for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) {
        const u = 0.17 - c * 0.045 - (r % 2) * 0.022, v = -0.52 + r * 0.06;
        A.stroke(f(A.ellipse(u, v, 0.022, 0.016, 0, 0.2, PI - 0.2)), 'chalk', A.mix(GL, 'khadi', 0.15), { w: 0.4, p: 0.55, tin: 0.2, tout: 0.2 });
      }
      A.stroke(f([[-0.12, -0.5], [-0.16, -0.25], [-0.12, -0.02]]), 'shade', 'bottle', { w: 2.4 * k, p: 0.45 });
    }, 0);
    line(A, body, 'kajal', 0.45, { closed: true, p: 0.62, off: 0.15 });
    // the green thigh over the feet
    const thigh = f(A.ellipse(0.04, -0.05, 0.06, 0.045, -0.3));
    solid(A, thigh, A.mix(G, 'malachite', 0.3), 0.9 * k, { ang: 0.3 });
    line(A, thigh.slice(4, 30), 'kajal', 0.3, { p: 0.5, off: 0.05 });
    // ---- the folded wing: rows of small covert scales above, long dark flight feathers below
    const wing = f(A.spline([[0.05, -0.58], [0.11, -0.46], [0.1, -0.28], [0.03, -0.08], [-0.1, 0.12], [-0.27, 0.34], [-0.22, 0.14], [-0.19, -0.06], [-0.16, -0.3], [-0.1, -0.5], [-0.02, -0.6]], true, 0.02));
    solid(A, wing, A.mix('malachite', 'leaf', 0.35), 1.4 * k, { ang: f.t.rot + 2.1 });
    A.withMask(wing, () => {
      const prim = f([[0.12, -0.24], [0.06, -0.02], [-0.08, 0.2], [-0.3, 0.4], [-0.3, 0.1], [-0.22, -0.1], [-0.14, -0.26]]);
      A.fill(prim, 'pastel', A.mix('teal', 'bottle', 0.45), { w: 1.2 * k, p: 0.95, reach: 1.4, passes: 2, ang: f.t.rot + 2.2 });
      for (let i = 0; i < 6; i++) { const a = f.p(0.1 - i * 0.04, -0.2 + i * 0.008), e = f.p(-0.12 - i * 0.03, 0.3 - i * 0.07); A.stroke([a, e], 'chalk', A.mix('verdigris', 'leaf', 0.4), { w: 0.38, p: 0.75, tin: 0.2, tout: 0.4 }); }
      for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) {
        const u = 0.07 - c * 0.048 - (r % 2) * 0.024 - r * 0.012, v = -0.5 + r * 0.055 + c * 0.012;
        A.stroke(f(A.ellipse(u, v, 0.026, 0.02, -0.5, 0.15, PI - 0.15)), 'chalk', A.mix(GL, 'cream', 0.25), { w: 0.42, p: 0.7, tin: 0.15, tout: 0.15 });
      }
      A.stroke(f([[0.1, -0.5], [0.11, -0.3], [0.05, -0.12]]), 'chalk', GL, { w: 0.8 * k, p: 0.6 });
    }, 0);
    line(A, wing, 'kajal', 0.42, { closed: true, p: 0.65, off: 0.12 });
    // ---- head
    const head = fh(A.spline([[0.21, -0.71], [0.2, -0.79], [0.12, -0.845], [0.02, -0.83], [-0.04, -0.75], [-0.02, -0.66], [0.06, -0.62], [0.16, -0.64]], true, 0.02));
    solid(A, head, A.mix(G, 'leaf', 0.25), 1.2 * k, { ang: f.t.rot + 0.4 });
    A.withMask(head, () => {
      A.stroke(fh([[-0.04, -0.68], [-0.02, -0.77], [0.04, -0.83]]), 'pastel', A.mix('verdigris', 'sky', 0.35), { w: 2.2 * k, p: 0.7, tin: 0.3, tout: 0.4 });
      A.stroke(fh([[0.15, -0.67], [0.18, -0.72]]), 'pastel', GL, { w: 1.6 * k, p: 0.6 });
    }, 0);
    line(A, head, 'kajal', 0.42, { closed: true, p: 0.6, off: 0.12 });
    // the ring: a black stripe from the chin round the neck, rose behind it, fading up the nape
    A.stroke(fh([[0.15, -0.594, 0.9], [0.08, -0.574, 1], [0.0, -0.588, 0.9], [-0.045, -0.632, 0.7], [-0.052, -0.69, 0.4]]), 'pastel', A.mix('rose', 'gulabi', 0.3), { w: 0.026 * s, p: 0.95, tin: 0.1, tout: 0.5 });
    A.stroke(fh([[0.205, -0.645, 1], [0.17, -0.628, 1], [0.12, -0.61, 1], [0.06, -0.6, 0.9], [0.0, -0.61, 0.7], [-0.035, -0.64, 0.4]]), 'pastel', 'kajal', { w: 0.036 * s, p: 0.95, tin: 0.05, tout: 0.5 });
    A.stroke(fh([[0.12, -0.585], [0.03, -0.585]]), 'chalk', 'gulabi', { w: 0.35, p: 0.6 });
    // the eye, as the Mewar painters give a bird in profile: a long almond pointed at both ends, a small dark iris near the
    // front corner, a thin orange ring round the lids, and the kajal drawn on back toward the nape.  No glint.
    const ring = fh(A.spline([[0.058, -0.742], [0.084, -0.762], [0.114, -0.767], [0.139, -0.758], [0.154, -0.743], [0.134, -0.729], [0.104, -0.725], [0.076, -0.731]], true, 0.2));
    A.stroke(ring, 'chalk', A.mix('hingul', 'saffron', 0.35), { w: 0.55, p: 0.85, tin: 0.05, tout: 0.05 });
    const almond = fh(A.spline([[0.066, -0.742], [0.087, -0.756], [0.113, -0.76], [0.134, -0.753], [0.147, -0.743], [0.128, -0.735], [0.103, -0.732], [0.08, -0.736]], true, 0.2));
    A.fill([almond], 'chalk', A.mix('cream', 'haldi', 0.22), { w: 0.6, p: 1, passes: 2 });
    A.withMask(almond, () => {
      const ir = fh.p(0.123, -0.748);
      A.dot(ir[0], ir[1], 'chalk', A.mix('sepia', 'lac', 0.3), { w: 0.024 * s, p: 1 });
      A.dot(ir[0] + 0.002 * s, ir[1], 'kajal', 'kajal', { w: 0.014 * s, p: 1 });
    }, 0);
    const half0 = Math.ceil(almond.length * 0.52);
    A.stroke(almond.slice(0, half0), 'kajal', 'kajal', { w: 0.5, p: 0.92, tin: 0.12, tout: 0.15 });
    A.stroke(almond.slice(Math.floor(almond.length * 0.5)).concat([almond[0]]), 'kajal', 'kajal', { w: 0.32, p: 0.8, tin: 0.12, tout: 0.1 });
    A.stroke(fh([[0.068, -0.742], [0.048, -0.739], [0.026, -0.742]]), 'kajal', 'kajal', { w: 0.42, p: 0.88, tin: 0, tout: 0.8 });
    // ---- the beak, shut: a short coral hook curved down over the chin, the small dark lower half tucked in under it
    const lower = fh(A.spline([[0.192, -0.707], [0.228, -0.708], [0.242, -0.701], [0.243, -0.689], [0.231, -0.681], [0.21, -0.682], [0.195, -0.691]], true, 0.012));
    solid(A, lower, A.mix('lac', 'kajal', 0.4), 0.5 * k, { ang: 0.2 });
    line(A, lower, 'kajal', 0.3, { closed: true, p: 0.7, off: 0.04 });
    const upper = fh(A.spline([[0.176, -0.797], [0.21, -0.808], [0.24, -0.799], [0.261, -0.777], [0.273, -0.747], [0.276, -0.714], [0.268, -0.683], [0.2515, -0.654], [0.2475, -0.67], [0.246, -0.689], [0.236, -0.705], [0.21, -0.71], [0.188, -0.707]], true, 0.01));
    solid(A, upper, A.mix('hingul', 'peach', 0.2), 0.6 * k, { ang: f.t.rot + 0.6 });
    A.withMask(upper, () => {
      A.stroke(fh([[0.19, -0.79], [0.225, -0.795], [0.252, -0.778]]), 'chalk', A.mix('peach', 'cream', 0.3), { w: 0.5 * k, p: 0.8, tout: 0.4 });
      A.stroke(fh([[0.27, -0.74], [0.27, -0.705], [0.26, -0.678], [0.252, -0.662]]), 'pastel', A.mix('lac', 'hingul', 0.4), { w: 0.6 * k, p: 0.85, tout: 0.3 });
      A.stroke(fh([[0.2, -0.714], [0.238, -0.716]]), 'shade', 'lac', { w: 0.6 * k, p: 0.5 });
    }, 0);
    line(A, upper, 'kajal', 0.34, { closed: true, p: 0.75, off: 0.05 });
    A.stroke(fh([[0.176, -0.797], [0.172, -0.75], [0.188, -0.707]]), 'chalk', A.mix('peach', 'sand', 0.3), { w: 0.45, p: 0.7 });
    // ---- feet: grey-pink, two toes over the perch and two behind
    const FC = A.mix('ash', 'rose', 0.45);
    for (const q of [[0.05, -0.02, 1], [0.0, -0.02, -1]]) {
      const a = f.p(q[0], q[1]), t1 = [a, f.p(q[0] + 0.05 * q[2], 0.0), f.p(q[0] + 0.07 * q[2], 0.035)];
      A.stroke(t1, 'pastel', FC, { w: 0.022 * s, p: 0.95, tout: 0.3 });
      A.stroke([a, f.p(q[0] + 0.02 * q[2], 0.01), f.p(q[0] + 0.025 * q[2], 0.045)], 'pastel', FC, { w: 0.02 * s, p: 0.95, tout: 0.3 });
      line(A, t1, 'kajal', 0.25, { p: 0.5, off: 0.05 });
    }
    return { beak: fh.p(0.262, -0.68), f, fh };
  }

  // a rounded rectangle, centred, w x h, corner r
  function rrect(w, h, r) {
    const out = [], x0 = -w / 2, y0 = -h / 2, x1 = w / 2, y1 = h / 2;
    const arc = (cx, cy, a0) => { for (let i = 0; i <= 5; i++) { const a = a0 + i / 5 * PI / 2; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    arc(x1 - r, y1 - r, 0); arc(x0 + r, y1 - r, PI / 2); arc(x0 + r, y0 + r, PI); arc(x1 - r, y0 + r, PI * 1.5);
    return out;
  }
  /* a line of writing that is no writing: words hung from a head-line, each sign under it only a fine stroke, so that
     no shape in it can be read as a letter; set first in a sepia hair, then gone over in gold a hair off.
     f = the leaf's frame; the line runs xa..xb with its head-line at y; z = a sign's width; gaps = [[x0, x1], ...] */
  function scriptLine(A, f, xa, xb, y, z, gaps) {
    const rr = A.rr, d = z * 1.35, ink = A.mix('sepia', 'lac', 0.3), words = [];
    let x = xa + rr(0, 1);
    while (x < xb - z * 1.5) {
      const n = A.ri(2, 5), xe = Math.min(xb, x + n * z * rr(0.9, 1.1));
      const g = (gaps || []).find(q => xe > q[0] - 0.4 && x < q[1] + 0.4);
      if (g) { x = g[1] + rr(0.6, 1.4); continue; }
      const yy = y + rr(-0.12, 0.12), st = [[[x - 0.1, yy], [xe + 0.1, yy + rr(-0.08, 0.08)]]], m = Math.max(1, Math.round((xe - x) / z));
      for (let k = 0; k < m; k++) {
        const sx = x + (k + 0.5) * (xe - x) / m + rr(-0.1, 0.1), dd = d * rr(0.8, 1.15), kind = A.ri(0, 6);
        // only a fine stroke hung from the head-line, longer or shorter: the texture of a written row, no sign in it a letter
        st.push([[sx, yy], [sx + 0.04 * z * (kind - 3), yy + dd * (0.5 + 0.07 * kind)]]);
        A.chance(0.13);
      }
      words.push(st);
      x = xe + z * rr(0.8, 1.35);
    }
    for (const st of words) for (const s of st) A.stroke(f(s.map(q => [q[0] + 0.1, q[1] + 0.12])), 'chalk', ink, { w: 0.45, p: 0.42, tin: 0.1, tout: 0.15 });
    for (const st of words) for (const s of st) A.stroke(f(s), 'gold', 'gold', { w: 0.4, p: 0.95, tin: 0.1, tout: 0.15 });
  }
  // the face of one palm leaf in frame f: the cream leaf and its fibres, ruled margins at the ends, rows of gold writing
  // with a space left round each of the two string holes.  o.lastShort ends the last row early, o.z sets the hand's size
  function leafFace(A, f, L, H, rows, o) {
    o = o || {};
    const rr = A.rr, leaf = f(rrect(L, H, Math.min(2.4, H * 0.28))), holes = [-L * 0.24, L * 0.24];
    solid(A, leaf, o.c || A.mix('cream', 'sand', 0.42), 1.4, { ang: f.t.rot });
    A.withMask(leaf, () => {
      for (let y = -H / 2 + 1; y < H / 2; y += rr(0.9, 1.5)) A.stroke(f([[-L / 2, y + rr(-0.2, 0.2)], [L / 2, y + rr(-0.2, 0.2)]]), 'chalk', A.chance(0.5) ? A.mix('sand', 'ochre', 0.35) : A.mix('cream', 'khadi', 0.4), { w: 0.3, p: rr(0.25, 0.5) });
      A.stroke(f([[-L / 2, -H / 2 + 0.8], [L / 2, -H / 2 + 0.7]]), 'chalk', 'khadi', { w: 0.7, p: 0.7 });
      A.stroke(f([[-L / 2, H / 2 - 0.6], [L / 2, H / 2 - 0.6]]), 'shade', 'ochre', { w: 1.4, p: 0.4 });
      for (const sx of [-1, 1]) A.stroke(f([[sx * (L / 2 - 1.2), -H / 2], [sx * (L / 2 - 1.2), H / 2]]), 'shade', 'ochre', { w: 1.6, p: 0.35 });
      for (const sx of [-1, 1]) for (const dx of [3.2, 3.9]) A.stroke(f([[sx * (L / 2 - dx), -H / 2 + 1.2], [sx * (L / 2 - dx), H / 2 - 1.2]]), 'chalk', A.mix('sepia', 'lac', 0.3), { w: 0.3, p: 0.6 });
      const z = o.z || 1.05, t0 = -H / 2 + 1.7, t1 = H / 2 - 1.6 - z * 1.35, gaps = holes.map(h => [h - 2.8, h + 2.8]);
      for (let r = 0; r < rows; r++) {
        const y = rows > 1 ? lerp(t0, t1, r / (rows - 1)) : (t0 + t1) / 2;
        scriptLine(A, f, -L / 2 + 5, r === rows - 1 && o.lastShort ? lerp(-L / 2 + 5, L / 2 - 5, o.lastShort) : L / 2 - 5, y, z, gaps);
      }
    }, 0);
    line(A, leaf, 'kajal', 0.4, { closed: true, p: 0.72, off: 0.1 });
    for (const hx of holes) { const h = f.p(hx, 0); A.dot(h[0], h[1], 'kajal', 'kajal', { w: 1.3, p: 1 }); A.stroke(A.ellipse(h[0], h[1], 1.4, 1.25), 'chalk', 'ochre', { w: 0.35, p: 0.6 }); }
    return leaf;
  }
  // the palm-leaf book lying open, seen from above the way the stand's top is: the lower board showing as a margin all
  // round, the edges of the stack along its foot with one leaf pushed askew, and the written top leaf
  function pothi(A, cx, cy, L, H, rot, o) {
    o = o || {};
    const f = tf(A, cx, cy, 1, rot, false), rr = A.rr, BW = L + 6, BH = H + 6, off = 1.0;
    A.fill(f(A.ellipse(1.6, off + 2, BW * 0.52, BH * 0.52)), 'shade', o.shade || A.mix('bottle', 'kajal', 0.4), { w: 4, p: 0.45, reach: 1, passes: 1, ang: rot });
    // the lower board of lac-red wood: a gold rule round it and a row of white dots along its foot
    const board = f(rrect(BW, BH, 2.6).map(p => [p[0], p[1] + off]));
    solid(A, board, A.mix('lac', 'maroon', 0.3), 1.6, { ang: rot });
    A.withMask(board, () => {
      const gr = f(rrect(BW - 2.4, BH - 2.4, 1.8).map(p => [p[0], p[1] + off])); A.stroke(gr.concat([gr[0]]), 'gold', 'gold', { w: 0.42, p: 0.85 });
      for (let x = -L / 2 + 1; x <= L / 2 - 1; x += rr(2.6, 3.2)) A.dot.apply(null, f.p(x, H / 2 + 2.6 + off * 0.5).concat(['chalk', A.chance(0.25) ? 'haldi' : 'khadi', { w: 0.65, p: 0.9 }]));
      A.stroke(f([[-BW / 2, -BH / 2 + off + 0.4], [BW / 2, -BH / 2 + off + 0.4]]), 'chalk', A.mix('lac', 'peach', 0.4), { w: 0.5, p: 0.5 });
    }, 0);
    line(A, board, 'kajal', 0.4, { closed: true, p: 0.7, off: 0.1 });
    // the edges of the leaves under the top one
    for (let i = 3; i >= 1; i--) {
      const e = f(rrect(L - i * 0.4, H, 2.2).map(p => [p[0] + rr(-0.5, 0.5), p[1] + i * 0.55]));
      solid(A, e, A.mix('sand', 'ochre', 0.12 + i * 0.1), 0.8, { ang: rot });
      A.stroke(f([[-L / 2 + 2, H / 2 + i * 0.55 - 0.1], [L / 2 - 2, H / 2 + i * 0.55 - 0.1]]), 'chalk', A.mix('cream', 'sand', 0.3), { w: 0.28, p: 0.6 });
      if (i === 3) line(A, e, 'kajal', 0.3, { closed: true, p: 0.5, off: 0.05 });
    }
    // one leaf of the stack pushed out askew, its end and a little of its writing showing past the top leaf
    {
      const q = f.p(-3.2, 0.9), g = tf(A, q[0], q[1], 1, rot - 0.045, false), e = g(rrect(L - 1, H - 0.4, 2.1));
      solid(A, e, A.mix('cream', 'sand', 0.62), 1, { ang: rot });
      A.withMask(e, () => { for (const y of [-2.6, 0.6]) { A.stroke(g([[-L / 2 + 2.2, y], [-L / 2 + 9, y + 0.05]]), 'gold', 'gold', { w: 0.36, p: 0.8 }); for (let x = -L / 2 + 2.6; x < -L / 2 + 9; x += rr(0.9, 1.3)) A.stroke(g([[x, y], [x + rr(-0.2, 0.2), y + rr(0.9, 1.3)]]), 'gold', 'gold', { w: 0.32, p: 0.75 }); } }, 0);
      line(A, e, 'kajal', 0.32, { closed: true, p: 0.6, off: 0.05 });
    }
    leafFace(A, f, L, H, o.rows || 3, { lastShort: 0.64 });
    return { f, L, H };
  }
  // a leaf come loose from the book and drifted into the grass
  function looseLeaf(A, cx, cy, L, H, rot, rows) {
    const f = tf(A, cx, cy, 1, rot, false);
    A.fill(f(A.ellipse(0.8, H * 0.5, L * 0.52, H * 0.42)), 'shade', A.mix('bottle', 'kajal', 0.45), { w: 3, p: 0.45, reach: 1, passes: 1, ang: rot });
    return leafFace(A, f, L, H, rows, { z: 0.95, lastShort: A.rr(0.4, 0.8), c: A.mix('cream', 'sand', 0.5) });
  }
  /* the low carved stand the book is read on, the Mewar way: its top tipped up to show, a front board with a gold rule and
     a row of white dots, an apron cut in cusped arches, four turned legs, the back two darker and higher.
     cx = its middle, yT = the back edge of its top, W = its width; o.D = the depth the top shows, o.leg = the legs' length */
  function chauki(A, cx, yT, W, o) {
    o = o || {};
    const rr = A.rr, hw = W / 2, yF = yT + (o.D || 5), yB = yF + 4.4, yA = yB + 2.6, yG = yF + (o.leg || 16);
    const wood = A.mix('lac', 'hingul', 0.28), deep = A.mix('lac', 'maroon', 0.45), lite = A.mix('lac', 'peach', 0.3);
    A.fill(A.ellipse(cx + 2, yG + 0.4, hw + 5, 2.8), 'shade', A.mix('bottle', 'kajal', 0.45), { w: 3, p: 0.55, reach: 1, passes: 1, ang: 0 });
    const prof = [[0, 1.45], [0.1, 1.05], [0.2, 1.65], [0.3, 1.0], [0.48, 0.8], [0.62, 1.2], [0.72, 0.78], [0.86, 0.72], [0.93, 1.1], [1, 0.85]];
    const leg = (lx, y0, y1, c, back) => {
      const Lp = [], Rp = [];
      for (const q of prof) { const yy = lerp(y0, y1, q[0]); Lp.push([lx - q[1], yy]); Rp.push([lx + q[1], yy]); }
      const poly = A.spline(Lp, false, 0.4).concat(A.spline(Rp, false, 0.4).reverse());
      solid(A, poly, c, 0.7, { ang: PI / 2 + 0.1 });
      A.withMask(poly, () => {
        A.stroke([[lx - 0.55, y0], [lx - 0.45, y1]], 'chalk', back ? A.mix(c, 'peach', 0.2) : lite, { w: 0.55, p: 0.7 });
        A.stroke([[lx + 0.85, y0], [lx + 0.8, y1]], 'shade', 'maroon', { w: 0.9, p: 0.5 });
      }, 0);
      if (!back) for (const t of [0.2, 0.62, 0.93]) { const yy = lerp(y0, y1, t), wq = cr(prof.map(q => q[0]), prof.map(q => q[1]), t); A.stroke([[lx - wq + 0.2, yy], [lx + wq - 0.2, yy]], 'gold', 'gold', { w: 0.5, p: 0.9 }); }
      line(A, poly, 'kajal', 0.3, { closed: true, p: back ? 0.5 : 0.62, off: 0.05 });
    };
    for (const sx of [-1, 1]) leg(cx + sx * (hw - 7.5), yF - 1, yG - 2.6, A.mix(deep, 'kajal', 0.25), true);
    // the top, tipped up toward us
    const top = [[cx - hw + 3, yT], [cx + hw - 3, yT], [cx + hw, yF], [cx - hw, yF]];
    solid(A, top, lite, 1.2, { ang: 0.02 });
    A.withMask(top, () => {
      for (let y = yT + 0.8; y < yF; y += rr(0.9, 1.4)) A.stroke([[cx - hw, y + rr(-0.15, 0.15)], [cx + hw, y + rr(-0.15, 0.15)]], 'chalk', A.chance(0.5) ? A.mix(lite, 'peach', 0.3) : A.mix(wood, 'lac', 0.3), { w: 0.35, p: rr(0.3, 0.55) });
      A.stroke([[cx - hw, yT + 0.6], [cx + hw, yT + 0.6]], 'shade', 'maroon', { w: 1.2, p: 0.4 });
      A.stroke([[cx - hw, yF - 0.7], [cx + hw, yF - 0.7]], 'gold', 'gold', { w: 0.45, p: 0.85 });
    }, 0);
    line(A, top, 'kajal', 0.34, { closed: true, p: 0.62, off: 0.06 });
    // the front board and the apron under it, cut in cusped arches
    const nC = 9, xa = cx + hw - 3.2, xb = cx - hw + 3.2, cusp = dy => { const out = []; for (let i = 0; i <= nC * 8; i++) { const t = i / (nC * 8), ph = (t * nC) % 1; out.push([lerp(xa, xb, t), yA + 0.9 - 2.2 * Math.pow(Math.sin(ph * PI), 0.6) + dy]); } return out; };
    const ap = [[cx - hw, yF], [cx + hw, yF], [cx + hw, yA]].concat(cusp(0), [[cx - hw, yA]]);
    solid(A, ap, wood, 1.2, { ang: 0 });
    A.withMask(ap, () => {
      A.fill([[cx - hw, yB + 0.6], [cx + hw, yB + 0.6], [cx + hw, yA + 2], [cx - hw, yA + 2]], 'side', deep, { w: 2, p: 0.55, passes: 1, ang: 0 });
      A.stroke([[cx - hw, yB + 0.3], [cx + hw, yB + 0.3]], 'shade', 'maroon', { w: 0.9, p: 0.45 });
      A.stroke([[cx - hw, yF + 0.7], [cx + hw, yF + 0.7]], 'gold', 'gold', { w: 0.5, p: 0.9 });
      for (let x = cx - hw + 2.4; x < cx + hw - 1.5; x += rr(2.5, 3)) A.dot(x, (yF + yB) / 2 + 0.3, 'chalk', A.chance(0.2) ? 'haldi' : 'khadi', { w: 0.75, p: 0.9 });
      A.stroke(cusp(-0.8), 'gold', 'gold', { w: 0.4, p: 0.85 });
    }, 0);
    line(A, ap, 'kajal', 0.36, { closed: true, p: 0.66, off: 0.06 });
    A.stroke([[cx - hw, yB], [cx + hw, yB]], 'kajal', A.mix('kajal', 'lac', 0.3), { w: 0.3, p: 0.6 });
    for (const sx of [-1, 1]) leg(cx + sx * (hw - 2.4), yB - 0.6, yG, wood, false);
    return { yT, yF, yG, x0: cx - hw, x1: cx + hw };
  }

  // a grass band at the foot
  function meadow(A, b, top) {
    const rr = A.rr, x0 = b.x0 - 3, x1 = b.x1 + 3, y1 = b.y1 + 3;
    const edge = x => top + 1.5 * Math.sin(x / 9 + 0.4) + 1.2 * Math.sin(x / 23 + 1.7);
    const poly = []; for (let x = x0; x <= x1; x += 2.5) poly.push([x, edge(x)]); poly.push([x1, y1], [x0, y1]);
    A.fill(poly, 'side', A.mix('malachite', 'sap', 0.4), { w: 9, p: 1, reach: 1.5, passes: 2, ang: 0.05 });
    A.fill(poly.map(p => [p[0], Math.max(p[1], top + 10)]), 'side', A.mix('bottle', 'malachite', 0.45), { w: 8, p: 0.55, reach: 1.1, passes: 1, ang: -0.04 });
    A.withMask(poly, () => {
      for (let i = 0; i < 1100; i++) {
        const x = rr(x0, x1), y = rr(top - 2, y1), a = -PI / 2 + rr(-0.5, 0.5), L = rr(1.8, 3.6);
        A.stroke([[x, y], [x + Math.cos(a) * L, y + Math.sin(a) * L]], 'pastel', A.pick(['leaf', 'sap', 'malachite', 'bottle', A.mix('sap', 'leaf', 0.5)]), { w: 0.75, p: 0.9, reach: 1.3, tin: 0, tout: 0.7 });
      }
    }, 0);
    for (let x = x0; x < x1; x += rr(0.9, 1.8)) {
      const y = edge(x) + 1.2, a = -PI / 2 + rr(-0.45, 0.45), L = rr(2, 4.8);
      A.stroke([[x, y], [x + Math.cos(a) * L * 0.5 + rr(-0.3, 0.3), y + Math.sin(a) * L * 0.5], [x + Math.cos(a) * L, y + Math.sin(a) * L]], 'pastel', A.pick(['sap', 'malachite', A.mix('sap', 'leaf', 0.5)]), { w: 0.8, p: 0.95, reach: 1.3, tin: 0, tout: 0.75 });
    }
    return { edge, poly };
  }
  function grassFlowers(A, poly, sp, cols, skip) {
    for (const p of A.scatter([poly], sp, { jit: 0.48 })) {
      if (skip && skip(p)) continue;
      const r = A.rr(0.9, 1.35), a0 = A.rr(0, TAU), c = A.pick(cols);
      for (let k = 0; k < 5; k++) { const a = a0 + k * 1.2566; A.dot(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r * 0.85, 'chalk', c, { w: r * 0.9, p: 0.95, reach: 1.5 }); }
      A.dot(p[0], p[1], 'gold', 'gold', { w: 0.6 });
    }
  }
  // a slender flowering plant rising from the grass
  function sprig(A, x, y, h, lean, fc) {
    const top = [x + lean * h, y - h], mid = [x + lean * h * 0.3 + A.rr(-1, 1), y - h * 0.5];
    const sp = A.spline([[x, y], mid, top], false, 0.8);
    A.stroke(sp, 'pastel', A.mix('sap', 'bottle', 0.3), { w: 0.7, p: 0.95, tout: 0.3 });
    for (let i = 3; i < sp.length - 2; i += A.ri(3, 5)) { const p = sp[i], s = (i % 2 ? 1 : -1); mangoLeaf(A, p[0], p[1], -PI / 2 + s * A.rr(0.7, 1.1), A.rr(3.5, 5), 0.8, A.pick(['sap', 'malachite', A.mix('sap', 'leaf', 0.5)]), { norib: true, lp: 0.35 }); }
    const n = A.ri(2, 4);
    for (let i = 0; i < n; i++) {
      const p = i === 0 ? top : sp[Math.max(0, sp.length - 1 - i * A.ri(3, 5))];
      const fx = p[0] + (i ? A.rr(-2.5, 2.5) : 0), fy = p[1] - (i ? A.rr(0.5, 2) : 0);
      if (i) A.stroke([p, [fx, fy]], 'pastel', 'sap', { w: 0.45, p: 0.9 });
      const r = A.rr(1.2, 1.7), a0 = A.rr(0, TAU);
      for (let k = 0; k < 5; k++) { const a = a0 + k * 1.2566; A.dot(fx + Math.cos(a) * r, fy + Math.sin(a) * r, 'chalk', fc, { w: r * 0.95, p: 0.95 }); }
      A.dot(fx, fy, 'gold', 'gold', { w: 0.7 });
    }
  }

  M.folioArt['open-transcribe'] = function (A, b) {
    const X = u => b.x0 + u, Y = v => b.y0 + v, P = (u, v) => [b.x0 + u, b.y0 + v], rr = A.rr;
    // geru first lines: the tree's dome (a second line, the old fall of the call, is passed over unseen)
    A.stroke(A.spline([P(-4, 96), P(4, 40), P(60, 14), P(118, 34), P(130, 80)], false, 2), 'geru', 'geru', { w: 1.1, p: 0.4 });
    A.withMask(GHOST, () => A.stroke(A.spline([P(186, 42), P(230, 30), P(268, 52), P(240, 96), P(236, 128)], false, 2), 'geru', 'geru', { w: 1, p: 0.35 }), 0);
    // ---- the hingul ground, laid with the side of the stick and rubbed
    const g = rect(b.x0 - 3, b.y0 - 3, b.x1 + 3, b.y1 + 3);
    A.ground(g, A.mix('hingul', 'sindoor', 0.06), { w: 22, ang: -0.5, c2: A.mix('hingul', 'lac', 0.12), top: 0.55, edge: 0, rub: 0 });
    rub(A, b, g, 8, 0.4, -0.5);
    rubEdges(A, b, A.mix(A.mix('hingul', 'sindoor', 0.06), A.mix('hingul', 'lac', 0.12), 0.5), -0.5);
    A.fill(A.ellipse(X(236), Y(70), 64, 50), 'side', A.mix('hingul', 'sindoor', 0.4), { w: 16, p: 0.22, reach: 1.05, passes: 1, ang: -0.3 });
    rub(A, b, A.ellipse(X(236), Y(70), 70, 56), 8, 0.35, -0.3);
    A.fill(g, 'chalk', A.mix('hingul', 'peach', 0.18), { w: 2.2, p: 0.12, passes: 1, gap: 3.2, ang: -0.5, cv: 0.03 });
    // ---- the sky
    const sky = skyStrip(A, b, 22, { ghost: true, clouds: [[X(160), Y(11), 40, 1, 1.05], [X(238), Y(8), 34, -1], [X(290), Y(12), 22, 1, 0.85]], birds: [[X(196), Y(16), 1.7], [X(203), Y(13), 1.4]] });
    // ---- the grass at the foot
    const GT = 136;
    const md = meadow(A, b, Y(GT));
    bush(A, X(302), Y(GT + 2), 34, 26, ['rose', 'khadi', 'gulabi', 'khadi']);
    bush(A, X(284), Y(GT + 2), 16, 11, ['khadi', 'haldi']);
    // ---- the mango tree: trunk and limbs first
    const bark = A.mix('umber', 'sepia', 0.45);
    for (const l of [[P(58, 100), P(40, 80), P(22, 62)], [P(61, 92), P(70, 70), P(66, 46)], [P(60, 98), P(84, 82), P(104, 70)]]) branch(A, l, 5.5, 2.6, { c: bark });
    for (const r of [[P(52, 160), P(40, 166), P(30, 170)], [P(56, 160), P(70, 166), P(80, 171)]]) branch(A, r, 4, 1.4, { c: bark });
    branch(A, [P(52, 172), P(56, 150), P(52, 128), P(58, 106), P(62, 86), P(63, 72)], 11, 5, { c: bark });
    // the dome of leaves: a dark mass in lobes, lit from the upper left
    const lobes = [[12, 52, 28, 26], [40, 30, 30, 24], [74, 24, 32, 22], [106, 40, 26, 22], [120, 64, 18, 16], [92, 66, 26, 20], [30, 80, 24, 16], [60, 58, 34, 28], [8, 84, 16, 14]];
    const LP = lobes.map(l => A.roughen(A.ellipse(X(l[0]), Y(l[1]), l[2], l[3]), 1.2, 7, true));
    for (const p of LP) solid(A, p, A.mix('bottle', 'kajal', 0.18), 4, { ang: -0.6, p: 1 });

    // whorls of long leaves over the whole dome; paler toward the light
    const dark = [A.mix('bottle', 'malachite', 0.3), A.mix('bottle', 'malachite', 0.48), A.mix('bottle', 'sap', 0.35), A.mix('bottle', 'teal', 0.35)], lit = ['malachite', A.mix('malachite', 'sap', 0.4), A.mix('malachite', 'leaf', 0.3), A.mix('bottle', 'malachite', 0.6)];
    const pts = A.scatter(LP, 5.9, { jit: 0.45 });
    pts.sort((p, q) => p[1] - q[1]);
    for (const p of pts) {
      const u = p[0] - b.x0, v = p[1] - b.y0, light = Math.max(0.28, 1 - Math.hypot(u - 30, v - 20) / 110);
      whorl(A, p[0], p[1], PI / 2 + (u - 60) * 0.01 + rr(-0.4, 0.4), A.ri(4, 6), rr(8, 11), A.chance(light * 1.1) ? lit : dark, { spread: rr(1.1, 1.6) });
    }
    // ---- mangoes hanging below the leaves
    for (const q of [[22, 66, 2], [46, 86, 3], [84, 52, 2], [104, 76, 2], [70, 84, 2], [120, 58, 1], [12, 92, 2], [36, 48, 1], [62, 36, 2]]) {
      mangoBunch(A, X(q[0]), Y(q[1]), q[2], rr(6.4, 7.6));
      whorl(A, X(q[0]) + rr(-2, 2), Y(q[1]) - 2, -PI / 2 + rr(-0.6, 0.6), 4, rr(8, 10), dark, { spread: 1.5 });
    }
    // rim leaves standing out against the ground and the sky
    lobes.forEach((l, j) => {
      for (let k = 0; k < 11; k++) {
        const a = rr(-PI, PI), ex = X(l[0]) + Math.cos(a) * l[2] * 0.92, ey = Y(l[1]) + Math.sin(a) * l[3] * 0.92;
        if (LP.some((p, i) => i !== j && A.inside([p], ex + Math.cos(a) * 4, ey + Math.sin(a) * 4))) continue;
        whorl(A, ex, ey, a + (PI / 2 - a) * 0.35 + rr(-0.25, 0.25), A.ri(3, 5), rr(7.5, 10), lit, { spread: 1.2 });
      }
    });
    // ---- the parrot's limb, reaching out of the leaves to the right
    const perch = [P(98, 79), P(124, 86), P(150, 89), P(176, 88), P(198, 81)];
    branch(A, perch, 4.6, 1.8, { c: A.mix('umber', 'sepia', 0.4) });
    const pend = perch[perch.length - 1];
    whorl(A, pend[0] - 2, pend[1] + 1, 1.25, 6, 9.5, dark, { spread: 1.5 });
    whorl(A, pend[0], pend[1], 0.35, 4, 8.5, lit, { spread: 1.1 });
    branch(A, [P(128, 87), P(134, 78), P(140, 70)], 2, 0.8, { c: A.mix('umber', 'sepia', 0.4) });
    whorl(A, X(140), Y(70), 0.9, 5, 9, lit, { spread: 1.5 });
    whorl(A, X(118), Y(84), PI / 2 + 0.35, 5, 9.5, dark, { spread: 1.4 });
    for (const q of [[97, 74, 1.9], [104, 77, 1.2], [99, 82, 2.4], [110, 75, 0.6]]) whorl(A, X(q[0]), Y(q[1]), q[2], 5, rr(8.5, 10), A.chance(0.5) ? dark : lit, { spread: 1.4 });
    whorl(A, X(140), Y(88), PI / 2 + 0.2, 4, 9, dark, { spread: 1.3 });
    mangoBunch(A, X(138), Y(89), 2, 7.2);
    whorl(A, X(104), Y(80), PI / 2 - 0.3, 5, 10, dark, { spread: 1.4 });
    // ---- the parrot
    parrot(A, X(176), Y(87), 66, 0.02, false, { head: 0.22 });
    // ---- the book open on its low stand, under the parrot
    const CX = X(206);
    // plants growing behind the stand
    for (const q of [[184, 0.07, 24, 'khadi'], [252, -0.08, 15, 'gulabi'], [268, 0.05, 20, 'khadi']]) sprig(A, X(q[0]), md.edge(X(q[0])) + 2, q[2], q[1], q[3]);
    // two leaves come loose and drifted into the grass
    looseLeaf(A, X(112), Y(159), 56, 8.5, -0.085, 2);
    looseLeaf(A, X(286), Y(161.5), 40, 8, 0.15, 2);
    chauki(A, CX, Y(125), 106, { D: 19, leg: 16 });
    // the cord, out from under the book and over the front edge, a gold bead at its end
    {
      const cord = A.spline([[X(171), Y(140.5)], [X(167), Y(143.4)], [X(164.6), Y(146.4)], [X(166), Y(149.6)], [X(163.8), Y(152.8)], [X(164.6), Y(155.4)]], false, 0.6);
      A.stroke(cord, 'pastel', A.mix('haldi', 'saffron', 0.35), { w: 1.0, p: 0.95, reach: 1.3 });
      A.stroke(cord.map(p => [p[0] - 0.2, p[1] - 0.3]), 'chalk', A.mix('haldi', 'cream', 0.4), { w: 0.3, p: 0.6 });
      line(A, cord, 'kajal', 0.22, { p: 0.45, off: 0.05 });
      const e = cord[cord.length - 1];
      A.dot(e[0], e[1], 'gold', 'gold', { w: 2.2, p: 1 }); A.dot(e[0] - 0.4, e[1] - 0.4, 'chalk', 'khadi', { w: 0.5 });
    }
    pothi(A, CX, Y(133.4), 86, 11, -0.015, { shade: A.mix('maroon', 'kajal', 0.35), rows: 3 });
    // ---- flowers in the grass, sprigs rising, two fallen mangoes
    grassFlowers(A, md.poly.map(p => [p[0], p[1] + 3]), 7.5, ['khadi', 'khadi', 'rose', 'haldi', 'gulabi'],
      p => (p[0] > X(148) && p[0] < X(264) && p[1] > Y(120)) || (p[0] > X(82) && p[0] < X(142) && p[1] > Y(152)) || (p[0] > X(263) && p[1] > Y(154)));
    for (const q of [[92, 0.08, 22, 'khadi'], [101, -0.1, 16, 'rose'], [124, 0.05, 19, 'khadi'], [18, -0.06, 14, 'haldi']]) sprig(A, X(q[0]), md.edge(X(q[0])) + 2, q[2], q[1], q[3]);
    mango(A, X(28), Y(152), 6.4, 1.4, false); mango(A, X(38), Y(156), 6, 2.3, true);
    // grass in front of the stand's feet and along the loose leaves, so they stand and lie in the grass, not on it
    const blades = (xa, xb, yy, h) => { for (let x = xa; x < xb; x += rr(1.2, 2.6)) { const y = yy(x) + rr(-1.2, 1.2), a = -PI / 2 + rr(-0.5, 0.5), L = rr(h * 0.5, h); A.stroke([[x, y], [x + Math.cos(a) * L, y + Math.sin(a) * L]], 'pastel', A.pick(['sap', 'malachite', 'leaf', A.mix('sap', 'leaf', 0.5)]), { w: 0.75, p: 0.95, tout: 0.75 }); } };
    blades(X(148), X(264), () => Y(161), 4.4);
    blades(X(83), X(142), x => Y(164.5) - (x - X(112)) * 0.085, 4.2);
    blades(X(265), X(302), x => Y(166) + (x - X(286)) * 0.15, 4.2);
    for (let i = 0; i < 9; i++) { const x = rr(X(86), X(138)), y = Y(160) - (x - X(112)) * 0.085 + rr(-2, 3), a = -PI / 2 + rr(-0.45, 0.45), L = rr(2, 3.6); A.stroke([[x, y], [x + Math.cos(a) * L, y + Math.sin(a) * L]], 'pastel', A.pick(['sap', 'malachite', 'leaf']), { w: 0.7, p: 0.95, tout: 0.75 }); }
    // ---- long thin clouds drawn out across the blue, laid last so they pass behind the tree
    A.withMask(sky.poly, () => {
      A.pushMask(skyLeft(A, sky.poly), 0);
      A.pushMaskOutside([[196, 16, 1.7], [203, 13, 1.4]].map(q => A.ellipse(X(q[0]), Y(q[1]) - q[2] * 0.3, q[2] * 1.8, q[2] * 1.2)), 0);
      cloudBand(A, X(141), X(193), Y(11), 2.5, {});
      cloudBand(A, X(213), X(299), Y(17), 2.7, {});
      cloudBand(A, X(234), X(279), Y(7.5), 2.1, { n: 6 });
      A.popMask(); A.popMask();
    }, 0);
  };

})();
