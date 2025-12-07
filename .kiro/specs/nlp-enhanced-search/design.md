# Design Document

## Overview

The NLP-Enhanced Search feature adds natural language processing capabilities to the UniTrade marketplace search functionality. Users can enter queries like "I want a powerbank in fair condition" and the system will automatically extract search parameters (keywords, category, condition, price range) using the Gemini API, then apply these filters to retrieve relevant listings.

The solution consists of:
1. A backend NLP service that integrates with Gemini API
2. Enhanced search endpoint that processes natural language queries
3. Frontend UI updates to display extracted filters
4. Caching layer for performance optimization
5. Graceful fallback to standard search when NLP is unavailable

## Architecture

### High-Level Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Frontend  │────────▶│  Backend API     │────────▶│  Gemini API │
│   (React)   │         │  (Express)       │         │             │
└─────────────┘         └──────────────────┘         └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Database   │
                        │   (SQLite)   │
                        └──────────────┘
```

### Component Flow

1. User enters natural language query in search box
2. Frontend sends query to `/api/listings/nlp-search` endpoint
3. Backend NLP service calls Gemini API to parse query
4. Gemini returns structured filter parameters
5. Backend applies filters to database query
6. Results returned to frontend with extracted filters
7. Frontend displays results and shows applied filters

## Components and Interfaces

### 1. NLP Service (`backend/src/services/nlpService.ts`)

**Purpose**: Integrate with Gemini API to parse natural language queries into structured filters

**Interface**:
```typescript
interface ParsedQuery {
  keywords: string[];
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  confidence: number;
}

