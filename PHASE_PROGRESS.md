# Phase Progress Tracker
## Agri Demand & Farmer Management System

> Live status of every phase. Update `[x]` as tasks complete.
> `*(extra)*` = implemented beyond original spec.

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Phase complete |
| 🔄 | In progress |
| ⬜ | Not started |

---

## Phase Overview

| Phase | Layer | Name | Status |
|---|---|---|---|
| 0 | Both | Project Setup & Infrastructure | 🔄 In Progress |
| 1 | Backend | Auth — Backend | ✅ Complete |
| 2 | Frontend | Auth — Frontend | ✅ Complete |
| 3 | Backend | Master Data — Backend | ⬜ Not Started |
| 4 | Frontend | Master Data — Frontend | ⬜ Not Started |
| 5 | Backend | Farmers — Backend | ⬜ Not Started |
| 6 | Frontend | Farmers — Frontend | ⬜ Not Started |
| 7 | Backend | Demand Planning — Backend | ⬜ Not Started |
| 8 | Frontend | Demand Planning — Frontend | ⬜ Not Started |
| 9 | Backend | Demand Booking — Backend | ⬜ Not Started |
| 10 | Frontend | Demand Booking — Frontend | ⬜ Not Started |
| 11 | Backend | Notifications — Backend | ⬜ Not Started |
| 12 | Frontend | Notifications — Frontend | ⬜ Not Started |
| 13 | Backend | Weather Alert — Backend | ⬜ Not Started |
| 14 | Backend | Inventory — Backend | ⬜ Not Started |
| 15 | Frontend | Inventory — Frontend | ⬜ Not Started |
| 16 | Backend | Reports — Backend | ⬜ Not Started |
| 17 | Frontend | Reports — Frontend | ⬜ Not Started |
| 18 | Backend | Dashboard — Backend | ⬜ Not Started |
| 19 | Frontend | Dashboard — Frontend | ⬜ Not Started |
| 20 | Both | Testing & QA | ⬜ Not Started |

---

## Phase 0 — Project Setup & Infrastructure 🔄

### Docker & Database
- [x] `docker-compose.yml` — MySQL 8, port `3306:3306`
- [x] `server/src/database/migrate.js` — auto migration runner
- [x] `server/migrations/001_init_schema.sql` — all tables
- [x] `server/migrations/003_refresh_tokens.sql` — refresh_token column *(extra)*
- [ ] Add `npm run migrate` script to `server/package.json`
- [ ] Add DB indexes from DB_DESIGN.md
- [ ] Seed: default super_admin with bcrypt-hashed password

### Server Bootstrap
- [x] `server/src/app.js` — Express app, cookie-parser, CORS credentials
- [x] `server/src/config/env.js` — all env vars validated on startup
- [x] `server/src/database/pool.js` — mysql2 promise pool
- [ ] `server/src/server.js` — HTTP server, DB connect, cron register
- [ ] `server/src/database/transaction.js` — `withTransaction(callback)` helper
- [ ] `server/src/middlewares/errorHandler.js` — global error middleware
- [ ] `server/src/middlewares/requestLogger.js` — Morgan + Winston
- [ ] `server/src/utils/response.js` — `successResponse`, `errorResponse`
- [ ] `server/src/utils/logger.js` — Winston logger
- [ ] `server/package.json` — scripts: `dev`, `test`, `lint`
- [ ] `server/.env.example`

### Client Bootstrap
- [x] Vite + React project initialized
- [x] `client/src/services/api.js` — Axios, `withCredentials`, silent refresh interceptor
- [x] `client/src/store/authStore.js` — Zustand `{ user, setAuth, logout }` (no token — cookie auth) *(changed)*
- [x] `client/src/routes/index.jsx` — public + protected route groups
- [x] `client/src/routes/AuthGuard.jsx` — redirects if no user in store
- [x] `client/src/components/layout/AppLayout.jsx`
- [x] `client/src/components/layout/Sidebar.jsx` — role-aware nav, logout API call
- [x] `client/src/components/layout/Header.jsx`
- [x] `client/src/components/layout/AuthLayout.jsx` — card: gray bg, image left, form right *(revised)*
- [x] `client/src/pages/NotFound.jsx`
- [ ] Tailwind design tokens (`primary: #4B9B4D`, `sidebar: #1E5C20`)
- [ ] shadcn/ui base components
- [ ] `client/.env.example`
- [ ] Vitest config (`vite.config.js` + `vitest.setup.js`)
- [ ] Playwright config (`playwright.config.js`)
- [ ] `client/eslint.config.js` + `.prettierrc`

