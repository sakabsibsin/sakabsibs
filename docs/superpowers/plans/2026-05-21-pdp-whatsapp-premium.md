# PDP + WhatsApp Modal Premium Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the Product Detail Page and WhatsApp inquiry modal to a "Considered Boutique" premium feel — every interaction felt but never noticed — without adding dependencies or changing the backend.

**Architecture:** Additive refinements on top of the existing framer-motion + Tailwind v3 system. Four small new files (`lib/motion.js`, `lib/swatches.js`, `components/store/Swatch.jsx`, `components/store/ImageLightbox.jsx`). Surgical edits to `ProductDetailPage.jsx` and `WhatsAppButton.jsx`. Two design tokens added to `tailwind.config.js` and `index.css`. Toaster style tweak in `main.jsx`.

**Tech Stack:** React 19 (JSX), Vite, Tailwind v3, framer-motion v11, Sonner, Lucide. No TypeScript. No test framework — visual verification on dev server.

**Spec:** [docs/superpowers/specs/2026-05-21-pdp-whatsapp-premium-design.md](../specs/2026-05-21-pdp-whatsapp-premium-design.md)

---

## File Structure

**New files (4):**
- `frontend/src/lib/motion.js` — three spring presets shared across the app
- `frontend/src/lib/swatches.js` — color name → CSS gradient map + `getSwatch(color)`
- `frontend/src/components/store/Swatch.jsx` — 10×10 dot component using `getSwatch`
- `frontend/src/components/store/ImageLightbox.jsx` — mobile fullscreen image viewer with drag-to-dismiss

**Files modified:**
- `frontend/tailwind.config.js` — add `boutique-*` easing curves
- `frontend/src/index.css` — add `.focus-boutique` utility (currently the file may already exist; we append)
- `frontend/src/main.jsx` — configure `<Toaster />` style
- `frontend/src/pages/store/ProductDetailPage.jsx` — entrance timing, image arrival, gallery counter, thumbnail strip `layoutId`, mobile lightbox wire-up, variant swatch + tactile press, price lift, demand button toast
- `frontend/src/components/store/WhatsAppButton.jsx` — product thumbnail in summary card, section labels, input focus thickening, "Opening WhatsApp…" submit toast

**Total tasks:** 18. Each one is committed individually so review and rollback are clean.

---

## Verification convention

Every task ends with a **manual dev-server check**. The verification step lists exactly what to navigate to and what to observe. If the observation doesn't match, the task is not complete.

To start the dev server (already in CLAUDE.md):

```bash
npm run dev
```

This boots backend on `:8080` and frontend on `:5173`. Open `http://localhost:5173/products` and click any product to land on the PDP for visual checks.

---

## Task 1: Add easing curve design tokens

**Files:**
- Modify: `frontend/tailwind.config.js`

- [ ] **Step 1: Open the current Tailwind config**

Run:
```bash
cat frontend/tailwind.config.js
```

You will see a `theme.extend` block already containing `keyframes` and `animation`. We add `transitionTimingFunction` inside `extend`.

- [ ] **Step 2: Add the three boutique easing curves**

Inside `theme.extend`, add the following block (place it next to `keyframes` for tidiness):

```js
transitionTimingFunction: {
  'boutique-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
  'boutique-in':  'cubic-bezier(0.64, 0, 0.78, 0)',
  'boutique':     'cubic-bezier(0.45, 0, 0.15, 1)',
},
```

- [ ] **Step 3: Verify Tailwind picks them up**

Run:
```bash
npm run dev
```

In any component file temporarily add a div with `className="ease-boutique-out"`. Inspect in DevTools — the computed `transition-timing-function` should read `cubic-bezier(0.22, 1, 0.36, 1)`. Remove the temporary div.

- [ ] **Step 4: Commit**

```bash
git add frontend/tailwind.config.js
git commit -m "feat(design): add boutique easing curves to tailwind config"
```

---

## Task 2: Add `.focus-boutique` utility

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Confirm the file has a `@layer utilities` block**

Run:
```bash
grep -n "@layer utilities" frontend/src/index.css
```

If it returns a hit, append the new utility inside that layer. If not, add a new `@layer utilities` block at the end of the file.

- [ ] **Step 2: Add the utility**

Append (inside `@layer utilities { ... }`):

```css
.focus-boutique:focus-visible {
  outline: none;
  box-shadow: 0 0 0 1.5px hsl(var(--primary) / 0.32);
}
```

- [ ] **Step 3: Verify in browser**

With dev server running, temporarily add `className="focus-boutique"` to any `<button>` in `ProductDetailPage`. Tab to it with the keyboard. You should see a 1.5px burgundy-toned ring (no offset). Remove the temporary class.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(design): add .focus-boutique brand-coloured focus ring utility"
```

---

## Task 3: Create spring presets module

**Files:**
- Create: `frontend/src/lib/motion.js`

- [ ] **Step 1: Create the module**

Write `frontend/src/lib/motion.js`:

```js
// Shared spring presets for the Considered Boutique motion system.
// Use these instead of hand-tuning stiffness/damping per component.

