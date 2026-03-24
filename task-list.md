# Task List
## Agri Demand & Farmer Management System

> Tasks follow the same phase numbering as development-phase.md.
> Check off tasks as completed during development.

---

## PHASE 0 — Project Setup & Infrastructure

### Docker & Database
- [x] Write `docker-compose.yml` — MySQL 8, port `3306:3306` (connect via TablePlus/DBeaver on localhost:3306)
- [x] `server/src/database/migrate.js` — auto migration runner:
  - Creates `_migrations` tracking table on first run
  - Reads `migrations/*.sql` files sorted numerically
  - Skips already-run files, executes new ones in order
  - Called automatically in `server.js` before HTTP listen
- [ ] Add `npm run migrate` script to `server/package.json`
- [x] Write `server/migrations/001_init_schema.sql` — all tables:
  - `users`: `id, first_name, phone, email UNIQUE, password (nullable), role ENUM('admin','farmer','super_admin'), auth_type ENUM('email','google','both') DEFAULT 'email', google_id (nullable UNIQUE), is_deleted, deleted_at, created_at, updated_at`
  - `password_reset_token`, `password_reset_expires` columns in users *(extra)*
  - `farmers`, `crops`, `farmer_crops`, `locations`, `branches`
  - `demand`, `demand_bookings`
  - `inventory`, `inventory_logs`
  - `notifications`, `device_tokens`
  - `weather_logs`
- [ ] Add all indexes from DB_DESIGN.md to migration file
- [ ] Seed migration: insert default super_admin user with bcrypt-hashed password
- [x] `server/migrations/003_refresh_tokens.sql` — adds `refresh_token TEXT NULL` to users *(extra — cookie-based auth)*