### Shared UI Components (all pending)
- [ ] `DataTable.jsx`, `Pagination.jsx`, `StatusBadge.jsx`, `ProgressBar.jsx`
- [ ] `StatCard.jsx`, `LoadingSpinner.jsx`, `EmptyState.jsx`, `ErrorMessage.jsx`
- [ ] `Modal.jsx`, `ConfirmDialog.jsx`
- [ ] `FormField.jsx`, `SelectInput.jsx`, `MultiSelect.jsx`
- [ ] `DateRangePicker.jsx`, `FileUpload.jsx`, `SearchInput.jsx`, `FilterBar.jsx`

---

## Phase 1 — Auth — Backend ✅

### Core Auth
- [x] `auth.query.js` — findUserByEmail, findUserByGoogleId, createEmailUser, createGoogleUser, getUserById
- [x] `auth.query.js` — freeDeletedUserEmail, freeDeletedUserGoogleId *(extra — UNIQUE constraint fix)*
- [x] `auth.query.js` — saveRefreshToken, findUserByRefreshToken, clearRefreshToken *(extra)*
- [x] `auth.query.js` — savePasswordResetToken, findUserByResetToken, setUserPassword, createFarmerRecord *(extra)*
- [x] `config/google.js` — OAuth2Client initialized
- [x] `auth.service.js` — register, loginWithEmail (PASSWORD_NOT_SET), loginWithGoogle, getMe
- [x] `auth.service.js` — refreshAccessToken (token rotation), logout *(extra)*
- [x] `auth.service.js` — forgotPassword (Resend email), resetPassword, requestSetPassword *(extra)*
- [x] `auth.controller.js` — POST /register, /login, /google, GET /me
- [x] `auth.controller.js` — POST /refresh, /logout, /forgot-password, /reset-password, /set-password *(extra)*
- [x] HTTP-only cookies: access_token (15m), refresh_token (7d, path: /auth/refresh) *(extra)*
- [x] `auth.routes.js`
- [x] `auth.validation.js` — register, login, forgotPassword, resetPassword, setPassword schemas
- [x] `middlewares/verifyToken.js` — reads `req.cookies.access_token`
- [x] `middlewares/authorizeRole.js`
- [x] `middlewares/validate.js`

### Tests
- [ ] `auth.service.test.js` — register, login, google, duplicate email, wrong password
- [ ] `auth.routes.test.js` — all endpoints via Supertest

---

## Phase 2 — Auth — Frontend ✅

### Pages & Components
- [x] `App.jsx` wrapped with `GoogleOAuthProvider`
- [x] `features/auth/LoginPage.jsx` — email/password + Google, forgot password link, eye toggle
- [x] `features/auth/RegisterPage.jsx` — all 6 fields + Google
- [x] `features/auth/ForgotPasswordPage.jsx` — email input + success state *(extra)*
- [x] `features/auth/ResetPasswordPage.jsx` — token from URL, new password *(extra)*
- [x] `features/auth/SetPasswordPage.jsx` — for Google-only users *(extra)*

### API & Store
- [x] `features/auth/api.js` — loginWithEmailApi, registerWithEmailApi, loginWithGoogleApi, getMeApi
- [x] `features/auth/api.js` — logoutApi, forgotPasswordApi, resetPasswordApi, setPasswordApi *(extra)*
- [x] `store/authStore.js` — `{ user, setAuth, logout }`, user persisted in localStorage
- [x] `routes/AuthGuard.jsx` — checks `user` (no token check — cookies)
- [x] `routes/index.jsx` — all public + protected routes configured
- [ ] `routes/RoleGuard.jsx` — role-based redirect

