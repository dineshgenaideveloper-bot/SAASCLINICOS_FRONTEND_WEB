'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Button from '../../components/Button';
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

export default function MyPayslipPage() {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(false);

  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return Array.from({ length: 8 }).map((_, index) => currentYear - 4 + index);
  }, []);

  const fetchMyPayslip = useCallback(async () => {
    try {
      setLoading(true);

      const res = await staffPayslipAPI.getMyPayslip({
        month,
        year,
      });

      setPayslip(res?.data?.data || null);
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message || 'Failed to fetch my payslip'
      );

      setPayslip(null);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchMyPayslip();
  }, [fetchMyPayslip]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={pageHeader}>
        <div>
          <h1 style={{ margin: 0 }}>My Payslip</h1>
          <p style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            View your monthly salary, attendance, deductions, and net pay.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={fetchMyPayslip}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            onClick={() => window.print()}
            disabled={!payslip}
          >
            Print / Save PDF
          </Button>
        </div>
      </div>

      <div style={filterGrid}>
        <FormField label="Month">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
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
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </FormField>

        <div style={summaryBox}>
          <div style={summaryLabel}>Net Pay</div>
          <div style={summaryValue}>
            {loading ? 'Loading...' : formatMoney(payslip?.netPay)}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={loadingBox}>Loading payslip...</div>
      ) : payslip ? (
        <PayslipCard
          payslip={payslip}
          onPrint={() => window.print()}
        />
      ) : (
        <div style={emptyBox}>
          No payslip found for selected month.
        </div>
      )}
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

const summaryBox = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '10px 12px',
  background: '#f8fafc',
};

const summaryLabel = {
  color: 'var(--text-muted)',
  fontSize: 12,
};

const summaryValue = {
  fontWeight: 800,
  fontSize: 18,
  marginTop: 4,
};

const loadingBox = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 20,
  color: 'var(--text-muted)',
};

const emptyBox = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 20,
  color: 'var(--text-muted)',
};