import React from 'react';

interface BasketballLogoProps {
  className?: string;
  size?: number;
}

export const BasketballLogo: React.FC<BasketballLogoProps> = ({
  className = 'w-6 h-6',
  size,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93c3.9 3.9 3.9 10.24 0 14.14" />
      <path d="M19.07 4.93c-3.9 3.9-3.9 10.24 0 14.14" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  );
};

export default BasketballLogo;
