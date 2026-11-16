// Draws everything the page shows and writes it to assets/.
//   node make.mjs [--mood day,dusk,night] [--fmt wide,tall] [--what bg,sketch,cels] [--S 1.5] [--tmp dir] [--preview]
// For every mood and format: the still picture, the first sketch, and one sheet of cels with an alpha channel.
// The cels get their alpha by being drawn twice, once on black paper and once on white.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const has = k => process.argv.includes('--' + k);
const moods = arg('mood', 'day,dusk,night').split(','), fmts = arg('fmt', 'wide,tall').split(','), what = arg('what', 'bg,sketch,cels').split(',');
const S = parseFloat(arg('S', '1.5')), SK = parseFloat(arg('SK', '1')), Q = arg('q', '80');
const tmp = arg('tmp', path.join(os.tmpdir(), 'lake-make')), assets = path.join(here, 'assets');
fs.mkdirSync(tmp, { recursive: true }); fs.mkdirSync(assets, { recursive: true });

const srcDir = path.join(here, 'src');
const files = ['engine.js', ...fs.readdirSync(srcDir).filter(f => f.startsWith('m-') && f.endsWith('.js')).sort()].map(f => path.join(srcDir, f)).concat(path.join(here, 'stage.js'));
const code = files.map(f => fs.readFileSync(f, 'utf8').replace(/^'use strict';/, '')).join('\n;\n');
const { createArt, STAGE } = new Function("'use strict';\n" + code + '\n;return { createArt, STAGE, M };')();

