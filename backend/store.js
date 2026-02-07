/**
 * In-Memory Data Store
 * For simulation mode - no database needed
 */

export class DataStore {
  constructor() {
    this.markets = new Map();
    this.positions = new Map(); // wallet -> marketId -> position
    this.nextMarketId = 1;
  }

  createMarket(content, initialLiquidity, creator = 'simulation-wallet') {
    const id = (this.nextMarketId++).toString();
    const half = initialLiquidity / 2;

    const market = {
      id,
      creator,
      content,
      deservedReserve: half,
      fmlReserve: half,
      totalVolume: 0,
      voteCount: 0,
      creatorEarnings: 0,
      createdAt: Date.now(),
      resolved: false,
      resolvedAt: null,
      finalDeservedPercent: null,
      finalFmlPercent: null,
      totalDeservedShares: 0,
      totalFmlShares: 0,
    };

    this.markets.set(id, market);
    return market;
  }

  getMarket(id) {
    return this.markets.get(id);
  }

  getAllMarkets(filter = 'all') {
    const markets = Array.from(this.markets.values());
    
    switch (filter) {
      case 'active':
        return markets.filter(m => !m.resolved);
      case 'resolved':
        return markets.filter(m => m.resolved);
      default:
        return markets;
    }
  }

  updateMarket(id, updates) {
    const market = this.markets.get(id);
    if (!market) {
      throw new Error('Market not found');
    }
    Object.assign(market, updates);
    return market;
  }

  getPosition(wallet, marketId) {
    const key = `${wallet}:${marketId}`;
    return this.positions.get(key) || {
      wallet,
      marketId,
      deservedShares: 0,
      fmlShares: 0,
      invested: 0,
    };
  }

  updatePosition(wallet, marketId, updates) {
    const key = `${wallet}:${marketId}`;
    const position = this.getPosition(wallet, marketId);
    Object.assign(position, updates);
    this.positions.set(key, position);
    return position;
  }

  getPositionsByWallet(wallet) {
    const positions = [];
    for (const [key, position] of this.positions.entries()) {
      if (key.startsWith(wallet + ':')) {
        const market = this.markets.get(position.marketId);
        positions.push({
          ...position,
          market,
        });
      }
    }
    return positions;
  }

  // Seed with example data
  seedExamples() {
    const examples = [
      {
        content: "Today I tried to impress my date by cooking. Set off fire alarm, sprinklers ruined my laptop, fire department showed up. FML",
        liquidity: 0.5,
      },
      {
        content: "I parked in a clearly marked 'No Parking' zone to 'just run in real quick' and got towed. $350 fine.",
        liquidity: 0.3,
      },
      {
        content: "Spent 3 months learning to code, applied for my dream job, accidentally sent the recruiter a meme instead of my resume.",
        liquidity: 0.4,
      },
      {
        content: "My neighbor's tree fell on my car during a storm. I had been meaning to ask them to trim it for months but never did.",
        liquidity: 0.2,
      },
    ];

    for (const example of examples) {
      this.createMarket(example.content, example.liquidity);
    }
  }
}

export default DataStore;
