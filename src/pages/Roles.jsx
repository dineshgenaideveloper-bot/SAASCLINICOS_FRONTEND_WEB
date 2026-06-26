import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { FormField, Toggle } from '../components/FormField';

import { roleAPI } from '../services/api';

import {
  FaUserShield,
  FaUserTie,
  FaUserCog,
  FaUserNurse,
  FaUserMd,
  FaUsers,
} from 'react-icons/fa';

const getIconForRole = (name = '') => {
  const key = name.toLowerCase();

  if (key.includes('admin')) return <FaUserShield />;
  if (key.includes('doctor')) return <FaUserMd />;
  if (key.includes('nurse')) return <FaUserNurse />;
  if (key.includes('manager')) return <FaUserTie />;
  if (key.includes('staff')) return <FaUsers />;
  if (key.includes('user')) return <FaUserCog />;

  return <FaUsers />;
};

export default function Roles() {
  const fileInputRef = useRef(null);

  const [rows, setRows] = useState([]);
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

  const [form, setForm] = useState({
    roleName: '',
    roleCode: '',
    description: '',
    isActive: true,
  });

  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
  ];

  const fetchRoles = useCallback(async () => {
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

      const res = await roleAPI.getRoles(params);
      
      setRows(res.data?.data || []);
      setPagination({
        page: res.data?.pagination?.page || 1,
        limit: res.data?.pagination?.limit || 10,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, searchQuery, filterStatus]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

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
      roleName: '',
      roleCode: '',
      description: '',
      isActive: true,
    });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpen(true);
  };

  const handleEdit = (row) => {
    setEditingId(row._id);

    setForm({
      roleName: row.roleName || '',
      roleCode: row.roleCode || '',
      description: row.description || '',
      isActive: row.isActive ?? true,
    });

    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!form.roleName || !form.roleCode) {
        toast.error('Please fill required fields');
        return;
      }

      const payload = {
        ...form,
        roleCode: form.roleCode.toUpperCase(),
      };

      if (editingId) {
        await roleAPI.updateRole(editingId, payload);
        toast.success('Role updated');
      } else {
        await roleAPI.createRole(payload);
        toast.success('Role created');
      }

      setOpen(false);
      resetForm();
      // Reset to first page after create/update
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchRoles();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save role');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete role?')) return;

    try {
      await roleAPI.deleteRole(id);
      toast.success('Role deleted');
      // Reset to first page after delete
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchRoles();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete role');
    }
  };

  const toggleStatus = async (row) => {
    try {
      const newStatus = !row.isActive;

      await roleAPI.updateRoleStatus(row._id, {
        isActive: newStatus,
      });

      setRows((prev) =>
        prev.map((item) =>
          item._id === row._id
            ? { ...item, isActive: newStatus }
            : item
        )
      );

      toast.success(newStatus ? 'Role activated' : 'Role deactivated');
      
      // Refresh to update counts
      fetchRoles();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
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

      const res = await roleAPI.importRoles(formData);
      const result = res.data?.data;

      toast.success(
        `Imported ${result?.createdCount || 0}, skipped ${
          result?.skippedCount || 0
        }`
      );

      // Reset to first page after import
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchRoles();
    } catch (error) {
      console.error(error);
      toast.error('Failed to import roles');
    } finally {
      e.target.value = '';
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

  const tableRows = rows.map((role) => ({
    id: role._id,
    _id: role._id,
    roleName: role.roleName || '—',
    roleCode: role.roleCode || '—',
    description: role.description || '—',
    status: role.isActive ? 'Active' : 'Inactive',
    createdAt: formatDate(role.createdAt),
    raw: role,
  }));

  const columns = [
    {
      key: 'roleName',
      label: 'Role',
      sortable: true,
      sortKey: 'roleName',
      render: (value, row) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: 8,
              fontSize: 18,
              color: 'var(--primary)',
            }}
          >
            {getIconForRole(row.roleName)}
          </div>

          <div>
            <div style={{ fontWeight: 600 }}>{value}</div>

            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              {row.roleCode}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      sortKey: 'description',
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
      render: (value, row) => (
        <button
          type="button"
          onClick={() => toggleStatus(row.raw)}
          title="Click to change status"
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button size="sm" variant="secondary" onClick={handleImportClick}>
            📥 Import Excel
          </Button>
        </div>
      </div>

      <DataTable
        title="Roles"
        subtitle="Manage user roles and permissions"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No roles found."
        addLabel="Add Role"
        onAdd={handleOpenCreate}
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
        title={editingId ? 'Edit Role' : 'Add Role'}
        confirmLabel={editingId ? 'Update Role' : 'Save Role'}
        onConfirm={handleSubmit}
      >
        <div
          style={{
            display: 'grid',
            gap: 14,
          }}
        >
          <FormField label="Role Name" required>
            <input
              placeholder="Admin"
              value={form.roleName}
              onChange={(e) =>
                setForm({
                  ...form,
                  roleName: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Role Code" required>
            <input
              placeholder="ADMIN"
              value={form.roleCode}
              onChange={(e) =>
                setForm({
                  ...form,
                  roleCode: e.target.value.toUpperCase(),
                })
              }
            />
          </FormField>

          <FormField label="Description">
            <textarea
              rows={3}
              placeholder="Role description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />
          </FormField>

          <Toggle
            label="Active Role"
            checked={form.isActive}
            onChange={(e) =>
              setForm({
                ...form,
                isActive: e.target.checked,
              })
            }
          />
        </div>
      </Modal>
    </>
  );
}