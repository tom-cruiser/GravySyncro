import React, { useId } from 'react';

/**
 * Skeuomorphic/neumorphic dark folder graphic: a solid charcoal back panel,
 * a frosted-glass front pocket (simulated backdrop-blur + translucent tint)
 * that shows documents tucked inside, and two crisp documents peeking out
 * the top. Used across the Documents folder grid/list views.
 */
const FolderIconGraphic = ({ size = 84, className = '' }) => {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `folderGrad-${uid}`;
  const bodyClipId = `folderBodyClip-${uid}`;
  const flapClipId = `folderFlapClip-${uid}`;
  const flapTintId = `folderFlapTint-${uid}`;
  const blurId = `folderBlur-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`folder-graphic-svg ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#6b6c74" />
          <stop offset="45%" stopColor="#34353b" />
          <stop offset="100%" stopColor="#0a0a0c" />
        </linearGradient>
        <linearGradient id={flapTintId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dfe1e6" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#dfe1e6" stopOpacity="0.03" />
        </linearGradient>
        <clipPath id={bodyClipId}>
          <rect x="20" y="76" width="200" height="122" rx="32" />
        </clipPath>
        {/* contour-cut front pocket: the wavy region below the flap seam */}
        <clipPath id={flapClipId}>
          <path d="M20,118 Q100,136 220,108 L220,166 Q220,198 188,198 L52,198 Q20,198 20,166 Z" />
        </clipPath>
        <filter id={blurId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      {/* crisp documents peeking out */}
      <g transform="rotate(-4 86 86)">
        <rect x="54" y="20" width="64" height="132" rx="8" fill="#e9eaee" stroke="#d3d5da" strokeWidth="1" />
      </g>
      <g transform="rotate(3 131 81)">
        <rect x="98" y="14" width="66" height="134" rx="8" fill="#fbfbfc" stroke="#dcdfe4" strokeWidth="1" />
        <polygon points="148,14 164,14 164,30" fill="#d8dade" />
        <line x1="148" y1="14" x2="164" y2="30" stroke="#c3c6cc" strokeWidth="1" />
        <line x1="110" y1="44" x2="148" y2="44" stroke="#c7cad0" strokeWidth="3" strokeLinecap="round" />
        <line x1="110" y1="54" x2="154" y2="54" stroke="#c7cad0" strokeWidth="3" strokeLinecap="round" />
        <line x1="110" y1="64" x2="138" y2="64" stroke="#c7cad0" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* solid charcoal back panel / base */}
      <rect x="20" y="76" width="200" height="122" rx="32" fill={`url(#${gradId})`} />

      {/* frosted-glass front pocket: blurred paper hint + translucent tint + edge highlight */}
      <g clipPath={`url(#${flapClipId})`}>
        <g filter={`url(#${blurId})`} opacity="0.3">
          <g transform="rotate(-4 86 86)">
            <rect x="54" y="20" width="64" height="132" rx="8" fill="#eceef2" />
          </g>
          <g transform="rotate(3 131 81)">
            <rect x="98" y="14" width="66" height="134" rx="8" fill="#fcfcfd" />
          </g>
        </g>
        <rect x="20" y="76" width="200" height="122" fill={`url(#${flapTintId})`} />
        <path d="M18,118 Q100,137 222,107" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.5" />
      </g>

      {/* overall glass sheen across the whole folder */}
      <g clipPath={`url(#${bodyClipId})`}>
        <polygon points="20,76 120,76 60,198 20,198" fill="#ffffff" opacity="0.06" />
      </g>
    </svg>
  );
};

export default FolderIconGraphic;
