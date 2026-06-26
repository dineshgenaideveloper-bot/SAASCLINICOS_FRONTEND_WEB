// client/src/pages/Register.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { FormField } from '../components/FormField';

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

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

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    clinicName: '',
    clinicCity: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (key) => (e) => {
    setForm({
      ...form,
      [key]: e.target.value,
    });
  };

  const handle = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await register(form);

      if (response?.success) {
        setSuccess(
          response.message ||
            'Registration successful. Wait for admin approval.'
        );

        setForm({
          name: '',
          email: '',
          password: '',
          clinicName: '',
          clinicCity: '',
        });

        setTimeout(() => {
          navigate('/login');
        }, 2000);

        return;
      }

      setError(
        response?.message ||
          'Registration failed. Please try again.'
      );
    } catch (err) {
      console.log(err);

      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Registration failed. Please try again.';

      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#fff',
          borderRadius: 16,
          border: '1px solid var(--border)',
          padding: '40px 44px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            Create Account
          </h2>

          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Register your clinic account
          </p>
        </div>

        <form
          onSubmit={handle}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <FormField label="Full Name" required icon={<UserIcon />}>
            <input
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={set('name')}
              required
            />
          </FormField>

          <FormField label="Email Address" required icon={<EmailIcon />}>
            <input
              type="email"
              placeholder="admin@clinic.com"
              value={form.email}
              onChange={set('email')}
              required
            />
          </FormField>

          <FormField label="Password" required icon={<LockIcon />}>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              required
            />
          </FormField>

          <FormField label="Clinic Name" required>
            <input
              type="text"
              placeholder="Clinic Name"
              value={form.clinicName}
              onChange={set('clinicName')}
              required
            />
          </FormField>

          <FormField label="Clinic City">
            <input
              type="text"
              placeholder="Chennai"
              value={form.clinicCity}
              onChange={set('clinicCity')}
            />
          </FormField>

          {error && (
            <div
              style={{
                background: 'var(--red-light)',
                color: 'var(--red)',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: 'var(--green-light)',
                color: 'var(--green)',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {success} Redirecting to login...
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            style={{
              width: '100%',
              height: 42,
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <p
          style={{
            marginTop: 24,
            fontSize: 13,
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--primary)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}