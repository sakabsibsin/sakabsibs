# PDP + WhatsApp Modal — Premium Upgrade Pass

**Status:** Draft — pending implementation plan
**Date:** 2026-05-21
**Scope:** ProductDetailPage and WhatsApp inquiry modal only. No backend changes. No new dependencies.

---

## 1. Context

Sakab Sibs is a social-commerce jewelry storefront. Instagram is the discovery channel; the WhatsApp inquiry modal on the Product Detail Page (PDP) is the **only** conversion action. Every customer that converts passes through this single page.

The current PDP already has a thoughtful foundation: warm cream × burgundy palette, Cormorant Garamond serif headings, sharp corners, framer-motion choreography (stagger on info column, `layoutId` variant pill, AnimatePresence crossfade gallery). The owner wants the PDP and modal to feel **premium** — not flashy, not redesigned from scratch, but elevated so that every interaction feels deliberate and confident.

## 2. Direction

**Considered Boutique** — modern-boutique baseline (Mejuri / Catbird / Aurate school) with quiet-luxury restraint at peak moments.

### Guiding principle

> Every interaction is felt, never noticed.

Concretely:

- **Springs over linear easing.** Real-world physics feels expensive.
- **Tactile press feedback.** Every clickable depresses under tap.
- **Choreography between elements.** Things arrive in a deliberate order, not simultaneously.
- **Whitespace where most sites push for density.** Confidence shows in restraint.

### Why this direction

- Jewelry shoppers already understand this language — no learning curve
- Mobile-first by default (Instagram traffic on mid-tier phones)
- Builds on the existing design system without breaking it
- Uses only what is already installed (framer-motion, Tailwind v3, Lucide)

## 3. Design tokens (additions)

These extend the existing system in [tailwind.config.js](frontend/tailwind.config.js) and the shared CSS variables. Nothing is replaced.

### Easing curves

```js
// tailwind.config.js → theme.extend
transitionTimingFunction: {
  'boutique-out': 'cubic-bezier(0.22, 1, 0.36, 1)',     // long out-curve — for entrances
  'boutique-in':  'cubic-bezier(0.64, 0, 0.78, 0)',     // short in-curve — for exits
  'boutique':     'cubic-bezier(0.45, 0, 0.15, 1)',     // balanced — for hovers
}
```

### Spring presets (framer-motion)

```js
// frontend/src/lib/motion.js (new)
export const springs = {
  // soft, confident — for variant pills, modal entrance
  soft:    { type: 'spring', stiffness: 340, damping: 28, mass: 0.7 },
  // crisp, responsive — for taps, swatches
  crisp:   { type: 'spring', stiffness: 480, damping: 30, mass: 0.55 },
  // slow, deliberate — for page entrances, image arrival
  arrival: { type: 'spring', stiffness: 180, damping: 26, mass: 0.9 },
};
```

### Focus ring

A single brand-colored focus style replaces the inconsistent rings across components.

```css
/* index.css */
.focus-boutique:focus-visible {
  outline: none;
  box-shadow: 0 0 0 1.5px hsl(var(--primary) / 0.32);
}
```

## 4. PDP entrance choreography

### Current state

`ProductDetailPage` uses a page-level `opacity: 0 → 1` over 0.4s. Info column has stagger (0.08s child, 0.12s delay). Gallery uses AnimatePresence opacity crossfade.

### Premium upgrade

| Element              | Current                 | New                                                                              |
|----------------------|-------------------------|----------------------------------------------------------------------------------|
| Page wrapper         | opacity 0 → 1 over 0.4s | opacity 0 → 1 over 0.5s, `boutique-out` easing (pure opacity, per CLAUDE.md)     |
| Image gallery        | appears with page       | opacity 0 → 1 + slight scale `0.985 → 1` (arrival spring, 600ms)                 |
| Info column children | 0.08s stagger, 0.12s delay | 0.08s stagger, **0.22s** delayed start, each child uses `boutique-out` 500ms  |
| Total entrance       | ~0.6s                   | ~1.2s                                                                            |

