import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'https://saasclinicos-backend-8t1dvqumg-dinesh-sass-clinicos-projects.vercel.app/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    const tenantId = localStorage.getItem('tenantId');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh queue
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config;

    if (!original) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');

        const newToken = data.accessToken || data.data?.accessToken;

        if (!newToken) {
          throw new Error('Access token not found in refresh response');
        }

        localStorage.setItem('accessToken', newToken);

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);

        original.headers.Authorization = `Bearer ${newToken}`;

        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);

        localStorage.removeItem('accessToken');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('user');

        window.dispatchEvent(new Event('auth:logout'));

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An error occurred.';

    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data) => {
    const response = await api.post('/auth/login', data);

    const accessToken =
      response.data?.accessToken || response.data?.data?.accessToken;

    const user = response.data?.data?.user || response.data?.user;

    const tenantId = user?.tenantId || response.data?.tenantId;

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }

    if (tenantId) {
      localStorage.setItem('tenantId', tenantId);
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    return response;
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data);

    const accessToken =
      response.data?.accessToken || response.data?.data?.accessToken;

    const user = response.data?.data?.user || response.data?.user;

    const tenantId = user?.tenantId || response.data?.tenantId;

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }

    if (tenantId) {
      localStorage.setItem('tenantId', tenantId);
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    return response;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:logout'));
    }
  },

  getMe: () => api.get('/auth/me'),

  changePassword: (data) => api.patch('/auth/change-password', data),
};


export const accountSetupAPI = {
  createActivationOrder: (data) =>
    api.post('/account-setup/create-order', data),

  verifyActivationPayment: (data) =>
    api.post('/account-setup/verify-payment', data),
};

export const referralAPI = {
  getInactiveClinics: () => api.get('/referral/inactive-clinics'),

  createActivationOrder: (data) =>
    api.post('/referral/create-order', data),

  verifyActivationPayment: (data) =>
    api.post('/referral/verify-payment', data),
};




export const patientAPI = {
  getPatients: (params = {}) => api.get('/patients', { params }),

  getPatientById: (id) => api.get(`/patients/${id}`),

  updatePatient: (id, data) => api.patch(`/patients/${id}`, data),

  updatePatientVisit: (patientId, visitId, data) =>
    api.put(`/patients/${patientId}/visits/${visitId}`, data),

  completePatientVisit: (patientId, visitId) =>
    api.patch(`/patients/${patientId}/visits/${visitId}/complete`),

  savePrescription: (patientId, visitId, data) =>
    api.post(`/patients/${patientId}/visits/${visitId}/prescriptions`, data),
};

export const clinicAPI = {
  getClinics: (params = {}) => api.get('/clinic', { params }),
  getClinicById: (id) => api.get(`/clinic/${id}`),
  getClinicUsers: (id) => api.get(`/clinic/${id}/users`),
  getStorageInfo: (clinicId) => api.get(`/clinic/${clinicId}/storage`),
  exportCollectionData: (clinicId, collectionName) =>
    api.get(`/clinic/${clinicId}/storage/${collectionName}/export`),
  clearCollection: (clinicId, collectionName) =>
    api.delete(`/clinic/${clinicId}/storage/${collectionName}`),

  // NEW: clear the full tenant database/storage without deleting clinic/users
  clearClinicStorage: (clinicId) => api.delete(`/clinic/${clinicId}/storage`),

  updateClinic: (id, data) => api.patch(`/clinic/${id}`, data),
  deleteClinic: (id) => api.delete(`/clinic/${id}`),
  updateClinicUserStatus: (userId, data) =>
    api.patch(`/clinic/users/${userId}/status`, data),

  // NEW: delete one clinic user from the Users modal
  deleteClinicUser: (userId) => api.delete(`/clinic/users/${userId}`),
};


export const featureAPI = {
  getFeatures: (params = {}) => api.get('/features', { params }),
  getFeatureById: (id) => api.get(`/features/${id}`),
  createFeature: (data) => api.post('/features', data),
  updateFeature: (id, data) => api.patch(`/features/${id}`, data),
  deleteFeature: (id) => api.delete(`/features/${id}`),
  updateFeatureStatus: (id, data) =>
    api.patch(`/features/${id}/status`, data),
};

