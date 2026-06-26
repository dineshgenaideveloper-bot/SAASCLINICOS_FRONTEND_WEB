// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../../../components/DataTable';
import Badge from '../../../components/Badge';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import { FormField } from '../../../components/FormField';

import { ipdAPI, inventoryAPI, staffAPI } from '../../../services/api';

const emptyLabOrder = {
  orderedByName: '',
  notes: '',
  tests: [
    {
      testName: '',
      testCode: '',
      sampleType: '',
      priority: 'routine',
      amount: 0,
    },
  ],
};

const emptyMedicineIssue = {
  issuedByName: '',
  notes: '',
  items: [],
};

const emptyCharge = {
  chargeType: 'misc',
  description: '',
  quantity: 1,
  rate: 0,
  amount: 0,
  addedByName: '',
};

const emptyDischargeSummary = {
  finalDiagnosis: '',
  hospitalCourse: '',
  treatmentGiven: '',
  conditionOnDischarge: '',
  dischargeAdvice: '',
  followUpDate: '',
  preparedByName: '',
  status: 'completed',
};

const emptySettlement = {
  discount: 0,
  advancePaid: 0,
  paidAmount: 0,
  paymentMode: 'cash',
  paymentReference: '',
  settledByName: '',
};

const emptyBedRelease = {
  bedReleasedByName: '',
};

const statusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Admitted', value: 'admitted' },
  { label: 'Settlement Pending', value: 'settlement_pending' },
  { label: 'Settled', value: 'settled' },
  { label: 'Bed Released', value: 'bed_released' },
  { label: 'Discharged', value: 'discharged' },
  { label: 'Cancelled', value: 'cancelled' },
];

const chargeTypeOptions = [
  { label: 'Bed', value: 'bed' },
  { label: 'Doctor', value: 'doctor' },
  { label: 'Nursing', value: 'nursing' },
  { label: 'Lab', value: 'lab' },
  { label: 'Medicine', value: 'medicine' },
  { label: 'Procedure', value: 'procedure' },
  { label: 'Equipment', value: 'equipment' },
  { label: 'Misc', value: 'misc' },
];

const paymentModeOptions = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'UPI', value: 'upi' },
  { label: 'Bank', value: 'bank' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Mixed', value: 'mixed' },
  { label: 'Other', value: 'other' },
];

