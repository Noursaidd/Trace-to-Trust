import React from 'react';

export function OmaniPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="omani-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <path
            d="M50 10 L40 30 L20 30 L35 42 L30 62 L50 50 L70 62 L65 42 L80 30 L60 30 Z"
            fill="currentColor"
            opacity="0.3"
          />
          <circle cx="50" cy="50" r="5" fill="currentColor" opacity="0.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#omani-pattern)" />
    </svg>
  );
}
