# Design System Specification: Editorial Vitality

## 1. Overview & Creative North Star

**The Creative North Star: "The Modern Alchemist"**
This design system moves away from the sterile, rigid layouts of traditional document software and moves toward a vibrant, editorial experience. It balances the "high-energy" freshness of a startup with the "authoritative" precision of a high-end printing house.

To achieve this, we employ **Dynamic Asymmetry**. We break the standard 12-column grid by using overlapping "paper" layers and oversized typography that creates a sense of movement. Our layouts should feel like a premium lifestyle magazine—intentional, spacious, and tactile—elevating a mundane task like document printing into a premium digital ritual.

---

## 2. Colors & Tonal Architecture

The palette is a sophisticated blend of organic greens and warm highlights. We do not use color merely for decoration; we use it to define structural hierarchy.

### The "No-Line" Rule

**Explicit Instruction:** Traditional 1px solid borders are prohibited for sectioning content. Boundaries must be defined through background color shifts or subtle tonal transitions. For example, a card (`surface-container-lowest`) should sit on a background of `surface-container-low` to create a boundary without a line.

### Surface Hierarchy & Nesting

Treat the mobile screen as a series of stacked, high-grade physical papers.

- **Base Layer:** `surface` (#F9F6F5)
- **Secondary Sectioning:** `surface-container` (#EAE8E7)
- **Actionable Cards:** `surface-container-lowest` (#FFFFFF)
- **Nested Importance:** Use `primary-container` (#9CF1CE) or `tertiary-container` (#F2B885) to pull high-priority data points into the foreground.

### The Glass & Gradient Rule

To move beyond "flat" UI, utilize semi-transparent layers for floating navigation or quick-action bars. Use a `backdrop-blur` (20px-30px) on `surface` colors at 80% opacity.

- **Signature Gradients:** For Hero CTAs and high-energy touchpoints, use a subtle linear gradient: `primary` (#00694E) to `primary-dim` (#005B43) at a 135-degree angle. This provides a "soul" and depth that flat hex codes cannot mimic.

---

## 3. Typography

We use a high-contrast pairing: **Plus Jakarta Sans** for expressive, editorial moments and **Inter** for functional, high-legibility data.

- **Display (Plus Jakarta Sans):** Oversized and bold. Used for greeting states and document titles. (`display-lg`: 3.5rem).
- **Headline (Plus Jakarta Sans):** The primary driver of the "Fresh" energy. Use `headline-lg` (2rem) for page headers to establish immediate authority.
- **Title & Body (Inter):** For document metadata, settings, and printing options. Inter’s neutral character balances the energy of the greens.
- **Label (Inter):** Strict and uppercase for micro-copy (e.g., "PAGE 1 OF 12") to maintain a professional, organized feel.

---

## 4. Elevation & Depth

Depth is achieved through **Tonal Layering** rather than heavy drop shadows.

- **The Layering Principle:** Stack your surfaces. A `surface-container-lowest` white card on a `surface-container-low` background creates a soft, natural lift.
- **Ambient Shadows:** For floating elements (like a "Print Now" FAB), use an extra-diffused shadow:
  - _Offset:_ 0px 12px | _Blur:_ 32px | _Color:_ `on-surface` (#2F2F2F) at 6% opacity. This mimics natural light.
- **The "Ghost Border" Fallback:** If a boundary is required for accessibility, use the `outline-variant` token at **15% opacity**. Never use 100% opaque borders.
- **Glassmorphism:** Navigation headers should be "frosted glass." Use `surface` at 70% opacity with a blur effect, allowing the vibrant document previews to bleed through the UI as the user scrolls.

---

## 5. Components

### Buttons

- **Primary:** High-energy. Background: `primary` (#00694E), Text: `on-primary` (#C6FFE5). Radius: `full`.
- **Secondary:** Approachable. Background: `secondary-container` (#D5ED7E), Text: `on-secondary-container` (#485800).
- **Tertiary:** For low-priority actions (e.g., "Cancel"). No background, just `primary` text.

### Cards & Document Previews

- **Constraint:** Forbid the use of divider lines within cards.
- **Separation:** Use vertical white space (from our spacing scale) or a 2px shift in background tone.
- **Styling:** Use `md` (1.5rem) or `lg` (2rem) corner radii to maintain the "Friendly & Modern" vibe.

### Input Fields

- **Background:** `surface-container-high` (#E4E2E1).
- **State:** When focused, the background remains, but a 2px "Ghost Border" of `primary` appears at 40% opacity.
- **Labels:** Always `label-md` floating above the input, never inside.

### Action Chips

- **Status:** For "Pending" or "Printed." Use `tertiary-container` (#F2B885) for a "warm" alert and `primary-container` (#9CF1CE) for success.

---

## 6. Do’s and Don’ts

### Do

- **Do** use large, intentional white space to let the "Mint" and "Lime" colors breathe.
- **Do** overlap elements (e.g., a document thumbnail slightly overlapping a card container) to create a premium, custom feel.
- **Do** use the ` Peach` (#F2B885) color sparingly for high-attention alerts or "Save" actions to provide a warm counterpoint to the greens.

### Don’t

- **Don't** use pure black (#000000). Always use `on-surface` (#2F2F2F) to keep the contrast soft and professional.
- **Don't** use standard 4px or 8px rounded corners. Stick to the `DEFAULT` (1rem) or larger for a truly modern, friendly aesthetic.
- **Don't** use traditional dividers. If content feels cluttered, increase the padding rather than adding a line.
- **Don't** use generic icons. Use a custom, rounded icon set with a 2px stroke weight to match the typography's visual weight.
