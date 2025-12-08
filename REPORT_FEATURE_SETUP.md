# Report Listing Feature - Setup Instructions

## What's New?
- ✅ Report listing feature (users can report inappropriate listings)
- ✅ Auto-moderation (3+ reports = listing hidden)
- ✅ Admin dashboard to manage reports
- ✅ New database status: `UNDER_REVIEW`

## Setup Steps

### 1. Pull Latest Code
```bash
git pull origin main
```

### 2. Update Database
```bash
cd backend
npx prisma generate
npx prisma db push
```

**Important:** This adds the new `UNDER_REVIEW` status to your database.

### 3. Install Dependencies (if needed)
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Restart Servers
```bash
# Backend
cd backend
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

## Testing the Feature

### As a User:
1. Go to any listing: `http://localhost:3000/marketplace/listings/[id]`
2. Click "🚩 Report Listing" button
3. Select reason and submit

### As an Admin:
1. Go to: `http://localhost:3000/admin`
2. Click "Reports" tab
3. See all reports and manage them

## How It Works

| Reports | Status | Visibility |
|---------|--------|------------|
| 0-2 | ACTIVE | ✅ Public |
| 3+ | UNDER_REVIEW | ❌ Hidden (admin only) |
| Admin dismisses | ACTIVE | ✅ Restored |

## Files Changed
- `backend/prisma/schema.prisma` - Added UNDER_REVIEW status
- `backend/src/routes/reports.ts` - New report API
- `backend/src/routes/api.ts` - Added reports route
- `backend/src/routes/listings.ts` - Hide UNDER_REVIEW from public
- `frontend/app/marketplace/listings/[id]/page.tsx` - Report button & modal
- `frontend/app/admin/page.tsx` - Admin reports view

## Troubleshooting

### Error: "Type 'UNDER_REVIEW' is not assignable"
**Solution:** Run `npx prisma generate` in backend folder

### Error: "Route not found" when submitting report
**Solution:** Restart backend server

### Database out of sync
**Solution:** 
```bash
cd backend
npx prisma db push --force-reset
```
⚠️ Warning: This will delete all data!

## Questions?
Contact [Your Name] if you run into issues!