The image arrives first; the info column composes itself in its wake. The increase from 0.6s to 1.2s sounds slow but reads as **deliberate** — like a museum docent placing the object before describing it.

**Mobile** stacks image above info. Same choreography — image arrives first, info stacks below.

## 5. Gallery upgrade

### Goals

Make image viewing feel like browsing a print catalog: confident, photo-first, zero friction.

### Components

**Main image**
- Aspect ratio reserved (no layout shift). Current `aspect-square` stays.
- LQIP blur-up: a tiny placeholder loads instant, full-res `<img>` fades in over it (`opacity-0 transition-opacity duration-500` → toggled by `onLoad`)
- Hover (desktop only via `@media (hover: hover)`): `scale-[1.02] brightness-105 saturate-[1.12]` over 600ms `boutique` easing
- Tap on mobile: opens a fullscreen lightbox (see below)
- Image swap on variant or thumbnail click: AnimatePresence opacity crossfade 500ms (keeps current pattern)

**Thumbnail strip** — appears below the main image on mobile, beside it on desktop (vertical column on the left)
- Each thumbnail: aspect-square, `w-16 h-16` mobile / `w-14 h-14 desktop`
- Active thumbnail indicator: a hairline rectangle (1.5px border `border-primary`) animated via `layoutId="gallery-active-thumb"` with `springs.soft` — the indicator slides between thumbnails on selection, consistent with the variant pill
- Inactive thumbnails: 60% opacity, hover lifts to 100%
- Tap: cross-dissolves the main image

**Image counter** — top-right of main image, tracked uppercase typography matching the brand
```jsx
<div className="absolute top-3 right-3 text-[10px] tracking-[0.3em] uppercase text-foreground/40 font-medium tabular-nums">
  {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
</div>
```

**Mobile lightbox** — opens on tap
- Backdrop: black/80, fade in 300ms
- Image: scales from thumbnail position to fit viewport (transform-based, GPU-accelerated)
- Swipe left/right to change image — uses framer-motion `drag="x"` with `dragConstraints` and `onDragEnd` velocity check
- Tap or swipe down to dismiss
- No new dependency — framer-motion already supports this

### What we are NOT building

- No pinch-to-zoom (browser native handles it via image tap; reduces complexity)
- No 360° / video / spin gallery
- No image carousel with bullet dots (the counter replaces this)

## 6. Variant switching

### Goals

Make variants legible at a glance (not requiring a read of the color name) and responsive to the touch.

### Color swatches

Each variant gets a **swatch dot** next to the color name. The dot uses a small CSS-only color map:

```js
// frontend/src/lib/swatches.js (new)
export const SWATCH = {
  'Gold':            'linear-gradient(135deg, #f4d68a 0%, #c79f50 100%)',
  'Rose Gold':       'linear-gradient(135deg, #f8d4c0 0%, #d18b6b 100%)',
  'Silver':          'linear-gradient(135deg, #e8e8e8 0%, #a8a8a8 100%)',
  'White Gold':      'linear-gradient(135deg, #f0f0e8 0%, #c8c8b8 100%)',
  'Oxidised Black':  'linear-gradient(135deg, #4a4a4a 0%, #1a1a1a 100%)',
  'Oxidised Silver': 'linear-gradient(135deg, #888 0%, #555 100%)',
  'Antique Bronze':  'linear-gradient(135deg, #b8895a 0%, #6e4a2a 100%)',
  'Copper':          'linear-gradient(135deg, #d97a4f 0%, #8a4a2a 100%)',
  'Bronze':          'linear-gradient(135deg, #c8915a 0%, #7a4a2a 100%)',
  'Gunmetal':        'linear-gradient(135deg, #5a5a5a 0%, #2a2a2a 100%)',
  'Pearl White':     'linear-gradient(135deg, #fafaf5 0%, #e8e8d8 100%)',
  'Champagne':       'linear-gradient(135deg, #f0e5c8 0%, #c8b088 100%)',
  'Midnight Black':  'linear-gradient(135deg, #2a2a2a 0%, #000 100%)',
  'Matte Silver':    'linear-gradient(135deg, #d8d8d8 0%, #a8a8a8 100%)',
};

export const getSwatch = (color) => SWATCH[color] ?? null;
```

