// client/src/pages/Login.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { FormField } from '../components/FormField';

const FEATURES = [
  'Patient registry with full visit history',
  'GST-ready billing & invoicing',
  'Role-based staff access control',
  'Subscription & plan management',
];

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx={12} cy={12} r={10} />
    <line x1={12} y1={8} x2={12} y2={12} />
    <line x1={12} y1={16} x2={12.01} y2={16} />
  </svg>
);

const getRedirectPath = (role) => {
  const normalizedRole = role?.toLowerCase()?.trim();

  switch (normalizedRole) {
    case 'clinicossaassadmin':
      return '/dashboard';
    case 'admin':
      return '/dashboard';
    case 'doctor':
    case 'nurse':
    case 'receptionist':
    case 'patient':
      return '/patientsdashboard';
    case 'billing':
      return '/billing';
    default:
      return '/dashboard';
  }
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await login(form);

      const userData = response?.user || response;

      if (!userData?.role) {
        setError('Unable to determine user role. Please contact support.');
        return;
      }

      const role = userData.role.toLowerCase().trim();

      const redirectPath = getRedirectPath(role);

      navigate(redirectPath, { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        err.message ||
        'Login failed. Please check your credentials.';

      setError(errorMessage);

      const lowerMessage = errorMessage.toLowerCase();

      if (
        lowerMessage.includes('inactive') ||
        lowerMessage.includes('activation') ||
        lowerMessage.includes('payment')
      ) {
        setTimeout(() => {
          navigate('/account-pending', {
            state: {
              email: form.email,
            },
          });
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)', fontFamily: 'inherit' }}>
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(160deg, var(--primary-dark) 0%, var(--primary) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 56px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', top: -80, right: -80 }} />
        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', bottom: 40, left: -60 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52, alignSelf: 'flex-start' }}>
          <div
            style={{
              width: 42,
              height: 42,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>

          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
             SAAS ClinicOS
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
              Practice Management
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 360, marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 14 }}>
            Manage your clinic smarter, not harder
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75 }}>
            Patients · Billing · Staff · Subscriptions — everything in one secure platform built for modern Indian clinics.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'flex-start' }}>
          {FEATURES.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.88)' }}>
                {f}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          width: 480,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 52px',
          background: '#fff',
        }}
      >
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Sign in to your ClinicOS account
            </p>
          </div>

          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Email address" required icon={<EmailIcon />}>
              <input
                type="email"
                placeholder="doctor@clinic.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </FormField>

            <FormField label="Password" required icon={<LockIcon />}>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </FormField>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  background: 'var(--red-light)',
                  color: 'var(--red)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  border: '1px solid rgba(163,45,45,0.15)',
                }}
              >
                <AlertIcon />
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              style={{ width: '100%', marginTop: 4, height: 42 }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            New clinic?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}