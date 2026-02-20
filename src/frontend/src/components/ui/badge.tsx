import { type HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export function Badge({ className = '', variant = 'secondary', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-palette-terracotta text-white',
    secondary: 'bg-palette-cream text-palette-taupe',
    outline: 'border border-palette-taupe bg-transparent',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
