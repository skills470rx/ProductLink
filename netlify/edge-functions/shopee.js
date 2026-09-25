function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

function allowedShopeeHost(hostname = "") {
  const host = String(hostname).toLowerCase();
  return host === "shopee.co.th"
    || host.endsWith(".shopee.co.th")
    || host === "shopee.com"
    || host.endsWith(".shopee.com");
}

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function meta(html, property) {
  const safe = property.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${safe}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${safe}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${safe}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${safe}["']`, "i")
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtml(m[1]).trim();
  }
  return "";
}

function firstPrice(html) {
  const candidates = [];
  for (const m of html.matchAll(/฿\s*([\d,]+(?:\.\d+)?)/g)) candidates.push(Number(m[1].replace(/,/g, "")));
  for (const m of html.matchAll(/"price"\s*:\s*"?([\d,.]+)/g)) candidates.push(Number(m[1].replace(/,/g, "")));
  for (const m of html.matchAll(/"price"\s*:\s*(\d+)/g)) {
    const n = Number(m[1]);
    candidates.push(n > 100000 ? n / 100000 : n);
  }
  const valid = candidates.filter(n => Number.isFinite(n) && n > 0 && n < 10000000);
  return valid.length ? Math.min(...valid) : 0;
}

function categoryFromTitle(title) {
  const t = title.toLowerCase();
  if (/ทาง|รถ|มอเตอร์|รถยนต์|รถกระบะ|ล้อใหญ่|สเปรย์|ยาง/.test(t)) return "auto";
  if (/แฟชั่น|เสื้อ|กระเป๋า|รองเท้า|มือถือ|หูของ|ร้องเท้า/.test(t)) return "fashion";
  if (/หูฟัง|ลำโพง|มอนิเตอร์|มือถือ|แล็ปท็อป|คอม|เกม/.test(t)) return "tech";
  if (/เครื่องของใช้|ม่าน|นอน|ของใช้|ห้อง|บ้าน/.test(t)) return "home";
  return "beauty";
}

function extractProductIds(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const path = decodeURIComponent(u.pathname);
    const patterns = [
      /\/product\/(\d+)\/(\d+)/i,
      /(?:^|[-/])i\.(\d+)\.(\d+)(?:$|[/?#])/i,
      /\/opaanlp\/(\d+)\/(\d+)/i
    ];
    for (const re of patterns) {
      const m = path.match(re);
      if (m) return { shopId: m[1], itemId: m[2] };
    }
    const shopId = u.searchParams.get('shopid') || u.searchParams.get('shop_id') || u.searchParams.get('shopId');
    const itemId = u.searchParams.get('itemid') || u.searchParams.get('item_id') || u.searchParams.get('itemId');
    if (/^\d+$/.test(shopId || '') && /^\d+$/.test(itemId || '')) return { shopId, itemId };
  } catch (_) {}
  return null;
}

function apiPrice(value) {
  const n = Number(String(value ?? '').replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n >= 100000 ? n / 100000 : n;
}

function apiImage(value) {
  if (!value) return '';
  if (typeof value === 'object') value = value.image || value.image_id || value.url || value.image_url || '';
  if (!value) return '';
  const s = String(value);
  return /^https?:\/\//i.test(s) ? s : 'https://down-th.img.susercontent.com/file/' + s;
}

function normalizeApiProduct(payload, originalUrl, finalUrl) {
  const data = payload?.data || payload || {};
  const item = data.item || payload?.item || data;
  const productPrice = data.product_price?.price || {};
  const before = data.product_price?.price_before_discount || {};
  const title = item.title || item.name || data.name || '';
  const price = apiPrice(productPrice.single_value ?? productPrice.range_min ?? item.price ?? data.price);
  const originalRaw = apiPrice(before.single_value ?? before.range_min ?? item.price_before_discount ?? data.price_before_discount);
  let image = item.image || data.image || '';
  const images = data.product_images?.images || item.images || data.images;
  if (!image && Array.isArray(images) && images.length) image = images[0];
  if (!title || !price) return null;
  return {
    title: String(title).trim(),
    image: apiImage(image),
    price,
    originalPrice: originalRaw > price ? originalRaw : null,
    url: originalUrl,
    category: categoryFromTitle(String(title)),
    highlight: String(item.description || data.description || ''),
    reason: '',
    source: 'shopee-api',
    resolvedUrl: finalUrl
  };
}

function unwrapOriginLink(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const origin = u.searchParams.get('origin_link');
    if (origin) return decodeURIComponent(origin);
  } catch (_) {}
  return rawUrl;
}

function decodePossibleUrl(value = '') {
  let s = decodeHtml(String(value))
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/')
    .replace(/\\u0026/gi, '&')
    .replace(/&amp;/gi, '&')
    .trim();
  try { s = decodeURIComponent(s); } catch (_) {}
  return s;
}

function shoPeeCandidateFromHtml(html, baseUrl) {
  const candidates = [];
  const refresh = html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]+content=["'][^"']*url\s*=\s*([^"'>]+)["']/i)
    || html.match(/<meta[^>]+content=["'][^"']*url\s*=\s*([^"'>]+)["'][^>]+http-equiv=["']?refresh["']?/i);
  if (refresh?.[1]) candidates.push(refresh[1]);

  for (const m of html.matchAll(/(?:https?:\\\/\\\/|https?:\/\/)[^"'<>\s]+/gi)) candidates.push(m[0]);
  for (const m of html.matchAll(/(?:origin_link|target_url|targetUrl|redirect_url|redirectUrl|deep_link|deepLink)["']?\s*[:=]\s*["']([^"']+)["']/gi)) candidates.push(m[1]);
  const canonical = meta(html, 'og:url') || (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] || '');
  if (canonical) candidates.unshift(canonical);

  for (const raw of candidates) {
    try {
      const decoded = decodePossibleUrl(raw);
      const absolute = new URL(decoded, baseUrl).toString();
      const u = new URL(absolute);
      if (allowedShopeeHost(u.hostname) && (extractProductIds(absolute) || u.hostname !== 's.shopee.co.th')) return absolute;
    } catch (_) {}
  }
  return '';
}

async function resolveViaMicrolink(rawUrl) {
  try {
    const response = await fetch('https://api.microlink.io?url=' + encodeURIComponent(rawUrl), {
      signal: AbortSignal.timeout(3200),
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) return '';
    const payload = await response.json();
    const candidates = [payload?.data?.url, payload?.data?.publisher?.url, payload?.data?.author?.url].filter(Boolean);
    for (const candidate of candidates) {
      try {
        const decoded = decodePossibleUrl(candidate);
        const u = new URL(decoded);
        if (allowedShopeeHost(u.hostname) && u.hostname !== 's.shopee.co.th') return decoded;
      } catch (_) {}
    }
  } catch (_) {}
  return '';
}

async function resolveViaDomainee(rawUrl) {
  try {
    const endpoint = 'https://api.domainee.dev/v1/tools/redirect-checker?url=' + encodeURIComponent(rawUrl);
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(3200), headers: { 'Accept': 'application/json' } });
    if (!response.ok) return '';
    const payload = await response.json();
    const candidates = [payload?.data?.finalUrl, ...(payload?.data?.hops || []).map(h => h?.url)].filter(Boolean).reverse();
    for (const candidate of candidates) {
      try {
        const decoded = decodePossibleUrl(candidate);
        const u = new URL(decoded);
        if (allowedShopeeHost(u.hostname) && u.hostname !== 's.shopee.co.th') return decoded;
      } catch (_) {}
    }
  } catch (_) {}
  return '';
}

async function resolveViaRedirectCheck(rawUrl) {
  try {
    const endpoint = 'https://www.redirectcheck.org/api/check?url=' + encodeURIComponent(rawUrl) + '&ua=Googlebot';
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(3200), headers: { 'Accept': 'application/json' } });
    if (!response.ok) return '';
    const payload = await response.json();
    const candidates = [
      payload?.final_result?.final_url,
      payload?.final_result?.canonical,
      ...(payload?.redirects || []).flatMap(r => [r?.to, r?.from])
    ].filter(Boolean);
    for (const candidate of candidates) {
      try {
        const decoded = decodePossibleUrl(candidate);
        const u = new URL(decoded);
        if (allowedShopeeHost(u.hostname) && u.hostname !== 's.shopee.co.th') return decoded;
      } catch (_) {}
    }
  } catch (_) {}
  return '';
}

async function resolveDirect(rawUrl) {
  try {
    const response = await fetch(rawUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(3200),
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8'
      }
    });
    const finalUrl = unwrapOriginLink(response.url || rawUrl);
    try {
      const u = new URL(finalUrl);
      if (allowedShopeeHost(u.hostname) && u.hostname !== 's.shopee.co.th') return finalUrl;
    } catch (_) {}
    const html = await response.text();
    return shoPeeCandidateFromHtml(html, rawUrl);
  } catch (_) {
    return '';
  }
}

