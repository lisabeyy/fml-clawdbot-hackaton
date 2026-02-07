# Demo Frontend - Quick Start

Single-file HTML frontend for testing the prediction market locally.

## Why This Exists

The full React frontend (`/frontend`) has heavy dependencies (Solana wallet adapters) that:
- Take time to build
- Require wallet connection
- Add complexity for quick demos

This demo frontend:
- ✅ Single HTML file
- ✅ No build step
- ✅ No wallet needed
- ✅ Works instantly
- ✅ Full functionality (create/trade/portfolio)

## Usage

1. **Start the backend:**
   ```bash
   cd ../backend
   npm start
   ```

2. **Open the demo:**
   ```bash
   # Option 1: Direct file open
   open index.html
   
   # Option 2: Simple HTTP server
   python3 -m http.server 8080
   # Then visit: http://localhost:8080
   ```

3. **Test the flow:**
   - Browse markets
   - Click a market to trade
   - Create your own story
   - Check your portfolio

## Features

- ✅ Market listing with live prices
- ✅ Trading interface (Deserved vs FML)
- ✅ Market creation
- ✅ Portfolio tracking
- ✅ Auto-resolution visualization
- ✅ Responsive design

## Notes

- Uses a random wallet ID each session
- All data is in-memory (resets on backend restart)
- For production, use the full React frontend with wallet integration

## For Reviewers

This is the fastest way to see the prediction market in action:

```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Serve demo
cd demo-frontend && python3 -m http.server 8080

# Browser: http://localhost:8080
```

Takes ~10 seconds from clone to working app.
