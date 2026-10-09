# Component Guidelines - Tailwind CSS

This document provides guidelines for building UI components using the Quorvix Admin Design System with Tailwind CSS.

## Button Components

### Primary Button

```tsx
// React/TSX Example
<button className="bg-brand-primary text-white-100 px-md py-sm rounded-standard text-sm font-semibold transition-base hover:bg-[#007070] hover:shadow-md disabled:bg-black-20 disabled:text-black-40 disabled:cursor-not-allowed">
  Click Me
</button>
```

**Tailwind Classes Breakdown:**
- `bg-brand-primary` - Brand primary background color
- `text-white-100` - White text
- `px-md py-sm` - Padding (16px horizontal, 8px vertical)
- `rounded-standard` - 8px border radius
- `text-sm font-semibold` - 14px semi-bold text
- `transition-base` - 200ms transition
- `hover:bg-[#007070]` - Darker teal on hover
- `hover:shadow-md` - Medium shadow on hover
- `disabled:*` - Disabled state styles

### Secondary Button

```tsx
<button className="bg-transparent text-brand-primary border border-brand-primary px-md py-sm rounded-standard text-sm font-semibold transition-base hover:bg-brand-light">
  Secondary Action
</button>
```

**Tailwind Classes Breakdown:**
- `bg-transparent` - Transparent background
- `text-brand-primary` - Brand primary text color
- `border border-brand-primary` - Brand primary border
- `hover:bg-brand-light` - Light cyan background on hover

### Button Sizes

```tsx
// Small Button
<button className="bg-brand-primary text-white-100 px-sm py-xs rounded-base text-xs font-semibold">
  Small
</button>

// Medium Button (Default)
<button className="bg-brand-primary text-white-100 px-md py-sm rounded-standard text-sm font-semibold">
  Medium
</button>

// Large Button
<button className="bg-brand-primary text-white-100 px-lg py-md rounded-standard text-md font-semibold">
  Large
</button>
```

---

## Card Components

### Standard Card

```tsx
<div className="bg-white-100 rounded-card shadow-sm p-lg transition-base hover:shadow-md">
  <div className="mb-md pb-md border-b border-black-10">
    <h3 className="text-lg font-semibold text-black-100 m-0">
      Card Title
    </h3>
  </div>
  <div className="text-sm text-black-80">
    Card content goes here
  </div>
</div>
```

**Tailwind Classes Breakdown:**
- `bg-white-100` - White background
- `rounded-card` - 12px border radius
- `shadow-sm` - Small shadow
- `p-lg` - 24px padding
- `transition-base hover:shadow-md` - Shadow transition on hover
- `mb-md pb-md` - Margin and padding bottom (16px)
- `border-b border-black-10` - Bottom border with light color

### Card with Icon

```tsx
<div className="bg-white-100 rounded-card shadow-sm p-lg">
  <div className="flex items-center gap-md mb-md">
    <div className="w-12 h-12 bg-brand-light rounded-standard flex items-center justify-center">
      <iconify-icon icon="hugeicons:notification-02" width="24" height="24" className="text-brand-primary"></iconify-icon>
    </div>
    <h3 className="text-lg font-semibold text-black-100">Notifications</h3>
  </div>
  <p className="text-sm text-black-80">You have 5 new notifications</p>
</div>
```

---

## Input Components

### Text Input

```tsx
<div className="flex flex-col gap-sm mb-md">
  <label htmlFor="email" className="text-sm font-semibold text-black-100">
    Email Address
  </label>
  <input 
    type="email" 
    id="email" 
    className="px-md py-sm border border-black-20 rounded-standard text-sm font-primary transition-base focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-light placeholder:text-black-40 disabled:bg-black-5 disabled:text-black-40 disabled:cursor-not-allowed"
    placeholder="Enter your email"
  />
</div>
```

**Tailwind Classes Breakdown:**
- `flex flex-col gap-sm` - Vertical flex layout with 8px gap
- `px-md py-sm` - Input padding
- `border border-black-20` - Light border
- `focus:outline-none` - Remove default outline
- `focus:border-brand-primary` - Brand color border on focus
- `focus:ring-4 focus:ring-brand-light` - Focus ring effect
- `placeholder:text-black-40` - Placeholder text color
- `disabled:*` - Disabled state styles

### Input with Icon

```tsx
<div className="relative">
  <iconify-icon 
    icon="hugeicons:search-01" 
    width="20" 
    height="20" 
    className="absolute left-md top-1/2 -translate-y-1/2 text-black-40"
  ></iconify-icon>
  <input 
    type="text" 
    className="w-full pl-[44px] pr-md py-sm border border-black-20 rounded-standard text-sm focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-light"
    placeholder="Search..."
  />
</div>
```

### Textarea

```tsx
<textarea 
  className="w-full px-md py-sm border border-black-20 rounded-standard text-sm font-primary transition-base focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-light placeholder:text-black-40 resize-y min-h-[120px]"
  placeholder="Enter your message"
></textarea>
```

---

## Badge Components

### Status Badges

```tsx
// Success Badge
<span className="inline-flex items-center px-sm py-xs rounded-base text-xs font-semibold bg-secondary-mint text-success">
  Active
</span>

// Error Badge
<span className="inline-flex items-center px-sm py-xs rounded-base text-xs font-semibold bg-red-100 text-error">
  Inactive
</span>

// Info Badge
<span className="inline-flex items-center px-sm py-xs rounded-base text-xs font-semibold bg-secondary-light-blue text-blue-600">
  Pending
</span>
```

