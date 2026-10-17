import { handleShopee } from '../../lib/shopee-import.js';

// Preserve the Functions endpoint with the same contract as the Edge endpoint.
export default async (req) => handleShopee(req);
