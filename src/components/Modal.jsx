// components/Modal.jsx
import React, { useEffect } from 'react';
import Button from './Button';

/**
 * Modal — accessible dialog overlay.
 *
 * Props:
 *   open        boolean
 *   onClose     () => void
 *   title       string
 *   subtitle    string
 *   children    ReactNode  — modal body content
 *   footer      ReactNode  — overrides default footer (pass false to hide footer)
 *   onConfirm   () => void — shown as primary action if footer not provided
 *   confirmLabel string   — default "Confirm"
 *   confirmLoading boolean
 *   width       number    — default 480
 *   bodyStyle   object    — custom styles for body container (for scrollable content)
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  onConfirm,
  confirmLabel = 'Confirm',
  confirmLoading = false,
  width = 480,
  bodyStyle = {},  // ← NEW: accept custom body styles
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(17,24,39,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-md)',
        width: '100%',
        maxWidth: width,
        overflow: 'hidden',
        animation: 'slideUp 0.18s ease',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',  // ← prevent modal from exceeding viewport
      }}>
        {/* Head */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0,  // ← keep header fixed
        }}>
          <div>
            {title && <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28, height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit',
              lineHeight: 1,
              transition: 'background 0.12s',
              flexShrink: 0,
              marginLeft: 12,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            ×
          </button>
        </div>

        {/* Body - scrollable area */}
        <div style={{
          padding: '20px 22px',
          overflowY: 'auto',
          flex: 1,  // ← take remaining space
          ...bodyStyle,  // ← merge custom styles
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer !== false && (
          <div style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg)',
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            flexShrink: 0,  // ← keep footer fixed
          }}>
            {footer || (
              <>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={onConfirm}
                  disabled={confirmLoading}
                >
                  {confirmLoading ? 'Saving…' : confirmLabel}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}