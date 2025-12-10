# Notification Service Documentation

## Overview

The notification service provides real-time alerts to users about important events in the marketplace, such as auction updates, listing status changes, and bidding activity. The system uses a polling-based approach with a 30-second interval to fetch new notifications.

## Architecture

### Database Schema

The notification system uses a dedicated `Notification` model in Prisma:

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  message   String
  type      String   // 'LISTING_SOLD', 'LISTING_CANCELLED', 'BID_OUTBID', etc.
  listingId String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@map("notifications")
}
```

### Components

1. **Backend API** (`backend/src/routes/notifications.ts`)
2. **Frontend Component** (`frontend/components/NotificationBell.tsx`)
3. **Database Model** (Prisma schema)

## Backend API

### Endpoints

#### 1. Get Notifications
```
GET /api/notifications
```

**Authentication:** Required

**Query Parameters:**
- `unreadOnly` (optional): Set to `'true'` to fetch only unread notifications

**Response:**
```json
{
  "notifications": [
    {
      "id": "clxxx...",
      "userId": "clxxx...",
      "title": "🔔 You've Been Outbid!",
      "message": "Someone placed a higher bid...",
      "type": "BID_OUTBID",
      "listingId": "clxxx...",
      "isRead": false,
      "createdAt": "2025-12-08T10:30:00.000Z"
    }
  ],
  "unreadCount": 3
}
```

**Features:**
- Returns up to 50 most recent notifications
- Ordered by creation date (newest first)
- Includes unread count for badge display

#### 2. Mark Notification as Read
```
PUT /api/notifications/:id/read
```

**Authentication:** Required

**Response:**
```json
{
  "message": "Notification marked as read"
}
```

**Security:**
- Verifies notification exists
- Ensures user owns the notification before updating

#### 3. Mark All Notifications as Read
```
PUT /api/notifications/mark-all-read
```

**Authentication:** Required

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

**Behavior:**
- Updates all unread notifications for the authenticated user
- Efficient bulk update operation

#### 4. Delete Notification
```
DELETE /api/notifications/:id
```

**Authentication:** Required

**Response:**
```json
{
  "message": "Notification deleted"
}
```

**Security:**
- Verifies notification exists
- Ensures user owns the notification before deletion

## Notification Types

### 1. BID_OUTBID
**Trigger:** When a user's bid is surpassed by a higher bid

**Created in:** `backend/src/routes/listings.ts` (Place Bid endpoint)

**Example:**
```typescript
await prisma.notification.create({
  data: {
    userId: previousHighestBidderId,
    title: '🔔 You\'ve Been Outbid!',
    message: `Someone placed a higher bid of ${amount} on "${listing.title}". Your previous bid was ${previousHighestBid?.amount}.`,
    type: 'BID_OUTBID',
    listingId: id
  }
});
```

**Recipients:** Previous highest bidder (excluding the new bidder)

### 2. LISTING_SOLD
**Trigger:** When a seller marks a listing as sold

**Created in:** `backend/src/routes/listings.ts` (Update Listing Status endpoint)

**Example:**
```typescript
await prisma.notification.create({
  data: {
    userId: bidderId,
    title: '✅ Listing Sold',
    message: `The listing "${listing.title}" you bid on has been sold.`,
    type: 'LISTING_SOLD',
    listingId: id
  }
});
```

**Recipients:** All unique bidders on the listing

### 3. LISTING_CANCELLED
**Trigger:** When a seller cancels/deletes a listing

**Created in:** `backend/src/routes/listings.ts` (Update Listing Status & Delete Listing endpoints)

**Example:**
```typescript
await prisma.notification.create({
  data: {
    userId: bidderId,
    title: '❌ Listing Cancelled',
    message: `The listing "${listing.title}" you bid on has been cancelled by the seller.`,
    type: 'LISTING_CANCELLED',
    listingId: id
  }
});
```

**Recipients:** All unique bidders on the listing

## Frontend Implementation

### NotificationBell Component

**Location:** `frontend/components/NotificationBell.tsx`

**Key Features:**

1. **Polling Mechanism**
   - Fetches notifications every 30 seconds
   - Initial fetch on component mount
   - Automatic cleanup on unmount

2. **Unread Badge**
   - Displays count of unread notifications
   - Shows "9+" for counts greater than 9
   - Red badge for visibility

3. **Dropdown Interface**
   - Click bell icon to toggle dropdown
   - Displays up to 50 notifications
   - Scrollable list with max height of 600px
   - Click outside to close

4. **Notification Actions**
   - Click notification to mark as read and navigate to listing
   - Delete individual notifications
   - Mark all as read (bulk action)

5. **Visual Indicators**
   - Blue dot for unread notifications
   - Blue background highlight for unread items
   - Type-specific emoji icons
   - Relative time display (e.g., "5m ago", "2h ago")

### Notification Icons

```typescript
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'LISTING_SOLD':
      return '✅'
    case 'LISTING_CANCELLED':
      return '❌'
    case 'BID_OUTBID':
      return '⚡'
    default:
      return '📢'
  }
}
```

### Time Formatting

The component includes a smart time formatter:
- Less than 60 seconds: "Just now"
- Less than 1 hour: "Xm ago"
- Less than 24 hours: "Xh ago"
- Less than 7 days: "Xd ago"
- Older: Full date (e.g., "12/8/2025")

## User Flow

### Receiving a Notification

1. **Event Occurs** (e.g., user gets outbid)
2. **Backend Creates Notification** in database
3. **Frontend Polls** every 30 seconds
4. **Badge Updates** with new unread count
5. **User Clicks Bell** to view notifications
6. **Dropdown Opens** showing all notifications
7. **User Clicks Notification** to view details
8. **Notification Marked as Read** automatically
9. **User Redirected** to relevant listing page

### Managing Notifications

1. **View All:** Click bell icon
2. **Read One:** Click on notification
3. **Read All:** Click "Mark all read" button
4. **Delete One:** Click "Delete" button on notification
5. **Close:** Click "Close" button or outside dropdown

## Security Considerations

1. **Authentication Required:** All endpoints require valid JWT token
2. **Authorization Checks:** Users can only access their own notifications
3. **Ownership Verification:** Before update/delete operations
4. **Rate Limiting:** Polling interval prevents excessive requests
5. **Data Validation:** Input validation on all endpoints

## Performance Optimizations

1. **Pagination:** Limited to 50 most recent notifications
2. **Indexed Queries:** Database queries use indexed fields (userId, isRead)
3. **Efficient Updates:** Bulk update for "mark all as read"
4. **Client-Side Caching:** Notifications stored in component state
5. **Conditional Rendering:** Only renders dropdown when open

## Future Enhancements

Potential improvements to consider:

1. **WebSocket Integration:** Real-time push notifications instead of polling
2. **Push Notifications:** Browser/mobile push notifications
3. **Email Notifications:** Optional email alerts for important events
4. **Notification Preferences:** User settings to control notification types
5. **Notification History:** Archive and search old notifications
6. **Rich Notifications:** Include images, action buttons
7. **Sound Alerts:** Optional audio notification for new alerts
8. **Desktop Notifications:** System-level notifications using Web Notifications API

## Troubleshooting

### Notifications Not Appearing

1. Check user authentication status
2. Verify backend server is running
3. Check browser console for API errors
4. Verify database connection
5. Check notification creation logic in listings routes

### Unread Count Incorrect

1. Verify database query in GET endpoint
2. Check frontend state management
3. Ensure mark-as-read operations complete successfully
4. Check for race conditions in polling

### Performance Issues

1. Reduce polling interval if needed
2. Implement pagination for large notification lists
3. Add database indexes on frequently queried fields
4. Consider implementing WebSocket for real-time updates

## Code Examples

### Creating a Custom Notification

```typescript
// In any backend route
await prisma.notification.create({
  data: {
    userId: targetUserId,
    title: 'Custom Title',
    message: 'Custom message content',
    type: 'CUSTOM_TYPE',
    listingId: optionalListingId // optional
  }
});
```

### Fetching Notifications in Frontend

```typescript
const fetchNotifications = async () => {
  try {
    const response = await api.get('/notifications')
    setNotifications(response.data.notifications)
    setUnreadCount(response.data.unreadCount)
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
  }
}
```

## API Integration

The notification service integrates with:

1. **Listings Service:** Creates notifications for auction events
2. **Authentication Service:** Validates user access
3. **User Service:** Links notifications to users
4. **Frontend API Client:** Uses centralized API wrapper

## Testing

To test the notification service:

1. **Create Test Notifications:**
   - Place bids on auction listings
   - Cancel listings with active bids
   - Mark listings as sold

2. **Verify Delivery:**
   - Check notification bell badge
   - Open dropdown to view notifications
   - Verify correct recipients receive notifications

3. **Test Actions:**
   - Mark individual notifications as read
   - Mark all as read
   - Delete notifications
   - Navigate to listings from notifications

## Conclusion

The notification service provides a robust, user-friendly way to keep users informed about important marketplace events. The polling-based approach ensures reliability while the clean UI makes notifications easy to manage. Future enhancements like WebSocket integration could further improve the real-time experience.