### Server Bootstrap
- [ ] `server/package.json` — scripts: `dev`, `test`, `test:unit`, `test:integration`, `lint`
- [ ] `server/src/server.js` — create HTTP server, connect DB pool, register cron jobs
- [x] `server/src/app.js` — Express app, mount all middlewares (includes `cookie-parser`, CORS with `credentials: true`), mount all route modules
- [x] `server/src/config/env.js` — load + validate all required env vars on startup (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV`, `CLIENT_URL`, `RESEND_API_KEY`, etc.)
- [x] `server/src/database/pool.js` — mysql2 createPool, export promise pool
- [ ] `server/src/database/transaction.js` — `withTransaction(callback)` helper
- [ ] `server/src/middlewares/errorHandler.js` — global catch-all error middleware
- [ ] `server/src/middlewares/requestLogger.js` — Morgan + Winston HTTP logging
- [ ] `server/src/utils/response.js` — `successResponse(res, data, message)`, `errorResponse(res, message, status)`
- [ ] `server/src/utils/logger.js` — Winston logger (file + console transports)
- [ ] `server/.env.example` — all required variables documented

### Client Bootstrap
- [x] `client/` — init with `npm create vite@latest` (React + JS)
- [ ] Configure Tailwind CSS with design tokens:
  - `primary: { DEFAULT: '#4B9B4D', dark: '#3A7A3C' }`
  - `sidebar: { bg: '#1E5C20', active: '#2D7A30' }`
- [ ] Configure shadcn/ui base components
- [x] `client/src/services/api.js` — Axios instance, `withCredentials: true`, silent refresh interceptor (queues concurrent requests, retries on success, redirects to `/login` on failure)
- [ ] `client/.env.example` — `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`
- [ ] Configure Vitest in `vite.config.js` + `vitest.setup.js`
- [ ] Configure Playwright in `playwright.config.js`
- [ ] `client/eslint.config.js` + `.prettierrc`

### Shared / Common Components
> **Rule:** If a UI pattern appears in more than one feature, it lives in `components/`. Features import it — never duplicate it. Components receive data via props only — no API calls, no Zustand.

**Layout**
- [x] `components/layout/AuthLayout.jsx` — card layout: gray background, image left panel (`object-contain`, white bg), form right panel; accepts `image` prop; no text overlay
- [x] `components/layout/AppLayout.jsx` — sidebar + header wrapper for all protected pages
- [x] `components/layout/Sidebar.jsx` — `bg-[#1E5C20]`, "FPO" logo, role-aware nav, active `bg-[#2D7A30]`, calls `logoutApi()` before clearing store
- [x] `components/layout/Header.jsx` — page title left, logout support

**Data Display**
- [ ] `components/ui/DataTable.jsx` — TanStack Table wrapper: sorting, pagination, loading skeleton, empty state
- [ ] `components/ui/Pagination.jsx` — page controls, used inside DataTable
- [ ] `components/ui/StatusBadge.jsx` — `active=green`, `pending=yellow`, `suspended=red`
- [ ] `components/ui/ProgressBar.jsx` — remaining/total bar (demand + booking pages)
- [ ] `components/ui/StatCard.jsx` — metric card: number + label + optional icon (dashboard)
- [ ] `components/ui/LoadingSpinner.jsx` — centered, primary color
- [ ] `components/ui/EmptyState.jsx` — illustration + message for empty list states
- [ ] `components/ui/ErrorMessage.jsx` — API error display block

**Overlays**
- [ ] `components/ui/Modal.jsx` — dialog shell: title + close button. All modals use this.
- [ ] `components/ui/ConfirmDialog.jsx` — "Are you sure?" modal. Used for delete + booking confirm.

**Forms & Inputs**
- [ ] `components/form/FormField.jsx` — label + input + Yup error wrapper. All Formik fields use this.
- [ ] `components/form/SelectInput.jsx` — styled single-select (wraps shadcn Select with defaults)
- [ ] `components/form/MultiSelect.jsx` — multi-select (crop assignment in farmer create/edit)
- [ ] `components/form/DateRangePicker.jsx` — start + end date inputs (reports + demand filters)
- [ ] `components/form/FileUpload.jsx` — drag-and-drop or click (bulk upload)
- [ ] `components/form/SearchInput.jsx` — debounced 300ms search input
- [ ] `components/form/FilterBar.jsx` — horizontal filter row shell (farmers, demand, inventory, reports)

---

## PHASE 1 — Auth — Backend

### Backend
- [x] `auth.query.js`:
  - `findUserByEmail(email)`
  - `findUserByGoogleId(googleId)`
  - `createEmailUser(firstName, phone, email, hashedPassword, role)` — `auth_type='email'`
  - `createGoogleUser(firstName, email, googleId, role)` — `auth_type='google'`
  - `getUserById(id)`
  - `freeDeletedUserEmail(email)` — renames email for soft-deleted user to release UNIQUE constraint *(extra)*
  - `freeDeletedUserGoogleId(googleId)` — sets `google_id = NULL` for soft-deleted user *(extra)*
  - `saveRefreshToken(userId, token)` *(extra)*
  - `findUserByRefreshToken(token)` *(extra)*
  - `clearRefreshToken(userId)` *(extra)*
  - `savePasswordResetToken(userId, token, expires)` *(extra)*
  - `findUserByResetToken(token)` — also checks expiry *(extra)*
  - `setUserPassword(userId, hashedPassword)` — clears reset token columns *(extra)*
  - `createFarmerRecord(userId)` *(extra)*
- [x] `config/google.js` — initialize `OAuth2Client` with `GOOGLE_CLIENT_ID`
- [x] `auth.service.js`:
  - `register(firstName, phone, email, password, role)` — check duplicate → bcrypt.hash → createEmailUser → if role='farmer': createFarmerRecord → issue access + refresh tokens
  - `loginWithEmail(email, password)` — find user → bcrypt.compare → throws `PASSWORD_NOT_SET` for Google-only users → issue tokens *(extra error code)*
  - `loginWithGoogle(credential)` — verify token → `freeDeletedUserGoogleId` → find or create user → if new farmer: createFarmerRecord → link Google if email already exists → issue tokens
  - `getMe(userId)`
  - `refreshAccessToken(refreshToken)` — find by DB token → rotate (new refresh token) → issue new access token *(extra)*
  - `logout(userId)` — `clearRefreshToken` *(extra)*
  - `forgotPassword(email)` — generate reset token → `savePasswordResetToken` → send email via Resend *(extra)*
  - `resetPassword(token, newPassword)` — `findUserByResetToken` → bcrypt.hash → `setUserPassword` *(extra)*
  - `requestSetPassword(userId, email)` — generates set-password token, sends email *(extra)*
- [x] `auth.controller.js`:
  - `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `GET /auth/me`
  - Sets HTTP-only cookies (`access_token` 15m, `refresh_token` 7d with `path: /auth/refresh`) *(extra)*
  - `POST /auth/refresh` *(extra)*
  - `POST /auth/logout` — clears cookies + DB token *(extra)*
  - `POST /auth/forgot-password` *(extra)*
  - `POST /auth/reset-password` *(extra)*
  - `POST /auth/set-password` *(extra)*
- [x] `auth.routes.js`
- [x] `auth.validation.js` — Joi schemas: register, login, forgotPassword, resetPassword, setPassword *(extra schemas)*
- [x] `middlewares/verifyToken.js` — reads from `req.cookies.access_token`, attaches `req.user`, 401 if invalid
- [x] `middlewares/authorizeRole.js` — `authorizeRole(['admin'])` — 403 if role mismatch
- [x] `middlewares/validate.js` — Joi middleware factory

### Tests
- [ ] `auth.service.test.js`:
  - `register` — creates user, returns token
  - `register` — duplicate email throws 409
  - `loginWithEmail` — valid credentials returns token
  - `loginWithEmail` — wrong password throws
  - `loginWithEmail` — unknown email throws
  - `loginWithGoogle` — valid token, existing user → returns token
  - `loginWithGoogle` — valid token, new user → creates user + returns token
  - `loginWithGoogle` — invalid/expired token → throws
- [ ] `auth.routes.test.js` (Supertest):
  - `POST /auth/register` valid → 201 + token
  - `POST /auth/register` duplicate email → 409
  - `POST /auth/login` valid → 200 + token
  - `POST /auth/login` bad credentials → 401
  - `POST /auth/google` with mocked verified token → 200 + token
  - `GET /auth/me` with valid token → 200 + user
  - `GET /auth/me` no token → 401

---

## PHASE 2 — Auth — Frontend

### Frontend
- [x] Wrap `App.jsx` with `GoogleOAuthProvider clientId={VITE_GOOGLE_CLIENT_ID}`
- [x] `features/auth/RegisterPage.jsx` (uses `AuthLayout` with `register.png`):
  - Formik fields: First Name, Phone, Email, Role (select: farmer/admin), Password, Confirm Password
  - "Create Account" button: `bg-primary text-white w-full`
  - "Has account? Sign in" link → `/login`
  - "— Quick Signup With —" divider
  - `GoogleLogin` outlined button
- [x] `features/auth/LoginPage.jsx` (uses `AuthLayout` with `login.png`):
  - Formik fields: Email, Password (eye toggle show/hide)
  - "Sign In" button: `bg-primary text-white w-full`
  - "Forgot password?" link → `/auth/forgot-password` *(extra)*
  - "Don't have an account? Sign up" link → `/register`
  - "— Or continue with —" divider
  - `GoogleLogin` outlined button
- [x] `features/auth/ForgotPasswordPage.jsx` — email input, `forgotPasswordApi`, shows success state *(extra)*
- [x] `features/auth/ResetPasswordPage.jsx` — reads `?token=` from URL, new password + confirm, `resetPasswordApi` *(extra)*
- [x] `features/auth/SetPasswordPage.jsx` — set-password for Google-only users *(extra)*
- [x] `features/auth/api.js`:
  - `registerWithEmailApi(firstName, phone, email, role, password)` → `POST /auth/register`
  - `loginWithEmailApi(email, password)` → `POST /auth/login`
  - `loginWithGoogleApi(credential)` → `POST /auth/google`
  - `getMeApi()` → `GET /auth/me`
  - `logoutApi()` → `POST /auth/logout` *(extra)*
  - `forgotPasswordApi(email)` → `POST /auth/forgot-password` *(extra)*
  - `resetPasswordApi(token, password)` → `POST /auth/reset-password` *(extra)*
  - `setPasswordApi(token, password)` → `POST /auth/set-password` *(extra)*
- [x] `store/authStore.js` — Zustand: `{ user, setAuth, logout }`, persist user to localStorage (no token — HTTP-only cookies) *(changed from original spec)*
- [x] `routes/AuthGuard.jsx` — redirect to `/login` if no `user` in store
- [ ] `routes/RoleGuard.jsx` — redirect if role not permitted
- [x] `routes/index.jsx` — public: `/login`, `/register`, `/auth/set-password`, `/auth/forgot-password`, `/auth/reset-password`; protected: all others with role guards

### Tests
- [ ] `RegisterPage.test.jsx`:
  - renders all 6 fields + Google button
  - shows error for password mismatch
  - calls `registerWithEmailApi` on valid submit
  - shows error toast on 409 (duplicate email)
- [ ] `LoginPage.test.jsx`:
  - renders email + password + Google button
  - shows validation error for empty email
  - calls `loginWithEmailApi` on submit
  - calls `loginWithGoogleApi` on Google callback
  - shows error toast on 401
- [ ] `AuthGuard.test.jsx` — redirects unauthenticated, renders children if authenticated
- [ ] `Sidebar.test.jsx` — admin sees full nav, farmer sees restricted nav

---

## PHASE 3 — Master Data — Backend

### Backend
- [ ] `master/master.query.js`:
  - `getAllCrops()`, `createCrop(name)`, `updateCrop(id, name)`, `softDeleteCrop(id)`
  - `getAllLocations()`, `createLocation(name)`, `updateLocation(id, name)`
  - `getAllBranches()`, `createBranch(name)`, `updateBranch(id, name)`
- [ ] `master/master.controller.js` — handlers for all above
- [ ] `master/master.routes.js` — GET: all roles; POST/PUT/DELETE: admin only
- [ ] `master/master.validation.js` — Joi schemas

### Tests
- [ ] `master.routes.test.js`:
  - create crop → 201
  - duplicate crop name → 409
  - list crops → 200 with array
  - farmer cannot create → 403

---

## PHASE 4 — Master Data — Frontend

### Frontend
- [ ] `features/master/api.js` — `getCrops()`, `getLocations()`, `getBranches()`
- [ ] `features/master/hooks.js` — `useCrops()`, `useLocations()`, `useBranches()` — fetch on mount, cache in module state

### Tests
- [ ] `hooks.test.js` — useCrops returns array, handles API error

---

## PHASE 5 — Farmers — Backend

### Backend
- [ ] `farmers.query.js`:
  - `createUser(firstName, phone, email, hashedPassword, role)`
  - `createFarmer(userId, locationId, branchId)`
  - `assignFarmerCrops(farmerId, cropIds[])` — bulk insert `farmer_crops`
  - `getFarmers(filters, page, limit)` — dynamic WHERE + JOIN users/location/branch/crops
  - `getFarmerById(id)` — full JOIN with crops array
  - `updateFarmer(id, data)`
  - `softDeleteFarmer(id)`
  - `getFarmersForExport(filters)` — no pagination
- [ ] `farmers.service.js`:
  - `createFarmer(data)` — transaction: createUser + createFarmer + assignCrops
  - `updateFarmer(id, data)` — update + re-assign crops in transaction
  - `bulkUploadFarmers(fileBuffer)` — parse CSV/Excel → validate rows → batch insert, return `{ success, errors[] }`
  - `exportFarmers(filters)` — query → CSV string
- [ ] `farmers.controller.js`
- [ ] `farmers.routes.js` — writes: admin only; `POST /farmers/bulk-upload`, `GET /farmers/export`
- [ ] `farmers.validation.js`

### Tests
- [ ] `farmers.service.test.js`:
  - create farmer: user + farmer + crops in transaction
  - transaction rollback if crop insert fails
  - bulk upload skips invalid rows, returns error list
  - filter: `status=active` returns only active farmers
- [ ] `farmers.routes.test.js`:
  - `POST /farmers` → 201
  - `GET /farmers?status=active&location=1` → paginated
  - `PUT /farmers/:id` → 200
  - `DELETE /farmers/:id` → soft deleted, absent from list
  - `POST /farmers/bulk-upload` — valid CSV → 200 with summary
  - `GET /farmers/export` — returns `text/csv` content-type

---

## PHASE 6 — Farmers — Frontend

### Frontend
- [ ] `features/farmers/FarmerListPage.jsx` — `DataTable` + `FilterBar` (location, branch, crop, status)
- [ ] `features/farmers/FarmerCreatePage.jsx` — Formik: first name, phone, email, location, branch, crops `MultiSelect`
- [ ] `features/farmers/FarmerEditPage.jsx` — pre-fill form, update on submit
- [ ] `features/farmers/BulkUploadModal.jsx` — `Modal` + `FileUpload` + success/error summary
- [ ] `features/farmers/api.js`
- [ ] `features/farmers/hooks.js` — `useFarmers(filters)`, `useCreateFarmer()`, `useDeleteFarmer()`

### Tests
- [ ] `FarmerListPage.test.jsx` — renders table rows, filter changes update query params
- [ ] `FarmerCreatePage.test.jsx` — validation errors, submit calls api with correct payload

---

## PHASE 7 — Demand Planning — Backend

### Backend
- [ ] `demand.query.js`:
  - `createDemand(data)` — insert with `remaining_quantity = total_quantity`
  - `getDemands(filters, page, limit)` — dynamic WHERE: crop/location/date range
  - `getDemandById(id)` — JOIN crop + location
  - `updateDemand(id, data)`
  - `softDeleteDemand(id)`
  - `getAllFarmerUserIds()` — for notification targeting
- [ ] `demand.service.js`:
  - `createDemand(data, createdBy)` — insert → get all farmer IDs → call NotificationService
  - `updateDemand(id, data)` — update → notify all farmers
- [ ] `demand.controller.js`
- [ ] `demand.routes.js` — create/update/delete: admin only; list: all roles
- [ ] `demand.validation.js`

### Tests
- [ ] `demand.service.test.js`:
  - create demand creates notification for all farmers
  - update demand triggers notification
  - `remaining_quantity` equals `total_quantity` on creation
- [ ] `demand.routes.test.js` — CRUD, filters, farmer cannot create (403)

---

## PHASE 8 — Demand Planning — Frontend

### Frontend
- [ ] `features/demand/DemandListPage.jsx` — `DataTable` + `FilterBar` (crop, location, date) + `ProgressBar` for remaining qty
- [ ] `features/demand/DemandCreatePage.jsx` — Formik: crop `SelectInput`, location `SelectInput`, quantity, unit
- [ ] `features/demand/DemandEditPage.jsx` — pre-fill + update
- [ ] `features/demand/DemandDetailPage.jsx` — demand info + bookings list
- [ ] `features/demand/api.js`
- [ ] `features/demand/hooks.js`

### Tests
- [ ] `DemandListPage.test.jsx` — renders list, `ProgressBar` shows remaining/total
- [ ] `DemandCreatePage.test.jsx` — validation, submit calls api

---

## PHASE 9 — Demand Booking — Backend (CRITICAL)

### Backend
- [ ] `booking.query.js`:
  - `getDemandForUpdate(demandId, conn)` — `SELECT ... FOR UPDATE` on existing connection
  - `insertBooking(demandId, farmerId, quantity, conn)`
  - `deductRemainingQuantity(demandId, quantity, conn)`
  - `getBookings(filters)` — admin: all; farmer: own only
- [ ] `booking.service.js` — full transaction flow:
  ```
  withTransaction(async (conn) => {
    demand = getDemandForUpdate(demandId, conn)   // row lock
    validate: quantity <= demand.remaining_quantity
    insertBooking(demandId, farmerId, quantity, conn)
    deductRemainingQuantity(demandId, quantity, conn)
  })
  // after commit:
  notificationService.send(...)
  fcm.sendPush(...)
  ```
- [ ] `booking.controller.js`
- [ ] `booking.routes.js` — POST: farmer only; GET: admin sees all, farmer sees own
- [ ] `booking.validation.js`

### Tests
- [ ] `booking.service.test.js`:
  - valid booking: `remaining_quantity` decremented correctly
  - overbooking: throws, quantity unchanged
  - exact remaining: succeeds, remaining = 0
  - rollback on any error: DB unchanged
- [ ] `booking.routes.test.js`:
  - farmer books → 201, remaining decremented
  - admin cannot book → 403
  - quantity > remaining → 400
- [ ] `booking.concurrency.test.js`:
  - 10 simultaneous requests for 1 remaining unit → exactly 1 succeeds, 9 fail with 400
  - `remaining_quantity` in DB = 0 after test

---

## PHASE 10 — Demand Booking — Frontend

### Frontend
- [ ] `features/booking/DemandBookingPage.jsx` — demand list with `ProgressBar`, "Book" button per row (disabled if remaining = 0)
- [ ] `features/booking/BookingFormModal.jsx` — `Modal` + quantity input, client-side max = remaining, `ConfirmDialog` before submit
- [ ] `features/booking/MyBookingsPage.jsx` — farmer's booking history using `DataTable`
- [ ] `features/booking/api.js`
- [ ] `features/booking/hooks.js`

### Tests
- [ ] `DemandBookingPage.test.jsx` — shows remaining, Book button disabled when remaining = 0
- [ ] `BookingFormModal.test.jsx` — quantity > remaining shows validation error, submit calls api

---

## PHASE 11 — Notifications — Backend

### Backend
- [ ] `config/firebase.js` — initialize Firebase Admin SDK from service account env var
- [ ] `utils/fcm.js` — `sendPushToUsers(userIds[], title, body, data)` — fetch tokens → FCM batch send
- [ ] `notifications.query.js`:
  - `createBulkNotifications(records[])` — bulk INSERT
  - `getNotifications(userId, filters, page, limit)`
  - `markNotificationRead(id, userId)`
  - `markAllNotificationsRead(userId)`
  - `getUserDeviceTokens(userIds[])`
- [ ] `notifications.service.js` — `sendNotification(userIds, type, title, message, data)`:
  1. bulk insert into `notifications`
  2. fetch device tokens for userIds
  3. send FCM — catch failure, log, never throw
- [ ] `notifications.controller.js` — `GET /notifications`, `PATCH /:id/read`, `PATCH /read-all`
- [ ] `devices.controller.js` — `POST /devices/register`, `DELETE /devices/:id`
- [ ] `notifications.routes.js` + `devices.routes.js`
- [ ] Wire `notificationService.sendNotification` into: demand.service + booking.service

### Tests
- [ ] `notifications.service.test.js`:
  - bulk insert creates correct number of records
  - FCM failure caught + logged, does not throw
  - `markAllRead` updates only the requesting user's records
- [ ] `notifications.routes.test.js` — list with filters, pagination, mark read

---

## PHASE 12 — Notifications — Frontend

### Frontend
- [ ] `features/notifications/NotificationListPage.jsx` — paginated `DataTable`, filter by type/is_read, mark single read on click
- [ ] `components/layout/Header.jsx` — notification bell with unread count badge (wired to `notificationStore`)
- [ ] `store/notificationStore.js` — Zustand: `{ unreadCount }`, poll `GET /notifications?is_read=false` every 30s
- [ ] `features/notifications/api.js` — `getNotifications(filters)`, `markRead(id)`, `markAllRead()`

### Tests
- [ ] `NotificationListPage.test.jsx` — renders list, mark-read updates row style
- [ ] `notificationStore.test.js` — unread count updates on poll

---

## PHASE 13 — Weather Alert — Backend

> No frontend needed — internal cron only.

### Backend
- [ ] `weather.query.js` — `logWeatherEvent(type, message)`, `getActiveLocationNames()`
- [ ] `weather.service.js` — `runWeatherCheck()`:
  - fetch active location names
  - call OpenWeatherMap API for each location
  - detect: rain intensity > threshold, storm codes, extreme temp
  - call `notificationService.sendNotification` for all farmers
  - log detected events to `weather_logs`
- [ ] `weather.cron.js` — `cron.schedule('0 */6 * * *', runWeatherCheck)` (every 6 hours)
- [ ] Register cron in `server.js` on startup

### Tests
- [ ] `weather.service.test.js`:
  - mock axios for OpenWeatherMap
  - rain condition detected → notification created for all farmers
  - API failure caught + logged, process does not crash

---

## PHASE 14 — Inventory — Backend

### Backend
- [ ] `inventory.query.js`:
  - `getInventory(filters)` — JOIN crop + location
  - `adjustInventory(id, changeAmount, conn)` — `UPDATE inventory SET quantity = quantity + ?`
  - `insertInventoryLog(inventoryId, changeAmount, reason, conn)`
  - `getInventoryLogs(inventoryId, page, limit)`
- [ ] `inventory.service.js` — `adjustInventory(id, changeAmount, reason)` — transaction: update + log together
- [ ] `inventory.controller.js` — `GET /inventory`, `POST /inventory/adjust`, `GET /inventory/:id/logs`
- [ ] `inventory.routes.js` — admin only

### Tests
- [ ] `inventory.service.test.js`:
  - adjustment updates quantity and creates log in same transaction
  - rollback on error: quantity and log both unchanged
- [ ] `inventory.routes.test.js` — list, adjust, logs

---

## PHASE 15 — Inventory — Frontend

### Frontend
- [ ] `features/inventory/InventoryListPage.jsx` — `DataTable` + `FilterBar` (location, crop)
- [ ] `features/inventory/AdjustModal.jsx` — `Modal` + change amount (±) + reason `FormField`
- [ ] `features/inventory/InventoryLogsPage.jsx` — `DataTable` for log history of one inventory item
- [ ] `features/inventory/api.js`
- [ ] `features/inventory/hooks.js`

### Tests
- [ ] `AdjustModal.test.jsx` — renders, validates, submits correctly

---

## PHASE 16 — Reports — Backend

### Backend
- [ ] `reports.query.js`:
  - `getCollectionReport(filters)` — SUM bookings grouped by crop/location/date
  - `getCommitmentReport(filters)` — per-farmer booking totals
- [ ] `reports.service.js`:
  - `getReport(type, filters)` — query + format rows
  - `exportReport(type, filters, format)` — generate CSV or Excel buffer using `xlsx`
- [ ] `reports.controller.js` — `GET /reports/collection`, `GET /reports/commitment`, `GET /reports/export`
- [ ] `reports.routes.js` — admin only

### Tests
- [ ] `reports.service.test.js`:
  - collection report sums quantities correctly per location + date
  - date range filter excludes records outside range
- [ ] `reports.routes.test.js` — export returns correct `Content-Type` header

---

## PHASE 17 — Reports — Frontend

### Frontend
- [ ] `features/reports/ReportsPage.jsx`:
  - Tab: Collection / Commitment
  - `FilterBar`: location `SelectInput`, crop `SelectInput`, `DateRangePicker`
  - `DataTable` preview of results
  - Export button → download CSV or Excel
- [ ] `features/reports/api.js`
- [ ] `features/reports/hooks.js`

### Tests
- [ ] `ReportsPage.test.jsx` — filter change updates table, export button calls correct api

---

## PHASE 18 — Dashboard — Backend

### Backend
- [ ] `dashboard.query.js` — single SQL: `COUNT(*) total, SUM(status='active') active, SUM(status='pending') pending, SUM(status='suspended') suspended FROM farmers WHERE is_deleted=false`
- [ ] `dashboard.controller.js` — `GET /dashboard`
- [ ] `dashboard.routes.js` — admin + super_admin only

### Tests
- [ ] `dashboard.routes.test.js` — returns correct counts after inserting test farmers with each status

---

## PHASE 19 — Dashboard — Frontend

### Frontend
- [ ] `features/dashboard/DashboardPage.jsx` — 4 `StatCard` components: Total / Active / Pending / Suspended
- [ ] Quick-link cards: Go to Farmers, Go to Demand, Go to Reports
- [ ] `features/dashboard/api.js`

### Tests
- [ ] `DashboardPage.test.jsx` — renders all 4 `StatCard` components with values from API

---

## PHASE 20 — Testing & QA

### E2E (Playwright)
- [ ] `e2e/auth.spec.js` — register, email login, Google login (mocked), logout
- [ ] `e2e/farmers.spec.js` — admin creates farmer, views list, edits, soft deletes
- [ ] `e2e/demand.spec.js` — admin creates demand, farmer sees it in list
- [ ] `e2e/booking.spec.js` — farmer books, remaining quantity decreases, confirmation shown
- [ ] `e2e/notifications.spec.js` — bell count increases after booking, mark read clears it
- [ ] `e2e/reports.spec.js` — filter report, export downloads file with correct name

### Coverage Review
- [ ] Backend services: minimum 80% (booking.service: 100%)
- [ ] All API routes: at least one integration test each
- [ ] All Formik forms: at least one validation test each

### Final Checks
- [ ] Manual concurrency test: booking endpoint under load
- [ ] Verify all queries include `WHERE is_deleted = false`
- [ ] Verify all booking code paths use `SELECT ... FOR UPDATE` inside transaction
- [ ] Fix any regressions found in QA

---

## Code Quality (applies throughout all phases)

- [ ] `ESLint` configured for both `server/` and `client/`
- [ ] `Prettier` configured for both
- [ ] `Husky` pre-commit hook: lint-staged runs ESLint + Prettier on staged files
- [ ] `npm run lint` and `npm run format` scripts in both `package.json` files

---
