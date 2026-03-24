# Development Phases
## Agri Demand & Farmer Management System

---

## Overview

> **Rule:** Backend of a module is completed first, tests pass, then the frontend for that same module is built immediately after. Never batch all backends then all frontends.

| Phase | Layer | Name | Deliverable |
|---|---|---|---|
| 0 | Both | Project Setup & Infrastructure | Dev environment running, DB connected |
| 1 | Backend | Auth — Backend | Login (email + Google OAuth), JWT, RBAC, middlewares |
| 2 | Frontend | Auth — Frontend | Login page with email/password + Google Sign-In button |
| 3 | Backend | Master Data — Backend | Crops, Locations, Branches CRUD APIs |
| 4 | Frontend | Master Data — Frontend | Shared dropdown components for all features |
| 5 | Backend | Farmers — Backend | Full farmer CRUD, bulk upload, export |
| 6 | Frontend | Farmers — Frontend | Farmer list, create/edit form, bulk upload UI |
| 7 | Backend | Demand Planning — Backend | Demand CRUD with dynamic remaining_quantity |
| 8 | Frontend | Demand Planning — Frontend | Demand list, create/edit form |
| 9 | Backend | Demand Booking — Backend | Transaction-safe booking, no overbooking |
| 10 | Frontend | Demand Booking — Frontend | Farmer booking UI with remaining quantity display |
| 11 | Backend | Notifications — Backend | DB + FCM push notification system |
| 12 | Frontend | Notifications — Frontend | Notification list page, bell icon, mark read |
| 13 | Backend | Weather Alert — Backend | Cron job, OpenWeatherMap, weather alerts (no frontend) |
| 14 | Backend | Inventory — Backend | View, adjust, log inventory |
| 15 | Frontend | Inventory — Frontend | Inventory table, adjustment form, logs view |
| 16 | Backend | Reports — Backend | Collection + commitment reports, CSV/Excel export |
| 17 | Frontend | Reports — Frontend | Filter form, table preview, export button |
| 18 | Backend | Dashboard — Backend | Farmer metrics aggregation API |
| 19 | Frontend | Dashboard — Frontend | Metric cards, quick links |
| 20 | Both | Testing & QA | E2E flows, concurrency tests, coverage review |

---

## Phase 0 — Project Setup & Infrastructure

**Goal:** Everyone can run the project locally with one command.

### Server Setup
- [ ] Initialize `server/` with `npm init`
- [ ] Install core dependencies: `express`, `mysql2`, `dotenv`, `jsonwebtoken`, `bcrypt`, `joi`, `winston`, `morgan`, `multer`, `csv-parser`, `xlsx`, `node-cron`, `firebase-admin`, `google-auth-library`
- [ ] Install dev dependencies: `jest`, `supertest`, `nodemon`, `eslint`, `prettier`
- [x] `server/src/app.js` — Express app, mount middlewares, mount all routes (includes `cookie-parser`, CORS with `credentials: true`)
- [ ] `server/src/server.js` — HTTP server start, DB connect, cron register
- [x] `server/src/config/env.js` — load + validate all required env vars on startup (uses `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV`, `CLIENT_URL`)
- [x] `server/src/database/pool.js` — mysql2 createPool, export promise pool
- [ ] `server/src/database/transaction.js` — `withTransaction(callback)` helper
- [ ] `server/src/middlewares/errorHandler.js` — global catch-all error middleware
- [ ] `server/src/utils/response.js` — `successResponse`, `errorResponse` helpers
- [ ] `server/src/utils/logger.js` — Winston logger (file + console)
- [ ] `server/.env.example` — all variables documented
- [x] `server/migrations/001_init_schema.sql` — all tables + indexes from DB_DESIGN.md
  - `google_id VARCHAR(255)` and `auth_type ENUM('email','google','both') DEFAULT 'email'` in `users` table
  - `password_reset_token`, `password_reset_expires` columns in `users`
- [x] `server/migrations/003_refresh_tokens.sql` — `ALTER TABLE users ADD COLUMN refresh_token TEXT NULL` *(extra — added for cookie-based auth)*

