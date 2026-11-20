import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(resolve(root, path), 'utf8');
const pages = ['index.html', 'attractions.html', 'food.html', 'routes.html', 'vision.html'];
const data = JSON.parse(await read('data/tourism.json'));
let checkedImages = 0;

// 確認直接開啟任何一頁時，所有相對路徑都能找到完整檔案。
for (const page of pages) {
  const html = await read(page);
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<html lang="zh-Hant">/);
  assert.equal((html.match(/aria-current="page"/g) || []).length, 1, `${page} 的目前頁面標記`);
  for (const target of pages) assert.ok(html.includes(`href="${target === "index.html" ? "./" : target}"`), `${page} 缺少 ${target} 導覽`);
  for (const [, path] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (/^https?:/.test(path)) continue;
    await access(resolve(root, path));
  }
  assert.doesNotMatch(html, /v-if|v-for|@click|<nuxt|<component|type="module"/i);
}

const qrContext = vm.createContext({ window: {} });
vm.runInContext(await read('assets/vendor/qrcodegen.js'), qrContext);
const qrLibrary = qrContext.window.qrcodegen;
for (const item of [...data.attractions, ...data.foods]) {
  assert.ok(item.name && item.id && item.sourceUrl, '地點須保留名稱、ID 及來源');
  assert.equal(new URL(item.image || item.imageSource).protocol, 'https:', '沿用官方圖片網址');
  checkedImages++;
  const target = item.website || item.mapUrl;
  if (target) {
    assert.equal(new URL(target).protocol, 'https:');
    const qr = qrLibrary.QrCode.encodeText(target, qrLibrary.QrCode.Ecc.MEDIUM);
    assert.ok(qr.size >= 21 && qr.size <= 177);
    assert.equal(qr.getModule(0, 0), true, 'QR Code 定位點');
    assert.equal(qr.getModule(1, 1), false, 'QR Code 定位點間隔');
    assert.equal(qr.getModule(3, 3), true, 'QR Code 定位點中心');
  }
}

// 以隔離的 DOM 替身檢查互動狀態；這不取代瀏覽器排版驗證。
function node() {
  return {
    innerHTML: '', textContent: '', style: {}, dataset: {}, disabled: false, inert: false, children: [],
    attributes: {}, listeners: {}, isConnected: true,
    addEventListener(type, callback) { this.listeners[type] = callback; },
    setAttribute(key, value) { this.attributes[key] = value; },
    focus() {}, replaceChildren() { this.innerHTML = ''; },
    classList: { add() {}, toggle() {} },
  };
}
function environment(page = 'attractions', saved = '{}') {
  const nodes = new Map();
  const get = key => {
    if (!nodes.has(key)) nodes.set(key, node());
    return nodes.get(key);
  };
  const controls = [node(), node()];
  const voteButtons = Array.from({ length: 4 }, node);
  get('#page-controls').querySelectorAll = () => controls;
  const filters = [];
  get('#town-filter').querySelectorAll = () => filters;
  const listeners = {};
  const storage = new Map([['taipei-vision-votes', saved]]);
  const timers = [];
  const document = {
    body: { dataset: { page } }, activeElement: node(), currentScript: { src: 'https://example.com/taipei-city-vision-exhibition-html/assets/js/common.js' },
    getElementById: id => get('#' + id),
    querySelector: get,
    querySelectorAll: selector => selector === '[data-vote]' ? voteButtons : selector === '[data-icon]' ? [] : [get(selector)],
    addEventListener(type, callback) { listeners[type] = callback; },
  };
  const window = {
    TAIPEI_DATA: data, qrcodegen: qrLibrary, innerWidth: 1080, innerHeight: 960,
    addEventListener(type, callback) { listeners[type] = callback; },
    setTimeout(callback, duration) { timers.push({ callback, duration }); return timers.length; }, clearTimeout() {},
  };
  const context = vm.createContext({ window, document, URL, console, fetch: async url => { assert.equal(url.href, 'https://example.com/taipei-city-vision-exhibition-html/data/tourism.json'); return { ok: true, json: async () => data }; }, HTMLImageElement: class {}, localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) } });
  return { context, window, get, controls, filters, timers, storage, listeners };
}

