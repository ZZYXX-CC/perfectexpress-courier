# Complete Feature Implementation Plan

## Phase 1: Authentication (Supabase Auth)

### User Authentication
- **Sign Up/Sign In** - Email + password login
- **User Dashboard** - View personal shipment history
- **Profile** - Update email, password

### Admin Authentication
- **Admin Login** - Separate role check
- **Protected `/admin` route** - Only accessible to admin users
- **Role-based access** - Use Supabase RLS with user roles

---

### Proposed Changes - Authentication

#### Database
- Add `profiles` table with `role` column (user/admin)
- Update RLS policies to check user roles

#### New Files
| File | Purpose |
|------|---------|
| `src/app/auth/login/page.tsx` | Login page |
| `src/app/auth/signup/page.tsx` | Sign up page |
| `src/app/dashboard/page.tsx` | User dashboard (shipment history) |
| `src/app/actions/auth.ts` | Auth server actions |
| `src/middleware.ts` | Route protection |

#### Modifications
| File | Change |
|------|--------|
| `src/app/admin/page.tsx` | Add admin role check |
| `src/components/layout/Navbar.tsx` | Show user menu when logged in |

---

## Phase 2: Feature Fixes (Original Plan)

### Fix `/ship` Page
- Connect multi-step form to Supabase
- Remove mock data
- Link shipments to logged-in user (optional)

### Fix Hero Tracking Widget
- Make input functional
- Navigate to tracking page on click

---

## Verification

1. **User Flow**: Sign up → Create shipment → View in dashboard
2. **Admin Flow**: Login as admin → Access `/admin` → Manage shipments
3. **Guest Flow**: Track shipment by ID (no login required)
