import React from 'react';
import { FOCUS_LIGHT, FOCUS_ON_DARK } from './tokens';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'on-dark';
export type ButtonSize = 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `bg-tv-navy text-white hover:bg-tv-navy/90 shadow-tv-soft ${FOCUS_LIGHT}`,
  accent: `bg-tv-violet-ink text-white hover:bg-tv-violet-ink/90 shadow-tv-soft ${FOCUS_LIGHT}`,
  secondary: `border border-tv-line bg-tv-paper text-tv-navy hover:border-tv-navy/30 hover:bg-tv-mist/60 ${FOCUS_LIGHT}`,
  ghost: `text-tv-navy hover:bg-tv-mist ${FOCUS_LIGHT}`,
  'on-dark': `bg-white text-tv-navy hover:bg-tv-mist ${FOCUS_ON_DARK}`,
};

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-7 text-[15px]',
};

/** Class recipe for anything that should look like a TΛVY button. */
export const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md') =>
  `inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.98] motion-reduce:transform-none disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer ${VARIANTS[variant]} ${SIZES[size]}`;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={`${buttonClass(variant, size)} ${className}`} {...props} />
  ),
);
Button.displayName = 'Button';
