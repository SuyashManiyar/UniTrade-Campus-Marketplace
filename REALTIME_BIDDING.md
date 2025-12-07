# Real-Time Bidding Implementation

## Overview

The bidding system has been upgraded from polling-based updates (5-second intervals) to **near real-time updates** using Socket.IO. Users now receive instant notifications when bids are placed on auctions.

## What Changed

### Backend Changes

1. **Socket.IO Server Setup** (`backend/src/socket/socket.ts`)
   - Authenticated Socket.IO server with JWT token validation
   - Room-based architecture for listing-specific updates
   - Users join/leave listing rooms when viewing auction details

2. **Real-Time Event Emission** (`backend/src/routes/listings.ts`)
   - When a bid is placed, the server emits:
     - `bid-update` event to all users viewing that specific listing
     - `listing-update` event to all connected clients (for marketplace pages)

3. **Server Integration** (`backend/src/server.ts`)
   - HTTP server created to support Socket.IO
   - Socket.IO initialized before server starts

### Frontend Changes

1. **Socket.IO Client Utility** (`frontend/lib/socket.ts`)
   - Reusable Socket.IO client with authentication
   - Automatic token injection from cookies
   - Connection management and reconnection handling

2. **Listing Detail Page** (`frontend/app/marketplace/listings/[id]/page.tsx`)
   - **Removed**: 5-second polling interval
   - **Added**: Socket.IO listener for `bid-update` events
   - Real-time bid history updates
   - Toast notifications for new bids from other users
   - Automatic UI updates when bids are placed

3. **Marketplace Pages** (`frontend/app/marketplace/page.tsx` & `listings/page.tsx`)
   - Listen for `listing-update` events
   - Automatically update bid counts and current bid amounts
   - No page refresh needed to see latest bids

## How It Works

### User Flow

1. **User views an auction listing**
   - Frontend connects to Socket.IO server (if not already connected)
   - Joins the `listing:{listingId}` room
   - Receives real-time updates for that specific listing

2. **Another user places a bid**
   - Backend validates and creates the bid
   - Emits `bid-update` event to all users in that listing's room
   - Frontend receives the event and updates the UI instantly

3. **User navigates away**
   - Frontend leaves the listing room
   - Socket connection remains active for other pages

### Event Types

#### `bid-update`
Emitted to users viewing a specific listing when a bid is placed.

```typescript
{
  bid: {
    id: string;
    amount: number;
    createdAt: string;
    bidder: { id: string; name: string; }
  };
  listing: {
    id: string;
    currentBid: number;
    bidCount: number;
  };
  bids: Array<Bid>; // Full bid history
}
```

#### `listing-update`
Emitted to all connected clients when a listing's bid information changes.

```typescript
{
  listingId: string;
  listing: {
    id: string;
    currentBid: number;
    _count: { bids: number; }
  };
}
```

## Benefits

1. **Instant Updates**: No more waiting 5 seconds for bid updates
2. **Better UX**: Users see bids as they happen
3. **Reduced Server Load**: No constant polling requests
4. **Scalable**: Socket.IO handles many concurrent connections efficiently
5. **Notifications**: Users get notified when others place bids

## Technical Details

### Authentication
- Socket.IO uses JWT tokens from cookies for authentication
- Same authentication middleware as REST API
- Unauthenticated connections are rejected

### Connection Management
- Single Socket.IO connection per user session
- Automatic reconnection on disconnect
- Connection reused across page navigations

### Room Architecture
- Each listing has its own room: `listing:{listingId}`
- Users join when viewing, leave when navigating away
- Efficient: only relevant users receive updates

## Testing

To test the real-time functionality:

1. Open the same auction listing in two different browser windows/tabs
2. Place a bid in one window
3. Watch the other window update instantly without refresh

## Environment Variables

No new environment variables required. Socket.IO uses the same server port as the Express app.

For production, ensure:
- CORS is properly configured for your frontend domain
- WebSocket connections are allowed through your firewall/proxy

## Troubleshooting

### Socket not connecting
- Check browser console for connection errors
- Verify JWT token is present in cookies
- Check backend logs for authentication errors

### Updates not appearing
- Verify Socket.IO connection is established (check console logs)
- Ensure you've joined the listing room
- Check backend is emitting events (check server logs)

### Connection drops
- Socket.IO automatically reconnects
- Check network stability
- Verify server is running and accessible

