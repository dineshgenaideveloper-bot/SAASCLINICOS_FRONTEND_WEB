import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../../../components/DataTable';
import Badge from '../../../components/Badge';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import { FormField } from '../../../components/FormField';

import { wardAPI } from '../../../services/api';

const emptyForm = {
  name: '',
  code: '',
  speciality: '',
  wardType: 'general',
  floor: '',
  genderType: 'unisex',
  description: '',
  status: 'active',
  isActive: true,
};

const wardTypeOptions = [
  { label: 'General', value: 'general' },
  { label: 'Private', value: 'private' },
  { label: 'Semi Private', value: 'semi_private' },
  { label: 'ICU', value: 'icu' },
  { label: 'NICU', value: 'nicu' },
  { label: 'PICU', value: 'picu' },
  { label: 'Emergency', value: 'emergency' },
  { label: 'Maternity', value: 'maternity' },
  { label: 'Other', value: 'other' },
];

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Unisex', value: 'unisex' },
  { label: 'Other', value: 'other' },
];

const statusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export default function WardMaster() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [sortConfig, setSortConfig] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWardType, setFilterWardType] = useState('');
  const [filterSpeciality, setFilterSpeciality] = useState('');

  const fetchWards = useCallback(async () => {
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
      if (filterWardType) params.wardType = filterWardType;
      if (filterSpeciality) params.speciality = filterSpeciality;

      const res = await wardAPI.getWards(params);

      setRows(res.data?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1,
      }));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch wards');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    sortConfig,
    searchQuery,
    filterStatus,
    filterWardType,
    filterSpeciality,
  ]);

  useEffect(() => {
    fetchWards();
  }, [fetchWards]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error('Ward name is required');
      return;
    }

    try {
      const payload = {
        ...form,
        code: String(form.code || '').toUpperCase(),
        status: form.status,
        isActive: form.status === 'active',
      };

      if (editingId) {
        await wardAPI.updateWard(editingId, payload);
        toast.success('Ward updated');
      } else {
        await wardAPI.createWard(payload);
        toast.success('Ward created');
      }

      setOpen(false);
      resetForm();
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchWards();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save ward');
    }
  };

  const handleEdit = (ward) => {
    setEditingId(ward._id);

    setForm({
      ...emptyForm,
      ...ward,
      status: ward.status || (ward.isActive ? 'active' : 'inactive'),
      isActive: ward.isActive ?? true,
    });

    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete ward?')) return;

    try {
      await wardAPI.deleteWard(id);
      toast.success('Ward deleted');
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchWards();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete ward');
    }
  };

  const toggleStatus = async (ward) => {
    try {
      const isActive = !ward.isActive;

      await wardAPI.updateWardStatus(ward._id, {
        isActive,
        status: isActive ? 'active' : 'inactive',
      });

      toast.success(isActive ? 'Ward activated' : 'Ward deactivated');
      fetchWards();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update ward status');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleSearchChange = (searchValue) => {
    setSearchQuery(searchValue);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = ({ sortBy, sortOrder }) => {
    setSortConfig({ sortBy, sortOrder });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const specialityOptions = useMemo(() => {
    const specialities = new Set();

    rows.forEach((ward) => {
      if (ward.speciality && ward.speciality.trim()) {
        specialities.add(ward.speciality);
      }
    });

    return [
      { label: 'All Specialities', value: '' },
      ...Array.from(specialities).map((speciality) => ({
        label: speciality,
        value: speciality,
      })),
    ];
  }, [rows]);

  const tableRows = rows.map((ward) => ({
    id: ward._id,
    wardId: ward.wardId || '—',
    name: ward.name || '—',
    code: ward.code || '—',
    speciality: ward.speciality || '—',
    wardType: ward.wardType || '—',
    floor: ward.floor || '—',
    genderType: ward.genderType || '—',
    status: ward.isActive ? 'Active' : 'Inactive',
    raw: ward,
  }));

  const columns = [
    {
      key: 'name',
      label: 'Ward',
      sortable: true,
      sortKey: 'name',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {row.wardId}
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      sortKey: 'code',
    },
    {
      key: 'speciality',
      label: 'Speciality',
      sortable: true,
      sortKey: 'speciality',
    },
    {
      key: 'wardType',
      label: 'Ward Type',
      sortable: true,
      sortKey: 'wardType',
      render: (value) => value.replace('_', ' ').toUpperCase(),
    },
    {
      key: 'floor',
      label: 'Floor',
      sortable: true,
      sortKey: 'floor',
    },
    {
      key: 'genderType',
      label: 'Gender',
      sortable: true,
      sortKey: 'genderType',
      render: (value) => value.toUpperCase(),
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
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ minWidth: 150 }}>
          <FormField label="Filter by Status">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div style={{ minWidth: 170 }}>
          <FormField label="Filter by Ward Type">
            <select
              value={filterWardType}
              onChange={(e) => {
                setFilterWardType(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Ward Types</option>
              {wardTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div style={{ minWidth: 180 }}>
          <FormField label="Filter by Speciality">
            <select
              value={filterSpeciality}
              onChange={(e) => {
                setFilterSpeciality(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              {specialityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      <DataTable
        title="Ward Master"
        subtitle="Manage clinic wards by speciality, floor, and ward type"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No wards found."
        addLabel="Add Ward"
        onAdd={() => {
          resetForm();
          setOpen(true);
        }}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        actions={({ row }) => (
          <>
            <Button size="sm" variant="outline" onClick={() => handleEdit(row.raw)}>
              Edit
            </Button>

            <Button size="sm" variant="danger" onClick={() => handleDelete(row.raw._id)}>
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
        title={editingId ? 'Edit Ward' : 'Add Ward'}
        confirmLabel={editingId ? 'Update Ward' : 'Save Ward'}
        onConfirm={handleSubmit}
        width="70%"
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Ward Name" required>
              <input
                placeholder="ICU Ward"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>

            <FormField label="Ward Code">
              <input
                placeholder="ICU"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
              />
            </FormField>
          </div>

          <FormField label="Speciality">
            <input
              placeholder="Cardiology / Orthopaedics / General"
              value={form.speciality}
              onChange={(e) => setForm({ ...form, speciality: e.target.value })}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <FormField label="Ward Type">
              <select
                value={form.wardType}
                onChange={(e) => setForm({ ...form, wardType: e.target.value })}
              >
                {wardTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Floor">
              <input
                placeholder="1st Floor"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
              />
            </FormField>

            <FormField label="Gender Type">
              <select
                value={form.genderType}
                onChange={(e) => setForm({ ...form, genderType: e.target.value })}
              >
                {genderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              rows={3}
              placeholder="Ward description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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