A small `Swatch` component renders an 8px dot with the gradient, or a hairline outline (`border border-border`) if no entry. This handles all the seed data's color names.

### Pill layout (in [ProductDetailPage.jsx](frontend/src/pages/store/ProductDetailPage.jsx))

```jsx
<button
  onClick={() => setSelectedVariant(i)}
  className={cn(
    'relative inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest',
    'transition-colors duration-300 active:scale-[0.96]',
    'border border-border',
    isActive ? 'text-background' : 'text-foreground/70 hover:text-foreground'
  )}
>
  {isActive && (
    <motion.span
      layoutId="variant-active-bg"
      className="absolute inset-0 bg-foreground"
      transition={springs.soft}
    />
  )}
  <span className="relative z-10 flex items-center gap-2">
    <Swatch color={v.color} />
    {v.color}
  </span>
</button>
```

`active:scale-[0.96]` adds the tactile depression. The existing `layoutId` sliding background stays.

### Price change

Current behavior is AnimatePresence opacity crossfade. We upgrade to an opacity + small Y-translate composition:

```jsx
<AnimatePresence mode="wait">
  <motion.span
    key={activePrice}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={springs.crisp}
  >
    {formatPrice(activePrice)}
  </motion.span>
</AnimatePresence>
```

The price "lifts" into place — feels more responsive than a pure crossfade.

### Main image follows variant

When a variant changes, the main gallery image cross-dissolves to that variant's first image (already implemented). We keep this and ensure the thumbnail strip also resets its `activeIndex` to 0.

## 7. WhatsApp modal — "presented like a gift"

This is the conversion moment. Right now it is a 10-field form. The upgrade reframes it as a confident hand-off.

### Visible structure

```
┌─────────────────────────────────────────┐
│ ✕                                       │
│                                         │
│  ┌───┐                                  │
│  │img│  Product Name                    │
│  └───┘  ₹1,099 · Code BRA101            │
│                                         │
│  ─────────── About you ───────────      │
│  Full Name                              │
│  Phone               Alt. Phone         │
│                                         │
│  ─────── Where to send ──────────       │
│  House / Flat        Street             │
│  Landmark (optional)                    │
│  City                Pincode            │
│  District            State              │
│                                         │
│         [  Send via WhatsApp  ]         │
└─────────────────────────────────────────┘
```

Key additions vs current:

1. **Product summary card pinned at top.** Small thumbnail + name + price + code. Customer never doubts what they are inquiring about. This is the "premium" touch — never make the customer hold context in their head.
2. **Two labeled groups** with hairline dividers and small caps labels ("About you" / "Where to send"). Reduces the perceived count from 10 fields to "two short sections."
3. **No structural data change** — the same fields, the same WhatsApp message format. Just visually reorganized.

### Field styling

Inputs share a single class (`inputBoutique`):

```js
const inputBoutique = cn(
  'h-11 w-full bg-transparent px-3 text-sm',
  'border border-border transition-[border-color,box-shadow] duration-300',
  'focus:outline-none focus:border-foreground/60 focus:shadow-[inset_0_-1px_0_hsl(var(--foreground)/0.6)]',
  'placeholder:text-muted-foreground/45'
);
```

The bottom-border thickening on focus is subtle but consistent — feels like a fine pen line being drawn under the field.

Labels sit above each field in tracked uppercase 10px — same as the existing detail rows on the PDP. No "floating label" tricks (they confuse autofill).