### Docker Setup (MySQL)
- [x] `docker-compose.yml` at root — MySQL 8, port `3306:3306` (connect via TablePlus/DBeaver on localhost:3306)
- [x] Set env vars: `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`
- [x] `server/src/database/migrate.js` — auto migration runner:
  - On startup: creates `_migrations` table if not exists
  - Reads all `server/migrations/*.sql` files sorted numerically
  - Skips already-recorded files, executes new ones in order
  - Inserts filename into `_migrations` after success
  - Called automatically at the top of `server.js` before HTTP listen
- [ ] `npm run migrate` script in `server/package.json` — run migrations standalone
- [ ] First migration `001_init_schema.sql` includes seed: super_admin user with bcrypt-hashed password

### Client Setup
- [x] Initialize `client/` with `npm create vite@latest` (React + JS)
- [x] Install: `tailwindcss`, `@shadcn/ui`, `zustand`, `axios`, `formik`, `yup`, `react-router-dom`, `@tanstack/react-table`, `sonner`, `@react-oauth/google`
- [ ] Install dev: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@playwright/test`
- [ ] Configure Tailwind CSS + shadcn/ui base components
- [x] `client/src/services/api.js` — Axios instance, `withCredentials: true`, silent refresh interceptor (queues requests during refresh, redirects on failure)
- [x] `client/src/routes/index.jsx` — route groups (public, admin-only, farmer-only); includes `/auth/forgot-password`, `/auth/reset-password`, `/auth/set-password`
- [x] `client/src/routes/AuthGuard.jsx` — redirect unauthenticated users (checks `user` only, tokens in HTTP-only cookies)
- [x] `client/src/components/layout/AppLayout.jsx` — sidebar + header shell for protected pages
- [x] `client/src/components/layout/Sidebar.jsx` — role-aware nav, calls `logoutApi()` before clearing store
- [x] `client/src/components/layout/Header.jsx` — page title left, logout support
- [x] `client/src/store/authStore.js` — Zustand: `{ user, setAuth, logout }` (no token — cookie-based auth) *(extra — token removed vs original spec)*
- [ ] `client/.env.example` — `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`
- [ ] Configure Vitest in `vite.config.js` + `vitest.setup.js`
- [ ] Configure Playwright in `playwright.config.js`
- [x] `404.jsx` page (NotFound)

### Acceptance Criteria
- `docker-compose up` starts MySQL without errors
- `npm run dev` (server) connects to DB, responds 200 on `GET /health`
- `npm run dev` (client) opens React app, redirects to `/login`

---

## Phase 1 — Auth — Backend

**Goal:** Email/password register + login AND Google OAuth working, JWT issued for all flows.

### Backend
- [x] `auth.query.js`:
  - `findUserByEmail(email)`
  - `findUserByGoogleId(googleId)`
  - `createEmailUser(firstName, phone, email, hashedPassword, role)` — `auth_type='email'`
  - `createGoogleUser(firstName, email, googleId, role)` — `auth_type='google'`
  - `getUserById(id)`
  - `freeDeletedUserEmail(email)` — renames soft-deleted email to release UNIQUE constraint *(extra)*
  - `freeDeletedUserGoogleId(googleId)` — sets `google_id = NULL` for soft-deleted users *(extra)*
  - `saveRefreshToken(userId, token)` — stores refresh token in DB *(extra)*
  - `findUserByRefreshToken(token)` *(extra)*
  - `clearRefreshToken(userId)` *(extra)*
  - `savePasswordResetToken(userId, token, expires)` *(extra)*
  - `findUserByResetToken(token)` *(extra)*
  - `createFarmerRecord(userId)` *(extra — separated from service)*
- [x] `config/google.js` — initialize `OAuth2Client` with `GOOGLE_CLIENT_ID`
- [x] `auth.service.js`:
  - `register(...)` — check duplicate → bcrypt.hash → createEmailUser → farmer record → issue tokens
  - `loginWithEmail(email, password)` — find user → bcrypt.compare → returns `PASSWORD_NOT_SET` error for Google-only users → issue tokens
  - `loginWithGoogle(credential)` — verify token → freeDeletedUserGoogleId → find or create user → issue tokens
  - `getMe(userId)`
  - `refreshAccessToken(token)` — validates DB refresh token, rotates it *(extra)*
  - `logout(userId)` — clears refresh token from DB *(extra)*
  - `forgotPassword(email)` — generates reset token, sends via Resend email *(extra)*
  - `resetPassword(token, newPassword)` — validates token, sets new password, clears token *(extra)*
  - `requestSetPassword(userId, email)` — sends set-password link for Google-only users *(extra)*
- [x] `auth.controller.js`:
  - `POST /auth/register` — email/password registration
  - `POST /auth/login` — email/password login
  - `POST /auth/google` — Google ID token (handles both register + login)
  - `GET /auth/me`
  - `POST /auth/refresh` — rotates refresh token, issues new access token *(extra)*
  - `POST /auth/logout` — clears cookies + DB refresh token *(extra)*
  - `POST /auth/forgot-password` *(extra)*
  - `POST /auth/reset-password` *(extra)*
  - `POST /auth/set-password` *(extra)*
- [x] `auth.routes.js`
- [x] `auth.validation.js` — Joi schemas: register, login, forgotPassword, resetPassword, setPassword *(extra schemas added)*
- [x] `middlewares/verifyToken.js` — reads from `req.cookies.access_token`, attaches `req.user`, 401 if invalid
- [x] `middlewares/authorizeRole.js` — `authorizeRole(['admin'])` — 403 if mismatch
- [x] `middlewares/validate.js` — Joi middleware factory
- [x] Access token: 15 min, Refresh token: 7 days, both HTTP-only cookies *(extra — replaces localStorage JWT)*

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
  - `GET /auth/me` with token → 200 + user
  - `GET /auth/me` no token → 401

### Acceptance Criteria
- Register creates user and returns JWT immediately (auto-login after register)
- Both login flows return JWT with `{ id, role, email, firstName }`
- Duplicate email on register returns 409 with clear message
- Google user created automatically on first sign-in
- Protected routes return 401/403 correctly

---

## Phase 2 — Auth — Frontend

**Goal:** Register + Login pages with reference design (split illustration/form layout), Google Sign-In, token stored in Zustand.

### Design Reference
- Auth layout: gray background, centered card (image left panel, form right panel)
- Left panel: full image (`object-contain`, white bg) — `login.png` / `register.png`
- Right panel: white, form centered vertically
- Primary color: `#4B9B4D` for buttons and focus states
- Google button: outlined, Google logo icon

