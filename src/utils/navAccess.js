// client/src/utils/navAccess.js

import { matchPath } from 'react-router-dom';

export function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[-_/]/g, '')
    .trim();
}

export function getDefaultPath(role) {
  const r = normalize(role);

  if (r === 'admin') return '/dashboard';
  if (r === 'clinicossaassadmin') return '/saasdashboard';

  return '/welcome';
}

export function findNavItemByPath(items, pathname) {
  for (const item of items) {
    if (item.path) {
      const matched = matchPath(
        {
          path: item.path,
          end: true,
        },
        pathname
      );

      if (matched) return item;
    }

    if (Array.isArray(item.children)) {
      const childMatch = findNavItemByPath(item.children, pathname);

      if (childMatch) return childMatch;
    }
  }

  return null;
}

export function getUserFeatureNames(user) {
  const features = Array.isArray(user?.features) ? user.features : [];

  return features.map((feature) =>
    normalize(feature?.name || feature?.label || feature?.key || feature)
  );
}

export function userHasFeatureAccess(user, navItem) {
  const featureNames = getUserFeatureNames(user);

  const possibleFeatureNames = [
    navItem?.label,
    navItem?.key,
    navItem?.featureKey,
  ].map(normalize);

  return possibleFeatureNames.some((name) => featureNames.includes(name));
}

export function userHasRoleAccess(userRole, roles = []) {
  const role = normalize(userRole);

  return roles.map(normalize).includes(role);
}

export function userCanAccessNavItem(user, navItem) {
  if (!user || !navItem) return false;

  const role = normalize(user?.role);

  if (role === 'admin' || role === 'clinicossaassadmin') {
    return true;
  }

  const allowedByRole = userHasRoleAccess(role, navItem.roles);
  const allowedByFeature = userHasFeatureAccess(user, navItem);

  return allowedByRole || allowedByFeature;
}

export function filterNavItemsByUser(items, user) {
  return items
    .map((item) => {
      const parentAllowed = userCanAccessNavItem(user, item);

      if (Array.isArray(item.children) && item.children.length > 0) {
        const children = item.children.filter((child) =>
          userCanAccessNavItem(user, child)
        );

        if (parentAllowed || children.length > 0) {
          return {
            ...item,
            children,
          };
        }

        return null;
      }

      return parentAllowed ? item : null;
    })
    .filter(Boolean);
}