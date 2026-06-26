// components/Badge.jsx
import React from 'react';

/**
 * color: 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'gray'
 * showDot: boolean (default true)
 */

const colorMap = {
  green:  { bg: 'var(--primary-light)',  text: 'var(--primary)',      dot: 'var(--primary)' },
  red:    { bg: 'var(--red-light)',       text: 'var(--red)',           dot: 'var(--red)' },
  amber:  { bg: 'var(--amber-light)',     text: 'var(--amber)',         dot: 'var(--amber)' },
  blue:   { bg: 'var(--blue-light)',      text: 'var(--blue)',          dot: 'var(--blue)' },
  purple: { bg: 'var(--purple-light)',    text: 'var(--purple)',        dot: 'var(--purple)' },
  gray:   { bg: '#F3F4F6',               text: 'var(--text-muted)',    dot: 'var(--text-light)' },
};

export default function Badge({ children, color = 'green', showDot = true, style }) {
  const c = colorMap[color] || colorMap.green;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 11.5,
      fontWeight: 500,
      padding: '3px 10px',
      borderRadius: 20,
      letterSpacing: '0.02em',
      background: c.bg,
      color: c.text,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {showDot && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      )}
      {children}
    </span>
  );
}

/**
 * Usage:
 *   <Badge color="green">Active</Badge>
 *   <Badge color="red">Overdue</Badge>
 *   <Badge color="amber">Pending</Badge>
 *   <Badge color="blue">Scheduled</Badge>
 *   <Badge color="purple">In Review</Badge>
 */
