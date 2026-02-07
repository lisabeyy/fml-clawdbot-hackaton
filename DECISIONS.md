# Key Design Decisions

This document explains the major architectural and product choices made during development.

---

## 1. Constant-Sum AMM (Not Constant-Product)

### Decision
Use `K = Deserved Reserve + FML Reserve` (constant-sum) instead of Uniswap-style constant-product.

### Rationale

**Pros:**
- Prices naturally represent probabilities (0-100%)
- Easy to understand: "70% Deserved" vs "odds ratio of 2.33x"
- Always bounded (no infinite prices)
- Simpler math (addition, not multiplication)
- No impermanent loss risk

**Cons:**
- Can deplete one side completely
- Less capital efficient than CPMM

**Why it works here:**
- Markets are time-limited (48h max)
- Binary outcomes (only 2 sides)
- Users think in percentages naturally
- "Pure arbitrage" less relevant (consensus-based)

**Example:**
```
K = 0.5 SOL (constant)
Start: Deserved = 0.25, FML = 0.25 → 50/50

Alice buys 0.1 SOL of Deserved:
- FML reserve increases to 0.35
- Deserved reserve becomes 0.15 (K - 0.35)
- New prices: Deserved = 70%, FML = 30%
```

---

## 2. Auto-Resolution: 10 Votes OR 48 Hours

### Decision
Markets resolve when **either** condition is met (not both).

### Rationale

**10 votes threshold:**
- Controversial topics reach this quickly
- Ensures active markets resolve fast
- Rewards engagement

**48 hours time limit:**
- Prevents abandoned markets
- Forces resolution on unpopular topics
- Keeps UI fresh (no stale markets)

**Why OR (not AND):**
- A viral market shouldn't wait 48h
- A niche market shouldn't need 10 votes
- Optimizes for both cases

**Alternative considered:** Fixed time (e.g., "all markets resolve in 24h")
- Rejected: Wastes user attention on slow markets

---

## 3. Creator Earns 2% of Volume (Not Market Cap)

### Decision
Creators earn 2% of **trading volume**, not final market size.

### Rationale

**Incentive alignment:**
- Controversial stories → more trading → higher earnings
- Encourages quality content
- No incentive to manipulate outcome (earn either way)

**Why volume, not market cap:**
- Market cap is fixed (initial liquidity)
- Volume scales with engagement
- Better reflects market success

**Math:**
```
Story generates 5 SOL of trading:
- Creator earns: 0.1 SOL (2%)
- Platform earns: 0.025 SOL (0.5%)
- Net to market: 4.875 SOL (97.5%)

Creator's 0.1 SOL return is independent of outcome.
```

**Alternative considered:** Entry fee (e.g., 0.01 SOL to create market)
- Rejected: Reduces submission rate

---

## 4. Simulation Mode First (Not On-Chain First)

### Decision
Build fully functional backend simulator before deploying to blockchain.

### Rationale

**Development speed:**
- No waiting for transactions
- Instant feedback on logic changes
- Can iterate freely

**Testing:**
- Easy to reset state
- No devnet SOL needed
- Automated tests run fast

**Demo quality:**
- Reviewers don't need wallets
- Works offline
- No gas fees to test

**Migration path:**
Smart contract logic mirrors simulator:
- Same AMM formulas
- Same resolution rules
- Same fee structure
- Backend can swap to RPC calls later

**Trade-off:**
- Not "truly decentralized" yet
- But proves concept faster

---

## 5. Binary Outcomes Only (No Multi-Way Markets)

### Decision
Only two choices: Deserved vs FML.

### Rationale

**Simplicity:**
- Easy to understand (yes/no question)
- Constant-sum works perfectly (K = A + B)
- Price bar visualization intuitive

**Psychology:**
- People love binary judgments
- "Deserved it" vs "unlucky" is natural
- Avoids neutral/ambiguous votes

**Technical:**
- Two reserves (not N reserves)
- Simple position tracking
- Clear winner determination

**Future extension:**
Could add multi-outcome later:
- Deserved / FML / Neutral / Chaotic
- Would need different AMM (e.g., LMSR)

---

## 6. No Oracle (Consensus IS Truth)

### Decision
Market resolution uses final price, not external data.

### Rationale

**No oracle problem:**
- Who decides if it was "deserved"?
- Subjective judgments have no ground truth
- Community opinion IS the answer

**Elegant resolution:**
- Market naturally converges to consensus
- Price = probability = outcome
- Everyone gets paid proportionally

**Comparison to prediction markets:**
- Traditional: Bet on objective future event
- This: Bet on subjective social judgment
- No need for dispute resolution

**Example:**
```
"I got fired for being late"

Traditional: Need oracle to verify story
This market: Community decides via trading
- If 80% think "Deserved" → that's the answer
- Truth emerges from revealed preferences
```

---

## 7. Demo Frontend (Not Production React First)

### Decision
Ship single HTML file for MVP, defer full React build.

### Rationale

**Time to demo:**
- HTML file works instantly
- No npm install, no build step
- Open in browser = done

**For reviewers:**
- Can test in < 2 minutes
- No wallet setup needed
- No blockchain knowledge required

