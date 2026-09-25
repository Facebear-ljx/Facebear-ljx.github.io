import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const html = read('index.html');
const original = JSON.parse(read('data/publications.json'));
const updates = JSON.parse(read('data/updates.json'));
const archive = JSON.parse(read('data/news-archive.json'));
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

test('all 25 original publications, links, and 11 news updates remain', () => {
  assert.equal(original.length, 25);
  assert.equal(archive.length, 11);
  for (const paper of original) {
    assert.ok(html.includes(escape(paper.title)), paper.title);
    for (const link of paper.links) assert.ok(html.includes(escape(link.href)), link.href);
  }
  for (const item of archive) assert.ok(html.includes(item), item);
});

test('all 28 unique papers are delivered in static HTML without JavaScript', () => {
  assert.equal((html.match(/class="publication" /g) || []).length, 28);
  const titles = [...updates.newPublications, ...original].map(p => p.title.toLowerCase());
  assert.equal(new Set(titles).size, 28);
  for (const paper of updates.newPublications) assert.ok(html.includes(escape(paper.title)));
  assert.ok(!html.includes('{{'));
  assert.ok(!/class="publication"[^>]*\bhidden\b/.test(html));
});

test('confirmed career and education dates are present', () => {
  for (const text of ['Co-founder & CEO', 'BASAL Intelligence', 'Dec 2025 — Jul 2026', 'Top Seed', 'Xiao Ma', 'Graduated Jul 2026', 'Jul 2026 — Present']) assert.ok(html.includes(text), text);
  assert.ok(!/final.year PhD/i.test(html));
});

test('the PhD graduation update includes the thesis topic', () => {
  const graduation = updates.news.find(item => item.html.startsWith('I completed my PhD'));
  assert.ok(graduation);
  assert.ok(graduation.html.includes('My thesis focused on <em>Data Flywheel for Intelligent Decision-Making</em>.'));
  assert.ok(html.includes(graduation.html));
});

test('the new portrait and BASAL email replace previous profile references', () => {
  assert.ok(html.includes('src="assets/jianxiong-basal.jpg"'));
  assert.ok(html.includes('width="5292" height="7938"'));
  assert.equal((html.match(/href="mailto:lijianxiong@basalintelligence\.com"/g) || []).length, 3);
  assert.ok(!html.includes('li-jx21@mails.tsinghua.edu.cn'));
  assert.ok(!html.includes('assets/jianxiong2.jpg'));
});

test('the contact section invites passionate robot learning candidates to join', () => {
  const contact = html.match(/<section class="contact-section"[\s\S]*?<\/section>/)?.[0];
  assert.ok(contact);
  assert.ok(contact.includes('<h2 id="contact-title">Join us.</h2>'));
  assert.ok(contact.includes("If you're deeply passionate about robot learning and eager to push the limits and advance the field, we'd love to have you join us."));
  assert.ok(contact.includes('href="mailto:lijianxiong@basalintelligence.com"'));
  assert.ok(!html.includes('Open to collaboration.'));
});

test('search, browser, mobile and sharing metadata use dedicated portrait icons', () => {
  assert.ok(!html.includes('href="assets/jianxiong-basal.jpg"'));
  assert.match(html, /rel="icon" href="assets\/favicon_package\/favicon-96x96\.png" sizes="96x96" type="image\/png"/);
  assert.match(html, /rel="icon" href="favicon\.ico"/);
  assert.match(html, /rel="apple-touch-icon"[^>]+sizes="180x180"/);
  assert.match(html, /rel="manifest" href="assets\/favicon_package\/site\.webmanifest"/);
  const image = 'https://facebear-ljx.github.io/assets/favicon_package/icon-HD-ljx.jpg';
  assert.ok(html.includes(`property="og:image" content="${image}"`));
  assert.ok(html.includes(`name="twitter:image" content="${image}"`));
  assert.ok(fs.statSync(new URL('assets/favicon_package/icon-HD-ljx.jpg', root)).size < 100_000);
});

const readBytes = relative => fs.readFileSync(new URL(relative, root));
const pngDimensions = bytes => {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};

