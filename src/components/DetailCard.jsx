// components/DetailCard.jsx
import React from 'react';
import Avatar from './Avatar';
import Badge from './Badge';
import Button from './Button';

/**
 * DetailCard — shows a record's detail view (patient, doctor, billing, etc.)
 *
 * Props:
 *   name        string
 *   subId       string    — e.g. "PT-00421 · Registered Apr 10, 2022"
 *   badgeColor  string    — Badge color: 'green'|'red'|'amber'|'blue'|'purple'
 *   badgeLabel  string    — e.g. "Active"
 *   onEdit      () => void
 *   fields      Array<{ label, value, accent? }>  — detail grid rows
 *   children    ReactNode — optional extra content below grid
 */
export default function DetailCard({
  name,
  subId,
  badgeColor = 'green',
  badgeLabel = 'Active',
  onEdit,
  fields = [],
  children,
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      boxShadow: 'var(--shadow)',
      padding: 24,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        paddingBottom: 18, marginBottom: 18,
        borderBottom: '1px solid var(--border)',
      }}>
        <Avatar name={name} size={48} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{name}</div>
          {subId && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subId}</div>}
        </div>
        <Badge color={badgeColor}>{badgeLabel}</Badge>
        {onEdit && (
          <Button
            variant="secondary"
            size="sm"
            icon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
            }
            onClick={onEdit}
            style={{ marginLeft: 8 }}
          >
            Edit
          </Button>
        )}
      </div>

      {/* Detail grid — 2 columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      }}>
        {fields.map((f, i) => {
          const isOdd = i % 2 === 0;
          const isLastRow = i >= fields.length - (fields.length % 2 === 0 ? 2 : 1);
          return (
            <div
              key={i}
              style={{
                padding: '12px 0',
                borderBottom: isLastRow ? 'none' : '1px solid var(--border-light)',
                borderRight: isOdd ? '1px solid var(--border-light)' : 'none',
                paddingRight: isOdd ? 20 : 0,
                paddingLeft: isOdd ? 0 : 20,
              }}
            >
              <div style={{
                fontSize: 11, fontWeight: 500, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
              }}>
                {f.label}
              </div>
              <div style={{
                fontSize: 13, fontWeight: 500,
                color: f.accent ? `var(--${f.accent})` : 'var(--text)',
              }}>
                {f.value ?? '—'}
              </div>
            </div>
          );
        })}
      </div>

      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}
