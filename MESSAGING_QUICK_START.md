# Messaging Quick Start Guide

Get your real-time messaging system up and running in 5 minutes!

## Step 1: Set Up Firebase (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Click "Firestore Database" → "Create database"
4. Choose "Start in **test mode**" (for development)
5. Select your region and click "Enable"

## Step 2: Get Firebase Credentials

1. In Firebase Console, click ⚙️ → "Project settings"
2. Scroll to "Your apps" → Click web icon `</>`
3. Register app with nickname "UMass Marketplace"
4. Copy the config values

## Step 3: Update Environment Variables

Edit `frontend/.env.local` and replace the Firebase placeholders:

```env
NEXT_PUBLIC_API_URL=http://localhost:8081/api

# Replace these with your actual Firebase values
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

## Step 4: Start Your App

```bash
# Kill the Java process on port 8080 (if needed)
kill 47222

# Start both frontend and backend
npm run dev
```

## Step 5: Test It Out!

1. Open http://localhost:3000
2. Login with two different accounts (use two browsers or incognito)
3. User 1: Create a listing
4. User 2: View the listing and click "💬 Message Seller"
5. Send a message!
6. Watch it appear in real-time on User 1's messages page

## That's It! 🎉

Your messaging system is now live with:
- ✅ Real-time message delivery
- ✅ Conversation management
- ✅ Unread message counts
- ✅ Read receipts

## Quick Links

- **Messages Page**: http://localhost:3000/messages
- **Firebase Console**: https://console.firebase.google.com/
- **Full Setup Guide**: See `FIREBASE_SETUP.md`
- **Feature Documentation**: See `MESSAGING_FEATURE.md`

## Common Issues

**"Firebase not configured"**
→ Make sure you updated `.env.local` with your actual Firebase credentials

**"Missing or insufficient permissions"**
→ Your Firestore is in test mode, which allows all reads/writes for 30 days

**Messages not appearing**
→ Check browser console for errors, verify Firebase config

**Port 8080 already in use**
→ Kill the Java process: `lsof -i :8080` then `kill <PID>`

## Next Steps

- Set up proper Firestore security rules (see `FIREBASE_SETUP.md`)
- Create Firestore indexes when prompted
- Customize the UI to match your brand
- Add push notifications (optional)

Need help? Check the full documentation in `FIREBASE_SETUP.md` and `MESSAGING_FEATURE.md`.
