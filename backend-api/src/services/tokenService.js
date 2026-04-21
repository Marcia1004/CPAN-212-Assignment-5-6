import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

function normalizeRoles(roles) {
  return (roles || []).map((role) => {
    if (typeof role === "string") {
      return role;
    }

    if (role && typeof role === "object" && role.name) {
      return role.name;
    }

    return String(role);
  });
}

export const tokenService = {
  generateAccessToken(user) {
    const roles = normalizeRoles(user.roles);
    const profile = user.profile || {};

    return jwt.sign(
      {
        userId: String(user._id || ""),
        keycloakSubject: user.keycloakSubject || "",
        username: user.username || "",
        email: user.email || profile.email || "",
        roles,
        accountStatus: user.accountStatus || "ACTIVE",
        authSource: user.authSource || "LOCAL",
        profile: {
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: profile.email || user.email || "",
          userType: profile.userType || roles[0] || ""
        }
      },
      env.jwtSecret,
      {
        expiresIn: env.jwtExpiresIn || "2h"
      }
    );
  },

  verifyAccessToken(token) {
    return jwt.verify(token, env.jwtSecret);
  }
};