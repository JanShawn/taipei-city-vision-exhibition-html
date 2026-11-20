(async function () {
  'use strict';
  if (!await window.ExhibitionReady) return;
  const E = window.Exhibition;
  const storageKey = 'taipei-vision-votes';
  const options = [
    { id: 'walkable', title: '步行與交通', accent: '#67e8d5', narrative: '目前最受重視的是人的移動，讓舊城、社區與公共運輸重新連在一起。' },
    { id: 'culture', title: '文化再生', accent: '#f5c96a', narrative: '目前最受重視的是文化共生，讓歷史空間與新世代創作成為城市日常。' },
    { id: 'smart', title: '智慧服務', accent: '#aeb8ff', narrative: '目前最受重視的是有感科技，讓資訊協助每一次移動與生活選擇。' },
    { id: 'green', title: '山河綠地', accent: '#89e6a8', narrative: '目前最受重視的是自然韌性，讓山林、河岸與城市共同呼吸。' },
  ];
  const votes = Object.fromEntries(options.map(option => [option.id, 0]));
  const confirmation = document.getElementById('vote-confirmation');
  let timer = null;
  let confirming = false;

  function restore() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return;
      options.forEach(option => {
        const count = stored[option.id];
        if (typeof count === 'number' && Number.isFinite(count) && count >= 0 && count <= Number.MAX_SAFE_INTEGER) votes[option.id] = Math.floor(count);
      });
    } catch { /* 儲存空間停用或內容損壞時，仍保留本次互動功能。 */ }
  }

  function render() {
    const total = options.reduce((sum, option) => sum + votes[option.id], 0);
    const highest = Math.max(1, ...Object.values(votes));
    const ranked = [...options].sort((a, b) => votes[b.id] - votes[a.id]);
    const primary = ranked[0];
    const secondary = ranked.find(option => option.id !== primary.id && votes[option.id] > 0);
    document.getElementById('total-votes').textContent = total;
    document.getElementById('vision-summary').textContent = total ? primary.title + (secondary ? ` × ${secondary.title}` : '') : '等待第一個城市想法';
    document.getElementById('vision-momentum').textContent = total === 0 ? '願景從你的第一次選擇開始' : total < 10 ? '新的城市想法正在聚集' : total < 25 ? '共同方向逐漸清晰' : total < 50 ? '城市想像持續生長' : '大家正在一起推動未來台北';
    document.getElementById('vision-narrative').textContent = total ? primary.narrative : '點選你重視的方向，每一次投入都會留在這座城市的共同願景裡。';
    options.forEach(option => {
      const count = votes[option.id];
      const share = total ? count / total * 100 : 0;
      document.querySelectorAll(`[data-count="${option.id}"]`).forEach(node => { node.textContent = count; });
      document.querySelectorAll(`[data-share="${option.id}"]`).forEach(node => { node.textContent = `${Math.round(share)}%`; });
      document.querySelectorAll(`[data-width="${option.id}"]`).forEach(node => { node.style.width = `${share}%`; });
      document.querySelector(`[data-strength="${option.id}"]`).style.height = `${count ? 18 + count / highest * 82 : 5}%`;
      document.querySelector(`[data-meter="${option.id}"]`).setAttribute('aria-label', `${option.title} 已累積 ${count} 次選擇`);
    });
  }

  document.querySelector('.vision-options').addEventListener('click', event => {
    const button = event.target.closest('[data-vote]');
    if (!button || confirming) return;
    const option = options.find(item => item.id === button.dataset.vote);
    if (!option) return;
    votes[option.id] = Math.min(votes[option.id] + 1, Number.MAX_SAFE_INTEGER);
    try { localStorage.setItem(storageKey, JSON.stringify(votes)); } catch { /* 無法持久保存時仍更新畫面。 */ }
    render();
    confirming = true;
    document.querySelectorAll('[data-vote]').forEach(node => { node.disabled = true; });
    confirmation.innerHTML = `<div class="vote-confirmation-overlay" role="status" aria-live="polite" aria-atomic="true"><div class="vote-confirmation-card" style="--confirmation-accent:${option.accent}"><span class="vote-confirmation-icon">${E.icon('check', 42)}</span><p class="eyebrow">VOTE RECORDED</p><h2>感謝您的投票</h2><p>你為「${option.title}」加入了一次城市選擇。</p><div class="vote-confirmation-total"><span>這個方向目前累積</span><strong>${votes[option.id]}</strong><small>次選擇</small></div><div class="vote-confirmation-progress" aria-hidden="true"><span></span></div><small>稍後即可繼續選擇</small></div></div>`;
    timer = window.setTimeout(() => {
      confirmation.replaceChildren();
      confirming = false;
      document.querySelectorAll('[data-vote]').forEach(node => { node.disabled = false; });
      button.focus({ preventScroll: true });
      timer = null;
    }, 2600);
  });

  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) {
      options.forEach(option => { votes[option.id] = 0; });
      restore();
      render();
    }
  });
  window.addEventListener('pagehide', () => { if (timer) window.clearTimeout(timer); });
  window.addEventListener('pageshow', () => {
    confirming = false;
    confirmation.replaceChildren();
    document.querySelectorAll('[data-vote]').forEach(node => { node.disabled = false; });
    restore();
    render();
  });
  restore();
  render();
})();
