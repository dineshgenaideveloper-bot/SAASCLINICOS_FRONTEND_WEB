import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Button from '../../components/Button';
import { FormField } from '../../components/FormField';
import { patientAPI, departmentFieldConfigAPI } from '../../services/api';

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

const emptyForm = {
  name: '',
  phone: '',
  age: '',
  gender: '',
  address: '',
  habits: {
    smoking: '',
    alcohol: '',
    tobacco: '',
    foodType: '',
    sleep: '',
    exercise: '',
    allergies: '',
  },
  generalEnquiry: {
    chiefComplaint: '',
    duration: '',
    history: '',
    currentMedication: '',
    pastHistory: '',
    familyHistory: '',
    notes: '',
  },
  departmentForm: {},
};

function DeptField({ field, value, onChange }) {
  const commonStyle = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  if (field.type === 'textarea') {
    return (
      <textarea
        rows={field.rows || 2}
        value={value || ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder || ''}
        style={commonStyle}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        style={commonStyle}
      >
        <option value="">Select {field.label}...</option>
        {(field.options || []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder || ''}
        min={field.validation?.min}
        max={field.validation?.max}
        style={commonStyle}
      />
    );
  }

  if (field.type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={value || false}
        onChange={(e) => onChange(field.key, e.target.checked)}
        style={{ width: '20px', height: '20px' }}
      />
    );
  }

  if (field.type === 'date') {
    return (
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        style={commonStyle}
      />
    );
  }

  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder || ''}
      style={commonStyle}
    />
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function PatientsDashboard() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(location.state?.patient || null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [dynamicFields, setDynamicFields] = useState({});

  // Get flags from navigation state
  const isNewPatient = location.state?.isNew || false;
  const prePopulatedData = location.state?.prePopulatedData || null;

  const activeVisit = useMemo(() => {
    if (!patient?.visits?.length) return null;
    // Return the most recent visit
    return patient.visits[patient.visits.length - 1];
  }, [patient]);

  const activeDepartment = useMemo(() => {
    return activeVisit?.departmentName ||
      location.state?.token?.departmentName ||
      'General Medicine';
  }, [activeVisit, location.state?.token]);

  // Load dynamic field configuration for the active department
  useEffect(() => {
    const loadDynamicFields = async () => {
      if (!activeDepartment) return;
      
      try {
        setFieldsLoading(true);
        const response = await departmentFieldConfigAPI.getConfigByDepartment(activeDepartment);
        
        if (response.data?.success && response.data?.data?.fields?.length > 0) {
          setDynamicFields(prev => ({
            ...prev,
            [activeDepartment]: response.data.data.fields
          }));
        } else {
          // No fields configured - show empty array
          setDynamicFields(prev => ({
            ...prev,
            [activeDepartment]: []
          }));
        }
      } catch (error) {
        console.error('Error loading dynamic fields:', error);
        setDynamicFields(prev => ({
          ...prev,
          [activeDepartment]: []
        }));
      } finally {
        setFieldsLoading(false);
      }
    };

    loadDynamicFields();
  }, [activeDepartment]);

  const activeFields = useMemo(() => {
    return dynamicFields[activeDepartment] || [];
  }, [dynamicFields, activeDepartment]);

  const loadPatient = async () => {
    try {
      if (!id) return;
      const res = await patientAPI.getPatientById(id);
      setPatient(res.data?.data || null);
    } catch (error) {
      console.error('Error loading patient:', error);
      toast.error('Failed to load patient');
    }
  };

  useEffect(() => {
    if (!location.state?.patient) {
      loadPatient();
    }
  }, [id, location.state?.patient]);

  // Populate form data from patient/visit
  useEffect(() => {
    if (patient && activeVisit) {
      // Habits data (common across visits)
      const habitsData = (isNewPatient && prePopulatedData?.habits) 
        ? prePopulatedData.habits 
        : (activeVisit.habits || emptyForm.habits);
      
      // General Enquiry data (common across visits - this is the important one)
      const generalEnquiryData = (isNewPatient && prePopulatedData?.generalEnquiry)
        ? prePopulatedData.generalEnquiry
        : (activeVisit.generalEnquiry || {
            chiefComplaint: '',
            duration: '',
            history: '',
            currentMedication: '',
            pastHistory: '',
            familyHistory: '',
            notes: location.state?.token?.notes || '',
          });
          
      // Department-specific form data
      const departmentFormData = (isNewPatient && prePopulatedData?.departmentForm)
        ? prePopulatedData.departmentForm
        : (activeVisit.departmentForm || {});

      setForm({
        ...emptyForm,
        name: patient.name || '',
        phone: patient.phone || '',
        age: patient.age || '',
        gender: patient.gender || '',
        address: patient.address || '',
        habits: habitsData,
        generalEnquiry: generalEnquiryData,
        departmentForm: departmentFormData,
      });
    } else if (location.state?.token && isNewPatient && !patient) {
      // Brand new patient from token
      setForm({
        ...emptyForm,
        name: location.state.token.patientName || '',
        phone: location.state.token.patientPhone || '',
        generalEnquiry: {
          ...emptyForm.generalEnquiry,
          notes: location.state.token.notes || '',
        },
      });
    }
  }, [patient, activeVisit, isNewPatient, prePopulatedData, location.state?.token]);

  const updateRoot = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNested = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      if (!patient?._id || !activeVisit?._id) {
        toast.error('Patient visit not found');
        return;
      }

      setLoading(true);

      // Save all data including general enquiry
      await patientAPI.updatePatientVisit(patient._id, activeVisit._id, {
        name: form.name,
        phone: form.phone,
        age: form.age,
        gender: form.gender,
        address: form.address,
        habits: form.habits,
        generalEnquiry: form.generalEnquiry,  // This saves the general enquiry for this visit
        departmentForm: form.departmentForm,
      });

      toast.success('Patient enquiry saved successfully');
      navigate('/patients');
    } catch (error) {
      console.error('Error saving enquiry:', error);
      toast.error(error.response?.data?.message || 'Failed to save enquiry');
    } finally {
      setLoading(false);
    }
  };

  const renderDeptFields = () => {
    if (fieldsLoading) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p>Loading department fields...</p>
        </div>
      );
    }

    if (!activeFields || activeFields.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          <p>No fields configured for {activeDepartment} department.</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>
            Please configure fields in the Department Field Configuration page.
          </p>
        </div>
      );
    }

    return activeFields.map((field) => (
      <div
        key={field.key}
        style={field.type === 'textarea' || field.type === 'checkbox' ? { gridColumn: '1 / -1' } : {}}
      >
        <FormField 
          label={field.label} 
          required={field.required}
        >
          <DeptField
            field={field}
            value={form.departmentForm?.[field.key] || ''}
            onChange={(key, val) => updateNested('departmentForm', key, val)}
          />
        </FormField>
      </div>
    ));
  };

  const card = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 20,
  };

  const grid3 = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  };

  const grid2 = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={card}>
        <h2 style={{ margin: 0 }}>Patient Enquiry Form</h2>
        <div style={{ marginTop: 8, color: '#6b7280' }}>
          Token: <strong>{activeVisit?.tokenNumber || location.state?.token?.tokenNumber || '—'}</strong> | 
          Department: <strong>{activeDepartment}</strong>
          {isNewPatient && (
            <span style={{ marginLeft: 12, color: '#10b981', fontWeight: 600 }}>
              • New Visit for Existing Patient
            </span>
          )}
          {!patient && !activeVisit && (
            <span style={{ marginLeft: 12, color: '#f59e0b', fontWeight: 600 }}>
              • New Patient
            </span>
          )}
          {!fieldsLoading && activeFields?.length > 0 && (
            <span style={{ marginLeft: 12, color: '#3b82f6', fontSize: 12 }}>
              • {activeFields.length} field(s) configured
            </span>
          )}
        </div>
      </div>

      {/* Patient Details Section */}
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Patient Details</h3>
        <div style={grid3}>
          <FormField label="Patient Name" required>
            <input
              value={form.name}
              onChange={(e) => updateRoot('name', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </FormField>

          <FormField label="Phone">
            <input
              value={form.phone}
              onChange={(e) => updateRoot('phone', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </FormField>

          <FormField label="Age">
            <input
              value={form.age}
              onChange={(e) => updateRoot('age', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </FormField>

          <FormField label="Gender">
            <select
              value={form.gender}
              onChange={(e) => updateRoot('gender', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </FormField>

          <div style={{ gridColumn: 'span 2' }}>
            <FormField label="Address">
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => updateRoot('address', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: 'inherit',
                }}
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* Habits Section - Common for all visits */}
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Habits / Lifestyle</h3>
        <div style={grid3}>
          <FormField label="Smoking">
            <input
              value={form.habits?.smoking || ''}
              onChange={(e) => updateNested('habits', 'smoking', e.target.value)}
              placeholder="e.g., None, Occasional, Daily"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </FormField>

          <FormField label="Alcohol">
            <input
              value={form.habits?.alcohol || ''}
              onChange={(e) => updateNested('habits', 'alcohol', e.target.value)}
              placeholder="e.g., None, Social, Regular"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </FormField>

          <FormField label="Tobacco">
            <input
              value={form.habits?.tobacco || ''}
              onChange={(e) => updateNested('habits', 'tobacco', e.target.value)}
              placeholder="e.g., None, Chewing, Smoking"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </FormField>

          <FormField label="Food Type">
            <select
              value={form.habits?.foodType || ''}
              onChange={(e) => updateNested('habits', 'foodType', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              <option value="">Select</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Eggetarian">Eggetarian</option>
            </select>
          </FormField>

          <FormField label="Sleep (hrs)">
            <input
              value={form.habits?.sleep || ''}
              onChange={(e) => updateNested('habits', 'sleep', e.target.value)}
              placeholder="e.g., 7-8 hrs"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </FormField>

          <FormField label="Exercise">
            <input
              value={form.habits?.exercise || ''}
              onChange={(e) => updateNested('habits', 'exercise', e.target.value)}
              placeholder="e.g., Daily, Weekly, None"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </FormField>

          <FormField label="Allergies">
            <input
              value={form.habits?.allergies || ''}
              onChange={(e) => updateNested('habits', 'allergies', e.target.value)}
              placeholder="e.g., None, Dust, Food items"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </FormField>
        </div>
      </div>

      {/* General Enquiry Section - Common for all visits (This is saved per visit) */}
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>General Enquiry</h3>
        <p style={{ fontSize: 12, color: '#666', marginTop: -8, marginBottom: 16 }}>
          This information is specific to this visit
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          <FormField label="Chief Complaint">
            <textarea
              rows={2}
              value={form.generalEnquiry?.chiefComplaint || ''}
              onChange={(e) => updateNested('generalEnquiry', 'chiefComplaint', e.target.value)}
              placeholder="Main reason for visit"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
          </FormField>

          <FormField label="Duration">
            <input
              value={form.generalEnquiry?.duration || ''}
              onChange={(e) => updateNested('generalEnquiry', 'duration', e.target.value)}
              placeholder="How long? (e.g., 3 days, 2 weeks)"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </FormField>

          <FormField label="History of Present Illness">
            <textarea
              rows={3}
              value={form.generalEnquiry?.history || ''}
              onChange={(e) => updateNested('generalEnquiry', 'history', e.target.value)}
              placeholder="Detailed history of present illness"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
          </FormField>

          <FormField label="Current Medication">
            <textarea
              rows={2}
              value={form.generalEnquiry?.currentMedication || ''}
              onChange={(e) => updateNested('generalEnquiry', 'currentMedication', e.target.value)}
              placeholder="Medications currently taking"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
          </FormField>

          <FormField label="Past History">
            <textarea
              rows={2}
              value={form.generalEnquiry?.pastHistory || ''}
              onChange={(e) => updateNested('generalEnquiry', 'pastHistory', e.target.value)}
              placeholder="Previous medical conditions, surgeries, hospitalizations"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
          </FormField>

          <FormField label="Family History">
            <textarea
              rows={2}
              value={form.generalEnquiry?.familyHistory || ''}
              onChange={(e) => updateNested('generalEnquiry', 'familyHistory', e.target.value)}
              placeholder="Family medical history (diabetes, hypertension, heart disease, etc.)"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
          </FormField>

          <FormField label="Additional Notes">
            <textarea
              rows={2}
              value={form.generalEnquiry?.notes || ''}
              onChange={(e) => updateNested('generalEnquiry', 'notes', e.target.value)}
              placeholder="Any additional notes or observations"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
          </FormField>
        </div>
      </div>

      {/* Department Clinical Details - Dynamic based on department */}
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>{activeDepartment} — Clinical Details</h3>
        <p style={{ fontSize: 12, color: '#666', marginTop: -8, marginBottom: 16 }}>
          Department-specific clinical information for this visit
        </p>

        <div style={grid2}>{renderDeptFields()}</div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/patients')}
        >
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving…' : 'Save Enquiry'}
        </Button>
      </div>
    </div>
  );
}