### Frontend — Bootstrap
- [x] Wrap `App.jsx` with `GoogleOAuthProvider clientId={VITE_GOOGLE_CLIENT_ID}`
- [ ] Configure Tailwind with design tokens: `primary: #4B9B4D`, `sidebar-bg: #1E5C20`
- [x] `components/layout/AuthLayout.jsx` — card layout: gray bg, image left panel (`object-contain`), form right panel; no text overlay on image
- [x] `components/layout/AppLayout.jsx` — sidebar + header shell for protected pages
- [x] `components/layout/Sidebar.jsx`:
  - Background `#1E5C20`, width `w-56`
  - Logo "FPO" white bold text
  - Role-aware nav items: Dashboard, Farmers, Demand Planning, Reports, Inventory, Logout
  - Active item: `bg-[#2D7A30]`
  - Calls `logoutApi()` before clearing store on logout
- [x] `components/layout/Header.jsx` — page title left, logout support

### Frontend — Register Page
- [x] `features/auth/RegisterPage.jsx`:
  - Uses `AuthLayout` with `register.png`
  - Formik fields: First Name, Phone, Email, Role (select: farmer/admin), Password, Confirm Password
  - "Create Account" primary button (full width, `#4B9B4D`)
  - "Has account? Sign in" link → `/login`
  - "— Quick Signup With —" divider
  - `GoogleLogin` button (outlined style) → calls `loginWithGoogleApi`

### Frontend — Login Page
- [x] `features/auth/LoginPage.jsx`:
  - Uses `AuthLayout` with `login.png`
  - Formik fields: Email, Password (with show/hide eye toggle)
  - "Sign In" primary button (full width)
  - "Forgot password?" link → `/auth/forgot-password` *(extra)*
  - "Don't have an account? Sign up" link → `/register`
  - "— Or continue with —" divider
  - `GoogleLogin` button

### Frontend — Extra Auth Pages *(added beyond original spec)*
- [x] `features/auth/ForgotPasswordPage.jsx` — email input, calls `forgotPasswordApi`, shows success state
- [x] `features/auth/ResetPasswordPage.jsx` — reads `?token=` from URL, new password + confirm, calls `resetPasswordApi`
- [x] `features/auth/SetPasswordPage.jsx` — same as reset but for Google-only users setting password for first time

