(function () {
  'use strict';
  /* ==========================================================================
     SKY MOTIFS  -  monsoon cloud, cloud bands, lightning, rain, stars, moon, sun,
     fireflies.  Everything is laid with the same five dry tools as the rest of
     the sheet: pigment pastel (tip / side / sharp edge), wax pencil, kajal,
     geru, shell gold.
     ======================================================================== */
  const TAU = Math.PI * 2;
  const wrap = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // +1 when (ty, -tx) points out of the polygon
  function orient(A, poly) {
    const n = poly.length; let votes = 0;
    for (let k = 0; k < 9; k++) {
      const i = Math.floor(n * (k + 0.5) / 9), a = poly[(i - 1 + n) % n], b = poly[(i + 1) % n], p = poly[i];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      votes += A.inside([poly], p[0] + ty * 2, p[1] - tx * 2) ? -1 : 1;
    }
    return votes >= 0 ? 1 : -1;
  }
  // normals of an open polyline
  function normals(pts) {
    const n = pts.length, out = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1;
      out.push([-ty / l, tx / l, tx / l, ty / l]);
    }
    return out;
  }

  /* --------------------------------------------------------------------------
     One comma curl of cloud: a scalloped puff with a paler channel that winds
     into its heart.  q: { m (angle of the mouth), dir (+1 / -1), deep, hollow,
     streaks[], rim, rimW, skip, echo, gold, light }
     ------------------------------------------------------------------------ */
  function drawPuff(A, cx, cy, R, q) {
    const rr = A.rr;
    const e = rr(0.02, 0.13), rot = rr(0, Math.PI), sd = rr(0, 900), dir = q.dir, m = q.m;
    const nb = Math.max(5, Math.round(TAU * R / rr(18, 25)));
    const ws = []; let sum = 0;
    for (let k = 0; k < nb; k++) { const v = rr(0.7, 1.4); ws.push(v); sum += v; }
    const radAt = (phi, u, amp) => {
      let r = R * (1 + e * Math.cos(2 * (phi - rot))) * (1 + 0.12 * (A.noise2(Math.cos(phi) * 1.1 + sd, Math.sin(phi) * 1.1 + sd, 3) - 0.5));
      r *= 1 - amp + amp * Math.pow(Math.sin(Math.PI * u), 0.55);
      const d = wrap(phi - (m - dir * 0.2));
      return r * (1 - 0.2 * Math.exp(-d * d / 0.04));
    };
    const blob = [], arcs = [];
    let a0 = rr(0, TAU);
    for (let k = 0; k < nb; k++) {
      const a1 = a0 + TAU * ws[k] / sum, amp = rr(0.12, 0.21), steps = Math.max(5, Math.ceil((a1 - a0) * R / 2.2));
      const arc = [];
      for (let s = 0; s <= steps; s++) {
        const u = s / steps, phi = a0 + (a1 - a0) * u, r = radAt(phi, u, amp);
        const p = [cx + Math.cos(phi) * r, cy + Math.sin(phi) * r];
        arc.push(p); if (s < steps) blob.push(p);
      }
      arcs.push(arc); a0 = a1;
    }
    // the dark body
    A.fill([blob], 'pastel', q.deep, { w: Math.max(5, R * (q.thin ? 0.34 : 0.27)), p: 1, reach: q.thin ? 1.9 : 1.6, passes: q.thin ? 1 : 2, gap: q.thin ? 0.42 : 0.5, ang: rr(-1.3, 1.3), turn: 0.7, cv: 0.03 });

    A.pushMask([blob]);
    // a breath of lighter blue on the shoulders of the puff
    if (q.light) {
      const la = rr(3.4, 5.2), lr = R * rr(0.45, 0.7);
      A.stroke(A.ellipse(cx, cy, lr, lr * rr(0.8, 1), 0, la, la + rr(0.9, 1.7)), 'side', q.light, { w: R * rr(0.3, 0.5), p: rr(0.2, 0.34), reach: 0.9 });
    }
    if (q.plain) {
      // a filler lobe: only an echo or two of its own outline inside
      const k = A.ri(1, 2);
      for (let j = 0; j < k; j++) {
        const a = rr(0, TAU), rad = R * rr(0.45, 0.7);
        A.stroke(A.ellipse(cx, cy, rad, rad * rr(0.8, 1), rr(0, 3), a, a + rr(1.2, 2.6)), 'pencil', A.pick(q.streaks), { w: rr(0.9, 1.3), p: rr(0.45, 0.75) });
      }
    } else {
      // the channel that winds into the heart: smooth on the outside, lobed on the side of the core
      const turns = q.turns || rr(0.85, 1.2), hw = q.hw || rr(0.2, 0.3);
      const nbS = Math.max(3, Math.round(0.5 * R * turns * TAU / rr(13, 19))), T = nbS * 8;
      const outer = [], inner = [], mid = [];
      for (let i = 0; i <= T; i++) {
        const t = i / T, ang = m + dir * turns * TAU * t;
        const rho = R * (1.06 - 0.88 * Math.pow(t, 0.8));
        const sc = Math.pow(Math.abs(Math.sin(Math.PI * t * nbS)), 0.6);
        const h = R * hw * Math.pow(1 - t, 1.05) * (1 - 0.4 * sc);
        const ri = Math.max(R * 0.03, rho - h);
        outer.push([cx + Math.cos(ang) * rho, cy + Math.sin(ang) * rho]);
        inner.push([cx + Math.cos(ang) * ri, cy + Math.sin(ang) * ri]);
        mid.push([cx + Math.cos(ang) * (rho + ri) / 2, cy + Math.sin(ang) * (rho + ri) / 2]);
      }
      A.pushMask([outer.concat(inner.slice().reverse())]);
      const cutsT = [0, 0.3, 0.62, 1], wk = [1.25, 0.95, 0.6];
      for (let ps = 0; ps < 2; ps++) for (let k = 0; k < 3; k++) {
        const seg = mid.slice(Math.max(0, Math.floor(cutsT[k] * T) - 2), Math.min(T, Math.floor(cutsT[k + 1] * T) + 2) + 1);
        A.stroke(seg, 'pastel', q.hollow, { w: R * hw * wk[k], p: 1, reach: 1.7, tin: 0, tout: 0, wob: 0.4, cv: 0.035 });
      }
      const ns = A.ri(2, 4);
      for (let k = 0; k < ns; k++) {                                          // brushy streaks along the channel
        const f = rr(0.15, 0.85), ia = Math.floor(rr(0, 0.25) * T), ib = Math.floor(rr(0.4, 0.85) * T), line = [];
        for (let i = ia; i <= ib; i += 2) line.push([lerp(outer[i][0], inner[i][0], f), lerp(outer[i][1], inner[i][1], f)]);
        if (line.length > 2) A.stroke(line, 'chalk', A.pick(q.streaks), { w: rr(0.9, 1.9), p: rr(0.38, 0.8) });
      }
      A.popMask();
      // bright smooth rim of the arm, drawn in two pulls
      const h1 = Math.floor(T * rr(0.42, 0.56));
      A.stroke(outer.slice(0, h1 + 1), 'chalk', q.rim, { w: q.rimW, p: rr(0.8, 0.96), tin: 0.05, tout: 0.1 });
      A.stroke(outer.slice(Math.max(0, h1 - 2)), 'chalk', q.rim, { w: Math.max(0.8, q.rimW * 0.62), p: rr(0.7, 0.9), tin: 0.05, tout: 0.45 });
      // lobes of the core
      for (let j = 0; j < nbS; j++) {
        if (j / nbS > 0.72 || A.chance(0.12)) continue;
        A.stroke(inner.slice(j * 8, j * 8 + 9), 'chalk', q.rim2 || q.rim, { w: Math.max(0.8, q.rimW * 0.6 * rr(0.85, 1.1)), p: rr(0.55, 0.85), tin: 0.2, tout: 0.25 });
      }
    }
    A.popMask();

    // scalloped outer rim, one pull of the chalk per lobe
    for (let k = 0; k < nb; k++) {
      if (A.chance(q.skip)) continue;
      const kk = rr(0.945, 0.965);
      A.stroke(arcs[k].map(p => [cx + (p[0] - cx) * kk, cy + (p[1] - cy) * kk]), 'chalk', q.rim, { w: q.rimW * rr(0.8, 1.15), p: rr(0.62, 0.96), tin: 0.18, tout: 0.25 });
      if (A.chance(q.echo)) {
        const k2 = rr(0.83, 0.88), in2 = arcs[k].slice(1, -1).map(p => [cx + (p[0] - cx) * k2, cy + (p[1] - cy) * k2]);
        if (in2.length > 2) { if (A.chance(q.gold)) A.stroke(in2, 'gold', 'gold', { w: rr(1.1, 1.6), p: 0.85 }); else A.stroke(in2, 'pencil', A.pick(q.streaks), { w: 1.0, p: rr(0.45, 0.7) }); }
      }
    }
    return blob;
  }

  /* --------------------------------------------------------------------------
     M.cloudMass(A, boundary, o)
     boundary : rough closed polygon (logical units). The scallops reach about
                one curl beyond it on free sides.
     o        : c (body 'storm'), deep (curls 'neel'), edge (rim 'khadi'),
                curl (radius of a curl, 26-46, default 36), density (1),
                flat ['top'|'left'|'right'|'bottom'] sides cut straight at the bbox,
                lead 'left'|'right'|'none' side that breaks like surf, spray (stray curls ahead, 5),
                gold (0..1 share of gold echo arcs, 0.3)
     returns  : { belly:[[x,y]..] lower edge left to right, lead:[[x,y]..], bbox:[x0,y0,x1,y1] }
     ------------------------------------------------------------------------ */
  M.cloudMass = function (A, boundary, o) {
    o = o || {};
    const rr = A.rr, R = o.curl || 36, dens = o.density != null ? o.density : 1;
    const cBase = o.c || 'storm', cDeep = o.deep || 'neel', cRim = o.edge || 'khadi';
    const flat = o.flat || [], lead = o.lead || 'left', gold = o.gold != null ? o.gold : 0.3;
    const bb = A.bbox([boundary]), pad = R * 2.6, eps = 2.5, isFlat = s => flat.indexOf(s) >= 0;
    const rx0 = isFlat('left') ? bb[0] : bb[0] - pad, ry0 = isFlat('top') ? bb[1] : bb[1] - pad;
    const rx1 = isFlat('right') ? bb[2] : bb[2] + pad, ry1 = isFlat('bottom') ? bb[3] : bb[3] + pad;
    const raw = boundary.map(p => {
      let x = p[0], y = p[1];
      if (isFlat('top') && y < bb[1] + eps) y -= pad; if (isFlat('bottom') && y > bb[3] - eps) y += pad;
      if (isFlat('left') && x < bb[0] + eps) x -= pad; if (isFlat('right') && x > bb[2] - eps) x += pad;
      return [x, y];
    });
    const bnd = A.resample(A.spline(raw, true, 4), 4, true), n = bnd.length;
    const H = bb[3] - bb[1], W = bb[2] - bb[0];
    A.pushMask([A.rect(rx0, ry0, rx1 - rx0, ry1 - ry0)], 0);

    // 1. the wet body of the cloud, laid with the side of the stick
    A.fill([bnd], 'side', cBase, { w: 30, p: 1, reach: 1.6, passes: 2, turn: 0.8, ang: -0.2, cv: 0.03 });
    A.pushMask([bnd]);
    for (let i = 0, k = Math.round(W * H / 5200); i < k; i++) {             // heavier and darker where the rain is held
      const x = rr(bb[0], bb[2]), y = bb[1] + H * Math.pow(A.rnd(), 1.5) * 0.8, L = rr(70, 190), sl = rr(-0.12, 0.12);
      A.stroke([[x - L / 2, y - sl * L / 2], [x, y + rr(-5, 5)], [x + L / 2, y + sl * L / 2]], 'side', A.pick([cDeep, cDeep, 'night']), { w: rr(16, 30), p: rr(0.45, 0.8) });
    }
    for (let i = 0, k = Math.round(W * H / 3300); i < k; i++) {             // pale wet streaks, a blush of mauve
      const x = rr(bb[0], bb[2]), y = rr(bb[1], bb[3]), L = rr(40, 130), sl = rr(-0.25, 0.1);
      A.stroke([[x - L / 2, y - sl * L / 2], [x, y + rr(-4, 4)], [x + L / 2, y + sl * L / 2]], 'side', A.pick(['slate', 'sky', 'slate', 'lapis', 'plum', 'ice', 'mauve', 'lapis']), { w: rr(5, 13), p: rr(0.28, 0.6) });
    }
    A.popMask();

    const ld = lead === 'right' ? -1 : 1;                                    // turning sense of the curls
    const puffColour = y => {
      const v = clamp((y - bb[1]) / H, 0, 1);
      let c = A.mix('night', cDeep, clamp(0.25 + v * 1.1, 0, 1));
      if (A.chance(0.22)) c = A.mix(c, 'lapis', rr(0.12, 0.3));
      return c;
    };
    // 2. curls all through the mass
    const near = p => p[0] > rx0 - R && p[0] < rx1 + R && p[1] > ry0 - R && p[1] < ry1 + R;
    const inner = A.scatter([bnd], R * 1.62 / Math.sqrt(dens), { jit: 0.4 }).filter(near).map(p => ({ p, k: p[1] + rr(-R, R) }));
    inner.sort((a, b) => a.k - b.k);
    for (const it of inner) {
      const p = it.p, dir = A.chance(0.82) ? ld : -ld, sz = R * (0.58 + 0.72 * Math.pow(A.rnd(), 1.4)), deep = puffColour(p[1]);
      const shadow = A.noise2(p[0] / 170 + 3.1, p[1] / 120 + 7.7, 51) < 0.43;
      const streaks = shadow ? ['lapis', 'slate', 'storm', 'sky'] : ['sky', 'slate', 'ice', 'sky', 'aqua'], rim = shadow ? A.mix('lapis', 'sky', rr(0.15, 0.45)) : A.mix('ice', 'sky', rr(0, 0.6));
      // filler lobes behind, so the curls gather into heads of cloud
      for (let k = 0, nk = A.rnd() < 0.35 ? 0 : A.rnd() < 0.7 ? 1 : 2; k < nk; k++) {
        const a = rr(0, TAU), d = sz * rr(0.75, 1.05);
        drawPuff(A, p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d * 0.85, sz * rr(0.42, 0.66), { plain: true, thin: true, m: 0, dir: 1, deep: A.mix(deep, 'night', rr(0, 0.3)), streaks, rim, rimW: rr(1.0, 1.4), skip: 0.2, echo: 0.25, gold, light: A.chance(0.4) ? 'lapis' : null });
      }
      drawPuff(A, p[0], p[1], sz, {
        thin: true, m: (ld > 0 ? 2.4 : 0.75) + A.gauss() * 0.8, dir, deep, hollow: shadow ? A.mix('lapis', deep, rr(0.35, 0.65)) : A.mix('lapis', cBase, rr(0.1, 0.6)),
        streaks, rim, rim2: shadow ? 'lapis' : 'sky', rimW: shadow ? rr(1.0, 1.3) : rr(1.2, 1.6), skip: shadow ? 0.3 : 0.14, echo: 0.3, gold: shadow ? gold * 0.5 : gold,
        light: A.chance(0.6) ? A.pick(['lapis', 'storm', 'plum']) : null
      });
    }

    // 3. the free edges: a row of curls that makes the scalloped silhouette
    const sgn = orient(A, bnd), edge = [], belly = [], leadPts = [];
    const inRect = p => p[0] > rx0 + 1 && p[0] < rx1 - 1 && p[1] > ry0 + 1 && p[1] < ry1 - 1;
    let acc = 0, next = 0, lastB = -1e9;
    for (let i = 0; i < n; i++) {
      const p = bnd[i], a = bnd[(i - 1 + n) % n], b = bnd[(i + 1) % n];
      acc += Math.hypot(p[0] - a[0], p[1] - a[1]);
      if (!inRect(p)) continue;
      const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = sgn * ty / l, ny = -sgn * tx / l;
      const isLead = lead !== 'none' && nx * -ld > 0.35;
      if (ny > 0.3 && Math.abs(acc - lastB) > 11) { belly.push([p[0] + nx * R * 0.55, p[1] + ny * R * 0.55]); lastB = acc; }
      if (isLead) leadPts.push([p[0] + nx * R * 0.8, p[1] + ny * R * 0.8]);
      if (acc >= next) { edge.push({ x: p[0], y: p[1], nx, ny, isLead }); next = acc + R * (isLead ? rr(0.95, 1.25) : rr(1.0, 1.4)); }
    }
    let lastBig = -9;
    edge.forEach((e, i) => { if (e.isLead && i - lastBig > 2 && A.chance(0.34)) { e.big = true; lastBig = i; } });
    const order = edge.filter(e => !e.isLead).concat(edge.filter(e => e.isLead && !e.big).sort((a, b) => b.y - a.y), edge.filter(e => e.big).sort((a, b) => b.y - a.y));
    for (const e of order) {
      const sz = R * (e.big ? rr(1.45, 1.8) : e.isLead ? rr(0.95, 1.3) : e.ny > 0.3 ? rr(0.82, 1.12) : rr(0.7, 1.0));
      const nAng = Math.atan2(e.ny, e.nx), dir = e.isLead || A.chance(0.8) ? ld : -ld;
      const push = e.big ? rr(-0.3, -0.05) : e.isLead ? rr(-0.22, 0.3) : 0.22;        // how far the curl sits back from the edge
      const cx = e.x - e.nx * sz * push, cy = e.y - e.ny * sz * push;
      drawPuff(A, cx, cy, sz, e.big ? {
        m: nAng - dir * rr(0.7, 1.0), dir, deep: puffColour(cy), hollow: A.mix('lapis', 'sky', rr(0.25, 0.5)), turns: rr(1.15, 1.32), hw: rr(0.25, 0.32),
        streaks: ['ice', 'khadi', 'sky', 'khadi'], rim: cRim, rim2: 'ice', rimW: rr(2.3, 2.8), skip: 0.02, echo: 0.7, gold: Math.min(1, gold * 2), light: 'lapis'
      } : e.isLead ? {
        m: nAng - dir * rr(0.6, 1.0), dir, deep: puffColour(cy), hollow: A.mix('lapis', 'sky', rr(0.05, 0.3)), turns: rr(1.0, 1.25), hw: rr(0.22, 0.3),
        streaks: ['ice', 'khadi', 'sky', 'ice'], rim: cRim, rim2: 'ice', rimW: rr(1.9, 2.4), skip: 0.03, echo: 0.55, gold: Math.min(1, gold * 1.8), light: 'lapis'
      } : {
        m: nAng - dir * rr(0.3, 1.2), dir, deep: puffColour(cy), hollow: A.mix('lapis', cBase, rr(0, 0.4)),
        streaks: ['sky', 'ice', 'slate', 'sky'], rim: A.mix(cRim, 'ice', rr(0, 0.5)), rim2: 'sky', rimW: rr(1.5, 1.9), skip: 0.07, echo: 0.4, gold, light: A.chance(0.6) ? 'lapis' : null
      });
    }
    // 4. stray curls running ahead of the front
    const nSpray = o.spray != null ? o.spray : 5, leads = edge.filter(e => e.isLead);
    for (let k = 0; k < nSpray && leads.length; k++) {
      const e = A.pick(leads), d = R * rr(1.7, 2.5), sz = R * rr(0.3, 0.5);
      const cx = e.x + e.nx * d + rr(-8, 8), cy = e.y + e.ny * d + rr(-R, R) * 0.8;
      if (cx - sz < rx0 + 2 || cx + sz > rx1 - 2 || cy - sz < ry0 + 2 || cy + sz > ry1 - 2) continue;
      drawPuff(A, cx, cy, sz, { m: Math.atan2(e.ny, e.nx) - ld * rr(0.5, 1.1), dir: ld, deep: A.mix(cDeep, cBase, rr(0, 0.5)), hollow: A.mix('lapis', 'sky', 0.4), turns: rr(0.8, 1.0), streaks: ['ice', 'sky'], rim: cRim, rimW: rr(1.2, 1.6), skip: 0.05, echo: 0, gold: 0, light: null });
    }
    A.popMask();
    belly.sort((a, b) => a[0] - b[0]);
    return { belly, lead: leadPts, bbox: [rx0, ry0, rx1, ry1] };
  };

  /* --------------------------------------------------------------------------
     M.cloudBand(A, pts, w, o)
     pts : polyline the band follows;  w : thickness.
     o   : kind 'scallop' (default) | 'streak';  side 'both'|'top'|'bottom' (which edge is scalloped),
           c (body), rim (edge chalk), shade (pencil colour of the modelling), n (streak count)
     ------------------------------------------------------------------------ */
  M.cloudBand = function (A, pts, w, o) {
    o = o || {};
    const rr = A.rr;
    const path = A.resample(A.spline(pts, false, 3), 2, false), nrm = normals(path), n = path.length;
    if (o.kind === 'streak') {
      const k = o.n || 4, c = o.c || 'khadi';
      for (let j = 0; j < k; j++) {
        const u0 = rr(0, 0.35), u1 = rr(0.6, 1), off = (j / Math.max(1, k - 1) - 0.5) * w + rr(-0.12, 0.12) * w, bow = rr(-0.25, 0.25) * w;
        const ia = Math.floor(u0 * (n - 1)), ib = Math.floor(u1 * (n - 1)), line = [];
        for (let i = ia; i <= ib; i += 3) { const t = (i - ia) / Math.max(1, ib - ia), d = off + bow * Math.sin(Math.PI * t); line.push([path[i][0] + nrm[i][0] * d, path[i][1] + nrm[i][1] * d, 0.55 + 0.45 * Math.sin(Math.PI * t)]); }
        if (line.length < 3) continue;
        A.stroke(line, 'pastel', c, { w: rr(0.28, 0.6) * w, p: rr(0.5, 0.8), tin: 0.3, tout: 0.4, reach: 1.25 });
        A.stroke(line.slice(Math.floor(line.length * rr(0.1, 0.3)), Math.floor(line.length * rr(0.6, 0.9))).map(p => [p[0], p[1] - rr(0.5, 1.5)]), 'chalk', o.rim || 'khadi', { w: rr(1.2, 2.2), p: rr(0.7, 0.95), tin: 0.3, tout: 0.4 });
        if (A.chance(0.7)) A.stroke(line.slice(Math.floor(line.length * 0.2), Math.floor(line.length * 0.8)).map(p => [p[0] + rr(-6, 6), p[1] + w * rr(0.12, 0.2)]), 'shade', o.shade || 'saffron', { w: rr(1.4, 2.6), p: rr(0.3, 0.5) });
      }
      return;
    }
    const side = o.side || 'both', c = o.c || A.mix('ice', 'sky', 0.45), rim = o.rim || 'khadi';
    let total = 0; const sAt = [0];
    for (let i = 1; i < n; i++) { total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); sAt.push(total); }
    const mkEdge = (scal, sign) => {            // one edge of the band, cut into lobes
      const bumps = []; let s = 0;
      while (s < total) { const L = w * (scal ? rr(0.7, 1.35) : rr(1.6, 3)); bumps.push([s, Math.min(total, s + L), scal ? rr(0.32, 0.5) : rr(0.08, 0.16)]); s += L; }
      const edge = [], arcs = []; let b = 0, arc = [];
      for (let i = 0; i < n; i++) {
        while (b < bumps.length - 1 && sAt[i] > bumps[b][1]) { arcs.push(arc); arc = []; b++; }
        const u = clamp((sAt[i] - bumps[b][0]) / Math.max(1e-6, bumps[b][1] - bumps[b][0]), 0, 1);
        const env = Math.pow(Math.sin(Math.PI * clamp(sAt[i] / total, 0.02, 0.98)), 0.45);
        const d = sign * w * 0.5 * env * (1 - bumps[b][2] + bumps[b][2] * Math.pow(Math.sin(Math.PI * u), 0.55)) * (0.85 + 0.3 * A.noise1(sAt[i] / (w * 3) + sign * 7, 9));
        const p = [path[i][0] + nrm[i][0] * d, path[i][1] + nrm[i][1] * d];
        edge.push(p); arc.push(p);
      }
      arcs.push(arc);
      return { edge, arcs };
    };
    const top = mkEdge(side !== 'bottom', -1), bot = mkEdge(side !== 'top', 1);
    const poly = top.edge.concat(bot.edge.slice().reverse());
    A.fill([poly], 'pastel', c, { w: Math.max(4, w * 0.3), p: 1, reach: 1.6, passes: 2, ang: Math.atan2(path[n - 1][1] - path[0][1], path[n - 1][0] - path[0][0]) + rr(-0.2, 0.2), turn: 0.3 });
    A.pushMask([poly]);
    for (let j = 0, k = Math.round(total / 26); j < k; j++) {               // streaks drawn along the band
      const ia = Math.floor(rr(0, 0.8) * (n - 1)), ib = Math.min(n - 1, ia + Math.floor(rr(20, 60))), f = rr(-0.3, 0.4) * w, line = [];
      for (let i = ia; i <= ib; i += 3) line.push([path[i][0] + nrm[i][0] * f, path[i][1] + nrm[i][1] * f]);
      if (line.length > 2) A.stroke(line, A.chance(0.5) ? 'shade' : 'chalk', A.pick([o.shade || 'slate', 'sky', 'khadi', 'sky', o.shade || 'slate']), { w: rr(1.2, 3), p: rr(0.35, 0.7) });
    }
    // shadow rubbed in under each lobe of the lower edge
    for (const a of bot.arcs) if (a.length > 4) A.stroke(a.map(p => [p[0], p[1] - w * 0.13]), 'shade', o.shade || 'slate', { w: w * 0.2, p: rr(0.5, 0.8) });
    for (const a of top.arcs) if (a.length > 4 && A.chance(0.8)) A.stroke(a.map(p => [p[0], p[1] + w * 0.14]), 'pastel', 'khadi', { w: w * 0.16, p: rr(0.5, 0.8), tin: 0.3, tout: 0.3 });
    A.popMask();
    const rimArcs = (set, scal) => { for (const a of set.arcs) { if (a.length < 3 || A.chance(scal ? 0.05 : 0.35)) continue; A.stroke(a, 'chalk', rim, { w: rr(1.2, 1.9) * (scal ? 1 : 0.7), p: rr(0.65, 0.95), tin: 0.2, tout: 0.25 }); } };
    rimArcs(top, side !== 'bottom'); rimArcs(bot, side !== 'top');
  };

  /* --------------------------------------------------------------------------
     M.lightning(A, pts, o)
     pts : 2-6 control points, from the root in the cloud to the tip.
     o   : w (6.5 ribbon width at the root), amp (11 wriggle), wave (44 length of one wriggle),
           forks (0 side branches), glow (true), glowTo (0.72 share of the length that glows),
           coil (true: the root curls like a tail; 1 / -1 picks the turning sense; false = none),
           tongue (true forked tip), core ('sindoor')
     returns { pts: wriggled centre line, tip:[x,y] }
     ------------------------------------------------------------------------ */
  M.lightning = function (A, pts, o) {
    o = o || {};
    const rr = A.rr, w = o.w || 7.5, amp = o.amp != null ? o.amp : 12, wl = o.wave || 46, core = o.core || 'sindoor';
    const base = A.resample(A.spline(pts, false, 3), 2, false), nrm = normals(base);
    let n = base.length;
    if (n < 4) return { pts: base, tip: base[n - 1] };
    const s1 = rr(0, 900), s2 = rr(0, 900), cen = [], peaks = [];
    let s = 0, ph = rr(0, TAU), prev = 0;
    for (let i = 0; i < n; i++) {
      if (i) s += Math.hypot(base[i][0] - base[i - 1][0], base[i][1] - base[i - 1][1]);
      const u = i / (n - 1);
      ph += i ? 2 * TAU / (wl * (0.5 + 1.05 * A.noise1(s / 60 + s1, 4))) : 0;
      const env = Math.min(1, 0.35 + u * 5) * (1 - 0.55 * Math.pow(u, 2.2));
      const off = Math.sin(ph) * amp * (0.4 + 1.15 * A.noise1(s / 80 + s2, 5)) * env;
      const sn = Math.sin(ph);
      if (i > 1 && Math.abs(sn) < Math.abs(prev) && Math.abs(prev) > 0.985 && (!peaks.length || i - peaks[peaks.length - 1][0] > 4)) peaks.push([i - 1, prev > 0 ? 1 : -1]);
      prev = sn;
      cen.push([base[i][0] + nrm[i][0] * off, base[i][1] + nrm[i][1] * off]);
    }
    // the root curls on itself like the tail of a snake
    if (o.coil !== false && o.coil !== 0) {
      const t0 = [cen[1][0] - cen[0][0], cen[1][1] - cen[0][1]], sgc = o.coil === -1 || (o.coil !== 1 && A.chance(0.5)) ? -1 : 1;
      let a = Math.atan2(-t0[1], -t0[0]), x = cen[0][0], y = cen[0][1], rad = w * rr(2.3, 2.9), turned = 0; const coil = [], want = TAU * rr(0.95, 1.2);
      while (turned < want) { x += Math.cos(a) * 2; y += Math.sin(a) * 2; coil.push([x, y]); const da = 2 / rad; a += sgc * da; turned += da; rad = Math.max(w * 0.85, rad * 0.985); }
      coil.reverse(); for (const pk of peaks) pk[0] += coil.length;
      cen.unshift(...coil); n = cen.length;
    }
    const cn = normals(cen);
    // a warm breath on the cloud around the bolt
    if (o.glow !== false) {
      const gl = cen.filter((p, i) => i % 3 === 0 && i < n * (o.glowTo != null ? o.glowTo : 0.72));
      if (gl.length > 2) {
        A.stroke(gl, 'side', 'saffron', { w: w * 2.7, p: 0.15, reach: 0.8, wob: 0.5, hard: 1.2, tout: 0.4 });
        A.stroke(gl, 'pastel', 'haldi', { w: w * 1.8, p: 0.2, reach: 0.85, wob: 0.5, hard: 1.2, tout: 0.4 });
      }
    }
    // the ribbon: drawn in four pulls, each thinner than the last
    const cuts = [0, 0.3, 0.56, 0.8, 1], ws = [1, 0.86, 0.68, 0.48];
    for (let k = 0; k < 4; k++) {
      const ia = Math.max(0, Math.floor(cuts[k] * (n - 1)) - 3), ib = Math.min(n - 1, Math.floor(cuts[k + 1] * (n - 1)) + 3), seg = cen.slice(ia, ib + 1);
      A.stroke(seg, 'chalk', core, { w: w * ws[k] * 1.55, p: 0.98, reach: 1.5, tin: k ? 0 : 0.08, tout: k === 3 ? 0.3 : 0, wob: 0.35 });
    }
    for (let k = 0; k < 4; k++) {
      const ia = Math.max(0, Math.floor(cuts[k] * (n - 1)) - 3), ib = Math.min(n - 1, Math.floor(cuts[k + 1] * (n - 1)) + 3), seg = cen.slice(ia, ib + 1);
      A.stroke(seg, 'gold', 'gold', { w: w * ws[k], p: 0.95, tin: k ? 0 : 0.08, tout: k === 3 ? 0.35 : 0, wob: 0.35 });
    }
    // pale heat inside the gold
    A.stroke(cen.slice(2, Math.floor(n * 0.86)), 'chalk', 'cream', { w: Math.max(1.2, w * 0.36), p: 0.9, tin: 0.06, tout: 0.5, wob: 0.3 });
    // white heat down the middle, in broken touches
    let i = Math.floor(rr(2, 8));
    while (i < n * 0.9) {
      const L = Math.floor(rr(6, 18)), seg = cen.slice(i, Math.min(n, i + L)), d = rr(-0.18, 0.18) * w;
      if (seg.length > 2) A.stroke(seg.map((p, j) => [p[0] + cn[Math.min(n - 1, i + j)][0] * d, p[1] + cn[Math.min(n - 1, i + j)][1] * d]), 'chalk', 'khadi', { w: Math.max(1, w * 0.27 * (1 - 0.5 * i / n)), p: rr(0.8, 1), tin: 0.25, tout: 0.3 });
      i += L + Math.floor(rr(3, 12));
    }
    // sparks thrown off the outside of each bend
    for (const pk of peaks) {
      const p = cen[pk[0]], nn = cn[pk[0]], u = pk[0] / (n - 1), k = A.ri(1, 3);
      for (let j = 0; j < k; j++) {
        const a = Math.atan2(nn[1] * pk[1], nn[0] * pk[1]) + rr(-0.75, 0.75), r0 = w * (0.95 - 0.3 * u) + rr(0, 2), L = rr(2.5, 6.5) * (1 - 0.4 * u);
        const c = A.pick(['khadi', 'haldi', 'sindoor', 'khadi']);
        if (A.chance(0.3)) A.dot(p[0] + Math.cos(a) * (r0 + L), p[1] + Math.sin(a) * (r0 + L), 'chalk', c, { w: rr(1.1, 1.8), p: 0.85 });
        else A.stroke([[p[0] + Math.cos(a) * r0, p[1] + Math.sin(a) * r0], [p[0] + Math.cos(a) * (r0 + L), p[1] + Math.sin(a) * (r0 + L)]], 'chalk', c, { w: rr(0.9, 1.5), p: rr(0.6, 0.9), tin: 0.1, tout: 0.5 });
      }
    }
    // forked tongue
    const tip = cen[n - 1], tn = cn[n - 1];
    if (o.tongue !== false) {
      for (const sg of [-1, 1]) {
        const a = Math.atan2(tn[3], tn[2]) + sg * rr(0.32, 0.6), L = w * rr(2.0, 3.4), bend = sg * rr(0.15, 0.4);
        const t2 = [[tip[0] - tn[2] * 2, tip[1] - tn[3] * 2], [tip[0] + Math.cos(a) * L * 0.5, tip[1] + Math.sin(a) * L * 0.5], [tip[0] + Math.cos(a + bend) * L, tip[1] + Math.sin(a + bend) * L]];
        const tp = A.spline(t2, false, 1.5);
        A.stroke(tp, 'chalk', core, { w: w * 0.5, p: 0.9, tin: 0, tout: 0.5 });
        A.stroke(tp, 'gold', 'gold', { w: w * 0.3, p: 0.9, tin: 0, tout: 0.5 });
      }
    }
    // side branches
    for (let f = 0; f < (o.forks || 0); f++) {
      const i0 = Math.floor(rr(0.22, 0.78) * (n - 1)), p = cen[i0], t = cn[i0], sg = A.chance(0.5) ? 1 : -1;
      const a = Math.atan2(t[3], t[2]) + sg * rr(0.55, 1.0), L = rr(55, 115) * (w / 6.5);
      M.lightning(A, [p, [p[0] + Math.cos(a) * L * 0.5 + rr(-8, 8), p[1] + Math.sin(a) * L * 0.5 + rr(-8, 8)], [p[0] + Math.cos(a - sg * 0.3) * L, p[1] + Math.sin(a - sg * 0.3) * L]],
        { w: w * rr(0.45, 0.6), amp: amp * 0.6, wave: wl * 0.7, forks: 0, glow: false, coil: false, core });
    }
    return { pts: cen, tip };
  };

  /* --------------------------------------------------------------------------
     M.rain(A, polygon, o)   strings of dashes and pearls, clipped to the polygon.
     o : slant (dx per dy, -0.22), density (1), c (colour or list), fade (0.5 thinning with depth),
         w (1.15 width of a dash), dash (7.5 length)
     ------------------------------------------------------------------------ */
  M.rain = function (A, poly, o) {
    o = o || {};
    const rr = A.rr, slant = o.slant != null ? o.slant : -0.22, dens = o.density || 1, fade = o.fade != null ? o.fade : 0.5;
    const cols = Array.isArray(o.c) && typeof o.c[0] === 'string' ? o.c : o.c ? [o.c] : ['khadi', 'khadi', 'ice', 'khadi', 'sky'];
    const bb = A.bbox([poly]), H = bb[3] - bb[1], gap = 17 / dens, ww = o.w || 1.15, dl = o.dash || 7.5, lean = Math.abs(slant) * H + 12;
    A.pushMask([poly]);
    for (let x = bb[0] - lean; x < bb[2] + lean; x += gap * rr(0.55, 1.45)) {
      let y = bb[1] + (A.chance(0.7) ? rr(-10, 14) : rr(0, H * 0.5));
      const sl = slant + rr(-0.03, 0.03), c = A.pick(cols), press = rr(0.8, 1.12), pearls = A.chance(0.16);
      let xx = x + (y - bb[1]) * sl, run = A.ri(5, 14);
      while (y < bb[3]) {
        const depth = clamp((y - bb[1]) / H, 0, 1), len = pearls ? 1.2 : dl * rr(0.7, 1.3) * (1 - 0.2 * depth);
        let step;
        if (run > 0) {
          const pp = press * (1 - fade * 0.6 * depth);
          if (pearls || A.chance(0.1)) A.dot(xx, y, 'chalk', c, { w: ww * rr(1.5, 2.2), p: 0.85 * pp, len: 0.35 });
          else A.stroke([[xx, y], [xx + sl * len, y + len]], 'chalk', c, { w: ww * rr(0.85, 1.25), p: rr(0.62, 0.95) * pp, tin: 0.15, tout: 0.35, wob: 0.4 });
          run--; step = len + rr(2.6, 5.2) * (pearls ? 1.5 : 1) * (1 + 0.5 * depth);
        } else {
          if (A.rnd() < fade * (0.25 + 0.6 * depth)) break;                 // the string gives out
          step = rr(16, 48) * (1 + depth); run = A.ri(3, Math.round(12 - 6 * depth * fade));
        }
        y += step; xx += sl * step;
      }
    }
    A.popMask();
  };

  /* M.rainFrom(A, belly, yBottom, o) - rain under a cloud: belly = the points M.cloudMass returns.
     Same options as M.rain; o.inset trims that many units off both ends of the belly (default 0). */
  M.rainFrom = function (A, belly, yBottom, o) {
    o = o || {};
    const slant = o.slant != null ? o.slant : -0.22, b = belly.filter(p => p[1] < yBottom);
    if (b.length < 2) return;
    const x0 = b[0][0] + (o.inset || 0), x1 = b[b.length - 1][0] - (o.inset || 0), top = b.filter(p => p[0] >= x0 && p[0] <= x1);
    if (top.length < 2) return;
    const first = top[0], last = top[top.length - 1];
    M.rain(A, top.concat([[last[0] + slant * (yBottom - last[1]), yBottom], [first[0] + slant * (yBottom - first[1]), yBottom]]), o);
  };

  /* --------------------------------------------------------------------------
     M.stars(A, polygon, o)
     o : spacing (30), milky (true: a faint drift of star dust), c ('khadi'), gold (0.04 share of gold stars)
     ------------------------------------------------------------------------ */
  M.stars = function (A, poly, o) {
    o = o || {};
    const rr = A.rr, sp = o.spacing || 26, c = o.c || 'khadi', bb = A.bbox([poly]), W = bb[2] - bb[0], H = bb[3] - bb[1];
    A.pushMask([poly]);
    if (o.milky !== false) {
      const y0 = bb[1] + H * rr(0.62, 0.8), y1 = bb[1] + H * rr(0.12, 0.3);
      const drift = A.spline([[bb[0] - 20, y0], [bb[0] + W * 0.3, lerp(y0, y1, 0.3) + rr(-0.08, 0.08) * H], [bb[0] + W * 0.65, lerp(y0, y1, 0.7) + rr(-0.08, 0.08) * H], [bb[2] + 20, y1]], false, 6);
      for (let k = 0; k < 3; k++) A.stroke(drift.map(p => [p[0], p[1] + rr(-10, 10) + (k - 1) * H * 0.045]), 'side', A.pick(['storm', 'lapis', 'plum']), { w: H * rr(0.08, 0.13), p: rr(0.11, 0.17), reach: 0.8, wob: 2, hard: 1.3 });
      for (let k = 0, m = Math.round(W / 2.2); k < m; k++) {
        const p = drift[Math.floor(A.rnd() * drift.length)], d = A.gauss() * H * 0.06;
        A.dot(p[0] + rr(-8, 8), p[1] + d, 'chalk', A.pick([c, 'ice', 'sky']), { w: rr(0.7, 1.2), p: rr(0.35, 0.75), len: 0.25 });
      }
    }
    for (const p of A.scatter([poly], sp, { jit: 0.5 })) {
      if (A.noise2(p[0] / 140, p[1] / 110, 41) < 0.27 || A.chance(0.1)) continue;      // the sky is not evenly sown
      const k = A.rnd(), x = p[0], y = p[1];
      if (k < 0.6) A.dot(x, y, 'chalk', A.pick([c, c, 'ice']), { w: rr(1.4, 2.3), p: rr(0.7, 1), len: 0.35 });
      else if (k < 0.85) A.dot(x, y, 'chalk', A.pick([c, 'cream', c]), { w: rr(2.2, 3.1), p: rr(0.8, 1), len: 0.5 });
      else if (k < 1 - (o.gold != null ? o.gold : 0.04)) {
        const a = rr(-0.25, 0.25), L1 = rr(4.5, 7.5), L2 = L1 * rr(0.5, 0.75);
        A.stroke([[x - Math.sin(a) * L1, y - Math.cos(a) * L1], [x, y], [x + Math.sin(a) * L1, y + Math.cos(a) * L1]], 'chalk', c, { w: 1.3, p: 0.9, tin: 0.45, tout: 0.45, t0: 0.15, wob: 0.2 });
        A.stroke([[x - Math.cos(a) * L2, y + Math.sin(a) * L2], [x, y], [x + Math.cos(a) * L2, y - Math.sin(a) * L2]], 'chalk', c, { w: 1.2, p: 0.9, tin: 0.45, tout: 0.45, t0: 0.15, wob: 0.2 });
        A.dot(x, y, 'chalk', c, { w: rr(2.0, 2.6), p: 1, len: 0.4 });
      } else {
        A.dot(x, y, 'gold', 'gold', { w: rr(2.6, 3.4), len: 0.5 });
        A.dot(x + rr(-0.4, 0.4), y - 0.4, 'chalk', c, { w: 1.1, p: 0.9, len: 0.25 });
      }
    }
    A.popMask();
  };

  /* --------------------------------------------------------------------------
     M.moon(A, x, y, r, o)   a crescent with a halo.
     o : tilt (angle the horns open toward, -0.55), phase (0.2 thin .. 0.6 fat, default 0.4),
         c ('khadi'), halo (true)
     ------------------------------------------------------------------------ */
  M.moon = function (A, x, y, r, o) {
    o = o || {};
    const rr = A.rr, tilt = o.tilt != null ? o.tilt : -0.55, c = o.c || 'khadi';
    const d = r * (o.phase != null ? o.phase : 0.4) * 1.5, r2 = r * 0.97, cxi = x + Math.cos(tilt) * d, cyi = y + Math.sin(tilt) * d;
    const beta = Math.acos(clamp((d * d + r * r - r2 * r2) / (2 * d * r), -1, 1));
    if (o.halo !== false) {
      // cold light rubbed on the night in loose rings, then two fine rings
      const rings = [[1.32, 0.36, 'slate'], [1.62, 0.3, 'lapis'], [1.95, 0.22, 'lapis'], [2.3, 0.13, 'storm']];
      for (const g of rings) { const a0 = rr(0, TAU); A.stroke(A.ellipse(x + rr(-1, 1), y + rr(-1, 1), r * g[0], r * g[0] * rr(0.96, 1.02), rr(0, 3), a0, a0 + TAU * 1.04), 'side', g[2], { w: r * 0.52, p: g[1], reach: 0.85, hard: 1.15, wob: 1.6, tin: 0.1, tout: 0.1 }); }
      A.outline(A.ellipse(x + rr(-1, 1), y + rr(-1, 1), r * 1.74, r * 1.7, rr(0, 3)), 'chalk', 'sky', { closed: true, w: 0.9, p: 0.62, pull: 34, again: 0.1 });
      for (const q of A.along(A.ellipse(x, y, r * 2.32, r * 2.26, rr(0, 3)), rr(8.5, 10.5), 0.7)) if (A.chance(0.9)) A.dot(q.x, q.y, 'chalk', A.chance(0.8) ? 'ice' : 'khadi', { w: rr(1.7, 2.4), p: rr(0.8, 1), len: 0.45 });
    }
    // crescent
    const pts = [];
    const nA = 40; for (let i = 0; i <= nA; i++) { const a = tilt + beta + (TAU - 2 * beta) * i / nA; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
    const pm = pts[pts.length - 1], pp = pts[0];
    const d0 = wrap(Math.atan2(pm[1] - cyi, pm[0] - cxi) - (tilt + Math.PI)), d1 = wrap(Math.atan2(pp[1] - cyi, pp[0] - cxi) - (tilt + Math.PI));
    const innerArc = [];
    for (let i = 1; i < nA; i++) { const a = tilt + Math.PI + lerp(d0, d1, i / nA); innerArc.push([cxi + Math.cos(a) * r2, cyi + Math.sin(a) * r2]); }
    const cres = pts.concat(innerArc);
    A.fill([cres], 'pastel', c, { w: Math.max(3, r * 0.2), p: 1, reach: 1.7, passes: 3, ang: tilt + 1.2, turn: 0.5, cv: 0.01 });
    A.withMask([cres], () => {
      A.stroke(innerArc.map(p => [p[0] - Math.cos(tilt) * r * 0.07, p[1] - Math.sin(tilt) * r * 0.07]), 'shade', 'cream', { w: r * 0.18, p: 0.5 });
      for (let k = 0; k < 4; k++) {                                         // a few pencil craters
        const a = tilt + Math.PI + rr(-1.1, 1.1), rad = r * rr(0.62, 0.86), px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad, cr = r * rr(0.05, 0.1);
        A.stroke(A.ellipse(px, py, cr, cr * rr(0.6, 0.9), rr(0, 3), rr(0, 2), rr(3.5, 5.5)), 'shade', 'slate', { w: 1, p: rr(0.3, 0.5) });
      }
    });
    A.stroke(innerArc, 'pencil', 'slate', { w: 0.9, p: 0.5 });
    A.outline(pts.map(p => [p[0] + 0.4, p[1] + 0.3]), 'pencil', 'slate', { w: 0.8, p: 0.4, pull: 30, again: 0 });
    // the dark of the moon held in the crescent's arms
    const dark = []; for (let i = 0; i <= 24; i++) { const a = tilt - beta * 0.9 + 2 * beta * 0.9 * i / 24; dark.push([x + Math.cos(a) * r * 0.99, y + Math.sin(a) * r * 0.99]); }
    A.stroke(dark, 'shade', 'slate', { w: 0.9, p: 0.34 });
  };

  /* --------------------------------------------------------------------------
     M.sun(A, x, y, r, o)   a small fierce sun (no face).
     o : rays (count, default about 32), c (disc 'cream'), heat (true: pale ring rubbed on the sky)
     ------------------------------------------------------------------------ */
  M.sun = function (A, x, y, r, o) {
    o = o || {};
    const rr = A.rr;
    if (o.heat !== false) {
      // heat rubbed outward from the disc with the side of a pale stick
      for (let i = 0, nh = 54; i < nh; i++) {
        const a = rr(0, TAU), ca = Math.cos(a), sa = Math.sin(a), r0 = r * rr(0.9, 1.2), r1 = r * (1.55 + 1.5 * Math.pow(A.rnd(), 1.8));
        A.stroke([[x + ca * r0, y + sa * r0, 1], [x + ca * (r0 + r1) / 2, y + sa * (r0 + r1) / 2, 0.7], [x + ca * r1, y + sa * r1, 0.3]], 'side', A.pick(['cream', 'cream', 'khadi', 'haldi']), { w: rr(7, 13), p: rr(0.36, 0.6), reach: 0.95, tin: 0, tout: 0.6, t0: 0.1, hard: 1.6 });
      }
    }
    const disc = A.roughen(A.ellipse(x, y, r, r * rr(0.96, 1.0), rr(0, 3)), 0.7, 14, true);
    A.fill([disc], 'pastel', 'saffron', { w: Math.max(4, r * 0.24), p: 1, reach: 1.6, passes: 2, ang: rr(-1, 1) });
    A.fill([A.roughen(A.ellipse(x, y, r * 0.84, r * 0.82, rr(0, 3)), 0.6, 12, true)], 'pastel', o.c || 'cream', { w: Math.max(3.5, r * 0.2), p: 1, reach: 1.6, passes: 2, ang: rr(-1, 1) });
    A.fill([A.roughen(A.ellipse(x - r * 0.06, y - r * 0.08, r * 0.52, r * 0.5, rr(0, 3)), 0.8, 10, true)], 'pastel', 'khadi', { w: Math.max(3, r * 0.16), p: 0.95, reach: 1.4, passes: 2, ang: rr(-1, 1) });
    A.outline(A.ellipse(x, y, r * 0.86, r * 0.84, rr(0, 3)), 'gold', 'gold', { closed: true, w: Math.max(2, r * 0.09), p: 0.95, pull: 50, again: 0.25 });
    A.outline(A.ellipse(x + 0.4, y + 0.3, r * 1.02, r * 1.0, rr(0, 3)), 'chalk', 'sindoor', { closed: true, w: 1.5, p: 0.85, pull: 45, again: 0.2 });
    A.outline(A.ellipse(x, y, r * 0.66, r * 0.64, rr(0, 3)), 'pencil', 'saffron', { closed: true, w: 0.9, p: 0.55, pull: 30, again: 0.1 });
    // rays: long gold flames and short red ticks, set down one by one
    const n = o.rays || Math.round(rr(30, 34)); let a = rr(0, TAU);
    for (let i = 0; i < n; i++) {
      a += TAU / n * rr(0.82, 1.18);
      const ca = Math.cos(a), sa = Math.sin(a), long = i % 2 === 0;
      const r0 = r * rr(1.13, 1.2), r1 = r * (long ? rr(1.75, 2.2) : rr(1.4, 1.58)), bow = rr(-0.08, 0.08) * r * (long ? 1.5 : 0.6);
      const ray = A.spline([[x + ca * r0, y + sa * r0], [x + ca * (r0 + r1) / 2 - sa * bow, y + sa * (r0 + r1) / 2 + ca * bow], [x + ca * r1, y + sa * r1]], false, 1.5);
      if (long) {
        A.stroke(ray, 'chalk', 'sindoor', { w: Math.max(2.8, r * 0.125), p: 0.95, reach: 1.4, tin: 0.05, tout: 0.6, t0: 0.2 });
        A.stroke(ray, 'gold', 'gold', { w: Math.max(1.8, r * 0.078), p: 0.95, tin: 0.05, tout: 0.6, t0: 0.2 });
      } else {
        A.stroke(ray, 'chalk', A.chance(0.7) ? 'sindoor' : 'hingul', { w: rr(1.6, 2.2), p: rr(0.8, 0.95), reach: 1.3, tin: 0.1, tout: 0.5 });
      }
      if (i % 2 === 0 && A.chance(0.75)) A.dot(x + ca * r * rr(2.32, 2.46), y + sa * r * rr(2.32, 2.46), 'chalk', A.pick(['sindoor', 'khadi', 'sindoor']), { w: rr(1.3, 2.1), p: 0.85, len: 0.4 });
    }
  };

  /* --------------------------------------------------------------------------
     M.fireflies(A, polygon, n, o)   tiny gold sparks with a breath of light.
     o : s (size multiplier, 1), trail (0.4 share that leave a dotted flight line)
     returns [[x,y]..]
     ------------------------------------------------------------------------ */
  M.fireflies = function (A, poly, n, o) {
    o = o || {};
    const rr = A.rr, bb = A.bbox([poly]), out = [], trail = o.trail != null ? o.trail : 0.4;
    let tries = 0;
    while (out.length < n && tries++ < n * 40) {
      const x = rr(bb[0], bb[2]), y = rr(bb[1], bb[3]);
      if (!A.inside([poly], x, y)) continue;
      let ok = true; for (const q of out) if (Math.hypot(q[0] - x, q[1] - y) < 14) { ok = false; break; }
      if (!ok) continue;
      out.push([x, y]);
      const s = rr(0.7, 1.3) * (o.s || 1);
      if (A.chance(trail)) {
        const a = rr(0, TAU), bend = rr(-0.5, 0.5), k = A.ri(3, 6);
        for (let j = 1; j <= k; j++) { const d = j * rr(3.2, 4.4) * s, aa = a + bend * j * 0.3; A.dot(x + Math.cos(aa) * d, y + Math.sin(aa) * d, 'chalk', 'haldi', { w: rr(0.8, 1.1) * s, p: 0.75 * (1 - j / (k + 1.5)), len: 0.25 }); }
      }
      A.dot(x, y, 'pastel', 'saffron', { w: 13 * s, p: 0.24, len: 1, reach: 0.85, hard: 1.2 });
      A.dot(x, y, 'pastel', 'haldi', { w: 7.5 * s, p: 0.42, len: 0.8, reach: 0.9, hard: 1.3 });
      A.dot(x, y, 'gold', 'gold', { w: 3 * s, len: 0.6 });
      A.dot(x + rr(-0.3, 0.3), y - 0.3 * s, 'chalk', 'cream', { w: 1.5 * s, p: 0.98, len: 0.3 });
    }
    return out;
  };
})();
