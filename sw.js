// 语寓工作台 · Service Worker（离线可用 + 自动更新）
// 策略：导航与同源静态资源走「网络优先，失败回退缓存」；第三方请求（GitHub API 等）直接走网络。
const CACHE = 'yu-workbench-v1';
const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/api.js',
  './js/app.js',
  './js/xlsx.full.min.js',
  './img/icon.svg',
  './img/wawa.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 第三方 API 不拦截

  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
  );
});
