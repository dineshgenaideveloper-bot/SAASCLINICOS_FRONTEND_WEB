import React, { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { FormField, SelectField } from '../components/FormField';

import { clinicAPI } from '../services/api';

export default function Clinic() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [clearDataModalOpen, setClearDataModalOpen] = useState(false);

  const [selectedClinic, setSelectedClinic] = useState(null);

  const [clinicUsers, setClinicUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [storageInfo, setStorageInfo] = useState(null);
  const [storageLoading, setStorageLoading] = useState(false);
  
  const [clearingData, setClearingData] = useState(false);
  const [clearingStorage, setClearingStorage] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [selectedCollectionForClear, setSelectedCollectionForClear] = useState(null);
  const [exportingData, setExportingData] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const [sortConfig, setSortConfig] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const [form, setForm] = useState({
    name: '',
    type: 'General',
    registrationNumber: '',
    gstin: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    pincode: '',
    isActive: true,
  });

  const clinicTypeOptions = [
    { label: 'All Types', value: '' },
    { label: 'General', value: 'General' },
    { label: 'Specialty', value: 'Specialty' },
    { label: 'Multi-Specialty', value: 'Multi-Specialty' },
    { label: 'Hospital', value: 'Hospital' },
  ];

  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
  ];

  const fetchClinics = useCallback(async () => {
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
      if (filterType) params.type = filterType;
      if (filterCity) params.city = filterCity;

      const res = await clinicAPI.getClinics(params);
      
      setClinics(res.data?.data || []);
      setPagination({
        page: res.data?.pagination?.page || 1,
        limit: res.data?.pagination?.limit || 10,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1
      });
    } catch (error) {
      console.error('Fetch clinics error:', error);
      toast.error('Failed to fetch clinics');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, searchQuery, filterStatus, filterType, filterCity]);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

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

  const handleTypeFilterChange = (value) => {
    setFilterType(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCityFilterChange = (value) => {
    setFilterCity(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const openViewModal = (clinic) => {
    setSelectedClinic(clinic);
    setViewOpen(true);
  };

  const openUsersModal = async (clinic) => {
    try {
      setSelectedClinic(clinic);
      setUsersOpen(true);
      setUsersLoading(true);

      const res = await clinicAPI.getClinicUsers(clinic._id);
      setClinicUsers(res.data?.data || []);
    } catch (error) {
      console.error('Fetch clinic users error:', error);
      toast.error('Failed to fetch clinic users');
    } finally {
      setUsersLoading(false);
    }
  };

  const openStorageModal = async (clinic) => {
    try {
      setSelectedClinic(clinic);
      setStorageOpen(true);
      setStorageLoading(true);
      setStorageInfo(null);

      console.log('Fetching storage for clinic:', clinic._id, clinic.tenantId);
      
      const res = await clinicAPI.getStorageInfo(clinic._id);
      console.log('Storage response:', res.data);
      
      if (res.data.success) {
        setStorageInfo(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to fetch storage information');
      }
    } catch (error) {
      console.error('Fetch storage info error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch storage information');
    } finally {
      setStorageLoading(false);
    }
  };

  const handleClearCollection = (collection) => {
    setSelectedCollectionForClear(collection);
    setClearConfirmText('');
    setClearDataModalOpen(true);
  };

  const confirmClearCollection = async () => {
    if (clearConfirmText !== selectedCollectionForClear.name) {
      toast.error(`Please type "${selectedCollectionForClear.name}" to confirm`);
      return;
    }

    try {
      setClearingData(true);
      const response = await clinicAPI.clearCollection(selectedClinic._id, selectedCollectionForClear.name);
      
      if (response.data.success) {
        toast.success(`Collection "${selectedCollectionForClear.name}" cleared successfully`);
        const res = await clinicAPI.getStorageInfo(selectedClinic._id);
        if (res.data.success) {
          setStorageInfo(res.data.data);
        }
        setClearDataModalOpen(false);
        setSelectedCollectionForClear(null);
        setClearConfirmText('');
      } else {
        toast.error(response.data.message || 'Failed to clear collection');
      }
    } catch (error) {
      console.error('Clear collection error:', error);
      toast.error(error.response?.data?.message || 'Failed to clear collection');
    } finally {
      setClearingData(false);
    }
  };

  const exportCollectionData = async (collection) => {
    try {
      setExportingData(true);
      toast.loading(`Exporting ${collection.name} data...`, { id: 'export-data' });
      
      const response = await clinicAPI.exportCollectionData(selectedClinic._id, collection.name);
      
      if (response.data.success && response.data.data.length > 0) {
        const flattenObject = (obj, prefix = '') => {
          const flattened = {};
          for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
              const newKey = prefix ? `${prefix}.${key}` : key;
              const value = obj[key];
              if (value && typeof value === 'object' && !Array.isArray(value) && value !== null) {
                if (value instanceof Date) {
                  flattened[newKey] = value.toISOString();
                } else if (value._id) {
                  flattened[newKey] = value._id.toString();
                } else {
                  Object.assign(flattened, flattenObject(value, newKey));
                }
              } else if (Array.isArray(value)) {
                flattened[newKey] = JSON.stringify(value);
              } else if (value instanceof Date) {
                flattened[newKey] = value.toISOString();
              } else {
                flattened[newKey] = value;
              }
            }
          }
          return flattened;
        };

        const flattenedData = response.data.data.map(row => flattenObject(row));
        const ws = XLSX.utils.json_to_sheet(flattenedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, collection.name.substring(0, 31));
        
        const fileName = `${selectedClinic.tenantId}_${collection.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        toast.success(`Exported ${response.data.data.length} documents`, { id: 'export-data' });
      } else {
        toast.error(`No data found in ${collection.name}`, { id: 'export-data' });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export collection data', { id: 'export-data' });
    } finally {
      setExportingData(false);
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      const newStatus = !user.isActive;
      const res = await clinicAPI.updateClinicUserStatus(user._id, { isActive: newStatus });
      const updatedUser = res.data?.data;
      setClinicUsers((prev) =>
        prev.map((item) =>
          item._id === user._id
            ? { ...item, isActive: updatedUser?.isActive ?? newStatus }
            : item
        )
      );
      toast.success(newStatus ? 'User activated' : 'User deactivated');
    } catch (error) {
      console.error('Update user status error:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteClinicUser = async (user) => {
    const confirmDelete = window.confirm(
      `Delete user "${user.name || user.email || 'this user'}"?

This removes the user login from this clinic.`
    );

    if (!confirmDelete) return;

    try {
      await clinicAPI.deleteClinicUser(user._id);
      setClinicUsers((prev) => prev.filter((item) => item._id !== user._id));
      toast.success('Clinic user deleted successfully');
    } catch (error) {
      console.error('Delete clinic user error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete clinic user');
    }
  };

  const handleClearClinicStorage = async () => {
    if (!selectedClinic?._id) return;

    const confirmClear = window.confirm(
      `Clear ALL storage for clinic "${selectedClinic.name}"?

This will permanently delete all tenant database data for ${selectedClinic.tenantId}, but it will keep the clinic account and users.`
    );

    if (!confirmClear) return;

    try {
      setClearingStorage(true);
      const res = await clinicAPI.clearClinicStorage(selectedClinic._id);
      const data = res.data?.data;

      toast.success(
        `Clinic storage cleared${data?.documentsDeleted ? ` (${data.documentsDeleted} documents)` : ''}`
      );

      const storageRes = await clinicAPI.getStorageInfo(selectedClinic._id);
      setStorageInfo(storageRes.data?.success ? storageRes.data.data : null);
    } catch (error) {
      console.error('Clear clinic storage error:', error);
      toast.error(error.response?.data?.message || 'Failed to clear clinic storage');
    } finally {
      setClearingStorage(false);
    }
  };

  const openEdit = (clinic) => {
    setSelectedClinic(clinic);
    setForm({
      name: clinic.name || '',
      type: clinic.type || 'General',
      registrationNumber: clinic.registrationNumber || '',
      gstin: clinic.gstin || '',
      phone: clinic.contact?.phone || '',
      email: clinic.contact?.email || clinic.owner?.email || '',
      city: clinic.address?.city || '',
      state: clinic.address?.state || '',
      pincode: clinic.address?.pincode || '',
      isActive: clinic.isActive ?? true,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedClinic?._id) return;
    try {
      const payload = {
        name: form.name,
        type: form.type,
        registrationNumber: form.registrationNumber,
        gstin: form.gstin,
        contact: { phone: form.phone, email: form.email },
        address: { city: form.city, state: form.state, pincode: form.pincode, country: 'India' },
        isActive: form.isActive,
      };
      await clinicAPI.updateClinic(selectedClinic._id, payload);
      toast.success('Clinic updated successfully');
      setEditOpen(false);
      setSelectedClinic(null);
      fetchClinics();
    } catch (error) {
      console.error('Update clinic error:', error);
      toast.error('Failed to update clinic');
    }
  };

  const handleDelete = async (clinic) => {
    const confirmDelete = window.confirm(
      `Delete clinic "${clinic.name}"?

This will permanently delete:
• the clinic record
• all users for tenant ${clinic.tenantId}
• the tenant database/storage

This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      const res = await clinicAPI.deleteClinic(clinic._id);
      const data = res.data?.data;

      toast.success(
        `Clinic deleted${data?.deletedUsers !== undefined ? `, ${data.deletedUsers} users removed` : ''}`
      );

      fetchClinics();
    } catch (error) {
      console.error('Delete clinic error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete clinic');
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

  const getSizeColor = (size) => {
    if (size > 100) return '#ef4444';
    if (size > 50) return '#f59e0b';
    if (size > 10) return '#10b981';
    return '#6b7280';
  };

  const cityOptions = useMemo(() => {
    const cities = new Set();
    clinics.forEach(clinic => {
      if (clinic.address?.city && clinic.address.city.trim()) {
        cities.add(clinic.address.city);
      }
    });
    return [
      { label: 'All Cities', value: '' },
      ...Array.from(cities).map(city => ({ label: city, value: city }))
    ];
  }, [clinics]);

  const rows = clinics.map((clinic) => ({
    id: clinic._id,
    _id: clinic._id,
    name: clinic.name || '—',
    tenantId: clinic.tenantId || '—',
    owner: clinic.owner?.name || '—',
    email: clinic.owner?.email || clinic.contact?.email || '—',
    role: clinic.owner?.role || '—',
    city: clinic.address?.city || '—',
    type: clinic.type || '—',
    status: clinic.isActive ? 'Active' : 'Inactive',
    createdAt: formatDate(clinic.createdAt),
    raw: clinic,
  }));

  const columns = [
    { key: 'name', label: 'Clinic Name', sortable: true, sortKey: 'name' },
    { key: 'tenantId', label: 'Tenant ID', sortable: true, sortKey: 'tenantId' },
    { key: 'owner', label: 'Owner', sortable: true, sortKey: 'owner.name' },
    { key: 'email', label: 'Owner Email', sortable: true, sortKey: 'owner.email' },
    { key: 'role', label: 'Role', sortable: true, sortKey: 'owner.role' },
    { key: 'city', label: 'City', sortable: true, sortKey: 'address.city' },
    { key: 'type', label: 'Type', sortable: true, sortKey: 'type' },
    { key: 'createdAt', label: 'Created Date', sortable: true, sortKey: 'createdAt', width: 170 },
    { key: 'status', label: 'Status', sortable: true, sortKey: 'isActive', width: 100, render: (value) => <Badge color={value === 'Active' ? 'green' : 'red'}>{value}</Badge> },
  ];

  const thStyle = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)',
    textAlign: 'left',
    background: 'var(--bg)',
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    fontSize: 13,
    color: 'var(--text)',
    padding: '12px',
    borderBottom: '1px solid var(--border-light)',
    whiteSpace: 'nowrap',
  };

  return (
    <>
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
            <select value={filterStatus} onChange={(e) => handleStatusFilterChange(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
              {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </FormField>
        </div>
        <div>
          <FormField label="Clinic Type">
            <select value={filterType} onChange={(e) => handleTypeFilterChange(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
              {clinicTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </FormField>
        </div>
        <div>
          <FormField label="City">
            <select value={filterCity} onChange={(e) => handleCityFilterChange(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
              {cityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </FormField>
        </div>
        {(filterStatus || filterType || filterCity) && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
            <Button size="sm" variant="outline" onClick={() => { setFilterStatus(''); setFilterType(''); setFilterCity(''); }}>Clear Filters</Button>
          </div>
        )}
      </div>

      <DataTable
        title="Clinics"
        subtitle="View, update and delete registered clinic accounts"
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No clinics found."
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        actions={({ row }) => (
          <>
            <Button size="sm" variant="outline" iconOnly title="View Details" onClick={() => openViewModal(row.raw)} icon={<span>👁️</span>} />
            <Button size="sm" variant="outline" iconOnly title="View Storage" onClick={() => openStorageModal(row.raw)} icon={<span>💾</span>} />
            <Button size="sm" variant="outline" iconOnly title="View Users" onClick={() => openUsersModal(row.raw)} icon={<span>👥</span>} />
            <Button size="sm" variant="outline" onClick={() => openEdit(row.raw)}>Edit</Button>
            <Button size="sm" variant="danger" onClick={() => handleDelete(row.raw)}>Delete</Button>
          </>
        )}
      />

      {/* View Clinic Details Modal */}
      <Modal open={viewOpen} onClose={() => { setViewOpen(false); setSelectedClinic(null); }} title="Clinic Details" subtitle={`Tenant ID: ${selectedClinic?.tenantId}`} footer={false} width={600}>
        {selectedClinic && (
          <div style={{ padding: '4px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Clinic Information</div>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 16, border: '1px solid var(--border)' }}>
                  <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Clinic Name</div><div style={{ fontSize: 15, fontWeight: 500 }}>{selectedClinic.name || '—'}</div></div>
                  <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Clinic Type</div><div style={{ fontSize: 14 }}>{selectedClinic.type || '—'}</div></div>
                  <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Registration Number</div><div style={{ fontSize: 14, fontFamily: 'monospace' }}>{selectedClinic.registrationNumber || '—'}</div></div>
                  <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>GSTIN</div><div style={{ fontSize: 14, fontFamily: 'monospace' }}>{selectedClinic.gstin || '—'}</div></div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Contact Details</div>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 16, border: '1px solid var(--border)' }}>
                  <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Phone</div><div style={{ fontSize: 14 }}>{selectedClinic.contact?.phone || '—'}</div></div>
                  <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email</div><div style={{ fontSize: 14 }}>{selectedClinic.contact?.email || selectedClinic.owner?.email || '—'}</div></div>
                  <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Owner</div><div style={{ fontSize: 14 }}>{selectedClinic.owner?.name || '—'}</div></div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Address</div>
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 16, border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>City</div><div>{selectedClinic.address?.city || '—'}</div></div>
                  <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>State</div><div>{selectedClinic.address?.state || '—'}</div></div>
                  <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pincode</div><div>{selectedClinic.address?.pincode || '—'}</div></div>
                  <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Country</div><div>{selectedClinic.address?.country || 'India'}</div></div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              <div><strong>Created:</strong> {formatDate(selectedClinic.createdAt)}</div>
              <div><strong>Last Updated:</strong> {formatDate(selectedClinic.updatedAt)}</div>
              <div><Badge color={selectedClinic.isActive ? 'green' : 'red'}>{selectedClinic.isActive ? 'Active' : 'Inactive'}</Badge></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Storage Info Modal */}
      <Modal open={storageOpen} onClose={() => { setStorageOpen(false); setStorageInfo(null); setSelectedClinic(null); }} title="Database Storage Information" subtitle={`Clinic: ${selectedClinic?.name} | Tenant ID: ${selectedClinic?.tenantId}`} footer={false} width={900}>
        {storageLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>Loading storage information...</div>
        ) : storageInfo ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '16px', borderRadius: 12, color: 'white' }}>
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Total Database Size</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{storageInfo.totalSize || '0 MB'}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding: '16px', borderRadius: 12, color: 'white' }}>
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Total Collections</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{storageInfo.totalCollections || 0}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', padding: '16px', borderRadius: 12, color: 'white' }}>
                <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>Total Documents</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{storageInfo.totalDocuments?.toLocaleString() || 0}</div>
              </div>
            </div>

            <div style={{ marginBottom: 16, padding: 16, border: '1px solid var(--danger, #ef4444)', borderRadius: 10, background: 'rgba(239, 68, 68, 0.06)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--danger, #ef4444)', marginBottom: 4 }}>Danger Zone</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Clear the full tenant database/storage for this clinic. Clinic account and users will remain.</div>
              </div>
              <Button size="sm" variant="danger" onClick={handleClearClinicStorage} loading={clearingStorage} disabled={clearingStorage || storageInfo.totalDocuments === 0}>🗑️ Clear All Storage</Button>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: 'var(--bg)', padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Collection Details</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      <th style={thStyle}>Collection Name</th>
                      <th style={thStyle}>Documents</th>
                      <th style={thStyle}>Size (MB)</th>
                      <th style={thStyle}>Data Size</th>
                      <th style={thStyle}>Avg Doc Size</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storageInfo.collections?.map((collection, index) => (
                      <tr key={index}>
                        <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{collection.name}</span>{collection.documents === 0 && <Badge color="gray" size="sm" style={{ marginLeft: 8 }}>Empty</Badge>}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{collection.documents?.toLocaleString() || 0}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}><span style={{ color: getSizeColor(collection.size), fontWeight: 500 }}>{collection.size?.toFixed(2) || '0.00'}</span></td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{collection.dataSize?.toFixed(2) || '0.00'} MB</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{collection.avgDocSize?.toFixed(2) || '0.00'} KB</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button size="sm" variant="outline" onClick={() => exportCollectionData(collection)} disabled={collection.documents === 0} loading={exportingData}>📥 Export</Button>
                            <Button size="sm" variant="danger" onClick={() => handleClearCollection(collection)} disabled={collection.documents === 0}>🗑️ Clear</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span><strong>Database:</strong> {storageInfo.databaseName}</span>
              <span><strong>Last Updated:</strong> {formatDate(storageInfo.lastUpdated)}</span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No storage information available. The tenant database may not exist or is empty.
          </div>
        )}
      </Modal>

      {/* Clear Collection Modal */}
      <Modal open={clearDataModalOpen} onClose={() => { setClearDataModalOpen(false); setSelectedCollectionForClear(null); setClearConfirmText(''); }} title="⚠️ Clear Collection" subtitle={`Collection: ${selectedCollectionForClear?.name}`} width={500}>
        {selectedCollectionForClear && (
          <div style={{ padding: '20px' }}>
            <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--danger)' }}>⚠️ DANGER: This action cannot be undone!</div>
              <div style={{ fontSize: 13 }}>You are about to delete all <strong>{selectedCollectionForClear.documents?.toLocaleString()}</strong> documents from the <strong> "{selectedCollectionForClear.name}"</strong> collection.</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Type <strong style={{ color: 'var(--danger)' }}>{selectedCollectionForClear.name}</strong> to confirm:</div>
              <input type="text" value={clearConfirmText} onChange={(e) => setClearConfirmText(e.target.value)} placeholder={`Type ${selectedCollectionForClear.name}`} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14 }} />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => { setClearDataModalOpen(false); setSelectedCollectionForClear(null); setClearConfirmText(''); }}>Cancel</Button>
              <Button variant="danger" onClick={confirmClearCollection} loading={clearingData} disabled={clearConfirmText !== selectedCollectionForClear.name}>Permanently Clear Collection</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Users Modal */}
      <Modal open={usersOpen} onClose={() => { setUsersOpen(false); setClinicUsers([]); setSelectedClinic(null); }} title="Clinic Users" subtitle={selectedClinic?.name} footer={false} width={840}>
        {usersLoading ? <div>Loading users…</div> : clinicUsers.length === 0 ? <div>No users found for this clinic.</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Tenant ID</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clinicUsers.map((user) => (
                  <tr key={user._id}>
                    <td style={tdStyle}>{user.name || '—'}</td>
                    <td style={tdStyle}>{user.email || '—'}</td>
                    <td style={tdStyle}>{user.role || '—'}</td>
                    <td style={tdStyle}>{user.tenantId || '—'}</td>
                    <td style={tdStyle}>
                      <button onClick={() => toggleUserStatus(user)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <Badge color={user.isActive ? 'green' : 'red'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                      </button>
                    </td>
                    <td style={tdStyle}>
                      <Button size="sm" variant="danger" iconOnly title="Delete User" onClick={() => handleDeleteClinicUser(user)} icon={<span>🗑️</span>} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); setSelectedClinic(null); }} title="Update Clinic" subtitle={selectedClinic?.tenantId} confirmLabel="Update Clinic" onConfirm={handleUpdate}>
        <div style={{ display: 'grid', gap: 14 }}>
          <FormField label="Clinic Name" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter clinic name" /></FormField>
          <SelectField label="Clinic Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="General">General</option>
            <option value="Specialty">Specialty</option>
            <option value="Multi-Specialty">Multi-Specialty</option>
            <option value="Hospital">Hospital</option>
          </SelectField>
          <FormField label="Registration Number"><input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="Enter registration number" /></FormField>
          <FormField label="GSTIN"><input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} placeholder="Enter GSTIN" /></FormField>
          <FormField label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter phone" /></FormField>
          <FormField label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter email" /></FormField>
          <FormField label="City"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Enter city" /></FormField>
          <FormField label="State"><input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Enter state" /></FormField>
          <FormField label="Pincode"><input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Enter pincode" /></FormField>
          <SelectField label="Status" value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SelectField>
        </div>
      </Modal>
    </>
  );
}