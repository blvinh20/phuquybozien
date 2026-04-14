## Creative North Star

**"Curator"** - High-end travel editorial inspired raw volcanic beauty and crystalline waters. Rejects boxed web design for **Organic Asymmetry** and **Tonal Depth**.

---

## 1. Colors & Visual Soul

### Core Palette
- **Primary** `#00556f` - Deep emerald sea (reflects ocean depths)
- **Secondary** `#9b4500` - Volcanic rock
- **Tertiary** `#6e5d00` - Sun-drenched sands

### Surface Hierarchy
- **Level 0 (Foundation):** `surface` = `#fbf9f1` (warm sand)
- **Level 1 (The Page):** `surface-container-low` = `#f5f4ec`
- **Level 2 (The Inset):** `surface-container` / `surface-container-high`
- **Level 3 (The Focus):** `surface-container-lowest` = `#ffffff` (brilliant white)

### The "No-Line" Rule
- **1px solid borders STRICTLY PROHIBITED** for sectioning
- Use background shifts and tonal transitions instead

### The "Glass & Gradient" Rule
- Glassmorphism: `surface` at 80% opacity + `24px` backdrop-blur
- Signature gradient: `primary` → `primary-container` (#0f6f8e) for hero CTAs

---

## 2. Typography

### Font Stack
- **Display + Headlines (Newsreader):** Classical elegance, editorial voice
  - Hero titles with generous letter-spacing (-0.02em)
- **Titles + Body (Manrope):** Modern workhorse, clean contrast
- **Labels (Plus Jakarta Sans):** Technical metadata, architectural feel

### Hierarchy
- Display-lg for heroes with ample white space before body text
- High contrast between headline sizes and body

---

## 3. Elevation & Depth

### The Layering Principle
- Achieve "lift" by placing `surface-container-lowest` on `surface-container-low`
- Avoid shadows where possible
- Floating elements: diffuse shadow `0px 20px 40px rgba(27, 28, 23, 0.06)`

### The "Ghost Border" Fallback
- Complex backgrounds: `1px` border of `outline-variant` at **15% opacity**
- Never use 100% opaque borders

---

## 4. Components

### Buttons
- **Primary:** Solid `#00556f` with white text, `0.25rem` rounding
- **Secondary:** Glass-style, `surface-variant` 40% opacity + backdrop blur
- **Tertiary:** All-caps with custom 2px underline in `secondary-container`

### Cards & Lists
- No horizontal dividers - use vertical spacing (24px gaps)
- Images: aspect ratio 4:5 or 2:3 (vertical magazine portraiture)
- Captions: Newsreader italic

### Input Fields
- No enclosing box - bottom-only border ("Ghost Border" at 20% opacity)
- On focus: border transitions to `primary` with subtle glow

---

## 5. Do's and Don'ts

### Do:
- Use intentional asymmetry
- Leverage large "Ink-Trap" whitespace
- Use `secondary` sparingly as "heat" accent

### Don't:
- Don't use standard 8px/16px border-radii - keep corners sharp (0.25rem) or fully round
- Don't use pure black (#000000) - use `on-surface` (#1b1c17)
- Don't use drop shadows on buttons - let color and typography provide hierarchy

---

## 6. Accessibility
- Newsreader serif: maintain 4.5:1 contrast minimum
- Touch targets: minimum 44x44pt
- Motion: "Soft Easing" (cubic-bezier 0.4, 0, 0.2, 1) - gentle water flow