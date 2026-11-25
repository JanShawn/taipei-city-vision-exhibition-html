// 觸控展示裝置鎖住雙指縮放，保留單指捲動與點擊。
document.addEventListener('touchmove', event => {
  if (event.touches.length > 1) event.preventDefault();
}, { passive: false });

// 補上 Safari 的手勢事件，避免裝置忽略 viewport 的縮放限制。
['gesturestart', 'gesturechange', 'gestureend'].forEach(type => {
  document.addEventListener(type, event => event.preventDefault(), { passive: false });
});

window.ExhibitionReady = (async function () {
  'use strict';

  // 以腳本位置解析資料網址，支援 GitHub Pages 的專案子目錄。
  const dataUrl = new URL('../../data/tourism.json', document.currentScript.src);
  let data;
  try {
    const response = await fetch(dataUrl, { cache: 'no-cache' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    data = await response.json();
    if (!Array.isArray(data.attractions) || !Array.isArray(data.foods) || !data.meta) {
      throw new Error('旅遊資料格式不正確');
    }
  } catch (error) {
    const screen = document.querySelector('.screen');
    screen.innerHTML = '<div class="story-loading error-state"><strong>旅遊資料暫時無法載入</strong><span>請確認網路及 data/tourism.json 是否存在。</span><button type="button" id="retry-data">重新載入</button></div>';
    document.getElementById('retry-data').addEventListener('click', () => location.reload());
    console.error('載入旅遊資料失敗：', error);
    return false;
  }
  const fallback = 'assets/images/image-unavailable.svg';
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1Z"/>',
    landmark: '<path d="m3 9 9-6 9 6M3 9h18M4 21h16M6 9v12m6-12v12m6-12v12"/>',
    food: '<path d="M4 3v5a3 3 0 0 0 6 0V3M7 3v18M20 3c-4 3-5 8-1 9h1M20 3v18"/>',
    route: '<circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h8a4 4 0 0 1 0 8H7a4 4 0 0 0 0 8h8"/>',
    sparkles: '<path d="m12 3 2.8 6.2L21 12l-6.2 2.8L12 21l-2.8-6.2L3 12l6.2-2.8ZM20 2v4m-2-2h4"/>',
    leaf: '<path d="M20 4c-3 0-11-2-15 4s0 12 6 11 9-8 9-15ZM4 21 15 10"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    pin: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone: '<path d="m5 3 4 1 1 5-3 2a14 14 0 0 0 6 6l2-3 5 1 1 4c0 2-2 3-4 2C9 19 5 15 3 7 2 5 3 3 5 3Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    qr: '<path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h-2zM19 15h2v6h-6v-2"/>',
  };

  function escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.href : '';
    } catch { return ''; }
  }

  function icon(name, size = 24) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.pin}</svg>`;
  }

  function hydrateIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach(node => {
      node.outerHTML = icon(node.dataset.icon, Number(node.dataset.size) || 24);
    });
  }

  function unique(items) {
    const values = new Map();
    items.forEach(item => { if (!values.has(item.name.trim())) values.set(item.name.trim(), item); });
    return [...values.values()];
  }

  const attractions = unique(data.attractions);
  const foods = unique(data.foods.filter(item => item.kind === 'food-area' && safeUrl(item.image)));
  const allItems = [...attractions, ...foods];
  function getItem(id, kind) {
    return allItems.find(item => item.id === id && (!kind || item.kind === kind));
  }

  function image(item, extra = '') {
    const local = /^assets\/images\/[a-z0-9.-]+$/i.test(item.localImage || '') ? item.localImage : '';
    return `<img src="${escape(local || safeUrl(item.image) || fallback)}" alt="${escape(item.imageAlt || item.name)}" class="${item.imageSourcePlace ? 'tower-photo' : ''}" referrerpolicy="no-referrer" ${extra}>`;
  }

  function placeAttributes(item) {
    return `data-place-id="${escape(item.id)}" data-place-kind="${escape(item.kind)}"`;
  }

  function card(item, food = false) {
    return `<button class="place-card${food ? ' food-card' : ''}" type="button" ${placeAttributes(item)}>
      <span class="place-image">${image(item)}<small>${icon(food ? 'food' : 'pin', 13)} ${escape(item.town)}</small></span>
      <span class="place-body"><strong>${escape(item.name)}</strong><span>${escape(item.summary)}</span><b>看完整介紹 ${icon('right', 16)}</b></span>
    </button>`;
  }

  function updateScale() {
    const scale = Math.min(window.innerWidth / 1080, window.innerHeight / 960);
    const shell = document.querySelector('.stage-shell');
    const canvas = document.querySelector('.exhibit-canvas');
    if (!shell || !canvas) return;
    shell.style.width = `${1080 * scale}px`;
    shell.style.height = `${960 * scale}px`;
    canvas.style.transform = `scale(${scale})`;
  }

  const modalRoot = document.getElementById('modal-root');
  let returnFocus = null;
  function closeModal() {
    modalRoot.replaceChildren();
    document.querySelector('.screen').inert = false;
    document.querySelector('.bottom-nav').inert = false;
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    else document.querySelector('.bottom-nav .active')?.focus({ preventScroll: true });
    returnFocus = null;
  }

  function showModal(content, titleId) {
    if (!modalRoot.children.length) returnFocus = document.activeElement;
    modalRoot.innerHTML = `<div class="detail-overlay" role="dialog" aria-modal="true" aria-labelledby="${titleId}">${content}</div>`;
    document.querySelector('.screen').inert = true;
    document.querySelector('.bottom-nav').inert = true;
    modalRoot.querySelector('.close-button').focus({ preventScroll: true });
  }

  function qrSvg(text) {
    if (!window.qrcodegen) return '';
    const qr = window.qrcodegen.QrCode.encodeText(text, window.qrcodegen.QrCode.Ecc.MEDIUM);
    const quiet = 4;
    const size = qr.size + quiet * 2;
    let path = '';
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        if (qr.getModule(x, y)) path += `M${x + quiet},${y + quiet}h1v1h-1z`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="108" height="108" role="img" aria-label="地點連結 QR Code" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="white"/><path d="${path}" fill="#071219"/></svg>`;
  }

  function openPlace(item) {
    if (!item) return;
    const url = safeUrl(item.website) || safeUrl(item.mapUrl);
    const source = safeUrl(item.sourceUrl);
    const rows = [['address', 'pin', '地址'], ['openTime', 'clock', '時間'], ['phone', 'phone', '電話']]
      .filter(([key]) => item[key])
      .map(([key, symbol, title]) => `<div><dt>${icon(symbol, 17)} ${title}</dt><dd>${escape(item[key])}</dd></div>`).join('');
    showModal(`<article class="detail-panel">
      <button class="close-button" type="button" aria-label="關閉介紹" data-close>${icon('close')}</button>
      <div class="detail-image">${image(item)}<span>${item.kind === 'food-area' ? '美食地點' : '城市景點'}</span></div>
      <div class="detail-copy"><p class="eyebrow">DISCOVER TAIPEI</p><h2 id="detail-title">${escape(item.name)}</h2>
        <p class="detail-description">${escape(item.description)}</p><dl>${rows}</dl>
        ${url ? `<div class="qr-takeaway"><div class="qr-code"><a href="${escape(url)}" target="_blank" rel="noopener noreferrer" aria-label="開啟${escape(item.name)}的${safeUrl(item.website) ? '網站' : '地圖'}">${qrSvg(url)}</a></div><div><strong>${icon('qr', 18)} 掃描帶著走</strong><span>${safeUrl(item.website) ? '用手機開啟地點網站' : '用手機開啟地圖位置'}</span><small>離開展場後也能繼續查看</small></div></div>` : ''}
        ${item.imageCredit ? `<p class="image-credit">影像：${escape(item.imageCredit)}${item.imageSourcePlace ? `｜來源紀錄：${escape(item.imageSourcePlace)}` : ''}</p>` : ''}
        ${source ? `<small class="detail-source"><a href="${escape(source)}" class="source-link" target="_blank" rel="noopener noreferrer">資料：${escape(item.sourceName || '交通部觀光署・景點－觀光資訊資料庫')}</a></small>` : ''}
      </div></article>`, 'detail-title');
  }

  document.addEventListener('click', event => {
    const place = event.target.closest('[data-place-id]');
    if (place) openPlace(getItem(place.dataset.placeId, place.dataset.placeKind));
    if (event.target.closest('[data-close]') || event.target.classList.contains('detail-overlay')) closeModal();
  });

  document.addEventListener('keydown', event => {
    if (!modalRoot.children.length) return;
    if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
    if (event.key !== 'Tab') return;
    const elements = [...modalRoot.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')];
    const first = elements[0];
    const last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });

  document.addEventListener('error', event => {
    const node = event.target;
    if (node instanceof HTMLImageElement && !node.src.endsWith('/image-unavailable.svg')) node.src = fallback;
  }, true);

  window.Exhibition = Object.freeze({ data, attractions, foods, escape, safeUrl, icon, hydrateIcons, image, card, placeAttributes, getItem, openPlace, showModal, closeModal, qrSvg });
  hydrateIcons();
  updateScale();
  window.addEventListener('resize', updateScale);
  return true;
})();
