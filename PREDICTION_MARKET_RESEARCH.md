# Prediction Market Research & Fee Analysis

## Major Prediction Markets Comparison

### 1. Polymarket (Largest Crypto Prediction Market)
**Fee Structure:**
- **Trading fees:** 2% (paid to liquidity providers)
- **Market creation:** Free
- **Resolution:** Handled by UMA oracle

**Key Insights:**
- 2% is industry standard for crypto prediction markets
- Fees incentivize liquidity provision
- High volume = sustainable model
- $3B+ in total volume proves 2% works at scale

### 2. Kalshi (Regulated US Market)
**Fee Structure:**
- **Trading fees:** ~3-4% (includes regulatory costs)
- **Market creation:** Only staff creates markets
- **Withdrawal:** $20 per withdrawal

**Key Insights:**
- Higher fees due to regulation
- Centralized market creation
- Still successful despite higher costs

### 3. Manifold Markets
**Fee Structure:**
- **Trading fees:** ~5% (goes to market creator)
- **Market creation:** Free (uses "Mana" play money)
- **Resolution:** Creator decides

**Key Insights:**
- Creators earn 5% of trading volume
- Higher creator cut incentivizes quality markets
- Play money = less friction

### 4. Augur (Decentralized)
**Fee Structure:**
- **Trading fees:** 1% (goes to REP holders)
- **Market creation:** ~$1 in ETH
- **Resolution:** Decentralized voting

**Key Insights:**
- Lower fees but higher gas costs (Ethereum)
- Market creation cost prevents spam
- Decentralized resolution expensive

## Our Model Analysis

### Current: 2% Creator Fee

**Advantages:**
- ✅ Matches Polymarket's proven 2% rate
- ✅ Lower than Manifold's 5% (more trader-friendly)
- ✅ Incentivizes controversial content
- ✅ Simple, transparent

**Disadvantages:**
- ⚠️ Might be too low for small markets
- ⚠️ No liquidity provider rewards
- ⚠️ Creator only earns on volume (not initial pot)

### Alternative Fee Structures

#### Option A: 3% Creator Fee (Higher)
```
Trade: 100 SOL
Creator gets: 3 SOL
Trader pays: 103 SOL total
```
**Pros:** Better creator economics  
**Cons:** Less competitive vs Polymarket

#### Option B: 2% Creator + 1% Protocol Fee
```
Trade: 100 SOL
Creator gets: 2 SOL
Protocol gets: 1 SOL (for development/maintenance)
Trader pays: 103 SOL total
```
**Pros:** Sustainable development funding  
**Cons:** Higher total fees

#### Option C: Tiered Fees (Volume-Based)
```
0-10 SOL volume: 3% creator fee
10-100 SOL: 2% creator fee
100+ SOL: 1% creator fee
```
**Pros:** Encourages high-volume markets  
**Cons:** Complex implementation

## Bonding Curve Analysis

### What is a Bonding Curve?

A bonding curve is a mathematical relationship between price and supply. In prediction markets, it defines how share prices change as people trade.

### Our Implementation: Constant-Sum AMM

**Formula:**
```
deserved_reserve + fml_reserve = K (constant)
```

**How it works:**
```javascript
// Initial state
deserved_reserve = 50 SOL
fml_reserve = 50 SOL
K = 100 SOL

// Someone buys 1 SOL of "Deserved"
// This removes 1 SOL from deserved_reserve
new_deserved_reserve = 49 SOL
// To keep K constant, fml must increase
new_fml_reserve = 51 SOL

// Shares received = old_fml - new_fml
shares = 50 - 51 = -1 (wait, this is wrong!)
```

**❌ PROBLEM IDENTIFIED:** Our current AMM might be backwards!

### Correct Constant-Sum Formula

