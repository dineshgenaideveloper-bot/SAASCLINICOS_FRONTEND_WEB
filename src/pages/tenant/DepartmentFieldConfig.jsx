// src/pages/Admin/DepartmentFieldConfig.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { departmentFieldConfigAPI } from '../../services/api';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { FormField } from '../../components/FormField';
import DataTable from '../../components/DataTable';
import toast from 'react-hot-toast';

const emptyFieldForm = {
  key: '',
  label: '',
  type: 'text',
  options: [],
  placeholder: '',
  required: false,
  order: 0,
};

const fieldTypeOptions = [
  { label: '📝 Text', value: 'text' },
  { label: '📄 Textarea', value: 'textarea' },
  { label: '📋 Select Dropdown', value: 'select' },
  { label: '🔢 Number', value: 'number' },
  { label: '📅 Date', value: 'date' },
  { label: '✅ Checkbox', value: 'checkbox' },
];

export default function DepartmentFieldConfig() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [form, setForm] = useState(emptyFieldForm);
  const [newOption, setNewOption] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('order');
  const [sortOrder, setSortOrder] = useState('asc');

  const departmentList = useMemo(() => [
    'Homeopathy', 'General Medicine', 'Cardiology', 'Neurology', 
    'Orthopedics', 'Pediatrics', 'Obstetrics & Gynecology', 
    'Ophthalmology', 'ENT', 'Dermatology', 'Psychiatry', 
    'Gastroenterology', 'Urology', 'Oncology', 'Pulmonology', 
    'Endocrinology', 'Nephrology', 'Rheumatology', 'Veterinary'
  ], []);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await departmentFieldConfigAPI.getAllConfigs();
      const configs = response.data?.data || [];
      
      // Track which departments have configurations
      const configuredDepts = configs.reduce((acc, config) => {
        acc[config.departmentName] = config.fields || [];
        return acc;
      }, {});
      
      setDepartments(configuredDepts);
    } catch (error) {
      console.error('Error loading configs:', error);
    }
  };

  const loadDepartmentConfig = async (department) => {
    try {
      setLoading(true);
      setSelectedDepartment(department);
      const response = await departmentFieldConfigAPI.getConfigByDepartment(department);
      const config = response.data?.data;
      const fieldsList = config?.fields || [];
      
      // Sort fields by order
      fieldsList.sort((a, b) => (a.order || 0) - (b.order || 0));
      setFields(fieldsList);
    } catch (error) {
      console.error('Error loading department config:', error);
      setFields([]);
      toast.error('Failed to load department fields');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyFieldForm);
    setEditingField(null);
    setNewOption('');
  };

  const handleAddField = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setForm({
      key: field.key,
      label: field.label,
      type: field.type,
      options: field.options || [],
      placeholder: field.placeholder || '',
      required: field.required || false,
      order: field.order || 0,
    });
    setModalOpen(true);
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setForm({
        ...form,
        options: [...(form.options || []), newOption.trim()]
      });
      setNewOption('');
    }
  };

  const handleRemoveOption = (optionToRemove) => {
    setForm({
      ...form,
      options: (form.options || []).filter(opt => opt !== optionToRemove)
    });
  };

  const handleSubmit = async () => {
    if (!form.key || !form.label) {
      toast.error('Field key and label are required');
      return;
    }

    // Validate key format
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(form.key)) {
      toast.error('Field key must start with a letter and contain only letters, numbers, and underscores');
      return;
    }

    let updatedFields = [...fields];
    
    if (editingField) {
      // Update existing field
      const index = updatedFields.findIndex(f => f.key === editingField.key);
      if (index !== -1) {
        updatedFields[index] = {
          ...form,
          _id: editingField._id,
          order: editingField.order,
        };
      }
    } else {
      // Add new field
      const newOrder = fields.length;
      updatedFields.push({
        ...form,
        order: newOrder,
      });
    }

    await saveConfig(updatedFields);
    setModalOpen(false);
    resetForm();
  };

  const handleDeleteField = async (fieldKey) => {
    if (!window.confirm(`Are you sure you want to delete field "${fieldKey}"?`)) {
      return;
    }

    try {
      await departmentFieldConfigAPI.deleteField(selectedDepartment, fieldKey);
      toast.success('Field deleted successfully');
      loadDepartmentConfig(selectedDepartment);
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error('Failed to delete field');
    }
  };

  const saveConfig = async (updatedFields) => {
    try {
      setLoading(true);
      await departmentFieldConfigAPI.upsertConfig(selectedDepartment, {
        fields: updatedFields.map((f, idx) => ({ ...f, order: idx })),
        layout: 'two-column',
      });
      toast.success('Configuration saved successfully');
      loadDepartmentConfig(selectedDepartment);
      loadConfigs();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const moveField = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const updatedFields = [...fields];
    [updatedFields[index], updatedFields[newIndex]] = [updatedFields[newIndex], updatedFields[index]];
    
    await saveConfig(updatedFields);
  };

  const getFieldTypeBadge = (type) => {
    const colors = {
      text: 'blue',
      textarea: 'purple',
      select: 'orange',
      number: 'green',
      date: 'teal',
      checkbox: 'pink',
    };
    const labels = {
      text: 'Text',
      textarea: 'Textarea',
      select: 'Select',
      number: 'Number',
      date: 'Date',
      checkbox: 'Checkbox',
    };
    return <Badge color={colors[type] || 'gray'} size="sm">{labels[type] || type}</Badge>;
  };

  const tableRows = fields.map((field, index) => ({
    id: field._id || field.key,
    order: index + 1,
    key: field.key,
    label: field.label,
    type: field.type,
    options: field.options,
    placeholder: field.placeholder,
    required: field.required,
    raw: field,
  }));

  const columns = [
    {
      key: 'order',
      label: '#',
      sortKey: 'order',
      width: '60px',
      render: (value, row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <span>{value}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button
              onClick={() => moveField(row.order - 1, 'up')}
              disabled={row.order === 1}
              style={{
                background: 'none',
                border: 'none',
                cursor: row.order === 1 ? 'not-allowed' : 'pointer',
                opacity: row.order === 1 ? 0.3 : 1,
                fontSize: 10,
                padding: 0,
              }}
            >
              ▲
            </button>
            <button
              onClick={() => moveField(row.order - 1, 'down')}
              disabled={row.order === fields.length}
              style={{
                background: 'none',
                border: 'none',
                cursor: row.order === fields.length ? 'not-allowed' : 'pointer',
                opacity: row.order === fields.length ? 0.3 : 1,
                fontSize: 10,
                padding: 0,
              }}
            >
              ▼
            </button>
          </div>
        </div>
      ),
    },
    {
      key: 'label',
      label: 'Field Label',
      sortKey: 'label',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{value}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            Key: {row.key}
            {row.placeholder && ` • Placeholder: ${row.placeholder}`}
          </div>
          {row.type === 'select' && row.options?.length > 0 && (
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
              Options: {row.options.join(', ')}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortKey: 'type',
      width: '120px',
      render: (value) => getFieldTypeBadge(value),
    },
    {
      key: 'required',
      label: 'Required',
      width: '80px',
      render: (value) => value ? <Badge color="red" size="sm">Required</Badge> : <Badge color="gray" size="sm">Optional</Badge>,
    },
  ];

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
  }, []);

  const handleSortChange = useCallback(({ sortBy, sortOrder }) => {
    setSortBy(sortBy);
    setSortOrder(sortOrder);
  }, []);

  // Filter and sort fields for display
  const filteredFields = useMemo(() => {
    let filtered = [...fields];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(field => 
        field.label.toLowerCase().includes(searchLower) ||
        field.key.toLowerCase().includes(searchLower)
      );
    }
    
    if (sortBy === 'label') {
      filtered.sort((a, b) => {
        const comparison = a.label.localeCompare(b.label);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (sortBy === 'type') {
      filtered.sort((a, b) => {
        const comparison = a.type.localeCompare(b.type);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else {
      filtered.sort((a, b) => {
        const comparison = (a.order || 0) - (b.order || 0);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [fields, search, sortBy, sortOrder]);

  return (
    <>
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>🏥 Department Field Configuration</h1>
          <p style={{ color: '#666', marginTop: 8 }}>
            Configure which fields appear in the patient enquiry form for each department.
            Drag or use arrows to reorder fields.
          </p>
        </div>

        {/* Department Selection Buttons */}
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Select Department</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {departmentList.map(dept => (
              <Button
                key={dept}
                variant={selectedDepartment === dept ? 'primary' : 'secondary'}
                onClick={() => loadDepartmentConfig(dept)}
              >
                {dept}
                {departments[dept] && (
                  <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.8 }}>
                    ({departments[dept].length})
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Fields Table */}
        {selectedDepartment && (
          <DataTable
            title={`${selectedDepartment} - Clinical Fields`}
            subtitle={`Configured fields for ${selectedDepartment} department. Add, edit, or reorder fields as needed.`}
            columns={columns}
            rows={filteredFields.map((field, idx) => ({
              id: field._id || field.key,
              order: idx + 1,
              key: field.key,
              label: field.label,
              type: field.type,
              options: field.options,
              placeholder: field.placeholder,
              required: field.required,
              raw: field,
            }))}
            total={filteredFields.length}
            page={1}
            pageSize={100}
            loading={loading}
            addLabel="+ Add Field"
            onAdd={handleAddField}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
            actions={({ row }) => (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditField(row.raw)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteField(row.key)}
                >
                  Delete
                </Button>
              </div>
            )}
          />
        )}
      </div>

      {/* Add/Edit Field Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingField ? 'Edit Field' : 'Add New Field'}
        onConfirm={handleSubmit}
        width="600px"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Field Key" required>
              <input
                type="text"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                placeholder="e.g., blood_pressure"
                disabled={!!editingField}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </FormField>

            <FormField label="Field Label" required>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g., Blood Pressure (mmHg)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Field Type">
              <select
                value={form.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setForm({ 
                    ...form, 
                    type: newType,
                    options: newType === 'select' ? form.options || [] : []
                  });
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                {fieldTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Placeholder">
              <input
                type="text"
                value={form.placeholder}
                onChange={(e) => setForm({ ...form, placeholder: e.target.value })}
                placeholder="Optional placeholder text"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </FormField>
          </div>

          {form.type === 'select' && (
            <FormField label="Options">
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                    placeholder="Enter option and press Enter"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 8,
                      fontSize: 14,
                    }}
                  />
                  <Button variant="secondary" onClick={handleAddOption} size="sm">
                    Add
                  </Button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(form.options || []).map((opt, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#f3f4f6',
                        padding: '4px 8px 4px 12px',
                        borderRadius: 20,
                        fontSize: 13,
                      }}
                    >
                      {opt}
                      <button
                        onClick={() => handleRemoveOption(opt)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 16,
                          color: '#666',
                          padding: '0 4px',
                        }}
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {(!form.options || form.options.length === 0) && (
                  <small style={{ color: '#999', fontSize: 12, display: 'block', marginTop: 8 }}>
                    No options added yet. Add options above.
                  </small>
                )}
              </div>
            </FormField>
          )}

          <FormField label="Required">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.required}
                onChange={(e) => setForm({ ...form, required: e.target.checked })}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span>Make this field required</span>
            </label>
          </FormField>

          {editingField && (
            <div style={{ fontSize: 12, color: '#666', padding: 8, background: '#f9fafb', borderRadius: 8 }}>
              <strong>Note:</strong> Field key cannot be changed after creation.
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}