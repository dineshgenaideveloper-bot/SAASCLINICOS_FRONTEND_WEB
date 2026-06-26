import React, { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { FormField, SelectField } from '../components/FormField';

import { userTypeAPI } from '../services/api';

export default function Users() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

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

  const [form, setForm] = useState({
    userTypeName: '',
    icon: '',
    price: '',
    isActive: true,
  });

  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
  ];

  const fetchUserTypes = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (filterStatus) params.isActive = filterStatus;

      const res = await userTypeAPI.getUserTypes(params);
      
      setRows(res.data?.data || []);
      setPagination({
        page: res.data?.pagination?.page || 1,
        limit: res.data?.pagination?.limit || 10,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch user types');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, searchQuery, filterStatus]);

  useEffect(() => {
    fetchUserTypes();
  }, [fetchUserTypes]);

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

  const resetForm = () => {
    setForm({
      userTypeName: '',
      icon: '',
      price: '',
      isActive: true,
    });
    setSelectedItem(null);
  };

  const openAdd = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (item) => {
    setSelectedItem(item);

    setForm({
      userTypeName: item.userTypeName || '',
      icon: item.icon || '',
      price: item.price || '',
      isActive: item.isActive ?? true,
    });

    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!form.userTypeName) {
        toast.error('User type name is required');
        return;
      }

      const payload = {
        userTypeName: form.userTypeName,
        icon: form.icon,
        price: Number(form.price || 0),
        isActive: form.isActive,
      };

      if (selectedItem?._id) {
        await userTypeAPI.updateUserType(selectedItem._id, payload);
        toast.success('User type updated');
      } else {
        await userTypeAPI.createUserType(payload);
        toast.success('User type created');
      }

      setOpen(false);
      resetForm();
      // Reset to first page after create/update
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchUserTypes();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save user type');
    }
  };

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm(`Delete "${item.userTypeName}" ?`);
    if (!confirmDelete) return;

    try {
      await userTypeAPI.deleteUserType(item._id);
      toast.success('Deleted successfully');
      // Reset to first page after delete
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchUserTypes();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete user type');
    }
  };

  const toggleStatus = async (item) => {
    try {
      const newStatus = !item.isActive;

      await userTypeAPI.updateUserTypeStatus(item._id, {
        isActive: newStatus,
      });

      setRows((prev) =>
        prev.map((x) =>
          x._id === item._id
            ? { ...x, isActive: newStatus }
            : x
        )
      );

      toast.success(newStatus ? 'Activated' : 'Deactivated');
      
      // Refresh to update counts
      fetchUserTypes();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
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

  const tableRows = rows.map((item) => ({
    id: item._id,
    _id: item._id,
    userTypeName: item.userTypeName || '—',
    icon: item.icon || '—',
    price: item.price || 0,
    status: item.isActive ? 'Active' : 'Inactive',
    createdAt: formatDate(item.createdAt),
    raw: item,
  }));

  const columns = [
    {
      key: 'userTypeName',
      label: 'User Type',
      sortable: true,
      sortKey: 'userTypeName',
      render: (value, row) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Avatar name={value} size={30} />

          <div>
            <div style={{ fontWeight: 600 }}>{value}</div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              {row.icon || '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      sortKey: 'price',
      width: 120,
      render: (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      sortable: true,
      sortKey: 'createdAt',
      width: 170,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'isActive',
      width: 120,
      render: (_, row) => (
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
          <Badge color={row.status === 'Active' ? 'green' : 'red'}>
            {row.status}
          </Badge>
        </button>
      ),
    },
  ];

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

        {filterStatus && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setFilterStatus('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <DataTable
        title="User Types"
        subtitle="Manage user type roles and pricing"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No user types found."
        addLabel="Add User Type"
        onAdd={openAdd}
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
              onClick={() => openEdit(row.raw)}
            >
              Edit
            </Button>

            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(row.raw)}
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
        title={selectedItem ? 'Update User Type' : 'Add User Type'}
        confirmLabel={selectedItem ? 'Update User Type' : 'Save User Type'}
        onConfirm={handleSubmit}
      >
        <div
          style={{
            display: 'grid',
            gap: 14,
          }}
        >
          <FormField label="User Type Name" required>
            <input
              value={form.userTypeName}
              onChange={(e) =>
                setForm({
                  ...form,
                  userTypeName: e.target.value,
                })
              }
              placeholder="Enter user type name"
            />
          </FormField>

          <FormField label="Icon">
            <input
              value={form.icon}
              onChange={(e) =>
                setForm({
                  ...form,
                  icon: e.target.value,
                })
              }
              placeholder="Enter icon (emoji or text)"
            />
          </FormField>

          <FormField label="Price">
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: e.target.value,
                })
              }
              placeholder="Enter price"
            />
          </FormField>

          <SelectField
            label="Status"
            value={form.isActive ? 'active' : 'inactive'}
            onChange={(e) =>
              setForm({
                ...form,
                isActive: e.target.value === 'active',
              })
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SelectField>
        </div>
      </Modal>
    </>
  );
}