import React, { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Download, FileText, Sheet, FileSpreadsheet, FileType2, Search } from 'lucide-react';

import Button from '../../components/Button';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import { FormField } from '../../components/FormField';

import { reportsAPI } from '../../services/api';

/* ── period options shown in the dropdown ─────────────────────────────────── */
const PERIOD_OPTIONS = [
  { label: 'This Month', value: 'month' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'week' },
  { label: 'This Year', value: 'year' },
  { label: 'Pick a Month', value: 'pick-month' },
  { label: 'Pick a Year', value: 'pick-year' },
  { label: 'Custom Range', value: 'custom' },
  { label: 'All Time', value: 'all' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const FORMAT_BUTTONS = [
  { format: 'pdf', label: 'PDF', icon: FileText },
  { format: 'excel', label: 'Excel', icon: FileSpreadsheet },
  { format: 'csv', label: 'CSV', icon: Sheet },
  { format: 'word', label: 'Word', icon: FileType2 },
];

/* ── value formatting (mirrors the backend column types) ──────────────────── */
function fmtMoney(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function fmtDate(v) {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(v) {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}
function displayValue(val, type) {
  if (val === null || val === undefined || val === '') return type === 'text' ? '-' : (type === 'currency' ? fmtMoney(0) : '-');
  switch (type) {
    case 'currency': return fmtMoney(val);
    case 'number': return Number(val).toLocaleString('en-IN');
    case 'date': return fmtDate(val);
    case 'datetime': return fmtDateTime(val);
    default: return String(val);
  }
}

/* ── trigger a browser download from an axios blob response ───────────────── */
function downloadBlob(res, fallbackName) {
  const blob = new Blob([res.data], { type: res.headers?.['content-type'] || 'application/octet-stream' });
  const disposition = res.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const filename = match ? decodeURIComponent(match[1]) : fallbackName;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function Reports() {
  const currentYear = new Date().getFullYear();

  /* report catalogue */
  const [categories, setCategories] = useState({});
  const [flatMeta, setFlatMeta] = useState({}); // key -> { title, govt, params, category }
  const [reportKey, setReportKey] = useState('');

  /* filters */
  const [period, setPeriod] = useState('month');
  const [pickMonth, setPickMonth] = useState(new Date().getMonth() + 1);
  const [pickYear, setPickYear] = useState(currentYear);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [extraParams, setExtraParams] = useState({}); // e.g. { patientId: 'PAT-00001' }

  /* result */
  const [report, setReport] = useState(null); // { title, range, columns, rows, summary, note }
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState('');

  /* client-side table state */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ sortBy: '', sortOrder: 'asc' });

  const selectedMeta = flatMeta[reportKey] || null;

  /* ── load report catalogue once ─────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await reportsAPI.listReports();
        const cats = res.data?.categories || {};
        setCategories(cats);

        const flat = {};
        let firstKey = '';
        Object.entries(cats).forEach(([category, items]) => {
          items.forEach((it) => {
            flat[it.key] = { ...it, category };
            if (!firstKey) firstKey = it.key;
          });
        });
        setFlatMeta(flat);
        if (firstKey) setReportKey(firstKey);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load report list');
      }
    })();
  }, []);

  /* ── build query params from the current filter state ───────────────────── */
  const buildParams = useCallback(() => {
    const p = { ...extraParams };
    switch (period) {
      case 'today': p.period = 'today'; break;
      case 'yesterday': p.period = 'yesterday'; break;
      case 'week': p.period = 'week'; break;
      case 'year': p.period = 'year'; p.year = currentYear; break;
      case 'all': p.period = 'all'; break;
      case 'pick-month': p.month = pickMonth; p.year = pickYear; break;
      case 'pick-year': p.year = pickYear; break;
      case 'custom':
        if (dateFrom) p.from = dateFrom;
        if (dateTo) p.to = dateTo;
        break;
      case 'month':
      default: p.period = 'month'; break;
    }
    return p;
  }, [period, pickMonth, pickYear, dateFrom, dateTo, extraParams, currentYear]);

  /* ── load preview (JSON) ────────────────────────────────────────────────── */
  const loadReport = useCallback(async () => {
    if (!reportKey) return;
    try {
      setLoading(true);
      const res = await reportsAPI.runReport(reportKey, buildParams());
      const r = res.data?.report;
      setReport(r || null);
      setPage(1);
      setSearch('');
      setSortConfig({ sortBy: '', sortOrder: 'asc' });
      if (r && (!r.rows || r.rows.length === 0)) {
        toast('No records found for the selected period.', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [reportKey, buildParams]);

  /* auto-load when the report selection changes */
  useEffect(() => {
    if (reportKey) loadReport();
  }, [reportKey]);

  /* ── download a format ──────────────────────────────────────────────────── */
  const handleDownload = async (format) => {
    if (!reportKey) return;
    try {
      setDownloading(format);
      const res = await reportsAPI.downloadReport(reportKey, buildParams(), format);
      const ext = format === 'excel' ? 'xlsx' : format === 'word' ? 'docx' : format;
      downloadBlob(res, `${reportKey}.${ext}`);
    } catch (err) {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading('');
    }
  };

  /* ── dynamic columns from the report definition ─────────────────────────── */
  const columns = useMemo(() => {
    if (!report?.columns) return [];
    return report.columns.map((c) => ({
      key: c.key,
      label: c.label,
      sortable: true,
      sortKey: c.key,
      render: (val) => {
        if (c.type === 'currency') {
          return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{displayValue(val, c.type)}</span>;
        }
        if (c.key === 'status' && val) {
          return <Badge color={statusColor(val)}>{val}</Badge>;
        }
        return displayValue(val, c.type);
      },
    }));
  }, [report]);

  /* ── client-side filter → sort → paginate ───────────────────────────────── */
  const colTypeMap = useMemo(() => {
    const m = {};
    (report?.columns || []).forEach((c) => { m[c.key] = c.type; });
    return m;
  }, [report]);

  const filteredRows = useMemo(() => {
    let rows = report?.rows || [];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        (report?.columns || []).some((c) =>
          String(displayValue(row[c.key], c.type)).toLowerCase().includes(q)
        )
      );
    }
    if (sortConfig.sortBy) {
      const { sortBy, sortOrder } = sortConfig;
      const type = colTypeMap[sortBy];
      const numeric = type === 'currency' || type === 'number';
      rows = [...rows].sort((a, b) => {
        let av = a[sortBy], bv = b[sortBy];
        if (numeric) { av = Number(av || 0); bv = Number(bv || 0); }
        else if (type === 'date' || type === 'datetime') { av = new Date(av).getTime() || 0; bv = new Date(bv).getTime() || 0; }
        else { av = String(av ?? '').toLowerCase(); bv = String(bv ?? '').toLowerCase(); }
        if (av < bv) return sortOrder === 'asc' ? -1 : 1;
        if (av > bv) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [report, search, sortConfig, colTypeMap]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize).map((r, i) => ({ ...r, id: r._id || `${start + i}` }));
  }, [filteredRows, page, pageSize]);

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={pageHeader}>
        <div>
          <h1 style={{ margin: 0 }}>Reports</h1>
          <p style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            Patient, clinical, billing, inventory, purchase and statutory reports — export to PDF, Excel, CSV or Word
          </p>
        </div>
        <Button onClick={loadReport} disabled={loading || !reportKey}>
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div style={controlCard}>
        <div style={controlsGrid}>
          {/* report selector */}
          <FormField label="Report">
            <select
              value={reportKey}
              onChange={(e) => { setReportKey(e.target.value); setExtraParams({}); }}
              style={selectStyle}
            >
              {Object.entries(categories).map(([cat, items]) => (
                <optgroup key={cat} label={cat}>
                  {items.map((it) => (
                    <option key={it.key} value={it.key}>
                      {it.title}{it.govt ? '  •  Statutory' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </FormField>

          {/* period selector */}
          <FormField label="Period">
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={selectStyle}>
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>

          {/* conditional: pick month */}
          {period === 'pick-month' && (
            <FormField label="Month">
              <select value={pickMonth} onChange={(e) => setPickMonth(Number(e.target.value))} style={selectStyle}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </FormField>
          )}

          {/* conditional: year (pick-month or pick-year) */}
          {(period === 'pick-month' || period === 'pick-year') && (
            <FormField label="Year">
              <select value={pickYear} onChange={(e) => setPickYear(Number(e.target.value))} style={selectStyle}>
                {Array.from({ length: 7 }, (_, i) => currentYear - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </FormField>
          )}

          {/* conditional: custom range */}
          {period === 'custom' && (
            <>
              <FormField label="Date From">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="Date To">
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inputStyle} />
              </FormField>
            </>
          )}

          {/* conditional: report-specific params (e.g. patientId) */}
          {(selectedMeta?.params || []).map((param) => (
            <FormField key={param} label={paramLabel(param)}>
              <input
                type="text"
                value={extraParams[param] || ''}
                placeholder={paramPlaceholder(param)}
                onChange={(e) => setExtraParams((p) => ({ ...p, [param]: e.target.value }))}
                style={inputStyle}
              />
            </FormField>
          ))}

          {/* apply button */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button onClick={loadReport} disabled={loading} style={{ width: '100%' }}>
              <Search size={16} />
              Apply
            </Button>
          </div>
        </div>

        {/* download bar */}
        <div style={downloadBar}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13, marginRight: 4 }}>Download:</span>
          {FORMAT_BUTTONS.map(({ format, label, icon: Icon }) => (
            <Button
              key={format}
              size="sm"
              variant="outline"
              onClick={() => handleDownload(format)}
              disabled={!!downloading || !reportKey}
            >
              {downloading === format ? <RefreshCw size={14} className="spin" /> : <Icon size={14} />}
              {label}
            </Button>
          ))}
          {selectedMeta?.govt && (
            <Badge color="amber" style={{ marginLeft: 'auto' }}>Statutory / Govt Report</Badge>
          )}
        </div>
      </div>

      {/* ── Summary strip ──────────────────────────────────────────────────── */}
      {report?.summary?.length > 0 && (
        <div style={summaryGrid}>
          {report.summary.map((s, i) => (
            <div key={i} style={summaryCard}>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.label}</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>
                {displayValue(s.value, s.type)}
              </div>
            </div>
          ))}
        </div>
      )}

      {report?.note && (
        <div style={noteBox}>ℹ️ {report.note}</div>
      )}

      {/* ── Data table ─────────────────────────────────────────────────────── */}
      <DataTable
        title={report?.title || 'Report'}
        subtitle={report?.range ? `Period: ${report.range}` : 'Select a report and click Apply'}
        columns={columns}
        rows={pageRows}
        loading={loading}
        emptyText="No records found for the selected period."
        total={filteredRows.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onSortChange={({ sortBy, sortOrder }) => { setSortConfig({ sortBy, sortOrder }); setPage(1); }}
      />
    </div>
  );
}

/* ── helpers ────────────────────────────────────────────────────────────── */
function statusColor(status) {
  const s = String(status).toLowerCase();
  if (['completed', 'paid', 'received', 'active'].includes(s)) return 'green';
  if (['pending', 'consulting', 'called', 'waiting', 'draft'].includes(s)) return 'amber';
  if (['cancelled', 'enquiry'].includes(s)) return 'red';
  return 'gray';
}
function paramLabel(param) {
  if (param === 'patientId') return 'Patient ID';
  return param.charAt(0).toUpperCase() + param.slice(1);
}
function paramPlaceholder(param) {
  if (param === 'patientId') return 'e.g. PAT-00001';
  return '';
}

/* ── styles (matching your existing conventions) ──────────────────────────── */
const pageHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const controlCard = {
  background: 'var(--bg-card, #fff)',
  padding: 16,
  borderRadius: 12,
  border: '1px solid var(--border)',
  display: 'grid',
  gap: 14,
};

const controlsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: 12,
  alignItems: 'flex-end',
};

const downloadBar = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
  borderTop: '1px solid var(--border)',
  paddingTop: 12,
};

const selectStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  fontSize: 13,
  background: '#fff',
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  fontSize: 13,
};

const summaryGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
};

const summaryCard = {
  background: 'var(--bg-card, #fff)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '14px 16px',
};

const noteBox = {
  background: 'var(--bg-subtle, #f8fafc)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 13,
  color: 'var(--text-muted)',
};