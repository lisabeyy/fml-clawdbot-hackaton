# Architecture - FML or Deserved?

## Product Vision

A Solana-based prediction market for community judgment on failure stories. Anyone can submit, everyone can judge, creators earn from controversy.

---

## Core Concept

### The Market Question
**"Did they deserve it, or was it pure bad luck?"**

- Binary outcome: **Deserved** vs **FML (unlucky)**
- No ground truth needed - community consensus IS the outcome
- Proportional payouts based on final market price

### Why This Works

1. **Universal Appeal** - Everyone loves judging situations
2. **No Oracle Problem** - Consensus resolves markets
3. **Economic Incentive** - Controversial stories generate more trading
4. **Timeless** - Won't become dated
5. **Inclusive** - Both humans and AI agents can participate

---

## Economic Model

### Market Mechanics

**Initial State:**
- Creator deposits initial liquidity (e.g., 0.1 SOL)
- Market starts at 50/50 (neutral judgment)
- Deserved reserve = 0.05 SOL
- FML reserve = 0.05 SOL

**Trading:**
- Users buy shares (Deserved or FML)
- Constant-sum AMM adjusts prices
- Price = opposite_reserve / total_constant
- Early conviction gets better odds

**Resolution:**
- Auto-triggers after **10 votes OR 48 hours** (whichever first)
- Final price = community judgment
- Example: 70% Deserved, 30% FML

**Payouts:**
- Deserved voters split 70% of pot proportionally
- FML voters split 30% of pot proportionally
- Everyone gets something, majority gets more
- Creator gets 2% of all trading volume

### Fee Structure

- **Creator Fee:** 2% of trading volume
- **Platform Fee:** 0.5% of trading volume
- **Net to Market:** 97.5% of each trade

### Example Scenario

```
Story: "Today I tried to impress my date by cooking. Set off fire alarm, 
        sprinklers ruined my laptop, fire department showed up. FML"

Initial: 0.1 SOL liquidity, 50/50 split

Trade 1: Alice buys 0.02 SOL of "Deserved"
  → Price shifts to 65% Deserved / 35% FML
  → Alice gets 0.0195 SOL worth of Deserved shares

Trade 2: Bob buys 0.03 SOL of "FML" 
  → Price shifts to 45% Deserved / 55% FML
  → Bob gets 0.0292 SOL worth of FML shares

... more trades ...

Resolution (after 10 votes):
  → Final: 30% Deserved / 70% FML
  → FML voters (like Bob) win majority
  → Bob's payout: (his_shares / total_fml_shares) * 0.7 * pot
  → Alice still gets: (her_shares / total_deserved_shares) * 0.3 * pot
  → Creator earned: total_volume * 0.02
```

---

## Technical Architecture

### Smart Contract (Anchor/Solana)

**Program Structure:**
```rust
pub mod fml_or_deserved {
    // Instructions
    - create_market(content, initial_liquidity)
    - buy_shares(side: Deserved|FML, amount)
    - resolve_market() [auto-triggered]
    - claim_payout()
    - claim_creator_fee()
}
```

**Accounts:**

```rust
#[account]
pub struct Market {
    pub creator: Pubkey,
    pub content: String,          // Max 280 chars
    pub deserved_reserve: u64,    // AMM reserve
    pub fml_reserve: u64,         // AMM reserve
    pub k: u64,                   // Constant (deserved + fml)
    pub total_volume: u64,        // Trading volume
    pub vote_count: u64,          // Number of trades
    pub created_at: i64,
    pub resolved: bool,
    pub resolved_at: i64,
    pub bump: u8,
}

#[account]
pub struct Position {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub deserved_shares: u64,
    pub fml_shares: u64,
    pub bump: u8,
}
```

**AMM Formula (Constant-Sum):**

```rust
k = deserved_reserve + fml_reserve  // Constant

price_of_deserved = fml_reserve / k
price_of_fml = deserved_reserve / k

// Prices always sum to 1.0 (like probabilities)
```

**Auto-Resolution Logic:**

```rust
fn should_resolve(market: &Market) -> bool {
    let elapsed = Clock::get()?.unix_timestamp - market.created_at;
    let time_limit_reached = elapsed >= 48 * 3600; // 48 hours
    let vote_threshold_reached = market.vote_count >= 10;
    
    time_limit_reached || vote_threshold_reached
}
```

### Backend (Node.js/Express)

**Purpose:** API layer + simulation mode for rapid iteration

**Endpoints:**
```
GET  /api/markets           - List all markets
POST /api/markets           - Create market
POST /api/markets/:id/buy   - Buy shares
GET  /api/markets/:id       - Market details + prices
GET  /api/positions/:wallet - User's positions
GET  /api/stats             - Global statistics
```

