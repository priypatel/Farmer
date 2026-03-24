# 📘 Product Requirement Document (PRD)

## Agri Demand & Farmer Management System

---

# 1. 🎯 Objective

Build a centralized platform to:

- Manage farmers and their crop data
- Create and manage crop demand
- Allow farmers to book supply against demand
- Provide real-time-like updates on demand fulfillment
- Notify users about demand changes and weather alerts
- Generate reports and manage inventory

---

# 2. 👥 User Roles

## 2.1 Admin

- Manage farmers
- Create and update demand
- View reports
- Manage inventory

## 2.2 Farmer

- View available demand
- Book quantity against demand
- Receive notifications (demand updates, weather alerts)

## 2.3 Super Admin

- Full system access
- Manage admins
- Override system operations

---

# 3. 🧩 Core Modules

---

## 3.1 Authentication & Authorization

- Login system (JWT-based)
- Role-based access control (RBAC)
- Secure protected routes

---

## 3.2 Farmers Management

### Features:

- Add / Edit / View farmers
- Assign:
  - Location
  - Branch
  - Crops

- Status management:
  - Active
  - Pending
  - Suspended

### Filters:

- Location
- Branch
- Crop
- Status

### Additional:

- Export farmers (CSV)
- Bulk upload via CSV/Excel

---

## 3.3 Demand Planning

### Features:

- Create demand (crop, location, quantity, unit)
- Update demand
- View demand list with filters:
  - Crop
  - Location
  - Time period

### Business Rules:

- Demand has:
  - Total Quantity
  - Remaining Quantity

- Remaining quantity updates dynamically after bookings

---

## 3.4 Demand Booking (Farmer Side)

### Flow:

1. Farmer views available demand
2. Farmer selects demand
3. Farmer enters quantity to book
4. System validates:
   - Cannot exceed remaining quantity

5. Booking is recorded
6. Remaining quantity updates

### Critical Constraint:

- Must handle concurrent bookings safely (no overbooking)

---

## 3.5 Notification System

### Types:

- Demand Created
- Demand Updated
- Booking Update
- Weather Alert

### Features:

- Notifications stored in DB
- Each user has individual notifications
- Mark as read/unread

---

## 3.6 Notification History Page

### Features:

- List all notifications
- Pagination support
- Filter by:
  - Type
  - Date

- Read/Unread status

---

## 3.7 Weather Alert System

### Features:

- Integrate external weather API
- Periodically check weather conditions
- Trigger alerts:
  - Rain
  - Storm
  - Extreme conditions

### Behavior:

- Notifications sent to all farmers

---

## 3.8 Inventory Management

### Features:

- View inventory by:
  - Location
  - Crop

- Adjust inventory manually
- Track inventory changes

---

## 3.9 Reports Module

### Types:

1. Produce Collection Reports
2. Farmer Commitment Reports

### Features:

- Filter by:
  - Location
  - Crop
  - Date range

- Export:
  - CSV
  - Excel

---

## 3.10 Dashboard

### Metrics:

- Total Farmers
- Active Farmers
- Pending Verification
- Suspended Farmers

---

# 4. 🔄 System Workflows

---

## 4.1 Demand Creation Flow

Admin → Create Demand → Store in DB → Notify all farmers

---

## 4.2 Booking Flow

Farmer → Book Quantity → Validate → Update Remaining → Save Booking → Notify all users

---

## 4.3 Notification Flow

Event Trigger → Create Notification Records → User Fetches Notifications

---

## 4.4 Weather Alert Flow

Cron Job → Fetch Weather → Detect Condition → Create Notifications

---

# 5. 🧱 Data Management Rules

---

## 5.1 Soft Delete

- All records use soft delete
- Fields:
  - is_deleted
  - deleted_at

---

## 5.2 Data Integrity

- No overbooking allowed
- Backend is source of truth
- All calculations happen server-side

---

## 5.3 Concurrency Handling

- Booking must use transaction + locking
- Prevent race conditions

---

# 6. 🔐 Security Requirements

- JWT authentication
- Role-based access control
- Input validation
- SQL injection protection
- Secure API endpoints

---

# 7. ⚡ Non-Functional Requirements

---

## Performance

- Pagination for large datasets
- Efficient filtering queries

## Scalability

- Modular backend structure
- Separate services for heavy logic

## Reliability

- Transaction-safe operations
- Error handling

---

# 8. 🚫 Out of Scope (for now)

- Real-time WebSockets (initially)
- Mobile app
- AI-based recommendations

---

# 9. 🧠 Assumptions

- Farmers interact via web interface
- Internet connectivity available
- Admin manages data accuracy

---

# 10. 📌 Success Criteria

- No data inconsistency in demand booking
- Accurate notification delivery
- Fast filtering and reporting
- Stable performance with growing data

---

# 11. ⚠️ Risks

- Concurrency issues in booking
- Poor DB design causing performance issues
- Notification system becoming unstructured
- Weather API reliability

---

# 12. 🛠️ Tech Stack

- Frontend: React (Vite) + Tailwind + shadcn
- Backend: Node.js (Express)
- Database: MySQL
- External APIs: Weather API

---
