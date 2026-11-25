(async function () {
  'use strict';
  if (!await window.ExhibitionReady) return;
  const E = window.Exhibition;
  const hero = E.attractions.find(item => item.name === '台北101') || E.attractions[0];
  const random = items => items[Math.floor(Math.random() * items.length)];
  const featured = [hero, random(E.foods), random(E.attractions.filter(item => item.id !== hero?.id))].filter(Boolean);

  document.getElementById('attraction-count').textContent = E.attractions.length;
  document.getElementById('food-count').textContent = E.foods.length;
  if (hero) {
    document.getElementById('hero-image').outerHTML = E.image(hero, 'id="hero-image"');
    document.getElementById('hero-image').classList.add('hero-background');
    document.getElementById('hero-credit').textContent = `影像：${hero.imageCredit || '政府開放資料'}${hero.imageSourcePlace ? `｜來源紀錄：${hero.imageSourcePlace}` : ''}`;
  }
  document.getElementById('stories').innerHTML = featured.length ? featured.map((item, index) => `
    <button class="story-card${index === 0 ? ' featured' : ''}" type="button" ${E.placeAttributes(item)}>
      ${E.image(item)}<span class="story-shade"></span><span class="story-copy">
        <small>${E.escape(item.kind === 'food-area' ? '美食地點' : item.town + '景點')}</small>
        <strong>${E.escape(item.name)}</strong><span>${E.escape(item.summary)}</span>
        <b>閱讀介紹 ${E.icon('arrow', 15)}</b></span>
    </button>`).join('') : '<div class="story-loading"><strong>目前沒有可顯示的地點</strong><span>請確認 data/tourism.json 檔案是否完整。</span></div>';
})();
