// PaymentModal.jsx - Component for handling both payment options
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import Button from './Button';

const PaymentModal = ({ isOpen, onClose, bill, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  // OPTION 1: Admin marks as paid (Cash/Cheque/Offline)
  const handleAdminMarkAsPaid = async (method) => {
    setLoading(true);
    try {
      const transactionId = prompt('Enter transaction ID/reference number (optional):');
      const notes = prompt('Enter payment notes (optional):');
      
      const response = await fetch(`/api/subscription-setup/admin-mark-paid/${bill._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: method,
          transactionId: transactionId || `OFFLINE-${Date.now()}`,
          notes: notes || `Paid via ${method}`
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`Payment marked as ${method}. Subscription activated!`);
        onPaymentSuccess(data.data);
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to mark payment');
    } finally {
      setLoading(false);
    }
  };

  // OPTION 2: Razorpay payment
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    
    try {
      // Create order
      const orderResponse = await fetch(`/api/subscription-setup/create-order/${bill._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const orderData = await orderResponse.json();
      if (!orderData.success) {
        toast.error(orderData.message);
        return;
      }
      
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        return;
      }
      
      const options = {
        key: orderData.data.keyId,
        amount: orderData.data.amount * 100,
        currency: 'INR',
        name: 'Clinic Subscription',
        description: `Payment for ${bill.invoiceNo}`,
        order_id: orderData.data.orderId,
        handler: async (response) => {
          // Verify payment
          const verifyResponse = await fetch('/api/subscription-setup/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              billId: bill._id
            })
          });
          
          const verifyData = await verifyResponse.json();
          if (verifyData.success) {
            toast.success('Payment successful! Subscription activated.');
            onPaymentSuccess(verifyData.data);
            onClose();
          } else {
            toast.error(verifyData.message);
          }
        },
        prefill: {
          name: bill.clinic?.name || '',
          email: bill.clinic?.email || '',
        },
        theme: {
          color: '#F37254'
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Razorpay error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Process Payment"
      subtitle={`Invoice: ${bill?.invoiceNo} | Amount: ₹${bill?.amount}`}
      hideActions
      width={500}
    >
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Select Payment Method</h4>
          
          {/* Online Payment - Razorpay */}
          <div 
            onClick={() => setPaymentMethod('razorpay')}
            style={{
              border: `1px solid ${paymentMethod === 'razorpay' ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              cursor: 'pointer',
              background: paymentMethod === 'razorpay' ? 'var(--primary-light)' : 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input 
                type="radio" 
                checked={paymentMethod === 'razorpay'}
                onChange={() => setPaymentMethod('razorpay')}
              />
              <div>
                <div style={{ fontWeight: 600 }}>💳 Online Payment (Razorpay)</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Pay using Credit Card, Debit Card, UPI, Net Banking
                </div>
              </div>
            </div>
          </div>
          
          {/* Cash Payment */}
          <div 
            onClick={() => setPaymentMethod('cash')}
            style={{
              border: `1px solid ${paymentMethod === 'cash' ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              cursor: 'pointer',
              background: paymentMethod === 'cash' ? 'var(--primary-light)' : 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input 
                type="radio" 
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
              />
              <div>
                <div style={{ fontWeight: 600 }}>💵 Cash</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Mark as paid when cash is received
                </div>
              </div>
            </div>
          </div>
          
          {/* Cheque Payment */}
          <div 
            onClick={() => setPaymentMethod('cheque')}
            style={{
              border: `1px solid ${paymentMethod === 'cheque' ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              cursor: 'pointer',
              background: paymentMethod === 'cheque' ? 'var(--primary-light)' : 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input 
                type="radio" 
                checked={paymentMethod === 'cheque'}
                onChange={() => setPaymentMethod('cheque')}
              />
              <div>
                <div style={{ fontWeight: 600 }}>📝 Cheque</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Record cheque payment
                </div>
              </div>
            </div>
          </div>
          
          {/* Bank Transfer */}
          <div 
            onClick={() => setPaymentMethod('bank_transfer')}
            style={{
              border: `1px solid ${paymentMethod === 'bank_transfer' ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              cursor: 'pointer',
              background: paymentMethod === 'bank_transfer' ? 'var(--primary-light)' : 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input 
                type="radio" 
                checked={paymentMethod === 'bank_transfer'}
                onChange={() => setPaymentMethod('bank_transfer')}
              />
              <div>
                <div style={{ fontWeight: 600 }}>🏦 Bank Transfer</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Record NEFT/RTGS/IMPS payment
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          {paymentMethod === 'razorpay' ? (
            <Button onClick={handleRazorpayPayment} loading={loading}>
              Pay ₹{bill?.amount} Online
            </Button>
          ) : paymentMethod ? (
            <Button onClick={() => handleAdminMarkAsPaid(paymentMethod)} loading={loading}>
              Mark as Paid ({paymentMethod.replace('_', ' ')})
            </Button>
          ) : (
            <Button disabled>
              Select Payment Method
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;