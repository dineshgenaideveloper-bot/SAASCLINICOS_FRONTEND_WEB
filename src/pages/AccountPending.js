// client/src/pages/AccountPending.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import { accountSetupAPI } from '../services/api';

export default function AccountPending() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayAndActivate = async () => {
    try {
      setLoading(true);

      const loaded = await loadRazorpayScript();

      if (!loaded) {
        toast.error('Razorpay SDK failed to load');
        return;
      }

      const orderRes = await accountSetupAPI.createActivationOrder({
        amount: 2499,
      });

      const { order, keyId } = orderRes.data?.data || {};

      if (!order?.id || !keyId) {
        toast.error('Unable to create payment order');
        return;
      }

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'ClinicOS',
        description: 'Account Activation Fee',
        order_id: order.id,

        handler: async function (response) {
          try {
            await accountSetupAPI.verifyActivationPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success('Payment successful. Account activated.');

            setTimeout(() => {
              navigate('/login');
            }, 1500);
          } catch (error) {
            console.error('Verify payment error:', error);
            toast.error('Payment verification failed');
          }
        },

        theme: {
          color: '#0F6E56',
        },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on('payment.failed', function () {
        toast.error('Payment failed');
      });

      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed');
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
          maxWidth: 500,
          background: '#fff',
          borderRadius: 18,
          padding: '48px 40px',
          textAlign: 'center',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            margin: '0 auto 24px',
            borderRadius: '50%',
            background: 'var(--amber-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={38}
            height={38}
            fill="none"
            stroke="var(--amber)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 14 }}>
          Account Activation Required
        </h1>

        <p
          style={{
            fontSize: 15,
            color: 'var(--text-muted)',
            lineHeight: 1.8,
            marginBottom: 24,
          }}
        >
          Your clinic account has been created successfully.
          <br />
          Pay ₹2499 to activate your admin account.
        </p>

        <div
          style={{
            background: 'var(--amber-light)',
            color: 'var(--amber)',
            padding: '14px 18px',
            borderRadius: 10,
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          Status: Inactive
        </div>

        <Button
          variant="primary"
          onClick={handlePayAndActivate}
          disabled={loading}
          style={{ width: '100%', height: 44, marginBottom: 12 }}
        >
          {loading ? 'Processing...' : 'Pay ₹2499 & Activate'}
        </Button>

        <Button
          variant="secondary"
          onClick={() => navigate('/login')}
          style={{ width: '100%', height: 44 }}
        >
          Go To Login
        </Button>
      </div>
    </div>
  );
}