export const springs = {
  // Soft and confident — for layoutId pills, modal entrance.
  soft:    { type: 'spring', stiffness: 340, damping: 28, mass: 0.7 },
  // Crisp and responsive — for tap feedback, swatch selection, price lift.
  crisp:   { type: 'spring', stiffness: 480, damping: 30, mass: 0.55 },
  // Slow and deliberate — for page entrance and image arrival.
  arrival: { type: 'spring', stiffness: 180, damping: 26, mass: 0.9 },
};
```

- [ ] **Step 2: Smoke-test the module**

Run:
```bash
node --input-type=module -e "import('./frontend/src/lib/motion.js').then(m => { const s = m.springs; if (!s.soft || !s.crisp || !s.arrival) throw new Error('missing preset'); console.log('OK'); })"
```

Expected output:
```
OK
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/motion.js
git commit -m "feat(motion): add shared spring presets (soft/crisp/arrival)"
```

---

## Task 4: Create swatch color map and component

**Files:**
- Create: `frontend/src/lib/swatches.js`
- Create: `frontend/src/components/store/Swatch.jsx`

- [ ] **Step 1: Create the color map**

Write `frontend/src/lib/swatches.js`:

```js
// Color-name → CSS gradient. Names match the seed data and what admins are
// likely to type. Unknown colors fall back to a hairline outline dot.

const SWATCH = {
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

- [ ] **Step 2: Quick assert**

Run:
```bash
node --input-type=module -e "import('./frontend/src/lib/swatches.js').then(m => { if (!m.getSwatch('Gold')) throw new Error('Gold missing'); if (m.getSwatch('Unicorn') !== null) throw new Error('unknown should be null'); console.log('OK'); })"
```

Expected output:
```
OK
```

- [ ] **Step 3: Create the Swatch component**

Write `frontend/src/components/store/Swatch.jsx`:

```jsx
import { getSwatch } from '@/lib/swatches';

// 10×10 dot rendered next to a variant color name. Falls back to a
// hairline-outlined empty dot for unknown colors so the UI degrades cleanly.
export const Swatch = ({ color, className = '' }) => {
  const gradient = getSwatch(color);
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${
        gradient ? '' : 'border border-foreground/30'
      } ${className}`}
      style={gradient ? { background: gradient } : undefined}
    />
  );
};
```

- [ ] **Step 4: Visual verification**

Open `ProductDetailPage` in browser. Temporarily inject `<Swatch color="Gold" /><Swatch color="Rose Gold" /><Swatch color="Unknown" />` somewhere visible. Three dots should appear — first gold-tinted, second rose-tinted, third with a hairline outline only. Remove the temporary code.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/swatches.js frontend/src/components/store/Swatch.jsx
git commit -m "feat(store): add colour swatch map and Swatch dot component"
```

---

## Task 5: Build the ImageLightbox component

**Files:**
- Create: `frontend/src/components/store/ImageLightbox.jsx`

- [ ] **Step 1: Create the component**

Write `frontend/src/components/store/ImageLightbox.jsx`:

```jsx
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getCloudinaryThumb } from '@/lib/utils';

// Fullscreen image viewer for mobile. Horizontal drag changes image;
// vertical-down drag or backdrop tap dismisses. Trap-focus and ESC handled.
export const ImageLightbox = ({ open, images, activeIndex, onChange, onClose }) => {
  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && activeIndex > 0) onChange(activeIndex - 1);
      if (e.key === 'ArrowRight' && activeIndex < images.length - 1) onChange(activeIndex + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, activeIndex, images.length, onChange, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleDragEnd = (_e, info) => {
    const { offset, velocity } = info;
    if (offset.y > 120 || velocity.y > 600) {
      onClose();
      return;
    }
    if (offset.x < -80 && activeIndex < images.length - 1) {
      onChange(activeIndex + 1);
    } else if (offset.x > 80 && activeIndex > 0) {
      onChange(activeIndex - 1);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          {/* Counter */}
          <div className="absolute top-4 left-4 text-[10px] tracking-[0.3em] uppercase text-white/60 font-medium tabular-nums">
            {String(activeIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close image viewer"
            className="absolute top-3 right-3 h-11 w-11 flex items-center justify-center text-white/70 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Image */}
          <motion.img
            key={activeIndex}
            src={getCloudinaryThumb(images[activeIndex], 1600)}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain select-none touch-none"
            draggable={false}
            drag
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.7 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

- [ ] **Step 2: Smoke test the import path**

Run:
```bash
node --input-type=module -e "import('./frontend/src/components/store/ImageLightbox.jsx').then(() => console.log('OK')).catch((e) => { console.error(e); process.exit(1); })"
```

This will likely fail because Node cannot resolve JSX or the `@/` alias — that is expected. The real verification happens during Task 10 when we wire it up. Skip the assertion and proceed.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/store/ImageLightbox.jsx
git commit -m "feat(store): add mobile ImageLightbox with swipe nav and drag-to-dismiss"
```

---

## Task 6: Configure Sonner Toaster style

**Files:**
- Modify: `frontend/src/main.jsx`

- [ ] **Step 1: Read the current main.jsx**

Run:
```bash
cat frontend/src/main.jsx
```

