import { LRUCache } from '../cache';

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(3, 1); // maxSize: 3, ttl: 1 minute
  });

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should update existing values', () => {
      cache.set('key1', 100);
      cache.set('key1', 200);
      expect(cache.get('key1')).toBe(200);
    });

    it('should check if key exists', () => {
      cache.set('key1', 100);
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used item when cache is full', () => {
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      
      // Cache is now full (size 3)
      // Access key1 to make it recently used
      cache.get('key1');
      
      // Add new item - should evict key2 (least recently used)
      cache.set('key4', 4);
      
      expect(cache.get('key1')).toBe(1); // Still exists
      expect(cache.get('key2')).toBeUndefined(); // Evicted
      expect(cache.get('key3')).toBe(3); // Still exists
      expect(cache.get('key4')).toBe(4); // New item
    });

    it('should maintain correct size when evicting', () => {
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      expect(cache.size()).toBe(3);
      
      cache.set('key4', 4);
      expect(cache.size()).toBe(3); // Should still be 3
    });
  });

  describe('TTL Expiration', () => {
    it('should expire entries after TTL', (done) => {
      const shortCache = new LRUCache<string, number>(10, 0.001); // 0.001 minutes = 60ms
      
      shortCache.set('key1', 100);
      expect(shortCache.get('key1')).toBe(100);
      
      setTimeout(() => {
        expect(shortCache.get('key1')).toBeUndefined();
        expect(shortCache.has('key1')).toBe(false);
        done();
      }, 100);
    });

    it('should not expire entries before TTL', () => {
      const longCache = new LRUCache<string, number>(10, 60); // 60 minutes
      
      longCache.set('key1', 100);
      expect(longCache.get('key1')).toBe(100);
      expect(longCache.has('key1')).toBe(true);
    });
  });

  describe('Clear Operations', () => {
    it('should clear all entries', () => {
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });

    it('should cleanup expired entries', (done) => {
      const shortCache = new LRUCache<string, number>(10, 0.001); // 60ms TTL
      
      shortCache.set('key1', 1);
      shortCache.set('key2', 2);
      
      setTimeout(() => {
        shortCache.cleanup();
        expect(shortCache.size()).toBe(0);
        done();
      }, 100);
    });
  });

  describe('Size Management', () => {
    it('should return correct size', () => {
      expect(cache.size()).toBe(0);
      
      cache.set('key1', 1);
      expect(cache.size()).toBe(1);
      
      cache.set('key2', 2);
      expect(cache.size()).toBe(2);
      
      cache.set('key3', 3);
      expect(cache.size()).toBe(3);
    });

    it('should not exceed max size', () => {
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      cache.set('key4', 4);
      cache.set('key5', 5);
      
      expect(cache.size()).toBeLessThanOrEqual(3);
    });
  });
});


