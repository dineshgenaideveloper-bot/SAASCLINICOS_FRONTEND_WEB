import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../../../components/DataTable';
import Badge from '../../../components/Badge';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import { FormField } from '../../../components/FormField';

import { bedAPI, roomAPI, wardAPI } from '../../../services/api';

const emptyForm = {
  room: '',
  bedNumber: '',
  bedType: 'standard',
  dailyCharge: 0,
  status: 'available',
  isActive: true,
  notes: '',
};

const bedTypeOptions = [
  { label: 'Standard', value: 'standard' },
  { label: 'Electric', value: 'electric' },
  { label: 'ICU', value: 'icu' },
  { label: 'Pediatric', value: 'pediatric' },
  { label: 'Maternity', value: 'maternity' },
  { label: 'Emergency', value: 'emergency' },
  { label: 'Other', value: 'other' },
];

const bedStatusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Available', value: 'available' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Reserved', value: 'reserved' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Inactive', value: 'inactive' },
];

export default function BedMaster() {
  const [rows, setRows] = useState([]);
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [formWardFilter, setFormWardFilter] = useState('');

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
  const [filterRoom, setFilterRoom] = useState('');
  const [filterBedType, setFilterBedType] = useState('');

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
      const res = await roomAPI.getRooms({
        page: 1,
        limit: 1000,
        status: 'active',
        sortBy: 'roomNumber',
        sortOrder: 'asc',
      });

      setRooms(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch rooms');
    }
  }, []);

  const fetchBeds = useCallback(async () => {
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
      if (filterRoom) params.room = filterRoom;
      if (filterBedType) params.bedType = filterBedType;

      const res = await bedAPI.getBeds(params);

      setRows(res.data?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1,
      }));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch beds');
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
    filterRoom,
    filterBedType,
  ]);

  useEffect(() => {
    fetchWards();
    fetchRooms();
  }, [fetchWards, fetchRooms]);

  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  const resetForm = () => {
    setForm(emptyForm);
    setFormWardFilter('');
    setEditingId(null);
  };

  const filteredRoomsForFilter = useMemo(() => {
    if (!filterWard) return rooms;

    return rooms.filter((room) => {
      const wardId = room.ward?._id || room.ward;
      return String(wardId) === String(filterWard);
    });
  }, [rooms, filterWard]);

  const filteredRoomsForForm = useMemo(() => {
    if (!formWardFilter) return rooms;

    return rooms.filter((room) => {
      const wardId = room.ward?._id || room.ward;
      return String(wardId) === String(formWardFilter);
    });
  }, [rooms, formWardFilter]);

  const handleSubmit = async () => {
    if (!form.room || !form.bedNumber) {
      toast.error('Room and bed number are required');
      return;
    }

    try {
      const payload = {
        room: form.room,
        bedNumber: form.bedNumber,
        bedType: form.bedType,
        dailyCharge: Number(form.dailyCharge || 0),
        status: form.status,
        isActive: form.status !== 'inactive',
        notes: form.notes,
      };

      if (editingId) {
        await bedAPI.updateBed(editingId, payload);
        toast.success('Bed updated');
      } else {
        await bedAPI.createBed(payload);
        toast.success('Bed created');
      }

      setOpen(false);
      resetForm();
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchBeds();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save bed');
    }
  };

  const handleEdit = (bed) => {
    const wardId = bed.ward?._id || bed.ward || '';
    const roomId = bed.room?._id || bed.room || '';

    setEditingId(bed._id);
    setFormWardFilter(wardId);

    setForm({
      ...emptyForm,
      ...bed,
      room: roomId,
      status: bed.status || 'available',
      isActive: bed.isActive ?? true,
    });

    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete bed?')) return;

    try {
      await bedAPI.deleteBed(id);
      toast.success('Bed deleted');
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchBeds();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete bed');
    }
  };

  const handleStatusChange = async (bed, status) => {
    try {
      await bedAPI.updateBedStatus(bed._id, {
        status,
        isActive: status !== 'inactive',
      });

      toast.success('Bed status updated');
      fetchBeds();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update bed status');
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
    if (status === 'available') return 'green';
    if (status === 'occupied') return 'red';
    if (status === 'reserved') return 'blue';
    if (status === 'maintenance') return 'yellow';
    return 'gray';
  };

  const tableRows = rows.map((bed) => ({
    id: bed._id,
    bedId: bed.bedId || '—',
    bedNumber: bed.bedNumber || '—',
    bedType: bed.bedType || '—',
    wardName: bed.ward?.name || '—',
    wardId: bed.ward?.wardId || '',
    roomNumber: bed.room?.roomNumber || '—',
    roomId: bed.room?.roomId || '',
    dailyCharge: bed.dailyCharge ?? 0,
    status: bed.status || 'available',
    raw: bed,
  }));

  const columns = [
    {
      key: 'bedNumber',
      label: 'Bed',
      sortable: true,
      sortKey: 'bedNumber',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {row.bedId}
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
      key: 'roomNumber',
      label: 'Room',
      sortable: false,
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{value}</div>
          {row.roomId && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {row.roomId}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'bedType',
      label: 'Bed Type',
      sortable: true,
      sortKey: 'bedType',
      render: (value) => String(value).replace('_', ' ').toUpperCase(),
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
      render: (value, row) => (
        <select
          value={value}
          onChange={(e) => handleStatusChange(row.raw, e.target.value)}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '5px 8px',
            fontSize: 12,
            background: '#fff',
          }}
        >
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
          <option value="maintenance">Maintenance</option>
          <option value="inactive">Inactive</option>
        </select>
      ),
    },
    {
      key: 'statusBadge',
      label: 'Badge',
      sortable: false,
      render: (_, row) => (
        <Badge color={getStatusColor(row.status)}>
          {String(row.status).replace('_', ' ').toUpperCase()}
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
                setFilterRoom('');
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

        <div style={{ minWidth: 180 }}>
          <FormField label="Filter by Room">
            <select
              value={filterRoom}
              onChange={(e) => {
                setFilterRoom(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Rooms</option>
              {filteredRoomsForFilter.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.roomNumber} {room.name ? `- ${room.name}` : ''}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div style={{ minWidth: 160 }}>
          <FormField label="Filter by Bed Type">
            <select
              value={filterBedType}
              onChange={(e) => {
                setFilterBedType(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All Bed Types</option>
              {bedTypeOptions.map((opt) => (
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
              {bedStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      <DataTable
        title="Bed Master"
        subtitle="Manage beds under rooms and wards"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No beds found."
        addLabel="Add Bed"
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
        title={editingId ? 'Edit Bed' : 'Add Bed'}
        confirmLabel={editingId ? 'Update Bed' : 'Save Bed'}
        onConfirm={handleSubmit}
        width="70%"
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <FormField label="Ward">
            <select
              value={formWardFilter}
              onChange={(e) => {
                setFormWardFilter(e.target.value);
                setForm({ ...form, room: '' });
              }}
            >
              <option value="">Select Ward to Filter Rooms</option>
              {wards.map((ward) => (
                <option key={ward._id} value={ward._id}>
                  {ward.name} {ward.wardId ? `(${ward.wardId})` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Room" required>
            <select
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
            >
              <option value="">Select Room</option>
              {filteredRoomsForForm.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.roomNumber}
                  {room.name ? ` - ${room.name}` : ''}
                  {room.ward?.name ? ` (${room.ward.name})` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Bed Number" required>
              <input
                placeholder="A1"
                value={form.bedNumber}
                onChange={(e) => setForm({ ...form, bedNumber: e.target.value })}
              />
            </FormField>

            <FormField label="Bed Type">
              <select
                value={form.bedType}
                onChange={(e) => setForm({ ...form, bedType: e.target.value })}
              >
                {bedTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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

          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value,
                  isActive: e.target.value !== 'inactive',
                })
              }
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>

          <FormField label="Notes">
            <textarea
              rows={3}
              placeholder="Bed notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </FormField>
        </div>
      </Modal>
    </>
  );
}