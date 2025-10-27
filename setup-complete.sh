#!/bin/bash

# UMass Marketplace - Complete Setup Script
echo "🚀 Setting up UMass Marketplace..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v18 or higher from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please install Node.js v18 or higher."
    exit 1
fi

print_status "Node.js $(node --version) is installed"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_status "npm $(npm --version) is installed"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."

if npm run install:all; then
    print_status "All dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Setup environment files
echo ""
echo "📝 Setting up environment files..."

# Backend environment
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    print_status "Backend .env file created"
else
    print_warning "Backend .env file already exists"
fi

# Frontend environment
if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    print_status "Frontend .env.local file created"
else
    print_warning "Frontend .env.local file already exists"
fi

# Database setup
echo ""
echo "🗄️  Setting up database..."

if npm run db:generate; then
    print_status "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

if npm run db:push; then
    print_status "Database schema created"
else
    print_error "Failed to create database schema"
    exit 1
fi

# Test the setup
echo ""
echo "🧪 Testing the setup..."

# Start backend in background for testing
echo "Starting backend server for testing..."
npm run dev:backend &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Test health endpoint
if curl -s http://localhost:8080/api/health > /dev/null; then
    print_status "Backend server is working"
else
    print_error "Backend server is not responding"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Stop test backend
kill $BACKEND_PID 2>/dev/null
sleep 2

# Setup complete
echo ""
echo "🎉 Setup complete!"
echo ""
print_info "Next steps:"
echo "1. Start the application: npm run dev"
echo "2. Open your browser: http://localhost:3000"
echo "3. Register with any @umass.edu email"
echo "4. Check verification codes: http://localhost:3000/dev/codes"
echo ""
print_info "Useful URLs:"
echo "• Frontend: http://localhost:3000"
echo "• Backend API: http://localhost:8080/api"
echo "• Health Check: http://localhost:8080/api/health"
echo "• Dev Tools: http://localhost:3000/dev/codes"
echo ""
print_info "To create an admin user:"
echo "1. Register with admin@umass.edu"
echo "2. Run: node backend/scripts/make-admin.js"
echo "3. Access admin panel: http://localhost:3000/admin"
echo ""
echo "🚀 Ready to start development!"