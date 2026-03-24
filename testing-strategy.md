# Testing Strategy
## Agri Demand & Farmer Management System

---

## 1. Core Philosophy

> **Tests are written alongside code, not after.**

Every file you write has a corresponding test file created at the same time. If you generate a `booking.service.js`, you immediately generate `booking.service.test.js`.

**What we test and why:**

| Layer | Tool | Why |
|---|---|---|
| Business logic (services) | Jest (backend) / Vitest (frontend) | Catch logic bugs in isolation |
| API endpoints | Supertest + real DB | Catch integration issues (auth, validation, DB) |
| UI components | React Testing Library + Vitest | Catch rendering and form behavior |
| Critical flows | Playwright | Catch UI ↔ API ↔ DB breakage end-to-end |
| Concurrency | Jest + Supertest | Prove booking is race-condition free |

---

## 2. Test Tools by Layer

### Backend
| Tool | Use |
|---|---|
| **Jest** | Unit tests for service layer |
| **Supertest** | Integration tests for API routes (real HTTP, real DB) |
| **mysql2 (real DB)** | No mocking the database — use a real test MySQL database |

> **Why no DB mocking?** Mocked DB tests give false confidence. The real bugs are in SQL queries, transactions, and row locking. A mocked DB will never catch a missing `FOR UPDATE` clause.

### Frontend
| Tool | Use |
|---|---|
| **Vitest** | Unit tests — components, hooks, utils (Vite-native, zero config) |
| **React Testing Library** | Render components, simulate user interaction, assert DOM |
| **@testing-library/jest-dom** | Custom matchers: `toBeInTheDocument()`, `toHaveValue()` |
| **Playwright** | End-to-end browser tests — full user flows |

> **Why Vitest instead of Jest?** Vitest is Vite-native. It reuses your Vite config, requires zero additional setup, and is ~10x faster than Jest for Vite projects. The API is identical to Jest.

---

## 3. Test File Location Convention

### Backend — Co-located with source

```
server/src/modules/
├── booking/
│   ├── booking.controller.js
│   ├── booking.service.js
│   ├── booking.query.js
│   ├── booking.routes.js
│   └── __tests__/
│       ├── booking.service.test.js      ← unit: service logic
│       ├── booking.routes.test.js       ← integration: API via Supertest
│       └── booking.concurrency.test.js  ← concurrency: parallel requests
│
├── auth/
│   └── __tests__/
│       ├── auth.service.test.js
│       └── auth.routes.test.js
```

### Frontend — Co-located with feature

```
client/src/features/
├── farmers/
│   ├── components/
│   │   ├── FarmerList.jsx
│   │   └── __tests__/
│   │       └── FarmerList.test.jsx
│   ├── api.js
│   ├── hooks.js
│   └── __tests__/
│       └── hooks.test.js
```

### E2E — Separate top-level folder

```
client/e2e/
├── auth.spec.js
├── demand.spec.js
├── booking.spec.js
├── notifications.spec.js
└── reports.spec.js
```

---

## 4. What Each Layer Tests

### 4.1 Service Unit Tests (Jest — Backend)

Test business logic in isolation. Mock the query layer.

```js
// booking.service.test.js — example structure
describe('BookingService', () => {
  describe('createBooking', () => {
    it('deducts remaining_quantity correctly', async () => { ... })
    it('throws if quantity exceeds remaining_quantity', async () => { ... })
    it('throws if quantity is 0 or negative', async () => { ... })
    it('creates booking record in DB', async () => { ... })
    it('calls NotificationService after commit', async () => { ... })
    it('does NOT call NotificationService if transaction fails', async () => { ... })
  })
})
```

**Mock pattern for service tests:**
```js
jest.mock('../booking.query.js')
jest.mock('../../notifications/notifications.service.js')
// Test pure service logic without hitting DB
```

---

### 4.2 Route Integration Tests (Supertest — Backend)

Test real HTTP requests with real DB. No mocking.

```js
// booking.routes.test.js — example structure
describe('POST /bookings', () => {
  it('returns 201 and booking data when farmer books valid quantity', async () => { ... })
  it('returns 400 when quantity exceeds remaining_quantity', async () => { ... })
  it('returns 401 when no token provided', async () => { ... })
  it('returns 403 when admin tries to book', async () => { ... })
  it('returns 400 when demand does not exist', async () => { ... })
})
```

**Setup pattern:**
```js
// tests/helpers/testDb.js
const pool = require('../../src/database/pool')

beforeAll(async () => {
  await pool.query('START TRANSACTION')
})

afterAll(async () => {
  await pool.query('ROLLBACK')  // clean up after each test file
  await pool.end()
})
```

> Each integration test file uses a transaction that rolls back after the file completes. This keeps tests isolated without needing to truncate tables.

---

### 4.3 Concurrency Tests (Jest + Supertest — Backend)

Only for the booking module. This is a critical correctness test.

```js
// booking.concurrency.test.js
describe('Booking Concurrency', () => {
  it('handles 10 simultaneous booking requests — only 1 succeeds when remaining=1', async () => {
    // Setup: create demand with remaining_quantity = 1
    // Act: fire 10 simultaneous POST /bookings requests
    const results = await Promise.allSettled(
      Array(10).fill(null).map(() =>
        request(app).post('/bookings').send({ demand_id: 1, quantity: 1 }).set('Authorization', ...)
      )
    )
    // Assert
    const successes = results.filter(r => r.value?.status === 201)
    const failures = results.filter(r => r.value?.status === 400)
    expect(successes).toHaveLength(1)
    expect(failures).toHaveLength(9)
    // Verify DB: remaining_quantity = 0
  })
})
```

