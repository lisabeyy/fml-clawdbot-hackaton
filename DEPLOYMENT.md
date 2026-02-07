# Deployment Guide - FML or Deserved?

## Vercel Deployment (Recommended)

### Prerequisites
- GitHub repository connected to Vercel
- Vercel account with deployment access

### Quick Deploy

1. **Connect Repository**
   - Already done ✅ (GitHub repo connected to Vercel)

2. **Configure Environment Variables**
   
   In Vercel Dashboard → Project Settings → Environment Variables:
   
   ```
   # Required
   NODE_ENV=production
   
   # Optional (has defaults)
   PORT=3000
   VITE_API_URL=https://your-project.vercel.app/api
   VITE_SOLANA_NETWORK=devnet
   ```

3. **Deploy**
   
   Vercel will auto-deploy on push to master, or manually:
   ```bash
   vercel --prod
   ```

### Deployment Architecture

```
┌─────────────────────────────────────┐
│     Vercel Deployment               │
├─────────────────────────────────────┤
│                                     │
│  Frontend (Static)                  │
│  └── /demo-frontend/index.html     │
│      Serves at: /                   │
│                                     │
│  Backend (Serverless)               │
│  └── /backend/server.js             │
│      Serves at: /api/*              │
│                                     │
└─────────────────────────────────────┘
```

### What Gets Deployed

**Demo Frontend:**
- Single HTML file (`demo-frontend/index.html`)
- No build step required
- Connects to `/api` routes

**Backend API:**
- Node.js Express server (`backend/server.js`)
- Runs as Vercel serverless function
- In-memory state (resets on cold start)
- All 8 API endpoints available

### API Routes on Vercel

After deployment, your API will be available at:

```
https://your-project.vercel.app/api/health
https://your-project.vercel.app/api/markets
https://your-project.vercel.app/api/markets/:id
https://your-project.vercel.app/api/markets/:id/buy
https://your-project.vercel.app/api/positions/:wallet
https://your-project.vercel.app/api/stats
```

### Frontend Routes

```
https://your-project.vercel.app/          → Demo app
```

### Environment Variables Explained

| Variable | Purpose | Default | Production |
|----------|---------|---------|------------|
| `NODE_ENV` | Runtime environment | `development` | `production` |
| `PORT` | Backend port (ignored on Vercel) | `3000` | Auto |
| `VITE_API_URL` | Frontend API endpoint | `http://localhost:3000/api` | `/api` (relative) |
| `VITE_SOLANA_NETWORK` | Solana cluster | `devnet` | `devnet` or `mainnet-beta` |

### Configuration Files

**`vercel.json`** - Deployment config
```json
{
  "version": 2,
  "builds": [
    { "src": "demo-frontend/index.html", "use": "@vercel/static" },
    { "src": "backend/server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/backend/server.js" },
    { "src": "/(.*)", "dest": "/demo-frontend/index.html" }
  ]
}
```

### Testing Deployment

Once deployed, test the flow:

1. **Visit your Vercel URL**
   ```
   https://your-project.vercel.app
   ```

2. **Check API health**
   ```bash
   curl https://your-project.vercel.app/api/health
   ```

3. **List markets**
   ```bash
   curl https://your-project.vercel.app/api/markets
   ```

4. **Test UI flow**
   - Browse markets
   - Create a test market
   - Execute a trade
   - Check portfolio

### Important: Serverless Limitations

⚠️ **In-Memory State**
- Data resets on cold starts (every ~5-15 min of inactivity)
- Markets and positions are temporary
- Fine for demo/testing, not production

**For Production:**
- Add database (PostgreSQL, MongoDB, or Supabase)
- Update `backend/store.js` to use persistent storage
- See "Production Deployment" section below

### Troubleshooting

**Issue: API not responding**
- Check Vercel logs: Dashboard → Deployments → View Logs
- Verify `vercel.json` routes are correct
- Ensure backend dependencies in `package.json`

**Issue: CORS errors**
- Backend already has CORS enabled
- Check browser console for specific errors
- Verify API_URL in frontend matches deployment URL

**Issue: Cold start delays**
- First request after idle takes ~2-5 seconds
- Subsequent requests are fast
- Consider serverless warming or dedicated backend

**Issue: Data disappears**
- Expected: in-memory store resets on cold start
- Solution: Add database (see Production section)

### Manual Deployment

If auto-deploy doesn't work:

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project
cd prediction-market

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Vercel Dashboard Setup

1. **Go to:** https://vercel.com/dashboard
2. **Select your project**
3. **Settings → Environment Variables**
4. **Add variables:**
   ```
   NODE_ENV = production
   VITE_API_URL = /api
   ```
5. **Redeploy:** Deployments → Redeploy

---

## Alternative: Production Deployment

### For Serious Production Use

**Backend (Separate Server):**

1. **Deploy to Railway, Render, or Fly.io**
   ```bash
   # Example: Railway
   railway login
   railway init
   railway up
   ```

2. **Add Database**
   ```javascript
   // Update backend/store.js
   import { Pool } from 'pg';
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
   });
   ```

3. **Update Frontend API URL**
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

**Frontend (Vercel):**

1. **Deploy React frontend**
   ```bash
   cd frontend
   npm run build
   vercel --prod
   ```

2. **Configure environment**
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   VITE_SOLANA_NETWORK=mainnet-beta
   ```

---

## Smart Contract Deployment (Future)

When ready to go on-chain:

1. **Deploy to Devnet**
   ```bash
   cd contract
   anchor build
   anchor deploy --provider.cluster devnet
   ```

2. **Update Backend**
   ```javascript
   // Replace simulator with real Solana calls
   import { Connection, PublicKey } from '@solana/web3.js';
   
   const connection = new Connection('https://api.devnet.solana.com');
   ```

3. **Test with Wallets**
   - Use React frontend (not demo)
   - Connect Phantom/Solflare
   - Execute real transactions

---

## Environment Variables Reference

### Development (.env.local)
```bash
PORT=3000
NODE_ENV=development
VITE_API_URL=http://localhost:3000/api
VITE_SOLANA_NETWORK=devnet
```

### Vercel (Dashboard)
```bash
NODE_ENV=production
VITE_API_URL=/api
VITE_SOLANA_NETWORK=devnet
```

### Production (Separate Backend)
```bash
# Backend
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://...
CORS_ORIGIN=https://your-frontend.vercel.app

# Frontend (Vercel)
VITE_API_URL=https://your-backend.railway.app/api
VITE_SOLANA_NETWORK=mainnet-beta
```

---

## Quick Reference

### Deploy to Vercel (Auto)
1. Push to GitHub `master` branch
2. Vercel auto-deploys
3. Visit deployment URL

### Deploy to Vercel (Manual)
```bash
vercel --prod
```

### Check Deployment Status
```bash
vercel ls
```

### View Logs
```bash
vercel logs
```

### Rollback
```bash
vercel rollback
```

---

## Post-Deployment Checklist

- [ ] Deployment succeeded
- [ ] API health check returns 200
- [ ] Markets load in UI
- [ ] Can create new market
- [ ] Trading works (buy shares)
- [ ] Portfolio displays positions
- [ ] No console errors
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Environment variables set

---

## Support

**Vercel Issues:**
- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support

**Project Issues:**
- See README.md for local testing
- Check TROUBLESHOOTING.md for common errors

---

**Status:** Ready to deploy ✅  
**Estimated Deploy Time:** < 5 minutes  
**Cost:** Free (Vercel hobby tier)
