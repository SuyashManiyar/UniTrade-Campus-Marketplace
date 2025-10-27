# 🚀 Quick Start - UMass Marketplace

## One-Command Setup

```bash
# Run the complete setup script
npm run setup:complete
```

**OR** manual setup:

```bash
# Install dependencies and setup database
npm run setup

# Start the application
npm run dev
```

## 🌐 Access the Application

- **Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API**: http://localhost:8080/api
- **Dev Tools**: http://localhost:3000/dev/codes

## 🧪 Test Registration

1. **Go to**: http://localhost:3000/auth/register
2. **Email**: `test@umass.edu` (any @umass.edu email)
3. **Name**: Your name
4. **Get verification code**: http://localhost:3000/dev/codes
5. **Complete registration**

## 👑 Create Admin User

```bash
# After registering with admin@umass.edu
npm run make:admin
```

## 🔧 Troubleshooting

### Ports Busy?
```bash
# Kill processes on ports 3000 and 8080
lsof -ti:3000 | xargs kill -9
lsof -ti:8080 | xargs kill -9
```

### Database Issues?
```bash
# Reset database
npm run db:reset
```

### Fresh Install?
```bash
# Clean everything and reinstall
rm -rf node_modules frontend/node_modules backend/node_modules
npm run setup
```

## 📱 Daily Development

```bash
# Start both servers
npm run dev

# Frontend only
npm run dev:frontend

# Backend only  
npm run dev:backend
```

That's it! 🎉