const REPO_RAW = 'https://raw.githubusercontent.com/sismadi/piawai/main';
const CACHE_TTL = 604800; // 7 hari

const CRAWLERS = [
  'Googlebot', 'Googlebot-Image', 'AdsBot-Google',
  'Bingbot', 'Slurp', 'DuckDuckBot',
  'facebookexternalhit', 'WhatsApp', 'Twitterbot',
  'LinkedInBot', 'TelegramBot',
];

const ROUTES = {
  '/':           'data/web/page/home.json',
  '/index.html': 'data/web/page/home.json',
  '/profile':    'data/web/page/profile.json',
  '/kontak':     'data/web/page/kontak.json',
  '/lms':        'data/lms/web/page/home.json',
  '/presensi':   'data/presensi/page/home.json',
  '/transaksi':  'data/transaksi/page/home.json',
  '/keuangan':   'data/keuangan/page/home.json',
};

const OG_IMAGE = 'https://piawai.id/assets/og-piawai.png';

const CANONICAL = {
  '/':           'https://piawai.id',
  '/index.html': 'https://piawai.id',
  '/profile':    'https://piawai.id/profile',
  '/kontak':     'https://piawai.id/kontak',
  '/lms':        'https://piawai.id/lms',
  '/presensi':   'https://piawai.id/presensi',
  '/transaksi':  'https://piawai.id/transaksi',
  '/keuangan':   'https://piawai.id/keuangan',
};

function isCrawler(userAgent) {
  if (!userAgent) return false;
  return CRAWLERS.some(bot => userAgent.includes(bot));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHeader(content) {
  const nama     = escapeHtml(content.nama     || '');
  const tagline  = escapeHtml(content.tagline  || '');
  const deskripsi = escapeHtml((content.deskripsi || '').replace(/\n/g, ' '));
  return `<h1>${nama}</h1><p class="tagline">${tagline}</p><p>${deskripsi}</p>`;
}

function renderStats(section) {
  const caption = escapeHtml(section.caption || '');
  const items = (section.content || []).map(item => {
    const nama = escapeHtml(item.nama || '');
    const isi  = escapeHtml((item.isi || '').replace(/\n/g, ' '));
    const link = item.url ? `<a href="${escapeHtml(item.url)}">${nama}</a>` : `<strong>${nama}</strong>`;
    return `<li>${link} — ${isi}</li>`;
  }).join('');
  return `<section><h2>${caption}</h2><ul>${items}</ul></section>`;
}

function renderTable(section) {
  const caption = escapeHtml(section.caption || '');
  const rows = section.content || [];
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const thead = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
  const tbody = rows.map(row =>
    `<tr>${headers.map(h => `<td>${escapeHtml(row[h] || '')}</td>`).join('')}</tr>`
  ).join('');
  return `<section><h2>${caption}</h2><table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></section>`;
}

function renderNav() {
  return `<nav>
    <ul>
      <li><a href="/">Beranda</a></li>
      <li><a href="/profile">Tentang Piawai</a></li>
      <li><a href="/kontak">Hubungi Kami</a></li>
    </ul>
  </nav>`;
}

function buildHtml(path, data) {
  const sections = data.data || [];
  const headerSection = sections.find(s => s.section === 'header');
  const content = headerSection ? headerSection.content : {};

  const title     = content.nama    ? `${escapeHtml(content.nama)} — Piawai` : 'Piawai';
  const metaDesc  = escapeHtml((content.deskripsi || '').replace(/\n/g, ' ').slice(0, 160));
  const ogTitle   = escapeHtml(content.tagline || content.nama || 'Piawai');
  const canonical = CANONICAL[path] || 'https://piawai.id';

  const body = sections.map(section => {
    if (section.section === 'header') return renderHeader(section.content || {});
    if (section.section === 'stats')  return renderStats(section);
    if (section.section === 'table')  return renderTable(section);
    return '';
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${metaDesc}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${metaDesc}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta property="og:locale" content="id_ID">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Piawai",
  "url": "https://piawai.id",
  "description": "Ekosistem empat aplikasi web untuk institusi pendidikan dan UMKM Indonesia: LMS, Presensi, Transaksi, Keuangan.",
  "address": { "@type": "PostalAddress", "addressLocality": "Jakarta", "addressCountry": "ID" },
  "contactPoint": { "@type": "ContactPoint", "telephone": "+62-878-8507-3237", "contactType": "customer service" }
}
<\/script>
</head>
<body>
${renderNav()}
<main>
${body}
</main>
<footer>
<p>Piawai — Jakarta, Indonesia</p>
<p>WhatsApp: <a href="https://wa.me/6287885073237">+62 878 8507 3237</a></p>
<p>Email: <a href="mailto:wawan@sismadi.com">wawan@sismadi.com</a></p>
<ul>
  <li><a href="/lms">LMS — Platform Pembelajaran Online</a></li>
  <li><a href="/presensi">Presensi — Absensi Digital</a></li>
  <li><a href="/transaksi">Transaksi — Kasir Digital dan Manajemen Stok</a></li>
  <li><a href="/keuangan">Keuangan — Pembukuan dan Laporan Keuangan</a></li>
</ul>
</footer>
</body>
</html>`;
}

async function fetchJson(jsonPath, cacheStorage) {
  const url = `${REPO_RAW}/${jsonPath}`;
  const cacheKey = new Request(url);

  const cached = await cacheStorage.match(cacheKey);
  if (cached) return cached.json();

  const res = await fetch(url);
  if (!res.ok) return null;

  const clone = res.clone();
  const cacheResponse = new Response(clone.body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${CACHE_TTL}`,
    },
  });
  cacheStorage.put(cacheKey, cacheResponse);

  return res.json();
}

export default {
  async fetch(request, env, ctx) {
    const url  = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const ua   = request.headers.get('User-Agent') || '';

    if (!isCrawler(ua)) {
      return fetch(request);
    }

    const jsonPath = ROUTES[path];
    if (!jsonPath) {
      return fetch(request);
    }

    try {
      const cache = caches.default;
      const cacheKey = new Request(`https://piawai.id/__seo_cache__${path}`);

      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      const data = await fetchJson(jsonPath, cache);
      if (!data) return fetch(request);

      const html = buildHtml(path, data);

      const response = new Response(html, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
          'X-Piawai-Renderer': 'worker',
        },
      });

      ctx.waitUntil(cache.put(cacheKey, response.clone()));

      return response;

    } catch (err) {
      return fetch(request);
    }
  },
};