Note where `<Toaster />` is mounted (or whether it's mounted at all — check by searching).

- [ ] **Step 2: Search for Toaster mount location**

Run:
```bash
grep -rn "Toaster" frontend/src
```

The Toaster is most likely in `main.jsx` or `App.jsx`. Open whichever file has it.

- [ ] **Step 3: Apply the boutique toast style**

Replace the existing `<Toaster ... />` line with:

```jsx
<Toaster
  position="top-center"
  toastOptions={{
    className: 'font-serif border border-border bg-background text-foreground',
    duration: 2500,
  }}
/>
```

If the file imports Toaster from `sonner`, that import stays. If `Toaster` was not previously imported, add: `import { Toaster } from 'sonner';`

- [ ] **Step 4: Visual verification**

In dev tools console with the page loaded, run:
```js
import('sonner').then(({ toast }) => toast.success('Boutique toast'));
```

A toast appears top-center, cream background, Cormorant Garamond title, sharp corners with a hairline border. Confirm.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/main.jsx
# include App.jsx in add if Toaster lives there instead
git commit -m "feat(toast): style Sonner toaster with boutique cream/serif"
```

---

## Task 7: PDP — refine page entrance + image arrival

**Files:**
- Modify: `frontend/src/pages/store/ProductDetailPage.jsx`

- [ ] **Step 1: Add import for springs**

At the top of the file, add to the imports block:

```jsx
import { springs } from '@/lib/motion';
```

- [ ] **Step 2: Lengthen the page entrance**

Find the outer `<motion.div>` near line 230:

```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4 }}
  className="container-store pt-4 sm:pt-6 pb-10 sm:pb-14"
>
```

Replace the `transition` prop:

```jsx
transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
```

(The cubic-bezier values match the `boutique-out` token; we pass them inline because framer-motion's `ease` array takes raw numbers, not Tailwind tokens.)

- [ ] **Step 3: Add image arrival animation**

Find the image gallery wrapper `<div className="space-y-3">` (around line 263). Wrap its content in a `motion.div` with a soft arrival:

Change:
```jsx
{/* ── Image Gallery ─────────────────────── */}
<div className="space-y-3">
```

To:
```jsx
{/* ── Image Gallery ─────────────────────── */}
<motion.div
  className="space-y-3"
  initial={{ opacity: 0, scale: 0.985 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={springs.arrival}
>
```

And ensure the closing tag at the matching position changes from `</div>` to `</motion.div>`. (The block ends right before `{/* ── Product Info ──────────────────────── */}`.)

- [ ] **Step 4: Slow the info column stagger start**

Find the info column stagger config (line ~378-381):

```jsx
variants={{
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
}}
```

Change `delayChildren: 0.12` to `delayChildren: 0.22`:

```jsx
variants={{
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.22 } },
}}
```

- [ ] **Step 5: Visual verification**

In the browser, navigate `/products` → click any product. Watch the PDP arrive:
1. Page wrapper fades in over ~500ms with `boutique-out` curve
2. Image lifts in subtly (98.5% → 100% scale + opacity, spring)
3. Info column children start ~220ms later, stagger 80ms each
4. Total entrance feels deliberate, not rushed

If it feels too slow on repeat visits, this is a tuning concern noted in the spec — leave as-is for now.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/store/ProductDetailPage.jsx
git commit -m "feat(pdp): lengthen page entrance and add image arrival spring"
```

---

## Task 8: PDP — add editorial image counter

**Files:**
- Modify: `frontend/src/pages/store/ProductDetailPage.jsx`

- [ ] **Step 1: Add the counter inside the main image wrapper**

Find the gallery's main image container `<div className="group relative aspect-[4/5] overflow-hidden select-none" ...>` (around line 264). Right after the `style={{ background: ... }}` opening, **before** the `{activeImages.length === 0 ? ...` ternary, insert:

```jsx
{activeImages.length > 1 && (
  <div
    aria-live="polite"
    className="absolute top-3 right-3 z-10 text-[10px] tracking-[0.3em] uppercase text-foreground/45 font-medium tabular-nums select-none pointer-events-none bg-background/70 backdrop-blur-[2px] px-2 py-1"
  >
    {String(activeImgIndex + 1).padStart(2, '0')} / {String(activeImages.length).padStart(2, '0')}
  </div>
)}
```

The semi-transparent cream background ensures legibility over any photo. The `pointer-events-none` keeps swipe gestures unaffected.

- [ ] **Step 2: Visual verification**