### Frontend — API & Store
- [x] `features/auth/api.js`:
  - `loginWithEmailApi(email, password)` → `POST /auth/login`
  - `registerWithEmailApi(firstName, phone, email, role, password)` → `POST /auth/register`
  - `loginWithGoogleApi(credential)` → `POST /auth/google`
  - `getMeApi()` → `GET /auth/me`
  - `logoutApi()` → `POST /auth/logout` *(extra)*
  - `forgotPasswordApi(email)` → `POST /auth/forgot-password` *(extra)*
  - `resetPasswordApi(token, password)` → `POST /auth/reset-password` *(extra)*
  - `setPasswordApi(token, password)` → `POST /auth/set-password` *(extra)*
- [x] `store/authStore.js` — Zustand: `{ user, setAuth, logout }`, persist user to localStorage (no token — HTTP-only cookies) *(changed from original spec)*
- [x] `routes/AuthGuard.jsx` — redirect to `/login` if no `user` in store
- [ ] `routes/RoleGuard.jsx` — redirect if role not permitted
- [x] `routes/index.jsx` — public: `/login`, `/register`, `/auth/set-password`, `/auth/forgot-password`, `/auth/reset-password`; protected per role

### Tests
- [ ] `RegisterPage.test.jsx`:
  - renders all 6 fields + Google button
  - shows validation error for password mismatch
  - shows validation error for invalid phone number
  - calls `registerWithEmailApi` with correct payload on valid submit
  - redirects to dashboard on success
- [ ] `LoginPage.test.jsx`:
  - renders email + password + Google button
  - shows validation error for empty email
  - calls `loginWithEmailApi` on submit
  - calls `loginWithGoogleApi` on Google callback
  - shows error toast on 401
- [ ] `AuthGuard.test.jsx` — redirects unauthenticated, renders children if authenticated

### Acceptance Criteria
- [x] Register page: card layout, `register.png` left, form right
- [x] Login page: card layout, `login.png` left, form right
- [x] Both Google and email flows set HTTP-only cookies and redirect (farmer → `/demand`, admin → `/dashboard`)
- [x] User object persists across page reload (localStorage), tokens in HTTP-only cookies
- [x] Role-based routing: farmer → `/demand`, admin → `/dashboard`
- [x] Forgot password email sent via Resend
- [x] Reset/set password token validated server-side with expiry check

---

## Phase 3 — Master Data — Backend

**Goal:** CRUD APIs for crops, locations, and branches (used as dropdowns throughout the app).

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
  - farmer cannot create crop → 403

### Acceptance Criteria
- All list endpoints return arrays sorted by name
- Duplicate name returns 409 with clear message
- Soft delete removes from list but keeps record

---

## Phase 4 — Master Data — Frontend

**Goal:** Shared dropdown components using master data, ready for use in all future feature forms.

### Frontend
- [ ] `features/master/api.js` — `getCrops()`, `getLocations()`, `getBranches()`
- [ ] `features/master/hooks.js` — `useCrops()`, `useLocations()`, `useBranches()` — fetch on mount, cache in module state
- [ ] `components/ui/CropSelect.jsx` — reusable crop dropdown (single + multi)
- [ ] `components/ui/LocationSelect.jsx`
- [ ] `components/ui/BranchSelect.jsx`

### Tests
- [ ] `CropSelect.test.jsx` — renders options, calls onChange correctly

---

## Phase 5 — Farmers — Backend

**Goal:** Admin can create, manage, bulk upload, and export farmers.

### Backend
- [ ] `farmers.query.js`:
  - `createUser(name, email, password, role)`
  - `createFarmer(userId, locationId, branchId)`
  - `assignFarmerCrops(farmerId, cropIds[])`
  - `getFarmers(filters, page, limit)` — dynamic WHERE + JOIN users/location/branch/crops
  - `getFarmerById(id)` — full JOIN with crops array
  - `updateFarmer(id, data)`
  - `softDeleteFarmer(id)`
  - `getFarmersForExport(filters)` — no pagination
- [ ] `farmers.service.js`:
  - `createFarmer(data)` — transaction: createUser + createFarmer + assignCrops
  - `updateFarmer(id, data)` — update + re-assign crops in transaction
  - `bulkUploadFarmers(fileBuffer)` — parse CSV/Excel → validate rows → batch insert, return `{ success, errors }`
  - `exportFarmers(filters)` — query → CSV string
