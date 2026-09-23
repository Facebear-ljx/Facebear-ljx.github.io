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
