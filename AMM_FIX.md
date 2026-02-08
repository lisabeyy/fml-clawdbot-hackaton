# AMM Implementation Fix

## 🐛 Bug Found in Constant-Sum AMM

### Current Implementation (WRONG)

```javascript
if (side === 'deserved') {
  market.fmlReserve += netAmount;  // ❌ Adding to FML
  market.deservedReserve = k - market.fmlReserve;
  shares = netAmount;
}
```

**Problem:** When buying "Deserved" shares, we're adding SOL to the FML pool. This is backwards!

### Correct Implementation

```javascript
if (side === 'deserved') {
  market.deservedReserve += netAmount;  // ✅ Add to deserved pool
  market.fmlReserve = k - market.deservedReserve;  // ✅ FML adjusts
  shares = oldFmlReserve - market.fmlReserve;  // ✅ Shares from FML decrease
}
```

## Understanding Constant-Sum AMM

### The Invariant
```
deservedReserve + fmlReserve = K (constant)
```

### How Buying Works

When you buy "Deserved" shares:
1. You add SOL to the deserved pool
2. FML pool shrinks (to keep K constant)
3. You receive shares = amount FML decreased

**Example:**
```
Initial state:
- Deserved: 50 SOL
- FML: 50 SOL  
- K = 100 SOL

You buy 10 SOL of "Deserved":
- Your 10 SOL goes to deserved pool
- New deserved: 60 SOL
- New FML: 40 SOL (100 - 60)
- You get: 50 - 40 = 10 shares

Result:
- Deserved now 60% of pool (was 50%)
- FML now 40% of pool (was 50%)
- Price moved!
```

### Why This Makes Sense

**Before trade:**
- Deserved price = FML reserve / K = 50/100 = 50%
- FML price = Deserved reserve / K = 50/100 = 50%

**After 10 SOL buy of Deserved:**
- Deserved price = FML reserve / K = 40/100 = 40%
- FML price = Deserved reserve / K = 60/100 = 60%

Wait, that's still backwards! The price calculation is inverted.

## Correct Price Formula

The price of a share is how much SOL you need to get 1 share.

In constant-sum:
```
Price of Deserved = deservedReserve / K
Price of FML = fmlReserve / K
```

**Not inverted!** The more of something there is, the cheaper it is.

### Full Corrected Example

```
Initial: Deserved = 50, FML = 50, K = 100

Deserved price = 50/100 = 50%
FML price = 50/100 = 50%

Someone buys 10 SOL of Deserved:
1. Add 10 to deserved pool: 60
2. FML adjusts: 100 - 60 = 40
3. Shares received: old FML - new FML = 50 - 40 = 10

New prices:
Deserved price = 60/100 = 60% (more expensive!)
FML price = 40/100 = 40% (cheaper!)

Makes sense: Deserved is more popular, so it costs more.
```

## Corrected AMM Code

```javascript
buyShares(market, side, amount) {
  // Calculate fees
  const creatorFee = (amount * this.CREATOR_FEE_BPS) / 10000;
  const platformFee = (amount * this.PLATFORM_FEE_BPS) / 10000;
  const netAmount = amount - creatorFee - platformFee;

  // Store old reserves
  const oldDeservedReserve = market.deservedReserve;
  const oldFmlReserve = market.fmlReserve;
  const k = oldDeservedReserve + oldFmlReserve;

  let shares;
  
  if (side === 'deserved') {
    // Add SOL to deserved pool
    market.deservedReserve += netAmount;
    // FML adjusts to keep K constant
    market.fmlReserve = k - market.deservedReserve;
    // Shares = how much FML decreased
    shares = oldFmlReserve - market.fmlReserve;
  } else {
    // Add SOL to FML pool
    market.fmlReserve += netAmount;
    // Deserved adjusts to keep K constant
    market.deservedReserve = k - market.fmlReserve;
    // Shares = how much deserved decreased
    shares = oldDeservedReserve - market.deservedReserve;
  }

  // Update stats
  market.totalVolume += amount;
  market.voteCount += 1;
  market.creatorEarnings += creatorFee;

  return { shares, creatorFee, platformFee, netAmount };
}
```

## Price Calculation Fix

```javascript
calculatePrice(market, side) {
  const k = market.deservedReserve + market.fmlReserve;
  
  // Price = (reserve of that side) / K
  if (side === 'deserved') {
    return market.deservedReserve / k;  // ✅ Not inverted
  } else {
    return market.fmlReserve / k;  // ✅ Not inverted
  }
}

calculatePercentages(market) {
  const k = market.deservedReserve + market.fmlReserve;
  
  return {
    deserved: Math.round((market.deservedReserve / k) * 100),  // ✅ Fixed
    fml: Math.round((market.fmlReserve / k) * 100),  // ✅ Fixed
  };
}
```

## Summary

### ❌ OLD (Wrong):
- Buying deserved → adds to FML pool
- Price of deserved = FML reserve / K
- Percentages inverted

### ✅ NEW (Correct):
- Buying deserved → adds to deserved pool
- Price of deserved = deserved reserve / K  
- Percentages match reserves

## Impact

This bug means:
- Prices were inverted (buying made things cheaper instead of expensive)
- Markets would resolve backwards
- Traders would be confused

**Good news:** Only simulation mode affected. Contract (when deployed) should be written correctly from the start.

## Next Steps

1. Fix amm.js implementation
2. Add unit tests to verify
3. Update contract code to match
4. Test on devnet before mainnet