- [ ] `farmers.controller.js`
- [ ] `farmers.routes.js` — writes: admin only; `POST /farmers/bulk-upload`, `GET /farmers/export`
- [ ] `farmers.validation.js`

### Tests
- [ ] `farmers.service.test.js`:
  - create farmer: user + farmer + crops created in transaction
  - transaction rollback if crop insert fails
  - bulk upload skips invalid rows, returns error list
  - filter: status=active returns only active
- [ ] `farmers.routes.test.js`:
  - `POST /farmers` → 201
  - `GET /farmers?status=active&location=1` → paginated result
  - `PUT /farmers/:id` → 200
  - `DELETE /farmers/:id` → soft deleted, absent from list
  - `POST /farmers/bulk-upload` — valid CSV → 200 with summary
  - `GET /farmers/export` — returns CSV content-type header

### Acceptance Criteria
- Farmer list supports all filter combinations with pagination
- Bulk upload skips malformed rows without crashing, returns error summary
- Export CSV headers match farmer fields

---

## Phase 6 — Farmers — Frontend

**Goal:** Full farmer management UI for admin.

### Frontend
- [ ] `features/farmers/FarmerListPage.jsx` — TanStack Table + filter sidebar (location, branch, crop, status)
- [ ] `features/farmers/FarmerCreatePage.jsx` — Formik form: name, email, password, location, branch, crops multiselect
- [ ] `features/farmers/FarmerEditPage.jsx` — pre-fill form, update on submit
- [ ] `features/farmers/BulkUploadModal.jsx` — file input, upload, show success/error summary
- [ ] `features/farmers/api.js` — all farmer API calls
- [ ] `features/farmers/hooks.js` — `useFarmers(filters)`, `useCreateFarmer()`, `useDeleteFarmer()`

### Tests
- [ ] `FarmerListPage.test.jsx` — renders table rows, filter changes update query params
- [ ] `FarmerCreatePage.test.jsx` — validation errors, submit calls api with correct payload

### Acceptance Criteria
- Filter changes reflect in URL query params and re-fetch data
- Bulk upload shows row-level error summary
- Table supports sort by name, status, location

---

## Phase 7 — Demand Planning — Backend

**Goal:** Admin can create and manage crop demand. Remaining quantity tracks dynamically.

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

### Acceptance Criteria
- `remaining_quantity` = `total_quantity` on creation
- Notifications created for all active farmers on create/update
- Date range filter works correctly

---

## Phase 8 — Demand Planning — Frontend

**Goal:** Admin manages demand, all roles can view demand list.

### Frontend
- [ ] `features/demand/DemandListPage.jsx` — TanStack Table, remaining quantity progress bar, filters: crop/location/date
- [ ] `features/demand/DemandCreatePage.jsx` — Formik: crop (select), location (select), quantity, unit
- [ ] `features/demand/DemandEditPage.jsx` — pre-fill + update
- [ ] `features/demand/DemandDetailPage.jsx` — demand info + list of bookings made against it
- [ ] `features/demand/api.js`
- [ ] `features/demand/hooks.js`

### Tests
- [ ] `DemandListPage.test.jsx` — renders list, progress bar shows remaining/total
- [ ] `DemandCreatePage.test.jsx` — validation, submit calls api

---

## Phase 9 — Demand Booking — Backend (CRITICAL)

