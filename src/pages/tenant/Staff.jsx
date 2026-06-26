import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Avatar from '../../components/Avatar';
import { FormField } from '../../components/FormField';

import { staffAPI, departmentAPI, roleAPI } from '../../services/api';

const emptyForm = {
  staffId: '',
  name: '',
  email: '',
  phone: '',
  alternatePhone: '',
  gender: '',
  dob: '',
  departments: [],
  role: '',
  degrees: [],
  qualificationDetails: '',
  staffType: 'Fresher',
  experiences: [],
  aadhaarNumber: '',
  panNumber: '',
  esiNumber: '',
  pfNumber: '',
  uanNumber: '',
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: '',
  salary: '',
  joiningDate: '',
  address: '',
  status: 'active',
};

const degreeOptions = [
  '10th',
  '12th',
  'ITI',
  'Diploma',
  'Diploma in Nursing',
  'GNM',
  'ANM',
  'B.Sc Nursing',
  'M.Sc Nursing',
  'D.Pharm',
  'B.Pharm',
  'M.Pharm',
  'MBBS',
  'MD',
  'MS',
  'BDS',
  'MDS',
  'BHMS',
  'BAMS',
  'BUMS',
  'BNYS',
  'BPT',
  'MPT',
  'BMLT',
  'DMLT',
  'Radiology Technician',
  'Operation Theatre Technician',
  'Dialysis Technician',
  'Emergency Medical Technician',
  'BBA',
  'MBA',
  'B.Com',
  'M.Com',
  'BA',
  'MA',
  'B.Sc',
  'M.Sc',
  'B.Tech',
  'M.Tech',
  'Other',
].map((x) => ({ label: x, value: x }));

function Dropdown({
  label,
  required,
  value,
  options = [],
  placeholder = 'Select option',
  onChange,
  isMultiSelect = false,
  style = {},
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  const safeValue = isMultiSelect ? (Array.isArray(value) ? value : []) : value;

  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase();

    if (!q) return options;

    return options.filter((item) =>
      String(item.label || '').toLowerCase().includes(q)
    );
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    if (isMultiSelect) {
      if (safeValue.includes(optionValue)) {
        onChange(safeValue.filter((v) => v !== optionValue));
      } else {
        onChange([...safeValue, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearch('');
    }
  };

  const selectedLabel = useMemo(() => {
    if (!safeValue) return '';

    const option = options.find((opt) => opt.value === safeValue);

    return option ? option.label : '';
  }, [safeValue, options]);

  const needsSearch = options.length > 8;

  return (
    <FormField label={label} required={required}>
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            borderRadius: 10,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 42,
            maxHeight: 42,
            overflow: 'hidden',
            ...style,
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              paddingRight: 4,
            }}
          >
            {isMultiSelect && safeValue.length > 0 ? (
              <span
                style={{
                  color: 'var(--text)',
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {safeValue.length} selected
              </span>
            ) : !isMultiSelect && safeValue ? (
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {selectedLabel}
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>
            )}
          </div>

          <span
            style={{
              fontSize: 12,
              marginLeft: 8,
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
            }}
          >
            ▼
          </span>
        </div>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 9999,
              maxHeight: 320,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {needsSearch && (
              <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>
                <input
                  ref={searchInputRef}
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    outline: 'none',
                    fontSize: 13,
                  }}
                />
              </div>
            )}

            <div
              style={{
                overflowY: 'auto',
                maxHeight: needsSearch ? 270 : 320,
              }}
            >
              {filteredOptions.length === 0 ? (
                <div
                  style={{
                    padding: 12,
                    textAlign: 'center',
                    color: '#6b7280',
                  }}
                >
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const selected = isMultiSelect
                    ? safeValue.includes(option.value)
                    : safeValue === option.value;

                  return (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        backgroundColor: selected
                          ? 'rgba(59,130,246,0.08)'
                          : 'transparent',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        'rgba(59,130,246,0.05)')
                      }
                      onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = selected
                        ? 'rgba(59,130,246,0.08)'
                        : 'transparent')
                      }
                    >
                      {isMultiSelect && (
                        <input
                          type="checkbox"
                          checked={safeValue.includes(option.value)}
                          onChange={() => { }}
                          style={{ margin: 0, cursor: 'pointer' }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}

                      <span style={{ fontSize: 13 }}>{option.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
}

function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text)',
        marginBottom: 16,
        marginTop: 8,
        paddingBottom: 8,
        borderBottom: '2px solid var(--primary-light, #e0e7ff)',
      }}
    >
      {children}
    </div>
  );
}

