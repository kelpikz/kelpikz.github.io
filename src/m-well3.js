(function () {
  'use strict';
  /* ==========================================================================
     THE STEPWELL, CONTINUED: MASONRY, WALL PAINTINGS, FRIEZES, AND WHAT WATER DOES TO STONE
       M.wellAshlar(A, poly, K, o)            courses of hand-cut blocks: kajal joints, dust in the joints, chisel marks
       M.wellFresco(A, box, motif, K, o)      a framed wall painting in a V of the stairs; o.age flakes and ghosts it
       M.wellRoundel(A, cx, cy, r, K, o)      a painted lotus medallion for the narrow foot of a V
       M.wellHorse(A, x, y, s, o)             a horse with no rider, henna on its legs; x,y the ground under it, s the withers
       M.wellMango(A, x, y, h, o)             a mango tree in fruit, the Mewar way: a dome of leaves in rows
       M.wellLotusVine(A, x0, x1, yc, amp, o) a running lotus scroll
       M.wellFrieze(A, x0, x1, y0, y1, K, kind, age)   a carved band on a ledge: 'lotus' petals or 'chevron'
       M.wellSalt(A, x0, x1, y, K, o)         a white line of salt where old water stood, with its crust and drips
       M.wellWetStreak(A, x, y, len, w, K)    a dark wet run down the stone
     The tools are the same: soft pastel stick and side, conte chalk, kajal, gold, and the wet-dipped pastel.
     ======================================================================== */
  const PI = Math.PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const I = c => c;
  // a line pulled by hand: it wanders a little between its ends
  const wob = (A, a, b, amp) => {
    const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 14)), out = [];
    for (let i = 0; i <= n; i++) { const t = i / n, e = i && i < n ? amp : 0; out.push([a[0] + (b[0] - a[0]) * t + A.rr(-e, e), a[1] + (b[1] - a[1]) * t + A.rr(-e, e)]); }
    return out;
  };
  // a band of even or tapering width along a path
  const ribbon = (pts, w0, w1) => {
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d, ny = dx / d, t = i / Math.max(1, pts.length - 1), w = (w0 + (w1 - w0) * t) / 2;
      L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); R.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    return L.concat(R.reverse());
  };
  M.wellRibbon = ribbon;

  /* ------------------------------------------------------------ MASONRY
     The courses are never the same height twice, the blocks are cut to whatever the quarry gave, every block is
     its own stone a shade paler or deeper, the mason's chisel has left its marks, and pale dust sits in the joints. */
  M.wellAshlar = function (A, poly, K, o) {
    o = o || {};
    const bb = A.bbox([poly]), c = o.c || K.wall, ch = o.ch || 30, age = o.age || 0, k = o.k != null ? o.k : 1;
    const line = A.mix(c, K.line, o.dark != null ? o.dark : 0.6), dust = A.mix(c, K.lime || 'cream', 0.6), lit = A.mix(c, K.lime || 'cream', 0.32), dk = A.mix(c, K.deep, 0.35), odd = A.mix(c, K.recess, 0.55);
    A.withMask(poly, () => {
      let y = bb[1] - A.rr(0, ch * 0.6);
      while (y < bb[3]) {
        const h = ch * A.rr(0.66, 1.38), y1 = y + h;
        let x = bb[0] - A.rr(0, ch * 3);
        while (x < bb[2]) {
          const L = h * A.rr(1.2, 4.4), x1 = x + L;
          if (A.chance(0.72)) A.fill(rect(x + 1.5, y + 1.5, x1 - 1.5, y1 - 1.5), 'side', A.chance(0.5) ? lit : dk, { w: Math.min(10, h * 0.5), p: A.rr(0.06, 0.22) * k, passes: 1, ang: A.rr(-0.5, 0.5) });
          // now and then a stone from another bed of the quarry, or one put back in a later repair
          if (A.chance(0.12)) A.fill(rect(x + 1.5, y + 1.5, x1 - 1.5, y1 - 1.5), 'side', A.pick([lit, dk, odd, odd]), { w: Math.min(10, h * 0.5), p: A.rr(0.2, 0.38) * k, passes: 1, ang: A.rr(-0.5, 0.5) });
          // the top arris of a block catches the light, the bottom one sits in a little shade
          if (A.chance(0.55)) A.stroke(wob(A, [x + 2, y + 2.2], [x1 - 3, y + 2.2], 0.6), 'chalk', lit, { w: 1.3, p: A.rr(0.22, 0.45) * k });
          if (A.chance(0.4)) A.stroke(wob(A, [x + 2, y1 - 2], [x1 - 3, y1 - 2], 0.6), 'side', dk, { w: 2.2, p: A.rr(0.12, 0.26) * k });
          // chisel marks: short parallel strokes struck at one angle
          if (A.chance(0.3)) {
            const n = A.ri(4, 9), a = A.rr(0.6, 1.2) * (A.chance(0.5) ? 1 : -1), x0m = A.rr(x + 4, Math.max(x + 5, x1 - 26)), y0m = A.rr(y + 4, Math.max(y + 5, y1 - 6)), len = Math.min(h * 0.5, A.rr(4, 9));
            for (let i = 0; i < n; i++) { const xx = x0m + i * A.rr(2.2, 3.2), yy = y0m + A.rr(-0.6, 0.6); A.stroke([[xx, yy], [xx + Math.cos(a) * len, yy + Math.sin(a) * len]], 'chalk', A.chance(0.6) ? dk : lit, { w: 0.75, p: A.rr(0.2, 0.42) * k }); }
          }
          if (A.chance(0.92)) A.stroke(wob(A, [x1, y], [x1 + A.rr(-1.5, 1.5), y1], 0.8), 'kajal', line, { w: A.rr(0.9, 1.4), p: A.rr(0.45, 0.75) * k });
          if (A.chance(0.05 + age * 0.12)) M.wellChip(A, x1 + A.rr(-3, 3), A.chance(0.5) ? y + 1 : y1 - 1, A.rr(3, 7), K, { face: true });
          x = x1;
        }
        // the bed joint, broken here and there, with pastel dust caught under it
        for (let xx = bb[0] - A.rr(0, 30); xx < bb[2];) {
          const L = A.rr(60, 240), xe = Math.min(bb[2] + 10, xx + L), yy = y1 + A.rr(-0.8, 0.8);
          A.stroke(wob(A, [xx, y1], [xe, yy], 0.9), 'kajal', line, { w: A.rr(1.0, 1.6), p: A.rr(0.55, 0.85) * k });
          if (o.dust !== false) A.stroke(wob(A, [xx + 2, y1 + 1.9], [xe - 2, yy + 1.9], 0.5), 'chalk', dust, { w: 1.6, p: A.rr(0.3, 0.55) * k });
          xx = xe + A.rr(0, 14);
        }
        if (age > 0.55) for (let xx = bb[0] + A.rr(0, 60); xx < bb[2]; xx += A.rr(30, 90)) if (A.noise2(xx / 260 + 7, y1 / 120, 11) > 0.7 - (age - 0.55) * 0.55 && A.chance(0.55)) M.wellMossPad(A, xx, xx + A.rr(18, 80), y1 + 1, K, { h: 3 + age * 5, hang: 2 + age * 3 });
        y = y1;
      }
    });
  };

  /* ------------------------------------------------------------ A HORSE WITH NO RIDER */
  M.wellHorse = function (A, x, y, s, o) {
    o = o || {}; const T = o.T || I;
    const f = o.flip ? -1 : 1, P = (u, v) => [x + u * s * f, y - v * s];
    const body = T(o.c || '#f3ecdc'), shade = T(o.shade || '#b9a888'), line = T('#2a1a10'), henna = T(o.henna || '#c8501c'), mane = T(o.mane || '#6a3018');
    const legs = (list, c) => {
      for (const L of list) {
        const pts = A.spline(L.map(q => P(q[0], q[1])), false, 1.5), rib = ribbon(pts, s * 0.1, s * 0.05);
        A.fill(rib, 'pastel', c, { w: Math.max(1.6, s * 0.035), p: 1, passes: 2 });
        const k = Math.floor(pts.length * 0.58), low = ribbon(pts.slice(k), s * 0.07, s * 0.05);
        A.fill(low, 'chalk', henna, { w: Math.max(1.4, s * 0.03), p: 0.8, passes: 1 });
        A.outline(rib, 'kajal', line, { closed: true, w: 0.8, p: 0.7 });
        const h = pts[pts.length - 1]; A.fill(rect(h[0] - s * 0.035, h[1] - s * 0.05, h[0] + s * 0.04, h[1] + 1), 'chalk', line, { w: 1.4, p: 1, passes: 1 });
      }
    };
    // the far legs, a shade darker
    legs([[[-0.42, 0.52], [-0.52, 0.27], [-0.46, 0.02]], [[0.36, 0.5], [0.38, 0.26], [0.38, 0.02]]], A.mix(body, shade, 0.45));
    // the tail, tied with a red thread
    const tail = A.spline([P(-0.6, 0.84), P(-0.76, 0.66), P(-0.76, 0.36), P(-0.68, 0.12)], false, 1.5);
    A.fill(ribbon(tail, s * 0.07, s * 0.13), 'chalk', mane, { w: Math.max(1.4, s * 0.03), p: 0.95, passes: 2 });
    for (let i = 0; i < 6; i++) { const q = tail[Math.floor(tail.length * (0.3 + i * 0.11)) % tail.length]; A.stroke([[q[0] - s * 0.03, q[1]], [q[0] + s * 0.02 * f, q[1] + s * 0.06]], 'chalk', henna, { w: 0.9, p: 0.6 }); }
    A.stroke([P(-0.66, 0.78), P(-0.7, 0.76)], 'chalk', T('#c8321c'), { w: Math.max(1.5, s * 0.04), p: 1 });
    // body, neck and head in one line
    const sil = A.spline([P(0.56, 0.74), P(0.6, 0.94), P(0.66, 1.1), P(0.8, 1.06), P(0.95, 1.03), P(0.99, 1.12), P(0.87, 1.27), P(0.73, 1.4), P(0.67, 1.5), P(0.62, 1.37), P(0.44, 1.12), P(0.26, 0.97), P(0, 0.9), P(-0.36, 0.95), P(-0.57, 0.85), P(-0.63, 0.66), P(-0.5, 0.5), P(-0.3, 0.42), P(0.1, 0.4), P(0.4, 0.46), P(0.5, 0.57)], true, 1.2);
    A.fill(sil, 'pastel', body, { w: Math.max(2, s * 0.06), p: 1, passes: 2, ang: -0.3 });
    M.floorWash(A, sil, shade, (xx, yy) => 0.38 * sstep((yy - (y - 0.8 * s)) / (0.4 * s)), 'mul');
    // dapples
    for (let i = 0; i < 14; i++) { const q = P(A.rr(-0.45, 0.35), A.rr(0.5, 0.85)); if (A.inside([sil], q[0], q[1])) A.dot(q[0], q[1], 'chalk', A.mix(body, shade, 0.5), { w: s * A.rr(0.03, 0.06), p: 0.4 }); }
    // the saddle cloth, empty
    const cloth = A.roughen([P(-0.2, 0.93), P(0.22, 0.97), P(0.26, 0.58), P(-0.22, 0.54)], 0.6, 6, true);
    A.fill(cloth, 'chalk', T(o.cloth || '#b8342a'), { w: Math.max(1.6, s * 0.04), p: 1, passes: 2 });
    A.outline(cloth, 'chalk', T('#e6b422'), { closed: true, w: Math.max(1, s * 0.022), p: 0.9 });
    for (let i = 0; i < 6; i++) { const q = P(-0.14 + i * 0.07, 0.75 + (i % 2) * 0.06); A.dot(q[0], q[1], 'chalk', T('#f3e6c0'), { w: Math.max(1, s * 0.025), p: 0.9 }); }
    for (let i = 0; i < 4; i++) { const q = P(-0.2 + i * 0.15, 0.55); A.stroke([q, [q[0], q[1] + s * 0.08]], 'chalk', T('#e6b422'), { w: Math.max(1, s * 0.025), p: 0.9 }); A.dot(q[0], q[1] + s * 0.09, 'chalk', T('#c8321c'), { w: s * 0.035, p: 1 }); }
    // mane along the crest
    for (let t = 0; t <= 1; t += 0.08) { const a = P(0.62 - t * 0.38, 1.36 - t * 0.4); A.stroke([a, [a[0] - s * 0.07 * f, a[1] + s * A.rr(0.04, 0.09)]], 'chalk', mane, { w: Math.max(1.2, s * 0.03), p: 0.9, tout: 0.6 }); }
    // the near legs, one foreleg lifted
    legs([[[-0.3, 0.52], [-0.38, 0.27], [-0.3, 0.02]], [[0.44, 0.52], [0.62, 0.32], [0.55, 0.19]]], body);
    A.outline(sil, 'kajal', line, { closed: true, w: Math.max(0.8, s * 0.016), p: 0.85 });
    // head: eye, nostril, a red bridle and a plume
    const e = P(0.8, 1.24); A.dot(e[0], e[1], 'kajal', line, { w: Math.max(1.2, s * 0.03), p: 1 }); A.dot(e[0] + s * 0.006 * f, e[1] - s * 0.006, 'chalk', T('#fffaf0'), { w: Math.max(0.6, s * 0.01), p: 1 });
    const n = P(0.95, 1.1); A.dot(n[0], n[1], 'kajal', line, { w: Math.max(0.8, s * 0.018), p: 0.9 });
    A.stroke([P(0.93, 1.06), P(0.76, 1.15), P(0.68, 1.3)], 'chalk', T('#c8321c'), { w: Math.max(0.9, s * 0.02), p: 0.9 });
    A.stroke([P(0.72, 1.36), P(0.86, 1.23)], 'chalk', T('#c8321c'), { w: Math.max(0.9, s * 0.02), p: 0.9 });
    const pl = P(0.68, 1.48); for (let i = 0; i < 4; i++) A.stroke([pl, [pl[0] + (A.rr(-0.04, 0.06) - 0.02) * s * f, pl[1] - s * A.rr(0.12, 0.2)]], 'chalk', T(i % 2 ? '#f3e6c0' : '#c8321c'), { w: Math.max(1, s * 0.03), p: 0.95, tout: 0.6 });
  };

  /* ------------------------------------------------------------ A MANGO TREE IN FRUIT */
  M.wellMango = function (A, x, y, h, o) {
    o = o || {}; const T = o.T || I;
    const trunk = A.spline([[x + h * 0.02, y], [x - h * 0.02, y - h * 0.22], [x + h * 0.01, y - h * 0.45]], false, 1.5);
    A.fill(ribbon(trunk, h * 0.1, h * 0.06), 'chalk', T('#6a4024'), { w: Math.max(1.6, h * 0.03), p: 1, passes: 2 });
    A.outline(ribbon(trunk, h * 0.1, h * 0.06), 'kajal', T('#2a1810'), { closed: true, w: 0.8, p: 0.7 });
    for (const sg of [-1, 1]) A.stroke([[x, y - h * 0.4], [x + sg * h * 0.12, y - h * 0.52]], 'chalk', T('#6a4024'), { w: Math.max(1.2, h * 0.03), p: 1 });
    const cx = x, cy = y - h * 0.66, rx = h * 0.44, ry = h * 0.34, pts = [];
    for (let i = 0; i < 16; i++) { const a = PI + i / 15 * PI * 1.0 - 0.02, r = 1 + A.rr(-0.06, 0.08); pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
    pts.push([cx + rx * 0.9, cy + ry * 0.55], [cx, cy + ry * 0.75], [cx - rx * 0.9, cy + ry * 0.55]);
    const dome = A.spline(pts, true, 1.2);
    A.fill(dome, 'pastel', T(o.c || '#2f4a26'), { w: Math.max(2, h * 0.05), p: 1, passes: 2 });
    // leaves in rows, as the old painters set them: each a small pointed dab, the light ones over the dark
    for (let row = 0; row < 7; row++) {
      const yy = cy - ry * 0.85 + row * ry * 0.27;
      for (let xx = cx - rx; xx < cx + rx; xx += h * 0.055) {
        const q = [xx + A.rr(-1, 1) + (row % 2) * h * 0.027, yy + A.rr(-1, 1)];
        if (!A.inside([dome], q[0], q[1])) continue;
        const a = -PI / 2 + (q[0] - cx) / rx * 0.9 + A.rr(-0.2, 0.2), l = h * A.rr(0.05, 0.075);
        A.stroke([q, [q[0] + Math.cos(a) * l, q[1] + Math.sin(a) * l]], 'chalk', T(A.pick(['#5f8a34', '#6f9a3c', '#4d7a2e', '#88a848'])), { w: Math.max(1.4, h * 0.026), p: 0.95, tin: 0.2, tout: 0.6 });
      }
    }
    A.outline(dome, 'kajal', T('#1a2a14'), { closed: true, w: Math.max(0.8, h * 0.012), p: 0.8 });
    // the fruit
    for (let i = 0; i < (o.fruit || 9); i++) {
      const q = [cx + A.rr(-rx * 0.75, rx * 0.75), cy + A.rr(-ry * 0.3, ry * 0.6)]; if (!A.inside([dome], q[0], q[1])) continue;
      const m = A.ellipse(q[0], q[1] + h * 0.02, h * 0.026, h * 0.038, A.rr(-0.3, 0.3));
      A.fill(m, 'chalk', T('#e8a21e'), { w: Math.max(1.2, h * 0.02), p: 1, passes: 2 });
      A.dot(q[0] - h * 0.008, q[1] + h * 0.01, 'chalk', T('#d0502a'), { w: Math.max(1, h * 0.018), p: 0.7 });
      A.outline(m, 'kajal', T('#4a2a10'), { closed: true, w: 0.6, p: 0.6 });
    }
    return { cx, cy, rx, ry, dome };
  };

  /* ------------------------------------------------------------ A RUNNING LOTUS SCROLL */
  M.wellLotusVine = function (A, x0, x1, yc, amp, o) {
    o = o || {}; const T = o.T || I, s = o.s || amp * 1.1;
    const pts = []; for (let x = x0; x <= x1; x += 4) pts.push([x, yc + amp * Math.sin((x - x0) / (s * 2.2) * PI)]);
    A.stroke(pts, 'chalk', T('#3f6a2c'), { w: Math.max(1.6, s * 0.08), p: 1 });
    A.stroke(pts.map(p => [p[0], p[1] - 1]), 'chalk', T('#8fb05a'), { w: Math.max(0.7, s * 0.025), p: 0.7 });
    let i = 0;
    for (let x = x0 + s * 1.1; x < x1 - s * 0.5; x += s * 2.2, i++) {
      const up = i % 2 === 0, yy = yc + amp * Math.sin((x - x0) / (s * 2.2) * PI);
      if (i % 3 === 1) M.lotus(A, x, yy - (up ? s * 0.1 : -s * 0.55), s * 0.7, A.chance(0.5) ? 'bud' : 'half', { stem: 0 });
      else M.lotus(A, x, yy + (up ? -s * 0.15 : s * 0.62), s * 0.85, 'open', { stem: 0 });
      // leaves off the stem between the flowers
      const lx = x + s * 1.1, ly = yc + amp * Math.sin((lx - x0) / (s * 2.2) * PI);
      if (lx < x1 - 6) M.lotusPad(A, lx, ly + (up ? s * 0.32 : -s * 0.32), s * 0.42, { rot: A.rr(0, 6), c: T('#3f7a44') });
    }
  };

  /* ------------------------------------------------------------ THE WALL PAINTINGS */
  const GROUND = { elephant: '#3f6a3e', horse: '#d9a43a', peacock: '#7a2a2a', parrots: '#2e4a3a', mango: '#e6d4a8', lotus: '#efe2c4', fish: '#2a4a6a' };
  const BAND = { elephant: '#b8342a', horse: '#2a4a6a', peacock: '#e6b422', parrots: '#c8501c', mango: '#3f6a3e', lotus: '#b8342a', fish: '#e6b422' };
  M.wellFresco = function (A, b, motif, K, o) {
    o = o || {}; const T = o.T || I, age = o.age || 0, calm = o.calm || 0;
    const [x0, y0, x1, y1] = b, w = x1 - x0, h = y1 - y0, bw = clamp(h * 0.09, 6, 12);
    const outer = A.roughen(rect(x0, y0, x1, y1), 0.8, 18, true), inner = rect(x0 + bw, y0 + bw, x1 - bw, y1 - bw);
    const g = T(GROUND[motif] || '#e6d4a8');
    // the plaster laid on, then the ground colour rubbed over it
    A.fill(outer, 'side', A.mix(K.lime || '#efe2c4', K.wall, 0.3), { w: 14, p: 0.9, passes: 1, ang: -0.3 });
    A.fill(inner, 'pastel', g, { w: 8, p: 1, passes: 2, ang: A.rr(-0.4, 0.4), cv: 0.04 });
    M.floorCloud(A, inner, A.mix(g, '#f3e6c0', 0.25), { scale: 40, seed: A.rr(0, 99), thr: 0.6, soft: 0.25, p: 0.3, w: 10 });
    // the picture
    const ix0 = x0 + bw, iy0 = y0 + bw, ix1 = x1 - bw, iy1 = y1 - bw, iw = ix1 - ix0, ih = iy1 - iy0, cx = (ix0 + ix1) / 2, gy = iy1 - ih * 0.08;
    A.withMask(inner, () => {
      // a strip of ground with flowers along the foot, for things to stand on
      if (motif !== 'fish' && motif !== 'lotus') {
        A.fill(rect(ix0, gy, ix1, iy1), 'chalk', T('#5a7a34'), { w: 4, p: 0.9, passes: 1 });
        for (let xx = ix0 + 4; xx < ix1; xx += A.rr(8, 16)) A.dot(xx, gy + A.rr(1, ih * 0.06), 'chalk', T(A.pick(['#f3e6c0', '#e6b422', '#e8607a'])), { w: 1.6, p: 0.9 });
      }
      if (motif === 'elephant') {
        const s = ih * 0.56, two = iw > s * 3.4;
        if (two) { M.wellMango(A, cx, gy, ih * 0.9, { T, fruit: 5 }); M.elephant(A, cx - iw * 0.27, gy, s, { pose: 'walk' }); M.elephant(A, cx + iw * 0.27, gy, s, { pose: 'walk', flip: true }); }
        else M.elephant(A, cx, gy, s, { pose: 'walk', flip: A.chance(0.5) });
      } else if (motif === 'horse') {
        const s = ih * 0.5, two = iw > s * 3.6;
        if (two) { M.wellHorse(A, cx - iw * 0.24, gy, s, { T }); M.wellHorse(A, cx + iw * 0.24, gy, s, { T, flip: true, c: '#d8c8a8', cloth: '#2a4a6a' }); M.wellMango(A, cx, gy, ih * 0.8, { T, fruit: 4 }); }
        else M.wellHorse(A, cx, gy, s, { T, flip: A.chance(0.5) });
      } else if (motif === 'peacock') {
        const n = Math.max(1, Math.min(3, Math.round(iw / (ih * 1.4))));
        for (let i = 0; i < n; i++) { const px = ix0 + iw * (i + 0.5) / n; M.peacockDancing(A, px, gy, ih * 0.42, { flip: i % 2 === 1 }); }
      } else if (motif === 'parrots' || motif === 'mango') {
        const n = Math.max(1, Math.min(3, Math.round(iw / (ih * 1.1))));
        for (let i = 0; i < n; i++) {
          const tx = ix0 + iw * (i + 0.5) / n, tr = M.wellMango(A, tx, gy, ih * 0.92, { T, fruit: motif === 'mango' ? 12 : 6 });
          if (motif === 'parrots') { M.parrot(A, tr.cx - tr.rx * 0.45, tr.cy - tr.ry * 0.1, ih * 0.34, { pose: 'perch', flip: true }); M.parrot(A, tr.cx + tr.rx * 0.5, tr.cy + tr.ry * 0.2, ih * 0.3, { pose: 'perch' }); }
        }
        if (motif === 'parrots' && n > 1) M.parrot(A, ix0 + iw / n, iy0 + ih * 0.22, ih * 0.32, { pose: 'fly', wings: 'up', ang: -0.2 });
      } else if (motif === 'lotus') {
        M.wellLotusVine(A, ix0 - 10, ix1 + 10, iy0 + ih * 0.52, ih * 0.16, { T, s: ih * 0.4 });
      } else if (motif === 'fish') {
        for (let yy = iy0 + ih * 0.15; yy < iy1; yy += ih * 0.17) { const pts = []; for (let xx = ix0; xx <= ix1; xx += 6) pts.push([xx, yy + 2.4 * Math.sin(xx / 9)]); A.stroke(pts, 'chalk', T('#7fa8c8'), { w: 1, p: 0.55 }); }
        const s = ih * 0.6;
        M.fish(A, cx - s * 0.62, iy0 + ih * 0.5, s, { pose: 'swim', ang: 0, c: T('#f3bd45'), back: T('#c8501c'), fin: T('#e8701e') });
        M.fish(A, cx + s * 0.62, iy0 + ih * 0.5, s, { pose: 'swim', ang: PI, c: T('#f3bd45'), back: T('#c8501c'), fin: T('#e8701e') });
        if (iw > ih * 3) { M.lotus(A, ix0 + iw * 0.12, iy0 + ih * 0.55, ih * 0.3, 'open', { stem: 0 }); M.lotus(A, ix1 - iw * 0.12, iy0 + ih * 0.55, ih * 0.3, 'bud', { stem: 0 }); }
      }
    });
    // the frame: a painted band between two ruled lines, flowers along it, a rosette at each corner
    const band = T(BAND[motif] || '#b8342a');
    for (const r of [rect(x0, y0, x1, y0 + bw), rect(x0, y1 - bw, x1, y1), rect(x0, y0, x0 + bw, y1), rect(x1 - bw, y0, x1, y1)]) A.fill(r, 'chalk', band, { w: 3, p: 1, passes: 2, ang: 0 });
    const fl = (px, py) => { for (let i = 0; i < 5; i++) { const a = i / 5 * 2 * PI; A.dot(px + Math.cos(a) * bw * 0.22, py + Math.sin(a) * bw * 0.22, 'chalk', T('#f3e6c0'), { w: bw * 0.22, p: 0.9 }); } A.dot(px, py, 'chalk', T('#e6b422'), { w: bw * 0.2, p: 1 }); };
    for (let xx = x0 + bw * 1.5; xx < x1 - bw; xx += bw * 2.2) { fl(xx, y0 + bw / 2); fl(xx, y1 - bw / 2); }
    for (let yy = y0 + bw * 1.5; yy < y1 - bw; yy += bw * 2.2) { fl(x0 + bw / 2, yy); fl(x1 - bw / 2, yy); }
    for (const r of [outer, inner]) A.outline(A.roughen(r, 0.5, 12, true), 'kajal', T('#2a1810'), { closed: true, w: 1, p: 0.75 });
    // the hour's light over all of it, and then what the years have done
    if (K.glaze) M.floorWash(A, outer, K.glaze, () => (K.gl || 0) * 1.4, 'over');
    M.wellAge(A, outer, [x0, y0, x1, y1], K, age, calm);
  };
  // what the years do to a wall painting: the colour sinks into the wall, the paint lifts off in small islands,
  // first to the white plaster and then to the stone, and near the water a skin of lime and green covers the rest
  M.wellAge = function (A, outer, b, K, age, calm) {
    const [x0, y0, x1, y1] = b, plaster = A.mix(K.wall, K.lime || '#efe2c4', 0.45), stone = A.mix(K.wall, K.deep, 0.08);
    M.floorWash(A, outer, K.recess, () => clamp(0.04 + age * 0.2, 0, 0.4), 'mul');
    M.floorWash(A, outer, A.mix(K.wall, K.lime || '#efe2c4', 0.2), () => clamp(0.03 + age * 0.24 + (calm || 0) * 0.3, 0, 0.8), 'over');
    if (age > 0.2) {
      M.floorCloud(A, outer, plaster, { scale: 8 + age * 9, seed: A.rr(0, 99), thr: 0.9 - age * 0.2, soft: 0.04, p: 0.9, w: 4, ang: A.rr(-1, 1) });
      M.floorCloud(A, outer, stone, { scale: 11 + age * 10, seed: A.rr(0, 99), thr: 0.93 - age * 0.2, soft: 0.04, p: 0.85, w: 4, ang: A.rr(-1, 1) });
      // the lifted edges of the bigger flakes
      for (let i = 0; i < Math.round(age * (x1 - x0) * (y1 - y0) / 1400); i++) { const px = A.rr(x0, x1), py = A.rr(y0, y1), r = A.rr(2, 6) * (0.6 + age); A.stroke(A.ellipse(px, py, r, r * A.rr(0.5, 0.9), A.rr(0, 3), A.rr(0, 2), A.rr(3, 5.5)), 'kajal', A.mix(K.deep, K.line, 0.5), { w: 0.6, p: 0.45 }); A.stroke(A.ellipse(px, py + 0.8, r, r * 0.7, 0, 3.6, 5.6), 'chalk', plaster, { w: 0.8, p: 0.5 }); }
    }
    if (age > 0.85) {
      M.floorWash(A, outer, A.mix(K.wall, K.lime || '#efe2c4', 0.3), () => 0.12, 'over');
      M.floorCloud(A, outer, A.mix(Array.isArray(K.moss) && typeof K.moss[0] === 'string' ? K.moss[0] : '#3f4a22', K.wall, 0.3), { scale: 22, seed: A.rr(0, 99), thr: 0.7, soft: 0.2, p: 0.5, w: 7 });
    }
  };

  /* ------------------------------------------------------------ A PAINTED LOTUS ROUNDEL */
  M.wellRoundel = function (A, cx, cy, r, K, o) {
    o = o || {}; const T = o.T || I, age = o.age || 0, calm = o.calm || 0;
    const disc = A.roughen(A.ellipse(cx, cy, r, r), 0.6, 10, true);
    A.fill(disc, 'side', A.mix(K.lime || '#efe2c4', K.wall, 0.3), { w: 12, p: 0.9, passes: 1 });
    A.fill(A.ellipse(cx, cy, r * 0.86, r * 0.86), 'pastel', T(o.ground || '#2a4a6a'), { w: 6, p: 1, passes: 2 });
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = i / n * 2 * PI - PI / 2, tip = [cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78];
      const pa = A.spline([[cx + Math.cos(a - 0.32) * r * 0.26, cy + Math.sin(a - 0.32) * r * 0.26], [cx + Math.cos(a - 0.2) * r * 0.58, cy + Math.sin(a - 0.2) * r * 0.58], tip, [cx + Math.cos(a + 0.2) * r * 0.58, cy + Math.sin(a + 0.2) * r * 0.58], [cx + Math.cos(a + 0.32) * r * 0.26, cy + Math.sin(a + 0.32) * r * 0.26]], true, 0.8);
      A.fill(pa, 'chalk', T(i % 2 ? '#f08aa0' : '#f3e6c0'), { w: Math.max(1.4, r * 0.06), p: 1, passes: 2 });
      A.outline(pa, 'kajal', T('#2a1810'), { closed: true, w: 0.7, p: 0.7 });
    }
    A.fill(A.ellipse(cx, cy, r * 0.22, r * 0.22), 'chalk', T('#e6b422'), { w: 2, p: 1, passes: 2 });
    for (let i = 0; i < 18; i++) { const a = i / 18 * 2 * PI; A.dot(cx + Math.cos(a) * r * 0.93, cy + Math.sin(a) * r * 0.93, 'chalk', T('#e6b422'), { w: Math.max(1.2, r * 0.07), p: 0.9 }); }
    A.outline(A.ellipse(cx, cy, r, r), 'kajal', T('#2a1810'), { closed: true, w: 1, p: 0.75 });
    A.outline(A.ellipse(cx, cy, r * 0.86, r * 0.86), 'kajal', T('#2a1810'), { closed: true, w: 0.7, p: 0.55 });
    if (K.glaze) M.floorWash(A, disc, K.glaze, () => (K.gl || 0) * 1.4, 'over');
    M.wellAge(A, disc, [cx - r, cy - r, cx + r, cy + r], K, age, calm);
  };

  /* ------------------------------------------------------------ A CARVED BAND ALONG A LEDGE */
  M.wellFrieze = function (A, x0, x1, y0, y1, K, kind, age) {
    const h = y1 - y0, lit = A.mix(K.face, K.lime || 'cream', 0.4), dk = A.mix(K.face, K.cast, 0.55), line = K.line;
    A.fill(rect(x0, y0, x1, y1), 'side', A.mix(K.face, K.riser, 0.25), { w: 6, p: 0.8, passes: 1, ang: 0 });
    if (kind === 'lotus') {
      const pw = h * 0.95;
      for (let x = x0 + A.rr(-pw, 0); x < x1; x += pw * A.rr(0.96, 1.04)) {
        const pa = A.spline([[x + 0.5, y1 - 1], [x + pw * 0.08, y0 + h * 0.4], [x + pw * 0.5, y0 + 1.5], [x + pw * 0.92, y0 + h * 0.4], [x + pw - 0.5, y1 - 1]], true, 0.6);
        A.fill(pa, 'chalk', lit, { w: Math.max(1.2, h * 0.12), p: 0.95, passes: 2 });
        M.floorWash(A, pa, dk, (xx) => 0.45 * sstep((xx - x - pw * 0.4) / (pw * 0.5)), 'mul');
        A.stroke([[x + pw * 0.5, y0 + h * 0.3], [x + pw * 0.5, y1 - 2]], 'kajal', A.mix(dk, line, 0.4), { w: 0.6, p: 0.5 });
        A.outline(pa, 'kajal', line, { closed: true, w: 0.75, p: 0.7 });
        if (A.chance(0.05 + age * 0.25)) M.wellChip(A, x + pw * A.rr(0.2, 0.8), y0 + A.rr(2, h - 2), A.rr(3, 6), K, { face: true });
      }
    } else {
      const pw = h * 1.3;
      for (let x = x0 + A.rr(-pw, 0), i = 0; x < x1; x += pw / 2, i++) {
        const up = i % 2 === 0, a = [x, up ? y1 - 2 : y0 + 2], b = [x + pw / 2, up ? y0 + 2 : y1 - 2];
        const tri = up ? [[x, y1 - 1], [x + pw / 2, y0 + 2], [x + pw, y1 - 1]] : [[x, y0 + 1], [x + pw / 2, y1 - 2], [x + pw, y0 + 1]];
        if (up) { A.fill(tri, 'chalk', i % 4 === 0 ? lit : A.mix(lit, dk, 0.3), { w: 2, p: 0.8, passes: 1 }); M.floorWash(A, tri, dk, (xx) => 0.4 * sstep((xx - x - pw * 0.45) / (pw * 0.3)), 'mul'); }
        A.stroke(wob(A, a, b, 0.4), 'kajal', line, { w: 0.85, p: 0.75 });
        A.stroke(wob(A, [a[0] + 3, a[1]], [b[0] + 3, b[1]], 0.4), 'kajal', line, { w: 0.6, p: 0.45 });
        if (A.chance(0.04 + age * 0.22)) M.wellChip(A, x + A.rr(0, pw), A.rr(y0 + 2, y1 - 2), A.rr(3, 6), K, { face: true });
      }
    }
    A.stroke(wob(A, [x0, y0 + 0.5], [x1, y0 + 0.5], 0.5), 'chalk', lit, { w: 1.4, p: 0.7 });
    A.stroke(wob(A, [x0, y0], [x1, y0], 0.5), 'kajal', line, { w: 0.9, p: 0.75 });
    A.stroke(wob(A, [x0, y1], [x1, y1], 0.5), 'kajal', line, { w: 0.9, p: 0.75 });
  };

  /* ------------------------------------------------------------ SALT AND WET */
  M.wellSalt = function (A, x0, x1, y, K, o) {
    o = o || {}; const k0 = o.k != null ? o.k : 1, white = o.c || '#f4f1e8';
    // the line is left by water that stood a little higher here and a little lower there, so it comes in pieces:
    // each piece its own strength and its own height, with bare stone between them
    for (let x = x0 + A.rr(-40, 60); x < x1;) {
      const L = A.rr(40, 230), xe = Math.min(x1, x + L), pts = [], ph = A.rr(0, 6), oy = A.rr(-3, 3), k = k0 * A.rr(0.4, 1.1);
      for (let xx = x; xx <= xe; xx += 8) pts.push([xx, y + oy + 3 * Math.sin(xx / 37 + ph) + 1.6 * (A.noise1(xx / 13 + ph, 3) - 0.5)]);
      if (pts.length > 1) {
        // the salt drawn up into the stone above the line as a haze, then the crust, thick in places and thin in others
        A.stroke(pts.map(p => [p[0], p[1] - 6]), 'side', white, { w: A.rr(9, 16), p: 0.12 * k, tin: 0.3, tout: 0.3 });
        for (let i = 0; i + 1 < pts.length;) {
          const j = Math.min(pts.length - 1, i + A.ri(1, 5));
          if (A.chance(0.85)) A.stroke(pts.slice(i, j + 1), 'chalk', white, { w: A.rr(1.2, 3.4), p: A.rr(0.35, 0.75) * k, tin: 0.25, tout: 0.25 });
          i = j + (A.chance(0.4) ? 1 : 0);
        }
        A.stroke(pts.map(p => [p[0], p[1] + 2.4]), 'side', A.mix(K.deep, K.wall, 0.3), { w: 3, p: 0.18 * k });
        for (const p of pts) {
          if (A.chance(0.4)) A.dot(p[0] + A.rr(-4, 4), p[1] - A.rr(2, 11), 'chalk', white, { w: A.rr(0.8, 2.2), p: A.rr(0.35, 0.7) * k });
          if (A.chance(0.08)) { const l = A.rr(4, 12); A.stroke([[p[0], p[1] + 1], [p[0] + A.rr(-1, 1), p[1] + l]], 'chalk', white, { w: A.rr(1, 1.8), p: 0.4 * k, tout: 0.7 }); }
        }
      }
      x = xe + (A.chance(0.3) ? A.rr(120, 340) : A.rr(24, 110));
    }
  };
  // a wet run down the stone: the side of a dark stick dragged down once, wide and soft, a deeper core in it
  M.wellWetStreak = function (A, x, y, len, w, K) {
    const pts = [], ph = A.rr(0, 6); for (let t = 0; t <= 1.0001; t += 0.1) pts.push([x + 3 * Math.sin(t * 4 + ph) * t + A.rr(-0.6, 0.6), y + len * t]);
    A.stroke(pts, 'side', A.mix(K.wall, K.deep, 0.55), { w: w * 1.8, p: A.rr(0.3, 0.44), tin: 0.02, tout: 0.85 });
    A.stroke(pts.slice(0, 8), 'side', A.mix(K.deep, K.wall, 0.25), { w: w * 0.7, p: A.rr(0.26, 0.4), tin: 0.02, tout: 0.75 });
    A.stroke(pts.slice(0, 7).map(p => [p[0] - w * 0.6, p[1]]), 'chalk', A.mix(K.lime || 'cream', K.wall, 0.45), { w: 0.8, p: 0.2, tout: 0.6 });
  };
  /* moss grown along a tread or a joint: a low lumpy run of it, pressed in as crumbs of three or four greens, paler
     crumbs on the crowns where the light catches, darker under it, and here and there a strand let down over the edge */
  M.wellMossPad = function (A, x0, x1, y, K, o) {
    o = o || {}; const h = o.h || 6, hang = o.hang != null ? o.hang : h * 0.6, k = o.k != null ? o.k : 1;
    const greens = Array.isArray(K.moss) ? K.moss : ['#4d5a2a', '#5f6e2c', '#3f4a22'], tips = Array.isArray(K.mossTip) ? K.mossTip : ['#a9b545', '#c6c66a'];
    const L = x1 - x0, sd = A.rr(0, 50), skew = A.rr(0.6, 1.6);
    // how tall the run is at x: rising and falling in lumps, never quite symmetrical
    const top = x => { const u = Math.pow(clamp((x - x0) / L, 0, 1), skew); return h * Math.pow(Math.sin(u * PI), 0.45) * (0.3 + 0.9 * A.noise1(x / 5 + sd, 3)); };
    const base = [];
    for (let x = x0; x <= x1; x += 2) base.push([x, y + A.rr(-0.4, 0.6)]);
    // a dark bed first, then the crumbs, then the light
    A.stroke(base, 'side', greens[greens.length - 1], { w: Math.max(2.4, h * 0.5), p: 0.55 * k, tin: 0.2, tout: 0.2 });
    const n = Math.round(L * (0.8 + h * 0.12));
    for (let i = 0; i < n; i++) { const x = A.rr(x0, x1), t = top(x); if (t < 0.6) continue; A.dot(x, y - A.rr(0, t), 'chalk', A.pick(greens), { w: A.rr(1.4, 2.8), p: A.rr(0.6, 0.95) * k }); }
    for (let i = 0; i < n * 0.45; i++) { const x = A.rr(x0, x1), t = top(x); if (t < 1.2) continue; A.dot(x, y - t * A.rr(0.55, 1), 'chalk', A.pick(tips), { w: A.rr(0.8, 1.9), p: A.rr(0.45, 0.85) * k }); }
    // under the run the stone is stained green-dark, and once in a while a strand hangs
    A.stroke(base.map(p => [p[0], p[1] + 1.6]), 'side', A.mix(greens[greens.length - 1], K.deep || '#20281c', 0.4), { w: 2.4, p: 0.3 * k, tin: 0.3, tout: 0.3 });
    if (hang > 1 && A.chance(0.35)) for (let i = 0, m = A.ri(1, 2); i < m; i++) { const x = A.rr(x0 + 2, x1 - 2), l = A.rr(hang, hang * 2.6); A.stroke([[x, y], [x + A.rr(-1, 1), y + l]], M.wellWet || 'chalk', A.pick(greens), { w: A.rr(1, 1.8), p: 0.7 * k, tin: 0, tout: 0.7 }); }
  };
  /* moss let down over the edge of a step like a beard: short wet strands, longer where it is thickest */
  M.wellBeard = function (A, x0, x1, y, K, o) {
    o = o || {}; const len = o.len || 8, sd = A.rr(0, 40);
    const greens = Array.isArray(K.moss) ? K.moss : ['#4d5a2a', '#5f6e2c', '#3f4a22'], tips = Array.isArray(K.mossTip) ? K.mossTip : ['#a9b545', '#c6c66a'];
    for (let x = x0; x < x1; x += A.rr(1.4, 2.6)) {
      const u = (x - x0) / (x1 - x0), l = len * Math.pow(Math.sin(u * PI), 0.5) * (0.3 + 0.9 * A.noise1(x / 6 + sd, 3)) * A.rr(0.6, 1.1);
      if (l < 1.5) continue;
      A.stroke([[x, y - 1], [x + A.rr(-0.8, 0.8), y + l]], M.wellWet || 'chalk', A.pick(greens), { w: A.rr(1.4, 2.4), p: A.rr(0.7, 0.95), tin: 0, tout: 0.55 });
    }
    for (let x = x0; x < x1; x += A.rr(3, 6)) A.dot(x, y - A.rr(0, 2), 'chalk', A.pick(tips), { w: A.rr(1, 2), p: 0.75 });
  };
})();
