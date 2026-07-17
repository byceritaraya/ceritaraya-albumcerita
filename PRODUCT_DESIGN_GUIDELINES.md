# AlbumCerita Product Design Guidelines

This document serves as the source of truth for all product design decisions, ensuring consistency, high-quality aesthetics, and a cohesive user experience across AlbumCerita.

## 1. Voice & Tone
Our communication should feel **human, warm, personal, calm, and celebratory**.
- **Do:** Use simple, easy-to-understand language. (e.g. "Opening Camera...", "Share this moment")
- **Don't:** Use technical, corporate, or robotic system-generated terms. (e.g. "System Error 500", "Upload Successful")
- **Loading States:** Always use **Verb + Object** (e.g., "Uploading photos...", "Preparing album...").
- **Success States:** Celebrate the milestone (e.g., "Event Created Successfully" rather than "Success").

## 2. Localization
- **Default Language:** Bahasa Indonesia is the default language, targeting the initial market (weddings, events).
- **Scope:** All interfaces (Guest, Host, Public Album, Admin Dashboard) must be fully localized using our `en.ts` and `id.ts` dictionaries.
- **Pattern:** Use `useT()` in Client Components and `getT()` in Server Components.

## 3. Motion & Animation
Animations should be smooth, intentional, and not overly distracting, adding a premium feel.
- **Modals/Dialogs:** Use the `.ac-modal-enter` class for a centered fade-in and scale-up effect (`--ease-spring`, `--duration-base`).
- **Bottom Sheets:** Use the `.ac-sheet-enter` class for sliding up from the bottom (`--ease-spring`, `--duration-moderate`).
- **Toasts:** Use the `.ac-toast-enter` class for sliding down or up depending on placement.
- **Micro-interactions:** Add `active:scale-[0.97]` or similar subtle scaling on primary buttons to make the app feel responsive.

## 4. UI Consistency & Tokens
All standard sizes and shapes should be derived from our tokens in `globals.css`.
- **Buttons (Guest/Host):** Fully rounded (`rounded-full` or `var(--radius-btn)`).
  - Primary Height: `h-14` (`3.5rem`)
  - Secondary Height: `h-10` (`2.5rem`)
  - Compact Height: `h-8` (`2rem`)
- **Cards (Guest/Host):** Use `rounded-2xl` (`var(--radius-card)`).
- **Modals (Guest/Host):** Use `rounded-3xl` (`var(--radius-modal)`).
- **Admin Dashboard:** Follows a slightly more dense, traditional SaaS aesthetic (e.g., `rounded-lg` for inputs/buttons, `rounded-xl` for cards).

## 5. Theming
AlbumCerita supports multiple themes applied via `theme-*` classes on the body or container (e.g., `.theme-sage`, `.theme-blush`).
- Always use CSS variables for colors (e.g., `var(--theme-primary)`, `var(--bg-primary)`) rather than hardcoded Hex or Tailwind default colors to ensure theme compatibility.

## 6. Accessibility & Layout
- Mobile views must account for safe areas: use `.pb-safe` and `.pt-safe`.
- Ensure appropriate contrast for all text over theme backgrounds.
