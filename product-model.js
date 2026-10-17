// Shared browser/server validation. Unknown commerce values stay null.
export function shopeeUrl(value) {
  try {
    const url = new URL(String(value).trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (!['shopee.co.th', 'www.shopee.co.th', 's.shopee.co.th', 'shopee.com', 'www.shopee.com'].includes(url.hostname)) return null;
    if (url.pathname === '/') return null;
    url.hash = '';
    return url;
  } catch { return null; }
}

export function productIds(value) {
  const url = shopeeUrl(value);
  if (!url) return null;
  let path;
  try { path = decodeURIComponent(url.pathname); } catch { return null; }
  const match = path.match(/\/(?:product|opaanlp)\/(\d+)\/(\d+)(?:\/|$)/i)
    || path.match(/(?:^|[-/])i\.(\d+)\.(\d+)(?:\/|$)/i);
  if (match) return { shopId: match[1], itemId: match[2] };
  const shopId = url.searchParams.get('shopid') || url.searchParams.get('shop_id') || url.searchParams.get('shopId');
  const itemId = url.searchParams.get('itemid') || url.searchParams.get('item_id') || url.searchParams.get('itemId');
  return /^\d+$/.test(shopId || '') && /^\d+$/.test(itemId || '') ? { shopId, itemId } : null;
}

export function imageUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function amount(value) {
  if (value === '' || value == null || typeof value === 'boolean') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 10000000
    && Math.abs(number * 100 - Math.round(number * 100)) < 0.000001 ? number : null;
}

export function count(value) {
  const number = amount(value);
  return number !== null && Number.isSafeInteger(number) && number <= 1000000 ? number : null;
}

export function totals(price, quantity, shipping) {
  const unit = amount(price), qty = count(quantity), delivery = amount(shipping);
  if (unit === null || qty === null || qty < 1) return { subtotal: null, total: null };
  const subtotal = Math.round(unit * 100) * qty / 100;
  return { subtotal, total: delivery === null ? null : (Math.round(subtotal * 100) + Math.round(delivery * 100)) / 100 };
}

export function normalizeProduct(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('ข้อมูลสินค้าไม่ถูกต้อง');
  const title = String(raw.title || '').trim();
  const url = shopeeUrl(raw.url);
  const price = amount(raw.price);
  const quantity = raw.quantity == null ? 1 : count(raw.quantity);
  const shipping = amount(raw.shipping);
  const stock = count(raw.stock);
  if (!title || title.length > 500 || !url || price === null || price <= 0) throw new Error('กรุณาระบุชื่อสินค้า ราคา และลิงก์ Shopee ที่ถูกต้อง');
  if (quantity === null || quantity < 1) throw new Error('จำนวนสินค้าต้องเป็นจำนวนเต็มอย่างน้อย 1');
  if (raw.shipping != null && raw.shipping !== '' && shipping === null) throw new Error('ค่าจัดส่งไม่ถูกต้อง');
  if (raw.stock != null && raw.stock !== '' && stock === null) throw new Error('สต็อกต้องเป็นจำนวนเต็มตั้งแต่ 0');
  if (!Array.isArray(raw.variants ?? []) || (raw.variants?.length || 0) > 50) throw new Error('ตัวเลือกสินค้ามากเกินไป');
  const variants = (raw.variants || []).map(v => {
    const name = String(v.name || '').trim();
    const variantPrice = amount(v.price), variantStock = count(v.stock);
    if (!name || name.length > 160 || (v.price != null && v.price !== '' && (variantPrice === null || variantPrice <= 0))
      || (v.stock != null && v.stock !== '' && variantStock === null)) throw new Error('กรุณาตรวจสอบชื่อ ราคา และสต็อกของตัวเลือก');
    return { name, price: variantPrice, stock: variantStock };
  });
  if (new Set(variants.map(v => v.name)).size !== variants.length) throw new Error('ชื่อตัวเลือกสินค้าต้องไม่ซ้ำกัน');
  const selectedVariant = String(raw.selectedVariant || '');
  const selected = variants.find(v => v.name === selectedVariant);
  if (selectedVariant && !selected) throw new Error('ไม่พบตัวเลือกที่เลือก');
  const effectivePrice = selected?.price ?? price;
  const effectiveStock = selected?.stock ?? stock;
  if (effectiveStock !== null && quantity > effectiveStock) throw new Error('จำนวนสินค้าเกินสต็อกที่ระบุ');
  const images = [...new Set([...(Array.isArray(raw.images) ? raw.images : []), raw.image].filter(Boolean).map(imageUrl))];
  if (images.includes('') || images.length > 12) throw new Error('ใช้ URL รูปภาพ HTTPS ที่ถูกต้อง ไม่เกิน 12 รูป');
  const ids = productIds(url.href);
  const originalPrice = amount(raw.originalPrice);
  return {
    id: Number.isSafeInteger(raw.id) && raw.id > 0 ? raw.id : 0,
    title, url: url.href, price: effectivePrice,
    originalPrice: originalPrice !== null && originalPrice > effectivePrice ? originalPrice : null,
    image: images[0] || '', images, variants, selectedVariant, stock, quantity, shipping,
    ...totals(effectivePrice, quantity, shipping),
    shopId: ids?.shopId || (/^\d+$/.test(raw.shopId || '') ? raw.shopId : null),
    itemId: ids?.itemId || (/^\d+$/.test(raw.itemId || '') ? raw.itemId : null),
    category: ['beauty', 'fashion', 'tech', 'home', 'auto'].includes(raw.category) ? raw.category : 'beauty',
    tags: (Array.isArray(raw.tags) ? raw.tags : []).filter(t => ['hot', 'recommend', 'promo', 'commission'].includes(t)),
    clicks: 0, highlight: String(raw.description || raw.highlight || '').slice(0,10000),
    description: String(raw.description || raw.highlight || '').slice(0,10000),
    reason: String(raw.reason || '').slice(0,2000),
    source: ['public-html', 'manual'].includes(raw.source) ? raw.source : 'manual', priceSource: 'user',
  };
}
