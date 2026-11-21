'use strict';
/* ============================================================================
   DRY-MEDIA ENGINE
   Everything is drawn by depositing pigment on a simulated sheet of rough
   handmade paper. No canvas path API, no SVG: only JavaScript writing pixels.

   Coordinates given to the public API are LOGICAL units on a 1920 x 1080 sheet.
   The engine multiplies by S (2 -> 3840 x 2160).
   ========================================================================== */
const SCENES = {};
const M = {};   // motif library: M.name = function (A, ...) {...}

function createArt(opt) {
  opt = opt || {};
  const S = opt.S || 2, LW = opt.LW || 1920, LH = opt.LH || 1080;
  const W = Math.round(LW * S), H = Math.round(LH * S), N = W * H;
  const A = { S, LW, LH, W, H };
  const g = S / 2; // grain scale, 1 at 4K

  // ---------------------------------------------------------------- random
  let _s = (opt.seed || 20261116) >>> 0;
  function rnd() {
    _s = (_s + 0x6D2B79F5) | 0;
    let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const rr = (a, b) => a + (b - a) * rnd();
  A.rnd = rnd; A.rr = rr;
  A.ri = (a, b) => Math.floor(a + (b - a + 1) * rnd());
  A.pick = a => a[(rnd() * a.length) | 0];
  A.gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 1.7320508;
  A.chance = p => rnd() < p;
  A.reseed = v => { _s = v >>> 0; };

  function h2(ix, iy, k) {
    let n = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(k | 0, 1442695041)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  }
  function vn(x, y, k) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = h2(ix, iy, k), b = h2(ix + 1, iy, k), c = h2(ix, iy + 1, k), d = h2(ix + 1, iy + 1, k);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  A.hash = h2;
  A.noise2 = (x, y, k) => vn(x, y, k || 0);          // 0..1, smooth
  A.noise1 = (x, k) => vn(x, 0.5, k || 0);            // 0..1, smooth
  A.fbm = (x, y, oct, k) => {
    let s = 0, a = 0.5, f = 1, n = 0;
    for (let i = 0; i < (oct || 4); i++) { s += a * vn(x * f, y * f, (k || 0) + i * 17); n += a; a *= 0.5; f *= 2.03; }
    return s / n;
  };

  // ---------------------------------------------------------------- colour
  function col(c) {
    if (typeof c !== 'string') return c;
    if (PAL[c]) c = PAL[c];
    const v = parseInt(c.slice(1), 16);
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
  }
  const PAL = {
    paper: '#e9dfc8',
    // reds, pinks
    hingul: '#c63d2f', sindoor: '#de5a22', lac: '#8f2331', rose: '#d77f86', gulabi: '#e8a9a4',
    peach: '#f0c3a0', crimson: '#c2304e', brick: '#a8482e', maroon: '#5e1f24',
    // yellows
    peori: '#e6b422', haldi: '#edc94b', cream: '#f1dfa6', ochre: '#c1892b', saffron: '#e88e1e', sand: '#d8c090',
    // greens
    malachite: '#4f8a5b', sap: '#6b8f3a', olive: '#7b7d38', sage: '#a8b98a', bottle: '#22402b',
    leaf: '#a9b545', teal: '#3c8576', moss: '#4d5a2a', verdigris: '#7fb59b',
    // blues
    neel: '#1d2850', lapis: '#2a4b96', sky: '#9cc1d2', slate: '#7c8b96', night: '#10162c',
    aqua: '#6fa8b8', ice: '#cfe0e4', storm: '#3b4a6e',
    // mauves
    mauve: '#b497b5', lilac: '#cdb7cf', plum: '#6e4a6b', pinkrock: '#dba59f',
    // neutrals
    khadi: '#f7f2e7', grey: '#8d8b86', stone: '#c9c2b4', kajal: '#191513', sepia: '#4a3223',
    geru: '#a8482e', umber: '#6b4a2e', ash: '#5c5a58',
    gold: '#d4a437'
  };
  A.PAL = PAL; A.col = col;
  A.mix = (a, b, t) => { a = col(a); b = col(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
  A.vary = (c, amt) => {            // small random shift of a pigment (hue/value)
    c = col(c); amt = amt == null ? 0.04 : amt;
    const d = (rnd() - 0.5) * 2 * amt;
    return [clamp01(c[0] + d + (rnd() - 0.5) * amt), clamp01(c[1] + d + (rnd() - 0.5) * amt), clamp01(c[2] + d + (rnd() - 0.5) * amt)];
  };
  A.shade = (c, k) => { c = col(c); return k >= 0 ? [c[0] + (1 - c[0]) * k, c[1] + (1 - c[1]) * k, c[2] + (1 - c[2]) * k] : [c[0] * (1 + k), c[1] * (1 + k), c[2] * (1 + k)]; };
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // ---------------------------------------------------------------- sheet
  const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
  const HM = new Float32Array(N);        // paper tooth height, uniform 0..1 (1 = peak)
  const FL = new Uint8Array(N);          // how much pigment already sits in the tooth
  A.R = R; A.G = G; A.B = B; A.HM = HM; A.FL = FL;

  (function makePaper() {
    // fine tooth: white noise, lightly blurred
    const tmp = new Float32Array(N);
    for (let i = 0; i < N; i++) tmp[i] = rnd();
    const br = g >= 0.9 ? 1 : 0;
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        let f;
        if (br) {
          const xm = x > 0 ? x - 1 : x, xp = x < W - 1 ? x + 1 : x;
          const ym = y > 0 ? row - W : row, yp = y < H - 1 ? row + W : row;
          f = (tmp[row + x] * 4 + (tmp[row + xm] + tmp[row + xp] + tmp[ym + x] + tmp[yp + x]) * 2 +
               tmp[ym + xm] + tmp[ym + xp] + tmp[yp + xm] + tmp[yp + xp]) / 16;
          f = (f - 0.5) * 2.1 + 0.5;
        } else f = tmp[row + x];
        const a = vn(x / (3.3 * g), y / (3.3 * g), 11);
        const b = vn(x / (7.5 * g), y / (7.5 * g), 12);
        const c = vn(x / (24 * g), y / (24 * g), 13);
        const d = vn(x / (90 * g), y / (60 * g), 14);
        HM[row + x] = 0.36 * f + 0.30 * a + 0.20 * b + 0.10 * c + 0.04 * d;
      }
    }
    // fibres: short hairs pressed into the sheet
    const fib = opt.fibres == null ? 1 : opt.fibres;     // a burnished wasli sheet has fewer and flatter hairs than raw paper
    const nf = Math.round(5200 * g * g * fib);
    for (let k = 0; k < nf; k++) {
      let x = rnd() * W, y = rnd() * H, an = rnd() * 6.283, len = rr(14, 70) * g, cv = rr(-0.05, 0.05), amt = rr(0.10, 0.32) * (rnd() < 0.8 ? 1 : -1) * (fib < 1 ? 0.4 + 0.6 * fib : 1);
      for (let s = 0; s < len; s++) {
        const xi = x | 0, yi = y | 0;
        if (xi > 0 && yi > 0 && xi < W - 1 && yi < H - 1) { const i = yi * W + xi; HM[i] += amt; HM[i + 1] += amt * 0.4; HM[i + W] += amt * 0.4; }
        x += Math.cos(an); y += Math.sin(an); an += cv + (rnd() - 0.5) * 0.12;
      }
    }
    // equalise to a uniform distribution so coverage == pressure
    const NB = 2048, hist = new Uint32Array(NB);
    let mn = 1e9, mx = -1e9;
    for (let i = 0; i < N; i++) { const v = HM[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    const sc = (NB - 1) / (mx - mn);
    for (let i = 0; i < N; i++) hist[((HM[i] - mn) * sc) | 0]++;
    const cdf = new Float32Array(NB); let acc = 0;
    for (let i = 0; i < NB; i++) { acc += hist[i]; cdf[i] = acc / N; }
    for (let i = 0; i < N; i++) HM[i] = cdf[((HM[i] - mn) * sc) | 0];

    // sheet colour: warm buff, cloudy, with flecks
    const pc = col(opt.paper || PAL.paper);
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        const m = 1 + 0.045 * (vn(x / (260 * g), y / (210 * g), 21) - 0.5) + 0.028 * (vn(x / (52 * g), y / (52 * g), 22) - 0.5) +
                  0.045 * (HM[row + x] - 0.5);
        const wv = 0.012 * (vn(x / (400 * g), y / (400 * g), 23) - 0.5);
        R[row + x] = pc[0] * m + wv; G[row + x] = pc[1] * m; B[row + x] = pc[2] * m - wv * 1.5;
      }
    }
    const nk = Math.round(9000 * g * g);
    for (let k = 0; k < nk; k++) {
      const x = (rnd() * W) | 0, y = (rnd() * H) | 0, dark = rnd() < 0.72, a = dark ? rr(0.06, 0.34) : rr(0.05, 0.2);
      const fr = dark ? 0.42 : 1, fg = dark ? 0.31 : 0.98, fb = dark ? 0.2 : 0.9;
      let px = x, py = y, an = rnd() * 6.283; const len = rnd() < 0.7 ? rr(1, 3) : rr(4, 22) * g;
      for (let s = 0; s < len; s++) {
        const xi = px | 0, yi = py | 0;
        if (xi >= 0 && yi >= 0 && xi < W && yi < H) { const i = yi * W + xi; R[i] += (fr - R[i]) * a; G[i] += (fg - G[i]) * a; B[i] += (fb - B[i]) * a; }
        px += Math.cos(an); py += Math.sin(an); an += (rnd() - 0.5) * 0.5;
      }
    }
    _s = (((opt.seed || 20261116) ^ 0x9e3779b9) >>> 0);   // drawing starts from the same state at every size
  })();

  // ---------------------------------------------------------------- tools
  /* reach  : how deep into the tooth the stick gets at full pressure (>1 fills valleys)
     soft   : softness of the tooth threshold
     flow   : opacity of one pass
     hard   : edge hardness of the mark (1 = soft cone, 4 = flat top)
     aspect : along-stroke radius / across radius (thin = stick dragged sideways)
     opq    : 1 opaque pigment, 0 pure transparent glaze (multiplies what is below)
     fillRate / fillK : how the tooth clogs, and how much a clogged tooth evens out later marks */
  const TOOLS = {
    pastel:   { w: 9,   p: 0.85, reach: 1.12, soft: 0.22, flow: 0.80, hard: 2.6, aspect: 0.55, spacing: 0.30, opq: 1.0,  fillRate: 110, fillK: 0.55, wob: 0.9, streak: 0.45, tin: 0.05, tout: 0.08, t0: 0.55, wmin: 0.8, pv: 0.22 },
    side:     { w: 34,  p: 0.70, reach: 0.98, soft: 0.30, flow: 0.60, hard: 3.2, aspect: 0.30, spacing: 0.34, opq: 1.0,  fillRate: 80,  fillK: 0.55, wob: 1.6, streak: 0.75, tin: 0.04, tout: 0.06, t0: 0.5,  wmin: 0.92, pv: 0.3 },
    chalk:    { w: 6,   p: 0.85, reach: 1.02, soft: 0.20, flow: 0.82, hard: 2.4, aspect: 0.6,  spacing: 0.30, opq: 1.0,  fillRate: 90,  fillK: 0.5,  wob: 0.8, streak: 0.35, tin: 0.05, tout: 0.1,  t0: 0.5,  wmin: 0.75, pv: 0.25 },
    pencil:   { w: 1.25, p: 0.8, reach: 0.86, soft: 0.34, flow: 0.72, hard: 1.5, aspect: 1.0,  spacing: 0.42, opq: 0.62, fillRate: 26,  fillK: 0.45, wob: 0.55, streak: 0,   tin: 0.10, tout: 0.16, t0: 0.3,  wmin: 0.62, pv: 0.3 },
    shade:    { w: 3.6, p: 0.5,  reach: 0.62, soft: 0.40, flow: 0.40, hard: 1.2, aspect: 1.0,  spacing: 0.36, opq: 0.50, fillRate: 14,  fillK: 0.4,  wob: 0.8, streak: 0.2,  tin: 0.12, tout: 0.18, t0: 0.25, wmin: 0.7,  pv: 0.35 },
    kajal:    { w: 1.5, p: 0.85, reach: 0.96, soft: 0.28, flow: 0.80, hard: 1.7, aspect: 1.0,  spacing: 0.40, opq: 0.92, fillRate: 40,  fillK: 0.5,  wob: 0.55, streak: 0,   tin: 0.08, tout: 0.14, t0: 0.3,  wmin: 0.55, pv: 0.3 },
    geru:     { w: 1.8, p: 0.6,  reach: 0.74, soft: 0.34, flow: 0.55, hard: 1.4, aspect: 1.0,  spacing: 0.40, opq: 0.8,  fillRate: 18,  fillK: 0.4,  wob: 1.0, streak: 0,   tin: 0.10, tout: 0.2,  t0: 0.25, wmin: 0.6,  pv: 0.4 },
    gold:     { w: 2.2, p: 0.9,  reach: 1.10, soft: 0.22, flow: 0.88, hard: 2.2, aspect: 1.0,  spacing: 0.36, opq: 1.0,  fillRate: 120, fillK: 0.6,  wob: 0.5, streak: 0.2,  tin: 0.06, tout: 0.1,  t0: 0.45, wmin: 0.7,  pv: 0.2, mode: 1 }
  };
  A.TOOLS = TOOLS;
  A.tool = (base, over) => Object.assign({}, TOOLS[base], over || {});

  // clip rectangle (physical px) – lets us render only a crop while testing
  let cl0x = 0, cl0y = 0, cl1x = W, cl1y = H;
  A.setClip = (x, y, w, h) => {
    cl0x = Math.max(0, Math.floor(x * S)); cl0y = Math.max(0, Math.floor(y * S));
    cl1x = Math.min(W, Math.ceil((x + w) * S)); cl1y = Math.min(H, Math.ceil((y + h) * S));
  };
  A.clip = () => [cl0x, cl0y, cl1x, cl1y];
  if (opt.crop) A.setClip(opt.crop[0], opt.crop[1], opt.crop[2], opt.crop[3]);

  // mask stack
  let MK = null; const MKS = [];

  // dirty tiles: which 64 px squares of the sheet have new marks, so a page can show the drawing as it grows
  const TW = Math.ceil(W / 64), TH = Math.ceil(H / 64), DT = new Uint8Array(TW * TH).fill(1);
  let dabN = 0;
  function mark(x0, y0, x1, y1) {
    const tx0 = x0 >> 6, tx1 = (x1 - 1) >> 6, ty1 = (y1 - 1) >> 6;
    for (let ty = y0 >> 6; ty <= ty1; ty++) { const r = ty * TW; for (let tx = tx0; tx <= tx1; tx++) DT[r + tx] = 1; }
  }
  A.tick = null;                       // called every few dozen dabs; the page uses it to send finished tiles
  A.takeDirty = function () {          // -> [[x, y, w, h], ...] in sheet pixels, and the tiles count as clean again
    const out = [];
    for (let ty = 0; ty < TH; ty++) {
      const r = ty * TW; let tx = 0;
      while (tx < TW) {
        if (!DT[r + tx]) { tx++; continue; }
        let e = tx; while (e < TW && DT[r + e]) { DT[r + e] = 0; e++; }
        const x = tx * 64, y = ty * 64;
        out.push([x, y, Math.min(W, e * 64) - x, Math.min(H, y + 64) - y]);
        tx = e;
      }
    }
    return out;
  };

  // current mark state (kept in closure variables for the hot loop)
  let T_reach = 1, T_isoft = 4, T_hard = 2, T_opq = 1, T_pmix = 0, T_mode = 0, T_fillRate = 50, T_fillK = 0.5;
  let C_r = 0, C_g = 0, C_b = 0;
  let ST = null, STn = 0;
  let LUT = null;
  const GD = [0.50, 0.33, 0.08], GM = [0.84, 0.65, 0.22], GL = [1.0, 0.93, 0.62];   // gold: shadow, body, glint

  function dab(cx, cy, r, ra, press, ux, uy) {
    const ex = Math.sqrt(ra * ra * ux * ux + r * r * uy * uy) + 1, ey = Math.sqrt(ra * ra * uy * uy + r * r * ux * ux) + 1;
    let x0 = Math.floor(cx - ex), x1 = Math.ceil(cx + ex), y0 = Math.floor(cy - ey), y1 = Math.ceil(cy + ey);
    if (x0 < cl0x) x0 = cl0x; if (y0 < cl0y) y0 = cl0y; if (x1 > cl1x) x1 = cl1x; if (y1 > cl1y) y1 = cl1y;
    if (x0 >= x1 || y0 >= y1) return;
    const ir = 1 / r, ira = 1 / ra;
    let mk = MK, md = null, mw = 0, mx0 = 0, my0 = 0, mh = 0;
    if (mk) { md = mk.d; mw = mk.w; mh = mk.h; mx0 = mk.x0; my0 = mk.y0; if (x0 < mx0) x0 = mx0; if (y0 < my0) y0 = my0; if (x1 > mx0 + mw) x1 = mx0 + mw; if (y1 > my0 + mh) y1 = my0 + mh; if (x0 >= x1 || y0 >= y1) return; }
    mark(x0, y0, x1, y1);
    if ((++dabN & 31) === 0 && A.tick) A.tick();
    for (let y = y0; y < y1; y++) {
      const dy = y + 0.5 - cy;
      let i = y * W + x0;
      const mrow = md ? (y - my0) * mw - mx0 : 0;
      for (let x = x0; x < x1; x++, i++) {
        const dx = x + 0.5 - cx;
        const al = (dx * ux + dy * uy) * ira, ac = (dy * ux - dx * uy) * ir;
        const q = al * al + ac * ac;
        if (q >= 1) continue;
        let m = 1;
        if (md) { m = md[mrow + x]; if (m === 0) continue; m *= 0.003921569; }
        let pl = T_hard * (1 - q); if (pl > 1) pl = 1; pl *= press;
        if (ST) pl *= ST[((ac * 0.5 + 0.5) * STn) | 0];
        const t = (1 - HM[i]) * (1 - T_fillK * FL[i] * 0.003921569);
        let a = (pl * T_reach - t) * T_isoft + 0.5;
        if (a <= 0) continue; if (a > 1) a = 1;
        a = LUT[(a * 255) | 0] * m;
        if (T_mode === 0) {
          const or = R[i], og = G[i], ob = B[i];
          R[i] = or + (C_r * (T_opq + T_pmix * or) - or) * a;
          G[i] = og + (C_g * (T_opq + T_pmix * og) - og) * a;
          B[i] = ob + (C_b * (T_opq + T_pmix * ob) - ob) * a;
        } else {
          let s = 0.5;
          if (i > W && i < N - W - 1) s += ((HM[i + 1] - HM[i - 1]) + (HM[i - W] - HM[i + W])) * 0.55;
          s += (h2(x, y, 77) - 0.5) * 0.3 + (vn(x * 0.11, y * 0.11, 78) - 0.5) * 0.5;
          let gr, gg, gb;
          if (s < 0.5) { const k = s < 0 ? 0 : s * 2; gr = GD[0] + (GM[0] - GD[0]) * k; gg = GD[1] + (GM[1] - GD[1]) * k; gb = GD[2] + (GM[2] - GD[2]) * k; }
          else { let k = (s - 0.5) * 2; if (k > 1) k = 1; k = k * k; gr = GM[0] + (GL[0] - GM[0]) * k; gg = GM[1] + (GL[1] - GM[1]) * k; gb = GM[2] + (GL[2] - GM[2]) * k; }
          gr *= C_r; gg *= C_g; gb *= C_b;
          R[i] += (gr - R[i]) * a; G[i] += (gg - G[i]) * a; B[i] += (gb - B[i]) * a;
        }
        const f = FL[i] + a * T_fillRate; FL[i] = f > 255 ? 255 : f;
      }
    }
  }

  const lutCache = new Map();
  function getLUT(flow, nOver) {
    if (flow > 0.985) flow = 0.985;
    const key = ((flow * 200) | 0) * 1000 + Math.min(999, (nOver * 20) | 0);
    let l = lutCache.get(key);
    if (!l) {
      l = new Float32Array(257); const inv = 1 / Math.max(1, nOver);
      for (let k = 0; k <= 256; k++) l[k] = 1 - Math.pow(1 - flow * (k / 255 > 1 ? 1 : k / 255), inv);
      lutCache.set(key, l);
    }
    return l;
  }
  function setMark(T, c, o) {
    T_reach = (o.reach != null ? o.reach : T.reach); T_isoft = 1 / (o.soft != null ? o.soft : T.soft);
    T_hard = o.hard != null ? o.hard : T.hard; T_opq = o.opq != null ? o.opq : T.opq; T_pmix = 1 - T_opq;
    T_mode = T.mode || 0; T_fillRate = T.fillRate; T_fillK = T.fillK;
    if (T_mode === 1) { C_r = C_g = C_b = 1; if (c && c !== 'gold') { const cc = col(c); const k = 1 / 0.84, k2 = 1 / 0.65, k3 = 1 / 0.22; C_r = Math.min(1.25, cc[0] * k); C_g = Math.min(1.3, cc[1] * k2); C_b = Math.min(2.2, cc[2] * k3); } }
    else { const cc = col(c); const cv = o.cv != null ? o.cv : 0.018; const d = (rnd() - 0.5) * 2 * cv; C_r = clamp01(cc[0] + d + (rnd() - 0.5) * cv); C_g = clamp01(cc[1] + d + (rnd() - 0.5) * cv); C_b = clamp01(cc[2] + d + (rnd() - 0.5) * cv); }
    const sk = o.streak != null ? o.streak : T.streak;
    if (sk > 0) {
      STn = 24; ST = new Float32Array(STn + 1); let v = rnd();
      for (let k = 0; k <= STn; k++) { v = v * 0.55 + rnd() * 0.45; ST[k] = 1 - sk * 0.5 + sk * (v - 0.5) * 1.6; if (rnd() < 0.08 * sk) ST[k] *= 0.55; }
    } else ST = null;
  }

  /* A.stroke(pts, tool, colour, opts)
     pts  : [[x,y], [x,y,pressureMul], ...] in logical units
     opts : w (width), p (pressure 0..1), wob (hand wobble multiplier), flow, tin/tout (taper fractions),
            reach, soft, hard, opq, cv (colour variation), streak                                        */
  A.stroke = function (pts, tool, c, o) {
    o = o || {};
    const T = typeof tool === 'string' ? TOOLS[tool] : tool;
    const n = pts.length; if (n < 2) return;
    const w = (o.w != null ? o.w : T.w) * S;
    const p0 = o.p != null ? o.p : T.p;
    const wob = (o.wob != null ? o.wob : 1) * T.wob * S;
    setMark(T, c, o);
    const r0 = Math.max(0.55, w / 2), asp = o.aspect != null ? o.aspect : T.aspect;
    const ds = Math.max(0.45, r0 * asp * T.spacing);
    LUT = getLUT(o.flow != null ? o.flow : T.flow, (2 * r0 * asp) / ds * 0.8);
    // length
    let total = 0;
    for (let i = 1; i < n; i++) total += Math.hypot((pts[i][0] - pts[i - 1][0]) * S, (pts[i][1] - pts[i - 1][1]) * S);
    if (total < 0.01) return;
    const sA = rnd() * 997, sB = rnd() * 997, sP = rnd() * 997;
    let tin = o.tin != null ? o.tin : T.tin, tout = o.tout != null ? o.tout : T.tout;
    const maxT = 26 * S / total; if (tin > maxT) tin = maxT; if (tout > maxT * 1.4) tout = maxT * 1.4;
    const t0 = o.t0 != null ? o.t0 : T.t0, wmin = T.wmin, pv = o.pv != null ? o.pv : T.pv;
    const i70 = 1 / (70 * S), i7 = 1 / (7 * S), i25 = 1 / (25 * S);
    let acc = 0, carry = 0;
    for (let i = 1; i < n; i++) {
      const ax = pts[i - 1][0] * S, ay = pts[i - 1][1] * S, bx = pts[i][0] * S, by = pts[i][1] * S;
      const L = Math.hypot(bx - ax, by - ay); if (L < 1e-6) continue;
      const ux = (bx - ax) / L, uy = (by - ay) / L;
      const pa = pts[i - 1][2] != null ? pts[i - 1][2] : 1, pb = pts[i][2] != null ? pts[i][2] : 1;
      let d = carry;
      while (d <= L) {
        const s = acc + d, u = s / total;
        const wv = wob * ((vn(s * i70 + sA, 0.5, 5) - 0.5) * 1.8 + (vn(s * i7 + sB, 0.5, 6) - 0.5) * 0.42);
        let pr = p0 * (1 + pv * (vn(s * i25 + sP, 0.5, 7) - 0.5) * 2) * (pa + (pb - pa) * (d / L));
        if (u < tin) pr *= t0 + (1 - t0) * (u / tin);
        if (u > 1 - tout) pr *= t0 + (1 - t0) * ((1 - u) / tout);
        let k = pr / p0; if (k > 1) k = 1;
        const rad = r0 * (wmin + (1 - wmin) * k);
        dab(ax + ux * d - uy * wv, ay + uy * d + ux * wv, rad, Math.max(0.5, rad * asp), pr, ux, uy);
        d += ds;
      }
      carry = d - L; acc += L;
    }
  };
  A.line = (x1, y1, x2, y2, tool, c, o) => A.stroke([[x1, y1], [x2, y2]], tool, c, o);
  // a pressed dot / short dab
  A.dot = function (x, y, tool, c, o) {
    o = o || {}; const T = typeof tool === 'string' ? TOOLS[tool] : tool;
    const w = (o.w != null ? o.w : T.w), l = o.len != null ? o.len : w * 0.35, an = o.ang != null ? o.ang : rnd() * 6.283;
    A.stroke([[x - Math.cos(an) * l, y - Math.sin(an) * l], [x + Math.cos(an) * l, y + Math.sin(an) * l]], T, c, Object.assign({ tin: 0, tout: 0, wob: 0.3 }, o));
  };

  // ---------------------------------------------------------------- geometry helpers
  function Path() { this.pts = []; }
  Path.prototype.M = function (x, y) { this.pts.push([x, y]); return this; };
  Path.prototype.L = function (x, y) { this.pts.push([x, y]); return this; };
  Path.prototype.Q = function (cx, cy, x, y) {
    const a = this.pts[this.pts.length - 1], n = Math.max(4, Math.ceil((Math.hypot(cx - a[0], cy - a[1]) + Math.hypot(x - cx, y - cy)) / 3));
    for (let i = 1; i <= n; i++) { const t = i / n, m = 1 - t; this.pts.push([m * m * a[0] + 2 * m * t * cx + t * t * x, m * m * a[1] + 2 * m * t * cy + t * t * y]); }
    return this;
  };
  Path.prototype.C = function (c1x, c1y, c2x, c2y, x, y) {
    const a = this.pts[this.pts.length - 1], n = Math.max(6, Math.ceil((Math.hypot(c1x - a[0], c1y - a[1]) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(x - c2x, y - c2y)) / 3));
    for (let i = 1; i <= n; i++) { const t = i / n, m = 1 - t; this.pts.push([m * m * m * a[0] + 3 * m * m * t * c1x + 3 * m * t * t * c2x + t * t * t * x, m * m * m * a[1] + 3 * m * m * t * c1y + 3 * m * t * t * c2y + t * t * t * y]); }
    return this;
  };
  Path.prototype.A = function (cx, cy, rx, ry, a0, a1, rot) {
    rot = rot || 0; const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 2.5)), cr = Math.cos(rot), sr = Math.sin(rot);
    for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n, x = Math.cos(t) * rx, y = Math.sin(t) * ry; this.pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); }
    return this;
  };
  A.path = () => new Path();
  A.ellipse = (cx, cy, rx, ry, rot, a0, a1) => new Path().A(cx, cy, rx, ry == null ? rx : ry, a0 == null ? 0 : a0, a1 == null ? 6.2832 : a1, rot || 0).pts;
  A.rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  // smooth curve through control points (Catmull-Rom). pts may carry a 3rd value (pressure) which is interpolated.
  A.spline = function (cp, closed, step) {
    const n = cp.length, out = []; step = step || 2.5;
    const get = i => closed ? cp[(i % n + n) % n] : cp[i < 0 ? 0 : i >= n ? n - 1 : i];
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const m = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
      for (let j = 0; j < m; j++) {
        const t = j / m, t2 = t * t, t3 = t2 * t;
        const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
        const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
        if (p1[2] != null || p2[2] != null) { const a = p1[2] != null ? p1[2] : 1, b = p2[2] != null ? p2[2] : 1; out.push([x, y, a + (b - a) * t]); } else out.push([x, y]);
      }
    }
    if (!closed) out.push(cp[n - 1].slice());
    return out;
  };
  // transform: {x, y, s, sx, sy, rot, flip}
  A.xf = function (pts, t) {
    if (pts.length && Array.isArray(pts[0][0])) return pts.map(p => A.xf(p, t));
    const sx = (t.sx != null ? t.sx : (t.s != null ? t.s : 1)) * (t.flip ? -1 : 1), sy = t.sy != null ? t.sy : (t.s != null ? t.s : 1);
    const cr = Math.cos(t.rot || 0), sr = Math.sin(t.rot || 0), tx = t.x || 0, ty = t.y || 0;
    return pts.map(p => { const x = p[0] * sx, y = p[1] * sy; const q = [tx + x * cr - y * sr, ty + x * sr + y * cr]; if (p[2] != null) q.push(p[2]); return q; });
  };
  A.resample = function (pts, step, closed) {
    const src = closed ? pts.concat([pts[0]]) : pts, out = [src[0].slice()]; let carry = 0;
    for (let i = 1; i < src.length; i++) {
      const ax = src[i - 1][0], ay = src[i - 1][1], bx = src[i][0], by = src[i][1], L = Math.hypot(bx - ax, by - ay);
      if (L < 1e-9) continue; let d = step - carry;
      while (d <= L) { out.push([ax + (bx - ax) * d / L, ay + (by - ay) * d / L]); d += step; }
      carry = L - (d - step);
    }
    if (!closed) out.push(src[src.length - 1].slice());
    return out;
  };
  // make a contour look hand-cut: displace along its normal by smooth noise
  A.roughen = function (pts, amp, wl, closed) {
    const p = A.resample(pts, Math.max(1.2, (wl || 14) / 5), closed !== false), n = p.length, k = rnd() * 991, out = [];
    for (let i = 0; i < n; i++) {
      const a = p[(i - 1 + n) % n], b = p[(i + 1) % n]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const d = (vn(i * 1.2 / 5 + k, 0.5, 31) - 0.5) * 2 * amp + (vn(i * 1.2 + k, 0.5, 32) - 0.5) * amp * 0.5;
      out.push([p[i][0] + nx * d, p[i][1] + ny * d]);
    }
    return out;
  };
  A.bbox = function (polys) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of polys) for (const q of p) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }
    return [x0, y0, x1, y1];
  };
  const asPolys = p => (p.length && Array.isArray(p[0][0])) ? p : [p];
  A.inside = function (polys, x, y) {
    polys = asPolys(polys); let c = false;
    for (const p of polys) for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
    }
    return c;
  };

  // ---------------------------------------------------------------- masks
  function rasterPolys(polys, soft) {
    let bb = A.bbox(polys);
    let x0 = Math.max(cl0x, Math.floor(bb[0] * S) - 3), y0 = Math.max(cl0y, Math.floor(bb[1] * S) - 3);
    let x1 = Math.min(cl1x, Math.ceil(bb[2] * S) + 3), y1 = Math.min(cl1y, Math.ceil(bb[3] * S) + 3);
    if (x1 <= x0 || y1 <= y0) return { x0: 0, y0: 0, w: 0, h: 0, d: new Uint8Array(0) };
    const w = x1 - x0, h = y1 - y0, d = new Uint8Array(w * h);
    const ed = [];
    for (const p of polys) for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const ax = p[j][0] * S, ay = p[j][1] * S, bx = p[i][0] * S, by = p[i][1] * S;
      if (ay === by) continue;
      if (ay < by) ed.push(ay, by, ax, (bx - ax) / (by - ay)); else ed.push(by, ay, bx, (ax - bx) / (ay - by));
    }
    const xs = [];
    for (let y = 0; y < h; y++) {
      const yc = y + y0 + 0.5; xs.length = 0;
      for (let e = 0; e < ed.length; e += 4) if (yc >= ed[e] && yc < ed[e + 1]) xs.push(ed[e + 2] + (yc - ed[e]) * ed[e + 3]);
      if (xs.length < 2) continue;
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        let a = Math.round(xs[k]) - x0, b = Math.round(xs[k + 1]) - x0; if (a < 0) a = 0; if (b > w) b = w;
        const row = y * w; for (let x = a; x < b; x++) d[row + x] = 255;
      }
    }
    if (soft !== 0) {                 // soften the cut so the tooth can crumble the edge
      const t = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) { const row = y * w; for (let x = 0; x < w; x++) { const a = d[row + (x > 0 ? x - 1 : x)], b = d[row + x], c = d[row + (x < w - 1 ? x + 1 : x)]; t[row + x] = (a + 2 * b + c) >> 2; } }
      for (let y = 0; y < h; y++) { const row = y * w, ru = y > 0 ? row - w : row, rd = y < h - 1 ? row + w : row; for (let x = 0; x < w; x++) d[row + x] = (t[ru + x] + 2 * t[row + x] + t[rd + x]) >> 2; }
    }
    return { x0, y0, w, h, d };
  }
  A.pushMask = function (polys, soft) {
    const m = rasterPolys(asPolys(polys), soft);
    if (MK) {                         // intersect with the mask already in force
      const o = MK;
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const ox = x + m.x0 - o.x0, oy = y + m.y0 - o.y0, i = y * m.w + x;
        const v = (ox < 0 || oy < 0 || ox >= o.w || oy >= o.h) ? 0 : o.d[oy * o.w + ox];
        if (v < m.d[i]) m.d[i] = v;
      }
    }
    MKS.push(MK); MK = m; return m;
  };
  A.popMask = function () { MK = MKS.pop() || null; };
  A.withMask = function (polys, fn, soft) { A.pushMask(polys, soft); try { fn(); } finally { A.popMask(); } };
  // everything EXCEPT the polygons (used to protect a shape while working around it)
  A.pushMaskOutside = function (polys, soft) {
    const m = rasterPolys(asPolys(polys), soft);
    const full = { x0: cl0x, y0: cl0y, w: cl1x - cl0x, h: cl1y - cl0y, d: new Uint8Array((cl1x - cl0x) * (cl1y - cl0y)).fill(255) };
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const fx = x + m.x0 - full.x0, fy = y + m.y0 - full.y0; if (fx >= 0 && fy >= 0 && fx < full.w && fy < full.h) full.d[fy * full.w + fx] = 255 - m.d[y * m.w + x]; }
    if (MK) { const o = MK; for (let y = 0; y < full.h; y++) for (let x = 0; x < full.w; x++) { const ox = x + full.x0 - o.x0, oy = y + full.y0 - o.y0, i = y * full.w + x; const v = (ox < 0 || oy < 0 || ox >= o.w || oy >= o.h) ? 0 : o.d[oy * o.w + ox]; if (v < full.d[i]) full.d[i] = v; } }
    MKS.push(MK); MK = full; return full;
  };

  /* A.fill(polygon(s), tool, colour, opts) – hand hatching clipped to the shape.
     opts: ang (radians, direction of the strokes), w, gap (fraction of w between strokes), p, passes,
           len (max length of one arm movement), edge (how far the hand strays over the outline, logical units),
           turn (angle change between passes), flow, soft (mask softness)                                      */
  A.fill = function (polys, tool, c, o) {
    o = o || {}; polys = asPolys(polys);
    const T = typeof tool === 'string' ? TOOLS[tool] : tool;
    const w = o.w != null ? o.w : T.w, gap = w * (o.gap != null ? o.gap : 0.5);
    const passes = o.passes != null ? o.passes : 2, turn = o.turn != null ? o.turn : 0.5;
    const maxLen = o.len != null ? o.len : rr(150, 260);
    let mpolys = polys;
    if (o.edge) mpolys = polys.map(p => A.roughen(p, o.edge, 16, true));
    const bb = A.bbox(polys);
    if (!(bb[2] > bb[0]) || !(bb[3] > bb[1]) || !isFinite(bb[0] + bb[1] + bb[2] + bb[3])) return;
    A.pushMask(mpolys, o.soft);
    const base = o.ang != null ? o.ang : -0.62;
    for (let ps = 0; ps < passes; ps++) {
      const ang = base + ps * turn * (ps % 2 ? 1 : -1) + rr(-0.06, 0.06);
      const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
      let qmin = 1e9, qmax = -1e9, tmin = 1e9, tmax = -1e9;
      for (const cx of [bb[0], bb[2]]) for (const cy of [bb[1], bb[3]]) { const q = cx * nx + cy * ny, t = cx * dx + cy * dy; if (q < qmin) qmin = q; if (q > qmax) qmax = q; if (t < tmin) tmin = t; if (t > tmax) tmax = t; }
      const pp = (o.p != null ? o.p : T.p) * (ps === 0 ? 1 : 0.86);
      for (let q = qmin - gap * rnd(); q < qmax + gap; q += gap * rr(0.72, 1.28)) {
        // span of this hatch line inside the shape
        let a = 1e9, b = -1e9;
        for (const p of polys) for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
          const q1 = p[j][0] * nx + p[j][1] * ny - q, q2 = p[i][0] * nx + p[i][1] * ny - q;
          if ((q1 > 0) === (q2 > 0)) continue;
          const f = q1 / (q1 - q2), t = (p[j][0] + (p[i][0] - p[j][0]) * f) * dx + (p[j][1] + (p[i][1] - p[j][1]) * f) * dy;
          if (t < a) a = t; if (t > b) b = t;
        }
        if (b <= a) continue;
        a -= rr(0, w * 0.5); b += rr(0, w * 0.5);
        let t = a;
        while (t < b) {
          const L = Math.min(b - t, maxLen * rr(0.6, 1.15)), e = t + L, bow = rr(-0.012, 0.012) * L, off = rr(-0.18, 0.18) * gap;
          const mx = (t + e) / 2;
          const P = [[nx * (q + off) + dx * t, ny * (q + off) + dy * t], [nx * (q + off + bow) + dx * mx, ny * (q + off + bow) + dy * mx], [nx * (q + off) + dx * e, ny * (q + off) + dy * e]];
          if (rnd() < 0.5) P.reverse();
          A.stroke(P, T, c, { w: w * rr(0.9, 1.08), p: pp * rr(0.86, 1.1), flow: o.flow, cv: o.cv, reach: o.reach, streak: o.streak, wob: o.wob });
          if (w >= 20 && e >= b - 1e-6) break;
          t = e - rr(0, w * 0.6);
          if (L < 1) break;
        }
      }
    }
    A.popMask();
  };

  /* A.outline(pts, tool, colour, opts) – a contour drawn the way a hand draws it:
     in a few pulls with small gaps or overlaps, sometimes restated.  opts: closed, pull (length of one pull),
     again (probability of restating a pull), w, p                                                         */
  A.outline = function (pts, tool, c, o) {
    o = o || {}; const src = o.closed ? pts.concat([pts[0]]) : pts;
    const pull = o.pull != null ? o.pull : rr(60, 130), again = o.again != null ? o.again : 0.18;
    let seg = [src[0]], len = 0, lim = pull * rr(0.6, 1.2);
    const flush = () => {
      if (seg.length > 1) {
        A.stroke(seg, tool, c, o);
        if (rnd() < again) { const k = rr(-0.5, 0.5), a = Math.floor(seg.length * rr(0, 0.4)), b = Math.floor(seg.length * rr(0.6, 1)); const s2 = seg.slice(a, Math.max(a + 2, b)).map(p => [p[0] + k, p[1] - k * 0.6]); A.stroke(s2, tool, c, Object.assign({}, o, { p: (o.p != null ? o.p : 0.7) * 0.7 })); }
      }
    };
    for (let i = 1; i < src.length; i++) {
      len += Math.hypot(src[i][0] - src[i - 1][0], src[i][1] - src[i - 1][1]); seg.push(src[i]);
      if (len > lim) { flush(); const back = Math.min(seg.length - 1, 1 + (rnd() * 2 | 0)); seg = seg.slice(seg.length - 1 - (rnd() < 0.6 ? back : 0)); len = 0; lim = pull * rr(0.6, 1.2); }
    }
    flush();
  };

  /* A.smudge(pts, {r, k}) – drag a fingertip along a path, pulling colour with it. */
  A.smudge = function (pts, o) {
    o = o || {}; const r = (o.r || 8) * S, k = o.k != null ? o.k : 0.5, pickup = o.pick != null ? o.pick : 0.35;
    const ds = Math.max(1, r * 0.4), r2 = r * r; let cr = -1, cg = 0, cb = 0, carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0] * S, ay = pts[i - 1][1] * S, bx = pts[i][0] * S, by = pts[i][1] * S, L = Math.hypot(bx - ax, by - ay);
      if (L < 1e-6) continue; let d = carry;
      while (d <= L) {
        const cx = ax + (bx - ax) * d / L, cy = ay + (by - ay) * d / L;
        let x0 = Math.max(cl0x, Math.floor(cx - r)), x1 = Math.min(cl1x, Math.ceil(cx + r)), y0 = Math.max(cl0y, Math.floor(cy - r)), y1 = Math.min(cl1y, Math.ceil(cy + r));
        if (x1 > x0 && y1 > y0) { mark(x0, y0, x1, y1); if ((++dabN & 31) === 0 && A.tick) A.tick(); }
        let sr = 0, sg = 0, sb = 0, sw = 0; const st = r > 6 ? 2 : 1;
        for (let y = y0; y < y1; y += st) for (let x = x0; x < x1; x += st) { const dx = x - cx, dy = y - cy, q = dx * dx + dy * dy; if (q < r2) { const wgt = 1 - q / r2, j = y * W + x; sr += R[j] * wgt; sg += G[j] * wgt; sb += B[j] * wgt; sw += wgt; } }
        if (sw > 0) {
          sr /= sw; sg /= sw; sb /= sw;
          if (cr < 0) { cr = sr; cg = sg; cb = sb; } else { cr += (sr - cr) * pickup; cg += (sg - cg) * pickup; cb += (sb - cb) * pickup; }
          for (let y = y0; y < y1; y++) {
            const mrow = MK ? (y - MK.y0) * MK.w - MK.x0 : 0; if (MK && (y < MK.y0 || y >= MK.y0 + MK.h)) continue;
            for (let x = x0; x < x1; x++) {
              const dx = x - cx, dy = y - cy, q = dx * dx + dy * dy; if (q >= r2) continue;
              let f = (1 - q / r2) * k;
              if (MK) { if (x < MK.x0 || x >= MK.x0 + MK.w) continue; f *= MK.d[mrow + x] * 0.003921569; if (f <= 0) continue; }
              const j = y * W + x; R[j] += (cr - R[j]) * f; G[j] += (cg - G[j]) * f; B[j] += (cb - B[j]) * f;
              const fl = FL[j] + f * 40; FL[j] = fl > 255 ? 255 : fl;
            }
          }
        }
        d += ds;
      }
      carry = d - L;
    }
  };
  /* A.blend(polygon(s), {r, k, ang, gap}) – rub a whole area with the finger. */
  A.blend = function (polys, o) {
    o = o || {}; polys = asPolys(polys); const r = o.r || 9, gap = r * (o.gap || 1.1), bb = A.bbox(polys);
    A.pushMask(polys, o.soft);
    const ang = o.ang != null ? o.ang : rr(-0.9, -0.3), dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    let qmin = 1e9, qmax = -1e9, tmin = 1e9, tmax = -1e9;
    for (const cx of [bb[0], bb[2]]) for (const cy of [bb[1], bb[3]]) { const q = cx * nx + cy * ny, t = cx * dx + cy * dy; if (q < qmin) qmin = q; if (q > qmax) qmax = q; if (t < tmin) tmin = t; if (t > tmax) tmax = t; }
    const L = o.len || 90;
    for (let q = qmin; q < qmax; q += gap * rr(0.7, 1.3)) for (let t = tmin - rnd() * L; t < tmax; t += L * rr(0.5, 0.9)) {
      const e = t + L * rr(0.7, 1.2), w1 = rr(-3, 3), w2 = rr(-3, 3);
      const mx = (nx * q + dx * (t + e) / 2), my = (ny * q + dy * (t + e) / 2);
      if (!A.inside(polys, mx, my) && !A.inside(polys, nx * q + dx * t, ny * q + dy * t) && !A.inside(polys, nx * q + dx * e, ny * q + dy * e)) continue;
      A.smudge([[nx * (q + w1) + dx * t, ny * (q + w1) + dy * t], [mx, my], [nx * (q + w2) + dx * e, ny * (q + w2) + dy * e]], { r: r * rr(0.8, 1.2), k: o.k != null ? o.k : 0.45 });
    }
    A.popMask();
  };

  // ---------------------------------------------------------------- recipes
  /* A.ground(polygon(s), colour, opts) - a rich flat field of pastel, the way a Mewar ground is laid:
     the stick dragged on its side, rubbed into the tooth with a finger, then worked over again so the
     grain of the stroke stays on top.
     opts: w, ang, edge (roughness of the boundary), rub (finger radius, 0 = no rubbing), p, top (pressure of the
           last pass, 0 = none), c2 (colour of the last pass), cv                                                */
  A.ground = function (polys, c, o) {
    o = o || {}; polys = asPolys(polys);
    const rp = o.edge === 0 ? polys : polys.map(p => A.roughen(p, o.edge != null ? o.edge : 1.6, 18, true));
    const w = o.w || 30, ang = o.ang != null ? o.ang : -0.62;
    A.fill(rp, 'side', c, { w, p: o.p != null ? o.p : 1, reach: 1.55, passes: 2, turn: 0.8, ang, cv: o.cv != null ? o.cv : 0.03, soft: o.soft });
    if (o.rub !== 0) A.blend(rp, { r: o.rub || 8, k: 0.42, soft: o.soft });
    if (o.top !== 0) A.fill(rp, 'side', o.c2 || c, { w: w * 0.8, p: o.top != null ? o.top : 0.8, reach: 1.2, passes: 1, ang: ang + 0.35, cv: 0.04, soft: o.soft });
    return rp;
  };
  /* A.shape(points, opts) - one small flat form: filled with a stick, then outlined by hand a hair off register.
     opts: c (fill colour), tool ('pastel'), w, ang, passes, p, reach, rough (edge roughness), line (colour or false),
           lineTool ('kajal'), lw, lp, off (misregistration of the outline)                                         */
  A.shape = function (pts, o) {
    o = o || {};
    const rp = o.rough === 0 ? pts : A.roughen(pts, o.rough != null ? o.rough : 0.8, 12, true);
    if (o.c) A.fill(rp, o.tool || 'pastel', o.c, { w: o.w, ang: o.ang != null ? o.ang : rr(-1.2, 1.2), passes: o.passes != null ? o.passes : 2, p: o.p != null ? o.p : 0.95, reach: o.reach != null ? o.reach : 1.4, gap: o.gap, cv: o.cv });
    if (o.line !== false && o.line !== undefined) {
      const k = o.off != null ? o.off : 0.5, dx = rr(-k, k), dy = rr(-k, k);
      A.outline(rp.map(p => [p[0] + dx, p[1] + dy]), o.lineTool || 'kajal', o.line === true ? 'kajal' : o.line, { closed: true, w: o.lw, p: o.lp });
    }
    return rp;
  };
  // a row of evenly spread points along a polyline (for garlands of dots, tufts, lamps ...)
  A.along = function (pts, step, jitter) {
    const r = A.resample(pts, step, false), out = [];
    for (let i = 0; i < r.length; i++) {
      const a = r[Math.max(0, i - 1)], b = r[Math.min(r.length - 1, i + 1)];
      const an = Math.atan2(b[1] - a[1], b[0] - a[0]), j = jitter || 0;
      out.push({ x: r[i][0] + rr(-j, j), y: r[i][1] + rr(-j, j), ang: an, i, n: r.length });
    }
    return out;
  };
  // points scattered inside a polygon with a minimum spacing (hand-placed look, never a grid)
  A.scatter = function (polys, spacing, o) {
    o = o || {}; polys = asPolys(polys); const bb = A.bbox(polys), out = [], cell = spacing, jit = o.jit != null ? o.jit : 0.42;
    let row = 0;
    for (let y = bb[1] + cell * 0.5; y < bb[3]; y += cell * 0.86, row++) for (let x = bb[0] + (row % 2 ? cell * 0.5 : 0); x < bb[2]; x += cell) {
      const px = x + rr(-jit, jit) * cell, py = y + rr(-jit, jit) * cell;
      if (A.inside(polys, px, py) && (!o.margin || (A.inside(polys, px + o.margin, py) && A.inside(polys, px - o.margin, py) && A.inside(polys, px, py + o.margin) && A.inside(polys, px, py - o.margin)))) out.push([px, py]);
    }
    return out;
  };

  // ---------------------------------------------------------------- output
  /* Final pass: light rakes across the sheet from the upper left so the tooth reads as a surface. */
  A.rgbaInto = function (out, o, x0, y0, w, h, relief) {      // one rectangle of the sheet, written into out at offset o
    relief = relief == null ? 0.075 : relief;
    for (let y = y0; y < y0 + h; y++) {
      const row = y * W;
      for (let x = x0; x < x0 + w; x++, o += 4) {
        const i = row + x; let k = 1;
        if (x > 0 && y > 0 && x < W - 1 && y < H - 1) k += ((HM[i - 1] - HM[i + 1]) + (HM[i - W] - HM[i + W])) * relief;
        out[o] = R[i] * k * 255 + 0.5; out[o + 1] = G[i] * k * 255 + 0.5; out[o + 2] = B[i] * k * 255 + 0.5; out[o + 3] = 255;
      }
    }
  };
  A.toRGBA = function (out, relief) {
    relief = relief == null ? 0.075 : relief;
    out = out || new Uint8ClampedArray(N * 4);
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        const i = row + x; let k = 1;
        if (x > 0 && y > 0 && x < W - 1 && y < H - 1) k += ((HM[i - 1] - HM[i + 1]) + (HM[i - W] - HM[i + W])) * relief;
        const j = i * 4;
        out[j] = R[i] * k * 255 + 0.5; out[j + 1] = G[i] * k * 255 + 0.5; out[j + 2] = B[i] * k * 255 + 0.5; out[j + 3] = 255;
      }
    }
    return out;
  };
  return A;
}