async function resolveShopeeUrl(rawUrl) {
  const unwrapped = unwrapOriginLink(rawUrl);
  if (extractProductIds(unwrapped)) return unwrapped;
  try {
    const u = new URL(unwrapped);
    if (allowedShopeeHost(u.hostname) && u.hostname !== 's.shopee.co.th') return unwrapped;
  } catch (_) {}

  const results = await Promise.allSettled([
    resolveDirect(unwrapped),
    resolveViaDomainee(unwrapped),
    resolveViaRedirectCheck(unwrapped),
    resolveViaMicrolink(unwrapped)
  ]);

  const candidates = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);
  for (const candidate of candidates) if (extractProductIds(candidate)) return candidate;
  for (const candidate of candidates) {
    try {
      const u = new URL(candidate);
      if (allowedShopeeHost(u.hostname) && u.hostname !== 's.shopee.co.th') return candidate;
    } catch (_) {}
  }
  return unwrapped;
}
async function fetchApiProduct(ids, originalUrl, finalUrl) {
  if (!ids) return null;
  const endpoints = [
    'https://shopee.co.th/api/v4/pdp/get_pc?shop_id=' + ids.shopId + '&item_id=' + ids.itemId + '&tz_offset_minutes=420&detail_level=0',
    'https://shopee.co.th/api/v4/item/get?shopid=' + ids.shopId + '&itemid=' + ids.itemId
  ];
  const tasks = endpoints.map(async endpoint => {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(4500),
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
        'Referer': finalUrl,
        'x-api-source': 'pc',
        'x-requested-with': 'XMLHttpRequest'
      }
    });
    if (!response.ok) throw new Error('Shopee API HTTP ' + response.status);
    const payload = await response.json();
    const product = normalizeApiProduct(payload, originalUrl, finalUrl);
    if (!product) throw new Error('Shopee API returned no usable product');
    return product;
  });
  const results = await Promise.allSettled(tasks);
  for (const result of results) if (result.status === 'fulfilled' && result.value) return result.value;
  return null;
}

