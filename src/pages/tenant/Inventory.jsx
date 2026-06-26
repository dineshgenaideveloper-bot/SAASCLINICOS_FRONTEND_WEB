import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { FormField } from '../../components/FormField';
import ItemCategoryManager from './ItemCategoryManager';
import StockModal from './StockModal';
import { inventoryAPI } from '../../services/api';

const emptyForm = {
  name: '',
  genericName: '',
  category: '',
  subCategory: '',
  manufacturer: '',
  brand: '',
  unit: 'piece',
  purchasePrice: 0,
  sellingPrice: 0,
  mrp: 0,
  currentStock: 0,
  minimumStock: 0,
  maximumStock: 0,
  reorderLevel: 0,
  reorderQuantity: 0,
  storageLocation: '',
  rackNumber: '',
  requiresPrescription: false,
  isControlled: false,
  schedule: '',
  batchManaged: false,
  description: '',
  sideEffects: '',
  contraindications: '',
  storageInstructions: '',
};

const unitOptions = [
  { label: 'Piece', value: 'piece' },
  { label: 'Box', value: 'box' },
  { label: 'Strip', value: 'strip' },
  { label: 'Bottle', value: 'bottle' },
  { label: 'Vial', value: 'vial' },
  { label: 'Ampoule', value: 'ampoule' },
  { label: 'ml', value: 'ml' },
  { label: 'gm', value: 'gm' },
  { label: 'kg', value: 'kg' },
  { label: 'Liter', value: 'liter' },
];

