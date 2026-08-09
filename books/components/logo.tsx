// Brand mark (Vitruvian circle) + wordmark, inlined per the brand guide.
// No image files, no dependencies.

export function Logo({
  className = "",
  onDark = true,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const figure = onDark ? "#F7F2E9" : "#1B2436";
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Design of Man"
      className={className}
    >
      <title>Design of Man</title>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="24" cy="24" r="21" stroke="#C9A24B" strokeWidth="1.58" />
        <g stroke={figure} strokeWidth="2.01">
          <path d="M24 14.24 V29.37" />
          <path d="M7.88 10.33 L24 17.65 L40.12 10.33" />
          <path d="M14.72 41.59 L24 29.37 L33.28 41.59" />
        </g>
        <circle cx="24" cy="10.82" r="3.42" fill="#C15F3C" />
      </g>
    </svg>
  );
}

// "of" is the upright one at 0.70em, same colour — per the brand sheet.
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display italic font-medium ${className}`}>
      Design
      <span className="not-italic font-normal text-[0.70em] mx-[0.12em]">of</span>
      Man
    </span>
  );
}
