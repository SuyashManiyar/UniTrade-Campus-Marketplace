# Real-Time Messaging System - Complete Guide

## 🚀 Quick Start (5 Minutes)

1. **Set up Firebase:**
   - Go to https://console.firebase.google.com/
   - Create project → Enable Firestore (test mode)
   - Get credentials from Project Settings

2. **Update `.env.local`:**
   ```bash
   cd frontend
   # Edit .env.local with your Firebase credentials
   ```

3. **Start the app:**
   ```bash
   npm run dev
   ```

4. **Test it:**
   - Visit http://localhost:3000/test-messaging
   - Click "Send Test Message"
   - If successful, you're ready to go!

## 📚 Documentation

- **[MESSAGING_QUICK_START.md](MESSAGING_QUICK_START.md)** - 5-minute setup guide
- **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** - Detailed Firebase configuration
- **[MESSAGING_FEATURE.md](MESSAGING_FEATURE.md)** - Feature documentation
- **[MESSAGING_TROUBLESHOOTING.md](MESSAGING_TROUBLESHOOTING.md)** - Debug guide

## ✨ Features

- ✅ Real-time messaging with instant delivery
- ✅ Conversation list with unread counts
- ✅ Message read status tracking
- ✅ Responsive design (mobile & desktop)
- ✅ Integration with listings
- ✅ User authentication
- ✅ Clean, modern UI

## 🗂️ File Structure

```
frontend/
├── lib/
│   ├── firebase.ts              # Firebase configuration
│   └── messaging.ts             # Messaging logic
├── components/
│   ├── MessageList.tsx          # Message display
│   ├── MessageInput.tsx         # Message input
│   └── ConversationList.tsx     # Conversation list
├── app/
│   ├── messages/
│   │   ├── page.tsx             # Main messages page
│   │   └── [listingId]/[otherUserId]/page.tsx  # Conversation view
│   └── test-messaging/
│       └── page.tsx             # Firebase test page
└── .env.local                   # Environment variables
```

## 🔧 Configuration

### Required Environment Variables

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Firebase (get from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🧪 Testing

### Test Firebase Connection
Visit: http://localhost:3000/test-messaging

This page will:
- Check Firebase initialization
- Test Firestore connection
- Show existing messages
- Allow sending test messages

### Manual Testing Flow

1. **Login with two accounts** (use two browsers)
2. **User 1:** Create a listing
3. **User 2:** View listing → Click "💬 Message Seller"
4. **User 2:** Send a message
5. **User 1:** Check `/messages` → See new message
6. **User 1:** Reply
7. **User 2:** See reply in real-time!

## 🐛 Troubleshooting

### Quick Checks

1. ✓ Firebase credentials in `.env.local`?
2. ✓ Firestore enabled in Firebase Console?
3. ✓ Security rules set to test mode?
4. ✓ Backend running on port 8080?
5. ✓ Logged in to the app?

### Common Issues

**"Firebase not configured"**
→ Update `.env.local` with your Firebase credentials

**"Missing or insufficient permissions"**
→ Set Firestore rules to test mode (see FIREBASE_SETUP.md)

**Messages not appearing**
→ Visit `/test-messaging` to diagnose

**Port conflicts**
→ Kill processes: `lsof -i :8080` then `kill <PID>`

See [MESSAGING_TROUBLESHOOTING.md](MESSAGING_TROUBLESHOOTING.md) for detailed solutions.

## 📱 Usage

### For Users

**Access messages:**
- Click "💬 Messages" in navigation
- Or visit http://localhost:3000/messages

**Message a seller:**
1. Browse listings
2. Click on a listing
3. Click "💬 Message Seller"
4. Type and send your message

**View conversations:**
- All conversations appear in the left sidebar
- Unread counts show next to each conversation
- Click a conversation to view messages

### For Developers

**Send a message programmatically:**
```typescript
import { sendMessage } from '@/lib/messaging';

await sendMessage(
  'Hello!',           // content
  'user-id-1',        // senderId
  'user-id-2',        // receiverId
  'listing-id',       // listingId
  'John Doe',         // senderName
  'Jane Smith'        // receiverName
);
```

**Subscribe to conversations:**
```typescript
import { subscribeToConversations } from '@/lib/messaging';

const unsubscribe = subscribeToConversations(userId, (conversations) => {
  console.log('Conversations:', conversations);
});

// Cleanup
return () => unsubscribe();
```

## 🔒 Security

### Development (Current)
- Test mode: All reads/writes allowed
- Good for development and testing
- **Rules expire after 30 days!**

### Production (TODO)
- Implement proper authentication
- Validate user permissions
- Add rate limiting
- See FIREBASE_SETUP.md for production rules

## 💰 Cost

Firebase free tier includes:
- 50K document reads/day
- 20K document writes/day
- 1GB storage

For a small marketplace (~100 users):
- Estimated: 5K-10K reads/day
- Estimated: 1K-2K writes/day
- **Well within free tier!**

Monitor usage: Firebase Console → Usage and billing

## 🚀 Deployment

Before deploying to production:

1. **Update Firestore rules** (see FIREBASE_SETUP.md)
2. **Set up Firebase indexes** (Firebase will prompt you)
3. **Update environment variables** on your hosting platform
4. **Test thoroughly** with real users
5. **Monitor Firebase usage** to avoid unexpected costs
6. **Set up billing alerts** in Firebase Console

## 📊 Monitoring

### Firebase Console
- **Firestore Database:** View messages in real-time
- **Usage:** Monitor reads/writes/storage
- **Rules:** Check security rule hits

### Application Logs
- Browser console for client-side errors
- Backend logs for API errors
- Network tab for failed requests

## 🎯 Next Steps

### Immediate
1. ✅ Set up Firebase (5 min)
2. ✅ Test with `/test-messaging`
3. ✅ Send real messages between users

### Future Enhancements
- [ ] Push notifications
- [ ] Image attachments
- [ ] Message search
- [ ] Typing indicators
- [ ] Online/offline status
- [ ] Message deletion
- [ ] Block/report users

## 📞 Support

**Issues?**
1. Check [MESSAGING_TROUBLESHOOTING.md](MESSAGING_TROUBLESHOOTING.md)
2. Visit `/test-messaging` for diagnostics
3. Check browser console for errors
4. Verify Firebase Console for data

**Need Help?**
Provide:
- Error messages
- Screenshot of `/test-messaging`
- Firebase project ID
- Browser and OS version

## 🎉 Success!

If you can:
- ✅ Visit `/test-messaging` without errors
- ✅ Send test messages successfully
- ✅ See messages in Firebase Console
- ✅ View conversations at `/messages`
- ✅ Send messages between users in real-time

**Your messaging system is fully functional!** 🎊

---

**Quick Links:**
- Test Page: http://localhost:3000/test-messaging
- Messages: http://localhost:3000/messages
- Firebase Console: https://console.firebase.google.com/
- Backend Health: http://localhost:8080/health
