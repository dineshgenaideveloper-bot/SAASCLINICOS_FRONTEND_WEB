import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import DetailCard from '../components/DetailCard';
import Button from '../components/Button';
import Modal from '../components/Modal';

import { subscriptionUserAPI, clinicAPI } from '../services/api';

// Storage Management Component as a Tab
function StorageManagement({ tenantId, clinicName }) {
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [clearingCollection, setClearingCollection] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [clinicId, setClinicId] = useState(null);

  // Fetch clinic ID by tenantId
  const fetchClinicId = async () => {
    try {
      const response = await clinicAPI.getClinics({ tenantId });
      if (response.data?.data?.[0]?._id) {
        setClinicId(response.data.data[0]._id);
      }
    } catch (error) {
      console.error('Fetch clinic error:', error);
      toast.error('Failed to fetch clinic information');
    }
  };

  const fetchStorageInfo = async () => {
    if (!clinicId) {
      toast.error('Clinic ID not found');
      return;
    }
    
    try {
      setLoading(true);
      const response = await clinicAPI.getStorageInfo(clinicId);
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Fetch storage error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch storage information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchClinicId();
    }
  }, [tenantId]);

  useEffect(() => {
    if (clinicId) {
      fetchStorageInfo();
    }
  }, [clinicId]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const exportCollectionData = async (collection) => {
    if (!clinicId) {
      toast.error('Clinic ID not found');
      return;
    }
    
    try {
      setExportingData(true);
      toast.loading(`Exporting ${collection.name} data...`, { id: 'export-data' });
      
      const response = await clinicAPI.exportCollectionData(clinicId, collection.name);
      
      if (response.data.success && response.data.data.length > 0) {
        const data = response.data.data;
        const flattenedData = data.map(row => flattenObject(row));
        
        const ws = XLSX.utils.json_to_sheet(flattenedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, collection.name.substring(0, 31));
        
        const metadata = [
          ['Export Date', new Date().toLocaleString()],
          ['Collection Name', collection.name],
          ['Total Documents', data.length],
          ['Clinic Name', clinicName || 'N/A'],
          ['Tenant ID', tenantId || 'N/A']
        ];
        const wsMeta = XLSX.utils.aoa_to_sheet(metadata);
        XLSX.utils.book_append_sheet(wb, wsMeta, 'Export Info');
        
        const fileName = `${collection.name}_data_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        toast.success(`Exported ${data.length} documents from ${collection.name}`, { id: 'export-data' });
      } else {
        toast.error(`No data found in ${collection.name}`, { id: 'export-data' });
      }
    } catch (error) {
      console.error('Export data error:', error);
      toast.error(error.response?.data?.message || 'Failed to export collection data', { id: 'export-data' });
    } finally {
      setExportingData(false);
    }
  };

  const flattenObject = (obj, prefix = '') => {
    const flattened = {};
    
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (value && typeof value === 'object' && !Array.isArray(value) && value !== null) {
          if (value instanceof Date) {
            flattened[newKey] = value.toISOString();
          } else if (value._id) {
            flattened[newKey] = value._id.toString();
          } else {
            Object.assign(flattened, flattenObject(value, newKey));
          }
        } else if (Array.isArray(value)) {
          flattened[newKey] = JSON.stringify(value);
        } else if (value instanceof Date) {
          flattened[newKey] = value.toISOString();
        } else {
          flattened[newKey] = value;
        }
      }
    }
    
    return flattened;
  };

  const exportStorageReport = () => {
    if (!storageInfo?.data?.collections) return;

    try {
      setExportLoading(true);
      
      const exportData = storageInfo.data.collections.map(col => ({
        'Collection Name': col.name,
        'Documents': col.documents.toLocaleString(),
        'Size (MB)': col.size,
        'Data Size (MB)': col.dataSize,
        'Avg Document Size (KB)': col.avgDocSize,
        'Index Size (MB)': col.indexSize
      }));

      exportData.push({
        'Collection Name': '=== SUMMARY ===',
        'Documents': storageInfo.data.totalDocuments.toLocaleString(),
        'Size (MB)': storageInfo.data.totalSize,
        'Data Size (MB)': '-',
        'Avg Document Size (KB)': '-',
        'Index Size (MB)': '-'
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 22 }, { wch: 15 }];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Storage Report');
      
      const metadata = [
        ['Generated On', new Date().toLocaleString()],
        ['Database Name', storageInfo.data.databaseName],
        ['Tenant ID', storageInfo.data.tenantId],
        ['Clinic Name', clinicName || 'N/A'],
        ['Total Collections', storageInfo.data.totalCollections],
        ['Total Documents', storageInfo.data.totalDocuments.toLocaleString()],
        ['Total Size', storageInfo.data.totalSize]
      ];
      const wsMeta = XLSX.utils.aoa_to_sheet(metadata);
      XLSX.utils.book_append_sheet(wb, wsMeta, 'Report Info');

      const fileName = `storage_report_${storageInfo.data.tenantId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Storage report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export storage report');
    } finally {
      setExportLoading(false);
    }
  };

  const handleClearCollection = (collection) => {
    setSelectedCollection(collection);
    setConfirmText('');
    setClearModalOpen(true);
  };

  const confirmClearCollection = async () => {
    if (confirmText !== selectedCollection.name) {
      toast.error(`Please type "${selectedCollection.name}" to confirm`);
      return;
    }

    try {
      setClearingCollection(true);
      const response = await clinicAPI.clearCollection(clinicId, selectedCollection.name);
      
      if (response.data.success) {
        toast.success(`Collection "${selectedCollection.name}" cleared successfully`);
        fetchStorageInfo();
        setClearModalOpen(false);
        setSelectedCollection(null);
        setConfirmText('');
      } else {
        toast.error(response.data.message || 'Failed to clear collection');
      }
    } catch (error) {
      console.error('Clear collection error:', error);
      toast.error(error.response?.data?.message || 'Failed to clear collection');
    } finally {
      setClearingCollection(false);
    }
  };

  const getSizeColor = (size) => {
    if (size > 100) return 'danger';
    if (size > 50) return 'warning';
    if (size > 10) return 'info';
    return 'success';
  };

  const collectionColumns = [
    {
      key: 'name',
      label: 'Collection Name',
      width: 250,
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{value}</div>
          {row.documents === 0 && (
            <Badge color="gray" size="sm" style={{ marginTop: 4 }}>Empty</Badge>
          )}
        </div>
      )
    },
    {
      key: 'documents',
      label: 'Documents',
      width: 120,
      render: (value) => value.toLocaleString()
    },
    {
      key: 'size',
      label: 'Size (MB)',
      width: 120,
      render: (value, row) => (
        <Badge color={getSizeColor(value)}>
          {value} MB
        </Badge>
      )
    },
    {
      key: 'dataSize',
      label: 'Data Size (MB)',
      width: 120,
      render: (value) => value.toFixed(2)
    },
    {
      key: 'avgDocSize',
      label: 'Avg Doc Size (KB)',
      width: 150,
      render: (value) => `${value.toFixed(2)} KB`
    },
    {
      key: 'indexSize',
      label: 'Index Size (MB)',
      width: 120,
      render: (value) => value.toFixed(2)
    }
  ];

  if (!tenantId) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 40,
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}>
        <h3>Loading storage information...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 6px', color: 'var(--text)' }}>
            Database Storage Information
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
            Clinic: {clinicName || 'Loading...'} | Tenant ID: {tenantId}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            variant="outline"
            onClick={exportStorageReport}
            loading={exportLoading}
            disabled={loading || !storageInfo}
          >
            📊 Export Report
          </Button>
          <Button
            variant="primary"
            onClick={fetchStorageInfo}
            loading={loading}
          >
            🔄 Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div>Loading storage information...</div>
        </div>
      ) : storageInfo?.data ? (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 16 
          }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 16
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Total Database Size
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>
                {storageInfo.data.totalSize}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {formatBytes(storageInfo.data.totalSizeBytes)}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 16
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Total Collections
              </div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {storageInfo.data.totalCollections}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 16
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Total Documents
              </div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {storageInfo.data.totalDocuments.toLocaleString()}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 16
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Last Updated
              </div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {new Date(storageInfo.data.lastUpdated).toLocaleString()}
              </div>
            </div>
          </div>

          <DataTable
            title="Collection Details"
            subtitle="Storage usage by collection"
            columns={collectionColumns}
            rows={storageInfo.data.collections}
            loading={loading}
            emptyText="No collections found."
            actions={({ row }) => (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportCollectionData(row)}
                  loading={exportingData}
                  disabled={row.documents === 0}
                >
                  📥 Export Data
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleClearCollection(row)}
                  disabled={row.documents === 0}
                >
                  Clear Collection
                </Button>
              </div>
            )}
          />
        </>
      ) : (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 40,
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          No storage information available. Click refresh to load data.
        </div>
      )}

      <Modal
        open={clearModalOpen}
        onClose={() => {
          setClearModalOpen(false);
          setSelectedCollection(null);
          setConfirmText('');
        }}
        title="⚠️ Clear Collection"
        subtitle={`Collection: ${selectedCollection?.name}`}
        width={500}
      >
        {selectedCollection && (
          <div style={{ padding: '20px' }}>
            <div style={{
              background: 'var(--danger-light)',
              border: '1px solid var(--danger)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20
            }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--danger)' }}>
                ⚠️ DANGER: This action cannot be undone!
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>
                You are about to delete all <strong>{selectedCollection.documents.toLocaleString()}</strong> documents from the 
                <strong> "{selectedCollection.name}"</strong> collection.
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                Collection Statistics:
              </div>
              <div style={{
                background: 'var(--bg)',
                borderRadius: 6,
                padding: 12,
                fontSize: 13
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Documents:</span>
                  <strong>{selectedCollection.documents.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Total Size:</span>
                  <strong>{selectedCollection.size} MB</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Index Size:</span>
                  <strong>{selectedCollection.indexSize} MB</strong>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                Type <strong style={{ color: 'var(--danger)' }}>{selectedCollection.name}</strong> to confirm:
              </div>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type ${selectedCollection.name}`}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 14
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                onClick={() => {
                  setClearModalOpen(false);
                  setSelectedCollection(null);
                  setConfirmText('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmClearCollection}
                loading={clearingCollection}
                disabled={confirmText !== selectedCollection.name || clearingCollection}
              >
                Permanently Clear Collection
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Main Subscription User Component with Tabs
export default function SubscriptionUser() {
  const [permission, setPermission] = useState(null);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingBillId, setProcessingBillId] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [activeTab, setActiveTab] = useState('subscription');

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await subscriptionUserAPI.getMySubscription();
      setPermission(res.data?.data?.permission || null);
      setBillings(res.data?.data?.billings || []);
    } catch (error) {
      console.error('Fetch subscription error:', error);
      toast.error('Failed to fetch subscription details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayBill = async (bill) => {
    setSelectedBill(bill);
    setPaymentModalOpen(true);
  };

  const processPayment = async () => {
    if (!selectedBill) return;
    
    try {
      setProcessingBillId(selectedBill._id);
      setPaymentModalOpen(false);
      
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Payment gateway failed to load. Please try again.');
        return;
      }

      const orderRes = await subscriptionUserAPI.createOrder({ billingId: selectedBill._id });
      const responseData = orderRes.data?.data || orderRes.data;
      
      let orderId = responseData?.orderId || responseData?.order?.id;
      let keyId = responseData?.keyId;
      let amount = selectedBill.amount;
      
      if (responseData?.order) {
        orderId = responseData.order.id;
        if (responseData.order.amount) {
          amount = responseData.order.amount / 100;
        }
      }
      
      const invoiceNo = responseData?.invoiceNo || selectedBill.invoiceNo;

      if (!orderId) {
        console.error('Order creation failed - No order ID:', orderRes.data);
        toast.error('Unable to create payment order. Please try again.');
        return;
      }

      const localUser = JSON.parse(localStorage.getItem('user')) || {};

      const options = {
        key: keyId,
        amount: Math.round(Number(amount) * 100),
        currency: 'INR',
        name: 'ClinicOS',
        description: `Payment for ${invoiceNo}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            toast.loading('Verifying payment...', { id: 'payment-verify' });
            
            const verifyRes = await subscriptionUserAPI.verifyPayment({
              billingId: selectedBill._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data?.success) {
              toast.success('Payment successful! Your subscription is now active.', { id: 'payment-verify' });
              fetchSubscription();
            } else {
              toast.error(verifyRes.data?.message || 'Payment verification failed', { id: 'payment-verify' });
            }
          } catch (error) {
            console.error('Verify payment error:', error);
            toast.error('Payment verification failed. Please contact support.', { id: 'payment-verify' });
          }
        },
        prefill: {
          name: localUser?.name || permission?.clinic?.name || '',
          email: localUser?.email || '',
          contact: localUser?.phone || '',
        },
        notes: {
          tenantId: permission?.tenantId || '',
          invoiceNo: invoiceNo,
          billId: selectedBill._id,
        },
        theme: {
          color: '#0F6E56',
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled');
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response) {
        console.error('Payment failed:', response);
        toast.error(response.error?.description || 'Payment failed. Please try again.');
      });
      
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessingBillId(null);
      setSelectedBill(null);
    }
  };

  const getDueDate = (bill) => {
    if (bill.dueDate) {
      return new Date(bill.dueDate);
    }
    return new Date(new Date(bill.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  };

  const getReminder = (bill) => {
    if (bill.status === 'Paid') return 'Paid';
    if (bill.status === 'Cancelled') return 'Cancelled';

    const dueDate = getDueDate(bill);
    const today = new Date();
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays <= 3) return `Due in ${diffDays} day(s)`;
    return `Due on ${dueDate.toLocaleDateString()}`;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'green';
      case 'Pending': return 'amber';
      case 'Overdue': return 'red';
      case 'Cancelled': return 'gray';
      default: return 'blue';
    }
  };

  const billingColumns = [
    {
      key: 'invoiceNo',
      label: 'Invoice No.',
      width: 180,
    },
    {
      key: 'amount',
      label: 'Amount',
      width: 100,
      render: (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'period',
      label: 'Billing Period',
      width: 200,
      render: (_, row) => {
        if (row.startDate && row.endDate) {
          return `${new Date(row.startDate).toLocaleDateString()} - ${new Date(row.endDate).toLocaleDateString()}`;
        }
        return '—';
      }
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      width: 120,
      render: (_, row) => getDueDate(row).toLocaleDateString(),
    },
    {
      key: 'reminder',
      label: 'Reminder',
      width: 140,
      render: (_, row) => {
        const text = getReminder(row);
        let color = 'blue';
        if (text === 'Paid') color = 'green';
        else if (text === 'Overdue') color = 'red';
        else if (text.startsWith('Due in')) color = 'amber';
        else if (text === 'Cancelled') color = 'gray';
        
        return <Badge color={color}>{text}</Badge>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      width: 100,
      render: (value) => (
        <Badge color={getStatusColor(value)}>
          {value}
        </Badge>
      ),
    },
  ];

  const isSubscriptionActive = permission?.isActive && 
    permission?.subscriptionEndDate && 
    new Date(permission.subscriptionEndDate) > new Date();

  const hasPendingBills = billings.some(b => b.status === 'Pending');

  const tabs = [
    { id: 'subscription', label: 'Subscription Details', icon: '📋' },
    { id: 'storage', label: 'Database Storage', icon: '💾' }
  ];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div>
        <h2 style={{ margin: '0 0 6px', color: 'var(--text)' }}>
          My Subscription
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
          View your active subscription, permissions and database storage.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: 4,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 0
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'subscription' ? (
        <>
          {!permission ? (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 24,
                color: 'var(--text-muted)',
                fontSize: 13,
                textAlign: 'center'
              }}
            >
              No subscription found for this tenant. Please contact admin to set up your subscription.
            </div>
          ) : (
            <>
              <DetailCard
                name={permission.clinic?.name || 'Clinic'}
                subId={`Tenant ID: ${permission.tenantId}`}
                badgeColor={isSubscriptionActive ? 'green' : 'red'}
                badgeLabel={isSubscriptionActive ? 'Active' : 'Inactive'}
                fields={[
                  {
                    label: 'Subscription Period',
                    value: permission.subscriptionStartDate && permission.subscriptionEndDate
                      ? `${new Date(permission.subscriptionStartDate).toLocaleDateString()} - ${new Date(permission.subscriptionEndDate).toLocaleDateString()}`
                      : '—',
                  },
                  {
                    label: 'Days Remaining',
                    value: isSubscriptionActive && permission.subscriptionEndDate
                      ? `${Math.ceil((new Date(permission.subscriptionEndDate) - new Date()) / (1000 * 60 * 60 * 24))} days`
                      : 'Expired',
                  },
                  {
                    label: 'Login Plan',
                    value: permission.loginPricePlan?.planName || '—',
                  },
                  {
                    label: 'Login Count',
                    value: permission.loginCount || 0,
                  },
                  {
                    label: 'Base Price',
                    value: `₹${permission.basePrice || 0}`,
                  },
                  {
                    label: 'Final Price (30 days)',
                    value: `₹${permission.finalPrice || 0}`,
                    accent: 'primary',
                  },
                  {
                    label: 'Features',
                    value: permission.features?.map((f) => f.name).join(', ') || '—',
                  },
                  {
                    label: 'User Types',
                    value: permission.userTypes?.map((u) => u.userTypeName).join(', ') || '—',
                  },
                ]}
              />

              <DataTable
                title="My Bills"
                subtitle="Bills are payable every 30 days. Reminder starts 3 days before due date."
                columns={billingColumns}
                rows={billings.filter(b => b.status !== 'Cancelled')}
                loading={loading}
                emptyText="No bills found."
                actions={({ row }) =>
                  row.status === 'Pending' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handlePayBill(row)}
                      loading={processingBillId === row._id}
                      disabled={processingBillId === row._id}
                    >
                      Pay Now
                    </Button>
                  ) : row.status === 'Overdue' ? (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handlePayBill(row)}
                      loading={processingBillId === row._id}
                      disabled={processingBillId === row._id}
                    >
                      Pay Overdue
                    </Button>
                  ) : null
                }
              />

              {hasPendingBills && (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 16,
                    marginTop: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Total Pending Amount</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>
                        ₹{billings.filter(b => b.status === 'Pending').reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {billings.filter(b => b.status === 'Pending').length} pending bill(s)
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Payment Modal */}
          <Modal
            open={paymentModalOpen}
            onClose={() => {
              setPaymentModalOpen(false);
              setSelectedBill(null);
            }}
            title="Complete Payment"
            subtitle={`Invoice: ${selectedBill?.invoiceNo}`}
            width={450}
            hideActions
          >
            {selectedBill && (
              <div style={{ padding: '20px' }}>
                <div
                  style={{
                    background: '#f8f9fa',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 24,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Invoice No:</span>
                    <span style={{ fontWeight: 500 }}>{selectedBill.invoiceNo}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Billing Period:</span>
                    <span style={{ fontWeight: 500 }}>
                      {selectedBill.startDate && selectedBill.endDate
                        ? `${new Date(selectedBill.startDate).toLocaleDateString()} - ${new Date(selectedBill.endDate).toLocaleDateString()}`
                        : '30 days'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Due Date:</span>
                    <span style={{ fontWeight: 500, color: 'var(--primary)' }}>
                      {getDueDate(selectedBill).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0', paddingTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>Total Amount:</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>
                        ₹{Number(selectedBill.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>Select Payment Method</div>
                  
                  <div
                    style={{
                      border: '2px solid var(--primary)',
                      borderRadius: 8,
                      padding: 16,
                      background: 'var(--primary-light)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>💳 Online Payment</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Credit Card • Debit Card • UPI • Net Banking • Wallet
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPaymentModalOpen(false);
                      setSelectedBill(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={processPayment}
                    loading={processingBillId === selectedBill._id}
                    disabled={processingBillId === selectedBill._id}
                  >
                    Pay ₹{Number(selectedBill.amount || 0).toLocaleString('en-IN')}
                  </Button>
                </div>

                <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                  🔒 Secure payment powered by Razorpay. Your payment information is encrypted and secure.
                </div>
              </div>
            )}
          </Modal>
        </>
      ) : (
        <StorageManagement 
          tenantId={permission?.tenantId} 
          clinicName={permission?.clinic?.name} 
        />
      )}
    </div>
  );
}