const common = await read('assets/js/common.js');
const places = await read('assets/js/places.js');
for (const page of ['attractions', 'food']) {
  const env = environment(page);
  await vm.runInContext(common, env.context);
  await vm.runInContext(places, env.context);
  const list = page === 'food' ? data.foods : data.attractions;
  const total = Math.ceil(new Set(list.map(item => item.name)).size / 6);
  assert.equal(env.get('#page-number').textContent, `1 / ${total}`);
  assert.equal((env.get('#places-grid').innerHTML.match(/class="place-card/g) || []).length, 6);
  env.get('#page-controls').listeners.click({ target: { closest: () => ({ dataset: { direction: -1 } }) } });
  assert.equal(env.get('#page-number').textContent, `${total} / ${total}`, '上一頁須循環到末頁');
  const town = list[0].town;
  const filterButton = node();
  filterButton.dataset.town = town;
  env.filters.push(filterButton);
  env.get('#town-filter').listeners.click({ target: { closest: () => filterButton } });
  assert.ok(env.get('#page-number').textContent.startsWith('1 / '), '切換行政區須重設頁碼');
  assert.equal(filterButton.attributes['aria-pressed'], 'true');
  assert.ok(env.get('#places-grid').innerHTML.includes(town));
  assert.ok(!env.get('#places-grid').innerHTML.includes('undefined'));
}

const routesEnv = environment('routes');
await vm.runInContext(common, routesEnv.context);
await vm.runInContext(await read('assets/js/routes.js'), routesEnv.context);
assert.equal((routesEnv.get('#route-grid').innerHTML.match(/class="route-card"/g) || []).length, 3);
let stops = 0;
for (const id of ['dadaocheng', 'beitou', 'xinyi']) {
  // 以實際產生的模態內容計算各路線站點。
  routesEnv.get('#modal-root').querySelector = () => node();
  routesEnv.get('#route-grid').listeners.click({ target: { closest: () => ({ dataset: { route: id } }) } });
  const rendered = routesEnv.get('#modal-root').innerHTML;
  const expected = id === 'beitou' ? 5 : 4;
  const count = (rendered.match(/role="button"/g) || []).length;
  assert.equal(count, expected, `${id} 路線站點數`);
  stops += count;
}
assert.equal(stops, 13);

const votesEnv = environment('vision', '{"walkable":2,"culture":-3,"smart":3.8,"green":"7"}');
await vm.runInContext(common, votesEnv.context);
await vm.runInContext(await read('assets/js/vision.js'), votesEnv.context);
assert.equal(votesEnv.get('#total-votes').textContent, 5, '排除負值與非數字，合法小數取整');
assert.equal(votesEnv.get('#vision-summary').textContent, '智慧服務 × 步行與交通');
const voteButton = node();
voteButton.dataset.vote = 'walkable';
const clickVote = () => votesEnv.get('.vision-options').listeners.click({ target: { closest: () => voteButton } });
clickVote();
clickVote();
assert.equal(votesEnv.get('#total-votes').textContent, 6, '確認畫面期間須阻擋重複投票');
assert.equal(JSON.parse(votesEnv.storage.get('taipei-vision-votes')).walkable, 3, '投票須立即保存');
assert.equal(votesEnv.timers[0].duration, 2600);
votesEnv.timers[0].callback();
clickVote();
assert.equal(votesEnv.get('#total-votes').textContent, 7);

// 資料載入失敗時顯示重試，不執行依賴資料的頁面程式。
const failed = environment('attractions');
failed.context.fetch = async () => ({ ok: false, status: 404 });
failed.context.console = { error() {} };
assert.equal(await vm.runInContext(common, failed.context), false);
await vm.runInContext(places, failed.context);
assert.ok(failed.get('.screen').innerHTML.includes('重新載入'));
assert.equal(failed.get('#places-grid').innerHTML, '');

const packageInfo = JSON.parse(await read('package.json'));
assert.equal(Object.keys(packageInfo.dependencies || {}).length, 0);
assert.equal(Object.keys(packageInfo.devDependencies || {}).length, 0);
for (const file of await readdir(resolve(root, 'assets/js'))) new vm.Script(await read(`assets/js/${file}`), { filename: file });
console.log(`檢查通過：${pages.length} 份獨立 HTML、${checkedImages} 筆官方圖片網址、QR Code 編碼、行政區篩選與循環分頁、3 條路線共 ${stops} 站、投票防連點及儲存。`);
console.log('此檢查不包含瀏覽器視覺排版驗證。');
