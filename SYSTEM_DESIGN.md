# 🧠 SYSTEM_DESIGN.md

## Agri Demand & Farmer Management System

---

# 1. 🎯 Overview

A centralized system to:

- Manage farmers
- Handle demand lifecycle
- Enable booking system
- Deliver notifications (DB + Push)
- Generate reports

---

# 2. 🧱 High-Level Architecture

```plaintext
Frontend (React)
       ↓
Backend API (Node.js)
       ↓
MySQL Database
       ↓
External Services:
  - Firebase FCM
  - Weather API
```

---

# 3. 🔄 Core Systems

---

## 3.1 Authentication System

- JWT-based
- Role-based access

---

## 3.2 Demand System

- Create demand
- Track remaining quantity
- Update dynamically

---

## 3.3 Booking System (Critical)

- Farmers book demand
- Uses:
  - transaction
  - row locking

Prevents:

- overbooking
- race conditions

---

## 3.4 Notification System

### Hybrid Model:

#### DB Notifications

- Stored for history

#### Push Notifications

- Firebase FCM for mobile

---

## 3.5 Weather System

- Cron-based service
- Fetch weather API
- Trigger alerts

---

## 3.6 Inventory System

- Track stock
- Adjust inventory
- Maintain logs

---

## 3.7 Reporting System

- Query-based reports
- No static storage

---

# 4. 🔄 Event Flow

---

## Demand Created

→ Save demand
→ Create DB notifications
→ Send FCM push

---

## Booking Done

→ Transaction
→ Update demand
→ Save booking
→ Notify all users

---

## Weather Alert

→ Cron job
→ API call
→ Detect condition
→ Notify farmers

---

# 5. ⚠️ Critical Constraints

---

## Concurrency

- Booking must use transaction

---

## Data Integrity

- remaining_quantity >= 0

---

## Source of Truth

- Backend only

---

# 6. 📊 Scalability Strategy

- Modular backend
- Indexed DB queries
- Pagination everywhere

---

# 7. 🔐 Security

- JWT auth
- RBAC
- Input validation
- SQL injection prevention

---

# 8. ❌ Failure Points

- Skipping transaction
- Poor DB indexing
- Notification inconsistency
- Mixing business logic layers

---

# 9. 📌 Final Note

System reliability depends on:

- DB correctness
- transaction safety
- clean architecture

Any shortcut → system failure

---
