// client/src/App.js

import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import { navItems } from './config/navItems';

import {
  getDefaultPath,
  findNavItemByPath,
  userCanAccessNavItem,
  normalize,
} from './utils/navAccess';

import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AccountPending from './pages/AccountPending';
import ReferralPage from './pages/ReferralPage';

import SaasDashboard from './pages/SaasDashboard';
import Clinic from './pages/Clinic';
import Features from './pages/Features';
import Users from './pages/Users';
import LoginPrice from './pages/LoginPrice';
import SubscriptionsSetup from './pages/SubscriptionsSetup';
import Billings from './pages/Billings';
import SubscriptionUser from './pages/SubscriptionUser';
import Departments from './pages/Departments';
import Roles from './pages/Roles';
import StaffLoginAccess from './pages/StaffLoginAccess';

// tenant
import Staff from './pages/tenant/Staff';
import Assets from './pages/tenant/Assets';
import ItemCategoryManager from './pages/tenant/ItemCategoryManager';
import Inventory from './pages/tenant/Inventory';
import Vendors from './pages/tenant/Vendors';
import PurchaseOrders from './pages/tenant/PurchaseOrders';
import MedicalBills from './pages/tenant/MedicalBills';
import PatientTokens from './pages/tenant/PatientTokens';
import DoctorCallBoard from './pages/tenant/DoctorCallBoard';
import PatientsDashboard from './pages/tenant/PatientsDashboard';
import Patients from './pages/tenant/Patients';
import StockTransactions from './pages/tenant/StockTransactions';
import DepartmentFieldConfig from './pages/tenant/DepartmentFieldConfig';
import Reports from './pages/tenant/Reports';

import WardMaster from './pages/tenant/masters/WardMaster';
import RoomMaster from './pages/tenant/masters/RoomMaster';
import BedMaster from './pages/tenant/masters/BedMaster';
import IpdAdmissions from './pages/tenant/ipd/IpdAdmissions';
import IpdBillingDischarge from './pages/tenant/ipd/IpdBillingDischarge';

import StaffAttendance from './pages/tenant/StaffAttendance';
import MyAttendancePage from './pages/tenant/MyAttendancePage';

import StaffPayslipsPage from './pages/tenant/StaffPayslips';
import MyPayslipPage from './pages/tenant/MyPayslip';



// ─── Query Client ───────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ─── Protected Route ────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = normalize(user?.role);

  // Admin and SaaS admin unrestricted
  if (role === 'admin' || role === 'clinicossaassadmin') {
    return <AppLayout>{children}</AppLayout>;
  }

  const currentNavItem = findNavItemByPath(navItems, location.pathname);

  // Route not present in sidebar nav: allow
  // Example: /welcome, /patientsdashboard/:id
  if (!currentNavItem) {
    return <AppLayout>{children}</AppLayout>;
  }

  const hasAccess = userCanAccessNavItem(user, currentNavItem);

  if (!hasAccess) {
    return <Navigate to={getDefaultPath(role)} replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

// ─── Public Route ───────────────────────────────────────────────────────────
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to={getDefaultPath(user?.role)} replace />;
  }

  return children;
}

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public ── */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            <Route path="/account-pending" element={<AccountPending />} />
            <Route path="/referral" element={<ReferralPage />} />

            {/* ── Common ── */}
            <Route
              path="/welcome"
              element={
                <ProtectedRoute>
                  <Welcome />
                </ProtectedRoute>
              }
            />

            {/* ── Clinic Admin + Staff Feature Access ── */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tokens"
              element={
                <ProtectedRoute>
                  <PatientTokens />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctorscallboard"
              element={
                <ProtectedRoute>
                  <DoctorCallBoard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <Patients />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patientsdashboard"
              element={
                <ProtectedRoute>
                  <PatientsDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/patientsdashboard/:id"
              element={
                <ProtectedRoute>
                  <PatientsDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <Staff />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staffloginaccess"
              element={
                <ProtectedRoute>
                  <StaffLoginAccess />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendors"
              element={
                <ProtectedRoute>
                  <Vendors />
                </ProtectedRoute>
              }
            />

            <Route
              path="/purchaseorder"
              element={
                <ProtectedRoute>
                  <PurchaseOrders />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Inventory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/itemcategorymanager"
              element={
                <ProtectedRoute>
                  <ItemCategoryManager />
                </ProtectedRoute>
              }
            />

            <Route
              path="/assets"
              element={
                <ProtectedRoute>
                  <Assets />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bill"
              element={
                <ProtectedRoute>
                  <MedicalBills />
                </ProtectedRoute>
              }
            />

            <Route
              path="/billings"
              element={
                <ProtectedRoute>
                  <Billings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/subscriptionuser"
              element={
                <ProtectedRoute>
                  <SubscriptionUser />
                </ProtectedRoute>
              }
            />

            <Route
              path="/stocktransaction"
              element={
                <ProtectedRoute>
                  <StockTransactions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/departmentfieldconfig"
              element={
                <ProtectedRoute>
                  <DepartmentFieldConfig />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* ── Hospital / IPD ── */}
            <Route
              path="/wards"
              element={
                <ProtectedRoute>
                  <WardMaster />
                </ProtectedRoute>
              }
            />

            <Route
              path="/rooms"
              element={
                <ProtectedRoute>
                  <RoomMaster />
                </ProtectedRoute>
              }
            />

            <Route
              path="/beds"
              element={
                <ProtectedRoute>
                  <BedMaster />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ipd/admissions"
              element={
                <ProtectedRoute>
                  <IpdAdmissions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ipd/billing-discharge"
              element={
                <ProtectedRoute>
                  <IpdBillingDischarge />
                </ProtectedRoute>
              }
            />

            <Route
              path="/myattendence"
              element={
                <ProtectedRoute>
                  <MyAttendancePage />
                </ProtectedRoute>
              }
            />

            {/* ── SaaS Admin ── */}
            <Route
              path="/saasdashboard"
              element={
                <ProtectedRoute>
                  <SaasDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/clinic"
              element={
                <ProtectedRoute>
                  <Clinic />
                </ProtectedRoute>
              }
            />

            <Route
              path="/departments"
              element={
                <ProtectedRoute>
                  <Departments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/roles"
              element={
                <ProtectedRoute>
                  <Roles />
                </ProtectedRoute>
              }
            />

            <Route
              path="/features"
              element={
                <ProtectedRoute>
                  <Features />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />

            <Route
              path="/loginprice"
              element={
                <ProtectedRoute>
                  <LoginPrice />
                </ProtectedRoute>
              }
            />

            <Route
              path="/subscriptionssetup"
              element={
                <ProtectedRoute>
                  <SubscriptionsSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-attendences"
              element={
                <ProtectedRoute>
                  <StaffAttendance />
                </ProtectedRoute>
              }
            />

            <Route path="/my-payslip" element={<ProtectedRoute><MyPayslipPage /></ProtectedRoute>} />
            <Route path="/staff-payslips" element={<ProtectedRoute><StaffPayslipsPage /></ProtectedRoute>} />

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontSize: 13,
              borderRadius: 10,
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
            },
            success: {
              iconTheme: {
                primary: 'var(--primary)',
                secondary: '#fff',
              },
            },
            duration: 3000,
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}