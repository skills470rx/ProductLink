import { normalizeProduct } from '../product-model.js';

function json(value, status = 200) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
}

// Repository injection keeps tests off persistent storage.
export async function handleProducts(req, repository) {
  if (!['GET', 'POST'].includes(req.method)) return json({ error: 'Method not allowed' },405);
  if (req.method === 'POST') {
    let body;
    try {
      if (Number(req.headers.get('content-length')) > 250000) return json({ error: 'ข้อมูลมากเกินไป' },413);
      const text = await req.text();
      if (text.length > 250000) return json({ error: 'ข้อมูลมากเกินไป' },413);
      body = JSON.parse(text);
    } catch { return json({ error: 'Invalid JSON' },400); }
    if (!Array.isArray(body?.products) || body.products.length < 1 || body.products.length > 30) return json({ error: 'ส่งสินค้า 1–30 รายการต่อครั้ง' },400);
    let incoming;
    try { incoming = body.products.map(normalizeProduct); }
    catch (error) { return json({ error: error.message },400); }
    try {
      const saved = await repository.save(incoming);
      return json({ ok: true, saved: saved.length, products: saved });
    } catch { return json({ error: 'บันทึกสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง', code: 'DATABASE_UNAVAILABLE' },503); }
  }
  try { return json(await repository.list()); }
  catch { return json({ error: 'โหลดสินค้าที่บันทึกไว้ไม่สำเร็จ', code: 'DATABASE_UNAVAILABLE' },503); }
}