**React frontend exists:**
- Built but not optimized
- Solana wallet adapters are 1GB+
- Build fails on low memory
- Can be fixed post-hackathon

**Trade-off:**
- Demo lacks wallet integration
- But proves the product concept

---

## 8. Proportional Payouts (Not Winner-Take-All)

### Decision
Both sides get paid proportionally to final price.

### Rationale

**Fair distribution:**
- Even "losers" get something
- Reflects probability-weighted outcome
- Reduces rug-pull risk

**Math example:**
```
Market: 1 SOL total pot
Final: 70% Deserved, 30% FML

Deserved voters split: 0.7 SOL (proportionally)
FML voters split: 0.3 SOL (proportionally)

If Alice holds 50% of Deserved shares:
- Her payout = 0.5 * 0.7 = 0.35 SOL
```

**Alternative considered:** Binary (Deserved wins 100%, FML wins 0%)
- Rejected: Too harsh, discourages participation

**Why this is better:**
- Encourages honest price discovery
- No incentive to wait until last second
- Everyone is "partially right"

---

## 9. In-Memory Store (Not Database)

### Decision
Use JavaScript Map for data, not PostgreSQL/Redis.

### Rationale

**MVP requirements:**
- Need to iterate fast
- Reset state easily during testing
- No infrastructure setup

**Simplicity:**
- Zero configuration
- No migrations needed
- Instant deployment

**Performance:**
- Fast enough for 100s of markets
- O(1) lookups
- No connection overhead

**Trade-off:**
- Data lost on restart
- Not multi-server compatible
- But fine for hackathon demo

**Production path:**
```typescript
// Current
const markets = new Map();

// Future
const markets = await db.query('SELECT * FROM markets');
```
Interface stays the same.

---

## 10. Rate Limiting (API Level, Not Transaction Level)

### Decision
Use Express rate limiter (100 req/min) instead of Solana transaction rate limits.

### Rationale

**Simulation mode:**
- No blockchain = no native rate limiting
- Need to prevent spam
- Protect server resources

**Settings:**
```javascript
windowMs: 60 * 1000,  // 1 minute
max: 100,              // 100 requests
```

**Why 100/min:**
- High enough for testing
- Low enough to prevent DoS
- Can adjust per endpoint

**On-chain equivalent:**
- Solana transactions cost lamports
- Natural rate limiting via fees
- Would remove API rate limit when on-chain

---

## 11. 280 Character Limit (Like Twitter)

### Decision
Stories must be 10-280 characters.

### Rationale

**Minimum (10 chars):**
- Prevents empty/spam submissions
- Forces actual story

**Maximum (280 chars):**
- Fits on screen without scrolling
- Encourages concise writing
- Familiar limit (Twitter-like)
- On-chain storage efficient

**Examples:**
```
Too short (9): "I'm sad."
Good (50): "Parked in no parking zone, got towed. $350 fine."
Good (200): "Spent 3 months learning to code, applied for dream job, accidentally sent the recruiter a meme instead of my resume. They replied 'LOL no' and blocked me."
Too long (290): [would get rejected]
```

---

## 12. Platform Fee (0.5%) + Creator Fee (2%)

### Decision
Charge 2.5% total fees (2% to creator, 0.5% to platform).

### Rationale

**Fee breakdown:**
```
User trades 1 SOL:
- 0.02 SOL → Creator (2%)
- 0.005 SOL → Platform (0.5%)
- 0.975 SOL → Market reserves (97.5%)
```

**Why creator gets more:**
- Incentivize content creation
- Quality stories drive engagement
- Platform is secondary

**Why keep total low:**
- Competitive with other markets
- Encourages trading volume
- Fees compound over multiple trades

**Comparison:**
- Uniswap: 0.3% (no creator, all to LPs)
- Polymarket: 2% (no creator, all to platform)
- This: 2.5% (mostly to creator)

---

## Summary Table

| Decision | Alternative | Reason |
|----------|-------------|--------|
| Constant-sum AMM | Constant-product | Prices = probabilities |
| 10 votes OR 48h | Fixed time | Optimizes engagement |
| 2% volume fee | Entry fee | Aligns incentives |
| Simulation first | Deploy first | Faster iteration |
| Binary outcomes | Multi-outcome | Simplicity |
| No oracle | External oracle | Consensus = truth |
| Demo HTML | Production React | Time to demo |
| Proportional payout | Winner-take-all | Fairness |
| In-memory store | Database | MVP simplicity |
| API rate limit | Transaction cost | Simulation mode |
| 280 char limit | Unlimited | Concise + efficient |
| 2% creator fee | 0% creator fee | Content quality |

---

## What Would Change for Production

1. **AMM:** Consider hybrid (LMSR for liquidity)
2. **Resolution:** Add manual resolution for edge cases
3. **Fees:** Dynamic fees based on volume
4. **Database:** PostgreSQL for persistence
5. **Wallet:** Full integration (not optional)
6. **Frontend:** Optimize React build
7. **Monitoring:** Add analytics, error tracking
8. **Scaling:** Redis cache, multi-server
9. **Security:** Audit smart contract
10. **Features:** Leaderboards, comments, categories

---

_These decisions prioritize shipping a working MVP. Many would evolve based on user feedback and scale requirements._