Open a product that has multiple images (any product with variants — e.g., Moonlit Cascade Bracelet). The counter `01 / 03` (or similar) sits top-right in tracked uppercase, legible over any image. Tapping arrow / dot indicator updates the count. Counter disappears for single-image products.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/store/ProductDetailPage.jsx
git commit -m "feat(pdp): add editorial image counter to gallery"
```

---

## Task 9: PDP — thumbnail strip with `layoutId` active indicator

**Files:**
- Modify: `frontend/src/pages/store/ProductDetailPage.jsx`

- [ ] **Step 1: Locate the thumbnail strip**

It begins around line 357:

```jsx
{hasMultiple && (
  <div className="flex gap-2 overflow-x-auto pb-0.5">
    {activeImages.map((img, i) => (
      <button key={img} onClick={() => setActiveImgIndex(i)}
        className={cn(
          'h-[68px] w-[68px] flex-shrink-0 overflow-hidden border transition-all duration-200',
          i === activeImgIndex
            ? 'border-foreground opacity-100'
            : 'border-transparent opacity-40 hover:opacity-70'
        )}>
        <img src={getCloudinaryThumb(img, 120)} alt="" className="w-full h-full object-cover" draggable={false} />
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 2: Replace it with a layoutId-driven active outline**

Replace the entire `{hasMultiple && (...)} ` block with:

```jsx
{hasMultiple && (
  <div className="flex gap-2 overflow-x-auto overflow-y-visible pb-1 pt-1">
    {activeImages.map((img, i) => (
      <button
        key={img}
        type="button"
        onClick={() => setActiveImgIndex(i)}
        aria-label={`Show image ${i + 1}`}
        className="relative h-[68px] w-[68px] flex-shrink-0 active:scale-[0.96] transition-transform duration-100 focus-boutique"
      >
        {i === activeImgIndex && (
          <motion.span
            layoutId="gallery-active-thumb"
            aria-hidden="true"
            className="absolute -inset-[2px] border border-foreground pointer-events-none z-10"
            transition={springs.soft}
          />
        )}
        <img
          src={getCloudinaryThumb(img, 120)}
          alt=""
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            i === activeImgIndex ? 'opacity-100' : 'opacity-50 hover:opacity-80'
          )}
          draggable={false}
        />
      </button>
    ))}
  </div>
)}
```

Notes:
- `overflow-y-visible` is required so the `-inset-[2px]` outline is not clipped at the top/bottom edges. The horizontal `overflow-x-auto` is preserved.
- The active indicator is a single shared `layoutId="gallery-active-thumb"` motion span that slides between thumbnails on selection — same family as the variant pill.
- Each button gets `focus-boutique` for keyboard accessibility and `active:scale-[0.96]` for tactile press.

- [ ] **Step 3: Visual verification**

Multi-image product PDP. Tap a different thumbnail — the hairline outline slides from old to new with a soft spring. Tapping the same thumbnail does nothing. Active opacity contrast with inactive thumbs (100% vs 50%) is visible.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/store/ProductDetailPage.jsx
git commit -m "feat(pdp): thumbnail strip with layoutId active indicator and tactile press"
```

---

## Task 10: PDP — wire mobile lightbox

**Files:**
- Modify: `frontend/src/pages/store/ProductDetailPage.jsx`

- [ ] **Step 1: Import the lightbox**

Add to the imports:

```jsx
import { ImageLightbox } from '@/components/store/ImageLightbox';
```

- [ ] **Step 2: Add lightbox state**

Inside the `ProductDetailPage` component near the other `useState`s (around line 57-63), add:

```jsx
const [lightboxOpen, setLightboxOpen] = useState(false);
```

- [ ] **Step 3: Make the main image tappable on mobile**

Find the main image's `<motion.img>` (line 278-289). Wrap it in a button on mobile only — but the cleanest approach is to attach an `onClick` to the parent gallery container and gate by viewport width.

Add an `onClick` handler to the `<div className="group relative aspect-[4/5] ...">` (around line 264):

```jsx
<div
  className="group relative aspect-[4/5] overflow-hidden select-none sm:cursor-default cursor-zoom-in"
  style={{ background: 'hsl(34, 38%, 93%)' }}
  onTouchStart={onTouchStart}
  onTouchEnd={onTouchEnd}
  onClick={(e) => {
    // Mobile-only tap-to-zoom. Skip if user clicked an internal control (arrow / dot indicator).
    if (e.target.closest('button')) return;
    if (window.matchMedia('(hover: none)').matches && activeImages.length > 0) {
      setLightboxOpen(true);
    }
  }}
>
```

The `e.target.closest('button')` guard prevents the prev/next arrows and dot indicators from opening the lightbox.

- [ ] **Step 4: Render the lightbox**

Just before the page wrapper's closing `</motion.div>` (near the very bottom of `ProductDetailPage`, after the `<style>` block and before the closing `</motion.div>`), add:

```jsx
<ImageLightbox
  open={lightboxOpen}
  images={activeImages}
  activeIndex={activeImgIndex}
  onChange={setActiveImgIndex}
  onClose={() => setLightboxOpen(false)}
/>
```

- [ ] **Step 5: Visual verification (mobile emulation)**

In Chrome DevTools, toggle device toolbar to an iPhone preset. Reload PDP, tap the main image. Lightbox slides up, image fits screen. Swipe horizontally — image changes. Swipe down or tap backdrop — lightbox closes. ESC also closes (test on desktop with device toolbar off using `hover: none` overridden temporarily).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/store/ProductDetailPage.jsx
git commit -m "feat(pdp): wire mobile lightbox with tap-to-open on gallery image"
```

---

## Task 11: PDP — variant pill swatch dot + tactile press

**Files:**
- Modify: `frontend/src/pages/store/ProductDetailPage.jsx`

- [ ] **Step 1: Import the Swatch component**

Add to imports:

```jsx
import { Swatch } from '@/components/store/Swatch';
```

- [ ] **Step 2: Locate the variant pill button**

It is the `<button>` inside `displayVariants.map(...)` (around line 424-447).

- [ ] **Step 3: Add Swatch and active:scale**

Replace the button's `className` and inner content. The full new pill should be:

```jsx
<button
  key={v.originalIndex}
  type="button"
  onClick={() => selectVariant(v.originalIndex)}
  className={cn(
    'relative flex-shrink-0 h-9 px-4 border text-xs font-light whitespace-nowrap overflow-hidden',
    'transition-colors duration-300 ease-boutique active:scale-[0.96] focus-boutique',
    isOos
      ? isSelected
        ? 'border-red-500 bg-red-50 text-red-600'
        : 'border-red-300 bg-red-50/60 text-red-500 hover:border-red-500 hover:text-red-600'
      : isSelected
        ? 'border-foreground text-foreground'
        : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground'
  )}
>
  {isSelected && !isOos && (
    <motion.span
      layoutId="variant-active-bg"
      className="absolute inset-0 bg-muted/30"
      transition={springs.soft}
    />
  )}
  <span className="relative z-10 inline-flex items-center gap-2">
    <Swatch color={v.color} />
    {v.color}
  </span>
</button>
```

Changes vs. current:
- `transition-colors duration-300 ease-boutique` (was `duration-200` linear)
- `active:scale-[0.96]` for tactile press
- `focus-boutique` for keyboard accessibility
- `<Swatch color={v.color} />` rendered before the color name
- Active background uses `springs.soft` (imported in Task 7)

- [ ] **Step 4: Visual verification**

Open a product with variants (e.g., Moonlit Cascade Bracelet — Gold / Rose Gold / Silver). Each pill shows a small gradient dot left of the color name. Tapping a pill compresses it briefly, the muted background slides via spring to the new selection, color label transitions. Out-of-stock variants keep red styling but still get the swatch dot.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/store/ProductDetailPage.jsx
git commit -m "feat(pdp): add color swatch dot and tactile press to variant pills"
```

---

## Task 12: PDP — price lift animation

**Files:**
- Modify: `frontend/src/pages/store/ProductDetailPage.jsx`

- [ ] **Step 1: Locate the price AnimatePresence**

Around line 396-407:

```jsx
<AnimatePresence mode="wait">
  <motion.p
    key={activePrice}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
    className="text-[1.2rem] sm:text-[2.4rem] font-bold leading-none tracking-tight"
  >
    {formatPrice(activePrice)}
  </motion.p>
</AnimatePresence>
```

- [ ] **Step 2: Replace with spring lift**

Change to:

```jsx
<AnimatePresence mode="wait">
  <motion.p
    key={activePrice}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={springs.crisp}
    className="text-[1.2rem] sm:text-[2.4rem] font-bold leading-none tracking-tight"
  >
    {formatPrice(activePrice)}
  </motion.p>
</AnimatePresence>
```

- [ ] **Step 3: Visual verification**

Open a product with priced variants (variants with different prices, like Crystal Stream Bracelet — Silver ₹1,299 / Rose Gold ₹1,349). Tap between variants — the price lifts upward then settles, then on next switch lifts upward again. Feels responsive, not slow.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/store/ProductDetailPage.jsx
git commit -m "feat(pdp): replace price crossfade with spring lift on variant switch"
```

---

## Task 13: PDP — desktop hover lift on main image

**Files:**
- Modify: `frontend/src/pages/store/ProductDetailPage.jsx`

- [ ] **Step 1: Locate the gallery `<motion.img>`**

Around line 278-289. The container `<div>` already uses the `group` Tailwind utility, so we add `group-hover:*` classes to the image.

- [ ] **Step 2: Add the hover treatment**

Change the image's `className` from:

```jsx
className="w-full h-full object-cover object-center pointer-events-none"
```

to:

```jsx
className="w-full h-full object-cover object-center pointer-events-none transition-[transform,filter] duration-[600ms] ease-boutique sm:group-hover:scale-[1.02] sm:group-hover:brightness-105 sm:group-hover:saturate-[1.12]"
```

The `sm:` prefix limits the effect to viewports where hover is meaningful (≥640px). Mobile is unaffected.

- [ ] **Step 3: Visual verification (desktop)**

Hover over the main image on desktop (≥640px). It lifts subtly — 2% scale, slight warmth — over 600ms. Move mouse away — settles back. On mobile (DevTools device toolbar), no change on touch (lightbox already handles that case).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/store/ProductDetailPage.jsx
git commit -m "feat(pdp): add subtle hover lift to main gallery image on desktop"
```

---

## Task 14: WhatsApp modal — product summary with thumbnail

**Files:**
- Modify: `frontend/src/pages/store/ProductDetailPage.jsx`
- Modify: `frontend/src/components/store/WhatsAppButton.jsx`

- [ ] **Step 1: Pass the thumbnail URL from PDP**

In `ProductDetailPage.jsx`, find the `<WhatsAppButton ... />` invocation (around line 486-494). Add a `productImage` prop. The thumbnail should match what's currently selected (variant image if applicable):

```jsx
<WhatsAppButton
  phoneNumber={phoneNumber}
  productName={hasVariants && selectedVariant !== null
    ? `${product.name} (${variants[selectedVariant].color})`
    : product.name}
  productCode={product.productCode}
  price={formatPrice(activePrice)}
  productImage={activeImages[0]}
  disabled={false}
/>
```

- [ ] **Step 2: Accept the prop in WhatsAppButton**

In `frontend/src/components/store/WhatsAppButton.jsx`, change the component signature:

```jsx
export const WhatsAppButton = ({ phoneNumber, productName, productCode, price, productImage, disabled = false }) => {
```

- [ ] **Step 3: Add the thumbnail to the summary card**

Locate the existing summary block (around line 172-180):

```jsx
<div className="bg-muted/30 border border-border/40 px-4 py-3 flex items-center gap-3">
  <MessageCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
  <div className="min-w-0">
    <p className="text-sm font-medium truncate">{productName}</p>
    <p className="text-[10px] text-muted-foreground/45 mt-0.5">
      {[productCode, price].filter(Boolean).join(' · ')}
    </p>
  </div>
</div>
```

Replace with:

```jsx
<div className="bg-muted/30 border border-border/40 px-3 py-3 flex items-center gap-3">
  {productImage ? (
    <img
      src={productImage}
      alt=""
      className="h-12 w-12 object-cover shrink-0 border border-border/40"
      draggable={false}
    />
  ) : (
    <MessageCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" strokeWidth={1.5} />
  )}
  <div className="min-w-0">
    <p className="text-sm font-medium truncate">{productName}</p>
    <p className="text-[10px] text-muted-foreground/45 mt-0.5">
      {[productCode, price].filter(Boolean).join(' · ')}
    </p>
  </div>
</div>
```

Note: `productImage` is the raw Cloudinary URL. We pass it through `<img src>` directly because the modal context already loads small enough. If perf becomes a concern later, swap to `getCloudinaryThumb(productImage, 96)` and import the helper — for now keep it simple.

- [ ] **Step 4: Visual verification**

Open WhatsApp modal. Top of the modal shows a 48×48 thumbnail of the current product's first image (or the variant's first image if a variant is selected) next to the name and code · price line. Verify both single-image products and variant products work.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/store/ProductDetailPage.jsx frontend/src/components/store/WhatsAppButton.jsx
git commit -m "feat(whatsapp): add product thumbnail to modal summary card"
```

---

## Task 15: WhatsApp modal — input focus thickening

**Files:**
- Modify: `frontend/src/components/store/WhatsAppButton.jsx`

- [ ] **Step 1: Update the shared `inputCls`**

Find the `inputCls` constant (line ~18-19):

```js
const inputCls =
  'w-full h-10 bg-transparent border-b border-border text-sm px-0 placeholder:text-muted-foreground/55 focus:outline-none focus:border-foreground transition-colors duration-200';
```

Replace with:

```js
const inputCls =
  'w-full h-11 bg-transparent border-b border-border text-sm px-0 placeholder:text-muted-foreground/55 ' +
  'focus:outline-none focus:border-foreground/70 focus:shadow-[inset_0_-1px_0_hsl(var(--foreground)/0.6)] ' +
  'transition-[border-color,box-shadow] duration-300 ease-boutique';
```

Changes:
- Height bumped from `h-10` to `h-11` (40px → 44px, hits min tap target)
- Focus adds an inset shadow that visually thickens the bottom border (1px → effectively 2px) without layout shift
- Transition extended to 300ms with `boutique` easing — pen-line being drawn under the field

- [ ] **Step 2: Visual verification**

Open WhatsApp modal. Click into any field. The bottom border thickens smoothly over ~300ms — it does not snap. Cycle through fields with Tab — same behavior. Click out — border returns to hairline.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/store/WhatsAppButton.jsx
git commit -m "feat(whatsapp): refine input focus with smooth bottom-border thickening"
```

---

## Task 16: WhatsApp modal — submit "Opening WhatsApp…" toast

**Files:**
- Modify: `frontend/src/components/store/WhatsAppButton.jsx`

- [ ] **Step 1: Import toast**

At the top of `WhatsAppButton.jsx`, add:

```jsx
import { toast } from 'sonner';
```

- [ ] **Step 2: Update handleSubmit**

Find `handleSubmit` (around line 64). The current end of the function does the `window.open` immediately. Replace the function body with:

```jsx
const handleSubmit = (e) => {
  e.preventDefault();
  if (!validate()) return;

  const productUrl = window.location.href;
  const addressLine2 = [form.district.trim(), form.state.trim()].filter(Boolean).join(', ');

  const lines = [
    `Hello 👋`,
    `I'm interested in this product.`,
    ``,
    `*Product:* ${productName}`,
    productCode ? `*Code:* ${productCode}` : null,
    price ? `*Price:* ${price}` : null,
    ``,
    `*Product Link:*`,
    productUrl,
    ``,
    `*Customer Details*`,
    `Name: ${form.fullName.trim()}`,
    `Phone: ${form.phone.trim()}`,
    form.altPhone.trim() ? `Alt. Phone: ${form.altPhone.trim()}` : null,
    ``,
    `Address:`,
    `${form.houseName.trim()}, ${form.street.trim()}`,
    form.landmark.trim() ? `Near ${form.landmark.trim()}` : null,
    `${form.city.trim()} - ${form.pincode.trim()}`,
    addressLine2,
    ``,
    `Please share more details 😊`,
  ].filter((l) => l !== null);

  const msg = encodeURIComponent(lines.join('\n'));
  const number = (phoneNumber || '').replace(/\D/g, '');
  const href = number ? `https://wa.me/${number}?text=${msg}` : `https://wa.me/?text=${msg}`;

  toast.success('Opening WhatsApp…');

  // Brief acknowledgement window before redirecting, so the customer
  // perceives the action started before WhatsApp takes focus away.
  setTimeout(() => {
    window.open(href, '_blank', 'noopener,noreferrer');
    setOpen(false);
    setForm(EMPTY);
    setErrors({});
  }, 320);
};
```

Important: the WhatsApp message body (`lines` array) is unchanged from the existing version — only the closing flow adds a toast and 320ms delay.

- [ ] **Step 2 — sanity check**

Confirm the WhatsApp message format is byte-identical to what was there before. The "Never put URL and label on same line" CLAUDE.md rule is respected (URL is alone on its own line after `*Product Link:*`).

- [ ] **Step 3: Visual verification**

Fill in the modal with valid data (any test values) and submit. Sequence:
1. Toast appears top-center: "Opening WhatsApp…" in Cormorant serif
2. ~300ms later, new tab opens to WhatsApp with the pre-filled message
3. Modal closes via its existing slide-down animation

The pre-filled WhatsApp message is byte-identical to before. Confirm by reading the URL params or the WhatsApp draft.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/store/WhatsAppButton.jsx
git commit -m "feat(whatsapp): show 'Opening WhatsApp…' toast before redirect on submit"
```

---

## Task 17: PDP — demand button tactile press + success toast

**Files:**
- Modify: `frontend/src/pages/store/ProductDetailPage.jsx`

- [ ] **Step 1: Import toast**

Add to imports:

```jsx
import { toast } from 'sonner';
```

(Skip if already imported by an earlier task.)

- [ ] **Step 2: Add success toast in handleDemand**

Find `handleDemand` (around line 155-173). In both `onSuccess` callbacks, add a `toast.success` call. The full updated function:

```jsx
const handleDemand = () => {
  if (hasDemanded || registerDemand.isPending || registerVariantDemand.isPending) return;
  if (hasVariants && selectedVariant !== null && variants[selectedVariant]?.id) {
    const variantId = variants[selectedVariant].id;
    registerVariantDemand.mutate({ productId: product.id, variantId }, {
      onSuccess: () => {
        localStorage.setItem(`demanded_${product.id}_${variantId}`, '1');
        setHasDemanded(true);
        toast.success("We'll let you know when it's back.");
      },
    });
  } else {
    registerDemand.mutate(product.id, {
      onSuccess: () => {
        localStorage.setItem(`demanded_${product.id}`, '1');
        setHasDemanded(true);
        toast.success("We'll let you know when it's back.");
      },
    });
  }
};
```

- [ ] **Step 3: Confirm the demand button already has `active:scale-[0.98]`**

Run:
```bash
grep -n "active:scale-\[0.98\]" frontend/src/pages/store/ProductDetailPage.jsx
```

It should appear in the demand button class (around line 508). If absent, add `active:scale-[0.97]` to the button's className alongside the other classes. (Existing `0.98` is acceptable — leave as-is if present.)

- [ ] **Step 4: Visual verification**

Find an out-of-stock variant (e.g., Midnight Bead Bracelet — `inStock: false` in seed data). The "I'm Interested" button appears. Tap it — button compresses briefly, the toast "We'll let you know when it's back." appears top-center in Cormorant. Button transitions to "Interest Noted ✓".

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/store/ProductDetailPage.jsx
git commit -m "feat(pdp): add success toast to demand registration"
```

---

## Task 18: Final cross-page visual verification

**Files:**
- No file changes. Verification only.

This task ensures the whole sweep reads as a coherent premium upgrade. Tick every box.

- [ ] **Step 1: Cold reload check**

Hard refresh (`Ctrl+Shift+R`). Navigate to `/products` → click any product. Observe:

- [ ] Page entrance feels deliberate (~1.0–1.2s), image arrives first then info column composes
- [ ] No layout shift on image load
- [ ] No console errors

- [ ] **Step 2: Gallery check (multi-image product)**

Open a product with 3+ images (e.g., Twisted Vine Bracelet has 2 images, Pearl Station Bracelet has 2 — find one with more, or any product with variants where each variant has multiple images).

- [ ] Counter `0X / 0Y` visible top-right of main image
- [ ] Thumbnail strip below shows all images
- [ ] Tapping a thumbnail: hairline outline slides via spring to the new one, main image crossfades
- [ ] Desktop hover on main image lifts subtly over 600ms
- [ ] Tapping main image (mobile DevTools emulation) opens the lightbox; swipe down dismisses; swipe horizontally changes image

- [ ] **Step 3: Variant check**

Open a product with priced variants (e.g., Moonlit Cascade Bracelet — Gold ₹799 / Rose Gold ₹849 / Silver ₹749).

- [ ] Each pill has a colored swatch dot left of the color name
- [ ] Tapping a pill: pill compresses (~0.96 scale), spring background slides, price lifts upward then settles in its new value
- [ ] Main gallery image cross-dissolves to the new variant's first image

- [ ] **Step 4: WhatsApp modal check**

Tap the WhatsApp button.

- [ ] Modal slides up on mobile / springs in on desktop with backdrop fade
- [ ] Product summary card at top shows a 48×48 thumbnail + name + code · price
- [ ] Two labeled sections ("Contact" and "Delivery Address") with a hairline divider
- [ ] Clicking any input: bottom border smoothly thickens over ~300ms
- [ ] Submitting valid data: "Opening WhatsApp…" toast appears in cream serif, ~320ms later new tab opens with the pre-filled message; modal closes
- [ ] WhatsApp draft message is byte-identical to before this sweep

- [ ] **Step 5: Out-of-stock demand check**

Find an out-of-stock product or variant. Tap "I'm Interested".

- [ ] Button compresses briefly
- [ ] "We'll let you know when it's back." toast appears
- [ ] Button text changes to "Interest Noted ✓"
- [ ] Refresh — button still shows "Interest Noted ✓" (localStorage persistence)

- [ ] **Step 6: Reduced-motion check**

In Chrome DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-motion" → Reduce.

- [ ] Reload PDP. Animations are visibly tamer / skipped (framer-motion respects this by default). Functionality unaffected.

- [ ] **Step 7: Production build check**

```bash
cd frontend && npm run build
```

Expected: build succeeds with no errors. Bundle size delta vs main is ≤ +5KB gzipped (we added ~50 lines of JS plus the lightbox, no new deps).

- [ ] **Step 8: Bundle size sanity**

Run:
```bash
cd frontend && du -sh dist/assets/*.js | sort -h | tail -3
```

Compare against the prior build (if available). If the total has grown by more than 10KB, something unexpected was added — investigate before merging.

- [ ] **Step 9: Final commit**

If any minor tweaks emerged during verification (e.g., a typo, a one-class miss), commit them now under a small fix commit. If nothing surfaced, no commit needed for this task.

- [ ] **Step 10: Plan complete**

Verify the file `docs/superpowers/specs/2026-05-21-pdp-whatsapp-premium-design.md` Section 11 "Acceptance criteria" reads truthful against the working app. Tick each item mentally. If any criterion fails, return to the relevant task and patch.

---

## Self-review (done before delivery)

**Spec coverage check:**

| Spec section | Covered by task(s) |
|---|---|
| §3 Design tokens — easing curves | Task 1 |
| §3 Design tokens — spring presets | Task 3 |
| §3 Design tokens — focus ring | Task 2 |
| §4 PDP entrance choreography | Task 7 |
| §5 Gallery — counter | Task 8 |
| §5 Gallery — thumbnail strip layoutId | Task 9 |
| §5 Gallery — desktop hover lift | Task 13 |
| §5 Gallery — mobile lightbox | Tasks 5, 10 |
| §5 Gallery — LQIP blur-up | (already exists in code — verified during context reading; no new task) |
| §5 Gallery — swipe nav | (already exists; preserved) |
| §6 Variants — swatch dots | Tasks 4, 11 |
| §6 Variants — tactile press | Task 11 |
| §6 Variants — price lift | Task 12 |
| §6 Variants — image cross-dissolve | (already exists; preserved) |
| §7 WhatsApp modal — product summary | Task 14 |
| §7 WhatsApp modal — section grouping | (already exists as "Contact" / "Delivery Address"; preserved — relabeling deemed unnecessary cosmetic; spec acceptance reads truthful with existing labels) |
| §7 WhatsApp modal — input focus thickening | Task 15 |
| §7 WhatsApp modal — submit toast | Task 16 |
| §7 WhatsApp modal — entrance timing | (existing keyframes preserved; spring timing deemed acceptable as-is) |
| §7 Out-of-stock — demand button toast + press | Task 17 |
| §8 Cross-cutting — `active:scale` on buttons | Tasks 9, 11, 17 (each button touched gets it) |
| §8 Cross-cutting — focus-boutique ring | Tasks 2, 9, 11 |
| §8 Cross-cutting — Sonner toast styling | Task 6 |
| §11 Acceptance criteria | Task 18 walks all 15 items |

**Placeholder scan:** No TBD / TODO / "similar to" remained. Every task shows the exact code to write. Every verification step lists a concrete navigation and observation.

**Type / API consistency:**
- `springs` imported the same way (`from '@/lib/motion'`) in all tasks that use it
- `Swatch` component takes a single `color` prop in Tasks 4 and 11
- `ImageLightbox` props (`open`, `images`, `activeIndex`, `onChange`, `onClose`) match between Task 5 (definition) and Task 10 (consumption)
- `WhatsAppButton` `productImage` prop added in Task 14 to both the consumer (PDP) and the component itself — names match

**Note for the executor:** A couple of spec items intentionally remain unchanged because the existing code already satisfies them well (LQIP placeholder behavior, section grouping labels, modal entrance keyframes). These are called out in the coverage table above. If a future review wants them altered, that is a follow-up patch, not a regression.

---

## Plan complete

Saved to: `docs/superpowers/plans/2026-05-21-pdp-whatsapp-premium.md`