**AMM Simulation:**
```javascript
class MarketSimulator {
  calculatePrice(market, side) {
    const k = market.deservedReserve + market.fmlReserve;
    if (side === 'deserved') {
      return market.fmlReserve / k;
    } else {
      return market.deservedReserve / k;
    }
  }

  buyShares(market, side, amount) {
    const fees = amount * 0.025;
    const netAmount = amount - fees;
    
    if (side === 'deserved') {
      market.fmlReserve += netAmount;
      market.deservedReserve = market.k - market.fmlReserve;
    } else {
      market.deservedReserve += netAmount;
      market.fmlReserve = market.k - market.deservedReserve;
    }
    
    market.totalVolume += amount;
    market.voteCount += 1;
    
    return this.calculateShares(netAmount, this.calculatePrice(market, side));
  }

  shouldResolve(market) {
    const elapsed = Date.now() - market.createdAt;
    return market.voteCount >= 10 || elapsed >= 48 * 3600 * 1000;
  }
}
```

### Frontend (React + Tailwind)

**Pages:**
1. **Market Feed** - Browse active markets with live prices
2. **Market Detail** - Full market view with trading interface
3. **Create Market** - Story submission form
4. **Portfolio** - User's positions and payouts
5. **My Markets** - Creator dashboard

**Components:**

```typescript
<MarketCard 
  market={market}
  onBuy={handleBuy}
/>
// Shows: story, current prices (bar chart), vote count, time remaining

<TradingInterface
  market={market}
  onBuy={handleBuy}
/>
// Buy Deserved or FML shares, see price impact

<PriceChart
  deservedPercent={70}
  fmlPercent={30}
/>
// Visual representation of community judgment

<PositionCard
  position={position}
  market={market}
/>
// Your shares, current value, potential payout
```

**UX Principles:**
- Calm design (no casino aesthetics)
- Clear implied probabilities
- Instant price feedback
- One-click trading
- Mobile-friendly

---

## Data Flow

### Story Submission
```
User → Frontend → Backend API → Smart Contract
                ↓
         Create Market Account (PDA)
                ↓
         Initialize AMM reserves
                ↓
         Return market ID
```

### Trading
```
User → Select side (Deserved/FML) → Enter amount
     ↓
Frontend calculates share preview
     ↓
Submit transaction → Smart Contract
     ↓
Update reserves (AMM) → Update position
     ↓
Emit event → Frontend updates UI
```

### Resolution
```
Clock trigger OR vote threshold
     ↓
Check should_resolve()
     ↓
Mark market as resolved
     ↓
Record final prices
     ↓
Enable payout claims
```

### Payout Claim
```
User → View resolved market → Click "Claim"
     ↓
Smart Contract checks:
  - Market resolved?
  - User has shares?
  - Calculate proportional payout
     ↓
Transfer SOL to user
     ↓
Update position (mark as claimed)
```

---

## Security Considerations

### Smart Contract
- ✅ PDA-based accounts (no centralized custody)
- ✅ Pull-based payouts (anti-reentrancy)
- ✅ Input validation (280 char limit, minimum amounts)
- ✅ Rate limiting via transaction costs
- ✅ Overflow protection (checked math)

### Backend
- ✅ Input sanitization
- ✅ Rate limiting (express-rate-limit)
- ✅ CORS configuration
- ✅ No sensitive data storage

### Frontend
- ✅ Wallet adapter (secure key management)
- ✅ Transaction simulation before signing
- ✅ Clear approval UI
- ✅ XSS prevention (sanitize story content)

---

## Deployment Strategy

### Phase 1: Simulation (MVP)
- Backend with in-memory state
- Frontend connected to simulation API
- Full UX testing without blockchain costs
- Rapid iteration

### Phase 2: Devnet
- Deploy Anchor program to Solana devnet
- Connect real wallets (Phantom/Solflare)
- Test with devnet SOL
- Community testing

### Phase 3: Mainnet (Future)
- Audit smart contracts
- Deploy to mainnet
- Real SOL transactions
- Production monitoring

---

## Scalability Considerations

### Current Design (MVP)
- On-chain: All market state and positions
- Off-chain: None (fully decentralized)
- Expected: ~100 markets, ~1000 users

### Future Optimizations
- Indexer for market history
- WebSocket for live price updates
- IPFS for long-form stories
- Compressed accounts (Solana)
- Market aggregation pools

---

## Success Metrics

### Product Metrics
- Markets created per day
- Total trading volume
- Average trades per market
- Resolution distribution (Deserved vs FML)
- Creator earnings

### Engagement Metrics
- Return user rate
- Average session length
- Markets per user
- Social sharing rate

### Quality Metrics
- Story quality (subjective)
- Controversial vs one-sided markets
- Time to resolution
- Payout fairness perception

---

## Roadmap

### V1 (Hackathon MVP) ✓
- Binary markets (Deserved vs FML)
- Constant-sum AMM
- Auto-resolution
- Basic UI
- Simulation + devnet

### V2 (Post-Hackathon)
- Story categories/tags
- Leaderboards (best creators, best judges)
- Social features (comments, reactions)
- Price history charts
- Mobile app

### V3 (Future Vision)
- Multi-outcome markets (Deserved / Unlucky / Neutral / Chaotic)
- AI story generator integration
- DAO governance
- Treasury management
- Cross-chain expansion

---

**Status:** Architecture complete, ready for implementation  
**Next:** Smart contract development  
**Timeline:** 10 days to working MVP
