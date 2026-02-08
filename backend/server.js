import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { AMMSimulator } from './amm.js';
import { DataStore } from './store.js';
import { SolanaDevnet } from './solana-devnet.js';
import { Database } from './database.js';
import { upload } from './multer-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Check if devnet mode is enabled
const DEVNET_ENABLED = process.env.SOLANA_DEVNET === 'true';
const USE_DATABASE = process.env.USE_DATABASE !== 'false'; // Default to true
const IS_VERCEL = process.env.VERCEL === '1';

// Initialize
const amm = new AMMSimulator();
const store = new DataStore();
const solana = new SolanaDevnet();
const db = new Database();

// Initialize database (skip on Vercel - use in-memory only)
let dbReady = false;
if (USE_DATABASE && !IS_VERCEL) {
  db.initialize().then(() => {
    dbReady = true;
    console.log('✅ Database initialized');
  }).catch(err => {
    console.error('Database initialization failed:', err);
  });
}

// Use in-memory storage (seed examples)
if (!DEVNET_ENABLED) {
  store.seedExamples();
}

if (IS_VERCEL) {
  console.log('📦 Running on Vercel - using in-memory storage');
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve media files
app.use('/media', express.static(path.join(__dirname, 'data', 'media')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

// Helper: Format market for response
function formatMarket(market) {
  const percentages = amm.calculatePercentages(market);
  const timeRemaining = market.resolved 
    ? null 
    : getTimeRemaining(market.createdAt);

  return {
    id: market.id,
    creator: market.creator,
    content: market.content,
    deserved_percent: percentages.deserved,
    fml_percent: percentages.fml,
    vote_count: market.voteCount,
    total_volume: market.totalVolume.toFixed(4),
    time_remaining: timeRemaining,
    resolved: market.resolved,
    created_at: market.createdAt,
  };
}

function getTimeRemaining(createdAt) {
  const elapsed = Date.now() - createdAt;
  const limit = 48 * 3600 * 1000; // 48 hours
  const remaining = limit - elapsed;

  if (remaining <= 0) return 'Ended';

  const hours = Math.floor(remaining / (3600 * 1000));
  const minutes = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// ==================== API ROUTES ====================

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: DEVNET_ENABLED ? 'devnet' : 'simulation',
    devnet_enabled: DEVNET_ENABLED,
    markets: store.markets.size,
    uptime: process.uptime(),
  });
});

