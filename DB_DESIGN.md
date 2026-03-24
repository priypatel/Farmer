# 🗄️ DB_DESIGN.md

## Agri Demand & Farmer Management System

---

# 1. 🎯 Purpose

Define a robust, scalable relational database structure that ensures:

- Data integrity
- Concurrency safety
- Efficient querying
- Maintainability

---

# 2. 🧱 Core Design Principles

---

## 2.1 Source of Truth

- Backend + Database are the only source of truth
- Frontend never performs critical calculations

---

## 2.2 Normalization

- Avoid redundant data
- Use relational mapping (FKs)

---

## 2.3 Soft Delete

Every table (except join tables) must include:

- is_deleted (boolean)
- deleted_at (timestamp)

---

## 2.4 Audit Fields

All main tables include:

- created_at
- updated_at

---

## 2.5 Concurrency Safety

- Demand booking must use:
  - transactions
  - row-level locking

---

# 3. 👤 USERS & ROLES

---

## users

- id (PK)
- first_name
- phone
- email (UNIQUE)
- password (nullable — null for Google-only users)
- role ENUM ('admin', 'farmer', 'super_admin')
- auth_type ENUM ('email', 'google') DEFAULT 'email'
- google_id (nullable, UNIQUE when set)
- is_deleted
- deleted_at
- created_at
- updated_at

---

# 4. 🧑‍🌾 FARMER DOMAIN

---

## farmers

- id (PK)
- user_id (FK → users.id)
- location_id (FK)
- branch_id (FK)
- status ENUM ('active', 'pending', 'suspended')
- is_deleted
- deleted_at
- created_at
- updated_at

---

## crops

- id (PK)
- name (UNIQUE)

---

## farmer_crops (Many-to-Many)

- id (PK)
- farmer_id (FK → farmers.id)
- crop_id (FK → crops.id)

---

## locations

- id (PK)
- name (UNIQUE)

---

## branches

- id (PK)
- name (UNIQUE)

---

# 5. 🍅 DEMAND SYSTEM

---

## demand

- id (PK)
- crop_id (FK → crops.id)
- location_id (FK → locations.id)
- total_quantity
- remaining_quantity
- unit (kg, ton, etc.)
- created_by (FK → users.id)
- is_deleted
- deleted_at
- created_at
- updated_at

---

## demand_bookings

- id (PK)
- demand_id (FK → demand.id)
- farmer_id (FK → farmers.id)
- quantity
- created_at

---

## 🔥 Critical Constraint:

- remaining_quantity must NEVER go below 0

---

# 6. 📦 INVENTORY SYSTEM

---

## inventory

- id (PK)
- crop_id (FK)
- location_id (FK)
- quantity
- updated_at

---

## inventory_logs

- id (PK)
- inventory_id (FK)
- change_amount (+/-)
- reason
- created_at

---

# 7. 🔔 NOTIFICATION SYSTEM

---

## notifications

- id (PK)
- user_id (FK → users.id)
- type ENUM (
  'DEMAND_CREATED',
  'DEMAND_UPDATED',
  'BOOKING_DONE',
  'WEATHER_ALERT'
  )
- title
- message
- data (JSON)
- is_read (boolean)
- created_at

---

## device_tokens

- id (PK)
- user_id (FK → users.id)
- token (FCM token)
- device_type (android / ios)
- created_at

---

# 8. 🌦️ WEATHER SYSTEM

---

## weather_logs

- id (PK)
- type (rain, storm, etc.)
- message
- created_at

---

# 9. 📊 REPORTING (DERIVED DATA)

---

⚠️ Reports should NOT be stored as static tables.

Instead:

- Generate using SQL queries from:
  - demand
  - demand_bookings
  - farmers
  - crops

---

# 10. 🔗 RELATIONSHIPS SUMMARY

---

- users → farmers (1:1 for farmer role)
- farmers → farmer_crops (1:N)
- crops → farmer_crops (1:N)
- demand → crops (N:1)
- demand → locations (N:1)
- demand → bookings (1:N)
- farmers → bookings (1:N)
- users → notifications (1:N)
- users → device_tokens (1:N)

---

# 11. ⚡ INDEXING STRATEGY (VERY IMPORTANT)

---

## users

- email (UNIQUE INDEX)

---

## farmers

- user_id
- location_id
- branch_id
- status

---

## demand

- crop_id
- location_id
- created_at

---

## demand_bookings

- demand_id
- farmer_id

---

## notifications

- user_id
- is_read
- created_at

---

## device_tokens

- user_id

---

# 12. 🔒 CONSTRAINTS

---

## Foreign Keys

- Enforce referential integrity on all relations

---

## Unique Constraints

- users.email
- crops.name
- locations.name
- branches.name

---

## Check Constraints (Logical)

- quantity > 0
- remaining_quantity >= 0

---

# 13. ⚠️ CRITICAL BUSINESS RULES

---

## Demand Booking Rules

- Cannot book more than remaining_quantity
- Must be handled inside transaction

---

## Soft Delete Rule

- All queries must filter:
  WHERE is_deleted = false

---

## Notification Rule

- Every system event must:
  1. Store notification
  2. Trigger push (if applicable)

---

# 14. 🧠 SCALABILITY CONSIDERATIONS

---

- Avoid heavy joins without indexes
- Use pagination for all large queries
- Keep reports query-optimized
- Archive old data if needed

---

# 15. ❌ COMMON FAILURE POINTS

---

- Missing transaction in booking
- Not indexing filters → slow queries
- Ignoring soft delete in queries
- Storing derived data unnecessarily
- Not handling multiple device tokens

---

# 16. 📌 FINAL NOTES

---

- This schema is designed for:
  - consistency
  - performance
  - scalability

- Any shortcut here will:
  → break data integrity later

---
