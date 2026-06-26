import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Eye,
  Pencil,
  RefreshCw,
  Plus,
  Trash2,
  Printer,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { FormField } from '../../components/FormField';
import DataTable from '../../components/DataTable';

import { patientAPI, inventoryAPI } from '../../services/api';

/* ──────────────────────────────────────────────────────────────
   PRINT HELPERS (adaptive for A4 / mobile / small thermal)
────────────────────────────────────────────────────────────── */

const detectPrintTarget = () => {
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || window.innerWidth <= 600;
  const forced = sessionStorage.getItem('printTarget');
  if (forced) return forced;
  if (isMobile) return 'mobile';
  return 'a4';
};

const paperDimensions = (target) => {
  switch (target) {
    case 'a4land':
      return { pageW: 297, pageH: 210, contentW: 277, fontSize: 10 };
    case 'mobile':
      return { pageW: 80, pageH: null, contentW: 72, fontSize: 9 };
    case 'small':
      return { pageW: 58, pageH: null, contentW: 52, fontSize: 8 };
    case 'a4':
    default:
      return { pageW: 210, pageH: 297, contentW: 190, fontSize: 11 };
  }
};

const buildPrintHTML = ({ title, target, bodyContent, extraStyles = '' }) => {
  const dim = paperDimensions(target);
  const isNarrow = target === 'mobile' || target === 'small';
  const pageSize = `${dim.pageW}mm ${dim.pageH ? dim.pageH + 'mm' : 'auto'}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    :root {
      --page-w:    ${dim.contentW}mm;
      --fs-base:   ${dim.fontSize}px;
      --fs-sm:     ${Math.max(dim.fontSize - 1, 7)}px;
      --fs-lg:     ${dim.fontSize + 2}px;
      --fs-xl:     ${dim.fontSize + 6}px;
      --gap:       ${isNarrow ? '6px' : '10px'};
      --pad:       ${isNarrow ? '4mm' : '10mm'};
      --radius:    ${isNarrow ? '4px' : '8px'};
    }
    @page { size: ${pageSize}; margin: ${isNarrow ? '4mm' : '10mm'}; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: var(--fs-base); color: #111827; background: #f3f4f6; }
    .page { width: var(--page-w); margin: 0 auto; background: #fff; padding: var(--pad); }
    strong { font-weight: 700; }
    .text-muted { color: #6b7280; }
    .text-sm    { font-size: var(--fs-sm); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: var(--gap); margin-bottom: calc(var(--gap) * 1.5); gap: var(--gap); }
    .clinic-name { font-size: ${isNarrow ? 'var(--fs-lg)' : 'var(--fs-xl)'}; font-weight: 800; line-height: 1.2; }
    .clinic-sub { margin-top: 4px; color: #6b7280; font-size: var(--fs-sm); line-height: 1.6; }
    .rx-badge { border: 2px solid #111827; border-radius: var(--radius); padding: ${isNarrow ? '4px 8px' : '6px 14px'}; font-size: ${isNarrow ? 'var(--fs-lg)' : '22px'}; font-weight: 800; white-space: nowrap; }
    .patient-box { border: 1px solid #d1d5db; background: #f9fafb; border-radius: var(--radius); padding: ${isNarrow ? '8px' : '12px'}; margin-bottom: calc(var(--gap) * 1.5); font-size: var(--fs-base); }
    .patient-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: ${isNarrow ? '6px' : '12px'}; }
    .label { font-weight: 700; color: #374151; }
    ${!isNarrow ? `
      table { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); }
      th { background: #111827; color: #fff; border: 1px solid #111827; padding: 6px 5px; text-align: left; }
      td { border: 1px solid #d1d5db; padding: 6px 5px; vertical-align: top; }
      tbody tr:nth-child(even) { background: #f9fafb; }
    ` : `
      .prescription-card { border: 1px solid #e5e7eb; border-radius: var(--radius); margin-bottom: var(--gap); padding: 8px; background: #fff; }
      .prescription-card-row { display: flex; justify-content: space-between; margin-bottom: 6px; flex-wrap: wrap; gap: 6px; }
      .prescription-label { font-weight: 700; color: #374151; min-width: 70px; }
    `}
    .note-box { margin-top: calc(var(--gap) * 1.5); border: 1px solid #d1d5db; border-radius: var(--radius); padding: ${isNarrow ? '6px 8px' : '10px 12px'}; background: #f9fafb; font-size: var(--fs-base); line-height: 1.7; }
    .footer { margin-top: ${isNarrow ? '16px' : '40px'}; display: flex; justify-content: space-between; align-items: flex-end; font-size: var(--fs-base); }
    .signature { width: ${isNarrow ? '90px' : '160px'}; text-align: center; }
    .signature-line { border-top: 1px solid #111827; margin-bottom: 5px; }
    @media print { body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { width: auto; padding: 0; } }
    ${extraStyles}
  </style>
</head>
<body>
  <div class="page">${bodyContent}</div>
  <script>
    window.onload = function () { window.print(); setTimeout(function () { window.close(); }, 1200); };
  </script>
</body>
</html>`;
};

/* ──────────────────────────────────────────────────────────────
   CONSTANTS
────────────────────────────────────────────────────────────── */

const emptyPatient = {
  name: '',
  phone: '',
  age: '',
  gender: '',
  address: '',
  isActive: true,
};

const emptyPrescription = {
  item: '',
  dosage: '',
  quantity: 1,
  morning:   { beforeFood: false, afterFood: false },
  afternoon: { beforeFood: false, afterFood: false },
  evening:   { beforeFood: false, afterFood: false },
  night:     { beforeFood: false, afterFood: false },
  durationDays: 1,
  instructions: '',
};

/* ──────────────────────────────────────────────────────────────
   ITEM SEARCH COMPONENT (with real-time search)
────────────────────────────────────────────────────────────── */

function ItemSearchSelect({ value, onChange, items = [], loading = false, onSearch }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimeoutRef = useRef(null);

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

  useEffect(() => {
    if (debouncedSearch !== undefined) {
      onSearch?.(debouncedSearch);
    }
  }, [debouncedSearch, onSearch]);

  const selectedItem = useMemo(() => {
    if (!value) return null;
    return items.find(item => String(item._id) === String(value));
  }, [items, value]);

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder="Search medicine by name, ID, category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          height: 40,
          border: '1px solid #d1d5db',
          borderRadius: 8,
          padding: '0 12px',
          outline: 'none',
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
      
      {search && !loading && items.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          maxHeight: 200,
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          {items.map((item) => (
            <div
              key={item._id}
              onClick={() => {
                onChange(item._id);
                setSearch('');
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                background: String(value) === String(item._id) ? '#eff6ff' : 'white'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                {item.itemId} | Stock: {item.currentStock || 0}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedItem && !search && (
        <div style={{
          marginTop: 8,
          padding: '6px 10px',
          background: '#eff6ff',
          borderRadius: 6,
          fontSize: 13,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            <strong>{selectedItem.name}</strong> ({selectedItem.itemId})
          </span>
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#ef4444'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────── */

export default function Patients() {
  // ── Server-side pagination state ──────────────────────────────
  const [patients, setPatients]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(10);
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // ── Other state ───────────────────────────────────────────────
  const [items, setItems]                   = useState([]);
  const [itemsLoading, setItemsLoading]     = useState(false);
  const [loading, setLoading]               = useState(false);

  const [viewOpen, setViewOpen]             = useState(false);
  const [editOpen, setEditOpen]             = useState(false);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedVisit, setSelectedVisit]     = useState(null);

  const [form, setForm]               = useState(emptyPatient);
  const [prescriptions, setPrescriptions] = useState([emptyPrescription]);

  /* ── Data fetching ──────────────────────────────────────────── */

  const loadPatients = useCallback(async ({
    currentPage = page,
    currentLimit = pageSize,
    currentSearch = search,
    currentSortBy = sortBy,
    currentSortOrder = sortOrder,
  } = {}) => {
    try {
      setLoading(true);
      const res = await patientAPI.getPatients({
        page: currentPage,
        limit: currentLimit,
        search: currentSearch,
        sortBy: currentSortBy,
        sortOrder: currentSortOrder,
      });

      setPatients(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, sortBy, sortOrder]);

  const fetchItems = useCallback(async (searchTerm = '') => {
    try {
      setItemsLoading(true);
      const res = await inventoryAPI.getItems({
        page: 1,
        limit: 20,
        search: searchTerm.trim(),
      });
      setItems(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch items');
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPatients();
    fetchItems('');
  }, [loadPatients, fetchItems]);

  /* ── Pagination / search / sort handlers ────────────────────── */

  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadPatients({ currentPage: newPage });
  };

  const handlePageSizeChange = (newSize) => {
    const newPage = 1;
    setPageSize(newSize);
    setPage(newPage);
    loadPatients({ currentPage: newPage, currentLimit: newSize });
  };

  const handleSearchChange = (value) => {
    const newPage = 1;
    setSearch(value);
    setPage(newPage);
    loadPatients({ currentPage: newPage, currentSearch: value });
  };

  const handleSortChange = ({ sortBy: newSortBy, sortOrder: newSortOrder }) => {
    const newPage = 1;
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(newPage);
    loadPatients({
      currentPage: newPage,
      currentSortBy: newSortBy,
      currentSortOrder: newSortOrder,
    });
  };

  const handleRefresh = () => {
    loadPatients({
      currentPage: page,
      currentLimit: pageSize,
      currentSearch: search,
      currentSortBy: sortBy,
      currentSortOrder: sortOrder,
    });
  };

  /* ── Helper functions ───────────────────────────────────────── */

  const getLatestVisit = (patient) => {
    if (!patient?.visits?.length) return null;
    return [...patient.visits].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))[0];
  };

  // Get common habits from the latest visit (or first visit - habits are shared)
  const getCommonHabits = (patient) => {
    if (!patient?.visits?.length) return {};
    // Habits are stored in each visit but should be the same across visits
    // Return habits from the most recent visit
    const latest = getLatestVisit(patient);
    return latest?.habits || {};
  };

  const hasCompletedVisit = (patient) => {
    if (!patient?.visits?.length) return false;
    return patient.visits.some(visit => visit.status === 'completed');
  };

  const getCompletedVisitsCount = (patient) => {
    if (!patient?.visits?.length) return 0;
    return patient.visits.filter(visit => visit.status === 'completed').length;
  };

  const lastCompletedVisitDate = (patient) => {
    if (!patient?.visits?.length) return null;
    const completedVisits = patient.visits.filter(visit => visit.status === 'completed');
    if (completedVisits.length === 0) return null;
    return completedVisits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))[0].visitDate;
  };

  /* ── Table config ───────────────────────────────────────────── */

  const tableRows = useMemo(() =>
    patients.map((p) => ({
      ...p,
      id: p._id,
      department: getLatestVisit(p)?.departmentName || '-',
      visitCount: p.visitCount || 0,
      completedCount: getCompletedVisitsCount(p),
      hasCompleted: hasCompletedVisit(p),
      lastCompletedDate: lastCompletedVisitDate(p),
    })),
  [patients]);

  const columns = [
    { 
      key: 'patientId',  
      label: 'Patient ID',  
      width: 120, 
      sortKey: 'patientId',
      render: (value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {row.hasCompleted && <CheckCircle size={14} color="#10b981" />}
          <span>{value || '-'}</span>
        </div>
      )
    },
    { key: 'name', label: 'Name', sortKey: 'name' },
    { key: 'phone', label: 'Phone', width: 140, sortable: false },
    { key: 'department', label: 'Department', sortable: false },
    { 
      key: 'visitCount', 
      label: 'Total Visits', 
      width: 100,  
      sortable: false,
      render: (value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>{value || 0}</span>
          {row.completedCount > 0 && (
            <Badge color="green" size="sm" style={{ fontSize: 10 }}>
              {row.completedCount} completed
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      width: 120,
      sortable: false,
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge color={val ? 'green' : 'gray'}>
            {val ? 'Active' : 'Inactive'}
          </Badge>
          {row.hasCompleted && (
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>
              ✓ Done
            </span>
          )}
        </div>
      ),
    },
  ];

  const rowActions = ({ row }) => (
    <>
      <Button size="sm" variant="secondary" onClick={() => openView(row)}>
        <Eye size={15} />
      </Button>
      <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
        <Pencil size={15} />
      </Button>
    </>
  );

  const getRowStyle = (row) => {
    if (row.hasCompleted) {
      return {
        background: 'linear-gradient(90deg, #f0fdf4 0%, #ffffff 100%)',
        borderLeft: '4px solid #10b981',
        fontWeight: 'normal',
      };
    }
    return {};
  };

  /* ── Modal handlers ─────────────────────────────────────────── */

  const openView = async (patient) => {
    try {
      const res = await patientAPI.getPatientById(patient._id);
      setSelectedPatient(res.data?.data || patient);
      setViewOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to open patient');
    }
  };

  const openEdit = (patient) => {
    setSelectedPatient(patient);
    setForm({
      name:     patient.name     || '',
      phone:    patient.phone    || '',
      age:      patient.age      || '',
      gender:   patient.gender   || '',
      address:  patient.address  || '',
      isActive: patient.isActive !== false,
    });
    setEditOpen(true);
  };

  const openPrescription = (visit) => {
    setSelectedVisit(visit);
    setPrescriptions(
      visit.prescriptions?.length
        ? visit.prescriptions.map((p) => ({
            item:      p.item?._id || p.item || '',
            dosage:    p.dosage    || '',
            quantity:  p.quantity  || 1,
            morning:   { beforeFood: !!p.morning?.beforeFood,   afterFood: !!p.morning?.afterFood },
            afternoon: { beforeFood: !!p.afternoon?.beforeFood, afterFood: !!p.afternoon?.afterFood },
            evening:   { beforeFood: !!p.evening?.beforeFood,   afterFood: !!p.evening?.afterFood },
            night:     { beforeFood: !!p.night?.beforeFood,     afterFood: !!p.night?.afterFood },
            durationDays: p.durationDays || 1,
            instructions: p.instructions || '',
          }))
        : [{ ...emptyPrescription }]
    );
    setPrescriptionOpen(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    try {
      if (!selectedPatient?._id) return;
      await patientAPI.updatePatient(selectedPatient._id, form);
      toast.success('Patient updated successfully');
      await loadPatients();
      setEditOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update patient');
    }
  };

  const handleCompleteVisit = async (patientId, visitId) => {
    try {
      await patientAPI.completePatientVisit(patientId, visitId);
      toast.success('Visit completed');
      await loadPatients();
      if (viewOpen && selectedPatient?._id === patientId) {
        const updated = await patientAPI.getPatientById(patientId);
        setSelectedPatient(updated.data?.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete visit');
    }
  };

  const updatePrescription = (index, field, value) => {
    setPrescriptions((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const updateMealTiming = (index, period, field, checked) => {
    setPrescriptions((prev) =>
      prev.map((row, i) =>
        i === index
          ? { ...row, [period]: { ...(row[period] || {}), [field]: checked } }
          : row
      )
    );
  };

  const addPrescriptionRow = () => {
    setPrescriptions((prev) => [...prev, { ...emptyPrescription }]);
  };

  const removePrescriptionRow = (index) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const savePrescription = async () => {
    try {
      if (!selectedPatient?._id || !selectedVisit?._id) {
        toast.error('Visit not selected');
        return;
      }
      const validRows = prescriptions.filter((p) => p.item);
      await patientAPI.savePrescription(selectedPatient._id, selectedVisit._id, {
        prescriptions: validRows,
      });
      toast.success('Prescription saved');
      const res = await patientAPI.getPatientById(selectedPatient._id);
      setSelectedPatient(res.data?.data);
      await loadPatients();
      setPrescriptionOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save prescription');
    }
  };

  /* ── Helpers ────────────────────────────────────────────────── */

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-IN');
  };

  const getEnglishTiming = (p) => {
    const lines = [];
    if (p.morning?.beforeFood)   lines.push('Morning - Before food');
    if (p.morning?.afterFood)    lines.push('Morning - After food');
    if (p.afternoon?.beforeFood) lines.push('Afternoon - Before food');
    if (p.afternoon?.afterFood)  lines.push('Afternoon - After food');
    if (p.evening?.beforeFood)   lines.push('Evening - Before food');
    if (p.evening?.afterFood)    lines.push('Evening - After food');
    if (p.night?.beforeFood)     lines.push('Night - Before food');
    if (p.night?.afterFood)      lines.push('Night - After food');
    return lines.length ? lines.join(', ') : '—';
  };

  const getTamilTiming = (p) => {
    const lines = [];
    if (p.morning?.beforeFood)   lines.push('காலை - சாப்பாட்டுக்கு முன்');
    if (p.morning?.afterFood)    lines.push('காலை - சாப்பாட்டுக்கு பின்');
    if (p.afternoon?.beforeFood) lines.push('மதியம் - சாப்பாட்டுக்கு முன்');
    if (p.afternoon?.afterFood)  lines.push('மதியம் - சாப்பாட்டுக்கு பின்');
    if (p.evening?.beforeFood)   lines.push('மாலை - சாப்பாட்டுக்கு முன்');
    if (p.evening?.afterFood)    lines.push('மாலை - சாப்பாட்டுக்கு பின்');
    if (p.night?.beforeFood)     lines.push('இரவு - சாப்பாட்டுக்கு முன்');
    if (p.night?.afterFood)      lines.push('இரவு - சாப்பாட்டுக்கு பின்');
    return lines.length ? lines.join(', ') : '—';
  };

  /* ── Print ──────────────────────────────────────────────────── */

  const printPrescription = (patient, visit) => {
    if (!patient || !visit) { toast.error('Patient or visit not found'); return; }
    if (!visit.prescriptions?.length) { toast.error('No prescription found'); return; }

    const target = detectPrintTarget();
    const isNarrow = target === 'mobile' || target === 'small';

    const patientInfoHtml = `
      <div class="patient-box">
        <div class="patient-grid">
          <div><span class="label">Patient ID:</span> ${patient.patientId || '-'}</div>
          <div><span class="label">Name:</span> ${patient.name || '-'}</div>
          <div><span class="label">Phone:</span> ${patient.phone || '-'}</div>
          <div><span class="label">Age:</span> ${patient.age || '-'}</div>
          <div><span class="label">Gender:</span> ${patient.gender || '-'}</div>
          <div><span class="label">Token:</span> ${visit.tokenNumber || '-'}</div>
          <div><span class="label">Date:</span> ${formatDate(visit.visitDate)}</div>
          <div><span class="label">Department:</span> ${visit.departmentName || '-'}</div>
          <div><span class="label">Doctor:</span> ${visit.doctorName || '-'}</div>
          <div><span class="label">Address:</span> ${patient.address || '-'}</div>
        </div>
      </div>
    `;

    let prescriptionsHtml = '';
    if (!isNarrow) {
      const tableRows = visit.prescriptions.map((p, idx) => {
        const durationEn = p.durationEnglish || `${p.durationDays || 1} days`;
        const durationTa = p.durationTamil   || `${p.durationDays || 1} நாட்கள்`;
        return `
          <tr>
            <td style="width:4%;">${idx + 1}</td>
            <td style="width:20%;"><strong>${p.itemName || '-'}</strong><br/><span class="text-muted">${p.itemId || ''}</span></td>
            <td style="width:8%;">${p.dosage || '-'}</td>
            <td style="width:6%; text-align:center;">${p.quantity || '-'}</td>
            <td style="width:12%;">${durationEn}<br/><span class="text-muted">${durationTa}</span></td>
            <td style="width:18%;">${getEnglishTiming(p)}</td>
            <td style="width:18%;">${getTamilTiming(p)}</td>
            <td style="width:14%;">${p.instructions || '-'}</td>
          </tr>
        `;
      }).join('');
      prescriptionsHtml = `
        <table>
          <thead>
            <tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Qty</th><th>Duration</th><th>Timing (EN)</th><th>Timing (TA)</th><th>Instructions</th></tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      `;
    } else {
      const cards = visit.prescriptions.map((p, idx) => {
        const durationEn = p.durationEnglish || `${p.durationDays || 1} days`;
        const durationTa = p.durationTamil   || `${p.durationDays || 1} நாட்கள்`;
        return `
          <div class="prescription-card">
            <div class="prescription-card-row"><span class="prescription-label">#${idx + 1}</span><strong>${p.itemName || '-'}</strong><span class="text-muted">${p.itemId || ''}</span></div>
            <div class="prescription-card-row"><span class="prescription-label">Dosage:</span> ${p.dosage || '-'}</div>
            <div class="prescription-card-row"><span class="prescription-label">Qty:</span> ${p.quantity || '-'}</div>
            <div class="prescription-card-row"><span class="prescription-label">Duration:</span> ${durationEn} / ${durationTa}</div>
            <div class="prescription-card-row"><span class="prescription-label">Timing:</span> ${getEnglishTiming(p)}</div>
            <div class="prescription-card-row"><span class="prescription-label">காலை/மாலை:</span> ${getTamilTiming(p)}</div>
            <div class="prescription-card-row"><span class="prescription-label">Instructions:</span> ${p.instructions || '-'}</div>
          </div>
        `;
      }).join('');
      prescriptionsHtml = `<div class="prescriptions-list">${cards}</div>`;
    }

    const bodyContent = `
      <div class="header">
        <div>
          <div class="clinic-name">Clinic</div>
          <div class="clinic-sub">Medical Prescription / மருத்துவ சீட்டு</div>
        </div>
        <div class="rx-badge">Rx</div>
      </div>
      ${patientInfoHtml}
      ${prescriptionsHtml}
      <div class="note-box">
        <strong>Note:</strong> Take medicines as advised by the doctor.<br/>
        <strong>குறிப்பு:</strong> மருத்துவர் கூறியபடி மருந்துகளை எடுத்துக்கொள்ளவும்.
      </div>
      <div class="footer">
        <div class="text-sm">Generated on: ${new Date().toLocaleDateString('en-IN')}</div>
        <div class="signature"><div class="signature-line"></div><div class="text-sm">Doctor Signature</div></div>
      </div>
    `;

    const html = buildPrintHTML({
      title: `Prescription_${patient.patientId || 'Patient'}_${visit.tokenNumber || ''}`,
      target,
      bodyContent,
    });

    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) { toast.error('Popup blocked – please allow popups and try again.'); return; }
    printWindow.document.write(html);
    printWindow.document.close();
  };

  /* ── Render Components ───────────────────────────────────────── */

  // Common Habits display (shared across all visits)
  const renderCommonHabits = (patient) => {
    const habits = getCommonHabits(patient);
    
    if (!habits || Object.keys(habits).length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
          No habits data recorded
        </div>
      );
    }

    return (
      <div style={infoGrid}>
        <Info label="Smoking" value={habits.smoking || '-'} />
        <Info label="Alcohol" value={habits.alcohol || '-'} />
        <Info label="Tobacco" value={habits.tobacco || '-'} />
        <Info label="Food Type" value={habits.foodType || '-'} />
        <Info label="Sleep" value={habits.sleep || '-'} />
        <Info label="Exercise" value={habits.exercise || '-'} />
        <Info label="Allergies" value={habits.allergies || '-'} />
      </div>
    );
  };

  // Per Visit General Enquiry display (unique to each visit)
  const renderPerVisitGeneralEnquiry = (visit) => {
    const generalEnquiry = visit.generalEnquiry || {};

    if (!generalEnquiry || Object.keys(generalEnquiry).length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
          No general enquiry data for this visit
        </div>
      );
    }

    return (
      <div style={infoGrid}>
        <Info label="Chief Complaint" value={generalEnquiry.chiefComplaint || '-'} />
        <Info label="Duration" value={generalEnquiry.duration || '-'} />
        <Info label="History of Present Illness" value={generalEnquiry.history || '-'} />
        <Info label="Current Medication" value={generalEnquiry.currentMedication || '-'} />
        <Info label="Past History" value={generalEnquiry.pastHistory || '-'} />
        <Info label="Family History" value={generalEnquiry.familyHistory || '-'} />
        <Info label="Notes" value={generalEnquiry.notes || '-'} />
      </div>
    );
  };

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={pageHeader}>
        <div>
          <h1 style={{ margin: 0 }}>Patients</h1>
          <p style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            Manage patients, visits and printable prescriptions
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {/* Legend for table indicators */}
      <div style={{
        display: 'flex',
        gap: 20,
        padding: '12px 16px',
        background: '#f9fafb',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        fontSize: 13,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} color="#10b981" />
          <span>✓ Patient has completed visits</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 16, background: '#10b981', borderRadius: 2 }}></div>
          <span>Green border = Completed visits</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge color="green" size="sm">X completed</Badge>
          <span>Shows number of completed visits</span>
        </div>
      </div>

      {/* ── DataTable with custom row styling ── */}
      <DataTable
        title="All Patients"
        subtitle="Search by ID, name or phone - Green highlighted rows indicate patients with completed visits"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No patients found."
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        actions={rowActions}
        rowStyle={getRowStyle}
      />

      {/* ── View Modal ── */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Patient Details"
        width={1100}
        footer={false}
        bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {selectedPatient && (
          <div style={{ display: 'grid', gap: 20 }}>
            {/* Status banner for completed visits */}
            {hasCompletedVisit(selectedPatient) && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: '#166534'
              }}>
                <CheckCircle size={20} />
                <span>
                  <strong>✓ Patient has {getCompletedVisitsCount(selectedPatient)} completed visit(s)</strong>
                  {lastCompletedVisitDate(selectedPatient) && (
                    <span style={{ marginLeft: 8, fontSize: 13 }}>
                      Last completed: {formatDate(lastCompletedVisitDate(selectedPatient))}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Patient Basic Info */}
            <div style={infoGrid}>
              <Info label="Patient ID" value={selectedPatient.patientId} />
              <Info label="Name"       value={selectedPatient.name} />
              <Info label="Phone"      value={selectedPatient.phone} />
              <Info label="Gender"     value={selectedPatient.gender} />
              <Info label="Age"        value={selectedPatient.age} />
              <Info label="Address"    value={selectedPatient.address} />
            </div>

            {/* Common Habits - Shown once for the patient (shared across visits) */}
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12 }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Habits & Lifestyle (Common)</h3>
              {renderCommonHabits(selectedPatient)}
            </div>

            {/* Visit History - Each visit has its own General Enquiry */}
            <div>
              <h3>Visit History</h3>
              <div style={{ display: 'grid', gap: 16 }}>
                {selectedPatient.visits?.slice().sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate)).map((visit, index) => (
                  <div 
                    key={visit._id} 
                    style={{
                      ...visitCard,
                      background: visit.status === 'completed' ? '#f0fdf4' : '#fff',
                      borderLeft: visit.status === 'completed' ? '4px solid #10b981' : '1px solid var(--border)',
                    }}
                  >
                    <div style={visitHeader}>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          Visit #{selectedPatient.visits.length - index}
                          {visit.status === 'completed' && (
                            <span style={{ marginLeft: 8, fontSize: 12, color: '#10b981' }}>
                              <CheckCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
                              Completed
                            </span>
                          )}
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>{visit.tokenNumber}</div>
                      </div>
                      <Badge color={visit.status === 'completed' ? 'green' : 'amber'}>
                        {visit.status === 'completed' ? '✓ Completed' : (visit.status || 'Pending')}
                      </Badge>
                    </div>

                    <div style={visitInfoGrid}>
                      <Info label="Department"     value={visit.departmentName} />
                      <Info label="Specialization" value={visit.specializationName} />
                      <Info label="Doctor"         value={visit.doctorName} />
                      <Info label="Visit Date"     value={formatDate(visit.visitDate)} />
                    </div>

                    {/* General Enquiry - Unique to this visit */}
                    <div style={{ background: '#fefce8', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                      <h4 style={{ marginTop: 0, marginBottom: 12 }}>General Enquiry (This Visit)</h4>
                      {renderPerVisitGeneralEnquiry(visit)}
                    </div>

                    <details>
                      <summary style={summaryStyle}>Department Form</summary>
                      <JsonView data={visit.departmentForm} />
                    </details>

                    <details style={{ marginTop: 14 }}>
                      <summary style={summaryStyle}>Prescription</summary>
                      {visit.prescriptions?.length ? (
                        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                          {visit.prescriptions.map((p, i) => (
                            <div key={i} style={prescriptionViewCard}>
                              <div style={{ fontWeight: 700, marginBottom: 8 }}>{p.itemName}</div>
                              <div style={visitInfoGrid}>
                                <Info label="Medicine ID"  value={p.itemId} />
                                <Info label="Dosage"       value={p.dosage} />
                                <Info label="Quantity"     value={p.quantity} />
                                <Info label="Duration"
                                  value={`${p.durationEnglish || `${p.durationDays || 1} days`} / ${p.durationTamil || `${p.durationDays || 1} நாட்கள்`}`}
                                />
                                <Info label="Instructions" value={p.instructions} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ marginTop: 10, color: 'var(--text-muted)' }}>No prescription</div>
                      )}
                    </details>

                    <div style={visitActions}>
                      <Button variant="secondary" onClick={() => openPrescription(visit)}>
                        Prescription
                      </Button>
                      <Button variant="secondary" onClick={() => printPrescription(selectedPatient, visit)}>
                        <Printer size={15} /> Print
                      </Button>
                      {visit.status !== 'completed' && (
                        <Button onClick={() => handleCompleteVisit(selectedPatient._id, visit._id)}>
                          Complete Visit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Prescription Modal with Real-time Search ── */}
      <Modal
        open={prescriptionOpen}
        onClose={() => setPrescriptionOpen(false)}
        title="Prescription"
        width={1150}
        footer={false}
        bodyStyle={{ maxHeight: '80vh' }}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {prescriptions.map((row, index) => (
            <div key={index} style={prescriptionEditCard}>
              <div style={prescriptionGrid}>
                <FormField label="Medicine">
                  <ItemSearchSelect
                    value={row.item}
                    onChange={(itemId) => updatePrescription(index, 'item', itemId)}
                    items={items}
                    loading={itemsLoading}
                    onSearch={fetchItems}
                  />
                </FormField>

                <FormField label="Dosage">
                  <input
                    value={row.dosage}
                    placeholder="1 tablet / 5 ml"
                    onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                  />
                </FormField>

                <FormField label="Quantity">
                  <input
                    type="number" min="1" value={row.quantity}
                    onChange={(e) => updatePrescription(index, 'quantity', e.target.value)}
                  />
                </FormField>

                <FormField label="How many days?">
                  <input
                    type="number" min="1" value={row.durationDays}
                    onChange={(e) => updatePrescription(index, 'durationDays', e.target.value)}
                  />
                </FormField>

                <FormField label="Duration English">
                  <input value={`${row.durationDays || 1} days`} readOnly />
                </FormField>

                <FormField label="Duration Tamil">
                  <input value={`${row.durationDays || 1} நாட்கள்`} readOnly />
                </FormField>

                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Eating Time</div>
                  <div style={mealGrid}>
                    {['morning', 'afternoon', 'evening', 'night'].map((period) => (
                      <MealTiming
                        key={period}
                        title={period.charAt(0).toUpperCase() + period.slice(1)}
                        row={row}
                        index={index}
                        period={period}
                        updateMealTiming={updateMealTiming}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <FormField label="Instructions">
                    <textarea
                      rows={2}
                      value={row.instructions}
                      placeholder="Special instructions"
                      onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                    />
                  </FormField>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <Button
                  variant="ghost"
                  onClick={() => removePrescriptionRow(index)}
                  disabled={prescriptions.length === 1}
                >
                  <Trash2 size={15} /> Remove
                </Button>
              </div>
            </div>
          ))}

          <div style={prescriptionFooter}>
            <Button variant="secondary" onClick={addPrescriptionRow}>
              <Plus size={15} /> Add Medicine
            </Button>
            <Button onClick={savePrescription}>Save Prescription</Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Patient"
        width={700}
        footer={false}
      >
        <div style={editGrid}>
          <FormField label="Name">
            <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
          </FormField>
          <FormField label="Phone">
            <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
          </FormField>
          <FormField label="Age">
            <input value={form.age} onChange={(e) => handleChange('age', e.target.value)} />
          </FormField>
          <FormField label="Gender">
            <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </FormField>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="Address">
              <textarea rows={3} value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
            </FormField>
          </div>
        </div>

        <div style={modalActions}>
          <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdate}>Update</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   SUB-COMPONENTS
────────────────────────────────────────────────────────────── */

function MealTiming({ title, row, index, period, updateMealTiming }) {
  return (
    <div style={mealCard}>
      <div style={{ fontWeight: 600, marginBottom: 10 }}>{title}</div>
      <label style={checkboxLabel}>
        <input
          type="checkbox"
          checked={!!row[period]?.beforeFood}
          onChange={(e) => updateMealTiming(index, period, 'beforeFood', e.target.checked)}
        />
        Before Food
      </label>
      <label style={checkboxLabel}>
        <input
          type="checkbox"
          checked={!!row[period]?.afterFood}
          onChange={(e) => updateMealTiming(index, period, 'afterFood', e.target.checked)}
        />
        After Food
      </label>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value || '-'}</div>
    </div>
  );
}

function JsonView({ data }) {
  if (!data || !Object.keys(data).length) {
    return <div style={{ color: 'var(--text-muted)', paddingTop: 10 }}>No data</div>;
  }
  return (
    <div style={jsonGrid}>
      {Object.entries(data).map(([key, value]) => (
        <div key={key} style={jsonCard}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{key}</div>
          <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>{String(value || '-')}</div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   STYLES
────────────────────────────────────────────────────────────── */

const pageHeader         = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const infoGrid           = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 };
const visitCard          = { border: '1px solid var(--border)', borderRadius: 14, padding: 18 };
const visitHeader        = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 };
const visitInfoGrid      = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 };
const summaryStyle       = { cursor: 'pointer', fontWeight: 600, marginBottom: 10 };
const visitActions       = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 };
const prescriptionViewCard = { border: '1px solid var(--border)', borderRadius: 10, padding: 14 };
const prescriptionEditCard = { border: '1px solid var(--border)', borderRadius: 12, padding: 16 };
const prescriptionGrid   = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 };
const mealGrid           = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 };
const mealCard           = { border: '1px solid var(--border)', borderRadius: 10, padding: 12 };
const checkboxLabel      = { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13 };
const prescriptionFooter = { display: 'flex', justifyContent: 'space-between' };
const editGrid           = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 };
const modalActions       = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 };
const jsonGrid           = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 14 };
const jsonCard           = { border: '1px solid var(--border)', borderRadius: 10, padding: 12 };