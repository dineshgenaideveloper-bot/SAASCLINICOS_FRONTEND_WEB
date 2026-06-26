import React, { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import { FormField } from '../../components/FormField';

const initialForm = {
  quantity: 0,
  transactionType: 'purchase',
  unitPrice: 0,
  notes: ''
};

export default function StockModal({ open, onClose, item, onConfirm }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (open) {
      setForm({
        quantity: 0,
        transactionType: 'purchase',
        unitPrice: item?.sellingPrice || 0,
        notes: ''
      });
    }
  }, [open, item]);

  const transactionTypes = [
    { label: 'Purchase (Add Stock)', value: 'purchase' },
    { label: 'Sale (Remove Stock)', value: 'sale' },
    { label: 'Return (Add Stock)', value: 'return' },
    { label: 'Damage (Remove Stock)', value: 'damage' },
    { label: 'Expiry (Remove Stock)', value: 'expiry' },
    { label: 'Adjustment (Set Stock)', value: 'adjustment' }
  ];

  const handleSubmit = () => {
    const quantity = Number(form.quantity) || 0;

    if (quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    onConfirm({
      ...form,
      quantity,
      unitPrice: Number(form.unitPrice) || 0
    });

    setForm(initialForm);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Update Stock - ${item?.name || ''}`}
      onConfirm={handleSubmit}
      width="40%"
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 8 }}>
          <div>
            Current Stock:{' '}
            <strong>{item?.currentStock || 0}</strong> {item?.unit}
          </div>
          <div>
            Reorder Level: <strong>{item?.reorderLevel || 0}</strong>
          </div>
        </div>

        <FormField label="Transaction Type" required>
          <select
            value={form.transactionType}
            onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
          >
            {transactionTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label={
            form.transactionType === 'adjustment'
              ? 'New Stock Quantity'
              : 'Quantity'
          }
          required
        >
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
        </FormField>

        <FormField label="Unit Price">
          <input
            type="number"
            min="0"
            value={form.unitPrice}
            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
          />
        </FormField>

        <FormField label="Notes">
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </FormField>
      </div>
    </Modal>
  );
}