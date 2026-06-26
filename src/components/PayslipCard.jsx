'use client';

import React from 'react';
import Button from './Button';
import Badge from './Badge';

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const formatMoney = (value) => {
  const num = Number(value || 0);
  return moneyFormatter.format(Number.isFinite(num) ? num : 0);
};

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatMonth = (value) => {
  if (!value) return '—';

  const [year, month] = String(value).split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-IN', {
    month: 'long',
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

const maskAccount = (value) => {
  if (!value) return '—';

  const str = String(value);
  if (str.length <= 4) return str;

  return `XXXX XXXX ${str.slice(-4)}`;
};

const joinAddress = (address = {}) => {
  if (!address || typeof address !== 'object') return '—';

  return [
    address.street,
    address.city,
    address.state,
    address.pincode,
    address.country,
  ]
    .filter(Boolean)
    .join(', ') || '—';
};

function InfoRow({ label, value }) {
  return (
    <div style={infoRow}>
      <span style={infoLabel}>{label}</span>
      <span style={infoValue}>{value || '—'}</span>
    </div>
  );
}

function MoneyRow({ label, value, strong = false }) {
  return (
    <div style={moneyRow}>
      <span style={strong ? moneyStrong : undefined}>{label}</span>
      <span style={strong ? moneyStrong : undefined}>{formatMoney(value)}</span>
    </div>
  );
}

export default function PayslipCard({ payslip, onPrint }) {
  if (!payslip) {
    return (
      <div style={emptyBox}>
        No payslip selected.
      </div>
    );
  }

  const clinic = payslip.clinic || {};
  const staff = payslip.staff || {};
  const identity = payslip.identity || {};
  const bank = payslip.bank || {};
  const attendance = payslip.attendance || {};
  const period = payslip.period || {};
  const earnings = payslip.earnings || {};
  const deductions = payslip.deductions || {};

  return (
    <div style={wrapper}>
      <div style={topActions} className="no-print">
        <Button onClick={onPrint}>Print / Save PDF</Button>
      </div>

      <div style={payslipBox}>
        <div style={header}>
          <div>
            <h2 style={clinicName}>{clinic.name || 'Clinic'}</h2>
            <div style={muted}>{joinAddress(clinic.address)}</div>
            <div style={muted}>
              {clinic.contact?.phone || '—'}
              {clinic.contact?.email ? ` · ${clinic.contact.email}` : ''}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Badge color="green">PAYSLIP</Badge>
            <h3 style={{ margin: '10px 0 0' }}>
              {formatMonth(payslip.salaryMonth)}
            </h3>
            <div style={muted}>Tenant: {payslip.tenantId || '—'}</div>
          </div>
        </div>

        <div style={sectionGrid}>
          <div style={section}>
            <h4 style={sectionTitle}>Clinic Details</h4>
            <InfoRow label="Registration No" value={clinic.registrationNumber} />
            <InfoRow label="GSTIN" value={clinic.gstin} />
            <InfoRow label="Type" value={clinic.type} />
            <InfoRow label="Currency" value={clinic.currency || 'INR'} />
          </div>

          <div style={section}>
            <h4 style={sectionTitle}>Pay Period</h4>
            <InfoRow label="From" value={formatDate(period.from)} />
            <InfoRow label="To" value={formatDate(period.to)} />
            <InfoRow label="Days in Month" value={period.daysInMonth} />
            <InfoRow label="Working Days" value={period.workingDays} />
          </div>
        </div>

        <div style={sectionGrid}>
          <div style={section}>
            <h4 style={sectionTitle}>Employee Details</h4>
            <InfoRow label="Name" value={staff.name} />
            <InfoRow label="Staff ID" value={staff.staffId} />
            <InfoRow label="Role" value={staff.role} />
            <InfoRow
              label="Department"
              value={
                Array.isArray(staff.departments)
                  ? staff.departments.join(', ')
                  : staff.departmentName
              }
            />
            <InfoRow label="Joining Date" value={formatDate(staff.joiningDate)} />
            <InfoRow label="Phone" value={staff.phone} />
            <InfoRow label="Email" value={staff.email} />
          </div>

          <div style={section}>
            <h4 style={sectionTitle}>Identity & Bank</h4>
            <InfoRow label="PAN" value={identity.panNumber} />
            <InfoRow label="Aadhaar" value={identity.aadhaarNumber} />
            <InfoRow label="PF No" value={identity.pfNumber} />
            <InfoRow label="ESI No" value={identity.esiNumber} />
            <InfoRow label="UAN No" value={identity.uanNumber} />
            <InfoRow label="Bank" value={bank.bankName} />
            <InfoRow label="Account" value={maskAccount(bank.accountNumber)} />
            <InfoRow label="IFSC" value={bank.ifscCode} />
          </div>
        </div>

        <div style={sectionGrid}>
          <div style={section}>
            <h4 style={sectionTitle}>Attendance</h4>
            <InfoRow label="Present Days" value={attendance.presentDays} />
            <InfoRow label="Absent Days" value={attendance.absentDays} />
            <InfoRow label="Rejected Days" value={attendance.rejectedDays} />
            <InfoRow label="LOP Days" value={attendance.lossOfPayDays} />
            <InfoRow
              label="Worked Time"
              value={formatMinutes(attendance.totalWorkedMinutes)}
            />
          </div>

          <div style={section}>
            <h4 style={sectionTitle}>Salary Summary</h4>
            <InfoRow
              label="Monthly Gross"
              value={formatMoney(payslip.salary?.monthlyGrossSalary)}
            />
            <InfoRow
              label="Per Day Salary"
              value={formatMoney(payslip.salary?.perDaySalary)}
            />
            <InfoRow
              label="Gross Earnings"
              value={formatMoney(payslip.grossEarnings)}
            />
            <InfoRow
              label="Total Deductions"
              value={formatMoney(payslip.totalDeductions)}
            />
            <InfoRow label="Net Pay" value={formatMoney(payslip.netPay)} />
          </div>
        </div>

        <div style={salaryGrid}>
          <div style={salaryBox}>
            <h4 style={sectionTitle}>Earnings</h4>
            <MoneyRow label="Gross Salary" value={earnings.grossSalary} />
            <MoneyRow label="Total Earnings" value={payslip.grossEarnings} strong />
          </div>

          <div style={salaryBox}>
            <h4 style={sectionTitle}>Deductions</h4>
            <MoneyRow label="Loss of Pay" value={deductions.lossOfPay} />
            <MoneyRow
              label="Total Deductions"
              value={payslip.totalDeductions}
              strong
            />
          </div>
        </div>

        <div style={netPayBox}>
          <div>
            <div style={muted}>Net Payable Salary</div>
            <h2 style={{ margin: '4px 0 0' }}>
              {formatMoney(payslip.netPay)}
            </h2>
          </div>
        </div>

        <div style={footer}>
          This is a system generated payslip.
        </div>
      </div>
    </div>
  );
}

const wrapper = {
  display: 'grid',
  gap: 12,
};

const topActions = {
  display: 'flex',
  justifyContent: 'flex-end',
};

const payslipBox = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 24,
  display: 'grid',
  gap: 20,
};

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: 18,
};