async function fetchJinaProduct(finalUrl, originalUrl) {
  try {
    const response = await fetch('https://r.jina.ai/' + finalUrl, {
      signal: AbortSignal.timeout(3800),
      headers: { 'Accept': 'text/plain' }
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (!text || text.length < 100) return null;

    const titleRaw = text.match(/^Title:\s*(.+)$/mi)?.[1] || '';
    const title = decodeHtml(titleRaw).replace(/\s*[|｜-]\s*Shopee.*$/i, '').trim();
    const prices = [...text.matchAll(/฿\s*([\d,]+(?:\.\d+)?)/g)]
      .map(m => Number(m[1].replace(/,/g, '')))
      .filter(n => Number.isFinite(n) && n > 0 && n < 10000000);
    const price = prices.length ? Math.min(...prices) : 0;
    const image = text.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i)?.[1] || '';
    if (!title || !price) return null;
    return {
      title,
      image,
      price,
      originalPrice: null,
      url: originalUrl,
      category: categoryFromTitle(title),
      highlight: '',
      reason: '',
      source: 'jina-reader',
      resolvedUrl: finalUrl
    };
  } catch (_) {
    return null;
  }
}
function decodeEmbedded(value = '') {
  return decodeHtml(String(value))
    .replace(/\\u0022/gi, '"')
    .replace(/\\u0027/gi, "'")
    .replace(/\\u003C/gi, '<')
    .replace(/\\u003E/gi, '>')
    .replace(/\\u0026/gi, '&')
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/')
    .replace(/\\"/g, '"');
}

function jsonStringValue(value = '') {
  try { return JSON.parse('"' + String(value).replace(/"/g, '\\"') + '"'); } catch (_) {}
  return decodeEmbedded(value).replace(/\\n/g, ' ').replace(/\\t/g, ' ').trim();
}

function embeddedPrice(value) {
  const n = Number(String(value ?? '').replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  // Shopee embeds monetary integers scaled by 100000 in its page JSON.
  if (Number.isInteger(n) && n >= 1000000) return Number((n / 100000).toFixed(2));
  return n < 10000000 ? n : 0;
}

function embeddedImage(value = '') {
  const s = decodeEmbedded(value).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return 'https://down-th.img.susercontent.com/file/' + s;
  return '';
}

function objectProductCandidate(obj, ids, originalUrl, finalUrl) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const rawItemId = obj.itemid ?? obj.item_id ?? obj.itemId ?? obj.product_id ?? obj.productId;
  const rawShopId = obj.shopid ?? obj.shop_id ?? obj.shopId;
  const idMatch = !ids || String(rawItemId ?? '') === String(ids.itemId) || String(rawShopId ?? '') === String(ids.shopId);
  if (!idMatch) return null;

  const title = obj.name ?? obj.title ?? obj.item_name ?? obj.itemName ?? obj.product_name ?? obj.productName ?? '';
  const priceRaw = obj.price ?? obj.price_min ?? obj.priceMin ?? obj.price_max ?? obj.priceMax
    ?? obj.product_price?.price?.single_value ?? obj.product_price?.price?.range_min;
  const price = embeddedPrice(priceRaw);
  if (!title || !price) return null;

  let image = obj.image ?? obj.image_id ?? obj.imageId ?? obj.image_url ?? obj.imageUrl ?? '';
  if (!image && Array.isArray(obj.images) && obj.images.length) image = obj.images[0];
  if (!image && Array.isArray(obj.image_list) && obj.image_list.length) image = obj.image_list[0];
  const originalRaw = obj.price_before_discount ?? obj.priceBeforeDiscount ?? obj.original_price ?? obj.originalPrice;
  const originalPriceValue = embeddedPrice(originalRaw);
  const cleanTitle = decodeEmbedded(title).trim();
  return {
    title: cleanTitle,
    image: embeddedImage(image),
    price,
    originalPrice: originalPriceValue > price ? originalPriceValue : null,
    url: originalUrl,
    category: categoryFromTitle(cleanTitle),
    highlight: decodeEmbedded(obj.description ?? obj.desc ?? '').trim(),
    reason: '',
    source: 'shopee-embedded-json',
    resolvedUrl: finalUrl
  };
}

function walkJsonForProduct(root, ids) {
  const seen = new Set();
  const stack = [root];
  let visited = 0;
  while (stack.length && visited < 25000) {
    const value = stack.pop();
    if (!value || typeof value !== 'object' || seen.has(value)) continue;
    seen.add(value);
    visited++;
    const candidate = objectProductCandidate(value, ids, '', '');
    if (candidate) return value;
    if (Array.isArray(value)) {
      for (let i = Math.min(value.length, 300) - 1; i >= 0; i--) stack.push(value[i]);
    } else {
      for (const child of Object.values(value)) if (child && typeof child === 'object') stack.push(child);
    }
  }
  return null;
}

function productFromEmbeddedHtml(html, originalUrl, finalUrl, ids) {
  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptRe)) {
    let text = match[1]?.trim();
    if (!text || text.length < 20) continue;
    const candidates = [text, decodeEmbedded(text)];
    for (const candidateText of candidates) {
      const trimmed = candidateText.trim();
      if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) continue;
      try {
        const parsed = JSON.parse(trimmed);
        const obj = walkJsonForProduct(parsed, ids);
        if (obj) {
          const product = objectProductCandidate(obj, ids, originalUrl, finalUrl);
          if (product) return product;
        }
      } catch (_) {}
    }
  }

  const normalized = decodeEmbedded(html);
  const needle = ids?.itemId ? String(ids.itemId) : '';
  const center = needle ? normalized.indexOf(needle) : -1;
  const segment = center >= 0
    ? normalized.slice(Math.max(0, center - 90000), Math.min(normalized.length, center + 90000))
    : normalized;

  const titlePatterns = [
    /"(?:item_name|itemName|product_name|productName|name|title)"\s*:\s*"((?:\\.|[^"\\]){4,500})"/gi,
    /'(?:item_name|itemName|product_name|productName|name|title)'\s*:\s*'([^']{4,500})'/gi
  ];
  let title = '';
  for (const re of titlePatterns) {
    for (const m of segment.matchAll(re)) {
      const candidate = jsonStringValue(m[1]).replace(/\s*[|｜-]\s*Shopee.*$/i, '').trim();
      if (candidate.length >= 4 && !/^(Shopee|Login|Sign Up|Thailand)$/i.test(candidate)) { title = candidate; break; }
    }
    if (title) break;
  }

  const pricePatterns = [
    /"(?:price_min|priceMin|price)"\s*:\s*"?(\d{2,15}(?:\.\d+)?)"?/gi,
    /'(?:price_min|priceMin|price)'\s*:\s*'?(\d{2,15}(?:\.\d+)?)'?/gi
  ];
  const prices = [];
  for (const re of pricePatterns) {
    for (const m of segment.matchAll(re)) {
      const p = embeddedPrice(m[1]);
      if (p > 0 && p < 10000000) prices.push(p);
    }
  }
  const price = prices.length ? Math.min(...prices) : 0;

  let image = '';
  const imageMatch = segment.match(/"(?:image|image_id|imageId)"\s*:\s*"([^"\\]{20,500})"/i);
  if (imageMatch?.[1]) image = embeddedImage(imageMatch[1]);

  if (!title || !price) return null;
  return {
    title,
    image,
    price,
    originalPrice: null,
    url: originalUrl,
    category: categoryFromTitle(title),
    highlight: '',
    reason: '',
    source: 'shopee-embedded-regex',
    resolvedUrl: finalUrl
  };
}
function productFromHtml(html, originalUrl, finalUrl, ids = null) {
  const embedded = productFromEmbeddedHtml(html, originalUrl, finalUrl, ids);
  if (embedded) return embedded;
  const rawTitle = meta(html, 'og:title') || meta(html, 'twitter:title') || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '');
  const title = decodeHtml(rawTitle).replace(/\s*[|｜-]\s*Shopee.*$/i, '').trim();
  const image = meta(html, 'og:image') || meta(html, 'twitter:image');
  const description = meta(html, 'og:description') || meta(html, 'description');
  const price = firstPrice(html);
  if (!title || !price) return null;
  const originalMatches = [...html.matchAll(/"price_before_discount"\s*:\s*(\d+)/g)]
    .map(m => Number(m[1]) > 1000 ? Number(m[1]) / 100000 : Number(m[1]))
    .filter(n => n > price && n < 10000000);
  return {
    title,
    image: image || '',
    price,
    originalPrice: originalMatches.length ? Math.max(...originalMatches) : null,
    url: originalUrl,
    category: categoryFromTitle(title),
    highlight: description || '',
    reason: '',
    source: 'shopee-page',
    resolvedUrl: finalUrl
  };
}

