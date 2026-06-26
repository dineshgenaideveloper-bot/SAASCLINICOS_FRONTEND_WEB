// components/Button.jsx
import React from 'react';

/**
 * Button variants: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
 * sizes: 'sm' | 'md'
 * icon: pass any SVG/element as icon prop (renders left of label)
 * iconOnly: true → renders a square icon-only button
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconOnly = false,
  disabled = false,
  onClick,
  type = 'button',
  style,
  ...rest
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    fontFamily: 'inherit',
    fontSize: size === 'sm' ? 12 : 13,
    fontWeight: 500,
    borderRadius: 6,
    padding: iconOnly ? 0 : size === 'sm' ? '0 12px' : '0 16px',
    height: iconOnly ? (size === 'sm' ? 28 : 36) : size === 'sm' ? 28 : 36,
    width: iconOnly ? (size === 'sm' ? 28 : 36) : undefined,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.15s ease',
    letterSpacing: '0.01em',
    opacity: disabled ? 0.55 : 1,
    whiteSpace: 'nowrap',
  };

  const variants = {
    primary: {
      background: 'var(--primary)',
      color: '#fff',
    },
    secondary: {
      background: 'var(--primary-light)',
      color: 'var(--primary)',
      border: '1px solid rgba(15,110,86,0.2)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--text)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'var(--red-light)',
      color: 'var(--red)',
      border: '1px solid rgba(163,45,45,0.18)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)',
    },
    icon: {
      background: 'var(--bg)',
      color: 'var(--text-muted)',
      border: '1px solid var(--border)',
    },
  };

  const finalVariant = iconOnly ? 'icon' : variant;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...variants[finalVariant], ...style }}
      {...rest}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
      {!iconOnly && children}
    </button>
  );
}
