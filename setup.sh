#!/bin/bash

# UniTrade Development Setup Script
echo "🚀 Setting up UniTrade development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "✅ All dependencies installed"

# Copy environment files
echo "📝 Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Backend .env file created"
else
    echo "⚠️  Backend .env file already exists"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    echo "✅ Frontend .env.local file created"
else
    echo "⚠️  Frontend .env.local file already exists"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Update your database connection in backend/.env:"
echo "   DATABASE_URL=\"postgresql://username:password@localhost:5432/unitrade_db?schema=public\""
echo ""
echo "2. Create your database:"
echo "   createdb unitrade_db"
echo ""
echo "3. Set up the database schema:"
echo "   npm run db:generate"
echo "   npm run db:push"
echo ""
echo "4. Start the development servers:"
echo "   npm run dev"
echo ""
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend will be available at: http://localhost:5000"
echo "📊 Database GUI: npm run db:studio"
