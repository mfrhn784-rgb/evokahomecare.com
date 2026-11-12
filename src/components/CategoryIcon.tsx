import React from "react";

export function CategoryIcon({
  slug,
  className = "w-5 h-5",
}: {
  slug: string;
  className?: string;
}) {
  switch (slug) {
    case "laundry-care":
    case "laundry-detergents":
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M17 7h14v5l4 5v23a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V17l4-5V7Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path d="M19 4h10v3H19z" stroke="currentColor" strokeWidth="2.2" />
          <path d="M13 23h22" stroke="currentColor" strokeWidth="2.2" />
          <circle cx="19" cy="31" r="2" fill="currentColor" />
          <circle cx="24" cy="35" r="1.8" fill="currentColor" />
          <circle cx="29" cy="30" r="2" fill="currentColor" />
        </svg>
      );
    case "fabric-care":
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M10 15c4.5-4.5 9.5-4.5 14 0s9.5 4.5 14 0"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M10 24c4.5-4.5 9.5-4.5 14 0s9.5 4.5 14 0"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M10 33c4.5-4.5 9.5-4.5 14 0s9.5 4.5 14 0"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "kitchen-care":
    case "dish-wash":
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M8 22c0 9.5 7.2 16 16 16s16-6.5 16-16H8Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="14" r="2.2" stroke="currentColor" strokeWidth="2" />
          <circle cx="26" cy="10" r="2.8" stroke="currentColor" strokeWidth="2" />
          <circle cx="32" cy="15" r="1.8" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "hand-wash":
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path d="M21 6h10M24 6v5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <rect
            x="15"
            y="14"
            width="18"
            height="27"
            rx="5"
            stroke="currentColor"
            strokeWidth="2.4"
          />
          <path d="M20 11h8v3h-8z" stroke="currentColor" strokeWidth="2.2" />
          <path
            d="M24 23c2.5 3 4 5.2 4 7.2a4 4 0 1 1-8 0c0-2 1.5-4.2 4-7.2Z"
            fill="currentColor"
            opacity="0.85"
          />
        </svg>
      );
    case "floor-surface-care":
    case "floor-cleaners":
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M24 7v17M14 24h20l5 16H9l5-16Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M18 32v8M24 31v9M30 32v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "bathroom-care":
    case "toilet-bathroom-care":
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M19 8h10l2 7c3 2.5 4 5.5 4 10v13a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V25c0-4.5 1-7.5 4-10l2-7Z"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path d="M24 8V5l5-1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M13 28h22" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "car-glass-care":
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M8 29l4.5-11h23L40 29"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <rect x="6" y="29" width="36" height="9" rx="2.5" stroke="currentColor" strokeWidth="2.4" />
          <circle cx="14" cy="38" r="2.8" fill="currentColor" />
          <circle cx="34" cy="38" r="2.8" fill="currentColor" />
          <path d="M37 10l1.5 3.5L42 15l-3.5 1.5L37 20l-1.5-3.5L32 15l3.5-1.5L37 10Z" fill="currentColor" />
        </svg>
      );
    case "air-fresheners":
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path
            d="M8 18h21a4.5 4.5 0 1 0-4.5-6"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M8 26h28a4.5 4.5 0 1 1-4.5 6"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path d="M8 34h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case "personal-care":
    default:
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect
            x="10"
            y="18"
            width="28"
            height="18"
            rx="9"
            stroke="currentColor"
            strokeWidth="2.4"
          />
          <rect
            x="16"
            y="23"
            width="16"
            height="8"
            rx="4"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle cx="34" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
          <circle cx="26" cy="9" r="1.8" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
  }
}
