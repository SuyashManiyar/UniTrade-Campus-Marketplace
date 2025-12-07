cd backend
# Wishlist Feature Update - Setup Instructions

## What's New?
- ❤️ Wishlist/Favorites feature added
- Heart button on listing cards to save items
- New `/marketplace/wishlist` page to view saved items

## Setup Steps

### 1. Pull Latest Changes
```bash
git pull origin main
```

### 2. Update Database
```bash
cd backend
npx prisma db push
```

**What this does:** Creates the new `wishlists` table in your database.

### 3. Restart Backend Server
If your backend is running, stop it (Ctrl+C) and restart:
```bash
npm run dev
```

### 4. Test the Feature
1. Go to http://localhost:3000/marketplace
2. Click the heart icon on any listing
3. Visit http://localhost:3000/marketplace/wishlist to see saved items

## Troubleshooting

### Error: "Table wishlists doesn't exist"
**Solution:** Run `npx prisma db push` in the backend folder

### Error: "Cannot find module '@prisma/client'"
**Solution:** Run `npm install` in the backend folder

### Database Issues
If you have problems, you can reset the database:
```bash
cd backend
npx prisma db push --force-reset
```
⚠️ **Warning:** This will delete all existing data!

## Files Changed
- `backend/prisma/schema.prisma` - Added Wishlist model
- `backend/src/routes/wishlist.ts` - New API endpoints
- `backend/src/routes/api.ts` - Added wishlist routes
- `frontend/app/marketplace/wishlist/page.tsx` - New wishlist page
- `frontend/app/marketplace/page.tsx` - Added heart buttons
- `frontend/app/marketplace/listings/page.tsx` - Added heart buttons

## Questions?
Contact [Your Name] if you run into any issues!
