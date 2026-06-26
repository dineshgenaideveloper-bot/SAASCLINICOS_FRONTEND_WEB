import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { FormField } from '../../components/FormField';
import { inventoryAPI } from '../../services/api';

const emptyForm = {
  name: '',
  code: '',
  parentCategory: '',
  description: '',
  hsnCode: '',
  gstRate: 0,
  reorderLevel: 0,
  reorderQuantity: 0,
  color: '#3b82f6'
};

export default function ItemCategoryManager({ open, onClose, onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await inventoryAPI.getCategories();
      setCategories(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchCategories();
  }, [open]);

  const mainCategories = useMemo(() => {
    return categories.filter(cat => !cat.parentCategory);
  }, [categories]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.code) {
      toast.error('Name and code are required');
      return;
    }

    const payload = {
      ...form,
      parentCategory: form.parentCategory || null,
      gstRate: Number(form.gstRate) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
      reorderQuantity: Number(form.reorderQuantity) || 0
    };

    try {
      if (editing) {
        await inventoryAPI.updateCategory(editing._id, payload);
        toast.success('Category updated');
      } else {
        await inventoryAPI.createCategory(payload);
        toast.success('Category created');
      }

      await fetchCategories();
      onCategoryChange?.();
      setShowForm(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const editCategory = (category) => {
    const parentId = category.parentCategory?._id || category.parentCategory || '';

    setEditing(category);
    setForm({
      name: category.name || '',
      code: category.code || '',
      parentCategory: parentId,
      description: category.description || '',
      hsnCode: category.hsnCode || '',
      gstRate: category.gstRate || 0,
      reorderLevel: category.reorderLevel || 0,
      reorderQuantity: category.reorderQuantity || 0,
      color: category.color || '#3b82f6'
    });

    setShowForm(true);
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;

    try {
      await inventoryAPI.deleteCategory(category._id);
      toast.success('Category deleted');
      await fetchCategories();
      onCategoryChange?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const getParentName = (category) => {
    if (!category.parentCategory) return 'Main Category';

    if (typeof category.parentCategory === 'object') {
      return category.parentCategory.name || '—';
    }

    const parent = categories.find(c => c._id === category.parentCategory);
    return parent?.name || '—';
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Manage Categories"
        width="80%"
        showConfirm={false}
        showCancel={false}
      >
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              + New Category / Sub Category
            </Button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>S.No</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Code</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Parent</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>HSN Code</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>GST</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Reorder Level</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
                      No categories found
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, index) => (
                    <tr key={cat._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: 12 }}>{index + 1}</td>

                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 2,
                              backgroundColor: cat.color || '#3b82f6'
                            }}
                          />
                          <span style={{ fontWeight: !cat.parentCategory ? 600 : 400 }}>
                            {cat.parentCategory ? '↳ ' : ''}
                            {cat.name}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: 12 }}>
                        <code>{cat.code}</code>
                      </td>

                      <td style={{ padding: 12 }}>{getParentName(cat)}</td>
                      <td style={{ padding: 12 }}>{cat.hsnCode || '—'}</td>
                      <td style={{ padding: 12 }}>{cat.gstRate || 0}%</td>
                      <td style={{ padding: 12 }}>{cat.reorderLevel || 0}</td>

                      <td style={{ padding: 12 }}>
                        <button
                          onClick={() => editCategory(cat)}
                          style={{
                            marginRight: 8,
                            color: '#3b82f6',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(cat)}
                          style={{
                            color: '#ef4444',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={editing ? 'Edit Category' : 'New Category / Sub Category'}
        onConfirm={handleSubmit}
        width="50%"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Name" required>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>

            <FormField label="Code" required>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Parent Category">
              <select
                value={form.parentCategory || ''}
                onChange={(e) => setForm({ ...form, parentCategory: e.target.value })}
              >
                <option value="">Main Category</option>
                {mainCategories
                  .filter(cat => cat._id !== editing?._id)
                  .map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </FormField>

            <FormField label="Color">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="HSN Code">
              <input
                value={form.hsnCode}
                onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
              />
            </FormField>

            <FormField label="GST Rate (%)">
              <input
                type="number"
                value={form.gstRate}
                onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Reorder Level">
              <input
                type="number"
                value={form.reorderLevel}
                onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
              />
            </FormField>

            <FormField label="Reorder Quantity">
              <input
                type="number"
                value={form.reorderQuantity}
                onChange={(e) => setForm({ ...form, reorderQuantity: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </FormField>
        </div>
      </Modal>
    </>
  );
}