export const userTypeAPI = {
  getUserTypes: (params = {}) => api.get('/user-types', { params }),

  createUserType: (data) => api.post('/user-types', data),

  updateUserType: (id, data) => api.patch(`/user-types/${id}`, data),

  deleteUserType: (id) => api.delete(`/user-types/${id}`),

  updateUserTypeStatus: (id, data) => api.patch(`/user-types/${id}/status`, data),
};
export const loginPriceAPI = {
  getLoginPrices: () =>
    api.get('/login-prices'),

  createLoginPrice: (data) =>
    api.post('/login-prices', data),

  updateLoginPrice: (id, data) =>
    api.patch(`/login-prices/${id}`, data),

  deleteLoginPrice: (id) =>
    api.delete(`/login-prices/${id}`),

  updateLoginPriceStatus: (id, data) =>
    api.patch(
      `/login-prices/${id}/status`,
      data
    ),
};

// subscriptionSetupAPI.js
// services/api.js - Add these to your subscriptionSetupAPI
export const subscriptionSetupAPI = {
  getData: (params = {}) => api.get('/subscription-setup/data', { params }),
  cancelBill: (billId) => api.post(`/subscription-setup/cancel-bill/${billId}`),

  getPermissionByTenantId: (tenantId) =>
    api.get(`/subscription-setup/permission/${tenantId}`),

  saveSubscription: (data) =>
    api.post('/subscription-setup', data),

  cancelSubscription: (tenantId) =>
    api.post(`/subscription-setup/${tenantId}/cancel`),

  getBillingHistory: (tenantId) =>
    api.get(`/subscription-setup/${tenantId}/billing-history`),

  generateManualBill: (tenantId, data = {}) =>
    api.post(`/subscription-setup/${tenantId}/generate-bill`, data),

  markBillAsPaid: (billId, paymentData) =>
    api.post(`/subscription-setup/pay-bill/${billId}`, paymentData),

  // Admin marks bill as paid (offline)
  adminMarkAsPaid: (billId, data) =>
    api.post(`/subscription-setup/admin-mark-paid/${billId}`, data),

  // Create Razorpay order (Admin can help user pay)
  createRazorpayOrder: (billId) =>
    api.post(`/subscription-setup/create-order/${billId}`),

  // Verify Razorpay payment
  verifyRazorpayPayment: (data) =>
    api.post('/subscription-setup/verify-payment', data),
};

export const billingAPI = {
  getBillings: (params = {}) => api.get('/billings', { params }),

  updateBillingStatus: (id, data) =>
    api.patch(`/billings/${id}/status`, data),
};
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
  getSaasDashboard: () => api.get('/dashboard/saas'),
};

// For subscriptionUserAPI (User)
export const subscriptionUserAPI = {
  getMySubscription: () => api.get('/subscription-user/my-subscription'),
  createOrder: (data) => api.post('/subscription-user/create-order', data),
  verifyPayment: (data) => api.post('/subscription-user/verify-payment', data),
}