### Modal entrance

Current modal slides up + fades. Keeps this, refines timing:

```js
// motion config for modal card
initial={{ opacity: 0, y: 24, scale: 0.985 }}
animate={{ opacity: 1, y: 0,   scale: 1     }}
exit={{    opacity: 0, y: 16,  scale: 0.99  }}
transition={springs.soft}
```

Backdrop: `bg-black/45 backdrop-blur-sm`, fades in 300ms `boutique-out`.

### Submit feedback

On submit:

1. Button: scale 0.97 on press (`active:scale-[0.97]`), 100ms duration
2. Sonner toast appears: `"Opening WhatsApp…"` — confirms the action started
3. 300ms delay (perceptible confirmation, not actual blocking)
4. `window.open()` to WhatsApp URL with the pre-filled message
5. Modal closes with the existing exit animation

The toast is critical — without it, the user taps Send and the modal disappears with no acknowledgment, leaving uncertainty about whether the action worked.

### Out-of-stock variant

The "I'm Interested" demand button gets the same press treatment (`active:scale-[0.97]`) and a Sonner success toast in the brand font: `"We'll let you know when it's back."`

## 8. Cross-cutting micro-interactions

Apply across PDP and modal:

| Element              | Treatment                                                   |
|----------------------|-------------------------------------------------------------|
| All buttons          | `active:scale-[0.97] active:duration-100`                   |
| Focus states         | `focus-boutique` class — 1.5px primary/32 ring, no offset   |
| Hover transitions    | 300ms `boutique` easing (was 150ms)                         |
| Sonner toasts        | Cormorant title, sans body, cream `bg-background`, hairline border, no icon |
| Disabled states      | `opacity-40 pointer-events-none` (existing) — no change     |

### Toast configuration

```jsx
// frontend/src/main.jsx or wherever <Toaster /> lives
<Toaster
  position="top-center"
  toastOptions={{
    className: 'font-serif border border-border bg-background text-foreground',
    duration: 2500,
  }}
/>
```

## 9. Performance budget

- **First contentful paint:** unchanged (server delivers HTML quickly)
- **Largest contentful paint (image):** ≤ 1.5s on 4G mobile via LQIP blur-up
- **Cumulative Layout Shift:** 0 — aspect ratios reserved
- **Total animation frame budget:** all animations use only `transform` and `opacity` (GPU-accelerated)
- **Initial JS bundle delta:** ≤ +3KB gzipped (only the `motion.js` constants and `swatches.js` map)
- **No new dependencies** — verified

## 10. Files affected

| File | Change |
|------|--------|
| [frontend/tailwind.config.js](frontend/tailwind.config.js) | Add `boutique-*` easing curves under `transitionTimingFunction` |
| [frontend/src/index.css](frontend/src/index.css) | Add `.focus-boutique` utility |
| `frontend/src/lib/motion.js` | **New** — exports `springs` presets |
| `frontend/src/lib/swatches.js` | **New** — exports `SWATCH` color map + `getSwatch(color)` |
| `frontend/src/components/store/Swatch.jsx` | **New** — small 8px dot component using `getSwatch` |
| `frontend/src/components/store/ImageLightbox.jsx` | **New** — mobile fullscreen image viewer with swipe |
| [frontend/src/pages/store/ProductDetailPage.jsx](frontend/src/pages/store/ProductDetailPage.jsx) | Wire entrance choreography, thumbnail strip, image counter, lightbox, swatch in variant pills, price lift animation |
| [frontend/src/components/store/WhatsAppButton.jsx](frontend/src/components/store/WhatsAppButton.jsx) | Add product summary card at top of modal, group fields with dividers, apply `inputBoutique`, refine entrance/exit timing, add "Opening WhatsApp…" toast |
| `frontend/src/components/store/WhatsAppButton.jsx` (continued) | Demand button gets `active:scale-[0.97]` + success toast |
| [frontend/src/main.jsx](frontend/src/main.jsx) | Configure `<Toaster />` with Cormorant title, cream bg, hairline border |

