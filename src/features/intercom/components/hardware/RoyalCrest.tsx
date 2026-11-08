/** Embossed royal crest used as the brand mark. */
export function RoyalCrest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none">
      <defs>
        <linearGradient id="crest-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1d68e" />
          <stop offset="0.5" stopColor="#c9a24f" />
          <stop offset="1" stopColor="#8a6a26" />
        </linearGradient>
      </defs>
      <path
        d="M24 46c-9-3.6-15-10.4-15-20V12l15-6 15 6v14c0 9.6-6 16.4-15 20Z"
        stroke="url(#crest-gold)"
        strokeWidth="2.2"
      />
      <path
        d="M14.5 30.5 13 18.5l5.6 4.6L24 14.5l5.4 8.6 5.6-4.6-1.5 12H14.5Z"
        fill="url(#crest-gold)"
      />
      <rect x="14.5" y="32.5" width="19" height="3" rx="1" fill="url(#crest-gold)" />
      <circle cx="13" cy="17.3" r="1.6" fill="url(#crest-gold)" />
      <circle cx="24" cy="13.2" r="1.8" fill="url(#crest-gold)" />
      <circle cx="35" cy="17.3" r="1.6" fill="url(#crest-gold)" />
    </svg>
  );
}
