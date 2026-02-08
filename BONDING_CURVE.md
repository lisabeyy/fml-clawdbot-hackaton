# Bonding Curve Mechanics

## Every Story Becomes a Market

When you post a story, it doesn't just get likes — it becomes a **live prediction market** with its own bonding curve.

## How the Bonding Curve Works

We use a **constant-sum AMM** where prices represent probabilities:

```
deserved_price + fml_price = 100 (constant)
```

### Example Trade Flow

**Initial State:**
- Deserved pool: 50 SOL
- FML pool: 50 SOL
- Deserved price: 50% (50¢)
- FML price: 50% (50¢)

**After 1 SOL buy of "Deserved":**
- Deserved pool: 49 SOL (decreased)
- FML pool: 51 SOL (increased to maintain K)
- Deserved price: **52%** (price went up!)
- FML price: 48% (price went down)

**After another 5 SOL buy of "Deserved":**
- Deserved price: **65%** (much higher now)
- Early traders got in at 50-52%
- Late traders paying 65%

### The Early Edge

**First 1 SOL trade:** Buy at 50%, get ~2 shares  
**After 10 SOL traded:** Buy at 65%, get ~1.54 shares  
**After 50 SOL traded:** Buy at 85%, get ~1.18 shares  

**Early traders win twice:**
1. They pay less per share
2. If they're right, they bought at the best price

## Creator Economics

### The 2% Fee

Every trade on your story pays you 2%:

```
1 SOL trade → 0.02 SOL to creator
10 SOL volume → 0.2 SOL to creator
100 SOL volume → 2 SOL to creator
```

### Controversial = Profitable

A story with strong opinions on BOTH sides generates the most volume:

**Boring consensus (90-10):**
- Low trading activity
- Small creator fees
- Example: ~1 SOL volume = 0.02 SOL earned

**Controversial split (55-45):**
- High trading activity
- Large creator fees
- Example: ~100 SOL volume = 2 SOL earned

**Your incentive:** Post stories that divide opinion!

## Market Resolution

Markets resolve when either:
- **10 votes cast** (minimum threshold), OR
- **48 hours passed** (timeout)

Resolution uses the final price ratio:
- If Deserved > 50%, Deserved wins
- If FML > 50%, FML wins
- Winning side splits the entire pot proportionally to shares held

## Liquidity Bootstrapping

When you create a market, you set **initial liquidity**:

```javascript
{
  "content": "Spilled coffee on my laptop during investor pitch",
  "initial_liquidity": 0.5  // 0.5 SOL → 0.25 Deserved + 0.25 FML
}
```

**Minimum:** 0.1 SOL  
**Recommended:** 0.3-0.5 SOL (prevents thin markets)  
**High stakes:** 1+ SOL (attracts serious traders)

Higher initial liquidity = lower slippage = better price discovery.

## Example: Full Market Lifecycle

### Creation
```
Story: "Got fired for microwaving fish in the office"
Initial liquidity: 0.5 SOL
Starting price: 50-50
```

### Trading Phase (30 trades over 24 hours)
```
Trade 1:  0.5 SOL → Deserved (50% → 52%)
Trade 5:  1.0 SOL → FML     (52-48 → 50-50, back to even)
Trade 10: 2.0 SOL → Deserved (50-50 → 58-42)
Trade 20: 5.0 SOL → Deserved (58-42 → 72-28)
Trade 30: 1.0 SOL → FML     (72-28 → 70-30)

Total volume: 25 SOL
Creator earnings: 0.5 SOL (2% of 25 SOL)
Final price: 70% Deserved, 30% FML
```

### Resolution
```
Winning side: Deserved (>50%)
Total pot: 25.5 SOL (25 traded + 0.5 initial)
Minus creator fees: -0.5 SOL
Winners pot: 25 SOL

If you held 10 Deserved shares:
- Your share of winners: (10 / total_deserved_shares) * 25 SOL
- If total_deserved_shares = 50, you get: 5 SOL
- If you paid 7 SOL total, you lost 2 SOL
- If you paid 3 SOL total, you won 2 SOL
```

## Strategies

### For Traders

**1. Early Conviction**
- Bet early when prices are close to 50-50
- If right, you bought cheap and others drove price up
- Risk: Less information available

**2. Late Confirmation**
- Wait for price to move, then pile on
- Lower risk (market shows consensus)
- Lower reward (price already moved)

**3. Contrarian**
- Bet against consensus when price is extreme (80-20)
- If market is wrong, massive upside
- High risk, high reward

### For Creators

**1. Controversial Content**
- Post stories where people will disagree
- "I keyed my neighbor's car after they parked me in" (divisive!)
- Avoid obvious answers

**2. Emotional Stories**
- Strong emotion = strong opinions
- "My girlfriend dumped me at my dad's funeral" (FML?)
- "I dumped my girlfriend because she talked to my ex" (Deserved?)

**3. Volume Optimization**
- Initial liquidity of 0.3-0.5 SOL is sweet spot
- Too low = high slippage scares traders
- Too high = locks up capital for small stories

## Technical Implementation

Current AMM: **Constant-sum** (prices = probabilities)

```javascript
// Constant-sum AMM
class AMMSimulator {
  buyShares(market, side, amount) {
    const K = market.deservedReserve + market.fmlReserve;
    const fee = amount * 0.02; // 2% creator fee
    const amountAfterFee = amount - fee;
    
    market.creatorEarnings += fee;
    
    if (side === 'deserved') {
      const newDeserved = market.deservedReserve - amountAfterFee;
      const newFml = K - newDeserved;
      const shares = market.fmlReserve - newFml;
      
      market.deservedReserve = newDeserved;
      market.fmlReserve = newFml;
      
      return { shares };
    } else {
      // Same logic for FML side
    }
  }
}
```

Future upgrade: **Constant-product** (x * y = k) for better liquidity depth.

## Example Markets

### High Volume Success
```
Story: "Cheated on my girlfriend with her sister at her birthday party"
Initial: 0.5 SOL
Volume: 150 SOL (highly controversial)
Creator: 3 SOL earned
Final: 78% Deserved, 22% FML
```

### Low Volume Flop
```
Story: "Someone stole my lunch from the office fridge"
Initial: 0.1 SOL
Volume: 2 SOL (obvious FML, no debate)
Creator: 0.04 SOL earned
Final: 95% FML, 5% Deserved
```

The market rewards controversy!