function ExperienceForm({ experiences = [], onChange }) {
  const addExperience = () => {
    onChange([
      ...experiences,
      {
        companyName: '',
        designation: '',
        fromDate: '',
        toDate: '',
        yearsOfExperience: '',
        salary: '',
        address: '',
        phone: '',
      },
    ]);
  };

  const removeExperience = (index) => {
    onChange(experiences.filter((_, i) => i !== index));
  };

  const updateExperience = (index, field, value) => {
    const newExperiences = [...experiences];

    newExperiences[index][field] = value;

    if (field === 'fromDate' || field === 'toDate') {
      const fromDate =
        field === 'fromDate' ? value : newExperiences[index].fromDate;

      const toDate = field === 'toDate' ? value : newExperiences[index].toDate;

      if (fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const years = ((to - from) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);

        newExperiences[index].yearsOfExperience = `${years} years`;
      }
    }

    onChange(newExperiences);
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {experiences.map((exp, index) => (
        <div
          key={index}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 20,
            position: 'relative',
            backgroundColor: 'var(--bg-card, #fafafa)',
          }}
        >
          <Button
            size="sm"
            variant="danger"
            onClick={() => removeExperience(index)}
            style={{ position: 'absolute', top: 12, right: 12 }}
          >
            Remove
          </Button>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}
          >
            <FormField label="Company Name">
              <input
                placeholder="Company name"
                value={exp.companyName}
                onChange={(e) =>
                  updateExperience(index, 'companyName', e.target.value)
                }
              />
            </FormField>

            <FormField label="Designation">
              <input
                placeholder="Designation"
                value={exp.designation}
                onChange={(e) =>
                  updateExperience(index, 'designation', e.target.value)
                }
              />
            </FormField>

            <FormField label="From Date">
              <input
                type="date"
                value={exp.fromDate}
                onChange={(e) =>
                  updateExperience(index, 'fromDate', e.target.value)
                }
              />
            </FormField>

            <FormField label="To Date">
              <input
                type="date"
                value={exp.toDate}
                onChange={(e) => updateExperience(index, 'toDate', e.target.value)}
              />
            </FormField>

            <FormField label="Years of Experience">
              <input
                placeholder="e.g., 2.5 years"
                value={exp.yearsOfExperience}
                onChange={(e) =>
                  updateExperience(index, 'yearsOfExperience', e.target.value)
                }
              />
            </FormField>

            <FormField label="Salary">
              <input
                placeholder="Salary at this company"
                value={exp.salary}
                onChange={(e) => updateExperience(index, 'salary', e.target.value)}
              />
            </FormField>

            <FormField label="Company Phone">
              <input
                placeholder="Company phone"
                value={exp.phone}
                onChange={(e) => updateExperience(index, 'phone', e.target.value)}
              />
            </FormField>

            <div style={{ gridColumn: 'span 2' }}>
              <FormField label="Company Address">
                <textarea
                  rows={2}
                  placeholder="Company address"
                  value={exp.address}
                  onChange={(e) =>
                    updateExperience(index, 'address', e.target.value)
                  }
                />
              </FormField>
            </div>
          </div>
        </div>
      ))}

      <Button variant="secondary" onClick={addExperience}>
        + Add Experience
      </Button>
    </div>
  );
}

