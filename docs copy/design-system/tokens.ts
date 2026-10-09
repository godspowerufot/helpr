/**
 * Quorvix Admin Design System - TypeScript/JavaScript Tokens
 * 
 * Design tokens for use in TypeScript/JavaScript files.
 * Import and use these tokens in your components.
 */

export const colors = {
    black: {
        100: '#1C1C1C',
        80: '#1C1C1CCC',
        40: '#1C1C1C66',
        20: '#1C1C1C33',
        10: '#1C1C1C1A',
        5: '#1C1C1C0D',
    },
    white: {
        100: '#FFFFFF',
        80: 'rgba(255, 255, 255, 0.8)',
        40: 'rgba(255, 255, 255, 0.4)',
        20: 'rgba(255, 255, 255, 0.2)',
        10: 'rgba(255, 255, 255, 0.1)',
        5: 'rgba(255, 255, 255, 0.05)',
    },
    primary: {
        brand: '#008B8B',
        light: '#D8F0F1',
        lightGray: '#E8E8E8',
        mediumGray: '#63626A',
    },
    secondary: {
        lightBlue: '#E5F1FF',
        slateBlue: '#34C759',
        cream: '#FFF7E5',
        tan: '#A4997D',
        mint: '#E1F8F0',
        sage: '#81A196',
    },
    semantic: {
        success: '#34C759',
        error: '#F94E72',
    },
} as const;

export const spacing = {
    xs: '4px',   // 1x
    sm: '8px',   // 2x
    md: '16px',  // 4x
    lg: '24px',  // 6x
    xl: '32px',  // 8x
    xxl: '48px', // 12x
} as const;

export const typography = {
    fontFamily: {
        primary: "'Gilroy', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    fontSize: {
        xs: '12px',
        sm: '14px',
        md: '18px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
    },
    fontWeight: {
        regular: 400,
        semibold: 600,
    },
} as const;

export const borderRadius = {
    base: '4px',      // 1x
    standard: '8px',  // 2x
    card: '12px',     // 3x
    modal: '16px',    // 4x
} as const;

export const shadows = {
    sm: '0 1px 2px 0 rgba(28, 28, 28, 0.05)',
    md: '0 4px 6px -1px rgba(28, 28, 28, 0.1), 0 2px 4px -1px rgba(28, 28, 28, 0.06)',
    lg: '0 10px 15px -3px rgba(28, 28, 28, 0.1), 0 4px 6px -2px rgba(28, 28, 28, 0.05)',
    xl: '0 20px 25px -5px rgba(28, 28, 28, 0.1), 0 10px 10px -5px rgba(28, 28, 28, 0.04)',
} as const;

export const transitions = {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
} as const;

export const zIndex = {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
} as const;

// Type exports for TypeScript
export type ColorScale = typeof colors;
export type Spacing = typeof spacing;
export type Typography = typeof typography;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Transitions = typeof transitions;
export type ZIndex = typeof zIndex;