For buying "Deserved" shares:
```javascript
K = deserved_reserve + fml_reserve
amount_after_fee = amount * 0.98 // 2% fee

// To buy deserved shares, we ADD to the pool
new_deserved_reserve = deserved_reserve + amount_after_fee

// FML reserve adjusts to keep K constant
new_fml_reserve = K - new_deserved_reserve

// Shares we get out
shares = fml_reserve - new_fml_reserve
```

**Better explanation:**
- Pool starts: 50 Deserved, 50 FML (K=100)
- You add 10 SOL to buy Deserved
- New pool: 60 Deserved, 40 FML (K=100)
- FML dropped by 10, so you get 10 "Deserved" shares
- Deserved now more expensive (60% of pool vs 50%)

### Alternative: Constant-Product AMM (Uniswap Style)

**Formula:**
```
deserved_reserve * fml_reserve = K (constant)
```

**Example:**
```javascript
// Initial
deserved = 50, fml = 50
K = 50 * 50 = 2500

// Buy 10 SOL of Deserved
new_deserved = 50 + 10 = 60
// Solve: 60 * new_fml = 2500
new_fml = 2500 / 60 = 41.67

// You get: 50 - 41.67 = 8.33 shares
// (Less than constant-sum's 10 shares!)
```

**Comparison:**

| Metric | Constant-Sum | Constant-Product |
|--------|--------------|------------------|
| Price impact | Linear | Exponential |
| Slippage | Low | Higher |
| Liquidity depth | Shallower | Deeper |
| Best for | Small trades | All sizes |

**Constant-sum pros:**
- ✅ Prices = probabilities (50% = 50¢)
- ✅ Intuitive for users
- ✅ Simple math

**Constant-product pros:**
- ✅ Better liquidity for large trades
- ✅ Less price manipulation risk
- ✅ Battle-tested (Uniswap)

## Recommendations

### 1. Keep 2% Creator Fee ✅

**Reasoning:**
- Industry standard (Polymarket = 2%)
- Competitive with major platforms
- Simple and transparent
- Proven to work at scale

**Future consideration:** Add 1% protocol fee later if needed for sustainability.

### 2. Fix AMM Implementation ⚠️

**Current issue:** Need to verify constant-sum logic is correct

**Action items:**
1. Review amm.js implementation
2. Add unit tests with expected outputs
3. Verify shares calculation
4. Consider switching to constant-product if needed

### 3. Add Fee Breakdown to UI ✅

Show traders exactly what they're paying:
```
Trade: 1.0 SOL
Creator fee: 0.02 SOL (2%)
You receive: ~0.98 shares
```

### 4. Consider Fee Tiers for V2

Once we have data on market sizes:
- Small markets (<10 SOL): 3% creator fee
- Medium markets (10-100 SOL): 2% creator fee  
- Large markets (>100 SOL): 1% creator fee

Rewards creators of high-volume markets.

## Comparison to FML-Stories Model

### FML-Stories (Not a Prediction Market)
- $1 submission fee → treasury
- Weekly prize pool distribution
- Simple voting (no trading)
- No bonding curve (not a market)

### Our Model (True Prediction Market)
- Free to post stories
- 2% of all trading volume → creator
- Continuous trading with bonding curve
- Market resolves based on consensus

**Key difference:** We're a real prediction market with liquidity. FML-stories is a voting platform with prizes.

## Conclusion

✅ **2% creator fee is PERFECT**
- Industry standard
- Proven by Polymarket
- Competitive
- Incentivizes quality content

⚠️ **Bonding curve needs verification**
- Constant-sum is good for probabilities
- Need to ensure implementation is correct
- Consider constant-product for V2

💡 **Our model is sound**
- Better creator economics than prize pools
- Continuous earning (not weekly)
- Scales with popularity
- True market mechanism

## Next Steps

1. ✅ Keep 2% fee (no changes needed)
2. ⚠️ Review and test AMM implementation
3. 📊 Add fee breakdown to UI
4. 📈 Collect data to inform future fee tiers
5. 🚀 Deploy to devnet and validate with real trades
