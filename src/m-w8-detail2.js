(function () {
  'use strict';
  /* ==========================================================================
     THE GOLD WELL (well8k): WHAT A CLOSE LOOK FINDS, part 2
     The small things laid on each focal object after it is drawn, in that object's own units, so that at the deepest
     zoom there is always one more thing to see.
       M.w8Flame(A, x, y, h)                 a lamp flame standing on its wick at x, y, h tall
       M.w8LoomDetail(Z, o)                  the loom: the half-woven row, heddle eyes, loose ends, a charm, a bobbin, a basket
       M.w8TankDetail(Zt, yT, o)             the spouts and tank: makara heads, wet streaks, moss, coins, a marigold, ferns
       M.w8TankShadows(Zt, yT)               the shadows the spouts and the tank throw on the wall (drawn before the object)
       M.w8DoorDetail(A, d, o)               the door with the thread: diyas, petals and rice on the sill, a bell
       M.w8CupsDetail(Z, s, o)               the two cups: repousse lotus, beaded rims, a chased vine, a garland, a dent, a rumal
       M.w8CraneDetail(A, x, y, s)           one crane: red head and upper neck, grey crown, a ruff, the bustle
       M.w8Interior(A, xc, ow, yb, ys, ya, o) the painted dark room (or night sky) seen through the arch behind a light object
     o.glint(x, y) takes a local point where the sun catches gold; o.lamp(x, y) a local point where a flame burns.
     ======================================================================== */
  const PI = Math.PI;
  const sstep = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const LINE = '#24140c', GOLD = '#d6a535', GOLD_D = '#7a5414';

  M.w8Flame = function (A, x, y, h) {
    const w = h * 0.44;
    const outer = A.spline([[x, y - h], [x + w * 0.5, y - h * 0.5], [x + w * 0.52, y - h * 0.12], [x, y + h * 0.06], [x - w * 0.52, y - h * 0.12], [x - w * 0.5, y - h * 0.5]], true, Math.max(0.05, h * 0.05));
    A.fill(outer, 'chalk', '#ee8a20', { w: Math.max(0.12, h * 0.18), p: 1, passes: 2 });
    const inner = outer.map(p => [x + (p[0] - x) * 0.55, y - h * 0.22 + (p[1] - y + h * 0.22) * 0.6]);
    A.fill(inner, 'chalk', '#ffe7a0', { w: Math.max(0.1, h * 0.14), p: 1, passes: 2 });
    A.dot(x, y - h * 0.2, 'chalk', '#fffbea', { w: Math.max(0.1, h * 0.16), p: 1 });
    A.stroke([[x, y + h * 0.12], [x, y - h * 0.06]], 'kajal', '#2a1a10', { w: Math.max(0.08, h * 0.07), p: 0.9 });
  };

  /* ---------------------------------------------------------------- the loom (Rule Builder), in loom units */
  M.w8LoomDetail = function (Z, o) {
    o = o || {};
    // 1. the row being woven: red picks beaten up against the cloth for two thirds of the width, the next band of
    //    diamonds begun in yellow, and the red weft running from where it stops down to the shuttle
    const stop = 26;
    for (let v = -159.4; v < -150; v += 1.05) A_line(Z, [[-101.5, v], [stop + Z.rr(-2, 2), v + Z.rr(-0.15, 0.15)]], 'chalk', Z.mix('#c4301c', '#8e1c14', Z.rr(0, 0.4)), 0.85, 0.95);
    for (let u = -90; u < stop - 6; u += 28) {
      Z.fill([[u - 8, -150.2], [u + 8, -150.2], [u, -158.4]], 'chalk', '#e6b422', { w: 0.9, p: 1, passes: 2 });
      Z.outline([[u - 8, -150.2], [u, -158.4], [u + 8, -150.2]], 'kajal', '#6a2a10', { w: 0.35, p: 0.6 });
      Z.dot(u, -153, 'chalk', '#f4ecd8', { w: 1.3, p: 1 });
    }
    Z.stroke(Z.spline([[stop, -155], [stop + 7, -136], [36, -110], [38, -86]], false, 0.6), 'chalk', '#c4301c', { w: 0.6, p: 0.9 });
    Z.stroke([[-101.5, -159.8], [stop, -159.8]], 'kajal', '#5a1a0c', { w: 0.35, p: 0.6 });
    // 2. the string heddles: a little eye on each warp end under the shafts, alternate ends on alternate shafts
    for (let u = -99, k = 0; u <= 99; u += 3.6, k++) {
      const v = k % 2 ? -197.5 : -194.5;
      Z.stroke([[u, -201.5], [u, v - 1.6]], 'kajal', '#5a4a3a', { w: 0.22, p: 0.55 });
      Z.outline(Z.ellipse(u, v, 0.75, 1.5), 'kajal', '#4a3a2a', { closed: true, w: 0.25, p: 0.7 });
      Z.stroke([[u, v + 1.6], [u, v + 4]], 'kajal', '#5a4a3a', { w: 0.22, p: 0.5 });
    }
    // 3. loose ends hanging from the right edge of the cloth, and a fringe of knots on the left
    const ends = [[-141, '#e6b422'], [-122, '#2a4c9c'], [-104, '#c4301c'], [-92, '#e6b422']];
    for (const [v, c] of ends) {
      const pts = []; let x = 102, y = v;
      for (let i = 0; i < 9; i++) { pts.push([x, y]); x += 1.4 + Math.sin(i * 1.3 + v) * 1.6; y += 3.4 + i * 0.3; }
      Z.stroke(Z.spline(pts, false, 0.5), 'chalk', c, { w: 0.55, p: 0.95, tout: 0.3 });
    }
    for (let v = -146; v < -78; v += 5.5) { Z.dot(-102.6, v, 'kajal', '#3a1a0c', { w: 1.1, p: 0.8 }); Z.stroke([[-102.8, v], [-106 + Z.rr(-0.8, 0.8), v + 3]], 'chalk', '#c4301c', { w: 0.45, p: 0.9 }); }
    // 4. the charm against the evil eye: a lemon and green chillies on a black thread, hung from the top beam
    const cx = -62;
    Z.stroke([[cx, -264], [cx + 0.3, -251]], 'kajal', '#141010', { w: 0.4, p: 0.95 });
    for (let i = 0; i < 6; i++) {
      const a = -0.55 + (i % 3) * 0.55 + Z.rr(-0.1, 0.1), y0 = -253 + i * 4.2, l = 11;
      const tip = [cx + Math.sin(a) * l * 0.5, y0 + Math.cos(a) * l];
      Z.stroke(Z.spline([[cx, y0], [cx + Math.sin(a) * l * 0.35 + 0.8, y0 + l * 0.5], tip], false, 0.4), 'chalk', i % 2 ? '#2f7a2a' : '#3e8e30', { w: 3.4, p: 1, tout: 0.7 });
      Z.stroke([[cx, y0 - 0.2], [cx + Math.sin(a) * 1.2, y0 + 1.2]], 'chalk', '#5a6a1a', { w: 1.1, p: 0.9 });
      Z.stroke([[cx + Math.sin(a) * 2.6 - 0.5, y0 + 2.6], [cx + Math.sin(a) * 4.5 - 0.3, y0 + 5]], 'chalk', '#9ad06a', { w: 0.4, p: 0.6 });
    }
    const lem = Z.ellipse(cx, -221, 5, 5.8);
    Z.fill(lem, 'pastel', '#e6d02a', { w: 1.6, p: 1, passes: 2 });
    M.floorWash(Z, lem, '#7a6a10', (x, y) => 0.35 * sstep((x - cx) / 5 + 0.2), 'mul');
    Z.dot(cx - 1.6, -223.4, 'chalk', '#fffbe0', { w: 1.1, p: 0.8 });
    Z.outline(lem, 'kajal', LINE, { closed: true, w: 0.4, p: 0.7 });
    Z.dot(cx, -215, 'chalk', '#5a6a1a', { w: 0.9, p: 1 });
    // 5. a spare shuttle with its bobbin and a wound spindle of indigo lying on the lower beam
    const sh = Z.spline([[-78, -32.8], [-70, -36.4], [-50, -36.8], [-42, -33.4], [-50, -30.4], [-70, -30.2]], true, 0.5);
    Z.fill(sh, 'pastel', '#9a6a34', { w: 1.4, p: 1, passes: 2, ang: 0 });
    Z.fill(Z.ellipse(-60, -33.6, 6.5, 2), 'chalk', '#e6b422', { w: 0.9, p: 1, passes: 2 });
    for (let u = -65; u < -55; u += 1.3) Z.stroke([[u, -35.3], [u + 0.6, -32]], 'kajal', '#a07a10', { w: 0.25, p: 0.6 });
    Z.outline(sh, 'kajal', LINE, { closed: true, w: 0.45, p: 0.8 });
    Z.stroke([[-77, -33], [-43, -33.4]], 'chalk', '#d8b080', { w: 0.4, p: 0.6 });
    const sp = Z.ellipse(-24, -33.6, 7, 2.8);
    Z.stroke([[-35, -33.4], [-13, -33.8]], 'chalk', '#7a5a34', { w: 0.9, p: 1 });
    Z.fill(sp, 'pastel', '#2a4c9c', { w: 1.2, p: 1, passes: 2, ang: 1.4 });
    for (let u = -30; u < -18; u += 1.5) Z.stroke([[u, -36], [u + 1.1, -31.2]], 'kajal', '#16285a', { w: 0.3, p: 0.6 });
    Z.outline(sp, 'kajal', LINE, { closed: true, w: 0.4, p: 0.75 });
    // 6. the grain of the posts, a knot in each, and the pegs that hold the joints
    for (const sg of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const u = sg * (113 + k * 3.2), pts = [];
        for (let v = -284; v < -4; v += 12) pts.push([u + Math.sin(v * 0.05 + k + sg) * 0.6, v]);
        Z.stroke(Z.spline(pts, false, 0.6), 'kajal', '#3a200c', { w: 0.3, p: 0.4 });
      }
      const kv = sg < 0 ? -150 : -58, ku = sg * 117.5;
      Z.outline(Z.ellipse(ku, kv, 1.8, 3.6), 'kajal', '#2a1608', { closed: true, w: 0.4, p: 0.7 });
      Z.dot(ku, kv, 'chalk', '#4a2a10', { w: 1.6, p: 1 });
      for (const v of [-268, -74, -30]) { Z.dot(sg * 118, v, 'chalk', '#5a3414', { w: 2.4, p: 1 }); Z.dot(sg * 118 - 0.5, v - 0.6, 'chalk', '#c89a5a', { w: 0.8, p: 0.9 }); Z.outline(Z.ellipse(sg * 118, v, 1.3, 1.3), 'kajal', LINE, { closed: true, w: 0.3, p: 0.7 }); }
    }
    // 7. a low basket of yarn in front of the left post, a thread from it climbing to the cloth
    const bx = -84, by = -1, bw = 20, bh = 11;
    const bk = Z.spline([[bx - bw, by - bh], [bx - bw * 0.92, by - bh * 0.3], [bx - bw * 0.7, by], [bx + bw * 0.7, by], [bx + bw * 0.92, by - bh * 0.3], [bx + bw, by - bh]], false, 0.5).concat([[bx + bw, by - bh], [bx - bw, by - bh]]);
    for (const [u, v, r, c] of [[-94, -13.5, 6, '#c4301c'], [-81, -15, 6.6, '#e6b422'], [-70, -13, 5.4, '#2a4c9c']]) {
      const ball = Z.ellipse(u, v, r, r * 0.9);
      Z.fill(ball, 'pastel', c, { w: 1.6, p: 1, passes: 2 });
      for (let k = 0; k < 5; k++) { const a = k * 0.7 + 0.3; Z.stroke(Z.ellipse(u, v, r * 0.85, r * 0.3, a, 0, PI), 'kajal', Z.mix(c, '#000000', 0.45), { w: 0.25, p: 0.5 }); }
      Z.outline(ball, 'kajal', LINE, { closed: true, w: 0.35, p: 0.7 });
    }
    Z.fill(bk, 'pastel', '#b8864a', { w: 1.6, p: 1, passes: 2, ang: 0 });
    for (let u = bx - bw + 2; u < bx + bw - 1; u += 2.6) Z.stroke([[u, by - bh + 0.6], [u + 0.4, by - 1]], 'kajal', '#6a4220', { w: 0.35, p: 0.55 });
    for (let v = by - bh + 2.5; v < by - 1; v += 2.6) Z.stroke([[bx - bw + 1.5, v], [bx + bw - 1.5, v]], 'chalk', '#d8b078', { w: 0.6, p: 0.6 });
    Z.fill(Z.ellipse(bx, by - bh, bw, 2), 'chalk', '#8a5a2a', { w: 0.8, p: 1, passes: 1 });
    Z.outline(bk, 'kajal', LINE, { closed: true, w: 0.45, p: 0.8 });
    Z.stroke(Z.spline([[-81, -21], [-90, -40], [-98, -70], [-101, -96]], false, 0.6), 'chalk', '#e6b422', { w: 0.45, p: 0.9 });
    if (o.glint) { o.glint(cx - 1.4, -226.5); o.glint(-60, -35); }
  };
  // a thin line of thread
  function A_line(Z, pts, tool, c, w, p) { Z.stroke(pts, tool, c, { w, p, tin: 0, tout: 0 }); }

  /* ---------------------------------------------------------------- the spouts and the tank (Portfolio), tank units */
  // a lotus corbel set in the wall, and on it a makara's head with the water leaving its open jaws
  function makara(Z, p, d, o) {
    const Q = (u, v) => [p[0] + d * u, p[1] + v], st = '#e2c48e', lit = '#f4e2bc', line = '#2c1a10';
    const corbel = Z.spline([[16, -7], [15.5, 0], [11, 4], [6, 0], [0, 4.6], [-6, 0], [-11, 4], [-15.5, 0], [-16, -7]].map(q => Q(q[0], q[1])), false, 0.5).concat([Q(-16, -18), Q(16, -18)]);
    Z.ground(corbel, st, { edge: 0, w: 3, rub: 0, top: 0 });
    Z.fill(corbel, 'pastel', Z.mix(st, lit, 0.3), { w: 2, p: 0.5, passes: 1 });
    M.floorWash(Z, corbel, '#5a3818', (x, y) => 0.4 * sstep((y - (p[1] - 6)) / 10), 'mul');
    for (const u of [-11, 0, 11]) Z.stroke([Q(u, -5), Q(u, 2.6)], 'kajal', line, { w: 0.5, p: 0.55 });
    Z.stroke([Q(-16, -12.5), Q(16, -12.5)], 'kajal', line, { w: 0.5, p: 0.6 });
    for (let u = -14; u <= 14; u += 4) Z.dot(...Q(u, -15.3), 'chalk', Z.mix(st, line, 0.35), { w: 1.4, p: 0.9 });
    Z.outline(corbel, 'kajal', line, { closed: true, w: 0.8, p: 0.8 });
    // the crest of curling leaves behind the head, in gold
    for (const [a, b, c] of [[[-6, -12], [-12, -21], [-4, -18]], [[-8, -9], [-17, -14], [-10, -6]], [[-3, -14], [-3, -23], [1, -16]]]) {
      const lf = Z.spline([Q(...a), Q((a[0] + b[0]) / 2 - 2, (a[1] + b[1]) / 2), Q(...b), Q(...c)], true, 0.5);
      Z.fill(lf, 'gold', GOLD, { w: 1.4, p: 1, passes: 2 });
      Z.outline(lf, 'kajal', line, { closed: true, w: 0.5, p: 0.7 });
    }
    const head = Z.spline([[-9, -6], [-7, -13], [0, -15.5], [7, -13], [12, -9], [14, -4], [9, -1], [4, 0], [0, 3], [-5, 3.4], [-9, 0]].map(q => Q(q[0], q[1])), true, 0.5);
    Z.ground(head, st, { edge: 0, w: 2.4, rub: 0, top: 0 });
    Z.fill(head, 'pastel', lit, { w: 1.6, p: 0.45, passes: 1 });
    M.floorWash(Z, head, '#6a4420', (x, y) => 0.35 * sstep((y - (p[1] - 8)) / 10), 'mul');
    // the trunk, curled up over the snout
    const tr = Z.spline([Q(12, -8), Q(16.5, -9.5), Q(19, -13.5), Q(17, -17), Q(14, -16), Q(14.6, -13.2)], false, 0.4);
    Z.stroke(tr, 'chalk', st, { w: 3, p: 1, tout: 0.5 });
    Z.stroke(tr, 'kajal', line, { w: 0.55, p: 0.75, tout: 0.4 });
    // the open jaws, a tooth, the eye ringed in kajal, scrolls on the cheek
    const mouth = [Q(9, -1), Q(4, 0), Q(0, 3), Q(3, 4.4), Q(8, 2)];
    Z.fill(mouth, 'chalk', '#2a1a12', { w: 1.2, p: 1, passes: 2 });
    Z.stroke([Q(6.2, -0.6), Q(6, 1)], 'chalk', '#fff6e0', { w: 0.7, p: 1 });
    Z.stroke([Q(2.4, 1.6), Q(2.6, 3)], 'chalk', '#fff6e0', { w: 0.6, p: 1 });
    Z.fill(Z.ellipse(...Q(4.6, -9.4), 2.4, 1.3, d * -0.3), 'chalk', '#f6eedc', { w: 0.8, p: 1, passes: 1 });
    Z.dot(...Q(5, -9.4), 'kajal', '#140e0a', { w: 1.3, p: 1 });
    Z.outline(Z.ellipse(...Q(4.6, -9.4), 2.6, 1.4, d * -0.3), 'kajal', line, { closed: true, w: 0.55, p: 0.9 });
    Z.stroke([Q(2, -9.2), Q(-1.5, -8.2)], 'kajal', line, { w: 0.45, p: 0.8, tout: 0.6 });
    for (const [u, v] of [[-4.5, -5], [-6, -10.5]]) Z.stroke(Z.spline([Q(u + 2.2, v), Q(u, v - 1.6), Q(u - 1.6, v), Q(u, v + 1.4), Q(u + 0.8, v)], false, 0.3), 'kajal', line, { w: 0.4, p: 0.6 });
    Z.outline(head, 'kajal', line, { closed: true, w: 0.7, p: 0.85 });
    if (o.glint) o.glint(...Q(-12, -21));
  }
  M.w8TankShadows = function (Zt, yT) {
    const SH = '#7a4a24';
    Zt.fill(rect(-125, yT, 157, 4), 'side', SH, { w: 12, p: 0.3, passes: 1 });
    for (const p of M.wellSpoutPts(0, yT)) Zt.fill([[-12, -14], [20, -14], [20, 2], [15, 9], [-8, 9], [-12, 2]].map(q => [p[0] + q[0], p[1] + q[1]]), 'side', SH, { w: 8, p: 0.3, passes: 1 });
  };
  M.w8TankDetail = function (Zt, yT, o) {
    o = o || {};
    const pts = M.wellSpoutPts(0, yT);
    pts.forEach((p, i) => makara(Zt, p, (i - 2.5) < 0 ? -1 : 1, o));
    // the face of the tank wet under the lip where it overflows: dark streaks, and moss where the wet stays
    for (let i = 0; i < 26; i++) {
      const x = -131 + i * 10.4 + Zt.rr(-3, 3), l = Zt.rr(8, 40);
      Zt.stroke([[x, yT + 8.5], [x + Zt.rr(-1, 1), yT + 8.5 + l]], 'chalk', '#4a3a1c', { w: Zt.rr(1.6, 3.4), p: Zt.rr(0.18, 0.3), tin: 0, tout: 0.8 });
    }
    for (let i = 0; i < 70; i++) {
      const edge = Zt.chance(0.55), x = edge ? Zt.rr(-134, 134) : (Zt.chance(0.5) ? -1 : 1) * Zt.rr(118, 134), y = edge ? yT + 8.5 + Math.abs(Zt.rr(0, 4) * Zt.rr(0, 1.5)) : Zt.rr(yT + 20, -1);
      Zt.dot(x, y, 'pastel', Zt.pick(['#4a6a2a', '#5e7e30', '#3a5a26', '#7a8e3a']), { w: Zt.rr(1.4, 3), len: Zt.rr(1, 2.4), ang: PI / 2, p: 0.85 });
    }
    // coins in the water, a marigold floating, two loose petals, a ring of ripples round the flower
    for (let i = 0; i < 11; i++) {
      const x = -120 + i * 23 + Zt.rr(-6, 6), y = yT + Zt.rr(-1, 2.6);
      Zt.fill(Zt.ellipse(x, y, 2.6, 0.9, Zt.rr(-0.2, 0.2)), 'gold', i % 3 ? GOLD : '#c08a3a', { w: 0.8, p: 1, passes: 2 });
      Zt.stroke([[x - 1.2, y - 0.3], [x + 0.6, y - 0.4]], 'chalk', '#fff4c8', { w: 0.4, p: 0.9 });
      if (o.glint && i % 4 === 1) o.glint(x, y);
    }
    const mx = -46, my = yT + 0.8;
    Zt.stroke(Zt.ellipse(mx, my + 0.6, 12, 2.4), 'chalk', '#cfe8e6', { w: 0.5, p: 0.5 });
    Zt.stroke(Zt.ellipse(mx, my + 0.8, 17, 3.2), 'chalk', '#bfdedc', { w: 0.4, p: 0.35 });
    for (let k = 0; k < 14; k++) { const a = k / 14 * 2 * PI; Zt.dot(mx + Math.cos(a) * 3.6, my - 1 + Math.sin(a) * 1.4, 'pastel', k % 2 ? '#f08a1e' : '#e8641e', { w: 2.4, p: 1 }); }
    Zt.dot(mx, my - 1.3, 'pastel', '#f6a020', { w: 3.2, p: 1 });
    Zt.dot(mx - 0.8, my - 2, 'chalk', '#ffd060', { w: 1.2, p: 0.9 });
    M.w8Petal(Zt, 30, yT + 1.5, 1.4, 'rose', 0.4);
    M.w8Petal(Zt, 74, yT + 0.6, 1.2, 'mari', 2.1);
    // ferns out of the joint where the tank meets the floor, and one from a crack high on the right
    const fern = (x, y, a, l) => {
      const ca = Math.cos(a), sa = Math.sin(a), stem = [];
      for (let t = 0; t <= 1.0001; t += 0.1) stem.push([x + ca * l * t + Math.sin(t * 2) * l * 0.12 * -sa, y + sa * l * t + t * t * l * 0.25]);
      Zt.stroke(stem, 'chalk', '#2e5a22', { w: 0.7, p: 0.9, tout: 0.5 });
      for (let k = 1; k < stem.length - 1; k++) for (const sd of [-1, 1]) {
        const q = stem[k], ll = l * 0.22 * (1 - k / stem.length), nx = -sa * sd, ny = ca * sd;
        Zt.stroke([q, [q[0] + nx * ll + ca * ll * 0.4, q[1] + ny * ll + sa * ll * 0.4]], 'chalk', k % 2 ? '#3f7a2e' : '#4e8a34', { w: 1.2, p: 0.9, tout: 0.6 });
      }
    };
    for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) fern(sg * (133 - k * 4), -1, sg > 0 ? -0.6 - k * 0.4 : -PI + 0.6 + k * 0.4, 16 - k * 3);
    fern(128, yT + 22, -0.9, 10);
  };

  /* ---------------------------------------------------------------- the door with the thread (Joined), sheet units */
  M.w8DoorDetail = function (A, d, o) {
    o = o || {};
    const w = d.x1 - d.x0;
    // a bell of bronze hung on a chain from the head of the arch, under the toran
    const by = d.ty + (d.ys - d.ty) * 0.42, ch = [];
    for (let y = d.ty + 2; y < by - 2.4; y += 1.1) ch.push([d.xc + Math.sin(y) * 0.12, y]);
    for (let i = 0; i < ch.length; i++) A.outline(A.ellipse(ch[i][0], ch[i][1], i % 2 ? 0.22 : 0.4, 0.5), 'kajal', '#5a3a10', { closed: true, w: 0.16, p: 0.85 });
    const bell = A.spline([[d.xc - 0.7, by - 2.6], [d.xc - 1.4, by - 1.2], [d.xc - 1.7, by + 1.2], [d.xc - 2.6, by + 2.2], [d.xc + 2.6, by + 2.2], [d.xc + 1.7, by + 1.2], [d.xc + 1.4, by - 1.2], [d.xc + 0.7, by - 2.6]], true, 0.2);
    A.fill(bell, 'gold', '#b8862a', { w: 0.5, p: 1, passes: 2 });
    M.floorWash(A, bell, '#4a2a08', (x) => 0.45 * sstep((x - d.xc) / 2.4 + 0.2), 'mul');
    A.stroke([[d.xc - 2.3, by + 1.4], [d.xc + 2.3, by + 1.4]], 'kajal', '#4a2a08', { w: 0.14, p: 0.7 });
    A.stroke([[d.xc - 0.9, by - 1.6], [d.xc - 1.1, by + 0.8]], 'chalk', '#fff0b8', { w: 0.3, p: 0.9 });
    A.outline(bell, 'kajal', LINE, { closed: true, w: 0.2, p: 0.85 });
    A.dot(d.xc + 0.3, by + 2.9, 'chalk', '#6a4410', { w: 0.9, p: 1 });
    if (o.bell) o.bell(d.xc, by, 2.6);
    if (o.glint) o.glint(d.xc - 1, by - 1);
    // the sill: rice thrown for luck, petals fallen from the toran, and a diya burning at each side of the door
    const y = d.yb - 0.4;
    for (let i = 0; i < 60; i++) { const x = d.x0 + w * A.rr(0.08, 0.92), yy = y + A.rr(-1.6, 1.2), a = A.rr(0, PI); A.stroke([[x - Math.cos(a) * 0.35, yy - Math.sin(a) * 0.2], [x + Math.cos(a) * 0.35, yy + Math.sin(a) * 0.2]], 'chalk', A.chance(0.85) ? '#fbf6e8' : '#e6c860', { w: 0.32, p: 1 }); }
    for (let i = 0; i < 14; i++) M.w8Petal(A, d.x0 + w * A.rr(0.12, 0.88), y + A.rr(-1.4, 1), A.rr(0.7, 1.1), A.pick(['mari', 'mari', 'rose', 'jasmine']), A.rr(0, 2 * PI));
    for (const fx of [0.16, 0.84]) {
      const x = d.x0 + w * fx, s = 0.16;
      M.wellDiya(A, x - 15 * s, y, s, 1, {});
      if (o.lamp) o.lamp(x, y - 16 * s);
    }
  };

  /* ---------------------------------------------------------------- the two cups (Hackathons), stand units */
  M.w8CupsDetail = function (Z, s, o) {
    o = o || {};
    const cups = [{ cx: -21, k: 1 }, { cx: 22, k: 40 / 46 }], by = -14;
    const glint = (x, y) => { Z.dot(x, y, 'chalk', '#fffbe8', { w: 0.45 * s, p: 0.95 }); };
    cups.forEach((c, ci) => {
      const kk = c.k * s, P = (u, v) => [(c.cx + u * c.k) * s, (by + v * c.k) * s];
      // the bowl's half-width at height v (cup units above the stand), as wellCups drew it
      const hw = v => v <= -30 ? 13 + 2 * (-30 - v) / 14 : v <= -20 ? 6 + 7 * (-20 - v) / 10 : 6;
      // 1. a beaded rim: bright beads round the front of the lip, each with its shadow
      for (let i = 0; i <= 22; i++) {
        const a = PI * i / 22, u = -14.4 * Math.cos(a), v = -44 + 2.6 * Math.sin(a);
        Z.dot(...P(u + 0.2, v + 0.3), 'chalk', GOLD_D, { w: 0.95 * kk, p: 1 });
        Z.dot(...P(u, v), 'chalk', i % 3 ? '#f4d26a' : '#fff4c0', { w: 0.7 * kk, p: 1 });
      }
      // 2. a band of punched dots under the rim, between two chased lines
      for (const v of [-39.4, -42.4]) Z.stroke([P(-hw(v) + 0.6, v), P(hw(v) - 0.6, v)], 'kajal', GOLD_D, { w: 0.2 * s, p: 0.8 });
      for (let u = -12.4; u <= 12.41; u += 1.55) Z.dot(...P(u, -40.9), 'chalk', GOLD_D, { w: 0.6 * kk, p: 1 });
      // 3. a chased vine round the rosette, its leaves sunk and dark, the stem catching the light
      for (const sd of [-1, 1]) {
        const pts = [];
        for (let t = 0; t <= 1.001; t += 0.05) pts.push(P(sd * (4.6 + 7.6 * t), -32 + Math.sin(t * PI * 2.4) * 3));
        Z.stroke(Z.spline(pts, false, 0.3), 'kajal', GOLD_D, { w: 0.32 * s, p: 0.9 });
        Z.stroke(Z.spline(pts.map(p => [p[0] - 0.12 * s, p[1] - 0.12 * s]), false, 0.3), 'chalk', '#fff0b0', { w: 0.12 * s, p: 0.7 });
        for (const t of [0.12, 0.34, 0.56, 0.78, 0.96]) {
          const u = sd * (4.6 + 7.6 * t), v = -32 + Math.sin(t * PI * 2.4) * 3, up = Math.cos(t * PI * 2.4) > 0 ? -1 : 1;
          const lf = Z.spline([P(u, v), P(u + sd * 0.6, v + up * 2.2), P(u + sd * 2.2, v + up * 2), P(u + sd * 1.2, v + up * 0.3)], true, 0.2);
          Z.fill(lf, 'chalk', '#8a5a14', { w: 0.3 * s, p: 0.85, passes: 1 });
          Z.outline(lf, 'kajal', GOLD_D, { closed: true, w: 0.14 * s, p: 0.8 });
        }
      }
      // 4. repousse lotus petals round the foot of the bowl: raised, lit on the left, shaded on the right
      const nP = 7;
      for (let i = 0; i < nP; i++) {
        const t = (i + 0.5) / nP, u = -10.6 + 21.2 * t, w = 3.3 * (1 - Math.abs(t - 0.5) * 0.7), lean = (t - 0.5) * 1.2;
        const tip = [u + lean, -29.4], b0 = [u - w * 0.5, -20.6], b1 = [u + w * 0.5, -20.6];
        const pet = Z.spline([P(...b0), P(u - w * 0.62 + lean * 0.5, -25.4), P(...tip), P(u + w * 0.62 + lean * 0.5, -25.4), P(...b1)], false, 0.25);
        Z.fill(pet, 'gold', '#e2b448', { w: 0.5 * s, p: 1, passes: 2 });
        const mid = P(u + lean * 0.5, -25)[0];
        M.floorWash(Z, pet, '#6a3a10', (x) => 0.5 * sstep((x - mid) / (w * 0.5 * kk) + 0.3), 'mul');
        Z.stroke([P(u - w * 0.42, -21.6), P(u - w * 0.4 + lean * 0.5, -25.6), P(tip[0] - 0.2, tip[1] + 0.8)], 'chalk', '#fff2c0', { w: 0.22 * s, p: 0.9 });
        Z.stroke([P(u, -21.2), P(u + lean * 0.8, -27.6)], 'kajal', GOLD_D, { w: 0.12 * s, p: 0.6 });
        Z.outline(pet, 'kajal', '#4a2a08', { closed: false, w: 0.2 * s, p: 0.85 });
        glint(...P(tip[0] - 0.3, tip[1] + 1.2));
      }
      Z.stroke([P(-hw(-20.4) + 0.3, -20.4), P(hw(-20.4) - 0.3, -20.4)], 'kajal', '#4a2a08', { w: 0.22 * s, p: 0.8 });
      // 5. down-turned petals and a beaded edge on the foot
      for (let i = 0; i < 5; i++) {
        const u = -8 + i * 4;
        Z.outline(Z.spline([P(u - 1.8, -6.2), P(u, -2.4), P(u + 1.8, -6.2)], false, 0.2), 'kajal', '#4a2a08', { closed: false, w: 0.16 * s, p: 0.75 });
        glint(...P(u - 0.6, -5));
      }
      for (let i = 0; i <= 14; i++) { const u = -10.6 + i * 1.514; Z.dot(...P(u, -0.8), 'chalk', i % 2 ? '#f4d26a' : GOLD_D, { w: 0.62 * kk, p: 1 }); }
      // the light breaking on the raised work
      for (const [u, v] of [[-9, -37], [-6, -34.5], [7, -36.5], [10, -30.6], [-11.5, -31], [2, -42.8], [-3, -39]]) glint(...P(u, v));
      if (o.glint) { o.glint(...P(-10, -43.4)); o.glint(...P(-6, -27)); }
      // a dent in the smaller cup, knocked in the carrying
      if (ci === 1) {
        Z.fill(Z.ellipse(...P(8.6, -37), 1.8 * kk, 1.2 * kk, 0.5), 'chalk', '#6a4410', { w: 0.5 * s, p: 0.55, passes: 1 });
        Z.stroke(Z.ellipse(...P(8.8, -36.6), 1.9 * kk, 1.3 * kk, 0.5, PI * 0.1, PI * 0.9), 'chalk', '#fff2c0', { w: 0.3 * s, p: 0.9 });
      }
    });
    // a garland of marigolds thrown over the outer handle of the big cup: two strands hanging, a tassel on each
    {
      const c = cups[0], P = (u, v) => [(c.cx + u * c.k) * s, (by + v * c.k) * s];
      const strands = [[[-21.4, -38.4], [-24.6, -30], [-25, -20], [-23, -11]], [[-21.4, -38.4], [-20.6, -30], [-18.6, -22], [-16, -15]]];
      strands.forEach((st, si) => {
        const path = Z.spline(st.map(q => P(...q)), false, 0.3);
        let acc = 0, last = path[0];
        const balls = [path[0]];
        for (const q of path) { acc += Math.hypot(q[0] - last[0], q[1] - last[1]); last = q; if (acc >= 2.2 * s) { balls.push(q); acc = 0; } }
        balls.forEach((q, j) => {
          const col = (j + si) % 3 === 0 ? '#f6c02a' : (j + si) % 3 === 1 ? '#f08a1e' : '#e8641e';
          Z.dot(q[0] + 0.15 * s, q[1] + 0.2 * s, 'chalk', '#6a2a08', { w: 2.4 * s, p: 0.8 });
          Z.dot(q[0], q[1], 'pastel', col, { w: 2.2 * s, p: 1 });
          for (let m = 0; m < 5; m++) { const a = m * 1.256 + j; Z.dot(q[0] + Math.cos(a) * 0.55 * s, q[1] + Math.sin(a) * 0.55 * s, 'chalk', Z.mix(col, '#ffffff', 0.25), { w: 0.5 * s, p: 0.8 }); }
          Z.dot(q[0] - 0.2 * s, q[1] - 0.25 * s, 'chalk', '#fff0a0', { w: 0.4 * s, p: 0.8 });
        });
        const end = path[path.length - 1];
        for (let m = -1; m <= 1; m++) Z.stroke([[end[0], end[1] + 1.2 * s], [end[0] + m * 0.5 * s, end[1] + 3.2 * s]], 'chalk', m ? '#c4301c' : '#d6a535', { w: 0.4 * s, p: 0.95, tout: 0.4 });
        Z.dot(end[0], end[1] + 1.2 * s, 'gold', GOLD, { w: 0.8 * s, p: 1 });
      });
      // a mango leaf tied at the top
      const t0 = P(-21.4, -38.4);
      Z.fill(Z.ellipse(t0[0] - 1.4 * s, t0[1] - 0.6 * s, 2.2 * s, 0.8 * s, -0.5), 'chalk', '#3e7a2a', { w: 0.5 * s, p: 1, passes: 2 });
      Z.stroke([[t0[0] - 3.2 * s, t0[1] + 0.4 * s], [t0[0] + 0.3 * s, t0[1] - 1.4 * s]], 'kajal', '#1e3a10', { w: 0.14 * s, p: 0.7 });
    }
    // a rumal of red silk with a zari border folded on the right of the stand and hanging over its front
    const R = (u, v) => [u * s, v * s];
    const top = [R(31, -14), R(49, -14), R(50.5, -10.6), R(41, -3.2), R(30, -10.4)];
    Z.ground(top, '#9a1c2a', { edge: 0, w: 1.2 * s, rub: 0, top: 0 });
    Z.fill(top, 'pastel', '#b8283a', { w: 0.8 * s, p: 0.5, passes: 1, ang: 0.6 });
    M.floorWash(Z, top, '#2a0810', (x, y) => 0.4 * sstep((y + 12.5 * s) / (6 * s)), 'mul');
    Z.stroke([R(30.6, -13.2), R(48.6, -13.2)], 'gold', GOLD, { w: 0.6 * s, p: 1 });
    Z.stroke([R(31, -10.8), R(40.8, -4), R(50, -10.8)], 'gold', GOLD, { w: 0.55 * s, p: 1 });
    for (const [u, v] of [[36, -11.4], [44, -11.4], [40.4, -7.6], [34, -8.6], [46.4, -8.6]]) { Z.dot(...R(u, v), 'chalk', '#f6d26a', { w: 0.5 * s, p: 1 }); Z.dot(...R(u, v), 'chalk', '#f4ecd8', { w: 0.2 * s, p: 1 }); }
    Z.stroke([R(41, -3.2), R(41.2, -1.6)], 'chalk', GOLD, { w: 0.3 * s, p: 1 });
    Z.dot(...R(41.2, -1.3), 'gold', GOLD, { w: 0.7 * s, p: 1 });
    Z.outline(top, 'kajal', LINE, { closed: true, w: 0.2 * s, p: 0.8 });
    // petals on the stand
    for (let i = 0; i < 7; i++) M.w8Petal(Z, Z.rr(-46, 28) * s, Z.rr(-14.4, -13.4) * s, Z.rr(0.9, 1.3), Z.pick(['mari', 'rose', 'rose', 'jasmine']), Z.rr(0, 2 * PI));
    M.w8Petal(Z, -38 * s, -7 * s, 1.2, 'rose', 1.2);
    if (o.glint) o.glint(...R(41.2, -1.3));
  };

  /* ---------------------------------------------------------------- the dark room behind a light object
     M.w8Interior(A, xc, ow, yb, ys, ya, o): a painted interior seen through an arch, in the level's own dark.
     o.key: { side, far, floor, deep, pattern }; o.sky: a night sky with stars, hills and a new moon instead of a room;
     o.lamps: a list the lamp's flame is pushed to; o.line: the outline colour; o.lampSide, o.lampH: where the niche lamp sits, across the opening (fraction of its width from the middle) and up
     from its foot (fraction of its height); no lampSide, no lamp. */
  M.w8Interior = function (A, xc, ow, yb, ys, ya, o) {
    const K = o.key, h = yb - ya, x0 = xc - ow / 2, x1 = xc + ow / 2;
    const op = M.w8Arch(x0, x1, yb, ys, ya, o.lobes || 0);
    if (o.sky) {
      A.ground(op, K.far, { edge: 0, w: 6, rub: 0, top: 0 });
      M.floorWash(A, op, K.side, (x, y) => 0.85 * sstep((y - ya - h * 0.25) / (h * 0.75)), 'over');
      A.withMask(op, () => {
        const hills = [[x0 - 2, yb + 2]];
        for (let x = x0 - 2; x <= x1 + 2.1; x += ow / 24) hills.push([x, yb - h * (0.1 + 0.05 * Math.sin(x * 0.09) + 0.03 * Math.sin(x * 0.23))]);
        hills.push([x1 + 2, yb + 2]);
        A.fill(hills, 'chalk', K.deep, { w: 3, p: 1, passes: 2 });
        // the stars, a few bright with a cross of light
        for (let i = 0; i < 46; i++) {
          const x = x0 + A.rr(0.04, 0.96) * ow, y = ya + A.rr(0.06, 0.7) * h;
          if (!A.inside(op, x, y)) continue;
          const big = i % 9 === 0, r = A.rr(0.35, 0.8) * (big ? 1.8 : 1);
          A.dot(x, y, 'chalk', i % 4 ? '#f2ead0' : '#cfe0f0', { w: r, p: 0.9 });
          if (big) for (const a of [0, PI / 2]) A.stroke([[x - Math.cos(a) * r * 2.4, y - Math.sin(a) * r * 2.4], [x + Math.cos(a) * r * 2.4, y + Math.sin(a) * r * 2.4]], 'chalk', '#f6f0dc', { w: r * 0.3, p: 0.8 });
        }
        // a thin new moon low on the left
        const mx = x0 + ow * 0.84, my = ya + h * 0.36, mr = ow * 0.035;
        A.fill(A.ellipse(mx, my, mr, mr), 'chalk', '#f6eccc', { w: 0.6, p: 1, passes: 2 });
        A.fill(A.ellipse(mx + mr * 0.38, my - mr * 0.15, mr * 0.92, mr * 0.92), 'chalk', K.far, { w: 0.6, p: 1, passes: 2 });
      });
    } else {
      // the room: its side walls and vault, the far wall with a smaller arch in it, the floor running back
      A.ground(op, K.side, { edge: 0, w: 6, rub: 0, top: 0 });
      const ib = yb - h * 0.12, iw = ow * 0.64, fx0 = xc - iw / 2, fx1 = xc + iw / 2, fya = ya + h * 0.16, fys = ys + h * 0.08;
      const far = M.w8Arch(fx0, fx1, ib, fys, fya, 0);
      A.ground(far, K.far, { edge: 0, w: 5, rub: 0, top: 0 });
      // the far wall's pattern: a faint lattice of little flowers
      A.withMask(far, () => {
        for (let y = fya + 3; y < ib - 2; y += 6) for (let x = fx0 + 3 + ((y / 6 | 0) % 2) * 3; x < fx1 - 2; x += 6) {
          A.dot(x, y, 'chalk', K.pattern, { w: 0.9, p: 0.55 });
          for (let q = 0; q < 4; q++) A.dot(x + Math.cos(q * PI / 2) * 0.9, y + Math.sin(q * PI / 2) * 0.9, 'chalk', K.pattern, { w: 0.5, p: 0.4 });
        }
      });
      // a doorway further in, darker still
      const dw = iw * 0.34, door = M.w8Arch(xc - dw / 2, xc + dw / 2, ib, ib - h * 0.3, ib - h * 0.44, 0);
      A.ground(door, K.deep, { edge: 0, w: 3, rub: 0, top: 0 });
      A.outline(door.slice(1, -1), 'kajal', o.line, { closed: false, w: 0.4, p: 0.6 });
      // the floor between, catching light from outside
      const fl = [[x0, yb], [x1, yb], [fx1, ib], [fx0, ib]];
      A.fill(fl, 'chalk', K.floor, { w: 3, p: 1, passes: 2 });
      M.floorWash(A, fl, '#f0c890', (x, y) => 0.25 * sstep((y - ib) / (yb - ib)), 'over');
      // the edges where the side walls meet the far wall
      for (const sg of [-1, 1]) A.stroke([[xc + sg * iw / 2, ib], [xc + sg * iw / 2, fys]], 'kajal', o.line, { w: 0.35, p: 0.45 });
      A.outline(far.slice(1, -1), 'kajal', o.line, { closed: false, w: 0.4, p: 0.5 });
      // one lamp in a niche, where the object in front leaves it in sight, its glow round it
      if (o.lampSide != null) {
      const lx = xc + ow * o.lampSide, ly = yb - h * (o.lampH || 0.4), nw = ow * 0.05;
      const niche = M.w8Arch(lx - nw, lx + nw, ly + nw * 1.2, ly - nw * 0.4, ly - nw * 1.4, 0);
      M.lampGlow(A, lx, ly, ow * 0.2, 0.55, {});
      A.ground(niche, K.deep, { edge: 0, w: 1, rub: 0, top: 0 });
      M.floorWash(A, niche, '#f0a040', (x, y) => 0.55 * (1 - sstep(Math.hypot(x - lx, y - ly - nw * 0.6) / (nw * 1.6))), 'over');
      M.w8Flame(A, lx, ly + nw * 0.7, nw * 0.9);
      A.fill(A.ellipse(lx, ly + nw * 0.9, nw * 0.5, nw * 0.2, 0, 0, PI), 'chalk', '#9a5a2a', { w: 0.4, p: 1, passes: 1 });
      A.outline(niche.slice(1, -1), 'kajal', o.line, { closed: false, w: 0.35, p: 0.6 });
      if (o.lamps) o.lamps.push([lx, ly + nw * 0.2]);
      }
      // the vault in shade, deepest at the crown
      M.floorWash(A, op, '#000000', (x, y) => 0.35 * (1 - sstep((y - ya) / (h * 0.45))), 'mul');
    }
    A.outline(op.slice(1, -1), 'kajal', o.line, { closed: false, w: 0.6, p: 0.9 });
    return op;
  };

  /* ---------------------------------------------------------------- a crane (Delta Force), as M.crane drew it with ang PI */
  M.w8CraneDetail = function (A, x, y, s) {
    const P = (u, v) => [x - u * s, y + v * s], k = s / 54;
    // the red of the bare head running down the upper neck, the grey crown, the eye again over it
    A.stroke(A.spline([P(0.355, -0.04), P(0.39, -0.047), P(0.42, -0.055)], false, 0.2), 'pastel', '#c8323a', { w: 0.026 * s, p: 0.9, tin: 0.4, tout: 0 });
    const hd = A.ellipse(...P(0.43, -0.058), 0.034 * s, 0.024 * s, 0.15);
    A.fill(hd, 'pastel', '#d23a3a', { w: 1.2 * k, p: 1, passes: 2 });
    A.fill(A.ellipse(...P(0.432, -0.074), 0.02 * s, 0.008 * s, 0.15), 'chalk', '#d6d2dc', { w: 0.8 * k, p: 1, passes: 1 });
    A.dot(...P(0.436, -0.062), 'chalk', '#f4e6a0', { w: 1.5 * k, p: 1 });
    A.dot(...P(0.437, -0.062), 'kajal', '#140e0a', { w: 0.8 * k, p: 1 });
    A.stroke([P(0.444, -0.05), P(0.414, -0.046)], 'chalk', '#8a8494', { w: 0.6 * k, p: 0.7 });
    A.outline(hd, 'kajal', '#5a2a2a', { closed: true, w: 0.4 * k, p: 0.5 });
    // the ruff at the foot of the neck, combed back by the wind
    for (let i = 0; i < 5; i++) { const u = 0.15 + i * 0.016; A.stroke([P(u, 0.006 + i * 0.002), P(u - 0.05, 0.028 + i * 0.003), P(u - 0.085, 0.026 + i * 0.004)], 'chalk', i % 2 ? '#7a7488' : '#9a94a8', { w: 0.7 * k, p: 0.75, tout: 0.6 }); }
    // the bustle: long grey plumes curling off the back over the tail
    for (let i = 0; i < 4; i++) { const v = -0.022 + i * 0.012; A.stroke(A.spline([P(-0.1, v), P(-0.17, v + 0.006), P(-0.24, v + 0.022), P(-0.27, v + 0.04), P(-0.255, v + 0.05)], false, 0.2), 'chalk', i % 2 ? '#a49eb4' : '#b8b2c6', { w: 1.1 * k, p: 0.8, tout: 0.5 }); }
    // ruffled feathers along the back
    for (let i = 0; i < 6; i++) { const u = -0.07 + i * 0.03, v = -0.052 + Math.abs(u - 0.02) * 0.1; A.stroke([P(u - 0.008, v - 0.004), P(u, v + 0.004), P(u + 0.008, v - 0.003)], 'kajal', '#8a8298', { w: 0.35 * k, p: 0.55 }); }
  };

})();
