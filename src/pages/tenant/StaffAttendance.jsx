'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { FormField } from '../../components/FormField';
import { staffAPI, staffAttendanceAPI } from '../../services/api';

const emptyConfigForm = {
  clinicName: '',
  latitude: '',
  longitude: '',
  radiusMeters: 100,
  timeZone: 'Asia/Kolkata',
  isEnabled: true,
  requireLocation: true,
  allowCheckoutOutsideRadius: false,
};

const emptyRegularizationForm = {
  staff: '',
  attendance: '',
  attendanceDate: '',
  requestType: 'time_correction',
  checkInTime: '',
  checkOutTime: '',
  requestedStatus: 'present',
  reason: '',
  adminNotes: '',
};

const getToday = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

// Normalize any date value (ISO string, Date, etc.) into YYYY-MM-DD
// so it can be used as the value of an <input type="date" />.
const toDateInput = (value) => {
  if (!value) return '';

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toTimeInput = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');

  return `${hh}:${mm}`;
};

const formatMinutes = (minutes) => {
  if (minutes === undefined || minutes === null) return '—';

  const total = Number(minutes || 0);

  if (!total) return '—';

  const h = Math.floor(total / 60);
  const m = total % 60;

  if (!h) return `${m}m`;

  return `${h}h ${m}m`;
};

const formatDistance = (meters) => {
  if (meters === undefined || meters === null) return '—';

  const value = Number(meters);
  if (!Number.isFinite(value)) return '—';

  return `${Math.round(value)}m away`;
};

const fetchAllPages = async (apiFn, baseParams = {}) => {
  const limit = baseParams.limit || 1000;

  const firstRes = await apiFn({
    ...baseParams,
    page: 1,
    limit,
  });

  const firstData = Array.isArray(firstRes?.data?.data)
    ? firstRes.data.data
    : [];

  const totalPages = firstRes?.data?.pagination?.totalPages || 1;

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
    Array.isArray(res?.data?.data) ? res.data.data : []
  );

  return [...firstData, ...remainingData];
};

const getStatusColor = (status) => {
  if (status === 'checked_in') return 'blue';
  if (status === 'pending') return 'blue';
  if (status === 'present') return 'green';
  if (status === 'approved') return 'green';
  if (status === 'rejected') return 'red';
  if (status === 'absent') return 'red';
  if (status === 'cancelled') return 'gray';

  return 'gray';
};

const getStaffName = (staff, fallback = '—') => {
  if (!staff || typeof staff !== 'object') return fallback;

  return (
    staff.name ||
    staff.staffName ||
    staff.fullName ||
    staff.employeeName ||
    fallback
  );
};

const getStaffId = (staff, fallback = '—') => {
  if (!staff || typeof staff !== 'object') return fallback;

  return staff.staffId || staff.employeeId || fallback;
};

const getStaffContact = (staff, fallback = '') => {
  if (!staff || typeof staff !== 'object') return fallback;

  return staff.phone || staff.mobile || staff.email || fallback;
};

const requestTypeLabel = (value) => {
  const labels = {
    missing_check_in: 'Missing Check In',
    missing_check_out: 'Missing Check Out',
    time_correction: 'Time Correction',
    full_day: 'Full Day',
    status_change: 'Status Change',
    other: 'Other',
  };

  return labels[value] || value || '—';
};

