# PROMPT.md
## Agri Demand & Farmer Management System (FPO)
### Phase-by-Phase Code Generation Prompts

> **How to use:** Copy the prompt for the current phase and paste it into Claude. Review the generated code, verify it works, then move to the next phase.

---

## GLOBAL CONTEXT (included in every prompt automatically — read once)

Before reading any phase prompt, these rules apply to ALL phases:

### Project Stack
- **Backend:** Node.js + Express, raw SQL with mysql2 (NO ORM), JWT auth, bcrypt, Joi validation, Winston logging, node-cron
- **Frontend:** React (Vite) + Tailwind CSS + shadcn/ui, Zustand, Formik + Yup, TanStack Table, Axios, Vitest + React Testing Library, Playwright
- **Database:** MySQL 8 via Docker, auto-migration runner

### Execution Mode
- **Write all code directly** — do not ask for permission before creating or editing files. Just generate the code.
- **Only ask before:** installing new packages (`npm install`), running destructive commands, or making decisions not covered by the docs.

### Non-Negotiable Rules
1. **Raw SQL only** — no Sequelize, no Knex, no ORM. Direct mysql2 parameterized queries.
2. **Query layer separation** — SQL goes in `*.query.js` only. Never in service or controller.
3. **Soft delete** — every SELECT must include `WHERE is_deleted = 0` unless explicitly fetching deleted records.
4. **Transactions** — booking and inventory updates MUST use `withTransaction()`.
5. **Parameterized queries** — never concatenate user input into SQL strings.
6. **Standard response** — always use `successResponse()` and `errorResponse()` from `utils/response.js`.
7. **Tests alongside code** — every `*.service.js` → `__tests__/*.service.test.js`, every `*.routes.js` → `__tests__/*.routes.test.js`, every `Component.jsx` → `__tests__/Component.test.jsx`.
8. **Frontend shared components** — never duplicate UI. Use `components/` for anything used in 2+ places.
9. **No inline colors** — use Tailwind config tokens: `primary` (#4B9B4D), `sidebar-bg` (#1E5C20).

### Folder Structure
```
Farmer/
├── server/src/
│   ├── modules/{module}/{module}.controller.js
│   │                    {module}.service.js
│   │                    {module}.query.js
│   │                    {module}.routes.js
│   │                    {module}.validation.js
│   │                    __tests__/{module}.service.test.js
│   │                    __tests__/{module}.routes.test.js
│   ├── config/
│   ├── database/        pool.js, transaction.js, migrate.js
│   ├── middlewares/     verifyToken.js, authorizeRole.js, validate.js, errorHandler.js
│   └── utils/           response.js, logger.js
│
├── client/src/
│   ├── components/layout/   AuthLayout.jsx, AppLayout.jsx, Sidebar.jsx, Header.jsx
│   ├── components/ui/       DataTable.jsx, Modal.jsx, ConfirmDialog.jsx, StatusBadge.jsx, ProgressBar.jsx, StatCard.jsx, LoadingSpinner.jsx, EmptyState.jsx
│   ├── components/form/     FormField.jsx, SelectInput.jsx, MultiSelect.jsx, DateRangePicker.jsx, FileUpload.jsx, SearchInput.jsx, FilterBar.jsx
│   ├── features/{feature}/  Page.jsx, api.js, hooks.js, __tests__/
│   ├── store/               authStore.js, notificationStore.js
│   └── routes/              index.jsx, AuthGuard.jsx, RoleGuard.jsx
```

---

---

## PHASE 0 — Project Setup & Infrastructure

```
Read these project files first before generating any code:
- /Farmer/TECHSTACK.md
- /Farmer/DB_DESIGN.md
- /Farmer/development-phase.md (Phase 0 section)
- /Farmer/task-list.md (PHASE 0 section)

Generate PHASE 0 — complete project infrastructure for the FPO Agri Demand & Farmer Management System.

PROJECT STRUCTURE:
- server/ — Node.js + Express backend
- client/ — React + Vite frontend
- docker-compose.yml — at root

─── SERVER SETUP ───

1. server/package.json
   Scripts: dev (nodemon), start, migrate, test, test:unit, test:integration, lint
   Dependencies: express, mysql2, dotenv, jsonwebtoken, bcrypt, joi, winston, morgan,
                 multer, csv-parser, xlsx, node-cron, firebase-admin, google-auth-library
   DevDependencies: jest, supertest, nodemon, eslint, prettier

2. server/.env.example — document ALL required variables:
   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
   JWT_SECRET, JWT_EXPIRES_IN
   GOOGLE_CLIENT_ID
   FIREBASE_SERVICE_ACCOUNT (JSON string)
   OPENWEATHER_API_KEY
   PORT (default 5000)

3. server/src/config/env.js
   - Load dotenv
   - Validate all required vars on startup — throw if any missing
   - Export typed config object

4. server/src/database/pool.js
   - mysql2 createPool with promise wrapper
   - Use config from env.js
   - Export pool

5. server/src/database/transaction.js
   - Export: withTransaction(async (conn) => { ... })
   - Handles BEGIN, COMMIT, ROLLBACK automatically
   - Re-throws error after rollback

6. server/src/database/migrate.js
   - Creates _migrations table if not exists: (id, filename, executed_at)
   - Reads all server/migrations/*.sql files sorted numerically (001_, 002_, etc.)
   - For each file: if filename NOT in _migrations table → execute full SQL → insert into _migrations
   - Logs each migration: "Running migration: 001_init_schema.sql" / "Skipping: already run"
   - Export: runMigrations()

7. server/src/app.js
   - Create Express app
   - Mount: morgan, express.json, express.urlencoded
   - Mount: requestLogger middleware
   - Mount: GET /health → 200 { status: 'ok' }
   - Mount: errorHandler (last)
   - Export app (do NOT call listen here)

8. server/src/server.js
   - Import app, pool, runMigrations
   - On startup: await runMigrations() → then app.listen(PORT)
   - Log: "Migrations complete. Server running on port X"

9. server/src/middlewares/errorHandler.js
   - Catch-all (err, req, res, next)
   - Log error with Winston
   - Return errorResponse(res, err.message, err.status || 500)

10. server/src/middlewares/requestLogger.js
    - Morgan 'combined' format piped to Winston stream

11. server/src/utils/response.js
    successResponse(res, data, message = 'Success', status = 200)
    → res.status(status).json({ success: true, data, message })

    errorResponse(res, message = 'Error', status = 500)
    → res.status(status).json({ success: false, message })

12. server/src/utils/logger.js
    - Winston with two transports: Console (dev) + File (logs/app.log)
    - Export logger

─── DATABASE MIGRATION ───

13. server/migrations/001_init_schema.sql
    Create ALL tables with proper constraints and indexes:

    _migrations (id, filename, executed_at)

    users:
      id INT AUTO_INCREMENT PK,
      first_name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NULL,
      role ENUM('admin','farmer','super_admin') NOT NULL,
      auth_type ENUM('email','google') DEFAULT 'email',
      google_id VARCHAR(255) NULL UNIQUE,
      is_deleted TINYINT(1) DEFAULT 0,
      deleted_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

    crops: id, name VARCHAR(100) UNIQUE NOT NULL
    locations: id, name VARCHAR(100) UNIQUE NOT NULL
    branches: id, name VARCHAR(100) UNIQUE NOT NULL

    farmers:
      id, user_id FK→users.id UNIQUE,
      location_id FK→locations.id,
      branch_id FK→branches.id,
      status ENUM('active','pending','suspended') DEFAULT 'pending',
      is_deleted, deleted_at, created_at, updated_at

    farmer_crops: id, farmer_id FK, crop_id FK, UNIQUE(farmer_id, crop_id)

    demand:
      id, crop_id FK, location_id FK,
      total_quantity DECIMAL(12,2), remaining_quantity DECIMAL(12,2),
      unit VARCHAR(20), created_by FK→users.id,
      is_deleted, deleted_at, created_at, updated_at

    demand_bookings:
      id, demand_id FK, farmer_id FK,
      quantity DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    inventory:
      id, crop_id FK, location_id FK,
      quantity DECIMAL(12,2) DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

    inventory_logs:
      id, inventory_id FK,
      change_amount DECIMAL(12,2), reason VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    notifications:
      id, user_id FK,
      type ENUM('DEMAND_CREATED','DEMAND_UPDATED','BOOKING_DONE','WEATHER_ALERT'),
      title VARCHAR(255), message TEXT,
      data JSON, is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    device_tokens:
      id, user_id FK, token TEXT,
      device_type ENUM('android','ios','web'),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    weather_logs:
      id, type VARCHAR(50), message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    INDEXES: add all indexes from DB_DESIGN.md
    SEED: INSERT default super_admin user (email: admin@fpo.com, password: Admin@123 bcrypt-hashed)

─── DOCKER ───

14. docker-compose.yml (at project root)
    MySQL 8 service:
    - ports: "3306:3306" (connect via TablePlus/DBeaver on localhost:3306)
    - environment: MYSQL_ROOT_PASSWORD, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD
    - volumes: mysql_data:/var/lib/mysql (persistent)
    - healthcheck: mysqladmin ping

─── CLIENT SETUP ───

15. client/package.json — configure scripts: dev, build, test, test:e2e, lint
    Dependencies: react, react-dom, react-router-dom, axios, zustand, formik, yup,
                  @tanstack/react-table, sonner, @react-oauth/google,
                  tailwindcss, @shadcn/ui
    DevDependencies: vitest, @testing-library/react, @testing-library/jest-dom,
                     @playwright/test, eslint, prettier

16. client/tailwind.config.js — extend colors:
    primary: { DEFAULT: '#4B9B4D', dark: '#3A7A3C' }
    sidebar: { bg: '#1E5C20', active: '#2D7A30' }

17. client/vite.config.js — configure Vitest:
    test: { globals: true, environment: 'jsdom', setupFiles: './vitest.setup.js' }

18. client/vitest.setup.js
    import '@testing-library/jest-dom'

19. client/playwright.config.js
    baseURL: 'http://localhost:5173', testDir: './e2e'

20. client/.env.example
    VITE_API_BASE_URL=http://localhost:5000
    VITE_GOOGLE_CLIENT_ID=your_google_client_id

21. client/src/services/api.js
    - Axios instance with baseURL from VITE_API_BASE_URL
    - Request interceptor: attach Authorization: Bearer {token} from localStorage
    - Response interceptor: on 401 → clear localStorage + redirect to /login

VERIFICATION:
- docker-compose up -d → MySQL starts, accessible on localhost:3306
- npm run migrate → runs 001_init_schema.sql, logs success
- npm run dev (server) → "Server running on port 5000", GET /health → 200
- npm run dev (client) → Vite opens on localhost:5173
```

---

## PHASE 1 — Auth — Backend

```
Read these files before generating:
- /Farmer/DB_DESIGN.md (users table section)
- /Farmer/API_DESIGN.md (Auth module section)
- /Farmer/BACKEND_ARCHITECTURE.md
- /Farmer/development-phase.md (Phase 1 section)

Generate PHASE 1 — Authentication backend for FPO system.

CONTEXT:
- server/src/database/pool.js and transaction.js already exist
- utils/response.js and logger.js already exist
- middlewares/errorHandler.js already exist
- Migration 001 already created users and farmers tables
- Farmer self-registration: when role='farmer', also insert into farmers table with status='pending'

─── FILES TO GENERATE ───

1. server/src/config/google.js
   - Import { OAuth2Client } from 'google-auth-library'
   - Initialize: new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
   - Export client
   - Export verifyGoogleToken(credential) async function:
     → ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID })
     → return ticket.getPayload() (contains email, name, sub=googleId)

2. server/src/modules/auth/auth.query.js
   Functions (all use pool from database/pool.js, parameterized queries only):
   - findUserByEmail(email) → SELECT * FROM users WHERE email=? AND is_deleted=0
   - findUserByGoogleId(googleId) → SELECT * FROM users WHERE google_id=? AND is_deleted=0
   - createEmailUser(firstName, phone, email, hashedPassword, role) → INSERT, return insertId
   - createGoogleUser(firstName, email, googleId, role) → INSERT with auth_type='google', return insertId
   - getUserById(id) → SELECT id,first_name,email,role,auth_type FROM users WHERE id=? AND is_deleted=0
   - createFarmerRecord(userId) → INSERT INTO farmers(user_id, status) VALUES(?, 'pending')

3. server/src/modules/auth/auth.validation.js
   Joi schemas:
   - registerSchema: { firstName: string required, phone: string optional, email: email required,
     password: min 8 required, confirmPassword: must match password, role: enum['admin','farmer'] required }
   - loginSchema: { email: email required, password: string required }
   - googleSchema: { credential: string required }

4. server/src/modules/auth/auth.service.js
   - register(firstName, phone, email, password, role):
     1. findUserByEmail(email) → if exists throw { status: 409, message: 'Email already registered' }
     2. bcrypt.hash(password, 10)
     3. userId = createEmailUser(firstName, phone, email, hashedPassword, role)
     4. if role === 'farmer' → createFarmerRecord(userId)
     5. token = jwt.sign({ id: userId, role, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
     6. return { token, user: { id: userId, firstName, email, role } }

   - loginWithEmail(email, password):
     1. user = findUserByEmail(email) → if not found throw { status: 401, message: 'Invalid credentials' }
     2. bcrypt.compare(password, user.password) → if false throw { status: 401, message: 'Invalid credentials' }
     3. token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn })
     4. return { token, user: { id, firstName: user.first_name, email, role } }

   - loginWithGoogle(credential):
     1. payload = verifyGoogleToken(credential) → if fails throw { status: 401, message: 'Invalid Google token' }
     2. existing = findUserByGoogleId(payload.sub)
     3. if existing → use existing user
     4. if not found → check findUserByEmail(payload.email):
        - if email exists throw { status: 409, message: 'Email already registered with password' }
        - else userId = createGoogleUser(payload.given_name, payload.email, payload.sub, 'farmer')
              createFarmerRecord(userId) [default Google signups are farmer role]
     5. token = jwt.sign(...)
     6. return { token, user }

   - getMe(userId): return getUserById(userId)

5. server/src/modules/auth/auth.controller.js
   - register: validate(registerSchema) → authService.register() → successResponse 201
   - login: validate(loginSchema) → authService.loginWithEmail() → successResponse 200
   - googleAuth: validate(googleSchema) → authService.loginWithGoogle() → successResponse 200
   - getMe: authService.getMe(req.user.id) → successResponse 200

6. server/src/modules/auth/auth.routes.js
   POST /auth/register → register
   POST /auth/login → login
   POST /auth/google → googleAuth
   GET /auth/me → verifyToken, getMe

7. server/src/middlewares/verifyToken.js
   - Extract Bearer token from Authorization header
   - jwt.verify(token, JWT_SECRET) → attach payload to req.user
   - If missing or invalid → errorResponse 401

8. server/src/middlewares/authorizeRole.js
   - Export: authorizeRole(roles[])
   - Middleware: if !roles.includes(req.user.role) → errorResponse 403

9. server/src/middlewares/validate.js
   - Export: validate(schema)
   - Middleware: schema.validate(req.body, { abortEarly: false })
   - If error → errorResponse 400 with all Joi error messages joined

10. Mount auth routes in app.js: app.use('/auth', authRouter)

─── TESTS (generate alongside each file) ───

11. server/src/modules/auth/__tests__/auth.service.test.js
    Mock: auth.query.js, bcrypt, jsonwebtoken, config/google.js
    Test cases:
    - register: creates user + farmer record for farmer role, returns token
    - register: creates user only (no farmer record) for admin role
    - register: throws 409 on duplicate email
    - loginWithEmail: returns token on valid credentials
    - loginWithEmail: throws 401 on wrong password
    - loginWithEmail: throws 401 on unknown email
    - loginWithGoogle: existing user returns token
    - loginWithGoogle: new user creates user + farmer + returns token
    - loginWithGoogle: invalid credential throws 401

12. server/src/modules/auth/__tests__/auth.routes.test.js
    Use Supertest with real DB (test database from .env.test)
    Setup: truncate users and farmers tables before each test
    Test cases:
    - POST /auth/register valid farmer → 201 + token, farmer row with status=pending
    - POST /auth/register valid admin → 201 + token, no farmer row created
    - POST /auth/register duplicate email → 409
    - POST /auth/register missing fields → 400 with validation errors
    - POST /auth/login valid → 200 + token
    - POST /auth/login wrong password → 401
    - GET /auth/me with valid token → 200 + user data (no password field)
    - GET /auth/me no token → 401
    - GET /auth/me expired token → 401

VERIFICATION:
- npm test → all auth tests pass
- POST http://localhost:5000/auth/register with farmer role → 201
- POST http://localhost:5000/auth/login → 200 + JWT
- GET http://localhost:5000/auth/me with token → user data
- GET http://localhost:5000/auth/me without token → 401
```

---

## PHASE 2 — Auth — Frontend

```
Read these files before generating:
- /Farmer/FRONTEND_ARCHITECTURE.md (full file — design system + layout patterns)
- /Farmer/development-phase.md (Phase 2 section)
- /Farmer/task-list.md (PHASE 2 section)

Generate PHASE 2 — Auth frontend (Register + Login pages) for FPO system.

DESIGN RULES (non-negotiable):
- Primary color: #4B9B4D (use Tailwind token 'primary')
- Auth layout: white bg, "SIGN IN"/"SIGN UP" label absolute top-left (text-xs tracking-widest uppercase text-gray-400)
- Left half: agricultural illustration image
- Right half: white card (rounded-xl shadow-md p-8) centered vertically, max-w-md
- All inputs: border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary
- Button: bg-primary text-white rounded-md hover:bg-primary-dark w-full py-2 font-medium

─── FILES TO GENERATE ───

1. client/src/components/layout/AuthLayout.jsx
   - Full-screen white background
   - "SIGN IN" or "SIGN UP" label: absolute top-6 left-8, text-xs tracking-widest uppercase text-gray-400
   - Two columns (flex): left 45% = {illustration slot}, right 55% = {children} centered
   - Props: { children, label }

2. client/src/components/layout/AppLayout.jsx
   - Flex row: <Sidebar /> + main content area
   - Main: flex-1, flex-col, overflow-hidden
   - Top: <Header pageTitle={pageTitle} />
   - Content: flex-1 overflow-auto bg-[#F5F6F8] p-6
   - Props: { children, pageTitle }

3. client/src/components/layout/Sidebar.jsx
   Design specs:
   - bg-[#1E5C20], w-56, h-screen, flex-col, fixed left-0 top-0
   - Logo: "FPO" text-white font-bold text-2xl px-6 py-5
   - Nav items: role-aware (admin: Dashboard,Farmers,Demand Planning,Reports,Inventory,Logout)
                          (farmer: Demand Planning, Notifications, Logout)
   - Each nav item: flex items-center gap-3 px-6 py-3 text-white/80 text-sm cursor-pointer
   - Active item (NavLink isActive): bg-[#2D7A30] text-white font-medium rounded-r-md
   - Logout: at bottom (mt-auto), same style, calls authStore.logout() + navigate('/login')
   - Use lucide-react icons

4. client/src/components/layout/Header.jsx
   - h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6
   - Left: pageTitle (font-semibold text-base text-gray-900)
   - Right: Alerts (Bell icon + unread badge from notificationStore) | divider | Settings (Gear icon) | divider | "{user.firstName}" + ChevronDown
   - Logout option in user dropdown

5. client/src/store/authStore.js
   Zustand store:
   - State: { user: null, token: null }
   - setAuth(user, token): set state + localStorage.setItem('token', token) + localStorage.setItem('user', JSON.stringify(user))
   - logout(): clear state + localStorage.removeItem('token') + localStorage.removeItem('user')
   - Initialize from localStorage on app load (persist)

6. client/src/features/auth/api.js
   - loginWithEmailApi(email, password) → api.post('/auth/login', { email, password })
   - registerWithEmailApi(firstName, phone, email, role, password) → api.post('/auth/register', { firstName, phone, email, role, password })
   - loginWithGoogleApi(credential) → api.post('/auth/google', { credential })
   - getMeApi() → api.get('/auth/me')

7. client/src/features/auth/RegisterPage.jsx
   Uses AuthLayout label="SIGN UP"
   Formik + Yup:
   - Fields: First Name (half-width), Phone (half-width), Email (full), Role select (full),
             Password (half, eye toggle), Confirm Password (half, eye toggle)
   - Yup: firstName required, email email required, password min 8 required,
          confirmPassword must match password, role required
   - On submit: registerWithEmailApi() → setAuth() → navigate based on role:
     - admin/super_admin → /dashboard
     - farmer → /demand
   - Below button: "Has account? Sign in" link → /login
   - Divider: "— Quick Signup With —"
   - GoogleLogin component (outlined): onSuccess → loginWithGoogleApi(credentialResponse.credential) → setAuth() → navigate
   - Show Sonner toast.error() on API errors

8. client/src/features/auth/LoginPage.jsx
   Uses AuthLayout label="SIGN IN"
   Formik + Yup:
   - Fields: Email (full), Password (full, eye toggle)
   - Yup: email email required, password required
   - On submit: loginWithEmailApi() → setAuth() → navigate by role
   - Below button: "Don't have an account? Sign up" link → /register
   - Divider: "— Or continue with —"
   - GoogleLogin component
   - Show Sonner toast.error() on 401

9. client/src/routes/AuthGuard.jsx
   - Read token from authStore
   - If no token → <Navigate to="/login" replace />
   - Else → render children

10. client/src/routes/RoleGuard.jsx
    - Props: { allowedRoles: string[], children }
    - Read user from authStore
    - If user.role not in allowedRoles → <Navigate to="/unauthorized" replace />
    - Else → render children

11. client/src/routes/index.jsx
    Public routes: /login → LoginPage, /register → RegisterPage
    Protected routes (wrapped in AuthGuard):
    - /dashboard → DashboardPage (admin,super_admin only via RoleGuard)
    - /farmers → FarmerListPage (admin only)
    - /demand → DemandListPage (all roles)
    - /booking → DemandBookingPage (farmer only)
    - /notifications → NotificationListPage (all roles)
    - /inventory → InventoryListPage (admin only)
    - /reports → ReportsPage (admin only)
    - / → redirect to /dashboard (admin) or /demand (farmer)

12. client/src/App.jsx
    Wrap with: GoogleOAuthProvider, BrowserRouter, Toaster (Sonner)
    Render: <Routes from routes/index.jsx />

─── TESTS ───

13. client/src/features/auth/__tests__/RegisterPage.test.jsx
    Mock: features/auth/api.js, store/authStore.js, react-router-dom (useNavigate)
    Test cases:
    - renders all 6 fields (firstName, phone, email, role, password, confirmPassword)
    - renders Google login button
    - shows "Password must match" error when confirmPassword differs
    - shows "Email is required" error on empty email submit
    - calls registerWithEmailApi with correct payload on valid submit
    - navigates to /demand for farmer role on success
    - navigates to /dashboard for admin role on success
    - shows error toast on 409 response

14. client/src/features/auth/__tests__/LoginPage.test.jsx
    - renders email and password fields
    - renders Google login button
    - shows validation error for empty email
    - calls loginWithEmailApi on submit
    - shows error toast on 401 response

15. client/src/components/layout/__tests__/Sidebar.test.jsx
    - admin user: shows Dashboard, Farmers, Demand Planning, Reports, Inventory, Logout
    - farmer user: shows Demand Planning, Notifications, Logout only (no Farmers, Reports, Inventory)

16. client/src/routes/__tests__/AuthGuard.test.jsx
    - renders children when token exists in authStore
    - redirects to /login when no token

VERIFICATION:
- npm run dev (client) → /register page matches reference design (split layout)
- Register as farmer → redirect to /demand, farmer row in DB has status=pending
- Register as admin → redirect to /dashboard
- Login with email → works
- No token → redirected to /login automatically
- Sidebar shows correct nav items per role
```

---

## PHASE 3 — Master Data — Backend

```
Read these files before generating:
- /Farmer/API_DESIGN.md (crops/locations/branches section)
- /Farmer/BACKEND_ARCHITECTURE.md
- /Farmer/development-phase.md (Phase 3 section)

Generate PHASE 3 — Master Data backend (Crops, Locations, Branches) for FPO system.

CONTEXT: Auth middleware (verifyToken, authorizeRole, validate) already exists.

─── FILES TO GENERATE ───

1. server/src/modules/master/master.query.js
   All queries use parameterized SQL. Include WHERE is_deleted=0 where applicable.

   Crops:
   - getAllCrops() → SELECT id, name FROM crops ORDER BY name ASC
   - getCropById(id) → SELECT * FROM crops WHERE id=?
   - createCrop(name) → INSERT INTO crops(name) VALUES(?)
   - updateCrop(id, name) → UPDATE crops SET name=? WHERE id=?
   - softDeleteCrop(id) → (crops has no is_deleted — use hard delete or add soft delete — use hard delete for master data)

   Locations:
   - getAllLocations() → SELECT id, name FROM locations ORDER BY name ASC
   - createLocation(name), updateLocation(id, name), deleteLocation(id)

   Branches:
   - getAllBranches() → SELECT id, name FROM branches ORDER BY name ASC
   - createBranch(name), updateBranch(id, name), deleteBranch(id)

   Handle UNIQUE constraint violation (MySQL error code 1062) → throw { status: 409, message: 'Name already exists' }

2. server/src/modules/master/master.validation.js
   Joi schemas: nameSchema: { name: string().trim().min(2).max(100).required() }

3. server/src/modules/master/master.service.js
   Thin layer — call query functions, handle 409 from duplicate name.

4. server/src/modules/master/master.controller.js
   Handlers for all CRUD operations, using successResponse/errorResponse.

5. server/src/modules/master/master.routes.js
   GET /crops, GET /locations, GET /branches → public (any authenticated user)
   POST /crops, PUT /crops/:id, DELETE /crops/:id → authorizeRole(['admin','super_admin'])
   Same pattern for locations and branches
   Mount in app.js

─── TESTS ───

6. master/__tests__/master.routes.test.js (Supertest + real DB)
   - GET /crops → 200 with array (including seeded crops if any)
   - POST /crops with admin token → 201
   - POST /crops duplicate name → 409
   - POST /crops with farmer token → 403
   - PUT /crops/:id → 200
   - DELETE /crops/:id → 200, not in GET list after
   - Same for /locations and /branches

VERIFICATION:
- POST /crops {"name":"Onion"} with admin token → 201
- POST /crops {"name":"Onion"} again → 409 with "Name already exists"
- GET /crops → array includes Onion
- Farmer token on POST /crops → 403
```

---

## PHASE 4 — Master Data — Frontend

```
Read these files before generating:
- /Farmer/FRONTEND_ARCHITECTURE.md
- /Farmer/development-phase.md (Phase 4 section)

Generate PHASE 4 — Master Data frontend (shared dropdown hooks and components).

─── FILES TO GENERATE ───

1. client/src/features/master/api.js
   - getCropsApi() → api.get('/crops')
   - getLocationsApi() → api.get('/locations')
   - getBranchesApi() → api.get('/branches')

2. client/src/features/master/hooks.js
   Each hook: useState([]), useEffect to fetch on mount, return { data, loading, error }
   - useCrops() → fetches and returns crops array
   - useLocations() → fetches and returns locations array
   - useBranches() → fetches and returns branches array

─── SHARED COMPONENTS (build now — used in every form phase) ───

3. client/src/components/form/FormField.jsx
   Props: { label, name, error, touched, children, required }
   - Renders: label (text-sm font-medium text-gray-700) + children (the input) + error message (text-xs text-red-500)
   - Only show error if touched && error

4. client/src/components/form/SelectInput.jsx
   Props: { options: [{value, label}], value, onChange, placeholder, disabled }
   - Styled select element using design system styles
   - border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-2 focus:ring-primary

5. client/src/components/form/MultiSelect.jsx
   Props: { options: [{value, label}], value: [], onChange, placeholder }
   - Checkboxes dropdown or shadcn multi-select pattern
   - Shows selected count in trigger button
   - Used for crop assignment

6. client/src/components/form/FilterBar.jsx
   Props: { children }
   - Horizontal flex container: bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-end
   - Children = filter inputs placed inside

7. client/src/components/form/SearchInput.jsx
   Props: { value, onChange, placeholder }
   - Text input with Search icon (lucide)
   - Debounces onChange by 300ms internally

8. client/src/components/form/DateRangePicker.jsx
   Props: { startDate, endDate, onStartChange, onEndChange }
   - Two date inputs side by side (start, end)
   - Label: "From" / "To"

9. client/src/components/ui/DataTable.jsx
   Props: { columns, data, loading, pagination: { page, limit, total }, onPageChange }
   - TanStack Table useReactTable
   - Shows LoadingSpinner when loading=true
   - Shows EmptyState when data.length === 0
   - Renders table with thead/tbody using Tailwind table styles
   - Pagination controls at bottom using Pagination component

10. client/src/components/ui/Pagination.jsx
    Props: { page, limit, total, onPageChange }
    - Shows "Page X of Y" and prev/next buttons
    - Disable prev on page 1, disable next on last page

11. client/src/components/ui/Modal.jsx
    Props: { isOpen, onClose, title, children, size='md' }
    - shadcn Dialog or custom: fixed overlay + centered panel
    - rounded-2xl shadow-xl bg-white p-6
    - Header: title + X close button

12. client/src/components/ui/ConfirmDialog.jsx
    Props: { isOpen, onClose, onConfirm, title, message, confirmLabel='Confirm', danger=false }
    - Extends Modal
    - Two buttons: Cancel (secondary) + Confirm (primary or destructive if danger=true)

13. client/src/components/ui/StatusBadge.jsx
    Props: { status: 'active'|'pending'|'suspended' }
    active → green badge, pending → yellow, suspended → red
    - px-2 py-0.5 rounded-full text-xs font-medium

14. client/src/components/ui/ProgressBar.jsx
    Props: { current, total, unit }
    - Shows: "X / Y unit" text
    - Colored bar: bg-gray-200 rounded-full, filled portion bg-primary
    - Width = (current/total)*100%

15. client/src/components/ui/StatCard.jsx
    Props: { label, value, icon, color='primary' }
    - bg-white rounded-xl shadow-sm p-6
    - Large number: text-3xl font-bold
    - Label below: text-sm text-gray-500
    - Optional icon top-right

16. client/src/components/ui/LoadingSpinner.jsx
    - Centered spinner using Tailwind animate-spin
    - Primary color border

17. client/src/components/ui/EmptyState.jsx
    Props: { message='No records found', icon }
    - Centered text-gray-400, optional icon above

─── TESTS ───

18. client/src/features/master/__tests__/hooks.test.js
    - useCrops returns array on success
    - useCrops sets loading true then false
    - useCrops sets error on API failure

19. client/src/components/ui/__tests__/DataTable.test.jsx
    - renders column headers from columns prop
    - shows LoadingSpinner when loading=true
    - shows EmptyState when data=[]
    - renders correct number of rows

20. client/src/components/form/__tests__/FormField.test.jsx
    - renders label
    - renders error message when touched=true and error exists
    - does not render error when not touched

VERIFICATION:
- useCrops() in a test component fetches and returns crops from API
- DataTable with empty data shows EmptyState component
- DataTable with loading=true shows LoadingSpinner
```

---

## PHASE 5 — Farmers — Backend

```
Read these files before generating:
- /Farmer/API_DESIGN.md (Farmers module section)
- /Farmer/DB_DESIGN.md (Farmer domain section)
- /Farmer/BACKEND_ARCHITECTURE.md
- /Farmer/development-phase.md (Phase 5 section)

Generate PHASE 5 — Farmers backend (full CRUD, bulk upload, export).

RULES:
- All queries: WHERE is_deleted=0 for soft delete
- Farmer creation: creates user + farmer + assigns crops — ALL in one transaction
- Dynamic filter builder: construct WHERE clause safely with parameterized placeholders

─── FILES TO GENERATE ───

1. server/src/modules/farmers/farmers.query.js
   - createUserForFarmer(conn, firstName, phone, email, hashedPassword) → INSERT into users with role='farmer'
   - createFarmerRecord(conn, userId, locationId, branchId) → INSERT into farmers
   - assignFarmerCrops(conn, farmerId, cropIds[]) → bulk INSERT INTO farmer_crops, delete existing first
   - getFarmers(filters, page, limit):
     Dynamic WHERE with: status, location_id, branch_id, crop_id (via JOIN farmer_crops)
     JOIN users ON farmers.user_id = users.id
     LEFT JOIN locations, branches
     WHERE farmers.is_deleted=0 AND users.is_deleted=0
     Return: paginated array + total count (two queries)
   - getFarmerById(id) → full JOIN including crops as array (GROUP_CONCAT or separate query)
   - updateFarmer(conn, id, data) → UPDATE farmers SET ... (status, location_id, branch_id)
   - updateFarmerUser(conn, userId, data) → UPDATE users SET first_name, phone
   - softDeleteFarmer(id) → UPDATE farmers SET is_deleted=1, deleted_at=NOW() WHERE id=?
                           + UPDATE users SET is_deleted=1, deleted_at=NOW() WHERE id=?
   - getFarmersForExport(filters) → same as getFarmers but no pagination, all fields

2. server/src/modules/farmers/farmers.service.js
   - createFarmer(data):
     withTransaction(async conn => {
       hash password
       userId = createUserForFarmer(conn, ...)
       farmerId = createFarmerRecord(conn, userId, ...)
       if cropIds.length > 0 → assignFarmerCrops(conn, farmerId, cropIds)
     })
     return getFarmerById(farmerId)

   - updateFarmer(id, data):
     withTransaction(async conn => {
       updateFarmer(conn, id, { status, locationId, branchId })
       updateFarmerUser(conn, farmer.userId, { firstName, phone })
       if cropIds provided → assignFarmerCrops(conn, id, cropIds)
     })

   - bulkUploadFarmers(fileBuffer, mimetype):
     Parse CSV or Excel depending on mimetype
     For each row: validate required fields (firstName, email, locationName, branchName)
     Lookup location/branch by name → get IDs
     createFarmer for valid rows
     Return: { success: number, errors: [{row, reason}] }

   - exportFarmers(filters):
     getFarmersForExport(filters) → format as CSV string → return

3. server/src/modules/farmers/farmers.validation.js
   - createFarmerSchema: firstName required, phone optional, email email required,
     password min 8 required, locationId number required, branchId number required,
     cropIds array of numbers optional, status enum optional
   - updateFarmerSchema: same but all optional

4. server/src/modules/farmers/farmers.controller.js
   - createFarmer: POST /farmers
   - getFarmers: GET /farmers (query: status, location, branch, crop, page, limit)
   - getFarmerById: GET /farmers/:id
   - updateFarmer: PUT /farmers/:id
   - deleteFarmer: DELETE /farmers/:id
   - bulkUpload: POST /farmers/bulk-upload (Multer single file 'file')
   - exportFarmers: GET /farmers/export (set Content-Type: text/csv, Content-Disposition: attachment)

5. server/src/modules/farmers/farmers.routes.js
   All routes: verifyToken
   Writes (POST, PUT, DELETE): authorizeRole(['admin','super_admin'])
   GET /farmers, GET /farmers/:id: all roles
   Mount in app.js

─── TESTS ───

6. farmers/__tests__/farmers.service.test.js
   Mock: farmers.query.js, database/transaction.js
   - createFarmer: calls createUserForFarmer + createFarmerRecord + assignFarmerCrops
   - createFarmer: transaction rollback if createFarmerRecord throws
   - bulkUploadFarmers: skips rows with missing email, returns error list
   - exportFarmers: returns CSV string with headers

7. farmers/__tests__/farmers.routes.test.js (Supertest + real DB)
   Setup: truncate test data before each test
   - POST /farmers valid → 201, farmer exists with status=pending (default for admin-created)
   - POST /farmers without auth → 401
   - POST /farmers with farmer token → 403
   - GET /farmers → 200, paginated { data, pagination }
   - GET /farmers?status=active → only active farmers
   - GET /farmers/:id → 200 with crops array
   - PUT /farmers/:id → 200
   - DELETE /farmers/:id → 200, subsequent GET returns 404
   - GET /farmers/export → 200, Content-Type: text/csv

VERIFICATION:
- Create farmer via API → user + farmer rows in DB
- GET /farmers?status=pending → only pending farmers
- DELETE farmer → soft deleted (is_deleted=1), not in list
- Bulk upload CSV with 3 valid + 1 invalid row → returns success:3, errors:[{row:4,...}]
```

---

## PHASE 6 — Farmers — Frontend

```
Read these files before generating:
- /Farmer/FRONTEND_ARCHITECTURE.md (design system)
- /Farmer/development-phase.md (Phase 6 section)

Generate PHASE 6 — Farmers frontend (list, create, edit, bulk upload).

DESIGN RULES: Use shared components from components/. No duplicate UI.
Primary: #4B9B4D. Cards: bg-white rounded-xl shadow-sm p-6.

─── FILES TO GENERATE ───

1. client/src/features/farmers/api.js
   - getFarmersApi(params) → api.get('/farmers', { params })
   - getFarmerByIdApi(id) → api.get(`/farmers/${id}`)
   - createFarmerApi(data) → api.post('/farmers', data)
   - updateFarmerApi(id, data) → api.put(`/farmers/${id}`, data)
   - deleteFarmerApi(id) → api.delete(`/farmers/${id}`)
   - bulkUploadApi(formData) → api.post('/farmers/bulk-upload', formData, { headers: {'Content-Type':'multipart/form-data'} })
   - exportFarmersApi(params) → api.get('/farmers/export', { params, responseType: 'blob' })

2. client/src/features/farmers/hooks.js
   - useFarmers(filters) → { farmers, loading, error, pagination, refetch }
     useState for page, useEffect to fetch when filters/page changes
   - useCreateFarmer() → { create, loading, error }
   - useUpdateFarmer() → { update, loading }
   - useDeleteFarmer() → { remove, loading }

3. client/src/features/farmers/FarmerListPage.jsx
   Uses: AppLayout, FilterBar, SearchInput, SelectInput (location/branch/crop/status), DataTable, StatusBadge, ConfirmDialog
   - Filter bar: SearchInput (name/email), location SelectInput, branch SelectInput, crop SelectInput, status SelectInput
   - DataTable columns: Name, Email, Phone, Location, Branch, Status (StatusBadge), Crops, Actions (Edit/Delete)
   - Edit → navigate to /farmers/:id/edit
   - Delete → ConfirmDialog → useDeleteFarmer → refetch
   - "Add Farmer" button → navigate to /farmers/new
   - "Bulk Upload" button → open BulkUploadModal
   - "Export" button → exportFarmersApi() → trigger browser download

4. client/src/features/farmers/FarmerCreatePage.jsx
   Uses: AppLayout, FormField, SelectInput, MultiSelect (crops), Formik + Yup
   Fields: First Name, Phone, Email, Password, Location, Branch, Crops (MultiSelect), Status
   On submit: createFarmerApi() → toast.success → navigate to /farmers
   Yup: firstName required, email email, password min 8, locationId required, branchId required

5. client/src/features/farmers/FarmerEditPage.jsx
   Fetch farmer on mount → pre-fill Formik values
   Same fields as Create but password optional
   On submit: updateFarmerApi() → toast.success → navigate to /farmers

6. client/src/features/farmers/BulkUploadModal.jsx
   Uses: Modal, FileUpload
   - FileUpload accepts .csv, .xlsx
   - On upload: bulkUploadApi() → show result:
     Success: "X farmers uploaded successfully"
     Errors table: row number + reason
   - Close button → refetch farmer list

─── TESTS ───

7. farmers/__tests__/FarmerListPage.test.jsx
   Mock: farmers/api.js, react-router-dom
   - renders DataTable with farmer rows
   - filter change calls getFarmersApi with updated params
   - Delete click shows ConfirmDialog
   - Confirm delete calls deleteFarmerApi

8. farmers/__tests__/FarmerCreatePage.test.jsx
   - renders all form fields
   - shows validation error for missing firstName
   - shows validation error for invalid email
   - calls createFarmerApi with correct payload on submit
   - navigates to /farmers on success

VERIFICATION:
- /farmers page loads with table and filter bar
- Add Farmer → form with all fields → submit creates farmer
- Filter by status=active → table updates
- Export button downloads CSV file
- Bulk upload with sample CSV → shows result summary
```

---

## PHASE 7 — Demand Planning — Backend

```
Read these files before generating:
- /Farmer/API_DESIGN.md (Demand module section)
- /Farmer/DB_DESIGN.md (Demand system section)
- /Farmer/development-phase.md (Phase 7 section)

Generate PHASE 7 — Demand Planning backend.

RULES:
- On demand create/update → call notificationService.sendNotification() for all farmer user IDs
- remaining_quantity initialized to total_quantity on create
- NotificationService may not exist yet — create a placeholder that logs: console.log('Notification stub:', ...) and implement fully in Phase 11

─── FILES TO GENERATE ───

1. server/src/modules/demand/demand.query.js
   - createDemand(data, createdBy) → INSERT with remaining_quantity = total_quantity
   - getDemands(filters, page, limit):
     Filters: crop_id, location_id, date_from (created_at >=), date_to (created_at <=)
     JOIN crops, locations
     WHERE demand.is_deleted=0
     Paginated
   - getDemandById(id) → full JOIN with crop name, location name
   - updateDemand(id, data) → UPDATE allowed fields (crop_id, location_id, total_quantity, unit)
   - softDeleteDemand(id)
   - getAllFarmerUserIds() → SELECT u.id FROM users u JOIN farmers f ON u.id=f.user_id WHERE u.is_deleted=0 AND f.is_deleted=0 AND f.status='active'

2. server/src/modules/demand/demand.service.js
   - createDemand(data, createdBy):
     insertedId = createDemand(data, createdBy)
     demand = getDemandById(insertedId)
     farmerIds = getAllFarmerUserIds()
     notificationService.sendNotification(farmerIds, 'DEMAND_CREATED', 'New Demand Available', `${demand.cropName} demand of ${data.totalQuantity}${data.unit}`, { demandId: insertedId })
     return demand

   - updateDemand(id, data):
     updateDemand(id, data)
     demand = getDemandById(id)
     farmerIds = getAllFarmerUserIds()
     notificationService.sendNotification(farmerIds, 'DEMAND_UPDATED', 'Demand Updated', ..., ...)
     return demand

3. server/src/modules/notifications/notifications.service.js (STUB — implement fully in Phase 11)
   - sendNotification(userIds, type, title, message, data):
     logger.info(`[Notification Stub] type=${type}, users=${userIds.length}, title=${title}`)
     // Will be implemented in Phase 11

4. server/src/modules/demand/demand.validation.js
   - createDemandSchema: crop_id number required, location_id number required,
     total_quantity number positive required, unit string required
   - updateDemandSchema: all optional

5. server/src/modules/demand/demand.controller.js
6. server/src/modules/demand/demand.routes.js
   POST/PUT/DELETE: admin + super_admin only
   GET: all authenticated roles
   Mount in app.js

─── TESTS ───

7. demand/__tests__/demand.service.test.js
   Mock: demand.query.js, notifications.service.js
   - createDemand: calls createDemand query + getAllFarmerUserIds + sendNotification
   - createDemand: remaining_quantity equals total_quantity in DB
   - updateDemand: calls sendNotification after update

8. demand/__tests__/demand.routes.test.js (Supertest)
   - POST /demand valid (admin) → 201
   - POST /demand (farmer token) → 403
   - GET /demand → 200 paginated
   - GET /demand?crop_id=1&location_id=1 → filtered results
   - GET /demand/:id → 200 with crop + location names
   - PUT /demand/:id → 200
   - DELETE /demand/:id → 200, absent from list

VERIFICATION:
- POST /demand → 201, remaining_quantity = total_quantity
- GET /demand?crop_id=1 → only onion demands
- PUT /demand/:id → updated, notification stub logged
```

---

## PHASE 8 — Demand Planning — Frontend

```
Read: /Farmer/FRONTEND_ARCHITECTURE.md, /Farmer/development-phase.md (Phase 8)

Generate PHASE 8 — Demand Planning frontend.

─── FILES TO GENERATE ───

1. client/src/features/demand/api.js
   - getDemandsApi(params), getDemandByIdApi(id), createDemandApi(data),
     updateDemandApi(id, data), deleteDemandApi(id)

2. client/src/features/demand/hooks.js
   - useDemands(filters), useCreateDemand(), useUpdateDemand(), useDeleteDemand()

3. client/src/features/demand/DemandListPage.jsx
   Uses: AppLayout, FilterBar, SelectInput (crop, location), DateRangePicker, DataTable, ProgressBar, ConfirmDialog
   Columns: Crop, Location, Total Qty, Remaining (ProgressBar), Unit, Created, Actions
   Admin: Edit + Delete buttons per row, "Create Demand" button top-right
   Farmer: read-only list (no edit/delete), "Book" button per row → navigate to /booking/:demandId

4. client/src/features/demand/DemandCreatePage.jsx
   Fields: Crop (SelectInput, uses useCrops), Location (SelectInput, uses useLocations), Total Quantity, Unit
   On submit: createDemandApi() → toast.success → navigate to /demand

5. client/src/features/demand/DemandEditPage.jsx
   Fetch demand → pre-fill → update on submit

6. client/src/features/demand/DemandDetailPage.jsx
   Shows demand info + table of bookings made against it (GET /bookings?demand_id=X)

─── TESTS ───

7. demand/__tests__/DemandListPage.test.jsx
   - renders columns including ProgressBar for remaining quantity
   - admin sees Edit and Delete buttons
   - farmer sees Book button, no Edit/Delete

8. demand/__tests__/DemandCreatePage.test.jsx
   - renders crop, location selects and quantity input
   - calls createDemandApi on valid submit

VERIFICATION:
- /demand page loads with all demands
- ProgressBar shows remaining/total correctly
- Admin can create/edit/delete demand
- Farmer sees demand list with Book buttons, no edit/delete
```

---

## PHASE 9 — Demand Booking — Backend (CRITICAL)

```
Read these files before generating:
- /Farmer/API_DESIGN.md (Booking section)
- /Farmer/DB_DESIGN.md (Critical constraints section)
- /Farmer/development-phase.md (Phase 9 section)
- /Farmer/testing-strategy.md (Concurrency tests section)

Generate PHASE 9 — Demand Booking backend. THIS IS THE MOST CRITICAL MODULE.

CRITICAL RULES (no exceptions):
1. MUST use SELECT ... FOR UPDATE to lock the demand row before checking remaining_quantity
2. MUST use a DB transaction (withTransaction)
3. Notifications sent AFTER the transaction commits — never inside
4. Concurrent bookings MUST be safe — test proves no overbooking

─── FILES TO GENERATE ───

1. server/src/modules/booking/booking.query.js
   - getDemandForUpdate(demandId, conn):
     SELECT * FROM demand WHERE id=? AND is_deleted=0 FOR UPDATE
     Uses conn (transaction connection) — NOT pool
     Returns demand row with remaining_quantity

   - insertBooking(demandId, farmerId, quantity, conn):
     INSERT INTO demand_bookings(demand_id, farmer_id, quantity)
     Uses conn

   - deductRemainingQuantity(demandId, quantity, conn):
     UPDATE demand SET remaining_quantity = remaining_quantity - ?, updated_at=NOW()
     WHERE id=? AND remaining_quantity >= ?
     Uses conn
     If affectedRows === 0 → throw { status: 400, message: 'Insufficient remaining quantity' }

   - getBookings(filters):
     Filters: demand_id, farmer_id (for farmer's own bookings)
     JOIN farmers, users, demand, crops
     Paginated

2. server/src/modules/booking/booking.service.js
   - createBooking(demandId, farmerId, quantity):
     Validate quantity > 0

     await withTransaction(async (conn) => {
       demand = await getDemandForUpdate(demandId, conn)
       if (!demand) throw { status: 404, message: 'Demand not found' }
       if (quantity > demand.remaining_quantity) throw { status: 400, message: 'Quantity exceeds remaining' }
       await insertBooking(demandId, farmerId, quantity, conn)
       await deductRemainingQuantity(demandId, quantity, conn)
     })

     // AFTER commit — notifications are best-effort, never throw:
     try {
       farmerUserIds = [farmer.userId]
       adminUserIds = getAllAdminUserIds()
       notificationService.sendNotification([...farmerUserIds, ...adminUserIds], 'BOOKING_DONE', ...)
     } catch(e) { logger.error('Notification failed after booking', e) }

     return getBookingById(insertId)

   - getBookings(filters, requestingUser):
     If farmer role → force filter farmer_id = requestingUser's farmerId
     If admin → allow any filters

3. server/src/modules/booking/booking.validation.js
   - createBookingSchema: { demand_id: number required, quantity: number positive required }

4. server/src/modules/booking/booking.controller.js
5. server/src/modules/booking/booking.routes.js
   POST /bookings: verifyToken + authorizeRole(['farmer','super_admin'])
   GET /bookings: verifyToken (role-filtered in service)
   Mount in app.js

─── TESTS ───

6. booking/__tests__/booking.service.test.js
   Mock: booking.query.js, transaction.js, notifications.service.js
   - createBooking: valid → calls getDemandForUpdate + insertBooking + deductRemainingQuantity in order
   - createBooking: quantity > remaining → throws 400, no insertBooking called
   - createBooking: exact remaining (quantity === remaining) → succeeds
   - createBooking: notification failure after commit → does NOT throw, logs error

7. booking/__tests__/booking.routes.test.js (Supertest + real DB)
   - POST /bookings (farmer) valid → 201, demand.remaining_quantity decremented
   - POST /bookings (admin token) → 403
   - POST /bookings quantity > remaining → 400
   - POST /bookings demand not found → 404
   - GET /bookings (admin) → sees all bookings
   - GET /bookings (farmer) → only their own bookings

8. booking/__tests__/booking.concurrency.test.js (Supertest + real DB — CRITICAL)
   Setup: create demand with remaining_quantity=5, create 10 farmer users
   Test:
     results = await Promise.allSettled(
       Array(10).fill(null).map((_, i) =>
         request(app).post('/bookings')
           .set('Authorization', `Bearer ${farmerTokens[i]}`)
           .send({ demand_id: demandId, quantity: 1 })
       )
     )
     successes = results.filter(r => r.value?.status === 201)
     failures = results.filter(r => r.value?.status === 400)
     expect(successes).toHaveLength(5)
     expect(failures).toHaveLength(5)
     // Verify DB: demand.remaining_quantity === 0
     const [demand] = await pool.query('SELECT remaining_quantity FROM demand WHERE id=?', [demandId])
     expect(demand[0].remaining_quantity).toBe(0)

VERIFICATION:
- POST /bookings → 201, remaining_quantity decremented in DB
- POST /bookings with quantity > remaining → 400 "Quantity exceeds remaining"
- 10 concurrent requests for 5 remaining → exactly 5 succeed
- remaining_quantity never goes below 0
```

---

## PHASE 10 — Demand Booking — Frontend

```
Read: /Farmer/FRONTEND_ARCHITECTURE.md, /Farmer/development-phase.md (Phase 10)

Generate PHASE 10 — Demand Booking frontend (farmer booking UI).

─── FILES TO GENERATE ───

1. client/src/features/booking/api.js
   - createBookingApi(data) → api.post('/bookings', data)
   - getBookingsApi(params) → api.get('/bookings', { params })

2. client/src/features/booking/hooks.js
   - useBookings(filters)
   - useCreateBooking() → { book, loading, error }

3. client/src/features/booking/DemandBookingPage.jsx
   Uses: AppLayout, DataTable, ProgressBar, Modal (for booking form)
   Farmer sees available demand list (GET /demand)
   Columns: Crop, Location, Total Qty, Remaining (ProgressBar), Unit, Book button
   Book button:
   - Disabled + tooltip if remaining_quantity === 0 (gray, "Sold out")
   - Opens BookingFormModal with demand data

4. client/src/features/booking/BookingFormModal.jsx
   Uses: Modal, ConfirmDialog, FormField
   Props: { demand, isOpen, onClose, onSuccess }
   - Shows: Crop name, Location, Available: {remaining_quantity} {unit}
   - Quantity input: number, min=1, max=remaining_quantity (Yup validation)
   - Client-side error if > remaining
   - "Confirm Booking" button → calls createBookingApi → toast.success("Booking confirmed!") → onSuccess() → close
   - On API 400 → show inline error "Insufficient remaining quantity"

5. client/src/features/booking/MyBookingsPage.jsx
   Uses: AppLayout, DataTable
   Farmer's own booking history (GET /bookings)
   Columns: Crop, Location, Quantity, Unit, Booked At

─── TESTS ───

6. booking/__tests__/DemandBookingPage.test.jsx
   - renders demand table with ProgressBar for each row
   - Book button disabled when remaining_quantity = 0
   - Book button click opens BookingFormModal

7. booking/__tests__/BookingFormModal.test.jsx
   - renders demand info and quantity input
   - shows validation error when quantity > remaining
   - calls createBookingApi with demand_id and quantity on valid submit
   - shows success toast on 201
   - shows inline error on 400

VERIFICATION:
- Farmer views demand list with remaining quantity progress bars
- "Sold out" demands have disabled Book button
- Submit booking → remaining_quantity decreases on page refresh
```

---

## PHASE 11 — Notifications — Backend

```
Read: /Farmer/API_DESIGN.md (Notification module), /Farmer/development-phase.md (Phase 11)

Generate PHASE 11 — Notifications backend (replace stub with full implementation).

─── FILES TO GENERATE ───

1. server/src/config/firebase.js
   - import admin from 'firebase-admin'
   - Parse FIREBASE_SERVICE_ACCOUNT from env (JSON string)
   - admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
   - Export admin
   NOTE: if FIREBASE_SERVICE_ACCOUNT env is placeholder/missing → log warning, skip init, export null

2. server/src/utils/fcm.js
   - sendPushToUsers(userIds[], title, body, data):
     1. fetch device tokens for userIds: SELECT token FROM device_tokens WHERE user_id IN (?)
     2. if no tokens → return (skip silently)
     3. admin.messaging().sendEachForMulticast({ tokens, notification: {title, body}, data })
     4. Log success count and failure count
     5. Catch all errors → log, never throw

3. server/src/modules/notifications/notifications.query.js
   - createBulkNotifications(records[{userId, type, title, message, data}]):
     Bulk INSERT INTO notifications
   - getNotifications(userId, filters, page, limit):
     SELECT * FROM notifications WHERE user_id=? AND is_deleted=0 (notifications has no is_deleted — use all)
     Filters: type, is_read
     ORDER BY created_at DESC
     Paginated
   - markNotificationRead(id, userId):
     UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?
   - markAllNotificationsRead(userId):
     UPDATE notifications SET is_read=1 WHERE user_id=? AND is_read=0
   - getUnreadCount(userId):
     SELECT COUNT(*) FROM notifications WHERE user_id=? AND is_read=0
   - getUserDeviceTokens(userIds[]):
     SELECT user_id, token FROM device_tokens WHERE user_id IN (?)

4. server/src/modules/notifications/notifications.service.js (REPLACE STUB)
   - sendNotification(userIds, type, title, message, data={}):
     if userIds.length === 0 return
     records = userIds.map(id => ({ userId: id, type, title, message, data: JSON.stringify(data) }))
     await createBulkNotifications(records)  // DB first — always
     try { await sendPushToUsers(userIds, title, message, data) }  // FCM — best effort
     catch(e) { logger.error('FCM push failed', e) }  // never re-throw

5. server/src/modules/notifications/notifications.controller.js
   - getNotifications: GET /notifications (req.user.id + filters)
   - markRead: PATCH /notifications/:id/read
   - markAllRead: PATCH /notifications/read-all
   - getUnreadCount: GET /notifications/unread-count

6. server/src/modules/devices/devices.controller.js
   - registerDevice: POST /devices/register { token, device_type }
   - removeDevice: DELETE /devices/:id

7. Mount routes in app.js

─── TESTS ───

8. notifications/__tests__/notifications.service.test.js
   Mock: notifications.query.js, utils/fcm.js
   - sendNotification: calls createBulkNotifications with correct records for each userId
   - sendNotification: calls sendPushToUsers after DB insert
   - sendNotification: FCM throws → caught, does NOT re-throw
   - sendNotification: empty userIds → early return, no DB call

9. notifications/__tests__/notifications.routes.test.js (Supertest)
   - GET /notifications → 200 paginated
   - GET /notifications?is_read=false → only unread
   - PATCH /notifications/:id/read → is_read=1 in DB
   - PATCH /notifications/read-all → all user's notifications marked read
   - GET /notifications/unread-count → returns count

VERIFICATION:
- Create a demand → notification records created for all active farmers in DB
- Book demand → BOOKING_DONE notification created
- GET /notifications → returns notifications for logged-in user
- PATCH /notifications/read-all → all marked read
- FCM placeholder → warning logged, no crash
```

---

## PHASE 12 — Notifications — Frontend

```
Read: /Farmer/FRONTEND_ARCHITECTURE.md, /Farmer/development-phase.md (Phase 12)

Generate PHASE 12 — Notifications frontend (list page, bell icon, unread count).

─── FILES TO GENERATE ───

1. client/src/store/notificationStore.js
   Zustand store:
   - State: { unreadCount: 0 }
   - setUnreadCount(count)
   - startPolling(): setInterval every 30s → GET /notifications/unread-count → setUnreadCount
   - stopPolling(): clearInterval
   Call startPolling() in App.jsx after login

2. client/src/features/notifications/api.js
   - getNotificationsApi(params) → api.get('/notifications', { params })
   - markReadApi(id) → api.patch(`/notifications/${id}/read`)
   - markAllReadApi() → api.patch('/notifications/read-all')
   - getUnreadCountApi() → api.get('/notifications/unread-count')

3. Update client/src/components/layout/Header.jsx
   - Import notificationStore
   - Bell icon shows red badge with unreadCount (hide badge if 0)
   - Bell click → navigate to /notifications

4. client/src/features/notifications/NotificationListPage.jsx
   Uses: AppLayout, DataTable, FilterBar, SelectInput
   - Filter: type (DEMAND_CREATED/DEMAND_UPDATED/BOOKING_DONE/WEATHER_ALERT), is_read (all/unread)
   - DataTable columns: Type (badge), Title, Message, Date, Read status (dot indicator)
   - Row click → markReadApi(id) → refresh list + update unread count in store
   - "Mark All Read" button → markAllReadApi() → refresh

─── TESTS ───

5. notifications/__tests__/NotificationListPage.test.jsx
   - renders notification rows
   - unread row has visual indicator
   - row click calls markReadApi

6. components/layout/__tests__/Header.test.jsx
   - shows unread count badge when unreadCount > 0
   - hides badge when unreadCount = 0

VERIFICATION:
- After demand created → bell shows badge count
- Click bell → /notifications page
- Click notification row → marked read, badge decreases
- "Mark All Read" → badge goes to 0
```

---

## PHASE 13 — Weather Alert — Backend

```
Read: /Farmer/development-phase.md (Phase 13), /Farmer/PRD.md (Weather section)

Generate PHASE 13 — Weather Alert backend (cron + OpenWeatherMap).
No frontend needed for this phase.

─── FILES TO GENERATE ───

1. server/src/modules/weather/weather.query.js
   - logWeatherEvent(type, message) → INSERT INTO weather_logs(type, message)
   - getActiveLocationNames() → SELECT name FROM locations (all locations — no soft delete on locations)

2. server/src/modules/weather/weather.service.js
   - detectSeverity(weatherData):
     Check: weatherData.weather[0].id codes (2xx=thunderstorm, 3xx=drizzle, 5xx=rain, 6xx=snow)
     Check: weatherData.main.temp > 40 or < 0 (extreme temp)
     Return: { isSevere: boolean, condition: string, description: string } or null

   - runWeatherCheck():
     locations = getActiveLocationNames()
     for each location:
       try {
         url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${OPENWEATHER_API_KEY}&units=metric`
         response = await axios.get(url)
         severity = detectSeverity(response.data)
         if severity:
           farmerIds = getAllFarmerUserIds() (import from demand.query or create shared util)
           await notificationService.sendNotification(farmerIds, 'WEATHER_ALERT', 'Weather Alert', ...)
           await logWeatherEvent(severity.condition, severity.description + ' at ' + location)
       } catch(e) {
         logger.error(`Weather check failed for ${location}:`, e.message)
         // Continue to next location
       }

