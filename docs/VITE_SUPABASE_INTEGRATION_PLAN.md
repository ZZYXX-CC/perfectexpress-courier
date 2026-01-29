# PerfectExpress Vite + Supabase Integration Plan

This document is the result of inspecting the Vite-based UI after upgrade and its connection to the existing Supabase backend. It lists what works, what is broken or missing, and a phased plan to restore full parity with the legacy (Next.js) feature set while following the new design system and language.

---

## 1. Current State Summary

### 1.1 Tech Stack (Vite App)
- **Framework:** Vite 6 + React 19 + React Router 7
- **Backend:** Supabase (Auth, Database, Realtime available but not all used)
- **Design:** `design-system.md` — Noir theme, Manrope/Inter, red accent, CSS variables in `index.html`
- **Services:** `services/supabase.ts`, `services/support.ts`, `services/geminiService.ts`

### 1.2 Legacy (Next.js) Features (Reference)
From `legacy-v1/` and the existing implementation plans, the backend and legacy app support:

- Auth: login (password + magic link), signup, forgot password, reset password (from email link)
- Profiles: `profiles` table with `full_name`, `role` (admin/client)
- Shipments: create (ship form), list by user, admin CRUD, status flow (pending → quoted → confirmed → in-transit → out-for-delivery → delivered), log events, dispatch, update location, confirm payment
- Tracking: fetch by `tracking_number`, real-time updates, tracking page with timeline/map
- Support tickets: create, list, detail, reply, status updates, email notifications (via Resend on backend)
- Live chat: customer widget (name/email), admin chat page, `chat_sessions` + `chat_messages`, real-time
- User profile/settings: view and edit profile (name, etc.)
- Keep-alive: API route for Supabase (Vercel cron) — backend concern; Vite app does not need to implement this

---

## 2. What Works in the Vite App

| Area | Status | Notes |
|------|--------|------|
| **Auth – Login** | ✅ | Supabase `signInWithPassword` and `signInWithOtp`; session and redirect |
| **Auth – Sign Up** | ✅ | Supabase `signUp` with `options.data.full_name` |
| **Auth – Session & sync** | ✅ | `getSession` / `onAuthStateChange`; syncs user from `profiles` (name, email, role) |
| **User Dashboard – list** | ✅ | Fetches shipments by `user_id`, maps via `fetchRealShipment` |
| **Admin Dashboard – list** | ✅ | Fetches shipments, profiles, support tickets from Supabase |
| **Support tickets** | ✅ | Create, list (by user), detail, reply, status update via `services/support.ts` |
| **Support page** | ✅ | Form + “My tickets” when logged in; uses Supabase |
| **Tracking – fetch** | ✅ | `fetchRealShipment(id)` uses Supabase by `tracking_number` |
| **Design system** | ✅ | Colors, fonts, metadata labels, glass surfaces used across pages |

---

## 3. What Is Broken or Missing

### 3.1 Critical (Data / Core Flows)

| Issue | Detail | Fix direction |
|-------|--------|----------------|
| **Tracking page on refresh** | `/track/:id` only works when `activeShipment` is set by `handleTrack`. Refresh clears state → redirect to `/tracking`. | On `/track/:id`, read `id` from route and call `fetchRealShipment(id)` (and optionally set `activeShipment`). If not found, redirect to `/tracking` or show “not found”. |
| **Admin edit shipment** | `AdminShipmentEditor` uses `supabase.from('shipments').update(...).eq('id', shipment.id)`. In this app `shipment.id` is set to `tracking_number`, while DB `id` is UUID. Update never matches. | Use `.eq('tracking_number', shipment.id)` for updates. Ensure delete already uses `tracking_number` (it does in AdminDashboard). |
| **Create shipment (Ship)** | No “Ship” / create-shipment flow. QuoteSection is estimate-only; no Supabase insert. | Add route (e.g. `/ship`) and a shipment creation form that inserts into `shipments` with `user_id`, `sender_info`, `receiver_info`, `parcel_details`, `service_type`, `tracking_number`, `status: 'pending'`, etc., following legacy schema. |
| **Forgot password** | `ForgotPasswordPage` does not call Supabase; it only does a mock delay and shows “sent.” | Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` })` and handle errors. |
| **Reset password (from email)** | No route for the link Supabase sends (e.g. `.../reset-password#access_token=...`). | Add route (e.g. `/reset-password`) that reads hash/fragment, calls `supabase.auth.getSession()` or uses `onAuthStateChange` / `verifyOtp` and shows a “new password” form; then `updateUser({ password })`. |
| **UserSettings / Profile** | `UserSettings` does not load or save to Supabase; it uses a mock save. | Load current user’s `profiles` row; form to edit `full_name` (and any other allowed fields); save via `supabase.from('profiles').update(...).eq('id', userId)`. |

