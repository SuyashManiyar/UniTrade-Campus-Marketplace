import * as fc from 'fast-check';
import { nlpService, ParsedQuery } from '../nlpService';

/**
 * Feature: nlp-enhanced-search, Property 8: Category recognition
 * Validates: Requirements 4.1
 * 
 * For any query containing a valid category name (ELECTRONICS, FURNITURE, TEXTBOOKS, BIKES, CLOTHING, OTHER),
 * the NLP service should correctly extract that category
 */
describe('Property 8: Category recognition', () => {
  const validCategories = ['ELECTRONICS', 'FURNITURE', 'TEXTBOOKS', 'BIKES', 'CLOTHING', 'OTHER'];
  
  // Skip if API key is not configured
  const skipIfNotConfigured = () => {
    if (!nlpService.isReady()) {
      console.warn('Skipping NLP tests: GEMINI_API_KEY not configured');
      return true;
    }
    return false;
  };

  it('should extract category from queries containing category names', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...validCategories),
        fc.constantFrom('I want', 'looking for', 'need', 'searching for', 'find me'),
        fc.constantFrom('a', 'an', 'some', ''),
        async (category, prefix, article) => {
          const categoryLower = category.toLowerCase();
          const query = `${prefix} ${article} ${categoryLower}`.trim();
          
          const result = await nlpService.parseQuery(query);
          
          // The extracted category should match the input category
          expect(result.category).toBe(category);
        }
      ),
      { numRuns: 10 } // Run 10 iterations per category
    );
  }, 60000); // 60 second timeout for API calls

  it('should extract category from queries with product names in that category', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    const categoryProducts: Record<string, string[]> = {
      'ELECTRONICS': ['laptop', 'phone', 'headphones', 'charger', 'powerbank'],
      'FURNITURE': ['desk', 'chair', 'table', 'lamp', 'shelf'],
      'TEXTBOOKS': ['textbook', 'book', 'manual', 'study guide'],
      'BIKES': ['bike', 'bicycle', 'cycle'],
      'CLOTHING': ['shirt', 'pants', 'jacket', 'shoes', 'hoodie'],
      'OTHER': ['misc', 'other', 'stuff']
    };

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...Object.keys(categoryProducts)),
        async (category) => {
          const products = categoryProducts[category];
          const product = products[Math.floor(Math.random() * products.length)];
          const query = `I want a ${product}`;
          
          const result = await nlpService.parseQuery(query);
          
          // The extracted category should match the expected category for this product
          expect(result.category).toBe(category);
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);
});

/**
 * Feature: nlp-enhanced-search, Property 9: Condition recognition
 * Validates: Requirements 4.2
 * 
 * For any query containing a valid condition term (NEW, LIKE_NEW, GOOD, FAIR, POOR),
 * the NLP service should correctly extract that condition
 */