function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported in this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

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
    const q = search.trim().toLowerCase();

    if (!q) return options;

    return options.filter((item) =>
      String(item.searchText || item.label || '')
        .toLowerCase()
        .includes(q)
    );
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
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
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
      <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            width: '100%',
            minHeight: 42,
            border: '1px solid #d1d5db',
            borderRadius: 10,
            padding: '0 12px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff',
          }}
        >
          <div
            style={{
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: 14,
            }}
          >
            {value ? (
              <span>{selectedLabel}</span>
            ) : (
              <span style={{ color: '#9ca3af' }}>{placeholder}</span>
            )}
          </div>

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
                placeholder="Search..."
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
              {allowClear && (
                <div
                  onClick={() => handleSelect('')}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    backgroundColor:
                      value === '' ? 'rgba(59,130,246,0.08)' : 'transparent',
                    borderBottom: '1px solid #f3f4f6',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {clearLabel}
                </div>
              )}

              {filteredOptions.length === 0 ? (
                <div
                  style={{
                    padding: 12,
                    textAlign: 'center',
                    color: '#6b7280',
                  }}
                >
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const active = String(value) === String(option.value);

                  return (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        backgroundColor: active
                          ? 'rgba(59,130,246,0.08)'
                          : 'transparent',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{option.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
}

const LocationStatus = ({ row }) => {
  const checkInKnown =
    row.checkInInsideRadius === true || row.checkInInsideRadius === false;

  const checkOutKnown =
    row.checkOutInsideRadius === true || row.checkOutInsideRadius === false;

  if (!checkInKnown && !checkOutKnown) {
    if (row.raw?.isRegularized) {
      return <Badge color="yellow">REGULARIZED</Badge>;
    }

    return '—';
  }

  const isOutside =
    row.checkInInsideRadius === false || row.checkOutInsideRadius === false;

  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <Badge color={isOutside ? 'red' : 'green'}>
        {isOutside ? 'OUTSIDE RADIUS' : 'INSIDE RADIUS'}
      </Badge>

      {row.raw?.isRegularized && <Badge color="yellow">REGULARIZED</Badge>}
    </div>
  );
};

export default function StaffAttendance() {
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [regularizationRows, setRegularizationRows] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Which tab is visible: 'attendance' | 'regularization'
  const [activeTab, setActiveTab] = useState('attendance');

  const [staffLoading, setStaffLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regularizationLoading, setRegularizationLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [regularizationSubmitting, setRegularizationSubmitting] =
    useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [attendanceConfig, setAttendanceConfig] = useState(emptyConfigForm);
  const [configForm, setConfigForm] = useState(emptyConfigForm);

  const [configOpen, setConfigOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [regularizationOpen, setRegularizationOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState('');
  const [notes, setNotes] = useState('');

  const [regularizationForm, setRegularizationForm] = useState(
    emptyRegularizationForm
  );
  // When opened from a specific record, lock the date so it can't be changed.
  const [dateLocked, setDateLocked] = useState(false);

  const [selectedRegularization, setSelectedRegularization] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const [fromDate, setFromDate] = useState(getToday());
  const [toDate, setToDate] = useState(getToday());
  const [filterStaff, setFilterStaff] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [regularizationPagination, setRegularizationPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [sortConfig, setSortConfig] = useState({
    sortBy: 'attendanceDate',
    sortOrder: 'desc',
  });

  const radiusMeters = Number(attendanceConfig.radiusMeters || 100);

  const hasSavedClinicLocation =
    Number.isFinite(Number(attendanceConfig.latitude)) &&
    Number.isFinite(Number(attendanceConfig.longitude));

  const staffOptions = useMemo(() => {
    return staffList
      .filter((staff) => !staff.status || staff.status === 'active')
      .map((staff) => {
        const name = getStaffName(staff, 'Unnamed Staff');
        const staffId = getStaffId(staff, '');
        const role = staff.role || staff.designation || '';
        const dept = staff.departmentName || staff.department?.name || '';
        const contact = getStaffContact(staff, '');

        return {
          label: `${name}${staffId ? ` (${staffId})` : ''}${
            role ? ` - ${role}` : ''
          }`,
          value: String(staff._id),
          searchText: [name, staffId, role, dept, contact]
            .filter(Boolean)
            .join(' '),
        };
      });
  }, [staffList]);

  const statusOptions = [
    { label: 'Checked In', value: 'checked_in' },
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const fetchConfig = useCallback(async () => {
    try {
      setConfigLoading(true);

      const res = await staffAttendanceAPI.getConfig();
      const data = res?.data?.data || emptyConfigForm;

      setAttendanceConfig(data);
      setConfigForm({ ...emptyConfigForm, ...data });
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message || 'Failed to fetch attendance config'
      );
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      setStaffLoading(true);

      const data = await fetchAllPages(staffAPI.getStaff, {
        sortBy: 'name',
        sortOrder: 'asc',
      });

      setStaffList(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch staff');
      setStaffList([]);
    } finally {
      setStaffLoading(false);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      };

      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (filterStaff) params.staff = filterStaff;
      if (filterStatus) params.status = filterStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await staffAttendanceAPI.getAttendance(params);

      const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
      const pageInfo = res?.data?.pagination || {};

      setAttendanceRows(rows);

      setPagination((prev) => ({
        ...prev,
        page: pageInfo.page || prev.page,
        limit: pageInfo.limit || prev.limit,
        total: pageInfo.total || 0,
        totalPages: pageInfo.totalPages || 1,
      }));
    } catch (error) {
      console.error(error);

      toast.error(error?.response?.data?.message || 'Failed to fetch attendance');

      setAttendanceRows([]);
      setPagination((prev) => ({
        ...prev,
        total: 0,
        totalPages: 1,
      }));
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    sortConfig.sortBy,
    sortConfig.sortOrder,
    fromDate,
    toDate,
    filterStaff,
    filterStatus,
    searchQuery,
  ]);

  const fetchRegularizations = useCallback(async () => {
    try {
      setRegularizationLoading(true);

      const params = {
        page: regularizationPagination.page,
        limit: regularizationPagination.limit,
      };

      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (filterStaff) params.staff = filterStaff;

      const res = await staffAttendanceAPI.getRegularizations(params);

      const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
      const pageInfo = res?.data?.pagination || {};

      setRegularizationRows(rows);

      setRegularizationPagination((prev) => ({
        ...prev,
        page: pageInfo.page || prev.page,
        limit: pageInfo.limit || prev.limit,
        total: pageInfo.total || 0,
        totalPages: pageInfo.totalPages || 1,
      }));
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message || 'Failed to fetch regularizations'
      );

      setRegularizationRows([]);
      setRegularizationPagination((prev) => ({
        ...prev,
        total: 0,
        totalPages: 1,
      }));
    } finally {
      setRegularizationLoading(false);
    }
  }, [
    regularizationPagination.page,
    regularizationPagination.limit,
    fromDate,
    toDate,
    filterStaff,
  ]);

  useEffect(() => {
    fetchConfig();
    fetchStaff();
  }, [fetchConfig, fetchStaff]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    fetchRegularizations();
  }, [fetchRegularizations]);

  const openConfig = () => {
    setConfigForm({ ...emptyConfigForm, ...attendanceConfig });
    setConfigOpen(true);
  };

  const useCurrentLocationForClinic = async () => {
    try {
      setLocationLoading(true);

      const position = await getBrowserLocation();

      setConfigForm((prev) => ({
        ...prev,
        latitude: Number(position.coords.latitude.toFixed(7)),
        longitude: Number(position.coords.longitude.toFixed(7)),
      }));

      toast.success('Current location added as clinic location');
    } catch (error) {
      console.error(error);

      if (error.code === 1) {
        toast.error('Location permission denied');
      } else {
        toast.error(error.message || 'Failed to get current location');
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const saveConfig = async () => {
    const lat = Number(configForm.latitude);
    const lng = Number(configForm.longitude);
    const radius = Number(configForm.radiusMeters || 100);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      toast.error('Valid clinic latitude is required');
      return;
    }

    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      toast.error('Valid clinic longitude is required');
      return;
    }

    if (!Number.isFinite(radius) || radius <= 0) {
      toast.error('Valid radius meters is required');
      return;
    }

    try {
      setConfigLoading(true);

      const res = await staffAttendanceAPI.updateConfig({
        clinicName: configForm.clinicName || '',
        latitude: lat,
        longitude: lng,
        radiusMeters: radius,
        timeZone: configForm.timeZone || 'Asia/Kolkata',
        isEnabled: configForm.isEnabled !== false,
        requireLocation: configForm.requireLocation !== false,
        allowCheckoutOutsideRadius: Boolean(configForm.allowCheckoutOutsideRadius),
      });

      setAttendanceConfig(res?.data?.data || configForm);

      toast.success('Attendance config saved');
      setConfigOpen(false);
    } catch (error) {
      console.error(error);

      toast.error(error?.response?.data?.message || 'Failed to save config');
    } finally {
      setConfigLoading(false);
    }
  };

  const submitAttendance = async (action) => {
    if (!selectedStaff) {
      toast.error('Select staff');
      return;
    }

    if (!hasSavedClinicLocation) {
      toast.error('Please save clinic attendance location first');
      setConfigOpen(true);
      return;
    }

    try {
      setLocationLoading(true);

      const position = await getBrowserLocation();

      const payload = {
        staff: selectedStaff,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        notes,
      };

      if (action === 'check_in') {
        await staffAttendanceAPI.checkIn(payload);
        toast.success('Check-in successful');
      } else {
        await staffAttendanceAPI.checkOut(payload);
        toast.success('Check-out successful');
      }

      setAttendanceModalOpen(false);
      setSelectedStaff('');
      setNotes('');

      await fetchAttendance();
    } catch (error) {
      console.error(error);

      if (error.code === 1) {
        toast.error('Location permission denied');
      } else if (error.code === 2) {
        toast.error('Unable to get location');
      } else if (error.code === 3) {
        toast.error('Location request timed out');
      } else {
        toast.error(
          error?.response?.data?.message ||
            error.message ||
            'Attendance failed'
        );
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const openBlankRegularization = () => {
    setRegularizationForm({
      ...emptyRegularizationForm,
      attendanceDate: getToday(),
    });

    setDateLocked(false);
    setRegularizationOpen(true);
  };

  const openRegularizationForRecord = (row) => {
    const raw = row.raw || {};
    const staffId = String(raw.staff?._id || raw.staff || '');

    setRegularizationForm({
      staff: staffId,
      attendance: raw._id || '',
      // Use the record's own date (normalized to YYYY-MM-DD) and lock it.
      attendanceDate: toDateInput(raw.attendanceDate) || getToday(),
      requestType:
        !raw.checkIn?.time && raw.checkOut?.time
          ? 'missing_check_in'
          : raw.checkIn?.time && !raw.checkOut?.time
            ? 'missing_check_out'
            : 'time_correction',
      checkInTime: toTimeInput(raw.checkIn?.time),
      checkOutTime: toTimeInput(raw.checkOut?.time),
      requestedStatus: raw.status || 'present',
      reason: '',
      adminNotes: '',
    });

    setDateLocked(true);
    setRegularizationOpen(true);
  };

  const submitRegularization = async () => {
    if (!regularizationForm.staff) {
      toast.error('Select staff');
      return;
    }

    if (!regularizationForm.attendanceDate) {
      toast.error('Attendance date is required');
      return;
    }

    if (!regularizationForm.reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    try {
      setRegularizationSubmitting(true);

      const payload = {
        staff: regularizationForm.staff,
        attendance: regularizationForm.attendance || undefined,
        attendanceDate: regularizationForm.attendanceDate,
        requestType: regularizationForm.requestType,
        checkInTime: regularizationForm.checkInTime || undefined,
        checkOutTime: regularizationForm.checkOutTime || undefined,
        requestedStatus: regularizationForm.requestedStatus,
        reason: regularizationForm.reason.trim(),
        adminNotes: regularizationForm.adminNotes || '',
      };

      await staffAttendanceAPI.regularizeStaffAttendance(payload);

      toast.success('Regularization request created');

      setRegularizationOpen(false);
      setRegularizationForm(emptyRegularizationForm);

      // Jump to the regularization tab so the new request is visible.
      setActiveTab('regularization');

      await fetchRegularizations();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          error.message ||
          'Failed to create regularization'
      );
    } finally {
      setRegularizationSubmitting(false);
    }
  };

  const openReview = (regularization, action) => {
    setSelectedRegularization(regularization);
    setReviewAction(action);
    setReviewNotes('');
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!selectedRegularization?._id || !reviewAction) {
      toast.error('Select regularization request');
      return;
    }

    try {
      setReviewSubmitting(true);

      if (reviewAction === 'approve') {
        await staffAttendanceAPI.approveRegularization(
          selectedRegularization._id,
          {
            adminNotes: reviewNotes || '',
          }
        );

        toast.success('Regularization approved and attendance updated');
      } else {
        await staffAttendanceAPI.rejectRegularization(
          selectedRegularization._id,
          {
            adminNotes: reviewNotes || '',
          }
        );

        toast.success('Regularization rejected');
      }

      setReviewOpen(false);
      setSelectedRegularization(null);
      setReviewAction('');
      setReviewNotes('');

      await Promise.all([fetchAttendance(), fetchRegularizations()]);
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          error.message ||
          'Failed to update regularization'
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const tableRows = useMemo(() => {
    return attendanceRows.map((row, index) => {
      const staff = row.staff && typeof row.staff === 'object' ? row.staff : null;

      return {
        id: row._id || `${row.attendanceDate}-${index}`,
        staffName: getStaffName(staff, '—'),
        staffId: getStaffId(staff, '—'),
        staffContact: getStaffContact(staff, ''),
        attendanceDate: row.attendanceDate,
        checkIn: row.checkIn?.time,
        checkOut: row.checkOut?.time,
        checkInDistance: row.checkIn?.distanceMeters,
        checkOutDistance: row.checkOut?.distanceMeters,
        checkInInsideRadius: row.checkIn?.insideRadius,
        checkOutInsideRadius: row.checkOut?.insideRadius,
        workedMinutes: row.workedMinutes,
        status: row.status,
        notes: row.notes,
        raw: row,
      };
    });
  }, [attendanceRows]);

  const regularizationTableRows = useMemo(() => {
    return regularizationRows.map((row, index) => {
      const staff = row.staff && typeof row.staff === 'object' ? row.staff : null;

      return {
        id: row._id || `${row.attendanceDate}-${index}`,
        staffName: getStaffName(staff, '—'),
        staffId: getStaffId(staff, '—'),
        staffContact: getStaffContact(staff, ''),
        attendanceDate: row.attendanceDate,
        requestType: row.requestType,
        requestedCheckInTime: row.requestedCheckInTime,
        requestedCheckOutTime: row.requestedCheckOutTime,
        requestedStatus: row.requestedStatus,
        reason: row.reason,
        status: row.status,
        adminNotes: row.adminNotes,
        raw: row,
      };
    });
  }, [regularizationRows]);

  const attendanceColumns = [
    {
      key: 'staffName',
      label: 'Staff',
      sortable: false,
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 700 }}>{value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {row.staffId}
            {row.staffContact ? ` · ${row.staffContact}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'attendanceDate',
      label: 'Date',
      sortable: true,
      sortKey: 'attendanceDate',
      render: (value) => formatDate(value),
    },
    {
      key: 'checkIn',
      label: 'Check In',
      sortable: true,
      sortKey: 'checkIn.time',
      render: (value, row) => (
        <div>
          <div>{formatTime(value)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formatDistance(row.checkInDistance)}
          </div>
        </div>
      ),
    },
    {
      key: 'checkOut',
      label: 'Check Out',
      sortable: true,
      sortKey: 'checkOut.time',
      render: (value, row) => (
        <div>
          <div>{formatTime(value)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formatDistance(row.checkOutDistance)}
          </div>
        </div>
      ),
    },
    {
      key: 'workedMinutes',
      label: 'Worked',
      sortable: true,
      sortKey: 'workedMinutes',
      render: (value) => formatMinutes(value),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'status',
      render: (value) => (
        <Badge color={getStatusColor(value)}>
          {String(value || '—').replaceAll('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (_, row) => <LocationStatus row={row} />,
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (value) => (
        <div
          style={{
            maxWidth: 220,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={value || ''}
        >
          {value || '—'}
        </div>
      ),
    },
  ];

  const regularizationColumns = [
    {
      key: 'staffName',
      label: 'Staff',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 700 }}>{value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {row.staffId}
            {row.staffContact ? ` · ${row.staffContact}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'attendanceDate',
      label: 'Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'requestType',
      label: 'Type',
      render: (value) => requestTypeLabel(value),
    },
    {
      key: 'requestedCheckInTime',
      label: 'Req. Check In',
      render: (value) => formatTime(value),
    },
    {
      key: 'requestedCheckOutTime',
      label: 'Req. Check Out',
      render: (value) => formatTime(value),
    },
    {
      key: 'requestedStatus',
      label: 'Req. Status',
      render: (value) => (
        <Badge color={getStatusColor(value)}>
          {String(value || '—').replaceAll('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Request Status',
      render: (value) => (
        <Badge color={getStatusColor(value)}>
          {String(value || '—').replaceAll('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (value) => (
        <div
          style={{
            maxWidth: 240,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={value || ''}
        >
          {value || '—'}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={pageHeader}>
        <div>
          <h1 style={{ margin: 0 }}>Staff Attendance</h1>
          <p style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            GPS attendance, staff regularization, and approval management.
            {hasSavedClinicLocation
              ? ` Clinic radius: ${radiusMeters}m.`
              : ' Attendance config not saved.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={() => {
              fetchAttendance();
              fetchRegularizations();
            }}
            disabled={loading || regularizationLoading}
          >
            Refresh
          </Button>

          <Button
            variant="secondary"
            onClick={openConfig}
            disabled={configLoading}
          >
            Attendance Config
          </Button>

          <Button
            variant="secondary"
            onClick={openBlankRegularization}
          >
            Regularize
          </Button>

          <Button
            onClick={() => setAttendanceModalOpen(true)}
            disabled={
              !hasSavedClinicLocation || attendanceConfig.isEnabled === false
            }
          >
            Check In / Out
          </Button>
        </div>
      </div>

      {!hasSavedClinicLocation && (
        <div style={warningBox}>
          <strong>Attendance location is not configured.</strong>
          <span style={{ marginLeft: 8 }}>
            Click <strong>Attendance Config</strong>, use current location or
            enter clinic latitude/longitude, then save.
          </span>
        </div>
      )}

      {attendanceConfig.isEnabled === false && (
        <div style={warningBox}>
          <strong>Staff attendance is disabled for this clinic.</strong>
        </div>
      )}

      <div style={configInfoBox}>
        <div>
          <strong>Clinic:</strong> {attendanceConfig.clinicName || '—'}
        </div>

        <div>
          <strong>Lat/Lng:</strong>{' '}
          {hasSavedClinicLocation
            ? `${attendanceConfig.latitude}, ${attendanceConfig.longitude}`
            : 'Not saved'}
        </div>

        <div>
          <strong>Radius:</strong> {radiusMeters}m
        </div>

        <div>
          <strong>Time Zone:</strong>{' '}
          {attendanceConfig.timeZone || 'Asia/Kolkata'}
        </div>
      </div>

      <div style={filterGrid}>
        <FormField label="From Date">
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
              setRegularizationPagination((prev) => ({ ...prev, page: 1 }));
            }}
          />
        </FormField>

        <FormField label="To Date">
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            max={getToday()}
            onChange={(e) => {
              setToDate(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
              setRegularizationPagination((prev) => ({ ...prev, page: 1 }));
            }}
          />
        </FormField>

        <Dropdown
          label="Staff"
          value={filterStaff}
          options={staffOptions}
          placeholder={staffLoading ? 'Loading staff...' : 'All Staff'}
          clearLabel="All Staff"
          allowClear
          onChange={(value) => {
            setFilterStaff(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
            setRegularizationPagination((prev) => ({ ...prev, page: 1 }));
          }}
        />

        <Dropdown
          label="Status"
          value={filterStatus}
          options={statusOptions}
          placeholder="All Status"
          clearLabel="All Status"
          allowClear
          onChange={(value) => {
            setFilterStatus(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
        />
      </div>

      {/* Tab switcher */}
      <div style={tabBar} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'attendance'}
          onClick={() => setActiveTab('attendance')}
          style={activeTab === 'attendance' ? tabActive : tabInactive}
        >
          Attendance Records
          {pagination.total ? ` (${pagination.total})` : ''}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'regularization'}
          onClick={() => setActiveTab('regularization')}
          style={activeTab === 'regularization' ? tabActive : tabInactive}
        >
          Regularization Requests
          {regularizationPagination.total
            ? ` (${regularizationPagination.total})`
            : ''}
        </button>
      </div>

      {activeTab === 'attendance' && (
        <DataTable
          title="Attendance Records"
          subtitle="Search by staff name, staff ID, phone, date, status or notes"
          columns={attendanceColumns}
          rows={tableRows}
          loading={loading}
          emptyText="No attendance records found."
          total={pagination.total}
          page={pagination.page}
          pageSize={pagination.limit}
          onPageChange={(newPage) =>
            setPagination((prev) => ({ ...prev, page: newPage }))
          }
          onPageSizeChange={(newLimit) =>
            setPagination((prev) => ({
              ...prev,
              limit: newLimit,
              page: 1,
            }))
          }
          onSearchChange={(value) => {
            setSearchQuery(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          onSortChange={({ sortBy, sortOrder }) => {
            setSortConfig({
              sortBy: sortBy || 'attendanceDate',
              sortOrder: sortOrder || 'desc',
            });
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          actions={({ row }) => (
            <div style={{ display: 'flex', gap: 8 }}>
              {!row.raw?.checkOut?.time && row.raw?.checkIn?.time && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedStaff(
                      String(row.raw?.staff?._id || row.raw?.staff || '')
                    );
                    setAttendanceModalOpen(true);
                  }}
                >
                  Check Out
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => openRegularizationForRecord(row)}
              >
                Regularize
              </Button>
            </div>
          )}
        />
      )}

      {activeTab === 'regularization' && (
        <DataTable
          title="Regularization Requests"
          subtitle="Approve or reject attendance correction requests"
          columns={regularizationColumns}
          rows={regularizationTableRows}
          loading={regularizationLoading}
          emptyText="No regularization requests found."
          total={regularizationPagination.total}
          page={regularizationPagination.page}
          pageSize={regularizationPagination.limit}
          onPageChange={(newPage) =>
            setRegularizationPagination((prev) => ({ ...prev, page: newPage }))
          }
          onPageSizeChange={(newLimit) =>
            setRegularizationPagination((prev) => ({
              ...prev,
              limit: newLimit,
              page: 1,
            }))
          }
          actions={({ row }) => (
            <div style={{ display: 'flex', gap: 8 }}>
              {row.raw?.status === 'pending' ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openReview(row.raw, 'approve')}
                  >
                    Approve
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openReview(row.raw, 'reject')}
                  >
                    Reject
                  </Button>
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  Reviewed
                </span>
              )}
            </div>
          )}
        />
      )}

      <Modal
        open={attendanceModalOpen}
        onClose={() => {
          setAttendanceModalOpen(false);
          setSelectedStaff('');
          setNotes('');
        }}
        title="Staff Attendance"
        width="55%"
        footer={false}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={infoBox}>
            <strong>Clinic radius validation</strong>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Staff must be within {radiusMeters} meters of the clinic location
              saved in DB.
            </div>
          </div>

          <Dropdown
            label="Select Staff"
            required
            value={selectedStaff}
            options={staffOptions}
            placeholder={staffLoading ? 'Loading staff...' : 'Search and select staff'}
            onChange={setSelectedStaff}
          />

          <FormField label="Notes">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              style={{ resize: 'vertical' }}
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              variant="secondary"
              onClick={() => {
                setAttendanceModalOpen(false);
                setSelectedStaff('');
                setNotes('');
              }}
              disabled={locationLoading}
            >
              Cancel
            </Button>

            <Button
              variant="outline"
              onClick={() => submitAttendance('check_out')}
              disabled={locationLoading}
            >
              {locationLoading ? 'Getting Location...' : 'Check Out'}
            </Button>

            <Button
              onClick={() => submitAttendance('check_in')}
              disabled={locationLoading}
            >
              {locationLoading ? 'Getting Location...' : 'Check In'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={regularizationOpen}
        onClose={() => {
          setRegularizationOpen(false);
          setRegularizationForm(emptyRegularizationForm);
        }}
        title="Staff Attendance Regularization"
        width="65%"
        footer={false}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={infoBox}>
            <strong>Staff Attendance Regularization</strong>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              This request can be created for any staff. After approval, the
              attendance record will be updated.
            </div>
          </div>

          <div style={twoColumnGrid}>
            <Dropdown
              label="Staff"
              required
              value={regularizationForm.staff}
              options={staffOptions}
              placeholder={staffLoading ? 'Loading staff...' : 'Search staff'}
              onChange={(value) =>
                setRegularizationForm((prev) => ({
                  ...prev,
                  staff: value,
                }))
              }
            />

            <FormField label="Attendance Date" required>
              <input
                type="date"
                value={regularizationForm.attendanceDate}
                max={getToday()}
                disabled={dateLocked}
                readOnly={dateLocked}
                style={
                  dateLocked
                    ? { background: '#f3f4f6', cursor: 'not-allowed' }
                    : undefined
                }
                onChange={(e) =>
                  setRegularizationForm((prev) => ({
                    ...prev,
                    attendanceDate: e.target.value,
                  }))
                }
              />
            </FormField>
          </div>

          <div style={twoColumnGrid}>
            <FormField label="Request Type" required>
              <select
                value={regularizationForm.requestType}
                onChange={(e) =>
                  setRegularizationForm((prev) => ({
                    ...prev,
                    requestType: e.target.value,
                  }))
                }
              >
                <option value="time_correction">Time Correction</option>
                <option value="missing_check_in">Missing Check In</option>
                <option value="missing_check_out">Missing Check Out</option>
                <option value="full_day">Full Day</option>
                <option value="status_change">Status Change</option>
                <option value="other">Other</option>
              </select>
            </FormField>

            <FormField label="Requested Status">
              <select
                value={regularizationForm.requestedStatus}
                onChange={(e) =>
                  setRegularizationForm((prev) => ({
                    ...prev,
                    requestedStatus: e.target.value,
                  }))
                }
              >
                <option value="present">Present</option>
                <option value="checked_in">Checked In</option>
                <option value="absent">Absent</option>
                <option value="rejected">Rejected</option>
              </select>
            </FormField>
          </div>

          <div style={twoColumnGrid}>
            <FormField label="Requested Check In">
              <input
                type="time"
                value={regularizationForm.checkInTime}
                onChange={(e) =>
                  setRegularizationForm((prev) => ({
                    ...prev,
                    checkInTime: e.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Requested Check Out">
              <input
                type="time"
                value={regularizationForm.checkOutTime}
                onChange={(e) =>
                  setRegularizationForm((prev) => ({
                    ...prev,
                    checkOutTime: e.target.value,
                  }))
                }
              />
            </FormField>
          </div>

          <FormField label="Reason" required>
            <textarea
              rows={3}
              value={regularizationForm.reason}
              onChange={(e) =>
                setRegularizationForm((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              placeholder="Reason for regularization"
              style={{ resize: 'vertical' }}
            />
          </FormField>

          <FormField label="Admin Notes">
            <textarea
              rows={2}
              value={regularizationForm.adminNotes}
              onChange={(e) =>
                setRegularizationForm((prev) => ({
                  ...prev,
                  adminNotes: e.target.value,
                }))
              }
              placeholder="Optional admin notes"
              style={{ resize: 'vertical' }}
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              variant="secondary"
              disabled={regularizationSubmitting}
              onClick={() => {
                setRegularizationOpen(false);
                setRegularizationForm(emptyRegularizationForm);
              }}
            >
              Cancel
            </Button>

            <Button
              disabled={regularizationSubmitting}
              onClick={submitRegularization}
            >
              {regularizationSubmitting ? 'Submitting...' : 'Create Request'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={reviewOpen}
        onClose={() => {
          setReviewOpen(false);
          setSelectedRegularization(null);
          setReviewAction('');
          setReviewNotes('');
        }}
        title={
          reviewAction === 'approve'
            ? 'Approve Regularization'
            : 'Reject Regularization'
        }
        width="45%"
        footer={false}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={infoBox}>
            <strong>
              {reviewAction === 'approve'
                ? 'Approve and update attendance record'
                : 'Reject this request'}
            </strong>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {selectedRegularization
                ? `${formatDate(
                    selectedRegularization.attendanceDate
                  )} · ${requestTypeLabel(selectedRegularization.requestType)}`
                : ''}
            </div>
          </div>

          <FormField label="Admin Notes">
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Optional review notes"
              style={{ resize: 'vertical' }}
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              variant="secondary"
              disabled={reviewSubmitting}
              onClick={() => {
                setReviewOpen(false);
                setSelectedRegularization(null);
                setReviewAction('');
                setReviewNotes('');
              }}
            >
              Cancel
            </Button>

            <Button disabled={reviewSubmitting} onClick={submitReview}>
              {reviewSubmitting
                ? 'Saving...'
                : reviewAction === 'approve'
                  ? 'Approve'
                  : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        title="Staff Attendance Config"
        confirmLabel="Save Config"
        onConfirm={saveConfig}
        width="65%"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={infoBox}>
            <strong>Saved in database per SaaS clinic/tenant.</strong>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Backend reads this DB config before check-in and check-out.
            </div>
          </div>

          <div style={twoColumnGrid}>
            <FormField label="Clinic Name">
              <input
                value={String(configForm.clinicName || '')}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    clinicName: e.target.value,
                  }))
                }
                placeholder="Main Clinic / Branch name"
              />
            </FormField>

            <FormField label="Time Zone">
              <input
                value={String(configForm.timeZone || 'Asia/Kolkata')}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    timeZone: e.target.value,
                  }))
                }
                placeholder="Asia/Kolkata"
              />
            </FormField>
          </div>

          <div style={threeColumnGrid}>
            <FormField label="Clinic Latitude" required>
              <input
                type="number"
                step="any"
                value={String(configForm.latitude ?? '')}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    latitude: e.target.value,
                  }))
                }
                placeholder="13.0827"
              />
            </FormField>

            <FormField label="Clinic Longitude" required>
              <input
                type="number"
                step="any"
                value={String(configForm.longitude ?? '')}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    longitude: e.target.value,
                  }))
                }
                placeholder="80.2707"
              />
            </FormField>

            <FormField label="Radius Meters" required>
              <input
                type="number"
                min="1"
                value={String(configForm.radiusMeters || 100)}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    radiusMeters: e.target.value,
                  }))
                }
                placeholder="100"
              />
            </FormField>
          </div>

          <div>
            <Button
              variant="secondary"
              onClick={useCurrentLocationForClinic}
              disabled={locationLoading}
            >
              {locationLoading
                ? 'Getting Location...'
                : 'Use Current Location as Clinic Location'}
            </Button>
          </div>

          <div style={checkboxGrid}>
            <label style={checkboxLabel}>
              <input
                type="checkbox"
                checked={configForm.isEnabled !== false}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    isEnabled: e.target.checked,
                  }))
                }
              />
              Enable staff attendance
            </label>

            <label style={checkboxLabel}>
              <input
                type="checkbox"
                checked={configForm.requireLocation !== false}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    requireLocation: e.target.checked,
                  }))
                }
              />
              Require GPS location
            </label>

            <label style={checkboxLabel}>
              <input
                type="checkbox"
                checked={Boolean(configForm.allowCheckoutOutsideRadius)}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    allowCheckoutOutsideRadius: e.target.checked,
                  }))
                }
              />
              Allow checkout outside radius
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const pageHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
};

const filterGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))',
  gap: 12,
};

const infoBox = {
  padding: 12,
  borderRadius: 10,
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
};

const warningBox = {
  padding: 12,
  borderRadius: 10,
  border: '1px solid #f59e0b',
  background: '#fffbeb',
  color: '#92400e',
};

const configInfoBox = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))',
  gap: 12,
  padding: 12,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#fff',
  fontSize: 13,
};

const twoColumnGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))',
  gap: 12,
};

const threeColumnGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(160px, 1fr))',
  gap: 12,
};

const checkboxGrid = {
  display: 'grid',
  gap: 10,
};

const checkboxLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
};

const tabBar = {
  display: 'flex',
  gap: 4,
  borderBottom: '1px solid var(--border, #e5e7eb)',
};

const tabBase = {
  padding: '10px 18px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
  borderBottom: '2px solid transparent',
  marginBottom: -1,
};

const tabActive = {
  ...tabBase,
  color: 'var(--primary, #2563eb)',
  borderBottom: '2px solid var(--primary, #2563eb)',
  fontWeight: 600,
};

const tabInactive = {
  ...tabBase,
  color: 'var(--text-muted, #6b7280)',
};