// ---- PNG out ---------------------------------------------------------------------------------
const CT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = buf => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CT[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
function writePNG(file, rgba, w, h, alpha) {
  const bpp = alpha ? 4 : 3, raw = Buffer.alloc((w * bpp + 1) * h);
  for (let y = 0; y < h; y++) { let o = y * (w * bpp + 1); raw[o++] = 0; let i = y * w * 4; for (let x = 0; x < w; x++, i += 4) { raw[o++] = rgba[i]; raw[o++] = rgba[i + 1]; raw[o++] = rgba[i + 2]; if (alpha) raw[o++] = rgba[i + 3]; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = alpha ? 6 : 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 3 })), chunk('IEND', Buffer.alloc(0))]));
}
function webp(png, out, q) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', out]);
  return Math.round(fs.statSync(out).size / 1024);
}
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// ---- the sheet of cels ---------------------------------------------------------------------------
function packCels(C, width) {
  const order = C.slice().sort((a, b) => b.h - a.h || b.w - a.w), pad = 3;
  let x = pad, y = pad, rowH = 0;
  for (const c of order) {
    if (x + c.w + pad > width) { x = pad; y += rowH + pad; rowH = 0; }
    c.x = x; c.y = y; x += c.w + pad; rowH = Math.max(rowH, c.h);
  }
  return y + rowH + pad;
}
function drawCels(C, LW, LH, paper, tag) {
  const A = createArt({ S, LW, LH });
  A.R.fill(paper); A.G.fill(paper); A.B.fill(paper);
  for (const c of C) {
    A.pushMask(A.rect(c.x, c.y, c.w, c.h), 0);
    A.reseed(hash(tag + c.name));
    c.draw(A, c.x + c.ax, c.y + c.ay);
    A.popMask();
  }
  return A;
}
function matte(A0, A1) {
  const W = A0.W, H = A0.H, N = W * H, out = new Uint8ClampedArray(N * 4), HM = A0.HM;
  for (let i = 0; i < N; i++) {
    const a = 1 - ((A1.R[i] - A0.R[i]) + (A1.G[i] - A0.G[i]) + (A1.B[i] - A0.B[i])) / 3;
    if (a < 0.02) continue;
    const x = i % W, y = (i / W) | 0; let k = 1;
    if (x > 0 && y > 0 && x < W - 1 && y < H - 1) k += ((HM[i - 1] - HM[i + 1]) + (HM[i - W] - HM[i + W])) * 0.075;
    const inv = 255 * k / Math.min(1, a), j = i * 4;
    out[j] = A0.R[i] * inv; out[j + 1] = A0.G[i] * inv; out[j + 2] = A0.B[i] * inv; out[j + 3] = Math.min(1, a) * 255 + 0.5;
  }
  return out;
}
// lay cels over the still picture at the places they start from, to look at the whole thing without a browser
function preview(bg, W, H, atlas, AW, man) {
  const out = new Uint8ClampedArray(bg);
  const put = (name, ux, uy, sc) => {
    const c = man.cels[name]; if (!c) return; sc = sc || 1;
    const dw = Math.round(c[2] * sc), dh = Math.round(c[3] * sc), dx = Math.round(ux * S - c[4] * S * sc), dy = Math.round(uy * S - c[5] * S * sc);
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const X = dx + x, Y = dy + y; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const si = ((c[1] + Math.min(c[3] - 1, (y / sc) | 0)) * AW + c[0] + Math.min(c[2] - 1, (x / sc) | 0)) * 4, a = atlas[si + 3] / 255; if (!a) continue;
      const di = (Y * W + X) * 4;
      out[di] += (atlas[si] - out[di]) * a; out[di + 1] += (atlas[si + 1] - out[di + 1]) * a; out[di + 2] += (atlas[si + 2] - out[di + 2]) * a;
    }
  };
  for (const a of man.actors.slice().sort((p, q) => p.z - q.z)) {
    if (a.type === 'drift') a.items.forEach(i => put(i.cel, i.x, i.y));
    else if (a.type === 'boil') put(a.cels[0], a.x, a.y);
    else if (a.type === 'boat') put(a.cels[0], a.x, a.y);
    else if (a.type === 'still') put(a.cel, a.x, a.y);
    else if (a.type === 'swim') for (let i = 0; i < a.n; i++) put(a.cels[i % 2], a.x0 + (a.x1 - a.x0) * 0.4 + i * a.gap, a.y + i * 8, a.scale);
    else if (a.type === 'flock') for (let i = 0; i < a.n; i++) { const t = 0.38 + i * a.gap / Math.hypot(a.to[0] - a.from[0], a.to[1] - a.from[1]); put(a.frames[i % 4][i % 2], a.from[0] + (a.to[0] - a.from[0]) * t, a.from[1] + (a.to[1] - a.from[1]) * t + a.sag * 4 * t * (1 - t) + (i % 2 ? 9 : -7), a.size[0] + (a.size[1] - a.size[0]) * (1 - i / a.n)); }
    else if (a.type === 'pair') for (let i = 0; i < a.n; i++) { const t = 0.45 + i * 0.05; put(a.cels[i % 2], a.from[0] + (a.to[0] - a.from[0]) * t, a.from[1] + (a.to[1] - a.from[1]) * t + a.sag * 4 * t * (1 - t) + i * 16); }
    else if (a.type === 'leap') { const p = a.pts[1] || a.pts[0]; put(a.rings[2], p[0], p[1], p[2]); put(a.cels[1], p[0], p[1], p[2]); }
    else if (a.type === 'rings') a.pts.slice(2, 5).forEach((p, i) => put(a.cels[i + 1], p[0], p[1], p[2]));
    else if (a.type === 'lamps') a.pts.forEach((p, i) => put(a.cels[i % 3], p[0], p[1], p[2]));
    else if (a.type === 'pose') put(a.cels[1], a.x, a.y);
    else if (a.type === 'flutter') for (let i = 0; i < a.n; i++) put(a.cels[i % 3], a.box[0] + (a.box[2] - a.box[0]) * (i + 0.5) / a.n, a.box[1] + (a.box[3] - a.box[1]) * (0.3 + 0.4 * (i % 2)));
    else if (a.type === 'blink') a.zones.forEach((z, zi) => { for (let i = 0; i < a.n[zi]; i++) put(a.cels[i % 2], z[0] + (z[2] - z[0]) * ((i * 0.618 + 0.3) % 1), z[1] + (z[3] - z[1]) * ((i * 0.37 + 0.2) % 1)); });
    else if (a.type === 'twinkle') for (let i = 0; i < 5; i++) put(a.cels[i % 3], a.box[0] + (a.box[2] - a.box[0]) * ((i * 0.618 + 0.1) % 1), a.box[1] + (a.box[3] - a.box[1]) * ((i * 0.41 + 0.2) % 1));
  }
  return out;
}

