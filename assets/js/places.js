(async function () {
  'use strict';
  if (!await window.ExhibitionReady) return;
  const E = window.Exhibition;
  const food = document.body.dataset.page === 'food';
  const items = food ? E.foods : E.attractions;
  const towns = ['全部', ...new Set(items.map(item => item.town).filter(Boolean))];
  let town = '全部';
  let page = 0;
  const perPage = 6;
  const filter = document.getElementById('town-filter');
  const grid = document.getElementById('places-grid');
  const controls = document.getElementById('page-controls');

  filter.innerHTML = towns.map(value => `<button type="button" data-town="${E.escape(value)}" aria-pressed="${value === town}" class="${value === town ? 'active' : ''}">${E.escape(value)}</button>`).join('');
  const filtered = () => items.filter(item => town === '全部' || item.town === town);
  function render() {
    const list = filtered();
    const total = Math.max(1, Math.ceil(list.length / perPage));
    page = Math.min(page, total - 1);
    grid.innerHTML = list.slice(page * perPage, (page + 1) * perPage).map(item => E.card(item, food)).join('') || '<div class="story-loading"><strong>這個區域目前沒有資料</strong></div>';
    document.getElementById('page-number').textContent = `${page + 1} / ${total}`;
    controls.querySelectorAll('button').forEach(button => { button.disabled = total <= 1; });
  }

  filter.addEventListener('click', event => {
    const button = event.target.closest('[data-town]');
    if (!button) return;
    town = button.dataset.town;
    page = 0;
    filter.querySelectorAll('button').forEach(node => {
      const active = node === button;
      node.classList.toggle('active', active);
      node.setAttribute('aria-pressed', String(active));
    });
    render();
  });

  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-direction]');
    if (!button || button.disabled) return;
    const pages = Math.max(1, Math.ceil(filtered().length / perPage));
    page = (page + Number(button.dataset.direction) + pages) % pages;
    render();
  });
  render();
})();
