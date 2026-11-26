/* A Mewar-style royal elephant with its rider, painted in the units of the
   reference photo (about 1311 px wide). The elephant faces left; the scene can flip it.
   Use: Elephant.paint(ctx, pixelsPerUnit). Bounds: Elephant.EB. */
(() => {
  'use strict';
  const M = window.Mural;
  const { Painter, rgba, spline, poly, band, inset, ellipsePath, along, flatten, resample, bbox } = M;

  const C = {
    ink: '#141210', skin: '#2a2a2d',
    gold: '#d6a239', goldD: '#9c6b1d',
    red: '#b3252a', vermil: '#cb4f2a', pink: '#d98b76', pinkD: '#9c4f43', pinkL: '#f4bfa9',
    blue: '#23366c', green: '#2d7455', white: '#fbf6ea', bone: '#f1eadb',
    jama: '#93b6d6', jamaD: '#2f5288', flesh: '#c98a59', carve: '#4a2c0c',
  };
  const PINKS = ['#d89c8c', '#e5b3a3', '#c98b7c', '#efc6b8'];
  const TAU = Math.PI * 2;

  let K = 1; // device pixels per photo unit
  const lerp = (a, b, t) => a + (b - a) * t;
  const L2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const pt = (p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  const blur = (u) => `blur(${(u * K).toFixed(2)}px)`;
  const openEdge = (list, i, j) => spline(list.slice(i, j + 1).map((p) => [p[0], p[1]]), false);
  const polyline = (d, step = 1) => resample(flatten(d, 0.8)[0].pts, step);
  const withXf = (g, x, y, a, fn) => { g.save(); g.translate(x, y); g.rotate(a); fn(); g.restore(); };
  const leafD = (l, w) => `M0 0 C${0.12 * l} ${-0.35 * w} ${0.45 * l} ${-0.62 * w} ${0.68 * l} ${-0.45 * w} C${0.85 * l} ${-0.3 * w} ${0.95 * l} ${-0.1 * w} ${l} 0 C${0.95 * l} ${0.1 * w} ${0.85 * l} ${0.3 * w} ${0.68 * l} ${0.45 * w} C${0.45 * l} ${0.62 * w} ${0.12 * l} ${0.35 * w} 0 0 Z`;
  function spiralPts(cx, cy, R, turns, a0, dir) {
    const out = [], N = Math.max(14, Math.round(turns * 40));
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = a0 + dir * t * turns * TAU, r = R * (0.1 + 0.9 * t);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }
  // Points along a path, pushed sideways by off (positive = right of the direction of travel, y down).
  const offsetAlong = (d, gap, off) => along(d, gap).map((p) => ({ x: p.x - Math.sin(p.a) * off, y: p.y + Math.cos(p.a) * off, a: p.a }));
  const pathOf = (pts) => pts.reduce((s, p, i) => s + (i ? ' L' : 'M') + pt([p.x, p.y]), '');

  // ---------- shapes, traced from the photo ----------
  const PT = {
    body: [[251, 341], [276, 335], [305, 336], [330, 328], [362, 346], [405, 372], [450, 392], [520, 404], [620, 404], [760, 400], [880, 398], [912, 406], [940, 427], [971, 449], [1000, 467], [1025, 483], [1050, 505], [1080, 538], [1104, 560], [1126, 595], [1143, 628], [1154, 665], [1156, 700], [1135, 716], [1105, 722], [1092, 752], [1080, 785], [1072, 815], [1070, 845], [1066, 890], [1040, 935], [990, 946], [930, 938], [860, 922], [790, 912], [740, 905], [680, 895], [645, 880], [636, 845], [600, 836], [560, 831], [520, 826], [480, 822], [430, 826], [380, 845], [340, 800], [292, 770], [292, 740], [300, 700], [305, 660], [303, 620], [302, 592], [290, 582], [262, 575], [238, 562], [222, 548], [205, 540], [170, 545], [140, 548], [130, 545], [133, 520], [139, 497], [147, 475], [156, 455], [169, 437], [187, 420], [203, 405], [218, 392], [228, 368], [237, 352]],
    legNF: [[300, 690, 1], [440, 790, 1], [410, 858], [395, 878], [376, 890], [342, 904], [308, 927], [280, 960], [258, 995], [247, 1018], [241, 1040], [237, 1067], [230, 1087], [197, 1094], [150, 1094], [97, 1091], [77, 1081], [75, 1067], [90, 1047], [123, 1020], [147, 987], [160, 960], [172, 930], [195, 882], [225, 833], [252, 797], [275, 765], [290, 730]],
    legFF: [[380, 845, 1], [503, 808, 1], [530, 830], [545, 838], [577, 843], [590, 870], [594, 913], [590, 967], [583, 996], [567, 1001], [556, 982], [542, 962], [517, 942], [483, 940], [450, 933], [412, 914], [385, 890]],
    legNR: [[640, 860, 1], [775, 880, 1], [770, 942], [766, 970], [763, 1000], [762, 1030], [757, 1063], [745, 1080], [707, 1081], [666, 1077], [637, 1068], [620, 1055], [618, 1038], [624, 1026], [637, 1013], [649, 988], [657, 955], [662, 913], [645, 884], [636, 845]],
    legFR: [[990, 880, 1], [1070, 820, 1], [1080, 848], [1105, 872], [1137, 902], [1168, 926], [1186, 948], [1190, 975], [1180, 1003], [1160, 1030], [1132, 1052], [1108, 1060], [1094, 1050], [1078, 1028], [1063, 1003], [1052, 978], [1044, 950], [1030, 932]],
    trunk: [[150, 505], [128, 535], [118, 580], [110, 640], [104, 700], [98, 760], [98, 800], [108, 832], [130, 855], [160, 864], [190, 857], [212, 836], [220, 808], [216, 778], [204, 756], [190, 742], [182, 737, 1], [177, 748], [180, 768], [182, 792], [180, 812], [170, 824], [158, 822], [150, 808], [148, 785], [151, 762], [164, 744], [188, 722], [205, 690], [212, 650], [216, 610], [218, 570], [222, 540]],
    ear: [[372, 405], [405, 386], [455, 374], [500, 378], [528, 396], [541, 430], [538, 478], [525, 522], [503, 562], [474, 594], [452, 604], [438, 592], [424, 562], [404, 530], [384, 500], [372, 468], [366, 434]],
    cushion: [[326, 400, 1], [330, 345], [348, 302], [383, 279], [420, 280], [446, 302], [457, 345], [455, 400, 1]],
    headdress: [[128, 546, 1], [131, 520], [137, 496], [145, 473], [154, 453], [167, 435], [185, 418], [201, 403], [216, 389], [226, 366], [235, 349], [250, 338], [276, 332], [305, 333], [331, 325], [352, 345], [372, 370], [388, 386], [401, 396, 1], [388, 402], [363, 398], [338, 387], [313, 377], [282, 376], [255, 383], [236, 395], [222, 410], [208, 421], [193, 436], [181, 456], [173, 476], [168, 497], [165, 518], [161, 538], [152, 547, 1]],
    tusk: [[250, 518], [215, 528], [180, 540], [145, 552], [127, 558, 1], [124, 570], [129, 582, 1], [150, 575], [185, 561], [220, 549], [250, 539]],
    lip: [[263, 520], [259, 533], [251, 545], [241, 553], [236, 547], [240, 534], [249, 524]],
    jowl: [[256, 524], [280, 509], [310, 503], [345, 500], [376, 505], [400, 516], [412, 534], [402, 548], [372, 546], [336, 543], [306, 548], [290, 562], [268, 568], [252, 556]],
    howdah: [[590, 410, 1], [592, 330], [598, 300], [606, 287], [620, 284], [633, 292], [634, 310], [630, 322], [651, 345], [678, 358], [705, 363], [742, 360], [769, 349], [792, 331], [806, 306], [814, 282, 1], [800, 270], [795, 252], [800, 234], [815, 220], [845, 210], [885, 209], [912, 218], [926, 236], [922, 256], [910, 268], [905, 290], [906, 318], [913, 348], [925, 376], [940, 398], [945, 412, 1]],
    post: [[566, 410, 1], [566, 292], [570, 281], [577, 262, 1], [584, 281], [588, 292], [588, 410, 1]],
    blanket: [[905, 406], [935, 424], [971, 449], [1000, 467], [1022, 479], [960, 500], [905, 518]],
    tuft: [[1168, 760], [1190, 766], [1215, 782], [1238, 808], [1244, 835], [1236, 860], [1222, 885], [1211, 904], [1200, 882], [1186, 852], [1175, 820], [1167, 790]],
  };
  const D = {};
  for (const k in PT) D[k] = spline(PT[k]);
  const JQ = [[468, 416], [912, 400], [908, 872], [437, 812]]; // saddle cloth corners
  const EB = { x: 56, y: 160, w: 1210, h: 952 };

  // ---------- building blocks ----------

  // Wrinkle rings across a limb. axis runs from the top of the limb to the foot.
  function rings(P, g, clipD, axis, o) {
    const line = polyline(spline(axis, false), 1), n = line.length;
    g.save(); g.clip(new Path2D(clipD));
    for (let s = o.start ?? 5; s < n - 2; s += o.gap * P.r.range(0.7, 1.3)) {
      const i = Math.floor(s), p = line[i];
      const q = line[Math.min(n - 1, i + 3)], pp = line[Math.max(0, i - 3)];
      let tx = q[0] - pp[0], ty = q[1] - pp[1];
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const nx = -ty, ny = tx, bulge = o.bulge * P.r.range(0.6, 1.4);
      let a = -1.25;
      while (a < 1.25) {
        const b = Math.min(1.25, a + P.r.range(0.45, 1.5)), pts = [];
        for (let u = a; u <= b + 1e-6; u += 0.04) {
          const k = bulge * (1 - u * u);
          pts.push([p[0] + nx * u * o.half + tx * k, p[1] + ny * u * o.half + ty * k]);
        }
        if (pts.length > 3) {
          const w = P.r.range(o.w[0], o.w[1]);
          P.strokePts(pts.map(([x, y]) => [x - tx * w * 0.9, y - ty * w * 0.9]), { w: w * 0.8, color: '#0c0c0d', alpha: 0.5, taper: 6 });
          P.strokePts(pts, { w, color: o.color, alpha: P.r.range(o.alpha[0], o.alpha[1]), taper: 8 });
        }
        a = b + P.r.range(0.04, 0.3);
      }
    }
    g.restore();
  }

  // Toenails: pale domes on the sole line from a to b. inward = side the domes point to.
  function nails(P, a, b, n, h, inward) {
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const L = Math.hypot(tx, ty); tx /= L; ty /= L;
    const nx = -ty * inward, ny = tx * inward, w = (L / n) * 0.84;
    for (let i = 0; i < n; i++) {
      const c = L2(a, b, (i + 0.5) / n), hh = h * P.r.range(0.9, 1.08);
      const at = (u, k) => [c[0] + tx * u * w * 0.5 + nx * hh * k, c[1] + ty * u * w * 0.5 + ny * hh * k];
      const d = `M${pt(at(-1, 0))} C${pt(at(-1.08, 1.3))} ${pt(at(1.08, 1.3))} ${pt(at(1, 0))} Z`;
      P.fill(d, '#efe2c9', { mottle: 0.6, edge: false, blot: 0.4 });
      P.line(`M${pt(at(-0.55, 0.12))} C${pt(at(-0.6, 0.8))} ${pt(at(0.6, 0.8))} ${pt(at(0.55, 0.12))}`, { w: 1.5, color: '#9a7d6a', alpha: 0.9, taper: 4 });
      P.line(d, { w: 2.3 });
    }
  }

  function bell(P, x, y, r) {
    const d = ellipsePath(x, y, r, r * 0.96), g = P.ctx;
    P.fill(d, C.gold, { mottle: 0.5, edge: false, blot: 0.3 });
    g.save(); g.clip(new Path2D(d));
    g.fillStyle = rgba(C.goldD, 0.55);
    g.beginPath(); g.ellipse(x + r * 0.15, y + r * 0.5, r * 1.05, r * 0.62, 0, 0, TAU); g.fill();
    g.restore();
    P.dot(x - r * 0.35, y - r * 0.38, r * 0.22, '#fff3c4', { alpha: 0.85 });
    P.line(d, { w: Math.max(1.2, r * 0.17) });
    P.line(`M${pt([x - r * 0.55, y + r * 0.28])} Q${pt([x, y + r * 0.42])} ${pt([x + r * 0.55, y + r * 0.28])}`, { w: Math.max(1, r * 0.16), taper: 2 });
  }

  function goldBand(P, d, w, stones = true) {
    P.gold(band(d, w), { w: 1.8 });
    if (stones) for (const p of along(d, w * 1.25)) P.dot(p.x, p.y, w * 0.2, C.red, { ring: C.ink, ringW: 0.7, hi: true });
  }

  function rosette(P, x, y, r, col = C.white) {
    P.dot(x, y, r * 0.3, col, { ring: '#c9a14a', ringW: 0.6 });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; P.dot(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.27, col); }
  }

  // Twisted rope: coloured stripes on white. null in colors leaves white.
  function rope(P, d, w, colors) {
    const g = P.ctx, b = band(d, w);
    P.fill(b, C.white, { mottle: 0.3, edge: false });
    g.save(); g.clip(new Path2D(b));
    let i = 0;
    for (const p of along(d, w * 0.34)) {
      const c = colors[i++ % colors.length];
      if (!c) continue;
      const ca = Math.cos(p.a + 0.9), sa = Math.sin(p.a + 0.9);
      P.strokePts([[p.x - ca * w, p.y - sa * w], [p.x + ca * w, p.y + sa * w]], { w: w * 0.3, color: c, alpha: 0.95, taper: 0 });
    }
    // round shading
    for (const [off, col, a] of [[w * 0.32, '#000000', 0.22], [-w * 0.22, '#ffffff', 0.25]]) {
      P.strokePts(offsetAlong(d, 2, off).map((p) => [p.x, p.y]), { w: w * 0.3, color: col, alpha: a, taper: 0 });
    }
    g.restore();
    P.line(b, { w: 1.6 });
  }

  // Hand-cut ornament on gold: leaves, lotus buds, scrolls and dots.
  function carve(P, g, d, gap, col = C.carve) {
    const b = bbox(flatten(d, 4));
    g.save(); g.clip(new Path2D(d));
    let row = 0;
    for (let y = b.y0 + gap * 0.4; y < b.y1; y += gap * 0.86, row++) {
      for (let x = b.x0 + (row % 2) * gap * 0.5; x < b.x1; x += gap) {
        const cx = x + P.r.range(-gap, gap) * 0.18, cy = y + P.r.range(-gap, gap) * 0.18, t = P.r(), a = P.r() * TAU;
        if (t < 0.4) {
          withXf(g, cx, cy, a, () => {
            const l = gap * 0.7, w = gap * 0.32;
            P.line(leafD(l, w), { w: 1.1, color: col, alpha: 0.85, taper: 0 });
            P.line(`M${l * 0.1} 0 L${l * 0.85} 0`, { w: 0.8, color: col, alpha: 0.8, taper: 2 });
            for (let k = 0.3; k < 0.8; k += 0.18) {
              P.line(`M${l * k} 0 L${l * (k + 0.1)} ${-w * 0.35} M${l * k} 0 L${l * (k + 0.1)} ${w * 0.35}`, { w: 0.6, color: col, alpha: 0.7, taper: 0 });
            }
          });
        } else if (t < 0.65) {
          withXf(g, cx, cy, a, () => {
            const l = gap * 0.42;
            for (const s of [-0.65, 0, 0.65]) withXf(g, 0, 0, s, () => P.line(leafD(l, l * 0.55), { w: 1, color: col, alpha: 0.85, taper: 0 }));
            P.line(`M${-l * 0.35} ${-l * 0.4} Q${-l * 0.55} 0 ${-l * 0.35} ${l * 0.4}`, { w: 1, color: col, alpha: 0.8, taper: 2 });
          });
        } else if (t < 0.9) {
          P.strokePts(spiralPts(cx, cy, gap * 0.28, 1.3, a, P.r() < 0.5 ? 1 : -1), { w: 1.1, color: col, alpha: 0.85, taper: 4 });
        } else {
          for (let i = 0; i < 3; i++) P.dot(cx + Math.cos(a + i * 2.1) * 2.5, cy + Math.sin(a + i * 2.1) * 2.5, 1.2, col, { alpha: 0.85 });
        }
      }
    }
    g.restore();
  }

  // ---------- the elephant ----------

  function paintTail(P, g) {
    const t = band(spline([[1130, 680], [1142, 708], [1154, 736], [1170, 764]], false), 28, 16);
    P.fill(t, C.skin, { mottle: 0.5 });
    P.line(t, { w: 2.4 });
    P.fill(D.tuft, '#1d1d1f', { var: 0.6 });
    g.save(); g.clip(new Path2D(D.tuft));
    for (let i = 0; i < 70; i++) {
      const x0 = 1172 + P.r.range(-6, 10), y0 = 762 + P.r.range(0, 30), len = P.r.range(70, 150), a = 1.15 + P.r.range(-0.3, 0.2);
      const pts = [];
      for (let u = 0; u <= 1; u += 0.05) pts.push([x0 + Math.cos(a - u * 0.3) * len * u, y0 + Math.sin(a - u * 0.3) * len * u]);
      P.strokePts(pts, { w: P.r.range(1, 2.2), color: P.r() < 0.5 ? '#55595f' : '#0b0b0c', alpha: 0.6, taper: 12 });
    }
    g.restore();
    P.line(D.tuft, { w: 2.2, vary: 0.6, wobble: 1.2 });
  }

  function paintSkin(P, g) {
    const layer = document.createElement('canvas');
    layer.width = g.canvas.width; layer.height = g.canvas.height;
    const s = layer.getContext('2d');
    s.setTransform(g.getTransform());
    const SP = new Painter(s, 41);
    s.fillStyle = C.skin;
    for (const k of ['body', 'legFF', 'legFR', 'legNR', 'legNF', 'trunk']) s.fill(new Path2D(D[k]));
    s.globalCompositeOperation = 'source-atop';

    // broad light on the round parts
    const sheen = (x, y, rx, ry, a, col = '#767b84') => {
      s.save(); s.translate(x, y); s.scale(1, ry / rx);
      const gr = s.createRadialGradient(0, 0, 0, 0, 0, rx);
      gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
      s.fillStyle = gr; s.fillRect(-rx, -rx, 2 * rx, 2 * rx);
      s.restore();
    };
    sheen(262, 425, 100, 72, 0.75); sheen(300, 400, 50, 30, 0.35, '#9aa0a8'); sheen(330, 470, 60, 50, 0.25); sheen(150, 660, 45, 140, 0.4);
    sheen(1060, 600, 110, 150, 0.5); sheen(985, 820, 110, 90, 0.35); sheen(345, 720, 70, 90, 0.35);
    sheen(700, 880, 120, 50, 0.2); sheen(705, 1000, 50, 80, 0.25); sheen(1130, 960, 70, 80, 0.32);
    sheen(195, 980, 60, 90, 0.28); sheen(500, 880, 90, 50, 0.25);

    // mottled paint
    for (let k = 0; k < 3600; k++) {
      const x = SP.r.range(60, 1200), y = SP.r.range(320, 1100), rad = SP.r.range(4, 20);
      s.fillStyle = rgba(SP.r() < 0.5 ? '#4a4c52' : '#131315', SP.r.range(0.05, 0.16));
      s.beginPath(); s.ellipse(x, y, rad, rad * SP.r.range(0.4, 1), SP.r() * 3, 0, TAU); s.fill();
    }

    // soft brush strokes that follow the round form
    const circ = (cx, cy) => (x, y) => Math.atan2(y - cy, x - cx) + Math.PI / 2;
    s.filter = blur(2.5);
    SP.hatch(D.body, { field: circ(980, 690), count: 60, len: [60, 140], w: [5, 10], color: '#8d929b', alpha: 0.16, mask: (x) => smooth(960, 1040, x) });
    SP.hatch(D.body, { field: circ(690, 560), count: 90, len: [60, 140], w: [5, 10], color: '#8d929b', alpha: 0.14, mask: (x, y) => smooth(780, 860, y) });
    SP.hatch(D.body, { field: circ(300, 430), count: 40, len: [40, 90], w: [5, 9], color: '#8d929b', alpha: 0.16, mask: (x, y) => (1 - smooth(330, 360, x)) * (1 - smooth(470, 500, y)) });
    s.filter = 'none';

    // wrinkles on the legs
    const LEG = { gap: 15, half: 70, bulge: 7, w: [1.6, 3.2], color: '#70747b', alpha: [0.4, 0.75] };
    rings(SP, s, D.legNF, [[300, 805], [266, 880], [212, 960], [186, 1030]], { ...LEG, half: 72 });
    rings(SP, s, D.legNR, [[702, 878], [706, 960], [700, 1050]], { ...LEG, half: 62 });
    rings(SP, s, D.legFR, [[1050, 875], [1090, 935], [1125, 1000]], { ...LEG, half: 62 });
    rings(SP, s, D.legFF, [[395, 878], [460, 874], [530, 880]], { ...LEG, half: 60, start: 8 });
    rings(SP, s, D.legFF, [[552, 880], [572, 930], [576, 985]], { ...LEG, half: 30, gap: 13, bulge: 4 });

    // the trunk: grey front, pink ridged underside
    const TR = { gap: 6.5, half: 50, bulge: 4, w: [0.9, 1.8], color: '#82868d', alpha: [0.3, 0.6] };
    rings(SP, s, D.trunk, [[176, 528], [160, 600], [146, 690], [130, 770], [128, 815]], TR);
    const under = spline([[224, 536], [219, 570], [217, 610], [213, 650], [205, 690], [188, 722], [162, 744], [150, 765], [147, 790], [152, 812], [165, 828]], false);
    const ub = band(under, 30, 22);
    s.save(); s.clip(new Path2D(ub));
    s.fillStyle = rgba('#a57d70', 0.85); s.fill(new Path2D(ub));
    for (const p of along(under, 3.1)) {
      const ca = Math.cos(p.a + Math.PI / 2), sa = Math.sin(p.a + Math.PI / 2);
      SP.strokePts([[p.x - ca * 16, p.y - sa * 16], [p.x + ca * 16, p.y + sa * 16]], { w: SP.r.range(0.8, 1.4), color: '#2a1a16', alpha: 0.75, taper: 3 });
    }
    s.restore();
    SP.stipple(D.trunk, { count: 900, r: [0.7, 1.8], color: PINKS, alpha: [0.45, 0.9], mask: (x, y) => (1 - smooth(10, 40, Math.hypot(x - 190, y - 752))) + 0.35 * smooth(150, 170, x) * (1 - smooth(700, 760, y)) });
    // the curl
    rings(SP, s, D.trunk, [[150, 842], [190, 838], [208, 805], [196, 760]], { ...TR, half: 22, start: 8 });

    // creases on belly, chest and rump
    SP.hatch(D.body, { field: circ(690, 560), count: 380, len: [24, 70], w: [1.3, 2.8], color: '#6a6e75', alpha: 0.5, mask: (x, y) => smooth(640, 760, y) });
    SP.hatch(D.body, { field: circ(980, 690), count: 160, len: [20, 56], w: [1.3, 2.6], color: '#6a6e75', alpha: 0.5, mask: (x) => smooth(980, 1040, x) });
    SP.hatch(D.body, { field: (x, y) => 0.05, count: 70, len: [12, 26], w: [0.9, 1.5], color: '#7e8289', alpha: 0.55, mask: (x, y) => (x > 300 && x < 360 && y > 590 && y < 690) ? 1 : 0 });

    // freckled pink skin: cheek, throat, forehead front
    SP.stipple(D.body, { count: 2600, r: [0.8, 2.3], color: PINKS, alpha: [0.6, 1], mask: (x, y) => 1 - smooth(0.55, 1, Math.hypot((x - 255) / 58, (y - 496) / 30)) });
    SP.stipple(D.body, { count: 900, r: [0.7, 1.9], color: PINKS, alpha: [0.5, 0.9], mask: (x, y) => (x > 298 && x < 356 && y > 588 && y < 690) ? 0.9 : 0 });
    SP.stipple(D.body, { count: 300, r: [0.8, 2], color: ['#151313'], alpha: [0.5, 0.9], mask: (x, y) => 1 - smooth(0.5, 1, Math.hypot((x - 252) / 50, (y - 494) / 22)) });

    // pink fold where the hind leg meets the belly
    const fold = spline([[1030, 700], [1013, 750], [996, 793], [975, 835], [944, 877], [906, 903]], false);
    const fb = band(fold, 13, 26);
    s.save(); s.clip(new Path2D(fb));
    s.fillStyle = rgba('#b48676', 0.8); s.fill(new Path2D(fb));
    for (const p of along(fold, 3)) {
      const ca = Math.cos(p.a + Math.PI / 2), sa = Math.sin(p.a + Math.PI / 2);
      SP.strokePts([[p.x - ca * 14, p.y - sa * 14], [p.x + ca * 14, p.y + sa * 14]], { w: 1, color: '#2a1a16', alpha: 0.7, taper: 3 });
    }
    s.restore();

    s.globalCompositeOperation = 'source-over';
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(layer, 0, 0); g.restore();
  }

  function paintOutlines(P) {
    const W = 3.1;
    P.line(openEdge(PT.body, 15, 28), { w: W });
    P.line(openEdge(PT.body, 30, 34), { w: W });
    P.line(openEdge(PT.body, 47, 55), { w: W });
    P.line(openEdge(PT.legNF, 4, 27), { w: W });
    P.line(openEdge(PT.legFF, 2, 16), { w: W });
    P.line(openEdge(PT.legNR, 2, 19), { w: W });
    P.line(openEdge(PT.legFR, 2, 17), { w: W });
    P.line(openEdge(PT.trunk, 0, PT.trunk.length - 1), { w: 2.8 });
    // nostril and mouth corner
    P.line(ellipsePath(186, 748, 5, 3, -0.9), { w: 1.5 });
    P.dot(181, 757, 2.2, C.ink);
    P.line(spline([[296, 462], [305, 474], [302, 489]], false), { w: 2.6, taper: 4 });
  }

  function paintFeet(P) {
    nails(P, [77, 1078], [200, 1093], 3, 25, -1);
    nails(P, [620, 1060], [716, 1081], 3, 24, -1);
    nails(P, [592, 888], [586, 998], 3, 21, 1);
    nails(P, [1100, 1058], [1185, 998], 3, 22, -1);

    // gold anklets with bells on the front legs
    const a1 = spline([[143, 982], [176, 997], [210, 1010], [244, 1020]], false);
    for (const p of offsetAlong(a1, 19, 14)) bell(P, p.x, p.y, 9.5);
    goldBand(P, a1, 17);
    const a2 = spline([[512, 836], [520, 878], [525, 920], [530, 958]], false);
    for (const p of offsetAlong(a2, 19, -13)) bell(P, p.x, p.y, 9);
    goldBand(P, a2, 16);

    // red cloth bands on the hind legs
    for (const d of [spline([[652, 922], [700, 934], [740, 944], [772, 948]], false), spline([[1052, 960], [1072, 932], [1092, 903], [1110, 878]], false)]) {
      const b = band(d, 22);
      P.fill(b, C.red, { var: 0.8 });
      P.line(spline(along(d, 4).map((p) => [p.x - Math.sin(p.a) * 5, p.y + Math.cos(p.a) * 5]), false), { w: 2, color: '#6e1014', alpha: 0.7 });
      const m = along(d, 4), q = m[Math.floor(m.length * 0.55)];
      for (const o of [-3, 3]) P.line(`M${pt([q.x + Math.cos(q.a) * o - Math.sin(q.a) * 11, q.y + Math.sin(q.a) * o + Math.cos(q.a) * 11])} L${pt([q.x + Math.cos(q.a) * o + Math.sin(q.a) * 11, q.y + Math.sin(q.a) * o - Math.cos(q.a) * 11])}`, { w: 1.6, taper: 0 });
      P.line(b, { w: 2.3 });
    }
  }

  function paintJhool(P, g) {
    const R = (d) => inset(JQ, d);
    const ringD = (a, b) => poly(R(a)) + ' ' + poly(R(b).slice().reverse());
    const MC = [660, 637], MR = 74;

    // centre: salmon drape hanging in nested swags, gathered toward the upper right
    const Cn = R(58), cD = poly(Cn);
    P.fill(cD, C.pink, { var: 0.8, angle: 0.4 });
    g.save(); g.clip(new Path2D(cD));
    const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
    const eL = dist(Cn[0], Cn[3]), eB = dist(Cn[3], Cn[2]);
    const leftAt = (t) => { const d = t * (eL + eB); return d < eL ? L2(Cn[0], Cn[3], d / eL) : L2(Cn[3], Cn[2], (d - eL) / eB); };
    const NS = 90, nz = M.noise1(91);
    const swag = (t) => {
      const p0 = leftAt(t), p1 = L2(Cn[1], Cn[2], 0.015 + 0.8 * Math.pow(t, 1.15));
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy) || 1;
      const sag = len * (0.03 + 0.31 * Math.min(1, t / 0.3) - 0.12 * t), c = [(p0[0] + p1[0]) / 2 - (dy / len) * sag, (p0[1] + p1[1]) / 2 + (dx / len) * sag];
      const pts = [];
      for (let i = 0; i <= NS; i++) { const u = i / NS, v = 1 - u, w = 1.5 * Math.sin(u * Math.PI) * nz(u * 3 + t * 40); pts.push([v * v * p0[0] + 2 * v * u * c[0] + u * u * p1[0], v * v * p0[1] + 2 * v * u * c[1] + u * u * p1[1] + w]); }
      return pts;
    };
    const NF = 23, curves = [];
    for (let i = 0; i <= NS; i++) curves.push(null);
    curves.length = 0;
    curves.push(Array.from({ length: NS + 1 }, (_, i) => L2([Cn[0][0] - 20, Cn[0][1] - 20], [Cn[1][0] + 20, Cn[1][1] - 20], i / NS)));
    for (let k = 1; k <= NF; k++) curves.push(swag(Math.pow(k / NF, 1.05) * 0.995));
    curves.push(Array.from({ length: NS + 1 }, () => [Cn[2][0] + 20, Cn[2][1] + 20]));
    const mid = (A, B, f) => A.map((p, i) => [lerp(p[0], B[i][0], f), lerp(p[1], B[i][1], f)]);
    // shading goes on its own layer, clipped band by band, then blurred once
    const lay = document.createElement('canvas'); lay.width = g.canvas.width; lay.height = g.canvas.height;
    const lg = lay.getContext('2d'); lg.setTransform(g.getTransform());
    const LP = new Painter(lg, 59);
    for (let k = 0; k < curves.length - 1; k++) {
      const A = curves[k], B = curves[k + 1];
      lg.save(); lg.clip(new Path2D(poly(A.concat(B.slice().reverse()))));
      let gs = 0; for (let i = 0; i < A.length; i += 10) gs += Math.hypot(B[i][0] - A[i][0], B[i][1] - A[i][1]);
      const gw = Math.max(3, Math.min(9, (gs / Math.ceil(A.length / 10)) * 0.16));
      for (let f = 0.55; f <= 1.001; f += 0.09) LP.strokePts(mid(A, B, f), { w: gw * 1.3, color: '#7d2a22', alpha: 0.1 + (f - 0.55) * 0.9, taper: 0 });
      LP.strokePts(A, { w: gw, color: '#9c3d31', alpha: 0.3, taper: 0 });
      for (const f of [0.2, 0.3, 0.4]) LP.strokePts(mid(A, B, f), { w: gw * 1.2, color: '#fcc6a8', alpha: 0.45, taper: 0 });
      lg.restore();
    }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = blur(2.6); g.drawImage(lay, 0, 0); g.filter = 'none'; g.restore();
    for (let k = 1; k < curves.length - 1; k++) P.strokePts(curves[k], { w: 1.7, color: '#7a3128', alpha: 0.85, taper: 8 });
    // a white running scroll on each fold: a thin wavy vine with a curl at every crest
    for (let k = 0; k < curves.length - 2; k++) {
      const A = curves[k], B = curves[k + 1], N = A.length - 1;
      const ml = mid(A, B, 0.42), line = resample(ml, 1), L = line.length;
      const gapAt = (j) => { const i = Math.min(N, Math.round((j / L) * N)); return Math.hypot(B[i][0] - A[i][0], B[i][1] - A[i][1]); };
      const per = 26, ph = (k * 7) % per;
      let vine = [];
      const flush = () => { if (vine.length > 5) P.strokePts(vine, { w: 1, color: C.white, alpha: 0.9, taper: 3 }); vine = []; };
      for (let j = 1; j < L - 1; j++) {
        const [x, y] = line[j], gp = gapAt(j);
        if (gp < 13 || Math.hypot(x - MC[0], y - MC[1]) < MR + 10) { flush(); continue; }
        const ta = Math.atan2(line[j + 1][1] - line[j - 1][1], line[j + 1][0] - line[j - 1][0]), nx = -Math.sin(ta), ny = Math.cos(ta);
        const amp = Math.min(3, gp * 0.1), u = ((j + ph) / per) * TAU, w = Math.sin(u) * amp;
        vine.push([x + nx * w, y + ny * w]);
        if ((j + ph) % (per / 2) === Math.round(per / 4)) {
          const side = Math.sin(u) > 0 ? 1 : -1, r = Math.min(4.6, gp * 0.18);
          const cx0 = x + nx * w, cy0 = y + ny * w;
          const ccx = cx0 + nx * side * r * 1.05 + Math.cos(ta) * r * 0.5, ccy = cy0 + ny * side * r * 1.05 + Math.sin(ta) * r * 0.5;
          const e = Math.atan2(cy0 - ccy, cx0 - ccx), dir = side, turns = 1.3;
          P.strokePts(spiralPts(ccx, ccy, r, turns, e - dir * turns * TAU, dir).reverse(), { w: 1, color: C.white, alpha: 0.92, taper: 3 });
          P.dot(x - nx * side * (amp + 3.2), y - ny * side * (amp + 3.2), 1.15, P.r() < 0.5 ? '#f2cf5a' : C.white);
        }
      }
      flush();
    }
    P.stipple(cD, { count: 900, r: [0.6, 1.3], color: ['#b8433a', '#c9563f'], alpha: [0.4, 0.8] });
    g.restore();

    // borders, outside to inside
    const sideMid = (a, b) => { const m = R((a + b) / 2); return [0, 1, 2, 3].map((i) => [m[i], m[(i + 1) % 4]]); };
    P.gold(ringD(0, 7), { w: 0.1, line: false });
    for (const [a, b] of sideMid(0, 7)) for (const p of along(`M${pt(a)} L${pt(b)}`, 8)) P.dot(p.x, p.y, 1.4, C.ink);
    // green band with white leaf pairs and little flowers
    P.fill(ringD(7, 24), C.green, { var: 0.8 });
    g.save(); g.clip(new Path2D(ringD(7, 24)));
    for (const [a, b] of sideMid(7, 24)) {
      let i = 0;
      for (const p of along(`M${pt(a)} L${pt(b)}`, 11)) {
        if (i++ % 4 === 3) { rosette(P, p.x, p.y, 3.4); P.dot(p.x, p.y, 1.5, '#f2cf5a'); continue; }
        for (const sgn of [-1, 1]) withXf(g, p.x, p.y, p.a + sgn * 0.75, () => P.fill(leafD(8.5, 4.2), C.white, { mottle: 0 }));
      }
    }
    g.restore();
    P.gold(ringD(24, 29), { line: false });
    // blue band with a white flowering vine
    P.fill(ringD(29, 53), C.blue, { var: 0.8 });
    g.save(); g.clip(new Path2D(ringD(29, 53)));
    for (const [a, b] of sideMid(29, 53)) {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / L, ty = (b[1] - a[1]) / L, nx = -ty, ny = tx;
      const per = 30, amp = 5.5, wave = [];
      for (let s = 0; s <= L; s += 2) { const w = Math.sin((s / per) * TAU) * amp; wave.push([a[0] + tx * s + nx * w, a[1] + ty * s + ny * w]); }
      P.strokePts(wave, { w: 1.3, color: C.white, alpha: 0.95, taper: 0 });
      for (let s = per / 4; s < L; s += per / 2) {
        const side = Math.sin((s / per) * TAU) > 0 ? -1 : 1;
        const fx = a[0] + tx * s + nx * side * 4.5, fy = a[1] + ty * s + ny * side * 4.5;
        for (let i = 0; i < 5; i++) { const an = (i / 5) * TAU; P.dot(fx + Math.cos(an) * 3.1, fy + Math.sin(an) * 3.1, 1.6, C.white); }
        P.dot(fx, fy, 1.2, '#f2cf5a');
        withXf(g, a[0] + tx * (s + per / 4) - nx * side, a[1] + ty * (s + per / 4) - ny * side, Math.atan2(ty, tx) + side * 0.9, () => P.fill(leafD(6.5, 3.5), C.white, { mottle: 0 }));
      }
    }
    g.restore();
    P.gold(ringD(53, 58), { line: false });
    for (const [a, b] of sideMid(53, 58)) for (const p of along(`M${pt(a)} L${pt(b)}`, 10)) P.dot(p.x, p.y, 1.3, C.red);
    for (const d of [0, 7, 24, 29, 53, 58]) P.line(poly(R(d)), { w: d === 0 ? 2.8 : 1.3, wobble: 0.3 });

    // gold drops along the bottom edge
    for (const p of along(`M${pt(JQ[3])} L${pt(JQ[2])}`, 17)) {
      withXf(g, p.x, p.y + 1, Math.PI / 2 + 0.05, () => P.gold(leafD(15, 9), { w: 1.2 }));
      P.dot(p.x, p.y + 2, 2.1, C.red, { ring: C.ink, ringW: 0.6 });
    }
    surya(P, g, MC[0], MC[1], MR);
  }

  // The sun face, emblem of Mewar.
  function surya(P, g, cx, cy, R) {
    P.fill(ellipsePath(cx, cy, R), '#1c2440', { mottle: 0.3, edge: false });
    const disc = ellipsePath(cx, cy, R * 0.955);
    P.gold(disc, { base: '#d7a53a', w: 1.4 });
    for (let i = 0; i < 110; i++) {
      const a = (i / 110) * TAU, r0 = R * (i % 2 ? 0.66 : 0.62);
      P.strokePts([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9]], { w: 0.8, color: '#5a3a0c', alpha: 0.85, taper: 0 });
    }
    for (const p of along(ellipsePath(cx, cy, R * 0.6), 4.5)) P.dot(p.x, p.y, 1.1, C.ink);
    const F = R * 0.62, fy = cy + R * 0.12, X = (u) => cx + u * F, Y = (v) => fy + v * F;
    // tall crown: spires with jewels over a jewelled band
    const crown = `M${X(-0.72)} ${Y(-0.46)} L${X(-0.86)} ${Y(-0.96)} Q${X(-0.7)} ${Y(-0.86)} ${X(-0.58)} ${Y(-0.84)} L${X(-0.46)} ${Y(-1.16)} Q${X(-0.36)} ${Y(-0.98)} ${X(-0.24)} ${Y(-0.96)} L${X(0)} ${Y(-1.42)} L${X(0.24)} ${Y(-0.96)} Q${X(0.36)} ${Y(-0.98)} ${X(0.46)} ${Y(-1.16)} L${X(0.58)} ${Y(-0.84)} Q${X(0.7)} ${Y(-0.86)} ${X(0.86)} ${Y(-0.96)} L${X(0.72)} ${Y(-0.46)} Q${X(0)} ${Y(-0.62)} ${X(-0.72)} ${Y(-0.46)} Z`;
    P.gold(crown, { base: '#e2b141', w: 1.1 });
    P.line(`M${X(-0.74)} ${Y(-0.62)} Q${X(0)} ${Y(-0.8)} ${X(0.74)} ${Y(-0.62)}`, { w: 0.9, taper: 0 });
    for (const u of [-0.56, -0.28, 0, 0.28, 0.56]) P.dot(X(u), Y(-0.69 - 0.08 * (1 - Math.abs(u))), F * 0.055, u === 0 ? C.green : C.red, { ring: C.ink, ringW: 0.5 });
    for (const [u, v] of [[-0.46, -1.16], [0, -1.42], [0.46, -1.16], [-0.86, -0.96], [0.86, -0.96]]) P.dot(X(u), Y(v), F * 0.05, '#f2cf5a', { ring: C.ink, ringW: 0.5 });
    P.dot(X(0), Y(-1.0), F * 0.08, C.red, { ring: C.ink, ringW: 0.5, hi: true });
    const face = ellipsePath(cx, fy + F * 0.04, F * 0.92, F * 0.98);
    P.fill(face, '#f1c64a', { mottle: 0.5, edge: false });
    g.save(); g.clip(new Path2D(face));
    const gr = g.createRadialGradient(cx, fy + F * 0.3, 0, cx, fy + F * 0.3, F);
    gr.addColorStop(0, 'rgba(240,150,70,0.12)'); gr.addColorStop(0.62, 'rgba(200,110,40,0.05)'); gr.addColorStop(1, 'rgba(150,70,20,0.55)');
    g.fillStyle = gr; g.fillRect(cx - F, fy - F, 2 * F, 2 * F);
    g.restore();
    P.line(face, { w: 1.4 });
    for (const s of [-1, 1]) {
      P.fill(`M${X(s * 0.1)} ${Y(-0.24)} Q${X(s * 0.32)} ${Y(-0.44)} ${X(s * 0.6)} ${Y(-0.26)} Q${X(s * 0.34)} ${Y(-0.36)} ${X(s * 0.1)} ${Y(-0.24)} Z`, C.ink, { mottle: 0 });
      const eye = `M${X(s * 0.12)} ${Y(-0.08)} Q${X(s * 0.32)} ${Y(-0.24)} ${X(s * 0.54)} ${Y(-0.1)} Q${X(s * 0.34)} ${Y(0.02)} ${X(s * 0.12)} ${Y(-0.08)} Z`;
      P.fill(eye, C.white, { mottle: 0 });
      P.dot(X(s * 0.31), Y(-0.1), F * 0.07, C.ink);
      P.line(eye, { w: 1, taper: 0 });
      P.line(`M${X(s * 0.12)} ${Y(-0.09)} Q${X(s * 0.32)} ${Y(-0.25)} ${X(s * 0.56)} ${Y(-0.11)}`, { w: 1.8, taper: 2 });
      withXf(g, X(s * 0.95), Y(0.16), 0, () => { P.gold(ellipsePath(0, F * 0.08, F * 0.07, F * 0.12), { w: 0.8 }); P.dot(0, F * 0.1, F * 0.04, C.red); });
      P.dot(X(s * 0.93), Y(0.02), F * 0.045, C.white, { ring: C.ink, ringW: 0.4 });
    }
    P.line(`M${X(0.02)} ${Y(-0.12)} L${X(-0.07)} ${Y(0.2)} Q${X(0)} ${Y(0.25)} ${X(0.08)} ${Y(0.2)}`, { w: 1.1, taper: 2 });
    P.line(`M${X(0)} ${Y(-0.56)} L${X(0)} ${Y(-0.36)}`, { w: 2.2, color: C.red, taper: 1 });
    const mo = `M${X(0)} ${Y(0.3)} C${X(-0.2)} ${Y(0.22)} ${X(-0.42)} ${Y(0.26)} ${X(-0.55)} ${Y(0.36)} C${X(-0.62)} ${Y(0.42)} ${X(-0.72)} ${Y(0.34)} ${X(-0.66)} ${Y(0.24)} C${X(-0.7)} ${Y(0.44)} ${X(-0.46)} ${Y(0.46)} ${X(-0.3)} ${Y(0.4)} C${X(-0.15)} ${Y(0.37)} ${X(-0.06)} ${Y(0.38)} ${X(0)} ${Y(0.36)} C${X(0.06)} ${Y(0.38)} ${X(0.15)} ${Y(0.37)} ${X(0.3)} ${Y(0.4)} C${X(0.46)} ${Y(0.46)} ${X(0.7)} ${Y(0.44)} ${X(0.66)} ${Y(0.24)} C${X(0.72)} ${Y(0.34)} ${X(0.62)} ${Y(0.42)} ${X(0.55)} ${Y(0.36)} C${X(0.42)} ${Y(0.26)} ${X(0.2)} ${Y(0.22)} ${X(0)} ${Y(0.3)} Z`;
    P.fill(mo, '#1b1714', { mottle: 0 });
    P.fill(`M${X(-0.2)} ${Y(0.5)} Q${X(-0.08)} ${Y(0.45)} ${X(0)} ${Y(0.48)} Q${X(0.08)} ${Y(0.45)} ${X(0.2)} ${Y(0.5)} Q${X(0)} ${Y(0.68)} ${X(-0.2)} ${Y(0.5)} Z`, '#b8322a', { mottle: 0 });
    P.line(`M${X(-0.18)} ${Y(0.51)} Q${X(0)} ${Y(0.55)} ${X(0.18)} ${Y(0.51)}`, { w: 0.9, taper: 2 });
  }

  function paintBlanket(P, g) {
    P.fill(D.blanket, C.pink, { var: 0.8 });
    g.save(); g.clip(new Path2D(D.blanket));
    for (let k = 0; k < 4; k++) {
      const c = spline([[900, 418 + k * 24], [950, 432 + k * 20], [1000, 452 + k * 14], [1030, 470 + k * 8]], false);
      g.filter = blur(3); P.strokePts(polyline(c, 1.4).map(([x, y]) => [x, y - 6]), { w: 9, color: C.pinkL, alpha: 0.5, taper: 0 }); g.filter = 'none';
      P.line(c, { w: 1.4, color: '#7d362f', alpha: 0.8 });
    }
    P.stipple(D.blanket, { count: 500, r: [1, 2.2], color: ['#b8433a', '#c9563f', '#e0a050'], alpha: [0.6, 0.95] });
    for (let y = 412; y < 520; y += 17) for (let x = 905 + (y % 2) * 8; x < 1030; x += 18) P.dot(x + P.r.range(-3, 3), y + P.r.range(-3, 3), 1.5, C.white, { alpha: 0.9 });
    g.restore();
    P.line(D.blanket, { w: 2.4 });

    // the band along its lower edge
    const bandD = spline([[905, 516, 1], [960, 496], [1018, 470, 1], [1056, 512, 1], [985, 538], [905, 563, 1]]);
    const mid = spline([[905, 540], [960, 518], [1036, 491]], false);
    P.gold(bandD, { w: 0.1, line: false });
    g.save(); g.clip(new Path2D(bandD));
    const gb = band(mid, 30);
    P.fill(gb, C.green, { var: 0.7 });
    for (const p of along(mid, 11)) {
      for (const s of [-1, 1]) withXf(g, p.x, p.y, p.a + s * 0.8, () => P.fill(leafD(9, 4.4), C.white, { mottle: 0 }));
    }
    for (const p of along(mid, 33).slice(1)) { rosette(P, p.x, p.y, 4.4); P.dot(p.x, p.y, 2, '#f2cf5a'); }
    for (const off of [-19, 19]) for (const p of offsetAlong(mid, 7, off)) P.dot(p.x, p.y, 1.3, C.ink);
    g.restore();
    P.line(gb, { w: 1.2 });
    P.line(bandD, { w: 2 });

    // gold finials on the rump with a string of pearls between them
    for (const p of along(spline([[1068, 508], [1072, 530], [1088, 541]], false), 5.5)) P.dot(p.x, p.y, 2.4, C.white, { ring: '#7f6a48', ringW: 0.5 });
    for (const [x, y, a] of [[1030, 471, -0.85], [1064, 500, -0.6], [1088, 535, -0.35]]) {
      withXf(g, x, y, a, () => {
        const ball = ellipsePath(0, -12, 12, 11);
        P.gold(ball, { w: 1.6 });
        for (const u of [-6, 0, 6]) P.line(`M${u} -22 Q${u * 1.6} -12 ${u} -2`, { w: 0.9, color: C.carve, alpha: 0.8, taper: 0 });
        P.line('M-9 -14 Q0 -10 9 -14', { w: 1, color: C.carve, alpha: 0.8, taper: 0 });
        P.line('M0 -23 L2 -34', { w: 1.8, taper: 3 });
      });
    }
  }

  // Leaf pendant: three gold lobes with a red jewel.
  function trefoil(P, g, x, y, a, s) {
    withXf(g, x, y, a, () => {
      for (const t of [-0.55, 0, 0.55]) withXf(g, 0, 0, t, () => P.gold(leafD(15 * s, 9 * s), { w: 1.1 }));
      P.fill(leafD(9 * s, 4 * s), '#2f7d4f', { mottle: 0 });
      P.dot(4 * s, 0, 2.5 * s, C.red, { ring: C.ink, ringW: 0.6, hi: true });
    });
  }

  function paintHarness(P, g) {
    // bell band
    const bb = spline([[910, 650], [922, 698], [953, 735], [995, 750], [1048, 753], [1095, 740], [1110, 720]], false);
    for (const p of offsetAlong(bb, 19, 11).slice(1, -1)) bell(P, p.x, p.y, 8.5);
    goldBand(P, bb, 9);
    // main band, with leaf pendants on its outer side
    const mb = spline([[940, 556], [955, 598], [978, 632], [1010, 660], [1050, 680], [1100, 694]], false);
    for (const p of offsetAlong(mb, 31, 17).slice(1)) trefoil(P, g, p.x, p.y, (p.a + Math.PI / 2) * 0.6 + (Math.PI / 2) * 0.4, 1);
    rope(P, spline([[956, 547], [970, 584], [993, 617], [1026, 644], [1062, 663], [1104, 679]], false), 15, ['#8d969c', null]);
    P.gold(band(mb, 17), { w: 1.8 });
    along(mb, 13).forEach((p, i) => {
      if (i % 2) P.dot(p.x, p.y, 3.4, C.red, { ring: C.ink, ringW: 0.7, hi: true });
      else withXf(g, p.x, p.y, p.a, () => P.fill(ellipsePath(0, 0, 4.6, 2.8), '#6f8fa8', { mottle: 0 }));
    });
  }

  function paintHowdah(P, g) {
    // the post at the front
    P.gold(D.post, { base: '#cf9c38', w: 2.2 });
    for (const y of [300, 330, 390]) P.line(`M567 ${y} L587 ${y}`, { w: 1.3, color: C.carve, taper: 0 });
    for (let y = 340; y < 385; y += 6) P.line(`M569 ${y} L585 ${y + 4}`, { w: 0.9, color: C.carve, alpha: 0.8, taper: 0 });
    P.dot(577, 260, 3, C.gold, { ring: C.ink, ringW: 0.8 });

    P.gold(D.howdah, { base: '#c18a2c', w: 0.1, line: false });
    carve(P, g, D.howdah, 19);
    // feather band along the seat curve
    const seat = openEdge(PT.howdah, 7, 15);
    g.save(); g.clip(new Path2D(D.howdah));
    const inner = offsetAlong(seat, 3, 12);
    P.strokePts(inner.map((p) => [p.x, p.y]), { w: 1.4, color: C.carve, alpha: 0.9, taper: 0 });
    for (const p of offsetAlong(seat, 6, 6)) {
      const ca = Math.cos(p.a), sa = Math.sin(p.a), nx = -sa, ny = ca;
      P.strokePts([[p.x - nx * 5 - ca * 3, p.y - ny * 5 - sa * 3], [p.x, p.y], [p.x - nx * 5 + ca * 3, p.y - ny * 5 + sa * 3]], { w: 0.9, color: C.carve, alpha: 0.85, taper: 0 });
    }
    // the rolled cushion on top of the back rest
    P.line(spline([[810, 272], [850, 274], [890, 271], [912, 266]], false), { w: 1.8, color: C.carve });
    P.line(spline([[818, 226], [850, 217], [888, 216], [915, 226]], false), { w: 1.2, color: C.carve, alpha: 0.8 });
    g.restore();
    P.strokePts(spiralPts(808, 246, 15, 1.4, 2.4, -1), { w: 2, color: C.ink, taper: 6 });
    P.strokePts(spiralPts(618, 301, 14, 1.4, 2.4, 1), { w: 1.8, color: C.ink, taper: 5 });
    P.line(D.howdah, { w: 2.8 });
    // the base, with a row of arches
    const base = poly([[582, 384], [948, 382], [949, 414], [581, 417]]);
    P.gold(base, { base: '#dcae48', w: 2.4 });
    P.line('M583 391 L948 389', { w: 1.2, taper: 0 });
    for (let x = 586; x < 942; x += 15) {
      P.line(`M${x} 391 Q${x + 7.5} 408 ${x + 15} 391`, { w: 1.2, color: C.carve, taper: 0 });
      P.dot(x + 7.5, 397, 1.4, C.red);
    }
  }

  function paintRider(P, g) {
    const R = {
      skirt: spline([[488, 392], [548, 384], [592, 404], [618, 450], [633, 505], [630, 550, 1], [592, 553], [548, 542], [512, 516], [490, 474], [482, 432]]),
      thigh: spline([[550, 360], [506, 343], [466, 340], [451, 350], [456, 367], [492, 377], [532, 388]]),
      torso: spline([[503, 268], [528, 261], [555, 270], [567, 298], [570, 340], [566, 388, 1], [498, 390, 1], [494, 344], [494, 302]]),
      face: spline([[506, 221], [501, 229], [495, 238], [492, 241], [497, 244], [497, 247], [500, 250], [499, 254], [503, 259], [514, 263], [526, 257], [530, 240], [525, 222]]),
      beard: spline([[498, 251], [502, 260], [511, 268], [524, 265], [531, 250], [529, 236], [522, 238], [517, 251], [507, 253]]),
      turban: spline([[495, 229], [497, 212], [509, 199], [530, 192], [552, 197], [562, 212], [559, 229], [541, 236], [522, 235], [506, 233]]),
    };
    P.fill(R.skirt, '#7fa5c9', { var: 0.7, angle: 1.1 });
    g.save(); g.clip(new Path2D(R.skirt));
    const hem = polyline(spline([[480, 430], [490, 474], [512, 516], [548, 542], [592, 553], [631, 550], [634, 505], [619, 450]], false), 1);
    for (let i = 0; i < 22; i++) {
      const u = i / 21, e = hem[Math.min(hem.length - 1, Math.round(u * (hem.length - 1)))];
      const st = L2([492, 392], [548, 386], 0.2 + u * 0.7);
      P.strokePts([st, e], { w: 2.4, color: '#c8dbeb', alpha: 0.55, taper: 10 });
      P.strokePts([[st[0] + 3, st[1]], [e[0] + 4, e[1]]], { w: 1.3, color: '#36598b', alpha: 0.9, taper: 8 });
    }
    g.strokeStyle = rgba(C.gold); g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); hem.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    g.restore();
    P.line(R.skirt, { w: 2.2 });
    P.fill(R.thigh, C.jama, { var: 0.6 });
    g.save(); g.clip(new Path2D(R.thigh));
    for (let y = 338; y < 392; y += 6) P.strokePts([[446, y], [556, y + 6]], { w: 1.3, color: C.jamaD, alpha: 0.85, taper: 0 });
    g.restore();
    P.line(R.thigh, { w: 1.9 });
    P.fill(ellipsePath(474, 352, 10, 7.5, -0.2), C.flesh, { mottle: 0.3 });
    P.line(ellipsePath(474, 352, 10, 7.5, -0.2), { w: 1.3, color: '#4a2412' });
    P.fill(R.torso, C.jama, { var: 0.6 });
    g.save(); g.clip(new Path2D(R.torso));
    for (let y = 262; y < 392; y += 6.2) P.strokePts([[488, y + 2], [532, y - 1], [576, y + 2]], { w: 1.5, color: C.jamaD, alpha: 0.85, taper: 0 });
    g.restore();
    P.line(R.torso, { w: 2 });
    goldBand(P, spline([[494, 374], [530, 378], [568, 374]], false), 13, false);
    P.gold(band(spline([[530, 382], [534, 404], [528, 428]], false), 11, 8), { w: 1.4 });
    P.line(spline([[531, 396], [533, 404]], false), { w: 2, color: C.red });
    P.fill(poly([[507, 252], [524, 252], [529, 272], [505, 274]]), C.flesh, { mottle: 0.3 });
    P.fill(R.face, C.flesh, { mottle: 0.4 });
    P.line(R.face, { w: 1.3, color: '#3b1c0c' });
    P.fill(R.beard, '#1b1714', { mottle: 0.3 });
    P.line(spline([[496, 244], [505, 247], [514, 244], [519, 238]], false), { w: 2.4, color: '#1b1714' });
    const eye = 'M499.5 233 Q505 229.5 511 232.5 Q505 235.5 499.5 233 Z';
    P.fill(eye, C.white, { mottle: 0 });
    P.dot(505.5, 232.6, 1.5, C.ink);
    P.line(eye, { w: 0.9, taper: 0 });
    P.line('M499 228 Q505 225 512 227.5', { w: 1.2, taper: 2 });
    P.dot(525, 252, 2.3, C.white, { ring: '#8a7a5a', ringW: 0.5 });
    P.fill(R.turban, C.vermil, { var: 0.6 });
    g.save(); g.clip(new Path2D(R.turban));
    for (let k = -8; k < 12; k++) P.strokePts([[480 + k * 8, 250], [530 + k * 8, 180]], { w: 2, color: '#efc25a', alpha: 0.9, taper: 0 });
    g.restore();
    P.line(R.turban, { w: 1.8 });
    withXf(g, 548, 197, -0.55, () => {
      P.fill(leafD(34, 8), '#f4e9cf', { mottle: 0 });
      P.line(leafD(34, 8), { w: 1.1 });
      P.line('M2 0 L30 0', { w: 0.8, alpha: 0.6, taper: 2 });
    });
    withXf(g, 500, 214, -1.9, () => P.gold(leafD(13, 7), { w: 1 }));
    for (const p of along(spline([[525, 265], [514, 280], [502, 293]], false), 4.6)) P.dot(p.x, p.y, 1.8, C.white, { ring: '#8a7a5a', ringW: 0.4 });
    // raised arm with the goad
    const arm = band(spline([[522, 285], [490, 282], [455, 270], [425, 258], [404, 252]], false), 20, 15);
    P.fill(arm, C.jama, { var: 0.6 });
    g.save(); g.clip(new Path2D(arm));
    for (let x = 400; x < 530; x += 5.5) P.strokePts([[x + 4, 240], [x - 1, 300]], { w: 1.4, color: C.jamaD, alpha: 0.85, taper: 0 });
    g.restore();
    P.line(arm, { w: 1.9 });
    goldBand(P, spline([[409, 244], [405, 263]], false), 8, false);
    P.line('M382 302 L379 250 L374 196', { w: 3.6, color: '#2a221c', taper: 0 });
    P.gold('M371 197 L366 186 L372 171 L378 186 Z', { w: 1.2 });
    P.line(spline([[376, 208], [366, 201], [358, 205], [357, 215]], false), { w: 2.6, color: '#2a221c' });
    for (const y of [222, 288]) goldBand(P, `M${373 + (y - 222) * 0.07} ${y - 3} L${374 + (y - 222) * 0.07} ${y + 3}`, 8, false);
    P.fill(ellipsePath(385, 251, 11, 9.5, -0.2), C.flesh, { mottle: 0.3 });
    P.line(ellipsePath(385, 251, 11, 9.5, -0.2), { w: 1.4, color: '#3b1c0c' });
    P.line('M377 247 Q384 245 391 248 M377 253 Q384 251 391 254', { w: 0.9, color: '#3b1c0c', taper: 2 });
  }

  function paintCushion(P, g) {
    P.fill(D.cushion, C.vermil, { var: 0.8 });
    g.save(); g.clip(new Path2D(D.cushion));
    for (let k = -30; k < 30; k++) for (const s of [-1, 1]) {
      const x0 = 390 + k * 14;
      P.strokePts([[x0 - s * 120, 230], [x0 + s * 120, 430]], { w: 1.6, color: '#efc25a', alpha: 0.9, taper: 0 });
    }
    for (let i = -20; i < 20; i++) for (let j = -20; j < 20; j++) {
      const x = 390 + (i + j) * 7, y = 330 + (j - i) * 5.83;
      if (x > 320 && x < 465 && y > 270 && y < 405) P.dot(x, y, 1.9, '#f6d675', { ring: '#7a2a12', ringW: 0.6 });
    }
    g.lineJoin = 'round';
    g.strokeStyle = rgba(C.ink, 0.85); g.lineWidth = 18; g.stroke(new Path2D(D.cushion));
    g.strokeStyle = rgba(C.gold, 1); g.lineWidth = 15; g.stroke(new Path2D(D.cushion));
    g.restore();
    for (const p of offsetAlong(openEdge(PT.cushion, 1, 6), 8, 4)) P.dot(p.x, p.y, 1.5, C.red);
    P.line(D.cushion, { w: 2.6 });
  }

  function paintJowl(P, g) {
    P.fill(D.jowl, '#1a1a1c', { mottle: 0.6, edge: false });
    g.save(); g.clip(new Path2D(D.jowl));
    let row = 0;
    for (let y = 505; y < 572; y += 13, row++) {
      for (let x = 258 + (row % 2) * 7; x < 415; x += 14) {
        const cx = x + P.r.range(-2, 2), cy = y + P.r.range(-2, 2);
        if (P.r() < 0.22) { rosette(P, cx, cy, 3.6); P.dot(cx, cy, 1.2, '#f2cf5a'); }
        else P.strokePts(spiralPts(cx, cy, P.r.range(4, 5.5), 1.3, P.r() * TAU, P.r() < 0.5 ? 1 : -1), { w: 1.2, color: '#e8eef0', alpha: 0.9, taper: 3 });
      }
    }
    g.restore();
  }

  function paintNeck(P) {
    rope(P, spline([[293, 556], [335, 553], [372, 545], [414, 531]], false), 17, [C.red, null]);
    rope(P, spline([[298, 580], [340, 579], [380, 571], [420, 557]], false), 14, ['#2c4a9a', null]);
    for (const [x, y] of [[292, 557], [297, 580]]) {
      P.dot(x, y, 8, C.gold, { ring: C.ink, ringW: 1.2 });
      P.dot(x, y, 3.4, '#3a2408');
    }
  }

  function paintNeckJewels(P, g) {
    // lower strap with bells
    const bb = spline([[262, 724], [295, 752], [332, 753], [368, 744], [405, 731], [434, 714]], false);
    for (const p of offsetAlong(bb, 20, 11).slice(1)) bell(P, p.x, p.y, 9.5);
    goldBand(P, bb, 10);
    // upper strap with leaf pendants and pearls
    const kd = spline([[300, 690], [332, 678], [362, 659], [392, 635], [417, 611], [434, 594]], false);
    for (const p of offsetAlong(kd, 28, 13).slice(0, -1)) trefoil(P, g, p.x, p.y, (p.a + Math.PI / 2) * 0.5 + (Math.PI / 2) * 0.5, 1.05);
    goldBand(P, kd, 13);
    for (const p of offsetAlong(kd, 6.5, -10)) P.dot(p.x, p.y, 2.3, C.white, { ring: '#7f6a48', ringW: 0.5 });
    // big bell hanging at the chest
    P.line('M294 672 Q282 676 272 674', { w: 1.8, taper: 0 });
    withXf(g, 262, 676, 1.25, () => {
      const bd = 'M-15 14 C-15 -4 -9 -16 0 -16 C9 -16 15 -4 15 14 Z';
      P.gold(bd, { w: 2 });
      P.gold(ellipsePath(0, 14, 16, 4.5), { w: 1.4 });
      P.dot(0, 21, 3.2, C.gold, { ring: C.ink, ringW: 0.9 });
      P.dot(0, -18, 3.4, C.gold, { ring: C.ink, ringW: 0.9 });
      for (const y of [-6, 4]) P.line(`M-12 ${y} Q0 ${y + 3} 12 ${y}`, { w: 1, color: C.carve, taper: 0 });
    });
  }

  function paintEar(P, g) {
    P.fill(D.ear, C.skin, { var: 0.9, blot: 1.2, edgeW: 6 });
    g.save(); g.clip(new Path2D(D.ear));
    const gr = g.createRadialGradient(455, 430, 0, 455, 430, 120);
    gr.addColorStop(0, 'rgba(118,122,130,0.5)'); gr.addColorStop(1, 'rgba(118,122,130,0)');
    g.fillStyle = gr; g.fillRect(330, 300, 260, 320);
    for (let i = 0; i < 30; i++) {
      const a = lerp(-1.3, 1.45, i / 29) + P.r.range(-0.03, 0.03), r0 = P.r.range(40, 70), r1 = P.r.range(130, 175);
      const pts = [];
      for (let u = 0; u <= 1; u += 0.05) { const rr = lerp(r0, r1, u), aa = a + 0.18 * u * u; pts.push([382 + Math.cos(aa) * rr, 478 + Math.sin(aa) * rr]); }
      P.strokePts(pts, { w: P.r.range(1, 2), color: '#7c8088', alpha: 0.4, taper: 14 });
    }
    P.stipple(D.ear, { count: 1900, r: [0.8, 2.2], color: PINKS, alpha: [0.5, 0.95], mask: (x, y) => smooth(0.66, 0.98, Math.hypot((x - 452) / 90, (y - 486) / 118)) * smooth(425, 480, x) });
    g.restore();
    P.line(spline([[390, 410], [398, 452], [412, 500], [432, 546], [452, 590]], false), { w: 2, alpha: 0.75 });
    P.line(D.ear, { w: 3 });
    // silver tassels hanging from the ear
    for (const [x, y] of [[446, 390], [484, 394]]) {
      P.line(`M${x} ${y} L${x} ${y + 9}`, { w: 1.4, taper: 0 });
      P.line(ellipsePath(x, y + 13, 4.5, 4.5), { w: 1.6 });
      const t = `M${x - 5} ${y + 18} C${x - 6} ${y + 30} ${x - 13} ${y + 46} ${x - 15} ${y + 58} Q${x} ${y + 63} ${x + 15} ${y + 58} C${x + 13} ${y + 46} ${x + 6} ${y + 30} ${x + 5} ${y + 18} Z`;
      P.fill(t, '#eef1f4', { mottle: 0.4, edge: false });
      g.save(); g.clip(new Path2D(t));
      for (let k = -14; k <= 14; k += 2.6) P.strokePts([[x + k * 0.3, y + 18], [x + k, y + 62]], { w: 0.8, color: '#7d93ab', alpha: 0.85, taper: 0 });
      g.restore();
      P.line(t, { w: 1.4 });
      P.line(`M${x - 6} ${y + 22} L${x + 6} ${y + 22}`, { w: 1.6, color: '#8a98a8', taper: 0 });
    }
  }

  function paintHeaddress(P, g) {
    const d = D.headdress;
    P.gold(d, { base: '#cf9a33', w: 0.1, line: false });
    g.save(); g.clip(new Path2D(d));
    for (let row = 0, y = 318; y < 560; y += 8, row++) {
      for (let x = 112 + (row % 2) * 5; x < 410; x += 10) {
        P.line(`M${x - 5} ${y} Q${x} ${y + 7} ${x + 5} ${y}`, { w: 0.9, color: '#5a3a0c', alpha: 0.6, taper: 0 });
        P.dot(x, y + 3, 0.9, '#3a2408', { alpha: 0.7 });
      }
    }
    g.lineJoin = 'round';
    g.strokeStyle = rgba('#2a1a08', 0.9); g.lineWidth = 12; g.stroke(new Path2D(d));
    g.strokeStyle = rgba('#e2b54c'); g.lineWidth = 9.5; g.stroke(new Path2D(d));
    g.restore();
    for (const p of offsetAlong(d, 6.5, 3)) P.dot(p.x, p.y, 1.2, C.ink);
    P.line(d, { w: 2.6 });
    // lotus jewel on the crown
    withXf(g, 266, 352, -0.15, () => {
      const e = 'M-15 0 Q0 -11 15 0 Q0 11 -15 0 Z';
      P.fill(e, '#e8bf55', { mottle: 0 });
      P.line(e, { w: 1.4 });
      P.dot(0, 0, 4.2, C.red, { ring: C.ink, ringW: 0.8, hi: true });
      for (const s of [-1, 1]) P.line(`M${s * 15} 0 Q${s * 21} -6 ${s * 24} 0 Q${s * 21} 6 ${s * 15} 0`, { w: 1, taper: 0 });
    });
    // rosette at the ear where the big tassel hangs
    P.gold(ellipsePath(400, 398, 11, 10), { w: 1.6 });
    P.dot(400, 398, 4.5, C.red, { ring: C.ink, ringW: 0.8, hi: true });
    // pearls and small drops along the inner edge
    const lower = openEdge(PT.headdress, 19, 34);
    for (const p of offsetAlong(lower, 7, -4.5)) P.dot(p.x, p.y, 2.6, C.white, { ring: '#7f6a48', ringW: 0.6 });
    for (const p of offsetAlong(openEdge(PT.headdress, 19, 24), 15, -10).slice(1)) {
      withXf(g, p.x, p.y, Math.PI / 2, () => P.gold(leafD(10, 6.5), { w: 0.9 }));
      P.dot(p.x, p.y + 11, 1.9, C.white, { ring: '#7f6a48', ringW: 0.5 });
    }
  }

  function paintFace(P, g) {
    // pearl festoon under the eye
    for (const p of along(spline([[222, 418], [234, 437], [255, 453], [288, 459], [330, 454], [356, 442], [380, 422], [394, 406]], false), 7)) P.dot(p.x, p.y, 2.6, C.white, { ring: '#75644a', ringW: 0.5 });
    // white flower on the forehead front
    withXf(g, 197, 500, -0.5, () => {
      P.line('M0 14 Q2 4 0 -6', { w: 1.2, color: C.white, taper: 2 });
      for (const s of [-1, 1]) withXf(g, 0, 8, s * 1.1 - Math.PI / 2, () => P.fill(leafD(10, 4.5), C.white, { mottle: 0 }));
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; P.dot(Math.cos(a) * 4.2, -9 + Math.sin(a) * 4.2, 1.9, C.white); }
      P.dot(0, -9, 1.6, '#f2cf5a');
    });
    // the eye with its pinkish surround
    const gr = g.createRadialGradient(291, 420, 2, 291, 420, 34);
    gr.addColorStop(0, 'rgba(184,146,134,0.8)'); gr.addColorStop(1, 'rgba(184,146,134,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(291, 420, 34, 21, 0, 0, TAU); g.fill();
    const eye = spline([[268, 421, 1], [278, 413], [292, 410], [306, 413], [315, 420, 1], [302, 427], [285, 429]]);
    P.fill(eye, '#ece0c8', { mottle: 0.3 });
    P.dot(289, 420, 7, '#6b5a43', { ring: C.ink, ringW: 1 });
    P.dot(289, 420, 3.4, '#0d0b0a');
    P.dot(287, 417.5, 1.3, '#ffffff', { alpha: 0.9 });
    P.line(eye, { w: 1.6 });
    P.line(spline([[265, 422], [277, 411], [293, 407], [309, 411], [318, 419]], false), { w: 3.2 });
    P.line(spline([[272, 426], [288, 432], [306, 428]], false), { w: 1.2, alpha: 0.7 });
    P.line(spline([[256, 422], [265, 407], [285, 397], [310, 398], [328, 407], [337, 418]], false), { w: 3.6, color: C.white, alpha: 0.95 });
    for (const [x, y] of [[341, 424], [345, 431], [337, 431]]) P.dot(x, y, 2.2, C.white, { ring: '#7f6a48', ringW: 0.4 });
    // lower lip
    P.fill(D.lip, '#d8918a', { mottle: 0.6 });
    P.stipple(D.lip, { count: 40, r: [0.6, 1.3], color: '#9e5a4e', alpha: [0.5, 0.9] });
    P.line(D.lip, { w: 1.8 });
  }

  function paintTusk(P, g) {
    P.fill(D.tusk, C.bone, { var: 0.5, edge: false, mottle: 0.6 });
    g.save(); g.clip(new Path2D(D.tusk));
    P.strokePts(polyline(spline([[252, 540], [200, 556], [150, 572], [124, 580]], false), 1.4), { w: 8, color: '#c4b99f', alpha: 0.75, taper: 10 });
    P.strokePts(polyline(spline([[248, 522], [200, 534], [150, 551], [126, 560]], false), 1.4), { w: 3.5, color: '#ffffff', alpha: 0.7, taper: 10 });
    g.restore();
    P.line(D.tusk, { w: 2.4 });
    const tx = -0.947, ty = 0.32, nx = 0.32, ny = 0.947;
    const ring = (cx, cy) => {
      const q = (a, b) => [[cx + tx * a - nx * 14, cy + ty * a - ny * 14], [cx + tx * b - nx * 14, cy + ty * b - ny * 14], [cx + tx * b + nx * 14, cy + ty * b + ny * 14], [cx + tx * a + nx * 14, cy + ty * a + ny * 14]];
      P.gold(poly(q(-7, 7)), { w: 1.4 });
      P.fill(poly(q(-3.2, 3.2)), C.red, { mottle: 0.3 });
      P.line(poly(q(-3.2, 3.2)), { w: 1 });
    };
    ring(190, 548);
    // gold scroll cap and a tassel at the tip
    const neck = band(spline([[132, 568], [110, 566], [94, 560]], false), 20, 16);
    P.gold(neck, { w: 1.6 });
    for (let x = 98; x < 130; x += 4) P.line(`M${x} 559 L${x - 2} 576`, { w: 0.8, color: C.carve, alpha: 0.8, taper: 0 });
    ring(131, 569);
    for (const [cx, cy, r, d] of [[82, 530, 15, 1], [78, 562, 14, -1]]) {
      P.gold(ellipsePath(cx, cy, r, r), { w: 1.6 });
      P.strokePts(spiralPts(cx, cy, r * 0.82, 1.6, 0.5, d), { w: 1.6, color: C.carve, taper: 4 });
    }
    P.line('M90 580 L90 590', { w: 1.6, taper: 0 });
    P.gold(ellipsePath(90, 595, 6.5, 6), { w: 1.3 });
    P.gold('M83 601 L97 601 L100 612 L80 612 Z', { w: 1.2 });
    const tas = 'M80 613 L100 613 L108 676 L72 676 Z';
    P.gold(tas, { w: 1.4 });
    g.save(); g.clip(new Path2D(tas));
    for (let k = -18; k <= 18; k += 2.6) P.strokePts([[90 + k * 0.5, 613], [90 + k, 676]], { w: 0.9, color: '#6a4510', alpha: 0.85, taper: 0 });
    g.restore();
    P.line('M78 622 L102 622', { w: 3, color: C.red, taper: 0 });
  }

  function paintTassel(P, g) {
    const cx = 399, tiers = [[407, 440, 13, 18], [441, 480, 17, 27], [481, 524, 25, 37]];
    for (const [y0, y1, a, b] of tiers) {
      const d = poly([[cx - a, y0], [cx + a, y0], [cx + b, y1], [cx - b, y1]]);
      P.gold(d, { w: 1.6 });
      g.save(); g.clip(new Path2D(d));
      for (let k = -40; k <= 40; k += 3) P.strokePts([[cx + k * (a / b), y0 + 6], [cx + k, y1]], { w: 0.9, color: '#6a4510', alpha: 0.85, taper: 0 });
      g.restore();
      const top = poly([[cx - a - 1, y0], [cx + a + 1, y0], [cx + a + 2, y0 + 7], [cx - a - 2, y0 + 7]]);
      P.gold(top, { base: '#e2b54c', w: 1.1 });
      for (let x = cx - a + 2; x <= cx + a - 1; x += 4) P.dot(x, y0 + 3.5, 1.1, C.white);
      for (let x = cx - b + 2; x <= cx + b - 1; x += 4) P.dot(x, y1 - 1, 1, C.white, { alpha: 0.85 });
    }
  }

  function paint(g, k = 1) {
    K = k;
    const P = new Painter(g, 17);
    paintTail(P, g);
    paintSkin(P, g);
    paintOutlines(P);
    paintFeet(P);
    paintJhool(P, g);
    paintBlanket(P, g);
    paintHarness(P, g);
    paintHowdah(P, g);
    paintRider(P, g);
    paintJowl(P, g);
    paintNeck(P);
    paintNeckJewels(P, g);
    paintCushion(P, g);
    paintEar(P, g);
    paintHeaddress(P, g);
    paintFace(P, g);
    paintTusk(P, g);
    paintTassel(P, g);
    P.wear(EB.x, EB.y, EB.x + EB.w, EB.y + EB.h, 380, 1.2);
  }

  window.Elephant = { paint, EB };
})();
