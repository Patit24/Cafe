---
name: Kinetic Ops
colors:
  surface: '#faf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#faf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e8'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#44474c'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#74777d'
  outline-variant: '#c4c6cd'
  surface-tint: '#4f6073'
  primary: '#041627'
  on-primary: '#ffffff'
  primary-container: '#1a2b3c'
  on-primary-container: '#8192a7'
  inverse-primary: '#b7c8de'
  secondary: '#006492'
  on-secondary: '#ffffff'
  secondary-container: '#58bcfd'
  on-secondary-container: '#004a6d'
  tertiary: '#261000'
  on-tertiary: '#ffffff'
  tertiary-container: '#432100'
  on-tertiary-container: '#d07d30'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4fb'
  primary-fixed-dim: '#b7c8de'
  on-primary-fixed: '#0b1d2d'
  on-primary-fixed-variant: '#38485a'
  secondary-fixed: '#cae6ff'
  secondary-fixed-dim: '#8ccdff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004b6f'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#faf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  touch-target-min: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style

The design system is engineered for the high-velocity environment of modern hospitality workforce management. The brand personality is **authoritative, reliable, and frictionless**, prioritizing utility over decorative flair to ensure staff can perform critical actions—like clocking in or checking schedules—without cognitive load.

The visual style is **Corporate / Modern Minimalism**. It utilizes a "Utility-First" aesthetic characterized by high-contrast functional areas, rigorous grid alignment, and a focus on legibility under harsh kitchen lighting or on mobile devices. The emotional response is one of calm efficiency and structural clarity, reducing the stress associated with shift management and compliance.

## Colors

The color palette is strictly functional, mapping specific hues to operational states to facilitate "at-a-glance" comprehension.

- **Primary (#1A2B3C):** Used for global navigation, primary command buttons, and structural headers. It establishes the "Professional Deep Navy" foundation.
- **Success/Active (#2D9CDB):** A vibrant blue-leaning green used exclusively for active duty status and "start" actions.
- **Warning/Break (#F2994A):** An energetic orange used for staff on breaks or pending shift swaps.
- **Neutral/Inactive (#828282):** A balanced gray for off-duty staff, secondary information, and disabled states.
- **Background (#FFFFFF):** A clean, sterile white to ensure maximum contrast for text and status indicators.

## Typography

The design system utilizes **Inter** for its exceptional legibility and high x-height, which remains readable even at small sizes or on low-resolution tablets. 

Hierarchy is established through weight and scale. Large `Display` and `Headline` roles are used for time-clocks and primary metrics. `Body-lg` is the default for most data entries to ensure accessibility in fast-paced environments. All labels use a slightly heavier weight (`600`) to differentiate metadata from user content.

## Layout & Spacing

This design system employs a **Fluid Grid** model with a hard 8px base unit. This ensures all touch targets and spacing are mathematically consistent.

- **Mobile/Tablet:** A 4 or 8 column grid with 16px margins. Primary focus is on single-column stacks for attendance actions.
- **Desktop:** A 12-column grid with 32px margins for administrative dashboards and scheduling.
- **Touch Targets:** A strict minimum of 48x48px for all interactive elements to accommodate gloved or wet fingers in a kitchen environment.
- **Density:** We utilize "Generous Whitespace" to prevent accidental taps and to visually separate distinct employee records.

## Elevation & Depth

To maintain a clean, professional aesthetic, this design system uses **Tonal Layers** combined with **Low-Contrast Outlines**.

1.  **Level 0 (Base):** Pure White (#FFFFFF) background.
2.  **Level 1 (Cards):** A subtle 1px border (#E0E0E0) with a very soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.05)) to lift shift cards from the background.
3.  **Level 2 (Modals/Overlays):** Increased shadow depth (0px 8px 24px rgba(0,0,0,0.1)) to focus attention on critical attendance actions like photo-capture or PIN entry.

Shadows are never pitch black; they are slightly tinted with the Primary Navy to maintain a sophisticated, cohesive appearance.

## Shapes

The design system uses a **Soft** shape language. This provides a professional look that is approachable yet structured.

- **Standard Elements (Buttons, Inputs):** 0.25rem (4px) corner radius.
- **Containers (Cards, Modals):** 0.5rem (8px) corner radius.
- **Status Indicators:** Fully rounded (pill-shaped) for small badges, but square with 4px radius for large-scale status blocks.

Sharp corners are avoided to reduce visual "harshness," while excessive rounding is avoided to maintain a serious, enterprise-grade feel.

## Components

- **Buttons:** Primary buttons use the Deep Navy background with white text. Attendance action buttons (Clock In/Out) are oversized (min 56px height) and utilize the Success/Active or Warning/Break colors to signal intent.
- **Data Cards:** Employee cards feature high-contrast typography. The employee's current status is indicated by a vertical 4px "status bar" on the left edge of the card, color-coded to the palette.
- **Attendance Actions:** Iconography (Camera, Clock, Exit) must be paired with text labels. Icons use a 2px stroke weight for clarity.
- **Input Fields:** Use a 1px Neutral Gray border that thickens to 2px Primary Navy on focus. Labels sit clearly above the field, never inside as placeholders.
- **Status Indicators:** Small, high-contrast badges used in list views to show "On Break," "Overtime," or "Late."
- **Real-time Indicators:** A pulsing dot or "Live" tag in Success Green for staff currently logged into the system.