3. server/src/modules/weather/weather.cron.js
   - import { schedule } from 'node-cron'
   - export function startWeatherCron():
     schedule('0 */6 * * *', async () => {
       logger.info('Weather cron running...')
       await runWeatherCheck()
     })

4. Call startWeatherCron() in server.js after DB connect

─── TESTS ───

5. weather/__tests__/weather.service.test.js
   Mock: axios, weather.query.js, notifications.service.js, demand.query.js
   - runWeatherCheck: rain condition → sendNotification called for all farmers + logWeatherEvent called
   - runWeatherCheck: no severe condition → sendNotification NOT called
   - runWeatherCheck: API failure for one location → caught + logged, continues to next location
   - detectSeverity: thunderstorm code 200 → returns isSevere=true
   - detectSeverity: clear sky code 800 → returns null

VERIFICATION:
- npm run dev → "Weather cron started" in logs
- Manually call runWeatherCheck() → weather_logs table has new entry
- If API key placeholder → error logged, no crash
```

---

## PHASE 14 — Inventory — Backend

```
Read: /Farmer/API_DESIGN.md (Inventory), /Farmer/development-phase.md (Phase 14)

Generate PHASE 14 — Inventory Management backend.

─── FILES TO GENERATE ───

1. server/src/modules/inventory/inventory.query.js
   - getInventory(filters):
     SELECT inv.*, c.name as crop_name, l.name as location_name
     FROM inventory inv JOIN crops c ON inv.crop_id=c.id JOIN locations l ON inv.location_id=l.id
     WHERE (crop_id=? if filter) AND (location_id=? if filter)
     Paginated

   - adjustInventory(id, changeAmount, conn):
     UPDATE inventory SET quantity = quantity + ?, updated_at=NOW() WHERE id=?
     Uses conn (transaction)
     Check: if resulting quantity < 0 → throw { status: 400, message: 'Insufficient inventory' }

   - insertInventoryLog(inventoryId, changeAmount, reason, conn):
     INSERT INTO inventory_logs(inventory_id, change_amount, reason)
     Uses conn

   - getInventoryLogs(inventoryId, page, limit):
     SELECT * FROM inventory_logs WHERE inventory_id=? ORDER BY created_at DESC

