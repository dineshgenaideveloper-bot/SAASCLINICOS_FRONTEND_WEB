import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import Button from '../components/Button';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { staffAttendanceAPI } from '../services/api';

function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported in this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

function formatTime(value) {
  if (!value) return '—';

  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMinutes(minutes) {
  const total = Number(minutes || 0);

  if (!total) return '—';

  const h = Math.floor(total / 60);
  const m = total % 60;

  if (!h) return `${m}m`;
  return `${h}h ${m}m`;
}

function getStatusColor(status) {
  if (status === 'checked_in') return 'blue';
  if (status === 'present') return 'green';
  if (status === 'absent') return 'red';
  return 'gray';
}

function getStaffName(staff, user) {
  return (
    staff?.name ||
    staff?.staffName ||
    staff?.fullName ||
    staff?.employeeName ||
    user?.name ||
    user?.email ||
    'Staff'
  );
}

function getInitials(name = '') {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getToday() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Welcome() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [statusData, setStatusData] = useState(null);

  const staff = statusData?.staff;
  const attendance = statusData?.attendance;
  const config = statusData?.config;

  const staffName = getStaffName(staff, user);

  const isCheckedIn = Boolean(attendance?.checkIn?.time);
  const isCheckedOut = Boolean(attendance?.checkOut?.time);

  const canCheckIn = !isCheckedIn;
  const canCheckOut = isCheckedIn && !isCheckedOut;

  const attendanceEnabled = Boolean(config && config.isEnabled !== false);

  const loadMyAttendance = async () => {
    try {
      setLoading(true);

      const res = await staffAttendanceAPI.getMyStatus();

      setStatusData(res.data?.data || null);
    } catch (error) {
      console.error(error);
      setStatusData(null);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to load attendance'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyAttendance();
  }, []);

  const submitAttendance = async (type) => {
    try {
      setLocationLoading(true);

      const position = await getBrowserLocation();

      const payload = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      if (type === 'check-in') {
        await staffAttendanceAPI.checkInMe(payload);
        toast.success('Check-in successful');
      } else {
        await staffAttendanceAPI.checkOutMe(payload);
        toast.success('Check-out successful');
      }

      await loadMyAttendance();
    } catch (error) {
      console.error(error);

      if (error.code === 1) {
        toast.error('Location permission denied');
      } else if (error.code === 2) {
        toast.error('Unable to get location');
      } else if (error.code === 3) {
        toast.error('Location request timed out');
      } else {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            'Attendance failed'
        );
      }
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <>
<style>{`
  .welcome-page {
    min-height: calc(100vh - 72px);
    width: 100%;
    margin: 0;
    padding: 0;
    background: #f8fafc;
  }

  .welcome-container {
    width: 100%;
    min-height: calc(100vh - 72px);
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 0;
  }

  .welcome-header {
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    border-radius: 0;
    padding: 32px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 28px;
    align-items: center;
    box-shadow: none;
  }

  .brand-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 22px;
  }

  .brand-icon {
    width: 46px;
    height: 46px;
    border-radius: 0;
    background: var(--primary);
    color: #ffffff;
    display: grid;
    place-items: center;
    font-weight: 900;
    font-size: 22px;
  }

  .brand-title {
    font-size: 20px;
    font-weight: 800;
    color: #111827;
  }

  .brand-subtitle {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .welcome-title {
    margin: 0;
    color: #111827;
    font-size: 34px;
    line-height: 1.15;
    letter-spacing: -0.6px;
  }

  .welcome-title span {
    color: var(--primary);
  }

  .welcome-text {
    margin: 12px 0 0;
    max-width: 760px;
    color: var(--text-muted);
    font-size: 15px;
    line-height: 1.7;
  }

  .quick-menu {
    margin-top: 24px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    border: 1px solid #e5e7eb;
  }

  .quick-item {
    padding: 18px;
    border-radius: 0;
    background: #ffffff;
    border-right: 1px solid #e5e7eb;
  }

  .quick-item:last-child {
    border-right: 0;
  }

  .quick-icon {
    width: 34px;
    height: 34px;
    border-radius: 0;
    display: grid;
    place-items: center;
    background: #eef2ff;
    margin-bottom: 10px;
    font-size: 17px;
  }

  .quick-item strong {
    display: block;
    color: #111827;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .quick-item span {
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.4;
  }

  .staff-card {
    border-radius: 0;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    padding: 22px;
    text-align: center;
  }

  .avatar {
    width: 78px;
    height: 78px;
    border-radius: 0;
    margin: 0 auto 14px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    color: var(--primary);
    display: grid;
    place-items: center;
    font-size: 26px;
    font-weight: 900;
  }

  .staff-name {
    font-size: 18px;
    font-weight: 800;
    color: #111827;
    margin-bottom: 5px;
  }

  .staff-meta {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 14px;
    word-break: break-word;
  }

  .date-box {
    margin-top: 16px;
    padding: 12px;
    border-radius: 0;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    text-align: left;
  }

  .date-box span {
    display: block;
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .date-box strong {
    font-size: 14px;
    color: #111827;
  }

  .attendance-card {
    background: #ffffff;
    border: 0;
    border-top: 1px solid #e5e7eb;
    border-radius: 0;
    padding: 32px;
    box-shadow: none;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
  }

  .card-header h2 {
    margin: 0;
    color: #111827;
    font-size: 22px;
  }

  .card-header p {
    margin: 6px 0 0;
    color: var(--text-muted);
    font-size: 14px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0;
    border: 1px solid #e5e7eb;
  }

  .info-box {
    border: 0;
    border-right: 1px solid #e5e7eb;
    background: #f9fafb;
    border-radius: 0;
    padding: 18px;
  }

  .info-box:last-child {
    border-right: 0;
  }

  .info-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  .info-value {
    font-size: 16px;
    color: #111827;
    font-weight: 800;
  }

  .notice {
    margin-top: 20px;
    padding: 14px 16px;
    border-radius: 0;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
    font-size: 14px;
    line-height: 1.6;
  }

  .notice.warning {
    background: #fffbeb;
    border-color: #fde68a;
    color: #92400e;
  }

  .notice.danger {
    background: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
  }

  .action-row {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  @media (max-width: 1000px) {
    .welcome-header {
      grid-template-columns: 1fr;
    }

    .info-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .info-box {
      border-bottom: 1px solid #e5e7eb;
    }
  }

  @media (max-width: 700px) {
    .welcome-header,
    .attendance-card {
      padding: 20px;
    }

    .quick-menu {
      grid-template-columns: 1fr;
    }

    .quick-item {
      border-right: 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .quick-item:last-child {
      border-bottom: 0;
    }

    .info-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .card-header {
      flex-direction: column;
    }
  }

  @media (max-width: 480px) {
    .welcome-header,
    .attendance-card {
      padding: 16px;
    }

    .welcome-title {
      font-size: 27px;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }

    .info-box {
      border-right: 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-box:last-child {
      border-bottom: 0;
    }

    .action-row {
      flex-direction: column;
    }
  }
`}</style>

      <div className="welcome-page">
        <div className="welcome-container">
          <section className="welcome-header">
            <div>
              <div className="brand-row">
                <div className="brand-icon">+</div>
                <div>
                  <div className="brand-title">ClinicOS</div>
                  <div className="brand-subtitle">
                   Hospital System
                  </div>
                </div>
              </div>

              <h1 className="welcome-title">
                Welcome, <span>{loading ? 'Loading...' : staffName}</span>
              </h1>

              <p className="welcome-text">
                Your account is active. This workspace is designed for clinic
                staff to manage daily operations, attendance, appointments, and
                patient service efficiently.
              </p>

              <div className="quick-menu">
                <div className="quick-item">
                  <div className="quick-icon">👨‍⚕️</div>
                  <strong>Patients</strong>
                  <span>View and manage patient records.</span>
                </div>

                <div className="quick-item">
                  <div className="quick-icon">📅</div>
                  <strong>Appointments</strong>
                  <span>Track today’s clinic schedule.</span>
                </div>

                <div className="quick-item">
                  <div className="quick-icon">🧾</div>
                  <strong>Billing</strong>
                  <span>Handle invoices and payments.</span>
                </div>
              </div>
            </div>

            <aside className="staff-card">
              <div className="avatar">{getInitials(staffName) || 'S'}</div>

              <div className="staff-name">
                {loading ? 'Loading...' : staffName}
              </div>

              <div className="staff-meta">
                {staff?.staffId || user?.email || 'Clinic Staff'}
              </div>

              <Badge color={getStatusColor(attendance?.status)}>
                {attendance?.status
                  ? String(attendance.status).replaceAll('_', ' ').toUpperCase()
                  : 'NOT CHECKED IN'}
              </Badge>

              <div className="date-box">
                <span>Today</span>
                <strong>{getToday()}</strong>
              </div>
            </aside>
          </section>

          <section className="attendance-card">
            <div className="card-header">
              <div>
                <h2>Staff Attendance</h2>
                <p>
                  Mark your check-in and check-out using clinic GPS verification.
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={loadMyAttendance}
                disabled={loading || locationLoading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            <div className="info-grid">
              <Info label="Clinic" value={config?.clinicName || '—'} />

              <Info
                label="Allowed Radius"
                value={config?.radiusMeters ? `${config.radiusMeters}m` : '—'}
              />

              <Info
                label="Check In"
                value={formatTime(attendance?.checkIn?.time)}
              />

              <Info
                label="Check Out"
                value={formatTime(attendance?.checkOut?.time)}
              />

              <Info
                label="Worked Time"
                value={formatMinutes(attendance?.workedMinutes)}
              />

              <Info
                label="Distance"
                value={
                  attendance?.checkIn?.distanceMeters != null
                    ? `${Math.round(attendance.checkIn.distanceMeters)}m`
                    : '—'
                }
              />
            </div>

            {!config && !loading && (
              <Alert type="warning">
                Attendance config is not saved for this clinic.
              </Alert>
            )}

            {config?.isEnabled === false && (
              <Alert type="danger">
                Attendance is disabled for this clinic.
              </Alert>
            )}

            {config && config.isEnabled !== false && (
              <div className="notice">
                GPS location is required. You must be within{' '}
                <strong>{config.radiusMeters || 100}m</strong> of the clinic to
                mark attendance.
              </div>
            )}

            <div className="action-row">
              <Button
                onClick={() => submitAttendance('check-in')}
                disabled={
                  loading ||
                  locationLoading ||
                  !canCheckIn ||
                  !attendanceEnabled
                }
              >
                {locationLoading ? 'Getting Location...' : 'Check In'}
              </Button>

              <Button
                variant="outline"
                onClick={() => submitAttendance('check-out')}
                disabled={
                  loading ||
                  locationLoading ||
                  !canCheckOut ||
                  !attendanceEnabled
                }
              >
                {locationLoading ? 'Getting Location...' : 'Check Out'}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function Info({ label, value }) {
  return (
    <div className="info-box">
      <div className="info-label">{label}</div>
      <div className="info-value">{value || '—'}</div>
    </div>
  );
}

function Alert({ type = 'warning', children }) {
  return <div className={`notice ${type}`}>{children}</div>;
}