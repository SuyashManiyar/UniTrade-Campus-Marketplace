# Database Configuration Options

The UMass Marketplace supports both SQLite (default) and PostgreSQL databases.

## 🗄️ Current Setup: SQLite (Default)

**Advantages:**
- ✅ No setup required
- ✅ Works out of the box
- ✅ Perfect for development
- ✅ Single file database
- ✅ No external dependencies

**Current Configuration:**
```prisma
// backend/prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

```env
# backend/.env
DATABASE_URL="file:./dev.db"
```

## 🐘 Alternative: PostgreSQL

**When to use:**
- Production deployment
- Multiple concurrent users
- Advanced database features needed
- Team development with shared database

### Switch to PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/
   ```

2. **Create Database**
   ```bash
   createdb umass_marketplace
   ```

3. **Update Prisma Schema**
   ```prisma
   // backend/prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Update Environment**
   ```env
   # backend/.env
   DATABASE_URL="postgresql://username:password@localhost:5432/umass_marketplace?schema=public"
   ```

5. **Migrate Database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

## 🔄 Schema Differences

Some fields need adjustment when switching:

### SQLite → PostgreSQL
```prisma
# SQLite version (current)
images      String? // JSON string of image URLs

# PostgreSQL version
images      String[] // Array of image URLs
```

## 🚀 Production Recommendations

### For Production Deployment:
1. **Use PostgreSQL** for better performance and features
2. **Use managed database** services like:
   - Railway PostgreSQL
   - Supabase
   - AWS RDS
   - Google Cloud SQL
   - Heroku Postgres

### Environment Variables for Production:
```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
NODE_ENV=production
JWT_SECRET="your-secure-random-secret"
SEND_REAL_EMAILS=true
SMTP_USER="your-production-email@gmail.com"
SMTP_PASS="your-production-app-password"
```

## 🧪 Testing Both Databases

You can test with both databases:

### SQLite (Development)
```bash
# Use current setup
npm run dev
```

### PostgreSQL (Testing)
```bash
# Switch to PostgreSQL
# Update schema.prisma and .env as shown above
npm run db:generate
npm run db:push
npm run dev
```

## 📊 Performance Comparison

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Setup | ✅ None | ❌ Required |
| Performance | ✅ Fast for small apps | ✅ Better for large apps |
| Concurrent Users | ❌ Limited | ✅ Excellent |
| Production Ready | ❌ Not recommended | ✅ Yes |
| Backup | ✅ Copy file | ✅ Built-in tools |
| Scaling | ❌ Single file | ✅ Horizontal scaling |

## 🔧 Current Status

The application is currently configured for **SQLite** to ensure:
- ✅ Zero-setup experience
- ✅ Works on any machine
- ✅ No external dependencies
- ✅ Perfect for development and testing

For production deployment, switching to PostgreSQL is recommended.