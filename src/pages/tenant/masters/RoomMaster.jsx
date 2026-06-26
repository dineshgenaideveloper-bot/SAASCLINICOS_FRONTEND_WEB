import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../../../components/DataTable';
import Badge from '../../../components/Badge';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import { FormField } from '../../../components/FormField';

import { roomAPI, wardAPI } from '../../../services/api';

const emptyForm = {
  ward: '',
  roomNumber: '',
  name: '',
  roomType: 'general',
  floor: '',
  capacity: 1,
  dailyCharge: 0,
  description: '',
  status: 'active',
  isActive: true,
};

const roomTypeOptions = [
  { label: 'General', value: 'general' },
  { label: 'Private', value: 'private' },
  { label: 'Semi Private', value: 'semi_private' },
  { label: 'ICU', value: 'icu' },
  { label: 'NICU', value: 'nicu' },
  { label: 'PICU', value: 'picu' },
  { label: 'Emergency', value: 'emergency' },
  { label: 'Operation', value: 'operation' },
  { label: 'Consultation', value: 'consultation' },
  { label: 'Other', value: 'other' },
];

const statusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Maintenance', value: 'maintenance' },
];

export default function RoomMaster() {
  const [rows, setRows] = useState([]);
  const [wards, setWards] = useState([]);
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
  const [filterWard, setFilterWard] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('');

  const fetchWards = useCallback(async () => {
    try {
      const res = await wardAPI.getWards({
        page: 1,
        limit: 500,
        status: 'active',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      setWards(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch wards');
    }
  }, []);

  const fetchRooms = useCallback(async () => {
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
      if (filterWard) params.ward = filterWard;
      if (filterRoomType) params.roomType = filterRoomType;

      const res = await roomAPI.getRooms(params);

      setRows(res.data?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1,
      }));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    sortConfig,
    searchQuery,
    filterStatus,
    filterWard,
    filterRoomType,
  ]);

  useEffect(() => {
    fetchWards();
  }, [fetchWards]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.ward || !form.roomNumber) {
      toast.error('Ward and room number are required');
      return;
    }

    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity || 1),
        dailyCharge: Number(form.dailyCharge || 0),
        isActive: form.status === 'active',
      };

      if (editingId) {
        await roomAPI.updateRoom(editingId, payload);
        toast.success('Room updated');
      } else {
        await roomAPI.createRoom(payload);
        toast.success('Room created');
      }

      setOpen(false);
      resetForm();
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchRooms();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save room');
    }
  };

  const handleEdit = (room) => {
    setEditingId(room._id);

    setForm({
      ...emptyForm,
      ...room,
      ward: room.ward?._id || room.ward || '',
      status: room.status || (room.isActive ? 'active' : 'inactive'),
      isActive: room.isActive ?? true,
    });

    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete room?')) return;

    try {
      await roomAPI.deleteRoom(id);
      toast.success('Room deleted');
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchRooms();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete room');
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

  const getStatusColor = (status) => {
    if (status === 'active') return 'green';
    if (status === 'maintenance') return 'yellow';
    return 'red';
  };

  const tableRows = rows.map((room) => ({
    id: room._id,
    roomId: room.roomId || '—',
    roomNumber: room.roomNumber || '—',
    name: room.name || '—',
    wardName: room.ward?.name || '—',
    wardId: room.ward?.wardId || '',
    roomType: room.roomType || '—',
    floor: room.floor || '—',
    capacity: room.capacity ?? 0,
    dailyCharge: room.dailyCharge ?? 0,
    status: room.status || 'inactive',
    raw: room,
  }));

  const columns = [
    {
      key: 'roomNumber',
      label: 'Room',
      sortable: true,
      sortKey: 'roomNumber',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {row.roomId}
          </div>
        </div>
      ),
    },
    {
      key: 'wardName',
      label: 'Ward',
      sortable: false,
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{value}</div>
          {row.wardId && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {row.wardId}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Room Name',
      sortable: true,
      sortKey: 'name',
    },
    {
      key: 'roomType',
      label: 'Room Type',
      sortable: true,
      sortKey: 'roomType',
      render: (value) => String(value).replace('_', ' ').toUpperCase(),
    },
    {
      key: 'floor',
      label: 'Floor',
      sortable: true,
      sortKey: 'floor',
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
      sortKey: 'capacity',
    },
    {
      key: 'dailyCharge',
      label: 'Daily Charge',
      sortable: true,
      sortKey: 'dailyCharge',
      render: (value) => `₹${Number(value || 0).toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'status',
      render: (value) => (
        <Badge color={getStatusColor(value)}>
          {String(value).replace('_', ' ').toUpperCase()}
        </Badge>
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
        <div style={{ minWidth: 180 }}>
          <FormField label="Filter by Ward">
            <select
              value={filterWard}
              onChange={(e) => {
                setFilterWard(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Wards</option>
              {wards.map((ward) => (
                <option key={ward._id} value={ward._id}>
                  {ward.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div style={{ minWidth: 160 }}>
          <FormField label="Filter by Room Type">
            <select
              value={filterRoomType}
              onChange={(e) => {
                setFilterRoomType(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Room Types</option>
              {roomTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

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
      </div>

      <DataTable
        title="Room Master"
        subtitle="Manage rooms under each clinic ward"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No rooms found."
        addLabel="Add Room"
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
        title={editingId ? 'Edit Room' : 'Add Room'}
        confirmLabel={editingId ? 'Update Room' : 'Save Room'}
        onConfirm={handleSubmit}
        width="70%"
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <FormField label="Ward" required>
            <select
              value={form.ward}
              onChange={(e) => setForm({ ...form, ward: e.target.value })}
            >
              <option value="">Select Ward</option>
              {wards.map((ward) => (
                <option key={ward._id} value={ward._id}>
                  {ward.name} {ward.wardId ? `(${ward.wardId})` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Room Number" required>
              <input
                placeholder="101"
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              />
            </FormField>

            <FormField label="Room Name">
              <input
                placeholder="ICU Room 101"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <FormField label="Room Type">
              <select
                value={form.roomType}
                onChange={(e) => setForm({ ...form, roomType: e.target.value })}
              >
                {roomTypeOptions.map((opt) => (
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

            <FormField label="Capacity">
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Daily Charge">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={form.dailyCharge}
              onChange={(e) => setForm({ ...form, dailyCharge: e.target.value })}
            />
          </FormField>

          <FormField label="Description">
            <textarea
              rows={3}
              placeholder="Room description"
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
              <option value="maintenance">Maintenance</option>
            </select>
          </FormField>
        </div>
      </Modal>
    </>
  );
}