import { type HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export function Badge({ className = '', variant = 'secondary', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-orange-500 text-white',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-300 bg-transparent',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