const clinicName = {
  margin: 0,
  fontSize: 24,
};

const muted = {
  color: 'var(--text-muted)',
  fontSize: 13,
};

const sectionGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16,
};

const section = {
  border: '1px solid #eef2f7',
  borderRadius: 12,
  padding: 14,
};

const sectionTitle = {
  margin: '0 0 12px',
  fontSize: 15,
};

const infoRow = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '6px 0',
  borderBottom: '1px dashed #eef2f7',
  fontSize: 13,
};

const infoLabel = {
  color: 'var(--text-muted)',
  minWidth: 120,
};

const infoValue = {
  textAlign: 'right',
  fontWeight: 600,
};

const salaryGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16,
};

const salaryBox = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 14,
};

const moneyRow = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px dashed #eef2f7',
  fontSize: 14,
};

const moneyStrong = {
  fontWeight: 800,
};

const netPayBox = {
  display: 'flex',
  justifyContent: 'flex-end',
  background: '#f8fafc',
  borderRadius: 12,
  padding: 18,
  textAlign: 'right',
};

const footer = {
  textAlign: 'center',
  color: 'var(--text-muted)',
  fontSize: 12,
  borderTop: '1px solid #e5e7eb',
  paddingTop: 14,
};

const emptyBox = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 20,
  color: 'var(--text-muted)',
};