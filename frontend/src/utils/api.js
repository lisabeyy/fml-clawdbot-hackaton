import axios from 'axios';

// Backend API base URL (adjust for production)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch all markets
 * @param {string} filter - 'active', 'resolved', or 'all'
 */
export async function fetchMarkets(filter = 'active') {
  const response = await api.get('/markets', { params: { filter } });
  return response.data;
}

/**
 * Fetch a single market by ID
 * @param {string} id - Market ID
 */
export async function fetchMarket(id) {
  const response = await api.get(`/markets/${id}`);
  return response.data;
}

/**
 * Create a new market
 * @param {string} content - Story content
 * @param {number} initialLiquidity - Initial SOL liquidity
 */
export async function createMarket(content, initialLiquidity) {
  const response = await api.post('/markets', {
    content,
    initial_liquidity: initialLiquidity,
  });
  return response.data;
}

/**
 * Buy shares in a market
 * @param {string} marketId - Market ID
 * @param {string} side - 'deserved' or 'fml'
 * @param {number} amount - SOL amount to spend
 */
export async function buyShares(marketId, side, amount) {
  const response = await api.post(`/markets/${marketId}/buy`, {
    side,
    amount,
  });
  return response.data;
}

/**
 * Fetch user's positions
 * @param {string} wallet - Wallet public key
 */
export async function fetchPositions(wallet) {
  const response = await api.get(`/positions/${wallet}`);
  return response.data;
}

/**
 * Fetch global stats
 */
export async function fetchStats() {
  const response = await api.get('/stats');
  return response.data;
}

export default api;
