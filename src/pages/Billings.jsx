import React, { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import DetailCard from '../components/DetailCard';
import { FormField } from '../components/FormField';

import { billingAPI, subscriptionSetupAPI } from '../services/api';

export default function Billings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const localUser = JSON.parse(localStorage.getItem('user')) || {};
  const role = localUser?.role?.toLowerCase()?.trim();
  const tenantId = localStorage.getItem('tenantId') || localUser?.tenantId;

  const isSaasAdmin = role === 'clinicossaassadmin';

  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  const fetchBillings = useCallback(async () => {
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
      if (filterDateFrom) params.dateFrom = filterDateFrom;
      if (filterDateTo) params.dateTo = filterDateTo;
      
      if (!isSaasAdmin && tenantId) {
        params.tenantId = tenantId;
      }

      const res = await billingAPI.getBillings(params);
      const billings = res.data?.data || [];

      setRows(billings);
      setPagination({
        page: res.data?.pagination?.page || 1,
        limit: res.data?.pagination?.limit || 10,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1
      });
    } catch (error) {
      console.error('Fetch billings error:', error);
      toast.error('Failed to fetch billings');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, searchQuery, filterStatus, filterDateFrom, filterDateTo, isSaasAdmin, tenantId]);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleSearchChange = (searchValue) => {
    setSearchQuery(searchValue);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = ({ sortBy, sortOrder }) => {
    setSortConfig({ sortBy, sortOrder });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilterChange = (value) => {
    setFilterStatus(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDateFromChange = (value) => {
    setFilterDateFrom(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDateToChange = (value) => {
    setFilterDateTo(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // OPTION 1: Admin marks as paid (Cash/Cheque/Offline)
  const handleAdminMarkAsPaid = async (billing, paymentMethod) => {
    if (!isSaasAdmin) return;
    
    try {
      setProcessingPayment(true);
      
      const transactionId = prompt('Enter transaction ID/reference (optional):');
      const notes = prompt('Enter payment notes (optional):');
      
      const response = await subscriptionSetupAPI.adminMarkAsPaid(billing._id, {
        paymentMethod,
        transactionId: transactionId || `ADMIN-${Date.now()}`,
        notes: notes || `Marked as paid by admin via ${paymentMethod}`
      });
      
      if (response.data?.success) {
        toast.success(`Payment marked as ${paymentMethod}. Subscription activated!`);
        
        // Close all modals
        setPaymentModalOpen(false);
        setViewOpen(false);
        setSelectedBillForPayment(null);
        setSelectedBilling(null);
        
        // Refresh data
        fetchBillings();
      } else {
        toast.error(response.data?.message || 'Failed to mark as paid');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update billing status');
    } finally {
      setProcessingPayment(false);
    }
  };

  // OPTION 2: Process Razorpay payment (for admin to help user pay)
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

  const handleRazorpayPayment = async (billing) => {
    if (!billing) return;
    
    try {
      setProcessingPayment(true);
      
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Razorpay SDK failed to load');
        return;
      }

      const orderRes = await subscriptionSetupAPI.createRazorpayOrder(billing._id);
      
      // Extract data from response
      const responseData = orderRes.data?.data || orderRes.data;
      let orderId = responseData?.orderId || responseData?.order?.id;
      let amount = billing.amount;
      let keyId = responseData?.keyId;
      
      // If order object exists, extract from there
      if (responseData?.order) {
        orderId = responseData.order.id;
        if (responseData.order.amount) {
          amount = responseData.order.amount / 100;
        }
      }

      if (!orderId) {
        toast.error('Unable to create payment order');
        return;
      }

      const localUser = JSON.parse(localStorage.getItem('user')) || {};

      const options = {
        key: keyId,
        amount: Math.round(Number(amount) * 100),
        currency: 'INR',
        name: 'ClinicOS',
        description: billing.invoiceNo,
        order_id: orderId,
        handler: async function (response) {
          try {
            toast.loading('Verifying payment...', { id: 'razorpay-verify' });
            
            const verifyRes = await subscriptionSetupAPI.verifyRazorpayPayment({
              billId: billing._id,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            
            if (verifyRes.data?.success) {
              toast.success('Payment successful! Subscription activated.', { id: 'razorpay-verify' });
              
              // Close all modals
              setPaymentModalOpen(false);
              setViewOpen(false);
              setSelectedBillForPayment(null);
              setSelectedBilling(null);
              
              // Refresh data
              fetchBillings();
            } else {
              toast.error(verifyRes.data?.message || 'Payment verification failed', { id: 'razorpay-verify' });
            }
          } catch (error) {
            console.error('Verify payment error:', error);
            toast.error('Payment verification failed', { id: 'razorpay-verify' });
          } finally {
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: localUser?.name || billing.clinic?.name || '',
          email: localUser?.email || '',
        },
        notes: {
          tenantId: billing.tenantId,
          invoiceNo: billing.invoiceNo,
        },
        theme: { color: '#0F6E56' },
        modal: {
          ondismiss: function() {
            setProcessingPayment(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response) {
        console.error('Payment failed:', response);
        toast.error(response.error?.description || 'Payment failed');
        setProcessingPayment(false);
      });
      
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed');
      setProcessingPayment(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateOnly = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const tableRows = useMemo(
    () =>
      rows.map((billing) => ({
        ...billing,
        id: billing._id,
        invoiceNo: billing.invoiceNo || '-',
        tenantId: billing.tenantId || '-',
        clinicName: billing.clinic?.name || '—',
        amount: billing.amount || 0,
        dateText: formatDateOnly(billing.createdAt),
        dateTime: formatDate(billing.createdAt),
        status: billing.status || 'Pending',
        paymentMethod: billing.paymentMethod || '-',
        raw: billing,
      })),
    [rows]
  );

  const columns = [
    {
      key: 'invoiceNo',
      label: 'Invoice No.',
      sortable: true,
      sortKey: 'invoiceNo',
      width: 220,
    },
    ...(isSaasAdmin ? [{
      key: 'tenantId',
      label: 'Tenant ID',
      sortable: true,
      sortKey: 'tenantId',
      width: 200,
    }] : []),
    {
      key: 'clinicName',
      label: 'Clinic',
      sortable: true,
      sortKey: 'clinic.name',
      render: (value) => value || '—',
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      sortKey: 'amount',
      width: 120,
      render: (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'dateText',
      label: 'Created Date',
      sortable: true,
      sortKey: 'createdAt',
      width: 120,
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      width: 130,
      render: (value) => {
        if (!value || value === '-') return '—';
        const methods = {
          razorpay: '💳 Online',
          cash: '💵 Cash',
          cheque: '📝 Cheque',
          bank_transfer: '🏦 Bank Transfer',
          offline: '📋 Offline'
        };
        return methods[value] || value;
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'status',
      width: 120,
      render: (value) => (
        <Badge
          color={
            value === 'Paid'
              ? 'green'
              : value === 'Pending'
              ? 'amber'
              : 'red'
          }
        >
          {value}
        </Badge>
      ),
    },
  ];

  // Payment Options Modal for Admin
  const PaymentOptionsModal = () => (
    <Modal
      open={paymentModalOpen}
      onClose={() => {
        if (!processingPayment) {
          setPaymentModalOpen(false);
          setSelectedBillForPayment(null);
        }
      }}
      title="Process Payment"
      subtitle={`Invoice: ${selectedBillForPayment?.invoiceNo} | Amount: ₹${selectedBillForPayment?.amount}`}
      width={500}
      hideActions
    >
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Select Payment Method</h4>
          
          <div 
            onClick={() => !processingPayment && handleRazorpayPayment(selectedBillForPayment)}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              cursor: processingPayment ? 'not-allowed' : 'pointer',
              background: 'white',
              opacity: processingPayment ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>💳 Online Payment (Razorpay)</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Credit Card, Debit Card, UPI, Net Banking
                </div>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => !processingPayment && handleAdminMarkAsPaid(selectedBillForPayment, 'cash')}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              cursor: processingPayment ? 'not-allowed' : 'pointer',
              background: 'white',
              opacity: processingPayment ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>💵 Cash</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Mark as paid when cash is received
                </div>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => !processingPayment && handleAdminMarkAsPaid(selectedBillForPayment, 'cheque')}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              cursor: processingPayment ? 'not-allowed' : 'pointer',
              background: 'white',
              opacity: processingPayment ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>📝 Cheque</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Record cheque payment
                </div>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => !processingPayment && handleAdminMarkAsPaid(selectedBillForPayment, 'bank_transfer')}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              cursor: processingPayment ? 'not-allowed' : 'pointer',
              background: 'white',
              opacity: processingPayment ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>🏦 Bank Transfer</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Record NEFT/RTGS/IMPS payment
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button 
            variant="outline" 
            onClick={() => {
              if (!processingPayment) {
                setPaymentModalOpen(false);
                setSelectedBillForPayment(null);
              }
            }}
            disabled={processingPayment}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );

  return (
    <>
      {/* Filters Bar */}
      <div style={{ 
        marginBottom: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        alignItems: 'flex-end',
        background: 'var(--bg-card, #fff)',
        padding: '16px',
        borderRadius: 12,
        border: '1px solid var(--border)'
      }}>
        <div>
          <FormField label="Status">
            <select
              value={filterStatus}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 13,
              }}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div>
          <FormField label="Date From">
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 13,
              }}
            />
          </FormField>
        </div>

        <div>
          <FormField label="Date To">
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 13,
              }}
            />
          </FormField>
        </div>

        {(filterStatus || filterDateFrom || filterDateTo) && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setFilterStatus('');
                setFilterDateFrom('');
                setFilterDateTo('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <DataTable
        title="Billings"
        subtitle={
          isSaasAdmin
            ? 'Track all clinic invoices and payments'
            : 'Track your clinic invoices and payments'
        }
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No billing records found."
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        actions={
          isSaasAdmin
            ? ({ row }) => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedBilling(row.raw);
                      setViewOpen(true);
                    }}
                    disabled={processingPayment}
                  >
                    View
                  </Button>

                  {row.status !== 'Paid' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedBillForPayment(row.raw);
                        setPaymentModalOpen(true);
                      }}
                      disabled={processingPayment}
                    >
                      Process Payment
                    </Button>
                  )}

                  {row.status !== 'Cancelled' && row.status !== 'Paid' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleAdminMarkAsPaid(row.raw, 'cancelled')}
                      disabled={processingPayment}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              )
            : ({ row }) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedBilling(row.raw);
                    setViewOpen(true);
                  }}
                  disabled={processingPayment}
                >
                  View
                </Button>
              )
        }
      />

      <PaymentOptionsModal />

      <Modal
        open={viewOpen}
        onClose={() => {
          if (!processingPayment) {
            setViewOpen(false);
            setSelectedBilling(null);
          }
        }}
        title="Invoice Details"
        footer={false}
        width={720}
      >
        {selectedBilling && (
          <DetailCard
            name={selectedBilling.clinic?.name || 'Clinic'}
            subId={`Invoice No: ${selectedBilling.invoiceNo}`}
            badgeColor={
              selectedBilling.status === 'Paid'
                ? 'green'
                : selectedBilling.status === 'Pending'
                ? 'amber'
                : 'red'
            }
            badgeLabel={selectedBilling.status}
            fields={[
              { label: 'Tenant ID', value: selectedBilling.tenantId },
              { label: 'Invoice No', value: selectedBilling.invoiceNo },
              {
                label: 'Amount',
                value: `₹${Number(selectedBilling.amount || 0).toLocaleString('en-IN')}`,
                accent: 'primary',
              },
              { label: 'Status', value: selectedBilling.status },
              { label: 'Payment Method', value: selectedBilling.paymentMethod || '—' },
              { label: 'Transaction ID', value: selectedBilling.transactionId || '—' },
              {
                label: 'Description',
                value: selectedBilling.description || '—',
              },
              {
                label: 'Start Date',
                value: formatDateOnly(selectedBilling.startDate),
              },
              {
                label: 'End Date',
                value: formatDateOnly(selectedBilling.endDate),
              },
              {
                label: 'Due Date',
                value: formatDateOnly(selectedBilling.dueDate),
              },
              {
                label: 'Created Date',
                value: formatDate(selectedBilling.createdAt),
              },
              {
                label: 'Last Updated',
                value: formatDate(selectedBilling.updatedAt),
              },
            ]}
          >
            {isSaasAdmin && selectedBilling.status !== 'Paid' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedBillForPayment(selectedBilling);
                    setPaymentModalOpen(true);
                    setViewOpen(false);
                  }}
                  disabled={processingPayment}
                >
                  Process Payment
                </Button>

                <Button
                  variant="danger"
                  onClick={() => handleAdminMarkAsPaid(selectedBilling, 'cancelled')}
                  disabled={processingPayment}
                >
                  Cancel Invoice
                </Button>
              </div>
            )}
          </DetailCard>
        )}
      </Modal>
    </>
  );
}