function meanHex(px, W, x0, y0, x1, y1) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y0; y < y1; y += 3) for (let x = x0; x < x1; x += 3) { const i = (y * W + x) * 4; r += px[i]; g += px[i + 1]; b += px[i + 2]; n++; }
  return '#' + [r, g, b].map(v => Math.round(v / n).toString(16).padStart(2, '0')).join('');
}

// ---- run ------------------------------------------------------------------------------------------
const manFile = path.join(assets, 'scenes.json');
const all = fs.existsSync(manFile) ? JSON.parse(fs.readFileSync(manFile, 'utf8')) : {};
for (const mood of moods) for (const fmt of fmts) {
  const key = mood + '-' + fmt, G = STAGE.geom(fmt, mood), t0 = Date.now(), log = [];
  const man = all[key] = all[key] || {};
  Object.assign(man, { w: G.W, h: G.H, S, focus: G.focus, sky: G.sky, water: [Math.round(G.yShore0 + 18), Math.round(G.yBank0 - 6)] });
  let bgRGBA = null, bgW = 0, bgH = 0;
  if (what.includes('bg')) {
    const A = createArt({ S, LW: G.W, LH: G.H });
    STAGE.background(A, G, process.env.VERBOSE ? n => console.log('   ', n) : null);
    bgRGBA = A.toRGBA(); bgW = A.W; bgH = A.H;
    const png = path.join(tmp, key + '.png'); writePNG(png, bgRGBA, A.W, A.H, false);
    man.bg = key + '.webp'; man.px = [A.W, A.H];
    man.skyc = meanHex(bgRGBA, A.W, 0, 0, Math.round(A.W * G.sky.u1), Math.round(A.H * G.sky.v1));
    log.push('bg ' + A.W + 'x' + A.H + ' ' + webp(png, path.join(assets, man.bg), Q) + ' KB');
  }
  if (what.includes('sketch')) {
    const A = createArt({ S: SK, LW: G.W, LH: G.H });
    STAGE.sketch(A, G);
    const skRGBA = A.toRGBA(); man.paper = meanHex(skRGBA, A.W, 0, 0, A.W, A.H);
    const png = path.join(tmp, key + '-sketch.png'); writePNG(png, skRGBA, A.W, A.H, false);
    man.sketch = key + '-sketch.webp';
    log.push('sketch ' + webp(png, path.join(assets, man.sketch), 50) + ' KB');
  }
  if (what.includes('cels')) {
    const C = STAGE.cels(G), AW = 1600, AH = packCels(C, AW);
    const A0 = drawCels(C, AW, AH, 0, key), A1 = drawCels(C, AW, AH, 1, key), rgba = matte(A0, A1);
    const png = path.join(tmp, key + '-cels.png'); writePNG(png, rgba, A0.W, A0.H, true);
    man.atlas = key + '-cels.webp'; man.cels = {};
    for (const c of C) man.cels[c.name] = [Math.round(c.x * S), Math.round(c.y * S), Math.round(c.w * S), Math.round(c.h * S), c.ax, c.ay];
    man.actors = STAGE.actors(G);
    log.push('cels ' + C.length + ' on ' + A0.W + 'x' + A0.H + ' ' + webp(png, path.join(assets, man.atlas), 84) + ' KB');
    if (has('preview')) {
      if (!bgRGBA) { const A = createArt({ S, LW: G.W, LH: G.H }); STAGE.background(A, G); bgRGBA = A.toRGBA(); bgW = A.W; bgH = A.H; }
      writePNG(path.join(tmp, key + '-preview.png'), preview(bgRGBA, bgW, bgH, rgba, A0.W, man), bgW, bgH, false);
    }
  }
  console.log(key.padEnd(11) + ((Date.now() - t0) / 1000).toFixed(1).padStart(6) + ' s   ' + log.join('   '));
}
fs.writeFileSync(manFile, JSON.stringify(all));
fs.writeFileSync(path.join(assets, 'scenes.js'), '/* made by make.mjs */\nwindow.LAKE_SCENES = ' + JSON.stringify(all) + ';\n');
console.log('wrote', manFile);
