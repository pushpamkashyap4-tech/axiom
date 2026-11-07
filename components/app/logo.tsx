import { cn } from "@/lib/utils";

export function Logo({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <defs>
          <linearGradient id="logo-grad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22d3ee" />
            <stop offset="0.55" stopColor="#818cf8" />
            <stop offset="1" stopColor="#c084fc" />
          </linearGradient>
          <filter id="logo-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="2.5" y="2.5" width="43" height="43" rx="13" fill="url(#logo-grad)" fillOpacity="0.14" stroke="url(#logo-grad)" strokeOpacity="0.55" strokeWidth="1.2" />
        <g filter="url(#logo-glow)">
          <path d="M24 9.5 37.5 33.5H10.5L24 9.5Z" stroke="url(#logo-grad)" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
          <circle cx="24" cy="28.4" r="3.6" fill="url(#logo-grad)" />
          <path d="M15.4 33.4h17.2" stroke="url(#logo-grad)" strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />
        </g>
        <circle cx="35.5" cy="12.5" r="1.5" fill="#67e8f9" />
      </svg>
    </span>
  );
}
