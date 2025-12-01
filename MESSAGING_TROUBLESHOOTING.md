# Messaging System Troubleshooting Guide

## Quick Diagnostics

### Step 1: Test Firebase Connection

Visit: http://localhost:3000/test-messaging

This page will:
- ✓ Check if Firebase is initialized
- ✓ Test Firestore connection
- ✓ Show existing messages
- ✓ Allow sending test messages
- ✓ Display your Firebase configuration

### Step 2: Check Browser Console

Open browser DevTools (F12) and check the Console tab for errors.

## Common Issues & Solutions

### Issue 1: "Firebase: Error (auth/api-key-not-valid)"

**Cause:** Invalid or missing Firebase API key

**Solution:**
1. Check `frontend/.env.local` has correct `NEXT_PUBLIC_FIREBASE_API_KEY`
2. Verify the API key in Firebase Console → Project Settings
3. Make sure there are no extra spaces or quotes
4. Restart the dev server after changing `.env.local`

### Issue 2: "Missing or insufficient permissions"

**Cause:** Firestore security rules are blocking access

**Solution:**
1. Go to Firebase Console → Firestore Database → Rules
2. For testing, use these rules:
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
3. Click "Publish"
4. Wait 1-2 minutes for rules to propagate

### Issue 3: "The query requires an index"

**Cause:** Firestore needs a composite index for the query

**Solution:**
1. Click the link in the error message (it will open Firebase Console)
2. Click "Create Index"
3. Wait 2-5 minutes for index to build
4. Refresh your app

**Alternative:** The updated code now uses simpler queries that don't require indexes!

### Issue 4: Messages not appearing in real-time

**Possible causes:**
- Firebase not properly initialized
- Network connection issues
- Firestore rules blocking access

**Solutions:**
1. Check browser console for errors
2. Visit `/test-messaging` to verify connection
3. Check Firebase Console → Firestore Database to see if messages are being created
4. Verify your internet connection
5. Try hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Issue 5: "Cannot read properties of undefined"

**Cause:** User not logged in or token expired

**Solution:**
1. Make sure you're logged in
2. Try logging out and back in
3. Check if token is valid in browser DevTools → Application → Cookies

### Issue 6: Conversations list is empty

**Possible causes:**
- No messages sent yet
- Firebase query failing
- User ID mismatch

**Solutions:**
1. Send a test message first
2. Check browser console for errors
3. Visit `/test-messaging` to verify Firestore connection
4. Check that user IDs match between your auth system and Firebase messages

### Issue 7: "Failed to fetch" or network errors

**Cause:** Backend API not running or wrong URL

**Solution:**
1. Check backend is running: `curl http://localhost:8080/health`
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local` is correct
3. Check CORS settings in backend

### Issue 8: Port conflicts

**Symptoms:** 
- "Port 3000 is in use"
- "Port 8080 is in use"

**Solutions:**
```bash
# Find what's using the port
lsof -i :3000
lsof -i :8080

# Kill the process
kill <PID>

# Or use different ports
# Backend: Change PORT in backend/.env
# Frontend will auto-use next available port
```

## Debugging Steps

### 1. Verify Environment Variables

```bash
# Check frontend env
cat frontend/.env.local

# Should show:
# NEXT_PUBLIC_API_URL=http://localhost:8080/api
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# etc.
```

### 2. Check Firebase Console

1. Go to https://console.firebase.google.com/
2. Select your project
3. Go to Firestore Database
4. Check if "messages" collection exists
5. Check if messages are being created when you send them

### 3. Test Backend API

```bash
# Test health endpoint
curl http://localhost:8080/health

# Should return: {"status":"OK",...}
```

### 4. Check Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try sending a message
4. Look for failed requests (red)
5. Click on failed requests to see error details

### 5. Check Firestore Rules

In Firebase Console → Firestore Database → Rules, verify rules are published and not expired.

## Still Not Working?

### Collect Debug Information

1. **Browser Console Errors:**
   - Open DevTools → Console
   - Copy any error messages

2. **Network Errors:**
   - Open DevTools → Network
   - Filter by "Fetch/XHR"
   - Check for failed requests

3. **Firebase Configuration:**
   - Visit `/test-messaging`
   - Take screenshot of status

4. **Backend Logs:**
   - Check terminal where `npm run dev` is running
   - Look for error messages

### Reset Everything

If nothing works, try a fresh start:

```bash
# 1. Stop all servers
# Press Ctrl+C in terminal

# 2. Clear Next.js cache
rm -rf frontend/.next

# 3. Restart
npm run dev
```

### Test with Minimal Setup

Create a simple test:

1. Visit `/test-messaging`
2. Click "Send Test Message"
3. Click "Refresh Messages"
4. If test message appears, Firebase is working!
5. If not, check Firebase configuration

## Getting Help

When asking for help, provide:
1. Error messages from browser console
2. Screenshot of `/test-messaging` page
3. Your Firebase project ID
4. Node.js version: `node --version`
5. Operating system

## Useful Commands

```bash
# Check if servers are running
lsof -i :3000  # Frontend
lsof -i :8080  # Backend

# Restart dev servers
npm run dev

# Check Node version
node --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Firebase Console Links

- **Main Console:** https://console.firebase.google.com/
- **Firestore Database:** Project → Firestore Database
- **Project Settings:** Project → ⚙️ → Project settings
- **Usage & Billing:** Project → ⚙️ → Usage and billing

## Success Indicators

✅ `/test-messaging` shows "✓ Firestore connected"
✅ Can send test message successfully
✅ Messages appear in Firebase Console
✅ Conversations list loads without errors
✅ Real-time updates work (messages appear instantly)
✅ Unread counts update correctly
✅ Can navigate between conversations

If all these work, your messaging system is fully functional!
