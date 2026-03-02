import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CacheService {
  constructor() {
    this.queryCache = new Map();
    this.analyticsCache = null;
    this.indexMetadata = null;
    this.TTL = 60000; // 60 seconds
    this.analyticsTTL = 300000; // 5 minutes
    this.cacheFile = path.join(__dirname, '../data/cache.json');
  }

  getCached(key) {
    const entry = this.queryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.TTL) {
      this.queryCache.delete(key);
      return null;
    }
    console.log(`✓ Cache hit: ${key.substring(0, 50)}...`);
    return entry.data;
  }

  setCached(key, data) {
    this.queryCache.set(key, { data, timestamp: Date.now() });
    if (this.queryCache.size > 1000) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }
  }

  async getAnalytics(computeFn) {
    if (this.analyticsCache && Date.now() - this.analyticsCache.timestamp < this.analyticsTTL) {
      console.log('✓ Analytics cache hit');
      return this.analyticsCache.data;
    }
    const data = await computeFn();
    this.analyticsCache = { data, timestamp: Date.now() };
    return data;
  }

  saveIndexMetadata(metadata) {
    this.indexMetadata = metadata;
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify({
        indexMetadata: metadata,
        timestamp: Date.now()
      }), 'utf-8');
    } catch (error) {
      console.error('Failed to save cache metadata:', error.message);
    }
  }

  loadIndexMetadata() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf-8'));
        this.indexMetadata = data.indexMetadata;
        return data.indexMetadata;
      }
    } catch (error) {
      console.error('Failed to load cache metadata:', error.message);
    }
    return null;
  }

  invalidate() {
    this.queryCache.clear();
    this.analyticsCache = null;
    console.log('✓ Cache invalidated');
  }

  invalidateAnalytics() {
    this.analyticsCache = null;
    console.log('✓ Analytics cache invalidated');
  }
}

export default new CacheService();
