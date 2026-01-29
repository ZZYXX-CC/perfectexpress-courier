---
name: perfect_express_design
description: Design system and UI guidelines for PerfectExpress, focusing on a "Cinematic Luxury meets Tech-Driven Logistics" aesthetic.
---

# PerfectExpress Design System
**Version:** 1.0  
**Theme:** Cinematic Luxury & Industrial Logistics  
**Core Philosophy:** "Precision Infrastructure for the Everyday Customer."

---

## 1. Visual Language

### 1.1 Color Palette
The palette is rooted in a deep "Noir" aesthetic with high-contrast functional accents.

| Role | Hex | Tailwind Utility | Description |
| :--- | :--- | :--- | :--- |
| **Main Background** | `#0a0a0a` | `bg-[#0a0a0a]` | Deepest neutral, used for page-level containers. |
| **Surface (Level 1)** | `#171717` | `bg-[#171717]` | Card and section backgrounds. |
| **Surface (Level 2)** | `#262626` | `bg-[#262626]` | Elevated elements, hover states, or dividers. |
| **Accent Primary** | `#dc2626` | `text-red-600` | The "Precision Red." Used for status, CTAs, and key brand marks. |
| **Border Subtle** | `#262626` | `border-neutral-800` | Standard hairline borders for containment. |
| **Text Primary** | `#fafafa` | `text-neutral-50` | Headings and high-priority content. |
| **Text Muted** | `#737373` | `text-neutral-500` | Secondary descriptions and metadata. |

### 1.2 Typography
We use a high-contrast pairing of a technical sans-serif and a modern geometric heading font.

*   **Headings:** `Manrope` (Weights: 700, 800)
    *   *Style:* Uppercase, Tracking-tighter (`-0.02em` to `-0.05em`).
    *   *Usage:* H1 through H3, Brand logos.
*   **Body:** `Inter` (Weights: 400, 500, 600)
    *   *Style:* Sentence case, standard tracking.
    *   *Usage:* General descriptions, paragraphs.
*   **Metadata/UI:** `Inter` (Weight: 900 / Black)
    *   *Style:* Uppercase, Extreme Tracking (`0.3em` to `0.4em`), Font size `9px` to `11px`.
    *   *Usage:* Status labels, category headers, small captions.

---

## 2. Components & UI Patterns

### 2.1 Surfaces & Containment
*   **Corner Radius:** `rounded-sm` (approx 2px - 4px). Avoid large rounded corners to maintain "industrial" rigidity.
*   **Glassmorphism:** Use `bg-neutral-900/40` with `backdrop-blur-md` and a 1px `border-neutral-800` for hero overlays and cards.
*   **Grid Gradients:** Subtle radial gradients (`radial-gradient(#262626 1px, transparent 1px)`) with `background-size: 40px 40px` provide a blueprint-like texture.

### 2.2 Buttons
*   **Primary (Action):** White background, black text, `font-black`, `uppercase`, `tracking-widest`.
*   **Secondary (Functional):** Transparent/Neutral-900 background, 1px neutral-800 border, white text.
*   **Accent (Alert/Status):** Red-600 background, white text.

### 2.3 Form Inputs
*   **Style:** `bg-neutral-950`, `border-neutral-800`, `rounded-sm`.
*   **Focus State:** `border-neutral-600` with no ring. 
*   **Text:** Uppercase, `text-[10px]`, `font-bold`, `tracking-widest`.

### 2.4 Iconography
*   **Set:** Iconify Solar Linear (`solar:*-linear`).
*   **Weight:** Thin/Light strokes to complement the Inter font.
*   **Coloring:** Icons should typically be `neutral-500` or `neutral-700`, turning `red-600` on parent hover.

---

## 3. Motion & Interaction

We use **Framer Motion** for a "Cinematic" feel. Transitions should be deliberate and smooth, not bouncy.

### 3.1 Page Transitions
*   **Pattern:** Fade-in with a slight upward slide (`y: 20` to `0`).
*   **Duration:** `0.5s` to `0.8s`.
*   **Ease:** `[0.22, 1, 0.36, 1]` (Quintic ease-out).

### 3.2 List Staggering
*   When rendering cards (Features, stats), use `staggerChildren: 0.1` or `0.2`.

### 3.3 Hover Effects
*   **Cards:** 1px border color transition (`border-neutral-800` to `border-red-600`).
*   **Depth:** Subtle Y-axis translation (`y: -5px`).

---

## 4. Voice & Tone
*   **Clarity over Complexity:** Avoid "logistics nodes," "optimization protocols," or "infrastructure layers."
*   **User-Centric:** Use "Your package," "Shipping speed," "Reliable delivery," and "Simple tracking."
*   **Personality:** Professional, calm, and high-end. The UI looks expensive, but the language feels accessible.

---

## 5. Development Standards
*   **Imports:** Always externalize React/ReactDOM in `importmap` to avoid multi-instance hook errors.
*   **Responsiveness:** Mobile-first. Use `px-6` (24px) padding as the standard container gutter.
*   **Accessibility:** Ensure `iconify-icon` has relevant `aria-label` when used as buttons. All interactive elements must have a defined `:focus` or `active` state.