async function fetchShopee(url) {
  const finalUrl = await resolveShopeeUrl(url);
  const ids = extractProductIds(finalUrl) || extractProductIds(url);
  const diagnostics = [];

  const apiTask = (async () => {
    if (!ids) return null;
    const endpoints = [
      'https://shopee.co.th/api/v4/pdp/get_pc?shop_id=' + ids.shopId + '&item_id=' + ids.itemId + '&tz_offset_minutes=420&detail_level=0',
      'https://shopee.co.th/api/v4/item/get?shopid=' + ids.shopId + '&itemid=' + ids.itemId
    ];
    const attempts = await Promise.allSettled(endpoints.map(async (endpoint, index) => {
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(4200),
        headers: {
          'User-Agent': UA,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
          'Referer': finalUrl,
          'x-api-source': 'pc',
          'x-requested-with': 'XMLHttpRequest'
        }
      });
      if (!response.ok) throw new Error('api' + (index + 1) + '=' + response.status);
      const payload = await response.json();
      const product = normalizeApiProduct(payload, url, finalUrl);
      if (!product) throw new Error('api' + (index + 1) + '=no-data');
      return product;
    }));
    for (const r of attempts) {
      if (r.status === 'fulfilled' && r.value) return r.value;
      if (r.status === 'rejected') diagnostics.push(String(r.reason?.message || r.reason));
    }
    return null;
  })();

  const jinaTask = (async () => {
    try {
      const response = await fetch('https://r.jina.ai/' + finalUrl, {
        signal: AbortSignal.timeout(4200),
        headers: { 'Accept': 'text/plain' }
      });
      if (!response.ok) { diagnostics.push('jina=' + response.status); return null; }
      const text = await response.text();
      const titleRaw = text.match(/^Title:\s*(.+)$/mi)?.[1] || '';
      const title = decodeHtml(titleRaw).replace(/\s*[|｜-]\s*Shopee.*$/i, '').trim();
      const prices = [...text.matchAll(/฿\s*([\d,]+(?:\.\d+)?)/g)]
        .map(m => Number(m[1].replace(/,/g, '')))
        .filter(n => Number.isFinite(n) && n > 0 && n < 10000000);
      const price = prices.length ? Math.min(...prices) : 0;
      const image = text.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i)?.[1] || '';
      if (!title || !price) { diagnostics.push('jina=no-data(len:' + text.length + ')'); return null; }
      return { title, image, price, originalPrice: null, url, category: categoryFromTitle(title), highlight: '', reason: '', source: 'jina-reader', resolvedUrl: finalUrl };
    } catch (e) {
      diagnostics.push('jina=' + (e?.name || e?.message || 'error'));
      return null;
    }
  })();

  const pageAgents = [
    ['chrome', UA],
    ['googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
    ['twitterbot', 'Twitterbot/1.0'],
    ['facebookbot', 'facebookexternalhit/1.1']
  ];
  const pageTasks = pageAgents.map(async ([label, userAgent]) => {
    try {
      const response = await fetch(finalUrl, {
        redirect: 'follow',
        signal: AbortSignal.timeout(4200),
        headers: { 'User-Agent': userAgent, 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8' }
      });
      const html = await response.text();
      if (!response.ok) { diagnostics.push(label + '=' + response.status); return null; }
      const product = productFromHtml(html, url, response.url || finalUrl, ids);
      if (!product) diagnostics.push(label + '=no-data(len:' + html.length + ')');
      return product;
    } catch (e) {
      diagnostics.push(label + '=' + (e?.name || e?.message || 'error'));
      return null;
    }
  });

  const proxyTask = (async () => {
    try {
      const response = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(finalUrl), {
        signal: AbortSignal.timeout(4200),
        headers: { 'Accept': 'text/html,application/xhtml+xml' }
      });
      const html = await response.text();
      if (!response.ok) { diagnostics.push('proxy=' + response.status); return null; }
      const product = productFromHtml(html, url, finalUrl, ids);
      if (!product) diagnostics.push('proxy=no-data(len:' + html.length + ')');
      return product;
    } catch (e) {
      diagnostics.push('proxy=' + (e?.name || e?.message || 'error'));
      return null;
    }
  })();

  const results = await Promise.all([apiTask, jinaTask, ...pageTasks, proxyTask]);
  for (const product of results) if (product) return { product, finalUrl };

  const shortResolved = finalUrl !== url ? finalUrl.replace(/^https?:\/\//, '').slice(0, 100) : 'unresolved';
  throw new Error('Shopee page loaded but product data parser found nothing | resolved=' + shortResolved + ' | ids=' + (ids ? ids.shopId + '/' + ids.itemId : 'no') + ' | ' + diagnostics.slice(0, 8).join(', '));
}
export default async (req) => {
  try {
    if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    const requestUrl = new URL(req.url);
    const url = requestUrl.searchParams.get('url')?.trim();
    if (!url || !/^https?:\/\/(?:[^/]+\.)?shopee\.(?:co\.th|com)(?:\/|$)/i.test(url)) {
      return json({ error: 'ลิงก์ Shopee ไม่ถูกต้อง' }, 400);
    }
    const fetched = await fetchShopee(url);
    return json(fetched.product);
  } catch (error) {
    console.error('shopee edge import error', error);
    return json({ error: error?.message || 'ดึงข้อมูล Shopee ไม่สำเร็จ' }, 502);
  }
};
export const config = { path: "/api/shopee" };