// Searchable staff dropdown (value = staff name, matching existing API contract)
function StaffSearchSelect({
  value,
  onChange,
  staffList = [],
  loading = false,
  placeholder = 'Select Staff',
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  const options = useMemo(
    () =>
      staffList.map((staff) => {
        const name =
          staff.name || staff.staffName || staff.fullName || staff.employeeName || '';
        const meta = [
          staff.staffId,
          staff.role,
          staff.departmentName || staff.department?.name,
          staff.phone,
        ]
          .filter(Boolean)
          .join(' · ');
        return { key: staff._id, name, meta };
      }),
    [staffList]
  );

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.name.toLowerCase().includes(q) || o.meta.toLowerCase().includes(q)
    );
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
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

  const handleSelect = (name) => {
    onChange(name);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div
        onClick={() => setIsOpen((o) => !o)}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: 8,
          padding: '0 12px',
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: '#fff',
          fontSize: 14,
        }}
      >
        <span
          style={{
            color: value ? '#111827' : '#9ca3af',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value || placeholder}
        </span>
        <span
          style={{
            fontSize: 12,
            marginLeft: 8,
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            maxHeight: 320,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>
            <input
              ref={searchInputRef}
              placeholder="Search staff by name, role or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                outline: 'none',
                fontSize: 13,
              }}
            />
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 270 }}>
            {value && (
              <div
                onClick={() => handleSelect('')}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#ef4444',
                }}
              >
                Clear selection
              </div>
            )}

            {loading ? (
              <div style={{ padding: 12, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                Loading staff...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div style={{ padding: 12, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                No staff found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const active = String(value) === String(opt.name);
                return (
                  <div
                    key={opt.key}
                    onClick={() => handleSelect(opt.name)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      backgroundColor: active ? 'rgba(59,130,246,0.08)' : 'transparent',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {opt.name || 'Unnamed Staff'}
                    </div>
                    {opt.meta && (
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        {opt.meta}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IpdBillingDischarge() {
  const [rows, setRows] = useState([]);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  const [loading, setLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  const [medicineOpen, setMedicineOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [bedReleaseOpen, setBedReleaseOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const [labForm, setLabForm] = useState(emptyLabOrder);
  const [medicineForm, setMedicineForm] = useState(emptyMedicineIssue);
  const [chargeForm, setChargeForm] = useState(emptyCharge);
  const [summaryForm, setSummaryForm] = useState(emptyDischargeSummary);
  const [settlementForm, setSettlementForm] = useState(emptySettlement);
  const [bedReleaseForm, setBedReleaseForm] = useState(emptyBedRelease);

  const [items, setItems] = useState([]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemsLoading, setItemsLoading] = useState(false);

  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const [reports, setReports] = useState(null);
  const [reportFilter, setReportFilter] = useState({
    from: '',
    to: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [sortConfig, setSortConfig] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-IN');
  };

  const formatAmount = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    if (status === 'admitted') return 'green';
    if (status === 'settlement_pending') return 'yellow';
    if (status === 'settled') return 'blue';
    if (status === 'bed_released') return 'gray';
    if (status === 'discharged') return 'gray';
    if (status === 'cancelled') return 'red';
    return 'gray';
  };

  const loadAdmissions = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      };

      if (searchQuery) params.search = searchQuery;
      if (filterStatus) params.status = filterStatus;

      const res = await ipdAPI.getAdmissions(params);

      setRows(res.data?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1,
      }));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load IPD records');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    sortConfig.sortBy,
    sortConfig.sortOrder,
    searchQuery,
    filterStatus,
  ]);

  const loadFullAdmission = async (admission) => {
    const res = await ipdAPI.getAdmissionById(admission._id);
    return res.data?.data || admission;
  };

  const refreshSelectedAdmission = async (id) => {
    try {
      const res = await ipdAPI.getAdmissionById(id);
      setSelectedAdmission(res.data?.data || null);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchItems = useCallback(async (search = '') => {
    try {
      setItemsLoading(true);

      const res = await inventoryAPI.getItems({
        page: 1,
        limit: 20,
        search: search.trim(),
      });

      setItems(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch medicines');
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      setStaffLoading(true);

      const res = await staffAPI.getStaff({
        page: 1,
        limit: 500,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      setStaffList(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch staff');
      setStaffList([]);
    } finally {
      setStaffLoading(false);
    }
  }, []);

  const loadReports = async () => {
    try {
      const params = {};
      if (reportFilter.from) params.from = reportFilter.from;
      if (reportFilter.to) params.to = reportFilter.to;

      const res = await ipdAPI.getIpdReports(params);
      setReports(res.data?.data || null);
      setReportsOpen(true);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load IPD reports');
    }
  };

  useEffect(() => {
    loadAdmissions();
  }, [loadAdmissions]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    if (medicineOpen) {
      fetchItems(itemSearch);
    }
  }, [medicineOpen, itemSearch, fetchItems]);

  const tableRows = rows.map((admission) => ({
    id: admission._id,
    admissionNo: admission.admissionNo || '—',
    patientName: admission.patientName || admission.patient?.name || '—',
    patientId: admission.patientId || admission.patient?.patientId || '—',
    phone: admission.phone || admission.patient?.phone || '—',
    wardName: admission.wardName || admission.ward?.name || '—',
    roomNumber: admission.roomNumber || admission.room?.roomNumber || '—',
    bedNumber: admission.bedNumber || admission.bed?.bedNumber || '—',
    status: admission.status || 'admitted',
    admissionDate: admission.admissionDate,
    raw: admission,
  }));

  const columns = [
    {
      key: 'admissionNo',
      label: 'Admission',
      sortable: true,
      sortKey: 'admissionNo',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 700 }}>{value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formatDate(row.admissionDate)}
          </div>
        </div>
      ),
    },
    {
      key: 'patientName',
      label: 'Patient',
      sortable: true,
      sortKey: 'patientName',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 700 }}>{value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {row.patientId} | {row.phone}
          </div>
        </div>
      ),
    },
    { key: 'wardName', label: 'Ward', sortable: false },
    { key: 'roomNumber', label: 'Room', sortable: false },
    { key: 'bedNumber', label: 'Bed', sortable: false },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'status',
      render: (value) => (
        <Badge color={getStatusColor(value)}>
          {String(value).replaceAll('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
  ];

  const totalCharges = useMemo(() => {
    const charges = selectedAdmission?.charges || [];
    return charges.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }, [selectedAdmission]);

  const calculatedSettlement = useMemo(() => {
    const discount = Number(settlementForm.discount || 0);
    const advancePaid = Number(settlementForm.advancePaid || 0);
    const paidAmount = Number(settlementForm.paidAmount || 0);
    const balance = totalCharges - discount - advancePaid - paidAmount;

    return {
      totalCharges,
      balanceAmount: balance,
    };
  }, [settlementForm, totalCharges]);

  const StaffSelect = useCallback(
    ({ value, onChange, placeholder = 'Select Staff' }) => (
      <StaffSearchSelect
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        staffList={staffList}
        loading={staffLoading}
      />
    ),
    [staffList, staffLoading]
  );

  const openView = async (admission) => {
    try {
      const full = await loadFullAdmission(admission);
      setSelectedAdmission(full);
      setViewOpen(true);
    } catch (error) {
      console.error(error);
      toast.error('Failed to open IPD record');
    }
  };

  const openLabOrder = async (admission) => {
    const full = await loadFullAdmission(admission);
    setSelectedAdmission(full);
    setLabForm(emptyLabOrder);
    setLabOpen(true);
  };

  const openMedicineIssue = async (admission) => {
    const full = await loadFullAdmission(admission);
    setSelectedAdmission(full);
    setMedicineForm(emptyMedicineIssue);
    setItemSearch('');
    setMedicineOpen(true);
  };

  const openCharge = async (admission) => {
    const full = await loadFullAdmission(admission);
    setSelectedAdmission(full);
    setChargeForm(emptyCharge);
    setChargeOpen(true);
  };

  const openDischargeSummary = async (admission) => {
    const full = await loadFullAdmission(admission);
    setSelectedAdmission(full);

    setSummaryForm({
      ...emptyDischargeSummary,
      ...(full.dischargeSummaryDetails || {}),
      followUpDate: full.dischargeSummaryDetails?.followUpDate
        ? String(full.dischargeSummaryDetails.followUpDate).slice(0, 10)
        : '',
    });

    setSummaryOpen(true);
  };

  const openSettlement = async (admission) => {
    const full = await loadFullAdmission(admission);
    setSelectedAdmission(full);

    setSettlementForm({
      ...emptySettlement,
      ...(full.finalSettlement || {}),
    });

    setSettlementOpen(true);
  };

  const openBedRelease = async (admission) => {
    const full = await loadFullAdmission(admission);
    setSelectedAdmission(full);
    setBedReleaseForm(emptyBedRelease);
    setBedReleaseOpen(true);
  };

  const addLabTestRow = () => {
    setLabForm((prev) => ({
      ...prev,
      tests: [
        ...prev.tests,
        {
          testName: '',
          testCode: '',
          sampleType: '',
          priority: 'routine',
          amount: 0,
        },
      ],
    }));
  };

  const updateLabTest = (index, field, value) => {
    setLabForm((prev) => ({
      ...prev,
      tests: prev.tests.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      ),
    }));
  };

  const removeLabTest = (index) => {
    setLabForm((prev) => ({
      ...prev,
      tests: prev.tests.filter((_, i) => i !== index),
    }));
  };

  const saveLabOrder = async () => {
    if (!selectedAdmission?._id) return;

    const validTests = labForm.tests.filter((row) => row.testName.trim());

    if (!validTests.length) {
      toast.error('At least one lab test is required');
      return;
    }

    try {
      await ipdAPI.addLabOrder(selectedAdmission._id, {
        ...labForm,
        tests: validTests.map((row) => ({
          ...row,
          amount: Number(row.amount || 0),
        })),
      });

      toast.success('Lab order added');
      setLabOpen(false);
      await loadAdmissions();

      if (viewOpen) {
        refreshSelectedAdmission(selectedAdmission._id);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to add lab order');
    }
  };

  const addMedicineFromItem = (item) => {
    const existing = medicineForm.items.some(
      (row) => String(row.item) === String(item._id)
    );

    if (existing) {
      toast.error('Medicine already added');
      return;
    }

    setMedicineForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item: item._id,
          itemId: item.itemId || '',
          itemName: item.name || '',
          batchNo: '',
          quantity: 1,
          unit: item.unit || '',
          price: Number(item.sellingPrice || item.price || item.mrp || 0),
          amount: Number(item.sellingPrice || item.price || item.mrp || 0),
        },
      ],
    }));

    setItemSearch('');
  };

  const updateMedicineItem = (index, field, value) => {
    setMedicineForm((prev) => ({
      ...prev,
      items: prev.items.map((row, i) => {
        if (i !== index) return row;

        const updated = {
          ...row,
          [field]: value,
        };

        const quantity = Number(
          field === 'quantity' ? value : updated.quantity || 0
        );

        const price = Number(field === 'price' ? value : updated.price || 0);

        updated.amount = quantity * price;

        return updated;
      }),
    }));
  };

  const removeMedicineItem = (index) => {
    setMedicineForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const saveMedicineIssue = async () => {
    if (!selectedAdmission?._id) return;

    if (!medicineForm.items.length) {
      toast.error('At least one medicine is required');
      return;
    }

    try {
      await ipdAPI.issueMedicine(selectedAdmission._id, {
        ...medicineForm,
        items: medicineForm.items.map((row) => ({
          ...row,
          quantity: Number(row.quantity || 1),
          price: Number(row.price || 0),
        })),
      });

      toast.success('Medicine issued');
      setMedicineOpen(false);
      await loadAdmissions();

      if (viewOpen) {
        refreshSelectedAdmission(selectedAdmission._id);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to issue medicine');
    }
  };

  const updateChargeField = (field, value) => {
    const next = {
      ...chargeForm,
      [field]: value,
    };

    if (field === 'quantity' || field === 'rate') {
      next.amount = Number(next.quantity || 0) * Number(next.rate || 0);
    }

    setChargeForm(next);
  };

  const saveCharge = async () => {
    if (!selectedAdmission?._id) return;

    if (!chargeForm.description.trim()) {
      toast.error('Charge description is required');
      return;
    }

    try {
      await ipdAPI.addIpdCharge(selectedAdmission._id, {
        ...chargeForm,
        quantity: Number(chargeForm.quantity || 1),
        rate: Number(chargeForm.rate || 0),
        amount: Number(chargeForm.amount || 0),
      });

      toast.success('IPD charge added');
      setChargeOpen(false);
      await loadAdmissions();

      if (viewOpen) {
        refreshSelectedAdmission(selectedAdmission._id);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to add charge');
    }
  };

  const saveDischargeSummary = async () => {
    if (!selectedAdmission?._id) return;

    try {
      await ipdAPI.saveDischargeSummary(selectedAdmission._id, {
        ...summaryForm,
        followUpDate: summaryForm.followUpDate || undefined,
      });

      toast.success('Discharge summary saved');
      setSummaryOpen(false);
      await loadAdmissions();

      if (viewOpen) {
        refreshSelectedAdmission(selectedAdmission._id);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save discharge summary');
    }
  };

  const saveSettlement = async () => {
    if (!selectedAdmission?._id) return;

    try {
      await ipdAPI.saveFinalSettlement(selectedAdmission._id, {
        ...settlementForm,
        discount: Number(settlementForm.discount || 0),
        advancePaid: Number(settlementForm.advancePaid || 0),
        paidAmount: Number(settlementForm.paidAmount || 0),
      });

      toast.success('Final settlement saved');
      setSettlementOpen(false);
      await loadAdmissions();

      if (viewOpen) {
        refreshSelectedAdmission(selectedAdmission._id);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save settlement');
    }
  };

  const releaseBed = async () => {
    if (!selectedAdmission?._id) return;

    if (!window.confirm('Release bed for this patient?')) return;

    try {
      await ipdAPI.releaseBed(selectedAdmission._id, bedReleaseForm);

      toast.success('Bed released');
      setBedReleaseOpen(false);
      await loadAdmissions();

      if (viewOpen) {
        refreshSelectedAdmission(selectedAdmission._id);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to release bed');
    }
  };

  const printDischargeSummary = () => {
    if (!selectedAdmission) return;

    const summary = selectedAdmission.dischargeSummaryDetails || {};
    const settlement = selectedAdmission.finalSettlement || {};

    const html = `
      <html>
      <head>
        <title>Discharge Summary</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #111827; }
          h1 { text-align: center; margin-bottom: 4px; }
          .sub { text-align: center; color: #6b7280; margin-bottom: 24px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
          .box { border: 1px solid #d1d5db; padding: 10px; border-radius: 8px; }
          .label { color: #6b7280; font-size: 12px; margin-bottom: 4px; }
          .value { font-weight: 700; }
          .section { margin-top: 20px; }
          .section h3 { border-bottom: 1px solid #111827; padding-bottom: 6px; }
          .footer { margin-top: 60px; display: flex; justify-content: space-between; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Discharge Summary</h1>
        <div class="sub">IPD Admission: ${selectedAdmission.admissionNo || '-'}</div>

        <div class="grid">
          <div class="box"><div class="label">Patient</div><div class="value">${selectedAdmission.patientName || '-'}</div></div>
          <div class="box"><div class="label">Patient ID</div><div class="value">${selectedAdmission.patientId || '-'}</div></div>
          <div class="box"><div class="label">Phone</div><div class="value">${selectedAdmission.phone || '-'}</div></div>
          <div class="box"><div class="label">Age / Gender</div><div class="value">${selectedAdmission.age || '-'} / ${selectedAdmission.gender || '-'}</div></div>
          <div class="box"><div class="label">Ward / Room / Bed</div><div class="value">${selectedAdmission.wardName || '-'} / ${selectedAdmission.roomNumber || '-'} / ${selectedAdmission.bedNumber || '-'}</div></div>
          <div class="box"><div class="label">Admission Date</div><div class="value">${formatDate(selectedAdmission.admissionDate)}</div></div>
          <div class="box"><div class="label">Doctor</div><div class="value">${selectedAdmission.consultantDoctorName || selectedAdmission.doctorName || '-'}</div></div>
          <div class="box"><div class="label">Prepared By</div><div class="value">${summary.preparedByName || '-'}</div></div>
        </div>

        <div class="section"><h3>Final Diagnosis</h3><p>${summary.finalDiagnosis || '-'}</p></div>
        <div class="section"><h3>Hospital Course</h3><p>${summary.hospitalCourse || '-'}</p></div>
        <div class="section"><h3>Treatment Given</h3><p>${summary.treatmentGiven || '-'}</p></div>
        <div class="section"><h3>Condition On Discharge</h3><p>${summary.conditionOnDischarge || '-'}</p></div>
        <div class="section"><h3>Discharge Advice</h3><p>${summary.dischargeAdvice || '-'}</p></div>
        <div class="section"><h3>Settlement</h3>
          <p>Total: ${formatAmount(settlement.totalCharges)} |
          Paid: ${formatAmount(settlement.paidAmount)} |
          Balance: ${formatAmount(settlement.balanceAmount)}</p>
        </div>

        <div class="footer">
          <div>Generated: ${new Date().toLocaleString('en-IN')}</div>
          <div>Doctor Signature</div>
        </div>

        <script>
          window.onload = function () {
            window.print();
            setTimeout(function () { window.close(); }, 1000);
          };
        </script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=1000,height=800');

    if (!win) {
      toast.error('Popup blocked. Please allow popups.');
      return;
    }

    win.document.write(html);
    win.document.close();
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={pageHeader}>
        <div>
          <h1 style={{ margin: 0 }}>IPD Billing & Discharge</h1>
          <p style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            Lab orders, medicine issue, IPD charges, final settlement, bed release and reports
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={loadAdmissions} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={loadReports}>
            Reports
          </Button>
        </div>
      </div>

      <div style={filterBar}>
        <div style={{ minWidth: 180 }}>
          <FormField label="Filter by Status">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      <DataTable
        title="IPD Billing Records"
        subtitle="Search by admission number, patient name, phone, ward, room or bed"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No IPD records found."
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        onPageChange={(newPage) =>
          setPagination((prev) => ({ ...prev, page: newPage }))
        }
        onPageSizeChange={(newLimit) =>
          setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }))
        }
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        onSortChange={({ sortBy, sortOrder }) => {
          setSortConfig({ sortBy, sortOrder });
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        actions={({ row }) => (
          <>
            <Button size="sm" variant="secondary" onClick={() => openView(row.raw)}>
              View
            </Button>

            {row.raw.status === 'admitted' && (
              <>
                <Button size="sm" variant="outline" onClick={() => openLabOrder(row.raw)}>
                  Lab
                </Button>
                <Button size="sm" variant="outline" onClick={() => openMedicineIssue(row.raw)}>
                  Medicine
                </Button>
                <Button size="sm" variant="outline" onClick={() => openCharge(row.raw)}>
                  Charge
                </Button>
                <Button size="sm" variant="outline" onClick={() => openDischargeSummary(row.raw)}>
                  Summary
                </Button>
              </>
            )}

            {(row.raw.status === 'settlement_pending' ||
              row.raw.status === 'admitted') && (
              <Button size="sm" variant="outline" onClick={() => openSettlement(row.raw)}>
                Settlement
              </Button>
            )}

            {row.raw.status === 'settled' && (
              <Button size="sm" variant="danger" onClick={() => openBedRelease(row.raw)}>
                Bed Release
              </Button>
            )}
          </>
        )}
      />

      {/* View Modal */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="IPD Billing Details"
        width="90%"
        footer={false}
        bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {selectedAdmission && (
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={infoGrid}>
              <Info label="Admission No" value={selectedAdmission.admissionNo} />
              <Info label="Patient" value={selectedAdmission.patientName} />
              <Info label="Patient ID" value={selectedAdmission.patientId} />
              <Info label="Phone" value={selectedAdmission.phone} />
              <Info label="Ward" value={selectedAdmission.wardName} />
              <Info label="Room" value={selectedAdmission.roomNumber} />
              <Info label="Bed" value={selectedAdmission.bedNumber} />
              <Info label="Status" value={selectedAdmission.status} />
            </div>

            <div style={viewActionBar}>
              <Button variant="secondary" onClick={printDischargeSummary}>
                Print Discharge Summary
              </Button>
            </div>

            <RecordSection title="Lab Orders">
              {selectedAdmission.labOrders?.length ? (
                selectedAdmission.labOrders.slice().reverse().map((order) => (
                  <div key={order._id} style={recordCard}>
                    <div style={recordHeader}>
                      <strong>{order.orderNo}</strong>
                      <Badge color="blue">{order.status}</Badge>
                    </div>
                    <Info label="Ordered At" value={formatDate(order.orderedAt)} />
                    <Info label="Ordered By" value={order.orderedByName} />
                    <Info label="Total" value={formatAmount(order.totalAmount)} />

                    <div style={{ marginTop: 12 }}>
                      {order.tests?.map((test) => (
                        <div key={test._id} style={miniRow}>
                          <span>{test.testName}</span>
                          <span>{test.sampleType || '—'}</span>
                          <span>{test.priority}</span>
                          <strong>{formatAmount(test.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyText text="No lab orders" />
              )}
            </RecordSection>

            <RecordSection title="Medicine Issues">
              {selectedAdmission.medicineIssues?.length ? (
                selectedAdmission.medicineIssues.slice().reverse().map((issue) => (
                  <div key={issue._id} style={recordCard}>
                    <div style={recordHeader}>
                      <strong>{issue.issueNo}</strong>
                      <Badge color="green">{issue.status}</Badge>
                    </div>
                    <Info label="Issued At" value={formatDate(issue.issuedAt)} />
                    <Info label="Issued By" value={issue.issuedByName} />
                    <Info label="Total" value={formatAmount(issue.totalAmount)} />

                    <div style={{ marginTop: 12 }}>
                      {issue.items?.map((item) => (
                        <div key={item._id} style={miniRow}>
                          <span>{item.itemName}</span>
                          <span>Qty: {item.quantity}</span>
                          <span>{formatAmount(item.price)}</span>
                          <strong>{formatAmount(item.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyText text="No medicine issues" />
              )}
            </RecordSection>

            <RecordSection title="IPD Charges">
              {selectedAdmission.charges?.length ? (
                <>
                  {selectedAdmission.charges.slice().reverse().map((charge) => (
                    <div key={charge._id} style={miniRow}>
                      <span>{charge.description}</span>
                      <span>{charge.chargeType}</span>
                      <span>
                        {charge.quantity} × {formatAmount(charge.rate)}
                      </span>
                      <strong>{formatAmount(charge.amount)}</strong>
                    </div>
                  ))}

                  <div style={totalBox}>
                    Total Charges: {formatAmount(totalCharges)}
                  </div>
                </>
              ) : (
                <EmptyText text="No charges added" />
              )}
            </RecordSection>

            <RecordSection title="Discharge Summary">
              {selectedAdmission.dischargeSummaryDetails?.status ? (
                <div style={recordCard}>
                  <Info
                    label="Final Diagnosis"
                    value={selectedAdmission.dischargeSummaryDetails.finalDiagnosis}
                  />
                  <Info
                    label="Hospital Course"
                    value={selectedAdmission.dischargeSummaryDetails.hospitalCourse}
                  />
                  <Info
                    label="Treatment Given"
                    value={selectedAdmission.dischargeSummaryDetails.treatmentGiven}
                  />
                  <Info
                    label="Condition On Discharge"
                    value={selectedAdmission.dischargeSummaryDetails.conditionOnDischarge}
                  />
                  <Info
                    label="Discharge Advice"
                    value={selectedAdmission.dischargeSummaryDetails.dischargeAdvice}
                  />
                  <Info
                    label="Follow-up Date"
                    value={formatDate(selectedAdmission.dischargeSummaryDetails.followUpDate)}
                  />
                </div>
              ) : (
                <EmptyText text="No discharge summary prepared" />
              )}
            </RecordSection>

            <RecordSection title="Final Settlement">
              {selectedAdmission.finalSettlement?.status ? (
                <div style={infoGrid}>
                  <Info
                    label="Total Charges"
                    value={formatAmount(selectedAdmission.finalSettlement.totalCharges)}
                  />
                  <Info
                    label="Discount"
                    value={formatAmount(selectedAdmission.finalSettlement.discount)}
                  />
                  <Info
                    label="Advance Paid"
                    value={formatAmount(selectedAdmission.finalSettlement.advancePaid)}
                  />
                  <Info
                    label="Paid Amount"
                    value={formatAmount(selectedAdmission.finalSettlement.paidAmount)}
                  />
                  <Info
                    label="Balance"
                    value={formatAmount(selectedAdmission.finalSettlement.balanceAmount)}
                  />
                  <Info
                    label="Payment Mode"
                    value={selectedAdmission.finalSettlement.paymentMode}
                  />
                  <Info
                    label="Status"
                    value={selectedAdmission.finalSettlement.status}
                  />
                  <Info
                    label="Settled By"
                    value={selectedAdmission.finalSettlement.settledByName}
                  />
                </div>
              ) : (
                <EmptyText text="Settlement not done" />
              )}
            </RecordSection>
          </div>
        )}
      </Modal>

      {/* Lab Order Modal */}
      <Modal
        open={labOpen}
        onClose={() => setLabOpen(false)}
        title="Lab Order from IPD"
        confirmLabel="Save Lab Order"
        onConfirm={saveLabOrder}
        width="85%"
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={twoColumnGrid}>
            <FormField label="Ordered By">
              <StaffSelect
                value={labForm.orderedByName}
                onChange={(value) =>
                  setLabForm({ ...labForm, orderedByName: value })
                }
                placeholder="Select Ordered By"
              />
            </FormField>

            <FormField label="Notes">
              <input
                value={labForm.notes}
                onChange={(e) =>
                  setLabForm({ ...labForm, notes: e.target.value })
                }
              />
            </FormField>
          </div>

          {labForm.tests.map((test, index) => (
            <div key={index} style={lineCard}>
              <div style={fiveColumnGrid}>
                <FormField label="Test Name" required>
                  <input
                    value={test.testName}
                    onChange={(e) => updateLabTest(index, 'testName', e.target.value)}
                  />
                </FormField>

                <FormField label="Test Code">
                  <input
                    value={test.testCode}
                    onChange={(e) => updateLabTest(index, 'testCode', e.target.value)}
                  />
                </FormField>

                <FormField label="Sample Type">
                  <input
                    value={test.sampleType}
                    onChange={(e) => updateLabTest(index, 'sampleType', e.target.value)}
                  />
                </FormField>

                <FormField label="Priority">
                  <select
                    value={test.priority}
                    onChange={(e) => updateLabTest(index, 'priority', e.target.value)}
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT</option>
                  </select>
                </FormField>

                <FormField label="Amount">
                  <input
                    type="number"
                    min="0"
                    value={test.amount}
                    onChange={(e) => updateLabTest(index, 'amount', e.target.value)}
                  />
                </FormField>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => removeLabTest(index)}
                  disabled={labForm.tests.length === 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}

          <div>
            <Button variant="secondary" onClick={addLabTestRow}>
              + Add Test
            </Button>
          </div>
        </div>
      </Modal>

      {/* Medicine Issue Modal */}
      <Modal
        open={medicineOpen}
        onClose={() => setMedicineOpen(false)}
        title="Medicine Issue from IPD"
        confirmLabel="Issue Medicine"
        onConfirm={saveMedicineIssue}
        width="90%"
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={twoColumnGrid}>
            <FormField label="Issued By">
              <StaffSelect
                value={medicineForm.issuedByName}
                onChange={(value) =>
                  setMedicineForm({
                    ...medicineForm,
                    issuedByName: value,
                  })
                }
                placeholder="Select Issued By"
              />
            </FormField>

            <FormField label="Notes">
              <input
                value={medicineForm.notes}
                onChange={(e) =>
                  setMedicineForm({ ...medicineForm, notes: e.target.value })
                }
              />
            </FormField>
          </div>

          <FormField label="Search Medicine">
            <input
              placeholder="Search by medicine name or item ID"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
            />
          </FormField>

          <div style={searchResultBox}>
            {itemsLoading ? (
              <EmptyText text="Searching medicines..." />
            ) : items.length ? (
              items.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  style={medicineSearchCard}
                  onClick={() => addMedicineFromItem(item)}
                >
                  <strong>{item.name}</strong>
                  <span>
                    {item.itemId || '—'} | Stock: {item.currentStock || 0} | Rate:{' '}
                    {formatAmount(item.sellingPrice || item.price || item.mrp || 0)}
                  </span>
                </button>
              ))
            ) : (
              <EmptyText text="No medicines found" />
            )}
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {medicineForm.items.map((item, index) => (
              <div key={index} style={lineCard}>
                <div style={fiveColumnGrid}>
                  <FormField label="Medicine">
                    <input value={item.itemName} readOnly />
                  </FormField>

                  <FormField label="Batch">
                    <input
                      value={item.batchNo}
                      onChange={(e) =>
                        updateMedicineItem(index, 'batchNo', e.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Qty">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateMedicineItem(index, 'quantity', e.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Price">
                    <input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) =>
                        updateMedicineItem(index, 'price', e.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Amount">
                    <input value={formatAmount(item.amount)} readOnly />
                  </FormField>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => removeMedicineItem(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div style={totalBox}>
            Medicine Total:{' '}
            {formatAmount(
              medicineForm.items.reduce(
                (sum, item) => sum + Number(item.amount || 0),
                0
              )
            )}
          </div>
        </div>
      </Modal>

      {/* Charge Modal */}
      <Modal
        open={chargeOpen}
        onClose={() => setChargeOpen(false)}
        title="Add IPD Charge"
        confirmLabel="Save Charge"
        onConfirm={saveCharge}
        width="70%"
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={twoColumnGrid}>
            <FormField label="Charge Type">
              <select
                value={chargeForm.chargeType}
                onChange={(e) => updateChargeField('chargeType', e.target.value)}
              >
                {chargeTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Added By">
              <StaffSelect
                value={chargeForm.addedByName}
                onChange={(value) => updateChargeField('addedByName', value)}
                placeholder="Select Added By"
              />
            </FormField>
          </div>

          <FormField label="Description" required>
            <input
              value={chargeForm.description}
              onChange={(e) => updateChargeField('description', e.target.value)}
            />
          </FormField>

          <div style={threeColumnGrid}>
            <FormField label="Quantity">
              <input
                type="number"
                min="1"
                value={chargeForm.quantity}
                onChange={(e) => updateChargeField('quantity', e.target.value)}
              />
            </FormField>

            <FormField label="Rate">
              <input
                type="number"
                min="0"
                value={chargeForm.rate}
                onChange={(e) => updateChargeField('rate', e.target.value)}
              />
            </FormField>

            <FormField label="Amount">
              <input
                type="number"
                min="0"
                value={chargeForm.amount}
                onChange={(e) => updateChargeField('amount', e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* Discharge Summary Modal */}
      <Modal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title="Discharge Summary"
        confirmLabel="Save Summary"
        onConfirm={saveDischargeSummary}
        width="80%"
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={twoColumnGrid}>
            <FormField label="Prepared By">
              <StaffSelect
                value={summaryForm.preparedByName}
                onChange={(value) =>
                  setSummaryForm({
                    ...summaryForm,
                    preparedByName: value,
                  })
                }
                placeholder="Select Prepared By"
              />
            </FormField>

            <FormField label="Follow-up Date">
              <input
                type="date"
                value={summaryForm.followUpDate}
                onChange={(e) =>
                  setSummaryForm({
                    ...summaryForm,
                    followUpDate: e.target.value,
                  })
                }
              />
            </FormField>
          </div>

          <FormField label="Final Diagnosis">
            <textarea
              rows={3}
              value={summaryForm.finalDiagnosis}
              onChange={(e) =>
                setSummaryForm({
                  ...summaryForm,
                  finalDiagnosis: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Hospital Course">
            <textarea
              rows={4}
              value={summaryForm.hospitalCourse}
              onChange={(e) =>
                setSummaryForm({
                  ...summaryForm,
                  hospitalCourse: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Treatment Given">
            <textarea
              rows={4}
              value={summaryForm.treatmentGiven}
              onChange={(e) =>
                setSummaryForm({
                  ...summaryForm,
                  treatmentGiven: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Condition On Discharge">
            <textarea
              rows={3}
              value={summaryForm.conditionOnDischarge}
              onChange={(e) =>
                setSummaryForm({
                  ...summaryForm,
                  conditionOnDischarge: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Discharge Advice">
            <textarea
              rows={4}
              value={summaryForm.dischargeAdvice}
              onChange={(e) =>
                setSummaryForm({
                  ...summaryForm,
                  dischargeAdvice: e.target.value,
                })
              }
            />
          </FormField>
        </div>
      </Modal>

      {/* Settlement Modal */}
      <Modal
        open={settlementOpen}
        onClose={() => setSettlementOpen(false)}
        title="Final Settlement"
        confirmLabel="Save Settlement"
        onConfirm={saveSettlement}
        width="70%"
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={summaryAmountBox}>
            <div>Total Charges</div>
            <strong>{formatAmount(calculatedSettlement.totalCharges)}</strong>
          </div>

          <div style={threeColumnGrid}>
            <FormField label="Discount">
              <input
                type="number"
                min="0"
                value={settlementForm.discount}
                onChange={(e) =>
                  setSettlementForm({
                    ...settlementForm,
                    discount: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Advance Paid">
              <input
                type="number"
                min="0"
                value={settlementForm.advancePaid}
                onChange={(e) =>
                  setSettlementForm({
                    ...settlementForm,
                    advancePaid: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Paid Amount">
              <input
                type="number"
                min="0"
                value={settlementForm.paidAmount}
                onChange={(e) =>
                  setSettlementForm({
                    ...settlementForm,
                    paidAmount: e.target.value,
                  })
                }
              />
            </FormField>
          </div>

          <div style={summaryAmountBox}>
            <div>Balance Amount</div>
            <strong>{formatAmount(calculatedSettlement.balanceAmount)}</strong>
          </div>

          <div style={twoColumnGrid}>
            <FormField label="Payment Mode">
              <select
                value={settlementForm.paymentMode}
                onChange={(e) =>
                  setSettlementForm({
                    ...settlementForm,
                    paymentMode: e.target.value,
                  })
                }
              >
                {paymentModeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Payment Reference">
              <input
                value={settlementForm.paymentReference}
                onChange={(e) =>
                  setSettlementForm({
                    ...settlementForm,
                    paymentReference: e.target.value,
                  })
                }
              />
            </FormField>
          </div>

          <FormField label="Settled By">
            <StaffSelect
              value={settlementForm.settledByName}
              onChange={(value) =>
                setSettlementForm({
                  ...settlementForm,
                  settledByName: value,
                })
              }
              placeholder="Select Settled By"
            />
          </FormField>
        </div>
      </Modal>

      {/* Bed Release Modal */}
      <Modal
        open={bedReleaseOpen}
        onClose={() => setBedReleaseOpen(false)}
        title="Bed Release"
        confirmLabel="Release Bed"
        onConfirm={releaseBed}
        width="55%"
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={warningBox}>
            Bed release will make this bed available for another patient.
          </div>

          <FormField label="Released By">
            <StaffSelect
              value={bedReleaseForm.bedReleasedByName}
              onChange={(value) =>
                setBedReleaseForm({
                  ...bedReleaseForm,
                  bedReleasedByName: value,
                })
              }
              placeholder="Select Released By"
            />
          </FormField>
        </div>
      </Modal>

      {/* Reports Modal */}
      <Modal
        open={reportsOpen}
        onClose={() => setReportsOpen(false)}
        title="IPD Reports"
        width="85%"
        footer={false}
      >
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={twoColumnGrid}>
            <FormField label="From">
              <input
                type="date"
                value={reportFilter.from}
                onChange={(e) =>
                  setReportFilter({ ...reportFilter, from: e.target.value })
                }
              />
            </FormField>

            <FormField label="To">
              <input
                type="date"
                value={reportFilter.to}
                onChange={(e) =>
                  setReportFilter({ ...reportFilter, to: e.target.value })
                }
              />
            </FormField>
          </div>

          <div>
            <Button onClick={loadReports}>Apply Filter</Button>
          </div>

          {reports && (
            <>
              <div style={reportGrid}>
                <ReportCard label="Total Admissions" value={reports.totalAdmissions} />
                <ReportCard label="Active Admissions" value={reports.activeAdmissions} />
                <ReportCard label="Discharged" value={reports.dischargedAdmissions} />
                <ReportCard label="Settled" value={reports.settledAdmissions} />
                <ReportCard
                  label="Total Charges"
                  value={formatAmount(reports.revenue?.totalCharges)}
                />
                <ReportCard
                  label="Total Paid"
                  value={formatAmount(reports.revenue?.totalPaid)}
                />
                <ReportCard
                  label="Total Balance"
                  value={formatAmount(reports.revenue?.totalBalance)}
                />
                <ReportCard
                  label="Bed Occupancy"
                  value={`${reports.bedOccupancy?.occupancyPercentage || 0}%`}
                />
              </div>

              <RecordSection title="Bed Occupancy">
                <div style={infoGrid}>
                  <Info label="Total Beds" value={reports.bedOccupancy?.totalBeds} />
                  <Info label="Occupied Beds" value={reports.bedOccupancy?.occupiedBeds} />
                  <Info label="Available Beds" value={reports.bedOccupancy?.availableBeds} />
                </div>
              </RecordSection>

              <RecordSection title="Ward Wise Admissions">
                {reports.wardWiseAdmissions?.length ? (
                  reports.wardWiseAdmissions.map((row) => (
                    <div key={row._id || 'unknown'} style={miniRow}>
                      <strong>{row._id || 'Unknown Ward'}</strong>
                      <span>{row.count} admissions</span>
                    </div>
                  ))
                ) : (
                  <EmptyText text="No ward-wise report data" />
                )}
              </RecordSection>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 700, wordBreak: 'break-word' }}>
        {value || value === 0 ? value : '—'}
      </div>
    </div>
  );
}

function RecordSection({ title, children }) {
  return (
    <div style={sectionBox}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div style={{ display: 'grid', gap: 10 }}>{children}</div>
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <div
      style={{
        padding: 16,
        border: '1px dashed var(--border)',
        borderRadius: 10,
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
}

function ReportCard({ label, value }) {
  return (
    <div style={reportCard}>
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value || 0}</div>
    </div>
  );
}

const pageHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
};

const filterBar = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'flex-end',
};

const twoColumnGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
};

const threeColumnGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 14,
};

const fiveColumnGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 12,
};

const infoGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
};

const sectionBox = {
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 16,
  background: '#fff',
};

const recordCard = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 14,
  background: '#f9fafb',
};

const recordHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
};

const lineCard = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 12,
  background: '#fff',
};

const miniRow = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr',
  gap: 10,
  alignItems: 'center',
  padding: 10,
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: '#fff',
};

const totalBox = {
  padding: 14,
  borderRadius: 12,
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  fontWeight: 800,
  textAlign: 'right',
};

const summaryAmountBox = {
  padding: 16,
  borderRadius: 12,
  background: '#f9fafb',
  border: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 16,
};

const warningBox = {
  padding: 12,
  borderRadius: 10,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#991b1b',
  fontWeight: 700,
};

const searchResultBox = {
  display: 'grid',
  gap: 8,
  maxHeight: 220,
  overflowY: 'auto',
};

const medicineSearchCard = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: 10,
  background: '#fff',
  cursor: 'pointer',
  textAlign: 'left',
};

const viewActionBar = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
};

const reportGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
};

const reportCard = {
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 16,
  background: '#fff',
};