import { imageUrl, productIds, shopeeUrl } from '../product-model.js';

function decodeHtml(value = '') {
  return value.replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => {
    const n = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
  }).replace(/&quot;/gi, '"').replace(/&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&');
}

// Public structured prices are THB amounts, not the 100000-scaled integers of
// Shopee's private item API. Never infer units from the magnitude of a number.
function publicPrice(value, currency) {
  if (String(currency).toUpperCase() !== 'THB' || !/^\d+(?:\.\d{1,2})?$/.test(String(value ?? ''))) return null;
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function publicImage(value, base) {
  if (value && typeof value === 'object') value = value.url || value.contentUrl;
  if (typeof value !== 'string' || !value.trim()) return '';
  try { return imageUrl(new URL(value, base).href); } catch { return ''; }
}

function structuredProduct(html, ids) {
  const candidates = [];
  for (const script of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const root = JSON.parse(script[1]);
      const entries = Array.isArray(root) ? root : [root, ...(Array.isArray(root?.['@graph']) ? root['@graph'] : [])];
      for (const entry of entries) if (entry && [entry['@type']].flat().includes('Product')) candidates.push(entry);
    } catch { /* Malformed structured data must not hide usable Open Graph data. */ }
  }
  const matching = candidates.filter(candidate => {
    const candidateIds = productIds(candidate.url || candidate['@id']);
    if (candidateIds && ids) return candidateIds.shopId === ids.shopId && candidateIds.itemId === ids.itemId;
    if (ids && candidate.productID != null) return String(candidate.productID) === ids.itemId;
    return candidates.length === 1 && !candidateIds;
  });
  return matching.length === 1 ? matching[0] : null;
}

export function metadata(html) {
  const fields = new Map();
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = new Map();
    for (const match of tag[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attributes.set(match[1].toLowerCase(), decodeHtml(match[2] ?? match[3]));
    const key = (attributes.get('property') || attributes.get('name') || '').toLowerCase();
    if (key && attributes.has('content')) fields.set(key, [...(fields.get(key) || []), attributes.get('content').trim()]);
  }
  return fields;
}

export function publicProduct(html, originalUrl, resolvedUrl) {
  const tags = metadata(html);
  const first = name => tags.get(name)?.[0] || '';
  const canonical = first('al:web:url') || first('og:url');
  const ids = productIds(resolvedUrl) || productIds(canonical) || productIds(originalUrl);
  const structured = structuredProduct(html, ids);
  const title = String(structured?.name || first('og:title') || first('twitter:title')).replace(/\s*\|\s*Shopee[^|]*$/i, '').trim();
  const description = String(structured?.description || first('og:description') || first('description'));
  const structuredImages = structured?.image ? [structured.image].flat() : [];
  const images = [...new Set([...structuredImages, ...(tags.get('og:image') || []), ...(!tags.has('og:image') ? tags.get('twitter:image') || [] : [])].map(value => publicImage(value, resolvedUrl)).filter(Boolean))].slice(0,12);
  const offers = structured?.offers ? [structured.offers].flat() : [];
  // Multiple distinct offers need a variation choice; do not guess a price.
  const offer = offers.length === 1 ? offers[0] : null;
  const price = publicPrice(offer?.price, offer?.priceCurrency)
    ?? publicPrice(first('product:price:amount'), first('product:price:currency'));
  const realTitle = title && !/^(?:shopee(?: thailand)?|login|sign in|เข้าสู่ระบบ|access denied|error|page not found)$/i.test(title) ? title.slice(0,500) : '';
  const status = realTitle && images.length && price !== null ? 'success' : realTitle || images.length ? 'partial' : 'manual';
  return {
    title: realTitle, description, highlight: description, image: images[0] || '', images,
    price, originalPrice: null, stock: null, shipping: null, variants: [],
    shopId: ids?.shopId || null, itemId: ids?.itemId || null,
    url: originalUrl, resolvedUrl: ids ? `https://shopee.co.th/product/${ids.shopId}/${ids.itemId}` : null,
    status, source: status === 'manual' ? 'manual' : 'public-html', priceStatus: price === null ? 'manual' : 'available',
    message: price === null ? 'ราคาไม่สามารถดึงอัตโนมัติจาก Shopee ได้' : !images.length ? 'Shopee ไม่ส่งรูปสินค้าในข้อมูลสาธารณะ' : !realTitle ? 'Shopee ไม่ส่งชื่อสินค้าในข้อมูลสาธารณะ' : '',
    missingFields: [!realTitle && 'title', !images.length && 'images', !description && 'description', price === null && 'price'].filter(Boolean),
  };
}

class ImportError extends Error {
  constructor(code) { super(code); this.code = code; }
}

// Public HTML only: no internal APIs, proxies, session cookies, or crawler impersonation.
export async function importShopee(rawUrl, { fetcher = fetch, timeoutMs = 4000, wait = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
  const original = shopeeUrl(rawUrl);
  if (!original) throw new ImportError('INVALID_URL');
  let current = original;
  let lastUrl = original.href;
  const deadline = Date.now() + 12000;
  try {
    for (let hops = 0; hops <= 5; hops++) {
      let response, html;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const remaining = deadline - Date.now();
          if (remaining <= 0) throw new ImportError('TIMEOUT');
          response = await fetcher(current.href, {
            method: 'GET', redirect: 'manual', credentials: 'omit',
            signal: AbortSignal.timeout(Math.min(timeoutMs, remaining)),
            headers: { 'User-Agent': 'ProductLink/1.0 (public link preview)', 'Accept': 'text/html,application/xhtml+xml' },
          });
          if (response.status >= 500) {
            await response.body?.cancel();
            if (attempt === 0) { await wait(200); continue; }
            throw new ImportError('UPSTREAM_UNAVAILABLE');
          }
          if (response.status >= 300 && response.status < 400) break;
          if (!response.ok) { await response.body?.cancel(); throw new ImportError(response.status === 404 || response.status === 410 ? 'NOT_FOUND' : 'UPSTREAM_BLOCKED'); }
          if (!(response.headers.get('content-type') || '').includes('text/html')) throw new ImportError('UNSUPPORTED_CONTENT');
          const reader = response.body?.getReader();
          let bytes = 0;
          const decoder = new TextDecoder();
          html = '';
          if (reader) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                bytes += value.byteLength;
                if (bytes > 1500000) throw new ImportError('RESPONSE_TOO_LARGE');
                html += decoder.decode(value, { stream: true });
              }
              html += decoder.decode();
            } finally { await reader.cancel().catch(() => {}); }
          }
          break;
        } catch (error) {
          if (error instanceof ImportError) throw error;
          if (attempt === 0 && Date.now() < deadline) { await wait(200); continue; }
          throw new ImportError(error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR');
        }
      }
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        const next = location ? shopeeUrl(new URL(location, current).href) : null;
        if (!next) throw new ImportError('UNSAFE_REDIRECT');
        current = next;
        lastUrl = current.href;
        continue;
      }
      const product = publicProduct(html, original.href, current.href);
      return { ...product, warning: product.status === 'manual' ? 'PUBLIC_DATA_UNAVAILABLE' : product.status === 'partial' ? 'INCOMPLETE_PRODUCT' : null };
    }
    throw new ImportError('TOO_MANY_REDIRECTS');
  } catch (error) {
    return { ...publicProduct('', original.href, lastUrl), warning: error.code || 'NETWORK_ERROR' };
  }
}

