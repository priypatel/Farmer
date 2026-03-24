# 🛠️ TECHSTACK.md

## Agri Demand & Farmer Management System

---

# 1. 🎯 Purpose

Define the complete technology stack and engineering decisions to ensure:

- Scalability
- Maintainability
- Clear separation of concerns
- Production readiness

---

# 2. 🖥️ Frontend Stack (Admin Web)

## Core Framework

- **React (Vite)**
  - Fast development server
  - Optimized build performance

---

## UI & Styling

- **Tailwind CSS**
  - Utility-first CSS

- **shadcn/ui**
  - Accessible, reusable components

---

## State Management

- **Zustand**
  - Lightweight global state
  - Minimal boilerplate

---

## Form Handling

- **Formik**
  - Form state management

- **Yup**
  - Schema-based validation

---

## Routing

- **React Router**
  - Client-side navigation

---

## Data Fetching

- **Axios**
  - API communication layer

---

## Tables & Data UI

- **TanStack Table**
  - Sorting, filtering, pagination

---

## Notifications (UI)

- **Toast Library (Sonner / React Hot Toast)**
  - User feedback for actions

---

## Testing (Frontend)

- **Jest**
  - Unit testing

- **React Testing Library**
  - Component testing

- **Playwright**
  - End-to-End testing (UI flows)

---

# 3. 📱 Mobile App (Farmer Side)

## Push Notifications

- **Firebase Cloud Messaging (FCM)**
  - Real-time push notifications
  - Android/iOS support

---

# 4. ⚙️ Backend Stack

## Runtime

- **Node.js**

---

## Framework

- **Express.js**

---

## Database

- **MySQL**
  - Relational database
  - Strong consistency for transactions

---

## Query Strategy

- **Raw SQL (Manual Queries)**
  - Full control over:
    - Joins
    - Transactions
    - Performance optimization

---

## Database Driver

- **mysql2**
  - Promise-based MySQL client

---

## Authentication

- **JWT (jsonwebtoken)**
  - Token-based authentication

---

## Password Security

- **bcrypt**
  - Secure hashing

---

## Validation

- **Joi / Zod (choose one)**
  - Request validation layer

---

## File Upload

- **Multer**
  - Handle CSV/Excel uploads

---

## File Processing

- **csv-parser / xlsx**
  - Bulk data parsing

---

## Scheduling

- **node-cron**
  - Run periodic jobs (weather checks)

---

## Logging

- **Winston (recommended)**
  - Structured logging for debugging & monitoring

---

# 5. 🔔 Notification Architecture

## Hybrid Notification System

### 1. Database Notifications (Primary)

- Stored in MySQL
- Used for:
  - Notification history
  - Read/unread tracking
  - Filtering & pagination

---

### 2. Push Notifications (Mobile)

- **Firebase Cloud Messaging (FCM)**

Used for:

- Demand creation alerts
- Booking updates
- Weather alerts

---

### 3. Web Notifications (Admin)

- Polling-based (initial)
- Future upgrade:
  - WebSockets (Socket.IO)

---

## Notification Flow

Event → Backend →

1. Save notification in DB
2. Send push via FCM (if mobile user)

---

# 6. 🌦️ External APIs

## Weather API

- **OpenWeatherMap**

### Usage:

- Periodic weather checks (cron job)
- Detect:
  - Rain
  - Storm
  - Extreme conditions

---

# 7. 🧱 Architecture Style

## Pattern

- **Modular Monolith**

---

## Backend Module Structure

```id="t3w7l0"
modules/
 ├── auth/
 ├── users/
 ├── farmers/
 ├── demand/
 ├── booking/
 ├── notifications/
 ├── weather/
```

Each module contains:

- controller
- service
- routes
- query layer

---

## Backend Flow

```id="t6pgxm"
Route → Controller → Service → Query Layer → Database
```

---

# 8. 🔐 Security

- JWT authentication
- Role-based access control (RBAC)
- Input validation (Joi/Zod)
- Parameterized SQL queries (prevent injection)
- Password hashing (bcrypt)

---

# 9. 📊 Data Handling Strategy

## Soft Delete

- All tables include:
  - is_deleted
  - deleted_at

---

## Transactions

Used in:

- Demand booking
- Inventory updates

---

## Concurrency Control

- Row-level locking (SELECT ... FOR UPDATE)
- Prevent overbooking

---

## Pagination

- Required for all list APIs

---

## Dynamic Filtering

- Built using raw SQL queries

---

# 10. 📱 Device Management (Push Support)

## Device Tokens Storage

- Store FCM tokens per user
- Support multiple devices per user

---

# 11. 🚀 Deployment (Excluded for Now)

> Deployment setup intentionally deferred

---

# 12. 🧪 Testing Strategy

## Backend Testing

- **Jest**
  - Unit tests
  - Service-level testing
  - Critical flow testing (booking logic)

---

## Frontend Testing

- **React Testing Library**
  - Component testing
  - Form validation testing

---

## End-to-End Testing

- **Playwright**
  - Full user flows:
    - Login
    - Create demand
    - Book demand
    - Notification flow

---

# 13. 📈 Future Enhancements

- WebSocket (real-time notifications)
- Monitoring (Prometheus/Grafana)
- Rate limiting
- Advanced analytics

---

# 14. ⚠️ Constraints & Decisions

- No ORM (raw SQL only)
- Backend is source of truth
- Hybrid notification system (DB + FCM)
- Polling for web notifications
- Transactions mandatory for booking

---

# 15. ❌ Anti-Patterns to Avoid

- Writing SQL inside controllers
- Skipping transactions
- Trusting frontend input
- Not storing notification history
- Sending push notifications without DB persistence
- Ignoring soft delete filters

---
