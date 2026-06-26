import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { FormField } from '../../components/FormField';

import { assetAPI } from '../../services/api';

const emptyForm = {
  assetId: '',
  name: '',
  category: '',
  subCategory: '',
  categoryId: '',
  model: '',
  serialNumber: '',
  manufacturer: '',
  supplier: '',
  purchaseDate: '',
  purchaseCost: '',
  warrantyExpiryDate: '',
  invoiceNumber: '',
  location: '',
  assignedTo: '',
  assignedType: 'none',
  status: 'active',
  condition: 'good',
  lastMaintenanceDate: '',
  nextMaintenanceDate: '',
  maintenanceFrequency: '',
  notes: '',
  tags: [],
  depreciationMethod: 'straight-line',
  depreciationRate: '',
  currentValue: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  insuranceExpiryDate: '',
  qrCode: '',
  barcode: '',
  isActive: true,
};

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Under Maintenance', value: 'maintenance' },
  { label: 'Retired', value: 'retired' },
  { label: 'Disposed', value: 'disposed' },
];

const conditionOptions = [
  { label: 'Excellent', value: 'excellent' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
  { label: 'Poor', value: 'poor' },
  { label: 'Damaged', value: 'damaged' },
];

const assignedTypeOptions = [
  { label: 'None', value: 'none' },
  { label: 'Staff', value: 'staff' },
  { label: 'Department', value: 'department' },
];

const depreciationMethodOptions = [
  { label: 'Straight Line', value: 'straight-line' },
  { label: 'Diminishing Balance', value: 'diminishing-balance' },
  { label: 'None', value: 'none' },
];

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text)',
      marginBottom: 16,
      marginTop: 8,
      paddingBottom: 8,
      borderBottom: '2px solid var(--primary-light, #e0e7ff)',
    }}>
      {children}
    </div>
  );
}

