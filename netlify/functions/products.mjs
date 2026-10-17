import { getStore } from '@netlify/blobs';
import { database } from '../../db/index.ts';
import { products } from '../../db/schema.ts';
import { handleProducts } from '../../lib/products-api.js';
import { normalizeProduct } from '../../product-model.js';

export default async (req) => handleProducts(req, {
  async list() {
    const db = database();
    // Legacy catalog remains read-only and visible; new records go to Postgres.
    const [rows, legacyResult] = await Promise.all([
      db.select().from(products),
      getStore('productlink-products').get('catalog', { type: 'json', consistency: 'strong' })
        .then(data => ({ data, ok: true })).catch(() => ({ data: [], ok: false })),
    ]);
    const merged = new Map();
    if (Array.isArray(legacyResult.data)) for (const raw of legacyResult.data) {
      try { const p = normalizeProduct(raw); merged.set(p.url, p); } catch { /* Invalid legacy row. */ }
    }
    for (const row of rows) merged.set(row.url, { ...row.data, id: row.id + 1000000 });
    return { products: [...merged.values()], warning: legacyResult.ok ? null : 'LEGACY_STORAGE_UNAVAILABLE' };
  },
  async save(incoming) {
    const db = database();
    // Unique URL prevents duplicate imports and concurrent lost writes.
    const unique = [...new Map(incoming.map(p => [p.url, p])).values()];
    return db.transaction(async tx => {
      const rows = await tx.insert(products).values(unique.map(p => ({ url: p.url, data: p })))
        .onConflictDoUpdate({ target: products.url, set: { url: products.url } }).returning();
      return rows.map(row => ({ ...row.data, id: row.id + 1000000 }));
    });
  },
});