2. server/src/modules/inventory/inventory.service.js
   - adjustInventory(id, changeAmount, reason):
     withTransaction(async conn => {
       adjustInventory(id, changeAmount, conn)
       insertInventoryLog(id, changeAmount, reason, conn)
     })

3. inventory.controller.js + inventory.routes.js
   GET /inventory, POST /inventory/adjust, GET /inventory/:id/logs
   Admin only. Mount in app.js.

─── TESTS ───

4. inventory/__tests__/inventory.service.test.js
   Mock: inventory.query.js, transaction.js
   - adjustInventory: calls adjustInventory query + insertInventoryLog in transaction
   - adjustInventory: negative result (stock out too much) → throws 400
   - transaction rollback: if insertInventoryLog fails → quantity not changed

5. inventory/__tests__/inventory.routes.test.js (Supertest)
   - GET /inventory → 200 paginated
   - POST /inventory/adjust { id, changeAmount: 100, reason: 'Received stock' } → 200
   - GET /inventory/:id/logs → shows adjustment log

VERIFICATION:
- POST /inventory/adjust → quantity changes + log record created
- Attempt to reduce below 0 → 400 error
- GET /inventory/:id/logs → shows history of changes
```

---

## PHASE 15 — Inventory — Frontend

```
Read: /Farmer/FRONTEND_ARCHITECTURE.md, /Farmer/development-phase.md (Phase 15)

