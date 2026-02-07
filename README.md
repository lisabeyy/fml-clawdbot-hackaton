# FML or Deserved? 🎯

A prediction market where community judgment IS the outcome. Submit failure stories, let others bet on whether it was deserved or just bad luck, and earn from the controversy.

**Colosseum Agent Hackathon Submission**

## Quick Start (< 2 minutes)

```bash
# 1. Clone and navigate
cd prediction-market

# 2. Start backend
cd backend
npm install
npm start

# 3. In another terminal, open demo frontend
cd demo-frontend
python3 -m http.server 8080

# 4. Visit http://localhost:8080
```

That's it! You now have a working prediction market.

## What Is This?

Users submit stories about failures or mishaps. Others stake SOL on their judgment:
- **Deserved** 😈 - They had it coming
- **FML** 🍀 - Pure bad luck

The market price reflects community consensus. After 10 votes or 48 hours, the market resolves and winners split the pot proportionally.

## Key Features

✅ **Binary prediction market** (Deserved vs FML)  
✅ **Constant-sum AMM** (prices always sum to 1.0)  
✅ **Auto-resolution** (10 votes OR 48 hours)  
✅ **Creator incentive** (2% of trading volume)  
✅ **No oracle needed** (consensus IS the truth)  
✅ **Simulation mode** (no blockchain required for demo)  

## Architecture

```
prediction-market/
├── contract/          # Solana smart contract (Anchor/Rust)
│   └── lib.rs        # On-chain AMM logic
├── backend/           # API server (Node.js/Express)
│   ├── server.js     # REST API endpoints
│   ├── amm.js        # AMM simulator
│   ├── store.js      # In-memory data
│   └── test.js       # Integration tests
├── demo-frontend/     # Single-file HTML demo
│   └── index.html    # Works instantly, no build
├── frontend/          # Full React + Solana wallet app
│   └── src/          # Production UI (optional)
└── docs/
    ├── ARCHITECTURE.md  # System design
    ├── PLAN.md          # Development roadmap
    └── DECISIONS.md     # Key choices explained
```

## Components

### Smart Contract (`/contract`)

Anchor program implementing:
- Market creation with initial liquidity
- Constant-sum AMM for trading
- Position tracking (PDA-based)
- Auto-resolution logic
- Payout distribution

**Status:** ✅ Complete, ready to deploy to devnet

### Backend API (`/backend`)

Express server with in-memory AMM simulation:
- Market CRUD operations
- Trading execution
- Position tracking
- Statistics
- Auto-resolution

**Status:** ✅ Complete, tested (9/9 tests passing)

### Demo Frontend (`/demo-frontend`)

Single HTML file for quick testing:
- Browse and filter markets
- Create stories
- Trade (Deserved/FML)
- View portfolio

**Status:** ✅ Complete, works immediately

### Production Frontend (`/frontend`)

React + Tailwind + Solana Wallet Adapter:
- Modern UI components
- Wallet integration (Phantom, Solflare)
- Real-time price updates
- Mobile responsive

**Status:** 🟡 Built but requires build optimization

## How It Works

### Market Creation

1. User submits a story (10-280 chars)
2. Deposits initial liquidity (e.g., 0.1 SOL)
3. Market starts at 50/50 (neutral)
4. Liquidity split between Deserved and FML reserves

### Trading (Constant-Sum AMM)

```
K = Deserved Reserve + FML Reserve  (constant)

Price of Deserved = FML Reserve / K
Price of FML = Deserved Reserve / K

When buying Deserved:
- Add SOL to FML reserve
- Decrease Deserved reserve to maintain K
- Award shares proportional to amount
```

Prices are **always between 0-100%** and **sum to 100%**.

### Resolution

Market resolves when:
- **10 votes reached**, OR
- **48 hours elapsed**

Final percentages = last known prices.

### Payouts

Winners split pot proportionally:
- If 70% Deserved, Deserved voters get 70% of total pot
- If 30% FML, FML voters get 30% of total pot
- Everyone gets something, majority gets more

Creator earns **2%** of all trading volume.

## Testing

### Backend Tests

```bash
cd backend
npm test
```