class NLPService {
  async parseQuery(query: string): Promise<ParsedQuery>
  private buildPrompt(query: string): string
  private validateFilters(parsed: any): ParsedQuery
}
```

**Key Methods**:
- `parseQuery()`: Main method that sends query to Gemini and returns parsed filters
- `buildPrompt()`: Constructs the prompt for Gemini with schema and examples
- `validateFilters()`: Validates and normalizes the response from Gemini

### 2. Enhanced Listings Route (`backend/src/routes/listings.ts`)

**New Endpoint**: `GET /api/listings/nlp-search`

**Request Parameters**:
```typescript
{
  query: string;  // Natural language query
  page?: number;
  limit?: number;
}
```

**Response**:
```typescript
{
  listings: Listing[];
  extractedFilters: {
    keywords: string[];
    category?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
  };
  pagination: PaginationInfo;
  fallbackUsed: boolean;  // True if NLP failed and standard search was used
}
```

### 3. Frontend Search Component Updates

**Enhanced State**:
```typescript
const [naturalQuery, setNaturalQuery] = useState('')
const [extractedFilters, setExtractedFilters] = useState<ExtractedFilters | null>(null)
const [isNLPSearch, setIsNLPSearch] = useState(false)
```

**New UI Elements**:
- Natural language search input with "Smart Search" indicator
- Extracted filters display showing what was understood from the query
- Toggle between NLP search and manual filter selection
- Clear/modify individual extracted filters

## Data Models

### ParsedQuery Model

```typescript
interface ParsedQuery {
  keywords: string[];        // Extracted search keywords
  category?: string;         // One of: ELECTRONICS, FURNITURE, TEXTBOOKS, BIKES, CLOTHING, OTHER
  condition?: string;        // One of: NEW, LIKE_NEW, GOOD, FAIR, POOR
  minPrice?: number;         // Minimum price extracted from query
  maxPrice?: number;         // Maximum price extracted from query
  confidence: number;        // Confidence score (0-1) from Gemini
}
```

### Gemini API Request Format

```typescript
{
  contents: [{
    parts: [{
      text: string  // Prompt with query and schema
    }]
  }],
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json"
  }
}
```

### Gemini Prompt Schema

The prompt will instruct Gemini to return JSON in this format:
```json
{
  "keywords": ["powerbank"],
  "category": "ELECTRONICS",
  "condition": "FAIR",
  "minPrice": null,
  "maxPrice": null,
  "confidence": 0.95
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Query routing to NLP service
*For any* natural language query string, when submitted through the search interface, the query should be sent to the NLP service endpoint
**Validates: Requirements 1.1**

### Property 2: Filter extraction completeness
*For any* natural language query containing valid category, condition, or price information, the NLP service should extract all present and valid filters
**Validates: Requirements 1.2, 4.4**

### Property 3: Extracted filters are applied
*For any* set of extracted filters, the database query should include all extracted filter parameters in the where clause
**Validates: Requirements 1.3**

### Property 4: Fallback to keyword search
*For any* query where no valid filters can be extracted, the system should perform a standard keyword search using the original query text
**Validates: Requirements 1.4**

### Property 5: Filter modification updates results
*For any* search with extracted filters, modifying any filter value should trigger a new search with the updated filters
**Validates: Requirements 2.3**

### Property 6: API failure fallback
*For any* query when the Gemini API is unavailable or returns an error, the NLP service should fall back to standard keyword search without throwing an error
**Validates: Requirements 3.1, 3.2**

### Property 7: Query result caching
*For any* identical query submitted multiple times within the cache window, the second and subsequent requests should use cached results
**Validates: Requirements 3.3**

### Property 8: Category recognition
*For any* query containing a valid category name (ELECTRONICS, FURNITURE, TEXTBOOKS, BIKES, CLOTHING, OTHER), the NLP service should correctly extract that category
**Validates: Requirements 4.1**

### Property 9: Condition recognition
*For any* query containing a valid condition term (NEW, LIKE_NEW, GOOD, FAIR, POOR), the NLP service should correctly extract that condition
**Validates: Requirements 4.2**

### Property 10: Price range extraction
*For any* query containing price information in common formats ("under $X", "between $X and $Y", "around $X"), the NLP service should extract the appropriate min/max price values
**Validates: Requirements 4.3**

### Property 11: Sensitive data not logged
*For any* error or log message generated by the NLP service, the log output should not contain the API key or other sensitive credentials
**Validates: Requirements 6.4**

## Error Handling

### Gemini API Errors

1. **Network Errors**: Catch connection failures and fall back to standard search
2. **Rate Limiting**: Implement exponential backoff and use cached results
3. **Invalid Responses**: Validate JSON structure and fall back if malformed
4. **Authentication Errors**: Log warning and disable NLP features for the session

### Validation Errors

1. **Invalid Categories**: Ignore unrecognized categories, use other filters
2. **Invalid Conditions**: Ignore unrecognized conditions, use other filters
3. **Invalid Price Ranges**: Ignore malformed prices (e.g., min > max)
4. **Empty Queries**: Return all active listings

### Fallback Strategy

```typescript
try {
  // Attempt NLP parsing
  const parsed = await nlpService.parseQuery(query);
  return await searchWithFilters(parsed);
} catch (error) {
  // Log error
  logger.error('NLP parsing failed', { error, query });
  // Fall back to standard search
  return await standardKeywordSearch(query);
}
```

## Testing Strategy

### Unit Tests

1. **NLP Service Tests**:
   - Test prompt construction with various queries
   - Test response parsing and validation
   - Test error handling for API failures
   - Test caching mechanism

2. **Route Handler Tests**:
   - Test endpoint with valid natural language queries
   - Test fallback behavior when NLP fails
   - Test filter application to database queries
   - Test response format

3. **Frontend Component Tests**:
   - Test natural language input handling
   - Test extracted filter display
   - Test filter modification
   - Test clear filters functionality

### Property-Based Tests

Property-based tests will use a testing library (e.g., fast-check for TypeScript) to generate random inputs and verify properties hold across all inputs.

1. **Property Test 1: Query routing** (Property 1)
   - Generate random query strings
   - Verify all queries are sent to NLP service

2. **Property Test 2: Filter extraction** (Property 2)
   - Generate queries with known filters
   - Verify all valid filters are extracted

3. **Property Test 3: Filter application** (Property 3)
   - Generate random filter combinations
   - Verify filters are applied to database query

4. **Property Test 4: Fallback behavior** (Property 4)
   - Generate queries with no extractable filters
   - Verify standard search is used

5. **Property Test 5: Filter modification** (Property 5)
   - Generate initial filters and modifications
   - Verify search is triggered with updated filters

6. **Property Test 6: API failure handling** (Property 6)
   - Simulate API failures
   - Verify fallback occurs without errors

7. **Property Test 7: Caching** (Property 7)
   - Generate repeated queries
   - Verify cache is used for duplicates

8. **Property Test 8: Category extraction** (Property 8)
   - Generate queries for each category
   - Verify correct category extraction

9. **Property Test 9: Condition extraction** (Property 9)
   - Generate queries for each condition
   - Verify correct condition extraction

10. **Property Test 10: Price extraction** (Property 10)
    - Generate queries with various price formats
    - Verify correct price range extraction

11. **Property Test 11: Sensitive data logging** (Property 11)
    - Generate various error scenarios
    - Verify logs don't contain API keys

### Integration Tests

1. End-to-end test: Natural language query → Gemini API → Database → Results
2. Test with real Gemini API (in staging environment)
3. Test fallback path when API is disabled
4. Test caching behavior across multiple requests

## Implementation Notes

### Gemini API Integration

- Use `@google/generative-ai` npm package
- Model: `gemini-1.5-flash` (fast and cost-effective)
- Temperature: 0.1 (low for consistent parsing)
- Response format: JSON mode for structured output

### Caching Strategy

- Use in-memory cache with LRU eviction
- Cache key: hash of normalized query string
- TTL: 5 minutes
- Max cache size: 100 entries

### Security Considerations

1. API key stored in environment variable `GEMINI_API_KEY`
2. Never log API key or full API responses
3. Sanitize user queries before sending to Gemini
4. Rate limit NLP endpoint to prevent abuse
5. Validate all extracted filters before database query

### Performance Optimizations

1. Parallel execution: Call Gemini API while preparing database connection
2. Connection pooling for database queries
3. Index optimization on category, condition, and price fields
4. Lazy loading of listing images
5. Pagination to limit result set size
