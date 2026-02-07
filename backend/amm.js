/**
 * Constant-Sum AMM Simulator
 * Implements the same logic as the Anchor smart contract
 */

export class AMMSimulator {
  constructor() {
    this.CREATOR_FEE_BPS = 200; // 2%
    this.PLATFORM_FEE_BPS = 50;  // 0.5%
    this.MIN_TRADE = 0.001;
  }

  /**
   * Calculate current price for a side
   * Price of Deserved = FML Reserve / K
   * Price of FML = Deserved Reserve / K
   */
  calculatePrice(market, side) {
    const k = market.deservedReserve + market.fmlReserve;
    if (side === 'deserved') {
      return market.fmlReserve / k;
    } else {
      return market.deservedReserve / k;
    }
  }

  /**
   * Calculate percentages for display
   */
  calculatePercentages(market) {
    const k = market.deservedReserve + market.fmlReserve;
    return {
      deserved: Math.round((market.fmlReserve / k) * 100),
      fml: Math.round((market.deservedReserve / k) * 100),
    };
  }

  /**
   * Execute a trade
   * Returns: { shares, newReserves }
   */
  buyShares(market, side, amount) {
    if (amount < this.MIN_TRADE) {
      throw new Error(`Minimum trade is ${this.MIN_TRADE} SOL`);
    }

    // Calculate fees
    const creatorFee = (amount * this.CREATOR_FEE_BPS) / 10000;
    const platformFee = (amount * this.PLATFORM_FEE_BPS) / 10000;
    const netAmount = amount - creatorFee - platformFee;

    // Store old reserves for shares calculation
    const oldDeservedReserve = market.deservedReserve;
    const oldFmlReserve = market.fmlReserve;
    const k = oldDeservedReserve + oldFmlReserve;

    // Update reserves (constant-sum: deserved + fml = k)
    let shares;
    if (side === 'deserved') {
      market.fmlReserve += netAmount;
      market.deservedReserve = k - market.fmlReserve;
      shares = netAmount; // Simplified: shares ≈ amount spent
    } else {
      market.deservedReserve += netAmount;
      market.fmlReserve = k - market.deservedReserve;
      shares = netAmount;
    }

    // Update market stats
    market.totalVolume += amount;
    market.voteCount += 1;
    market.creatorEarnings += creatorFee;

    return {
      shares,
      creatorFee,
      platformFee,
      netAmount,
    };
  }

  /**
   * Check if market should resolve
   */
  shouldResolve(market) {
    const now = Date.now();
    const elapsed = now - market.createdAt;
    const TIME_LIMIT = 48 * 3600 * 1000; // 48 hours

    return market.voteCount >= 10 || elapsed >= TIME_LIMIT;
  }

  /**
   * Resolve market and calculate final percentages
   */
  resolveMarket(market) {
    if (market.resolved) {
      throw new Error('Market already resolved');
    }

    const percentages = this.calculatePercentages(market);
    
    market.resolved = true;
    market.resolvedAt = Date.now();
    market.finalDeservedPercent = percentages.deserved;
    market.finalFmlPercent = percentages.fml;

    return percentages;
  }

  /**
   * Calculate payout for a position
   */
  calculatePayout(market, position) {
    if (!market.resolved) {
      return 0;
    }

    const totalPot = market.deservedReserve + market.fmlReserve;
    const deservedPot = totalPot * (market.finalDeservedPercent / 100);
    const fmlPot = totalPot * (market.finalFmlPercent / 100);

    let payout = 0;

    // Calculate proportional share of each pot
    if (position.deservedShares > 0) {
      const totalDeservedShares = market.totalDeservedShares || position.deservedShares;
      payout += (position.deservedShares / totalDeservedShares) * deservedPot;
    }

    if (position.fmlShares > 0) {
      const totalFmlShares = market.totalFmlShares || position.fmlShares;
      payout += (position.fmlShares / totalFmlShares) * fmlPot;
    }

    return payout;
  }
}

export default AMMSimulator;
