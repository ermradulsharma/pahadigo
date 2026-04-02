# 🎨 PahadiGo Frontend Architecture & UI Synthesis

**Framework:** Next.js 16 (App Router)
**Styling:** Tailwind CSS 4.x + PostCSS
**Animations:** Framer Motion (v12.x)

This document explains the organization of the user-facing and administrative portals in the PahadiGo ecosystem.

---

## 🏛️ 1. Modern Next.js App Router Structure

The frontend is logically split into two distinct boundaries:

1.  **Public Website (`src/app/(website)`)**:
    - **SEO & Performance:** Optimized using Server-Side Rendering (SSR) and Incremental Static Regeneration (ISR).
    - **RSC Focus:** Heavy use of React Server Components to minimize hydration overhead and JavaScript bundle sizes.
    - **Glassmorphic Design:** Styled with Tailwind 4 for high-fidelity travel experiences.
2.  **Admin Dashboard (`src/app/admin`)**:
    - **Interactivity:** A strictly Client-Side Rendered (CSR) dashboard for real-time telemetry and management.
    - **High Security:** Protected by edge-middleware that redirects unauthorized users before they hit the React tree.
    - **Telemetry:** Visualized via `Recharts` for revenue and growth mapping.

---

## 💎 2. Design System & Aesthetics

### Vibrant Dark Mode & Glassmorphism
- **Primary Color Scale:** Deep Himalayan Blues and Slate Greys.
- **Glass Effects:** Uses `backdrop-blur` and translucent HSL colors for a premium "Apple-like" aesthetic.
- **Typography:** Modern, legible fonts (inter, outfit) optimized for both desktop and mobile viewports.

### Motion Orchestration
- **Framer Motion:** Every route transition and interaction is animated.
- **Micro-interactions:** Hover-states on "Book Now" buttons and "Package Cards" use physics-based spring animations to feel reactive.

---

## 🧩 3. Component Hierarchy (`src/app/components`)

Shared UI elements are isolated for cross-portal reuse:

- **Atoms:** `Button`, `Input`, `Badge`, `Skeleton`.
- **Molecules:** `PackageCard`, `BookingSummary`, `VendorReview`.
- **Organisms:** `Navbar`, `StickyFooter`, `AdminSidebar`.
- **Layout Controllers:** Standardized wrappers for error boundaries and loading skeletons.

---

## 📡 4. State Management & Data Fetching

- **Server-Side:** React `fetch` with caching headers for package cataloging.
- **Client-Side:** Lightweight React `useState` and `useEffect` for login states and interactive booking forms.
- **Cookies:** `js-cookie` used for persisting session identifiers across the sub-domain boundaries.

---

## 🛠️ 5. Development Protocols

### Utility-First CSS
- Avoid ad-hoc inline styles. Use Tailwind utilities strictly.
- For complex transitions, define variants in `framer-motion` to keep components clean.

### Responsive Thresholds
- **Mobile First:** All layouts must be verified for "Thumb-Friendly" navigation on 360px viewports.
- **Desktop Grid:** Use CSS Grid for complex administrative tables and dashboard metrics.