Generate PHASE 15 — Inventory Management frontend.

─── FILES TO GENERATE ───

1. client/src/features/inventory/api.js
   - getInventoryApi(params), adjustInventoryApi(data), getInventoryLogsApi(inventoryId, params)

2. client/src/features/inventory/hooks.js — useInventory(filters), useAdjustInventory()

3. client/src/features/inventory/InventoryListPage.jsx
   DataTable: Crop, Location, Quantity, Last Updated, Actions (Adjust button, View Logs link)
   FilterBar: crop SelectInput, location SelectInput

4. client/src/features/inventory/AdjustModal.jsx
   Uses Modal: change amount input (can be negative for stock out), reason textarea
   Shows current quantity above input
   On submit: adjustInventoryApi → toast.success → refetch

5. client/src/features/inventory/InventoryLogsPage.jsx
   DataTable: Change Amount (+/-), Reason, Date
   Positive changes: text-green-600, Negative: text-red-500

─── TESTS ───

6. inventory/__tests__/AdjustModal.test.jsx
   - renders current quantity and input
   - calls adjustInventoryApi with correct payload

VERIFICATION:
- Inventory list shows all crops × locations
- Adjust +100 → quantity increases, log created
- View Logs → shows adjustment history
```

---

## PHASE 16 — Reports — Backend

```
Read: /Farmer/API_DESIGN.md (Reports), /Farmer/development-phase.md (Phase 16)

