# Quorvix Admin Design System

## Color System

### Neutral Colors

Our neutral palette provides the foundation for text, backgrounds, and UI elements with varying levels of opacity and contrast.

#### Black
- **100%** - `#1C1C1C` - Primary text, highest emphasis elements - `text-black-100` / `bg-black-100`
- **80%** - `#1C1C1CCC` - Secondary text, important UI elements - `text-black-80` / `bg-black-80`
- **40%** - `#1C1C1C66` - Tertiary text, disabled states - `text-black-40` / `bg-black-40`
- **20%** - `#1C1C1C33` - Borders, dividers - `border-black-20` / `bg-black-20`
- **10%** - `#1C1C1C1A` - Subtle backgrounds, hover states - `bg-black-10`
- **5%** - `#1C1C1C0D` - Page backgrounds, cards - `bg-black-5`

#### White
- **100%** - `#FFFFFF` - Primary backgrounds, cards - `text-white-100` / `bg-white-100`
- **80%** - `rgba(255, 255, 255, 0.8)` - Overlay backgrounds - `bg-white-80`
- **40%** - `rgba(255, 255, 255, 0.4)` - Glass morphism effects - `bg-white-40`
- **20%** - `rgba(255, 255, 255, 0.2)` - Subtle overlays - `bg-white-20`
- **10%** - `rgba(255, 255, 255, 0.1)` - Minimal overlays - `bg-white-10`
- **5%** - `rgba(255, 255, 255, 0.05)` - Barely visible overlays - `bg-white-5`

### Primary Colors

The primary color palette defines the main brand identity and is used for primary actions, links, and key interactive elements.

- **Brand Primary** - `#008B8B` (Teal) - Primary buttons, links, active states - `bg-brand-primary` / `text-brand-primary` / `border-brand-primary`
- **Brand Light** - `#D8F0F1` - Hover states, light backgrounds - `bg-brand-light`
- **Light Gray** - `#E8E8E8` - Neutral backgrounds - `bg-gray-light`
- **Medium Gray** - `#63626A` - Secondary text, icons - `text-gray-medium`

### Secondary Colors

Secondary colors provide variety for different UI states, categories, and contextual information.

- **Light Blue** - `#E5F1FF` - Info backgrounds, notifications - `bg-secondary-light-blue`
- **Slate Blue** - `#34C759` - Charts, data visualization - `bg-secondary-slate-blue`
- **Cream** - `#FFF7E5` - Warning backgrounds, alerts - `bg-secondary-cream`
- **Tan** - `#A4997D` - Neutral accents - `bg-secondary-tan`
- **Mint** - `#E1F8F0` - Success backgrounds - `bg-secondary-mint`
- **Sage** - `#81A196` - Subtle accents, secondary elements - `bg-secondary-sage`

### Semantic Colors

Semantic colors communicate status, feedback, and system states.

- **Success** - `#34C759` - Successful operations, confirmations - `text-success` / `bg-success` / `border-success`
- **Error** - `#F94E72` - Errors, destructive actions, alerts - `text-error` / `bg-error` / `border-error`

### Usage Guidelines

**Primary Color Usage:**
```tsx
// Primary button
<button className="bg-brand-primary text-white-100">Click Me</button>

// Active navigation
<a className="text-brand-primary border-b-2 border-brand-primary">Dashboard</a>

// Links
<a className="text-brand-primary hover:text-[#007070]">Learn More</a>
```

**Secondary Color Usage:**
```tsx
// Success badge
<span className="bg-secondary-mint text-success">Active</span>

// Info notification
<div className="bg-secondary-light-blue border-blue-500">Info message</div>
```

**Semantic Color Usage:**
```tsx
// Success message
<div className="text-success">✓ Saved successfully</div>

// Error message
<div className="text-error">✗ Something went wrong</div>
```

**Neutral Color Usage:**
```tsx
// Text hierarchy
<h1 className="text-black-100">Primary Heading</h1>
<p className="text-black-80">Body text</p>
<span className="text-black-40">Disabled text</span>

// Borders and dividers
<div className="border-b border-black-20"></div>
```

---

## Typography

### Font Family

**Gilroy** - Primary typeface for all text

**Tailwind Class:** `font-primary`

