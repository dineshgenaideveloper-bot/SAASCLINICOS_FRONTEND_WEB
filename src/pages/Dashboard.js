import React, { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { clientDashboardAPI } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

const fallbackData = {
  sales: {
    totalPatients: 0,
    totalMedicalBilling: 0,
    medicalPayments: [],
  },
  inventory: {
    totalCategories: 0,
    totalItems: 0,
    activeItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    expiringItems: 0,
    inventoryValue: 0,
    inventorySellingValue: 0,
    stockByCategory: [],
    stockTransactionsByType: [],
    recentTransactions: [],
    lowStockList: [],
  },
};

function KpiCard({ label, value, color = 'primary' }) {
  return (
    <div className="kpi-card">
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
      </div>
      <div className={`kpi-icon kpi-icon-${color}`}>●</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const localUser = JSON.parse(localStorage.getItem('user')) || {};
  const tenantId =
    localStorage.getItem('tenantId') ||
    localUser?.tenantId ||
    user?.tenantId;

  const [activeTab, setActiveTab] = useState('sales');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [dashboardData, setDashboardData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-');

      const response = await clientDashboardAPI.getDashboard({
        month,
        year,
        tenantId,
      });

      setDashboardData(response.data.data || fallbackData);
    } catch (error) {
      console.error('Client dashboard API error:', error);
      setDashboardData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedMonth]);

  const sales = dashboardData.sales || fallbackData.sales;
  const inventory = dashboardData.inventory || fallbackData.inventory;

  const colors = ['#0F6E56', '#378ADD', '#BA7517', '#E24B4A', '#534AB7', '#993556'];

  const paymentLabels = useMemo(
    () => sales.medicalPayments?.map((item) => item.paymentType) || [],
    [sales]
  );

  const paymentAmounts = useMemo(
    () => sales.medicalPayments?.map((item) => Number(item.totalAmount || 0)) || [],
    [sales]
  );

  const paymentCounts = useMemo(
    () => sales.medicalPayments?.map((item) => Number(item.totalBills || 0)) || [],
    [sales]
  );

  const totalBills = paymentCounts.reduce((sum, value) => sum + value, 0);

  const paymentBarData = {
    labels: paymentLabels,
    datasets: [
      {
        label: 'Amount',
        data: paymentAmounts,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const paymentDoughnutData = {
    labels: paymentLabels,
    datasets: [
      {
        data: paymentAmounts,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const categoryLabels = inventory.stockByCategory?.map((x) => x.categoryName) || [];
  const categoryValues = inventory.stockByCategory?.map((x) => Number(x.stockValue || 0)) || [];

  const categoryBarData = {
    labels: categoryLabels,
    datasets: [
      {
        label: 'Stock Value',
        data: categoryValues,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const transactionLabels =
    inventory.stockTransactionsByType?.map((x) => x.transactionType) || [];

  const transactionValues =
    inventory.stockTransactionsByType?.map((x) => Number(x.totalAmount || 0)) || [];

  const transactionDoughnutData = {
    labels: transactionLabels,
    datasets: [
      {
        data: transactionValues,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Good{' '}
            {dayjs().hour() < 12
              ? 'morning'
              : dayjs().hour() < 17
              ? 'afternoon'
              : 'evening'}
            , {user?.name?.split(' ')[0] || localUser?.name || 'User'} 👋
          </h1>

          <p className="dashboard-date">
            {dayjs(selectedMonth).format('MMMM YYYY')} Dashboard
          </p>

          <p className="tenant-line">
            Tenant ID: <strong>{tenantId || '—'}</strong>
          </p>
        </div>

        <div className="filter-box">
          <label>Filter Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="tab-row">
        <button
          className={activeTab === 'sales' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('sales')}
        >
          Sales
        </button>

        <button
          className={activeTab === 'inventory' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory
        </button>
      </div>

      {activeTab === 'sales' && (
        <>
          <div className="kpi-grid">
            <KpiCard
              label="Total Patients"
              value={Number(sales.totalPatients || 0).toLocaleString()}
              color="primary"
            />

            <KpiCard
              label="Medical Billing"
              value={`₹${Number(sales.totalMedicalBilling || 0).toLocaleString()}`}
              color="blue"
            />

            <KpiCard
              label="Payment Types"
              value={paymentLabels.length}
              color="amber"
            />

            <KpiCard
              label="Total Medical Bills"
              value={Number(totalBills || 0).toLocaleString()}
              color="purple"
            />
          </div>

          <div className="charts-row">
            <div className="card chart-card">
              <div className="card-header">
                <div>
                  <div className="card-title">Medical Billing by Payment Type</div>
                  <div className="card-subtitle">Amount collected in selected month</div>
                </div>
              </div>

              {paymentLabels.length > 0 ? (
                <div className="chart-container">
                  <Bar
                    data={paymentBarData}
                    options={{
                      ...chartDefaults,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: (context) =>
                              `₹${Number(context.raw || 0).toLocaleString()}`,
                          },
                        },
                      },
                      scales: {
                        x: { grid: { display: false } },
                        y: {
                          grid: { color: '#F0F2F8' },
                          ticks: {
                            callback: (value) =>
                              `₹${Number(value || 0).toLocaleString()}`,
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="empty-box">No medical billing found</div>
              )}
            </div>

            <div className="card chart-card">
              <div className="card-header">
                <div>
                  <div className="card-title">Payment Split</div>
                  <div className="card-subtitle">Cash / UPI / Card / Credit</div>
                </div>
              </div>

              {paymentLabels.length > 0 ? (
                <div className="doughnut-container">
                  <Doughnut data={paymentDoughnutData} options={{ ...chartDefaults, cutout: '70%' }} />
                </div>
              ) : (
                <div className="empty-box">No payment data</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Payment Type Details</div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Payment Type</th>
                    <th>Total Bills</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.medicalPayments?.length > 0 ? (
                    sales.medicalPayments.map((item) => (
                      <tr key={item.paymentType}>
                        <td>{item.paymentType}</td>
                        <td>{Number(item.totalBills || 0).toLocaleString()}</td>
                        <td>₹{Number(item.totalAmount || 0).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-data">No records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'inventory' && (
        <>
          <div className="kpi-grid">
            <KpiCard
              label="Total Items"
              value={Number(inventory.totalItems || 0).toLocaleString()}
              color="primary"
            />

            <KpiCard
              label="Inventory Value"
              value={`₹${Number(inventory.inventoryValue || 0).toLocaleString()}`}
              color="blue"
            />

            <KpiCard
              label="Low Stock"
              value={Number(inventory.lowStockItems || 0).toLocaleString()}
              color="amber"
            />

            <KpiCard
              label="Expiring Items"
              value={Number(inventory.expiringItems || 0).toLocaleString()}
              color="purple"
            />
          </div>

          <div className="kpi-grid">
            <KpiCard
              label="Categories"
              value={Number(inventory.totalCategories || 0).toLocaleString()}
              color="primary"
            />

            <KpiCard
              label="Active Items"
              value={Number(inventory.activeItems || 0).toLocaleString()}
              color="blue"
            />

            <KpiCard
              label="Out of Stock"
              value={Number(inventory.outOfStockItems || 0).toLocaleString()}
              color="amber"
            />

            <KpiCard
              label="Selling Value"
              value={`₹${Number(inventory.inventorySellingValue || 0).toLocaleString()}`}
              color="purple"
            />
          </div>

          <div className="charts-row">
            <div className="card chart-card">
              <div className="card-header">
                <div>
                  <div className="card-title">Stock Value by Category</div>
                  <div className="card-subtitle">Current stock purchase value</div>
                </div>
              </div>

              {categoryLabels.length > 0 ? (
                <div className="chart-container">
                  <Bar
                    data={categoryBarData}
                    options={{
                      ...chartDefaults,
                      scales: {
                        x: { grid: { display: false } },
                        y: {
                          grid: { color: '#F0F2F8' },
                          ticks: {
                            callback: (value) =>
                              `₹${Number(value || 0).toLocaleString()}`,
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="empty-box">No category stock data</div>
              )}
            </div>

            <div className="card chart-card">
              <div className="card-header">
                <div>
                  <div className="card-title">Stock Transactions</div>
                  <div className="card-subtitle">Selected month transaction value</div>
                </div>
              </div>

              {transactionLabels.length > 0 ? (
                <div className="doughnut-container">
                  <Doughnut
                    data={transactionDoughnutData}
                    options={{ ...chartDefaults, cutout: '70%' }}
                  />
                </div>
              ) : (
                <div className="empty-box">No stock transactions</div>
              )}
            </div>
          </div>

          <div className="bottom-row">
            <div className="card">
              <div className="card-title">Low Stock Items</div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Reorder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.lowStockList?.length > 0 ? (
                      inventory.lowStockList.map((item) => (
                        <tr key={item._id}>
                          <td>{item.name}</td>
                          <td>{item.categoryName || '—'}</td>
                          <td>{item.currentStock}</td>
                          <td>{item.reorderLevel}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="no-data">No low stock items</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Recent Stock Transactions</div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.recentTransactions?.length > 0 ? (
                      inventory.recentTransactions.map((trx) => (
                        <tr key={trx._id}>
                          <td>{trx.itemName}</td>
                          <td>{trx.transactionType}</td>
                          <td>{trx.quantity}</td>
                          <td>₹{Number(trx.totalAmount || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="no-data">No transactions</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .dashboard {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .dashboard-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 4px;
        }

        .dashboard-date,
        .tenant-line {
          font-size: 13px;
          color: var(--text-muted);
        }

        .tenant-line strong {
          color: var(--primary);
        }

        .filter-box {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 180px;
        }

        .filter-box label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .filter-box input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
        }

        .tab-row {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .tab {
          border: 1px solid var(--border);
          background: #fff;
          color: var(--text-muted);
          padding: 10px 18px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
        }

        .tab.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .kpi-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
        }

        .kpi-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .kpi-value {
          font-size: 26px;
          font-weight: 700;
          color: var(--text);
        }

        .kpi-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-icon-primary {
          background: rgba(15, 110, 86, 0.1);
          color: var(--primary);
        }

        .kpi-icon-blue {
          background: rgba(55, 138, 221, 0.1);
          color: var(--blue);
        }

        .kpi-icon-amber {
          background: rgba(186, 117, 23, 0.1);
          color: var(--amber);
        }

        .kpi-icon-purple {
          background: rgba(83, 74, 183, 0.1);
          color: var(--purple);
        }

        .charts-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        .bottom-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .card-header {
          margin-bottom: 16px;
        }

        .card-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }

        .card-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .chart-container {
          height: 260px;
        }

        .doughnut-container {
          height: 220px;
        }

        .empty-box {
          min-height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          border: 1px dashed var(--border);
          border-radius: 10px;
          background: #fafafa;
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto;
          margin-top: 14px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        th {
          text-align: left;
          padding: 12px;
          color: var(--text-muted);
          background: #fafafa;
          border-bottom: 1px solid var(--border);
        }

        td {
          padding: 12px;
          border-bottom: 1px solid var(--border-light);
          color: var(--text);
        }

        .no-data {
          text-align: center;
          color: var(--text-muted);
          padding: 24px;
        }

        .dashboard-loading {
          min-height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1200px) {
          .kpi-grid,
          .charts-row,
          .bottom-row {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard {
            padding: 16px;
          }

          .dashboard-header {
            flex-direction: column;
          }

          .filter-box {
            width: 100%;
          }

          .kpi-grid,
          .charts-row,
          .bottom-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}