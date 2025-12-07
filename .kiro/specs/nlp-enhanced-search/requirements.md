# Requirements Document

## Introduction

This feature enhances the existing marketplace search functionality by adding Natural Language Processing (NLP) capabilities using the Gemini API. Users can enter natural language queries like "I want a powerbank in fair condition" and the system will automatically extract and apply the appropriate search filters (keywords, category, condition, price range) to retrieve relevant listings.

## Glossary

- **NLP Service**: The backend service that integrates with Gemini API to parse natural language queries
- **Search Query**: The natural language text input provided by the user
- **Extracted Filters**: Structured search parameters (category, condition, price range, keywords) derived from the natural language query
- **Gemini API**: Google's generative AI API used for natural language understanding
- **Marketplace System**: The existing UniTrade campus marketplace application

## Requirements

### Requirement 1

**User Story:** As a marketplace user, I want to search using natural language queries, so that I can find items without manually selecting filters

#### Acceptance Criteria

1. WHEN a user enters a natural language query in the search box THEN the Marketplace System SHALL send the query to the NLP Service for processing
2. WHEN the NLP Service receives a query THEN the NLP Service SHALL extract relevant search parameters including keywords, category, condition, and price range
3. WHEN search parameters are extracted THEN the Marketplace System SHALL apply these parameters to filter listings automatically
4. WHEN no valid filters can be extracted THEN the Marketplace System SHALL perform a standard keyword search using the original query
5. WHEN the search completes THEN the Marketplace System SHALL display the filtered results to the user

### Requirement 2

**User Story:** As a marketplace user, I want to see which filters were applied from my natural language query, so that I can understand and adjust the search results

#### Acceptance Criteria

1. WHEN filters are extracted from a natural language query THEN the Marketplace System SHALL display the applied filters in the UI
2. WHEN a user views applied filters THEN the Marketplace System SHALL allow the user to modify or remove individual filters
3. WHEN a user modifies an extracted filter THEN the Marketplace System SHALL update the search results accordingly
4. WHEN a user clears all filters THEN the Marketplace System SHALL reset to show all active listings

### Requirement 3

**User Story:** As a system administrator, I want the NLP service to handle API errors gracefully, so that search functionality remains available even when the Gemini API is unavailable

#### Acceptance Criteria

1. WHEN the Gemini API is unavailable THEN the NLP Service SHALL fall back to standard keyword search
2. WHEN the Gemini API returns an error THEN the NLP Service SHALL log the error and return a fallback response
3. WHEN API rate limits are exceeded THEN the NLP Service SHALL cache recent query results to reduce API calls
4. WHEN the NLP Service fails THEN the Marketplace System SHALL display an appropriate message to the user

### Requirement 4

**User Story:** As a developer, I want the NLP service to support all existing marketplace categories and conditions, so that users can search for any type of item

#### Acceptance Criteria

1. WHEN parsing a query THEN the NLP Service SHALL recognize all valid categories: ELECTRONICS, FURNITURE, TEXTBOOKS, BIKES, CLOTHING, OTHER
2. WHEN parsing a query THEN the NLP Service SHALL recognize all valid conditions: NEW, LIKE_NEW, GOOD, FAIR, POOR
3. WHEN parsing a query THEN the NLP Service SHALL extract price ranges in various formats (e.g., "under $50", "between $20 and $100", "around $30")
4. WHEN multiple filters are present in a query THEN the NLP Service SHALL extract all applicable filters
5. WHEN ambiguous terms are used THEN the NLP Service SHALL select the most likely interpretation based on context

### Requirement 5

**User Story:** As a marketplace user, I want fast search responses, so that I can quickly find items without waiting

#### Acceptance Criteria

1. WHEN a natural language query is submitted THEN the Marketplace System SHALL return results within 3 seconds under normal conditions
2. WHEN the NLP Service processes a query THEN the NLP Service SHALL complete parsing within 1 second
3. WHEN using cached results THEN the Marketplace System SHALL return results within 500 milliseconds
4. WHEN the system is under load THEN the Marketplace System SHALL maintain response times within acceptable limits

### Requirement 6

**User Story:** As a system administrator, I want to configure the Gemini API key securely, so that API credentials are protected

#### Acceptance Criteria

1. WHEN the backend starts THEN the NLP Service SHALL load the Gemini API key from environment variables
2. WHEN the API key is missing THEN the NLP Service SHALL log a warning and disable NLP features
3. WHEN the API key is invalid THEN the NLP Service SHALL detect this on first use and fall back to standard search
4. WHEN logging errors THEN the NLP Service SHALL never log the API key or sensitive information
