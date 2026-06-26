// client/src/pages/StaffLoginAccess.js

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';

import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import { FormField } from '../components/FormField';

import { navItems } from '../config/navItems';

import {
  staffLoginAccessAPI,
  subscriptionSetupAPI,
  featureAPI,
} from '../services/api';

const emptyForm = {
  staffId: '',
  name: '',
  email: '',
  role: 'doctor',
  password: '',
  isActive: true,
  features: [],
};

const roleOptions = [
  { label: 'Doctor', value: 'doctor' },
  { label: 'Nurse', value: 'nurse' },
  { label: 'Receptionist', value: 'receptionist' },
  { label: 'Billing', value: 'billing' },
  { label: 'Cashier', value: 'cashier' },
  { label: 'Pharmacist', value: 'pharmacist' },
  { label: 'Store Manager', value: 'storemanager' },
];

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[-_/]/g, '')
    .trim();

const flattenNavFeatures = (items = []) => {
  const list = [];

  items.forEach((item) => {
    if (item.path) {
      list.push({
        label: item.label,
        featureKey: item.featureKey,
        module: 'Direct',
      });
    }

    if (Array.isArray(item.children)) {
      item.children.forEach((child) => {
        if (child.path) {
          list.push({
            label: child.label,
            featureKey: child.featureKey,
            module: item.label,
          });
        }
      });
    }
  });

  return list;
};

const getFeatureId = (feature) => {
  if (!feature) return '';

  if (typeof feature === 'string') {
    return feature;
  }

  return feature._id || feature.id || '';
};

const getFeatureName = (feature) => {
  if (!feature) return '';

  if (typeof feature === 'string') {
    return feature;
  }

  return feature.name || feature.label || feature.key || '';
};