**Goal:** Farmers book demand safely with zero overbooking under concurrent load.

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
  // after commit — outside transaction:
  notificationService.send(...)
  fcm.sendPush(...)
  ```
- [ ] `booking.controller.js` — POST /bookings, GET /bookings
- [ ] `booking.routes.js` — POST: farmer only; GET: admin sees all, farmer sees own
- [ ] `booking.validation.js`

### Tests
- [ ] `booking.service.test.js`:
  - valid booking: remaining_quantity decremented correctly
  - overbooking attempt: throws, quantity unchanged
  - exact remaining: succeeds, remaining = 0
  - transaction rollback on any error: DB unchanged
- [ ] `booking.routes.test.js`:
  - farmer books → 201, remaining decremented
  - admin cannot book → 403
  - quantity > remaining → 400
- [ ] `booking.concurrency.test.js`:
  - 10 simultaneous requests for 1 remaining unit → exactly 1 succeeds, 9 fail with 400
  - `remaining_quantity` in DB = 0 after test

### Acceptance Criteria
- 100 concurrent requests for 10-unit demand: exactly 10 succeed, 90 fail with 400
- `remaining_quantity` never goes below 0
- Rollback leaves DB unchanged on any failure

---

## Phase 10 — Demand Booking — Frontend

**Goal:** Farmer views available demand and books quantity.

### Frontend
- [ ] `features/booking/DemandBookingPage.jsx` — farmer sees demand list, remaining qty, "Book" button per row
- [ ] `features/booking/BookingFormModal.jsx` — quantity input, validate client-side (max = remaining), confirm submit
- [ ] `features/booking/MyBookingsPage.jsx` — farmer's own booking history (TanStack Table)
- [ ] `features/booking/api.js`
- [ ] `features/booking/hooks.js`

### Tests
- [ ] `DemandBookingPage.test.jsx` — shows remaining quantity, Book button disabled if remaining = 0
- [ ] `BookingFormModal.test.jsx` — quantity > remaining shows validation error, submit calls api

---

## Phase 11 — Notifications — Backend

**Goal:** Every system event creates DB notifications and fires FCM push.

### Backend
- [ ] `config/firebase.js` — initialize Firebase Admin SDK from service account JSON env var
- [ ] `utils/fcm.js` — `sendPushToUsers(userIds[], title, body, data)` — fetch tokens → call FCM batch send
- [ ] `notifications.query.js`:
  - `createBulkNotifications(records[])` — bulk INSERT
  - `getNotifications(userId, filters, page, limit)`
  - `markNotificationRead(id, userId)`
  - `markAllNotificationsRead(userId)`
  - `getUserDeviceTokens(userIds[])`
- [ ] `notifications.service.js` — `sendNotification(userIds, type, title, message, data)`:
  1. bulk insert into `notifications`
  2. fetch device tokens for userIds
  3. send FCM — catch failure, log, continue (never throws)
- [ ] `notifications.controller.js` — `GET /notifications`, `PATCH /:id/read`, `PATCH /read-all`
- [ ] `devices.controller.js` — `POST /devices/register`, `DELETE /devices/:id`
- [ ] `notifications.routes.js` + `devices.routes.js`
- [ ] Wire `notificationService.sendNotification` into: demand.service (create/update) + booking.service (done)

### Tests
- [ ] `notifications.service.test.js`:
  - bulk insert creates correct number of records
  - FCM failure is caught and logged, does not throw
  - `markAllRead` updates only the requesting user's records
- [ ] `notifications.routes.test.js` — list with filters, pagination, mark read

### Acceptance Criteria
- Every demand/booking event creates records for all target users before FCM is attempted
- FCM failure never fails the parent operation
- `GET /notifications` returns paginated results filtered by type and is_read

---

## Phase 12 — Notifications — Frontend

**Goal:** Users see their notifications and can mark them read.

### Frontend
- [ ] `features/notifications/NotificationListPage.jsx` — paginated list, filter by type/is_read, mark single read on click
- [ ] `components/NotificationBell.jsx` — unread count badge in header, dropdown preview of latest 5
- [ ] `store/notificationStore.js` — Zustand: `{ unreadCount }`, poll `GET /notifications?is_read=false` every 30s
- [ ] `features/notifications/api.js` — `getNotifications(filters)`, `markRead(id)`, `markAllRead()`

### Tests
- [ ] `NotificationBell.test.jsx` — shows correct unread count, dropdown renders
- [ ] `NotificationListPage.test.jsx` — renders list, mark-read updates row style

---

## Phase 13 — Weather Alert — Backend

**Goal:** Cron job automatically alerts all farmers about severe weather. No frontend needed.

### Backend
- [ ] `weather.query.js` — `logWeatherEvent(type, message)`, `getActiveLocationNames()`
- [ ] `weather.service.js` — `runWeatherCheck()`:
  - fetch active location names
  - call OpenWeatherMap API for each
  - detect: rain intensity > threshold, storm condition codes, extreme temp
  - call `notificationService.sendNotification` for all farmers
  - log detected events to `weather_logs`
- [ ] `weather.cron.js` — `cron.schedule('0 */6 * * *', runWeatherCheck)` — every 6 hours
- [ ] Register cron in `server.js` on startup

### Tests
- [ ] `weather.service.test.js`:
  - mock axios for OpenWeatherMap
  - rain condition detected → notification created for farmers
  - API failure caught + logged, does not crash process

### Acceptance Criteria
- Cron starts and logs on app startup
- Severe weather detected → `WEATHER_ALERT` notifications created for all farmers
- API failure is swallowed — process keeps running

---

## Phase 14 — Inventory — Backend

**Goal:** Admin tracks and adjusts crop inventory by location.

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
  - transaction rollback on error: quantity and log both unchanged
- [ ] `inventory.routes.test.js` — list, adjust, logs

### Acceptance Criteria
- Every adjustment has a corresponding `inventory_logs` record
- Rollback: if log insert fails, quantity is not changed

---

## Phase 15 — Inventory — Frontend

**Goal:** Admin views inventory and makes adjustments.

### Frontend
- [ ] `features/inventory/InventoryListPage.jsx` — TanStack Table, filter by location + crop
- [ ] `features/inventory/AdjustModal.jsx` — input: change amount (+/-), reason field
- [ ] `features/inventory/InventoryLogsPage.jsx` — log history for a specific inventory item
- [ ] `features/inventory/api.js`
- [ ] `features/inventory/hooks.js`

### Tests
- [ ] `AdjustModal.test.jsx` — renders, validates, submits correctly

---

## Phase 16 — Reports — Backend

**Goal:** Admin generates filtered reports and exports them.

### Backend
- [ ] `reports.query.js`:
  - `getCollectionReport(filters)` — SUM bookings grouped by crop/location/date
  - `getCommitmentReport(filters)` — per-farmer booking totals vs demand
- [ ] `reports.service.js`:
  - `getReport(type, filters)` — query + format rows
  - `exportReport(type, filters, format)` — generate CSV or Excel buffer using `xlsx`
- [ ] `reports.controller.js` — `GET /reports/collection`, `GET /reports/commitment`, `GET /reports/export`
- [ ] `reports.routes.js` — admin only

### Tests
- [ ] `reports.service.test.js`:
  - collection report sums quantities correctly per location + date
  - commitment report shows per-farmer totals
  - date range filter excludes records outside range
- [ ] `reports.routes.test.js` — export returns correct `Content-Type` header

### Acceptance Criteria
- Collection report aggregates correctly with all filter combinations
- Export file has correct headers and valid format (CSV/Excel)

---

## Phase 17 — Reports — Frontend

**Goal:** Admin filters and exports reports from UI.

### Frontend
- [ ] `features/reports/ReportsPage.jsx`:
  - Tab switch: Collection / Commitment
  - Filter bar: location, crop, date range (date picker)
  - TanStack Table preview of results
  - Export button: download CSV or Excel
- [ ] `features/reports/api.js`
- [ ] `features/reports/hooks.js`

### Tests
- [ ] `ReportsPage.test.jsx` — filter change updates table, export button calls correct api

---

## Phase 18 — Dashboard — Backend

**Goal:** Single API returning key farmer metrics.

### Backend
- [ ] `dashboard.query.js` — single SQL: `COUNT(*) total, SUM(status='active') active, SUM(status='pending') pending, SUM(status='suspended') suspended FROM farmers WHERE is_deleted=false`
- [ ] `dashboard.controller.js` — `GET /dashboard`
- [ ] `dashboard.routes.js` — admin + super_admin

### Tests
- [ ] `dashboard.routes.test.js` — returns correct counts after inserting test farmers with each status

---

## Phase 19 — Dashboard — Frontend

**Goal:** Admin landing page with at-a-glance metrics.

### Frontend
- [ ] `features/dashboard/DashboardPage.jsx` — 4 metric cards: Total / Active / Pending / Suspended farmers
- [ ] Quick-link cards: Go to Farmers, Go to Demand, Go to Reports
- [ ] `features/dashboard/api.js`

### Tests
- [ ] `DashboardPage.test.jsx` — renders all 4 metric cards with values from API

---

## Phase 20 — Testing & QA

**Goal:** Full E2E flows verified, coverage reviewed, concurrency confirmed.

### E2E (Playwright)
- [ ] `e2e/auth.spec.js` — email login, Google login (mocked), logout
- [ ] `e2e/farmers.spec.js` — admin creates farmer, views list, edits, deletes
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
- [ ] Verify all booking paths use `SELECT ... FOR UPDATE` inside transaction
- [ ] Fix any regressions found in QA

---
