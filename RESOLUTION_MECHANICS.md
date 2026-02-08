# Resolution Mechanics Analysis

## Problem: 10 Votes is Too Small ❌

### Issues with Current System (10 votes OR 48 hours)

1. **Sybil Attack Risk**
   - Easy to create 10 wallets
   - Manipulate outcome with $1-2 total
   - Not resistant to manipulation

2. **Kills Trading Volume**
   - Market closes after just 10 trades
   - Creator only earns 2% of ~$10 = $0.20
   - No incentive for quality content

3. **Poor Price Discovery**
   - 10 votes isn't enough data
   - Prices don't reflect true consensus
   - Early traders dominate outcome

4. **User Experience**
   - Markets close too fast
   - Users miss interesting debates
   - FOMO but in a bad way

## What Other Markets Do

### Polymarket
- Markets stay open until **real-world event resolves**
- Example: Election market closes when election happens
- Our equivalent: Story markets need a natural end point

### Manifold Markets
- Markets open for **days or weeks**
- Creator sets close time
- Minimum: Usually 24 hours, often 7 days

### Traditional Prediction Markets
- Close based on **external event**
- Sports: game ends
- Elections: vote counted
- We need: sufficient consensus time

## Proposed Solutions

### Option 1: Time-Based Only (Simple)
```javascript
Resolution conditions:
- 48 hours minimum ✅
- 7 days maximum (auto-resolve)
- No vote count threshold
```

**Pros:**
- Simple, predictable
- Can't be rushed
- More trading time = more fees

**Cons:**
- Some markets might be "obvious" after 1 hour
- Trader capital locked for 48h minimum

### Option 2: Volume-Based (Better)
```javascript
Resolution conditions:
- 48 hours minimum
- OR 10+ SOL trading volume (not vote count!)
- Maximum 7 days
```

**Pros:**
- High-interest markets resolve faster
- Volume threshold = real money, not fake votes
- 10 SOL = ~50-100 trades = real consensus

**Cons:**
- Unpopular markets stuck for 7 days
- More complex to explain

### Option 3: Hybrid (Best) ⭐
```javascript
Resolution conditions:
1. Minimum 24 hours (grace period)
2. AND one of:
   a) 100+ unique voters
   b) 20+ SOL trading volume
   c) 7 days elapsed
3. Winner = side with >50% of pool
```

**Pros:**
- Fast resolution for popular markets
- Sybil-resistant (100 voters OR $20 volume)
- Still has maximum time limit
- Flexible based on engagement

**Cons:**
- Most complex to implement
- Need to track unique voters

### Option 4: Staged Resolution (Interesting)
```javascript
Stage 1: 0-24h = "Trending" (market open)
Stage 2: 24-48h = "Hot" (can close if 50+ voters)
Stage 3: 48h+ = "Mature" (can close if 20+ voters)
Stage 4: 7 days = Auto-close
```

**Pros:**
- Gives markets time to develop
- Prevents instant manipulation
- Graduated thresholds

**Cons:**
- Complex to understand
- More edge cases

## Recommended Solution 🎯

### Simple & Effective: Volume-Based

```javascript
Resolution Conditions:
1. Minimum 48 hours elapsed
2. AND (20 SOL volume OR 7 days elapsed)
3. Winner = side with >50% after conditions met
```

**Why this works:**

**For Popular Stories:**
- Hit 20 SOL volume quickly (100-200 trades)
- Resolve at 48h mark
- Fair outcome with lots of data

**For Unpopular Stories:**
- Don't hit volume threshold
- Auto-resolve after 7 days
- Still fair (extended time for participation)

**Economics:**
- 20 SOL volume = 0.4 SOL creator earnings (2%)
- Makes it worthwhile to create
- Prevents spam (need engagement to earn)

### Updated Examples

**High-Volume Story:**
```
"Cheated on girlfriend with her sister at her birthday party"
- 48 hours: $50 SOL volume ✅
- Resolves: 72% Deserved, 28% FML
- Creator earns: 1 SOL ($50 * 2%)
```

