-- UniTrade Database Setup Script
-- This script creates the initial database and user for the UniTrade application

-- Create database
CREATE DATABASE unitrade_db;

-- Create user (optional - you can use your existing PostgreSQL user)
-- CREATE USER unitrade_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
-- GRANT ALL PRIVILEGES ON DATABASE unitrade_db TO unitrade_user;

-- Connect to the database
\c unitrade_db;

-- Create schema (optional - Prisma will handle this)
-- CREATE SCHEMA IF NOT EXISTS public;

-- Note: Prisma will automatically create tables based on your schema.prisma file
-- Run the following commands after setting up your environment:
-- 1. npm run db:generate
-- 2. npm run db:push (for development) or npm run db:migrate (for production)
