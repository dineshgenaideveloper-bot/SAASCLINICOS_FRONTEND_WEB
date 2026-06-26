import React, { useEffect, useMemo, useState } from 'react';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import { dashboardAPI } from '../services/api';

export default function SaasDashboard() {
  const [data, setData] = useState({
    totalClinics: 0,
    activeClinics: 0,
    inactiveClinics: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    pendingBills: 0,
    paidBills: 0,
    cancelledBills: 0,
    overdueBills: 0,
    totalBillsAmount: 0,
    collectionRate: 0,
    recentBillings: [],
    recentClinics: [],
    topClinicsByRevenue: [],
    billingByStatus: {
      paid: 0,
      pending: 0,
      overdue: 0,
      cancelled: 0
    },
    monthlyStats: [],
    revenueGrowth: 0,
    activeSubscriptions: 0,
    expiringSubscriptions: 0,
  });

  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // month, quarter, year

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getSaasDashboard({ period: selectedPeriod });
      setData(res.data?.data || {});
    } catch (error) {
      console.error('Fetch SAAS dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedPeriod]);

  const cards = useMemo(
    () => [
      {
        label: 'Total Clinics',
        value: data.totalClinics || 0,
        subtitle: `${data.activeClinics || 0} Active | ${data.inactiveClinics || 0} Inactive`,
        color: 'blue',
        icon: '🏥',
      },
      {
        label: 'Total Users',
        value: data.totalUsers || 0,
        subtitle: `${data.activeUsers || 0} Active Users`,
        color: 'purple',
        icon: '👥',
      },
      {
        label: 'Total Revenue',
        value: `₹${Number(data.totalRevenue || 0).toLocaleString('en-IN')}`,
        subtitle: `Growth: ${data.revenueGrowth || 0}%`,
        color: 'green',
        icon: '💰',
      },
      {
        label: 'Monthly Revenue',
        value: `₹${Number(data.monthlyRevenue || 0).toLocaleString('en-IN')}`,
        subtitle: selectedPeriod === 'month' ? 'This Month' : 'Selected Period',
        color: 'teal',
        icon: '📊',
      },
      {
        label: 'Bills Summary',
        value: (data.paidBills || 0) + (data.pendingBills || 0) + (data.overdueBills || 0),
        subtitle: `${data.paidBills || 0} Paid | ${data.pendingBills || 0} Pending | ${data.overdueBills || 0} Overdue`,
        color: 'amber',
        icon: '📄',
      },
      {
        label: 'Collection Rate',
        value: `${data.collectionRate || 0}%`,
        subtitle: `₹${Number(data.totalBillsAmount || 0).toLocaleString('en-IN')} Total Bills`,
        color: 'green',
        icon: '✅',
      },
      {
        label: 'Active Subscriptions',
        value: data.activeSubscriptions || 0,
        subtitle: `${data.expiringSubscriptions || 0} Expiring Soon`,
        color: 'blue',
        icon: '⭐',
      },
      {
        label: 'Pending Amount',
        value: `₹${Number((data.pendingBills || 0) * 5999).toLocaleString('en-IN')}`,
        subtitle: `${data.pendingBills || 0} Bills Awaiting Payment`,
        color: 'orange',
        icon: '⏳',
      },
    ],
    [data, selectedPeriod]
  );

  const billingColumns = [
    { key: 'invoiceNo', label: 'Invoice No.', width: 150 },
    { key: 'tenantId', label: 'Tenant ID', width: 130 },
    {
      key: 'clinic',
      label: 'Clinic',
      render: (_, row) => row.clinic?.name || '—',
      width: 180,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`,
      width: 100,
    },
    {
      key: 'period',
      label: 'Period',
      render: (_, row) => {
        if (row.startDate && row.endDate) {
          return `${new Date(row.startDate).toLocaleDateString()} - ${new Date(row.endDate).toLocaleDateString()}`;
        }
        return '—';
      },
      width: 200,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '—',
      width: 100,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge
          color={
            value === 'Paid' ? 'green' :
            value === 'Pending' ? 'amber' :
            value === 'Overdue' ? 'red' : 'gray'
          }
        >
          {value}
        </Badge>
      ),
      width: 100,
    },
  ];

  const clinicColumns = [
    { key: 'name', label: 'Clinic', width: 180 },
    { key: 'tenantId', label: 'Tenant ID', width: 130 },
    {
      key: 'owner',
      label: 'Owner',
      render: (_, row) => row.owner?.name || '—',
      width: 150,
    },
    {
      key: 'email',
      label: 'Email',
      render: (_, row) => row.owner?.email || '—',
      width: 200,
    },
    {
      key: 'totalBills',
      label: 'Total Bills',
      render: (value) => value || 0,
      width: 100,
    },
    {
      key: 'totalPaid',
      label: 'Paid Amount',
      render: (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`,
      width: 120,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <Badge color={value ? 'green' : 'red'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
      width: 100,
    },
  ];

  const topClinicsColumns = [
    { key: 'name', label: 'Clinic Name', width: 200 },
    { key: 'tenantId', label: 'Tenant ID', width: 130 },
    {
      key: 'totalRevenue',
      label: 'Total Revenue',
      render: (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`,
      width: 150,
    },
    {
      key: 'billsCount',
      label: 'Bills Count',
      render: (value) => value || 0,
      width: 100,
    },
    {
      key: 'lastPayment',
      label: 'Last Payment',
      render: (value) => value ? new Date(value).toLocaleDateString() : '—',
      width: 120,
    },
  ];

  const getProgressColor = (rate) => {
    if (rate >= 75) return '#10b981';
    if (rate >= 50) return '#f59e0b';
    if (rate >= 25) return '#f97316';
    return '#ef4444';
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'flex-start',
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 6px', color: 'var(--text)' }}>
            SAAS Dashboard
          </h2>
          <p
            style={{
              margin: 0,
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            Complete overview of clinics, users, revenue, billing and subscription activity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="sm"
            variant={selectedPeriod === 'month' ? 'primary' : 'outline'}
            onClick={() => setSelectedPeriod('month')}
          >
            Monthly
          </Button>
          <Button
            size="sm"
            variant={selectedPeriod === 'quarter' ? 'primary' : 'outline'}
            onClick={() => setSelectedPeriod('quarter')}
          >
            Quarterly
          </Button>
          <Button
            size="sm"
            variant={selectedPeriod === 'year' ? 'primary' : 'outline'}
            onClick={() => setSelectedPeriod('year')}
          >
            Yearly
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchDashboard}
            loading={loading}
          >
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Cards Grid */}
      <div style={cardGridStyle}>
        {cards.map((item) => (
          <div key={item.label} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <Badge color={item.color}>{item.label === 'Collection Rate' ? `${item.value}` : 'Current'}</Badge>
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: 4,
              }}
            >
              {item.value}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              {item.subtitle}
            </div>
            {item.label === 'Collection Rate' && (
              <div style={{ marginTop: 12 }}>
                <div style={{
                  height: 6,
                  background: 'var(--border)',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${item.value}`,
                    height: '100%',
                    background: getProgressColor(parseInt(item.value)),
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Billing Statistics Section */}
      <div style={{ ...sectionGridStyle, marginBottom: 20 }}>
        <div style={chartCardStyle}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Billing Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{data.paidBills || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Paid Bills</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {((data.paidBills / ((data.paidBills + data.pendingBills + data.overdueBills) || 1)) * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{data.pendingBills || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending Bills</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {((data.pendingBills / ((data.paidBills + data.pendingBills + data.overdueBills) || 1)) * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{data.overdueBills || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overdue Bills</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {((data.overdueBills / ((data.paidBills + data.pendingBills + data.overdueBills) || 1)) * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#6b7280' }}>{data.cancelledBills || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cancelled Bills</div>
            </div>
          </div>
        </div>

        <div style={chartCardStyle}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Revenue Insights</h3>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Revenue</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>
                ₹{Number(data.totalRevenue || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Monthly Average</span>
              <span style={{ fontSize: 16, fontWeight: 500 }}>
                ₹{Number((data.totalRevenue / 12) || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Revenue Growth</span>
              <Badge color={data.revenueGrowth >= 0 ? 'green' : 'red'}>
                {data.revenueGrowth >= 0 ? '+' : ''}{data.revenueGrowth || 0}%
              </Badge>
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Collection Performance</div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${data.collectionRate || 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #34d399)',
                  borderRadius: 4
                }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, textAlign: 'right', color: 'var(--text-muted)' }}>
                {data.collectionRate || 0}% Collection Rate
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clinics by Revenue */}
      {data.topClinicsByRevenue && data.topClinicsByRevenue.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <DataTable
            title="🏆 Top Clinics by Revenue"
            subtitle="Highest revenue generating clinics"
            columns={topClinicsColumns}
            rows={data.topClinicsByRevenue || []}
            loading={loading}
            emptyText="No revenue data available"
            pageSize={5}
          />
        </div>
      )}

      {/* Recent Billings and Clinics */}
      <div style={sectionGridStyle}>
        <DataTable
          title="Recent Billings"
          subtitle="Latest invoices generated from subscription setup"
          columns={billingColumns}
          rows={data.recentBillings || []}
          loading={loading}
          emptyText="No billing records found."
          pageSize={5}
        />

        <DataTable
          title="Recent Clinics"
          subtitle="Latest registered clinics"
          columns={clinicColumns}
          rows={data.recentClinics || []}
          loading={loading}
          emptyText="No clinics found."
          pageSize={5}
        />
      </div>

      {/* Monthly Trends (if data available) */}
      {data.monthlyStats && data.monthlyStats.length > 0 && (
        <div style={{ ...chartCardStyle, marginTop: 20 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Monthly Revenue Trends</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontSize: 12 }}>Month</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontSize: 12 }}>Revenue</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontSize: 12 }}>Bills</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontSize: 12 }}>Growth</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyStats.map((stat, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px' }}>{stat.month}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 500 }}>
                      ₹{Number(stat.revenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{stat.billsCount || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <Badge color={stat.growth >= 0 ? 'green' : 'red'} size="sm">
                        {stat.growth >= 0 ? '+' : ''}{stat.growth || 0}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const cardGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16,
  marginBottom: 20,
};

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  boxShadow: 'var(--shadow)',
  padding: 18,
};

const sectionGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
  gap: 18,
};

const chartCardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: 18,
};