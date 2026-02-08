/**
 * Constant-Sum AMM Simulator (FIXED)
 * Implements the same logic as the Anchor smart contract
 */

export class AMMSimulator {
  constructor() {
    this.CREATOR_FEE_BPS = 200; // 2%
    this.PLATFORM_FEE_BPS = 0;  // 0% (all fees go to creator for now)
    this.MIN_TRADE = 0.001;
  }

  /**
   * Calculate current price for a side
   * Price = (reserve of that side) / K
   */
  calculatePrice(market, side) {
    const k = market.deservedReserve + market.fmlReserve;
    if (side === 'deserved') {
      return market.deservedReserve / k;
    } else {
      return market.fmlReserve / k;
    }
  }

  /**
   * Calculate percentages for display (represents current betting odds)
   */
  calculatePercentages(market) {
    const k = market.deservedReserve + market.fmlReserve;
    return {
      deserved: Math.round((market.deservedReserve / k) * 100),
      fml: Math.round((market.fmlReserve / k) * 100),
    };
  }

  /**
   * Execute a trade (buy shares)
   * 
   * Constant-sum invariant: deservedReserve + fmlReserve = K
   * 
   * When buying "deserved" shares:
   * 1. Add SOL to deserved pool
   * 2. FML pool decreases (to keep K constant)
   * 3. Shares received = amount FML decreased
   * 
   * Returns: { shares, creatorFee, netAmount }
   */
  buyShares(market, side, amount) {
    if (amount < this.MIN_TRADE) {
      throw new Error(`Minimum trade is ${this.MIN_TRADE} SOL`);
    }

    // Calculate fees (2% to creator)
    const creatorFee = (amount * this.CREATOR_FEE_BPS) / 10000;
    const platformFee = (amount * this.PLATFORM_FEE_BPS) / 10000;
    const netAmount = amount - creatorFee - platformFee;

    // Store old reserves for shares calculation
    const oldDeservedReserve = market.deservedReserve;
    const oldFmlReserve = market.fmlReserve;
    const k = oldDeservedReserve + oldFmlReserve;

    // Update reserves based on constant-sum formula
    let shares;
    
    if (side === 'deserved') {
      // Buying deserved: add to deserved pool
      market.deservedReserve += netAmount;
      // FML adjusts to keep K constant
      market.fmlReserve = k - market.deservedReserve;
      // Shares = how much FML decreased
      shares = oldFmlReserve - market.fmlReserve;
    } else {
      // Buying FML: add to FML pool
      market.fmlReserve += netAmount;
      // Deserved adjusts to keep K constant
      market.deservedReserve = k - market.fmlReserve;
      // Shares = how much deserved decreased
      shares = oldDeservedReserve - market.deservedReserve;
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
   * 
   * Resolution conditions:
   * 1. Minimum 48 hours must pass (prevents instant manipulation)
   * 2. Then either:
   *    a) 20 SOL trading volume reached (high engagement), OR
   *    b) 7 days elapsed (auto-resolve low-volume markets)
   */
  shouldResolve(market) {
    const now = Date.now();
    const elapsed = now - market.createdAt;
    
    // Constants
    const MIN_TIME = 48 * 3600 * 1000;     // 48 hours
    const MAX_TIME = 7 * 24 * 3600 * 1000; // 7 days  
    const MIN_VOLUME = 20;                  // 20 SOL
    
    // Must wait at least 48 hours
    if (elapsed < MIN_TIME) {
      return false;
    }
    
    // Auto-resolve after 7 days
    if (elapsed >= MAX_TIME) {
      return true;
    }
    
    // Can resolve if hit volume threshold (after 48h)
    return market.totalVolume >= MIN_VOLUME;
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
   * Calculate payout for a position (after market resolves)
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