**Medium Story:**
```
"Spilled coffee on laptop during investor pitch"
- 48 hours: 15 SOL volume ❌ (below 20)
- 5 days: 22 SOL volume ✅
- Resolves: 68% FML, 32% Deserved
- Creator earns: 0.44 SOL
```

**Low-Volume Story:**
```
"Forgot my keys again"
- 7 days: 2 SOL volume ❌
- Auto-resolve: 50-50 (not enough interest)
- Creator earns: 0.04 SOL
- Lesson: boring stories don't earn
```

## Comparison Table

| Threshold | Sybil Risk | Volume | Complexity | Recommendation |
|-----------|------------|---------|------------|----------------|
| 10 votes | ❌ High | ❌ Too low | ✅ Simple | ❌ Bad |
| 100 votes | ✅ Low | ⚠️ Better | ✅ Simple | ⚠️ OK |
| 20 SOL volume | ✅ Low | ✅ Good | ✅ Simple | ✅ **Best** |
| 50 SOL volume | ✅ Very low | ⚠️ Maybe too high | ✅ Simple | ⚠️ OK |

## Implementation Changes

### Backend (amm.js)

```javascript
shouldResolve(market) {
  const now = Date.now();
  const elapsed = now - market.createdAt;
  
  // Constants
  const MIN_TIME = 48 * 3600 * 1000;  // 48 hours
  const MAX_TIME = 7 * 24 * 3600 * 1000;  // 7 days
  const MIN_VOLUME = 20;  // 20 SOL
  
  // Must wait at least 48 hours
  if (elapsed < MIN_TIME) {
    return false;
  }
  
  // Auto-resolve after 7 days
  if (elapsed >= MAX_TIME) {
    return true;
  }
  
  // Can resolve if hit volume threshold
  return market.totalVolume >= MIN_VOLUME;
}
```

### Smart Contract (lib.rs)

```rust
pub fn can_resolve(market: &Market) -> bool {
    let elapsed = Clock::get()?.unix_timestamp - market.created_at;
    
    const MIN_TIME: i64 = 48 * 3600;  // 48 hours
    const MAX_TIME: i64 = 7 * 24 * 3600;  // 7 days
    const MIN_VOLUME: u64 = 20_000_000_000;  // 20 SOL (in lamports)
    
    if elapsed < MIN_TIME {
        return false;
    }
    
    if elapsed >= MAX_TIME {
        return true;
    }
    
    market.total_volume >= MIN_VOLUME
}
```

### UI Display

**Before 48h:**
```
⏰ Opens in: 23h 45m
💰 Volume: 5.2 SOL
🎯 Needs: 14.8 more SOL or 6 days to resolve
```

**After 48h, under volume:**
```
⏰ Open for trading
💰 Volume: 12.3 SOL  
🎯 Needs: 7.7 more SOL to resolve (or auto-close in 5d)
```

**After volume threshold:**
```
✅ Ready to resolve
💰 Volume: 23.5 SOL
📊 Current: 68% FML, 32% Deserved
```

## Migration Path

**Phase 1 (Current demo):**
- Keep 10 votes for simplicity
- Add warning: "Demo threshold - production will be 20 SOL volume"

**Phase 2 (Devnet):**
- Implement 20 SOL volume threshold
- Keep 7-day maximum
- Test with real users

**Phase 3 (Mainnet):**
- Adjust thresholds based on data
- Maybe increase to 50 SOL if we get lots of volume
- Or decrease to 10 SOL if too hard to hit

## Summary

### ❌ Don't Use:
- 10 votes (too easy to manipulate)
- Pure time-based (no flexibility)
- High vote counts without sybil resistance

### ✅ Recommended:
- **48 hours minimum** (prevents instant manipulation)
- **20 SOL volume OR 7 days** (flexible based on engagement)
- **Winner = side with >50%** (clear outcome)

### 💡 Key Insight:
Volume-based resolution aligns incentives:
- Creators want high-volume stories (earn more fees)
- Traders want interesting debates (more opportunity)
- Platform wants engagement (success metrics)

**Everyone wins with volume thresholds!**
