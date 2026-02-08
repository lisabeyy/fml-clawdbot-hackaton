// Markets endpoint - GET list or POST create
import { AMMSimulator } from '../backend/amm.js';
import { DataStore } from '../backend/store.js';

// Initialize per request (serverless)
const amm = new AMMSimulator();
const store = new DataStore();
store.seedExamples();

function formatMarket(market) {
  const percentages = amm.calculatePercentages(market);
  const timeRemaining = market.resolved ? null : getTimeRemaining(market.createdAt);

  return {
    id: market.id,
    creator: market.creator,
    content: market.content,
    deserved_percent: percentages.deserved,
    fml_percent: percentages.fml,
    vote_count: market.voteCount,
    total_volume: market.totalVolume.toFixed(4),
    time_remaining: timeRemaining,
    resolved: market.resolved,
    created_at: market.createdAt,
  };
}

function getTimeRemaining(createdAt) {
  const elapsed = Date.now() - createdAt;
  const limit = 48 * 3600 * 1000;
  const remaining = limit - elapsed;

  if (remaining <= 0) return 'Ended';

  const hours = Math.floor(remaining / (3600 * 1000));
  const minutes = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    // List markets
    const filter = req.query.filter || 'active';
    const markets = store.getAllMarkets(filter);
    res.json(markets.map(formatMarket));
  } else if (req.method === 'POST') {
    // Create market
    const { content, initial_liquidity, wallet } = req.body;

    if (!content || content.length < 10) {
      return res.status(400).json({ error: 'Content must be at least 10 characters' });
    }
    if (content.length > 280) {
      return res.status(400).json({ error: 'Content must be 280 characters or less' });
    }
    if (!initial_liquidity || initial_liquidity < 0.1) {
      return res.status(400).json({ error: 'Minimum liquidity is 0.1 SOL' });
    }

    const market = store.createMarket(content, initial_liquidity, wallet || 'anonymous');
    res.status(201).json(formatMarket(market));
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
