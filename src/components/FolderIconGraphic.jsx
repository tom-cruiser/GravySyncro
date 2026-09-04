import React, { useId } from 'react';

/**
 * Dark 3D folder graphic matching a manila-folder "listing card" look: a
 * body layer and a raised tab layer (drawn on top, casting its own soft
 * shadow onto the body for real layered depth) in a shared top-to-bottom
 * charcoal gradient, a front-flap fold seam, and two tilted documents
 * peeking out from behind the tab. Used across the Documents folder grid.
 */
const FolderIconGraphic = ({ size = 84, className = '' }) => {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const bodyGradId = `folderBodyGrad-${uid}`;
  const tabGradId = `folderTabGrad-${uid}`;
  const bodyClipId = `folderBodyClip-${uid}`;
  const shadowBlurId = `folderShadowBlur-${uid}`;
  const sheenBlurId = `folderSheenBlur-${uid}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="-10 -15 250 230"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`folder-graphic-svg ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bodyGradId} x1="0" y1="55" x2="0" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5c5d64" />
          <stop offset="30%" stopColor="#2c2d31" />
          <stop offset="65%" stopColor="#101012" />
          <stop offset="100%" stopColor="#030304" />
        </linearGradient>
        <linearGradient id={tabGradId} x1="0" y1="30" x2="0" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b8c94" />
          <stop offset="100%" stopColor="#4a4b52" />
        </linearGradient>
        <clipPath id={bodyClipId}>
          <rect x="20" y="55" width="200" height="145" rx="26" />
        </clipPath>
        <filter id={shadowBlurId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={sheenBlurId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      {/* back document */}
      <g transform="rotate(-6 73 42)">
        <rect x="44" y="-8" width="58" height="100" rx="8" fill="#eaebef" stroke="#d7d9de" strokeWidth="1" />
      </g>

      {/* front document, with a generic tag chip + text-line detail */}
      <g transform="rotate(9 95 36)">
        <rect x="64" y="-16" width="62" height="104" rx="8" fill="#fbfbfc" stroke="#dfe1e6" strokeWidth="1" />
        <rect x="76" y="-4" width="30" height="9" rx="4.5" fill="#bcd4f7" />
        <line x1="76" y1="16" x2="106" y2="16" stroke="#c7cad0" strokeWidth="3" strokeLinecap="round" />
        <line x1="76" y1="26" x2="112" y2="26" stroke="#c7cad0" strokeWidth="3" strokeLinecap="round" />
        <line x1="76" y1="36" x2="96" y2="36" stroke="#c7cad0" strokeWidth="3" strokeLinecap="round" />
        <line x1="76" y1="46" x2="108" y2="46" stroke="#c7cad0" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* body */}
      <rect x="20" y="55" width="200" height="145" rx="26" fill={`url(#${bodyGradId})`} />

      <g clipPath={`url(#${bodyClipId})`}>
        {/* strong shadow cast by the raised tab onto the body, so the tab reads as its own layer */}
        <ellipse cx="65" cy="70" rx="58" ry="20" fill="#000000" opacity="0.55" filter={`url(#${shadowBlurId})`} />
        {/* faint sheen for a touch of volume, not glossy */}
        <ellipse cx="55" cy="95" rx="65" ry="30" fill="#ffffff" opacity="0.07" filter={`url(#${sheenBlurId})`} transform="rotate(-12 55 95)" />
        {/* front-flap fold seam */}
        <path d="M20,138 Q120,158 220,132" fill="none" stroke="#000000" strokeOpacity="0.3" strokeWidth="1.5" />
        <path d="M20,135 Q120,155 220,129" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
      </g>

      {/* raised tab: a distinctly lighter fill so it visibly separates from the body as its own layer */}
      <rect x="20" y="28" width="94" height="38" rx="15" fill={`url(#${tabGradId})`} />
      <path d="M22,48 Q20,28 38,28" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
    </svg>
  );
};

export default FolderIconGraphic;
