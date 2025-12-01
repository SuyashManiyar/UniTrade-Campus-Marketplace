# Firebase Firestore Setup for Messaging

This guide will help you set up Firebase Firestore for the real-time messaging system.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard (you can disable Google Analytics if not needed)

## Step 2: Create a Firestore Database

1. In your Firebase project, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (we'll secure it later)
4. Select a location closest to your users
5. Click "Enable"

## Step 3: Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register your app with a nickname (e.g., "UMass Marketplace")
6. Copy the Firebase configuration object

## Step 4: Update Environment Variables

Update `frontend/.env.local` with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 5: Set Up Firestore Security Rules

In Firebase Console, go to Firestore Database → Rules.

**For Development/Testing (Use this first):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**For Production (Use this later):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Messages collection
    match /messages/{messageId} {
      // Allow anyone to read messages (we filter client-side)
      allow read: if true;
      
      // Allow anyone to create messages
      allow create: if true;
      
      // Allow anyone to update messages (for read status)
      allow update: if true;
      
      // Prevent deletion
      allow delete: if false;
    }
  }
}
```

**Note:** The test mode rules expire after 30 days. Make sure to update them before then!

## Step 6: Create Firestore Indexes

Some queries require composite indexes. Firebase will prompt you to create them when needed, or you can create them manually:

1. Go to Firestore Database → Indexes
2. Click "Add Index"
3. Create the following indexes:

### Index 1: Messages by listing and users
- Collection: `messages`
- Fields:
  - `listingId` (Ascending)
  - `senderId` (Ascending)
  - `receiverId` (Ascending)
  - `createdAt` (Ascending)

### Index 2: Messages by user
- Collection: `messages`
- Fields:
  - `senderId` (Ascending)
  - `createdAt` (Descending)

### Index 3: Messages by receiver
- Collection: `messages`
- Fields:
  - `receiverId` (Ascending)
  - `createdAt` (Descending)

**Tip:** Firebase will automatically suggest creating indexes when you run queries that need them. Just click the link in the error message!

## Step 7: Test the Setup

1. Start your development servers:
   ```bash
   npm run dev
   ```

2. Navigate to `/messages` in your app
3. Try sending a message from one user to another
4. Check the Firestore console to see the messages being created in real-time

## Firestore Data Structure

Messages are stored with the following structure:

```javascript
{
  content: "Hello!",
  senderId: "user_id_1",
  receiverId: "user_id_2",
  listingId: "listing_id",
  senderName: "John Doe",
  receiverName: "Jane Smith",
  isRead: false,
  createdAt: Timestamp
}
```

## Features Implemented

✅ Real-time message delivery
✅ Conversation list with unread counts
✅ Message read status
✅ Automatic scrolling to latest message
✅ Responsive design (mobile & desktop)
✅ Integration with existing user authentication

## Troubleshooting

### Error: "Missing or insufficient permissions"
- Check your Firestore security rules
- Make sure you're authenticated
- Verify the user ID matches the sender/receiver ID

### Error: "The query requires an index"
- Click the link in the error message to create the index automatically
- Or manually create the index in Firebase Console

### Messages not appearing in real-time
- Check your Firebase configuration in `.env.local`
- Verify Firestore is enabled in Firebase Console
- Check browser console for errors

## Production Considerations

Before deploying to production:

1. **Secure Firestore Rules**: Update security rules to properly authenticate users
2. **Add Rate Limiting**: Prevent spam by limiting message frequency
3. **Add Message Validation**: Validate message content length and format
4. **Enable Offline Persistence**: Add offline support for better UX
5. **Monitor Usage**: Set up Firebase usage alerts to avoid unexpected costs
6. **Backup Strategy**: Set up regular Firestore backups

## Cost Optimization

Firebase Firestore free tier includes:
- 50K document reads/day
- 20K document writes/day
- 20K document deletes/day
- 1GB storage

For a small to medium marketplace, this should be sufficient. Monitor your usage in Firebase Console.
