(function () {
  'use strict';
  /* ==========================================================================
     THE GOLD WELL (well8k): THE FLOAT ON THE YEAR STAFF
       M.w8Float(A, o)   a hammered brass tag that rides on the water beside the staff, its face left blank for the page
                         to set the year in.  o = { w, h } (170 x 64).  Returns { face: [x, y, w, h], solid: [polys] } in
                         o's units: solid is where the brass is whole, so the alpha there is made full.
     A cartouche of brass beaten thin, the hammer marks catching the light; a raised rim with a row of punched dots; a
     smooth sunk face; a rivet at each end; gold leaf laid on the high places of the rim; green verdigris where the water
     reaches it; two rings at the top with a twisted red cord between them, by which it hangs on the staff.
     ======================================================================== */
  const PI = Math.PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const C = { brass: '#c8963a', lit: '#f2d488', deep: '#7a5418', dark: '#4a3010', line: '#24160a', verd: '#3e9a84', verdL: '#8fd2b6', verdD: '#1e5a4a', cord: '#b8322a', cordL: '#e8644a', cordD: '#5a1410', gold: '#e2b84a' };

  // a tag: long sides straight, each end cut to a blunt point, the corners just rounded
  function cartouche(A, x0, y0, x1, y1, e) {
    const ym = (y0 + y1) / 2, cn = [[x0 + e, y0], [x1 - e, y0], [x1, ym], [x1 - e, y1], [x0 + e, y1], [x0, ym]], pts = [];
    cn.forEach((p, i) => { const q = cn[(i + 1) % cn.length], n = Math.max(2, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 2.5)); for (let k = 0; k < n; k++) pts.push([p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n]); });
    return A.spline(pts, true, 0.4);
  }

  M.w8Float = function (A, o) {
    const W = o.w, H = o.h, x0 = 6, x1 = W - 6, y0 = 18, y1 = H - 5, cx = W / 2, ym = (y0 + y1) / 2;
    const plate = cartouche(A, x0, y0, x1, y1, 9);
    const rim = cartouche(A, x0 + 4.5, y0 + 4, x1 - 4.5, y1 - 4, 7.6);
    const fx0 = 30, fx1 = W - 30, fy0 = y0 + 8, fy1 = y1 - 10, face = rect(fx0, fy0, fx1, fy1);

    // ---- the cord and the rings first, so the plate lies over their feet
    const ringX = [x0 + 34, x1 - 34], ringY = y0 - 3.4;
    const cord = A.spline([[ringX[0], ringY - 3], [ringX[0] + 10, 6], [cx, 3.2], [ringX[1] - 10, 6], [ringX[1], ringY - 3]], false, 0.4);
    A.stroke(cord, 'chalk', C.cordD, { w: 3.2, p: 1, tin: 0, tout: 0 });
    A.stroke(cord, 'pastel', C.cord, { w: 2.4, p: 1, tin: 0, tout: 0 });
    // the twist: short light slashes along it
    for (let i = 2; i < cord.length - 2; i += 3) {
      const p = cord[i], q = cord[Math.min(cord.length - 1, i + 1)], a = Math.atan2(q[1] - p[1], q[0] - p[0]) + 0.9;
      A.stroke([[p[0] - Math.cos(a) * 1, p[1] - Math.sin(a) * 1], [p[0] + Math.cos(a) * 1, p[1] + Math.sin(a) * 1]], 'chalk', i % 2 ? C.cordL : C.gold, { w: 0.6, p: 0.9 });
    }
    // a knot and a small tassel at the middle of the cord
    A.dot(cx, 3.6, 'chalk', C.cordD, { w: 3.4, p: 1 }); A.dot(cx - 0.4, 3.2, 'pastel', C.cord, { w: 2.4, p: 1 });
    for (const ring of ringX) {
      const rr = A.ellipse(ring, ringY, 4.2, 4.8);
      A.stroke(rr.concat([rr[0]]), 'chalk', C.dark, { w: 2.6, p: 1, tin: 0, tout: 0 });
      A.stroke(rr.concat([rr[0]]), 'chalk', C.brass, { w: 1.8, p: 1, tin: 0, tout: 0 });
      A.stroke(A.ellipse(ring, ringY, 4.2, 4.8, 0, PI * 1.05, PI * 1.6), 'chalk', C.lit, { w: 0.7, p: 0.95 });
      A.outline(A.ellipse(ring, ringY, 5.4, 6), 'kajal', C.line, { closed: true, w: 0.45, p: 0.8 });
      A.outline(A.ellipse(ring, ringY, 3, 3.6), 'kajal', C.line, { closed: true, w: 0.4, p: 0.7 });
      // the lug that holds the ring, riveted to the plate
      A.fill(rect(ring - 2.4, y0 - 1.4, ring + 2.4, y0 + 3.4), 'chalk', C.brass, { w: 0.8, p: 1, passes: 2 });
      A.outline(rect(ring - 2.4, y0 - 1.4, ring + 2.4, y0 + 3.4), 'kajal', C.line, { closed: true, w: 0.4, p: 0.8 });
    }

    // ---- the brass, laid solid, lit from the top left
    A.ground(plate, C.brass, { w: 4, edge: 0, rub: 0, top: 0 });
    A.fill(plate, 'chalk', C.brass, { w: 1.2, p: 1, passes: 2 });
    M.floorWash(A, plate, C.lit, (x, y) => 0.55 * (1 - sstep(Math.hypot((x - x0 - 30) / 90, (y - y0) / 40))), 'over');
    M.floorWash(A, plate, C.deep, (x, y) => 0.45 * sstep((y - ym) / (y1 - ym)) + 0.2 * sstep((x - cx) / (x1 - cx)), 'mul');
    // the hammer marks: each a dent, dark on the side away from the light and lit on the near side
    for (let i = 0; i < 90; i++) {
      const x = A.rr(x0 + 4, x1 - 4), y = A.rr(y0 + 2, y1 - 2);
      if (!A.inside(plate, x, y) || A.inside(face, x, y)) continue;
      const r = A.rr(1.3, 2.3);
      A.stroke(A.ellipse(x, y, r, r * 0.85, 0, PI * 1.0, PI * 1.5), 'chalk', C.deep, { w: 0.5, p: 0.4 });
      A.stroke(A.ellipse(x, y, r, r * 0.85, 0, PI * 0.0, PI * 0.5), 'chalk', C.lit, { w: 0.45, p: 0.5 });
    }

    // ---- the raised rim and its punched dots
    A.outline(rim, 'kajal', C.dark, { closed: true, w: 0.55, p: 0.8 });
    A.stroke(rim.slice(0, Math.floor(rim.length * 0.45)), 'chalk', '#fff0c0', { w: 0.6, p: 0.8 });
    {
      const mid = cartouche(A, x0 + 2.4, y0 + 2.1, x1 - 2.4, y1 - 2.1, 8.3);
      let acc = 0, last = mid[0];
      for (const p of mid) { acc += Math.hypot(p[0] - last[0], p[1] - last[1]); last = p; if (acc >= 2.7) { acc = 0; A.dot(p[0] + 0.25, p[1] + 0.3, 'chalk', C.dark, { w: 0.9, p: 0.9 }); A.dot(p[0], p[1], 'chalk', C.lit, { w: 0.55, p: 0.9 }); } }
    }

    // ---- the face: beaten smooth and sunk, a little darker, polished; left blank for the year
    A.ground(face, A.mix(C.brass, C.lit, 0.25), { w: 3, edge: 0, rub: 0, top: 0 });
    M.floorWash(A, face, C.deep, (x, y) => 0.42 * (1 - sstep((y - fy0) / 4)) + 0.3 * (1 - sstep((x - fx0) / 4)), 'mul');
    M.floorWash(A, face, '#fff4d0', (x, y) => 0.25 * (1 - sstep(Math.abs(y - fy0 - (fy1 - fy0) * 0.35) / 5)), 'over');
    A.stroke([[fx0 + 0.6, fy1 - 0.5], [fx1 - 0.5, fy1 - 0.5], [fx1 - 0.5, fy0 + 0.8]], 'chalk', C.lit, { w: 0.8, p: 0.9 });
    A.outline(face, 'kajal', C.line, { closed: true, w: 0.55, p: 0.85 });
    // a small lotus chased at each end of the face
    for (const sg of [-1, 1]) {
      const lx = sg < 0 ? (x0 + 8 + fx0) / 2 + 1 : (fx1 + x1 - 8) / 2 - 1;
      for (let i = -2; i <= 2; i++) {
        const a = i * 0.5 + PI / 2 * 0, tip = [lx + Math.sin(a) * 5.4, ym - Math.cos(a) * 5.4];
        const pet = A.spline([[lx, ym + 1], [lx + Math.sin(a - 0.35) * 3, ym - Math.cos(a - 0.35) * 3], tip, [lx + Math.sin(a + 0.35) * 3, ym - Math.cos(a + 0.35) * 3]], true, 0.3);
        A.outline(pet, 'kajal', C.dark, { closed: true, w: 0.35, p: 0.75 });
      }
      A.stroke([[lx - 4, ym + 2.6], [lx + 4, ym + 2.6]], 'kajal', C.dark, { w: 0.4, p: 0.75 });
      // the rivet at each end
      const rx = sg < 0 ? x0 + 6.5 : x1 - 6.5;
      A.dot(rx, ym, 'chalk', C.dark, { w: 2.6, p: 1 }); A.dot(rx - 0.3, ym - 0.3, 'chalk', C.brass, { w: 1.8, p: 1 }); A.dot(rx - 0.6, ym - 0.6, 'chalk', '#fff4d0', { w: 0.7, p: 1 });
    }

    // ---- verdigris where the water reaches: along the foot, eating in where the hammer marks hold the wet
    A.withMask(plate, () => {
      A.pushMaskOutside(rect(fx0 - 1, fy0 - 1, fx1 + 1, fy1 + 1));
      const tide = [[x0 - 2, y1 + 2]]; for (let x = x0 - 2; x <= x1 + 2.01; x += 2) tide.push([x, y1 - 6 + Math.sin(x * 0.31) * 1.3 + Math.sin(x * 0.11 + 1) * 1.6]); tide.push([x1 + 2, y1 + 2]);
      A.withMask(tide, () => {
        M.floorCloud(A, plate, C.verd, { scale: 7, seed: 11, thr: 0.5, soft: 0.3, p: 0.6, w: 1.4 });
        M.floorCloud(A, plate, C.verdL, { scale: 4, seed: 23, thr: 0.7, soft: 0.25, p: 0.45, w: 0.9 });
      });
      M.floorWash(A, plate, C.verd, (x, y) => 0.4 * sstep((y - y1 + 3.5) / 3.5), 'over');
      for (let i = 0; i < 20; i++) { const x = A.rr(x0 + 6, x1 - 6), y = y1 - 0.5 - A.rr(0, 5) * A.rnd(); A.dot(x, y, 'chalk', A.pick([C.verd, C.verdL, C.verdD]), { w: A.rr(0.5, 1.2), p: 0.7 }); }
      // a few runs of green up the brass from the waterline, stopping short of the face
      for (let i = 0; i < 6; i++) { const x = A.rr(x0 + 10, x1 - 10); A.stroke([[x, y1 - 1.5], [x + A.rr(-0.5, 0.5), y1 - A.rr(4, 7)]], 'chalk', C.verd, { w: 0.6, p: 0.45, tout: 0.7 }); }
      A.popMask();
    });

    // ---- gold leaf on the high places of the rim, and the sun on it
    for (const [u, w] of [[0.18, 9], [0.36, 6], [0.62, 7]]) {
      const x = x0 + (x1 - x0) * u;
      A.stroke([[x, y0 + 2.1], [x + w, y0 + 2.1]], 'gold', C.gold, { w: 1.2, p: 1, tin: 0.2, tout: 0.2 });
    }
    A.stroke([[x0 + 5, ym - 4], [x0 + 3.2, ym], [x0 + 5, ym + 4]], 'gold', C.gold, { w: 1, p: 1 });
    for (const [x, y, s] of [[x0 + 24, y0 + 2.2, 2.4], [x0 + 62, y0 + 2.4, 1.6], [ringX[0] - 3, ringY - 3, 1.8]]) {
      A.dot(x, y, 'chalk', '#fffbe8', { w: s * 0.5, p: 1 });
      for (const a of [0, PI / 2]) A.stroke([[x - Math.cos(a) * s, y - Math.sin(a) * s], [x + Math.cos(a) * s, y + Math.sin(a) * s]], 'chalk', '#fffbe8', { w: 0.35, p: 0.9 });
    }

    // ---- the kajal line round it all
    A.outline(plate, 'kajal', C.line, { closed: true, w: 0.9, p: 0.92, pull: 20 });
    return { face: [fx0, fy0, fx1 - fx0, fy1 - fy0], solid: [plate] };
  };
})();
