// Draws the whole stepwell in one wide picture (the opening screen of the Experience page) and writes it to assets/.
//   node make-wellhero.mjs [--S 2] [--q 80] [--write] [--preview dir] [--tag hero]
//     --write        write assets/well-hero.webp
//     --preview dir  write <tag>-full.jpg (the picture at full size) and <tag>-half.jpg (half size) to look at
// It loads the same files make.mjs loads, in the same order.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const has = k => process.argv.includes('--' + k);
const S = parseFloat(arg('S', '2')), Q = arg('q', '80'), prev = arg('preview', ''), tag = arg('tag', 'hero');
const tmp = arg('tmp', path.join(os.tmpdir(), 'wellhero-make')), assets = path.join(here, 'assets');
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
function writePNG(file, rgba, w, h) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { let o = y * (w * 3 + 1); raw[o++] = 0; let i = y * w * 4; for (let x = 0; x < w; x++, i += 4) { raw[o++] = rgba[i]; raw[o++] = rgba[i + 1]; raw[o++] = rgba[i + 2]; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 3 })), chunk('IEND', Buffer.alloc(0))]));
}
function webp(png, out, q) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', out]);
  return Math.round(fs.statSync(out).size / 1024);
}
const jpg = (png, out, scale) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png].concat(scale ? ['-vf', 'scale=' + scale + ':-1:flags=area'] : [], ['-q:v', '3', out]));

// ---- run ------------------------------------------------------------------------------------------
const PL = STAGE.places.wellhero, G = PL.geom();
const t0 = Date.now(), log = [];
const A = createArt({ S, LW: G.W, LH: G.H });
let last = Date.now(), lastName = 'start'; const times = [];
PL.background(A, G, n => { const t = Date.now(); times.push([lastName, t - last]); last = t; lastName = n; if (process.env.VERBOSE) console.log('   ', n); });
times.push([lastName, Date.now() - last]);
console.log(times.filter(t => t[1] > 1500 * S * S / 4).map(t => t[0] + ' ' + (t[1] / 1000).toFixed(1)).join(', '));
const rgba = A.toRGBA();
log.push('painted ' + A.W + 'x' + A.H + ' in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
const png = path.join(tmp, tag + '.png'); writePNG(png, rgba, A.W, A.H);
if (has('write')) log.push('well-hero.webp ' + webp(png, path.join(assets, 'well-hero.webp'), Q) + ' KB');
else if (has('size')) log.push('webp would be ' + webp(png, path.join(tmp, tag + '.webp'), Q) + ' KB');
if (prev) {
  jpg(png, path.join(prev, tag + '-full.jpg'));
  jpg(png, path.join(prev, tag + '-half.jpg'), Math.round(A.W / 2));
  log.push('preview ' + prev);
}
console.log('wellhero ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s   ' + log.join('   '));
