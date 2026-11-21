(function () {
  'use strict';
  /* ==========================================================================
     DELTA FORCE (the 2020-21 stop): seven sarus cranes going over in a V, seen through the open bay of the
     malachite level, the way a Mewar painter draws a flight of cranes across a night sky.
     Each crane: one kajal contour round body, neck and head; the bare red head and upper neck, a pale collar
     where the grey feathers stop; the ash crown, the grey ear, the orange eye; the long olive bill; the legs
     trailing, pink-red, the joint swollen. The wings drawn feather by feather: seven black primaries spread as
     fingers, eight grey secondaries, the coverts laid over them in ordered rows of small scale feathers, the
     leading edge picked out with a row of white dots.
     Frame: the sheet itself (stage-well8k.js sheetZ, kw 1.5); every width here is in sheet units and grows
     with the bird's size s, so crane() can be used at any size.  The light comes from the upper left.
     ======================================================================== */
  M.w8x = M.w8x || {};
  const PI = Math.PI;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  const C = {
    body: '#cdd0d9', bodyLit: '#eef0f4', bodySh: '#8b90a4', breast: '#dadce4',
    cov: '#c6cad4', covLit: '#eceef2', scale: '#d4d7df',
    sec: '#a9aebd', secTip: '#767b8e', tert: '#d8dbe3',
    prim: '#1f212a', primLit: '#5c6072', primCov: '#3a3d4b',
    red: '#d4382a', redLit: '#f07656', redSh: '#8c1e1e', collar: '#f1ece2',
    crown: '#b8c0a6', ear: '#a2a6b4',
    beak: '#5d6447', beakLit: '#a5ab82', beakTip: '#2c2e22',
    leg: '#de7c74', legSh: '#a04a52', claw: '#3a2c30',
    iris: '#f39a1c', white: '#fbf7ec',
    // the night through the bay
    night: '#132260', nightLow: '#22397f', band: '#0d1a4c', cloud: '#21387e', cloudLit: '#2c4690', cloudLine: '#c4d2f0',
    moon: '#f7edcc', moonSh: '#d8c896', halo: '#2a4590', hill: '#0e2d2c', hillFar: '#16285a', hillLine: '#3d7a62', star: '#f6eed6', starBlue: '#d4e2f6'
  };
  const DARK = '#262c4c';

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const len = a => Math.hypot(a[0], a[1]);
  const nrm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
  const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  // the side of a direction that faces back along the body (u < 0): the trailing side of a wing
  const back = d => { const p = [d[1], -d[0]]; return p[0] <= 0 ? p : [-p[0], -p[1]]; };
  const rot = (a, t) => [a[0] * Math.cos(t) - a[1] * Math.sin(t), a[0] * Math.sin(t) + a[1] * Math.cos(t)];
  // a fixed hand: the same small offsets every time, so the sky is counted, not scattered
  const hh = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };

  function ribbon(cl, wf) {
    const n = cl.length, L = [], Rr = [];
    for (let i = 0; i < n; i++) {
      const a = cl[Math.max(0, i - 1)], b = cl[Math.min(n - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const w = wf(i / (n - 1));
      L.push([cl[i][0] + nx * w, cl[i][1] + ny * w]); Rr.push([cl[i][0] - nx * w, cl[i][1] - ny * w]);
    }
    const p = L.concat(Rr.slice().reverse()); p.L = L; p.R = Rr; return p;
  }

  function kit(Z) {
    const INK = Z.mix('kajal', 'neel', 0.14), KJ = Z.tool('kajal', { wmin: 0.3 });
    const K = { INK, KJ };
    K.solid = (p, c, o) => Z.fill(p, 'pastel', c, Object.assign({ w: 0.8, p: 1, reach: 1.5, passes: 3, ang: 1.5, streak: 0.12 }, o));
    // the contour in two goes: an even unbroken line all round, then a second pass that swells where the form
    // turns from the light (right and below) and thins to nothing where it turns into it
    K.ink = (poly, w, o) => {
      o = o || {};
      let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; } cx /= poly.length; cy /= poly.length;
      const n = poly.length, sw = poly.map((p, i) => {
        const a = poly[(i - 1 + n) % n], b = poly[(i + 1) % n];
        let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
        return clamp((nx * 0.78 + ny * 0.62 + 0.15) / 0.95, 0, 1);
      });
      const ring = o.open ? poly : poly.concat(poly.slice(0, 3)), swr = o.open ? sw : sw.concat(sw.slice(0, 3));
      const c = o.c || INK;
      Z.stroke(ring.map(p => [p[0], p[1]]), KJ, c, { w: w * 0.6, p: 1, tin: 0, tout: 0, wob: 0.15 });
      Z.stroke(ring.map((p, i) => [p[0], p[1], 0.42 + 0.58 * swr[i]]), KJ, c, { w, p: 1, tin: 0, tout: 0, wob: 0.15 });
    };
    K.hair = (p, w, o) => Z.stroke(p, KJ, Z.mix(INK, C.body, 0.12), Object.assign({ p: 0.75, tin: 0.08, tout: 0.1, wob: 0.15 }, o, { w }));
    K.chalk = (p, c, w, o) => Z.stroke(p, 'chalk', c, Object.assign({ w, p: 0.85 }, o));
    K.dot = (x, y, c, w, o) => Z.dot(x, y, 'chalk', c, Object.assign({ w, p: 0.95 }, o));
    // a ruled row of dots along a path, laid one by one: each a hair off in place and size, never a stamp
    K.dots = (path, step, c, w, o) => {
      o = o || {};
      const q = Z.along(path, step, 0);
      for (let i = 0; i < q.length; i++) {
        if (o.skip && o.skip(q[i], i)) continue;
        K.dot(q[i].x + Z.rr(-0.06, 0.06) * step, q[i].y + Z.rr(-0.05, 0.05) * step, c, w * Z.rr(0.88, 1.08), { p: Z.rr(0.88, 1) });
      }
    };
    // burnish the ground before it is painted: the sheet's crumple is pressed flat and only the fine tooth is left
    K.burnish = polys => {
      const HM = Z.HM, W = Z.W, H = Z.H; if (!HM) return;
      const r = Math.max(2, Math.round(2 * Z.S));
      for (const poly of (Array.isArray(polys[0][0]) ? polys : [polys])) {
        const m = Z.pushMask(poly, 0); Z.popMask();
        if (!m || !m.w || !m.h) continue;
        const x0 = Math.max(0, m.x0 - r), y0 = Math.max(0, m.y0 - r), x1 = Math.min(W, m.x0 + m.w + r), y1 = Math.min(H, m.y0 + m.h + r);
        const bw = x1 - x0, bh = y1 - y0, I = new Float64Array((bw + 1) * (bh + 1));
        for (let y = 0; y < bh; y++) { let row = 0; const src = (y0 + y) * W + x0, o1 = (y + 1) * (bw + 1), o0 = y * (bw + 1); for (let x = 0; x < bw; x++) { row += HM[src + x]; I[o1 + x + 1] = I[o0 + x + 1] + row; } }
        for (let y = 0; y < m.h; y++) {
          const Y = m.y0 + y; if (Y < 0 || Y >= H) continue;
          for (let x = 0; x < m.w; x++) {
            const d = m.d[y * m.w + x]; if (!d) continue;
            const X = m.x0 + x; if (X < 0 || X >= W) continue;
            const ax = Math.max(0, X - r - x0), ay = Math.max(0, Y - r - y0), bx = Math.min(bw, X + r + 1 - x0), by = Math.min(bh, Y + r + 1 - y0);
            const mean = (I[by * (bw + 1) + bx] - I[ay * (bw + 1) + bx] - I[by * (bw + 1) + ax] + I[ay * (bw + 1) + ax]) / ((bx - ax) * (by - ay));
            const i = Y * W + X, v = 0.5 + clamp((HM[i] - mean) * 0.8, -0.2, 0.2);
            HM[i] += (v - HM[i]) * d / 255;
          }
        }
      }
    };
    return K;
  }

  /* ------------------------------------------------------------------ the wings, by phase, in the body frame
     (u forward along the body, v down; 1 = the bird's size s): shoulder, wrist, tip. The near wing is drawn over
     the body, the far wing behind it, darker. In the down stroke the far wing still shows above the back, the old
     painters' way of showing a bird in flight with one wing up and one down. */
  const WINGS = {
    up: { near: [[0.05, -0.055], [-0.04, -0.29], [-0.2, -0.62]], far: [[0.1, -0.06], [0.07, -0.27], [-0.03, -0.57]] },
    mid: { near: [[0.05, -0.055], [-0.12, -0.19], [-0.46, -0.32]], far: [[0.1, -0.06], [-0.01, -0.24], [-0.24, -0.46]] },
    down: { near: [[0.04, -0.02], [-0.02, 0.2], [-0.17, 0.5]], far: [[0.1, -0.06], [0.05, -0.22], [-0.06, -0.47]] }
  };

  /* ------------------------------------------------------------------ one sarus crane
     x, y: the shoulder (middle of the body); s: its size (bill tip to toes is about 1.2 s);
     opts.wing 'up' | 'mid' | 'down'; opts.flip: faces left; opts.tilt: the body pitched (+ nose down, radians);
     opts.lift: the wings raised (+) or lowered (-) a little within their phase; opts.neck: the neck let down (+);
     opts.legs: the legs let down (+). Returns { x, y, s }. */
  function crane(A, x, y, s, opts) {
    opts = opts || {};
    const Z = A, K = A.__dfK || (A.__dfK = kit(A));
    const f = opts.flip ? -1 : 1, a = opts.tilt || 0, ca = Math.cos(a), sa = Math.sin(a);
    const P = (u, v) => [x + (u * ca - v * sa) * s * f, y + (u * sa + v * ca) * s];
    const PP = q => P(q[0], q[1]);
    const SP = (pts, closed, k) => Z.spline(pts.map(PP), closed, st * (k || 1));
    const st = Math.max(0.1, s * 0.005);
    const lwB = s * 0.0165, lwF = s * 0.006, lwL = s * 0.0045;
    const nd = opts.neck || 0, ld = opts.legs || 0;
    const coat = { body: Z.vary(C.body, 0.015), cov: Z.vary(C.cov, 0.015), sec: Z.vary(C.sec, 0.015), red: Z.vary(C.red, 0.015) };
    const ang = v => Math.atan2(v[1], v[0]);
    // the head drawn a little larger than life, about the eye, so it reads from across the well
    const HS = 1.14, hS = q => [0.43 + (q[0] - 0.43) * HS, -0.045 + (q[1] + 0.045) * HS], HP = (u, v) => PP(hS([u, v]));
    // a feather in the body frame: a blade from its quill base along ang, its end rounded (or narrowed, a finger)
    const blade = (b, ag, ln, wid, finger) => {
      const dx = Math.cos(ag), dy = Math.sin(ag), px = -dy, py = dx;
      const Q = (t, k) => [b[0] + dx * ln * t + px * wid * k, b[1] + dy * ln * t + py * wid * k];
      const sh = finger
        ? [[0, -0.4], [0.42, -0.44], [0.74, -0.36], [0.93, -0.18], [1, 0.03], [0.94, 0.26], [0.76, 0.48], [0.42, 0.56], [0, 0.52]]
        : [[0, -0.5], [0.42, -0.55], [0.78, -0.48], [0.95, -0.27], [1, 0], [0.95, 0.27], [0.78, 0.48], [0.42, 0.55], [0, 0.5]];
      return { poly: Z.spline(sh.map(q => PP(Q(q[0], q[1]))), true, st * 0.6), arc: Z.spline(sh.slice(1, 8).map(q => PP(Q(q[0], q[1]))), false, st * 0.6), Q, P: (t, k) => PP(Q(t, k)) };
    };
    // a feather laid in: its flat colour, then what is drawn inside it, then its own line
    // the side of a feather that faces the light (upper left), as k = -1 or +1 across it
    const litK = F => { const p = F.P(0.6, -0.5), q = F.P(0.6, 0.5); return (p[0] + p[1]) < (q[0] + q[1]) ? -1 : 1; };
    const edgeLit = (F, c, w, p) => { const k = litK(F); K.chalk([F.P(0.28, k * 0.38), F.P(0.7, k * 0.4), F.P(0.92, k * 0.2)], c, w, { p: p || 0.75, tin: 0.25, tout: 0.3 }); };
    const feather = (F, c, ag, inside, w, arc) => { K.solid(F.poly, c, { w: s * 0.012, ang: ag + PI / 2 }); if (inside) Z.withMask(F.poly, inside); if (arc) K.ink(F.arc, w || lwF, { open: true }); else K.ink(F.poly, w || lwF); };

    /* ------------------------------------------- a wing: primaries, secondaries, their coverts, the leading edge */
    const BK = [-1, 0.05];
    const wing = (S, W, T0, dark) => {
      // the hand drawn long, as a sarus has it: the span reads past the length of the bird
      const T = add(W, mul(sub(T0, W), 1.16));
      const d1 = sub(W, S), d2 = sub(T, W), a1 = nrm(d1), a2 = nrm(d2), p1 = back(a1), p2 = back(a2);
      // the flight feathers lie back along the body more than square to the arm
      const f1 = nrm(add(p1, mul(BK, 0.85))), f2 = nrm(add(p2, mul(BK, 0.5)));
      const tone = c => dark ? Z.mix(c, DARK, 0.36) : c;
      const hEnd = add(W, mul(d2, 0.28)), pw = nrm(add(p1, p2));
      // the hand: seven primaries fanned from the wrist, the outermost first, each a black finger with a pale quill
      const NP = 6, dIn = nrm(add(f2, mul(a2, 0.3))), dOut = nrm(add(a2, mul(p2, 0.05)));
      for (let i = NP - 1; i >= 0; i--) {
        const t = i / (NP - 1), base = add(W, mul(d2, lerp(0.0, 0.26, t))), dir = nrm(lerp2(dIn, dOut, Math.pow(t, 0.85)));
        const ln = lerp(0.235, len(sub(T, add(W, mul(d2, 0.26)))) * 1.02, Math.pow(t, 1.2)) * (i === NP - 1 ? 0.92 : 1) * Z.rr(0.985, 1.015);
        const ag = ang(dir) + Z.rr(-0.015, 0.015), F = blade(base, ag, ln, 0.054, true);
        feather(F, tone(C.prim), ag, () => {
          Z.stroke([F.P(0.12, 0.24), F.P(0.88, 0.14)], 'chalk', tone(C.primLit), { w: s * 0.011, p: 0.7, tin: 0.15, tout: 0.35 });
          K.chalk([F.P(0.05, -0.04), F.P(0.86, -0.02)], tone('#a4aabe'), s * 0.0038, { p: 0.85, tin: 0.05, tout: 0.3 });
        });
      }
      // the arm: eight secondaries, the outer first; the two inner (the tertials) paler and longer; each with its
      // grey end and a pale fringe on its trailing vane
      const NS = 7;
      for (let i = NS - 1; i >= 0; i--) {
        const t = i / (NS - 1), tert = i < 2;
        const base = add(add(S, mul(d1, lerp(0.1, 1.0, t))), mul(p1, 0.014));
        const dir = nrm(add(f1, mul(a1, lerp(-0.22, 0.34, t))));
        const ln = (tert ? lerp(0.205, 0.215, i) : lerp(0.235, 0.225, t)) * Z.rr(0.985, 1.015);
        const ag = ang(dir) + Z.rr(-0.015, 0.015), F = blade(base, ag, ln, 0.072, tert);
        feather(F, tone(tert ? Z.mix(C.tert, coat.sec, 0.35 + i * 0.25) : coat.sec), ag, () => {
          if (!tert) Z.fill([F.Q(0.74, -0.7), F.Q(1.1, -0.7), F.Q(1.1, 0.7), F.Q(0.74, 0.7)].map(PP), 'chalk', tone(C.secTip), { w: s * 0.008, p: 1, passes: 2, ang: ag + PI / 2 });
          edgeLit(F, tone(tert ? C.white : C.covLit), s * 0.007, 0.65);
          K.chalk([F.P(0.06, -0.04), F.P(0.7, -0.02)], tone(Z.mix(coat.sec, C.secTip, 0.6)), lwF * 0.7, { p: 0.8, tin: 0.1, tout: 0.3 });
        });
      }
      // the primary coverts over the base of the hand, dark slate, one to each finger
      for (let i = NP - 2; i >= 0; i--) {
        const t = i / (NP - 2), base = add(add(W, mul(d2, lerp(-0.02, 0.24, t))), mul(p2, -0.01)), dir = nrm(lerp2(dIn, dOut, Math.pow(t, 0.85)));
        const ag = ang(dir), F = blade(base, ag, lerp(0.105, 0.13, t) * Z.rr(0.98, 1.02), 0.05);
        feather(F, tone(C.primCov), ag, () => edgeLit(F, tone('#7c8094'), s * 0.006), lwF, true);
      }
      // the greater coverts: one rounded feather over the root of each secondary, the outer first
      for (let i = NS - 1; i >= 0; i--) {
        const t = i / (NS - 1), base = add(S, mul(d1, lerp(0.08, 1.02, t))), dir = nrm(add(f1, mul(a1, lerp(-0.2, 0.36, t))));
        const ag = ang(dir) + Z.rr(-0.015, 0.015), F = blade(base, ag, 0.12 * Z.rr(0.98, 1.02), 0.074);
        feather(F, tone(coat.cov), ag, () => edgeLit(F, tone(C.covLit), s * 0.0075, 0.8), lwF, true);
      }
      // the median and lesser coverts: two rows of small scale feathers, counted, each row offset by half a feather
      const rows = [{ off: 0.046, n: 6, ln: 0.07, wd: 0.056, h0: 0.0 }, { off: 0.014, n: 7, ln: 0.052, wd: 0.046, h0: 0.5 }];
      for (const R of rows) {
        for (let i = R.n - 1; i >= 0; i--) {
          const t = (i + 0.3 + R.h0 * 0.5) / R.n, onArm = t < 0.82, tt = onArm ? t / 0.82 : (t - 0.82) / 0.18;
          const c = onArm ? add(lerp2(S, W, tt), mul(p1, R.off)) : add(lerp2(W, hEnd, tt * 0.7), mul(pw, R.off * 0.8));
          const dir = onArm ? nrm(add(f1, mul(a1, lerp(-0.1, 0.36, tt)))) : nrm(lerp2(add(f1, mul(a1, 0.36)), dIn, tt));
          const ag = ang(dir) + Z.rr(-0.02, 0.02), F = blade(c, ag, R.ln * Z.rr(0.97, 1.03), R.wd);
          feather(F, tone(coat.cov), ag, () => edgeLit(F, tone(C.covLit), s * 0.0065, 0.75), lwF * 0.8, true);
        }
      }
      // the leading edge: a narrow pale band of the smallest coverts from the shoulder round the wrist
      const lead = [add(S, mul(p1, -0.014)), add(lerp2(S, W, 0.5), mul(p1, -0.016)), add(W, mul(pw, -0.016)), add(lerp2(W, hEnd, 0.55), mul(p2, -0.01)), add(hEnd, mul(p2, 0.004))];
      const inner = [add(hEnd, mul(p2, 0.013)), add(lerp2(W, hEnd, 0.5), mul(p2, 0.011)), add(W, mul(pw, 0.009)), add(lerp2(S, W, 0.5), mul(p1, 0.008)), add(S, mul(p1, 0.009))];
      const band = Z.spline(lead.concat(inner).map(PP), true, st);
      K.solid(band, tone(Z.mix(C.sec, C.secTip, 0.45)), { w: s * 0.008, ang: ang(d1) });
      K.ink(band, lwF * 1.2);
      // the row of white dots along it, the painter's pearls
      if (!dark) {
        const pearl = [add(S, mul(p1, -0.003)), add(lerp2(S, W, 0.5), mul(p1, -0.005)), add(W, mul(pw, -0.004)), add(lerp2(W, hEnd, 0.55), mul(p2, 0.001))];
        K.dots(Z.spline(pearl.map(PP), false, st), s * 0.0135, C.white, s * 0.0078, { skip: (q, i) => i === 0 });
      }
    };

    const ph = WINGS[opts.wing] || WINGS.mid, lift = opts.lift || 0;
    // lift turns the whole wing about the shoulder: + raises it (the wings point back, so a turn toward +u lifts them)
    const tw = (pts, k) => { const S = pts[0]; return pts.map((q, i) => i ? add(S, rot(sub(q, S), lift * k)) : q); };
    const near = tw(ph.near, 0.12), far = tw(ph.far, 0.1);

    /* ------------------------------------------- the far side: wing and leg */
    wing(far[0], far[1], far[2], true);
    const leg = (du, dv, dark) => {
      const hip = [-0.11 + du, 0.045 + dv], knee = [-0.3 + du, 0.055 + dv + ld * 0.4], foot = [-0.49 + du, 0.062 + dv + ld], toe = [-0.565 + du, 0.064 + dv + ld * 1.1];
      const col = dark ? Z.mix(C.leg, '#6a2a3a', 0.42) : C.leg;
      const cl = SP([hip, lerp2(hip, knee, 0.5), knee, lerp2(knee, foot, 0.5), foot, lerp2(foot, toe, 0.5), toe], false, 0.6);
      const seg = q => len(sub(PP(q[1]), PP(q[0]))), L1 = seg([hip, knee]), L2 = seg([knee, foot]), L3 = seg([foot, toe]), LL = L1 + L2 + L3, kk = L1 / LL, fk = (L1 + L2) / LL;
      // the thigh full where it leaves the belly, the shank thin, the joint swollen; past the ankle the toes, bunched, to a point
      const hw = t => 1.35 * s * (t < kk ? lerp(0.012, 0.0076, Math.min(1, t / kk * 1.5)) : t < fk ? 0.0068 : lerp(0.0082, 0.0016, Math.pow((t - fk) / (1 - fk), 1.3)))
        + s * 0.0032 * Math.exp(-Math.pow((t - kk) / 0.026, 2)) + s * 0.0016 * Math.exp(-Math.pow((t - fk) / 0.02, 2));
      const rb = ribbon(cl, hw);
      K.solid(rb, col, { w: s * 0.006, passes: 3, reach: 1.8, gap: 0.3, ang: ang(sub(PP(toe), PP(hip))), streak: 0 });
      Z.withMask(rb, () => K.chalk(rb.L.slice(3, Math.round(rb.L.length * fk)), Z.mix(col, '#ffe8e0', 0.5), s * 0.0034, { p: 0.6 }));
      // four scales ticked across the shank below the joint, and the toes parted by two fine lines
      const dl = nrm(sub(PP(foot), PP(knee))), pn = [-dl[1], dl[0]];
      for (let i = 1; i <= 4; i++) {
        const q = lerp2(PP(knee), PP(foot), i * 0.085 + 0.05);
        K.hair([[q[0] + pn[0] * s * 0.0055, q[1] + pn[1] * s * 0.0055], [q[0] - pn[0] * s * 0.0055 + dl[0] * s * 0.003, q[1] - pn[1] * s * 0.0055 + dl[1] * s * 0.003]], lwL * 0.6, { p: 0.6 });
      }
      for (const k of [-0.3, 0.3]) K.hair([PP(add(lerp2(foot, toe, 0.15), [0, k * 0.008])), PP(add(lerp2(foot, toe, 0.85), [0, k * 0.003]))], lwL * 0.55, { p: 0.6 });
      K.ink(rb, lwL * 1.25);
      const tp = PP(add(toe, mul(nrm(sub(toe, foot)), 0.004))); K.dot(tp[0], tp[1], C.claw, s * 0.006);
    };
    leg(-0.022, -0.009, true);

    /* ------------------------------------------- the tail: five feathers, short, the middle laid last */
    const TB = [-0.19, -0.016], tailC = Math.atan2(0.02, -1);
    for (const i of [0, 4, 1, 3, 2]) {
      const t = i / 4, ag = tailC + lerp(-0.3, 0.32, t) + Z.rr(-0.015, 0.015), ln = (0.13 - Math.abs(t - 0.5) * 0.04) * Z.rr(0.98, 1.02);
      const F = blade(TB, ag, ln, 0.04, true);
      feather(F, Z.mix(coat.sec, C.body, 0.4), ag, () => {
        Z.fill([F.Q(0.72, -0.7), F.Q(1.1, -0.7), F.Q(1.1, 0.7), F.Q(0.72, 0.7)].map(PP), 'chalk', C.secTip, { w: s * 0.008, p: 1, passes: 2, ang: ag + PI / 2 });
        K.chalk([F.P(0.1, 0), F.P(0.66, 0)], Z.mix(coat.sec, C.secTip, 0.6), lwF * 0.7, { p: 0.8, tin: 0.1, tout: 0.3 });
      });
    }
    leg(0, 0, false);

    /* ------------------------------------------- body, neck and head in one contour */
    const sil = SP([
      hS([0.47, -0.05]), hS([0.458, -0.062]), hS([0.434, -0.07]), hS([0.405, -0.066]), hS([0.386, -0.054]),
      [0.345, -0.046 + nd * 0.3], [0.295, -0.043 + nd * 0.6], [0.245, -0.044 + nd * 0.6], [0.2, -0.05 + nd * 0.3], [0.155, -0.06],
      [0.09, -0.072], [0.0, -0.076], [-0.1, -0.069], [-0.18, -0.052], [-0.226, -0.03],
      [-0.236, -0.004], [-0.2, 0.03], [-0.13, 0.058], [-0.02, 0.077], [0.08, 0.07], [0.15, 0.043], [0.19, 0.01],
      [0.23, -0.006 + nd * 0.3], [0.28, -0.01 + nd * 0.6], [0.33, -0.012 + nd * 0.6], [0.37, -0.015 + nd * 0.3], hS([0.405, -0.02]), hS([0.44, -0.026]), hS([0.47, -0.031])
    ], true);
    K.solid(sil, coat.body, { w: s * 0.018, ang: a * f });
    Z.withMask(sil, () => {
      // the belly in shadow, the back lit
      const belly = SP([[0.19, 0.0], [0.14, 0.03], [0.04, 0.046], [-0.08, 0.044], [-0.2, 0.026], [-0.25, 0.04], [-0.1, 0.1], [0.1, 0.1], [0.22, 0.04]], true);
      K.solid(belly, Z.mix(coat.body, C.bodySh, 0.32), { w: s * 0.012, ang: a * f });
      K.chalk(SP([[0.14, -0.062], [0.02, -0.07], [-0.12, -0.06], [-0.2, -0.04]], false), C.bodyLit, s * 0.016, { p: 0.7, tin: 0.2, tout: 0.3 });
      // the neck: a light line along its top, its underside a shade deeper
      K.chalk(SP([[0.17, -0.053], [0.245, -0.04 + nd * 0.6], [0.31, -0.037 + nd * 0.5]], false), C.bodyLit, s * 0.009, { p: 0.65, tout: 0.4 });
      Z.stroke(SP([[0.2, 0.0], [0.26, -0.008 + nd * 0.6], [0.31, -0.012 + nd * 0.6]], false), 'shade', C.bodySh, { w: s * 0.014, p: 0.4, tin: 0.3, tout: 0.3 });
      // the flank: three long lines of the body feathers, following the form back to the vent
      for (let i = 0; i < 3; i++) {
        const v = 0.022 + i * 0.016, u0 = 0.14 - i * 0.03;
        K.chalk(SP([[u0, v - 0.01], [u0 - 0.1, v + 0.008], [u0 - 0.2, v + 0.004 - i * 0.004]], false), Z.mix(coat.body, C.bodySh, 0.6), lwF * 0.8, { p: 0.8, tin: 0.3, tout: 0.4 });
      }
      // the pale collar where the grey feathers stop, then the bare red of the upper neck and head
      Z.stroke(SP([[0.316, -0.075], [0.311, -0.046], [0.316, -0.022], [0.324, 0.0]], false), 'chalk', C.collar, { w: s * 0.017, p: 0.95 });
      const rzp = SP([[0.328, -0.08], [0.322, -0.046], [0.327, -0.024], [0.336, 0.0], [0.52, 0.0], [0.52, -0.08]], true);
      K.solid(rzp, coat.red, { w: s * 0.01, ang: a * f });
      Z.withMask(rzp, () => {
        K.chalk(SP([[0.335, -0.045 + nd * 0.3], [0.38, -0.053], [0.415, -0.062]], false), C.redLit, s * 0.008, { p: 0.7, tin: 0.2 });
        Z.stroke(SP([[0.335, -0.014 + nd * 0.3], [0.39, -0.02], [0.44, -0.028]], false), 'shade', C.redSh, { w: s * 0.009, p: 0.55 });
        // the rough skin: two rows of fine dark dots along the neck, counted
        for (let r = 0; r < 2; r++) {
          const v0 = -0.036 + r * 0.01 + nd * 0.3;
          K.dots(SP([[0.338, v0], [0.37, v0 - 0.002], [0.395, v0 - 0.004]], false, 0.5), s * 0.0085, C.redSh, s * 0.0038, { skip: (q, i) => i === 0 });
        }
      });
      // the crown: pale ash, a bare cap over the eye
      const cap = SP([[0.394, -0.064], [0.418, -0.075], [0.446, -0.073], [0.468, -0.056], [0.452, -0.054], [0.428, -0.057], [0.402, -0.057]].map(hS), true, 0.5);
      K.solid(cap, C.crown, { w: s * 0.008 });
      Z.withMask(cap, () => K.chalk([HP(0.41, -0.067), HP(0.442, -0.069)], '#e2e8d0', s * 0.006, { p: 0.7 }));
      K.hair(SP([[0.398, -0.058], [0.43, -0.058], [0.462, -0.055]].map(hS), false, 0.5), lwF * 0.7, { p: 0.65 });
      // the grey ear behind the eye, in small strokes
      const ec = HP(0.412, -0.036), ear = Z.ellipse(ec[0], ec[1], s * 0.0125, s * 0.0078, a * f);
      K.solid(ear, C.ear, { w: s * 0.006 });
      K.hair(Z.ellipse(ec[0], ec[1], s * 0.0125, s * 0.0078, a * f, 0.15, 2.9), lwF * 0.5, { p: 0.5 });
      // the collar dotted in white
      K.dots(SP([[0.312, -0.05 + nd * 0.3], [0.314, -0.032], [0.32, -0.014 + nd * 0.3]], false, 0.5), s * 0.0095, C.white, s * 0.005);
    });
    K.ink(sil, lwB);

    /* ------------------------------------------- the bill */
    const bill = SP([hS([0.466, -0.052]), [0.52, -0.0475], [0.585, -0.0415], [0.645, -0.033], [0.585, -0.0345], [0.52, -0.032], hS([0.466, -0.028])], true, 0.5);
    K.solid(bill, C.beak, { w: s * 0.008, ang: a * f });
    Z.withMask(bill, () => {
      K.chalk(SP([[0.47, -0.048], [0.53, -0.044], [0.6, -0.038]], false), C.beakLit, s * 0.0065, { p: 0.75, tout: 0.4 });
      Z.stroke(SP([[0.6, -0.036], [0.65, -0.033]], false), 'chalk', C.beakTip, { w: s * 0.012, p: 0.8 });
    });
    K.hair(SP([[0.468, -0.037], [0.53, -0.0365], [0.59, -0.0355]], false, 0.5), lwF * 0.75, { p: 0.75 });
    K.hair([P(0.484, -0.0455), P(0.504, -0.0442)], lwF * 0.65, { p: 0.7 });
    K.ink(bill, lwB * 0.6);

    /* ------------------------------------------- the eye: an almond, the orange iris, the pupil, a catch of light */
    {
      const E = HP(0.443, -0.046), E2 = HP(0.47, -0.046), ea = Math.atan2(E2[1] - E[1], E2[0] - E[0]), r = s * 0.0125;
      const alm = (rx, ry) => { const pts = []; for (let i = 0; i < 24; i++) { const t = i / 24 * 2 * PI, u = Math.cos(t) * rx, v = Math.sin(t) * ry * (0.55 + 0.45 * Math.abs(Math.cos(t * 0.5))); pts.push([E[0] + u * Math.cos(ea) - v * Math.sin(ea), E[1] + u * Math.sin(ea) + v * Math.cos(ea)]); } return pts; };
      const ring = alm(r, r * 0.74);
      Z.fill(ring, 'chalk', C.redSh, { w: s * 0.004, p: 1, passes: 2, reach: 1.5 });
      Z.fill(alm(r * 0.72, r * 0.58), 'chalk', C.iris, { w: s * 0.003, p: 1, passes: 2, reach: 1.5 });
      K.dot(E[0] + Math.cos(ea) * r * 0.1, E[1] + Math.sin(ea) * r * 0.1, 'kajal', r * 0.6);
      K.dot(E[0] - r * 0.2, E[1] - r * 0.22, C.white, r * 0.28);
      Z.outline(ring, K.KJ, K.INK, { closed: true, w: lwF * 0.85, p: 0.9, pull: 30, again: 0 });
    }

    /* ------------------------------------------- the near wing over all */
    wing(near[0], near[1], near[2], false);
    return { x, y, s };
  }

  /* ------------------------------------------------------------------ the flight: a V with the leader at the left,
     the arms trailing back to the right. The beat runs back down each arm (down, mid, up, mid), and each bird
     is given its own small differences by hand: where it sits in the line, its pitch, its neck and legs. */
  const FLOCK = [
    { n: 3, sd: -1, wing: 'mid', tilt: -0.02, lift: 0.35, k: 1.0, ox: 1.2, oy: -0.6, neck: 0.004, legs: 0.006 },
    { n: 3, sd: 1, wing: 'mid', tilt: 0.03, lift: -0.25, k: 0.98, ox: -0.8, oy: 0.8, neck: 0.0, legs: 0.012 },
    { n: 2, sd: -1, wing: 'up', tilt: -0.035, lift: 0.0, k: 1.01, ox: -0.6, oy: 0.4, neck: -0.002, legs: 0.004 },
    { n: 2, sd: 1, wing: 'up', tilt: 0.01, lift: -0.3, k: 0.99, ox: 1.0, oy: -0.5, neck: 0.003, legs: 0.01 },
    { n: 1, sd: -1, wing: 'mid', tilt: 0.0, lift: 0.6, k: 1.0, ox: 0.4, oy: 0.3, neck: 0.0, legs: 0.0 },
    { n: 1, sd: 1, wing: 'mid', tilt: 0.025, lift: 0.1, k: 1.01, ox: -0.5, oy: -0.2, neck: 0.004, legs: 0.008 },
    { n: 0, sd: 0, wing: 'down', tilt: 0.015, lift: 0.0, k: 1.0, ox: 0, oy: 0, neck: 0.002, legs: 0.006 }
  ];
  const layout = b => { const s0 = 40, DX = 42, DY = 16, xL = b[0] + 26.5, yc = b[1] + 64.5; return FLOCK.map(B => Object.assign({ x: xL + B.n * DX + B.ox, y: yc + B.sd * B.n * DY + B.oy, s: s0 * (1 - 0.045 * B.n) * B.k }, B)); };

  M.w8x['delta-force'] = {
    draw(Z, o) {
      for (const B of layout(o.box)) crane(Z, B.x, B.y, B.s, { wing: B.wing, flip: true, tilt: B.tilt, lift: B.lift, neck: B.neck, legs: B.legs });
    },
    ground(Z, o) {
      const b = o.box, cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2;
      const op = ((o.G && o.G.darkOps) || []).find(p => Z.inside(p, cx, cy));
      if (!op) return;
      sky(Z, kit(Z), op, layout(b), o);
    },
    crane
  };

  /* ------------------------------------------------------------------ the night seen through the bay:
     deep lapis, a little lighter toward the hills; the sky laid in slow bands; a crescent moon held inside the V
     with its rings of light; two curled clouds; counted stars; low hills with a row of small trees */
  function sky(Z, K, op, flock, o) {
    let x0 = 1e9, x1 = -1e9, ya = 1e9, yb = -1e9;
    for (const p of op) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); ya = Math.min(ya, p[1]); yb = Math.max(yb, p[1]); }
    const w = x1 - x0, h = yb - ya;
    K.burnish(op);
    Z.ground(op, C.night, { edge: 0, w: 6, rub: 0, top: 0 });
    M.floorWash(Z, op, C.nightLow, (x, y) => 0.7 * clamp((y - ya - h * 0.35) / (h * 0.65), 0, 1), 'over');
    // where the birds are, so the sky's small things keep clear of them
    const near = (x, y, r) => flock.some(B => { const dx = (x - (B.x - B.s * 0.15)) / (B.s * 0.72 + r), dy = (y - (B.y - B.s * 0.12)) / (B.s * 0.42 + r); return dx * dx + dy * dy < 1; });
    const leader = flock[flock.length - 1], arm1 = flock.filter(B => B.n === 1), arm2 = flock.filter(B => B.n === 2);
    // the moon inside the V, behind the leader, between the arms
    const mx = lerp(arm1[0].x, arm2[0].x, 0.85) + 10, my = (arm1[0].y + arm1[1].y) / 2 - 1.5, mr = 4.6;
    const hills = yb - h * 0.13;
    Z.withMask(op, () => {
      // the sky laid in slow bands, as the night-garden painting has it
      for (let i = 0; i < 7; i++) {
        const yy = ya + h * (0.1 + i * 0.105), amp = 0.7 + hh(i, 1) * 0.6, ph = hh(i, 2) * 6.28, wl = 52 + hh(i, 3) * 20, pts = [];
        for (let xx = x0 - 4; xx <= x1 + 4; xx += 2) pts.push([xx, yy + Math.sin(xx / wl * 2 * PI + ph) * amp]);
        Z.stroke(pts, 'shade', C.band, { w: 2.2 + hh(i, 4) * 0.8, p: 0.32, tin: 0.05, tout: 0.05 });
        Z.stroke(pts.map(q => [q[0], q[1] + 2.4]), 'chalk', Z.mix(C.night, C.nightLow, 0.7), { w: 0.5, p: 0.22, tin: 0.05, tout: 0.05 });
      }
      // rings of light round the moon, each a little fainter
      for (let r = 4; r >= 1; r--) Z.fill(Z.ellipse(mx, my, mr + r * 3.4, mr + r * 3.4), 'chalk', Z.mix(C.night, C.halo, 0.3 + (4 - r) * 0.12), { w: 1.2, p: 0.55, passes: 1, reach: 1.4 });
      // the crescent, its back to the setting sun
      const cres = [];
      for (let i = 0; i <= 40; i++) { const t = -PI / 2 + i / 40 * PI; cres.push([mx - Math.cos(t) * mr, my + Math.sin(t) * mr]); }
      for (let i = 40; i >= 0; i--) { const t = -PI / 2 + i / 40 * PI; cres.push([mx - Math.cos(t) * mr * 0.38 - mr * 0.06, my + Math.sin(t) * mr * 0.93]); }
      Z.fill(cres, 'chalk', C.moon, { w: 0.5, p: 1, passes: 2, reach: 1.5 });
      Z.withMask(cres, () => Z.stroke(cres.slice(4, 37).map(q => [q[0] + 0.5, q[1]]), 'chalk', C.moonSh, { w: 0.6, p: 0.5 }));
      Z.outline(cres, K.KJ, Z.mix(K.INK, C.night, 0.35), { closed: true, w: 0.22, p: 0.8, pull: 20, again: 0 });
      // two curled clouds, each a run of lobes with a curl in each
      const cloud = (cx, cy, cw, nl, sg) => {
        const lobes = [];
        for (let i = 0; i < nl; i++) { const t = i / (nl - 1), r = cw / nl * (0.5 + 0.22 * Math.sin(t * PI) + hh(i, cx) * 0.06); lobes.push([cx + (t - 0.5) * cw * 0.84 * sg, cy - Math.sin(t * PI) * cw * 0.07 + (i % 2) * cw * 0.035, r]); }
        const base = cy + cw * 0.075, line = Z.mix(C.cloudLine, C.cloud, 0.18);
        // the flat foot first, then each lobe over the one before it: its colour, its arc of line, its curl
        const foot = [[cx - cw * 0.5, base], [cx + cw * 0.5, base], [cx + cw * 0.5, cy], [cx - cw * 0.5, cy]];
        Z.fill(foot, 'chalk', C.cloud, { w: 0.7, p: 1, passes: 2, reach: 1.5 });
        lobes.forEach(([lx, ly, r], i) => {
          const disc = Z.ellipse(lx, ly, r, r).filter(q => q[1] <= base + 0.01).concat([[lx + r, base], [lx - r, base]]);
          const lobe = Z.ellipse(lx, ly, r, r);
          Z.fill(lobe, 'chalk', C.cloud, { w: 0.6, p: 1, passes: 2, reach: 1.5 });
          Z.withMask(lobe, () => Z.stroke(Z.ellipse(lx - r * 0.15 * sg, ly - r * 0.2, r * 0.7, r * 0.7, 0, PI * 1.1, PI * 1.7), 'chalk', C.cloudLit, { w: 0.9, p: 0.6 }));
          const a0 = PI * 0.62, a1 = PI * 2.12, arc = [];
          for (let k = 0; k <= 30; k++) { const aa = a0 + (a1 - a0) * k / 30, y = ly + Math.sin(aa) * r; if (y <= base) arc.push([lx + Math.cos(aa) * r * sg, y]); }
          Z.stroke(arc, 'chalk', line, { w: 0.34, p: 0.9, tin: 0.04, tout: 0.04 });
          const sp = [];
          for (let k = 0; k <= 24; k++) { const t = k / 24, aa = PI * 0.15 + t * PI * 1.55, rr = r * (0.66 - t * 0.38); sp.push([lx + Math.cos(aa) * rr * sg, ly + Math.sin(aa) * rr - r * 0.04]); }
          Z.stroke(sp, 'chalk', line, { w: 0.3, p: 0.85, tin: 0.02, tout: 0.3 });
        });
        Z.stroke([[cx - cw * 0.5 + 0.4, base], [cx + cw * 0.5 - 0.4, base]], 'chalk', line, { w: 0.32, p: 0.75 });
      };
      cloud(x0 + w * 0.13, ya + h * 0.36, 24, 5, 1);
      cloud(x1 - w * 0.12, yb - h * 0.25, 22, 4, -1);
      // the stars, counted on a loose ruled grid, each a hair off its place; every seventh a four-pointed star
      let k = 0;
      for (let gy = 0; gy < 9; gy++) for (let gx = 0; gx < 22; gx++) {
        const sx = x0 + (gx + 0.5 + (gy % 2) * 0.5) * w / 22 + (hh(gx, gy) - 0.5) * 5, sy = ya + 3 + gy * (hills - ya - 6) / 8.5 + (hh(gy, gx + 7) - 0.5) * 4.5;
        if (!Z.inside(op, sx, sy) || sy > hills - 3) continue;
        if (Math.hypot(sx - mx, sy - my) < mr + 15) continue;
        if (near(sx, sy, 2)) continue;
        if (hh(gx * 3, gy * 5) < 0.42) continue;
        k++;
        const big = k % 7 === 0, c = k % 3 ? C.star : C.starBlue;
        if (big) {
          const r = 1.5 + hh(k, 9) * 0.5;
          for (const aa of [0, PI / 2]) Z.stroke([[sx - Math.cos(aa) * r, sy - Math.sin(aa) * r], [sx, sy], [sx + Math.cos(aa) * r, sy + Math.sin(aa) * r]], 'chalk', c, { w: 0.36, p: 0.9, tin: 0.45, tout: 0.45 });
          K.dot(sx, sy, c, 0.62);
        } else K.dot(sx, sy, c, 0.36 + hh(k, 4) * 0.3, { p: 0.85 + hh(k, 5) * 0.15 });
      }
      // low hills, the far ones in lapis, the near in dark malachite with a row of small round trees
      const far = [[x0 - 2, yb + 2]], nearH = [[x0 - 2, yb + 2]];
      for (let xx = x0 - 2; xx <= x1 + 2.1; xx += w / 30) {
        far.push([xx, hills - 2.6 - 2.2 * Math.sin(xx * 0.06 + 1.1) - 1.2 * Math.sin(xx * 0.17)]);
        nearH.push([xx, hills + 2.6 - 1.6 * Math.sin(xx * 0.045 + 2.4) - 0.8 * Math.sin(xx * 0.13 + 0.7)]);
      }
      far.push([x1 + 2, yb + 2]); nearH.push([x1 + 2, yb + 2]);
      Z.fill(far, 'chalk', C.hillFar, { w: 1.2, p: 1, passes: 2, reach: 1.5, ang: 0.2 });
      Z.stroke(far.slice(1, -1), 'chalk', Z.mix(C.hillFar, C.cloudLine, 0.3), { w: 0.35, p: 0.6 });
      Z.fill(nearH, 'chalk', C.hill, { w: 1.2, p: 1, passes: 2, reach: 1.5, ang: 0.2 });
      Z.stroke(nearH.slice(1, -1), 'chalk', C.hillLine, { w: 0.4, p: 0.7 });
      const crest = xx => hills + 2.6 - 1.6 * Math.sin(xx * 0.045 + 2.4) - 0.8 * Math.sin(xx * 0.13 + 0.7);
      for (let i = 0; i < 11; i++) {
        const tx = x0 + w * (0.05 + i * 0.09) + (hh(i, 11) - 0.5) * 4, ty = crest(tx) + 0.4, th = 3.2 + hh(i, 12) * 1.4, tr = 1.3 + hh(i, 13) * 0.5;
        Z.stroke([[tx, ty], [tx + 0.1, ty - th * 0.62]], 'chalk', '#3a2a1c', { w: 0.42, p: 0.95 });
        const crown = Z.spline([[tx - tr, ty - th * 0.6], [tx - tr * 1.05, ty - th * 0.82], [tx - tr * 0.5, ty - th * 1.04], [tx + tr * 0.5, ty - th * 1.04], [tx + tr * 1.05, ty - th * 0.82], [tx + tr, ty - th * 0.6]], true, 0.2);
        Z.fill(crown, 'chalk', Z.mix(C.hill, C.hillLine, 0.4), { w: 0.5, p: 1, passes: 2, reach: 1.5 });
        Z.withMask(crown, () => Z.stroke([[tx - tr * 0.7, ty - th * 0.78], [tx - tr * 0.2, ty - th * 0.95]], 'chalk', Z.mix(C.hillLine, '#a8d0a0', 0.4), { w: 0.5, p: 0.7 }));
        Z.outline(crown, K.KJ, Z.mix(K.INK, C.hill, 0.3), { closed: true, w: 0.16, p: 0.7, pull: 20, again: 0 });
      }
    });
    // the bay's own line, laid again over the new sky
    Z.outline(op.slice(1, -1), K.KJ, '#1e1a14', { closed: false, w: 0.6, p: 0.9, pull: 30, again: 0 });
  }
})();
