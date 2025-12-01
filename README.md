# UMass Marketplace

A secure web application that helps the UMass Amherst community buy and sell used goods by matching buyers and sellers. The platform enables users to trade second-hand items such as furniture, textbooks, fans, bikes, and electronics within a safe and structured campus environment.

## 🎯 Project Status: **FULLY FUNCTIONAL** ✅

The UMass Marketplace is complete and ready for use with all core features implemented:
- ✅ User registration with UMass email verification
- ✅ Beautiful 6-digit OTP input system
- ✅ Secure JWT-based authentication
- ✅ Complete marketplace with search and filters
- ✅ Admin dashboard for content management
- ✅ Real-time messaging system
- ✅ Auction and direct sale support
- ✅ User ratings and reviews
- ✅ Gmail SMTP integration for email verification

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework with UMass branding
- **React Hook Form** - Form validation and management
- **React Query** - Data fetching and caching
- **Zod** - Schema validation
- **React Hot Toast** - Beautiful notifications
- **Custom OTP Component** - 6-digit verification input

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework with security middleware
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Modern ORM with SQLite database
- **JWT** - Secure token-based authentication
- **Nodemailer** - Email verification system
- **Zod** - API validation
- **Helmet** - Security headers

### Database
- **SQLite** - Lightweight database (perfect for development)
- **Prisma Studio** - Database GUI and management

### Development Tools
- **npm** - Package manager
- **Concurrently** - Run multiple commands simultaneously
- **Nodemon** - Auto-restart development server
- **Custom dev tools** - Verification code viewer

## 📁 Project Structure

```
UMass-Marketplace/
├── frontend/                    # Next.js frontend application
│   ├── app/                    # App Router pages
│   │   ├── auth/              # Authentication pages (login/register)
│   │   ├── marketplace/       # Main marketplace pages
│   │   ├── admin/             # Admin dashboard
│   │   └── dev/               # Development tools
│   ├── components/            # Reusable React components
│   │   └── OTPInput.tsx       # Custom 6-digit OTP input
│   ├── lib/                   # Utility functions
│   │   ├── api.ts             # Axios API client
│   │   └── auth-context.tsx   # Authentication context
│   └── package.json
├── backend/                     # Express.js backend API
│   ├── src/
│   │   ├── middleware/        # Authentication middleware
│   │   ├── routes/            # API routes
│   │   │   ├── auth.ts        # Authentication endpoints
│   │   │   ├── users.ts       # User management
│   │   │   ├── listings.ts    # Marketplace listings
│   │   │   ├── messages.ts    # In-app messaging
│   │   │   ├── admin.ts       # Admin endpoints
│   │   │   └── dev.ts         # Development tools
│   │   └── utils/             # Utility functions
│   │       ├── email.ts       # Email verification system
│   │       └── validation.ts  # Zod schemas
│   ├── prisma/                # Database schema and seed
│   │   ├── schema.prisma      # Database models
│   │   └── seed.ts            # Sample data generator
│   ├── scripts/               # Utility scripts
│   │   └── make-admin.js      # Admin user creation
│   └── package.json
├── database/                    # Database-related files
├── FRIEND_SETUP.md             # Setup guide for collaborators
├── QUICK_START.md              # Quick start instructions
└── package.json                # Root workspace management
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL (v13 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd UMass-Marketplace
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   **Backend (.env)**
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   **Frontend (.env.local)**
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

4. **Configure your database and email**
   - Database uses SQLite by default (no setup required)
   - `DATABASE_URL="file:./dev.db"` in `backend/.env`
   - Configure email settings for verification codes (optional - defaults to console logging)

5. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Or run migrations (recommended for production)
   npm run db:migrate
   ```

6. **Seed the database with dummy data (optional)**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Run the seed script to add 50 dummy listings
   npm run seed
   ```
   
   This will create:
   - 5 dummy users with UMass email addresses
   - 50 sample listings including laptops, furniture, textbooks, bikes, and other student items
   - Various categories: Electronics, Furniture, Textbooks, Bikes, Clothing, and Other

## 🚀 Development

### Start Development Servers

```bash
# Start both frontend and backend in development mode
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Individual Commands

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# Database management
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Run database migrations
```

## 🏗️ Building for Production

```bash
# Build both frontend and backend
npm run build

# Start production servers
npm run start
```

## 📊 Database Management

### Prisma Commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create and run migrations (production)
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Database Schema

The application includes the following models in `backend/prisma/schema.prisma`:

- **User** - UMass community members with email verification
- **Listing** - Items for sale (direct sale or auction)
- **Bid** - Auction bids
- **Message** - In-app messaging between users
- **Review** - User ratings and reviews
- **Report** - Safety reporting system

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Backend server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS
- `JWT_SECRET` - JWT signing secret
- `SMTP_HOST` - Email server host
- `SMTP_PORT` - Email server port
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password

**Frontend (.env.local)**
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_APP_VERSION` - Application version

## 📝 Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build both applications
- `npm run install:all` - Install all dependencies
- `npm run db:*` - Database management commands

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server
- `npm run seed` - Populate database with dummy data

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the frontend: `npm run build:frontend`
2. Deploy the `frontend/out` directory

### Backend (Railway/Heroku/DigitalOcean)
1. Build the backend: `npm run build:backend`
2. Set environment variables
3. Deploy the `backend/dist` directory

### Database
- Use a managed PostgreSQL service (Railway, Supabase, or AWS RDS)
- Update the `DATABASE_URL` in your production environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues, please check the documentation or create an issue in the repository.
