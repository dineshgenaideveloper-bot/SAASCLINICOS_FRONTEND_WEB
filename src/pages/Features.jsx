import React, { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { FormField, SelectField } from '../components/FormField';

import { featureAPI } from '../services/api';

export default function Features() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);

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
  const [filterModule, setFilterModule] = useState('');

  const [form, setForm] = useState({
    featureCode: '',
    name: '',
    module: '',
    path: '',
    icon: '',
    textLink: '',
    price: '',
    description: '',
    isActive: true,
  });

  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
  ];

  // Get unique modules for filter dropdown
  const moduleOptions = useMemo(() => {
    const modules = new Set();
    features.forEach(feature => {
      if (feature.module && feature.module.trim()) {
        modules.add(feature.module);
      }
    });
    return [
      { label: 'All Modules', value: '' },
      ...Array.from(modules).map(module => ({ label: module, value: module }))
    ];
  }, [features]);

  const fetchFeatures = useCallback(async () => {
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
      if (filterModule) params.module = filterModule;

      const res = await featureAPI.getFeatures(params);
      
      setFeatures(res.data?.data || []);
      setPagination({
        page: res.data?.pagination?.page || 1,
        limit: res.data?.pagination?.limit || 10,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1
      });
    } catch (error) {
      console.error('Fetch features error:', error);
      toast.error('Failed to fetch features');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, searchQuery, filterStatus, filterModule]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

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

  const handleModuleFilterChange = (value) => {
    setFilterModule(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetForm = () => {
    setForm({
      featureCode: '',
      name: '',
      module: '',
      path: '',
      icon: '',
      textLink: '',
      price: '',
      description: '',
      isActive: true,
    });
    setSelectedFeature(null);
  };

  const openAdd = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (feature) => {
    setSelectedFeature(feature);

    setForm({
      featureCode: feature.featureCode || '',
      name: feature.name || '',
      module: feature.module || '',
      path: feature.path || '',
      icon: feature.icon || '',
      textLink: feature.textLink || '',
      price: feature.price ?? '',
      description: feature.description || '',
      isActive: feature.isActive ?? true,
    });

    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!form.featureCode || !form.name || !form.module || !form.path) {
        toast.error('Please fill required fields (Code, Name, Module, Path)');
        return;
      }

      const payload = {
        featureCode: form.featureCode.toUpperCase(),
        name: form.name,
        module: form.module,
        path: form.path,
        icon: form.icon,
        textLink: form.textLink,
        price: Number(form.price || 0),
        description: form.description,
        isActive: form.isActive,
      };

      if (selectedFeature?._id) {
        await featureAPI.updateFeature(selectedFeature._id, payload);
        toast.success('Feature updated successfully');
      } else {
        await featureAPI.createFeature(payload);
        toast.success('Feature created successfully');
      }

      setOpen(false);
      resetForm();
      // Reset to first page after create/update
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchFeatures();
    } catch (error) {
      console.error('Save feature error:', error);
      toast.error(error.response?.data?.message || 'Failed to save feature');
    }
  };

  const handleDelete = async (feature) => {
    const confirmDelete = window.confirm(
      `Delete feature "${feature.name}"?`
    );

    if (!confirmDelete) return;

    try {
      await featureAPI.deleteFeature(feature._id);
      toast.success('Feature deleted successfully');
      // Reset to first page after delete
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchFeatures();
    } catch (error) {
      console.error('Delete feature error:', error);
      toast.error('Failed to delete feature');
    }
  };

  const toggleFeatureStatus = async (feature) => {
    try {
      const newStatus = !feature.isActive;

      await featureAPI.updateFeatureStatus(feature._id, {
        isActive: newStatus,
      });

      setFeatures((prev) =>
        prev.map((item) =>
          item._id === feature._id
            ? { ...item, isActive: newStatus }
            : item
        )
      );

      toast.success(
        newStatus ? 'Feature activated' : 'Feature deactivated'
      );
      
      // Refresh to update counts
      fetchFeatures();
    } catch (error) {
      console.error('Update feature status error:', error);
      toast.error('Failed to update feature status');
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

  const rows = features.map((feature) => ({
    id: feature._id,
    _id: feature._id,
    featureCode: feature.featureCode || '—',
    name: feature.name || '—',
    module: feature.module || '—',
    path: feature.path || '—',
    icon: feature.icon || '—',
    textLink: feature.textLink || '—',
    price: `₹${Number(feature.price || 0).toLocaleString('en-IN')}`,
    description: feature.description || '—',
    status: feature.isActive ? 'Active' : 'Inactive',
    createdAt: formatDate(feature.createdAt),
    raw: feature,
  }));

  const columns = [
    {
      key: 'featureCode',
      label: 'Code',
      sortable: true,
      sortKey: 'featureCode',
      width: 130,
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      sortKey: 'name',
    },
    {
      key: 'module',
      label: 'Module',
      sortable: true,
      sortKey: 'module',
      width: 140,
    },
    {
      key: 'path',
      label: 'Path',
      sortable: true,
      sortKey: 'path',
    },
    {
      key: 'icon',
      label: 'Icon',
      sortable: true,
      sortKey: 'icon',
      width: 100,
    },
    {
      key: 'textLink',
      label: 'Text Link',
      sortable: true,
      sortKey: 'textLink',
      width: 150,
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      sortKey: 'price',
      width: 100,
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
      width: 100,
      render: (value, row) => (
        <button
          type="button"
          onClick={() => toggleFeatureStatus(row.raw)}
          title="Click to change status"
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <Badge color={value === 'Active' ? 'green' : 'red'}>
            {value}
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

        <div>
          <FormField label="Module">
            <select
              value={filterModule}
              onChange={(e) => handleModuleFilterChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 13,
              }}
            >
              {moduleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        {(filterStatus || filterModule) && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setFilterStatus('');
                setFilterModule('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <DataTable
        title="Features"
        subtitle="Manage application feature access"
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No features found."
        addLabel="Add Feature"
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
        title={selectedFeature ? 'Update Feature' : 'Add Feature'}
        confirmLabel={selectedFeature ? 'Update Feature' : 'Save Feature'}
        onConfirm={handleSubmit}
        width={620}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <FormField label="Feature Code" required>
            <input
              value={form.featureCode}
              onChange={(e) =>
                setForm({
                  ...form,
                  featureCode: e.target.value.toUpperCase(),
                })
              }
              placeholder="Example: APPOINTMENTS"
            />
          </FormField>

          <FormField label="Feature Name" required>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Enter feature name"
            />
          </FormField>

          <FormField label="Module" required>
            <input
              value={form.module}
              onChange={(e) =>
                setForm({ ...form, module: e.target.value })
              }
              placeholder="Example: Clinic"
            />
          </FormField>

          <FormField label="Path" required>
            <input
              value={form.path}
              onChange={(e) =>
                setForm({ ...form, path: e.target.value })
              }
              placeholder="Example: /appointments"
            />
          </FormField>

          <FormField label="Icon">
            <input
              value={form.icon}
              onChange={(e) =>
                setForm({ ...form, icon: e.target.value })
              }
              placeholder="Example: calendar"
            />
          </FormField>

          <FormField label="Text Link">
            <input
              value={form.textLink}
              onChange={(e) =>
                setForm({ ...form, textLink: e.target.value })
              }
              placeholder="Example: Manage Appointments"
            />
          </FormField>

          <FormField label="Price">
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: e.target.value })
              }
              placeholder="Enter price"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Enter description"
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