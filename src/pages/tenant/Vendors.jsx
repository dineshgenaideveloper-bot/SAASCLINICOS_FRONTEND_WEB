import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { FormField } from '../../components/FormField';

import { vendorAPI, inventoryAPI } from '../../services/api';

const emptyForm = {
  name: '',
  contactPerson: '',
  phone: '',
  alternatePhone: '',
  email: '',
  gstin: '',
  drugLicenseNumber: '',
  panNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  paymentTerms: 'Immediate',
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  notes: '',
  suppliedItems: [],
  status: 'active',
  isActive: true,
};

function ItemSearchMultiSelect({
  label = 'Vendor Supplied Items',
  value = [],
  items = [],
  onChange,
  onSearch,
  loading = false,
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimeoutRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== undefined) {
      onSearch?.(debouncedSearch);
    }
  }, [debouncedSearch, onSearch]);

  const selectedIds = Array.isArray(value) ? value.map(String) : [];

  const itemOptions = useMemo(() => {
    return (items || []).map((item) => ({
      id: String(item._id),
      name: item.name || 'Unnamed Item',
      itemId: item.itemId || '',
      categoryName: item.categoryName || item.category?.name || '',
      subCategoryName: item.subCategoryName || item.subCategory?.name || '',
      unit: item.unit || '',
      stock: item.currentStock || 0,
    }));
  }, [items]);

  const selectedItems = useMemo(() => {
    return itemOptions.filter((item) => selectedIds.includes(item.id));
  }, [itemOptions, selectedIds]);

  const toggleItem = (id) => {
    const itemId = String(id);

    if (selectedIds.includes(itemId)) {
      onChange(selectedIds.filter((x) => x !== itemId));
    } else {
      onChange([...selectedIds, itemId]);
    }
  };

  const removeItem = (id) => {
    const itemId = String(id);
    onChange(selectedIds.filter((x) => x !== itemId));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <label style={{ fontSize: 13, fontWeight: 600 }}>
          {label}
        </label>

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#ef4444',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Clear all
          </button>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search item by name, item ID, category (auto-search)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            height: 40,
            border: '1px solid #d1d5db',
            borderRadius: 8,
            padding: '0 12px',
            outline: 'none',
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 12,
            color: '#6b7280'
          }}>
            Searching...
          </div>
        )}
        {search && !loading && (
          <div style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11,
            color: '#9ca3af'
          }}>
            {items.length} results
          </div>
        )}
      </div>

      {selectedItems.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            padding: 8,
            border: '1px solid #bfdbfe',
            background: '#eff6ff',
            borderRadius: 10,
          }}
        >
          {selectedItems.map((item) => (
            <span
              key={item.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                padding: '5px 8px',
                borderRadius: 999,
                background: '#dbeafe',
                color: '#1d4ed8',
                fontWeight: 600,
              }}
            >
              {item.name}
              {item.itemId ? ` (${item.itemId})` : ''}

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#1d4ed8',
                  cursor: 'pointer',
                  fontWeight: 700,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          background: '#fff',
          maxHeight: 260,
          overflowY: 'auto',
          padding: 8,
          display: 'grid',
          gap: 6,
        }}
      >
        {loading ? (
          <div
            style={{
              padding: 12,
              textAlign: 'center',
              color: '#6b7280',
              fontSize: 13,
            }}
          >
            Searching inventory...
          </div>
        ) : itemOptions.length === 0 ? (
          <div
            style={{
              padding: 12,
              textAlign: 'center',
              color: '#6b7280',
              fontSize: 13,
            }}
          >
            {search ? 'No items found. Try a different search term.' : 'Start typing to search items'}
          </div>
        ) : (
          itemOptions.map((item) => {
            const checked = selectedIds.includes(item.id);

            return (
              <label
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: 10,
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: checked
                    ? '1px solid #93c5fd'
                    : '1px solid #f3f4f6',
                  background: checked ? '#eff6ff' : '#fff',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleItem(item.id)}
                  style={{ marginTop: 3 }}
                />

                <div style={{ display: 'grid', gap: 3 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#111827',
                    }}
                  >
                    {item.name}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      fontSize: 11,
                      color: '#6b7280',
                    }}
                  >
                    {item.itemId && <span>ID: {item.itemId}</span>}
                    {item.categoryName && <span>Category: {item.categoryName}</span>}
                    {item.subCategoryName && <span>Sub: {item.subCategoryName}</span>}
                    {item.unit && <span>Unit: {item.unit}</span>}
                    <span>Stock: {item.stock}</span>
                  </div>
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Vendors() {
  const fileInputRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

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
  const [filterCity, setFilterCity] = useState('');

  const fetchVendors = useCallback(async () => {
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
      if (filterCity) params.city = filterCity;
      
      const res = await vendorAPI.getVendors(params);
      
      setRows(res.data?.data || []);
      setPagination(prev => ({
        ...prev,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1
      }));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, searchQuery, filterStatus, filterCity]);

  const fetchItems = useCallback(async (search = '') => {
    try {
      setItemsLoading(true);
      const res = await inventoryAPI.getItems({
        page: 1,
        limit: 20,
        search: search.trim(),
      });

      setItems(res.data?.data || []);
      
      if (search.trim() && res.data?.data?.length === 0) {
        toast('No items found matching your search', { icon: '🔍' });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch items');
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems('');
    fetchVendors();
  }, [fetchVendors, fetchItems]);

  const normalizeSuppliedItems = (suppliedItems = []) => {
    if (!Array.isArray(suppliedItems)) return [];

    return suppliedItems
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'object') {
          return String(item._id || item.id || '');
        }
        return String(item);
      })
      .filter(Boolean);
  };

  const resetForm = () => {
    setForm({ ...emptyForm, suppliedItems: [] });
    setEditingId(null);
    fetchItems('');
  };

  const getSuppliedItemNames = (vendor) => {
    const selected = Array.isArray(vendor.suppliedItems) ? vendor.suppliedItems : [];

    if (!selected.length) return '—';

    const names = selected
      .map((item) => {
        if (item && typeof item === 'object') {
          return item.name || item.itemId || '';
        }
        const found = items.find((x) => String(x._id) === String(item));
        return found?.name || '';
      })
      .filter(Boolean);

    if (!names.length) return '—';

    const firstThree = names.slice(0, 3).join(', ');
    const extra = names.length > 3 ? ` +${names.length - 3} more` : '';

    return `${firstThree}${extra}`;
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      toast.error('Vendor name and phone are required');
      return;
    }

    try {
      const payload = {
        ...form,
        suppliedItems: normalizeSuppliedItems(form.suppliedItems),
        gstin: String(form.gstin || '').toUpperCase(),
        panNumber: String(form.panNumber || '').toUpperCase(),
        ifscCode: String(form.ifscCode || '').toUpperCase(),
        status: form.status,
        isActive: form.status === 'active',
      };

      if (editingId) {
        await vendorAPI.updateVendor(editingId, payload);
        toast.success('Vendor updated');
      } else {
        await vendorAPI.createVendor(payload);
        toast.success('Vendor created');
      }

      setOpen(false);
      resetForm();
      // Reset to first page after create/update
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchVendors();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save vendor');
    }
  };

  const handleEdit = (vendor) => {
    setEditingId(vendor._id);

    setForm({
      ...emptyForm,
      ...vendor,
      suppliedItems: normalizeSuppliedItems(vendor.suppliedItems),
      status: vendor.status || (vendor.isActive ? 'active' : 'inactive'),
      isActive: vendor.isActive ?? true,
    });

    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete vendor?')) return;

    try {
      await vendorAPI.deleteVendor(id);
      toast.success('Vendor deleted');
      // Reset to first page after delete
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchVendors();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete vendor');
    }
  };

  const toggleStatus = async (vendor) => {
    try {
      const isActive = !vendor.isActive;

      await vendorAPI.updateVendorStatus(vendor._id, {
        isActive,
        status: isActive ? 'active' : 'inactive',
      });

      setRows((prev) =>
        prev.map((item) =>
          item._id === vendor._id
            ? {
                ...item,
                isActive,
                status: isActive ? 'active' : 'inactive',
              }
            : item
        )
      );

      toast.success(isActive ? 'Vendor activated' : 'Vendor deactivated');
      fetchVendors(); // Refresh to update pagination counts
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update vendor status');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await vendorAPI.importVendors(formData);
      const result = res.data?.data;

      toast.success(
        `Imported ${result?.createdCount || 0}, skipped ${result?.skippedCount || 0}`
      );

      // Reset to first page after import
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchVendors();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to import vendors');
    } finally {
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await vendorAPI.downloadVendorTemplate();

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'vendor-import-template.xlsx');

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success('Vendor template downloaded');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to download vendor template');
    }
  };

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
  const handleStatusFilterChange = (value) => {
    setFilterStatus(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCityFilterChange = (value) => {
    setFilterCity(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get unique cities for filter dropdown
  const cityOptions = useMemo(() => {
    const cities = new Set();
    rows.forEach(vendor => {
      if (vendor.city && vendor.city.trim()) {
        cities.add(vendor.city);
      }
    });
    return [
      { label: 'All Cities', value: '' },
      ...Array.from(cities).map(city => ({ label: city, value: city }))
    ];
  }, [rows]);

  const statusFilterOptions = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  const tableRows = rows.map((vendor) => ({
    id: vendor._id,
    vendorId: vendor.vendorId || '—',
    name: vendor.name || '—',
    phone: vendor.phone || '—',
    contactPerson: vendor.contactPerson || '—',
    city: vendor.city || '—',
    suppliedItems: getSuppliedItemNames(vendor),
    suppliedItemsCount: Array.isArray(vendor.suppliedItems)
      ? vendor.suppliedItems.length
      : 0,
    status: vendor.isActive ? 'Active' : 'Inactive',
    raw: vendor,
  }));

  const columns = [
    {
      key: 'name',
      label: 'Vendor',
      sortable: true,
      sortKey: 'name',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {row.vendorId}
          </div>
        </div>
      ),
    },
    { 
      key: 'contactPerson', 
      label: 'Contact Person',
      sortable: true,
      sortKey: 'contactPerson',
    },
    { 
      key: 'phone', 
      label: 'Phone',
      sortable: true,
      sortKey: 'phone',
    },
    { 
      key: 'city', 
      label: 'City',
      sortable: true,
      sortKey: 'city',
    },
    {
      key: 'suppliedItems',
      label: 'Supplied Items',
      sortable: false,
      render: (value, row) => (
        <div>
          <div>{value}</div>
          {row.suppliedItemsCount > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {row.suppliedItemsCount} item
              {row.suppliedItemsCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'isActive',
      render: (value, row) => (
        <button
          type="button"
          onClick={() => toggleStatus(row.raw)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <Badge color={value === 'Active' ? 'green' : 'red'}>
            {value === 'Active' ? '✓ ' : '✕ '}
            {value}
          </Badge>
        </button>
      ),
    },
  ];

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleImportFile}
        style={{ display: 'none' }}
      />

      {/* Filters Bar */}
      <div style={{ 
        marginBottom: 16, 
        display: 'flex', 
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          <div style={{ minWidth: 150 }}>
            <FormField label="Filter by Status">
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
                {statusFilterOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={{ minWidth: 150 }}>
            <FormField label="Filter by City">
              <select
                value={filterCity}
                onChange={(e) => handleCityFilterChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 13,
                }}
              >
                {cityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={handleDownloadTemplate}>
            📥 Download Template
          </Button>

          <Button size="sm" variant="secondary" onClick={handleImportClick}>
            📤 Import Excel
          </Button>
        </div>
      </div>

      <DataTable
        title="Vendors"
        subtitle="Manage pharmacy suppliers and supplied inventory items"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No vendors found."
        addLabel="Add Vendor"
        onAdd={() => {
          resetForm();
          setOpen(true);
        }}
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
        actions={({ row }) => (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(row.raw)}
            >
              Edit
            </Button>

            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(row.raw._id)}
            >
              Delete
            </Button>
          </>
        )}
      />

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={editingId ? 'Edit Vendor' : 'Add Vendor'}
        confirmLabel={editingId ? 'Update Vendor' : 'Save Vendor'}
        onConfirm={handleSubmit}
        width="80%"
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Vendor Name" required>
              <input
                placeholder="ABC Medical Suppliers"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>

            <FormField label="Contact Person">
              <input
                placeholder="Mr. Kumar"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Phone" required>
              <input
                placeholder="9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </FormField>

            <FormField label="Alternate Phone">
              <input
                placeholder="Alternate phone number"
                value={form.alternatePhone}
                onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Email">
            <input
              type="email"
              placeholder="vendor@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>

          <ItemSearchMultiSelect
            label="Vendor Supplied Items"
            value={form.suppliedItems}
            items={items}
            loading={itemsLoading}
            onSearch={fetchItems}
            onChange={(selectedIds) =>
              setForm({
                ...form,
                suppliedItems: selectedIds,
              })
            }
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="GSTIN">
              <input
                placeholder="GSTIN"
                value={form.gstin}
                onChange={(e) =>
                  setForm({ ...form, gstin: e.target.value.toUpperCase() })
                }
              />
            </FormField>

            <FormField label="Drug License Number">
              <input
                placeholder="Drug license number"
                value={form.drugLicenseNumber}
                onChange={(e) =>
                  setForm({ ...form, drugLicenseNumber: e.target.value })
                }
              />
            </FormField>
          </div>

          <FormField label="PAN Number">
            <input
              placeholder="PAN number"
              value={form.panNumber}
              onChange={(e) =>
                setForm({ ...form, panNumber: e.target.value.toUpperCase() })
              }
            />
          </FormField>

          <FormField label="Address">
            <textarea
              rows={3}
              placeholder="Vendor address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <FormField label="City">
              <input
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </FormField>

            <FormField label="State">
              <input
                placeholder="State"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </FormField>

            <FormField label="Pincode">
              <input
                placeholder="Pincode"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Payment Terms">
            <input
              placeholder="Immediate / 15 Days / 30 Days"
              value={form.paymentTerms}
              onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Bank Name">
              <input
                placeholder="Bank name"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              />
            </FormField>

            <FormField label="Account Holder Name">
              <input
                placeholder="Account holder name"
                value={form.accountHolderName}
                onChange={(e) =>
                  setForm({ ...form, accountHolderName: e.target.value })
                }
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Account Number">
              <input
                placeholder="Account number"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              />
            </FormField>

            <FormField label="IFSC Code">
              <input
                placeholder="IFSC code"
                value={form.ifscCode}
                onChange={(e) =>
                  setForm({ ...form, ifscCode: e.target.value.toUpperCase() })
                }
              />
            </FormField>
          </div>

          <FormField label="Notes">
            <textarea
              rows={3}
              placeholder="Vendor notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </FormField>

          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value,
                  isActive: e.target.value === 'active',
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
        </div>
      </Modal>
    </>
  );
}