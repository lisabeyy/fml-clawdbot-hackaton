// Markets endpoint - returns seeded examples only (serverless = no shared state)

const SEEDED_MARKETS = [
  {
    id: 'seed-1',
    creator: 'demo',
    content: 'Locked myself out after taking trash out in my underwear at 3 AM. Neighbors saw everything.',
    deserved_percent: 28,
    fml_percent: 72,
    vote_count: 8,
    total_volume: '1.2',
    time_remaining: '23h 45m',
    resolved: false,
    created_at: Date.now() - 3600000,
  },
  {
    id: 'seed-2',
    creator: 'demo',
    content: 'Spilled entire pot of coffee on my laptop during investor pitch. They just watched it die.',
    deserved_percent: 32,
    fml_percent: 68,
    vote_count: 12,
    total_volume: '2.4',
    time_remaining: '31h 12m',
    resolved: false,
    created_at: Date.now() - 7200000,
  },
  {
    id: 'seed-3',
    creator: 'demo',
    content: 'Rear-ended someone while texting about how texting and driving should be illegal.',
    deserved_percent: 89,
    fml_percent: 11,
    vote_count: 15,
    total_volume: '3.8',
    time_remaining: '18h 33m',
    resolved: false,
    created_at: Date.now() - 10800000,
  },
  {
    id: 'seed-4',
    creator: 'demo',
    content: 'Boss found my Reddit post complaining about him. I used a throwaway but mentioned too many specific details.',
    deserved_percent: 65,
    fml_percent: 35,
    vote_count: 20,
    total_volume: '5.2',
    time_remaining: '12h 8m',
    resolved: false,
    created_at: Date.now() - 14400000,
  },
];

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const filter = req.query.filter || 'active';
    
    // Return seeded markets
    if (filter === 'resolved') {
      return res.json([]);
    }
    
    return res.json(SEEDED_MARKETS);
  }

  if (req.method === 'POST') {
    // Create new market (just return success for demo)
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

    const newMarket = {
      id: `market_${Date.now()}`,
      creator: wallet || 'anonymous',
      content,
      deserved_percent: 50,
      fml_percent: 50,
      vote_count: 0,
      total_volume: initial_liquidity.toFixed(2),
      time_remaining: '48h 0m',
      resolved: false,
      created_at: Date.now(),
    };

    // Note: In serverless, this won't persist. Need real DB for that.
    // For now, just return success
    return res.status(201).json(newMarket);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
