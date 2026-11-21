(function () {
  'use strict';
  /* ==========================================================================
     THE PAINTER'S FLOOR, part two: the cat, the lamp and the bare floor.
       M.sleepingCat(A, x, y, s, ang, k, T, o)  a cat asleep in profile, as Mewar sets an animal on a carpet
                                                (x, y) the middle of the cat, s its length, k the breath (0, 1, 2)
       M.lampStand(A, x, y, s, lit, T)          a clay diya on a brass stand, standing up the way a Mewar painter
                                                sets a lamp on a carpet seen from above. (x, y) is where its foot meets the floor
       M.lampWickAt(x, y, s)                    the tip of the wick, where the flame stands
       M.floorFlame(A, x, y, h, ang, ph, T)     the flame on the wick; ang is the way it rises (-PI/2 is straight up)
     T is the hour: a function that turns a pigment into the colour it has in this light.
     ======================================================================== */
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const norm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  const pip = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) if ((poly[i][1] > y) !== (poly[j][1] > y) && x < (poly[j][0] - poly[i][0]) * (y - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0]) c = !c; return c; };

  // a polyline with its length measured, to ask for the point and the way it runs at any fraction of it
  function measured(pts) {
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = L[L.length - 1];
    return {
      pts, tot,
      at(f) {
        const d = clamp(f, 0, 1) * tot; let i = 1; while (i < L.length - 1 && L[i] < d) i++;
        const a = pts[i - 1], b = pts[i], t = (d - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
        return { q: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], tn: norm(sub(b, a)) };
      },
      near(p) {
        let bd = 1e9, bi = 1, bt = 0;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1;
          const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2, 0, 1), d = Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t);
          if (d < bd) { bd = d; bi = i; bt = t; }
        }
        const a = pts[bi - 1], b = pts[bi];
        return { q: [a[0] + (b[0] - a[0]) * bt, a[1] + (b[1] - a[1]) * bt], tn: norm(sub(b, a)), d: bd, f: (L[bi - 1] + (L[bi] - L[bi - 1]) * bt) / tot };
      }
    };
  }

  /* ================================================================== THE CAT
     A cat asleep in profile, the way a Mewar painter sets an animal down on a carpet he has drawn from above: the body
     lying along the floor, the head low on the forepaws, the tail laid round in front.  Drawn in a frame about 150
     across, y down, the head on the right and the floor line at y 40.  One flat ochre, the fur in fine conte lines, the
     edge in kajal that swells on the floor side and thins over the back, and one closed almond eye. */
  const CAT = {
    body: [[30, 0], [18, -9], [2, -15], [-16, -18], [-34, -20], [-50, -17], [-62, -8], [-69, 6], [-69, 20], [-63, 32], [-52, 39], [-34, 43], [-8, 44], [18, 43.5], [36, 41], [44, 34], [42, 22], [36, 10]],
    spine: [[34, 0], [18, -10], [-4, -15.5], [-30, -18.5], [-50, -14], [-63, -1], [-67, 16]],
    thighC: [-45, 17], thighR: 23,
    thigh: [[-30, -12], [-18, 0], [-16, 16], [-21, 32]],
    foot: [[-38, 34], [-14, 36], [-6, 38], [-2.5, 41], [-6, 44], [-38, 44.5]],
    legFar: [[26, 26], [52, 30], [66, 31], [72, 34], [71, 38], [50, 38], [28, 37]],
    legNear: [[24, 30], [48, 35], [62, 36], [71, 38.5], [74, 41.5], [72, 45], [44, 45.5], [24, 43]],
    head: [[34, 6], [38, -1], [46, -4], [55, -2], [62, 3], [68, 10], [72, 17], [71, 22], [66, 26], [56, 30], [44, 30], [36, 20]],
    ear: [[40.5, -1.5], [42.5, -9], [45, -16], [49, -9.5], [53.5, -3]],
    earFar: [[33.5, 1], [35.5, -9], [38, -13.5], [41.5, -5]],
    tail: [[-57, 30], [-67.5, 38.5], [-61, 45.5], [-44, 48.5], [-20, 49], [4, 48.5], [24, 47.5], [35, 45.5], [41, 42], [42.5, 37]],
    floor: 40
  };

  M.sleepingCat = function (A, x, y, s, ang, k, T, o) {
    o = o || {};
    A.reseed(o.seed || 41017);             // the same cat in every breath: only the breath changes
    const C = CAT, u = s / 150, br = 1 + 0.024 * (k || 0);
    const P = p => add([x, y], rot([p[0] * u, p[1] * u], ang));
    // the breath lifts the back off the floor line; the head, the legs and the tail lie still
    const W = p => P([p[0], C.floor + (p[1] - C.floor) * br]);
    const toD = (px, py) => { const q = rot([px - x, py - y], -ang); return [q[0] / u, q[1] / u]; };
    const ochre = T('#c98e42'), ochreL = T('#dfb26c'), ochreD = T('#a5692c'), cream = T('#ecd3a2');
    const conte = T('#7a4a22'), stripe = T(A.mix('#6a3818', 'sepia', 0.3)), ink = T('kajal'), earIn = T('#d99a7e');

    // ---- the shapes
    const sm = (pts, closed, st) => A.spline(pts, closed, st || 1.2);
    const bodyD = sm(C.body, true), headD = sm(C.head, true, 1), tailD = sm(C.tail, false, 1);
    const spine = measured(sm(C.spine, false));
    const body = A.roughen(bodyD.map(W), 0.25 * u, 7 * u, true);
    const head = A.roughen(headD.map(P), 0.15 * u, 4 * u, true);
    const foot = A.roughen(sm(C.foot, true, 1).map(P), 0.12 * u, 4 * u, true);
    const legF = A.roughen(sm(C.legFar, true, 1).map(P), 0.12 * u, 4 * u, true);
    const legN = A.roughen(sm(C.legNear, true, 1).map(P), 0.12 * u, 4 * u, true);
    const tw = t => 6.2 - 2.2 * t - 0.6 * sstep((t - 0.82) / 0.18);
    const tside = sg => tailD.map((q, i) => { const n = tailD.length - 1, a = tailD[Math.max(0, i - 1)], b = tailD[Math.min(n, i + 1)], tn = norm(sub(b, a)), w = tw(i / n); return [q[0] - tn[1] * w * sg, q[1] + tn[0] * w * sg]; });
    const tl = tside(1), tr = tside(-1), tcap = [];
    { const n = tailD.length - 1, f = norm(sub(tailD[n], tailD[n - 3])), nn = [-f[1], f[0]], w = tw(1); for (let a = 0.25; a < PI; a += 0.25) tcap.push([tailD[n][0] + (nn[0] * Math.cos(a) + f[0] * Math.sin(a)) * w, tailD[n][1] + (nn[1] * Math.cos(a) + f[1] * Math.sin(a)) * w]); }
    const tail = A.roughen(tl.concat(tcap, tr.slice().reverse()).map(P), 0.15 * u, 5 * u, true);
    const earN = A.roughen(sm(C.ear, false, 0.8).map(P), 0.1 * u, 3 * u, false), earF = sm(C.earFar, false, 0.8).map(P);
    const glz = [body, head, tail, legN, foot, earN];

    /* a line of kajal round a shape: it swells where the shape turns toward the floor and thins where it turns up into
       the light, and it is laid in two or three goes, the brush set down again a hair off where it was lifted */
    const inkLine = (poly, w, p, closed, o2) => {
      o2 = o2 || {};
      const n = poly.length; let cx = 0, cy = 0; for (const q of poly) { cx += q[0]; cy += q[1]; } cx /= n; cy /= n;
      if (o2.centre) { cx = o2.centre[0]; cy = o2.centre[1]; }
      const at = i => poly[closed ? (i + n) % n : clamp(i, 0, n - 1)];
      const pr = i => {
        const t = norm(sub(at(i + 2), at(i - 2))); let nx = t[1], ny = -t[0];
        if ((at(i)[0] - cx) * nx + (at(i)[1] - cy) * ny < 0) { nx = -nx; ny = -ny; }
        return (0.38 + 0.62 * sstep((rot([nx, ny], -ang)[1] + 0.3) / 1.05)) * (o2.k ? o2.k(toD(at(i)[0], at(i)[1])) : 1);
      };
      const goes = closed ? A.ri(2, 3) : 1, start = closed ? A.ri(0, n - 1) : 0, span = closed ? n : n - 1;
      for (let g = 0; g < goes; g++) {
        const i0 = start + Math.round(span * g / goes) - (g ? A.ri(1, 3) : 0), i1 = start + Math.round(span * (g + 1) / goes) + (closed ? A.ri(0, 2) : 0);
        const pts = [], off = g ? [A.rr(-0.25, 0.25), A.rr(-0.25, 0.25)] : [0, 0];
        for (let i = i0; i <= Math.min(i1, closed ? i1 : n - 1); i++) { const q = at(i); pts.push([q[0] + off[0], q[1] + off[1], pr(i)]); }
        A.stroke(pts, 'kajal', ink, { w, p, tin: 0.06, tout: 0.1 });
      }
    };
    // fine conte lines laid with the lie of the fur
    const hairs = (poly, n, dirAt, len, cs, pr) => {
      const bb = [1e9, 1e9, -1e9, -1e9]; for (const q of poly) { bb[0] = Math.min(bb[0], q[0]); bb[1] = Math.min(bb[1], q[1]); bb[2] = Math.max(bb[2], q[0]); bb[3] = Math.max(bb[3], q[1]); }
      for (let i = 0, t = 0; i < n && t < n * 30; t++) {
        const px = A.rr(bb[0], bb[2]), py = A.rr(bb[1], bb[3]); if (!pip(poly, px, py)) continue; i++;
        const d = toD(px, py), dir = dirAt(d), a = Math.atan2(dir[1], dir[0]) + A.rr(-0.08, 0.08), l = A.rr(len[0], len[1]);
        const q = [d[0] + Math.cos(a) * l, d[1] + Math.sin(a) * l], m = [(d[0] + q[0]) / 2 - Math.sin(a) * l * 0.07, (d[1] + q[1]) / 2 + Math.cos(a) * l * 0.07];
        A.stroke([P(d), P(m), P(q)], 'chalk', A.pick(cs), { w: A.rr(0.38, 0.55), p: A.rr(pr[0], pr[1]), tin: 0.2, tout: 0.6 });
      }
    };

    // ---- its shadow on the floor: one soft pool along the floor line, laid a little away from the window
    { const c0 = P([4, C.floor + 4]), c1 = P([-2, C.floor + 2.5]);
      M.floorUnion(A, [A.ellipse(c0[0] + 4 * u, c0[1] + 1.5 * u, 78 * u, 8.5 * u, ang)], T('#4a2c18'), () => 0.4, 4.5 * A.S);
      M.floorUnion(A, [A.ellipse(c1[0], c1[1], 70 * u, 3.6 * u, ang)], T('#3a2010'), () => 0.34, 1.6 * A.S);
      const tc = P([-20, 51]); M.floorUnion(A, [A.ellipse(tc[0] + 3 * u, tc[1], 50 * u, 3 * u, ang)], T('#3a2010'), () => 0.2, 2 * A.S); }

    // ---- behind: the far ear and the far foreleg, a shade deeper
    A.fill(earF.concat([P([37, 4])]), 'pastel', ochreD, { w: 1.6, p: 1, reach: 1.6, passes: 2, gap: 0.45 });
    A.stroke(earF, 'kajal', ink, { w: 0.8, p: 0.7, tin: 0.1, tout: 0.2 });
    A.fill(legF, 'pastel', A.mix(ochre, ochreD, 0.55), { w: 2.2 * u + 1, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
    A.withMask(legF, () => hairs(legF, 16, () => [1, 0.08], [3, 5], [conte, ochreD], [0.25, 0.45]));
    inkLine(legF, 0.9, 0.8, true);

    // ---- the body: laid flat in one ochre, paler under the belly, a breath deeper along the floor side of the haunch
    A.fill(body, 'pastel', ochre, { w: 4.2 * u, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang: ang + 0.15 });
    const flow = d => {
      const nr = spine.near(d), down = Math.min(1, nr.d / 24);
      let v = norm([nr.tn[0] * (1 - 0.55 * down), nr.tn[1] * (1 - 0.55 * down) + down * 0.95]);
      // on the haunch the hair turns round the thigh
      const tc = C.thighC, r = Math.hypot(d[0] - tc[0], d[1] - tc[1]), th = 1 - sstep((r - C.thighR * 0.7) / (C.thighR * 0.5));
      if (th > 0) { const rd = norm([d[0] - tc[0], d[1] - tc[1]]); v = norm([v[0] * (1 - th) + rd[1] * th, v[1] * (1 - th) - rd[0] * th]); }
      return v;
    };
    A.withMask(body, () => {
      M.floorWash(A, body, cream, (px, py) => { const d = toD(px, py); return 0.36 * sstep((d[1] - 26) / 12); });
      M.floorWash(A, body, ochreL, (px, py) => { const d = toD(px, py), nr = spine.near(d); return 0.28 * (1 - sstep(nr.d / 10)); });
      M.floorWash(A, body, ochreD, (px, py) => { const d = toD(px, py), tc = C.thighC; return 0.22 * sstep((Math.hypot(d[0] - tc[0] - 6, d[1] - tc[1] - 8) - 10) / 14) * (1 - sstep((Math.hypot(d[0] - tc[0], d[1] - tc[1]) - 26) / 6)); });
      // the fur: short fine conte lines with the lie of the coat, darker and paler ones mixed, thick nowhere
      hairs(body, 300, flow, [3.2, 5.4], [conte, conte, conte, ochreD, ochreL], [0.2, 0.38]);
      // the stripes: each two hairlines close together, drawn down from the spine across the flank and leaning back
      const hair = (pts, w, pr) => A.stroke(pts, 'kajal', stripe, { w, p: pr, tin: 0.08, tout: 0.6 });
      const NS = 9;
      for (let i = 0; i < NS; i++) {
        const f = 0.06 + i * 0.6 / (NS - 1) + A.rr(-0.015, 0.015), at = spine.at(f), nin = [at.tn[1], -at.tn[0]];
        const L = A.rr(15, 24) * (i < 2 ? 0.7 : 1), lean = A.rr(0.18, 0.3);
        for (let h = 0; h < 2; h++) {
          const off = (h - 0.5) * 1.6, pts = [];
          for (let t = 0; t <= 1.001; t += 0.125) { const r = L * t - 1, bend = lean * L * t * t + off; pts.push(W([at.q[0] + nin[0] * r + at.tn[0] * bend, at.q[1] + nin[1] * r + at.tn[1] * bend]).concat([1 - 0.6 * t])); }
          hair(pts, 0.6, A.rr(0.72, 0.86));
        }
      }
      // on the haunch the stripes turn round the thigh in arcs
      for (const r0 of [12, 19]) for (const dr of [0, 1.5]) {
        const a0 = -2.5 + A.rr(-0.1, 0.1), a1 = -1.35 + A.rr(-0.1, 0.1), pts = [];
        for (let t = 0; t <= 1.001; t += 0.1) { const a = a0 + (a1 - a0) * t, r = r0 - dr; pts.push(W([C.thighC[0] + Math.cos(a) * r * 1.05, C.thighC[1] + Math.sin(a) * r]).concat([0.5 + 0.5 * Math.sin(PI * t)])); }
        hair(pts, 0.5, 0.7);
      }
      A.blend(body, { r: 0.8 * u, k: 0.2 });
      // the line of the thigh, where the haunch stands out from the flank
      A.stroke(sm(C.thigh, false, 1).map((q, i, all) => W(q).concat([0.35 + 0.65 * Math.sin(PI * i / (all.length - 1))])), 'kajal', ink, { w: 0.85, p: 0.75, tin: 0.15, tout: 0.3 });
    });
    inkLine(body, 1.25, 0.88, true);

    // ---- the hind foot laid forward along the floor
    A.fill(foot, 'pastel', A.mix(ochre, cream, 0.25), { w: 2, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
    A.withMask(foot, () => hairs(foot, 12, () => [1, 0.05], [2.5, 4], [conte, ochreD], [0.2, 0.4]));
    inkLine(foot, 0.95, 0.85, true);
    for (const dd of [-1.6, 1.4]) { const b = [-2.5 + dd * 0.4, 40.5 + dd]; A.stroke([P(b), P([b[0] - 2.4, b[1] + dd * 0.1])], 'kajal', ink, { w: 0.42, p: 0.6 }); }

    // ---- the near foreleg, stretched out under the chin, its paw at the front
    A.fill(legN, 'pastel', ochre, { w: 2.4 * u + 1, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
    A.withMask(legN, () => {
      hairs(legN, 22, () => [1, 0.06], [3, 5], [conte, ochreD, ochreL], [0.22, 0.42]);
      M.floorWash(A, legN, cream, (px, py) => { const d = toD(px, py); return 0.4 * sstep((d[0] - 60) / 8); });
      for (const t of [0.35, 0.55]) for (const dd of [-0.8, 0.8]) { const bx = 24 + 44 * t + dd; A.stroke([P([bx, 31 + 5 * t]), P([bx + 1.6, 38 + 2 * t]), P([bx + 0.6, 44.5])], 'kajal', stripe, { w: 0.45, p: 0.68, tin: 0.1, tout: 0.3 }); }
    });
    inkLine(legN, 1.05, 0.86, true);
    for (const dy of [-1.8, 0.8, 3.2]) A.stroke([P([74.2 - Math.abs(dy) * 0.4, 41.5 + dy]), P([71.4 - Math.abs(dy) * 0.3, 41.6 + dy * 0.9])], 'kajal', ink, { w: 0.42, p: 0.6 });

    // ---- the tail laid round in front, its rings in pairs of hairlines, its tip a shade darker and lifted
    A.fill(tail, 'pastel', ochre, { w: 3 * u + 1, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    A.withMask(tail, () => {
      const n = tailD.length - 1;
      for (let i = 0; i < 46; i++) { const t = A.rr(0, 1), j = Math.round(t * n), a = tailD[Math.max(0, j - 1)], b = tailD[Math.min(n, j + 1)], tn = norm(sub(b, a)), off = A.rr(-1, 1) * tw(t), p = [tailD[j][0] - tn[1] * off, tailD[j][1] + tn[0] * off], l = A.rr(3, 5.5); A.stroke([P(p), P([p[0] + tn[0] * l, p[1] + tn[1] * l])], 'chalk', A.pick([conte, ochreD, ochreL]), { w: A.rr(0.38, 0.52), p: A.rr(0.22, 0.42), tin: 0.2, tout: 0.6 }); }
      A.stroke(tr.slice(2, -2).map(P), 'side', ochreL, { w: 2.6 * u, p: 0.3 });
      for (let t = 0.12; t < 0.86; t += A.rr(0.085, 0.11)) { const i = Math.round(t * n), a = tl[i], b = tr[i], f = norm(sub(tailD[Math.min(n, i + 1)], tailD[Math.max(0, i - 1)])); for (const dd of [-0.7, 0.7]) { const m = [(a[0] + b[0]) / 2 + f[0] * (1.8 + dd), (a[1] + b[1]) / 2 + f[1] * (1.8 + dd)]; A.stroke([P([a[0] + f[0] * dd * 0.6, a[1] + f[1] * dd * 0.6]), P(m), P([b[0] + f[0] * dd * 0.6, b[1] + f[1] * dd * 0.6])], 'kajal', stripe, { w: 0.48, p: 0.74, tin: 0.12, tout: 0.12 }); } }
      const tipAt = Math.round(0.94 * n); A.fill(tl.slice(tipAt).concat(tcap, tr.slice(tipAt).reverse()).map(P), 'pastel', A.mix(stripe, ochreD, 0.7), { w: 2, p: 0.8, reach: 1.6, passes: 2, gap: 0.45 });
    });
    // its edge, but not across its root: the root goes in behind the haunch, whose line is laid again over it
    inkLine(tl.slice(3).concat(tcap, tr.slice(3).reverse()).map(P), 1, 0.86, false, { centre: P([-10, 47]) });
    inkLine(sm(C.body, true).filter(q => q[0] < -50 && q[1] > 0).map(W), 1.25, 0.88, false, { centre: P(C.thighC) });

    // ---- the head, small and sleek, down on the paw
    A.fill(head, 'pastel', ochre, { w: 2.6 * u, p: 1, reach: 1.6, passes: 2, gap: 0.42, ang });
    A.withMask(head, () => {
      // the hair runs back from the nose over the brow and down the cheek
      hairs(head, 70, d => norm([-(d[0] - 74) , -(d[1] - 16) * 0.55 + 0.2]), [2.2, 3.8], [conte, ochreD, ochreL, conte], [0.2, 0.4]);
      // the muzzle and the chin a little paler
      M.floorWash(A, head, cream, (px, py) => { const d = toD(px, py); return 0.5 * (1 - sstep(Math.hypot((d[0] - 67) / 1.2, d[1] - 21) / 8)); });
      // three fine stripes back over the brow from above the eye
      for (const [y0, l] of [[-0.6, 11], [2, 12.5]]) A.stroke([P([60 - y0 * 0.4, y0]), P([54, y0 - 1.6]), P([60 - l, y0 - 2.4])].map((q, i) => q.concat([1 - 0.35 * i])), 'kajal', stripe, { w: 0.45, p: 0.72, tin: 0.05, tout: 0.6 });
    });
    // the back of the head and the throat, where they lie against the body, in a fainter line
    inkLine(head, 1, 0.88, true, { k: d => d[0] < 41 || (d[0] < 50 && d[1] > 27) ? 0.4 : 1 });
    // the near ear, set on over the line of the crown: pointed, its inside a warm rose-ochre with a few fine hairs
    A.fill(earN.concat([P([47, 1.5])]), 'pastel', ochre, { w: 1.6, p: 1, reach: 1.6, passes: 2, gap: 0.45 });
    { const inner = sm([[43.5, -3], [45, -12.5], [48.5, -4]], false, 0.6).map(P);
      A.fill(inner.concat([P([46, -1])]), 'chalk', earIn, { w: 1.2, p: 0.85, passes: 2, gap: 0.45 });
      for (let i = 0; i < 4; i++) A.stroke([P([46 + A.rr(-1, 1), -2.5]), P([45.2 + A.rr(-0.8, 0.8), -10 - A.rr(0, 3)])], 'chalk', T('#f2e2c0'), { w: 0.36, p: 0.6, tin: 0.2, tout: 0.6 });
      inkLine(earN, 0.95, 0.85, false); }

    /* the eye, shut: a long almond laid in one line of kajal, swelling in its middle, with the lid's crease a hairline
       above it and a fine tail drawn on back toward the ear */
    {
      const lash = []; for (let t = 0; t <= 1.001; t += 0.1) { const s2 = Math.sin(PI * t); lash.push([65 - 10.5 * t, 9.6 - 2.6 * t + 1.25 * s2, 0.45 + 0.6 * s2]); }
      const tail2 = [[53.5, 6.2, 0.5], [51.2, 4.9, 0.36], [49.2, 4.1, 0.2]];
      A.stroke(lash.concat(tail2).map(q => P(q).concat([q[2]])), 'kajal', ink, { w: 1.15, p: 0.95, tin: 0.08, tout: 0.4 });
      const crease = []; for (let t = 0; t <= 1.001; t += 0.125) { const s2 = Math.sin(PI * t); crease.push([64.2 - 9.2 * t, 8.3 - 2.3 * t - 1.7 * s2]); }
      A.stroke(crease.map((q, i) => P(q).concat([0.35 + 0.6 * Math.sin(PI * i / (crease.length - 1))])), 'kajal', ink, { w: 0.5, p: 0.66, tin: 0.15, tout: 0.15 });
      A.stroke([P([65, 9.6]), P([66.2, 10.9])], 'kajal', ink, { w: 0.55, p: 0.7, tout: 0.6 });
    }
    // the nose, a small dark leaf at the tip; the mouth one short straight line back from under it, no curve to it
    { const nose = sm([[70.2, 14.6], [72.6, 16.2], [71.4, 18.4], [69.8, 17.4]], true, 0.4).map(P);
      A.fill(nose, 'chalk', T(A.mix('#a8574a', 'sepia', 0.35)), { w: 1, p: 1, passes: 2, gap: 0.4 });
      A.stroke([P([71.2, 19.6]), P([68.6, 21.2]), P([65.6, 22.6])].map((q, i) => q.concat([1 - 0.3 * i])), 'kajal', ink, { w: 0.6, p: 0.78, tin: 0.05, tout: 0.4 });
      // whiskers, fine, from the muzzle forward; two over the eye
      for (const [y0, a, l] of [[18.2, -0.2, 17], [20, 0.02, 18], [21.8, 0.24, 15]]) { const b = [66.5, y0]; A.stroke([P(b), P([b[0] + Math.cos(a) * l * 0.55, b[1] + Math.sin(a) * l * 0.55 - 0.8]), P([b[0] + Math.cos(a) * l, b[1] + Math.sin(a) * l])], 'chalk', T('#f6ead0'), { w: 0.36, p: 0.7, tin: 0.05, tout: 0.7 }); A.dot(P(b)[0], P(b)[1], 'kajal', ink, { w: 0.5, p: 0.55 }); }
      for (const a of [-1.0, -0.75]) A.stroke([P([60, 3]), P([60 + Math.cos(a) * 9, 3 + Math.sin(a) * 9])], 'chalk', T('#f6ead0'), { w: 0.34, p: 0.55, tin: 0.05, tout: 0.7 }); }

    /* o.warm = {c, dir, k}: a light from one side (the lamp at night) glazed over the whole cat, strongest on the flank
       that faces it and gone by the far one, laid with the side of the stick so it is not even */
    if (o.warm) {
      const wd = norm(o.warm.dir), cm = P([-4, 12]), sd = A.rr(0, 40);
      M.floorUnion(A, glz, o.warm.c, (px, py) => {
        const v = ((px - cm[0]) * wd[0] + (py - cm[1]) * wd[1]) / (s * 0.42);
        return o.warm.k * sstep((v + 0.35) / 1.1) * (0.8 + 0.4 * A.noise2(px / 14 + sd, py / 14, 3));
      }, 1, null, { ang: Math.atan2(wd[1], wd[0]) + 1.2, len: 12, wid: 1.6, amt: 0.5 });
    }
  };

  /* ================================================================== THE LAMP
     A clay diya with a pinched spout, its cotton wick laid along the spout, set in the dish of a small brass stand. */
  M.lampWickAt = (x, y, s) => [x + 37 * s, y - 69 * s];
  M.lampStand = function (A, x, y, s, lit, T) {
    const P = (a, b) => [x + a * s, y + b * s];
    const E = (cx, cy, rx, ry, a0, a1) => A.ellipse(x + cx * s, y + cy * s, rx * s, ry * s, 0, a0, a1);
    const SP = (pts, closed, st) => A.spline(pts.map(q => P(q[0], q[1])), closed, st || 0.8);
    const brass = T(A.mix('ochre', 'haldi', 0.32)), brassD = T(A.mix('umber', 'ochre', 0.42)), brassDD = T(A.mix('umber', 'sepia', 0.3)), brassL = T('haldi'), ink = T('sepia');
    const clay = T('#b4532b'), clayD = T('#7e3417'), clayL = T('#d98550'), oil = T('#3d2814'), cotton = T('#f6eedb');
    const glint = lit ? T('#ffd27a') : T('khadi');

    // the shadows on the floor: a soft contact round the foot, and the lamp's own laid long away from the window
    M.floorUnion(A, [E(4, 1.5, 33, 10.5)], T('#4a2c18'), () => 0.42, 3 * A.S);
    if (!lit) M.floorUnion(A, [SP([[8, 2], [30, -2], [64, -6], [80, -9], [84, -4], [70, 4], [40, 8], [10, 8]], true)], T('#4a2c18'), () => 0.2, 5 * A.S);

    // ---- the foot: a wide flat rim, and a bell rising out of it to the stem
    const rim = A.roughen(E(0, 0, 31, 9), 0.2, 6, true);
    A.fill(rim, 'pastel', brass, { w: 3, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    A.withMask(rim, () => {
      A.stroke(E(0, 0.6, 29.5, 8, 0.15, 3), 'side', brassD, { w: 3.4 * s, p: 0.6 });
      A.stroke(E(0, -0.4, 29, 7.6, 2.4, 3.6), 'gold', 'gold', { w: 1.6 * s, p: 0.9 });
    });
    A.outline(rim, 'kajal', ink, { closed: true, w: 0.75, p: 0.7 });
    const bell = A.roughen(E(0, -1.4, 22, 6, 0, PI).concat(SP([[-22, -1.4], [-16, -4.6], [-9.5, -8.4], [-6, -12.4], [-4.6, -15], [4.6, -15], [6, -12.4], [9.5, -8.4], [16, -4.6], [22, -1.4]], false)), 0.15, 5, true);
    A.fill(bell, 'pastel', brass, { w: 2.6, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    A.withMask(bell, () => {
      A.fill(SP([[2, -16], [8, -11], [18, -4], [24, 2], [6, 6], [0, -2]], true), 'side', brassD, { w: 4 * s, p: 0.65 });
      A.stroke(SP([[-17, -2.6], [-11, -6.8], [-6.4, -11.6]], false), 'gold', 'gold', { w: 2.4 * s, p: 0.95 });
      A.stroke(SP([[-14, -2.6], [-8.5, -6.8]], false), 'chalk', glint, { w: 1.1 * s, p: 0.8 });
      // petals chased round the bell
      for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9, a = PI - t * PI, bx = Math.cos(a) * 19, by = -1.6 + Math.sin(a) * 4.8; A.stroke(SP([[bx - 2.2, by], [bx * 0.86, by - 4.2], [bx + 2.2, by]], false), 'kajal', brassDD, { w: 0.5, p: 0.5 }); }
    });
    A.outline(bell, 'kajal', ink, { closed: true, w: 0.7, p: 0.66 });

    // ---- the stem: a collar, a round knop, a ring, a collar
    const stem = A.roughen(SP([[-3.6, -15], [-4.4, -22], [-3.4, -31], [-3.8, -44], [3.8, -44], [3.4, -31], [4.4, -22], [3.6, -15]], true), 0.1, 4, true);
    A.fill(stem, 'pastel', brass, { w: 2, p: 1, reach: 1.6, passes: 2, gap: 0.45 });
    A.withMask(stem, () => { A.stroke([P(1.8, -15), P(1.8, -44)], 'side', brassD, { w: 3.4 * s, p: 0.65 }); A.stroke([P(-2, -16), P(-2, -43)], 'gold', 'gold', { w: 1.3 * s, p: 0.9 }); });
    A.outline(stem, 'kajal', ink, { closed: true, w: 0.6, p: 0.6 });
    for (const kn of [[-15.6, 6.4, 2.3], [-25, 9.4, 5.6], [-38, 7, 2.6], [-44.6, 6, 2.2]]) {
      const b = A.roughen(E(0, kn[0], kn[1], kn[2]), 0.1, 4, true);
      A.fill(b, 'pastel', brass, { w: 2, p: 1, reach: 1.6, passes: 2, gap: 0.45 });
      A.withMask(b, () => { A.stroke(E(0.6, kn[0] + kn[2] * 0.3, kn[1] * 0.9, kn[2] * 0.8, -0.3, 1.9), 'side', brassD, { w: kn[2] * 0.9 * s, p: 0.65 }); A.stroke(E(-0.4, kn[0] - kn[2] * 0.15, kn[1] * 0.75, kn[2] * 0.6, 3.3, 4.6), 'gold', 'gold', { w: Math.max(1, kn[2] * 0.35) * s, p: 0.95 }); });
      A.outline(b, 'kajal', ink, { closed: true, w: 0.6, p: 0.62 });
    }

    // ---- the dish the diya sits in
    const dish = A.roughen(E(0, -52.5, 29, 6.8).concat(), 0.15, 5, true);
    const dishLip = A.roughen(E(0, -51, 29, 6.8, 0, PI).concat(E(0, -52.5, 29, 6.8, 0, PI).reverse()), 0.1, 4, true);
    A.fill(dishLip, 'pastel', brassD, { w: 2, p: 1, reach: 1.6, passes: 2, gap: 0.45 });
    A.fill(dish, 'pastel', brass, { w: 2.4, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    A.withMask(dish, () => {
      A.fill(E(0.5, -52.2, 24.5, 5.2), 'side', A.mix(brass, brassD, 0.45), { w: 4 * s, p: 0.6 });
      A.stroke(E(0, -52.5, 27, 5.9, 2.7, 3.9), 'gold', 'gold', { w: 1.5 * s, p: 0.95 });
      A.stroke(E(0, -52.5, 27, 5.9, 5.3, 6.1), 'chalk', glint, { w: 1 * s, p: 0.7 });
      for (let i = 0; i < 24; i++) { const a = i * TAU / 24, q = P(Math.cos(a) * 26.6, -52.5 + Math.sin(a) * 5.8); A.dot(q[0], q[1], 'kajal', brassDD, { w: 0.55, p: 0.5 }); }
    });
    A.outline(dish, 'kajal', ink, { closed: true, w: 0.65, p: 0.65 });
    A.stroke(E(0, -51, 29, 6.8, 0.1, PI - 0.1), 'kajal', ink, { w: 0.55, p: 0.55 });

    // ---- the diya: fired clay, an almond pinched at one end into a spout
    const diya = A.roughen(SP([[-22, -63], [-15.5, -66.7], [-6, -68], [4, -68], [12, -67.3], [18, -66.8], [26, -67.1], [32.5, -67.4], [36.8, -66.6], [35.6, -64.9], [30, -63.4], [24.5, -60.6], [20.5, -57.6], [15, -54.6], [6, -52.6], [-4, -52.3], [-12, -53.4], [-18, -56.2], [-21.5, -59.8]], true, 0.7), 0.12, 4, true);
    M.floorUnion(A, [diya.map(q => [q[0] + 1.2 * s, q[1] + 1.4 * s])], T('#4a2c18'), () => 0.35, 1.2 * A.S);
    A.fill(diya, 'pastel', clay, { w: 2.2, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    A.withMask(diya, () => {
      // the round of the bowl: the far side away from the window in shade, a warm light down the near side
      A.fill(SP([[6, -60], [14, -60], [22, -59], [30, -62], [36, -66], [24, -50], [8, -50]], true), 'side', clayD, { w: 4 * s, p: 0.55 });
      A.stroke(SP([[-19, -59.5], [-14, -55.6], [-7, -53.6]], false), 'side', clayL, { w: 3.2 * s, p: 0.7 });
      A.stroke(SP([[-17.4, -59.6], [-12, -56.4]], false), 'chalk', lit ? T('#ffc070') : T('#f0b48a'), { w: 1 * s, p: 0.7 });
      // a band painted round it: a line of red earth and a row of white dots, as a potter's daughter does at Diwali
      A.stroke(SP([[-20.4, -59.4], [-12, -56], [0, -55], [12, -56], [20, -58.6]], false), 'chalk', T('#8f2a16'), { w: 0.8 * s, p: 0.7 });
      for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9, xx = -18 + t * 36, yy = -57.3 + Math.sin(t * PI) * 1.4 - (t > 0.8 ? (t - 0.8) * 4 : 0); const q = P(xx, yy); A.dot(q[0], q[1], 'chalk', T('khadi'), { w: 1.15 * s, p: 0.9 }); }
      // the clay is fired unevenly: a few soft dark patches
      for (let i = 0; i < 4; i++) { const q = P(A.rr(-16, 22), A.rr(-60, -54)); A.dot(q[0], q[1], 'side', clayD, { w: A.rr(3, 5) * s, p: 0.22 }); }
    });
    // the opening: the rim's lip, the dark oil inside, the groove of the spout
    const mouth = A.roughen(E(0, -63.4, 19.6, 3.9).slice(), 0.1, 4, true);
    A.fill(mouth, 'pastel', oil, { w: 1.6, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
    const groove = SP([[15, -65.6], [24, -66.3], [33, -66.6], [34.6, -66.2], [33, -65.4], [24, -64.8], [15, -64]], true, 0.5);
    A.fill(groove, 'chalk', oil, { w: 0.9, p: 1, passes: 2, gap: 0.45 });
    A.withMask(mouth, () => {
      A.fill(E(-2, -64.6, 17, 1.8), 'side', T('#5a3c1c'), { w: 2.4 * s, p: 0.5 });
      // the sheen of the oil: the window in it by day, the flame in it by night
      A.stroke(SP([[-13.5, -63.6], [-8, -64.6], [-2.5, -64.8]], false), 'chalk', lit ? T('#f6c060') : T('#efe6cc'), { w: 1.1 * s, p: 0.85, tin: 0.3, tout: 0.4 });
      A.stroke(SP([[-6, -62.4], [-1, -62.6]], false), 'chalk', lit ? T('#e8963a') : T('#c9b88e'), { w: 0.6 * s, p: 0.6 });
      if (lit) A.dot(P(12, -63.8)[0], P(12, -63.8)[1], 'chalk', T('#ffd27a'), { w: 2.2 * s, p: 0.8, len: 0.6 });
    });
    A.stroke(E(0, -63.4, 21.3, 4.7, 0.05, PI - 0.05), 'chalk', clayL, { w: 1.1 * s, p: 0.8 });
    A.outline(mouth, 'kajal', T('maroon'), { closed: true, w: 0.4, p: 0.45, again: 0 });
    A.outline(diya, 'kajal', T('maroon'), { closed: true, w: 0.8, p: 0.78 });
    // the wick: a twist of cotton lying from the oil up along the spout, its end burnt
    const wick = SP([[19, -64.9], [24, -65.9], [29, -66.4], [33, -66.9], [35.6, -67.9], [37, -69]], false, 0.4);
    A.stroke(wick, 'chalk', cotton, { w: 2.3 * s, p: 0.95, tin: 0.3, tout: 0.08 });
    A.stroke(wick.slice(0, Math.ceil(wick.length * 0.45)), 'chalk', T('#a88a58'), { w: 1.9 * s, p: 0.6, tin: 0.5, tout: 0.5 });
    A.stroke(wick.slice(Math.floor(wick.length * 0.4)).map(q => [q[0], q[1] - 0.5 * s]), 'chalk', T('#fffaf0'), { w: 0.8 * s, p: 0.7, tin: 0.3, tout: 0.3 });
    for (let i = 1; i < wick.length - 3; i += 2) { const q = wick[i], q2 = wick[i + 1], a = Math.atan2(q2[1] - q[1], q2[0] - q[0]) + 1.1; A.stroke([[q[0] - Math.cos(a) * 0.9 * s, q[1] - Math.sin(a) * 0.9 * s], [q[0] + Math.cos(a) * 0.9 * s, q[1] + Math.sin(a) * 0.9 * s]], 'kajal', T('#a08660'), { w: 0.4, p: 0.55 }); }
    const tip = M.lampWickAt(x, y, s);
    A.dot(tip[0] - 0.4 * s, tip[1] + 0.3 * s, 'chalk', lit ? T('#e4702a') : T('kajal'), { w: 2.1 * s, p: 1 });
    if (!lit) A.dot(tip[0] - 1.2 * s, tip[1] + 0.9 * s, 'chalk', T('#5a4a3a'), { w: 1.5 * s, p: 0.8 });
    return tip;
  };

  // the flame on the wick: ph changes its lean and its length. Red-gold at its edge, yellow in it, white at its heart,
  // a bead of blue where it meets the wick.
  M.floorFlame = function (A, x, y, h, ang, ph, T) {
    const lean = Math.sin(ph * 2.1) * 0.16, a = ang + lean, len = h * (1 + 0.12 * Math.sin(ph * 3.3 + 1));
    const tear = (k, wk) => { const P = (u, v) => add([x, y], rot([u * len * k, v * h * wk], a)); return A.spline([P(-0.1, 0), P(0.06, -0.3), P(0.34, -0.36), P(0.66, -0.2 + 0.05 * Math.sin(ph * 4)), P(1, 0.05 * Math.sin(ph * 5)), P(0.66, 0.2 + 0.05 * Math.sin(ph * 4)), P(0.34, 0.36), P(0.06, 0.3)], true, 0.6); };
    A.fill(tear(1.1, 0.7), 'chalk', T('#e2622a'), { w: Math.max(1, h * 0.18), p: 0.55, reach: 1.7, passes: 1, gap: 0.5, ang: a });
    A.fill(tear(1, 0.6), 'chalk', T('saffron'), { w: Math.max(1.2, h * 0.2), p: 1, reach: 1.7, passes: 2, gap: 0.4, ang: a });
    A.fill(tear(0.76, 0.42), 'chalk', T('haldi'), { w: Math.max(1, h * 0.16), p: 1, reach: 1.7, passes: 2, gap: 0.4, ang: a });
    A.fill(tear(0.45, 0.26), 'chalk', T('#fff6dc'), { w: Math.max(1, h * 0.12), p: 1, reach: 1.6, passes: 2, gap: 0.4, ang: a });
    A.outline(tear(1, 0.6), 'chalk', T('#c2401c'), { closed: true, w: 0.55, p: 0.55 });
    A.dot(x + Math.cos(a) * h * 0.02, y + Math.sin(a) * h * 0.02, 'chalk', T('lapis'), { w: h * 0.13, p: 0.65 });
  };
  /* ====================================================================== THE BARE FLOOR
     What the edges of a painter's floor keep, all of it quiet: the fans a grass broom leaves in the lime dust, the corner
     of a mandana drawn there for a festival and half scrubbed away by feet since, the prints of fingers wiped clean on
     the floor, and a rag.
       M.broomSweeps(A, W, H, T, o)              fans of hair-fine tracks round the sweeper's hand; o.keep(x, y) 0..1 says
                                                 where the floor is bare (a sweep is laid only where it is)
       M.mandanaCorner(A, x, y, r, a0, T)        a konia: the quarter of a mandana that fills a corner of the room, in
                                                 khadiya on a geru ground.  (x, y) the corner, r its reach, a0 the way of
                                                 its first wall (it turns a quarter round from there)
       M.fingerprints(A, prints, T)              [[x, y, ang, pigment, strength], ...]  ang is the way the finger pointed
       M.paintRag(A, x, y, s, ang, T)            a square of old khadi bunched up, brushes wiped on it; s its width
     ======================================================================== */
  M.broomSweeps = function (A, W, H, T, o) {
    o = o || {};
    const keep = o.keep || (() => 1), n = o.n || Math.round(W * H / 5200);
    const grit = T(A.mix('umber', 'stone', 0.5)), lime = T('#fffaf0'), sd = A.rr(0, 40);
    for (let s = 0; s < n; s++) {
      const x = A.rr(-20, W + 20), y = A.rr(-20, H + 20);
      if (keep(x, y) < 0.5) continue;
      // the sweeper stands back from the sweep and the bristles turn about the hand: their tracks are arcs, one inside
      // the next, spread a little unevenly, some of them stopping short or starting late
      const R = A.rr(140, 250), dir = TAU * A.noise2(x / 560 + sd, y / 560, 7) * 1.4 + A.rr(-0.5, 0.5);
      const px = x - Math.cos(dir) * R, py = y - Math.sin(dir) * R, turn = A.chance(0.5) ? 1 : -1;
      const span = A.rr(50, 105) / R, a0 = dir - turn * span * A.rr(0.35, 0.65), nb = A.ri(8, 16), str = A.rr(0.45, 1);
      let rj = R - nb * 0.9;
      for (let j = 0; j < nb; j++) {
        rj += A.rr(1.1, 2.6);
        if (A.chance(0.16)) continue;
        const b0 = a0 + turn * span * A.rr(-0.06, 0.12), b1 = a0 + turn * span * A.rr(0.75, 1.04);
        const sk = A.rr(0, 30);
        const pts = A.ellipse(px, py, rj, rj * A.rr(0.985, 1.015), 0, Math.min(b0, b1), Math.max(b0, b1))
          .map(q => [q[0], q[1], keep(q[0], q[1]) * (0.35 + 0.65 * A.noise2(q[0] / 18 + sk, q[1] / 18, 3))]);
        const dark = A.chance(0.6);
        A.stroke(pts, 'chalk', dark ? grit : lime, { w: A.rr(0.5, 0.85), p: (dark ? 0.27 : 0.36) * str * A.rr(0.7, 1.1), tin: 0.22, tout: 0.32, wob: 0.3 });
      }
      // now and then the broom lifted a little dust and set it down at the end of the sweep
      if (A.chance(0.3)) {
        const e = [px + Math.cos(a0 + turn * span) * R, py + Math.sin(a0 + turn * span) * R];
        for (let i = 0; i < A.ri(6, 14); i++) A.dot(e[0] + A.rr(-6, 6), e[1] + A.rr(-6, 6), 'chalk', grit, { w: A.rr(0.5, 1.2), p: A.rr(0.15, 0.3), len: A.rr(0, 0.5) });
      }
    }
  };

  M.mandanaCorner = function (A, x, y, r, a0, T) {
    const span = PI / 2, sd = A.rr(0, 50);
    const P = (a, d) => [x + Math.cos(a) * d, y + Math.sin(a) * d];
    // feet wore it unevenly: it holds best in the corner itself and is nearly gone where the room is walked on
    const wear = (px, py) => {
      const d = Math.hypot(px - x, py - y) / r;
      return clamp((0.25 + 0.9 * sstep((A.fbm(px / 46 + sd, py / 46, 3, 21) - 0.3) / 0.38)) * (1.05 - 0.5 * d) * (0.7 + 0.5 * A.noise2(px / 9 + sd, py / 9, 4)), 0, 1);
    };
    // the ground: geru rubbed into the lime with a wet cloth, its edge ragged, the floor's grain still showing through
    {
      const pts = [[x, y]];
      for (let i = 0; i <= 40; i++) { const a = a0 + span * (i / 40) * 1.08 - span * 0.04, d = r * (1.02 + 0.05 * (A.noise2(i / 5 + sd, 1, 6) - 0.5)); pts.push(P(a, d)); }
      M.floorWash(A, pts, T('#c47e5c'), (px, py) => 0.62 * (0.45 + 0.7 * A.fbm(px / 60 - sd, py / 60, 3, 22)) * (1 - 0.45 * sstep(Math.hypot(px - x, py - y) / r - 0.55) * 2), 'mul');
    }
    const chalk = T('#fbf4e2'), lw = r * 0.0125;
    // a khadiya line, set down by a finger dipped in chalk: thick where it was dipped, thinning, a little wavering
    const line = (pts, w, p) => {
      const q = pts.map((t, i) => [t[0] + A.rr(-0.25, 0.25), t[1] + A.rr(-0.25, 0.25), 0.42 + 0.58 * wear(t[0], t[1]) * (0.75 + 0.25 * Math.cos(i * 0.11 + sd))]);
      A.stroke(q, 'chalk', chalk, { w: (w || 1) * lw * A.rr(0.9, 1.1), p: (p || 0.95) * A.rr(0.9, 1.05), tin: 0.08, tout: 0.14, wob: 0.6 });
    };
    const arc = (d, b0, b1) => { const pts = []; const n = Math.max(6, Math.round(span * d / 3)); for (let i = 0; i <= n; i++) { const a = a0 + span * (b0 + (b1 - b0) * i / n), dd = d * (1 + 0.012 * (A.noise2(i / 6 + d, sd, 8) - 0.5) * 2); pts.push(P(a, dd)); } return pts; };
    // drawn in a few pulls, as a hand does, never as one perfect quarter
    const ring = (d, w) => { let b = -0.03; while (b < 1.02) { const e = Math.min(1.04, b + A.rr(0.28, 0.5)); line(arc(d, b, e), w); b = e - A.rr(-0.01, 0.03); } };
    ring(r * 0.95, 0.9); ring(r * 0.89, 1.1);
    // a band of teeth, a dot set in each
    {
      const d0 = r * 0.74, d1 = r * 0.87, nT = Math.round(span * d1 / (r * 0.085)), zig = [];
      for (let i = 0; i <= nT * 2; i++) { const t = i / (nT * 2), a = a0 + span * t; zig.push(P(a + A.rr(-0.004, 0.004), i % 2 ? d1 - A.rr(0, 1) : d0 + A.rr(0, 1.5))); }
      for (let i = 0; i < zig.length - 1; i += 7) line(zig.slice(i, Math.min(zig.length, i + 8)), 0.85);
      for (let i = 0; i < nT; i++) { const a = a0 + span * (i + 0.5) / nT, q = P(a + A.rr(-0.006, 0.006), d1 - (d1 - d0) * 0.36); A.dot(q[0], q[1], 'chalk', chalk, { w: lw * 1.5, p: 0.5 + 0.45 * wear(q[0], q[1]), len: lw * 0.2 }); }
    }
    ring(r * 0.72, 1);
    // a string of dots, each a fingertip
    { const d = r * 0.66, nD = Math.round(span * d / (r * 0.045)); for (let i = 0; i <= nD; i++) { const a = a0 + span * (i + A.rr(-0.12, 0.12)) / nD, q = P(a, d + A.rr(-0.8, 0.8)); A.dot(q[0], q[1], 'chalk', chalk, { w: lw * A.rr(1.4, 1.9), p: 0.5 + 0.45 * wear(q[0], q[1]), len: lw * 0.25 }); } }
    ring(r * 0.6, 1);
    // the quarter lotus: four petals out of the corner, each drawn twice round, a seed in the heart of each
    const petal = (am, half, d0, d1) => {
      const L = [], R = []; const n = 14;
      for (let i = 0; i <= n; i++) { const t = i / n, w = half * Math.sin(PI * Math.pow(t, 0.8)) * (1 - 0.25 * t), d = d0 + (d1 - d0) * t; L.push(P(am - w, d)); R.push(P(am + w, d)); }
      return L.concat(R.reverse());
    };
    for (let i = 0; i < 4; i++) {
      const am = a0 + span * (i + 0.5) / 4 + A.rr(-0.015, 0.015), half = span / 8 * A.rr(0.86, 0.96);
      line(petal(am, half, r * 0.13, r * 0.56), 1.05);
      line(petal(am, half * 0.58, r * 0.2, r * 0.45), 0.75, 0.8);
      const q = P(am, r * 0.31); A.dot(q[0], q[1], 'chalk', chalk, { w: lw * 2, p: 0.5 + 0.45 * wear(q[0], q[1]), len: lw * 0.3 });
    }
    // the heart in the corner, a small quarter round filled with dots
    ring(r * 0.12, 0.9);
    for (let i = 0; i < 5; i++) { const q = P(a0 + span * (0.12 + 0.76 * A.rnd()), r * A.rr(0.03, 0.09)); A.dot(q[0], q[1], 'chalk', chalk, { w: lw * 1.2, p: 0.85, len: lw * 0.2 }); }
    // and the whole of it rubbed, so the chalk sits in the tooth of the lime
    A.blend([[x, y], P(a0 - 0.05, r * 1.06), P(a0 + span * 0.5, r * 1.08), P(a0 + span + 0.05, r * 1.06)], { r: 1.6, k: 0.35 });
  };

  M.fingerprints = function (A, prints, T) {
    for (const f of prints) {
      const x = f[0], y = f[1], ang = f[2], c = T(f[3]), k = f[4] == null ? 1 : f[4];
      const rx = A.rr(4.4, 5.3), ry = rx * A.rr(1.2, 1.34), ca = Math.cos(ang), sa = Math.sin(ang);
      // ang is the way the finger pointed: the long axis of the print runs that way
      const oval = A.roughen(A.ellipse(x, y, ry, rx, ang), 0.3, 4, true);
      const loc = (px, py) => { const u = (px - x) * ca + (py - y) * sa, v = -(px - x) * sa + (py - y) * ca; return Math.hypot(u / ry, v / rx); };
      const sk = A.rr(0, 40);
      // the film of colour the pad leaves, heaviest where it pressed
      M.floorWash(A, oval, c, (px, py) => 0.2 * k * clamp(1 - Math.pow(loc(px, py), 2.5), 0, 1) * (0.6 + 0.6 * A.noise2(px / 3 + sk, py / 3, 5)));
      // the ridges: a whorl in the middle of the pad, opening into loops toward the joint
      const cx = x + ca * ry * 0.12, cy = y + sa * ry * 0.12, open = A.rr(0.5, 1.1);
      A.pushMask(oval, 0.5);
      let rr2 = A.rr(0.5, 0.9);
      while (rr2 < ry * 1.25) {
        const tilt = ang + A.rr(-0.08, 0.08), gapA = rr2 > ry * 0.45 ? open * Math.min(1, (rr2 - ry * 0.45) / (ry * 0.5)) : 0;
        // the loops are open toward the joint, behind the finger's way
        const a1 = PI + gapA / 2, a2 = PI + TAU - gapA / 2;
        const pts = A.ellipse(cx, cy, rr2, rr2 * 0.8, tilt, a1, a2).map(q => [q[0] + A.rr(-0.12, 0.12), q[1] + A.rr(-0.12, 0.12), clamp((1.15 - Math.pow(loc(q[0], q[1]), 3)) * (0.5 + 0.65 * A.noise2(q[0] / 2.2 + sk, q[1] / 2.2, 6)), 0, 1)]);
        A.stroke(pts, 'kajal', c, { w: A.rr(0.38, 0.5), p: 0.85 * k, tin: 0.05, tout: 0.05, wob: 0.25 });
        rr2 += A.rr(0.95, 1.2);
      }
      A.popMask();
    }
  };

  M.paintRag = function (A, x, y, s, ang, T) {
    const P = (u, v) => add([x, y], rot([u * s, v * s], ang));
    const jit = (q, k) => [q[0] + A.rr(-k, k), q[1] + A.rr(-k, k)];
    /* a square of cloth folded once and dropped: its sides fall in soft waves, one corner turned back over it.  The
       outline runs round the cloth with that corner cut off along the fold; the turned-back flap is laid over it. */
    const fa = [0.1, -0.37], fb = [0.53, -0.02];          // the fold line, across the top right corner
    const cp = [[-0.5, -0.29], [-0.3, -0.35], [-0.08, -0.31], fa, fb, [0.5, 0.14], [0.54, 0.29], [0.3, 0.33], [0.06, 0.36], [-0.2, 0.31], [-0.47, 0.35], [-0.52, 0.12], [-0.47, -0.08]];
    const base = A.roughen(A.spline(cp.map(q => P(...jit(q, 0.018))), true, 2), s * 0.008, 8, true);
    const flapPts = [P(...fa), P(fa[0] + 0.1, -0.14), P(0.21, -0.06), P(0.33, -0.04), P(...fb)].map(q => jit(q, 0.4));
    const flap = A.roughen(A.spline(flapPts, true, 2), s * 0.006, 8, true);
    // its shadow on the lime, soft
    M.floorUnion(A, [base.map(q => [q[0] + 2.2, q[1] + 3.2])], T('umber'), () => 0.3, 3, 'mul');
    // undyed khadi gone grey with washing
    const cloth = T(A.mix(A.mix('khadi', 'stone', 0.5), 'sand', 0.1)), deep = T(A.mix(A.mix('khadi', 'stone', 0.6), 'umber', 0.22));
    M.floorWash(A, base, cloth, () => 0.8);
    A.fill(base, 'pastel', cloth, { w: 4, p: 0.88, passes: 2, gap: 0.45, ang: ang + 0.3 });
    A.pushMask(base, 0.4);
    // the folds: soft valleys running across it where it bunched, each with a ridge of light beside it
    for (let i = 0; i < 4; i++) {
      const u = -0.38 + i * 0.22 + A.rr(-0.04, 0.04), bend = A.rr(-0.08, 0.08);
      const pts = [P(u + A.rr(-0.05, 0.05), -0.42), P(u + bend, -0.05), P(u + A.rr(-0.06, 0.06), 0.42)];
      A.stroke(pts, 'side', deep, { w: s * A.rr(0.05, 0.08), p: A.rr(0.28, 0.4), flow: 0.5, tin: 0.25, tout: 0.3 });
      A.stroke(pts.map(q => add(q, rot([2.2, 0], ang))), 'chalk', T('khadi'), { w: A.rr(0.8, 1.2), p: A.rr(0.28, 0.42), tin: 0.3, tout: 0.4 });
    }
    // where the brushes were wiped: a long drag of vermilion, a smaller one of lapis, a touch of green and of turmeric
    const wipe = (pig, u0, v0, u1, v1, w, p) => { const a = P(u0, v0), b = P(u1, v1), m = [(a[0] + b[0]) / 2 + A.rr(-2, 2), (a[1] + b[1]) / 2 + A.rr(-2, 2)]; A.stroke([a, m, b], 'side', T(pig), { w: w * s, p, flow: 0.5, tin: 0.08, tout: 0.6 }); };
    wipe('hingul', -0.4, 0.02, 0.0, -0.1, 0.085, 0.46); wipe('hingul', -0.3, 0.1, -0.08, 0.04, 0.045, 0.36);
    wipe('lapis', 0.06, 0.2, 0.36, 0.14, 0.065, 0.4);
    wipe('malachite', -0.38, 0.24, -0.2, 0.27, 0.04, 0.36);
    // the flap throws a shadow on the cloth under it, along its open edge
    A.stroke([P(fa[0] + 0.08, -0.13), P(0.22, -0.02), P(0.36, 0.01), P(fb[0] - 0.02, fb[1] + 0.04)], 'side', deep, { w: s * 0.06, p: 0.42, flow: 0.5, tin: 0.2, tout: 0.3 });
    A.popMask();
    // the flap, the cloth's other face: the same khadi, a little in shadow, the turmeric wiped through to this side
    const under = T(A.mix(A.mix('khadi', 'stone', 0.5), 'sand', 0.12));
    M.floorWash(A, flap, under, () => 0.85);
    A.fill(flap, 'pastel', under, { w: 3, p: 0.88, passes: 2, gap: 0.45, ang: ang - 0.6 });
    A.pushMask(flap, 0.3);
    wipe('haldi', 0.2, -0.24, 0.36, -0.12, 0.05, 0.4);
    A.stroke([P(...fa), P(...fb)], 'side', deep, { w: s * 0.04, p: 0.3, flow: 0.5 });
    A.popMask();
    // the outline in sepia, as a painter sets a cloth down: a fine line, heavier where it turns under
    A.outline(base, 'kajal', T('sepia'), { closed: true, w: 0.66, p: 0.62, pull: 34 });
    A.outline(flap, 'kajal', T('sepia'), { closed: true, w: 0.6, p: 0.58, pull: 30 });
    // a few threads come loose from the torn edge at the left
    for (let i = 0; i < 5; i++) {
      const q = P(-0.5 + A.rr(-0.02, 0.02), A.rr(-0.24, 0.3)), d = rot([-1, A.rr(-0.4, 0.4)], ang), l = A.rr(3, 7), b = A.rr(-0.8, 0.8);
      A.stroke([q, [q[0] + d[0] * l * 0.5 + b, q[1] + d[1] * l * 0.5 - b], [q[0] + d[0] * l + b * 1.5, q[1] + d[1] * l]], 'pencil', T(A.mix('stone', 'umber', 0.2)), { w: 0.45, p: 0.45, tin: 0, tout: 0.5 });
    }
  };
})();
