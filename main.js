(() => {
  'use strict';
  const controls = document.querySelector('.publication-controls');
  const papers = [...document.querySelectorAll('.publication')];
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const search = document.querySelector('#paper-search');
  const status = document.querySelector('#publication-status');
  const empty = document.querySelector('.empty-state');
  let filter = 'selected';
  const searchable = new Map(papers.map(p => [p, p.textContent.toLowerCase().replace(/\s+/g, ' ')]));
  function update() {
    const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const paper of papers) {
      // A search intentionally covers the entire publication collection.
      const categoryMatch = terms.length || filter === 'all' || paper.dataset.categories.split(' ').includes(filter);
      const match = categoryMatch && terms.every(term => searchable.get(paper).includes(term));
      paper.hidden = !match;
      if (match) visible++;
    }
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === (terms.length ? 'all' : filter))));
    status.textContent = `${visible} of ${papers.length} publications${terms.length ? ' · search results' : ''}`;
    empty.hidden = visible !== 0;
  }
  function setFilter(value) {filter = value; search.value = ''; update();}
  buttons.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  document.querySelectorAll('[data-jump-filter]').forEach(link => link.addEventListener('click', () => setFilter(link.dataset.jumpFilter)));
  search.addEventListener('input', update);
  document.querySelector('#reset-search').addEventListener('click', () => {setFilter('all'); search.focus();});
  controls.hidden = false;
  update();
})();
