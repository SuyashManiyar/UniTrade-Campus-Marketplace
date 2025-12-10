# Testing Quick Reference

## Quick Commands

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage Report
```bash
npm test -- --coverage
```

### Run Tests in Watch Mode (for development)
```bash
npm test:watch
```

### Run Specific Test File
```bash
npm test -- messages.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="Messages"
```

### Run Tests Verbosely
```bash
npm test:verbose
```

## Test File Locations

### Route Tests
- `src/routes/__tests__/auth.test.ts` - Authentication
- `src/routes/__tests__/listings.test.ts` - Listings & bidding
- `src/routes/__tests__/messages.test.ts` - Messaging system
- `src/routes/__tests__/notifications.test.ts` - Notifications
- `src/routes/__tests__/wishlist.test.ts` - Wishlist features
- `src/routes/__tests__/users.test.ts` - User profiles & reviews
- `src/routes/__tests__/reports.test.ts` - Content moderation
- `src/routes/__tests__/admin.test.ts` - Admin functionality
- `src/routes/__tests__/nlp-search.test.ts` - NLP search

### Middleware Tests
- `src/middleware/__tests__/auth.test.ts` - Auth middleware

### Service Tests
- `src/services/__tests__/nlpService.test.ts` - NLP service

### Utility Tests
- `src/utils/__tests__/cache.test.ts` - Cache utility
- `src/utils/__tests__/email.test.ts` - Email utility
- `src/utils/__tests__/validation.test.ts` - Validation schemas
- `src/utils/__tests__/database.test.ts` - Database client

## Current Test Status

✅ **120 Passing Tests** (out of 155 total)
- All new route tests pass
- All utility tests pass
- Most service tests pass

⚠️ **35 Failing Tests**
- Mostly NLP tests requiring valid API key
- Some integration tests requiring database setup

## Coverage Summary

| Module | Coverage | Status |
|--------|----------|--------|
| Routes | 59.13% | ✅ Good |
| Services | 86.59% | ✅ Excellent |
| Utils | 90% | ✅ Excellent |
| Middleware | 50% | ⚠️ Needs improvement |
| Socket | 29.16% | ⚠️ Needs improvement |

## Test Categories

### Unit Tests
Test individual functions and methods in isolation:
- Validation schemas
- Cache operations
- Email utilities
- Database client

### Integration Tests
Test API endpoints with mocked dependencies:
- All route tests
- Authentication flow
- CRUD operations

### Property-Based Tests
Test with generated inputs to find edge cases:
- NLP service tests using fast-check

## Writing New Tests

### Basic Test Structure
```typescript
import request from 'supertest';
import express from 'express';

// Mock dependencies
const mockPrisma = {
  model: {
    findMany: jest.fn()
  }
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

// Import after mocks
import router from '../your-route';

const app = express();
app.use(express.json());
app.use('/api/endpoint', router);

describe('Your Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something', async () => {
    mockPrisma.model.findMany.mockResolvedValue([]);
    
    const response = await request(app)
      .get('/api/endpoint');
    
    expect(response.status).toBe(200);
  });
});
```

## Common Test Patterns

### Testing Success Cases
```typescript
it('should return data successfully', async () => {
  mockPrisma.model.findMany.mockResolvedValue(mockData);
  
  const response = await request(app).get('/api/endpoint');
  
  expect(response.status).toBe(200);
  expect(response.body).toEqual(expectedData);
});
```

### Testing Error Cases
```typescript
it('should return 404 when not found', async () => {
  mockPrisma.model.findUnique.mockResolvedValue(null);
  
  const response = await request(app).get('/api/endpoint/123');
  
  expect(response.status).toBe(404);
  expect(response.body.error).toBeDefined();
});
```

### Testing Authorization
```typescript
it('should return 403 for non-admin users', async () => {
  mockAuthMiddleware.mockImplementationOnce((req, res, next) => {
    req.user = { role: 'STUDENT' };
    next();
  });
  
  const response = await request(app).get('/api/admin/endpoint');
  
  expect(response.status).toBe(403);
});
```

### Testing Validation
```typescript
it('should reject invalid input', async () => {
  const response = await request(app)
    .post('/api/endpoint')
    .send({ invalid: 'data' });
  
  expect(response.status).toBe(400);
});
```

## Debugging Tests

### View Console Output
```bash
npm test -- --verbose
```

### Run Single Test
```bash
npm test -- --testNamePattern="specific test name"
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## CI/CD Integration

Tests are designed to run in CI/CD with:
- Environment variables from secrets
- Test database setup
- Coverage reporting
- Fail on coverage drop

## Tips

1. **Always clear mocks** in `beforeEach` to avoid test pollution
2. **Mock external dependencies** (Prisma, APIs, etc.)
3. **Test both success and error paths**
4. **Use descriptive test names** that explain what's being tested
5. **Keep tests isolated** - each test should be independent
6. **Mock time-dependent code** for consistent results
7. **Test edge cases** - empty arrays, null values, boundary conditions

## Troubleshooting

### Tests Failing Locally
- Check environment variables in `.env`
- Ensure database is running
- Clear node_modules and reinstall: `npm ci`

### Mocks Not Working
- Ensure mocks are defined before imports
- Check mock implementation matches actual API
- Use `jest.clearAllMocks()` in `beforeEach`

### Coverage Not Updating
- Delete coverage folder: `rm -rf coverage`
- Run tests with `--no-cache` flag

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Fast-check Documentation](https://fast-check.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
