import React from 'react';

interface RefreshIconProps {
  className?: string;
}

const RefreshIcon: React.FC<RefreshIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h5M20 20v-5h-5M4 4a8 8 0 0114.24 5.21M20 20a8 8 0 01-14.24-5.21"
    />
  </svg>
);

export default RefreshIcon;