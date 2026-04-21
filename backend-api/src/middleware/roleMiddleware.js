import { errorResponse } from "../utils/apiResponse.js";

function normalizeRoleName(role) {
  if (!role) {
    return "";
  }

  if (typeof role === "string") {
    return role.trim().toUpperCase();
  }

  if (typeof role === "object" && role.name) {
    return String(role.name).trim().toUpperCase();
  }

  return String(role).trim().toUpperCase();
}

function extractUserRoleNames(user) {
  if (!user) {
    return [];
  }

  const directRoles = Array.isArray(user.roles) ? user.roles : [];
  const normalizedRoles = directRoles
    .map(normalizeRoleName)
    .filter(Boolean);

  const profileUserType = normalizeRoleName(user.profile?.userType);

  if (profileUserType && !normalizedRoles.includes(profileUserType)) {
    normalizedRoles.push(profileUserType);
  }

  return [...new Set(normalizedRoles)];
}

export function authorizeRoles(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles
    .map(normalizeRoleName)
    .filter(Boolean);

  return (req, res, next) => {
    const userRoleNames = extractUserRoleNames(req.user);

    if (normalizedAllowedRoles.length === 0) {
      return next();
    }

    const hasAccess = normalizedAllowedRoles.some((role) =>
      userRoleNames.includes(role)
    );

    if (!hasAccess) {
      return errorResponse(res, "Forbidden: insufficient role access", 403);
    }

    return next();
  };
}