### Font Weights & Sizes

The typography system uses a combination of Regular and Semi-bold weights across multiple sizes to establish clear visual hierarchy.

| Size | Regular | Semi-bold | Tailwind Classes | Use Case |
|------|---------|-----------|------------------|----------|
| 48px | 48 Regular | **48 Semibold** | `text-xxl font-regular` / `text-xxl font-semibold` | Hero headlines, major section headers |
| 32px | 32 Regular | **32 Semi-bold** | `text-xl font-regular` / `text-xl font-semibold` | Page titles, primary headers |
| 24px | 24 Regular | **24 Semi-bold** | `text-lg font-regular` / `text-lg font-semibold` | Section headers, card titles |
| 18px | 18 Regular | **18 Semi-bold** | `text-md font-regular` / `text-md font-semibold` | Subsection headers, emphasized text |
| 14px | 14 Regular | **14 Semi-Bold** | `text-sm font-regular` / `text-sm font-semibold` | Body text, form labels |
| 12px | 12 Regular | **12 Semi-bold** | `text-xs font-regular` / `text-xs font-semibold` | Small text, captions, metadata |

### Typography Examples

```tsx
// Hero headline
<h1 className="text-xxl font-semibold text-black-100">Welcome to Quorvix</h1>

// Page title
<h2 className="text-xl font-semibold text-black-100">Dashboard Overview</h2>

// Section header
<h3 className="text-lg font-semibold text-black-100">Recent Activity</h3>

// Body text
<p className="text-sm font-regular text-black-80">
  This is body text with proper hierarchy.
</p>

// Caption
<span className="text-xs font-regular text-black-40">Last updated 2 hours ago</span>
```

### Typography Guidelines

- Use Semi-bold weights for headings and emphasized content
- Use Regular weights for body text and supporting information
- Maintain consistent hierarchy throughout the interface
- Ensure sufficient contrast with background colors (minimum 4.5:1 for body text)

---

## Layout System

The Quorvix Admin interface uses a simple, flexible 4x-based layout system for consistent spacing and alignment.

