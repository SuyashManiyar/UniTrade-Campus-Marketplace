# UMass Marketplace - Listings API Contract

## Base URL
```
http://localhost:5000/api/listings
```

## 1. View All Listings (Browse with Filters)

### GET `/api/listings`

**Description**: Get all active listings with optional filtering and pagination

**Query Parameters**:
```typescript
{
  search?: string;        // Search in title and description
  category?: 'ELECTRONICS' | 'FURNITURE' | 'TEXTBOOKS' | 'BIKES' | 'CLOTHING' | 'OTHER';
  condition?: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
  type?: 'DIRECT_SALE' | 'AUCTION';
  minPrice?: number;      // Minimum price filter
  maxPrice?: number;      // Maximum price filter
  page?: number;          // Page number (default: 1)
  limit?: number;         // Items per page (default: 20)
}
```

**Example Request**:
```bash
GET /api/listings?category=ELECTRONICS&condition=GOOD&minPrice=50&maxPrice=500&page=1&limit=10
```

**Response**:
```typescript
{
  listings: [
    {
      id: string;
      title: string;
      description: string;
      category: string;
      condition: string;
      price: number;
      images: string | null;
      type: 'DIRECT_SALE' | 'AUCTION';
      status: 'ACTIVE';
      startingBid?: number;
      currentBid?: number;
      bidIncrement?: number;
      auctionEndTime?: string;
      createdAt: string;
      updatedAt: string;
      seller: {
        id: string;
        name: string;
        rating: number | null;
        ratingCount: number;
      };
      bids: [
        {
          id: string;
          amount: number;
          createdAt: string;
          bidder: {
            id: string;
            name: string;
          }
        }
      ];
    }
  ];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

## 2. Post New Item

### POST `/api/listings`

**Description**: Create a new listing (requires authentication)

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```typescript
{
  title: string;                    // Required
  description: string;              // Required
  category: 'ELECTRONICS' | 'FURNITURE' | 'TEXTBOOKS' | 'BIKES' | 'CLOTHING' | 'OTHER';
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
  price: number;                    // Required, positive number
  type?: 'DIRECT_SALE' | 'AUCTION'; // Default: 'DIRECT_SALE'
  
  // For auctions only:
  startingBid?: number;             // Required if type is 'AUCTION'
  bidIncrement?: number;            // Optional
  auctionEndTime?: string;          // Required if type is 'AUCTION' (ISO datetime)
}
```

**Example Request**:
```json
{
  "title": "MacBook Pro 13-inch",
  "description": "Excellent condition MacBook Pro, barely used. Perfect for students!",
  "category": "ELECTRONICS",
  "condition": "LIKE_NEW",
  "price": 800,
  "type": "DIRECT_SALE"
}
```

**Response**:
```typescript
{
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  images: string | null;
  type: string;
  status: 'ACTIVE';
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    name: string;
    rating: number | null;
    ratingCount: number;
  };
}
```

## 3. Get Single Listing Details

### GET `/api/listings/:id`

**Description**: Get detailed information about a specific listing

**Response**:
```typescript
{
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  images: string | null;
  type: string;
  status: string;
  startingBid?: number;
  currentBid?: number;
  bidIncrement?: number;
  auctionEndTime?: string;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    name: string;
    pronouns: string | null;
    major: string | null;
    location: string | null;
    rating: number | null;
    ratingCount: number;
    createdAt: string;
  };
  bids: [
    {
      id: string;
      amount: number;
      createdAt: string;
      bidder: {
        id: string;
        name: string;
      }
    }
  ];
}
```

## 4. Browse Filters Available

### Categories:
- `ELECTRONICS`
- `FURNITURE` 
- `TEXTBOOKS`
- `BIKES`
- `CLOTHING`
- `OTHER`

### Conditions:
- `NEW`
- `LIKE_NEW`
- `GOOD`
- `FAIR`
- `POOR`

### Listing Types:
- `DIRECT_SALE` - Fixed price items
- `AUCTION` - Bidding items

## 5. Additional Endpoints

### Place Bid (Auctions Only)
```
POST /api/listings/:id/bid
```

### Get My Listings
```
GET /api/listings/user/my-listings
```

### Update Listing
```
PUT /api/listings/:id
```

### Cancel Listing
```
DELETE /api/listings/:id
```

## Error Responses

All endpoints return errors in this format:
```typescript
{
  error: string;
}
```

**Common Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not your listing)
- `404` - Not Found
- `500` - Internal Server Error

## Frontend Integration Examples

### Fetch All Listings with Filters
```typescript
const fetchListings = async (filters: {
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, value.toString());
  });
  
  const response = await fetch(`/api/listings?${params}`);
  return response.json();
};
```

### Create New Listing
```typescript
const createListing = async (listingData: {
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  type?: string;
}) => {
  const response = await fetch('/api/listings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(listingData)
  });
  return response.json();
};
```