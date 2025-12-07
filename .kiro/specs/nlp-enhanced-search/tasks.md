# Implementation Plan

- [x] 1. Set up Gemini API integration and NLP service
  - Install @google/generative-ai package
  - Create NLP service module with Gemini API client
  - Implement query parsing with structured JSON output
  - Add environment variable for GEMINI_API_KEY
  - _Requirements: 1.2, 4.1, 4.2, 4.3, 6.1_

- [x] 1.1 Write property test for category extraction
  - **Property 8: Category recognition**
  - **Validates: Requirements 4.1**

- [x] 1.2 Write property test for condition extraction
  - **Property 9: Condition recognition**
  - **Validates: Requirements 4.2**

- [x] 1.3 Write property test for price extraction
  - **Property 10: Price range extraction**
  - **Validates: Requirements 4.3**

- [x] 2. Implement caching layer for NLP queries
  - Create in-memory cache with LRU eviction
  - Implement cache key generation from normalized queries
  - Add TTL and size limits
  - _Requirements: 3.3, 5.3_

- [x] 2.1 Write property test for query caching
  - **Property 7: Query result caching**
  - **Validates: Requirements 3.3**

- [x] 3. Create NLP search endpoint in backend
  - Add POST /api/listings/nlp-search route
  - Integrate NLP service to parse queries
  - Apply extracted filters to database query
  - Return results with extracted filters metadata
  - _Requirements: 1.1, 1.3_

- [x] 3.1 Write property test for filter extraction completeness
  - **Property 2: Filter extraction completeness**
  - **Validates: Requirements 1.2, 4.4**

- [x] 3.2 Write property test for filter application
  - **Property 3: Extracted filters are applied**
  - **Validates: Requirements 1.3**

- [x] 4. Implement error handling and fallback logic
  - Add try-catch blocks for Gemini API calls
  - Implement fallback to standard keyword search
  - Add error logging without sensitive data
  - Handle missing/invalid API key gracefully
  - _Requirements: 3.1, 3.2, 6.2, 6.3_

- [x] 4.1 Write property test for API failure fallback
  - **Property 6: API failure fallback**
  - **Validates: Requirements 3.1, 3.2**

- [x] 4.2 Write property test for fallback to keyword search
  - **Property 4: Fallback to keyword search**
  - **Validates: Requirements 1.4**

- [x] 4.3 Write property test for sensitive data logging
  - **Property 11: Sensitive data not logged**
  - **Validates: Requirements 6.4**

- [x] 5. Update frontend search UI for natural language queries
  - Add natural language search input field
  - Display "Smart Search" indicator
  - Show extracted filters in UI
  - Allow users to modify extracted filters
  - Add toggle between NLP and manual search
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 5.1 Write property test for query routing
  - **Property 1: Query routing to NLP service**
  - **Validates: Requirements 1.1**

- [x] 5.2 Write property test for filter modification
  - **Property 5: Filter modification updates results**
  - **Validates: Requirements 2.3**

- [x] 6. Add configuration and documentation
  - Update .env.example with GEMINI_API_KEY
  - Add setup instructions for Gemini API
  - Document NLP query format examples
  - Add API endpoint documentation
  - _Requirements: 6.1_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
