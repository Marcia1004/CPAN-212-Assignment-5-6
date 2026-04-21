import { userAdminService } from "../services/userAdminService.js";
import { successResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";

export const userAdminController = {

  // ---------------------------------------------------------
  // LIST USERS (with optional filters)
  // ---------------------------------------------------------
  async listUsers(req, res, next) {
    try {
      const filters = {
        role: req.query.role || null,
        status: req.query.status || null
      };

      const data = await userAdminService.listUsers(filters);
      return successResponse(res, data, "Users loaded");
    } catch (error) {
      next(error);
    }
  },

  // ---------------------------------------------------------
  // LIST CUSTOMERS
  // ---------------------------------------------------------
  async listCustomers(req, res, next) {
    try {
      const data = await userAdminService.listCustomers();
      return successResponse(res, data, "Customers loaded");
    } catch (error) {
      next(error);
    }
  },

  // ---------------------------------------------------------
  // GET USER BY ID
  // ---------------------------------------------------------
  async getUserById(req, res, next) {
    try {
      const data = await userAdminService.getUserById(req.params.userId);
      return successResponse(res, data, "User loaded");
    } catch (error) {
      next(error);
    }
  },

  // ---------------------------------------------------------
  // CREATE USER
  // ---------------------------------------------------------
  async createUser(req, res, next) {
    try {
      const data = await userAdminService.createUser(req.body);
      return successResponse(res, data, "User created");
    } catch (error) {
      next(error);
    }
  },

  // ---------------------------------------------------------
  // UPDATE USER
  // ---------------------------------------------------------
  async updateUser(req, res, next) {
    try {
      const data = await userAdminService.updateUser(req.params.userId, req.body);
      return successResponse(res, data, "User updated");
    } catch (error) {
      next(error);
    }
  },

  // ---------------------------------------------------------
  // UPDATE USER STATUS (SUSPEND / ACTIVATE)
  // ---------------------------------------------------------
  async updateUserStatus(req, res, next) {
    try {
      const data = await userAdminService.updateUserStatus(
        req.params.userId,
        req.body.accountStatus,
        req.user 
      );

      return successResponse(res, data, "User status updated");
    } catch (error) {
      next(error);
    }
  }
};
