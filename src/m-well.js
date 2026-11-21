(function () {
  'use strict';
  /* ==========================================================================
     THE STEPWELL: STONE, STAIRS, ALCOVES, THE GAUGE
     The far wall of a deep well, drawn flat the Mewar way: every flight of steps in profile,
     every tread seen a little from above, the light of the hour laid as flat colour.
       M.wellStone(A, poly, K, o)            a field of lime-washed stone in the hour's colour
       M.wellShadow(A, polys, K, off, k)     the shadow the stone masses throw on the wall behind
       M.wellMass(A, m, K, age)              one double flight (a stair pyramid) with its treads
       M.wellLedge(A, x0, x1, y, h, K, age)  a terrace or floor ledge running across the wall
       M.wellAlcove(A, x, yb, w, h, K, age)  an arched niche cut into a mass
       M.wellPier(A, x0, x1, y0, y1, K, side, age)  the side wall where the well narrows, with frontal steps
       M.wellGauge(A, g, keyAt)              the carved water gauge on the left wall (no numerals)
       M.wellFloodLine, M.wellPlaque, M.wellTie       milestones: a painted line, a blank plaque, marigolds
       M.wellStains, M.wellTide, M.wellPeel, M.wellLichen, M.wellMoss, M.wellFern, M.wellPeepal, M.wellDrip, M.wellChip
     K is the key of the hour (see stage-well.js): wall, recess, face, tread, riser, cast, deep, line ...
     The tools: soft pastel (stick and side), conte chalk, kajal, gold crayon, and pastel dipped in water
     (WET below) for stone that is wet and for moss: denser, darker, sunk into the tooth.
     ======================================================================== */
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const H = () => M.cityHand;
  // a soft pastel stick dipped in water: it lays down a denser, darker mark that fills the tooth and dries crusty
  const WET = { w: 7, p: 0.9, reach: 1.55, soft: 0.14, flow: 0.92, hard: 3.4, aspect: 0.7, spacing: 0.28, opq: 0.9, fillRate: 140, fillK: 0.7, wob: 0.7, streak: 0.12, tin: 0.06, tout: 0.12, t0: 0.5, wmin: 0.8, pv: 0.18 };
  M.wellWet = WET;

  function hl(A, a, b, tool, c, o) { H().hl(A, a, b, tool, c, o); }
  function solid(A, pts, c, o) { H().solid(A, pts, c, o); }
  // a line pulled along a wandering edge: it shakes a little, and lifts off where the edge is worn or broken
  function brk(A, pts, tool, c, o, gap) {
    let seg = [];
    for (let i = 0; i < pts.length; i++) {
      const mid = i && i < pts.length - 1, p = mid ? [pts[i][0], pts[i][1] + A.rr(-0.4, 0.4)] : pts[i];
      if (gap && mid && A.chance(gap)) { if (seg.length > 1) A.stroke(seg, tool, c, o); seg = []; continue; }
      seg.push(p);
    }
    if (seg.length > 1) A.stroke(seg, tool, c, o);
  }

  // ------------------------------------------------------------ a stone field
  /* poly: the face. K: key. o: c (colour, default K.wall), joints (course height or 0), seed, mottle (1), grain (1), ang */
  M.wellStone = function (A, poly, K, o) {
    o = o || {};
    const c = o.c || K.wall, bb = A.bbox([poly]);
    if (o.ground !== false) A.ground(poly, c, { w: o.w || 30, ang: o.ang != null ? o.ang : A.rr(-0.7, -0.4), edge: 0, rub: 7, top: 0.7 });
    // lime wash laid unevenly: big soft clouds a shade paler and a shade deeper
    const mot = o.mottle != null ? o.mottle : 1;
    if (mot > 0) {
      M.floorCloud(A, poly, A.mix(c, K.lime || 'cream', 0.32), { scale: 150, seed: A.rr(1, 90), thr: 0.56, soft: 0.2, p: 0.42 * mot, w: 26, ang: A.rr(-0.8, -0.3) });
      M.floorCloud(A, poly, A.mix(c, K.recess, 0.6), { scale: 110, seed: A.rr(1, 90), thr: 0.6, soft: 0.18, p: 0.36 * mot, w: 22, ang: A.rr(0.2, 0.8) });
    }
    // courses of dressed stone: blocks of every length, cut by hand and laid by hand (m-well3.js)
    const ch = o.joints != null ? o.joints : 0;
    if (ch > 0 && M.wellAshlar) M.wellAshlar(A, poly, K, { ch, c, age: o.age || 0, k: o.jk != null ? o.jk : 0.9 });
    else if (ch > 0) {
      A.withMask(poly, () => {
        let row = 0;
        for (let y = bb[1] + A.rr(4, ch); y < bb[3]; y += ch * A.rr(0.9, 1.1), row++) {
          for (let x = bb[0] - A.rr(0, 40); x < bb[2];) {
            const L = A.rr(60, 190), x1 = Math.min(bb[2], x + L);
            if (A.chance(0.72)) hl(A, [x, y + A.rr(-0.6, 0.6)], [x1, y + A.rr(-0.8, 0.8)], 'kajal', A.mix(c, K.line, 0.42), { w: 0.6, p: A.rr(0.2, 0.42) });
            x = x1 + A.rr(4, 30);
          }
          const step = A.rr(70, 130);
          for (let x = bb[0] + (row % 2 ? step / 2 : 0) + A.rr(-10, 10); x < bb[2]; x += step * A.rr(0.85, 1.2)) if (A.chance(0.6)) hl(A, [x, y], [x + A.rr(-1, 1), y + ch * A.rr(0.85, 1)], 'kajal', A.mix(c, K.line, 0.36), { w: 0.55, p: A.rr(0.16, 0.34) });
        }
      });
    }
    // grain: flecks of darker and paler stone pressed into the tooth
    const gr = o.grain != null ? o.grain : 1;
    if (gr > 0) {
      const n = Math.round((bb[2] - bb[0]) * (bb[3] - bb[1]) / 700 * gr);
      A.withMask(poly, () => {
        for (let i = 0; i < n; i++) {
          const x = A.rr(bb[0], bb[2]), y = A.rr(bb[1], bb[3]);
          A.dot(x, y, 'chalk', A.chance(0.55) ? A.mix(c, K.deep, A.rr(0.25, 0.5)) : A.mix(c, 'khadi', A.rr(0.3, 0.6)), { w: A.rr(0.7, 1.8), p: A.rr(0.35, 0.75) });
        }
      });
    }
  };

  // ------------------------------------------------------------ the shadows of the masses on the wall behind
  /* polys: the masses (and ledges) standing proud of the wall; off: [dx, dy], the way the sun throws them; k: strength.
     The masses are painted after this, over it, so only what falls on the open wall shows. */
  M.wellShadow = function (A, polys, K, off, k) {
    if (!off || (!off[0] && !off[1]) || !k) return;
    const sh = polys.map(p => p.map(q => [q[0] + off[0], q[1] + off[1]]));
    M.floorUnion(A, sh, K.cast, () => k, 1.2 * A.S, 'mul', { ang: A.rr(-0.7, -0.4), len: 30, wid: 2.4, amt: 0.4 });
    // its edge is drawn: a soft stick dragged along the sunward side of the shadow
    for (const p of sh) {
      const bb = A.bbox([p]);
      A.withMask(p, () => A.fill(p, 'side', K.cast, { w: 14, p: 0.12 * k / 0.5, passes: 1, ang: A.rr(-0.9, -0.5), reach: 0.9, flow: 0.4 }));
      void bb;
    }
  };

  // ------------------------------------------------------------ one double flight
  /* m: { pts (outline), apex:[x0, x1, y], steps:[{x0, x1, y, dir}], base: y }  dir -1 = the flight goes down to the left.
     K: the key; age: 0 dry, 1 wet with moss.  o.wetK: how wet this mass is (0..1) */
  M.wellMass = function (A, m, K, age, o) {
    o = o || {};
    const bb = A.bbox([m.pts]);
    // the face of the mass: the side of the flight, seen straight on, standing out paler than the wall behind
    M.floorWash(A, m.pts, K.face, () => 0.62, 'over');
    A.fill(m.pts, 'side', K.face, { w: 26, p: 1, reach: 1.5, passes: 2, turn: 0.8, ang: A.rr(-0.75, -0.45), cv: 0.03 });
    A.blend(m.pts, { r: 7, k: 0.36 });
    A.fill(m.pts, 'side', K.face, { w: 20, p: 0.55, reach: 1.15, passes: 1, ang: A.rr(-0.2, 0.2), cv: 0.04 });
    M.floorCloud(A, m.pts, A.mix(K.face, K.lime || 'cream', 0.4), { scale: 90, seed: A.rr(1, 99), thr: 0.58, soft: 0.2, p: 0.34, w: 18 });
    M.floorCloud(A, m.pts, A.mix(K.face, K.recess, 0.55), { scale: 70, seed: A.rr(1, 99), thr: 0.62, soft: 0.2, p: 0.3, w: 16 });
    // the light falls from the left: the face darkens a little toward its foot, and much more in the hours of dusk
    const dk = K.footDark != null ? K.footDark : 0.18;
    M.floorWash(A, m.pts, K.riser, (x, y) => dk * sstep((y - m.apex[2]) / (m.base - m.apex[2])), 'mul');
    // the blocks of the face: two courses to a step, every block its own size and its own shade of stone
    M.wellAshlar(A, m.pts, K, { ch: Math.max(13, (m.rise || 32) * 0.52), c: K.face, age, k: 0.8, dark: 0.5 });
    void bb;
    // the steps.  Each tread is seen a little from above: a pale band with the sun on its nosing, the slab's thin
    // front edge, and the shadow it throws on the face under it.  The flights that go down to the right show the
    // ends of their steps, turned away from the sun: a dark slab-end beside every riser, as in the old wells.
    for (const s of m.steps) {
      const x0 = s.x0, x1 = s.x1, y = s.y, rise = s.h, td = Math.max(5, rise * (K.treadK || 0.3) * A.rr(0.72, 1.3)), nt = Math.max(2, rise * 0.11 * A.rr(0.7, 1.4));
      // no slab was laid quite level, and the feet of centuries have worn a hollow into the middle of its nosing
      const sw = Math.max(1, x1 - x0), tl = A.rr(-1.1, 1.1), tr = A.rr(-1.1, 1.1), sag = A.rr(0.2, 1.8);
      const lev = x => tl + (tr - tl) * clamp((x - x0) / sw, 0, 1);
      const backY = x => y + lev(x) * 0.4, frontY = x => y + td + lev(x) + sag * Math.sin(PI * clamp((x - x0) / sw, 0, 1));
      const nS = Math.max(3, Math.round(sw / 10)), along = (f, n) => Array.from({ length: n + 1 }, (v, i) => { const xx = x0 + sw * i / n; return [xx, f(xx)]; });
      const top = A.roughen(along(backY, nS).concat(along(frontY, nS).reverse()), 0.7, 7, true);
      A.fill(top, 'pastel', K.tread, { w: Math.min(6, td * 0.6), p: 1, reach: 1.6, passes: 2, gap: 0.4, ang: A.rr(-0.06, 0.06), cv: 0.02 });
      // the tread is warmer and paler toward the sun (left), and worn into a hollow in the middle
      M.floorWash(A, top, 'khadi', (x) => 0.22 * (1 - sstep((x - x0) / (x1 - x0))), 'over');
      if (A.chance(0.5)) A.stroke([[x0 + (x1 - x0) * A.rr(0.2, 0.35), y + td * 0.45], [x0 + (x1 - x0) * A.rr(0.6, 0.8), y + td * 0.5]], 'side', A.mix(K.tread, K.recess, 0.35), { w: td * 0.5, p: 0.25 });
      // the slabs: two or three to a tread, each from its own bed of the quarry, pitted and stained
      const js = []; for (let xx = x0 + sw * A.rr(0.2, 0.45); xx < x1 - 8; xx += sw * A.rr(0.3, 0.6)) js.push(xx);
      const cuts = [x0].concat(js, [x1]);
      for (let q = 0; q + 1 < cuts.length; q++) {
        const a = cuts[q], b = cuts[q + 1], tint = A.pick([K.face, K.lime || K.face, K.recess, 'khadi', K.riser]), amt = tint === K.riser ? A.rr(0.06, 0.14) : A.rr(0.1, 0.32);
        M.floorWash(A, [[a, backY(a)], [b, backY(b)], [b, frontY(b)], [a, frontY(a)]], tint, () => amt, 'over');
      }
      for (let i = 0, n = Math.round(sw / 13); i < n; i++) { const px = A.rr(x0 + 2, x1 - 2), py = A.rr(backY(px) + 1, frontY(px) - 1); A.dot(px, py, 'chalk', A.mix(K.tread, K.recess, A.rr(0.4, 0.75)), { w: A.rr(0.8, 1.7), len: A.rr(0.5, 2.2), ang: A.rr(-0.4, 0.4), p: A.rr(0.35, 0.6) }); }
      brk(A, along(x => backY(x) + 0.9, nS), 'chalk', A.mix(K.tread, 'khadi', 0.7), { w: 1.6, p: 0.85 }, 0.2);
      // the front edge of the slab, ragged where it has spalled, then its shadow on the face
      const edge = along(frontY, nS).concat(along(x => frontY(x) + nt * A.rr(0.7, 1.3), nS).reverse());
      A.fill(edge, 'chalk', A.mix(K.face, K.riser, 0.32), { w: Math.max(1.4, nt * 0.8), p: 1, passes: 2, gap: 0.45, ang: 0 });
      const sh = [[x0, y + td + nt], [x1, y + td + nt], [x1, y + td + nt + rise * 0.42], [x0, y + td + nt + rise * 0.42]];
      M.floorWash(A, sh, K.cast, (x, yy) => 0.5 * (1 - sstep((yy - y - td - nt) / (rise * 0.42))), 'mul');
      if (s.dir > 0 && s.riser !== false) {
        // the end of the step slab, in shade: a sliver beside the riser, its top catching a little light
        const rw = Math.max(3, (x1 - x0) * 0.17), end = [[x1, y + 0.5], [x1 + rw, y + td * 0.7], [x1 + rw, y + rise + td * 0.7 - 0.5], [x1, y + rise]];
        A.fill(end, 'side', A.mix(K.riser, K.cast, 0.4), { w: Math.max(3, rw * 0.9), p: 0.95, passes: 2, ang: 1.57, reach: 1.2 });
        M.floorWash(A, end, K.deep, (x, yy) => 0.35 * sstep((yy - y) / rise), 'mul');
        A.stroke([[x1 + 0.5, y + 1], [x1 + rw - 0.5, y + td * 0.7]], 'chalk', A.mix(K.tread, K.face, 0.4), { w: 1.2, p: 0.7 });
        hl(A, [x1 + rw, y + td * 0.7], [x1 + rw, y + rise + td * 0.7], 'kajal', K.line, { w: 0.8, p: 0.7 });
        hl(A, [x1, y + rise], [x1 + rw, y + rise + td * 0.7], 'kajal', K.line, { w: 0.6, p: 0.5 });
      }
      if (s.dir < 0 && s.riser !== false) {
        // the riser facing the sun: a lit sliver
        A.stroke([[x0 + 1.2, y + td], [x0 + 1.2, y + rise]], 'chalk', A.mix(K.tread, K.face, 0.5), { w: 1.8, p: 0.6 });
      }
      // the riser line and the tread line, pulled once each
      const rx = s.dir < 0 ? x0 : x1;
      if (s.riser !== false && s.dir !== 0) hl(A, [rx, y], [rx, y + rise + 0.5], 'kajal', K.line, { w: 1, p: 0.78 });
      const bl = along(backY, nS); bl[0][0] -= 0.5; bl[bl.length - 1][0] += 0.5;
      brk(A, bl, 'kajal', K.line, { w: 1, p: 0.82 }, 0.07);
      brk(A, along(frontY, nS), 'kajal', A.mix(K.line, K.riser, 0.3), { w: 0.6, p: 0.45 }, 0.16);
      // the joints between the slabs, and the scratches of feet and the chisel
      for (const xx of js) hl(A, [xx, backY(xx) + 0.5], [xx + A.rr(-1.5, 1.5), frontY(xx)], 'kajal', A.mix(K.tread, K.line, 0.55), { w: 0.8, p: 0.6 });
      if (A.chance(0.35)) { const sx = A.rr(x0 + 4, Math.max(x0 + 5, x1 - 14)); for (let i = 0; i < A.ri(3, 6); i++) A.stroke([[sx + i * 2.4, y + td * 0.3], [sx + i * 2.4 + 3, y + td * 0.75]], 'chalk', A.mix(K.tread, K.recess, 0.5), { w: 0.7, p: 0.4 }); }
      // chipped nosings at every depth, more of them lower down; moss along the back of the tread
      if (A.chance(0.42 + age * 0.4)) M.wellChip(A, s.dir < 0 ? x0 + A.rr(2, 10) : x1 - A.rr(2, 10), y, A.rr(3, 9) * (0.7 + age * 0.6), K);
      if (A.chance(0.3)) { const cx = A.rr(x0 + 8, Math.max(x0 + 9, x1 - 8)); M.wellChip(A, cx, frontY(cx), A.rr(3, 7), K); }
      if (age > 0.45 && A.chance(clamp((age - 0.35) * 1.5, 0, 0.97))) {
        // moss on the tread, along its back where the water stands longest
        for (let q = 0, nq = A.ri(1, 2 + Math.round(age)); q < nq; q++) { const L0 = (x1 - x0) * A.rr(0.25, 0.7) * (0.6 + age * 0.5), a0 = A.rr(x0, Math.max(x0 + 1, x1 - L0)); M.wellMossPad(A, a0, Math.min(x1, a0 + L0), y + td * 0.6, K, { h: 3 + age * 7, hang: 0 }); }
      }
      // and let down over the nosing like a beard
      if (age > 0.6 && A.chance(age * 0.62)) { const bl = (x1 - x0) * A.rr(0.2, 0.6), bx = A.rr(x0, Math.max(x0 + 1, x1 - bl)); M.wellBeard(A, bx, bx + bl, y + td + nt, K, { len: 4 + age * 11 }); }
    }
    // the outline of the mass, pulled in a few strokes and restated in places
    A.outline(A.roughen(m.pts, 1, 10, true), 'kajal', K.line, { closed: true, w: 1.1, p: 0.82, pull: A.rr(60, 110), again: 0.2 });
  };

  // ------------------------------------------------------------ a terrace or floor ledge
  /* the walk along the wall: its top seen from above (y .. y + h * 0.55), its front face below.  h: whole height */
  M.wellLedge = function (A, x0, x1, y, h, K, age, o) {
    o = o || {};
    const t = h * 0.55, top = [[x0, y], [x1, y], [x1, y + t], [x0, y + t]], face = [[x0, y + t], [x1, y + t], [x1, y + h], [x0, y + h]];
    A.fill(top, 'side', K.tread, { w: Math.max(6, t * 0.9), p: 1, reach: 1.5, passes: 2, ang: A.rr(-0.04, 0.04), cv: 0.03 });
    A.fill(face, 'side', K.face, { w: Math.max(6, (h - t) * 0.9), p: 1, reach: 1.5, passes: 2, ang: A.rr(-0.04, 0.04), cv: 0.03 });
    M.floorWash(A, face, K.riser, (x, yy) => 0.32 * sstep((yy - y - t) / (h - t)), 'mul');
    // slabs of the walk, their joints, and the light along its lip
    for (let x = x0 + A.rr(10, 60); x < x1; x += A.rr(70, 150)) hl(A, [x, y + 1], [x + A.rr(-3, 3), y + t - 1], 'kajal', A.mix(K.tread, K.line, 0.45), { w: 0.55, p: 0.4 });
    for (let x = x0 + A.rr(0, 40); x < x1; x += A.rr(90, 170)) hl(A, [x, y + t + 1], [x + A.rr(-1, 1), y + h - 1], 'kajal', A.mix(K.face, K.line, 0.45), { w: 0.55, p: 0.38 });
    A.stroke([[x0, y + t - 1.4], [x1, y + t - 1.4]], 'chalk', A.mix(K.tread, 'khadi', 0.6), { w: 1.6, p: 0.7 });
    hl(A, [x0, y], [x1, y], 'kajal', K.line, { w: 1, p: 0.78 });
    hl(A, [x0, y + t], [x1, y + t], 'kajal', K.line, { w: 1.1, p: 0.85 });
    hl(A, [x0, y + h], [x1, y + h], 'kajal', K.line, { w: 0.9, p: 0.7 });
    // a dentil row under the lip of a floor ledge
    if (o.frieze && M.wellFrieze) M.wellFrieze(A, x0, x1, y + t + 2, y + h - 2, K, o.frieze, age);
    else if (o.dentils) for (let x = x0 + A.rr(2, 8); x < x1 - 4; x += A.rr(13, 16)) A.fill([[x, y + t + 2], [x + 6, y + t + 2], [x + 6, y + t + 7], [x, y + t + 7]], 'chalk', A.mix(K.face, K.riser, 0.45), { w: 2, p: 0.8, passes: 1 });
    if (age > 0.4) {
      for (let x = x0 + A.rr(0, 80); x < x1; x += A.rr(40, 120) / age) if (A.chance(age * 0.8)) M.wellMossPad(A, x, x + A.rr(20, 70), y + t * 0.6, K, { h: 3 + age * 7, hang: 3 + age * 3 });
      for (let x = x0 + A.rr(0, 120); x < x1; x += A.rr(80, 200)) if (A.chance(age * 0.6)) M.wellChip(A, x, y + t, A.rr(5, 10), K, { face: true });
    }
  };

  // ------------------------------------------------------------ an arched alcove
  /* (x, yb): the middle of its sill; w, h: the opening.  K: key.  Returns {lamp:[x, y], box:[x0, y0, x1, y1]} */
  M.wellAlcove = function (A, x, yb, w, h, K, age, o) {
    o = o || {};
    const ar = H().arch, frameW = 9;
    const outer = ar(x, yb + 2, w + frameW * 2, h + frameW * 1.2, 3, 0.1, 0.6);
    const open = ar(x, yb, w, h, 3, 0.1, 0.6);
    // a raised frame round the niche, a shade paler
    A.fill(outer, 'pastel', A.mix(K.face, K.lime || 'cream', 0.3), { w: 5, p: 1, reach: 1.5, passes: 2, gap: 0.42 });
    A.outline(outer, 'kajal', K.line, { closed: true, w: 0.9, p: 0.7, pull: 50 });
    // the dark of the niche: deepest at its head, the lit reveal down its left jamb
    A.fill(open, 'side', K.deep, { w: 12, p: 1, reach: 1.6, passes: 2, ang: 1.4, cv: 0.02 });
    A.withMask(open, () => {
      A.fill([[x - w / 2 - 2, yb - h - 4], [x - w / 2 + w * 0.16, yb - h - 4], [x - w / 2 + w * 0.16, yb + 2], [x - w / 2 - 2, yb + 2]], 'side', A.mix(K.deep, K.face, 0.45), { w: 6, p: 0.8, passes: 1, ang: 1.57 });
      M.floorWash(A, open, A.mix(K.deep, '#000000', 0.4), (px, py) => 0.55 * sstep((yb - py) / h - 0.2), 'over');
      // the soot of a thousand lamps, rising from where they stood
      A.fill(A.ellipse(x, yb - h * 0.42, w * 0.32, h * 0.38), 'side', '#1a120c', { w: 10, p: 0.4, passes: 1, ang: 1.5 });
      // the back of the niche: two courses of old brick seen in the dark
      for (let yy = yb - 10; yy > yb - h * 0.8; yy -= 13) hl(A, [x - w / 2 + 6, yy], [x + w / 2 - 4, yy + A.rr(-0.5, 0.5)], 'kajal', A.mix(K.deep, K.face, 0.25), { w: 0.6, p: 0.35 });
    });
    // the sill: a slab worn smooth, an old stain of oil
    const sill = [[x - w / 2 - 6, yb - 4], [x + w / 2 + 6, yb - 4], [x + w / 2 + 8, yb + 5], [x - w / 2 - 8, yb + 5]];
    A.fill(sill, 'pastel', K.tread, { w: 3.4, p: 1, reach: 1.6, passes: 2, gap: 0.4, ang: 0 });
    A.outline(sill, 'kajal', K.line, { closed: true, w: 0.8, p: 0.7 });
    A.dot(x + A.rr(-4, 4), yb - 1, 'side', '#3a2412', { w: 14, len: 6, ang: 0, p: 0.3 });
    A.outline(open, 'kajal', K.line, { closed: true, w: 1.2, p: 0.86, pull: 40, again: 0.3 });
    // soot licks the frame above the arch
    for (let i = 0; i < 4; i++) A.stroke([[x + A.rr(-6, 6), yb - h - 2], [x + A.rr(-10, 10), yb - h - frameW - A.rr(10, 26)]], 'side', '#2a1e16', { w: A.rr(5, 9), p: 0.16, tin: 0.1, tout: 0.6 });
    if (age > 0.5) for (let i = 0; i < 3; i++) M.wellDrip(A, x + A.rr(-w / 2, w / 2), yb - h - frameW, A.rr(10, 30), K);
    return { lamp: [x, yb - 4], box: [x - w / 2 - frameW, yb - h - frameW * 1.2, x + w / 2 + frameW, yb + 5] };
  };

  // ------------------------------------------------------------ the side wall where the well narrows
  /* a column of stone x0..x1 from y0 to y1, its inner edge on side 'L' (right edge inner) or 'R', with a narrow flight
     coming down toward us beside it: its treads stacked one over another */
  M.wellPier = function (A, x0, x1, y0, y1, K, side, age, o) {
    o = o || {};
    const poly = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    const c = A.mix(K.recess, K.deep, 0.22);
    A.ground(poly, c, { w: 24, ang: -1.2, edge: 0, rub: 6, top: 0.6 });
    M.wellStone(A, poly, K, { c, ground: false, joints: 30, mottle: 0.9, grain: 1 });
    const sw = Math.min(54, (x1 - x0) * 0.45), sx0 = side === 'L' ? x1 - sw : x0, sx1 = side === 'L' ? x1 : x0 + sw;
    // the frontal flight, seen from above as it goes down along the side wall: one strip of stone, the treads pale
    // over shadowed risers, worn hollow in the middle, broken by a landing every few steps, and in shadow on one side
    if (o.stairs !== false) {
      const strip = A.roughen([[sx0, y0], [sx1, y0], [sx1, y1], [sx0, y1]], 1.2, 24, true);
      A.fill(strip, 'side', A.mix(K.riser, K.face, 0.5), { w: 10, p: 0.75, passes: 2, ang: 0, cv: 0.04 });
      let y = y0 + A.rr(4, 12), nxt = A.ri(5, 9);
      while (y < y1 - 10) {
        const landing = --nxt <= 0; if (landing) nxt = A.ri(6, 10);
        const rise = landing ? A.rr(28, 38) : A.rr(14, 21), tk = landing ? rise * A.rr(0.55, 0.7) : A.rr(4, 7.5);
        const a0 = sx0 + A.rr(-1.5, 2), a1 = sx1 + A.rr(-2, 1.5), dip = A.rr(0.4, 1.6);
        const band = A.roughen([[a0, y], [(a0 + a1) / 2, y + dip], [a1, y + A.rr(-0.8, 0.8)], [a1, y + tk], [a0, y + tk]], 0.6, 6, true);
        A.fill(band, 'pastel', A.mix(K.tread, c, A.rr(0.12, 0.42)), { w: 3, p: A.rr(0.8, 1), passes: 1, ang: 0, reach: 1.5 });
        const rz = Math.min(rise - tk, A.rr(5, 10));
        A.fill([[a0, y + tk], [a1, y + tk], [a1, y + tk + rz], [a0, y + tk + rz * A.rr(0.6, 1)]], 'side', A.mix(K.riser, K.deep, A.rr(0.15, 0.45)), { w: 5, p: A.rr(0.3, 0.6), passes: 1, ang: 0 });
        hl(A, [a0, y], [a1, y + A.rr(-0.6, 0.6)], 'kajal', K.line, { w: 0.75, p: A.rr(0.3, 0.7) });
        if (A.chance(0.3)) M.wellChip(A, A.rr(a0 + 4, a1 - 4), y, A.rr(3, 7), K);
        if (age > 0.5 && A.chance(age * 0.45)) M.wellMoss(A, [[A.rr(sx0, sx0 + sw * 0.4), y + 1], [A.rr(sx1 - sw * 0.4, sx1), y + 1]], K, { k: age, h: 3 });
        y += rise;
      }
      const shx = side === 'L' ? sx0 : sx1 - sw * 0.3, shw = sw * 0.3;
      M.floorWash(A, [[shx, y0], [shx + shw, y0], [shx + shw, y1], [shx, y1]], K.cast, (x) => 0.4 * (side === 'L' ? 1 - sstep((x - shx) / shw) : sstep((x - shx) / shw)), 'mul');
    }
    if (o.stairs !== false) hl(A, [side === 'L' ? sx0 : sx1, y0], [side === 'L' ? sx0 : sx1, y1], 'kajal', K.line, { w: 0.8, p: 0.6 });
    hl(A, [side === 'L' ? x1 : x0, y0], [side === 'L' ? x1 : x0, y1], 'kajal', K.line, { w: 1.1, p: 0.82 });
    // courses in the side wall
    for (let y = y0 + A.rr(10, 30); y < y1; y += A.rr(30, 40)) hl(A, [side === 'L' ? x0 : sx1, y], [side === 'L' ? sx0 : x1, y + A.rr(-1, 1)], 'kajal', A.mix(c, K.line, 0.4), { w: 0.55, p: 0.3 });
    return poly;
  };

  // ------------------------------------------------------------ the water gauge
  /* g: { x0, x1, y0, y1, yOf(year) -> y, years:[from, to], faces:[{y0, y1}], water } ; keyAt(y) gives the key of the hour there.
     A carved post: a fillet down each edge, a deep double groove at every year, short grooves at every quarter on
     its right edge, and a blank recessed face above each year line, where the page writes the year. */
  M.wellGauge = function (A, g, keyAt) {
    const { x0, x1, y0, y1 } = g, w = x1 - x0;
    // the post, its stone changing with the stone of the wall it is cut into
    const bands = [];
    for (let y = y0; y < y1; y += 60) bands.push([y, Math.min(y1, y + 60)]);
    for (const b of bands) {
      const K = keyAt((b[0] + b[1]) / 2), poly = [[x0, b[0] - 1], [x1, b[0] - 1], [x1, b[1] + 1], [x0, b[1] + 1]];
      A.fill(poly, 'side', A.mix(K.face, K.lime || 'cream', 0.25), { w: 16, p: 1, reach: 1.5, passes: 2, ang: 1.5 + A.rr(-0.1, 0.1), cv: 0.02 });
    }
    A.blend([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], { r: 5, k: 0.3, ang: 1.57 });
    // light on its left face, shade on its right
    M.floorWash(A, [[x1 - 9, y0], [x1, y0], [x1, y1], [x1 - 9, y1]], '#3a2a20', (x) => 0.3 * sstep((x - x1 + 9) / 9), 'mul');
    for (let y = y0; y < y1; y += 70) { const K = keyAt(y + 35); A.stroke([[x0 + 3, y], [x0 + 3, Math.min(y1, y + 72)]], 'chalk', A.mix(K.tread, 'khadi', 0.5), { w: 2, p: 0.55 }); }
    // fillets
    for (let y = y0; y < y1; y += 140) {
      const K = keyAt(y + 70), ya = y, yb = Math.min(y1, y + 142);
      hl(A, [x0 + 7, ya], [x0 + 7, yb], 'kajal', A.mix(K.line, K.face, 0.3), { w: 0.6, p: 0.55 });
      hl(A, [x1 - 7, ya], [x1 - 7, yb], 'kajal', A.mix(K.line, K.face, 0.3), { w: 0.6, p: 0.55 });
      hl(A, [x0, ya], [x0, yb], 'kajal', K.line, { w: 1.1, p: 0.85 });
      hl(A, [x1, ya], [x1, yb], 'kajal', K.line, { w: 1.1, p: 0.85 });
    }
    // the blank faces where the year is written: recessed, lit along their lower lip, shaded under their top
    for (const f of g.faces) {
      const K = keyAt((f.y0 + f.y1) / 2), fx0 = x0 + 10, fx1 = x1 - 10;
      const poly = [[fx0, f.y0], [fx1, f.y0], [fx1, f.y1], [fx0, f.y1]];
      A.fill(poly, 'pastel', A.mix(K.face, K.recess, 0.35), { w: 4, p: 1, passes: 2, reach: 1.5, gap: 0.42, ang: 0 });
      A.stroke([[fx0, f.y0 + 1.5], [fx1, f.y0 + 1.5]], 'side', K.riser, { w: 3, p: 0.55 });
      A.stroke([[fx0 + 1, f.y0 + 1.5], [fx0 + 1, f.y1 - 1]], 'side', K.riser, { w: 2.4, p: 0.45 });
      A.stroke([[fx0, f.y1 - 1], [fx1, f.y1 - 1]], 'chalk', A.mix(K.tread, 'khadi', 0.5), { w: 1.2, p: 0.7 });
      A.outline(poly, 'kajal', K.line, { closed: true, w: 0.7, p: 0.62 });
    }
    // the grooves
    const yr0 = Math.floor(g.years[0]), yr1 = Math.ceil(g.years[1]);
    for (let Y = yr0; Y <= yr1; Y++) {
      for (let q = 0; q < 4; q++) {
        const t = Y + q / 4, y = g.yOf(t); if (y == null || y < y0 + 2 || y > y1 - 2) continue;
        const K = keyAt(y);
        if (q === 0) {
          hl(A, [x0 - 1, y - 1.4], [x1 + 1, y - 1.4], 'kajal', K.line, { w: 1.1, p: 0.85 });
          hl(A, [x0 - 1, y + 1.6], [x1 + 1, y + 1.6], 'kajal', K.line, { w: 0.9, p: 0.7 });
          A.stroke([[x0, y + 3.2], [x1, y + 3.2]], 'chalk', A.mix(K.tread, 'khadi', 0.5), { w: 1, p: 0.6 });
          A.stroke([[x0 + 2, y], [x1 - 2, y]], 'side', K.deep, { w: 2.2, p: 0.5 });
        } else {
          const L = q === 2 ? w * 0.42 : w * 0.24;
          hl(A, [x1 - L, y], [x1 + 0.5, y], 'kajal', K.line, { w: 0.9, p: 0.75 });
          A.stroke([[x1 - L, y + 1.6], [x1, y + 1.6]], 'chalk', A.mix(K.tread, 'khadi', 0.4), { w: 0.8, p: 0.5 });
        }
        // month nicks between the quarters
        for (let mth = 1; mth < 3; mth++) { const ym = g.yOf(t + mth / 12); if (ym != null && ym > y0 && ym < y1) hl(A, [x1 - w * 0.12, ym], [x1, ym], 'kajal', K.line, { w: 0.6, p: 0.5 }); }
      }
    }
    // the capital where it meets the rim: a row of lotus petals and a small cushion
    if (g.capital) {
      const K = keyAt(y0 + 10), cy = y0;
      A.fill([[x0 - 8, cy - 10], [x1 + 8, cy - 10], [x1 + 4, cy + 14], [x0 - 4, cy + 14]], 'pastel', A.mix(K.face, 'cream', 0.3), { w: 4, p: 1, reach: 1.6, passes: 2, gap: 0.42 });
      for (let x = x0 - 4; x < x1 + 4; x += 9) { const pet = [[x, cy + 14], [x + 2, cy + 3], [x + 4.5, cy - 1], [x + 7, cy + 3], [x + 9, cy + 14]]; A.outline(pet, 'kajal', K.line, { w: 0.7, p: 0.66 }); A.dot(x + 4.5, cy + 6, 'chalk', 'sindoor', { w: 1.6, p: 0.6 }); }
      A.outline([[x0 - 8, cy - 10], [x1 + 8, cy - 10], [x1 + 4, cy + 14], [x0 - 4, cy + 14]], 'kajal', K.line, { closed: true, w: 0.9, p: 0.8 });
    }
  };

  // ------------------------------------------------------------ milestones
  /* a flood mark: a line painted across the wall at that month, as a pujari marks how high the water came.
     kind 'sindoor' | 'gold' | 'soft'. Small dabs of the same colour sit on it here and there. */
  M.wellFloodLine = function (A, x0, x1, y, kind, K) {
    const n = Math.ceil((x1 - x0) / 7), pts = [];
    const sd = A.rr(0, 50);
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; pts.push([x, y + 1.6 * Math.sin(x / 37 + sd) + 0.9 * (A.noise1(x / 23 + sd) - 0.5) * 2]); }
    if (kind === 'sindoor') {
      A.outline(pts.map(p => [p[0], p[1] + 1.4]), 'side', '#6a1610', { w: 7.5, p: 0.3, pull: 160, again: 0 });
      A.outline(pts, 'pastel', '#c8321c', { w: 5.2, p: 0.95, pull: 140, again: 0.35, reach: 1.45 });
      A.outline(pts.map(p => [p[0], p[1] - 1.2]), 'chalk', '#e85a2c', { w: 1.6, p: 0.7, pull: 120, again: 0 });
      for (let x = x0 + A.rr(30, 90); x < x1; x += A.rr(110, 190)) { const p = pts[Math.round((x - x0) / (x1 - x0) * n)]; A.dot(p[0], p[1] - 6, 'pastel', '#d23a1e', { w: 5.5, len: 1.8, ang: 1.57, p: 0.95, reach: 1.5 }); A.dot(p[0], p[1] - 6.5, 'chalk', '#f07a3a', { w: 1.6, p: 0.6 }); }
    } else if (kind === 'gold') {
      A.outline(pts.map(p => [p[0], p[1] + 1.2]), 'side', '#4a3010', { w: 6.5, p: 0.25, pull: 160, again: 0 });
      A.outline(pts, 'gold', 'gold', { w: 4.4, p: 0.95, pull: 140, again: 0.3 });
      A.outline(pts.map(p => [p[0], p[1] - 1]), 'chalk', 'cream', { w: 1, p: 0.55, pull: 120, again: 0 });
      for (let x = x0 + A.rr(30, 90); x < x1; x += A.rr(90, 160)) { const p = pts[Math.round((x - x0) / (x1 - x0) * n)]; A.dot(p[0], p[1] - 5.5, 'gold', 'gold', { w: 3.6, p: 0.95 }); }
    } else {
      A.outline(pts, 'chalk', A.mix(K ? K.tread : 'khadi', 'ice', 0.4), { w: 2.6, p: 0.55, pull: 120, again: 0.15 });
      A.outline(pts.map(p => [p[0], p[1] + 2.2]), 'side', K ? K.deep : 'slate', { w: 3.5, p: 0.18, pull: 140, again: 0 });
    }
    return pts;
  };
  /* a blank carved plaque fixed to the gauge, its point toward the gauge: (x0, y) the point, x1 its far end, h its height */
  M.wellPlaque = function (A, x0, y, x1, h, kind, K) {
    const pts = [[x0, y], [x0 + 14, y - h / 2], [x1, y - h / 2], [x1, y + h / 2], [x0 + 14, y + h / 2]];
    const stone = A.mix(K.face, K.lime || 'cream', 0.45), edge = kind === 'sindoor' ? '#c8321c' : kind === 'gold' ? 'gold' : A.mix(K.tread, 'ice', 0.3);
    // its shadow on the wall
    A.fill(pts.map(p => [p[0] + 5, p[1] + 6]), 'side', K.cast || K.deep, { w: 10, p: 0.42, passes: 1 });
    A.fill(pts, 'pastel', stone, { w: 5, p: 1, reach: 1.6, passes: 2, gap: 0.4, ang: 0.1 });
    // bevel: lit on its upper left, shaded on its lower right
    A.stroke([pts[4], pts[0], pts[1], pts[2]], 'chalk', A.mix(stone, 'khadi', 0.6), { w: 2, p: 0.7 });
    A.stroke([pts[2], pts[3], pts[4]], 'side', K.riser, { w: 3.2, p: 0.55 });
    // the sunk field, left blank for the words the page writes
    const ins = [[x0 + 10, y], [x0 + 20, y - h / 2 + 7], [x1 - 7, y - h / 2 + 7], [x1 - 7, y + h / 2 - 7], [x0 + 20, y + h / 2 - 7]];
    A.fill(ins, 'pastel', A.mix(stone, K.recess, 0.18), { w: 4, p: 1, passes: 1, gap: 0.45, reach: 1.4, ang: 0 });
    A.stroke([ins[1], ins[2]], 'side', K.riser, { w: 2.4, p: 0.45 });
    A.stroke([ins[3], ins[4]], 'chalk', A.mix(stone, 'khadi', 0.5), { w: 1, p: 0.6 });
    // painted edge: the milestone's colour runs round it
    if (kind === 'gold') A.outline(pts.map(p => [p[0], p[1]]), 'gold', 'gold', { closed: true, w: 2.2, p: 0.95, pull: 60 });
    else A.outline(pts, 'pastel', edge, { closed: true, w: kind === 'soft' ? 1.4 : 2.4, p: 0.9, pull: 60, reach: 1.4 });
    A.outline(pts.map(p => [p[0] + 0.6, p[1] + 0.6]), 'kajal', K.line, { closed: true, w: 0.8, p: 0.72, pull: 70 });
    A.outline(ins, 'kajal', A.mix(K.line, K.face, 0.3), { closed: true, w: 0.55, p: 0.5 });
    // two pins that hold it to the gauge
    for (const px of [x0 + 24, x1 - 13]) for (const sg of [-1, 1]) { A.dot(px, y + sg * (h / 2 - 3.4), 'kajal', K.line, { w: 2.2, p: 0.8 }); A.dot(px - 0.5, y + sg * (h / 2 - 3.4) - 0.5, 'chalk', 'khadi', { w: 0.7, p: 0.6 }); }
    return [x0, y - h / 2, x1, y + h / 2];
  };
  /* marigolds tied round the gauge at a milestone: a ring round the post and a loop that hangs below it */
  M.wellTie = function (A, x0, x1, y, T) {
    T = T || (c => c);
    const ring = [[x0 - 6, y - 2], [x0 + (x1 - x0) * 0.33, y + 5], [x0 + (x1 - x0) * 0.66, y + 6], [x1 + 6, y]];
    M.garland(A, ring, T, { r: 6.4, step: 9 });
    M.garland(A, [[x1 + 2, y + 2], [x1 + 12, y + 30], [x1 + 2, y + 58], [x0 + (x1 - x0) * 0.4, y + 68]], T, { r: 6, step: 9 });
    M.garland(A, [[x0 + 4, y + 4], [x0 - 8, y + 26], [x0 - 4, y + 44]], T, { r: 5.6, step: 9 });
  };

  // ------------------------------------------------------------ age
  /* rain stains: streaks that run down the wall from under a ledge */
  M.wellStains = function (A, x0, x1, y, len, n, K, o) {
    o = o || {};
    for (let i = 0; i < n; i++) {
      const x = A.rr(x0, x1), L = len * A.rr(0.35, 1.2), wv = A.rr(-4, 4);
      const pts = [[x, y], [x + wv * 0.4, y + L * 0.35], [x + wv, y + L * 0.7], [x + wv * 1.2, y + L]];
      A.stroke(A.spline(pts, false, 3), 'side', o.c || A.mix(K.recess, K.deep, 0.35), { w: A.rr(4, 11), p: A.rr(0.12, 0.3), tin: 0.02, tout: 0.7, reach: 0.9 });
      if (A.chance(0.4)) A.stroke(A.spline(pts, false, 3).slice(0, 8), 'side', o.c2 || K.deep, { w: A.rr(3, 6), p: 0.2, tout: 0.8 });
    }
  };
  /* an old water line: where the water stood a long time.  Above it the salt has come out of the stone white;
     below it the stone stays dark and damp. */
  M.wellTide = function (A, x0, x1, y, K, o) {
    o = o || {};
    const n = Math.ceil((x1 - x0) / 9), sd = A.rr(0, 40), line = [];
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; line.push([x, y + 3 * Math.sin(x / 61 + sd) + 2 * (A.noise1(x / 17 + sd) - 0.5)]); }
    const salt = (o.salt != null ? o.salt : 1);
    if (salt > 0) {
      const band = line.map(p => [p[0], p[1] - 1]).concat(line.slice().reverse().map(p => [p[0], p[1] - (o.sh || 22) * A.rr(0.6, 1.2)]));
      M.floorCloud(A, band, A.mix('khadi', K.tread, 0.25), { scale: 30, seed: A.rr(1, 80), thr: 0.48, soft: 0.16, p: 0.62 * salt, w: 9, ang: 0.05, tool: 'chalk' });
      for (let i = 0; i < (x1 - x0) / 7 * salt; i++) { const x = A.rr(x0, x1), yy = y - A.rr(1, (o.sh || 22)); A.dot(x, yy, 'chalk', 'khadi', { w: A.rr(0.8, 2.2), p: A.rr(0.4, 0.8) }); }
    }
    const below = line.map(p => [p[0], p[1] + 1]).concat(line.slice().reverse().map(p => [p[0], p[1] + (o.dh || 30)]));
    M.floorWash(A, below, K.deep, (x, yy) => 0.24 * (1 - sstep((yy - y) / (o.dh || 30))), 'mul');
    A.outline(line, 'side', A.mix(K.deep, K.recess, 0.3), { w: 3, p: 0.5, pull: 120 });
    A.outline(line.map(p => [p[0], p[1] - 1.5]), 'kajal', A.mix(K.line, K.recess, 0.4), { w: 0.6, p: 0.42, pull: 100 });
  };
  /* lime wash that has died and gone grey-white low on a damp wall, in patches with torn edges, a few dark specks in it */
  M.wellPeel = function (A, x, y, r, K, o) {
    o = o || {};
    const c = o.c || A.mix(A.mix(K.lime || 'cream', '#e6e2d8', 0.5), K.wall, 0.3), all = [];
    // two or three torn patches run together, wider than tall
    for (let k = 0, n = A.ri(2, 3); k < n; k++) {
      const cx = x + A.rr(-r, r), cy = y + A.rr(-r * 0.3, r * 0.3), rx = r * A.rr(0.7, 1.3), ry = rx * A.rr(0.35, 0.6);
      const pts = A.roughen(A.ellipse(cx, cy, rx, ry), rx * 0.3, rx * 0.35, true);
      A.fill(pts, 'chalk', c, { w: Math.max(2, ry * 0.3), p: o.p || 0.5, passes: 2, gap: 0.55, ang: A.rr(-0.2, 0.2), reach: 1.1 });
      all.push(pts);
    }
    // the torn edge: part of it drawn, the rest left to crumble
    for (const pts of all) {
      const n = pts.length, s0 = A.ri(0, n - 1), L = Math.round(n * A.rr(0.25, 0.5)), seg = [];
      for (let i = 0; i < L; i++) seg.push(pts[(s0 + i) % n]);
      A.stroke(seg.map(p => [p[0] + 0.8, p[1] + 1]), 'kajal', A.mix(K.recess, K.deep, 0.5), { w: 0.55, p: 0.36, tin: 0.2, tout: 0.3 });
    }
    for (let i = 0; i < r * 0.35; i++) A.dot(x + A.rr(-r * 1.4, r * 1.4), y + A.rr(-r * 0.5, r * 0.5), 'chalk', A.mix(K.deep, '#2a2a20', 0.5), { w: A.rr(0.8, 2.2), p: A.rr(0.3, 0.65) });
  };
  /* a creeper let down over the stone: a thin wandering stem, small heart leaves in pairs, a tendril at its end */
  M.wellCreeper = function (A, x, y, len, K, o) {
    o = o || {};
    const sd = o.seed || 0, pts = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([x + Math.sin(t * 5 + sd) * 6 * t + (A.noise1(t * 3 + sd, 5) - 0.5) * 10, y + t * len]); }
    const stem = A.mix('#3a4a22', K.deep, 0.3);
    A.stroke(pts, 'kajal', stem, { w: 0.9, p: 0.85, tout: 0.4 });
    const greens = [A.mix('#3f6b2a', K.glaze || K.deep, (K.gl || 0) * 0.8), A.mix('#5d8a36', K.glaze || K.deep, (K.gl || 0) * 0.8), A.mix('#2f5424', K.glaze || K.deep, (K.gl || 0) * 0.8)];
    for (let i = 2; i < pts.length; i += 2) {
      const p = pts[i], sg = (i / 2) % 2 ? 1 : -1, L = A.rr(6, 10) * (1 - i / pts.length * 0.4);
      leaf(A, p[0], p[1], PI / 2 + sg * A.rr(0.7, 1.2), L, A.pick(greens), false);
    }
    const e = pts[pts.length - 1];
    A.stroke(A.spline([e, [e[0] + 4, e[1] + 5], [e[0] + 1, e[1] + 9], [e[0] - 2, e[1] + 6]], false, 0.6), 'kajal', stem, { w: 0.6, p: 0.7 });
  };
  /* rings left in the stone where lichen and lime have grown round each other, as in the old wells near Jaipur */
  M.wellLichen = function (A, x, y, r, K, o) {
    o = o || {};
    const c = o.c || A.mix(K.lime || 'cream', 'sage', 0.35), d = o.d || A.mix(K.deep, 'olive', 0.3);
    // a crusty rosette: lobed at its edge, the growing rim paler and broken into crumbs, the old middle gone dull
    const n = 8 + Math.round(r), pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI, q = r * A.rr(0.72, 1.1); pts.push([x + Math.cos(a) * q, y + Math.sin(a) * q * 0.88]); }
    const blob = A.spline(pts, true, 0.8);
    A.fill(blob, 'chalk', A.mix(c, K.wall, 0.5), { w: Math.max(1.2, r * 0.4), p: 0.36, passes: 1, ang: A.rr(0, 3) });
    for (const p of pts) if (A.chance(0.7)) A.dot(p[0], p[1], 'chalk', c, { w: Math.max(0.8, r * A.rr(0.16, 0.28)), p: A.rr(0.4, 0.7) });
    A.dot(x + A.rr(-r * 0.2, r * 0.2), y + A.rr(-r * 0.2, r * 0.2), 'chalk', A.mix(d, K.wall, 0.4), { w: Math.max(0.8, r * 0.5), p: 0.28 });
  };
  /* moss along a line (the top of a tread, a ledge, the lip of an alcove), laid with the wet stick */
  M.wellMoss = function (A, pts, K, o) {
    o = o || {};
    const k = o.k != null ? o.k : 1, h = o.h || 5, path = A.resample(pts, 2.5, false);
    const greens = K.moss || ['#4d5a2a', '#5f6e2c', '#3f4a22', '#76822f'];
    for (let i = 0; i < path.length; i++) {
      const p = path[i], hh = h * (0.4 + 0.8 * A.noise1(i / 7 + p[0] * 0.01)) * A.rr(0.7, 1.1);
      A.stroke([[p[0], p[1] + 0.5], [p[0] + A.rr(-1, 1), p[1] - hh * 0.6]], WET, A.pick(greens), { w: A.rr(2.2, 3.6), p: A.rr(0.65, 0.95) * Math.min(1, 0.5 + k * 0.5), tin: 0, tout: 0.5 });
    }
    // a lip of moss hanging over the edge, and pale tips where the light catches
    for (let i = 0; i < path.length; i += A.ri(2, 4)) { const p = path[i]; A.stroke([[p[0], p[1]], [p[0] + A.rr(-0.6, 0.6), p[1] + A.rr(2, 5) * k]], WET, A.pick(greens), { w: A.rr(1.6, 2.6), p: 0.75, tin: 0, tout: 0.6 }); }
    for (let i = 0; i < path.length; i += A.ri(2, 5)) { const p = path[i]; A.dot(p[0] + A.rr(-1, 1), p[1] - A.rr(0.5, h * 0.6), 'chalk', A.pick(K.mossTip || ['#a9b545', '#c6c66a', '#8fa040']), { w: A.rr(0.8, 1.6), p: 0.7 }); }
  };
  /* a fern grown out of a crack: fronds of little leaflets, (x, y) the crack, s its size, lean -1..1 */
  M.wellFern = function (A, x, y, s, K, o) {
    o = o || {};
    const lean = o.lean || 0, nf = o.n || A.ri(5, 8), dark = o.c || '#2f4a26', light = o.c2 || '#6f9a3c';
    A.dot(x, y, WET, '#2a2a18', { w: 5 * s, len: 2 * s, ang: 0, p: 0.6 });
    for (let f = 0; f < nf; f++) {
      const a = -PI / 2 + lean * 0.5 + (f - (nf - 1) / 2) * (1.9 / nf) + A.rr(-0.12, 0.12), L = s * A.rr(26, 42) * (1 - Math.abs(f - (nf - 1) / 2) / nf * 0.5);
      const cp = [[x, y], [x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.5 - L * 0.06], [x + Math.cos(a + 0.35 * Math.sign(Math.cos(a))) * L, y + Math.sin(a + 0.35 * Math.sign(Math.cos(a))) * L + L * 0.12]];
      const sp = A.spline(cp, false, 1.5);
      A.stroke(sp, 'kajal', dark, { w: 0.8 * s, p: 0.8, tout: 0.4 });
      for (let i = 2; i < sp.length - 1; i += 2) {
        const p = sp[i], q = sp[Math.min(sp.length - 1, i + 1)], an = Math.atan2(q[1] - p[1], q[0] - p[0]), u = i / sp.length, ll = s * 7 * (1 - u * 0.8);
        for (const sg of [-1, 1]) A.stroke([p, [p[0] + Math.cos(an + sg * 1.05) * ll, p[1] + Math.sin(an + sg * 1.05) * ll]], 'chalk', A.chance(0.6) ? light : A.mix(light, dark, 0.5), { w: Math.max(1, 2.2 * s * (1 - u * 0.5)), p: 0.85, tin: 0.1, tout: 0.4 });
      }
    }
  };
  /* a peepal sapling that has split the stone: heart leaves with long drip tips, the young ones copper */
  M.wellPeepal = function (A, x, y, s, K) {
    M.wellCrack(A, x, y + 4, 34 * s, 1.3, K.line);
    M.wellCrack(A, x + 2, y, 26 * s, -1.9, K.line);
    const stem = A.spline([[x, y], [x - 6 * s, y - 20 * s], [x + 4 * s, y - 44 * s], [x - 2 * s, y - 70 * s]], false, 1.5);
    A.stroke(stem, 'kajal', '#4a3020', { w: 2.2 * s, p: 0.9, tout: 0.5 });
    const br = [[0.35, -1, 26], [0.5, 1, 22], [0.7, -1, 18], [0.85, 1, 14], [1, 0, 12]];
    for (const b of br) {
      const p = stem[Math.min(stem.length - 1, Math.floor(b[0] * (stem.length - 1)))], a = -PI / 2 + b[1] * 0.9 + A.rr(-0.2, 0.2), L = b[2] * s;
      const e = [p[0] + Math.cos(a) * L * 0.6, p[1] + Math.sin(a) * L * 0.6];
      A.stroke([p, e], 'kajal', '#4a3020', { w: 1 * s, p: 0.8 });
      const young = b[0] > 0.8, c = young ? A.mix('#b0502c', '#c78a3a', A.rnd()) : A.pick(['#3f6b2a', '#4f7d30', '#5d8a36']);
      leaf(A, e[0], e[1], a + A.rr(-0.4, 0.4), L * 0.7, c, young);
    }
  };
  function leaf(A, x, y, a, L, c, young) {
    const wd = L * 0.42, P = (u, v) => [x + Math.cos(a) * u * L - Math.sin(a) * v * wd, y + Math.sin(a) * u * L + Math.cos(a) * v * wd];
    const pts = A.spline([P(0, 0), P(0.18, -0.85), P(0.5, -0.8), P(0.78, -0.3), P(1.25, 0), P(0.78, 0.3), P(0.5, 0.8), P(0.18, 0.85)], true, 1);
    A.fill(pts, 'chalk', c, { w: Math.max(1.4, L * 0.12), p: 1, reach: 1.5, passes: 2, gap: 0.4, ang: a + 0.6 });
    A.stroke([P(0, 0), P(1.1, 0)], 'kajal', young ? '#6a2a14' : '#24401a', { w: 0.6, p: 0.6 });
    A.outline(pts, 'kajal', young ? '#5a2410' : '#1e3414', { closed: true, w: 0.6, p: 0.6 });
    if (!young) A.stroke([P(0.25, -0.35), P(0.6, -0.4)], 'chalk', '#9fc060', { w: 0.8, p: 0.5 });
  }
  M.wellLeaf = leaf;
  /* a crack in the stone: a wandering line in kajal that forks once or twice, its lip caught pale */
  M.wellCrack = function (A, x, y, len, ang, c, depth) {
    const pts = [[x, y]]; let a = ang, px = x, py = y; const n = Math.max(4, Math.round(len / 4));
    for (let i = 0; i < n; i++) {
      a += A.rr(-0.6, 0.6); a = ang + (a - ang) * 0.55;
      px += Math.cos(a) * len / n; py += Math.sin(a) * len / n; pts.push([px, py, 1 - 0.6 * i / n]);
      if ((depth || 0) < 1 && i > 2 && A.chance(0.12)) M.wellCrack(A, px, py, len * A.rr(0.25, 0.45), a + A.rr(0.5, 1.1) * (A.chance(0.5) ? 1 : -1), c, (depth || 0) + 1);
    }
    A.stroke(pts, 'kajal', c, { w: depth ? 0.55 : 0.8, p: depth ? 0.45 : 0.6, wob: 0.35, tin: 0.05, tout: 0.4 });
    A.stroke(pts.map(p => [p[0] + 0.8, p[1] + 0.9]), 'chalk', '#f3e6c8', { w: 0.6, p: 0.25, tout: 0.5 });
  };
  /* a drip: a dark wet streak and a bead at its foot */
  M.wellDrip = function (A, x, y, len, K) {
    A.stroke([[x, y], [x + A.rr(-1, 1), y + len]], WET, A.mix(K.deep, K.recess, 0.4), { w: A.rr(1.6, 3), p: 0.45, tin: 0, tout: 0.3 });
    A.dot(x, y + len + 1.5, 'chalk', A.mix(K.deep, 'neel', 0.3), { w: 2.6, len: 1.2, ang: 1.57, p: 0.8 });
    A.dot(x - 0.5, y + len + 0.8, 'chalk', A.mix(K.tread, 'ice', 0.5), { w: 0.8, p: 0.8 });
  };
  /* a chip broken out of an edge: (x, y) the edge, s its size */
  M.wellChip = function (A, x, y, s, K, o) {
    o = o || {};
    const pts = [[x - s * 0.6, y - 0.4], [x - s * 0.2, y + s * 0.5], [x + s * 0.35, y + s * 0.62], [x + s * 0.7, y - 0.4]];
    A.fill(pts, 'chalk', A.mix(K.recess, K.deep, 0.4), { w: Math.max(1.2, s * 0.4), p: 0.9, passes: 2, gap: 0.45 });
    A.stroke(pts.slice(0, 3), 'kajal', K.line, { w: 0.6, p: 0.6 });
    A.stroke([pts[1], pts[2]], 'chalk', A.mix(K.tread, 'khadi', 0.5), { w: 0.8, p: 0.6 });
  };
})();
