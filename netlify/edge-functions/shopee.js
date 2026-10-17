import { handleShopee } from '../../lib/shopee-import.js';

export default async (req) => handleShopee(req);
export const config = { path: '/api/shopee' };