### 3.2 Correctness (Status Casing and Display)

| Issue | Detail | Fix direction |
|-------|--------|----------------|
| **Status casing** | DB and `types.ts` use lowercase (`delivered`, `in-transit`). Several components use `'Delivered'` (capital D). | Use lowercase in logic everywhere. For **display**, normalize once (e.g. `status.replace(/-/g, ' ')` and title-case or uppercase per design system). |
| **Places to fix** | `UserDashboard.tsx`: filters and badge use `'Delivered'`. `ShipmentDetails.tsx`: status display uses `'Delivered'`. `TrackingCard.tsx`: uses `'Delivered'`, `'In Transit'`, etc. | Replace with lowercase in filters; keep UI display as formatted string (e.g. “Delivered” for users) derived from `shipment.status`. |

### 3.3 Admin Workflow (Parity with Legacy)

| Issue | Detail | Fix direction |
|-------|--------|----------------|
| **Admin status flow** | Legacy has: Pending → Quote (set price) → Confirm payment → Dispatch → Update location / Log event. Vite admin has editor and delete but no dedicated “Quote,” “Confirm payment,” “Dispatch,” “Log event” actions. | Add the same status flow: e.g. “Set price & quote” (pending → quoted), “Confirm payment” (quoted → confirmed, set `payment_status`), “Dispatch” (confirmed → in-transit, set location/history), “Update location” / “Log event” with history. Reuse or adapt legacy server logic in Vite via Supabase client (or optional small backend). |
| **Admin real-time** | Legacy used `useRealtimeShipments` for live table updates. | Add Supabase realtime subscription on `shipments` in AdminDashboard (and optionally on tracking page) so list updates without refresh. |

### 3.4 Live Chat (Admin–User)

| Issue | Detail | Fix direction |
|-------|--------|----------------|
| **No live chat** | Legacy had LiveChat widget (customer name/email) and admin chat page using `chat_sessions` and `chat_messages`. Vite has only `ChatBot` (Gemini). | Add: (1) `services/chat.ts` for create session, send message, list sessions/messages; (2) LiveChat widget (design system) that starts a session and sends/receives messages with Supabase realtime; (3) Admin chat page at e.g. `/admin/chat` (or under dashboard) to list sessions and reply. |

### 3.5 Tickets and Email

| Issue | Detail | Fix direction |
|-------|--------|----------------|
| **Ticket reply notifications** | Legacy sent email on new reply (Resend). Vite only talks to Supabase; no server to send email. | Either: add a small backend (e.g. Vercel serverless) that Supabase triggers or that the app calls to “send ticket reply email,” or document that email notifications require the legacy backend or a new API. |
| **Admin ticket reply as “admin”** | `TicketDetail` hardcodes `senderType = 'customer'`. When an admin replies, it should be `'admin'`. | Pass user/role into TicketDetail (or get from session); set `senderType = role === 'Admin' ? 'admin' : 'customer'` when calling `addReply`. |

### 3.6 Environment and Config

| Issue | Detail | Fix direction |
|-------|--------|----------------|
| **Env vars** | App uses `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. No `.env.example` or README note. | Add `.env.example` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_GEMINI_API_KEY`. Document in README. |
| **Vite config** | Uses `loadEnv` but app reads `import.meta.env.VITE_*`; ensure no leftover `process.env` for Supabase. | Confirm all Supabase/Gemini usage uses `import.meta.env.VITE_*` (already the case in services). |

---

## 4. Phased Implementation Plan

### Phase 1 – Fix Critical Data and Auth (Priority: High)
1. **Tracking page by URL**  
   In the route for `/track/:id`, load shipment by `id` (e.g. `fetchRealShipment(id)`). Store in local state or pass to `ShipmentDetails`. Handle loading and “not found” without depending on `activeShipment` from home/tracking search.

2. **Admin edit shipment**  
   In `AdminShipmentEditor`, change update from `.eq('id', shipment.id)` to `.eq('tracking_number', shipment.id)`. Ensure payload matches DB columns (e.g. `estimated_delivery` if required).

