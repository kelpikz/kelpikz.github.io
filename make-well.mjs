// Draws the stepwell of the Experience page and writes it to assets/.  It is one tall painting (1600 x 6300) cut into
// seven frames of the wide sheet, so it has its own maker: make.mjs writes scenes.json for the places that are one frame.
//   node make-well.mjs [--S 1.5] [--SK 0.5] [--q 72] [--what bg,sketch,cels] [--only y0,y1] [--write] [--preview dir] [--tag name]
//     --only y0,y1   paint only the parts of the sheet between these heights (for looking at one place closely)
//     --write        write assets/well-f0..6.webp, well-sketch.webp, well-cels.webp and assets/well.json
//     --preview dir  write jpgs to look at: the whole well small, and every frame at full size, cels laid on
// It loads the same files make.mjs loads, in the same order, and draws the cels the same way (twice, on black and white).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const has = k => process.argv.includes('--' + k);
const S = parseFloat(arg('S', '1.5')), SK = parseFloat(arg('SK', '0.5')), Q = arg('q', '72'), what = arg('what', 'bg,sketch,cels').split(',');
const only = arg('only', '') ? arg('only').split(',').map(Number) : null, prev = arg('preview', ''), tag = arg('tag', 'well');
const tmp = arg('tmp', path.join(os.tmpdir(), 'well-make')), assets = path.join(here, 'assets');
fs.mkdirSync(tmp, { recursive: true }); if (prev) fs.mkdirSync(prev, { recursive: true });

const srcDir = path.join(here, 'src');
const files = ['engine.js', ...fs.readdirSync(srcDir).filter(f => f.startsWith('m-') && f.endsWith('.js')).sort()].map(f => path.join(srcDir, f)).concat(path.join(here, 'stage.js'), fs.readdirSync(here).filter(f => /^stage-.+.js$/.test(f)).sort().map(f => path.join(here, f)));
const code = files.map(f => {
  const src = fs.readFileSync(f, 'utf8').replace(/^'use strict';/, '');
  try { new Function(src); return src; } catch (e) { console.warn('left out ' + path.basename(f) + ': ' + e.message); return ''; }
}).join('\n;\n');
const { createArt, STAGE } = new Function("'use strict';\n" + code + '\n;return { createArt, STAGE, M };')();

// ---- PNG and webp, as in make.mjs ------------------------------------------------------------------
const CT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = buf => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CT[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
function writePNG(file, rgba, w, h, alpha, y0, y1) {
  y0 = y0 || 0; y1 = y1 == null ? h : y1;
  const bpp = alpha ? 4 : 3, hh = y1 - y0, raw = Buffer.alloc((w * bpp + 1) * hh);
  for (let y = 0; y < hh; y++) { let o = y * (w * bpp + 1); raw[o++] = 0; let i = (y + y0) * w * 4; for (let x = 0; x < w; x++, i += 4) { raw[o++] = rgba[i]; raw[o++] = rgba[i + 1]; raw[o++] = rgba[i + 2]; if (alpha) raw[o++] = rgba[i + 3]; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(hh, 4); ihdr[8] = 8; ihdr[9] = alpha ? 6 : 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 3 })), chunk('IEND', Buffer.alloc(0))]));
}
function webp(png, out, q) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', out]);
  return Math.round(fs.statSync(out).size / 1024);
}
const jpg = (png, out, scale) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png].concat(scale ? ['-vf', 'scale=' + scale + ':-1:flags=area'] : [], ['-q:v', '3', out]));
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

function packCels(C, width) {
  const order = C.slice().sort((a, b) => b.h - a.h || b.w - a.w), pad = 3;
  let x = pad, y = pad, rowH = 0;
  for (const c of order) {
    if (x + c.w + pad > width) { x = pad; y += rowH + pad; rowH = 0; }
    c.x = x; c.y = y; x += c.w + pad; rowH = Math.max(rowH, c.h);
  }
  return y + rowH + pad;
}
function drawCels(C, LW, LH, paper, key) {
  const A = createArt({ S, LW, LH });
  A.R.fill(paper); A.G.fill(paper); A.B.fill(paper);
  for (const c of C) {
    A.pushMask(A.rect(c.x, c.y, c.w, c.h), 0);
    A.reseed(hash(key + c.name));
    c.draw(A, c.x + c.ax, c.y + c.ay);
    A.popMask();
  }
  return A;
}
function matte(A0, A1, relief) {
  relief = relief == null ? 0.075 : relief;
  const W = A0.W, H = A0.H, N = W * H, out = new Uint8ClampedArray(N * 4), HM = A0.HM;
  for (let i = 0; i < N; i++) {
    const a = 1 - ((A1.R[i] - A0.R[i]) + (A1.G[i] - A0.G[i]) + (A1.B[i] - A0.B[i])) / 3;
    if (a < 0.02) continue;
    const x = i % W, y = (i / W) | 0; let k = 1;
    if (x > 0 && y > 0 && x < W - 1 && y < H - 1) k += ((HM[i - 1] - HM[i + 1]) + (HM[i - W] - HM[i + W])) * relief;
    const inv = 255 * k / Math.min(1, a), j = i * 4;
    out[j] = A0.R[i] * inv; out[j + 1] = A0.G[i] * inv; out[j + 2] = A0.B[i] * inv; out[j + 3] = Math.min(1, a) * 255 + 0.5;
  }
  return out;
}

