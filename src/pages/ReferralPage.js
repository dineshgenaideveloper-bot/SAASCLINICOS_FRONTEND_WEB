// client/src/pages/ReferralPage.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import Button from '../components/Button';
import Badge from '../components/Badge';

import { referralAPI } from '../services/api';

export default function ReferralPage() {
  const navigate = useNavigate();

  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payingId, setPayingId] = useState(null);

  const fetchInactiveClinics = async () => {
    try {
      setLoading(true);

      const res = await referralAPI.getInactiveClinics();

      setClinics(res.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch inactive clinics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInactiveClinics();
  }, []);

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

  const handleActivate = async (row) => {
    try {
      setPayingId(row.userId);

      const loaded = await loadRazorpayScript();

      if (!loaded) {
        toast.error('Razorpay SDK failed to load');
        return;
      }

      const orderRes = await referralAPI.createActivationOrder({
        userId: row.userId,
        amount: 499,
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
        description: 'Clinic Activation Fee',
        order_id: order.id,

        handler: async function (response) {
          try {
            await referralAPI.verifyActivationPayment({
              userId: row.userId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success('Clinic activated successfully');

            fetchInactiveClinics();
          } catch (error) {
            console.error(error);

            toast.error('Payment verification failed');
          }
        },

        prefill: {
          name: row.ownerName || '',
          email: row.ownerEmail || '',
        },

        notes: {
          tenantId: row.tenantId,
          clinicId: row.clinicId,
          userId: row.userId,
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
      console.error(error);

      toast.error('Payment failed');
    } finally {
      setPayingId(null);
    }
  };

  const columns = [
    {
      key: 'clinicName',
      label: 'Clinic',
    },
    {
      key: 'tenantId',
      label: 'Tenant ID',
    },
    {
      key: 'ownerName',
      label: 'Owner',
    },
    {
      key: 'ownerEmail',
      label: 'Email',
    },
    {
      key: 'city',
      label: 'City',
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <Badge color="red">Inactive</Badge>,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gap: 18,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              margin: '0 0 6px',
              color: 'var(--text)',
            }}
          >
            Referral Activation
          </h2>

          <p
            style={{
              margin: 0,
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            View inactive clinic accounts and activate them using ₹499 Razorpay
            payment.
          </p>
        </div>

        {/* BACK BUTTON */}
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 40,
            padding: '0 16px',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={15}
            height={15}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>

          Back
        </Button>
      </div>

      {/* TABLE */}
      <DataTable
        title="Inactive Clinics"
        subtitle="Only inactive admin clinic accounts are listed here."
        columns={columns}
        rows={clinics}
        loading={loading}
        emptyText="No inactive clinics found."
        actions={({ row }) => (
          <Button
            size="sm"
            variant="primary"
            disabled={payingId === row.userId}
            onClick={() => handleActivate(row)}
          >
            {payingId === row.userId
              ? 'Processing...'
              : 'Pay ₹499 & Activate'}
          </Button>
        )}
      />
    </div>
  );
}