# UMass Marketplace - Complete Setup Guide

This guide will help you set up the UMass Marketplace application on any machine.

## 📋 Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **Git** (for cloning the repository)
   - Download: https://git-scm.com/
   - Verify: `git --version`

## 🛠️ Installation Steps

### Step 1: Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd UMass-Marketplace

# Install all dependencies
npm run install:all
```

### Step 2: Environment Setup
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Step 3: Database Setup
```bash
# Generate Prisma client and create database
npm run db:generate
npm run db:push
```

### Step 4: Start the Application
```bash
# Start both frontend and backend
npm run dev
```

## 🌐 Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/api/health
- **Dev Tools**: http://localhost:3000/dev/codes

## 🔧 Configuration Options

### Email Configuration (Optional)
By default, verification codes are logged to the console. To enable real emails:

1. **Get Gmail App Password**:
   - Enable 2FA on Google account
   - Generate app password: https://myaccount.google.com/apppasswords

2. **Update backend/.env**:
   ```env
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-16-char-app-password
   SEND_REAL_EMAILS=true
   ```

### Default Configuration (Works Out of Box)
```env
# backend/.env
DATABASE_URL="file:./dev.db"  # SQLite database (no setup required)
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
SEND_REAL_EMAILS=false

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## 🧪 Testing the Setup

### 1. Health Check
```bash
curl http://localhost:8080/api/health
# Should return: {"status":"OK","message":"UMass Marketplace API is working!"}
```

### 2. Register Test User
1. Go to: http://localhost:3000/auth/register
2. Enter: `test@umass.edu` and your name
3. Check verification codes: http://localhost:3000/dev/codes
4. Complete registration with the code

### 3. Admin Access
1. Register with: `admin@umass.edu`
2. Complete verification
3. Run: `node backend/scripts/make-admin.js`
4. Access: http://localhost:3000/admin

## 🚨 Troubleshooting

### Port Conflicts
If ports 3000 or 8080 are busy:
```bash
# Check what's using the ports
lsof -ti:3000 | xargs kill -9
lsof -ti:8080 | xargs kill -9

# Or change ports in .env files
```

### Database Issues
```bash
# Reset database
rm backend/dev.db
npm run db:push
```

### Node Modules Issues
```bash
# Clean install
rm -rf node_modules frontend/node_modules backend/node_modules
npm run install:all
```

### Permission Issues (macOS/Linux)
```bash
# Make scripts executable
chmod +x setup.sh
chmod +x backend/scripts/make-admin.js
```

## 📱 Quick Start Commands

```bash
# Full setup (run once)
npm run install:all
npm run db:generate
npm run db:push

# Daily development
npm run dev

# Reset everything
rm -rf node_modules frontend/node_modules backend/node_modules backend/dev.db
npm run install:all
npm run db:generate
npm run db:push
```

## 🎯 Default Test Accounts

After setup, you can create these test accounts:

### Regular User
- Email: `student@umass.edu`
- Use verification codes from: http://localhost:3000/dev/codes

### Admin User
- Email: `admin@umass.edu`
- After registration, run: `node backend/scripts/make-admin.js`
- Access admin panel: http://localhost:3000/admin

## 📞 Support

If you encounter issues:
1. Check the console logs for errors
2. Verify all prerequisites are installed
3. Try the troubleshooting steps above
4. Check that all ports are available

## 🔄 Update Instructions

To get latest changes:
```bash
git pull origin main
npm run install:all
npm run db:generate
npm run db:push
npm run dev
```