// ---- the cels laid over the picture where they first stand, with every alcove lit, to judge the whole without a browser
function preview(bg, W, H, atlas, AW, man, walkAt) {
  const out = new Uint8ClampedArray(bg);
  let mode = 'normal', alpha = 1;
  const put = (name, ux, uy, sc) => {
    const c = man.cels[name]; if (!c) return; sc = sc || 1;
    const dw = Math.round(c[2] * sc), dh = Math.round(c[3] * sc), dx = Math.round(ux * S - c[4] * S * sc), dy = Math.round(uy * S - c[5] * S * sc);
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const X = dx + x, Y = dy + y; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const si = ((c[1] + Math.min(c[3] - 1, (y / sc) | 0)) * AW + c[0] + Math.min(c[2] - 1, (x / sc) | 0)) * 4, a = atlas[si + 3] / 255 * alpha; if (!a) continue;
      const di = (Y * W + X) * 4;
      for (let k = 0; k < 3; k++) {
        const s = atlas[si + k], d = out[di + k];
        const t = mode === 'multiply' ? d * s / 255 : mode === 'screen' ? 255 - (255 - d) * (255 - s) / 255 : s;
        out[di + k] = d + (t - d) * a;
      }
    }
  };
  for (const layer of ['under', 'glow', 'shade', 'top']) {
    for (const a of man.actors.filter(a => a.layer === layer).sort((p, q) => p.z - q.z)) {
      mode = layer === 'shade' ? 'multiply' : layer === 'glow' ? 'screen' : 'normal';
      alpha = a.type === 'flicker' ? a.alpha[1] : 1;
      if (a.type === 'flicker' || a.type === 'boil' || a.type === 'sway') put(a.cels[0], a.x, a.y);
      else if (a.type === 'flock') for (let i = 0; i < a.n; i++) { const t = 0.12 + i * a.gap / Math.hypot(a.to[0] - a.from[0], a.to[1] - a.from[1]); put(a.frames[i % 4][i % 2], a.from[0] + (a.to[0] - a.from[0]) * t, a.from[1] + (a.to[1] - a.from[1]) * t + a.sag * 4 * t * (1 - t) + (i % 2 ? 9 : -7), a.size[0] + (a.size[1] - a.size[0]) * (1 - i / a.n)); }
      else if (a.type === 'formation') a.slots.forEach((s, i) => put(a.cels[(i * 3) % 4], a.x + s[0], a.y + s[1], 1 - i * 0.03));
      else if (a.type === 'blink') a.zones.forEach((z, zi) => { for (let i = 0; i < a.n[zi]; i++) put(a.cels[i % 2], z[0] + (z[2] - z[0]) * ((i * 0.618 + 0.3) % 1), z[1] + (z[3] - z[1]) * ((i * 0.37 + 0.2) % 1)); });
      else if (a.type === 'twinkle') for (let i = 0; i < 5; i++) put(a.cels[i % 3], a.box[0] + (a.box[2] - a.box[0]) * ((i * 0.618 + 0.1) % 1), a.box[1] + (a.box[3] - a.box[1]) * ((i * 0.41 + 0.2) % 1));
      else if (a.type === 'rings') a.pts.slice(2, 5).forEach((p, i) => put(a.cels[i + 1], p[0], p[1], p[2]));
      else if (a.type === 'alcoves') a.pts.forEach((p, i) => {
        mode = 'screen'; put(a.niche, a.nicheAt[i][0], a.nicheAt[i][1]); put(a.glow[0], p[0], p[1]);
        mode = 'normal'; put(a.cels[i % 3], p[0], p[1]);
      });
      else if (a.type === 'walker' && walkAt) {
        const p = walkAt(a.path);
        mode = 'screen'; put(a.glow[0], p[0], p[1]); mode = 'normal'; put(a.cels[0], p[0], p[1]);
      }
    }
  }
  return out;
}