---

### 4.4 Component Tests (Vitest + React Testing Library — Frontend)

Test that components render correctly and handle user interaction.

```jsx
// FarmerCreatePage.test.jsx — example
describe('FarmerCreatePage', () => {
  it('renders all form fields', () => { ... })
  it('shows validation error when email is empty on submit', async () => { ... })
  it('shows validation error when email format is invalid', async () => { ... })
  it('calls createFarmerApi with correct payload on valid submit', async () => { ... })
  it('shows success toast on successful submit', async () => { ... })
  it('shows error message when API returns 400', async () => { ... })
})
```

**Setup pattern (client/vitest.setup.js):**
```js
import '@testing-library/jest-dom'
// Global mocks: axios, react-router-dom, zustand stores
```

---

### 4.5 Hook Tests (Vitest — Frontend)

Test custom hooks in isolation using `renderHook`.

```js
// hooks.test.js
import { renderHook, waitFor } from '@testing-library/react'
import { useFarmers } from '../hooks'

describe('useFarmers', () => {
  it('fetches farmers and returns data', async () => {
    const { result } = renderHook(() => useFarmers({ status: 'active' }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.farmers).toHaveLength(...)
  })
})
```

---

### 4.6 E2E Tests (Playwright)

Test full user flows in a real browser against the running application.

```js
// booking.spec.js
test('farmer books demand successfully', async ({ page }) => {
  // 1. Login as farmer
  await page.goto('/login')
  await page.fill('[name=email]', 'farmer@test.com')
  await page.fill('[name=password]', 'password')
  await page.click('[type=submit]')
  await expect(page).toHaveURL('/dashboard')

  // 2. Navigate to demand
  await page.click('text=Available Demand')
  await page.click('text=Book')

  // 3. Fill quantity and submit
  await page.fill('[name=quantity]', '500')
  await page.click('text=Confirm Booking')

  // 4. Assert success
  await expect(page.locator('.toast')).toContainText('Booking confirmed')

  // 5. Assert remaining quantity decreased on demand page
  await expect(page.locator('[data-testid=remaining-quantity]')).toContainText('9500')
})
```

---

## 5. Test Database Setup

Use a **separate test database** from development:

```env
# server/.env.test
DB_HOST=localhost
DB_PORT=3306
DB_NAME=farmer_test      ← separate test DB
DB_USER=root
DB_PASSWORD=root
```

**Jest config (server/jest.config.js):**
```js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEach: ['<rootDir>/tests/setup.js'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
}
```

**globalSetup.js** — run migrations on test DB before all tests
**globalTeardown.js** — drop test DB or truncate all tables

---

## 6. Running Tests

### Backend
```bash
# Unit tests only
cd server && npm run test:unit

# Integration tests only
cd server && npm run test:integration

# All tests with coverage
cd server && npm run test:coverage

# Watch mode during development
cd server && npm run test:watch
```

### Frontend
```bash
# Component + hook tests
cd client && npm run test

# Watch mode
cd client && npm run test:watch

# Coverage
cd client && npm run test:coverage
```

### E2E
```bash
# Run all E2E tests (requires app to be running)
cd client && npm run test:e2e

# Run with UI (Playwright inspector)
cd client && npm run test:e2e:ui

# Run specific spec
cd client && npx playwright test booking.spec.js
```

---

## 7. Coverage Targets

| Layer | Target | Critical Modules |
|---|---|---|
| Service unit tests | 80% minimum | booking.service: 100% |
| Route integration | All endpoints covered | /bookings: all scenarios |
| Component tests | All forms tested | BookingForm, LoginForm |
| E2E | Core user flows | Login, Create Demand, Book Demand |

---

## 8. Test Generation Rule (IMPORTANT)

When code is generated for any module, the following test files are generated simultaneously:

| Code File | Test File Generated |
|---|---|
| `module.service.js` | `__tests__/module.service.test.js` |
| `module.routes.js` | `__tests__/module.routes.test.js` |
| `FeatureComponent.jsx` | `__tests__/FeatureComponent.test.jsx` |
| `hooks.js` | `__tests__/hooks.test.js` |
| `utils/helper.js` | `__tests__/helper.test.js` |

**This is non-negotiable.** Code without a test file is considered incomplete.

---

## 9. CI Integration (Future)

When CI/CD is set up, the pipeline must:

1. Start MySQL test container
2. Run migrations on test DB
3. Run backend unit + integration tests
4. Run frontend component tests
5. Start dev server + run Playwright E2E
6. Fail PR if any test fails or coverage drops below threshold

---

## 10. Anti-Patterns to Avoid

| Anti-Pattern | Why Bad |
|---|---|
| Mocking the DB in integration tests | Hides real SQL bugs, false confidence |
| Only testing the happy path | Business rules fail on edge cases |
| Testing implementation details | Tests break on every refactor |
| Writing tests after a sprint | Bugs already in production |
| Skipping concurrency test for booking | Race condition will hit in prod |

---
