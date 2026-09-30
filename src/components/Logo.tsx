import React from 'react';
import { IMAGES } from '../constants/images';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = 'h-8 w-auto', size = 32 }) => {
  const [useFallback, setUseFallback] = React.useState(false);

  if (useFallback) {
    // High-fidelity neural synaptic path matching the provided mark:
    // A flowing 'S' curve with 4 colorful connection nodes and a central resonant pulse
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <circle cx="50" cy="50" r="48" fill="#F0FBF7" />
        <circle cx="50" cy="50" r="18" stroke="#8455ef" strokeWidth="3" strokeDasharray="3 3" opacity="0.4" />
        <circle cx="50" cy="50" r="10" stroke="#6b38d4" strokeWidth="2.5" opacity="0.6" />
        
        {/* Synaptic Pathway */}
        <path
          d="M26 34 C 42 22, 68 22, 74 34 C 80 46, 32 46, 50 52 C 68 58, 20 62, 26 74 C 32 86, 68 86, 74 74"
          stroke="url(#synapse-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Nodes */}
        <circle cx="26" cy="34" r="7" fill="#0051d5" />
        <circle cx="74" cy="34" r="7" fill="#8455ef" />
        <circle cx="50" cy="52" r="6" fill="#6b38d4" />
        <circle cx="26" cy="74" r="7" fill="#8455ef" />
        <circle cx="74" cy="74" r="7" fill="#00855b" />

        <defs>
          <linearGradient id="synapse-grad" x1="26" y1="28" x2="74" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0051d5" />
            <stop offset="0.45" stopColor="#6b38d4" />
            <stop offset="0.8" stopColor="#8455ef" />
            <stop offset="1" stopColor="#00855b" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <img
      src={IMAGES.logo}
      alt="Synapse Logo"
      className={`object-contain shrink-0 ${className}`}
      style={{ height: size, width: size }}
      onError={() => setUseFallback(true)}
      referrerPolicy="no-referrer"
    />
  );
};
