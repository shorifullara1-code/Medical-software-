import React, { useState } from 'react';

interface HospitalEmblemProps {
  size?: number;
  className?: string;
  customLogoUrl?: string;
  altText?: string;
}

export const HospitalEmblem: React.FC<HospitalEmblemProps> = ({
  size = 68,
  className = '',
  customLogoUrl,
  altText = 'Hospital Emblem',
}) => {
  const [imgError, setImgError] = useState(false);

  // If custom logo URL is provided and has not errored, show the custom image
  if (customLogoUrl && !imgError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={customLogoUrl}
          alt={altText}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain drop-shadow-xs"
        />
      </div>
    );
  }

  // Otherwise, render the classic high-res medical seal / laurel emblem
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Golden Wreath / Laurel Border */}
        <circle cx="50" cy="50" r="48" fill="#C59B27" />
        <circle cx="50" cy="50" r="45" fill="#8B1E2D" />
        <circle cx="50" cy="50" r="42" stroke="#E6C86E" strokeWidth="1.5" strokeDasharray="3 1.5" />

        {/* Inner Crimson Medallion */}
        <circle cx="50" cy="50" r="39" fill="#751522" />

        {/* Golden Laurel Leaves around the inner rim */}
        <path
          d="M20 50 C20 32 32 20 50 20 C68 20 80 32 80 50 C80 68 68 80 50 80 C32 80 20 68 20 50 Z"
          stroke="#D4AF37"
          strokeWidth="1.2"
          strokeDasharray="4 2"
          fill="none"
        />

        {/* Rod of Asclepius & Staff */}
        {/* Central Rod / Staff */}
        <line x1="50" y1="22" x2="50" y2="76" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
        {/* Top Flame / Finial */}
        <path
          d="M50 17 C48 20 46 22 50 24 C54 22 52 20 50 17 Z"
          fill="#F59E0B"
          stroke="#FEF08A"
          strokeWidth="0.8"
        />

        {/* Entwined Serpent */}
        <path
          d="M50 27 C42 30 42 36 50 39 C58 42 58 48 50 51 C42 54 42 60 50 63 C58 66 58 71 50 74"
          stroke="#FEE08B"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Serpent Head */}
        <ellipse cx="49" cy="27" rx="2.5" ry="1.8" fill="#FEF08A" />
        <circle cx="48.5" cy="26.5" r="0.5" fill="#751522" />

        {/* Base Banner / Ribbon */}
        <path
          d="M32 78 Q50 84 68 78 L65 83 Q50 87 35 83 Z"
          fill="#C59B27"
          stroke="#FEF08A"
          strokeWidth="0.8"
        />
        <circle cx="50" cy="81" r="1.5" fill="#751522" />
      </svg>
    </div>
  );
};
