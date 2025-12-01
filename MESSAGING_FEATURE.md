# Real-Time Messaging Feature

## Overview

The UMass Marketplace now includes a real-time messaging system powered by Firebase Firestore. Users can communicate with sellers directly about listings.

## Features

✅ **Real-time messaging** - Messages appear instantly without page refresh
✅ **Conversation list** - View all your conversations in one place
✅ **Unread message counts** - See how many unread messages you have per conversation
✅ **Message read status** - Messages are automatically marked as read when viewed
✅ **Listing context** - Each conversation is tied to a specific listing
✅ **Responsive design** - Works seamlessly on mobile and desktop
✅ **User-friendly UI** - Clean, modern interface with smooth scrolling

## How to Use

### For Buyers

1. Browse listings at `/marketplace/listings`
2. Click on a listing to view details
3. Click the "💬 Message Seller" button
4. Type your message and click "Send"
5. View all your conversations at `/messages`

### For Sellers

1. When someone messages you about your listing, you'll see it in `/messages`
2. Click on the conversation to view and reply
3. Messages are organized by listing and user

## Technical Implementation

### Frontend Components

- **MessageList** (`components/MessageList.tsx`) - Displays messages in a conversation
- **MessageInput** (`components/MessageInput.tsx`) - Input field for sending messages
- **ConversationList** (`components/ConversationList.tsx`) - Lists all conversations

### Pages

- `/messages` - Main messages page showing all conversations
- `/messages/[listingId]/[otherUserId]` - Individual conversation view

### Firebase Integration

- **Real-time listeners** - Uses Firestore `onSnapshot` for live updates
- **Efficient queries** - Optimized queries with proper indexing
- **Automatic cleanup** - Unsubscribes from listeners when components unmount

### Data Structure

```typescript
Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  listingId: string
  senderName: string
  receiverName: string
  isRead: boolean
  createdAt: Timestamp
}
```

## Setup Required

1. **Install dependencies** (already done):
   ```bash
   npm install firebase jwt-decode
   ```

2. **Configure Firebase** - Follow `FIREBASE_SETUP.md` to:
   - Create a Firebase project
   - Enable Firestore
   - Get your Firebase credentials
   - Update `.env.local` with your credentials
   - Set up security rules
   - Create necessary indexes

3. **Start the app**:
   ```bash
   npm run dev
   ```

## Navigation

Messages can be accessed from:
- Main navigation bar: "💬 Messages" link
- Listing detail page: "💬 Message Seller" button
- Direct URL: `/messages`

## Security

- Users can only read messages where they are sender or receiver
- Messages are validated before being sent
- Firebase security rules enforce access control
- User authentication is required for all messaging operations

## Future Enhancements

Potential improvements:
- [ ] Push notifications for new messages
- [ ] Image/file attachments in messages
- [ ] Message search functionality
- [ ] Block/report users
- [ ] Message deletion
- [ ] Typing indicators
- [ ] Online/offline status
- [ ] Message reactions/emojis
- [ ] Voice messages
- [ ] Group conversations

## Troubleshooting

### Messages not appearing
- Check Firebase configuration in `.env.local`
- Verify Firestore is enabled in Firebase Console
- Check browser console for errors
- Ensure you're logged in

### "Missing or insufficient permissions" error
- Update Firestore security rules (see `FIREBASE_SETUP.md`)
- Verify user authentication token is valid

### Slow message delivery
- Check your internet connection
- Verify Firebase project location is optimal
- Check Firebase usage quotas

## Cost Considerations

Firebase Firestore free tier:
- 50K reads/day
- 20K writes/day
- 1GB storage

For a small marketplace with ~100 active users:
- Estimated reads: ~5K-10K/day
- Estimated writes: ~1K-2K/day
- Well within free tier limits

Monitor usage in Firebase Console to avoid unexpected charges.
