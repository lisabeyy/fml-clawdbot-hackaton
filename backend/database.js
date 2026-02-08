/**
 * Simple File-Based Database
 * Stores markets and media references in JSON file
 * Can be easily migrated to Supabase/Postgres later
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'markets.json');
const MEDIA_PATH = path.join(__dirname, 'data', 'media');

export class Database {
  constructor() {
    this.data = {
      markets: [],
      positions: [],
      media: []
    };
    this.initialized = false;
  }

  async initialize() {
    try {
      // Ensure data directory exists
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      await fs.mkdir(MEDIA_PATH, { recursive: true });

      // Load existing data if available
      try {
        const content = await fs.readFile(DB_PATH, 'utf8');
        this.data = JSON.parse(content);
        console.log(`📂 Loaded ${this.data.markets.length} markets from database`);
      } catch (error) {
        // File doesn't exist yet, start fresh
        console.log('📂 Creating new database');
        await this.save();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async save() {
    try {
      await fs.writeFile(DB_PATH, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  // Market operations
  async createMarket(market) {
    this.data.markets.push(market);
    await this.save();
    return market;
  }

  async getMarket(id) {
    return this.data.markets.find(m => m.id === id);
  }

  async getAllMarkets(filter = 'active') {
    if (filter === 'all') {
      return this.data.markets;
    }
    return this.data.markets.filter(m => 
      filter === 'active' ? !m.resolved : m.resolved
    );
  }

  async updateMarket(id, updates) {
    const index = this.data.markets.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    this.data.markets[index] = { ...this.data.markets[index], ...updates };
    await this.save();
    return this.data.markets[index];
  }

  // Position operations
  async getPosition(wallet, marketId) {
    return this.data.positions.find(
      p => p.wallet === wallet && p.marketId === marketId
    ) || {
      wallet,
      marketId,
      deservedShares: 0,
      fmlShares: 0,
      invested: 0
    };
  }

  async updatePosition(wallet, marketId, position) {
    const index = this.data.positions.findIndex(
      p => p.wallet === wallet && p.marketId === marketId
    );

    if (index === -1) {
      this.data.positions.push(position);
    } else {
      this.data.positions[index] = position;
    }

    await this.save();
  }

  async getPositionsByWallet(wallet) {
    return this.data.positions.filter(p => p.wallet === wallet);
  }

  // Media operations
  async saveMedia(id, filename, buffer, mimetype) {
    const filepath = path.join(MEDIA_PATH, filename);
    await fs.writeFile(filepath, buffer);

    const media = {
      id,
      filename,
      mimetype,
      path: `/media/${filename}`,
      createdAt: Date.now()
    };

    this.data.media.push(media);
    await this.save();
    return media;
  }

  async getMedia(id) {
    return this.data.media.find(m => m.id === id);
  }

  async getMediaBuffer(filename) {
    const filepath = path.join(MEDIA_PATH, filename);
    return await fs.readFile(filepath);
  }

  // Stats
  getStats() {
    const markets = this.data.markets;
    const totalVolume = markets.reduce((sum, m) => sum + (m.totalVolume || 0), 0);
    const totalVotes = markets.reduce((sum, m) => sum + (m.voteCount || 0), 0);
    
    return {
      total_markets: markets.length,
      active_markets: markets.filter(m => !m.resolved).length,
      resolved_markets: markets.filter(m => m.resolved).length,
      total_volume: totalVolume.toFixed(4),
      total_votes: totalVotes,
      total_media: this.data.media.length
    };
  }
}

export default Database;
