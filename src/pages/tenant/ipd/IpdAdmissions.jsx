// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../../../components/DataTable';
import Badge from '../../../components/Badge';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import { FormField } from '../../../components/FormField';

import {
  ipdAPI,
  patientAPI,
  wardAPI,
  roomAPI,
  bedAPI,
  staffAPI,
} from '../../../services/api';

const emptyAllocation = {
  patient: '',
  visitId: '',
  bed: '',
  admissionType: 'ipd',
  admissionDate: '',
  expectedDischargeDate: '',
  reasonForAdmission: '',
  consultantDoctorName: '',
};

const emptyVitals = {
  temperature: '',
  pulse: '',
  respiratoryRate: '',
  spo2: '',
  bpSystolic: '',
  bpDiastolic: '',
  bloodSugar: '',
  height: '',
  weight: '',
  bmi: '',
  painScore: '',
  notes: '',
  recordedByName: '',
};

const emptyNursingNote = {
  shift: 'general',
  category: 'general',
  note: '',
  actionTaken: '',
  recordedByName: '',
};

const emptyDoctorRound = {
  doctorName: '',
  complaints: '',
  examination: '',
  diagnosis: '',
  treatmentPlan: '',
  medicationChanges: '',
  investigationAdvice: '',
  followUpInstructions: '',
  nextRoundDate: '',
};

const emptyDischarge = {
  dischargeSummary: '',
  dischargeAdvice: '',
};

const admissionStatusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Admitted', value: 'admitted' },
  { label: 'Discharge Summary Prepared', value: 'discharge_summary_prepared' },
  { label: 'Settlement Pending', value: 'settlement_pending' },
  { label: 'Settled', value: 'settled' },
  { label: 'Bed Released', value: 'bed_released' },
  { label: 'Discharged', value: 'discharged' },
  { label: 'Cancelled', value: 'cancelled' },
];

const admissionTypeOptions = [
  { label: 'IPD', value: 'ipd' },
  { label: 'Day Care', value: 'day_care' },
  { label: 'Observation', value: 'observation' },
  { label: 'Emergency', value: 'emergency' },
];

const shiftOptions = [
  { label: 'General', value: 'general' },
  { label: 'Morning', value: 'morning' },
  { label: 'Afternoon', value: 'afternoon' },
  { label: 'Night', value: 'night' },
];

