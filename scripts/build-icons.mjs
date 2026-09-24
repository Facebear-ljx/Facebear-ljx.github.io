import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// Deterministic icon export from the original portrait; never alter the photo.
// Optional macOS maintenance step. Generated assets are committed for Pages.
if (process.platform !== 'darwin') throw new Error('Icon export requires macOS sips. The committed icons work on all platforms.');
const root = fileURLToPath(new URL('../', import.meta.url));
const icons = path.join(root, 'assets/favicon_package');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'jianxiong-icons-'));
const crop = path.join(temp, 'portrait-square.png');
const run = (...args) => execFileSync('/usr/bin/sips', args, { stdio: 'pipe' });

// Head-and-shoulders crop in the 5292 × 7938 source, including the full hairline.
run('-c', '2646', '2646', '--cropOffset', '331', '1323', '-s', 'format', 'png',
  path.join(root, 'assets/jianxiong-basal.jpg'), '--out', crop);
const exports = [
  ['favicon-16x16.png', 16], ['favicon-32x32.png', 32],
  ['favicon-48x48.png', 48], ['favicon-96x96.png', 96],
  ['apple-touch-icon.png', 180], ['android-chrome-192x192.png', 192],
  ['android-chrome-512x512.png', 512], ['mstile-150x150.png', 150],
];
for (const [name, size] of exports) run('-z', String(size), String(size), crop, '--out', path.join(icons, name));
run('-z', '512', '512', '-s', 'format', 'jpeg', '-s', 'formatOptions', '85', crop,
  '--out', path.join(icons, 'icon-HD-ljx.jpg'));

// ICO directory with PNG-encoded images. Include a high-DPI representation.
const icoSizes = [16, 32, 48, 256];
const highDpi = path.join(temp, '256.png');
run('-z', '256', '256', crop, '--out', highDpi);
const pngs = icoSizes.map(size => fs.readFileSync(size === 256 ? highDpi : path.join(icons, `favicon-${size}x${size}.png`)));
const header = Buffer.alloc(6 + 16 * icoSizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);
let offset = header.length;
icoSizes.forEach((size, index) => {
  const entry = 6 + index * 16;
  header[entry] = header[entry + 1] = size === 256 ? 0 : size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(pngs[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += pngs[index].length;
});
const ico = Buffer.concat([header, ...pngs]);
fs.writeFileSync(path.join(root, 'favicon.ico'), ico);
fs.writeFileSync(path.join(icons, 'favicon.ico'), ico);
// Standard root fallback used by some browsers and bookmark clients.
fs.copyFileSync(path.join(icons, 'apple-touch-icon.png'), path.join(root, 'apple-touch-icon.png'));
console.log(`Exported ${exports.length} PNG icons, sharing portrait, ICO and root fallbacks from assets/jianxiong-basal.jpg.`);
