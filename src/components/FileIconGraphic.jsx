import React from 'react';

const KIND_COLORS = {
  pdf: '#dc2626',
  image: '#0891b2',
  doc: '#2563eb',
  sheet: '#16a34a',
  archive: '#7c3aed',
  code: '#0f766e',
  generic: '#475569',
};

/**
 * Clean document-card graphic: a paper sheet with a colored folded corner
 * (color-coded by file kind, matching the semantic colors already used
 * elsewhere in the app) and text-line detail. Visual companion to
 * FolderIconGraphic so files and folders read as one consistent tile system.
 */
const FileIconGraphic = ({ kind = 'generic', className = '' }) => {
  const accent = KIND_COLORS[kind] || KIND_COLORS.generic;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 150 190"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`file-graphic-svg ${className}`}
      aria-hidden="true"
    >
      <rect x="8" y="8" width="134" height="174" rx="10" fill="#fbfbfc" stroke="#dfe1e6" strokeWidth="1.5" />
      <polygon points="112,8 142,8 142,38" fill={accent} />
      <line x1="112" y1="8" x2="142" y2="38" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1" />
      <line x1="26" y1="66" x2="100" y2="66" stroke="#d7dae0" strokeWidth="5" strokeLinecap="round" />
      <line x1="26" y1="84" x2="124" y2="84" stroke="#d7dae0" strokeWidth="5" strokeLinecap="round" />
      <line x1="26" y1="102" x2="112" y2="102" stroke="#d7dae0" strokeWidth="5" strokeLinecap="round" />
      <line x1="26" y1="120" x2="94" y2="120" stroke="#d7dae0" strokeWidth="5" strokeLinecap="round" />
      <line x1="26" y1="138" x2="118" y2="138" stroke="#d7dae0" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
};

export default FileIconGraphic;