export async function handleShopee(req, options) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (req.method !== 'GET') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...headers, Allow: 'GET' } });
  const url = new URL(req.url).searchParams.get('url');
  if (!shopeeUrl(url)) return new Response(JSON.stringify({ error: 'ใช้ลิงก์ HTTPS ของ Shopee ที่ถูกต้อง', code: 'INVALID_URL' }), { status: 400, headers });
  const product = await importShopee(url, options);
  const failures = {
    PUBLIC_DATA_UNAVAILABLE: ['Shopee ส่งหน้าเว็บที่ไม่มีข้อมูลรูปภาพหรือราคาสินค้าที่อ่านได้ กรุณากรอกข้อมูลเอง', 502],
    UPSTREAM_BLOCKED: ['Shopee จำกัดการเข้าถึงข้อมูลสินค้า กรุณากรอกข้อมูลเอง', 502],
    NOT_FOUND: ['ไม่พบสินค้าหรือลิงก์ Shopee นี้หมดอายุ', 404],
    TIMEOUT: ['Shopee ตอบกลับช้าเกินกำหนด กรุณาลองอีกครั้งหรือกรอกข้อมูลเอง', 504],
    UPSTREAM_UNAVAILABLE: ['Shopee ไม่พร้อมใช้งานชั่วคราว กรุณาลองอีกครั้ง', 503],
    NETWORK_ERROR: ['เชื่อมต่อ Shopee ไม่สำเร็จ กรุณาลองอีกครั้งหรือกรอกข้อมูลเอง', 502],
    UNSAFE_REDIRECT: ['ลิงก์เปลี่ยนเส้นทางไปยังปลายทางที่ไม่ใช่ Shopee', 502],
    TOO_MANY_REDIRECTS: ['ลิงก์ Shopee เปลี่ยนเส้นทางมากเกินไป', 502],
    UNSUPPORTED_CONTENT: ['Shopee ไม่ส่งข้อมูลหน้า HTML ที่อ่านได้', 502],
    RESPONSE_TOO_LARGE: ['ข้อมูลจาก Shopee มีขนาดเกินขีดจำกัด', 502],
  };
  const failure = failures[product.warning];
  return new Response(JSON.stringify(failure ? { ...product, code: product.warning, error: failure[0] } : product), { status: failure ? Number(failure[1]) : 200, headers });
}
