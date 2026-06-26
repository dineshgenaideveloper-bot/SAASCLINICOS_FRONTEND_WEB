// components/DataTable.jsx
import React, { useEffect, useState } from 'react';
import Button from './Button';

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FilterIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const AddIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SortIcon = ({ active, dir }) => {
  if (active) {
    return (
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ marginLeft: 4, color: 'var(--primary)' }}
      >
        {dir === 'asc' ? (
          <polygon points="12 4 20 20 4 20" />
        ) : (
          <polygon points="12 20 4 4 20 4" />
        )}
      </svg>
    );
  }

  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ marginLeft: 4, opacity: 0.3 }}
    >
      <line x1="12" y1="4" x2="12" y2="20" />
      <polyline points="7 9 12 4 17 9" />
      <polyline points="7 15 12 20 17 15" />
    </svg>
  );
};

export default function DataTable({
  title,
  subtitle,
  columns = [],
  rows = [],

  total = 0,
  page = 1,
  pageSize = 10,

  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onSortChange,

  onAdd,
  addLabel = 'Add',
  actions,
  loading = false,
  emptyText = 'No records found.',
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

useEffect(() => {
  const timer = setTimeout(() => {
    if (onSearchChange) {
      onSearchChange(query);
    }
  }, 400);

  return () => clearTimeout(timer);
}, [query]);

  const handleSort = (key) => {
    let nextDir = 'asc';

    if (sortKey === key) {
      nextDir = sortDir === 'asc' ? 'desc' : 'asc';
    }

    setSortKey(key);
    setSortDir(nextDir);

    if (onSortChange) {
      onSortChange({
        sortBy: key,
        sortOrder: nextDir,
      });
    }
  };

  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        boxShadow: 'var(--shadow)',
        overflow: 'hidden',
      }}
    >
      <style>
        {`
          @keyframes skeletonLoading {
            0% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0 50%;
            }
          }
        `}
      </style>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          {title && (
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              {title}
            </div>
          )}

          {subtitle && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginTop: 1,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <SearchIcon />
            </span>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              style={{
                fontFamily: 'inherit',
                fontSize: 12.5,
                height: 32,
                padding: '0 10px 0 30px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                outline: 'none',
                width: 200,
                color: 'var(--text)',
              }}
            />
          </div>

          <Button variant="outline" size="sm" icon={<FilterIcon />}>
            Filter
          </Button>

          {onAdd && (
            <Button
              variant="primary"
              size="sm"
              icon={<AddIcon />}
              onClick={onAdd}
            >
              {addLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => {
                    if (col.sortable !== false) {
                      handleSort(col.sortKey || col.key);
                    }
                  }}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                    textAlign: 'left',
                    background: 'var(--bg)',
                    whiteSpace: 'nowrap',
                    width: col.width,
                    cursor:
                      col.sortable === false ? 'default' : 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    {col.label}

                    {col.sortable !== false && (
                      <SortIcon
                        active={
                          sortKey === (col.sortKey || col.key)
                        }
                        dir={sortDir}
                      />
                    )}
                  </span>
                </th>
              ))}

              {actions && (
                <th
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg)',
                    width: 80,
                  }}
                />
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '12px 16px',
                        borderBottom:
                          rowIndex < pageSize - 1
                            ? '1px solid var(--border-light)'
                            : 'none',
                      }}
                    >
                      <div
                        style={{
                          height: 14,
                          width:
                            colIndex === 0
                              ? '80%'
                              : colIndex === columns.length - 1
                              ? '50%'
                              : '70%',
                          borderRadius: 6,
                          background:
                            'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%)',
                          backgroundSize: '400% 100%',
                          animation:
                            'skeletonLoading 1.4s ease infinite',
                        }}
                      />
                    </td>
                  ))}

                  {actions && (
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom:
                          rowIndex < pageSize - 1
                            ? '1px solid var(--border-light)'
                            : 'none',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 60,
                            height: 28,
                            borderRadius: 6,
                            background:
                              'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%)',
                            backgroundSize: '400% 100%',
                            animation:
                              'skeletonLoading 1.4s ease infinite',
                          }}
                        />

                        <div
                          style={{
                            width: 50,
                            height: 28,
                            borderRadius: 6,
                            background:
                              'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%)',
                            backgroundSize: '400% 100%',
                            animation:
                              'skeletonLoading 1.4s ease infinite',
                          }}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  style={{
                    padding: 32,
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                  }}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id || row._id || i}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '12px 16px',
                        fontSize: 13,
                        borderBottom:
                          i < rows.length - 1
                            ? '1px solid var(--border-light)'
                            : 'none',
                        color: 'var(--text)',
                        verticalAlign: 'middle',
                      }}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key]}
                    </td>
                  ))}

                  {actions && (
                    <td
                      style={{
                        padding: '12px 16px',
                        borderBottom:
                          i < rows.length - 1
                            ? '1px solid var(--border-light)'
                            : 'none',
                        verticalAlign: 'middle',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: 4,
                        }}
                      >
                        {actions({ row })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            {total === 0
              ? 'No results'
              : `Showing ${start}–${end} of ${total}`}
          </span>

          <select
            value={pageSize}
            onChange={(e) => {
              if (onPageSizeChange) {
                onPageSizeChange(Number(e.target.value));
              }
            }}
            style={{
              height: 28,
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: '#fff',
              fontSize: 12,
              color: 'var(--text-muted)',
              fontFamily: 'inherit',
            }}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <PageBtn
            onClick={() =>
              onPageChange &&
              onPageChange(Math.max(1, safePage - 1))
            }
            disabled={safePage === 1}
          >
            ‹
          </PageBtn>

          {getPages(safePage, totalPages).map((p) => (
            <PageBtn
              key={p}
              active={p === safePage}
              onClick={() =>
                onPageChange && onPageChange(p)
              }
            >
              {p}
            </PageBtn>
          ))}

          <PageBtn
            onClick={() =>
              onPageChange &&
              onPageChange(
                Math.min(totalPages, safePage + 1)
              )
            }
            disabled={safePage === totalPages}
          >
            ›
          </PageBtn>
        </div>
      </div>
    </div>
  );
}

function getPages(page, totalPages) {
  const pages = [];

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  return pages;
}

function PageBtn({
  children,
  active,
  disabled,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: active ? 'var(--primary)' : '#fff',
        color: active
          ? '#fff'
          : disabled
          ? 'var(--text-light)'
          : 'var(--text-muted)',
        fontSize: 12,
        fontWeight: 500,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
        transition: 'all 0.12s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}