// ---- run ------------------------------------------------------------------------------------------
const PL = STAGE.places.well, G = PL.geom('wide');
if (only) G.only = only;
const t0 = Date.now(), log = [];
const man = { w: G.W, h: G.H, S, frame: [G.W, G.FH] };
let bgRGBA = null, bgW = 0, bgH = 0;
if (what.includes('bg')) {
  const A = createArt({ S, LW: G.W, LH: G.H, crop: only ? [0, only[0], G.W, only[1] - only[0]] : null });
  let last = Date.now(), lastName = 'start'; const times = [];
  PL.background(A, G, n => { const t = Date.now(); times.push([lastName, t - last]); last = t; lastName = n; if (process.env.VERBOSE) console.log('   ', n); });
  times.push([lastName, Date.now() - last]);
  if (process.env.VERBOSE) console.log(times.filter(t => t[1] > 400).map(t => t[0] + ' ' + (t[1] / 1000).toFixed(1)).join(', '));
  bgRGBA = A.toRGBA(); bgW = A.W; bgH = A.H;
  log.push('bg ' + A.W + 'x' + A.H + ' ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  if (has('write')) {
    man.frames = []; const FH = Math.round(G.FH * S);
    for (let i = 0; i < G.NF; i++) {
      const png = path.join(tmp, 'well-f' + i + '.png'), name = 'well-f' + i + '.webp';
      writePNG(png, bgRGBA, bgW, bgH, false, i * FH, Math.min(bgH, (i + 1) * FH));
      man.frames.push(name); log.push('f' + i + ' ' + webp(png, path.join(assets, name), Q) + ' KB');
    }
    man.px = [bgW, FH];
  }
}
if (what.includes('sketch') && has('write')) {
  const A = createArt({ S: SK, LW: G.W, LH: G.H });
  PL.sketch(A, G);
  const png = path.join(tmp, 'well-sketch.png'); writePNG(png, A.toRGBA(), A.W, A.H, false);
  man.sketch = 'well-sketch.webp'; man.sketchS = SK;
  log.push('sketch ' + webp(png, path.join(assets, man.sketch), 50) + ' KB');
}
let atlas = null, AWpx = 0;
if (what.includes('cels')) {
  const C = PL.cels(G), AW = 1600, AH = packCels(C, AW);
  const A0 = drawCels(C, AW, AH, 0, tag), A1 = drawCels(C, AW, AH, 1, tag);
  atlas = matte(A0, A1); AWpx = A0.W;
  man.cels = {}; for (const c of C) man.cels[c.name] = [Math.round(c.x * S), Math.round(c.y * S), Math.round(c.w * S), Math.round(c.h * S), c.ax, c.ay];
  man.actors = PL.actors(G);
  if (has('write')) {
    const png = path.join(tmp, 'well-cels.png'); writePNG(png, atlas, A0.W, A0.H, true);
    man.atlas = 'well-cels.webp';
    log.push('cels ' + C.length + ' on ' + A0.W + 'x' + A0.H + ' ' + webp(png, path.join(assets, man.atlas), 84) + ' KB');
  }
}
if (has('write')) {
  const wellMan = JSON.stringify(Object.assign({}, PL.layout(G), man));
  fs.writeFileSync(path.join(assets, 'well.json'), wellMan);
  // the same, as a script: a page opened from a file may not fetch a .json (experience.html reads this one)
  fs.writeFileSync(path.join(assets, 'well.js'), '/* made by make-well.mjs */\nwindow.WELL = ' + wellMan + ';\n');
  log.push('well.json, well.js');
}
if (prev && bgRGBA) {
  // the walking lamp stands on the first level's second flight in the preview
  const walkAt = p => p[Math.min(p.length - 1, 4)];
  const px = atlas ? preview(bgRGBA, bgW, bgH, atlas, AWpx, man, walkAt) : bgRGBA;
  const y0 = only ? Math.max(0, Math.floor(only[0] * S)) : 0, y1 = only ? Math.min(bgH, Math.ceil(only[1] * S)) : bgH;
  const full = path.join(tmp, tag + '-full.png'); writePNG(full, px, bgW, bgH, false, y0, y1);
  if (!only) jpg(full, path.join(prev, tag + '-full.jpg'), 600);
  else jpg(full, path.join(prev, tag + '.jpg'));
  if (!only || has('frames')) {
    const FH = Math.round(G.FH * S);
    for (let i = 0; i < G.NF; i++) {
      if (only && ((i + 1) * G.FH <= only[0] || i * G.FH >= only[1])) continue;
      const png = path.join(tmp, tag + '-f' + i + '.png'); writePNG(png, px, bgW, bgH, false, i * FH, Math.min(bgH, (i + 1) * FH));
      jpg(png, path.join(prev, tag + '-f' + i + '.jpg'));
    }
  }
  log.push('preview ' + prev);
}
console.log('well ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s   ' + log.join('   '));
