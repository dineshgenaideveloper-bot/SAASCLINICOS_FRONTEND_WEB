// client/src/components/common/index.js
import React from 'react';

// ─── Button ───────────────────────────────────────────────────────────────────
export const Button = ({ children, variant = 'default', size = 'md', loading, disabled, className = '', ...props }) => {
  const base = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    default: 'bg-white border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-hover)]',
    primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] shadow-sm',
    danger: 'bg-[var(--red-light)] text-[var(--red)] hover:bg-red-100 border border-red-200',
    ghost: 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full spin" /> : null}
      {children}
    </button>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow)] ${className}`} {...props}>
    {children}
  </div>
);

// ─── Badge / Tag ──────────────────────────────────────────────────────────────
const tagStyles = {
  green: 'bg-[var(--primary-light)] text-[var(--primary-text)]',
  blue: 'bg-[var(--blue-light)] text-[var(--blue)]',
  amber: 'bg-[var(--amber-light)] text-[var(--amber)]',
  red: 'bg-[var(--red-light)] text-[var(--red)]',
  purple: 'bg-[var(--purple-light)] text-[var(--purple)]',
  gray: 'bg-gray-100 text-gray-500',
};

export const Badge = ({ children, color = 'gray' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagStyles[color] || tagStyles.gray}`}>
    {children}
  </span>
);

export const statusBadge = (status) => {
  const map = { Active: 'green', 'Follow-up': 'amber', Discharged: 'gray', Inactive: 'gray', Paid: 'green', Pending: 'red', Partial: 'amber', Cancelled: 'gray', Draft: 'blue' };
  return <Badge color={map[status] || 'gray'}>{status}</Badge>;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const avatarColors = [
  ['#B5D4F4','#185FA5'], ['#9FE1CB','#0F6E56'], ['#CECBF6','#534AB7'],
  ['#F4C0D1','#993556'], ['#FAC775','#854F0B'], ['#F5C4B3','#993C1D'],
];

export const Avatar = ({ name = '', size = 32 }) => {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const [bg, color] = avatarColors[name.charCodeAt(0) % avatarColors.length];
  return (
    <div style={{ width: size, height: size, background: bg, color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</label>}
    <input className={`w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(15,110,86,0.12)] ${error ? 'border-red-400' : ''} ${className}`} {...props} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export const Select = ({ label, error, children, className = '', ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</label>}
    <select className={`w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:border-[var(--primary)] ${error ? 'border-red-400' : ''} ${className}`} {...props}>
      {children}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 24 }) => (
  <div style={{ width: size, height: size }} className="border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full spin" />
);

export const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Spinner size={32} />
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ title = 'No data', subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-12 h-12 bg-[var(--bg)] rounded-full flex items-center justify-center mb-4">
      <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="var(--text-light)" strokeWidth={1.5} strokeLinecap="round"><circle cx={12} cy={12} r={10}/><path d="M8 12h8M12 8v8"/></svg>
    </div>
    <p className="font-medium text-[var(--text)]">{title}</p>
    {subtitle && <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${widths[size]} z-10 fade-in`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-base text-[var(--text)]">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-muted)]">
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
export const KpiCard = ({ label, value, delta, deltaDir, icon, iconBg }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
        <p className="text-2xl font-semibold mt-1.5 text-[var(--text)] tracking-tight">{value}</p>
        {delta && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${deltaDir === 'up' ? 'text-[var(--primary)]' : 'text-[var(--red)]'}`}>
            {deltaDir === 'up' ? '▲' : '▼'} {delta} vs last month
          </p>
        )}
      </div>
      {icon && <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>}
    </div>
  </Card>
);

// ─── Pagination ───────────────────────────────────────────────────────────────
export const Pagination = ({ page, pages, onPage }) => (
  <div className="flex items-center gap-2 justify-end mt-4">
    <Button size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>‹ Prev</Button>
    <span className="text-sm text-[var(--text-muted)]">Page {page} of {pages}</span>
    <Button size="sm" onClick={() => onPage(page + 1)} disabled={page >= pages}>Next ›</Button>
  </div>
);
