# Vercel Deployment - Quick Setup Guide

## ✅ Pre-configured for Vercel

Your repo is ready to deploy! Here's what's been set up:

### Files Created
- ✅ `vercel.json` - Deployment configuration
- ✅ `api/index.js` - Serverless function entry point
- ✅ `.vercelignore` - Files to exclude from deployment
- ✅ `.env.example` - Environment variable template
- ✅ `DEPLOYMENT.md` - Comprehensive deployment guide

### Configuration

**`vercel.json`** routes:
```
/api/*     → Serverless backend (Node.js)
/*         → Static frontend (demo-frontend/index.html)
```

## 🚀 Deploy Now

### Option 1: Auto-Deploy (Recommended)

Already done! Vercel will auto-deploy when you push to GitHub.

```bash
git push origin master
```

Then check your Vercel dashboard for the deployment.

### Option 2: Manual Deploy

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel

# Or deploy to production
vercel --prod
```

## 🔧 Environment Variables (Optional)

In Vercel Dashboard → Settings → Environment Variables, add:

```
NODE_ENV=production
```

That's it! The app will work with defaults.

## 📋 What Gets Deployed

### Frontend
- Single HTML file at `/demo-frontend/index.html`
- Automatically uses `/api` for backend calls in production
- No build step required
- Instant load time

### Backend
- Express API as serverless function
- 8 endpoints (health, markets, trading, positions, stats)
- In-memory state (resets on cold start)
- Auto-seeds with 4 example markets

## 🧪 Test Your Deployment

Once deployed, visit your Vercel URL:

```
https://your-project.vercel.app
```

**Expected flow:**
1. ✅ Homepage loads with market feed
2. ✅ Can browse 4 pre-seeded markets
3. ✅ Click market to see trading interface
4. ✅ Can buy Deserved or FML shares
5. ✅ Can create new market
6. ✅ Portfolio shows positions

**API test:**
```bash
curl https://your-project.vercel.app/api/health
# Expected: {"status":"ok","mode":"simulation",...}
```

## ⚠️ Important Notes

### In-Memory State
- Data resets on serverless cold starts (~5-15 min inactivity)
- Perfect for demo/testing
- For production, add database (see DEPLOYMENT.md)

### Cold Starts
- First request after idle: ~2-5 seconds
- Subsequent requests: <100ms
- This is normal for Vercel serverless

### CORS
- Already configured for cross-origin requests
- Frontend automatically detects production vs development

## 🐛 Troubleshooting

**Issue: Deployment fails**
- Check Vercel logs in dashboard
- Verify `package.json` exists in root
- Ensure backend dependencies are in `backend/package.json`

**Issue: API 404**
- Check URL: should be `/api/health` not `/health`
- Verify `vercel.json` routes
- Check Vercel function logs

**Issue: Frontend loads but API fails**
- Open browser console (F12)
- Check Network tab for failed requests
- Verify API URL is relative (`/api`) in production

**Issue: Data disappears**
- Expected: in-memory store resets on cold start
- Not a bug, it's serverless architecture
- Add database for persistence (see DEPLOYMENT.md)

## 📚 More Info

- **Full deployment guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Project documentation:** [README.md](README.md)
- **Vercel docs:** https://vercel.com/docs

## 🎯 Quick Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Rollback to previous version
vercel rollback

# Open in browser
vercel open
```

## ✅ Deployment Checklist

Before marking complete:

- [ ] Pushed latest code to GitHub
- [ ] Vercel shows successful deployment
- [ ] Can access homepage at deployment URL
- [ ] API health check returns 200
- [ ] Can browse markets
- [ ] Can execute trades
- [ ] No console errors
- [ ] Mobile responsive works

---

**Status:** Ready to deploy 🚀  
**Setup time:** < 5 minutes  
**Cost:** Free (Vercel Hobby tier)  

Push to GitHub and your app will be live!
