// client/src/layouts/AppLayout.js

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common';
import { subscriptionUserAPI } from '../services/api';
import { navItems } from '../config/navItems';

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[-_/]/g, '')
    .trim();

const isPathActive = (pathname, itemPath) => {
  if (!itemPath) return false;
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};

const renderIcon = (icon, active = false, size = 16) => {
  if (!icon) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {icon.split(' M').map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  );
};

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState({});
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  const localUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const currentUser = user || localUser;
  const role = normalize(currentUser?.role);
  const email = String(currentUser?.email || '').toLowerCase().trim();

  const userFeatures = Array.isArray(currentUser?.features)
    ? currentUser.features
    : [];

  const featureNames = useMemo(() => {
    return userFeatures.map((feature) =>
      normalize(feature?.name || feature?.label || feature?.key || feature)
    );
  }, [userFeatures]);

  const hasFeatureAccess = useCallback(
    (item) => {
      const possibleNames = [
        item?.label,
        item?.key,
        item?.featureKey,
      ].map(normalize);

      return possibleNames.some((name) => featureNames.includes(name));
    },
    [featureNames]
  );

  const isVisibleItem = useCallback(
    (item) => {
      if (!role) return false;

      if (
        email === 'simplesoftwareclinicos@gmail.com' &&
        item.roles?.includes('clinicossaassadmin')
      ) {
        return true;
      }

      if (item.roles?.some((r) => normalize(r) === role)) {
        return true;
      }

      if (hasFeatureAccess(item)) {
        return true;
      }

      return false;
    },
    [role, email, hasFeatureAccess]
  );

  const visibleNavItems = useMemo(() => {
    return navItems
      .map((item) => {
        const parentVisible = isVisibleItem(item);

        if (Array.isArray(item.children) && item.children.length > 0) {
          const children = item.children.filter(isVisibleItem);

          if (parentVisible || children.length > 0) {
            return {
              ...item,
              children,
            };
          }

          return null;
        }

        return parentVisible ? item : null;
      })
      .filter(Boolean);
  }, [isVisibleItem]);

  const isGroupActive = useCallback(
    (item) => {
      if (item.path && isPathActive(location.pathname, item.path)) {
        return true;
      }

      if (Array.isArray(item.children)) {
        return item.children.some((child) =>
          isPathActive(location.pathname, child.path)
        );
      }

      return false;
    },
    [location.pathname]
  );

  useEffect(() => {
    const activeGroups = {};

    visibleNavItems.forEach((item) => {
      if (Array.isArray(item.children) && isGroupActive(item)) {
        activeGroups[item.key || item.label] = true;
      }
    });

    setOpenGroups((prev) => ({
      ...prev,
      ...activeGroups,
    }));
  }, [location.pathname, visibleNavItems, isGroupActive]);

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const fetchSubscription = useCallback(async () => {
    if (role === 'clinicossaassadmin') {
      setSubscriptionData(null);
      return;
    }

    try {
      setLoadingSubscription(true);

      const res = await subscriptionUserAPI.getMySubscription();
      const permission = res.data?.data?.permission;

      if (permission?.subscriptionEndDate) {
        setSubscriptionData(permission);
      } else {
        setSubscriptionData(null);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setSubscriptionData(null);
    } finally {
      setLoadingSubscription(false);
    }
  }, [role]);

  const calculateTimeLeft = useCallback(() => {
    if (!subscriptionData?.subscriptionEndDate) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const endDate = new Date(subscriptionData.subscriptionEndDate);
    const now = new Date();
    const difference = endDate - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      ),
      minutes: Math.floor(
        (difference % (1000 * 60 * 60)) / (1000 * 60)
      ),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  }, [subscriptionData?.subscriptionEndDate]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (!subscriptionData?.subscriptionEndDate) return;

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [subscriptionData?.subscriptionEndDate, calculateTimeLeft]);

  const hasActiveSubscription =
    Boolean(subscriptionData?.isActive) &&
    (timeLeft.days > 0 ||
      timeLeft.hours > 0 ||
      timeLeft.minutes > 0 ||
      timeLeft.seconds > 0);

  const isSubscriptionExpiring =
    hasActiveSubscription && timeLeft.days <= 7;

  const formatTimeDisplay = () => {
    if (!subscriptionData?.subscriptionEndDate) return null;
    if (!hasActiveSubscription) return null;

    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }

    if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }

    if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }

    return `${timeLeft.seconds}s`;
  };

  const getSubscriptionStatusColor = () => {
    if (!subscriptionData?.subscriptionEndDate) return 'var(--text-muted)';
    if (timeLeft.days <= 3 && hasActiveSubscription) return '#DC2626';
    if (timeLeft.days <= 7 && hasActiveSubscription) return '#F59E0B';
    return '#10B981';
  };

  const getSubscriptionBgColor = () => {
    if (!subscriptionData?.subscriptionEndDate) return '#F3F4F6';
    if (timeLeft.days <= 3 && hasActiveSubscription) return '#FEE2E2';
    if (timeLeft.days <= 7 && hasActiveSubscription) return '#FEF3C7';
    return '#ECFDF5';
  };

  const getSubscriptionBorderColor = () => {
    if (!subscriptionData?.subscriptionEndDate) return '#E5E7EB';
    if (timeLeft.days <= 3 && hasActiveSubscription) return '#FECACA';
    if (timeLeft.days <= 7 && hasActiveSubscription) return '#FDE68A';
    return '#D1FAE5';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      <aside
        style={{
          width: sidebarOpen ? 250 : 68,
          minWidth: sidebarOpen ? 250 : 68,
          background: '#fff',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s',
          overflow: 'hidden',
        }}
      >
        {/* BRAND */}
        <div
          style={{
            padding: '18px 14px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              background: 'var(--primary)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={18}
              height={18}
              fill="none"
              stroke="#fff"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>

          {sidebarOpen && (
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text)',
                  letterSpacing: '-0.3px',
                }}
              >
                ClinicOS
              </div>

              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Hospital System
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR NAV */}
        <nav
          style={{
            padding: '12px 8px',
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {visibleNavItems.length === 0 && sidebarOpen && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                padding: 12,
              }}
            >
              No menu available
            </div>
          )}

          {visibleNavItems.map((item) => {
            const groupKey = item.key || item.label;
            const hasChildren =
              Array.isArray(item.children) && item.children.length > 0;
            const groupActive = isGroupActive(item);
            const groupOpen = openGroups[groupKey];

            if (!hasChildren && item.path) {
              const active = isPathActive(location.pathname, item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: sidebarOpen ? '8px 10px' : '10px',
                    borderRadius: 8,
                    marginBottom: 4,
                    color: active
                      ? 'var(--primary)'
                      : 'var(--text-muted)',
                    background: active
                      ? 'var(--primary-light)'
                      : 'transparent',
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  }}
                >
                  {renderIcon(item.icon, active)}
                  {sidebarOpen && item.label}
                </Link>
              );
            }

            return (
              <div key={groupKey} style={{ marginBottom: 6 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!sidebarOpen) {
                      setSidebarOpen(true);
                      setOpenGroups((prev) => ({
                        ...prev,
                        [groupKey]: true,
                      }));
                      return;
                    }

                    toggleGroup(groupKey);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: sidebarOpen ? '9px 10px' : '10px',
                    borderRadius: 8,
                    color: groupActive
                      ? 'var(--primary)'
                      : 'var(--text-muted)',
                    background: groupActive
                      ? 'var(--primary-light)'
                      : 'transparent',
                    fontWeight: groupActive ? 700 : 600,
                    fontSize: 13,
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    justifyContent: sidebarOpen
                      ? 'flex-start'
                      : 'center',
                    transition: 'all 0.15s',
                  }}
                  title={item.label}
                >
                  {renderIcon(item.icon, groupActive)}

                  {sidebarOpen && (
                    <>
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.label}
                      </span>

                      <svg
                        viewBox="0 0 24 24"
                        width={14}
                        height={14}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: groupOpen
                            ? 'rotate(90deg)'
                            : 'rotate(0deg)',
                          transition: 'transform 0.15s',
                          flexShrink: 0,
                        }}
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </>
                  )}
                </button>

                {sidebarOpen && groupOpen && (
                  <div
                    style={{
                      marginTop: 4,
                      marginLeft: 12,
                      paddingLeft: 10,
                      borderLeft: '1px solid var(--border)',
                    }}
                  >
                    {item.children.map((child) => {
                      const active = isPathActive(
                        location.pathname,
                        child.path
                      );

                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 9,
                            padding: '7px 9px',
                            borderRadius: 8,
                            marginBottom: 2,
                            color: active
                              ? 'var(--primary)'
                              : 'var(--text-muted)',
                            background: active
                              ? 'var(--primary-light)'
                              : 'transparent',
                            fontWeight: active ? 700 : 500,
                            fontSize: 12.5,
                            textDecoration: 'none',
                            transition: 'all 0.15s',
                          }}
                        >
                          {renderIcon(child.icon, active, 14)}

                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {child.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div
          style={{
            padding: '12px 8px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 8,
              width: '100%',
              color: 'var(--text-muted)',
              fontSize: 12,
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d={
                  sidebarOpen
                    ? 'M11 17l-5-5 5-5M17 12H6'
                    : 'M13 17l5-5-5-5M7 12h10'
                }
              />
            </svg>

            {sidebarOpen && 'Collapse'}
          </button>

          {sidebarOpen && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 10px 4px',
              }}
            >
              <Avatar name={currentUser?.name || ''} size={28} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentUser?.name || 'User'}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color:
                      role === 'clinicossaassadmin'
                        ? 'var(--primary)'
                        : 'var(--text-muted)',
                    textTransform: 'capitalize',
                    fontWeight: role === 'clinicossaassadmin' ? 700 : 500,
                  }}
                >
                  {role === 'clinicossaassadmin'
                    ? 'SaaS Admin'
                    : currentUser?.role || 'User'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                style={{
                  padding: 4,
                  borderRadius: 6,
                  color: 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width={15}
                  height={15}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN AREA */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            height: 54,
            background: '#fff',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }} />

          {!loadingSubscription && hasActiveSubscription && (
            <div
              onClick={() => navigate('/subscriptionuser')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                borderRadius: 20,
                background: getSubscriptionBgColor(),
                border: `1px solid ${getSubscriptionBorderColor()}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width={14}
                height={14}
                fill="none"
                stroke={getSubscriptionStatusColor()}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: getSubscriptionStatusColor(),
                }}
              >
                {isSubscriptionExpiring ? 'Expiring Soon' : 'Active'}
              </span>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: getSubscriptionStatusColor(),
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px',
                }}
              >
                {formatTimeDisplay()}
              </span>
            </div>
          )}

          {!loadingSubscription &&
            !hasActiveSubscription &&
            role !== 'clinicossaassadmin' &&
            subscriptionData && (
              <button
                type="button"
                onClick={() => navigate('/subscriptionuser')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: '#FEE2E2',
                  border: '1px solid #FECACA',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#DC2626',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width={14}
                  height={14}
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Subscription Expired
              </button>
            )}

          <button
            type="button"
            onClick={() => navigate('/referral')}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 8,
              border: '1px solid var(--primary-light)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Referral Admit
          </button>

          <div style={{ position: 'relative' }}>
            <svg
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              viewBox="0 0 24 24"
              width={14}
              height={14}
              fill="none"
              stroke="var(--text-light)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx={11} cy={11} r={8} />
              <path d="m21 21-4.35-4.35" />
            </svg>

            <input
              placeholder="Search patients, invoices…"
              style={{
                paddingLeft: 32,
                paddingRight: 12,
                paddingTop: 6,
                paddingBottom: 6,
                width: 260,
                borderRadius: 8,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                fontSize: 12,
              }}
            />
          </div>

          <button
            type="button"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              position: 'relative',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={15}
              height={15}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>

            <span
              style={{
                position: 'absolute',
                top: 7,
                right: 7,
                width: 6,
                height: 6,
                background: '#E24B4A',
                borderRadius: '50%',
                border: '1.5px solid #fff',
              }}
            />
          </button>

          <Avatar name={currentUser?.name || ''} size={30} />
        </header>

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
          }}
          className="fade-in"
        >
          {children}
        </main>
      </div>
    </div>
  );
}