const nursingCategoryOptions = [
  { label: 'General', value: 'general' },
  { label: 'Medication', value: 'medication' },
  { label: 'Procedure', value: 'procedure' },
  { label: 'Food', value: 'food' },
  { label: 'Activity', value: 'activity' },
  { label: 'Incident', value: 'incident' },
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

export default function IpdAdmissions() {
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [loading, setLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [nursingOpen, setNursingOpen] = useState(false);
  const [doctorRoundOpen, setDoctorRoundOpen] = useState(false);
  const [dischargeOpen, setDischargeOpen] = useState(false);

  const [allocationForm, setAllocationForm] = useState(emptyAllocation);
  const [vitalsForm, setVitalsForm] = useState(emptyVitals);
  const [nursingForm, setNursingForm] = useState(emptyNursingNote);
  const [doctorRoundForm, setDoctorRoundForm] = useState(emptyDoctorRound);
  const [dischargeForm, setDischargeForm] = useState(emptyDischarge);

  const [patientSearch, setPatientSearch] = useState('');
  const [allocationWard, setAllocationWard] = useState('');
  const [allocationRoom, setAllocationRoom] = useState('');

  const [filterStatus, setFilterStatus] = useState('admitted');
  const [filterWard, setFilterWard] = useState('');
  const [filterRoom, setFilterRoom] = useState('');

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

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-IN');
  };

  const getStatusColor = (status) => {
    if (status === 'admitted') return 'green';
    if (status === 'discharge_summary_prepared') return 'yellow';
    if (status === 'settlement_pending') return 'yellow';
    if (status === 'settled') return 'blue';
    if (status === 'bed_released') return 'gray';
    if (status === 'discharged') return 'gray';
    if (status === 'cancelled') return 'red';
    return 'gray';
  };

  const getStatusLabel = (status) => {
    return String(status || 'admitted').replaceAll('_', ' ').toUpperCase();
  };

  const fetchAdmissions = useCallback(async () => {
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
      if (filterWard) params.ward = filterWard;
      if (filterRoom) params.room = filterRoom;

      const res = await ipdAPI.getAdmissions(params);

      setAdmissions(res.data?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1,
      }));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to fetch IPD admissions');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    sortConfig,
    searchQuery,
    filterStatus,
    filterWard,
    filterRoom,
  ]);

  const fetchPatients = useCallback(async (search = '') => {
    try {
      setPatientsLoading(true);

      const res = await patientAPI.getPatients({
        page: 1,
        limit: 20,
        search,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });

      setPatients(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch patients');
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  const fetchWards = useCallback(async () => {
    try {
      const res = await wardAPI.getWards({
        page: 1,
        limit: 500,
        status: 'active',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      setWards(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch wards');
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await roomAPI.getRooms({
        page: 1,
        limit: 1000,
        status: 'active',
        sortBy: 'roomNumber',
        sortOrder: 'asc',
      });

      setRooms(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch rooms');
    }
  }, []);

  const fetchAvailableBeds = useCallback(async () => {
    try {
      const params = {
        page: 1,
        limit: 1000,
        status: 'available',
        sortBy: 'bedNumber',
        sortOrder: 'asc',
      };

      if (allocationWard) params.ward = allocationWard;
      if (allocationRoom) params.room = allocationRoom;

      const res = await bedAPI.getBeds(params);
      setBeds(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch available beds');
    }
  }, [allocationWard, allocationRoom]);

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

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  useEffect(() => {
    fetchWards();
    fetchRooms();
    fetchStaff();
  }, [fetchWards, fetchRooms, fetchStaff]);

  useEffect(() => {
    if (allocateOpen) {
      fetchPatients(patientSearch);
    }
  }, [allocateOpen, patientSearch, fetchPatients]);

  useEffect(() => {
    if (allocateOpen) {
      fetchAvailableBeds();
    }
  }, [allocateOpen, fetchAvailableBeds]);

  const filteredRoomsForAllocation = useMemo(() => {
    if (!allocationWard) return rooms;

    return rooms.filter((room) => {
      const wardId = room.ward?._id || room.ward;
      return String(wardId) === String(allocationWard);
    });
  }, [rooms, allocationWard]);

  const filteredRoomsForFilter = useMemo(() => {
    if (!filterWard) return rooms;

    return rooms.filter((room) => {
      const wardId = room.ward?._id || room.ward;
      return String(wardId) === String(filterWard);
    });
  }, [rooms, filterWard]);

  const selectedPatientVisits = useMemo(() => {
    if (!selectedPatient?.visits?.length) return [];

    return [...selectedPatient.visits].sort(
      (a, b) => new Date(b.visitDate) - new Date(a.visitDate)
    );
  }, [selectedPatient]);

  const resetAllocation = () => {
    setAllocationForm(emptyAllocation);
    setSelectedPatient(null);
    setPatientSearch('');
    setAllocationWard('');
    setAllocationRoom('');
    setBeds([]);
  };

  const refreshSelectedAdmission = async (id) => {
    try {
      const res = await ipdAPI.getAdmissionById(id);
      setSelectedAdmission(res.data?.data || null);
    } catch (error) {
      console.error(error);
    }
  };

  const openAllocation = () => {
    resetAllocation();
    setAllocateOpen(true);
  };

  const handleSelectPatient = async (patient) => {
    try {
      setAllocationForm((prev) => ({
        ...prev,
        patient: patient._id,
        visitId: '',
      }));

      const res = await patientAPI.getPatientById(patient._id);
      const fullPatient = res.data?.data || patient;

      setSelectedPatient(fullPatient);
      setPatientSearch(`${patient.patientId || ''} ${patient.name || ''}`.trim());
    } catch (error) {
      console.error(error);
      toast.error('Failed to load patient details');
    }
  };

  const handleAllocateBed = async () => {
    if (!allocationForm.patient || !allocationForm.bed) {
      toast.error('Patient and bed are required');
      return;
    }

    try {
      await ipdAPI.allocateBed({
        ...allocationForm,
        admissionDate: allocationForm.admissionDate || undefined,
        expectedDischargeDate: allocationForm.expectedDischargeDate || undefined,
      });

      toast.success('Bed allocated successfully');
      setAllocateOpen(false);
      resetAllocation();
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchAdmissions();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to allocate bed');
    }
  };

  const openView = async (admission) => {
    try {
      const res = await ipdAPI.getAdmissionById(admission._id);
      setSelectedAdmission(res.data?.data || admission);
      setViewOpen(true);
    } catch (error) {
      console.error(error);
      toast.error('Failed to open admission');
    }
  };

  const openVitals = (admission) => {
    setSelectedAdmission(admission);
    setVitalsForm(emptyVitals);
    setVitalsOpen(true);
  };

  const openNursingNote = (admission) => {
    setSelectedAdmission(admission);
    setNursingForm(emptyNursingNote);
    setNursingOpen(true);
  };

  const openDoctorRound = (admission) => {
    setSelectedAdmission(admission);
    setDoctorRoundForm({
      ...emptyDoctorRound,
      doctorName:
        admission.consultantDoctorName ||
        admission.doctorName ||
        '',
    });
    setDoctorRoundOpen(true);
  };

  const openDischarge = (admission) => {
    setSelectedAdmission(admission);
    setDischargeForm(emptyDischarge);
    setDischargeOpen(true);
  };

  const handleSaveVitals = async () => {
    if (!selectedAdmission?._id) return;

    try {
      await ipdAPI.addVitals(selectedAdmission._id, vitalsForm);

      toast.success('Vitals saved');
      setVitalsOpen(false);
      setVitalsForm(emptyVitals);
      fetchAdmissions();

      if (viewOpen) {
        refreshSelectedAdmission(selectedAdmission._id);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save vitals');
    }
  };

  const handleSaveNursingNote = async () => {
    if (!selectedAdmission?._id) return;

    if (!nursingForm.note) {
      toast.error('Nursing note is required');
      return;
    }

    try {
      await ipdAPI.addNursingNote(selectedAdmission._id, nursingForm);

      toast.success('Nursing note saved');
      setNursingOpen(false);
      setNursingForm(emptyNursingNote);
      fetchAdmissions();

      if (viewOpen) {
        refreshSelectedAdmission(selectedAdmission._id);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save nursing note');
    }
  };

  const handleSaveDoctorRound = async () => {
    if (!selectedAdmission?._id) return;

    try {
      await ipdAPI.addDoctorRound(selectedAdmission._id, {
        ...doctorRoundForm,
        nextRoundDate: doctorRoundForm.nextRoundDate || undefined,
      });

      toast.success('Doctor round saved');
      setDoctorRoundOpen(false);
      setDoctorRoundForm(emptyDoctorRound);
      fetchAdmissions();

      if (viewOpen) {
        refreshSelectedAdmission(selectedAdmission._id);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save doctor round');
    }
  };

  const handleDischarge = async () => {
    if (!selectedAdmission?._id) return;

    if (!window.confirm('Prepare discharge summary for this patient?')) return;

    try {
      await ipdAPI.dischargeAdmission(selectedAdmission._id, dischargeForm);

      toast.success('Discharge summary saved. Final settlement is pending.');
      setDischargeOpen(false);
      setDischargeForm(emptyDischarge);
      fetchAdmissions();

      if (viewOpen) {
        refreshSelectedAdmission(selectedAdmission._id);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to prepare discharge');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = ({ sortBy, sortOrder }) => {
    setSortConfig({ sortBy, sortOrder });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const tableRows = admissions.map((admission) => ({
    id: admission._id,
    admissionNo: admission.admissionNo || '—',
    patientName: admission.patientName || admission.patient?.name || '—',
    patientId: admission.patientId || admission.patient?.patientId || '',
    phone: admission.phone || admission.patient?.phone || '—',
    wardName: admission.wardName || admission.ward?.name || '—',
    roomNumber: admission.roomNumber || admission.room?.roomNumber || '—',
    bedNumber: admission.bedNumber || admission.bed?.bedNumber || '—',
    doctorName: admission.consultantDoctorName || admission.doctorName || '—',
    admissionDate: admission.admissionDate,
    status: admission.status || 'admitted',
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
            {row.patientId || '—'} | {row.phone}
          </div>
        </div>
      ),
    },
    {
      key: 'wardName',
      label: 'Ward',
      sortable: false,
    },
    {
      key: 'roomNumber',
      label: 'Room',
      sortable: false,
    },
    {
      key: 'bedNumber',
      label: 'Bed',
      sortable: false,
    },
    {
      key: 'doctorName',
      label: 'Doctor',
      sortable: false,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'status',
      render: (value) => (
        <Badge color={getStatusColor(value)}>
          {getStatusLabel(value)}
        </Badge>
      ),
    },
  ];

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

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={pageHeader}>
        <div>
          <h1 style={{ margin: 0 }}>IPD Admissions</h1>
          <p style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            Bed allocation, vitals entry, nursing notes, doctor rounds and discharge preparation
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={fetchAdmissions} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={openAllocation}>
            + Allocate Bed
          </Button>
        </div>
      </div>

      <div style={filterBar}>
        <div style={{ minWidth: 170 }}>
          <FormField label="Filter by Status">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              {admissionStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div style={{ minWidth: 180 }}>
          <FormField label="Filter by Ward">
            <select
              value={filterWard}
              onChange={(e) => {
                setFilterWard(e.target.value);
                setFilterRoom('');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Wards</option>
              {wards.map((ward) => (
                <option key={ward._id} value={ward._id}>
                  {ward.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div style={{ minWidth: 180 }}>
          <FormField label="Filter by Room">
            <select
              value={filterRoom}
              onChange={(e) => {
                setFilterRoom(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Rooms</option>
              {filteredRoomsForFilter.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.roomNumber} {room.name ? `- ${room.name}` : ''}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      <DataTable
        title="Current IPD Admissions"
        subtitle="Search by admission no, patient name, phone, ward, room or bed"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No IPD admissions found."
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        actions={({ row }) => (
          <>
            <Button size="sm" variant="secondary" onClick={() => openView(row.raw)}>
              View
            </Button>

            {row.raw.status === 'admitted' && (
              <>
                <Button size="sm" variant="outline" onClick={() => openVitals(row.raw)}>
                  Vitals
                </Button>

                <Button size="sm" variant="outline" onClick={() => openNursingNote(row.raw)}>
                  Nursing
                </Button>

                <Button size="sm" variant="outline" onClick={() => openDoctorRound(row.raw)}>
                  Round
                </Button>

                <Button size="sm" variant="danger" onClick={() => openDischarge(row.raw)}>
                  Prepare Discharge
                </Button>
              </>
            )}

            {row.raw.status === 'settlement_pending' && (
              <Badge color="yellow">SETTLEMENT PENDING</Badge>
            )}

            {row.raw.status === 'settled' && (
              <Badge color="blue">READY FOR BED RELEASE</Badge>
            )}

            {row.raw.status === 'bed_released' && (
              <Badge color="gray">BED RELEASED</Badge>
            )}
          </>
        )}
      />

      <Modal
        open={allocateOpen}
        onClose={() => {
          setAllocateOpen(false);
          resetAllocation();
        }}
        title="Bed Allocation"
        confirmLabel="Allocate Bed"
        onConfirm={handleAllocateBed}
        width="85%"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={sectionBox}>
            <h3 style={sectionTitle}>Patient Selection</h3>

            <FormField label="Search Patient">
              <input
                placeholder="Search by patient ID, name or phone"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </FormField>

            <div style={searchResultBox}>
              {patientsLoading ? (
                <div style={mutedText}>Searching patients...</div>
              ) : patients.length === 0 ? (
                <div style={mutedText}>No patients found</div>
              ) : (
                patients.map((patient) => {
                  const selected = String(allocationForm.patient) === String(patient._id);

                  return (
                    <button
                      key={patient._id}
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      style={{
                        ...patientCard,
                        border: selected ? '1px solid #2563eb' : '1px solid var(--border)',
                        background: selected ? '#eff6ff' : '#fff',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>
                        {patient.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {patient.patientId || '—'} | {patient.phone || '—'} | Visits:{' '}
                        {patient.visitCount || 0}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {selectedPatient && (
              <div style={selectedBox}>
                <div style={{ fontWeight: 700 }}>
                  Selected: {selectedPatient.name}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {selectedPatient.patientId} | {selectedPatient.phone} |{' '}
                  {selectedPatient.age || '-'} / {selectedPatient.gender || '-'}
                </div>
              </div>
            )}

            <FormField label="Select Visit">
              <select
                value={allocationForm.visitId}
                onChange={(e) =>
                  setAllocationForm({
                    ...allocationForm,
                    visitId: e.target.value,
                  })
                }
              >
                <option value="">Latest Visit / No Visit</option>
                {selectedPatientVisits.map((visit) => (
                  <option key={visit._id} value={visit._id}>
                    {visit.tokenNumber || 'Visit'} - {visit.departmentName || '-'} -{' '}
                    {formatDate(visit.visitDate)}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={sectionBox}>
            <h3 style={sectionTitle}>Bed Selection</h3>

            <div style={threeColumnGrid}>
              <FormField label="Ward">
                <select
                  value={allocationWard}
                  onChange={(e) => {
                    setAllocationWard(e.target.value);
                    setAllocationRoom('');
                    setAllocationForm((prev) => ({ ...prev, bed: '' }));
                  }}
                >
                  <option value="">All Wards</option>
                  {wards.map((ward) => (
                    <option key={ward._id} value={ward._id}>
                      {ward.name} {ward.wardId ? `(${ward.wardId})` : ''}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Room">
                <select
                  value={allocationRoom}
                  onChange={(e) => {
                    setAllocationRoom(e.target.value);
                    setAllocationForm((prev) => ({ ...prev, bed: '' }));
                  }}
                >
                  <option value="">All Rooms</option>
                  {filteredRoomsForAllocation.map((room) => (
                    <option key={room._id} value={room._id}>
                      {room.roomNumber} {room.name ? `- ${room.name}` : ''}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Available Bed" required>
                <select
                  value={allocationForm.bed}
                  onChange={(e) =>
                    setAllocationForm({
                      ...allocationForm,
                      bed: e.target.value,
                    })
                  }
                >
                  <option value="">Select Bed</option>
                  {beds.map((bed) => (
                    <option key={bed._id} value={bed._id}>
                      {bed.bedNumber}
                      {bed.room?.roomNumber ? ` - Room ${bed.room.roomNumber}` : ''}
                      {bed.ward?.name ? ` - ${bed.ward.name}` : ''}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          <div style={sectionBox}>
            <h3 style={sectionTitle}>Admission Details</h3>

            <div style={twoColumnGrid}>
              <FormField label="Admission Type">
                <select
                  value={allocationForm.admissionType}
                  onChange={(e) =>
                    setAllocationForm({
                      ...allocationForm,
                      admissionType: e.target.value,
                    })
                  }
                >
                  {admissionTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Consultant Doctor">
                <StaffSelect
                  value={allocationForm.consultantDoctorName}
                  onChange={(value) =>
                    setAllocationForm({
                      ...allocationForm,
                      consultantDoctorName: value,
                    })
                  }
                  placeholder="Select Consultant Doctor"
                />
              </FormField>

              <FormField label="Admission Date">
                <input
                  type="datetime-local"
                  value={allocationForm.admissionDate}
                  onChange={(e) =>
                    setAllocationForm({
                      ...allocationForm,
                      admissionDate: e.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Expected Discharge Date">
                <input
                  type="datetime-local"
                  value={allocationForm.expectedDischargeDate}
                  onChange={(e) =>
                    setAllocationForm({
                      ...allocationForm,
                      expectedDischargeDate: e.target.value,
                    })
                  }
                />
              </FormField>
            </div>

            <FormField label="Reason for Admission">
              <textarea
                rows={3}
                placeholder="Reason for admission"
                value={allocationForm.reasonForAdmission}
                onChange={(e) =>
                  setAllocationForm({
                    ...allocationForm,
                    reasonForAdmission: e.target.value,
                  })
                }
              />
            </FormField>
          </div>
        </div>
      </Modal>

      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="IPD Admission Details"
        width="90%"
        footer={false}
        bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {selectedAdmission && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={infoGrid}>
              <Info label="Admission No" value={selectedAdmission.admissionNo} />
              <Info label="Patient" value={selectedAdmission.patientName} />
              <Info label="Patient ID" value={selectedAdmission.patientId} />
              <Info label="Phone" value={selectedAdmission.phone} />
              <Info label="Ward" value={selectedAdmission.wardName || selectedAdmission.ward?.name} />
              <Info label="Room" value={selectedAdmission.roomNumber || selectedAdmission.room?.roomNumber} />
              <Info label="Bed" value={selectedAdmission.bedNumber || selectedAdmission.bed?.bedNumber} />
              <Info label="Doctor" value={selectedAdmission.consultantDoctorName || selectedAdmission.doctorName} />
              <Info label="Admission Date" value={formatDate(selectedAdmission.admissionDate)} />
              <Info label="Status" value={getStatusLabel(selectedAdmission.status)} />
            </div>

            <div style={viewActionBar}>
              {selectedAdmission.status === 'admitted' && (
                <>
                  <Button variant="secondary" onClick={() => openVitals(selectedAdmission)}>
                    Add Vitals
                  </Button>
                  <Button variant="secondary" onClick={() => openNursingNote(selectedAdmission)}>
                    Add Nursing Note
                  </Button>
                  <Button variant="secondary" onClick={() => openDoctorRound(selectedAdmission)}>
                    Add Doctor Round
                  </Button>
                  <Button variant="danger" onClick={() => openDischarge(selectedAdmission)}>
                    Prepare Discharge
                  </Button>
                </>
              )}
            </div>

            <RecordSection title="Vitals">
              {selectedAdmission.vitals?.length ? (
                selectedAdmission.vitals
                  .slice()
                  .reverse()
                  .map((vital) => (
                    <div key={vital._id} style={recordCard}>
                      <div style={recordHeader}>
                        <strong>{formatDate(vital.recordedAt)}</strong>
                        <span>{vital.recordedByName || '—'}</span>
                      </div>
                      <div style={infoGridSmall}>
                        <Info label="Temp" value={vital.temperature} />
                        <Info label="Pulse" value={vital.pulse} />
                        <Info label="RR" value={vital.respiratoryRate} />
                        <Info label="SpO2" value={vital.spo2} />
                        <Info label="BP" value={`${vital.bpSystolic || '-'} / ${vital.bpDiastolic || '-'}`} />
                        <Info label="Sugar" value={vital.bloodSugar} />
                        <Info label="Weight" value={vital.weight} />
                        <Info label="Pain Score" value={vital.painScore} />
                      </div>
                      {vital.notes && <p style={{ marginBottom: 0 }}>{vital.notes}</p>}
                    </div>
                  ))
              ) : (
                <EmptyText text="No vitals recorded" />
              )}
            </RecordSection>

            <RecordSection title="Nursing Notes">
              {selectedAdmission.nursingNotes?.length ? (
                selectedAdmission.nursingNotes
                  .slice()
                  .reverse()
                  .map((note) => (
                    <div key={note._id} style={recordCard}>
                      <div style={recordHeader}>
                        <strong>{formatDate(note.noteDate)}</strong>
                        <Badge color="blue">
                          {String(note.shift || 'general').toUpperCase()}
                        </Badge>
                      </div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        {String(note.category || 'general').toUpperCase()}
                      </div>
                      <p>{note.note}</p>
                      {note.actionTaken && (
                        <p style={{ marginBottom: 0 }}>
                          <strong>Action:</strong> {note.actionTaken}
                        </p>
                      )}
                      <div style={recordFooter}>
                        Recorded by: {note.recordedByName || '—'}
                      </div>
                    </div>
                  ))
              ) : (
                <EmptyText text="No nursing notes recorded" />
              )}
            </RecordSection>

            <RecordSection title="Doctor Rounds">
              {selectedAdmission.doctorRounds?.length ? (
                selectedAdmission.doctorRounds
                  .slice()
                  .reverse()
                  .map((round) => (
                    <div key={round._id} style={recordCard}>
                      <div style={recordHeader}>
                        <strong>{formatDate(round.roundDate)}</strong>
                        <span>{round.doctorName || '—'}</span>
                      </div>
                      <div style={infoGridSmall}>
                        <Info label="Complaints" value={round.complaints} />
                        <Info label="Examination" value={round.examination} />
                        <Info label="Diagnosis" value={round.diagnosis} />
                        <Info label="Treatment Plan" value={round.treatmentPlan} />
                        <Info label="Medication Changes" value={round.medicationChanges} />
                        <Info label="Investigation Advice" value={round.investigationAdvice} />
                        <Info label="Follow-up" value={round.followUpInstructions} />
                        <Info label="Next Round" value={formatDate(round.nextRoundDate)} />
                      </div>
                    </div>
                  ))
              ) : (
                <EmptyText text="No doctor rounds recorded" />
              )}
            </RecordSection>

            {(selectedAdmission.dischargeSummary ||
              selectedAdmission.dischargeAdvice ||
              selectedAdmission.dischargeSummaryDetails?.status) && (
              <RecordSection title="Discharge Details">
                <div style={recordCard}>
                  <div style={infoGridSmall}>
                    <Info
                      label="Status"
                      value={getStatusLabel(selectedAdmission.status)}
                    />

                    <Info
                      label="Discharge Summary"
                      value={
                        selectedAdmission.dischargeSummary ||
                        selectedAdmission.dischargeSummaryDetails?.hospitalCourse ||
                        '-'
                      }
                    />

                    <Info
                      label="Discharge Advice"
                      value={
                        selectedAdmission.dischargeAdvice ||
                        selectedAdmission.dischargeSummaryDetails?.dischargeAdvice ||
                        '-'
                      }
                    />

                    <Info
                      label="Final Diagnosis"
                      value={selectedAdmission.dischargeSummaryDetails?.finalDiagnosis || '-'}
                    />

                    <Info
                      label="Prepared By"
                      value={selectedAdmission.dischargeSummaryDetails?.preparedByName || '-'}
                    />

                    <Info
                      label="Summary Date"
                      value={formatDate(selectedAdmission.dischargeSummaryDetails?.summaryDate)}
                    />
                  </div>
                </div>
              </RecordSection>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={vitalsOpen}
        onClose={() => setVitalsOpen(false)}
        title="Vitals Entry"
        confirmLabel="Save Vitals"
        onConfirm={handleSaveVitals}
        width="75%"
      >
        <div style={threeColumnGrid}>
          <FormField label="Temperature">
            <input
              placeholder="98.6 °F"
              value={vitalsForm.temperature}
              onChange={(e) =>
                setVitalsForm({ ...vitalsForm, temperature: e.target.value })
              }
            />
          </FormField>

          <FormField label="Pulse">
            <input
              placeholder="72 / min"
              value={vitalsForm.pulse}
              onChange={(e) =>
                setVitalsForm({ ...vitalsForm, pulse: e.target.value })
              }
            />
          </FormField>

          <FormField label="Respiratory Rate">
            <input
              placeholder="18 / min"
              value={vitalsForm.respiratoryRate}
              onChange={(e) =>
                setVitalsForm({ ...vitalsForm, respiratoryRate: e.target.value })
              }
            />
          </FormField>

          <FormField label="SpO2">
            <input
              placeholder="98%"
              value={vitalsForm.spo2}
              onChange={(e) =>
                setVitalsForm({ ...vitalsForm, spo2: e.target.value })
              }
            />
          </FormField>

          <FormField label="BP Systolic">
            <input
              placeholder="120"
              value={vitalsForm.bpSystolic}
              onChange={(e) =>
                setVitalsForm({ ...vitalsForm, bpSystolic: e.target.value })
              }
            />
          </FormField>

          <FormField label="BP Diastolic">
            <input
              placeholder="80"
              value={vitalsForm.bpDiastolic}
              onChange={(e) =>
                setVitalsForm({ ...vitalsForm, bpDiastolic: e.target.value })
              }
            />
          </FormField>

          <FormField label="Blood Sugar">
            <input
              placeholder="110 mg/dL"
              value={vitalsForm.bloodSugar}
              onChange={(e) =>
                setVitalsForm({ ...vitalsForm, bloodSugar: e.target.value })
              }
            />
          </FormField>

          <FormField label="Height">
            <input
              placeholder="170 cm"
              value={vitalsForm.height}
              onChange={(e) =>
                setVitalsForm({ ...vitalsForm, height: e.target.value })
              }
            />
          </FormField>

          <FormField label="Weight">
            <input
              placeholder="70 kg"
              value={vitalsForm.weight}
              onChange={(e) =>
                setVitalsForm({ ...vitalsForm, weight: e.target.value })
              }
            />
          </FormField>

          <FormField label="BMI">
            <input
              placeholder="24.2"
              value={vitalsForm.bmi}
              onChange={(e) =>
                setVitalsForm({ ...vitalsForm, bmi: e.target.value })
              }
            />
          </FormField>

          <FormField label="Pain Score">
            <input
              placeholder="0 - 10"
              value={vitalsForm.painScore}
              onChange={(e) =>
                setVitalsForm({ ...vitalsForm, painScore: e.target.value })
              }
            />
          </FormField>

          <FormField label="Recorded By">
            <StaffSelect
              value={vitalsForm.recordedByName}
              onChange={(value) =>
                setVitalsForm({ ...vitalsForm, recordedByName: value })
              }
              placeholder="Select Recorded By"
            />
          </FormField>

          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="Notes">
              <textarea
                rows={3}
                value={vitalsForm.notes}
                onChange={(e) =>
                  setVitalsForm({ ...vitalsForm, notes: e.target.value })
                }
              />
            </FormField>
          </div>
        </div>
      </Modal>

      <Modal
        open={nursingOpen}
        onClose={() => setNursingOpen(false)}
        title="Nursing Notes"
        confirmLabel="Save Note"
        onConfirm={handleSaveNursingNote}
        width="70%"
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={threeColumnGrid}>
            <FormField label="Shift">
              <select
                value={nursingForm.shift}
                onChange={(e) =>
                  setNursingForm({ ...nursingForm, shift: e.target.value })
                }
              >
                {shiftOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Category">
              <select
                value={nursingForm.category}
                onChange={(e) =>
                  setNursingForm({ ...nursingForm, category: e.target.value })
                }
              >
                {nursingCategoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Recorded By">
              <StaffSelect
                value={nursingForm.recordedByName}
                onChange={(value) =>
                  setNursingForm({
                    ...nursingForm,
                    recordedByName: value,
                  })
                }
                placeholder="Select Recorded By"
              />
            </FormField>
          </div>

          <FormField label="Note" required>
            <textarea
              rows={4}
              placeholder="Enter nursing observation"
              value={nursingForm.note}
              onChange={(e) =>
                setNursingForm({ ...nursingForm, note: e.target.value })
              }
            />
          </FormField>

          <FormField label="Action Taken">
            <textarea
              rows={3}
              placeholder="Action taken if any"
              value={nursingForm.actionTaken}
              onChange={(e) =>
                setNursingForm({ ...nursingForm, actionTaken: e.target.value })
              }
            />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={doctorRoundOpen}
        onClose={() => setDoctorRoundOpen(false)}
        title="Doctor Rounds"
        confirmLabel="Save Round"
        onConfirm={handleSaveDoctorRound}
        width="80%"
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={twoColumnGrid}>
            <FormField label="Doctor Name">
              <StaffSelect
                value={doctorRoundForm.doctorName}
                onChange={(value) =>
                  setDoctorRoundForm({
                    ...doctorRoundForm,
                    doctorName: value,
                  })
                }
                placeholder="Select Doctor"
              />
            </FormField>

            <FormField label="Next Round Date">
              <input
                type="datetime-local"
                value={doctorRoundForm.nextRoundDate}
                onChange={(e) =>
                  setDoctorRoundForm({
                    ...doctorRoundForm,
                    nextRoundDate: e.target.value,
                  })
                }
              />
            </FormField>
          </div>

          <FormField label="Complaints">
            <textarea
              rows={2}
              value={doctorRoundForm.complaints}
              onChange={(e) =>
                setDoctorRoundForm({
                  ...doctorRoundForm,
                  complaints: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Examination">
            <textarea
              rows={2}
              value={doctorRoundForm.examination}
              onChange={(e) =>
                setDoctorRoundForm({
                  ...doctorRoundForm,
                  examination: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Diagnosis">
            <textarea
              rows={2}
              value={doctorRoundForm.diagnosis}
              onChange={(e) =>
                setDoctorRoundForm({
                  ...doctorRoundForm,
                  diagnosis: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Treatment Plan">
            <textarea
              rows={3}
              value={doctorRoundForm.treatmentPlan}
              onChange={(e) =>
                setDoctorRoundForm({
                  ...doctorRoundForm,
                  treatmentPlan: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Medication Changes">
            <textarea
              rows={2}
              value={doctorRoundForm.medicationChanges}
              onChange={(e) =>
                setDoctorRoundForm({
                  ...doctorRoundForm,
                  medicationChanges: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Investigation Advice">
            <textarea
              rows={2}
              value={doctorRoundForm.investigationAdvice}
              onChange={(e) =>
                setDoctorRoundForm({
                  ...doctorRoundForm,
                  investigationAdvice: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Follow-up Instructions">
            <textarea
              rows={2}
              value={doctorRoundForm.followUpInstructions}
              onChange={(e) =>
                setDoctorRoundForm({
                  ...doctorRoundForm,
                  followUpInstructions: e.target.value,
                })
              }
            />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={dischargeOpen}
        onClose={() => setDischargeOpen(false)}
        title="Prepare Discharge"
        confirmLabel="Save Discharge Summary"
        onConfirm={handleDischarge}
        width="65%"
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={warningBox}>
            This will prepare the discharge summary and move the admission to settlement pending.
            The bed will NOT be released here. Bed release happens only after final settlement.
          </div>

          <FormField label="Discharge Summary">
            <textarea
              rows={4}
              value={dischargeForm.dischargeSummary}
              onChange={(e) =>
                setDischargeForm({
                  ...dischargeForm,
                  dischargeSummary: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Discharge Advice">
            <textarea
              rows={4}
              value={dischargeForm.dischargeAdvice}
              onChange={(e) =>
                setDischargeForm({
                  ...dischargeForm,
                  dischargeAdvice: e.target.value,
                })
              }
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>
        {value || value === 0 ? value : '—'}
      </div>
    </div>
  );
}

function RecordSection({ title, children }) {
  return (
    <div style={sectionBox}>
      <h3 style={sectionTitle}>{title}</h3>
      <div style={{ display: 'grid', gap: 12 }}>{children}</div>
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <div
      style={{
        padding: 16,
        textAlign: 'center',
        color: 'var(--text-muted)',
        border: '1px dashed var(--border)',
        borderRadius: 10,
      }}
    >
      {text}
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

const sectionBox = {
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 16,
  background: '#fff',
};

const sectionTitle = {
  marginTop: 0,
  marginBottom: 14,
};

const searchResultBox = {
  display: 'grid',
  gap: 8,
  maxHeight: 220,
  overflowY: 'auto',
  marginTop: 10,
};

const patientCard = {
  width: '100%',
  display: 'grid',
  gap: 4,
  textAlign: 'left',
  padding: 10,
  borderRadius: 10,
  cursor: 'pointer',
};

const selectedBox = {
  padding: 12,
  borderRadius: 10,
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  marginTop: 12,
};

const mutedText = {
  color: 'var(--text-muted)',
  padding: 12,
  textAlign: 'center',
};

const infoGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 16,
};

const infoGridSmall = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
};

const viewActionBar = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
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
  gap: 12,
  marginBottom: 12,
  color: '#111827',
};

const recordFooter = {
  marginTop: 10,
  color: 'var(--text-muted)',
  fontSize: 12,
};

const warningBox = {
  padding: 12,
  borderRadius: 10,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#991b1b',
  fontWeight: 600,
};