const getFeatureModule = (feature) => {
  if (!feature || typeof feature === 'string') return '';

  return feature.module || feature.category || '';
};

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

  const safeValue = isMultiSelect
    ? Array.isArray(value)
      ? value
      : []
    : value;

  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return options;

    return options.filter((item) => {
      const label = String(item.label || '').toLowerCase();
      const module = String(item.module || '').toLowerCase();

      return label.includes(q) || module.includes(q);
    });
  }, [options, search]);

  const groupedOptions = useMemo(() => {
    const groups = {};

    filteredOptions.forEach((option) => {
      const groupName = option.module || 'General';

      if (!groups[groupName]) {
        groups[groupName] = [];
      }

      groups[groupName].push(option);
    });

    return Object.entries(groups).map(([groupName, groupOptions]) => ({
      groupName,
      groupOptions,
    }));
  }, [filteredOptions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

      return;
    }

    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
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
          onClick={() => setIsOpen((prev) => !prev)}
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
              <span style={{ color: 'var(--text-muted)' }}>
                {placeholder}
              </span>
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
              maxHeight: 340,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {needsSearch && (
              <div
                style={{
                  padding: 8,
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
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
                maxHeight: needsSearch ? 285 : 340,
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
                groupedOptions.map(({ groupName, groupOptions }) => (
                  <div key={groupName}>
                    {isMultiSelect && (
                      <div
                        style={{
                          padding: '8px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          background: '#f9fafb',
                          borderBottom: '1px solid #f3f4f6',
                          textTransform: 'uppercase',
                          letterSpacing: 0.6,
                        }}
                      >
                        {groupName}
                      </div>
                    )}

                    {groupOptions.map((option) => {
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
                          }}
                        >
                          {isMultiSelect && (
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => {}}
                              style={{
                                margin: 0,
                                cursor: 'pointer',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}

                          <span
                            style={{
                              fontSize: 13,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 2,
                            }}
                          >
                            <span>{option.label}</span>

                            {!isMultiSelect && option.module && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {option.module}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
}

export default function StaffLoginAccess() {
  const [rows, setRows] = useState([]);
  const [features, setFeatures] = useState([]);
  const [permission, setPermission] = useState(null);

  const [loading, setLoading] = useState(false);
  const [featureLoading, setFeatureLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedRow, setSelectedRow] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [featureViewOpen, setFeatureViewOpen] = useState(false);
  const [featureViewList, setFeatureViewList] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [sortConfig, setSortConfig] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [searchQuery, setSearchQuery] = useState('');

  const [filterRole, setFilterRole] = useState('');
  const [filterAccess, setFilterAccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loggedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const tenantId = loggedUser?.tenantId || '';

  const sidebarFeatureList = useMemo(() => {
    return flattenNavFeatures(navItems);
  }, []);

  const activeLoginCount = useMemo(() => {
    return rows.filter(
      (row) => row.hasLoginAccess && row.loginUser?.isActive
    ).length;
  }, [rows]);

  const allowedLoginCount = Number(permission?.loginCount || 0);

  const canCreateMoreLogin =
    allowedLoginCount === 0 ? true : activeLoginCount < allowedLoginCount;

  const featureOptions = useMemo(() => {
    return features
      .filter((feature) => feature?.isActive !== false)
      .map((feature) => ({
        label: getFeatureName(feature),
        value: getFeatureId(feature),
        module: getFeatureModule(feature) || 'General',
      }))
      .filter((item) => item.label && item.value)
      .sort((a, b) => {
        const moduleCompare = a.module.localeCompare(b.module);

        if (moduleCompare !== 0) return moduleCompare;

        return a.label.localeCompare(b.label);
      });
  }, [features]);

  const missingSidebarFeatures = useMemo(() => {
    const availableNames = features.map((feature) =>
      normalize(getFeatureName(feature))
    );

    return sidebarFeatureList.filter(
      (item) => !availableNames.includes(normalize(item.label))
    );
  }, [features, sidebarFeatureList]);

  const filterRoleOptions = [
    { label: 'All Roles', value: '' },
    ...roleOptions,
  ];

  const filterAccessOptions = [
    { label: 'All', value: '' },
    { label: 'Has Access', value: 'has' },
    { label: 'No Access', value: 'no' },
  ];

  const filterStatusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
      };

      if (searchQuery) params.search = searchQuery;
      if (filterRole) params.role = filterRole;
      if (filterAccess) params.hasAccess = filterAccess;
      if (filterStatus) params.status = filterStatus;

      const res = await staffLoginAccessAPI.getAll(params);

      setRows(res.data?.data || []);

      setPagination((prev) => ({
        ...prev,
        total: res.data?.pagination?.total || 0,
        totalPages: res.data?.pagination?.totalPages || 1,
      }));
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          'Failed to fetch staff login access'
      );
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    sortConfig.sortBy,
    sortConfig.sortOrder,
    searchQuery,
    filterRole,
    filterAccess,
    filterStatus,
  ]);

  const fetchPermissionFeatures = useCallback(async () => {
    try {
      setFeatureLoading(true);

      if (!tenantId) {
        toast.error('Tenant ID not found');
        return;
      }

      const permissionRes =
        await subscriptionSetupAPI.getPermissionByTenantId(tenantId);

      const permissionData =
        permissionRes.data?.data ||
        permissionRes.data?.permission ||
        permissionRes.data;

      setPermission(permissionData || null);

      const permissionFeatures = permissionData?.features || [];

      if (
        permissionFeatures.length > 0 &&
        typeof permissionFeatures[0] === 'object'
      ) {
        setFeatures(
          permissionFeatures.filter((item) => item?.isActive !== false)
        );
        return;
      }

      const allFeatureRes = await featureAPI.getFeatures();
      const allFeatures = allFeatureRes.data?.data || [];

      const allowedIds = permissionFeatures.map((id) => String(id));

      setFeatures(
        allFeatures.filter(
          (feature) =>
            allowedIds.includes(String(feature._id)) &&
            feature.isActive !== false
        )
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          'Failed to fetch subscription features'
      );
    } finally {
      setFeatureLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchPermissionFeatures();
  }, [fetchPermissionFeatures]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedRow(null);
    setEditing(false);
  };

  const openCreate = (row) => {
    if (!canCreateMoreLogin) {
      toast.error(
        `Login limit reached. Your plan allows ${allowedLoginCount} login user(s).`
      );
      return;
    }

    setEditing(false);
    setSelectedRow(row);

    setForm({
      staffId: row._id,
      name: row.name || '',
      email: row.email || '',
      role: 'doctor',
      password: '',
      isActive: true,
      features: [],
    });

    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(true);
    setSelectedRow(row);

    const selectedFeatures = Array.isArray(row.loginUser?.features)
      ? row.loginUser.features.map((item) => getFeatureId(item)).filter(Boolean)
      : [];

    setForm({
      staffId: row._id,
      name: row.name || '',
      email: row.email || '',
      role: row.loginUser?.role || 'doctor',
      password: '',
      isActive: row.loginUser?.isActive ?? true,
      features: selectedFeatures,
    });

    setOpen(true);
  };

  const openFeaturesView = (featureIds = []) => {
    const ids = Array.isArray(featureIds) ? featureIds : [];

    const list = ids
      .map((id) =>
        features.find((feature) => String(getFeatureId(feature)) === String(id))
      )
      .filter(Boolean)
      .map((feature) => ({
        name: getFeatureName(feature),
        module: getFeatureModule(feature),
      }));

    setFeatureViewList(list);
    setFeatureViewOpen(true);
  };

  const openRowFeaturesView = (featureList = []) => {
    const list = (Array.isArray(featureList) ? featureList : [])
      .filter(Boolean)
      .map((feature) => ({
        name: getFeatureName(feature),
        module: getFeatureModule(feature),
      }));

    setFeatureViewList(list);
    setFeatureViewOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      if (!form.staffId) {
        toast.error('Staff is required');
        return;
      }

      if (!form.role) {
        toast.error('Please select role');
        return;
      }

      if (!editing && !canCreateMoreLogin) {
        toast.error(
          `Login limit reached. Your plan allows ${allowedLoginCount} login user(s).`
        );
        return;
      }

      if (!editing && !form.password) {
        toast.error('Password is required');
        return;
      }

      if (form.password && form.password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }

      if (editing) {
        const payload = {
          role: form.role,
          isActive: form.isActive,
          features: form.features,
        };

        if (form.password) {
          payload.password = form.password;
        }

        await staffLoginAccessAPI.update(form.staffId, payload);

        toast.success('Login access updated');
      } else {
        await staffLoginAccessAPI.create({
          staffId: form.staffId,
          role: form.role,
          password: form.password,
          features: form.features,
        });

        toast.success('Login access created');
      }

      setOpen(false);
      resetForm();

      setPagination((prev) => ({
        ...prev,
        page: 1,
      }));

      fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message || 'Failed to save login access'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (staffId) => {
    if (!window.confirm('Remove login access for this staff?')) return;

    try {
      await staffLoginAccessAPI.delete(staffId);

      toast.success('Login access removed');

      setPagination((prev) => ({
        ...prev,
        page: 1,
      }));

      fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          'Failed to remove login access'
      );
    }
  };

  const toggleStatus = async (row) => {
    try {
      if (!row.hasLoginAccess) return;

      const newStatus = !row.loginUser?.isActive;

      await staffLoginAccessAPI.update(row._id, {
        isActive: newStatus,
      });

      toast.success(newStatus ? 'Login enabled' : 'Login disabled');

      fetchData();
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          'Failed to update login status'
      );
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handlePageSizeChange = (newLimit) => {
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }));
  };

  const handleSearchChange = (searchValue) => {
    setSearchQuery(searchValue);

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handleSortChange = ({ sortBy, sortOrder }) => {
    setSortConfig({
      sortBy,
      sortOrder,
    });

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handleRoleFilterChange = (value) => {
    setFilterRole(value);

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handleAccessFilterChange = (value) => {
    setFilterAccess(value);

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handleStatusFilterChange = (value) => {
    setFilterStatus(value);

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const formatDateTime = (value) => {
    if (!value) return '—';

    return new Date(value).toLocaleString();
  };

  const getFeatureNames = (row) => {
    const list = row.loginUser?.features || [];

    if (!list.length) return '—';

    return list.map((item) => getFeatureName(item)).join(', ');
  };

  const columns = [
    {
      key: 'name',
      label: 'Staff',
      sortable: true,
      sortKey: 'name',
      render: (_, row) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Avatar name={row.name} size={36} />

          <div>
            <div style={{ fontWeight: 600 }}>{row.name || '—'}</div>

            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              {row.staffId || '—'} • {row.email || 'No email'}
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
      render: (_, row) => row.phone || '—',
    },
    {
      key: 'role',
      label: 'Login Role',
      sortable: true,
      sortKey: 'role',
      render: (_, row) =>
        row.hasLoginAccess ? (
          <Badge color="blue">{row.loginUser?.role || '—'}</Badge>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    {
      key: 'features',
      label: 'Features',
      sortable: false,
      render: (_, row) => {
        const featureCount = row.loginUser?.features?.length || 0;

        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              title={getFeatureNames(row)}
              style={{
                maxWidth: 260,
                display: 'inline-block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {getFeatureNames(row)}
            </span>

            {featureCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  openRowFeaturesView(row.loginUser?.features || [])
                }
                title="View features"
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
        );
      },
    },
    {
      key: 'access',
      label: 'Login Access',
      sortable: true,
      sortKey: 'hasAccess',
      render: (_, row) =>
        row.hasLoginAccess ? (
          <button
            type="button"
            onClick={() => toggleStatus(row)}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <Badge color={row.loginUser?.isActive ? 'green' : 'red'}>
              {row.loginUser?.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </button>
        ) : (
          <Badge color="gray">No Access</Badge>
        ),
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      sortable: true,
      sortKey: 'lastLogin',
      render: (_, row) => formatDateTime(row.loginUser?.lastLogin),
    },
  ];

  return (
    <>
      {/* Stats Bar */}
      <div
        style={{
          marginBottom: 16,
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--bg-card, #fff)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
            }}
          >
            Current Tenant
          </div>

          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {tenantId || 'Tenant from token'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <Badge color="blue">
            Active Logins: {activeLoginCount}/
            {allowedLoginCount || '∞'}
          </Badge>

          <Badge color="green">Subscription Features: {features.length}</Badge>

          <Badge color={missingSidebarFeatures.length ? 'yellow' : 'green'}>
            Sidebar Match:{' '}
            {sidebarFeatureList.length - missingSidebarFeatures.length}/
            {sidebarFeatureList.length}
          </Badge>
        </div>
      </div>

      {missingSidebarFeatures.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            border: '1px solid #FDE68A',
            background: '#FFFBEB',
            color: '#92400E',
            fontSize: 13,
          }}
        >
          <strong>Note:</strong> Some sidebar features are not available in this
          tenant subscription. Staff cannot be assigned these until they are
          created in SaaS Features and added to the subscription plan.

          <div
            style={{
              marginTop: 8,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {missingSidebarFeatures.slice(0, 12).map((item) => (
              <span
                key={`${item.module}-${item.label}`}
                style={{
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  fontWeight: 600,
                }}
              >
                {item.label}
              </span>
            ))}

            {missingSidebarFeatures.length > 12 && (
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  fontWeight: 600,
                }}
              >
                +{missingSidebarFeatures.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: 1, minWidth: 150 }}>
          <Dropdown
            label="Filter by Role"
            value={filterRole}
            options={filterRoleOptions}
            placeholder="All Roles"
            onChange={handleRoleFilterChange}
          />
        </div>

        <div style={{ flex: 1, minWidth: 150 }}>
          <Dropdown
            label="Filter by Access"
            value={filterAccess}
            options={filterAccessOptions}
            placeholder="All Access"
            onChange={handleAccessFilterChange}
          />
        </div>

        <div style={{ flex: 1, minWidth: 150 }}>
          <Dropdown
            label="Filter by Status"
            value={filterStatus}
            options={filterStatusOptions}
            placeholder="All Status"
            onChange={handleStatusFilterChange}
          />
        </div>
      </div>

      <DataTable
        title="Staff Login Access"
        subtitle="Assign subscription features to staff. Feature names must match sidebar nav names for menu access."
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No staff found."
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        actions={({ row }) => (
          <>
            {!row.hasLoginAccess ? (
              <Button
                size="sm"
                onClick={() => openCreate(row)}
                disabled={!canCreateMoreLogin}
              >
                Give Access
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(row)}
                >
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant={row.loginUser?.isActive ? 'warning' : 'success'}
                  onClick={() => toggleStatus(row)}
                >
                  {row.loginUser?.isActive ? 'Disable' : 'Enable'}
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(row._id)}
                >
                  Remove
                </Button>
              </>
            )}
          </>
        )}
      />

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={editing ? 'Edit Staff Login Access' : 'Give Staff Login Access'}
        confirmLabel={
          submitting ? 'Saving...' : editing ? 'Update Access' : 'Create Login'
        }
        onConfirm={handleSubmit}
        confirmLoading={submitting}
        width="52%"
        bodyStyle={{
          maxHeight: '72vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <FormField label="Staff Name">
            <input
              value={form.name}
              disabled
              style={{
                background: '#f5f5f5',
                cursor: 'not-allowed',
              }}
            />
          </FormField>

          <FormField label="Email">
            <input
              value={form.email}
              disabled
              style={{
                background: '#f5f5f5',
                cursor: 'not-allowed',
              }}
            />
          </FormField>

          <FormField label="Login Role" required>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                })
              }
            >
              {roleOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </FormField>

          <div>
            <Dropdown
              label="Feature Access"
              value={form.features}
              options={featureOptions}
              placeholder={
                featureLoading
                  ? 'Loading subscription features...'
                  : 'Select Features'
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  features: value,
                })
              }
              isMultiSelect
            />

            {form.features.length > 0 && (
              <button
                type="button"
                onClick={() => openFeaturesView(form.features)}
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
                👁️ View selected features
              </button>
            )}
          </div>

          <FormField
            label={editing ? 'New Password' : 'Password'}
            required={!editing}
          >
            <input
              type="password"
              placeholder={
                editing
                  ? 'Leave empty to keep old password'
                  : 'Enter password'
              }
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
            />
          </FormField>

          {editing && (
            <FormField label="Status">
              <select
                value={form.isActive ? 'active' : 'inactive'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isActive: e.target.value === 'active',
                  })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          )}

          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              fontSize: 13,
              color: '#374151',
            }}
          >
            <div>
              <strong>Active Logins:</strong> {activeLoginCount}/
              {allowedLoginCount || 'Unlimited'}
            </div>

            <div style={{ marginTop: 4 }}>
              <strong>Available Features:</strong> {features.length}
            </div>

            <div style={{ marginTop: 4 }}>
              <strong>Selected Features:</strong> {form.features.length}
            </div>

            {selectedRow && (
              <>
                <div style={{ marginTop: 4 }}>
                  <strong>Staff ObjectId:</strong> {selectedRow._id}
                </div>

                <div style={{ marginTop: 4 }}>
                  <strong>User ObjectId:</strong> {selectedRow._id}
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={featureViewOpen}
        onClose={() => setFeatureViewOpen(false)}
        title="Selected Features"
        confirmLabel="Close"
        onConfirm={() => setFeatureViewOpen(false)}
        width="38%"
      >
        <div style={{ display: 'grid', gap: 10 }}>
          {featureViewList.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>
              No features selected.
            </div>
          ) : (
            featureViewList.map((feature, index) => (
              <div
                key={`${feature.name}-${index}`}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {index + 1}. {feature.name}
                </div>

                {feature.module && (
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {feature.module}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}