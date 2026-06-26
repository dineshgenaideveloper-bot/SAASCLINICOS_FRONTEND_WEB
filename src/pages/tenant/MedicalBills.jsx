import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { FormField } from '../../components/FormField';

import {
  medicalBillAPI,
  inventoryAPI,
  clinicAPI,
  patientAPI,
} from '../../services/api';

const emptyForm = {
  patient: '',
  patientName: '',
  patientPhone: '',
  visitId: '',
  prescriptionDate: '',
  paymentMode: 'cash',
  notes: '',
  placeOfSupply: '',
  items: [],
};

const emptyItem = {
  item: '',
  itemName: '',
  itemCode: '',
  prescribedQty: 1,
  quantity: 1,
  availableStock: 0,
  stockAvailable: true,
  billable: true,
  dosage: '',
  durationEnglish: '',
  durationTamil: '',
  morning: { beforeFood: false, afterFood: false },
  afternoon: { beforeFood: false, afterFood: false },
  evening: { beforeFood: false, afterFood: false },
  night: { beforeFood: false, afterFood: false },
  instructions: '',
  unitPrice: 0,
  discount: 0,
  cgstRate: 0,
  sgstRate: 0,
  igstRate: 0,
};

/* ─────────────────────────────────────────────
   TIMING HELPERS (ENGLISH & TAMIL)
───────────────────────────────────────────── */

const getEnglishTiming = (p) => {
  const lines = [];
  if (p.morning?.beforeFood) lines.push('Morning - Before food');
  if (p.morning?.afterFood) lines.push('Morning - After food');
  if (p.afternoon?.beforeFood) lines.push('Afternoon - Before food');
  if (p.afternoon?.afterFood) lines.push('Afternoon - After food');
  if (p.evening?.beforeFood) lines.push('Evening - Before food');
  if (p.evening?.afterFood) lines.push('Evening - After food');
  if (p.night?.beforeFood) lines.push('Night - Before food');
  if (p.night?.afterFood) lines.push('Night - After food');
  return lines.length ? lines.join(', ') : '—';
};

const getTamilTiming = (p) => {
  const lines = [];
  if (p.morning?.beforeFood) lines.push('காலை - சாப்பாட்டுக்கு முன்');
  if (p.morning?.afterFood) lines.push('காலை - சாப்பாட்டுக்கு பின்');
  if (p.afternoon?.beforeFood) lines.push('மதியம் - சாப்பாட்டுக்கு முன்');
  if (p.afternoon?.afterFood) lines.push('மதியம் - சாப்பாட்டுக்கு பின்');
  if (p.evening?.beforeFood) lines.push('மாலை - சாப்பாட்டுக்கு முன்');
  if (p.evening?.afterFood) lines.push('மாலை - சாப்பாட்டுக்கு பின்');
  if (p.night?.beforeFood) lines.push('இரவு - சாப்பாட்டுக்கு முன்');
  if (p.night?.afterFood) lines.push('இரவு - சாப்பாட்டுக்கு பின்');
  return lines.length ? lines.join(', ') : '—';
};

/* ─────────────────────────────────────────────
   PATIENT SEARCH COMPONENT
───────────────────────────────────────────── */

