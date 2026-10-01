import React from 'react';
import { LOGOS } from '../constants/images';

interface LogoProps {
  /** `symbol` is the mark alone; `horizontal` is the mark with the "Synapse" wordmark beside it */
  variant?: 'symbol' | 'horizontal';
  /** `contrast` for light backgrounds, `white` for dark or gradient ones */
  tone?: 'contrast' | 'white';
  /** Height in pixels; the width follows the artwork */
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'symbol', tone = 'contrast', size = 32, className = '' }) => (
  <img
    src={LOGOS[variant][tone]}
    // The wordmark is part of the image in the horizontal version; the bare symbol is decorative next to text
    alt={variant === 'horizontal' ? 'Synapse' : ''}
    className={`shrink-0 w-auto ${className}`}
    style={{ height: size }}
  />
);
