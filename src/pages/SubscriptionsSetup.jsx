// SubscriptionsSetup.jsx
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { FormField, SelectField } from '../components/FormField';
import { subscriptionSetupAPI } from '../services/api';

export default function SubscriptionsSetup() {
  const [clinics, setClinics] = useState([]);
  const [features, setFeatures] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [loginPrices, setLoginPrices] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [billsByTenant, setBillsByTenant] = useState({});

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);

  const [form, setForm] = useState({
    features: [],
    userTypes: [],
    loginPricePlan: '',
    loginCount: 1,
    useBasePrice: true,
    manualPrice: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await subscriptionSetupAPI.getData();
      const data = res.data?.data || {};

      setClinics(data.clinics || []);
      setFeatures(data.features || []);
      setUserTypes(data.userTypes || []);
      setLoginPrices(data.loginPrices || []);
      setPermissions(data.permissions || []);
      setBillsByTenant(data.billsByTenant || {});
    } catch (error) {
      console.error('Fetch subscription setup data error:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPermission = (tenantId) =>
    permissions.find((p) => p.tenantId === tenantId);

  const getSubscriptionStatus = (clinic) => {
    const permission = getPermission(clinic.tenantId);
    if (!permission) return 'not_configured';
    
    const now = new Date();
    const endDate = new Date(permission.subscriptionEndDate);
    
    if (!permission.isActive) return 'inactive';
    if (endDate < now) return 'expired';
    if (permission.isActive) return 'active';
    return 'not_configured';
  };

  const getDaysRemaining = (clinic) => {
    const permission = getPermission(clinic.tenantId);
    if (!permission || !permission.subscriptionEndDate) return null;
    
    const now = new Date();
    const endDate = new Date(permission.subscriptionEndDate);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const openSetup = async (clinic) => {
    setSelectedClinic(clinic);
    const existing = getPermission(clinic.tenantId);

    setForm({
      features: existing?.features?.map((f) => f._id) || [],
      userTypes: existing?.userTypes?.map((u) => u._id) || [],
      loginPricePlan: existing?.loginPricePlan?._id || '',
      loginCount: existing?.loginCount || 1,
      useBasePrice: existing?.useBasePrice ?? true,
      manualPrice: existing?.useBasePrice ? '' : existing?.finalPrice || '',
    });

    setOpen(true);
  };

  const openBillingHistory = async (clinic) => {
    try {
      const res = await subscriptionSetupAPI.getBillingHistory(clinic.tenantId);
      setSelectedBilling({
        clinic,
        bills: res.data?.data || []
      });
      setBillingModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch billing history:', error);
      toast.error('Failed to fetch billing history');
    }
  };

  const generateManualBill = async (clinic) => {
    try {
      await subscriptionSetupAPI.generateManualBill(clinic.tenantId);
      toast.success('Manual bill generated successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to generate manual bill:', error);
      toast.error('Failed to generate manual bill');
    }
  };

  const selectedFeatureItems = useMemo(
    () => features.filter((f) => form.features.includes(f._id)),
    [features, form.features]
  );

  const selectedUserTypeItems = useMemo(
    () => userTypes.filter((u) => form.userTypes.includes(u._id)),
    [userTypes, form.userTypes]
  );

  const selectedLoginPrice = useMemo(
    () => loginPrices.find((p) => p._id === form.loginPricePlan),
    [loginPrices, form.loginPricePlan]
  );

  const basePrice = useMemo(() => {
    const featureTotal = selectedFeatureItems.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );

    const userTypeTotal = selectedUserTypeItems.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0
    );

    const loginTotal =
      Number(selectedLoginPrice?.price || 0) * Number(form.loginCount || 1);

    return featureTotal + userTypeTotal + loginTotal;
  }, [
    selectedFeatureItems,
    selectedUserTypeItems,
    selectedLoginPrice,
    form.loginCount,
  ]);

  const finalPrice = form.useBasePrice
    ? basePrice
    : Number(form.manualPrice || 0);

  const handleMultiCheck = (key, id) => {
    setForm((prev) => {
      const exists = prev[key].includes(id);
      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((x) => x !== id)
          : [...prev[key], id],
      };
    });
  };

  const handleSubmit = async () => {
    if (!selectedClinic) return;

    try {
      const payload = {
        clinicId: selectedClinic._id,
        tenantId: selectedClinic.tenantId,
        features: form.features,
        userTypes: form.userTypes,
        loginPricePlan: form.loginPricePlan || null,
        loginCount: Number(form.loginCount || 1),
        basePrice,
        finalPrice,
        useBasePrice: form.useBasePrice,
      };

      await subscriptionSetupAPI.saveSubscription(payload);
      toast.success('Subscription saved successfully');
      setOpen(false);
      setSelectedClinic(null);
      fetchData();
    } catch (error) {
      console.error('Save subscription error:', error);
      toast.error('Failed to save subscription');
    }
  };

  const handleCancelSubscription = async (clinic) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      try {
        await subscriptionSetupAPI.cancelSubscription(clinic.tenantId);
        toast.success('Subscription cancelled successfully');
        fetchData();
      } catch (error) {
        console.error('Cancel subscription error:', error);
        toast.error('Failed to cancel subscription');
      }
    }
  };

  const rows = clinics.map((clinic) => {
    const permission = getPermission(clinic.tenantId);
    const status = getSubscriptionStatus(clinic);
    const daysRemaining = getDaysRemaining(clinic);

    let statusBadge = { color: 'gray', text: 'Not Configured' };
    switch (status) {
      case 'active':
        statusBadge = { color: 'green', text: `Active (${daysRemaining} days left)` };
        break;
      case 'expired':
        statusBadge = { color: 'red', text: 'Expired' };
        break;
      case 'inactive':
        statusBadge = { color: 'red', text: 'Inactive' };
        break;
      default:
        statusBadge = { color: 'amber', text: 'Not Configured' };
    }

    return {
      id: clinic._id,
      name: clinic.name || '—',
      tenantId: clinic.tenantId || '—',
      owner: clinic.owner?.name || '—',
      email: clinic.owner?.email || '—',
      city: clinic.address?.city || '—',
      status: statusBadge.text,
      statusColor: statusBadge.color,
      raw: clinic,
      permission,
    };
  });

  const columns = [
    { key: 'name', label: 'Clinic', sortable: true },
    { key: 'tenantId', label: 'Tenant ID', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'email', label: 'Owner Email' },
    { key: 'city', label: 'City' },
    {
      key: 'status',
      label: 'Subscription Status',
      render: (value, row) => (
        <Badge color={row.statusColor}>
          {value}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Subscription Setup"
        subtitle="Manage clinic subscriptions and billing"
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No clinics found."
        actions={({ row }) => {
          const status = getSubscriptionStatus(row.raw);
          const hasSubscription = status !== 'not_configured';
          
          return (
            <div style={{ display: 'flex', gap: 8 }}>
              {!hasSubscription ? (
                <Button size="sm" onClick={() => openSetup(row.raw)}>
                  Setup
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => openSetup(row.raw)}>
                    Update Plan
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => generateManualBill(row.raw)}
                  >
                    Generate Bill
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => openBillingHistory(row.raw)}
                  >
                    History
                  </Button>
                  {status === 'active' && (
                    <Button 
                      size="sm" 
                      variant="danger" 
                      onClick={() => handleCancelSubscription(row.raw)}
                    >
                      Cancel
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        }}
      />

      {/* Setup/Update Modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setSelectedClinic(null);
        }}
        title={getPermission(selectedClinic?.tenantId) ? "Update Subscription" : "Setup Subscription"}
        subtitle={
          selectedClinic
            ? `${selectedClinic.name} · ${selectedClinic.tenantId}`
            : ''
        }
        confirmLabel={getPermission(selectedClinic?.tenantId) ? "Update Subscription" : "Save Subscription"}
        onConfirm={handleSubmit}
        width={760}
        bodyStyle={{ maxHeight: '65vh' }}
      >
        <div style={{ display: 'grid', gap: 18 }}>
          <Section title="Select Features">
            <CheckGrid>
              {features.map((item) => (
                <CheckCard
                  key={item._id}
                  checked={form.features.includes(item._id)}
                  onClick={() => handleMultiCheck('features', item._id)}
                  title={item.name}
                  subtitle={`${item.module || 'Module'} · ₹${item.price || 0}`}
                />
              ))}
            </CheckGrid>
          </Section>

          <Section title="Select User Types">
            <CheckGrid>
              {userTypes.map((item) => (
                <CheckCard
                  key={item._id}
                  checked={form.userTypes.includes(item._id)}
                  onClick={() => handleMultiCheck('userTypes', item._id)}
                  title={item.userTypeName}
                  subtitle={`${item.icon || 'Icon'} · ₹${item.price || 0}`}
                />
              ))}
            </CheckGrid>
          </Section>

          <Section title="Login Price Plan">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12 }}>
              <SelectField
                label="Login Price Plan"
                value={form.loginPricePlan}
                onChange={(e) =>
                  setForm({ ...form, loginPricePlan: e.target.value })
                }
              >
                <option value="">Select plan</option>
                {loginPrices.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.planName} - ₹{item.price}
                  </option>
                ))}
              </SelectField>

              <FormField label="Login Count">
                <input
                  type="number"
                  min="1"
                  value={form.loginCount}
                  onChange={(e) =>
                    setForm({ ...form, loginCount: e.target.value })
                  }
                />
              </FormField>
            </div>
          </Section>

          <Section title="Price Calculation">
            <div
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 14,
                display: 'grid',
                gap: 10,
              }}
            >
              <PriceRow label="Features Total" value={selectedFeatureItems.reduce((s, i) => s + Number(i.price || 0), 0)} />
              <PriceRow label="User Types Total" value={selectedUserTypeItems.reduce((s, i) => s + Number(i.price || 0), 0)} />
              <PriceRow
                label="Login Price Total"
                value={Number(selectedLoginPrice?.price || 0) * Number(form.loginCount || 1)}
              />
              <PriceRow label="Base Price" value={basePrice} bold />

              <SelectField
                label="Price Option"
                value={form.useBasePrice ? 'base' : 'manual'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    useBasePrice: e.target.value === 'base',
                  })
                }
              >
                <option value="base">Use Base Price (30 days)</option>
                <option value="manual">Enter Manual Price</option>
              </SelectField>

              {!form.useBasePrice && (
                <FormField label="Manual Price">
                  <input
                    type="number"
                    value={form.manualPrice}
                    onChange={(e) =>
                      setForm({ ...form, manualPrice: e.target.value })
                    }
                    placeholder="Enter final price"
                  />
                </FormField>
              )}

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--primary)',
                  paddingTop: 6,
                }}
              >
                Final Price (30 days): ₹{finalPrice}
              </div>
            </div>
          </Section>
        </div>
      </Modal>

      {/* Billing History Modal */}
      <Modal
        open={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        title="Billing History"
        subtitle={selectedBilling?.clinic?.name}
        width={800}
        hideActions
      >
        {selectedBilling?.bills?.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Invoice No</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Period</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Amount</th>
                <th style={{ textAlign: 'center', padding: 8 }}>Status</th>
                <th style={{ textAlign: 'center', padding: 8 }}>Generated</th>
              </tr>
            </thead>
            <tbody>
              {selectedBilling.bills.map((bill) => (
                <tr key={bill._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 8 }}>{bill.invoiceNo}</td>
                  <td style={{ padding: 8, fontSize: 12 }}>
                    {new Date(bill.startDate).toLocaleDateString()} - {new Date(bill.endDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>₹{bill.amount}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>
                    <Badge color={
                      bill.status === 'Paid' ? 'green' : 
                      bill.status === 'Overdue' ? 'red' : 'amber'
                    }>
                      {bill.status}
                    </Badge>
                  </td>
                  <td style={{ padding: 8, textAlign: 'center', fontSize: 11 }}>
                    {bill.generatedBy === 'auto' ? '🤖 Auto' : '👤 Manual'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', padding: 40 }}>No billing history found</p>
        )}
      </Modal>
    </>
  );
}

// Helper Components
function Section({ title, children }) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function CheckGrid({ children }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 10,
      }}
    >
      {children}
    </div>
  );
}

function CheckCard({ checked, onClick, title, subtitle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        background: checked ? 'var(--primary-light)' : '#fff',
        border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 8,
        padding: 12,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: checked ? 'var(--primary)' : 'var(--text)',
        }}
      >
        {checked ? '✓ ' : ''}
        {title}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--text-muted)',
          marginTop: 3,
        }}
      >
        {subtitle}
      </div>
    </button>
  );
}



function PriceRow({ label, value, bold }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: bold ? 14 : 13,
        fontWeight: bold ? 700 : 500,
        color: bold ? 'var(--text)' : 'var(--text-muted)',
      }}
    >
      <span>{label}</span>
      <span>₹{value || 0}</span>
    </div>
  );
}