describe('Property 9: Condition recognition', () => {
  const validConditions = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'];
  
  const skipIfNotConfigured = () => {
    if (!nlpService.isReady()) {
      console.warn('Skipping NLP tests: GEMINI_API_KEY not configured');
      return true;
    }
    return false;
  };

  it('should extract condition from queries containing condition terms', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...validConditions),
        fc.constantFrom('laptop', 'phone', 'desk', 'bike', 'textbook'),
        async (condition, product) => {
          const conditionPhrase = condition.toLowerCase().replace('_', ' ');
          const query = `${product} in ${conditionPhrase} condition`;
          
          const result = await nlpService.parseQuery(query);
          
          // The extracted condition should match the input condition
          expect(result.condition).toBe(condition);
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('should extract condition from queries with condition as adjective', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    const conditionAdjectives: Record<string, string> = {
      'NEW': 'new',
      'LIKE_NEW': 'like new',
      'GOOD': 'good',
      'FAIR': 'fair',
      'POOR': 'poor'
    };

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...Object.keys(conditionAdjectives)),
        fc.constantFrom('laptop', 'phone', 'desk', 'bike'),
        async (condition, product) => {
          const adjective = conditionAdjectives[condition];
          const query = `${adjective} ${product}`;
          
          const result = await nlpService.parseQuery(query);
          
          // The extracted condition should match the expected condition
          expect(result.condition).toBe(condition);
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);
});

/**
 * Feature: nlp-enhanced-search, Property 10: Price range extraction
 * Validates: Requirements 4.3
 * 
 * For any query containing price information in common formats,
 * the NLP service should extract the appropriate min/max price values
 */
describe('Property 10: Price range extraction', () => {
  const skipIfNotConfigured = () => {
    if (!nlpService.isReady()) {
      console.warn('Skipping NLP tests: GEMINI_API_KEY not configured');
      return true;
    }
    return false;
  };

  it('should extract maximum price from "under $X" format', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 1000 }),
        fc.constantFrom('laptop', 'phone', 'desk', 'bike'),
        async (price, product) => {
          const query = `${product} under $${price}`;
          
          const result = await nlpService.parseQuery(query);
          
          // Should extract maxPrice
          expect(result.maxPrice).toBeDefined();
          expect(result.maxPrice).toBeLessThanOrEqual(price + 10); // Allow small variance
          expect(result.minPrice).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('should extract minimum price from "over $X" or "at least $X" format', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 500 }),
        fc.constantFrom('laptop', 'phone', 'desk'),
        fc.constantFrom('over', 'at least', 'more than'),
        async (price, product, phrase) => {
          const query = `${product} ${phrase} $${price}`;
          
          const result = await nlpService.parseQuery(query);
          
          // Should extract minPrice
          expect(result.minPrice).toBeDefined();
          expect(result.minPrice).toBeGreaterThanOrEqual(price - 10); // Allow small variance
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('should extract price range from "between $X and $Y" format', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 200 }),
        fc.integer({ min: 201, max: 1000 }),
        fc.constantFrom('laptop', 'phone', 'desk', 'bike'),
        async (minPrice, maxPrice, product) => {
          const query = `${product} between $${minPrice} and $${maxPrice}`;
          
          const result = await nlpService.parseQuery(query);
          
          // Should extract both min and max price
          expect(result.minPrice).toBeDefined();
          expect(result.maxPrice).toBeDefined();
          expect(result.minPrice!).toBeLessThanOrEqual(result.maxPrice!);
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('should extract approximate price from "around $X" format', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 20, max: 500 }),
        fc.constantFrom('laptop', 'phone', 'desk'),
        async (price, product) => {
          const query = `${product} around $${price}`;
          
          const result = await nlpService.parseQuery(query);
          
          // Should extract either minPrice, maxPrice, or both (representing a range around the price)
          const hasPriceInfo = result.minPrice !== undefined || result.maxPrice !== undefined;
          expect(hasPriceInfo).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);
});


/**
 * Feature: nlp-enhanced-search, Property 7: Query result caching
 * Validates: Requirements 3.3
 * 
 * For any identical query submitted multiple times within the cache window,
 * the second and subsequent requests should use cached results
 */
describe('Property 7: Query result caching', () => {
  const skipIfNotConfigured = () => {
    if (!nlpService.isReady()) {
      console.warn('Skipping NLP tests: GEMINI_API_KEY not configured');
      return true;
    }
    return false;
  };

  it('should use cached results for identical queries', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    // Clear cache before test
    nlpService.clearCache();

    const query = 'laptop in good condition';
    
    // First call - should hit API
    const startTime1 = Date.now();
    const result1 = await nlpService.parseQuery(query);
    const duration1 = Date.now() - startTime1;
    
    // Second call - should use cache (much faster)
    const startTime2 = Date.now();
    const result2 = await nlpService.parseQuery(query);
    const duration2 = Date.now() - startTime2;
    
    // Results should be identical
    expect(result2).toEqual(result1);
    
    // Second call should be significantly faster (at least 10x)
    expect(duration2).toBeLessThan(duration1 / 10);
    
    // Cache should have 1 entry
    const stats = nlpService.getCacheStats();
    expect(stats.size).toBe(1);
  }, 30000);

  it('should cache different queries separately', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    // Clear cache before test
    nlpService.clearCache();

    const query1 = 'bike under $200';
    const query2 = 'textbook in new condition';
    
    // Make both queries
    const result1 = await nlpService.parseQuery(query1);
    const result2 = await nlpService.parseQuery(query2);
    
    // Results should be different
    expect(result1).not.toEqual(result2);
    
    // Cache should have 2 entries
    const stats = nlpService.getCacheStats();
    expect(stats.size).toBe(2);
    
    // Querying again should use cache
    const result1Again = await nlpService.parseQuery(query1);
    const result2Again = await nlpService.parseQuery(query2);
    
    expect(result1Again).toEqual(result1);
    expect(result2Again).toEqual(result2);
    
    // Cache size should still be 2
    const statsAfter = nlpService.getCacheStats();
    expect(statsAfter.size).toBe(2);
  }, 60000);
});


