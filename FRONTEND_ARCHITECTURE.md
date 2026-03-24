# FRONTEND_ARCHITECTURE.md
## Agri Demand & Farmer Management System (FPO)

---

# 1. Purpose

Ensure:
- Scalable React structure
- Clean separation of UI & logic
- Reusable components — never duplicate
- Predictable state management
- Consistent visual design based on reference UI

---

# 2. Design System

## 2.1 Color Palette

| Token | Value | Usage |
|---|---|---|
| `primary` | `#4B9B4D` | Buttons, active states, links, progress bars |
| `primary-dark` | `#3A7A3C` | Button hover, focus ring |
| `sidebar-bg` | `#1E5C20` | Sidebar background |
| `sidebar-text` | `#FFFFFF` | Sidebar nav text and icons |
| `sidebar-active` | `#2D7A30` | Active nav item highlight |
| `background` | `#F5F6F8` | Page background |
| `surface` | `#FFFFFF` | Cards, modals, form panels |
| `border` | `#E5E7EB` | Input borders, table dividers |
| `text-primary` | `#1A1A1A` | Headings, primary labels |
| `text-secondary` | `#6B7280` | Subtext, hints, timestamps |
| `text-muted` | `#9CA3AF` | Placeholder text |
| `error` | `#EF4444` | Validation errors, destructive actions |
| `success` | `#22C55E` | Success toasts, positive badges |
| `warning` | `#F59E0B` | Warning states |

**Tailwind config addition (`tailwind.config.js`):**
```js
colors: {
  primary: {
    DEFAULT: '#4B9B4D',
    dark: '#3A7A3C',
  },
  sidebar: {
    bg: '#1E5C20',
    active: '#2D7A30',
  },
}
```

## 2.2 Typography

| Element | Style |
|---|---|
| Page title (header) | `font-semibold text-lg text-gray-900` |
| Section heading | `font-semibold text-base text-gray-800` |
| Table header | `font-medium text-sm text-gray-600 uppercase` |
| Body text | `text-sm text-gray-700` |
| Subtext / timestamp | `text-xs text-gray-500` |
| Input label | `text-sm font-medium text-gray-700` |
| Error message | `text-xs text-red-500` |

## 2.3 Spacing & Shape

| Token | Value |
|---|---|
| Card border-radius | `rounded-xl` (12px) |
| Input border-radius | `rounded-md` (6px) |
| Button border-radius | `rounded-md` (6px) |
| Modal border-radius | `rounded-2xl` (16px) |
| Card shadow | `shadow-sm` or `shadow-md` |
| Page padding | `p-6` |
| Section gap | `gap-4` or `gap-6` |

## 2.4 Button Styles

| Variant | Style |
|---|---|
| Primary | `bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-md font-medium` |
| Secondary | `border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md` |
| Destructive | `bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-md` |
| Ghost | `text-primary hover:bg-green-50 px-4 py-2 rounded-md` |

## 2.5 Form Input Style

All inputs follow:
```
border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900
focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
placeholder:text-gray-400
```

---

# 3. Page Layouts

## 3.1 Auth Layout (Public Pages)

Used for: Login, Register