export const departmentAPI = {
  getDepartments: (params = {}) => api.get('/departments', { params }),

  createDepartment: (data) => api.post('/departments', data),

  updateDepartment: (id, data) =>
    api.patch(`/departments/${id}`, data),

  updateDepartmentStatus: (id, data) =>
    api.patch(`/departments/${id}/status`, data),

  deleteDepartment: (id) =>
    api.delete(`/departments/${id}`),

  importDepartments: (formData) =>
    api.post('/departments/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

export const roleAPI = {
  getRoles: (params = {}) => api.get('/roles', { params }),
  createRole: (data) => api.post('/roles', data),
  updateRole: (id, data) => api.put(`/roles/${id}`, data),
  updateRoleStatus: (id, data) => api.patch(`/roles/${id}/status`, data),
  deleteRole: (id) => api.delete(`/roles/${id}`),
  importRoles: (formData) =>
    api.post('/roles/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};
export const staffAPI = {
  getStaff: (params = {}) => api.get('/staff', { params }),
  getStaffById: (id) => api.get(`/staff/${id}`),
  createStaff: (data) => api.post('/staff', data),
  updateStaff: (id, data) => api.patch(`/staff/${id}`, data),
  deleteStaff: (id) => api.delete(`/staff/${id}`),

  importStaff: (formData) =>
    api.post('/staff/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

export const assetAPI = {
  // Assets
  getAssets: (params = {}) => api.get('/assets', { params }),
  getAssetById: (id) => api.get(`/assets/${id}`),
  createAsset: (data) => api.post('/assets', data),
  updateAsset: (id, data) => api.patch(`/assets/${id}`, data),
  deleteAsset: (id) => api.delete(`/assets/${id}`),

  // Maintenance
  addMaintenanceLog: (id, data) => api.post(`/assets/${id}/maintenance`, data),

  // Categories
  getCategories: () => api.get('/assets/categories/all'),
  getCategoryById: (id) => api.get(`/assets/categories/${id}`),
  createCategory: (data) => api.post('/assets/categories', data),
  updateCategory: (id, data) => api.patch(`/assets/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/assets/categories/${id}`),

  // Subcategories
  addSubCategory: (categoryId, data) => api.post(`/assets/categories/${categoryId}/subcategories`, data),
  updateSubCategory: (categoryId, subCategoryId, data) =>
    api.patch(`/assets/categories/${categoryId}/subcategories/${subCategoryId}`, data),
  deleteSubCategory: (categoryId, subCategoryId) =>
    api.delete(`/assets/categories/${categoryId}/subcategories/${subCategoryId}`),

  // Import/Export
  importAssets: (formData) => api.post('/assets/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadTemplate: () => api.get('/assets/template', { responseType: 'blob' })
};

export const inventoryAPI = {
  getCategories: () => api.get('/inventory/categories'),
  createCategory: (data) => api.post('/inventory/categories', data),
  updateCategory: (id, data) => api.patch(`/inventory/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/inventory/categories/${id}`),

  getItems: (params = {}) => api.get('/inventory/items', { params }),
  getItemById: (id) => api.get(`/inventory/items/${id}`),
  createItem: (data) => api.post('/inventory/items', data),
  updateItem: (id, data) => api.patch(`/inventory/items/${id}`, data),
  deleteItem: (id) => api.delete(`/inventory/items/${id}`),

  updateStock: (id, data) => api.patch(`/inventory/items/${id}/stock`, data),
  getStockTransactions: (params = {}) => api.get('/inventory/transactions', { params }),
  getLowStockItems: () => api.get('/inventory/reports/low-stock'),
  getExpiringItems: () => api.get('/inventory/reports/expiring'),

  importItems: (formData) =>
    api.post('/inventory/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  downloadTemplate: () =>
    api.get('/inventory/template', {
      responseType: 'blob',
    }),
};
export const vendorAPI = {
  getVendors: (params = {}) => api.get('/vendors', { params }),
  getVendorById: (id) => api.get(`/vendors/${id}`),
  createVendor: (data) => api.post('/vendors', data),
  updateVendor: (id, data) => api.patch(`/vendors/${id}`, data),
  deleteVendor: (id) => api.delete(`/vendors/${id}`),
  updateVendorStatus: (id, data) =>
    api.patch(`/vendors/${id}/status`, data),

  importVendors: (formData) =>
    api.post('/vendors/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  downloadVendorTemplate: () =>
    api.get('/vendors/template', {
      responseType: 'blob',
    }),
};
export const purchaseOrderAPI = {
  getOrders: (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/purchase-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(url);
  },
  createOrder: (data) => api.post('/purchase-orders', data),
  receiveOrder: (id, data) => api.patch(`/purchase-orders/${id}/receive`, data),
  getOrderById: (id) => api.get(`/purchase-orders/${id}`),
  cancelOrder: (id) => api.patch(`/purchase-orders/${id}/cancel`),
};

export const medicalBillAPI = {
  getBills: (params = {}) => api.get('/medical-bills', { params }),
  createBill: (data) => api.post('/medical-bills', data),
};

export const patientTokenAPI = {
  getTokens: (params = {}) => api.get('/patient-tokens', { params }),

  createToken: (data) => api.post('/patient-tokens', data),

  updateTokenStatus: (id, data) =>
    api.patch(`/patient-tokens/${id}/status`, data),

  deleteToken: (id) => api.delete(`/patient-tokens/${id}`),
};

export const doctorCallBoardAPI = {
  getMyTokens: (params = {}) =>
    api.get('/doctor-call-board/my-tokens', { params }),

  callToken: (id, data = {}) =>
    api.patch(`/doctor-call-board/${id}/call`, data),

  completeToken: (id, data = {}) =>
    api.patch(`/doctor-call-board/${id}/complete`, data),

  cancelToken: (id, data = {}) =>
    api.patch(`/doctor-call-board/${id}/cancel`, data),
};

export const staffLoginAccessAPI = {
  getAll: (params = {}) => api.get('/staff-login-access', { params }),

  create: (data) => api.post('/staff-login-access', data),

  update: (staffId, data) =>
    api.patch(`/staff-login-access/${staffId}`, data),

  delete: (staffId) =>
    api.delete(`/staff-login-access/${staffId}`),
};

export const clientDashboardAPI = {
  getDashboard: (params = {}) =>
    api.get('/client-dashboard', { params }),
};


export const departmentFieldConfigAPI = {
  // Get all configurations
  getAllConfigs: () => api.get('/department-field-configs'),

  // Get configuration for a department
  getConfigByDepartment: (departmentName) =>
    api.get(`/department-field-configs/${encodeURIComponent(departmentName)}`),

  // Create or update configuration
  upsertConfig: (departmentName, data) =>
    api.put(`/department-field-configs/${encodeURIComponent(departmentName)}`, data),

  // Delete entire configuration
  deleteConfig: (departmentName) =>
    api.delete(`/department-field-configs/${encodeURIComponent(departmentName)}`),

  // Delete a specific field
  deleteField: (departmentName, fieldKey) =>
    api.delete(`/department-field-configs/${encodeURIComponent(departmentName)}/fields/${fieldKey}`),

  // Reorder fields
  reorderFields: (departmentName, fieldOrders) =>
    api.patch(`/department-field-configs/${encodeURIComponent(departmentName)}/reorder`, { fieldOrders }),

  // Clone configuration
  cloneConfig: (sourceDepartment, targetDepartment) =>
    api.post('/department-field-configs/clone', { sourceDepartment, targetDepartment }),
};


// ─────────────────────────────────────────────────────────────────────────────
// Add this block to src/services/api.js (next to your other API objects).
// It uses the same `api` axios instance, so auth + tenant headers are automatic.
// ─────────────────────────────────────────────────────────────────────────────

export const reportsAPI = {
  // List every available report, grouped by category (for the dropdown menu)
  // -> { success, categories: { [cat]: [{ key, title, govt, params }] }, formats }
  listReports: () => api.get('/reports'),

  // JSON preview of a report
  // params: { period | month+year | year | from+to | all, ...extra like patientId }
  // -> { success, report: { key, title, category, range, columns, rows, summary, note } }
  runReport: (key, params = {}) => api.get(`/reports/${key}`, { params }),

  // Download a report file. format = 'pdf' | 'excel' | 'csv' | 'word'
  // Returns a Blob response (use the downloadBlob helper in Reports.jsx).
  downloadReport: (key, params = {}, format = 'pdf') =>
    api.get(`/reports/${key}`, {
      params: { ...params, format },
      responseType: 'blob',
    }),
};


export const wardAPI = {
  getWards: (params = {}) => api.get('/wards', { params }),
  getWardById: (id) => api.get(`/wards/${id}`),
  createWard: (data) => api.post('/wards', data),
  updateWard: (id, data) => api.patch(`/wards/${id}`, data),
  deleteWard: (id) => api.delete(`/wards/${id}`),
  updateWardStatus: (id, data) => api.patch(`/wards/${id}/status`, data),
};

export const roomAPI = {
  getRooms: (params = {}) => api.get('/rooms', { params }),
  getRoomById: (id) => api.get(`/rooms/${id}`),
  createRoom: (data) => api.post('/rooms', data),
  updateRoom: (id, data) => api.patch(`/rooms/${id}`, data),
  deleteRoom: (id) => api.delete(`/rooms/${id}`),
  updateRoomStatus: (id, data) => api.patch(`/rooms/${id}/status`, data),
};

export const bedAPI = {
  getBeds: (params = {}) => api.get('/beds', { params }),
  getBedById: (id) => api.get(`/beds/${id}`),
  createBed: (data) => api.post('/beds', data),
  updateBed: (id, data) => api.patch(`/beds/${id}`, data),
  deleteBed: (id) => api.delete(`/beds/${id}`),
  updateBedStatus: (id, data) => api.patch(`/beds/${id}/status`, data),
};

export const ipdAPI = {
  getAdmissions: (params = {}) =>
    api.get('/ipd/admissions', { params }),

  getAdmissionById: (id) =>
    api.get(`/ipd/admissions/${id}`),

  allocateBed: (data) =>
    api.post('/ipd/admissions/allocate', data),

  dischargeAdmission: (id, data) =>
    api.patch(`/ipd/admissions/${id}/discharge`, data),

  addVitals: (id, data) =>
    api.post(`/ipd/admissions/${id}/vitals`, data),

  addNursingNote: (id, data) =>
    api.post(`/ipd/admissions/${id}/nursing-notes`, data),

  addDoctorRound: (id, data) =>
    api.post(`/ipd/admissions/${id}/doctor-rounds`, data),

  addLabOrder: (id, data) =>
    api.post(`/ipd/admissions/${id}/lab-orders`, data),

  issueMedicine: (id, data) =>
    api.post(`/ipd/admissions/${id}/medicine-issues`, data),

  addIpdCharge: (id, data) =>
    api.post(`/ipd/admissions/${id}/charges`, data),

  saveDischargeSummary: (id, data) =>
    api.patch(`/ipd/admissions/${id}/discharge-summary`, data),

  saveFinalSettlement: (id, data) =>
    api.patch(`/ipd/admissions/${id}/final-settlement`, data),

  releaseBed: (id, data) =>
    api.patch(`/ipd/admissions/${id}/bed-release`, data),

  getIpdReports: (params = {}) =>
    api.get('/ipd/admissions/reports/summary', { params }),
};


export const staffAttendanceAPI = {
  // Config
  getConfig: () => api.get('/staff-attendance/config'),
  updateConfig: (data) => api.patch('/staff-attendance/config', data),

  // Admin / Staff Attendance
  getAttendance: (params = {}) => api.get('/staff-attendance', { params }),

  getTodayAttendance: (params = {}) =>
    api.get('/staff-attendance/today', { params }),

  checkIn: (data) => api.post('/staff-attendance/check-in', data),
  checkOut: (data) => api.post('/staff-attendance/check-out', data),

  getSummary: (params = {}) =>
    api.get('/staff-attendance/reports/summary', { params }),

  // My Attendance
  getMyStatus: () => api.get('/staff-attendance/me/status'),

  getMyAttendance: (params = {}) =>
    api.get('/staff-attendance/me', { params }),

  checkInMe: (data) => api.post('/staff-attendance/me/check-in', data),
  checkOutMe: (data) => api.post('/staff-attendance/me/check-out', data),

  // My Attendance Regularization
  regularizeMyAttendance: (data) =>
    api.post('/staff-attendance/me/regularizations', data),

  getMyRegularizations: (params = {}) =>
    api.get('/staff-attendance/me/regularizations', { params }),

  // Staff Attendance Regularization
  regularizeStaffAttendance: (data) =>
    api.post('/staff-attendance/regularizations', data),

  getRegularizations: (params = {}) =>
    api.get('/staff-attendance/regularizations', { params }),

  approveRegularization: (id, data = {}) =>
    api.patch(`/staff-attendance/regularizations/${id}/approve`, data),

  rejectRegularization: (id, data = {}) =>
    api.patch(`/staff-attendance/regularizations/${id}/reject`, data),
};

export const staffPayslipAPI = {
  // Admin - all staff payslips
  getPayslips: (params = {}) =>
    api.get('/staff-payslips', { params }),

  // Admin - single staff payslip
  getStaffPayslip: (staffId, params = {}) =>
    api.get(`/staff-payslips/staff/${staffId}`, { params }),

  // Logged-in staff - my payslip
  getMyPayslip: (params = {}) =>
    api.get('/staff-payslips/me', { params }),
};
export default api;