3. **Forgot password**  
   In `ForgotPasswordPage`, call `supabase.auth.resetPasswordForEmail(email, { redirectTo })`, show success/error, and remove mock delay.

4. **Reset password route**  
   Add `/reset-password` (and optional `/auth/reset-password`). Parse hash for tokens, show “New password” form, call `supabase.auth.updateUser({ password })`, then redirect to login.

5. **UserSettings / Profile**  
   Load profile by current user id; save `full_name` (and other editable fields) to `profiles` via Supabase.

### Phase 2 – Status Casing and Display (Priority: High)
6. **Normalize status in code**  
   In `UserDashboard`, `ShipmentDetails`, `TrackingCard`, and any other component: use lowercase status in comparisons (e.g. `'delivered'`). Introduce a small helper for display (e.g. “Delivered”, “In transit”) so UI stays consistent with the design system.

### Phase 3 – Create Shipment (Ship) (Priority: High)
7. **Ship route and form**  
   Add route `/ship` (or `/quotes/ship`). Build a form (design system) for: sender/receiver info, parcel details, service type. On submit, generate `tracking_number` (e.g. `PFX-...`), set `user_id` from session, insert into `shipments` with `status: 'pending'`. Redirect to tracking or dashboard.

### Phase 4 – Admin Status Flow and Realtime (Priority: Medium)
8. **Admin actions**  
   Implement “Quote” (set price, status → quoted), “Confirm payment” (→ confirmed, `payment_status`), “Dispatch” (→ in-transit, history), “Update location” / “Log event” (append to history, optional location). Use Supabase `update` and correct `history` JSONB structure to match legacy.

9. **Admin realtime**  
   Subscribe to `shipments` (and optionally `support_tickets`) in AdminDashboard so the table updates in real time.

### Phase 5 – Live Chat (Priority: Medium)
10. **Chat service**  
    Add `services/chat.ts`: create session (visitor name/email), send message, list sessions, list messages, optional “mark read.” Use `chat_sessions` and `chat_messages` with Supabase realtime.

11. **LiveChat widget**  
    Replace or augment ChatBot with a widget that starts a session and shows messages with realtime updates, following the design system.

12. **Admin chat page**  
    Add page (e.g. under `/dashboard` for admins) to list sessions and reply; realtime for new messages.

### Phase 6 – Tickets and Polish (Priority: Medium / Low)
13. **Ticket reply as admin**  
    In admin ticket view, pass role and set `senderType = 'admin'` when replying.

14. **Email for ticket replies**  
    Document that reply emails require a backend (e.g. legacy API or new serverless function). Optionally add a “notify by email” API call from Vite if such an endpoint exists.

15. **Env and docs**  
    Add `.env.example` and short README section for Vite + Supabase env vars and running the app.

---

## 5. Design System and Language Checklist

When implementing or touching UI:

- **Colors:** Use CSS variables / Tailwind from `index.html`: `bg-bgMain`, `bg-bgSurface`, `border-borderColor`, `text-textMain`, `text-textMuted`, `text-red-600` for accent.
- **Typography:** Headings: Manrope, uppercase, tracking-tighter. Body/metadata: Inter. Small labels: `metadata-label` (9px, uppercase, tracking-widest).
- **Forms:** Inputs per design-system.md: `bg-neutral-950` (or `bg-bgMain`), `border-borderColor`, `rounded-sm`, focus `border-neutral-600`, no ring. Uppercase, 10px, font-bold, tracking-widest where specified.
- **Buttons:** Primary: white bg, black text, font-black, uppercase, tracking-widest. Secondary: transparent, border, white text. Accent: red-600 bg, white text.
- **Voice:** User-centric, clear language (“Your package,” “Shipping speed,” “Reliable delivery”); avoid internal jargon.

---

## 6. Suggested Order of Work

1. Phase 1 (critical data + auth)  
2. Phase 2 (status casing)  
3. Phase 3 (create shipment)  
4. Phase 4 (admin flow + realtime)  
5. Phase 5 (live chat)  
6. Phase 6 (tickets + env/docs)

This order restores core flows first, then status consistency, then creation and admin workflow, then live chat and ticket polish, so the app works end-to-end with the new design and language while staying aligned with the existing Supabase backend and legacy behavior.
