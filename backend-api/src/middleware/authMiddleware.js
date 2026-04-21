import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError.js";
import { userRepository } from "../repositories/userRepository.js";
import { env } from "../config/env.js";
import { verifyKeycloakAccessToken } from "../services/keycloackService.js";

function getTokenFromRequest(req) {
  const authorizationHeader = req.headers.authorization || "";

  if (authorizationHeader.startsWith("Bearer ")) {
    return authorizationHeader.slice("Bearer ".length).trim();
  }

  if (req.cookies?.token) {
    return String(req.cookies.token);
  }

  return "";
}

function normalizeRoles(roles) {
  return (roles || []).map((role) => {
    if (typeof role === "string") return role;
    if (role && typeof role === "object" && role.name) return role.name;
    return String(role);
  });
}

function buildDelegatedUserFromLocalJwt(decoded) {
  return {
    _id: String(decoded.userId || ""),
    keycloakSubject: decoded.keycloakSubject || "",
    username: decoded.username || "",
    email: decoded.email || "",
    roles: normalizeRoles(decoded.roles),
    accountStatus: decoded.accountStatus || "ACTIVE",
    authSource: decoded.authSource || "LOCAL",
    profile: {
      firstName: decoded.profile?.firstName || "",
      lastName: decoded.profile?.lastName || "",
      email: decoded.profile?.email || decoded.email || "",
      userType: decoded.profile?.userType || ""
    }
  };
}

function buildDelegatedUserFromKeycloakIdentity(identity) {
  return {
    _id: `kc:${String(identity.sub || "")}`,
    keycloakSubject: String(identity.sub || ""),
    username: identity.username || "",
    email: identity.email || "",
    roles: normalizeRoles(identity.roles),
    accountStatus: "ACTIVE",
    authSource: "KEYCLOAK",
    profile: {
      firstName: identity.givenName || "",
      lastName: identity.familyName || "",
      email: identity.email || "",
      userType: ""
    }
  };
}

async function resolveLocalUser(decoded) {
  if (!decoded?.userId) return null;

  const userId = String(decoded.userId);

  // Skip Keycloak-linked users
  if (userId.startsWith("kc:")) return null;

  const user = await userRepository.findById(userId);
  if (!user) return null;

  const normalizedUser =
    typeof user.toObject === "function" ? user.toObject() : user;

  return {
    ...normalizedUser,
    _id: String(user._id),
    roles: normalizeRoles(user.roles),
    authSource: "LOCAL"
  };
}

function tryVerifyLocalJwt(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
}

async function tryVerifyKeycloakJwt(token) {
  try {
    return await verifyKeycloakAccessToken(token);
  } catch {
    return null;
  }
}

export async function authenticate(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return next(new AppError("Unauthorized", 401));
    }

    // Step 1: Try LOCAL JWT
    const localDecoded = tryVerifyLocalJwt(token);

    if (localDecoded) {
      // Case: local login OR exchanged Keycloak JWT
      if (localDecoded.authSource === "KEYCLOAK") {
        req.user = buildDelegatedUserFromLocalJwt(localDecoded);

        // BLOCK suspended users
        if (req.user.accountStatus === "SUSPENDED") {
          return next(new AppError("Account suspended", 403));
        }

        return next();
      }

      const localUser = await resolveLocalUser(localDecoded);

      if (!localUser) {
        return next(new AppError("Unauthorized", 401));
      }

      req.user = localUser;

      // BLOCK suspended users
      if (req.user.accountStatus === "SUSPENDED") {
        return next(new AppError("Account suspended", 403));
      }

      return next();
    }

    // Step 2: Try Keycloak access token
    const keycloakIdentity = await tryVerifyKeycloakJwt(token);

    if (keycloakIdentity) {
      req.user = buildDelegatedUserFromKeycloakIdentity(keycloakIdentity);

      // BLOCK suspended users (Keycloak users are always ACTIVE in your system)
      if (req.user.accountStatus === "SUSPENDED") {
        return next(new AppError("Account suspended", 403));
      }

      return next();
    }

    // Step 3: Reject
    return next(new AppError("Unauthorized", 401));
  } catch (error) {
    return next(error);
  }
}
