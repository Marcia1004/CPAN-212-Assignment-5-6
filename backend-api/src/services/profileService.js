import { User } from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { stripSensitiveUserFields } from "../utils/safeObject.js";

export const profileService = {
  async getOwnProfile(user) {
    // If user comes from Keycloak (delegated auth)
    if (user?.authSource === "KEYCLOAK") {
      return {
        _id: user._id,
        username: user.username,
        roles: user.roles,
        accountStatus: user.accountStatus || "ACTIVE",
        profile: user.profile || {
          firstName: "",
          lastName: "",
          email: user.email || "",
          userType: ""
        }
      };
    }

    const dbUser = await User.findById(user._id).populate("roles");
    if (!dbUser) {
      throw new AppError("User not found", 404);
    }

    return stripSensitiveUserFields(dbUser);
  },

  async updateOwnProfile(user, updates) {
    if (user?.authSource === "KEYCLOAK") {
      throw new AppError(
        "Profile updates are not supported for delegated Keycloak users",
        403
      );
    }

    const dbUser = await User.findById(user._id).populate("roles");
    if (!dbUser) {
      throw new AppError("User not found", 404);
    }

    // Update allowed profile fields
    Object.assign(dbUser.profile, updates);
    await dbUser.save();

    const refreshedUser = await User.findById(user._id).populate("roles");
    return stripSensitiveUserFields(refreshedUser);
  },

  async suspendOwnProfile(user) {
    if (user?.authSource === "KEYCLOAK") {
      throw new AppError(
        "Self-suspension is not supported for delegated Keycloak users",
        403
      );
    }

    const dbUser = await User.findById(user._id).populate("roles");
    if (!dbUser) {
      throw new AppError("User not found", 404);
    }

    // Admin CANNOT suspend themselves
    if (dbUser.roles.some(r => r.name === "Admin")) {
      throw new AppError("Admins cannot suspend their own account", 403);
    }

    // Update status
    dbUser.accountStatus = "SUSPENDED";
    await dbUser.save();

    const refreshedUser = await User.findById(user._id).populate("roles");
    return stripSensitiveUserFields(refreshedUser);
  }
};
