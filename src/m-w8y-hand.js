(function () {
  'use strict';
  /* ==========================================================================
     THE HAND ON THE BROAD PLANES (used by the side walls, the frame and the stair painters).
     A folio's grounds show how they were made: the stick dragged on its side leaves long streaks, a
     second close tone rubbed over the first sits on the tooth and leaves the hollows in the first
     colour, and the colour changes a little from one pull to the next.  The broad planes of the well
     had none of this: the paper was polished flat under them and the colour laid on until it was even,
     so they read as clean flat fills.  This kit puts the making back, and keeps it calm.
     The marks are made at the size of a stroke, not of a grain: a streak is one to three units wide
     and tens of units long, so it reads when the well is seen whole as well as close.
       M.w8Hand.burnish(A, polys)       press the paper flat at the scale of the crumple and the hairs,
                                        but leave the fine tooth its depth, so the pigment breaks on it
       M.w8Hand.streaks(A, poly, cs, o) long narrow pulls of the stick along the plane (o.ang), each in
                                        one of the close tones cs, side by side and overlapping
       M.w8Hand.coat(A, poly, c, o)     one tone laid over the ground in streaks
       M.w8Hand.ground(A, poly, lit, deep, o)  the usual pair, a lighter and a deeper tone in streaks
       M.w8Hand.pull(A, pts, tool, c, o) a line pulled by hand along a straight edge: in one or two pulls,
                                        never quite straight, its pressure rising and falling
     A may be the sheet or a mapped frame (H.zoom): only A.fill, A.stroke, A.pushMask, A.HM are used.
     ======================================================================== */
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const HK = M.w8Hand = {};

  /* The fine burnish.  The sheet's height map is a fine tooth, broader swells (the crumple) and pressed hairs; the
     raking light at the end shows all three.  A burnished wasli keeps only the tooth.  So here the swells and the
     hairs are pressed out and a fresh tooth is left in their place: a grain one or two pixels across, the same
     everywhere, with a whisper of the sheet's own grain (o.keep) so the surface still belongs to that sheet.
     The colour then breaks evenly on it, as pastel does on a burnished sheet, with no mottle at the scale of a
     hand and no wrinkles.  o.amp is the depth of the tooth. */
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  HK.burnish = (A, polys, o) => {
    o = o || {};
    const HM = A.HM, W = A.W, H = A.H; if (!HM || !A.pushMask) return;
    const r = 1, keep = o.keep != null ? o.keep : 0.25, amp = o.amp != null ? o.amp : 1.25, lim = o.lim != null ? o.lim : 0.24;
    for (const poly of (Array.isArray(polys[0][0]) ? polys : [polys])) {
      const m = A.pushMask(poly, 0); A.popMask();
      if (!m || !m.w || !m.h) continue;
      const x0 = Math.max(0, m.x0 - r), y0 = Math.max(0, m.y0 - r), x1 = Math.min(W, m.x0 + m.w + r), y1 = Math.min(H, m.y0 + m.h + r);
      const bw = x1 - x0, bh = y1 - y0; if (bw <= 0 || bh <= 0) continue;
      // white grain over the box, by position on the sheet (so neighbouring shapes share it), then softened 3x3
      const N = new Float32Array(bw * bh);
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) N[y * bw + x] = hash(x0 + x, y0 + y);
      // the new values go to a scratch buffer first, so a point's neighbours are always read as they were
      const out = new Float32Array(m.w * m.h);
      for (let y = 0; y < m.h; y++) {
        const Y = m.y0 + y; if (Y < 0 || Y >= H) continue;
        for (let x = 0; x < m.w; x++) {
          const d = m.d[y * m.w + x]; if (!d) continue;
          const X = m.x0 + x; if (X < 0 || X >= W) continue;
          let s9 = 0, sh = 0, sn = 0, cn = 0;
          for (let dy = -1; dy <= 1; dy++) {
            const yy = Y + dy - y0; if (yy < 0 || yy >= bh) continue;
            for (let dx = -1; dx <= 1; dx++) {
              const xx = X + dx - x0; if (xx < 0 || xx >= bw) continue;
              const wgt = (dx ? 1 : 2) * (dy ? 1 : 2);
              sn += N[yy * bw + xx] * wgt; cn += wgt; sh += HM[(Y + dy) * W + X + dx]; s9++;
            }
          }
          const tooth = (sn / cn - 0.5) * 2.1, own = HM[Y * W + X] - sh / s9;
          out[y * m.w + x] = 0.5 + clamp(tooth * amp * 0.5 + own * keep, -lim, lim);
        }
      }
      for (let y = 0; y < m.h; y++) {
        const Y = m.y0 + y; if (Y < 0 || Y >= H) continue;
        for (let x = 0; x < m.w; x++) {
          const d = m.d[y * m.w + x]; if (!d) continue;
          const X = m.x0 + x; if (X < 0 || X >= W) continue;
          const i = Y * W + X; HM[i] += (out[y * m.w + x] - HM[i]) * d / 255;
        }
      }
    }
  };

  /* Streaks.  The plane is crossed, along o.ang, by rows about o.sp apart (0.9 unit); each row is laid as a run of
     pulls of the stick on its side, each pull o.w0..o.w1 wide (1.1..2.6 units) and o.l0..o.l1 long (14..46 units),
     in a tone picked from cs, pressed o.p, its ends lifted so two pulls in a row overlap softly and leave no seam.
     The rows overlap one another about twice, so the tones mix into a fine rhythm across the plane and run long
     along it, which is how a laid pastel ground looks.  All sizes are units of the sheet: in a mapped frame
     they are scaled by the frame's local size at the middle of the shape. */
  HK.streaks = (A, poly, cs, o) => {
    o = o || {};
    const pl = Array.isArray(poly[0][0]) ? poly : [poly], bb = A.bbox(pl);
    if (!cs.length || !(bb[2] > bb[0]) || !(bb[3] > bb[1]) || !isFinite(bb[0] + bb[1] + bb[2] + bb[3])) return;
    const rr = A.rr, k = A.__k ? Math.max(0.05, A.__k((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2)) : 1, u = 1 / k;
    const ang = o.ang || 0, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const w0 = (o.w0 || 1.1) * u, w1 = (o.w1 || 2.6) * u, sp = (o.sp || 0.9) * u, l0 = (o.l0 || 14) * u, l1 = (o.l1 || 46) * u;
    const p = o.p != null ? o.p : 0.42, tool = o.tool || 'side', wt = o.wt || null;
    let qmin = 1e9, qmax = -1e9;
    for (const q of pl) for (const v of q) { const d = v[0] * nx + v[1] * ny; if (d < qmin) qmin = d; if (d > qmax) qmax = d; }
    const pick = () => { if (!wt) return cs[Math.min(cs.length - 1, (rr(0, 1) * cs.length) | 0)]; let r = rr(0, 1) * wt.reduce((x, y) => x + y, 0); for (let i = 0; i < cs.length; i++) { r -= wt[i]; if (r <= 0) return cs[i]; } return cs[cs.length - 1]; };
    A.pushMask(pl, 0);
    try {
      for (let q = qmin - sp * rr(0, 1); q < qmax + sp; q += sp * rr(0.7, 1.3)) {
        let a = 1e9, b = -1e9;
        for (const P of pl) for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
          const q1 = P[j][0] * nx + P[j][1] * ny - q, q2 = P[i][0] * nx + P[i][1] * ny - q;
          if ((q1 > 0) === (q2 > 0)) continue;
          const f = q1 / (q1 - q2), t = (P[j][0] + (P[i][0] - P[j][0]) * f) * dx + (P[j][1] + (P[i][1] - P[j][1]) * f) * dy;
          if (t < a) a = t; if (t > b) b = t;
        }
        if (b <= a) continue;
        a -= rr(1, 4) * u; b += rr(1, 4) * u;
        let t = a - rr(0, l1 * 0.5);
        while (t < b) {
          const L = rr(l0, l1), e = t + L, m = (t + e) / 2, bow = rr(-0.012, 0.012) * L, off = rr(-0.2, 0.2) * sp;
          const P = [[nx * (q + off) + dx * t, ny * (q + off) + dy * t], [nx * (q + off + bow) + dx * m, ny * (q + off + bow) + dy * m], [nx * (q + off) + dx * e, ny * (q + off) + dy * e]];
          if (rr(0, 1) < 0.5) P.reverse();
          A.stroke(P, tool, pick(), { w: rr(w0, w1), p: p * rr(0.72, 1.15), streak: o.streak != null ? o.streak : 0.3, cv: 0.012, wob: 0.3, tin: 0.2, tout: 0.25, reach: o.reach, soft: o.soft });
          t = e - L * rr(0.08, 0.3);
        }
      }
    } finally { A.popMask(); }
  };
  /* One tone over the ground, in streaks along the plane. */
  HK.coat = (A, poly, c, o) => {
    o = o || {};
    HK.streaks(A, poly, [c], { ang: o.ang, p: o.p != null ? o.p : 0.42, sp: o.sp, w0: o.w0, w1: o.w1, l0: o.l0, l1: o.l1, reach: o.reach });
  };
  /* The usual pair: a lighter and a deeper tone in streaks along the plane, the lighter the more often; o.amt
     scales how far apart the two tones lie (the caller gives them a little apart already). */
  HK.ground = (A, poly, lit, deep, o) => {
    o = o || {};
    const cs = [lit, deep].filter(Boolean);
    HK.streaks(A, poly, cs, { ang: o.ang || 0, p: o.pl != null ? o.pl : 0.46, sp: o.sp, wt: cs.length > 1 ? [0.58, 0.42] : null, w0: o.w0, w1: o.w1, l0: o.l0, l1: o.l1, reach: o.reach });
  };

  /* A line pulled by hand: split into one or two pulls that meet with a small overlap, each a hair off the
     straight, its pressure rising and falling along it.  pts is a polyline (usually two points); o.w, o.p,
     o.j (how far off the straight, logical units), o.wob. */
  HK.pull = (A, pts, tool, c, o) => {
    o = o || {};
    const rr = A.rr, j = o.j != null ? o.j : 0.12;
    let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (L < 0.05) return;
    const at = t => {
      let d = t * L;
      for (let i = 1; i < pts.length; i++) {
        const s = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        if (d <= s || i === pts.length - 1) { const u = s ? clamp(d / s, 0, 1) : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u, (pts[i][0] - pts[i - 1][0]) / (s || 1), (pts[i][1] - pts[i - 1][1]) / (s || 1)]; }
        d -= s;
      }
    };
    const two = L > (o.long || 14) && rr(0, 1) < 0.75, cut = two ? rr(0.35, 0.65) : 1, ov = Math.min(0.08, 0.6 / L);
    const runs = two ? [[0, cut + ov], [cut - ov, 1]] : [[0, 1]];
    for (const [t0, t1] of runs) {
      const n = Math.max(2, Math.min(10, Math.round((t1 - t0) * L / 2.5))), ph = rr(0, 6.28), sw = rr(0.18, 0.32), off = rr(-j, j), bend = rr(-j, j);
      const seg = [];
      for (let i = 0; i <= n; i++) {
        const t = t0 + (t1 - t0) * i / n, q = at(clamp(t, 0, 1)), u = i / n, e = off * (1 - u) + bend * Math.sin(u * Math.PI);
        seg.push([q[0] - q[3] * e, q[1] + q[2] * e, 1 - sw * 0.5 + sw * (0.5 + 0.5 * Math.sin(ph + u * 4.2))]);
      }
      A.stroke(seg, tool, c, { w: o.w || 0.24, p: (o.p || 0.8) * rr(0.92, 1.05), tin: o.tin != null ? o.tin : 0.04, tout: o.tout != null ? o.tout : 0.08, wob: o.wob != null ? o.wob : 0.45 });
    }
  };
})();
