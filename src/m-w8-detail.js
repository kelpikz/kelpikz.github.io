(function () {
  'use strict';
  /* ==========================================================================
     THE GOLD WELL (well8k): THE SMALL THINGS A CLOSE LOOK FINDS ON A FOCAL OBJECT
       M.w8Feather(A, x, y, len, ang, c)     a pigeon feather lying on a ledge or drifting
       M.w8DoveFloor(A, s)                   grain, droppings, a feather and a water dish on the floor at its foot
       M.w8DoveDetail(A, s, o)               the life of the dovecote: birds in and at the holes, grain,
                                             droppings and feathers on the ledges, a creeper and chevrons
                                             painted on the lime, chipped plaster, a crack with a nest in it,
                                             a water dish at the foot.  A is the dovecote's own zoom (its foot
                                             at 0,0, the same units as M.wellDovecote), s its scale;
                                             o.glint(x, y) is told where the leaf on the finial catches the sun.
     Everything is drawn after the dovecote and over it, so it goes into its cut-out with it.
     ======================================================================== */
  const PI = Math.PI;
  const sstep = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };

  M.w8Feather = function (A, x, y, len, ang, c) {
    c = c || '#d6dade';
    const ca = Math.cos(ang), sa = Math.sin(ang), at = (t, off) => [x + ca * len * t - sa * off, y + sa * len * t + ca * off];
    const side = [], other = [];
    for (let i = 0; i <= 10; i++) {
      const t = 0.12 + 0.88 * i / 10, w = len * 0.17 * Math.pow(Math.sin(PI * Math.min(1, t * 1.08)), 0.7);
      side.push(at(t, w)); other.unshift(at(t, -w * 0.7));
    }
    A.fill(side.concat(other), 'chalk', c, { w: Math.max(0.6, len * 0.12), p: 0.95, passes: 1, ang });
    A.stroke([at(0.7, 0), at(1, 0)], 'chalk', A.mix(c, '#3c4450', 0.55), { w: Math.max(0.5, len * 0.1), p: 0.8 });
    A.stroke([at(0, 0), at(1, 0)], 'kajal', '#5a5650', { w: Math.max(0.3, len * 0.035), p: 0.7 });
    // a split in the vane, as a dropped feather has
    A.stroke([at(0.5, 0), at(0.62, len * 0.13)], 'kajal', A.mix(c, '#2a2a2a', 0.3), { w: Math.max(0.25, len * 0.025), p: 0.6 });
  };

  M.w8DoveDetail = function (A, s, o) {
    o = o || {};
    const P = (u, v) => [u * s, v * s];
    const line = '#2c2118', lime = '#f2e6c8', red = '#b8452c', ochre = '#e0a030', green = '#3b7f52', leafG = '#5a9a5a', lapis = '#2a4c9c';
    const grainC = ['#e2c274', '#c89a48', '#f0e2b8', '#b07a3a'];
    const by0 = -332, by1 = -128, holes = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) holes.push({ r, c, hx: c ? 34 : -34, hy: by1 - 10 - r * 40 });
    const hole = (r, c) => holes.find(h => h.r === r && h.c === c);
    const grain = (u0, u1, v, n) => { for (let i = 0; i < n; i++) A.dot(...P(A.rr(u0, u1), v + A.rr(-1.2, 0.4)), 'chalk', A.pick(grainC), { w: A.rr(0.9, 1.4) * s, p: 0.95, len: 0.5 * s }); };
    const dropping = (u, v, len) => {
      A.stroke([P(u, v), P(u + A.rr(-0.6, 0.6), v + len * 0.5), P(u + A.rr(-0.8, 0.8), v + len)], 'chalk', '#faf8f0', { w: A.rr(0.8, 1.3) * s, p: 0.8, tin: 0.02, tout: 0.4 });
      if (A.chance(0.5)) A.dot(...P(u + A.rr(-0.5, 0.5), v + len + 1.2), 'chalk', '#f4f2ea', { w: 1.2 * s, p: 0.8 });
    };

    // ---- painted on the lime: a creeper down the middle, chevrons beside the corner bands
    {
      const sx = v => 3.6 * Math.sin(v * 0.11), stem = [];
      for (let v = by0 + 18; v <= by1 - 8; v += 3) stem.push(P(sx(v), v));
      A.stroke(stem, 'chalk', green, { w: 1.1 * s, p: 0.85 });
      let k = 0;
      for (let v = by0 + 24; v < by1 - 10; v += 13, k++) {
        const sg = k % 2 ? 1 : -1, u = sx(v);
        A.fill(A.ellipse(...P(u + sg * 4, v - 1.5), 3.6 * s, 1.5 * s, sg * 0.6), 'chalk', leafG, { w: 1 * s, p: 0.9, passes: 1 });
        A.stroke([P(u, v), P(u + sg * 6.5, v - 3)], 'kajal', A.mix(green, line, 0.4), { w: 0.25 * s, p: 0.5 });
        if (k % 2 === 0) {
          const fu = u - sg * 4.5, fv = v + 4, pc = k % 4 ? red : lapis;
          for (let i = 0; i < 5; i++) { const a = i / 5 * 2 * PI + k; A.dot(...P(fu + Math.cos(a) * 2.2, fv + Math.sin(a) * 2.2), 'chalk', pc, { w: 1.9 * s, p: 0.95 }); }
          A.dot(...P(fu, fv), 'chalk', ochre, { w: 1.5 * s, p: 1 });
          A.dot(...P(fu, fv), 'kajal', line, { w: 0.4 * s, p: 0.7 });
        } else A.dot(...P(u + sg * 2, v + 5), 'chalk', red, { w: 1.4 * s, p: 0.9, len: 1.2 * s, ang: -sg });
      }
      for (const sg of [-1, 1]) {
        const u0 = sg * 58;
        for (let v = by0 + 20, i = 0; v < by1 - 6; v += 7, i++) {
          A.stroke([P(u0 - 4, v), P(u0, v + 4), P(u0 + 4, v)], 'chalk', i % 2 ? red : ochre, { w: 1.1 * s, p: 0.9, tin: 0, tout: 0 });
        }
      }
    }
    // ---- the pillar: a band of chevrons, a band of rosettes, a band of teeth
    {
      const zig = []; for (let i = 0; i <= 8; i++) zig.push(P(-13 + i * 26 / 8, i % 2 ? -70 : -82));
      A.stroke(zig, 'chalk', red, { w: 1.4 * s, p: 0.9 });
      for (let i = 0; i <= 8; i++) if (i % 2) A.dot(...P(-13 + i * 26 / 8, -80), 'chalk', ochre, { w: 1.2 * s, p: 0.9 });
      for (const u of [-7, 0, 7]) { for (let i = 0; i < 4; i++) { const a = i / 4 * 2 * PI + 0.4; A.dot(...P(u + Math.cos(a) * 1.8, -56 + Math.sin(a) * 1.8), 'chalk', red, { w: 1.4 * s, p: 0.95 }); } A.dot(...P(u, -56), 'chalk', ochre, { w: 1.1 * s, p: 1 }); }
      for (let u = -12; u < 12; u += 4) A.fill([P(u, -88), P(u + 2, -94), P(u + 4, -88)], 'chalk', green, { w: 0.8 * s, p: 0.9, passes: 1 });
    }

    // ---- the lime has chipped here and there, showing the brick under it
    // (a chip is a shallow hollow: its upper lip throws a thin shadow into it, its lower lip catches the light)
    for (const [u, v, r] of [[-58, -150, 4.6], [58, -226, 3.8], [-57, -292, 3.4], [22, -142, 2.8], [-30, -10, 3.2]]) {
      const e = A.roughen(A.ellipse(u, v, r * 1.6, r * 0.62, A.rr(-0.25, 0.25)), r * 0.3, r * 0.7, true), ch = e.map(p => P(p[0], p[1])), hf = (e.length / 2) | 0;
      A.fill(ch, 'chalk', '#d49a74', { w: 1 * s, p: 0.8, passes: 1 });
      A.stroke([P(u - r * 1.1, v - r * 0.05), P(u + r * 0.9, v + r * 0.1)], 'chalk', '#b0603e', { w: 0.6 * s, p: 0.6 });
      A.stroke(ch.slice(hf), 'kajal', A.mix(line, '#b0603e', 0.3), { w: 0.4 * s, p: 0.6 });
      A.stroke(ch.slice(0, hf + 1), 'chalk', '#fffaf0', { w: 0.6 * s, p: 0.7 });
    }
    // ---- a crack down from the cornice on the right, and in its mouth under the cornice a nest of twigs
    {
      const ck = [[66, -333], [63, -318], [67, -304], [61, -287], [64, -270], [59, -252]].map(p => P(p[0], p[1]));
      A.stroke(ck, 'kajal', line, { w: 0.6 * s, p: 0.8, tout: 0.5 });
      A.stroke([P(64, -304), P(56, -296), P(54, -288)], 'kajal', line, { w: 0.35 * s, p: 0.6, tout: 0.6 });
      const nx = 72, ny = -344;
      A.fill(A.ellipse(...P(nx, ny - 3.5), 11 * s, 4.5 * s, 0, 0, PI * 2), 'chalk', '#6b4a2e', { w: 1.4 * s, p: 0.95, passes: 2 });
      for (let i = 0; i < 46; i++) {
        const a = A.rr(-0.5, PI + 0.5), u = nx + Math.cos(a) * A.rr(5, 12), v = ny - 3.5 + Math.sin(a) * A.rr(1, 5) * 0.8 - A.rr(0, 3), l = A.rr(4, 9), an = A.rr(-0.6, 0.6) + (i % 2 ? 0 : PI);
        A.stroke([P(u, v), P(u + Math.cos(an) * l, v + Math.sin(an) * l * 0.4 + A.rr(-1, 1))], 'chalk', A.pick(['#8a6a3a', '#5a3c22', '#c8a060', '#d8b860', '#a8803a']), { w: A.rr(0.45, 0.8) * s, p: 0.9 });
      }
      // a straw hanging over the edge, and two eggs just showing
      A.stroke([P(nx + 8, ny - 2), P(nx + 13, ny + 4), P(nx + 12, ny + 11)], 'chalk', '#e2c274', { w: 0.6 * s, p: 0.9 });
      A.stroke([P(nx - 9, ny - 1), P(nx - 12, ny + 6)], 'chalk', '#c8a060', { w: 0.5 * s, p: 0.9 });
      for (const du of [-2.5, 2.5]) A.fill(A.ellipse(...P(nx + du, ny - 7.5), 2.6 * s, 1.9 * s, 0), 'chalk', '#f4f0e6', { w: 0.9 * s, p: 1, passes: 1 });
      A.stroke([P(nx - 11, ny - 6.5), P(nx, ny - 9), P(nx + 11, ny - 6.5)], 'chalk', '#8a6a3a', { w: 0.7 * s, p: 0.9 });
    }

    // ---- what the birds leave: grain on every ledge, droppings run down under the perches, feathers
    grain(-78, 78, -128.5, 46);
    for (const h of holes) {
      grain(h.hx - 16, h.hx + 16, h.hy - 0.3, A.ri(2, 6));
      for (let i = 0; i < A.ri(1, 3); i++) dropping(h.hx + A.rr(-16, 16), h.hy + 5.5, A.rr(3, 9));
    }
    for (let i = 0; i < 7; i++) dropping(A.rr(-76, 76), -127.4, A.rr(3, 8));
    for (let i = 0; i < 9; i++) A.dot(...P(A.rr(-44, 44), A.rr(-17, -1)), 'chalk', '#faf8f0', { w: A.rr(0.9, 1.5) * s, p: 0.8 });
    grain(-40, 40, -16.5, 14); grain(-30, 30, -28.5, 10);
    M.w8Feather(A, ...P(-52, -129.5), 9 * s, -0.12, '#d8dce2');
    M.w8Feather(A, ...P(18, -178.6), 7 * s, 3.05, '#e8eaee');
    M.w8Feather(A, ...P(-26, -17), 8 * s, 0.25, '#c4cad2');
    M.w8Feather(A, ...P(93, -232), 9 * s, 1.9, '#e2e6ea');
    M.w8Feather(A, ...P(-88, -168), 7 * s, -2.4, '#cfd4da');

    // ---- the birds: two on their perches, a head looking out, a tail going in, one coming in to land
    {
      const h1 = hole(1, 0), h2 = hole(3, 1), h3 = hole(0, 1), h4 = hole(2, 0), h5 = hole(4, 0), h6 = hole(2, 1);
      M.w8Pigeon(A, ...P(h1.hx - 2, h1.hy + 0.2), 27 * s, 'preen', { c: 'grey' });
      M.w8Pigeon(A, ...P(h2.hx + 3, h2.hy + 0.2), 26 * s, 'sit', { flip: true, c: 'white' });
      M.w8Pigeon(A, ...P(h5.hx + 1, h5.hy + 0.2), 25 * s, 'tuck', { flip: true, c: 'grey' });
      // one on the end of the cornice, a wing lifted to the sun
      M.w8Pigeon(A, ...P(-70, -344), 22 * s, 'half', { flip: true, c: 'brown' });
      // a head out of the dark of its hole, the eye catching the light
      M.w8PigeonHead(A, ...P(h3.hx - 4, h3.hy + 12), 24 * s, { c: 'grey' });
      // one going in: on the perch, its head already lost in the dark of the hole
      {
        const hx = h4.hx, hy = h4.hy;
        M.w8Pigeon(A, ...P(hx - 4, hy + 0.2), 25 * s, 'sit', { c: 'grey' });
        M.floorWash(A, [P(hx - 15, hy - 19), P(hx + 15, hy - 19), P(hx + 15, hy - 0.5), P(hx - 15, hy - 0.5)], '#140c08', (x) => 0.92 * sstep((x / s - (hx - 2)) / 11), 'mul');
      }
      // coming in to land at the hole on the right, wings up, feet down
      {
        M.w8Pigeon(A, ...P(h6.hx + 24, h6.hy - 3), 30 * s, 'land', { flip: true, c: 'grey' });
      }
    }
    if (o.glint) {
      const [gx, gy] = P(-2.5, -407);
      A.dot(gx, gy, 'gold', '#f2d27a', { w: 1.6 * s, p: 1 });
      A.dot(gx, gy, 'chalk', '#fffaf0', { w: 0.6 * s, p: 1 });
      o.glint(gx, gy);
    }
  };
  // the floor round the foot of the dovecote: painted with the landing, before the dovecote, so its cut-out does not carry it
  M.w8DoveFloor = function (A, s) {
    const P = (u, v) => [u * s, v * s], line = '#2c2118', grainC = ['#e2c274', '#c89a48', '#f0e2b8', '#b07a3a'];
    for (let i = 0; i < 26; i++) A.dot(...P(A.rr(-74, 74), A.rr(-1.6, 0.2)), 'chalk', A.pick(grainC), { w: A.rr(0.9, 1.4) * s, p: 0.95, len: 0.5 * s });
    for (let i = 0; i < 6; i++) A.dot(...P(A.rr(-60, 60), A.rr(-1, 0.5)), 'chalk', '#faf8f0', { w: A.rr(0.9, 1.5) * s, p: 0.8 });
    M.w8Feather(A, ...P(-62, -1.2), 8 * s, -3.0, '#d8dce2');
    // a clay dish of water for them
    {
      const dx = 64, dy = -0.5;
      A.fill(A.ellipse(...P(dx, dy), 13 * s, 3.4 * s, 0, 0, PI), 'chalk', '#a8542e', { w: 1.2 * s, p: 1, passes: 2 });
      A.fill([P(dx - 13, dy), P(dx + 13, dy), P(dx + 9, dy + 4), P(dx - 9, dy + 4)].map(p => [p[0], p[1] - 4 * s]), 'chalk', '#b8603a', { w: 1.2 * s, p: 1, passes: 2 });
      A.fill(A.ellipse(...P(dx, dy - 4), 12 * s, 2.8 * s, 0), 'chalk', '#6e8a96', { w: 1 * s, p: 1, passes: 2 });
      A.stroke([P(dx - 7, dy - 4.6), P(dx + 2, dy - 5)], 'chalk', '#e8f0f2', { w: 0.6 * s, p: 0.9 });
      A.outline(A.ellipse(...P(dx, dy - 4), 13 * s, 3.2 * s, 0), 'kajal', line, { closed: true, w: 0.5 * s, p: 0.7 });
    }
  };
})();