### Badge with Dot

```tsx
<span className="inline-flex items-center gap-xs px-sm py-xs rounded-base text-xs font-semibold bg-secondary-mint text-success">
  <span className="w-2 h-2 rounded-full bg-success"></span>
  Online
</span>
```

---

## Modal Components

### Modal Structure

```tsx
// Modal Backdrop & Container
<div className="fixed inset-0 bg-black-100/50 flex items-center justify-center z-modal-backdrop">
  <div className="bg-white-100 rounded-modal shadow-xl max-w-[500px] w-[90%] max-h-[90vh] overflow-hidden z-modal">
    
    {/* Modal Header */}
    <div className="flex items-center justify-between p-lg border-b border-black-10">
      <h2 className="text-lg font-semibold text-black-100 m-0">
        Modal Title
      </h2>
      <button className="bg-transparent border-0 text-xl text-black-40 cursor-pointer p-0 w-8 h-8 flex items-center justify-center transition-fast hover:text-black-100">
        &times;
      </button>
    </div>
    
    {/* Modal Body */}
    <div className="p-lg overflow-y-auto">
      Modal content goes here
    </div>
    
    {/* Modal Footer */}
    <div className="flex gap-sm justify-end p-lg border-t border-black-10">
      <button className="bg-transparent text-brand-primary border border-brand-primary px-md py-sm rounded-standard text-sm font-semibold transition-base hover:bg-brand-light">
        Cancel
      </button>
      <button className="bg-brand-primary text-white-100 px-md py-sm rounded-standard text-sm font-semibold transition-base hover:bg-[#007070]">
        Confirm
      </button>
    </div>
    
  </div>
</div>
```

---

## Table Components

### Basic Table

```tsx
<div className="overflow-x-auto rounded-card border border-black-10">
  <table className="w-full">
    <thead className="bg-black-5">
      <tr>
        <th className="text-left px-md py-sm text-sm font-semibold text-black-100">Name</th>
        <th className="text-left px-md py-sm text-sm font-semibold text-black-100">Email</th>
        <th className="text-left px-md py-sm text-sm font-semibold text-black-100">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-t border-black-10 hover:bg-black-5 transition-fast">
        <td className="px-md py-sm text-sm text-black-80">John Doe</td>
        <td className="px-md py-sm text-sm text-black-80">john@example.com</td>
        <td className="px-md py-sm">
          <span className="inline-flex items-center px-sm py-xs rounded-base text-xs font-semibold bg-secondary-mint text-success">
            Active
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Alert Components

### Alert Variants

```tsx
// Success Alert
<div className="flex items-start gap-md p-md rounded-standard bg-secondary-mint border-l-4 border-success">
  <iconify-icon icon="hugeicons:check-circle" width="20" height="20" className="text-success mt-xs"></iconify-icon>
  <div className="flex-1">
    <h4 className="text-sm font-semibold text-success m-0 mb-xs">Success!</h4>
    <p className="text-sm text-black-80 m-0">Your changes have been saved successfully.</p>
  </div>
</div>

// Error Alert
<div className="flex items-start gap-md p-md rounded-standard bg-red-50 border-l-4 border-error">
  <iconify-icon icon="hugeicons:alert-circle" width="20" height="20" className="text-error mt-xs"></iconify-icon>
  <div className="flex-1">
    <h4 className="text-sm font-semibold text-error m-0 mb-xs">Error!</h4>
    <p className="text-sm text-black-80 m-0">Something went wrong. Please try again.</p>
  </div>
</div>

// Info Alert
<div className="flex items-start gap-md p-md rounded-standard bg-secondary-light-blue border-l-4 border-blue-500">
  <iconify-icon icon="hugeicons:information-circle" width="20" height="20" className="text-blue-500 mt-xs"></iconify-icon>
  <div className="flex-1">
    <h4 className="text-sm font-semibold text-blue-600 m-0 mb-xs">Info</h4>
    <p className="text-sm text-black-80 m-0">Please review the information below.</p>
  </div>
</div>
```

---

## Best Practices

### Spacing
- Use the custom spacing scale: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`
- Use `gap-*` for flex/grid spacing
- Use `p-*` and `m-*` for padding and margins

### Colors
- Use semantic color names: `bg-brand-primary`, `text-success`, `border-error`
- Use opacity modifiers when needed: `bg-black-100/50` for 50% opacity
- Maintain contrast ratios (4.5:1 for text)

### Typography
- Use `font-semibold` for headings and emphasis
- Use `font-regular` (default) for body text
- Use size scale: `text-xs`, `text-sm`, `text-md`, `text-lg`, `text-xl`, `text-xxl`

### Responsive Design
- Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`
- Example: `text-sm md:text-md lg:text-lg`
- Test at multiple breakpoints

### Accessibility
- Use `focus:outline-none focus:ring-4` for custom focus states
- Ensure minimum touch targets: `min-h-[44px] min-w-[44px]`
- Use `aria-label` for icon-only buttons
- Maintain color contrast standards

### Transitions
- Use `transition-fast` (150ms) for small UI changes
- Use `transition-base` (200ms) for standard interactions
- Use `transition-slow` (300ms) for larger animations
- Specify properties when needed: `transition-colors`, `transition-transform`