### Tests
- [ ] `RegisterPage.test.jsx`
- [ ] `LoginPage.test.jsx`
- [ ] `AuthGuard.test.jsx`
- [ ] `Sidebar.test.jsx`

---

## Phase 3 — Master Data — Backend ⬜

### Backend
- [ ] `master/master.query.js` — CRUD for crops, locations, branches
- [ ] `master/master.controller.js`
- [ ] `master/master.routes.js` — GET: all roles; POST/PUT/DELETE: admin only
- [ ] `master/master.validation.js`

### Tests
- [ ] `master.routes.test.js` — create, list, duplicate, farmer 403

---

## Phase 4 — Master Data — Frontend ⬜

- [ ] `features/master/api.js` — getCrops, getLocations, getBranches
- [ ] `features/master/hooks.js` — useCrops, useLocations, useBranches
- [ ] `components/ui/CropSelect.jsx`, `LocationSelect.jsx`, `BranchSelect.jsx`

---

## Phase 5 — Farmers — Backend ⬜

### Backend
- [ ] `farmers.query.js` — createUser, createFarmer, assignFarmerCrops, getFarmers, getFarmerById, updateFarmer, softDeleteFarmer, getFarmersForExport
- [ ] `farmers.service.js` — createFarmer (transaction), updateFarmer, bulkUploadFarmers, exportFarmers
- [ ] `farmers.controller.js`
- [ ] `farmers.routes.js` — writes: admin; bulk-upload + export endpoints
- [ ] `farmers.validation.js`

### Tests
- [ ] `farmers.service.test.js` — transaction, rollback, bulk upload, filter
- [ ] `farmers.routes.test.js` — CRUD, bulk upload, export

---

## Phase 6 — Farmers — Frontend ⬜

- [ ] `features/farmers/FarmerListPage.jsx` — DataTable + FilterBar
- [ ] `features/farmers/FarmerCreatePage.jsx` — Formik form
- [ ] `features/farmers/FarmerEditPage.jsx`
- [ ] `features/farmers/BulkUploadModal.jsx`
- [ ] `features/farmers/api.js` + `hooks.js`

---

## Phase 7 — Demand Planning — Backend ⬜

### Backend
- [ ] `demand.query.js` — createDemand, getDemands, getDemandById, updateDemand, softDeleteDemand, getAllFarmerUserIds
- [ ] `demand.service.js` — createDemand (notify), updateDemand (notify)
- [ ] `demand.controller.js`, `demand.routes.js`, `demand.validation.js`

### Tests
- [ ] `demand.service.test.js`, `demand.routes.test.js`

---

## Phase 8 — Demand Planning — Frontend ⬜

- [ ] `DemandListPage.jsx` — DataTable + ProgressBar
- [ ] `DemandCreatePage.jsx`, `DemandEditPage.jsx`, `DemandDetailPage.jsx`
- [ ] `features/demand/api.js` + `hooks.js`

---

## Phase 9 — Demand Booking — Backend ⬜ (CRITICAL)

### Backend
- [ ] `booking.query.js` — getDemandForUpdate (SELECT FOR UPDATE), insertBooking, deductRemainingQuantity, getBookings
- [ ] `booking.service.js` — full transaction flow with row-level lock, zero overbooking guarantee
- [ ] `booking.controller.js`, `booking.routes.js`, `booking.validation.js`

### Tests
- [ ] `booking.service.test.js` — valid, overbooking, exact remaining, rollback
- [ ] `booking.routes.test.js`
- [ ] `booking.concurrency.test.js` — 10 simultaneous → exactly 1 succeeds

---

## Phase 10 — Demand Booking — Frontend ⬜