### Grid System
- **Base Unit:** 4px
- **Grid Columns:** Flexible based on content needs (use Tailwind's grid system)
- **Gutter:** 16px (4x) - `gap-md`

### Spacing Scale

All spacing values are multiples of 4:

| Value | Multiplier | Tailwind Class | Use Case |
|-------|------------|----------------|----------|
| 4px   | 1x         | `xs`           | Minimal spacing, tight gaps |
| 8px   | 2x         | `sm`           | Compact spacing, small padding |
| 16px  | 4x         | `md`           | Standard spacing, default gaps |
| 24px  | 6x         | `lg`           | Comfortable spacing, card padding |
| 32px  | 8x         | `xl`           | Generous spacing, section padding |
| 48px  | 12x        | `xxl`          | Section spacing, large margins |

### Spacing Examples

```tsx
// Padding
<div className="p-xs">4px padding</div>
<div className="p-sm">8px padding</div>
<div className="p-md">16px padding</div>
<div className="p-lg">24px padding</div>
<div className="p-xl">32px padding</div>
<div className="p-xxl">48px padding</div>

// Margin
<div className="m-md">16px margin</div>
<div className="mt-lg mb-md">24px top, 16px bottom</div>

// Gap (for flex/grid)
<div className="flex gap-md">16px gap between items</div>
<div className="grid grid-cols-3 gap-lg">24px gap</div>
```

### Corner Radius

| Value | Multiplier | Tailwind Class | Use Case |
|-------|------------|----------------|----------|
| 4px   | 1x         | `rounded-base` | Small elements, badges |
| 8px   | 2x         | `rounded-standard` | Buttons, inputs |
| 12px  | 3x         | `rounded-card` | Cards, panels |
| 16px  | 4x         | `rounded-modal` | Modals, large containers |

### Border Radius Examples

```tsx
<div className="rounded-base">4px radius</div>
<div className="rounded-standard">8px radius</div>
<div className="rounded-card">12px radius</div>
<div className="rounded-modal">16px radius</div>
```

### Layout Principles

**Simple Right ❤️**
*"If a design system can't be internalized and used, it's meaningless."*

The 4x system ensures:
- Easy mental math for developers and designers
- Consistent visual rhythm across all components
- Scalable spacing that maintains proportions
- Predictable alignment and structure

---

## Icon System

### Icon Library: Iconify

Quorvix Admin uses **Iconify** as the comprehensive icon solution, providing access to thousands of icons from multiple icon sets.

### Primary Icon Set: Hugeicons

**Collection:** `hugeicons`

Hugeicons provides 4,653+ consistent, modern icons perfect for admin interfaces.

#### Icon Usage

**Iconify Web Component:**
```html
<!-- Basic usage -->
<iconify-icon icon="hugeicons:notification-02"></iconify-icon>

<!-- With size and color -->
<iconify-icon 
  icon="hugeicons:user-circle" 
  width="24" 
  height="24"
  className="text-brand-primary"
></iconify-icon>
```

**React with @iconify/react:**
```tsx
import { Icon } from '@iconify/react';

<Icon icon="hugeicons:notification-02" width="24" height="24" className="text-brand-primary" />
```

### Icon Sizes

Icons should follow the 4x spacing system:

```tsx
<iconify-icon icon="hugeicons:home" width="12" height="12"></iconify-icon> // Minimal
<iconify-icon icon="hugeicons:home" width="16" height="16"></iconify-icon> // Standard UI
<iconify-icon icon="hugeicons:home" width="20" height="20"></iconify-icon> // Navigation
<iconify-icon icon="hugeicons:home" width="24" height="24"></iconify-icon> // Headers
<iconify-icon icon="hugeicons:home" width="32" height="32"></iconify-icon> // Feature icons
<iconify-icon icon="hugeicons:home" width="48" height="48"></iconify-icon> // Hero sections
```

### Icon Colors with Tailwind

```tsx
// Primary icons
<iconify-icon icon="hugeicons:notification-02" className="text-brand-primary"></iconify-icon>

// Secondary icons
<iconify-icon icon="hugeicons:settings" className="text-black-80"></iconify-icon>

// Interactive icons with hover
<iconify-icon icon="hugeicons:heart" className="text-black-40 hover:text-brand-primary transition-base"></iconify-icon>

// Status icons
<iconify-icon icon="hugeicons:check-circle" className="text-success"></iconify-icon>
<iconify-icon icon="hugeicons:alert-circle" className="text-error"></iconify-icon>
```

### Icon Guidelines

- Maintain consistent sizing within similar contexts
- Use outlined style for better clarity at small sizes
- Ensure sufficient contrast (3:1 minimum for icons)
- Pair with text labels for critical actions
- Use semantic meaning (don't use a trash icon for archiving)
- Test icons at actual implementation size

### Accessibility

- Provide `aria-label` or accompanying text for interactive icons
- Ensure touch targets are minimum 44x44px
- Use appropriate color contrast
- Don't rely solely on icons to convey information

---

## Tailwind CSS Configuration

### Setup Instructions

1. **Install Tailwind CSS** (if not already installed):
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. **Copy the design system configuration** from [tailwind.config.js](./tailwind.config.js) to your project's `tailwind.config.js`

3. **Import Tailwind in your CSS**:
```css
@import "tailwindcss";
```

4. **Use the custom design tokens** in your components:
```tsx
<button className="bg-brand-primary text-white-100 px-md py-sm rounded-standard">
  Click Me
</button>
```

### Quick Reference

**Colors:**
- Brand: `bg-brand-primary`, `bg-brand-light`
- Semantic: `text-success`, `text-error`
- Neutral: `text-black-100`, `bg-white-100`

**Spacing:**
- `xs` (4px), `sm` (8px), `md` (16px), `lg` (24px), `xl` (32px), `xxl` (48px)

**Typography:**
- Sizes: `text-xs` to `text-xxl`
- Weights: `font-regular`, `font-semibold`
- Family: `font-primary`

**Border Radius:**
- `rounded-base` (4px), `rounded-standard` (8px), `rounded-card` (12px), `rounded-modal` (16px)

**Shadows:**
- `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`

**Transitions:**
- `transition-fast` (150ms), `transition-base` (200ms), `transition-slow` (300ms)

---

*This design system is a living document and should evolve with the needs of the Quorvix Admin project.*