```
┌─────────────────────────────────────────────────────────┐
│  "SIGN IN" (top-left, text-gray-400 text-sm tracking-   │
│   widest uppercase)                                      │
│                                                          │
│  ┌──────────────────┐   ┌───────────────────────────┐   │
│  │                  │   │    White card (shadow-md,  │   │
│  │  Agricultural    │   │    rounded-xl, p-8)        │   │
│  │  Illustration    │   │                            │   │
│  │  (left half)     │   │    Form fields here        │   │
│  │                  │   │                            │   │
│  └──────────────────┘   └───────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

- Background: white (`bg-white`)
- Left: illustration image, centered vertically, ~45% width
- Right: form card centered vertically, ~45% width, max-w-md
- "SIGN IN" label: absolute top-left, `text-xs tracking-widest text-gray-400 uppercase`

## 3.2 App Layout (Protected Pages)

Used for: all authenticated pages

```
┌──────────┬──────────────────────────────────────────────┐
│ Sidebar  │  Header (page title | Alerts | Settings |    │
│ #1E5C20  │  Admin ▼)                                    │
│          ├──────────────────────────────────────────────┤
│  FPO     │                                              │
│          │  Page content area (bg-[#F5F6F8], p-6)      │
│ Dashboard│                                              │
│ Farmers  │  ┌─────────────────────────────────────────┐ │
│ Demand   │  │  Content Card (bg-white, rounded-xl,    │ │
│ Planning │  │  shadow-sm, p-6)                        │ │
│ Reports  │  └─────────────────────────────────────────┘ │
│ Inventory│                                              │
│          │                                              │
│ Logout   │                                              │
└──────────┴──────────────────────────────────────────────┘
```

**Sidebar specs:**
- Width: `w-56` (224px), fixed/sticky
- Background: `#1E5C20`
- Logo "FPO": `text-white font-bold text-2xl px-6 py-5`
- Nav item: `flex items-center gap-3 px-6 py-3 text-white/80 text-sm hover:bg-[#2D7A30]`
- Active nav item: `bg-[#2D7A30] text-white font-medium`
- Logout: at bottom of sidebar, same style, with logout icon

**Header specs:**
- Height: `h-16`
- Background: `bg-white border-b border-gray-200`
- Page title: `font-semibold text-base text-gray-900`
- Right actions: Alerts (bell icon) | Settings (gear icon) | Admin name + chevron dropdown
- Dividers between header actions: `border-r border-gray-300 h-5`

---

# 4. Folder Structure

```plaintext
src/
 ├── components/          # Shared components — used across 2+ features
 │    ├── layout/
 │    │    ├── Layout.jsx
 │    │    ├── Sidebar.jsx
 │    │    └── Header.jsx
 │    ├── ui/
 │    │    ├── DataTable.jsx
 │    │    ├── Pagination.jsx
 │    │    ├── Modal.jsx
 │    │    ├── ConfirmDialog.jsx
 │    │    ├── StatusBadge.jsx
 │    │    ├── ProgressBar.jsx
 │    │    ├── StatCard.jsx
 │    │    ├── LoadingSpinner.jsx
 │    │    ├── EmptyState.jsx
 │    │    └── ErrorMessage.jsx
 │    └── form/
 │         ├── FormField.jsx
 │         ├── SelectInput.jsx
 │         ├── MultiSelect.jsx
 │         ├── DateRangePicker.jsx
 │         ├── FileUpload.jsx
 │         ├── SearchInput.jsx
 │         └── FilterBar.jsx
 │
 ├── features/
 │    ├── auth/
 │    ├── farmers/
 │    ├── demand/
 │    ├── booking/
 │    ├── notifications/
 │    ├── inventory/
 │    ├── reports/
 │    └── dashboard/
 │
 ├── services/            # axios API layer (no direct axios in components)
 ├── store/               # Zustand stores
 ├── hooks/               # global hooks
 ├── utils/
 ├── routes/
 └── App.jsx
```

Each feature folder:
```plaintext
features/demand/
 ├── DemandListPage.jsx
 ├── DemandCreatePage.jsx
 ├── DemandEditPage.jsx
 ├── api.js
 ├── hooks.js
 └── __tests__/
      ├── DemandListPage.test.jsx
      └── hooks.test.js
```

---

# 5. Data Flow

```plaintext
UI → Formik → API Service → Backend → Response → Zustand Store → UI
```

---

# 6. State Management

| Scope | Tool |
|---|---|
| Auth (user, token) | Zustand — `authStore.js` |
| Notification unread count | Zustand — `notificationStore.js` |
| UI state (modals, loading) | `useState` — local to component |
| Form state | Formik |

---

# 7. API Layer

- All API calls go through `services/api.js` (Axios instance)
- Each feature has its own `api.js` that imports from `services/api.js`
- No direct `axios` calls inside components or hooks

---

# 8. Auth Pages (from reference design)

## Register Page
Fields: First Name, Phone, Email, Role (dropdown: admin/farmer), Password, Confirm Password
- CTA: "Create Account" (primary button, full width)
- Below button: "Has account? Sign in" link
- Divider: "— Quick Signup With —"
- Google button (outlined, Google logo)

## Login Page
Fields: Email, Password
- CTA: "Sign In" (primary button, full width)
- Below: "Don't have an account? Sign up" link
- Divider: "— Or continue with —"
- Google button

Both pages use the **Auth Layout** (illustration + form card split).

---

# 9. Navigation (Sidebar)

App name: **FPO** (Farmer Producer Organization)

| Icon | Label | Role |
|---|---|---|
| Grid | Dashboard | Admin, Super Admin |
| Users | Farmers | Admin, Super Admin |
| Chart | Demand Planning | Admin, Super Admin, Farmer |
| Bar chart | Reports | Admin, Super Admin |
| Box | Inventory | Admin, Super Admin |
| Logout | Logout | All |

Farmer role sees: Dashboard, Demand Planning, Notifications, Logout
Admin role sees: Dashboard, Farmers, Demand Planning, Reports, Inventory, Logout

---

# 10. Rules (STRICT)

## DO NOT:
- Call API directly inside JSX
- Store business logic inside components
- Duplicate API calls across files
- Copy-paste the same UI pattern across features — extract to `components/` instead
- Use inline styles — use Tailwind classes only
- Use color hex codes inline — use Tailwind config tokens

## MUST:
- Use hooks for all data fetching and reusable logic
- Keep components dumb (UI only — props in, JSX out)
- If a UI pattern appears in 2+ features → move it to `components/`
- Feature components import from `components/` — never from other feature folders
- All colors reference the design system tokens defined in `tailwind.config.js`

---

# 10.1 Shared Components Reference

| Component | Used in | Notes |
|---|---|---|
| `DataTable` | Farmers, Demand, Booking, Inventory, Reports, Notifications | TanStack wrapper, built-in pagination + empty state |
| `Modal` | BulkUpload, BookingForm, AdjustInventory, ConfirmDelete | Title + close button shell |
| `ConfirmDialog` | Delete farmer, confirm booking, delete demand | Extends Modal |
| `FormField` | All Formik forms | label + input + error message wrapper |
| `SelectInput` | All single-select dropdowns | Wraps shadcn Select with default styles |
| `MultiSelect` | Farmer create/edit | Crop assignment |
| `StatusBadge` | Farmer list, booking list | `active=green`, `pending=yellow`, `suspended=red` |
| `ProgressBar` | Demand list, booking page | Shows remaining/total quantity |
| `StatCard` | Dashboard | Number + label + optional icon |
| `FilterBar` | Farmers, Demand, Inventory, Reports | Horizontal filter row shell |
| `DateRangePicker` | Reports, Demand list | Start + end date inputs |
| `FileUpload` | Bulk upload modal | Drag-and-drop or click |
| `SearchInput` | Farmers, Demand | Debounced 300ms |
| `LoadingSpinner` | All pages | Centered, primary color |
| `EmptyState` | All list pages | Illustration + message |
| `Sidebar` | App Layout | Role-aware nav, `#1E5C20` bg |
| `Header` | App Layout | Page title + Alerts + Settings + User |

---

# 11. Testing

- **Vitest + React Testing Library**: component rendering, form validation, hook behavior
- **Playwright**: full user flows (login → create demand → book → see notification)

---

# 12. Final Rules

```
Components = UI only (props in → JSX out)
Logic      = hooks/services
Colors     = Tailwind config tokens only
Shared UI  = components/ folder

If any rule is violated → refactor before continuing
```

---