Generate PHASE 16 — Reports backend.

─── FILES TO GENERATE ───

1. server/src/modules/reports/reports.query.js
   - getCollectionReport(filters):
     SELECT c.name as crop, l.name as location,
            SUM(db.quantity) as total_booked,
            COUNT(db.id) as booking_count
     FROM demand_bookings db
     JOIN demand d ON db.demand_id=d.id AND d.is_deleted=0
     JOIN crops c ON d.crop_id=c.id
     JOIN locations l ON d.location_id=l.id
     WHERE (d.crop_id=? if filter) AND (d.location_id=? if filter)
           AND (d.created_at >= ? if date_from) AND (d.created_at <= ? if date_to)
     GROUP BY c.id, l.id
     ORDER BY total_booked DESC

   - getCommitmentReport(filters):
     SELECT u.first_name, u.email,
            SUM(db.quantity) as total_committed,
            COUNT(db.id) as booking_count
     FROM demand_bookings db
     JOIN farmers f ON db.farmer_id=f.id
     JOIN users u ON f.user_id=u.id AND u.is_deleted=0
     JOIN demand d ON db.demand_id=d.id
     WHERE (d.crop_id=? if filter) AND (d.location_id=? if filter)
           AND (db.created_at >= ? if date_from) AND (db.created_at <= ? if date_to)
     GROUP BY f.id
     ORDER BY total_committed DESC

