// components/FormField.jsx
import React from 'react';

/**
 * FormField — wraps label + input/select/textarea with consistent styling.
 *
 * Props:
 *   label       string
 *   required    boolean
 *   error       string  — shows error hint + red border
 *   hint        string  — shows muted hint below field
 *   icon        ReactNode — SVG shown inside left of input
 *   children    the actual <input>, <select>, or <textarea>
 *   style       override wrapper style
 */
export function FormField({ label, required, error, hint, icon, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--text-muted)',
          marginBottom: 6,
          letterSpacing: '0.02em',
        }}>
          {label}
          {required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: 11, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-light)',
            display: 'flex', alignItems: 'center',
            pointerEvents: 'none',
          }}>
            {icon}
          </span>
        )}
        {React.cloneElement(React.Children.only(children), {
          style: {
            fontFamily: 'inherit',
            fontSize: 13,
            width: '100%',
            height: children.type === 'textarea' ? undefined : 38,
            padding: children.type === 'textarea'
              ? '10px 12px'
              : icon ? '0 12px 0 34px' : '0 12px',
            background: '#fff',
            border: `1.5px solid ${error ? 'var(--red)' : 'var(--border)'}`,
            borderRadius: 6,
            color: 'var(--text)',
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: error ? '0 0 0 3px rgba(163,45,45,0.1)' : 'none',
            resize: children.type === 'textarea' ? 'vertical' : undefined,
            minHeight: children.type === 'textarea' ? 80 : undefined,
            WebkitAppearance: 'none',
            ...children.props.style,
          },
        })}
      </div>

      {(error || hint) && (
        <span style={{
          fontSize: 11.5,
          marginTop: 5,
          color: error ? 'var(--red)' : 'var(--text-light)',
        }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}

/**
 * SelectField — styled select with dropdown arrow
 */
export function SelectField({ label, required, error, hint, children, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {label && (
        <label style={{
          display: 'block', fontSize: 12, fontWeight: 500,
          color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.02em',
        }}>
          {label}
          {required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          style={{
            fontFamily: 'inherit',
            fontSize: 13,
            width: '100%',
            height: 38,
            padding: '0 32px 0 12px',
            background: '#fff',
            border: `1.5px solid ${error ? 'var(--red)' : 'var(--border)'}`,
            borderRadius: 6,
            color: 'var(--text)',
            outline: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          {...props}
        >
          {children}
        </select>
        {/* Custom arrow */}
        <span style={{
          position: 'absolute', right: 12, top: '50%',
          transform: 'translateY(-52%)',
          pointerEvents: 'none', color: 'var(--text-muted)', fontSize: 14,
        }}>⌄</span>
      </div>
      {(error || hint) && (
        <span style={{ fontSize: 11.5, marginTop: 5, color: error ? 'var(--red)' : 'var(--text-light)' }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}

/**
 * Toggle — on/off switch
 * Props: label, sublabel, checked, onChange
 */
export function Toggle({ label, sublabel, checked, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', borderBottom: '1px solid var(--border-light)',
    }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text)' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{sublabel}</div>}
      </div>
      <label style={{ position: 'relative', width: 40, height: 22, flexShrink: 0, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
        />
        <span style={{
          position: 'absolute', inset: 0,
          background: checked ? 'var(--primary)' : 'var(--border)',
          borderRadius: 11,
          transition: 'background 0.2s',
        }}>
          <span style={{
            position: 'absolute',
            width: 16, height: 16,
            borderRadius: '50%',
            background: '#fff',
            top: 3, left: checked ? 21 : 3,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }} />
        </span>
      </label>
    </div>
  );
}

/**
 * RadioPills — horizontal pill-style radio group
 * Props: name, options [{value, label}], value, onChange
 */
export function RadioPills({ name, options = [], value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <label
            key={opt.value}
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '6px 14px',
              borderRadius: 20,
              border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
              fontSize: 12.5, fontWeight: 500,
              color: selected ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              background: selected ? 'var(--primary-light)' : '#fff',
              transition: 'all 0.15s',
              userSelect: 'none',
            }}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              style={{ display: 'none' }}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