test('portrait icon exports have the declared square dimensions and working manifest paths', () => {
  const iconRoot = new URL('assets/favicon_package/', root);
  for (const size of [16, 32, 48, 96]) {
    assert.deepEqual(pngDimensions(fs.readFileSync(new URL(`favicon-${size}x${size}.png`, iconRoot))), [size, size]);
  }
  const manifest = JSON.parse(read('assets/favicon_package/site.webmanifest'));
  assert.equal(manifest.name, 'Jianxiong Li · BASAL Intelligence');
  for (const icon of manifest.icons) {
    assert.equal(icon.type, 'image/png');
    assert.deepEqual(pngDimensions(fs.readFileSync(new URL(icon.src, iconRoot))), icon.sizes.split('x').map(Number));
  }
  assert.deepEqual(pngDimensions(readBytes('apple-touch-icon.png')), [180, 180]);
  assert.deepEqual(readBytes('apple-touch-icon.png'), readBytes('assets/favicon_package/apple-touch-icon.png'));
  assert.deepEqual(pngDimensions(readBytes('assets/favicon_package/mstile-150x150.png')), [150, 150]);
  assert.ok(read('assets/favicon_package/browserconfig.xml').includes('/assets/favicon_package/mstile-150x150.png'));
});

test('root and legacy ICO fallbacks contain the same new PNG icon exports', () => {
  const ico = readBytes('favicon.ico');
  assert.deepEqual(ico, readBytes('assets/favicon_package/favicon.ico'));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 4);
  [16, 32, 48, 256].forEach((size, index) => {
    const entry = 6 + 16 * index;
    assert.equal(ico[entry] || 256, size);
    assert.equal(ico[entry + 1] || 256, size);
    const length = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    assert.ok(offset + length <= ico.length);
    const png = ico.subarray(offset, offset + length);
    assert.deepEqual(pngDimensions(png), [size, size]);
    if (size < 256) assert.deepEqual(png, readBytes(`assets/favicon_package/favicon-${size}x${size}.png`));
  });
});

test('internal navigation has valid unique targets and local assets exist', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), id);
  for (const [, path] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (/^(https?:|mailto:)/.test(path)) continue;
    assert.ok(fs.existsSync(new URL(path, root)), path);
  }
  for (const [, path] of read('site.css').matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) assert.ok(fs.existsSync(new URL(path, root)), path);
});

test('filters, global search, empty state, and reset work', () => {
  const element = (dataset = {}) => ({dataset, hidden:false, value:'', textContent:'', attributes:{}, listeners:{}, setAttribute(k,v){this.attributes[k]=v;}, addEventListener(k,v){this.listeners[k]=v;}, focus(){this.focused=true;}});
  const all = [...updates.newPublications, ...original];
  const papers = all.map(p => Object.assign(element({categories:p.categories.join(' ')}), {textContent:`${p.title} ${p.authors} ${p.venue}`}));
  const filters = ['selected','all','pretrain','posttrain','rl'].map(filter => element({filter}));
  const nodes = Object.fromEntries(['.publication-controls','#paper-search','#publication-status','.empty-state','#reset-search'].map(k => [k,element()]));
  const jumps = [element({jumpFilter:'pretrain'})];
  const document = {querySelector:k => nodes[k], querySelectorAll:k => ({'.publication':papers,'[data-filter]':filters,'[data-jump-filter]':jumps}[k])};
  vm.runInNewContext(read('main.js'), {document});
  const count = () => papers.filter(p => !p.hidden).length;
  assert.equal(count(), 13);
  filters[1].listeners.click(); assert.equal(count(), 28);
  filters[3].listeners.click(); assert.equal(count(), all.filter(p => p.categories.includes('posttrain')).length);
  nodes['#paper-search'].value='world value models'; nodes['#paper-search'].listeners.input(); assert.equal(count(),1);
  assert.equal(filters[1].attributes['aria-pressed'],'true');
  nodes['#paper-search'].value='no matching paper xyz'; nodes['#paper-search'].listeners.input(); assert.equal(count(),0); assert.equal(nodes['.empty-state'].hidden,false);
  nodes['#reset-search'].listeners.click(); assert.equal(count(),28); assert.equal(nodes['#paper-search'].focused,true);
  jumps[0].listeners.click(); assert.equal(count(),all.filter(p => p.categories.includes('pretrain')).length);
});