2. server/src/modules/reports/reports.service.js
   - getReport(type, filters) → calls correct query
   - exportReport(type, filters, format='csv'):
     data = getReport(type, filters)
     if format === 'excel':
       use xlsx package: workbook → sheet → buffer
       return { buffer, contentType: 'application/vnd.openxmlformats...' }
     else:
       convert to CSV string using csv-parser or manual join
       return { buffer: csvString, contentType: 'text/csv' }

3. reports.controller.js + reports.routes.js
   GET /reports/collection, GET /reports/commitment, GET /reports/export?type=&format=
   Admin only.

─── TESTS ───

4. reports/__tests__/reports.service.test.js
   Real DB — insert test demand + bookings
   - getCollectionReport: sums correctly for crop+location
   - getCommitmentReport: sums per farmer correctly
   - date range filter excludes records outside range

5. reports/__tests__/reports.routes.test.js
   - GET /reports/collection → 200 with array
   - GET /reports/export?type=collection&format=csv → content-type text/csv
   - GET /reports/export?type=collection&format=excel → xlsx content-type

VERIFICATION:
- GET /reports/collection → grouped by crop + location with totals
- GET /reports/commitment → per farmer totals
- Export CSV → downloadable file with correct columns
```

---

## PHASE 17 — Reports — Frontend

```
Read: /Farmer/FRONTEND_ARCHITECTURE.md, /Farmer/development-phase.md (Phase 17)

