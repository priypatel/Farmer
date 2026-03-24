# 🌐 API_DESIGN.md

## Agri Demand & Farmer Management System

---

# 1. 🎯 Purpose

Define all backend APIs with:

- Clear structure
- Consistent patterns
- Proper separation of concerns
- Production-level standards

---

# 2. 📐 API DESIGN PRINCIPLES

---

## 2.1 RESTful Structure

- Use resource-based endpoints
- Avoid action-based naming

✅ Good:

- GET /farmers
  ❌ Bad:
- GET /getAllFarmers

---

## 2.2 Consistent Response Format

### Success Response:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

### Error Response:

```json
{
  "success": false,
  "message": "Error message"
}
```

---

## 2.3 Pagination Format

Query Params:

- page
- limit

Response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

---

## 2.4 Filtering Pattern

Use query params:

- /farmers?location=1&status=active&crop=2

---

# 3. 🔐 AUTH MODULE

---

## POST /auth/login

Login user

### Request:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

### Response:

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "role": "admin"
  }
}
```

---

## GET /auth/me

Get logged-in user details

---

# 4. 👤 USERS / FARMERS MODULE

---

## POST /farmers

Create farmer (Admin only)

---

## GET /farmers

Get farmers list with filters

### Query:

- location
- branch
- crop
- status
- page
- limit

---

## GET /farmers/:id

Get single farmer

---

## PUT /farmers/:id

Update farmer

---

## DELETE /farmers/:id

Soft delete farmer

---

## POST /farmers/bulk-upload

Upload CSV/Excel

---

## GET /farmers/export

Export filtered data (CSV)

---

# 5. 🌱 CROPS / MASTER DATA

---

## GET /crops

## POST /crops

## PUT /crops/:id

## DELETE /crops/:id

---

## GET /locations

## POST /locations

---

## GET /branches

## POST /branches

---

# 6. 🍅 DEMAND MODULE

---

## POST /demand

Create demand (Admin)

### Request:

```json
{
  "crop_id": 1,
  "location_id": 2,
  "total_quantity": 15000,
  "unit": "kg"
}
```

---

## GET /demand

List demand

### Filters:

- crop_id
- location_id
- date range
- page
- limit

---

## GET /demand/:id

Demand details

---

## PUT /demand/:id

Update demand

---

## DELETE /demand/:id

Soft delete

---

# 7. 📦 DEMAND BOOKING (CRITICAL MODULE)

---

## POST /bookings

Farmer books demand

### Request:

```json
{
  "demand_id": 1,
  "quantity": 5000
}
```

---

## 🔥 Backend Logic:

- Validate quantity
- Lock demand row
- Check remaining_quantity
- Deduct safely (transaction)
- Insert booking
- Trigger notifications

---

## GET /bookings

Get bookings (admin/farmer specific)

---

# 8. 📦 INVENTORY MODULE

---

## GET /inventory

List inventory

---

## PUT /inventory/:id

Update inventory

---

## POST /inventory/adjust

Adjust inventory

---

# 9. 📊 REPORT MODULE

---

## GET /reports/collection

Produce collection report

---

## GET /reports/commitment

Farmer commitment report

---

## Query Filters:

- location
- crop
- date range

---

## Export:

- /reports/export?type=collection

---

# 10. 🔔 NOTIFICATION MODULE

---

## GET /notifications

Get user notifications

### Query:

- type
- is_read
- page
- limit

---

## PATCH /notifications/:id/read

Mark single notification as read

---

## PATCH /notifications/read-all

Mark all as read

---

# 11. 📱 DEVICE TOKEN (FCM)

---

## POST /devices/register

Save device token

### Request:

```json
{
  "token": "FCM_TOKEN",
  "device_type": "android"
}
```

---

## DELETE /devices/:id

Remove device token

---

# 12. 🌦️ WEATHER MODULE

---

## (Internal Only - No Public API)

- Cron job runs every X hours
- Fetch weather API
- Trigger notifications

---

# 13. 🧠 ROLE-BASED ACCESS RULES

---

| API                | Admin | Farmer | Super Admin |
| ------------------ | ----- | ------ | ----------- |
| Create Demand      | ✅    | ❌     | ✅          |
| Book Demand        | ❌    | ✅     | ✅          |
| Manage Farmers     | ✅    | ❌     | ✅          |
| View Notifications | ✅    | ✅     | ✅          |

---

# 14. ⚠️ ERROR HANDLING

---

## Standard Errors:

- 400 → Validation error
- 401 → Unauthorized
- 403 → Forbidden
- 404 → Not found
- 500 → Server error

---

# 15. 🔁 SYSTEM FLOW SUMMARY

---

## Demand Creation:

POST /demand
→ Save demand
→ Create notifications
→ Send push

---

## Booking Flow:

POST /bookings
→ Transaction
→ Update remaining
→ Insert booking
→ Create notifications
→ Send push

---

## Weather Flow:

Cron → API → Detect → Notify

---

# 16. ❌ ANTI-PATTERNS

---

- Writing business logic in routes
- Skipping validation
- Returning inconsistent responses
- Not handling transactions
- Trusting frontend values

---

# 17. 📌 FINAL NOTE

---

This API is designed to:

- Support scalability
- Maintain clean separation
- Handle complex business logic safely

---
