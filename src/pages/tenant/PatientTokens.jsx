import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { FormField } from '../../components/FormField';

import { patientTokenAPI, departmentAPI, staffAPI, patientAPI } from '../../services/api';

const emptyForm = {
  patientId: '',
  patientName: '',
  patientPhone: '',
  department: '',
  staff: '',
  notes: '',
};

const getToday = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const fetchAllPages = async (apiFn, baseParams = {}) => {
  const limit = baseParams.limit || 1000;
  const firstRes = await apiFn({
    ...baseParams,
    page: 1,
    limit,
  });

  const firstData = Array.isArray(firstRes.data?.data) ? firstRes.data.data : [];
  const totalPages = firstRes.data?.pagination?.totalPages || 1;

  if (totalPages <= 1) {
    return firstData;
  }

  const requests = [];

  for (let page = 2; page <= totalPages; page += 1) {
    requests.push(
      apiFn({
        ...baseParams,
        page,
        limit,
      })
    );
  }

  const remainingResponses = await Promise.all(requests);
  const remainingData = remainingResponses.flatMap((res) =>
    Array.isArray(res.data?.data) ? res.data.data : []
  );

  return [...firstData, ...remainingData];
};

// Phone number validation function
const validatePhoneNumber = (phone) => {
  if (!phone || phone.trim() === '') return { isValid: false, message: 'Phone number is required' };
  
  // Remove any spaces, dashes, or special characters for validation
  const cleanPhone = phone.toString().replace(/[\s\-\(\)\+]/g, '');
  
  // Check if it's a valid Indian phone number (10 digits, starts with 6-9)
  const phoneRegex = /^[6-9]\d{9}$/;
  
  if (phoneRegex.test(cleanPhone)) {
    return { isValid: true, message: '' };
  }
  
  if (cleanPhone.length !== 10) {
    return { isValid: false, message: 'Phone number must be exactly 10 digits' };
  }
  
  if (!/^[6-9]/.test(cleanPhone)) {
    return { isValid: false, message: 'Phone number must start with 6, 7, 8, or 9' };
  }
  
  if (!/^\d+$/.test(cleanPhone)) {
    return { isValid: false, message: 'Phone number must contain only digits' };
  }
  
  return { isValid: false, message: 'Please enter a valid 10-digit phone number' };
};