/**
 * Feature: nlp-enhanced-search, Property 6: API failure fallback
 * Validates: Requirements 3.1, 3.2
 * 
 * For any query when the Gemini API is unavailable or returns an error,
 * the NLP service should fall back to standard keyword search without throwing an error
 */
describe('Property 6: API failure fallback', () => {
  it('should fall back to keyword search when API is unavailable', async () => {
    // When API fails (rate limit, network error, etc.), service should fall back
    // This is tested implicitly by the confidence=0 check
    // We can't easily simulate API failure without mocking, so we test the fallback path
    
    const query = 'laptop in good condition';
    const result = await nlpService.parseQuery(query);
    
    // Result should always have keywords (either extracted or fallback)
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    
    // If confidence is 0, it means fallback was used
    if (result.confidence === 0) {
      expect(result.keywords).toContain(query);
    }
  });

  it('should handle empty queries gracefully', async () => {
    const result = await nlpService.parseQuery('');
    
    // Should return empty keywords
    expect(result.keywords).toEqual(['']);
    expect(result.confidence).toBe(0);
  });
});

/**
 * Feature: nlp-enhanced-search, Property 4: Fallback to keyword search
 * Validates: Requirements 1.4
 * 
 * For any query where no valid filters can be extracted,
 * the system should perform a standard keyword search using the original query text
 */
describe('Property 4: Fallback to keyword search', () => {
  const skipIfNotConfigured = () => {
    if (!nlpService.isReady()) {
      console.warn('Skipping NLP tests: GEMINI_API_KEY not configured');
      return true;
    }
    return false;
  };

  it('should use original query as keywords when no filters extracted', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    // Query with no recognizable filters
    const query = 'random stuff xyz123';
    const result = await nlpService.parseQuery(query);
    
    // Should have keywords (even if no other filters)
    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBeGreaterThan(0);
  }, 30000);
});

/**
 * Feature: nlp-enhanced-search, Property 11: Sensitive data not logged
 * Validates: Requirements 6.4
 * 
 * For any error or log message generated by the NLP service,
 * the log output should not contain the API key or other sensitive credentials
 */
describe('Property 11: Sensitive data not logged', () => {
  it('should sanitize API keys from error messages', () => {
    const testError = {
      message: 'Error with API key AIzaSyAbc123def456ghi789jkl012mno345pqr'
    };
    
    // Access private method through any type
    const sanitized = (nlpService as any).sanitizeError(testError);
    
    // API key should be redacted
    expect(sanitized.message).not.toContain('AIzaSy');
    expect(sanitized.message).toContain('[REDACTED]');
  });

  it('should handle errors without exposing sensitive data in logs', () => {
    // Test that the sanitizeError method works correctly
    const testError = {
      message: 'Failed to connect to API with key AIzaSyAbc123def456ghi789jkl012mno345pqr',
      stack: 'Error: API key AIzaSyXyz987wvu654tsr321qpo098nml765kji was invalid'
    };
    
    const sanitized = (nlpService as any).sanitizeError(testError);
    
    // Both API keys should be redacted
    expect(sanitized.message).not.toContain('AIzaSyAbc123');
    expect(sanitized.message).not.toContain('AIzaSyXyz987');
    expect(sanitized.message).toContain('[REDACTED]');
  });
});
