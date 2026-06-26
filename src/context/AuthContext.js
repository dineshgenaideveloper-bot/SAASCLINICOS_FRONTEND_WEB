// client/src/context/AuthContext.js

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[-_/]/g, '')
    .trim();
}

function getFirstName(name) {
  return String(name || 'User').split(' ')[0];
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const saveUser = useCallback((userData) => {
    setUser(userData || null);

    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      saveUser(data?.data?.user || null);
    } catch (err) {
      saveUser(null);
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  }, [saveUser]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      fetchMe();
    } else {
      saveUser(null);
      setLoading(false);
    }

    const handleLogout = () => {
      saveUser(null);
      localStorage.removeItem('accessToken');
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [fetchMe, saveUser]);

  const login = useCallback(
    async (credentials) => {
      const { data } = await authAPI.login(credentials);

      localStorage.setItem('accessToken', data.accessToken);

      const loggedInUser = data?.data?.user || null;

      saveUser(loggedInUser);

      toast.success(`Welcome back, ${getFirstName(loggedInUser?.name)}!`);

      return loggedInUser;
    },
    [saveUser]
  );

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);

    toast.success(
      data.message || 'Registration successful. Wait for admin approval.'
    );

    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      // Ignore logout API error
    }

    saveUser(null);
    localStorage.removeItem('accessToken');

    toast.success('Logged out.');
  }, [saveUser]);

  const value = useMemo(() => {
    const role = normalize(user?.role);

    const isAdmin = role === 'admin';
    const isSaasAdmin = role === 'clinicossaassadmin';

    const userFeatures = Array.isArray(user?.features) ? user.features : [];

    const featureNames = userFeatures.map((feature) =>
      normalize(feature?.name || feature?.label || feature?.key || feature)
    );

    const hasRole = (...roles) => {
      return roles.map(normalize).includes(role);
    };

    const hasFeature = (featureName) => {
      return featureNames.includes(normalize(featureName));
    };

    const hasAnyFeature = (...features) => {
      return features.some((feature) => hasFeature(feature));
    };

    const canBill =
      isAdmin ||
      hasRole('billing', 'cashier', 'receptionist') ||
      hasAnyFeature(
        'Clinic Billing',
        'Billing History',
        'IPD Billing / Discharge'
      );

    const canManageInventory =
      isAdmin ||
      hasRole('pharmacist', 'storemanager') ||
      hasAnyFeature(
        'Inventory',
        'Stock Transactions',
        'Purchase Orders',
        'Vendors',
        'Assets'
      );

    const canManageIPD =
      isAdmin ||
      hasRole('doctor', 'nurse') ||
      hasAnyFeature(
        'Ward Master',
        'Room Master',
        'Bed Management',
        'IPD Admissions',
        'IPD Billing / Discharge'
      );

    return {
      user,
      loading,

      login,
      register,
      logout,
      fetchMe,

      role,
      isAdmin,
      isSaasAdmin,

      userFeatures,
      featureNames,

      hasRole,
      hasFeature,
      hasAnyFeature,

      canBill,
      canManageInventory,
      canManageIPD,
    };
  }, [user, loading, login, register, logout, fetchMe]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
};