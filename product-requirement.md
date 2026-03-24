# Product Requirement Document (PRD)
## Agri Demand & Farmer Management System

---

## 1. Problem Statement

Agricultural supply chains suffer from:
- No centralized visibility into crop demand across locations
- Manual, error-prone booking processes leading to overbooking
- Zero real-time communication between admin and farmers
- No structured inventory or commitment tracking

This system solves these problems with a centralized web platform.

---

## 2. Goals

| Goal | Outcome |
|---|---|
| Centralize demand management | Admin creates/tracks demand in one place |
| Safe concurrent booking | No overbooking under any load |
| Real-time notifications | Farmers get alerts instantly via FCM push |
| Inventory visibility | Admin tracks crop stock by location |
| Reporting | CSV/Excel reports on collections and commitments |

---

## 3. User Roles & Permissions

| Feature | Super Admin | Admin | Farmer |
|---|---|---|---|
| Manage Admins | ✅ | ❌ | ❌ |
| Manage Farmers | ✅ | ✅ | ❌ |
| Create / Update Demand | ✅ | ✅ | ❌ |
| Book Demand | ✅ | ❌ | ✅ |
| View Demand | ✅ | ✅ | ✅ |
| Manage Inventory | ✅ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ❌ |
| View Notifications | ✅ | ✅ | ✅ |
| Override Operations | ✅ | ❌ | ❌ |

---

## 4. Core Modules

---

### 4.1 Authentication & Authorization

**Features:**
- Email + password login
- JWT-based session management (access token)
- Role-based route protection (RBAC)
- GET /auth/me for session refresh

**Rules:**
- JWT must include: `id`, `role`, `email`
- All protected routes validate token via middleware
- Role check: `authorizeRole(['admin', 'super_admin'])`

---

### 4.2 Farmers Management (Admin)

**Features:**
- Create farmer (creates user + farmer record atomically)
- Edit farmer profile (location, branch, crop assignments, status)
- View farmer list with filters: location, branch, crop, status
- Soft delete farmer
- Bulk upload via CSV/Excel (Multer + csv-parser/xlsx)
- Export filtered farmer list as CSV

**Farmer Status Flow:**
```
pending → active → suspended
pending → suspended
```

**Business Rules:**
- A farmer user can only have one farmer record
- Crops assigned via `farmer_crops` join table
- Filters build dynamic WHERE clauses in raw SQL

---

### 4.3 Demand Planning (Admin)

**Features:**
- Create demand: crop, location, total_quantity, unit (kg/ton)
- Update demand (quantity adjustments trigger notifications)
- View demand list with filters: crop, location, date range, page/limit
- Soft delete demand
- `remaining_quantity` always equals `total_quantity - SUM(bookings.quantity)`

**Business Rules:**
- On demand create → notify all farmers
- On demand update → notify all farmers
- `remaining_quantity` must be recalculated on every booking

---

### 4.4 Demand Booking (Farmer — CRITICAL MODULE)

**Booking Flow:**
```
Farmer submits quantity
→ Service begins DB transaction
→ SELECT demand FOR UPDATE (row-level lock)
→ Validate: quantity <= remaining_quantity
→ INSERT demand_booking
→ UPDATE demand SET remaining_quantity = remaining_quantity - quantity
→ COMMIT
→ Create notifications for all users
→ Send FCM push to all farmers
```

**Business Rules:**
- Overbooking is impossible: enforced at DB + service layer
- Transaction + `SELECT ... FOR UPDATE` is mandatory — no exceptions
- If validation fails → rollback and return 400
- Concurrent requests must queue safely via row lock

---

### 4.5 Notification System

**Notification Types:**
- `DEMAND_CREATED` — sent to all farmers
- `DEMAND_UPDATED` — sent to all farmers
- `BOOKING_DONE` — sent to admin + booking farmer
- `WEATHER_ALERT` — sent to all farmers

**Features:**
- Every notification stored in `notifications` table
- Mark single notification as read: `PATCH /notifications/:id/read`
- Mark all read: `PATCH /notifications/read-all`
- List with filters: type, is_read, page, limit
- FCM push sent after DB storage (never before)

**Rules:**
- No module sends notifications directly — all go through `NotificationService`
- Push is best-effort (failure should NOT rollback the main transaction)

---

### 4.6 Weather Alert System (Internal Cron)

**Features:**
- Cron job (node-cron) runs every 6 hours
- Fetches weather from OpenWeatherMap API for all active locations
- Detects: Rain, Storm, Extreme Heat/Cold
- Creates `WEATHER_ALERT` notifications for all farmers
- Logs event in `weather_logs` table