// GET /api/markets - List all markets
app.get('/api/markets', (req, res) => {
  try {
    const filter = req.query.filter || 'active';
    const markets = store.getAllMarkets(filter);
    
    res.json(markets.map(formatMarket));
  } catch (error) {
    console.error('Error listing markets:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/markets/:id - Get single market
app.get('/api/markets/:id', (req, res) => {
  try {
    const market = store.getMarket(req.params.id);
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    // Auto-resolve if needed
    if (!market.resolved && amm.shouldResolve(market)) {
      amm.resolveMarket(market);
    }

    res.json(formatMarket(market));
  } catch (error) {
    console.error('Error fetching market:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/upload - Upload media (disabled on Vercel)
if (!IS_VERCEL) {
  app.post('/api/upload', upload.single('media'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ext = path.extname(req.file.originalname);
      const filename = `${id}${ext}`;

      const media = await db.saveMedia(
        id,
        filename,
        req.file.buffer,
        req.file.mimetype
      );

      console.log(`📎 Media uploaded: ${filename} (${(req.file.size / 1024).toFixed(2)} KB)`);

      res.json({
        success: true,
        media_id: media.id,
        url: media.path,
        filename: media.filename,
        size: req.file.size,
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ error: error.message });
    }
  });
} else {
  // Vercel: just return not supported
  app.post('/api/upload', (req, res) => {
    res.status(501).json({ error: 'Media uploads not available on Vercel (use local deployment)' });
  });
}

// POST /api/markets - Create new market
app.post('/api/markets', async (req, res) => {
  try {
    const { content, initial_liquidity, wallet, media_id } = req.body;

    // Validation
    if (!content || content.length < 10) {
      return res.status(400).json({ error: 'Content must be at least 10 characters' });
    }
    if (content.length > 280) {
      return res.status(400).json({ error: 'Content must be 280 characters or less' });
    }
    if (!initial_liquidity || initial_liquidity < 0.1) {
      return res.status(400).json({ error: 'Minimum liquidity is 0.1 SOL' });
    }

    const market = store.createMarket(
      content, 
      initial_liquidity,
      wallet || 'anonymous'
    );

    // Attach media if provided
    if (media_id && USE_DATABASE && !IS_VERCEL) {
      const media = await db.getMedia(media_id);
      if (media) {
        market.media = media.path;
      }
    }

    // Save to database if enabled (skip on Vercel)
    if (USE_DATABASE && !IS_VERCEL) {
      await db.createMarket(market);
    }

    console.log(`✅ Market created: ${market.id} - "${content.substring(0, 50)}..."${media_id ? ' [with media]' : ''}`);

    res.status(201).json(formatMarket(market));
  } catch (error) {
    console.error('Error creating market:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/markets/:id/buy - Buy shares
app.post('/api/markets/:id/buy', (req, res) => {
  try {
    const { side, amount, wallet } = req.body;
    const marketId = req.params.id;

    // Validation
    if (!side || !['deserved', 'fml'].includes(side)) {
      return res.status(400).json({ error: 'Side must be "deserved" or "fml"' });
    }
    if (!amount || amount < amm.MIN_TRADE) {
      return res.status(400).json({ error: `Minimum trade is ${amm.MIN_TRADE} SOL` });
    }

    const market = store.getMarket(marketId);
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }
    if (market.resolved) {
      return res.status(400).json({ error: 'Market already resolved' });
    }

    // Execute trade
    const result = amm.buyShares(market, side, amount);

    // Update position
    const walletAddress = wallet || 'anonymous';
    const position = store.getPosition(walletAddress, marketId);
    
    if (side === 'deserved') {
      position.deservedShares += result.shares;
      market.totalDeservedShares += result.shares;
    } else {
      position.fmlShares += result.shares;
      market.totalFmlShares += result.shares;
    }
    position.invested += amount;
    
    store.updatePosition(walletAddress, marketId, position);

    // Check for auto-resolution
    if (amm.shouldResolve(market)) {
      const final = amm.resolveMarket(market);
      console.log(`🎯 Market ${marketId} resolved: ${final.deserved}% Deserved, ${final.fml}% FML`);
    }

    console.log(`💰 Trade: ${amount} SOL → ${side} on market ${marketId}`);

    res.json({
      success: true,
      shares: result.shares,
      market: formatMarket(market),
    });
  } catch (error) {
    console.error('Error buying shares:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/positions/:wallet - Get user positions
app.get('/api/positions/:wallet', (req, res) => {
  try {
    const positions = store.getPositionsByWallet(req.params.wallet);
    
    const formatted = positions.map(pos => {
      const market = pos.market;
      const percentages = amm.calculatePercentages(market);
      
      // Calculate current value (simplified)
      const deservedValue = pos.deservedShares * (percentages.deserved / 100);
      const fmlValue = pos.fmlShares * (percentages.fml / 100);
      const currentValue = deservedValue + fmlValue;
      const pnl = currentValue - pos.invested;

      return {
        id: `${pos.wallet}:${pos.marketId}`,
        market: formatMarket(market),
        deserved_shares: pos.deservedShares.toFixed(4),
        fml_shares: pos.fmlShares.toFixed(4),
        invested: pos.invested.toFixed(4),
        current_value: currentValue.toFixed(4),
        pnl: pnl.toFixed(4),
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats - Global statistics
app.get('/api/stats', (req, res) => {
  try {
    const markets = store.getAllMarkets('all');
    const totalVolume = markets.reduce((sum, m) => sum + m.totalVolume, 0);
    const totalVotes = markets.reduce((sum, m) => sum + m.voteCount, 0);
    const active = markets.filter(m => !m.resolved).length;
    const resolved = markets.filter(m => m.resolved).length;

    res.json({
      total_markets: markets.length,
      active_markets: active,
      resolved_markets: resolved,
      total_volume: totalVolume.toFixed(4),
      total_votes: totalVotes,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server (only if not on Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 FML or Deserved API running on http://localhost:${PORT}`);
    console.log(`📊 Mode: ${DEVNET_ENABLED ? 'Solana Devnet' : 'Simulation (in-memory)'}`);
    if (!DEVNET_ENABLED) {
      console.log(`📝 Seeded with ${store.markets.size} example markets`);
      console.log(`💡 To enable devnet: Set SOLANA_DEVNET=true in .env`);
    } else {
      console.log(`🌐 Connected to Solana devnet`);
      console.log(`📝 Program ID: ${solana.programId || 'Not deployed yet'}`);
    }
    console.log(`\nAPI Endpoints:`);
    console.log(`  GET  /api/health`);
    console.log(`  GET  /api/markets`);
    console.log(`  GET  /api/markets/:id`);
    console.log(`  POST /api/markets`);
    console.log(`  POST /api/markets/:id/buy`);
    console.log(`  GET  /api/positions/:wallet`);
    console.log(`  GET  /api/stats`);
  });
}

export default app;
