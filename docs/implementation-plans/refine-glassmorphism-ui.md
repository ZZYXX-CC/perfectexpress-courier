# Implementation Plan - Perfectexpress Courier

## Goal
Refactor the existing functional pages (Tracking, Shipment Submission, Admin Dashboard) to match the new Navy/White/Orange design system introduced by the user.

## New Design System
- **Colors**:
    - Primary: Orange (`#FF5C00`)
    - Secondary: Navy (`#0F172A`)
    - Background: `bg-background` (White/Navy)
    - Text: `text-secondary` (Headings), `text-slate-500` (Body)
- **Components**:
    - Use [Navbar](file:///c:/Users/LUCKY/Documents/Dev/Perfectexpress%20Courier/perfectexpress-courier/src/components/layout/Navbar.tsx#9-89) and [Footer](file:///c:/Users/LUCKY/Documents/Dev/Perfectexpress%20Courier/perfectexpress-courier/src/components/layout/Footer.tsx#6-87) from `@/components/layout`.
    - Use Shadcn `Card`, `Button`, `Input` with new styling.
    - Icons: Lucide-React without glassmorphism specific backgrounds (more clean/flat style).

## Proposed Changes

### Refactoring
- **Global Styles**:
    - Update `--glass-bg` to be translucent (e.g., lower opacity) to enable `backdrop-blur` effects.
    - Ensure border colors support glass contrast (white/10 for dark mode).
- **Tracking Page (`/track/[id]`)**:
    - Re-apply glass classes (`bg-white/5`, `backdrop-blur-md`) using the new Navy palette.
    - specific attention to "Glass cards" mentioned in design system.
- **Shipment Submission (`/ship`)**:
    - Update Multi-step wizard UI with glass container.
- **Admin Dashboard (`/admin`)**:
    - Update Stats cards to use glass effect on dark mode.
- **Components**:
    - Ensure [Navbar](file:///c:/Users/LUCKY/Documents/Dev/Perfectexpress%20Courier/perfectexpress-courier/src/components/layout/Navbar.tsx#9-89) and [Footer](file:///c:/Users/LUCKY/Documents/Dev/Perfectexpress%20Courier/perfectexpress-courier/src/components/layout/Footer.tsx#6-87) are correctly implemented (Check if they exist and match the new style).

## Verification Plan
### Automated Tests
- Build verification: `npm run build`.

### Manual Verification
- Verify Home page matches user's design.
- Verify Tracking page looks consistent with Home.
- Verify interactive flows (Shipment creation, Admin updates) work with new styles.
