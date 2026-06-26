import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { FormField } from '../../components/FormField';

import {
  purchaseOrderAPI,
  vendorAPI,
  inventoryAPI,
  clinicAPI,
} from '../../services/api';

const emptyForm = {
  vendor: '',
  notes: '',
  placeOfSupply: '',
  deliveryAddress: '',
  items: [],
};

const emptyItem = {
  item: '',
  quantity: 1,
  batchNumber: '',
  expiryDate: '',
  purchasePrice: 0,
  sellingPrice: 0,
  mrp: 0,
  cgstRate: 0,
  sgstRate: 0,
  igstRate: 0,
};

/* ─────────────────────────────────────────────
   VENDOR SEARCH COMPONENT (with real-time search)
───────────────────────────────────────────── */

function VendorSearchSelect({ value, onChange, vendors = [], loading = false, onSearch, placeholder = "Search vendor..." }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(search), 500);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [search]);

  useEffect(() => {
    if (debouncedSearch !== undefined) {
      onSearch?.(debouncedSearch);
      setIsOpen(true);
    }
  }, [debouncedSearch, onSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedVendor = useMemo(() => {
    if (!value) return null;
    return vendors.find(vendor => String(vendor._id) === String(value));
  }, [vendors, value]);

  const handleSelectVendor = (vendor) => {
    onChange(vendor._id);
    setSearch('');
    setDebouncedSearch('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => search && setIsOpen(true)}
        style={{
          width: '100%',
          height: 40,
          border: '1px solid #d1d5db',
          borderRadius: 8,
          padding: '0 12px',
          outline: 'none',
        }}
      />
      {loading && (
        <div style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 12,
          color: '#6b7280'
        }}>
          Searching...
        </div>
      )}
      
      {isOpen && search && !loading && vendors.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          maxHeight: 250,
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          {vendors.map((vendor) => (
            <div
              key={vendor._id}
              onClick={() => handleSelectVendor(vendor)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                background: String(value) === String(vendor._id) ? '#eff6ff' : 'white'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{vendor.name}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                {vendor.phone || 'No phone'} | {vendor.city || 'No city'} | GST: {vendor.gstin || '-'}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedVendor && !search && (
        <div style={{
          marginTop: 8,
          padding: '6px 10px',
          background: '#eff6ff',
          borderRadius: 6,
          fontSize: 13,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8
        }}>
          <span>
            <strong>{selectedVendor.name}</strong> - {selectedVendor.phone || 'No phone'}
          </span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            {selectedVendor.city || 'No city'} | GST: {selectedVendor.gstin || '-'}
          </span>
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#ef4444',
              fontSize: 16
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ITEM SEARCH COMPONENT (with real-time search)
───────────────────────────────────────────── */

function ItemSearchSelect({ value, onChange, items = [], loading = false, onSearch, placeholder = "Search item..." }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(search), 500);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [search]);

  useEffect(() => {
    if (debouncedSearch !== undefined) {
      onSearch?.(debouncedSearch);
      setIsOpen(true);
    }
  }, [debouncedSearch, onSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = useMemo(() => {
    if (!value) return null;
    return items.find(item => String(item._id) === String(value));
  }, [items, value]);

  const handleSelectItem = (item) => {
    onChange(item._id);
    setSearch('');
    setDebouncedSearch('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => search && setIsOpen(true)}
        style={{
          width: '100%',
          height: 40,
          border: '1px solid #d1d5db',
          borderRadius: 8,
          padding: '0 12px',
          outline: 'none',
        }}
      />
      {loading && (
        <div style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 12,
          color: '#6b7280'
        }}>
          Searching...
        </div>
      )}
      
      {isOpen && search && !loading && items.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          maxHeight: 250,
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          {items.map((item) => (
            <div
              key={item._id}
              onClick={() => handleSelectItem(item)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                background: String(value) === String(item._id) ? '#eff6ff' : 'white'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                {item.itemId} | Stock: {item.currentStock || 0} {item.unit || 'units'} | Purchase: ₹{item.purchasePrice || 0} | Selling: ₹{item.sellingPrice || 0}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedItem && !search && (
        <div style={{
          marginTop: 8,
          padding: '6px 10px',
          background: '#eff6ff',
          borderRadius: 6,
          fontSize: 13,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8
        }}>
          <span>
            <strong>{selectedItem.name}</strong> ({selectedItem.itemId}) - Stock: {selectedItem.currentStock || 0}
          </span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            Purchase: ₹{selectedItem.purchasePrice || 0} | Selling: ₹{selectedItem.sellingPrice || 0}
          </span>
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#ef4444',
              fontSize: 16
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [clinic, setClinic] = useState(null);

  const [activeTab, setActiveTab] = useState('raised');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ sortBy: 'createdAt', sortOrder: 'desc' });

  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [receiveForm, setReceiveForm] = useState({
    deliveryInvoiceNo: '',
    deliveryAddress: '',
  });

  const [loading, setLoading] = useState(false);

  const getLoggedUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  };

  const getLoggedUserName = () => {
    const user = getLoggedUser();
    return user?.name || user?.email || 'System';
  };

  const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN');
  };

  const buildClinicAddress = (clinicData) => {
    if (!clinicData) return '';

    return `
${clinicData?.name || ''}
${clinicData?.address?.street || ''}
${clinicData?.address?.city || ''}
${clinicData?.address?.state || ''} - ${clinicData?.address?.pincode || ''}
Phone: ${clinicData?.contact?.phone || ''}
Email: ${clinicData?.contact?.email || ''}
GSTIN: ${clinicData?.gstin || '-'}
    `.trim();
  };

  // Fetch orders with pagination, search, and sort
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      let status = '';
      if (activeTab === 'raised') status = 'draft';
      else if (activeTab === 'received') status = 'received';
      else if (activeTab === 'cancelled') status = 'cancelled';
      
      const res = await purchaseOrderAPI.getOrders({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        status: status,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      });
      
      setOrders(res.data?.data || []);
      setPagination(prev => ({
        ...prev,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1,
      }));
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to fetch purchase orders'
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, pagination.limit, searchQuery, sortConfig]);

  const fetchItems = useCallback(async (searchTerm = '') => {
    try {
      setItemsLoading(true);
      const res = await inventoryAPI.getItems({
        page: 1,
        limit: 20,
        search: searchTerm.trim(),
      });
      setItems(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch items');
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  const fetchVendors = useCallback(async (searchTerm = '') => {
    try {
      setVendorsLoading(true);
      const res = await vendorAPI.getVendors({
        page: 1,
        limit: 20,
        search: searchTerm.trim(),
      });
      setVendors(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch vendors');
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  }, []);

  const fetchMasters = async () => {
    try {
      const [clinicRes] = await Promise.all([
        clinicAPI.getClinics(),
      ]);

      const clinicData = (clinicRes.data?.data || [])[0] || null;

      setClinic(clinicData);

      if (clinicData) {
        setForm((prev) => ({
          ...prev,
          placeOfSupply: clinicData?.address?.state || '',
          deliveryAddress: buildClinicAddress(clinicData),
        }));
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to fetch masters'
      );
    }
  };

  // Reset pagination when tab or search changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [activeTab, searchQuery]);

  // Fetch orders when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchMasters();
    fetchItems('');
    fetchVendors('');
  }, [fetchItems, fetchVendors]);

  // Handle search debounce
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle sort
  const handleSortChange = useCallback(({ sortBy, sortOrder }) => {
    setSortConfig({ sortBy, sortOrder });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((newLimit) => {
    setPagination({ page: 1, limit: newLimit, total: 0, totalPages: 1 });
  }, []);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      placeOfSupply: clinic?.address?.state || '',
      deliveryAddress: buildClinicAddress(clinic),
    });
  };

  const addItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }],
    }));
  };

  const removeItemRow = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItemRow = (index, key, value) => {
    const nextItems = [...form.items];

    nextItems[index] = {
      ...nextItems[index],
      [key]: value,
    };

    if (key === 'item') {
      const selected = items.find(
        (x) => String(x._id) === String(value)
      );

      const gst = Number(selected?.tax) || 0;

      nextItems[index].purchasePrice = selected?.purchasePrice || 0;
      nextItems[index].sellingPrice = selected?.sellingPrice || 0;
      nextItems[index].mrp = selected?.mrp || 0;

      nextItems[index].cgstRate = gst / 2;
      nextItems[index].sgstRate = gst / 2;
      nextItems[index].igstRate = 0;
    }

    setForm({ ...form, items: nextItems });
  };

  const calculateLine = (row) => {
    const quantity = Number(row.quantity) || 0;
    const purchasePrice = Number(row.purchasePrice) || 0;

    const taxableAmount = quantity * purchasePrice;

    const cgstRate = Number(row.cgstRate) || 0;
    const sgstRate = Number(row.sgstRate) || 0;
    const igstRate = Number(row.igstRate) || 0;

    const cgstAmount = (taxableAmount * cgstRate) / 100;
    const sgstAmount = (taxableAmount * sgstRate) / 100;
    const igstAmount = (taxableAmount * igstRate) / 100;

    const gstAmount = cgstAmount + sgstAmount + igstAmount;

    return {
      taxableAmount,
      cgstRate,
      sgstRate,
      igstRate,
      gstRate: cgstRate + sgstRate + igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      gstAmount,
      total: taxableAmount + gstAmount,
    };
  };

  const calculateTotals = () => {
    return form.items.reduce(
      (acc, row) => {
        const line = calculateLine(row);

        acc.subTotal += line.taxableAmount;
        acc.cgstAmount += line.cgstAmount;
        acc.sgstAmount += line.sgstAmount;
        acc.igstAmount += line.igstAmount;
        acc.gstAmount += line.gstAmount;
        acc.grandTotal += line.total;

        return acc;
      },
      {
        subTotal: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        gstAmount: 0,
        grandTotal: 0,
      }
    );
  };

  const totals = calculateTotals();

  const handleSubmit = async () => {
    const createdBy = getLoggedUserName();

    if (!form.vendor) {
      toast.error('Vendor is required');
      return;
    }

    if (!form.items.length) {
      toast.error('Add at least one item');
      return;
    }

    const invalidItem = form.items.find(
      (row) => !row.item || Number(row.quantity) <= 0
    );

    if (invalidItem) {
      toast.error('Please select item and valid quantity');
      return;
    }

    const payload = {
      ...form,
      createdBy,
      isInterState: form.items.some(
        (row) => Number(row.igstRate) > 0
      ),
      items: form.items.map((row) => {
        const line = calculateLine(row);

        return {
          ...row,
          quantity: Number(row.quantity) || 0,
          purchasePrice: Number(row.purchasePrice) || 0,
          sellingPrice: Number(row.sellingPrice) || 0,
          mrp: Number(row.mrp) || 0,

          gstRate: line.gstRate,
          cgstRate: line.cgstRate,
          sgstRate: line.sgstRate,
          igstRate: line.igstRate,

          taxableAmount: line.taxableAmount,
          cgstAmount: line.cgstAmount,
          sgstAmount: line.sgstAmount,
          igstAmount: line.igstAmount,
          gstAmount: line.gstAmount,
          total: line.total,
        };
      }),
    };

    try {
      await purchaseOrderAPI.createOrder(payload);
      toast.success('Purchase order created');
      setOpen(false);
      resetForm();
      fetchOrders();
      fetchItems('');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to create purchase order'
      );
    }
  };

  const openReceiveModal = (order) => {
    setSelectedOrder(order);
    setReceiveForm({
      deliveryInvoiceNo: order.deliveryInvoiceNo || '',
      deliveryAddress:
        order.deliveryAddress ||
        buildClinicAddress(clinic),
    });
    setReceiveOpen(true);
  };

  const handleReceive = async () => {
    const receivedBy = getLoggedUserName();

    if (!selectedOrder?._id) return;

    if (!receiveForm.deliveryInvoiceNo) {
      toast.error('Delivery invoice number is required');
      return;
    }

    try {
      await purchaseOrderAPI.receiveOrder(selectedOrder._id, {
        ...receiveForm,
        receivedBy,
      });

      toast.success('Stock added successfully');
      setReceiveOpen(false);
      setSelectedOrder(null);
      fetchOrders();
      fetchItems('');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to receive order'
      );
    }
  };

  const openCancelConfirm = (order) => {
    setSelectedOrder(order);
    setCancelConfirmOpen(true);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder?._id) return;

    try {
      await purchaseOrderAPI.cancelOrder(selectedOrder._id);
      toast.success('Purchase order cancelled successfully');
      setCancelConfirmOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to cancel purchase order'
      );
    }
  };

  const getStatusColor = (status) => {
    if (status === 'received') return 'green';
    if (status === 'cancelled') return 'red';
    return 'orange';
  };

  const getVendorForPrint = (order) => {
    if (order.vendor && typeof order.vendor === 'object') {
      return order.vendor;
    }

    return (
      vendors.find(
        (x) => String(x._id) === String(order.vendor)
      ) || {}
    );
  };

  const printPurchaseOrder = (order) => {
    const vendor = getVendorForPrint(order);
    const printWindow = window.open('', '', 'width=1000,height=900');

    if (!printWindow) {
      toast.error('Popup blocked. Please allow popup.');
      return;
    }

    printWindow.document.write(`
<html>
<head>
  <title>${order.poNumber || 'Purchase Order'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      margin: 0;
      color: #111827;
      font-size: 10px;
      line-height: 1.25;
    }

    .po-container {
      border: 1.5px solid #000;
      padding: 8px;
    }

    .top-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1.5px solid #000;
      padding-bottom: 6px;
      margin-bottom: 6px;
    }

    .clinic-name {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 3px;
    }

    .clinic-details {
      line-height: 1.25;
      font-size: 9.5px;
    }

    .po-title {
      text-align: right;
      min-width: 210px;
    }

    .po-title h1 {
      margin: 0 0 4px;
      font-size: 22px;
      letter-spacing: 1px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 6px;
    }

    .box {
      border: 1px solid #000;
      padding: 6px;
      min-height: 76px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .box-title {
      font-weight: 700;
      margin-bottom: 4px;
      border-bottom: 1px solid #000;
      padding-bottom: 2px;
      font-size: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }

    thead {
      display: table-header-group;
    }

    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    th,
    td {
      border: 1px solid #000;
      padding: 3px;
      font-size: 8.8px;
      vertical-align: top;
    }

    th {
      background: #f3f4f6;
      text-align: center;
      font-weight: 700;
    }

    td {
      text-align: center;
    }

    .text-left {
      text-align: left;
    }

    .bottom-section {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-top: 6px;
    }

    .totals {
      width: 270px;
      margin-left: auto;
      border: 1px solid #000;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 6px;
      border-bottom: 1px solid #000;
      font-size: 9.5px;
    }

    .totals-row:last-child {
      border-bottom: none;
      font-size: 12px;
      font-weight: 700;
    }

    .notes {
      margin-top: 6px;
      border: 1px solid #000;
      padding: 5px;
      min-height: 28px;
    }

    .footer {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .signature {
      text-align: center;
      width: 180px;
    }

    .signature-line {
      border-top: 1px solid #000;
      padding-top: 4px;
      font-weight: 600;
      font-size: 10px;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>

<body>
  <div class="po-container">
    <div class="top-header">
      <div>
        <div class="clinic-name">${clinic?.name || ''}</div>

        <div class="clinic-details">
          ${clinic?.address?.street || ''}<br/>
          ${clinic?.address?.city || ''},
          ${clinic?.address?.state || ''} -
          ${clinic?.address?.pincode || ''}<br/>

          Phone: ${clinic?.contact?.phone || '-'} |
          Email: ${clinic?.contact?.email || '-'}<br/>

          GSTIN: ${clinic?.gstin || '-'}
        </div>
      </div>

      <div class="po-title">
        <h1>PURCHASE ORDER</h1>

        <div>
          <strong>PO NO:</strong>
          ${order.poNumber || '-'}
        </div>

        <div>
          <strong>DATE:</strong>
          ${formatDate(order.createdAt)}
        </div>

        <div>
          <strong>STATUS:</strong>
          ${(order.status || '').toUpperCase()}
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="box">
        <div class="box-title">VENDOR DETAILS</div>

        <strong>${vendor?.name || order.vendorName || '-'}</strong><br/>

        ${vendor?.address || ''}<br/>
        ${vendor?.city || ''},
        ${vendor?.state || ''}<br/>

        Phone: ${vendor?.phone || '-'}<br/>
        GSTIN: ${vendor?.gstin || '-'}
      </div>

      <div class="box">
        <div class="box-title">DELIVERY / RECEIVE ADDRESS</div>

        <div style="white-space:pre-line;">
          ${order.deliveryAddress || buildClinicAddress(clinic) || '-'}
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="box">
        <div class="box-title">ORDER DETAILS</div>

        <strong>Place of Supply:</strong>
        ${order.placeOfSupply || '-'}<br/>

        <strong>Total Items:</strong>
        ${order.items?.length || 0}<br/>

        <strong>Created By:</strong>
        ${order.createdBy || '-'}
      </div>

      <div class="box">
        <div class="box-title">RECEIVE DETAILS</div>

        <strong>Delivery Invoice No:</strong>
        ${order.deliveryInvoiceNo || '-'}<br/>

        <strong>Received Date:</strong>
        ${formatDate(order.receivedAt)}<br/>

        <strong>Received By:</strong>
        ${order.receivedBy || '-'}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:28px;">#</th>
          <th>ITEM</th>
          <th style="width:58px;">CODE</th>
          <th style="width:58px;">BATCH</th>
          <th style="width:58px;">EXP</th>
          <th style="width:38px;">QTY</th>
          <th style="width:58px;">RATE</th>
          <th style="width:62px;">TAXABLE</th>
          <th style="width:46px;">GST%</th>
          <th style="width:58px;">GST</th>
          <th style="width:62px;">TOTAL</th>
        </tr>
      </thead>

      <tbody>
        ${(order.items || [])
          .map((row, index) => {
            const taxable =
              Number(row.taxableAmount) ||
              Number(row.quantity || 0) *
                Number(row.purchasePrice || 0);

            const gst =
              Number(row.gstAmount) ||
              Number(row.cgstAmount || 0) +
                Number(row.sgstAmount || 0) +
                Number(row.igstAmount || 0);

            const total = Number(row.total) || taxable + gst;

            return `
              <tr>
                <td>${index + 1}</td>

                <td class="text-left">
                  ${row.itemName || row.item?.name || '-'}
                </td>

                <td>${row.itemCode || row.item?.itemId || '-'}</td>

                <td>${row.batchNumber || '-'}</td>

                <td>${formatDate(row.expiryDate)}</td>

                <td>${row.quantity || 0}</td>

                <td>${money(row.purchasePrice)}</td>

                <td>${money(taxable)}</td>

                <td>${Number(row.gstRate || 0).toFixed(2)}%</td>

                <td>${money(gst)}</td>

                <td>${money(total)}</td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>

    <div class="bottom-section">
      <div class="totals">
        <div class="totals-row">
          <span>Sub Total</span>
          <strong>${money(order.subTotal)}</strong>
        </div>

        <div class="totals-row">
          <span>CGST</span>
          <strong>${money(order.cgstAmount)}</strong>
        </div>

        <div class="totals-row">
          <span>SGST</span>
          <strong>${money(order.sgstAmount)}</strong>
        </div>

        <div class="totals-row">
          <span>IGST</span>
          <strong>${money(order.igstAmount)}</strong>
        </div>

        <div class="totals-row">
          <span>Grand Total</span>
          <strong>${money(order.grandTotal)}</strong>
        </div>
      </div>

      <div class="notes">
        <strong>NOTES:</strong><br/>
        ${order.notes || '-'}
      </div>

      <div class="footer">
        <div class="signature">
          <div class="signature-line">Vendor Signature</div>
        </div>

        <div class="signature">
          <div class="signature-line">Authorized Signature</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function () {
      window.print();
    };
  </script>
</body>
</html>
    `);

    printWindow.document.close();
  };

  const openView = (order) => {
    setSelectedOrder(order);
    setViewOpen(true);
  };

  const displayOrders = orders;

  const tableRows = displayOrders.map((order) => ({
    id: order._id,
    poNumber: order.poNumber,
    poDate: formatDate(order.createdAt), // Added PO Date
    vendor: order.vendorName || order.vendor?.name || '—',
    items: order.items?.length || 0,
    grandTotal: order.grandTotal || 0,
    status: order.status,
    deliveryInvoiceNo: order.deliveryInvoiceNo || '-',
    receivedAt: formatDate(order.receivedAt),
    raw: order,
  }));

  const columns = [
    { key: 'poNumber', label: 'PO Number', sortable: true },
    { key: 'poDate', label: 'PO Date', sortable: true }, // Added PO Date column
    { key: 'vendor', label: 'Vendor', sortable: true },
    { key: 'items', label: 'Items', sortable: false },
    {
      key: 'grandTotal',
      label: 'Total',
      sortable: true,
      render: (value) => money(value),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge color={getStatusColor(value)}>
          {String(value || '').toUpperCase()}
        </Badge>
      ),
    },
    { key: 'deliveryInvoiceNo', label: 'Invoice No', sortable: true },
    { key: 'receivedAt', label: 'Received Date', sortable: true },
  ];

  return (
    <>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={tabWrap}>
          <button
            type="button"
            onClick={() => setActiveTab('raised')}
            style={{
              ...tabBtn,
              ...(activeTab === 'raised' ? activeTabBtn : {}),
            }}
          >
            PO Raised ({activeTab === 'raised' ? pagination.total : '...'})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('received')}
            style={{
              ...tabBtn,
              ...(activeTab === 'received' ? activeTabBtn : {}),
            }}
          >
            PO Received ({activeTab === 'received' ? pagination.total : '...'})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cancelled')}
            style={{
              ...tabBtn,
              ...(activeTab === 'cancelled' ? activeTabBtn : {}),
            }}
          >
            PO Cancelled ({activeTab === 'cancelled' ? pagination.total : '...'})
          </button>
        </div>

        <DataTable
          title={
            activeTab === 'raised' 
              ? 'PO Raised' 
              : activeTab === 'received' 
              ? 'PO Received' 
              : 'PO Cancelled'
          }
          subtitle={
            activeTab === 'raised'
              ? 'Purchase orders raised but not received'
              : activeTab === 'received'
              ? 'Purchase orders received and stock added'
              : 'Purchase orders that have been cancelled'
          }
          columns={columns}
          rows={tableRows}
          total={pagination.total}
          page={pagination.page}
          pageSize={pagination.limit}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          loading={loading}
          addLabel="New Purchase Order"
          onAdd={() => {
            resetForm();
            setOpen(true);
          }}
          actions={({ row }) => (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openView(row.raw)}
              >
                View
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => printPurchaseOrder(row.raw)}
              >
                Print / PDF
              </Button>

              {row.raw.status === 'draft' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openReceiveModal(row.raw)}
                  >
                    Receive Stock
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => openCancelConfirm(row.raw)}
                  >
                    Cancel PO
                  </Button>
                </>
              )}

              {row.raw.status === 'received' && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  Received
                </Button>
              )}

              {row.raw.status === 'cancelled' && (
                <Button
                  size="sm"
                  variant="danger"
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  Cancelled
                </Button>
              )}
            </>
          )}
        />
      </div>

      {/* Create Purchase Order Modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="New Purchase Order"
        confirmLabel="Create PO"
        onConfirm={handleSubmit}
        width="95%"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: 12,
            }}
          >
            <FormField label="Vendor" required>
              <VendorSearchSelect
                value={form.vendor}
                onChange={(vendorId) =>
                  setForm({
                    ...form,
                    vendor: vendorId,
                  })
                }
                vendors={vendors}
                loading={vendorsLoading}
                onSearch={fetchVendors}
                placeholder="Search vendor by name, phone..."
              />
            </FormField>

            <FormField label="Place of Supply">
              <input
                value={form.placeOfSupply}
                onChange={(e) =>
                  setForm({
                    ...form,
                    placeOfSupply: e.target.value,
                  })
                }
                placeholder="Tamil Nadu"
              />
            </FormField>
          </div>

          <FormField label="Delivery / Receive Address">
            <textarea
              rows={5}
              value={form.deliveryAddress}
              onChange={(e) =>
                setForm({
                  ...form,
                  deliveryAddress: e.target.value,
                })
              }
            />
          </FormField>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <strong>Items</strong>

            <Button
              size="sm"
              variant="secondary"
              onClick={addItemRow}
            >
              + Add Item
            </Button>
          </div>

          {form.items.map((row, index) => {
            const selectedItem = items.find(
              (x) => String(x._id) === String(row.item)
            );

            const line = calculateLine(row);

            return (
              <div key={index} style={itemCard}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr auto',
                    gap: 12,
                  }}
                >
                  <FormField label="Item" required>
                    <ItemSearchSelect
                      value={row.item}
                      onChange={(itemId) =>
                        updateItemRow(index, 'item', itemId)
                      }
                      items={items}
                      loading={itemsLoading}
                      onSearch={fetchItems}
                      placeholder="Search item by name, ID..."
                    />
                  </FormField>

                  <FormField label="Quantity" required>
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) =>
                        updateItemRow(
                          index,
                          'quantity',
                          e.target.value
                        )
                      }
                    />
                  </FormField>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'end',
                    }}
                  >
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => removeItemRow(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {selectedItem && (
                  <div
                    style={{
                      fontSize: 12,
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#f0fdf4',
                      color: '#166534',
                      marginTop: 4,
                    }}
                  >
                    Current Stock: {selectedItem.currentStock || 0}{' '}
                    {selectedItem.unit || 'units'}
                  </div>
                )}

                <div style={fourGrid}>
                  <FormField label="Batch">
                    <input
                      value={row.batchNumber}
                      onChange={(e) =>
                        updateItemRow(
                          index,
                          'batchNumber',
                          e.target.value
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Expiry">
                    <input
                      type="date"
                      value={row.expiryDate}
                      onChange={(e) =>
                        updateItemRow(
                          index,
                          'expiryDate',
                          e.target.value
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Purchase Price (₹)">
                    <input
                      type="number"
                      value={row.purchasePrice}
                      onChange={(e) =>
                        updateItemRow(
                          index,
                          'purchasePrice',
                          e.target.value
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Selling Price (₹)">
                    <input
                      type="number"
                      value={row.sellingPrice}
                      onChange={(e) =>
                        updateItemRow(
                          index,
                          'sellingPrice',
                          e.target.value
                        )
                      }
                    />
                  </FormField>
                </div>

                <div style={fiveGrid}>
                  <FormField label="MRP (₹)">
                    <input
                      type="number"
                      value={row.mrp}
                      onChange={(e) =>
                        updateItemRow(index, 'mrp', e.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="CGST %">
                    <input
                      type="number"
                      step="0.1"
                      value={row.cgstRate}
                      onChange={(e) =>
                        updateItemRow(
                          index,
                          'cgstRate',
                          e.target.value
                        )
                      }
                    />
                  </FormField>

                  <FormField label="SGST %">
                    <input
                      type="number"
                      step="0.1"
                      value={row.sgstRate}
                      onChange={(e) =>
                        updateItemRow(
                          index,
                          'sgstRate',
                          e.target.value
                        )
                      }
                    />
                  </FormField>

                  <FormField label="IGST %">
                    <input
                      type="number"
                      step="0.1"
                      value={row.igstRate}
                      onChange={(e) =>
                        updateItemRow(
                          index,
                          'igstRate',
                          e.target.value
                        )
                      }
                    />
                  </FormField>

                  <FormField label="Line Total">
                    <input value={money(line.total)} disabled style={{ fontWeight: 'bold', background: '#f3f4f6' }} />
                  </FormField>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    padding: '8px',
                    background: '#f9fafb',
                    borderRadius: 6,
                  }}
                >
                  Taxable: {money(line.taxableAmount)}
                  {' | '}
                  GST: {money(line.gstAmount)}
                  {' | '}
                  Total: {money(line.total)}
                </div>
              </div>
            );
          })}

          {form.items.length > 0 && (
            <div style={totalBox}>
              <div>Sub Total: {money(totals.subTotal)}</div>
              <div>CGST: {money(totals.cgstAmount)}</div>
              <div>SGST: {money(totals.sgstAmount)}</div>
              <div>IGST: {money(totals.igstAmount)}</div>
              <div>Total GST: {money(totals.gstAmount)}</div>
              <strong style={{ fontSize: 16 }}>Grand Total: {money(totals.grandTotal)}</strong>
            </div>
          )}

          <FormField label="Notes">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: e.target.value,
                })
              }
              placeholder="Additional notes..."
            />
          </FormField>
        </div>
      </Modal>

      {/* Receive Stock Modal */}
      <Modal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        title="Receive Purchase Order"
        confirmLabel="Receive Stock"
        onConfirm={handleReceive}
        width={700}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <FormField label="PO Number">
            <input value={selectedOrder?.poNumber || ''} disabled />
          </FormField>

          <FormField label="Delivery Invoice Number" required>
            <input
              value={receiveForm.deliveryInvoiceNo}
              onChange={(e) =>
                setReceiveForm({
                  ...receiveForm,
                  deliveryInvoiceNo: e.target.value,
                })
              }
              placeholder="Enter vendor delivery invoice number"
            />
          </FormField>

          <FormField label="Delivery / Receive Address">
            <textarea
              rows={5}
              value={receiveForm.deliveryAddress}
              onChange={(e) =>
                setReceiveForm({
                  ...receiveForm,
                  deliveryAddress: e.target.value,
                })
              }
            />
          </FormField>
        </div>
      </Modal>

      {/* Cancel PO Confirmation Modal */}
      <Modal
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        title="Cancel Purchase Order"
        confirmLabel="Yes, Cancel PO"
        onConfirm={handleCancelOrder}
        width={500}
        variant="danger"
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ marginBottom: 12, fontSize: 14 }}>
            Are you sure you want to cancel this purchase order?
          </p>
          <div style={{ 
            background: '#fef2f2', 
            padding: 12, 
            borderRadius: 8,
            borderLeft: '3px solid #ef4444'
          }}>
            <strong style={{ color: '#991b1b' }}>PO Number:</strong>{' '}
            <span style={{ color: '#7f1d1d' }}>{selectedOrder?.poNumber}</span>
          </div>
          <p style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
            This action cannot be undone. The purchase order will be marked as cancelled.
          </p>
        </div>
      </Modal>

      {/* View Order Modal */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Purchase Order Details"
        width={1000}
        footer={false}
      >
        {selectedOrder && (
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={infoGrid}>
              <Info label="PO Number" value={selectedOrder.poNumber} />
              <Info label="PO Date" value={formatDate(selectedOrder.createdAt)} />
              <Info
                label="Vendor"
                value={
                  selectedOrder.vendorName ||
                  selectedOrder.vendor?.name
                }
              />
              <Info label="Status" value={selectedOrder.status} />
              <Info label="Created By" value={selectedOrder.createdBy} />
              <Info label="Received By" value={selectedOrder.receivedBy} />
              <Info
                label="Invoice No"
                value={selectedOrder.deliveryInvoiceNo}
              />
              <Info
                label="Received Date"
                value={formatDate(selectedOrder.receivedAt)}
              />
              <Info
                label="Grand Total"
                value={money(selectedOrder.grandTotal)}
              />
            </div>

            <div style={addressBox}>
              <strong>Delivery / Receive Address</strong>

              <div
                style={{
                  whiteSpace: 'pre-line',
                  marginTop: 8,
                }}
              >
                {selectedOrder.deliveryAddress ||
                  buildClinicAddress(clinic) ||
                  '-'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => printPurchaseOrder(selectedOrder)}>
                Print / PDF
              </Button>
              {selectedOrder.status === 'draft' && (
                <Button 
                  variant="danger" 
                  onClick={() => {
                    setViewOpen(false);
                    openCancelConfirm(selectedOrder);
                  }}
                >
                  Cancel PO
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        {label}
      </div>

      <div style={{ fontWeight: 600 }}>{value || '-'}</div>
    </div>
  );
}

const tabWrap = {
  display: 'flex',
  gap: 10,
  borderBottom: '1px solid var(--border)',
};

const tabBtn = {
  border: 'none',
  background: 'transparent',
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 600,
  color: 'var(--text-muted)',
  borderBottom: '2px solid transparent',
};

const activeTabBtn = {
  color: 'var(--primary)',
  borderBottom: '2px solid var(--primary)',
};

const itemCard = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 12,
  display: 'grid',
  gap: 12,
};

const fourGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
  gap: 12,
};

const fiveGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5,minmax(0,1fr))',
  gap: 12,
};

const totalBox = {
  background: '#f9fafb',
  borderRadius: 10,
  padding: 14,
  display: 'grid',
  gap: 6,
  justifyContent: 'end',
  textAlign: 'right',
};

const infoGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
  gap: 14,
};

const addressBox = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: 14,
};