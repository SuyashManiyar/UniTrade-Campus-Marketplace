# UMass Marketplace - User Access Control System

## Overview
Your marketplace uses a **multi-layered security system** to ensure only verified UMass community members can access and use the platform.

## 1. UMass Email Verification System

### Email Restriction
- **Only @umass.edu emails allowed**
- Enforced by `requireUMassEmail` middleware
- Validates email format: `email.endsWith('@umass.edu')`

### Registration Flow
```
1. User enters @umass.edu email + profile info
2. System generates 6-digit verification code
3. Code sent to user's UMass email
4. User enters code to complete registration
5. Account created with isVerified: true
```

### Login Flow
```
1. User enters @umass.edu email
2. System checks if account exists
3. Generates new 6-digit verification code
4. Code sent to user's email
5. User enters code to get JWT token
```

## 2. JWT Token Authentication

### Token Generation
```typescript
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

### Token Usage
- **Header**: `Authorization: Bearer <token>`
- **Expires**: 7 days
- **Contains**: User ID for database lookups

### Token Validation Process
```typescript
// 1. Extract token from Authorization header
const token = authHeader && authHeader.split(' ')[1];

// 2. Verify JWT signature
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// 3. Lookup user in database
const user = await prisma.user.findUnique({
  where: { id: decoded.userId }
});

// 4. Check if user exists and is verified
if (!user || !user.isVerified) {
  return 401 Unauthorized;
}
```

## 3. Access Control Levels

### Public Endpoints (No Auth Required)
```typescript
GET /api/listings          // Browse all listings
GET /api/listings/:id      // View single listing
GET /health               // Health check
POST /api/auth/register   // Start registration
POST /api/auth/login      // Start login
POST /api/auth/verify     // Complete auth
```

### Protected Endpoints (Auth Required)
```typescript
POST /api/listings        // Create listing
PUT /api/listings/:id     // Update listing
DELETE /api/listings/:id  // Cancel listing
POST /api/listings/:id/bid // Place bid
GET /api/listings/user/my-listings // My listings
```

### Ownership-Based Access
```typescript
// Users can only modify their own listings
if (existingListing.sellerId !== userId) {
  return res.status(403).json({ 
    error: 'Not authorized to update this listing' 
  });
}
```

## 4. Role-Based Access Control

### User Roles (from Prisma schema)
```typescript
enum UserRole {
  STUDENT   // Regular UMass students
  STAFF     // UMass staff members  
  ADMIN     // Platform administrators
}
```

### Current Implementation
- All authenticated users have same permissions
- Role field exists for future admin features
- Can be extended for moderation capabilities

## 5. Security Middleware Stack

### Request Flow
```
1. CORS Policy (frontend URL whitelist)
2. Helmet (security headers)
3. Rate Limiting (future implementation)
4. UMass Email Check (auth endpoints)
5. JWT Authentication (protected endpoints)
6. Ownership Validation (user-specific actions)
```

### Middleware Functions
```typescript
// 1. UMass Email Validation
requireUMassEmail(req, res, next)

// 2. JWT Authentication  
authenticateToken(req, res, next)

// 3. User Verification Check
if (!user.isVerified) {
  return 401 Unauthorized;
}
```

## 6. Frontend Integration

### Storing Authentication
```typescript
// Store JWT token
localStorage.setItem('token', response.token);

// Include in API requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
};
```

### Protected Route Example
```typescript
const createListing = async (listingData) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Please log in first');
  }
  
  const response = await fetch('/api/listings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(listingData)
  });
  
  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  
  return response.json();
};
```

## 7. Security Features

### Email Verification
- **6-digit codes** (secure and user-friendly)
- **10-minute expiration** (prevents code reuse)
- **UMass email only** (community restriction)

### JWT Security
- **Signed tokens** (tamper-proof)
- **7-day expiration** (automatic logout)
- **Server-side validation** (database lookup)

### Data Protection
- **User ownership checks** (can't modify others' listings)
- **Email verification required** (no unverified access)
- **CORS protection** (frontend URL whitelist)

## 8. Error Handling

### Authentication Errors
```typescript
401 Unauthorized: "Access token required"
401 Unauthorized: "Invalid token" 
401 Unauthorized: "Email not verified"
403 Forbidden: "Invalid token"
403 Forbidden: "Not authorized to update this listing"
```

### Email Validation Errors
```typescript
400 Bad Request: "UMass email required"
400 Bad Request: "User already exists"
400 Bad Request: "Verification code expired"
400 Bad Request: "Invalid verification code"
```

## 9. Development Tools

### Get Verification Codes (Dev Only)
```
GET /api/auth/dev/codes
```
Returns all active verification codes for testing.

### Test Database Connection
```
GET /api/db-test
```
Verifies database connectivity and shows table counts.

## 10. Future Enhancements

### Potential Additions
- **Rate limiting** (prevent spam)
- **Admin dashboard** (user management)
- **Email notifications** (bid updates, messages)
- **Two-factor authentication** (extra security)
- **Session management** (multiple device support)

This system ensures that only verified UMass community members can participate in your marketplace while maintaining security and user experience.