function PatientSearchSelect({ value, onChange, patients = [], loading = false, onSearch, placeholder = "Search patient by name, phone, or ID..." }) {
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
      if (debouncedSearch.length >= 2) setIsOpen(true);
    }
  }, [debouncedSearch, onSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedPatient = useMemo(() => {
    if (!value) return null;
    return patients.find(patient => String(patient._id) === String(value));
  }, [patients, value]);

  const handleSelectPatient = (patient) => {
    onChange(patient._id);
    setSearch('');
    setDebouncedSearch('');
    setIsOpen(false);
  };

  const clearSelection = () => {
    onChange('');
    setSearch('');
    setDebouncedSearch('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {!selectedPatient ? (
        <>
          <input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => search && search.length >= 2 && setIsOpen(true)}
            style={{ width: '100%', height: 40, border: '1px solid #d1d5db', borderRadius: 8, padding: '0 12px', outline: 'none' }}
          />
          {loading && (
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#6b7280' }}>
              Searching...
            </div>
          )}
          
          {isOpen && search && !loading && patients.length > 0 && (
            <div style={{ 
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, 
              background: 'white', border: '1px solid #d1d5db', borderRadius: 8, 
              maxHeight: 280, overflowY: 'auto', zIndex: 1000, 
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
            }}>
              {patients.map((patient) => (
                <div
                  key={patient._id}
                  onClick={() => handleSelectPatient(patient)}
                  style={{ 
                    padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                    background: String(value) === String(patient._id) ? '#eff6ff' : 'white'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {patient.name || 'Unnamed'}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#6b7280', flexWrap: 'wrap' }}>
                    {patient.patientId && <span>🆔 {patient.patientId}</span>}
                    {patient.phone && <span>📞 {patient.phone}</span>}
                    {patient.age && <span>🎂 Age: {patient.age}</span>}
                    {patient.gender && <span>⚥ {patient.gender}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 3 }}>
                    {patient.visitCount || 0} visits
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ 
          marginTop: 0, padding: '10px 12px', background: '#eff6ff', borderRadius: 8, 
          fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '1px solid #bfdbfe'
        }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              ✅ {selectedPatient.name}
            </div>
            <div style={{ fontSize: 11, color: '#4b5563', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {selectedPatient.patientId && <span>ID: {selectedPatient.patientId}</span>}
              {selectedPatient.phone && <span>📞 {selectedPatient.phone}</span>}
              {selectedPatient.age && <span>Age: {selectedPatient.age}</span>}
            </div>
          </div>
          <button 
            type="button" 
            onClick={clearSelection} 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: 18, fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ITEM SEARCH COMPONENT
───────────────────────────────────────────── */

function ItemSearchSelect({ value, onChange, items = [], loading = false, onSearch, placeholder = "Search medicine..." }) {
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
        style={{ width: '100%', height: 40, border: '1px solid #d1d5db', borderRadius: 8, padding: '0 12px', outline: 'none' }}
      />
      {loading && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#6b7280' }}>
          Searching...
        </div>
      )}
      
      {isOpen && search && !loading && items.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid #d1d5db', borderRadius: 8, maxHeight: 250, overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          {items.map((item) => (
            <div
              key={item._id}
              onClick={() => handleSelectItem(item)}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', background: String(value) === String(item._id) ? '#eff6ff' : 'white' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                {item.itemId} | Stock: {item.currentStock || 0} {item.unit || 'units'} | Price: ₹{item.sellingPrice || 0}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedItem && !search && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: '#eff6ff', borderRadius: 6, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><strong>{selectedItem.name}</strong> ({selectedItem.itemId}) - Stock: {selectedItem.currentStock || 0} - Price: ₹{selectedItem.sellingPrice || 0}</span>
          <button type="button" onClick={() => onChange('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: 16 }}>✕</button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MEAL TIMING COMPONENT
───────────────────────────────────────────── */

function MealTiming({ title, row, index, period, updateMealTiming }) {
  const tamilLabels = {
    morning: 'காலை',
    afternoon: 'மதியம்',
    evening: 'மாலை',
    night: 'இரவு'
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 10 }}>
        {title} / {tamilLabels[period]}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={!!row[period]?.beforeFood}
          onChange={(e) => updateMealTiming(index, period, 'beforeFood', e.target.checked)}
        />
        Before Food / சாப்பாட்டுக்கு முன்
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={!!row[period]?.afterFood}
          onChange={(e) => updateMealTiming(index, period, 'afterFood', e.target.checked)}
        />
        After Food / சாப்பாட்டுக்கு பின்
      </label>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PRINT HELPERS
───────────────────────────────────────────── */

const detectPrintTarget = () => {
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || window.innerWidth <= 600;
  return isMobile ? 'mobile' : 'a4';
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN');
};

const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN');
};

const openPrintWindow = (html) => {
  const win = window.open('', '_blank', 'width=1200,height=900');
  if (!win) { toast.error('Popup blocked – please allow popups and try again.'); return; }
  win.document.write(html);
  win.document.close();
};

const buildPrescriptionHTML = ({ bill, clinic, items_data }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Prescription - ${bill.billNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; background: #fff; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
        .clinic-name { font-size: 24px; font-weight: bold; }
        .rx-badge { font-size: 20px; font-weight: bold; margin-top: 10px; }
        .patient-info { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; background: #f9fafb; }
        .patient-info h3 { margin-top: 0; margin-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .info-row { display: flex; }
        .info-label { width: 120px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; vertical-align: top; }
        th { background-color: #f2f2f2; }
        .timing-en { color: #2563eb; font-size: 12px; }
        .timing-ta { color: #059669; font-size: 12px; margin-top: 4px; }
        .footer { margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
        .signature { margin-top: 40px; text-align: right; }
        .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 40px; text-align: right; display: inline-block; }
        .note-box { margin: 20px 0; padding: 10px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 5px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="clinic-name">${clinic?.name || 'Medical Clinic'}</div>
          <div>${clinic?.address?.street || ''} ${clinic?.address?.city || ''}</div>
          <div>Phone: ${clinic?.contact?.phone || ''}</div>
          <div class="rx-badge">Rx</div>
        </div>

        <div class="patient-info">
          <h3>Patient Information / நோயாளர் விவரங்கள்</h3>
          <div class="info-grid">
            <div class="info-row"><div class="info-label">Patient Name:</div><div>${bill.patientName || 'Walk-in Customer'}</div></div>
            <div class="info-row"><div class="info-label">Phone:</div><div>${bill.patientPhone || '—'}</div></div>
            <div class="info-row"><div class="info-label">Bill No:</div><div>${bill.billNumber || '—'}</div></div>
            <div class="info-row"><div class="info-label">Date:</div><div>${formatDateTime(bill.createdAt)}</div></div>
            <div class="info-row"><div class="info-label">Prescription Date:</div><div>${bill.prescriptionDate || '—'}</div></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:5%">#</th>
              <th style="width:25%">Medicine / மருந்து</th>
              <th style="width:10%">Dosage</th>
              <th style="width:8%">Qty</th>
              <th style="width:12%">Duration</th>
              <th style="width:25%">Timing / நேரம்</th>
              <th style="width:15%">Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${(items_data || bill.items || []).map((item, idx) => `
              <tr>
                <td style="text-align:center">${idx + 1}</td>
                <td>
                  <strong>${item.itemName || '—'}</strong><br/>
                  <small style="color:#666">${item.itemCode || ''}</small>
                </td>
                <td>${item.dosage || '—'}</td>
                <td style="text-align:center">${item.quantity || item.prescribedQty || '—'}</td>
                <td>
                  ${item.durationEnglish || '—'}<br/>
                  <small class="timing-ta">${item.durationTamil || '—'}</small>
                </td>
                <td>
                  <div class="timing-en">${item.timingEnglish || getEnglishTiming(item) || '—'}</div>
                  <div class="timing-ta">${item.timingTamil || getTamilTiming(item) || '—'}</div>
                </td>
                <td>${item.instructions || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="note-box">
          <strong>Note / குறிப்பு:</strong><br/>
          Take medicines as advised by the doctor.<br/>
          மருத்துவர் கூறியபடி மருந்துகளை எடுத்துக்கொள்ளவும்.
        </div>

        <div class="signature">
          <div class="signature-line"></div>
          <div>Doctor Signature / மருத்துவர் கையொப்பம்</div>
        </div>

        <div class="footer">
          <small>Generated on: ${new Date().toLocaleString()}</small>
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 1000); };
      </script>
    </body>
    </html>
  `;
};

const buildMedicalBillHTML = ({ bill, clinic }) => {
  const calculateItemTotal = (item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const discount = Number(item.discount) || 0;
    const gross = qty * price;
    const discountAmount = (gross * discount) / 100;
    const taxable = gross - discountAmount;
    const cgst = Number(item.cgstAmount) || (taxable * (Number(item.cgstRate) || 0) / 100);
    const sgst = Number(item.sgstAmount) || (taxable * (Number(item.sgstRate) || 0) / 100);
    const igst = Number(item.igstAmount) || (taxable * (Number(item.igstRate) || 0) / 100);
    return { gross, discountAmount, taxable, cgst, sgst, igst, total: taxable + cgst + sgst + igst };
  };

  const totals = (bill.items || []).reduce((acc, item) => {
    const line = calculateItemTotal(item);
    acc.subTotal += line.gross;
    acc.discount += line.discountAmount;
    acc.taxable += line.taxable;
    acc.cgst += line.cgst;
    acc.sgst += line.sgst;
    acc.igst += line.igst;
    acc.grandTotal += line.total;
    return acc;
  }, { subTotal: 0, discount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, grandTotal: 0 });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Medical Bill - ${bill.billNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; background: #fff; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
        .clinic-name { font-size: 24px; font-weight: bold; }
        .bill-title { font-size: 20px; font-weight: bold; margin: 20px 0; }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 20px; flex-wrap: wrap; }
        .info-box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; flex: 1; background: #f9fafb; }
        .info-box h4 { margin-top: 0; margin-bottom: 10px; }
        .info-row { display: flex; margin-bottom: 5px; }
        .info-label { width: 100px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .totals { text-align: right; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; }
        .totals-row { margin-bottom: 5px; }
        .grand-total { font-size: 18px; font-weight: bold; margin-top: 10px; color: #059669; }
        .footer { margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
        .signature { margin-top: 40px; text-align: right; }
        .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 40px; text-align: right; display: inline-block; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="clinic-name">${clinic?.name || 'Medical Clinic'}</div>
          <div>${clinic?.address?.street || ''} ${clinic?.address?.city || ''}</div>
          <div>Phone: ${clinic?.contact?.phone || ''}</div>
          <div class="bill-title">MEDICAL BILL / மருத்துவ பில்</div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h4>Patient Details / நோயாளர் விவரங்கள்</h4>
            <div class="info-row"><div class="info-label">Name:</div><div>${bill.patientName || 'Walk-in Customer'}</div></div>
            <div class="info-row"><div class="info-label">Phone:</div><div>${bill.patientPhone || '—'}</div></div>
            <div class="info-row"><div class="info-label">Payment:</div><div>${(bill.paymentMode || 'cash').toUpperCase()}</div></div>
          </div>
          <div class="info-box">
            <h4>Bill Details / பில் விவரங்கள்</h4>
            <div class="info-row"><div class="info-label">Bill No:</div><div>${bill.billNumber || '—'}</div></div>
            <div class="info-row"><div class="info-label">Date:</div><div>${formatDateTime(bill.createdAt)}</div></div>
            <div class="info-row"><div class="info-label">Place of Supply:</div><div>${bill.placeOfSupply || '—'}</div></div>
          </div>
        </div>

        <table>
          <thead>
            <tr><th>#</th><th>Item / பொருள்</th><th>Code</th><th>Qty</th><th>Price</th><th>Disc%</th><th>Taxable</th><th>GST</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${(bill.items || []).map((item, idx) => {
              const line = calculateItemTotal(item);
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.itemName || '—'}</td>
                  <td>${item.itemCode || '—'}</td>
                  <td style="text-align:center">${item.quantity || 0}</td>
                  <td style="text-align:right">₹${Number(item.unitPrice || 0).toFixed(2)}</td>
                  <td style="text-align:center">${Number(item.discount || 0)}%</td>
                  <td style="text-align:right">₹${line.taxable.toFixed(2)}</td>
                  <td style="text-align:right">₹${(line.cgst + line.sgst + line.igst).toFixed(2)}</td>
                  <td style="text-align:right"><strong>₹${line.total.toFixed(2)}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">Sub Total: ₹${totals.subTotal.toFixed(2)}</div>
          <div class="totals-row">Discount: ₹${totals.discount.toFixed(2)}</div>
          <div class="totals-row">Taxable Amount: ₹${totals.taxable.toFixed(2)}</div>
          <div class="totals-row">CGST: ₹${totals.cgst.toFixed(2)} | SGST: ₹${totals.sgst.toFixed(2)} | IGST: ₹${totals.igst.toFixed(2)}</div>
          <div class="grand-total">Grand Total: ₹${totals.grandTotal.toFixed(2)}</div>
        </div>

        <div class="signature">
          <div class="signature-line"></div>
          <div>Authorized Signature</div>
        </div>

        <div class="footer">
          <small>Thank you for visiting ${clinic?.name || 'Clinic'} / வந்தமைக்கு நன்றி</small>
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 1000); };
      </script>
    </body>
    </html>
  `;
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */

export default function MedicalBills() {
  const [bills, setBills] = useState([]);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [clinic, setClinic] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedVisits, setSelectedVisits] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize, search: searchQuery, sortBy, sortOrder };
      const res = await medicalBillAPI.getBills(params);
      setBills(res.data?.data || []);
      const pagination = res.data?.pagination;
      if (pagination) setTotal(pagination.total);
    } catch { toast.error('Failed to fetch bills'); } finally { setLoading(false); }
  };

  const fetchItems = useCallback(async (searchTerm = '') => {
    try {
      setItemsLoading(true);
      const res = await inventoryAPI.getItems({ page: 1, limit: 50, search: searchTerm.trim() });
      setItems(res.data?.data || []);
    } catch { toast.error('Failed to fetch items'); setItems([]); } finally { setItemsLoading(false); }
  }, []);

  const fetchPatients = useCallback(async (searchTerm = '') => {
    try {
      setPatientsLoading(true);
      const params = { page: 1, limit: 50 };
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      const res = await patientAPI.getPatients(params);
      setPatients(res.data?.data || []);
    } catch { toast.error('Failed to fetch patients'); setPatients([]); } finally { setPatientsLoading(false); }
  }, []);

  const fetchMasters = async () => {
    try {
      const [clinicRes] = await Promise.all([clinicAPI.getClinics()]);
      setClinic((clinicRes.data?.data || [])[0] || null);
    } catch { toast.error('Failed to fetch masters'); }
  };

  useEffect(() => { fetchBills(); }, [page, pageSize, searchQuery, sortBy, sortOrder]);
  useEffect(() => { fetchMasters(); fetchItems(''); fetchPatients(''); }, [fetchItems, fetchPatients]);

  const resetForm = () => {
    setForm({ ...emptyForm, items: [] });
    setSelectedPatient(null);
    setSelectedVisits([]);
  };

  const handlePatientSelect = async (patientId) => {
    if (!patientId) {
      setSelectedPatient(null);
      setSelectedVisits([]);
      setForm({ ...emptyForm, items: [], paymentMode: 'cash', placeOfSupply: '', patientName: '', patientPhone: '' });
      return;
    }
    try {
      const res = await patientAPI.getPatientById(patientId);
      const patient = res.data?.data;
      setSelectedPatient(patient || null);
      const visitsWithPrescriptions = patient?.visits?.filter(v => v.prescriptions?.length > 0) || [];
      setSelectedVisits(visitsWithPrescriptions);
      setForm({
        ...emptyForm,
        patient: patientId,
        patientName: patient?.name || '',
        patientPhone: patient?.phone || '',
        paymentMode: 'cash',
        placeOfSupply: 'Tamil Nadu',
        items: [],
      });
    } catch { toast.error('Failed to load patient'); }
  };

  const loadPrescriptionFromVisit = (visitId) => {
    if (!selectedPatient) return;
    const visit = selectedPatient.visits?.find((v) => String(v._id) === String(visitId));
    if (!visit) {
      toast.error('Visit not found');
      return;
    }
    if (!visit.prescriptions?.length) { 
      toast.error('No prescription found for this visit'); 
      return; 
    }

    const billItems = visit.prescriptions.map((p) => {
      const itemId = p.item?._id || p.item;
      const inventoryItem = items.find((x) => String(x._id) === String(itemId));
      const prescribedQty = Number(p.quantity || 1);
      const availableStock = Number(inventoryItem?.currentStock || 0);
      const stockAvailable = !!inventoryItem && availableStock >= prescribedQty;
      const gst = Number(inventoryItem?.tax || 0);
      const unitPrice = Number(inventoryItem?.sellingPrice || 0);

      return {
        item: itemId || '',
        itemName: p.itemName || inventoryItem?.name || 'Unknown Item',
        itemCode: p.itemId || inventoryItem?.itemId || '',
        prescribedQty: prescribedQty,
        quantity: prescribedQty,
        availableStock,
        stockAvailable: stockAvailable && unitPrice > 0,
        billable: !!inventoryItem && unitPrice > 0,
        dosage: p.dosage || '',
        durationEnglish: p.durationEnglish || `${p.durationDays || 1} days`,
        durationTamil: p.durationTamil || `${p.durationDays || 1} நாட்கள்`,
        timingEnglish: getEnglishTiming(p),
        timingTamil: getTamilTiming(p),
        morning: p.morning || { beforeFood: false, afterFood: false },
        afternoon: p.afternoon || { beforeFood: false, afterFood: false },
        evening: p.evening || { beforeFood: false, afterFood: false },
        night: p.night || { beforeFood: false, afterFood: false },
        instructions: p.instructions || '',
        unitPrice: unitPrice,
        discount: 0,
        cgstRate: gst / 2,
        sgstRate: gst / 2,
        igstRate: 0,
      };
    });

    setForm((prev) => ({
      ...prev,
      visitId,
      prescriptionDate: visit.visitDate ? new Date(visit.visitDate).toISOString().slice(0, 10) : '',
      items: billItems,
    }));
    
    const validItems = billItems.filter(i => i.billable);
    if (validItems.length === 0) {
      toast.error('No valid items with prices found! Please check medicine prices.');
    } else if (validItems.length < billItems.length) {
      toast.warning(`Loaded ${validItems.length} of ${billItems.length} items. Some items have price issues.`);
    } else {
      toast.success(`Loaded ${billItems.length} items from prescription. You can adjust quantities.`);
    }
  };

  const addItemRow = () => setForm((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }));
  const removeItemRow = (index) => setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const updateItemRow = (index, key, value) => {
    const nextItems = [...form.items];
    nextItems[index] = { ...nextItems[index], [key]: value };

    if (key === 'item') {
      const selected = items.find((x) => String(x._id) === String(value));
      const requestedQty = Number(nextItems[index].quantity || 1);
      const availableStock = Number(selected?.currentStock || 0);
      const stockAvailable = !!selected && availableStock >= requestedQty;
      const gst = Number(selected?.tax || 0);
      const unitPrice = Number(selected?.sellingPrice || 0);
      nextItems[index] = {
        ...nextItems[index],
        item: value,
        itemName: selected?.name || '',
        itemCode: selected?.itemId || '',
        prescribedQty: requestedQty,
        availableStock,
        stockAvailable: stockAvailable && unitPrice > 0,
        billable: !!selected && unitPrice > 0,
        unitPrice: unitPrice,
        discount: 0,
        cgstRate: gst / 2,
        sgstRate: gst / 2,
        igstRate: 0,
      };
    }

    if (key === 'quantity') {
      const selected = items.find((x) => String(x._id) === String(nextItems[index].item));
      const requestedQty = Number(value || 0);
      const availableStock = Number(selected?.currentStock || 0);
      const stockAvailable = !!selected && availableStock >= requestedQty;
      nextItems[index] = {
        ...nextItems[index],
        quantity: value,
        prescribedQty: requestedQty,
        availableStock,
        stockAvailable: stockAvailable,
      };
    }

    setForm((prev) => ({ ...prev, items: nextItems }));
  };

  const updateMealTiming = (index, period, field, checked) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((row, i) =>
        i === index
          ? { ...row, [period]: { ...(row[period] || {}), [field]: checked } }
          : row
      )
    }));
  };

  const calculateLine = (row) => {
    if (!row.billable || !row.item) return { gross: 0, discountAmount: 0, taxableAmount: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, gstAmount: 0, total: 0 };
    const quantity = Number(row.quantity) || 0;
    const unitPrice = Number(row.unitPrice) || 0;
    const discount = Number(row.discount) || 0;
    const gross = quantity * unitPrice;
    const discountAmount = (gross * discount) / 100;
    const taxableAmount = gross - discountAmount;
    const cgstRate = Number(row.cgstRate) || 0;
    const sgstRate = Number(row.sgstRate) || 0;
    const igstRate = Number(row.igstRate) || 0;
    const cgstAmount = (taxableAmount * cgstRate) / 100;
    const sgstAmount = (taxableAmount * sgstRate) / 100;
    const igstAmount = (taxableAmount * igstRate) / 100;
    const gstAmount = cgstAmount + sgstAmount + igstAmount;
    const total = taxableAmount + gstAmount;
    return { gross, discountAmount, taxableAmount, cgstAmount, sgstAmount, igstAmount, gstAmount, total };
  };

  const calculateTotals = () =>
    form.items.reduce(
      (acc, row) => {
        const line = calculateLine(row);
        acc.subTotal += line.gross;
        acc.discountAmount += line.discountAmount;
        acc.taxableAmount += line.taxableAmount;
        acc.cgstAmount += line.cgstAmount;
        acc.sgstAmount += line.sgstAmount;
        acc.igstAmount += line.igstAmount;
        acc.gstAmount += line.gstAmount;
        acc.grandTotal += line.total;
        return acc;
      },
      { subTotal: 0, discountAmount: 0, taxableAmount: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, gstAmount: 0, grandTotal: 0 }
    );

  const totals = calculateTotals();
  const hasStockIssues = useMemo(() => form.items.some(item => !item.stockAvailable && item.item), [form.items]);
  const hasItems = form.items.length > 0 && form.items.some(item => item.item && item.billable);

  const handlePreview = () => {
    if (!hasItems) { toast.error('Please add at least one valid item to the bill'); return; }
    if (hasStockIssues) { toast.error('Please fix stock issues before proceeding'); return; }
    setPreviewOpen(true);
  };

  const handleSubmit = async () => {
    if (!hasItems) { toast.error('Add at least one bill item'); return; }
    if (hasStockIssues) { toast.error('Please fix stock issues before creating bill'); return; }

    const payload = {
      ...form,
      patient: form.patient || null,
      visitId: form.visitId || null,
      isInterState: form.items.some((row) => Number(row.igstRate) > 0),
      items: form.items.map((row) => {
        const line = calculateLine(row);
        return {
          ...row,
          quantity: Number(row.quantity) || 0,
          prescribedQty: Number(row.prescribedQty || row.quantity || 0),
          availableStock: Number(row.availableStock || 0),
          stockAvailable: !!row.stockAvailable,
          billable: !!row.billable,
          unitPrice: row.billable ? Number(row.unitPrice) || 0 : 0,
          discount: row.billable ? Number(row.discount) || 0 : 0,
          dosage: row.dosage || '',
          durationEnglish: row.durationEnglish || '',
          durationTamil: row.durationTamil || '',
          timingEnglish: row.timingEnglish || getEnglishTiming(row),
          timingTamil: row.timingTamil || getTamilTiming(row),
          morning: row.morning || { beforeFood: false, afterFood: false },
          afternoon: row.afternoon || { beforeFood: false, afterFood: false },
          evening: row.evening || { beforeFood: false, afterFood: false },
          night: row.night || { beforeFood: false, afterFood: false },
          instructions: row.instructions || '',
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
      const response = await medicalBillAPI.createBill(payload);
      toast.success('Medical bill created successfully!');
      setPreviewOpen(false);
      setOpen(false);
      resetForm();
      setPage(1);
      fetchBills();
      fetchMasters();
      fetchItems('');
      fetchPatients('');
      
      if (response.data?.data) {
        const billHTML = buildMedicalBillHTML({ bill: response.data.data, clinic });
        openPrintWindow(billHTML);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create bill');
    }
  };

  const printBill = (bill) => {
    const billHTML = buildMedicalBillHTML({ bill, clinic });
    openPrintWindow(billHTML);
  };

  const printPrescription = (bill) => {
    const prescriptionHTML = buildPrescriptionHTML({ bill, clinic, items_data: bill.items });
    openPrintWindow(prescriptionHTML);
  };

  const getStatusColor = (status) => {
    if (status === 'paid') return 'green';
    if (status === 'pending') return 'orange';
    return 'red';
  };

  const tableRows = bills.map((bill) => ({
    id: bill._id,
    billNumber: bill.billNumber,
    patientName: bill.patientName || 'Walk-in Customer',
    patientPhone: bill.patientPhone || '—',
    items: bill.items?.length || 0,
    grandTotal: bill.grandTotal || 0,
    paymentMode: bill.paymentMode,
    status: bill.status,
    raw: bill,
  }));

  const columns = [
    { key: 'billNumber', label: 'Bill No', sortable: true, sortKey: 'billNumber' },
    { key: 'patientName', label: 'Patient/Customer', sortable: true, sortKey: 'patientName' },
    { key: 'patientPhone', label: 'Phone', sortable: true, sortKey: 'patientPhone' },
    { key: 'items', label: 'Items', sortable: false },
    { key: 'grandTotal', label: 'Total', sortable: true, sortKey: 'grandTotal', render: (v) => `₹${Number(v || 0).toFixed(2)}` },
    { key: 'paymentMode', label: 'Payment', sortable: true, sortKey: 'paymentMode', render: (v) => String(v || '').toUpperCase() },
    { key: 'status', label: 'Status', sortable: true, sortKey: 'status', render: (v) => <Badge color={getStatusColor(v)}>{String(v || '').toUpperCase()}</Badge> },
  ];

  return (
    <>
      <DataTable
        title="Medical Bills"
        subtitle="Create walk-in or patient prescription bills"
        columns={columns}
        rows={tableRows}
        loading={loading}
        addLabel="New Medical Bill"
        onAdd={() => { resetForm(); setOpen(true); }}
        actions={({ row }) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="secondary" onClick={() => printBill(row.raw)}>Print Bill</Button>
            <Button size="sm" variant="secondary" onClick={() => printPrescription(row.raw)}>Print Prescription</Button>
          </div>
        )}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(1); }}
        onSearchChange={(q) => { setSearchQuery(q); setPage(1); }}
        onSortChange={({ sortBy: newSortBy, sortOrder: newSortOrder }) => {
          setSortBy(newSortBy);
          setSortOrder(newSortOrder);
          setPage(1);
        }}
      />

      {/* Main Bill Modal */}
      <Modal
        open={open}
        onClose={() => { setOpen(false); resetForm(); }}
        title="New Medical Bill"
        confirmLabel="Preview Bill"
        onConfirm={handlePreview}
        width="90%"
        confirmDisabled={!hasItems || hasStockIssues}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Select Patient">
              <PatientSearchSelect
                value={form.patient}
                onChange={handlePatientSelect}
                patients={patients}
                loading={patientsLoading}
                onSearch={fetchPatients}
                placeholder="Search by name, phone, or patient ID..."
              />
            </FormField>
            <FormField label="Patient / Customer Name">
              <input 
                value={form.patientName} 
                onChange={(e) => setForm({ ...form, patientName: e.target.value })} 
                placeholder="Walk-in Customer" 
              />
            </FormField>
          </div>

          {selectedPatient && selectedVisits.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Load Prescription from Visit">
                <select value={form.visitId} onChange={(e) => loadPrescriptionFromVisit(e.target.value)}>
                  <option value="">Select a visit to load prescription</option>
                  {selectedVisits.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.tokenNumber} - {v.departmentName} - {v.visitDate ? new Date(v.visitDate).toLocaleDateString('en-IN') : ''} ({v.prescriptions?.length || 0} medicines)
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Prescription Date">
                <input type="date" value={form.prescriptionDate} onChange={(e) => setForm({ ...form, prescriptionDate: e.target.value })} />
              </FormField>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FormField label="Payment Mode">
              <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="credit">Credit</option>
              </select>
            </FormField>
            <FormField label="Place of Supply">
              <input value={form.placeOfSupply} onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value })} placeholder="Tamil Nadu" />
            </FormField>
            <FormField label="Phone">
              <input value={form.patientPhone} onChange={(e) => setForm({ ...form, patientPhone: e.target.value })} />
            </FormField>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>Bill Items ({form.items.filter(i => i.item).length})</strong>
            <Button size="sm" variant="secondary" onClick={addItemRow}>+ Add Item</Button>
          </div>

          {form.items.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', border: '1px dashed #d1d5db', borderRadius: 8 }}>
              No items added. Click "+ Add Item" to add medicines or select a prescription visit above.
            </div>
          )}

          {form.items.map((row, index) => {
            const line = calculateLine(row);
            return (
              <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, display: 'grid', gap: 12, opacity: row.billable ? 1 : 0.6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12 }}>
                  <FormField label="Medicine" required>
                    <ItemSearchSelect
                      value={row.item}
                      onChange={(itemId) => updateItemRow(index, 'item', itemId)}
                      items={items}
                      loading={itemsLoading}
                      onSearch={fetchItems}
                      placeholder="Search medicine by name, ID..."
                    />
                  </FormField>
                  <FormField label="Quantity" required>
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => updateItemRow(index, 'quantity', e.target.value)}
                      style={{ borderColor: !row.stockAvailable && row.item ? '#dc2626' : '#d1d5db' }}
                      disabled={!row.billable}
                    />
                  </FormField>
                  <div style={{ display: 'flex', alignItems: 'end' }}>
                    <Button size="sm" variant="danger" onClick={() => removeItemRow(index)}>Remove</Button>
                  </div>
                </div>

                {row.item && (
                  <div style={{ 
                    fontSize: 12, 
                    color: row.stockAvailable && row.billable ? '#059669' : '#dc2626',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: row.stockAvailable && row.billable ? '#ecfdf5' : '#fef2f2',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8
                  }}>
                    <span>Available Stock: {row.availableStock} {row.stockAvailable && row.billable ? '✓' : '⚠️'}</span>
                    {!row.stockAvailable && <span style={{ fontWeight: 'bold' }}>Insufficient Stock!</span>}
                  </div>
                )}

                {row.billable && row.item && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                      <FormField label="Dosage">
                        <input value={row.dosage} onChange={(e) => updateItemRow(index, 'dosage', e.target.value)} placeholder="e.g., 1 tablet" />
                      </FormField>
                      <FormField label="Duration (EN)">
                        <input value={row.durationEnglish} onChange={(e) => updateItemRow(index, 'durationEnglish', e.target.value)} placeholder="e.g., 5 days" />
                      </FormField>
                      <FormField label="Duration (TA)">
                        <input value={row.durationTamil} onChange={(e) => updateItemRow(index, 'durationTamil', e.target.value)} placeholder="e.g., 5 நாட்கள்" />
                      </FormField>
                      <FormField label="Unit Price (₹)">
                        <input type="number" value={row.unitPrice} onChange={(e) => updateItemRow(index, 'unitPrice', e.target.value)} />
                      </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                      <MealTiming
                        title="Morning"
                        row={row}
                        index={index}
                        period="morning"
                        updateMealTiming={updateMealTiming}
                      />
                      <MealTiming
                        title="Afternoon"
                        row={row}
                        index={index}
                        period="afternoon"
                        updateMealTiming={updateMealTiming}
                      />
                      <MealTiming
                        title="Evening"
                        row={row}
                        index={index}
                        period="evening"
                        updateMealTiming={updateMealTiming}
                      />
                      <MealTiming
                        title="Night"
                        row={row}
                        index={index}
                        period="night"
                        updateMealTiming={updateMealTiming}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                      <FormField label="Instructions">
                        <input value={row.instructions} onChange={(e) => updateItemRow(index, 'instructions', e.target.value)} placeholder="Special instructions" />
                      </FormField>
                      <FormField label="Discount %">
                        <input type="number" value={row.discount} onChange={(e) => updateItemRow(index, 'discount', e.target.value)} />
                      </FormField>
                      <FormField label="CGST %">
                        <input type="number" value={row.cgstRate} onChange={(e) => updateItemRow(index, 'cgstRate', e.target.value)} />
                      </FormField>
                      <FormField label="Line Total (₹)">
                        <input value={`₹${line.total.toFixed(2)}`} disabled style={{ fontWeight: 'bold', background: '#f3f4f6' }} />
                      </FormField>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {hasItems && totals.grandTotal > 0 && (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: 14, display: 'grid', gap: 6, justifyContent: 'end', textAlign: 'right' }}>
              <div>Sub Total: ₹{totals.subTotal.toFixed(2)}</div>
              <div>Discount: ₹{totals.discountAmount.toFixed(2)}</div>
              <div>Taxable: ₹{totals.taxableAmount.toFixed(2)}</div>
              <div>CGST: ₹{totals.cgstAmount.toFixed(2)} | SGST: ₹{totals.sgstAmount.toFixed(2)} | IGST: ₹{totals.igstAmount.toFixed(2)}</div>
              <strong style={{ fontSize: 16 }}>Grand Total: ₹{totals.grandTotal.toFixed(2)}</strong>
            </div>
          )}

          <FormField label="Notes">
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
          </FormField>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Bill Preview - Please Verify"
        confirmLabel="Confirm & Create Bill"
        onConfirm={handleSubmit}
        width="90%"
        cancelLabel="Back to Edit"
      >
        <div style={{ padding: '20px', background: '#f9fafb', borderRadius: 10 }}>
          <div style={{ marginBottom: 20, padding: 16, background: 'white', borderRadius: 10, border: '1px solid #e5e7eb' }}>
            <h3 style={{ marginBottom: 12 }}>Bill Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <div><strong>Patient:</strong> {form.patientName || 'Walk-in Customer'}</div>
              <div><strong>Phone:</strong> {form.patientPhone || '—'}</div>
              <div><strong>Payment:</strong> {form.paymentMode?.toUpperCase()}</div>
              <div><strong>Place of Supply:</strong> {form.placeOfSupply || '—'}</div>
              <div><strong>Total Items:</strong> {form.items.filter(i => i.item).length}</div>
              <div><strong>Grand Total:</strong> ₹{totals.grandTotal.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'auto', maxHeight: 400 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f3f4f6', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: 12, textAlign: 'left' }}>#</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Medicine</th>
                  <th style={{ padding: 12, textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: 12, textAlign: 'right' }}>Price (₹)</th>
                  <th style={{ padding: 12, textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {form.items.filter(i => i.item).map((item, idx) => {
                  const line = calculateLine(item);
                  return (
                    <tr key={idx}>
                      <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>{idx + 1}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>
                        <strong>{item.itemName || '—'}</strong>
                        {item.dosage && <div style={{ fontSize: 11, color: '#6b7280' }}>{item.dosage}</div>}
                        {item.durationEnglish && <div style={{ fontSize: 11, color: '#6b7280' }}>Duration: {item.durationEnglish} / {item.durationTamil}</div>}
                        {item.timingTamil && <div style={{ fontSize: 11, color: '#059669' }}>⏰ {item.timingTamil}</div>}
                      </td>
                      <td style={{ padding: 10, textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>{item.quantity}</td>
                      <td style={{ padding: 10, textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>{Number(item.unitPrice).toFixed(2)}</td>
                      <td style={{ padding: 10, textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold' }}>{line.total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot style={{ background: '#f9fafb' }}>
                <tr style={{ background: '#f3f4f6' }}>
                  <td colSpan="4" style={{ padding: 12, textAlign: 'right', fontSize: 16, fontWeight: 'bold' }}>Grand Total:</td>
                  <td style={{ padding: 12, textAlign: 'right', fontSize: 18, fontWeight: 'bold', color: '#059669' }}>₹{totals.grandTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {form.notes && (
            <div style={{ marginTop: 16, padding: 12, background: 'white', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <strong>Notes:</strong> {form.notes}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}