Generate PHASE 17 — Reports frontend.

─── FILES TO GENERATE ───

1. client/src/features/reports/api.js
   - getCollectionReportApi(params), getCommitmentReportApi(params)
   - exportReportApi(type, format, params) → api.get('/reports/export', { params: {type, format, ...params}, responseType: 'blob' })
     On response: create URL.createObjectURL(blob) → trigger <a download> click

2. client/src/features/reports/ReportsPage.jsx
   Uses: AppLayout, FilterBar, SelectInput (crop, location), DateRangePicker, DataTable
   - Tab bar: "Collection Report" | "Commitment Report"
   - FilterBar: crop, location, date range
   - DataTable: changes columns based on active tab
     Collection: Crop, Location, Total Booked, Booking Count
     Commitment: Farmer Name, Email, Total Committed, Booking Count
   - Export buttons: "Export CSV" | "Export Excel"
   - On export: call exportReportApi → trigger download

3. reports/__tests__/ReportsPage.test.jsx
   - renders Collection tab by default
   - switching tab changes columns
   - Export CSV button calls exportReportApi with format=csv

VERIFICATION:
- /reports page with Collection tab → grouped data
- Switch to Commitment → per-farmer data
- Export CSV → browser downloads file
```

---

## PHASE 18 — Dashboard — Backend

```
Read: /Farmer/development-phase.md (Phase 18)

