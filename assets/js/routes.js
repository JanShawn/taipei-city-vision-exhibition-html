(async function () {
  'use strict';
  if (!await window.ExhibitionReady) return;
  const E = window.Exhibition;
  const definitions = [
    {
      id: 'dadaocheng', title: '大稻埕散步線', kicker: '街屋、信仰與河岸',
      duration: '建議半日・步行', accent: '#67e8d5',
      description: '走進迪化街的老店與街屋，沿著霞海城隍廟、永樂市場，慢慢走向大稻埕碼頭。停留時間可依體力調整。',
      names: ['大稻埕街區_迪化街店屋', '台北霞海城隍廟', '永樂布業商場_永樂市場', '大稻埕碼頭_大稻埕碼頭貨櫃市集'],
    },
    {
      id: 'beitou', title: '北投溫泉線', kicker: '綠建築與溫泉文化',
      duration: '建議半日・步行', accent: '#f5c96a',
      description: '從新北投車站出發，串起公園、圖書館與溫泉博物館，再沿山坡走向地熱谷。開放時間以各場館公告為準。',
      names: ['新北投車站', '北投公園', '臺北市立圖書館北投分館', '北投溫泉博物館', '地熱谷_地獄谷_鬼湖'],
    },
    {
      id: 'xinyi', title: '信義城市線', kicker: '文創、街景與山稜',
      duration: '建議一日・步行與轉乘', accent: '#9eb8ff',
      description: '從松山文創園區走向台北101，最後以象山步道收進城市天際線。步道有階梯，請依天候與體力決定是否前往。',
      names: ['松山文創園區_松菸風格店家', '台北101', '象山公園', '南港山系_象山親山步道'],
    },
  ];
  const routes = definitions.map(route => ({ ...route, stops: route.names.map(name => [...E.attractions, ...E.foods].find(item => item.name === name)).filter(Boolean) }));

  document.getElementById('route-grid').innerHTML = routes.map((route, index) => `
    <button class="route-card" type="button" data-route="${route.id}" style="--route-accent:${route.accent}" ${route.stops.length ? '' : 'disabled'}>
      <span class="route-image">${route.stops[0] ? E.image(route.stops[0]) : ''}<span class="route-number">${String(index + 1).padStart(2, '0')}</span><span class="route-time">${E.icon('clock', 14)} ${route.duration}</span></span>
      <span class="route-body"><small>${route.kicker}</small><strong>${route.title}</strong><span>${route.description}</span>
        <span class="stop-preview">${route.stops.slice(0, 3).map(item => `<b>${E.escape(item.name)}</b>`).join('')}<em>共 ${route.stops.length} 站</em></span>
        <span class="route-link">查看完整路線 ${E.icon('arrow', 17)}</span>
      </span></button>`).join('');

  document.getElementById('route-grid').addEventListener('click', event => {
    const button = event.target.closest('[data-route]');
    if (!button) return;
    const route = routes.find(item => item.id === button.dataset.route);
    if (!route) return;
    E.showModal(`<article class="route-detail-panel">
      <button class="close-button" type="button" aria-label="關閉路線" data-close>${E.icon('close')}</button>
      <div class="route-detail-heading" style="--route-accent:${route.accent}"><span>${route.kicker}</span><h2 id="route-title">${route.title}</h2><p>${route.description}</p><b>${E.icon('clock', 16)} ${route.duration}</b></div>
      <ol class="route-stops">${route.stops.map((item, index) => `<li role="button" tabindex="0" ${E.placeAttributes(item)}>${E.image(item)}<span class="stop-index">${String(index + 1).padStart(2, '0')}</span><span><strong>${E.escape(item.name)}</strong><small>${E.escape(item.town)} · 點擊閱讀介紹</small></span>${E.icon('right', 18)}</li>`).join('')}</ol>
      <small class="route-detail-source"><a href="https://data.gov.tw/dataset/7777" class="source-link" target="_blank" rel="noopener noreferrer">站點資料：交通部觀光署・景點－觀光資訊資料庫</a></small>
    </article>`, 'route-title');
  });

  document.addEventListener('keydown', event => {
    const stop = event.target.closest('.route-stops [data-place-id]');
    if (stop && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      E.openPlace(E.getItem(stop.dataset.placeId, stop.dataset.placeKind));
    }
  });
})();
