import React, { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Eye } from 'lucide-react';

import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import DataTable from '../../components/DataTable';
import { FormField } from '../../components/FormField';

import { inventoryAPI } from '../../services/api';

export default function StockTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

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
  const [filterType, setFilterType] = useState('');
  const [filterReferenceType, setFilterReferenceType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const transactionTypeOptions = [
    { label: 'All Types', value: '' },
    { label: 'Purchase', value: 'purchase' },
    { label: 'Sale', value: 'sale' },
    { label: 'Return', value: 'return' },
    { label: 'Adjustment', value: 'adjustment' },
    { label: 'Transfer', value: 'transfer' },
    { label: 'Expiry', value: 'expiry' },
    { label: 'Damage', value: 'damage' },
  ];

  const referenceTypeOptions = [
    { label: 'All References', value: '' },
    { label: 'Purchase Order', value: 'PurchaseOrder' },
    { label: 'Medical Bill', value: 'MedicalBill' },
    { label: 'Sales Bill', value: 'SalesBill' },
    { label: 'Return Order', value: 'ReturnOrder' },
    { label: 'Stock Adjustment', value: 'StockAdjustment' },
    { label: 'Stock Transfer', value: 'StockTransfer' },
    { label: 'Expiry Removal', value: 'ExpiryRemoval' },
    { label: 'Damage Report', value: 'DamageReport' },
  ];

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (filterType) params.transactionType = filterType;
      if (filterReferenceType) params.referenceType = filterReferenceType;
      if (filterDateFrom) params.dateFrom = filterDateFrom;
      if (filterDateTo) params.dateTo = filterDateTo;

      const res = await inventoryAPI.getStockTransactions(params);

      const data = res.data?.data || res.data?.transactions || [];

      setTransactions(Array.isArray(data) ? data : []);
      setPagination(prev => ({
        ...prev,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1
      }));
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to load stock transactions'
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, searchQuery, filterType, filterReferenceType, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Search handler
  const handleSearchChange = (searchValue) => {
    setSearchQuery(searchValue);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Sort handler
  const handleSortChange = ({ sortBy, sortOrder }) => {
    setSortConfig({ sortBy, sortOrder });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Filter handlers
  const handleTypeFilterChange = (value) => {
    setFilterType(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleReferenceTypeFilterChange = (value) => {
    setFilterReferenceType(value);
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

  const handleRefresh = () => {
    loadTransactions();
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'purchase':
        return 'green';
      case 'sale':
        return 'blue';
      case 'return':
        return 'purple';
      case 'adjustment':
        return 'amber';
      case 'transfer':
        return 'gray';
      case 'expiry':
      case 'damage':
        return 'red';
      default:
        return 'gray';
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

  const formatDateForDisplay = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const tableRows = useMemo(
    () =>
      transactions.map((trx) => ({
        ...trx,
        id: trx._id,
        transactionId: trx.transactionId || '-',
        itemName: trx.itemName || '-',
        itemCode: trx.itemCode || '-',
        batchNumber: trx.batchNumber || '-',
        quantity: trx.quantity || 0,
        previousStock: trx.previousStock || 0,
        newStock: trx.newStock || 0,
        totalAmount: Number(trx.totalAmount || 0),
        dateText: formatDate(trx.date || trx.createdAt),
        performedBy: trx.performedBy || '-',
        referenceType: trx.referenceType || '-',
        raw: trx,
      })),
    [transactions]
  );

  const columns = [
    {
      key: 'transactionId',
      label: 'Transaction ID',
      sortable: true,
      sortKey: 'transactionId',
      width: 160,
    },
    {
      key: 'itemName',
      label: 'Item Name',
      sortable: true,
      sortKey: 'itemName',
    },
    {
      key: 'itemCode',
      label: 'Item Code',
      sortable: true,
      sortKey: 'itemCode',
      width: 130,
    },
    {
      key: 'transactionType',
      label: 'Type',
      sortable: true,
      sortKey: 'transactionType',
      width: 130,
      render: (val) => (
        <Badge color={getTypeColor(val)}>
          {val ? val.charAt(0).toUpperCase() + val.slice(1) : '-'}
        </Badge>
      ),
    },
    {
      key: 'batchNumber',
      label: 'Batch',
      sortable: true,
      sortKey: 'batchNumber',
      width: 130,
    },
    {
      key: 'quantity',
      label: 'Qty',
      sortable: true,
      sortKey: 'quantity',
      width: 90,
      render: (val, row) => (
        <span style={{ 
          color: row.transactionType === 'purchase' ? '#10b981' : 
                 row.transactionType === 'sale' ? '#ef4444' : 
                 'inherit',
          fontWeight: row.transactionType === 'purchase' || row.transactionType === 'sale' ? 600 : 400
        }}>
          {row.transactionType === 'purchase' ? '+' : 
           row.transactionType === 'sale' ? '-' : ''}
          {Math.abs(val)}
        </span>
      ),
    },
    {
      key: 'previousStock',
      label: 'Previous',
      sortable: true,
      sortKey: 'previousStock',
      width: 110,
    },
    {
      key: 'newStock',
      label: 'New Stock',
      sortable: true,
      sortKey: 'newStock',
      width: 110,
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      sortable: true,
      sortKey: 'totalAmount',
      width: 120,
      render: (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'dateText',
      label: 'Date',
      sortable: true,
      sortKey: 'createdAt',
      width: 170,
    },
    {
      key: 'referenceType',
      label: 'Reference Type',
      sortable: true,
      sortKey: 'referenceType',
      width: 150,
      render: (val) => val !== '-' ? (
        <Badge color="gray">
          {val}
        </Badge>
      ) : val,
    },
  ];

  const openView = (row) => {
    setSelectedTransaction(row.raw || row);
    setViewOpen(true);
  };

  const rowActions = ({ row }) => (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => openView(row)}
    >
      <Eye size={15} />
    </Button>
  );

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={pageHeader}>
        <div>
          <h1 style={{ margin: 0 }}>Stock Transactions</h1>
          <p style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            View purchase, sale, return, adjustment and stock movement history
          </p>
        </div>

        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {/* Filters Bar */}
      <div style={{ 
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
          <FormField label="Transaction Type">
            <select
              value={filterType}
              onChange={(e) => handleTypeFilterChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 13,
              }}
            >
              {transactionTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div>
          <FormField label="Reference Type">
            <select
              value={filterReferenceType}
              onChange={(e) => handleReferenceTypeFilterChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 13,
              }}
            >
              {referenceTypeOptions.map(opt => (
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

        {(filterType || filterReferenceType || filterDateFrom || filterDateTo) && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setFilterType('');
                setFilterReferenceType('');
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
        title="All Stock Transactions"
        subtitle="Search by transaction ID, item name, item code, batch or type"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No stock transactions found."
        // Pagination props
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Search props
        onSearchChange={handleSearchChange}
        // Sort props
        onSortChange={handleSortChange}
        actions={rowActions}
      />

      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Stock Transaction Details"
        width={850}
        footer={false}
      >
        {selectedTransaction && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={infoGrid}>
              <Info
                label="Transaction ID"
                value={selectedTransaction.transactionId}
              />
              <Info
                label="Transaction Type"
                value={
                  <Badge color={getTypeColor(selectedTransaction.transactionType)}>
                    {selectedTransaction.transactionType?.charAt(0).toUpperCase() + 
                     selectedTransaction.transactionType?.slice(1) || '-'}
                  </Badge>
                }
              />
              <Info
                label="Reference Type"
                value={
                  selectedTransaction.referenceType ? (
                    <Badge color="gray">
                      {selectedTransaction.referenceType}
                    </Badge>
                  ) : '-'
                }
              />
              <Info
                label="Reference ID"
                value={selectedTransaction.referenceId || '-'}
              />
              <Info
                label="Item Name"
                value={selectedTransaction.itemName}
              />
              <Info
                label="Item Code"
                value={selectedTransaction.itemCode}
              />
              <Info
                label="Batch Number"
                value={selectedTransaction.batchNumber || '-'}
              />
              <Info
                label="Quantity"
                value={
                  <span style={{ 
                    color: selectedTransaction.transactionType === 'purchase' ? '#10b981' : 
                           selectedTransaction.transactionType === 'sale' ? '#ef4444' : 
                           'inherit',
                    fontWeight: 600
                  }}>
                    {selectedTransaction.transactionType === 'purchase' ? '+' : 
                     selectedTransaction.transactionType === 'sale' ? '-' : ''}
                    {Math.abs(selectedTransaction.quantity || 0)}
                  </span>
                }
              />
              <Info
                label="Previous Stock"
                value={selectedTransaction.previousStock}
              />
              <Info
                label="New Stock"
                value={selectedTransaction.newStock}
              />
              <Info
                label="Unit Price"
                value={`₹${Number(
                  selectedTransaction.unitPrice || 0
                ).toLocaleString('en-IN')}`}
              />
              <Info
                label="Total Amount"
                value={`₹${Number(
                  selectedTransaction.totalAmount || 0
                ).toLocaleString('en-IN')}`}
              />
              <Info
                label="Performed By"
                value={selectedTransaction.performedBy || '-'}
              />
              <Info
                label="Date & Time"
                value={formatDateForDisplay(
                  selectedTransaction.date ||
                    selectedTransaction.createdAt
                )}
              />
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Notes
              </div>
              <div style={notesBox}>
                {selectedTransaction.notes || '-'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        {label}
      </div>
      <div style={{ fontWeight: 600 }}>
        {value || '-'}
      </div>
    </div>
  );
}

const pageHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const infoGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 16,
};

const notesBox = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: 12,
  marginTop: 8,
  minHeight: 60,
};