export default function Staff() {
  const fileInputRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [deptViewOpen, setDeptViewOpen] = useState(false);
  const [deptViewList, setDeptViewList] = useState([]);

  const [form, setForm] = useState(emptyForm);

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
  // Department filter
  const [filterDepartment, setFilterDepartment] = useState('');
  // Role filter
  const [filterRole, setFilterRole] = useState('');
  // Status filter
  const [filterStatus, setFilterStatus] = useState('');

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (filterDepartment) params.department = filterDepartment;
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.status = filterStatus;

      const res = await staffAPI.getStaff(params);

      const staff = res.data?.data || [];
      const pageInfo = res.data?.pagination || {};

      setRows(staff);

      setPagination((prev) => ({
        ...prev,
        page: pageInfo.page || prev.page,
        limit: pageInfo.limit || prev.limit,
        total: pageInfo.total || 0,
        totalPages: pageInfo.totalPages || 1,
      }));
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    sortConfig.sortBy,
    sortConfig.sortOrder,
    searchQuery,
    filterDepartment,
    filterRole,
    filterStatus,
  ]);

  const fetchAllDropdownPages = async (apiFn, baseParams = {}) => {
    const firstRes = await apiFn({
      ...baseParams,
      page: 1,
      limit: 1000,
    });

    const firstData = firstRes.data?.data || [];
    const totalPages = firstRes.data?.pagination?.totalPages || 1;

    if (totalPages <= 1) return firstData;

    const requests = [];

    for (let page = 2; page <= totalPages; page += 1) {
      requests.push(
        apiFn({
          ...baseParams,
          page,
          limit: 1000,
        })
      );
    }

    const restResponses = await Promise.all(requests);

    return [
      ...firstData,
      ...restResponses.flatMap((res) => res.data?.data || []),
    ];
  };

  const fetchDropdownData = async () => {
    try {
      const [departmentList, roleList] = await Promise.all([
        fetchAllDropdownPages(departmentAPI.getDepartments, {
          isActive: 'true',
          sortBy: 'name',
          sortOrder: 'asc',
        }),

        fetchAllDropdownPages(roleAPI.getRoles, {
          isActive: 'true',
          sortBy: 'roleName',
          sortOrder: 'asc',
        }),
      ]);

      setDepartments(departmentList);
      setRoles(roleList);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch department / role options');
    }
  };
  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const refreshStaffFromFirstPage = () => {
    if (pagination.page === 1) {
      fetchStaff();
      return;
    }

    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const resolveDepartmentName = (deptValue) => {
    if (!deptValue) return '';

    if (
      typeof deptValue === 'string' &&
      !deptValue.match(/^[0-9a-fA-F]{24}$/)
    ) {
      return deptValue;
    }

    const department = departments.find(
      (d) => String(d._id) === String(deptValue)
    );

    if (!department) return deptValue;

    return `${department.name}${department.specializationName ? ` - ${department.specializationName}` : ''
      }`;
  };

  const getDepartmentNames = (deptValues) => {
    if (!deptValues) return '—';

    const values = Array.isArray(deptValues) ? deptValues : [deptValues];

    const names = values.map(resolveDepartmentName).filter(Boolean);

    return names.length ? names.join(', ') : '—';
  };

  const openDepartmentsView = (deptValues) => {
    const values = Array.isArray(deptValues) ? deptValues : [deptValues];

    const list = values.map(resolveDepartmentName).filter(Boolean);

    setDeptViewList(list);
    setDeptViewOpen(true);
  };

  const getRoleName = (roleValue) => {
    if (!roleValue) return '—';

    if (
      typeof roleValue === 'string' &&
      !roleValue.match(/^[0-9a-fA-F]{24}$/)
    ) {
      return roleValue;
    }

    const role = roles.find((r) => String(r._id) === String(roleValue));

    return role ? role.roleName : roleValue;
  };

  const departmentOptions = departments
    .filter((d) => d.isActive !== false)
    .map((d) => ({
      label: `${d.name}${d.specializationName ? ` (${d.specializationName})` : ''}`,
      value: d._id,
    }));

  const roleOptions = roles
    .filter((r) => r.isActive !== false)
    .map((r) => ({
      label: `${r.roleName}${r.roleCode ? ` (${r.roleCode})` : ''}`,
      value: r._id,
    }));

  const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  const staffTypeOptions = [
    { label: 'Fresher', value: 'Fresher' },
    { label: 'Experienced', value: 'Experienced' },
  ];

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  // Filter dropdown options
  const filterDepartmentOptions = [
    { label: 'All Departments', value: '' },
    ...departmentOptions,
  ];

  const filterRoleOptions = [
    { label: 'All Roles', value: '' },
    ...roleOptions,
  ];

  const filterStatusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

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
      departments: Array.isArray(row.departments)
        ? row.departments
        : row.department
          ? [row.department]
          : [],
      degrees: Array.isArray(row.degrees) ? row.degrees : [],
      experiences: Array.isArray(row.experiences) ? row.experiences : [],
      dob: row.dob ? String(row.dob).slice(0, 10) : '',
      joiningDate: row.joiningDate ? String(row.joiningDate).slice(0, 10) : '',
      status: row.status || 'active',
    });

    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      if (!form.name || !form.departments.length || !form.role) {
        toast.error('Please fill required fields (Name, Departments, Role)');
        return;
      }

      if (form.staffType === 'Experienced' && form.experiences.length === 0) {
        toast.error('Please add at least one experience for experienced staff');
        return;
      }

      const payload = {
        ...form,
        name: form.name.trim(),
      };

      delete payload.department;

      if (!editingId) {
        delete payload.staffId;
      }

      if (editingId) {
        await staffAPI.updateStaff(editingId, payload);
        toast.success('Staff updated');
      } else {
        await staffAPI.createStaff(payload);
        toast.success('Staff created with ID');
      }

      setOpen(false);
      resetForm();
      // Reset to first page after create/update
      refreshStaffFromFirstPage();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete staff?')) return;

    try {
      await staffAPI.deleteStaff(id);
      toast.success('Staff deleted');
      fetchStaff();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete staff');
    }
  };

  const toggleStatus = async (row) => {
    try {
      const newStatus = row.status === 'active' ? 'inactive' : 'active';

      await staffAPI.updateStaff(row._id, { status: newStatus });

      setRows((prev) =>
        prev.map((item) =>
          item._id === row._id ? { ...item, status: newStatus } : item
        )
      );

      toast.success(newStatus === 'active' ? 'Staff activated' : 'Staff deactivated');

      // Refresh to update pagination counts
      fetchStaff();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const formData = new FormData();

      formData.append('file', file);

      const res = await staffAPI.importStaff(formData);
      const result = res.data?.data;

      toast.success(
        `Imported ${result?.createdCount || 0}, skipped ${result?.skippedCount || 0}`
      );

      // Reset to first page after import
      refreshStaffFromFirstPage();
    } catch (error) {
      console.error(error);
      toast.error('Failed to import staff');
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
  const handleDepartmentFilterChange = (value) => {
    setFilterDepartment(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRoleFilterChange = (value) => {
    setFilterRole(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilterChange = (value) => {
    setFilterStatus(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const tableRows = rows.map((staff) => ({
    id: staff._id,
    _id: staff._id,
    staffId: staff.staffId || '—',
    name: staff.name || '—',
    email: staff.email || '—',
    phone: staff.phone || '—',
    department: getDepartmentNames(staff.departments || staff.department),
    departmentCount: Array.isArray(staff.departments)
      ? staff.departments.length
      : staff.department
        ? 1
        : 0,
    role: getRoleName(staff.role),
    status: staff.status === 'active' ? 'Active' : 'Inactive',
    raw: staff,
  }));

  const columns = [
    {
      key: 'name',
      label: 'Staff',
      sortable: true,
      sortKey: 'name',
      render: (value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={value} size={36} />
          <div>
            <div style={{ fontWeight: 600 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {row.staffId} • {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      sortKey: 'phone',
    },
    {
      key: 'department',
      label: 'Departments',
      sortable: false,
      render: (value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            title={value}
            style={{
              maxWidth: 220,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
            }}
          >
            {value}
          </span>

          {row.departmentCount > 0 && (
            <button
              type="button"
              onClick={() =>
                openDepartmentsView(row.raw.departments || row.raw.department)
              }
              title="View departments"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              👁️
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      sortKey: 'role',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortKey: 'status',
      render: (value, row) => (
        <button
          type="button"
          onClick={() => toggleStatus(row.raw)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <Badge color={value === 'Active' ? 'green' : 'red'}>
            {value === 'Active' ? '✓ ' : '✕ '}
            {value}
          </Badge>
        </button>
      ),
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
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <Dropdown
            label="Filter by Department"
            value={filterDepartment}
            options={filterDepartmentOptions}
            placeholder="All Departments"
            onChange={handleDepartmentFilterChange}
          />
        </div>

        <div style={{ flex: 1, minWidth: 150 }}>
          <Dropdown
            label="Filter by Role"
            value={filterRole}
            options={filterRoleOptions}
            placeholder="All Roles"
            onChange={handleRoleFilterChange}
          />
        </div>

        <div style={{ flex: 1, minWidth: 120 }}>
          <Dropdown
            label="Filter by Status"
            value={filterStatus}
            options={filterStatusOptions}
            placeholder="All Status"
            onChange={handleStatusFilterChange}
          />
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <Button size="sm" variant="secondary" onClick={handleImportClick}>
            📥 Import Excel
          </Button>
        </div>
      </div>

      <DataTable
        title="Staff"
        subtitle="Manage clinic staff, departments, roles and employment details"
        columns={columns}
        rows={tableRows}
        loading={loading}
        emptyText="No staff found."
        addLabel="Add Staff"
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
          <>
            <Button size="sm" variant="outline" onClick={() => handleEdit(row.raw)}>
              Edit
            </Button>

            <Button size="sm" variant="danger" onClick={() => handleDelete(row.raw._id)}>
              Delete
            </Button>
          </>
        )}
      />

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={editingId ? 'Edit Staff' : 'Add Staff'}
        confirmLabel={submitting ? 'Saving...' : editingId ? 'Update Staff' : 'Save Staff'}
        onConfirm={handleSubmit}
        confirmLoading={submitting}
        width="70%"
        bodyStyle={{
          padding: '20px 24px',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        <SectionTitle>Basic Details</SectionTitle>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px 20px',
            marginBottom: 8,
          }}
        >
          {editingId && (
            <FormField label="Staff ID">
              <input
                value={form.staffId}
                disabled
                style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </FormField>
          )}

          <FormField label="Staff Name" required>
            <input
              placeholder="Dr. Priya Sharma"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              placeholder="staff@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>

          <FormField label="Phone">
            <input
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </FormField>

          <FormField label="Alternate Phone">
            <input
              placeholder="9876543210"
              value={form.alternatePhone}
              onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
            />
          </FormField>

          <Dropdown
            label="Gender"
            value={form.gender}
            options={genderOptions}
            onChange={(value) => setForm({ ...form, gender: value })}
            placeholder="Select Gender"
          />

          <FormField label="Date of Birth">
            <input
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
            />
          </FormField>

          <div style={{ gridColumn: 'span 2' }}>
            <Dropdown
              label="Departments"
              required
              value={form.departments}
              options={departmentOptions}
              placeholder="Select Departments"
              onChange={(value) => setForm({ ...form, departments: value })}
              isMultiSelect
            />

            {form.departments.length > 0 && (
              <button
                type="button"
                onClick={() => openDepartmentsView(form.departments)}
                style={{
                  marginTop: 6,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                👁️ View selected departments
              </button>
            )}
          </div>

          <Dropdown
            label="Role"
            required
            value={form.role}
            options={roleOptions}
            placeholder="Select Role"
            onChange={(value) => setForm({ ...form, role: value })}
          />
        </div>

        <SectionTitle>Education Details</SectionTitle>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px 20px',
            marginBottom: 8,
          }}
        >
          <div style={{ gridColumn: 'span 2' }}>
            <Dropdown
              label="Degrees / Qualification"
              value={form.degrees}
              options={degreeOptions}
              placeholder="Select Degrees"
              onChange={(value) => setForm({ ...form, degrees: value })}
              isMultiSelect
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <FormField label="Qualification Details">
              <textarea
                rows={3}
                placeholder="Enter qualification details, college, year, notes"
                value={form.qualificationDetails}
                onChange={(e) =>
                  setForm({ ...form, qualificationDetails: e.target.value })
                }
              />
            </FormField>
          </div>
        </div>

        <SectionTitle>Experience Details</SectionTitle>

        <div style={{ marginBottom: 8 }}>
          <Dropdown
            label="Staff Type"
            value={form.staffType}
            options={staffTypeOptions}
            onChange={(value) =>
              setForm({
                ...form,
                staffType: value,
                experiences: value === 'Fresher' ? [] : form.experiences,
              })
            }
          />
        </div>

        {form.staffType === 'Experienced' && (
          <div style={{ marginTop: 16 }}>
            <ExperienceForm
              experiences={form.experiences}
              onChange={(experiences) => setForm({ ...form, experiences })}
            />
          </div>
        )}

        <SectionTitle>Identity / Statutory Details</SectionTitle>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px 20px',
            marginBottom: 8,
          }}
        >
          <FormField label="Aadhaar Number">
            <input
              placeholder="Aadhaar number"
              value={form.aadhaarNumber}
              onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })}
            />
          </FormField>

          <FormField label="PAN Number">
            <input
              placeholder="PAN number"
              value={form.panNumber}
              onChange={(e) =>
                setForm({ ...form, panNumber: e.target.value.toUpperCase() })
              }
            />
          </FormField>

          <FormField label="ESI Number">
            <input
              placeholder="ESI number"
              value={form.esiNumber}
              onChange={(e) => setForm({ ...form, esiNumber: e.target.value })}
            />
          </FormField>

          <FormField label="PF Number">
            <input
              placeholder="PF number"
              value={form.pfNumber}
              onChange={(e) => setForm({ ...form, pfNumber: e.target.value })}
            />
          </FormField>

          <FormField label="UAN Number">
            <input
              placeholder="UAN number"
              value={form.uanNumber}
              onChange={(e) => setForm({ ...form, uanNumber: e.target.value })}
            />
          </FormField>
        </div>

        <SectionTitle>Bank Details</SectionTitle>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px 20px',
            marginBottom: 8,
          }}
        >
          <FormField label="Bank Name">
            <input
              placeholder="Bank name"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            />
          </FormField>

          <FormField label="Account Holder Name">
            <input
              placeholder="Account holder name"
              value={form.accountHolderName}
              onChange={(e) =>
                setForm({ ...form, accountHolderName: e.target.value })
              }
            />
          </FormField>

          <FormField label="Account Number">
            <input
              placeholder="Account number"
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            />
          </FormField>

          <FormField label="IFSC Code">
            <input
              placeholder="IFSC code"
              value={form.ifscCode}
              onChange={(e) =>
                setForm({ ...form, ifscCode: e.target.value.toUpperCase() })
              }
            />
          </FormField>

          <FormField label="Branch Name">
            <input
              placeholder="Branch name"
              value={form.branchName}
              onChange={(e) => setForm({ ...form, branchName: e.target.value })}
            />
          </FormField>
        </div>

        <SectionTitle>Salary / Address / Status</SectionTitle>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px 20px',
            marginBottom: 8,
          }}
        >
          <FormField label="Salary">
            <input
              placeholder="40000"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
            />
          </FormField>

          <FormField label="Joining Date">
            <input
              type="date"
              value={form.joiningDate}
              onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
            />
          </FormField>

          <div style={{ gridColumn: 'span 2' }}>
            <FormField label="Address">
              <textarea
                rows={3}
                placeholder="Staff address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </FormField>
          </div>

          <Dropdown
            label="Status"
            value={form.status}
            options={statusOptions}
            onChange={(value) => setForm({ ...form, status: value })}
          />
        </div>
      </Modal>

      <Modal
        open={deptViewOpen}
        onClose={() => setDeptViewOpen(false)}
        title="Selected Departments"
        confirmLabel="Close"
        onConfirm={() => setDeptViewOpen(false)}
        width="35%"
      >
        <div style={{ display: 'grid', gap: 10 }}>
          {deptViewList.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No departments selected.</div>
          ) : (
            deptViewList.map((dept, index) => (
              <div
                key={index}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  fontWeight: 600,
                }}
              >
                {index + 1}. {dept}
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}