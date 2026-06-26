import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { FormField, Toggle } from '../components/FormField';

import { departmentAPI } from '../services/api';

import {
  FaHospital,
  FaHeartbeat,
  FaBrain,
  FaBone,
  FaBaby,
  FaFemale,
  FaEye,
  FaAssistiveListeningSystems,
  FaAllergies,
  FaLungs,
  FaSyringe,
  FaPaw,
  FaStethoscope,
  FaLeaf,
  FaRibbon,
} from 'react-icons/fa';

const getIconForDepartment = (name = '') => {
  const key = name.toLowerCase();

  if (key.includes('homeopathy')) return <FaLeaf />;
  if (key.includes('veterinary')) return <FaPaw />;
  if (key.includes('cardio')) return <FaHeartbeat />;
  if (key.includes('neuro')) return <FaBrain />;
  if (key.includes('ortho')) return <FaBone />;
  if (key.includes('pediatric')) return <FaBaby />;
  if (key.includes('gynec') || key.includes('obg')) return <FaFemale />;
  if (key.includes('ophth') || key.includes('eye')) return <FaEye />;
  if (key.includes('ent')) return <FaAssistiveListeningSystems />;
  if (key.includes('dermat')) return <FaAllergies />;
  if (key.includes('pulmo') || key.includes('lung')) return <FaLungs />;
  if (key.includes('onco')) return <FaRibbon />;
  if (key.includes('endo')) return <FaSyringe />;
  if (key.includes('general')) return <FaStethoscope />;

  return <FaHospital />;
};

export default function Departments() {
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
    name: '',
    code: '',
    specializationName: '',
    description: '',
    isActive: true,
  });

  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
  ];

  const fetchDepartments = useCallback(async () => {
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

      const res = await departmentAPI.getDepartments(params);
      
      setRows(res.data?.data || []);
      setPagination({
        page: res.data?.pagination?.page || 1,
        limit: res.data?.pagination?.limit || 10,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, searchQuery, filterStatus]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

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
      name: '',
      code: '',
      specializationName: '',
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
      name: row.name || '',
      code: row.code || '',
      specializationName: row.specializationName || '',
      description: row.description || '',
      isActive: row.isActive ?? true,
    });

    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!form.name || !form.code || !form.specializationName) {
        toast.error('Please fill required fields');
        return;
      }

      const payload = {
        ...form,
        code: form.code.toUpperCase(),
      };

      if (editingId) {
        await departmentAPI.updateDepartment(editingId, payload);
        toast.success('Department updated');
      } else {
        await departmentAPI.createDepartment(payload);
        toast.success('Department created');
      }

      setOpen(false);
      resetForm();
      // Reset to first page after create/update
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchDepartments();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save department');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete department?')) return;

    try {
      await departmentAPI.deleteDepartment(id);
      toast.success('Department deleted');
      // Reset to first page after delete
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchDepartments();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete department');
    }
  };

  const toggleStatus = async (row) => {
    try {
      const newStatus = !row.isActive;

      await departmentAPI.updateDepartmentStatus(row._id, {
        isActive: newStatus,
      });

      setRows((prev) =>
        prev.map((item) =>
          item._id === row._id
            ? { ...item, isActive: newStatus }
            : item
        )
      );

      toast.success(
        newStatus ? 'Department activated' : 'Department deactivated'
      );
      
      // Refresh to update counts
      fetchDepartments();
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

      const res = await departmentAPI.importDepartments(formData);
      const result = res.data?.data;

      toast.success(
        `Imported ${result?.createdCount || 0}, skipped ${
          result?.skippedCount || 0
        }`
      );

      // Reset to first page after import
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchDepartments();
    } catch (error) {
      console.error(error);
      toast.error('Failed to import departments');
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

  const tableRows = rows.map((department) => ({
    id: department._id,
    _id: department._id,
    name: department.name || '—',
    code: department.code || '—',
    specializationName: department.specializationName || '—',
    description: department.description || '—',
    status: department.isActive ? 'Active' : 'Inactive',
    createdAt: formatDate(department.createdAt),
    raw: department,
  }));

  const columns = [
    {
      key: 'name',
      label: 'Department',
      sortable: true,
      sortKey: 'name',
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
            {getIconForDepartment(row.name)}
          </div>

          <div>
            <div style={{ fontWeight: 600 }}>{value}</div>

            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              {row.code}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'specializationName',
      label: 'Specialization',
      sortable: true,
      sortKey: 'specializationName',
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
        title="Departments"
        subtitle="Manage clinic departments and specializations"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No departments found."
        addLabel="Add Department"
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
        title={editingId ? 'Edit Department' : 'Add Department'}
        confirmLabel={editingId ? 'Update Department' : 'Save Department'}
        onConfirm={handleSubmit}
      >
        <div
          style={{
            display: 'grid',
            gap: 14,
          }}
        >
          <FormField label="Department Name" required>
            <input
              placeholder="Orthopedics"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Code" required>
            <input
              placeholder="ORTHO"
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value.toUpperCase(),
                })
              }
            />
          </FormField>

          <FormField label="Specialization Name" required>
            <input
              placeholder="Bone Specialist"
              value={form.specializationName}
              onChange={(e) =>
                setForm({
                  ...form,
                  specializationName: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Description">
            <textarea
              rows={3}
              placeholder="Department description"
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
            label="Active Department"
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