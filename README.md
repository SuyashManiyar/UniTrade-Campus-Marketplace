# 🎓 UniTrade - Campus Marketplace Platform

A full-stack marketplace platform built exclusively for UMass students to buy, sell, and auction items within a trusted, verified community.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)

---

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)
- [Contributing](#-contributing)

---

## ✨ Features

### 🔐 Authentication & Security
- UMass email verification required
- JWT-based authentication
- Secure password hashing with bcrypt
- Role-based access control (Student, Staff, Admin)

### 🛍️ Marketplace
- **Direct Sales**: Post items with fixed prices
- **Auctions**: Real-time bidding with live updates
- **Smart Search**: AI-powered natural language search
- **Categories**: Electronics, Furniture, Textbooks, Bikes, Clothing, Other
- **Filters**: Category, condition, price range, status

### 💬 Communication
- Real-time messaging between buyers and sellers
- Conversation organized by listing
- Unread message notifications
- Delete conversations

### ❤️ Wishlist
- Save favorite items
- Automatically filters out sold items
- Quick access to saved listings

### 👤 User Profiles
- Customizable profiles with pronouns, major, location, bio
- View seller information before purchasing
- Member since date

### 🛡️ Admin Panel
- Dashboard with statistics
- User management
- Listing moderation
- Report system for inappropriate content
- Permanently delete listings

### 🔔 Real-Time Features
- Live auction bid updates
- Instant messaging
- Real-time notifications
- WebSocket-powered

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **ORM**: Prisma
- **Authentication**: JWT + Bcrypt
- **File Upload**: Multer
- **Email**: Nodemailer
- **Real-time**: Socket.IO
- **AI**: Google Gemini API
- **Validation**: Zod

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd UniTrade-Campus-Marketplace
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Set up Environment Variables**

Backend `.env`:
```env
DATABASE_URL="file:./dev.db"
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
GEMINI_API_KEY=your-gemini-api-key
```

Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

5. **Initialize Database**
```bash
cd backend
npx prisma generate
npx prisma db push
```

6. **Seed Database (Optional)**
```bash
npm run seed:images
```

7. **Run Development Servers**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

8. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

---

## 📁 Project Structure

```
UniTrade/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, upload, etc.
│   │   ├── services/        # Business logic
│   │   ├── socket/          # WebSocket handlers
│   │   ├── utils/           # Helper functions
│   │   ├── app.ts           # Express setup
│   │   └── server.ts        # Entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── scripts/             # Utility scripts
│   ├── uploads/             # Uploaded images
│   └── package.json
│
├── frontend/
│   ├── app/                 # Next.js pages
│   │   ├── auth/            # Login, register
│   │   ├── marketplace/     # Main app
│   │   ├── messages/        # Chat
│   │   ├── admin/           # Admin panel
│   │   └── profile/         # User profile
│   ├── components/          # Reusable components
│   ├── lib/                 # Utilities
│   └── package.json
│
└── README.md
```

---

## 📡 API Documentation

### Authentication
```
POST   /api/auth/register       - Create account
POST   /api/auth/verify         - Verify email
POST   /api/auth/login          - Login
POST   /api/auth/logout         - Logout
GET    /api/auth/me             - Get current user
```

### Listings
```
GET    /api/listings            - Get all listings
POST   /api/listings/nlp-search - AI search
GET    /api/listings/:id        - Get listing
POST   /api/listings            - Create listing
PUT    /api/listings/:id        - Update listing
DELETE /api/listings/:id        - Delete listing
POST   /api/listings/:id/bid    - Place bid
```

### Messages
```
GET    /api/messages/conversations              - Get conversations
GET    /api/messages/conversation/:id/:userId   - Get messages
POST   /api/messages                            - Send message
DELETE /api/messages/conversation/:id/:userId   - Delete conversation
```

### Wishlist
```
GET    /api/wishlist            - Get wishlist
POST   /api/wishlist/:id        - Add to wishlist
DELETE /api/wishlist/:id        - Remove from wishlist
GET    /api/wishlist/check/:id  - Check if in wishlist
```

### Admin
```
GET    /api/admin/stats         - Dashboard stats
GET    /api/admin/users         - Get all users
GET    /api/admin/listings      - Get all listings
PUT    /api/admin/listings/:id/status - Update status
DELETE /api/admin/listings/:id  - Delete listing
```

---

## 🔑 Environment Variables

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `PORT` | Server port | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `SMTP_HOST` | Email server host | Yes |
| `SMTP_PORT` | Email server port | Yes |
| `SMTP_USER` | Email username | Yes |
| `SMTP_PASS` | Email password | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Optional |

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |

---


## 📜 Scripts

### Backend Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run seed:images  # Seed database with dummy data
npm run make-admin   # Make user admin
npm run update-profiles # Update user profiles
```

### Frontend Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

---

## 🎯 Key Features Explained

### AI-Powered Search
Uses Google Gemini to understand natural language queries:
- "laptop under $500" → Extracts category and price
- "good condition bike" → Extracts condition and category
- Falls back to keyword search if AI unavailable

### Real-Time Auctions
- WebSocket-based live updates
- Instant bid notifications
- Leaderboard with rankings
- Automatic winner detection

### Smart Wishlist
- Automatically hides sold items
- Sorted by most popular
- Quick add/remove from any page

### Admin Moderation
- Report system for users
- Auto-flag listings with multiple reports
- Permanent deletion capability
- User and listing management

---

## 🔒 Security Features

- ✅ UMass email verification
- ✅ JWT authentication with HTTP-only cookies
- ✅ Password hashing with bcrypt
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection (React escaping)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Admin role-based access

---

## 🧪 Testing

### Test Accounts
After running `npm run seed:images`:
- username@umass.edu

Make admin: `npm run make-admin <email>`

---

## 🚧 Known Limitations

- SQLite for development (migrate to PostgreSQL for production)
- Local file storage for images (use S3/Cloudinary for production)
- No payment integration
- No mobile app (web-only currently)

---

## 📝 License

This project is for educational purposes.

---

## 👥 Team

- **Naveen** - Developer
- **Sreehitha** - Developer
- **Suyash** - Developer
- **Rohit** - Developer
- **Chetan** - Developer

---


**Built with ❤️ for the UMass community**
