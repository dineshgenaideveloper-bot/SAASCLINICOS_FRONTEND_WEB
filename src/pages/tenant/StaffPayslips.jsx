'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { FormField } from '../../components/FormField';
import PayslipCard from '../../components/PayslipCard';

import { staffPayslipAPI } from '../../services/api';

const currentDate = new Date();

const monthOptions = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

const formatMoney = (value) => {
  const num = Number(value || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(num) ? num : 0);
};

const formatMonth = (value) => {
  if (!value) return '—';

  const [year, month] = String(value).split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
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

export default function StaffPayslipsPage() {
  const [rows, setRows] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const [loading, setLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [status, setStatus] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return Array.from({ length: 8 }).map((_, index) => currentYear - 4 + index);
  }, []);

  const fetchPayslips = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        month,
        year,
      };

      if (status) params.status = status;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await staffPayslipAPI.getPayslips(params);

      const data = Array.isArray(res?.data?.data) ? res.data.data : [];
      const pageInfo = res?.data?.pagination || {};

      setRows(data);

      setPagination((prev) => ({
        ...prev,
        page: pageInfo.page || prev.page,
        limit: pageInfo.limit || prev.limit,
        total: pageInfo.total || 0,
        totalPages: pageInfo.totalPages || 1,
      }));
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message || 'Failed to fetch payslips'
      );

      setRows([]);
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
    month,
    year,
    status,
    searchQuery,
  ]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  const resetFilters = () => {
    setMonth(currentDate.getMonth() + 1);
    setYear(currentDate.getFullYear());
    setStatus('active');
    setSearchQuery('');

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const openPayslip = (payslip) => {
    setSelectedPayslip(payslip);
    setViewOpen(true);
  };

  const tableRows = useMemo(() => {
    return rows.map((item, index) => ({
      id: item.staff?._id || `${item.salaryMonth}-${index}`,
      staffName: item.staff?.name || '—',
      staffId: item.staff?.staffId || '—',
      role: item.staff?.role || '—',
      departments: Array.isArray(item.staff?.departments)
        ? item.staff.departments.join(', ')
        : '—',
      salaryMonth: item.salaryMonth,
      presentDays: item.attendance?.presentDays || 0,
      absentDays: item.attendance?.absentDays || 0,
      lossOfPayDays: item.attendance?.lossOfPayDays || 0,
      totalWorkedMinutes: item.attendance?.totalWorkedMinutes || 0,
      grossEarnings: item.grossEarnings || 0,
      totalDeductions: item.totalDeductions || 0,
      netPay: item.netPay || 0,
      raw: item,
    }));
  }, [rows]);

  const columns = [
    {
      key: 'staffName',
      label: 'Staff',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 700 }}>{value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {row.staffId} · {row.role}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {row.departments}
          </div>
        </div>
      ),
    },
    {
      key: 'salaryMonth',
      label: 'Month',
      render: (value) => formatMonth(value),
    },
    {
      key: 'presentDays',
      label: 'Present',
      render: (value) => <Badge color="green">{value}</Badge>,
    },
    {
      key: 'absentDays',
      label: 'Absent',
      render: (value) => (
        <Badge color={Number(value) > 0 ? 'red' : 'gray'}>{value}</Badge>
      ),
    },
    {
      key: 'lossOfPayDays',
      label: 'LOP Days',
      render: (value) => (
        <Badge color={Number(value) > 0 ? 'red' : 'gray'}>{value}</Badge>
      ),
    },
    {
      key: 'totalWorkedMinutes',
      label: 'Worked',
      render: (value) => formatMinutes(value),
    },
    {
      key: 'grossEarnings',
      label: 'Gross',
      render: (value) => formatMoney(value),
    },
    {
      key: 'totalDeductions',
      label: 'Deductions',
      render: (value) => formatMoney(value),
    },
    {
      key: 'netPay',
      label: 'Net Pay',
      render: (value) => (
        <strong>{formatMoney(value)}</strong>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button size="sm" variant="secondary" onClick={() => openPayslip(row.raw)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={pageHeader}>
        <div>
          <h1 style={{ margin: 0 }}>Staff Payslips</h1>
          <p style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            Generate and view monthly payslips for all staff.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={resetFilters} disabled={loading}>
            Reset
          </Button>

          <Button onClick={fetchPayslips} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div style={filterGrid}>
        <FormField label="Month">
          <select
            value={month}
            onChange={(e) => {
              setMonth(Number(e.target.value));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            {monthOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Year">
          <select
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            {yearOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Status">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <option value="">All Staff</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>
      </div>

      <DataTable
        title="All Staff Payslips"
        subtitle="Search staff by name, staff ID, phone, role, or department"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No payslips found."
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
      />

      <Modal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Payslip"
        size="xl"
      >
        <PayslipCard
          payslip={selectedPayslip}
          onPrint={() => window.print()}
        />
      </Modal>
    </div>
  );
}

const pageHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
};

const filterGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16,
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
};