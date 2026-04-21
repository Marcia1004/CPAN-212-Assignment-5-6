import { userRepository } from "../repositories/userRepository.js";
import { roleRepository } from "../repositories/roleRepository.js";
import { AppError } from "../utils/appError.js";
import { stripSensitiveUserFields } from "../utils/safeObject.js";
import bcrypt from "bcryptjs";


// Helper: check if user is Keycloak
function isKeycloakUser(user) {
  return String(user._id).startsWith("kc:");
}

// Helper: check if user has Admin role
function hasAdminRole(user) {
  return user.roles?.some(r => r.name === "ADMIN");
}

// Helper: count active admins
async function countActiveAdmins() {
  const admins = await userRepository.findAll();
  return admins.filter(u =>
    u.accountStatus === "ACTIVE" &&
    hasAdminRole(u)
  ).length;
}

export const userAdminService = {

  // ---------------------------------------------------------
  // LIST USERS (with optional filters)
  // ---------------------------------------------------------
  async listUsers(filters = {}) {
    const users = await userRepository.findAll();

    let result = users;

    if (filters.role) {
      result = result.filter(u =>
        u.roles.some(r => r.name === filters.role)
      );
    }

    if (filters.status) {
      result = result.filter(u =>
        u.accountStatus === filters.status
      );
    }

    return result.map(stripSensitiveUserFields);
  },

  // ---------------------------------------------------------
  // LIST CUSTOMERS
  // ---------------------------------------------------------
  async listCustomers() {
    const users = await userRepository.findCustomers();
    return users.map(stripSensitiveUserFields);
  },

  // ---------------------------------------------------------
  // GET USER BY ID
  // ---------------------------------------------------------
  async getUserById(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    return stripSensitiveUserFields(user);
  },

  // ---------------------------------------------------------
  // CREATE USER
  // ---------------------------------------------------------
  async createUser(data) {
    const { username, password, roles, profile } = data;

    const existing = await userRepository.findByUsername(username);
    if (existing) throw new AppError("Username already exists", 400);

    const roleDocs = await roleRepository.findByNames(roles);
    if (!roleDocs.length) throw new AppError("Invalid roles", 400);

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await userRepository.create({
      username,
      passwordHash,
      roles: roleDocs.map(r => r._id),
      profile,
      accountStatus: "ACTIVE"
    });

    return stripSensitiveUserFields(user);
  },

  // ---------------------------------------------------------
  // UPDATE USER
  // ---------------------------------------------------------
  async updateUser(userId, data) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    if (isKeycloakUser(user)) {
      throw new AppError("Keycloak users cannot be edited locally", 400);
    }

    const update = {};

    if (data.profile) update.profile = data.profile;

    if (data.roles) {
      const roleDocs = await roleRepository.findByNames(data.roles);
      update.roles = roleDocs.map(r => r._id);
    }

    const updated = await userRepository.updateById(userId, update);
    return stripSensitiveUserFields(updated);
  },

  // ---------------------------------------------------------
  // UPDATE USER STATUS (SUSPEND / ACTIVATE)
  // ---------------------------------------------------------
  async updateUserStatus(targetUserId, newStatus, actingUser) {
    const user = await userRepository.findById(targetUserId);
    if (!user) throw new AppError("User not found", 404);

    // 1. Cannot modify Keycloak users
    if (isKeycloakUser(user)) {
      throw new AppError("Keycloak users cannot be suspended or activated", 400);
    }

    // 2. Cannot suspend yourself
    if (String(actingUser._id) === String(user._id)) {
      throw new AppError("You cannot change your own status", 400);
    }

    // 3. Cannot suspend the last active admin
    if (hasAdminRole(user) && newStatus === "SUSPENDED") {
      const adminCount = await countActiveAdmins();
      if (adminCount <= 1) {
        throw new AppError("Cannot suspend the last active admin", 400);
      }
    }

    // 4. No-op protection
    if (user.accountStatus === newStatus) {
      throw new AppError(`User is already ${newStatus}`, 400);
    }

    const updated = await userRepository.updateById(targetUserId, {
      accountStatus: newStatus
    });

    return stripSensitiveUserFields(updated);
  }
};