## 11. Acceptance criteria

A reviewer should be able to confirm each of these by interacting with the running app on both mobile (≤ 400px) and desktop (≥ 1024px).

1. PDP loads with image arriving first, then info column elements composing in deliberate sequence over ~1.2s
2. Hovering the main image on desktop produces a soft scale and warmth lift
3. Tapping the main image on mobile opens a fullscreen lightbox; swiping horizontally moves between images; swiping down dismisses
4. Image counter "01 / 04" is visible top-right of the main image
5. Thumbnail strip below (mobile) / beside (desktop) the main image; tapping a thumbnail crossfades the main image; the active indicator slides via spring
6. Each variant pill shows a colored swatch dot next to the color name for known colors; unknown colors get a hairline-outline dot
7. Tapping a variant pill compresses it briefly (scale 0.96), then springs back. The active background slides via `layoutId`. The main image cross-dissolves to the variant's first image. The price lifts into place.
8. WhatsApp modal opens with backdrop fade + card spring up. A product summary card (thumbnail + name + price + code) is pinned at top
9. Fields are grouped under "About you" and "Where to send" hairline-divided sections
10. Focusing a field thickens the bottom border smoothly over 300ms
11. Submitting shows a Sonner toast "Opening WhatsApp…" in Cormorant for 300ms before WhatsApp opens; modal then closes via exit animation
12. Out-of-stock "I'm Interested" button presses and shows a toast "We'll let you know when it's back."
13. Every button visibly depresses (scale 0.97) on tap
14. No layout shift on image load
15. No new npm dependencies in `frontend/package.json`

## 12. Non-goals (explicit)

The following are intentionally **out of scope** for this sweep. Each may be a future spec.

- 3D / WebGL / canvas rendering
- Scroll-driven parallax of any kind
- Pinch-to-zoom on images (browser-native handles this; complexity not worth the polish)
- Backend changes (no API additions, no schema changes)
- New data fields (no LQIP storage on the Product model — we use a CSS blur on `onLoad` instead)
- Cart / wishlist / favorites (out of social-commerce model)
- Customer accounts / login (out of social-commerce model)
- Reviews / ratings (out of scope)
- Inventory display ("only 2 left") (out of scope)
- HomePage / CatalogPage / Admin — separate sweep, separate spec
- Page transition animations between routes — separate sweep (motion system)

## 13. Open risks

| Risk | Mitigation |
|------|-----------|
| LQIP blur-up needs a base64 or solid color per image; we have no current pipeline for this | Use a single neutral cream solid `bg-muted` as the placeholder; full image fades in on `onLoad`. No backend work needed. |
| Mobile lightbox drag-to-dismiss might conflict with browser pull-to-refresh | Lightbox sets `overscroll-behavior: contain` on its scroll container; backdrop intercepts touch events |
| Swatch color map is hardcoded; new colors added through admin won't have swatches | Fallback to hairline-outline dot for unknown colors — degrades gracefully. Admin can update the map later if needed. |
| 1.2s entrance might feel slow to repeat visitors | Slow is "deliberate" only the first time; React Query cache keeps subsequent PDP visits instant from data perspective, and `prefers-reduced-motion` honored throughout |

## 14. Accessibility

- All animations respect `@media (prefers-reduced-motion: reduce)` — entrance animations fall back to instant opacity changes; swipe gestures still work
- Focus ring (`.focus-boutique`) is visible on keyboard navigation; hidden on mouse via `:focus-visible`
- Lightbox traps focus, ESC closes, ARIA labels set
- Swatch dots have `aria-hidden="true"` (the color name text label is the source of truth for screen readers)
- Image counter has `aria-live="polite"` so screen readers announce position changes

---

**End of spec.** Ready for implementation planning.
