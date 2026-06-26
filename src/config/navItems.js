
export const navItems = [

  {
    path: '/welcome',
    label: 'WELCOME',
    featureKey: 'Welcome',
    icon: 'M3 3h8v8H3V3z M13 3h8v5h-8z M13 10h8v11h-8z M3 13h8v8H3z',

  },
  {
    path: '/myattendence',
    label: 'My Attendence',
    featureKey: 'My Attendence',
    icon: 'M3 3h8v8H3V3z M13 3h8v5h-8z M13 10h8v11h-8z M3 13h8v8H3z',

  },
  { path: '/my-payslip', label: 'My Payslip', featureKey: 'My Payslip', icon: 'M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2z M8 7h8 M8 11h8 M8 15h5' },
  { path: '/staff-payslips', label: 'Staff Payslips', featureKey: 'Staff Payslips', icon: 'M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2z M8 7h8 M8 11h8 M8 15h5', roles: ['admin'] },
  // ─── Main ─────────────────────────────────────────────────────────
  {
    key: 'main',
    label: 'Main',
    icon: 'M3 3h8v8H3V3z M13 3h8v5h-8z M13 10h8v11h-8z M3 13h8v8H3z',
    roles: ['admin'],
    children: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        featureKey: 'dashboard',
        icon: 'M3 3h8v8H3V3z M13 3h8v5h-8z M13 10h8v11h-8z M3 13h8v8H3z',
        roles: ['admin'],
      },
      {
        path: '/reports',
        label: 'Reports',
        featureKey: 'reports',
        icon: 'M4 19h16 M7 16l3-3 3 2 4-6 M5 4h14v4H5z',
        roles: ['admin'],
      },
    ],
  },
  {
    path: '/staff-attendences',
    label: 'Staff Attendences',
    featureKey: 'Staff Attendences',
    icon: 'M4 19h16 M7 16l3-3 3 2 4-6 M5 4h14v4H5z',
    roles: ['admin'],
  },

  // ─── Front Office / OPD ───────────────────────────────────────────
  {
    key: 'front-office-opd',
    label: 'Front Office / OPD',
    icon: 'M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 1 0 0 4v2a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4v-2a2 2 0 1 0 0-4z',
    roles: ['admin', 'receptionist'],
    children: [
      {
        path: '/tokens',
        label: 'Tokens',
        featureKey: 'tokens',
        icon: 'M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 1 0 0 4v2a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4v-2a2 2 0 1 0 0-4z M9 12h6',
        roles: ['admin', 'receptionist'],
      },
      {
        path: '/doctorscallboard',
        label: 'Doctor Call Board',
        featureKey: 'doctor-call-board',
        icon: 'M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M8 21h8 M12 17v4',
        roles: ['admin', 'doctor', 'receptionist'],
      },
      {
        path: '/patients',
        label: 'Patients',
        featureKey: 'patients',
        icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z',
        roles: ['admin', 'doctor', 'nurse', 'receptionist'],
      },
    ],
  },

  // ─── Billing ──────────────────────────────────────────────────────
  {
    key: 'billing',
    label: 'Billing',
    icon: 'M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2z M8 7h8 M8 11h8 M8 15h5',
    roles: ['admin', 'cashier', 'billing', 'receptionist'],
    children: [
      {
        path: '/bill',
        label: 'Clinic Billing',
        featureKey: 'clinic-billing',
        icon: 'M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2z M8 7h8 M8 11h8 M8 15h5',
        roles: ['admin', 'cashier', 'billing', 'receptionist'],
      },
      {
        path: '/billings',
        label: 'Billing History',
        featureKey: 'billing-history',
        icon: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z M3 11h18 M7 15h4',
        roles: ['admin', 'cashier', 'billing', 'clinicossaassadmin'],
      },
    ],
  },

  // ─── Inventory / Purchase ─────────────────────────────────────────
  {
    key: 'inventory-purchase',
    label: 'Inventory & Purchase',
    icon: 'M3 7l9-4 9 4-9 4-9-4z M3 7v10l9 4 9-4V7 M12 11v10',
    roles: ['admin', 'pharmacist', 'storemanager'],
    children: [
      {
        path: '/inventory',
        label: 'Inventory',
        featureKey: 'inventory',
        icon: 'M3 7l9-4 9 4-9 4-9-4z M3 7v10l9 4 9-4V7 M12 11v10',
        roles: ['admin', 'pharmacist', 'storemanager'],
      },
      {
        path: '/stocktransaction',
        label: 'Stock Transactions',
        featureKey: 'stock-transactions',
        icon: 'M3 10h18 M3 14h18 M5 6h14 M5 18h14',
        roles: ['admin', 'pharmacist', 'storemanager'],
      },
      {
        path: '/purchaseorder',
        label: 'Purchase Orders',
        featureKey: 'purchase-orders',
        icon: 'M9 2h6a2 2 0 0 1 2 2v2h3v16H4V6h3V4a2 2 0 0 1 2-2z M9 6h6 M8 11h8 M8 15h8 M8 19h5',
        roles: ['admin', 'storemanager'],
      },
      {
        path: '/vendors',
        label: 'Vendors',
        featureKey: 'vendors',
        icon: 'M2 9l1-5h18l1 5v1a2 2 0 0 1-2 2h-1v8H5v-8H4a2 2 0 0 1-2-2V9z M9 11v8 M15 11v8',
        roles: ['admin', 'storemanager'],
      },
      {
        path: '/assets',
        label: 'Assets',
        featureKey: 'assets',
        icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12',
        roles: ['admin', 'storemanager'],
      },
    ],
  },

  // ─── Hospital / IPD ───────────────────────────────────────────────
  {
    key: 'hospital-ipd',
    label: 'Hospital / IPD',
    icon: 'M3 12h18v6H3z M5 8h5v4H5z M12 9h7v3h-7z',
    roles: ['admin', 'doctor', 'nurse', 'cashier'],
    children: [
      {
        path: '/wards',
        label: 'Ward Master',
        featureKey: 'ward-master',
        icon: 'M4 4h16v16H4z M8 4v16 M4 10h16',
        roles: ['admin'],
      },
      {
        path: '/rooms',
        label: 'Room Master',
        featureKey: 'room-master',
        icon: 'M3 5h18v14H3z M9 5v14 M15 5v14',
        roles: ['admin'],
      },
      {
        path: '/beds',
        label: 'Bed Management',
        featureKey: 'bed-management',
        icon: 'M3 12h18v6H3z M5 8h5v4H5z M12 9h7v3h-7z',
        roles: ['admin', 'nurse'],
      },
      {
        path: '/ipd/admissions',
        label: 'IPD Admissions',
        featureKey: 'ipd-admissions',
        icon: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M4 22a8 8 0 0 1 16 0 M17 13h4 M19 11v4',
        roles: ['admin', 'doctor', 'nurse', 'receptionist'],
      },
      {
        path: '/ipd/billing-discharge',
        label: 'IPD Billing / Discharge',
        featureKey: 'ipd-billing-discharge',
        icon: 'M4 4h16v16H4z M7 8h10 M7 12h10 M7 16h6 M16 18l3-3-3-3',
        roles: ['admin', 'doctor', 'nurse', 'cashier', 'billing'],
      },
    ],
  },

  // ─── Staff / Access ───────────────────────────────────────────────
  {
    key: 'staff-access',
    label: 'Staff & Access',
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
    roles: ['admin'],
    children: [
      {
        path: '/staff',
        label: 'Staff',
        featureKey: 'staff',
        icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
        roles: ['admin'],
      },
      {
        path: '/staffloginaccess',
        label: 'Login Access',
        featureKey: 'login-access',
        icon: 'M12 2l7 4v5c0 5-3.5 9.5-7 11-3.5-1.5-7-6-7-11V6l7-4z M9 12l2 2 4-4',
        roles: ['admin'],
      },
    ],
  },

  // ─── Settings ─────────────────────────────────────────────────────
  {
    key: 'settings',
    label: 'Settings',
    icon: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z M4 12h2 M18 12h2 M12 4v2 M12 18v2',
    roles: ['admin'],
    children: [
      {
        path: '/departmentfieldconfig',
        label: 'Department Field Config',
        featureKey: 'department-field-config',
        icon: 'M4 5h16 M4 12h16 M4 19h16 M8 3v4 M14 10v4 M10 17v4',
        roles: ['admin'],
      },
      {
        path: '/subscriptionuser',
        label: 'My Subscription',
        featureKey: 'my-subscription',
        icon: 'M3 6h18v12H3V6z M3 10h18 M7 15h4',
        roles: ['admin'],
      },
    ],
  },

  // ─── SaaS Admin ───────────────────────────────────────────────────
  {
    key: 'saas-admin',
    label: 'SaaS Admin',
    icon: 'M5 20V10 M12 20V4 M19 20v-7',
    roles: ['clinicossaassadmin'],
    children: [
      {
        path: '/saasdashboard',
        label: 'SaaS Dashboard',
        featureKey: 'saas-dashboard',
        icon: 'M5 20V10 M12 20V4 M19 20v-7',
        roles: ['clinicossaassadmin'],
      },
      {
        path: '/clinic',
        label: 'Clinics',
        featureKey: 'clinics',
        icon: 'M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16 M9 21V9h6v12 M10 13h4 M12 11v4',
        roles: ['clinicossaassadmin'],
      },
      {
        path: '/departments',
        label: 'Departments',
        featureKey: 'departments',
        icon: 'M3 3h7v7H3V3z M14 3h7v7h-7V3z M3 14h7v7H3v-7z M14 14h7v7h-7v-7z',
        roles: ['clinicossaassadmin'],
      },
      {
        path: '/roles',
        label: 'Roles',
        featureKey: 'roles',
        icon: 'M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z',
        roles: ['clinicossaassadmin'],
      },
      {
        path: '/features',
        label: 'Features',
        featureKey: 'features',
        icon: 'M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z',
        roles: ['clinicossaassadmin'],
      },
      {
        path: '/users',
        label: 'Users',
        featureKey: 'users',
        icon: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M4 22v-2a6 6 0 0 1 12 0v2 M19 8l1 1 2-2',
        roles: ['clinicossaassadmin'],
      },
      {
        path: '/loginprice',
        label: 'Login Pricing',
        featureKey: 'login-pricing',
        icon: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
        roles: ['clinicossaassadmin'],
      },
      {
        path: '/subscriptionssetup',
        label: 'Subscription Plans',
        featureKey: 'subscription-plans',
        icon: 'M12 2l9 5-9 5-9-5 9-5z M3 12l9 5 9-5 M3 17l9 5 9-5',
        roles: ['clinicossaassadmin'],
      },
    ],
  },
];