**No public API endpoint** — internal only.

---

### 4.7 Inventory Management (Admin)

**Features:**
- View inventory by location + crop
- Manual adjustment with reason (logged to `inventory_logs`)
- View adjustment history (inventory_logs)

**Rules:**
- Every adjustment creates an `inventory_logs` record
- `change_amount` can be positive (stock in) or negative (stock out)

---

### 4.8 Reports Module (Admin)

**Report Types:**

| Report | Description |
|---|---|
| Produce Collection | Total crop quantity booked per location/date |
| Farmer Commitment | Per-farmer booking totals vs demand |

**Features:**
- Filter by: location, crop, date range
- Export as CSV or Excel
- Reports are query-generated (no stored report tables)

---

### 4.9 Dashboard (Admin)

**Metrics:**
- Total Farmers
- Active Farmers
- Pending Verification
- Suspended Farmers

**Data source:** Aggregate SQL queries on `farmers` table.

---

## 5. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| Concurrency | Booking handles 100+ concurrent requests without overbooking |
| Pagination | Required for every list endpoint (default: page=1, limit=10) |
| Performance | All filter queries use indexed columns |
| Security | JWT auth, RBAC, parameterized SQL, bcrypt passwords |
| Reliability | Transactions rollback cleanly on any failure |
| Logging | Winston structured logs for all requests and errors |
| Soft Delete | All records use `is_deleted + deleted_at`, never hard delete |

---

## 6. Project Structure

```
Farmer/
├── server/                    # Node.js + Express backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── farmers/
│   │   │   ├── demand/
│   │   │   ├── booking/
│   │   │   ├── inventory/
│   │   │   ├── notifications/
│   │   │   ├── weather/
│   │   │   └── master/        # crops, locations, branches
│   │   ├── config/
│   │   ├── database/          # connection pool
│   │   ├── middlewares/       # auth, error, validation
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── migrations/            # Numbered SQL migration files
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── .env.example
│   └── package.json
│
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/        # SHARED components — used across 2+ features
│   │   │   ├── DataTable.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── FormField.jsx
│   │   │   ├── SelectInput.jsx
│   │   │   ├── MultiSelect.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── DateRangePicker.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   ├── SearchInput.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Header.jsx
│   │   ├── features/          # Feature-specific code (imports from components/)
│   │   │   ├── auth/
│   │   │   ├── farmers/
│   │   │   ├── demand/
│   │   │   ├── booking/
│   │   │   ├── notifications/
│   │   │   ├── inventory/
│   │   │   ├── reports/
│   │   │   └── dashboard/
│   │   ├── services/          # axios API layer
│   │   ├── store/             # Zustand stores
│   │   ├── hooks/             # global hooks
│   │   ├── utils/
│   │   ├── routes/
│   │   └── App.jsx
│   ├── e2e/                   # Playwright tests
│   ├── .env.example
│   └── package.json
│
└── docker-compose.yml         # MySQL + services
```

---

## 7. Additional Tools (Recommended Beyond Original Stack)

| Tool | Purpose | Layer |
|---|---|---|
| **Docker + Docker Compose** | Run MySQL locally without installation. Ensures consistent dev environment across all developers | DevOps |
| **Supertest** | HTTP integration testing for Express routes. Test real API endpoints with a real DB connection | Backend Testing |
| **Vitest** | Vite-native test runner. Replaces Jest on frontend — 10x faster, zero config with Vite | Frontend Testing |
| **ESLint + Prettier** | Code quality and consistent formatting. Prevents style drift across files | Both |
| **Husky + lint-staged** | Run ESLint + Prettier on staged files before every commit. Prevents broken code from entering repo | Both |
| **Morgan** | HTTP request logging middleware. Pairs with Winston to log every API request with method, URL, status, duration | Backend |
| **migrate-sql (custom)** | Numbered SQL migration files (`001_init.sql`, `002_add_index.sql`). Track schema changes in version control | Database |

---

## 8. Success Criteria

- [ ] Zero overbooking incidents under concurrent load
- [ ] All notifications stored in DB before FCM push is attempted
- [ ] All queries include `WHERE is_deleted = false`
- [ ] All booking endpoints use transactions + row-level locking
- [ ] Reports generate correctly with date/location/crop filters
- [ ] Bulk CSV upload processes without crashing on malformed rows

---

## 9. Out of Scope (v1)

- Real-time WebSockets
- Mobile app (FCM push only — no mobile UI)
- AI/ML recommendations
- Rate limiting
- Deployment / CI-CD pipeline

---
