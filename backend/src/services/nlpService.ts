import { GoogleGenerativeAI } from '@google/generative-ai';
import { LRUCache } from '../utils/cache';
import crypto from 'crypto';

export interface ParsedQuery {
  keywords: string[];
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  confidence: number;
}

class NLPService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private isEnabled: boolean = false;
  private cache: LRUCache<string, ParsedQuery>;

  constructor() {
    // Initialize cache (100 entries, 5 minute TTL)
    this.cache = new LRUCache<string, ParsedQuery>(100, 5);
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found in environment variables. NLP features will be disabled.');
      this.isEnabled = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Use gemini-2.5-flash model
      this.model = this.genAI.getGenerativeModel({ 
        model: 'models/gemini-2.5-flash',
        generationConfig: {
          temperature: 0.1
        }
      });
      this.isEnabled = true;
      console.log('NLP Service initialized successfully with Gemini API');
    } catch (error) {
      console.error('Failed to initialize Gemini API:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Parse a natural language query into structured search filters
   */
  async parseQuery(query: string): Promise<ParsedQuery> {
    console.log('\n🔍 [NLP] Starting query parsing:', query);
    
    // Normalize query for cache key
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = this.generateCacheKey(normalizedQuery);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('✅ [NLP] Cache hit! Returning cached result');
      console.log('📊 [NLP] Cached result:', JSON.stringify(cached, null, 2));
      return cached;
    }
    console.log('❌ [NLP] Cache miss, calling Gemini API...');

    if (!this.isEnabled || !this.model) {
      console.log('⚠️  [NLP] Service not enabled, using fallback');
      return {
        keywords: [query.trim()],
        confidence: 0
      };
    }

    try {
      console.log('📤 [NLP] Sending request to Gemini API...');
      const prompt = this.buildPrompt(query);
      const apiResult = await this.model.generateContent(prompt);
      const response = await apiResult.response;
      const text = response.text();
      
      console.log('📥 [NLP] Received response from Gemini');
      console.log('📝 [NLP] Raw response:', text.substring(0, 200));
      
      // Extract JSON from response (might be wrapped in markdown code blocks)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      
      // Parse JSON response
      const parsed = JSON.parse(jsonText.trim());
      console.log('🔧 [NLP] Parsed JSON:', JSON.stringify(parsed, null, 2));
      
      // Validate and normalize the response
      const parsedQuery = this.validateFilters(parsed);
      console.log('✅ [NLP] Validated result:', JSON.stringify(parsedQuery, null, 2));
      
      // Store in cache
      this.cache.set(cacheKey, parsedQuery);
      console.log('💾 [NLP] Stored in cache');
      
      return parsedQuery;
    } catch (error: any) {
      console.error('❌ [NLP] Error parsing query with Gemini:');
      console.error('   Error type:', error.constructor.name);
      console.error('   Error message:', error.message);
      if (error.status) {
        console.error('   HTTP Status:', error.status, error.statusText);
      }
      if (error.errorDetails) {
        console.error('   Error details:', JSON.stringify(error.errorDetails, null, 2));
      }
      console.log('🔄 [NLP] Falling back to keyword search');
      
      // Fallback: return query as keywords
      return {
        keywords: [query.trim()],
        confidence: 0
      };
    }
  }

  /**
   * Build the prompt for Gemini API with schema and examples
   */
  private buildPrompt(query: string): string {
    return `You are a search query parser for a campus marketplace. Parse the following natural language query into structured search filters.

Valid categories: ELECTRONICS, FURNITURE, TEXTBOOKS, BIKES, CLOTHING, OTHER
Valid conditions: NEW, LIKE_NEW, GOOD, FAIR, POOR

Extract:
- keywords: array of search terms (product names, descriptions). Include synonyms and related terms to improve matching.
  For example: "winter wear" should include ["winter", "coat", "jacket", "sweater", "warm", "clothing"]
  "laptop" should include ["laptop", "computer", "notebook"]
  "study materials" should include ["textbook", "book", "notes", "study"]
- category: one of the valid categories (if mentioned or implied)
- condition: one of the valid conditions (if mentioned)
- minPrice: minimum price (if mentioned, e.g., "over $50", "at least $20")
- maxPrice: maximum price (if mentioned, e.g., "under $100", "less than $50")
- confidence: your confidence in the parsing (0-1)

Examples:

Query: "I want a powerbank in fair condition"
Response: {"keywords": ["powerbank", "power", "bank", "battery", "charger"], "category": "ELECTRONICS", "condition": "FAIR", "minPrice": null, "maxPrice": null, "confidence": 0.95}

Query: "looking for textbooks under $50"
Response: {"keywords": ["textbook", "book", "study", "course"], "category": "TEXTBOOKS", "condition": null, "minPrice": null, "maxPrice": 50, "confidence": 0.9}

Query: "new bike between $100 and $300"
Response: {"keywords": ["bike", "bicycle", "cycle"], "category": "BIKES", "condition": "NEW", "minPrice": 100, "maxPrice": 300, "confidence": 0.95}

Query: "furniture in good condition"
Response: {"keywords": ["furniture", "desk", "chair", "table", "shelf"], "category": "FURNITURE", "condition": "GOOD", "minPrice": null, "maxPrice": null, "confidence": 0.9}

Query: "cheap laptop"
Response: {"keywords": ["laptop", "computer", "notebook", "macbook", "chromebook"], "category": "ELECTRONICS", "condition": null, "minPrice": null, "maxPrice": null, "confidence": 0.8}

Query: "winter wear"
Response: {"keywords": ["winter", "coat", "jacket", "sweater", "warm", "clothing"], "category": "CLOTHING", "condition": null, "minPrice": null, "maxPrice": null, "confidence": 0.85}

Now parse this query:
Query: "${query}"
Response:`;
  }

  /**
   * Validate and normalize the parsed filters from Gemini
   */
  private validateFilters(parsed: any): ParsedQuery {
    const validCategories = ['ELECTRONICS', 'FURNITURE', 'TEXTBOOKS', 'BIKES', 'CLOTHING', 'OTHER'];
    const validConditions = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'];

    const result: ParsedQuery = {
      keywords: [],
      confidence: 0
    };

    // Validate keywords
    if (Array.isArray(parsed.keywords)) {
      result.keywords = parsed.keywords
        .filter((k: any) => typeof k === 'string' && k.trim().length > 0)
        .map((k: string) => k.trim().toLowerCase());
    }

    // Validate category
    if (parsed.category && validCategories.includes(parsed.category.toUpperCase())) {
      result.category = parsed.category.toUpperCase();
    }

    // Validate condition
    if (parsed.condition && validConditions.includes(parsed.condition.toUpperCase())) {
      result.condition = parsed.condition.toUpperCase();
    }

    // Validate prices
    if (typeof parsed.minPrice === 'number' && parsed.minPrice >= 0) {
      result.minPrice = parsed.minPrice;
    }

    if (typeof parsed.maxPrice === 'number' && parsed.maxPrice >= 0) {
      result.maxPrice = parsed.maxPrice;
    }

    // Ensure minPrice <= maxPrice
    if (result.minPrice !== undefined && result.maxPrice !== undefined) {
      if (result.minPrice > result.maxPrice) {
        // Swap them
        [result.minPrice, result.maxPrice] = [result.maxPrice, result.minPrice];
      }
    }

    // Validate confidence
    if (typeof parsed.confidence === 'number' && parsed.confidence >= 0 && parsed.confidence <= 1) {
      result.confidence = parsed.confidence;
    }

    return result;
  }

  /**
   * Sanitize error messages to remove sensitive information
   */
  private sanitizeError(error: any): any {
    if (error && typeof error === 'object') {
      const sanitized = { ...error };
      // Remove any potential API key references
      if (sanitized.message) {
        sanitized.message = sanitized.message.replace(/AIza[0-9A-Za-z_-]{35}/g, '[REDACTED]');
      }
      return sanitized;
    }
    return error;
  }

  /**
   * Generate a cache key from a normalized query
   */
  private generateCacheKey(normalizedQuery: string): string {
    return crypto.createHash('md5').update(normalizedQuery).digest('hex');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size(),
      maxSize: 100
    };
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if NLP service is enabled and ready
   */
  isReady(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const nlpService = new NLPService();