function AssetTagInput({ tags = [], onChange }) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onChange([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type tag and press Enter"
          style={{ flex: 1 }}
        />
        <Button size="sm" variant="secondary" onClick={addTag}>Add Tag</Button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tags.map((tag, index) => (
          <span
            key={index}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 12,
              background: '#e0e7ff',
              color: '#1e40af',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tag}
            <span
              onClick={() => removeTag(tag)}
              style={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              ×
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Category Manager Component
function CategoryManager({ open, onClose, onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    code: '',
    description: '',
    depreciationRate: '',
    depreciationMethod: 'straight-line',
    usefulLifeYears: 5,
    icon: '',
    color: '#3b82f6',
    isActive: true
  });
  const [subCategoryForm, setSubCategoryForm] = useState({
    name: '',
    code: '',
    description: '',
    depreciationRate: '',
    usefulLifeYears: ''
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await assetAPI.getCategories();
      setCategories(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const handleCreateCategory = async () => {
    if (!categoryForm.name || !categoryForm.code) {
      toast.error('Category name and code are required');
      return;
    }

    try {
      if (editingCategory) {
        await assetAPI.updateCategory(editingCategory._id, categoryForm);
        toast.success('Category updated');
      } else {
        await assetAPI.createCategory(categoryForm);
        toast.success('Category created');
      }
      fetchCategories();
      setShowCategoryForm(false);
      resetCategoryForm();
      onCategoryChange?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleAddSubCategory = async () => {
    if (!subCategoryForm.name) {
      toast.error('Subcategory name is required');
      return;
    }

    try {
      await assetAPI.addSubCategory(selectedCategory._id, subCategoryForm);
      toast.success('Subcategory added');
      fetchCategories();
      setShowSubCategoryForm(false);
      resetSubCategoryForm();
      onCategoryChange?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add subcategory');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category? This will also delete all subcategories.')) return;
    
    try {
      await assetAPI.deleteCategory(categoryId);
      toast.success('Category deleted');
      fetchCategories();
      onCategoryChange?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleDeleteSubCategory = async (categoryId, subCategoryId) => {
    if (!window.confirm('Delete this subcategory?')) return;
    
    try {
      await assetAPI.deleteSubCategory(categoryId, subCategoryId);
      toast.success('Subcategory deleted');
      fetchCategories();
      onCategoryChange?.();
    } catch (error) {
      toast.error('Failed to delete subcategory');
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      code: '',
      description: '',
      depreciationRate: '',
      depreciationMethod: 'straight-line',
      usefulLifeYears: 5,
      icon: '',
      color: '#3b82f6',
      isActive: true
    });
    setEditingCategory(null);
  };

  const resetSubCategoryForm = () => {
    setSubCategoryForm({
      name: '',
      code: '',
      description: '',
      depreciationRate: '',
      usefulLifeYears: ''
    });
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      code: category.code,
      description: category.description || '',
      depreciationRate: category.depreciationRate || '',
      depreciationMethod: category.depreciationMethod || 'straight-line',
      usefulLifeYears: category.usefulLifeYears || 5,
      icon: category.icon || '',
      color: category.color || '#3b82f6',
      isActive: category.isActive
    });
    setShowCategoryForm(true);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage Categories & Subcategories"
      width="80%"
      showConfirm={false}
      showCancel={false}
    >
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <Button onClick={() => { resetCategoryForm(); setShowCategoryForm(true); }}>
            + New Category
          </Button>
        </div>

        {loading ? (
          <div>Loading categories...</div>
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                No categories found. Click "New Category" to create one.
              </div>
            ) : (
              categories.map(category => (
                <div key={category._id} style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 20,
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          display: 'inline-block',
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          backgroundColor: category.color || '#3b82f6'
                        }}></span>
                        {category.name}
                        <span style={{ fontSize: 12, color: '#6b7280' }}>({category.code})</span>
                      </h3>
                      {category.description && (
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedCategory(category);
                        resetSubCategoryForm();
                        setShowSubCategoryForm(true);
                      }}>
                        + Add Subcategory
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => editCategory(category)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteCategory(category._id)}>
                        Delete
                      </Button>
                    </div>
                  </div>

                  {category.subCategories?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                        Subcategories:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {category.subCategories.map(sub => (
                          <div key={sub._id} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 12px',
                            backgroundColor: 'white',
                            borderRadius: 16,
                            border: '1px solid #e5e7eb',
                            fontSize: 13
                          }}>
                            <span>{sub.name}</span>
                            {sub.code && <span style={{ color: '#6b7280' }}>({sub.code})</span>}
                            <button
                              onClick={() => handleDeleteSubCategory(category._id, sub._id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#ef4444',
                                fontSize: 16,
                                padding: '0 4px'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      <Modal
        open={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        title={editingCategory ? 'Edit Category' : 'New Category'}
        onConfirm={handleCreateCategory}
        confirmLabel={editingCategory ? 'Update' : 'Create'}
        width="50%"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Category Name" required>
              <input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Medical Equipment"
              />
            </FormField>
            <FormField label="Category Code" required>
              <input
                value={categoryForm.code}
                onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g., MED-001"
              />
            </FormField>
          </div>
          
          <FormField label="Description">
            <textarea
              rows={2}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder="Category description"
            />
          </FormField>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Depreciation Rate (%)">
              <input
                type="number"
                value={categoryForm.depreciationRate}
                onChange={(e) => setCategoryForm({ ...categoryForm, depreciationRate: e.target.value })}
                placeholder="e.g., 10"
              />
            </FormField>
            <FormField label="Depreciation Method">
              <select
                value={categoryForm.depreciationMethod}
                onChange={(e) => setCategoryForm({ ...categoryForm, depreciationMethod: e.target.value })}
              >
                <option value="straight-line">Straight Line</option>
                <option value="diminishing-balance">Diminishing Balance</option>
                <option value="none">None</option>
              </select>
            </FormField>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Useful Life (Years)">
              <input
                type="number"
                value={categoryForm.usefulLifeYears}
                onChange={(e) => setCategoryForm({ ...categoryForm, usefulLifeYears: e.target.value })}
              />
            </FormField>
            <FormField label="Color">
              <input
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
              />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* Subcategory Form Modal */}
      <Modal
        open={showSubCategoryForm}
        onClose={() => setShowSubCategoryForm(false)}
        title={`Add Subcategory to ${selectedCategory?.name}`}
        onConfirm={handleAddSubCategory}
        confirmLabel="Add"
        width="40%"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <FormField label="Subcategory Name" required>
            <input
              value={subCategoryForm.name}
              onChange={(e) => setSubCategoryForm({ ...subCategoryForm, name: e.target.value })}
              placeholder="e.g., Diagnostic Equipment"
            />
          </FormField>
          <FormField label="Code">
            <input
              value={subCategoryForm.code}
              onChange={(e) => setSubCategoryForm({ ...subCategoryForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g., DIAG-001"
            />
          </FormField>
          <FormField label="Description">
            <textarea
              rows={2}
              value={subCategoryForm.description}
              onChange={(e) => setSubCategoryForm({ ...subCategoryForm, description: e.target.value })}
              placeholder="Subcategory description"
            />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Depreciation Rate (%)">
              <input
                value={subCategoryForm.depreciationRate}
                onChange={(e) => setSubCategoryForm({ ...subCategoryForm, depreciationRate: e.target.value })}
                placeholder="Optional"
              />
            </FormField>
            <FormField label="Useful Life (Years)">
              <input
                value={subCategoryForm.usefulLifeYears}
                onChange={(e) => setSubCategoryForm({ ...subCategoryForm, usefulLifeYears: e.target.value })}
                placeholder="Optional"
              />
            </FormField>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}

export default function Assets() {
  const fileInputRef = useRef(null);
  
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [maintenanceLog, setMaintenanceLog] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    cost: '',
    performedBy: '',
    nextDueDate: '',
    notes: '',
  });

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
  const [filterCondition, setFilterCondition] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  const fetchAssets = useCallback(async () => {
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
      if (filterCondition) params.condition = filterCondition;
      if (filterCategory) params.category = filterCategory;
      if (filterLocation) params.location = filterLocation;
      
      const res = await assetAPI.getAssets(params);
      
      setRows(res.data?.data || []);
      setPagination(prev => ({
        ...prev,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1
      }));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, searchQuery, filterStatus, filterCondition, filterCategory, filterLocation]);

  const fetchCategories = async () => {
    try {
      const res = await assetAPI.getCategories();
      setCategories(res.data?.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchCategories();
  }, [fetchAssets]);

  const categoryOptions = categories.map((c) => ({
    label: `${c.name} (${c.code})`,
    value: c.name,
  }));

  // Filter options
  const filterStatusOptions = [
    { label: 'All Status', value: '' },
    ...statusOptions
  ];

  const filterConditionOptions = [
    { label: 'All Conditions', value: '' },
    ...conditionOptions
  ];

  const filterCategoryOptions = [
    { label: 'All Categories', value: '' },
    ...categoryOptions
  ];

  // Get unique locations for filter
  const locationOptions = useMemo(() => {
    const locations = new Set();
    rows.forEach(asset => {
      if (asset.location && asset.location.trim()) {
        locations.add(asset.location);
      }
    });
    return [
      { label: 'All Locations', value: '' },
      ...Array.from(locations).map(loc => ({ label: loc, value: loc }))
    ];
  }, [rows]);

  const getSubCategoriesForCategory = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.subCategories || [];
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpen(true);
  };

  const handleEdit = (row) => {
    setEditingId(row._id);
    setForm({
      ...emptyForm,
      ...row,
      purchaseDate: row.purchaseDate ? String(row.purchaseDate).slice(0, 10) : '',
      warrantyExpiryDate: row.warrantyExpiryDate ? String(row.warrantyExpiryDate).slice(0, 10) : '',
      lastMaintenanceDate: row.lastMaintenanceDate ? String(row.lastMaintenanceDate).slice(0, 10) : '',
      nextMaintenanceDate: row.nextMaintenanceDate ? String(row.nextMaintenanceDate).slice(0, 10) : '',
      insuranceExpiryDate: row.insuranceExpiryDate ? String(row.insuranceExpiryDate).slice(0, 10) : '',
      tags: row.tags || [],
    });
    setOpen(true);
  };

  const handleMaintenanceClick = (row) => {
    setSelectedAsset(row);
    setMaintenanceLog({
      date: new Date().toISOString().slice(0, 10),
      description: '',
      cost: '',
      performedBy: '',
      nextDueDate: '',
      notes: '',
    });
    setShowMaintenanceModal(true);
  };

  const handleAddMaintenance = async () => {
    if (!maintenanceLog.description) {
      toast.error('Please enter maintenance description');
      return;
    }

    try {
      await assetAPI.addMaintenanceLog(selectedAsset._id, maintenanceLog);
      toast.success('Maintenance log added');
      setShowMaintenanceModal(false);
      fetchAssets();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add maintenance log');
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      if (!form.name || !form.category) {
        toast.error('Please fill required fields (Name, Category)');
        return;
      }

      const payload = { ...form };
      if (!editingId) delete payload.assetId;

      if (editingId) {
        await assetAPI.updateAsset(editingId, payload);
        toast.success('Asset updated');
      } else {
        await assetAPI.createAsset(payload);
        toast.success('Asset created');
      }

      setOpen(false);
      resetForm();
      // Reset to first page after create/update
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchAssets();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset? This action cannot be undone.')) return;

    try {
      await assetAPI.deleteAsset(id);
      toast.success('Asset deleted');
      // Reset to first page after delete
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchAssets();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete asset');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await assetAPI.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'asset-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await assetAPI.importAssets(formData);
      const result = res.data?.data;
      toast.success(`Imported ${result?.createdCount || 0} assets, skipped ${result?.skippedCount || 0}`);
      if (result?.errors?.length > 0) {
        console.warn('Import errors:', result.errors);
      }
      // Reset to first page after import
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchAssets();
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error('Failed to import assets');
    } finally {
      e.target.value = '';
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

  const handleConditionFilterChange = (value) => {
    setFilterCondition(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCategoryFilterChange = (value) => {
    setFilterCategory(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleLocationFilterChange = (value) => {
    setFilterLocation(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'maintenance': return 'orange';
      case 'retired': return 'red';
      case 'disposed': return 'gray';
      default: return 'gray';
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'excellent': return 'green';
      case 'good': return 'blue';
      case 'fair': return 'orange';
      case 'poor': return 'red';
      case 'damaged': return 'red';
      default: return 'gray';
    }
  };

  const tableRows = rows.map((asset) => ({
    id: asset._id,
    _id: asset._id,
    assetId: asset.assetId || '—',
    name: asset.name || '—',
    category: asset.category || '—',
    subCategory: asset.subCategory || '—',
    model: asset.model || '—',
    serialNumber: asset.serialNumber || '—',
    location: asset.location || '—',
    status: asset.status || 'active',
    condition: asset.condition || 'good',
    purchaseCost: asset.purchaseCost ? `₹${parseInt(asset.purchaseCost).toLocaleString()}` : '—',
    raw: asset,
  }));

  const columns = [
    {
      key: 'name',
      label: 'Asset',
      sortable: true,
      sortKey: 'name',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.assetId}</div>
        </div>
      ),
    },
    { 
      key: 'category', 
      label: 'Category',
      sortable: true,
      sortKey: 'category',
    },
    { 
      key: 'subCategory', 
      label: 'Sub Category',
      sortable: true,
      sortKey: 'subCategory',
    },
    { 
      key: 'model', 
      label: 'Model',
      sortable: true,
      sortKey: 'model',
    },
    { 
      key: 'serialNumber', 
      label: 'Serial No.',
      sortable: true,
      sortKey: 'serialNumber',
    },
    { 
      key: 'location', 
      label: 'Location',
      sortable: true,
      sortKey: 'location',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'status',
      render: (value) => (
        <Badge color={getStatusColor(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'condition',
      label: 'Condition',
      sortable: true,
      sortKey: 'condition',
      render: (value) => (
        <Badge color={getConditionColor(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
    { 
      key: 'purchaseCost', 
      label: 'Cost',
      sortable: true,
      sortKey: 'purchaseCost',
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
        alignItems: 'flex-end'
      }}>
        <div>
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
              {filterStatusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div>
          <FormField label="Filter by Condition">
            <select
              value={filterCondition}
              onChange={(e) => handleConditionFilterChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 13,
              }}
            >
              {filterConditionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div>
          <FormField label="Filter by Category">
            <select
              value={filterCategory}
              onChange={(e) => handleCategoryFilterChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 13,
              }}
            >
              {filterCategoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div>
          <FormField label="Filter by Location">
            <select
              value={filterLocation}
              onChange={(e) => handleLocationFilterChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 13,
              }}
            >
              {locationOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button size="sm" variant="secondary" onClick={() => setShowCategoryManager(true)}>
            📁 Manage Categories
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button size="sm" variant="secondary" onClick={handleDownloadTemplate}>
          📥 Download Template
        </Button>
        <Button size="sm" variant="secondary" onClick={handleImportClick}>
          📤 Import Excel
        </Button>
      </div>

      <DataTable
        title="Assets"
        subtitle="Manage clinic assets, equipment, and inventory"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No assets found."
        addLabel="Add Asset"
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
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="outline" onClick={() => handleMaintenanceClick(row.raw)}>
              Maintenance
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleEdit(row.raw)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleDelete(row.raw._id)}>
              Delete
            </Button>
          </div>
        )}
      />

      {/* Category Manager Modal */}
      <CategoryManager 
        open={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onCategoryChange={fetchCategories}
      />

      {/* Asset Form Modal */}
      <Modal
        open={open}
        onClose={() => { setOpen(false); resetForm(); }}
        title={editingId ? 'Edit Asset' : 'Add Asset'}
        confirmLabel={submitting ? 'Saving...' : (editingId ? 'Update Asset' : 'Save Asset')}
        onConfirm={handleSubmit}
        confirmLoading={submitting}
        width="80%"
        bodyStyle={{
          padding: '20px 24px',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        {/* Basic Information */}
        <SectionTitle>Basic Information</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px 20px',
          marginBottom: 8,
        }}>
          {editingId && (
            <FormField label="Asset ID">
              <input value={form.assetId} disabled style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
            </FormField>
          )}
          <FormField label="Asset Name" required>
            <input 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              placeholder="e.g., X-Ray Machine" 
            />
          </FormField>
          <FormField label="Category" required>
            <select 
              value={form.category} 
              onChange={(e) => {
                setForm({ ...form, category: e.target.value, subCategory: '' });
              }}
            >
              <option value="">Select Category</option>
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Sub Category">
            <select 
              value={form.subCategory} 
              onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
              disabled={!form.category}
            >
              <option value="">Select Sub Category</option>
              {getSubCategoriesForCategory(form.category).map(sub => (
                <option key={sub._id} value={sub.name}>{sub.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Model">
            <input 
              value={form.model} 
              onChange={(e) => setForm({ ...form, model: e.target.value })} 
              placeholder="Model number" 
            />
          </FormField>
          <FormField label="Serial Number">
            <input 
              value={form.serialNumber} 
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} 
              placeholder="Serial number" 
            />
          </FormField>
          <FormField label="Manufacturer">
            <input 
              value={form.manufacturer} 
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} 
              placeholder="Manufacturer name" 
            />
          </FormField>
          <FormField label="Supplier">
            <input 
              value={form.supplier} 
              onChange={(e) => setForm({ ...form, supplier: e.target.value })} 
              placeholder="Supplier name" 
            />
          </FormField>
        </div>

        {/* Purchase Information */}
        <SectionTitle>Purchase Information</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px 20px',
          marginBottom: 8,
        }}>
          <FormField label="Purchase Date">
            <input 
              type="date" 
              value={form.purchaseDate} 
              onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} 
            />
          </FormField>
          <FormField label="Purchase Cost">
            <input 
              value={form.purchaseCost} 
              onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })} 
              placeholder="Amount" 
            />
          </FormField>
          <FormField label="Warranty Expiry Date">
            <input 
              type="date" 
              value={form.warrantyExpiryDate} 
              onChange={(e) => setForm({ ...form, warrantyExpiryDate: e.target.value })} 
            />
          </FormField>
          <FormField label="Invoice Number">
            <input 
              value={form.invoiceNumber} 
              onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} 
              placeholder="Invoice number" 
            />
          </FormField>
        </div>

        {/* Location & Assignment */}
        <SectionTitle>Location & Assignment</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px 20px',
          marginBottom: 8,
        }}>
          <FormField label="Location">
            <input 
              value={form.location} 
              onChange={(e) => setForm({ ...form, location: e.target.value })} 
              placeholder="Building/Room/Floor" 
            />
          </FormField>
          <FormField label="Assigned Type">
            <select 
              value={form.assignedType} 
              onChange={(e) => setForm({ ...form, assignedType: e.target.value })}
            >
              {assignedTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Assigned To">
            <input 
              value={form.assignedTo} 
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} 
              placeholder="Staff name or department" 
              disabled={form.assignedType === 'none'} 
            />
          </FormField>
        </div>

        {/* Status & Condition */}
        <SectionTitle>Status & Condition</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px 20px',
          marginBottom: 8,
        }}>
          <FormField label="Status">
            <select 
              value={form.status} 
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Condition">
            <select 
              value={form.condition} 
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
            >
              {conditionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Maintenance Information */}
        <SectionTitle>Maintenance Information</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px 20px',
          marginBottom: 8,
        }}>
          <FormField label="Last Maintenance Date">
            <input 
              type="date" 
              value={form.lastMaintenanceDate} 
              onChange={(e) => setForm({ ...form, lastMaintenanceDate: e.target.value })} 
            />
          </FormField>
          <FormField label="Next Maintenance Date">
            <input 
              type="date" 
              value={form.nextMaintenanceDate} 
              onChange={(e) => setForm({ ...form, nextMaintenanceDate: e.target.value })} 
            />
          </FormField>
          <FormField label="Maintenance Frequency">
            <input 
              value={form.maintenanceFrequency} 
              onChange={(e) => setForm({ ...form, maintenanceFrequency: e.target.value })} 
              placeholder="e.g., Monthly, Quarterly" 
            />
          </FormField>
        </div>

        {/* Financial Information */}
        <SectionTitle>Financial Information</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px 20px',
          marginBottom: 8,
        }}>
          <FormField label="Depreciation Method">
            <select 
              value={form.depreciationMethod} 
              onChange={(e) => setForm({ ...form, depreciationMethod: e.target.value })}
            >
              {depreciationMethodOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Depreciation Rate (%)">
            <input 
              value={form.depreciationRate} 
              onChange={(e) => setForm({ ...form, depreciationRate: e.target.value })} 
              placeholder="e.g., 10" 
            />
          </FormField>
          <FormField label="Current Value">
            <input 
              value={form.currentValue} 
              onChange={(e) => setForm({ ...form, currentValue: e.target.value })} 
              placeholder="Current value" 
            />
          </FormField>
        </div>

        {/* Insurance Information */}
        <SectionTitle>Insurance Information</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px 20px',
          marginBottom: 8,
        }}>
          <FormField label="Insurance Provider">
            <input 
              value={form.insuranceProvider} 
              onChange={(e) => setForm({ ...form, insuranceProvider: e.target.value })} 
              placeholder="Insurance company name" 
            />
          </FormField>
          <FormField label="Policy Number">
            <input 
              value={form.insurancePolicyNumber} 
              onChange={(e) => setForm({ ...form, insurancePolicyNumber: e.target.value })} 
              placeholder="Policy number" 
            />
          </FormField>
          <FormField label="Insurance Expiry Date">
            <input 
              type="date" 
              value={form.insuranceExpiryDate} 
              onChange={(e) => setForm({ ...form, insuranceExpiryDate: e.target.value })} 
            />
          </FormField>
        </div>

        {/* Additional Information */}
        <SectionTitle>Additional Information</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px 20px',
          marginBottom: 8,
        }}>
          <div style={{ gridColumn: 'span 2' }}>
            <FormField label="Tags">
              <AssetTagInput tags={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
            </FormField>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <FormField label="Notes">
              <textarea 
                rows={3} 
                value={form.notes} 
                onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                placeholder="Additional notes about the asset" 
              />
            </FormField>
          </div>
          <FormField label="QR Code">
            <input 
              value={form.qrCode} 
              onChange={(e) => setForm({ ...form, qrCode: e.target.value })} 
              placeholder="QR code value" 
            />
          </FormField>
          <FormField label="Barcode">
            <input 
              value={form.barcode} 
              onChange={(e) => setForm({ ...form, barcode: e.target.value })} 
              placeholder="Barcode value" 
            />
          </FormField>
        </div>
      </Modal>

      {/* Maintenance Log Modal */}
      <Modal
        open={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        title={`Add Maintenance Log - ${selectedAsset?.name || ''}`}
        confirmLabel="Add Log"
        onConfirm={handleAddMaintenance}
        width="50%"
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px 20px',
        }}>
          <FormField label="Maintenance Date" required>
            <input 
              type="date" 
              value={maintenanceLog.date} 
              onChange={(e) => setMaintenanceLog({ ...maintenanceLog, date: e.target.value })} 
            />
          </FormField>
          <FormField label="Cost">
            <input 
              value={maintenanceLog.cost} 
              onChange={(e) => setMaintenanceLog({ ...maintenanceLog, cost: e.target.value })} 
              placeholder="Maintenance cost" 
            />
          </FormField>
          <div style={{ gridColumn: 'span 2' }}>
            <FormField label="Description" required>
              <textarea 
                rows={2} 
                value={maintenanceLog.description} 
                onChange={(e) => setMaintenanceLog({ ...maintenanceLog, description: e.target.value })} 
                placeholder="Description of maintenance performed" 
              />
            </FormField>
          </div>
          <FormField label="Performed By">
            <input 
              value={maintenanceLog.performedBy} 
              onChange={(e) => setMaintenanceLog({ ...maintenanceLog, performedBy: e.target.value })} 
              placeholder="Technician name" 
            />
          </FormField>
          <FormField label="Next Due Date">
            <input 
              type="date" 
              value={maintenanceLog.nextDueDate} 
              onChange={(e) => setMaintenanceLog({ ...maintenanceLog, nextDueDate: e.target.value })} 
            />
          </FormField>
          <div style={{ gridColumn: 'span 2' }}>
            <FormField label="Notes">
              <textarea 
                rows={2} 
                value={maintenanceLog.notes} 
                onChange={(e) => setMaintenanceLog({ ...maintenanceLog, notes: e.target.value })} 
                placeholder="Additional notes" 
              />
            </FormField>
          </div>
        </div>
      </Modal>
    </>
  );
}