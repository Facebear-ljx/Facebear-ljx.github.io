import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const original = JSON.parse(read('data/publications.json'));
const updates = JSON.parse(read('data/updates.json'));
const papers = [...updates.newPublications, ...original.map(p => ({...p, ...updates.publicationUpdates[p.title]}))];
papers.sort((a,b) => b.year - a.year);
const rows = papers.map((paper, index) => {
  const links = paper.links.map(link => `<a href="${escape(link.href)}">${escape(link.label === 'Page' ? 'Project' : link.label)} <span aria-hidden="true">↗</span></a>`).join('');
  const title = paper.links[0] ? `<a href="${escape(paper.links[0].href)}">${escape(paper.title)}</a>` : escape(paper.title);
  const authors = escape(paper.authors).replace(/Jianxiong Li\*?/g, '<strong>$&</strong>');
  return `<li class="publication" data-categories="${escape(paper.categories.join(' '))}" id="paper-${index+1}">
        <div class="paper-year">${paper.year}</div>
        <article class="paper-content"><div class="paper-heading"><span class="venue">${escape(paper.venue || 'Preprint')}</span>${paper.date ? '<span class="new-label">RECENT WORK</span>' : ''}</div>
          <h3>${title}</h3><p class="paper-authors">${authors}</p>
          ${paper.alternateTitle ? `<p class="paper-alternate">${escape(paper.alternateTitle)}</p>` : ''}
          ${paper.note ? `<p class="paper-note">${escape(paper.note.replace(/^\(|\)$/g,'').replace(' 🏆',''))}</p>` : ''}
          ${links ? `<div class="paper-links">${links}</div>` : ''}
        </article></li>`;
}).join('\n');
const news = updates.news.map(item => `<li><span class="news-date">${escape(item.date)}</span><p>${item.html}</p></li>`).join('\n');
const archive = JSON.parse(read('data/news-archive.json')).map(item => `<li><span class="news-date">${item.match(/20\d{2}/)?.[0] || 'Earlier'}</span><p>${item}</p></li>`).join('\n');
let output = read('src/index.html');
for (const [key, value] of Object.entries({PUBLICATIONS:rows,NEWS:news,ARCHIVE:archive,COUNT:papers.length})) output = output.replaceAll(`{{${key}}}`, value);
fs.writeFileSync(new URL('index.html',root), output.replace(/[\t ]+$/gm, ''));
console.log(`Built index.html: ${papers.length} publications (${original.length} preserved + ${updates.newPublications.length} new), 11 archived news items.`);
