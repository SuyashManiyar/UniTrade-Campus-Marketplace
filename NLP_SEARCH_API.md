# NLP-Enhanced Search API Documentation

## Overview

The NLP-Enhanced Search feature allows users to search for marketplace listings using natural language queries. The system uses Google's Gemini API to parse queries and extract structured filters.

## Endpoint

### POST /api/listings/nlp-search

Search for listings using natural language queries.

**Request Body:**
```json
{
  "query": "I want a laptop in good condition under $500",
  "page": 1,
  "limit": 20
}
```

**Parameters:**
- `query` (string, required): Natural language search query
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Number of results per page (default: 20, max: 50)

**Response:**
```json
{
  "listings": [
    {
      "id": "...",
      "title": "Dell XPS 15 Laptop",
      "description": "...",
      "category": "ELECTRONICS",
      "condition": "GOOD",
      "price": 450,
      "seller": {...},
      ...
    }
  ],
  "extractedFilters": {
    "keywords": ["laptop"],
    "category": "ELECTRONICS",
    "condition": "GOOD",
    "minPrice": null,
    "maxPrice": 500,
    "confidence": 0.95
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "fallbackUsed": false
}
```

**Response Fields:**
- `listings`: Array of matching listings
- `extractedFilters`: Filters extracted from the natural language query
  - `keywords`: Search keywords extracted from query
  - `category`: Product category (ELECTRONICS, FURNITURE, TEXTBOOKS, BIKES, CLOTHING, OTHER)
  - `condition`: Item condition (NEW, LIKE_NEW, GOOD, FAIR, POOR)
  - `minPrice`: Minimum price filter
  - `maxPrice`: Maximum price filter
  - `confidence`: AI confidence score (0-1)
- `pagination`: Pagination information
- `fallbackUsed`: True if NLP parsing failed and standard search was used

## Example Queries

### Basic Search
```
"laptop"
"powerbank"
"textbooks"
```

### Category Search
```
"I want electronics"
"looking for furniture"
"need textbooks"
```

### Condition Search
```
"laptop in good condition"
"new phone"
"like new bike"
```

### Price Search
```
"laptop under $500"
"bike between $100 and $300"
"items around $50"
"powerbank over $20"
```

### Complex Search
```
"I want a laptop in good condition under $500"
"looking for textbooks in like new condition"
"need a bike in fair condition between $100 and $200"
```

## Error Handling

### 400 Bad Request
```json
{
  "error": "Query parameter is required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to process search query",
  "message": "..."
}
```

## Fallback Behavior

When the Gemini API is unavailable or returns an error:
1. The system automatically falls back to standard keyword search
2. `fallbackUsed` will be `true` in the response
3. `confidence` will be `0`
4. The original query is used as keywords

## Rate Limiting

The Gemini API has rate limits:
- Free tier: 60 requests per minute, 1,500 per day
- Queries are cached for 5 minutes to reduce API calls
- Identical queries within the cache window use cached results

## Frontend Integration

### Using the NLP Search

```typescript
import { api } from '@/lib/api'

const response = await api.post('/listings/nlp-search', {
  query: 'I want a laptop in good condition'
})

const { listings, extractedFilters, fallbackUsed } = response.data

// Display extracted filters
if (extractedFilters.category) {
  console.log('Category:', extractedFilters.category)
}
if (extractedFilters.condition) {
  console.log('Condition:', extractedFilters.condition)
}

// Show fallback notification
if (fallbackUsed) {
  toast('Using standard search (NLP unavailable)')
}
```

### Toggle Between NLP and Manual Search

The frontend provides a toggle button to switch between:
- **Smart Search (NLP)**: Natural language input
- **Manual Search**: Traditional filters (category, condition, price)

## Performance

- **With cache hit**: ~0.05ms response time
- **With API call**: ~1-2s response time
- **Fallback**: Same as standard search

## Security

- API keys are never logged or exposed in error messages
- All API keys in logs are automatically redacted as `[REDACTED]`
- User queries are sanitized before processing

## Testing

Run the NLP search tests:
```bash
cd backend
npm test -- nlpService.test.ts
npm test -- nlp-search.test.ts
```

## Troubleshooting

### NLP Not Working
1. Check that `GEMINI_API_KEY` is set in `.env`
2. Verify the API is enabled in Google Cloud Console
3. Check server logs for error messages
4. System will automatically fall back to standard search

### Low Confidence Scores
- Confidence < 0.5: Query may be ambiguous
- Confidence = 0: Fallback was used (API unavailable)
- Confidence > 0.8: High confidence in extracted filters

### No Results Found
- Check that extracted filters match available listings
- Try broader queries
- Use manual search to verify listings exist
