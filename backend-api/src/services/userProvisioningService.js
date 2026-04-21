import { AppError } from "../utils/appError.js";

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

function choosePrimaryRole(roles = []) {
  const normalized = roles.map(normalizeRole).filter(Boolean);

  if (normalized.includes("ADMIN")) return "ADMIN";
  if (normalized.includes("UNDERWRITER")) return "UNDERWRITER";
  if (normalized.includes("AGENT")) return "AGENT";
  if (normalized.includes("CLAIMS_ADJUSTER")) return "CLAIMS_ADJUSTER";
  if (normalized.includes("CUSTOMER")) return "CUSTOMER";

  return normalized[0] || "CUSTOMER";
}

function splitName(identity) {
  if (identity.givenName || identity.familyName) {
    return {
      firstName: identity.givenName || "Keycloak",
      lastName: identity.familyName || "User"
    };
  }

  const fullName = String(identity.fullName || "").trim();
  if (!fullName) {
    return {
      firstName: identity.username || "Keycloak",
      lastName: "User"
    };
  }

  const parts = fullName.split(/\s+/);
  return {
    firstName: parts[0] || "Keycloak",
    lastName: parts.slice(1).join(" ") || "User"
  };
}

export async function findOrProvisionUserFromKeycloak(identity) {
  if (!identity || !identity.sub) {
    throw new AppError("Invalid Keycloak identity payload", 401);
  }

  if (!identity.roles || identity.roles.length === 0) {
    throw new AppError("Keycloak user has no mapped application roles", 403);
  }

  const { firstName, lastName } = splitName(identity);
  const email = String(identity.email || "").trim().toLowerCase();
  const primaryRole = choosePrimaryRole(identity.roles);

  return {
    _id: `kc:${identity.sub}`,
    keycloakSubject: identity.sub,
    username: identity.username || email || identity.sub,
    email,
    roles: identity.roles.map(normalizeRole),
    accountStatus: "ACTIVE",
    authSource: "KEYCLOAK",
    profile: {
      firstName,
      lastName,
      email,
      userType: primaryRole
    }
  };
}