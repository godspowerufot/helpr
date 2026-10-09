'use client';

import React from 'react';
import Link from 'next/link';
import { Button, CircularProgress } from '@mui/material';

export interface AppButtonProps {
  children?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  href?: string;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error' | 'success' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  radius?: string;
}

const AppButton: React.FC<AppButtonProps> = ({
  children,
  label,
  onClick,
  href,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  loading = false,
  startIcon,
  endIcon,
  className,
  fullWidth = false,
  disabled = false,
  type = 'button',
  radius,
}) => {
  const spinnerSizeMap = {
    small: 16,
    medium: 20,
    large: 24,
  };

  // Quorvix button sizes: sm (px-sm py-xs text-xs), md (px-md py-sm text-sm), lg (px-lg py-md text-md).
  const fontSizeMap = { small: '12px', medium: '14px', large: '18px' };
  const paddingMap = {
    small: '4px 14px',
    medium: '8px 20px',
    large: '14px 28px',
  };

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      onClick={onClick}
      {...(href && { component: Link, href })}
      disabled={disabled || loading}
      startIcon={!loading ? startIcon : undefined}
      endIcon={!loading ? endIcon : undefined}
      fullWidth={fullWidth}
      type={href ? undefined : type}
      className={className}
      sx={{
        borderRadius: radius ?? 'var(--button-radius)',
        textTransform: 'none',
        fontFamily: 'var(--font-app-font)',
        fontWeight: 600,
        lineHeight: 1.5,
        textWrap: 'nowrap',
        boxShadow: 'none',
        fontSize: fontSizeMap[size],
        padding: paddingMap[size],
        maxWidth: '100%',
        minHeight: 44,
        transitionProperty: 'background-color, box-shadow, border-color, color',
        transitionDuration: 'var(--duration-base)',
        '&.Mui-disabled': {
          backgroundColor:
            variant === 'contained' ? 'var(--color-black-20)' : 'transparent',
          color: 'var(--color-black-40)',
          borderColor: 'var(--stroke)',
        },
        ...(variant === 'contained' && {
          backgroundColor: 'var(--ink)',
          color: 'var(--on-primary)',
          '&:hover': {
            backgroundColor: 'var(--primary-dark)',
            boxShadow: 'none',
          },
        }),
        ...(variant === 'outlined' && {
          border: '1px solid color-mix(in srgb, var(--glass) 80%, transparent)',
          backgroundColor: 'color-mix(in srgb, var(--glass) 50%, transparent)',
          backdropFilter: 'blur(12px)',
          color: 'var(--ink)',
          '&:hover': {
            borderColor: 'var(--glass)',
            backgroundColor:
              'color-mix(in srgb, var(--glass) 80%, transparent)',
          },
        }),
        ...(variant === 'text' && {
          color: 'var(--text)',
          '&:hover': { backgroundColor: 'var(--color-black-5)' },
        }),
      }}
    >
      {loading ? (
        <CircularProgress size={spinnerSizeMap[size]} color="inherit" />
      ) : (
        children || label
      )}
    </Button>
  );
};

export default AppButton;
