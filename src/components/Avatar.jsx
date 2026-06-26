// components/Avatar.jsx
import React from 'react';

const colorMap = [
  { bg: 'var(--primary-light)', text: 'var(--primary)' },
  { bg: 'var(--blue-light)',    text: 'var(--blue)' },
  { bg: 'var(--purple-light)',  text: 'var(--purple)' },
  { bg: 'var(--amber-light)',   text: 'var(--amber)' },
  { bg: 'var(--red-light)',     text: 'var(--red)' },
];

/**
 * Avatar — shows initials with a consistent color derived from the name.
 *
 * Props:
 *   name    string  — full name, e.g. "Arjun Sharma"
 *   size    number  — diameter in px (default 32)
 *   color   number  — manual color index 0–4 (optional, auto-derived if omitted)
 */
export default function Avatar({ name = '', size = 32, color }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const idx = color ?? (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colorMap.length;
  const c = colorMap[idx];

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: c.bg,
      color: c.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38,
      fontWeight: 600,
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {initials}
    </div>
  );
}