- [ ] `DemandBookingPage.jsx` — demand list + Book button (disabled if remaining = 0)
- [ ] `BookingFormModal.jsx` — quantity input + ConfirmDialog
- [ ] `MyBookingsPage.jsx` — farmer's booking history
- [ ] `features/booking/api.js` + `hooks.js`

---

## Phase 11 — Notifications — Backend ⬜

- [ ] `config/firebase.js` — Firebase Admin SDK
- [ ] `utils/fcm.js` — sendPushToUsers
- [ ] `notifications.query.js` — createBulkNotifications, getNotifications, markRead, markAllRead, getUserDeviceTokens
- [ ] `notifications.service.js` — insert → fetch tokens → FCM (never throws)
- [ ] `notifications.controller.js`, `devices.controller.js`
- [ ] `notifications.routes.js`, `devices.routes.js`
- [ ] Wire into demand.service + booking.service

---

## Phase 12 — Notifications — Frontend ⬜

- [ ] `NotificationListPage.jsx`
- [ ] `components/layout/Header.jsx` — bell icon + unread count badge
- [ ] `store/notificationStore.js` — polls every 30s
- [ ] `features/notifications/api.js`

---

## Phase 13 — Weather Alert — Backend ⬜

- [ ] `weather.query.js` — logWeatherEvent, getActiveLocationNames
- [ ] `weather.service.js` — runWeatherCheck (OpenWeatherMap → detect → notify)
- [ ] `weather.cron.js` — every 6 hours
- [ ] Register cron in `server.js`

---

## Phase 14 — Inventory — Backend ⬜

- [ ] `inventory.query.js` — getInventory, adjustInventory, insertInventoryLog, getInventoryLogs
- [ ] `inventory.service.js` — adjustInventory (transaction: update + log)
- [ ] `inventory.controller.js`, `inventory.routes.js` — admin only

---

## Phase 15 — Inventory — Frontend ⬜

- [ ] `InventoryListPage.jsx`, `AdjustModal.jsx`, `InventoryLogsPage.jsx`
- [ ] `features/inventory/api.js` + `hooks.js`

---

## Phase 16 — Reports — Backend ⬜

- [ ] `reports.query.js` — getCollectionReport, getCommitmentReport
- [ ] `reports.service.js` — getReport, exportReport (CSV/Excel via xlsx)
- [ ] `reports.controller.js`, `reports.routes.js` — admin only

---

## Phase 17 — Reports — Frontend ⬜

- [ ] `ReportsPage.jsx` — tab (Collection/Commitment), FilterBar, DataTable, export button
- [ ] `features/reports/api.js` + `hooks.js`

---

## Phase 18 — Dashboard — Backend ⬜

- [ ] `dashboard.query.js` — farmer counts (total, active, pending, suspended)
- [ ] `dashboard.controller.js` — GET /dashboard
- [ ] `dashboard.routes.js` — admin + super_admin

---

## Phase 19 — Dashboard — Frontend ⬜

- [ ] `DashboardPage.jsx` — 4 StatCard components + quick-link cards
- [ ] `features/dashboard/api.js`

---

## Phase 20 — Testing & QA ⬜

### E2E (Playwright)
- [ ] `auth.spec.js` — email login, Google login, logout
- [ ] `farmers.spec.js` — create, list, edit, delete
- [ ] `demand.spec.js` — create demand, farmer views
- [ ] `booking.spec.js` — book, remaining decreases
- [ ] `notifications.spec.js` — bell count, mark read
- [ ] `reports.spec.js` — filter, export

### Coverage & Final Checks
- [ ] Backend services ≥ 80% coverage (booking.service: 100%)
- [ ] All API routes: at least one integration test
- [ ] All Formik forms: at least one validation test
- [ ] Manual concurrency test on booking endpoint
- [ ] All queries use `WHERE is_deleted = false`
- [ ] All booking paths use `SELECT ... FOR UPDATE` inside transaction

---

## Code Quality (throughout all phases)

- [ ] ESLint + Prettier for `server/` and `client/`
- [ ] Husky pre-commit: lint-staged
- [ ] `npm run lint` + `npm run format` in both `package.json`

---