// Patient Search Component
function PatientSearchSelect({
  label = "Select Patient",
  value = null,
  patients = [],
  onChange,
  onSearch,
  loading = false,
  required = false,
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimeoutRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchHint, setSearchHint] = useState('');

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== undefined) {
      onSearch?.(debouncedSearch);
      if (debouncedSearch.length >= 2) {
        setIsOpen(true);
        setSearchHint('');
      } else if (debouncedSearch.length > 0 && debouncedSearch.length < 2) {
        setSearchHint('Type at least 2 characters to search');
      } else {
        setSearchHint('');
      }
    }
  }, [debouncedSearch, onSearch]);

  const selectedPatient = useMemo(() => {
    if (!value) return null;
    return patients.find(p => String(p._id) === String(value));
  }, [patients, value]);

  const handleSelect = (patient) => {
    onChange(patient);
    setSearch('');
    setIsOpen(false);
    setSearchHint('');
  };

  const clearSelection = () => {
    onChange(null);
    setSearch('');
    setIsOpen(false);
    setSearchHint('');
  };

  const matchesSearch = (value, searchTerm) => {
    if (!value || !searchTerm) return false;
    const stringValue = String(value).toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return stringValue.includes(searchLower);
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        {selectedPatient && (
          <button
            type="button"
            onClick={clearSelection}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#ef4444',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {!selectedPatient ? (
        <>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by Patient ID, Name, or Phone Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => {
                if (search.length >= 2 && patients.length > 0) {
                  setIsOpen(true);
                }
              }}
              style={{
                width: '100%',
                height: 40,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '0 12px',
                outline: 'none',
                fontSize: 14,
              }}
            />
            {loading && (
              <div style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 12,
                color: '#6b7280'
              }}>
                Searching...
              </div>
            )}
            {search && !loading && patients.length > 0 && (
              <div style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 11,
                color: '#9ca3af'
              }}>
                {patients.length} results
              </div>
            )}
          </div>

          {searchHint && (
            <div style={{
              fontSize: 12,
              color: '#f59e0b',
              padding: '4px 8px',
              background: '#fffbeb',
              borderRadius: 6,
            }}>
              💡 {searchHint}
            </div>
          )}

          {isOpen && (
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                background: '#fff',
                maxHeight: 360,
                overflowY: 'auto',
                padding: 8,
                display: 'grid',
                gap: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {loading ? (
                <div style={{ padding: 12, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                  Searching patients...
                </div>
              ) : patients.length === 0 ? (
                <div style={{ padding: 12, textAlign: 'center' }}>
                  <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>
                    {search.length >= 2 ? 'No patients found' : 'Type at least 2 characters to search'}
                  </div>
                  {search.length >= 2 && (
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      Try searching by:
                      <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                        <li>Patient ID (e.g., PAT001)</li>
                        <li>Patient Name (full or partial)</li>
                        <li>Phone Number (10 digits)</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                patients.map((patient) => {
                  const phoneNumber = patient.phone ? String(patient.phone) : '';
                  
                  return (
                    <div
                      key={patient._id}
                      onClick={() => handleSelect(patient)}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        cursor: 'pointer',
                        border: '1px solid #f3f4f6',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.borderColor = '#f3f4f6';
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                        {patient.name || 'Unnamed'}
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#6b7280' }}>
                        {patient.patientId && <span>🆔 {patient.patientId}</span>}
                        {phoneNumber && <span>📞 {phoneNumber}</span>}
                        {patient.age && <span>🎂 Age: {patient.age}</span>}
                        {patient.gender && <span>⚥ {patient.gender}</span>}
                      </div>
                      {patient.address && (
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                          📍 {typeof patient.address === 'object' 
                            ? `${patient.address.city || ''} ${patient.address.state || ''}`
                            : patient.address}
                        </div>
                      )}
                      {search && search.length >= 2 && (
                        <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 4 }}>
                          {matchesSearch(patient.patientId, search) && '🔍 Matched by Patient ID '}
                          {matchesSearch(patient.name, search) && '🔍 Matched by Name '}
                          {matchesSearch(phoneNumber, search) && '🔍 Matched by Phone '}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            border: '1px solid #bfdbfe',
            background: '#eff6ff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              {selectedPatient.name || 'Unnamed'}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#4b5563' }}>
              {selectedPatient.patientId && <span>🆔 {selectedPatient.patientId}</span>}
              {selectedPatient.phone && <span>📞 {String(selectedPatient.phone)}</span>}
              {selectedPatient.age && <span>🎂 Age: {selectedPatient.age}</span>}
            </div>
          </div>
          <button
            onClick={clearSelection}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: 20,
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// Print helpers
const detectPrintTarget = () => {
  const forced = sessionStorage.getItem('printTarget');
  if (forced) return forced;

  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || window.innerWidth <= 600;
  return isMobile ? 'mobile' : 'a4';
};

const paperDimensions = (target) => {
  switch (target) {
    case 'mobile': return { pageW: 80, pageH: null, contentW: 72, fontSize: 9 };
    case 'small': return { pageW: 58, pageH: null, contentW: 52, fontSize: 8 };
    case 'a4':
    default: return { pageW: 210, pageH: 297, contentW: 190, fontSize: 11 };
  }
};

const openPrintWindow = (html) => {
  const win = window.open('', '_blank', 'width=1200,height=900');
  if (!win) {
    toast.error('Popup blocked – please allow popups and try again.');
    return;
  }
  win.document.write(html);
  win.document.close();
};

const buildTokenHTML = ({ token, clinicName, target }) => {
  const dim = paperDimensions(target);
  const isNarrow = target === 'mobile' || target === 'small';
  const isSmall = target === 'small';

  const pageSize = `${dim.pageW}mm ${dim.pageH ? dim.pageH + 'mm' : 'auto'}`;
  const margin = isSmall ? '4mm' : isNarrow ? '6mm' : '10mm';

  const displayDate = token.tokenDate
    ? String(token.tokenDate)
    : token.createdAt
      ? new Date(token.createdAt).toLocaleDateString('en-IN')
      : '—';

  if (!isSmall) {
    const cardW = isNarrow ? '64mm' : '120mm';
    const tokenSize = isNarrow ? '40px' : '64px';
    const fs = `${dim.fontSize}px`;
    const fsSm = `${dim.fontSize - 1}px`;

    const body = `
      <div style="
        width: ${cardW};
        margin: 0 auto;
        border: 2px dashed #111827;
        border-radius: 14px;
        padding: ${isNarrow ? '12px 10px' : '24px 20px'};
        text-align: center;
        font-family: Arial, Helvetica, sans-serif;
        color: #111827;
      ">
        ${clinicName ? `<div style="font-size:${fsSm};color:#6b7280;margin-bottom:6px;">${clinicName}</div>` : ''}

        <div style="font-size:${isNarrow ? '13px' : '16px'};font-weight:800;letter-spacing:.06em;
                    text-transform:uppercase;border-bottom:1px dashed #9ca3af;
                    padding-bottom:${isNarrow ? '8px' : '12px'};margin-bottom:${isNarrow ? '8px' : '14px'};">
          PATIENT TOKEN
        </div>

        <div style="font-size:${tokenSize};font-weight:900;letter-spacing:.04em;
                    margin:${isNarrow ? '8px 0' : '14px 0'};line-height:1;">
          ${token.tokenNumber || '—'}
        </div>

        <div style="border-top:1px dashed #9ca3af;padding-top:${isNarrow ? '8px' : '12px'};
                    margin-top:${isNarrow ? '8px' : '12px'};font-size:${fs};text-align:left;">
          <table style="width:100%;border-collapse:collapse;font-size:${fs};">
            <tr>
              <td style="color:#6b7280;padding:${isNarrow ? '2px 0' : '4px 0'};vertical-align:top;width:40%;">Patient</td>
              <td style="font-weight:700;padding:${isNarrow ? '2px 0' : '4px 0'};vertical-align:top;">${token.patientName || '—'}</td>
            </tr>
            ${token.patientPhone ? `
            <tr>
              <td style="color:#6b7280;padding:${isNarrow ? '2px 0' : '4px 0'};vertical-align:top;">Phone</td>
              <td style="padding:${isNarrow ? '2px 0' : '4px 0'};vertical-align:top;">${token.patientPhone}</td>
            </tr>` : ''}
            <tr>
              <td style="color:#6b7280;padding:${isNarrow ? '2px 0' : '4px 0'};vertical-align:top;">Department</td>
              <td style="padding:${isNarrow ? '2px 0' : '4px 0'};vertical-align:top;">${token.departmentName || '—'}</td>
            </tr>
            ${token.staffName ? `
            <tr>
              <td style="color:#6b7280;padding:${isNarrow ? '2px 0' : '4px 0'};vertical-align:top;">Staff</td>
              <td style="padding:${isNarrow ? '2px 0' : '4px 0'};vertical-align:top;">${token.staffName}</td>
            </tr>` : ''}
            <tr>
              <td style="color:#6b7280;padding:${isNarrow ? '2px 0' : '4px 0'};vertical-align:top;">Date</td>
              <td style="padding:${isNarrow ? '2px 0' : '4px 0'};vertical-align:top;">${displayDate}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top:${isNarrow ? '10px' : '18px'};font-size:${fsSm};color:#6b7280;
                    border-top:1px dashed #9ca3af;padding-top:${isNarrow ? '8px' : '12px'};">
          Please wait until your token is called.
        </div>
      </div>`;

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Token ${token.tokenNumber || ''}</title>
  <style>
    @page { size: ${pageSize}; margin: ${margin}; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: ${fs};
      background: #f3f4f6;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: ${isNarrow ? '6mm 0' : '16mm 0'};
      min-height: 100vh;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>${body}
<script>
  window.onload = function() {
    window.print();
    setTimeout(function() { window.close(); }, 1200);
  };
</script>
</body>
</html>`;
  }

  // 58mm small thermal layout
  const fs = `${dim.fontSize}px`;
  const fsSm = `${Math.max(dim.fontSize - 1, 7)}px`;

  const body = `
    <div style="
      width: ${dim.contentW}mm;
      font-family: 'Courier New', Courier, monospace;
      font-size: ${fs};
      color: #111827;
      line-height: 1.55;
    ">
      ${clinicName ? `
      <div style="text-align:center;font-weight:700;font-size:${dim.fontSize + 1}px;
                  border-bottom:1px dashed #111;padding-bottom:5px;margin-bottom:5px;">
        ${clinicName}
      </div>` : ''}

      <div style="text-align:center;font-weight:700;font-size:${dim.fontSize + 1}px;
                  letter-spacing:.04em;margin-bottom:6px;">
        PATIENT TOKEN
      </div>

      <div style="text-align:center;font-size:${dim.fontSize + 14}px;font-weight:900;
                  letter-spacing:.06em;line-height:1;margin:8px 0;border-top:1px dashed #111;
                  border-bottom:1px dashed #111;padding:8px 0;">
        ${token.tokenNumber || '—'}
      </div>

      <div style="margin-top:6px;font-size:${fs};">
        <div><span style="color:#555;">Patient: </span><strong>${token.patientName || '—'}</strong></div>
        ${token.patientPhone ? `<div><span style="color:#555;">Phone: </span>${token.patientPhone}</div>` : ''}
        <div><span style="color:#555;">Dept: </span>${token.departmentName || '—'}</div>
        ${token.staffName ? `<div><span style="color:#555;">Staff: </span>${token.staffName}</div>` : ''}
        <div><span style="color:#555;">Date: </span>${displayDate}</div>
      </div>

      <div style="margin-top:8px;border-top:1px dashed #111;padding-top:6px;
                  text-align:center;font-size:${fsSm};color:#555;">
        Please wait for your token.
      </div>
    </div>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Token ${token.tokenNumber || ''}</title>
  <style>
    @page { size: ${pageSize}; margin: ${margin}; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #fff;
      font-family: 'Courier New', Courier, monospace;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>${body}
<script>
  window.onload = function() {
    window.print();
    setTimeout(function() { window.close(); }, 1200);
  };
</script>
</body>
</html>`;
};

// Dropdown component
function Dropdown({
  label,
  required,
  value,
  options = [],
  placeholder = 'Select option',
  onChange,
  allowClear = false,
  clearLabel = 'All',
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return options;
    return options.filter((item) => String(item.label || '').toLowerCase().includes(q));
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isOpen]);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const option = options.find((opt) => String(opt.value) === String(value));
    return option ? option.label : '';
  }, [value, options]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <FormField label={label} required={required}>
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            borderRadius: 10,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 42,
          }}
        >
          <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value
              ? <span>{selectedLabel}</span>
              : <span style={{ color: '#9ca3af' }}>{placeholder}</span>}
          </div>
          <span style={{ fontSize: 12, marginLeft: 8, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>

        {isOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999,
            maxHeight: 320, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>
              <input
                ref={searchInputRef}
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', outline: 'none', fontSize: 13 }}
              />
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 270 }}>
              {allowClear && (
                <div
                  onClick={() => handleSelect('')}
                  style={{
                    padding: '10px 12px', cursor: 'pointer',
                    backgroundColor: value === '' ? 'rgba(59,130,246,0.08)' : 'transparent',
                    borderBottom: '1px solid #f3f4f6', fontSize: 13, fontWeight: 600,
                  }}
                >
                  {clearLabel}
                </div>
              )}
              {filteredOptions.length === 0
                ? <div style={{ padding: 12, textAlign: 'center', color: '#6b7280' }}>No options found</div>
                : filteredOptions.map((option) => {
                    const active = String(value) === String(option.value);
                    return (
                      <div
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        style={{
                          padding: '10px 12px', cursor: 'pointer',
                          backgroundColor: active ? 'rgba(59,130,246,0.08)' : 'transparent',
                          borderBottom: '1px solid #f3f4f6',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{option.label}</span>
                      </div>
                    );
                  })}
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
}

// Main Component
export default function PatientTokens() {
  const [tokens, setTokens] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [clinicName, setClinicName] = useState('');
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  
  // Phone validation state
  const [phoneError, setPhoneError] = useState('');

  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patientMode, setPatientMode] = useState('new');

  // Filter state
  const [filterDate, setFilterDate] = useState(getToday());
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Define departmentOptions
  const departmentOptions = useMemo(() =>
    departments
      .filter((d) => d.isActive !== false)
      .map((d) => ({
        label: `${d.name || ''}${d.specializationName ? ` (${d.specializationName})` : ''}${d.code ? ` - ${d.code}` : ''}`,
        value: d._id,
      })),
    [departments]
  );

  // Define staffOptions
  const staffOptions = useMemo(() => {
    if (!form.department) return [];
    return staffList
      .filter((s) => {
        if (s.status && s.status !== 'active') return false;
        const assigned = Array.isArray(s.departments)
          ? s.departments.map(String)
          : s.department ? [String(s.department)] : [];
        return assigned.includes(String(form.department));
      })
      .map((s) => ({
        label: `${s.name || ''}${s.staffId ? ` (${s.staffId})` : ''}${s.phone ? ` - ${s.phone}` : ''}`,
        value: s._id,
      }));
  }, [staffList, form.department]);

  const statusOptions = [
    { label: 'Waiting', value: 'waiting' },
    { label: 'Called', value: 'called' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  // Fetch patients with search
  const fetchPatients = useCallback(async (search = '') => {
    try {
      setPatientsLoading(true);
      const params = {
        page: 1,
        limit: 20,
      };
      
      if (search && search.trim()) {
        params.search = search.trim();
      }
      
      const res = await patientAPI.getPatients(params);
      setPatients(res.data?.data || []);
      
      if (search && search.trim() && res.data?.data?.length === 0) {
        toast('No patients found matching your search', { icon: '🔍' });
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients');
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  // Fetch tokens with pagination, filters, and sorting
  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      };
      
      if (filterDate) params.date = filterDate;
      if (filterDepartment) params.department = filterDepartment;
      if (filterStatus) params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;
      
      const res = await patientTokenAPI.getTokens(params);
      
      const pageInfo = res.data?.pagination || {};

      setTokens(res.data?.data || []);
      setPagination(prev => ({
        ...prev,
        page: pageInfo.page || prev.page,
        limit: pageInfo.limit || prev.limit,
        total: pageInfo.total || 0,
        totalPages: pageInfo.totalPages || 1,
      }));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, filterDate, filterDepartment, filterStatus, searchQuery]);

  const fetchMasters = useCallback(async () => {
    try {
      const [departmentData, staffData] = await Promise.all([
        fetchAllPages(departmentAPI.getDepartments, {
          isActive: 'true',
          sortBy: 'name',
          sortOrder: 'asc',
        }),
        fetchAllPages(staffAPI.getStaff, {
          status: 'active',
          sortBy: 'name',
          sortOrder: 'asc',
        }),
      ]);

      setDepartments(departmentData);
      setStaffList(staffData);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch departments/staff');
    }
  }, []);

  useEffect(() => {
    fetchMasters();
    fetchPatients('');
    const stored = sessionStorage.getItem('clinicName');
    if (stored) setClinicName(stored);
  }, [fetchMasters, fetchPatients]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const resetForm = () => {
    setForm(emptyForm);
    setPatientMode('new');
    setPhoneError('');
  };

  const handlePhoneChange = (value) => {
    setForm({ ...form, patientPhone: value });
    
    if (value && value.trim() !== '') {
      const validation = validatePhoneNumber(value);
      setPhoneError(validation.isValid ? '' : validation.message);
    } else {
      setPhoneError('');
    }
  };

  const handleSelectPatient = (patient) => {
    if (patient) {
      setForm({
        ...form,
        patientId: patient._id,
        patientName: patient.name,
        patientPhone: patient.phone || '',
      });
      setPhoneError('');
    } else {
      setForm({
        ...form,
        patientId: '',
        patientName: '',
        patientPhone: '',
      });
      setPhoneError('');
    }
  };

  const handleSubmit = async () => {
    if (!form.patientName || form.patientName.trim() === '') {
      toast.error('Patient name is required');
      return;
    }
    
    if (patientMode === 'new') {
      if (!form.patientPhone || form.patientPhone.trim() === '') {
        toast.error('Phone number is required');
        return;
      }
      
      const validation = validatePhoneNumber(form.patientPhone);
      if (!validation.isValid) {
        toast.error(validation.message);
        return;
      }
    }
    
    if (!form.department) {
      toast.error('Department is required');
      return;
    }

    const submitData = {
      patientName: form.patientName.trim(),
      patientPhone: form.patientPhone ? form.patientPhone.trim() : '',
      department: form.department,
      staff: form.staff || undefined,
      notes: form.notes,
    };

    if (patientMode === 'existing' && form.patientId) {
      submitData.patientId = form.patientId;
    }

    try {
      await patientTokenAPI.createToken(submitData);
      toast.success('Token created successfully');
      setOpen(false);
      resetForm();
      // Reset to first page after creating new token.
      // If already on page 1, refresh manually because React may skip a no-op state update.
      if (pagination.page === 1) {
        fetchTokens();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create token');
    }
  };

  const updateStatus = async (token, status) => {
    try {
      await patientTokenAPI.updateTokenStatus(token._id, { status });
      toast.success('Token status updated');
      fetchTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (token) => {
    if (!window.confirm(`Delete token ${token.tokenNumber}?`)) return;
    try {
      await patientTokenAPI.deleteToken(token._id);
      toast.success('Token deleted');
      fetchTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete token');
    }
  };

  const printToken = (token) => {
    const target = detectPrintTarget();
    const html = buildTokenHTML({ token, clinicName, target });
    openPrintWindow(html);
  };

  const getStatusColor = (status) => {
    if (status === 'waiting') return 'orange';
    if (status === 'called') return 'blue';
    if (status === 'completed') return 'green';
    if (status === 'cancelled') return 'red';
    return 'gray';
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle page size change
  const handlePageSizeChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Handle search
  const handleSearchChange = (searchValue) => {
    setSearchQuery(searchValue);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle sort
  const handleSortChange = ({ sortBy, sortOrder }) => {
    setSortConfig({ sortBy, sortOrder });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle filters
  const handleDateFilterChange = (value) => {
    setFilterDate(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDepartmentFilterChange = (value) => {
    setFilterDepartment(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilterChange = (value) => {
    setFilterStatus(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const tableRows = tokens.map((token) => ({
    id: token._id,
    tokenNumber: token.tokenNumber,
    patientName: token.patientName,
    patientPhone: token.patientPhone || '—',
    department: token.departmentName || '—',
    staff: token.staffName || '—',
    tokenDate: token.tokenDate,
    status: token.status,
    raw: token,
  }));

  const columns = [
    {
      key: 'tokenNumber',
      label: 'Token',
      sortable: true,
      sortKey: 'tokenNumber',
      render: (value) => <div style={{ fontWeight: 700, fontSize: 16 }}>{value}</div>,
    },
    { key: 'patientName', label: 'Patient', sortable: true, sortKey: 'patientName' },
    { key: 'patientPhone', label: 'Phone', sortable: true, sortKey: 'patientPhone' },
    { key: 'department', label: 'Department', sortable: true, sortKey: 'departmentName' },
    { key: 'staff', label: 'Assigned Staff', sortable: true, sortKey: 'staffName' },
    { key: 'tokenDate', label: 'Date', sortable: true, sortKey: 'tokenDate' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'status',
      render: (value) => (
        <Badge color={getStatusColor(value)}>
          {String(value || '').toUpperCase()}
        </Badge>
      ),
    },
  ];

  return (
    <>
      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <FormField label="Date">
          <input type="date" value={filterDate} onChange={(e) => handleDateFilterChange(e.target.value)} />
        </FormField>

        <Dropdown
          label="Department"
          value={filterDepartment}
          options={departmentOptions}
          placeholder="All Departments"
          clearLabel="All Departments"
          allowClear
          onChange={handleDepartmentFilterChange}
        />

        <Dropdown
          label="Status"
          value={filterStatus}
          options={statusOptions}
          placeholder="All Status"
          clearLabel="All Status"
          allowClear
          onChange={handleStatusFilterChange}
        />
      </div>

      {/* Data Table with Pagination Props */}
      <DataTable
        title="Patient Tokens"
        subtitle="Generate department-wise patient tokens and assign department staff"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No tokens found."
        addLabel="New Token"
        onAdd={() => { resetForm(); setOpen(true); }}
        // Pagination props
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Search props
        onSearchChange={handleSearchChange}
        // Sort props
        onSortChange={handleSortChange}
        actions={({ row }) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="secondary" onClick={() => printToken(row.raw)}>
              Print
            </Button>

            {row.raw.status === 'waiting' && (
              <Button size="sm" variant="outline" onClick={() => updateStatus(row.raw, 'called')}>
                Call
              </Button>
            )}

            {row.raw.status !== 'completed' && row.raw.status !== 'cancelled' && (
              <Button size="sm" variant="outline" onClick={() => updateStatus(row.raw, 'completed')}>
                Complete
              </Button>
            )}

            {row.raw.status !== 'cancelled' && row.raw.status !== 'completed' && (
              <Button size="sm" variant="danger" onClick={() => updateStatus(row.raw, 'cancelled')}>
                Cancel
              </Button>
            )}

            <Button size="sm" variant="danger" onClick={() => handleDelete(row.raw)}>
              Delete
            </Button>
          </div>
        )}
      />

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => { setOpen(false); resetForm(); }}
        title="New Patient Token"
        confirmLabel="Generate Token"
        onConfirm={handleSubmit}
        width="60%"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Patient Type Toggle */}
          <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
            <Button
              variant={patientMode === 'new' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setPatientMode('new');
                handleSelectPatient(null);
              }}
            >
              New Patient
            </Button>
            <Button
              variant={patientMode === 'existing' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setPatientMode('existing');
                handleSelectPatient(null);
              }}
            >
              Existing Patient
            </Button>
          </div>

          {patientMode === 'existing' ? (
            <PatientSearchSelect
              label="Select Existing Patient"
              value={form.patientId}
              patients={patients}
              loading={patientsLoading}
              onSearch={fetchPatients}
              onChange={handleSelectPatient}
              required
            />
          ) : (
            <>
              <FormField label="Patient Name" required>
                <input
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  placeholder="Enter patient name"
                />
              </FormField>

              <FormField label="Patient Phone" required>
                <div>
                  <input
                    value={form.patientPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Enter 10-digit phone number (e.g., 9876543210)"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `none`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                  {phoneError && (
                    <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                      ⚠️ {phoneError}
                    </div>
                  )}
                </div>
              </FormField>
            </>
          )}

          {/* Department & Staff */}
          <Dropdown
            label="Department"
            required
            value={form.department}
            options={departmentOptions}
            placeholder="Select Department"
            onChange={(value) => setForm({ ...form, department: value, staff: '' })}
          />

          <Dropdown
            label="Assign Staff"
            value={form.staff}
            options={staffOptions}
            placeholder={
              form.department
                ? staffOptions.length ? 'Select Staff' : 'No staff found for this department'
                : 'Select department first'
            }
            onChange={(value) => setForm({ ...form, staff: value })}
          />

          <FormField label="Notes">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes"
              style={{ resize: 'vertical' }}
            />
          </FormField>
        </div>
      </Modal>
    </>
  );
}