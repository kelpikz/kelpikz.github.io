(function () {
  'use strict';
  /* ==========================================================================
     THE GOLD WELL (well8k): THE PIGEON, drawn the Mewar way
       M.w8Pigeon(A, x, y, s, pose, o)   a rock pigeon in profile, facing right (o.flip faces it left).
                                         x, y: where its feet are; s: its length, beak to tail.
                                         pose: 'sit', 'preen' (head turned back into the wing), 'tuck' (head drawn
                                         in, eye shut), 'half' (a wing lifted and opened), 'land' (body up, both
                                         wings spread, feet down), 'fly' (both wings spread, feet tucked).
                                         o.c: 'grey' (default), 'white', 'brown', or an object of colours;
                                         o.shadow: false to leave out the shadow under its feet.
       M.w8PigeonHead(A, x, y, s, o)     only the head and the top of the neck, as when a bird looks out of a hole.
     One silhouette, laid solid; then the tail, the sheen of the neck, the folded or spread wing with its scalloped
     coverts and two dark bars, the almond eye ringed in kajal, pink feet.
     ======================================================================== */
  const PI = Math.PI;
  const sstep = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  const COATS = {
    grey: { body: '#8e98a8', dark: '#3e4656', light: '#d2d8e0', wing: '#a9b3bf', bar: '#262c36', tail: '#6c7686', head: '#7a8496' },
    white: { body: '#eeebe4', dark: '#8c867c', light: '#fdfcf8', wing: '#e6e2d8', bar: '#aaa294', tail: '#dcd8ce', head: '#e4e0d6' },
    brown: { body: '#a8806a', dark: '#4e3426', light: '#e0cab6', wing: '#c09c80', bar: '#3e2618', tail: '#86624c', head: '#946c56' }
  };
  const BASE = { green: '#3f9a74', violet: '#8c54a8', foot: '#e3868a', beak: '#3a302c', cere: '#f2eee4', iris: '#e8701e', line: '#262a30' };
  const coat = c => Object.assign({}, BASE, typeof c === 'object' && c ? c : COATS[c || 'grey'] || COATS.grey);

  // the silhouette, sitting: forehead, crown, nape, back, rump, tail, vent, belly, breast, throat, chin
  const SIL = [[0.5, -0.95], [0.42, -1.0], [0.32, -0.95], [0.24, -0.79], [0.12, -0.63], [-0.1, -0.56], [-0.4, -0.43], [-0.7, -0.34], [-0.96, -0.3],
    [-0.98, -0.22], [-0.62, -0.22], [-0.38, -0.18], [-0.1, -0.05], [0.1, -0.04], [0.3, -0.16], [0.41, -0.36], [0.43, -0.56], [0.47, -0.74], [0.53, -0.87]];
  // turned back to preen: the neck bends over the back, the head lies on the wing
  const SIL_PREEN = [[0.3, -0.6], [0.28, -0.74], [0.16, -0.86], [0.02, -0.88], [-0.1, -0.8], [-0.1, -0.68], [-0.4, -0.43], [-0.7, -0.34], [-0.96, -0.3],
    [-0.98, -0.22], [-0.62, -0.22], [-0.38, -0.18], [-0.1, -0.05], [0.1, -0.04], [0.3, -0.16], [0.41, -0.36], [0.42, -0.5]];
  // hunched, head drawn in, the feathers fluffed
  const SIL_TUCK = [[0.46, -0.8], [0.38, -0.86], [0.28, -0.82], [0.16, -0.68], [-0.1, -0.6], [-0.42, -0.45], [-0.7, -0.34], [-0.96, -0.3],
    [-0.98, -0.22], [-0.62, -0.22], [-0.38, -0.16], [-0.1, -0.03], [0.12, -0.02], [0.34, -0.14], [0.45, -0.36], [0.47, -0.58], [0.5, -0.72]];

  function eye(A, Q, s, C, ec, d, shut) {
    if (shut) { A.stroke([Q(ec[0] - d * 0.045, ec[1]), Q(ec[0], ec[1] + 0.014), Q(ec[0] + d * 0.035, ec[1])], 'kajal', C.line, { w: 0.016 * s, p: 0.85 }); return; }
    const top = [], bot = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8, u = ec[0] - d * 0.055 + d * 0.095 * t, h = 0.028 * Math.pow(Math.sin(PI * t), 0.8); top.push(Q(u, ec[1] - h)); bot.unshift(Q(u, ec[1] + h * 0.8)); }
    const alm = top.concat(bot);
    A.fill(alm, 'chalk', '#f6f0e2', { w: 0.02 * s, p: 1, passes: 1 });
    A.dot(...Q(ec[0] + d * 0.008, ec[1]), 'chalk', C.iris, { w: 0.04 * s, p: 1 });
    A.dot(...Q(ec[0] + d * 0.01, ec[1]), 'kajal', '#140e0a', { w: 0.019 * s, p: 1 });
    A.dot(...Q(ec[0] + d * 0.002, ec[1] - 0.009), 'chalk', '#ffffff', { w: 0.009 * s, p: 1 });
    A.outline(alm, 'kajal', C.line, { closed: true, w: 0.013 * s, p: 0.9 });
    A.stroke([Q(ec[0] - d * 0.055, ec[1]), Q(ec[0] - d * 0.095, ec[1] - 0.01)], 'kajal', C.line, { w: 0.011 * s, p: 0.8, tout: 0.6 });
  }
  function beak(A, Q, s, C, b0, v, d, ang) {
    const ca = Math.cos(ang || 0), sa = Math.sin(ang || 0), R = (du, dv) => Q(b0 + d * (du * ca - dv * sa), v + du * sa + dv * ca);
    A.fill([R(0, -0.03), R(0.14, 0.006), R(0.13, 0.016), R(0, 0.026)], 'chalk', C.beak, { w: 0.028 * s, p: 1, passes: 1 });
    A.fill([R(-0.005, -0.034), R(0.04, -0.018), R(0.035, -0.004), R(-0.005, -0.008)], 'chalk', C.cere, { w: 0.02 * s, p: 1, passes: 1 });
    A.stroke([R(0.012, 0.003), R(0.12, 0.009)], 'kajal', C.line, { w: 0.009 * s, p: 0.6 });
  }
  // the sheen of the neck: short dabs of green over violet, following the curve of the neck
  function sheen(A, Q, s, C, c, clip) {
    // a soft green band over a violet one, washed across the whole neck and kept inside the outline, then a few
    // short strokes of each colour and lit dabs so it shimmers instead of reading as a stamp
    const g = Q(c[0] + 0.01, c[1] - 0.035), v = Q(c[0] - 0.03, c[1] + 0.04);
    const ell = (p, rx, ry, a) => (xx, yy) => a * (1 - sstep(Math.hypot((xx - p[0]) / (rx * s), (yy - p[1]) / (ry * s))));
    M.floorWash(A, clip, C.violet, ell(v, 0.15, 0.07, 0.62), 'over');
    M.floorWash(A, clip, C.green, ell(g, 0.13, 0.055, 0.66), 'over');
    for (let i = 0; i < 7; i++) {
      const u = c[0] - 0.09 + i * 0.03, dv = Math.sin(i * 1.7) * 0.012;
      A.stroke([Q(u - 0.012, c[1] - 0.05 + dv), Q(u + 0.016, c[1] - 0.03 + dv)], 'chalk', C.green, { w: 0.012 * s, p: 0.55 });
      A.stroke([Q(u - 0.02, c[1] + 0.025 + dv), Q(u + 0.01, c[1] + 0.05 + dv)], 'chalk', C.violet, { w: 0.012 * s, p: 0.5 });
      if (i % 2) A.stroke([Q(u - 0.006, c[1] - 0.045), Q(u + 0.012, c[1] - 0.04)], 'chalk', C.light, { w: 0.008 * s, p: 0.5 });
    }
  }
  // the scallops of the coverts: rows of small pale arcs, each with a dark edge on the tail side
  function scallops(A, Q, s, C, rows, r0) {
    const ru = r0 || 0.036;
    for (const row of rows) for (const c of row) {
      const arc = [], arc2 = [];
      for (let i = 0; i <= 6; i++) { const a = PI / 2 + PI * i / 6; arc.push(Q(c[0] + Math.cos(a) * ru, c[1] + Math.sin(a) * ru * 0.9)); arc2.push(Q(c[0] + Math.cos(a) * ru * 1.2 - 0.004, c[1] + Math.sin(a) * ru)); }
      A.stroke(arc, 'pastel', A.mix(C.wing, C.light, 0.6), { w: 0.022 * s, p: 0.85 });
      A.stroke(arc2, 'kajal', A.mix(C.wing, C.dark, 0.6), { w: 0.008 * s, p: 0.45 });
    }
  }
  // one flight feather: a narrow blade with a pale shaft
  function blade(A, Q, s, C, b, ang, len, wd, col) {
    const ca = Math.cos(ang), sa = Math.sin(ang), pu = -sa, pv = ca;
    const at = (t, k) => Q(b[0] + ca * len * t + pu * wd * k, b[1] + sa * len * t + pv * wd * k);
    const poly = [at(0, 0.5), at(0.55, 0.55), at(0.9, 0.32), at(1, 0.02), at(0.9, -0.4), at(0.5, -0.5), at(0, -0.5)];
    A.ground(poly, col, { edge: 0, w: Math.max(0.2, wd * 1.2) * s, rub: 0, top: 0 });
    A.stroke([at(0.04, -0.05), at(0.92, 0.02)], 'chalk', A.mix(col, C.light, 0.55), { w: 0.007 * s, p: 0.75 });
    A.outline(poly, 'kajal', C.line, { closed: true, w: 0.009 * s, p: 0.55 });
  }
  /* a spread wing.  sh: the shoulder; wr: the wrist; the primaries fan from the hand between angles a0 and a1, the
     secondaries hang from the arm toward the back.  far: the wing behind the body, darker and with no detail. */
  function spread(A, Q, s, C, sh, wr, a0, a1, far) {
    const col = far ? A.mix(C.wing, C.dark, 0.3) : C.wing, fcol = far ? A.mix(C.wing, C.dark, 0.5) : A.mix(C.wing, C.dark, 0.25);
    const hand = [wr[0] - 0.16, wr[1] + 0.05], root = [sh[0] - 0.3, sh[1] + 0.04];
    for (let i = 0; i < 6; i++) { const t = i / 5, b = [hand[0] + (root[0] - hand[0]) * t, hand[1] + (root[1] - hand[1]) * t]; blade(A, Q, s, C, b, a1 - 0.2 - t * 0.5, 0.26 - t * 0.05, 0.075, A.mix(fcol, C.light, 0.08)); }
    for (let i = 6; i >= 0; i--) { const t = i / 6, b = [wr[0] + (hand[0] - wr[0]) * t, wr[1] + (hand[1] - wr[1]) * t]; blade(A, Q, s, C, b, a0 + (a1 - a0) * t, 0.48 - t * 0.12, 0.078, A.mix(fcol, C.dark, 0.3 - t * 0.25)); }
    // the arm and its coverts: the leading edge bowed forward, the back edge cut in scallops over the flight feathers
    const mid = [(sh[0] + wr[0]) / 2 + 0.07, (sh[1] + wr[1]) / 2];
    const cov = A.spline([Q(...sh), Q(...mid), Q(wr[0] + 0.02, wr[1] - 0.02), Q(wr[0] - 0.08, wr[1] + 0.1), Q(hand[0] - 0.04, hand[1] + 0.14), Q(root[0] + 0.02, root[1] - 0.02), Q(root[0] + 0.16, root[1] + 0.06)], true, 0.5);
    A.ground(cov, col, { edge: 0, w: 0.1 * s, rub: 0, top: 0 });
    A.fill(cov, 'pastel', A.mix(col, C.light, 0.12), { w: 0.06 * s, p: 0.5, passes: 1 });
    if (!far) {
      const rows = [];
      for (let r = 0; r < 3; r++) {
        const row = [];
        for (let i = 0; i < 4; i++) { const t = 0.18 + 0.2 * i + 0.05 * r, u = sh[0] + (wr[0] - sh[0]) * t + 0.02 - r * 0.075, v = sh[1] + (wr[1] - sh[1]) * t + r * 0.045; row.push([u, v]); }
        rows.push(row);
      }
      scallops(A, Q, s, C, rows, 0.034);
      for (const k of [0, 1]) A.stroke([Q(hand[0] + 0.03 - k * 0.06, hand[1] + 0.06 + k * 0.03), Q(root[0] + 0.1 - k * 0.04, root[1] - 0.02 + k * 0.04)], 'chalk', C.bar, { w: 0.032 * s, p: 0.85 });
    }
    A.outline(cov, 'kajal', C.line, { closed: true, w: 0.015 * s, p: 0.55 });
  }
  // the folded wing, rot: how far it is lifted at the shoulder (0 folded)
  function folded(A, Q0, s, C, rot) {
    const pv = [0.18, -0.56], cr = Math.cos(rot), sr = Math.sin(rot);
    const Q = rot ? (u, v) => { const du = u - pv[0], dv = v - pv[1]; return Q0(pv[0] + du * cr - dv * sr, pv[1] + du * sr + dv * cr); } : Q0;
    if (rot) for (let i = 0; i < 5; i++) blade(A, Q, s, C, [-0.46 + i * 0.04, -0.33 + i * 0.012], PI + 0.08 - i * 0.12, 0.34, 0.07, A.mix(C.wing, C.dark, 0.25 + i * 0.05));
    const wg = A.spline([Q(0.22, -0.56), Q(0.06, -0.61), Q(-0.2, -0.53), Q(-0.56, -0.37), Q(-0.78, -0.29), Q(-0.56, -0.235), Q(-0.2, -0.2), Q(0.1, -0.26), Q(0.24, -0.4)], true, 0.5);
    A.ground(wg, C.wing, { edge: 0, w: 0.1 * s, rub: 0, top: 0 });
    A.fill(wg, 'pastel', A.mix(C.wing, C.light, 0.12), { w: 0.06 * s, p: 0.45, passes: 1 });
    // the primaries laid over the tail, darker toward the tip
    for (let i = 0; i < 4; i++) A.stroke([Q(-0.34 - i * 0.03, -0.355 + i * 0.03), Q(-0.76 + i * 0.035, -0.29 + i * 0.012)], 'chalk', A.mix(C.wing, C.dark, 0.32 + i * 0.08), { w: 0.026 * s, p: 0.85 });
    const rows = [];
    for (let r = 0; r < 3; r++) { const row = []; for (let u = 0.12 - r * 0.04; u > -0.3; u -= 0.08) row.push([u, -0.53 + r * 0.07 + (0.08 - u) * 0.36]); rows.push(row); }
    scallops(A, Q, s, C, rows);
    A.stroke(A.spline([Q(-0.05, -0.51), Q(-0.12, -0.38), Q(-0.18, -0.25)], false, 0.5), 'chalk', C.bar, { w: 0.04 * s, p: 0.9 });
    A.stroke(A.spline([Q(-0.24, -0.45), Q(-0.3, -0.34), Q(-0.35, -0.24)], false, 0.5), 'chalk', C.bar, { w: 0.04 * s, p: 0.9 });
    A.outline(wg, 'kajal', C.line, { closed: true, w: 0.017 * s, p: 0.55 });
  }

  /* landing: the body tilted back about 40 degrees, the head held up and level against the tilt, both wings raised
     high in a V, the tail fanned down and forward as a brake, and the legs reaching forward under the body to the perch.
     x, y is where the feet will touch. */
  const SIL_LAND = [[0.5, -0.95], [0.42, -1.0], [0.32, -0.95], [0.24, -0.79], [0.12, -0.63], [-0.1, -0.56], [-0.36, -0.46], [-0.52, -0.38],
    [-0.56, -0.28], [-0.42, -0.2], [-0.1, -0.06], [0.1, -0.04], [0.3, -0.16], [0.41, -0.36], [0.43, -0.56], [0.47, -0.74], [0.53, -0.87]];
  function landing(A, x, y, s, C, f) {
    const T = -0.42, ct = Math.cos(T), st = Math.sin(T);
    const Qs = (u, v) => [x + u * s * f, y + v * s];
    const B0 = (u, v) => {
      const w = sstep((-0.6 - v) / 0.2), a = 0.22 * w, ca = Math.cos(a), sa = Math.sin(a);
      const hu = u - 0.33, hv = v + 0.64;
      u = 0.33 + hu * ca - hv * sa; v = -0.64 + hu * sa + hv * ca;
      const dv = v + 0.45;
      return [u * ct - dv * st, -0.45 + u * st + dv * ct];
    };
    // place the body so the hip sits back and up from the feet: the legs then reach forward to the perch
    const h0 = B0(0.04, -0.07), TU = -0.13 - h0[0], TV = -0.2 - h0[1];
    const B = (u, v) => { const p = B0(u, v); return [p[0] + TU, p[1] + TV]; };
    const Q = (u, v) => { const p = B(u, v); return Qs(p[0], p[1]); };
    const sh = B(0.14, -0.6);
    // the far wing, up and a little forward
    spread(A, Qs, s, C, [sh[0] + 0.02, sh[1] - 0.02], [sh[0] + 0.0, sh[1] - 0.68], -1.5, -2.25, true);
    // the tail fanned down and forward like a brake: feathers from the rump, each with the dark bar and a pale tip
    const root = B(-0.46, -0.27), NT = 10;
    const ta = i => 2.05 - i * 0.13, tl = i => 0.42 - Math.abs(i - 4.5) * 0.012;
    for (let i = 0; i < NT; i++) blade(A, Qs, s, C, root, ta(i), tl(i), 0.075, A.mix(C.tail, C.dark, 0.08 + (i % 2) * 0.08));
    for (let i = 0; i < NT; i++) {
      const ca = Math.cos(ta(i)), sa = Math.sin(ta(i)), len = tl(i), P = k => Qs(root[0] + ca * len * k, root[1] + sa * len * k);
      A.stroke([P(0.74), P(0.9)], 'chalk', C.bar, { w: 0.05 * s, p: 0.95 });
      A.stroke([P(0.93), P(0.98)], 'chalk', A.mix(C.tail, C.light, 0.5), { w: 0.03 * s, p: 0.7 });
    }
    // the body
    const bd = A.spline(SIL_LAND.map(p => Q(p[0], p[1])), true, 0.5);
    A.ground(bd, C.body, { edge: 0, w: 0.12 * s, rub: 0.02 * s, top: 0 });
    A.fill(bd, 'pastel', A.mix(C.body, C.light, 0.1), { w: 0.06 * s, p: 0.45, passes: 1 });
    const hp = Q(0.42, -0.9);
    M.floorWash(A, bd, C.head, (xx, yy) => 0.8 * (1 - sstep(Math.hypot(xx - hp[0], yy - hp[1]) / (0.17 * s))), 'over');
    const bp = Q(-0.3, -0.18);
    M.floorWash(A, bd, C.dark, (xx, yy) => 0.3 * (1 - sstep(Math.hypot(xx - bp[0], yy - bp[1]) / (0.35 * s))), 'mul');
    A.stroke(A.spline([Q(0.4, -0.5), Q(0.36, -0.3), Q(0.22, -0.12)], false, 0.5), 'chalk', A.mix(C.body, C.light, 0.55), { w: 0.045 * s, p: 0.55 });
    sheen(A, Q, s, C, [0.36, -0.64], bd);
    A.outline(bd, 'kajal', C.line, { closed: true, w: 0.02 * s, p: 0.6 });
    // the legs: feathered at the thigh, then bare and pink, reaching forward with the toes spread for the perch
    for (const dd of [-0.035, 0.035]) {
      const hip = B(0.04 + dd, -0.07), knee = [hip[0] + 0.02, hip[1] + 0.1], ank = [0.02 + dd, -0.035];
      A.stroke([Qs(hip[0], hip[1] - 0.03), Qs(...knee)], 'pastel', A.mix(C.body, C.dark, 0.15), { w: 0.06 * s, p: 0.9 });
      A.stroke([Qs(...knee), Qs(...ank)], 'chalk', C.foot, { w: 0.03 * s, p: 0.95 });
      A.stroke([Qs(...ank), Qs(0.12 + dd, -0.02)], 'chalk', C.foot, { w: 0.02 * s, p: 0.95 });
      A.stroke([Qs(...ank), Qs(0.1 + dd, 0.025)], 'chalk', C.foot, { w: 0.018 * s, p: 0.95 });
      A.stroke([Qs(...ank), Qs(-0.04 + dd, -0.005)], 'chalk', C.foot, { w: 0.016 * s, p: 0.9 });
      for (const tp of [[0.12 + dd, -0.02], [0.1 + dd, 0.025]]) A.dot(...Qs(...tp), 'kajal', '#3a2a26', { w: 0.012 * s, p: 0.8 });
    }
    // the near wing, raised high and back: with the far wing it makes the V
    spread(A, Qs, s, C, sh, [sh[0] - 0.2, sh[1] - 0.62], -1.82, -2.78, false);
    beak(A, Q, s, C, 0.52, -0.92, 1, 0.08);
    eye(A, Q, s, C, [0.43, -0.915], 1, false);
  }

  M.w8Pigeon = function (A, x, y, s, pose, o) {
    o = o || {}; pose = pose || 'sit';
    const C = coat(o.c), f = o.flip ? -1 : 1, d = 1;
    if (pose === 'land') return landing(A, x, y, s, C, f);
    const tilt = pose === 'land' ? -0.45 : pose === 'fly' ? -0.08 : 0, ct = Math.cos(tilt), st = Math.sin(tilt);
    const Q = (u, v) => { const uu = u * ct - v * st, vv = u * st + v * ct; return [x + uu * s * f, y + vv * s]; };
    const flying = pose === 'land' || pose === 'fly';
    // a soft shadow under it
    if (o.shadow !== false && !flying) { const sh = A.ellipse(x - 0.12 * s * f, y + 0.008 * s, 0.5 * s, 0.05 * s); M.floorWash(A, sh, '#3a2a1a', (xx, yy) => 0.35 * (1 - sstep(Math.hypot((xx - (x - 0.12 * s * f)) / (0.5 * s), (yy - y) / (0.05 * s)))), 'mul'); }
    // the far wing, behind everything
    if (flying) spread(A, Q, s, C, [0.06, -0.6], pose === 'land' ? [-0.02, -1.08] : [-0.12, -1.0], -1.62, -2.5, true);
    else if (pose === 'half') spread(A, Q, s, C, [0.08, -0.6], [-0.1, -0.92], -1.95, -2.75, true);
    // the silhouette, laid solid
    const silP = pose === 'preen' ? SIL_PREEN : pose === 'tuck' ? SIL_TUCK : SIL;
    let sil = silP;
    if (flying) sil = SIL.map(p => p[0] < -0.5 ? [p[0], p[1] + (p[0] + 0.5) * -0.9 * (p[1] < -0.26 ? 0.55 : 1)] : p);
    const bd = A.spline(sil.map(p => Q(p[0], p[1])), true, 0.5);
    A.ground(bd, C.body, { edge: 0, w: 0.12 * s, rub: 0.02 * s, top: 0 });
    A.fill(bd, 'pastel', A.mix(C.body, C.light, 0.1), { w: 0.06 * s, p: 0.45, passes: 1 });
    // the head a shade darker, the breast lit, the belly in shade
    const hc = pose === 'preen' ? [0.06, -0.8] : pose === 'tuck' ? [0.38, -0.78] : [0.42, -0.9];
    M.floorWash(A, bd, C.head, (xx, yy) => { const p = Q(hc[0], hc[1]); return 0.8 * (1 - sstep(Math.hypot(xx - p[0], yy - p[1]) / (0.17 * s))); }, 'over');
    M.floorWash(A, bd, C.dark, (xx, yy) => 0.32 * sstep((yy - (y - 0.26 * s)) / (0.24 * s)), 'mul');
    A.stroke(A.spline([Q(0.36, -0.46), Q(0.36, -0.28), Q(0.22, -0.12)], false, 0.5), 'chalk', A.mix(C.body, C.light, 0.55), { w: 0.045 * s, p: 0.55 });
    if (pose === 'tuck') for (let i = 0; i < 6; i++) A.stroke([Q(0.3 + 0.02 * i, -0.56 + i * 0.065), Q(0.38 + 0.02 * i, -0.53 + i * 0.065)], 'pastel', C.light, { w: 0.018 * s, p: 0.6 });
    // the tail over the silhouette, with its dark bar and pale tip
    if (!flying) {
      const tl = [Q(-0.42, -0.42), Q(-0.96, -0.3), Q(-0.98, -0.22), Q(-0.42, -0.2)];
      A.fill(tl, 'chalk', C.tail, { w: 0.05 * s, p: 0.9, passes: 1 });
      A.fill([Q(-0.8, -0.325), Q(-0.92, -0.305), Q(-0.94, -0.215), Q(-0.8, -0.215)], 'chalk', C.bar, { w: 0.035 * s, p: 1, passes: 1 });
      A.stroke([Q(-0.955, -0.3), Q(-0.97, -0.22)], 'chalk', A.mix(C.tail, C.light, 0.4), { w: 0.012 * s, p: 0.7 });
    } else {
      const fan = [Q(-0.42, -0.36), Q(-0.8, -0.24), Q(-0.84, -0.1), Q(-0.72, 0.0), Q(-0.42, -0.16)];
      A.fill(fan, 'chalk', C.tail, { w: 0.05 * s, p: 0.9, passes: 1 });
      A.fill([Q(-0.74, -0.25), Q(-0.8, -0.24), Q(-0.84, -0.1), Q(-0.73, -0.01), Q(-0.68, -0.05), Q(-0.72, -0.12)], 'chalk', C.bar, { w: 0.035 * s, p: 1, passes: 1 });
      for (let i = 0; i < 5; i++) { const t = (i + 0.5) / 5; A.stroke([Q(-0.44, -0.26), Q(-0.86 + 0.12 * t, -0.2 + 0.28 * t)], 'kajal', A.mix(C.tail, C.dark, 0.5), { w: 0.007 * s, p: 0.45 }); }
    }
    // the sheen on the neck
    if (pose === 'preen') sheen(A, Q, s, C, [0.24, -0.66], bd);
    else if (pose === 'tuck') sheen(A, Q, s, C, [0.36, -0.6], bd);
    else sheen(A, Q, s, C, [0.36, -0.64], bd);
    A.outline(bd, 'kajal', C.line, { closed: true, w: 0.02 * s, p: 0.6 });
    // feet
    if (pose === 'land') for (const dd of [0, 0.06]) { A.stroke([Q(0.04 + dd, -0.1), Q(0.14 + dd, 0.06), Q(0.22 + dd, 0.08)], 'chalk', C.foot, { w: 0.028 * s, p: 0.95 }); A.stroke([Q(0.14 + dd, 0.06), Q(0.18 + dd, 0.13)], 'chalk', C.foot, { w: 0.02 * s, p: 0.9 }); }
    else if (!flying) for (const dd of [0, 0.1]) { A.stroke([Q(0.02 + dd, -0.06), Q(0.05 + dd, 0)], 'chalk', C.foot, { w: 0.028 * s, p: 0.95 }); A.stroke([Q(0.05 + dd, 0), Q(0.12 + dd, 0.004)], 'chalk', C.foot, { w: 0.02 * s, p: 0.95 }); A.stroke([Q(0.04 + dd, 0), Q(-0.01 + dd, 0.004)], 'chalk', C.foot, { w: 0.016 * s, p: 0.9 }); }
    // the near wing
    if (flying) spread(A, Q, s, C, [0.14, -0.56], pose === 'land' ? [0.06, -1.12] : [-0.04, -1.04], -1.78, -2.7, false);
    else if (pose === 'half') folded(A, Q, s, C, 0.42);
    else if (pose !== 'preen') folded(A, Q, s, C, 0);
    else { folded(A, Q, s, C, 0); }
    // the head
    if (pose === 'preen') {
      // turned back over the wing: drawn again over it, the beak buried in the feathers of the back
      const hd = A.spline([Q(0.28, -0.58), Q(0.28, -0.74), Q(0.16, -0.86), Q(0.02, -0.88), Q(-0.1, -0.8), Q(-0.1, -0.68), Q(0.06, -0.62), Q(0.2, -0.52)], true, 0.5);
      A.ground(hd, C.head, { edge: 0, w: 0.1 * s, rub: 0, top: 0 });
      sheen(A, Q, s, C, [0.2, -0.64], hd);
      beak(A, Q, s, C, -0.1, -0.74, -1, -0.7);
      eye(A, Q, s, C, [0.0, -0.8], -1, false);
      A.outline(hd, 'kajal', C.line, { closed: true, w: 0.018 * s, p: 0.6 });
    } else if (pose === 'tuck') {
      beak(A, Q, s, C, 0.47, -0.79, 1, 0.15);
      eye(A, Q, s, C, [0.4, -0.8], 1, true);
    } else {
      beak(A, Q, s, C, 0.52, -0.92, 1, 0.08);
      eye(A, Q, s, C, [0.43, -0.915], 1, false);
    }
  };

  M.w8PigeonHead = function (A, x, y, s, o) {
    o = o || {};
    const C = coat(o.c), f = o.flip ? -1 : 1, Q = (u, v) => [x + u * s * f, y + v * s];
    const hd = A.spline([[0.5, -0.95], [0.42, -1.0], [0.32, -0.95], [0.24, -0.79], [0.2, -0.5], [0.46, -0.5], [0.47, -0.74], [0.53, -0.87]].map(p => Q(p[0], p[1])), true, 0.5);
    A.ground(hd, C.body, { edge: 0, w: 0.1 * s, rub: 0, top: 0 });
    M.floorWash(A, hd, C.head, (xx, yy) => { const p = Q(0.42, -0.9); return 0.8 * (1 - sstep(Math.hypot(xx - p[0], yy - p[1]) / (0.17 * s))); }, 'over');
    sheen(A, Q, s, C, [0.36, -0.62], hd);
    A.outline(hd, 'kajal', C.line, { closed: true, w: 0.02 * s, p: 0.6 });
    beak(A, Q, s, C, 0.52, -0.92, 1, 0.08);
    eye(A, Q, s, C, [0.43, -0.915], 1, false);
  };
})();