Generate PHASE 18 — Dashboard backend (farmer metrics aggregation).

─── FILES TO GENERATE ───

1. server/src/modules/dashboard/dashboard.query.js
   - getDashboardMetrics():
     SELECT
       COUNT(*) as total,
       SUM(status = 'active') as active,
       SUM(status = 'pending') as pending,
       SUM(status = 'suspended') as suspended
     FROM farmers
     WHERE is_deleted = 0

2. dashboard.controller.js → GET /dashboard → successResponse with metrics
3. dashboard.routes.js → verifyToken + authorizeRole(['admin','super_admin'])
   Mount in app.js

─── TESTS ───

4. dashboard/__tests__/dashboard.routes.test.js (Supertest + real DB)
   Insert 3 active + 2 pending + 1 suspended farmers
   GET /dashboard → { total: 6, active: 3, pending: 2, suspended: 1 }
   GET /dashboard (farmer token) → 403

VERIFICATION:
- GET /dashboard with admin token → correct counts
- GET /dashboard with farmer token → 403
```

---

## PHASE 19 — Dashboard — Frontend

```
Read: /Farmer/FRONTEND_ARCHITECTURE.md, /Farmer/development-phase.md (Phase 19)

Generate PHASE 19 — Dashboard frontend.

─── FILES TO GENERATE ───

1. client/src/features/dashboard/api.js
   - getDashboardApi() → api.get('/dashboard')

2. client/src/features/dashboard/DashboardPage.jsx
   Uses: AppLayout, StatCard, LoadingSpinner

   Layout:
   - Page title "Dashboard"
   - Grid 2×2 of StatCard components:
     - Total Farmers: total value, Users icon, border-l-4 border-primary
     - Active Farmers: active, green CheckCircle icon
     - Pending Verification: pending, yellow Clock icon
     - Suspended: suspended, red XCircle icon
   - Quick links row below: "Manage Farmers" → /farmers, "Create Demand" → /demand, "View Reports" → /reports

   Fetch on mount with LoadingSpinner while loading.

3. dashboard/__tests__/DashboardPage.test.jsx
   Mock: dashboard/api.js
   - renders 4 StatCard components
   - shows LoadingSpinner while fetching
   - displays correct values from API response
   - quick links navigate to correct routes

VERIFICATION:
- /dashboard shows 4 metric cards with real counts
- Numbers match farmers table in DB
```

---

## PHASE 20 — Testing & QA

```
Read these files before generating:
- /Farmer/testing-strategy.md (full file)
- /Farmer/development-phase.md (Phase 20 section)

Generate PHASE 20 — End-to-End tests and final QA checks.

─── E2E TESTS (Playwright) ───

Generate all E2E test files in client/e2e/:

1. e2e/auth.spec.js
   - test: register as farmer → redirected to /demand, status=pending shown
   - test: register as admin → redirected to /dashboard
   - test: login with email/password → redirected correctly by role
   - test: logout → redirected to /login, protected routes no longer accessible

2. e2e/farmers.spec.js (admin user)
   - test: navigate to /farmers → table loads with rows
   - test: click Add Farmer → fill form → submit → new farmer in list
   - test: edit farmer status to active → status badge updates
   - test: delete farmer → confirmation dialog → farmer removed from list

3. e2e/demand.spec.js
   - test (admin): create demand → appears in list with correct ProgressBar
   - test (farmer): views demand list → sees ProgressBar, no Edit/Delete buttons

4. e2e/booking.spec.js
   - test (farmer): clicks Book on demand → BookingFormModal opens
   - test: enters valid quantity → submit → success toast
   - test: remaining_quantity decreases on demand list after booking
   - test: enter quantity > remaining → validation error shown

5. e2e/notifications.spec.js
   - test: after booking → bell icon shows badge count > 0
   - test: navigate to /notifications → booking notification in list
   - test: click notification → marked as read, badge decreases
   - test: "Mark All Read" → badge goes to 0

6. e2e/reports.spec.js (admin)
   - test: navigate to /reports → Collection tab loads
   - test: switch to Commitment tab → columns change
   - test: "Export CSV" → file download triggered (check for download event)

─── FINAL QA CHECKLIST ───

Generate a script: server/scripts/qa-checks.js
Run these SQL assertions against the DB:
- All queries include is_deleted=0 filter (review manually — list files to check)
- No demand_bookings where quantity > demand.remaining_quantity (data integrity)
- All farmer self-registrations have matching farmers row (no orphan users)

─── COVERAGE REPORT ───

- Run: npm run test:coverage (backend) → report in coverage/
- Verify: booking.service.js → 100% line coverage
- Run: npm run test (frontend) → all component tests pass
- Run: npm run test:e2e → all Playwright specs pass

VERIFICATION:
- All 6 E2E specs pass in headed mode (npx playwright test --headed)
- Backend coverage: booking service 100%, all services ≥80%
- No console errors in browser during E2E runs
- Manual concurrency test: Apache Bench or curl parallel → no overbooking
```

---

## NOTES FOR ALL PHASES

- **After each phase:** run `npm test` (backend) or `npm run test` (frontend) — all tests must pass before moving to next phase
- **Never skip tests:** if test fails, fix the code — do not skip or comment out the test
- **Migration for new tables:** create a new numbered SQL file (e.g. `002_add_column.sql`) — never edit 001 after it's been run
- **Env variables:** never hardcode secrets — always use `process.env.VARIABLE_NAME`
- **Soft delete:** if you notice a query missing `WHERE is_deleted=0` — fix it immediately before continuing
```

---
