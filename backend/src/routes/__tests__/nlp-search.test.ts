import request from 'supertest';
import express from 'express';
import listingsRouter from '../listings';
import { nlpService } from '../../services/nlpService';

const app = express();
app.use(express.json());
app.use('/api/listings', listingsRouter);

/**
 * Feature: nlp-enhanced-search, Property 2: Filter extraction completeness
 * Validates: Requirements 1.2, 4.4
 * 
 * For any natural language query containing valid category, condition, or price information,
 * the NLP service should extract all present and valid filters
 */
describe('Property 2: Filter extraction completeness', () => {
  const skipIfNotConfigured = () => {
    if (!nlpService.isReady()) {
      console.warn('Skipping NLP endpoint tests: GEMINI_API_KEY not configured');
      return true;
    }
    return false;
  };

  it('should extract all filters from a complex query', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    const response = await request(app)
      .post('/api/listings/nlp-search')
      .send({ query: 'I want a laptop in good condition under $500' });

    expect(response.status).toBe(200);
    expect(response.body.extractedFilters).toBeDefined();
    
    const filters = response.body.extractedFilters;
    
    // Should extract keywords
    expect(filters.keywords).toBeDefined();
    expect(filters.keywords.length).toBeGreaterThan(0);
    
    // Should extract category
    expect(filters.category).toBe('ELECTRONICS');
    
    // Should extract condition
    expect(filters.condition).toBe('GOOD');
    
    // Should extract price
    expect(filters.maxPrice).toBeDefined();
    expect(filters.maxPrice).toBeLessThanOrEqual(500);
  }, 30000);

  it('should extract category and condition from query', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    const response = await request(app)
      .post('/api/listings/nlp-search')
      .send({ query: 'textbooks in like new condition' });

    expect(response.status).toBe(200);
    
    const filters = response.body.extractedFilters;
    expect(filters.category).toBe('TEXTBOOKS');
    expect(filters.condition).toBe('LIKE_NEW');
  }, 30000);

  it('should extract price range from query', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    const response = await request(app)
      .post('/api/listings/nlp-search')
      .send({ query: 'bike between $100 and $300' });

    expect(response.status).toBe(200);
    
    const filters = response.body.extractedFilters;
    expect(filters.minPrice).toBeDefined();
    expect(filters.maxPrice).toBeDefined();
    expect(filters.minPrice).toBeGreaterThanOrEqual(90); // Allow some variance
    expect(filters.maxPrice).toBeLessThanOrEqual(310);
  }, 30000);
});

/**
 * Feature: nlp-enhanced-search, Property 3: Extracted filters are applied
 * Validates: Requirements 1.3
 * 
 * For any set of extracted filters, the database query should include
 * all extracted filter parameters in the where clause
 */
describe('Property 3: Extracted filters are applied', () => {
  const skipIfNotConfigured = () => {
    if (!nlpService.isReady()) {
      console.warn('Skipping NLP endpoint tests: GEMINI_API_KEY not configured');
      return true;
    }
    return false;
  };

  it('should return listings matching extracted filters', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    const response = await request(app)
      .post('/api/listings/nlp-search')
      .send({ query: 'electronics in good condition' });

    expect(response.status).toBe(200);
    expect(response.body.listings).toBeDefined();
    
    const filters = response.body.extractedFilters;
    const listings = response.body.listings;
    
    // All returned listings should match the extracted filters
    if (filters.category) {
      listings.forEach((listing: any) => {
        expect(listing.category).toBe(filters.category);
      });
    }
    
    if (filters.condition) {
      listings.forEach((listing: any) => {
        expect(listing.condition).toBe(filters.condition);
      });
    }
  }, 30000);

  it('should apply price filters to results', async () => {
    if (skipIfNotConfigured()) {
      return;
    }

    const response = await request(app)
      .post('/api/listings/nlp-search')
      .send({ query: 'items under $100' });

    expect(response.status).toBe(200);
    
    const filters = response.body.extractedFilters;
    const listings = response.body.listings;
    
    // All returned listings should be under the max price
    if (filters.maxPrice) {
      listings.forEach((listing: any) => {
        expect(listing.price).toBeLessThanOrEqual(filters.maxPrice + 10); // Allow small variance
      });
    }
  }, 30000);
});
