(function () {
  'use strict';
  /* ==========================================================================
     THE GOLD WELL (well8k): A SARUS CRANE IN FLIGHT
       M.w8Crane(A, x, y, s, o)   x, y: the middle of the back; s: beak to tail.  It faces right, o.flip faces it left.
                                  o.wing: 'up' (both wings raised), 'mid' (held out level), 'down' (the near wing below).
                                  o.glint(x, y): where the sun catches the back.
     A pale grey bird with a long neck held straight out, the bare head and upper neck red, a grey crown, an orange
     eye ringed in kajal, a long olive beak; the legs trailing far behind, pink.  Each wing in three parts: pale
     coverts in scallops, a row of grey secondaries along the back edge, and the dark primaries spread at the tip like
     fingers.  A drooping bustle of grey plumes over the tail.
     ======================================================================== */
  const PI = Math.PI;
  const sstep = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  const C = { body: '#d6d2de', light: '#f2f0f6', cov: '#e4e0ea', sec: '#9894a8', prim: '#4a4858', primL: '#7a7688', dark: '#5e5a6e', red: '#cc3a36', redD: '#8a2224', crown: '#c8c6d2', beak: '#7a7a5a', leg: '#d89a96', iris: '#e8701e', line: '#2a2634' };

  function feather(A, Q, s, b, ang, len, wd, col, edge) {
    const ca = Math.cos(ang), sa = Math.sin(ang), pu = -sa, pv = ca;
    const at = (t, k) => Q(b[0] + ca * len * t + pu * wd * k, b[1] + sa * len * t + pv * wd * k);
    const poly = [at(0, 0.5), at(0.6, 0.5), at(0.92, 0.3), at(1, 0), at(0.92, -0.36), at(0.55, -0.5), at(0, -0.5)];
    A.ground(poly, col, { edge: 0, w: Math.max(0.15, wd * 1.1 * s), rub: 0, top: 0 });
    A.stroke([at(0.05, 0), at(0.9, 0.02)], 'chalk', A.mix(col, C.light, 0.45), { w: 0.006 * s, p: 0.7 });
    A.outline(poly, 'kajal', edge || C.line, { closed: true, w: 0.006 * s, p: 0.5 });
  }
  // a wing from the shoulder: arm to the wrist, hand to the tip; the trailing side is the side away from the head
  function wing(A, Q, s, sh, wr, tip, root, far) {
    const k = far ? 0.35 : 0;
    const col = c => far ? A.mix(c, C.dark, k) : c;
    const ax = wr[0] - sh[0], ay = wr[1] - sh[1], al = Math.hypot(ax, ay);
    let nx = -ay / al, ny = ax / al; if (nx > 0) { nx = -nx; ny = -ny; }
    const hx = tip[0] - wr[0], hy = tip[1] - wr[1], hl = Math.hypot(hx, hy), ha = Math.atan2(hy, hx), na = Math.atan2(ny, nx);
    // turn toward the trailing side from the hand's direction
    let dA = na - ha; while (dA > PI) dA -= 2 * PI; while (dA < -PI) dA += 2 * PI;
    const sg = dA > 0 ? 1 : -1;
    // the secondaries, from the body out to the wrist, pointing back
    for (let i = 0; i < 9; i++) {
      const t = i / 8, b = [root[0] + (wr[0] - root[0]) * t, root[1] + (wr[1] - root[1]) * t];
      feather(A, Q, s, b, na - sg * 0.12 * t, 0.17 - 0.03 * t, 0.05, col(A.mix(C.sec, C.dark, (i % 2) * 0.12)));
    }
    // the primaries, fanned from the hand, the longest at the tip, the tips standing apart
    for (let i = 6; i >= 0; i--) {
      const t = i / 6, b = [wr[0] + hx * (0.2 + 0.5 * t), wr[1] + hy * (0.2 + 0.5 * t)];
      feather(A, Q, s, b, ha + sg * (0.75 - 0.75 * t) + sg * 0.05, hl * (0.55 + 0.4 * t), 0.042, col(A.mix(C.prim, C.primL, 0.25 * (1 - t))));
    }
    // the coverts: the arm and the hand's leading edge, with scallops, over the roots of the flight feathers
    const back = [root[0] + nx * 0.07, root[1] + ny * 0.07], wb = [wr[0] + nx * 0.07, wr[1] + ny * 0.07];
    const cov = A.spline([Q(...root), Q(...sh), Q((sh[0] + wr[0]) / 2 - nx * 0.02, (sh[1] + wr[1]) / 2 - ny * 0.02), Q(...wr), Q(wr[0] + hx * 0.38, wr[1] + hy * 0.38), Q(wr[0] + hx * 0.22 + nx * 0.05, wr[1] + hy * 0.22 + ny * 0.05), Q(...wb), Q(...back)], true, 0.5);
    A.ground(cov, col(C.cov), { edge: 0, w: 0.06 * s, rub: 0, top: 0 });
    A.fill(cov, 'pastel', col(C.light), { w: 0.03 * s, p: 0.4, passes: 1 });
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
      const t = 0.1 + i * 0.16, u = root[0] + (wr[0] - root[0]) * t + nx * (0.02 + r * 0.03), v = root[1] + (wr[1] - root[1]) * t + ny * (0.02 + r * 0.03);
      const arc = []; for (let j = 0; j <= 5; j++) { const a = na + PI / 2 + PI * j / 5; arc.push(Q(u + Math.cos(a) * 0.022, v + Math.sin(a) * 0.022)); }
      A.stroke(arc, 'kajal', col(A.mix(C.sec, C.cov, 0.3)), { w: 0.005 * s, p: 0.55 });
    }
    A.outline(cov, 'kajal', C.line, { closed: true, w: 0.008 * s, p: 0.55 });
  }

  M.w8Crane = function (A, x, y, s, o) {
    o = o || {};
    const f = o.flip ? -1 : 1, Q = (u, v) => [x + u * s * f, y + v * s], ph = o.wing || 'mid';
    const sh = [0.03, -0.045], root = [-0.11, -0.03];
    const W = { up: { wr: [-0.08, -0.36], tip: [-0.2, -0.66] }, mid: { wr: [-0.16, -0.16], tip: [-0.46, -0.24] }, down: { wr: [-0.06, 0.24], tip: [-0.2, 0.52] } }[ph];
    const WF = { up: { wr: [0.0, -0.34], tip: [-0.06, -0.62] }, mid: { wr: [-0.1, -0.2], tip: [-0.34, -0.36] }, down: { wr: [0.02, -0.2], tip: [-0.08, -0.46] } }[ph];
    // the far wing first, in shade
    wing(A, Q, s, [sh[0] + 0.03, sh[1] - 0.005], WF.wr, WF.tip, [root[0] + 0.04, root[1] - 0.006], true);
    // the legs trailing behind, a little apart, toes curled
    for (const dv of [0, 0.014]) {
      const leg = A.spline([Q(-0.1, 0.02 + dv), Q(-0.3, 0.035 + dv), Q(-0.5, 0.045 + dv * 1.4)], false, 0.3);
      A.stroke(leg, 'chalk', C.leg, { w: 0.012 * s, p: 0.95, tin: 0 });
      A.stroke([Q(-0.5, 0.045 + dv * 1.4), Q(-0.535, 0.04 + dv * 1.4)], 'chalk', C.leg, { w: 0.007 * s, p: 0.9 });
      A.stroke([Q(-0.5, 0.045 + dv * 1.4), Q(-0.53, 0.056 + dv * 1.4)], 'chalk', C.leg, { w: 0.006 * s, p: 0.9 });
      A.dot(...Q(-0.26, 0.032 + dv), 'chalk', A.mix(C.leg, C.line, 0.3), { w: 0.014 * s, p: 0.9 });
    }
    // the body and the neck held straight out, laid solid, then the head
    const body = A.spline([[0.14, -0.04], [0.04, -0.07], [-0.1, -0.055], [-0.2, -0.02], [-0.21, 0.0], [-0.1, 0.036], [0.04, 0.05], [0.14, 0.026]].map(p => Q(p[0], p[1])), true, 0.5);
    const neckTop = [[0.12, -0.035], [0.22, -0.045], [0.32, -0.054], [0.41, -0.072]], neckBot = [[0.43, -0.04], [0.33, -0.03], [0.22, -0.012], [0.12, 0.02]];
    const neck = A.spline(neckTop.concat(neckBot).map(p => Q(p[0], p[1])), true, 0.5);
    const head = A.spline([[0.4, -0.074], [0.43, -0.088], [0.462, -0.084], [0.478, -0.066], [0.47, -0.046], [0.44, -0.038], [0.41, -0.044]].map(p => Q(p[0], p[1])), true, 0.4);
    for (const q of [body, neck, head]) A.ground(q, C.body, { edge: 0, w: 0.05 * s, rub: 0, top: 0 });
    A.fill(body, 'pastel', C.light, { w: 0.03 * s, p: 0.4, passes: 1, ang: 0 });
    const by = y + 0.05 * s;
    M.floorWash(A, body, C.dark, (xx, yy) => 0.35 * sstep((yy - (y - 0.01 * s)) / (0.06 * s)), 'mul');
    M.floorWash(A, neck, C.dark, (xx, yy) => 0.22 * sstep((yy - (y - 0.04 * s)) / (0.05 * s)), 'mul');
    // the bustle over the tail
    for (let i = 0; i < 5; i++) {
      const v = -0.04 + i * 0.012;
      A.stroke(A.spline([Q(-0.1, v), Q(-0.18, v + 0.008), Q(-0.25, v + 0.026), Q(-0.275, v + 0.044), Q(-0.262, v + 0.054)], false, 0.3), 'chalk', i % 2 ? C.sec : A.mix(C.sec, C.light, 0.4), { w: 0.016 * s, p: 0.85, tout: 0.5 });
    }
    // the red of the head running down the upper neck, the grey crown, the ear patch
    M.floorWash(A, neck, C.red, (xx, yy) => { const u = (xx - x) / (s * f); return 0.95 * sstep((u - 0.33) / 0.05); }, 'over');
    A.ground(head, C.red, { edge: 0, w: 0.03 * s, rub: 0, top: 0 });
    A.fill(head, 'pastel', A.mix(C.red, '#ff8a70', 0.3), { w: 0.012 * s, p: 0.5, passes: 1 });
    A.fill(A.ellipse(...Q(0.445, -0.081), 0.024 * s, 0.008 * s, -0.1 * f), 'chalk', C.crown, { w: 0.01 * s, p: 1, passes: 1 });
    A.dot(...Q(0.418, -0.056), 'chalk', '#a8a4b4', { w: 0.018 * s, p: 0.8 });
    // the beak, long and pointed, and the eye
    const bk = [Q(0.47, -0.075), Q(0.62, -0.058), Q(0.472, -0.05)];
    A.fill(bk, 'chalk', C.beak, { w: 0.012 * s, p: 1, passes: 2 });
    A.stroke([Q(0.48, -0.062), Q(0.6, -0.058)], 'kajal', C.line, { w: 0.004 * s, p: 0.7 });
    A.outline(bk, 'kajal', C.line, { closed: true, w: 0.005 * s, p: 0.7 });
    A.dot(...Q(0.452, -0.068), 'chalk', C.iris, { w: 0.016 * s, p: 1 });
    A.dot(...Q(0.454, -0.068), 'kajal', '#140e0a', { w: 0.008 * s, p: 1 });
    A.outline(A.ellipse(...Q(0.452, -0.068), 0.011 * s, 0.007 * s, 0), 'kajal', C.line, { closed: true, w: 0.0045 * s, p: 0.9 });
    // the outline that closes the form
    for (const q of [body, neck]) A.outline(q, 'kajal', C.line, { closed: true, w: 0.007 * s, p: 0.5 });
    A.outline(head, 'kajal', C.redD, { closed: true, w: 0.006 * s, p: 0.6 });
    // the near wing over all
    wing(A, Q, s, sh, W.wr, W.tip, root, false);
    if (o.glint) o.glint(...Q(-0.02, -0.06));
    return { x, y, s };
  };
})();
