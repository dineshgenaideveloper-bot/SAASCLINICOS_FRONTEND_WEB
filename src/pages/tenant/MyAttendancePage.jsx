'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { FormField } from '../../components/FormField';
import { staffAttendanceAPI } from '../../services/api';

const emptyRegularizationForm = {
  attendance: '',
  attendanceDate: '',
  requestType: 'time_correction',
  checkInTime: '',
  checkOutTime: '',
  requestedStatus: 'present',
  reason: '',
  employeeNotes: '',
};

const getToday = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

// Normalize any date value (ISO string, Date, etc.) into YYYY-MM-DD
// so it can be used as the value of a <input type="date" />.
const toDateInput = (value) => {
  if (!value) return '';

  // Already in YYYY-MM-DD form
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

const getStatusColor = (status) => {
  if (status === 'checked_in') return 'blue';
  if (status === 'present') return 'green';
  if (status === 'pending') return 'blue';
  if (status === 'approved') return 'green';
  if (status === 'absent') return 'red';
  if (status === 'rejected') return 'red';
  if (status === 'cancelled') return 'gray';

  return 'gray';
};

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

export default function MyAttendancePage() {
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [regularizationRows, setRegularizationRows] = useState([]);

  // Which tab is currently visible: 'attendance' | 'regularization'
  const [activeTab, setActiveTab] = useState('attendance');

  const [loading, setLoading] = useState(false);
  const [regularizationLoading, setRegularizationLoading] = useState(false);
  const [regularizationSubmitting, setRegularizationSubmitting] =
    useState(false);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [regularizationOpen, setRegularizationOpen] = useState(false);
  const [regularizationForm, setRegularizationForm] = useState(
    emptyRegularizationForm
  );
  // When opened from a specific record, lock the date so it can't be changed.
  const [dateLocked, setDateLocked] = useState(false);

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
      if (filterStatus) params.status = filterStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await staffAttendanceAPI.getMyAttendance(params);

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
      console.error('Failed to load my attendance:', error);

      toast.error(
        error?.response?.data?.message || 'Failed to fetch attendance'
      );

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

      const res = await staffAttendanceAPI.getMyRegularizations(params);

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
      console.error('Failed to load regularizations:', error);

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
  ]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    fetchRegularizations();
  }, [fetchRegularizations]);

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setFilterStatus('');
    setSearchQuery('');
    setSortConfig({
      sortBy: 'attendanceDate',
      sortOrder: 'desc',
    });
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
    setRegularizationPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const openRegularizationForRecord = (row) => {
    const raw = row.raw || {};

    setRegularizationForm({
      attendance: raw._id || '',
      // Use the record's own date (normalized to YYYY-MM-DD). The bug was
      // that raw.attendanceDate is usually an ISO string, so the date input
      // showed blank and effectively "switched" the date.
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
      employeeNotes: '',
    });

    setDateLocked(true);
    setRegularizationOpen(true);
  };

  const openBlankRegularization = () => {
    setRegularizationForm({
      ...emptyRegularizationForm,
      attendanceDate: getToday(),
    });

    setDateLocked(false);
    setRegularizationOpen(true);
  };

  const submitRegularization = async () => {
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
        attendance: regularizationForm.attendance || undefined,
        attendanceDate: regularizationForm.attendanceDate,
        requestType: regularizationForm.requestType,
        checkInTime: regularizationForm.checkInTime || undefined,
        checkOutTime: regularizationForm.checkOutTime || undefined,
        requestedStatus: regularizationForm.requestedStatus,
        reason: regularizationForm.reason.trim(),
        employeeNotes: regularizationForm.employeeNotes || '',
      };

      await staffAttendanceAPI.regularizeMyAttendance(payload);

      toast.success('Regularization request submitted');

      setRegularizationOpen(false);
      setRegularizationForm(emptyRegularizationForm);

      // After submitting, jump to the regularization tab so the user sees it.
      setActiveTab('regularization');

      await Promise.all([fetchAttendance(), fetchRegularizations()]);
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          error.message ||
          'Failed to submit regularization'
      );
    } finally {
      setRegularizationSubmitting(false);
    }
  };

  const tableRows = useMemo(() => {
    return attendanceRows.map((row, index) => ({
      id: row._id || `${row.attendanceDate}-${index}`,
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
    }));
  }, [attendanceRows]);

  const regularizationTableRows = useMemo(() => {
    return regularizationRows.map((row, index) => ({
      id: row._id || `${row.attendanceDate}-${index}`,
      attendanceDate: row.attendanceDate,
      requestType: row.requestType,
      requestedCheckInTime: row.requestedCheckInTime,
      requestedCheckOutTime: row.requestedCheckOutTime,
      requestedStatus: row.requestedStatus,
      reason: row.reason,
      status: row.status,
      adminNotes: row.adminNotes,
      raw: row,
    }));
  }, [regularizationRows]);

  const attendanceColumns = [
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
            maxWidth: 260,
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
          <h1 style={{ margin: 0 }}>My Attendance</h1>
          <p style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            View your attendance history and apply regularization for your own
            records only.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={resetFilters} disabled={loading}>
            Reset
          </Button>

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

          <Button onClick={openBlankRegularization}>
            Apply Regularization
          </Button>
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

        <FormField label="Status">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <option value="">All Status</option>
            <option value="checked_in">Checked In</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="rejected">Rejected</option>
          </select>
        </FormField>
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
          Attendance
          {pagination.total ? ` (${pagination.total})` : ''}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'regularization'}
          onClick={() => setActiveTab('regularization')}
          style={activeTab === 'regularization' ? tabActive : tabInactive}
        >
          Regularization
          {regularizationPagination.total
            ? ` (${regularizationPagination.total})`
            : ''}
        </button>
      </div>

      {activeTab === 'attendance' && (
        <DataTable
          title="My Attendance Records"
          subtitle="Search by date, status or notes"
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => openRegularizationForRecord(row)}
            >
              Regularize
            </Button>
          )}
        />
      )}

      {activeTab === 'regularization' && (
        <DataTable
          title="My Regularization Requests"
          subtitle="Your submitted attendance correction requests"
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
        />
      )}

      <Modal
        open={regularizationOpen}
        onClose={() => {
          setRegularizationOpen(false);
          setRegularizationForm(emptyRegularizationForm);
        }}
        title="Apply Attendance Regularization"
        width="60%"
        footer={false}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={infoBox}>
            <strong>My Attendance Regularization</strong>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              This request will be submitted only for your own attendance. Once
              approved, the attendance record will be updated.
            </div>
          </div>

          <div style={twoColumnGrid}>
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
          </div>

          <div style={threeColumnGrid}>
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
              placeholder="Explain why this attendance needs correction"
              style={{ resize: 'vertical' }}
            />
          </FormField>

          <FormField label="Employee Notes">
            <textarea
              rows={2}
              value={regularizationForm.employeeNotes}
              onChange={(e) =>
                setRegularizationForm((prev) => ({
                  ...prev,
                  employeeNotes: e.target.value,
                }))
              }
              placeholder="Optional notes"
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
              {regularizationSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
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
  gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))',
  gap: 12,
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

const infoBox = {
  padding: 12,
  borderRadius: 10,
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
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