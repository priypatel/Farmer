# 🧱 BACKEND_ARCHITECTURE.md

## Agri Demand & Farmer Management System

---

# 1. 🎯 Purpose

Define strict backend structure to ensure:

- Clean separation of concerns
- Maintainable codebase
- Scalable architecture
- Predictable development with AI tools

---

# 2. 🧱 Architecture Pattern

## Modular Monolith

Each domain is isolated as a module:

- No cross-module direct DB access
- Communication via service layer only

---

# 3. 📁 Folder Structure

```plaintext
src/
 ├── modules/
 │    ├── auth/
 │    ├── users/
 │    ├── farmers/
 │    ├── demand/
 │    ├── booking/
 │    ├── inventory/
 │    ├── notifications/
 │    ├── weather/
 │
 ├── config/
 ├── database/
 ├── middlewares/
 ├── utils/
 ├── app.js
 ├── server.js
```

---

# 4. 📦 Module Structure

Each module MUST follow:

```plaintext
module-name/
 ├── module.controller.js
 ├── module.service.js
 ├── module.query.js
 ├── module.routes.js
```

---

# 5. 🔄 Request Flow

```plaintext
Route → Controller → Service → Query → Database
```

---

# 6. 🧠 Layer Responsibilities

---

## Controller

- Handle request/response
- Call service
- No business logic

---

## Service

- Business logic
- Validation (high-level)
- Transaction handling
- Calls query layer

---

## Query Layer

- Raw SQL only
- No logic
- Parameterized queries only

---

## Middleware

- Auth validation
- Role checking
- Error handling

---

# 7. 🔐 Authentication & Authorization

- JWT-based authentication
- Middleware:
  - verifyToken
  - authorizeRole([...roles])

---

# 8. ⚠️ Rules (NON-NEGOTIABLE)

---

## ❌ DO NOT:

- Write SQL in controllers
- Write business logic in routes
- Access DB directly from service (without query layer)
- Trust frontend values

---

## ✅ MUST:

- Use transactions for booking
- Use parameterized queries
- Include soft delete filter in queries

---

# 9. 🔄 Transaction Handling

Only inside service layer.

Used in:

- demand booking
- inventory updates

---

# 10. 🔔 Notification Handling

- Centralized notification service
- No module sends notification directly
- All modules call notification service

---

# 11. 🌦️ Cron Jobs

- Weather handled via cron (node-cron)
- No direct API exposure

---

# 12. 🧪 Testing Structure

```plaintext
tests/
 ├── unit/
 ├── integration/
 ├── e2e/
```

---

# 13. 📌 Final Rule

If any file violates this structure:
→ refactor immediately
→ do not continue development

---
