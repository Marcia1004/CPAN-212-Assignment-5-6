import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/rbacMiddleware.js";
import { userAdminController } from "../controllers/userAdminController.js";

const router = Router();

// ---------------------------------------------------------
// ADMIN USER MANAGEMENT ROUTES
// ---------------------------------------------------------

// List all users (with optional filters)
router.get(
  "/users",
  authenticate,
  requireAdmin,
  userAdminController.listUsers
);

// List only customers
router.get(
  "/users/customers",
  authenticate,
  requireAdmin,
  userAdminController.listCustomers
);

// Get user by ID
router.get(
  "/users/:userId",
  authenticate,
  requireAdmin,
  userAdminController.getUserById
);

// Create new user
router.post(
  "/users",
  authenticate,
  requireAdmin,
  userAdminController.createUser
);

// Update user (profile, roles)
router.put(
  "/users/:userId",
  authenticate,
  requireAdmin,
  userAdminController.updateUser
);

// Update user status (suspend / activate)
router.put(
  "/users/:userId/status",
  authenticate,
  requireAdmin,
  userAdminController.updateUserStatus
);

export default router;