export default function Inventory() {
  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [lowStockCount, setLowStockCount] = useState(0);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);

      const res = await inventoryAPI.getItems({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      });

      setItems(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);

      const lowStockRes = await inventoryAPI.getLowStockItems();
      setLowStockCount(lowStockRes.data?.data?.length || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await inventoryAPI.getCategories();
      setCategories(res.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch categories');
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const mainCategories = useMemo(() => {
    return categories.filter((cat) => !cat.parentCategory);
  }, [categories]);

  const subCategories = useMemo(() => {
    return categories.filter((cat) => {
      const parentId = cat.parentCategory?._id || cat.parentCategory;
      return parentId === form.category;
    });
  }, [categories, form.category]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback(({ sortBy, sortOrder }) => {
    setSortBy(sortBy);
    setSortOrder(sortOrder);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((nextPage) => {
    setPage(nextPage);
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setLimit(size);
    setPage(1);
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.category) {
      toast.error('Name and category are required');
      return;
    }

    const payload = {
      ...form,
      subCategory: form.subCategory || null,
      purchasePrice: Number(form.purchasePrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      mrp: Number(form.mrp) || 0,
      currentStock: Number(form.currentStock) || 0,
      minimumStock: Number(form.minimumStock) || 0,
      maximumStock: Number(form.maximumStock) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
      reorderQuantity: Number(form.reorderQuantity) || 0,
    };

    try {
      if (editingId) {
        await inventoryAPI.updateItem(editingId, payload);
        toast.success('Item updated');
      } else {
        await inventoryAPI.createItem(payload);
        toast.success('Item created');
      }

      setOpen(false);
      resetForm();
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;

    try {
      await inventoryAPI.deleteItem(id);
      toast.success('Item deleted');

      if (items.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchItems();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleStockUpdate = async (stockData) => {
    try {
      await inventoryAPI.updateStock(selectedItem._id, stockData);
      toast.success('Stock updated');
      setShowStockModal(false);
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await inventoryAPI.downloadTemplate();

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute('download', 'item-import-template.xlsx');

      document.body.appendChild(link);
      link.click();
      link.remove();

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

      const res = await inventoryAPI.importItems(formData);
      const result = res.data?.data;

      toast.success(
        `Imported ${result?.createdCount || 0} items, skipped ${
          result?.skippedCount || 0
        }`
      );

      setPage(1);
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import');
    } finally {
      e.target.value = '';
    }
  };

  const openEditModal = (item) => {
    setEditingId(item._id);

    setForm({
      ...emptyForm,
      ...item,
      category: item.category?._id || item.category || '',
      subCategory: item.subCategory?._id || item.subCategory || '',
    });

    setOpen(true);
  };

  const getStockStatus = (item) => {
    if ((Number(item.currentStock) || 0) <= 0) {
      return { label: 'Out of Stock', color: 'red' };
    }

    if ((Number(item.currentStock) || 0) <= (Number(item.reorderLevel) || 0)) {
      return { label: 'Low Stock', color: 'orange' };
    }

    return { label: 'In Stock', color: 'green' };
  };

  const tableRows = items.map((item) => ({
    id: item._id,
    itemId: item.itemId,
    name: item.name,
    category: item.categoryName || item.category?.name || '—',
    subCategory: item.subCategoryName || item.subCategory?.name || '—',
    manufacturer: item.manufacturer || '—',
    currentStock: item.currentStock || 0,
    unit: item.unit,
    sellingPrice: item.sellingPrice || 0,
    stockStatus: getStockStatus(item),
    raw: item,
  }));

  const columns = [
    {
      key: 'name',
      label: 'Item',
      sortKey: 'name',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{value}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.itemId}</div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', sortKey: 'categoryName' },
    { key: 'subCategory', label: 'Sub Category', sortKey: 'subCategoryName' },
    { key: 'manufacturer', label: 'Manufacturer', sortKey: 'manufacturer' },
    {
      key: 'currentStock',
      label: 'Stock',
      sortKey: 'currentStock',
      render: (value, row) => (
        <div>
          <div>
            {value} {row.unit}
          </div>
          <Badge color={row.stockStatus.color} size="sm">
            {row.stockStatus.label}
          </Badge>
        </div>
      ),
    },
    {
      key: 'sellingPrice',
      label: 'Price',
      sortKey: 'sellingPrice',
      render: (value) => `₹${value}`,
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

      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowCategoryManager(true)}
          >
            📁 Manage Categories
          </Button>

          {lowStockCount > 0 && (
            <Badge color="orange">⚠️ {lowStockCount} Low Stock Items</Badge>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={handleDownloadTemplate}>
            📥 Download Template
          </Button>

          <Button size="sm" variant="secondary" onClick={handleImportClick}>
            📤 Import Excel
          </Button>
        </div>
      </div>

      <DataTable
        title="Inventory Management"
        subtitle="Manage dynamic item categories, sub categories, stock and pricing"
        columns={columns}
        rows={tableRows}
        total={total}
        page={page}
        pageSize={limit}
        loading={loading}
        addLabel="Add Item"
        onAdd={() => {
          resetForm();
          setOpen(true);
        }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        actions={({ row }) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedItem(row.raw);
                setShowStockModal(true);
              }}
            >
              Update Stock
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditModal(row.raw)}
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
          </div>
        )}
      />

      <ItemCategoryManager
        open={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onCategoryChange={() => {
          fetchCategories();
          fetchItems();
        }}
      />

      <StockModal
        open={showStockModal}
        onClose={() => setShowStockModal(false)}
        item={selectedItem}
        onConfirm={handleStockUpdate}
      />

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={editingId ? 'Edit Item' : 'Add Item'}
        onConfirm={handleSubmit}
        width="75%"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Item Name" required>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>

            <FormField label="Generic Name">
              <input
                value={form.genericName}
                onChange={(e) =>
                  setForm({ ...form, genericName: e.target.value })
                }
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <FormField label="Category" required>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value,
                    subCategory: '',
                  })
                }
              >
                <option value="">Select Category</option>
                {mainCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Sub Category">
              <select
                value={form.subCategory || ''}
                disabled={!form.category}
                onChange={(e) =>
                  setForm({ ...form, subCategory: e.target.value })
                }
              >
                <option value="">Select Sub Category</option>
                {subCategories.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Unit">
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                {unitOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Manufacturer">
              <input
                value={form.manufacturer}
                onChange={(e) =>
                  setForm({ ...form, manufacturer: e.target.value })
                }
              />
            </FormField>

            <FormField label="Brand">
              <input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <FormField label="Purchase Price">
              <input
                type="number"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm({ ...form, purchasePrice: e.target.value })
                }
              />
            </FormField>

            <FormField label="Selling Price">
              <input
                type="number"
                value={form.sellingPrice}
                onChange={(e) =>
                  setForm({ ...form, sellingPrice: e.target.value })
                }
              />
            </FormField>

            <FormField label="MRP">
              <input
                type="number"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            <FormField label="Current Stock">
              <input
                type="number"
                value={form.currentStock}
                disabled={!!editingId}
                onChange={(e) =>
                  setForm({ ...form, currentStock: e.target.value })
                }
              />
            </FormField>

            <FormField label="Minimum Stock">
              <input
                type="number"
                value={form.minimumStock}
                onChange={(e) =>
                  setForm({ ...form, minimumStock: e.target.value })
                }
              />
            </FormField>

            <FormField label="Maximum Stock">
              <input
                type="number"
                value={form.maximumStock}
                onChange={(e) =>
                  setForm({ ...form, maximumStock: e.target.value })
                }
              />
            </FormField>

            <FormField label="Reorder Level">
              <input
                type="number"
                value={form.reorderLevel}
                onChange={(e) =>
                  setForm({ ...form, reorderLevel: e.target.value })
                }
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <FormField label="Reorder Quantity">
              <input
                type="number"
                value={form.reorderQuantity}
                onChange={(e) =>
                  setForm({ ...form, reorderQuantity: e.target.value })
                }
              />
            </FormField>

            <FormField label="Storage Location">
              <input
                value={form.storageLocation}
                onChange={(e) =>
                  setForm({ ...form, storageLocation: e.target.value })
                }
              />
            </FormField>

            <FormField label="Rack Number">
              <input
                value={form.rackNumber}
                onChange={(e) =>
                  setForm({ ...form, rackNumber: e.target.value })
                }
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <FormField label="Requires Prescription">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!form.requiresPrescription}
                  onChange={(e) =>
                    setForm({ ...form, requiresPrescription: e.target.checked })
                  }
                />
                Yes
              </label>
            </FormField>

            <FormField label="Controlled Item">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!form.isControlled}
                  onChange={(e) =>
                    setForm({ ...form, isControlled: e.target.checked })
                  }
                />
                Yes
              </label>
            </FormField>

            <FormField label="Batch Managed">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!form.batchManaged}
                  onChange={(e) =>
                    setForm({ ...form, batchManaged: e.target.checked })
                  }
                />
                Yes
              </label>
            </FormField>
          </div>

          <FormField label="Schedule">
            <input
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              placeholder="Example: Schedule H"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </FormField>

          <FormField label="Side Effects">
            <textarea
              rows={2}
              value={form.sideEffects}
              onChange={(e) =>
                setForm({ ...form, sideEffects: e.target.value })
              }
            />
          </FormField>

          <FormField label="Contraindications">
            <textarea
              rows={2}
              value={form.contraindications}
              onChange={(e) =>
                setForm({ ...form, contraindications: e.target.value })
              }
            />
          </FormField>

          <FormField label="Storage Instructions">
            <textarea
              rows={2}
              value={form.storageInstructions}
              onChange={(e) =>
                setForm({ ...form, storageInstructions: e.target.value })
              }
            />
          </FormField>
        </div>
      </Modal>
    </>
  );
}