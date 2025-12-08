# 🧪 Testing Guide

Comprehensive guide for running and writing unit tests for UniTrade backend.

## 📋 Test Structure

```
backend/src/
├── utils/
│   └── __tests__/
│       ├── validation.test.ts
│       ├── email.test.ts
│       └── cache.test.ts
├── middleware/
│   └── __tests__/
│       └── auth.test.ts
├── routes/
│   └── __tests__/
│       ├── auth.test.ts
│       ├── listings.test.ts
│       └── nlp-search.test.ts
└── services/
    └── __tests__/
        └── nlpService.test.ts
```

## 🚀 Running Tests

### Run All Tests
```bash
cd backend
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Specific Test File
```bash
npm test -- validation.test.ts
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## 📝 Test Categories

### 1. Unit Tests - Utilities

**Validation Tests** (`utils/__tests__/validation.test.ts`)
- ✅ Register schema validation
- ✅ Login schema validation
- ✅ Listing schema validation
- ✅ Bid schema validation
- ✅ Message schema validation

**Email Tests** (`utils/__tests__/email.test.ts`)
- ✅ Verification code generation
- ✅ Email sending (mocked)
- ✅ Development mode handling

**Cache Tests** (`utils/__tests__/cache.test.ts`)
- ✅ LRU cache operations
- ✅ TTL expiration
- ✅ Cache eviction
- ✅ Size management

### 2. Unit Tests - Middleware

**Auth Middleware Tests** (`middleware/__tests__/auth.test.ts`)
- ✅ Token authentication
- ✅ UMass email validation
- ✅ User verification checks
- ✅ Error handling

### 3. Integration Tests - Routes

**Auth Routes Tests** (`routes/__tests__/auth.test.ts`)
- ✅ User registration
- ✅ User login
- ✅ Email verification
- ✅ Error cases

**Listings Routes Tests** (`routes/__tests__/listings.test.ts`)
- ✅ Get listings
- ✅ Get single listing
- ✅ Place bid
- ✅ Bid validation
- ✅ Leaderboard

**NLP Search Tests** (`routes/__tests__/nlp-search.test.ts`)
- ✅ Filter extraction
- ✅ Query parsing
- ✅ Result filtering

### 4. Service Tests

**NLP Service Tests** (`services/__tests__/nlpService.test.ts`)
- ✅ Category recognition
- ✅ Condition recognition
- ✅ Price extraction
- ✅ Caching
- ✅ Fallback handling

## 🧩 Writing New Tests

### Test Template

```typescript
import { functionToTest } from '../module';

describe('Module Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Feature Name', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('should handle error case', () => {
      expect(() => {
        functionToTest('invalid');
      }).toThrow('Error message');
    });
  });
});
```

### Mocking Prisma

```typescript
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  }))
}));
```

### Mocking Middleware

```typescript
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 'user123', email: 'test@umass.edu' };
    next();
  })
}));
```

## ✅ Test Coverage Goals

- **Utilities**: 90%+ coverage
- **Middleware**: 85%+ coverage
- **Routes**: 80%+ coverage
- **Services**: 85%+ coverage

## 🔍 Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Mock External Dependencies**: Database, APIs, etc.
3. **Test Edge Cases**: Invalid input, error conditions
4. **Use Descriptive Names**: Test names should explain what they test
5. **Arrange-Act-Assert**: Clear test structure
6. **Clean Up**: Reset mocks and state between tests

## 🐛 Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="should validate correct registration"
```

### Verbose Output
```bash
npm test -- --verbose
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📊 Coverage Reports

After running tests with coverage, view the report:
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

## 🎯 Test Checklist

When adding new features:
- [ ] Write unit tests for utilities
- [ ] Write tests for middleware
- [ ] Write integration tests for routes
- [ ] Test error cases
- [ ] Test edge cases
- [ ] Achieve target coverage
- [ ] All tests pass

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)


