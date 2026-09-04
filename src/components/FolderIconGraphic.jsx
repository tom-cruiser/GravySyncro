import React, { useId } from 'react';

/**
 * Glossy dark 3D folder graphic: a single-path classic folder silhouette
 * (a tab with a real diagonal bevel down into the body, like a manila
 * folder) in a top-to-bottom charcoal gradient, with a subtle front-flap
 * fold seam and two crisp documents peeking out from behind the tab. Used
 * across the Documents folder grid/list views.
 */
const FOLDER_PATH =
  'M20,58 Q20,30 44,30 L96,30 Q110,30 116,42 L128,58 Q134,70 148,70 ' +
  'L196,70 Q220,70 220,94 L220,166 Q220,190 196,190 L44,190 Q20,190 20,166 Z';

const FolderIconGraphic = ({ size = 84, className = '' }) => {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `folderGrad-${uid}`;
  const bodyClipId = `folderBodyClip-${uid}`;
  const blurId = `folderBlur-${uid}`;

  return (
    <svg
      width={size}
      height={Math.round((size * 220) / 250)}
      viewBox="-10 -10 250 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`folder-graphic-svg ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="30" x2="0" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#66676f" />
          <stop offset="40%" stopColor="#323337" />
          <stop offset="75%" stopColor="#131315" />
          <stop offset="100%" stopColor="#050506" />
        </linearGradient>
        <clipPath id={bodyClipId}>
          <path d={FOLDER_PATH} />
        </clipPath>
        <filter id={blurId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      {/* back document */}
      <g transform="rotate(-3 75 44)">
        <rect x="46" y="-6" width="58" height="100" rx="8" fill="#eaebef" stroke="#d7d9de" strokeWidth="1" />
      </g>

      {/* front document, with text-line detail */}
      <g transform="rotate(3 96 39)">
        <rect x="66" y="-12" width="60" height="102" rx="8" fill="#fbfbfc" stroke="#dfe1e6" strokeWidth="1" />
        <line x1="78" y1="8" x2="106" y2="8" stroke="#c7cad0" strokeWidth="3" strokeLinecap="round" />
        <line x1="78" y1="18" x2="112" y2="18" stroke="#c7cad0" strokeWidth="3" strokeLinecap="round" />
        <line x1="78" y1="28" x2="98" y2="28" stroke="#c7cad0" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* folder body: single-path silhouette with tab + diagonal bevel */}
      <path d={FOLDER_PATH} fill={`url(#${gradId})`} />

      <g clipPath={`url(#${bodyClipId})`}>
        {/* soft highlight for volume */}
        <g filter={`url(#${blurId})`}>
          <ellipse cx="60" cy="90" rx="70" ry="32" fill="#ffffff" opacity="0.13" transform="rotate(-12 60 90)" />
        </g>
        {/* front-flap fold seam */}
        <path d="M20,116 Q120,134 220,110" fill="none" stroke="#000000" strokeOpacity="0.3" strokeWidth="1.5" />
        <path d="M20,113 Q120,131 220,107" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
      </g>

      {/* rim highlight along the tab's top-left edge */}
      <path d="M22,44 Q20,30 34,30" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5" />
    </svg>
  );
};

export default FolderIconGraphic;
