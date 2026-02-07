# Backend API - FML or Deserved?

Simulation backend for the prediction market. Implements constant-sum AMM logic with in-memory state.

## Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start

# Development (auto-restart)
npm run dev

# Run tests
npm test
```

Server runs on `http://localhost:3000` by default.

## Architecture

### Components

- **server.js** - Express REST API
- **amm.js** - Constant-sum AMM simulator
- **store.js** - In-memory data store
- **test.js** - Integration tests

### Key Features

✅ Constant-sum AMM (deserved + fml = constant)  
✅ Auto-resolution (10 votes OR 48 hours)  
✅ Fee structure (2% creator, 0.5% platform)  
✅ Position tracking  
✅ Rate limiting  
✅ CORS enabled  

## API Endpoints

### Health Check

```bash
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "mode": "simulation",
  "markets": 4,
  "uptime": 123.45
}
```

### List Markets

```bash
GET /api/markets?filter=active
```

Filters: `active`, `resolved`, `all` (default: `active`)

Response:
```json
[
  {
    "id": "1",
    "creator": "simulation-wallet",
    "content": "Story text...",
    "deserved_percent": 65,
    "fml_percent": 35,
    "vote_count": 7,
    "total_volume": "0.3500",
    "time_remaining": "24h 30m",
    "resolved": false,
    "created_at": 1707234567890
  }
]
```

### Get Single Market

```bash
GET /api/markets/:id
```

### Create Market

```bash
POST /api/markets
Content-Type: application/json

{
  "content": "Your failure story (10-280 chars)",
  "initial_liquidity": 0.1,
  "wallet": "your-wallet-address"
}
```

### Buy Shares

```bash
POST /api/markets/:id/buy
Content-Type: application/json

{
  "side": "deserved",  // or "fml"
  "amount": 0.05,
  "wallet": "your-wallet-address"
}
```

Response:
```json
{
  "success": true,
  "shares": 0.04875,
  "market": { ... }
}
```

### Get Positions

```bash
GET /api/positions/:wallet
```

Response:
```json
[
  {
    "id": "wallet:1",
    "market": { ... },
    "deserved_shares": "0.0500",
    "fml_shares": "0.0000",
    "invested": "0.0500",
    "current_value": "0.0550",
    "pnl": "0.0050"
  }
]
```

### Get Stats

```bash
GET /api/stats
```

Response:
```json
{
  "total_markets": 5,
  "active_markets": 3,
  "resolved_markets": 2,
  "total_volume": "1.2500",
  "total_votes": 45
}
```

## AMM Logic

### Price Calculation

```
K = deserved_reserve + fml_reserve  (constant)

price_of_deserved = fml_reserve / K
price_of_fml = deserved_reserve / K

Prices always sum to 1.0
```

### Trading

When buying Deserved shares for X SOL:
1. Deduct fees: `net = X - creator_fee - platform_fee`
2. Add `net` to FML reserve
3. Adjust Deserved reserve: `deserved_reserve = K - fml_reserve`
4. Award shares proportional to amount

### Resolution

Market resolves when:
- 10 votes reached, OR
- 48 hours elapsed

Final percentages = last known prices.

Winners split pot proportionally.

## Testing

Run the full test suite:

```bash
npm test
```

Tests cover:
- Health check
- Market listing
- Market creation
- Trading (both sides)
- Position tracking
- Statistics
- Auto-resolution

## Environment Variables

```bash
PORT=3000  # Server port (default: 3000)
```

## Production Considerations

This is a **simulation backend** for development/demo. For production:

1. Replace in-memory store with database (PostgreSQL/Redis)
2. Add authentication/wallet verification
3. Connect to actual Solana RPC
4. Implement transaction signing
5. Add logging/monitoring
6. Rate limit per wallet
7. Cache market data

## Example Flow

```bash
# Start server
npm start

# Create market
curl -X POST http://localhost:3000/api/markets \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test story FML",
    "initial_liquidity": 0.2,
    "wallet": "test123"
  }'

# Buy Deserved shares
curl -X POST http://localhost:3000/api/markets/1/buy \
  -H "Content-Type: application/json" \
  -d '{
    "side": "deserved",
    "amount": 0.05,
    "wallet": "test123"
  }'

# Check positions
curl http://localhost:3000/api/positions/test123
```

## License

MIT
