import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import Button from './Button';
import { FormField } from './FormField';
import { assetAPI } from '../services/api';

export default function CategoryManager({ open, onClose, onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
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

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"? This will also delete all subcategories.`)) return;
    
    try {
      await assetAPI.deleteCategory(category._id);
      toast.success('Category deleted');
      fetchCategories();
      onCategoryChange?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleAddSubCategory = async () => {
    if (!subCategoryForm.name) {
      toast.error('Subcategory name is required');
      return;
    }

    try {
      if (editingSubCategory) {
        await assetAPI.updateSubCategory(selectedCategory._id, editingSubCategory._id, subCategoryForm);
        toast.success('Subcategory updated');
      } else {
        await assetAPI.addSubCategory(selectedCategory._id, subCategoryForm);
        toast.success('Subcategory added');
      }
      fetchCategories();
      setShowSubCategoryForm(false);
      resetSubCategoryForm();
      onCategoryChange?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save subcategory');
    }
  };

  const handleDeleteSubCategory = async (categoryId, subCategoryId, subCategoryName) => {
    if (!window.confirm(`Delete subcategory "${subCategoryName}"?`)) return;
    
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
    setEditingSubCategory(null);
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

  const editSubCategory = (category, subCategory) => {
    setSelectedCategory(category);
    setEditingSubCategory(subCategory);
    setSubCategoryForm({
      name: subCategory.name,
      code: subCategory.code || '',
      description: subCategory.description || '',
      depreciationRate: subCategory.depreciationRate || '',
      usefulLifeYears: subCategory.usefulLifeYears || ''
    });
    setShowSubCategoryForm(true);
  };

  // Table Styles
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  };

  const thStyle = {
    textAlign: 'left',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: 600,
    color: '#374151',
  };

  const tdStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    verticalAlign: 'top',
  };

  const subTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    fontSize: 13,
  };

  const subThStyle = {
    textAlign: 'left',
    padding: '8px 12px',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: 600,
    color: '#6b7280',
    fontSize: 12,
  };

  const subTdStyle = {
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Manage Categories & Subcategories"
        width="90%"
        showConfirm={false}
        showCancel={false}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <Button onClick={() => { resetCategoryForm(); setShowCategoryForm(true); }}>
              + New Category
            </Button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>Loading categories...</div>
          ) : categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              No categories found. Click "New Category" to create one.
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>S.No</th>
                  <th style={thStyle}>Category Name</th>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Depreciation</th>
                  <th style={thStyle}>Subcategories</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <React.Fragment key={category._id}>
                    <tr>
                      <td style={tdStyle}>{index + 1}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            display: 'inline-block',
                            width: 12,
                            height: 12,
                            borderRadius: 3,
                            backgroundColor: category.color || '#3b82f6'
                          }}></span>
                          <span style={{ fontWeight: 500 }}>{category.name}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <code style={{ fontSize: 12, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
                          {category.code}
                        </code>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>
                          {category.description || '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 12 }}>
                          <div>Rate: {category.depreciationRate || '0'}%</div>
                          <div>Method: {category.depreciationMethod?.replace('-', ' ') || 'Straight Line'}</div>
                          <div>Life: {category.usefulLifeYears || 5} years</div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {category.subCategories?.length > 0 ? (
                          <table style={subTableStyle}>
                            <thead>
                              <tr>
                                <th style={subThStyle}>Name</th>
                                <th style={subThStyle}>Code</th>
                                <th style={subThStyle}>Description</th>
                                <th style={subThStyle}>Depreciation</th>
                                <th style={subThStyle}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {category.subCategories.map((sub) => (
                                <tr key={sub._id}>
                                  <td style={subTdStyle}>
                                    <span style={{ fontWeight: 500 }}>{sub.name}</span>
                                  </td>
                                  <td style={subTdStyle}>
                                    {sub.code && (
                                      <code style={{ fontSize: 11, background: '#e5e7eb', padding: '2px 4px', borderRadius: 3 }}>
                                        {sub.code}
                                      </code>
                                    )}
                                  </td>
                                  <td style={subTdStyle}>
                                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                                      {sub.description || '—'}
                                    </span>
                                  </td>
                                  <td style={subTdStyle}>
                                    <span style={{ fontSize: 12 }}>
                                      {sub.depreciationRate ? `${sub.depreciationRate}%` : '—'}
                                    </span>
                                  </td>
                                  <td style={subTdStyle}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      <button
                                        onClick={() => editSubCategory(category, sub)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          color: '#3b82f6',
                                          fontSize: 12,
                                          padding: '2px 6px'
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSubCategory(category._id, sub._id, sub.name)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          color: '#ef4444',
                                          fontSize: 12,
                                          padding: '2px 6px'
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>No subcategories</span>
                        )}
                        <div style={{ marginTop: 8 }}>
                          <button
                            onClick={() => {
                              setSelectedCategory(category);
                              resetSubCategoryForm();
                              setShowSubCategoryForm(true);
                            }}
                            style={{
                              background: 'none',
                              border: '1px dashed #3b82f6',
                              cursor: 'pointer',
                              color: '#3b82f6',
                              fontSize: 12,
                              padding: '4px 8px',
                              borderRadius: 4,
                            }}
                          >
                            + Add Subcategory
                          </button>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => editCategory(category)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#3b82f6',
                              fontSize: 13,
                              padding: '4px 8px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              fontSize: 13,
                              padding: '4px 8px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
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
          title={editingSubCategory ? `Edit Subcategory - ${selectedCategory?.name}` : `Add Subcategory to ${selectedCategory?.name}`}
          onConfirm={handleAddSubCategory}
          confirmLabel={editingSubCategory ? 'Update' : 'Add'}
          width="50%"
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
                  type="number"
                  value={subCategoryForm.depreciationRate}
                  onChange={(e) => setSubCategoryForm({ ...subCategoryForm, depreciationRate: e.target.value })}
                  placeholder="Optional"
                />
              </FormField>
              <FormField label="Useful Life (Years)">
                <input
                  type="number"
                  value={subCategoryForm.usefulLifeYears}
                  onChange={(e) => setSubCategoryForm({ ...subCategoryForm, usefulLifeYears: e.target.value })}
                  placeholder="Optional"
                />
              </FormField>
            </div>
          </div>
        </Modal>
      </Modal>
    </>
  );
}