Expected output:
```
✅ Test 1: Health check passed
✅ Test 2: List markets passed
✅ Test 3: Get single market passed
✅ Test 4: Create market passed
✅ Test 5: Buy Deserved shares passed
✅ Test 6: Buy FML shares passed
✅ Test 7: Get positions passed
✅ Test 8: Get stats passed
✅ Test 9: Auto-resolution passed

📊 Test Results: 9 passed, 0 failed
🎉 All tests passed!
```

### Manual Testing

1. Start backend: `cd backend && npm start`
2. Open demo: `cd demo-frontend && python3 -m http.server 8080`
3. Test flow:
   - Browse existing markets
   - Click a market to see details
   - Buy Deserved or FML shares
   - Create your own market
   - Check portfolio for positions

### API Testing

```bash
# Health check
curl http://localhost:3000/api/health

# List markets
curl http://localhost:3000/api/markets

# Create market
curl -X POST http://localhost:3000/api/markets \
  -H "Content-Type: application/json" \
  -d '{"content":"Test story","initial_liquidity":0.1,"wallet":"test"}'

# Buy shares
curl -X POST http://localhost:3000/api/markets/1/buy \
  -H "Content-Type: application/json" \
  -d '{"side":"deserved","amount":0.05,"wallet":"test"}'
```

## Deployment Options

### Option 1: Demo Mode (Current)

- Backend: Simulation with in-memory state
- Frontend: HTML demo (no wallet)
- Best for: Testing, hackathon demos

### Option 2: Devnet

1. Deploy contract to Solana devnet
2. Update backend to use Solana RPC
3. Use full React frontend with wallet
4. Test with devnet SOL

### Option 3: Mainnet

1. Audit smart contract
2. Deploy to mainnet
3. Add database (PostgreSQL)
4. Production monitoring
5. Real SOL transactions

## Key Decisions

### Why Constant-Sum AMM?

- Prices naturally represent probabilities (0-100%)
- Simple to understand ("70% chance it was deserved")
- No liquidation risk
- Always bounded

### Why 10 Votes OR 48 Hours?

- 10 votes: Ensures controversial markets resolve quickly
- 48 hours: Prevents stale markets from lingering
- Whichever first: Optimizes for engagement

### Why Creator Fees?

- Incentivizes quality content
- Controversial stories generate more trading
- Aligns creator interests with market activity

### Why Simulation Mode?

- Fast iteration during development
- Works without blockchain setup
- Easy for reviewers to test
- Can switch to on-chain later

## Roadmap

### V1 (Hackathon MVP) ✅
- [x] Smart contract (Anchor)
- [x] Backend API (simulation)
- [x] Demo frontend
- [x] Tests
- [x] Documentation

### V2 (Post-Hackathon)
- [ ] Deploy to devnet
- [ ] Full React frontend with wallet
- [ ] Leaderboards
- [ ] Categories/tags
- [ ] Comments on markets

### V3 (Future)
- [ ] Multi-outcome markets
- [ ] AI story generation
- [ ] DAO governance
- [ ] Mobile app

## Tech Stack

- **Smart Contract:** Rust, Anchor Framework
- **Backend:** Node.js, Express
- **Frontend:** HTML/TailwindCSS (demo), React (full)
- **Blockchain:** Solana
- **Testing:** Node.js test runner

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and data flow
- **[PLAN.md](PLAN.md)** - Development plan and milestones
- **[DECISIONS.md](DECISIONS.md)** - Key architectural choices
- **[backend/README.md](backend/README.md)** - API documentation
- **[frontend/README.md](frontend/README.md)** - React app guide

## For Reviewers

**Fastest path to see it working:**

```bash
# 1. Start backend
cd backend && npm install && npm start &

# 2. Open demo (in new terminal)
cd demo-frontend && python3 -m http.server 8080 &

# 3. Visit http://localhost:8080
```

**Test the complete flow:**
1. Browse pre-seeded markets
2. Click a market to trade
3. Buy Deserved or FML shares
4. See price change in real-time
5. Create your own market
6. Watch it auto-resolve after 10 votes

**Run automated tests:**
```bash
cd backend && npm test
```

## License

MIT

## Contact

Built for the Colosseum Agent Hackathon by an autonomous AI agent.

---

**Status:** ✅ Complete end-to-end working prototype  
**Demo:** Works locally in < 2 minutes  
**Tests:** 9/9 passing  
**Documentation:** Comprehensive
