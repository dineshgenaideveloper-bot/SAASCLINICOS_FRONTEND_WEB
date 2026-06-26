import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import Badge from '../../components/Badge';
import Button from '../../components/Button';

import { doctorCallBoardAPI } from '../../services/api';

const getToday = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

const getStoredUser = () => {
  try {
    const keys = ['user', 'authUser', 'loggedUser', 'currentUser'];

    for (const key of keys) {
      const raw = localStorage.getItem(key);

      if (raw) {
        return JSON.parse(raw);
      }
    }

    return null;
  } catch {
    return null;
  }
};

export default function DoctorCallBoard() {
  const navigate = useNavigate();

  const [tokens, setTokens] = useState([]);
  const [staff, setStaff] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    waiting: 0,
    called: 0,
    completed: 0,
    cancelled: 0,
  });

  const [date, setDate] = useState(getToday());
  const [loading, setLoading] = useState(false);

  const loggedUser = useMemo(() => getStoredUser(), []);
  const loggedUserId = loggedUser?._id || '';

const fetchTokens = async () => {
  try {
    setLoading(true);

    const res = await doctorCallBoardAPI.getMyTokens({
      date,
      userId: loggedUserId,
    });

    const data = res.data?.data || {};
    const doctorTokens = data.tokens || [];

    console.log('DOCTOR CALL BOARD FULL RESPONSE:', res.data);
    console.log('DOCTOR CALL BOARD DATA:', data);
    console.log('DOCTOR / STAFF:', data.staff);
    console.log('DOCTOR PATIENT TOKENS:', doctorTokens);

    console.table(
      doctorTokens.map((token) => ({
        tokenNumber: token.tokenNumber,
        patientName: token.patientName,
        patientPhone: token.patientPhone,
        status: token.status,
        department: token.departmentName,
        specialization: token.specializationName,
        doctor: token.staffName,
      }))
    );

    setTokens(doctorTokens);

    setStats(
      data.stats || {
        total: 0,
        waiting: 0,
        called: 0,
        completed: 0,
        cancelled: 0,
      }
    );

    setStaff(data.staff || null);
  } catch (error) {
    console.error('FETCH CALL BOARD ERROR:', error);
    console.error('ERROR RESPONSE:', error.response?.data);

    toast.error(
      error.response?.data?.message || error.message || 'Failed to fetch call board'
    );
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    if (loggedUserId) {
      fetchTokens();
    }
  }, [date, loggedUserId]);

  const handleCall = async (token) => {
    try {
      await doctorCallBoardAPI.callToken(token._id, {
        userId: loggedUserId,
      });

      toast.success(`Called ${token.tokenNumber}`);

      fetchTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to call token');
    }
  };

  const handleComplete = async (token) => {
    try {
      const res = await doctorCallBoardAPI.completeToken(token._id, {
        userId: loggedUserId,
      });

      console.log('COMPLETE TOKEN RESPONSE:', res.data);

      const patient = res.data?.data?.patient;
      const isNew = res.data?.data?.isNew;
      const prePopulatedData = res.data?.data?.prePopulatedData;

      if (patient?._id) {
        navigate(`/patientsdashboard/${patient._id}`, {
          state: {
            patient,
            token,
            isNew,
            prePopulatedData, // This will tell the form to use existing data or empty
          },
        });
        return;
      }

      toast.success(`Completed ${token.tokenNumber}`);
      fetchTokens();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to complete token');
    }
  };
  const handleCancel = async (token) => {
    if (!window.confirm(`Cancel ${token.tokenNumber}?`)) return;

    try {
      await doctorCallBoardAPI.cancelToken(token._id, {
        userId: loggedUserId,
      });

      toast.success(`Cancelled ${token.tokenNumber}`);

      fetchTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel token');
    }
  };

  const waitingTokens = tokens.filter((x) => x.status === 'waiting');
  const calledTokens = tokens.filter((x) => x.status === 'called');
  const currentCalled = calledTokens[0];

  const getStatusColor = (status) => {
    if (status === 'waiting') return 'orange';
    if (status === 'called') return 'blue';
    if (status === 'completed') return 'green';
    if (status === 'cancelled') return 'red';

    return 'gray';
  };

  const StatCard = ({ label, value }) => (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#6b7280',
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
        }}
      >
        {value || 0}
      </div>
    </div>
  );

  const TokenCard = ({ token }) => (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: 16,
        display: 'grid',
        gap: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            {token.tokenNumber}
          </div>

          <div
            style={{
              fontSize: 13,
              color: '#6b7280',
            }}
          >
            {token.departmentName || '—'}

            {token.specializationName
              ? ` • ${token.specializationName}`
              : ''}
          </div>
        </div>

        <Badge color={getStatusColor(token.status)}>
          {String(token.status || '').toUpperCase()}
        </Badge>
      </div>

      <div>
        <div style={{ fontWeight: 700 }}>
          {token.patientName}
        </div>

        <div
          style={{
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          {token.patientPhone || 'No phone'}
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          background: '#f9fafb',
          padding: 8,
          borderRadius: 10,
          color: '#374151',
        }}
      >
        Assigned Doctor:{' '}
        <strong>{token.staffName || staff?.name || '—'}</strong>
      </div>

      {token.notes && (
        <div
          style={{
            fontSize: 13,
            background: '#fff7ed',
            padding: 8,
            borderRadius: 10,
            color: '#9a3412',
          }}
        >
          {token.notes}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {token.status === 'waiting' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleCall(token)}
          >
            Call Patient
          </Button>
        )}

        {token.status === 'called' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleComplete(token)}
          >
            Complete & Open Enquiry
          </Button>
        )}

        <Button
          size="sm"
          variant="danger"
          onClick={() => handleCancel(token)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  if (!loggedUserId) {
    return (
      <div
        style={{
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: 16,
          padding: 20,
          color: '#9a3412',
          fontWeight: 700,
        }}
      >
        Logged-in user not found in localStorage.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: 20,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff, #f8fafc)',
          border: '1px solid #dbeafe',
          borderRadius: 20,
          padding: 22,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            Doctor Call Board
          </div>

          <div
            style={{
              color: '#6b7280',
              marginTop: 4,
            }}
          >
            Logged User:{' '}
            <strong>{loggedUser?.name || loggedUser?.email || '—'}</strong>
          </div>

          <div
            style={{
              color: '#6b7280',
              marginTop: 2,
            }}
          >
            User ID: <strong>{loggedUserId}</strong>
          </div>

          <div
            style={{
              color: '#6b7280',
              marginTop: 2,
            }}
          >
            Doctor / Staff:{' '}
            <strong>{staff?.name || 'No staff linked to this user ID'}</strong>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              height: 42,
              borderRadius: 10,
              border: '1px solid #d1d5db',
              padding: '0 12px',
            }}
          />

          <Button
            size="sm"
            variant="secondary"
            onClick={fetchTokens}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 14,
        }}
      >
        <StatCard label="Assigned Today" value={stats.total} />
        <StatCard label="Waiting" value={stats.waiting} />
        <StatCard label="Called" value={stats.called} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="Cancelled" value={stats.cancelled} />
      </div>

      {!staff && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 16,
            padding: 18,
            color: '#991b1b',
            fontWeight: 700,
          }}
        >
          No staff/doctor record found for this logged-in user ID.
        </div>
      )}

      {currentCalled && (
        <div
          style={{
            background: '#ecfeff',
            border: '1px solid #a5f3fc',
            borderRadius: 20,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: '#0e7490',
              fontWeight: 700,
            }}
          >
            CURRENTLY CALLED
          </div>

          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              marginTop: 8,
            }}
          >
            {currentCalled.tokenNumber}
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {currentCalled.patientName}
          </div>

          <div
            style={{
              color: '#64748b',
              marginTop: 4,
            }}
          >
            {currentCalled.departmentName}

            {currentCalled.specializationName
              ? ` • ${currentCalled.specializationName}`
              : ''}
          </div>

          <div style={{ marginTop: 16 }}>
            <Button
              variant="primary"
              onClick={() => handleComplete(currentCalled)}
            >
              Complete & Open Enquiry
            </Button>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
        }}
      >
        <div>
          <h3 style={{ marginBottom: 12 }}>
            Waiting Patients
          </h3>

          <div
            style={{
              display: 'grid',
              gap: 12,
            }}
          >
            {loading ? (
              <div>Loading...</div>
            ) : waitingTokens.length === 0 ? (
              <div style={{ color: '#6b7280' }}>
                No waiting patients assigned to you.
              </div>
            ) : (
              waitingTokens.map((token) => (
                <TokenCard key={token._id} token={token} />
              ))
            )}
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: 12 }}>
            Called Patients
          </h3>

          <div
            style={{
              display: 'grid',
              gap: 12,
            }}
          >
            {loading ? (
              <div>Loading...</div>
            ) : calledTokens.length === 0 ? (
              <div style={{ color: '#6b7280' }}>
                No called patients assigned to you.
              </div>
            ) : (
              calledTokens.map((token) => (
                <TokenCard key={token._id} token={token} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}